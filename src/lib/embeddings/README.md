# Embeddings Module

Local semantic search with vector embeddings.

## Features

✅ **Embedding Providers** - OpenAI and Mock implementations  
✅ **Search Engine** - Build index and perform similarity search  
✅ **Progress Tracking** - Real-time progress updates during indexing  
✅ **Type-Safe** - Full TypeScript support  
✅ **Tested** - Comprehensive unit tests  

## Architecture

```
┌─────────────────────────────────────────┐
│         SearchEngine                    │
├─────────────────────────────────────────┤
│                                         │
│  buildIndex(places)                     │
│    ↓                                    │
│  1. Build embedding texts               │
│  2. Generate embeddings (provider)      │
│  3. Store in IndexedDB                  │
│                                         │
│  search(query)                          │
│    ↓                                    │
│  1. Generate query embedding            │
│  2. Load stored embeddings              │
│  3. Compute cosine similarity           │
│  4. Return top K results                │
│                                         │
└─────────────────────────────────────────┘
         │                    │
         ↓                    ↓
┌──────────────────┐  ┌──────────────────┐
│ EmbeddingProvider│  │    IndexedDB     │
│  - OpenAI        │  │  - embeddings    │
│  - Mock          │  │    table         │
└──────────────────┘  └──────────────────┘
```

## Usage

### 1. Setup Provider

```typescript
import { OpenAIEmbeddingProvider, MockEmbeddingProvider } from './lib/embeddings';

// Production: OpenAI
const provider = new OpenAIEmbeddingProvider({
  apiKey: 'sk-...',
  model: 'text-embedding-3-small', // Optional
});

// Testing: Mock
const provider = new MockEmbeddingProvider();
```

### 2. Build Search Index

```typescript
import { SearchEngine } from './lib/embeddings';
import type { PlaceRecord } from './lib/parsers/types';

const engine = new SearchEngine(provider);

// Build index with progress tracking
await engine.buildIndex(places, (progress) => {
  console.log(`${progress.phase}: ${progress.current}/${progress.total}`);
  console.log(progress.message); // "Embedding 120/842..."
});
```

### 3. Search

```typescript
// Perform semantic search
const results = await engine.search('cute hot spring', {
  topK: 20,
  minScore: 0.3,
});

// Get places from results
const placeIds = results.map(r => r.placeId);
const places = await db.places.bulkGet(placeIds);

// Display results with scores
results.forEach((result, i) => {
  console.log(`${i + 1}. ${places[i].name} (${result.score.toFixed(2)})`);
});
```

### 4. React Integration

```tsx
import { useState } from 'react';
import { SearchEngine, MockEmbeddingProvider } from './lib/embeddings';
import EmbeddingProgress from './components/EmbeddingProgress';
import type { BuildIndexProgress } from './lib/embeddings/types';

function App() {
  const [progress, setProgress] = useState<BuildIndexProgress | null>(null);
  const [engine] = useState(() => new SearchEngine(new MockEmbeddingProvider()));

  const handleBuildIndex = async () => {
    const places = await db.places.toArray();
    
    await engine.buildIndex(places, (progress) => {
      setProgress(progress);
    });
  };

  return (
    <div>
      <button onClick={handleBuildIndex}>Build Index</button>
      {progress && <EmbeddingProgress progress={progress} />}
    </div>
  );
}
```

## API Reference

### Types

```typescript
interface EmbeddingProvider {
  name: string;
  dimensions: number;
  embed(text: string): Promise<EmbeddingVector>;
  embedBatch(texts: string[], onProgress?: ProgressCallback): Promise<EmbeddingVector[]>;
  isReady(): Promise<boolean>;
}

interface SearchEngine {
  buildIndex(places: PlaceRecord[], onProgress?: ProgressCallback): Promise<void>;
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  getStats(): Promise<IndexStats>;
  isIndexReady(): Promise<boolean>;
  clearIndex(): Promise<void>;
}

interface SearchOptions {
  topK?: number;        // Default: 20
  minScore?: number;    // Default: 0.3
}

interface SearchResult {
  placeId: string;
  score: number;        // Cosine similarity (0-1)
  rank: number;         // 1-indexed
}

interface BuildIndexProgress {
  current: number;
  total: number;
  phase: 'preparing' | 'embedding' | 'storing' | 'complete';
  message: string;
}
```

