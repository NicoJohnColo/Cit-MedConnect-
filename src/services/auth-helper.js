// ============================================
// AUTHENTICATION HELPER
// Standardizes user ID handling across the app
// ============================================

export const getUserId = (user) => {
    if (!user) return null;
    
    // Priority order for user ID
    return user.userId || 
           user.schoolId || 
           user.id || 
           user.email?.split('@')[0] ||
           'unknown-user';
};

export const getUserRole = (user) => {
    if (!user) return 'STUDENT';
    
    return user.role || 
           user.userType || 
           user.type || 
           'STUDENT';
};

export const isStaff = (user) => {
    const role = getUserRole(user);
    return role?.toLowerCase() === 'staff' || 
           role?.toLowerCase() === 'admin' ||
           role?.toLowerCase() === 'doctor';
};

export const isStudent = (user) => {
    const role = getUserRole(user);
    return role?.toLowerCase() === 'student' || 
           role?.toLowerCase() === 'patient';
};

export const getAuthHeaders = (user) => {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (user) {
        headers['X-User-ID'] = getUserId(user);
        headers['X-User-Role'] = getUserRole(user).toUpperCase();
        
        // Add JWT token if available
        if (user.token) {
            headers['Authorization'] = `Bearer ${user.token}`;
        }
    }
    
    return headers;
};
