import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { Cpu, RefreshCw, Globe, Trash2, Download, Check, AlertCircle } from 'lucide-react'

interface WhisperModel {
  id: string
  name: string
  description: string
  filename: string
  size_mb: number
  download_url: string
  language: string
  can_translate: boolean
  accuracy: number
  speed: number
  recommended: boolean
  runtime: string
}

interface DLProgress {
  filename: string
  progress: number
  downloaded_mb: number
  total_mb: number
  done: boolean
  error: string | null
}

const BarMeter = ({ value, active }: { value: number; active: boolean }) => (
  <div style={{ width: 64, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
    <div style={{ width: `${value}%`, height: '100%', background: active ? 'var(--primary)' : 'var(--text-muted)', borderRadius: 2 }} />
  </div>
)

function ModelCard({
  model,
  selected,
  downloaded,
  dlProgress,
  downloading,
  onDownload,
  onSelect,
  onDelete,
  loading,
}: {
  model: WhisperModel
  selected: boolean
  downloaded: boolean
  dlProgress: DLProgress | null
  downloading: boolean
  onDownload: () => void
  onSelect: () => void
  onDelete?: () => void
  loading: boolean
}) {
  const size = model.size_mb >= 1000 ? `${(model.size_mb / 1000).toFixed(1)} GB` : `${model.size_mb} MB`
  const selectable = downloaded && (model.runtime === 'whisper.cpp' || model.runtime === 'sherpa-onnx')
  const isStreaming =
    model.name.includes('Nemotron') ||
    model.name.includes('Streaming') ||
    model.name.includes('Parakeet') ||
    model.name.includes('Moonshine') ||
    model.runtime === 'sherpa-onnx'

  return (
    <div
      onClick={selectable ? onSelect : undefined}
      style={{
        padding: '14px 16px',
        borderRadius: 10,
        position: 'relative',
        overflow: 'hidden',
        border: `1.5px solid ${selected && downloaded ? 'var(--primary)' : 'var(--border)'}`,
        background: selected && downloaded ? 'color-mix(in oklab, var(--primary) 10%, var(--surface))' : 'var(--surface)',
        boxShadow: selected && downloaded ? '0 0 0 1px var(--primary)' : 'none',
        cursor: selectable ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Download progress bar */}
      {downloading && dlProgress && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            height: 2,
            width: `${dlProgress.progress}%`,
            background: 'var(--primary)',
            transition: 'width 0.2s ease',
          }}
        />
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: selected && downloaded ? 'var(--primary)' : 'var(--border)',
            flexShrink: 0,
            marginTop: 4,
            transition: 'background 0.15s',
          }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{model.name}</span>
            {selected && downloaded && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  background: 'var(--primary)',
                  color: 'var(--primary-fg)',
                  padding: '1px 8px',
                  borderRadius: 99,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Check size={11} strokeWidth={2.5} /> Active
              </span>
            )}
            {!selected && model.recommended && (
              <span
                style={{
                  fontSize: 10,
                  background: 'color-mix(in oklab, var(--primary) 16%, var(--surface))',
                  color: 'var(--primary)',
                  padding: '1px 7px',
                  borderRadius: 4,
                }}
              >
                Recommended
              </span>
            )}
            {(model.id === 'hinglish-turbo' || model.id === 'hinglish-small' || model.id === 'hinglish-apex') && (
              <span
                style={{
                  fontSize: 10,
                  background: 'color-mix(in oklab, var(--primary) 14%, var(--surface))',
                  color: 'var(--primary)',
                  padding: '1px 7px',
                  borderRadius: 4,
                }}
              >
                Hinglish
              </span>
            )}
            {loading && selected && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Loading…</span>}
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 7px', lineHeight: 1.4 }}>
            {model.description}
          </p>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span
              style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                background: 'var(--surface-2)',
                padding: '2px 7px',
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Globe size={11} strokeWidth={2} />
              {model.language}
            </span>
            {isStreaming && (
              <span
                style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  background: 'var(--surface-2)',
                  padding: '2px 7px',
                  borderRadius: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5v14M7 5v14M2 9v6M22 9v6" />
                </svg>
                Streaming
              </span>
            )}
            {model.can_translate && (
              <span
                style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  background: 'var(--surface-2)',
                  padding: '2px 7px',
                  borderRadius: 4,
                }}
              >
                Translate to EN
              </span>
            )}
            {downloaded && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                    <line x1="6" y1="6" x2="6.01" y2="6" />
                    <line x1="6" y1="18" x2="6.01" y2="18" />
                  </svg>
                  {size}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {model.name.includes('Nemotron') ? 'Q8_0' : 'INT8'}
                </span>
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete()
                    }}
                    title="Delete model"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      fontSize: 11,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <Trash2 size={12} strokeWidth={2} />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>

          {dlProgress?.error && (
            <div
              style={{
                fontSize: 11,
                color: '#EF4444',
                marginTop: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <AlertCircle size={12} /> Failed: {dlProgress.error}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 44, textAlign: 'right' }}>accuracy</span>
              <BarMeter value={model.accuracy} active={downloaded} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 44, textAlign: 'right' }}>speed</span>
              <BarMeter value={model.speed} active={downloaded} />
            </div>
          </div>

          {!downloaded &&
            (downloading && dlProgress ? (
              <span style={{ fontSize: 11, color: 'var(--primary)' }}>
                {dlProgress.downloaded_mb}/{dlProgress.total_mb} MB ({dlProgress.progress}%)
              </span>
            ) : dlProgress?.error ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDownload()
                }}
                style={{
                  fontSize: 11,
                  color: '#EF4444',
                  background: 'none',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 6,
                  padding: '3px 8px',
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDownload()
                }}
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  background: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '3px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Download size={11} strokeWidth={2} />
                {size}
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}

