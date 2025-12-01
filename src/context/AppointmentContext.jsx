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
import { 
  APPOINTMENT_STATUS,
  generateId,
} from '../types';

// ✅ Create Context
const AppointmentContext = createContext(null);

/**
 * APPOINTMENT PROVIDER COMPONENT
 * Implements complete appointment workflow as per flow diagram
 */
export const AppointmentProvider = ({ children }) => {
  const { user, createAuditLog } = useAuth();
  const isMounted = useRef(true);

  // ============================================
  // STATE MANAGEMENT - useState
  // ============================================
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================================
  // INITIALIZE DATA - useEffect
  // Initialize with generated time slots
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        console.log('Initializing appointment data...');
        
        // Start with empty appointments
        console.log('Starting with empty appointments list');
        setAppointments([]);
      } catch (err) {
        console.error('Failed to initialize appointment data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    initData();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ============================================
  // COMPUTED VALUES - useMemo
  // ============================================
  
  // ✅ Get user's appointments
  const userAppointments = useMemo(() => {
    if (!user) return [];
    if (user.role === 'student') {
      return appointments.filter(apt => apt.studentId === user.userId);
    }
    if (user.role === 'staff') {
      return appointments.filter(apt => apt.staffId === user.userId);
    }
    return [];
  }, [appointments, user]);
  
  // ✅ Get upcoming appointments
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

  // ✅ Get appointment statistics
  const appointmentStats = useMemo(() => {
    const total = userAppointments.length;
    const scheduled = userAppointments.filter(a => a.status === APPOINTMENT_STATUS.SCHEDULED).length;
    const completed = userAppointments.filter(a => a.status === APPOINTMENT_STATUS.COMPLETED).length;
    const cancelled = userAppointments.filter(a => a.status === APPOINTMENT_STATUS.CANCELLED).length;
    
    return { total, scheduled, completed, cancelled };
  }, [userAppointments]);

  // ============================================
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
      // Step 1: Create appointment record
      const newAppointment = {
        appointmentId: generateId('APT'),
        studentId: user.userId,
        staffId: appointmentData.staffId || 'STAFF-AUTO',
        status: APPOINTMENT_STATUS.SCHEDULED,
        reason: appointmentData.reason,
        symptoms: appointmentData.symptoms || '',
        notes: '',
        location: appointmentData.location || 'Main Clinic',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        scheduledDate: appointmentData.date,
        scheduledTime: appointmentData.time
      };
      
      // Step 2: Update appointments state
      setAppointments(prev => [...prev, newAppointment]);
      
      // Step 3: Create audit log
      await createAuditLog('CREATE', 'appointment', newAppointment.appointmentId, appointmentData);
      
      // Step 4: Send notification (handled by NotificationContext)
      window.dispatchEvent(new CustomEvent('appointmentBooked', {
        detail: newAppointment
      }));
      
      // Step 5: Force a re-render of the appointments list
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
  }, [user, createAuditLog]);

  // ============================================
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
      const appointment = appointments.find(a => a.appointmentId === appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }
      
      // Update appointment status
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
      
      // Create audit log
      await createAuditLog('UPDATE', 'appointment', appointmentId, { 
        status: APPOINTMENT_STATUS.CANCELLED,
        reason 
      });
      
      // Trigger notification
      window.dispatchEvent(new CustomEvent('appointmentCancelled', {
        detail: appointment
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
  }, [appointments, createAuditLog]);
  
  /**
   * RESCHEDULE APPOINTMENT
   * Flow: Check Appointments → Reschedule → Update Appointment
   */
  const rescheduleAppointment = useCallback(async (appointmentId, newDate, newTime) => {
    setLoading(true);
    setError(null);
    
    try {
      const appointment = appointments.find(a => a.appointmentId === appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }
      
      // Update appointment
      setAppointments(prev => prev.map(apt =>
        apt.appointmentId === appointmentId
          ? {
              ...apt,
              scheduledDate: newDate,
              scheduledTime: newTime,
              status: APPOINTMENT_STATUS.SCHEDULED,
              updatedAt: new Date().toISOString()
            }
          : apt
      ));
      
      // Create audit log
      await createAuditLog('UPDATE', 'appointment', appointmentId, {
        action: 'reschedule',
        oldDate: appointment.scheduledDate,
        oldTime: appointment.scheduledTime,
        newDate,
        newTime
      });
      
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
  }, [appointments, createAuditLog]);

  // ============================================
  // STAFF OPERATIONS - useCallback
  // ============================================
  
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

  // ============================================
  // RESET ALL DATA - Clear appointments
  // ============================================
  
  const resetAllData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Clear appointments
      setAppointments([]);
      
      // Create audit log
      await createAuditLog('RESET', 'all', 'system', { action: 'reset_all_data' });
      
      setLoading(false);
      return { success: true, message: 'All data has been reset successfully' };
    } catch (err) {
      console.error('Error resetting data:', err);
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [createAuditLog]);

  // ============================================
  // CONTEXT VALUE - useMemo
  // ============================================
  
  const contextValue = useMemo(() => ({
    // State
    appointments,
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
    updateAppointmentStatus,
    resetAllData,
    
    // Helpers
    setError
  }), [appointments, loading, error, userAppointments, upcomingAppointments, appointmentStats, bookAppointment, getAppointmentDetails, cancelAppointment, rescheduleAppointment, updateAppointmentStatus, resetAllData]);

  return (
    <AppointmentContext.Provider value={contextValue}>
      {children}
    </AppointmentContext.Provider>
  );
};

export { AppointmentContext };
export default AppointmentContext;