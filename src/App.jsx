// ============================================
// APP.JSX - COMPLETE WITH ALL PROVIDERS
// src/App.jsx
// ============================================

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppointmentProvider } from './context/AppointmentContext';
import { NotificationProvider } from './context/NotificationContext';
import { MedicalRecordsProvider } from './context/MedicalRecordsContext';
import { AuditLogProvider } from './context/AuditLogContext';
import './App.css';

// Import components
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Profile from './pages/Profile';
import MedicalRecords from './pages/MedicalRecords';
import Calendar from './pages/Calendar';
import Notifications from './pages/Notifications';
import Layout from './components/layout/Layout';

// ============================================
// PROTECTED ROUTE COMPONENT
// ============================================

const ProtectedRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

// ============================================
// PUBLIC ROUTE COMPONENT
// ============================================

const PublicRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return children;
};

// ============================================
// APP ROUTES COMPONENT
// ============================================

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <Landing />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <Layout>
              <Appointments />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/medical-records"
        element={
          <ProtectedRoute>
            <Layout>
              <MedicalRecords />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <Layout>
              <Calendar />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Layout>
              <Notifications />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ============================================
// MAIN APP COMPONENT
// ============================================

function App() {
  return (
    <Router>
      <AuthProvider>
        <AuditLogProvider>
          <NotificationProvider>
            <AppointmentProvider>
              <MedicalRecordsProvider>
                <div className="app">
                  <AppRoutes />
                </div>
              </MedicalRecordsProvider>
            </AppointmentProvider>
          </NotificationProvider>
        </AuditLogProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;