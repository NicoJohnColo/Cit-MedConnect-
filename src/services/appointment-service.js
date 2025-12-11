// ============================================
// APPOINTMENT SERVICE
// Handles all API calls for appointments and time slots
// ============================================

import { API_BASE_URL, API_ENDPOINTS } from './api-endpoints';
import { getUserId, getUserRole, getAuthHeaders } from './auth-helper';
import { transformAppointment, transformTimeSlot } from './data-transformer';
import { notificationService } from './notificationService';

/**
 * APPOINTMENT SERVICE CLASS
 * 
 */
class AppointmentService {
    constructor(user) {
        this.user = user;
        this.baseHeaders = getAuthHeaders(user);
    }

    
    updateUser(user) {
        this.user = user;
        this.baseHeaders = getAuthHeaders(user);
    }

   
    
    async getAvailableSlots(date = null) {
        try {
            console.log('Fetching available slots for:', getUserRole(this.user), 'user');
            
            
            const targetDate = date || new Date().toISOString().split('T')[0];
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowDate = tomorrow.toISOString().split('T')[0];
            
            
            let url = `${API_BASE_URL}${API_ENDPOINTS.AVAILABLE_SLOTS}?date=${targetDate}`;
            
            console.log('Making request to:', url);
            console.log('Headers:', this.baseHeaders);
            
            let response = await fetch(url, {
                method: 'GET',
                headers: this.baseHeaders
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to fetch available slots:', response.status, errorText);
                throw new Error(`Failed to fetch available slots: ${response.status} - ${errorText}`);
            }

            let slots = await response.json();
            console.log('Raw slots data for today:', slots);
            
            
            if (slots.length === 0 && !date) {
                console.log('No slots for today, trying tomorrow...');
                url = `${API_BASE_URL}${API_ENDPOINTS.AVAILABLE_SLOTS}?date=${tomorrowDate}`;
                console.log('Making request to:', url);
                
                response = await fetch(url, {
                    method: 'GET',
                    headers: this.baseHeaders
                });
                
                if (response.ok) {
                    slots = await response.json();
                    console.log('Raw slots data for tomorrow:', slots);
                }
            }
            
            
            if (slots.length === 0) {
                console.log('No available slots found, fetching all slots...');
                const allSlotsResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TIME_SLOTS}`, {
                    method: 'GET',
                    headers: this.baseHeaders
                });
                
                if (allSlotsResponse.ok) {
                    const allSlots = await allSlotsResponse.json();
                    
                    slots = allSlots.filter(slot => slot.available === true && slot.currentBookings < slot.maxBookings);
                    console.log('Filtered available slots from all slots:', slots);
                }
            }
            
            
            const transformedSlots = slots.map(slot => transformTimeSlot(slot));
            console.log('Transformed slots:', transformedSlots);
            
            return transformedSlots;
        } catch (error) {
            console.error('Error fetching available slots:', error);
            throw error;
        }
    }

    
    async bookAppointment(timeSlotId, bookingData) {
        try {
            const userRole = getUserRole(this.user);
            const userId = getUserId(this.user);
            
            console.log('Booking appointment with userRole:', userRole, 'userId:', userId);
            
            const requestBody = {
                studentId: bookingData.studentId || userId,
                reason: bookingData.reason,
                notes: bookingData.notes || bookingData.symptoms
            };
            
            console.log('Booking request body:', requestBody);
            
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOK_APPOINTMENT(timeSlotId)}`, {
                method: 'POST',
                headers: this.baseHeaders,
                body: JSON.stringify(requestBody)
            });
            
            console.log('Booking response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.log('Booking error response:', errorData);
                throw new Error(errorData.message || `Failed to book appointment: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Booking success response:', result);
            
            
            try {
                const studentId = bookingData.studentId || userId;
                await notificationService.sendNotificationToAllStaff(
                    'New Appointment Booked',
                    `Student ${studentId} has booked a new appointment. Reason: ${bookingData.reason}`,
                    'info'
                );
                console.log('Notification sent successfully to all staff members');
            } catch (notificationError) {
                console.error('Failed to send notification to staff:', notificationError);
                
            }
            
            return result;
        } catch (error) {
            console.error('Error booking appointment:', error);
            throw error;
        }
    }

    
    async getStudentAppointments() {
        try {
            console.log('Fetching student appointments...');
            const url = `${API_BASE_URL}/appointments/student/my-appointments`;
            console.log('URL:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.baseHeaders
            });

            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`Failed to fetch student appointments: ${response.status}`);
            }

            const appointments = await response.json();
            console.log('Raw appointments from API:', appointments);
            
            const transformed = appointments.map(apt => transformAppointment(apt));
            console.log('Transformed appointments:', transformed);
            return transformed;
        } catch (error) {
            console.error('Error fetching student appointments:', error);
            throw error;
        }
    }

    
    async getUserAppointments(userId) {
        try {
            console.log('Fetching appointments for user:', userId);
            const url = `${API_BASE_URL}${API_ENDPOINTS.USER_APPOINTMENTS(userId)}`;
            console.log('URL:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.baseHeaders
            });

            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`Failed to fetch user appointments: ${response.status}`);
            }

            const appointments = await response.json();
            console.log('Raw appointments from API:', appointments);
            
            const transformed = appointments.map(apt => transformAppointment(apt));
            console.log('Transformed appointments:', transformed);
            return transformed;
        } catch (error) {
            console.error('Error fetching user appointments:', error);
            throw error;
        }
    }

    
    async rescheduleAppointment(appointmentId, newTimeSlotId) {
        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RESCHEDULE_APPOINTMENT(appointmentId)}`, {
                method: 'PUT',
                headers: this.baseHeaders,
                body: JSON.stringify({ newTimeSlotId })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to reschedule appointment: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error rescheduling appointment:', error);
            throw error;
        }
    }

    
    async cancelAppointment(appointmentId) {
        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CANCEL_APPOINTMENT(appointmentId)}`, {
                method: 'PUT',
                headers: this.baseHeaders
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to cancel appointment: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            throw error;
        }
    }

    /**
     * STAFF OPERATIONS
     */

    
    async getAllAppointments(startDate = null, endDate = null) {
        try {
            console.log('=== GET ALL APPOINTMENTS (STAFF) ===');
            console.log('User:', this.user);
            console.log('User role:', this.user?.role);
            console.log('Headers:', this.baseHeaders);
            
            const url = `${API_BASE_URL}${API_ENDPOINTS.STAFF_ALL_APPOINTMENTS}`;
            console.log('Fetching from URL:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.baseHeaders
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to fetch all appointments:', response.status, errorText);
                throw new Error(`Failed to fetch all appointments: ${response.status} - ${errorText}`);
            }

            const appointments = await response.json();
            console.log('Raw appointments from API:', appointments);
            console.log('Number of appointments:', appointments.length);
            
            
            if (appointments.length > 0) {
                console.log('First appointment sample:', appointments[0]);
                console.log('First appointment keys:', Object.keys(appointments[0]));
            }
            
            
            const transformed = appointments.map(apt => {
                const result = transformAppointment(apt);
                console.log('Transformed appointment:', result);
                return result;
            });
            console.log('All transformed appointments:', transformed);
            return transformed;
        } catch (error) {
            console.error('Error fetching all appointments:', error);
            throw error;
        }
    }

    
    async completeAppointment(appointmentId) {
        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COMPLETE_APPOINTMENT(appointmentId)}`, {
                method: 'PUT',
                headers: this.baseHeaders
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to complete appointment: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error completing appointment:', error);
            throw error;
        }
    }

    
    async successAppointment(appointmentId) {
        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COMPLETE_APPOINTMENT(appointmentId)}`, {
                method: 'PUT',
                headers: this.baseHeaders,
                body: JSON.stringify({ status: 'success' })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to mark appointment as success: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error marking appointment as success:', error);
            throw error;
        }
    }

    

    // Create time slot (Staff only)
    async createTimeSlot(slotData) {
        try {
            console.log('createTimeSlot called with user:', this.user);
            console.log('User role:', this.user?.role);
            
            const requestBody = {
                slotDate: slotData.date,
                startTime: this.formatTimeForAPI(slotData.time),
                endTime: slotData.endTime || this.calculateEndTime(slotData.time),
                maxBookings: slotData.maxBookings || 1,
                currentBookings: 0,
                staffId: slotData.staffId || getUserId(this.user) || 'STAFF001',
                isAvailable: true
            };
            
            console.log('Request body:', requestBody);
            
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TIME_SLOTS}`, {
                method: 'POST',
                headers: this.baseHeaders,
                body: JSON.stringify(requestBody)
            });

            console.log('API response status:', response.status);
            console.log('API response headers:', response.headers);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.log('Error response:', errorData);
                throw new Error(errorData.message || `Failed to create time slot: ${response.status}`);
            }

