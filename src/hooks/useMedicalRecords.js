import { useContext } from 'react';
import { MedicalRecordsContext } from '../context/MedicalRecordsContext';

/**
 * CUSTOM HOOK - useMedicalRecords
 * Provides access to medical records context
 * @returns {Object} Medical records context with all available methods and state
 * @throws {Error} If used outside of MedicalRecordsProvider
 */
const useMedicalRecords = () => {
  const context = useContext(MedicalRecordsContext);
  
  if (!context) {
    throw new Error('useMedicalRecords must be used within a MedicalRecordsProvider');
  }
  
  return context;
};

export default useMedicalRecords;