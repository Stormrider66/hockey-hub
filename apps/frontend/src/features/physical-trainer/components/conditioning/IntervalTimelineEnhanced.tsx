'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Clock, Repeat, Timer } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import type { IntervalSet } from '../../types';
import { EQUIPMENT_CONFIGS } from '../../types/conditioning.types';

interface EnhancedIntervalSet extends IntervalSet {
  primaryMetric?: 'time' | 'distance' | 'calories' | 'watts' | 'heartRate';
  targetValue?: number;
  targetUnit?: string;
  setConfig?: {
    numberOfSets: number;
    intervalsPerSet: number;
    restBetweenSets: number;
    restBetweenIntervals: number;
  };
}

interface IntervalTimelineEnhancedProps {
  intervals: EnhancedIntervalSet[];
  className?: string;
}

export default function IntervalTimelineEnhanced({ intervals, className }: IntervalTimelineEnhancedProps) {
  // Calculate timeline segments including set structure
  const timelineSegments = useMemo(() => {
    const segments: Array<{
      id: string;
      type: 'interval' | 'rest-within-set' | 'rest-between-sets';
      name: string;
      duration: number;
      color: string;
      setNumber?: number;
      intervalNumber?: number;
      originalInterval?: EnhancedIntervalSet;
    }> = [];

    intervals.forEach((interval) => {
      if (interval.setConfig && interval.setConfig.numberOfSets > 1) {
        // Expand sets
        for (let setIdx = 0; setIdx < interval.setConfig.numberOfSets; setIdx++) {
          for (let intIdx = 0; intIdx < interval.setConfig.intervalsPerSet; intIdx++) {
            // Add the interval
            segments.push({
              id: `${interval.id}-set${setIdx}-int${intIdx}`,
              type: 'interval',
              name: `${interval.name} (Set ${setIdx + 1}/${interval.setConfig.numberOfSets})`,
              duration: interval.primaryMetric === 'time' ? (interval.targetValue || interval.duration) : interval.duration,
              color: interval.color || '#3b82f6',
              setNumber: setIdx + 1,
              intervalNumber: intIdx + 1,
              originalInterval: interval
            });

            // Add rest between intervals (if not last interval in set)
            if (intIdx < interval.setConfig.intervalsPerSet - 1) {
              segments.push({
                id: `${interval.id}-set${setIdx}-rest-int${intIdx}`,
                type: 'rest-within-set',
                name: 'Rest',
                duration: interval.setConfig.restBetweenIntervals,
                color: '#94a3b8',
                setNumber: setIdx + 1
              });
            }
          }

          // Add rest between sets (if not last set)
          if (setIdx < interval.setConfig.numberOfSets - 1) {
            segments.push({
              id: `${interval.id}-rest-set${setIdx}`,
              type: 'rest-between-sets',
              name: 'Set Rest',
              duration: interval.setConfig.restBetweenSets,
              color: '#64748b',
              setNumber: setIdx + 1
            });
          }
        }
      } else {
        // Single interval without sets
        segments.push({
          id: interval.id,
          type: 'interval',
          name: interval.name || interval.type,
          duration: interval.primaryMetric === 'time' ? (interval.targetValue || interval.duration) : interval.duration,
          color: interval.color || '#3b82f6',
          originalInterval: interval
        });
      }
    });

    return segments;
  }, [intervals]);

  const totalDuration = timelineSegments.reduce((sum, segment) => sum + segment.duration, 0);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMetric = (interval: EnhancedIntervalSet) => {
    if (!interval.primaryMetric || interval.primaryMetric === 'time') {
      return formatDuration(interval.targetValue || interval.duration);
    }
    
    const metricLabels: Record<string, string> = {
      distance: 'm',
      calories: 'cal',
      watts: 'W',
      heartRate: 'bpm'
    };
    
    return `${interval.targetValue} ${metricLabels[interval.primaryMetric] || ''}`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Total: {formatDuration(totalDuration)}
          </span>
          <span className="flex items-center gap-1">
            <Repeat className="h-4 w-4" />
            {intervals.filter(i => i.setConfig && i.setConfig.numberOfSets > 1).length} with sets
          </span>
        </div>
      </div>

      {/* Timeline Bar */}
      <div className="relative">
        <div className="flex w-full h-12 rounded-lg overflow-hidden border">
          {timelineSegments.map((segment, segmentIndex) => {
            const widthPercent = (segment.duration / totalDuration) * 100;
            
            return (
              <div
                key={`timeline-segment-${segmentIndex}-${segment.id}`}
                className={cn(
                  "relative flex items-center justify-center transition-all hover:opacity-80",
                  segment.type === 'rest-within-set' && "opacity-60",
                  segment.type === 'rest-between-sets' && "opacity-40"
                )}
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: segment.color,
                  minWidth: widthPercent > 2 ? 'auto' : '20px'
                }}
                title={`${segment.name} - ${formatDuration(segment.duration)}`}
              >
                {widthPercent > 5 && (
                  <span className="text-xs text-white font-medium px-1 truncate">
                    {segment.type === 'interval' && segment.originalInterval?.primaryMetric 
                      ? formatMetric(segment.originalInterval)
                      : formatDuration(segment.duration)
                    }
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="space-y-2">
        {intervals.map((interval, idx) => {
          const hasSetStructure = interval.setConfig && interval.setConfig.numberOfSets > 1;
          
          return (
            <div key={`interval-detail-${idx}-${interval.id}`} className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 min-w-[40px]">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: interval.color }}
                />
                <span className="font-medium">{idx + 1}.</span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{interval.name || interval.type}</span>
                  {interval.equipment && EQUIPMENT_CONFIGS[interval.equipment] && (
                    <span className="text-lg" title={EQUIPMENT_CONFIGS[interval.equipment].label}>
                      {EQUIPMENT_CONFIGS[interval.equipment].icon}
                    </span>
                  )}
                </div>
                
                {hasSetStructure ? (
                  <span className="text-muted-foreground">
                    {interval.setConfig!.numberOfSets} sets × {interval.setConfig!.intervalsPerSet} intervals 
                    ({formatMetric(interval)} each)
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {formatMetric(interval)}
                  </span>
                )}
              </div>
              
              {hasSetStructure && (
                <Badge variant="outline" className="text-xs">
                  <Repeat className="h-3 w-3 mr-1" />
                  {interval.setConfig!.numberOfSets} sets
                </Badge>
              )}
              
              {interval.primaryMetric && interval.primaryMetric !== 'time' && (
                <Badge variant="secondary" className="text-xs">
                  {interval.primaryMetric}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}