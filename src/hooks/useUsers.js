// ============================================
// CUSTOM HOOK - useUsers (Backend Integration)
// src/hooks/useUsers.js
// ============================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { userService } from '../services/userService';

/**
 * CUSTOM HOOK - useUsers
 * Provides user management functionality with backend integration
 * @returns {Object} User management state and functions
 */
const useUsers = () => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // ============================================
  // FETCH ALL USERS
  // ============================================
  
  const fetchAllUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await userService.getAllUsers();
      
      if (result.success) {
        setUsers(result.data || []);
        return result.data;
      } else {
        setError(result.error || 'Failed to fetch users');
        return [];
      }
    } catch (err) {
      const errorMessage = err.message || 'An error occurred while fetching users';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // CREATE USER
  // ============================================
  
  const createUser = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await userService.createUser(userData);
      
      if (result.success) {
        // Refresh users list
        await fetchAllUsers();
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to create user');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err.message || 'An error occurred while creating user';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchAllUsers]);

  // ============================================
  // UPDATE USER
  // ============================================
  
  const updateUser = useCallback(async (userId, userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await userService.updateUser(userId, userData);
      
      if (result.success) {
        // Update user in local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.userId === userId ? { ...result.data } : user
          )
        );
        
        // Update selected user if it's the same
        if (selectedUser?.userId === userId) {
          setSelectedUser(result.data);
        }
        
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to update user');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err.message || 'An error occurred while updating user';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [selectedUser]);

  // ============================================
  // DELETE USER
  // ============================================
  
  const deleteUser = useCallback(async (userId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await userService.deleteUser(userId);
      
      if (result.success) {
        // Remove user from local state
        setUsers(prevUsers => prevUsers.filter(user => user.userId !== userId));
        
        // Clear selected user if it's the same
        if (selectedUser?.userId === userId) {
          setSelectedUser(null);
        }
        
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to delete user');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err.message || 'An error occurred while deleting user';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [selectedUser]);

  // ============================================
  // GET USER BY ID
  // ============================================
  
  const getUserById = useCallback(async (userId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await userService.getUserById(userId);
      
      if (result.success) {
        setSelectedUser(result.data);
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to fetch user');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err.message || 'An error occurred while fetching user';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // GET USER BY EMAIL
  // ============================================
  
  const getUserByEmail = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await userService.getUserByEmail(email);
      
      if (result.success) {
        setSelectedUser(result.data);
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to fetch user by email');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err.message || 'An error occurred while fetching user by email';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // CHECK EMAIL EXISTS
  // ============================================
  
  const checkEmailExists = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await userService.checkEmailExists(email);
      
      if (result.success) {
        return { success: true, exists: result.data };
      } else {
        setError(result.error || 'Failed to check email');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err.message || 'An error occurred while checking email';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // INITIAL LOAD
  // ============================================
  
  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  // ============================================
  // COMPUTED VALUES
  // ============================================
  
  const usersCount = useMemo(() => users.length, [users]);
  
  const studentsOnly = useMemo(() => 
    users.filter(user => user.role === 'student'), 
    [users]
  );
  
  const staffOnly = useMemo(() => 
    users.filter(user => user.role === 'staff' || user.role === 'admin'), 
    [users]
  );

  // ============================================
  // RETURN VALUES
  // ============================================
  
  return {
    // State
    users,
    loading,
    error,
    selectedUser,
    usersCount,
    studentsOnly,
    staffOnly,
    
    // Actions
    fetchAllUsers,
    createUser,
    updateUser,
    deleteUser,
    getUserById,
    getUserByEmail,
    checkEmailExists,
    setSelectedUser,
    setError,
    
    // Computed
    hasUsers: users.length > 0,
    isLoading: loading,
    hasError: !!error
  };
};

export default useUsers;
