/**
 * Explain why a place matched the search query
 */

import type { PlaceRecord } from '../parsers/types';

export interface MatchExplanation {
  field: 'name' | 'notes' | 'listName' | 'address';
  label: string;
  snippet: string;
  relevance: number;
}

/**
 * Generate explanation for why a place matched
 * Returns top 1-2 most relevant fields
 */
export function explainMatch(
  place: PlaceRecord,
  query: string,
  maxExplanations: number = 2
): MatchExplanation[] {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const explanations: MatchExplanation[] = [];
  
  // Check each field
  const fields: Array<{
    field: MatchExplanation['field'];
    label: string;
    value?: string;
  }> = [
    { field: 'name', label: 'Name', value: place.name },
    { field: 'notes', label: 'Notes', value: place.notes },
    { field: 'listName', label: 'List', value: place.listName },
    { field: 'address', label: 'Address', value: place.address },
  ];
  
  for (const { field, label, value } of fields) {
    if (!value) continue;
    
    const lowerValue = value.toLowerCase();
    let relevance = 0;
    let matchedTerms: string[] = [];
    
    // Count matching terms
    for (const term of queryTerms) {
      if (lowerValue.includes(term)) {
        relevance++;
        matchedTerms.push(term);
      }
    }
    
    if (relevance > 0) {
      // Create snippet with highlighted terms
      const snippet = createSnippet(value, matchedTerms);
      
      explanations.push({
        field,
        label,
        snippet,
        relevance,
      });
    }
  }
  
  // Sort by relevance and return top N
  return explanations
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxExplanations);
}

/**
 * Create a snippet with context around matched terms
 */
function createSnippet(text: string, matchedTerms: string[]): string {
  const maxLength = 80;
  
  // Find first match position
  const lowerText = text.toLowerCase();
  let firstMatchPos = -1;
  
  for (const term of matchedTerms) {
    const pos = lowerText.indexOf(term.toLowerCase());
    if (pos !== -1 && (firstMatchPos === -1 || pos < firstMatchPos)) {
      firstMatchPos = pos;
    }
  }
  
  if (firstMatchPos === -1) {
    // No match found, return truncated text
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
  
  // Extract snippet around match
  const start = Math.max(0, firstMatchPos - 20);
  const end = Math.min(text.length, firstMatchPos + maxLength - 20);
  
  let snippet = text.substring(start, end);
  
  // Add ellipsis
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  
  return snippet;
}
