import React from "react";
import ReactDOM from "react-dom/client";
import { listen } from "@tauri-apps/api/event";
import { OverlayApp } from "./components/PromptApp";
import { applyThemeById, applyStoredTheme } from "./lib/appearance";
import "./styles-prompt.css";

applyStoredTheme();
listen<string>("appearance-theme-changed", (event) => applyThemeById(event.payload)).catch(() => {});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <OverlayApp />
  </React.StrictMode>,
);