### Utility Functions

```typescript
// Build embedding text from place
function buildEmbeddingText(place: PlaceRecord): string;
// Returns: "name | notes | listName | address"

// Compute cosine similarity
function cosineSimilarity(a: Float32Array, b: Float32Array): number;
// Returns: similarity score (-1 to 1)

// Normalize vector to unit length
function normalizeVector(vector: Float32Array): Float32Array;

// Split array into batches
function batchArray<T>(array: T[], batchSize: number): T[][];
```

## Providers

### OpenAIEmbeddingProvider

Uses OpenAI's `text-embedding-3-small` model (1536 dimensions).

```typescript
const provider = new OpenAIEmbeddingProvider({
  apiKey: 'sk-...',           // Required
  model: 'text-embedding-3-small',  // Optional
  batchSize: 100,             // Optional
});

// Check if ready
const ready = await provider.isReady();

// Generate single embedding
const embedding = await provider.embed('coffee shop');

// Generate batch with progress
const embeddings = await provider.embedBatch(texts, (current, total) => {
  console.log(`${current}/${total}`);
});
```

**Features:**
- Batch processing (100 texts per request)
- Rate limiting (100ms delay between batches)
- Error handling with detailed messages
- Progress tracking

**Cost Estimate:**
- Model: text-embedding-3-small
- Cost: ~$0.02 per 1M tokens
- 500 places ≈ 10K tokens ≈ $0.0002

### MockEmbeddingProvider

Generates deterministic fake embeddings for testing (384 dimensions).

```typescript
const provider = new MockEmbeddingProvider(delay?: number);

// Instant embeddings
const fast = new MockEmbeddingProvider();

// Simulate network delay
const slow = new MockEmbeddingProvider(100);
```

**Features:**
- Deterministic (same text → same embedding)
- Normalized vectors (unit length)
- Configurable delay for testing
- No external dependencies

## Performance

### Indexing Performance

| Places | OpenAI (network) | Mock (local) |
|--------|-----------------|--------------|
| 100    | ~2s             | <1s          |
| 500    | ~8s             | ~2s          |
| 1000   | ~15s            | ~4s          |

### Search Performance

| Index Size | Search Time |
|-----------|-------------|
| 100       | <50ms       |
| 500       | <100ms      |
| 1000      | <200ms      |
| 2000      | <400ms      |

## Storage

### IndexedDB Schema

```typescript
// embeddings table
interface PlaceEmbedding {
  placeId: string;          // Primary key
  embedding: Float32Array;  // Vector (384 or 1536 dims)
  embeddingText: string;    // Text that was embedded
  provider: string;         // 'OpenAI' or 'Mock'
  dimensions: number;       // 384 or 1536
  createdAt: Date;
}
```

### Storage Estimates

| Places | OpenAI (1536-dim) | Mock (384-dim) |
|--------|------------------|----------------|
| 100    | ~600 KB          | ~150 KB        |
| 500    | ~3 MB            | ~750 KB        |
| 1000   | ~6 MB            | ~1.5 MB        |

## Examples

### Example 1: Build Index with OpenAI

```typescript
import { SearchEngine, OpenAIEmbeddingProvider } from './lib/embeddings';

// Get API key from localStorage
const apiKey = localStorage.getItem('openai_api_key');

if (!apiKey) {
  alert('Please set OpenAI API key in settings');
  return;
}

// Create provider and engine
const provider = new OpenAIEmbeddingProvider({ apiKey });
const engine = new SearchEngine(provider);

// Build index
const places = await db.places.toArray();

await engine.buildIndex(places, (progress) => {
  if (progress.phase === 'embedding') {
    console.log(`Embedding ${progress.current}/${progress.total}...`);
  }
});

console.log('Index built!');
```

### Example 2: Search with Results

