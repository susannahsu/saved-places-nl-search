/**
 * Tests for CSVParser
 */

import { describe, it, expect } from 'vitest';
import { CSVParser } from '../csv-parser';
import * as fixtures from './fixtures';

describe('CSVParser', () => {
  const parser = new CSVParser();

  describe('canParse', () => {
    it('should detect valid CSV with Title header', () => {
      expect(parser.canParse(fixtures.validCSV)).toBe(true);
    });

    it('should detect CSV with Name header', () => {
      expect(parser.canParse(fixtures.csvWithSeparateCoords)).toBe(true);
    });

    it('should reject GeoJSON content', () => {
      expect(parser.canParse(fixtures.validGeoJSON)).toBe(false);
    });

    it('should reject plain text', () => {
      expect(parser.canParse(fixtures.invalidFormat)).toBe(false);
    });

    it('should reject empty content', () => {
      expect(parser.canParse(fixtures.emptyFile)).toBe(false);
    });

    it('should reject single line (header only)', () => {
      expect(parser.canParse('Title,Note,URL')).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse valid CSV with all fields', async () => {
      const result = await parser.parse(fixtures.validCSV, 'test.csv');

      expect(result.success).toBe(true);
      expect(result.places).toHaveLength(3);
      expect(result.errors).toHaveLength(0);

      // Check first place
      const place1 = result.places[0];
      expect(place1.name).toBe('Blue Bottle Coffee');
      expect(place1.notes).toBe('Best pour-over in the city!');
      expect(place1.googleMapsUrl).toBe('https://maps.google.com/?cid=123');
      expect(place1.address).toBe('66 Mint St, San Francisco, CA');
      expect(place1.latitude).toBe(37.7749);
      expect(place1.longitude).toBe(-122.4194);
      expect(place1.metadata.source).toBe('csv');

      // Check place with minimal data
      const place3 = result.places[2];
      expect(place3.name).toBe('Dolores Park');
      expect(place3.notes).toBeUndefined();
      expect(place3.googleMapsUrl).toBeUndefined();
      expect(place3.address).toBe('Mission District, SF');
      expect(place3.latitude).toBeUndefined();
      expect(place3.longitude).toBeUndefined();
    });

    it('should handle quoted fields with commas', async () => {
      const result = await parser.parse(fixtures.csvWithQuotes, 'test.csv');

      expect(result.success).toBe(true);
      expect(result.places).toHaveLength(2);

      const place1 = result.places[0];
      expect(place1.name).toBe('Coffee Shop, The Best');
      // CSV uses "" to escape quotes inside quoted fields
      expect(place1.notes).toBe('Great coffee with "special" beans');
    });

    it('should parse CSV with separate lat/lng columns', async () => {
      const result = await parser.parse(fixtures.csvWithSeparateCoords, 'test.csv');

      expect(result.success).toBe(true);
      expect(result.places).toHaveLength(2);

      const place1 = result.places[0];
      expect(place1.name).toBe('Onsen Hot Spring');
      expect(place1.listName).toBe('Travel');
      expect(place1.notes).toBe('Cute hot spring');
      expect(place1.latitude).toBe(35.0116);
      expect(place1.longitude).toBe(135.7681);

      const place2 = result.places[1];
      expect(place2.name).toBe('Mountain View');
      expect(place2.listName).toBe('Hiking');
      expect(place2.latitude).toBe(37.3861);
      expect(place2.longitude).toBe(-122.0839);
    });

    it('should handle missing required fields gracefully', async () => {
      const result = await parser.parse(fixtures.csvMissingTitle, 'test.csv');

      expect(result.success).toBe(false);
      expect(result.places).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Missing name/title');
    });

    it('should return error for invalid CSV structure', async () => {
      const result = await parser.parse('invalid', 'test.csv');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should include parse time and stats', async () => {
      const result = await parser.parse(fixtures.validCSV, 'test.csv');

      expect(result.stats.totalRecords).toBe(3);
      expect(result.stats.successfulRecords).toBe(3);
      expect(result.stats.failedRecords).toBe(0);
      expect(result.stats.parseTimeMs).toBeGreaterThan(0);
    });

    it('should handle empty fields', async () => {
      const csv = `Title,Note,URL
Place 1,,
Place 2,Note 2,`;

      const result = await parser.parse(csv, 'test.csv');

      expect(result.success).toBe(true);
      expect(result.places).toHaveLength(2);
      expect(result.places[0].notes).toBeUndefined();
      expect(result.places[0].googleMapsUrl).toBeUndefined();
      expect(result.places[1].notes).toBe('Note 2');
    });
  });
});
