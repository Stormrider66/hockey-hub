import React from 'react';
import { Skeleton } from '../skeleton';

interface FormSkeletonProps {
  fields?: number;
  includeButtons?: boolean;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({ 
  fields = 4, 
  includeButtons = true 
}) => {
  return (
    <div className="space-y-6">
      {/* Form fields */}
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          {/* Label */}
          <Skeleton className="h-4 w-24" />
          {/* Input */}
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      
      {/* Buttons */}
      {includeButtons && (
        <div className="flex items-center space-x-4 pt-4">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      )}
    </div>
  );
};