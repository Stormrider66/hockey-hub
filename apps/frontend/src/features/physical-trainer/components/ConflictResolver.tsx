'use client';

import React, { useState } from 'react';
import { useTranslation } from '@hockey-hub/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  Calendar,
  Clock,
  Users,
  X,
  Check,
  ChevronRight,
  CalendarX,
  Shuffle,
  Merge
} from 'lucide-react';
import { format } from 'date-fns';

interface Conflict {
  id: string;
  type: 'scheduling' | 'resource' | 'capacity' | 'medical';
  severity: 'high' | 'medium' | 'low';
  date: Date;
  time: string;
  playerIds: string[];
  existingEvent?: {
    id: string;
    title: string;
    type: string;
    duration: number;
  };
  resource?: {
    name: string;
    available: number;
    required: number;
  };
  description: string;
  resolutionOptions: ResolutionOption[];
}

interface ResolutionOption {
  id: string;
  type: 'skip' | 'reschedule' | 'merge' | 'override' | 'split';
  label: string;
  description: string;
  impact?: string;
}

interface ConflictResolverProps {
  conflicts: Conflict[];
  onResolve: (resolvedConflicts: Conflict[]) => void;
}

export default function ConflictResolver({
  conflicts,
  onResolve
}: ConflictResolverProps) {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [resolutions, setResolutions] = useState<Record<string, string>>({});
  const [selectedConflicts, setSelectedConflicts] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');

  // Group conflicts by type
  const groupedConflicts = React.useMemo(() => {
    const groups: Record<string, Conflict[]> = {
      scheduling: [],
      resource: [],
      capacity: [],
      medical: []
    };

    conflicts.forEach(conflict => {
      groups[conflict.type].push(conflict);
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [conflicts]);

  // Handle individual resolution
  const handleResolution = (conflictId: string, optionId: string) => {
    setResolutions(prev => ({
      ...prev,
      [conflictId]: optionId
    }));
  };

  // Handle bulk resolution
  const handleBulkResolve = () => {
    if (!bulkAction || selectedConflicts.length === 0) return;

    const newResolutions = { ...resolutions };
    selectedConflicts.forEach(conflictId => {
      newResolutions[conflictId] = bulkAction;
    });
    setResolutions(newResolutions);
    setSelectedConflicts([]);
    setBulkAction('');
  };

  // Toggle conflict selection
  const toggleConflictSelection = (conflictId: string) => {
    setSelectedConflicts(prev =>
      prev.includes(conflictId)
        ? prev.filter(id => id !== conflictId)
        : [...prev, conflictId]
    );
  };

  // Select all conflicts of a type
  const selectAllOfType = (type: string) => {
    const typeConflicts = conflicts.filter(c => c.type === type);
    const allSelected = typeConflicts.every(c => selectedConflicts.includes(c.id));
    
    if (allSelected) {
      setSelectedConflicts(prev => 
        prev.filter(id => !typeConflicts.find(c => c.id === id))
      );
    } else {
      setSelectedConflicts(prev => [
        ...prev,
        ...typeConflicts.map(c => c.id).filter(id => !prev.includes(id))
      ]);
    }
  };

  // Apply resolutions
  const applyResolutions = () => {
    const resolvedConflicts = conflicts.map(conflict => ({
      ...conflict,
      resolution: resolutions[conflict.id]
    }));
    onResolve(resolvedConflicts);
  };

  // Get icon for conflict type
  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'scheduling':
        return <Calendar className="h-4 w-4" />;
      case 'resource':
        return <Users className="h-4 w-4" />;
      case 'capacity':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medical':
        return <X className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Get color for severity
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Get icon for resolution type
  const getResolutionIcon = (type: string) => {
    switch (type) {
      case 'skip':
        return <CalendarX className="h-3 w-3" />;
      case 'reschedule':
        return <Calendar className="h-3 w-3" />;
      case 'merge':
        return <Merge className="h-3 w-3" />;
      case 'override':
        return <Check className="h-3 w-3" />;
      case 'split':
        return <Shuffle className="h-3 w-3" />;
      default:
        return <ChevronRight className="h-3 w-3" />;
    }
  };

  // Check if all conflicts are resolved
  const allResolved = conflicts.every(conflict => resolutions[conflict.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              {t('physicalTrainer:conflicts.title', { count: conflicts.length })}
            </CardTitle>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {Object.keys(resolutions).length} / {conflicts.length} {t('physicalTrainer:conflicts.resolved')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('physicalTrainer:conflicts.description')}
            </AlertDescription>
          </Alert>

          {/* Bulk Actions */}
          {selectedConflicts.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">
                  {t('physicalTrainer:conflicts.bulkAction', { count: selectedConflicts.length })}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedConflicts([])}
                >
                  {t('common:actions.clearSelection')}
                </Button>
              </div>
              <div className="flex gap-2">
                <Select
                  value={bulkAction}
                  onValueChange={setBulkAction}
                  placeholder={t('physicalTrainer:conflicts.selectAction')}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">{t('physicalTrainer:conflicts.skipAll')}</SelectItem>
                    <SelectItem value="reschedule">{t('physicalTrainer:conflicts.rescheduleAll')}</SelectItem>
                    <SelectItem value="override">{t('physicalTrainer:conflicts.overrideAll')}</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleBulkResolve} disabled={!bulkAction}>
                  {t('common:actions.apply')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conflicts by Type */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {groupedConflicts.map(([type, typeConflicts]) => (
            <Card key={type}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getConflictIcon(type)}
                    <h3 className="font-medium capitalize">
                      {t(`physicalTrainer:conflicts.types.${type}`)}
                    </h3>
                    <Badge variant="secondary">
                      {typeConflicts.length}
                    </Badge>
                  </div>
                  <Checkbox
                    checked={typeConflicts.every(c => selectedConflicts.includes(c.id))}
                    onCheckedChange={() => selectAllOfType(type)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {typeConflicts.map(conflict => (
                  <Card key={conflict.id} className="border-l-4" style={{
                    borderLeftColor: getSeverityColor(conflict.severity) === 'destructive' ? 'rgb(239 68 68)' :
                                     getSeverityColor(conflict.severity) === 'warning' ? 'rgb(245 158 11)' :
                                     'rgb(156 163 175)'
                  }}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedConflicts.includes(conflict.id)}
                            onCheckedChange={() => toggleConflictSelection(conflict.id)}
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={getSeverityColor(conflict.severity)} className="text-xs">
                                {conflict.severity}
                              </Badge>
                              <span className="text-sm font-medium">
                                {format(conflict.date, 'MMM dd, yyyy')} at {conflict.time}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {conflict.description}
                            </p>
                            
                            {conflict.existingEvent && (
                              <div className="mt-2 p-2 bg-muted rounded text-sm">
                                <span className="font-medium">{t('physicalTrainer:conflicts.existingEvent')}:</span> {conflict.existingEvent.title}
                                <span className="text-muted-foreground ml-2">
                                  ({conflict.existingEvent.duration} min)
                                </span>
                              </div>
                            )}
                            
                            {conflict.resource && (
                              <div className="mt-2 p-2 bg-muted rounded text-sm">
                                <span className="font-medium">{conflict.resource.name}:</span>
                                <span className="text-muted-foreground ml-2">
                                  {conflict.resource.available}/{conflict.resource.required} available
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {conflict.playerIds.length} players
                          </Badge>
                        </div>
                      </div>

                      {/* Resolution Options */}
                      <div className="ml-9">
                        <Label className="text-sm font-medium mb-2 block">
                          {t('physicalTrainer:conflicts.resolution')}:
                        </Label>
                        <RadioGroup
                          value={resolutions[conflict.id] || ''}
                          onValueChange={(value) => handleResolution(conflict.id, value)}
                        >
                          <div className="space-y-2">
                            {conflict.resolutionOptions.map(option => (
                              <div key={option.id} className="flex items-start space-x-2">
                                <RadioGroupItem value={option.id} id={`${conflict.id}-${option.id}`} />
                                <Label 
                                  htmlFor={`${conflict.id}-${option.id}`}
                                  className="cursor-pointer flex-1"
                                >
                                  <div className="flex items-start gap-2">
                                    {getResolutionIcon(option.type)}
                                    <div>
                                      <p className="font-medium text-sm">{option.label}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {option.description}
                                      </p>
                                      {option.impact && (
                                        <p className="text-xs text-warning mt-1">
                                          {option.impact}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </Label>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          {allResolved ? (
            <span className="flex items-center gap-2 text-green-600">
              <Check className="h-4 w-4" />
              {t('physicalTrainer:conflicts.allResolved')}
            </span>
          ) : (
            <span>
              {t('physicalTrainer:conflicts.unresolvedRemaining', {
                count: conflicts.length - Object.keys(resolutions).length
              })}
            </span>
          )}
        </div>
        
        <Button 
          onClick={applyResolutions}
          disabled={!allResolved}
        >
          {t('physicalTrainer:conflicts.applyResolutions')}
        </Button>
      </div>
    </div>
  );
}

// Import missing Select component
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';