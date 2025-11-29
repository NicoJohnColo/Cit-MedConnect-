import { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useAuditLog } from '../context/AuditLogContext';

/**
 * Hook for sending notifications (Staff only)
 * Provides functionality to send notifications to students or everyone
 */
export const useNotificationSender = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { sendNotificationToAllStudents, sendNotificationToEveryone } = useNotifications();
  const { logAction } = useAuditLog();

  /**
   * Send notification to specified audience
   * @param {Object} options - Notification options
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {'students'|'everyone'} options.target - Target audience
   * @param {'info'|'success'|'warning'} [options.type='info'] - Notification type
   * @returns {Promise<{success: boolean, error?: string, data?: any}>}
   */
  const sendNotification = async (options) => {
    const { title, message, target, type = 'info' } = options;

    // Validate inputs
    if (!title?.trim()) {
      const error = 'Title is required';
      setError(error);
      return { success: false, error };
    }

    if (!message?.trim()) {
      const error = 'Message is required';
      setError(error);
      return { success: false, error };
    }

    if (!['students', 'everyone'].includes(target)) {
      const error = 'Invalid target audience';
      setError(error);
      return { success: false, error };
    }

    try {
      setLoading(true);
      setError(null);

      let result;
      
      if (target === 'students') {
        result = await sendNotificationToAllStudents(title, message, type);
      } else {
        result = await sendNotificationToEveryone(title, message, type);
      }

      if (result.success) {
        // Log the action for audit purposes
        logAction(
          'Sent Notification',
          `Sent "${title}" to ${target} (Type: ${type})`
        );

        return { success: true, data: result.data };
      } else {
        const errorMessage = result.error || `Failed to send notification to ${target}`;
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      console.error('Error sending notification:', err);
      const errorMessage = err.response?.data?.message || 'An unexpected error occurred while sending the notification';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear any existing error
   */
  const clearError = () => {
    setError(null);
  };

  return {
    sendNotification,
    loading,
    error,
    clearError
  };
};

export default useNotificationSender;
