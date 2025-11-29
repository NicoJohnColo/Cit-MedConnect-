// Debug script to test notification API
// Run this in browser console when logged in as a student

const debugNotifications = async () => {
  const API_URL = 'http://localhost:8080/api';
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('No token found. Please log in first.');
    return;
  }

  // Get user info from localStorage (adjust based on your auth implementation)
  const user = JSON.parse(localStorage.getItem('medconnect_user') || '{}');
  const schoolId = user.schoolId;
  const userRole = user.role;

  console.log('Debug Info:');
  console.log('School ID:', schoolId);
  console.log('User Role:', userRole);
  console.log('Token:', token.substring(0, 20) + '...');

  try {
    // Test the notifications endpoint
    console.log('\n🔍 Testing notifications endpoint...');
    
    const response = await fetch(
      `${API_URL}/notifications/user/${schoolId}/role/${userRole}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const notifications = await response.json();
    console.log('✅ Notifications received:', notifications);
    console.log('Number of notifications:', notifications.length);

    if (notifications.length > 0) {
      console.log('First notification structure:', notifications[0]);
      console.log('Fields present:', Object.keys(notifications[0]));
      
      // Check if isRead field exists
      notifications.forEach((notif, index) => {
        console.log(`Notification ${index + 1}:`, {
          id: notif.notificationId,
          title: notif.title,
          type: notif.notificationType,
          isRead: notif.isRead,
          isReadField: 'isRead' in notif,
          createdAt: notif.createdAt
        });
      });
    } else {
      console.log('❌ No notifications found');
    }

  } catch (error) {
    console.error('❌ Network error:', error);
  }

  // Test all notifications endpoint
  try {
    console.log('\n🔍 Testing all notifications endpoint...');
    
    const allResponse = await fetch(
      `${API_URL}/notifications/`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (allResponse.ok) {
      const allNotifications = await allResponse.json();
      console.log('✅ All notifications in system:', allNotifications.length);
      
      // Look for notifications related to this user
      const relatedNotifs = allNotifications.filter(n => 
        n.schoolId === schoolId || 
        n.notificationType === 'GLOBAL_BROADCAST' ||
        n.notificationType === 'STUDENT_BROADCAST'
      );
      
      console.log('Notifications related to user:', relatedNotifs.length);
      relatedNotifs.forEach((notif, index) => {
        console.log(`Related Notification ${index + 1}:`, {
          id: notif.notificationId,
          title: notif.title,
          schoolId: notif.schoolId,
          type: notif.notificationType,
          isGlobal: notif.isGlobal,
          isRead: notif.isRead,
          createdAt: notif.createdAt
        });
      });
    }
  } catch (error) {
    console.error('❌ Error fetching all notifications:', error);
  }
};

// Run the debug function
debugNotifications();

// Also expose it for manual testing
window.debugNotifications = debugNotifications;
