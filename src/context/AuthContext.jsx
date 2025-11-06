// ============================================
// AUTHENTICATION CONTEXT - FIXED VERSION
// ============================================

import React, { 
  createContext, 
  useState, 
  useEffect, 
  useCallback, 
  useMemo,
  useRef 
} from 'react';
import { SampleUsers } from '../types';
import { generateId } from '../types';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionExpiry, setSessionExpiry] = useState(null);
  
  // ============================================
  // REFS
  // ============================================
  
  const isMounted = useRef(true);
  const sessionTimeoutRef = useRef(null);

  // ============================================
  // COMPUTED VALUES
  // ============================================
  
  const isAuthenticated = useMemo(() => {
    return user !== null && user !== undefined;
  }, [user]);
  
  const isStaff = useMemo(() => {
    return user?.role === 'staff';
  }, [user]);
  
  const isStudent = useMemo(() => {
    return user?.role === 'student';
  }, [user]);
  
  const userFullName = useMemo(() => {
    if (!user) return '';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.schoolId;
  }, [user]);
  
  const userInitials = useMemo(() => {
    if (!user) return 'U';
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.schoolId?.substring(0, 2).toUpperCase() || 'U';
  }, [user]);

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  const clearAuthStorage = useCallback(() => {
    localStorage.removeItem('medconnect_user');
    localStorage.removeItem('medconnect_session_expiry');
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
  }, []);
  
  const startSessionTimer = useCallback((expiryDate) => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    
    const timeUntilExpiry = expiryDate.getTime() - Date.now();
    
    if (timeUntilExpiry > 0) {
      sessionTimeoutRef.current = setTimeout(() => {
        if (isMounted.current) {
          clearAuthStorage();
          setUser(null);
          setSessionExpiry(null);
          alert('Your session has expired. Please login again.');
        }
      }, timeUntilExpiry);
    }
  }, [clearAuthStorage]);
  
  const createAuditLog = useCallback(async (action, entityType, entityId, changes = {}) => {
    const logEntry = {
      logId: generateId('LOG'),
      userId: user?.userId || 'SYSTEM',
      action,
      entityType,
      entityId,
      changes,
      timestamp: new Date().toISOString(),
      ipAddress: 'localhost',
      userAgent: navigator.userAgent
    };
    
    try {
      const logs = JSON.parse(localStorage.getItem('medconnect_audit_logs') || '[]');
      logs.push(logEntry);
      localStorage.setItem('medconnect_audit_logs', JSON.stringify(logs));
    } catch (err) {
      console.error('Failed to create audit log:', err);
    }
    
    return logEntry;
  }, [user]);

  // ============================================
  // INITIALIZATION
  // ============================================
  
  useEffect(() => {
    const initAuth = async () => {
      if (!isMounted.current) return;
      
      try {
        const storedUser = localStorage.getItem('medconnect_user');
        const storedExpiry = localStorage.getItem('medconnect_session_expiry');
        
        if (storedUser && storedExpiry) {
          const expiryDate = new Date(storedExpiry);
          
          if (expiryDate > new Date()) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setSessionExpiry(expiryDate);
            startSessionTimer(expiryDate);
          } else {
            clearAuthStorage();
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        clearAuthStorage();
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
    
    return () => {
      isMounted.current = false;
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================
  // AUTO-SAVE USER TO LOCALSTORAGE
  // ============================================
  
  useEffect(() => {
    if (user && sessionExpiry) {
      try {
        localStorage.setItem('medconnect_user', JSON.stringify(user));
        localStorage.setItem('medconnect_session_expiry', sessionExpiry.toISOString());
      } catch (err) {
        console.error('Failed to save auth state:', err);
      }
    }
  }, [user, sessionExpiry]);

  // ============================================
  // LOGIN FUNCTION - FIXED FOR NAVIGATION
  // ============================================
  
  const login = useCallback(async (schoolId, password, rememberMe = false) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Find or create user
      let foundUser = SampleUsers.find(u => u.schoolId === schoolId);
      
      if (!foundUser) {
        const isStaffUser = schoolId.toUpperCase().startsWith('D');
        foundUser = {
          userId: generateId('USR'),
          schoolId,
          role: isStaffUser ? 'staff' : 'student',
          firstName: isStaffUser ? 'Staff' : 'Student',
          lastName: 'User',
          email: `${schoolId.toLowerCase().replace(/-/g, '')}@cit.edu`,
          phone: '+639171234567',
          age: 21,
          gender: 'prefer-not-to-say',
          address: 'Cebu City, Philippines',
          dateOfBirth: '2000-01-01',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      // Set session expiry
      const expiryDuration = rememberMe ? 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;
      const expiry = new Date(Date.now() + expiryDuration);
      
      // Save to localStorage FIRST (synchronously)
      localStorage.setItem('medconnect_user', JSON.stringify(foundUser));
      localStorage.setItem('medconnect_session_expiry', expiry.toISOString());
      
      // Then update state
      if (isMounted.current) {
        setUser(foundUser);
        setSessionExpiry(expiry);
        startSessionTimer(expiry);
        setLoading(false);
      }
      
      // Create audit log (don't wait for it)
      createAuditLog('LOGIN', 'user', foundUser.userId, { schoolId }).catch(console.error);
      
      return { success: true, user: foundUser };
      
    } catch (err) {
      const errorMessage = err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, [createAuditLog, startSessionTimer]);
  
  // ============================================
  // LOGOUT FUNCTION
  // ============================================
  
  const logout = useCallback(async () => {
    try {
      // Store the user ID before clearing auth
      const userId = user?.userId;
      
      // Clear auth state first
      if (isMounted.current) {
        setUser(null);
        setSessionExpiry(null);
        setError(null);
      }
      
      // Clear storage
      clearAuthStorage();
      
      // Create audit log after clearing state to prevent race conditions
      if (userId) {
        try {
          await createAuditLog('LOGOUT', 'user', userId, {});
        } catch (logError) {
          console.error('Error creating audit log:', logError);
        }
      }
      
      // Force a full page reload to reset all application state
      // This ensures all components are properly unmounted and remounted
      window.location.href = '/';
      
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      return { success: false, error: err.message };
    }
  }, [user, createAuditLog, clearAuthStorage]);
  
  // ============================================
  // UPDATE PROFILE FUNCTION
  // ============================================
  
  const updateProfile = useCallback(async (profileData) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedUser = {
        ...user,
        ...profileData,
        updatedAt: new Date().toISOString()
      };
      
      if (isMounted.current) {
        setUser(updatedUser);
      }
      
      await createAuditLog('UPDATE', 'user', user.userId, profileData);
      
      setLoading(false);
      return { success: true, user: updatedUser };
      
    } catch (err) {
      const errorMessage = err.message || 'Failed to update profile';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, [user, createAuditLog]);
  
  // ============================================
  // REGISTER FUNCTION
  // ============================================
  
  const register = useCallback(async (email, password, confirmPassword) => {
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const emailParts = email.split('@')[0].split('.');
    const firstName = emailParts[0] || 'User';
    const lastName = emailParts[1] || 'User';
    const schoolId = `20-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newUser = {
      userId: generateId('USR'),
      schoolId,
      role: 'student',
      firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
      lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
      email,
      phone: '',
      age: 0,
      gender: '',
      address: '',
      dateOfBirth: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await createAuditLog('CREATE', 'user', newUser.userId, { email, schoolId });
    
    return { success: true, user: newUser };
  }, [createAuditLog]);

  // ============================================
  // CONTEXT VALUE
  // ============================================
  
  const contextValue = useMemo(() => ({
    user,
    loading,
    error,
    sessionExpiry,
    isAuthenticated,
    isStaff,
    isStudent,
    userFullName,
    userInitials,
    login,
    logout,
    updateProfile,
    register,
    createAuditLog,
    setError
  }), [
    user,
    loading,
    error,
    sessionExpiry,
    isAuthenticated,
    isStaff,
    isStudent,
    userFullName,
    userInitials,
    login,
    logout,
    updateProfile,
    register,
    createAuditLog
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for easy access to auth context
const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext, useAuth };
export default AuthContext;