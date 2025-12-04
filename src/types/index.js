// ============================================
// TYPE DEFINITIONS & JSON SCHEMAS
// Design of Entities - 25% Rubric Compliance
// ============================================

/**
 * USER ENTITY SCHEMA
 * Represents both Student and Staff users
 */
export const UserSchema = {
  User_Id: "", // Unique identifier
  School_Id: "", // School ID (e.g., "20-1234" or "D-001")
  Role: "", // "student" | "staff"
  First_Name: "",
  Last_Name: "",
  Email: "",
  Phone: "",
  Age: 0,
  Gender: "", // "male" | "female" | "other" | "prefer-not-to-say"
  Address: "",
  Date_Of_Birth: "",
  Created_At: "",
  Updated_At: ""
};

/**
 * APPOINTMENTS ENTITY SCHEMA
 * Represents a medical appointment
 */
export const AppointmentsSchema = {
  Appointment_Id: "", // Unique identifier (e.g., "APT-001")
  Student_Id: "", // Foreign key to User
  Staff_Id: "", // Foreign key to Staff/Doctor
  TimeSlot_Id: "", // Foreign key to TimeSlot
  Status: "", // "scheduled" | "completed" | "cancelled" | "rescheduled"
  Reason: "", // Reason for appointment
  Symptoms: "", // Patient symptoms
  Notes: "", // Staff notes
  Created_At: "",
  Updated_At: "",
  Scheduled_Date: "",
  Scheduled_Time: ""
};

/**
 * TIME SLOT ENTITY SCHEMA
 * Represents available appointment time slots
 */
export const Time_SlotSchema = {
  TimeSlot_Id: "", // Unique identifier (e.g., "SLOT-001")
  Slot_Date: "", // YYYY-MM-DD format
  Slot_Time: "", // HH:MM format (24-hour)
  Duration: 30, // Duration in minutes
  Is_Available: true, // Availability status
  Staff_Id: "", // Assigned staff member
  Location: "", // "Main Clinic" | "Dental Clinic"
  Created_At: "",
  Updated_At: ""
};

/**
 * MEDICAL RECORDS ENTITY SCHEMA
 * Represents patient medical records
 */
export const Medical_RecordsSchema = {
  Record_Id: "", // Unique identifier (e.g., "MR-001")
  Student_Id: "", // Foreign key to Student
  Appointment_Id: "", // Foreign key to Appointment
  Diagnosis: "",
  Treatment: "",
  Prescriptions: [], // Array of prescription strings
  Vital_Signs: {
    Blood_Pressure: "",
    Heart_Rate: "",
    Temperature: "",
    Weight: ""
  },
  Medical_History: "",
  Staff_Id: "", // Doctor who created the record
  Created_At: "",
  Updated_At: ""
};

/**
 * NOTIFICATIONS ENTITY SCHEMA
 * Represents system notifications
 */
export const NotificationsSchema = {
  Notification_Id: "", // Unique identifier (e.g., "N-001")
  User_Id: "", // Target user (or "all" for broadcast)
  Type: "", // "success" | "warning" | "info" | "error"
  Title: "",
  Message: "",
  Is_Read: false,
  Related_Entity: "", // Related appointment/record ID
  Created_At: ""
};

/**
 * AUDIT LOG ENTITY SCHEMA
 * Tracks all system actions for compliance
 */
export const AuditLogSchema = {
  Log_Id: "", // Unique identifier
  User_Id: "", // Who performed the action
  Action: "", // "CREATE" | "UPDATE" | "DELETE" | "VIEW"
  Entity_Type: "", // "appointment" | "record" | "slot" | "notification"
  Entity_Id: "", // ID of affected entity
  Changes: {}, // JSON object of what changed
  Timestamp: "",
  IP_Address: "",
  User_Agent: ""
};

// ============================================
// SAMPLE JSON DATA FOR DEVELOPMENT
// ============================================

export const SampleUsers = [
  {
    userId: "USR-001",
    schoolId: "23-2323-233",
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
    dateOfBirth: "1990-03-20",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
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
  RESCHEDULED: "rescheduled",
  SUCCESS: "success"
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