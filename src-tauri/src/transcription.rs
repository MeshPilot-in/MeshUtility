use serde::Serialize;
use tauri::Emitter;

const PARAKEET_BUNDLE_ID: &str = "sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8";
/// Parakeet V3, exported in the layout the in-process `transcribe-rs` engine
/// expects (encoder-model / decoder_joint-model / nemo128 / vocab), shipped as a
/// single .tar.gz. This is a different export than the old sherpa-onnx CLI files.
const PARAKEET_BUNDLE_URL: &str = "https://blob.handy.computer/parakeet-v3-int8.tar.gz";
/// Compressed archive size, used only to render a sensible progress bar.
const PARAKEET_ARCHIVE_BYTES: u64 = 478_517_071;
const MIN_ENCODER_BYTES: u64 = 600_000_000;
const MIN_DECODER_JOINT_BYTES: u64 = 15_000_000;
const MIN_NEMO128_BYTES: u64 = 100_000;
const MIN_VOCAB_BYTES: u64 = 80_000;

#[derive(Serialize, Clone)]
pub struct WhisperModel {
    pub id: String,
    pub name: String,
    pub description: String,
    pub filename: String,
    pub size_mb: i64,
    pub download_url: String,
    pub language: String,
    pub can_translate: bool,
    pub accuracy: u8,
    pub speed: u8,
    pub recommended: bool,
    pub runtime: String,
}

#[tauri::command]
pub fn get_available_models() -> Vec<WhisperModel> {
    let hf = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main";
    vec![
        WhisperModel { id: "parakeet-v3".into(), name: "Parakeet V3".into(), description: "Recommended Parakeet V3 runtime bundle using sherpa-onnx INT8 for local Windows transcription.".into(), filename: PARAKEET_BUNDLE_ID.into(), size_mb: 640, download_url: "meshvoice://parakeet-v3".into(), language: "25 languages".into(), can_translate: false, accuracy: 96, speed: 92, recommended: true, runtime: "sherpa-onnx".into() },
        WhisperModel { id: "tiny".into(),   name: "Whisper Tiny".into(),     description: "Ultra-fast, basic accuracy.".into(),               filename: "ggml-tiny.en.bin".into(),        size_mb: 75,   download_url: format!("{}/ggml-tiny.en.bin", hf),        language: "English".into(),        can_translate: false, accuracy: 40, speed: 98, recommended: false, runtime: "whisper.cpp".into() },
        WhisperModel { id: "base".into(),   name: "Whisper Base".into(),     description: "Fast and fairly accurate. Best starting point.".into(), filename: "ggml-base.en.bin".into(),     size_mb: 142,  download_url: format!("{}/ggml-base.en.bin", hf),       language: "English".into(),        can_translate: false, accuracy: 62, speed: 90, recommended: false, runtime: "whisper.cpp".into() },
        WhisperModel { id: "small".into(),  name: "Whisper Small".into(),    description: "Good balance, multilingual.".into(),                 filename: "ggml-small.bin".into(),          size_mb: 466,  download_url: format!("{}/ggml-small.bin", hf),          language: "Multi-language".into(), can_translate: true,  accuracy: 74, speed: 80, recommended: false, runtime: "whisper.cpp".into() },

        WhisperModel { id: "distil-large".into(), name: "Whisper Distil-Large".into(), description: "Great accuracy with faster inference than Large v3.".into(), filename: "ggml-distil-large-v3.bin".into(), size_mb: 1520, download_url: format!("{}/ggml-distil-large-v3.bin", hf), language: "Multi-language".into(), can_translate: true, accuracy: 90, speed: 72, recommended: false, runtime: "whisper.cpp".into() },
        WhisperModel { id: "turbo".into(),  name: "Whisper Turbo".into(),    description: "Large model distilled for speed.".into(),            filename: "ggml-large-v3-turbo.bin".into(), size_mb: 1500, download_url: format!("{}/ggml-large-v3-turbo.bin", hf), language: "Multi-language".into(), can_translate: true,  accuracy: 88, speed: 70, recommended: false, runtime: "whisper.cpp".into() },
        WhisperModel {
            id: "hinglish-apex".into(),
            name: "Hindi2Hinglish Apex".into(),
            description: "Oriserve's fine-tuned model for transcribing Hindi directly to Romanized Hinglish. Highly accurate for Indian accents.".into(),
            filename: "ggml-hindi2hinglish-apex-q5_1.bin".into(),
            size_mb: 204,
            download_url: "https://huggingface.co/voquill/whisper-hindi2hinglish-apex-ggml/resolve/main/ggml-hindi2hinglish-apex-q5_1.bin".into(),
            language: "Hinglish \u{00b7} Hindi+English".into(),
            can_translate: false,
            accuracy: 85,
            speed: 40,
            recommended: false,
            runtime: "whisper.cpp".into(),
        },


    ]
}

#[derive(Serialize, Clone)]
struct DownloadProgress {
    filename: String,
    progress: u64,
    downloaded_mb: u64,
    total_mb: u64,
    done: bool,
    error: Option<String>,
}

/// Real HTTP download with streaming progress and .part → rename pattern.
#[tauri::command]
pub async fn download_model(
    app: tauri::AppHandle,
    filename: String,
    download_url: String,
) -> Result<(), String> {
    if filename == PARAKEET_BUNDLE_ID {
        return download_parakeet_bundle(app, filename).await;
    }


    use futures_util::StreamExt;
    use tokio::io::AsyncWriteExt;

    let dest = crate::audio::models_dir().join(&filename);

    // Already fully downloaded?
    if let Ok(meta) = std::fs::metadata(&dest) {
        if meta.len() > 1_000_000 {
            let _ = app.emit("model-download-progress", DownloadProgress {
                filename: filename.clone(), progress: 100,
                downloaded_mb: meta.len() / 1_048_576,
                total_mb: meta.len() / 1_048_576,
                done: true, error: None,
            });
            return Ok(());
        }
    }

    let part = dest.with_extension("bin.part");

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(3600))
        .build().map_err(|e| e.to_string())?;

    let resp = client.get(&download_url).send().await
        .map_err(|e| format!("Network error: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("HTTP {}", resp.status()));
    }

    let total = resp.content_length().unwrap_or(0);
    let total_mb = total / 1_048_576;
    let mut downloaded: u64 = 0;
    let mut last_pct: u64 = 0;

    let mut file = tokio::fs::File::create(&part).await
        .map_err(|e| format!("Cannot create file: {}", e))?;

    let mut stream = resp.bytes_stream();
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        file.write_all(&chunk).await.map_err(|e| e.to_string())?;
        downloaded += chunk.len() as u64;

        let pct = if total > 0 { downloaded * 100 / total } else { 0 };
        if pct != last_pct {
            last_pct = pct;
            let _ = app.emit("model-download-progress", DownloadProgress {
                filename: filename.clone(),
                progress: pct,
                downloaded_mb: downloaded / 1_048_576,
                total_mb,
                done: false,
                error: None,
            });
        }
    }

    file.flush().await.map_err(|e| e.to_string())?;
    drop(file);

    tokio::fs::rename(&part, &dest).await
        .map_err(|e| format!("Rename failed: {}", e))?;

    let _ = app.emit("model-download-progress", DownloadProgress {
        filename: filename.clone(),
        progress: 100,
        downloaded_mb: downloaded / 1_048_576,
        total_mb,
        done: true,
        error: None,
    });
    Ok(())
}

pub fn parakeet_bundle_dir() -> std::path::PathBuf {
    crate::audio::models_dir().join(PARAKEET_BUNDLE_ID)
}

