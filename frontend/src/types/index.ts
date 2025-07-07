export interface AccessCode {
  id: number;
  code: string;
  likes: number;
  dislikes: number;
  created_at: string;
}

export interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Restroom {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  type: 'male' | 'female' | 'neutral';
  access_codes: AccessCode[];
  created_at: string;
  location?: Location;
}

export interface CreateRestroomData {
  name: string;
  latitude: number;
  longitude: number;
  type: 'male' | 'female' | 'neutral';
  locationName?: string;
}

export interface CreateCodeData {
  code: string;
}

export interface VoteData {
  type: 'like' | 'dislike';
}

export interface LocationGroup {
  location: {
    id?: number;
    name: string;
    latitude: number;
    longitude: number;
    address?: string;
  };
  restrooms: Restroom[];
}