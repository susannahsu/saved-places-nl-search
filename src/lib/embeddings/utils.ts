/**
 * Embedding utility functions
 */

import type { PlaceRecord } from '../parsers/types';

/**
 * Build embedding text from place record
 * Concatenates: name + notes + list name
 */
export function buildEmbeddingText(place: PlaceRecord): string {
  const parts: string[] = [];
  
  // Add name (required)
  parts.push(place.name);
  
  // Add notes if present
  if (place.notes) {
    parts.push(place.notes);
  }
  
  // Add list name if present
  if (place.listName) {
    parts.push(place.listName);
  }
  
  // Add address if present (helps with location-based queries)
  if (place.address) {
    parts.push(place.address);
  }
  
  return parts.join(' | ');
}

/**
 * Compute cosine similarity between two vectors
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
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
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Normalize a vector to unit length
 */
export function normalizeVector(vector: Float32Array): Float32Array {
  let norm = 0;
  for (let i = 0; i < vector.length; i++) {
    norm += vector[i] * vector[i];
  }
  
  norm = Math.sqrt(norm);
  
  if (norm === 0) {
    return vector;
  }
  
  const normalized = new Float32Array(vector.length);
  for (let i = 0; i < vector.length; i++) {
    normalized[i] = vector[i] / norm;
  }
  
  return normalized;
}

/**
 * Batch array into chunks
 */
export function batchArray<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}