pub fn parakeet_bundle_ready() -> bool {
    let dir = parakeet_bundle_dir();
    file_has_min_size(&dir.join("encoder-model.int8.onnx"), MIN_ENCODER_BYTES)
        && file_has_min_size(&dir.join("decoder_joint-model.int8.onnx"), MIN_DECODER_JOINT_BYTES)
        && file_has_min_size(&dir.join("nemo128.onnx"), MIN_NEMO128_BYTES)
        && file_has_min_size(&dir.join("vocab.txt"), MIN_VOCAB_BYTES)
}

/// Download the Parakeet V3 .tar.gz and extract it into the bundle directory in
/// the layout the in-process engine expects. Replaces the old per-file sherpa
/// download. Supports resuming a partial archive download.
async fn download_parakeet_bundle(app: tauri::AppHandle, filename: String) -> Result<(), String> {
    if parakeet_bundle_ready() {
        emit_download_progress_bytes(&app, &filename, PARAKEET_ARCHIVE_BYTES, PARAKEET_ARCHIVE_BYTES, true, None);
        return Ok(());
    }

    let models = crate::audio::models_dir();
    tokio::fs::create_dir_all(&models).await.map_err(|e| e.to_string())?;
    let archive_path = models.join("parakeet-v3-int8.tar.gz.part");

    download_archive(&app, &filename, PARAKEET_BUNDLE_URL, &archive_path).await?;

    // Extraction is CPU/IO heavy (~650 MB) — run it off the async runtime.
    emit_download_progress_bytes(&app, &filename, PARAKEET_ARCHIVE_BYTES, PARAKEET_ARCHIVE_BYTES, false, None);
    let model_dir = parakeet_bundle_dir();
    let archive_for_extract = archive_path.clone();
    let extract_dir = model_dir.clone();
    tokio::task::spawn_blocking(move || extract_parakeet_bundle(&archive_for_extract, &extract_dir))
        .await
        .map_err(|e| format!("Extraction task failed: {e}"))??;

    let _ = tokio::fs::remove_file(&archive_path).await;

    if !parakeet_bundle_ready() {
        return Err("Parakeet bundle extracted but required files are missing. Retry from Settings.".into());
    }

    emit_download_progress_bytes(&app, &filename, PARAKEET_ARCHIVE_BYTES, PARAKEET_ARCHIVE_BYTES, true, None);
    Ok(())
}

/// Stream a (resumable) download of a single archive file to `dest`, emitting
/// progress against the known compressed size.
async fn download_archive(
    app: &tauri::AppHandle,
    filename: &str,
    url: &str,
    dest: &std::path::Path,
) -> Result<(), String> {
    use futures_util::StreamExt;
    use tokio::io::AsyncWriteExt;

    let resume_from = std::fs::metadata(dest).map(|m| m.len()).unwrap_or(0);

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(3600))
        .build()
        .map_err(|e| e.to_string())?;
    let mut req = client.get(url);
    if resume_from > 0 {
        req = req.header(reqwest::header::RANGE, format!("bytes={}-", resume_from));
    }
    let resp = req.send().await.map_err(|e| format!("Network error: {}", e))?;
    if !resp.status().is_success() {
        return Err(format!("HTTP {} while downloading Parakeet bundle", resp.status()));
    }
    let server_resumed = resume_from > 0 && resp.status() == reqwest::StatusCode::PARTIAL_CONTENT;
    let resume_from = if resume_from > 0 && !server_resumed {
        let _ = tokio::fs::remove_file(dest).await;
        0
    } else {
        resume_from
    };

    let total = resp
        .content_length()
        .map(|remaining| resume_from.saturating_add(remaining))
        .unwrap_or(PARAKEET_ARCHIVE_BYTES)
        .max(1);
    let mut downloaded = resume_from;
    let mut last_pct = 0_u64;
    let mut file = if resume_from > 0 {
        tokio::fs::OpenOptions::new().append(true).open(dest).await
    } else {
        tokio::fs::File::create(dest).await
    }
    .map_err(|e| format!("Cannot create file: {}", e))?;

    let mut stream = resp.bytes_stream();
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        file.write_all(&chunk).await.map_err(|e| e.to_string())?;
        downloaded += chunk.len() as u64;
        let pct = downloaded.saturating_mul(100).saturating_div(total).min(99);
        if pct != last_pct {
            last_pct = pct;
            emit_download_progress_bytes(app, filename, downloaded.min(total), total, false, None);
        }
    }
    file.flush().await.map_err(|e| e.to_string())?;
    Ok(())
}

