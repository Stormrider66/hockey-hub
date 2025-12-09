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
import { 
  Clock, 
  Heart, 
  Zap, 
  Activity, 
  Gauge,
  FileText,
  Save,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { 
  IntervalSet, 
  IntervalType,
  PlayerTestResult,
  TargetMetric
} from '../../types';
import { WorkoutEquipmentType, EQUIPMENT_CONFIGS } from '../../types/conditioning.types';

interface IntervalFormProps {
  interval: IntervalSet;
  equipment: WorkoutEquipmentType;
  onSave: (interval: IntervalSet) => void;
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

export default function IntervalForm({
  interval,
  equipment,
  onSave,
  onCancel,
  playerTests = []
}: IntervalFormProps) {
  const { t } = useTranslation(['physicalTrainer']);
  const equipmentConfig = EQUIPMENT_CONFIGS[equipment];
  
  // Form state
  const [formData, setFormData] = useState<IntervalSet>({
    ...interval,
    equipment
  });
  
  const [targetType, setTargetType] = useState<'absolute' | 'percentage' | 'zone'>('absolute');
  const [reference, setReference] = useState<string>('max');

  // Parse duration to minutes and seconds
  const durationMinutes = Math.floor(formData.duration / 60);
  const durationSeconds = formData.duration % 60;

  // Update form data
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

  const handleDurationChange = (minutes: number, seconds: number) => {
    const totalSeconds = (minutes * 60) + seconds;
    updateFormData('duration', totalSeconds);
  };

  const handleHeartRateTargetChange = (value: number) => {
    const targetMetric: TargetMetric = {
      type: targetType,
      value,
      reference: targetType === 'percentage' ? (reference as any) : undefined
    };
    updateTargetMetric('heartRate', targetMetric);
  };

  const handleWattsTargetChange = (value: number) => {
    const targetMetric: TargetMetric = {
      type: targetType,
      value,
      reference: targetType === 'percentage' ? (reference as any) : undefined
    };
    updateTargetMetric('watts', targetMetric);
  };

  const handlePaceTargetChange = (value: string) => {
    // Parse pace input (e.g., "2:05" for rowing pace)
    const parts = value.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]);
      const seconds = parseInt(parts[1]);
      const totalSeconds = (minutes * 60) + seconds;
      
      const targetMetric: TargetMetric = {
        type: 'absolute',
        value: totalSeconds
      };
      updateTargetMetric('pace', targetMetric);
    }
  };

  const handleSave = () => {
    onSave(formData);
  };

  const selectedType = INTERVAL_TYPES.find(t => t.value === formData.type);

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

        {/* Duration */}
        <div>
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('physicalTrainer:conditioning.intervalForm.duration')}
          </Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="number"
                value={durationMinutes}
                onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0, durationSeconds)}
                min={0}
                max={60}
              />
              <span className="text-xs text-muted-foreground">minutes</span>
            </div>
            <div className="flex-1">
              <Input
                type="number"
                value={durationSeconds}
                onChange={(e) => handleDurationChange(durationMinutes, parseInt(e.target.value) || 0)}
                min={0}
                max={59}
              />
              <span className="text-xs text-muted-foreground">seconds</span>
            </div>
          </div>
        </div>

        {/* Target Type Selection */}
        <div>
          <Label>{t('physicalTrainer:conditioning.intervalForm.targetType')}</Label>
          <RadioGroup value={targetType} onValueChange={(v) => setTargetType(v as any)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="absolute" id="absolute" />
              <label htmlFor="absolute" className="text-sm">Absolute Values</label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="percentage" id="percentage" />
              <label htmlFor="percentage" className="text-sm">Percentage of Test</label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="zone" id="zone" />
              <label htmlFor="zone" className="text-sm">Training Zone</label>
            </div>
          </RadioGroup>
        </div>

        {/* Reference Selection (for percentage) */}
        {targetType === 'percentage' && (
          <div>
            <Label>{t('physicalTrainer:conditioning.intervalForm.reference')}</Label>
            <Select value={reference} onValueChange={setReference}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="max">Max HR/Power</SelectItem>
                <SelectItem value="threshold">Lactate Threshold</SelectItem>
                <SelectItem value="ftp">FTP (Functional Threshold Power)</SelectItem>
                <SelectItem value="test">Specific Test Result</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Heart Rate Target */}
        <div>
          <Label className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            {t('physicalTrainer:conditioning.intervalForm.heartRate')}
          </Label>
          {targetType === 'zone' ? (
            <Select
              value={formData.targetMetrics.heartRate?.value?.toString() || ''}
              onValueChange={(v) => handleHeartRateTargetChange(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Zone 1 (50-60%)</SelectItem>
                <SelectItem value="2">Zone 2 (60-70%)</SelectItem>
                <SelectItem value="3">Zone 3 (70-80%)</SelectItem>
                <SelectItem value="4">Zone 4 (80-90%)</SelectItem>
                <SelectItem value="5">Zone 5 (90-100%)</SelectItem>
              </SelectContent>
            </Select>
          ) : targetType === 'percentage' ? (
            <div>
              <Slider
                value={[formData.targetMetrics.heartRate?.value || 70]}
                onValueChange={(values) => handleHeartRateTargetChange(values[0])}
                min={50}
                max={100}
                step={5}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>50%</span>
                <span>{formData.targetMetrics.heartRate?.value || 70}%</span>
                <span>100%</span>
              </div>
            </div>
          ) : (
            <Input
              type="number"
              value={formData.targetMetrics.heartRate?.value || ''}
              onChange={(e) => handleHeartRateTargetChange(parseInt(e.target.value))}
              placeholder="BPM"
              min={60}
              max={220}
            />
          )}
        </div>

        {/* Equipment-specific targets */}
        {(equipment === WorkoutEquipmentType.BIKE_ERG || 
          equipment === WorkoutEquipmentType.WATTBIKE ||
          equipment === WorkoutEquipmentType.AIRBIKE) && (
          <>
            {/* Watts Target */}
            <div>
              <Label className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                {t('physicalTrainer:conditioning.intervalForm.watts')}
              </Label>
              {targetType === 'percentage' ? (
                <div>
                  <Slider
                    value={[formData.targetMetrics.watts?.value || 70]}
                    onValueChange={(values) => handleWattsTargetChange(values[0])}
                    min={50}
                    max={120}
                    step={5}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>50%</span>
                    <span>{formData.targetMetrics.watts?.value || 70}%</span>
                    <span>120%</span>
                  </div>
                </div>
              ) : (
                <Input
                  type="number"
                  value={formData.targetMetrics.watts?.value || ''}
                  onChange={(e) => handleWattsTargetChange(parseInt(e.target.value))}
                  placeholder="Watts"
                  min={0}
                  max={1000}
                />
              )}
            </div>

            {/* RPM Target */}
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
          </>
        )}

        {/* Pace Target (for rowing/running) */}
        {(equipment === WorkoutEquipmentType.ROWING || 
          equipment === WorkoutEquipmentType.SKIERG) && (
          <div>
            <Label className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {t('physicalTrainer:conditioning.intervalForm.pace')} (/500m)
            </Label>
            <Input
              value={formData.targetMetrics.pace?.value || ''}
              onChange={(e) => handlePaceTargetChange(e.target.value)}
              placeholder="2:05"
              pattern="\d{1,2}:\d{2}"
            />
          </div>
        )}

        {/* Calories Target */}
        <div>
          <Label className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            {t('physicalTrainer:conditioning.intervalForm.calories')}
          </Label>
          <Input
            type="number"
            value={formData.targetMetrics.calories || ''}
            onChange={(e) => updateTargetMetric('calories', parseInt(e.target.value))}
            placeholder="Target calories"
            min={0}
          />
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