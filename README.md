# SavedPlaces NL Search 🗺️🔍

**Natural language search for your Google Maps saved places.**

A Chrome Extension that lets you search your saved places using natural language queries like "cute hot spring" or "romantic dinner with outdoor seating" — without leaving Google Maps.

## ✨ Features

- 🔍 **Natural Language Search** - Find places by description, not just name
- 🧠 **Semantic Matching** - Powered by OpenAI embeddings or local models
- 🔒 **Privacy-First** - All data stored locally in IndexedDB
- 🎯 **Smart Filters** - Search within specific lists ("in my tokyo list")
- 💡 **Match Explanations** - See why each place matched your query
- ⚡ **Fast & Local** - No external servers, works offline after setup

## 🚀 Quick Start

### As a Web App (Development)

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Open http://localhost:5173
```

### As a Chrome Extension (Production)

```bash
# Build extension
npm run build:extension

# Load in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the dist/ folder
```

See [EXTENSION_SETUP.md](./EXTENSION_SETUP.md) for detailed instructions.

## 📋 Project Status

**Phase 1: Core App** ✅ Complete
- [x] File import (JSON/CSV parsing)
- [x] IndexedDB storage with Dexie
- [x] Semantic search with embeddings
- [x] Match explanations & filters
- [x] Loading/empty states

**Phase 2: Chrome Extension** ✅ Complete
- [x] Manifest V3 configuration
- [x] Side panel UI
- [x] Content script injection
- [x] Service worker
- [x] Google Maps integration

**Phase 3: Polish** 🚧 In Progress
- [ ] Generate extension icons
- [ ] Add keyboard shortcuts
- [ ] Add onboarding flow
- [ ] Add settings page

**Phase 4: Publishing** 📋 Planned
- [ ] Chrome Web Store listing
- [ ] Demo video
- [ ] Portfolio integration

## 📚 Documentation

- [PRD.md](./PRD.md) - Product Requirements Document
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical Architecture
- [EXTENSION_SETUP.md](./EXTENSION_SETUP.md) - Extension Setup Guide
- [EXTENSION_CHECKLIST.md](./EXTENSION_CHECKLIST.md) - Testing Checklist

## 🛠️ Tech Stack

**Frontend**
- React + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Dexie (IndexedDB wrapper)

**Search & ML**
- OpenAI Embeddings API (text-embedding-3-small)
- Cosine similarity for ranking
- Local vector storage

**Chrome Extension**
- Manifest V3
- Side Panel API
- Content Scripts
- Service Worker

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run
```

## 📦 Project Structure

```
src/
├── components/          # React components
│   ├── FileImportPanel.tsx
│   ├── SearchBox.tsx
│   ├── ResultsList.tsx
│   └── DebugPanel.tsx
├── lib/
│   ├── parsers/        # JSON/CSV parsing
│   ├── embeddings/     # Embedding generation & search
│   ├── search/         # Query parsing & match explanation
│   └── extension/      # Chrome Extension bridge
├── db/                 # Dexie database schema
└── types/              # TypeScript interfaces

public/
├── manifest.json       # Extension manifest
├── service-worker.js   # Background service worker
├── content-script.js   # Content script for Google Maps
└── content-script.css  # Injected button styles
```

## 🎯 Use Cases

1. **"Where was that ramen place?"**
   - Search: "ramen with amazing broth"
   - Finds places based on your notes, not just names

2. **"Find a coffee shop for working"**
   - Search: "quiet coffee with wifi"
   - Matches based on semantic meaning

3. **"What did I save in Tokyo?"**
   - Search: "in my tokyo list"
   - Filters by list name automatically

## 🔒 Privacy & Security

- ✅ **No data collection** - Everything stays on your device
- ✅ **No tracking** - No analytics or telemetry
- ✅ **No scraping** - Doesn't read Google Maps data
- ✅ **Minimal permissions** - Only what's necessary
- ✅ **Open source** - Audit the code yourself

## 🤝 Contributing

This is a portfolio project, but feedback and suggestions are welcome!

## 📄 License

MIT - Feel free to use as a reference for your own projects!

---

**Built with ❤️ as a product management & engineering portfolio piece.**
