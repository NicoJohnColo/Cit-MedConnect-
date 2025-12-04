// Test script to verify API endpoints are working
// Run this in browser console to test backend connectivity

console.log('=== Testing API Endpoints ===');

// Test 1: Check if backend is running
async function testBackendConnection() {
    try {
        console.log('Testing backend connection...');
        const response = await fetch('http://localhost:8080/api/appointments', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': 'TEST001',
                'X-User-Role': 'STAFF'
            }
        });
        
        console.log('Backend connection status:', response.status);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend is running and accessible');
            console.log('Sample data:', data);
        } else {
            console.log('❌ Backend returned error:', response.status);
            const errorText = await response.text();
            console.log('Error details:', errorText);
        }
    } catch (error) {
        console.log('❌ Cannot connect to backend:', error.message);
        if (error.message.includes('CORS')) {
            console.log('🔥 CORS Issue detected! Backend needs CORS configuration.');
            console.log('📝 Apply the CorsConfig.java from backend-fixes folder to your Spring Boot project.');
        }
        if (error.message.includes('Failed to fetch')) {
            console.log('🔥 Connection failed! Make sure Spring Boot backend is running on localhost:8080');
        }
    }
}

// Test 2: Check API endpoints configuration
function testApiEndpoints() {
    console.log('Checking API endpoints configuration...');
    
    // Import and check API endpoints
    const endpoints = {
        'BOOK_APPOINTMENT': '/appointments/book',
        'APPOINTMENTS': '/appointments',
        'TIME_SLOTS': '/timeslots',
        'AVAILABLE_SLOTS': '/timeslots/available'
    };
    
    Object.entries(endpoints).forEach(([key, endpoint]) => {
        console.log(`${key}: http://localhost:8080/api${endpoint}`);
    });
}

// Test 3: Test booking endpoint specifically
async function testBookingEndpoint() {
    try {
        console.log('Testing booking endpoint...');
        
        const bookingData = {
            timeSlotId: 1,
            studentId: 'TEST001',
            reason: 'Test appointment',
            notes: 'Test notes'
        };
        
        const response = await fetch('http://localhost:8080/api/appointments/book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': 'TEST001',
                'X-User-Role': 'STUDENT'
            },
            body: JSON.stringify(bookingData)
        });
        
        console.log('Booking endpoint status:', response.status);
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Booking endpoint works:', result);
        } else {
            const error = await response.text();
            console.log('❌ Booking endpoint error:', response.status, error);
        }
    } catch (error) {
        console.log('❌ Booking endpoint failed:', error.message);
    }
}

// Run all tests
testBackendConnection();
testApiEndpoints();
testBookingEndpoint();

console.log('=== API Test Complete ===');
console.log('If you see CORS errors, apply the backend fixes from the backend-fixes folder');
