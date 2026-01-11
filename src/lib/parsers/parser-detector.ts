/**
 * Parser Detector - Automatically detects and applies the correct parser
 */

import type { FileParser, ParseResult } from './types';
import { JSONParser } from './json-parser';
import { CSVParser } from './csv-parser';

export class ParserDetector {
  private parsers: FileParser[];

  constructor() {
    this.parsers = [
      new JSONParser(),
      new CSVParser(),
    ];
  }

  /**
   * Detect the appropriate parser for the given content
   */
  detectParser(content: string, filename?: string): FileParser | null {
    // Try each parser's canParse method
    for (const parser of this.parsers) {
      if (parser.canParse(content)) {
        return parser;
      }
    }

    return null;
  }

  /**
   * Auto-detect and parse the content
   */
  async parse(content: string, filename: string = 'unknown'): Promise<ParseResult> {
    const parser = this.detectParser(content, filename);

    if (!parser) {
      return {
        success: false,
        places: [],
        errors: [
          {
            message: this.buildUnsupportedFormatMessage(content, filename),
            severity: 'error',
          },
        ],
        stats: {
          totalRecords: 0,
          successfulRecords: 0,
          failedRecords: 1,
          parseTimeMs: 0,
        },
      };
    }

    return parser.parse(content, filename);
  }

  /**
   * Build a helpful error message for unsupported formats
   */
  private buildUnsupportedFormatMessage(content: string, filename: string): string {
    const preview = content.substring(0, 200).trim();
    
    let message = `Unsupported file format: ${filename}\n\n`;
    message += 'Expected formats:\n';
    message += '1. JSON/GeoJSON: {"type":"FeatureCollection","features":[...]}\n';
    message += '2. CSV: Title,Note,URL,Address,...\n\n';
    message += `File preview:\n${preview}${content.length > 200 ? '...' : ''}`;

    return message;
  }

  /**
   * Get list of supported parser names
   */
  getSupportedParsers(): string[] {
    return this.parsers.map(p => p.name);
  }
}

// Export singleton instance
export const parserDetector = new ParserDetector();
