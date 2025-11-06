import { useState, useCallback } from 'react';

const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  /**
   * Add a new notification
   * @param {Object} options - Notification options
   * @param {string} options.message - The notification message
   * @param {'success'|'error'|'warning'|'info'} [options.type='info'] - Type of notification
   * @param {boolean} [options.autoDismiss=true] - Whether to auto-dismiss the notification
   * @param {number} [options.dismissTime=5000] - Time in ms before auto-dismissal
   * @returns {string} Notification ID for manual dismissal
   */
  const addNotification = useCallback(({ 
    message, 
    type = 'info',
    autoDismiss = true,
    dismissTime = 5000
  }) => {
    const id = Date.now().toString();
    const newNotification = { 
      id, 
      message, 
      type, 
      timestamp: new Date(),
      autoDismiss 
    };
    
    setNotifications(prev => [...prev, newNotification]);

    if (autoDismiss) {
      setTimeout(() => {
        removeNotification(id);
      }, dismissTime);
    }

    return id;
  }, []);

  /**
   * Remove a notification by ID
   * @param {string} id - The ID of the notification to remove
   */
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  /**
   * Update a notification by ID
   * @param {string} id - The ID of the notification to update
   * @param {Object} updates - The updates to apply to the notification
   */
  const updateNotification = useCallback((id, updates) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, ...updates } : notif
      )
    );
  }, []);

  return {
    // State
    notifications,
    
    // Actions
    addNotification,
    removeNotification,
    updateNotification,
    clearAll,
    
    // Convenience methods
    addSuccess: (message, options = {}) => 
      addNotification({ message, type: 'success', ...options }),
      
    addError: (message, options = {}) => 
      addNotification({ message, type: 'error', ...options }),
      
    addWarning: (message, options = {}) => 
      addNotification({ message, type: 'warning', ...options }),
      
    addInfo: (message, options = {}) => 
      addNotification({ message, type: 'info', ...options })
  };
};

export default useNotifications;