'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Target, Activity, Zap } from 'lucide-react';
import { useTestData, useTestStatistics, type TestResult, type Player } from '@/hooks/useTestData';
import { useGetTestAnalyticsQuery, useGetPlayerTrendsQuery } from '@/store/api/statisticsApi';

interface PhysicalAnalysisChartsProps {
  playerId?: string;
  testBatchId?: number;
  className?: string;
}

export default function PhysicalAnalysisCharts({ 
  playerId, 
  testBatchId,
  className 
}: PhysicalAnalysisChartsProps) {
  const { players, testBatches, testResults, isLoading } = useTestData();
  const [selectedMetric, setSelectedMetric] = React.useState('all');
  const [selectedPlayer, setSelectedPlayer] = React.useState(playerId || 'all');
  const [selectedBatch, setSelectedBatch] = React.useState(testBatchId?.toString() || 'all');
  
  // Fetch analytics from API when available
  const { data: apiAnalytics } = useGetTestAnalyticsQuery({
    teamId: undefined, // Could be passed as prop if needed
    dateRange: undefined // Could add date range filter
  });
  
  // Fetch player trends if a player is selected
  const { data: playerTrends } = useGetPlayerTrendsQuery(
    { playerId: selectedPlayer, metric: selectedMetric },
    { skip: selectedPlayer === 'all' || selectedMetric === 'all' }
  );
  
  // Filter test results based on selections
  const filteredResults = React.useMemo(() => {
    return testResults.filter(result => {
      if (selectedPlayer !== 'all' && result.playerId !== selectedPlayer) return false;
      if (selectedBatch !== 'all' && result.testBatchId !== parseInt(selectedBatch)) return false;
      if (selectedMetric !== 'all' && result.testType !== selectedMetric) return false;
      return true;
    });
  }, [testResults, selectedPlayer, selectedBatch, selectedMetric]);

  const stats = useTestStatistics(filteredResults);

  // Get unique test types
  const testTypes = React.useMemo(() => {
    return [...new Set(testResults.map(r => r.testType))];
  }, [testResults]);

  // Prepare data for line chart (progression over time)
  const progressionData = React.useMemo(() => {
    if (selectedPlayer === 'all' || selectedMetric === 'all') return [];
    
    const playerResults = testResults
      .filter(r => r.playerId === selectedPlayer && r.testType === selectedMetric)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return playerResults.map(result => ({
      date: new Date(result.date).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' }),
      value: result.value,
      percentile: result.percentile,
      change: result.change
    }));
  }, [testResults, selectedPlayer, selectedMetric]);

  // Prepare data for team comparison
  const teamComparisonData = React.useMemo(() => {
    if (selectedMetric === 'all' || selectedBatch === 'all') return [];
    
    const batchResults = testResults.filter(
      r => r.testType === selectedMetric && r.testBatchId === parseInt(selectedBatch)
    );
    
    return players.map(player => {
      const result = batchResults.find(r => r.playerId === player.id);
      return {
        name: player.name.split(' ')[1], // Last name only for space
        value: result?.value || 0,
        percentile: result?.percentile || 0
      };
    }).filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [testResults, players, selectedMetric, selectedBatch]);

  // Prepare radar chart data for selected player
  const radarData = React.useMemo(() => {
    if (selectedPlayer === 'all' || selectedBatch === 'all') return [];
    
    const playerResults = testResults.filter(
      r => r.playerId === selectedPlayer && r.testBatchId === parseInt(selectedBatch)
    );
    
    return testTypes.map(testType => {
      const result = playerResults.find(r => r.testType === testType);
      return {
        metric: testType,
        value: result?.percentile || 0,
        fullMark: 100
      };
    });
  }, [testResults, selectedPlayer, selectedBatch, testTypes]);

  // Calculate improvement summary
  const improvementSummary = React.useMemo(() => {
    const improvements: { testType: string; change: number; trend: 'up' | 'down' | 'stable' }[] = [];
    
    testTypes.forEach(testType => {
      const typeResults = filteredResults.filter(r => r.testType === testType && r.change !== undefined);
      if (typeResults.length > 0) {
        const avgChange = typeResults.reduce((sum, r) => sum + (r.change || 0), 0) / typeResults.length;
        improvements.push({
          testType,
          change: avgChange,
          trend: avgChange > 2 ? 'up' : avgChange < -2 ? 'down' : 'stable'
        });
      }
    });
    
    return improvements.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }, [testTypes, filteredResults]);

  if (isLoading) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Analysis Filters</CardTitle>
          <CardDescription>Select player, test batch, and metrics to analyze</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Player</label>
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Players</SelectItem>
                  {players.map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Test Batch</label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {testBatches.map(batch => (
                    <SelectItem key={batch.id} value={batch.id.toString()}>
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Metric</label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger>
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Metrics</SelectItem>
                  {testTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {stats.averageImprovement.toFixed(1)}%
              </div>
              {stats.averageImprovement > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : stats.averageImprovement < 0 ? (
                <TrendingDown className="h-4 w-4 text-red-600" />
              ) : (
                <Minus className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tests Analyzed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredResults.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {testTypes.length} different metrics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topPerformers.length > 0 ? (
              <>
                <div className="text-sm font-medium">
                  {players.find(p => p.id === stats.topPerformers[0].playerId)?.name.split(' ')[1]}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  +{stats.topPerformers[0].improvement.toFixed(1)}% avg
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Players Tested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredResults.map(r => r.playerId)).size}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {players.length} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="progression" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="progression">Progression</TabsTrigger>
          <TabsTrigger value="comparison">Team Comparison</TabsTrigger>
          <TabsTrigger value="profile">Player Profile</TabsTrigger>
          <TabsTrigger value="improvements">Improvements</TabsTrigger>
        </TabsList>

        <TabsContent value="progression" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Progression</CardTitle>
              <CardDescription>
                {selectedPlayer !== 'all' && selectedMetric !== 'all' 
                  ? `Tracking ${selectedMetric} for ${players.find(p => p.id === selectedPlayer)?.name}`
                  : 'Select a player and metric to view progression'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {progressionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={progressionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="percentile" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      dot={{ fill: '#82ca9d' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Select a player and metric to view progression
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Comparison</CardTitle>
              <CardDescription>
                {selectedMetric !== 'all' && selectedBatch !== 'all'
                  ? `Comparing ${selectedMetric} across all players`
                  : 'Select a metric and test batch to compare players'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teamComparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={teamComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Select a metric and test batch to compare players
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Player Performance Profile</CardTitle>
              <CardDescription>
                {selectedPlayer !== 'all' && selectedBatch !== 'all'
                  ? `Performance percentiles for ${players.find(p => p.id === selectedPlayer)?.name}`
                  : 'Select a player and test batch to view profile'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar 
                      name="Percentile" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.6} 
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  Select a player and test batch to view performance profile
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="improvements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Improvement Summary</CardTitle>
              <CardDescription>Average change by test type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {improvementSummary.map(item => (
                  <div key={item.testType} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {item.trend === 'up' ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : item.trend === 'down' ? (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        ) : (
                          <Minus className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{item.testType}</div>
                        <div className="text-sm text-muted-foreground">
                          Average change across {selectedPlayer === 'all' ? 'all players' : 'selected player'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${
                        item.change > 0 ? 'text-green-600' : 
                        item.change < 0 ? 'text-red-600' : 
                        'text-gray-600'
                      }`}>
                        {item.change > 0 ? '+' : ''}{item.change.toFixed(1)}%
                      </div>
                      <Badge variant={
                        item.trend === 'up' ? 'default' : 
                        item.trend === 'down' ? 'destructive' : 
                        'secondary'
                      }>
                        {item.trend}
                      </Badge>
                    </div>
                  </div>
                ))}
                {improvementSummary.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No improvement data available for selected filters
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}