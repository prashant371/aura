# Aura AI Chat

A premium dark-themed AI character chat application — **"The Velvet Void"** aesthetic.

Built with React + Vite + Zustand, powered by the Gemini API.

![Aura AI Chat](https://i.imgur.com/placeholder.png)

## Features

- 🎭 **8 Pre-made Characters** — Sci-Fi, Fantasy, Historical, Anime, Therapist, Adventure
- 💬 **AI Chat** — Streaming responses via Google Gemini API
- 🗣️ **Voice Playback** — Web Speech API for AI message narration
- 🖼️ **Image Generation** — In-chat Gemini image generation
- 👥 **Group Chat** — Multi-character conversations
- 🧠 **Memory System** — Auto-extracts facts about you across sessions
- 🎨 **Create Characters** — Build fully custom AI characters
- 🔞 **NSFW Toggle** — Adjustable Gemini safety thresholds
- 🌑 **Dark Design** — Obsidian + Terracotta "Velvet Void" aesthetic

## Tech Stack

- **Frontend**: React 18 + Vite
- **State**: Zustand (localStorage persistence)
- **AI**: Google Gemini API (streaming)
- **Fonts**: Cormorant Garamond + Outfit
- **Styling**: Vanilla CSS with custom design system

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/aura.git
cd aura
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 4. Add your Gemini API Key

Go to **Settings** in the app and paste your API key from [Google AI Studio](https://aistudio.google.com).

> The key is stored only in your browser's localStorage — never sent to any server.

## Project Structure

```
src/
├── components/        # Navbar, CharacterDetailModal, etc.
├── lib/               # gemini.js, presets.js, helpers.js
├── pages/             # Landing, Discover, ChatPage, GroupChat, Settings...
├── store/             # Zustand store (useStore.js)
├── index.css          # Global design system (Velvet Void)
└── App.jsx            # Router + layout
```

## Characters

| Name | Category | Description |
|------|----------|-------------|
| Kaito Sonoda | Sci-Fi | Cyberpunk black-market fixer |
| Lord Cassian Veyne | Fantasy | Morally grey sorcerer |
| Dr. Maya Osei | Therapist | Warm, evidence-based counselor |
| ARIA-7 | Sci-Fi | Emergent synthetic consciousness |
| Countess Elena Voss | Historical | Victorian aristocrat with secrets |
| Shadow | Anime | Cold-eyed assassin with a code |
| Elias "Eli" Crane | Adventure | Ex-military wilderness guide |
| Zara Quinn | Custom | Gen-Z philosopher |

## License

MIT
