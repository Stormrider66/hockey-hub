'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Heart, 
  Zap, 
  Activity, 
  Gauge,
  FileText,
  Save,
  X,
  Target,
  Flame,
  Repeat,
  Timer
} from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { 
  IntervalSet, 
  IntervalType,
  PlayerTestResult,
  TargetMetric
} from '../../types';
import { WorkoutEquipmentType, EQUIPMENT_CONFIGS } from '../../types/conditioning.types';

// Extended interface for enhanced intervals
export interface EnhancedIntervalSet extends IntervalSet {
  primaryMetric?: 'time' | 'distance' | 'calories' | 'watts' | 'heartRate';
  targetValue?: number;
  targetUnit?: string;
  setConfig?: {
    numberOfSets: number;
    intervalsPerSet: number;
    restBetweenSets: number; // seconds
    restBetweenIntervals: number; // seconds
  };
}

interface IntervalFormEnhancedProps {
  interval: EnhancedIntervalSet;
  equipment: WorkoutEquipmentType;
  onSave: (interval: EnhancedIntervalSet) => void;
  onCancel: () => void;
  playerTests?: PlayerTestResult[];
}

const INTERVAL_TYPES: { value: IntervalType; label: string; color: string }[] = [
  { value: 'warmup', label: 'Warm Up', color: '#10b981' },
  { value: 'work', label: 'Work', color: '#ef4444' },
  { value: 'rest', label: 'Rest', color: '#3b82f6' },
  { value: 'active_recovery', label: 'Active Recovery', color: '#f59e0b' },
  { value: 'cooldown', label: 'Cool Down', color: '#6366f1' },
];

const PRIMARY_METRICS = [
  { value: 'time', label: 'For Time', icon: Clock, unit: 'seconds' },
  { value: 'distance', label: 'Distance', icon: Target, unit: 'meters' },
  { value: 'calories', label: 'Calories', icon: Flame, unit: 'cal' },
  { value: 'watts', label: 'Power (Watts)', icon: Zap, unit: 'watts' },
  { value: 'heartRate', label: 'Heart Rate', icon: Heart, unit: 'bpm' }
];

