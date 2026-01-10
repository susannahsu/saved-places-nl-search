# SavedPlaces NL Search - MVP Architecture

**Author:** Staff Engineer  
**Date:** January 10, 2026  
**Status:** Design Document

---

## 1. System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Chrome Extension                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │   Side Panel │      │   Background │      │Content Script│  │
│  │   (React UI) │◄────►│   Service    │◄────►│ (Maps Page)  │  │
│  └──────────────┘      │   Worker     │      └──────────────┘  │
│         │               └──────────────┘              │          │
│         │                      │                      │          │
│         ▼                      ▼                      ▼          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              IndexedDB (Local Storage)                    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │  │
│  │  │  Places  │  │Embeddings│  │  Config  │               │  │
│  │  └──────────┘  └──────────┘  └──────────┘               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         ML Pipeline (Web Worker)                          │  │
│  │  ┌──────────────┐         ┌──────────────┐              │  │
│  │  │ Transformers │────────►│Vector Search │              │  │
│  │  │  .js Model   │         │ (Cosine Sim) │              │  │
│  │  └──────────────┘         └──────────────┘              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
         │                                              │
         ▼                                              ▼
┌──────────────────┐                          ┌──────────────────┐
│ Google Takeout   │                          │  Google Maps     │
│ (User Upload)    │                          │  (Open Result)   │
└──────────────────┘                          └──────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| **Side Panel UI** | User interface, file upload, search, results display | React + TypeScript + Tailwind |
| **Background Service Worker** | Orchestration, file parsing, embedding generation | TypeScript |
| **Content Script** | Detect Maps context, inject UI triggers | TypeScript |
| **Web Worker** | ML model inference (non-blocking) | Transformers.js |
| **IndexedDB** | Persistent local storage | Dexie.js wrapper |

---

## 2. Data Schema

### TypeScript Interfaces

```typescript
// ============================================================================
// Core Domain Types
// ============================================================================

/**
 * Normalized place representation
 * Supports multiple source formats (Takeout JSON, CSV, etc.)
 */
interface Place {
  id: string;                    // UUID v4
  name: string;                  // Place name (e.g., "Blue Bottle Coffee")
  address?: string;              // Full address
  coordinates?: Coordinates;     // Lat/lng if available
  notes?: string;                // User's notes/comments
  listName?: string;             // Original list name (e.g., "Coffee Shops")
  category?: PlaceCategory;      // Auto-detected or from source
  url?: string;                  // Google Maps URL if available
  placeId?: string;              // Google Maps Place ID if available
  metadata: PlaceMetadata;       // Source and import info
  createdAt: Date;               // When saved in Google Maps
  importedAt: Date;              // When imported into extension
}

interface Coordinates {
  lat: number;
  lng: number;
}

enum PlaceCategory {
  RESTAURANT = 'restaurant',
  CAFE = 'cafe',
  BAR = 'bar',
  HOTEL = 'hotel',
  ATTRACTION = 'attraction',
  SHOP = 'shop',
  OTHER = 'other',
}

interface PlaceMetadata {
  source: 'takeout_json' | 'takeout_csv' | 'manual';
  sourceFile: string;            // Original filename
  importVersion: string;         // Extension version at import
  rawData?: Record<string, any>; // Original data for debugging
}

/**
 * Vector embedding for semantic search
 * Stored separately from Place for efficient querying
 */
interface PlaceEmbedding {
  placeId: string;               // Foreign key to Place.id
  embedding: Float32Array;       // 384-dim vector (all-MiniLM-L6-v2)
  embeddingVersion: string;      // Model version (for future upgrades)
  textUsed: string;              // Text that was embedded (for debugging)
  createdAt: Date;
}

/**
 * Search query and results (for history/analytics)
 */
interface SearchQuery {
  id: string;                    // UUID v4
  query: string;                 // User's natural language query
  embedding: Float32Array;       // Query embedding
  results: SearchResult[];       // Ranked results
  timestamp: Date;
}

interface SearchResult {
  placeId: string;               // Reference to Place
  score: number;                 // Cosine similarity score (0-1)
  rank: number;                  // Position in results (1-indexed)
  clicked?: boolean;             // Did user click this result?
  clickedAt?: Date;
}

// ============================================================================
// Google Takeout Source Formats
// ============================================================================

/**
 * Google Takeout "Saved Places.json" structure
 * Based on 2024-2026 format (may change)
 */
interface TakeoutSavedPlaces {
  type: 'FeatureCollection';
  features: TakeoutFeature[];
}

interface TakeoutFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat] - note order!
  };
  properties: {
    name: string;
    address?: string;
    'Location'?: {
      'Business Name'?: string;
      'Address'?: string;
      'Geo Coordinates'?: {
        'Latitude'?: number;
        'Longitude'?: number;
      };
    };
    'Google Maps URL'?: string;
    'Published'?: string;          // ISO date string
    'Updated'?: string;            // ISO date string
    'Starred'?: boolean;
    'Comment'?: string;            // User's note
  };
}

/**
 * Alternative CSV format (if user exports differently)
 */
interface TakeoutCSVRow {
  Title: string;
  Note?: string;
  URL?: string;
  'Location Name'?: string;
  'Location Address'?: string;
  'Location Country Code'?: string;
  'Location Geo Coordinates'?: string; // "lat,lng" format
}

// ============================================================================
// Application State
// ============================================================================

interface AppConfig {
  id: 'singleton';               // Only one config record
  lastImportDate?: Date;
  totalPlaces: number;
  modelLoaded: boolean;
  modelVersion: string;
  settings: UserSettings;
}

interface UserSettings {
  maxResults: number;            // Default: 20
  minSimilarityScore: number;    // Default: 0.3 (filter low-quality results)
  openInNewTab: boolean;         // Default: true
  enableSearchHistory: boolean;  // Default: false (privacy)
  theme: 'light' | 'dark' | 'auto';
}

// ============================================================================
// Error Types
// ============================================================================

enum ErrorCode {
  PARSE_ERROR = 'PARSE_ERROR',
  INVALID_FORMAT = 'INVALID_FORMAT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  STORAGE_ERROR = 'STORAGE_ERROR',
  MODEL_LOAD_ERROR = 'MODEL_LOAD_ERROR',
  EMBEDDING_ERROR = 'EMBEDDING_ERROR',
  SEARCH_ERROR = 'SEARCH_ERROR',
}

interface AppError {
  code: ErrorCode;
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
}
```

