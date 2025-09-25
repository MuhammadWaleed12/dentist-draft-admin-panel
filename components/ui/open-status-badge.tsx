// components/ui/OpenStatusBadge.tsx

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getPracticeStatus, type Practice } from '@/lib/practice-hours';

interface OpenStatusBadgeProps {
  practice: Practice;
  className?: string;
  showClosingTime?: boolean;
  variant?: 'default' | 'compact';
}

export function OpenStatusBadge({ 
  practice, 
  className = '', 
  showClosingTime = false,
  variant = 'default'
}: OpenStatusBadgeProps) {
  const status = getPracticeStatus(practice);
  
  if (variant === 'compact') {
    return (
      <Badge className={`${status.badgeColor} text-white text-xs ${className}`}>
        {status.statusText}
      </Badge>
    );
  }
  
  return (
    <div className="space-y-1">
      <Badge 
        className={`${status.badgeColor} text-white font-semibold shadow-lg ${className}`}
      >
        {status.isOpen ? (
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            {status.statusText}
          </span>
        ) : (
          status.statusText
        )}
      </Badge>
      
      {showClosingTime && (
        <>
          {status.isOpen && status.closingTime && (
            <Badge className="bg-black/70 text-white text-xs">
              Closes at {status.closingTime}
            </Badge>
          )}
          
          {!status.isOpen && status.nextOpening && (
            <Badge className="bg-black/70 text-white text-xs">
              {status.nextOpening}
            </Badge>
          )}
        </>
      )}
    </div>
  );
}