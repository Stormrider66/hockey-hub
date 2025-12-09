'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Play,
  Pause,
  Users,
  Wifi,
  WifiOff,
  Clock,
  Heart,
  Activity,
  CheckCircle,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DemoProps {
  onClose?: () => void;
}

export function WorkoutExecutionDemo({ onClose }: DemoProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isConnected, setIsConnected] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionPaused, setSessionPaused] = useState(false);
  const [metrics, setMetrics] = useState({
    heartRate: 145,
    progress: 65,
    timeElapsed: '12:34',
    currentInterval: 'High Intensity',
    intervalRemaining: '00:45'
  });

  const steps = [
    {
      title: 'Calendar Event Launch',
      description: 'Player clicks "Start Conditioning Session" from calendar event',
      status: 'completed',
      component: (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium">Morning Conditioning</h4>
                <p className="text-sm text-muted-foreground">9:00 AM - 10:00 AM • Training Center A</p>
              </div>
              <Badge variant="secondary">Training</Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Play className="h-4 w-4 mr-1" />
                Start Conditioning Session
              </Button>
              <Button size="sm" variant="outline">
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      title: 'Session State Management',
      description: 'WorkoutSessionManager creates persistent session with auto-save',
      status: currentStep >= 1 ? 'completed' : 'pending',
      component: (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Session initialized with ID: session_123456</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Auto-save enabled (30s intervals)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Browser refresh recovery enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Conditioning state tracking active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      title: 'Real-time Broadcasting',
      description: 'Player metrics are broadcasted via WebSocket to trainer dashboard',
      status: currentStep >= 2 ? 'completed' : 'pending',
      component: (
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  WebSocket {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsConnected(!isConnected)}
              >
                Toggle Connection
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                <span>HR: {metrics.heartRate} BPM</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span>Progress: {metrics.progress}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>Elapsed: {metrics.timeElapsed}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span>{metrics.currentInterval}</span>
              </div>
            </div>
            
            {!isConnected && (
              <Alert className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Metrics queued for offline sync (3 updates pending)
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )
    },
    {
      title: 'Pause/Resume Functionality',
      description: 'Session can be paused and resumed with full state preservation',
      status: currentStep >= 3 ? 'completed' : 'pending',
      component: (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium">
                  Session Status: {sessionPaused ? 'Paused' : sessionActive ? 'Active' : 'Ready'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Interval 4/8 • {metrics.intervalRemaining} remaining
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (!sessionActive) {
                      setSessionActive(true);
                      setSessionPaused(false);
                    } else if (sessionPaused) {
                      setSessionPaused(false);
                    } else {
                      setSessionPaused(true);
                    }
                  }}
                  className={cn(
                    sessionActive && !sessionPaused ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                  )}
                >
                  {sessionActive && !sessionPaused ? (
                    <>
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      {sessionPaused ? 'Resume' : 'Start'}
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {sessionPaused && (
              <Alert>
                <RotateCcw className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Session paused and saved. Can be resumed from any device.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )
    },
    {
      title: 'Trainer Monitoring',
      description: 'Physical trainer sees live updates on group monitoring dashboard',
      status: currentStep >= 4 ? 'completed' : 'pending',
      component: (
        <Card className="bg-indigo-50 border-indigo-200">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Live Session Monitor</h4>
                <Badge variant="outline">
                  <Users className="h-3 w-3 mr-1" />
                  3 Active
                </Badge>
              </div>
              
              <div className="space-y-2">
                {[
                  { name: 'Connor McDavid', hr: 165, progress: 78, status: 'in-zone' },
                  { name: 'Sidney Crosby', hr: 142, progress: 65, status: 'below-target' },
                  { name: 'Nathan MacKinnon', hr: 158, progress: 82, status: 'in-zone' }
                ].map((player, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        player.status === 'in-zone' ? 'bg-green-500' : 'bg-orange-500'
                      )} />
                      <span className="text-sm font-medium">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span>HR: {player.hr}</span>
                      <span>Progress: {player.progress}%</span>
                      <Badge 
                        variant={player.status === 'in-zone' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {player.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Real-time Workout Execution Demo</h2>
          <p className="text-muted-foreground">
            Complete Phase 4 implementation showing calendar → execution → monitoring flow
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close Demo
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              step.status === 'completed' ? "bg-green-600 text-white" :
              currentStep === idx ? "bg-blue-600 text-white" :
              "bg-gray-200 text-gray-600"
            )}>
              {step.status === 'completed' ? <CheckCircle className="h-4 w-4" /> : idx + 1}
            </div>
            {idx < steps.length - 1 && (
              <div className={cn(
                "w-12 h-0.5 mx-2",
                step.status === 'completed' ? "bg-green-600" : "bg-gray-200"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <Card 
            key={idx} 
            className={cn(
              "transition-all",
              currentStep === idx && "ring-2 ring-blue-500",
              step.status === 'completed' && "bg-green-50"
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{step.title}</CardTitle>
                <Badge variant={
                  step.status === 'completed' ? 'default' : 
                  currentStep === idx ? 'secondary' : 'outline'
                }>
                  {step.status === 'completed' ? 'Complete' : 
                   currentStep === idx ? 'Active' : 'Pending'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </CardHeader>
            <CardContent>
              {step.component}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          Previous Step
        </Button>
        <Button
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
        >
          Next Step
        </Button>
        <Button
          variant="secondary"
          onClick={() => setCurrentStep(steps.length - 1)}
        >
          Complete Demo
        </Button>
      </div>

      {/* Summary */}
      {currentStep === steps.length - 1 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Phase 4 Complete!</strong> The real-time workout execution flow is now fully integrated:
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Calendar events launch appropriate workout viewers with session data</li>
              <li>• Real-time metrics are broadcasted via WebSocket to trainer dashboard</li>
              <li>• Session state is persisted with pause/resume and browser refresh recovery</li>
              <li>• Offline queue management ensures no data loss during connectivity issues</li>
              <li>• Trainers can monitor multiple players simultaneously with live updates</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}