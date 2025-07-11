'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GripVertical, 
  Clock, 
  Heart, 
  Zap, 
  Edit, 
  Copy, 
  Trash2,
  Activity,
  Gauge
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IntervalSet, WorkoutEquipmentType } from '../../types/conditioning.types';
import { EQUIPMENT_CONFIGS } from '../../types/conditioning.types';

interface IntervalTimelineProps {
  intervals: IntervalSet[];
  onEdit: (interval: IntervalSet) => void;
  onDelete: (intervalId: string) => void;
  onDuplicate: (interval: IntervalSet) => void;
  equipment: WorkoutEquipmentType;
}

interface IntervalCardProps {
  interval: IntervalSet;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  equipment: WorkoutEquipmentType;
}

function IntervalCard({ interval, index, onEdit, onDelete, onDuplicate, equipment }: IntervalCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: interval.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getIntervalTypeLabel = (type: string) => {
    switch (type) {
      case 'warmup': return 'Warm Up';
      case 'work': return 'Work';
      case 'rest': return 'Rest';
      case 'active_recovery': return 'Active Recovery';
      case 'cooldown': return 'Cool Down';
      default: return type;
    }
  };

  const getTargetDisplay = () => {
    const targets = [];
    
    if (interval.targetMetrics.heartRate) {
      const hr = interval.targetMetrics.heartRate;
      if (hr.type === 'zone') {
        targets.push(`Zone ${hr.value}`);
      } else if (hr.type === 'percentage') {
        targets.push(`${hr.value}% HR`);
      } else {
        targets.push(`${hr.value} BPM`);
      }
    }

    if (interval.targetMetrics.watts) {
      const watts = interval.targetMetrics.watts;
      if (watts.type === 'percentage') {
        targets.push(`${watts.value}% Power`);
      } else {
        targets.push(`${watts.value}W`);
      }
    }

    if (interval.targetMetrics.pace) {
      targets.push(`Pace: ${interval.targetMetrics.pace.value}`);
    }

    if (interval.targetMetrics.rpm) {
      targets.push(`${interval.targetMetrics.rpm} RPM`);
    }

    return targets;
  };

  const targets = getTargetDisplay();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isDragging && "opacity-50"
      )}
    >
      <Card className="mb-2 overflow-hidden">
        <div 
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: interval.color || '#3b82f6' }}
        />
        <CardContent className="p-3 pl-4">
          <div className="flex items-start gap-2">
            {/* Drag Handle */}
            <button
              className="cursor-grab hover:bg-gray-100 rounded p-1 mt-1"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </button>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">#{index + 1}</span>
                  <Badge variant="outline" className="text-xs">
                    {getIntervalTypeLabel(interval.type)}
                  </Badge>
                  {interval.name && (
                    <span className="text-sm font-medium">{interval.name}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDuration(interval.duration)}
                  </Badge>
                </div>
              </div>

              {/* Targets */}
              {targets.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {targets.map((target, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {target.includes('BPM') && <Heart className="h-3 w-3 mr-1" />}
                      {target.includes('W') && <Zap className="h-3 w-3 mr-1" />}
                      {target.includes('RPM') && <Gauge className="h-3 w-3 mr-1" />}
                      {target.includes('Pace') && <Activity className="h-3 w-3 mr-1" />}
                      {target}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Notes */}
              {interval.notes && (
                <p className="text-xs text-muted-foreground">{interval.notes}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={onEdit}>
                <Edit className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" onClick={onDuplicate}>
                <Copy className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" onClick={onDelete}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function IntervalTimeline({
  intervals,
  onEdit,
  onDelete,
  onDuplicate,
  equipment
}: IntervalTimelineProps) {
  if (intervals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Clock className="h-12 w-12 mb-4 opacity-50" />
        <p>No intervals added yet</p>
        <p className="text-sm">Click "Add Interval" to get started</p>
      </div>
    );
  }

  // Calculate cumulative time for visual timeline
  let cumulativeTime = 0;
  const totalDuration = intervals.reduce((sum, interval) => sum + interval.duration, 0);

  return (
    <div className="space-y-2">
      {/* Visual Timeline */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex h-8 rounded overflow-hidden">
          {intervals.map((interval, index) => {
            const width = (interval.duration / totalDuration) * 100;
            const startPercentage = (cumulativeTime / totalDuration) * 100;
            cumulativeTime += interval.duration;
            
            return (
              <div
                key={interval.id}
                className="relative group"
                style={{
                  width: `${width}%`,
                  backgroundColor: interval.color || '#3b82f6',
                }}
                title={`${interval.name || getIntervalTypeLabel(interval.type)} - ${formatDuration(interval.duration)}`}
              >
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatDuration(interval.duration)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>0:00</span>
          <span>Total: {formatDuration(totalDuration)}</span>
        </div>
      </div>

      {/* Interval Cards */}
      <div className="space-y-2">
        {intervals.map((interval, index) => (
          <IntervalCard
            key={interval.id}
            interval={interval}
            index={index}
            onEdit={() => onEdit(interval)}
            onDelete={() => onDelete(interval.id)}
            onDuplicate={() => onDuplicate(interval)}
            equipment={equipment}
          />
        ))}
      </div>
    </div>
  );
}

function getIntervalTypeLabel(type: string) {
  switch (type) {
    case 'warmup': return 'Warm Up';
    case 'work': return 'Work';
    case 'rest': return 'Rest';
    case 'active_recovery': return 'Active Recovery';
    case 'cooldown': return 'Cool Down';
    default: return type;
  }
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}