---

## 3. IndexedDB Schema

### Database Design

**Database Name:** `savedplaces-db`  
**Version:** 1

```typescript
// Using Dexie.js for type-safe IndexedDB wrapper
import Dexie, { Table } from 'dexie';

class SavedPlacesDB extends Dexie {
  places!: Table<Place, string>;
  embeddings!: Table<PlaceEmbedding, string>;
  searchHistory!: Table<SearchQuery, string>;
  config!: Table<AppConfig, string>;

  constructor() {
    super('savedplaces-db');
    
    this.version(1).stores({
      // Primary key: id
      // Indexes: name, listName, category, importedAt
      places: 'id, name, listName, category, importedAt',
      
      // Primary key: placeId (one-to-one with Place)
      // No additional indexes needed (embeddings searched in-memory)
      embeddings: 'placeId',
      
      // Primary key: id
      // Index: timestamp (for recent searches)
      searchHistory: 'id, timestamp',
      
      // Primary key: id (singleton)
      config: 'id',
    });
  }
}

// Singleton instance
export const db = new SavedPlacesDB();
```

### Storage Estimates

| Data Type | Size per Record | 500 Places | 1000 Places |
|-----------|----------------|------------|-------------|
| Place | ~500 bytes | 250 KB | 500 KB |
| Embedding (384-dim float32) | ~1.5 KB | 750 KB | 1.5 MB |
| Search History (50 queries) | ~2 KB each | 100 KB | 100 KB |
| **Total** | | **~1.1 MB** | **~2.1 MB** |

**Storage Quota:** Chrome extensions have ~10MB IndexedDB quota (more if requested). This design easily fits 2,000+ places.

---

## 4. File Parsing Strategy

### Parser Architecture

