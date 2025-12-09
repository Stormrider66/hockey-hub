import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dumbbell, Heart, Zap, Wind } from 'lucide-react';
import { SessionType } from '../../types/session-builder.types';

interface SessionTypeSelectorProps {
  value: SessionType;
  onChange: (type: SessionType) => void;
}

const sessionTypes: {
  value: SessionType;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}[] = [
  {
    value: 'strength',
    label: 'Strength',
    icon: <Dumbbell className="h-5 w-5" />,
    description: 'Focus on building power and muscle',
    color: 'text-red-600'
  },
  {
    value: 'conditioning',
    label: 'Conditioning',
    icon: <Heart className="h-5 w-5" />,
    description: 'Improve cardiovascular fitness',
    color: 'text-blue-600'
  },
  {
    value: 'mixed',
    label: 'Mixed',
    icon: <Zap className="h-5 w-5" />,
    description: 'Combination of strength and cardio',
    color: 'text-purple-600'
  },
  {
    value: 'agility',
    label: 'Agility',
    icon: <Wind className="h-5 w-5" />,
    description: 'Speed, agility, and coordination',
    color: 'text-green-600'
  }
];

export const SessionTypeSelector: React.FC<SessionTypeSelectorProps> = ({ value, onChange }) => {
  return (
    <RadioGroup value={value} onValueChange={onChange}>
      <div className="flex gap-2">
        {sessionTypes.map((type) => (
          <Label
            key={type.value}
            htmlFor={type.value}
            className="cursor-pointer"
          >
            <Card className={`p-3 hover:shadow-md transition-all ${
              value === type.value ? 'ring-2 ring-primary' : ''
            }`}>
              <RadioGroupItem
                value={type.value}
                id={type.value}
                className="sr-only"
              />
              <div className="flex items-center gap-2">
                <div className={type.color}>
                  {type.icon}
                </div>
                <div>
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </div>
              </div>
            </Card>
          </Label>
        ))}
      </div>
    </RadioGroup>
  );
};