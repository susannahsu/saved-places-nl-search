# Setup Guide - SavedPlaces NL Search

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install:
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Styling
- **Dexie** - IndexedDB wrapper
- **dexie-react-hooks** - React hooks for Dexie

### 2. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 3. Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

---

## Project Structure

```
savedplaces-nl-search/
├── index.html                 # HTML entry point
├── package.json               # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
├── .gitignore                # Git ignore rules
│
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Main app component
│   ├── index.css             # Global styles (Tailwind imports)
│   │
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   │
│   ├── db/
│   │   └── index.ts          # Dexie database schema
│   │
│   └── components/
│       ├── FileImportPanel.tsx    # Left panel: file upload
│       ├── SearchBox.tsx          # Top: search input
│       ├── ResultsList.tsx        # Main: search results
│       └── DebugPanel.tsx         # Right: debug info
│
├── PRD.md                    # Product Requirements Document
├── ARCHITECTURE.md           # Technical architecture
├── ARCHITECTURE_SUMMARY.md   # Quick reference
└── SETUP.md                  # This file
```

---

## Features Implemented

### ✅ Phase 1: Core UI Shell (Current)

- **File Import Panel** (Left)
  - Drag & drop file upload
  - File validation (JSON/GeoJSON only)
  - Parse Google Takeout GeoJSON format
  - Store places in IndexedDB
  - Clear all data functionality

- **Search Box** (Top)
  - Text input with placeholder
  - Disabled until data imported
  - Example query buttons
  - Clear button

- **Results List** (Main)
  - Display all places when no search
  - Show search results with ranking
  - "Open in Google Maps" button
  - Empty states (no data, no results)

- **Debug Panel** (Right)
  - Places imported count
  - Embeddings built count (placeholder)
  - Status indicators
  - Version info

### 🚧 Not Yet Implemented

- **ML Pipeline** - Transformers.js integration
- **Semantic Search** - Currently using keyword search
- **Embedding Generation** - Placeholder only
- **Chrome Extension** - Web app only for now

---

## How to Use

### Step 1: Get Your Google Takeout Data

1. Go to [Google Takeout](https://takeout.google.com/)
2. Click "Deselect all"
3. Scroll down and select only "Maps (your places)"
4. Click "Next step"
5. Choose export format (doesn't matter)
6. Click "Create export"
7. Wait for email (usually 5-10 minutes)
8. Download the ZIP file
9. Extract and find `Saved Places.json` (usually in `Takeout/Maps (your places)/`)

### Step 2: Import Your Data

1. Run `npm run dev` and open `http://localhost:3000`
2. Drag and drop the `Saved Places.json` file into the left panel
3. Wait for import to complete (should be instant for <500 places)
4. You should see the count update in the debug panel

### Step 3: Search Your Places

1. Type a query in the search box (e.g., "coffee")
2. Click "Search" or press Enter
3. Results will appear in the main area
4. Click "Open in Maps" to view in Google Maps

**Note:** Currently using simple keyword search. Semantic search will be added in Phase 2.

---

## Development Commands

```bash
# Install dependencies
npm install

# Run dev server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

---

## Database Schema

The app uses **IndexedDB** via **Dexie** for local storage.

### Tables

**places**
- Primary key: `id` (UUID)
- Indexes: `name`, `listName`, `category`, `importedAt`
- Stores: Place objects with name, address, coordinates, notes, etc.

**embeddings**
- Primary key: `placeId` (foreign key to places)
- Stores: 384-dim Float32Array embeddings (not yet implemented)

**config**
- Primary key: `id` (singleton: "singleton")
- Stores: App configuration and settings

### Viewing Database

Open Chrome DevTools → Application → IndexedDB → `savedplaces-db`

---

## Troubleshooting

### Import fails with "Invalid format"

**Cause:** File is not a valid GeoJSON FeatureCollection

**Solution:**
- Make sure you're uploading the `Saved Places.json` file from Google Takeout
- Check that the file starts with `{"type":"FeatureCollection","features":[...`
- Try re-exporting from Google Takeout

### Search returns no results

**Cause:** Currently using simple keyword search (case-insensitive substring match)

**Solution:**
- Try simpler queries (e.g., "coffee" instead of "cute coffee shop")
- Check spelling
- Wait for semantic search implementation in Phase 2

### "npm install" fails

**Cause:** npm cache or permissions issue

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install
```

### Port 3000 already in use

**Cause:** Another app is using port 3000

**Solution:**
```bash
# Kill process on port 3000 (Mac/Linux)
lsof -ti:3000 | xargs kill -9

# Or change port in vite.config.ts
server: {
  port: 3001,
}
```

---

## Next Steps

### Phase 2: ML Integration (Week 2)

1. Install Transformers.js: `npm install @xenova/transformers`
2. Create `src/services/embedding.ts` - embedding service
3. Create `src/services/search.ts` - vector search service
4. Set up Web Worker for non-blocking inference
5. Generate embeddings on import
6. Implement semantic search

### Phase 3: Chrome Extension (Week 3)

1. Install CRXJS: `npm install -D @crxjs/vite-plugin`
2. Create `manifest.json` for Chrome extension
3. Add side panel support
4. Add content script for Google Maps integration
5. Test as unpacked extension

### Phase 4: Polish (Week 4)

1. Add loading states and progress bars
2. Improve error handling
3. Add keyboard shortcuts
4. Add settings page
5. Write tests
6. Prepare for Chrome Web Store

---

## Contributing

This is a portfolio project, but suggestions are welcome!

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## License

MIT License - See LICENSE file for details

---

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Dexie.js](https://dexie.org/)
- [Transformers.js](https://huggingface.co/docs/transformers.js)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
