import React, { memo, forwardRef } from 'react';
import { X } from 'lucide-react';  
import { Button } from './Button';

export const EmptyState = memo(({ 
  icon: Icon,
  title,
  description,
  action,
  actionText
}) => {
  return (
    <div className="empty-state">
      {Icon && <Icon size={64} />}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && actionText && (
        <Button onClick={action}>{actionText}</Button>
      )}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';