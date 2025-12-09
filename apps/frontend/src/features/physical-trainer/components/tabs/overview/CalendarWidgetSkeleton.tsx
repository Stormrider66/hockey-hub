'use client';

import React from 'react';

export default function CalendarWidgetSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-32 bg-gray-200 rounded"></div>
        <div className="flex space-x-2">
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
      </div>
      
      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {[...Array(7)].map((_, i) => (
          <div key={`header-${i}`} className="text-center">
            <div className="h-4 w-8 bg-gray-200 rounded mx-auto mb-2"></div>
          </div>
        ))}
        
        {/* Calendar cells */}
        {[...Array(7)].map((_, i) => (
          <div key={`cell-${i}`} className="aspect-square bg-gray-100 rounded-lg p-2">
            <div className="h-6 w-6 bg-gray-200 rounded mb-2"></div>
            <div className="space-y-1">
              <div className="h-3 w-full bg-gray-200 rounded"></div>
              <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}