/**
 * Embedding types and interfaces
 */

export interface EmbeddingVector {
  values: Float32Array;
  dimensions: number;
}

export interface EmbeddingProvider {
  name: string;
  dimensions: number;
  
  /**
   * Generate embedding for a single text
   */
  embed(text: string): Promise<EmbeddingVector>;
  
  /**
   * Generate embeddings for multiple texts (batch processing)
   */
  embedBatch(texts: string[], onProgress?: (current: number, total: number) => void): Promise<EmbeddingVector[]>;
  
  /**
   * Check if provider is ready to use
   */
  isReady(): Promise<boolean>;
}

export interface PlaceEmbedding {
  placeId: string;
  embedding: Float32Array;
  embeddingText: string;
  provider: string;
  dimensions: number;
  createdAt: Date;
}

export interface SearchResult {
  placeId: string;
  score: number;
  rank: number;
}

export interface SearchOptions {
  topK?: number;
  minScore?: number;
}

export interface IndexStats {
  totalPlaces: number;
  totalEmbeddings: number;
  provider: string;
  dimensions: number;
  lastUpdated?: Date;
}

export interface BuildIndexProgress {
  current: number;
  total: number;
  phase: 'preparing' | 'embedding' | 'storing' | 'complete';
  message: string;
}
