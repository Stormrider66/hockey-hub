/**
 * Validation System Usage Example
 * 
 * Comprehensive example showing how to use the unified validation system
 * across all workout types with real-time feedback and error handling.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info,
  Shield,
  Calendar,
  Users,
  Zap
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading';

import { 
  useWorkoutValidationSuite,
  useProgressiveValidation 
} from '../hooks/useValidation';
import { WorkoutType } from '../types/validation.types';
import type { ValidationResponse, ValidationSummary } from '../types/validation-api.types';

// ============================================================================
// Types
// ============================================================================

interface WorkoutFormData {
  title: string;
  description: string;
  type: string;
  duration: number;
  location: string;
  playerIds: string[];
  scheduledDate: string;
  intensity: string;
}

// ============================================================================
// Main Example Component
// ============================================================================

const ValidationExample: React.FC = () => {
  const [workoutType, setWorkoutType] = useState<WorkoutType>(WorkoutType.STRENGTH);
  const [formData, setFormData] = useState<WorkoutFormData>({
    title: '',
    description: '',
    type: 'strength',
    duration: 60,
    location: '',
    playerIds: [],
    scheduledDate: '',
    intensity: 'medium'
  });

  const [validationMode, setValidationMode] = useState<'real-time' | 'progressive' | 'full'>('real-time');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialize validation hooks
  const validation = useWorkoutValidationSuite(workoutType);
  const progressiveValidation = useProgressiveValidation(
    workoutType,
    ['basic_info', 'content', 'players', 'schedule', 'review']
  );

  // ============================================================================
  // Real-time Field Validation
  // ============================================================================

  const handleFieldChange = useCallback((field: keyof WorkoutFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Real-time validation for this field
    if (validationMode === 'real-time') {
      validation.validateField(field, value, {
        workoutType: workoutType.toString(),
        organizationId: 'org-1',
        teamId: 'team-1'
      });
    }
  }, [validation, validationMode, workoutType]);

  // ============================================================================
  // Full Workout Validation
  // ============================================================================

  const handleFullValidation = useCallback(async () => {
    try {
      const result = await validation.validate(
        {
          workout: {
            title: formData.title,
            description: formData.description,
            type: formData.type,
            estimatedDuration: formData.duration,
            location: formData.location,
            playerIds: formData.playerIds,
            scheduledDate: formData.scheduledDate,
            intensity: formData.intensity
          }
        },
        {
          userId: 'user-1',
          organizationId: 'org-1',
          teamId: 'team-1',
          playerIds: formData.playerIds,
          scheduledDateTime: formData.scheduledDate
        },
        {
          includeSuggestions: true,
          useCache: true
        }
      );

      console.log('Full validation result:', result);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  }, [validation, formData]);

  // ============================================================================
  // Specialized Validations
  // ============================================================================

  const handleContentValidation = useCallback(async () => {
    try {
      const result = await validation.validateContent(
        {
          title: formData.title,
          description: formData.description,
          duration: formData.duration,
          intensity: formData.intensity
        },
        {
          organizationId: 'org-1',
          teamId: 'team-1'
        }
      );

      console.log('Content validation result:', result);
    } catch (error) {
      console.error('Content validation failed:', error);
    }
  }, [validation, formData]);

  const handleMedicalValidation = useCallback(async () => {
    if (formData.playerIds.length === 0) {
      alert('Please select players first');
      return;
    }

    try {
      const result = await validation.validateMedical(
        formData.playerIds,
        {
          organizationId: 'org-1'
        },
        {
          intensityLevel: formData.intensity === 'high' ? 9 : formData.intensity === 'medium' ? 6 : 3,
          duration: formData.duration
        }
      );

      console.log('Medical validation result:', result);
    } catch (error) {
      console.error('Medical validation failed:', error);
    }
  }, [validation, formData]);

  const handleScheduleValidation = useCallback(async () => {
    if (!formData.scheduledDate) {
      alert('Please set a scheduled date first');
      return;
    }

    try {
      const result = await validation.validateSchedule(
        formData.scheduledDate,
        formData.duration,
        {
          organizationId: 'org-1',
          userId: 'user-1'
        },
        {
          playerIds: formData.playerIds,
          teamId: 'team-1'
        }
      );

      console.log('Schedule validation result:', result);
    } catch (error) {
      console.error('Schedule validation failed:', error);
    }
  }, [validation, formData]);

  // ============================================================================
  // Progressive Validation
  // ============================================================================

  const handleProgressiveValidation = useCallback(async () => {
    const stepData = {
      basic_info: {
        title: formData.title,
        description: formData.description,
        type: formData.type
      },
      content: {
        duration: formData.duration,
        intensity: formData.intensity,
        location: formData.location
      },
      players: {
        playerIds: formData.playerIds
      },
      schedule: {
        scheduledDate: formData.scheduledDate
      }
    };

    try {
      const result = await progressiveValidation.validateCurrentStep(
        stepData[progressiveValidation.currentStep as keyof typeof stepData] || {},
        {
          workoutType: workoutType.toString(),
          organizationId: 'org-1'
        }
      );

      console.log('Progressive validation result:', result);
    } catch (error) {
      console.error('Progressive validation failed:', error);
    }
  }, [progressiveValidation, formData, workoutType]);

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const renderFieldValidation = (fieldName: string) => {
    const fieldValidation = validation.getFieldValidation(fieldName);
    
    if (fieldValidation.errors.length > 0) {
      return (
        <div className="mt-1">
          {fieldValidation.errors.map((error, index) => (
            <div key={index} className="flex items-center gap-1 text-red-600 text-sm">
              <XCircle className="h-3 w-3" />
              {error}
            </div>
          ))}
        </div>
      );
    }

    if (fieldValidation.warnings.length > 0) {
      return (
        <div className="mt-1">
          {fieldValidation.warnings.map((warning, index) => (
            <div key={index} className="flex items-center gap-1 text-orange-600 text-sm">
              <AlertTriangle className="h-3 w-3" />
              {warning}
            </div>
          ))}
        </div>
      );
    }

    if (fieldValidation.isValid && fieldValidation.lastValidated > 0) {
      return (
        <div className="mt-1">
          <div className="flex items-center gap-1 text-green-600 text-sm">
            <CheckCircle className="h-3 w-3" />
            Valid
          </div>
        </div>
      );
    }

    return null;
  };

  const renderValidationSummary = (summary: ValidationSummary) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {summary.status === 'valid' && <CheckCircle className="h-5 w-5 text-green-600" />}
          {summary.status === 'warning' && <AlertTriangle className="h-5 w-5 text-orange-600" />}
          {summary.status === 'invalid' && <XCircle className="h-5 w-5 text-red-600" />}
          Validation Summary (Score: {summary.score}/100)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Progress value={summary.score} className="w-full" />
          
          {summary.topIssues.length > 0 && (
            <div>
              <Label className="font-medium">Top Issues:</Label>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                {summary.topIssues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {summary.recommendations.length > 0 && (
            <div>
              <Label className="font-medium">Recommendations:</Label>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-600">
                {summary.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // ============================================================================
  // Mock Data
  // ============================================================================

  const mockPlayers = [
    { id: 'player-001', name: 'Connor McDavid' },
    { id: 'player-002', name: 'Leon Draisaitl' },
    { id: 'player-005', name: 'Sidney Crosby' },
    { id: 'player-008', name: 'Nathan MacKinnon' }
  ];

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Unified Validation System Demo</h1>
        <p className="text-gray-600">
          Comprehensive validation with real-time feedback, medical compliance, and scheduling
        </p>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Workout Type</Label>
              <Select 
                value={workoutType} 
                onValueChange={(value) => setWorkoutType(value as WorkoutType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={WorkoutType.STRENGTH}>Strength</SelectItem>
                  <SelectItem value={WorkoutType.CONDITIONING}>Conditioning</SelectItem>
                  <SelectItem value={WorkoutType.HYBRID}>Hybrid</SelectItem>
                  <SelectItem value={WorkoutType.AGILITY}>Agility</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Validation Mode</Label>
              <Select 
                value={validationMode} 
                onValueChange={(value) => setValidationMode(value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="real-time">Real-time</SelectItem>
                  <SelectItem value="progressive">Progressive</SelectItem>
                  <SelectItem value="full">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="advanced" 
                checked={showAdvanced}
                onCheckedChange={setShowAdvanced}
              />
              <Label htmlFor="advanced">Show Advanced Features</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Status */}
      {validation.isValidating && (
        <Alert>
          <LoadingSpinner size="sm" />
          <AlertDescription>
            Validating workout... This includes content, medical compliance, and scheduling checks.
          </AlertDescription>
        </Alert>
      )}

      {validation.validationError && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Validation Error: {validation.validationError}
          </AlertDescription>
        </Alert>
      )}

      {/* Progressive Validation Progress */}
      {validationMode === 'progressive' && (
        <Card>
          <CardHeader>
            <CardTitle>Progressive Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Step {progressiveValidation.progress.current} of {progressiveValidation.progress.total}</span>
                  <span>{progressiveValidation.progress.percentage}%</span>
                </div>
                <Progress value={progressiveValidation.progress.percentage} />
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline">Current Step: {progressiveValidation.currentStep}</Badge>
                <Button 
                  size="sm" 
                  onClick={handleProgressiveValidation}
                  disabled={validation.isValidating}
                >
                  Validate Step
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={progressiveValidation.nextStep}
                  disabled={!progressiveValidation.canProceed}
                >
                  Next Step
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={progressiveValidation.previousStep}
                >
                  Previous Step
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Fields */}
        <Card>
          <CardHeader>
            <CardTitle>Workout Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Enter workout title"
              />
              {renderFieldValidation('title')}
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Describe the workout"
                rows={3}
              />
              {renderFieldValidation('description')}
            </div>

            <div>
              <Label>Duration (minutes) *</Label>
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) => handleFieldChange('duration', parseInt(e.target.value) || 0)}
                placeholder="60"
              />
              {renderFieldValidation('duration')}
            </div>

            <div>
              <Label>Location *</Label>
              <Input
                value={formData.location}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                placeholder="Training facility"
              />
              {renderFieldValidation('location')}
            </div>

            <div>
              <Label>Intensity</Label>
              <Select 
                value={formData.intensity} 
                onValueChange={(value) => handleFieldChange('intensity', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="max">Maximum</SelectItem>
                </SelectContent>
              </Select>
              {renderFieldValidation('intensity')}
            </div>

            <div>
              <Label>Scheduled Date *</Label>
              <Input
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) => handleFieldChange('scheduledDate', e.target.value)}
              />
              {renderFieldValidation('scheduledDate')}
            </div>

            <div>
              <Label>Players *</Label>
              <div className="space-y-2">
                {mockPlayers.map(player => (
                  <div key={player.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={player.id}
                      checked={formData.playerIds.includes(player.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleFieldChange('playerIds', [...formData.playerIds, player.id]);
                        } else {
                          handleFieldChange('playerIds', formData.playerIds.filter(id => id !== player.id));
                        }
                      }}
                    />
                    <Label htmlFor={player.id}>{player.name}</Label>
                    {player.id === 'player-005' && (
                      <Badge variant="destructive" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Medical Restriction
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              {renderFieldValidation('playerIds')}
            </div>
          </CardContent>
        </Card>

        {/* Validation Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Validation Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handleFullValidation}
                disabled={validation.isValidating}
                className="w-full"
              >
                {validation.isValidating && <LoadingSpinner size="sm" className="mr-2" />}
                <Zap className="mr-2 h-4 w-4" />
                Full Validation
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleContentValidation}
                >
                  Content
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleMedicalValidation}
                >
                  <Shield className="mr-1 h-3 w-3" />
                  Medical
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleScheduleValidation}
                >
                  <Calendar className="mr-1 h-3 w-3" />
                  Schedule
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => validation.validateAssignments(
                    formData.playerIds,
                    { organizationId: 'org-1', userId: 'user-1' },
                    'team-1'
                  )}
                >
                  <Users className="mr-1 h-3 w-3" />
                  Players
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Validation Results */}
          {validation.lastResult && renderValidationSummary(
            validation.lastResult 
              ? {
                  status: validation.lastResult.isValid ? 'valid' : 'invalid',
                  score: validation.lastResult.metadata.score,
                  errors: validation.lastResult.errors.reduce((acc, e) => ({ ...acc, [e.severity]: (acc[e.severity] || 0) + 1 }), {}),
                  warnings: validation.lastResult.warnings.reduce((acc, w) => ({ ...acc, [w.category]: (acc[w.category] || 0) + 1 }), {}),
                  topIssues: [
                    ...validation.lastResult.errors.slice(0, 3).map(e => e.message),
                    ...validation.lastResult.warnings.slice(0, 2).map(w => w.message)
                  ],
                  recommendations: validation.lastResult.suggestions.filter(s => s.priority === 'high').slice(0, 3).map(s => s.title)
                }
              : {
                  status: 'valid' as const,
                  score: 0,
                  errors: {},
                  warnings: {},
                  topIssues: [],
                  recommendations: []
                }
          )}

          {/* Advanced Features */}
          {showAdvanced && (
            <Card>
              <CardHeader>
                <CardTitle>Advanced Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <Label className="font-medium">Cache Stats:</Label>
                  <pre className="bg-gray-100 p-2 rounded mt-1 text-xs">
                    {JSON.stringify(validation.getCacheStats(), null, 2)}
                  </pre>
                </div>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={validation.clearCache}
                  className="w-full"
                >
                  Clear Cache
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-gray-600">
            <p>
              This demo showcases the unified validation system with real-time feedback,
              medical compliance checking, scheduling conflict detection, and progressive validation.
            </p>
            <p className="mt-2">
              Open browser console to see detailed validation responses.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ValidationExample;