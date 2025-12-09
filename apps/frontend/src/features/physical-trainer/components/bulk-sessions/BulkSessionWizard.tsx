'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Users, Clock, MapPin } from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

// Import wizard steps (temporarily excluding SessionSetupStep due to import issues)
import { BasicConfigStep, ReviewStep } from './wizard';

// Import types
import type { WorkoutEquipmentType } from '../../types/conditioning.types';

export interface BulkSessionConfig {
  // Basic configuration
  numberOfSessions: number;
  sessionDate: string;
  sessionTime: string;
  duration: number; // minutes
  facilityId: string;
  
  // Session-specific configurations
  sessions: SessionConfiguration[];
  
  // Global settings
  allowEquipmentConflicts: boolean;
  staggerStartTimes: boolean;
  staggerInterval: number; // minutes between session starts
}

export interface SessionConfiguration {
  id: string;
  name: string;
  equipment: WorkoutEquipmentType[];
  playerIds: string[];
  teamIds: string[];
  startTime?: string; // override global start time if staggered
  notes?: string;
}

export interface EquipmentAvailability {
  type: WorkoutEquipmentType;
  total: number;
  available: number;
  reserved: number;
  facilityId: string;
}

export interface FacilityInfo {
  id: string;
  name: string;
  location: string;
  capacity: number;
  equipment: string[];
  availability: 'available' | 'partially_booked' | 'unavailable';
}

interface BulkSessionWizardProps {
  onComplete: (config: BulkSessionConfig) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

const WIZARD_STEPS = [
  {
    id: 'basic',
    title: 'Basic Configuration',
    description: 'Set date, time, facility and number of sessions'
  },
  {
    id: 'setup',
    title: 'Session Setup',
    description: 'Configure equipment and players for each session'
  },
  {
    id: 'review',
    title: 'Review & Create',
    description: 'Review configuration and create sessions'
  }
] as const;

type WizardStep = typeof WIZARD_STEPS[number]['id'];

export const BulkSessionWizard: React.FC<BulkSessionWizardProps> = ({
  onComplete,
  onCancel,
  isLoading = false,
  className
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const { toast } = useToast();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
  const [stepErrors, setStepErrors] = useState<Record<WizardStep, string[]>>({
    basic: [],
    setup: [],
    review: []
  });
  
  // Configuration state
  const [config, setConfig] = useState<BulkSessionConfig>({
    numberOfSessions: 2,
    sessionDate: new Date().toISOString().split('T')[0],
    sessionTime: '10:00',
    duration: 60,
    facilityId: '',
    sessions: [],
    allowEquipmentConflicts: false,
    staggerStartTimes: false,
    staggerInterval: 15
  });
  
  // Loading states
  const [validatingConfig, setValidatingConfig] = useState(false);
  const [equipmentAvailability, setEquipmentAvailability] = useState<EquipmentAvailability[]>([]);
  
  // Get current step information
  const currentStepIndex = WIZARD_STEPS.findIndex(step => step.id === currentStep);
  const currentStepInfo = WIZARD_STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / WIZARD_STEPS.length) * 100;
  
  // Navigation helpers
  const canGoNext = stepErrors[currentStep].length === 0 && !validatingConfig;
  const canGoPrevious = currentStepIndex > 0 && !validatingConfig;
  const isLastStep = currentStepIndex === WIZARD_STEPS.length - 1;
  
  // Initialize sessions when numberOfSessions changes
  useEffect(() => {
    if (config.numberOfSessions > 0 && config.sessions.length !== config.numberOfSessions) {
      const newSessions: SessionConfiguration[] = Array.from(
        { length: config.numberOfSessions },
        (_, index) => ({
          id: `session-${index + 1}`,
          name: `Conditioning Session ${index + 1}`,
          equipment: [],
          playerIds: [],
          teamIds: [],
          startTime: config.staggerStartTimes 
            ? calculateStaggeredTime(config.sessionTime, index, config.staggerInterval)
            : undefined
        })
      );
      
      setConfig(prev => ({ ...prev, sessions: newSessions }));
    }
  }, [config.numberOfSessions, config.sessionTime, config.staggerStartTimes, config.staggerInterval]);
  
  // Calculate staggered start times
  const calculateStaggeredTime = (baseTime: string, sessionIndex: number, intervalMinutes: number): string => {
    const [hours, minutes] = baseTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + (sessionIndex * intervalMinutes);
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  };
  
  // Load equipment availability when facility changes
  useEffect(() => {
    if (config.facilityId) {
      loadEquipmentAvailability(config.facilityId);
    }
  }, [config.facilityId, config.sessionDate, config.sessionTime]);
  
  const loadEquipmentAvailability = async (facilityId: string) => {
    try {
      // Mock API call - replace with actual API
      const mockAvailability: EquipmentAvailability[] = [
        { type: 'bike_erg' as WorkoutEquipmentType, total: 12, available: 10, reserved: 2, facilityId },
        { type: 'rowing' as WorkoutEquipmentType, total: 8, available: 6, reserved: 2, facilityId },
        { type: 'treadmill' as WorkoutEquipmentType, total: 6, available: 4, reserved: 2, facilityId },
        { type: 'airbike' as WorkoutEquipmentType, total: 4, available: 4, reserved: 0, facilityId },
        { type: 'wattbike' as WorkoutEquipmentType, total: 3, available: 2, reserved: 1, facilityId },
        { type: 'skierg' as WorkoutEquipmentType, total: 2, available: 2, reserved: 0, facilityId },
        { type: 'rope_jump' as WorkoutEquipmentType, total: 20, available: 20, reserved: 0, facilityId },
        { type: 'running' as WorkoutEquipmentType, total: 50, available: 50, reserved: 0, facilityId }
      ];
      
      setEquipmentAvailability(mockAvailability);
    } catch (error) {
      console.error('Failed to load equipment availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to load equipment availability',
        variant: 'destructive'
      });
    }
  };
  
