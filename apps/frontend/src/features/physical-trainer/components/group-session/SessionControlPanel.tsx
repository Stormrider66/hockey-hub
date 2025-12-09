'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Play,
  Pause,
  StopCircle,
  AlertTriangle,
  MessageSquare,
  Users,
  User,
  Clock,
  Activity,
  Shield,
  Zap,
  Volume2,
  Bell,
  Settings,
  RefreshCw,
  Power,
  Target,
  Flag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { RealTimePlayerMetrics, TeamAggregateMetrics } from '../../hooks/useGroupSessionBroadcast';

interface SessionControlPanelProps {
  sessionId: string;
  sessionStatus: 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  teamMetrics: TeamAggregateMetrics | null;
  playerMetrics: RealTimePlayerMetrics[];
  selectedPlayers: Set<string>;
  onSessionControl: (action: 'start' | 'pause' | 'resume' | 'stop' | 'emergency_stop', targetPlayers?: string[], reason?: string) => void;
  onPlayerControl: (playerId: string, action: 'pause' | 'resume' | 'modify_targets' | 'send_message' | 'flag_attention' | 'emergency_stop', data?: any) => void;
  onSendMessage: (message: string, targetPlayerId?: string, priority?: 'low' | 'normal' | 'high' | 'urgent') => void;
  onEmergencyStop: (reason?: string) => void;
  canControl?: boolean;
}

