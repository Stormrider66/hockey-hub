/**
 * Collaboration UI Components
 * Main UI components for tactical collaboration features
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Users,
  UserPlus,
  UserX,
  Settings,
  Share2,
  Copy,
  Eye,
  EyeOff,
  Crown,
  Shield,
  Clock,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Bell,
  BellOff,
  Cursor,
  MousePointer,
  Activity,
  Signal,
  Zap,
  MessageSquare,
  Video,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RefreshCw,
  ExternalLink,
  Download,
  Upload,
  Play,
  Pause,
  Square
} from '@/components/icons';
import { toast } from 'sonner';
import { useTranslation } from '@hockey-hub/translations';
import { 
  useCollaboration,
  useCollaborationSession,
  useCollaborationPresence
} from '../../providers/CollaborationProvider';
import {
  CollaborationSession,
  CollaborationUser,
  UserPresence,
  SessionSettings
} from '@hockey-hub/shared-types/src/tactical/collaboration.types';

// Active Users Display Component
export function ActiveUsersDisplay() {
  const { t } = useTranslation('coach');
  const { state } = useCollaboration();
  const { userPresences, cursors } = useCollaborationPresence();
  
  const onlineUsers = state.participants.filter(user => 
    userPresences[user.id]?.status === 'online'
  );

  return (
    <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm border">
      <Users className="w-4 h-4 text-gray-500" />
      <span className="text-sm font-medium text-gray-700">
        {onlineUsers.length} {t('collaboration.online')}
      </span>
      
      <div className="flex -space-x-2">
        {onlineUsers.slice(0, 5).map(user => (
          <div
            key={user.id}
            className="relative w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
            style={{ backgroundColor: user.color }}
            title={`${user.name} (${user.role})`}
          >
            {user.name[0].toUpperCase()}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
          </div>
        ))}
        {onlineUsers.length > 5 && (
          <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-white text-xs font-medium">
            +{onlineUsers.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}

// User Cursor Component
export function UserCursors() {
  const { state } = useCollaboration();
  const { cursors } = useCollaborationPresence();
  
  if (!state.settings.showCursors) return null;

  return (
    <>
      {Object.entries(cursors).map(([userId, cursor]) => {
        const user = state.participants.find(p => p.id === userId);
        if (!user || userId === state.currentUser?.id) return null;
        
        return (
          <div
            key={userId}
            className="fixed w-6 h-6 pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
            style={{ left: cursor.x, top: cursor.y }}
          >
            <MousePointer 
              className="w-6 h-6 drop-shadow-lg"
              style={{ color: user.color }}
            />
            <div 
              className="absolute top-6 left-6 px-2 py-1 rounded text-xs text-white whitespace-nowrap shadow-lg"
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </div>
          </div>
        );
      })}
    </>
  );
}

// Connection Status Indicator
export function ConnectionStatus() {
  const { t } = useTranslation('coach');
  const { state } = useCollaboration();
  const [lastPing, setLastPing] = useState<number>(0);
  
  useEffect(() => {
    if (state.isConnected) {
      const interval = setInterval(() => {
        setLastPing(Date.now());
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [state.isConnected]);
  
  const getStatusColor = () => {
    if (state.connectionError) return 'text-red-500';
    if (state.isConnecting) return 'text-yellow-500';
    if (state.isConnected) return 'text-green-500';
    return 'text-gray-500';
  };
  
  const getStatusIcon = () => {
    if (state.connectionError) return <XCircle className="w-4 h-4" />;
    if (state.isConnecting) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (state.isConnected) return <Wifi className="w-4 h-4" />;
    return <WifiOff className="w-4 h-4" />;
  };
  
  const getStatusText = () => {
    if (state.connectionError) return t('collaboration.error');
    if (state.isConnecting) return t('collaboration.connecting');
    if (state.isConnected) return t('collaboration.connected');
    return t('collaboration.disconnected');
  };

  return (
    <div className={`flex items-center gap-2 ${getStatusColor()}`}>
      {getStatusIcon()}
      <span className="text-sm font-medium">{getStatusText()}</span>
      {state.isConnected && (
        <Badge variant="outline" className="text-xs">
          {Math.round((Date.now() - lastPing) / 1000)}s
        </Badge>
      )}
    </div>
  );
}

// Join Session Dialog
interface JoinSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (sessionId: string) => void;
}

export function JoinSessionDialog({ isOpen, onClose, onJoin }: JoinSessionDialogProps) {
  const { t } = useTranslation('coach');
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleJoin = async () => {
    if (!sessionId.trim()) return;
    
    setIsLoading(true);
    try {
      await onJoin(sessionId.trim());
      setSessionId('');
      onClose();
      toast.success(t('collaboration.sessionJoined'));
    } catch (error) {
      toast.error(t('collaboration.joinFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('collaboration.joinSession')}</DialogTitle>
          <DialogDescription>
            {t('collaboration.joinSessionDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="sessionId">{t('collaboration.sessionId')}</Label>
            <Input
              id="sessionId"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder={t('collaboration.enterSessionId')}
              className="mt-1"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleJoin}
            disabled={!sessionId.trim() || isLoading}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4 mr-2" />
            )}
            {t('collaboration.join')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Create Session Dialog
interface CreateSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { playId: string; title: string; settings: SessionSettings }) => void;
  playId: string;
}

export function CreateSessionDialog({ 
  isOpen, 
  onClose, 
  onCreate, 
  playId 
}: CreateSessionDialogProps) {
  const { t } = useTranslation('coach');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [settings, setSettings] = useState<SessionSettings>({
    maxParticipants: 10,
    requireApproval: false,
    enableChat: true,
    enableVoice: true,
    enableScreenShare: true,
    autoSave: true,
    lockFormation: false
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const handleCreate = async () => {
    if (!title.trim()) return;
    
    setIsLoading(true);
    try {
      await onCreate({ playId, title: title.trim(), settings });
      setTitle('');
      setDescription('');
      onClose();
      toast.success(t('collaboration.sessionCreated'));
    } catch (error) {
      toast.error(t('collaboration.createFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('collaboration.createSession')}</DialogTitle>
          <DialogDescription>
            {t('collaboration.createSessionDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">{t('collaboration.sessionTitle')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('collaboration.enterTitle')}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="description">{t('collaboration.description')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('collaboration.enterDescription')}
              className="mt-1"
              rows={3}
            />
          </div>
          
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('collaboration.sessionSettings')}</Label>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="enableChat" className="text-sm">
                  {t('collaboration.enableChat')}
                </Label>
                <Switch
                  id="enableChat"
                  checked={settings.enableChat}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, enableChat: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="enableVoice" className="text-sm">
                  {t('collaboration.enableVoice')}
                </Label>
                <Switch
                  id="enableVoice"
                  checked={settings.enableVoice}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, enableVoice: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="requireApproval" className="text-sm">
                  {t('collaboration.requireApproval')}
                </Label>
                <Switch
                  id="requireApproval"
                  checked={settings.requireApproval}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, requireApproval: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="autoSave" className="text-sm">
                  {t('collaboration.autoSave')}
                </Label>
                <Switch
                  id="autoSave"
                  checked={settings.autoSave}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, autoSave: checked }))
                  }
                />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={!title.trim() || isLoading}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4 mr-2" />
            )}
            {t('collaboration.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Collaboration Toolbar
interface CollaborationToolbarProps {
  playId: string;
  onStartLiveMode: () => void;
}

export function CollaborationToolbar({ playId, onStartLiveMode }: CollaborationToolbarProps) {
  const { t } = useTranslation('coach');
  const { state, createSession, joinSession, leaveSession } = useCollaboration();
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  
  const handleCreateSession = async (data: { playId: string; title: string; settings: SessionSettings }) => {
    await createSession(data);
  };
  
  const handleJoinSession = async (sessionId: string) => {
    await joinSession(sessionId);
  };
  
  const handleLeaveSession = () => {
    leaveSession();
    toast.info(t('collaboration.leftSession'));
  };
  
  const handleCopySessionId = () => {
    if (state.currentSession) {
      navigator.clipboard.writeText(state.currentSession.id);
      toast.success(t('collaboration.sessionIdCopied'));
    }
  };

  if (!state.isConnected) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border">
        <ConnectionStatus />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm border">
      <ConnectionStatus />
      
      {state.currentSession ? (
        <>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            {t('collaboration.inSession')}
          </Badge>
          
          <ActiveUsersDisplay />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleCopySessionId}>
                <Copy className="w-4 h-4 mr-2" />
                {t('collaboration.copySessionId')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onStartLiveMode}>
                <Video className="w-4 h-4 mr-2" />
                {t('collaboration.startLiveMode')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLeaveSession} className="text-red-600">
                <UserX className="w-4 h-4 mr-2" />
                {t('collaboration.leaveSession')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {t('collaboration.createSession')}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowJoinDialog(true)}
          >
            <Users className="w-4 h-4 mr-2" />
            {t('collaboration.joinSession')}
          </Button>
        </>
      )}
      
      <CreateSessionDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={handleCreateSession}
        playId={playId}
      />
      
      <JoinSessionDialog
        isOpen={showJoinDialog}
        onClose={() => setShowJoinDialog(false)}
        onJoin={handleJoinSession}
      />
    </div>
  );
}

// Collaboration Notifications
export function CollaborationNotifications() {
  const { state } = useCollaboration();
  const [notifications, setNotifications] = useState<any[]>([]);
  
  useEffect(() => {
    // Handle conflicts
    state.conflicts.forEach(conflict => {
      if (!notifications.find(n => n.id === conflict.id)) {
        setNotifications(prev => [...prev, {
          id: conflict.id,
          type: 'conflict',
          title: 'Conflict Detected',
          message: 'Multiple users are editing the same element',
          actions: [
            { label: 'Resolve', onClick: () => {/* handle resolve */} },
            { label: 'Dismiss', onClick: () => setNotifications(prev => prev.filter(n => n.id !== conflict.id)) }
          ]
        }]);
      }
    });
  }, [state.conflicts, notifications]);
  
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <Card key={notification.id} className="w-80 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-sm">{notification.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                <div className="flex gap-2 mt-3">
                  {notification.actions.map((action: any, index: number) => (
                    <Button
                      key={index}
                      size="sm"
                      variant={index === 0 ? "default" : "outline"}
                      onClick={action.onClick}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Main Collaboration UI Component
interface CollaborationUIProps {
  playId: string;
  isLiveModeActive: boolean;
  onToggleLiveMode: (active: boolean) => void;
}

export default function CollaborationUI({ 
  playId, 
  isLiveModeActive,
  onToggleLiveMode 
}: CollaborationUIProps) {
  return (
    <>
      <CollaborationToolbar 
        playId={playId}
        onStartLiveMode={() => onToggleLiveMode(true)}
      />
      <UserCursors />
      <CollaborationNotifications />
    </>
  );
}