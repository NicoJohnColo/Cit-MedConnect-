// ============================================
// NOTIFICATIONS PAGE - WITH STAFF SEND FEATURE
// src/pages/Notifications.jsx
// ============================================

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useNotifications } from '../context/NotificationContext';
import { useAuditLog } from '../context/AuditLogContext';
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Trash2,
  Check,
  X,
  Send,
  Users
} from 'lucide-react';
import { Button, Card, Modal, Alert, Input, Textarea } from '../components/common';
import NotificationBadge from '../components/common/NotificationBadge';
import './Notifications.css';

const Notifications = () => {
  const location = useLocation();
  const { isStaff } = useAuth();
  const { logAction } = useAuditLog();
  const { 
    userNotifications,
    unreadNotifications,
    readNotifications,
    unreadCount, 
    markAsRead, 
    deleteNotification,
    markAllAsRead,
    clearAll,
    loading
  } = useNotifications();
  
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showSendModal, setShowSendModal] = useState(false);
  
  // Send Notification Form
  const [sendForm, setSendForm] = useState({
    target: 'students',
    title: '',
    message: '',
    type: 'info'
  });

  useEffect(() => {
    if (location.state?.openSendModal && isStaff) {
      setShowSendModal(true);
    }
  }, [location.state, isStaff]);

  const getNotificationIcon = useCallback((type) => {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'warning':
        return AlertCircle;
      case 'info':
        return Info;
      default:
        return Bell;
    }
  }, []);

  const getNotificationColor = useCallback((type) => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'warning':
        return '#FFC107';
      case 'info':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  }, []);

  const getTimeAgo = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }, []);

  const handleMarkAsRead = useCallback(async (notificationId) => {
    const result = await markAsRead(notificationId);
    if (result.success) {
      setMessage({ type: 'success', text: 'Marked as read' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    }
  }, [markAsRead]);
  
  const handleDelete = useCallback(async (notificationId) => {
    const result = await deleteNotification(notificationId);
    if (result.success) {
      setMessage({ type: 'success', text: 'Notification deleted' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    }
  }, [deleteNotification]);
  
  const handleMarkAllAsRead = useCallback(async () => {
    const result = await markAllAsRead();
    if (result.success) {
      setMessage({ type: 'success', text: 'All marked as read' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    }
  }, [markAllAsRead]);
  
  const handleClearAll = useCallback(async () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      const result = await clearAll();
      if (result.success) {
        setMessage({ type: 'success', text: 'All notifications cleared' });
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
      }
    }
  }, [clearAll]);

  const handleOpenSendModal = useCallback(() => {
    setShowSendModal(true);
    setSendForm({
      target: 'students',
      title: '',
      message: '',
      type: 'info'
    });
  }, []);

  const handleSendInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setSendForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSendNotification = useCallback(() => {
    if (!sendForm.title.trim() || !sendForm.message.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    logAction(
      'Sent Notification',
      `Sent "${sendForm.title}" to ${sendForm.target} (Type: ${sendForm.type})`
    );

    setMessage({ 
      type: 'success', 
      text: `Notification sent successfully to ${sendForm.target}!` 
    });

    setShowSendModal(false);
    setSendForm({
      target: 'students',
      title: '',
      message: '',
      type: 'info'
    });

    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  }, [sendForm, logAction]);

  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case 'unread':
        return unreadNotifications;
      case 'read':
        return readNotifications;
      default:
        return userNotifications;
    }
  }, [filter, userNotifications, unreadNotifications, readNotifications]);

  return (
    <div className="notifications-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Notifications
            <NotificationBadge count={unreadCount} />
          </h1>
          <p className="page-subtitle">
            {isStaff 
              ? 'Manage and send notifications to students'
              : 'Stay updated with your appointments and medical information'
            }
          </p>
        </div>
        <div className="header-actions">
          {isStaff && (
            <Button 
              variant="primary"
              icon={Send}
              onClick={handleOpenSendModal}
            >
              Send Notification
            </Button>
          )}
          <Button 
            variant="outline"
            icon={Check}
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || loading}
          >
            Mark All Read
          </Button>
          <Button 
            variant="danger"
            icon={Trash2}
            onClick={handleClearAll}
            disabled={userNotifications.length === 0 || loading}
          >
            Clear All
          </Button>
        </div>
      </div>

      {message.text && (
        <Alert 
          type={message.type}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      {/* Filter Tabs */}
      <Card className="notification-filters">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({userNotifications.length})
        </button>
        <button
          className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </button>
        <button
          className={`filter-tab ${filter === 'read' ? 'active' : ''}`}
          onClick={() => setFilter('read')}
        >
          Read ({userNotifications.length - unreadCount})
        </button>
      </Card>

      {/* Notifications List */}
      <div className="notifications-container">
        {filteredNotifications.length > 0 ? (
          <div className="notifications-list">
            {filteredNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const color = getNotificationColor(notification.type);
              
              return (
                <Card 
                  key={notification.notificationId}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                >
                  <div 
                    className="notification-icon"
                    style={{ 
                      backgroundColor: `${color}20`,
                      color: color
                    }}
                  >
                    <Icon size={24} />
                  </div>

                  <div className="notification-content">
                    <div className="notification-header">
                      <h3 className="notification-title">{notification.title}</h3>
                      <span className="notification-time">
                        {getTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                    <p className="notification-message">{notification.message}</p>
                  </div>

                  <div className="notification-actions">
                    {!notification.isRead && (
                      <button
                        className="action-icon-btn"
                        onClick={() => handleMarkAsRead(notification.notificationId)}
                        title="Mark as read"
                      >
                        <Check size={18} />
                      </button>
                    )}
                    <button
                      className="action-icon-btn delete"
                      onClick={() => handleDelete(notification.notificationId)}
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Bell size={64} />
            </div>
            <h3 className="empty-state-title">No notifications</h3>
            <p className="empty-state-description">
              {filter === 'unread' 
                ? "You're all caught up! No unread notifications."
                : filter === 'read'
                ? "No read notifications found."
                : "You don't have any notifications yet."
              }
            </p>
          </div>
        )}
      </div>

      {/* Send Notification Modal (Staff Only) */}
      {isStaff && (
        <Modal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          title="Send Notification"
          size="md"
        >
          {message.text && (
            <Alert type={message.type}>
              {message.text}
            </Alert>
          )}

          <div className="send-notification-form">
            <div className="form-section">
              <h4>Notification Details</h4>
              
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">
                    Target Audience
                    <span className="required">*</span>
                  </label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="target"
                        value="students"
                        checked={sendForm.target === 'students'}
                        onChange={handleSendInputChange}
                      />
                      <Users size={18} />
                      <span>All Students</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="target"
                        value="everyone"
                        checked={sendForm.target === 'everyone'}
                        onChange={handleSendInputChange}
                      />
                      <Bell size={18} />
                      <span>Everyone</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">
                    Notification Type
                    <span className="required">*</span>
                  </label>
                  <select
                    name="type"
                    value={sendForm.type}
                    onChange={handleSendInputChange}
                    className="form-input"
                  >
                    <option value="info">Information</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                  </select>
                </div>
              </div>

              <Input
                label="Title"
                name="title"
                value={sendForm.title}
                onChange={handleSendInputChange}
                placeholder="Enter notification title"
                required
              />

              <Textarea
                label="Message"
                name="message"
                value={sendForm.message}
                onChange={handleSendInputChange}
                placeholder="Enter notification message..."
                rows={5}
                required
              />
            </div>

            <div className="modal-actions">
              <Button 
                variant="secondary"
                onClick={() => setShowSendModal(false)}
                icon={X}
              >
                Cancel
              </Button>
              <Button 
                variant="primary"
                onClick={handleSendNotification}
                icon={Send}
              >
                Send Notification
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Notifications;