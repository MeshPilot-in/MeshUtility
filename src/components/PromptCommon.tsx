import { type ReactNode } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  Download,
  Sparkles,
  Edit2,
  FileText,
} from "lucide-react";
import type {
  View,
  OverlayPhase,
  ProviderSettings,
  SettingsState,
  HistoryItem,
  AppState,
  ConsoleLine,
} from "./promptService";

export type {
  View,
  OverlayPhase,
  ProviderSettings,
  SettingsState,
  HistoryItem,
  AppState,
  ConsoleLine,
};

export function ActionIcon({ actionId }: { actionId: string }) {
  switch (actionId) {
    case "enhance-prompt": return <Sparkles size={14} />;
    case "polish": return <Edit2 size={14} />;
    default: return <FileText size={14} />;
  }
}

export function TitleBar({
  status,
  updateInfo,
  onUpdateClick,
}: {
  status: string;
  view?: View;
  updateInfo: { updateAvailable: boolean; version: string } | null;
  onUpdateClick: () => void;
}) {
  const appWindow = getCurrentWindow();
  return (
    <header className="titlebar" data-tauri-drag-region>
      <div className="title-actions-left" data-tauri-drag-region>
        {status && <div className="status-pill" data-no-drag>{status}</div>}
        {updateInfo?.updateAvailable && (
          <button 
            className="titlebar-update-btn" 
            data-no-drag 
            onClick={onUpdateClick}
            style={{ marginLeft: '8px' }}
            title={`Update Available (${updateInfo.version})`}
            aria-label="Update Available"
          >
            <Download size={11} />
            <span>Update</span>
          </button>
        )}
      </div>
      <div className="title-center" data-tauri-drag-region>
        <span className="title-icon" data-tauri-drag-region>
          <img src="/logo.png" alt="MP" data-tauri-drag-region />
        </span>
        <strong className="title-text" data-tauri-drag-region>MeshPrompt</strong>
      </div>
      <div className="window-controls-right" data-tauri-drag-region>
        <button className="mac-dot minimize" data-no-drag onClick={(e) => { e.stopPropagation(); void appWindow.minimize(); }} aria-label="Minimize"></button>
        <button className="mac-dot maximize" data-no-drag onClick={(e) => { e.stopPropagation(); void appWindow.toggleMaximize(); }} aria-label="Maximize"></button>
        <button className="mac-dot close" data-no-drag onClick={(e) => { e.stopPropagation(); void appWindow.close(); }} aria-label="Close"></button>
      </div>
    </header>
  );
}

export function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return <button className={active ? "nav-button active" : "nav-button"} onClick={onClick}>{icon}<span>{label}</span></button>;
}

export function SettingsCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="card stack premium-glass-card">
      <div className="settings-title">
        {icon}
        <h3>{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void | Promise<void> }) {
  return (
    <label 
      className="toggle-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row',
        width: '100%',
        padding: '12px 0',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer'
      }}
    >
      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
      <div className="toggle-switch" style={{ flexShrink: 0 }}>
        <input type="checkbox" checked={checked} onChange={(event) => void onChange(event.target.checked)} />
        <span className="toggle-slider"></span>
      </div>
    </label>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="empty-state"><strong>{title}</strong><span>{body}</span></div>;
}
