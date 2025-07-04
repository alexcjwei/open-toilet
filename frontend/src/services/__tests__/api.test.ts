import { apiService, Restroom, CreateRestroomData, CreateCodeData, VoteData } from '../api';

// Mock fetch globally
global.fetch = jest.fn();

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllRestrooms', () => {
    it('should fetch restrooms successfully', async () => {
      const mockRestrooms: Restroom[] = [
        {
          id: 1,
          name: 'Test Restroom',
          latitude: 40.7128,
          longitude: -74.0060,
          type: 'neutral',
          access_codes: [],
          created_at: '2023-01-01T00:00:00Z'
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRestrooms,
      });

      const result = await apiService.getAllRestrooms();

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/restrooms');
      expect(result).toEqual(mockRestrooms);
    });

    it('should handle fetch error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      await expect(apiService.getAllRestrooms()).rejects.toThrow('Failed to fetch restrooms');
    });

    it('should use production API URL in production', async () => {
      // Create a new instance with production environment
      const originalEnv = process.env.NODE_ENV;
      
      // We need to delete the module from cache and reimport to test NODE_ENV change
      jest.resetModules();
      process.env.NODE_ENV = 'production';
      
      const { apiService: prodApiService } = require('../api');

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await prodApiService.getAllRestrooms();

      expect(fetch).toHaveBeenCalledWith('/api/restrooms');
      
      process.env.NODE_ENV = originalEnv;
      jest.resetModules();
    });
  });

  describe('createRestroom', () => {
    it('should create restroom successfully', async () => {
      const restroomData: CreateRestroomData = {
        name: 'New Restroom',
        latitude: 40.7128,
        longitude: -74.0060,
        type: 'male'
      };

      const mockResponse = {
        id: 1,
        ...restroomData,
        message: 'Restroom added successfully'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiService.createRestroom(restroomData);

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/restrooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restroomData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle create restroom error', async () => {
      const restroomData: CreateRestroomData = {
        name: 'New Restroom',
        latitude: 40.7128,
        longitude: -74.0060,
        type: 'male'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      await expect(apiService.createRestroom(restroomData)).rejects.toThrow('Failed to create restroom');
    });
  });

  describe('addAccessCode', () => {
    it('should add access code successfully', async () => {
      const codeData: CreateCodeData = { code: '1234' };
      const mockResponse = {
        id: 1,
        restroom_id: '1',
        code: '1234',
        likes: 0,
        dislikes: 0,
        message: 'Access code added successfully'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiService.addAccessCode(1, codeData);

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/restrooms/1/codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(codeData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle add access code error with error message', async () => {
      const codeData: CreateCodeData = { code: '1234' };
      const errorResponse = { error: 'This code already exists for this restroom' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => errorResponse,
      });

      await expect(apiService.addAccessCode(1, codeData))
        .rejects.toThrow('This code already exists for this restroom');
    });

    it('should handle add access code error without specific message', async () => {
      const codeData: CreateCodeData = { code: '1234' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(apiService.addAccessCode(1, codeData))
        .rejects.toThrow('Failed to add access code');
    });
  });

  describe('voteOnCode', () => {
    it('should vote on code successfully', async () => {
      const voteData: VoteData = { type: 'like' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      await apiService.voteOnCode(1, voteData);

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/restrooms/codes/1/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voteData),
      });
    });

    it('should handle vote error', async () => {
      const voteData: VoteData = { type: 'like' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      await expect(apiService.voteOnCode(1, voteData)).rejects.toThrow('Failed to vote on code');
    });
  });

  describe('checkHealth', () => {
    it('should check health successfully', async () => {
      const mockHealth = { status: 'OK', message: 'Backend is running' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealth,
      });

      const result = await apiService.checkHealth();

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/health');
      expect(result).toEqual(mockHealth);
    });

    it('should handle health check error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      await expect(apiService.checkHealth()).rejects.toThrow('Health check failed');
    });
  });
});