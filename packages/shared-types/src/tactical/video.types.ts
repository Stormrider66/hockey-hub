/**
 * Tactical Video System Types
 * 
 * Comprehensive type definitions for video integration in tactical system
 */

// Video file and stream types
export interface VideoSource {
  id: string;
  url: string;
  type: 'local' | 'youtube' | 'vimeo' | 'stream' | 'upload';
  format?: string;
  quality?: 'low' | 'medium' | 'high' | 'hd' | '4k';
  duration?: number;
  thumbnailUrl?: string;
  metadata?: VideoMetadata;
}

export interface VideoMetadata {
  title?: string;
  description?: string;
  uploadedAt?: Date;
  uploadedBy?: string;
  fileSize?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  framerate?: number;
  codec?: string;
  tags?: string[];
}

// Annotation system types
export interface VideoAnnotation {
  id: string;
  videoId: string;
  timestamp: number;
  duration?: number;
  type: 'arrow' | 'circle' | 'rectangle' | 'text' | 'freehand' | 'line';
  data: AnnotationData;
  author: string;
  createdAt: Date;
  visible: boolean;
  playId?: string;
}

export interface AnnotationData {
  position: { x: number; y: number };
  color: string;
  strokeWidth: number;
  opacity: number;
  // Type-specific data
  text?: string;
  fontSize?: number;
  points?: { x: number; y: number }[];
  dimensions?: { width: number; height: number };
  rotation?: number;
}

// Drawing tool types
export interface DrawingTool {
  type: VideoAnnotation['type'];
  color: string;
  strokeWidth: number;
  opacity: number;
  active: boolean;
}

export interface DrawingState {
  isDrawing: boolean;
  currentTool: DrawingTool;
  activeAnnotation?: VideoAnnotation;
  undoStack: VideoAnnotation[];
  redoStack: VideoAnnotation[];
}

// Video clip types
export interface VideoClip {
  id: string;
  videoId: string;
  name: string;
  description?: string;
  startTime: number;
  endTime: number;
  tags: string[];
  playIds: string[];
  formations: string[];
  thumbnailUrl?: string;
  createdAt: Date;
  createdBy: string;
  shared: boolean;
  annotations: VideoAnnotation[];
}

export interface ClipCollection {
  id: string;
  name: string;
  description?: string;
  clips: VideoClip[];
  tags: string[];
  shared: boolean;
  createdAt: Date;
  createdBy: string;
}

// Buffered time range (compatible with DOM TimeRanges interface)
export interface BufferedRange {
  start: number;
  end: number;
}

export interface BufferedRanges {
  length: number;
  ranges: BufferedRange[];
}

// Video player types
export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  fullscreen: boolean;
  loading: boolean;
  buffered: BufferedRanges | null;
}

export interface VideoPlayerControls {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  skipFrames: (frames: number) => void;
  takeScreenshot: () => Promise<string>;
}

// Synchronization types
export interface VideoSync {
  videoId: string;
  playId: string;
  videoTimestamp: number;
  playTimestamp: number;
  confidence: number;
  syncType: 'auto' | 'manual';
  markers: SyncMarker[];
}

export interface SyncMarker {
  id: string;
  videoTime: number;
  playTime: number;
  description?: string;
  type: 'start' | 'key_moment' | 'end';
  verified: boolean;
}

// Timeline and synchronization
export interface VideoTimeline {
  videoId: string;
  duration: number;
  markers: TimelineMarker[];
  annotations: VideoAnnotation[];
  clips: VideoClip[];
  sync: VideoSync[];
}

export interface TimelineMarker {
  id: string;
  time: number;
  type: 'play_start' | 'play_end' | 'key_moment' | 'annotation' | 'custom';
  label: string;
  color: string;
  playId?: string;
  annotationId?: string;
}

// Video upload and storage types
export interface VideoUpload {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  result?: VideoSource;
}

export interface VideoLibrary {
  id: string;
  name: string;
  description?: string;
  videos: VideoSource[];
  clips: VideoClip[];
  collections: ClipCollection[];
  shared: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Analysis and AI types
export interface VideoAnalysis {
  id: string;
  videoId: string;
  type: 'player_tracking' | 'play_recognition' | 'formation_detection' | 'movement_analysis';
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  results?: any;
  confidence?: number;
  processedAt?: Date;
}

// Integration with tactical board
export interface VideoTacticalSync {
  videoId: string;
  boardId: string;
  syncPoints: {
    videoTime: number;
    boardState: any;
    playPosition: number;
  }[];
  activeSync: boolean;
  lastSyncTime: number;
}

// Feature flags and configuration
export interface VideoFeatureFlags {
  annotations: boolean;
  frameByFrame: boolean;
  aiAnalysis: boolean;
  socialSharing: boolean;
  liveStream: boolean;
  collaboration: boolean;
  exports: boolean;
  telestrator: boolean;
}

export interface VideoConfiguration {
  maxFileSize: number;
  supportedFormats: string[];
  quality: {
    default: string;
    options: string[];
  };
  annotations: {
    maxAnnotations: number;
    colors: string[];
    tools: DrawingTool['type'][];
  };
  clips: {
    maxDuration: number;
    minDuration: number;
    maxClips: number;
  };
  features: VideoFeatureFlags;
}

// Events and callbacks
export interface VideoEvent {
  type: 'play' | 'pause' | 'seek' | 'timeupdate' | 'ended' | 'error' | 'loaded';
  timestamp: number;
  data?: any;
}

export interface VideoEventHandlers {
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
  onError?: (error: Error) => void;
  onLoaded?: () => void;
  onAnnotationAdd?: (annotation: VideoAnnotation) => void;
  onAnnotationUpdate?: (annotation: VideoAnnotation) => void;
  onAnnotationDelete?: (annotationId: string) => void;
}

// Export types
export interface VideoExport {
  id: string;
  type: 'clip' | 'annotations' | 'analysis' | 'combined';
  format: 'mp4' | 'webm' | 'gif' | 'pdf' | 'json';
  quality?: string;
  includeAnnotations: boolean;
  includeAudio: boolean;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  downloadUrl?: string;
  expiresAt?: Date;
}

// Search and filtering
export interface VideoSearchFilters {
  query?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  duration?: {
    min: number;
    max: number;
  };
  author?: string;
  type?: VideoSource['type'];
  hasAnnotations?: boolean;
  hasClips?: boolean;
  playIds?: string[];
  formations?: string[];
}

export interface VideoSearchResult {
  videos: VideoSource[];
  clips: VideoClip[];
  annotations: VideoAnnotation[];
  total: number;
  page: number;
  limit: number;
}

// Collaborative features
export interface VideoCollaboration {
  id: string;
  videoId: string;
  participants: {
    userId: string;
    role: 'owner' | 'editor' | 'viewer';
    lastActive: Date;
  }[];
  permissions: {
    canAnnotate: boolean;
    canClip: boolean;
    canShare: boolean;
    canExport: boolean;
  };
  realTime: {
    enabled: boolean;
    cursors: boolean;
    annotations: boolean;
    playback: boolean;
  };
}