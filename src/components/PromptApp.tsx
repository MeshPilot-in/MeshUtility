import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import {
  Copy,
  History,
  KeyRound,
  RotateCcw,
  Settings,
  Sparkles,
  Wand2,
} from "lucide-react";
import {
  builtInPromptActions,
  getMeshPromptProvider,
} from "../lib";
import {
  TitleBar,
  NavButton,
} from "./PromptCommon";
import {
  fallbackSettings,
  generateWithCurrentProvider,
  errorMessage,
  type View,
  type SettingsState,
  type AppState,
} from "./promptService";

import { ProviderView } from "./ProviderView";
import { ActionsView } from "./ActionsView";
import { HistoryView } from "./HistoryView";
import { SettingsView } from "./SettingsView";

export default function App() {
  return <MainApp />;
}

interface UpdateCheckResult {
  updateAvailable: boolean;
  version: string;
  changelog: string;
  downloadUrl: string;
}

export function MainApp({
  embed = false,
  activeView,
  hideSidebar = false,
}: {
  embed?: boolean;
  activeView?: "text" | "providers" | "actions" | "history" | "settings";
  hideSidebar?: boolean;
}) {
  const [state, setState] = useState<AppState>({ settings: fallbackSettings, history: [], keyStatus: {} });
  const [view, setView] = useState<View>(activeView ?? "text");
  const [prevActiveView, setPrevActiveView] = useState(activeView);

  if (activeView !== prevActiveView) {
    setPrevActiveView(activeView);
    if (activeView) {
      setView(activeView);
    }
  }

  const [selectedText, setSelectedText] = useState("");
  const [output, setOutput] = useState("");
  const [actionId, setActionId] = useState(fallbackSettings.defaultActionId);
  const [instruction, setInstruction] = useState("");
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [status, setStatus] = useState("Ready");
  const [busy, setBusy] = useState(false);

  const [updateInfo, setUpdateInfo] = useState<{
    updateAvailable: boolean;
    version: string;
    changelog: string;
    downloadUrl: string;
  } | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  useEffect(() => {
    void refreshState();
    void checkUpdates();
    const captureError = listen<string>("meshprompt://capture-error", (event) => {
      setStatus(event.payload ?? "No selected text found.");
      setView("text");
    });
    const openView = listen<View>("meshprompt://open-view", (event) => {
      if (event.payload) {
        setView(event.payload);
      }
    });
    return () => {
      void captureError.then((off) => off());
      void openView.then((off) => off());
    };
  }, []);

  async function checkUpdates() {
    try {
      const result = await invoke<UpdateCheckResult>("check_for_updates");
      if (result && result.updateAvailable) {
        setUpdateInfo(result);
      }
    } catch (e) {
      console.warn("Failed to check for updates:", e);
    }
  }

  async function triggerUpdate() {
    if (!updateInfo) return;
    setUpdating(true);
    setUpdateError("");
    try {
      await invoke("install_update", { downloadUrl: updateInfo.downloadUrl });
    } catch (e) {
      setUpdating(false);
      setUpdateError(errorMessage(e));
    }
  }

  useEffect(() => {
    if (view === "history") {
      void refreshState();
    }
  }, [view]);

  async function refreshState() {
    try {
      const next = await invoke<AppState>("get_app_state");
      setState(next);
      setActionId(next.settings.defaultActionId);
    } catch (error) {
      setStatus(errorMessage(error));
    }
  }

  async function saveSettings(patch: Partial<SettingsState>) {
    const settings = { ...state.settings, ...patch };
    setState((current) => ({ ...current, settings }));
    await invoke("save_settings", { settings });
    setStatus("Settings saved");
  }

  async function runAction(sourceText = selectedText, sourceInstruction = instruction) {
    if (!sourceText.trim()) {
      setStatus("Add text to enhance first.");
      return;
    }
    const action = builtInPromptActions.find((item) => item.id === actionId) ?? builtInPromptActions[0];
    setBusy(true);
    setStatus("Enhancing text...");
    try {
      const response = await generateWithCurrentProvider(state.settings, action.id, sourceText, sourceInstruction);
      setOutput(response.content);
      setStatus("Output ready");
      if (state.settings.historyEnabled && !state.settings.sensitiveMode) {
        await invoke("add_history", {
          item: {
            id: crypto.randomUUID(),
            actionId: action.id,
            actionLabel: action.label,
            provider: response.provider,
            model: response.model,
            input: sourceText,
            output: response.content,
            createdAt: new Date().toISOString(),
          },
        });
        await refreshState();
      }
    } catch (error) {
      setStatus(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function copyOutput() {
    await invoke("copy_text", { text: output });
    setStatus("Copied");
  }

  async function replaceOutput() {
    try {
      await invoke("replace_selected_text", { text: output });
      setStatus("Replaced selected text");
    } catch (error) {
      await invoke("copy_text", { text: output });
      setStatus(`Replace failed. Copied instead. ${errorMessage(error)}`);
    }
  }

  async function saveKey() {
    const providerId = state.settings.provider.provider;
    const providerDef = getMeshPromptProvider(providerId);
    const label = providerDef.label;

    const trimmedKey = apiKeyDraft.trim().replace(/[\r\n]+/g, "");
    if (!trimmedKey) {
      setStatus(`Add ${providerDef.label} API key first.`);
      return;
    }

    try {
      await invoke("save_provider_key", { provider: providerId, apiKey: trimmedKey });
      if (providerId === "groq") {
        await invoke("set_setting", { key: "api_key", value: trimmedKey }).catch(() => {});
      }
      await refreshState();
      setStatus(`${label} key saved locally.`);
    } catch (error) {
      setStatus(errorMessage(error));
    }
  }

  async function clearKey() {
    const providerId = state.settings.provider.provider;
    const providerDef = getMeshPromptProvider(providerId);
    const label = providerDef.label;

    try {
      await invoke("delete_provider_key", { provider: providerId });
      if (typeof window !== "undefined") {
        localStorage.removeItem(`meshprompt_key_${providerId}`);
      }
      setApiKeyDraft("");
      await refreshState();
      setStatus(`${label} key cleared.`);
    } catch (error) {
      setStatus(errorMessage(error));
    }
  }

  const activeAction = builtInPromptActions.find((action) => action.id === actionId) ?? builtInPromptActions[0];

  const renderUpdateModal = () => {
    if (!showUpdateModal || !updateInfo) return null;
    return (
      <div className="modal-overlay" onClick={() => !updating && setShowUpdateModal(false)}>
        <div className="modal-content card stack" onClick={(e) => e.stopPropagation()} style={{ width: '420px', padding: '24px' }}>
          <div className="card-heading" style={{ marginBottom: '16px' }}>
            <div>
              <span className="eyebrow" style={{ color: 'var(--text-accent)' }}>New Version Released</span>
              <h3>MeshPrompt {updateInfo.version}</h3>
            </div>
          </div>
          
          <div className="stack" style={{ gap: '12px', flex: 1, minHeight: 0 }}>
            <label>Release Notes</label>
            <div className="update-changelog">
              {updateInfo.changelog || "No release notes provided."}
            </div>
            
            {updateError && <div className="error-message" style={{ color: 'var(--error)', fontSize: '12px' }}>{updateError}</div>}
            
            {updating ? (
              <div className="stack" style={{ gap: '8px', alignItems: 'center', margin: '16px 0' }}>
                <div className="spinner" />
                <strong>Downloading & Installing...</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>The application will automatically restart once finished.</span>
              </div>
            ) : (
              <div className="button-row" style={{ marginTop: '16px' }}>
                <button className="primary" onClick={() => void triggerUpdate()}>Update Now</button>
                <button onClick={() => setShowUpdateModal(false)}>Later</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (embed) {
    return (
      <div className="meshprompt-theme app-body" style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden', height: '100%', width: '100%' }}>
        {!hideSidebar && (
          <aside className="sidebar">
            <div className="brand-block">
              <div className="brand-mark">
                <img src="/logo-prompt.png" alt="MP" />
              </div>
              <div>
                <h1 className="brand-name">MeshPrompt</h1>
              </div>
            </div>
            <nav>
              <NavButton active={view === "text"} onClick={() => setView("text")} icon={<Wand2 size={15} />} label="Enhancer" />
              <NavButton active={view === "providers"} onClick={() => setView("providers")} icon={<KeyRound size={15} />} label="Test Provider" />
              <NavButton active={view === "actions"} onClick={() => setView("actions")} icon={<Sparkles size={15} />} label="Prompt Actions" />
              <NavButton active={view === "history"} onClick={() => setView("history")} icon={<History size={15} />} label="Action History" />
              <NavButton active={view === "settings"} onClick={() => setView("settings")} icon={<Settings size={15} />} label="Settings" />
            </nav>
            <div className="sidebar-footer">
              <span>{state.settings.paused ? "Shortcuts paused" : "Tray utility active"}</span>
              <strong>{state.settings.shortcut}</strong>
            </div>
          </aside>
        )}
        <main className="main-panel">
          <section className="content-scroll">
            {view === "text" && (
              <div className="stack compact-grid" style={{ gap: '24px' }}>
                <div className="stack" style={{ gap: '16px' }}>
                  <div className="card-heading">
                    <div>
                      <span className="eyebrow">Active Pipeline</span>
                      <h3>{activeAction.label}</h3>
                    </div>
                  </div>
                  
                  <div className="stack" style={{ gap: '8px' }}>
                    <label>Transformation Type</label>
                    <select value={actionId} onChange={(event) => setActionId(event.target.value)}>
                      {builtInPromptActions.map((action) => (
                        <option key={action.id} value={action.id}>{action.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="stack" style={{ gap: '8px', flex: 1, minHeight: 0 }}>
                    <label>Original Prompt / Text</label>
                    <textarea 
                      value={selectedText} 
                      onChange={(event) => setSelectedText(event.target.value)} 
                      placeholder="Select text anywhere on your device and press Ctrl+Shift+Space, or paste/type text here to improve it." 
                      style={{ flex: 1 }}
                    />
                  </div>

                  <div className="stack" style={{ gap: '8px' }}>
                    <label>Contextual Guidelines / Focus (Optional)</label>
                    <textarea 
                      className="short" 
                      value={instruction} 
                      onChange={(event) => setInstruction(event.target.value)} 
                      placeholder="e.g. rewrite as a clear system instruction, keep it highly technical, use bullet points, etc." 
                    />
                  </div>

                  <div className="button-row">
                    <button className="primary" disabled={busy} onClick={() => void runAction()} style={{ cursor: 'pointer' }}>{busy ? "Enhancing..." : "Enhance Prompt"}</button>
                    <button disabled={!output} onClick={() => setOutput("")} style={{ cursor: 'pointer' }}>Clear</button>
                  </div>
                </div>
                
                {output && (
                  <>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />

                    <div className="stack" style={{ gap: '16px' }}>
                      <div className="card-heading">
                        <div>
                          <span className="eyebrow">Output Stream ({state.settings.provider.provider} / {state.settings.provider.model})</span>
                          <h3>Enhanced Prompt</h3>
                        </div>
                      </div>
                      
                      <textarea 
                        value={output} 
                        onChange={(event) => setOutput(event.target.value)} 
                        placeholder="Improved prompt text will appear here." 
                        style={{ flex: 1 }}
                      />
                      
                      <div className="button-row">
                        <button className="primary" disabled={!output} onClick={() => void replaceOutput()} style={{ cursor: 'pointer' }}>Replace Selection</button>
                        <button disabled={!output} onClick={() => void copyOutput()} style={{ cursor: 'pointer' }}><Copy size={14} /> Copy</button>
                        <button disabled={!selectedText || busy} onClick={() => void runAction()} style={{ cursor: 'pointer' }}><RotateCcw size={14} /> Retry</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {view === "actions" && <ActionsView settings={state.settings} saveSettings={saveSettings} />}
            
            {view === "providers" && (
              <ProviderView
                state={state}
                apiKeyDraft={apiKeyDraft}
                setApiKeyDraft={setApiKeyDraft}
                saveKey={saveKey}
                clearKey={clearKey}
                saveProvider={(provider) => saveSettings({ ...state.settings, provider })}
                setStatus={setStatus}
              />
            )}

            {view === "history" && (
              <HistoryView
                items={state.history}
                historyEnabled={state.settings.historyEnabled}
                sensitiveMode={state.settings.sensitiveMode}
                onUse={(item) => {
                  setSelectedText(item.input);
                  setOutput(item.output);
                  setActionId(item.actionId);
                  setView("text");
                }}
                onClear={async () => {
                  await invoke("clear_history");
                  await refreshState();
                  setStatus("History cleared");
                }}
              />
            )}

            {view === "settings" && <SettingsView settings={state.settings} saveSettings={saveSettings} />}
          </section>
        </main>
        {renderUpdateModal()}
      </div>
    );
  }

  return (
    <div className="app-shell flex-col">
      <TitleBar status={status} view={view} updateInfo={updateInfo} onUpdateClick={() => setShowUpdateModal(true)} />
      <div className="app-body">
        <aside className="sidebar">
          <div className="brand-block">
            <div className="brand-mark">
              <img src="/logo.png" alt="MP" />
            </div>
            <div>
              <h1 className="brand-name">MeshPrompt</h1>
            </div>
          </div>
          <nav>
            <NavButton active={view === "text"} onClick={() => setView("text")} icon={<Wand2 size={15} />} label="Enhancer" />
            <NavButton active={view === "providers"} onClick={() => setView("providers")} icon={<KeyRound size={15} />} label="Test Provider" />
            <NavButton active={view === "actions"} onClick={() => setView("actions")} icon={<Sparkles size={15} />} label="Prompt Actions" />
            <NavButton active={view === "history"} onClick={() => setView("history")} icon={<History size={15} />} label="Action History" />
            <NavButton active={view === "settings"} onClick={() => setView("settings")} icon={<Settings size={15} />} label="Settings" />
          </nav>
          <div className="sidebar-footer">
            <span>{state.settings.paused ? "Shortcuts paused" : "Tray utility active"}</span>
            <strong>{state.settings.shortcut}</strong>
          </div>
        </aside>
        <main className="main-panel">
          <section className="content-scroll">
            {view === "text" && (
              <div className="stack compact-grid" style={{ gap: '24px' }}>
                <div className="stack" style={{ gap: '16px' }}>
                  <div className="card-heading">
                    <div>
                      <span className="eyebrow">Active Pipeline</span>
                      <h3>{activeAction.label}</h3>
                    </div>
                  </div>
                  
                  <div className="stack" style={{ gap: '8px' }}>
                    <label>Transformation Type</label>
                    <select value={actionId} onChange={(event) => setActionId(event.target.value)}>
                      {builtInPromptActions.map((action) => (
                        <option key={action.id} value={action.id}>{action.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="stack" style={{ gap: '8px', flex: 1, minHeight: 0 }}>
                    <label>Original Prompt / Text</label>
                    <textarea 
                      value={selectedText} 
                      onChange={(event) => setSelectedText(event.target.value)} 
                      placeholder="Select text anywhere on your device and press Ctrl+Shift+Space, or paste/type text here to improve it." 
                      style={{ flex: 1 }}
                    />
                  </div>

                  <div className="stack" style={{ gap: '8px' }}>
                    <label>Contextual Guidelines / Focus (Optional)</label>
                    <textarea 
                      className="short" 
                      value={instruction} 
                      onChange={(event) => setInstruction(event.target.value)} 
                      placeholder="e.g. rewrite as a clear system instruction, keep it highly technical, use bullet points, etc." 
                    />
                  </div>

                  <div className="button-row">
                    <button className="primary" disabled={busy} onClick={() => void runAction()} style={{ cursor: 'pointer' }}>{busy ? "Enhancing..." : "Enhance Prompt"}</button>
                    <button disabled={!output} onClick={() => setOutput("")} style={{ cursor: 'pointer' }}>Clear</button>
                  </div>
                </div>
                
                {output && (
                  <>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />

                    <div className="stack" style={{ gap: '16px' }}>
                      <div className="card-heading">
                        <div>
                          <span className="eyebrow">Output Stream ({state.settings.provider.provider} / {state.settings.provider.model})</span>
                          <h3>Enhanced Prompt</h3>
                        </div>
                      </div>
                      
                      <textarea 
                        value={output} 
                        onChange={(event) => setOutput(event.target.value)} 
                        placeholder="Improved prompt text will appear here." 
                        style={{ flex: 1 }}
                      />
                      
                      <div className="button-row">
                        <button className="primary" disabled={!output} onClick={() => void replaceOutput()} style={{ cursor: 'pointer' }}>Replace Selection</button>
                        <button disabled={!output} onClick={() => void copyOutput()} style={{ cursor: 'pointer' }}><Copy size={14} /> Copy</button>
                        <button disabled={!selectedText || busy} onClick={() => void runAction()} style={{ cursor: 'pointer' }}><RotateCcw size={14} /> Retry</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {view === "actions" && <ActionsView settings={state.settings} saveSettings={saveSettings} />}

            {view === "history" && (
              <HistoryView
                items={state.history}
                historyEnabled={state.settings.historyEnabled}
                sensitiveMode={state.settings.sensitiveMode}
                onUse={(item) => {
                  setSelectedText(item.input);
                  setOutput(item.output);
                  setActionId(item.actionId);
                  setView("text");
                }}
                onClear={async () => {
                  await invoke("clear_history");
                  await refreshState();
                  setStatus("History cleared");
                }}
              />
            )}
            
            {(view === "providers" || view === "settings") && (
              <ProviderView
                state={state}
                apiKeyDraft={apiKeyDraft}
                setApiKeyDraft={setApiKeyDraft}
                saveKey={saveKey}
                clearKey={clearKey}
                saveProvider={(provider) => saveSettings({ ...state.settings, provider })}
                saveSettings={saveSettings}
                setStatus={setStatus}
              />
            )}
          </section>
        </main>
      </div>

      {renderUpdateModal()}
    </div>
  );
}
