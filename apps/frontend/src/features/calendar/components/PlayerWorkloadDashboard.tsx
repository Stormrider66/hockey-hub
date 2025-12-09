import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Clock, 
  Target,
  Heart,
  Zap,
  Shield,
  Download,
  Filter,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Area, AreaChart } from 'recharts';

interface Player {
  id: string;
  name: string;
  position: string;
  avatar?: string;
  weeklyLoad: number;
  monthlyLoad: number;
  maxLoad: number;
  currentLoad: number;
  trend: 'up' | 'down' | 'stable';
  risk: 'low' | 'medium' | 'high';
  gamesPlayed: number;
  practicesAttended: number;
  trainingHours: number;
  restDays: number;
  injuryHistory: number;
  loadDistribution: {
    strength: number;
    cardio: number;
    skills: number;
    game: number;
    recovery: number;
  };
  weeklyTrend: Array<{
    date: string;
    load: number;
    intensity: number;
  }>;
}

interface LoadAnalytics {
  teamAverage: number;
  weeklyTrend: number;
  highRiskPlayers: number;
  optimalPlayers: number;
  underloadedPlayers: number;
}

const PlayerWorkloadDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  // Mock data - in real implementation, this would come from API
  const players: Player[] = [
    {
      id: '1',
      name: 'Connor McDavid',
      position: 'Center',
      weeklyLoad: 850,
      monthlyLoad: 3200,
      maxLoad: 1000,
      currentLoad: 85,
      trend: 'up',
      risk: 'medium',
      gamesPlayed: 12,
      practicesAttended: 18,
      trainingHours: 32,
      restDays: 4,
      injuryHistory: 1,
      loadDistribution: {
        strength: 25,
        cardio: 30,
        skills: 20,
        game: 15,
        recovery: 10
      },
      weeklyTrend: [
        { date: '2025-06-23', load: 780, intensity: 75 },
        { date: '2025-06-24', load: 820, intensity: 80 },
        { date: '2025-06-25', load: 850, intensity: 85 },
        { date: '2025-06-26', load: 890, intensity: 88 },
        { date: '2025-06-27', load: 850, intensity: 82 },
        { date: '2025-06-28', load: 800, intensity: 78 },
        { date: '2025-06-29', load: 870, intensity: 85 }
      ]
    },
    {
      id: '2',
      name: 'Nathan MacKinnon',
      position: 'Center',
      weeklyLoad: 920,
      monthlyLoad: 3600,
      maxLoad: 1000,
      currentLoad: 92,
      trend: 'up',
      risk: 'high',
      gamesPlayed: 13,
      practicesAttended: 19,
      trainingHours: 38,
      restDays: 2,
      injuryHistory: 0,
      loadDistribution: {
        strength: 30,
        cardio: 35,
        skills: 15,
        game: 15,
        recovery: 5
      },
      weeklyTrend: [
        { date: '2025-06-23', load: 880, intensity: 85 },
        { date: '2025-06-24', load: 900, intensity: 88 },
        { date: '2025-06-25', load: 920, intensity: 92 },
        { date: '2025-06-26', load: 950, intensity: 95 },
        { date: '2025-06-27', load: 920, intensity: 90 },
        { date: '2025-06-28', load: 890, intensity: 87 },
        { date: '2025-06-29', load: 920, intensity: 92 }
      ]
    },
    {
      id: '3',
      name: 'Sidney Crosby',
      position: 'Center',
      weeklyLoad: 650,
      monthlyLoad: 2800,
      maxLoad: 1000,
      currentLoad: 65,
      trend: 'stable',
      risk: 'low',
      gamesPlayed: 11,
      practicesAttended: 16,
      trainingHours: 28,
      restDays: 6,
      injuryHistory: 2,
      loadDistribution: {
        strength: 20,
        cardio: 25,
        skills: 25,
        game: 20,
        recovery: 10
      },
      weeklyTrend: [
        { date: '2025-06-23', load: 640, intensity: 65 },
        { date: '2025-06-24', load: 650, intensity: 67 },
        { date: '2025-06-25', load: 660, intensity: 68 },
        { date: '2025-06-26', load: 650, intensity: 66 },
        { date: '2025-06-27', load: 645, intensity: 65 },
        { date: '2025-06-28', load: 655, intensity: 67 },
        { date: '2025-06-29', load: 650, intensity: 65 }
      ]
    },
    {
      id: '4',
      name: 'Erik Karlsson',
      position: 'Defense',
      weeklyLoad: 480,
      monthlyLoad: 2100,
      maxLoad: 1000,
      currentLoad: 48,
      trend: 'down',
      risk: 'low',
      gamesPlayed: 8,
      practicesAttended: 14,
      trainingHours: 22,
      restDays: 8,
      injuryHistory: 3,
      loadDistribution: {
        strength: 15,
        cardio: 20,
        skills: 30,
        game: 25,
        recovery: 10
      },
      weeklyTrend: [
        { date: '2025-06-23', load: 520, intensity: 55 },
        { date: '2025-06-24', load: 500, intensity: 52 },
        { date: '2025-06-25', load: 480, intensity: 48 },
        { date: '2025-06-26', load: 460, intensity: 45 },
        { date: '2025-06-27', load: 480, intensity: 48 },
        { date: '2025-06-28', load: 470, intensity: 47 },
        { date: '2025-06-29', load: 480, intensity: 48 }
      ]
    }
  ];

  const analytics: LoadAnalytics = {
    teamAverage: 725,
    weeklyTrend: 5.2,
    highRiskPlayers: 1,
    optimalPlayers: 2,
    underloadedPlayers: 1
  };

  const getLoadColor = (load: number) => {
    if (load >= 90) return 'text-red-600';
    if (load >= 75) return 'text-orange-600';
    if (load >= 50) return 'text-green-600';
    return 'text-blue-600';
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'high':
        return <Badge variant="destructive">High Risk</Badge>;
      case 'medium':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">Medium Risk</Badge>;
      default:
        return <Badge variant="default" className="bg-green-100 text-green-800">Low Risk</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const teamLoadTrend = [
    { date: '2025-06-01', load: 680, players: 22 },
    { date: '2025-06-08', load: 710, players: 23 },
    { date: '2025-06-15', load: 725, players: 24 },
    { date: '2025-06-22', load: 740, players: 24 },
    { date: '2025-06-29', load: 725, players: 23 }
  ];

  const loadDistributionData = [
    { name: 'Strength', value: 23, color: '#3b82f6' },
    { name: 'Cardio', value: 28, color: '#10b981' },
    { name: 'Skills', value: 22, color: '#f59e0b' },
    { name: 'Game', value: 19, color: '#ef4444' },
    { name: 'Recovery', value: 8, color: '#8b5cf6' }
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#eab308', '#22c55e'];

  const exportReport = () => {
    console.log('Exporting player workload report...');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Player Workload Dashboard</h2>
          <p className="text-gray-600">Monitor training loads and prevent overuse injuries</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Players</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Team Average Load</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.teamAverage}</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{analytics.weeklyTrend}% this week
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Risk Players</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.highRiskPlayers}</p>
                <p className="text-xs text-red-600">Immediate attention needed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Optimal Load</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.optimalPlayers}</p>
                <p className="text-xs text-green-600">In target zone</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Underloaded</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.underloadedPlayers}</p>
                <p className="text-xs text-blue-600">Can increase intensity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="players">Individual Players</TabsTrigger>
          <TabsTrigger value="trends">Load Trends</TabsTrigger>
          <TabsTrigger value="analysis">Load Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Load Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Team Load Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={teamLoadTrend}>
                    <defs>
                      <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="load" stroke="#3b82f6" fillOpacity={1} fill="url(#loadGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Load Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Training Load Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loadDistributionData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-32">
                          <Progress value={item.value} className="h-2" />
                        </div>
                        <span className="text-sm font-medium w-8">{item.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk Alert */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                Load Management Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-1" />
                <div>
                  <h4 className="font-medium text-red-800">Nathan MacKinnon - High Load Warning</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Current load at 92% with only 2 rest days this week. Recommend reducing intensity or adding recovery day.
                  </p>
                  <Button size="sm" variant="outline" className="mt-2">
                    Adjust Training Plan
                  </Button>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                <TrendingDown className="h-5 w-5 text-blue-500 mt-1" />
                <div>
                  <h4 className="font-medium text-blue-800">Erik Karlsson - Low Load Alert</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Training load at 48% - well below optimal. Consider increasing training intensity if medically cleared.
                  </p>
                  <Button size="sm" variant="outline" className="mt-2">
                    Review Training Plan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players" className="space-y-4">
          <div className="grid gap-4">
            {players.map((player) => (
              <Card key={player.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={player.avatar} />
                        <AvatarFallback>{player.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{player.name}</h3>
                        <p className="text-sm text-gray-600">{player.position}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {getRiskBadge(player.risk)}
                          {getTrendIcon(player.trend)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-8">
                      <div className="text-center">
                        <p className={`text-2xl font-bold ${getLoadColor(player.currentLoad)}`}>{player.currentLoad}%</p>
                        <p className="text-xs text-gray-600">Current Load</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{player.weeklyLoad}</p>
                        <p className="text-xs text-gray-600">Weekly Load</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{player.restDays}</p>
                        <p className="text-xs text-gray-600">Rest Days</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{player.gamesPlayed}</p>
                        <p className="text-xs text-gray-600">Games</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Training Load Progress</span>
                      <span>{player.currentLoad}% of maximum</span>
                    </div>
                    <Progress value={player.currentLoad} className="h-3" />
                  </div>

                  <div className="mt-4 grid grid-cols-5 gap-4 text-center">
                    <div>
                      <p className="text-sm font-medium">Strength</p>
                      <p className="text-lg font-bold text-blue-600">{player.loadDistribution.strength}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Cardio</p>
                      <p className="text-lg font-bold text-green-600">{player.loadDistribution.cardio}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Skills</p>
                      <p className="text-lg font-bold text-yellow-600">{player.loadDistribution.skills}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Games</p>
                      <p className="text-lg font-bold text-red-600">{player.loadDistribution.game}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Recovery</p>
                      <p className="text-lg font-bold text-purple-600">{player.loadDistribution.recovery}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Individual Player Load Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  {players.map((player, index) => (
                    <Line
                      key={player.id}
                      type="monotone"
                      data={player.weeklyTrend}
                      dataKey="load"
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      name={player.name}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Load vs Recovery Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={players}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="weeklyLoad" fill="#3b82f6" />
                    <Bar dataKey="restDays" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Training Distribution Radar</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={loadDistributionData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis />
                    <Radar
                      name="Load Distribution"
                      dataKey="value"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlayerWorkloadDashboard;