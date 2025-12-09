import React from 'react';
import { Skeleton } from '../skeleton';

interface ChatMessageSkeletonProps {
  isOwn?: boolean;
}

export const ChatMessageSkeleton: React.FC<ChatMessageSkeletonProps> = ({ isOwn = false }) => {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start space-x-3 max-w-[70%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
        
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Name and timestamp */}
          <div className={`flex items-center space-x-2 mb-1 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
          
          {/* Message content */}
          <div className={`rounded-lg p-3 ${isOwn ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
      </div>
    </div>
  );
};