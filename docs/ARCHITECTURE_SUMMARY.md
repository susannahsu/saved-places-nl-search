# Architecture Summary - Quick Reference

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHROME EXTENSION                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Side Panel (React + TypeScript)                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │  Upload    │  │   Search   │  │  Results   │                │
│  │  Screen    │→ │   Screen   │→ │   List     │                │
│  └────────────┘  └────────────┘  └────────────┘                │
│                                         │                         │
│                                         ↓                         │
│                                  Open in Google Maps             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  BUSINESS LOGIC LAYER                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │  File Parser     │    │  Search Service  │                  │
│  │  ┌────────────┐  │    │  ┌────────────┐  │                  │
│  │  │ JSON Parser│  │    │  │ Vector     │  │                  │
│  │  │ CSV Parser │  │    │  │ Search     │  │                  │
│  │  └────────────┘  │    │  │ (Cosine)   │  │                  │
│  └──────────────────┘    │  └────────────┘  │                  │
│                           └──────────────────┘                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  ML LAYER (Web Worker)                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────┐                       │
│  │  Transformers.js                     │                       │
│  │  Model: all-MiniLM-L6-v2             │                       │
│  │  Output: 384-dim Float32Array        │                       │
│  └──────────────────────────────────────┘                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  DATA LAYER (IndexedDB via Dexie)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   places     │  │  embeddings  │  │    config    │          │
│  │              │  │              │  │              │          │
│  │ id (PK)      │  │ placeId (PK) │  │ id (PK)      │          │
│  │ name         │  │ embedding    │  │ settings     │          │
│  │ address      │  │ version      │  │ lastImport   │          │
│  │ notes        │  │ textUsed     │  │              │          │
│  │ coordinates  │  │ createdAt    │  │              │          │
│  │ listName     │  │              │  │              │          │
│  │ category     │  │              │  │              │          │
│  │ url          │  │              │  │              │          │
│  │ metadata     │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Import Flow
```
1. User uploads file
   ↓
2. Detect parser (JSON vs CSV)
   ↓
3. Parse → Place[]
   ↓
4. Store in IndexedDB (places table)
   ↓
5. Generate embeddings (Web Worker)
   ↓
6. Store embeddings (embeddings table)
   ↓
7. Show success message
```

### Search Flow
```
1. User types query
   ↓
2. Generate query embedding (Web Worker)
   ↓
3. Load all embeddings from IndexedDB
   ↓
4. Compute cosine similarity for each
   ↓
5. Filter (score > 0.3) & sort
   ↓
6. Take top 20 results
   ↓
7. Load Place details
   ↓
8. Display results
   ↓
9. User clicks → Open in Google Maps
```

## Key TypeScript Types

```typescript
// Core types
interface Place {
  id: string;
  name: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  notes?: string;
  listName?: string;
  category?: PlaceCategory;
  url?: string;
  placeId?: string;
  metadata: PlaceMetadata;
  createdAt: Date;
  importedAt: Date;
}

interface PlaceEmbedding {
  placeId: string;
  embedding: Float32Array;  // 384 dimensions
  embeddingVersion: string;
  textUsed: string;
  createdAt: Date;
}

interface SearchResult {
  placeId: string;
  score: number;    // 0-1 (cosine similarity)
  rank: number;     // 1-indexed
  clicked?: boolean;
}
```

## Storage Estimates

| Dataset Size | Places | Embeddings | Total |
|--------------|--------|------------|-------|
| Small        | 250 KB | 750 KB     | ~1 MB |
| Medium       | 500 KB | 1.5 MB     | ~2 MB |
| Large        | 1 MB   | 3 MB       | ~4 MB |

**Chrome Quota:** ~10MB (sufficient for 2,000+ places)

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **UI** | React + TypeScript | Type safety, component reuse |
| **Styling** | Tailwind CSS | Rapid prototyping, small bundle |
| **Storage** | IndexedDB + Dexie | Local-first, type-safe wrapper |
| **ML** | Transformers.js | Browser-native, no server needed |
| **Model** | all-MiniLM-L6-v2 | Small (23MB), fast, good quality |
| **Build** | Vite + CRXJS | Fast dev, Chrome extension support |
| **Testing** | Vitest + Testing Library | Fast, modern, good DX |

## Security & Privacy

✅ **100% Local** - All data in browser IndexedDB  
✅ **No Server** - Zero backend, no API calls  
✅ **No Tracking** - No analytics, no telemetry  
✅ **Minimal Permissions** - Only storage + sidePanel  
✅ **Input Sanitization** - XSS prevention  
✅ **URL Validation** - Only Google Maps URLs  

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **Import** | <10s for 500 places | Includes parsing + embedding |
| **Search** | <2s | Query → results displayed |
| **Bundle Size** | <5MB | Including React, not model |
| **Model Load** | <5s | One-time, cached offline |
| **Memory** | <100MB | With 500 places loaded |

## File Format Support

### Google Takeout JSON (GeoJSON)
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-122.4194, 37.7749]  // [lng, lat]
      },
      "properties": {
        "name": "Blue Bottle Coffee",
        "address": "66 Mint St, San Francisco, CA",
        "Comment": "Best pour-over in the city!",
        "Google Maps URL": "https://maps.google.com/?cid=123"
      }
    }
  ]
}
```

### CSV Format
```csv
Title,Note,URL,Location Address,Location Geo Coordinates
Blue Bottle Coffee,Best pour-over,https://maps.google.com/?cid=123,"66 Mint St, SF","37.7749,-122.4194"
```

## Error Handling Strategy

```typescript
// Graceful degradation
if (successRate >= 0.8) {
  // Proceed with partial import
  showWarning(`${failedRecords} records skipped`);
} else if (successRate > 0) {
  // Warn but allow
  showError(`Only ${successRate}% imported. Check format.`);
} else {
  // Block import
  showError('Failed to parse file. Invalid format.');
}
```

## Implementation Phases

**Week 1:** Core infrastructure + file parsing  
**Week 2:** ML pipeline + embedding generation  
**Week 3:** Search UI + results display  
**Week 4:** Polish + testing + Chrome Web Store prep  

## Quick Start Commands

```bash
# Setup
npm create vite@latest savedplaces-nl-search -- --template react-ts
cd savedplaces-nl-search
npm install

# Dependencies
npm install @xenova/transformers dexie react-dropzone

# Dev dependencies
npm install -D @crxjs/vite-plugin @types/chrome vitest

# Run dev server
npm run dev

# Build extension
npm run build

# Test
npm run test
```

## Useful Resources

- [Transformers.js Docs](https://huggingface.co/docs/transformers.js)
- [Dexie.js Guide](https://dexie.org/docs/)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Side Panel API](https://developer.chrome.com/docs/extensions/reference/sidePanel/)
- [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started)
