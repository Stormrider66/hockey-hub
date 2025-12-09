'use client';

import { useEffect, useMemo } from 'react';
import { 
  tacticalCommunicationService,
  TacticalPlayData,
  TacticalShareOptions,
  TacticalMessage
} from '../services/tacticalCommunicationService';

/**
 * React hook wrapper for TacticalCommunicationService
 * Handles the socket connection and provides methods to interact with the service
 * Note: Socket functionality is optional - works without socket for local features
 */
export const useTacticalCommunication = () => {
  // Socket is optional - tactical features work without real-time sharing
  const socket = null;

  // Set the socket on the service when it becomes available
  useEffect(() => {
    if (socket) {
      tacticalCommunicationService.setSocket(socket);
    }
  }, [socket]);

  // Return memoized service methods
  const methods = useMemo(() => ({
    // Share methods
    sharePlay: (play: TacticalPlayData, options: TacticalShareOptions) => 
      tacticalCommunicationService.sharePlay(play, options),
    
    shareToTeam: (play: TacticalPlayData, teamId: string, message?: string) =>
      tacticalCommunicationService.shareToTeam(play, teamId, message),
    
    shareToPlayer: (play: TacticalPlayData, playerId: string, message?: string) =>
      tacticalCommunicationService.shareToPlayer(play, playerId, message),
    
    shareToRole: (play: TacticalPlayData, role: string, teamId: string, message?: string) =>
      tacticalCommunicationService.shareToRole(play, role, teamId, message),
    
    shareToPositionGroup: (play: TacticalPlayData, positions: string[], teamId: string, message?: string) =>
      tacticalCommunicationService.shareToPositionGroup(play, positions, teamId, message),
    
    // Message handling
    sendTacticalMessage: (message: TacticalMessage, conversationId: string) =>
      tacticalCommunicationService.sendTacticalMessage(message, conversationId),
    
    // Analysis sharing
    shareAnalysis: (play: TacticalPlayData, analysis: any, teamId: string) =>
      tacticalCommunicationService.shareAnalysis(play, analysis, teamId),
    
    // Training scheduling
    scheduleTrainingSession: (play: TacticalPlayData, sessionDetails: any, teamId: string) =>
      tacticalCommunicationService.scheduleTrainingSession(play, sessionDetails, teamId),
    
    // Video sharing
    shareVideoAnalysis: (play: TacticalPlayData, videoUrl: string, timestamps: any[], teamId: string) =>
      tacticalCommunicationService.shareVideoAnalysis(play, videoUrl, timestamps, teamId),
    
    // History and stats
    getShareHistory: () => tacticalCommunicationService.getShareHistory(),
    getShareStats: () => tacticalCommunicationService.getShareStats(),
    
    // Real-time collaboration
    startLivePlayEditing: (playId: string, conversationId: string) =>
      tacticalCommunicationService.startLivePlayEditing(playId, conversationId),
    
    broadcastPlayChange: (playId: string, changes: any, conversationId: string) =>
      tacticalCommunicationService.broadcastPlayChange(playId, changes, conversationId),
    
    stopLivePlayEditing: (playId: string, conversationId: string) =>
      tacticalCommunicationService.stopLivePlayEditing(playId, conversationId),
    
    // Socket status
    isConnected: !!socket
  }), [socket]);

  return methods;
};

export default useTacticalCommunication;