export default function IntervalFormEnhanced({
  interval,
  equipment,
  onSave,
  onCancel,
  playerTests = []
}: IntervalFormEnhancedProps) {
  const { t } = useTranslation(['physicalTrainer']);
  const equipmentConfig = EQUIPMENT_CONFIGS[equipment];
  
  // Form state
  const [formData, setFormData] = useState<EnhancedIntervalSet>({
    ...interval,
    equipment,
    primaryMetric: interval.primaryMetric || 'time',
    targetValue: interval.targetValue || (interval.primaryMetric === 'time' ? interval.duration : 0),
    setConfig: interval.setConfig || {
      numberOfSets: 1,
      intervalsPerSet: 1,
      restBetweenSets: 60,
      restBetweenIntervals: 30
    }
  });
  
  const [targetType, setTargetType] = useState<'absolute' | 'percentage' | 'zone'>('absolute');
  const [reference, setReference] = useState<string>('max');
  const [useSetStructure, setUseSetStructure] = useState(
    formData.setConfig ? formData.setConfig.numberOfSets > 1 : false
  );

  // Get the appropriate unit based on equipment and metric
  const getMetricUnit = (metric: string) => {
    const metricConfig = PRIMARY_METRICS.find(m => m.value === metric);
    if (!metricConfig) return '';
    
    // Special handling for distance based on equipment
    if (metric === 'distance') {
      if (equipment === WorkoutEquipmentType.ROWING || equipment === WorkoutEquipmentType.SKIERG) {
        return 'meters';
      } else if (equipment === WorkoutEquipmentType.RUNNING || equipment === WorkoutEquipmentType.TREADMILL) {
        return equipmentConfig.units.distance || 'meters';
      }
    }
    
    return metricConfig.unit;
  };

  // Update form data
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateSetConfig = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      setConfig: {
        ...prev.setConfig!,
        [field]: value
      }
    }));
  };

  // Helper to get safe values for calculations (provides defaults only for calculations, not display)
  const getSafeSetConfigValue = (field: keyof NonNullable<EnhancedIntervalSet['setConfig']>) => {
    const value = formData.setConfig?.[field];
    if (value === undefined || value === 0) {
      switch (field) {
        case 'numberOfSets': return 1;
        case 'intervalsPerSet': return 1;
        case 'restBetweenSets': return 60;
        case 'restBetweenIntervals': return 30;
        default: return 0;
      }
    }
    return value;
  };

  const updateTargetMetric = (metric: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      targetMetrics: {
        ...prev.targetMetrics,
        [metric]: value
      }
    }));
  };

  // Convert target value to duration if primary metric is time
  useEffect(() => {
    if (formData.primaryMetric === 'time' && formData.targetValue) {
      updateFormData('duration', formData.targetValue);
    }
  }, [formData.primaryMetric, formData.targetValue]);

  const handleSave = () => {
    // Calculate total duration if using sets
    if (useSetStructure && formData.setConfig) {
      // Create safe config with proper defaults for saving
      const safeSetConfig = {
        numberOfSets: getSafeSetConfigValue('numberOfSets'),
        intervalsPerSet: getSafeSetConfigValue('intervalsPerSet'),
        restBetweenSets: getSafeSetConfigValue('restBetweenSets'),
        restBetweenIntervals: getSafeSetConfigValue('restBetweenIntervals')
      };
      
      const { numberOfSets, intervalsPerSet, restBetweenSets, restBetweenIntervals } = safeSetConfig;
      const workDuration = formData.duration * intervalsPerSet * numberOfSets;
      const restWithinSets = restBetweenIntervals * (intervalsPerSet - 1) * numberOfSets;
      const restBetweenSetsTotal = restBetweenSets * (numberOfSets - 1);
      const totalDuration = workDuration + restWithinSets + restBetweenSetsTotal;
      
      // Store the individual interval duration, not the total
      onSave({
        ...formData,
        setConfig: safeSetConfig
      });
    } else {
      onSave({
        ...formData,
        setConfig: undefined
      });
    }
  };

  const selectedType = INTERVAL_TYPES.find(t => t.value === formData.type);
  const selectedMetric = PRIMARY_METRICS.find(m => m.value === formData.primaryMetric);
  const MetricIcon = selectedMetric?.icon || Clock;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('physicalTrainer:conditioning.intervalForm.title')}</CardTitle>
          <Button size="icon" variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
        {/* Interval Type */}
        <div>
          <Label>{t('physicalTrainer:conditioning.intervalForm.type')}</Label>
          <Select
            value={formData.type}
            onValueChange={(value: IntervalType) => {
              updateFormData('type', value);
              const type = INTERVAL_TYPES.find(t => t.value === value);
              if (type) {
                updateFormData('color', type.color);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTERVAL_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: type.color }}
                    />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Interval Name */}
        <div>
          <Label>{t('physicalTrainer:conditioning.intervalForm.name')}</Label>
          <Input
            value={formData.name || ''}
            onChange={(e) => updateFormData('name', e.target.value)}
            placeholder={t('physicalTrainer:conditioning.intervalForm.namePlaceholder')}
          />
        </div>

        {/* Equipment Selection - Per Interval */}
        <div>
          <Label>{t('physicalTrainer:conditioning.intervalForm.equipment')}</Label>
          <Select 
            value={formData.equipment} 
            onValueChange={(value) => updateFormData('equipment', value as WorkoutEquipmentType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(EQUIPMENT_CONFIGS).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{config.icon}</span>
                    <span>{config.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Primary Metric Selection */}
        <div>
          <Label className="text-base font-medium mb-2 block">Primary Target Metric</Label>
          <Select
            value={formData.primaryMetric}
            onValueChange={(value) => updateFormData('primaryMetric', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIMARY_METRICS.map(metric => {
                const Icon = metric.icon;
                // Check if this metric is supported by the equipment
                const isSupported = metric.value === 'time' || 
                  (equipmentConfig.metrics.primary === metric.value) ||
                  (equipmentConfig.metrics.secondary?.includes(metric.value as any));
                
                return (
                  <SelectItem 
                    key={metric.value} 
                    value={metric.value}
                    disabled={!isSupported}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{metric.label}</span>
                      {!isSupported && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (Not available for {equipmentConfig.label})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Target Value Input */}
        <div>
          <Label className="flex items-center gap-2">
            <MetricIcon className="h-4 w-4" />
            Target {selectedMetric?.label}
          </Label>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              value={formData.targetValue || ''}
              onChange={(e) => updateFormData('targetValue', parseInt(e.target.value) || 0)}
              placeholder={`Enter ${selectedMetric?.label.toLowerCase()}`}
              min={0}
            />
            <span className="text-sm text-muted-foreground min-w-[60px]">
              {getMetricUnit(formData.primaryMetric || 'time')}
            </span>
          </div>
        </div>

        <Separator />

        {/* Set Structure Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="use-sets" className="text-base font-medium">
              Use Set Structure
            </Label>
            <p className="text-sm text-muted-foreground">
              Repeat this interval multiple times with rest
            </p>
          </div>
          <Button
            id="use-sets"
            variant={useSetStructure ? "default" : "outline"}
            size="sm"
            onClick={() => setUseSetStructure(!useSetStructure)}
          >
            <Repeat className="h-4 w-4 mr-2" />
            {useSetStructure ? 'Enabled' : 'Disabled'}
          </Button>
        </div>

        {/* Set Configuration */}
        {useSetStructure && (
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Set Configuration
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Number of Sets</Label>
                <Input
                  type="number"
                  value={formData.setConfig?.numberOfSets || ''}
                  onChange={(e) => updateSetConfig('numberOfSets', parseInt(e.target.value) || 0)}
                  min={1}
                  max={10}
                />
              </div>
              
              <div>
                <Label>Intervals per Set</Label>
                <Input
                  type="number"
                  value={formData.setConfig?.intervalsPerSet || ''}
                  onChange={(e) => updateSetConfig('intervalsPerSet', parseInt(e.target.value) || 0)}
                  min={1}
                  max={20}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  Rest Between Sets
                </Label>
                <Input
                  type="number"
                  value={formData.setConfig?.restBetweenSets || ''}
                  onChange={(e) => updateSetConfig('restBetweenSets', parseInt(e.target.value) || 0)}
                  min={0}
                  placeholder="seconds"
                />
                <span className="text-xs text-muted-foreground">seconds</span>
              </div>
              
              <div>
                <Label className="flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  Rest Between Intervals
                </Label>
                <Input
                  type="number"
                  value={formData.setConfig?.restBetweenIntervals || ''}
                  onChange={(e) => updateSetConfig('restBetweenIntervals', parseInt(e.target.value) || 0)}
                  min={0}
                  placeholder="seconds"
                />
                <span className="text-xs text-muted-foreground">seconds</span>
              </div>
            </div>

            {/* Total Duration Preview */}
            {formData.setConfig && (
              <div className="mt-4 p-3 bg-background rounded-lg border">
                <p className="text-sm font-medium mb-2">Total Duration for this Block:</p>
                <div className="text-2xl font-bold">
                  {(() => {
                    const numberOfSets = getSafeSetConfigValue('numberOfSets');
                    const intervalsPerSet = getSafeSetConfigValue('intervalsPerSet');
                    const restBetweenSets = getSafeSetConfigValue('restBetweenSets');
                    const restBetweenIntervals = getSafeSetConfigValue('restBetweenIntervals');
                    const intervalDuration = formData.primaryMetric === 'time' ? (formData.targetValue || 0) : (formData.duration || 60);
                    const workDuration = intervalDuration * intervalsPerSet * numberOfSets;
                    const restWithinSets = restBetweenIntervals * (intervalsPerSet - 1) * numberOfSets;
                    const restBetweenSetsTotal = restBetweenSets * (numberOfSets - 1);
                    const totalSeconds = workDuration + restWithinSets + restBetweenSetsTotal;
                    const minutes = Math.floor(totalSeconds / 60);
                    const seconds = totalSeconds % 60;
                    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                  })()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {getSafeSetConfigValue('numberOfSets')} sets × {getSafeSetConfigValue('intervalsPerSet')} intervals
                </p>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Additional Target Metrics */}
        <div>
          <h4 className="font-medium mb-3">Additional Target Metrics (Optional)</h4>
          <div className="space-y-4">
            {/* Heart Rate Target */}
            {formData.primaryMetric !== 'heartRate' && (
              <div>
                <Label className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  {t('physicalTrainer:conditioning.intervalForm.heartRate')}
                </Label>
                <Input
                  type="number"
                  value={formData.targetMetrics.heartRate?.value || ''}
                  onChange={(e) => updateTargetMetric('heartRate', { 
                    type: 'absolute', 
                    value: parseInt(e.target.value) 
                  })}
                  placeholder="BPM"
                  min={60}
                  max={220}
                />
              </div>
            )}

            {/* Equipment-specific metrics */}
            {formData.primaryMetric !== 'watts' && 
             (equipment === WorkoutEquipmentType.BIKE_ERG || 
              equipment === WorkoutEquipmentType.WATTBIKE ||
              equipment === WorkoutEquipmentType.AIRBIKE) && (
              <div>
                <Label className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  {t('physicalTrainer:conditioning.intervalForm.watts')}
                </Label>
                <Input
                  type="number"
                  value={formData.targetMetrics.watts?.value || ''}
                  onChange={(e) => updateTargetMetric('watts', { 
                    type: 'absolute', 
                    value: parseInt(e.target.value) 
                  })}
                  placeholder="Watts"
                  min={0}
                  max={1000}
                />
              </div>
            )}

            {/* RPM for bikes */}
            {(equipment === WorkoutEquipmentType.BIKE_ERG || 
              equipment === WorkoutEquipmentType.WATTBIKE ||
              equipment === WorkoutEquipmentType.AIRBIKE) && (
              <div>
                <Label className="flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  {t('physicalTrainer:conditioning.intervalForm.rpm')}
                </Label>
                <Input
                  type="number"
                  value={formData.targetMetrics.rpm || ''}
                  onChange={(e) => updateTargetMetric('rpm', parseInt(e.target.value))}
                  placeholder="RPM"
                  min={40}
                  max={140}
                />
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('physicalTrainer:conditioning.intervalForm.notes')}
          </Label>
          <Textarea
            value={formData.notes || ''}
            onChange={(e) => updateFormData('notes', e.target.value)}
            placeholder={t('physicalTrainer:conditioning.intervalForm.notesPlaceholder')}
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            {t('common:save')}
          </Button>
          <Button onClick={onCancel} variant="outline" className="flex-1">
            <X className="h-4 w-4 mr-2" />
            {t('common:cancel')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}