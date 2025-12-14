import { useState, useEffect } from 'react';

/**
 * Hook to verify user role from backend database
 * Prevents role bypass via localStorage manipulation
 * 
 * This hook:
 * 1. Reads user from localStorage
 * 2. Verifies role with backend database
 * 3. Compares localStorage role with database role
 * 4. If mismatch detected = security violation = logout
 * 
 * @returns {Object} Verified role information
 */
const useVerifiedRole = () => {
  const [verifiedRole, setVerifiedRole] = useState(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyRole = async () => {
      try {
        
        const storedUser = localStorage.getItem('medconnect_user');
        
        if (!storedUser) {
          setVerifiedRole(null);
          setIsVerifying(false);
          return;
        }

        const user = JSON.parse(storedUser);
        
        if (!user?.email) {
          setVerifiedRole(null);
          setIsVerifying(false);
          return;
        }

       
        const response = await fetch(
          `http://localhost:8080/api/users/verify-role/${encodeURIComponent(user.email)}`
        );

        if (!response.ok) {
          throw new Error('Failed to verify role from backend');
        }

        const data = await response.json();
        const actualRole = data.role; 

       
        if (user.role !== actualRole) {
          console.error('═══════════════════════════════════════════');
          console.error('🚨 SECURITY VIOLATION DETECTED!');
          console.error('═══════════════════════════════════════════');
          console.error('❌ localStorage claims role:', user.role);
          console.error('✅ Database actual role:', actualRole);
          console.error('📧 User email:', user.email);
          console.error('🔒 Action: Clearing session and logging out');
          console.error('═══════════════════════════════════════════');
          
          
          localStorage.removeItem('medconnect_user');
          localStorage.removeItem('medconnect_session_expiry');
          localStorage.removeItem('medconnect_appointments');
          localStorage.removeItem('medconnect_timeslots');
          localStorage.removeItem('medconnect_medical_records');
          
          setError('Security violation: Role tampering detected. Logging out...');
          setVerifiedRole(null);
          
          
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          
          return;
        }

        
        console.log('✅ Role verified:', actualRole);
        setVerifiedRole(actualRole);
        setError(null);

      } catch (err) {
        console.error('Role verification error:', err);
        setError('Failed to verify role. Please refresh or re-login.');
        setVerifiedRole(null);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyRole();
  }, []);

  return {
    verifiedRole,           
    isStaff: verifiedRole === 'staff',
    isStudent: verifiedRole === 'student',
    isAdmin: verifiedRole === 'admin',
    isVerifying,           
    error,                  
    hasAccess: (requiredRole) => verifiedRole === requiredRole
  };
};

export default useVerifiedRole;