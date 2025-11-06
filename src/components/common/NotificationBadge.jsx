// ============================================
// NOTIFICATION BADGE COMPONENT
// src/components/common/NotificationBadge.jsx
// ============================================

import React from 'react';
import './NotificationBadge.css';

const NotificationBadge = ({ count = 0, max = 99 }) => {
  if (count === 0) return null;

  const displayCount = count > max ? `${max}+` : count;

  return (
    <span className="notification-badge">
      {displayCount}
    </span>
  );
};

export default NotificationBadge;