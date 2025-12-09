'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Target,
  Heart,
  Zap,
  Award,
  AlertCircle
} from 'lucide-react';

interface RecoveryMilestone {
  id: string;
  name: string;
  phase: string;
  targetWeek: number;
  description: string;
  isCompleted: boolean;
  completedDate?: Date;
  requirements: string[];
}

interface RecoveryTrend {
  metric: string;
  timeframe: 'week' | 'month' | 'phase';
  trend: 'improving' | 'declining' | 'stable' | 'plateau';
  trendStrength: number;
  currentValue: number;
  targetValue: number;
  projectedOutcome: {
    expectedValue: number;
    confidenceLevel: number;
    estimatedTimeToTarget: number;
  };
}

interface RecoveryAlert {
  id: string;
  type: 'setback' | 'plateau' | 'complication' | 'milestone_missed' | 'compliance_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendations: {
    action: string;
    priority: 'immediate' | 'urgent' | 'moderate' | 'routine';
    assignee: 'medical_staff' | 'physical_trainer' | 'coach' | 'player';
  }[];
  createdAt: Date;
}

interface RecoveryProgressMonitorProps {
  playerId?: string;
  teamId?: string;
}

// Mock data for demonstration
const mockRecoveryMilestones: RecoveryMilestone[] = [
  {
    id: 'pain-control',
    name: 'Pain Control',
    phase: 'acute',
    targetWeek: 1,
    description: 'Achieve adequate pain control and reduce inflammation',
    isCompleted: true,
    completedDate: new Date('2024-01-15'),
    requirements: ['Pain level < 3/10', 'No swelling', 'Normal sleep pattern']
  },
  {
    id: 'mobility-restoration',
    name: 'Mobility Restoration',
    phase: 'subacute',
    targetWeek: 3,
    description: 'Restore full range of motion',
    isCompleted: true,
    completedDate: new Date('2024-01-25'),
    requirements: ['80% ROM compared to uninjured side', 'Pain-free movement', 'No stiffness']
  },
  {
    id: 'strength-building',
    name: 'Strength Building',
    phase: 'chronic',
    targetWeek: 6,
    description: 'Achieve 80% strength compared to uninjured side',
    isCompleted: false,
    requirements: ['80% strength baseline', 'Functional movement patterns', 'No compensations']
  },
  {
    id: 'sport-readiness',
    name: 'Sport Readiness',
    phase: 'return_to_play',
    targetWeek: 10,
    description: 'Pass all sport-specific performance tests',
    isCompleted: false,
    requirements: ['90% function level', 'Sport-specific movements', 'Psychological readiness']
  }
];

const mockRecoveryTrends: RecoveryTrend[] = [
  {
    metric: 'Pain Level',
    timeframe: 'week',
    trend: 'improving',
    trendStrength: 0.8,
    currentValue: 2,
    targetValue: 0,
    projectedOutcome: {
      expectedValue: 1,
      confidenceLevel: 85,
      estimatedTimeToTarget: 7
    }
  },
  {
    metric: 'Function Level',
    timeframe: 'week',
    trend: 'improving',
    trendStrength: 0.7,
    currentValue: 75,
    targetValue: 90,
    projectedOutcome: {
      expectedValue: 82,
      confidenceLevel: 78,
      estimatedTimeToTarget: 14
    }
  },
  {
    metric: 'Range of Motion',
    timeframe: 'week',
    trend: 'stable',
    trendStrength: 0.3,
    currentValue: 85,
    targetValue: 95,
    projectedOutcome: {
      expectedValue: 88,
      confidenceLevel: 65,
      estimatedTimeToTarget: 21
    }
  },
  {
    metric: 'Compliance',
    timeframe: 'week',
    trend: 'declining',
    trendStrength: 0.6,
    currentValue: 78,
    targetValue: 90,
    projectedOutcome: {
      expectedValue: 72,
      confidenceLevel: 70,
      estimatedTimeToTarget: -1 // Needs intervention
    }
  }
];

const mockRecoveryAlerts: RecoveryAlert[] = [
  {
    id: 'compliance-alert-1',
    type: 'compliance_issue',
    severity: 'medium',
    title: 'Declining Treatment Compliance',
    description: 'Patient compliance has dropped to 78% over the past week, below the recommended 85% threshold.',
    recommendations: [
      {
        action: 'Schedule patient education session',
        priority: 'urgent',
        assignee: 'medical_staff'
      },
      {
        action: 'Adjust treatment plan complexity',
        priority: 'moderate',
        assignee: 'physical_trainer'
      }
    ],
    createdAt: new Date('2024-01-20T10:30:00')
  },
  {
    id: 'plateau-alert-1',
    type: 'plateau',
    severity: 'low',
    title: 'Range of Motion Plateau',
    description: 'Range of motion improvements have plateaued at 85% for the past 5 days.',
    recommendations: [
      {
        action: 'Introduce advanced mobility exercises',
        priority: 'moderate',
        assignee: 'physical_trainer'
      },
      {
        action: 'Consider manual therapy session',
        priority: 'routine',
        assignee: 'medical_staff'
      }
    ],
    createdAt: new Date('2024-01-19T14:15:00')
  }
];

