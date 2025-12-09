'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity,
  Dumbbell,
  Heart,
  Zap,
  Target,
  Clock,
  Users,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

// Import all workout type components
import EnhancedGroupSessionMonitor from './EnhancedGroupSessionMonitor';
import TeamMetricsAnalytics from './TeamMetricsAnalytics';
import { useGroupSessionBroadcast } from '../../hooks/useGroupSessionBroadcast';

// Import workout types
import type { 
  ConditioningSession,
  PlayerTestResult,
  WorkoutSession 
} from '../../types/conditioning.types';
import type { StrengthWorkout } from '../../types/strength.types';
import type { HybridWorkout } from '../../types/hybrid.types';
import type { AgilityWorkout } from '../../types/agility.types';

// Workout type configuration
interface WorkoutTypeConfig {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  primaryMetrics: string[];
  supportedFeatures: {
    realTimeMetrics: boolean;
    zoneTracking: boolean;
    powerMetrics: boolean;
    heartRateMonitoring: boolean;
    videoStreaming?: boolean;
    audioCoaching?: boolean;
    formAnalysis?: boolean;
    speedTracking?: boolean;
  };
  alertThresholds: {
    heartRateMax?: number;
    heartRateMin?: number;
    complianceMin: number;
    connectionTimeoutMs: number;
  };
}

const WORKOUT_TYPE_CONFIGS: Record<string, WorkoutTypeConfig> = {
  conditioning: {
    name: 'Conditioning',
    icon: Heart,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    primaryMetrics: ['Heart Rate', 'Power', 'Zone Compliance', 'Calories'],
    supportedFeatures: {
      realTimeMetrics: true,
      zoneTracking: true,
      powerMetrics: true,
      heartRateMonitoring: true,
      audioCoaching: true
    },
    alertThresholds: {
      heartRateMax: 185,
      heartRateMin: 60,
      complianceMin: 60,
      connectionTimeoutMs: 10000
    }
  },
  strength: {
    name: 'Strength Training',
    icon: Dumbbell,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    primaryMetrics: ['Sets Completed', 'Weight Load', 'Rest Times', 'Form Score'],
    supportedFeatures: {
      realTimeMetrics: true,
      zoneTracking: false,
      powerMetrics: false,
      heartRateMonitoring: true,
      videoStreaming: true,
      formAnalysis: true
    },
    alertThresholds: {
      heartRateMax: 160,
      heartRateMin: 80,
      complianceMin: 70,
      connectionTimeoutMs: 15000
    }
  },
  hybrid: {
    name: 'Hybrid Training',
    icon: Target,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    primaryMetrics: ['Combined Score', 'Heart Rate', 'Power', 'Completion Rate'],
    supportedFeatures: {
      realTimeMetrics: true,
      zoneTracking: true,
      powerMetrics: true,
      heartRateMonitoring: true,
      audioCoaching: true,
      formAnalysis: true
    },
    alertThresholds: {
      heartRateMax: 180,
      heartRateMin: 70,
      complianceMin: 65,
      connectionTimeoutMs: 12000
    }
  },
  agility: {
    name: 'Agility Training',
    icon: Activity,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    primaryMetrics: ['Speed', 'Reaction Time', 'Accuracy', 'Completion Rate'],
    supportedFeatures: {
      realTimeMetrics: true,
      zoneTracking: false,
      powerMetrics: false,
      heartRateMonitoring: true,
      speedTracking: true,
      audioCoaching: true,
      formAnalysis: true
    },
    alertThresholds: {
      heartRateMax: 170,
      heartRateMin: 90,
      complianceMin: 75,
      connectionTimeoutMs: 8000
    }
  }
};

// Unified workout session type
type UnifiedWorkoutSession = ConditioningSession | StrengthWorkout | HybridWorkout | AgilityWorkout | WorkoutSession;

interface WorkoutTypeGroupMonitorProps {
  sessionId: string;
  workout: UnifiedWorkoutSession;
  workoutType: 'conditioning' | 'strength' | 'hybrid' | 'agility';
  participants: Array<{
    id: string;
    name: string;
    playerTests?: PlayerTestResult[];
    medicalRestrictions?: string[];
  }>;
  mode?: 'monitor' | 'analytics' | 'both';
  onBack?: () => void;
}

export default function WorkoutTypeGroupMonitor({
  sessionId,
  workout,
  workoutType,
  participants,
  mode = 'both',
  onBack
}: WorkoutTypeGroupMonitorProps) {
  const { t } = useTranslation(['physicalTrainer']);
  
  // Get configuration for this workout type
  const config = WORKOUT_TYPE_CONFIGS[workoutType];
  
  // WebSocket integration with workout-specific settings
  const {
    connectionStatus,
    sessionStatus,
    playerMetrics,
    teamMetrics,
    broadcastCount
  } = useGroupSessionBroadcast(sessionId, 'trainer');
  
  // Validate workout type support
  if (!config) {
    return (
      <div className="h-full flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Unsupported workout type: {workoutType}. 
            Please contact support for assistance.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Check if real-time monitoring is supported
  if (!config.supportedFeatures.realTimeMetrics) {
    return (
      <div className="h-full flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Real-time group monitoring is not yet supported for {config.name}.
            This feature is coming soon.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Workout-specific metric filtering
  const getFilteredPlayerMetrics = () => {
    return playerMetrics.map(player => {
      const filtered = { ...player };
      
      // Remove unsupported metrics based on workout type
      if (!config.supportedFeatures.powerMetrics) {
        delete filtered.watts;
        delete filtered.rpm;
      }
      
      if (!config.supportedFeatures.speedTracking) {
        delete filtered.speed;
        delete filtered.pace;
      }
      
      // Adjust zone compliance calculation for non-zone workouts
      if (!config.supportedFeatures.zoneTracking) {
        // For strength/agility, use completion rate or form score instead
        filtered.zoneCompliance = player.targetAchievement || 
                                 Math.round(Math.random() * 40 + 60); // Mock compliance
      }
      
      return filtered;
    });
  };
  
  const filteredPlayerMetrics = getFilteredPlayerMetrics();
  
  // Workout-specific team metrics adjustment
  const getAdjustedTeamMetrics = () => {
    if (!teamMetrics) return null;
    
    const adjusted = { ...teamMetrics };
    
    // Remove power metrics for non-power workouts
    if (!config.supportedFeatures.powerMetrics) {
      delete adjusted.averageWatts;
    }
    
    return adjusted;
  };
  
  const adjustedTeamMetrics = getAdjustedTeamMetrics();
  
  // Calculate workout-specific session duration
  const getSessionDuration = () => {
    switch (workoutType) {
      case 'conditioning':
        const conditioningSession = workout as ConditioningSession;
        return conditioningSession.intervalProgram?.intervals.reduce(
          (total, interval) => total + interval.duration, 0
        ) || 3600; // Default 60 minutes
      case 'strength':
        return 4500; // Default 75 minutes for strength
      case 'hybrid':
        return 3600; // Default 60 minutes for hybrid
      case 'agility':
        return 2700; // Default 45 minutes for agility
      default:
        return 3600;
    }
  };
  
  const sessionDuration = getSessionDuration();
  
  return (
    <div className="h-full">
      {/* Feature Support Banner */}
      <div className={cn('p-3 mb-4 rounded-lg border', config.bgColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <config.icon className={cn('h-6 w-6', config.color)} />
            <div>
              <h3 className={cn('font-semibold', config.color)}>{config.name} Group Monitor</h3>
              <p className="text-sm text-muted-foreground">
                Monitoring {participants.length} participants with {config.primaryMetrics.length} key metrics
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Feature badges */}
            {config.supportedFeatures.heartRateMonitoring && (
              <Badge variant="outline" className="text-xs">
                <Heart className="h-3 w-3 mr-1" />
                HR
              </Badge>
            )}
            {config.supportedFeatures.powerMetrics && (
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Power
              </Badge>
            )}
            {config.supportedFeatures.zoneTracking && (
              <Badge variant="outline" className="text-xs">
                <Target className="h-3 w-3 mr-1" />
                Zones
              </Badge>
            )}
            {config.supportedFeatures.formAnalysis && (
              <Badge variant="outline" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Form
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {/* Connection Status for Workout Type */}
      {!connectionStatus.isConnected && (
        <Alert className="mb-4 border-yellow-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Real-time monitoring for {config.name} is currently disconnected. 
            Attempting to reconnect...
          </AlertDescription>
        </Alert>
      )}
      
      {/* Primary Metrics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {config.primaryMetrics.map((metric, index) => {
          let value = 'N/A';
          let icon = Activity;
          
          switch (metric) {
            case 'Heart Rate':
              value = adjustedTeamMetrics ? `${adjustedTeamMetrics.averageHeartRate} BPM` : 'N/A';
              icon = Heart;
              break;
            case 'Power':
              value = adjustedTeamMetrics?.averageWatts ? `${Math.round(adjustedTeamMetrics.averageWatts)} W` : 'N/A';
              icon = Zap;
              break;
            case 'Zone Compliance':
            case 'Combined Score':
              value = adjustedTeamMetrics ? `${Math.round(adjustedTeamMetrics.averageZoneCompliance)}%` : 'N/A';
              icon = Target;
              break;
            case 'Calories':
              value = adjustedTeamMetrics ? `${adjustedTeamMetrics.totalCalories}` : 'N/A';
              icon = TrendingUp;
              break;
            default:
              value = 'Active';
              icon = CheckCircle;
          }
          
          const IconComponent = icon;
          
          return (
            <Card key={metric}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{metric}</p>
                    <p className="text-lg font-bold">{value}</p>
                  </div>
                  <IconComponent className={cn('h-6 w-6', config.color)} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Main Content based on mode */}
      {mode === 'monitor' && (
        <EnhancedGroupSessionMonitor
          sessionId={sessionId}
          workout={workout}
          workoutType={workoutType}
          participants={participants}
          onBack={onBack}
        />
      )}
      
      {mode === 'analytics' && adjustedTeamMetrics && (
        <TeamMetricsAnalytics
          teamMetrics={adjustedTeamMetrics}
          playerMetrics={filteredPlayerMetrics}
          workoutType={workoutType}
          sessionDuration={sessionDuration}
        />
      )}
      
      {mode === 'both' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
          {/* Monitor (2/3 width) */}
          <div className="xl:col-span-2">
            <EnhancedGroupSessionMonitor
              sessionId={sessionId}
              workout={workout}
              workoutType={workoutType}
              participants={participants}
              onBack={onBack}
            />
          </div>
          
          {/* Analytics (1/3 width) */}
          <div className="xl:col-span-1">
            {adjustedTeamMetrics ? (
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Live Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-full overflow-y-auto">
                  <TeamMetricsAnalytics
                    teamMetrics={adjustedTeamMetrics}
                    playerMetrics={filteredPlayerMetrics}
                    workoutType={workoutType}
                    sessionDuration={sessionDuration}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full">
                <CardContent className="h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Analytics will appear when</p>
                    <p>players connect to the session</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
      
      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 p-2 bg-black/80 text-white text-xs rounded max-w-xs">
          <div>Session: {sessionId}</div>
          <div>Type: {workoutType}</div>
          <div>Connected: {connectionStatus.isConnected ? 'Yes' : 'No'}</div>
          <div>Players: {filteredPlayerMetrics.length}</div>
          <div>Broadcasts: {broadcastCount}</div>
        </div>
      )}
    </div>
  );
}