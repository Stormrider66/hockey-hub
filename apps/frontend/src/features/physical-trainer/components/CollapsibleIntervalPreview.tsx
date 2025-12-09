'use client';

import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Clock, Activity, Repeat } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { IntervalSet } from '../types/conditioning.types';
import { EQUIPMENT_CONFIGS } from '../types/conditioning.types';
import { expandIntervals } from '../utils/conditioning.utils';

interface CollapsibleIntervalPreviewProps {
  intervals: IntervalSet[];
  className?: string;
}

interface GroupedInterval {
  sourceId: string;
  representativeInterval: IntervalSet;
  intervals: IntervalSet[];
  numberOfSets: number;
  intervalsPerSet: number;
  restBetweenSets: number;
  restBetweenIntervals: number;
  totalDuration: number;
}

export default function CollapsibleIntervalPreview({ intervals, className }: CollapsibleIntervalPreviewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Group intervals and expand them if needed
  const groupedIntervals = useMemo(() => {
    const groups: GroupedInterval[] = [];
    
    intervals.forEach(interval => {
      const setConfig = (interval as any).setConfig;
      
      if (setConfig) {
        // This interval has a setConfig, so we need to expand it for display
        const expandedIntervals = expandIntervals([interval]);
        
        groups.push({
          sourceId: interval.id,
          representativeInterval: interval,
          intervals: expandedIntervals,
          numberOfSets: setConfig.numberOfSets,
          intervalsPerSet: setConfig.intervalsPerSet,
          restBetweenSets: setConfig.restBetweenSets,
          restBetweenIntervals: setConfig.restBetweenIntervals,
          totalDuration: 0
        });
      } else {
        // This is a simple interval without setConfig
        groups.push({
          sourceId: interval.id,
          representativeInterval: interval,
          intervals: [interval],
          numberOfSets: 1,
          intervalsPerSet: 1,
          restBetweenSets: 0,
          restBetweenIntervals: 0,
          totalDuration: interval.duration
        });
      }
    });

    // Calculate total duration for each group
    groups.forEach(group => {
      const workDuration = group.representativeInterval.duration * group.numberOfSets * group.intervalsPerSet;
      const restWithinSets = group.restBetweenIntervals * (group.intervalsPerSet - 1) * group.numberOfSets;
      const restBetweenSetsTotal = group.restBetweenSets * (group.numberOfSets - 1);
      group.totalDuration = workDuration + restWithinSets + restBetweenSetsTotal;
    });

    return groups;
  }, [intervals]);

  const toggleGroup = (sourceId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(sourceId)) {
      newExpanded.delete(sourceId);
    } else {
      newExpanded.add(sourceId);
    }
    setExpandedGroups(newExpanded);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}min`;
    return `${mins}min ${secs}s`;
  };

  const formatTargetDisplay = (interval: IntervalSet) => {
    const targets = [];
    
    if (interval.equipment) {
      const equipment = EQUIPMENT_CONFIGS[interval.equipment];
      targets.push(`${equipment.icon} ${equipment.label}`);
    }

    if (interval.targetMetrics?.watts?.value) {
      targets.push(`${interval.targetMetrics.watts.value}W`);
    }
    
    if (interval.targetMetrics?.heartRate?.value) {
      targets.push(`${interval.targetMetrics.heartRate.value} bpm`);
    }
    
    if (interval.targetMetrics?.pace?.value) {
      const totalSeconds = interval.targetMetrics.pace.value;
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      // Use appropriate pace unit based on equipment
      const paceUnit = interval.equipment === 'rowing' ? '/500m' : '/km';
      targets.push(`${mins}:${secs.toString().padStart(2, '0')}${paceUnit}`);
    }

    return targets.join(' @ ');
  };

  if (intervals.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p className="text-sm">No intervals added yet</p>
        <p className="text-xs mt-1">Add intervals to see the workout structure</p>
      </div>
    );
  }

  // Calculate total workout summary
  const totalWorkTime = groupedIntervals.reduce((acc, group) => {
    return acc + (group.representativeInterval.duration * group.numberOfSets * group.intervalsPerSet);
  }, 0);
  
  const totalRestTime = groupedIntervals.reduce((acc, group) => {
    const restWithinSets = group.restBetweenIntervals * (group.intervalsPerSet - 1) * group.numberOfSets;
    const restBetweenSetsTotal = group.restBetweenSets * (group.numberOfSets - 1);
    return acc + restWithinSets + restBetweenSetsTotal;
  }, 0);
  
  const totalTime = totalWorkTime + totalRestTime;
  const hasMultipleSets = groupedIntervals.some(g => g.numberOfSets > 1 || g.intervalsPerSet > 1);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Workout Summary */}
      {hasMultipleSets && groupedIntervals.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Workout Summary
            </span>
            <span className="text-sm text-gray-600">
              {groupedIntervals.map((group, idx) => {
                const interval = group.representativeInterval;
                const isDistanceBased = (interval as any).primaryMetric === 'distance';
                const workDisplay = isDistanceBased && (interval as any).targetDistance
                  ? `${(interval as any).targetDistance}${interval.equipment ? EQUIPMENT_CONFIGS[interval.equipment]?.units?.distance || 'm' : 'm'}`
                  : formatDuration(interval.duration);
                
                return (
                  <span key={group.sourceId}>
                    {idx > 0 && " + "}
                    {group.numberOfSets} × {group.intervalsPerSet} {interval.name}
                    {group.restBetweenIntervals > 0 && ` (${workDisplay}/${formatDuration(group.restBetweenIntervals)})`}
                  </span>
                );
              })}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">
              Work: {formatDuration(totalWorkTime)}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">
              Rest: {formatDuration(totalRestTime)}
            </span>
            <span className="text-gray-400">•</span>
            <span className="font-medium text-gray-700">
              Total: {formatDuration(totalTime)}
            </span>
          </div>
        </div>
      )}
      
      {groupedIntervals.map((group, groupIndex) => {
        const isExpanded = expandedGroups.has(group.sourceId);
        const hasMultipleIntervals = group.intervals.length > 1 || group.numberOfSets > 1;
        const interval = group.representativeInterval;
        
        return (
          <div key={group.sourceId} className="border rounded-lg overflow-hidden">
            {/* Collapsed View - Always Visible */}
            <div className="bg-white p-4">
              <div className="flex items-start gap-3">
                {hasMultipleIntervals && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleGroup(group.sourceId)}
                    className="p-0 h-6 w-6"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                )}
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="font-mono">
                      #{groupIndex + 1}
                    </Badge>
                    
                    <h4 className="font-semibold text-lg">
                      {interval.name || 'Interval Set'}
                    </h4>
                    
                    {(group.numberOfSets > 1 || group.intervalsPerSet > 1) && (
                      <Badge variant="secondary" className="text-sm">
                        <Repeat className="h-3 w-3 mr-1" />
                        {group.numberOfSets} {group.numberOfSets === 1 ? 'set' : 'sets'} × {group.intervalsPerSet} {group.intervalsPerSet === 1 ? 'interval' : 'intervals'}
                      </Badge>
                    )}
                    
                    {/* Workout structure summary */}
                    {(group.numberOfSets > 1 || group.intervalsPerSet > 1) && (
                      <span className="text-sm text-muted-foreground">
                        ({(interval as any).primaryMetric === 'distance' && (interval as any).targetDistance 
                          ? `${(interval as any).targetDistance}${interval.equipment ? EQUIPMENT_CONFIGS[interval.equipment]?.units?.distance || 'm' : 'm'}`
                          : formatDuration(interval.duration)} work / {formatDuration(group.restBetweenIntervals)} rest)
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-medium">
                      {(interval as any).primaryMetric === 'distance' && (interval as any).targetDistance 
                        ? `${(interval as any).targetDistance}${interval.equipment ? EQUIPMENT_CONFIGS[interval.equipment]?.units?.distance || 'm' : 'm'}`
                        : formatDuration(interval.duration)} {formatTargetDisplay(interval)}
                    </span>
                    
                    {(group.restBetweenIntervals > 0 || group.restBetweenSets > 0) && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span>
                          Rest: {group.restBetweenIntervals}s between intervals
                          {group.numberOfSets > 1 && `, ${group.restBetweenSets}s between sets`}
                        </span>
                      </>
                    )}
                    
                    <span className="text-gray-400">•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Total: {formatDuration(group.totalDuration)}
                    </span>
                  </div>
                </div>
                
                <div
                  className="w-3 h-3 rounded-full mt-2"
                  style={{ backgroundColor: interval.color || '#3b82f6' }}
                />
              </div>
            </div>
            
            {/* Expanded View - Individual Intervals */}
            {isExpanded && hasMultipleIntervals && (
              <div className="bg-gray-50 border-t p-4">
                <div className="space-y-2">
                  {group.intervals.map((interval, index) => {
                    const isRest = interval.type === 'rest';
                    let workIntervalIndex = 0;
                    for (let i = 0; i < index; i++) {
                      if (group.intervals[i].type !== 'rest') {
                        workIntervalIndex++;
                      }
                    }
                    if (!isRest) workIntervalIndex++;
                    
                    return (
                      <div key={interval.id} className="flex items-center gap-3 pl-9">
                        <div className={cn(
                          "flex items-center justify-center w-6 h-6 rounded-full shadow-sm text-xs font-medium",
                          isRest ? "bg-gray-100 text-gray-600" : "bg-white border border-gray-200"
                        )}>
                          {isRest ? 'R' : workIntervalIndex}
                        </div>
                        <div className="flex-1 text-sm">
                          <span className={cn("font-medium", isRest && "text-gray-600")}>
                            {interval.name}
                          </span>
                          <span className="text-muted-foreground ml-2">
                            {(interval as any).primaryMetric === 'distance' && (interval as any).targetDistance 
                              ? `${(interval as any).targetDistance}${interval.equipment ? EQUIPMENT_CONFIGS[interval.equipment]?.units?.distance || 'm' : 'm'}`
                              : formatDuration(interval.duration)}
                          </span>
                          {interval.equipment && !isRest && (
                            <span className="text-muted-foreground ml-2">
                              • {formatTargetDisplay(interval)}
                            </span>
                          )}
                        </div>
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: interval.color || (isRest ? '#94a3b8' : '#3b82f6') }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}