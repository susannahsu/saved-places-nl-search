/**
 * Tests for embedding utilities
 */

import { describe, it, expect } from 'vitest';
import { buildEmbeddingText, cosineSimilarity, normalizeVector, batchArray } from '../utils';
import type { PlaceRecord } from '../../parsers/types';

describe('buildEmbeddingText', () => {
  it('should concatenate name, notes, and list name', () => {
    const place: PlaceRecord = {
      id: '1',
      name: 'Blue Bottle Coffee',
      notes: 'Best pour-over',
      listName: 'Coffee Shops',
      metadata: { source: 'json' },
    };

    const text = buildEmbeddingText(place);
    expect(text).toBe('Blue Bottle Coffee | Best pour-over | Coffee Shops');
  });

  it('should handle missing optional fields', () => {
    const place: PlaceRecord = {
      id: '1',
      name: 'Dolores Park',
      metadata: { source: 'json' },
    };

    const text = buildEmbeddingText(place);
    expect(text).toBe('Dolores Park');
  });

  it('should include address if present', () => {
    const place: PlaceRecord = {
      id: '1',
      name: 'Tartine Bakery',
      address: '600 Guerrero St, SF',
      metadata: { source: 'json' },
    };

    const text = buildEmbeddingText(place);
    expect(text).toBe('Tartine Bakery | 600 Guerrero St, SF');
  });
});

describe('cosineSimilarity', () => {
  it('should compute similarity for identical vectors', () => {
    const a = new Float32Array([1, 0, 0]);
    const b = new Float32Array([1, 0, 0]);
    
    const similarity = cosineSimilarity(a, b);
    expect(similarity).toBeCloseTo(1.0, 5);
  });

  it('should compute similarity for orthogonal vectors', () => {
    const a = new Float32Array([1, 0, 0]);
    const b = new Float32Array([0, 1, 0]);
    
    const similarity = cosineSimilarity(a, b);
    expect(similarity).toBeCloseTo(0.0, 5);
  });

  it('should compute similarity for opposite vectors', () => {
    const a = new Float32Array([1, 0, 0]);
    const b = new Float32Array([-1, 0, 0]);
    
    const similarity = cosineSimilarity(a, b);
    expect(similarity).toBeCloseTo(-1.0, 5);
  });

  it('should handle zero vectors', () => {
    const a = new Float32Array([0, 0, 0]);
    const b = new Float32Array([1, 0, 0]);
    
    const similarity = cosineSimilarity(a, b);
    expect(similarity).toBe(0);
  });

  it('should throw error for mismatched dimensions', () => {
    const a = new Float32Array([1, 0]);
    const b = new Float32Array([1, 0, 0]);
    
    expect(() => cosineSimilarity(a, b)).toThrow('dimension mismatch');
  });
});

describe('normalizeVector', () => {
  it('should normalize vector to unit length', () => {
    const vector = new Float32Array([3, 4, 0]);
    const normalized = normalizeVector(vector);
    
    expect(normalized[0]).toBeCloseTo(0.6, 5);
    expect(normalized[1]).toBeCloseTo(0.8, 5);
    expect(normalized[2]).toBeCloseTo(0.0, 5);
    
    // Check unit length
    let norm = 0;
    for (let i = 0; i < normalized.length; i++) {
      norm += normalized[i] * normalized[i];
    }
    expect(Math.sqrt(norm)).toBeCloseTo(1.0, 5);
  });

  it('should handle zero vector', () => {
    const vector = new Float32Array([0, 0, 0]);
    const normalized = normalizeVector(vector);
    
    expect(normalized[0]).toBe(0);
    expect(normalized[1]).toBe(0);
    expect(normalized[2]).toBe(0);
  });
});

describe('batchArray', () => {
  it('should split array into batches', () => {
    const array = [1, 2, 3, 4, 5, 6, 7];
    const batches = batchArray(array, 3);
    
    expect(batches).toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7],
    ]);
  });

  it('should handle exact multiples', () => {
    const array = [1, 2, 3, 4, 5, 6];
    const batches = batchArray(array, 2);
    
    expect(batches).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
  });

  it('should handle empty array', () => {
    const array: number[] = [];
    const batches = batchArray(array, 3);
    
    expect(batches).toEqual([]);
  });
});