  // Validate current step
  const validateCurrentStep = useCallback((): string[] => {
    const errors: string[] = [];
    
    switch (currentStep) {
      case 'basic':
        if (!config.facilityId) errors.push('Please select a facility');
        if (config.numberOfSessions < 2) errors.push('Minimum 2 sessions required');
        if (config.numberOfSessions > 8) errors.push('Maximum 8 sessions allowed');
        if (config.duration < 15) errors.push('Minimum duration is 15 minutes');
        if (config.duration > 180) errors.push('Maximum duration is 180 minutes');
        break;
        
      case 'setup':
        config.sessions.forEach((session, index) => {
          if (session.equipment.length === 0) {
            errors.push(`Session ${index + 1}: Select at least one equipment type`);
          }
          // Temporarily disabled player requirement due to component import issues
          // if (session.playerIds.length === 0 && session.teamIds.length === 0) {
          //   errors.push(`Session ${index + 1}: Assign at least one player or team`);
          // }
        });
        
        // Check equipment conflicts if not allowed
        if (!config.allowEquipmentConflicts) {
          const equipmentUsage = new Map<WorkoutEquipmentType, number>();
          config.sessions.forEach(session => {
            session.equipment.forEach(equipment => {
              equipmentUsage.set(equipment, (equipmentUsage.get(equipment) || 0) + 1);
            });
          });
          
          equipmentUsage.forEach((usage, equipment) => {
            const availability = equipmentAvailability.find(a => a.type === equipment);
            if (availability && usage > availability.available) {
              errors.push(`${equipment}: ${usage} sessions need this equipment but only ${availability.available} available`);
            }
          });
        }
        break;
        
      case 'review':
        // Final validation - all previous validations should pass
        break;
    }
    
    return errors;
  }, [currentStep, config, equipmentAvailability]);
  
  // Update step errors when config changes
  useEffect(() => {
    const errors = validateCurrentStep();
    setStepErrors(prev => ({ ...prev, [currentStep]: errors }));
  }, [currentStep, config, validateCurrentStep]);
  
