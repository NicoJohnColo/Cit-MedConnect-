// ============================================
// PROFILE PAGE - UPDATED WITH NEW HOOKS
// src/pages/Profile.jsx
// ============================================

import React, { useState, useCallback, useMemo, memo, useRef, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { User, Mail, Phone, Edit2, Save, X, CheckCircle, AlertCircle, Camera, Upload, Trash2 } from 'lucide-react';
import { Button, Input, Select, Card, Alert } from '../components/common';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile, userInitials, fetchProfile } = useAuth();
  
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Profile picture state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  
  // ✅ useMemo: Initial form data from user
  const initialFormData = useMemo(() => ({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    age: user?.age || '',
    gender: user?.gender || ''
  }), [user]);

  const [formData, setFormData] = useState(initialFormData);

  // ============================================
  // PROFILE DATA FETCHING
  // ============================================
  
  // ✅ useEffect: Fetch complete profile data on component mount
  useEffect(() => {
    const loadProfileData = async () => {
      if (user?.email && !isEditing) {
        try {
          await fetchProfile();
        } catch (error) {
          console.error('Failed to fetch profile data:', error);
          setMessage({ type: 'error', text: 'Failed to load profile data' });
          setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
      }
    };

    loadProfileData();
  }, [user?.email, fetchProfile, isEditing]);

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

  // ✅ useCallback: Handle image selection
  const handleImageSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file' });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
      return;
    }
    
    setSelectedImage(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    setMessage({ type: '', text: '' });
  }, []);

  // ✅ useCallback: Handle image upload
  const handleImageUpload = useCallback(async () => {
    if (!selectedImage) return;
    
    setUploadingImage(true);
    setMessage({ type: '', text: '' });
    
    try {
      const result = await updateProfile({ profilePicture: selectedImage });
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
        // Clear the selected image and preview after successful upload
        // The avatar will now show user.profilePicture from the updated user object
        setSelectedImage(null);
        setImagePreview(null);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to upload profile picture' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while uploading. Please try again.' });
    } finally {
      setUploadingImage(false);
    }
  }, [selectedImage, updateProfile]);

  // ✅ useCallback: Remove selected image
  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

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
              {imagePreview || user?.profilePicture ? (
                <img 
                  src={imagePreview || user?.profilePicture} 
                  alt="Profile" 
                  className="profile-avatar-image"
                />
              ) : (
                userInitials
              )}
              
              {/* Upload Image Button Overlay */}
              <button 
                className="avatar-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                title="Change profile picture"
              >
                <Camera size={20} />
              </button>
              
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
            </div>
            
            {/* Upload/Remove Buttons */}
            {selectedImage && (
              <div className="avatar-actions">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Upload}
                  onClick={handleImageUpload}
                  loading={uploadingImage}
                  disabled={uploadingImage}
                >
                  Upload Picture
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Trash2}
                  onClick={handleRemoveImage}
                  disabled={uploadingImage}
                >
                  Cancel
                </Button>
              </div>
            )}
            
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
                <p>{user?.email || 'No email set'}</p>
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
              {/* First Name - Non-editable */}
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={true}
                placeholder="First Name"
                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
              />

              {/* Last Name - Non-editable */}
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={true}
                placeholder="Last Name"
                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
              />

              {/* Email - Non-editable */}
              <Input
                label="Email"
                name="email"
                type="email"
                value={user?.email || ''}
                disabled={true}
                placeholder="email@example.com"
                icon={Mail}
                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
              />

              {/* Phone */}
              <Input
                label="Phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="+69424124412"
                icon={Phone}
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
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default memo(Profile);