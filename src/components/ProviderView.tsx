import React, { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  Sliders,
  Keyboard,
  Shield,
} from "lucide-react";
import {
  getMeshPromptProvider,
  meshPromptProviders,
  MeshPromptClient,
  type MeshPromptProviderId,
} from "../lib";
import {
  Toggle,
} from "./PromptCommon";
import {
  type AppState,
  type ProviderSettings,
  type SettingsState,
  fallbackSettings,
} from "./promptService";

function HotkeyRecorder({
  value,
  onChange,
  settings,
}: {
  value: string;
  onChange: (v: string) => void;
  settings: SettingsState;
}) {
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const startCapture = async () => {
    setCapturing(true);
    try {
      await invoke("unregister_global_shortcut");
      await invoke("set_paused", { paused: true });
    } catch (e) {
      console.error("Failed to unregister global shortcut:", e);
    }
  };

  const stopCapture = async (combo?: string) => {
    setCapturing(false);
    if (combo) {
      onChange(combo);
    }
    try {
      await invoke("reregister_global_shortcut");
      await invoke("set_paused", { paused: settings.paused });
    } catch (e) {
      console.error("Failed to reregister global shortcut:", e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const parts: string[] = [];
    if (e.ctrlKey) parts.push("Ctrl");
    if (e.altKey) parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");
    if (e.metaKey) parts.push("Super");

    const k = e.code.replace("Key", "").replace("Digit", "");
    const isModifier = ["Control", "Alt", "Shift", "Meta"].includes(e.key);

    if (isModifier) {
      setError("Waiting for a non-modifier key...");
      return;
    }

    parts.push(k === "Space" ? "Space" : k.length === 1 ? k.toUpperCase() : k);
    const combo = parts.join("+");

    if (parts.length === 1) {
      setError("Please include at least one modifier (e.g. Ctrl+Shift+Space)");
      return;
    }

    setError("");
    void stopCapture(combo);
    (document.activeElement as HTMLElement)?.blur();
  };

  const keys = value.split("+").filter(Boolean);
  return (
    <div style={{ width: "100%" }}>
      <div
        ref={ref}
        tabIndex={0}
        onFocus={() => { void startCapture(); }}
        onBlur={() => { void stopCapture(); }}
        onKeyDown={capturing ? handleKeyDown : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          cursor: "pointer",
          outline: "none",
          background: capturing ? "color-mix(in oklab, var(--primary) 8%, var(--card))" : "var(--card)",
          border: `1px solid ${capturing ? "var(--primary)" : "var(--border)"}`,
          borderRadius: 10,
          transition: "all 0.15s ease",
          minHeight: "42px",
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {keys.map((k, i) => (
            <span
              key={i}
              style={{
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                borderRadius: 5,
                padding: "3px 9px",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                color: "var(--text-primary)",
              }}
            >
              {k}
            </span>
          ))}
        </div>
        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
          {capturing ? "Press keys…" : "Click to change"}
        </span>
      </div>
      {error && <p style={{ color: "#ef4444", fontSize: 11, margin: "5px 0 0 0" }}>{error}</p>}
    </div>
  );
}

export function ProviderView(props: {
  state: AppState;
  apiKeyDraft: string;
  setApiKeyDraft: (value: string) => void;
  saveKey: () => Promise<void>;
  clearKey: () => Promise<void>;
  saveProvider: (settings: ProviderSettings) => Promise<void>;
  saveSettings?: (patch: Partial<SettingsState>) => Promise<void>;
  setStatus: (value: string) => void;
}) {
  const {
    state,
    apiKeyDraft,
    setApiKeyDraft,
    saveKey,
    saveProvider,
    saveSettings,
  } = props;

  const [testing, setTesting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latency?: number; error?: string } | null>(null);
  const [originalKey, setOriginalKey] = useState("");

  const provider = getMeshPromptProvider(state.settings.provider.provider);
  const hasSavedKey = Boolean(state.keyStatus[provider.id]);

  async function handleSaveKeyClick() {
    await saveKey();
    setOriginalKey(apiKeyDraft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  useEffect(() => {
    let active = true;
    async function loadKey() {
      try {
        let key = await invoke<string | null>("get_provider_key", { provider: provider.id });
        if (!key && provider.id === "groq") {
          key = await invoke<string | null>("get_setting", { key: "api_key" });
        }
        if (active) {
          const resolvedKey = key ?? "";
          setApiKeyDraft(resolvedKey);
          setOriginalKey(resolvedKey);
          setTestResult(null);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadKey();
    return () => {
      active = false;
    };
  }, [provider.id, setApiKeyDraft]);

  async function testConnection() {
    setTesting(true);
    setTestResult(null);

    try {
      const key = apiKeyDraft.trim() || (await invoke<string | null>("get_provider_key", { provider: provider.id }));
      if (provider.authMode === "api-key" && !key) {
        throw new Error(`API Key is required for ${provider.label}.`);
      }

      const resolvedModel = state.settings.provider.model || provider.defaultModel;
      const startTime = Date.now();
      const client = new MeshPromptClient({
        provider,
        credentials: { apiKey: key ?? undefined, baseUrl: state.settings.provider.baseUrl },
        timeoutMs: Math.min(state.settings.timeoutMs, 20_000),
        appName: "MeshUtility",
      });

      await client.generate({
        model: resolvedModel,
        messages: [{ role: "user", content: "Reply brief only: Online" }],
        maxOutputTokens: 20,
        temperature: 0,
      });

      const latency = Date.now() - startTime;
      setTestResult({ success: true, latency });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      let shortError = message;
      const msg = message.toLowerCase();
      if (msg.includes("fetch") || msg.includes("network")) shortError = "Network error";
      else if (msg.includes("401") || msg.includes("api key") || msg.includes("unauthorized")) shortError = "Invalid API key";
      else if (msg.includes("404")) shortError = "Model invalid or endpoint unreachable";

      setTestResult({ success: false, error: shortError });
    } finally {
      setTesting(false);
    }
  }

  function getProviderIcon(id: string) {
    let src = "/logo-prompt.png";
    switch (id) {
      case "openai":
        src = "/openai_logo.svg";
        break;
      case "anthropic":
        src = "/anthropic_logo.svg";
        break;
      case "gemini":
        src = "/gemini_logo.svg";
        break;
      case "groq":
        src = "/groq_logo.svg";
        break;
      case "openrouter":
        src = "/openrouter_logo.svg";
        break;
      case "ollama":
        src = "/ollama_logo.svg";
        break;
    }
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "28px",
          height: "28px",
          borderRadius: "6px",
          background: "#ffffff",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          padding: "4px",
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
        }}
      >
        <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
    );
  }

  return (
    <div className="stack" style={{ maxWidth: "800px", margin: "0 auto", gap: "28px", padding: "16px 24px 48px" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)", margin: "4px 0 0 0", display: "flex", alignItems: "center", gap: "10px" }}>
          <KeyRound size={20} style={{ color: "var(--accent)" }} /> AI Providers & Models
        </h2>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "6px 0 0 0" }}>
          Configure API credentials and AI models for Cloud Dictation, Prompt Enhancer, and quick Polish actions.
        </p>
      </div>

      {/* 1. Provider Selection */}
      <div className="stack" style={{ gap: "8px" }}>
        <label style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "var(--text-secondary)" }}>
          Active AI Provider
        </label>
        <select
          value={provider.id}
          onChange={(event) => {
            const selectedId = event.target.value as MeshPromptProviderId;
            const selectedProv = getMeshPromptProvider(selectedId);
            void saveProvider({ provider: selectedId, model: selectedProv.defaultModel });
          }}
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "0 36px 0 12px",
            height: "40px",
            color: "var(--text-primary)",
            cursor: "pointer",
            width: "100%",
            fontSize: "13px",
          }}
        >
          {meshPromptProviders.map((item) => (
            <option key={item.id} value={item.id} style={{ background: "var(--surface)", color: "var(--text-primary)" }}>
              {item.label} ({item.authMode === "api-key" ? "Cloud API Key" : "Local Engine"})
            </option>
          ))}
        </select>
      </div>

      {/* 2. Provider Settings Card */}
      <div className="stack" style={{ gap: "20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {getProviderIcon(provider.id)}
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 650, color: "var(--text-primary)", margin: 0 }}>
                {provider.label}
              </h4>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {provider.authMode === "api-key" ? "Powers cloud transcription & text transformations" : "Local inference engine"}
              </span>
            </div>
          </div>
          {hasSavedKey && (
            <span style={{ fontSize: "11px", color: "#10b981", display: "flex", alignItems: "center", gap: "4px", background: "rgba(16,185,129,0.1)", padding: "4px 8px", borderRadius: "6px" }}>
              <CheckCircle2 size={12} /> Key Secured
            </span>
          )}
        </div>

        {/* Model Selection */}
        <div className="stack" style={{ gap: "8px" }}>
          <label style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "var(--text-secondary)" }}>
            Model Selection
          </label>
          <select
            value={state.settings.provider.model}
            onChange={(event) => void saveProvider({ ...state.settings.provider, model: event.target.value })}
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "0 36px 0 12px",
              height: "38px",
              color: "var(--text-primary)",
              cursor: "pointer",
              width: "100%",
            }}
          >
            {provider.models.map((model) => (
              <option key={model.id} value={model.id} style={{ background: "var(--surface)", color: "var(--text-primary)" }}>
                {model.label} ({model.id})
              </option>
            ))}
          </select>
        </div>

        {/* API Key Input */}
        {provider.authMode === "api-key" && (
          <div className="stack" style={{ gap: "8px" }}>
            <label style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "var(--text-secondary)" }}>
              {provider.label} API Key
            </label>
            <div className="row-input" style={{ position: "relative", display: "flex", width: "100%" }}>
              <input
                type={showKey ? "text" : "password"}
                value={apiKeyDraft}
                onChange={(event) => setApiKeyDraft(event.target.value)}
                placeholder={hasSavedKey ? "••••••••••••••••••••••••••••••••" : `Enter your ${provider.label} API Key`}
                style={{
                  flex: 1,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "0 40px 0 12px",
                  height: "38px",
                  color: "var(--text-primary)",
                  fontFamily: apiKeyDraft ? "inherit" : "'JetBrains Mono', monospace",
                }}
              />
              <button
                type="button"
                className="link-button"
                onClick={() => setShowKey(!showKey)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  height: "auto",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
              Stored locally with OS encryption. Automatically shared between Cloud Dictation and Prompt Enhancer.
            </p>
          </div>
        )}

        {/* Custom Base URL Override */}
        {provider.supportsCustomBaseUrl && (
          <div className="stack" style={{ gap: "8px" }}>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{ alignSelf: "flex-start", padding: 0, border: "none", background: "none", color: "var(--accent)", cursor: "pointer", fontSize: "12px" }}
            >
              {showAdvanced ? "▲ Hide Base URL override" : "▼ Configure Custom Base URL"}
            </button>
            {showAdvanced && (
              <div className="stack" style={{ gap: "8px", width: "100%" }}>
                <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                  <input
                    value={state.settings.provider.baseUrl ?? ""}
                    onChange={(event) => void saveProvider({ ...state.settings.provider, baseUrl: event.target.value })}
                    placeholder={provider.endpoint.baseUrl}
                    style={{
                      flex: 1,
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: "0 12px",
                      height: "38px",
                      color: "var(--text-primary)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void saveProvider({ ...state.settings.provider, baseUrl: "" })}
                    style={{
                      background: "var(--muted)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: "0 16px",
                      cursor: "pointer",
                      height: "38px",
                      color: "var(--text-primary)",
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Buttons: Save & Test */}
        <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
          {provider.authMode === "api-key" && (
            <button
              className={saved ? "btn-premium-save-success" : "btn-premium-save"}
              disabled={!saved && (!apiKeyDraft.trim() || apiKeyDraft === originalKey)}
              onClick={handleSaveKeyClick}
              style={{ flex: 1, height: "40px", borderRadius: "8px" }}
            >
              {saved ? "Saved" : "Save API Key"}
            </button>
          )}

          <button
            type="button"
            className="btn-premium-test"
            onClick={() => void testConnection()}
            disabled={testing || (provider.authMode === "api-key" && !hasSavedKey && !apiKeyDraft.trim())}
            style={{ flex: 1, height: "40px", borderRadius: "8px", cursor: "pointer" }}
          >
            {testing ? "Testing Ping..." : "Test Connection"}
          </button>
        </div>

        {testResult && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "8px", background: testResult.success ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${testResult.success ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: testResult.success ? "#10b981" : "#ef4444",
                boxShadow: testResult.success ? "0 0 8px rgba(16, 185, 129, 0.6)" : "0 0 8px rgba(239, 68, 68, 0.6)",
              }}
            />
            <span style={{ fontSize: "12px", fontWeight: 500, color: testResult.success ? "#10b981" : "#ef4444" }}>
              {testResult.success ? `Connection Successful (${testResult.latency}ms latency)` : `Connection Failed: ${testResult.error || "Check credentials"}`}
            </span>
          </div>
        )}
      </div>

      {/* 3. Generation Parameters */}
      {saveSettings && (
        <div className="stack" style={{ gap: "16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sliders size={16} style={{ color: "var(--accent)" }} />
            <h4 style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Generation Parameters
            </h4>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="stack" style={{ gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Creativity / Temperature</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{state.settings.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={state.settings.temperature}
                onChange={(e) => void saveSettings({ temperature: parseFloat(e.target.value) })}
                style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer" }}
              />
            </div>

            <div className="stack" style={{ gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Max Output Tokens</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{state.settings.maxOutputTokens}</span>
              </div>
              <input
                type="range"
                min="256"
                max="4096"
                step="128"
                value={state.settings.maxOutputTokens}
                onChange={(e) => void saveSettings({ maxOutputTokens: parseInt(e.target.value, 10) })}
                style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Prompt Studio Shortcuts & Privacy */}
      {saveSettings && (
        <div className="stack" style={{ gap: "16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Keyboard size={16} style={{ color: "var(--accent)" }} />
            <h4 style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Prompt Studio Activation Shortcut
            </h4>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <HotkeyRecorder
                value={state.settings.shortcut}
                onChange={(combo) => void saveSettings({ shortcut: combo })}
                settings={state.settings}
              />
            </div>
            <button
              type="button"
              onClick={async () => {
                await saveSettings({ shortcut: fallbackSettings.shortcut });
              }}
              style={{
                background: "var(--muted)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "0 16px",
                cursor: "pointer",
                height: "42px",
                color: "var(--text-primary)",
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              Reset
            </button>
          </div>

          <Toggle
            label="Pause prompt shortcut activation"
            checked={state.settings.paused}
            onChange={async (paused) => {
              await invoke("set_paused", { paused });
              await saveSettings({ paused });
            }}
          />

          <div style={{ borderBottom: "1px solid var(--border)", margin: "4px 0" }} />

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Shield size={16} style={{ color: "var(--accent)" }} />
            <h4 style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Privacy & Automation
            </h4>
          </div>

          <div className="stack" style={{ gap: "4px" }}>
            <Toggle
              label="Restore clipboard after text replacement"
              checked={state.settings.restoreClipboard}
              onChange={(restoreClipboard) => void saveSettings({ restoreClipboard })}
            />
            <Toggle
              label="Save action execution history"
              checked={state.settings.historyEnabled}
              onChange={(historyEnabled) => void saveSettings({ historyEnabled })}
            />
            <Toggle
              label="Mask sensitive data in history"
              checked={state.settings.sensitiveMode}
              onChange={(sensitiveMode) => void saveSettings({ sensitiveMode })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
