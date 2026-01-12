/**
 * Semantic Search Engine
 * Manages embeddings and performs similarity search
 */

import { db } from '../../db';
import type { PlaceRecord } from '../parsers/types';
import type {
  EmbeddingProvider,
  PlaceEmbedding,
  SearchResult,
  SearchOptions,
  IndexStats,
  BuildIndexProgress,
} from './types';
import { buildEmbeddingText, cosineSimilarity } from './utils';

export class SearchEngine {
  private provider: EmbeddingProvider;
  
  constructor(provider: EmbeddingProvider) {
    this.provider = provider;
  }
  
  /**
   * Build search index from places
   */
  async buildIndex(
    places: PlaceRecord[],
    onProgress?: (progress: BuildIndexProgress) => void
  ): Promise<void> {
    const total = places.length;
    
    // Phase 1: Preparing
    onProgress?.({
      current: 0,
      total,
      phase: 'preparing',
      message: 'Preparing texts...',
    });
    
    // Build embedding texts
    const texts = places.map(place => buildEmbeddingText(place));
    
    // Phase 2: Embedding
    onProgress?.({
      current: 0,
      total,
      phase: 'embedding',
      message: 'Generating embeddings...',
    });
    
    // Generate embeddings with progress
    const embeddings = await this.provider.embedBatch(texts, (current, total) => {
      onProgress?.({
        current,
        total,
        phase: 'embedding',
        message: `Embedding ${current}/${total}...`,
      });
    });
    
    // Phase 3: Storing
    onProgress?.({
      current: 0,
      total,
      phase: 'storing',
      message: 'Storing embeddings...',
    });
    
    // Store embeddings in database
    const placeEmbeddings: PlaceEmbedding[] = places.map((place, i) => ({
      placeId: place.id,
      embedding: embeddings[i].values,
      embeddingText: texts[i],
      provider: this.provider.name,
      dimensions: this.provider.dimensions,
      createdAt: new Date(),
    }));
    
    // Clear existing embeddings
    await db.embeddings.clear();
    
    // Store new embeddings
    await db.embeddings.bulkAdd(placeEmbeddings);
    
    // Update config
    await db.updateConfig({
      totalEmbeddings: placeEmbeddings.length,
      modelLoaded: true,
      modelVersion: this.provider.name,
    });
    
    // Phase 4: Complete
    onProgress?.({
      current: total,
      total,
      phase: 'complete',
      message: 'Index built successfully!',
    });
  }
  
  /**
   * Search for similar places
   */
  async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const { topK = 20, minScore = 0.3 } = options;
    
    // Generate query embedding
    const queryEmbedding = await this.provider.embed(query);
    
    // Load all embeddings from database
    const allEmbeddings = await db.embeddings.toArray();
    
    if (allEmbeddings.length === 0) {
      return [];
    }
    
    // Compute similarities
    const results: SearchResult[] = allEmbeddings.map((emb: PlaceEmbedding) => ({
      placeId: emb.placeId,
      score: cosineSimilarity(queryEmbedding.values, emb.embedding),
      rank: 0, // Will be set after sorting
    }));
    
    // Filter by minimum score and sort by score descending
    const filtered = results
      .filter(r => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
    
    // Set ranks
    filtered.forEach((result, index) => {
      result.rank = index + 1;
    });
    
    return filtered;
  }
  
  /**
   * Get index statistics
   */
  async getStats(): Promise<IndexStats> {
    const embeddings = await db.embeddings.count();
    const places = await db.places.count();
    
    const firstEmbedding = await db.embeddings.limit(1).first();
    
    return {
      totalPlaces: places,
      totalEmbeddings: embeddings,
      provider: firstEmbedding?.provider || 'none',
      dimensions: firstEmbedding?.dimensions || 0,
      lastUpdated: firstEmbedding?.createdAt,
    };
  }
  
  /**
   * Check if index is ready
   */
  async isIndexReady(): Promise<boolean> {
    const count = await db.embeddings.count();
    return count > 0;
  }
  
  /**
   * Clear index
   */
  async clearIndex(): Promise<void> {
    await db.embeddings.clear();
    await db.updateConfig({
      totalEmbeddings: 0,
      modelLoaded: false,
    });
  }
}
