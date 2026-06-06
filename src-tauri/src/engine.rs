//! In-process speech engine.
//!
//! Instead of spawning a `sherpa-onnx-offline.exe` / `whisper-cli.exe`
//! subprocess on every dictation, we keep the selected model resident in memory
//! and run inference in-process.
//!
//! Only one model is allowed to stay loaded at a time. Switching from Parakeet
//! to Whisper, between Whisper models, or back to Parakeet drops the previous
//! engine before loading the new one so the app does not keep two large speech
//! models in RAM.

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Condvar, Mutex, MutexGuard};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use tauri::{AppHandle, Emitter, Manager};
use transcribe_rs::{
    onnx::{
        parakeet::{ParakeetModel, ParakeetParams, TimestampGranularity},
        Quantization,
    },
};
use whisper_rs::{
    FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters, WhisperState,
};

/// Seconds of inactivity after which the resident model is freed from memory.
/// A value of 0 means "never unload".
const DEFAULT_IDLE_UNLOAD_SECS: u64 = 300;

enum LoadedEngine {
    Whisper(Box<FastWhisperEngine>),
    Parakeet(Box<ParakeetModel>),
}

/// A model held warm in memory.
struct Cached {
    path: String,
    last_used: u64,
    engine: LoadedEngine,
}

struct FastWhisperEngine {
    state: WhisperState,
    _context: WhisperContext,
    is_multilingual: bool,
}

/// Persistent, in-memory speech engine shared across the app via Tauri state.
/// All fields are `Arc` so the struct is cheap to clone into worker threads.
#[derive(Clone)]
pub struct VoiceEngine {
    app: AppHandle,
    cache: Arc<Mutex<Option<Cached>>>,
    selected: Arc<Mutex<Option<String>>>,
    /// Guards model loading so two loads cannot run at once.
    is_loading: Arc<Mutex<bool>>,
    loading_cv: Arc<Condvar>,
    last_activity: Arc<AtomicU64>,
    shutdown: Arc<AtomicBool>,
}

fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

/// The frontend matches model events against the model filename, e.g.
/// "ggml-base.en.bin" or the Parakeet bundle directory name.
fn display_name(model_path: &str) -> String {
    Path::new(model_path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| model_path.to_string())
}

fn whisper_thread_count() -> i32 {
    std::thread::available_parallelism()
        .map(|n| n.get().clamp(1, 4) as i32)
        .unwrap_or(4)
}

impl FastWhisperEngine {
    fn load(model_path: &Path) -> Result<Self, String> {
        let model_path = model_path
            .to_str()
            .ok_or_else(|| "Whisper model path is not valid UTF-8.".to_string())?;

        let mut context_params = WhisperContextParameters::default();
        context_params.flash_attn = cfg!(feature = "whisper-vulkan");

        let context = WhisperContext::new_with_params(model_path, context_params)
            .map_err(|e| format!("Whisper load failed: {e}"))?;
        let is_multilingual = context.is_multilingual();
        let state = context
            .create_state()
            .map_err(|e| format!("Whisper state init failed: {e}"))?;

        Ok(Self {
            state,
            _context: context,
            is_multilingual,
        })
    }

    fn run_full(
        &mut self,
        samples: &[f32],
        language: &str,
        initial_prompt: Option<&str>,
        strategy: SamplingStrategy,
    ) -> Result<String, String> {
        let mut params = FullParams::new(strategy);
        params.set_n_threads(whisper_thread_count());
        params.set_translate(false);
        params.set_no_context(true);
        params.set_no_timestamps(true);
        params.set_print_special(false);
        params.set_print_progress(false);
        params.set_print_realtime(false);
        params.set_print_timestamps(false);
        params.set_suppress_blank(true);
        params.set_suppress_nst(true);
        params.set_no_speech_thold(0.2);

        if self.is_multilingual {
            match language {
                "auto" | "" => params.set_language(None),
                other => params.set_language(Some(other)),
            }
        } else {
            params.set_language(Some("en"));
        }

        let prompt = initial_prompt
            .map(|p| p.replace('\0', " "))
            .filter(|p| !p.trim().is_empty());
        if let Some(prompt) = prompt.as_deref() {
            params.set_initial_prompt(prompt);
        }

        self.state
            .full(params, samples)
            .map_err(|e| format!("Whisper transcription failed: {e}"))?;

        let mut text = String::new();
        for i in 0..self.state.full_n_segments() {
            let segment = self
                .state
                .get_segment(i)
                .ok_or_else(|| format!("Whisper segment {i} out of bounds"))?;
            let segment_text = segment
                .to_str()
                .map_err(|e| format!("Whisper segment text failed: {e}"))?;
            text.push_str(segment_text);
        }

        Ok(text.trim().to_string())
    }

