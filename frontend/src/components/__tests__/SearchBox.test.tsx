import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBox from '../SearchBox';
import { searchService, SearchLocation } from '../../services/searchService';

// Mock the search service
jest.mock('../../services/searchService');
const mockSearchService = searchService as jest.Mocked<typeof searchService>;

describe('SearchBox Component', () => {
  const mockOnLocationSelect = jest.fn();
  const mockOnSearchResults = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const defaultProps = {
    onLocationSelect: mockOnLocationSelect,
    onSearchResults: mockOnSearchResults,
  };

  const mockSearchResults: SearchLocation[] = [
    {
      id: '1',
      name: 'Starbucks, 123 Main St, New York, NY',
      latitude: 40.7128,
      longitude: -74.0060,
      type: 'amenity',
      importance: 0.8
    },
    {
      id: '2',
      name: 'McDonald\'s, 456 Broadway, New York, NY',
      latitude: 40.7589,
      longitude: -73.9851,
      type: 'amenity',
      importance: 0.7
    }
  ];

  it('should render with default placeholder', () => {
    render(<SearchBox {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Search for a place...')).toBeInTheDocument();
  });

  it('should render with custom placeholder', () => {
    render(<SearchBox {...defaultProps} placeholder="Custom placeholder" />);
    
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('should call search service on input change after debounce', async () => {
    mockSearchService.searchLocations.mockResolvedValueOnce(mockSearchResults);
    mockSearchService.debounce.mockImplementation((fn: any, delay: number) => {
      return fn; // Return function directly for testing
    });

    render(<SearchBox {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search for a place...');
    
    await act(async () => {
      await userEvent.type(input, 'starbucks');
    });

    await waitFor(() => {
      expect(mockSearchService.searchLocations).toHaveBeenCalledWith('starbucks');
    });
  });

  it('should display search results in dropdown', async () => {
    mockSearchService.searchLocations.mockResolvedValueOnce(mockSearchResults);
    mockSearchService.debounce.mockImplementation((fn: any) => fn);

    render(<SearchBox {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search for a place...');
    
    await act(async () => {
      await userEvent.type(input, 'starbucks');
    });

    await waitFor(() => {
      expect(screen.getByText('Starbucks')).toBeInTheDocument();
      expect(screen.getByText('McDonald\'s')).toBeInTheDocument();
    });

    expect(screen.getByText('123 Main St, New York, NY')).toBeInTheDocument();
  });

  it('should call onLocationSelect when result is clicked', async () => {
    mockSearchService.searchLocations.mockResolvedValueOnce(mockSearchResults);
    mockSearchService.debounce.mockImplementation((fn: any) => fn);

    render(<SearchBox {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search for a place...');
    
    await act(async () => {
      await userEvent.type(input, 'starbucks');
    });

    await waitFor(() => {
      expect(screen.getByText('Starbucks')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Starbucks'));

    expect(mockOnLocationSelect).toHaveBeenCalledWith(mockSearchResults[0]);
  });

  it('should close dropdown when location is selected', async () => {
    mockSearchService.searchLocations.mockResolvedValueOnce(mockSearchResults);
    mockSearchService.debounce.mockImplementation((fn: any) => fn);

    render(<SearchBox {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search for a place...');
    
    await act(async () => {
      await userEvent.type(input, 'starbucks');
    });

    await waitFor(() => {
      expect(screen.getByText('Starbucks')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Starbucks'));

    expect(screen.queryByText('McDonald\'s')).not.toBeInTheDocument();
  });

  it('should show loading indicator while searching', async () => {
    let resolveSearch: (value: SearchLocation[]) => void;
    const searchPromise = new Promise<SearchLocation[]>((resolve) => {
      resolveSearch = resolve;
    });
    
    mockSearchService.searchLocations.mockReturnValueOnce(searchPromise);
    mockSearchService.debounce.mockImplementation((fn: any) => fn);

    render(<SearchBox {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search for a place...');
    await userEvent.type(input, 'starbucks');

    expect(screen.getByText('...')).toBeInTheDocument();

    resolveSearch!(mockSearchResults);
    
    await waitFor(() => {
      expect(screen.queryByText('...')).not.toBeInTheDocument();
    });
  });

  it('should show error message on search failure', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    mockSearchService.searchLocations.mockRejectedValueOnce(new Error('Search failed'));
    mockSearchService.debounce.mockImplementation((fn: any) => fn);

    render(<SearchBox {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search for a place...');
    
    await act(async () => {
      await userEvent.type(input, 'starbucks');
    });

    await waitFor(() => {
      expect(screen.getByText('Search failed. Please try again.')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('should show clear button when there is text', async () => {
    mockSearchService.debounce.mockImplementation((fn: any) => fn);
    
    render(<SearchBox {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search for a place...');
    await act(async () => {
      await userEvent.type(input, 'test');
    });

    expect(screen.getByText('×')).toBeInTheDocument();
  });

  it('should clear search when clear button is clicked', async () => {
    mockSearchService.debounce.mockImplementation((fn: any) => fn);

    render(<SearchBox {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search for a place...');
    await act(async () => {
      await userEvent.type(input, 'test');
    });

    const clearButton = screen.getByText('×');
    await userEvent.click(clearButton);

    expect(input).toHaveValue('');
    expect(mockOnSearchResults).toHaveBeenCalledWith([]);
  });

  it('should close dropdown when clicking outside', async () => {
    mockSearchService.searchLocations.mockResolvedValueOnce(mockSearchResults);
    mockSearchService.debounce.mockImplementation((fn: any) => fn);

    render(
      <div>
        <SearchBox {...defaultProps} />
        <div data-testid="outside">Outside element</div>
      </div>
    );
    
    const input = screen.getByPlaceholderText('Search for a place...');
    
    await act(async () => {
      await userEvent.type(input, 'starbucks');
    });

    // Wait for results to appear
    await waitFor(() => {
      expect(screen.getByText('Starbucks')).toBeInTheDocument();
    });

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'));

    // Results should be hidden
    expect(screen.queryByText('Starbucks')).not.toBeInTheDocument();
  });

  it('should reopen dropdown on focus if there are results', async () => {
    mockSearchService.searchLocations.mockResolvedValueOnce(mockSearchResults);
    mockSearchService.debounce.mockImplementation((fn: any) => fn);

    render(<SearchBox {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search for a place...');
    
    await act(async () => {
      await userEvent.type(input, 'starbucks');
    });

    await waitFor(() => {
      expect(screen.getByText('Starbucks')).toBeInTheDocument();
    });

    // Click outside to close
    fireEvent.mouseDown(document.body);
    
    await waitFor(() => {
      expect(screen.queryByText('Starbucks')).not.toBeInTheDocument();
    });

    // Focus input again
    fireEvent.focus(input);
    
    await waitFor(() => {
      expect(screen.getByText('Starbucks')).toBeInTheDocument();
    });
  });

  it('should call onSearchResults with results', async () => {
    mockSearchService.searchLocations.mockResolvedValueOnce(mockSearchResults);
    mockSearchService.debounce.mockImplementation((fn: any) => fn);

    render(<SearchBox {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search for a place...');
    
    await act(async () => {
      await userEvent.type(input, 'starbucks');
    });

    await waitFor(() => {
      expect(mockOnSearchResults).toHaveBeenCalledWith(mockSearchResults);
    });
  });

  it('should handle empty search results', async () => {
    mockSearchService.searchLocations.mockResolvedValueOnce([]);
    mockSearchService.debounce.mockImplementation((fn: any) => fn);

    render(<SearchBox {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search for a place...');
    await act(async () => {
      await userEvent.type(input, 'nonexistent');
    });

    await waitFor(() => {
      expect(mockOnSearchResults).toHaveBeenCalledWith([]);
    });

    // No results dropdown should be visible
    expect(screen.queryByText('Starbucks')).not.toBeInTheDocument();
  });

  it('should update input value when location is selected', async () => {
    mockSearchService.searchLocations.mockResolvedValueOnce(mockSearchResults);
    mockSearchService.debounce.mockImplementation((fn: any) => fn);

    render(<SearchBox {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search for a place...') as HTMLInputElement;
    await userEvent.type(input, 'starbucks');

    await waitFor(() => {
      expect(screen.getByText('Starbucks')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Starbucks'));

    expect(input.value).toBe('Starbucks, 123 Main St, New York, NY');
  });

});