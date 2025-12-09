import React from 'react';
import { Skeleton } from '../skeleton';

export const TeamRosterSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Team Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>
      
      {/* Position Groups */}
      {['Forwards', 'Defense', 'Goalies'].map((position, index) => (
        <div key={position} className={index > 0 ? 'border-t border-gray-200 dark:border-gray-700' : ''}>
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700">
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: index === 2 ? 2 : 4 }).map((_, playerIndex) => (
              <div key={playerIndex} className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};