    fn transcribe(
        &mut self,
        samples: &[f32],
        language: &str,
        initial_prompt: Option<&str>,
    ) -> Result<String, String> {
        // transcribe-rs currently hardcodes BeamSearch { beam_size: 3 } for
        // Whisper. The old CLI path used beam/best-of 1, so keep the in-process
        // model but restore fast greedy decoding here.
        let text = self.run_full(
            samples,
            language,
            initial_prompt,
            SamplingStrategy::Greedy { best_of: 1 },
        )?;

        if !text.trim().is_empty() {
            return Ok(text);
        }

        // Some short clips return no segments under greedy decoding even though
        // whisper-cli with a one-wide beam returns text. Retry only on empty
        // output so normal dictations stay on the fast path.
        self.run_full(
            samples,
            language,
            initial_prompt,
            SamplingStrategy::BeamSearch {
                beam_size: 1,
                patience: -1.0,
            },
        )
    }
}

impl VoiceEngine {
    pub fn new(app: AppHandle) -> Self {
        let engine = Self {
            app,
            cache: Arc::new(Mutex::new(None)),
            selected: Arc::new(Mutex::new(None)),
            is_loading: Arc::new(Mutex::new(false)),
            loading_cv: Arc::new(Condvar::new()),
            last_activity: Arc::new(AtomicU64::new(now_secs())),
            shutdown: Arc::new(AtomicBool::new(false)),
        };
        engine.spawn_idle_watcher();
        engine
    }

