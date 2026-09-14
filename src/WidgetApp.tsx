/**
 * WidgetApp — always-on-top floating pill/circle window.
 * Features: first-run mic permission gate, Fix It button on mic errors, draggable, no shadow.
 */

import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from 'react'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useAppStore } from './store/appStore'
import { builtInPromptActions, buildPromptActionRequest } from './lib'

type PillState = 'idle' | 'listening' | 'processing' | 'done' | 'error' | 'mic-prompt' | 'enhancing'
type WidgetStyle = 'pill' | 'circle' | 'invisible'


const BORDER: Record<PillState, string> = {
  idle:         'rgba(255,255,255,0.14)',
  listening:    'rgba(242,106,75,0.72)',
  processing:   'rgba(209,207,192,0.52)',
  done:         'rgba(74,222,128,0.62)',
  error:        'rgba(239,68,68,0.70)',
  'mic-prompt': 'rgba(242,106,75,0.70)',
  enhancing:    'rgba(168,85,247,0.55)',
}

const COLOR: Record<PillState, string> = {
  idle:         '#8E8A83',
  listening:    '#F26A4B',
  processing:   '#D1CFC0',
  done:         '#4ADE80',
  error:        '#EF4444',
  'mic-prompt': '#F26A4B',
  enhancing:    '#A855F7',
}

interface MicrophoneStatus {
  available: boolean
  ready: boolean
  selected_device: string | null
  default_device: string | null
  error: string | null
}

// Minimal shape of the enhancer settings the widget needs for streaming.
interface AppSettingsLike {
  provider?: { provider?: string; model?: string }
  temperature?: number
  maxOutputTokens?: number
  enhancePromptMode?: string
}

function isMicError(msg: string) {
  return msg.toLowerCase().includes('mic') ||
         msg.toLowerCase().includes('microphone') ||
         msg.toLowerCase().includes('stream') ||
         msg.toLowerCase().includes('audio') ||
         msg.toLowerCase().includes('permission') ||
         msg.toLowerCase().includes('blocked') ||
         msg.toLowerCase().includes('privacy')
}

function isTransientWidgetState(state: PillState) {
  return state === 'listening' || state === 'processing' || state === 'done'
}