```typescript
// ============================================================================
// Parser Interface
// ============================================================================

interface FileParser {
  /**
   * Detect if this parser can handle the file
   */
  canParse(file: File): Promise<boolean>;
  
  /**
   * Parse file into normalized Place objects
   * Returns partial results + errors for resilience
   */
  parse(file: File): Promise<ParseResult>;
}

interface ParseResult {
  places: Place[];
  errors: ParseError[];
  metadata: {
    totalRecords: number;
    successfulRecords: number;
    failedRecords: number;
    fileName: string;
    fileSize: number;
    parseTime: number; // milliseconds
  };
}

interface ParseError {
  line?: number;
  record?: any;
  error: string;
  severity: 'warning' | 'error';
}

// ============================================================================
// Concrete Parsers
// ============================================================================

/**
 * Parser for Google Takeout "Saved Places.json" (GeoJSON format)
 */
class TakeoutJSONParser implements FileParser {
  async canParse(file: File): Promise<boolean> {
    // Check file extension and MIME type
    if (!file.name.endsWith('.json') && !file.name.endsWith('.geojson')) {
      return false;
    }
    
    // Peek at first 1KB to check structure
    const preview = await file.slice(0, 1024).text();
    try {
      const json = JSON.parse(preview);
      return json.type === 'FeatureCollection' && Array.isArray(json.features);
    } catch {
      return false;
    }
  }
  
  async parse(file: File): Promise<ParseResult> {
    const startTime = performance.now();
    const places: Place[] = [];
    const errors: ParseError[] = [];
    
    try {
      const text = await file.text();
      const data: TakeoutSavedPlaces = JSON.parse(text);
      
      if (!data.features || !Array.isArray(data.features)) {
        throw new Error('Invalid GeoJSON: missing features array');
      }
      
      for (let i = 0; i < data.features.length; i++) {
        try {
          const feature = data.features[i];
          const place = this.featureToPlace(feature, file.name);
          places.push(place);
        } catch (error) {
          errors.push({
            line: i,
            record: data.features[i],
            error: error instanceof Error ? error.message : String(error),
            severity: 'warning',
          });
        }
      }
      
      return {
        places,
        errors,
        metadata: {
          totalRecords: data.features.length,
          successfulRecords: places.length,
          failedRecords: errors.length,
          fileName: file.name,
          fileSize: file.size,
          parseTime: performance.now() - startTime,
        },
      };
    } catch (error) {
      // Fatal parsing error
      errors.push({
        error: error instanceof Error ? error.message : String(error),
        severity: 'error',
      });
      
      return {
        places,
        errors,
        metadata: {
          totalRecords: 0,
          successfulRecords: 0,
          failedRecords: 1,
          fileName: file.name,
          fileSize: file.size,
          parseTime: performance.now() - startTime,
        },
      };
    }
  }
  
  private featureToPlace(feature: TakeoutFeature, sourceFile: string): Place {
    const props = feature.properties;
    
    // Extract coordinates (GeoJSON uses [lng, lat] order!)
    const coordinates: Coordinates | undefined = feature.geometry?.coordinates
      ? { lng: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] }
      : undefined;
    
    // Try to extract place name from various fields
    const name = props.name 
      || props.Location?.['Business Name'] 
      || 'Unnamed Place';
    
    // Extract address
    const address = props.address 
      || props.Location?.Address 
      || undefined;
    
    // Extract Google Maps URL and place ID
    const url = props['Google Maps URL'];
    const placeId = url ? this.extractPlaceId(url) : undefined;
    
    // Detect category from name/address (simple heuristic)
    const category = this.detectCategory(name, address);
    
    return {
      id: crypto.randomUUID(),
      name,
      address,
      coordinates,
      notes: props.Comment,
      listName: undefined, // Takeout doesn't include list name in GeoJSON
      category,
      url,
      placeId,
      metadata: {
        source: 'takeout_json',
        sourceFile,
        importVersion: chrome.runtime.getManifest().version,
        rawData: props,
      },
      createdAt: props.Published ? new Date(props.Published) : new Date(),
      importedAt: new Date(),
    };
  }
  
  private extractPlaceId(url: string): string | undefined {
    // Extract place_id from URL like:
    // https://maps.google.com/?cid=123456789
    // https://www.google.com/maps/place/.../@lat,lng,zoom/data=!4m5!3m4!1s0x123:0xabc...
    const placeIdMatch = url.match(/place_id=([^&]+)/);
    if (placeIdMatch) return placeIdMatch[1];
    
    const cidMatch = url.match(/cid=(\d+)/);
    if (cidMatch) return cidMatch[1];
    
    return undefined;
  }
  
  private detectCategory(name: string, address?: string): PlaceCategory {
    const text = `${name} ${address || ''}`.toLowerCase();
    
    if (/(restaurant|cafe|coffee|diner|bistro|eatery)/i.test(text)) {
      return PlaceCategory.CAFE;
    }
    if (/(bar|pub|brewery|lounge)/i.test(text)) {
      return PlaceCategory.BAR;
    }
    if (/(hotel|inn|resort|motel)/i.test(text)) {
      return PlaceCategory.HOTEL;
    }
    if (/(museum|park|monument|gallery|theater)/i.test(text)) {
      return PlaceCategory.ATTRACTION;
    }
    if (/(shop|store|market|boutique)/i.test(text)) {
      return PlaceCategory.SHOP;
    }
    
    return PlaceCategory.OTHER;
  }
}

/**
 * Parser for CSV exports (alternative format)
 */
class TakeoutCSVParser implements FileParser {
  async canParse(file: File): Promise<boolean> {
    if (!file.name.endsWith('.csv')) return false;
    
    const preview = await file.slice(0, 1024).text();
    // Check for expected column headers
    return /Title|Location Name|URL/i.test(preview);
  }
  
  async parse(file: File): Promise<ParseResult> {
    const startTime = performance.now();
    const places: Place[] = [];
    const errors: ParseError[] = [];
    
    try {
      const text = await file.text();
      const rows = this.parseCSV(text);
      
      for (let i = 1; i < rows.length; i++) { // Skip header row
        try {
          const place = this.rowToPlace(rows[i], rows[0], file.name);
          if (place) places.push(place);
        } catch (error) {
          errors.push({
            line: i + 1,
            record: rows[i],
            error: error instanceof Error ? error.message : String(error),
            severity: 'warning',
          });
        }
      }
      
      return {
        places,
        errors,
        metadata: {
          totalRecords: rows.length - 1,
          successfulRecords: places.length,
          failedRecords: errors.length,
          fileName: file.name,
          fileSize: file.size,
          parseTime: performance.now() - startTime,
        },
      };
    } catch (error) {
      errors.push({
        error: error instanceof Error ? error.message : String(error),
        severity: 'error',
      });
      
      return {
        places,
        errors,
        metadata: {
          totalRecords: 0,
          successfulRecords: 0,
          failedRecords: 1,
          fileName: file.name,
          fileSize: file.size,
          parseTime: performance.now() - startTime,
        },
      };
    }
  }
  
  private parseCSV(text: string): string[][] {
    // Simple CSV parser (for production, use papaparse library)
    const lines = text.split('\n');
    return lines.map(line => {
      // Handle quoted fields with commas
      const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
      const fields: string[] = [];
      let match;
      while ((match = regex.exec(line)) !== null) {
        fields.push(match[1].replace(/^"|"$/g, '').replace(/""/g, '"'));
      }
      return fields;
    });
  }
  
  private rowToPlace(row: string[], headers: string[], sourceFile: string): Place | null {
    const getValue = (header: string): string | undefined => {
      const index = headers.findIndex(h => h.toLowerCase().includes(header.toLowerCase()));
      return index >= 0 ? row[index]?.trim() : undefined;
    };
    
    const name = getValue('title') || getValue('name');
    if (!name) return null; // Skip rows without name
    
    const coordinates = this.parseCoordinates(getValue('coordinates'));
    
    return {
      id: crypto.randomUUID(),
      name,
      address: getValue('address'),
      coordinates,
      notes: getValue('note') || getValue('comment'),
      listName: getValue('list'),
      category: PlaceCategory.OTHER,
      url: getValue('url'),
      placeId: undefined,
      metadata: {
        source: 'takeout_csv',
        sourceFile,
        importVersion: chrome.runtime.getManifest().version,
      },
      createdAt: new Date(),
      importedAt: new Date(),
    };
  }
  
  private parseCoordinates(coordStr?: string): Coordinates | undefined {
    if (!coordStr) return undefined;
    
    // Handle formats: "lat,lng" or "lat, lng"
    const match = coordStr.match(/([-\d.]+),\s*([-\d.]+)/);
    if (!match) return undefined;
    
    return {
      lat: parseFloat(match[1]),
      lng: parseFloat(match[2]),
    };
  }
}

// ============================================================================
// Parser Registry
// ============================================================================

class ParserRegistry {
  private parsers: FileParser[] = [
    new TakeoutJSONParser(),
    new TakeoutCSVParser(),
  ];
  
  async detectParser(file: File): Promise<FileParser | null> {
    for (const parser of this.parsers) {
      if (await parser.canParse(file)) {
        return parser;
      }
    }
    return null;
  }
}

export const parserRegistry = new ParserRegistry();
```

