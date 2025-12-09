import React from 'react';
import { Skeleton } from '../skeleton';

interface NavigationSkeletonProps {
  items?: number;
  orientation?: 'vertical' | 'horizontal';
}

export const NavigationSkeleton: React.FC<NavigationSkeletonProps> = ({ 
  items = 6, 
  orientation = 'vertical' 
}) => {
  if (orientation === 'horizontal') {
    return (
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <Skeleton className="h-8 w-32" />
          
          {/* Menu items */}
          <div className="flex items-center space-x-6">
            {Array.from({ length: items }).map((_, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
          
          {/* User menu */}
          <div className="flex items-center space-x-3">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white dark:bg-gray-800 h-full border-r border-gray-200 dark:border-gray-700 w-64">
      <div className="p-6">
        {/* Logo */}
        <Skeleton className="h-10 w-40 mb-8" />
        
        {/* Menu items */}
        <div className="space-y-2">
          {Array.from({ length: items }).map((_, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 rounded-lg">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
        
        {/* User section at bottom */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center space-x-3 p-3 rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};