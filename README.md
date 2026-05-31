<div align="center">

<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="14" fill="#111"/>
  <rect x="0.5" y="0.5" width="63" height="63" rx="13.5" stroke="#2a2a2a"/>
  <rect x="29" y="16" width="6" height="18" rx="3" fill="#F26A4B"/>
  <circle cx="32" cy="34" r="9" stroke="#F26A4B" stroke-width="2" fill="none" stroke-dasharray="0"/>
  <path d="M22 33c0 5.523 4.477 10 10 10s10-4.477 10-10" stroke="#F26A4B" stroke-width="2" stroke-linecap="round"/>
  <line x1="32" y1="43" x2="32" y2="48" stroke="#F26A4B" stroke-width="2" stroke-linecap="round"/>
  <line x1="26" y1="48" x2="38" y2="48" stroke="#F26A4B" stroke-width="2" stroke-linecap="round"/>
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

<svg width="760" height="480" viewBox="0 0 760 480" xmlns="http://www.w3.org/2000/svg" style="border-radius:12px;display:block;margin:0 auto;">
  <!-- Window background -->
  <rect width="760" height="480" rx="12" fill="#0D0D0D"/>

  <!-- Title bar -->
  <rect x="0" y="0" width="760" height="40" fill="#111" rx="0"/>
  <rect x="0" y="0" width="760" height="40" rx="12" fill="#111"/>
  <rect x="0" y="28" width="760" height="12" fill="#111"/>
  <rect x="0" y="39" width="760" height="1" fill="#1e1e1e"/>
  <!-- Logo + title centered -->
  <rect x="349" y="11" width="18" height="18" rx="4" fill="#F26A4B" opacity="0.85"/>
  <rect x="356" y="17" width="4" height="9" rx="1.5" fill="white" opacity="0.9"/>
  <circle cx="358" cy="22" r="4.5" stroke="white" stroke-width="1.2" fill="none"/>
  <text x="374" y="25" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="600" fill="#555" letter-spacing="1.5">MESHUTILITY SUITE</text>
  <!-- Window dots right -->
  <circle cx="718" cy="20" r="5" fill="#3a3a3a"/>
  <circle cx="734" cy="20" r="5" fill="#3a3a3a"/>
  <circle cx="750" cy="20" r="5" fill="#F26A4B" opacity="0.8"/>

  <!-- Sidebar -->
  <rect x="0" y="40" width="210" height="440" fill="#111"/>
  <rect x="210" y="40" width="1" height="440" fill="#1e1e1e"/>

  <!-- Sidebar group: Voice Dictation -->
  <text x="20" y="72" font-family="sans-serif" font-size="9.5" font-weight="700" fill="#3a3a3a" letter-spacing="1.2">VOICE DICTATION</text>
  <!-- Dictation History — active -->
  <rect x="10" y="80" width="190" height="30" rx="6" fill="#1a1a1a"/>
  <rect x="10" y="80" width="190" height="30" rx="6" stroke="#2a2a2a"/>
  <rect x="22" y="88" width="14" height="14" rx="3" fill="#F26A4B" opacity="0.15"/>
  <path d="M25 95 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M29 93 L29 95.5 L30.5 97" stroke="#F26A4B" stroke-width="1.2" stroke-linecap="round" fill="none"/>
  <text x="44" y="99" font-family="sans-serif" font-size="11.5" fill="#ccc">Dictation History</text>
  <!-- Custom Dictionary -->
  <rect x="10" y="116" width="190" height="30" rx="6" fill="none"/>
  <path d="M25 123 v10 m0-10 C23 121 20 121.5 19 122.5 v9 C20 130.5 23 130 25 131 m0-10 C27 121 30 121.5 31 122.5 v9 C30 130.5 27 130 25 131" stroke="#444" stroke-width="1.2" stroke-linecap="round" fill="none"/>
  <text x="44" y="135" font-family="sans-serif" font-size="11.5" fill="#555">Custom Dictionary</text>

  <!-- Sidebar group: Prompt Enhancer -->
  <text x="20" y="162" font-family="sans-serif" font-size="9.5" font-weight="700" fill="#3a3a3a" letter-spacing="1.2">PROMPT ENHANCER</text>
  <!-- Enhance Prompt -->
  <rect x="10" y="170" width="190" height="30" rx="6" fill="none"/>
  <path d="M22 177 h5 m-2.5-2 v5 M19 184 l10 0 M28 179 l3-3 m-1 6 l3 3" stroke="#444" stroke-width="1.2" stroke-linecap="round" fill="none"/>
  <text x="44" y="189" font-family="sans-serif" font-size="11.5" fill="#555">Enhance Prompt</text>
  <!-- Prompt Actions -->
  <rect x="10" y="206" width="190" height="30" rx="6" fill="none"/>
  <path d="M25 213 l2 6 4-9 2 6 4-6" stroke="#444" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <text x="44" y="225" font-family="sans-serif" font-size="11.5" fill="#555">Prompt Actions</text>
  <!-- Action History -->
  <rect x="10" y="242" width="190" height="30" rx="6" fill="none"/>
  <rect x="22" y="249" width="14" height="16" rx="2" stroke="#444" stroke-width="1.2" fill="none"/>
  <line x1="25" y1="253.5" x2="33" y2="253.5" stroke="#444" stroke-width="1"/>
  <line x1="25" y1="257" x2="33" y2="257" stroke="#444" stroke-width="1"/>
  <line x1="25" y1="260" x2="30" y2="260" stroke="#444" stroke-width="1"/>
  <text x="44" y="261" font-family="sans-serif" font-size="11.5" fill="#555">Action History</text>

  <!-- Sidebar group: Configuration -->
  <text x="20" y="292" font-family="sans-serif" font-size="9.5" font-weight="700" fill="#3a3a3a" letter-spacing="1.2">CONFIGURATION</text>
  <!-- Voice Settings -->
  <rect x="10" y="300" width="190" height="30" rx="6" fill="none"/>
  <path d="M25 307 a4 4 0 0 1 0 8 M29 307 v8 M23 312 h8" stroke="#444" stroke-width="1.2" stroke-linecap="round" fill="none"/>
  <text x="44" y="319" font-family="sans-serif" font-size="11.5" fill="#555">Voice Settings</text>
  <!-- AI Providers -->
  <rect x="10" y="336" width="190" height="30" rx="6" fill="none"/>
  <circle cx="28" cy="351" r="5" stroke="#444" stroke-width="1.2" fill="none"/>
  <text x="44" y="355" font-family="sans-serif" font-size="11.5" fill="#555">AI Providers</text>
  <!-- Enhancer Settings -->
  <rect x="10" y="372" width="190" height="30" rx="6" fill="none"/>
  <circle cx="28" cy="387" r="4" stroke="#444" stroke-width="1.2" fill="none"/>
  <circle cx="28" cy="387" r="1.5" fill="#444"/>
  <text x="44" y="391" font-family="sans-serif" font-size="11.5" fill="#555">Enhancer Settings</text>

  <!-- Sidebar footer -->
  <rect x="12" y="424" width="186" height="50" rx="8" fill="#161616"/>
  <rect x="12" y="424" width="186" height="50" rx="8" stroke="#1e1e1e"/>
  <rect x="22" y="434" width="26" height="26" rx="6" fill="#1a1a1a"/>
  <rect x="22" y="434" width="26" height="26" rx="6" stroke="#2a2a2a"/>
  <rect x="29" y="440" width="4" height="9" rx="1.5" fill="#F26A4B" opacity="0.7"/>
  <circle cx="31" cy="447" r="4" stroke="#F26A4B" stroke-width="1.2" fill="none" opacity="0.7"/>
  <text x="56" y="445" font-family="sans-serif" font-size="11" font-weight="600" fill="#bbb">MeshUtility</text>
  <rect x="56" y="451" width="6" height="6" rx="3" fill="#10B981"/>
  <text x="66" y="457" font-family="sans-serif" font-size="9.5" fill="#444">Local Whisper active</text>
  <text x="172" y="445" font-family="'JetBrains Mono',monospace" font-size="8" fill="#F26A4B">v2.4</text>

  <!-- Main content: Dictation History -->
  <!-- Header -->
  <text x="232" y="65" font-family="sans-serif" font-size="13" font-weight="600" fill="#ccc">Dictation History</text>

  <!-- Stats cards -->
  <rect x="222" y="76" width="164" height="56" rx="8" fill="#141414"/>
  <rect x="222" y="76" width="164" height="56" rx="8" stroke="#1e1e1e"/>
  <text x="238" y="96" font-family="sans-serif" font-size="10" fill="#555">Total Transcriptions</text>
  <text x="238" y="116" font-family="sans-serif" font-size="20" font-weight="700" fill="#F26A4B">128</text>

  <rect x="396" y="76" width="164" height="56" rx="8" fill="#141414"/>
  <rect x="396" y="76" width="164" height="56" rx="8" stroke="#1e1e1e"/>
  <text x="412" y="96" font-family="sans-serif" font-size="10" fill="#555">Words Dictated</text>
  <text x="412" y="116" font-family="sans-serif" font-size="20" font-weight="700" fill="#ccc">4,821</text>

  <rect x="570" y="76" width="170" height="56" rx="8" fill="#141414"/>
  <rect x="570" y="76" width="170" height="56" rx="8" stroke="#1e1e1e"/>
  <text x="586" y="96" font-family="sans-serif" font-size="10" fill="#555">Avg Duration</text>
  <text x="586" y="116" font-family="sans-serif" font-size="20" font-weight="700" fill="#ccc">3.2s</text>

  <!-- History items -->
  <!-- Item 1 -->
  <rect x="222" y="146" width="518" height="62" rx="8" fill="#141414"/>
  <rect x="222" y="146" width="518" height="62" rx="8" stroke="#1e1e1e"/>
  <text x="238" y="166" font-family="sans-serif" font-size="12" fill="#ccc">Let's schedule the design review for next Thursday at 3pm</text>
  <rect x="238" y="174" width="40" height="16" rx="4" fill="#1a1a1a"/>
  <rect x="238" y="174" width="40" height="16" rx="4" stroke="#2a2a2a"/>
  <text x="244" y="186" font-family="sans-serif" font-size="9" fill="#555">local</text>
  <rect x="286" y="174" width="36" height="16" rx="4" fill="#1a1a1a"/>
  <rect x="286" y="174" width="36" height="16" rx="4" stroke="#2a2a2a"/>
  <text x="291" y="186" font-family="sans-serif" font-size="9" fill="#555">9 words</text>
  <rect x="330" y="174" width="32" height="16" rx="4" fill="#1a1a1a"/>
  <rect x="330" y="174" width="32" height="16" rx="4" stroke="#2a2a2a"/>
  <text x="335" y="186" font-family="sans-serif" font-size="9" fill="#555">2.1s</text>
  <text x="680" y="181" font-family="sans-serif" font-size="9.5" fill="#333">just now</text>

  <!-- Item 2 -->
  <rect x="222" y="216" width="518" height="62" rx="8" fill="#141414"/>
  <rect x="222" y="216" width="518" height="62" rx="8" stroke="#1e1e1e"/>
  <text x="238" y="236" font-family="sans-serif" font-size="12" fill="#bbb">Can you pull up the latest analytics dashboard and send me the link</text>
  <rect x="238" y="244" width="40" height="16" rx="4" fill="#1a1a1a"/>
  <rect x="238" y="244" width="40" height="16" rx="4" stroke="#2a2a2a"/>
  <text x="244" y="256" font-family="sans-serif" font-size="9" fill="#555">local</text>
  <rect x="286" y="244" width="42" height="16" rx="4" fill="#1a1a1a"/>
  <rect x="286" y="244" width="42" height="16" rx="4" stroke="#2a2a2a"/>
  <text x="291" y="256" font-family="sans-serif" font-size="9" fill="#555">13 words</text>
  <rect x="336" y="244" width="32" height="16" rx="4" fill="#1a1a1a"/>
  <rect x="336" y="244" width="32" height="16" rx="4" stroke="#2a2a2a"/>
  <text x="341" y="256" font-family="sans-serif" font-size="9" fill="#555">3.4s</text>
  <text x="680" y="251" font-family="sans-serif" font-size="9.5" fill="#333">2m ago</text>

  <!-- Item 3 -->
  <rect x="222" y="286" width="518" height="62" rx="8" fill="#141414"/>
  <rect x="222" y="286" width="518" height="62" rx="8" stroke="#1e1e1e"/>
  <text x="238" y="306" font-family="sans-serif" font-size="12" fill="#bbb">Open the pull request and add the reviewer comment to it</text>
  <rect x="238" y="314" width="40" height="16" rx="4" fill="#1a1a1a"/>
  <rect x="238" y="314" width="40" height="16" rx="4" stroke="#2a2a2a"/>
  <text x="244" y="326" font-family="sans-serif" font-size="9" fill="#555">local</text>
  <rect x="286" y="314" width="42" height="16" rx="4" fill="#1a1a1a"/>
  <rect x="286" y="314" width="42" height="16" rx="4" stroke="#2a2a2a"/>
  <text x="291" y="326" font-family="sans-serif" font-size="9" fill="#555">11 words</text>
  <rect x="336" y="314" width="32" height="16" rx="4" fill="#1a1a1a"/>
  <rect x="336" y="314" width="32" height="16" rx="4" stroke="#2a2a2a"/>
  <text x="341" y="326" font-family="sans-serif" font-size="9" fill="#555">2.9s</text>
  <text x="680" y="321" font-family="sans-serif" font-size="9.5" fill="#333">14m ago</text>

  <!-- Item 4 -->
  <rect x="222" y="356" width="518" height="62" rx="8" fill="#141414"/>
  <rect x="222" y="356" width="518" height="62" rx="8" stroke="#1e1e1e"/>
  <text x="238" y="376" font-family="sans-serif" font-size="12" fill="#bbb">Remind me to follow up with the client about the proposal</text>
  <rect x="238" y="384" width="40" height="16" rx="4" fill="#1a1a1a"/>
  <rect x="238" y="384" width="40" height="16" rx="4" stroke="#2a2a2a"/>
  <text x="244" y="396" font-family="sans-serif" font-size="9" fill="#555">local</text>
  <rect x="286" y="384" width="42" height="16" rx="4" fill="#1a1a1a"/>
  <rect x="286" y="384" width="42" height="16" rx="4" stroke="#2a2a2a"/>
  <text x="291" y="396" font-family="sans-serif" font-size="9" fill="#555">10 words</text>
  <rect x="336" y="384" width="32" height="16" rx="4" fill="#1a1a1a"/>
  <rect x="336" y="384" width="32" height="16" rx="4" stroke="#2a2a2a"/>
  <text x="341" y="396" font-family="sans-serif" font-size="9" fill="#555">3.1s</text>
  <text x="680" y="391" font-family="sans-serif" font-size="9.5" fill="#333">1h ago</text>

  <!-- Item 5 faded -->
  <rect x="222" y="426" width="518" height="40" rx="8" fill="#111"/>
  <rect x="222" y="426" width="518" height="40" rx="8" stroke="#181818"/>
  <text x="238" y="451" font-family="sans-serif" font-size="12" fill="#333">Send the weekly standup notes to the team channel</text>
</svg>

<br/>

### Prompt Enhancer

<svg width="760" height="480" viewBox="0 0 760 480" xmlns="http://www.w3.org/2000/svg" style="border-radius:12px;display:block;margin:0 auto;">
  <!-- Window background -->
  <rect width="760" height="480" rx="12" fill="#0D0D0D"/>

  <!-- Title bar -->
  <rect x="0" y="0" width="760" height="40" fill="#111" rx="12"/>
  <rect x="0" y="28" width="760" height="12" fill="#111"/>
  <rect x="0" y="39" width="760" height="1" fill="#1e1e1e"/>
  <rect x="349" y="11" width="18" height="18" rx="4" fill="#F26A4B" opacity="0.85"/>
  <text x="374" y="25" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="600" fill="#555" letter-spacing="1.5">MESHUTILITY SUITE</text>
  <circle cx="718" cy="20" r="5" fill="#3a3a3a"/>
  <circle cx="734" cy="20" r="5" fill="#3a3a3a"/>
  <circle cx="750" cy="20" r="5" fill="#F26A4B" opacity="0.8"/>

  <!-- Sidebar -->
  <rect x="0" y="40" width="210" height="440" fill="#111"/>
  <rect x="210" y="40" width="1" height="440" fill="#1e1e1e"/>
  <text x="20" y="72" font-family="sans-serif" font-size="9.5" font-weight="700" fill="#3a3a3a" letter-spacing="1.2">VOICE DICTATION</text>
  <rect x="10" y="80" width="190" height="30" rx="6" fill="none"/>
  <text x="44" y="99" font-family="sans-serif" font-size="11.5" fill="#555">Dictation History</text>
  <rect x="10" y="116" width="190" height="30" rx="6" fill="none"/>
  <text x="44" y="135" font-family="sans-serif" font-size="11.5" fill="#555">Custom Dictionary</text>
  <text x="20" y="162" font-family="sans-serif" font-size="9.5" font-weight="700" fill="#3a3a3a" letter-spacing="1.2">PROMPT ENHANCER</text>
  <!-- Enhance Prompt — active -->
  <rect x="10" y="170" width="190" height="30" rx="6" fill="#1a1a1a"/>
  <rect x="10" y="170" width="190" height="30" rx="6" stroke="#2a2a2a"/>
  <text x="44" y="189" font-family="sans-serif" font-size="11.5" fill="#ccc">Enhance Prompt</text>
  <rect x="10" y="206" width="190" height="30" rx="6" fill="none"/>
  <text x="44" y="225" font-family="sans-serif" font-size="11.5" fill="#555">Prompt Actions</text>
  <rect x="10" y="242" width="190" height="30" rx="6" fill="none"/>
  <text x="44" y="261" font-family="sans-serif" font-size="11.5" fill="#555">Action History</text>
  <text x="20" y="292" font-family="sans-serif" font-size="9.5" font-weight="700" fill="#3a3a3a" letter-spacing="1.2">CONFIGURATION</text>
  <rect x="10" y="300" width="190" height="30" rx="6" fill="none"/>
  <text x="44" y="319" font-family="sans-serif" font-size="11.5" fill="#555">Voice Settings</text>
  <rect x="10" y="336" width="190" height="30" rx="6" fill="none"/>
  <text x="44" y="355" font-family="sans-serif" font-size="11.5" fill="#555">AI Providers</text>
  <rect x="10" y="372" width="190" height="30" rx="6" fill="none"/>
  <text x="44" y="391" font-family="sans-serif" font-size="11.5" fill="#555">Enhancer Settings</text>
  <rect x="12" y="424" width="186" height="50" rx="8" fill="#161616"/>
  <rect x="12" y="424" width="186" height="50" rx="8" stroke="#1e1e1e"/>
  <text x="56" y="445" font-family="sans-serif" font-size="11" font-weight="600" fill="#bbb">MeshUtility</text>
  <text x="66" y="457" font-family="sans-serif" font-size="9.5" fill="#444">Local Whisper active</text>

  <!-- Main content: Prompt Enhancer -->
  <text x="232" y="65" font-family="sans-serif" font-size="13" font-weight="600" fill="#ccc">Enhance Prompt</text>

  <!-- Action selector bar -->
  <rect x="222" y="76" width="518" height="38" rx="8" fill="#141414"/>
  <rect x="222" y="76" width="518" height="38" rx="8" stroke="#1e1e1e"/>
  <!-- Active action chip -->
  <rect x="232" y="84" width="100" height="22" rx="5" fill="#F26A4B" opacity="0.12"/>
  <rect x="232" y="84" width="100" height="22" rx="5" stroke="#F26A4B" opacity="0.3"/>
  <text x="256" y="99" font-family="sans-serif" font-size="10" fill="#F26A4B">Enhance Prompt</text>
  <rect x="340" y="84" width="80" height="22" rx="5" fill="none"/>
  <text x="355" y="99" font-family="sans-serif" font-size="10" fill="#444">Make Concise</text>
  <rect x="428" y="84" width="90" height="22" rx="5" fill="none"/>
  <text x="441" y="99" font-family="sans-serif" font-size="10" fill="#444">Fix Grammar</text>
  <rect x="526" y="84" width="80" height="22" rx="5" fill="none"/>
  <text x="540" y="99" font-family="sans-serif" font-size="10" fill="#444">Translate</text>
  <text x="614" y="99" font-family="sans-serif" font-size="10" fill="#F26A4B">+6 more</text>

  <!-- Input area -->
  <rect x="222" y="124" width="518" height="130" rx="8" fill="#111"/>
  <rect x="222" y="124" width="518" height="130" rx="8" stroke="#1e1e1e"/>
  <text x="238" y="144" font-family="sans-serif" font-size="10" fill="#333">Your prompt</text>
  <text x="238" y="165" font-family="sans-serif" font-size="12.5" fill="#888">fix the bug where user data doesnt save on logout and</text>
  <text x="238" y="182" font-family="sans-serif" font-size="12.5" fill="#888">also make the error message better so ppl understand it</text>
  <!-- blinking cursor -->
  <rect x="238" y="192" width="1.5" height="14" rx="1" fill="#F26A4B" opacity="0.7"/>
  <text x="640" y="246" font-family="sans-serif" font-size="9.5" fill="#333">38 / 4000</text>

  <!-- Action bar below input -->
  <rect x="222" y="264" width="518" height="44" rx="8" fill="#141414"/>
  <rect x="222" y="264" width="518" height="44" rx="8" stroke="#1e1e1e"/>
  <!-- Enhance button -->
  <rect x="232" y="274" width="130" height="26" rx="6" fill="#F26A4B"/>
  <text x="265" y="291" font-family="sans-serif" font-size="11" font-weight="600" fill="white">Enhance</text>
  <text x="303" y="291" font-family="'JetBrains Mono',monospace" font-size="9" fill="rgba(255,255,255,0.5)">Ctrl+Enter</text>
  <!-- Capture button -->
  <rect x="372" y="274" width="128" height="26" rx="6" fill="#1a1a1a"/>
  <rect x="372" y="274" width="128" height="26" rx="6" stroke="#2a2a2a"/>
  <text x="395" y="291" font-family="sans-serif" font-size="10.5" fill="#666">Capture Selection</text>
  <!-- Model pill -->
  <rect x="550" y="277" width="88" height="20" rx="10" fill="#111"/>
  <rect x="550" y="277" width="88" height="20" rx="10" stroke="#2a2a2a"/>
  <circle cx="560" cy="287" r="3" fill="#10B981"/>
  <text x="566" y="291" font-family="'JetBrains Mono',monospace" font-size="9" fill="#555">groq / llama3</text>

  <!-- Output area -->
  <rect x="222" y="318" width="518" height="148" rx="8" fill="#111"/>
  <rect x="222" y="318" width="518" height="148" rx="8" stroke="#1e1e1e"/>
  <!-- Output header -->
  <text x="238" y="338" font-family="sans-serif" font-size="10" fill="#555">Enhanced output</text>
  <rect x="648" y="326" width="82" height="18" rx="4" fill="#1a1a1a"/>
  <rect x="648" y="326" width="82" height="18" rx="4" stroke="#2a2a2a"/>
  <text x="660" y="339" font-family="sans-serif" font-size="9" fill="#555">streaming...</text>
  <circle cx="722" cy="335" r="3" fill="#F26A4B" opacity="0.8"/>
  <!-- Output text streaming -->
  <text x="238" y="360" font-family="sans-serif" font-size="12.5" fill="#bbb">Resolve the data persistence issue that causes user data</text>
  <text x="238" y="378" font-family="sans-serif" font-size="12.5" fill="#bbb">loss on logout. Additionally, improve the error message</text>
  <text x="238" y="396" font-family="sans-serif" font-size="12.5" fill="#bbb">to provide clear, actionable guidance so users can</text>
  <text x="238" y="414" font-family="sans-serif" font-size="12.5" fill="#aaa">understand and resolve the issue</text>
  <rect x="476" y="404" width="1.5" height="14" rx="1" fill="#F26A4B" opacity="0.6"/>
  <!-- Copy / Replace buttons -->
  <rect x="238" y="432" width="70" height="26" rx="6" fill="#1a1a1a"/>
  <rect x="238" y="432" width="70" height="26" rx="6" stroke="#2a2a2a"/>
  <text x="255" y="449" font-family="sans-serif" font-size="10" fill="#888">Copy</text>
  <rect x="316" y="432" width="100" height="26" rx="6" fill="#1a1a1a"/>
  <rect x="316" y="432" width="100" height="26" rx="6" stroke="#2a2a2a"/>
  <text x="330" y="449" font-family="sans-serif" font-size="10" fill="#888">Replace Text</text>
