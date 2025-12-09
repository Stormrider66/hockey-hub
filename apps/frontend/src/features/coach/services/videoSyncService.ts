/**
 * Video Synchronization Service
 * 
 * Handles synchronization between video playback and tactical board animations
 * Provides automatic play detection and timeline synchronization
 */

import type {
  VideoSync,
  SyncMarker,
  VideoTacticalSync,
  VideoTimeline,
  TimelineMarker
} from '@/types/tactical/video.types';

export interface PlayState {
  id: string;
  name: string;
  duration: number;
  keyMoments: {
    timestamp: number;
    description: string;
    type: 'start' | 'key_action' | 'end' | 'transition';
  }[];
  playerPositions: {
    timestamp: number;
    players: {
      id: string;
      position: { x: number; y: number };
      action?: string;
    }[];
  }[];
}

export interface VideoSyncConfig {
  autoDetectPlays: boolean;
  syncTolerance: number; // seconds
  confidenceThreshold: number; // 0-1
  enableRealTimeSync: boolean;
  framerate: number;
}

class VideoSyncService {
  private videoElement: HTMLVideoElement | null = null;
  private playStateCallbacks: Map<string, (state: any) => void> = new Map();
  private syncPoints: Map<string, VideoSync[]> = new Map();
  private activeSync: VideoTacticalSync | null = null;
  private config: VideoSyncConfig = {
    autoDetectPlays: true,
    syncTolerance: 0.5,
    confidenceThreshold: 0.7,
    enableRealTimeSync: true,
    framerate: 30
  };

  /**
   * Initialize the sync service with a video element
   */
  initialize(videoElement: HTMLVideoElement, config?: Partial<VideoSyncConfig>) {
    this.videoElement = videoElement;
    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.setupVideoEventListeners();
  }

  /**
   * Set up event listeners for video element
   */
  private setupVideoEventListeners() {
    if (!this.videoElement) return;

    this.videoElement.addEventListener('timeupdate', this.handleTimeUpdate.bind(this));
    this.videoElement.addEventListener('play', this.handlePlay.bind(this));
    this.videoElement.addEventListener('pause', this.handlePause.bind(this));
    this.videoElement.addEventListener('seeked', this.handleSeek.bind(this));
  }

  /**
   * Handle video time updates for synchronization
   */
  private handleTimeUpdate() {
    if (!this.videoElement || !this.activeSync) return;

    const currentTime = this.videoElement.currentTime;
    this.updateTacticalBoardState(currentTime);
  }

  /**
   * Handle video play event
   */
  private handlePlay() {
    if (this.config.enableRealTimeSync) {
      this.startRealTimeSync();
    }
  }

  /**
   * Handle video pause event
   */
  private handlePause() {
    this.stopRealTimeSync();
  }

  /**
   * Handle video seek event
   */
  private handleSeek() {
    if (!this.videoElement || !this.activeSync) return;

    const currentTime = this.videoElement.currentTime;
    this.syncToVideoTime(currentTime);
  }

  /**
   * Create synchronization between video and play
   */
  async createSync(
    videoId: string,
    playId: string,
    playState: PlayState,
    videoMarkers: SyncMarker[]
  ): Promise<VideoSync> {
    const sync: VideoSync = {
      videoId,
      playId,
      videoTimestamp: 0,
      playTimestamp: 0,
      confidence: 0,
      syncType: 'manual',
      markers: videoMarkers
    };

    // Auto-detect sync points if enabled
    if (this.config.autoDetectPlays) {
      const detectedMarkers = await this.autoDetectSyncPoints(playState, videoMarkers);
      sync.markers = [...videoMarkers, ...detectedMarkers];
      sync.syncType = 'auto';
      sync.confidence = this.calculateSyncConfidence(sync.markers);
    }

    // Store sync data
    const existingSyncs = this.syncPoints.get(videoId) || [];
    this.syncPoints.set(videoId, [...existingSyncs, sync]);

    return sync;
  }

  /**
   * Auto-detect synchronization points between video and play
   */
  private async autoDetectSyncPoints(
    playState: PlayState,
    existingMarkers: SyncMarker[]
  ): Promise<SyncMarker[]> {
    const detectedMarkers: SyncMarker[] = [];

    // Analyze key moments in the play
    for (const moment of playState.keyMoments) {
      const videoTime = await this.detectVideoTimeForMoment(moment);
      if (videoTime !== null) {
        detectedMarkers.push({
          id: `auto-${Date.now()}-${Math.random()}`,
          videoTime,
          playTime: moment.timestamp,
          description: moment.description,
          type: moment.type as SyncMarker['type'],
          verified: false
        });
      }
    }

    return detectedMarkers;
  }

  /**
   * Detect video timestamp for a specific play moment
   * This would use computer vision/ML in a real implementation
   */
  private async detectVideoTimeForMoment(moment: any): Promise<number | null> {
    // Mock implementation - in reality this would use:
    // - Object detection for players/puck
    // - Motion analysis
    // - Audio analysis for whistle/crowd sounds
    // - OCR for scoreboard/clock
    
    // Simulate detection delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock detection with some randomness
    if (Math.random() > 0.3) {
      return Math.random() * 300; // Random time up to 5 minutes
    }
    
    return null;
  }

  /**
   * Calculate confidence score for synchronization
   */
  private calculateSyncConfidence(markers: SyncMarker[]): number {
    if (markers.length === 0) return 0;

    const verifiedCount = markers.filter(m => m.verified).length;
    const totalCount = markers.length;
    const baseConfidence = verifiedCount / totalCount;

    // Boost confidence if we have start and end markers
    const hasStart = markers.some(m => m.type === 'start');
    const hasEnd = markers.some(m => m.type === 'end');
    const completenessBonus = (hasStart && hasEnd) ? 0.2 : 0;

    // Penalize for sparse markers
    const densityPenalty = Math.max(0, (5 - totalCount) * 0.05);

    return Math.max(0, Math.min(1, baseConfidence + completenessBonus - densityPenalty));
  }

  /**
   * Start active synchronization
   */
  startSync(videoId: string, boardId: string, playId: string): boolean {
    const syncs = this.syncPoints.get(videoId);
    const playSync = syncs?.find(s => s.playId === playId);

    if (!playSync || playSync.confidence < this.config.confidenceThreshold) {
      return false;
    }

    this.activeSync = {
      videoId,
      boardId,
      syncPoints: this.createSyncPoints(playSync),
      activeSync: true,
      lastSyncTime: Date.now()
    };

    return true;
  }

  /**
   * Stop active synchronization
   */
  stopSync() {
    this.activeSync = null;
    this.stopRealTimeSync();
  }

  /**
   * Create sync points for tactical board updates
   */
  private createSyncPoints(sync: VideoSync): VideoTacticalSync['syncPoints'] {
    return sync.markers.map(marker => ({
      videoTime: marker.videoTime,
      boardState: this.generateBoardStateForTime(marker.playTime),
      playPosition: marker.playTime
    }));
  }

  /**
   * Generate board state for a specific play time
   * This would integrate with the tactical board system
   */
  private generateBoardStateForTime(playTime: number): any {
    // Mock board state - in reality this would:
    // - Get player positions from play data
    // - Calculate puck position
    // - Set up formation/strategy display
    // - Handle transitions and animations
    
    return {
      players: [
        { id: 'player1', position: { x: 100 + playTime * 5, y: 200 }, role: 'forward' },
        { id: 'player2', position: { x: 150 + playTime * 3, y: 180 }, role: 'forward' },
        { id: 'player3', position: { x: 120 + playTime * 4, y: 220 }, role: 'forward' },
        // Add more players...
      ],
      puck: { x: 200 + playTime * 10, y: 200 },
      formations: ['powerplay', 'offensive'],
      timestamp: playTime
    };
  }

  /**
   * Update tactical board state based on video time
   */
  private updateTacticalBoardState(videoTime: number) {
    if (!this.activeSync) return;

    // Find the closest sync point
    const syncPoint = this.findClosestSyncPoint(videoTime);
    if (!syncPoint) return;

    // Calculate play time based on sync point
    const playTime = this.calculatePlayTime(videoTime, syncPoint);

    // Update board state
    const boardState = this.generateBoardStateForTime(playTime);
    this.notifyBoardUpdate(boardState);

    // Update sync timestamp
    this.activeSync.lastSyncTime = Date.now();
  }

  /**
   * Find closest sync point to video time
   */
  private findClosestSyncPoint(videoTime: number): VideoTacticalSync['syncPoints'][0] | null {
    if (!this.activeSync) return null;

    let closest = this.activeSync.syncPoints[0];
    let minDistance = Math.abs(videoTime - closest.videoTime);

    for (const point of this.activeSync.syncPoints) {
      const distance = Math.abs(videoTime - point.videoTime);
      if (distance < minDistance) {
        minDistance = distance;
        closest = point;
      }
    }

    // Only return if within tolerance
    return minDistance <= this.config.syncTolerance ? closest : null;
  }

  /**
   * Calculate play time from video time using sync point
   */
  private calculatePlayTime(videoTime: number, syncPoint: VideoTacticalSync['syncPoints'][0]): number {
    const timeDiff = videoTime - syncPoint.videoTime;
    return syncPoint.playPosition + timeDiff;
  }

  /**
   * Notify tactical board of state update
   */
  private notifyBoardUpdate(boardState: any) {
    this.playStateCallbacks.forEach(callback => {
      try {
        callback(boardState);
      } catch (error) {
        console.error('Error in board update callback:', error);
      }
    });
  }

  /**
   * Start real-time synchronization
   */
  private startRealTimeSync() {
    // Implementation would start high-frequency updates
    console.log('Starting real-time sync');
  }

  /**
   * Stop real-time synchronization
   */
  private stopRealTimeSync() {
    // Implementation would stop high-frequency updates
    console.log('Stopping real-time sync');
  }

  /**
   * Sync tactical board to specific video time
   */
  private syncToVideoTime(videoTime: number) {
    this.updateTacticalBoardState(videoTime);
  }

  /**
   * Register callback for board state updates
   */
  onBoardStateUpdate(id: string, callback: (state: any) => void) {
    this.playStateCallbacks.set(id, callback);
  }

  /**
   * Unregister callback for board state updates
   */
  offBoardStateUpdate(id: string) {
    this.playStateCallbacks.delete(id);
  }

  /**
   * Get video timeline with markers
   */
  getVideoTimeline(videoId: string): VideoTimeline | null {
    const syncs = this.syncPoints.get(videoId);
    if (!syncs || syncs.length === 0) return null;

    const timeline: VideoTimeline = {
      videoId,
      duration: 0, // Would be set from video metadata
      markers: [],
      annotations: [],
      clips: [],
      sync: syncs
    };

    // Convert sync markers to timeline markers
    syncs.forEach(sync => {
      sync.markers.forEach(marker => {
        timeline.markers.push({
          id: marker.id,
          time: marker.videoTime,
          type: this.mapSyncTypeToTimelineType(marker.type),
          label: marker.description || `${marker.type} - ${sync.playId}`,
          color: this.getColorForMarkerType(marker.type),
          playId: sync.playId
        });
      });
    });

    return timeline;
  }

  /**
   * Map sync marker type to timeline marker type
   */
  private mapSyncTypeToTimelineType(type: SyncMarker['type']): TimelineMarker['type'] {
    switch (type) {
      case 'start': return 'play_start';
      case 'end': return 'play_end';
      case 'key_moment': return 'key_moment';
      default: return 'custom';
    }
  }

  /**
   * Get color for marker type
   */
  private getColorForMarkerType(type: SyncMarker['type']): string {
    switch (type) {
      case 'start': return '#00FF00';
      case 'end': return '#FF0000';
      case 'key_moment': return '#FFFF00';
      default: return '#FFFFFF';
    }
  }

  /**
   * Export sync data
   */
  exportSyncData(videoId: string): VideoSync[] | null {
    return this.syncPoints.get(videoId) || null;
  }

  /**
   * Import sync data
   */
  importSyncData(videoId: string, syncs: VideoSync[]) {
    this.syncPoints.set(videoId, syncs);
  }

  /**
   * Validate sync quality
   */
  validateSync(sync: VideoSync): {
    isValid: boolean;
    issues: string[];
    confidence: number;
  } {
    const issues: string[] = [];
    
    if (sync.markers.length < 2) {
      issues.push('Insufficient sync markers (minimum 2 required)');
    }

    const hasStart = sync.markers.some(m => m.type === 'start');
    const hasEnd = sync.markers.some(m => m.type === 'end');
    
    if (!hasStart) {
      issues.push('Missing start marker');
    }
    
    if (!hasEnd) {
      issues.push('Missing end marker');
    }

    const verifiedCount = sync.markers.filter(m => m.verified).length;
    if (verifiedCount === 0) {
      issues.push('No verified sync markers');
    }

    const confidence = this.calculateSyncConfidence(sync.markers);
    if (confidence < this.config.confidenceThreshold) {
      issues.push(`Sync confidence too low (${confidence.toFixed(2)} < ${this.config.confidenceThreshold})`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      confidence
    };
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stopSync();
    this.playStateCallbacks.clear();
    this.syncPoints.clear();
    
    if (this.videoElement) {
      this.videoElement.removeEventListener('timeupdate', this.handleTimeUpdate.bind(this));
      this.videoElement.removeEventListener('play', this.handlePlay.bind(this));
      this.videoElement.removeEventListener('pause', this.handlePause.bind(this));
      this.videoElement.removeEventListener('seeked', this.handleSeek.bind(this));
    }
  }
}

// Export singleton instance
export const videoSyncService = new VideoSyncService();

// Export utility functions
export const createManualSyncMarker = (
  videoTime: number,
  playTime: number,
  description: string,
  type: SyncMarker['type'] = 'key_moment'
): SyncMarker => ({
  id: `manual-${Date.now()}-${Math.random()}`,
  videoTime,
  playTime,
  description,
  type,
  verified: true
});

export const validateSyncTiming = (markers: SyncMarker[]): boolean => {
  // Check if markers are in chronological order
  for (let i = 1; i < markers.length; i++) {
    if (markers[i].videoTime < markers[i - 1].videoTime) {
      return false;
    }
    if (markers[i].playTime < markers[i - 1].playTime) {
      return false;
    }
  }
  return true;
};

export default videoSyncService;