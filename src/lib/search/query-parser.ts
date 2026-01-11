/**
 * Lightweight query parser for search UX improvements
 */

export interface ParsedQuery {
  rawQuery: string;
  searchTerms: string;
  listFilter?: string;
  hasListFilter: boolean;
}

/**
 * Parse search query to extract filters and terms
 */
export function parseQuery(query: string): ParsedQuery {
  const trimmed = query.trim();
  
  // Detect list filters
  const listPatterns = [
    /(?:in|from)\s+(?:my\s+)?(.+?)\s+list/i,
    /(?:in|from)\s+(.+?)(?:\s|$)/i,
  ];
  
  let listFilter: string | undefined;
  let searchTerms = query;
  
  for (const pattern of listPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      listFilter = match[1].trim().toLowerCase();
      
      // Remove the filter from search terms (use case-insensitive replace)
      searchTerms = trimmed.replace(match[0], '').trim();
      break;
    }
  }
  
  return {
    rawQuery: query,
    searchTerms,
    listFilter,
    hasListFilter: !!listFilter,
  };
}

/**
 * Check if a place matches the list filter
 */
export function matchesListFilter(
  place: { listName?: string },
  listFilter?: string
): boolean {
  if (!listFilter) return true;
  if (!place.listName) return false;
  
  const placeName = place.listName.toLowerCase();
  const filter = listFilter.toLowerCase();
  
  return placeName.includes(filter) || filter.includes(placeName);
}
