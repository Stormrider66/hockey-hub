import React from 'react';
import { Skeleton } from '../skeleton';
import { DashboardWidgetSkeleton } from './DashboardWidgetSkeleton';
import { StatCardSkeleton } from './StatCardSkeleton';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large widget - spans 2 columns */}
        <div className="lg:col-span-2">
          <DashboardWidgetSkeleton rows={6} />
        </div>
        
        {/* Side widget */}
        <div>
          <DashboardWidgetSkeleton rows={5} />
        </div>
      </div>
      
      {/* Bottom widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardWidgetSkeleton rows={4} />
        <DashboardWidgetSkeleton rows={4} />
      </div>
    </div>
  );
};