import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import FileImportPanel from './components/FileImportPanel';
import SearchBox from './components/SearchBox';
import ResultsList from './components/ResultsList';
import DebugPanel from './components/DebugPanel';
import type { Place } from './types';
import type { SearchResult } from './lib/embeddings/types';
import { SearchEngine } from './lib/embeddings/search-engine';
import { OpenAIEmbeddingProvider } from './lib/embeddings/providers/openai-provider';
import { MockEmbeddingProvider } from './lib/embeddings/providers/mock-provider';

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
  const hasEmbeddings = (stats?.totalEmbeddings ?? 0) > 0;

  // Handle search with semantic search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);

    try {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      // Check if we have embeddings
      if (!hasEmbeddings) {
        // Fallback to keyword search
        const places = await db.places
          .filter(place => {
            const nameMatch = place.name.toLowerCase().includes(query.toLowerCase());
            const notesMatch = place.notes?.toLowerCase().includes(query.toLowerCase()) ?? false;
            const addressMatch = place.address?.toLowerCase().includes(query.toLowerCase()) ?? false;
            return nameMatch || notesMatch || addressMatch;
          })
          .limit(20)
          .toArray();

        const results: SearchResult[] = places.map((place, index) => ({
          placeId: place.id,
          score: 0.8,
          rank: index + 1,
        }));

        setSearchResults(results);
        return;
      }

      // Use semantic search
      const apiKey = localStorage.getItem('openai_api_key');
      const provider = apiKey 
        ? new OpenAIEmbeddingProvider({ apiKey })
        : new MockEmbeddingProvider();

      const searchEngine = new SearchEngine(provider);
      // Use lower threshold for mock embeddings since they're random
      const minScore = apiKey ? 0.3 : 0.0;
      const results = await searchEngine.search(query, { topK: 20, minScore });

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
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
            isSearching={isSearching}
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
