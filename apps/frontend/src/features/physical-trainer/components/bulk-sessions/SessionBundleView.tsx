'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading';
import { 
  ArrowLeft, 
  RefreshCw, 
  Settings, 
  Users,
  Calendar,
  Clock,
  Activity,
  AlertCircle
} from '@/components/icons';
import { cn } from '@/lib/utils';
import { BundleMetrics, BulkActions, SessionGridView } from './bundle-view';
import { WorkoutTypeMonitoringWidget } from './bundle-view/WorkoutTypeMonitoringWidget';
import { WorkoutTypeDistribution } from './bundle-view/WorkoutTypeDistribution';
import type { 
  SessionBundle, 
  BundleSession, 
  BundleMetrics as BundleMetricsType,
  BulkActionType,
  SessionBundleViewProps 
} from './bulk-sessions.types';

// Mock data generator for demonstration
const generateMockBundle = (bundleId: string): SessionBundle => {
  const workoutTypes: BundleSession['workoutType'][] = ['strength', 'conditioning', 'hybrid', 'agility'];
  const equipmentTypes = ['rowing', 'bike', 'treadmill', 'weights', 'kettlebells', 'bodyweight'];
  const statuses: BundleSession['status'][] = ['active', 'paused', 'preparing', 'completed'];
  const locations = ['Gym A', 'Gym B', 'Outdoor Field', 'Training Room 1', 'Training Room 2'];
  
  const sessions: BundleSession[] = [];
  const sessionCount = Math.floor(Math.random() * 6) + 3; // 3-8 sessions

  for (let i = 0; i < sessionCount; i++) {
    const workoutType = workoutTypes[Math.floor(Math.random() * workoutTypes.length)];
    const status = i === 0 ? 'active' : statuses[Math.floor(Math.random() * statuses.length)];
    const participantCount = Math.floor(Math.random() * 8) + 4; // 4-12 participants
    
    const participants = Array.from({ length: participantCount }, (_, idx) => ({
      id: `participant-${i}-${idx}`,
      playerId: `player-${i}-${idx}`,
      playerName: `Player ${i * 10 + idx + 1}`,
      playerNumber: i * 10 + idx + 1,
      teamId: `team-${Math.floor(idx / 6) + 1}`,
      teamName: `Team ${String.fromCharCode(65 + Math.floor(idx / 6))}`,
      status: Math.random() > 0.15 ? 'connected' : (Math.random() > 0.5 ? 'paused' : 'disconnected'),
      progress: Math.floor(Math.random() * 100),
      currentActivity: workoutType === 'strength' ? 'Bench Press' : workoutType === 'conditioning' ? 'Interval 3/8' : 'Block 2/5',
      metrics: {
        heartRate: Math.floor(Math.random() * 60) + 120,
        heartRateZone: ['zone1', 'zone2', 'zone3', 'zone4', 'zone5'][Math.floor(Math.random() * 5)] as any,
        power: workoutType === 'conditioning' ? Math.floor(Math.random() * 200) + 100 : undefined,
        calories: Math.floor(Math.random() * 300) + 50,
        reps: workoutType === 'strength' ? Math.floor(Math.random() * 15) + 5 : undefined,
        weight: workoutType === 'strength' ? Math.floor(Math.random() * 100) + 50 : undefined,
      }
    }));

    const session: BundleSession = {
      id: `session-${i}`,
      name: `${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Session ${i + 1}`,
      workoutType,
      equipment: workoutType === 'conditioning' ? equipmentTypes[Math.floor(Math.random() * 3)] : 
                  workoutType === 'strength' ? 'weights' : 
                  workoutType === 'agility' ? 'bodyweight' : 
                  equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)],
      participants,
      status: status as any,
      progress: Math.floor(Math.random() * 100),
      startTime: status !== 'preparing' ? new Date(Date.now() - Math.random() * 3600000) : undefined,
      elapsedTime: status !== 'preparing' ? Math.floor(Math.random() * 3600) : 0,
      estimatedDuration: Math.floor(Math.random() * 1800) + 1800, // 30-60 minutes
      currentPhase: workoutType === 'strength' ? `Exercise ${Math.floor(Math.random() * 6) + 1}/8` :
                    workoutType === 'conditioning' ? `Interval ${Math.floor(Math.random() * 8) + 1}/8` :
                    workoutType === 'hybrid' ? `Block ${Math.floor(Math.random() * 5) + 1}/6` :
                    `Drill ${Math.floor(Math.random() * 4) + 1}/5`,
      location: locations[Math.floor(Math.random() * locations.length)]
    };

    sessions.push(session);
  }

  return {
    id: bundleId,
    name: `Training Bundle ${bundleId.slice(-3)}`,
    createdAt: new Date(Date.now() - Math.random() * 86400000), // Last 24 hours
    createdBy: 'current-trainer',
    sessions,
    totalParticipants: sessions.reduce((sum, s) => sum + s.participants.length, 0),
    status: sessions.some(s => s.status === 'active') ? 'active' : 
            sessions.some(s => s.status === 'paused') ? 'paused' : 
            sessions.every(s => s.status === 'completed') ? 'completed' : 'preparing'
  };
};

