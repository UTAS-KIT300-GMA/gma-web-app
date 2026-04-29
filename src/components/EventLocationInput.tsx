import React, { useState, useEffect } from 'react';
import { GeocodingService, type EventLocation } from '../services/geoService';

interface EventLocationInputProps {
  onLocationSelect: (location: EventLocation) => void;
  initialAddress?: string;
  disabled?: boolean;
}

/**
 * @summary An autocomplete input component that allows users to search for and select an event location.
 * @param props - The component props.
 * @param props.onLocationSelect - Executes when a user clicks a location from the dropdown.
 * @param props.initialAddress - The starting address string (defaults to an empty string).
 * @param props.disabled - Controls whether the input is interactive (defaults to false).
 */
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

  /**
   * @summary Updates the search query state and fetches location results from the GeocodingService.
   * @param text - The current string entered into the input field by the user.
   */
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

  /**
   * @summary Handles the user selecting a specific location from the dropdown results.
   * @param location - The location object selected from the dropdown list.
   */
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
      
      {isSearching && <small style={{ position: 'absolute', right: "10px", top: '15px', color: '#666' }}>Searching...</small>}
      
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