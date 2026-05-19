# 🌋 Hades Desktop AI Agent

<p align="center">
  <img src="public/icon/icon.png" width="128" height="128" style="border-radius: 8px 32px 8px 32px; border: 2px solid #dc2626;" alt="Hades Logo" />
</p>

<p align="center">
  <strong>A premium, ultra-fast, local desktop AI assistant built on Electron, React, and Google Gemini.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-42.0-red?style=for-the-badge&logo=electron&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19.0-red?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Vite-8.0-red?style=for-the-badge&logo=vite&logoColor=FFD62E" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-red?style=for-the-badge&logo=typescript&logoColor=white" />
</p>

---

## ⚡ Overview

**Hades** is a cutting-edge desktop agent designed for developers who want a seamless, highly reactive, and visually stunning AI integration. Named after the ruler of the underworld, it sports a curated dark theme with deep crimson gradients, micro-animations, and custom retro-futuristic arcade typography (`Press Start 2P`).

Hades provides immediate utility through floating layouts, system audio synthesis, translation pipelines, and highly customizable AI personas.

---

## ✨ Key Features

*   **🌋 Susurro (Voice Assistant):** Activated via custom hotkeys (`Alt+B`), this module streams and transcribes system audio and microphone inputs in real-time. It processes raw audio using Gemini Flash, generating contextual suggestions in a custom HUD.
*   **💬 MiniChat Window:** A sleek, lightweight, floating overlay that allows instant interaction with models like `gemini-2.5-flash` without disrupting your primary screen workspace.
*   **⌨️ Command Bar (`Alt+D`):** A spotlight-like launcher that takes quick text queries, performs real-time searches using Tavily, and returns rich answers with markdown support.
*   **🕶️ Stealth Mode:** Premium security feature that dynamically applies system-level window exclusion (`setContentProtection`) to hide the Hades interface entirely from screen recorders, capture software, and streaming platforms.
*   **🎭 Custom AI Personas:** Deep integration with Google AI Studio's models, allowing you to define, persist, and switch custom System Prompts and custom RAG data structures dynamically.
*   **💾 Local Storage & Privacy:** All chat histories, task records, and settings are saved locally on the user's machine (outside the repository folder) inside standard `userData` directories, keeping all data fully private.

---

## 🏗️ Architecture & Clean Code Rules

Hades follows a highly strict modular architecture, as detailed in [STRUCTURE.md](STRUCTURE.md):

*   **Single Source of Truth (SSoT):** Electron IPC operations are centralized inside `src/services/electron.ts`. All TypeScript signatures are strictly typed under `src/types/electron.ts`.
*   **Orchestrator/Logic Pattern (Hooks):** UI remains completely decoupled from operational logic. React custom hooks under `src/hooks/` handle asynchronous cycles under a strict 300-line limit per file.
*   **Optimized Utilities:** Audio conversion pipelines (`src/utils/audio.ts`) and Gemini API payload builders (`src/utils/ai.ts`) are isolated and optimized for maximum speed.

---

## 🚀 Quick Start

### Prerequisites

*   Node.js (v18.x or later)
*   npm or yarn

### 1. Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/your-username/Hades-Agent.git
cd Hades-Agent
npm install
```

### 2. Configuration

Hades requires API keys for Google Gemini and Tavily Search. 

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and paste your API keys:
   ```env
   VITE_GEMINI_API_KEY=your_google_gemini_api_key
   VITE_TAVILY_API_KEY=your_tavily_search_api_key
   ```
   *(Note: The `.env` file is protected and listed under `.gitignore` so it will never leak to public repositories).*

### 3. Running in Development

Start both Vite (for the frontend) and Electron processes concurrently:

```bash
npm run dev
```

---

## ⌨️ Global Shortcuts

Hades is designed for low-friction, keyboard-only desktop navigation:

| Shortcut | Action | Window |
| :--- | :--- | :--- |
| `Alt+D` | Toggle Spotlight Launcher | **Command Bar** |
| `Alt+B` | Open / Trigger Real-time Speech-to-Text | **Susurro Voice HUD** |
| `Esc` | Stop Recording / Close Window | **All Windows** |

---

## 📁 Repository Structure

```
├── electron/              # Electron Main Process files
│   ├── ipc/               # IPC Main Handlers
│   ├── services/          # Backend Services (AI, Logging, Audio)
│   └── store/             # JsonStore persistence layer
├── src/                   # React Frontend (Vite)
│   ├── components/        # Specialized modular UI Components
│   ├── hooks/             # Clean Logic & Orchestration Hooks
│   ├── services/          # SSoT Electron IPC bridge
│   ├── styles/            # Vanilla CSS design system
│   └── utils/             # High performance utilities (Audio, Image, AI)
├── .env.example           # Secure template for variables
├── STRUCTURE.md           # Developer guidelines & architectural rules
└── package.json           # Scripts and dependencies
```

---

## 🛡️ License

This project is licensed under the **ISC License**. Feel free to use, modify, and distribute it for personal and commercial applications.
