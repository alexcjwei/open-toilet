import { useState, useEffect } from 'react';
import { TIMEOUTS } from '../constants';

interface UseUserLocationOptions {
  onLocationFound?: (lat: number, lng: number) => void;
}

export const useUserLocation = ({ onLocationFound }: UseUserLocationOptions = {}) => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Get user location on component mount
  useEffect(() => {
    if (!hasInitialized && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation: [number, number] = [latitude, longitude];
          setUserLocation(newLocation);
          onLocationFound?.(latitude, longitude);
          setHasInitialized(true);
        },
        (error) => {
          console.log('Could not get user location on startup:', error.message);
          // Silently fall back to default location
          setHasInitialized(true);
        },
        {
          enableHighAccuracy: false, // Use less accurate but faster location for initial load
          timeout: TIMEOUTS.GEOLOCATION_QUICK,
          maximumAge: TIMEOUTS.GEOLOCATION_CACHE
        }
      );
    } else if (!hasInitialized) {
      // No geolocation support, use default
      setHasInitialized(true);
    }
  }, [hasInitialized, onLocationFound]);

  const findUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation: [number, number] = [latitude, longitude];
          setUserLocation(newLocation);
          onLocationFound?.(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enable location services.');
        },
        {
          enableHighAccuracy: true,
          timeout: TIMEOUTS.GEOLOCATION_ACCURATE,
          maximumAge: TIMEOUTS.GEOLOCATION_CACHE
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  return {
    userLocation,
    findUserLocation,
    hasInitialized
  };
};