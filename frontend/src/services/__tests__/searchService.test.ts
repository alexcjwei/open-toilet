import { searchService, SearchResult } from '../searchService';

// Mock fetch globally
global.fetch = jest.fn();

describe('SearchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchLocations', () => {
    it('should return empty array for empty query', async () => {
      const result = await searchService.searchLocations('');
      expect(result).toEqual([]);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should return empty array for whitespace-only query', async () => {
      const result = await searchService.searchLocations('   ');
      expect(result).toEqual([]);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should search and return formatted results', async () => {
      const mockApiResponse: SearchResult[] = [
        {
          place_id: '123',
          display_name: 'Starbucks, 123 Main St, New York, NY, USA',
          lat: '40.7128',
          lon: '-74.0060',
          boundingbox: ['40.7100', '40.7150', '-74.0080', '-74.0040'],
          type: 'amenity',
          importance: 0.8
        },
        {
          place_id: '456',
          display_name: 'McDonald\'s, 456 Broadway, New York, NY, USA',
          lat: '40.7589',
          lon: '-73.9851',
          boundingbox: ['40.7580', '40.7590', '-73.9860', '-73.9840'],
          type: 'amenity',
          importance: 0.7
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const results = await searchService.searchLocations('starbucks');

      expect(fetch).toHaveBeenCalledWith(
        'https://nominatim.openstreetmap.org/search?q=starbucks&format=json&limit=5&addressdetails=1&countrycodes=us&dedupe=1',
        {
          headers: {
            'User-Agent': 'OpenToilet/1.0 (https://open-toilet.vercel.app)'
          }
        }
      );

      expect(results).toEqual([
        {
          id: '123',
          name: 'Starbucks, 123 Main St, New York, NY, USA',
          latitude: 40.7128,
          longitude: -74.0060,
          bounds: [[40.7100, -74.0080], [40.7150, -74.0040]],
          type: 'amenity',
          importance: 0.8
        },
        {
          id: '456',
          name: 'McDonald\'s, 456 Broadway, New York, NY, USA',
          latitude: 40.7589,
          longitude: -73.9851,
          bounds: [[40.7580, -73.9860], [40.7590, -73.9840]],
          type: 'amenity',
          importance: 0.7
        }
      ]);
    });

    it('should handle results without bounding box', async () => {
      const mockApiResponse: SearchResult[] = [
        {
          place_id: '789',
          display_name: 'Times Square, New York, NY, USA',
          lat: '40.7580',
          lon: '-73.9855',
          boundingbox: null as any,
          type: 'place',
          importance: 0.9
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const results = await searchService.searchLocations('times square');

      expect(results).toEqual([
        {
          id: '789',
          name: 'Times Square, New York, NY, USA',
          latitude: 40.7580,
          longitude: -73.9855,
          bounds: undefined,
          type: 'place',
          importance: 0.9
        }
      ]);
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(searchService.searchLocations('test')).rejects.toThrow('Failed to search locations');
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(searchService.searchLocations('test')).rejects.toThrow('Failed to search locations');
    });

    it('should log errors and rethrow', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(searchService.searchLocations('test')).rejects.toThrow('Failed to search locations');
      
      expect(consoleSpy).toHaveBeenCalledWith('Search error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should properly encode query parameters', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await searchService.searchLocations('coffee & donuts');

      expect(fetch).toHaveBeenCalledWith(
        'https://nominatim.openstreetmap.org/search?q=coffee+%26+donuts&format=json&limit=5&addressdetails=1&countrycodes=us&dedupe=1',
        expect.any(Object)
      );
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = searchService.debounce(mockFn, 300);

      // Call multiple times rapidly
      debouncedFn('test1');
      debouncedFn('test2');
      debouncedFn('test3');

      // Function should not be called yet
      expect(mockFn).not.toHaveBeenCalled();

      // Fast-forward time
      jest.advanceTimersByTime(300);

      // Function should be called only once with the last arguments
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test3');
    });

    it('should reset debounce timer on subsequent calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = searchService.debounce(mockFn, 300);

      debouncedFn('test1');
      jest.advanceTimersByTime(100);
      
      debouncedFn('test2');
      jest.advanceTimersByTime(100);
      
      debouncedFn('test3');
      jest.advanceTimersByTime(299);

      // Should still not be called
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);

      // Now should be called
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test3');
    });

    it('should handle multiple arguments', () => {
      const mockFn = jest.fn();
      const debouncedFn = searchService.debounce(mockFn, 300);

      debouncedFn('arg1', 'arg2', 'arg3');
      jest.advanceTimersByTime(300);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });
  });
});