/// Extract the required Parakeet files from the archive into `dest_dir`, flat.
/// The archive nests files under a top-level directory and includes macOS
/// AppleDouble (`._*`) sidecar files which we skip.
fn extract_parakeet_bundle(archive: &std::path::Path, dest_dir: &std::path::Path) -> Result<(), String> {
    use flate2::read::GzDecoder;
    use tar::Archive;

    let parent = dest_dir.parent().unwrap_or(std::path::Path::new("."));
    let tmp = parent.join("parakeet-v3-extract.tmp");
    if tmp.exists() {
        let _ = std::fs::remove_dir_all(&tmp);
    }
    std::fs::create_dir_all(&tmp).map_err(|e| format!("Cannot create temp dir: {e}"))?;

    let file = std::fs::File::open(archive).map_err(|e| format!("Cannot open archive: {e}"))?;
    let mut ar = Archive::new(GzDecoder::new(file));
    ar.unpack(&tmp).map_err(|e| {
        let _ = std::fs::remove_dir_all(&tmp);
        format!("Failed to extract Parakeet archive: {e}")
    })?;

    // Replace any previous (possibly old-format) bundle dir.
    if dest_dir.exists() {
        let _ = std::fs::remove_dir_all(dest_dir);
    }
    std::fs::create_dir_all(dest_dir).map_err(|e| format!("Cannot create model dir: {e}"))?;

    const REQUIRED: [&str; 5] = [
        "encoder-model.int8.onnx",
        "decoder_joint-model.int8.onnx",
        "nemo128.onnx",
        "vocab.txt",
        "config.json",
    ];
    copy_required_files(&tmp, dest_dir, &REQUIRED)?;
    let _ = std::fs::remove_dir_all(&tmp);
    Ok(())
}

/// Recursively walk `src`, copying any file whose name is in `required` into
/// `dest` (flat). Skips macOS `._*` AppleDouble sidecars.
fn copy_required_files(src: &std::path::Path, dest: &std::path::Path, required: &[&str]) -> Result<(), String> {
    let entries = std::fs::read_dir(src).map_err(|e| format!("Cannot read extracted dir: {e}"))?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            copy_required_files(&path, dest, required)?;
            continue;
        }
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with("._") {
            continue;
        }
        if required.contains(&name.as_str()) {
            std::fs::copy(&path, dest.join(&name)).map_err(|e| format!("Failed to place {name}: {e}"))?;
        }
    }
    Ok(())
}

fn file_has_min_size(path: &std::path::Path, min_bytes: u64) -> bool {
    std::fs::metadata(path).map(|m| m.len() >= min_bytes).unwrap_or(false)
}

fn emit_download_progress_bytes(
    app: &tauri::AppHandle,
    filename: &str,
    downloaded_bytes: u64,
    total_bytes: u64,
    done: bool,
    error: Option<String>,
) {
    let total_mb = total_bytes.div_ceil(1_048_576);
    let downloaded_mb = downloaded_bytes.div_ceil(1_048_576).min(total_mb);
    let progress = if done { 100 } else { downloaded_bytes.saturating_mul(100).saturating_div(total_bytes).min(99) };
    emit_download_progress(app, filename, progress, downloaded_mb, total_mb, done, error);
}

fn emit_download_progress(
    app: &tauri::AppHandle,
    filename: &str,
    progress: u64,
    downloaded_mb: u64,
    total_mb: u64,
    done: bool,
    error: Option<String>,
) {
    let _ = app.emit("model-download-progress", DownloadProgress {
        filename: filename.to_string(),
        progress,
        downloaded_mb,
        total_mb,
        done,
        error,
    });
}

