export const COLORS = {
  RESTROOM_TYPES: {
    male: '#4285f4',
    female: '#ea4335',
    neutral: '#34a853',
    multi: '#9c27b0'
  },
  USER_LOCATION: '#ff6b6b',
  SEARCH_RESULT: '#9c27b0',
  SELECTED_SEARCH: '#ff9800',
  BUTTONS: {
    PRIMARY: '#4caf50',
    EDIT: '#ff9800',
    ADD_CODE: '#4285f4'
  },
  TEXT: {
    PRIMARY: '#333',
    SECONDARY: '#666'
  },
  BORDERS: {
    DEFAULT: '#e1e5e9',
    FOCUS: '#4285f4'
  }
} as const;

export const TIMEOUTS = {
  GEOLOCATION_QUICK: 5000,
  GEOLOCATION_ACCURATE: 10000,
  GEOLOCATION_CACHE: 300000, // 5 minutes
  SEARCH_DEBOUNCE: 500
} as const;

export const SIZES = {
  ICON: {
    SMALL: 16,
    MEDIUM: 20,
    LARGE: 24
  },
  USER_MARKER: 12,
  BORDER_RADIUS: {
    SMALL: '4px',
    MEDIUM: '6px',
    LARGE: '8px',
    MODAL: '12px'
  }
} as const;

export const Z_INDEX = {
  SEARCH_DROPDOWN: 1000,
  SEARCH_ERROR: 1001,
  MODAL: 2000
} as const;

export const COORDINATES = {
  LOCATION_MATCH_THRESHOLD: 0.0001,
  DEFAULT_ZOOM: 13,
  USER_ZOOM: 16,
  FLY_DURATION: 2,
  DEFAULT_CENTER: [40.7128, -74.0060] as [number, number] // NYC
} as const;

export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api'
} as const;