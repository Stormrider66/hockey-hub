'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from '@/components/icons';
import type { IntervalSet } from '../types/conditioning.types';
import { EQUIPMENT_CONFIGS, WorkoutEquipmentType } from '../types/conditioning.types';

interface IntervalBlockEditorProps {
  intervals: IntervalSet[];
  defaultEquipment: WorkoutEquipmentType;
  onAddInterval: () => void;
  onUpdateInterval: (intervalId: string, updates: Partial<IntervalSet>) => void;
  onRemoveInterval: (intervalId: string) => void;
  onUpdateTargetMetric: (intervalId: string, metric: string, value: any) => void;
}

export default function IntervalBlockEditor({
  intervals,
  defaultEquipment,
  onAddInterval,
  onUpdateInterval,
  onRemoveInterval,
  onUpdateTargetMetric
}: IntervalBlockEditorProps) {
  
  const getEquipmentMetrics = (equipment: WorkoutEquipmentType) => {
    const config = EQUIPMENT_CONFIGS[equipment];
    const metrics = [config.metrics.primary];
    if (config.metrics.secondary) {
      metrics.push(...config.metrics.secondary);
    }
    return metrics;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Intervals</Label>
        <Button size="sm" onClick={onAddInterval}>
          <Plus className="h-3 w-3 mr-1" />
          Add Interval
        </Button>
      </div>
      
      <div className="space-y-3">
        {intervals.map((interval, index) => {
          const currentTarget = interval.targetMetrics;
          
          return (
            <div key={interval.id} className="p-3 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-sm">Interval {index + 1}</h5>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveInterval(interval.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Basic Configuration */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={interval.type}
                    onValueChange={(value) => onUpdateInterval(interval.id, { type: value as any })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warmup">Warmup</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="rest">Rest</SelectItem>
                      <SelectItem value="active_recovery">Active Recovery</SelectItem>
                      <SelectItem value="cooldown">Cooldown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs">Equipment</Label>
                  <Select
                    value={interval.equipment}
                    onValueChange={(value) => onUpdateInterval(interval.id, { equipment: value as WorkoutEquipmentType })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EQUIPMENT_CONFIGS).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.icon} {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs">Duration</Label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      value={Math.floor(interval.duration / 60)}
                      onChange={(e) => {
                        const mins = parseInt(e.target.value) || 0;
                        const secs = interval.duration % 60;
                        onUpdateInterval(interval.id, { duration: mins * 60 + secs });
                      }}
                      min={0}
                      placeholder="min"
                      className="h-8 w-12 text-xs"
                    />
                    <span className="self-center text-xs">:</span>
                    <Input
                      type="number"
                      value={interval.duration % 60}
                      onChange={(e) => {
                        const secs = parseInt(e.target.value) || 0;
                        const mins = Math.floor(interval.duration / 60);
                        onUpdateInterval(interval.id, { duration: mins * 60 + secs });
                      }}
                      min={0}
                      max={59}
                      placeholder="sec"
                      className="h-8 w-12 text-xs"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-xs">Name</Label>
                <Input
                  value={interval.name || ''}
                  onChange={(e) => onUpdateInterval(interval.id, { name: e.target.value })}
                  placeholder="e.g., Sprint"
                  className="h-8 text-sm"
                />
              </div>
              
              {/* Target Metrics */}
              {interval.type !== 'rest' && (
                <div className="p-2 bg-gray-50 rounded space-y-2">
                  <Label className="text-xs font-medium">Target Metrics</Label>
                  <div className="space-y-2">
                    {getEquipmentMetrics(interval.equipment).map((metric) => {
                      const currentValue = currentTarget[metric as keyof typeof currentTarget];
                      const isPercentage = typeof currentValue === 'object' && currentValue?.type === 'percentage';
                      
                      return (
                        <div key={metric} className="flex items-center gap-2">
                          <Label className="text-xs capitalize w-16">{metric}:</Label>
                          
                          {(metric === 'heartRate' || metric === 'watts') && (
                            <div className="flex gap-1 flex-1">
                              <Input
                                type="number"
                                value={typeof currentValue === 'object' ? currentValue.value : ''}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (!isNaN(value)) {
                                    onUpdateTargetMetric(interval.id, metric, {
                                      type: isPercentage ? 'percentage' : 'absolute',
                                      value,
                                      reference: isPercentage ? (currentValue?.reference || 'max') : undefined
                                    });
                                  }
                                }}
                                placeholder={isPercentage ? '%' : 'value'}
                                className="h-8 w-16 text-xs"
                              />
                              <Select
                                value={isPercentage ? 'percentage' : 'absolute'}
                                onValueChange={(value) => {
                                  if (value === 'percentage') {
                                    onUpdateTargetMetric(interval.id, metric, {
                                      type: 'percentage',
                                      value: 75,
                                      reference: 'max'
                                    });
                                  } else {
                                    onUpdateTargetMetric(interval.id, metric, {
                                      type: 'absolute',
                                      value: metric === 'heartRate' ? 140 : 200
                                    });
                                  }
                                }}
                              >
                                <SelectTrigger className="h-8 flex-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="absolute">Absolute</SelectItem>
                                  <SelectItem value="percentage">% Based</SelectItem>
                                </SelectContent>
                              </Select>
                              {isPercentage && (
                                <Select
                                  value={currentValue?.reference || 'max'}
                                  onValueChange={(value) => {
                                    onUpdateTargetMetric(interval.id, metric, {
                                      ...currentValue,
                                      reference: value as any
                                    });
                                  }}
                                >
                                  <SelectTrigger className="h-8 w-20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="max">Max</SelectItem>
                                    <SelectItem value="threshold">LT</SelectItem>
                                    <SelectItem value="ftp">FTP</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          )}
                          
                          {metric === 'calories' && (
                            <Input
                              type="number"
                              value={typeof currentValue === 'number' ? currentValue : ''}
                              onChange={(e) => onUpdateTargetMetric(interval.id, metric, parseInt(e.target.value))}
                              placeholder="cals"
                              className="h-8 flex-1 text-xs"
                            />
                          )}
                          
                          {metric === 'distance' && (
                            <div className="flex gap-1 flex-1">
                              <Input
                                type="number"
                                placeholder="distance"
                                className="h-8 flex-1 text-xs"
                                onChange={(e) => onUpdateTargetMetric(interval.id, metric, {
                                  type: 'absolute',
                                  value: parseFloat(e.target.value) || 0
                                })}
                              />
                              <span className="text-xs self-center">
                                {EQUIPMENT_CONFIGS[interval.equipment].units.distance || 'm'}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}