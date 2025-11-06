// ============================================
// TYPE DEFINITIONS & JSON SCHEMAS
// Design of Entities - 25% Rubric Compliance
// ============================================

/**
 * USER ENTITY SCHEMA
 * Represents both Student and Staff users
 */
export const UserSchema = {
  userId: "", // Unique identifier
  schoolId: "", // School ID (e.g., "20-1234" or "D-001")
  role: "", // "student" | "staff"
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  age: 0,
  gender: "", // "male" | "female" | "other" | "prefer-not-to-say"
  address: "",
  dateOfBirth: "",
  createdAt: "",
  updatedAt: ""
};

/**
 * APPOINTMENT ENTITY SCHEMA
 * Represents a medical appointment
 */
export const AppointmentSchema = {
  appointmentId: "", // Unique identifier (e.g., "APT-001")
  studentId: "", // Foreign key to User
  staffId: "", // Foreign key to Staff/Doctor
  slotId: "", // Foreign key to TimeSlot
  status: "", // "scheduled" | "completed" | "cancelled" | "rescheduled"
  reason: "", // Reason for appointment
  symptoms: "", // Patient symptoms
  notes: "", // Staff notes
  createdAt: "",
  updatedAt: "",
  scheduledDate: "",
  scheduledTime: ""
};

/**
 * TIME SLOT ENTITY SCHEMA
 * Represents available appointment time slots
 */
export const TimeSlotSchema = {
  slotId: "", // Unique identifier (e.g., "SLOT-001")
  date: "", // YYYY-MM-DD format
  time: "", // HH:MM format (24-hour)
  duration: 30, // Duration in minutes
  isAvailable: true, // Availability status
  staffId: "", // Assigned staff member
  location: "", // "Main Clinic" | "Dental Clinic"
  createdAt: "",
  updatedAt: ""
};

/**
 * MEDICAL RECORD ENTITY SCHEMA
 * Represents patient medical records
 */
export const MedicalRecordSchema = {
  recordId: "", // Unique identifier (e.g., "MR-001")
  studentId: "", // Foreign key to Student
  appointmentId: "", // Foreign key to Appointment
  diagnosis: "",
  treatment: "",
  prescriptions: [], // Array of prescription strings
  vitalSigns: {
    bloodPressure: "",
    heartRate: "",
    temperature: "",
    weight: ""
  },
  medicalHistory: "",
  staffId: "", // Doctor who created the record
  createdAt: "",
  updatedAt: ""
};

/**
 * NOTIFICATION ENTITY SCHEMA
 * Represents system notifications
 */
export const NotificationSchema = {
  notificationId: "", // Unique identifier (e.g., "N-001")
  userId: "", // Target user (or "all" for broadcast)
  type: "", // "success" | "warning" | "info" | "error"
  title: "",
  message: "",
  isRead: false,
  relatedEntity: "", // Related appointment/record ID
  createdAt: ""
};

/**
 * AUDIT LOG ENTITY SCHEMA
 * Tracks all system actions for compliance
 */
export const AuditLogSchema = {
  logId: "", // Unique identifier
  userId: "", // Who performed the action
  action: "", // "CREATE" | "UPDATE" | "DELETE" | "VIEW"
  entityType: "", // "appointment" | "record" | "slot" | "notification"
  entityId: "", // ID of affected entity
  changes: {}, // JSON object of what changed
  timestamp: "",
  ipAddress: "",
  userAgent: ""
};

// ============================================
// SAMPLE JSON DATA FOR DEVELOPMENT
// ============================================

export const SampleUsers = [
  {
    userId: "USR-001",
    schoolId: "20-1234",
    role: "student",
    firstName: "Juan",
    lastName: "Dela Cruz",
    email: "juan.delacruz@cit.edu",
    phone: "+639171234567",
    age: 21,
    gender: "male",
    address: "Cebu City, Philippines",
    dateOfBirth: "2003-05-15",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  {
    userId: "USR-002",
    schoolId: "D-001",
    role: "staff",
    firstName: "Maria",
    lastName: "Santos",
    email: "maria.santos@cit.edu",
    phone: "+639187654321",
    age: 35,
    gender: "female",
    address: "Cebu City, Philippines",
    dateOfBirth: "1989-08-20",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  }
];

export const SampleAppointments = [
  {
    appointmentId: "APT-001",
    studentId: "USR-001",
    staffId: "USR-002",
    slotId: "SLOT-001",
    status: "scheduled",
    reason: "Regular Checkup",
    symptoms: "General wellness check",
    notes: "",
    createdAt: "2025-10-20T10:00:00Z",
    updatedAt: "2025-10-20T10:00:00Z",
    scheduledDate: "2025-10-22",
    scheduledTime: "09:00"
  }
];

export const SampleTimeSlots = [
  {
    slotId: "SLOT-001",
    date: "2025-10-22",
    time: "09:00",
    duration: 30,
    isAvailable: false,
    staffId: "USR-002",
    location: "Main Clinic",
    createdAt: "2025-10-20T00:00:00Z",
    updatedAt: "2025-10-20T10:00:00Z"
  },
  {
    slotId: "SLOT-002",
    date: "2025-10-22",
    time: "09:30",
    duration: 30,
    isAvailable: true,
    staffId: "USR-002",
    location: "Main Clinic",
    createdAt: "2025-10-20T00:00:00Z",
    updatedAt: "2025-10-20T00:00:00Z"
  }
];

// ============================================
// VALIDATION SCHEMAS
// ============================================

export const ValidationRules = {
  user: {
    schoolId: {
      pattern: /^([D]-\d{3}|\d{2}-\d{4})$/,
      message: "Invalid school ID format"
    },
    email: {
      pattern: /^[a-z]+\.[a-z]+@cit\.edu$/i,
      message: "Must be in format: firstname.lastname@cit.edu"
    },
    phone: {
      pattern: /^\+?\d{7,15}$/,
      message: "Valid contact number required"
    },
    password: {
      minLength: 6,
      message: "Password must be at least 6 characters"
    }
  },
  appointment: {
    reason: {
      minLength: 5,
      maxLength: 200,
      message: "Reason must be between 5-200 characters"
    },
    symptoms: {
      minLength: 5,
      maxLength: 500,
      message: "Symptoms description must be between 5-500 characters"
    }
  }
};

// ============================================
// API RESPONSE FORMATS
// ============================================

export const ApiResponse = {
  success: {
    success: true,
    data: null,
    message: ""
  },
  error: {
    success: false,
    error: "",
    message: ""
  }
};

// ============================================
// CONSTANTS
// ============================================

export const ROLES = {
  STUDENT: "student",
  STAFF: "staff"
};

export const APPOINTMENT_STATUS = {
  SCHEDULED: "scheduled",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  RESCHEDULED: "rescheduled"
};

export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  WARNING: "warning",
  INFO: "info",
  ERROR: "error"
};

export const LOCATIONS = {
  MAIN_CLINIC: "Main Clinic",
  DENTAL_CLINIC: "Dental Clinic"
};

export const AUDIT_ACTIONS = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  VIEW: "VIEW"
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate unique ID with prefix
 */
export const generateId = (prefix = "ID") => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Format date to YYYY-MM-DD
 */
export const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Format time to HH:MM
 */
export const formatTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toTimeString().slice(0, 5);
};

/**
 * Calculate time ago from timestamp
 */
export const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  return /^[a-z]+\.[a-z]+@cit\.edu$/i.test(email);
};

/**
 * Validate phone format
 */
export const validatePhone = (phone) => {
  return /^\+?\d{7,15}$/.test(phone);
};

/**
 * Validate school ID format
 */
export const validateSchoolId = (schoolId) => {
  return /^([D]-\d{3}|\d{2}-\d{4})$/.test(schoolId);
};