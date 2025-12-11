import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const notificationService = {
  fetchUserNotifications: async (schoolId, userRole) => {
    const response = await axios.get(
      `${API_URL}/notifications/user/${schoolId}/role/${userRole}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },


  markAsRead: async (notificationId) => {
    const response = await axios.put(
      `${API_URL}/notifications/${notificationId}/read`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  deleteNotification: async (notificationId) => {
    await axios.delete(
      `${API_URL}/notifications/${notificationId}`,
      { headers: getAuthHeaders() }
    );
  },


  sendNotificationToAllStudents: async (title, message, type = 'info') => {
    const response = await axios.post(
      `${API_URL}/notifications/broadcast/students`,
      { title, message },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },


  sendNotificationToEveryone: async (title, message, type = 'info') => {
    const response = await axios.post(
      `${API_URL}/notifications/broadcast/all`,
      { title, message },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },


  sendNotificationToUser: async (schoolId, title, message, type = 'info') => {
    const response = await axios.post(
      `${API_URL}/notifications/send`,
      { 
        recipientId: schoolId,
        title, 
        message,
        type 
      },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

 
  sendNotificationToAllStaff: async (title, message, type = 'info') => {
    const response = await axios.post(
      `${API_URL}/notifications/broadcast/staff`,
      { title, message, type },
      { headers: getAuthHeaders() }
    );
    return response.data;
  }
};

export default notificationService;
