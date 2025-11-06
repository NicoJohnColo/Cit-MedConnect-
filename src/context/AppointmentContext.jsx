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
  useContext
} from 'react';
import { useAuth } from './AuthContext';
import { 
  SampleAppointments, 
  SampleTimeSlots,
  APPOINTMENT_STATUS,
  generateId,
  formatDate,
  formatTime
} from '../types';

// Generate time slots for the next 30 days, including weekends, 8:00 AM - 8:00 PM with 11:30 AM - 1:30 PM break
const generateTimeSlots = () => {
  console.log('Generating time slots...');
  const slots = [];
  const now = new Date();
  const endDate = new Date();
  endDate.setDate(now.getDate() + 30); // Generate for next 30 days
  console.log(`Generating slots from ${now.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
  
  // Time slot duration in minutes
  const slotDuration = 30;
  
  // Work hours (in 24-hour format)
  const workDayStart = 8;    // 8:00 AM
  const workDayEnd = 20;     // 8:00 PM
  const breakStart = 11.5;   // 11:30 AM
  const breakEnd = 13.5;     // 1:30 PM
  
  let currentDate = new Date(now);
  currentDate.setHours(0, 0, 0, 0);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
    
    // Generate slots for all days of the week
    let currentHour = workDayStart;
    
    while (currentHour < workDayEnd) {
      // Skip break time (11:30 AM - 1:30 PM)
      if (currentHour >= breakStart && currentHour < breakEnd) {
        currentHour = breakEnd;
        if (currentHour >= workDayEnd) break;
      }
      
      const hours = Math.floor(currentHour);
      const minutes = currentHour % 1 === 0.5 ? 30 : 0;
      const time = `${String(hours).padStart(2, '0')}:${minutes === 0 ? '00' : minutes}`;
      
      slots.push({
        slotId: `SLOT-${currentDate.toISOString().split('T')[0]}-${time.replace(':', '')}`,
        date: currentDate.toISOString().split('T')[0],
        day: dayName,
        time: time,
        duration: slotDuration,
        isAvailable: true,
        staffId: 'DEFAULT-STAFF',
        location: 'Main Clinic',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      });
      
      // Move to next time slot (30 minutes)
      currentHour += 0.5;
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  console.log(`Generated ${slots.length} time slots`);
  console.log('Sample slots:', slots.slice(0, 5)); // Log first 5 slots
  return slots;
};

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
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================================
  // INITIALIZE DATA - useEffect
  // Initialize with generated time slots
  useEffect(() => {
    const initData = () => {
      try {
        console.log('Initializing appointment data...');
        
        // Clear existing time slots from localStorage to force refresh
        localStorage.removeItem('medconnect_timeslots');
        console.log('Cleared existing time slots from localStorage');
        
        // Load appointments from localStorage or use sample data
        const storedAppointments = localStorage.getItem('medconnect_appointments');
        
        if (storedAppointments) {
          setAppointments(JSON.parse(storedAppointments));
          console.log('Loaded existing appointments from localStorage');
        } else {
          console.log('No stored appointments found, using sample data');
          setAppointments(SampleAppointments);
          localStorage.setItem('medconnect_appointments', JSON.stringify(SampleAppointments));
        }
        
        // Always generate new time slots to ensure they're up to date
        console.log('Generating new time slots...');
        const generatedSlots = generateTimeSlots();
        
        // Log detailed information about the generated slots
        console.log(`Generated ${generatedSlots.length} time slots`);
        
        // Group slots by date for better visualization
        const slotsByDate = generatedSlots.reduce((acc, slot) => {
          if (!acc[slot.date]) {
            acc[slot.date] = [];
          }
          acc[slot.date].push(slot.time);
          return acc;
        }, {});
        
        // Log first 3 days of slots
        const firstThreeDays = Object.entries(slotsByDate).slice(0, 3);
        console.log('Sample of generated time slots by date:');
        firstThreeDays.forEach(([date, times]) => {
          console.log(`${date} (${new Date(date).toLocaleDateString('en-US', { weekday: 'long' })}):`, 
            times.sort().join(', '));
        });
        
        // Verify break times are excluded
        const hasBreakTimeSlots = generatedSlots.some(slot => {
          const [hours, minutes] = slot.time.split(':').map(Number);
          const slotTime = hours + minutes / 60;
          return slotTime >= 11.5 && slotTime < 13.5; // 11:30 AM - 1:30 PM
        });
        
        if (hasBreakTimeSlots) {
          console.warn('Warning: Some slots were generated during break time (11:30 AM - 1:30 PM)');
        } else {
          console.log('Break time (11:30 AM - 1:30 PM) is correctly excluded from available slots');
        }
        
        // Save the new slots
        setTimeSlots(generatedSlots);
        localStorage.setItem('medconnect_timeslots', JSON.stringify(generatedSlots));
        console.log('Time slots saved to localStorage');
      } catch (err) {
        console.error('Failed to initialize appointment data:', err);
        setError(err.message);
      }
    };
    
    initData();
    
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Auto-save to localStorage
  useEffect(() => {
    if (appointments.length > 0) {
      localStorage.setItem('medconnect_appointments', JSON.stringify(appointments));
    }
  }, [appointments]);
  
  useEffect(() => {
    if (timeSlots.length > 0) {
      localStorage.setItem('medconnect_timeslots', JSON.stringify(timeSlots));
    }
  }, [timeSlots]);

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
  
  // ✅ Get available time slots
  const availableSlots = useMemo(() => {
    return timeSlots.filter(slot => slot.isAvailable);
  }, [timeSlots]);
  
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
  // SLOT MANAGEMENT - useCallback
  // ============================================
  
  /**
   * VIEW AVAILABLE TIME SLOTS
   * Flow: Student Dashboard → Book Appointment → View Available Time Slots
   */
  const getAvailableSlots = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Getting available slots. Current timeSlots:', timeSlots.length);
      console.log('Available slots:', availableSlots.length);
      
      let filtered = [...availableSlots]; // Create a copy of available slots
      
      // Apply filters if provided
      if (filters.date) {
        console.log('Filtering by date:', filters.date);
        filtered = filtered.filter(slot => slot.date === filters.date);
      }
      if (filters.location) {
        console.log('Filtering by location:', filters.location);
        filtered = filtered.filter(slot => slot.location === filters.location);
      }
      if (filters.staffId) {
        console.log('Filtering by staff ID:', filters.staffId);
        filtered = filtered.filter(slot => slot.staffId === filters.staffId);
      }
      
      console.log('Filtered slots:', filtered.length);
      setLoading(false);
      return { success: true, data: filtered };
    } catch (err) {
      console.error('Error in getAvailableSlots:', err);
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [availableSlots, timeSlots]);
  
  /**
   * CHECK SLOT AVAILABILITY
   * Flow: Select Time Slot → Check Availability?
   */
  const checkSlotAvailability = useCallback((slotId) => {
    const slot = timeSlots.find(s => s.slotId === slotId);
    return slot ? slot.isAvailable : false;
  }, [timeSlots]);
  
  /**
   * UPDATE TIME SLOT BOOKINGS
   * Flow: Confirm Booking → Update Time Slot Bookings
   */
  const updateSlotAvailability = useCallback(async (slotId, isAvailable) => {
    try {
      setTimeSlots(prev => prev.map(slot => 
        slot.slotId === slotId 
          ? { ...slot, isAvailable, updatedAt: new Date().toISOString() }
          : slot
      ));
      
      // Create audit log
      await createAuditLog('UPDATE', 'timeslot', slotId, { isAvailable });
      
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [createAuditLog]);

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
      // Step 1: Validate slot availability
      const isAvailable = checkSlotAvailability(appointmentData.slotId);
      if (!isAvailable) {
        throw new Error('Selected time slot is no longer available. Please choose another slot.');
      }
      
      // Step 2: Create appointment record
      const newAppointment = {
        appointmentId: generateId('APT'),
        studentId: user.userId,
        staffId: appointmentData.staffId || 'STAFF-AUTO',
        slotId: appointmentData.slotId,
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
      
      // Step 3: Update appointments state
      setAppointments(prev => {
        const updatedAppointments = [...prev, newAppointment];
        // Save to localStorage
        localStorage.setItem('medconnect_appointments', JSON.stringify(updatedAppointments));
        return updatedAppointments;
      });
      
      // Step 4: Update time slot booking
      await updateSlotAvailability(appointmentData.slotId, false);
      
      // Step 5: Create audit log
      await createAuditLog('CREATE', 'appointment', newAppointment.appointmentId, appointmentData);
      
      // Step 6: Send notification (handled by NotificationContext)
      window.dispatchEvent(new CustomEvent('appointmentBooked', {
        detail: newAppointment
      }));
      
      // Step 7: Force a re-render of the appointments list
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
  }, [user, checkSlotAvailability, updateSlotAvailability, createAuditLog]);

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
   * Flow: Check Appointments → Cancel → Free Time Slot → Create Audit Log
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
      
      // Free up the time slot
      await updateSlotAvailability(appointment.slotId, true);
      
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
  }, [appointments, updateSlotAvailability, createAuditLog]);
  
  /**
   * RESCHEDULE APPOINTMENT
   * Flow: Check Appointments → Reschedule → View Available Slots → Book New Slot
   */
  const rescheduleAppointment = useCallback(async (appointmentId, newSlotId) => {
    setLoading(true);
    setError(null);
    
    try {
      const appointment = appointments.find(a => a.appointmentId === appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }
      
      // Check new slot availability
      const isAvailable = checkSlotAvailability(newSlotId);
      if (!isAvailable) {
        throw new Error('Selected time slot is not available');
      }
      
      const newSlot = timeSlots.find(s => s.slotId === newSlotId);
      if (!newSlot) {
        throw new Error('Time slot not found');
      }
      
      // Free old slot
      await updateSlotAvailability(appointment.slotId, true);
      
      // Book new slot
      await updateSlotAvailability(newSlotId, false);
      
      // Update appointment
      setAppointments(prev => prev.map(apt =>
        apt.appointmentId === appointmentId
          ? {
              ...apt,
              slotId: newSlotId,
              scheduledDate: newSlot.date,
              scheduledTime: newSlot.time,
              status: APPOINTMENT_STATUS.SCHEDULED,
              updatedAt: new Date().toISOString()
            }
          : apt
      ));
      
      // Create audit log
      await createAuditLog('UPDATE', 'appointment', appointmentId, {
        action: 'reschedule',
        oldSlotId: appointment.slotId,
        newSlotId
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
  }, [appointments, timeSlots, checkSlotAvailability, updateSlotAvailability, createAuditLog]);

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
  
  /**
   * CREATE TIME SLOT (Staff Only)
   * Flow: Staff Dashboard → Manage Slots → Create Slot
   */
  const createTimeSlot = useCallback(async (slotData) => {
    setLoading(true);
    setError(null);
    
    try {
      if (user?.role !== 'staff') {
        throw new Error('Unauthorized: Staff access required');
      }
      
      const newSlot = {
        slotId: generateId('SLOT'),
        date: slotData.date,
        time: slotData.time,
        duration: slotData.duration || 30,
        isAvailable: true,
        staffId: user.userId,
        location: slotData.location || 'Main Clinic',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setTimeSlots(prev => [...prev, newSlot]);
      
      // Create audit log
      await createAuditLog('CREATE', 'timeslot', newSlot.slotId, slotData);
      
      setLoading(false);
      return { success: true, data: newSlot };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [user, createAuditLog]);

  // ============================================
  // RESET ALL DATA - Clear appointments and time slots
  // ============================================
  
  const resetAllData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Clear appointments
      setAppointments([]);
      localStorage.removeItem('medconnect_appointments');
      
      // Reset time slots
      const generatedSlots = generateTimeSlots();
      setTimeSlots(generatedSlots);
      localStorage.setItem('medconnect_timeslots', JSON.stringify(generatedSlots));
      
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
    timeSlots,
    loading,
    error,
    
    // Computed
    userAppointments,
    availableSlots,
    upcomingAppointments,
    appointmentStats,
    
    // Student Functions
    getAvailableSlots,
    checkSlotAvailability,
    bookAppointment,
    getAppointmentDetails,
    cancelAppointment,
    rescheduleAppointment,
    
    // Staff Functions
    updateAppointmentStatus,
    createTimeSlot,
    resetAllData,
    
    // Helpers
    setError
  }), [
    appointments,
    timeSlots,
    loading,
    error,
    userAppointments,
    availableSlots,
    upcomingAppointments,
    appointmentStats,
    getAvailableSlots,
    checkSlotAvailability,
    bookAppointment,
    getAppointmentDetails,
    cancelAppointment,
    rescheduleAppointment,
    updateAppointmentStatus,
    createTimeSlot
  ]);

  return (
    <AppointmentContext.Provider value={contextValue}>
      {children}
    </AppointmentContext.Provider>
  );
};

export { AppointmentContext };
export default AppointmentContext;