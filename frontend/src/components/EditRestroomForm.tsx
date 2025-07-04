import React, { useState } from 'react';

interface EditRestroomFormProps {
  restroom: {
    id: number;
    name: string;
  };
  onSubmit: (restroomId: number, data: { name: string }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const EditRestroomForm: React.FC<EditRestroomFormProps> = ({
  restroom,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const [name, setName] = useState(restroom.name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit(restroom.id, { name: name.trim() });
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
          Edit Restroom Name
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
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
              placeholder="Enter restroom name..."
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
              autoFocus
            />
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
              {isSubmitting ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRestroomForm;