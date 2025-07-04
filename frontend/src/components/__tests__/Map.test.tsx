import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock SearchBox component
jest.mock('../SearchBox', () => {
  return function MockSearchBox({ onLocationSelect, onSearchResults, placeholder }: any) {
    return (
      <div data-testid="search-box">
        <input 
          data-testid="search-input"
          placeholder={placeholder}
          onChange={(e) => {
            if (e.target.value === 'starbucks') {
              const mockResults = [{
                id: 'test-1',
                name: 'Starbucks, 123 Main St',
                latitude: 40.7128,
                longitude: -74.0060,
                type: 'amenity',
                importance: 0.8
              }];
              onSearchResults(mockResults);
            }
          }}
        />
        <button 
          data-testid="mock-select-location"
          onClick={() => onLocationSelect({
            id: 'test-1',
            name: 'Starbucks, 123 Main St',
            latitude: 40.7128,
            longitude: -74.0060,
            type: 'amenity',
            importance: 0.8
          })}
        >
          Select Location
        </button>
      </div>
    );
  };
});

// Mock Leaflet and react-leaflet since they require DOM and complex setup
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children, center, zoom, style, zoomControl, ...props }: any) => (
    <div data-testid="map-container" data-center={center?.join(',')} data-zoom={zoom} style={style}>
      {children}
    </div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children, position, icon, eventHandlers }: any) => (
    <div 
      data-testid="marker" 
      data-position={position.join(',')} 
      data-icon={icon?.options?.className}
      onClick={eventHandlers?.click}
    >
      {children}
    </div>
  ),
  Popup: ({ children }: any) => (
    <div data-testid="popup">
      {children}
    </div>
  ),
  useMap: () => ({
    flyTo: jest.fn(),
  }),
}));

// Mock leaflet
jest.mock('leaflet', () => ({
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: jest.fn(),
    },
  },
  divIcon: ({ html, className }: any) => ({
    options: { html, className },
    _getIconUrl: jest.fn(),
  }),
}));

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

import Map from '../Map';

