/**
 * Tests for MockEmbeddingProvider
 */

import { describe, it, expect } from 'vitest';
import { MockEmbeddingProvider } from '../providers/mock-provider';

describe('MockEmbeddingProvider', () => {
  const provider = new MockEmbeddingProvider();

  it('should have correct properties', () => {
    expect(provider.name).toBe('Mock');
    expect(provider.dimensions).toBe(384);
  });

  it('should be ready', async () => {
    const ready = await provider.isReady();
    expect(ready).toBe(true);
  });

  it('should generate embedding with correct dimensions', async () => {
    const result = await provider.embed('test text');
    
    expect(result.values).toBeInstanceOf(Float32Array);
    expect(result.values.length).toBe(384);
    expect(result.dimensions).toBe(384);
  });

  it('should generate deterministic embeddings', async () => {
    const text = 'coffee shop';
    const result1 = await provider.embed(text);
    const result2 = await provider.embed(text);
    
    // Should be identical
    expect(result1.values).toEqual(result2.values);
  });

  it('should generate different embeddings for different texts', async () => {
    const result1 = await provider.embed('coffee');
    const result2 = await provider.embed('restaurant');
    
    // Should be different
    expect(result1.values).not.toEqual(result2.values);
  });

  it('should generate normalized embeddings', async () => {
    const result = await provider.embed('test');
    
    // Check unit length
    let norm = 0;
    for (let i = 0; i < result.values.length; i++) {
      norm += result.values[i] * result.values[i];
    }
    
    expect(Math.sqrt(norm)).toBeCloseTo(1.0, 5);
  });

  it('should batch embed with progress', async () => {
    const texts = ['text1', 'text2', 'text3'];
    const progressUpdates: Array<{ current: number; total: number }> = [];
    
    const results = await provider.embedBatch(texts, (current, total) => {
      progressUpdates.push({ current, total });
    });
    
    expect(results).toHaveLength(3);
    expect(progressUpdates).toHaveLength(3);
    expect(progressUpdates[0]).toEqual({ current: 1, total: 3 });
    expect(progressUpdates[2]).toEqual({ current: 3, total: 3 });
  });

  it('should respect delay parameter', async () => {
    const providerWithDelay = new MockEmbeddingProvider(50);
    
    const start = Date.now();
    await providerWithDelay.embed('test');
    const duration = Date.now() - start;
    
    expect(duration).toBeGreaterThanOrEqual(45); // Allow some variance
  });
});
