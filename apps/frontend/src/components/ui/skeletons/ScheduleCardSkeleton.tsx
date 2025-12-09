import React from 'react';
import { Skeleton } from '../skeleton';

export const ScheduleCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Date/Time */}
          <div className="text-center">
            <Skeleton className="h-6 w-12 mb-1" />
            <Skeleton className="h-8 w-12" />
          </div>
          
          {/* Event details */}
          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
        
        {/* Status/Action */}
        <div className="flex items-center space-x-3">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </div>
  );
};