import React, { useState, useEffect } from 'react';
import { Users, Target, TrendingUp, AlertTriangle, Lightbulb, BarChart3, Shield, Brain } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TeamCompositionDashboardProps {
  teamId: string;
  organizationId: string;
  onRecommendationSelect?: (recommendation: any) => void;
}

interface TeamCompositionAnalysis {
  teamId: string;
  analysisDate: Date;
  overallBalance: {
    overall: number;
    offensive: number;
    defensive: number;
    physical: number;
    mental: number;
    experience: number;
    depth: number;
    chemistry: number;
  };
  positionAnalysis: Array<{
    position: string;
    playerCount: number;
    averageRating: number;
    depthScore: number;
    qualityScore: number;
    gaps: string[];
    strengths: string[];
  }>;
  recommendations: Array<{
    id: string;
    category: string;
    priority: string;
    title: string;
    description: string;
    expectedImpact: number;
    confidence: number;
  }>;
  skillGaps: Array<{
    skill: string;
    currentLevel: number;
    targetLevel: number;
    gap: number;
    priority: string;
  }>;
}

const TeamCompositionDashboard: React.FC<TeamCompositionDashboardProps> = ({
  teamId,
  organizationId,
  onRecommendationSelect
}) => {
  const { t } = useTranslation('physicalTrainer');
  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState<TeamCompositionAnalysis | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'positions' | 'recommendations' | 'gaps'>('overview');

  useEffect(() => {
    loadTeamComposition();
  }, [teamId]);

  const loadTeamComposition = async () => {
    setIsLoading(true);
    try {
      // Mock data loading
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockAnalysis: TeamCompositionAnalysis = {
        teamId,
        analysisDate: new Date(),
        overallBalance: {
          overall: 78,
          offensive: 82,
          defensive: 74,
          physical: 80,
          mental: 76,
          experience: 72,
          depth: 85,
          chemistry: 79
        },
        positionAnalysis: [
          {
            position: 'Forward',
            playerCount: 14,
            averageRating: 82,
            depthScore: 88,
            qualityScore: 85,
            gaps: ['Power forward depth', 'Left wing scoring'],
            strengths: ['Center depth', 'Young talent']
          },
          {
            position: 'Defense',
            playerCount: 8,
            averageRating: 79,
            depthScore: 75,
            qualityScore: 80,
            gaps: ['Right-handed defensemen', 'Offensive production'],
            strengths: ['Defensive reliability', 'Physical play']
          },
          {
            position: 'Goalie',
            playerCount: 3,
            averageRating: 84,
            depthScore: 90,
            qualityScore: 87,
            gaps: [],
            strengths: ['Elite starter', 'Strong backup']
          }
        ],
        recommendations: [
          {
            id: 'rec-001',
            category: 'acquisition',
            priority: 'high',
            title: 'Add Right-Handed Defenseman',
            description: 'Current roster has imbalance with only 2 right-handed defensemen. Adding depth would improve defensive pairings.',
            expectedImpact: 15,
            confidence: 88
          },
          {
            id: 'rec-002',
            category: 'development',
            priority: 'medium',
            title: 'Develop Young Forward Prospects',
            description: 'Focus on developing 3 forward prospects to address future depth concerns.',
            expectedImpact: 20,
            confidence: 82
          },
          {
            id: 'rec-003',
            category: 'chemistry',
            priority: 'medium',
            title: 'Optimize Line Combinations',
            description: 'Current chemistry analysis suggests 2nd line could benefit from different player combinations.',
            expectedImpact: 12,
            confidence: 75
          }
        ],
        skillGaps: [
          {
            skill: 'Shooting Power',
            currentLevel: 72,
            targetLevel: 80,
            gap: 8,
            priority: 'high'
          },
          {
            skill: 'Defensive Positioning',
            currentLevel: 74,
            targetLevel: 82,
            gap: 8,
            priority: 'high'
          },
          {
            skill: 'Faceoff Success',
            currentLevel: 78,
            targetLevel: 83,
            gap: 5,
            priority: 'medium'
          }
        ]
      };

      setAnalysis(mockAnalysis);
    } catch (error) {
      console.error('Failed to load team composition analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 65) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-green-100';
    if (score >= 75) return 'bg-blue-100';
    if (score >= 65) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Failed to load team composition analysis. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            Team Composition Analysis
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            AI-powered analysis of team balance, depth, and optimization opportunities
          </p>
        </div>
        <Badge variant="outline" className="bg-indigo-100 text-indigo-800">
          Last analyzed: {analysis.analysisDate.toLocaleDateString()}
        </Badge>
      </div>

      {/* Balance Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(analysis.overallBalance).map(([key, value]) => (
          <Card key={key}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium capitalize">{key}</span>
                <span className={`text-lg font-bold ${getScoreColor(value)}`}>{value}%</span>
              </div>
              <Progress value={value} className="h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="positions">Position Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="gaps">Skill Gaps</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Balance Radar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Team Balance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analysis.overallBalance).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize min-w-[100px]">{key}</span>
                      <div className="flex-1 mx-4">
                        <Progress value={value} className="h-3" />
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getScoreBg(value)} ${getScoreColor(value)}`}>
                        {value}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert className="border-green-200 bg-green-50">
                    <Lightbulb className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Strength:</strong> Excellent depth at forward position with strong young talent pipeline.
                    </AlertDescription>
                  </Alert>
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      <strong>Concern:</strong> Defense lacks right-handed options, limiting pairing flexibility.
                    </AlertDescription>
                  </Alert>
                  <Alert className="border-blue-200 bg-blue-50">
                    <Target className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Opportunity:</strong> Team chemistry could improve by 10-15% with optimized line combinations.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Position Analysis Tab */}
        <TabsContent value="positions" className="mt-6">
          <div className="space-y-4">
            {analysis.positionAnalysis.map(position => (
              <Card key={position.position}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{position.position}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{position.playerCount} players</Badge>
                      <Badge className={getScoreBg(position.averageRating)}>
                        Avg: {position.averageRating}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold">{position.depthScore}%</div>
                      <div className="text-sm text-gray-600">Depth Score</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold">{position.qualityScore}%</div>
                      <div className="text-sm text-gray-600">Quality Score</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold">{position.averageRating}</div>
                      <div className="text-sm text-gray-600">Average Rating</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {position.strengths.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-700 mb-2">Strengths</h4>
                        <ul className="space-y-1">
                          {position.strengths.map((strength, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {position.gaps.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-700 mb-2">Gaps</h4>
                        <ul className="space-y-1">
                          {position.gaps.map((gap, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                              {gap}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="mt-6">
          <div className="space-y-4">
            {analysis.recommendations.map(rec => (
              <Card key={rec.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">{rec.title}</h4>
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority} priority
                        </Badge>
                        <Badge variant="outline">
                          {rec.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                      <div className="flex items-center gap-6 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Impact: +{rec.expectedImpact}%
                        </span>
                        <span className="flex items-center gap-1">
                          <Brain className="h-3 w-3" />
                          Confidence: {rec.confidence}%
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRecommendationSelect?.(rec)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Skill Gaps Tab */}
        <TabsContent value="gaps" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Skill Gap Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.skillGaps.map(gap => (
                  <div key={gap.skill} className="border-b pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{gap.skill}</h4>
                      <Badge className={getPriorityColor(gap.priority)}>
                        {gap.priority} priority
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-2">
                      <div>
                        <span className="text-xs text-gray-600">Current Level</span>
                        <div className="text-lg font-bold">{gap.currentLevel}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">Target Level</span>
                        <div className="text-lg font-bold">{gap.targetLevel}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">Gap</span>
                        <div className="text-lg font-bold text-red-600">-{gap.gap}</div>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress value={(gap.currentLevel / gap.targetLevel) * 100} className="h-3" />
                      <div 
                        className="absolute top-0 h-3 w-0.5 bg-red-600"
                        style={{ left: `${(gap.targetLevel / 100) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamCompositionDashboard;