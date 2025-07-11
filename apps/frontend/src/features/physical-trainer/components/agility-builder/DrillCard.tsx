'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MoreVertical,
  GripVertical,
  Clock,
  Copy,
  Trash2,
  Edit,
  Target,
  Users,
  Timer,
  Pause
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { AgilityDrill } from '../../types/agility.types';

interface DrillCardProps {
  drill: AgilityDrill;
  index: number;
  isActive?: boolean;
  isDragging?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export default function DrillCard({
  drill,
  index,
  isActive,
  isDragging,
  onEdit,
  onDelete,
  onDuplicate
}: DrillCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: drill.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const estimatedTime = drill.duration || drill.targetTime || 15;
  const totalTime = (estimatedTime * drill.reps) + (drill.restBetweenReps * (drill.reps - 1));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isDragging && "opacity-50"
      )}
    >
      <Card 
        className={cn(
          "transition-all cursor-pointer hover:shadow-md",
          isActive && "ring-2 ring-primary"
        )}
        onClick={onEdit}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="mt-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-5 w-5" />
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium flex items-center gap-2 text-base">
                    <span className="text-muted-foreground">#{index + 1}</span>
                    {drill.category === 'rest' && <Pause className="h-4 w-4 text-blue-500" />}
                    <span className="truncate">{drill.name}</span>
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                    {drill.description}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.();
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate?.();
                    }}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.();
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Drill Details */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm mb-3">
                {drill.category === 'rest' ? (
                  <>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">Duration: {drill.duration || 60}s</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-600">
                      <Pause className="h-4 w-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">Recovery Period</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-4 w-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">{drill.reps} reps</span>
                      {drill.sets && drill.sets > 1 && <span className="whitespace-nowrap">× {drill.sets} sets</span>}
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">~{Math.ceil(totalTime / 60)} min</span>
                    </div>

                    {drill.targetTime && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Target className="h-4 w-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">Target: {drill.targetTime}s</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Timer className="h-4 w-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">{drill.restBetweenReps}s rest</span>
                    </div>
                  </>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                <Badge 
                  variant={drill.category === 'rest' ? 'default' : 'secondary'} 
                  className={cn(
                    "text-xs capitalize px-2 py-0.5",
                    drill.category === 'rest' && "bg-blue-100 text-blue-700"
                  )}
                >
                  {drill.category.replace('_', ' ')}
                </Badge>
                {drill.difficulty && (
                  <Badge variant="outline" className="text-xs capitalize px-2 py-0.5">
                    {drill.difficulty}
                  </Badge>
                )}
                {drill.pattern && drill.pattern !== 'custom' && (
                  <Badge variant="outline" className="text-xs capitalize px-2 py-0.5">
                    {drill.pattern.replace('_', ' ')}
                  </Badge>
                )}
                {drill.equipment?.map(eq => (
                  <Badge key={eq} variant="outline" className="text-xs px-2 py-0.5">
                    {eq}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}