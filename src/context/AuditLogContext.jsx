// ============================================
// AUDIT LOG CONTEXT
// src/context/AuditLogContext.jsx
// Tracks all staff actions for accountability
// ============================================

import React, { createContext, useContext, useState, useCallback } from 'react';
import useAuth from '../hooks/useAuth';

const AuditLogContext = createContext();

export const useAuditLog = () => {
  const context = useContext(AuditLogContext);
  if (!context) {
    throw new Error('useAuditLog must be used within AuditLogProvider');
  }
  return context;
};

export const AuditLogProvider = ({ children }) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);

  // Log an action
  const logAction = useCallback((action, details) => {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      userId: user?.userId || 'unknown',
      username: user?.username || 'Unknown User',
      action,
      details,
      date: new Date().toLocaleString()
    };
    
    setLogs(prev => [logEntry, ...prev].slice(0, 100)); // Keep last 100 logs
    console.log('📝 Audit Log:', logEntry);
  }, [user]);

  // Get recent logs
  const getRecentLogs = useCallback((limit = 20) => {
    return logs.slice(0, limit);
  }, [logs]);

  // Clear logs (admin only)
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <AuditLogContext.Provider value={{ 
      logs, 
      logAction, 
      getRecentLogs,
      clearLogs 
    }}>
      {children}
    </AuditLogContext.Provider>
  );
};