describe('Map Component', () => {
  const mockRestrooms = [
    {
      id: 1,
      name: 'Test Restroom 1',
      latitude: 40.7128,
      longitude: -74.0060,
      type: 'male' as const,
      access_codes: [
        {
          id: 1,
          code: '1234',
          likes: 5,
          dislikes: 1,
          created_at: '2023-01-01T00:00:00Z'
        }
      ],
      created_at: '2023-01-01T00:00:00Z'
    },
    {
      id: 2,
      name: 'Test Restroom 2',
      latitude: 40.7829,
      longitude: -73.9654,
      type: 'neutral' as const,
      access_codes: [],
      created_at: '2023-01-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render map container and basic elements', () => {
    render(<Map restrooms={[]} />);

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
    expect(screen.getByTitle('Find my location')).toBeInTheDocument();
    expect(screen.getByTestId('search-box')).toBeInTheDocument();
  });

  it('should render restroom markers', () => {
    render(<Map restrooms={mockRestrooms} />);

    const markers = screen.getAllByTestId('marker');
    expect(markers).toHaveLength(2); // Should have 2 restroom markers (no user location yet)
    
    expect(markers[0]).toHaveAttribute('data-position', '40.7128,-74.006');
    expect(markers[1]).toHaveAttribute('data-position', '40.7829,-73.9654');
  });

  it('should display restroom information in popups', () => {
    render(<Map restrooms={mockRestrooms} />);

    expect(screen.getByText('Test Restroom 1')).toBeInTheDocument();
    expect(screen.getByText('Test Restroom 2')).toBeInTheDocument();
    expect(screen.getByText('Type: male')).toBeInTheDocument();
    expect(screen.getByText('Type: neutral')).toBeInTheDocument();
  });

  it('should display access codes when available', () => {
    render(<Map restrooms={mockRestrooms} />);

    expect(screen.getByText('Access Codes:')).toBeInTheDocument();
    expect(screen.getByText('1234')).toBeInTheDocument();
    expect(screen.getByText('👍 5 👎 1')).toBeInTheDocument();
  });

  it('should display "No access codes available" when no codes exist', () => {
    render(<Map restrooms={mockRestrooms} />);

    expect(screen.getByText('No access codes available')).toBeInTheDocument();
  });

  it('should handle successful geolocation', async () => {
    const mockOnLocationFound = jest.fn();

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      });
    });

    render(<Map restrooms={[]} onLocationFound={mockOnLocationFound} />);

    const locationButton = screen.getByTitle('Find my location');
    await userEvent.click(locationButton);

    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    expect(mockOnLocationFound).toHaveBeenCalledWith(40.7128, -74.0060);
  });

  it('should handle geolocation error', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error({
        code: 1,
        message: 'Permission denied',
      });
    });

    render(<Map restrooms={[]} />);

    const locationButton = screen.getByTitle('Find my location');
    await userEvent.click(locationButton);

    expect(alertSpy).toHaveBeenCalledWith('Unable to get your location. Please enable location services.');
    
    alertSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('should handle missing geolocation support', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
    
    // Mock navigator without geolocation
    const originalNavigator = global.navigator;
    Object.defineProperty(global, 'navigator', {
      value: {},
      writable: true,
    });

    render(<Map restrooms={[]} />);

    const locationButton = screen.getByTitle('Find my location');
    await userEvent.click(locationButton);

    expect(alertSpy).toHaveBeenCalledWith('Geolocation is not supported by this browser.');
    
    alertSpy.mockRestore();
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  it('should sort access codes by creation date (newest first)', () => {
    const restroomWithMultipleCodes = [{
      id: 1,
      name: 'Test Restroom',
      latitude: 40.7128,
      longitude: -74.0060,
      type: 'neutral' as const,
      access_codes: [
        {
          id: 1,
          code: 'old-code',
          likes: 2,
          dislikes: 0,
          created_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 2,
          code: 'new-code',
          likes: 5,
          dislikes: 1,
          created_at: '2023-01-02T00:00:00Z'
        }
      ],
      created_at: '2023-01-01T00:00:00Z'
    }];

    render(<Map restrooms={restroomWithMultipleCodes} />);

    const codeElements = screen.getAllByText(/code/);
    const codeTexts = codeElements.map(el => el.textContent);
    
    // The newer code should appear first
    expect(codeTexts[0]).toContain('new-code');
    expect(codeTexts[1]).toContain('old-code');
  });

  it('should call onLocationFound callback when provided', async () => {
    const mockOnLocationFound = jest.fn();

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      });
    });

    render(<Map restrooms={[]} onLocationFound={mockOnLocationFound} />);

    const locationButton = screen.getByTitle('Find my location');
    await userEvent.click(locationButton);

    expect(mockOnLocationFound).toHaveBeenCalledWith(40.7128, -74.0060);
  });

  it('should work without onLocationFound callback', async () => {

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      });
    });

    render(<Map restrooms={[]} />);

    const locationButton = screen.getByTitle('Find my location');
    await userEvent.click(locationButton);

    // Should not throw error
    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
  });

  describe('Search Functionality', () => {
    it('should render search box with correct placeholder', () => {
      render(<Map restrooms={[]} />);

      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toHaveAttribute('placeholder', 'Search for places to add restrooms...');
    });

    it('should handle search results and display markers', async () => {
      render(<Map restrooms={[]} />);

      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'starbucks');

      // Should have search result markers (initially none, then 1 after search)
      const markers = screen.getAllByTestId('marker');
      expect(markers.length).toBeGreaterThan(0);
    });

    it('should handle location selection from search', async () => {
      render(<Map restrooms={[]} />);

      const selectButton = screen.getByTestId('mock-select-location');
      await userEvent.click(selectButton);

      // Should show selected location marker
      const markers = screen.getAllByTestId('marker');
      expect(markers.length).toBeGreaterThan(0);
    });

    it('should display "Add Restroom Here" button for selected location', async () => {
      render(<Map restrooms={[]} />);

      const selectButton = screen.getByTestId('mock-select-location');
      await userEvent.click(selectButton);

      expect(screen.getByText('Add Restroom Here')).toBeInTheDocument();
    });

    it('should display different marker types', () => {
      const searchLocation = {
        id: 'search-1',
        name: 'Test Location',
        latitude: 40.7128,
        longitude: -74.0060,
        type: 'amenity',
        importance: 0.8
      };

      render(<Map restrooms={mockRestrooms} />);

      // Should have restroom markers
      const markers = screen.getAllByTestId('marker');
      expect(markers.length).toBe(2); // 2 restrooms from mockData
    });

    it('should clear search results when location is selected', async () => {
      render(<Map restrooms={[]} />);

      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'starbucks');

      // Select a location
      const selectButton = screen.getByTestId('mock-select-location');
      await userEvent.click(selectButton);

      // Search results should be cleared (only selected location marker should remain)
      const markers = screen.getAllByTestId('marker');
      expect(markers.length).toBe(1); // Only selected location marker
    });

    it('should fly to selected location when location is selected from search', async () => {
      const mockFlyTo = jest.fn();
      
      // Mock useMap to return our spy function
      const reactLeaflet = jest.requireMock('react-leaflet');
      reactLeaflet.useMap = jest.fn(() => ({
        flyTo: mockFlyTo,
      }));

      render(<Map restrooms={[]} />);

      // Select a location using the mock button
      const selectButton = screen.getByTestId('mock-select-location');
      await userEvent.click(selectButton);

      // Should call flyTo with the location coordinates and zoom level
      expect(mockFlyTo).toHaveBeenCalledWith([40.7128, -74.0060], 16, {
        duration: 2
      });
    });
  });
});