// ============================================
// BADGE COMPONENT
// src/components/common/Badge.jsx
// ============================================

import React from 'react';
import './Badge.css';

export const Badge = ({ 
  children, 
  variant = 'default',
  size = 'md',
  className = '' 
}) => {
  return (
    <span className={`badge badge-${variant} badge-${size} ${className}`}>
      {children}
    </span>
  );
};