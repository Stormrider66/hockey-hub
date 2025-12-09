/**
 * Integration Example
 * 
 * Shows how to integrate the unified validation system into existing workout builders
 * with minimal code changes and maximum benefit.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Save,
  Users,
  Shield
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading';

import { useWorkoutValidationSuite } from '../hooks/useValidation';
import { WorkoutType } from '../types/validation.types';
import type { ValidationResponse } from '../types/validation-api.types';

// ============================================================================
// Enhanced Workout Builder with Validation
// ============================================================================

interface ValidationIntegratedBuilderProps {
  workoutType: WorkoutType;
  onSave?: (data: any, validationResult: ValidationResponse) => void;
}

const ValidationIntegratedBuilder: React.FC<ValidationIntegratedBuilderProps> = ({
  workoutType,
  onSave
}) => {
  const [workoutData, setWorkoutData] = useState({
    title: '',
    description: '',
    duration: 60,
    playerIds: [] as string[],
    scheduledDate: '',
    intensity: 'medium'
  });

  const [saveAttempted, setSaveAttempted] = useState(false);

  // Initialize validation suite
  const validation = useWorkoutValidationSuite(workoutType);

  // ============================================================================
  // Real-time Field Validation Integration
  // ============================================================================

  const handleFieldChange = useCallback((field: string, value: any) => {
    setWorkoutData(prev => ({ ...prev, [field]: value }));

    // Real-time validation with debouncing
    validation.validateField(field, value, {
      workoutType: workoutType.toString(),
      organizationId: 'org-1',
      teamId: 'team-1'
    });
  }, [validation, workoutType]);

  // ============================================================================
  // Enhanced Save with Validation
  // ============================================================================

  const handleSave = useCallback(async () => {
    setSaveAttempted(true);

    try {
      // Comprehensive validation before save
      const validationResult = await validation.validate(
        {
          workout: {
            title: workoutData.title,
            description: workoutData.description,
            type: workoutType.toLowerCase(),
            estimatedDuration: workoutData.duration,
            playerIds: workoutData.playerIds,
            scheduledDate: workoutData.scheduledDate,
            intensity: workoutData.intensity
          }
        },
        {
          userId: 'user-1',
          organizationId: 'org-1',
          teamId: 'team-1',
          playerIds: workoutData.playerIds,
          scheduledDateTime: workoutData.scheduledDate
        },
        {
          includeSuggestions: true,
          config: {
            strictness: 'normal',
            includeMedical: true,
            includeScheduling: true,
            includeFacility: true,
            includePerformance: true
          }
        }
      );

      // Check for blocking errors
      const hasBlockingErrors = validationResult.errors.some(error => 
        error.severity === 'ERROR' && 
        ['REQUIRED_FIELD', 'MEDICAL_COMPLIANCE', 'SAFETY'].includes(error.category)
      );

      if (hasBlockingErrors) {
        // Show user the blocking issues
        console.error('Cannot save due to validation errors:', validationResult.errors);
        return;
      }

      // Save with validation result
      if (onSave) {
        onSave(workoutData, validationResult);
      }

      console.log('Saved successfully with validation result:', validationResult);

    } catch (error) {
      console.error('Validation or save failed:', error);
    }
  }, [workoutData, validation, workoutType, onSave]);

  // ============================================================================
  // Automatic Medical Check on Player Assignment
  // ============================================================================

  useEffect(() => {
    if (workoutData.playerIds.length > 0) {
      // Automatically check medical compliance when players are assigned
      validation.validateMedical(
        workoutData.playerIds,
        { organizationId: 'org-1' },
        {
          intensityLevel: workoutData.intensity === 'high' ? 9 : workoutData.intensity === 'medium' ? 6 : 3,
          duration: workoutData.duration
        }
      ).catch(error => {
        console.warn('Medical validation failed:', error);
      });
    }
  }, [workoutData.playerIds, workoutData.intensity, workoutData.duration, validation]);

  // ============================================================================
  // UI Helper Functions
  // ============================================================================

  const getFieldValidationIcon = (fieldName: string) => {
    const fieldValidation = validation.getFieldValidation(fieldName);
    
    if (fieldValidation.errors.length > 0) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    
    if (fieldValidation.warnings.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }
    
    if (fieldValidation.isValid && fieldValidation.lastValidated > 0) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    return null;
  };

  const getFieldValidationMessages = (fieldName: string) => {
    const fieldValidation = validation.getFieldValidation(fieldName);
    
    return (
      <div className="mt-1 space-y-1">
        {fieldValidation.errors.map((error, index) => (
          <div key={index} className="text-sm text-red-600 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {error}
          </div>
        ))}
        {fieldValidation.warnings.map((warning, index) => (
          <div key={index} className="text-sm text-orange-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {warning}
          </div>
        ))}
      </div>
    );
  };

  const canSave = () => {
    // Check if all required fields have valid values
    const requiredFields = ['title', 'duration', 'playerIds'];
    return requiredFields.every(field => {
      const fieldValidation = validation.getFieldValidation(field);
      return fieldValidation.isValid && fieldValidation.errors.length === 0;
    });
  };

  // ============================================================================
  // Mock Players Data
  // ============================================================================

  const mockPlayers = [
    { id: 'player-001', name: 'Connor McDavid', hasRestrictions: false },
    { id: 'player-005', name: 'Sidney Crosby', hasRestrictions: true },
    { id: 'player-008', name: 'Nathan MacKinnon', hasRestrictions: true },
    { id: 'player-010', name: 'Auston Matthews', hasRestrictions: false }
  ];

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Enhanced {workoutType} Workout Builder</h2>
        <p className="text-gray-600">With Integrated Validation System</p>
      </div>

      {/* Validation Status */}
      {validation.isValidating && (
        <Alert>
          <LoadingSpinner size="sm" />
          <AlertDescription>
            Validating workout for safety, medical compliance, and scheduling conflicts...
          </AlertDescription>
        </Alert>
      )}

      {validation.lastResult && validation.lastResult.warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Validation Warnings:</div>
              {validation.lastResult.warnings.slice(0, 3).map((warning, index) => (
                <div key={index} className="text-sm">• {warning.message}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Basic Information
              {saveAttempted && !canSave() && <XCircle className="h-5 w-5 text-red-500" />}
              {saveAttempted && canSave() && <CheckCircle className="h-5 w-5 text-green-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="flex items-center gap-2">
                Title *
                {getFieldValidationIcon('title')}
              </Label>
              <Input
                value={workoutData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Enter workout title"
                className={validation.getFieldValidation('title').errors.length > 0 ? 'border-red-500' : ''}
              />
              {getFieldValidationMessages('title')}
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={workoutData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Describe the workout"
              />
              {getFieldValidationMessages('description')}
            </div>

            <div>
              <Label className="flex items-center gap-2">
                Duration (minutes) *
                {getFieldValidationIcon('duration')}
              </Label>
              <Input
                type="number"
                value={workoutData.duration}
                onChange={(e) => handleFieldChange('duration', parseInt(e.target.value) || 0)}
                placeholder="60"
                className={validation.getFieldValidation('duration').errors.length > 0 ? 'border-red-500' : ''}
              />
              {getFieldValidationMessages('duration')}
            </div>

            <div>
              <Label>Intensity</Label>
              <select
                value={workoutData.intensity}
                onChange={(e) => handleFieldChange('intensity', e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="max">Maximum</option>
              </select>
              {getFieldValidationMessages('intensity')}
            </div>

            <div>
              <Label>Scheduled Date</Label>
              <Input
                type="datetime-local"
                value={workoutData.scheduledDate}
                onChange={(e) => handleFieldChange('scheduledDate', e.target.value)}
              />
              {getFieldValidationMessages('scheduledDate')}
            </div>
          </CardContent>
        </Card>

        {/* Player Assignment with Medical Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Player Assignment
              {getFieldValidationIcon('playerIds')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Players *</Label>
              <div className="space-y-2">
                {mockPlayers.map(player => (
                  <div key={player.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={player.id}
                        checked={workoutData.playerIds.includes(player.id)}
                        onChange={(e) => {
                          const newPlayerIds = e.target.checked
                            ? [...workoutData.playerIds, player.id]
                            : workoutData.playerIds.filter(id => id !== player.id);
                          handleFieldChange('playerIds', newPlayerIds);
                        }}
                      />
                      <Label htmlFor={player.id}>{player.name}</Label>
                    </div>
                    
                    {player.hasRestrictions && (
                      <Badge variant="destructive" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Medical Restriction
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              {getFieldValidationMessages('playerIds')}
            </div>

            {/* Medical Compliance Summary */}
            {workoutData.playerIds.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded border">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                  <Shield className="h-4 w-4" />
                  Medical Compliance Check
                </div>
                <div className="mt-2 text-sm text-blue-700">
                  {workoutData.playerIds.includes('player-005') && (
                    <div>⚠️ Sidney Crosby has shoulder restrictions - exercises will be modified</div>
                  )}
                  {workoutData.playerIds.includes('player-008') && (
                    <div>⚠️ Nathan MacKinnon has minor ankle restrictions - monitor for discomfort</div>
                  )}
                  {!workoutData.playerIds.some(id => ['player-005', 'player-008'].includes(id)) && (
                    <div>✅ All selected players cleared for participation</div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Validation Summary and Actions */}
      {validation.lastResult && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span>Overall Score:</span>
                <Badge variant={validation.lastResult.metadata.score >= 80 ? "default" : "secondary"}>
                  {validation.lastResult.metadata.score}/100
                </Badge>
              </div>

              {validation.lastResult.suggestions.length > 0 && (
                <div>
                  <Label className="font-medium">Suggestions:</Label>
                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-600">
                    {validation.lastResult.suggestions.slice(0, 3).map((suggestion, index) => (
                      <li key={index}>{suggestion.title}: {suggestion.description}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Actions */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {validation.isValidating && "Validating..."}
          {!validation.isValidating && canSave() && "Ready to save"}
          {!validation.isValidating && !canSave() && saveAttempted && "Please fix validation errors"}
        </div>

        <div className="space-x-2">
          <Button 
            variant="outline"
            onClick={() => {
              validation.validate(
                { workout: workoutData },
                {
                  userId: 'user-1',
                  organizationId: 'org-1',
                  teamId: 'team-1',
                  playerIds: workoutData.playerIds,
                  scheduledDateTime: workoutData.scheduledDate
                },
                { includeSuggestions: true }
              );
            }}
            disabled={validation.isValidating}
          >
            Validate
          </Button>
          
          <Button 
            onClick={handleSave}
            disabled={validation.isValidating || (saveAttempted && !canSave())}
          >
            {validation.isValidating && <LoadingSpinner size="sm" className="mr-2" />}
            <Save className="mr-2 h-4 w-4" />
            Save Workout
          </Button>
        </div>
      </div>

      {/* Integration Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-green-600">✅ Real-time Validation</div>
              <div>Fields are validated as you type with debouncing</div>
            </div>
            <div>
              <div className="font-medium text-blue-600">🏥 Medical Safety</div>
              <div>Automatic compliance checking for player restrictions</div>
            </div>
            <div>
              <div className="font-medium text-purple-600">📅 Schedule Conflicts</div>
              <div>Prevents double-booking and facility conflicts</div>
            </div>
            <div>
              <div className="font-medium text-orange-600">💡 Smart Suggestions</div>
              <div>AI-powered recommendations for optimization</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================================
// Demo Component
// ============================================================================

const IntegrationExample: React.FC = () => {
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<WorkoutType>(WorkoutType.STRENGTH);

  const handleSave = (data: any, validationResult: ValidationResponse) => {
    console.log('Workout saved:', data);
    console.log('Validation result:', validationResult);
    
    // Here you would typically call your save API
    alert(`Workout saved successfully!\nValidation Score: ${validationResult.metadata.score}/100`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold">Validation System Integration Example</h1>
          <div className="mt-2 flex items-center gap-4">
            <Label>Workout Type:</Label>
            <select
              value={selectedWorkoutType}
              onChange={(e) => setSelectedWorkoutType(e.target.value as WorkoutType)}
              className="border rounded px-3 py-1"
            >
              <option value={WorkoutType.STRENGTH}>Strength</option>
              <option value={WorkoutType.CONDITIONING}>Conditioning</option>
              <option value={WorkoutType.HYBRID}>Hybrid</option>
              <option value={WorkoutType.AGILITY}>Agility</option>
            </select>
          </div>
        </div>
      </div>

      <ValidationIntegratedBuilder 
        workoutType={selectedWorkoutType}
        onSave={handleSave}
      />
    </div>
  );
};

export default IntegrationExample;