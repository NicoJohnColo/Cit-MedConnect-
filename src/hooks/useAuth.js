// ============================================
// CUSTOM HOOK - useAuth (Enhanced with Role Verification)
// src/hooks/useAuth.js
// ============================================

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import useVerifiedRole from './useVerifiedRole';

/**
 * CUSTOM HOOK - useAuth
 * Provides access to authentication context with VERIFIED role detection
 * 
 * SECURITY: Now uses backend-verified roles instead of trusting localStorage
 * 
 * @returns {Object} Auth context with user, loading, auth methods, and VERIFIED role helpers
 * @throws {Error} If used outside of AuthProvider
 */
const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  const { user } = context;
  

  const { 
    verifiedRole, 
    isStaff: verifiedIsStaff, 
    isStudent: verifiedIsStudent,
    isVerifying,
    error: roleError
  } = useVerifiedRole();
  
  
  const isStaff = verifiedIsStaff;    
  const isStudent = verifiedIsStudent;   
  
 
  const userFullName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.username || user?.email?.split('@')[0] || 'User';
  
  return {
    ...context,
    
    isStaff,          
    isStudent,                 
    verifiedRole,     
    isVerifying,     
    roleError,        
    userFullName
  };
};

export default useAuth;