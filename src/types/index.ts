// ============================================================================
// Core Domain Types
// ============================================================================

export interface Place {
  id: string;
  name: string;
  address?: string;
  coordinates?: Coordinates;
  notes?: string;
  listName?: string;
  category?: PlaceCategory;
  url?: string;
  placeId?: string;
  metadata: PlaceMetadata;
  createdAt: Date;
  importedAt: Date;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export enum PlaceCategory {
  RESTAURANT = 'restaurant',
  CAFE = 'cafe',
  BAR = 'bar',
  HOTEL = 'hotel',
  ATTRACTION = 'attraction',
  SHOP = 'shop',
  OTHER = 'other',
}

export interface PlaceMetadata {
  source: 'takeout_json' | 'takeout_csv' | 'manual';
  sourceFile: string;
  importVersion: string;
  rawData?: Record<string, unknown>;
}

// ============================================================================
// Application State
// ============================================================================

export interface AppConfig {
  id: 'singleton';
  lastImportDate?: Date;
  totalPlaces: number;
  totalEmbeddings: number;
  modelLoaded: boolean;
  modelVersion: string;
  settings: UserSettings;
}

export interface UserSettings {
  maxResults: number;
  minSimilarityScore: number;
  openInNewTab: boolean;
  enableSearchHistory: boolean;
  theme: 'light' | 'dark' | 'auto';
}

// ============================================================================
// File Parsing
// ============================================================================

export interface ParseResult {
  places: Place[];
  errors: ParseError[];
  metadata: ParseMetadata;
}

export interface ParseError {
  line?: number;
  record?: unknown;
  error: string;
  severity: 'warning' | 'error';
}

export interface ParseMetadata {
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  fileName: string;
  fileSize: number;
  parseTime: number;
}

// ============================================================================
// Google Takeout Formats
// ============================================================================

export interface TakeoutSavedPlaces {
  type: 'FeatureCollection';
  features: TakeoutFeature[];
}

export interface TakeoutFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    name: string;
    address?: string;
    'Location'?: {
      'Business Name'?: string;
      'Address'?: string;
      'Geo Coordinates'?: {
        'Latitude'?: number;
        'Longitude'?: number;
      };
    };
    'Google Maps URL'?: string;
    'Published'?: string;
    'Updated'?: string;
    'Starred'?: boolean;
    'Comment'?: string;
  };
}
