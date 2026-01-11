import type { Place, SearchResult } from '../types';

interface ResultsListProps {
  results: SearchResult[];
  places: Place[];
  hasData: boolean;
  searchQuery: string;
  allPlaces: Place[];
}

export default function ResultsList({ 
  results, 
  places, 
  hasData, 
  searchQuery,
  allPlaces 
}: ResultsListProps) {
  const handleOpenInMaps = (place: Place) => {
    let url = place.url;
    
    if (!url) {
      // Fallback: construct URL from coordinates or address
      if (place.coordinates) {
        const { lat, lng } = place.coordinates;
        url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      } else if (place.address) {
        const query = `${place.name}, ${place.address}`;
        url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
      } else {
        url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
      }
    }
    
    window.open(url, '_blank');
  };

  // Show empty state if no data
  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md px-4">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No places imported yet</h3>
          <p className="text-sm text-gray-500">
            Upload your Google Takeout file to get started with natural language search
          </p>
        </div>
      </div>
    );
  }

  // Show all places if no search query
  if (!searchQuery) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">All Saved Places</h2>
          <p className="text-sm text-gray-500">{allPlaces.length} places imported</p>
        </div>
        <div className="space-y-3">
          {allPlaces.map((place) => (
            <PlaceCard key={place.id} place={place} onOpen={handleOpenInMaps} />
          ))}
        </div>
      </div>
    );
  }

  // Show search results
  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md px-4">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-sm text-gray-500">
            Try a different search query or check your spelling
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Search Results</h2>
        <p className="text-sm text-gray-500">
          Found {results.length} {results.length === 1 ? 'place' : 'places'} matching "{searchQuery}"
        </p>
      </div>
      <div className="space-y-3">
        {places.map((place, index) => {
          const result = results.find(r => r.placeId === place.id);
          return (
            <PlaceCard 
              key={place.id} 
              place={place} 
              onOpen={handleOpenInMaps}
              score={result?.score}
              rank={result?.rank}
            />
          );
        })}
      </div>
    </div>
  );
}

interface PlaceCardProps {
  place: Place;
  onOpen: (place: Place) => void;
  score?: number;
  rank?: number;
}

function PlaceCard({ place, onOpen, score, rank }: PlaceCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {rank && (
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 text-xs font-bold rounded-full flex items-center justify-center">
                {rank}
              </span>
            )}
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {place.name}
            </h3>
          </div>
          
          {place.address && (
            <p className="text-sm text-gray-600 mb-2">{place.address}</p>
          )}
          
          {place.notes && (
            <p className="text-sm text-gray-700 mb-2 italic">"{place.notes}"</p>
          )}
          
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {place.listName && (
              <span className="px-2 py-1 bg-gray-100 rounded">
                {place.listName}
              </span>
            )}
            {place.category && place.category !== 'other' && (
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                {place.category}
              </span>
            )}
            {score !== undefined && (
              <span className="px-2 py-1 bg-green-50 text-green-700 rounded">
                {Math.round(score * 100)}% match
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={() => onOpen(place)}
          className="ml-4 flex-shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          Open in Maps
        </button>
      </div>
    </div>
  );
}
