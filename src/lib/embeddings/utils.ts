/**
 * Embedding utility functions
 */

import type { PlaceRecord } from '../parsers/types';

/**
 * Build embedding text from place record
 * Prioritizes notes/descriptions for better semantic search
 * Order: notes (most important) → name → list → address
 */
export function buildEmbeddingText(place: PlaceRecord): string {
  const parts: string[] = [];
  
  // Priority 1: Notes/descriptions (most important for semantic search)
  // This is where users describe what the place is like
  if (place.notes) {
    parts.push(place.notes);
  }
  
  // Priority 2: Name (helps identify the place)
  parts.push(place.name);
  
  // Priority 3: List name (provides context)
  if (place.listName) {
    parts.push(`List: ${place.listName}`);
  }
  
  // Priority 4: Address (helps with location-based queries)
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
