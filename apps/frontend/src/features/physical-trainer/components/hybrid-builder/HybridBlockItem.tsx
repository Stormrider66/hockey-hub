'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dumbbell,
  Heart,
  Timer,
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  Clock,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HybridWorkoutBlock } from '../../types/hybrid.types';

interface HybridBlockItemProps {
  block: HybridWorkoutBlock;
  isActive?: boolean;
  isDragging?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}


export default function HybridBlockItem({
  block,
  isActive,
  isDragging,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
}: HybridBlockItemProps) {
  const getBlockIcon = () => {
    switch (block.type) {
      case 'exercise':
        return <Dumbbell className="h-4 w-4" />;
      case 'interval':
        return <Heart className="h-4 w-4" />;
      case 'transition':
        return <Timer className="h-4 w-4" />;
    }
  };

  const getBlockColor = () => {
    switch (block.type) {
      case 'exercise':
        return 'bg-blue-50 border-blue-200 hover:border-blue-300';
      case 'interval':
        return 'bg-red-50 border-red-200 hover:border-red-300';
      case 'transition':
        return 'bg-gray-50 border-gray-200 hover:border-gray-300';
    }
  };

  const getBlockDetails = () => {
    switch (block.type) {
      case 'exercise':
        const exerciseBlock = block as any;
        return (
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              {exerciseBlock.exercises?.length || 0} exercises
            </Badge>
            {exerciseBlock.equipment?.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {exerciseBlock.equipment.join(', ')}
              </Badge>
            )}
          </div>
        );
      
      case 'interval':
        const intervalBlock = block as any;
        return (
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {intervalBlock.intervals?.length || 0} intervals
            </Badge>
            <Badge variant="outline" className="text-xs">
              {intervalBlock.equipment}
            </Badge>
          </div>
        );
      
      case 'transition':
        const transitionBlock = block as any;
        return (
          <Badge variant="secondary" className="text-xs">
            {transitionBlock.transitionType?.replace('_', ' ') || 'rest'}
          </Badge>
        );
      
      default:
        return null;
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds > 0 ? `${remainingSeconds}s` : ''}`.trim();
    }
    return `${seconds}s`;
  };

  return (
    <Card
      className={cn(
        'p-3 transition-all duration-200',
        getBlockColor(),
        isActive && 'ring-2 ring-primary',
        isDragging && 'opacity-50',
        'cursor-pointer'
      )}
      onClick={onEdit}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp?.();
              }}
              disabled={!canMoveUp}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown?.();
              }}
              disabled={!canMoveDown}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {getBlockIcon()}
            <span className="text-xs text-muted-foreground">
              #{block.orderIndex + 1}
            </span>
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm">{block.name}</h4>
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {formatDuration(block.duration)}
              </Badge>
            </div>
            {getBlockDetails()}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}