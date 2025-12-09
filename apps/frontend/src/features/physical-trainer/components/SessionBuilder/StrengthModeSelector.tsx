import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Zap, Target, TrendingUp } from '@/components/icons';
import { StrengthMode } from '../../types/session-builder.types';
import { STRENGTH_MODE_CONFIGS, getStrengthModeConfig } from '../../config/strengthModeConfig';

interface StrengthModeSelectorProps {
  value: StrengthMode;
  onChange: (mode: StrengthMode) => void;
  disabled?: boolean;
  showDescription?: boolean;
  className?: string;
}

const ICONS = {
  strength: Zap,
  power: Zap,
  stability_core: Target,
  plyometrics: TrendingUp,
};

const COLORS = {
  strength: 'bg-blue-100 text-blue-800 border-blue-200',
  power: 'bg-red-100 text-red-800 border-red-200',
  stability_core: 'bg-green-100 text-green-800 border-green-200',
  plyometrics: 'bg-orange-100 text-orange-800 border-orange-200',
};

export const StrengthModeSelector: React.FC<StrengthModeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  showDescription = true,
  className = ''
}) => {
  const currentConfig = getStrengthModeConfig(value);
  const Icon = ICONS[value];

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="strength-mode">Strength Training Mode</Label>
      
      <Select
        value={value}
        onValueChange={(newValue) => onChange(newValue as StrengthMode)}
        disabled={disabled}
      >
        <SelectTrigger id="strength-mode" className="w-full">
          <SelectValue>
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{currentConfig.name}</span>
              <Badge variant="outline" className={COLORS[value]}>
                {currentConfig.intensityFocus}
              </Badge>
            </div>
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent>
          {Object.values(STRENGTH_MODE_CONFIGS).map((config) => {
            const ModeIcon = ICONS[config.mode];
            return (
              <SelectItem key={config.mode} value={config.mode}>
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-2">
                    <ModeIcon className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">{config.name}</span>
                      {showDescription && (
                        <span className="text-xs text-gray-500">
                          {config.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className={COLORS[config.mode]}>
                    {config.intensityFocus}
                  </Badge>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {showDescription && (
        <div className="bg-gray-50 rounded-lg p-3 border">
          <div className="flex items-start gap-2">
            <Icon className="h-5 w-5 mt-0.5 text-gray-600" />
            <div className="flex-1">
              <h4 className="font-medium text-sm text-gray-900">
                {currentConfig.name} Training
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                {currentConfig.description}
              </p>
              
              <div className="mt-2 flex flex-wrap gap-2">
                <div className="text-xs">
                  <span className="font-medium">Reps:</span> {currentConfig.defaultRepRange.recommended}
                  <span className="text-gray-500 ml-1">
                    ({currentConfig.defaultRepRange.min}-{currentConfig.defaultRepRange.max})
                  </span>
                </div>
                
                <div className="text-xs">
                  <span className="font-medium">Sets:</span> {currentConfig.defaultSetRange.recommended}
                  <span className="text-gray-500 ml-1">
                    ({currentConfig.defaultSetRange.min}-{currentConfig.defaultSetRange.max})
                  </span>
                </div>
                
                <div className="text-xs">
                  <span className="font-medium">Rest:</span> {Math.floor(currentConfig.defaultRestPeriods.betweenSets / 60)}:{String(currentConfig.defaultRestPeriods.betweenSets % 60).padStart(2, '0')}
                </div>
              </div>

              {currentConfig.availableMetrics.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs font-medium">Tracked Metrics:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentConfig.availableMetrics.map((metric) => (
                      <Badge key={metric} variant="secondary" className="text-xs">
                        {metric === 'powerOutput' ? 'Power' :
                         metric === 'jumpHeight' ? 'Jump Height' :
                         metric === 'holdTime' ? 'Hold Time' :
                         metric === 'reactiveStrengthIndex' ? 'RSI' :
                         metric}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};