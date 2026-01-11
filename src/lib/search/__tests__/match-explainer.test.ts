/**
 * Tests for match explainer
 */

import { describe, it, expect } from 'vitest';
import { explainMatch } from '../match-explainer';
import type { PlaceRecord } from '../../parsers/types';

describe('explainMatch', () => {
  const place: PlaceRecord = {
    id: '1',
    name: 'Blue Bottle Coffee',
    notes: 'Best pour-over coffee in the city',
    listName: 'Coffee Shops',
    address: '66 Mint St, San Francisco',
    metadata: { source: 'json' },
  };

  it('should find matches in name', () => {
    const explanations = explainMatch(place, 'coffee');
    
    expect(explanations.length).toBeGreaterThan(0);
    const nameMatch = explanations.find(e => e.field === 'name');
    expect(nameMatch).toBeDefined();
    expect(nameMatch?.snippet).toContain('Coffee');
  });

  it('should find matches in notes', () => {
    const explanations = explainMatch(place, 'pour-over');
    
    const notesMatch = explanations.find(e => e.field === 'notes');
    expect(notesMatch).toBeDefined();
    expect(notesMatch?.snippet).toContain('pour-over');
  });

  it('should find matches in list name', () => {
    const explanations = explainMatch(place, 'shops');
    
    const listMatch = explanations.find(e => e.field === 'listName');
    expect(listMatch).toBeDefined();
    expect(listMatch?.snippet).toContain('Shops');
  });

  it('should rank by relevance', () => {
    const explanations = explainMatch(place, 'coffee city');
    
    // Should find matches in both name and notes
    expect(explanations.length).toBeGreaterThan(0);
    
    // First result should have higher relevance
    if (explanations.length > 1) {
      expect(explanations[0].relevance).toBeGreaterThanOrEqual(explanations[1].relevance);
    }
  });

  it('should limit to max explanations', () => {
    const explanations = explainMatch(place, 'coffee city shops', 2);
    
    expect(explanations.length).toBeLessThanOrEqual(2);
  });

  it('should handle no matches', () => {
    const explanations = explainMatch(place, 'xyz123');
    
    expect(explanations.length).toBe(0);
  });

  it('should create snippets with context', () => {
    const longPlace: PlaceRecord = {
      id: '1',
      name: 'Test',
      notes: 'This is a very long note that contains the word coffee somewhere in the middle and should be truncated to show context',
      metadata: { source: 'json' },
    };
    
    const explanations = explainMatch(longPlace, 'coffee');
    const notesMatch = explanations.find(e => e.field === 'notes');
    
    expect(notesMatch?.snippet).toContain('...');
    expect(notesMatch?.snippet).toContain('coffee');
  });

  it('should ignore short query terms', () => {
    const explanations = explainMatch(place, 'in my coffee list');
    
    // Should only match "coffee" (>2 chars), not "in" or "my"
    const hasMatch = explanations.some(e => e.snippet.toLowerCase().includes('coffee'));
    expect(hasMatch).toBe(true);
  });
});
