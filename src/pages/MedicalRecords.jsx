// ============================================
// MEDICAL RECORDS PAGE - STAFF CRUD OPERATIONS
// src/pages/MedicalRecords.jsx
// ============================================

import React, { useState, useMemo, useCallback } from 'react';
import useAuth from '../hooks/useAuth';
import useMedicalRecords from '../hooks/useMedicalRecords';
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
  const { user, isStaff } = useAuth();
  const { logAction } = useAuditLog();
  const { 
    latestVitalSigns, 
    activePrescriptions,
    loading
  } = useMedicalRecords();
  
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Mock records state
  const [records, setRecords] = useState([
    {
      recordId: 'REC001',
      studentId: '2024-001',
      studentName: 'Juan Dela Cruz',
      course: 'BS Computer Science',
      year: '3rd Year',
      diagnosis: 'Seasonal Allergies',
      treatment: 'Prescribed antihistamines, avoid allergens',
      prescriptions: ['Cetirizine 10mg - once daily', 'Loratadine 10mg - as needed'],
      vitalSigns: {
        bloodPressure: '120/80',
        heartRate: 72,
        temperature: 36.5,
        weight: 65
      },
      medicalHistory: 'No significant past medical conditions',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      staffId: user?.userId
    }
  ]);

  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    course: '',
    year: '',
    diagnosis: '',
    treatment: '',
    prescriptions: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    weight: '',
    medicalHistory: ''
  });

  const summaryStats = useMemo(() => [
    {
      icon: FileText,
      value: records.length.toString(),
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
  ], [records, latestVitalSigns, activePrescriptions]);

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    
    const query = searchQuery.toLowerCase();
    return records.filter(record => 
      record.studentName.toLowerCase().includes(query) ||
      record.studentId.toLowerCase().includes(query) ||
      record.diagnosis.toLowerCase().includes(query) ||
      record.course.toLowerCase().includes(query)
    );
  }, [records, searchQuery]);

  const toggleRecord = useCallback((recordId) => {
    setExpandedRecord(prev => prev === recordId ? null : recordId);
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      studentId: '',
      studentName: '',
      course: '',
      year: '',
      diagnosis: '',
      treatment: '',
      prescriptions: '',
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      weight: '',
      medicalHistory: ''
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
    setFormData({
      studentId: record.studentId,
      studentName: record.studentName,
      course: record.course,
      year: record.year,
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      prescriptions: record.prescriptions.join(', '),
      bloodPressure: record.vitalSigns.bloodPressure,
      heartRate: record.vitalSigns.heartRate.toString(),
      temperature: record.vitalSigns.temperature.toString(),
      weight: record.vitalSigns.weight.toString(),
      medicalHistory: record.medicalHistory
    });
    setShowModal(true);
  }, []);

  const handleDelete = useCallback((record) => {
    if (window.confirm(`Are you sure you want to delete the record for ${record.studentName}?`)) {
      setRecords(prev => prev.filter(r => r.recordId !== record.recordId));
      logAction('Deleted Record', `Removed medical record for ${record.studentName} (${record.studentId})`);
      setMessage({ type: 'success', text: 'Record deleted successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  }, [logAction]);

  const handleSave = useCallback(() => {
    if (!formData.studentId || !formData.studentName || !formData.diagnosis) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    const prescriptionsArray = formData.prescriptions
      .split(',')
      .map(p => p.trim())
      .filter(p => p);

    if (modalMode === 'create') {
      const newRecord = {
        recordId: `REC${String(records.length + 1).padStart(3, '0')}`,
        studentId: formData.studentId,
        studentName: formData.studentName,
        course: formData.course,
        year: formData.year,
        diagnosis: formData.diagnosis,
        treatment: formData.treatment,
        prescriptions: prescriptionsArray,
        vitalSigns: {
          bloodPressure: formData.bloodPressure,
          heartRate: parseInt(formData.heartRate) || 0,
          temperature: parseFloat(formData.temperature) || 0,
          weight: parseFloat(formData.weight) || 0
        },
        medicalHistory: formData.medicalHistory,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        staffId: user?.userId
      };

      setRecords(prev => [newRecord, ...prev]);
      logAction('Created Record', `New medical record for ${formData.studentName} (${formData.studentId})`);
      setMessage({ type: 'success', text: 'Record created successfully' });
    } else if (modalMode === 'edit') {
      setRecords(prev => prev.map(record => {
        if (record.recordId === selectedRecord.recordId) {
          return {
            ...record,
            studentId: formData.studentId,
            studentName: formData.studentName,
            course: formData.course,
            year: formData.year,
            diagnosis: formData.diagnosis,
            treatment: formData.treatment,
            prescriptions: prescriptionsArray,
            vitalSigns: {
              bloodPressure: formData.bloodPressure,
              heartRate: parseInt(formData.heartRate) || 0,
              temperature: parseFloat(formData.temperature) || 0,
              weight: parseFloat(formData.weight) || 0
            },
            medicalHistory: formData.medicalHistory,
            updatedAt: new Date().toISOString()
          };
        }
        return record;
      }));
      logAction('Updated Record', `Modified medical record for ${formData.studentName} (${formData.studentId})`);
      setMessage({ type: 'success', text: 'Record updated successfully' });
    }

    setShowModal(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  }, [formData, modalMode, selectedRecord, records, user, logAction]);

  if (loading && records.length === 0) {
    return null;
  }

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
              placeholder="Search by student name, ID, diagnosis, or course..."
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
            filteredRecords.map((record) => (
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
                        {record.studentName} • {record.studentId} • {record.course}
                        <br />
                        {new Date(record.createdAt).toLocaleDateString('en-US', { 
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
                    <div className="detail-section">
                      <h4 className="detail-title">
                        <Activity size={16} />
                        Vital Signs
                      </h4>
                      <div className="vital-signs-grid">
                        <div className="vital-item">
                          <span className="vital-label">Blood Pressure</span>
                          <span className="vital-value">
                            {record.vitalSigns.bloodPressure} mmHg
                          </span>
                        </div>
                        <div className="vital-item">
                          <span className="vital-label">Heart Rate</span>
                          <span className="vital-value">
                            {record.vitalSigns.heartRate} bpm
                          </span>
                        </div>
                        <div className="vital-item">
                          <span className="vital-label">Temperature</span>
                          <span className="vital-value">
                            {record.vitalSigns.temperature} °C
                          </span>
                        </div>
                        <div className="vital-item">
                          <span className="vital-label">Weight</span>
                          <span className="vital-value">
                            {record.vitalSigns.weight} kg
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="detail-section">
                      <h4 className="detail-title">
                        <Heart size={16} />
                        Treatment
                      </h4>
                      <p className="detail-text">{record.treatment}</p>
                    </div>

                    {record.prescriptions && record.prescriptions.length > 0 && (
                      <div className="detail-section">
                        <h4 className="detail-title">
                          <Pill size={16} />
                          Prescriptions
                        </h4>
                        <ul className="prescription-list">
                          {record.prescriptions.map((prescription, index) => (
                            <li key={index} className="prescription-item">
                              {prescription}
                            </li>
                          ))}
                        </ul>
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

                    <div className="record-metadata">
                      <span className="metadata-item">
                        Record ID: <strong>{record.recordId}</strong>
                      </span>
                      <span className="metadata-item">
                        Created: <strong>{new Date(record.createdAt).toLocaleString()}</strong>
                      </span>
                      <span className="metadata-item">
                        Last Updated: <strong>{new Date(record.updatedAt).toLocaleString()}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalMode === 'create' ? 'Create Medical Record' : 'Edit Medical Record'}
        size="lg"
      >
        <div className="record-form">
          <div className="form-section">
            <h4>Student Information</h4>
            <div className="form-row">
              <Input
                label="Student ID"
                name="studentId"
                value={formData.studentId}
                onChange={handleInputChange}
                placeholder="2024-001"
                required
              />
              <Input
                label="Student Name"
                name="studentName"
                value={formData.studentName}
                onChange={handleInputChange}
                placeholder="Juan Dela Cruz"
                required
              />
            </div>
            <div className="form-row">
              <Input
                label="Course"
                name="course"
                value={formData.course}
                onChange={handleInputChange}
                placeholder="BS Computer Science"
              />
              <Input
                label="Year Level"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                placeholder="3rd Year"
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
            />
            <Textarea
              label="Treatment"
              name="treatment"
              value={formData.treatment}
              onChange={handleInputChange}
              placeholder="Describe the treatment plan..."
              rows={3}
            />
            <Textarea
              label="Prescriptions (comma-separated)"
              name="prescriptions"
              value={formData.prescriptions}
              onChange={handleInputChange}
              placeholder="Medicine 1, Medicine 2, ..."
              rows={2}
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
              />
              <Input
                label="Heart Rate (bpm)"
                name="heartRate"
                type="number"
                value={formData.heartRate}
                onChange={handleInputChange}
                placeholder="72"
              />
              <Input
                label="Temperature (°C)"
                name="temperature"
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={handleInputChange}
                placeholder="36.5"
              />
              <Input
                label="Weight (kg)"
                name="weight"
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={handleInputChange}
                placeholder="65"
              />
            </div>
          </div>

          <div className="form-section">
            <Textarea
              label="Medical History"
              name="medicalHistory"
              value={formData.medicalHistory}
              onChange={handleInputChange}
              placeholder="Past medical conditions, allergies, etc..."
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <Button 
              variant="secondary"
              onClick={() => setShowModal(false)}
              icon={X}
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={handleSave}
              icon={Save}
            >
              {modalMode === 'create' ? 'Create Record' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Textarea Component
const Textarea = ({ label, name, value, onChange, placeholder, rows = 4, required = false }) => {
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
      />
    </div>
  );
};

export default MedicalRecords;