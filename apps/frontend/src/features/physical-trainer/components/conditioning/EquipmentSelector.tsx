'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { WorkoutEquipmentType } from '../../types/conditioning.types';
import { EQUIPMENT_CONFIGS } from '../../types/conditioning.types';

interface EquipmentSelectorProps {
  selected: WorkoutEquipmentType;
  onChange: (equipment: WorkoutEquipmentType) => void;
  className?: string;
}

export default function EquipmentSelector({
  selected,
  onChange,
  className
}: EquipmentSelectorProps) {
  const { t } = useTranslation(['physicalTrainer']);

  return (
    <div className={className}>
      <Label className="mb-3 block">
        {t('physicalTrainer:conditioning.equipment.title')}
      </Label>
      <RadioGroup
        value={selected}
        onValueChange={(value) => onChange(value as WorkoutEquipmentType)}
        className="grid grid-cols-2 gap-2"
      >
        {Object.entries(EQUIPMENT_CONFIGS).map(([key, config]) => (
          <div key={key}>
            <RadioGroupItem
              value={key}
              id={key}
              className="peer sr-only"
            />
            <Label
              htmlFor={key}
              className={cn(
                "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              )}
            >
              <span className="text-2xl mb-1">{config.icon}</span>
              <span className="text-sm font-medium">{config.label}</span>
              <div className="flex gap-1 mt-1">
                <Badge variant="outline" className="text-xs">
                  {config.metrics.primary}
                </Badge>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}