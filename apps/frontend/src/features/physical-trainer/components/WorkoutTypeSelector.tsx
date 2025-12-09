'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Plus, Dumbbell, Heart, Zap, ChevronDown } from 'lucide-react';

interface WorkoutTypeSelectorProps {
  onSelectStrength: () => void;
  onSelectConditioning: () => void;
  onSelectHybrid: () => void;
  onSelectAgility: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export default function WorkoutTypeSelector({
  onSelectStrength,
  onSelectConditioning,
  onSelectHybrid,
  onSelectAgility,
  variant = 'default',
  size = 'default'
}: WorkoutTypeSelectorProps) {
  const { t } = useTranslation(['physicalTrainer']);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const workoutTypes = [
    {
      id: 'strength',
      label: t('physicalTrainer:workoutTypes.strength'),
      icon: <Dumbbell className="h-4 w-4" />,
      onClick: onSelectStrength,
      className: 'hover:bg-blue-50 hover:text-blue-700',
      iconColor: 'text-blue-600'
    },
    {
      id: 'conditioning',
      label: t('physicalTrainer:workoutTypes.conditioning'),
      icon: <Heart className="h-4 w-4" />,
      onClick: onSelectConditioning,
      className: 'hover:bg-red-50 hover:text-red-700',
      iconColor: 'text-red-600'
    },
    {
      id: 'hybrid',
      label: t('physicalTrainer:workoutTypes.hybrid'),
      icon: <Dumbbell className="h-4 w-4" />,
      onClick: onSelectHybrid,
      className: 'hover:bg-purple-50 hover:text-purple-700',
      iconColor: 'text-purple-600'
    },
    {
      id: 'agility',
      label: t('physicalTrainer:workoutTypes.agility'),
      icon: <Zap className="h-4 w-4" />,
      onClick: onSelectAgility,
      className: 'hover:bg-yellow-50 hover:text-yellow-700',
      iconColor: 'text-yellow-600'
    }
  ];

  const handleSelect = (workoutType: typeof workoutTypes[0]) => {
    workoutType.onClick();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant={variant}
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        className="min-w-[180px] justify-between"
      >
        <span className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t('sessions.management.createWorkout')}
        </span>
        <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-2">
            <div className="text-sm font-medium text-gray-500 px-3 py-2">
              {t('sessions.management.selectWorkoutType')}
            </div>
            {workoutTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleSelect(type)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${type.className}`}
              >
                <span className={type.iconColor}>{type.icon}</span>
                <div className="text-left">
                  <div className="font-medium">{type.label}</div>
                  <div className="text-xs text-gray-500">
                    {t(`physicalTrainer:workoutTypes.${type.id}Description`)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}