export default function WidgetApp() {
  const [pillState, setPillState] = useState<PillState>('idle')
  const [contentVisible, setContentVisible] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [errorIsMic, setErrorIsMic] = useState(false)
  const [micDetail, setMicDetail] = useState('Checking microphone')
  const [widgetStyle, setWidgetStyle] = useState<WidgetStyle>('pill')
  const widgetStyleRef = useRef<WidgetStyle>('pill')
  useEffect(() => { widgetStyleRef.current = widgetStyle }, [widgetStyle])
  
  const partialTranscription = useAppStore((state) => state.partialTranscription)
  const setPartialTranscription = useAppStore((state) => state.setPartialTranscription)
  const clearPartialTranscription = useAppStore((state) => state.clearPartialTranscription)

  // Hover-merge: hovering the idle voice pill reveals two connected action
  // pills (Enhance / Polish) that slide out from behind the primary pill.
  const [hovered, setHovered] = useState(false)
  const hoveredRef = useRef(false)
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const collapseGraceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Live streaming enhancement shown directly on the widget.
  const [enhanceText, setEnhanceText] = useState('')
  const [enhanceLabel, setEnhanceLabel] = useState('Enhancing')
  const [enhanceStreaming, setEnhanceStreaming] = useState(false)
  const [doneLabel, setDoneLabel] = useState('Injected')
  const abortRef = useRef<AbortController | null>(null)
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stateRef = useRef<PillState>('idle')
  const widgetEnabledRef = useRef(true)
  const recStartRef = useRef(0)
  const sessionIdRef = useRef<number | null>(null)
  const releaseGuardUntilRef = useRef(0)
  const doneRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const transitionRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const appWinRef = useRef<ReturnType<typeof getCurrentWindow> | null>(null)
  
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [partialTranscription, enhanceText])

  useEffect(() => {
    try { appWinRef.current = getCurrentWindow() } catch { /* ignore */ }
  }, [])

  const [activeModel, setActiveModel] = useState<string>('ggml-base.en.bin')

  useEffect(() => {
    invoke<string|null>('get_setting', { key: 'model' }).then(v => {
      if (v) setActiveModel(v)
    }).catch(() => {})

    const subSelected = listen<string>('model-selected', e => {
      if (e.payload) setActiveModel(e.payload)
    })
    const subLoading = listen<string>('model-loading', e => {
      if (e.payload) setActiveModel(e.payload)
    })
    const subLoaded = listen<string>('model-loaded', e => {
      if (e.payload) setActiveModel(e.payload)
    })
    return () => {
      subSelected.then(f => f())
      subLoading.then(f => f())
      subLoaded.then(f => f())
    }
  }, [])

  const isStreamingModel = useMemo(() => {
    const m = (activeModel || '').toLowerCase()
    return m.includes('nemotron') || m.includes('parakeet') || m.includes('moonshine') || m.includes('canary') || m.includes('sherpa')
  }, [activeModel])

  const resizeTo = useCallback(async (s: PillState, forceCard?: boolean) => {
    const isCard = forceCard || s === 'enhancing' || ((isStreamingModel || Boolean(partialTranscription && partialTranscription.trim())) && (s === 'listening' || s === 'processing'))
    const { w, h } = isCard ? { w: 380, h: 124 } : { w: 380, h: 48 }
    invoke('resize_widget', { width: w, height: h }).catch(() => {})
  }, [isStreamingModel, partialTranscription])

  const transition = useCallback((next: PillState) => {
    // Leaving idle (recording, error, etc.) must dismiss any open hover cluster.
    if (next !== 'idle' && hoveredRef.current) {
      hoveredRef.current = false
      setHovered(false)
      if (collapseGraceTimerRef.current) { clearTimeout(collapseGraceTimerRef.current); collapseGraceTimerRef.current = null }
      if (collapseTimerRef.current) { clearTimeout(collapseTimerRef.current); collapseTimerRef.current = null }
    }
    if (stateRef.current === next) {
      void resizeTo(next)
      return
    }
    if (transitionRef.current) clearTimeout(transitionRef.current)
    stateRef.current = next
    setPillState(next)
    setContentVisible(false)
    void resizeTo(next)
    transitionRef.current = setTimeout(() => {
      setContentVisible(true)
      transitionRef.current = null
    }, 60)
  }, [resizeTo])

  // Smoothly reveal the connected action pills via GPU CSS animation (zero OS resize / zero flicker). Idle only.
  const expandHover = useCallback(() => {
    if (stateRef.current !== 'idle') return
    if (collapseGraceTimerRef.current) { clearTimeout(collapseGraceTimerRef.current); collapseGraceTimerRef.current = null }
    if (collapseTimerRef.current) { clearTimeout(collapseTimerRef.current); collapseTimerRef.current = null }
    if (hoveredRef.current) return
    hoveredRef.current = true
    setHovered(true)
  }, [])

  // Animate the pills back in with a grace debounce without resizing the native window.
  const collapseHover = useCallback(() => {
    if (!hoveredRef.current) return
    if (collapseGraceTimerRef.current) clearTimeout(collapseGraceTimerRef.current)
    collapseGraceTimerRef.current = setTimeout(() => {
      collapseGraceTimerRef.current = null
      hoveredRef.current = false
      setHovered(false)
    }, 120)
  }, [])

  const triggerPromptAction = useCallback((actionId: string) => {
    if (collapseGraceTimerRef.current) { clearTimeout(collapseGraceTimerRef.current); collapseGraceTimerRef.current = null }
    if (collapseTimerRef.current) { clearTimeout(collapseTimerRef.current); collapseTimerRef.current = null }
    hoveredRef.current = false
    setHovered(false)
    // Rust captures the foreground selection and emits `meshprompt://enhance`,
    // which drives the live streaming panel (and resizes the widget).
    invoke('trigger_prompt_action', { actionId }).catch(() => {})
  }, [])

  const showWidgetForActivity = useCallback(async () => {
    if (widgetEnabledRef.current) return
    await invoke('show_widget').catch(() => {})
  }, [])

  const hideWidgetWhenIdle = useCallback((delayMs = 0) => {
    if (widgetEnabledRef.current) return
    const hide = () => {
      if (!widgetEnabledRef.current && stateRef.current === 'idle') {
        invoke('hide_widget').catch(() => {})
      }
    }
    if (delayMs > 0) setTimeout(hide, delayMs)
    else hide()
  }, [])

  const returnToIdle = useCallback(() => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current)
      streamIntervalRef.current = null
    }
    clearPartialTranscription()
    setEnhanceText('')
    transition('idle')
    hideWidgetWhenIdle(180)
  }, [clearPartialTranscription, hideWidgetWhenIdle, transition])

  const showError = useCallback((msg: string) => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current)
      streamIntervalRef.current = null
    }
    const isMic = isMicError(msg)
    setErrorIsMic(isMic)
    setErrorMsg(isMic ? 'Mic access blocked' : msg)
    transition('error')
    if (doneRef.current) clearTimeout(doneRef.current)
    doneRef.current = setTimeout(returnToIdle, isMic ? 6000 : 4000)
  }, [returnToIdle, transition])

  const cancelEnhance = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current)
      streamIntervalRef.current = null
    }
    setEnhanceStreaming(false)
    returnToIdle()
  }, [returnToIdle])

  const cancelCapture = useCallback(async () => {
    sessionIdRef.current = null
    clearPartialTranscription()
    try {
      await invoke('stop_recording')
    } catch { /* ignore */ }
    returnToIdle()
  }, [clearPartialTranscription, returnToIdle])

  // Stream an enhancement/polish directly on the widget. Text is captured by
  // the Rust side (foreground selection); we stream the Groq completion via
  // SSE and show tokens live, then paste the result back into the app.
  const runEnhance = useCallback(async (text: string, actionId: string) => {
    const trimmed = (text || '').trim()
    setEnhanceLabel(actionId === 'polish' ? 'Polishing' : 'Enhancing')
    setEnhanceText('')
    if (!trimmed) { showError('Select text first, then Enhance or Polish'); return }

    await showWidgetForActivity()
    setEnhanceStreaming(true)
    setDoneLabel('Replaced')
    transition('enhancing')

    let settings: AppSettingsLike
    let key: string | null
    try {
      const state = await invoke<{ settings: AppSettingsLike }>('get_app_state')
      settings = state?.settings ?? {}
      key = await invoke<string | null>('get_provider_key', { provider: 'groq' })
      if (!key) {
        key = await invoke<string | null>('get_setting', { key: 'api_key' })
      }
    } catch {
      setEnhanceStreaming(false); showError('Could not load enhancer settings'); return
    }
    if (!key) { setEnhanceStreaming(false); showError('Add a Groq API key in AI Providers'); return }

    const model = settings?.provider?.provider === 'groq' && settings?.provider?.model
      ? settings.provider.model : 'llama-3.3-70b-versatile'
    const action = builtInPromptActions.find(a => a.id === actionId) ?? builtInPromptActions[0]
    const req = buildPromptActionRequest(action, { selectedText: trimmed, settings: settings as never })
    const body = {
      model,
      temperature: settings?.temperature ?? 0.3,
      max_tokens: settings?.maxOutputTokens ?? 1800,
      stream: true,
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
    }

    const ac = new AbortController()
    abortRef.current = ac
    let acc = ''
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        signal: ac.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify(body),
      })
      if (!resp.ok || !resp.body) {
        let detail = `HTTP ${resp.status}`
        try { const j = await resp.json(); detail = j?.error?.message || detail } catch { /* ignore */ }
        throw new Error(detail)
      }
      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const raw of lines) {
          const line = raw.trim()
          if (!line.startsWith('data:')) continue
          const data = line.slice(5).trim()
          if (!data || data === '[DONE]') continue
          try {
            const json = JSON.parse(data)
            const delta = json?.choices?.[0]?.delta?.content
            if (typeof delta === 'string' && delta) { acc += delta; setEnhanceText(acc) }
          } catch { /* SSE json split across chunks — reassembled via buf */ }
        }
      }
    } catch (e) {
      abortRef.current = null
      setEnhanceStreaming(false)
      if (ac.signal.aborted) { returnToIdle(); return }
      showError(`Enhance failed: ${String((e as Error)?.message ?? e).slice(0, 60)}`)
      return
    }
    abortRef.current = null
    setEnhanceStreaming(false)

    const finalText = acc.trim()
    if (!finalText) { showError('Model returned no text'); return }

    // Paste the result back into the app that held the selection.
    try {
      await invoke('replace_selected_text', { text: finalText })
      setDoneLabel('Replaced')
      transition('done')
      if (doneRef.current) clearTimeout(doneRef.current)
      doneRef.current = setTimeout(returnToIdle, 900)
    } catch {
      try { await invoke('copy_text', { text: finalText }) } catch { /* ignore */ }
      setDoneLabel('Copied')
      transition('done')
      if (doneRef.current) clearTimeout(doneRef.current)
      doneRef.current = setTimeout(returnToIdle, 1400)
    }
  }, [returnToIdle, showError, showWidgetForActivity, transition])

  const refreshMicStatus = useCallback(async () => {
    try {
      const status = await invoke<MicrophoneStatus>('check_microphone_status')
      if (status.ready) {
        setMicDetail(status.selected_device ?? status.default_device ?? 'Microphone ready')
        returnToIdle()
        return true
      }
      setMicDetail(status.error ?? 'Microphone is not ready')
      transition('mic-prompt')
      return false
    } catch (e) {
      setMicDetail(String(e))
      transition('mic-prompt')
      return false
    }
  }, [returnToIdle, transition])

  const startCapture = useCallback(async () => {
    await showWidgetForActivity()
    if (stateRef.current === 'mic-prompt') {
      void refreshMicStatus()
      return
    }
    if (stateRef.current === 'done') {
      if (doneRef.current) {
        clearTimeout(doneRef.current)
        doneRef.current = null
      }
    } else if (stateRef.current !== 'idle') {
      return
    }
    try {
      clearPartialTranscription()
      const currentModel = await invoke<string|null>('get_setting', { key: 'model' }).catch(() => null)
      if (currentModel) setActiveModel(currentModel)
      const sessionId = await invoke<number>('start_recording')
      sessionIdRef.current = sessionId
      releaseGuardUntilRef.current = Date.now() + 140
    } catch (e) {
      showError(String(e))
      return
    }
    recStartRef.current = Date.now()
    transition('listening')
  }, [clearPartialTranscription, refreshMicStatus, showError, showWidgetForActivity, transition])

  const stopCapture = useCallback(async () => {
    if (stateRef.current !== 'listening') return
    const remainingGuard = releaseGuardUntilRef.current - Date.now()
    if (remainingGuard > 0) {
      setTimeout(() => {
        if (stateRef.current === 'listening') {
          void stopCapture()
        }
      }, remainingGuard)
      return
    }
    const sessionId = sessionIdRef.current
    if (sessionId == null) return
    const durationMs = Date.now() - recStartRef.current
    transition('processing')
    try {
      const accessToken: string | null = null
      const text = await invoke<string>('stop_recording_and_transcribe', { durationMs, accessToken, sessionId })
      sessionIdRef.current = null
      clearPartialTranscription()
      if (!text?.trim()) {
        showError('No speech detected')
        return
      }

      setDoneLabel('Injected')
      transition('done')
      if (doneRef.current) clearTimeout(doneRef.current)
      doneRef.current = setTimeout(returnToIdle, 1100)
    } catch(e) {
      const message = String(e)
      if (message.includes('Stale recording stop ignored')) {
        transition('listening')
        return
      }
      if (message.includes('Recording already stopped')) {
        sessionIdRef.current = null
        clearPartialTranscription()
        returnToIdle()
        return
      }
      sessionIdRef.current = null
      clearPartialTranscription()
      showError(message)
    }
  }, [clearPartialTranscription, returnToIdle, showError, transition])

  useEffect(() => {
    queueMicrotask(() => { void refreshMicStatus() })
  }, [refreshMicStatus, transition])

  // Load and listen for widget style configuration changes
  useEffect(() => {
    invoke<string|null>('get_setting', { key: 'widget_style' })
      .then(v => {
        if (v === 'circle' || v === 'invisible' || v === 'pill') {
          setWidgetStyle(v)
        }
      })
      .catch(() => {})

    const sub = listen<string>('widget-style-changed', e => {
      const v = e.payload
      if (v === 'circle' || v === 'invisible' || v === 'pill') {
        setWidgetStyle(v)
      }
    })
    return () => { sub.then(f => f()) }
  }, [])

  useEffect(() => {
    const applyVisibility = (enabled: boolean) => {
      widgetEnabledRef.current = enabled

      if (enabled) {
        invoke('show_widget').catch(() => {})
        return
      }

      if (!isTransientWidgetState(stateRef.current)) {
        invoke('hide_widget').catch(() => {})
      }
    }

    invoke<string|null>('get_setting', { key: 'widget_enabled' })
      .then(v => applyVisibility(v == null || (v !== 'false' && v !== '0')))
      .catch(() => {})

    const sub = listen<boolean>('widget-visibility-changed', e => {
      applyVisibility(e.payload)
    })
    return () => { sub.then(f => f()) }
  }, [])

  useEffect(() => {
    const subs = [
      listen('hotkey-pressed', startCapture),
      listen('hotkey-released', stopCapture),
      listen<string>('transcription-partial', (e) => {
        const text = e.payload
        setPartialTranscription(text)
        if (text && text.trim() && (stateRef.current === 'listening' || stateRef.current === 'processing')) {
          invoke('resize_widget', { width: 380, height: 124 }).catch(() => {})
        }
      }),
      // Prompt enhancement is captured by Rust (foreground selection) and
      // streamed live here on the widget.
      listen<{ text: string; actionId: string }>('meshprompt://enhance', (e) => {
        void runEnhance(e.payload?.text ?? '', e.payload?.actionId || 'enhance-prompt')
      }),
      listen<string>('meshprompt://capture-error', (e) => {
        showError(e.payload || 'No text selected')
      }),
    ]
    return () => {
      subs.forEach(p => p.then(f => f()))
      if (doneRef.current) clearTimeout(doneRef.current)
      if (transitionRef.current) clearTimeout(transitionRef.current)
      if (collapseGraceTimerRef.current) clearTimeout(collapseGraceTimerRef.current)
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current)
    }
  }, [clearPartialTranscription, setPartialTranscription, startCapture, stopCapture, runEnhance, showError])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || !appWinRef.current) return
    e.preventDefault()
    appWinRef.current.startDragging().catch(() => {})
  }, [])

  const handleDoubleClick = useCallback(() => {
    if (stateRef.current === 'listening') void stopCapture()
    else if (stateRef.current === 'idle') void startCapture()
    else invoke('show_main_window').catch(console.error)
  }, [startCapture, stopCapture])

  const handleGrantMic = useCallback(() => {
    invoke('open_mic_settings').catch(() => {})
  }, [])

  const handleFixMic = useCallback(() => {
    if (doneRef.current) clearTimeout(doneRef.current)
    invoke('open_mic_settings').catch(() => {})
  }, [])

  const hasPartialText = Boolean(partialTranscription && partialTranscription.trim())
  const isCardState = pillState === 'enhancing' || ((isStreamingModel || hasPartialText) && (pillState === 'listening' || pillState === 'processing'))
  const isCircleState = widgetStyle === 'circle' && ['idle', 'done'].includes(pillState) && !isCardState

  useEffect(() => {
    if (isCardState) {
      invoke('resize_widget', { width: 380, height: 124 }).catch(() => {})
    }
  }, [isCardState])

  const size = useMemo(() => {
    if (isCardState) {
      return { w: 340, h: 104 }
    }
    if (widgetStyle === 'circle') {
      if (pillState === 'idle' || pillState === 'done') return { w: 32, h: 32 }
      if (pillState === 'error') return { w: 190, h: 32 }
      if (pillState === 'mic-prompt') return { w: 160, h: 32 }
      return { w: 122, h: 32 }
    }
    if (pillState === 'error') return { w: 166, h: 32 }
    if (pillState === 'mic-prompt') return { w: 160, h: 32 }
    return { w: 122, h: 32 }
  }, [isCardState, widgetStyle, pillState])

  const getBorderColor = () => {
    if (widgetStyle === 'invisible' && pillState === 'idle') {
      return 'rgba(255, 255, 255, 0.18)'
    }
    return BORDER[pillState]
  }

  const getBackgroundStyle = () => {
    if (widgetStyle === 'invisible' && !isCardState) {
      return 'linear-gradient(135deg, rgba(255,255,255,0.13), rgba(255,255,255,0.04) 42%, rgba(255,255,255,0.08)), rgba(12,12,12,0.42)'
    }
    return 'linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.05) 38%, rgba(255,255,255,0.09)), rgba(13,13,13,0.72)'
  }

  const getBackdropFilter = () => {
    if (widgetStyle === 'invisible' && !isCardState) {
      return 'blur(18px) saturate(150%)'
    }
    return 'blur(22px) saturate(165%)'
  }

  const getInnerGlow = () => {
    const stateGlow = pillState === 'listening' ? 'inset 0 0 18px rgba(242,106,75,0.26)'
      : pillState === 'done' ? 'inset 0 0 18px rgba(74,222,128,0.20)'
      : pillState === 'error' || pillState === 'mic-prompt' ? 'inset 0 0 18px rgba(239,68,68,0.18)'
      : 'inset 0 0 16px rgba(255,255,255,0.08)'
    return `inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.34), ${stateGlow}`
  }

  return (
    <div
      style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', overflow: 'hidden', pointerEvents: 'none' }}
    >
      <div
        onMouseEnter={expandHover}
        onMouseLeave={collapseHover}
        style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto', padding: '6px 8px' }}
      >
        <SidePill
          side="left"
          label="Enhance"
          accent="#A855F7"
          show={hovered && pillState === 'idle'}
          onTrigger={() => triggerPromptAction('enhance-prompt')}
        />
        <SidePill
          side="right"
          label="Polish"
          accent="#2DD4BF"
          show={hovered && pillState === 'idle'}
          onTrigger={() => triggerPromptAction('polish')}
        />

      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        style={{
          width: size.w, height: size.h, borderRadius: isCardState ? 16 : 99,
          border: `0.5px solid ${getBorderColor()}`,
          background: getBackgroundStyle(),
          backdropFilter: getBackdropFilter(), WebkitBackdropFilter: getBackdropFilter(),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          transition: 'width 200ms cubic-bezier(0.22,1,0.36,1), height 200ms cubic-bezier(0.22,1,0.36,1), border-radius 200ms cubic-bezier(0.22,1,0.36,1), border-color 200ms cubic-bezier(0.22,1,0.36,1), background 200ms cubic-bezier(0.22,1,0.36,1), box-shadow 200ms cubic-bezier(0.22,1,0.36,1)',
          cursor: 'grab', userSelect: 'none', position: 'relative',
          zIndex: 10,
          boxShadow: getInnerGlow(),
          clipPath: isCardState ? undefined : 'inset(0 round 999px)',
          isolation: 'isolate',
        }}
      >
        <div style={{
          position: 'absolute',
          inset: 1,
          borderRadius: isCardState ? 16 : 99,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.16), transparent 46%)',
          pointerEvents: 'none',
        }} />
        {isCardState ? (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            padding: '12px 14px', position: 'relative',
            fontFamily: "'Noto Sans', sans-serif",
            opacity: contentVisible ? 1 : 0,
            transition: 'opacity 80ms ease',
            zIndex: 1,
          }}>
            {/* Scrollable text body */}
            <div
              ref={scrollRef}
              style={{
                flex: 1, minHeight: 0, overflowY: 'auto',
                color: '#E7E3DB', fontSize: 13, lineHeight: 1.45,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                fontStyle: 'italic',
                paddingBottom: 4,
                textAlign: 'left',
              }}
            >
              {pillState === 'enhancing' ? (
                <>
                  {enhanceText || (enhanceStreaming ? 'Reading selection…' : 'Processing…')}
                  {enhanceStreaming && (
                    <span style={{
                      display: 'inline-block', width: 6, height: 12, marginLeft: 2,
                      transform: 'translateY(1px)', background: '#A855F7', borderRadius: 1,
                      animation: 'mv-caret 1s steps(1) infinite',
                    }} />
                  )}
                </>
              ) : (
                <>
                  {partialTranscription ? (
                    <span>{partialTranscription}</span>
                  ) : (
                    <span style={{ color: '#8F8B82' }}>
                      {pillState === 'listening' ? 'Listening…' : 'Transcribing…'}
                    </span>
                  )}
                  {pillState === 'listening' && (
                    <span style={{
                      display: 'inline-block', width: 6, height: 12, marginLeft: 2,
                      transform: 'translateY(1px)', background: '#F26A4B', borderRadius: 1,
                      animation: 'mv-caret 0.8s steps(1) infinite',
                    }} />
                  )}
                </>
              )}
            </div>

            {/* Bottom status bar */}
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderTop: '0.5px solid rgba(255,255,255,0.06)',
                paddingTop: 8, marginTop: 4, flexShrink: 0,
              }}
              onMouseDown={(e) => e.stopPropagation()} // Prevent dragging on buttons click
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {pillState === 'enhancing' ? (
                  <>
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
                      <circle cx="7" cy="7" r="5.5" stroke="#2C2C2C" strokeWidth="1.5" />
                      <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke={enhanceLabel.includes('Polish') ? '#2DD4BF' : '#A855F7'} strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span style={{ color: '#8F8B82', fontSize: 11, fontWeight: 500 }}>
                      {enhanceLabel}...
                    </span>
                  </>
                ) : pillState === 'listening' ? (
                  <>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#F26A4B', flexShrink: 0, animation: 'pulse-d 0.8s ease-in-out infinite', boxShadow: '0 0 10px #F26A4B' }} />
                    <span style={{ color: '#8F8B82', fontSize: 11, fontWeight: 500 }}>
                      Listening...
                    </span>
                  </>
                ) : (
                  <>
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
                      <circle cx="7" cy="7" r="5.5" stroke="#2C2C2C" strokeWidth="1.5" />
                      <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="#D1CFC0" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span style={{ color: '#8F8B82', fontSize: 11, fontWeight: 500 }}>
                      Transcribing...
                    </span>
                  </>
                )}
              </div>

              {/* Close Button */}
              <button
                className="mv-btn"
                onClick={pillState === 'enhancing' ? cancelEnhance : cancelCapture}
                style={{
                  background: 'transparent', border: 'none', color: '#8F8B82',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 2, transition: 'color 150ms ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#E7E3DB'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#8F8B82'}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isCircleState ? 0 : 6,
            padding: isCircleState ? '0' : '0 10px',
            opacity: contentVisible ? 1 : 0,
            transition: 'opacity 80ms ease',
            justifyContent: 'center',
            width: '100%',
            position: 'relative',
            zIndex: 1,
          }}>
            {isCircleState ? (
              <>
                {pillState === 'idle' && (
                  <img src="/logo-prompt.png" alt="" width="16" height="16" style={{ borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
                )}
                {pillState === 'done' && (
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M2.5 7L5.5 10L11.5 4" stroke={COLOR.done} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </>
            ) : (
              <>
                {pillState === 'idle'       && <IdleContent widgetStyle={widgetStyle} />}
                {pillState === 'listening'  && <ListeningContent color={COLOR.listening} partialText={partialTranscription} widgetStyle={widgetStyle} />}
                {pillState === 'processing' && <SpinnerContent color={COLOR.processing} label="Transcribing…" widgetStyle={widgetStyle} />}
                {pillState === 'done'       && <CheckContent color={COLOR.done} label={doneLabel} widgetStyle={widgetStyle} />}
                {pillState === 'error'      && <ErrorContent color={COLOR.error} label={errorMsg} isMic={errorIsMic} onFix={handleFixMic} widgetStyle={widgetStyle} />}
                {pillState === 'mic-prompt' && <MicPromptContent detail={micDetail} onGrant={handleGrantMic} widgetStyle={widgetStyle} />}
              </>
            )}
          </div>
        )}
      </div>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { background: transparent !important; width: 100%; height: 100%; overflow: hidden; }
        @keyframes ripple  { 0% { transform:scale(1); opacity:1; } 100% { transform:scale(1.6); opacity:0; } }
        @keyframes pulse-d { 0%,100% { transform:scale(1); } 50% { transform:scale(1.7); opacity:0.4; } }
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes mv-panel-in { from { opacity:0; transform:translateY(8px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes mv-bounce { 0%,100% { transform:translateY(0); opacity:0.5; } 50% { transform:translateY(-3px); opacity:1; } }
        @keyframes mv-caret { 0%,50% { opacity:1; } 50.01%,100% { opacity:0; } }
        .mv-btn { border: none; outline: none; cursor: pointer; transition: opacity 0.15s ease; }
        .mv-btn:hover { opacity: 0.8; }
        .mv-btn:active { opacity: 0.6; }
        .mv-side-pill {
          outline: none;
          border: none;
          cursor: pointer;
          user-select: none;
          white-space: nowrap;
          -webkit-font-smoothing: antialiased;
          transform: translateZ(0);
        }
        .mv-side-pill:hover {
          filter: brightness(1.15);
          transform: scale(1.04) translateZ(0);
        }
        .mv-side-pill:hover .mv-side-icon {
          transform: scale(1.16) rotate(6deg);
        }
        .mv-side-pill:active {
          filter: brightness(0.92);
          transform: scale(0.96) translateZ(0) !important;
        }
      `}</style>
    </div>
  )
}

function SidePill({ side, label, accent, show, onTrigger }: {
  side: 'left' | 'right'
  label: string
  accent: string
  show: boolean
  onTrigger: () => void
}) {
  const isLeft = side === 'left'
  const anchor = isLeft ? { right: '100%' } : { left: '100%' }
  const gap = 8

  // Visible position: docked with 8px gap beside the center pill
  const shownX = isLeft ? -gap : gap
  // Hidden position: tucked neatly behind the central pill
  const hiddenX = isLeft ? 54 : -54
  const tx = show ? shownX : hiddenX

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        ...anchor,
        transform: `translate3d(${tx}px, -50%, 0) scale(${show ? 1 : 0.88})`,
        opacity: show ? 1 : 0,
        pointerEvents: show ? 'auto' : 'none',
        transition: show
          ? 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms cubic-bezier(0.16, 1, 0.3, 1)'
          : 'transform 240ms cubic-bezier(0.4, 0, 0.2, 1), opacity 180ms ease',
        zIndex: 1,
        willChange: 'transform, opacity',
      }}
    >
      <button
        className={`mv-side-pill mv-side-pill-${side}`}
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault() }}
        onClick={(e) => { e.stopPropagation(); onTrigger() }}
        title={`${label} selected text`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          height: 30,
          padding: '0 12px',
          borderRadius: 99,
          border: `0.5px solid ${accent}55`,
          background: `linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.09)), rgba(14,14,16,0.85)`,
          backdropFilter: 'blur(22px) saturate(165%)',
          WebkitBackdropFilter: 'blur(22px) saturate(165%)',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.34), inset 0 0 16px ${accent}20, 0 4px 14px rgba(0,0,0,0.35)`,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          color: '#F3EEE6',
          transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms ease, box-shadow 180ms ease, filter 180ms ease',
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke={accent}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0, transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)' }}
          className="mv-side-icon"
        >
          {isLeft ? (
            <>
              <path d="M12 3l1.9 4.8L18.7 9.7 13.9 11.6 12 16.4 10.1 11.6 5.3 9.7 10.1 7.8z" />
              <path d="M19 3v4M21 5h-4" />
            </>
          ) : (
            <>
              <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8l1.4 1.4M17.8 6.2l1.4-1.4" />
              <path d="M3 21l9-9M12.2 6.2l1.6 1.6" />
            </>
          )}
        </svg>
        <span style={{
          color: '#F3EEE6',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.02em',
          fontFamily: "'Noto Sans',sans-serif",
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        }}>
          {label}
        </span>
      </button>
    </div>
  )
}

