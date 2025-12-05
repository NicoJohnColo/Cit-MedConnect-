// ============================================
// CALENDAR PAGE - UPDATED WITH NEW HOOKS
// src/pages/Calendar.jsx
// ============================================

import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import useAppointments from '../hooks/useAppointments';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button, Card } from '../components/common';
import './Calendar.css';

const Calendar = () => {
  const { isStaff } = useAuth();
  const { userAppointments, loading, error } = useAppointments();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Debug: Log appointments when they change
  React.useEffect(() => {
    console.log('=== CALENDAR DEBUG ===');
    console.log('Is Staff:', isStaff);
    console.log('User appointments:', userAppointments);
    console.log('Appointments count:', userAppointments?.length || 0);
    if (userAppointments && userAppointments.length > 0) {
      console.log('First appointment:', userAppointments[0]);
      console.log('Date field:', userAppointments[0].scheduledDate || userAppointments[0].date);
      console.log('Time field:', userAppointments[0].scheduledTime || userAppointments[0].time);
      console.log('Status:', userAppointments[0].status);
      console.log('Student ID:', userAppointments[0].studentId);
    }
    console.log('All appointments:', userAppointments);
  }, [userAppointments, isStaff]);

  // ============================================
  // TIME SLOTS CONFIGURATION
  // ============================================
  
  // ✅ useMemo: Generate time slots (8 AM - 6 PM)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  }, []);

  // ============================================
  // DATE UTILITIES
  // ============================================
  
  // ✅ useCallback: Get week days starting from Monday
  const getWeekDays = useCallback((date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  }, []);

  // ✅ useMemo: Calculate current week days
  const weekDays = useMemo(() => 
    getWeekDays(currentDate), 
    [currentDate, getWeekDays]
  );

  // ✅ useCallback: Format date to YYYY-MM-DD
  const formatDate = useCallback((date) => {
    return date.toISOString().split('T')[0];
  }, []);

  // ✅ useCallback: Check if date is today
  const isToday = useCallback((date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  }, [formatDate]);

  // ✅ useCallback: Check if date is selected
  const isSelected = useCallback((date) => {
    return formatDate(date) === formatDate(selectedDate);
  }, [formatDate, selectedDate]);

  // ============================================
  // APPOINTMENT UTILITIES
  // ============================================
  
  // ✅ useMemo: Map appointments by date and time for quick lookup
  const appointmentMap = useMemo(() => {
    const map = {};
    
    if (!userAppointments || userAppointments.length === 0) {
      console.log('No appointments to map');
      return map;
    }
    
    userAppointments.forEach(apt => {
      try {
        // Get date - handle multiple possible field names
        const dateValue = apt.scheduledDate || apt.date || apt.appointmentDate;
        if (!dateValue) {
          console.warn('Appointment missing date:', apt);
          return;
        }
        
        // Get time - handle multiple possible field names and formats
        let timeValue = apt.scheduledTime || apt.time || apt.appointmentTime;
        if (!timeValue) {
          console.warn('Appointment missing time:', apt);
          return;
        }
        
        // Normalize time format to HH:MM (remove seconds if present)
        if (timeValue.length === 8) { // HH:MM:SS format
          timeValue = timeValue.substring(0, 5); // Get HH:MM only
        }
        
        // Format date to YYYY-MM-DD
        const dateStr = formatDate(new Date(dateValue));
        const key = `${dateStr}-${timeValue}`;
        
        console.log(`Mapping appointment: key=${key}, appointment=`, apt);
        map[key] = apt;
      } catch (error) {
        console.error('Error mapping appointment:', apt, error);
      }
    });
    
    console.log('Final appointment map:', map);
    console.log('Total appointments mapped:', Object.keys(map).length);
    return map;
  }, [userAppointments, formatDate]);

  // ✅ useCallback: Get appointment for specific slot
  const getAppointmentForSlot = useCallback((date, time) => {
    const dateStr = formatDate(date);
    
    // Normalize time to HH:MM format
    let normalizedTime = time;
    if (time.length === 8) {
      normalizedTime = time.substring(0, 5);
    }
    
    const key = `${dateStr}-${normalizedTime}`;
    const appointment = appointmentMap[key];
    
    // Debug only for appointments that exist
    if (appointment) {
      console.log(`Found appointment for slot: ${key}`, appointment);
    }
    
    return appointment || null;
  }, [formatDate, appointmentMap]);

  // ============================================
  // NAVIGATION HANDLERS
  // ============================================
  
  // ✅ useCallback: Navigate to previous week
  const previousWeek = useCallback(() => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  }, [currentDate]);

  // ✅ useCallback: Navigate to next week
  const nextWeek = useCallback(() => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  }, [currentDate]);

  // ✅ useCallback: Go to today
  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  }, []);

  // ✅ useCallback: Select a date
  const handleDateSelect = useCallback((date) => {
    setSelectedDate(date);
  }, []);

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="calendar-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">
            {isStaff 
              ? 'View all scheduled appointments'
              : 'View and manage your appointment schedule'
            }
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {userAppointments && userAppointments.length > 0 && (
            <span className="badge" style={{ 
              background: '#4caf50', 
              color: 'white', 
              padding: '0.5rem 1rem', 
              borderRadius: '20px',
              fontSize: '0.875rem'
            }}>
              {userAppointments.length} Appointment{userAppointments.length !== 1 ? 's' : ''}
            </span>
          )}
          <Button 
            variant="primary"
            icon={CalendarIcon}
            onClick={goToToday}
          >
            Today
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <Card style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading appointments...</p>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card style={{ padding: '2rem', background: '#fee', border: '1px solid #fcc' }}>
          <p style={{ color: '#c00' }}>Error loading appointments: {error}</p>
        </Card>
      )}

      {/* No Appointments Message */}
      {!loading && !error && userAppointments && userAppointments.length === 0 && (
        <Card style={{ padding: '2rem', textAlign: 'center', marginBottom: '1rem' }}>
          <p>
            {isStaff 
              ? 'No appointments have been scheduled yet. Students can book appointments from the Appointments page.'
              : 'No appointments scheduled yet. Book an appointment to see it here!'}
          </p>
        </Card>
      )}

      {/* Calendar Controls */}
      <Card className="calendar-controls">
        <button className="nav-btn" onClick={previousWeek} aria-label="Previous week">
          <ChevronLeft size={24} />
        </button>
        
        <div className="calendar-title">
          <h2>
            {weekDays[0].toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </h2>
          <p className="week-range">
            {weekDays[0].toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })} - {' '}
            {weekDays[6].toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <button className="nav-btn" onClick={nextWeek} aria-label="Next week">
          <ChevronRight size={24} />
        </button>
      </Card>

      {/* Calendar Grid */}
      <Card className="calendar-container">
        <div className="calendar-grid">
          {/* Header Row - Days */}
          <div className="calendar-header">
            <div className="time-column-header">Time</div>
            {weekDays.map((day, index) => (
              <div
                key={index}
                className={`day-header ${isToday(day) ? 'today' : ''} ${isSelected(day) ? 'selected' : ''}`}
                onClick={() => handleDateSelect(day)}
              >
                <div className="day-name">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="day-number">
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots Grid */}
          <div className="calendar-body">
            {timeSlots.map((time, timeIndex) => (
              <div key={timeIndex} className="time-row">
                <div className="time-cell">{time}</div>
                {weekDays.map((day, dayIndex) => {
                  const appointment = getAppointmentForSlot(day, time);
                  return (
                    <div
                      key={dayIndex}
                      className={`slot-cell ${appointment ? 'has-appointment' : ''}`}
                    >
                      {appointment && (
                        <div 
                          className={`appointment-block ${(appointment.status || 'scheduled').toLowerCase()}`}
                          title={`${isStaff ? `Student: ${appointment.studentId || 'Unknown'}\n` : ''}Status: ${appointment.status}\nReason: ${appointment.reason || 'N/A'}\nTime: ${(appointment.scheduledTime || appointment.time || '').substring(0, 5)}`}
                        >
                          <div className="appointment-time">
                            {(appointment.scheduledTime || appointment.time || '').substring(0, 5)}
                          </div>
                          <div className="appointment-student">
                            {isStaff 
                              ? (appointment.user?.schoolId || appointment.studentId || 'Unknown Student') 
                              : (appointment.reason || 'Appointment')}
                          </div>
                          <div className="appointment-concern">
                            {isStaff 
                              ? (appointment.reason || 'Medical Appointment')
                              : `${appointment.location || 'Clinic'}`}
                          </div>
                          {isStaff && appointment.notes && (
                            <div className="appointment-notes" style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8 }}>
                              {appointment.notes.substring(0, 30)}{appointment.notes.length > 30 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Legend */}
      <Card className="calendar-legend">
        <h3>Legend</h3>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color scheduled"></div>
            <span>Scheduled</span>
          </div>
          <div className="legend-item">
            <div className="legend-color completed"></div>
            <span>Completed</span>
          </div>
          <div className="legend-item">
            <div className="legend-color cancelled"></div>
            <span>Cancelled</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Calendar;