### Error Handling Strategy

```typescript
/**
 * Graceful error handling with user-friendly messages
 */
class ErrorHandler {
  /**
   * Handle parsing errors with recovery
   */
  handleParseError(result: ParseResult): {
    shouldProceed: boolean;
    userMessage: string;
    technicalDetails: string;
  } {
    const { metadata, errors } = result;
    const successRate = metadata.successfulRecords / metadata.totalRecords;
    
    // Fatal error: no records parsed
    if (metadata.successfulRecords === 0) {
      return {
        shouldProceed: false,
        userMessage: 'Failed to parse file. Please check the format and try again.',
        technicalDetails: errors.map(e => e.error).join('\n'),
      };
    }
    
    // Partial success: >80% parsed
    if (successRate >= 0.8) {
      return {
        shouldProceed: true,
        userMessage: `Successfully imported ${metadata.successfulRecords} places. ${metadata.failedRecords} records skipped due to errors.`,
        technicalDetails: errors.map(e => `Line ${e.line}: ${e.error}`).join('\n'),
      };
    }
    
    // Low success rate: warn user
    return {
      shouldProceed: true,
      userMessage: `Imported ${metadata.successfulRecords} places, but ${metadata.failedRecords} failed. File may be in unexpected format.`,
      technicalDetails: errors.map(e => `Line ${e.line}: ${e.error}`).join('\n'),
    };
  }
  
  /**
   * Handle storage errors
   */
  handleStorageError(error: any): string {
    if (error.name === 'QuotaExceededError') {
      return 'Storage quota exceeded. Try importing fewer places or clearing old data.';
    }
    
    return 'Failed to save data locally. Please try again.';
  }
  
  /**
   * Handle ML model errors
   */
  handleModelError(error: any): string {
    if (error.message?.includes('fetch')) {
      return 'Failed to load AI model. Check your internet connection.';
    }
    
    return 'AI model failed to load. Please refresh and try again.';
  }
}

export const errorHandler = new ErrorHandler();
```