function IdleContent({ widgetStyle }: { widgetStyle?: string }) {
  const isInvisible = widgetStyle === 'invisible'
  return (
    <>
      <img src="/logo-prompt.png" alt="" width="16" height="16" style={{ borderRadius:5, objectFit:'cover', flexShrink:0 }} />
      <span style={{
        color: isInvisible ? '#F3EEE6' : '#B8B3AA',
        fontSize:11,
        fontWeight:550,
        letterSpacing:'0.02em',
        fontFamily:"'Noto Sans',sans-serif",
        textShadow: '0 1px 2px rgba(0,0,0,0.55)'
      }}>MeshUtility</span>
    </>
  )
}

function ListeningContent({ color, partialText, widgetStyle }: { color: string; partialText?: string; widgetStyle?: string }) {
  const isInvisible = widgetStyle === 'invisible'
  const hasText = Boolean(partialText && partialText.trim())

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      width: '100%',
      minWidth: 0,
      justifyContent: hasText ? 'flex-start' : 'center',
      padding: hasText ? '0 4px' : '0',
    }}>
      <div style={{
        width: 7, height: 7, borderRadius: '50%',
        background: color, flexShrink: 0,
        animation: 'pulse-d 0.8s ease-in-out infinite',
        boxShadow: `0 0 10px ${color}`,
      }} />
      {hasText ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          minWidth: 0,
          flex: 1,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}>
          <span style={{
            color: '#F3EEE6',
            fontSize: 11.5,
            fontWeight: 500,
            fontFamily: "'Noto Sans',sans-serif",
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}>
            {partialText}
          </span>
          <span style={{
            display: 'inline-block',
            width: 4,
            height: 12,
            marginLeft: 3,
            background: color,
            borderRadius: 1,
            animation: 'mv-caret 0.8s steps(1) infinite',
            flexShrink: 0,
          }} />
        </div>
      ) : (
        <span style={{
          color,
          fontSize: 11,
          fontWeight: 600,
          fontFamily: "'Noto Sans',sans-serif",
          flexShrink: 0,
          textShadow: isInvisible ? '0 1px 2px rgba(0,0,0,0.45)' : '0 1px 2px rgba(0,0,0,0.35)'
        }}>
          Listening…
        </span>
      )}
    </div>
  )
}

