// ============================================
// CUSTOM HOOK - useAuth (Enhanced)
// src/hooks/useAuth.js
// ============================================

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * CUSTOM HOOK - useAuth
 * Provides access to authentication context with role detection
 * @returns {Object} Auth context with user, loading, auth methods, and role helpers
 * @throws {Error} If used outside of AuthProvider
 */
const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  const { user } = context;
  
  // Role detection helpers
  const isStaff = user?.role === 'staff' || user?.role === 'admin';
  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';
  
  // Get user's full name
  const userFullName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.username || 'User';
  
  return {
    ...context,
    isStaff,
    isStudent,
    isAdmin,
    userFullName
  };
};

export default useAuth;