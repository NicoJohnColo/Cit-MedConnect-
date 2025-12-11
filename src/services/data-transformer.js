// ============================================
// DATA TRANSFORMATION UTILITIES
// Standardizes backend data for frontend consumption
// ============================================

export const transformAppointment = (apt) => {
    if (!apt) return null;
    
    console.log('=== TRANSFORMING APPOINTMENT ===');
    console.log('Raw appointment:', apt);
    
    
    const scheduledDate = apt.timeSlot?.slotDate || apt.scheduledDate || apt.date || apt.appointmentDate;
    const scheduledTime = apt.timeSlot?.startTime || apt.scheduledTime || apt.time || apt.appointmentTime;
    
   
    const studentId = apt.user?.schoolId || apt.studentId || apt.userId;
    
    console.log('Extracted scheduledDate:', scheduledDate);
    console.log('Extracted scheduledTime:', scheduledTime);
    console.log('Extracted studentId:', studentId);
    
    const transformed = {
       
        appointmentId: apt.appointmentId || apt.id,
        studentId: studentId,
        staffId: apt.staffId || apt.providerId || apt.timeSlot?.staffId,
        timeSlotId: apt.timeSlotId || apt.timeSlot?.timeSlotId,
        
    
        scheduledDate: scheduledDate,
        scheduledTime: scheduledTime,
        date: scheduledDate,
        time: scheduledTime,
        
     
        reason: apt.reason || apt.purpose || apt.description || '',
        notes: apt.notes || apt.comments || apt.additionalInfo || '',
        status: apt.status || 'SCHEDULED', 
        
       
        location: apt.location || apt.venue || apt.clinic || apt.room || 
                 (apt.timeSlot?.staffId === 'STAFF001' ? 'Main Clinic' : 'Clinic'),
        
     
        createdAt: apt.createdAt || apt.createdDate,
        updatedAt: apt.updatedAt || apt.modifiedDate,
        
      
        user: apt.user || {
            schoolId: studentId || 'Unknown'
        },
        
       
        timeSlot: apt.timeSlot,
        
        
        _original: apt
    };
    
    console.log('Transformed appointment:', transformed);
    return transformed;
};

export const transformTimeSlot = (slot) => {
    if (!slot) return null;
    
    return {
        
        slotId: slot.timeSlotId || slot.id || slot.slotId,
        staffId: slot.staffId,
        
        
        date: slot.slotDate || slot.date,
        time: slot.startTime || slot.time,
        endTime: slot.endTime,
        
       
        available: slot.isAvailable !== false, 
        maxBookings: slot.maxBookings || 1,
        currentBookings: slot.currentBookings || 0,
        
        
        withinBusinessHours: slot.withinBusinessHours !== false,
        
        
        location: slot.location || slot.venue || slot.clinic || slot.room || 'Main Clinic',
        
        
        staff: slot.staff || {
            firstName: 'Staff',
            lastName: 'Member',
            email: 'staff@cit.edu'
        },
        
        
        createdAt: slot.createdAt,
        updatedAt: slot.updatedAt,
        
        
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
