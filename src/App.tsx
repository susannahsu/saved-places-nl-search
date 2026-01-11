import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import FileImportPanel from './components/FileImportPanel';
import SearchBox from './components/SearchBox';
import ResultsList from './components/ResultsList';
import DebugPanel from './components/DebugPanel';
import type { Place, SearchResult } from './types';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Live query for stats
  const stats = useLiveQuery(async () => {
    return await db.getStats();
  });

  // Live query for all places (for now, until we implement search)
  const allPlaces = useLiveQuery(async () => {
    return await db.places.toArray();
  });

  const hasData = (stats?.totalPlaces ?? 0) > 0;

  // Handle search (placeholder for now)
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);

    try {
      // TODO: Implement actual semantic search
      // For now, just do simple text matching
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      const places = await db.places
        .filter(place => 
          place.name.toLowerCase().includes(query.toLowerCase()) ||
          place.notes?.toLowerCase().includes(query.toLowerCase()) ||
          place.address?.toLowerCase().includes(query.toLowerCase())
        )
        .limit(20)
        .toArray();

      const results: SearchResult[] = places.map((place, index) => ({
        placeId: place.id,
        score: 0.8, // Placeholder score
        rank: index + 1,
      }));

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Get places for results
  const resultPlaces = useLiveQuery(async () => {
    if (searchResults.length === 0) return [];
    
    const placeIds = searchResults.map(r => r.placeId);
    const places = await db.places.bulkGet(placeIds);
    
    return places.filter((p): p is Place => p !== undefined);
  }, [searchResults]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - File Import */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">SavedPlaces</h1>
          <p className="text-sm text-gray-500">Natural Language Search</p>
        </div>
        <FileImportPanel />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top - Search Box */}
        <div className="bg-white border-b border-gray-200 p-4">
          <SearchBox
            onSearch={handleSearch}
            disabled={!hasData}
            isSearching={isSearching}
          />
        </div>

        {/* Main - Results List */}
        <div className="flex-1 overflow-auto">
          <ResultsList
            results={searchResults}
            places={resultPlaces || []}
            hasData={hasData}
            searchQuery={searchQuery}
            allPlaces={allPlaces || []}
          />
        </div>
      </div>

      {/* Right/Bottom - Debug Panel */}
      <div className="w-64 bg-white border-l border-gray-200">
        <DebugPanel
          totalPlaces={stats?.totalPlaces ?? 0}
          totalEmbeddings={stats?.totalEmbeddings ?? 0}
        />
      </div>
    </div>
  );
}

export default App;
