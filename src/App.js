import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './App.css';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import DateTimePicker from './components/DateTimePicker';

// Navigation button styles
const navButtonStyle = {
  padding: '8px 20px',
  backgroundColor: '#8a1b1b',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9em',
  fontWeight: '500',
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  ':hover': {
    backgroundColor: '#6e1616',
    transform: 'translateY(-1px)'
  },
  ':active': {
    transform: 'translateY(0)'
  }
};

// Setup the localizer for the calendar
const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

function SectionButton({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 12px',
      borderRadius: 12,
      border: '1px solid #e5e5e5',
      background: active ? '#8a1b1b' : '#fff',
      color: active ? '#fff' : '#333',
      cursor: 'pointer',
      marginRight: 8,
    }}>{label}</button>
  );
}

// Sample doctor data - in a real app, this would come from an API
const doctors = {
  'dr_smith': { 
    name: 'Dr. Sarah Smith', 
    specialization: 'Cardiologist', 
    location: 'Main Hospital, Floor 3, Room 302',
    image: 'https://randomuser.me/api/portraits/women/44.jpg'
  },
  'dr_johnson': { 
    name: 'Dr. Michael Johnson', 
    specialization: 'Dermatologist', 
    location: 'East Wing, Floor 1, Room 105',
    image: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  'dr_williams': { 
    name: 'Dr. Emily Williams', 
    specialization: 'Pediatrician', 
    location: 'Children\'s Wing, Floor 2, Room 215',
    image: 'https://randomuser.me/api/portraits/women/68.jpg'
  }
};

function Appointments({ appointments, setAppointments, addNotification, role }) {
  const [selectedDateTime, setSelectedDateTime] = useState(null);
  const [reason, setReason] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  
  // Assign a random doctor to each appointment for demo purposes
  const appointmentsWithDoctors = useMemo(() => {
    const doctorIds = Object.keys(doctors);
    return appointments.map(appt => ({
      ...appt,
      doctor: doctors[doctorIds[Math.floor(Math.random() * doctorIds.length)]]
    }));
  }, [appointments]);
  
  const scheduled = useMemo(() => 
    appointmentsWithDoctors.filter(a => a.status === 'Scheduled' || a.status === 'Upcoming'), 
    [appointmentsWithDoctors]
  );
  
  function schedule() {
    if (!selectedDateTime || !reason.trim() || !selectedDoctor) return;
    
    const formattedDate = selectedDateTime.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    const formattedTime = selectedDateTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    const appt = { 
      id: Date.now(), 
      date: formattedDate, 
      time: formattedTime,
      datetime: selectedDateTime.toISOString(),
      reason: reason.trim(),
      status: 'Scheduled',
      doctor: doctors[selectedDoctor] || doctors[Object.keys(doctors)[0]]
    };
    
    setAppointments(prev => [appt, ...prev]);
    addNotification({
      id: Date.now(),
      message: `Appointment scheduled for ${formattedDate} at ${formattedTime}`,
      read: false,
      timestamp: new Date().toISOString()
    });
    setSelectedDateTime(null);
    setReason('');
  }

  function updateStatus(id, status) {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  function getStatusStyle(status) {
    switch(status.toLowerCase()) {
      case 'scheduled':
      case 'upcoming':
        return { 
          bg: '#E6F7FF', 
          text: '#1890FF',
          border: '#91D5FF',
          label: 'Upcoming'
        };
      case 'completed':
        return { 
          bg: '#F6FFED', 
          text: '#52C41A',
          border: '#B7EB8F',
          label: 'Completed'
        };
      case 'cancelled':
        return { 
          bg: '#FFF2F0', 
          text: '#FF4D4F',
          border: '#FFCCC7',
          label: 'Cancelled'
        };
      default:
        return { 
          bg: '#FAFAFA', 
          text: '#8C8C8C',
          border: '#F0F0F0',
          label: status
        };
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>My Appointments</h2>
        <button 
          onClick={() => setSelectedDateTime(selectedDateTime || new Date())}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: '#8a1b1b',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '500',
            transition: 'all 0.2s',
            ':hover': {
              backgroundColor: '#6e1616',
              transform: 'translateY(-1px)'
            }
          }}
        >
          <span>+</span> Schedule New
        </button>
      </div>

      {/* Appointment Form */}
      {(selectedDateTime || reason) && (
        <div style={{ 
          backgroundColor: '#F8F9FA', 
          padding: '20px', 
          borderRadius: '12px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>New Appointment</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Date & Time</div>
              <DateTimePicker
                selected={selectedDateTime}
                onChange={(date) => setSelectedDateTime(date)}
                minDate={new Date()}
                placeholderText="Select date and time"
                showTimeSelect
                timeIntervals={30}
                dateFormat="MMMM d, yyyy h:mm aa"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <div style={{ marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Select Doctor</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(doctors).map(([id, doctor]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedDoctor(id)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: `2px solid ${selectedDoctor === id ? '#8a1b1b' : '#e5e5e5'}`,
                      background: selectedDoctor === id ? '#F9F0F0' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      ':hover': {
                        borderColor: '#8a1b1b',
                        backgroundColor: '#F9F0F0'
                      }
                    }}
                  >
                    <div style={{ 
                      fontWeight: '600',
                      color: '#333',
                      marginBottom: '4px'
                    }}>
                      {doctor.name}
                    </div>
                    <div style={{ 
                      fontSize: '13px',
                      color: '#666',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{
                        backgroundColor: '#E6F7FF',
                        color: '#1890FF',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {doctor.specialization}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Reason for Appointment</div>
              <input 
                type="text" 
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                placeholder="Enter reason for appointment"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button 
              onClick={() => {
                setSelectedDateTime(null);
                setReason('');
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                background: 'white',
                cursor: 'pointer',
                fontWeight: '500',
                ':hover': {
                  backgroundColor: '#f5f5f5'
                }
              }}
            >
              Cancel
            </button>
            <button 
              onClick={schedule}
              disabled={!selectedDateTime || !reason.trim() || !selectedDoctor}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#8a1b1b',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500',
                opacity: (!selectedDateTime || !reason.trim() || !selectedDoctor) ? 0.6 : 1,
                pointerEvents: (!selectedDateTime || !reason.trim() || !selectedDoctor) ? 'none' : 'auto',
                transition: 'all 0.2s',
                ':hover': {
                  backgroundColor: '#6e1616',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Confirm Appointment
            </button>
          </div>
        </div>
      )}

      {/* Appointments List */}
      <div style={{ marginTop: '32px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Upcoming Appointments</h3>
          <div style={{ fontSize: '14px', color: '#8C8C8C' }}>{scheduled.length} appointments</div>
        </div>

        {scheduled.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            backgroundColor: '#FAFAFA',
            borderRadius: '12px',
            border: '1px dashed #E8E8E8'
          }}>
            <div style={{ fontSize: '16px', color: '#8C8C8C', marginBottom: '8px' }}>
              No upcoming appointments
            </div>
            <button 
              onClick={() => setSelectedDateTime(selectedDateTime || new Date())}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#8a1b1b',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500',
                marginTop: '12px',
                ':hover': {
                  backgroundColor: '#6e1616',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Schedule an Appointment
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {scheduled.map(appt => {
              const status = getStatusStyle(appt.status);
              const isUpcoming = appt.status.toLowerCase() === 'scheduled' || appt.status.toLowerCase() === 'upcoming';
              
              return (
                <div 
                  key={appt.id} 
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                    borderLeft: '4px solid #8a1b1b',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    ':hover': {
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr auto',
                    padding: '20px',
                    gap: '20px',
                    '@media (max-width: 768px)': {
                      gridTemplateColumns: '1fr',
                      gap: '16px'
                    }
                  }}>
                    {/* Date & Time */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#8C8C8C',
                        marginBottom: '4px'
                      }}>
                        {appt.date}
                      </div>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: '600',
                        color: '#262626'
                      }}>
                        {appt.time}
                      </div>
                      <div style={{
                        marginTop: 'auto',
                        padding: '4px 10px',
                        backgroundColor: status.bg,
                        color: status.text,
                        border: `1px solid ${status.border}`,
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        width: 'fit-content',
                        marginTop: '12px'
                      }}>
                        {status.label}
                      </div>
                    </div>

                    {/* Doctor Info with Image */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{
                        position: 'relative',
                        width: '64px',
                        height: '64px',
                        flexShrink: 0,
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '2px solid #f0f0f0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <img 
                          src={appt.doctor?.image || 'https://randomuser.me/api/portraits/lego/1.jpg'} 
                          alt={appt.doctor?.name || 'Doctor'}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        />
                        {isUpcoming && (
                          <div style={{
                            position: 'absolute',
                            bottom: '4px',
                            right: '4px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: '#52C41A',
                            border: '2px solid white',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                        )}
                      </div>
                      <div>
                        <div style={{ 
                          fontSize: '16px', 
                          fontWeight: '600',
                          marginBottom: '4px',
                          color: '#262626'
                        }}>
                          {appt.doctor?.name || 'Dr. John Doe'}
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '8px',
                          flexWrap: 'wrap'
                        }}>
                          <span style={{
                            backgroundColor: '#E6F7FF',
                            color: '#1890FF',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span>👨‍⚕️</span>
                            {appt.doctor?.specialization || 'General Practitioner'}
                          </span>
                          {appt.doctor?.location && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              color: '#666',
                              backgroundColor: '#f5f5f5',
                              padding: '4px 10px',
                              borderRadius: '12px'
                            }}>
                              <span>🏥</span>
                              {appt.doctor.location.split(',')[0]}
                            </span>
                          )}
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '13px',
                          color: '#595959'
                        }}>
                          <span>📍</span>
                          <span>{appt.doctor?.location || 'Main Hospital, Floor 2'}</span>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '13px',
                          color: '#595959',
                          marginTop: '4px'
                        }}>
                          <span>📝</span>
                          <span>{appt.reason || 'General Consultation'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: '8px',
                      justifyContent: 'center',
                      '@media (max-width: 768px)': {
                        flexDirection: 'row',
                        marginTop: '12px',
                        justifyContent: 'flex-start'
                      }
                    }}>
                      {isUpcoming && (
                        <button 
                          onClick={() => window.alert('Joining video call...')}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#8a1b1b',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: '500',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s',
                            ':hover': {
                              backgroundColor: '#6e1616',
                              transform: 'translateY(-1px)'
                            },
                            '@media (max-width: 768px)': {
                              width: '100%',
                              justifyContent: 'center'
                            }
                          }}
                        >
                          <span>▶</span> Join Call
                        </button>
                      )}
                      <button 
                        onClick={() => updateStatus(appt.id, 'Rescheduled')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: '1px solid #D9D9D9',
                          background: 'white',
                          color: '#262626',
                          cursor: 'pointer',
                          fontWeight: '500',
                          fontSize: '14px',
                          transition: 'all 0.2s',
                          ':hover': {
                            backgroundColor: '#FAFAFA',
                            borderColor: '#8C8C8C'
                          },
                          '@media (max-width: 768px)': {
                            width: '100%',
                            justifyContent: 'center'
                          }
                        }}
                      >
                        Reschedule
                      </button>
                      <button 
                        onClick={() => updateStatus(appt.id, 'Cancelled')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: '1px solid #FFCCC7',
                          background: 'white',
                          color: '#FF4D4F',
                          cursor: 'pointer',
                          fontWeight: '500',
                          fontSize: '14px',
                          transition: 'all 0.2s',
                          ':hover': {
                            backgroundColor: '#FFF2F0',
                            borderColor: '#FFA39E'
                          },
                          '@media (max-width: 768px)': {
                            width: '100%',
                            justifyContent: 'center'
                          }
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function groupByDate(items) {
  return items.reduce((acc, a) => {
    const key = a.date;
    acc[key] = acc[key] || [];
    acc[key].push(a);
    return acc;
  }, {});
}

function AppointmentCalendar({ appointments }) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Convert appointments to events format for the calendar
  const events = useMemo(() => {
    console.log('Appointments:', appointments); // Debug log
    
    return appointments.map(appt => {
      // Ensure datetime is a valid Date object
      const start = new Date(appt.datetime);
      const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 minutes duration
      
      if (isNaN(start.getTime())) {
        console.error('Invalid date for appointment:', appt);
        return null;
      }
      
      const timeString = appt.time || start.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      
      return {
        id: appt.id,
        title: appt.reason,
        start,
        end,
        status: appt.status || 'scheduled',
        reason: appt.reason,
        time: timeString,
        doctor: appt.doctor || { name: 'Dr. Unknown', specialization: 'General' },
        allDay: false,
      };
    }).filter(Boolean); // Remove any null entries from invalid dates
  }, [appointments]);

  // Custom event component to show different colors based on status
  const eventCardStyle = (status) => ({
    height: '100%',
    width: '100%',
    padding: '4px',
    borderRadius: '4px',
    fontSize: '0.65em',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    boxSizing: 'border-box',
    overflow: 'hidden',
    borderLeft: '2px solid ' + ({
      'scheduled': '#8a1b1b',
      'completed': '#4CAF50',
      'cancelled': '#f44336',
      'rescheduled': '#FFC107',
      'upcoming': '#2196F3'
    }[status?.toLowerCase()] || '#8a1b1b'),
    backgroundColor: 'white',
    color: '#333',
    margin: '0',
    lineHeight: '1.1'
  });

  const eventTimeStyle = {
    fontWeight: '600',
    margin: '0',
    fontSize: '0.7em',
    color: '#8a1b1b',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: '1.1'
  };

  const eventDoctorStyle = {
    fontWeight: '600',
    fontSize: '0.7em',
    margin: '0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: '1.1'
  };

  const eventReasonStyle = {
    margin: '0',
    fontSize: '0.65em',
    color: '#555',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: '1.1'
  };

  const eventStatusStyle = (status) => ({
    // Simplified status style - now handled inline in EventComponent
  });

  const EventComponent = ({ event }) => {
    const status = event.status?.toLowerCase() || 'scheduled';
    const statusColor = {
      'scheduled': '#8a1b1b',
      'completed': '#4CAF50',
      'cancelled': '#f44336',
      'rescheduled': '#FFC107',
      'upcoming': '#2196F3'
    }[status] || '#8a1b1b';
    
    return (
      <div style={eventCardStyle(status)}>
        <div style={{
          ...eventTimeStyle,
          fontWeight: 'bold',
          fontSize: '0.75em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {event.doctor?.name || 'Dr. Unknown'}
        </div>
        <div style={{
          ...eventTimeStyle,
          fontSize: '0.7em',
          color: '#666',
          marginTop: '2px'
        }}>
          {event.time}
        </div>
        <div style={eventReasonStyle}>
          {event.reason}
        </div>
        <div style={{
          ...eventStatusStyle(status),
          display: 'inline-block',
          padding: '0 4px',
          borderRadius: '3px',
          fontSize: '0.6em',
          backgroundColor: statusColor + '20',
          color: statusColor,
          marginTop: '2px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
          fontWeight: '600'
        }}>
          {status.toUpperCase()}
        </div>
      </div>
    );
  };

  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  }, []); 

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  return (
    <div style={{ 
      height: 'calc(100vh - 200px)',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <div>
          <h2 style={{ 
            margin: 0, 
            fontSize: '1.5rem',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span>📅</span>
            <span>Appointment Calendar</span>
          </h2>
          <p style={{ 
            margin: '8px 0 0 0', 
            color: '#666',
            fontSize: '0.95em'
          }}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '8px',
          backgroundColor: '#f8f9fa',
          padding: '4px',
          borderRadius: '8px'
        }}>
          <span style={{
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '0.8em',
            fontWeight: '500',
            backgroundColor: '#FEE2E2',
            color: '#B91C1C',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#B91C1C'
            }}></span>
            Scheduled
          </span>
          <span style={{
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '0.8em',
            fontWeight: '500',
            backgroundColor: '#DCFCE7',
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#166534'
            }}></span>
            Completed
          </span>
          <span style={{
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '0.8em',
            fontWeight: '500',
            backgroundColor: '#FEF3C7',
            color: '#92400E',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#92400E'
            }}></span>
            Rescheduled
          </span>
        </div>
      </div>

      <div style={{ 
        flex: 1,
        minHeight: '500px',
        maxHeight: 'calc(100vh - 300px)',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ 
            height: '100%',
            padding: '8px'
          }}
          view="month"
          date={currentDate}
          onNavigate={setCurrentDate}
          onView={() => {}}
          views={['month']}
          selectable
          onSelectEvent={handleSelectEvent}
          components={{
            event: EventComponent,
            toolbar: (props) => (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <button 
                  onClick={() => {
                    const today = new Date();
                    setCurrentDate(today);
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    ':hover': {
                      backgroundColor: '#eee'
                    }
                  }}
                >
                  <span>📅</span>
                  Today
                </button>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <button 
                    onClick={() => {
                      const prevMonth = new Date(currentDate);
                      prevMonth.setMonth(prevMonth.getMonth() - 1);
                      setCurrentDate(prevMonth);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.2em',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      ':hover': {
                        backgroundColor: '#f5f5f5'
                      }
                    }}
                  >
                    ◀
                  </button>
                  
                  <h3 style={{ 
                    margin: 0,
                    fontSize: '1.2em',
                    fontWeight: '600',
                    color: '#333',
                    minWidth: '180px',
                    textAlign: 'center'
                  }}>
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  
                  <button 
                    onClick={() => {
                      const nextMonth = new Date(currentDate);
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      setCurrentDate(nextMonth);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.2em',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      ':hover': {
                        backgroundColor: '#f5f5f5'
                      }
                    }}
                  >
                    ▶
                  </button>
                </div>
                
                <div style={{ width: '80px' }}></div> {/* For alignment */}
              </div>
            )
          }}
          eventPropGetter={(event) => {
            let backgroundColor = '#8a1b1b';
            if (event.status === 'Completed') backgroundColor = '#4CAF50';
            if (event.status === 'Cancelled') backgroundColor = '#f44336';
            if (event.status === 'Rescheduled') backgroundColor = '#FFC107';
            return { style: { backgroundColor } };
          }}
        />
      </div>

      {/* Event Details Modal */}
      {isModalOpen && selectedEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}>
            <h3>Appointment Details</h3>
            <div style={{ margin: '16px 0' }}>
              <p><strong>Date:</strong> {format(selectedEvent.start, 'MMMM d, yyyy')}</p>
              <p><strong>Time:</strong> {selectedEvent.time}</p>
              <p><strong>Reason:</strong> {selectedEvent.reason}</p>
              <p>
                <strong>Status:</strong> 
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  backgroundColor: 
                    selectedEvent.status === 'Scheduled' ? '#8a1b1b' :
                    selectedEvent.status === 'Completed' ? '#4CAF50' :
                    selectedEvent.status === 'Cancelled' ? '#f44336' : '#FFC107',
                  color: 'white',
                  marginLeft: '8px',
                  fontSize: '12px',
                }}>
                  {selectedEvent.status}
                </span>
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                onClick={handleCloseModal}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MedicalRecords({ records }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const x = q.toLowerCase();
    return records.filter(r => r.title.toLowerCase().includes(x) || r.notes.toLowerCase().includes(x));
  }, [q, records]);
  return (
    <div>
      <h3>Medical Records</h3>
      <input placeholder="Search" value={q} onChange={e => setQ(e.target.value)} />
      <ul>
        {filtered.map(r => (
          <li key={r.id}><strong>{r.title}</strong> — {r.notes}</li>
        ))}
      </ul>
    </div>
  );
}

function Notifications({ notifications, markRead, unreadCount }) {
  return (
    <div>
      <h3>Notifications</h3>
      <div style={{ marginBottom: 8 }}>Unread: {unreadCount}</div>
      <ul>
        {notifications.map(n => (
          <li key={n.id} style={{ margin: '6px 0' }}>
            <span>[{n.read ? 'read' : 'new'}] {n.message}</span>
            {!n.read && <button style={{ marginLeft: 8 }} onClick={() => markRead(n.id)}>Mark read</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Profile({ profile, setProfile }) {
  function setField(k, v) { setProfile(prev => ({ ...prev, [k]: v })); }
  return (
    <div>
      <h3>Profile</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, maxWidth: 600 }}>
        <input value={profile.name} onChange={e => setField('name', e.target.value)} placeholder="Full Name" />
        <input value={profile.email} onChange={e => setField('email', e.target.value)} placeholder="Email" />
        <input value={profile.contact} onChange={e => setField('contact', e.target.value)} placeholder="Contact" />
        <input value={profile.address} onChange={e => setField('address', e.target.value)} placeholder="Address" />
      </div>
      <div style={{ marginTop: 8, color: '#4a4' }}>Changes are saved in memory.</div>
    </div>
  );
}

function DashboardShell() {
  const { currentUser, logout, logAudit } = useAuth();
  const [section, setSection] = useState('appointments');
  const [appointments, setAppointments] = useState(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return [
      { 
        id: 1, 
        date: now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        datetime: now.toISOString(),
        reason: 'Initial Consultation', 
        status: 'Scheduled' 
      },
      { 
        id: 2, 
        date: tomorrow.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 
        time: '10:30 AM',
        datetime: new Date(tomorrow.setHours(10, 30, 0, 0)).toISOString(),
        reason: 'Follow-up', 
        status: 'Scheduled' 
      }
    ];
  });
  const [records] = useState([
    { id: 1, title: 'Vaccination', notes: 'Completed immunization schedule.' },
    { id: 2, title: 'Allergy', notes: 'Peanut allergy noted.' },
  ]);
  const [notifications, setNotifications] = useState([]);
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  const [profile, setProfile] = useState({ name: currentUser?.name || '', email: '', contact: '', address: '' });

  function addNotification(message) {
    const item = { id: Date.now(), message, read: false };
    setNotifications(prev => [item, ...prev]);
    logAudit('notification_generated', { message });
  }
  function markRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  // Reminder simulation
  useEffect(() => {
    const t = setInterval(() => {
      const upcoming = appointments.find(a => a.status === 'Scheduled');
      if (upcoming) addNotification(`Reminder: ${upcoming.date} ${upcoming.time} — ${upcoming.reason}`);
    }, 15000);
    return () => clearInterval(t);
  }, [appointments]);

  return (
    <div style={{ padding: '16px 16px 24px 16px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginRight: 'auto' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>CIT MedConnect+</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['appointments','calendar','records','profile'].map(s => (
              <SectionButton key={s} label={s} active={section===s} onClick={() => setSection(s)} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => setSection('notifications')} 
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ':hover': { backgroundColor: 'rgba(0,0,0,0.05)' }
            }}
          >
            🔔 
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '0',
                right: '0',
                backgroundColor: '#ff4d4f',
                color: 'white',
                borderRadius: '10px',
                padding: '0 6px',
                fontSize: '0.7rem',
                lineHeight: '1.2'
              }}>
                {unreadCount}
              </span>
            )}
          </button>
          <span style={{ color: '#666' }}>{currentUser.name} ({currentUser.role})</span>
          <button 
            onClick={logout} 
            style={{
              background: 'none',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              padding: '4px 12px',
              cursor: 'pointer',
              ':hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            Logout
          </button>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
        {section === 'appointments' && (
          <Appointments appointments={appointments} setAppointments={setAppointments} addNotification={addNotification} role={currentUser.role} />
        )}
        {section === 'calendar' && <AppointmentCalendar appointments={appointments} />}
        {section === 'records' && (currentUser.role === 'student' || currentUser.role === 'doctor' || currentUser.role === 'admin') && (
          <MedicalRecords records={records} />
        )}
        {section === 'records' && !(currentUser.role === 'student' || currentUser.role === 'doctor' || currentUser.role === 'admin') && (
          <div>Access denied. Records available to students, doctors, admins.</div>
        )}
        {section === 'notifications' && (
          <Notifications notifications={notifications} markRead={markRead} unreadCount={unreadCount} />
        )}
        {section === 'profile' && (
          <Profile profile={profile} setProfile={setProfile} />
        )}
      </div>
    </div>
  );
}

export default function App() {
  const { currentUser } = useAuth();
  const [authView, setAuthView] = useState('login');
  if (!currentUser) {
    return authView === 'login' ? (
      <Login onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthView('login')} />
    );
  }
  return <DashboardShell />;
}