function SpinnerContent({ color, label, widgetStyle }: { color: string; label: ReactNode; widgetStyle?: string }) {
  const isInvisible = widgetStyle === 'invisible'
  const isString = typeof label === 'string'
  const isCustomText = isString && label !== 'Transcribing' && label !== 'Processing…'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      width: '100%',
      minWidth: 0,
      justifyContent: isCustomText ? 'flex-start' : 'center',
      padding: isCustomText ? '0 4px' : '0',
    }}>
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
        <circle cx="7" cy="7" r="5.5" stroke="#2C2C2C" strokeWidth="1.5" />
        <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span style={{
        color: isCustomText ? '#F3EEE6' : color,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "'Noto Sans',sans-serif",
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textShadow: isInvisible ? '0 1px 2px rgba(0,0,0,0.45)' : '0 1px 2px rgba(0,0,0,0.35)'
      }}>
        {label}
      </span>
    </div>
  )
}

function CheckContent({ color, label, widgetStyle }: { color:string; label:string; widgetStyle?: string }) {
  const isInvisible = widgetStyle === 'invisible'
  return (
    <>
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ flexShrink:0 }}>
        <path d="M2.5 7L5.5 10L11.5 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{
        color,
        fontSize:11,
        fontWeight:600,
        fontFamily:"'Noto Sans',sans-serif",
        textShadow: isInvisible ? '0 1px 2px rgba(0,0,0,0.45)' : '0 1px 2px rgba(0,0,0,0.35)'
      }}>{label}</span>
    </>
  )
}

