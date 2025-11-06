// ============================================
// CALENDAR PAGE - UPDATED WITH NEW HOOKS
// src/pages/Calendar.jsx
// ============================================

import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import useAppointments from '../hooks/useAppointments';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button, Card, Badge } from '../components/common';
import './Calendar.css';

const Calendar = () => {
  const { isStaff } = useAuth();
  const { userAppointments } = useAppointments();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

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
    userAppointments.forEach(apt => {
      const key = `${apt.scheduledDate}-${apt.scheduledTime}`;
      map[key] = apt;
    });
    return map;
  }, [userAppointments]);

  // ✅ useCallback: Get appointment for specific slot
  const getAppointmentForSlot = useCallback((date, time) => {
    const dateStr = formatDate(date);
    const key = `${dateStr}-${time}`;
    return appointmentMap[key] || null;
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
        <Button 
          variant="primary"
          icon={CalendarIcon}
          onClick={goToToday}
        >
          Today
        </Button>
      </div>

      {/* Calendar Controls */}
      <Card className="calendar-controls">
        <button className="nav-btn" onClick={previousWeek}>
          <ChevronLeft size={20} />
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

        <button className="nav-btn" onClick={nextWeek}>
          <ChevronRight size={20} />
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
                        <div className={`appointment-block ${appointment.status.toLowerCase()}`}>
                          <div className="appointment-time">{appointment.scheduledTime}</div>
                          <div className="appointment-student">
                            {isStaff ? appointment.studentId : appointment.reason}
                          </div>
                          <div className="appointment-concern">
                            {appointment.reason || 'Medical Appointment'}
                          </div>
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