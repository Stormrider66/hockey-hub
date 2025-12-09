import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading';
import { AlertTriangle, Shield, Users, TrendingUp, Activity, Target, Eye } from 'lucide-react';
import { LightweightBarChart, LightweightPieChart, LightweightLineChart } from '../charts';

interface PlayerRiskProfile {
  playerId: string;
  playerName: string;
  position: string;
  overallRisk: number;
  riskCategory: 'low' | 'moderate' | 'high' | 'critical';
  primaryRisks: string[];
  lastAssessment: Date;
  trendDirection: 'improving' | 'stable' | 'worsening';
}

interface InjuryRiskDashboardProps {
  teamId?: string;
  organizationId: string;
  className?: string;
}

export function InjuryRiskDashboard({ 
  teamId, 
  organizationId, 
  className = '' 
}: InjuryRiskDashboardProps) {
  const [playerProfiles, setPlayerProfiles] = useState<PlayerRiskProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock team risk data
  const mockPlayerProfiles: PlayerRiskProfile[] = [
    {
      playerId: 'player1',
      playerName: 'Sidney Crosby',
      position: 'C',
      overallRisk: 78,
      riskCategory: 'high',
      primaryRisks: ['Groin strain', 'Concussion history'],
      lastAssessment: new Date(Date.now() - 2 * 60 * 60 * 1000),
      trendDirection: 'worsening'
    },
    {
      playerId: 'player2',
      playerName: 'Connor McDavid',
      position: 'C',
      overallRisk: 45,
      riskCategory: 'moderate',
      primaryRisks: ['Knee strain', 'High training load'],
      lastAssessment: new Date(Date.now() - 1 * 60 * 60 * 1000),
      trendDirection: 'stable'
    },
    {
      playerId: 'player3',
      playerName: 'Nathan MacKinnon',
      position: 'C',
      overallRisk: 32,
      riskCategory: 'low',
      primaryRisks: ['Shoulder impingement'],
      lastAssessment: new Date(Date.now() - 30 * 60 * 1000),
      trendDirection: 'improving'
    },
    {
      playerId: 'player4',
      playerName: 'Leon Draisaitl',
      position: 'C',
      overallRisk: 62,
      riskCategory: 'moderate',
      primaryRisks: ['Back strain', 'Fatigue accumulation'],
      lastAssessment: new Date(Date.now() - 45 * 60 * 1000),
      trendDirection: 'stable'
    },
    {
      playerId: 'player5',
      playerName: 'Auston Matthews',
      position: 'C',
      overallRisk: 25,
      riskCategory: 'low',
      primaryRisks: ['Ankle mobility'],
      lastAssessment: new Date(Date.now() - 3 * 60 * 60 * 1000),
      trendDirection: 'improving'
    }
  ];

  // Dashboard statistics
  const dashboardStats = {
    totalPlayers: mockPlayerProfiles.length,
    highRiskPlayers: mockPlayerProfiles.filter(p => p.riskCategory === 'high' || p.riskCategory === 'critical').length,
    averageRisk: Math.round(mockPlayerProfiles.reduce((sum, p) => sum + p.overallRisk, 0) / mockPlayerProfiles.length),
    trendsImproving: mockPlayerProfiles.filter(p => p.trendDirection === 'improving').length
  };

  // Risk distribution data for pie chart
  const riskDistribution = [
    { name: 'Low Risk', value: mockPlayerProfiles.filter(p => p.riskCategory === 'low').length, color: '#10b981' },
    { name: 'Moderate Risk', value: mockPlayerProfiles.filter(p => p.riskCategory === 'moderate').length, color: '#f59e0b' },
    { name: 'High Risk', value: mockPlayerProfiles.filter(p => p.riskCategory === 'high').length, color: '#ef4444' },
    { name: 'Critical Risk', value: mockPlayerProfiles.filter(p => p.riskCategory === 'critical').length, color: '#7c2d12' }
  ];

  // Common injury types data
  const commonInjuries = [
    { type: 'Groin strain', count: 3, severity: 'High' },
    { type: 'Knee injury', count: 2, severity: 'High' },
    { type: 'Shoulder impingement', count: 2, severity: 'Moderate' },
    { type: 'Back strain', count: 1, severity: 'Moderate' },
    { type: 'Ankle mobility', count: 1, severity: 'Low' }
  ];

  useEffect(() => {
    const fetchPlayerProfiles = async () => {
      setLoading(true);
      try {
        // In production, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setPlayerProfiles(mockPlayerProfiles);
      } catch (err) {
        setError('Failed to load player risk profiles');
        console.error('Error fetching player profiles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerProfiles();
  }, [teamId, organizationId]);

  const filteredPlayers = playerProfiles.filter(player => {
    if (selectedRiskLevel !== 'all' && player.riskCategory !== selectedRiskLevel) return false;
    if (selectedPosition !== 'all' && player.position !== selectedPosition) return false;
    return true;
  });

  const getRiskColor = (category: string) => {
    switch (category) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-red-500 text-white';
      case 'moderate': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'worsening': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Team Injury Risk Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <LoadingSpinner size={48} className="mx-auto mb-4" />
              <p className="text-muted-foreground">Loading injury risk data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Dashboard Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Total Players</span>
            </div>
            <span className="text-2xl font-bold">{dashboardStats.totalPlayers}</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">High Risk</span>
            </div>
            <span className="text-2xl font-bold text-red-600">{dashboardStats.highRiskPlayers}</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Average Risk</span>
            </div>
            <span className="text-2xl font-bold">{dashboardStats.averageRisk}%</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Improving</span>
            </div>
            <span className="text-2xl font-bold text-green-600">{dashboardStats.trendsImproving}</span>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="prevention">Prevention</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <LightweightPieChart
                    data={riskDistribution}
                    innerRadius={0.6}
                    showLabels={false}
                    height={256}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {riskDistribution.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Common Injury Types */}
            <Card>
              <CardHeader>
                <CardTitle>Common Risk Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <LightweightBarChart
                    data={commonInjuries}
                    dataKey="count"
                    showGrid={true}
                    height={256}
                    barColor="#3b82f6"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="players" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Player Risk Profiles</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Risk Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Positions</SelectItem>
                      <SelectItem value="C">Center</SelectItem>
                      <SelectItem value="LW">Left Wing</SelectItem>
                      <SelectItem value="RW">Right Wing</SelectItem>
                      <SelectItem value="D">Defense</SelectItem>
                      <SelectItem value="G">Goalie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlayers.map((player) => (
                  <Card key={player.playerId} className="relative">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{player.playerName}</h3>
                          <p className="text-sm text-gray-600">{player.position}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(player.trendDirection)}
                          <Badge className={getRiskColor(player.riskCategory)}>
                            {player.riskCategory.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Risk Score</span>
                            <span className="font-bold">{player.overallRisk}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                player.overallRisk >= 70 ? 'bg-red-500' :
                                player.overallRisk >= 50 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${player.overallRisk}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <span className="text-sm font-medium">Primary Risks:</span>
                          <div className="mt-1 space-y-1">
                            {player.primaryRisks.slice(0, 2).map((risk, index) => (
                              <Badge key={index} variant="outline" className="text-xs mr-1">
                                {risk}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="text-xs text-gray-500">
                          Last assessed: {player.lastAssessment.toLocaleString()}
                        </div>

                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Trend Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-600 py-8">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Detailed analytics coming soon...</p>
                  <p className="text-sm">This will include trend analysis, correlations, and predictive modeling.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="prevention" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Prevention Strategies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-600 py-8">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Prevention protocols coming soon...</p>
                  <p className="text-sm">This will include team-wide prevention programs and protocols.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}