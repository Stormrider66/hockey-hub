'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronUp, 
  Repeat, 
  Timer,
  Copy,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { IntervalSetConfig } from '../../types/conditioning.types';

interface SetConfigurationFormProps {
  config?: IntervalSetConfig;
  onApply: (config: IntervalSetConfig) => void;
  onClear: () => void;
  intervalDuration: number; // Duration of the base interval in seconds
}

export default function SetConfigurationForm({
  config,
  onApply,
  onClear,
  intervalDuration
}: SetConfigurationFormProps) {
  const { t } = useTranslation(['physicalTrainer']);
  const [isOpen, setIsOpen] = useState(!!config);
  
  const [formData, setFormData] = useState<IntervalSetConfig>({
    numberOfSets: config?.numberOfSets || 3,
    intervalsPerSet: config?.intervalsPerSet || 5,
    restBetweenSets: config?.restBetweenSets || 120,
    restBetweenIntervals: config?.restBetweenIntervals || 30
  });

  const updateField = (field: keyof IntervalSetConfig, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApply = () => {
    onApply(formData);
    // Close the form after applying to show the summary
    setIsOpen(false);
  };

  const handleClear = () => {
    onClear();
    setIsOpen(false);
  };

  // Calculate total workout time
  const calculateTotalTime = () => {
    const totalIntervals = formData.numberOfSets * formData.intervalsPerSet;
    const totalIntervalTime = totalIntervals * intervalDuration;
    const totalRestBetweenIntervals = (formData.intervalsPerSet - 1) * formData.numberOfSets * formData.restBetweenIntervals;
    const totalRestBetweenSets = (formData.numberOfSets - 1) * formData.restBetweenSets;
    
    return totalIntervalTime + totalRestBetweenIntervals + totalRestBetweenSets;
  };

  const totalTime = calculateTotalTime();
  const totalIntervals = formData.numberOfSets * formData.intervalsPerSet;

  return (
    <Card className="border-dashed">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Set Configuration
                {config && (
                  <Badge variant="secondary" className="ml-2">
                    {config.numberOfSets} × {config.intervalsPerSet}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {config && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
            {!isOpen && config && (
              <p className="text-sm text-muted-foreground mt-1">
                {config.numberOfSets} sets of {config.intervalsPerSet} intervals • 
                Rest: {config.restBetweenIntervals}s between intervals, {config.restBetweenSets}s between sets
              </p>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Copy className="h-3 w-3" />
                  Number of Sets
                </Label>
                <Input
                  type="number"
                  value={formData.numberOfSets}
                  onChange={(e) => updateField('numberOfSets', Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  max={10}
                />
              </div>
              
              <div>
                <Label className="flex items-center gap-2">
                  <Repeat className="h-3 w-3" />
                  Intervals per Set
                </Label>
                <Input
                  type="number"
                  value={formData.intervalsPerSet}
                  onChange={(e) => updateField('intervalsPerSet', Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  max={20}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Timer className="h-3 w-3" />
                  Rest Between Intervals
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formData.restBetweenIntervals}
                    onChange={(e) => updateField('restBetweenIntervals', Math.max(0, parseInt(e.target.value) || 0))}
                    min={0}
                    max={300}
                  />
                  <div className="flex items-center px-3 bg-muted rounded">
                    sec
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="flex items-center gap-2">
                  <Timer className="h-3 w-3" />
                  Rest Between Sets
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formData.restBetweenSets}
                    onChange={(e) => updateField('restBetweenSets', Math.max(0, parseInt(e.target.value) || 0))}
                    min={0}
                    max={600}
                  />
                  <div className="flex items-center px-3 bg-muted rounded">
                    sec
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Intervals:</span>
                <span className="font-medium">{totalIntervals}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Time:</span>
                <span className="font-medium">
                  {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {formData.numberOfSets} sets × {formData.intervalsPerSet} intervals × {Math.floor(intervalDuration / 60)}:{(intervalDuration % 60).toString().padStart(2, '0')} each
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleApply} className="flex-1">
                Apply Set Configuration
              </Button>
              {config && (
                <Button onClick={handleClear} variant="outline">
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}