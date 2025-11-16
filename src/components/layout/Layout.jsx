// ============================================
// LAYOUT COMPONENT - COMPLETE
// src/components/layout/Layout.jsx
// ============================================

import React, { useState, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Home,
  Calendar,
  User,
  FileText,
  Bell,
  CalendarDays,
  LogOut,
  Search,
  Menu,
  X,
  Settings
} from 'lucide-react';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout, userInitials, userFullName, isStaff } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const logo = '/images/logo.jpg';

  // ============================================
  // EVENT HANDLERS
  // ============================================
  
  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);
  
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  // ============================================
  // NAVIGATION ITEMS
  // ============================================
  
  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/appointments', icon: Calendar, label: 'Appointments' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/medical-records', icon: FileText, label: 'Medical Records' },
    { path: '/notifications', icon: Bell, label: 'Notifications', badge: unreadCount },
    { path: '/calendar', icon: CalendarDays, label: 'Calendar' },
  ];

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="main-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src={logo} alt="CIT MedConnect+ Logo" className="sidebar-logo" />
          <h1 className="sidebar-title">CIT MedConnect+</h1>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              onClick={closeSidebar}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              {item.badge > 0 && <span className="badge">{item.badge}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Sidebar Overlay for Mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
      ></div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <button className="menu-toggle" onClick={toggleSidebar}>
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search for something"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          <div className="header-right">
            <button 
              className="icon-btn"
              onClick={() => navigate('/settings')}
              title="Settings"
            >
              <Settings size={20} />
            </button>

            <button 
              className="icon-btn"
              onClick={() => navigate('/notifications')}
              title="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && <span className="notification-badge"></span>}
            </button>

            <div className="user-menu" onClick={() => navigate('/profile')}>
              <div className="user-avatar">
                {user?.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt="Profile" 
                    className="user-avatar-image"
                  />
                ) : (
                  userInitials
                )}
              </div>
              <div className="user-info">
                <div className="user-name">{userFullName}</div>
                <div className="user-role">{isStaff ? 'Staff' : 'Student'}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};

export default Layout;