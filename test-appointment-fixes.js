// Test script to verify appointment fixes
// Run this in browser console when logged in

console.log('=== Testing Appointment Fixes ===');

// Test 1: Check user role and button visibility
function testRoleBasedAccess() {
    const userStr = localStorage.getItem('medconnect_user');
    if (!userStr) {
        console.log('❌ No user found in localStorage');
        return;
    }
    
    const user = JSON.parse(userStr);
    console.log('✅ User found:', user);
    console.log('✅ User role:', user.role);
    
    // Check if Book Appointment button is correctly hidden/shown
    const bookButton = document.querySelector('button:has(.lucide-plus), button:contains("Book Appointment")');
    const manageSlotsButton = document.querySelector('button:contains("Manage Slots")');
    
    if (user.role === 'staff') {
        const bookButtonVisible = bookButton && bookButton.offsetParent !== null;
        const manageButtonVisible = manageSlotsButton && manageSlotsButton.offsetParent !== null;
        
        console.log('👤 Staff User Test:');
        console.log('  Book Appointment Button (should be hidden):', bookButtonVisible ? '❌ VISIBLE' : '✅ HIDDEN');
        console.log('  Manage Slots Button (should be visible):', manageButtonVisible ? '✅ VISIBLE' : '❌ HIDDEN');
    } else {
        const bookButtonVisible = bookButton && bookButton.offsetParent !== null;
        const manageButtonVisible = manageSlotsButton && manageSlotsButton.offsetParent !== null;
        
        console.log('👨‍🎓 Student User Test:');
        console.log('  Book Appointment Button (should be visible):', bookButtonVisible ? '✅ VISIBLE' : '❌ HIDDEN');
        console.log('  Manage Slots Button (should be hidden):', manageButtonVisible ? '❌ VISIBLE' : '✅ HIDDEN');
    }
}

// Test 2: Check if appointments are loading
function testAppointmentLoading() {
    // Wait a moment for data to load
    setTimeout(() => {
        const tableRows = document.querySelectorAll('table tbody tr');
        const emptyState = document.querySelector('.empty-state');
        
        console.log('📋 Appointment Loading Test:');
        console.log('  Table rows found:', tableRows.length);
        console.log('  Empty state visible:', emptyState && emptyState.offsetParent !== null);
        
        if (tableRows.length > 0 && !emptyState) {
            console.log('✅ Appointments are loading and displaying');
        } else if (emptyState) {
            console.log('ℹ️  No appointments found (this may be expected)');
        } else {
            console.log('❌ No appointments or empty state found');
        }
    }, 2000);
}

// Test 3: Check API calls
async function testAPIConnections() {
    const userStr = localStorage.getItem('medconnect_user');
    const user = JSON.parse(userStr || '{}');
    
    const headers = {
        'Content-Type': 'application/json',
        'X-User-ID': user.userId || user.schoolId,
        'X-User-Role': user.role?.toUpperCase() || 'STUDENT'
    };
    
    console.log('🔌 API Connection Test:');
    
    try {
        // Test appointments endpoint
        const appointmentsUrl = user.role === 'staff' 
            ? 'http://localhost:8080/api/appointments'
            : `http://localhost:8080/api/appointments/user/${user.userId || user.schoolId}`;
            
        console.log('  Testing appointments endpoint:', appointmentsUrl);
        const aptResponse = await fetch(appointmentsUrl, { headers });
        console.log('  Appointments response status:', aptResponse.status);
        
        if (aptResponse.ok) {
            const appointments = await aptResponse.json();
            console.log('  ✅ Appointments loaded:', appointments.length, 'appointments');
        } else {
            console.log('  ❌ Appointments failed:', aptResponse.status);
        }
        
        // Test slots endpoint
        const slotsUrl = user.role === 'staff'
            ? `http://localhost:8080/api/timeslots/staff/${user.userId || user.schoolId}`
            : 'http://localhost:8080/api/timeslots/available';
            
        console.log('  Testing slots endpoint:', slotsUrl);
        const slotsResponse = await fetch(slotsUrl, { headers });
        console.log('  Slots response status:', slotsResponse.status);
        
        if (slotsResponse.ok) {
            const slots = await slotsResponse.json();
            console.log('  ✅ Slots loaded:', slots.length, 'slots');
        } else {
            console.log('  ❌ Slots failed:', slotsResponse.status);
        }
        
    } catch (error) {
        console.log('  ❌ API test failed:', error.message);
    }
}

// Run all tests
console.log('Starting tests...');
testRoleBasedAccess();
testAppointmentLoading();
testAPIConnections();

console.log('=== Test Complete ===');
console.log('Check the results above to verify all fixes are working correctly.');
