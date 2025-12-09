// Group Session Monitoring Components
// Phase 5: Group Session Monitoring - Complete Implementation

export { default as GroupSessionMonitor } from './GroupSessionMonitor';
export { default as EnhancedGroupSessionMonitor } from './EnhancedGroupSessionMonitor';
export { default as PlayerDetailView } from './PlayerDetailView';
export { default as SessionControlPanel } from './SessionControlPanel';
export { default as TeamMetricsAnalytics } from './TeamMetricsAnalytics';
export { default as WorkoutTypeGroupMonitor } from './WorkoutTypeGroupMonitor';

// Hooks
export { useGroupSessionBroadcast } from '../../hooks/useGroupSessionBroadcast';
export type { 
  RealTimePlayerMetrics, 
  TeamAggregateMetrics,
  SessionControlCommand,
  PlayerControlCommand,
  TrainerMessage
} from '../../hooks/useGroupSessionBroadcast';

// Component Types
export interface GroupSessionMonitorProps {
  sessionId: string;
  participants: Array<{
    id: string;
    name: string;
    playerTests?: any[];
    medicalRestrictions?: string[];
  }>;
  mode?: 'monitor' | 'analytics' | 'both';
  onBack?: () => void;
}

// Usage Examples:
/*
// Basic Group Monitor for Conditioning
import { WorkoutTypeGroupMonitor } from '@/features/physical-trainer/components/group-session';

<WorkoutTypeGroupMonitor
  sessionId="session-123"
  workout={conditioningSession}
  workoutType="conditioning"
  participants={teamPlayers}
  mode="both"
  onBack={() => navigate('/sessions')}
/>

// Enhanced Group Monitor with Custom Controls
import { EnhancedGroupSessionMonitor } from '@/features/physical-trainer/components/group-session';

<EnhancedGroupSessionMonitor
  sessionId="session-456"
  workout={strengthWorkout}
  workoutType="strength"
  participants={selectedPlayers}
  onBack={handleBack}
/>

// Real-time WebSocket Broadcasting
import { useGroupSessionBroadcast } from '@/features/physical-trainer/components/group-session';

const {
  connectionStatus,
  playerMetrics,
  teamMetrics,
  sendSessionControl,
  sendPlayerControl,
  emergencyStopAll
} = useGroupSessionBroadcast('session-789', 'trainer');

// Team Analytics Only
import { TeamMetricsAnalytics } from '@/features/physical-trainer/components/group-session';

<TeamMetricsAnalytics
  teamMetrics={teamMetrics}
  playerMetrics={playerMetrics}
  workoutType="hybrid"
  sessionDuration={3600}
/>
*/