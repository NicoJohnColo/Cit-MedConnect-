import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import axios from 'axios';
import useAuth from '../hooks/useAuth';

// Action types
const NOTIFICATION_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  UPDATE_NOTIFICATION: 'UPDATE_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Initial state
const initialState = {
  userNotifications: [],
  loading: false,
  error: null,
  unreadCount: 0
};

// Reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case NOTIFICATION_ACTIONS.SET_NOTIFICATIONS:
      return { 
        ...state, 
        userNotifications: action.payload,
        unreadCount: action.payload.filter(n => !n.isRead).length
      };
    
    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        userNotifications: [action.payload, ...state.userNotifications],
        unreadCount: action.payload.isRead ? state.unreadCount : state.unreadCount + 1
      };
    
    case NOTIFICATION_ACTIONS.UPDATE_NOTIFICATION:
      const updatedNotifications = state.userNotifications.map(notification => {
        if (notification.notificationId === action.payload.notificationId) {
          // Merge the existing notification with the updated data
          const updatedNotification = { ...notification, ...action.payload };
          console.log('Updating notification:', {
            original: notification,
            update: action.payload,
            result: updatedNotification
          });
          return updatedNotification;
        }
        return notification;
      });
      const updatedUnreadCount = updatedNotifications.filter(n => !n.isRead).length;
      console.log('Updated notifications count:', {
        total: updatedNotifications.length,
        unread: updatedUnreadCount,
        read: updatedNotifications.length - updatedUnreadCount
      });
      return {
        ...state,
        userNotifications: updatedNotifications,
        unreadCount: updatedUnreadCount
      };
    
    case NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION:
      const filteredNotifications = state.userNotifications.filter(
        notification => notification.notificationId !== action.payload
      );
      const removedUnreadCount = filteredNotifications.filter(n => !n.isRead).length;
      return {
        ...state,
        userNotifications: filteredNotifications,
        unreadCount: removedUnreadCount
      };
    
    case NOTIFICATION_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case NOTIFICATION_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    
    default:
      return state;
  }
};

// Context
const NotificationContext = createContext();

// Provider component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user } = useAuth();
  const schoolId = user?.schoolId;
  const userRole = user?.role;

  // API base URL
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

  // Set loading state
  const setLoading = (loading) => {
    dispatch({ type: NOTIFICATION_ACTIONS.SET_LOADING, payload: loading });
  };

  // Set error state
  const setError = (error) => {
    dispatch({ type: NOTIFICATION_ACTIONS.SET_ERROR, payload: error });
  };

  // Clear error state
  const clearError = () => {
    dispatch({ type: NOTIFICATION_ACTIONS.CLEAR_ERROR });
  };

  // Fetch user notifications
  const fetchUserNotifications = useCallback(async () => {
    console.log('fetchUserNotifications called:', { schoolId, userRole });
    
    if (!schoolId || !userRole) {
      console.log('Missing required data:', { schoolId, userRole });
      return;
    }

    try {
      setLoading(true);
      clearError();
      
      console.log('Fetching notifications from:', `${API_URL}/notifications/user/${schoolId}/role/${userRole}`);
      
      // Prepare headers
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add Authorization header only if token exists
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('Using token authentication');
      } else {
        console.log('No token found, proceeding without authentication');
      }
      
      const response = await axios.get(
        `${API_URL}/notifications/user/${schoolId}/role/${userRole}`,
        { headers }
      );

      console.log('Notifications response:', response.data);

      if (response.data) {
        dispatch({ 
          type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS, 
          payload: response.data 
        });
        console.log('Notifications fetched successfully:', response.data.length, 'notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error.response?.data?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [schoolId, userRole, API_URL, setLoading, clearError, dispatch, setError]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      clearError();
      
      // Prepare headers
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add Authorization header only if token exists
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Call backend to mark as read
      const response = await axios.put(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        { headers }
      );

      console.log('Mark as read response:', response.data);

      // Update local state with backend response or fallback
      const updatedNotification = response.data || { notificationId, isRead: true };
      
      dispatch({
        type: NOTIFICATION_ACTIONS.UPDATE_NOTIFICATION,
        payload: updatedNotification
      });

      console.log('Notification marked as read successfully');
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Fallback to local update if backend fails
      dispatch({
        type: NOTIFICATION_ACTIONS.UPDATE_NOTIFICATION,
        payload: { notificationId, isRead: true }
      });
      console.log('Fallback: Updated notification locally');
      return { success: true };
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      clearError();
      
      // Prepare headers
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add Authorization header only if token exists
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      await axios.delete(
        `${API_URL}/notifications/${notificationId}`,
        { headers }
      );

      dispatch({
        type: NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION,
        payload: notificationId
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError(error.response?.data?.message || 'Failed to delete notification');
      return { success: false, error: error.response?.data?.message };
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      clearError();
      
      // Update all notifications locally
      const updatedNotifications = state.userNotifications.map(notification => ({
        ...notification,
        isRead: true
      }));

      dispatch({
        type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS,
        payload: updatedNotifications
      });

      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      setError(error.response?.data?.message || 'Failed to mark all notifications as read');
      return { success: false, error: error.response?.data?.message };
    }
  };

  // Clear all notifications
  const clearAll = async () => {
    try {
      clearError();
      
      // Delete all notifications one by one (or implement bulk delete in backend)
      const deletePromises = state.userNotifications.map(notification => {
        // Prepare headers
        const headers = {
          'Content-Type': 'application/json'
        };
        
        // Add Authorization header only if token exists
        const token = localStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        return axios.delete(
          `${API_URL}/notifications/${notification.notificationId}`,
          { headers }
        );
      });

      await Promise.all(deletePromises);

      dispatch({
        type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS,
        payload: []
      });

      return { success: true };
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      setError(error.response?.data?.message || 'Failed to clear all notifications');
      return { success: false, error: error.response?.data?.message };
    }
  };

  // Send notification to all students (Staff only)
  const sendNotificationToAllStudents = async (title, message, type = 'info') => {
    try {
      clearError();
      
      // Prepare headers
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add Authorization header only if token exists
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await axios.post(
        `${API_URL}/notifications/broadcast/students`,
        { title, message },
        { headers }
      );

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error sending notification to students:', error);
      setError(error.response?.data?.message || 'Failed to send notification to students');
      return { success: false, error: error.response?.data?.message };
    }
  };

  // Send notification to everyone (Staff only)
  const sendNotificationToEveryone = async (title, message, type = 'info') => {
    try {
      clearError();
      
      // Prepare headers
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add Authorization header only if token exists
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await axios.post(
        `${API_URL}/notifications/broadcast/all`,
        { title, message },
        { headers }
      );

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error sending notification to everyone:', error);
      setError(error.response?.data?.message || 'Failed to send notification to everyone');
      return { success: false, error: error.response?.data?.message };
    }
  };

  // Fetch notifications when user changes
  useEffect(() => {
    if (schoolId && userRole) {
      fetchUserNotifications();
    }
  }, [schoolId, userRole, fetchUserNotifications]);

  // Computed values
  const unreadNotifications = state.userNotifications.filter(n => !n.isRead);
  const readNotifications = state.userNotifications.filter(n => n.isRead);

  const value = {
    // State
    userNotifications: state.userNotifications,
    unreadNotifications,
    readNotifications,
    unreadCount: state.unreadCount,
    loading: state.loading,
    error: state.error,
    
    // Actions
    fetchUserNotifications,
    markAsRead,
    deleteNotification,
    markAllAsRead,
    clearAll,
    sendNotificationToAllStudents,
    sendNotificationToEveryone,
    clearError
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;