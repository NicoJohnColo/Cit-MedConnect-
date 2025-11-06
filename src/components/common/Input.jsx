// ============================================
// INPUT COMPONENT
// src/components/common/Input.jsx
// ============================================

import React from 'react';
import './Input.css';

export const Input = ({ 
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  helperText,
  icon: Icon,
  className = '',
  ...props
}) => {
  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label className="input-label" htmlFor={name}>
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        {Icon && (
          <div className="input-icon">
            <Icon size={18} />
          </div>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`form-input ${Icon ? 'has-icon' : ''} ${error ? 'input-error' : ''}`}
          {...props}
        />
      </div>
      {error && <span className="input-error-text">{error}</span>}
      {helperText && !error && <span className="input-helper-text">{helperText}</span>}
    </div>
  );
};