import React from 'react';
import { Skeleton } from '../skeleton';

export const CalendarEventSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Time */}
      <Skeleton className="h-3 w-16 mb-2" />
      
      {/* Title */}
      <Skeleton className="h-5 w-full mb-2" />
      
      {/* Location/Type */}
      <div className="flex items-center space-x-2 mb-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-24" />
      </div>
      
      {/* Participants */}
      <div className="flex items-center space-x-1">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-4 w-8" />
      </div>
    </div>
  );
};