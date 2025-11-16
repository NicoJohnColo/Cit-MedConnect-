// ============================================
// LANDING PAGE COMPONENT
// src/pages/Landing.jsx
// ============================================

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { 
  Settings, Stethoscope, Calendar, Users, Shield, Clock, 
  ChevronRight, Sparkles, Activity, Heart, Zap, Award, 
  CheckCircle2, ArrowRight, Star, TrendingUp, Globe,
  User, Lock, Eye, EyeOff, Mail
} from 'lucide-react';
import './Landing.css';

const logo = '/images/logo.jpg';

/**
 * Main Landing Page Component
 * Combines premium UI with full authentication logic
 */
const Landing = () => {
  // Debug: Check if component is loading
  console.log('Landing component loaded');
  
  // Debug: Check if CSS is loaded
  useEffect(() => {
    console.log('Checking CSS...');
    const styleSheets = Array.from(document.styleSheets);
    const landingStyles = styleSheets.find(sheet => 
      sheet.href && sheet.href.includes('Landing.css')
    );
    console.log('Landing.css loaded:', !!landingStyles);
    
    // Log computed styles for debugging
    if (typeof window !== 'undefined') {
      const input = document.querySelector('.form-input');
      if (input) {
        const styles = window.getComputedStyle(input);
        console.log('Input styles:', {
          padding: styles.padding,
          position: styles.position,
          display: styles.display
        });
      }
    }
  }, []);
  const navigate = useNavigate();
  const { login, register, user, loading: authLoading } = useAuth();
  
  // UI State
  const [activeTab, setActiveTab] = useState('login');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Login form state
  const [loginData, setLoginData] = useState({
    schoolId: '',
    password: '',
    rememberMe: false
  });
  
  // Register form state
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  // Form state
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');

  // ============================================
  // AUTO-REDIRECT IF ALREADY LOGGED IN
  // ============================================
  
  useEffect(() => {
    if (user && !authLoading) {
      console.log('User already logged in, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // ============================================
  // SCROLL TRACKING
  // ============================================
  
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ============================================
  // MOUSE TRACKING FOR PARALLAX
  // ============================================
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 20,
        y: (e.clientY / window.innerHeight) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ============================================
  // LOGIN HANDLERS
  // ============================================

  const handleLoginChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setServerError('');
  }, [errors]);

  const validateLogin = useCallback(() => {
    const newErrors = {};
    if (!loginData.schoolId.trim()) {
      newErrors.schoolId = 'School ID is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [loginData]);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    setServerError('');
    
    if (!validateLogin()) return;
    
    setLoading(true);
    try {
      console.log('Attempting login with:', loginData.schoolId);
      
      const result = await login(
        loginData.schoolId.trim(),
        loginData.password || 'demo123',
        loginData.rememberMe
      );
      
      console.log('Login result:', result);
      
      if (result.success) {
        console.log('Login successful, navigating to dashboard');
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100);
      } else {
        setServerError(result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [loginData, login, navigate, validateLogin]);

  // ============================================
  // REGISTER HANDLERS
  // ============================================

  const handleRegisterChange = useCallback((e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setServerError('');
    setSuccess('');
  }, [errors]);

  const validateRegister = useCallback(() => {
    const newErrors = {};
    if (!/^[a-z]+\.[a-z]+@cit\.edu$/i.test(registerData.email)) {
      newErrors.email = 'Must be in format: firstname.lastname@cit.edu';
    }
    if (registerData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [registerData]);

  const handleRegister = useCallback(async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccess('');
    
    if (!validateRegister()) return;
    
    setLoading(true);
    try {
      const result = await register(
        registerData.email,
        registerData.password,
        registerData.confirmPassword
      );
      
      if (result && result.success) {
        setSuccess(`Registration successful! Your School ID is: ${result.user.schoolId}. You can now log in.`);
        setRegisterData({ email: '', password: '', confirmPassword: '' });
        setTimeout(() => {
          setActiveTab('login');
          setSuccess('');
        }, 3000);
      } else {
        setServerError(result?.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setServerError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [registerData, register, validateRegister]);

  // ============================================
  // UI HANDLERS
  // ============================================

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setErrors({});
    setServerError('');
    setSuccess('');
  }, []);

  const handleNavLinkClick = useCallback((e, section) => {
    e.preventDefault();
    const element = document.querySelector(`#${section}`);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  const handleGetStarted = useCallback(() => {
    setActiveTab('register');
    setTimeout(() => {
      const authCard = document.querySelector('.auth-card');
      if (authCard) {
        authCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  }, []);

  // ============================================
  // DATA
  // ============================================

  const features = [
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "AI-powered appointment booking that adapts to your schedule and preferences",
      gradient: "from-blue-500",
      iconColor: "#3B82F6"
    },
    {
      icon: Stethoscope,
      title: "Expert Medical Care",
      description: "Connect with board-certified healthcare professionals instantly",
      gradient: "from-purple-500",
      iconColor: "#A855F7"
    },
    {
      icon: Shield,
      title: "Military-Grade Security",
      description: "Your health data protected with end-to-end encryption and HIPAA compliance",
      gradient: "from-emerald-500",
      iconColor: "#10B981"
    },
    {
      icon: Activity,
      title: "Real-Time Monitoring",
      description: "Track your health metrics and receive instant insights from your care team",
      gradient: "from-orange-500",
      iconColor: "#F97316"
    },
    {
      icon: Heart,
      title: "Personalized Care Plans",
      description: "Custom treatment plans tailored to your unique health journey",
      gradient: "from-rose-500",
      iconColor: "#F43F5E"
    },
    {
      icon: Zap,
      title: "Lightning Fast Access",
      description: "Get medical advice and prescriptions in minutes, not days",
      gradient: "from-amber-500",
      iconColor: "#F59E0B"
    }
  ];

  const stats = [
    { value: "50K+", label: "Active Users", trend: "+127%", icon: Users },
    { value: "200+", label: "Healthcare Providers", trend: "+85%", icon: Stethoscope },
    { value: "99.8%", label: "Satisfaction Rate", trend: "+2.3%", icon: Star },
    { value: "24/7", label: "Support Available", trend: "Always", icon: Clock }
  ];

  const benefits = [
    { icon: CheckCircle2, text: "No waiting rooms - virtual consultations" },
    { icon: CheckCircle2, text: "Instant prescription refills" },
    { icon: CheckCircle2, text: "Secure medical records access" },
    { icon: CheckCircle2, text: "24/7 emergency support" },
    { icon: CheckCircle2, text: "Multi-specialist coordination" },
    { icon: CheckCircle2, text: "Insurance integration" }
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Chen",
      role: "Chief Medical Officer",
      content: "The most comprehensive healthcare platform I've encountered in my 20-year career.",
      rating: 5,
      avatar: "SC"
    },
    {
      name: "Marcus Rodriguez",
      role: "CIT Student",
      content: "Changed how I manage my health. Appointments are seamless and doctors are incredibly responsive.",
      rating: 5,
      avatar: "MR"
    },
    {
      name: "Prof. Amanda Lee",
      role: "Faculty Member",
      content: "Finally, a healthcare system that respects my time. The scheduling intelligence is remarkable.",
      rating: 5,
      avatar: "AL"
    }
  ];

  const footerLinks = {
    product: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Security", href: "#security" },
      { label: "Updates", href: "#updates" }
    ],
    company: [
      { label: "About Us", href: "#about" },
      { label: "Careers", href: "#careers" },
      { label: "Press Kit", href: "#press" },
      { label: "Contact", href: "#contact" }
    ],
    resources: [
      { label: "Documentation", href: "#docs" },
      { label: "API Reference", href: "#api" },
      { label: "Support Center", href: "#support" },
      { label: "System Status", href: "#status" }
    ],
    legal: [
      { label: "Privacy Policy", href: "#privacy" },
      { label: "Terms of Service", href: "#terms" },
      { label: "HIPAA Compliance", href: "#hipaa" },
      { label: "Cookie Policy", href: "#cookies" }
    ]
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="landing-page">
      <Navigation 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onNavLinkClick={handleNavLinkClick}
        isScrolled={isScrolled}
      />

      <HeroSection 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onGetStarted={handleGetStarted}
        mousePosition={mousePosition}
        loginData={loginData}
        registerData={registerData}
        handleLoginChange={handleLoginChange}
        handleRegisterChange={handleRegisterChange}
        handleLogin={handleLogin}
        handleRegister={handleRegister}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        showConfirmPassword={showConfirmPassword}
        setShowConfirmPassword={setShowConfirmPassword}
        errors={errors}
        loading={loading}
        serverError={serverError}
        success={success}
      />

      <TrustBadges />
      <FeaturesSection features={features} />
      <BenefitsSection benefits={benefits} />
      <StatsSection stats={stats} />
      <TestimonialsSection testimonials={testimonials} />
      <CTASection onGetStarted={handleGetStarted} />
      <Footer links={footerLinks} />
    </div>
  );
};

// ============================================
// NAVIGATION COMPONENT
// ============================================

const Navigation = React.memo(({ activeTab, onTabChange, onNavLinkClick, isScrolled }) => {
  return (
    <nav className={`landing-nav ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <div className="nav-left">
          <div className="nav-logo-wrapper">
            <img src={logo} alt="CIT MedConnect+" className="nav-logo" onError={(e) => e.target.style.display = 'none'} />
          </div>
          <span className="nav-brand">
            CIT MedConnect<span className="brand-plus">+</span>
          </span>
        </div>
        
        <div className="nav-center">
          <div className="nav-links">
            <button className="nav-link" onClick={(e) => onNavLinkClick(e, 'features')}>
              Features
            </button>
            <button className="nav-link" onClick={(e) => onNavLinkClick(e, 'benefits')}>
              Benefits
            </button>
            <button className="nav-link" onClick={(e) => onNavLinkClick(e, 'testimonials')}>
              Testimonials
            </button>
            <button className="nav-link" onClick={(e) => onNavLinkClick(e, 'contact')}>
              Contact
            </button>
          </div>
        </div>
        
        <div className="nav-right">
          <button
            onClick={() => onTabChange('login')}
            className={`nav-btn nav-btn-ghost ${activeTab === 'login' ? 'active' : ''}`}
          >
            Login
          </button>
          <button
            onClick={() => onTabChange('register')}
            className={`nav-btn nav-btn-primary ${activeTab === 'register' ? 'active' : ''}`}
          >
            Register
            <ArrowRight className="btn-icon-sm" />
          </button>
        </div>
      </div>
    </nav>
  );
});

Navigation.displayName = 'Navigation';

// ============================================
// HERO SECTION COMPONENT
// ============================================

const HeroSection = React.memo(({ 
  activeTab, onTabChange, onGetStarted, mousePosition,
  loginData, registerData, handleLoginChange, handleRegisterChange,
  handleLogin, handleRegister, showPassword, setShowPassword,
  showConfirmPassword, setShowConfirmPassword, errors, loading, serverError, success
}) => {
  return (
    <section className="hero-section">
      <div className="hero-gradient-bg">
        <div className="gradient-orb gradient-orb-1" 
             style={{ 
               transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` 
             }}
        ></div>
        <div className="gradient-orb gradient-orb-2"
             style={{ 
               transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)` 
             }}
        ></div>
        <div className="gradient-orb gradient-orb-3"></div>
      </div>
      
      <div className="hero-grid-pattern"></div>
      
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-left">
            <div className="hero-badge-premium">
              <Sparkles className="badge-icon" />
              <span>Trusted by 50,000+ Students & Faculty</span>
              <div className="badge-shine"></div>
            </div>
            
            <h1 className="hero-title">
              Healthcare
              <span className="title-gradient"> Reimagined</span>
              <br />
              For Modern Living
            </h1>
            
            <p className="hero-subtitle">
              Experience the future of healthcare with CIT MedConnect+. 
              Seamless appointments, instant consultations, and comprehensive 
              care—all powered by cutting-edge technology.
            </p>
            
            <div className="hero-features-mini">
              <div className="mini-feature">
                <CheckCircle2 className="mini-icon" />
                <span>Instant Booking</span>
              </div>
              <div className="mini-feature">
                <CheckCircle2 className="mini-icon" />
                <span>HIPAA Certified</span>
              </div>
              <div className="mini-feature">
                <CheckCircle2 className="mini-icon" />
                <span>24/7 Support</span>
              </div>
            </div>
            
            <div className="hero-actions">
              <button className="btn-hero-primary" onClick={onGetStarted}>
                <span>Start Your Journey</span>
                <ChevronRight className="btn-icon" />
                <div className="btn-shine"></div>
              </button>
              <button className="btn-hero-secondary">
                <Globe className="btn-icon-left" />
                <span>Watch Demo</span>
              </button>
            </div>
            
            <div className="hero-social-proof">
              <div className="avatar-stack">
                <div className="avatar">JD</div>
                <div className="avatar">SK</div>
                <div className="avatar">AL</div>
                <div className="avatar">+50K</div>
              </div>
              <div className="social-proof-text">
                <div className="rating-stars">
                  <Star className="star-filled" />
                  <Star className="star-filled" />
                  <Star className="star-filled" />
                  <Star className="star-filled" />
                  <Star className="star-filled" />
                  <span className="rating-text">4.9/5</span>
                </div>
                <p>from 12,000+ reviews</p>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <AuthCard 
              activeTab={activeTab}
              onTabChange={onTabChange}
              loginData={loginData}
              registerData={registerData}
              handleLoginChange={handleLoginChange}
              handleRegisterChange={handleRegisterChange}
              handleLogin={handleLogin}
              handleRegister={handleRegister}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}
              errors={errors}
              loading={loading}
              serverError={serverError}
              success={success}
            />
          </div>
        </div>
      </div>
    </section>
  );
});

HeroSection.displayName = 'HeroSection';

// ============================================
// AUTH CARD COMPONENT
// ============================================

const AuthCard = React.memo(({ 
  activeTab, onTabChange, loginData, registerData,
  handleLoginChange, handleRegisterChange, handleLogin, handleRegister,
  showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword,
  errors, loading, serverError, success
}) => {
  return (
    <div className="auth-card">
      <div className="auth-card-glow"></div>
      
      {/* LOGIN FORM */}
      <div className={`auth-form ${activeTab === 'login' ? 'active' : ''}`}>
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to access your account</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form-content">
          {serverError && <div className="error-message">{serverError}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-group">
            <div className="input-wrapper" style={{
              position: 'relative',
              width: '100%',
              marginBottom: '1rem'
            }}>
              <User 
                size={18} 
                className="input-icon" 
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#A3A3A3',
                  zIndex: 2
                }} 
              />
              <input
                type="text"
                name="schoolId"
                placeholder="School ID (e.g., 23-2323-233 or D-001)"
                value={loginData.schoolId}
                onChange={handleLoginChange}
                className={`form-input ${errors.schoolId ? 'error' : ''}`}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 3rem',
                  fontSize: '0.9375rem',
                  border: '2px solid #E5E5E5',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  backgroundColor: 'white',
                  fontFamily: 'inherit',
                  fontWeight: 500,
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                  height: '52px',
                  lineHeight: 1.5,
                  color: '#171717',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
                disabled={loading}
                autoComplete="username"
              />
            </div>
            {errors.schoolId && <span className="form-error">{errors.schoolId}</span>}
          </div>

          <div className="form-group">
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password (optional for demo)"
                value={loginData.password}
                onChange={handleLoginChange}
                className={`form-input ${errors.password ? 'error' : ''}`}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 3rem',
                  fontSize: '0.9375rem',
                  border: '2px solid #E5E5E5',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  backgroundColor: 'white',
                  fontFamily: 'inherit',
                  fontWeight: 500,
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                  height: '52px',
                  lineHeight: 1.5,
                  color: '#171717',
                  boxSizing: 'border-box',
                  outline: 'none',
                  paddingRight: '3rem' // Extra padding for the toggle button
                }}
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="rememberMe"
                checked={loginData.rememberMe}
                onChange={handleLoginChange}
                disabled={loading}
              />
              <span>Remember me</span>
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="demo-info">
          <p className="demo-title">🎯 Demo Credentials:</p>
          <div className="demo-credentials">
            <div className="credential-item">
              <strong>Student:</strong>
              <span> School ID: <code>23-2323-233</code></span>
            </div>
            <div className="credential-item">
              <strong>Staff/Doctor:</strong>
              <span> School ID: <code>D-001</code></span>
            </div>
            <p className="demo-note">
              💡 Password is optional for demo. Any School ID starting with 'D' logs in as Staff, others as Student.
            </p>
          </div>
        </div>

        <div className="auth-switch">
          <p>
            Don't have an account?{' '}
            <button 
              onClick={() => onTabChange('register')}
              className="auth-switch-link"
            >
              Register here
            </button>
          </p>
        </div>
      </div>

      {/* REGISTER FORM */}
      <div className={`auth-form ${activeTab === 'register' ? 'active' : ''}`}>
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Register to get started</p>
        </div>

        <form onSubmit={handleRegister} className="auth-form-content">
          {serverError && <div className="error-message">{serverError}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-group">
            <div className="input-wrapper" style={{
              position: 'relative',
              width: '100%',
              marginBottom: '1rem'
            }}>
              <Mail 
                size={18} 
                className="input-icon" 
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#A3A3A3',
                  zIndex: 2
                }} 
              />
              <input
                type="email"
                name="email"
                placeholder="firstname.lastname@cit.edu"
                value={registerData.email}
                onChange={handleRegisterChange}
                className={`form-input ${errors.email ? 'error' : ''}`}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 3rem',
                  fontSize: '0.9375rem',
                  border: '2px solid #E5E5E5',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  backgroundColor: 'white',
                  fontFamily: 'inherit',
                  fontWeight: 500,
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                  height: '52px',
                  lineHeight: 1.5,
                  color: '#171717',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
                disabled={loading}
                autoComplete="email"
              />
            </div>
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <div className="input-wrapper" style={{
              position: 'relative',
              width: '100%',
              marginBottom: '1rem'
            }}>
              <Lock 
                size={18} 
                className="input-icon" 
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#A3A3A3',
                  zIndex: 2
                }} 
              />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password (min 6 characters)"
                value={registerData.password}
                onChange={handleRegisterChange}
                className={`form-input ${errors.password ? 'error' : ''}`}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 3rem',
                  fontSize: '0.9375rem',
                  border: '2px solid #E5E5E5',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  backgroundColor: 'white',
                  fontFamily: 'inherit',
                  fontWeight: 500,
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                  height: '52px',
                  lineHeight: 1.5,
                  color: '#171717',
                  boxSizing: 'border-box',
                  outline: 'none',
                  paddingRight: '3rem'
                }}
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#A3A3A3',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 3,
                  transition: 'color 0.2s ease'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <div className="input-wrapper" style={{
              position: 'relative',
              width: '100%',
              marginBottom: '1rem'
            }}>
              <Lock 
                size={18} 
                className="input-icon" 
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#A3A3A3',
                  zIndex: 2
                }} 
              />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={registerData.confirmPassword}
                onChange={handleRegisterChange}
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 3rem',
                  fontSize: '0.9375rem',
                  border: '2px solid #E5E5E5',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  backgroundColor: 'white',
                  fontFamily: 'inherit',
                  fontWeight: 500,
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                  height: '52px',
                  lineHeight: 1.5,
                  color: '#171717',
                  boxSizing: 'border-box',
                  outline: 'none',
                  paddingRight: '3rem'
                }}
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#A3A3A3',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 3,
                  transition: 'color 0.2s ease'
                }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                <span>Creating account...</span>
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            Already have an account?{' '}
            <button 
              onClick={() => onTabChange('login')}
              className="auth-switch-link"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
});

AuthCard.displayName = 'AuthCard';

// ============================================
// TRUST BADGES COMPONENT
// ============================================

const TrustBadges = React.memo(() => {
  const badges = [
    { icon: Shield, text: "HIPAA Compliant" },
    { icon: Award, text: "ISO 27001 Certified" },
    { icon: CheckCircle2, text: "SOC 2 Type II" },
    { icon: Globe, text: "Global Coverage" }
  ];

  return (
    <section className="trust-badges">
      <div className="trust-container">
        {badges.map((badge, index) => (
          <div key={index} className="trust-badge">
            <badge.icon className="trust-icon" />
            <span>{badge.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
});

TrustBadges.displayName = 'TrustBadges';

// ============================================
// FEATURES SECTION COMPONENT
// ============================================

const FeaturesSection = React.memo(({ features }) => {
  return (
    <section className="features-section" id="features">
      <div className="features-container">
        <div className="section-header-premium">
          <h2 className="section-title-premium">
            Everything You Need,
            <span className="title-accent"> Nothing You Don't</span>
          </h2>
          <p className="section-subtitle-premium">
            Built with cutting-edge technology to deliver unparalleled healthcare experience
          </p>
        </div>
        
        <div className="features-grid-premium">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
});

FeaturesSection.displayName = 'FeaturesSection';

// ============================================
// FEATURE CARD COMPONENT
// ============================================

const FeatureCard = React.memo(({ feature, index }) => {
  const IconComponent = feature.icon;
  
  return (
    <div className="feature-card-premium" style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="feature-card-inner">
        <div 
          className={`feature-icon-container bg-gradient-to-br ${feature.gradient}`}
          style={{ backgroundColor: `${feature.iconColor}15` }}
        >
          <IconComponent 
            className="feature-icon-premium" 
            style={{ color: feature.iconColor }}
          />
          <div className="icon-glow"></div>
        </div>
        <h3 className="feature-title-premium">{feature.title}</h3>
        <p className="feature-description-premium">{feature.description}</p>
         {/*<button className="feature-link">
          Learn more
          <ArrowRight className="feature-link-icon" />
        </button>*/}
      </div>
    </div>
  );
});

FeatureCard.displayName = 'FeatureCard';

// ============================================
// BENEFITS SECTION COMPONENT
// ============================================

const BenefitsSection = React.memo(({ benefits }) => {
  return (
    <section className="benefits-section" id="benefits">
      <div className="benefits-container">
        <div className="benefits-content">
          <div className="benefits-left">
            <h2 className="benefits-title">
              Why Healthcare Professionals
              <span className="benefits-accent"> Choose Us</span>
            </h2>
            <p className="benefits-description">
              Join thousands of healthcare providers and patients who trust 
              MedConnect+ for their daily healthcare needs.
            </p>
            <div className="benefits-list">
              {benefits.map((benefit, index) => (
                <div key={index} className="benefit-item">
                  <benefit.icon className="benefit-icon" />
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="benefits-right">
            <div className="benefits-visual">
              <div className="visual-card visual-card-1">
                <TrendingUp className="visual-icon" />
                <div className="visual-stats">
                  <span className="visual-number">245%</span>
                  <span className="visual-label">Growth Rate</span>
                </div>
              </div>
              <div className="visual-card visual-card-2">
                <Users className="visual-icon" />
                <div className="visual-stats">
                  <span className="visual-number">50K+</span>
                  <span className="visual-label">Active Users</span>
                </div>
              </div>
              <div className="visual-card visual-card-3">
                <Heart className="visual-icon pulse-icon" />
                <div className="visual-stats">
                  <span className="visual-number">99.8%</span>
                  <span className="visual-label">Satisfaction</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

BenefitsSection.displayName = 'BenefitsSection';

// ============================================
// STATS SECTION COMPONENT
// ============================================

const StatsSection = React.memo(({ stats }) => {
  return (
    <section className="stats-section-premium">
      <div className="stats-container-premium">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card-premium">
            <div className="stat-icon-wrapper">
              <stat.icon className="stat-icon-premium" />
            </div>
            <div className="stat-content">
              <div className="stat-value-premium">{stat.value}</div>
              <div className="stat-label-premium">{stat.label}</div>
              <div className="stat-trend">
                <TrendingUp className="trend-icon" />
                <span>{stat.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});

StatsSection.displayName = 'StatsSection';

// ============================================
// TESTIMONIALS SECTION COMPONENT
// ============================================

const TestimonialsSection = React.memo(({ testimonials }) => {
  return (
    <section className="testimonials-section" id="testimonials">
      <div className="testimonials-container">
        <div className="section-header-premium">
          <h2 className="section-title-premium">
            Loved by Healthcare
            <span className="title-accent"> Professionals</span>
          </h2>
        </div>
        
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <div className="testimonial-rating">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="star-filled" />
                ))}
              </div>
              <p className="testimonial-content">"{testimonial.content}"</p>
              <div className="testimonial-author">
                <div className="author-avatar">{testimonial.avatar}</div>
                <div className="author-info">
                  <div className="author-name">{testimonial.name}</div>
                  <div className="author-role">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

TestimonialsSection.displayName = 'TestimonialsSection';

// ============================================
// CTA SECTION COMPONENT
// ============================================

const CTASection = React.memo(({ onGetStarted }) => {
  return (
    <section className="cta-section">
      <div className="cta-container">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Transform Your Healthcare?</h2>
          <p className="cta-description">
            Join 50,000+ users who are already experiencing the future of healthcare
          </p>
          <div className="cta-actions">
            <button className="btn-cta-primary" onClick={onGetStarted}>
              Get Started Free
              <ChevronRight className="btn-icon" />
            </button>
            <button className="btn-cta-secondary">
              Schedule a Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
});

CTASection.displayName = 'CTASection';

// ============================================
// FOOTER COMPONENT
// ============================================

const Footer = React.memo(({ links }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-premium" id="contact">
      <div className="footer-container-premium">
        <div className="footer-top">
          <div className="footer-brand-section">
            <div className="footer-logo-premium">
              <Settings className="footer-icon" />
              <span>CIT MedConnect<span className="brand-plus">+</span></span>
            </div>
            <p className="footer-tagline">
              Empowering healthcare through innovation and technology
            </p>
            <div className="footer-social">
              <button className="social-btn">X</button>
              <button className="social-btn">Li</button>
              <button className="social-btn">Fb</button>
              <button className="social-btn">Ig</button>
            </div>
          </div>
          
          <div className="footer-links-grid">
            <div className="footer-links-column">
              <h4>Product</h4>
              <ul>
                {links.product.map((link, i) => (
                  <li key={i}><a href={link.href}>{link.label}</a></li>
                ))}
              </ul>
            </div>
            <div className="footer-links-column">
              <h4>Company</h4>
              <ul>
                {links.company.map((link, i) => (
                  <li key={i}><a href={link.href}>{link.label}</a></li>
                ))}
              </ul>
            </div>
            <div className="footer-links-column">
              <h4>Resources</h4>
              <ul>
                {links.resources.map((link, i) => (
                  <li key={i}><a href={link.href}>{link.label}</a></li>
                ))}
              </ul>
            </div>
            <div className="footer-links-column">
              <h4>Legal</h4>
              <ul>
                {links.legal.map((link, i) => (
                  <li key={i}><a href={link.href}>{link.label}</a></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {currentYear} CIT MedConnect+. All rights reserved.</p>
          <div className="footer-badges">
            <span className="footer-badge">HIPAA Compliant</span>
            <span className="footer-badge">SOC 2 Certified</span>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Landing;