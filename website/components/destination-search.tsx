import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Location } from '@/types/trip';

interface DestinationSearchProps {
  onDestinationSelect: (location: Location) => void;
}

export function DestinationSearch({ onDestinationSelect }: DestinationSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const searchDestination = async () => {
      if (searchQuery.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        // Using OpenStreetMap Nominatim API for geocoding
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
        );
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error('Error searching destination:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchDestination, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelect = (suggestion: any) => {
    onDestinationSelect({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    });
    setSearchQuery(suggestion.display_name);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="Search for destination..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full"
      />
      {isLoading && (
        <div className="absolute right-3 top-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      )}
      {suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none"
              onClick={() => handleSelect(suggestion)}
            >
              <div className="text-sm">{suggestion.display_name}</div>
              <div className="text-xs text-gray-500">
                {suggestion.lat}, {suggestion.lon}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 