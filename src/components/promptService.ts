import { invoke } from "@tauri-apps/api/core";
import {
  MeshPromptClient,
  MeshPromptProviderError,
  builtInPromptActions,
  buildPromptActionRequest,
  getMeshPromptProvider,
  type MeshPromptProviderId,
} from "../lib";

export type View = "text" | "providers" | "actions" | "history" | "settings";
export type OverlayPhase = "picker" | "processing" | "result";

export interface ProviderSettings {
  provider: MeshPromptProviderId;
  model: string;
  baseUrl?: string;
}

export interface SettingsState {
  provider: ProviderSettings;
  shortcut: string;
  closeToTray: boolean;
  runInTray: boolean;
  launchAtStartup: boolean;
  restoreClipboard: boolean;
  historyEnabled: boolean;
  sensitiveMode: boolean;
  timeoutMs: number;
  maxOutputTokens: number;
  temperature: number;
  defaultActionId: string;
  paused: boolean;
  enhancePromptMode: "auto" | "concise" | "structured" | "detailed";
}

export interface HistoryItem {
  id: string;
  actionId: string;
  actionLabel: string;
  provider: MeshPromptProviderId;
  model: string;
  input: string;
  output: string;
  createdAt: string;
}

export interface AppState {
  settings: SettingsState;
  history: HistoryItem[];
  keyStatus: Record<string, boolean>;
}

export interface ConsoleLine {
  type: "sys" | "net" | "err" | "success";
  text: string;
}

export const fallbackSettings: SettingsState = {
  provider: { provider: "groq", model: "llama-3.1-8b-instant" },
  shortcut: "Ctrl+Shift+Space",
  closeToTray: true,
  runInTray: true,
  launchAtStartup: true,
  restoreClipboard: true,
  historyEnabled: true,
  sensitiveMode: false,
  timeoutMs: 60_000,
  maxOutputTokens: 1_800,
  temperature: 0.35,
  defaultActionId: "enhance-prompt",
  paused: false,
  enhancePromptMode: "auto",
};

export async function generateWithCurrentProvider(
  settings: SettingsState,
  actionId: string,
  selectedText: string,
  userInstruction = "",
) {
  // Always enforce Groq for MeshPrompt!
  const providerDef = getMeshPromptProvider("groq");
  const key = await invoke<string | null>("get_provider_key", { provider: "groq" });
  
  if (!key) {
    throw new Error("Groq API Key is not configured. Configure it in Provider Settings.");
  }

  const isGroq = settings.provider.provider === "groq";
  const model = isGroq && settings.provider.model
    ? settings.provider.model
    : "llama-3.3-70b-versatile";

  if (!selectedText.trim()) {
    throw new Error("Add text to enhance first.");
  }

  const action = builtInPromptActions.find((item) => item.id === actionId) ?? builtInPromptActions[0];
  const request = buildPromptActionRequest(action, { selectedText, userInstruction, settings });
  const client = new MeshPromptClient({
    provider: providerDef,
    credentials: { apiKey: key ?? undefined, baseUrl: "https://api.groq.com/openai/v1" },
    timeoutMs: settings.timeoutMs,
    appName: "MeshPrompt",
  });
  return client.generate({
    ...request.options,
    model,
    temperature: settings.temperature,
    maxOutputTokens: settings.maxOutputTokens,
    messages: request.messages,
  });
}

export function errorMessage(error: unknown): string {
  if (error instanceof MeshPromptProviderError) {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "MeshPrompt action failed.";
}