export function Models() {
  const [models, setModels] = useState<WhisperModel[]>([])
  const [downloadedFiles, setDownloadedFiles] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState('ggml-base.en.bin')
  const [selectedModelId, setSelectedModelId] = useState('')
  const [loadingModel, setLoadingModel] = useState('')
  const [dlProgress, setDlProgress] = useState<Record<string, DLProgress>>({})
  const [activeDownload, setActiveDownload] = useState<string | null>(null)
  const [langFilter, setLangFilter] = useState<'all' | 'en' | 'multi'>('all')

  const refreshDownloaded = () => invoke<string[]>('get_downloaded_models').then(setDownloadedFiles)

  useEffect(() => {
    invoke<WhisperModel[]>('get_available_models').then(setModels)
    refreshDownloaded()
    invoke<string | null>('get_setting', { key: 'model' }).then((v) => v && setSelectedModel(v))
    invoke<string | null>('get_setting', { key: 'model_id' }).then((v) => v && setSelectedModelId(v))

    const sub = listen<DLProgress>('model-download-progress', (e) => {
      const p = e.payload
      setDlProgress((prev) => ({ ...prev, [p.filename]: p }))
      if (p.done) {
        setActiveDownload(null)
        refreshDownloaded()
      }
    })
    const subLoading = listen<string>('model-loading', (e) => setLoadingModel(e.payload))
    const subLoaded = listen<string>('model-loaded', () => setLoadingModel(''))
    const subLoadErr = listen<string>('model-load-error', () => setLoadingModel(''))

    return () => {
      sub.then((f) => f())
      subLoading.then((f) => f())
      subLoaded.then((f) => f())
      subLoadErr.then((f) => f())
    }
  }, [])

  const handleDownload = (model: WhisperModel) => {
    if (activeDownload) return
    setActiveDownload(model.filename)
    setDlProgress((p) => ({
      ...p,
      [model.filename]: {
        filename: model.filename,
        progress: 0,
        downloaded_mb: 0,
        total_mb: model.size_mb,
        done: false,
        error: null,
      },
    }))
    invoke('download_model', { filename: model.filename, downloadUrl: model.download_url })
      .catch((e) =>
        setDlProgress((p) => ({
          ...p,
          [model.filename]: { ...p[model.filename], error: String(e), done: true },
        }))
      )
      .finally(() => setActiveDownload(null))
  }

  const handleSelect = async (filename: string, modelId?: string) => {
    setSelectedModel(filename)
    setSelectedModelId(modelId ?? '')
    setLoadingModel(filename)
    invoke('load_model', { filename }).catch((e) => {
      console.error(e)
      setLoadingModel('')
    })
    await Promise.all([
      invoke('set_setting', { key: 'model', value: filename }),
      invoke('set_setting', { key: 'model_id', value: modelId ?? '' }),
    ])
    if (modelId === 'hinglish-turbo' || modelId === 'hinglish-small' || modelId === 'hinglish-apex') {
      invoke('set_language_mode', { mode: 'hinglish' }).catch(console.error)
    }
  }

  const handleDelete = async (filename: string) => {
    try {
      await invoke('delete_model', { filename })
      await refreshDownloaded()
    } catch (e) {
      console.error(e)
    }
  }

  const filteredModels = models.filter((m) => {
    if (langFilter === 'en') return m.language.toLowerCase().includes('en') || m.language.toLowerCase().includes('english')
    if (langFilter === 'multi') return m.language.toLowerCase().includes('multi') || m.language.toLowerCase().includes('28')
    return true
  })

  const downloaded = filteredModels.filter((m) => downloadedFiles.includes(m.filename))
  const available = filteredModels.filter((m) => !downloadedFiles.includes(m.filename))

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, padding: '8px 0 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 650, color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={18} strokeWidth={2} style={{ color: 'var(--primary)' }} />
            Speech Models
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Select your active local speech-to-text model for offline, low-latency dictation and live streaming.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 2,
              gap: 2,
            }}
          >
            {([
              { value: 'all', label: 'All' },
              { value: 'en', label: 'English' },
              { value: 'multi', label: 'Multilingual' },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setLangFilter(opt.value)}
                style={{
                  background: langFilter === opt.value ? 'var(--primary)' : 'transparent',
                  color: langFilter === opt.value ? 'var(--primary-fg)' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: langFilter === opt.value ? 600 : 450,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={refreshDownloaded}
            title="Rescan models"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '5px 10px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <RefreshCw size={12} strokeWidth={2} />
            Rescan
          </button>
        </div>
      </div>

      {/* Downloaded Models */}
      {downloaded.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Downloaded models ({downloaded.length})
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {downloaded.map((m) => (
              <ModelCard
                key={m.id}
                model={m}
                selected={
                  selectedModelId
                    ? selectedModelId === m.id
                    : selectedModel === m.filename && !m.id.startsWith('hinglish')
                }
                downloaded
                loading={loadingModel === m.filename}
                dlProgress={dlProgress[m.filename] ?? null}
                downloading={activeDownload === m.filename}
                onDownload={() => handleDownload(m)}
                onSelect={() => handleSelect(m.filename, m.id)}
                onDelete={() => handleDelete(m.filename)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Available to Download */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Available to download ({available.length})
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {available.map((m) => (
            <ModelCard
              key={m.id}
              model={m}
              selected={false}
              downloaded={false}
              loading={false}
              dlProgress={dlProgress[m.filename] ?? null}
              downloading={activeDownload === m.filename}
              onDownload={() => handleDownload(m)}
              onSelect={() => handleSelect(m.filename, m.id)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
