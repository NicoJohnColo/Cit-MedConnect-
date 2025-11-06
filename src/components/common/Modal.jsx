// ============================================
// MODAL COMPONENT
// src/components/common/Modal.jsx
// ============================================

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div 
        className={`modal-content modal-${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          {showCloseButton && (
            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          )}
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};