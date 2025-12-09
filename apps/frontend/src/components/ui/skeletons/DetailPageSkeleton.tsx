import React from 'react';
import { Skeleton } from '../skeleton';
import { DashboardWidgetSkeleton } from './DashboardWidgetSkeleton';

export const DetailPageSkeleton: React.FC = () => {
  return (
    <div className="p-6">
      {/* Header with breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      
      {/* Profile Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-start space-x-6">
          {/* Avatar */}
          <Skeleton className="h-32 w-32 rounded-full" />
          
          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-24 rounded-md" />
                <Skeleton className="h-10 w-10 rounded-md" />
              </div>
            </div>
            
            {/* Meta info grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index}>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-8 px-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="py-4">
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DashboardWidgetSkeleton rows={5} />
          <DashboardWidgetSkeleton rows={4} />
        </div>
        <div className="space-y-6">
          <DashboardWidgetSkeleton rows={3} />
          <DashboardWidgetSkeleton rows={4} />
        </div>
      </div>
    </div>
  );
};