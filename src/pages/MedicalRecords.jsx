// ============================================
// MEDICAL RECORDS PAGE - BACKEND INTEGRATION
// src/pages/MedicalRecords.jsx
// ============================================

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import useMedicalRecords from '../hooks/useMedicalRecords';
import useUsers from '../hooks/useUsers';
import { useAuditLog } from '../context/AuditLogContext';
import { 
  FileText, 
  Heart, 
  Activity, 
  Pill, 
  Calendar,
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search
} from 'lucide-react';
import { Button, Card, Modal, Input, Alert, EmptyState } from '../components/common';
import './MedicalRecords.css';

const MedicalRecords = () => {
  const { isStaff } = useAuth();
  const { logAction } = useAuditLog();
  const { 
    records,
    latestVitalSigns, 
    activePrescriptions,
    recordStats,
    error: recordsError,
    createRecord,
    updateRecord,
    deleteRecord,
    setError: setRecordsError
  } = useMedicalRecords();
  
  const { studentsOnly, loading: usersLoading } = useUsers();
  
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    studentId: '',
    appointmentId: '',
    diagnosis: '',
    symptoms: '',
    treatment: '',
    prescriptions: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    weight: '',
    allergies: '',
    medicalHistory: '',
    notes: ''
  });

  // Parse vital signs from backend format
  const parseVitalSigns = (vitalSigns) => {
    if (!vitalSigns) return null;
    try {
      return typeof vitalSigns === 'string' ? JSON.parse(vitalSigns) : vitalSigns;
    } catch {
      return null;
    }
  };

  // Parse prescriptions from backend format
  const parsePrescriptions = (prescription) => {
    if (!prescription) return [];
    return prescription.split(',').map(p => p.trim()).filter(p => p);
  };

  // Summary statistics
  const summaryStats = useMemo(() => [
    {
      icon: FileText,
      value: recordStats.total.toString(),
      label: 'Total Records',
      color: '#1976D2'
    },
    {
      icon: Heart,
      value: latestVitalSigns?.bloodPressure || 'N/A',
      label: 'Last Blood Pressure',
      color: '#388E3C'
    },
    {
      icon: Activity,
      value: latestVitalSigns?.heartRate ? `${latestVitalSigns.heartRate} bpm` : 'N/A',
      label: 'Last Heart Rate',
      color: '#F57C00'
    },
    {
      icon: Pill,
      value: activePrescriptions.toString(),
      label: 'Active Prescriptions',
      color: '#7B1FA2'
    }
  ], [recordStats, latestVitalSigns, activePrescriptions]);

  // Filtered records for search
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    
    const query = searchQuery.toLowerCase();
    return records.filter(record => {
      const userName = record.userName?.toLowerCase() || '';
      const userId = record.userId?.toLowerCase() || '';
      const diagnosis = record.diagnosis?.toLowerCase() || '';
      const symptoms = record.symptoms?.toLowerCase() || '';
      
      return userName.includes(query) ||
             userId.includes(query) ||
             diagnosis.includes(query) ||
             symptoms.includes(query);
    });
  }, [records, searchQuery]);

  const toggleRecord = useCallback((recordId) => {
    setExpandedRecord(prev => prev === recordId ? null : recordId);
  }, []);

