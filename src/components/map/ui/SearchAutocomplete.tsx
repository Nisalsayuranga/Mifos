import { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { SearchService } from '../services/SearchService';
import type { GeocodingResult } from '../services/GeocodingService';
import { Search, MapPin, Loader2 } from 'lucide-react';
import './SearchAutocomplete.css';

interface SearchAutocompleteProps {
  onSelect: (result: GeocodingResult) => void;
  placeholder?: string;
}

export default function SearchAutocomplete({ onSelect, placeholder = 'Search location in Sri Lanka...' }: SearchAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (debouncedQuery.trim().length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const fetchResults = async () => {
      setIsSearching(true);
      const data = await SearchService.searchLocation(debouncedQuery);
      setResults(data);
      setIsOpen(true);
      setIsSearching(false);
    };

    fetchResults();
  }, [debouncedQuery]);

  return (
    <div className="search-container">
      <div className="search-input-wrapper">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        />
        {isSearching && <Loader2 className="search-loader" size={18} />}
      </div>
      
      {isOpen && results.length > 0 && (
        <ul className="search-results">
          {results.map((result, idx) => (
            <li 
              key={idx} 
              className="search-result-item"
              onClick={() => {
                onSelect(result);
                setIsOpen(false);
                setQuery(result.displayName.split(',')[0]); // Just set the first part
              }}
            >
              <MapPin size={16} className="result-icon" />
              <div className="result-text">
                <span className="result-name">{result.displayName.split(',')[0]}</span>
                <span className="result-address">{result.displayName.split(',').slice(1).join(',')}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
