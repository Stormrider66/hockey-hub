import React from 'react';
import { Skeleton } from '../skeleton';

export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Icon */}
          <Skeleton className="h-10 w-10 rounded-lg mb-3" />
          
          {/* Label */}
          <Skeleton className="h-4 w-24 mb-2" />
          
          {/* Value */}
          <Skeleton className="h-8 w-32 mb-1" />
          
          {/* Trend */}
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        
        {/* Optional chart/graph area */}
        <Skeleton className="h-16 w-24 rounded" />
      </div>
    </div>
  );
};