export const RecoveryProgressMonitor: React.FC<RecoveryProgressMonitorProps> = ({
  playerId,
  teamId
}) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [selectedView, setSelectedView] = useState<'milestones' | 'trends' | 'alerts'>('milestones');

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />;
      case 'plateau':
        return <Minus className="h-4 w-4 text-yellow-600" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'setback':
      case 'complication':
        return <AlertCircle className="h-4 w-4" />;
      case 'plateau':
        return <Minus className="h-4 w-4" />;
      case 'milestone_missed':
        return <Target className="h-4 w-4" />;
      case 'compliance_issue':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const renderMilestones = () => (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Recovery Milestones Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {mockRecoveryMilestones.filter(m => m.isCompleted).length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {mockRecoveryMilestones.filter(m => !m.isCompleted).length}
              </div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Math.round((mockRecoveryMilestones.filter(m => m.isCompleted).length / mockRecoveryMilestones.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.max(...mockRecoveryMilestones.filter(m => !m.isCompleted).map(m => m.targetWeek))}
              </div>
              <div className="text-sm text-muted-foreground">Weeks to Goal</div>
            </div>
          </div>

          <Progress 
            value={(mockRecoveryMilestones.filter(m => m.isCompleted).length / mockRecoveryMilestones.length) * 100} 
            className="mb-4" 
          />
        </CardContent>
      </Card>

      {/* Milestone Details */}
      <div className="space-y-4">
        {mockRecoveryMilestones.map((milestone, index) => (
          <Card key={milestone.id} className={milestone.isCompleted ? 'border-green-200 bg-green-50/50' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    {milestone.isCompleted ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <div className="h-6 w-6 border-2 border-muted-foreground rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium">{index + 1}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{milestone.name}</h4>
                      <Badge variant="outline">{milestone.phase}</Badge>
                      <Badge variant="secondary">Week {milestone.targetWeek}</Badge>
                      {milestone.isCompleted && milestone.completedDate && (
                        <Badge variant="secondary">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {milestone.completedDate.toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{milestone.description}</p>
                    <div>
                      <h5 className="text-sm font-medium mb-1">Requirements:</h5>
                      <div className="space-y-1">
                        {milestone.requirements.map((req, reqIndex) => (
                          <div key={reqIndex} className="flex items-center gap-2 text-sm">
                            {milestone.isCompleted ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <div className="h-3 w-3 border border-muted-foreground rounded-full"></div>
                            )}
                            <span className={milestone.isCompleted ? 'text-green-700' : 'text-muted-foreground'}>
                              {req}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderTrends = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recovery Trends Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockRecoveryTrends.map((trend, index) => (
              <Card key={index} className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{trend.metric}</h4>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(trend.trend)}
                      <Badge variant={trend.trend === 'improving' ? 'secondary' : 
                                   trend.trend === 'declining' ? 'destructive' : 'default'}>
                        {trend.trend}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Current vs Target */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current</span>
                        <span className="font-medium">
                          {trend.metric === 'Pain Level' ? `${trend.currentValue}/10` : `${trend.currentValue}%`}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Target</span>
                        <span className="font-medium">
                          {trend.metric === 'Pain Level' ? `${trend.targetValue}/10` : `${trend.targetValue}%`}
                        </span>
                      </div>
                      <Progress 
                        value={trend.metric === 'Pain Level' ? 
                          ((10 - trend.currentValue) / 10) * 100 : // Invert for pain level
                          (trend.currentValue / trend.targetValue) * 100
                        } 
                        className="h-2" 
                      />
                    </div>

                    {/* Projection */}
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <h5 className="text-sm font-medium mb-2">Projection</h5>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Expected Value</span>
                          <span>
                            {trend.metric === 'Pain Level' ? 
                              `${trend.projectedOutcome.expectedValue}/10` : 
                              `${trend.projectedOutcome.expectedValue}%`}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Confidence</span>
                          <span>{trend.projectedOutcome.confidenceLevel}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Time to Target</span>
                          <span>
                            {trend.projectedOutcome.estimatedTimeToTarget > 0 ? 
                              `${trend.projectedOutcome.estimatedTimeToTarget} days` : 
                              'Needs intervention'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Trend Strength */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Trend Strength</span>
                        <span>{Math.round(trend.trendStrength * 100)}%</span>
                      </div>
                      <Progress value={trend.trendStrength * 100} className="h-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recovery Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mockRecoveryAlerts.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-700 mb-2">All Clear!</h3>
              <p className="text-muted-foreground">No recovery alerts at this time. Recovery is progressing well.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mockRecoveryAlerts.map((alert) => (
                <Alert key={alert.id} variant={getAlertVariant(alert.severity) as any}>
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{alert.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={getAlertVariant(alert.severity) as any}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {alert.type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <AlertDescription className="mb-3">
                        {alert.description}
                      </AlertDescription>
                      
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Recommended Actions:</h5>
                        {alert.recommendations.map((rec, recIndex) => (
                          <div key={recIndex} className="flex items-center justify-between p-2 bg-background/50 rounded">
                            <span className="text-sm">{rec.action}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {rec.priority}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {rec.assignee.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Created: {alert.createdAt.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Recovery Progress Monitor</h3>
          <p className="text-muted-foreground">
            Track rehabilitation milestones, trends, and receive real-time alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={selectedView === 'milestones' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('milestones')}
          >
            <Target className="h-4 w-4 mr-2" />
            Milestones
          </Button>
          <Button
            variant={selectedView === 'trends' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('trends')}
          >
            <Activity className="h-4 w-4 mr-2" />
            Trends
          </Button>
          <Button
            variant={selectedView === 'alerts' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('alerts')}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alerts
            {mockRecoveryAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                {mockRecoveryAlerts.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      {selectedView === 'milestones' && renderMilestones()}
      {selectedView === 'trends' && renderTrends()}
      {selectedView === 'alerts' && renderAlerts()}
    </div>
  );
};