// ============================================
// DASHBOARD PAGE - DUAL POV (Student & Staff)
// src/pages/Dashboard.jsx
// ============================================

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useAppointments from '../hooks/useAppointments';
import { useNotifications } from '../context/NotificationContext';
import { 
  Calendar, 
  Search, 
  User, 
  Stethoscope, 
  Clock, 
  TrendingUp,
  Bell,
  ArrowRight,
  FileText,
  Activity
} from 'lucide-react';
import { Button, Card } from '../components/common';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userFullName, isStaff } = useAuth();
  const { upcomingAppointments, appointmentStats, refreshAppointments } = useAppointments();
  
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
  const { unreadCount } = useNotifications();
  
  const [searchData, setSearchData] = useState({
    name: '',
    specialty: '',
    available: ''
  });

  // Greeting based on time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);
  
  // Stats for dashboard
  const stats = useMemo(() => {
    if (isStaff) {
      return [
        {
          title: 'Total Appointments',
          value: appointmentStats.total.toString(),
          icon: Calendar,
          color: '#2196F3',
          trend: '+12%'
        },
        {
          title: 'Pending Today',
          value: appointmentStats.scheduled.toString(),
          icon: Clock,
          color: '#FFC107',
          trend: '+3%'
        },
        {
          title: 'Completed',
          value: appointmentStats.completed.toString(),
          icon: TrendingUp,
          color: '#4CAF50',
          trend: '+8%'
        },
        {
          title: 'Notifications',
          value: unreadCount.toString(),
          icon: Bell,
          color: '#9C27B0',
          trend: 'New'
        }
      ];
    }
    
    return [
      {
        title: 'My Appointments',
        value: appointmentStats.total.toString(),
        icon: Calendar,
        color: '#2196F3',
        trend: `${appointmentStats.scheduled} upcoming`
      },
      {
        title: 'Upcoming',
        value: appointmentStats.scheduled.toString(),
        icon: Clock,
        color: '#FFC107',
        trend: 'This week'
      },
      {
        title: 'Completed',
        value: appointmentStats.completed.toString(),
        icon: TrendingUp,
        color: '#4CAF50',
        trend: 'All time'
      },
      {
        title: 'Notifications',
        value: unreadCount.toString(),
        icon: Bell,
        color: '#9C27B0',
        trend: unreadCount > 0 ? 'Unread' : 'None'
      }
    ];
  }, [appointmentStats, unreadCount, isStaff]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    navigate('/appointments', { 
      state: { 
        search: searchData,
        timestamp: Date.now()
      } 
    });
  }, [navigate, searchData]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setSearchData(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleBookAppointment = useCallback(() => {
    navigate('/appointments', { state: { openBooking: true } });
  }, [navigate]);
  
  const handleViewAppointment = useCallback((appointmentId) => {
    navigate('/appointments', { state: { viewAppointment: appointmentId } });
  }, [navigate]);

  return (
    <div className="dashboard-page">
      {/* Hero Section */}
      <Card className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              {greeting}, <span className="highlight">{userFullName}</span>
            </h1>
            <p className="hero-description">
              {isStaff 
                ? "Welcome to your staff dashboard. Manage appointments, student records, and clinic operations efficiently."
                : "At CIT MedConnect+, we're dedicated to promoting your health and well-being. Book appointments, view your medical history, and stay connected with our healthcare team."
              }
            </p>
            <Button 
              variant="primary"
              size="lg"
              className="hero-btn"
              onClick={handleBookAppointment}
              icon={Calendar}
            >
              {isStaff ? 'Manage Appointments' : 'Book Appointment'}
            </Button>
          </div>
          <div className="hero-image">
            <div className="doctor-circle">
              <img 
                src="/images/MascotCit.png" 
                alt="CIT Mascot" 
                className="mascot-image"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <Card key={index} className="stat-card" hover>
            <div 
              className="stat-icon" 
              style={{ 
                backgroundColor: `${stat.color}20`, 
                color: stat.color 
              }}
            >
              <stat.icon size={24} />
            </div>
            <div className="stat-info">
              <h3 className="stat-value">{stat.value}</h3>
              <p className="stat-title">{stat.title}</p>
              <span 
                className="stat-trend" 
                style={{ color: stat.color }}
              >
                {stat.trend}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        <div className="dashboard-main">
          {isStaff && (
            // STAFF VIEW - Quick Actions
            <Card className="quick-actions-section">
              <h2 className="section-title">Staff Quick Actions</h2>
              <div className="actions-grid">
                <ActionCard 
                  icon={FileText}
                  title="Manage Records"
                  description="Create, update, and view student medical records"
                  onClick={() => navigate('/medical-records')}
                  color="#2196F3"
                />
                <ActionCard 
                  icon={Calendar}
                  title="Manage Slots"
                  description="Create and manage appointment time slots"
                  onClick={() => navigate('/appointments', { state: { openSlotManagement: true } })}
                  color="#4CAF50"
                />
                <ActionCard 
                  icon={Activity}
                  title="View Appointments"
                  description="Monitor and manage all appointments"
                  onClick={() => navigate('/appointments')}
                  color="#FFC107"
                />
                <ActionCard 
                  icon={Bell}
                  title="Send Notifications"
                  description="Broadcast messages to students"
                  onClick={() => navigate('/notifications', { state: { openSendModal: true } })}
                  color="#9C27B0"
                />
              </div>
            </Card>
          )}
        </div>

        {/* Recent Appointments */}
        <Card className="recent-appointments">
          <div className="section-header">
            <h3 className="section-title">
              {isStaff ? 'Recent Appointments' : 'My Upcoming Appointments'}
            </h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/appointments')}
              icon={ArrowRight}
              iconPosition="right"
            >
              View All
            </Button>
          </div>
          
          <div className="appointments-list">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.slice(0, 5).map((appointment) => (
                <AppointmentCard 
                  key={appointment.appointmentId}
                  appointment={appointment}
                  onClick={() => handleViewAppointment(appointment.appointmentId)}
                />
              ))
            ) : (
              <div className="empty-state-mini">
                <Calendar size={48} />
                <p>No upcoming appointments</p>
                {!isStaff && (
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={handleBookAppointment}
                  >
                    Book Now
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

// Appointment Card Component
const AppointmentCard = React.memo(({ appointment, onClick }) => {
  return (
    <div className="appointment-card" onClick={onClick}>
      <div className="appointment-info">
        <div className="appointment-icon">
          <Stethoscope size={24} />
        </div>
        <div className="appointment-details">
          <h4>{appointment.reason || 'Medical Appointment'}</h4>
          <p className="appointment-meta">
            {appointment.staffId && <span>Dr. Santos</span>}
          </p>
          <p className="appointment-datetime">
            <Calendar size={14} />
            {new Date(appointment.scheduledDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })} at {appointment.scheduledTime}
          </p>
        </div>
      </div>
      <div className="appointment-status">
        <span className={`badge badge-${appointment.status.toLowerCase()}`}>
          {appointment.status}
        </span>
      </div>
    </div>
  );
});

// Action Card Component
const ActionCard = React.memo(({ icon: Icon, title, description, onClick, color }) => {
  return (
    <div className="action-card" onClick={onClick}>
      <div 
        className="action-icon" 
        style={{ backgroundColor: `${color}20`, color }}
      >
        <Icon size={32} />
      </div>
      <h4>{title}</h4>
      <p>{description}</p>
      <ArrowRight size={20} className="action-arrow" />
    </div>
  );
});

export default Dashboard;