export default function SessionControlPanel({
  sessionId,
  sessionStatus,
  teamMetrics,
  playerMetrics,
  selectedPlayers,
  onSessionControl,
  onPlayerControl,
  onSendMessage,
  onEmergencyStop,
  canControl = true
}: SessionControlPanelProps) {
  const { t } = useTranslation(['physicalTrainer']);
  
  // Dialog states
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [showBulkActionDialog, setBulkActionDialog] = useState(false);
  
  // Form states
  const [messageText, setMessageText] = useState('');
  const [messagePriority, setMessagePriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [messageTarget, setMessageTarget] = useState<'all' | 'selected' | 'alerts'>('all');
  const [emergencyReason, setEmergencyReason] = useState('');
  const [bulkAction, setBulkAction] = useState<'pause' | 'resume' | 'flag' | 'message'>('pause');
  
  // Get players needing attention
  const playersWithAlerts = playerMetrics.filter(player => 
    (player.zoneCompliance || 0) < 60 ||
    player.connectionStatus !== 'connected' ||
    (player.medicalAlerts && player.medicalAlerts.length > 0) ||
    (player.performanceFlags && player.performanceFlags.length > 0)
  );
  
  const selectedPlayersList = Array.from(selectedPlayers);
  const hasSelectedPlayers = selectedPlayersList.length > 0;
  
  // Control action handlers
  const handleSessionAction = useCallback((action: 'start' | 'pause' | 'resume' | 'stop') => {
    onSessionControl(action);
  }, [onSessionControl]);
  
  const handleBulkAction = useCallback(() => {
    if (bulkAction === 'message') {
      // Handle bulk message in message dialog
      return;
    }
    
    const targetPlayers = messageTarget === 'selected' ? selectedPlayersList :
                         messageTarget === 'alerts' ? playersWithAlerts.map(p => p.playerId) :
                         undefined; // undefined = all players
    
    if (bulkAction === 'pause' || bulkAction === 'resume') {
      onSessionControl(bulkAction, targetPlayers);
    } else if (bulkAction === 'flag') {
      targetPlayers?.forEach(playerId => {
        onPlayerControl(playerId, 'flag_attention');
      });
    }
    
    setBulkActionDialog(false);
  }, [bulkAction, messageTarget, selectedPlayersList, playersWithAlerts, onSessionControl, onPlayerControl]);
  
  const handleSendMessage = useCallback(() => {
    if (!messageText.trim()) return;
    
    if (messageTarget === 'all') {
      onSendMessage(messageText, undefined, messagePriority);
    } else if (messageTarget === 'selected' && hasSelectedPlayers) {
      selectedPlayersList.forEach(playerId => {
        onSendMessage(messageText, playerId, messagePriority);
      });
    } else if (messageTarget === 'alerts') {
      playersWithAlerts.forEach(player => {
        onSendMessage(messageText, player.playerId, messagePriority);
      });
    }
    
    setMessageText('');
    setShowMessageDialog(false);
  }, [messageText, messageTarget, messagePriority, hasSelectedPlayers, selectedPlayersList, playersWithAlerts, onSendMessage]);
  
  const handleEmergencyStop = useCallback(() => {
    onEmergencyStop(emergencyReason || 'Emergency stop initiated by trainer');
    setEmergencyReason('');
    setShowEmergencyDialog(false);
  }, [emergencyReason, onEmergencyStop]);
  
  // Get status color and label
  const getStatusInfo = () => {
    switch (sessionStatus) {
      case 'scheduled':
        return { color: 'bg-gray-500', label: 'Scheduled', textColor: 'text-gray-600' };
      case 'active':
        return { color: 'bg-green-500', label: 'Active', textColor: 'text-green-600' };
      case 'paused':
        return { color: 'bg-yellow-500', label: 'Paused', textColor: 'text-yellow-600' };
      case 'completed':
        return { color: 'bg-blue-500', label: 'Completed', textColor: 'text-blue-600' };
      case 'cancelled':
        return { color: 'bg-red-500', label: 'Cancelled', textColor: 'text-red-600' };
      default:
        return { color: 'bg-gray-500', label: 'Unknown', textColor: 'text-gray-600' };
    }
  };
  
  const statusInfo = getStatusInfo();
  
  return (
    <div className="space-y-4">
      {/* Session Status Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-3 h-3 rounded-full", statusInfo.color)} />
              <div>
                <CardTitle className="text-lg">Session Control</CardTitle>
                <p className={cn("text-sm", statusInfo.textColor)}>
                  Status: {statusInfo.label}
                </p>
              </div>
            </div>
            
            {teamMetrics && (
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold">{teamMetrics.connectedPlayers}/{teamMetrics.totalPlayers}</div>
                  <div className="text-muted-foreground">Connected</div>
                </div>
                <div className="text-center">
                  <div className="font-bold">{teamMetrics.playersNeedingAttention}</div>
                  <div className="text-muted-foreground">Alerts</div>
                </div>
                <div className="text-center">
                  <div className="font-bold">{Math.round(teamMetrics.sessionProgress)}%</div>
                  <div className="text-muted-foreground">Progress</div>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>
      
      {/* Main Session Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Session Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {sessionStatus === 'scheduled' && (
              <Button 
                onClick={() => handleSessionAction('start')}
                disabled={!canControl}
                className="h-12"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Session
              </Button>
            )}
            
            {sessionStatus === 'active' && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => handleSessionAction('pause')}
                  disabled={!canControl}
                  className="h-12"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause All
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleSessionAction('stop')}
                  disabled={!canControl}
                  className="h-12"
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  End Session
                </Button>
              </>
            )}
            
            {sessionStatus === 'paused' && (
              <>
                <Button 
                  onClick={() => handleSessionAction('resume')}
                  disabled={!canControl}
                  className="h-12"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Resume All
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleSessionAction('stop')}
                  disabled={!canControl}
                  className="h-12"
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  End Session
                </Button>
              </>
            )}
            
            {/* Message Dialog */}
            <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-12">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Message to Players</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Target</Label>
                    <select 
                      value={messageTarget}
                      onChange={(e) => setMessageTarget(e.target.value as any)}
                      className="w-full mt-1 p-2 border rounded"
                    >
                      <option value="all">All Players ({playerMetrics.length})</option>
                      {hasSelectedPlayers && (
                        <option value="selected">Selected Players ({selectedPlayersList.length})</option>
                      )}
                      {playersWithAlerts.length > 0 && (
                        <option value="alerts">Players with Alerts ({playersWithAlerts.length})</option>
                      )}
                    </select>
                  </div>
                  
                  <div>
                    <Label>Priority</Label>
                    <select 
                      value={messagePriority}
                      onChange={(e) => setMessagePriority(e.target.value as any)}
                      className="w-full mt-1 p-2 border rounded"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label>Message</Label>
                    <Textarea 
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Enter your message to players..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
                      Send Message
                    </Button>
                    <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            {/* Emergency Stop Dialog */}
            <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="h-12">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Emergency Stop
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Emergency Stop All Players
                  </DialogTitle>
                </DialogHeader>
                <Alert className="border-red-500">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This will immediately stop all player sessions and cannot be undone.
                    Use only in case of emergency or safety concerns.
                  </AlertDescription>
                </Alert>
                <div className="space-y-4">
                  <div>
                    <Label>Reason (Optional)</Label>
                    <Textarea 
                      value={emergencyReason}
                      onChange={(e) => setEmergencyReason(e.target.value)}
                      placeholder="Describe the reason for emergency stop..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="destructive" onClick={handleEmergencyStop}>
                      <Power className="h-4 w-4 mr-2" />
                      Emergency Stop All
                    </Button>
                    <Button variant="outline" onClick={() => setShowEmergencyDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
      
      {/* Bulk Actions for Selected Players */}
      {hasSelectedPlayers && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Bulk Actions ({selectedPlayersList.length} selected)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <Button 
                variant="outline"
                onClick={() => onSessionControl('pause', selectedPlayersList)}
                disabled={!canControl}
                className="h-10"
              >
                <Pause className="h-4 w-4 mr-1" />
                Pause Selected
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => onSessionControl('resume', selectedPlayersList)}
                disabled={!canControl}
                className="h-10"
              >
                <Play className="h-4 w-4 mr-1" />
                Resume Selected
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  selectedPlayersList.forEach(playerId => {
                    onPlayerControl(playerId, 'flag_attention');
                  });
                }}
                disabled={!canControl}
                className="h-10"
              >
                <Flag className="h-4 w-4 mr-1" />
                Flag for Attention
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  setMessageTarget('selected');
                  setShowMessageDialog(true);
                }}
                className="h-10"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Message Selected
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Alert Summary */}
      {playersWithAlerts.length > 0 && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <Bell className="h-5 w-5" />
              Players Needing Attention ({playersWithAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {playersWithAlerts.slice(0, 5).map((player) => (
                <div key={player.playerId} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{player.playerName}</span>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(player.zoneCompliance || 0)}% compliance
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onPlayerControl(player.playerId, 'send_message')}
                    >
                      <MessageSquare className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onPlayerControl(player.playerId, 'flag_attention')}
                    >
                      <Flag className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {playersWithAlerts.length > 5 && (
                <div className="text-center text-sm text-muted-foreground">
                  +{playersWithAlerts.length - 5} more players need attention
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setMessageTarget('alerts');
                    setMessagePriority('high');
                    setShowMessageDialog(true);
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Message All
                </Button>
                <Button 
                  size="sm"  
                  variant="outline"
                  onClick={() => {
                    playersWithAlerts.forEach(player => {
                      onPlayerControl(player.playerId, 'flag_attention');
                    });
                  }}
                >
                  <Flag className="h-4 w-4 mr-1" />
                  Flag All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Session Statistics */}
      {teamMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Live Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-500">{teamMetrics.averageHeartRate}</div>
                <div className="text-xs text-muted-foreground">Avg Heart Rate</div>
              </div>
              
              {teamMetrics.averageWatts && (
                <div>
                  <div className="text-2xl font-bold text-yellow-500">{Math.round(teamMetrics.averageWatts)}</div>
                  <div className="text-xs text-muted-foreground">Avg Power</div>
                </div>
              )}
              
              <div>
                <div className="text-2xl font-bold text-green-500">{teamMetrics.totalCalories}</div>
                <div className="text-xs text-muted-foreground">Total Calories</div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-blue-500">{Math.round(teamMetrics.averageZoneCompliance)}%</div>
                <div className="text-xs text-muted-foreground">Avg Compliance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}