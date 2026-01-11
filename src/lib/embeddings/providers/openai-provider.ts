/**
 * OpenAI Embedding Provider
 * Uses OpenAI's text-embedding-3-small model
 */

import type { EmbeddingProvider, EmbeddingVector } from '../types';
import { batchArray } from '../utils';

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  batchSize?: number;
}

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  name = 'OpenAI';
  dimensions = 1536; // text-embedding-3-small default
  
  private apiKey: string;
  private model: string;
  private batchSize: number;
  private baseUrl = 'https://api.openai.com/v1/embeddings';
  
  constructor(config: OpenAIConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'text-embedding-3-small';
    this.batchSize = config.batchSize || 100;
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required');
    }
  }
  
  /**
   * Check if provider is ready
   */
  async isReady(): Promise<boolean> {
    try {
      // Test with a simple embedding
      await this.embed('test');
      return true;
    } catch (error) {
      console.error('OpenAI provider not ready:', error);
      return false;
    }
  }
  
  /**
   * Generate embedding for single text
   */
  async embed(text: string): Promise<EmbeddingVector> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model: this.model,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    const embedding = data.data[0].embedding;
    
    return {
      values: new Float32Array(embedding),
      dimensions: embedding.length,
    };
  }
  
  /**
   * Generate embeddings for multiple texts with progress tracking
   */
  async embedBatch(
    texts: string[],
    onProgress?: (current: number, total: number) => void
  ): Promise<EmbeddingVector[]> {
    const batches = batchArray(texts, this.batchSize);
    const allEmbeddings: EmbeddingVector[] = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      // Process batch
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          input: batch,
          model: this.model,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      
      // Convert to EmbeddingVector
      const batchEmbeddings = data.data.map((item: any) => ({
        values: new Float32Array(item.embedding),
        dimensions: item.embedding.length,
      }));
      
      allEmbeddings.push(...batchEmbeddings);
      
      // Report progress
      if (onProgress) {
        onProgress(allEmbeddings.length, texts.length);
      }
      
      // Rate limiting: wait between batches
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return allEmbeddings;
  }
}
