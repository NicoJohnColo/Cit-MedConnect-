import { useContext } from 'react';
import { AppointmentContext } from '../context/AppointmentContext';

/**
 * CUSTOM HOOK - useAppointments
 * Provides access to appointment context
 * @returns {Object} Appointment context with all available methods and state
 * @throws {Error} If used outside of AppointmentProvider
 */
const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within AppointmentProvider');
  }
  return context;
};

export default useAppointments;