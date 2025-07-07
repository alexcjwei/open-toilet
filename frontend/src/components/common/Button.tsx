import React from 'react';
import { COLORS, SIZES } from '../../constants';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'edit' | 'addCode';
  disabled?: boolean;
  isLoading?: boolean;
  style?: React.CSSProperties;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  isLoading = false,
  style = {}
}) => {
  const getButtonStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      padding: '12px 20px',
      fontSize: '14px',
      fontWeight: '500',
      border: 'none',
      borderRadius: SIZES.BORDER_RADIUS.MEDIUM,
      cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
      opacity: disabled || isLoading ? 0.6 : 1,
      transition: 'all 0.2s',
      ...style
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: COLORS.BUTTONS.PRIMARY,
          color: 'white'
        };
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: 'white',
          color: '#666',
          border: `2px solid ${COLORS.BORDERS.DEFAULT}`
        };
      case 'edit':
        return {
          ...baseStyles,
          backgroundColor: COLORS.BUTTONS.EDIT,
          color: 'white'
        };
      case 'addCode':
        return {
          ...baseStyles,
          backgroundColor: COLORS.BUTTONS.ADD_CODE,
          color: 'white'
        };
      default:
        return baseStyles;
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;
    
    const button = e.currentTarget;
    switch (variant) {
      case 'primary':
        button.style.backgroundColor = '#45a049';
        break;
      case 'secondary':
        button.style.backgroundColor = '#f8f9fa';
        break;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;
    
    const button = e.currentTarget;
    switch (variant) {
      case 'primary':
        button.style.backgroundColor = COLORS.BUTTONS.PRIMARY;
        break;
      case 'secondary':
        button.style.backgroundColor = 'white';
        break;
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      style={getButtonStyles()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
};

export default Button;