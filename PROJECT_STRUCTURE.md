# Project Structure - Visual Guide

## 📁 Complete File Tree

```
savedplaces-nl-search/
│
├── 📄 package.json              # Dependencies & scripts
├── 📄 tsconfig.json             # TypeScript config
├── 📄 tsconfig.node.json        # TypeScript config for Vite
├── 📄 vite.config.ts            # Vite bundler config
├── 📄 tailwind.config.js        # Tailwind CSS config
├── 📄 postcss.config.js         # PostCSS config
├── 📄 .gitignore                # Git ignore rules
├── 📄 index.html                # HTML entry point
│
├── 📚 Documentation/
│   ├── README.md                # Project overview
│   ├── SETUP.md                 # Setup & development guide
│   ├── COMMANDS.md              # Command reference
│   ├── PROJECT_STRUCTURE.md     # This file
│   ├── PRD.md                   # Product requirements
│   ├── ARCHITECTURE.md          # Technical architecture
│   └── ARCHITECTURE_SUMMARY.md  # Quick reference
│
└── 📂 src/                      # Source code
    ├── main.tsx                 # React entry point
    ├── App.tsx                  # Main app component
    ├── index.css                # Global styles (Tailwind)
    │
    ├── 📂 types/
    │   └── index.ts             # TypeScript type definitions
    │                            # - Place, PlaceEmbedding
    │                            # - SearchResult, AppConfig
    │                            # - ParseResult, TakeoutFormats
    │
    ├── 📂 db/
    │   └── index.ts             # Dexie database schema
    │                            # - SavedPlacesDB class
    │                            # - Tables: places, embeddings, config
    │                            # - Helper methods
    │
    └── 📂 components/
        ├── FileImportPanel.tsx  # Left panel: file upload
        ├── SearchBox.tsx        # Top: search input
        ├── ResultsList.tsx      # Main: search results
        └── DebugPanel.tsx       # Right: debug info
```

---

## 🎨 UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                     SavedPlaces NL Search                        │
├──────────────┬──────────────────────────────────┬───────────────┤
│              │                                   │               │
│  File Import │         Search Box                │  Debug Panel  │
│    Panel     │  ┌─────────────────────────────┐ │               │
│              │  │ Search your saved places... │ │  📍 Places: 0 │
│  ┌────────┐  │  └─────────────────────────────┘ │  🧠 Embed.: 0 │
│  │ Drop   │  │                                   │               │
│  │ File   │  │         Results List              │  Status:      │
│  │ Here   │  │  ┌─────────────────────────────┐ │  ✅ Database  │
│  └────────┘  │  │ 1. Blue Bottle Coffee       │ │  ✅ Search    │
│              │  │    66 Mint St, SF           │ │  ⚠️  ML Model │
│  [Browse]    │  │    [Open in Maps]           │ │               │
│              │  ├─────────────────────────────┤ │  Version:     │
│  Instructions│  │ 2. Tartine Bakery           │ │  0.1.0        │
│  1. Takeout  │  │    600 Guerrero St, SF      │ │               │
│  2. Export   │  │    [Open in Maps]           │ │               │
│  3. Upload   │  └─────────────────────────────┘ │               │
│              │                                   │               │
│  [Clear All] │                                   │               │
│              │                                   │               │
└──────────────┴──────────────────────────────────┴───────────────┘
```

---

## 🔄 Data Flow

### Import Flow
```
User drops file
    ↓
FileImportPanel.tsx
    ↓
Parse JSON (GeoJSON)
    ↓
Convert to Place[]
    ↓
db.places.bulkAdd()
    ↓
IndexedDB (places table)
    ↓
Update stats
    ↓
DebugPanel shows count
```

### Search Flow
```
User types query
    ↓
SearchBox.tsx
    ↓
App.tsx (handleSearch)
    ↓
Query db.places (keyword search)
    ↓
Return SearchResult[]
    ↓
ResultsList.tsx
    ↓
Display results
    ↓
User clicks "Open in Maps"
    ↓
window.open(Google Maps URL)
```

---

## 📦 Dependencies

### Production Dependencies
```json
{
  "react": "^18.2.0",           // UI framework
  "react-dom": "^18.2.0",       // React DOM renderer
  "dexie": "^3.2.4",            // IndexedDB wrapper
  "dexie-react-hooks": "^1.1.7" // React hooks for Dexie
}
```

### Development Dependencies
```json
{
  "@types/react": "^18.2.43",              // React types
  "@types/react-dom": "^18.2.17",          // React DOM types
  "@vitejs/plugin-react": "^4.2.1",        // Vite React plugin
  "typescript": "^5.2.2",                  // TypeScript compiler
  "vite": "^5.0.8",                        // Build tool
  "tailwindcss": "^3.3.6",                 // CSS framework
  "autoprefixer": "^10.4.16",              // CSS autoprefixer
  "postcss": "^8.4.32",                    // CSS processor
  "eslint": "^8.55.0",                     // Linter
  "@typescript-eslint/eslint-plugin": "^6.14.0",
  "@typescript-eslint/parser": "^6.14.0",
  "eslint-plugin-react-hooks": "^4.6.0",
  "eslint-plugin-react-refresh": "^0.4.5"
}
```

---

## 🗄️ Database Schema

### IndexedDB: `savedplaces-db`

```
┌─────────────────────────────────────────┐
│ Table: places                           │
├─────────────────────────────────────────┤
│ id (PK)          string (UUID)          │
│ name             string                 │
│ address          string?                │
│ coordinates      {lat, lng}?            │
│ notes            string?                │
│ listName         string?                │
│ category         PlaceCategory          │
│ url              string?                │
│ placeId          string?                │
│ metadata         PlaceMetadata          │
│ createdAt        Date                   │
│ importedAt       Date                   │
├─────────────────────────────────────────┤
│ Indexes: name, listName, category       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Table: embeddings                       │
├─────────────────────────────────────────┤
│ placeId (PK)     string (FK to places)  │
│ embedding        Float32Array (384-dim) │
│ embeddingVersion string                 │
│ textUsed         string                 │
│ createdAt        Date                   │
├─────────────────────────────────────────┤
│ No indexes (searched in-memory)         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Table: config                           │
├─────────────────────────────────────────┤
│ id (PK)          'singleton'            │
│ lastImportDate   Date?                  │
│ totalPlaces      number                 │
│ totalEmbeddings  number                 │
│ modelLoaded      boolean                │
│ modelVersion     string                 │
│ settings         UserSettings           │
└─────────────────────────────────────────┘
```

---

## 🎯 Component Responsibilities

### App.tsx (Main Orchestrator)
- Manages global state (search query, results)
- Coordinates between components
- Handles search logic (currently keyword-based)
- Queries database using Dexie hooks

### FileImportPanel.tsx (Left Panel)
- Drag & drop file upload
- File validation (JSON/GeoJSON only)
- Parse Google Takeout format
- Store places in IndexedDB
- Display import status
- Clear all data

### SearchBox.tsx (Top Bar)
- Text input for search query
- Disabled state when no data
- Example query buttons
- Clear button
- Submit on Enter

### ResultsList.tsx (Main Content)
- Display search results or all places
- Rank results by relevance
- Show place details (name, address, notes)
- "Open in Google Maps" button
- Empty states (no data, no results)

### DebugPanel.tsx (Right Sidebar)
- Display import stats
- Show embedding progress
- Status indicators
- Version info
- Warnings/notes

---

## 🚀 Build Output

### Development (`npm run dev`)
```
Vite dev server
├── Hot module replacement (HMR)
├── Fast refresh
├── Source maps
└── Port: 3000
```

### Production (`npm run build`)
```
dist/
├── index.html           # Optimized HTML
├── assets/
│   ├── index-[hash].js  # Bundled JS (minified)
│   └── index-[hash].css # Bundled CSS (minified)
└── vite.svg             # Favicon

Total size: ~200KB (before ML model)
```

---

## 📊 Size Estimates

| Asset | Size |
|-------|------|
| **React + React DOM** | ~140 KB (gzipped) |
| **Dexie** | ~20 KB (gzipped) |
| **Tailwind CSS** | ~10 KB (purged) |
| **App Code** | ~30 KB (gzipped) |
| **Total Bundle** | ~200 KB |
| | |
| **ML Model** (future) | ~23 MB (cached) |
| **IndexedDB Data** | ~1-4 MB (500-2000 places) |

---

## 🔐 Security Notes

### Local-Only Architecture
- ✅ No backend server
- ✅ No API calls (except Google Maps URLs)
- ✅ No data leaves browser
- ✅ IndexedDB is sandboxed per origin

### Input Validation
- ✅ File type validation (JSON/GeoJSON only)
- ✅ File size limit (50MB max)
- ✅ JSON parsing with try/catch
- ✅ URL validation before opening

### Privacy
- ✅ No analytics
- ✅ No tracking
- ✅ No cookies
- ✅ User can clear all data anytime

---

## 🎨 Styling Approach

### Tailwind CSS Utility Classes
```tsx
// Example from ResultsList.tsx
<div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
  <h3 className="text-base font-semibold text-gray-900 truncate">
    {place.name}
  </h3>
  <p className="text-sm text-gray-600 mb-2">
    {place.address}
  </p>
</div>
```

### Color Palette
- **Primary:** Blue 600 (`#2563eb`)
- **Success:** Green 600 (`#16a34a`)
- **Warning:** Yellow 600 (`#ca8a04`)
- **Error:** Red 600 (`#dc2626`)
- **Gray Scale:** Gray 50-900

---

## 🧪 Testing Strategy

### Manual Testing Checklist
- [ ] File upload (drag & drop)
- [ ] File upload (browse button)
- [ ] Invalid file rejection
- [ ] Import success message
- [ ] Database count updates
- [ ] Search with results
- [ ] Search with no results
- [ ] Open in Google Maps
- [ ] Clear all data
- [ ] Responsive layout

### Browser Compatibility
- ✅ Chrome 90+ (primary target)
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

### Required Features
- IndexedDB support
- ES6+ JavaScript
- CSS Grid & Flexbox
- Drag & Drop API

---

## 📝 Next Steps

### Phase 2: ML Integration
1. Install `@xenova/transformers`
2. Create `src/services/embedding.ts`
3. Create `src/services/search.ts`
4. Create `src/workers/ml-worker.ts`
5. Generate embeddings on import
6. Implement semantic search

### Phase 3: Chrome Extension
1. Install `@crxjs/vite-plugin`
2. Create `manifest.json`
3. Create `src/background.ts`
4. Create `src/content.ts`
5. Add side panel support
6. Test as unpacked extension

---

## 🎓 Learning Resources

- **React:** https://react.dev/learn
- **TypeScript:** https://www.typescriptlang.org/docs/
- **Vite:** https://vitejs.dev/guide/
- **Tailwind:** https://tailwindcss.com/docs
- **Dexie:** https://dexie.org/docs/Tutorial/React
- **Transformers.js:** https://huggingface.co/docs/transformers.js

---

**Created:** January 10, 2026  
**Status:** Phase 1 Complete ✅
