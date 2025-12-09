import React from 'react';
import { Skeleton } from '../skeleton';
import { TableRowSkeleton } from './TableRowSkeleton';

interface ListPageSkeletonProps {
  rows?: number;
  hasFilters?: boolean;
}

export const ListPageSkeleton: React.FC<ListPageSkeletonProps> = ({ 
  rows = 10, 
  hasFilters = true 
}) => {
  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>
      
      {/* Filters Section */}
      {hasFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <Skeleton className="h-10 w-64 rounded-md" />
            
            {/* Filter dropdowns */}
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
            
            {/* Clear/Apply buttons */}
            <div className="ml-auto flex items-center space-x-2">
              <Skeleton className="h-10 w-20 rounded-md" />
              <Skeleton className="h-10 w-20 rounded-md" />
            </div>
          </div>
        </div>
      )}
      
      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-6 py-3"><Skeleton className="h-4 w-4" /></th>
              <th className="px-6 py-3"><Skeleton className="h-4 w-20" /></th>
              <th className="px-6 py-3"><Skeleton className="h-4 w-24" /></th>
              <th className="px-6 py-3"><Skeleton className="h-4 w-20" /></th>
              <th className="px-6 py-3"><Skeleton className="h-4 w-16" /></th>
              <th className="px-6 py-3"><Skeleton className="h-4 w-20" /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, index) => (
              <TableRowSkeleton key={index} />
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
};