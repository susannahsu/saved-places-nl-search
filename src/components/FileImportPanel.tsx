import { useState, useCallback } from 'react';
import { db } from '../db';
import type { Place, PlaceCategory } from '../types';

export default function FileImportPanel() {
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    await handleFiles(files);
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    await handleFiles(files);
  }, []);

  const handleFiles = async (files: File[]) => {
    const file = files[0];
    
    // Validate file
    if (!file.name.endsWith('.json') && !file.name.endsWith('.geojson')) {
      setImportStatus({
        type: 'error',
        message: 'Please upload a JSON or GeoJSON file from Google Takeout',
      });
      return;
    }

    setIsImporting(true);
    setImportStatus({ type: 'info', message: 'Parsing file...' });

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Check if it's a GeoJSON FeatureCollection
      if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
        throw new Error('Invalid format. Expected GeoJSON FeatureCollection.');
      }

      setImportStatus({ type: 'info', message: 'Importing places...' });

      // Parse features into Place objects
      const places: Place[] = data.features
        .map((feature: any, index: number) => {
          try {
            const props = feature.properties || {};
            const coords = feature.geometry?.coordinates;

            return {
              id: crypto.randomUUID(),
              name: props.name || props.Location?.['Business Name'] || `Place ${index + 1}`,
              address: props.address || props.Location?.Address,
              coordinates: coords ? { lng: coords[0], lat: coords[1] } : undefined,
              notes: props.Comment,
              listName: undefined,
              category: 'other' as PlaceCategory,
              url: props['Google Maps URL'],
              placeId: undefined,
              metadata: {
                source: 'takeout_json' as const,
                sourceFile: file.name,
                importVersion: '0.1.0',
                rawData: props,
              },
              createdAt: props.Published ? new Date(props.Published) : new Date(),
              importedAt: new Date(),
            };
          } catch (error) {
            console.error('Error parsing feature:', error);
            return null;
          }
        })
        .filter((p): p is Place => p !== null);

      if (places.length === 0) {
        throw new Error('No valid places found in file');
      }

      // Store in database
      await db.places.bulkAdd(places);
      await db.updateConfig({
        totalPlaces: places.length,
        lastImportDate: new Date(),
      });

      setImportStatus({
        type: 'success',
        message: `Successfully imported ${places.length} places!`,
      });
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to import file',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to clear all data?')) return;

    try {
      await db.clearAll();
      setImportStatus({
        type: 'success',
        message: 'All data cleared',
      });
    } catch (error) {
      console.error('Clear error:', error);
      setImportStatus({
        type: 'error',
        message: 'Failed to clear data',
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          flex-1 border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center
          transition-colors cursor-pointer
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }
          ${isImporting ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <svg
          className="w-12 h-12 text-gray-400 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        
        <p className="text-sm font-medium text-gray-700 mb-1">
          {isImporting ? 'Importing...' : 'Drop file here'}
        </p>
        <p className="text-xs text-gray-500 mb-3">or</p>
        
        <label className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 cursor-pointer">
          Browse Files
          <input
            type="file"
            accept=".json,.geojson"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isImporting}
          />
        </label>
        
        <p className="text-xs text-gray-500 mt-3 text-center">
          Upload Google Takeout<br />Saved Places JSON
        </p>
      </div>

      {/* Status Message */}
      {importStatus && (
        <div
          className={`
            p-3 rounded-md text-sm
            ${importStatus.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : ''}
            ${importStatus.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : ''}
            ${importStatus.type === 'info' ? 'bg-blue-50 text-blue-800 border border-blue-200' : ''}
          `}
        >
          {importStatus.message}
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-600 space-y-2 pt-4 border-t border-gray-200">
        <p className="font-medium">How to get your data:</p>
        <ol className="list-decimal list-inside space-y-1 text-gray-500">
          <li>Go to Google Takeout</li>
          <li>Select "Maps (your places)"</li>
          <li>Download the export</li>
          <li>Upload the JSON file here</li>
        </ol>
      </div>

      {/* Clear Data Button */}
      <button
        onClick={handleClearData}
        className="w-full px-4 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50"
      >
        Clear All Data
      </button>
    </div>
  );
}
