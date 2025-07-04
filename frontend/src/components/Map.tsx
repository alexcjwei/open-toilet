import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SearchBox from './SearchBox';
import RestroomForm from './RestroomForm';
import AccessCodeForm from './AccessCodeForm';
import EditRestroomForm from './EditRestroomForm';
import { SearchLocation } from '../services/searchService';
import { apiService } from '../services/api';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface Restroom {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  type: 'male' | 'female' | 'neutral';
  access_codes: AccessCode[];
  created_at: string;
}

interface AccessCode {
  id: number;
  code: string;
  likes: number;
  dislikes: number;
  created_at: string;
}

interface MapProps {
  restrooms: Restroom[];
  onLocationFound?: (lat: number, lng: number) => void;
  onRestroomAdded?: (restroom: Restroom) => void;
  onRestroomUpdated?: (restroom: Restroom) => void;
  onAccessCodeAdded?: (restroomId: number, accessCode: AccessCode) => void;
  onAccessCodeVoted?: (restroomId: number, codeId: number, voteType: 'like' | 'dislike') => void;
}

// Component to handle map interactions
const MapController: React.FC<{ 
  userLocation: [number, number] | null;
  shouldFlyTo: boolean;
  onFlyComplete: () => void;
  searchLocation: [number, number] | null;
  shouldFlyToSearch: boolean;
  onSearchFlyComplete: () => void;
  shouldSetInitialView: boolean;
  onInitialViewSet: () => void;
}> = ({ userLocation, shouldFlyTo, onFlyComplete, searchLocation, shouldFlyToSearch, onSearchFlyComplete, shouldSetInitialView, onInitialViewSet }) => {
  const map = useMap();

  useEffect(() => {
    if (userLocation && shouldSetInitialView) {
      // Set initial view without animation
      map.setView(userLocation, 16);
      onInitialViewSet();
    }
  }, [userLocation, shouldSetInitialView, map, onInitialViewSet]);

  useEffect(() => {
    if (userLocation && shouldFlyTo) {
      map.flyTo(userLocation, 16, {
        duration: 2
      });
      onFlyComplete();
    }
  }, [userLocation, shouldFlyTo, map, onFlyComplete]);

  useEffect(() => {
    if (searchLocation && shouldFlyToSearch) {
      map.flyTo(searchLocation, 16, {
        duration: 2
      });
      onSearchFlyComplete();
    }
  }, [searchLocation, shouldFlyToSearch, map, onSearchFlyComplete]);

  return null;
};

