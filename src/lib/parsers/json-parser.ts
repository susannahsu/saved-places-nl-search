/**
 * JSON Parser for Google Takeout "Saved Places.json" (GeoJSON format)
 */

import type { FileParser, ParseResult, ParseError, PlaceRecord } from './types';

interface GeoJSONFeature {
  type: string;
  geometry?: {
    type: string;
    coordinates?: [number, number]; // [lng, lat]
  };
  properties?: Record<string, unknown>;
}

interface GeoJSONDocument {
  type: string;
  features?: GeoJSONFeature[];
}

export class JSONParser implements FileParser {
  name = 'JSONParser';

  /**
   * Detect if content is a valid GeoJSON FeatureCollection
   */
  canParse(content: string): boolean {
    try {
      const trimmed = content.trim();
      if (!trimmed.startsWith('{')) return false;

      const data = JSON.parse(trimmed);
      
      // Check for GeoJSON FeatureCollection structure
      return (
        data.type === 'FeatureCollection' &&
        Array.isArray(data.features)
      );
    } catch {
      return false;
    }
  }

  /**
   * Parse GeoJSON content into PlaceRecord[]
   */
  async parse(content: string, filename: string): Promise<ParseResult> {
    const startTime = performance.now();
    const places: PlaceRecord[] = [];
    const errors: ParseError[] = [];

    try {
      const data: GeoJSONDocument = JSON.parse(content);

      if (!data.features || !Array.isArray(data.features)) {
        throw new Error('Invalid GeoJSON: missing or invalid features array');
      }

      for (let i = 0; i < data.features.length; i++) {
        try {
          const place = this.parseFeature(data.features[i], i);
          if (place) {
            places.push(place);
          }
        } catch (error) {
          errors.push({
            line: i + 1,
            message: error instanceof Error ? error.message : String(error),
            severity: 'warning',
            originalData: data.features[i],
          });
        }
      }

      return {
        success: places.length > 0,
        places,
        errors,
        stats: {
          totalRecords: data.features.length,
          successfulRecords: places.length,
          failedRecords: errors.length,
          parseTimeMs: performance.now() - startTime,
        },
      };
    } catch (error) {
      // Fatal parsing error
      errors.push({
        message: error instanceof Error ? error.message : String(error),
        severity: 'error',
      });

      return {
        success: false,
        places: [],
        errors,
        stats: {
          totalRecords: 0,
          successfulRecords: 0,
          failedRecords: 1,
          parseTimeMs: performance.now() - startTime,
        },
      };
    }
  }

  /**
   * Parse a single GeoJSON feature into a PlaceRecord
   */
  private parseFeature(feature: GeoJSONFeature, index: number): PlaceRecord | null {
    const props = feature.properties || {};

    // Extract name (required)
    const name = this.extractName(props);
    if (!name) {
      throw new Error(`Missing name at feature ${index}`);
    }

    // Extract coordinates
    const coords = this.extractCoordinates(feature);

    // Extract Google Maps URL
    const googleMapsUrl = this.extractUrl(props);

    // Extract notes/comment
    const notes = this.extractNotes(props);

    // Extract address
    const address = this.extractAddress(props);

    // Extract list name (if present)
    const listName = this.extractListName(props);

    return {
      id: crypto.randomUUID(),
      name,
      listName,
      notes,
      googleMapsUrl,
      latitude: coords?.lat,
      longitude: coords?.lng,
      address,
      metadata: {
        source: 'json',
        originalData: props,
      },
    };
  }

  /**
   * Extract name from various possible fields
   */
  private extractName(props: Record<string, unknown>): string | null {
    // Try common field names
    const nameFields = [
      'name',
      'Name',
      'title',
      'Title',
      'Business Name',
      'Location.Business Name',
    ];

    for (const field of nameFields) {
      const value = this.getNestedValue(props, field);
      if (value && typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return null;
  }

  /**
   * Extract coordinates from geometry or properties
   */
  private extractCoordinates(feature: GeoJSONFeature): { lat: number; lng: number } | null {
    // Try geometry.coordinates (GeoJSON standard)
    if (
      feature.geometry?.type === 'Point' &&
      Array.isArray(feature.geometry.coordinates) &&
      feature.geometry.coordinates.length >= 2
    ) {
      const [lng, lat] = feature.geometry.coordinates;
      if (typeof lng === 'number' && typeof lat === 'number') {
        return { lat, lng };
      }
    }

    // Try properties
    const props = feature.properties || {};
    
    // Try Location.Geo Coordinates
    const geoCoords = this.getNestedValue(props, 'Location.Geo Coordinates');
    if (geoCoords && typeof geoCoords === 'object') {
      const lat = (geoCoords as Record<string, unknown>).Latitude;
      const lng = (geoCoords as Record<string, unknown>).Longitude;
      if (typeof lat === 'number' && typeof lng === 'number') {
        return { lat, lng };
      }
    }

    return null;
  }

  /**
   * Extract Google Maps URL
   */
  private extractUrl(props: Record<string, unknown>): string | undefined {
    const urlFields = [
      'Google Maps URL',
      'url',
      'URL',
      'link',
      'Link',
    ];

    for (const field of urlFields) {
      // Try direct property access first (handles spaces in keys)
      if (field in props) {
        const value = props[field];
        if (value && typeof value === 'string' && this.isGoogleMapsUrl(value)) {
          return value.trim();
        }
      }
      
      // Try nested value for dot notation
      const value = this.getNestedValue(props, field);
      if (value && typeof value === 'string' && this.isGoogleMapsUrl(value)) {
        return value.trim();
      }
    }

    return undefined;
  }

  /**
   * Check if URL is a Google Maps URL
   */
  private isGoogleMapsUrl(url: string): boolean {
    return url.includes('google.com/maps') || url.includes('maps.google.com');
  }

  /**
   * Extract notes/comment
   */
  private extractNotes(props: Record<string, unknown>): string | undefined {
    const noteFields = [
      'Comment',
      'comment',
      'Note',
      'note',
      'Notes',
      'notes',
      'Description',
      'description',
    ];

    for (const field of noteFields) {
      const value = this.getNestedValue(props, field);
      if (value && typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return undefined;
  }

  /**
   * Extract address
   */
  private extractAddress(props: Record<string, unknown>): string | undefined {
    const addressFields = [
      'address',
      'Address',
      'Location.Address',
      'formatted_address',
    ];

    for (const field of addressFields) {
      const value = this.getNestedValue(props, field);
      if (value && typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return undefined;
  }

  /**
   * Extract list name (if present in export)
   */
  private extractListName(props: Record<string, unknown>): string | undefined {
    const listFields = [
      'list',
      'List',
      'listName',
      'List Name',
      'category',
      'Category',
    ];

    for (const field of listFields) {
      const value = this.getNestedValue(props, field);
      if (value && typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return undefined;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }
}