const handleInputChange = useCallback((e) => {
  const { name, value } = e.target;
  
  console.log('=== INPUT CHANGE DEBUG ===');
  console.log('Field name:', name);
  console.log('Field value:', value);
  console.log('Value type:', typeof value);
  
  if (name === 'studentId') {
    console.log('STUDENT ID SELECTED:', value);
    // Find the selected student to verify
    const selectedStudent = studentsOnly.find(s => s.schoolId === value);
    console.log('Selected student object:', selectedStudent);
  }
  
  setFormData(prev => {
    const updated = { ...prev, [name]: value };
    console.log('Updated formData:', updated);
    return updated;
  });
}, [studentsOnly]);

  const resetForm = useCallback(() => {
    setFormData({
      studentId: '',
      appointmentId: '',
      diagnosis: '',
      symptoms: '',
      treatment: '',
      prescriptions: '',
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      weight: '',
      allergies: '',
      medicalHistory: '',
      notes: ''
    });
  }, []);

  const handleCreate = useCallback(() => {
    setModalMode('create');
    resetForm();
    setShowModal(true);
  }, [resetForm]);

  const handleEdit = useCallback((record) => {
    setModalMode('edit');
    setSelectedRecord(record);
    
    const vitalSigns = parseVitalSigns(record.vitalSigns);
    const prescriptions = parsePrescriptions(record.prescription);
    
    setFormData({
      studentId: record.userId || '',
      appointmentId: record.appointmentId?.toString() || '',
      diagnosis: record.diagnosis || '',
      symptoms: record.symptoms || '',
      treatment: record.treatment || '',
      prescriptions: prescriptions.join(', '),
      bloodPressure: vitalSigns?.bloodPressure || '',
      heartRate: vitalSigns?.heartRate?.toString() || '',
      temperature: vitalSigns?.temperature?.toString() || '',
      weight: vitalSigns?.weight?.toString() || '',
      allergies: record.allergies || '',
      medicalHistory: record.medicalHistory || '',
      notes: record.notes || ''
    });
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(async (record) => {
    if (window.confirm(`Are you sure you want to delete the record for ${record.userName}?`)) {
      setIsSaving(true);
      const result = await deleteRecord(record.recordId);
      setIsSaving(false);
      
      if (result.success) {
        logAction('Deleted Record', `Removed medical record for ${record.userName} (${record.userId})`);
        setMessage({ type: 'success', text: result.message || 'Record deleted successfully' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete record' });
      }
    }
  }, [deleteRecord, logAction]);

 const handleSave = useCallback(async () => {
  console.log('=== HANDLE SAVE DEBUG ===');
  console.log('Current formData:', formData);
  console.log('Student ID being sent:', formData.studentId);
  
  // Validation
  if (!formData.studentId || !formData.diagnosis) {
    setMessage({ type: 'error', text: 'Student ID and Diagnosis are required' });
    return;
  }

  setIsSaving(true);

  // Prepare data for backend
  const recordData = {
    studentId: formData.studentId, // This should be the schoolId
    userId: formData.studentId,    // Same as studentId
    appointmentId: formData.appointmentId ? parseInt(formData.appointmentId) : null,
    diagnosis: formData.diagnosis,
    symptoms: formData.symptoms,
    treatment: formData.treatment,
    prescriptions: formData.prescriptions,
    vitalSigns: {
      bloodPressure: formData.bloodPressure,
      heartRate: parseInt(formData.heartRate) || 0,
      temperature: parseFloat(formData.temperature) || 0,
      weight: parseFloat(formData.weight) || 0
    },
    allergies: formData.allergies,
    medicalHistory: formData.medicalHistory,
    notes: formData.notes
  };

  console.log('Record data being passed to createRecord:', recordData);

  let result;
  if (modalMode === 'create') {
    result = await createRecord(recordData);
    if (result.success) {
      logAction('Created Record', `New medical record for student ${formData.studentId}`);
      setMessage({ type: 'success', text: result.message || 'Record created successfully' });
    }
  } else if (modalMode === 'edit') {
    result = await updateRecord(selectedRecord.recordId, recordData);
    if (result.success) {
      logAction('Updated Record', `Modified medical record for student ${formData.studentId}`);
      setMessage({ type: 'success', text: result.message || 'Record updated successfully' });
    }
  }

  setIsSaving(false);

  if (result.success) {
    setShowModal(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  } else {
    setMessage({ type: 'error', text: result.error || 'Failed to save record' });
  }
}, [formData, modalMode, selectedRecord, createRecord, updateRecord, logAction]);

  // Clear error messages after 5 seconds
  useEffect(() => {
    if (recordsError) {
      const timer = setTimeout(() => setRecordsError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [recordsError, setRecordsError]);

  return (
    <div className="medical-records-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Medical Records</h1>
          <p className="page-subtitle">
            {isStaff 
              ? 'Manage student medical records and health information'
              : 'View your complete medical history and records'
            }
          </p>
        </div>
        {isStaff && (
          <Button 
            variant="primary"
            icon={Plus}
            onClick={handleCreate}
            disabled={isSaving}
          >
            Create Record
          </Button>
        )}
      </div>

      {message.text && (
        <Alert 
          type={message.type}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      {recordsError && (
        <Alert 
          type="error"
          onClose={() => setRecordsError(null)}
        >
          {recordsError}
        </Alert>
      )}

      {/* Summary Statistics */}
      <div className="summary-grid">
        {summaryStats.map((stat, index) => (
          <Card key={index} className="summary-card" hover>
            <div 
              className="summary-icon" 
              style={{ 
                backgroundColor: `${stat.color}20`, 
                color: stat.color 
              }}
            >
              <stat.icon size={24} />
            </div>
            <div className="summary-info">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Search Bar */}
      {isStaff && (
        <Card className="search-bar">
          <div className="search-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search by student name, ID, diagnosis, or symptoms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="clear-search"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Medical Records List */}
      <Card className="records-container">
        <h2 className="section-title">
          {isStaff ? 'All Medical Records' : 'Medical History'}
        </h2>
        
        <div className="records-list">
          {filteredRecords.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={searchQuery ? 'No records found' : 'No medical records'}
              description={searchQuery 
                ? 'Try adjusting your search criteria'
                : 'Medical records will appear here once created'
              }
            />
          ) : (
            filteredRecords.map((record) => {
              const vitalSigns = parseVitalSigns(record.vitalSigns);
              const prescriptions = parsePrescriptions(record.prescription);
              
              return (
                <div key={record.recordId} className="record-card">
                  <div 
                    className="record-header"
                    onClick={() => toggleRecord(record.recordId)}
                  >
                    <div className="record-header-left">
                      <div className="record-icon">
                        <FileText size={20} />
                      </div>
                      <div className="record-basic-info">
                        <h3 className="record-diagnosis">{record.diagnosis}</h3>
                        <p className="record-meta">
                          <Calendar size={14} />
                          {record.userName} • {record.userId}
                          <br />
                          {new Date(record.recordDate || record.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="record-actions">
                      {isStaff && (
                        <>
                          <button
                            className="action-btn edit-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(record);
                            }}
                            title="Edit Record"
                            disabled={isSaving}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(record);
                            }}
                            title="Delete Record"
                            disabled={isSaving}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                      <button className="expand-btn">
                        <ChevronDown 
                          size={20}
                          style={{
                            transform: expandedRecord === record.recordId ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.3s ease'
                          }}
                        />
                      </button>
                    </div>
                  </div>

                  {expandedRecord === record.recordId && (
                    <div className="record-details">
                      {record.symptoms && (
                        <div className="detail-section">
                          <h4 className="detail-title">
                            <Activity size={16} />
                            Symptoms
                          </h4>
                          <p className="detail-text">{record.symptoms}</p>
                        </div>
                      )}

                      {vitalSigns && (
                        <div className="detail-section">
                          <h4 className="detail-title">
                            <Activity size={16} />
                            Vital Signs
                          </h4>
                          <div className="vital-signs-grid">
                            {vitalSigns.bloodPressure && (
                              <div className="vital-item">
                                <span className="vital-label">Blood Pressure</span>
                                <span className="vital-value">{vitalSigns.bloodPressure} mmHg</span>
                              </div>
                            )}
                            {vitalSigns.heartRate > 0 && (
                              <div className="vital-item">
                                <span className="vital-label">Heart Rate</span>
                                <span className="vital-value">{vitalSigns.heartRate} bpm</span>
                              </div>
                            )}
                            {vitalSigns.temperature > 0 && (
                              <div className="vital-item">
                                <span className="vital-label">Temperature</span>
                                <span className="vital-value">{vitalSigns.temperature} °C</span>
                              </div>
                            )}
                            {vitalSigns.weight > 0 && (
                              <div className="vital-item">
                                <span className="vital-label">Weight</span>
                                <span className="vital-value">{vitalSigns.weight} kg</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="detail-section">
                        <h4 className="detail-title">
                          <Heart size={16} />
                          Treatment
                        </h4>
                        <p className="detail-text">{record.treatment || 'No treatment specified'}</p>
                      </div>

                      {prescriptions.length > 0 && (
                        <div className="detail-section">
                          <h4 className="detail-title">
                            <Pill size={16} />
                            Prescriptions
                          </h4>
                          <ul className="prescription-list">
                            {prescriptions.map((prescription, index) => (
                              <li key={index} className="prescription-item">
                                {prescription}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {record.allergies && (
                        <div className="detail-section">
                          <h4 className="detail-title">
                            <FileText size={16} />
                            Allergies
                          </h4>
                          <p className="detail-text">{record.allergies}</p>
                        </div>
                      )}

                      {record.medicalHistory && (
                        <div className="detail-section">
                          <h4 className="detail-title">
                            <FileText size={16} />
                            Medical History
                          </h4>
                          <p className="detail-text">{record.medicalHistory}</p>
                        </div>
                      )}

                      {record.notes && (
                        <div className="detail-section">
                          <h4 className="detail-title">
                            <FileText size={16} />
                            Additional Notes
                          </h4>
                          <p className="detail-text">{record.notes}</p>
                        </div>
                      )}

                      <div className="record-metadata">
                        <span className="metadata-item">
                          Record ID: <strong>{record.recordId}</strong>
                        </span>
                        {record.appointmentId && (
                          <span className="metadata-item">
                            Appointment: <strong>#{record.appointmentId}</strong>
                          </span>
                        )}
                        <span className="metadata-item">
                          Created: <strong>{new Date(record.createdAt).toLocaleString()}</strong>
                        </span>
                        <span className="metadata-item">
                          Last Updated: <strong>{new Date(record.updatedAt).toLocaleString()}</strong>
                        </span>
                        {record.createdBy && (
                          <span className="metadata-item">
                            Created By: <strong>{record.createdBy}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => !isSaving && setShowModal(false)}
        title={modalMode === 'create' ? 'Create Medical Record' : 'Edit Medical Record'}
        size="lg"
      >
        <div className="record-form">
          <div className="form-section">
            <h4>Student Information</h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Student ID <span className="required">*</span>
                </label>
                {modalMode === 'create' && !usersLoading ? (
                  <select
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    disabled={isSaving}
                  >
                    <option value="">Select Student</option>
                    {studentsOnly.map(student => (
                      <option key={student.schoolId} value={student.schoolId}>
                        {student.schoolId} - {student.firstName} {student.lastName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId}
                    className="form-input"
                    disabled
                  />
                )}
              </div>
              <Input
                label="Appointment ID (optional)"
                name="appointmentId"
                type="number"
                value={formData.appointmentId}
                onChange={handleInputChange}
                placeholder="123"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="form-section">
            <h4>Medical Information</h4>
            <Input
              label="Diagnosis"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleInputChange}
              placeholder="Primary diagnosis"
              required
              disabled={isSaving}
            />
            <Textarea
              label="Symptoms"
              name="symptoms"
              value={formData.symptoms}
              onChange={handleInputChange}
              placeholder="Describe the symptoms..."
              rows={2}
              disabled={isSaving}
            />
            <Textarea
              label="Treatment"
              name="treatment"
              value={formData.treatment}
              onChange={handleInputChange}
              placeholder="Describe the treatment plan..."
              rows={3}
              disabled={isSaving}
            />
            <Textarea
              label="Prescriptions (comma-separated)"
              name="prescriptions"
              value={formData.prescriptions}
              onChange={handleInputChange}
              placeholder="Medicine 1, Medicine 2, ..."
              rows={2}
              disabled={isSaving}
            />
          </div>

          <div className="form-section">
            <h4>Vital Signs</h4>
            <div className="form-row form-row-4">
              <Input
                label="Blood Pressure"
                name="bloodPressure"
                value={formData.bloodPressure}
                onChange={handleInputChange}
                placeholder="120/80"
                disabled={isSaving}
              />
              <Input
                label="Heart Rate (bpm)"
                name="heartRate"
                type="number"
                value={formData.heartRate}
                onChange={handleInputChange}
                placeholder="72"
                disabled={isSaving}
              />
              <Input
                label="Temperature (°C)"
                name="temperature"
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={handleInputChange}
                placeholder="36.5"
                disabled={isSaving}
              />
              <Input
                label="Weight (kg)"
                name="weight"
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={handleInputChange}
                placeholder="65"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="form-section">
            <Textarea
              label="Allergies"
              name="allergies"
              value={formData.allergies}
              onChange={handleInputChange}
              placeholder="Known allergies..."
              rows={2}
              disabled={isSaving}
            />
            <Textarea
              label="Medical History"
              name="medicalHistory"
              value={formData.medicalHistory}
              onChange={handleInputChange}
              placeholder="Past medical conditions, surgeries, etc..."
              rows={3}
              disabled={isSaving}
            />
            <Textarea
              label="Additional Notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Any additional information..."
              rows={2}
              disabled={isSaving}
            />
          </div>

          <div className="modal-actions">
            <Button 
              variant="secondary"
              onClick={() => setShowModal(false)}
              icon={X}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={handleSave}
              icon={Save}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : (modalMode === 'create' ? 'Create Record' : 'Save Changes')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Textarea Component
const Textarea = ({ label, name, value, onChange, placeholder, rows = 4, required = false, disabled = false }) => {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
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
        disabled={disabled}
      />
    </div>
  );
};

export default MedicalRecords;