'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Zap, 
  Activity, 
  Timer,
  TrendingUp,
  Gauge
} from '@/components/icons';
import { cn } from '@/lib/utils';
import type { IntervalSet, WorkoutEquipmentType } from '../types/conditioning.types';
import { EQUIPMENT_CONFIGS } from '../types/conditioning.types';

interface IntervalPreviewProps {
  interval: IntervalSet;
  index: number;
  className?: string;
}

const INTERVAL_TYPE_COLORS = {
  warmup: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  work: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  rest: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  active_recovery: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  cooldown: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' }
};

const METRIC_ICONS = {
  heartRate: Heart,
  watts: Zap,
  pace: TrendingUp,
  rpm: Gauge,
  calories: Activity,
  distance: Activity
};

export default function IntervalPreview({ interval, index, className }: IntervalPreviewProps) {
  const equipment = EQUIPMENT_CONFIGS[interval.equipment];
  const typeColors = INTERVAL_TYPE_COLORS[interval.type] || INTERVAL_TYPE_COLORS.work;
  
  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}min`;
    return `${mins}min ${secs}s`;
  };
  
  // Format target metric display
  const formatTargetMetric = (metric: string, target: any) => {
    if (!target) return null;
    
    if (typeof target === 'object' && target.type === 'percentage') {
      const reference = target.reference === 'ftp' ? 'FTP' : 
                       target.reference === 'threshold' ? 'LT' : 
                       'Max';
      return `${target.value}% of ${reference}`;
    }
    
    if (metric === 'heartRate') {
      return `${target.value || target} BPM`;
    }
    
    if (metric === 'watts') {
      return `${target.value || target}W`;
    }
    
    if (metric === 'pace') {
      if (typeof target === 'object' && target.type) {
        // Handle TargetMetric format
        if (target.type === 'percentage') {
          const reference = target.reference === 'ftp' ? 'FTP' : 
                           target.reference === 'threshold' ? 'LT' : 
                           'Max';
          return `${target.value}% of ${reference} pace`;
        }
        // For absolute pace, assume value is in seconds per unit (e.g., seconds per 500m)
        const totalSeconds = target.value;
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')} ${equipment.units.pace || ''}`;
      }
      return `${target} ${equipment.units.pace || ''}`;
    }
    
    if (metric === 'calories') {
      return `${target} cal`;
    }
    
    if (metric === 'distance') {
      return `${target} ${equipment.units.distance}`;
    }
    
    if (metric === 'rpm') {
      return `${target} RPM`;
    }
    
    return `${target}`;
  };
  
  // Get active target metrics
  const activeTargets = Object.entries(interval.targetMetrics || {})
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([metric, value]) => ({
      metric,
      value,
      display: formatTargetMetric(metric, value),
      Icon: METRIC_ICONS[metric as keyof typeof METRIC_ICONS] || Activity
    }));
  
  return (
    <div 
      className={cn(
        "relative rounded-lg border-2 p-4 transition-all",
        typeColors.bg,
        typeColors.border,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className={cn("font-mono", typeColors.text, typeColors.border)}
          >
            #{index + 1}
          </Badge>
          <div>
            <h4 className={cn("font-semibold text-lg", typeColors.text)}>
              {interval.name || interval.type.charAt(0).toUpperCase() + interval.type.slice(1).replace('_', ' ')}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-600">
                {equipment.icon} {equipment.label}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-sm font-medium text-gray-700">
                <Timer className="inline h-3 w-3 mr-1" />
                {formatDuration(interval.duration)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Interval Type Badge */}
        <Badge className={cn(typeColors.bg, typeColors.text, "border", typeColors.border)}>
          {interval.type.replace('_', ' ')}
        </Badge>
      </div>
      
      {/* Target Metrics */}
      {activeTargets.length > 0 && interval.type !== 'rest' && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-2">TARGET METRICS</p>
          <div className="grid grid-cols-2 gap-2">
            {activeTargets.map(({ metric, display, Icon }) => (
              <div 
                key={metric}
                className="flex items-center gap-2 bg-white/50 rounded-md px-2 py-1"
              >
                <Icon className={cn("h-4 w-4", typeColors.text)} />
                <span className="text-sm font-medium">{display}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Notes */}
      {interval.notes && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600 italic">"{interval.notes}"</p>
        </div>
      )}
      
      {/* Color indicator bar */}
      {interval.color && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-md"
          style={{ backgroundColor: interval.color }}
        />
      )}
    </div>
  );
}