const Map: React.FC<MapProps> = ({ restrooms, onLocationFound, onRestroomAdded, onRestroomUpdated, onAccessCodeAdded, onAccessCodeVoted }) => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]); // NYC default
  const [shouldFlyTo, setShouldFlyTo] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [shouldSetInitialView, setShouldSetInitialView] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchLocation[]>([]);
  const [selectedSearchLocation, setSelectedSearchLocation] = useState<SearchLocation | null>(null);
  const [shouldFlyToSearch, setShouldFlyToSearch] = useState(false);
  const [showRestroomForm, setShowRestroomForm] = useState(false);
  const [isSubmittingRestroom, setIsSubmittingRestroom] = useState(false);
  const [showAccessCodeForm, setShowAccessCodeForm] = useState(false);
  const [selectedRestroom, setSelectedRestroom] = useState<Restroom | null>(null);
  const [isSubmittingAccessCode, setIsSubmittingAccessCode] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingRestroom, setEditingRestroom] = useState<Restroom | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Get user location on component mount
  useEffect(() => {
    if (!hasInitialized && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation: [number, number] = [latitude, longitude];
          setUserLocation(newLocation);
          setMapCenter(newLocation);
          setShouldSetInitialView(true); // Set initial view without animation
          onLocationFound?.(latitude, longitude);
          setHasInitialized(true);
        },
        (error) => {
          console.log('Could not get user location on startup:', error.message);
          // Silently fall back to default location (NYC)
          setHasInitialized(true);
        },
        {
          enableHighAccuracy: false, // Use less accurate but faster location for initial load
          timeout: 5000, // 5 second timeout
          maximumAge: 300000 // 5 minutes
        }
      );
    } else if (!hasInitialized) {
      // No geolocation support, use default
      setHasInitialized(true);
    }
  }, [hasInitialized, onLocationFound]);

  const findUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation: [number, number] = [latitude, longitude];
          setUserLocation(newLocation);
          setMapCenter(newLocation);
          setShouldFlyTo(true);
          onLocationFound?.(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enable location services.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const createCustomIcon = (type: string) => {
    const iconColors = {
      male: '#4285f4',
      female: '#ea4335',
      neutral: '#34a853'
    };

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${iconColors[type as keyof typeof iconColors] || iconColors.neutral};
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  const userIcon = L.divIcon({
    className: 'user-marker',
    html: `
      <div style="
        background-color: #ff6b6b;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      "></div>
    `,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  const searchResultIcon = L.divIcon({
    className: 'search-result-marker',
    html: `
      <div style="
        background-color: #9c27b0;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  const selectedSearchIcon = L.divIcon({
    className: 'selected-search-marker',
    html: `
      <div style="
        background-color: #ff9800;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  // Handle search results
  const handleSearchResults = (results: SearchLocation[]) => {
    setSearchResults(results);
    setSelectedSearchLocation(null);
  };

  // Handle location selection from search
  const handleLocationSelect = (location: SearchLocation) => {
    setSelectedSearchLocation(location);
    setSearchResults([]); // Clear other search results
    setShouldFlyToSearch(true);
  };

  // Handle opening restroom form
  const handleAddRestroomClick = () => {
    setShowRestroomForm(true);
  };

  // Handle restroom form submission
  const handleRestroomSubmit = async (restroomData: {
    name: string;
    type: 'male' | 'female' | 'neutral';
    latitude: number;
    longitude: number;
  }) => {
    try {
      setIsSubmittingRestroom(true);
      const newRestroom = await apiService.createRestroom(restroomData);
      onRestroomAdded?.(newRestroom);
      setShowRestroomForm(false);
      setSelectedSearchLocation(null); // Clear selected location
    } catch (error) {
      console.error('Failed to create restroom:', error);
      alert('Failed to create restroom. Please try again.');
    } finally {
      setIsSubmittingRestroom(false);
    }
  };

  // Handle form cancellation
  const handleRestroomCancel = () => {
    setShowRestroomForm(false);
  };

  // Handle opening access code form
  const handleAddAccessCodeClick = (restroom: Restroom) => {
    setSelectedRestroom(restroom);
    setShowAccessCodeForm(true);
  };

  // Handle access code form submission
  const handleAccessCodeSubmit = async (accessCodeData: {
    restroom_id: number;
    code: string;
  }) => {
    try {
      setIsSubmittingAccessCode(true);
      const newAccessCode = await apiService.addAccessCode(accessCodeData.restroom_id, { code: accessCodeData.code });
      onAccessCodeAdded?.(accessCodeData.restroom_id, newAccessCode);
      setShowAccessCodeForm(false);
      setSelectedRestroom(null);
    } catch (error) {
      console.error('Failed to create access code:', error);
      alert('Failed to add access code. Please try again.');
    } finally {
      setIsSubmittingAccessCode(false);
    }
  };

  // Handle access code form cancellation
  const handleAccessCodeCancel = () => {
    setShowAccessCodeForm(false);
    setSelectedRestroom(null);
  };

  // Handle voting on access codes
  const handleVote = async (codeId: number, voteType: 'like' | 'dislike', restroomId: number) => {
    try {
      await apiService.voteOnCode(codeId, { type: voteType });
      onAccessCodeVoted?.(restroomId, codeId, voteType);
    } catch (error) {
      console.error('Failed to vote:', error);
      alert('Failed to vote. Please try again.');
    }
  };

  // Handle opening edit form
  const handleEditRestroomClick = (restroom: Restroom) => {
    setEditingRestroom(restroom);
    setShowEditForm(true);
  };

  // Handle edit form submission
  const handleEditSubmit = async (restroomId: number, data: { name: string }) => {
    try {
      setIsSubmittingEdit(true);
      const updatedRestroom = await apiService.updateRestroom(restroomId, data);
      onRestroomUpdated?.(updatedRestroom);
      setShowEditForm(false);
      setEditingRestroom(null);
      
      // Force popup refresh by closing and reopening if needed
      // The restrooms prop will be updated by the parent component
    } catch (error) {
      console.error('Failed to update restroom:', error);
      alert('Failed to update restroom. Please try again.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handle edit form cancellation
  const handleEditCancel = () => {
    setShowEditForm(false);
    setEditingRestroom(null);
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController 
          userLocation={userLocation}
          shouldFlyTo={shouldFlyTo}
          onFlyComplete={() => setShouldFlyTo(false)}
          searchLocation={selectedSearchLocation ? [selectedSearchLocation.latitude, selectedSearchLocation.longitude] : null}
          shouldFlyToSearch={shouldFlyToSearch}
          onSearchFlyComplete={() => setShouldFlyToSearch(false)}
          shouldSetInitialView={shouldSetInitialView}
          onInitialViewSet={() => setShouldSetInitialView(false)}
        />
        
        {/* User location marker */}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>Your location</Popup>
          </Marker>
        )}
        
        {/* Search result markers */}
        {searchResults.map((result) => (
          <Marker
            key={result.id}
            position={[result.latitude, result.longitude]}
            icon={searchResultIcon}
            eventHandlers={{
              click: () => handleLocationSelect(result)
            }}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                  {result.name.split(',')[0]}
                </h3>
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                  {result.name.split(',').slice(1).join(',').trim()}
                </p>
                <button
                  onClick={() => handleLocationSelect(result)}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    backgroundColor: '#9c27b0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Select this location
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Selected search location marker */}
        {selectedSearchLocation && (
          <Marker
            position={[selectedSearchLocation.latitude, selectedSearchLocation.longitude]}
            icon={selectedSearchIcon}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                  Selected Location
                </h3>
                <p style={{ margin: '4px 0 8px 0', fontSize: '14px' }}>
                  {selectedSearchLocation.name.split(',')[0]}
                </p>
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                  {selectedSearchLocation.name.split(',').slice(1).join(',').trim()}
                </p>
                <button
                  onClick={handleAddRestroomClick}
                  style={{
                    marginTop: '8px',
                    padding: '8px 16px',
                    backgroundColor: '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  Add Restroom Here
                </button>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Restroom markers */}
        {restrooms.map((restroom) => (
          <Marker
            key={restroom.id}
            position={[restroom.latitude, restroom.longitude]}
            icon={createCustomIcon(restroom.type)}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                  {restroom.name}
                </h3>
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                  Type: {restroom.type}
                </p>
                
                {restroom.access_codes && restroom.access_codes.length > 0 ? (
                  <div>
                    <h4 style={{ margin: '8px 0 4px 0', fontSize: '14px' }}>
                      Access Codes:
                    </h4>
                    {(restroom.access_codes || [])
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((code) => (
                        <div 
                          key={code.id}
                          style={{ 
                            padding: '4px 8px',
                            margin: '2px 0',
                            backgroundColor: '#f5f5f5',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong>{code.code}</strong>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVote(code.id, 'like', restroom.id);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  padding: '2px 4px',
                                  borderRadius: '2px',
                                  color: '#666'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#e8f5e8';
                                  e.currentTarget.style.color = '#4caf50';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.color = '#666';
                                }}
                                title="This code works"
                              >
                                👍 {code.likes}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVote(code.id, 'dislike', restroom.id);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  padding: '2px 4px',
                                  borderRadius: '2px',
                                  color: '#666'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#ffeaea';
                                  e.currentTarget.style.color = '#f44336';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.color = '#666';
                                }}
                                title="This code doesn't work"
                              >
                                👎 {code.dislikes}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <p style={{ margin: '8px 0', fontSize: '12px', color: '#666' }}>
                    No access codes available
                  </p>
                )}
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => handleEditRestroomClick(restroom)}
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      backgroundColor: '#ff9800',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Edit Name
                  </button>
                  <button
                    onClick={() => handleAddAccessCodeClick(restroom)}
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      backgroundColor: '#4285f4',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Add Code
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Search box */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        right: '70px',
        zIndex: 1000,
        maxWidth: '400px'
      }}>
        <SearchBox
          onLocationSelect={handleLocationSelect}
          onSearchResults={handleSearchResults}
          placeholder="Search for places to add restrooms..."
        />
      </div>
      
      {/* Location button */}
      <button
        onClick={findUserLocation}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          backgroundColor: 'white',
          border: '2px solid #ccc',
          borderRadius: '4px',
          padding: '10px',
          fontSize: '18px',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
        title="Find my location"
      >
        📍
      </button>

      {/* Restroom Form Modal */}
      {showRestroomForm && selectedSearchLocation && (
        <RestroomForm
          location={selectedSearchLocation}
          onSubmit={handleRestroomSubmit}
          onCancel={handleRestroomCancel}
          isSubmitting={isSubmittingRestroom}
        />
      )}

      {/* Access Code Form Modal */}
      {showAccessCodeForm && selectedRestroom && (
        <AccessCodeForm
          restroomId={selectedRestroom.id}
          restroomName={selectedRestroom.name}
          onSubmit={handleAccessCodeSubmit}
          onCancel={handleAccessCodeCancel}
          isSubmitting={isSubmittingAccessCode}
        />
      )}

      {/* Edit Restroom Form Modal */}
      {showEditForm && editingRestroom && (
        <EditRestroomForm
          restroom={editingRestroom}
          onSubmit={handleEditSubmit}
          onCancel={handleEditCancel}
          isSubmitting={isSubmittingEdit}
        />
      )}
    </div>
  );
};

export default Map;