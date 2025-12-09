'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Users, 
  Copy, 
  Settings, 
  Clock, 
  MapPin, 
  Calendar,
  ChevronDown,
  ChevronUp,
  Plus,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Lightbulb
} from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

import { useBulkSession, type BulkSessionConfig, type SessionConfiguration } from '../../hooks/useBulkSession';
import type { WorkoutEquipmentType } from '../../types/conditioning.types';
import { PlayerTeamAssignment } from './PlayerTeamAssignment';
import { WorkoutTypeSelector } from './WorkoutTypeSelector';
import { SmartAllocationAlgorithms, type AllocationConstraints, type AllocationResult } from '../../services/SmartAllocationAlgorithms';
import { MixedTypeTemplates, type MixedTypeTemplate } from '../../services/MixedTypeTemplates';

interface BulkConfigurationPanelProps<TWorkout = any> {
  workoutType: 'strength' | 'conditioning' | 'hybrid' | 'agility' | 'mixed';
  baseWorkout?: TWorkout;
  onComplete?: (config: BulkSessionConfig<TWorkout>) => Promise<void>;
  onCancel?: () => void;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  className?: string;
  enablePlayerDistribution?: boolean;
  showAdvancedOptions?: boolean;
  maxSessions?: number;
  minSessions?: number;
  enableMixedTypes?: boolean;
  enableSmartAllocation?: boolean;
  defaultMixedSequence?: ('strength' | 'conditioning' | 'hybrid' | 'agility')[];
}

