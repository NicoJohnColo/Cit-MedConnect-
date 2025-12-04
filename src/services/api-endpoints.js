// ============================================
// API ENDPOINTS CONFIGURATION
// Backend base URL
export const API_BASE_URL = 'http://localhost:8080/api';

// API ENDPOINTS
export const API_ENDPOINTS = {
    // Time Slots (/api/timeslots)
    TIME_SLOTS: '/timeslots',
    TIME_SLOT_BY_ID: (id) => `/timeslots/${id}`,
    AVAILABLE_SLOTS: '/timeslots/available',
    STAFF_SLOTS: (staffId) => `/timeslots/staff/${staffId}`,
    BOOK_SLOT: (id) => `/timeslots/${id}/book`,
    
    // Appointments (/api/appointments)
    APPOINTMENTS: '/appointments',
    APPOINTMENT_BY_ID: (id) => `/appointments/${id}`,
    STAFF_ALL_APPOINTMENTS: '/appointments/staff/all',
    STUDENT_APPOINTMENTS: '/appointments/student/my-appointments',
    USER_APPOINTMENTS: (userId) => `/appointments/user/${userId}`,
    BOOK_APPOINTMENT: (timeSlotId) => `/timeslots/${timeSlotId}/book`,
    RESCHEDULE_APPOINTMENT: (id) => `/appointments/${id}/reschedule`,
    CANCEL_APPOINTMENT: (id) => `/appointments/${id}/cancel`,
    CONFIRM_APPOINTMENT: (id) => `/appointments/${id}/confirm`,
    COMPLETE_APPOINTMENT: (id) => `/appointments/${id}/complete`,
    
    // Calendar (if needed)
    USER_CALENDAR: (userId) => `/calendar/user/${userId}`,
    STAFF_CALENDAR: '/calendar/staff',
    CALENDAR_DATE: (date) => `/calendar/date/${date}`,
    CALENDAR_SUMMARY: '/calendar/summary'
};

// Default headers for API requests
export const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
};

// Helper function to get auth headers
export const getAuthHeaders = (user) => {
    const headers = { ...DEFAULT_HEADERS };
    
    if (user) {
        headers['X-User-ID'] = user.userId || user.schoolId;
        headers['X-User-Role'] = user.role?.toUpperCase() || 'STUDENT';
        
        // Add JWT token if available
        if (user.token) {
            headers['Authorization'] = `Bearer ${user.token}`;
        }
    }
    
    return headers;
};
