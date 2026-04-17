import React, { useState, useEffect } from 'react';
import { GeocodingService, type EventLocation } from '../services/geoService';

interface EventLocationInputProps {
  onLocationSelect: (location: EventLocation) => void;
  initialAddress?: string;
  disabled?: boolean;
}

export const EventLocationInput: React.FC<EventLocationInputProps> = ({ 
  onLocationSelect, 
  initialAddress = '',
  disabled = false
}) => {
  const [searchQuery, setSearchQuery] = useState<string>(initialAddress);
  const [results, setResults] = useState<EventLocation[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    if (initialAddress) {
      setSearchQuery(initialAddress);
    }
  }, [initialAddress]);

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    
    if (text.length <= 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const locations = await GeocodingService.searchEventLocation(text);
    setResults(locations);
    setIsSearching(false);
  };

  const handleSelect = (location: EventLocation) => {
    setSearchQuery(location.displayAddress);
    setResults([]);
    onLocationSelect(location);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input 
        type="text" 
        value={searchQuery}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
        placeholder="Enter event address" 
        disabled={disabled}
        required
        style={{ width: '100%' }}
      />
      
      {isSearching && <small style={{ position: 'absolute', right: '10px', top: '10px', color: '#666' }}>Searching...</small>}
      
      {results.length > 0 && (
        <ul style={{ 
          position: 'absolute', 
          zIndex: 10, 
          background: 'white', 
          border: '1px solid #ccc',
          listStyle: 'none',
          padding: 0,
          margin: 0,
          width: '100%',
          maxHeight: '200px',
          overflowY: 'auto',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          {results.map((loc, index) => (
            <li 
              key={index} 
              onClick={() => handleSelect(loc)}
              style={{ cursor: 'pointer', padding: '8px 12px', borderBottom: '1px solid #eee' }}
            >
              {loc.displayAddress}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};