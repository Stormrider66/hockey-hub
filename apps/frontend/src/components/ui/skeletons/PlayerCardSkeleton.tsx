import React from 'react';
import { Skeleton } from '../skeleton';

export const PlayerCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-4">
        {/* Avatar */}
        <Skeleton className="h-12 w-12 rounded-full" />
        
        <div className="flex-1">
          {/* Name */}
          <Skeleton className="h-5 w-32 mb-2" />
          {/* Position/Team */}
          <Skeleton className="h-4 w-24" />
        </div>
        
        {/* Status indicator */}
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      
      {/* Medical badge placeholder */}
      <div className="mt-3 flex items-center space-x-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
};