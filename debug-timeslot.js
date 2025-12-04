// Debug script to test time slot creation
// Run this in browser console when logged in as staff

console.log('=== Time Slot Debug ===');

// Check user authentication
const userStr = localStorage.getItem('medconnect_user');
if (userStr) {
    const user = JSON.parse(userStr);
    console.log('User found:', user);
    console.log('User role:', user.role);
    console.log('User ID:', user.userId || user.schoolId);
} else {
    console.log('No user found in localStorage');
}

// Test API call directly
const testCreateSlot = async () => {
    const user = JSON.parse(localStorage.getItem('medconnect_user') || '{}');
    
    const headers = {
        'Content-Type': 'application/json',
        'X-User-ID': user.userId || user.schoolId,
        'X-User-Role': user.role?.toUpperCase() || 'STUDENT'
    };
    
    const body = {
        slotDate: '2025-12-11',
        startTime: '01:02:00',
        endTime: '02:02:00',
        maxBookings: 1,
        staffId: user.userId || user.schoolId || 'D-001',
        isAvailable: true
    };
    
    console.log('Headers:', headers);
    console.log('Body:', body);
    
    try {
        const response = await fetch('http://localhost:8080/api/timeslots', {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
    } catch (error) {
        console.error('Error:', error);
    }
};

// Uncomment to test
// testCreateSlot();
