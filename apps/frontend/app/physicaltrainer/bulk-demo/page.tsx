'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  Clock,
  MapPin,
  Settings,
  Lightbulb,
  Copy,
  CheckCircle2,
  Brain,
  Activity,
  Zap,
  Target
} from '@/components/icons';
import { BulkConfigurationPanel } from '@/features/physical-trainer/components/shared/BulkConfigurationPanel';
import { MixedTypeTemplates, type MixedTypeTemplate } from '@/features/physical-trainer/services/MixedTypeTemplates';
import { SmartAllocationAlgorithms } from '@/features/physical-trainer/services/SmartAllocationAlgorithms';
import type { BulkSessionConfig } from '@/features/physical-trainer/hooks/useBulkSession';

const BulkSessionDemo: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<'mixed' | 'single'>('mixed');
  const [demoResults, setDemoResults] = useState<any>(null);
  const [createdSessions, setCreatedSessions] = useState<BulkSessionConfig[]>([]);

  // Demo templates showcase
  const allTemplates = MixedTypeTemplates.getAllTemplates();
  
  // Demo scenarios
  const scenarios = {
    mixed: {
      title: 'Mixed-Type Bulk Sessions',
      description: 'Create bulk sessions with different workout types using AI optimization',
      workoutType: 'mixed' as const,
      enableMixedTypes: true,
      enableSmartAllocation: true
    },
    single: {
      title: 'Enhanced Single-Type Sessions',
      description: 'Create multiple sessions of the same type with smart allocation',
      workoutType: 'conditioning' as const,
      enableMixedTypes: false,
      enableSmartAllocation: true
    }
  };

  const handleSessionComplete = async (config: BulkSessionConfig) => {
    console.log('Bulk Session Created:', config);
    
    setCreatedSessions(prev => [...prev, config]);
    
    // Simulate API call success
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setDemoResults({
          success: true,
          config,
          message: `Successfully created ${config.numberOfSessions} sessions`,
          timestamp: new Date().toLocaleTimeString()
        });
        resolve();
      }, 1500);
    });
  };

  const getWorkoutTypeIcon = (type: string) => {
    switch (type) {
      case 'strength': return <Zap className="h-4 w-4" />;
      case 'conditioning': return <Activity className="h-4 w-4" />;
      case 'hybrid': return <Target className="h-4 w-4" />;
      case 'agility': return <Users className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Phase 6.1: Multi-Type Bulk Sessions Demo</h1>
        <p className="text-muted-foreground">
          Experience AI-powered bulk session creation with mixed workout types and smart allocation
        </p>
      </div>

      <Tabs value={selectedScenario} onValueChange={(value) => setSelectedScenario(value as any)}>
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
          <TabsTrigger value="mixed">Mixed Types</TabsTrigger>
          <TabsTrigger value="single">Single Type</TabsTrigger>
        </TabsList>

        <TabsContent value="mixed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="h-5 w-5" />
                Mixed-Type Bulk Session Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BulkConfigurationPanel
                workoutType="mixed"
                enableMixedTypes={true}
                enableSmartAllocation={true}
                onComplete={handleSessionComplete}
                maxSessions={6}
                minSessions={3}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="single" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Smart Single-Type Bulk Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BulkConfigurationPanel
                workoutType="conditioning"
                enableMixedTypes={false}
                enableSmartAllocation={true}
                onComplete={handleSessionComplete}
                maxSessions={5}
                minSessions={2}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Showcase */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Available Mixed-Type Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allTemplates.map(template => (
              <div key={template.id} className="border rounded-lg p-4 hover:border-primary/50 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">{template.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {template.difficulty}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{template.estimatedTotalTime} min</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{template.workoutTypes.length} sessions</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {template.workoutTypes.map((type, index) => (
                      <div key={index} className="flex items-center gap-1">
                        {getWorkoutTypeIcon(type)}
                        {index < template.workoutTypes.length - 1 && (
                          <span className="text-xs text-muted-foreground">→</span>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results Panel */}
      {demoResults && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="h-5 w-5" />
              Session Creation Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-green-700">
              <p className="font-medium">{demoResults.message}</p>
              <p className="text-sm">Created at: {demoResults.timestamp}</p>
            </div>
            
            {demoResults.config && (
              <div className="space-y-3">
                <Separator />
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>Date: {demoResults.config.sessionDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Start Time: {demoResults.config.sessionTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Sessions: {demoResults.config.numberOfSessions}</span>
                  </div>
                </div>
                
                {demoResults.config.sessions && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-800">Session Details:</h4>
                    <div className="grid gap-2">
                      {demoResults.config.sessions.map((session: any, index: number) => (
                        <div key={session.id} className="bg-white rounded p-2 border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {session.workoutType && getWorkoutTypeIcon(session.workoutType)}
                              <span className="font-medium text-sm">{session.name}</span>
                            </div>
                            {session.startTime && (
                              <Badge variant="secondary" className="text-xs">
                                {session.startTime}
                              </Badge>
                            )}
                          </div>
                          {session.equipment && session.equipment.length > 0 && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              Equipment: {session.equipment.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Created Sessions History */}
      {createdSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Created Sessions ({createdSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {createdSessions.map((session, index) => (
                <div key={index} className="border rounded p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">
                        {session.workoutType === 'mixed' ? 'Mixed-Type' : session.workoutType.charAt(0).toUpperCase() + session.workoutType.slice(1)} Sessions
                      </span>
                      <div className="text-sm text-muted-foreground">
                        {session.numberOfSessions} sessions • {session.sessionDate} at {session.sessionTime}
                      </div>
                    </div>
                    <Badge variant={session.workoutType === 'mixed' ? 'default' : 'secondary'}>
                      {session.workoutType}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Highlights */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Lightbulb className="h-5 w-5" />
            Phase 6.1 Features Demonstrated
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">Smart Allocation Algorithms</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Equipment optimization with conflict resolution</li>
                <li>• Intelligent session ordering for facility flow</li>
                <li>• Transition time management between workout types</li>
                <li>• Constraint satisfaction for multi-resource allocation</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">Mixed-Type Templates</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Pre-designed training sequences for different phases</li>
                <li>• Smart defaults with context-aware recommendations</li>
                <li>• Automatic equipment and timing adjustments</li>
                <li>• Custom template generation capabilities</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkSessionDemo;