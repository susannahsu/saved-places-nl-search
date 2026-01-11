/**
 * Mock Embedding Provider for testing
 * Generates deterministic fake embeddings
 */

import type { EmbeddingProvider, EmbeddingVector } from '../types';

export class MockEmbeddingProvider implements EmbeddingProvider {
  name = 'Mock';
  dimensions = 384; // Mimic all-MiniLM-L6-v2
  
  private delay: number;
  
  constructor(delay: number = 0) {
    this.delay = delay;
  }
  
  /**
   * Check if provider is ready (always true for mock)
   */
  async isReady(): Promise<boolean> {
    return true;
  }
  
  /**
   * Generate fake embedding based on text hash
   */
  async embed(text: string): Promise<EmbeddingVector> {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }
    
    // Generate deterministic "embedding" from text
    const embedding = this.generateFakeEmbedding(text);
    
    return {
      values: embedding,
      dimensions: this.dimensions,
    };
  }
  
  /**
   * Generate batch embeddings with progress
   */
  async embedBatch(
    texts: string[],
    onProgress?: (current: number, total: number) => void
  ): Promise<EmbeddingVector[]> {
    const embeddings: EmbeddingVector[] = [];
    
    for (let i = 0; i < texts.length; i++) {
      const embedding = await this.embed(texts[i]);
      embeddings.push(embedding);
      
      if (onProgress) {
        onProgress(i + 1, texts.length);
      }
    }
    
    return embeddings;
  }
  
  /**
   * Generate fake but deterministic embedding
   * Uses simple hash function to create consistent vectors
   */
  private generateFakeEmbedding(text: string): Float32Array {
    const embedding = new Float32Array(this.dimensions);
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Use hash as seed for pseudo-random values
    let seed = Math.abs(hash);
    
    for (let i = 0; i < this.dimensions; i++) {
      // Linear congruential generator
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      embedding[i] = (seed / 0x7fffffff) * 2 - 1; // Normalize to [-1, 1]
    }
    
    // Normalize to unit vector
    let norm = 0;
    for (let i = 0; i < this.dimensions; i++) {
      norm += embedding[i] * embedding[i];
    }
    norm = Math.sqrt(norm);
    
    for (let i = 0; i < this.dimensions; i++) {
      embedding[i] /= norm;
    }
    
    return embedding;
  }
}
