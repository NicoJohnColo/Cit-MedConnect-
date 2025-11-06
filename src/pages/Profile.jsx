// ============================================
// PROFILE PAGE - UPDATED WITH NEW HOOKS
// src/pages/Profile.jsx
// ============================================

import React, { useState, useCallback, useMemo, memo } from 'react';
import useAuth from '../hooks/useAuth';
import { User, Mail, Phone, Calendar, MapPin, Edit2, Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Input, Select, Card, Alert } from '../components/common';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile, userFullName, userInitials } = useAuth();
  
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // ✅ useMemo: Initial form data from user
  const initialFormData = useMemo(() => ({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    age: user?.age || '',
    gender: user?.gender || '',
    address: user?.address || '',
    dateOfBirth: user?.dateOfBirth || ''
  }), [user]);

  const [formData, setFormData] = useState(initialFormData);

  // ============================================
  // EVENT HANDLERS
  // ============================================
  
  // ✅ useCallback: Memoized input change handler
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // ✅ useCallback: Memoized submit handler
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await updateProfile(formData);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, [formData, updateProfile]);

  // ✅ useCallback: Memoized cancel handler
  const handleCancel = useCallback(() => {
    setFormData(initialFormData);
    setIsEditing(false);
    setMessage({ type: '', text: '' });
  }, [initialFormData]);

  // ============================================
  // COMPUTED VALUES
  // ============================================
  
  // ✅ useMemo: Display full name
  const displayName = useMemo(() => {
    return formData.firstName && formData.lastName 
      ? `${formData.firstName} ${formData.lastName}`
      : user?.schoolId || 'User';
  }, [formData.firstName, formData.lastName, user?.schoolId]);

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your personal information</p>
        </div>
      </div>

      {/* Alert Messages */}
      {message.text && (
        <Alert 
          type={message.type}
          icon={message.type === 'success' ? CheckCircle : AlertCircle}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      <div className="profile-content">
        {/* Profile Card - Sidebar */}
        <Card className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar-large">
              {userInitials}
            </div>
            <div className="profile-avatar-info">
              <h2>{displayName}</h2>
              <p className="profile-role">{user?.role || 'Student'}</p>
              <p className="profile-id">ID: {user?.schoolId}</p>
            </div>
          </div>

          {/* Email Section */}
          <div className="email-reminder">
            <div className="reminder-header">
              <div className="reminder-icon">
                <Mail size={20} />
              </div>
              <div className="reminder-content">
                <h4>Email Address</h4>
                <p>{formData.email || 'No email set'}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Profile Information Card */}
        <Card className="profile-info-card">
          <div className="card-header">
            <h3 className="card-title">
              <User size={20} />
              Personal Information
            </h3>
            {!isEditing ? (
              <Button
                variant="primary"
                icon={Edit2}
                onClick={() => setIsEditing(true)}
              >
                Update Details
              </Button>
            ) : (
              <div className="form-actions-inline">
                <Button 
                  variant="secondary"
                  icon={X}
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary"
                  icon={Save}
                  onClick={handleSubmit}
                  loading={loading}
                >
                  Save Changes
                </Button>
              </div>
            )}
          </div>

          <form id="profile-form" onSubmit={handleSubmit} className="profile-form">
            <div className="form-grid">
              {/* First Name */}
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="First Name"
              />

              {/* Last Name */}
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Last Name"
              />

              {/* Email */}
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="email@example.com"
                icon={Mail}
              />

              {/* Phone */}
              <Input
                label="Phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="+1 (555) 123-4567"
                icon={Phone}
              />

              {/* Date of Birth */}
              <Input
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                disabled={!isEditing}
                icon={Calendar}
              />

              {/* Age */}
              <Input
                label="Age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Age"
                min="1"
                max="120"
              />

              {/* Gender */}
              <Select
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                disabled={!isEditing}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                  { value: 'prefer-not-to-say', label: 'Prefer not to say' }
                ]}
                placeholder="Select Gender"
              />

              {/* Address - Full Width */}
              <div className="form-group full-width">
                <label className="form-label">
                  <MapPin size={16} />
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="form-input"
                  disabled={!isEditing}
                  placeholder="Enter complete address"
                  rows="3"
                />
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default memo(Profile);