<div align="center">

<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="16" fill="#141414"/>
  <rect x="0.5" y="0.5" width="63" height="63" rx="15.5" stroke="#2C2C2C" stroke-width="1"/>
  <svg x="12" y="12" width="40" height="40" viewBox="0 0 48 46" fill="none">
    <path fill="#F26A4B" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" />
  </svg>
</svg>

# MeshUtility

**Open-source desktop utility for AI-powered voice dictation and prompt enhancement.**

Built with Tauri 2, React, and Rust. Works fully offline with local Whisper models or online via Groq, OpenAI, Anthropic, and more.

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg?style=flat-square&labelColor=111&color=F26A4B)](LICENSE)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-orange?style=flat-square&labelColor=111&color=F26A4B)](https://tauri.app)
[![Platform](https://img.shields.io/badge/Platform-Windows-orange?style=flat-square&labelColor=111&color=F26A4B)](https://github.com/Jenesh11/MeshUtility/releases)

</div>

---

## Overview

MeshUtility is a tray-resident desktop app combining two powerful tools:

**Voice Dictation** — Hold your hotkey, speak, release. Your words are transcribed and injected into any text field, in any app. Supports local offline Whisper models and cloud Groq Whisper API.

**Prompt Enhancer** — Select text anywhere, hit your shortcut, and an AI rewrites it. Supports Groq, OpenAI, Anthropic, Gemini, Mistral, and any OpenAI-compatible API. Results stream directly in a floating overlay.

---

## Interface

<div align="center">

### Main Window

<svg width="800" height="540" viewBox="0 0 800 540" fill="none" xmlns="http://www.w3.org/2000/svg" style="border-radius:12px; display:block; margin:0 auto; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
  <defs>
    <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="46" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#F26A4B"/>
      <stop offset="100%" stop-color="#E05A38"/>
    </linearGradient>
  </defs>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&amp;family=JetBrains+Mono:wght@400;500;600&amp;family=Instrument+Serif&amp;display=swap');
    .title-text { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; fill: #8E8A83; letter-spacing: 0.12em; }
    .side-eyebrow { font-family: 'DM Sans', sans-serif; font-size: 9.5px; font-weight: 700; fill: #8E8A83; letter-spacing: 0.08em; text-transform: uppercase; }
    .side-btn { font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500; }
    .card-label { font-family: 'DM Sans', sans-serif; font-size: 11px; fill: #8E8A83; }
    .card-val { font-family: 'DM Sans', sans-serif; font-size: 18px; font-weight: 600; fill: #E8E3DA; }
    .mono-text { font-family: 'JetBrains Mono', monospace; font-size: 10px; fill: #8E8A83; }
    .body-text { font-family: 'DM Sans', sans-serif; font-size: 13px; fill: #E8E3DA; }
    .italic-title { font-family: 'Instrument Serif', serif; font-style: italic; font-size: 20px; fill: #E8E3DA; }
  </style>

  <!-- Window Frame -->
  <rect width="800" height="540" rx="8" fill="#141414" stroke="#2C2C2C" stroke-width="1"/>

  <!-- Title bar -->
  <rect width="800" height="40" fill="#101010"/>
  <line x1="0" y1="40" x2="800" y2="40" stroke="#2C2C2C" stroke-width="1"/>

  <!-- Title bar content -->
  <g transform="translate(320, 11)">
    <rect width="18" height="18" rx="5" fill="#141414" stroke="#2C2C2C" stroke-width="1"/>
    <svg x="3.5" y="3.5" width="11" height="11" viewBox="0 0 48 46" fill="none">
      <path fill="url(#logoGrad)" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" />
    </svg>
    <text x="26" y="13" class="title-text">MeshUtility Suite</text>
  </g>

  <!-- Window dots -->
  <circle cx="738" cy="20" r="5" fill="#3a3a3a"/>
  <circle cx="754" cy="20" r="5" fill="#3a3a3a"/>
  <circle cx="770" cy="20" r="5" fill="#EF4444" opacity="0.8"/>

  <!-- Sidebar -->
  <rect x="0" y="40" width="210" height="500" fill="#101010"/>
  <line x1="210" y1="40" x2="210" y2="540" stroke="#2C2C2C" stroke-width="1"/>

  <!-- Sidebar Navigation -->
  <text x="20" y="72" class="side-eyebrow">Voice Dictation</text>

  <!-- Nav: Dictation History (Active) -->
  <g transform="translate(8, 80)">
    <rect width="194" height="30" rx="6" fill="#1C1C1C" stroke="#2C2C2C" stroke-width="1"/>
    <svg x="12" y="7" width="15" height="15" fill="none" stroke="#E8E3DA" stroke-width="1.8" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <text x="36" y="19" class="side-btn" fill="#E8E3DA">Dictation History</text>
  </g>

  <!-- Nav: Custom Dictionary -->
  <g transform="translate(8, 114)">
    <rect width="194" height="30" rx="6" fill="transparent"/>
    <svg x="12" y="7" width="15" height="15" fill="none" stroke="#8E8A83" stroke-width="1.8" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
    <text x="36" y="19" class="side-btn" fill="#8E8A83">Custom Dictionary</text>
  </g>

  <text x="20" y="172" class="side-eyebrow">Prompt Enhancer</text>

  <!-- Nav: Enhance Prompt -->
  <g transform="translate(8, 180)">
    <rect width="194" height="30" rx="6" fill="transparent"/>
    <svg x="12" y="7" width="15" height="15" fill="none" stroke="#8E8A83" stroke-width="1.8" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9.828 3h3.982m-3.982 4h2.982M3 21l9-9m1.12-1.12a1.5 1.5 0 112.12-2.12l-2.12 2.12zm1.41-5.66a5 5 0 11-7.07 7.07l7.07-7.07z" />
    </svg>
    <text x="36" y="19" class="side-btn" fill="#8E8A83">Enhance Prompt</text>
  </g>

  <!-- Nav: Prompt Actions -->
  <g transform="translate(8, 214)">
    <rect width="194" height="30" rx="6" fill="transparent"/>
    <svg x="12" y="7" width="15" height="15" fill="none" stroke="#8E8A83" stroke-width="1.8" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.286L13 21l-2.286-5.714L5 12l5.714-2.286L13 3z" />
    </svg>
    <text x="36" y="19" class="side-btn" fill="#8E8A83">Prompt Actions</text>
  </g>

  <!-- Nav: Action History -->
  <g transform="translate(8, 248)">
    <rect width="194" height="30" rx="6" fill="transparent"/>
    <svg x="12" y="7" width="15" height="15" fill="none" stroke="#8E8A83" stroke-width="1.8" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
    <text x="36" y="19" class="side-btn" fill="#8E8A83">Action History</text>
  </g>

  <text x="20" y="304" class="side-eyebrow">Configuration</text>

  <!-- Nav: Voice Settings -->
  <g transform="translate(8, 312)">
    <rect width="194" height="30" rx="6" fill="transparent"/>
    <svg x="12" y="7" width="15" height="15" fill="none" stroke="#8E8A83" stroke-width="1.8" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
    <text x="36" y="19" class="side-btn" fill="#8E8A83">Voice Settings</text>
  </g>

  <!-- Nav: AI Providers -->
  <g transform="translate(8, 346)">
    <rect width="194" height="30" rx="6" fill="transparent"/>
    <svg x="12" y="7" width="15" height="15" fill="none" stroke="#8E8A83" stroke-width="1.8" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M8 11a3 3 0 11-6 0 3 3 0 016 0zm0 0v.18a2 2 0 00.586 1.414l6.586 6.586a1 1 0 001.414 0l1.586-1.586a1 1 0 000-1.414l-1.086-1.086a1 1 0 01-.293-.707V15a1 1 0 00-1-1h-1.586a1 1 0 01-.707-.293l-1.414-1.414A1 1 0 0010 11.18V11z" />
    </svg>
    <text x="36" y="19" class="side-btn" fill="#8E8A83">AI Providers</text>
  </g>

  <!-- Nav: Enhancer Settings -->
  <g transform="translate(8, 380)">
    <rect width="194" height="30" rx="6" fill="transparent"/>
    <svg x="12" y="7" width="15" height="15" fill="none" stroke="#8E8A83" stroke-width="1.8" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
    <text x="36" y="19" class="side-btn" fill="#8E8A83">Enhancer Settings</text>
  </g>

  <!-- Sidebar Footer Meta Box -->
  <line x1="0" y1="438" x2="210" y2="438" stroke="#2C2C2C" stroke-width="1"/>
  <g transform="translate(12, 452)">
    <rect width="186" height="74" rx="10" fill="rgba(255, 255, 255, 0.015)" stroke="#2C2C2C" stroke-width="1"/>
    <g transform="translate(10, 10)">
      <rect width="26" height="26" rx="6" fill="#141414" stroke="#2C2C2C" stroke-width="1"/>
      <svg x="4.5" y="4.5" width="17" height="17" viewBox="0 0 48 46" fill="none">
        <path fill="url(#logoGrad)" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" />
      </svg>
      <text x="36" y="17" font-family="'DM Sans', sans-serif" font-size="12px" font-weight="600" fill="#E8E3DA">MeshUtility</text>
      <rect x="134" y="3" width="34" height="15" rx="7" fill="rgba(242, 106, 75, 0.08)" stroke="rgba(242, 106, 75, 0.2)" stroke-width="1"/>
      <text x="151" y="13" font-family="'JetBrains Mono', monospace" font-size="8.5px" font-weight="500" fill="#F26A4B" text-anchor="middle">v2.4</text>
    </g>
    <g transform="translate(10, 44)">
      <rect width="166" height="19" rx="6" fill="rgba(16, 185, 129, 0.08)" stroke="rgba(16, 185, 129, 0.2)" stroke-width="1"/>
      <circle cx="16" cy="9.5" r="3.5" fill="#10B981" opacity="0.4"/>
      <circle cx="16" cy="9.5" r="2" fill="#10B981"/>
      <text x="28" y="13" font-family="'DM Sans', sans-serif" font-size="9.5px" font-weight="500" fill="#10B981">Local Whisper active</text>
    </g>
  </g>

  <!-- Right Content Area (Voice History Dashboard) -->
  <g transform="translate(232, 58)">
    <circle cx="4" cy="-5" r="4" fill="#10B981"/>
    <text x="14" y="0" class="italic-title">MeshVoice</text>
  </g>

  <!-- Engine toggle -->
  <g transform="translate(674, 46)">
    <rect width="102" height="24" rx="7" fill="#1C1C1C"/>
    <rect x="2" y="2" width="49" height="20" rx="5" fill="#222222" stroke="#2C2C2C" stroke-width="1"/>
    <text x="26.5" y="15" font-family="'DM Sans', sans-serif" font-size="10.5px" font-weight="600" fill="#E8E3DA" text-anchor="middle">Local</text>
    <text x="76.5" y="15" font-family="'DM Sans', sans-serif" font-size="10.5px" font-weight="500" fill="#8E8A83" text-anchor="middle">Cloud</text>
  </g>

  <!-- Stats Grid -->
  <g transform="translate(232, 88)">
    <!-- Card 1 -->
    <g transform="translate(0, 0)">
      <rect width="128" height="54" rx="10" fill="#1C1C1C" stroke="#2C2C2C" stroke-width="1"/>
      <text x="12" y="18" class="card-label">Total words</text>
      <text x="12" y="40" class="card-val" fill="#F26A4B">4,821</text>
    </g>
    <!-- Card 2 -->
    <g transform="translate(140, 0)">
      <rect width="128" height="54" rx="10" fill="#1C1C1C" stroke="#2C2C2C" stroke-width="1"/>
      <text x="12" y="18" class="card-label">Minutes spoken</text>
      <text x="12" y="40" class="card-val">15.4m</text>
    </g>
    <!-- Card 3 -->
    <g transform="translate(280, 0)">
      <rect width="128" height="54" rx="10" fill="#1C1C1C" stroke="#2C2C2C" stroke-width="1"/>
      <text x="12" y="18" class="card-label">Sessions</text>
      <text x="12" y="40" class="card-val">128</text>
    </g>
    <!-- Card 4 -->
    <g transform="translate(420, 0)">
      <rect width="124" height="54" rx="10" fill="#1C1C1C" stroke="#2C2C2C" stroke-width="1"/>
      <text x="12" y="18" class="card-label">Avg WPM</text>
      <text x="12" y="40" class="card-val">135</text>
    </g>
  </g>

  <!-- History section title -->
  <g transform="translate(232, 172)">
    <text x="0" y="0" class="side-eyebrow">History <tspan fill="#2C2C2C" font-weight="500">(2/10)</tspan></text>
    <rect x="476" y="-12" width="68" height="18" rx="5" fill="none" stroke="#2C2C2C" stroke-width="1"/>
    <text x="510" y="0" font-family="'DM Sans', sans-serif" font-size="10px" font-weight="500" fill="#8E8A83" text-anchor="middle">Delete all</text>
  </g>

  <!-- History Items List -->
  <!-- Item 1 -->
  <g transform="translate(232, 188)">
    <rect width="544" height="154" rx="10" fill="#1C1C1C" stroke="#2C2C2C" stroke-width="1"/>
    <text x="16" y="24" class="mono-text" fill="#8E8A83">May 31, 5:05 PM</text>
    <g transform="translate(460, 10)">
      <rect width="20" height="20" rx="4" fill="none" stroke="#2C2C2C" stroke-width="1"/>
      <svg x="5" y="5" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8E8A83" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
      <rect x="26" width="22" height="20" rx="4" fill="none" stroke="#2C2C2C" stroke-width="1"/>
      <text x="37" y="13" font-family="'DM Sans', sans-serif" font-size="9px" font-weight="600" fill="#8E8A83" text-anchor="middle">Dict</text>
      <rect x="54" width="20" height="20" rx="4" fill="none" stroke="#2C2C2C" stroke-width="1"/>
      <svg x="59" y="5" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8E8A83" stroke-width="2">
        <polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
      </svg>
    </g>
    <text x="16" y="50" class="body-text" font-weight="400">"Let's schedule the design review for next Thursday at 3pm."</text>
    <g transform="translate(16, 70)">
      <rect width="26" height="14" rx="4" fill="#141414" stroke="#2C2C2C" stroke-width="1"/>
      <text x="13" y="10" class="mono-text" font-size="8.5px" text-anchor="middle" fill="#8E8A83">9w</text>
      <rect x="32" width="34" height="14" rx="4" fill="#141414" stroke="#2C2C2C" stroke-width="1"/>
      <text x="49" y="10" class="mono-text" font-size="8.5px" text-anchor="middle" fill="#8E8A83">2.1s</text>
      <rect x="72" width="36" height="14" rx="4" fill="#141414" stroke="#2C2C2C" stroke-width="1"/>
      <text x="90" y="10" class="mono-text" font-size="8.5px" text-anchor="middle" fill="#8E8A83">local</text>
    </g>
    <g transform="translate(16, 96)">
      <rect width="512" height="42" rx="8" fill="#222222" stroke="#2C2C2C" stroke-width="1"/>
      <circle cx="28" cy="21" r="13" fill="#1C1C1C" stroke="#2C2C2C" stroke-width="1"/>
      <path d="M26 17 L32 21 L26 25 Z" fill="#8E8A83"/>
      <rect x="52" y="19" width="392" height="4" rx="2" fill="#1C1C1C"/>
      <rect x="52" y="19" width="156" height="4" rx="2" fill="#F26A4B"/>
      <circle cx="208" cy="21" r="5" fill="#F26A4B"/>
      <text x="496" y="24" class="mono-text" font-size="9px" text-anchor="end">0:02</text>
    </g>
  </g>

  <!-- Item 2 -->
  <g transform="translate(232, 356)">
    <rect width="544" height="154" rx="10" fill="#1C1C1C" stroke="#2C2C2C" stroke-width="1"/>
    <text x="16" y="24" class="mono-text" fill="#8E8A83">May 31, 4:50 PM</text>
    <g transform="translate(460, 10)">
      <rect width="20" height="20" rx="4" fill="none" stroke="#2C2C2C" stroke-width="1"/>
      <svg x="5" y="5" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8E8A83" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
      <rect x="26" width="22" height="20" rx="4" fill="none" stroke="#2C2C2C" stroke-width="1"/>
      <text x="37" y="13" font-family="'DM Sans', sans-serif" font-size="9px" font-weight="600" fill="#8E8A83" text-anchor="middle">Dict</text>
      <rect x="54" width="20" height="20" rx="4" fill="none" stroke="#2C2C2C" stroke-width="1"/>
      <svg x="59" y="5" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8E8A83" stroke-width="2">
        <polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
      </svg>
    </g>
    <text x="16" y="50" class="body-text" font-weight="400">"Can you pull up the latest analytics dashboard and send me the link?"</text>
    <g transform="translate(16, 70)">
      <rect width="28" height="14" rx="4" fill="#141414" stroke="#2C2C2C" stroke-width="1"/>
      <text x="14" y="10" class="mono-text" font-size="8.5px" text-anchor="middle" fill="#8E8A83">13w</text>
      <rect x="34" width="34" height="14" rx="4" fill="#141414" stroke="#2C2C2C" stroke-width="1"/>
      <text x="51" y="10" class="mono-text" font-size="8.5px" text-anchor="middle" fill="#8E8A83">3.4s</text>
      <rect x="74" width="36" height="14" rx="4" fill="#141414" stroke="#2C2C2C" stroke-width="1"/>
      <text x="92" y="10" class="mono-text" font-size="8.5px" text-anchor="middle" fill="#8E8A83">local</text>
    </g>
    <g transform="translate(16, 96)">
      <rect width="512" height="42" rx="8" fill="#222222" stroke="#2C2C2C" stroke-width="1"/>
      <circle cx="28" cy="21" r="13" fill="#1C1C1C" stroke="#2C2C2C" stroke-width="1"/>
      <path d="M26 17 L32 21 L26 25 Z" fill="#8E8A83"/>
      <rect x="52" y="19" width="392" height="4" rx="2" fill="#1C1C1C"/>
      <text x="496" y="24" class="mono-text" font-size="9px" text-anchor="end">0:03</text>
    </g>
  </g>
</svg>

<br/>

### Prompt Enhancer

<svg width="800" height="540" viewBox="0 0 800 540" fill="none" xmlns="http://www.w3.org/2000/svg" style="border-radius:12px; display:block; margin:0 auto; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
  <defs>
    <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="46" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#F26A4B"/>
      <stop offset="100%" stop-color="#E05A38"/>
    </linearGradient>
  </defs>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&amp;family=JetBrains+Mono:wght@400;500;600&amp;family=Instrument+Serif&amp;display=swap');
    .title-text { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; fill: #8E8A83; letter-spacing: 0.12em; }
    .side-eyebrow { font-family: 'DM Sans', sans-serif; font-size: 9.5px; font-weight: 700; fill: #8E8A83; letter-spacing: 0.08em; text-transform: uppercase; }
    .side-btn { font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500; }
    .card-eyebrow { font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 600; fill: #8E8A83; text-transform: uppercase; letter-spacing: 0.05em; }
    .card-title { font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; fill: #E8E3DA; }
    .input-label { font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 600; fill: #8E8A83; text-transform: uppercase; letter-spacing: 0.05em; }
    .body-input { font-family: 'DM Sans', sans-serif; font-size: 12px; fill: #E8E3DA; }
    .body-placeholder { font-family: 'DM Sans', sans-serif; font-size: 11px; fill: #3A3A3A; }
    .btn-text { font-family: 'DM Sans', sans-serif; font-size: 11.5px; font-weight: 600; }
    .italic-title { font-family: 'Instrument Serif', serif; font-style: italic; font-size: 20px; fill: #E8E3DA; }
  </style>

  <!-- Window Frame -->
  <rect width="800" height="540" rx="8" fill="#141414" stroke="#2C2C2C" stroke-width="1"/>

  <!-- Title bar -->
  <rect width="800" height="40" fill="#101010"/>
  <line x1="0" y1="40" x2="800" y2="40" stroke="#2C2C2C" stroke-width="1"/>

  <!-- Title bar content -->
  <g transform="translate(320, 11)">
    <rect width="18" height="18" rx="5" fill="#141414" stroke="#2C2C2C" stroke-width="1"/>
    <svg x="3.5" y="3.5" width="11" height="11" viewBox="0 0 48 46" fill="none">
      <path fill="url(#logoGrad)" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" />
    </svg>
    <text x="26" y="13" class="title-text">MeshUtility Suite</text>
  </g>

  <!-- Window dots -->
  <circle cx="738" cy="20" r="5" fill="#3a3a3a"/>
  <circle cx="754" cy="20" r="5" fill="#3a3a3a"/>
  <circle cx="770" cy="20" r="5" fill="#EF4444" opacity="0.8"/>

  <!-- Sidebar -->
  <rect x="0" y="40" width="210" height="500" fill="#101010"/>
  <line x1="210" y1="40" x2="210" y2="540" stroke="#2C2C2C" stroke-width="1"/>

  <!-- Sidebar Navigation -->
  <text x="20" y="72" class="side-eyebrow">Voice Dictation</text>

  <!-- Nav: Dictation History -->
  <g transform="translate(8, 80)">
    <rect width="194" height="30" rx="6" fill="transparent"/>
    <svg x="12" y="7" width="15" height="15" fill="none" stroke="#8E8A83" stroke-width="1.8" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <text x="36" y="19" class="side-btn" fill="#8E8A83">Dictation History</text>
  </g>

  <!-- Nav: Custom Dictionary -->
  <g transform="translate(8, 114)">
    <rect width="194" height="30" rx="6" fill="transparent"/>
    <svg x="12" y="7" width="15" height="15" fill="none" stroke="#8E8A83" stroke-width="1.8" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
    <text x="36" y="19" class="side-btn" fill="#8E8A83">Custom Dictionary</text>
  </g>

  <text x="20" y="172" class="side-eyebrow">Prompt Enhancer</text>

  <!-- Nav: Enhance Prompt (Active) -->
  <g transform="translate(8, 180)">
    <rect width="194" height="30" rx="6" fill="#1C1C1C" stroke="#2C2C2C" stroke-width="1"/>
    <svg x="12" y="7" width="15" height="15" fill="none" stroke="#E8E3DA" stroke-width="1.8" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9.828 3h3.982m-3.982 4h2.982M3 21l9-9m1.12-1.12a1.5 1.5 0 112.12-2.12l-2.12 2.12zm1.41-5.66a5 5 0 11-7.07 7.07l7.07-7.07z" />
    </svg>
    <text x="36" y="19" class="side-btn" fill="#E8E3DA">Enhance Prompt</text>
  </g>

  <!-- Nav: Prompt Actions -->
  <g transform="translate(8, 214)">
    <rect width="194" height="30" rx="6" fill="transparent"/>
    <svg x="12" y="7" width="15" height="15" fill="none" stroke="#8E8A83" stroke-width="1.8" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.286L13 21l-2.286-5.714L5 12l5.714-2.286L13 3z" />
    </svg>
    <text x="36" y="19" class="side-btn" fill="#8E8A83">Prompt Actions</text>
  </g>

  <!-- Nav: Action History -->
  <g transform="translate(8, 248)">
    <rect width="194" height="30" rx="6" fill="transparent"/>
    <svg x="12" y="7" width="15" height="15" fill="none" stroke="#8E8A83" stroke-width="1.8" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
    <text x="36" y="19" class="side-btn" fill="#8E8A83">Action History</text>
  </g>

  <text x="20" y="304" class="side-eyebrow">Configuration</text>

  <!-- Nav: Voice Settings -->
  <g transform="translate(8, 312)">
    <rect width="194" height="30" rx="6" fill="transparent"/>
    <svg x="12" y="7" width="15" height="15" fill="none" stroke="#8E8A83" stroke-width="1.8" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
    <text x="36" y="19" class="side-btn" fill="#8E8A83">Voice Settings</text>
  </g>

  <!-- Nav: AI Providers -->
  <g transform="translate(8, 346)">
    <rect width="194" height="30" rx="6" fill="transparent"/>
    <svg x="12" y="7" width="15" height="15" fill="none" stroke="#8E8A83" stroke-width="1.8" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M8 11a3 3 0 11-6 0 3 3 0 016 0zm0 0v.18a2 2 0 00.586 1.414l6.586 6.586a1 1 0 001.414 0l1.586-1.586a1 1 0 000-1.414l-1.086-1.086a1 1 0 01-.293-.707V15a1 1 0 00-1-1h-1.586a1 1 0 01-.707-.293l-1.414-1.414A1 1 0 0010 11.18V11z" />
    </svg>
    <text x="36" y="19" class="side-btn" fill="#8E8A83">AI Providers</text>
  </g>

  <!-- Nav: Enhancer Settings -->
  <g transform="translate(8, 380)">
    <rect width="194" height="30" rx="6" fill="transparent"/>
    <svg x="12" y="7" width="15" height="15" fill="none" stroke="#8E8A83" stroke-width="1.8" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
    <text x="36" y="19" class="side-btn" fill="#8E8A83">Enhancer Settings</text>
  </g>

  <!-- Sidebar Footer Meta Box -->
  <line x1="0" y1="438" x2="210" y2="438" stroke="#2C2C2C" stroke-width="1"/>
  <g transform="translate(12, 452)">
    <rect width="186" height="74" rx="10" fill="rgba(255, 255, 255, 0.015)" stroke="#2C2C2C" stroke-width="1"/>
    <g transform="translate(10, 10)">
      <rect width="26" height="26" rx="6" fill="#141414" stroke="#2C2C2C" stroke-width="1"/>
      <svg x="4.5" y="4.5" width="17" height="17" viewBox="0 0 48 46" fill="none">
        <path fill="url(#logoGrad)" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" />
      </svg>
      <text x="36" y="17" font-family="'DM Sans', sans-serif" font-size="12px" font-weight="600" fill="#E8E3DA">MeshUtility</text>
      <rect x="134" y="3" width="34" height="15" rx="7" fill="rgba(242, 106, 75, 0.08)" stroke="rgba(242, 106, 75, 0.2)" stroke-width="1"/>
      <text x="151" y="13" font-family="'JetBrains Mono', monospace" font-size="8.5px" font-weight="500" fill="#F26A4B" text-anchor="middle">v2.4</text>
    </g>
    <g transform="translate(10, 44)">
      <rect width="166" height="19" rx="6" fill="rgba(16, 185, 129, 0.08)" stroke="rgba(16, 185, 129, 0.2)" stroke-width="1"/>
      <circle cx="16" cy="9.5" r="3.5" fill="#10B981" opacity="0.4"/>
      <circle cx="16" cy="9.5" r="2" fill="#10B981"/>
      <text x="28" y="13" font-family="'DM Sans', sans-serif" font-size="9.5px" font-weight="500" fill="#10B981">Local Whisper active</text>
    </g>
  </g>

  <!-- Right Content Area (Prompt Enhancer - Two Card Layout) -->
  <g transform="translate(232, 58)">
    <text x="0" y="0" class="italic-title">MeshPrompt</text>
  </g>

  <!-- Two-card grid -->
  <!-- Left Card (Active Pipeline / Inputs) -->
  <g transform="translate(232, 88)">
    <rect width="266" height="424" rx="10" fill="#1C1C1C" stroke="#2C2C2C" stroke-width="1"/>
    
    <!-- Card Heading -->
    <g transform="translate(16, 16)">
      <text x="0" y="10" class="card-eyebrow">Active Pipeline</text>
      <text x="0" y="28" class="card-title">Enhance Prompt</text>
      <!-- Capture selection button -->
      <rect x="134" y="12" width="100" height="20" rx="5" fill="#141414" stroke="#2C2C2C" stroke-width="1"/>
      <text x="184" y="25" font-family="'DM Sans', sans-serif" font-size="9.5px" font-weight="600" fill="#8E8A83" text-anchor="middle">Capture Selection</text>
    </g>
    <line x1="16" y1="58" x2="250" y2="58" stroke="#2C2C2C" stroke-width="1" opacity="0.6"/>

    <!-- Dropdown Selector -->
    <g transform="translate(16, 72)">
      <text x="0" y="10" class="input-label">Transformation Type</text>
      <rect x="0" y="16" width="234" height="28" rx="6" fill="#101010" stroke="#2C2C2C" stroke-width="1"/>
      <text x="12" y="33" class="body-input">Enhance Prompt</text>
      <path d="M212 28 L216 32 L220 28" stroke="#8E8A83" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>

    <!-- Original Prompt Textarea -->
    <g transform="translate(16, 142)">
      <text x="0" y="10" class="input-label">Original Prompt / Text</text>
      <rect x="0" y="16" width="234" height="114" rx="6" fill="#101010" stroke="#2C2C2C" stroke-width="1"/>
      <text x="12" y="34" class="body-input" fill="#8E8A83">fix the bug where user data doesnt</text>
      <text x="12" y="52" class="body-input" fill="#8E8A83">save on logout and also make the</text>
      <text x="12" y="70" class="body-input" fill="#8E8A83">error message better so ppl understand</text>
      <rect x="214" y="58" width="1.5" height="13" fill="#F26A4B"/>
    </g>

    <!-- Guidelines Textarea -->
    <g transform="translate(16, 298)">
      <text x="0" y="10" class="input-label">Contextual Guidelines (Optional)</text>
      <rect x="0" y="16" width="234" height="50" rx="6" fill="#101010" stroke="#2C2C2C" stroke-width="1"/>
      <text x="12" y="32" class="body-placeholder">e.g. keep it highly technical, use bullet points...</text>
    </g>

    <!-- Button Row -->
    <g transform="translate(16, 380)">
      <rect width="154" height="28" rx="6" fill="#F26A4B"/>
      <text x="77" y="17.5" class="btn-text" fill="#FFFFFF" text-anchor="middle">Enhance Prompt</text>
      <rect x="162" y="0" width="72" height="28" rx="6" fill="rgba(255, 255, 255, 0.015)" stroke="#2C2C2C" stroke-width="1"/>
      <text x="198" y="17.5" class="btn-text" fill="#8E8A83" text-anchor="middle">Clear</text>
    </g>
  </g>

  <!-- Right Card (Output Stream) -->
  <g transform="translate(512, 88)">
    <rect width="266" height="424" rx="10" fill="#1C1C1C" stroke="#2C2C2C" stroke-width="1"/>
    
    <!-- Card Heading -->
    <g transform="translate(16, 16)">
      <text x="0" y="10" class="card-eyebrow">Output Stream (groq / llama-3.1)</text>
      <text x="0" y="28" class="card-title">Enhanced Prompt</text>
    </g>
    <line x1="16" y1="58" x2="250" y2="58" stroke="#2C2C2C" stroke-width="1" opacity="0.6"/>

    <!-- Enhanced Output Textarea -->
    <g transform="translate(16, 72)">
      <rect width="234" height="292" rx="6" fill="#101010" stroke="#2C2C2C" stroke-width="1"/>
      <text x="12" y="26" class="body-input" font-size="12.5px" fill="#E8E3DA">Resolve the data persistence</text>
      <text x="12" y="44" class="body-input" font-size="12.5px" fill="#E8E3DA">issue that causes user data loss</text>
      <text x="12" y="62" class="body-input" font-size="12.5px" fill="#E8E3DA">on logout. Additionally, improve</text>
      <text x="12" y="80" class="body-input" font-size="12.5px" fill="#E8E3DA">the error message to provide</text>
      <text x="12" y="98" class="body-input" font-size="12.5px" fill="#E8E3DA">clear, actionable guidance so</text>
      <text x="12" y="116" class="body-input" font-size="12.5px" fill="#E8E3DA">users can understand and</text>
      <text x="12" y="134" class="body-input" font-size="12.5px" fill="#E8E3DA">resolve the issue.</text>
      <rect x="118" y="122" width="1.5" height="14" fill="#F26A4B"/>
    </g>

    <!-- Button Row -->
    <g transform="translate(16, 380)">
      <rect width="134" height="28" rx="6" fill="#F26A4B"/>
      <text x="67" y="17.5" class="btn-text" fill="#FFFFFF" text-anchor="middle">Replace Selection</text>
      <rect x="140" y="0" width="52" height="28" rx="6" fill="rgba(255, 255, 255, 0.015)" stroke="#2C2C2C" stroke-width="1"/>
      <svg x="148" y="8" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8E8A83" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
      <text x="174" y="17.5" class="btn-text" fill="#8E8A83" text-anchor="middle">Copy</text>
      <rect x="198" y="0" width="36" height="28" rx="6" fill="rgba(255, 255, 255, 0.015)" stroke="#2C2C2C" stroke-width="1"/>
      <svg x="210" y="8" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8E8A83" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
      </svg>
    </g>
  </g>
</svg>

<br/>

### Floating Overlay and Widget

<svg width="800" height="320" viewBox="0 0 800 320" fill="none" xmlns="http://www.w3.org/2000/svg" style="border-radius:12px; display:block; margin:0 auto; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
  <defs>
    <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="46" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#F26A4B"/>
      <stop offset="100%" stop-color="#E05A38"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&amp;family=JetBrains+Mono:wght@400;500;600&amp;display=swap');
    .title-banner { font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 700; fill: #8E8A83; text-transform: uppercase; letter-spacing: 0.08em; }
    .widget-text { font-family: 'DM Sans', sans-serif; font-size: 11.5px; font-weight: 500; }
    .widget-badge { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 500; }
    .overlay-title { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 600; fill: #8E8A83; }
    .overlay-eyebrow { font-family: 'DM Sans', sans-serif; font-size: 8.5px; font-weight: 600; fill: #8E8A83; text-transform: uppercase; letter-spacing: 0.05em; }
    .overlay-text { font-family: 'DM Sans', sans-serif; font-size: 11px; fill: #E8E3DA; }
    .btn-text { font-family: 'DM Sans', sans-serif; font-size: 10.5px; font-weight: 600; }
  </style>

  <!-- Base Canvas Background -->
  <rect width="800" height="320" rx="8" fill="#141414" stroke="#2C2C2C" stroke-width="1"/>

  <!-- Divider Line -->
  <line x1="400" y1="20" x2="400" y2="300" stroke="#2C2C2C" stroke-dasharray="4 4" opacity="0.6"/>

  <!-- LEFT COLUMN: WIDGET STATES -->
  <text x="32" y="36" class="title-banner">Floating Widget States</text>

  <!-- 1. Idle Pill -->
  <g transform="translate(32, 54)">
    <rect width="140" height="36" rx="18" fill="rgba(16,16,16,0.94)" stroke="rgba(50,50,50,0.95)" stroke-width="0.5" filter="drop-shadow(0 4px 12px rgba(0,0,0,0.3))"/>
    <g transform="translate(10, 9)">
      <rect width="18" height="18" rx="5" fill="#141414" stroke="#2C2C2C" stroke-width="0.5"/>
      <svg x="4" y="4" width="10" height="10" viewBox="0 0 48 46" fill="none">
        <path fill="url(#logoGrad)" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" />
      </svg>
    </g>
    <text x="36" y="22" class="widget-text" fill="#8E8A83">MeshUtility</text>
    <text x="110" y="22" class="widget-badge" fill="#3A3A3A">Alt</text>
    <text x="150" y="22" font-family="'DM Sans', sans-serif" font-size="10px" fill="#3A3A3A">Idle</text>
  </g>

  <!-- 2. Listening Pill -->
  <g transform="translate(32, 102)">
    <rect x="-4" y="-4" width="208" height="44" rx="22" fill="none" stroke="#F26A4B" stroke-width="0.75" opacity="0.2"/>
    <rect width="200" height="36" rx="18" fill="rgba(16,16,16,0.94)" stroke="#F26A4B" stroke-width="1.2" filter="url(#glow)"/>
    <circle cx="18" cy="18" r="4.5" fill="#F26A4B"/>
    <rect x="32" y="13" width="2" height="10" rx="1" fill="#F26A4B" opacity="0.6"/>
    <rect x="37" y="10" width="2" height="16" rx="1" fill="#F26A4B"/>
    <rect x="42" y="15" width="2" height="6" rx="1" fill="#F26A4B" opacity="0.4"/>
    <rect x="47" y="11" width="2" height="14" rx="1" fill="#F26A4B" opacity="0.8"/>
    <text x="58" y="22" class="widget-text" fill="#F26A4B" font-weight="600">Listening</text>
    <text x="122" y="22" class="widget-badge" fill="rgba(242,106,75,0.5)">2.4s</text>
    <text x="210" y="22" font-family="'DM Sans', sans-serif" font-size="10px" fill="#3A3A3A">Recording</text>
  </g>

  <!-- 3. Transcribing Pill -->
  <g transform="translate(32, 150)">
    <rect width="140" height="36" rx="18" fill="rgba(16,16,16,0.94)" stroke="#D1CFC0" stroke-width="0.5"/>
    <circle cx="20" cy="18" r="6" stroke="#2C2C2C" stroke-width="1.5" fill="none"/>
    <path d="M20 12 A6 6 0 0 1 26 18" stroke="#D1CFC0" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <text x="36" y="22" class="widget-text" fill="#D1CFC0">Transcribing</text>
    <text x="150" y="22" font-family="'DM Sans', sans-serif" font-size="10px" fill="#3A3A3A">Processing</text>
  </g>

  <!-- 4. Injected Pill -->
  <g transform="translate(32, 198)">
    <rect width="140" height="36" rx="18" fill="rgba(16,16,16,0.94)" stroke="#4ADE80" stroke-width="0.5"/>
    <svg x="12" y="11" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7L5.5 10L11.5 4" stroke="#4ADE80" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <text x="34" y="22" class="widget-text" fill="#4ADE80">Injected</text>
    <text x="150" y="22" font-family="'DM Sans', sans-serif" font-size="10px" fill="#3A3A3A">Success</text>
  </g>

  <!-- 5. Circle Mode Mini Widget -->
  <g transform="translate(32, 246)">
    <circle cx="18" cy="18" r="18" fill="rgba(16,16,16,0.94)" stroke="rgba(50,50,50,0.95)" stroke-width="0.5" filter="drop-shadow(0 4px 12px rgba(0,0,0,0.3))"/>
    <g transform="translate(9, 9)">
      <rect width="18" height="18" rx="5" fill="#141414" stroke="#2C2C2C" stroke-width="0.5"/>
      <svg x="4" y="4" width="10" height="10" viewBox="0 0 48 46" fill="none">
        <path fill="url(#logoGrad)" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" />
      </svg>
    </g>
    <text x="50" y="22" font-family="'DM Sans', sans-serif" font-size="11.5px" fill="#8E8A83">Compact Circle Mode</text>
  </g>


  <!-- RIGHT COLUMN: OVERLAY WINDOW -->
  <text x="432" y="36" class="title-banner">Floating Overlay Window</text>

  <g transform="translate(432, 54)">
    <rect width="336" height="230" rx="10" fill="#1C1C1C" stroke="#2C2C2C" stroke-width="1" filter="drop-shadow(0 12px 32px rgba(0,0,0,0.6))"/>
    
    <rect width="336" height="32" fill="#101010" rx="10"/>
    <rect y="20" width="336" height="12" fill="#101010"/>
    <line x1="0" y1="32" x2="336" y2="32" stroke="#2C2C2C" stroke-width="1"/>
    
    <text x="14" y="20" class="overlay-title">MeshPrompt Overlay</text>
    <circle cx="316" cy="16" r="4" fill="#EF4444" opacity="0.8"/>

    <!-- Content Area -->
    <g transform="translate(14, 44)">
      <rect width="308" height="54" rx="6" fill="#101010" stroke="#2C2C2C" stroke-width="1"/>
      <text x="10" y="16" class="overlay-eyebrow">Captured Text</text>
      <text x="10" y="36" class="overlay-text" fill="#8E8A83">"fix the bug where data doesnt save on logout"</text>
    </g>

    <g transform="translate(14, 110)">
      <rect width="76" height="20" rx="5" fill="rgba(242, 106, 75, 0.08)" stroke="rgba(242, 106, 75, 0.2)" stroke-width="1"/>
      <text x="38" y="13.5" class="btn-text" fill="#F26A4B" text-anchor="middle">Enhance</text>
      
      <rect x="82" width="68" height="20" rx="5" fill="none" stroke="#2C2C2C" stroke-width="1"/>
      <text x="116" y="13.5" class="btn-text" fill="#8E8A83" text-anchor="middle">Concise</text>
      
      <rect x="156" width="68" height="20" rx="5" fill="none" stroke="#2C2C2C" stroke-width="1"/>
      <text x="190" y="13.5" class="btn-text" fill="#8E8A83" text-anchor="middle">Grammar</text>
    </g>

    <g transform="translate(14, 142)">
      <rect width="308" height="28" rx="6" fill="#101010" stroke="#2C2C2C" stroke-width="1"/>
      <text x="10" y="18" font-family="'DM Sans', sans-serif" font-size="10.5px" fill="#3A3A3A">Context details... (Optional)</text>
    </g>

    <g transform="translate(14, 184)">
      <rect width="308" height="30" rx="6" fill="#F26A4B"/>
      <text x="154" y="19" class="btn-text" fill="#FFFFFF" font-size="11.5px" font-weight="700" text-anchor="middle">Enhance Text</text>
    </g>
  </g>
</svg>

</div>

---

## Features

### Voice Dictation
- Push-to-talk or toggle recording mode with a configurable global hotkey (`Alt+Space` default)
- Local offline transcription via whisper.cpp and sherpa-onnx parakeet model
- Cloud transcription via the Groq Whisper API (requires API key)
- Custom pronunciation dictionary for domain-specific terms and names
- Full transcription history with word count, duration, and timestamp
- Microphone selection, sensitivity control, and device status checks
- Partial transcription preview while recording (Hinglish / multilingual)

### Prompt Enhancer
- Streaming AI output with support for Groq, OpenAI, Anthropic, Google Gemini, Mistral, and custom OpenAI-compatible endpoints
- Built-in prompt action library: Enhance, Make Concise, Fix Grammar, Translate, Summarize, and more
- Floating overlay window that activates on a global shortcut and captures selected text
- One-click copy or replace the selected text with the enhanced output
- Prompt action history with full input/output log
- Per-provider model selection, temperature, and token limit settings

### System
- Lives in the system tray — minimal resource usage when idle
- Borderless custom window with native drag support
- Automatic launch at Windows startup
- Close to tray behavior keeps the app running in the background
- Floating pill widget with animated state transitions (idle, listening, processing, done)
- Auto-update check via GitHub Releases
- All history and settings stored in a local SQLite database — no cloud sync, no telemetry

---

## Prerequisites

| Requirement | Version |
|---|---|
| Rust | 1.77 or later |
| Node.js | 20 or later |
| Tauri CLI | 2.x — install with `cargo install tauri-cli` |
| OS | Windows 10 or later (primary platform) |

macOS and Linux are partially supported. Some audio backend features may behave differently across platforms.

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/Jenesh11/MeshUtility.git
cd MeshUtility
```

### 2. Install Node dependencies

```bash
npm install
```

### 3. Run in development mode

```bash
npm run tauri dev
```

### 4. Configure your API key

Once the app is running, open **Configuration > AI Providers** in the sidebar and enter your API key for the provider you want to use.

For cloud transcription, open **Configuration > Voice Settings** and enter your Groq API key. A free key is available at [console.groq.com](https://console.groq.com).

For local offline transcription, go to **Voice Settings**, select a Whisper model, and click Download. No API key is needed.

---

## Building for release

```bash
npm run tauri build
```

The installer and portable `.exe` are placed in `src-tauri/target/release/bundle/`.

---

## Project Structure

```
MeshUtility/
├── src/                          # React + TypeScript frontend
│   ├── App.tsx                   # Main window shell and sidebar navigation
│   ├── WidgetApp.tsx             # Floating pill widget root
│   ├── components/
│   │   ├── Dashboard.tsx         # Dictation history and stats
│   │   ├── PromptApp.tsx         # Prompt enhancer — full UI
│   │   ├── Settings.tsx          # Voice settings, hotkey, model, mic
│   │   ├── Widget.tsx            # Pill widget state machine (embedded view)
│   │   ├── DictionaryEditor.tsx  # Custom pronunciation dictionary
│   │   └── ResultPopup.tsx       # Transcription result popup card
│   ├── store/
│   │   └── appStore.ts           # Zustand state for recording and history
│   ├── lib/                      # Prompt enhancer logic: actions, client, types
│   └── styles-prompt.css         # Design tokens and component styles
├── src-tauri/                    # Rust backend (Tauri 2)
│   ├── src/
│   │   ├── main.rs               # App setup, commands, tray, shortcuts
│   │   ├── audio.rs              # CPAL audio capture and level emission
│   │   ├── transcription.rs      # Whisper and sherpa-onnx inference
│   │   ├── db.rs                 # SQLite — history, settings, dictionary
│   │   ├── injection.rs          # Text injection via clipboard and enigo
│   │   └── clipboard.rs          # Clipboard read/write with canary detection
│   └── tauri.conf.json           # Window definitions, deep-link schemes, icons
├── public/                       # Static assets — logos, icons
├── index.html                    # Main window entry
├── widget.html                   # Widget window entry
└── overlay.html                  # Overlay window entry
```

---

## Configuration Reference

All settings are saved locally in a SQLite database in the system app data folder. They can be changed from within the app at any time.

| Setting | Description | Default |
|---|---|---|
| Hotkey | Global shortcut to start and stop voice recording | `Alt+Space` |
| Recording mode | `push-to-talk` holds to record, `toggle` clicks to start and stop | `push-to-talk` |
| Transcription engine | `local` uses whisper.cpp offline, `cloud` uses Groq Whisper API | `local` |
| Selected model | Whisper model file downloaded to local storage | none |
| Language mode | `auto`, `en`, `hi`, or any ISO language code | `auto` |
| Sensitivity | Microphone input gain multiplier 0 to 1 | `0.5` |
| Groq API key | Required only when transcription engine is set to cloud | — |
| Prompt provider | `groq`, `openai`, `anthropic`, `gemini`, `mistral`, or `custom` | `groq` |
| Prompt model | Model ID string for the selected provider | `llama-3.1-8b-instant` |
| Temperature | Output randomness for the prompt enhancer 0 to 1 | `0.35` |
| Close to tray | Keep the app running when the window is closed | `true` |

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Alt+Space` | Start or stop voice recording — configurable in Voice Settings |
| `Ctrl+Shift+Space` | Open the prompt enhancer overlay — configurable in Enhancer Settings |
| `Ctrl+Enter` | Enhance the current prompt in the overlay or main enhancer view |
| `Escape` | Dismiss the overlay or close the result popup |
| `Ctrl+C` | Copy the enhanced output to clipboard |

---

## Supported Providers

| Provider | Voice Transcription | Prompt Enhancement |
|---|---|---|
| Groq | Yes — Whisper API | Yes |
| OpenAI | No | Yes |
| Anthropic | No | Yes |
| Google Gemini | No | Yes |
| Mistral | No | Yes |
| Custom OpenAI-compatible | No | Yes |
| Local Whisper (offline) | Yes — no API key needed | No |

---

## Contributing

Pull requests are welcome. For significant changes, open an issue first to discuss the approach.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-change`
3. Commit your changes with a descriptive message
4. Open a pull request against `main`

Please match the existing code style. TypeScript uses React with Zustand for state. Rust follows the existing module structure in `src-tauri/src/`.

---

## License

MIT License — see [LICENSE](LICENSE) for full terms.

---

## Acknowledgments

- [Tauri](https://tauri.app) — framework for building native desktop apps with web frontends
- [whisper.cpp](https://github.com/ggerganov/whisper.cpp) — fast C++ inference for OpenAI Whisper models
- [sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx) — ONNX speech recognition for the parakeet model
- [Groq](https://groq.com) — ultra-fast LLM and Whisper inference API
- [CPAL](https://github.com/RustAudio/cpal) — cross-platform audio I/O in Rust
