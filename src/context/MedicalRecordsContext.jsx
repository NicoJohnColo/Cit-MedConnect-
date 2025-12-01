// ============================================
// MEDICAL RECORDS CONTEXT - SENIOR LEVEL
// Manages patient medical records and history
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
import { generateId } from '../types';

const MedicalRecordsContext = createContext(null);

/**
 * MEDICAL RECORDS PROVIDER
 * Handles CRUD operations for medical records
 */
export const MedicalRecordsProvider = ({ children }) => {
  const { user, createAuditLog } = useAuth();
  const isMounted = useRef(true);

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================================
  // INITIALIZE DATA
  // ============================================
  
  useEffect(() => {
    const initData = () => {
      try {
        // Start with empty records
        console.log('Starting with empty medical records list');
        setRecords([]);
      } catch (err) {
        console.error('Failed to initialize medical records:', err);
        setError(err.message);
      }
    };
    
    initData();
    
    return () => {
      isMounted.current = false;
    };
  }, [user]);
  
  // ============================================
  // COMPUTED VALUES
  // ============================================
  
  // Get records for current user
  const userRecords = useMemo(() => {
    if (!user) return [];
    if (user.role === 'student') {
      return records.filter(r => r.studentId === user.userId);
    }
    if (user.role === 'staff') {
      return records; // Staff can see all records
    }
    return [];
  }, [records, user]);
  
  // Get latest vital signs
  const latestVitalSigns = useMemo(() => {
    if (userRecords.length === 0) return null;
    const sorted = [...userRecords].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    return sorted[0]?.vitalSigns || null;
  }, [userRecords]);
  
  // Count active prescriptions
  const activePrescriptions = useMemo(() => {
    return userRecords.reduce((count, record) => {
      return count + (record.prescriptions?.length || 0);
    }, 0);
  }, [userRecords]);
  
  // Get record statistics
  const recordStats = useMemo(() => {
    return {
      total: userRecords.length,
      lastVisit: userRecords.length > 0 
        ? new Date(Math.max(...userRecords.map(r => new Date(r.createdAt))))
        : null,
      prescriptions: activePrescriptions
    };
  }, [userRecords, activePrescriptions]);

  // ============================================
  // CRUD OPERATIONS
  // ============================================
  
  /**
   * CREATE RECORD (Staff Only)
   * Flow: Staff Dashboard → Manage Records → Create
   */
  const createRecord = useCallback(async (recordData) => {
    setLoading(true);
    setError(null);
    
    try {
      if (user?.role !== 'staff') {
        throw new Error('Unauthorized: Staff access required');
      }
      
      const newRecord = {
        recordId: generateId('MR'),
        studentId: recordData.studentId,
        appointmentId: recordData.appointmentId || '',
        diagnosis: recordData.diagnosis,
        treatment: recordData.treatment,
        prescriptions: recordData.prescriptions || [],
        vitalSigns: recordData.vitalSigns || {
          bloodPressure: '',
          heartRate: '',
          temperature: '',
          weight: ''
        },
        medicalHistory: recordData.medicalHistory || '',
        staffId: user.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setRecords(prev => [newRecord, ...prev]);
      
      // Create audit log
      await createAuditLog('CREATE', 'medical_record', newRecord.recordId, recordData);
      
      setLoading(false);
      return { 
        success: true, 
        data: newRecord,
        message: 'Medical record created successfully'
      };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [user, createAuditLog]);
  
  /**
   * UPDATE RECORD (Staff Only)
   * Flow: Staff Dashboard → Manage Records → Update
   */
  const updateRecord = useCallback(async (recordId, updates) => {
    setLoading(true);
    setError(null);
    
    try {
      if (user?.role !== 'staff') {
        throw new Error('Unauthorized: Staff access required');
      }
      
      const record = records.find(r => r.recordId === recordId);
      if (!record) {
        throw new Error('Record not found');
      }
      
      setRecords(prev => prev.map(r =>
        r.recordId === recordId
          ? { ...r, ...updates, updatedAt: new Date().toISOString() }
          : r
      ));
      
      // Create audit log
      await createAuditLog('UPDATE', 'medical_record', recordId, updates);
      
      setLoading(false);
      return { 
        success: true,
        message: 'Medical record updated successfully'
      };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [user, records, createAuditLog]);
  
  /**
   * DELETE RECORD (Staff Only)
   * Flow: Staff Dashboard → Manage Records → Delete → Confirm Delete?
   */
  const deleteRecord = useCallback(async (recordId) => {
    setLoading(true);
    setError(null);
    
    try {
      if (user?.role !== 'staff') {
        throw new Error('Unauthorized: Staff access required');
      }
      
      const record = records.find(r => r.recordId === recordId);
      if (!record) {
        throw new Error('Record not found');
      }
      
      setRecords(prev => prev.filter(r => r.recordId !== recordId));
      
      // Create audit log
      await createAuditLog('DELETE', 'medical_record', recordId, {});
      
      setLoading(false);
      return { 
        success: true,
        message: 'Medical record deleted successfully'
      };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [user, records, createAuditLog]);
  
  /**
   * VIEW RECORD
   * Flow: View Records → Display Details
   */
  const getRecordById = useCallback(async (recordId) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const record = records.find(r => r.recordId === recordId);
      if (!record) {
        throw new Error('Record not found');
      }
      
      // Create audit log
      await createAuditLog('VIEW', 'medical_record', recordId, {});
      
      setLoading(false);
      return { success: true, data: record };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [records, createAuditLog]);
  
  /**
   * GET RECORDS BY STUDENT (Staff Only)
   */
  const getRecordsByStudent = useCallback(async (studentId) => {
    setLoading(true);
    try {
      if (user?.role !== 'staff') {
        throw new Error('Unauthorized: Staff access required');
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const studentRecords = records.filter(r => r.studentId === studentId);
      
      setLoading(false);
      return { success: true, data: studentRecords };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [user, records]);

  // ============================================
  // CONTEXT VALUE
  // ============================================
  
  const contextValue = useMemo(() => ({
    records,
    userRecords,
    latestVitalSigns,
    activePrescriptions,
    recordStats,
    loading,
    error,
    
    createRecord,
    updateRecord,
    deleteRecord,
    getRecordById,
    getRecordsByStudent,
    
    setError
  }), [
    records,
    userRecords,
    latestVitalSigns,
    activePrescriptions,
    recordStats,
    loading,
    error,
    createRecord,
    updateRecord,
    deleteRecord,
    getRecordById,
    getRecordsByStudent
  ]);

  return (
    <MedicalRecordsContext.Provider value={contextValue}>
      {children}
    </MedicalRecordsContext.Provider>
  );
};

// Hook for easy access to medical records context
const useMedicalRecords = () => {
  const context = useContext(MedicalRecordsContext);
  if (!context) {
    throw new Error('useMedicalRecords must be used within a MedicalRecordsProvider');
  }
  return context;
};

export { MedicalRecordsContext, useMedicalRecords };
export default MedicalRecordsContext;