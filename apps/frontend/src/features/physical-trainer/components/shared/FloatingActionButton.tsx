'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X } from '@/components/icons';
import { performanceMonitor } from '../../utils/performanceMonitor';

interface FloatingActionButtonProps {
  onCreateSession: () => void;
}

export function FloatingActionButton({ onCreateSession }: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  React.useEffect(() => {
    performanceMonitor.startMeasure('fab-init');
    performanceMonitor.endMeasure('fab-init');
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={() => {
          if (!isExpanded) {
            onCreateSession();
          }
          setIsExpanded(!isExpanded);
        }}
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg"
      >
        {isExpanded ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
    </div>
  );
}