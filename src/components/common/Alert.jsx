// ============================================
// ALERT COMPONENT
// src/components/common/Alert.jsx
// ============================================

import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import './Alert.css';

export const Alert = ({ 
  type = 'info', 
  children, 
  icon, 
  onClose,
  className = '' 
}) => {
  const defaultIcons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info
  };

  const Icon = icon || defaultIcons[type];

  return (
    <div className={`alert alert-${type} ${className}`}>
      <div className="alert-content">
        {Icon && (
          <div className="alert-icon">
            <Icon size={20} />
          </div>
        )}
        <div className="alert-message">{children}</div>
      </div>
      {onClose && (
        <button className="alert-close" onClick={onClose}>
          <X size={18} />
        </button>
      )}
    </div>
  );
};