---

## 5. Embedding & Vector Search

### ML Pipeline Architecture

```typescript
// ============================================================================
// Embedding Service (runs in Web Worker)
// ============================================================================

import { pipeline, Pipeline } from '@xenova/transformers';

class EmbeddingService {
  private model: Pipeline | null = null;
  private modelName = 'Xenova/all-MiniLM-L6-v2'; // 384-dim, 23MB model
  
  /**
   * Initialize model (lazy load on first use)
   */
  async initialize(): Promise<void> {
    if (this.model) return;
    
    console.log('Loading embedding model...');
    const startTime = performance.now();
    
    try {
      this.model = await pipeline('feature-extraction', this.modelName);
      console.log(`Model loaded in ${performance.now() - startTime}ms`);
    } catch (error) {
      console.error('Failed to load model:', error);
      throw new Error('Failed to load AI model');
    }
  }
  
  /**
   * Generate embedding for a single text
   */
  async embed(text: string): Promise<Float32Array> {
    await this.initialize();
    
    if (!this.model) {
      throw new Error('Model not initialized');
    }
    
    try {
      // Generate embedding
      const output = await this.model(text, {
        pooling: 'mean',
        normalize: true,
      });
      
      // Convert to Float32Array
      return new Float32Array(output.data);
    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw new Error('Failed to generate embedding');
    }
  }
  
  /**
   * Batch embed multiple texts (more efficient)
   */
  async embedBatch(texts: string[]): Promise<Float32Array[]> {
    await this.initialize();
    
    if (!this.model) {
      throw new Error('Model not initialized');
    }
    
    // Process in batches of 32 for memory efficiency
    const batchSize = 32;
    const embeddings: Float32Array[] = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(
        batch.map(text => this.embed(text))
      );
      embeddings.push(...batchEmbeddings);
      
      // Progress callback
      if (i % 100 === 0) {
        console.log(`Embedded ${i}/${texts.length} places`);
      }
    }
    
    return embeddings;
  }
  
  /**
   * Prepare text for embedding (combine place fields)
   */
  prepareText(place: Place): string {
    const parts: string[] = [place.name];
    
    if (place.notes) parts.push(place.notes);
    if (place.listName) parts.push(place.listName);
    if (place.address) parts.push(place.address);
    if (place.category) parts.push(place.category);
    
    return parts.join(' | ');
  }
}

export const embeddingService = new EmbeddingService();

// ============================================================================
// Vector Search Service
// ============================================================================

class VectorSearchService {
  /**
   * Cosine similarity between two vectors
   */
  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same dimension');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    // Handle zero vectors
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  /**
   * Search for similar places
   */
  async search(
    query: string,
    maxResults: number = 20,
    minScore: number = 0.3
  ): Promise<SearchResult[]> {
    // Generate query embedding
    const queryEmbedding = await embeddingService.embed(query);
    
    // Load all embeddings from IndexedDB
    const embeddings = await db.embeddings.toArray();
    
    // Compute similarities
    const results: SearchResult[] = embeddings.map((emb, index) => ({
      placeId: emb.placeId,
      score: this.cosineSimilarity(queryEmbedding, emb.embedding),
      rank: 0, // Will be set after sorting
      clicked: false,
    }));
    
    // Filter by minimum score and sort by score descending
    const filtered = results
      .filter(r => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
    
    // Set ranks
    filtered.forEach((result, index) => {
      result.rank = index + 1;
    });
    
    return filtered;
  }
  
  /**
   * Optimized search with early termination
   * For large datasets (1000+ places), use approximate nearest neighbor
   */
  async searchOptimized(
    query: string,
    maxResults: number = 20,
    minScore: number = 0.3
  ): Promise<SearchResult[]> {
    const queryEmbedding = await embeddingService.embed(query);
    
    // Stream embeddings to avoid loading all into memory
    const results: SearchResult[] = [];
    
    await db.embeddings.each((emb) => {
      const score = this.cosineSimilarity(queryEmbedding, emb.embedding);
      
      if (score >= minScore) {
        results.push({
          placeId: emb.placeId,
          score,
          rank: 0,
          clicked: false,
        });
      }
    });
    
    // Sort and take top N
    results.sort((a, b) => b.score - a.score);
    const topResults = results.slice(0, maxResults);
    
    // Set ranks
    topResults.forEach((result, index) => {
      result.rank = index + 1;
    });
    
    return topResults;
  }
}

export const vectorSearchService = new VectorSearchService();
```

