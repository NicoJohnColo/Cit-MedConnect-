import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login({ onSwitchToRegister }) {
  const { login } = useAuth();
  // Reset to empty to avoid confusion with test credentials
  const [id, setId] = useState('');
  const [password, setPassword] = useState('student');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const formatId = (value) => {
    // Remove all non-digit characters
    const numbers = value.replace(/\D/g, '');
    
    // Apply the xx-xxxx-xxx format
    let formattedValue = '';
    for (let i = 0; i < numbers.length; i++) {
      if (i === 2) {
        formattedValue += '-';
      } else if (i === 6) {
        formattedValue += '-';
      }
      if (i < 9) { // Limit to 9 digits (2 + 4 + 3)
        formattedValue += numbers[i];
      }
    }
    return formattedValue;
  };

  const handleIdChange = (e) => {
    const formattedValue = formatId(e.target.value);
    setId(formattedValue);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    // Debug log
    const cleanId = id.replace(/\D/g, '');
    console.log('Login attempt with:', { id, cleanId, password });
    
    try {
      // Find user with the exact ID (with dashes)
      const res = login({ id, password });
      
      // Debug log
      console.log('Login response:', res);
      
      if (!res.ok) {
        setError('Invalid credentials. Please check your ID and password.');
      } else {
        console.log('Login successful, user:', res.user);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again.');
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.logoContainer}>
        <img 
          src="/images/logo.jpg" 
          alt="CIT MedConnect Logo" 
          style={styles.logoImage} 
        />
        <h1 style={styles.title}>CIT MedConnect</h1>
        <p style={styles.subtitle}>Your Health, Our Priority</p>
      </div>
      
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Login to Your Account</h2>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>School ID</label>
            <div style={styles.inputContainer}>
              <input 
                value={id} 
                onChange={handleIdChange}
                placeholder="XX-XXXX-XXX" 
                style={styles.input} 
                maxLength={11} 
                required
              />
            </div>
          </div>
          
          <div style={styles.formGroup}>
            <div style={styles.labelContainer}>
              <label style={styles.label}>Password</label>
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={styles.forgotPassword}
              >
                Forgot Password?
              </button>
            </div>
            <div style={styles.inputContainer}>
              <input 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Enter your password" 
                style={styles.input} 
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={styles.togglePassword}
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>
          
          {error && <div style={styles.error}>{error}</div>}
          
          <button type="submit" style={styles.loginButton}>
            LOGIN
          </button>
          
          <div style={styles.registerContainer}>
            <span style={styles.registerText}>Don't have an account? </span>
            <button 
              onClick={onSwitchToRegister} 
              style={styles.registerButton}
            >
              Register here
            </button>
          </div>
        </form>
      </div>
      
      <div style={styles.footer}>
        <p style={styles.footerText}>© 2025 CIT MedConnect. All rights reserved.</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  logoImage: {
    width: '80px',
    height: '80px',
    marginBottom: '15px',
    objectFit: 'contain',
    borderRadius: '50%',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
    border: '2px solid #8a1b1b',
    padding: '3px',
    backgroundColor: 'white',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    width: '100%',
    maxWidth: '450px',
  },
  cardTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '30px',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  formGroup: {
    marginBottom: '24px',
  },
  labelContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    color: '#333',
    fontWeight: '500',
    marginBottom: '4px',
  },
  inputContainer: {
    position: 'relative',
    width: '100%',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box',
  },
  inputFocus: {
    outline: 'none',
    borderColor: '#8a1b1b',
  },
  togglePassword: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#8a1b1b',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    textTransform: 'uppercase',
  },
  forgotPassword: {
    background: 'none',
    border: 'none',
    color: '#8a1b1b',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '4px 0',
  },
  loginButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#8a1b1b',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    marginTop: '8px',
    textTransform: 'uppercase',
  },
  loginButtonHover: {
    backgroundColor: '#6e1515',
  },
  registerContainer: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '14px',
    color: '#666',
  },
  registerText: {
    marginRight: '4px',
  },
  registerButton: {
    background: 'none',
    border: 'none',
    color: '#8a1b1b',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '0',
  },
  error: {
    color: '#d32f2f',
    fontSize: '14px',
    margin: '8px 0',
    textAlign: 'center',
  },
  footer: {
    marginTop: '40px',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '12px',
    color: '#999',
  },
};


