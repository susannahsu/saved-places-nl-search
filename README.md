# SavedPlaces NL Search

Natural language search for your Google Maps saved places.

## Problem

Google Maps only supports keyword search for saved places. If you can't remember the exact name, you're stuck scrolling through lists.

## Solution

Upload your Google Takeout export and search using natural language queries like:
- "cute hot spring"
- "romantic dinner with outdoor seating"
- "cozy coffee shop for working"

## Quick Start

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Open http://localhost:3000
```

See [SETUP.md](./SETUP.md) for detailed instructions.

## Project Status

**Phase 1: UI Shell** ✅ Complete
- File import with drag & drop
- IndexedDB storage
- Basic keyword search
- Results display

**Phase 2: ML Integration** 🚧 Next
- Transformers.js
- Semantic search
- Embedding generation

**Phase 3: Chrome Extension** 📋 Planned
- Side panel UI
- Google Maps integration

## Documentation

- [PRD.md](./PRD.md) - Product Requirements Document
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical Architecture
- [SETUP.md](./SETUP.md) - Setup & Development Guide

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Dexie (IndexedDB)
- Transformers.js (coming soon)

## License

MIT