export const BulkConfigurationPanel = <TWorkout = any>({
  workoutType,
  baseWorkout,
  onComplete,
  onCancel,
  isOpen = true,
  onToggle,
  className,
  enablePlayerDistribution = true,
  showAdvancedOptions = true,
  maxSessions = 8,
  minSessions = 2,
  enableMixedTypes = false,
  enableSmartAllocation = true
}: BulkConfigurationPanelProps<TWorkout>) => {
  const { t } = useTranslation(['physicalTrainer']);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [smartAllocation, setSmartAllocation] = useState<AllocationResult | null>(null);
  const [showAllocationResults, setShowAllocationResults] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<MixedTypeTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MixedTypeTemplate | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(workoutType === 'mixed');

  const {
    config,
    equipmentAvailability,
    facilities,
    validation,
    isLoading,
    updateConfig,
    updateSession,
    duplicateSession,
    removeSession,
    distributePlayersEvenly,
    applySmartAllocation,
    updateSessionWorkoutType,
    optimizeSessionOrder,
    complete,
    canProceed,
    totalParticipants,
    equipmentConflicts
  } = useBulkSession({
    workoutType,
    baseWorkout,
    onComplete,
    enableMixedTypes: enableMixedTypes || workoutType === 'mixed',
    initialConfig: {
      numberOfSessions: Math.max(minSessions, 2),
      enableMixedTypes: enableMixedTypes || workoutType === 'mixed'
    }
  });

  const handleComplete = async () => {
    try {
      await complete();
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleSmartAllocation = () => {
    if (!selectedFacility || !config.sessions.length) {
      return;
    }

    const constraints: AllocationConstraints = {
      facilityCapacity: selectedFacility.capacity,
      equipmentAvailability,
      transitionTimeMinutes: config.staggerInterval,
      maxConcurrentSessions: Math.min(4, selectedFacility.capacity / 10),
      prioritizeGrouping: true,
      minimizeTransitions: true
    };

    const result = SmartAllocationAlgorithms.allocateOptimalSessions(
      config.sessions,
      constraints,
      selectedFacility
    );

    setSmartAllocation(result);
    setShowAllocationResults(true);

    // Apply smart allocation results
    applySmartAllocation(result);
  };

  // Load templates when component mounts or when mixed types are enabled
  React.useEffect(() => {
    if (workoutType === 'mixed' || enableMixedTypes) {
      const templates = MixedTypeTemplates.getRecommendedTemplates({
        availableTime: 180, // 3 hours max
        playerCount: totalParticipants || 12,
        experienceLevel: 'intermediate',
        seasonPhase: 'pre-season'
      });
      setAvailableTemplates(templates);
    }
  }, [workoutType, enableMixedTypes, totalParticipants]);

  // Apply selected template
  const handleApplyTemplate = (template: MixedTypeTemplate) => {
    const templateConfig = MixedTypeTemplates.applyTemplate(template, {
      sessionDate: config.sessionDate,
      sessionTime: config.sessionTime,
      facilityId: config.facilityId
    });

    // Update the bulk session configuration
    updateConfig({
      ...templateConfig,
      numberOfSessions: template.workoutTypes.length
    });

    setSelectedTemplate(template);
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 22 && minute > 0) break;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          value: timeString,
          label: timeString
        });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const sessionCountOptions = Array.from({ length: maxSessions - minSessions + 1 }, (_, i) => i + minSessions);
  const selectedFacility = facilities.find(f => f.id === config.facilityId);
  const hasErrors = Object.values(validation.errors).some(errors => errors.length > 0);

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Card className={cn(
          'cursor-pointer transition-all hover:border-primary/50',
          hasErrors && 'border-red-200 bg-red-50/30',
          isOpen && 'border-primary/30',
          className
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Copy className="h-5 w-5" />
                Bulk Session Configuration
                {config.numberOfSessions > 1 && (
                  <Badge variant="secondary" className="ml-2">
                    {config.numberOfSessions} sessions
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasErrors && <AlertCircle className="h-4 w-4 text-red-500" />}
                {canProceed && !hasErrors && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </CardTitle>
            {!isOpen && config.numberOfSessions > 1 && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{config.sessionDate}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{config.sessionTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{totalParticipants} participants</span>
                </div>
                {selectedFacility && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{selectedFacility.name}</span>
                  </div>
                )}
              </div>
            )}
          </CardHeader>
        </Card>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <Card className="mt-2 border-t-0 rounded-t-none">
          <CardContent className="pt-6 space-y-6">
            {/* Error Display */}
            {hasErrors && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-700 font-medium">Configuration Issues</span>
                </div>
                <ul className="space-y-1 text-sm text-red-600">
                  {Object.entries(validation.errors).flatMap(([step, errors]) => 
                    errors.map((error, index) => (
                      <li key={`${step}-${index}`} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{error}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}

            {/* Basic Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Basic Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {enableSmartAllocation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Smart Allocation</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSmartAllocation}
                        disabled={!selectedFacility || config.sessions.length === 0}
                      >
                        Optimize Sessions
                      </Button>
                    </div>
                    <p className="text-sm text-blue-700">
                      Let AI optimize session timing, equipment allocation, and facility usage
                    </p>
                    {smartAllocation && (
                      <div className="mt-3 p-2 bg-white rounded border">
                        <div className="text-xs text-blue-600 space-y-1">
                          <div>Equipment Utilization: {Math.round(smartAllocation.facilityUtilization)}%</div>
                          <div>Conflict Score: {smartAllocation.totalConflictScore}</div>
                          {smartAllocation.recommendations.length > 0 && (
                            <div className="font-medium">Recommendations: {smartAllocation.recommendations.length}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Mixed Type Templates */}
                {(workoutType === 'mixed' || enableMixedTypes) && availableTemplates.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Copy className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">Mixed-Type Templates</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                      >
                        {showTemplateSelector ? 'Hide Templates' : 'Show Templates'}
                      </Button>
                    </div>
                    <p className="text-sm text-green-700 mb-3">
                      Pre-designed sequences optimized for different training phases
                    </p>
                    
                    {showTemplateSelector && (
                      <div className="space-y-3">
                        {availableTemplates.map(template => (
                          <div 
                            key={template.id}
                            className={cn(
                              'border rounded p-3 cursor-pointer transition-all hover:border-green-300',
                              selectedTemplate?.id === template.id && 'border-green-400 bg-green-100'
                            )}
                            onClick={() => handleApplyTemplate(template)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="font-medium text-green-800">{template.name}</div>
                                <div className="text-xs text-green-600">
                                  {template.workoutTypes.join(' → ')} • {template.estimatedTotalTime} min
                                </div>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {template.difficulty}
                              </Badge>
                            </div>
                            <div className="text-sm text-green-700">{template.description}</div>
                            <div className="flex items-center gap-2 mt-2 text-xs text-green-600">
                              {template.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {selectedTemplate && (
                      <div className="mt-3 p-2 bg-white rounded border">
                        <div className="text-xs text-green-700">
                          <div className="font-medium">Applied Template: {selectedTemplate.name}</div>
                          <div>Sessions: {selectedTemplate.workoutTypes.length}</div>
                          <div>Total Time: {selectedTemplate.estimatedTotalTime} minutes</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="session-count">Number of Sessions</Label>
                    <Select 
                      value={config.numberOfSessions.toString()} 
                      onValueChange={(value) => updateConfig({ numberOfSessions: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select number of sessions" />
                      </SelectTrigger>
                      <SelectContent>
                        {sessionCountOptions.map(count => (
                          <SelectItem key={count} value={count.toString()}>
                            {count} sessions
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session-date">Date</Label>
                    <Input
                      id="session-date"
                      type="date"
                      value={config.sessionDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => updateConfig({ sessionDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session-time">Start Time</Label>
                    <Select 
                      value={config.sessionTime} 
                      onValueChange={(value) => updateConfig({ sessionTime: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(slot => (
                          <SelectItem key={slot.value} value={slot.value}>
                            {slot.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={config.duration}
                      onChange={(e) => updateConfig({ duration: parseInt(e.target.value) || 60 })}
                      min={15}
                      max={180}
                      step={15}
                    />
                  </div>
                </div>

                {/* Facility Selection */}
                <div className="space-y-2">
                  <Label>Facility</Label>
                  {facilities.length === 0 ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading facilities...</p>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {facilities.map(facility => (
                        <div
                          key={facility.id}
                          className={cn(
                            'border rounded-lg p-3 cursor-pointer transition-all hover:border-primary/50',
                            config.facilityId === facility.id && 'border-primary bg-primary/5'
                          )}
                          onClick={() => updateConfig({ facilityId: facility.id })}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{facility.name}</span>
                                <Badge 
                                  variant={facility.availability === 'available' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {facility.availability === 'available' ? 'Available' : 'Partially Booked'}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{facility.location}</p>
                            </div>
                            <input
                              type="radio"
                              checked={config.facilityId === facility.id}
                              onChange={() => updateConfig({ facilityId: facility.id })}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Advanced Options */}
            {showAdvancedOptions && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Advanced Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Stagger Start Times</Label>
                      <p className="text-xs text-muted-foreground">
                        Start sessions at different times to reduce congestion
                      </p>
                    </div>
                    <Switch
                      checked={config.staggerStartTimes}
                      onCheckedChange={(checked) => updateConfig({ staggerStartTimes: checked })}
                    />
                  </div>

                  {config.staggerStartTimes && (
                    <div className="ml-4 space-y-2">
                      <Label>Stagger Interval (minutes)</Label>
                      <Select 
                        value={config.staggerInterval.toString()} 
                        onValueChange={(value) => updateConfig({ staggerInterval: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 minutes</SelectItem>
                          <SelectItem value="10">10 minutes</SelectItem>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="20">20 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(workoutType === 'conditioning' || workoutType === 'hybrid') && (
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Allow Equipment Conflicts</Label>
                        <p className="text-xs text-muted-foreground">
                          Allow multiple sessions to use the same equipment simultaneously
                        </p>
                      </div>
                      <Switch
                        checked={config.allowEquipmentConflicts}
                        onCheckedChange={(checked) => updateConfig({ allowEquipmentConflicts: checked })}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Session Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Session Setup</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSessionDetails(!showSessionDetails)}
                  >
                    {showSessionDetails ? 'Hide Details' : 'Show Details'}
                    {showSessionDetails ? 
                      <ChevronUp className="ml-2 h-3 w-3" /> : 
                      <ChevronDown className="ml-2 h-3 w-3" />
                    }
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showSessionDetails ? (
                  <div className="space-y-4">
                    {config.sessions.map((session, index) => (
                      <Card key={session.id} className="border-muted">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center justify-between">
                            <span>Session {index + 1}</span>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => duplicateSession(session.id)}
                                disabled={config.sessions.length >= maxSessions}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              {config.sessions.length > minSessions && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeSession(session.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Session Name</Label>
                              <Input
                                value={session.name}
                                onChange={(e) => updateSession(session.id, { name: e.target.value })}
                                placeholder="Enter session name"
                              />
                            </div>
                            
                            {(enableMixedTypes || workoutType === 'mixed') && (
                              <div>
                                <Label>Workout Type</Label>
                                <WorkoutTypeSelector
                                  selectedType={session.workoutType || 'strength'}
                                  onTypeChange={(type) => updateSessionWorkoutType(session.id, type)}
                                  showRecentlyUsed={false}
                                  className="w-full"
                                />
                              </div>
                            )}
                          </div>

                          {enablePlayerDistribution && (
                            <div>
                              <Label>Players</Label>
                              <PlayerTeamAssignment
                                selectedPlayers={session.playerIds}
                                selectedTeams={session.teamIds}
                                onPlayersChange={(playerIds) => updateSession(session.id, { playerIds })}
                                onTeamsChange={(teamIds) => updateSession(session.id, { teamIds })}
                                showTeams={true}
                                showMedical={true}
                              />
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(config.staggerStartTimes || workoutType === 'mixed') && (
                              <div>
                                <Label>Start Time</Label>
                                <Input
                                  type="time"
                                  value={session.startTime || config.sessionTime}
                                  onChange={(e) => updateSession(session.id, { startTime: e.target.value })}
                                />
                              </div>
                            )}
                            
                            <div>
                              <Label>Duration (min)</Label>
                              <Input
                                type="number"
                                value={session.duration || config.duration}
                                onChange={(e) => updateSession(session.id, { duration: parseInt(e.target.value) || 60 })}
                                min={15}
                                max={180}
                                step={15}
                              />
                            </div>
                            
                            {(enableMixedTypes || workoutType === 'mixed') && index < config.sessions.length - 1 && (
                              <div>
                                <Label>Transition Time (min)</Label>
                                <Input
                                  type="number"
                                  value={session.transitionTime || 10}
                                  onChange={(e) => updateSession(session.id, { transitionTime: parseInt(e.target.value) || 10 })}
                                  min={0}
                                  max={60}
                                  step={5}
                                />
                              </div>
                            )}
                          </div>

                          <div>
                            <Label>Notes (Optional)</Label>
                            <Input
                              value={session.notes || ''}
                              onChange={(e) => updateSession(session.id, { notes: e.target.value })}
                              placeholder="Add notes for this session"
                            />
                          </div>
                          
                          {/* Equipment Selection for conditioning/hybrid sessions */}
                          {((session.workoutType === 'conditioning' || session.workoutType === 'hybrid') || 
                            ((workoutType === 'conditioning' || workoutType === 'hybrid') && !session.workoutType)) && (
                            <div>
                              <Label>Equipment</Label>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {['bike_erg', 'rowing', 'treadmill', 'airbike', 'wattbike', 'skierg', 'rope_jump'].map(equipment => (
                                  <div key={equipment} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`${session.id}-${equipment}`}
                                      checked={session.equipment?.includes(equipment as WorkoutEquipmentType) || false}
                                      onChange={(e) => {
                                        const currentEquipment = session.equipment || [];
                                        const newEquipment = e.target.checked
                                          ? [...currentEquipment, equipment as WorkoutEquipmentType]
                                          : currentEquipment.filter(eq => eq !== equipment);
                                        updateSession(session.id, { equipment: newEquipment });
                                      }}
                                    />
                                    <label htmlFor={`${session.id}-${equipment}`} className="text-sm">
                                      {equipment.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Total Participants:</span>
                        <Badge variant="secondary">{totalParticipants}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">{config.duration} min</span>
                      </div>
                      {selectedFacility && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Facility:</span>
                          <span className="font-medium">{selectedFacility.name}</span>
                        </div>
                      )}
                    </div>

                    {equipmentConflicts.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <span className="text-yellow-700 text-sm font-medium">Equipment Conflicts</span>
                        </div>
                        <ul className="text-xs text-yellow-600 space-y-1">
                          {equipmentConflicts.map((conflict, index) => (
                            <li key={index}>• {conflict}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4">
              {onCancel && (
                <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                  Cancel
                </Button>
              )}
              
              <div className="flex items-center gap-2 ml-auto">
                {(enableMixedTypes || workoutType === 'mixed') && (
                  <Button
                    variant="outline"
                    onClick={optimizeSessionOrder}
                    disabled={isLoading || config.sessions.length < 2}
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Optimize Order
                  </Button>
                )}
                
                {enablePlayerDistribution && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Mock player distribution
                      const mockPlayerIds = ['player-1', 'player-2', 'player-3', 'player-4', 'player-5', 'player-6'];
                      distributePlayersEvenly(mockPlayerIds);
                    }}
                    disabled={isLoading}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Auto-Distribute Players
                  </Button>
                )}
                
                <Button
                  onClick={handleComplete}
                  disabled={!canProceed || isLoading}
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create {config.numberOfSessions} Sessions
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default BulkConfigurationPanel;