export const SessionBundleView: React.FC<SessionBundleViewProps> = ({ 
  bundleId, 
  onSessionClick, 
  onBulkAction, 
  className 
}) => {
  const { t } = useTranslation('physicalTrainer');
  const [bundle, setBundle] = useState<SessionBundle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Calculate bundle metrics
  const bundleMetrics: BundleMetricsType = useMemo(() => {
    if (!bundle) {
      return {
        totalSessions: 0,
        activeSessions: 0,
        totalParticipants: 0,
        activeParticipants: 0,
        averageProgress: 0,
        averageHeartRate: 0,
        totalCaloriesBurned: 0,
        averageIntensity: 0
      };
    }

    const activeSessions = bundle.sessions.filter(s => s.status === 'active').length;
    const activeParticipants = bundle.sessions.reduce((sum, s) => 
      sum + s.participants.filter(p => p.status === 'connected').length, 0
    );
    
    const averageProgress = bundle.sessions.length > 0
      ? Math.round(bundle.sessions.reduce((sum, s) => sum + s.progress, 0) / bundle.sessions.length)
      : 0;

    const allParticipants = bundle.sessions.flatMap(s => s.participants);
    const participantsWithHR = allParticipants.filter(p => p.metrics.heartRate);
    const averageHeartRate = participantsWithHR.length > 0
      ? Math.round(participantsWithHR.reduce((sum, p) => sum + (p.metrics.heartRate || 0), 0) / participantsWithHR.length)
      : undefined;

    const totalCaloriesBurned = allParticipants.reduce((sum, p) => sum + (p.metrics.calories || 0), 0);

    return {
      totalSessions: bundle.sessions.length,
      activeSessions,
      totalParticipants: bundle.totalParticipants,
      activeParticipants,
      averageProgress,
      averageHeartRate,
      totalCaloriesBurned,
      averageIntensity: Math.round(averageProgress * 0.8) // Rough intensity calculation
    };
  }, [bundle]);

  // Load bundle data
  useEffect(() => {
    const loadBundle = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In real implementation, this would be an API call
        const mockBundle = generateMockBundle(bundleId);
        setBundle(mockBundle);
        setLastUpdated(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bundle');
      } finally {
        setIsLoading(false);
      }
    };

    loadBundle();
  }, [bundleId]);

  // Auto-refresh every 5 seconds when active
  useEffect(() => {
    if (!autoRefresh || !bundle || bundle.status === 'completed') return;

    const interval = setInterval(() => {
      // Simulate real-time updates
      setBundle(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          sessions: prev.sessions.map(session => ({
            ...session,
            progress: Math.min(100, session.progress + Math.floor(Math.random() * 3)),
            elapsedTime: session.status === 'active' ? session.elapsedTime + 5 : session.elapsedTime,
            participants: session.participants.map(p => ({
              ...p,
              progress: Math.min(100, p.progress + Math.floor(Math.random() * 2)),
              metrics: {
                ...p.metrics,
                heartRate: p.metrics.heartRate ? 
                  Math.max(90, Math.min(180, p.metrics.heartRate + (Math.random() - 0.5) * 10)) : undefined
              }
            }))
          }))
        };
      });
      setLastUpdated(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, bundle]);

  const handleBulkAction = async (action: BulkActionType, sessionIds: string[], metadata?: any) => {
    console.log('Bulk action:', action, 'for sessions:', sessionIds, 'with metadata:', metadata);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update local state based on action
    if (action === 'pause_all') {
      setBundle(prev => prev ? {
        ...prev,
        sessions: prev.sessions.map(s => 
          sessionIds.includes(s.id) && s.status === 'active' 
            ? { ...s, status: 'paused' }
            : s
        )
      } : prev);
    } else if (action === 'resume_all') {
      setBundle(prev => prev ? {
        ...prev,
        sessions: prev.sessions.map(s => 
          sessionIds.includes(s.id) && (s.status === 'paused' || s.status === 'preparing')
            ? { ...s, status: 'active' }
            : s
        )
      } : prev);
    } else if (action === 'export_by_type' || action === 'export_data') {
      // Handle export actions with type-specific logic
      console.log(`Exporting ${metadata?.workoutType ? `${metadata.workoutType} ` : ''}data for ${sessionIds.length} sessions`);
    }
    
    onBulkAction?.(action, sessionIds);
  };

  const handleRefresh = () => {
    setBundle(prev => prev ? generateMockBundle(bundleId) : prev);
    setLastUpdated(new Date());
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-96", className)}>
        <LoadingSpinner size="xl" text={t('bundle.loading')} />
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-96", className)}>
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('bundle.error.title')}
        </h3>
        <p className="text-gray-500 mb-4">{error || t('bundle.error.notFound')}</p>
        <Button onClick={() => window.location.reload()}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{bundle.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{t('bundle.created')}: {bundle.createdAt.toLocaleDateString()}</span>
              <span className="text-gray-400">•</span>
              <Users className="h-4 w-4" />
              <span>{bundle.totalParticipants} {t('common.participants')}</span>
              <span className="text-gray-400">•</span>
              <Badge className={cn(
                bundle.status === 'active' && "bg-green-50 text-green-700 border-green-200",
                bundle.status === 'paused' && "bg-yellow-50 text-yellow-700 border-yellow-200",
                bundle.status === 'preparing' && "bg-blue-50 text-blue-700 border-blue-200",
                bundle.status === 'completed' && "bg-gray-50 text-gray-700 border-gray-200"
              )}>
                {bundle.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500">
            {t('bundle.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.refresh')}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={cn("h-4 w-4 mr-2", autoRefresh && "text-green-600")} />
            {autoRefresh ? t('bundle.autoRefreshOn') : t('bundle.autoRefreshOff')}
          </Button>
        </div>
      </div>

      {/* Bundle Metrics */}
      <BundleMetrics metrics={bundleMetrics} />

      {/* Workout Type Distribution and Type-Specific Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkoutTypeDistribution sessions={bundle.sessions} />
        
        {/* Type-Specific Monitoring Widgets */}
        <div className="space-y-4">
          {(['strength', 'conditioning', 'hybrid', 'agility'] as const).map(workoutType => (
            <WorkoutTypeMonitoringWidget
              key={workoutType}
              sessions={bundle.sessions}
              workoutType={workoutType}
            />
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('bundle.actions.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BulkActions 
            sessions={bundle.sessions} 
            onBulkAction={handleBulkAction}
          />
        </CardContent>
      </Card>

      {/* Sessions Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('bundle.sessions.title')} ({bundle.sessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SessionGridView 
            sessions={bundle.sessions}
            onSessionClick={onSessionClick}
          />
        </CardContent>
      </Card>
    </div>
  );
};