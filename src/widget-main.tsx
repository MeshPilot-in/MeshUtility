import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { listen } from '@tauri-apps/api/event'
import WidgetApp from './WidgetApp'
import { applyStoredTheme, applyThemeById } from './lib/appearance'
import './index.css'

applyStoredTheme()
listen<string>('appearance-theme-changed', (event) => applyThemeById(event.payload)).catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WidgetApp />
  </StrictMode>
)
