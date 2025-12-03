import axios from 'axios';

// Base API configuration
const API_BASE_URL = 'http://localhost:8080/api/medical-records';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - log all requests
apiClient.interceptors.request.use(
  (config) => {
    console.log('=== AXIOS REQUEST ===');
    console.log('URL:', config.baseURL + config.url);
    console.log('Method:', config.method.toUpperCase());
    console.log('Headers:', config.headers);
    console.log('Data:', config.data);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('=== AXIOS RESPONSE SUCCESS ===');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    return response;
  },
  (error) => {
    console.error('=== AXIOS RESPONSE ERROR ===');
    console.error('Error object:', error);
    console.error('Error message:', error.message);
    console.error('Error response:', error.response);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Medical Records Service - All CRUD operations
 * Matches exactly with Spring Boot MedicalRecordController endpoints
 */
export const medicalRecordsService = {
  /**
   * Create a new medical record (Staff Only)
   * POST http://localhost:8080/api/medical-records/
   */
  createMedicalRecord: async (recordData) => {
    try {
      console.log('=== CREATING MEDICAL RECORD ===');
      console.log('Original recordData:', recordData);
      
      // Validate required fields
      if (!recordData.userId || recordData.userId.trim() === '') {
        console.error('ERROR: userId is missing or empty');
        return {
          success: false,
          error: 'User ID is required',
          status: 400
        };
      }
      
      if (!recordData.diagnosis || recordData.diagnosis.trim() === '') {
        console.error('ERROR: diagnosis is missing or empty');
        return {
          success: false,
          error: 'Diagnosis is required',
          status: 400
        };
      }
      
      // Clean the data before sending
      const cleanedData = {
        userId: recordData.userId.trim(),
        diagnosis: recordData.diagnosis.trim(),
        symptoms: recordData.symptoms?.trim() || '',
        treatment: recordData.treatment?.trim() || '',
        prescription: recordData.prescription?.trim() || '',
        vitalSigns: recordData.vitalSigns || '{}',
        allergies: recordData.allergies?.trim() || '',
        medicalHistory: recordData.medicalHistory?.trim() || '',
        notes: recordData.notes?.trim() || ''
      };
      
      // Only add appointmentId if it has a value
      if (recordData.appointmentId && recordData.appointmentId !== '' && recordData.appointmentId !== null) {
        cleanedData.appointmentId = parseInt(recordData.appointmentId);
      }
      
      console.log('Cleaned data being sent:', JSON.stringify(cleanedData, null, 2));
      console.log('Content-Type:', apiClient.defaults.headers['Content-Type']);
      
      const response = await apiClient.post('/', cleanedData);
      
      console.log('Response received:', response.status, response.data);
      
      // Note: Notification is sent by the backend automatically
      // No need to send it from frontend to avoid duplicates
      
      return {
        success: true,
        data: response.data,
        status: response.status,
        message: 'Medical record created successfully'
      };
    } catch (error) {
      console.error('=== ERROR CREATING MEDICAL RECORD ===');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      console.error('Error data:', error.response?.data);
      console.error('Full error response:', error.response);
      console.error('Stack trace:', error.stack);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to create medical record';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status || 500,
        details: error.response?.data
      };
    }
  },

  /**
   * Get all medical records (Staff Only)
   * GET http://localhost:8080/api/medical-records/
   */
  getAllMedicalRecords: async () => {
    try {
      console.log('Fetching all medical records...');
      const response = await apiClient.get('/');
      console.log('Fetched records:', response.data.length, 'records');
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
        status: response.status
      };
    } catch (error) {
      console.error('Error fetching medical records:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to fetch medical records';
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status || 500,
        data: []
      };
    }
  },

  /**
   * Get medical record by ID
   * GET http://localhost:8080/api/medical-records/{id}
   */
  getMedicalRecordById: async (recordId) => {
    try {
      const response = await apiClient.get(`/${recordId}`);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch medical record',
        status: error.response?.status || 404
      };
    }
  },

  /**
   * Get medical records by User ID (Student's own records or Staff view)
   * GET http://localhost:8080/api/medical-records/user/{userId}
   */
  getMedicalRecordsByUserId: async (userId) => {
    try {
      const response = await apiClient.get(`/user/${userId}`);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch medical records by user',
        status: error.response?.status || 500
      };
    }
  },

  /**
   * Get medical records by User ID (sorted by date)
   * GET http://localhost:8080/api/medical-records/user/{userId}/sorted
   */
  getMedicalRecordsByUserIdSorted: async (userId) => {
    try {
      const response = await apiClient.get(`/user/${userId}/sorted`);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch sorted medical records',
        status: error.response?.status || 500
      };
    }
  },

  /**
   * Get medical record by Appointment ID
   * GET http://localhost:8080/api/medical-records/appointment/{appointmentId}
   */
  getMedicalRecordByAppointmentId: async (appointmentId) => {
    try {
      const response = await apiClient.get(`/appointment/${appointmentId}`);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch medical record by appointment',
        status: error.response?.status || 404
      };
    }
  },

  /**
   * Update medical record (Staff Only)
   * PUT http://localhost:8080/api/medical-records/{id}
   */
  updateMedicalRecord: async (recordId, recordData) => {
    try {
      console.log('=== UPDATING MEDICAL RECORD ===');
      console.log('Record ID:', recordId);
      console.log('Payload being sent:', JSON.stringify(recordData, null, 2));
      
      const response = await apiClient.put(`/${recordId}`, recordData);
      return {
        success: true,
        data: response.data,
        status: response.status,
        message: 'Medical record updated successfully'
      };
    } catch (error) {
      console.error('=== ERROR UPDATING MEDICAL RECORD ===');
      console.error('Error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update medical record',
        status: error.response?.status || 404
      };
    }
  },

  /**
   * Delete medical record (Staff Only)
   * DELETE http://localhost:8080/api/medical-records/{id}
   */
  deleteMedicalRecord: async (recordId) => {
    try {
      const response = await apiClient.delete(`/${recordId}`);
      return {
        success: true,
        data: response.data,
        status: response.status,
        message: 'Medical record deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete medical record',
        status: error.response?.status || 404
      };
    }
  },

  /**
   * Get record count by user ID
   * GET http://localhost:8080/api/medical-records/user/{userId}/count
   */
  getRecordCountByUserId: async (userId) => {
    try {
      const response = await apiClient.get(`/user/${userId}/count`);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get record count',
        status: error.response?.status || 500
      };
    }
  }
};

export default medicalRecordsService;