### Performance Optimization

```typescript
/**
 * Web Worker for non-blocking ML operations
 */
// worker.ts
import { embeddingService } from './embedding-service';

self.onmessage = async (event) => {
  const { type, payload } = event.data;
  
  try {
    switch (type) {
      case 'INITIALIZE_MODEL':
        await embeddingService.initialize();
        self.postMessage({ type: 'MODEL_READY' });
        break;
        
      case 'EMBED_TEXT':
        const embedding = await embeddingService.embed(payload.text);
        self.postMessage({ 
          type: 'EMBEDDING_RESULT', 
          payload: { id: payload.id, embedding } 
        });
        break;
        
      case 'EMBED_BATCH':
        const embeddings = await embeddingService.embedBatch(payload.texts);
        self.postMessage({ 
          type: 'BATCH_RESULT', 
          payload: { embeddings } 
        });
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({ 
      type: 'ERROR', 
      payload: { error: error instanceof Error ? error.message : String(error) } 
    });
  }
};

// Main thread usage
class MLWorkerClient {
  private worker: Worker;
  
  constructor() {
    this.worker = new Worker(new URL('./worker.ts', import.meta.url));
  }
  
  async embed(text: string): Promise<Float32Array> {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      
      const handler = (event: MessageEvent) => {
        if (event.data.type === 'EMBEDDING_RESULT' && event.data.payload.id === id) {
          this.worker.removeEventListener('message', handler);
          resolve(event.data.payload.embedding);
        } else if (event.data.type === 'ERROR') {
          this.worker.removeEventListener('message', handler);
          reject(new Error(event.data.payload.error));
        }
      };
      
      this.worker.addEventListener('message', handler);
      this.worker.postMessage({ type: 'EMBED_TEXT', payload: { id, text } });
    });
  }
}

export const mlWorker = new MLWorkerClient();
```

---

## 6. Google Maps Integration

### URL Generation

```typescript
/**
 * Generate Google Maps URLs for opening places
 */
class MapsURLService {
  /**
   * Generate URL from place data
   * Priority: placeId > coordinates > address > name
   */
  generateURL(place: Place): string {
    // Best: Use existing Google Maps URL
    if (place.url) {
      return place.url;
    }
    
    // Good: Use place ID
    if (place.placeId) {
      return `https://www.google.com/maps/place/?q=place_id:${place.placeId}`;
    }
    
    // OK: Use coordinates
    if (place.coordinates) {
      const { lat, lng } = place.coordinates;
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }
    
    // Fallback: Search by name and address
    const query = place.address 
      ? `${place.name}, ${place.address}`
      : place.name;
    
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }
  
  /**
   * Open place in Google Maps
   */
  openPlace(place: Place, newTab: boolean = true): void {
    const url = this.generateURL(place);
    
    if (newTab) {
      chrome.tabs.create({ url });
    } else {
      chrome.tabs.update({ url });
    }
  }
}

