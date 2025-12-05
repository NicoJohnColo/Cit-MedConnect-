// ============================================
// APPOINTMENTS PAGE - WITH SLOT MANAGEMENT
// src/pages/Appointments.jsx
// ============================================

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useAppointments from '../hooks/useAppointments';
import { useAuditLog } from '../context/AuditLogContext';
import { isStaff } from '../services/auth-helper';
import { 
  Search, 
  Calendar, 
  MapPin, 
  Eye, 
  Trash2, 
  Plus,
  X,
  CheckCircle,
  Clock,
  Save,
  Edit,
  CalendarClock
} from 'lucide-react';
import { Button, Input, Modal, Card, Badge, Alert } from '../components/common';
import './Appointments.css';

const Appointments = () => {
  const location = useLocation();
  const { user } = useAuth();
  const userIsStaff = isStaff(user);
  const { logAction } = useAuditLog();
  const { 
    appointments: userAppointments = [], 
    loading, 
    bookAppointment, 
    cancelAppointment,
    successAppointment,
    rescheduleAppointment,
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    availableSlots = [],
    refreshAppointments
  } = useAppointments();

  // Debug: Log appointments data
  console.log('Appointments page - userAppointments:', userAppointments);
  console.log('Appointments page - user role:', user?.role);
  console.log('Appointments page - user ID:', user?.userId);
  
  // Set up event listener for appointment updates
  useEffect(() => {
    const handleAppointmentsUpdated = () => {
      refreshAppointments && refreshAppointments();
    };
    
    window.addEventListener('appointmentsUpdated', handleAppointmentsUpdated);
    
    return () => {
      window.removeEventListener('appointmentsUpdated', handleAppointmentsUpdated);
    };
  }, [refreshAppointments]);
  
  const [filters, setFilters] = useState({
    search: '',
    date: '',
    status: '',
    location: ''
  });
  
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [bookingData, setBookingData] = useState({
    slotId: '',
    date: '',
    time: '',
    reason: '',
    symptoms: '',
    location: 'Main Clinic'
  });

  const [slotFormData, setSlotFormData] = useState({
    date: '',
    time: '',
    endTime: '',
    maxBookings: 1,
    currentBookings: 0,
    location: 'Main Clinic'
  });

  const [slotMode, setSlotMode] = useState('create');
  const [selectedSlotEdit, setSelectedSlotEdit] = useState(null);

  useEffect(() => {
    if (location.state?.openBooking) {
      setShowBookingModal(true);
    }
    if (location.state?.openSlotManagement) {
      setShowSlotModal(true);
    }
    if (location.state?.viewAppointment) {
      const apt = userAppointments.find(a => a.appointmentId === location.state.viewAppointment);
      if (apt) {
        setSelectedAppointment(apt);
        setShowDetailsModal(true);
      }
    }
  }, [location.state, userAppointments]);

  const filteredAppointments = useMemo(() => {
    return userAppointments.filter(apt => {
      const matchesSearch = 
        !filters.search ||
        apt.reason?.toLowerCase().includes(filters.search.toLowerCase()) ||
        apt.symptoms?.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = !filters.status || apt.status === filters.status;
      const matchesLocation = !filters.location || apt.location === filters.location;
      const matchesDate = !filters.date || apt.scheduledDate === filters.date;
      
      return matchesSearch && matchesStatus && matchesLocation && matchesDate;
    });
  }, [userAppointments, filters]);
  
  const slotsByDate = useMemo(() => {
    const grouped = {};
    
    const sortedSlots = [...availableSlots].sort((a, b) => {
      if (a.date === b.date) {
        return a.time.localeCompare(b.time);
      }
      return new Date(a.date) - new Date(b.date);
    });

    sortedSlots.forEach(slot => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = [];
      }
      grouped[slot.date].push(slot);
    });

    return grouped;
  }, [availableSlots]);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleResetFilters = useCallback(() => {
    setFilters({
      search: '',
      date: '',
      status: '',
      location: ''
    });
  }, []);
  
  const handleStartBooking = useCallback(() => {
    setShowBookingModal(true);
    setBookingStep(1);
    setSelectedSlot(null);
    setBookingData({
      slotId: '',
      date: '',
      time: '',
      reason: '',
      symptoms: '',
      location: 'Main Clinic'
    });
    setMessage({ type: '', text: '' });
  }, []);
  
  const handleSelectSlot = useCallback((slot) => {
    setSelectedSlot(slot);
    setBookingData(prev => ({
      ...prev,
      slotId: slot.slotId,
      date: slot.date,
      time: slot.time,
      location: slot.location
    }));
    setBookingStep(2);
    setMessage({ type: '', text: '' });
  }, []);
  
  const handleBookingInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleGoToConfirmation = useCallback(() => {
    if (!bookingData.reason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a reason for your appointment' });
      return;
    }
    
    setBookingStep(3);
    setMessage({ type: '', text: '' });
  }, [bookingData]);
  
  const handleConfirmBooking = useCallback(async () => {
    try {
      const slot = availableSlots.find(s => s.slotId === bookingData.slotId);
      if (!slot) {
        setMessage({ 
          type: 'error', 
          text: 'The selected time slot is no longer available. Please choose another slot.' 
        });
        setBookingStep(1); // Go back to slot selection
        return;
      }

      let result;
      if (bookingData.isReschedule) {
        // Use the new reschedule API endpoint
        result = await rescheduleAppointment(bookingData.appointmentId, bookingData.slotId);
        if (result.success) {
          setMessage({ type: 'success', text: result.message });
          setTimeout(() => {
            setShowBookingModal(false);
            setBookingStep(1);
            setSelectedSlot(null);
            setMessage({ type: '', text: '' });
          }, 1000);
        } else {
          setMessage({ type: 'error', text: result.error });
        }
      } else {
        // Normal booking flow
        result = await bookAppointment(bookingData);
        if (result.success) {
          if (userIsStaff) {
            const action = 'Booked';
            logAction(`${action} Appointment`, `${action} appointment for ${bookingData.date} at ${bookingData.time}`);
          }
          
          const newAppointment = {
            ...bookingData,
            appointmentId: `appt-${Date.now()}`,
            status: 'scheduled',
            scheduledDate: bookingData.date,
            scheduledTime: bookingData.time,
            location: bookingData.location || 'Main Clinic'
          };
          
          setSelectedAppointment(newAppointment);
          setMessage({ type: 'success', text: result.message });
          
          setTimeout(() => {
            setShowBookingModal(false);
            setShowDetailsModal(true); // Show details of the newly created appointment
            setBookingStep(1);
            setSelectedSlot(null);
            setMessage({ type: '', text: '' });
          }, 1000);
        } else {
          setMessage({ type: 'error', text: result.error });
        }
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      setMessage({ 
        type: 'error', 
        text: 'An error occurred while processing your request. Please try again.' 
      });
    }
  }, [bookingData, bookAppointment, rescheduleAppointment, userIsStaff, logAction, availableSlots]);
  
  const handleViewDetails = useCallback((appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  }, []);

  const handleStartReschedule = useCallback((appointment) => {
    setSelectedAppointment(appointment);
    setShowBookingModal(true);
    setBookingStep(1);
    setSelectedSlot(null);
    setBookingData({
      slotId: '',
      date: '',
      time: '',
      reason: appointment.reason,
      symptoms: appointment.symptoms,
      location: appointment.location || 'Main Clinic',
      isReschedule: true,
      appointmentId: appointment.appointmentId
    });
    setMessage({ type: '', text: '' });
  }, []);

  const handleSuccessAppointment = useCallback(async (appointmentId) => {
    if (!window.confirm('Are you sure you want to mark this appointment as successful?')) {
      return;
    }
    
    const result = await successAppointment(appointmentId);
    
    if (result.success) {
      logAction('Success Appointment', `Marked appointment ID: ${appointmentId} as successful`);
      setMessage({ type: 'success', text: result.message });
      setShowDetailsModal(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } else {
      setMessage({ type: 'error', text: result.error });
    }
  }, [successAppointment, logAction]);

  const handleCancelAppointment = useCallback(async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }
    
    const result = await cancelAppointment(appointmentId, userIsStaff ? 'Cancelled by staff' : 'Cancelled by user');
    
    if (result.success) {
      if (userIsStaff) {
        logAction('Cancelled Appointment', `Cancelled appointment ID: ${appointmentId}`);
      }
      
      setMessage({ type: 'success', text: result.message });
      setShowDetailsModal(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } else {
      setMessage({ type: 'error', text: result.error });
    }
  }, [cancelAppointment, userIsStaff, logAction]);

  const handleOpenSlotManagement = useCallback(() => {
    setShowSlotModal(true);
    setSlotMode('create');
    setSlotFormData({
      date: '',
      time: '',
      endTime: '',
      maxBookings: 1,
      currentBookings: 0,
      location: 'Main Clinic'
    });
  }, []);

  const handleSlotInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setSlotFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleUpdateSlot = useCallback(async () => {
    if (!slotFormData.date || !slotFormData.time) {
      setMessage({ type: 'error', text: 'Please fill in all slot fields' });
      return;
    }
    
    try {
      let result;
      
      if (slotMode === 'create') {
        result = await createTimeSlot({
          date: slotFormData.date,
          time: slotFormData.time,
          endTime: slotFormData.endTime,
          maxBookings: slotFormData.maxBookings,
          currentBookings: slotFormData.currentBookings,
          location: slotFormData.location
        });
      } else {
        result = await updateTimeSlot(selectedSlotEdit.slotId, {
          date: slotFormData.date,
          time: slotFormData.time,
          endTime: slotFormData.endTime,
          maxBookings: slotFormData.maxBookings,
          currentBookings: slotFormData.currentBookings,
          location: slotFormData.location
        });
      }
      
      if (result.success) {
        const action = slotMode === 'create' ? 'created' : 'updated';
        logAction(`${action.charAt(0).toUpperCase() + action.slice(1)} Time Slot`, `${action.charAt(0).toUpperCase() + action.slice(1)} slot for ${slotFormData.date} at ${slotFormData.time}`);
        
        setMessage({ type: 'success', text: result.message });
        setSlotFormData({ date: '', time: '', endTime: '', maxBookings: 1, currentBookings: 0, location: 'Main Clinic' });
        setSelectedSlotEdit(null);
        setSlotMode('create');
        
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      console.error('Error updating slot:', error);
      setMessage({ type: 'error', text: 'An error occurred while managing the time slot' });
    }
  }, [slotFormData, slotMode, selectedSlotEdit, createTimeSlot, updateTimeSlot, logAction]);

  const handleEditSlot = useCallback((slot) => {
    setSlotMode('edit');
    setSelectedSlotEdit(slot);
    setSlotFormData({
      date: slot.date,
      time: slot.time,
      endTime: slot.endTime || '',
      maxBookings: slot.maxBookings || 1,
      currentBookings: slot.currentBookings || 0,
      location: slot.location
    });
  }, []);

  const handleDeleteSlot = useCallback(async (slot) => {
    if (window.confirm('Are you sure you want to delete this time slot?')) {
      try {
        const result = await deleteTimeSlot(slot.slotId);
        
        if (result.success) {
          logAction('Deleted Time Slot', `Deleted slot for ${slot.date} at ${slot.time}`);
          setMessage({ type: 'success', text: result.message });
          
          setTimeout(() => {
            setMessage({ type: '', text: '' });
          }, 3000);
        } else {
          setMessage({ type: 'error', text: result.error });
        }
      } catch (error) {
        console.error('Error deleting slot:', error);
        setMessage({ type: 'error', text: 'An error occurred while deleting the time slot' });
      }
    }
  }, [deleteTimeSlot, logAction]);

  if (loading && userAppointments.length === 0) {
    return null;
  }

  return (
    <div className="appointments-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">
            {userIsStaff 
              ? 'Manage appointments and time slots' 
              : 'View and manage your upcoming appointments'
            }
          </p>
        </div>
        <div className="header-actions">
          {userIsStaff && (
            <Button 
              variant="secondary"
              icon={Clock}
              onClick={handleOpenSlotManagement}
            >
              Manage Slots
            </Button>
          )}
          {!userIsStaff && (
            <Button 
              variant="primary"
              icon={Plus}
              onClick={handleStartBooking}
            >
              Book Appointment
            </Button>
          )}
        </div>
      </div>

      {message.text && !showBookingModal && !showSlotModal && (
        <Alert 
          type={message.type}
          icon={message.type === 'success' ? CheckCircle : null}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      {/* Filters */}
      <Card className="appointments-filters">
        <div className="filter-group">
          <div className="filter-input-wrapper">
            <Search className="filter-icon" size={18} />
            <input
              type="text"
              name="search"
              placeholder="Search appointments..."
              value={filters.search}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>

          <div className="filter-input-wrapper">
            <Calendar className="filter-icon" size={18} />
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>

          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="success">Success</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div className="filter-input-wrapper">
            <MapPin className="filter-icon" size={18} />
            <select
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              className="filter-input"
            >
              <option value="">All Locations</option>
              <option value="Main Clinic">Main Clinic</option>
            </select>
          </div>
          
          {(filters.search || filters.date || filters.status || filters.location) && (
            <Button 
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              icon={X}
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Appointments Table - Full Width */}
      <Card className="table-container" style={{ width: '100%' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Date & Time</th>
              {userIsStaff && <th>User ID</th>}
              <th>Reason</th>
              <th>Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => (
                <tr key={appointment.appointmentId}>
                  <td>
                    <strong>{appointment.scheduledTime}</strong>
                    <br />
                    <small>
                      {new Date(appointment.scheduledDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </small>
                  </td>
                  {userIsStaff && (
                    <td>
                      <span className="user-id">{appointment.user?.schoolId || appointment.studentId || 'N/A'}</span>
                    </td>
                  )}
                  <td>
                    <strong>{appointment.reason}</strong>
                    {appointment.symptoms && (
                      <>
                        <br />
                        <small className="text-muted">{appointment.symptoms.substring(0, 50)}...</small>
                      </>
                    )}
                  </td>
                  <td>
                    <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    {appointment.location || 'Main Clinic'}
                  </td>
                  <td>
                    <Badge variant={appointment.status.toLowerCase()}>
                      {appointment.status}
                    </Badge>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn action-btn-view" 
                        title="View Details"
                        onClick={() => handleViewDetails(appointment)}
                      >
                        <Eye size={14} />
                      </button>
                      
                      {/* Reschedule button - only show for students here */}
                      {!userIsStaff && appointment.status !== 'cancelled' && appointment.status !== 'completed' && appointment.status !== 'success' && (
                        <button 
                          className="action-btn action-btn-edit"
                          title="Reschedule"
                          onClick={() => handleStartReschedule(appointment)}
                        >
                          <CalendarClock size={14} />
                        </button>
                      )}
                      
                      {/* Student-only actions */}
                      {!userIsStaff && appointment.status !== 'cancelled' && appointment.status !== 'completed' && appointment.status !== 'success' && (
                        <button 
                          className="action-btn action-btn-delete" 
                          title="Cancel"
                          onClick={() => handleCancelAppointment(appointment.appointmentId)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      
                      {/* Staff-only actions */}
                      {userIsStaff && (
                        <>
                          {appointment.status !== 'cancelled' && appointment.status !== 'completed' && appointment.status !== 'success' && (
                            <button 
                              className="action-btn action-btn-edit"
                              title="Reschedule"
                              onClick={() => handleStartReschedule(appointment)}
                            >
                              <CalendarClock size={14} />
                            </button>
                          )}
                          <button 
                            className="action-btn action-btn-success" 
                            title="Mark as Success"
                            onClick={() => handleSuccessAppointment(appointment.appointmentId)}
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button 
                            className="action-btn action-btn-delete" 
                            title="Cancel"
                            onClick={() => handleCancelAppointment(appointment.appointmentId)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={userIsStaff ? "6" : "5"} style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="empty-state">
                    <Calendar size={48} />
                    <h3>No appointments found</h3>
                    <p>
                      {filters.search || filters.date || filters.status || filters.location
                        ? 'Try adjusting your filters'
                        : userIsStaff 
                          ? 'No appointments scheduled. Manage time slots to create availability.'
                          : 'Book your first appointment to get started'
                      }
                    </p>
                    {userIsStaff && (
                      <Button variant="primary" onClick={handleOpenSlotManagement}>
                        Manage Slots
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Booking Modal - Multi-Step */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title={
          bookingStep === 1 ? 'Select Time Slot' :
          bookingStep === 2 ? 'Appointment Details' :
          'Confirm Booking'
        }
        size="lg"
      >
        {message.text && (
          <Alert type={message.type} icon={message.type === 'success' ? CheckCircle : null}>
            {message.text}
          </Alert>
        )}
        
        {bookingStep === 1 && (
          <div className="booking-step">
            <h3>Choose an available time slot</h3>
            <div className="slots-container">
              {Object.keys(slotsByDate).length > 0 ? (
                Object.entries(slotsByDate).map(([date, slots]) => (
                  <div key={date} className="slots-day-group">
                    <h4 className="slots-date">
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </h4>
                    <div className="slots-grid">
                      {slots.map(slot => (
                        <button
                          key={slot.slotId}
                          className={`slot-button ${selectedSlot?.slotId === slot.slotId ? 'selected' : ''}`}
                          onClick={() => handleSelectSlot(slot)}
                        >
                          <Clock size={16} />
                          <span>{slot.time}</span>
                          <small>{slot.location}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <Calendar size={48} />
                  <p>No available slots at the moment</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {bookingStep === 2 && (
          <div className="booking-step">
            <div className="selected-slot-summary">
              <Calendar size={20} />
              <div>
                <strong>Selected Slot:</strong>{' '}
                {new Date(bookingData.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })} at {bookingData.time}
              </div>
            </div>
            
            <Input
              label="Reason for Visit"
              name="reason"
              value={bookingData.reason}
              onChange={handleBookingInputChange}
              placeholder="e.g., Regular checkup, Consultation, etc."
              required
            />
            
            <Input
              label="Location"
              name="location"
              value={bookingData.location || 'Main Clinic'}
              onChange={handleBookingInputChange}
              placeholder="e.g., Main Clinic, Room 101, etc."
            />
            
            <Textarea
              label="Symptoms (Optional)"
              name="symptoms"
              value={bookingData.symptoms}
              onChange={handleBookingInputChange}
              placeholder="Describe your symptoms or concerns..."
              rows={4}
            />
            
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setBookingStep(1)}>
                Back
              </Button>
              <Button variant="primary" onClick={handleGoToConfirmation}>
                Continue
              </Button>
            </div>
          </div>
        )}
        
        {bookingStep === 3 && (
          <div className="booking-step">
            <h3>Confirm Your Appointment</h3>
            <div className="confirmation-details">
              <div className="confirmation-row">
                <span className="label">Date:</span>
                <span className="value">
                  {new Date(bookingData.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="confirmation-row">
                <span className="label">Time:</span>
                <span className="value">{bookingData.time}</span>
              </div>
              <div className="confirmation-row">
                <span className="label">Location:</span>
                <span className="value">{bookingData.location}</span>
              </div>
              <div className="confirmation-row">
                <span className="label">Reason:</span>
                <span className="value">{bookingData.reason}</span>
              </div>
              {bookingData.symptoms && (
                <div className="confirmation-row">
                  <span className="label">Symptoms:</span>
                  <span className="value">{bookingData.symptoms}</span>
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setBookingStep(2)}>
                Back
              </Button>
              <Button 
                variant="primary"
                onClick={handleConfirmBooking}
                loading={loading}
                icon={CheckCircle}
              >
                Confirm Booking
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Slot Management Modal (Staff Only) */}
      {userIsStaff && (
        <Modal
          isOpen={showSlotModal}
          onClose={() => setShowSlotModal(false)}
          title="Manage Time Slots"
          size="lg"
        >
          {message.text && (
            <Alert type={message.type}>
              {message.text}
            </Alert>
          )}

          <div className="slot-management">
            <div className="slot-form">
              <h4>{slotMode === 'create' ? 'Create New Slot' : 'Edit Slot'}</h4>
              <div className="form-row">
                <Input
                  label="Date"
                  type="date"
                  name="date"
                  value={slotFormData.date}
                  onChange={handleSlotInputChange}
                  required
                />
                <Input
                  label="Time"
                  type="time"
                  name="time"
                  value={slotFormData.time}
                  onChange={handleSlotInputChange}
                  required
                />
                <Input
                  label="End Time"
                  type="time"
                  name="endTime"
                  value={slotFormData.endTime}
                  onChange={handleSlotInputChange}
                />
                <div className="input-group">
                  <label className="input-label">Max Bookings</label>
                  <input
                    type="number"
                    name="maxBookings"
                    value={slotFormData.maxBookings}
                    onChange={handleSlotInputChange}
                    className="form-input"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Current Bookings</label>
                  <input
                    type="number"
                    name="currentBookings"
                    value={slotFormData.currentBookings}
                    onChange={handleSlotInputChange}
                    className="form-input"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Location</label>
                  <select
                    name="location"
                    value={slotFormData.location}
                    onChange={handleSlotInputChange}
                    className="form-input"
                  >
                    <option value="Main Clinic">Main Clinic</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                {slotMode === 'edit' && (
                  <Button 
                    variant="secondary"
                    onClick={() => {
                      setSlotMode('create');
                      setSelectedSlotEdit(null);
                      setSlotFormData({
                        date: '',
                        time: '',
                        endTime: '',
                        maxBookings: 1,
                        currentBookings: 0,
                        location: 'Main Clinic'
                      });
                    }}
                  >
                    Cancel Edit
                  </Button>
                )}
                <Button 
                  variant="primary"
                  icon={Save}
                  onClick={handleUpdateSlot}
                >
                  {slotMode === 'create' ? 'Add Time Slot' : 'Update Slot'}
                </Button>
              </div>
            </div>

            <div className="slots-list">
              <h4>Available Slots ({availableSlots.length})</h4>
              <div className="slots-table">
                {availableSlots.map(slot => (
                  <div key={slot.slotId} className="slot-item">
                    <div className="slot-info">
                      <strong>{new Date(slot.date).toLocaleDateString()} - {slot.time}</strong>
                      <small>{slot.location} • {slot.isAvailable ? 'Available' : 'Booked'}</small>
                    </div>
                    <div className="slot-actions">
                      <button
                        className="action-btn action-btn-edit"
                        onClick={() => handleEditSlot(slot)}
                        disabled={!slot.isAvailable}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="action-btn action-btn-delete"
                        onClick={() => handleDeleteSlot(slot)}
                        disabled={!slot.isAvailable}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Appointment Details"
        size="md"
      >
        {selectedAppointment && (
          <div className="appointment-details">
            <div className="detail-row">
              <span className="label">Date & Time:</span>
              <span className="value">
                {new Date(selectedAppointment.scheduledDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })} at {selectedAppointment.scheduledTime}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Status:</span>
              <Badge variant={selectedAppointment.status.toLowerCase()}>
                {selectedAppointment.status}
              </Badge>
            </div>
            <div className="detail-row">
              <span className="label">Location:</span>
              <span className="value">{selectedAppointment.location || 'Main Clinic'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Reason:</span>
              <span className="value">{selectedAppointment.reason}</span>
            </div>
            {selectedAppointment.symptoms && (
              <div className="detail-row">
                <span className="label">Symptoms:</span>
                <span className="value">{selectedAppointment.symptoms}</span>
              </div>
            )}
            
            {selectedAppointment.status === 'scheduled' && (
              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <Button 
                  variant="secondary"
                  icon={CalendarClock}
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleStartReschedule(selectedAppointment);
                  }}
                >
                  Reschedule
                </Button>
                <Button 
                  variant="danger"
                  icon={Trash2}
                  onClick={() => handleCancelAppointment(selectedAppointment.appointmentId)}
                >
                  Cancel Appointment
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

// Textarea Component
const Textarea = ({ label, name, value, onChange, placeholder, rows = 4, required = false }) => {
  return (
    <div className="input-group">
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="form-input"
        required={required}
      />
    </div>
  );
};

export default Appointments;