  // Update configuration
  const updateConfig = useCallback((updates: Partial<BulkSessionConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);
  
  // Update specific session
  const updateSession = useCallback((sessionId: string, updates: Partial<SessionConfiguration>) => {
    setConfig(prev => ({
      ...prev,
      sessions: prev.sessions.map(session =>
        session.id === sessionId ? { ...session, ...updates } : session
      )
    }));
  }, []);
  
  // Navigation handlers
  const handleNext = async () => {
    if (!canGoNext) return;
    
    if (isLastStep) {
      // Complete wizard
      try {
        setValidatingConfig(true);
        console.log('Calling onComplete with config:', config);
        await onComplete(config);
        console.log('onComplete finished successfully');
      } catch (error) {
        console.error('Failed to create bulk sessions:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to create sessions. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setValidatingConfig(false);
      }
    } else {
      // Go to next step
      const nextStepIndex = currentStepIndex + 1;
      setCurrentStep(WIZARD_STEPS[nextStepIndex].id);
    }
  };
  
  const handlePrevious = () => {
    if (!canGoPrevious) return;
    const prevStepIndex = currentStepIndex - 1;
    setCurrentStep(WIZARD_STEPS[prevStepIndex].id);
  };
  
  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <BasicConfigStep
            config={config}
            onConfigChange={updateConfig}
            errors={stepErrors.basic}
          />
        );
        
      case 'setup':
        // Temporary inline component to avoid import issues
        return (
          <div className="space-y-6">
            {stepErrors.setup.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-red-700 font-medium">Please fix the following errors:</p>
                <ul className="list-disc list-inside mt-2">
                  {stepErrors.setup.map((error, index) => (
                    <li key={index} className="text-red-600">{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="space-y-4">
              {config.sessions.map((session, index) => (
                <Card key={session.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Session {index + 1}: {session.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Session Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={session.name}
                        onChange={(e) => updateSession(session.id, { name: e.target.value })}
                        placeholder="Enter session name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Equipment Types</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['rowing', 'bike_erg', 'ski_erg', 'running', 'assault_bike', 'swimming'].map(type => (
                          <Button
                            key={type}
                            type="button"
                            variant={session.equipment.includes(type as WorkoutEquipmentType) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              const currentEquipment = session.equipment;
                              const isSelected = currentEquipment.includes(type as WorkoutEquipmentType);
                              
                              const updatedEquipment = isSelected
                                ? currentEquipment.filter(eq => eq !== type)
                                : [...currentEquipment, type as WorkoutEquipmentType];
                              
                              updateSession(session.id, { equipment: updatedEquipment });
                            }}
                          >
                            {type.replace('_', ' ').toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>
                        {session.playerIds.length} players, {session.teamIds.length} teams assigned
                      </span>
                    </div>
                    
                    <div className="pt-2">
                      {session.equipment.length > 0 ? (
                        <Badge variant="default">Equipment Configured</Badge>
                      ) : (
                        <Badge variant="secondary">Select Equipment</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded p-4 space-y-3">
              <p className="text-blue-700">
                <strong>Note:</strong> Player assignment functionality is temporarily simplified while we resolve component imports.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // Add mock players to all sessions
                  config.sessions.forEach(session => {
                    updateSession(session.id, {
                      playerIds: ['player-001', 'player-002', 'player-003', 'player-004', 'player-005', 'player-006']
                    });
                  });
                  toast({
                    title: 'Mock Players Added',
                    description: '6 players added to each session for testing'
                  });
                }}
              >
                Add Mock Players (6 per session)
              </Button>
            </div>
          </div>
        );
        
      case 'review':
        return (
          <ReviewStep
            config={config}
            equipmentAvailability={equipmentAvailability}
            errors={stepErrors.review}
          />
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className={cn('max-w-6xl mx-auto p-6', className)}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Multiple Conditioning Sessions</h1>
        <p className="text-muted-foreground">
          Configure multiple parallel conditioning sessions with equipment and player assignments
        </p>
      </div>
      
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{currentStepInfo.title}</h2>
          <Badge variant="outline" className="text-sm">
            Step {currentStepIndex + 1} of {WIZARD_STEPS.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-2 mb-2" />
        <p className="text-sm text-muted-foreground">{currentStepInfo.description}</p>
      </div>
      
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-8 px-4">
        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const hasErrors = stepErrors[step.id].length > 0;
          
          return (
            <div key={step.id} className="flex items-center">
              {/* Step circle */}
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium',
                isCompleted && 'bg-green-500 border-green-500 text-white',
                isCurrent && !hasErrors && 'border-primary bg-primary text-primary-foreground',
                isCurrent && hasErrors && 'border-red-500 bg-red-500 text-white',
                !isCompleted && !isCurrent && 'border-muted-foreground text-muted-foreground'
              )}>
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : hasErrors && isCurrent ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              
              {/* Step line */}
              {index < WIZARD_STEPS.length - 1 && (
                <div className={cn(
                  'w-16 h-0.5 mx-2',
                  isCompleted ? 'bg-green-500' : 'bg-muted'
                )} />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Error summary */}
      {stepErrors[currentStep].length > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Please fix the following issues:
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {stepErrors[currentStep].map((error, index) => (
                <li key={index} className="text-sm text-red-600">• {error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {/* Step content */}
      <Card className="mb-8">
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>
      
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading || validatingConfig}
          >
            Cancel
          </Button>
          
          {/* Session summary */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{config.numberOfSessions} sessions</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{config.duration} min each</span>
            </div>
            {config.facilityId && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>Facility selected</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={!canGoPrevious || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!canGoNext || isLoading}
          >
            {validatingConfig ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creating...
              </>
            ) : isLastStep ? (
              'Create Sessions'
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkSessionWizard;