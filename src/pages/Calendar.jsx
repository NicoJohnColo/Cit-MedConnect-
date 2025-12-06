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
  
  // ✅ useMemo: Generate time slots with 15-minute intervals (8 AM - 7 PM)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        // Skip lunch break times (11:30 AM - 1:30 PM)
        if ((hour === 11 && minute >= 30) || (hour === 12) || (hour === 13 && minute < 30)) {
          continue;
        }
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          hour,
          minute
        });
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
        
        // Parse hours and minutes for better time slot calculation
        const [hours, minutes] = timeValue.split(':').map(Number);
        const timeInMinutes = hours * 60 + minutes;
        
        // Format date to YYYY-MM-DD
        const dateStr = formatDate(new Date(dateValue));
        const key = `${dateStr}-${timeValue}`;
        
        // Store the parsed time for easier calculations
        map[key] = {
          ...apt,
          _timeInMinutes: timeInMinutes,
          _timeString: timeValue
        };
        
        console.log(`Mapping appointment: key=${key}, timeInMinutes=${timeInMinutes}`, apt);
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
    
    // Check for exact match first
    const exactKey = `${dateStr}-${normalizedTime}`;
    const exactAppointment = appointmentMap[exactKey];
    if (exactAppointment) {
      return exactAppointment;
    }
    
    // If no exact match, find the closest appointment within 15 minutes
    const [hours, minutes] = normalizedTime.split(':').map(Number);
    const slotTimeInMinutes = hours * 60 + minutes;
    
    // Find all appointments for this date
    const dateAppointments = Object.entries(appointmentMap)
      .filter(([key]) => key.startsWith(dateStr))
      .map(([_, apt]) => apt);
    
    // Find the closest appointment within 15 minutes
    const closestAppointment = dateAppointments.find(apt => {
      const timeDiff = Math.abs(apt._timeInMinutes - slotTimeInMinutes);
      return timeDiff <= 15; // Within 15 minutes of the slot
    });
    
    return closestAppointment || null;
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
            {timeSlots.map((slot, timeIndex) => {
              const isLunchBreak = (slot.hour === 11 && slot.minute >= 30) || 
                                 (slot.hour === 12) || 
                                 (slot.hour === 13 && slot.minute < 30);
              const isAvailable = !isLunchBreak; // Add your availability logic here
              
              return (
                <div key={timeIndex} className="time-row">
                  <div className="time-cell">{slot.time}</div>
                  {weekDays.map((day, dayIndex) => {
                    const appointment = getAppointmentForSlot(day, slot.time);
                    const isSlotBooked = !!appointment;
                    const isCurrentSlot = appointment && 
                                      appointment._timeString === slot.time;
                    
                    // Only show appointment in the exact time slot or if it's the closest one
                    if (appointment && !isCurrentSlot && 
                        Math.abs(appointment._timeInMinutes - (slot.hour * 60 + slot.minute)) > 15) {
                      return <div key={dayIndex} className="slot-cell" />;
                    }
                    
                    return (
                      <div
                        key={dayIndex}
                        className={`slot-cell ${isSlotBooked ? 'has-appointment' : ''} ${isLunchBreak ? 'lunch-break' : ''}`}
                        title={isLunchBreak ? 'Lunch Break (11:30 AM - 1:30 PM)' : ''}
                      >
                        {isLunchBreak ? (
                          <div className="appointment-block lunch">
                            <div className="appointment-time">LUNCH</div>
                            <div className="appointment-student">Not Available</div>
                          </div>
                        ) : isSlotBooked ? (
                          <div 
                            className={`appointment-block ${(appointment.status || 'scheduled').toLowerCase()}`}
                            title={`${isStaff ? `Student: ${appointment.studentId || 'Unknown'}\n` : ''}Status: ${appointment.status || 'Scheduled'}\nReason: ${appointment.reason || 'N/A'}\nTime: ${appointment._timeString || ''}`}
                            style={{
                              backgroundColor: appointment.status === 'completed' ? '#e8f5e9' : 
                                            appointment.status === 'cancelled' ? '#ffebee' : 
                                            appointment.status === 'pending' ? '#fff3e0' : '#e3f2fd'
                            }}
                          >
                            <div className="appointment-time">
                              {appointment._timeString}
                              {appointment.status === 'pending' && ' ⏳'}
                              {appointment.status === 'completed' && ' ✓'}
                              {appointment.status === 'cancelled' && ' ✗'}
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
                              <div className="appointment-notes">
                                {appointment.notes.substring(0, 30)}{appointment.notes.length > 30 ? '...' : ''}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="appointment-block available" title="Available">
                            {/* Empty div to maintain layout */}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Legend */}
      <Card className="calendar-legend">
        <h3>Legend</h3>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#e3f2fd' }}>🔵</div>
            <span>Booked</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#ffebee' }}>🔴</div>
            <span>Unavailable / Lunch</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Calendar;