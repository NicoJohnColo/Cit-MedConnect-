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
import { generateId } from '../types';
import { userService } from '../services/userService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  const [user, setUser] = useState(null);
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
    return user !== null && user !== undefined && user.isAuthenticated === true;
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
      }
    };
    
    initAuth();
    
    return () => {
      isMounted.current = false;
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, [clearAuthStorage, startSessionTimer]);

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
  
  const login = useCallback(async (identifier, password, rememberMe = false) => {
    setError(null);
    
    try {
      let email;
      let schoolId;
      
      // Check if identifier is an email (contains @) or school ID
      if (identifier.includes('@')) {
        // Direct email login (e.g., "nicojohn.color@cit.edu")
        email = identifier;
        schoolId = email.split('@')[0].replace(/[.-]/g, '').replace(/(\d{2})(\d{4})/, '$1-$2');
      } else {
        // School ID login (e.g., "20-4012")
        schoolId = identifier;
        email = `${schoolId.toLowerCase().replace(/-/g, '')}@cit.edu`;
      }
      
      // Try to login with proper password verification
      const loginResult = await userService.login(email, password);
      
      if (loginResult.success && loginResult.data) {
        // Login successful - user authenticated with correct password
        const foundUser = loginResult.data;
        
        // Set session expiry
        const expiryDuration = rememberMe ? 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;
        const expiry = new Date(Date.now() + expiryDuration);
        
        // Create the user object with all required fields
        const userToSave = {
          ...foundUser,
          isAuthenticated: true
        };
        
        // Save to localStorage
        localStorage.setItem('medconnect_user', JSON.stringify(userToSave));
        localStorage.setItem('medconnect_session_expiry', expiry.toISOString());
        
        // Update state
        if (isMounted.current) {
          setUser(userToSave);
          setSessionExpiry(expiry);
          startSessionTimer(expiry);
        }
        
        // Create audit log
        createAuditLog('LOGIN', 'user', foundUser.userId, { schoolId }).catch(console.error);
        
        return { success: true, user: userToSave };
      } else {
        // User doesn't exist - don't auto-create, require registration
        throw new Error('User not found. Please register first or check your credentials.');
      }
      
    } catch (err) {
      const errorMessage = err.message || 'Login failed. Please check your credentials and try again.';
      setError(errorMessage);
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
  // STAFF LOGIN FUNCTION
  // ============================================

  const staffLogin = useCallback(async (identifier, password, rememberMe = false) => {
    setError(null);
    
    try {
      let email;
      let schoolId;
      
      // Check if identifier is an email (contains @) or school ID
      if (identifier.includes('@')) {
        email = identifier;
        schoolId = email.split('@')[0].replace(/[.-]/g, '').replace(/(\d{2})(\d{4})/, '$1-$2');
      } else {
        schoolId = identifier;
        email = `${schoolId.toLowerCase().replace(/-/g, '')}@cit.edu`;
      }
      
      // Use staff login endpoint
      const response = await fetch('http://localhost:8080/api/users/staff/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.user) {
        const staffUser = data.user;
        
        // Set session expiry
        const expiryDuration = rememberMe ? 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;
        const expiry = new Date(Date.now() + expiryDuration);
        
        // Create the staff user object with staff role
        const userToSave = {
          ...staffUser,
          isAuthenticated: true,
          role: 'staff',
          adminName: data.adminName,
          permissions: data.permissions
        };
        
        // Save to localStorage
        localStorage.setItem('medconnect_user', JSON.stringify(userToSave));
        localStorage.setItem('medconnect_session_expiry', expiry.toISOString());
        
        // Update state
        if (isMounted.current) {
          setUser(userToSave);
          setSessionExpiry(expiry);
          startSessionTimer(expiry);
        }
        
        // Create audit log
        createAuditLog('STAFF_LOGIN', 'user', staffUser.userId, { schoolId, role: 'admin' }).catch(console.error);
        
        return { success: true, user: userToSave, adminData: data };
      } else {
        throw new Error(data.error || 'Staff login failed');
      }
      
    } catch (err) {
      const errorMessage = err.message || 'Staff login failed. Please check your credentials and try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [createAuditLog, startSessionTimer]);

  // ============================================
  // FETCH PROFILE FUNCTION
  // ============================================

  const fetchProfile = useCallback(async () => {
    setError(null);
    
    try {
      if (!user?.email) {
        throw new Error('User email not found');
      }
      
      // Get complete profile data from backend
      const profileResult = await userService.getUserProfile(user.email);
      
      if (!profileResult.success) {
        throw new Error(profileResult.error || 'Failed to fetch profile');
      }
      
      // Update user object with complete profile data
      const updatedUser = {
        ...user,
        ...profileResult.data,
        isAuthenticated: true
      };
      
      // Save to localStorage immediately BEFORE state update
      localStorage.setItem('medconnect_user', JSON.stringify(updatedUser));
      
      // Update state to trigger re-render across all components
      if (isMounted.current) {
        setUser(updatedUser);
      }
      
      return { success: true, user: updatedUser };
      
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch profile';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [user]);

  // ============================================
  // UPDATE PROFILE FUNCTION
  // ============================================

  const updateProfile = useCallback(async (profileData) => {
    setError(null);
    
    try {
      if (!user?.email) {
        throw new Error('User email not found');
      }
      
      // Handle profile picture upload separately (not supported by backend profile endpoint)
      let profilePictureUrl = user?.profilePicture;
      
      if (profileData.profilePicture instanceof File) {
        // In a real app, this would upload to a server/cloud storage
        // For now, we'll use a local data URL
        const reader = new FileReader();
        profilePictureUrl = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(profileData.profilePicture);
        });
        
        // Remove the file object from profileData before saving
        const { profilePicture, ...restData } = profileData;
        profileData = restData;
      }
      
      // Only send updatable fields to backend (age, phone, gender)
      const updatableFields = {};
      if (profileData.age !== undefined && profileData.age !== '') {
        updatableFields.age = parseInt(profileData.age, 10);
      }
      if (profileData.phone !== undefined) {
        updatableFields.phone = profileData.phone;
      }
      if (profileData.gender !== undefined) {
        updatableFields.gender = profileData.gender;
      }
      
      // Update user profile using the new profile endpoint
      const updateResult = await userService.updateUserProfile(user.email, updatableFields);
      
      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update profile in backend');
      }
      
      // Get updated profile data from backend response
      const backendUserData = updateResult.data.user;
      
      // Create updated user object combining backend data with local state
      const updatedUser = {
        ...user,
        ...backendUserData,
        profilePicture: profilePictureUrl,
        isAuthenticated: true
      };
      
      // Save to localStorage immediately BEFORE state update
      localStorage.setItem('medconnect_user', JSON.stringify(updatedUser));
      
      // Update state to trigger re-render across all components
      if (isMounted.current) {
        setUser(updatedUser);
      }
      
      await createAuditLog('UPDATE', 'user', user.userId, updatableFields);
      
      return { success: true, user: updatedUser };
      
    } catch (err) {
      const errorMessage = err.message || 'Failed to update profile';
      setError(errorMessage);
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
    
    try {
      // Check if email already exists
      const emailCheckResult = await userService.checkEmailExists(email);
      if (emailCheckResult.success && emailCheckResult.data === true) {
        throw new Error('Email already registered');
      }
      
      // Create new user in backend
      const emailParts = email.split('@')[0].split('.');
      const firstName = emailParts[0] || 'User';
      const lastName = emailParts[1] || 'User';
      const schoolId = `20-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const newUser = {
        userId: schoolId, // Use schoolId as userId directly
        schoolId,
        email,
        role: 'student',
        firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
        lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
        phone: '',
        age: 0,
        gender: '',
        address: '',
        dateOfBirth: '',
        password: password // Use the provided password
      };
      
      const createResult = await userService.createUser(newUser);
      
      if (!createResult.success) {
        throw new Error(createResult.error || 'Failed to register user');
      }
      
      await createAuditLog('CREATE', 'user', createResult.data.userId, { email, schoolId });
      
      return { success: true, user: createResult.data };
      
    } catch (err) {
      throw new Error(err.message || 'Registration failed');
    }
  }, [createAuditLog]);

  // ============================================
  // CONTEXT VALUE
  // ============================================
  
  const contextValue = useMemo(() => ({
    user,
    error,
    isAuthenticated,
    isStaff,
    isStudent,
    userFullName,
    userInitials,
    login,
    logout,
    staffLogin,
    updateProfile,
    fetchProfile,
    register,
    createAuditLog,
    setError,
    sessionExpiry
  }), [
    user,
    error,
    isAuthenticated,
    isStaff,
    isStudent,
    userFullName,
    userInitials,
    login,
    logout,
    staffLogin,
    updateProfile,
    fetchProfile,
    register,
    createAuditLog,
    sessionExpiry
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