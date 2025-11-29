# Fix Duplicate Notifications Issue

## Problem: 
You're getting 5 duplicate notifications for one account because the backend is sending multiple notifications to the same user.

## Root Causes:
1. **Sender receives their own notification**
2. **Multiple user records with same school ID**
3. **Broadcast logic includes sender**

## Fix 1: Exclude Sender from Broadcast

In your `NotificationService.java`, modify the broadcast methods:

```java
public List<NotificationEntity> sendNotificationToAllStudents(String title, String message) {
    List<UserEntity> students = userRepository.findByRole("STUDENT");
    List<NotificationEntity> notifications = new ArrayList<>();
    
    // Get current user (sender) to exclude them
    String currentUserSchoolId = getCurrentUserSchoolId(); // Implement this method
    
    for (UserEntity student : students) {
        // Exclude the sender from receiving their own notification
        if (!student.getSchoolId().equals(currentUserSchoolId)) {
            NotificationEntity notification = new NotificationEntity();
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setSchoolId(student.getSchoolId());
            notification.setUserRole("STUDENT");
            notification.setRead(false);
            notification.setCreatedAt(new Date());
            
            notifications.add(notificationRepository.save(notification));
        }
    }
    
    return notifications;
}

public List<NotificationEntity> sendNotificationToEveryone(String title, String message) {
    List<UserEntity> allUsers = userRepository.findAll();
    List<NotificationEntity> notifications = new ArrayList<>();
    
    // Get current user (sender) to exclude them
    String currentUserSchoolId = getCurrentUserSchoolId();
    
    for (UserEntity user : allUsers) {
        // Exclude the sender from receiving their own notification
        if (!user.getSchoolId().equals(currentUserSchoolId)) {
            NotificationEntity notification = new NotificationEntity();
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setSchoolId(user.getSchoolId());
            notification.setUserRole(user.getRole());
            notification.setRead(false);
            notification.setCreatedAt(new Date());
            
            notifications.add(notificationRepository.save(notification));
        }
    }
    
    return notifications;
}

// Add this helper method to get current user
private String getCurrentUserSchoolId() {
    // Get the currently authenticated user's school ID
    // This depends on your authentication setup
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication != null && authentication.getPrincipal() instanceof UserDetails) {
        String username = ((UserDetails) authentication.getPrincipal()).getUsername();
        UserEntity currentUser = userRepository.findByUsername(username);
        return currentUser != null ? currentUser.getSchoolId() : null;
    }
    return null;
}
```

## Fix 2: Check for Duplicate User Records

Run this query to check if you have duplicate users:

```sql
SELECT schoolId, COUNT(*) as count 
FROM users 
GROUP BY schoolId 
HAVING COUNT(*) > 1;
```

## Fix 3: Add Unique Constraint

Add this to your UserEntity:

```java
@Table(uniqueConstraints = {
    @UniqueConstraint(columnNames = "schoolId")
})
public class UserEntity {
    // your existing fields
}
```

## Fix 4: Clean Up Existing Duplicates

```sql
-- Find and remove duplicate user records (keep the latest)
DELETE u1 FROM users u1
INNER JOIN users u2 
WHERE u1.schoolId = u2.schoolId 
AND u1.id < u2.id;
```

## Quick Test:

1. **Check browser console** - see how many notifications are being created
2. **Check database** - look for duplicate schoolId entries
3. **Test with different users** - see if issue persists

The most likely fix is **excluding the sender** from receiving their own notification!
