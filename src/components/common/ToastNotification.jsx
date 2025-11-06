// ============================================
// TOAST NOTIFICATION COMPONENT
// Modern toast notifications with animations
// ============================================

import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import './ToastNotification.css';

/**
 * Toast Container Component
 * Renders all active toast notifications
 */
const ToastContainer = () => {
  const { toasts, dismissToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <Toast 
          key={toast.id} 
          toast={toast} 
          onDismiss={() => dismissToast(toast.id)} 
        />
      ))}
    </div>
  );
};


const Toast = ({ toast, onDismiss }) => {
  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  return (
    <div 
      className={`toast toast-${toast.type}`}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-icon">
        {getToastIcon(toast.type)}
      </div>
      
      <div className="toast-message">
        {toast.message}
      </div>
      
      <button 
        className="toast-close"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default ToastContainer;