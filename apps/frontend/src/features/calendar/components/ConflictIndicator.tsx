'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConflictIndicatorProps {
  conflictCount: number;
  className?: string;
}

export default function ConflictIndicator({ conflictCount, className = '' }: ConflictIndicatorProps) {
  if (conflictCount === 0) return null;

  return (
    <div className={`absolute top-1 right-1 z-10 ${className}`}>
      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-md text-xs border border-orange-300 dark:border-orange-700">
        <AlertTriangle className="h-3 w-3" />
        <span className="font-medium">{conflictCount}</span>
      </div>
    </div>
  );
}