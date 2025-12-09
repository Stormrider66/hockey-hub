'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Activity,
  Timer,
  Heart,
  Plus
} from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type ExerciseSection = 'warmup' | 'intervals' | 'cooldown';

interface ExerciseSectionNavigationProps {
  activeSection: ExerciseSection;
  onSectionChange: (section: ExerciseSection) => void;
  counts: {
    warmup: number;
    intervals: number;
    cooldown: number;
  };
  onAddClick?: (section: ExerciseSection) => void;
  className?: string;
}

export default function ExerciseSectionNavigation({
  activeSection,
  onSectionChange,
  counts,
  onAddClick,
  className
}: ExerciseSectionNavigationProps) {
  const sections = [
    {
      id: 'warmup' as ExerciseSection,
      label: 'Warm-up',
      icon: Activity,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      activeColor: 'bg-yellow-100 border-yellow-400'
    },
    {
      id: 'intervals' as ExerciseSection,
      label: 'Intervals',
      icon: Timer,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      activeColor: 'bg-red-100 border-red-400'
    },
    {
      id: 'cooldown' as ExerciseSection,
      label: 'Cooldown',
      icon: Heart,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      activeColor: 'bg-green-100 border-green-400'
    }
  ];

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      {sections.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        const count = counts[section.id];
        
        return (
          <div key={section.id} className="relative">
            <div
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all",
                "hover:shadow-sm",
                isActive
                  ? cn(section.activeColor, "shadow-sm")
                  : cn(section.bgColor, section.borderColor, "hover:border-gray-300")
              )}
            >
              <button
                onClick={() => onSectionChange(section.id)}
                className="flex-1 flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent rounded-md"
              >
                <Icon className={cn("h-5 w-5", section.color)} />
                <span className={cn("font-medium", isActive && "text-gray-900")}>
                  {section.label}
                </span>
              </button>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={isActive ? "default" : "secondary"} 
                  className={cn(
                    "min-w-[24px] h-6",
                    !isActive && section.bgColor
                  )}
                >
                  {count}
                </Badge>
                {isActive && onAddClick && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2"
                    onClick={() => onAddClick(section.id)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            {isActive && (
              <div 
                className={cn(
                  "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
                  section.id === 'warmup' && "bg-yellow-500",
                  section.id === 'intervals' && "bg-red-500",
                  section.id === 'cooldown' && "bg-green-500"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}