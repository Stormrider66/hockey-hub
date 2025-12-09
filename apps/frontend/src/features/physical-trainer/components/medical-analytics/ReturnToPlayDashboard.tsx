'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Download,
  Eye,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Heart,
  Brain,
  Zap,
  Shield
} from 'lucide-react';

export interface ReturnToPlayProtocol {
  protocolId: string;
  playerId: string;
  playerName: string;
  injuryId: string;
  injuryType: string;
  currentPhase: string;
  status: 'in_progress' | 'completed' | 'paused' | 'cancelled';
  startDate: string;
  expectedCompletionDate: string;
  actualCompletionDate?: string;
  completionPercentage: number;
  clearanceLevel: 'full' | 'limited' | 'restricted' | 'no_clearance';
  complianceScore: number;
  
  phases: Array<{
    phase: string;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    requirements: Array<{
      requirementId: string;
      description: string;
      type: 'medical' | 'functional' | 'performance' | 'psychological';
      isMet: boolean;
      assessmentDate?: string;
      notes?: string;
    }>;
  }>;
  
  assessments: Array<{
    assessmentId: string;
    assessmentDate: string;
    assessor: string;
    clearanceLevel: string;
    medicalClearance: {
      structuralHealing: string;
      painLevel: number;
      rangeOfMotion: number;
      strength: number;
    };
    performanceTesting: {
      functionalTests: Array<{
        testName: string;
        result: number;
        percentageOfBaseline: number;
        status: 'pass' | 'fail' | 'marginal';
      }>;
    };
    psychologicalReadiness: {
      fearOfReinjury: number;
      confidenceLevel: number;
      motivationLevel: number;
      overallReadiness: number;
    };
    recommendations: string[];
  }>;
  
  timeline: Array<{
    date: string;
    event: string;
    type: 'milestone' | 'assessment' | 'setback' | 'modification';
    description: string;
  }>;
}

export interface ClearanceWorkflow {
  workflowId: string;
  playerId: string;
  playerName: string;
  injuryType: string;
  currentPhase: string;
  progressMetrics: {
    overallCompletion: number;
    medicalProgress: number;
    functionalProgress: number;
    performanceProgress: number;
    psychologicalProgress: number;
    estimatedDaysToCompletion: number;
  };
  automatedChecks: Array<{
    checkId: string;
    description: string;
    frequency: string;
    lastRun: string;
    nextRun: string;
    status: 'pending' | 'passed' | 'failed' | 'warning';
  }>;
  alerts: Array<{
    alertId: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    createdAt: string;
    actionRequired: boolean;
  }>;
}

export interface ReturnToPlayDashboardProps {
  teamId?: string;
  playerId?: string;
}

