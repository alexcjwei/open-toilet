export interface SearchResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: [string, string, string, string]; // [south, north, west, east]
  type: string;
  importance: number;
}

export interface SearchLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  bounds?: [[number, number], [number, number]]; // [[south, west], [north, east]]
  type: string;
  importance: number;
}

class SearchService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org/search';

  async searchLocations(query: string): Promise<SearchLocation[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: '5',
        addressdetails: '1',
        countrycodes: 'us', // Focus on US for now, can be expanded
        dedupe: '1'
      });

      const response = await fetch(`${this.baseUrl}?${params}`, {
        headers: {
          'User-Agent': 'OpenToilet/1.0 (https://open-toilet.vercel.app)' // Required by Nominatim
        }
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const results: SearchResult[] = await response.json();

      return results.map(result => ({
        id: result.place_id,
        name: result.display_name,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        bounds: result.boundingbox ? [
          [parseFloat(result.boundingbox[0]), parseFloat(result.boundingbox[2])], // [south, west]
          [parseFloat(result.boundingbox[1]), parseFloat(result.boundingbox[3])]  // [north, east]
        ] : undefined,
        type: result.type,
        importance: result.importance
      }));
    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Failed to search locations');
    }
  }

  // Debounce helper for search input
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }
}

export const searchService = new SearchService();