/// Groq Whisper API — used when no local model is loaded.
pub async fn transcribe_via_groq(samples: &[f32], api_key: &str) -> Result<String, String> {
    let form = groq_audio_form(samples, "text")?;

    let resp = reqwest::Client::new()
        .post("https://api.groq.com/openai/v1/audio/transcriptions")
        .bearer_auth(api_key)
        .multipart(form)
        .send().await.map_err(|e| e.to_string())?;

    let status = resp.status();
    let body = resp.text().await.map_err(|e| e.to_string())?;
    if status.is_success() { Ok(body.trim().to_string()) }
    else { Err(format!("Groq error {}: {}", status, body)) }
}

pub async fn transcribe_via_meshpilot_cloud(samples: &[f32], access_token: &str) -> Result<String, String> {
    let form = groq_audio_form(samples, "json")?;

    let resp = reqwest::Client::new()
        .post("https://meshpilot.in/api/meshvoice/transcribe")
        .bearer_auth(access_token)
        .multipart(form)
        .send()
        .await
        .map_err(|e| format!("MeshPilot cloud transcription network error: {e}"))?;

    let status = resp.status();
    let body = resp.text().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
        return Err(format!("MeshPilot cloud transcription failed ({status}): {}", truncate_error(&body)));
    }

    parse_cloud_transcript(&body)
        .ok_or_else(|| "MeshPilot cloud transcription returned an empty transcript.".to_string())
}

fn groq_audio_form(samples: &[f32], response_format: &'static str) -> Result<reqwest::multipart::Form, String> {
    let bytes = wav_bytes(samples);
    let part = reqwest::multipart::Part::bytes(bytes)
        .file_name("audio.wav")
        .mime_str("audio/wav")
        .map_err(|e| e.to_string())?;
    Ok(reqwest::multipart::Form::new()
        .text("model", "whisper-large-v3")
        .text("response_format", response_format)
        .part("file", part))
}

fn wav_bytes(samples: &[f32]) -> Vec<u8> {
    let data_size = (samples.len() * 2) as u32;
    let mut bytes = Vec::with_capacity(44 + samples.len() * 2);
    bytes.extend_from_slice(b"RIFF");
    bytes.extend_from_slice(&(36 + data_size).to_le_bytes());
    bytes.extend_from_slice(b"WAVEfmt ");
    bytes.extend_from_slice(&16u32.to_le_bytes());
    bytes.extend_from_slice(&1u16.to_le_bytes());
    bytes.extend_from_slice(&1u16.to_le_bytes());
    bytes.extend_from_slice(&16000u32.to_le_bytes());
    bytes.extend_from_slice(&32000u32.to_le_bytes());
    bytes.extend_from_slice(&2u16.to_le_bytes());
    bytes.extend_from_slice(&16u16.to_le_bytes());
    bytes.extend_from_slice(b"data");
    bytes.extend_from_slice(&data_size.to_le_bytes());
    for &sample in samples {
        bytes.extend_from_slice(&((sample.clamp(-1.0, 1.0) * 32767.0) as i16).to_le_bytes());
    }
    bytes
}

fn parse_cloud_transcript(body: &str) -> Option<String> {
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(body) {
        if let Some(text) = json.get("text").and_then(|value| value.as_str()) {
            let trimmed = text.trim();
            return (!trimmed.is_empty()).then(|| trimmed.to_string());
        }
    }
    let trimmed = body.trim();
    (!trimmed.is_empty()).then(|| trimmed.to_string())
}

fn truncate_error(body: &str) -> String {
    let normalized = body.split_whitespace().collect::<Vec<_>>().join(" ");
    if normalized.chars().count() <= 300 {
        return normalized;
    }
    let mut out = normalized.chars().take(300).collect::<String>();
    out.push_str("...");
    out
}


