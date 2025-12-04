// ============================================
// APPOINTMENT CONTEXT 
// Manages appointment booking, viewing, and management
// ============================================

import React, { 
  createContext, 
  useState, 
  useEffect, 
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useAuth } from './AuthContext';
import AppointmentService from '../services/appointment-service';
import { transformAppointment, transformTimeSlot } from '../services/data-transformer';
import { 
  APPOINTMENT_STATUS,
} from '../types';

// Create Context
const AppointmentContext = createContext(null);

/**
 * APPOINTMENT PROVIDER COMPONENT
 * Implements complete appointment workflow as per flow diagram
 */
export const AppointmentProvider = ({ children }) => {
  const { user, createAuditLog } = useAuth();
  const isMounted = useRef(true);

  // Initialize appointment service
  const [appointmentService] = useState(() => new AppointmentService(user));

  // Update service when user changes
  useEffect(() => {
    if (appointmentService) {
      appointmentService.updateUser(user);
    }
  }, [user, appointmentService]);

  // STATE MANAGEMENT - useState
  // ============================================
  
  const [appointments, setAppointments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // INITIALIZE DATA - useEffect
  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        console.log('Loading appointment data...');
        console.log('User role:', user?.role);
        console.log('User ID:', user?.userId);
        console.log('User schoolId:', user?.schoolId);
        console.log('Full user object:', user);
        
        // Use schoolId as fallback if userId is undefined
        const actualUserId = user?.userId || user?.schoolId;
        console.log('Actual user ID to use:', actualUserId);
        
        // Load appointments based on user role
        let appointmentsData = [];
        if (user.role === 'staff') {
          console.log('Loading all appointments for staff...');
          appointmentsData = await appointmentService.getAllAppointments();
          console.log('Staff appointments data:', appointmentsData);
        } else if (user.role === 'student') {
          console.log('Loading appointments for student...');
          console.log('Student user ID:', actualUserId);
          try {
            appointmentsData = await appointmentService.getStudentAppointments();
            console.log('Student appointments data:', appointmentsData);
            console.log('Student appointments length:', appointmentsData?.length || 0);
            if (!appointmentsData || appointmentsData.length === 0) {
              console.log('No appointments from student endpoint, trying fallback...');
              // Fallback to user appointments endpoint
              appointmentsData = await appointmentService.getUserAppointments(actualUserId);
              console.log('User appointments data (fallback):', appointmentsData);
              console.log('User appointments length (fallback):', appointmentsData?.length || 0);
            }
          } catch (studentError) {
            console.log('Student endpoint failed, trying user appointments:', studentError);
            // Fallback to user appointments endpoint
            appointmentsData = await appointmentService.getUserAppointments(actualUserId);
            console.log('User appointments data (fallback):', appointmentsData);
            console.log('User appointments length (fallback):', appointmentsData?.length || 0);
          }
        } else {
          console.log('Loading appointments for user:', actualUserId);
          appointmentsData = await appointmentService.getUserAppointments(actualUserId);
          console.log('User appointments data:', appointmentsData);
        }
        
        console.log('Raw appointments loaded:', appointmentsData.length, 'appointments');
        console.log('Appointments loaded successfully:', appointmentsData);
        
        // Debug: Check if appointments have required fields
        if (appointmentsData.length > 0) {
          console.log('First appointment sample:', appointmentsData[0]);
          console.log('First appointment fields:', Object.keys(appointmentsData[0]));
        }
        
        // Transform appointments for frontend compatibility
        const transformedAppointments = appointmentsData.map(apt => {
          console.log('Transforming appointment:', apt);
          const transformed = transformAppointment(apt);
          console.log('Transformed to:', transformed);
          return transformed;
        });
        console.log('Final transformed appointments:', transformedAppointments);
        console.log('Final transformed appointments length:', transformedAppointments.length);
        setAppointments(transformedAppointments);
        
        // Load slots based on user role
        if (user.role === 'student') {
          const slotsData = await appointmentService.getAvailableSlots();
          const transformedSlots = slotsData.map(slot => transformTimeSlot(slot));
          setAvailableSlots(transformedSlots);
        } else if (user.role === 'staff') {
          // Staff need to see all slots for management
          try {
            const staffSlotsData = await appointmentService.getStaffSlots();
            const transformedSlots = staffSlotsData.map(slot => transformTimeSlot(slot));
            setAvailableSlots(transformedSlots);
          } catch (staffSlotsError) {
            console.warn('Failed to load staff slots, trying available slots:', staffSlotsError);
            // Fallback to available slots if staff slots endpoint fails
            const slotsData = await appointmentService.getAvailableSlots();
            const transformedSlots = slotsData.map(slot => transformTimeSlot(slot));
            setAvailableSlots(transformedSlots);
          }
        }
        
        console.log('Data loaded successfully');
      } catch (err) {
        console.error('Failed to load appointment data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    
    return () => {
      isMounted.current = false;
    };
  }, [user, appointmentService]);

  // COMPUTED VALUES - useMemo
  // ============================================
  
  // Get user's appointments
  const userAppointments = useMemo(() => {
    if (!user) return [];
    // Appointments are already filtered by role from the API
    console.log('userAppointments memo - user:', user);
    console.log('userAppointments memo - appointments count:', appointments.length);
    console.log('userAppointments memo - returning all appointments:', appointments);
    return appointments;
  }, [appointments, user]);
  
  // Get upcoming appointments
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return userAppointments
      .filter(apt => {
        // Handle both date/time property formats
        const date = apt.scheduledDate || apt.date;
        const time = apt.scheduledTime || apt.time;
        if (!date || !time) return false;
        
        const aptDate = new Date(`${date}T${time}`);
        return aptDate > now && apt.status === APPOINTMENT_STATUS.SCHEDULED;
      })
      .sort((a, b) => {
        // Handle both date/time property formats
        const dateA = new Date(`${a.scheduledDate || a.date}T${a.scheduledTime || a.time}`);
        const dateB = new Date(`${b.scheduledDate || b.date}T${b.scheduledTime || b.time}`);
        return dateA - dateB;
      })
      .map(apt => ({
        ...apt,
        // Ensure consistent property names
        scheduledDate: apt.scheduledDate || apt.date,
        scheduledTime: apt.scheduledTime || apt.time,
        date: apt.scheduledDate || apt.date,
        time: apt.scheduledTime || apt.time
      }));
  }, [userAppointments]);

  // Get appointment statistics
  const appointmentStats = useMemo(() => {
    const total = userAppointments.length;
    const scheduled = userAppointments.filter(a => a.status === APPOINTMENT_STATUS.SCHEDULED).length;
    const completed = userAppointments.filter(a => a.status === APPOINTMENT_STATUS.COMPLETED).length;
    const cancelled = userAppointments.filter(a => a.status === APPOINTMENT_STATUS.CANCELLED).length;
    
    return { total, scheduled, completed, cancelled };
  }, [userAppointments]);

  // APPOINTMENT BOOKING - useCallback
  // ============================================
  
  /**
   * BOOK APPOINTMENT - Complete Flow
   * Flow: Fill Appointment Details → Confirm Booking → Create Appointment Record → Send Notification
   */
  const bookAppointment = useCallback(async (appointmentData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Call API to book appointment
      const response = await appointmentService.bookAppointment(
        appointmentData.slotId,
        {
          studentId: user.userId,
          reason: appointmentData.reason,
          notes: appointmentData.symptoms || appointmentData.notes
        }
      );
      
      // Transform response for frontend
      const newAppointment = transformAppointment(response);
      
      // Update appointments state
      setAppointments(prev => [...prev, newAppointment]);
      
      // Update available slots (refresh)
      if (user.role === 'student') {
        const slotsData = await appointmentService.getAvailableSlots();
        const transformedSlots = slotsData.map(slot => transformTimeSlot(slot));
        setAvailableSlots(transformedSlots);
      } else if (user.role === 'staff') {
        // Staff need to see all slots for management
        try {
          const staffSlotsData = await appointmentService.getStaffSlots();
          const transformedSlots = staffSlotsData.map(slot => transformTimeSlot(slot));
          setAvailableSlots(transformedSlots);
        } catch (staffSlotsError) {
          console.warn('Failed to load staff slots, trying available slots:', staffSlotsError);
          // Fallback to available slots if staff slots endpoint fails
          const slotsData = await appointmentService.getAvailableSlots();
          const transformedSlots = slotsData.map(slot => transformTimeSlot(slot));
          setAvailableSlots(transformedSlots);
        }
      }
      
      // Create audit log
      await createAuditLog('CREATE', 'appointment', newAppointment.appointmentId, appointmentData);
      
      // Send notification (handled by NotificationContext)
      window.dispatchEvent(new CustomEvent('appointmentBooked', {
        detail: newAppointment
      }));
      
      // Force a re-render of the appointments list
      window.dispatchEvent(new Event('appointmentsUpdated'));
      
      setLoading(false);
      return { 
        success: true, 
        data: newAppointment,
        message: 'Your appointment was booked successfully!'
      };
      
    } catch (err) {
      console.error('Error booking appointment:', err);
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [user, appointmentService, createAuditLog]);

  // APPOINTMENT ACTIONS - useCallback
  // ============================================
  
  /**
   * VIEW APPOINTMENT DETAILS
   * Flow: Check Appointments → View Details
   */
  const getAppointmentDetails = useCallback(async (appointmentId) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const appointment = appointments.find(a => a.appointmentId === appointmentId);
      
      if (!appointment) {
        throw new Error('Appointment not found');
      }
      
      // Create audit log
      await createAuditLog('VIEW', 'appointment', appointmentId, {});
      
      setLoading(false);
      return { success: true, data: appointment };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [appointments, createAuditLog]);
  
  /**
   * CANCEL APPOINTMENT
   * Flow: Check Appointments → Cancel → Create Audit Log
   */
  const cancelAppointment = useCallback(async (appointmentId, reason = '') => {
    setLoading(true);
    setError(null);
    
    try {
      // Call API to cancel appointment
      await appointmentService.cancelAppointment(appointmentId);
      
      // Update local state
      setAppointments(prev => prev.map(apt =>
        apt.appointmentId === appointmentId
          ? { 
              ...apt, 
              status: APPOINTMENT_STATUS.CANCELLED,
              notes: `Cancelled: ${reason}`,
              updatedAt: new Date().toISOString()
            }
          : apt
      ));
      
      // Update available slots
      if (user.role === 'student') {
        const slotsData = await appointmentService.getAvailableSlots();
        const transformedSlots = slotsData.map(slot => transformTimeSlot(slot));
        setAvailableSlots(transformedSlots);
      } else if (user.role === 'staff') {
        // Staff need to see all slots for management
        try {
          const staffSlotsData = await appointmentService.getStaffSlots();
          const transformedSlots = staffSlotsData.map(slot => transformTimeSlot(slot));
          setAvailableSlots(transformedSlots);
        } catch (staffSlotsError) {
          console.warn('Failed to load staff slots, trying available slots:', staffSlotsError);
          // Fallback to available slots if staff slots endpoint fails
          const slotsData = await appointmentService.getAvailableSlots();
          const transformedSlots = slotsData.map(slot => transformTimeSlot(slot));
          setAvailableSlots(transformedSlots);
        }
      }
      
      // Create audit log
      await createAuditLog('UPDATE', 'appointment', appointmentId, { 
        status: APPOINTMENT_STATUS.CANCELLED,
        reason 
      });
      
      // Trigger notification
      window.dispatchEvent(new CustomEvent('appointmentCancelled', {
        detail: { appointmentId }
      }));
      
      setLoading(false);
      return { 
        success: true, 
        message: 'Appointment cancelled successfully'
      };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [appointmentService, createAuditLog, user]);
  
  /**
   * RESCHEDULE APPOINTMENT (Student and Staff)
   * Flow: Check Appointments → Select New Slot → Reschedule → Update Appointment
   */
  const rescheduleAppointment = useCallback(async (appointmentId, newTimeSlotId) => {
    setLoading(true);
    setError(null);
    
    try {
      // Both students and staff can reschedule appointments
      // Students can only reschedule their own appointments, staff can reschedule any
      
      // Find the appointment to verify ownership (for students) or existence (for staff)
      const appointment = appointments.find(a => a.appointmentId === appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }
      
      // Call API to reschedule
      await appointmentService.rescheduleAppointment(appointmentId, newTimeSlotId);
      
      // Find the new time slot details
      const newSlot = availableSlots.find(slot => slot.slotId === newTimeSlotId);
      
      // Update local state
      setAppointments(prev => prev.map(apt =>
        apt.appointmentId === appointmentId
          ? {
              ...apt,
              scheduledDate: newSlot?.date || apt.scheduledDate,
              scheduledTime: newSlot?.time || apt.scheduledTime,
              status: APPOINTMENT_STATUS.SCHEDULED,
              updatedAt: new Date().toISOString()
            }
          : apt
      ));
      
      // Update available slots
      const slotsData = await appointmentService.getAvailableSlots();
      setAvailableSlots(slotsData);
      
      // Create audit log
      await createAuditLog('UPDATE', 'appointment', appointmentId, {
        action: 'reschedule',
        oldDate: appointment.scheduledDate,
        oldTime: appointment.scheduledTime,
        newDate: newSlot?.date,
        newTime: newSlot?.time
      });
      
      // Trigger notification
      window.dispatchEvent(new CustomEvent('appointmentRescheduled', {
        detail: { appointmentId, newSlot }
      }));
      
      setLoading(false);
      return { 
        success: true, 
        message: 'Appointment rescheduled successfully'
      };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [appointments, availableSlots, appointmentService, createAuditLog, user]);

  // STAFF OPERATIONS - useCallback
  // ============================================
  
  /**
   * COMPLETE APPOINTMENT (Staff Only)
   * Flow: Staff Dashboard → View Appointments → Complete Appointment
   */
  const completeAppointment = useCallback(async (appointmentId) => {
    setLoading(true);
    setError(null);
    
    try {
      // Call API to complete appointment
      await appointmentService.completeAppointment(appointmentId);
      
      // Update local state
      setAppointments(prev => prev.map(apt =>
        apt.appointmentId === appointmentId
          ? {
              ...apt,
              status: APPOINTMENT_STATUS.COMPLETED,
              updatedAt: new Date().toISOString()
            }
          : apt
      ));
      
      // Create audit log
      await createAuditLog('UPDATE', 'appointment', appointmentId, { 
        status: APPOINTMENT_STATUS.COMPLETED 
      });
      
      // Trigger notification to student
      window.dispatchEvent(new CustomEvent('appointmentCompleted', {
        detail: { appointmentId }
      }));
      
      setLoading(false);
      return { success: true, message: 'Appointment marked as completed' };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [appointmentService, createAuditLog]);

  /**
   * SUCCESS APPOINTMENT (Staff Only)
   * Flow: Staff Dashboard → View Appointments → Mark as Success
   */
  const successAppointment = useCallback(async (appointmentId) => {
    setLoading(true);
    setError(null);
    
    try {
      // Call API to mark appointment as success
      await appointmentService.successAppointment(appointmentId);
      
      // Update local state
      setAppointments(prev => prev.map(apt =>
        apt.appointmentId === appointmentId
          ? {
              ...apt,
              status: APPOINTMENT_STATUS.SUCCESS,
              updatedAt: new Date().toISOString()
            }
          : apt
      ));
      
      // Create audit log
      await createAuditLog('UPDATE', 'appointment', appointmentId, { 
        status: APPOINTMENT_STATUS.SUCCESS 
      });
      
      // Trigger notification to student
      window.dispatchEvent(new CustomEvent('appointmentSuccess', {
        detail: { appointmentId }
      }));
      
      setLoading(false);
      return { success: true, message: 'Appointment marked as successful' };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [appointmentService, createAuditLog]);

  /**
   * UPDATE APPOINTMENT STATUS (Staff Only)
   * Flow: Staff Dashboard → View Appointments → Manage Appointment → Update Status
   */
  const updateAppointmentStatus = useCallback(async (appointmentId, status, notes = '') => {
    setLoading(true);
    setError(null);
    
    try {
      if (user?.role !== 'staff') {
        throw new Error('Unauthorized: Staff access required');
      }
      
      setAppointments(prev => prev.map(apt =>
        apt.appointmentId === appointmentId
          ? {
              ...apt,
              status,
              notes: notes || apt.notes,
              updatedAt: new Date().toISOString()
            }
          : apt
      ));
      
      // Create audit log
      await createAuditLog('UPDATE', 'appointment', appointmentId, { status, notes });
      
      setLoading(false);
      return { success: true, message: 'Appointment status updated' };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [user, createAuditLog]);

  // TIME SLOT MANAGEMENT (Staff Only)
  // ============================================
  
  /**
   * CREATE TIME SLOT (Staff Only)
   */
  const createTimeSlot = useCallback(async (slotData) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('createTimeSlot called with user:', user);
      console.log('User role:', user?.role);
      
      // Call API to create time slot
      console.log('Calling appointmentService.createTimeSlot with:', slotData);
      const response = await appointmentService.createTimeSlot(slotData);
      console.log('createTimeSlot API response:', response);
      
      // Update available slots
      if (user.role === 'student') {
        const slotsData = await appointmentService.getAvailableSlots();
        const transformedSlots = slotsData.map(slot => transformTimeSlot(slot));
        setAvailableSlots(transformedSlots);
      } else if (user.role === 'staff') {
        // Staff need to see all slots for management
        try {
          const staffSlotsData = await appointmentService.getStaffSlots();
          const transformedSlots = staffSlotsData.map(slot => transformTimeSlot(slot));
          setAvailableSlots(transformedSlots);
        } catch (staffSlotsError) {
          console.warn('Failed to load staff slots, trying available slots:', staffSlotsError);
          // Fallback to available slots if staff slots endpoint fails
          const slotsData = await appointmentService.getAvailableSlots();
          const transformedSlots = slotsData.map(slot => transformTimeSlot(slot));
          setAvailableSlots(transformedSlots);
        }
      }
      
      // Create audit log
      await createAuditLog('CREATE', 'timeslot', response.timeSlotId, slotData);
      
      setLoading(false);
      return { success: true, data: response, message: 'Time slot created successfully' };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [user, appointmentService, createAuditLog]);
  
  /**
   * UPDATE TIME SLOT (Staff Only)
   */
  const updateTimeSlot = useCallback(async (timeSlotId, slotData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Call API to update time slot
      const response = await appointmentService.updateTimeSlot(timeSlotId, slotData);
      
      // Update available slots
      if (user.role === 'student') {
        const slotsData = await appointmentService.getAvailableSlots();
        const transformedSlots = slotsData.map(slot => transformTimeSlot(slot));
        setAvailableSlots(transformedSlots);
      } else if (user.role === 'staff') {
        // Staff need to see all slots for management
        try {
          const staffSlotsData = await appointmentService.getStaffSlots();
          const transformedSlots = staffSlotsData.map(slot => transformTimeSlot(slot));
          setAvailableSlots(transformedSlots);
        } catch (staffSlotsError) {
          console.warn('Failed to load staff slots, trying available slots:', staffSlotsError);
          // Fallback to available slots if staff slots endpoint fails
          const slotsData = await appointmentService.getAvailableSlots();
          const transformedSlots = slotsData.map(slot => transformTimeSlot(slot));
          setAvailableSlots(transformedSlots);
        }
      }
      
      // Create audit log
      await createAuditLog('UPDATE', 'timeslot', timeSlotId, slotData);
      
      setLoading(false);
      return { success: true, data: response, message: 'Time slot updated successfully' };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [user, appointmentService, createAuditLog]);

  /**
   * DELETE TIME SLOT (Staff Only)
   */
  const deleteTimeSlot = useCallback(async (timeSlotId) => {
    setLoading(true);
    setError(null);
    
    try {
      // Call API to delete time slot
      await appointmentService.deleteTimeSlot(timeSlotId);
      
      // Update available slots
      if (user.role === 'student') {
        const slotsData = await appointmentService.getAvailableSlots();
        const transformedSlots = slotsData.map(slot => transformTimeSlot(slot));
        setAvailableSlots(transformedSlots);
      } else if (user.role === 'staff') {
        // Staff need to see all slots for management
        try {
          const staffSlotsData = await appointmentService.getStaffSlots();
          const transformedSlots = staffSlotsData.map(slot => transformTimeSlot(slot));
          setAvailableSlots(transformedSlots);
        } catch (staffSlotsError) {
          console.warn('Failed to load staff slots, trying available slots:', staffSlotsError);
          // Fallback to available slots if staff slots endpoint fails
          const slotsData = await appointmentService.getAvailableSlots();
          const transformedSlots = slotsData.map(slot => transformTimeSlot(slot));
          setAvailableSlots(transformedSlots);
        }
      }
      
      // Create audit log
      await createAuditLog('DELETE', 'timeslot', timeSlotId, {});
      
      setLoading(false);
      return { success: true, message: 'Time slot deleted successfully' };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [user, appointmentService, createAuditLog]);

// REFRESH DATA
// ============================================
  
const refreshAppointments = useCallback(async () => {
  if (!user) return;
  
  setLoading(true);
  try {
    // Load appointments based on user role
    let appointmentsData = [];
    if (user.role === 'staff') {
      appointmentsData = await appointmentService.getAllAppointments();
    } else if (user.role === 'student') {
      try {
        appointmentsData = await appointmentService.getStudentAppointments();
      } catch (studentError) {
        console.log('Student endpoint failed in refresh, trying user appointments:', studentError);
        // Fallback to user appointments endpoint
        appointmentsData = await appointmentService.getUserAppointments(user.userId);
      }
    } else {
      appointmentsData = await appointmentService.getUserAppointments(user.userId);
    }
    
    // Transform appointments for frontend compatibility
    const transformedAppointments = appointmentsData.map(apt => 
      transformAppointment(apt)
    );
    setAppointments(transformedAppointments);
    
    // Refresh slots based on user role
    if (user.role === 'student') {
      const slotsData = await appointmentService.getAvailableSlots();
      const transformedSlots = slotsData.map(slot => transformTimeSlot(slot));
      setAvailableSlots(transformedSlots);
    } else if (user.role === 'staff') {
      try {
        const staffSlotsData = await appointmentService.getStaffSlots();
        const transformedSlots = staffSlotsData.map(slot => transformTimeSlot(slot));
        setAvailableSlots(transformedSlots);
      } catch (staffError) {
        const slotsData = await appointmentService.getAvailableSlots();
        const transformedSlots = slotsData.map(slot => transformTimeSlot(slot));
        setAvailableSlots(transformedSlots);
      }
    }
    
    setError(null);
  } catch (err) {
    console.error('Error refreshing appointments:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
}, [user, appointmentService]);

// CONTEXT VALUE - useMemo
// ============================================
  
  const contextValue = useMemo(() => ({
    // State
    appointments,
    availableSlots,
    loading,
    error,
    
    // Computed
    userAppointments,
    upcomingAppointments,
    appointmentStats,
    
    // Student Functions
    bookAppointment,
    getAppointmentDetails,
    cancelAppointment,
    rescheduleAppointment,
    
    // Staff Functions
    completeAppointment,
    successAppointment,
    updateAppointmentStatus,
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    
    // Helpers
    refreshAppointments,
    setError
  }), [appointments, availableSlots, loading, error, userAppointments, upcomingAppointments, appointmentStats, bookAppointment, getAppointmentDetails, cancelAppointment, rescheduleAppointment, completeAppointment, successAppointment, updateAppointmentStatus, createTimeSlot, updateTimeSlot, deleteTimeSlot, refreshAppointments]);

  return (
    <AppointmentContext.Provider value={contextValue}>
      {children}
    </AppointmentContext.Provider>
  );
};

export { AppointmentContext };
export default AppointmentContext;
