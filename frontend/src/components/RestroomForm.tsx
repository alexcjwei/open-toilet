import React, { useState } from 'react';
import { SearchLocation } from '../services/searchService';

interface RestroomFormProps {
  location: SearchLocation;
  onSubmit: (restroom: {
    name: string;
    type: 'male' | 'female' | 'neutral';
    latitude: number;
    longitude: number;
  }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const RestroomForm: React.FC<RestroomFormProps> = ({
  location,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'male' | 'female' | 'neutral'>('neutral');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      type,
      latitude: location.latitude,
      longitude: location.longitude
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <h2 style={{
          margin: '0 0 16px 0',
          fontSize: '20px',
          fontWeight: '600',
          color: '#333'
        }}>
          Add New Restroom
        </h2>

        <div style={{
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{
            margin: '0 0 4px 0',
            fontSize: '14px',
            fontWeight: '500',
            color: '#666'
          }}>
            Location
          </h3>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#333'
          }}>
            {location.name}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              Restroom Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Floor Restroom, Ground Level..."
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '2px solid #e1e5e9',
                borderRadius: '6px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#4285f4';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e5e9';
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              Restroom Type *
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { value: 'male', label: 'Male', color: '#4285f4' },
                { value: 'female', label: 'Female', color: '#ea4335' },
                { value: 'neutral', label: 'Neutral/All', color: '#34a853' }
              ].map((option) => (
                <label
                  key={option.value}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 8px',
                    border: `2px solid ${type === option.value ? option.color : '#e1e5e9'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: type === option.value ? option.color : '#666',
                    backgroundColor: type === option.value ? `${option.color}10` : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="radio"
                    name="type"
                    value={option.value}
                    checked={type === option.value}
                    onChange={(e) => setType(e.target.value as typeof type)}
                    style={{ display: 'none' }}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '500',
                border: '2px solid #e1e5e9',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#666',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: !name.trim() || isSubmitting ? '#ccc' : '#4caf50',
                color: 'white',
                cursor: !name.trim() || isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (name.trim() && !isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#45a049';
                }
              }}
              onMouseLeave={(e) => {
                if (name.trim() && !isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#4caf50';
                }
              }}
            >
              {isSubmitting ? 'Adding...' : 'Add Restroom'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestroomForm;