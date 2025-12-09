/**
 * Collaborative Play System Editor
 * Wraps the existing PlaySystemEditor with real-time collaboration features
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@hockey-hub/translations';
import {
  CollaborationProvider,
  useCollaboration,
  useCollaborationUpdates,
  useCollaborationPresence
} from '../../providers/CollaborationProvider';
import CollaborationUI from '../collaboration/CollaborationUI';
import LiveCoachingMode from '../collaboration/LiveCoachingMode';
import PlaySystemEditor from './PlaySystemEditor';
import {
  CollaborationUser,
  TacticalUpdate
} from '@hockey-hub/shared-types/src/tactical/collaboration.types';

interface CollaborativePlaySystemEditorProps {
  teamId: string;
  playId: string;
  currentUser: CollaborationUser;
  onClose: () => void;
}

// Mock data for development
const mockCurrentUser: CollaborationUser = {
  id: 'user-1',
  name: 'Coach Mike',
  role: 'Head Coach',
  color: '#3b82f6'
};

// Inner component that has access to collaboration context
function CollaborativeEditorContent({
  teamId,
  playId,
  onClose
}: {
  teamId: string;
  playId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation('coach');
  const { state, connect, disconnect } = useCollaboration();
  const { sendUpdate } = useCollaborationUpdates();
  const { updateCursor } = useCollaborationPresence();
  
  const [isLiveModeActive, setIsLiveModeActive] = useState(false);
  const [playData, setPlayData] = useState<any>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  // Connect to collaboration service on mount
  useEffect(() => {
    if (!isInitialized.current && state.currentUser) {
      connect(state.currentUser.id).catch(error => {
        console.error('Failed to connect to collaboration service:', error);
        toast.error(t('collaboration.connectionFailed'));
      });
      isInitialized.current = true;
    }

    return () => {
      if (isInitialized.current) {
        disconnect();
      }
    };
  }, [connect, disconnect, state.currentUser, t]);

  // Handle play data changes and broadcast updates
  const handlePlayDataChange = useCallback((newData: any, changeType: string) => {
    setPlayData(newData);

    // Only send updates if we're in a collaboration session
    if (state.currentSession && state.isConnected) {
      const update: Omit<TacticalUpdate, 'id' | 'timestamp' | 'sessionId' | 'userId'> = {
        type: changeType as any,
        data: newData
      };

      sendUpdate(update);
    }
  }, [state.currentSession, state.isConnected, sendUpdate]);

  // Handle mouse movements for cursor tracking
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!state.currentSession || !state.settings.showCursors) return;

    const rect = editorRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    updateCursor({ x, y });
  }, [state.currentSession, state.settings.showCursors, updateCursor]);

  // Handle live mode toggle
  const handleLiveModeToggle = useCallback((active: boolean) => {
    setIsLiveModeActive(active);
  }, []);

  // Connection status effects
  useEffect(() => {
    if (state.connectionError) {
      toast.error(t('collaboration.connectionError'));
    }
  }, [state.connectionError, t]);

  return (
    <div 
      ref={editorRef}
      className="relative h-full w-full"
      onMouseMove={handleMouseMove}
    >
      {/* Collaboration UI overlay */}
      {!isLiveModeActive && (
        <div className="absolute top-4 left-4 z-40">
          <CollaborationUI
            playId={playId}
            isLiveModeActive={isLiveModeActive}
            onToggleLiveMode={handleLiveModeToggle}
          />
        </div>
      )}

      {/* Connection status indicator */}
      {state.isConnecting && (
        <div className="absolute top-4 right-4 z-40 bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2 text-yellow-800 text-sm">
          {t('collaboration.connecting')}...
        </div>
      )}

      {/* Main editor */}
      <PlaySystemEditor
        teamId={teamId}
        onClose={onClose}
      />

      {/* Live coaching mode overlay */}
      {isLiveModeActive && (
        <LiveCoachingMode
          isActive={isLiveModeActive}
          onToggle={handleLiveModeToggle}
          playId={playId}
          sessionId={state.currentSession?.id || ''}
        />
      )}

      {/* Session participants count in bottom right */}
      {state.currentSession && !isLiveModeActive && (
        <div className="absolute bottom-4 right-4 z-40 bg-white rounded-lg shadow-lg border px-3 py-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>{state.participants.length} {t('collaboration.participants')}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Main wrapper component
export default function CollaborativePlaySystemEditor({
  teamId,
  playId,
  currentUser,
  onClose
}: CollaborativePlaySystemEditorProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const authToken = ''; // Would get this from auth context

  return (
    <CollaborationProvider
      apiUrl={apiUrl}
      authToken={authToken}
      currentUser={currentUser}
    >
      <CollaborativeEditorContent
        teamId={teamId}
        playId={playId}
        onClose={onClose}
      />
    </CollaborationProvider>
  );
}

// Export the mock user for easy testing
export { mockCurrentUser };