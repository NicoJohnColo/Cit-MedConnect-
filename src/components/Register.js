import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Register({ onSwitchToLogin }) {
  const { registerPatient } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', contact: '', medicalInfo: '' });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  function validateEmailInput(value) {
    // Allow letters, dots, and backspace
    return /^[a-zA-Z.@]*$/.test(value) || value === '';
  }

  function formatEmail(value) {
    // Remove any spaces and convert to lowercase
    let formatted = value.replace(/\s+/g, '').toLowerCase();
    
    // If user is typing the domain part
    if (formatted.includes('@')) {
      const [localPart, domain] = formatted.split('@');
      if (!domain) return localPart + '@';
      
      // Auto-complete cit.edu if user starts typing 'c'
      if (domain.startsWith('c')) {
        return `${localPart}@cit.edu`;
      }
      
      // Allow manual typing of the full domain
      return formatted;
    }
    
    // If user is typing the first part (before @)
    // Allow multiple dots in the first part
    return formatted;
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name required';
    if (!/^[a-z]+(?:\.[a-z]+)*@cit\.edu$/.test(form.email)) {
      e.email = 'Must be in format: firstname.lastname@cit.edu';
    }
    if (!/^\+?\d{7,15}$/.test(form.contact)) e.contact = 'Valid contact number required';
    if (form.medicalInfo.trim().length < 5) e.medicalInfo = 'Please add brief medical info';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    const created = registerPatient(form);
    setSuccess(`Registered with ID ${created.id}`);
    setForm({ name: '', email: '', contact: '', medicalInfo: '' });
  }

  function setField(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  return (
    <div style={{ maxWidth: 560, margin: '40px auto', padding: 24, borderRadius: 12, background: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
      <h2 style={{ marginBottom: 8 }}>Patient Registration</h2>
      <form onSubmit={handleSubmit}>
        <Field label="Full Name" value={form.name} onChange={v => setField('name', v)} error={errors.name} />
        <Field 
          label="Email" 
          value={form.email} 
          onChange={v => {
            if (validateEmailInput(v)) {
              setField('email', formatEmail(v));
            }
          }} 
          placeholder="firstname.lastname@cit.edu"
          error={errors.email} 
        />
        <Field label="Contact" value={form.contact} onChange={v => setField('contact', v)} error={errors.contact} />
        <Field label="Medical Info" textarea value={form.medicalInfo} onChange={v => setField('medicalInfo', v)} error={errors.medicalInfo} />
        <button type="submit" style={primaryBtnStyle}>Register</button>
      </form>
      {success && <div style={{ color: 'green', marginTop: 12 }}>{success}</div>}
      <div style={{ marginTop: 12, fontSize: 14 }}>
        Have an account? <button onClick={onSwitchToLogin} style={linkBtn}>Back to Login</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, error, textarea, placeholder = '' }) {
  return (
    <div style={{ marginTop: 12 }}>
      <label style={{ display: 'block', marginBottom: 6 }}>{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, minHeight: 80 }} />
      ) : (
        <input 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          style={inputStyle} 
          placeholder={placeholder}
        />
      )}
      {error && <div style={{ color: '#b00020', marginTop: 6 }}>{error}</div>}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #ddd',
};

const primaryBtnStyle = {
  marginTop: 16,
  padding: '12px 16px',
  borderRadius: 10,
  border: 'none',
  background: '#8a1b1b',
  color: 'white',
  cursor: 'pointer',
};

const linkBtn = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: '#8a1b1b',
  cursor: 'pointer',
};


