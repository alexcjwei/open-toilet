import React, { useState } from 'react';
import { SearchLocation } from '../services/searchService';
import { Modal, Button } from './common';
import { COLORS, SIZES } from '../constants';

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
  isAddingToExisting?: boolean;
}

const RestroomForm: React.FC<RestroomFormProps> = ({
  location,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isAddingToExisting = false
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
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={isAddingToExisting ? 'Add Another Restroom' : 'Add New Restroom'}
    >

      <div style={{
        padding: '12px',
        backgroundColor: '#f8f9fa',
        borderRadius: SIZES.BORDER_RADIUS.LARGE,
        marginBottom: '20px',
        border: `1px solid ${COLORS.BORDERS.DEFAULT}`
      }}>
        <h3 style={{
          margin: '0 0 4px 0',
          fontSize: '14px',
          fontWeight: '500',
          color: COLORS.TEXT.SECONDARY
        }}>
          Location
        </h3>
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: COLORS.TEXT.PRIMARY
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
            color: COLORS.TEXT.PRIMARY
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
              border: `2px solid ${COLORS.BORDERS.DEFAULT}`,
              borderRadius: SIZES.BORDER_RADIUS.MEDIUM,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = COLORS.BORDERS.FOCUS;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = COLORS.BORDERS.DEFAULT;
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
            color: COLORS.TEXT.PRIMARY
          }}>
            Restroom Type *
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { value: 'male', label: 'Male', color: COLORS.RESTROOM_TYPES.male },
              { value: 'female', label: 'Female', color: COLORS.RESTROOM_TYPES.female },
              { value: 'neutral', label: 'Neutral/All', color: COLORS.RESTROOM_TYPES.neutral }
              ].map((option) => (
                <label
                  key={option.value}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 8px',
                    border: `2px solid ${type === option.value ? option.color : COLORS.BORDERS.DEFAULT}`,
                    borderRadius: SIZES.BORDER_RADIUS.MEDIUM,
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: type === option.value ? option.color : COLORS.TEXT.SECONDARY,
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
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!name.trim()}
            isLoading={isSubmitting}
          >
            Add Restroom
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RestroomForm;