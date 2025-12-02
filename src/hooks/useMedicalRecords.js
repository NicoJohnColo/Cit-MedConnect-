import { useState, useEffect, useCallback, useMemo } from 'react';
import { medicalRecordsService } from '../services/medicalRecordsService';
import useAuth from './useAuth';

/**
 * CUSTOM HOOK - useMedicalRecords
 * Provides medical records management functionality with backend integration
 */
const useMedicalRecords = () => {
  const { user, isStaff } = useAuth();
  
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // ============================================
  // FETCH MEDICAL RECORDS
  // ============================================
  
  /**
   * Fetch all medical records (Staff) or user's own records (Student)
   */
  const fetchMedicalRecords = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      console.log('=== FETCHING MEDICAL RECORDS ===');
      console.log('User:', user);
      console.log('Is Staff:', isStaff);
      console.log('User schoolId:', user.schoolId);
      console.log('User userId:', user.userId);
      
      if (isStaff) {
        // Staff can see all records
        console.log('Fetching all records for staff...');
        result = await medicalRecordsService.getAllMedicalRecords();
      } else {
        // Students see only their own records (sorted by date)
        // CRITICAL FIX: Use schoolId for students, not userId
        const studentSchoolId = user.schoolId || user.userId;
        console.log('Fetching records for student with schoolId:', studentSchoolId);
        result = await medicalRecordsService.getMedicalRecordsByUserIdSorted(studentSchoolId);
      }
      
      console.log('Fetch result:', result);
      
      if (result.success) {
        console.log('Records fetched successfully:', result.data?.length || 0, 'records');
        setRecords(result.data || []);
        return result.data;
      } else {
        console.error('Failed to fetch records:', result.error);
        setError(result.error || 'Failed to fetch medical records');
        return [];
      }
    } catch (err) {
      console.error('Exception while fetching records:', err);
      const errorMessage = err.message || 'An error occurred while fetching medical records';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, isStaff]);

  // ============================================
  // CREATE MEDICAL RECORD (Staff Only)
  // ============================================
  
  const createRecord = useCallback(async (recordData) => {
    if (!isStaff) {
      return { 
        success: false, 
        error: 'Unauthorized: Staff access required' 
      };
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // CRITICAL: Ensure we're sending the schoolId, not the name
      const studentId = recordData.studentId || recordData.userId;
      
      console.log('=== CREATE RECORD DEBUG ===');
      console.log('Raw recordData:', recordData);
      console.log('Extracted studentId:', studentId);
      console.log('Type of studentId:', typeof studentId);
      
      if (!studentId || studentId.trim() === '') {
        setError('Student ID is required');
        return { success: false, error: 'Student ID is required' };
      }
      
      if (!recordData.diagnosis || recordData.diagnosis.trim() === '') {
        setError('Diagnosis is required');
        return { success: false, error: 'Diagnosis is required' };
      }
      
      // Prepare record data for backend - FIXED FORMAT
      // Backend Spring Boot expects these exact fields
      const backendData = {
        userId: studentId.trim(),
        diagnosis: recordData.diagnosis.trim(),
        symptoms: recordData.symptoms?.trim() || '',
        treatment: recordData.treatment?.trim() || '',
        prescription: Array.isArray(recordData.prescriptions) 
          ? recordData.prescriptions.join(', ') 
          : (recordData.prescriptions || ''),
        vitalSigns: typeof recordData.vitalSigns === 'string' 
          ? recordData.vitalSigns 
          : JSON.stringify(recordData.vitalSigns || {}),
        allergies: recordData.allergies?.trim() || '',
        medicalHistory: recordData.medicalHistory?.trim() || '',
        notes: recordData.notes?.trim() || ''
      };
      
      // Only add optional fields if they have values
      if (recordData.appointmentId && recordData.appointmentId !== '') {
        backendData.appointmentId = parseInt(recordData.appointmentId);
      }
      
      console.log('Prepared backendData:', backendData);
      console.log('userId in payload:', backendData.userId);
      console.log('vitalSigns:', backendData.vitalSigns);
      console.log('Full payload:', JSON.stringify(backendData, null, 2));
      
      const result = await medicalRecordsService.createMedicalRecord(backendData);
      
      if (result.success) {
        console.log('Record created successfully!');
        // Refresh records list
        await fetchMedicalRecords();
        return { 
          success: true, 
          data: result.data,
          message: result.message 
        };
      } else {
        console.error('Failed to create record:', result.error);
        setError(result.error || 'Failed to create medical record');
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Exception in createRecord:', err);
      const errorMessage = err.message || 'An error occurred while creating medical record';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, isStaff, fetchMedicalRecords]);

  // ============================================
  // UPDATE MEDICAL RECORD (Staff Only)
  // ============================================
  
  const updateRecord = useCallback(async (recordId, updates) => {
    if (!isStaff) {
      return { 
        success: false, 
        error: 'Unauthorized: Staff access required' 
      };
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Prepare update data for backend - FIXED FORMAT
      const backendData = {
        userId: updates.studentId || updates.userId,
        diagnosis: updates.diagnosis?.trim() || '',
        symptoms: updates.symptoms?.trim() || '',
        treatment: updates.treatment?.trim() || '',
        prescription: Array.isArray(updates.prescriptions) 
          ? updates.prescriptions.join(', ') 
          : (updates.prescriptions || ''),
        vitalSigns: typeof updates.vitalSigns === 'string' 
          ? updates.vitalSigns 
          : JSON.stringify(updates.vitalSigns || {}),
        allergies: updates.allergies?.trim() || '',
        medicalHistory: updates.medicalHistory?.trim() || '',
        notes: updates.notes?.trim() || ''
      };
      
      // Only add optional fields if they have values
      if (updates.appointmentId && updates.appointmentId !== '') {
        backendData.appointmentId = parseInt(updates.appointmentId);
      }
      
      console.log('Updating medical record:', recordId, backendData);
      
      const result = await medicalRecordsService.updateMedicalRecord(recordId, backendData);
      
      if (result.success) {
        // Update local state
        setRecords(prevRecords => 
          prevRecords.map(record => 
            record.recordId === recordId ? { ...result.data } : record
          )
        );
        
        // Update selected record if it's the same
        if (selectedRecord?.recordId === recordId) {
          setSelectedRecord(result.data);
        }
        
        return { 
          success: true,
          data: result.data,
          message: result.message 
        };
      } else {
        setError(result.error || 'Failed to update medical record');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err.message || 'An error occurred while updating medical record';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [isStaff, selectedRecord]);

  // ============================================
  // DELETE MEDICAL RECORD (Staff Only)
  // ============================================
  
  const deleteRecord = useCallback(async (recordId) => {
    if (!isStaff) {
      return { 
        success: false, 
        error: 'Unauthorized: Staff access required' 
      };
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await medicalRecordsService.deleteMedicalRecord(recordId);
      
      if (result.success) {
        // Remove from local state
        setRecords(prevRecords => 
          prevRecords.filter(record => record.recordId !== recordId)
        );
        
        // Clear selected record if it's the same
        if (selectedRecord?.recordId === recordId) {
          setSelectedRecord(null);
        }
        
        return { 
          success: true,
          data: result.data,
          message: result.message 
        };
      } else {
        setError(result.error || 'Failed to delete medical record');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err.message || 'An error occurred while deleting medical record';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [isStaff, selectedRecord]);

  // ============================================
  // GET RECORD BY ID
  // ============================================
  
  const getRecordById = useCallback(async (recordId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await medicalRecordsService.getMedicalRecordById(recordId);
      
      if (result.success) {
        setSelectedRecord(result.data);
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to fetch medical record');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err.message || 'An error occurred while fetching medical record';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // GET RECORDS BY STUDENT (Staff Only)
  // ============================================
  
  const getRecordsByStudent = useCallback(async (studentId) => {
    if (!isStaff) {
      return { 
        success: false, 
        error: 'Unauthorized: Staff access required' 
      };
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await medicalRecordsService.getMedicalRecordsByUserIdSorted(studentId);
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to fetch student records');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err.message || 'An error occurred while fetching student records';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [isStaff]);

  // ============================================
  // INITIAL LOAD
  // ============================================
  
  useEffect(() => {
    if (user) {
      console.log('User changed, fetching medical records...');
      fetchMedicalRecords();
    }
  }, [user, fetchMedicalRecords]);

  // ============================================
  // COMPUTED VALUES
  // ============================================
  
  // Get user's records (already filtered by fetch function)
  const userRecords = useMemo(() => records, [records]);
  
  // Get latest vital signs
  const latestVitalSigns = useMemo(() => {
    if (userRecords.length === 0) return null;
    
    const sorted = [...userRecords].sort((a, b) => 
      new Date(b.recordDate || b.createdAt) - new Date(a.recordDate || a.createdAt)
    );
    
    const latestRecord = sorted[0];
    if (!latestRecord?.vitalSigns) return null;
    
    try {
      return typeof latestRecord.vitalSigns === 'string' 
        ? JSON.parse(latestRecord.vitalSigns)
        : latestRecord.vitalSigns;
    } catch {
      return null;
    }
  }, [userRecords]);
  
  // Count active prescriptions
  const activePrescriptions = useMemo(() => {
    return userRecords.reduce((count, record) => {
      if (record.prescription) {
        const prescriptions = record.prescription.split(',').filter(p => p.trim());
        return count + prescriptions.length;
      }
      return count;
    }, 0);
  }, [userRecords]);
  
  // Get record statistics
  const recordStats = useMemo(() => {
    return {
      total: userRecords.length,
      lastVisit: userRecords.length > 0 
        ? new Date(Math.max(...userRecords.map(r => new Date(r.recordDate || r.createdAt))))
        : null,
      prescriptions: activePrescriptions
    };
  }, [userRecords, activePrescriptions]);

  // ============================================
  // RETURN VALUES
  // ============================================
  
  return {
    // State
    records,
    userRecords,
    loading,
    error,
    selectedRecord,
    latestVitalSigns,
    activePrescriptions,
    recordStats,
    
    // Actions
    fetchMedicalRecords,
    createRecord,
    updateRecord,
    deleteRecord,
    getRecordById,
    getRecordsByStudent,
    setSelectedRecord,
    setError,
    
    // Computed
    hasRecords: records.length > 0,
    isLoading: loading,
    hasError: !!error
  };
};

export default useMedicalRecords;