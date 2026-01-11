import { useState, useCallback } from 'react';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  disabled?: boolean;
  isSearching?: boolean;
}

export default function SearchBox({ onSearch, disabled, isSearching }: SearchBoxProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  }, [query, onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
  }, [onSearch]);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
          placeholder={
            disabled 
              ? 'Import places to start searching...' 
              : 'Search your saved places... (e.g., "cute hot spring", "romantic dinner")'
          }
          className={`
            w-full px-4 py-3 pr-24 text-base border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${disabled 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-gray-900'
            }
          `}
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          <button
            type="submit"
            disabled={disabled || !query.trim() || isSearching}
            className={`
              px-4 py-1.5 text-sm font-medium rounded-md
              ${disabled || !query.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
      
      {!disabled && (
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="text-xs text-gray-500">Try:</span>
          {['cute hot spring', 'romantic dinner', 'cozy coffee shop', 'outdoor brunch'].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setQuery(example);
                onSearch(example);
              }}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
