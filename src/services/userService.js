// ============================================
// USER SERVICE - BACKEND INTEGRATION
// src/services/userService.js
// ============================================

import axios from 'axios';

// Base API configuration
const API_BASE_URL = 'http://localhost:8080/api/users';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error for debugging
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * User Service - All CRUD operations for User management
 * Matches exactly with Spring Boot UserController endpoints
 */
export const userService = {
  /**
   * Create a new user
   * POST http://localhost:8080/api/users/
   */
  createUser: async (userData) => {
    try {
      // Ensure password field is included (required by backend)
      const userDataWithPassword = {
        ...userData,
        password: userData.password || 'defaultPassword123' // Default password if not provided
      };
      
      const response = await apiClient.post('/', userDataWithPassword);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create user',
        status: error.response?.status || 500
      };
    }
  },

  /**
   * Get all users
   * GET http://localhost:8080/api/users/
   */
  getAllUsers: async () => {
    try {
      const response = await apiClient.get('/');
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch users',
        status: error.response?.status || 500
      };
    }
  },

  /**
   * Get user by ID
   * GET http://localhost:8080/api/users/{id}
   */
  getUserById: async (userId) => {
    try {
      const response = await apiClient.get(`/${userId}`);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch user',
        status: error.response?.status || 404
      };
    }
  },

  /**
   * Update user by School ID
   * PUT http://localhost:8080/api/users/school-id/{schoolId}
   */
  updateUserBySchoolId: async (schoolId, userData) => {
    try {
      const response = await apiClient.put(`/school-id/${schoolId}`, userData);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update user',
        status: error.response?.status || 404
      };
    }
  },

  /**
   * Update user by ID (legacy - uses database ID)
   * PUT http://localhost:8080/api/users/{id}
   */
  updateUser: async (userId, userData) => {
    try {
      const response = await apiClient.put(`/${userId}`, userData);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update user',
        status: error.response?.status || 404
      };
    }
  },

  /**
   * Delete user by ID
   * DELETE http://localhost:8080/api/users/{id}
   */
  deleteUser: async (userId) => {
    try {
      const response = await apiClient.delete(`/${userId}`);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete user',
        status: error.response?.status || 404
      };
    }
  },

  /**
   * Check if email exists
   * GET http://localhost:8080/api/users/email/{email}
   */
  checkEmailExists: async (email) => {
    try {
      const response = await apiClient.get(`/email/${encodeURIComponent(email)}`);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to check email',
        status: error.response?.status || 500
      };
    }
  },

  /**
   * Login user with email and password
   * POST http://localhost:8080/api/users/login
   */
  login: async (email, password) => {
    try {
      const response = await apiClient.post('/login', { email, password });
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Login failed',
        status: error.response?.status || 401
      };
    }
  },

  /**
   * Get user by email
   * GET http://localhost:8080/api/users/email/user/{email}
   */
  getUserByEmail: async (email) => {
    try {
      const response = await apiClient.get(`/email/user/${encodeURIComponent(email)}`);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch user by email',
        status: error.response?.status || 404
      };
    }
  },

  /**
   * Get user profile by email
   * GET http://localhost:8080/api/users/profile/{email}
   */
  getUserProfile: async (email) => {
    try {
      const response = await apiClient.get(`/profile/${encodeURIComponent(email)}`);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch profile',
        status: error.response?.status || 404
      };
    }
  },

  /**
   * Update user profile by email
   * PUT http://localhost:8080/api/users/profile/{email}
   */
  updateUserProfile: async (email, updates) => {
    try {
      const response = await apiClient.put(`/profile/${encodeURIComponent(email)}`, updates);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update profile',
        status: error.response?.status || 400
      };
    }
  }
};

export default userService;
