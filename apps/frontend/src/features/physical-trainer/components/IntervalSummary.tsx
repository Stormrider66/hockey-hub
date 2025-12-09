'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { IntervalSet } from '../types/conditioning.types';
import { EQUIPMENT_CONFIGS } from '../types/conditioning.types';

interface IntervalSummaryProps {
  interval: IntervalSet;
  index: number;
  className?: string;
}

export default function IntervalSummary({ interval, index, className }: IntervalSummaryProps) {
  const equipment = EQUIPMENT_CONFIGS[interval.equipment];
  
  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}min`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Build summary text
  const buildSummary = () => {
    const parts = [];
    
    // Add duration
    parts.push(formatDuration(interval.duration));
    
    // Add equipment
    parts.push(`${equipment.icon} ${equipment.label}`);
    
    // Add primary target metrics
    if (interval.targetMetrics) {
      if (interval.targetMetrics.watts) {
        const watts = interval.targetMetrics.watts;
        if (typeof watts === 'object' && watts.type === 'percentage') {
          parts.push(`@ ${watts.value}% of ${watts.reference === 'ftp' ? 'FTP' : watts.reference === 'threshold' ? 'LT' : 'Max'} watts`);
        } else if (typeof watts === 'object') {
          parts.push(`@ ${watts.value}W`);
        }
      } else if (interval.targetMetrics.heartRate) {
        const hr = interval.targetMetrics.heartRate;
        if (typeof hr === 'object' && hr.type === 'percentage') {
          parts.push(`@ ${hr.value}% of ${hr.reference === 'threshold' ? 'LT' : 'Max'} HR`);
        } else if (typeof hr === 'object') {
          parts.push(`@ ${hr.value} BPM`);
        }
      } else if (interval.targetMetrics.pace) {
        const pace = interval.targetMetrics.pace;
        if (typeof pace === 'object' && pace.value) {
          const mins = Math.floor(pace.value / 60);
          const secs = pace.value % 60;
          parts.push(`@ ${mins}:${secs.toString().padStart(2, '0')} ${equipment.units.pace || ''}`);
        }
      } else if (interval.targetMetrics.calories) {
        parts.push(`${interval.targetMetrics.calories} cals`);
      } else if (interval.targetMetrics.distance) {
        parts.push(`${interval.targetMetrics.distance} ${equipment.units.distance || 'm'}`);
      }
    }
    
    return parts.join(' ');
  };
  
  const typeColors = {
    warmup: 'bg-green-100 text-green-700',
    work: 'bg-red-100 text-red-700',
    rest: 'bg-blue-100 text-blue-700',
    active_recovery: 'bg-orange-100 text-orange-700',
    cooldown: 'bg-purple-100 text-purple-700'
  };
  
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Badge variant="outline" className="font-mono">
        #{index + 1}
      </Badge>
      <Badge className={cn(typeColors[interval.type] || typeColors.work, "text-xs")}>
        {interval.type.replace('_', ' ')}
      </Badge>
      <span className="text-sm font-medium">
        {interval.name || interval.type.charAt(0).toUpperCase() + interval.type.slice(1)}:
      </span>
      <span className="text-sm text-gray-600">
        {buildSummary()}
      </span>
    </div>
  );
}