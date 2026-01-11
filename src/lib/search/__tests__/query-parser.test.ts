/**
 * Tests for query parser
 */

import { describe, it, expect } from 'vitest';
import { parseQuery, matchesListFilter } from '../query-parser';

describe('parseQuery', () => {
  it('should parse simple query without filters', () => {
    const result = parseQuery('coffee shop');
    
    expect(result.rawQuery).toBe('coffee shop');
    expect(result.searchTerms).toBe('coffee shop');
    expect(result.listFilter).toBeUndefined();
    expect(result.hasListFilter).toBe(false);
  });

  it('should parse "in my X list" pattern', () => {
    const result = parseQuery('cute place in my tokyo list');
    
    expect(result.rawQuery).toBe('cute place in my tokyo list');
    expect(result.searchTerms).toBe('cute place');
    expect(result.listFilter).toBe('tokyo');
    expect(result.hasListFilter).toBe(true);
  });

  it('should parse "from X" pattern', () => {
    const result = parseQuery('restaurant from favorites');
    
    expect(result.searchTerms).toBe('restaurant');
    expect(result.listFilter).toBe('favorites');
    expect(result.hasListFilter).toBe(true);
  });

  it('should parse "in X list" pattern', () => {
    const result = parseQuery('hot spring in restaurants list');
    
    expect(result.searchTerms).toBe('hot spring');
    expect(result.listFilter).toBe('restaurants');
    expect(result.hasListFilter).toBe(true);
  });

  it('should handle case insensitivity', () => {
    const result = parseQuery('COFFEE IN MY TOKYO LIST');
    
    expect(result.listFilter).toBe('tokyo');
  });

  it('should handle filter-only query', () => {
    const result = parseQuery('in my tokyo list');
    
    expect(result.searchTerms).toBe('');
    expect(result.listFilter).toBe('tokyo');
  });
});

describe('matchesListFilter', () => {
  it('should match when no filter', () => {
    const place = { listName: 'Tokyo' };
    expect(matchesListFilter(place, undefined)).toBe(true);
  });

  it('should match exact list name', () => {
    const place = { listName: 'Tokyo' };
    expect(matchesListFilter(place, 'tokyo')).toBe(true);
  });

  it('should match partial list name', () => {
    const place = { listName: 'Tokyo Restaurants' };
    expect(matchesListFilter(place, 'tokyo')).toBe(true);
  });

  it('should not match different list', () => {
    const place = { listName: 'Paris' };
    expect(matchesListFilter(place, 'tokyo')).toBe(false);
  });

  it('should not match when place has no list', () => {
    const place = {};
    expect(matchesListFilter(place, 'tokyo')).toBe(false);
  });

  it('should be case insensitive', () => {
    const place = { listName: 'TOKYO' };
    expect(matchesListFilter(place, 'tokyo')).toBe(true);
  });
});
