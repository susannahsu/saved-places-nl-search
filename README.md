# SavedPlaces NL Search 🗺️🔍

**Natural language search for your Google Maps saved places.**

A Chrome Extension that lets you search your saved places using natural language queries like "romantic dinner spot" or "cozy cafe for working" — without leaving Google Maps.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- 🔍 **Natural Language Search** - Find places by description, not just name
- 🧠 **Semantic Matching** - Powered by OpenAI embeddings (or mock for testing)
- 🔒 **Privacy-First** - All data stored locally in IndexedDB
- 🎯 **Smart Filters** - Search within specific lists ("in my tokyo list")
- 💡 **Match Explanations** - See why each place matched your query
- ⚡ **Fast & Local** - No external servers, works offline after setup
- 🎨 **Side Panel UI** - Integrated seamlessly with Google Maps

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Chrome browser
- Google Takeout export of your saved places (optional for testing)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd saved-places-nl-search
   npm install
   ```

2. **Build the extension:**
   ```bash
   npm run build:extension
   ```

3. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top-right)
   - Click "Load unpacked"
   - Select the `dist/` folder

4. **Test it out:**
   - Go to `https://www.google.com/maps`
   - Click the "Search Saved" button (top-left)
   - Import `data/susannah_example/Saved_Places_Extended.json`
   - Try searching: "romantic dinner", "coffee for working"

## 📖 Usage

### Getting Your Data

1. Go to [Google Takeout](https://takeout.google.com/)
2. Select "Maps (your places)"
3. Download the export
4. Upload the `Saved Places.json` file in the extension

### Searching

**Natural Language:**
- "romantic dinner spot"
- "cozy cafe for working"
- "spicy asian food"
- "historic landmarks"

**With List Filters:**
- "coffee in my boston list"
- "restaurants from favorites"

### Using OpenAI for Real Semantic Search

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Paste it in the "OpenAI API Key" field
3. Re-import your places
4. Enjoy accurate semantic search!

**Without an API key**, the extension uses mock embeddings for testing (results will be random).

## 🛠️ Development

### Available Commands

```bash
# Local development (web app)
npm run dev

# Build for extension
npm run build:extension

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Build for web deployment
npm run build
```

### Project Structure

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
└── icon-*.png         # Extension icons

docs/
├── PRD.md             # Product Requirements Document
├── ARCHITECTURE.md    # Technical Architecture
├── EXTENSION_SETUP.md # Extension Setup Guide
└── BUILD_AND_TEST.md  # Testing Guide
```

## 🎯 Tech Stack

**Frontend:**
- React + TypeScript
- Vite (build tool)
- Tailwind CSS
- Dexie (IndexedDB wrapper)

**Search & ML:**
- OpenAI Embeddings API (`text-embedding-3-small`)
- Cosine similarity for ranking
- Local vector storage

**Chrome Extension:**
- Manifest V3
- Side Panel API
- Content Scripts
- Service Worker

## 📚 Documentation

- **[PRD](docs/PRD.md)** - Product Requirements Document with JTBD, personas, and user stories
- **[Architecture](docs/ARCHITECTURE.md)** - Technical architecture and system design
- **[Extension Setup](docs/EXTENSION_SETUP.md)** - Detailed extension setup guide
- **[Build & Test](docs/BUILD_AND_TEST.md)** - Testing instructions and checklist

## 🧪 Testing

The project includes comprehensive unit tests:

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run
```

**Test Coverage:**
- ✅ JSON/CSV parsers with fixtures
- ✅ Embedding utilities
- ✅ Query parser and match explainer
- ✅ Mock embedding provider

## 🔒 Privacy & Security

- ✅ **No data collection** - Everything stays on your device
- ✅ **No tracking** - No analytics or telemetry
- ✅ **No scraping** - Doesn't read Google Maps data
- ✅ **Minimal permissions** - Only what's necessary
- ✅ **Open source** - Audit the code yourself

### Permissions

- `sidePanel` - Display the side panel UI
- `storage` - Store user preferences
- `activeTab` - Open URLs in current tab
- `host_permissions` - Inject content script on `maps.google.com`

## 🎨 Use Cases

1. **"Where was that ramen place?"**
   - Search: "ramen with amazing broth"
   - Finds places based on your notes, not just names

2. **"Find a coffee shop for working"**
   - Search: "quiet coffee with wifi"
   - Matches based on semantic meaning

3. **"What did I save in Tokyo?"**
   - Search: "in my tokyo list"
   - Filters by list name automatically

## 🚧 Known Limitations

1. **Manual import required** - User must export from Google Takeout
2. **No real-time sync** - Changes in Google Maps won't reflect until re-import
3. **API key required for semantic search** - Mock embeddings are random
4. **No image support** - Place photos not included
5. **No reviews/ratings** - Only saved place data

## 🗺️ Roadmap

### Phase 1: Core (✅ Complete)
- [x] File import (JSON/CSV)
- [x] IndexedDB storage
- [x] Semantic search with embeddings
- [x] Chrome Extension with side panel
- [x] Match explanations & filters

### Phase 2: Polish (🚧 In Progress)
- [ ] Keyboard shortcuts
- [ ] Onboarding flow
- [ ] Settings page
- [ ] Dark mode

### Phase 3: Publishing (📋 Planned)
- [ ] Chrome Web Store listing
- [ ] Demo video
- [ ] Portfolio integration

### Future Enhancements
- [ ] Local LLM support (WebLLM)
- [ ] Collaborative lists
- [ ] Export to other mapping services
- [ ] Mobile app version

## 🤝 Contributing

This is a portfolio project, but feedback and suggestions are welcome! Feel free to:
- Open issues for bugs or feature requests
- Submit PRs for improvements
- Use as a reference for your own projects

## 📄 License

MIT License - Feel free to use as a reference for your own projects!

## 🙏 Acknowledgments

Built as a product management & engineering portfolio piece to demonstrate:
- Product thinking (PRD, JTBD, personas)
- Full-stack engineering (React, TypeScript, Chrome Extensions)
- ML integration (embeddings, semantic search)
- System design (architecture, data modeling)

---

**Questions?** Check the [documentation](docs/) or open an issue!

**Built with ❤️ by [Your Name]**