</svg>

<br/>

### Floating Overlay and Widget

<svg width="760" height="200" viewBox="0 0 760 200" xmlns="http://www.w3.org/2000/svg" style="border-radius:12px;display:block;margin:0 auto;">
  <rect width="760" height="200" rx="12" fill="#0a0a0a"/>

  <!-- Left: floating pill widget -->
  <text x="50" y="34" font-family="sans-serif" font-size="10" fill="#444" text-anchor="middle">Widget — Idle</text>
  <!-- Idle pill -->
  <rect x="0" y="44" width="100" height="36" rx="18" fill="rgba(13,13,13,0.97)"/>
  <rect x="0" y="44" width="100" height="36" rx="18" stroke="rgba(50,50,50,0.9)"/>
  <circle cx="20" cy="62" r="4" fill="#2a2a2a"/>
  <text x="30" y="67" font-family="sans-serif" font-size="11" font-weight="500" fill="#8E8A83">MeshUtility</text>
  <text x="78" y="67" font-family="'JetBrains Mono',monospace" font-size="8.5" fill="#2a2a2a">Alt</text>

  <!-- Listening pill -->
  <text x="200" y="34" font-family="sans-serif" font-size="10" fill="#444" text-anchor="middle">Widget — Listening</text>
  <rect x="110" y="40" width="180" height="52" rx="26" fill="rgba(13,13,13,0.97)"/>
  <rect x="110" y="40" width="180" height="52" rx="26" stroke="#F26A4B" stroke-width="1"/>
  <!-- Pulsing dot -->
  <circle cx="130" cy="66" r="5" fill="#F26A4B" opacity="0.9"/>
  <!-- Waveform bars -->
  <rect x="144" y="54" width="3" height="24" rx="1.5" fill="#F26A4B" opacity="0.75"/>
  <rect x="151" y="59" width="3" height="14" rx="1.5" fill="#F26A4B" opacity="0.55"/>
  <rect x="158" y="50" width="3" height="32" rx="1.5" fill="#F26A4B" opacity="0.9"/>
  <rect x="165" y="56" width="3" height="20" rx="1.5" fill="#F26A4B" opacity="0.65"/>
  <rect x="172" y="61" width="3" height="10" rx="1.5" fill="#F26A4B" opacity="0.45"/>
  <rect x="179" y="52" width="3" height="28" rx="1.5" fill="#F26A4B" opacity="0.8"/>
  <rect x="186" y="57" width="3" height="18" rx="1.5" fill="#F26A4B" opacity="0.6"/>
  <text x="200" y="71" font-family="sans-serif" font-size="11" font-weight="500" fill="#F26A4B">Listening</text>
  <text x="245" y="71" font-family="'JetBrains Mono',monospace" font-size="10" fill="rgba(242,106,75,0.45)">2.4s</text>
  <!-- Ripple ring -->
  <rect x="108" y="38" width="184" height="56" rx="28" fill="none" stroke="#F26A4B" stroke-width="0.5" opacity="0.15"/>

  <!-- Processing pill -->
  <text x="380" y="34" font-family="sans-serif" font-size="10" fill="#444" text-anchor="middle">Processing</text>
  <rect x="310" y="44" width="140" height="36" rx="18" fill="rgba(13,13,13,0.97)"/>
  <rect x="310" y="44" width="140" height="36" rx="18" stroke="#D1CFC0" stroke-width="0.5"/>
  <!-- Spinner -->
  <circle cx="332" cy="62" r="6" stroke="#2C2C2C" stroke-width="1.5" fill="none"/>
  <path d="M332 56 A6 6 0 0 1 338 62" stroke="#D1CFC0" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <text x="346" y="67" font-family="sans-serif" font-size="11" font-weight="500" fill="#D1CFC0">Transcribing...</text>

  <!-- Done pill -->
  <text x="530" y="34" font-family="sans-serif" font-size="10" fill="#444" text-anchor="middle">Done</text>
  <rect x="470" y="44" width="120" height="36" rx="18" fill="rgba(13,13,13,0.97)"/>
  <rect x="470" y="44" width="120" height="36" rx="18" stroke="#4ADE80" stroke-width="0.5"/>
  <path d="M490 62 L495 67 L505 57" stroke="#4ADE80" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <text x="514" y="67" font-family="sans-serif" font-size="11" font-weight="500" fill="#4ADE80">Injected</text>

  <!-- Overlay window -->
  <text x="675" y="34" font-family="sans-serif" font-size="10" fill="#444" text-anchor="middle">Prompt Overlay</text>
  <rect x="600" y="44" width="150" height="130" rx="10" fill="#111"/>
  <rect x="600" y="44" width="150" height="130" rx="10" stroke="#222"/>
  <text x="616" y="62" font-family="sans-serif" font-size="9" fill="#555">Captured text</text>
  <rect x="612" y="68" width="126" height="36" rx="5" fill="#0d0d0d"/>
  <rect x="612" y="68" width="126" height="36" rx="5" stroke="#1e1e1e"/>
  <text x="620" y="82" font-family="sans-serif" font-size="9.5" fill="#666">fix the bug where data</text>
  <text x="620" y="95" font-family="sans-serif" font-size="9.5" fill="#666">doesnt save on logout</text>
  <!-- Action chips -->
  <rect x="612" y="112" width="72" height="18" rx="4" fill="#F26A4B" opacity="0.12"/>
  <rect x="612" y="112" width="72" height="18" rx="4" stroke="#F26A4B" opacity="0.3"/>
  <text x="622" y="125" font-family="sans-serif" font-size="8.5" fill="#F26A4B">Enhance</text>
  <rect x="692" y="112" width="46" height="18" rx="4" fill="#1a1a1a"/>
  <rect x="692" y="112" width="46" height="18" rx="4" stroke="#2a2a2a"/>
  <text x="700" y="125" font-family="sans-serif" font-size="8.5" fill="#555">Concise</text>
  <!-- Enhance button -->
  <rect x="612" y="138" width="126" height="26" rx="6" fill="#F26A4B"/>
  <text x="650" y="155" font-family="sans-serif" font-size="10.5" font-weight="600" fill="white">Enhance</text>
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
