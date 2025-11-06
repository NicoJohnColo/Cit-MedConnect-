// ============================================
// TEXTAREA COMPONENT
// src/components/common/Textarea.jsx
// ============================================

export const Textarea = ({ 
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 4,
  required = false,
  disabled = false,
  error,
  helperText,
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
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
        className={`form-input ${error ? 'input-error' : ''}`}
        {...props}
      />
      {error && <span className="input-error-text">{error}</span>}
      {helperText && !error && <span className="input-helper-text">{helperText}</span>}
    </div>
  );
};