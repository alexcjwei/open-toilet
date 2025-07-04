const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export interface Restroom {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  type: 'male' | 'female' | 'neutral';
  access_codes: AccessCode[];
  created_at: string;
}

export interface AccessCode {
  id: number;
  code: string;
  likes: number;
  dislikes: number;
  created_at: string;
}

export interface CreateRestroomData {
  name: string;
  latitude: number;
  longitude: number;
  type: 'male' | 'female' | 'neutral';
}

export interface CreateCodeData {
  code: string;
}

export interface VoteData {
  type: 'like' | 'dislike';
}

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