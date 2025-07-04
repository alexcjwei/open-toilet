import React, { useState } from 'react';

interface AccessCodeFormProps {
  restroomId: number;
  restroomName: string;
  onSubmit: (accessCode: {
    restroom_id: number;
    code: string;
  }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const AccessCodeForm: React.FC<AccessCodeFormProps> = ({
  restroomId,
  restroomName,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    onSubmit({
      restroom_id: restroomId,
      code: code.trim()
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
          Add Access Code
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
            Restroom
          </h3>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#333'
          }}>
            {restroomName}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              Access Code *
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., 1234, #ABC123, ask staff..."
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
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
            <p style={{
              margin: '6px 0 0 0',
              fontSize: '12px',
              color: '#666',
              lineHeight: '1.4'
            }}>
              Share the door code, key location, or instructions to help others access this restroom.
            </p>
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
              disabled={!code.trim() || isSubmitting}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: !code.trim() || isSubmitting ? '#ccc' : '#4285f4',
                color: 'white',
                cursor: !code.trim() || isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (code.trim() && !isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#3367d6';
                }
              }}
              onMouseLeave={(e) => {
                if (code.trim() && !isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#4285f4';
                }
              }}
            >
              {isSubmitting ? 'Adding...' : 'Add Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccessCodeForm;