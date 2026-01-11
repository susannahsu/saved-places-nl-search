/**
 * CSV Parser for Google Maps saved places exports
 */

import type { FileParser, ParseResult, ParseError, PlaceRecord } from './types';

export class CSVParser implements FileParser {
  name = 'CSVParser';

  /**
   * Detect if content is CSV format
   */
  canParse(content: string): boolean {
    try {
      const trimmed = content.trim();
      if (!trimmed) return false;

      // Check for CSV characteristics
      const lines = trimmed.split('\n');
      if (lines.length < 2) return false; // Need at least header + 1 row

      const firstLine = lines[0].toLowerCase();
      
      // Check for common Google Maps CSV headers
      const hasRelevantHeaders = 
        firstLine.includes('title') ||
        firstLine.includes('name') ||
        firstLine.includes('location') ||
        firstLine.includes('url') ||
        firstLine.includes('note');

      // Check for CSV structure (commas or tabs)
      const hasSeparators = firstLine.includes(',') || firstLine.includes('\t');

      return hasRelevantHeaders && hasSeparators;
    } catch {
      return false;
    }
  }

  /**
   * Parse CSV content into PlaceRecord[]
   */
  async parse(content: string, filename: string): Promise<ParseResult> {
    const startTime = performance.now();
    const places: PlaceRecord[] = [];
    const errors: ParseError[] = [];

    try {
      const rows = this.parseCSV(content);
      
      if (rows.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }

      const headers = rows[0].map(h => h.trim());
      const headerMap = this.buildHeaderMap(headers);

      // Parse data rows
      for (let i = 1; i < rows.length; i++) {
        try {
          const place = this.parseRow(rows[i], headerMap, i);
          if (place) {
            places.push(place);
          }
        } catch (error) {
          errors.push({
            line: i + 1,
            message: error instanceof Error ? error.message : String(error),
            severity: 'warning',
            originalData: rows[i],
          });
        }
      }

      return {
        success: places.length > 0,
        places,
        errors,
        stats: {
          totalRecords: rows.length - 1, // Exclude header
          successfulRecords: places.length,
          failedRecords: errors.length,
          parseTimeMs: performance.now() - startTime,
        },
      };
    } catch (error) {
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
   * Parse CSV text into 2D array
   * Handles quoted fields with commas
   */
  private parseCSV(text: string): string[][] {
    const rows: string[][] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      const row: string[] = [];
      let currentField = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Escaped quote
            currentField += '"';
            i++; // Skip next quote
          } else {
            // Toggle quote state
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          // Field separator
          row.push(currentField);
          currentField = '';
        } else {
          currentField += char;
        }
      }

      // Add last field
      row.push(currentField);
      rows.push(row);
    }

    return rows;
  }

  /**
   * Build a map of header names to column indices
   */
  private buildHeaderMap(headers: string[]): Map<string, number> {
    const map = new Map<string, number>();

    headers.forEach((header, index) => {
      const normalized = header.toLowerCase().trim();
      map.set(normalized, index);
    });

    return map;
  }

  /**
   * Parse a single CSV row into a PlaceRecord
   */
  private parseRow(
    row: string[],
    headerMap: Map<string, number>,
    lineNumber: number
  ): PlaceRecord | null {
    // Extract name (required)
    const name = this.getField(row, headerMap, ['title', 'name', 'location name']);
    if (!name) {
      throw new Error(`Missing name/title at line ${lineNumber}`);
    }

    // Extract optional fields
    const listName = this.getField(row, headerMap, ['list', 'list name', 'category']);
    const notes = this.getField(row, headerMap, ['note', 'notes', 'comment', 'description']);
    const googleMapsUrl = this.getField(row, headerMap, ['url', 'link', 'google maps url']);
    const address = this.getField(row, headerMap, ['address', 'location address', 'formatted_address']);

    // Extract coordinates
    const coords = this.extractCoordinates(row, headerMap);

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
        source: 'csv',
        originalData: Object.fromEntries(
          Array.from(headerMap.entries()).map(([key, idx]) => [key, row[idx]])
        ),
      },
    };
  }

  /**
   * Get field value by trying multiple possible header names
   */
  private getField(
    row: string[],
    headerMap: Map<string, number>,
    possibleNames: string[]
  ): string | undefined {
    for (const name of possibleNames) {
      const index = headerMap.get(name.toLowerCase());
      if (index !== undefined && row[index]) {
        const value = row[index].trim();
        if (value) return value;
      }
    }
    return undefined;
  }

  /**
   * Extract coordinates from CSV row
   */
  private extractCoordinates(
    row: string[],
    headerMap: Map<string, number>
  ): { lat: number; lng: number } | null {
    // Try combined coordinates field (e.g., "37.7749,-122.4194")
    const coordsField = this.getField(row, headerMap, [
      'coordinates',
      'location geo coordinates',
      'geo coordinates',
      'lat,lng',
      'latlng',
    ]);

    if (coordsField) {
      const match = coordsField.match(/([-\d.]+)\s*,\s*([-\d.]+)/);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
    }

    // Try separate lat/lng fields
    const latField = this.getField(row, headerMap, ['latitude', 'lat']);
    const lngField = this.getField(row, headerMap, ['longitude', 'lng', 'lon']);

    if (latField && lngField) {
      const lat = parseFloat(latField);
      const lng = parseFloat(lngField);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }

    return null;
  }
}
