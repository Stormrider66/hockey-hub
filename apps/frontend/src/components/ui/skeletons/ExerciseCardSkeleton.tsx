import React from 'react';
import { Skeleton } from '../skeleton';

export const ExerciseCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Image placeholder */}
      <Skeleton className="h-48 w-full" />
      
      <div className="p-4">
        {/* Title */}
        <Skeleton className="h-6 w-3/4 mb-2" />
        
        {/* Equipment badges */}
        <div className="flex items-center space-x-2 mb-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Skeleton className="h-6 w-14 rounded" />
          <Skeleton className="h-6 w-18 rounded" />
          <Skeleton className="h-6 w-16 rounded" />
        </div>
        
        {/* Description */}
        <div className="space-y-1">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
    </div>
  );
};