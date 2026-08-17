import { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { emit } from '@tauri-apps/api/event'

interface MicrophoneStatus {
  available: boolean
  ready: boolean
  selected_device: string | null
  default_device: string | null
  error: string | null
}

type WidgetStyle = 'pill' | 'circle' | 'invisible'

const WIDGET_STYLE_OPTIONS: { value: WidgetStyle; label: string }[] = [
  { value: 'pill', label: 'Standard Pill' },
  { value: 'circle', label: 'Circular Logo' },
  { value: 'invisible', label: 'Invisible Glass' },
]

function WidgetStylePreview({ style }: { style: WidgetStyle }) {
  const isCircle = style === 'circle'
  const isInvisible = style === 'invisible'
  const width = isCircle ? 32 : 122

  return (
    <div style={{
      height: 58,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      background: isInvisible
        ? 'linear-gradient(135deg, rgba(255,255,255,0.10) 0 25%, transparent 25% 50%, rgba(255,255,255,0.08) 50% 75%, transparent 75%), #202631'
        : 'rgba(0,0,0,0.12)',
      backgroundSize: isInvisible ? '18px 18px' : undefined,
      marginBottom: 10,
      overflow: 'hidden',
    }}>
      <div style={{
        width,
        height: 32,
        borderRadius: 99,
        border: `0.5px solid ${isInvisible ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.14)'}`,
        background: isInvisible
          ? 'linear-gradient(135deg, rgba(255,255,255,0.13), rgba(255,255,255,0.04) 42%, rgba(255,255,255,0.08)), rgba(12,12,12,0.42)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.05) 38%, rgba(255,255,255,0.09)), rgba(13,13,13,0.72)',
        backdropFilter: isInvisible ? 'blur(18px) saturate(150%)' : 'blur(22px) saturate(165%)',
        WebkitBackdropFilter: isInvisible ? 'blur(18px) saturate(150%)' : 'blur(22px) saturate(165%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.34), inset 0 0 16px rgba(255,255,255,0.08)',
        clipPath: 'inset(0 round 999px)',
        isolation: 'isolate',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isCircle ? 0 : 6,
        padding: isCircle ? 0 : '0 10px',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <img src="/logo-prompt.png" alt="" width="16" height="16" style={{ borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
        {!isCircle && (
          <span style={{
            color: isInvisible ? '#F3EEE6' : '#B8B3AA',
            fontSize: 11,
            fontWeight: 550,
            letterSpacing: '0.02em',
            fontFamily: "'Noto Sans',sans-serif",
            textShadow: '0 1px 2px rgba(0,0,0,0.55)',
            whiteSpace: 'nowrap',
          }}>
            MeshUtility
          </span>
        )}
      </div>
    </div>
  )
}

// ─── HotkeyRecorder ────────────────────────────────────────────────────────
function HotkeyRecorder({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [capturing, setCapturing] = useState(false)
  const [error, setError] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault(); e.stopPropagation()
    const parts: string[] = []
    if (e.ctrlKey)  parts.push('Ctrl')
    if (e.altKey)   parts.push('Alt')
    if (e.shiftKey) parts.push('Shift')
    if (e.metaKey)  parts.push('Super')

    const k = e.code.replace('Key','').replace('Digit','')
    const isModifier = ['Control','Alt','Shift','Meta'].includes(e.key)

    if (isModifier) {
      setError('Waiting for a non-modifier key...')
      return
    }

    parts.push(k === 'Space' ? 'Space' : k.length === 1 ? k.toUpperCase() : k)
    const combo = parts.join('+')

    if (parts.length === 1) {
      setError('Please include at least one modifier (e.g. Alt+Space)')
      return
    }

    setError(''); onChange(combo); setCapturing(false);
    (document.activeElement as HTMLElement)?.blur()
  }

  const keys = value.split('+').filter(Boolean)
  return (
    <div>
      <div ref={ref} tabIndex={0}
        onFocus={() => setCapturing(true)} onBlur={() => setCapturing(false)}
        onKeyDown={capturing ? handleKeyDown : undefined}
        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', cursor:'pointer', outline:'none', background: capturing ? 'color-mix(in oklab, var(--primary) 8%, var(--surface))' : 'var(--surface)', border:`1px solid ${capturing ? 'var(--primary)' : 'var(--border)'}`, borderRadius:10, transition:'all 0.15s' }}>
        <div style={{ display:'flex', gap:6 }}>
          {keys.map((k,i) => (
            <span key={i} style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:5, padding:'3px 9px', fontSize:12, fontFamily:"'JetBrains Mono',monospace", color:'var(--text)' }}>{k}</span>
          ))}
        </div>
        <span style={{ fontSize:11, color:'var(--text-muted)' }}>{capturing ? 'Press keys…' : 'Click to change'}</span>
      </div>
      {error && <p style={{ color:'#EF4444', fontSize:11, marginTop:5 }}>{error}</p>}
      <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:5 }}>Recommended: Alt+Space or Ctrl+Shift+Space. Applies immediately.</p>
    </div>
  )
}

// ─── Settings ───────────────────────────────────────────────────────────────
export function Settings() {
  const [hotkey, setHotkey] = useState('Alt+Space')
  const [mode, setMode] = useState<'push-to-talk'|'toggle'>('push-to-talk')
  const [sensitivity, setSensitivity] = useState(0.7)
  const [apiKey, setApiKey] = useState('')
  const [mics, setMics] = useState<string[]>([])
  const [selectedMic, setSelectedMic] = useState<string>('')
  const [micStatus, setMicStatus] = useState<MicrophoneStatus | null>(null)
  const [memoryWorkspacePath, setMemoryWorkspacePath] = useState('')
  const [widgetEnabled, setWidgetEnabled] = useState(true)
  const [widgetStyle, setWidgetStyle] = useState<WidgetStyle>('pill')
  const [saved, setSaved] = useState(false)

  const refreshMicStatus = () =>
    invoke<MicrophoneStatus>('check_microphone_status')
      .then(setMicStatus)
      .catch(e => setMicStatus({ available:false, ready:false, selected_device:null, default_device:null, error:String(e) }))

  useEffect(() => {
    invoke<string[]>('get_audio_devices').then(setMics).catch(console.error)
    refreshMicStatus()
    invoke<string|null>('get_setting', { key:'microphone' }).then(v => { if (v) setSelectedMic(v) })
    invoke<string|null>('get_setting', { key:'hotkey' }).then(v => v && setHotkey(v))
    invoke<string|null>('get_setting', { key:'mode'   }).then(v => {
      if (v === 'push-to-talk' || v === 'toggle') setMode(v)
    })
    invoke<string|null>('get_setting', { key:'sensitivity' }).then(v => v && setSensitivity(+v))
    invoke<string|null>('get_setting', { key:'api_key' }).then(v => v && setApiKey(v))
    invoke<string|null>('get_setting', { key:'memory_workspace_path' }).then(v => v && setMemoryWorkspacePath(v))
    invoke<string|null>('get_setting', { key:'widget_enabled' }).then(v => {
      setWidgetEnabled(v == null || (v !== 'false' && v !== '0'))
    })
    invoke<string|null>('get_setting', { key:'widget_style' }).then(v => {
      if (v === 'pill' || v === 'circle' || v === 'invisible') setWidgetStyle(v)
    })
  }, [])

  const save = async () => {
    await Promise.all([
      invoke('set_setting', { key:'hotkey', value: hotkey }),
      invoke('set_recording_mode', { mode }),
      invoke('set_setting', { key:'sensitivity', value: String(sensitivity) }),
      invoke('set_setting', { key:'api_key', value: apiKey }),
      invoke('set_setting', { key:'memory_workspace_path', value: memoryWorkspacePath }),
      invoke('set_widget_enabled', { enabled: widgetEnabled }),
      invoke('set_setting', { key:'widget_style', value: widgetStyle }),
      invoke('reregister_hotkey', { newHotkey: hotkey }).catch(() => {}),
    ])
    setSaved(true); setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'24px 32px 48px', display:'flex', flexDirection:'column', gap:28 }}>
      <h2 style={{ fontFamily:"'Instrument Serif',serif", fontSize:24, fontWeight:400, color:'var(--text)', margin:0 }}>Settings</h2>

      {/* Recording mode */}
      <section style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <label style={{ fontSize:11, fontWeight:500, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Recording mode</label>
        <div style={{ display:'flex', gap:10 }}>
          {([{ value:'push-to-talk', label:'Push to Talk', desc:'Hold hotkey to record' }, { value:'toggle', label:'Toggle', desc:'Press once to start/stop' }] as const).map(opt => (
            <button key={opt.value} onClick={() => {
              setMode(opt.value)
              invoke('set_recording_mode', { mode: opt.value }).catch(console.error)
            }} style={{ flex:1, padding:'14px 16px', borderRadius:10, textAlign:'left', cursor:'pointer', transition:'all 0.15s', background: mode===opt.value ? 'color-mix(in oklab, var(--primary) 12%, var(--surface))' : 'var(--surface)', border:`1.5px solid ${mode===opt.value ? 'var(--primary)' : 'var(--border)'}`, boxShadow: mode===opt.value ? '0 0 0 1px var(--primary)' : 'none', fontFamily:"'Noto Sans',sans-serif" }}>
              <div style={{ fontSize:13, fontWeight:600, color: mode===opt.value ? 'var(--primary)' : 'var(--text)', marginBottom:3, transition:'color 0.15s' }}>{opt.label}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Hotkey */}
      <section style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <label style={{ fontSize:11, fontWeight:500, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Global hotkey</label>
        <HotkeyRecorder value={hotkey} onChange={(combo) => {
          invoke('reregister_hotkey', { newHotkey: combo })
            .then(() => {
              setHotkey(combo);
              invoke('set_setting', { key:'hotkey', value: combo }).catch(console.error);
            })
            .catch(e => {
              alert(`Could not register hotkey ${combo}. It might be reserved by another app (e.g. PowerToys uses Alt+Space). Error: ${e}`);
            });
        }} />
      </section>

      {/* Widget Visibility */}
      <section style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <label style={{ fontSize:11, fontWeight:500, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Widget Visibility</label>
        <button
          type="button"
          role="switch"
          aria-checked={widgetEnabled}
          onClick={async () => {
            const next = !widgetEnabled
            setWidgetEnabled(next)
            try {
              await invoke('set_widget_enabled', { enabled: next })
            } catch (e) {
              setWidgetEnabled(!next)
              console.error(e)
            }
          }}
          style={{
            display:'flex',
            alignItems:'center',
            justifyContent:'space-between',
            gap:16,
            padding:'14px 16px',
            borderRadius:10,
            textAlign:'left',
            cursor:'pointer',
            transition:'all 0.15s',
            background: widgetEnabled ? 'color-mix(in oklab, var(--primary) 12%, var(--surface))' : 'var(--surface)',
            border:`1.5px solid ${widgetEnabled ? 'var(--primary)' : 'var(--border)'}`,
            boxShadow: widgetEnabled ? '0 0 0 1px var(--primary)' : 'none',
            fontFamily:"'Noto Sans',sans-serif",
          }}
        >
          <div>
            <div style={{ fontSize:13, fontWeight:600, color: widgetEnabled ? 'var(--primary)' : 'var(--text)', marginBottom:3, transition:'color 0.15s' }}>
              {widgetEnabled ? 'Always visible' : 'Show only while recording'}
            </div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>
              {widgetEnabled ? 'The idle widget stays on screen.' : 'The widget appears for hotkey recording and hides when finished.'}
            </div>
          </div>
          <span style={{
            width:38,
            height:22,
            borderRadius:99,
            padding:2,
            background: widgetEnabled ? 'var(--primary)' : 'var(--surface-2)',
            border:`1px solid ${widgetEnabled ? 'var(--primary)' : 'var(--border)'}`,
            display:'flex',
            alignItems:'center',
            justifyContent: widgetEnabled ? 'flex-end' : 'flex-start',
            flexShrink:0,
            transition:'all 0.15s',
          }}>
            <span style={{
              width:16,
              height:16,
              borderRadius:'50%',
              background: widgetEnabled ? '#0D0D0D' : 'var(--text-muted)',
              transition:'all 0.15s',
            }} />
          </span>
        </button>
      </section>

      {/* Widget Style */}
      <section style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <label style={{ fontSize:11, fontWeight:500, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Widget Style</label>
        <div style={{ display:'flex', gap:10 }}>
          {WIDGET_STYLE_OPTIONS.map(opt => (
            <button key={opt.value} onClick={async () => {
              setWidgetStyle(opt.value)
              await invoke('set_setting', { key: 'widget_style', value: opt.value })
              await emit('widget-style-changed', opt.value).catch(console.error)
            }} type="button" aria-pressed={widgetStyle === opt.value} style={{ flex:1, padding:'12px', borderRadius:10, textAlign:'left', cursor:'pointer', transition:'all 0.15s', background: widgetStyle===opt.value ? 'color-mix(in oklab, var(--primary) 12%, var(--surface))' : 'var(--surface)', border:`1.5px solid ${widgetStyle===opt.value ? 'var(--primary)' : 'var(--border)'}`, boxShadow: widgetStyle===opt.value ? '0 0 0 1px var(--primary)' : 'none', fontFamily:"'Noto Sans',sans-serif" }}>
              <WidgetStylePreview style={opt.value} />
              <div style={{ fontSize:13, fontWeight:600, color: widgetStyle===opt.value ? 'var(--primary)' : 'var(--text)', textAlign:'center', transition:'color 0.15s' }}>{opt.label}</div>
            </button>
          ))}
        </div>
      </section>



      {/* Microphone */}
      <section style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <label style={{ fontSize:11, fontWeight:500, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Microphone</label>
        <select value={selectedMic} onChange={e => {
          setSelectedMic(e.target.value)
          invoke('set_setting', { key:'microphone', value: e.target.value })
            .then(refreshMicStatus)
            .catch(console.error)
        }} style={{ width:'100%', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px', color:'var(--text)', fontSize:13, fontFamily:"'Noto Sans',sans-serif", outline:'none', cursor:'pointer' }}>
          <option value="">System Default</option>
          {mics.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 12px' }}>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:12, color: micStatus?.ready ? '#4ADE80' : '#EF4444', marginBottom:3 }}>
              {micStatus?.ready ? 'Microphone ready' : 'Microphone needs attention'}
            </div>
            <div style={{ fontSize:11, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {micStatus?.ready
                ? (micStatus.selected_device ?? micStatus.default_device ?? 'System default')
                : (micStatus?.error ?? 'Run a microphone check.')}
            </div>
          </div>
          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
            <button onClick={refreshMicStatus} style={{ fontSize:11, color:'var(--text-muted)', background:'none', border:'1px solid var(--border)', borderRadius:6, padding:'4px 8px', cursor:'pointer' }}>Check</button>
            <button onClick={() => invoke('open_mic_settings').catch(console.error)} style={{ fontSize:11, color:'var(--text)', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:6, padding:'4px 8px', cursor:'pointer' }}>Windows Settings</button>
          </div>
        </div>
      </section>

      {/* Sensitivity */}
      <section style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <label style={{ fontSize:11, fontWeight:500, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Mic sensitivity — {Math.round(sensitivity*100)}%</label>
        <input type="range" min="0" max="1" step="0.05" value={sensitivity} onChange={e=>setSensitivity(+e.target.value)} style={{ width:'100%', accentColor:'var(--primary)', cursor:'pointer' }} />
      </section>

      {/* AI Credentials info card */}
      <section style={{ display:'flex', flexDirection:'column', gap:8, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>AI Providers & Cloud Credentials</div>
          <span style={{ fontSize:11, color:'#10b981', background:'rgba(16,185,129,0.1)', padding:'2px 8px', borderRadius:5 }}>Unified Engine</span>
        </div>
        <p style={{ fontSize:12, color:'var(--text-muted)', margin:0, lineHeight:1.45 }}>
          Cloud dictation mode, Prompt Enhancer, and quick Polish actions automatically use the API keys configured in <strong>AI Providers & Models</strong>.
        </p>
      </section>

      <button onClick={save} style={{ width:'100%', padding:'13px 0', borderRadius:10, fontSize:13, fontWeight:500, cursor:'pointer', transition:'all 0.15s', border:'none', fontFamily:"'Noto Sans',sans-serif", background: saved ? 'rgba(74,222,128,0.12)' : 'var(--primary)', color: saved ? '#4ADE80' : 'var(--primary-fg)' }}>
        {saved ? 'Saved' : 'Save settings'}
      </button>
    </div>
  )
}
