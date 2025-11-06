// ============================================
// ENHANCED NOTIFICATION CONTEXT
// With Toast Notifications & Student-Only Reception
// ============================================

import React, { 
  createContext, 
  useState, 
  useEffect, 
  useCallback, 
  useMemo,
  useRef,
  useContext
} from 'react';
import { useAuth } from './AuthContext';
import { NOTIFICATION_TYPES, generateId } from '../types';

const NotificationContext = createContext(null);

/**
 * NOTIFICATION PROVIDER
 * Handles notification creation, display, and management
 * Rule: Only Staff can send, Students receive
 */
export const NotificationProvider = ({ children }) => {
  const { user, createAuditLog } = useAuth();
  const isMounted = useRef(true);

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]); // For temporary toast notifications
  const [loading, setLoading] = useState(false);

  // ============================================
  // INITIALIZE & EVENT LISTENERS
  // ============================================
  
  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem('medconnect_notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
      } catch (err) {
        console.error('Failed to parse notifications:', err);
      }
    }
    
    // Listen for appointment events
    const handleAppointmentBooked = (event) => {
      const appointment = event.detail;
      
      // Only create notification for students
      if (user?.role === 'student') {
        addNotification({
          type: NOTIFICATION_TYPES.SUCCESS,
          title: 'Appointment Confirmed',
          message: `Your appointment has been confirmed for ${new Date(appointment.scheduledDate).toLocaleDateString()} at ${appointment.scheduledTime}`,
          relatedEntity: appointment.appointmentId
        });
        
        // Show toast notification
        showToast({
          type: 'success',
          message: 'Appointment booked successfully!'
        });
      }
    };
    
    const handleAppointmentCancelled = (event) => {
      const appointment = event.detail;
      
      // Only create notification for students
      if (user?.role === 'student') {
        addNotification({
          type: NOTIFICATION_TYPES.WARNING,
          title: 'Appointment Cancelled',
          message: `Your appointment for ${new Date(appointment.scheduledDate).toLocaleDateString()} has been cancelled`,
          relatedEntity: appointment.appointmentId
        });
        
        // Show toast notification
        showToast({
          type: 'warning',
          message: 'Appointment cancelled'
        });
      }
    };
    
    window.addEventListener('appointmentBooked', handleAppointmentBooked);
    window.addEventListener('appointmentCancelled', handleAppointmentCancelled);
    
    return () => {
      isMounted.current = false;
      window.removeEventListener('appointmentBooked', handleAppointmentBooked);
      window.removeEventListener('appointmentCancelled', handleAppointmentCancelled);
    };
  }, [user]);
  
  // Auto-save to localStorage
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('medconnect_notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // ============================================
  // COMPUTED VALUES
  // ============================================
  
  const userNotifications = useMemo(() => {
    if (!user) return [];
    
    // Students see their own notifications + broadcasts
    if (user.role === 'student') {
      return notifications.filter(n => 
        n.userId === user.userId || n.userId === 'all'
      );
    }
    
    // Staff see all notifications (for management purposes)
    return notifications;
  }, [notifications, user]);
  
  const unreadCount = useMemo(() => {
    return userNotifications.filter(n => !n.isRead).length;
  }, [userNotifications]);
  
  const unreadNotifications = useMemo(() => {
    return userNotifications.filter(n => !n.isRead);
  }, [userNotifications]);
  
  const readNotifications = useMemo(() => {
    return userNotifications.filter(n => n.isRead);
  }, [userNotifications]);

  // ============================================
  // TOAST NOTIFICATIONS
  // ============================================
  
  /**
   * Show temporary toast notification
   */
  const showToast = useCallback((toastData) => {
    const toast = {
      id: generateId('TOAST'),
      type: toastData.type || 'info',
      message: toastData.message,
      duration: toastData.duration || 4000,
      createdAt: Date.now()
    };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto-remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, toast.duration);
    
    return toast.id;
  }, []);
  
  /**
   * Manually dismiss toast
   */
  const dismissToast = useCallback((toastId) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  }, []);

  // ============================================
  // NOTIFICATION OPERATIONS
  // ============================================
  
  /**
   * ADD NOTIFICATION
   * Creates a new notification for user(s)
   * Only students receive notifications
   */
  const addNotification = useCallback(async (notificationData) => {
    try {
      // Determine recipient
      let recipientId = notificationData.userId || 'all';
      
      // If current user is staff and no specific recipient, broadcast to all students
      if (user?.role === 'staff' && !notificationData.userId) {
        recipientId = 'all';
      }
      
      // If current user is student, notification is for them
      if (user?.role === 'student') {
        recipientId = user.userId;
      }
      
      const newNotification = {
        notificationId: generateId('NOT'),
        userId: recipientId,
        type: notificationData.type || NOTIFICATION_TYPES.INFO,
        title: notificationData.title,
        message: notificationData.message,
        isRead: false,
        relatedEntity: notificationData.relatedEntity || '',
        createdAt: new Date().toISOString(),
        sentBy: user?.userId || 'SYSTEM'
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      
      // Create audit log
      if (user) {
        await createAuditLog('CREATE', 'notification', newNotification.notificationId, notificationData);
      }
      
      return { success: true, data: newNotification };
    } catch (err) {
      console.error('Failed to add notification:', err);
      return { success: false, error: err.message };
    }
  }, [user, createAuditLog]);
  
  /**
   * MARK AS READ
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      setNotifications(prev => prev.map(n =>
        n.notificationId === notificationId
          ? { ...n, isRead: true }
          : n
      ));
      
      if (user) {
        await createAuditLog('UPDATE', 'notification', notificationId, { isRead: true });
      }
      
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [user, createAuditLog]);
  
  /**
   * MARK ALL AS READ
   */
  const markAllAsRead = useCallback(async () => {
    try {
      setNotifications(prev => prev.map(n =>
        (n.userId === user?.userId || n.userId === 'all')
          ? { ...n, isRead: true }
          : n
      ));
      
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [user]);
  
  /**
   * DELETE NOTIFICATION
   */
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      setNotifications(prev => prev.filter(n => n.notificationId !== notificationId));
      
      if (user) {
        await createAuditLog('DELETE', 'notification', notificationId, {});
      }
      
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [user, createAuditLog]);
  
  /**
   * CLEAR ALL NOTIFICATIONS
   */
  const clearAll = useCallback(async () => {
    try {
      setNotifications(prev => prev.filter(n => 
        n.userId !== user?.userId && n.userId !== 'all'
      ));
      
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [user]);
  
  /**
   * BROADCAST NOTIFICATION (Staff Only)
   * Flow: Staff Dashboard → Send Notifications → Broadcast to Students
   */
  const broadcastNotification = useCallback(async (notificationData) => {
    setLoading(true);
    try {
      // Only staff can broadcast
      if (user?.role !== 'staff') {
        throw new Error('Unauthorized: Only staff can send notifications');
      }
      
      const broadcast = {
        notificationId: generateId('NOT'),
        userId: 'all', // Broadcast to all students
        type: notificationData.type || NOTIFICATION_TYPES.INFO,
        title: notificationData.title,
        message: notificationData.message,
        isRead: false,
        relatedEntity: notificationData.relatedEntity || '',
        createdAt: new Date().toISOString(),
        sentBy: user.userId
      };
      
      setNotifications(prev => [broadcast, ...prev]);
      
      // Create audit log
      await createAuditLog('CREATE', 'notification', broadcast.notificationId, {
        ...notificationData,
        broadcast: true,
        sentBy: user.userId
      });
      
      // Show success toast
      showToast({
        type: 'success',
        message: 'Notification sent to all students'
      });
      
      setLoading(false);
      return { success: true, data: broadcast };
    } catch (err) {
      showToast({
        type: 'error',
        message: err.message || 'Failed to send notification'
      });
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [user, createAuditLog, showToast]);

  // ============================================
  // CONTEXT VALUE
  // ============================================
  
  const contextValue = useMemo(() => ({
    notifications,
    userNotifications,
    unreadNotifications,
    readNotifications,
    unreadCount,
    toasts,
    loading,
    
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    broadcastNotification,
    showToast,
    dismissToast
  }), [
    notifications,
    userNotifications,
    unreadNotifications,
    readNotifications,
    unreadCount,
    toasts,
    loading,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    broadcastNotification,
    showToast,
    dismissToast
  ]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * CUSTOM HOOK
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export default NotificationContext;