// ============================================
// LOADING SPINNER COMPONENT
// src/components/common/LoadingSpinner.jsx
// ============================================

import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ fullScreen = false, text = 'Loading...', size = 'md' }) => {
  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <div className={`spinner spinner-${size}`} />
        {text && <p className="loading-text">{text}</p>}
      </div>
    );
  }

  return (
    <div className="loading-inline">
      <div className={`spinner spinner-${size}`} />
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;

// ============================================
// EMPTY STATE COMPONENT
// src/components/common/EmptyState.jsx
// ============================================

export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description,
  action,
  actionLabel 
}) => {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={64} />
        </div>
      )}
      {title && <h3 className="empty-state-title">{title}</h3>}
      {description && <p className="empty-state-description">{description}</p>}
      {action && actionLabel && (
        <button onClick={action} className="empty-state-action">
          {actionLabel}
        </button>
      )}
    </div>
  );
};