import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import { apiService, Restroom } from './services/api';
import './App.css';

function App() {
  const [restrooms, setRestrooms] = useState<Restroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRestrooms();
  }, []);

  const loadRestrooms = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAllRestrooms();
      setRestrooms(data);
      setError(null);
    } catch (err) {
      setError('Failed to load restrooms. Please try again.');
      console.error('Error loading restrooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationFound = (lat: number, lng: number) => {
    console.log('User location found:', lat, lng);
  };

  const handleRestroomAdded = (newRestroom: Restroom) => {
    setRestrooms(prev => [...prev, newRestroom]);
  };

  const handleRestroomUpdated = (updatedRestroom: Restroom) => {
    setRestrooms(prev => 
      prev.map(restroom => 
        restroom.id === updatedRestroom.id 
          ? { ...restroom, ...updatedRestroom }
          : restroom
      )
    );
  };

  const handleAccessCodeAdded = (restroomId: number, newAccessCode: any) => {
    setRestrooms(prev => 
      prev.map(restroom => 
        restroom.id === restroomId 
          ? { 
              ...restroom, 
              access_codes: [...(restroom.access_codes || []), newAccessCode] 
            }
          : restroom
      )
    );
  };

  const handleAccessCodeVoted = (restroomId: number, codeId: number, voteType: 'like' | 'dislike') => {
    setRestrooms(prev => 
      prev.map(restroom => 
        restroom.id === restroomId 
          ? {
              ...restroom,
              access_codes: (restroom.access_codes || []).map(code =>
                code.id === codeId
                  ? {
                      ...code,
                      likes: voteType === 'like' ? code.likes + 1 : code.likes,
                      dislikes: voteType === 'dislike' ? code.dislikes + 1 : code.dislikes
                    }
                  : code
              )
            }
          : restroom
      )
    );
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div>Loading restrooms...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>
        <button onClick={loadRestrooms}>Retry</button>
      </div>
    );
  }

  return (
    <div className="App">
      <Map 
        restrooms={restrooms}
        onLocationFound={handleLocationFound}
        onRestroomAdded={handleRestroomAdded}
        onRestroomUpdated={handleRestroomUpdated}
        onAccessCodeAdded={handleAccessCodeAdded}
        onAccessCodeVoted={handleAccessCodeVoted}
      />
    </div>
  );
}

export default App;
