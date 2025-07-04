import React, { useState, useCallback, useRef, useEffect } from 'react';
import { searchService, SearchLocation } from '../services/searchService';

interface SearchBoxProps {
  onLocationSelect: (location: SearchLocation) => void;
  onSearchResults: (results: SearchLocation[]) => void;
  placeholder?: string;
}

const SearchBox: React.FC<SearchBoxProps> = ({ 
  onLocationSelect, 
  onSearchResults,
  placeholder = "Search for a place..."
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      onSearchResults([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const searchResults = await searchService.searchLocations(searchQuery);
      setResults(searchResults);
      onSearchResults(searchResults);
      setIsOpen(true);
    } catch (err) {
      setError('Search failed. Please try again.');
      setResults([]);
      onSearchResults([]);
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [onSearchResults]);

  // Debounced search function
  const debouncedSearch = useCallback((query: string) => {
    searchService.debounce(performSearch, 300)(query);
    }, [performSearch]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsLoading(true);
    debouncedSearch(newQuery);
  };

  // Handle location selection
  const handleLocationSelect = (location: SearchLocation) => {
    setQuery(location.name);
    setIsOpen(false);
    setResults([]);
    onLocationSelect(location);
    // Don't immediately clear search results - let Map component handle it
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onSearchResults([]);
  };

  return (
    <div ref={searchBoxRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '12px 16px',
            paddingRight: query ? '80px' : '16px',
            fontSize: '16px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            outline: 'none',
            boxSizing: 'border-box',
            backgroundColor: 'white'
          }}
          onFocus={() => results && results.length > 0 && setIsOpen(true)}
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            right: query ? '40px' : '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '14px',
            color: '#666'
          }}>
            ...
          </div>
        )}
        
        {/* Clear button */}
        {query && (
          <button
            onClick={clearSearch}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#666',
              padding: '4px'
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '14px',
          color: '#c33',
          zIndex: 1001,
          marginTop: '4px'
        }}>
          {error}
        </div>
      )}

      {/* Search results dropdown */}
      {isOpen && results && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          maxHeight: '300px',
          overflowY: 'auto',
          marginTop: '4px'
        }}>
          {results.map((result) => (
            <div
              key={result.id}
              onClick={() => handleLocationSelect(result)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid #eee',
                fontSize: '14px',
                lineHeight: '1.4'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <div style={{ fontWeight: '500', marginBottom: '2px' }}>
                {result.name.split(',')[0]} {/* Show primary name */}
              </div>
              <div style={{ color: '#666', fontSize: '12px' }}>
                {result.name.split(',').slice(1).join(',').trim()} {/* Show address */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBox;