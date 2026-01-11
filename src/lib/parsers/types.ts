/**
 * Parser types and interfaces
 */

export interface PlaceRecord {
  id: string;
  name: string;
  listName?: string;
  notes?: string;
  googleMapsUrl?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  metadata: {
    source: 'json' | 'csv';
    originalData?: Record<string, unknown>;
  };
}

export interface ParseResult {
  success: boolean;
  places: PlaceRecord[];
  errors: ParseError[];
  stats: {
    totalRecords: number;
    successfulRecords: number;
    failedRecords: number;
    parseTimeMs: number;
  };
}

export interface ParseError {
  line?: number;
  field?: string;
  message: string;
  severity: 'warning' | 'error';
  originalData?: unknown;
}

export interface FileParser {
  name: string;
  canParse(content: string): boolean;
  parse(content: string, filename: string): Promise<ParseResult>;
}
