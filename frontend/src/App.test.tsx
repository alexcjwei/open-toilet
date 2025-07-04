import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { apiService } from './services/api';

// Mock the API service
jest.mock('./services/api');
const mockApiService = apiService as jest.Mocked<typeof apiService>;

// Mock the Map component since it has complex dependencies
jest.mock('./components/Map', () => {
  return function MockMap({ restrooms, onLocationFound }: any) {
    return (
      <div data-testid="map">
        <div data-testid="restroom-count">{restrooms.length} restrooms</div>
        <button 
          data-testid="mock-location-button"
          onClick={() => onLocationFound?.(40.7128, -74.0060)}
        >
          Find Location
        </button>
      </div>
    );
  };
});

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state initially', () => {
    mockApiService.getAllRestrooms.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<App />);
    
    expect(screen.getByText('Loading restrooms...')).toBeInTheDocument();
  });

  it('should display restrooms after successful load', async () => {
    const mockRestrooms = [
      {
        id: 1,
        name: 'Test Restroom 1',
        latitude: 40.7128,
        longitude: -74.0060,
        type: 'male' as const,
        access_codes: [],
        created_at: '2023-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: 'Test Restroom 2',
        latitude: 40.7829,
        longitude: -73.9654,
        type: 'female' as const,
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
      }
    ];

    mockApiService.getAllRestrooms.mockResolvedValueOnce(mockRestrooms);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('map')).toBeInTheDocument();
    });

    expect(screen.getByTestId('restroom-count')).toHaveTextContent('2 restrooms');
    expect(screen.queryByText('Loading restrooms...')).not.toBeInTheDocument();
  });

  it('should display error state when API fails', async () => {
    mockApiService.getAllRestrooms.mockRejectedValueOnce(new Error('API Error'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load restrooms. Please try again.')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.queryByTestId('map')).not.toBeInTheDocument();
  });

  it('should retry loading when retry button is clicked', async () => {
    const user = userEvent;
    
    // First call fails
    mockApiService.getAllRestrooms.mockRejectedValueOnce(new Error('API Error'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load restrooms. Please try again.')).toBeInTheDocument();
    });

    // Second call succeeds
    mockApiService.getAllRestrooms.mockResolvedValueOnce([]);

    const retryButton = screen.getByRole('button', { name: 'Retry' });
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByTestId('map')).toBeInTheDocument();
    });

    expect(mockApiService.getAllRestrooms).toHaveBeenCalledTimes(2);
  });

  it('should handle location found callback', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    mockApiService.getAllRestrooms.mockResolvedValueOnce([]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('map')).toBeInTheDocument();
    });

    const locationButton = screen.getByTestId('mock-location-button');
    await userEvent.click(locationButton);

    expect(consoleSpy).toHaveBeenCalledWith('User location found:', 40.7128, -74.0060);
    
    consoleSpy.mockRestore();
  });

  it('should display empty restrooms list', async () => {
    mockApiService.getAllRestrooms.mockResolvedValueOnce([]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('map')).toBeInTheDocument();
    });

    expect(screen.getByTestId('restroom-count')).toHaveTextContent('0 restrooms');
  });

  it('should call API service on component mount', async () => {
    mockApiService.getAllRestrooms.mockResolvedValueOnce([]);

    render(<App />);

    await waitFor(() => {
      expect(mockApiService.getAllRestrooms).toHaveBeenCalledTimes(1);
    });
  });
});