// Mock data generators
const generateMockProtocols = (): ReturnToPlayProtocol[] => {
  const phases = ['rest', 'light_activity', 'sport_specific_training', 'non_contact_training', 'full_contact_practice'];
  const injuryTypes = ['Muscle Strain', 'Joint Sprain', 'Concussion', 'Shoulder Injury', 'Knee Injury'];
  const playerNames = ['Sidney Crosby', 'Nathan MacKinnon', 'Connor McDavid', 'Leon Draisaitl', 'Erik Karlsson'];
  
  return Array.from({ length: 5 }, (_, index) => {
    const injuryType = injuryTypes[index % injuryTypes.length];
    const currentPhase = phases[Math.floor(Math.random() * phases.length)];
    const status = ['in_progress', 'completed', 'paused'][Math.floor(Math.random() * 3)] as any;
    
    return {
      protocolId: `protocol-${index + 1}`,
      playerId: `player-${index + 1}`,
      playerName: playerNames[index],
      injuryId: `injury-${index + 1}`,
      injuryType,
      currentPhase,
      status,
      startDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      expectedCompletionDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      actualCompletionDate: status === 'completed' ? new Date().toISOString() : undefined,
      completionPercentage: Math.floor(Math.random() * 100),
      clearanceLevel: ['full', 'limited', 'restricted', 'no_clearance'][Math.floor(Math.random() * 4)] as any,
      complianceScore: Math.floor(Math.random() * 30) + 70,
      
      phases: phases.map(phase => ({
        phase,
        status: phases.indexOf(phase) <= phases.indexOf(currentPhase) ? 'completed' : 'pending' as any,
        requirements: [
          {
            requirementId: `req-${phase}-1`,
            description: `Complete ${phase.replace('_', ' ')} requirements`,
            type: 'functional' as const,
            isMet: phases.indexOf(phase) < phases.indexOf(currentPhase)
          },
          {
            requirementId: `req-${phase}-2`,
            description: `Medical clearance for ${phase.replace('_', ' ')}`,
            type: 'medical' as const,
            isMet: phases.indexOf(phase) < phases.indexOf(currentPhase)
          }
        ]
      })),
      
      assessments: [
        {
          assessmentId: `assessment-${index + 1}`,
          assessmentDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          assessor: 'Dr. Sarah Johnson',
          clearanceLevel: 'limited',
          medicalClearance: {
            structuralHealing: 'good',
            painLevel: Math.floor(Math.random() * 5) + 1,
            rangeOfMotion: Math.floor(Math.random() * 30) + 70,
            strength: Math.floor(Math.random() * 30) + 70
          },
          performanceTesting: {
            functionalTests: [
              {
                testName: 'Single Leg Hop',
                result: 85,
                percentageOfBaseline: 88,
                status: 'marginal' as const
              },
              {
                testName: 'Y-Balance Test',
                result: 92,
                percentageOfBaseline: 95,
                status: 'pass' as const
              }
            ]
          },
          psychologicalReadiness: {
            fearOfReinjury: Math.floor(Math.random() * 50) + 20,
            confidenceLevel: Math.floor(Math.random() * 40) + 60,
            motivationLevel: Math.floor(Math.random() * 30) + 70,
            overallReadiness: Math.floor(Math.random() * 40) + 60
          },
          recommendations: [
            'Continue current rehabilitation protocol',
            'Gradual increase in sport-specific activities',
            'Monitor for pain or setbacks'
          ]
        }
      ],
      
      timeline: [
        {
          date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          event: 'Protocol Initiated',
          type: 'milestone',
          description: 'Return-to-play protocol started following injury assessment'
        },
        {
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          event: 'Phase 1 Complete',
          type: 'milestone',
          description: 'Rest phase completed, cleared for light activity'
        },
        {
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          event: 'Assessment',
          type: 'assessment',
          description: 'Weekly progress assessment conducted'
        }
      ]
    };
  });
};

const generateMockWorkflows = (): ClearanceWorkflow[] => {
  return Array.from({ length: 3 }, (_, index) => ({
    workflowId: `workflow-${index + 1}`,
    playerId: `player-${index + 1}`,
    playerName: `Player ${index + 1}`,
    injuryType: 'Muscle Strain',
    currentPhase: 'sport_specific_training',
    progressMetrics: {
      overallCompletion: Math.floor(Math.random() * 50) + 40,
      medicalProgress: Math.floor(Math.random() * 30) + 70,
      functionalProgress: Math.floor(Math.random() * 40) + 50,
      performanceProgress: Math.floor(Math.random() * 50) + 30,
      psychologicalProgress: Math.floor(Math.random() * 40) + 50,
      estimatedDaysToCompletion: Math.floor(Math.random() * 21) + 7
    },
    automatedChecks: [
      {
        checkId: 'pain-monitoring',
        description: 'Daily pain level monitoring',
        frequency: 'Daily',
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        status: 'passed'
      },
      {
        checkId: 'compliance-check',
        description: 'Rehabilitation compliance monitoring',
        frequency: 'Weekly',
        lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'warning'
      }
    ],
    alerts: [
      {
        alertId: 'alert-1',
        severity: 'warning',
        message: 'Compliance rate below target threshold',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        actionRequired: true
      }
    ]
  }));
};

