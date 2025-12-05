// ============================================
// DATA TRANSFORMATION UTILITIES
// Standardizes backend data for frontend consumption
// ============================================

export const transformAppointment = (apt) => {
    if (!apt) return null;
    
    console.log('=== TRANSFORMING APPOINTMENT ===');
    console.log('Raw appointment:', apt);
    
    // Extract date and time from nested timeSlot object
    const scheduledDate = apt.timeSlot?.slotDate || apt.scheduledDate || apt.date || apt.appointmentDate;
    const scheduledTime = apt.timeSlot?.startTime || apt.scheduledTime || apt.time || apt.appointmentTime;
    
    // Extract student ID from nested user object
    const studentId = apt.user?.schoolId || apt.studentId || apt.userId;
    
    console.log('Extracted scheduledDate:', scheduledDate);
    console.log('Extracted scheduledTime:', scheduledTime);
    console.log('Extracted studentId:', studentId);
    
    const transformed = {
        // Core appointment fields
        appointmentId: apt.appointmentId || apt.id,
        studentId: studentId,
        staffId: apt.staffId || apt.providerId || apt.timeSlot?.staffId,
        timeSlotId: apt.timeSlotId || apt.timeSlot?.timeSlotId,
        
        // Date/time fields - normalize to frontend format
        scheduledDate: scheduledDate,
        scheduledTime: scheduledTime,
        date: scheduledDate,
        time: scheduledTime,
        
        // Appointment details
        reason: apt.reason || apt.purpose || apt.description || '',
        notes: apt.notes || apt.comments || apt.additionalInfo || '',
        status: apt.status || 'SCHEDULED', // Backend uses PENDING, SCHEDULED, etc.
        
        // Location information - derive from staff or use default
        location: apt.location || apt.venue || apt.clinic || apt.room || 
                 (apt.timeSlot?.staffId === 'STAFF001' ? 'Main Clinic' : 'Clinic'),
        
        // Metadata
        createdAt: apt.createdAt || apt.createdDate,
        updatedAt: apt.updatedAt || apt.modifiedDate,
        
        // User information from backend response
        user: apt.user || {
            schoolId: studentId || 'Unknown'
        },
        
        // Time slot information from backend response
        timeSlot: apt.timeSlot,
        
        // Keep original data for reference
        _original: apt
    };
    
    console.log('Transformed appointment:', transformed);
    return transformed;
};

export const transformTimeSlot = (slot) => {
    if (!slot) return null;
    
    return {
        // Core time slot fields
        slotId: slot.timeSlotId || slot.id || slot.slotId,
        staffId: slot.staffId,
        
        // Date/time fields - normalize to frontend format
        date: slot.slotDate || slot.date,
        time: slot.startTime || slot.time,
        endTime: slot.endTime,
        
        // Availability - use backend field names
        available: slot.isAvailable !== false, // Backend uses isAvailable
        maxBookings: slot.maxBookings || 1,
        currentBookings: slot.currentBookings || 0,
        
        // Business hours
        withinBusinessHours: slot.withinBusinessHours !== false,
        
        // Location information (not in backend response, add default)
        location: slot.location || slot.venue || slot.clinic || slot.room || 'Main Clinic',
        
        // Staff information
        staff: slot.staff || {
            firstName: 'Staff',
            lastName: 'Member',
            email: 'staff@cit.edu'
        },
        
        // Metadata
        createdAt: slot.createdAt,
        updatedAt: slot.updatedAt,
        
        // Keep original data for reference
        _original: slot
    };
};

export const reverseTransformAppointment = (apt) => {
    if (!apt) return null;
    
    return {
        appointmentId: apt.appointmentId,
        studentId: apt.studentId,
        staffId: apt.staffId,
        timeSlotId: apt.timeSlotId,
        scheduledDate: apt.scheduledDate || apt.date,
        scheduledTime: apt.scheduledTime || apt.time,
        reason: apt.reason,
        notes: apt.notes,
        status: apt.status,
        location: apt.location,
        createdAt: apt.createdAt,
        updatedAt: apt.updatedAt
    };
};

export const reverseTransformTimeSlot = (slot) => {
    if (!slot) return null;
    
    return {
        timeSlotId: slot.slotId,
        staffId: slot.staffId,
        slotDate: slot.date,
        startTime: slot.time,
        endTime: slot.endTime,
        available: slot.available,
        maxBookings: slot.maxBookings,
        currentBookings: slot.currentBookings,
        withinBusinessHours: slot.withinBusinessHours,
        location: slot.location,
        createdAt: slot.createdAt,
        updatedAt: slot.updatedAt
    };
};
