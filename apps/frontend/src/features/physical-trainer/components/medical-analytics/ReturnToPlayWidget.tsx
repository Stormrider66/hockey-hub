'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  FileText,
  Calendar,
  User,
  Shield,
  Zap,
  Award,
  XCircle
} from 'lucide-react';

interface ReturnToPlayProtocol {
  id: string;
  playerId: string;
  playerName: string;
  injuryType: string;
  currentPhase: string;
  status: 'initiated' | 'in_progress' | 'completed' | 'paused';
  clearanceLevel: 'no_contact' | 'limited_contact' | 'full_contact' | 'game_ready';
  progressPercentage: number;
  daysSinceStart: number;
  estimatedDaysRemaining: number;
  nextMilestone: {
    name: string;
    targetDate: string;
    requirements: string[];
  };
  assessments: {
    date: string;
    type: string;
    result: 'pass' | 'fail' | 'partial';
    notes?: string;
  }[];
}

interface ClearanceDecision {
  playerId: string;
  playerName: string;
  decision: 'cleared' | 'not_cleared' | 'conditional';
  clearanceLevel: string;
  restrictions?: string[];
  conditions?: string[];
  decidingOfficer: string;
  rationale: string;
  supportingData: {
    assessmentResults: any[];
    physicalMetrics: any[];
    psychologicalReadiness: number;
  };
}

interface ReturnToPlayWidgetProps {
  playerId?: string;
  teamId?: string;
}

// Mock data for demonstration
const mockProtocols: ReturnToPlayProtocol[] = [
  {
    id: 'protocol-1',
    playerId: 'player-1',
    playerName: 'John Smith',
    injuryType: 'Ankle Sprain',
    currentPhase: 'sport_specific',
    status: 'in_progress',
    clearanceLevel: 'limited_contact',
    progressPercentage: 65,
    daysSinceStart: 18,
    estimatedDaysRemaining: 12,
    nextMilestone: {
      name: 'Non-contact Training Clearance',
      targetDate: '2024-02-05',
      requirements: ['Full strength baseline', 'Sport-specific skills demonstrated', 'Pain-free movement']
    },
    assessments: [
      { date: '2024-01-25', type: 'Strength Test', result: 'pass', notes: '95% of baseline strength achieved' },
      { date: '2024-01-23', type: 'Range of Motion', result: 'pass', notes: 'Full ROM restored' },
      { date: '2024-01-20', type: 'Functional Movement', result: 'partial', notes: 'Minor compensations noted' }
    ]
  },
  {
    id: 'protocol-2',
    playerId: 'player-2',
    playerName: 'Mike Johnson',
    injuryType: 'Concussion',
    currentPhase: 'light_activity',
    status: 'in_progress',
    clearanceLevel: 'no_contact',
    progressPercentage: 40,
    daysSinceStart: 8,
    estimatedDaysRemaining: 6,
    nextMilestone: {
      name: 'Sport-specific Training',
      targetDate: '2024-02-01',
      requirements: ['Symptom-free for 48 hours', 'Cognitive testing passed', 'Medical clearance']
    },
    assessments: [
      { date: '2024-01-26', type: 'Cognitive Assessment', result: 'pass', notes: 'All cognitive tests within normal limits' },
      { date: '2024-01-24', type: 'Symptom Check', result: 'partial', notes: 'Mild headache reported after exercise' }
    ]
  }
];

const mockClearanceDecision: ClearanceDecision = {
  playerId: 'player-3',
  playerName: 'Sarah Davis',
  decision: 'cleared',
  clearanceLevel: 'full_contact',
  decidingOfficer: 'Dr. Thompson',
  rationale: 'Player has successfully completed all phases of the return-to-play protocol. All assessments show normal function with no restrictions needed.',
  supportingData: {
    assessmentResults: [
      { test: 'Strength Assessment', score: 98, baseline: 95 },
      { test: 'Functional Movement', score: 92, baseline: 90 },
      { test: 'Sport-specific Skills', score: 95, baseline: 93 }
    ],
    physicalMetrics: [
      { metric: 'Range of Motion', value: 100, unit: '% of baseline' },
      { metric: 'Strength', value: 103, unit: '% of baseline' },
      { metric: 'Power Output', value: 97, unit: '% of baseline' }
    ],
    psychologicalReadiness: 88
  }
};

export const ReturnToPlayWidget: React.FC<ReturnToPlayWidgetProps> = ({
  playerId,
  teamId
}) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [selectedView, setSelectedView] = useState<'active' | 'clearances' | 'templates'>('active');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'secondary';
      case 'in_progress': return 'default';
      case 'paused': return 'warning';
      case 'initiated': return 'outline';
      default: return 'default';
    }
  };

  const getClearanceLevelColor = (level: string) => {
    switch (level) {
      case 'game_ready': return 'secondary';
      case 'full_contact': return 'default';
      case 'limited_contact': return 'warning';
      case 'no_contact': return 'destructive';
      default: return 'outline';
    }
  };

  const getAssessmentIcon = (result: string) => {
    switch (result) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'partial': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const renderActiveProtocols = () => (
    <div className="space-y-6">
      {mockProtocols.map((protocol) => (
        <Card key={protocol.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {protocol.playerName} - {protocol.injuryType}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusColor(protocol.status)}>
                  {protocol.status.replace('_', ' ')}
                </Badge>
                <Badge variant={getClearanceLevelColor(protocol.clearanceLevel)}>
                  {protocol.clearanceLevel.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{protocol.progressPercentage}%</div>
                <div className="text-sm text-muted-foreground">Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{protocol.daysSinceStart}</div>
                <div className="text-sm text-muted-foreground">Days Since Start</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{protocol.estimatedDaysRemaining}</div>
                <div className="text-sm text-muted-foreground">Days Remaining</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{protocol.currentPhase.replace('_', ' ')}</div>
                <div className="text-sm text-muted-foreground">Current Phase</div>
              </div>
            </div>

            <Progress value={protocol.progressPercentage} className="h-3" />

            {/* Next Milestone */}
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium">Next Milestone: {protocol.nextMilestone.name}</h4>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Target Date: {new Date(protocol.nextMilestone.targetDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <h5 className="text-sm font-medium mb-2">Requirements:</h5>
                  <div className="space-y-1">
                    {protocol.nextMilestone.requirements.map((req, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Assessments */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Assessments
              </h4>
              <div className="space-y-2">
                {protocol.assessments.map((assessment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getAssessmentIcon(assessment.result)}
                      <div>
                        <div className="font-medium">{assessment.type}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(assessment.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={assessment.result === 'pass' ? 'secondary' : 
                                   assessment.result === 'fail' ? 'destructive' : 'warning'}>
                        {assessment.result}
                      </Badge>
                      {assessment.notes && (
                        <div className="text-xs text-muted-foreground mt-1 max-w-xs">
                          {assessment.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-4 border-t">
              <Button size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Record Assessment
              </Button>
              <Button size="sm" variant="outline">
                <Target className="h-4 w-4 mr-2" />
                Advance Phase
              </Button>
              <Button size="sm" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Session
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {mockProtocols.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Protocols</h3>
            <p className="text-muted-foreground mb-4">
              No return-to-play protocols are currently active for this {playerId ? 'player' : 'team'}.
            </p>
            <Button>
              <Target className="h-4 w-4 mr-2" />
              Create New Protocol
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderClearanceDecisions = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Recent Clearance Decision
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Decision Overview */}
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <h4 className="font-medium text-green-800">{mockClearanceDecision.playerName}</h4>
                <p className="text-sm text-green-700">Cleared for {mockClearanceDecision.clearanceLevel.replace('_', ' ')}</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {mockClearanceDecision.decision.toUpperCase()}
            </Badge>
          </div>

          {/* Decision Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Supporting Data */}
            <div>
              <h4 className="font-medium mb-3">Supporting Assessment Data</h4>
              <div className="space-y-3">
                {mockClearanceDecision.supportingData.assessmentResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">{result.test}</span>
                    <div className="text-right">
                      <div className="font-medium">{result.score}%</div>
                      <div className="text-xs text-muted-foreground">Baseline: {result.baseline}%</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <h5 className="font-medium mb-2">Physical Metrics</h5>
                <div className="space-y-2">
                  {mockClearanceDecision.supportingData.physicalMetrics.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{metric.metric}</span>
                      <span className="font-medium">{metric.value}{metric.unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Psychological Readiness</span>
                  <span className="font-medium">{mockClearanceDecision.supportingData.psychologicalReadiness}%</span>
                </div>
                <Progress value={mockClearanceDecision.supportingData.psychologicalReadiness} className="h-2" />
              </div>
            </div>

            {/* Decision Rationale */}
            <div>
              <h4 className="font-medium mb-3">Medical Officer Decision</h4>
              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground mb-1">Deciding Officer</h5>
                  <p className="font-medium">{mockClearanceDecision.decidingOfficer}</p>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground mb-1">Rationale</h5>
                  <p className="text-sm leading-relaxed">{mockClearanceDecision.rationale}</p>
                </div>

                {mockClearanceDecision.restrictions && mockClearanceDecision.restrictions.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-muted-foreground mb-1">Restrictions</h5>
                    <div className="space-y-1">
                      {mockClearanceDecision.restrictions.map((restriction, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <AlertTriangle className="h-3 w-3 text-yellow-600" />
                          <span>{restriction}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {mockClearanceDecision.conditions && mockClearanceDecision.conditions.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-muted-foreground mb-1">Conditions</h5>
                    <div className="space-y-1">
                      {mockClearanceDecision.conditions.map((condition, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span>{condition}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTemplates = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Protocol Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Protocol Templates</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-4">
              Pre-built return-to-play protocol templates for common injuries and sport-specific requirements.
            </p>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Browse Templates
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Return-to-Play Management</h3>
          <p className="text-muted-foreground">
            Comprehensive return-to-play protocol tracking and clearance management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={selectedView === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('active')}
          >
            <Activity className="h-4 w-4 mr-2" />
            Active Protocols
          </Button>
          <Button
            variant={selectedView === 'clearances' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('clearances')}
          >
            <Award className="h-4 w-4 mr-2" />
            Clearances
          </Button>
          <Button
            variant={selectedView === 'templates' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('templates')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </Button>
        </div>
      </div>

      {/* Content */}
      {selectedView === 'active' && renderActiveProtocols()}
      {selectedView === 'clearances' && renderClearanceDecisions()}
      {selectedView === 'templates' && renderTemplates()}
    </div>
  );
};