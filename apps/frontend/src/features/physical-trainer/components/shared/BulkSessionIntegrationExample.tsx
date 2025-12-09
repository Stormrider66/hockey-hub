'use client';

/**
 * Bulk Session Integration Example
 * 
 * This example demonstrates how to integrate the new useBulkSession hook and 
 * BulkConfigurationPanel component into existing workout builders.
 * 
 * Phase 1.1 Implementation - Unified Bulk Session Logic
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Copy, 
  Settings, 
  Zap, 
  Users,
  CheckCircle2,
  AlertCircle,
  Code2,
  BookOpen
} from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';

import { BulkConfigurationPanel } from './BulkConfigurationPanel';
import { useBulkSession, type BulkSessionConfig } from '../../hooks/useBulkSession';
import type { IntervalProgram } from '../../types/conditioning.types';

// Example workout data for different types
const exampleWorkouts = {
  strength: {
    name: 'Upper Body Power',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: 6, weight: 185 },
      { name: 'Pull-ups', sets: 3, reps: 8, weight: 0 },
      { name: 'Overhead Press', sets: 4, reps: 5, weight: 135 }
    ]
  },
  conditioning: {
    name: 'HIIT Cardio',
    intervals: [
      { type: 'work', duration: 30, intensity: 85, equipment: 'bike_erg' },
      { type: 'rest', duration: 30, intensity: 40, equipment: 'bike_erg' },
      { type: 'work', duration: 30, intensity: 90, equipment: 'rowing' },
      { type: 'rest', duration: 30, intensity: 40, equipment: 'rowing' }
    ]
  } as IntervalProgram,
  hybrid: {
    name: 'CrossFit WOD',
    blocks: [
      { type: 'exercise', name: 'Burpees', reps: 10 },
      { type: 'interval', duration: 60, equipment: 'rowing', intensity: 80 },
      { type: 'exercise', name: 'Box Jumps', reps: 15 }
    ]
  },
  agility: {
    name: 'Speed & Agility',
    drills: [
      { name: 'T-Drill', sets: 3, restBetween: 60 },
      { name: '5-10-5 Shuttle', sets: 4, restBetween: 90 },
      { name: 'Ladder Drills', sets: 2, restBetween: 120 }
    ]
  }
};

interface BulkSessionIntegrationExampleProps {
  className?: string;
}

export const BulkSessionIntegrationExample: React.FC<BulkSessionIntegrationExampleProps> = ({
  className
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const { toast } = useToast();
  
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<'strength' | 'conditioning' | 'hybrid' | 'agility'>('conditioning');
  const [bulkModeEnabled, setBulkModeEnabled] = useState(false);
  const [showImplementation, setShowImplementation] = useState(false);

  // Example integration with existing workout builder patterns
  const handleBulkSessionComplete = async (config: BulkSessionConfig) => {
    console.log('Bulk session configuration:', config);
    
    // Here you would typically:
    // 1. Create multiple workout sessions based on the configuration
    // 2. Set up calendar events for each session
    // 3. Send notifications to assigned players
    // 4. Handle any conflicts or errors
    
    toast({
      title: 'Bulk Sessions Created',
      description: `Successfully created ${config.numberOfSessions} ${selectedWorkoutType} sessions`,
    });
    
    // Reset bulk mode after successful creation
    setBulkModeEnabled(false);
  };

  const codeExample = `
// 1. Import the new bulk session components
import { 
  BulkConfigurationPanel, 
  useBulkSession 
} from '@/features/physical-trainer/components/shared';
import type { BulkSessionConfig } from '@/features/physical-trainer/hooks/useBulkSession';

// 2. Add bulk mode state to your workout builder
const [bulkModeEnabled, setBulkModeEnabled] = useState(false);

// 3. Handle bulk session completion
const handleBulkComplete = async (config: BulkSessionConfig) => {
  // Create multiple sessions based on configuration
  const sessions = await Promise.all(
    config.sessions.map(session => 
      createWorkoutSession({
        workoutData: baseWorkout,
        playerIds: session.playerIds,
        teamIds: session.teamIds,
        equipment: session.equipment,
        startTime: session.startTime || config.sessionTime,
        duration: config.duration,
        facilityId: config.facilityId
      })
    )
  );
  
  // Update calendar and notifications
  await createCalendarEvents(sessions, config);
  await sendNotifications(sessions);
};

// 4. Add bulk mode toggle to your builder UI
<div className="flex items-center gap-2">
  <Switch
    checked={bulkModeEnabled}
    onCheckedChange={setBulkModeEnabled}
  />
  <Label>Bulk Session Mode</Label>
</div>

// 5. Conditionally render the bulk configuration panel
{bulkModeEnabled && (
  <BulkConfigurationPanel
    workoutType="conditioning"
    baseWorkout={workoutData}
    onComplete={handleBulkComplete}
    onCancel={() => setBulkModeEnabled(false)}
    enablePlayerDistribution={true}
    showAdvancedOptions={true}
  />
)}
`;

  const integrationSteps = [
    {
      title: 'Import Components',
      description: 'Import useBulkSession hook and BulkConfigurationPanel component',
      status: 'completed'
    },
    {
      title: 'Add Bulk Mode State',
      description: 'Add state to toggle between single and bulk session creation',
      status: 'completed'
    },
    {
      title: 'Handle Configuration',
      description: 'Implement handler for bulk session completion',
      status: 'completed'
    },
    {
      title: 'UI Integration',
      description: 'Add toggle and panel to existing workout builders',
      status: 'in-progress'
    },
    {
      title: 'Testing & Validation',
      description: 'Test integration with all workout types',
      status: 'pending'
    }
  ];

  return (
    <div className={className}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Bulk Session Integration Example
            <Badge variant="secondary">Phase 1.1</Badge>
          </CardTitle>
          <p className="text-muted-foreground">
            Demonstration of how to integrate bulk session functionality into existing workout builders.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="demo" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="demo">Live Demo</TabsTrigger>
              <TabsTrigger value="implementation">Implementation</TabsTrigger>
              <TabsTrigger value="code">Code Example</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
            </TabsList>

            <TabsContent value="demo" className="space-y-6">
              {/* Workout Type Selection */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Select Workout Type</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose a workout type to see bulk session integration
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.keys(exampleWorkouts).map(type => (
                    <Button
                      key={type}
                      variant={selectedWorkoutType === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedWorkoutType(type as any)}
                      className="capitalize"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Bulk Mode Toggle */}
              <Card className="border-dashed">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={bulkModeEnabled}
                          onCheckedChange={setBulkModeEnabled}
                        />
                        <Label className="font-medium">Enable Bulk Session Mode</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Create multiple parallel sessions with shared configuration
                      </p>
                    </div>
                    {bulkModeEnabled && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Bulk Mode Active
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Bulk Configuration Panel */}
              {bulkModeEnabled && (
                <BulkConfigurationPanel
                  workoutType={selectedWorkoutType}
                  baseWorkout={exampleWorkouts[selectedWorkoutType]}
                  onComplete={handleBulkSessionComplete}
                  onCancel={() => setBulkModeEnabled(false)}
                  enablePlayerDistribution={true}
                  showAdvancedOptions={true}
                  maxSessions={6}
                  minSessions={2}
                />
              )}

              {/* Regular Workout Builder Placeholder */}
              {!bulkModeEnabled && (
                <Card>
                  <CardHeader>
                    <CardTitle className="capitalize">
                      {selectedWorkoutType} Workout Builder
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          This is where your existing {selectedWorkoutType} workout builder would be displayed.
                          The bulk mode functionality integrates seamlessly without affecting the single-session workflow.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Single session mode</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="implementation" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Integration Steps</h3>
                <div className="space-y-3">
                  {integrationSteps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {step.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        {step.status === 'in-progress' && <Settings className="h-4 w-4 text-blue-500 animate-spin" />}
                        {step.status === 'pending' && <AlertCircle className="h-4 w-4 text-gray-400" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{step.title}</h4>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                      <Badge 
                        variant={step.status === 'completed' ? 'default' : 
                                step.status === 'in-progress' ? 'secondary' : 'outline'}
                      >
                        {step.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Key Benefits</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Reusable across all workout types (strength, conditioning, hybrid, agility)</li>
                  <li>• Maintains existing single-session workflow</li>
                  <li>• Comprehensive validation and error handling</li>
                  <li>• Equipment conflict detection and resolution</li>
                  <li>• Automated player distribution options</li>
                  <li>• Real-time validation and suggestions</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="code" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Code2 className="h-5 w-5" />
                  Implementation Code
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(codeExample)}
                >
                  Copy Code
                </Button>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{codeExample}</code>
              </pre>
            </TabsContent>

            <TabsContent value="progress" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Phase 1.1 Complete</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>useBulkSession Hook</span>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>BulkConfigurationPanel</span>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Utility Functions</span>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Validation System</span>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Next Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                        <span>Phase 1.2: Integration into existing builders</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                        <span>Phase 1.3: Enhanced validation rules</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                        <span>Phase 2.1: Bulk session monitoring</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                        <span>Phase 2.2: Advanced distribution algorithms</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Phase 1.1 Successfully Completed</span>
                </div>
                <p className="text-sm text-green-700">
                  The core bulk session functionality is now available for integration into all workout builders.
                  The reusable components and hooks provide a consistent experience across all workout types.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkSessionIntegrationExample;