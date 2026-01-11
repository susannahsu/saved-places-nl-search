import Dexie, { Table } from 'dexie';
import type { Place, PlaceEmbedding, AppConfig } from '../types';

// ============================================================================
// Database Schema
// ============================================================================

export class SavedPlacesDB extends Dexie {
  places!: Table<Place, string>;
  embeddings!: Table<PlaceEmbedding, string>;
  config!: Table<AppConfig, string>;

  constructor() {
    super('savedplaces-db');
    
    this.version(1).stores({
      places: 'id, name, listName, category, importedAt',
      embeddings: 'placeId',
      config: 'id',
    });
  }

  // Helper method to get or create config
  async getConfig(): Promise<AppConfig> {
    let config = await this.config.get('singleton');
    
    if (!config) {
      config = {
        id: 'singleton',
        totalPlaces: 0,
        totalEmbeddings: 0,
        modelLoaded: false,
        modelVersion: '1.0',
        settings: {
          maxResults: 20,
          minSimilarityScore: 0.3,
          openInNewTab: true,
          enableSearchHistory: false,
          theme: 'auto',
        },
      };
      await this.config.add(config);
    }
    
    return config;
  }

  // Helper method to update config
  async updateConfig(updates: Partial<AppConfig>): Promise<void> {
    await this.config.update('singleton', updates);
  }

  // Helper method to get stats
  async getStats() {
    const placesCount = await this.places.count();
    const embeddingsCount = await this.embeddings.count();
    
    return {
      totalPlaces: placesCount,
      totalEmbeddings: embeddingsCount,
    };
  }

  // Clear all data
  async clearAll(): Promise<void> {
    await this.places.clear();
    await this.embeddings.clear();
    await this.updateConfig({
      totalPlaces: 0,
      totalEmbeddings: 0,
      lastImportDate: undefined,
    });
  }
}

// Singleton instance
export const db = new SavedPlacesDB();