export const ReturnToPlayDashboard: React.FC<ReturnToPlayDashboardProps> = ({
  teamId,
  playerId
}) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [activeTab, setActiveTab] = useState('protocols');
  const [protocols] = useState<ReturnToPlayProtocol[]>(generateMockProtocols);
  const [workflows] = useState<ClearanceWorkflow[]>(generateMockWorkflows);
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getClearanceColor = (level: string) => {
    switch (level) {
      case 'full': return 'bg-green-100 text-green-800';
      case 'limited': return 'bg-yellow-100 text-yellow-800';
      case 'restricted': return 'bg-orange-100 text-orange-800';
      case 'no_clearance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPhaseIcon = (type: string) => {
    switch (type) {
      case 'medical': return <Heart className="h-4 w-4 text-red-600" />;
      case 'functional': return <Activity className="h-4 w-4 text-blue-600" />;
      case 'performance': return <Zap className="h-4 w-4 text-purple-600" />;
      case 'psychological': return <Brain className="h-4 w-4 text-green-600" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const filteredProtocols = protocols.filter(protocol => 
    filterStatus === 'all' || protocol.status === filterStatus
  );

  const renderProtocolCard = (protocol: ReturnToPlayProtocol) => (
    <Card 
      key={protocol.protocolId}
      className={`cursor-pointer transition-all hover:shadow-lg ${
        selectedProtocol === protocol.protocolId ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => setSelectedProtocol(
        protocol.protocolId === selectedProtocol ? null : protocol.protocolId
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {protocol.playerName}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(protocol.status)}>
              {protocol.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge className={getClearanceColor(protocol.clearanceLevel)}>
              {protocol.clearanceLevel.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Injury Type:</span>
            <div className="font-semibold">{protocol.injuryType}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Current Phase:</span>
            <div className="font-semibold">{protocol.currentPhase.replace('_', ' ')}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Start Date:</span>
            <div className="font-semibold">
              {new Date(protocol.startDate).toLocaleDateString()}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Expected Completion:</span>
            <div className="font-semibold">
              {new Date(protocol.expectedCompletionDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{protocol.completionPercentage}%</span>
          </div>
          <Progress value={protocol.completionPercentage} className="w-full" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-muted-foreground">Compliance Score:</span>
            <div className="flex items-center gap-2">
              <Progress value={protocol.complianceScore} className="flex-1" />
              <span className="text-sm font-medium">{protocol.complianceScore}%</span>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm">
              <Eye className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Phase Progress */}
        <div>
          <h4 className="text-sm font-medium mb-2">Phase Progress</h4>
          <div className="flex items-center gap-1">
            {protocol.phases.map((phase, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  phase.status === 'completed' ? 'bg-green-500 text-white' :
                  phase.status === 'in_progress' ? 'bg-blue-500 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {phase.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs text-muted-foreground mt-1 text-center">
                  {phase.phase.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Assessment */}
        {protocol.assessments.length > 0 && (
          <div className="border-t pt-3">
            <h4 className="text-sm font-medium mb-2">Latest Assessment</h4>
            <div className="text-sm text-muted-foreground">
              {new Date(protocol.assessments[0].assessmentDate).toLocaleDateString()} by {protocol.assessments[0].assessor}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
              <div>
                <span className="text-muted-foreground">Pain Level:</span>
                <div className="font-semibold">{protocol.assessments[0].medicalClearance.painLevel}/10</div>
              </div>
              <div>
                <span className="text-muted-foreground">ROM:</span>
                <div className="font-semibold">{protocol.assessments[0].medicalClearance.rangeOfMotion}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Strength:</span>
                <div className="font-semibold">{protocol.assessments[0].medicalClearance.strength}%</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderDetailedProtocol = () => {
    const protocol = protocols.find(p => p.protocolId === selectedProtocol);
    if (!protocol) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{protocol.playerName} - Detailed Protocol</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Play className="h-4 w-4" />
                Continue
              </Button>
              <Button variant="outline" size="sm">
                <Pause className="h-4 w-4" />
                Pause
              </Button>
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4" />
                Modify
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="phases">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="phases">Phases</TabsTrigger>
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
            </TabsList>

            <TabsContent value="phases" className="space-y-4">
              {protocol.phases.map((phase, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium capitalize">{phase.phase.replace('_', ' ')}</h4>
                      <Badge className={getStatusColor(phase.status)}>
                        {phase.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {phase.requirements.map((req, reqIndex) => (
                        <div key={reqIndex} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div className="flex items-center gap-2">
                            {getPhaseIcon(req.type)}
                            <span className="text-sm">{req.description}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={req.isMet ? 'default' : 'secondary'}>
                              {req.isMet ? 'Met' : 'Pending'}
                            </Badge>
                            {req.isMet ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="assessments" className="space-y-4">
              {protocol.assessments.map((assessment, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium">Assessment {index + 1}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(assessment.assessmentDate).toLocaleDateString()} by {assessment.assessor}
                        </p>
                      </div>
                      <Badge className={getClearanceColor(assessment.clearanceLevel)}>
                        {assessment.clearanceLevel}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div>
                        <h5 className="font-medium mb-3 flex items-center gap-2">
                          <Heart className="h-4 w-4 text-red-600" />
                          Medical Clearance
                        </h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Structural Healing:</span>
                            <span className="font-medium">{assessment.medicalClearance.structuralHealing}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pain Level:</span>
                            <span className="font-medium">{assessment.medicalClearance.painLevel}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Range of Motion:</span>
                            <span className="font-medium">{assessment.medicalClearance.rangeOfMotion}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Strength:</span>
                            <span className="font-medium">{assessment.medicalClearance.strength}%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium mb-3 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-purple-600" />
                          Performance Testing
                        </h5>
                        <div className="space-y-2">
                          {assessment.performanceTesting.functionalTests.map((test, testIndex) => (
                            <div key={testIndex} className="text-sm">
                              <div className="flex justify-between items-center">
                                <span>{test.testName}:</span>
                                <Badge variant={
                                  test.status === 'pass' ? 'default' : 
                                  test.status === 'marginal' ? 'secondary' : 'destructive'
                                }>
                                  {test.status}
                                </Badge>
                              </div>
                              <div className="text-muted-foreground">
                                {test.result} ({test.percentageOfBaseline}% of baseline)
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium mb-3 flex items-center gap-2">
                          <Brain className="h-4 w-4 text-green-600" />
                          Psychological Readiness
                        </h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Fear of Reinjury:</span>
                            <span className="font-medium">{assessment.psychologicalReadiness.fearOfReinjury}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Confidence Level:</span>
                            <span className="font-medium">{assessment.psychologicalReadiness.confidenceLevel}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Motivation:</span>
                            <span className="font-medium">{assessment.psychologicalReadiness.motivationLevel}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Overall Readiness:</span>
                            <span className="font-medium">{assessment.psychologicalReadiness.overallReadiness}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {assessment.recommendations.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h5 className="font-medium mb-2">Recommendations</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {assessment.recommendations.map((rec, recIndex) => (
                            <li key={recIndex} className="flex items-start gap-2">
                              <span className="text-blue-600">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <div className="space-y-3">
                {protocol.timeline.map((event, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full mt-1 ${
                      event.type === 'milestone' ? 'bg-green-500' :
                      event.type === 'assessment' ? 'bg-blue-500' :
                      event.type === 'setback' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{event.event}</h4>
                        <span className="text-sm text-muted-foreground">
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="requirements" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['medical', 'functional', 'performance', 'psychological'].map(type => {
                  const requirements = protocol.phases.flatMap(phase => 
                    phase.requirements.filter(req => req.type === type)
                  );
                  
                  return (
                    <Card key={type}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 capitalize">
                          {getPhaseIcon(type)}
                          {type} Requirements
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {requirements.map((req, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <span className="text-sm">{req.description}</span>
                              {req.isMet ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Clock className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          ))}
                          {requirements.length === 0 && (
                            <p className="text-sm text-muted-foreground">No requirements for this category</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  };

  const renderWorkflowOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {workflows.map((workflow) => (
          <Card key={workflow.workflowId}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {workflow.playerName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Injury Type:</span>
                <div className="font-semibold">{workflow.injuryType}</div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Progress Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Overall</span>
                    <span className="text-xs">{workflow.progressMetrics.overallCompletion}%</span>
                  </div>
                  <Progress value={workflow.progressMetrics.overallCompletion} />
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Medical: {workflow.progressMetrics.medicalProgress}%</div>
                    <div>Functional: {workflow.progressMetrics.functionalProgress}%</div>
                    <div>Performance: {workflow.progressMetrics.performanceProgress}%</div>
                    <div>Psychological: {workflow.progressMetrics.psychologicalProgress}%</div>
                  </div>
                </div>
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">Est. Completion:</span>
                <div className="font-semibold">{workflow.progressMetrics.estimatedDaysToCompletion} days</div>
              </div>

              {workflow.alerts.length > 0 && (
                <div className="space-y-1">
                  {workflow.alerts.map((alert, index) => (
                    <div key={index} className={`p-2 rounded text-xs ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {alert.message}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="h-6 w-6 text-green-600" />
            Return-to-Play Dashboard
          </h3>
          <p className="text-muted-foreground">
            Comprehensive clearance workflow management and monitoring
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Protocols</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Protocols</p>
                <p className="text-2xl font-bold">
                  {protocols.filter(p => p.status === 'in_progress').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {protocols.filter(p => p.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Full Clearance</p>
                <p className="text-2xl font-bold text-green-600">
                  {protocols.filter(p => p.clearanceLevel === 'full').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Compliance</p>
                <p className="text-2xl font-bold">
                  {Math.round(protocols.reduce((sum, p) => sum + p.complianceScore, 0) / protocols.length)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Progress</p>
                <p className="text-2xl font-bold">
                  {Math.round(protocols.reduce((sum, p) => sum + p.completionPercentage, 0) / protocols.length)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="protocols" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Protocols
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center gap-1">
            <Settings className="h-4 w-4" />
            Workflows
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="protocols" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredProtocols.map(renderProtocolCard)}
            </div>
            
            {selectedProtocol && renderDetailedProtocol()}
          </TabsContent>

          <TabsContent value="workflows">
            {renderWorkflowOverview()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};