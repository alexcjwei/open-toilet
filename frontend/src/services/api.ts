import { Restroom, AccessCode, CreateRestroomData, CreateCodeData, VoteData } from '../types';
import { API_CONFIG } from '../constants';

const API_BASE_URL = API_CONFIG.BASE_URL;

class ApiService {
  async getAllRestrooms(): Promise<Restroom[]> {
    const response = await fetch(`${API_BASE_URL}/restrooms`);
    if (!response.ok) {
      throw new Error('Failed to fetch restrooms');
    }
    return response.json();
  }

  async createRestroom(data: CreateRestroomData): Promise<Restroom> {
    const response = await fetch(`${API_BASE_URL}/restrooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create restroom');
    }
    return response.json();
  }

  async addAccessCode(restroomId: number, data: CreateCodeData): Promise<AccessCode> {
    const response = await fetch(`${API_BASE_URL}/restrooms/${restroomId}/codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add access code');
    }
    return response.json();
  }

  async updateRestroom(restroomId: number, data: { name: string }): Promise<Restroom> {
    const response = await fetch(`${API_BASE_URL}/restrooms/${restroomId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update restroom');
    }
    return response.json();
  }

  async voteOnCode(codeId: number, data: VoteData): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/restrooms/codes/${codeId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to vote on code');
    }
  }

  async checkHealth(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }
}

export const apiService = new ApiService();