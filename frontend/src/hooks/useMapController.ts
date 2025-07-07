import { useState } from 'react';
import { SearchLocation } from '../services/searchService';
import { COORDINATES } from '../constants';

export const useMapController = () => {
  const [mapCenter, setMapCenter] = useState<[number, number]>(COORDINATES.DEFAULT_CENTER);
  const [shouldFlyTo, setShouldFlyTo] = useState(false);
  const [shouldSetInitialView, setShouldSetInitialView] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchLocation[]>([]);
  const [selectedSearchLocation, setSelectedSearchLocation] = useState<SearchLocation | null>(null);
  const [shouldFlyToSearch, setShouldFlyToSearch] = useState(false);

  // Handle search results
  const handleSearchResults = (results: SearchLocation[]) => {
    setSearchResults(results);
    setSelectedSearchLocation(null);
  };

  // Handle location selection from search
  const handleLocationSelect = (location: SearchLocation) => {
    setSelectedSearchLocation(location);
    setSearchResults([]); // Clear other search results
    setShouldFlyToSearch(true);
  };

  // Update map center and trigger fly animation
  const flyToLocation = (location: [number, number]) => {
    setMapCenter(location);
    setShouldFlyTo(true);
  };

  // Set initial view without animation
  const setInitialView = (location: [number, number]) => {
    setMapCenter(location);
    setShouldSetInitialView(true);
  };

  return {
    mapCenter,
    shouldFlyTo,
    setShouldFlyTo,
    shouldSetInitialView,
    setShouldSetInitialView,
    searchResults,
    selectedSearchLocation,
    shouldFlyToSearch,
    setShouldFlyToSearch,
    handleSearchResults,
    handleLocationSelect,
    flyToLocation,
    setInitialView
  };
};