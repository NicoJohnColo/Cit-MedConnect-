import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

function pseudoEncrypt(text) {
  try {
    return btoa(unescape(encodeURIComponent(text)));
  } catch (e) {
    return text;
  }
}

const roles = ['student', 'doctor', 'staff', 'admin'];

const defaultUsers = [
  { id: '12-3456-789', password: 'student', role: 'student', name: 'Alex Student' },
  { id: '98-7654-321', password: 'doctor', role: 'doctor', name: 'Dr. Rivera' },
  { id: '45-6789-012', password: 'staff', role: 'staff', name: 'Sam Staff' },
  { id: '34-5678-901', password: 'admin', role: 'admin', name: 'Ada Admin' },
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);

  const [patients, setPatients] = useState([]); 

  function logAudit(action, meta) {
    setAuditTrail(prev => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        action,
        meta: pseudoEncrypt(JSON.stringify(meta || {})),
      },
      ...prev,
    ]);
  }

  function login({ id, password }) {
    console.log('Attempting login with:', { id, password });
    

    const found = defaultUsers.find(u => {
      console.log('Checking user:', u.id, 'against input:', id);
      return u.id === id && u.password === password;
    });
    
    if (found) {
      console.log('Login successful for user:', found.id);
      const user = { id: found.id, role: found.role, name: found.name };
      setCurrentUser(user);
      logAudit('login', { id: found.id, role: found.role });
      return { ok: true, user };
    }
    
    console.log('Login failed - no matching user found');
    return { ok: false, error: 'Invalid credentials' };
  }

  function logout() {
    if (currentUser) {
      logAudit('logout', { id: currentUser.id });
    }
    setCurrentUser(null);
  }

  function registerPatient(patient) {
    const enriched = {
      ...patient,
      id: `P-${patients.length + 1}`,
      createdAt: new Date().toISOString(),
    };
    setPatients(prev => [enriched, ...prev]);
    logAudit('patient_register', { id: enriched.id });
    return enriched;
  }

  const value = useMemo(() => ({
    currentUser,
    login,
    logout,
    roles,
    auditTrail,
    logAudit,
    patients,
    registerPatient,
  }), [currentUser, auditTrail, patients]);

  useEffect(() => {
    const stored = sessionStorage.getItem('mc_user');
    if (stored && !currentUser) {
      try { setCurrentUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('mc_user', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem('mc_user');
    }
  }, [currentUser]);

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


