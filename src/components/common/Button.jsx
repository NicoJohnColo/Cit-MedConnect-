// ============================================
// BUTTON COMPONENT
// src/components/common/Button.jsx
// ============================================

import React from 'react';
import './Button.css';

export const Button = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="btn-spinner" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} className="btn-icon btn-icon-left" />
          )}
          <span className="btn-text">{children}</span>
          {Icon && iconPosition === 'right' && (
            <Icon size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} className="btn-icon btn-icon-right" />
          )}
        </>
      )}
    </button>
  );
};