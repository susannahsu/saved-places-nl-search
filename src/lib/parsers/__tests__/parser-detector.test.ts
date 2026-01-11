/**
 * Tests for ParserDetector
 */

import { describe, it, expect } from 'vitest';
import { ParserDetector } from '../parser-detector';
import { JSONParser } from '../json-parser';
import { CSVParser } from '../csv-parser';
import * as fixtures from './fixtures';

describe('ParserDetector', () => {
  const detector = new ParserDetector();

  describe('detectParser', () => {
    it('should detect JSONParser for GeoJSON', () => {
      const parser = detector.detectParser(fixtures.validGeoJSON);
      expect(parser).toBeInstanceOf(JSONParser);
    });

    it('should detect CSVParser for CSV', () => {
      const parser = detector.detectParser(fixtures.validCSV);
      expect(parser).toBeInstanceOf(CSVParser);
    });

    it('should return null for unsupported format', () => {
      const parser = detector.detectParser(fixtures.invalidFormat);
      expect(parser).toBeNull();
    });

    it('should return null for empty content', () => {
      const parser = detector.detectParser(fixtures.emptyFile);
      expect(parser).toBeNull();
    });

    it('should detect JSONParser for GeoJSON with Location structure', () => {
      const parser = detector.detectParser(fixtures.geoJSONWithLocation);
      expect(parser).toBeInstanceOf(JSONParser);
    });

    it('should detect CSVParser for CSV with quotes', () => {
      const parser = detector.detectParser(fixtures.csvWithQuotes);
      expect(parser).toBeInstanceOf(CSVParser);
    });
  });

  describe('parse', () => {
    it('should auto-detect and parse GeoJSON', async () => {
      const result = await detector.parse(fixtures.validGeoJSON, 'test.json');

      expect(result.success).toBe(true);
      expect(result.places).toHaveLength(3);
      expect(result.places[0].name).toBe('Blue Bottle Coffee');
      expect(result.places[0].metadata.source).toBe('json');
    });

    it('should auto-detect and parse CSV', async () => {
      const result = await detector.parse(fixtures.validCSV, 'test.csv');

      expect(result.success).toBe(true);
      expect(result.places).toHaveLength(3);
      expect(result.places[0].name).toBe('Blue Bottle Coffee');
      expect(result.places[0].metadata.source).toBe('csv');
    });

    it('should return helpful error for unsupported format', async () => {
      const result = await detector.parse(fixtures.invalidFormat, 'test.txt');

      expect(result.success).toBe(false);
      expect(result.places).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].severity).toBe('error');
      expect(result.errors[0].message).toContain('Unsupported file format');
      expect(result.errors[0].message).toContain('Expected formats');
      expect(result.errors[0].message).toContain('File preview');
    });

    it('should handle empty file with clear error', async () => {
      const result = await detector.parse(fixtures.emptyFile, 'empty.txt');

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain('Unsupported file format');
    });

    it('should include filename in error message', async () => {
      const result = await detector.parse(fixtures.invalidFormat, 'my-file.xyz');

      expect(result.errors[0].message).toContain('my-file.xyz');
    });
  });

  describe('getSupportedParsers', () => {
    it('should return list of supported parsers', () => {
      const parsers = detector.getSupportedParsers();

      expect(parsers).toContain('JSONParser');
      expect(parsers).toContain('CSVParser');
      expect(parsers.length).toBe(2);
    });
  });

  describe('integration tests', () => {
    it('should handle mixed content correctly', async () => {
      // Test that JSON is not mistaken for CSV
      const jsonResult = await detector.parse(fixtures.jsonNotGeoJSON, 'test.json');
      expect(jsonResult.success).toBe(false);

      // Test that CSV is not mistaken for JSON
      const csvResult = await detector.parse(fixtures.validCSV, 'test.csv');
      expect(csvResult.success).toBe(true);
      expect(csvResult.places[0].metadata.source).toBe('csv');
    });

    it('should preserve all data through full parse pipeline', async () => {
      const result = await detector.parse(fixtures.geoJSONWithLocation, 'onsen.json');

      expect(result.success).toBe(true);
      const place = result.places[0];
      
      // All fields should be preserved
      expect(place.name).toBeTruthy();
      expect(place.address).toBeTruthy();
      expect(place.notes).toBeTruthy();
      expect(place.latitude).toBeTruthy();
      expect(place.longitude).toBeTruthy();
      expect(place.googleMapsUrl).toBeTruthy();
      expect(place.id).toBeTruthy();
      expect(place.metadata.source).toBe('json');
      expect(place.metadata.originalData).toBeTruthy();
    });
  });
});