            const result = await response.json();
            console.log('Success response:', result);
            return result;
        } catch (error) {
            console.error('Error creating time slot:', error);
            throw error;
        }
    }

    // Update time slot (Staff only)
    async updateTimeSlot(timeSlotId, slotData) {
        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TIME_SLOT_BY_ID(timeSlotId)}`, {
                method: 'PUT',
                headers: this.baseHeaders,
                body: JSON.stringify({
                    slotDate: slotData.date,
                    startTime: this.formatTimeForAPI(slotData.time),
                    endTime: slotData.endTime || this.calculateEndTime(slotData.time),
                    maxBookings: slotData.maxBookings || 1,
                    staffId: slotData.staffId || this.user?.userId || 'STAFF001',
                    isAvailable: slotData.isAvailable !== undefined ? slotData.isAvailable : true
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to update time slot: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating time slot:', error);
            throw error;
        }
    }

    // Delete time slot (Staff only)
    async deleteTimeSlot(timeSlotId) {
        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TIME_SLOT_BY_ID(timeSlotId)}`, {
                method: 'DELETE',
                headers: this.baseHeaders
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to delete time slot: ${response.status}`);
            }

            return true; 
        } catch (error) {
            console.error('Error deleting time slot:', error);
            throw error;
        }
    }

    
    async getStaffSlots(staffId = null) {
        try {
            const id = staffId || getUserId(this.user);
            if (!id) {
                console.warn('Staff ID is missing, falling back to available slots');
                return await this.getAvailableSlots();
            }

            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.STAFF_SLOTS(id)}`, {
                method: 'GET',
                headers: this.baseHeaders
            });

            if (!response.ok) {
                console.warn(`Failed to fetch staff slots (${response.status}), falling back to available slots`);
                return await this.getAvailableSlots();
            }

            const slots = await response.json();
            
            return slots.map(slot => transformTimeSlot(slot));
        } catch (error) {
            console.error('Error fetching staff slots, falling back to available slots:', error);
            return await this.getAvailableSlots();
        }
    }

    /**
     * UTILITY METHODS
     */

    
    calculateEndTime(startTime) {
        if (!startTime) return null;
        
        
        let timeStr = startTime;
        if (startTime.length === 5) { 
            timeStr = `${startTime}:00`; 
        }
        
        const [hours, minutes] = timeStr.split(':').map(Number);
        const endHours = hours + 1;
        
        return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    }

    
    formatTimeForAPI(time) {
        if (!time) return null;
        
        
        if (time.length === 5) { 
            return `${time}:00`; 
        }
        
        return time; 
    }
}


export default AppointmentService;