    fn lock_cache(&self) -> MutexGuard<'_, Option<Cached>> {
        self.cache.lock().unwrap_or_else(|p| p.into_inner())
    }

    fn is_cached(&self, model_path: &str) -> bool {
        self.lock_cache()
            .as_ref()
            .is_some_and(|c| c.path == model_path)
    }

    fn touch(&self) {
        self.last_activity.store(now_secs(), Ordering::Relaxed);
    }

    /// Directories are Parakeet (transcribe-rs ONNX bundle); `.bin` files are
    /// whisper.cpp ggml models.
    fn is_parakeet(path: &Path) -> bool {
        path.is_dir()
    }

    /// Insert a model in the cache, replacing any different resident model.
    fn store(&self, entry: Cached) {
        let selected = self.selected.lock().unwrap().clone();
        if selected.as_deref() != Some(entry.path.as_str()) {
            println!("[engine] dropped stale model after selection changed: {}", entry.path);
            return;
        }

        let mut cache = self.lock_cache();
        if cache
            .as_ref()
            .is_some_and(|resident| resident.path != entry.path)
        {
            if let Some(evicted) = cache.take() {
                println!("[engine] unloaded previous model: {}", evicted.path);
                let _ = self.app.emit("model-unloaded", ());
            }
        }
        *cache = Some(entry);
    }

    fn unload_resident_except(&self, model_path: &str) {
        let mut cache = self.lock_cache();
        if cache
            .as_ref()
            .is_some_and(|resident| resident.path != model_path)
        {
            if let Some(evicted) = cache.take() {
                println!("[engine] unloaded previous model before switch: {}", evicted.path);
                let _ = self.app.emit("model-unloaded", ());
            }
        }
    }

    /// Load a model into the single active slot. Blocking and potentially
    /// several seconds the first time, so callers should run it off the UI
    /// thread. A no-op when the selected model is already resident.
    pub fn load_model(&self, model_path: &str) -> Result<(), String> {
        self.touch();
        *self.selected.lock().unwrap() = Some(model_path.to_string());
        let name = display_name(model_path);

        if self.bump_if_cached(model_path) {
            let _ = self.app.emit("model-loaded", &name);
            return Ok(());
        }

        {
            let mut loading = self.is_loading.lock().unwrap();
            while *loading {
                loading = self.loading_cv.wait(loading).unwrap();
            }
            if self.bump_if_cached(model_path) {
                let _ = self.app.emit("model-loaded", &name);
                return Ok(());
            }
            *loading = true;
        }

        struct LoadingGuard<'a>(&'a VoiceEngine);
        impl Drop for LoadingGuard<'_> {
            fn drop(&mut self) {
                *self.0.is_loading.lock().unwrap() = false;
                self.0.loading_cv.notify_all();
            }
        }
        let _guard = LoadingGuard(self);

        let path = PathBuf::from(model_path);
        if !path.exists() {
            let _ = self.app.emit("model-load-error", &name);
            return Err(format!("Model path does not exist: {}", model_path));
        }

        self.unload_resident_except(model_path);

        let _ = self.app.emit("model-loading", &name);
        let started = std::time::Instant::now();
        let loaded = if Self::is_parakeet(&path) {
            ParakeetModel::load(&path, &Quantization::Int8)
                .map(|m| LoadedEngine::Parakeet(Box::new(m)))
                .map_err(|e| format!("Failed to load Parakeet model: {e}"))
        } else {
            FastWhisperEngine::load(&path)
                .map(|m| LoadedEngine::Whisper(Box::new(m)))
                .map_err(|e| format!("Failed to load Whisper model: {e}"))
        };

        let loaded = match loaded {
            Ok(engine) => engine,
            Err(e) => {
                let _ = self.app.emit("model-load-error", &name);
                return Err(e);
            }
        };

        self.store(Cached {
            path: model_path.to_string(),
            last_used: now_secs(),
            engine: loaded,
        });

        println!(
            "[engine] loaded model in {}ms: {model_path}",
            started.elapsed().as_millis()
        );
        let _ = self.app.emit("model-loaded", &name);
        Ok(())
    }

    /// If the model is cached, refresh its `last_used` and return true.
    fn bump_if_cached(&self, model_path: &str) -> bool {
        let mut cache = self.lock_cache();
        if let Some(c) = cache.as_mut().filter(|c| c.path == model_path) {
            c.last_used = now_secs();
            true
        } else {
            false
        }
    }

    /// Run transcription against the model at `model_path`. `language` is the
    /// same flag the old subprocess path used ("auto", "en", "hi", ...). For
    /// Parakeet (multilingual, auto-detecting) the language flag is ignored.
    pub fn transcribe(
        &self,
        model_path: &str,
        samples: Vec<f32>,
        language: &str,
        initial_prompt: Option<String>,
    ) -> Result<String, String> {
        self.touch();
        *self.selected.lock().unwrap() = Some(model_path.to_string());
        if samples.is_empty() {
            return Ok(String::new());
        }

        if !self.is_cached(model_path) {
            self.load_model(model_path)?;
        }

        // Take the engine out of the cache so inference can run without holding
        // the mutex. It is put back unless the underlying engine panics.
        let mut owned = {
            let mut cache = self.lock_cache();
            match cache.take() {
                Some(cached) if cached.path == model_path => cached,
                Some(cached) => {
                    *cache = Some(cached);
                    return Err("A different model is loaded for transcription.".into());
                }
                None => return Err("Model is not loaded for transcription.".into()),
            }
        };

        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            match &mut owned.engine {
                LoadedEngine::Whisper(engine) => engine.transcribe(
                    &samples,
                    language,
                    initial_prompt.as_deref().filter(|s| !s.trim().is_empty()),
                ),
                LoadedEngine::Parakeet(engine) => {
                    let params = ParakeetParams {
                        timestamp_granularity: Some(TimestampGranularity::Segment),
                        ..Default::default()
                    };
                    engine
                        .transcribe_with(&samples, &params)
                        .map(|r| r.text)
                        .map_err(|e| format!("Parakeet transcription failed: {e}"))
                }
            }
        }));

        self.touch();

        match result {
            Ok(Ok(text)) => {
                owned.last_used = now_secs();
                self.store(owned);
                Ok(text.trim().to_string())
            }
            Ok(Err(e)) => {
                owned.last_used = now_secs();
                self.store(owned);
                Err(e)
            }
            Err(_) => {
                let _ = self.app.emit("model-unloaded", ());
                Err("Transcription engine crashed and was unloaded. Please try again.".to_string())
            }
        }
    }

    /// Free the resident model after the configured idle timeout.
    fn unload_idle(&self) {
        let mut cache = self.lock_cache();
        if let Some(evicted) = cache.take() {
            println!("[engine] freed idle model: {}", evicted.path);
            let _ = self.app.emit("model-unloaded", ());
        }
    }

    fn idle_unload_secs(&self) -> u64 {
        crate::db::get_setting("model_unload_timeout".to_string())
            .and_then(|v| v.parse::<u64>().ok())
            .unwrap_or(DEFAULT_IDLE_UNLOAD_SECS)
    }

    fn spawn_idle_watcher(&self) {
        let me = self.clone();
        std::thread::spawn(move || loop {
            std::thread::sleep(Duration::from_secs(10));
            if me.shutdown.load(Ordering::Relaxed) {
                break;
            }
            let limit = me.idle_unload_secs();
            if limit == 0 {
                continue;
            }
            let recording = me
                .app
                .try_state::<crate::AppState>()
                .map(|s| *s.is_recording.lock().unwrap())
                .unwrap_or(false);
            if recording {
                me.touch();
                continue;
            }
            let idle = now_secs().saturating_sub(me.last_activity.load(Ordering::Relaxed));
            if idle >= limit {
                me.unload_idle();
            }
        });
    }
}

/// Configure GPU acceleration once at startup. On Windows we prefer DirectML for
/// the Parakeet ONNX graph; whisper.cpp picks the best backend automatically
/// when the optional `whisper-vulkan` feature is built in. The default build
/// stays CPU-only for Whisper so it does not require the Vulkan SDK.
pub fn apply_accelerators() {
    use transcribe_rs::accel;

    #[cfg(windows)]
    accel::set_ort_accelerator(accel::OrtAccelerator::DirectMl);
    #[cfg(not(windows))]
    accel::set_ort_accelerator(accel::OrtAccelerator::Auto);

    accel::set_whisper_accelerator(accel::WhisperAccelerator::Auto);
}
