/**
 * Tests for JSONParser
 */

import { describe, it, expect } from 'vitest';
import { JSONParser } from '../json-parser';
import * as fixtures from './fixtures';

describe('JSONParser', () => {
  const parser = new JSONParser();

  describe('canParse', () => {
    it('should detect valid GeoJSON FeatureCollection', () => {
      expect(parser.canParse(fixtures.validGeoJSON)).toBe(true);
    });

    it('should detect GeoJSON with Location structure', () => {
      expect(parser.canParse(fixtures.geoJSONWithLocation)).toBe(true);
    });

    it('should reject non-GeoJSON JSON', () => {
      expect(parser.canParse(fixtures.jsonNotGeoJSON)).toBe(false);
    });

    it('should reject CSV content', () => {
      expect(parser.canParse(fixtures.validCSV)).toBe(false);
    });

    it('should reject invalid JSON', () => {
      expect(parser.canParse(fixtures.invalidFormat)).toBe(false);
    });

    it('should reject empty content', () => {
      expect(parser.canParse(fixtures.emptyFile)).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse valid GeoJSON with all fields', async () => {
      const result = await parser.parse(fixtures.validGeoJSON, 'test.json');

      expect(result.success).toBe(true);
      expect(result.places).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
      expect(result.stats.successfulRecords).toBe(3);
      expect(result.stats.failedRecords).toBe(0);

      // Check first place
      const place1 = result.places[0];
      expect(place1.name).toBe('Blue Bottle Coffee');
      expect(place1.address).toBe('66 Mint St, San Francisco, CA 94103');
      expect(place1.notes).toBe('Best pour-over in the city!');
      expect(place1.googleMapsUrl).toBe('https://maps.google.com/?cid=123456789');
      expect(place1.latitude).toBe(37.7749);
      expect(place1.longitude).toBe(-122.4194);
      expect(place1.metadata.source).toBe('json');
      expect(place1.id).toBeTruthy();

      // Check place with minimal data
      const place3 = result.places[2];
      expect(place3.name).toBe('Dolores Park');
      expect(place3.notes).toBeUndefined();
      expect(place3.address).toBeUndefined();
      expect(place3.latitude).toBe(37.78);
      expect(place3.longitude).toBe(-122.4);
    });

    it('should parse GeoJSON with Location structure', async () => {
      const result = await parser.parse(fixtures.geoJSONWithLocation, 'test.json');

      expect(result.success).toBe(true);
      expect(result.places).toHaveLength(1);

      const place = result.places[0];
      expect(place.name).toBe('Onsen Hot Spring');
      expect(place.address).toBe('123 Spa Lane, Kyoto');
      expect(place.notes).toBe('Cute hot spring with outdoor baths');
      expect(place.latitude).toBe(35.0116);
      expect(place.longitude).toBe(135.7681);
      expect(place.googleMapsUrl).toContain('place_id:ChIJ123');
    });

    it('should handle malformed features gracefully', async () => {
      const result = await parser.parse(fixtures.malformedGeoJSON, 'test.json');

      expect(result.success).toBe(false);
      expect(result.places).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].severity).toBe('warning');
      expect(result.errors[0].message).toContain('Missing name');
    });

    it('should return error for invalid JSON', async () => {
      const result = await parser.parse(fixtures.invalidFormat, 'test.json');

      expect(result.success).toBe(false);
      expect(result.places).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].severity).toBe('error');
    });

    it('should include parse time in stats', async () => {
      const result = await parser.parse(fixtures.validGeoJSON, 'test.json');

      expect(result.stats.parseTimeMs).toBeGreaterThan(0);
      expect(result.stats.parseTimeMs).toBeLessThan(1000); // Should be fast
    });

    it('should generate unique IDs for each place', async () => {
      const result = await parser.parse(fixtures.validGeoJSON, 'test.json');

      const ids = result.places.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