export const mapsURLService = new MapsURLService();
```

---

## 7. Security & Privacy

### Security Considerations

```typescript
/**
 * Security and privacy safeguards
 */
class SecurityService {
  /**
   * Sanitize user input to prevent XSS
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  /**
   * Validate file before parsing
   */
  validateFile(file: File): { valid: boolean; reason?: string } {
    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return { valid: false, reason: 'File too large (max 50MB)' };
    }
    
    // Check file type
    const allowedTypes = [
      'application/json',
      'application/geo+json',
      'text/csv',
      'application/vnd.ms-excel',
    ];
    
    const allowedExtensions = ['.json', '.geojson', '.csv'];
    const hasValidExtension = allowedExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    
    if (!allowedTypes.includes(file.type) && !hasValidExtension) {
      return { valid: false, reason: 'Invalid file type. Please upload JSON or CSV.' };
    }
    
    return { valid: true };
  }
  
  /**
   * Validate URL before opening
   */
  validateURL(url: string): boolean {
    try {
      const parsed = new URL(url);
      // Only allow Google Maps URLs
      return parsed.hostname.endsWith('google.com') || 
             parsed.hostname.endsWith('maps.google.com');
    } catch {
      return false;
    }
  }
  
  /**
   * Clear all user data (for privacy)
   */
  async clearAllData(): Promise<void> {
    await db.delete();
    await chrome.storage.local.clear();
    console.log('All user data cleared');
  }
}

export const securityService = new SecurityService();
```

### Privacy Guarantees

```markdown
## Privacy Architecture

### Data Storage
- ✅ **100% Local**: All data stored in browser's IndexedDB
- ✅ **No Server**: Zero network requests (except loading ML model once)
- ✅ **No Tracking**: No analytics, no telemetry, no cookies
- ✅ **User Control**: Easy data export and deletion

### ML Model
- ✅ **Local Inference**: Model runs entirely in browser
- ✅ **No API Calls**: No data sent to external AI services
- ✅ **Cached**: Model downloaded once, cached for offline use

### Permissions
- `storage`: For IndexedDB access (local only)
- `sidePanel`: For Chrome side panel UI
- `activeTab`: For detecting Google Maps context (read-only)

### Data Lifecycle
1. User uploads Takeout file → Parsed locally → Stored in IndexedDB
2. User searches → Embedding generated locally → Search executed locally
3. User clicks result → Opens Google Maps URL (no data sent to extension)
4. User can delete all data anytime via Settings
```

---

## 8. Chrome Extension Manifest

```json
{
  "manifest_version": 3,
  "name": "SavedPlaces NL Search",
  "version": "0.1.0",
  "description": "Natural language search for your Google Maps saved places",
  "permissions": [
    "storage",
    "sidePanel"
  ],
  "host_permissions": [
    "https://www.google.com/maps/*"
  ],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "action": {
    "default_title": "Open SavedPlaces Search",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "content_scripts": [
    {
      "matches": ["https://www.google.com/maps/*"],
      "js": ["content.js"]
    }
  ],
  "web_accessible_resources": [
    {
      "resources": ["models/*"],
      "matches": ["<all_urls>"]
    }
  ],
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
  }
}
```

---

## 9. Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1)
- [ ] Set up project structure (Vite + React + TypeScript)
- [ ] Implement IndexedDB schema with Dexie
- [ ] Build file upload UI
- [ ] Implement TakeoutJSONParser
- [ ] Write unit tests for parser

### Phase 2: ML Pipeline (Week 2)
- [ ] Integrate Transformers.js
- [ ] Implement EmbeddingService
- [ ] Set up Web Worker for non-blocking inference
- [ ] Implement VectorSearchService
- [ ] Test with sample dataset (100 places)

### Phase 3: UI & Search (Week 3)
- [ ] Build search interface (input + results list)
- [ ] Implement result ranking and display
- [ ] Add Google Maps URL generation
- [ ] Implement click-to-open functionality
- [ ] Add loading states and error handling

### Phase 4: Polish & Testing (Week 4)
- [ ] Add onboarding flow
- [ ] Implement settings page
- [ ] Performance optimization (lazy loading, pagination)
- [ ] End-to-end testing with real Takeout data
- [ ] Chrome Web Store preparation

---

## 10. Testing Strategy

```typescript
/**
 * Test plan for MVP
 */

