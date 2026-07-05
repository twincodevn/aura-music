# Aura Music

A cross-platform music player that streams tracks directly from YouTube — available as both a native desktop app (via Electron) and a web app.

## Overview

Aura Music lets you search for and play songs sourced from YouTube, with a clean, animated interface built on React and Tailwind CSS. It ships as a self-contained desktop application for macOS, and can also run as a web app backed by a lightweight Express server.

## Features

- 🎵 **Search & play** — find and stream tracks pulled from YouTube
- 📝 **Lyrics / transcripts** — fetches song transcripts alongside playback
- 💻 **Desktop app** — packaged with Electron for macOS (Apple Silicon), with English and Vietnamese language support
- 🌐 **Web mode** — run the same app in the browser via a local Express + SQLite backend
- 💾 **Local caching** — keeps track and playback data locally using SQLite (via `better-sqlite3`) and IndexedDB (`idb-keyval`)
- 🎨 **Modern UI** — smooth animations and transitions powered by Framer Motion, styled with Tailwind CSS
- 🌓 **Dark mode support**

## Tech Stack

**Frontend**
- React 19 + TypeScript
- Vite
- Tailwind CSS
- Framer Motion (animations)
- Lucide React (icons)

**Backend / Data**
- Express (local server for web mode)
- better-sqlite3 (local database)
- idb-keyval (browser-side caching)

**Media sourcing**
- `@distube/ytdl-core`, `play-dl`, `youtube-sr`, `youtubei.js` — search and stream extraction
- `youtube-transcript` — lyrics/transcript retrieval

**Desktop packaging**
- Electron + electron-builder (macOS `.dmg`, arm64)

## Getting Started

### Prerequisites
- Node.js (LTS recommended)
- npm

### Installation

```bash
git clone https://github.com/twincodevn/aura-music.git
cd aura-music
npm install
```

### Development

Run as a desktop app (Electron):
```bash
npm run dev
```

Run as a web app (Express server + Vite dev server):
```bash
npm run dev:web
```

### Build

Build the web bundle:
```bash
npm run build:web
```

Build and package the desktop app (macOS `.dmg`):
```bash
npm run dist
```

## Disclaimer

This project streams audio by extracting media from YouTube for personal, non-commercial use. It is not affiliated with or endorsed by YouTube/Google. Users are responsible for ensuring their use complies with YouTube's Terms of Service and applicable copyright law in their jurisdiction.
