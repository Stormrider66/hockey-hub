'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  PlayCircle, 
  PauseCircle, 
  MessageSquare, 
  Download,
  ChevronDown,
  AlertTriangle,
  Volume2,
  Users,
  MoreHorizontal,
  Dumbbell,
  Heart,
  Zap,
  Target,
  FileSpreadsheet,
  Filter
} from '@/components/icons';
import { cn } from '@/lib/utils';
import type { BulkActionType, BundleSession } from '../bulk-sessions.types';

interface BulkActionsProps {
  sessions: BundleSession[];
  onBulkAction: (action: BulkActionType, sessionIds: string[], metadata?: any) => void;
  className?: string;
}

export const BulkActions: React.FC<BulkActionsProps> = ({ 
  sessions, 
  onBulkAction, 
  className 
}) => {
  const { t } = useTranslation('physicalTrainer');
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isLoading, setIsLoading] = useState<BulkActionType | null>(null);
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<BundleSession['workoutType'] | 'all'>('all');

  const activeSessions = sessions.filter(s => s.status === 'active');
  const pausedSessions = sessions.filter(s => s.status === 'paused');
  const preparingSessions = sessions.filter(s => s.status === 'preparing');
  const totalParticipants = sessions.reduce((sum, s) => sum + s.participants.length, 0);

  // Workout type distribution
  const workoutTypeDistribution = sessions.reduce((acc, session) => {
    acc[session.workoutType] = (acc[session.workoutType] || 0) + 1;
    return acc;
  }, {} as Record<BundleSession['workoutType'], number>);

  const getWorkoutTypeIcon = (type: BundleSession['workoutType']) => {
    switch (type) {
      case 'strength': return Dumbbell;
      case 'conditioning': return Heart;
      case 'hybrid': return Zap;
      case 'agility': return Target;
    }
  };

  const getFilteredSessions = () => {
    if (selectedWorkoutType === 'all') return sessions;
    return sessions.filter(s => s.workoutType === selectedWorkoutType);
  };

  const handleBulkAction = async (action: BulkActionType, targetType?: BundleSession['workoutType']) => {
    setIsLoading(action);
    
    try {
      let sessionIds: string[];
      let metadata: any = {};

      if (targetType) {
        sessionIds = sessions.filter(s => s.workoutType === targetType).map(s => s.id);
        metadata = { workoutType: targetType };
      } else {
        sessionIds = sessions.map(s => s.id);
      }

      await onBulkAction(action, sessionIds, metadata);
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    
    setIsLoading('broadcast_message');
    
    try {
      const activeSessionIds = activeSessions.map(s => s.id);
      await onBulkAction('broadcast_message', activeSessionIds, { message: broadcastMessage });
      setBroadcastMessage('');
      setShowBroadcastDialog(false);
    } catch (error) {
      console.error('Broadcast failed:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const canPauseAll = activeSessions.length > 0;
  const canResumeAll = pausedSessions.length > 0 || preparingSessions.length > 0;
  const canBroadcast = activeSessions.length > 0;

  return (
    <>
      <div className={cn("flex items-center gap-3", className)}>
        {/* Quick Stats */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span>{totalParticipants} participants</span>
          <span className="text-gray-400">•</span>
          <span>{sessions.length} sessions</span>
        </div>

        {/* Session Status Badges */}
        <div className="flex items-center gap-2">
          {activeSessions.length > 0 && (
            <Badge className="bg-green-50 text-green-700 border-green-200">
              <PlayCircle className="h-3 w-3 mr-1" />
              {activeSessions.length} active
            </Badge>
          )}
          {pausedSessions.length > 0 && (
            <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <PauseCircle className="h-3 w-3 mr-1" />
              {pausedSessions.length} paused
            </Badge>
          )}
          {preparingSessions.length > 0 && (
            <Badge className="bg-blue-50 text-blue-700 border-blue-200">
              {preparingSessions.length} preparing
            </Badge>
          )}
        </div>

        {/* Workout Type Distribution */}
        {Object.keys(workoutTypeDistribution).length > 1 && (
          <div className="flex items-center gap-2">
            {Object.entries(workoutTypeDistribution).map(([type, count]) => {
              const Icon = getWorkoutTypeIcon(type as BundleSession['workoutType']);
              return (
                <Badge key={type} variant="outline" className="text-xs">
                  <Icon className="h-3 w-3 mr-1" />
                  {count} {type}
                </Badge>
              );
            })}
          </div>
        )}

        <div className="flex-1" /> {/* Spacer */}

        {/* Primary Actions */}
        <div className="flex items-center gap-2">
          {/* Pause All */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction('pause_all')}
            disabled={!canPauseAll || isLoading === 'pause_all'}
            className={cn(
              !canPauseAll && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading === 'pause_all' ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <PauseCircle className="h-4 w-4" />
            )}
            <span className="ml-2">{t('bundle.actions.pauseAll')}</span>
          </Button>

          {/* Resume All */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction('resume_all')}
            disabled={!canResumeAll || isLoading === 'resume_all'}
            className={cn(
              !canResumeAll && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading === 'resume_all' ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
            <span className="ml-2">{t('bundle.actions.resumeAll')}</span>
          </Button>

          {/* Broadcast Message */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBroadcastDialog(true)}
            disabled={!canBroadcast}
            className={cn(
              !canBroadcast && "opacity-50 cursor-not-allowed"
            )}
          >
            <Volume2 className="h-4 w-4" />
            <span className="ml-2">{t('bundle.actions.broadcast')}</span>
          </Button>

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem 
                onClick={() => handleBulkAction('export_data')}
                disabled={isLoading === 'export_data'}
              >
                <Download className="h-4 w-4 mr-2" />
                {t('bundle.actions.exportData')}
              </DropdownMenuItem>
              
              {/* Export by Type - only show if multiple types */}
              {Object.keys(workoutTypeDistribution).length > 1 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1 text-xs text-gray-500 font-medium">
                    {t('bundle.actions.exportByType')}
                  </div>
                  {Object.entries(workoutTypeDistribution).map(([type, count]) => {
                    const Icon = getWorkoutTypeIcon(type as BundleSession['workoutType']);
                    return (
                      <DropdownMenuItem 
                        key={type}
                        onClick={() => handleBulkAction('export_by_type', type as BundleSession['workoutType'])}
                        disabled={isLoading === 'export_by_type'}
                        className="pl-4"
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        <span className="capitalize">{type}</span>
                        <span className="text-gray-400 ml-auto">({count})</span>
                      </DropdownMenuItem>
                    );
                  })}
                </>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowBroadcastDialog(true)}
                disabled={!canBroadcast}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {t('bundle.actions.sendMessage')}
              </DropdownMenuItem>
              
              {/* Type-specific formats */}
              <DropdownMenuItem 
                onClick={() => handleBulkAction('export_data', undefined)}
                disabled={isLoading === 'export_data'}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {t('bundle.actions.exportSpreadsheet')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Broadcast Message Dialog */}
      <Dialog open={showBroadcastDialog} onOpenChange={setShowBroadcastDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              {t('bundle.broadcast.title')}
            </DialogTitle>
            <DialogDescription>
              {t('bundle.broadcast.description', { count: activeSessions.length })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Active Sessions Info */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-800 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">{t('bundle.broadcast.willReceive')}</span>
              </div>
              <div className="text-sm text-blue-700">
                {activeSessions.map(session => session.name).join(', ')}
              </div>
            </div>

            {/* Message Input */}
            <Textarea
              placeholder={t('bundle.broadcast.placeholder')}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="min-h-[100px]"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">
              {broadcastMessage.length}/500
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowBroadcastDialog(false);
                setBroadcastMessage('');
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleBroadcast}
              disabled={!broadcastMessage.trim() || isLoading === 'broadcast_message'}
            >
              {isLoading === 'broadcast_message' ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              ) : (
                <Volume2 className="h-4 w-4 mr-2" />
              )}
              {t('bundle.broadcast.send')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};