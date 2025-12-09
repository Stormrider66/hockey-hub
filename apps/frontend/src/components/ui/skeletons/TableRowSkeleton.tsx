import React from 'react';
import { Skeleton } from '../skeleton';

export type ColumnType = 'checkbox' | 'text' | 'badge' | 'action' | 'avatar';

interface TableRowSkeletonProps {
  columns?: ColumnType[];
}

export const TableRowSkeleton: React.FC<TableRowSkeletonProps> = ({ 
  columns = ['checkbox', 'avatar', 'text', 'text', 'badge', 'action'] 
}) => {
  const renderColumn = (type: ColumnType, index: number) => {
    switch (type) {
      case 'checkbox':
        return <Skeleton key={index} className="h-4 w-4 rounded" />;
      case 'avatar':
        return (
          <div key={index} className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        );
      case 'text':
        return <Skeleton key={index} className="h-4 w-32" />;
      case 'badge':
        return <Skeleton key={index} className="h-6 w-20 rounded-full" />;
      case 'action':
        return (
          <div key={index} className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        );
      default:
        return <Skeleton key={index} className="h-4 w-24" />;
    }
  };

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700">
      {columns.map((column, index) => (
        <td key={index} className="px-6 py-4">
          {renderColumn(column, index)}
        </td>
      ))}
    </tr>
  );
};