function ErrorContent({ color, label, isMic, onFix, widgetStyle }: { color:string; label:string; isMic:boolean; onFix:()=>void; widgetStyle?: string }) {
  const isInvisible = widgetStyle === 'invisible'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, width:'100%', justifyContent:'center' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span style={{
        color,
        fontSize:10,
        fontWeight:600,
        fontFamily:"'Noto Sans',sans-serif",
        flexShrink:1,
        minWidth:0,
        overflow:'hidden',
        textOverflow:'ellipsis',
        whiteSpace:'nowrap',
        textShadow: isInvisible ? '0 1px 2px rgba(0,0,0,0.45)' : '0 1px 2px rgba(0,0,0,0.35)'
      }}>{label}</span>
      {isMic && (
        <button
          className="mv-btn"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onFix(); }}
          style={{
            background:'#EF4444', color:'#fff', fontSize:9, fontWeight:600,
            fontFamily:"'Noto Sans',sans-serif", padding:'1px 6px', borderRadius:99,
            flexShrink:0, letterSpacing:'0.04em'
          }}
        >
          Fix
        </button>
      )}
    </div>
  )
}

function MicPromptContent({ detail, onGrant, widgetStyle }: { detail:string; onGrant:()=>void; widgetStyle?: string }) {
  const isInvisible = widgetStyle === 'invisible'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5, width:'100%', justifyContent:'center', padding:'0 4px' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F26A4B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
      <span title={detail} style={{
        color:'#F26A4B',
        fontSize:10,
        fontWeight:600,
        fontFamily:"'Noto Sans',sans-serif",
        flexShrink:1,
        minWidth:0,
        overflow:'hidden',
        textOverflow:'ellipsis',
        whiteSpace:'nowrap',
        textShadow: isInvisible ? '0 1px 2px rgba(0,0,0,0.45)' : '0 1px 2px rgba(0,0,0,0.35)'
      }}>Mic setup</span>
      <button
        className="mv-btn"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onGrant(); }}
        style={{
          background:'#F26A4B', color:'#fff', fontSize:9, fontWeight:700,
          fontFamily:"'Noto Sans',sans-serif", padding:'1px 6px', borderRadius:99, flexShrink:0
        }}
      >
        Open
      </button>
    </div>
  )
}