// Unit Tests
describe('TakeoutJSONParser', () => {
  it('should parse valid GeoJSON file', async () => {
    const file = new File([validGeoJSON], 'saved.json', { type: 'application/json' });
    const result = await parser.parse(file);
    expect(result.places.length).toBeGreaterThan(0);
    expect(result.errors.length).toBe(0);
  });
  
  it('should handle malformed records gracefully', async () => {
    const file = new File([partiallyInvalidGeoJSON], 'saved.json', { type: 'application/json' });
    const result = await parser.parse(file);
    expect(result.places.length).toBeGreaterThan(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('VectorSearchService', () => {
  it('should return relevant results for query', async () => {
    const results = await vectorSearchService.search('cozy coffee shop');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].score).toBeGreaterThan(0.5);
  });
  
  it('should rank results by similarity', async () => {
    const results = await vectorSearchService.search('romantic restaurant');
    for (let i = 1; i < results.length; i++) {
      expect(results[i-1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });
});

// Integration Tests
describe('End-to-End Import Flow', () => {
  it('should import, embed, and search places', async () => {
    // 1. Import file
    const file = new File([sampleGeoJSON], 'test.json', { type: 'application/json' });
    const parseResult = await parserRegistry.detectParser(file).then(p => p.parse(file));
    
    // 2. Store places
    await db.places.bulkAdd(parseResult.places);
    
    // 3. Generate embeddings
    const texts = parseResult.places.map(p => embeddingService.prepareText(p));
    const embeddings = await embeddingService.embedBatch(texts);
    
    // 4. Store embeddings
    const embeddingRecords = parseResult.places.map((place, i) => ({
      placeId: place.id,
      embedding: embeddings[i],
      embeddingVersion: '1.0',
      textUsed: texts[i],
      createdAt: new Date(),
    }));
    await db.embeddings.bulkAdd(embeddingRecords);
    
    // 5. Search
    const results = await vectorSearchService.search('coffee');
    expect(results.length).toBeGreaterThan(0);
  });
});

// Performance Tests
describe('Performance', () => {
  it('should embed 100 places in <10 seconds', async () => {
    const places = generateTestPlaces(100);
    const texts = places.map(p => embeddingService.prepareText(p));
    
    const start = performance.now();
    await embeddingService.embedBatch(texts);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(10000);
  });
  
  it('should search 500 places in <2 seconds', async () => {
    // Assuming 500 places already embedded
    const start = performance.now();
    await vectorSearchService.search('test query');
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(2000);
  });
});
```

---

## 11. Deployment Checklist

- [ ] **Code Quality**
  - [ ] TypeScript strict mode enabled
  - [ ] ESLint + Prettier configured
  - [ ] All tests passing
  - [ ] No console errors in production build

- [ ] **Performance**
  - [ ] Bundle size <5MB (including model)
  - [ ] Initial load <3 seconds
  - [ ] Search latency <2 seconds for 500 places

- [ ] **Security**
  - [ ] Content Security Policy configured
  - [ ] Input sanitization implemented
  - [ ] URL validation for external links
  - [ ] No sensitive data in logs

- [ ] **Privacy**
  - [ ] Privacy policy written
  - [ ] Data deletion functionality
  - [ ] No external network requests (except model download)
  - [ ] Permissions justified in manifest

- [ ] **Chrome Web Store**
  - [ ] Screenshots prepared (1280x800)
  - [ ] Promotional images (440x280)
  - [ ] Store listing description
  - [ ] Privacy policy URL

---

## 12. Future Enhancements (Post-MVP)

### V1.1 Features
- **Hybrid Search**: Combine semantic + keyword for better recall
- **Filters**: By list name, category, date saved
- **Nearby Search**: Filter by distance from current location
- **Search History**: Recent queries with quick re-run

### V1.2 Features
- **CSV Export**: Export search results
- **Batch Operations**: Delete multiple places
- **Import Merge**: Update existing places instead of replace
- **Dark Mode**: Theme support

### V2.0 Features (Requires Significant Work)
- **Auto-Categorization**: ML-based category detection
- **Smart Collections**: Cluster places by similarity
- **Multi-Language**: Support non-English queries
- **Mobile Extension**: Firefox/Safari support

---

**End of Architecture Document**
