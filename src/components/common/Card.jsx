// ============================================
// CARD COMPONENT
// src/components/common/Card.jsx
// ============================================

import React from 'react';
import './Card.css';

export const Card = ({ 
  children, 
  className = '',
  hover = false,
  padding = true,
  onClick
}) => {
  return (
    <div 
      className={`card ${hover ? 'card-hover' : ''} ${!padding ? 'card-no-padding' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};