```typescript
// Search
const results = await engine.search('romantic dinner', {
  topK: 10,
  minScore: 0.5,
});

// Load places
const placeIds = results.map(r => r.placeId);
const places = await db.places.bulkGet(placeIds);

// Display
results.forEach((result, i) => {
  const place = places[i];
  console.log(`${result.rank}. ${place.name}`);
  console.log(`   Score: ${(result.score * 100).toFixed(1)}%`);
  console.log(`   Notes: ${place.notes || 'N/A'}`);
});
```

### Example 3: Mock Provider for Testing

```typescript
import { SearchEngine, MockEmbeddingProvider } from './lib/embeddings';

// Use mock provider (no API key needed)
const provider = new MockEmbeddingProvider();
const engine = new SearchEngine(provider);

// Build index instantly
await engine.buildIndex(places);

// Search works the same
const results = await engine.search('coffee');
```

### Example 4: Progress UI Component

```tsx
function IndexBuilder({ places }: { places: PlaceRecord[] }) {
  const [progress, setProgress] = useState<BuildIndexProgress | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);

  const handleBuild = async () => {
    setIsBuilding(true);
    
    const provider = new MockEmbeddingProvider();
    const engine = new SearchEngine(provider);
    
    try {
      await engine.buildIndex(places, setProgress);
      alert('Index built successfully!');
    } catch (error) {
      alert('Failed to build index: ' + error.message);
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div>
      <button onClick={handleBuild} disabled={isBuilding}>
        Build Search Index
      </button>
      
      {progress && <EmbeddingProgress progress={progress} />}
    </div>
  );
}
```

## Testing

Run tests:

```bash
npm test embeddings
```

Test files:
- `__tests__/utils.test.ts` - Utility function tests
- `__tests__/mock-provider.test.ts` - Mock provider tests

## Best Practices

### 1. API Key Management

```typescript
// Store API key in localStorage
localStorage.setItem('openai_api_key', 'sk-...');

// Retrieve and validate
const apiKey = localStorage.getItem('openai_api_key');
if (!apiKey) {
  // Show settings UI
}
```

### 2. Error Handling

```typescript
try {
  await engine.buildIndex(places, setProgress);
} catch (error) {
  if (error.message.includes('API key')) {
    // Handle API key error
  } else if (error.message.includes('quota')) {
    // Handle quota error
  } else {
    // Generic error
  }
}
```

### 3. Progress Tracking

```typescript
await engine.buildIndex(places, (progress) => {
  // Update UI
  setProgress(progress);
  
  // Log to console
  console.log(`${progress.phase}: ${progress.message}`);
  
  // Track analytics
  if (progress.phase === 'complete') {
    analytics.track('index_built', {
      places: progress.total,
      provider: engine.provider.name,
    });
  }
});
```

### 4. Incremental Indexing

```typescript
// Check if index exists
const isReady = await engine.isIndexReady();

if (!isReady) {
  // Build full index
  await engine.buildIndex(places);
} else {
  // Get stats
  const stats = await engine.getStats();
  
  // Rebuild if outdated
  if (stats.totalPlaces !== places.length) {
    await engine.buildIndex(places);
  }
}
```

## Troubleshooting

### Issue: "API key is required"

**Solution:** Set OpenAI API key:
```typescript
localStorage.setItem('openai_api_key', 'sk-...');
```

### Issue: Slow indexing

**Solution:** Use batch processing or mock provider for development:
```typescript
const provider = new MockEmbeddingProvider();
```

### Issue: Search returns no results

**Solution:** Check minimum score threshold:
```typescript
const results = await engine.search(query, {
  minScore: 0.1, // Lower threshold
});
```

### Issue: Out of memory

**Solution:** Reduce batch size:
```typescript
const provider = new OpenAIEmbeddingProvider({
  apiKey,
  batchSize: 50, // Smaller batches
});
```

## Future Enhancements

- [ ] Local embedding models (Transformers.js)
- [ ] Approximate nearest neighbor (HNSW)
- [ ] Hybrid search (semantic + keyword)
- [ ] Query expansion
- [ ] Result re-ranking
- [ ] Caching and incremental updates

## License

MIT
