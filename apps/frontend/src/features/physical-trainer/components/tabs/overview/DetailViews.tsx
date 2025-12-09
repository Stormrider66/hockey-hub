/**
 * Detail Views for Dashboard Widgets
 * Provides comprehensive drill-down functionality for each metric
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, Activity, Heart, TrendingUp, 
  ChevronRight, Shield, Target, Brain, 
  Calendar, Clock, MessageSquare, FileText,
  Settings, Download, Send, CheckCircle
} from '@/components/icons';
import type { PlayerReadiness } from '../../../types';

export type DetailViewType = 'injury-risk' | 'load-distribution' | 'recovery' | 'performance';

interface DetailViewProps {
  type: DetailViewType | null;
  isOpen: boolean;
  onClose: () => void;
  playerReadiness: PlayerReadiness[];
  onActionTaken?: (action: string, data: any) => void;
}

export function DetailView({ type, isOpen, onClose, playerReadiness, onActionTaken }: DetailViewProps) {
  const { t } = useTranslation('physicalTrainer');
  const [activeTab, setActiveTab] = useState('overview');

  const handleAction = (action: string, data: any) => {
    console.log(`Action: ${action}`, data);
    onActionTaken?.(action, data);
  };

  const renderContent = () => {
    switch (type) {
      case 'injury-risk':
        return <InjuryRiskDetail players={playerReadiness} onAction={handleAction} />;
      case 'load-distribution':
        return <LoadDistributionDetail players={playerReadiness} onAction={handleAction} />;
      case 'recovery':
        return <RecoveryDetail players={playerReadiness} onAction={handleAction} />;
      case 'performance':
        return <PerformanceDetail players={playerReadiness} onAction={handleAction} />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'injury-risk': return 'Injury Prevention Center';
      case 'load-distribution': return 'Load Management Hub';
      case 'recovery': return 'Recovery Command Center';
      case 'performance': return 'Performance Analytics Suite';
      default: return '';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'injury-risk': return 'Comprehensive injury risk analysis and prevention strategies';
      case 'load-distribution': return 'Optimize training loads for peak performance';
      case 'recovery': return 'Monitor and manage player recovery protocols';
      case 'performance': return 'Deep dive into performance metrics and trends';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'injury-risk' && <AlertTriangle className="h-5 w-5 text-orange-500" />}
            {type === 'load-distribution' && <Activity className="h-5 w-5 text-blue-500" />}
            {type === 'recovery' && <Heart className="h-5 w-5 text-red-500" />}
            {type === 'performance' && <TrendingUp className="h-5 w-5 text-green-500" />}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        
        <div className="mt-6">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Injury Risk Detail Component
function InjuryRiskDetail({ players, onAction }: { players: PlayerReadiness[], onAction: (action: string, data: any) => void }) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  
  // Calculate risk scores for all players
  const playersWithRisk = players.map(player => {
    let riskScore = 0;
    const factors = [];
    
    if (player.fatigue === 'high') {
      riskScore += 40;
      factors.push({ name: 'High Fatigue', impact: 40, color: 'red' });
    } else if (player.fatigue === 'medium') {
      riskScore += 20;
      factors.push({ name: 'Medium Fatigue', impact: 20, color: 'yellow' });
    }
    
    if (player.load > 100) {
      riskScore += 30;
      factors.push({ name: 'Overload', impact: 30, color: 'red' });
    } else if (player.load > 90) {
      riskScore += 15;
      factors.push({ name: 'High Load', impact: 15, color: 'orange' });
    }
    
    if (player.status === 'rest') {
      riskScore += 25;
      factors.push({ name: 'Needs Rest', impact: 25, color: 'red' });
    } else if (player.status === 'caution') {
      riskScore += 15;
      factors.push({ name: 'Caution Status', impact: 15, color: 'yellow' });
    }
    
    return {
      ...player,
      riskScore: Math.min(100, riskScore),
      riskFactors: factors,
      riskLevel: riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low'
    };
  }).sort((a, b) => b.riskScore - a.riskScore);

  const highRiskPlayers = playersWithRisk.filter(p => p.riskLevel === 'high');
  const mediumRiskPlayers = playersWithRisk.filter(p => p.riskLevel === 'medium');

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="players">Players</TabsTrigger>
        <TabsTrigger value="interventions">Interventions</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">High Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{highRiskPlayers.length}</div>
              <p className="text-xs text-muted-foreground">Immediate attention needed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Medium Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{mediumRiskPlayers.length}</div>
              <p className="text-xs text-muted-foreground">Monitor closely</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Avg Risk Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(playersWithRisk.reduce((acc, p) => acc + p.riskScore, 0) / playersWithRisk.length)}%
              </div>
              <p className="text-xs text-muted-foreground">Team average</p>
            </CardContent>
          </Card>
        </div>

        {highRiskPlayers.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-900">
              <strong>Immediate Action Required:</strong> {highRiskPlayers.length} players are at high injury risk.
              Consider reducing their training load or providing additional recovery time.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Risk Factors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {['High Fatigue', 'Overload', 'Poor Recovery', 'Consecutive High-Intensity Days'].map((factor, i) => (
              <div key={factor} className="flex items-center justify-between">
                <span className="text-sm">{factor}</span>
                <div className="flex items-center gap-2">
                  <Progress value={[85, 72, 68, 45][i]} className="w-24 h-2" />
                  <span className="text-xs text-muted-foreground w-10">{[85, 72, 68, 45][i]}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="players" className="space-y-4">
        <div className="space-y-2">
          {playersWithRisk.slice(0, 10).map(player => (
            <Card key={player.playerId} className={`cursor-pointer transition-colors ${
              selectedPlayer === player.playerId ? 'border-primary' : ''
            }`} onClick={() => setSelectedPlayer(player.playerId)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      player.riskLevel === 'high' ? 'bg-red-500' : 
                      player.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Risk Score: {player.riskScore}% | Load: {player.load}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {player.riskFactors.slice(0, 2).map((factor, i) => (
                      <Badge key={i} variant={factor.color === 'red' ? 'destructive' : 'secondary'} className="text-xs">
                        {factor.name}
                      </Badge>
                    ))}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction('modify-load', { playerId: player.playerId, currentLoad: player.load });
                      }}
                    >
                      Adjust Load
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
      
      <TabsContent value="interventions" className="space-y-4">
        <div className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Recommended Interventions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {highRiskPlayers.map(player => (
                <div key={player.playerId} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{player.name}</p>
                    <Badge variant="destructive">High Risk</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Recommendations:</p>
                    <ul className="text-xs space-y-1 ml-4">
                      <li>• Reduce training load by 30%</li>
                      <li>• Add 15min recovery session</li>
                      <li>• Monitor HRV closely tomorrow</li>
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => onAction('apply-intervention', { 
                      playerId: player.playerId, 
                      interventions: ['reduce-load', 'add-recovery'] 
                    })}>
                      Apply All
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onAction('notify-medical', { 
                      playerId: player.playerId 
                    })}>
                      Notify Medical
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="history" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Injury Risk Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-2">
              {[65, 72, 68, 75, 71, 66, 62, 58, 55, 52].map((value, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-gradient-to-t from-orange-500 to-orange-300 rounded-t"
                    style={{ height: `${value}%` }}
                  />
                  <span className="text-xs text-muted-foreground">W{i+1}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Team injury risk average over last 10 weeks
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// Load Distribution Detail Component
function LoadDistributionDetail({ players, onAction }: { players: PlayerReadiness[], onAction: (action: string, data: any) => void }) {
  const optimal = players.filter(p => p.load >= 70 && p.load <= 90);
  const under = players.filter(p => p.load < 70);
  const over = players.filter(p => p.load > 90);

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="distribution">Distribution</TabsTrigger>
        <TabsTrigger value="optimization">Optimization</TabsTrigger>
        <TabsTrigger value="planning">Planning</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-yellow-600">Under-loaded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{under.length}</div>
              <p className="text-xs text-muted-foreground">Below 70% capacity</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-600">Optimal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{optimal.length}</div>
              <p className="text-xs text-muted-foreground">70-90% capacity</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-600">Over-loaded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{over.length}</div>
              <p className="text-xs text-muted-foreground">Above 90% capacity</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Load Balance Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {players.slice(0, 8).map(player => (
                <div key={player.playerId} className="flex items-center gap-3">
                  <span className="text-sm w-32 truncate">{player.name}</span>
                  <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        player.load < 70 ? 'bg-yellow-500' :
                        player.load <= 90 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, player.load)}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                      {player.load}%
                    </span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => onAction('adjust-load', { playerId: player.playerId })}>
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="distribution" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Acute:Chronic Workload Ratios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">
              Optimal range: 0.8-1.3 | Injury risk increases outside this range
            </p>
            <div className="space-y-2">
              {players.slice(0, 6).map(player => {
                const ratio = 0.7 + Math.random() * 0.8; // Mock data
                const isOptimal = ratio >= 0.8 && ratio <= 1.3;
                return (
                  <div key={player.playerId} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{player.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={isOptimal ? "default" : "destructive"}>
                        {ratio.toFixed(2)}
                      </Badge>
                      {!isOptimal && (
                        <Button size="sm" variant="outline" onClick={() => onAction('balance-ratio', { playerId: player.playerId })}>
                          Balance
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="optimization" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Load Optimization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert>
              <AlertDescription>
                Based on current data, we recommend redistributing loads to achieve 85% team optimization.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Suggested Changes:</p>
              {[
                { player: 'Player A', from: 95, to: 85, reason: 'Reduce overload risk' },
                { player: 'Player B', from: 65, to: 75, reason: 'Increase stimulus' },
                { player: 'Player C', from: 102, to: 88, reason: 'Prevent burnout' },
              ].map((change, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{change.player}</p>
                    <p className="text-xs text-muted-foreground">{change.reason}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{change.from}% → {change.to}%</Badge>
                    <Button size="sm" onClick={() => onAction('apply-optimization', change)}>
                      Apply
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <Button className="w-full" onClick={() => onAction('apply-all-optimizations', {})}>
              Apply All Optimizations
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="planning" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Weekly Load Planning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-7 gap-1 text-xs">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                  <div key={day} className="text-center">
                    <p className="font-medium mb-1">{day}</p>
                    <div className={`h-16 rounded flex items-center justify-center ${
                      [75, 85, 70, 90, 80, 60, 50][i] > 80 ? 'bg-red-100' :
                      [75, 85, 70, 90, 80, 60, 50][i] > 70 ? 'bg-yellow-100' : 'bg-green-100'
                    }`}>
                      <span className="font-bold">{[75, 85, 70, 90, 80, 60, 50][i]}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full" variant="outline" onClick={() => onAction('export-plan', {})}>
                <Download className="h-4 w-4 mr-2" />
                Export Load Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// Recovery Detail Component
function RecoveryDetail({ players, onAction }: { players: PlayerReadiness[], onAction: (action: string, data: any) => void }) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="metrics">Metrics</TabsTrigger>
        <TabsTrigger value="protocols">Protocols</TabsTrigger>
        <TabsTrigger value="trends">Trends</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Team Recovery Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">72%</div>
              <Progress value={72} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">8% below baseline</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Players Needing Attention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">12</div>
              <div className="flex gap-2 mt-2">
                <Badge variant="destructive">5 Critical</Badge>
                <Badge variant="secondary">7 Monitor</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recovery Interventions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { name: 'Ice Bath', assigned: 8, icon: '🧊' },
              { name: 'Massage', assigned: 5, icon: '💆' },
              { name: 'Sleep Protocol', assigned: 12, icon: '😴' },
              { name: 'Nutrition Plan', assigned: 6, icon: '🥗' },
            ].map(intervention => (
              <div key={intervention.name} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{intervention.icon}</span>
                  <span className="text-sm">{intervention.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{intervention.assigned} players</Badge>
                  <Button size="sm" variant="ghost" onClick={() => onAction('manage-protocol', { protocol: intervention.name })}>
                    Manage
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="metrics" className="space-y-4">
        <div className="space-y-3">
          {players.slice(0, 6).map(player => (
            <Card key={player.playerId}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{player.name}</p>
                  <Badge variant={player.fatigue === 'high' ? 'destructive' : player.fatigue === 'medium' ? 'secondary' : 'default'}>
                    {player.fatigue} fatigue
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">HRV</p>
                    <p className="font-medium">{player.metrics?.hrv || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sleep</p>
                    <p className="font-medium">{player.metrics?.sleepQuality || 'N/A'}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Soreness</p>
                    <p className="font-medium">{player.metrics?.soreness || 'N/A'}/10</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Energy</p>
                    <p className="font-medium">{player.metrics?.energy || 'N/A'}%</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => onAction('assign-recovery', { playerId: player.playerId })}>
                    Assign Protocol
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onAction('message-player', { playerId: player.playerId })}>
                    <MessageSquare className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
      
      <TabsContent value="protocols" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Recovery Protocols</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { 
                id: '1',
                name: 'Post-Game Recovery',
                players: ['Player A', 'Player B', 'Player C'],
                duration: '48 hours',
                status: 'active'
              },
              {
                id: '2', 
                name: 'High Fatigue Management',
                players: ['Player D', 'Player E'],
                duration: '72 hours',
                status: 'pending'
              },
            ].map(protocol => (
              <div key={protocol.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{protocol.name}</p>
                    <p className="text-xs text-muted-foreground">Duration: {protocol.duration}</p>
                  </div>
                  <Badge variant={protocol.status === 'active' ? 'default' : 'secondary'}>
                    {protocol.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs">Assigned to: {protocol.players.join(', ')}</p>
                  <Button size="sm" onClick={() => onAction('edit-protocol', { protocolId: protocol.id })}>
                    Edit
                  </Button>
                </div>
              </div>
            ))}
            <Button className="w-full" variant="outline" onClick={() => onAction('create-protocol', {})}>
              Create New Protocol
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="trends" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recovery Trends (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-1">
              {Array.from({ length: 30 }, (_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"
                    style={{ height: `${50 + Math.random() * 50}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// Performance Detail Component
function PerformanceDetail({ players, onAction }: { players: PlayerReadiness[], onAction: (action: string, data: any) => void }) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="individual">Individual</TabsTrigger>
        <TabsTrigger value="comparison">Comparison</TabsTrigger>
        <TabsTrigger value="predictions">Predictions</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Weekly Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">+8.3%</div>
              <p className="text-xs text-muted-foreground">Avg. across all metrics</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Top Metric</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Power</div>
              <p className="text-xs text-muted-foreground">+12% this week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Plateauing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">3</div>
              <p className="text-xs text-muted-foreground">Players need attention</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Performance Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { category: 'Strength', value: 85, trend: 'up', change: '+5%' },
                { category: 'Speed', value: 78, trend: 'up', change: '+3%' },
                { category: 'Endurance', value: 72, trend: 'stable', change: '0%' },
                { category: 'Agility', value: 81, trend: 'up', change: '+7%' },
                { category: 'Power', value: 88, trend: 'up', change: '+12%' },
              ].map(metric => (
                <div key={metric.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-sm w-20">{metric.category}</span>
                    <Progress value={metric.value} className="flex-1" />
                    <span className="text-sm font-medium w-10">{metric.value}%</span>
                  </div>
                  <Badge variant={metric.trend === 'up' ? 'default' : 'secondary'}>
                    {metric.change}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="individual" className="space-y-4">
        <div className="space-y-3">
          {players.slice(0, 5).map(player => (
            <Card key={player.playerId}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium">{player.name}</p>
                  <Badge variant={player.trend === 'up' ? 'default' : player.trend === 'down' ? 'destructive' : 'secondary'}>
                    {player.trend}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Overall Performance</span>
                    <span className="font-medium">82%</span>
                  </div>
                  <Progress value={82} />
                  <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
                    <div className="text-center">
                      <p className="text-muted-foreground">Strength</p>
                      <p className="font-bold">+8%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">Speed</p>
                      <p className="font-bold">+5%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">Endurance</p>
                      <p className="font-bold">+3%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">Power</p>
                      <p className="font-bold">+10%</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={() => onAction('view-details', { playerId: player.playerId })}>
                    View Details
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onAction('set-goals', { playerId: player.playerId })}>
                    Set Goals
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
      
      <TabsContent value="comparison" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Player Comparison Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Player</th>
                    <th className="text-center p-2">Strength</th>
                    <th className="text-center p-2">Speed</th>
                    <th className="text-center p-2">Endurance</th>
                    <th className="text-center p-2">Power</th>
                    <th className="text-center p-2">Overall</th>
                  </tr>
                </thead>
                <tbody>
                  {players.slice(0, 5).map(player => (
                    <tr key={player.playerId} className="border-b">
                      <td className="p-2 font-medium">{player.name}</td>
                      <td className="text-center p-2">{75 + Math.floor(Math.random() * 20)}</td>
                      <td className="text-center p-2">{70 + Math.floor(Math.random() * 25)}</td>
                      <td className="text-center p-2">{65 + Math.floor(Math.random() * 30)}</td>
                      <td className="text-center p-2">{72 + Math.floor(Math.random() * 23)}</td>
                      <td className="text-center p-2 font-bold">{78 + Math.floor(Math.random() * 15)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button className="w-full mt-3" variant="outline" onClick={() => onAction('export-comparison', {})}>
              <FileText className="h-4 w-4 mr-2" />
              Export Comparison Report
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="predictions" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Performance Predictions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert>
              <AlertDescription>
                Based on current training patterns and progression rates, here are the 30-day predictions.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              {[
                { metric: 'Team Strength', current: 82, predicted: 89, confidence: 85 },
                { metric: 'Team Speed', current: 78, predicted: 82, confidence: 78 },
                { metric: 'Team Endurance', current: 75, predicted: 81, confidence: 92 },
                { metric: 'Injury Risk', current: 28, predicted: 22, confidence: 70 },
              ].map(prediction => (
                <div key={prediction.metric} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{prediction.metric}</p>
                    <Badge variant="outline">
                      {prediction.confidence}% confidence
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span>Current: {prediction.current}%</span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="font-bold text-green-600">Predicted: {prediction.predicted}%</span>
                  </div>
                </div>
              ))}
            </div>
            
            <Button className="w-full" onClick={() => onAction('run-simulation', {})}>
              Run Advanced Simulation
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}