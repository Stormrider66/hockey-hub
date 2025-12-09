/**
 * Mock Video Data for Tactical System Testing
 * 
 * Provides realistic test data for video integration features
 */

import type {
  VideoSource,
  VideoClip,
  ClipCollection,
  VideoAnnotation,
  VideoLibrary,
  VideoTimeline,
  VideoSync,
  SyncMarker
} from '@/types/tactical/video.types';

// Sample video sources
export const MOCK_VIDEO_SOURCES: VideoSource[] = [
  {
    id: 'game-video-1',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    type: 'local',
    format: 'mp4',
    quality: 'hd',
    duration: 596,
    thumbnailUrl: '/api/placeholder/320/180',
    metadata: {
      title: 'Power Play Analysis - Game vs Rangers',
      description: 'Third period power play opportunities and execution',
      uploadedAt: new Date('2024-01-15T19:30:00Z'),
      uploadedBy: 'coach-smith',
      fileSize: 45000000,
      dimensions: { width: 1920, height: 1080 },
      framerate: 30,
      codec: 'h264',
      tags: ['power-play', 'third-period', 'rangers', 'analysis']
    }
  },
  {
    id: 'practice-video-1',
    url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    type: 'local',
    format: 'mp4',
    quality: 'hd',
    duration: 300,
    thumbnailUrl: '/api/placeholder/320/180',
    metadata: {
      title: 'Morning Practice - Breakout Drills',
      description: 'Defensive zone exits and transition practice',
      uploadedAt: new Date('2024-01-16T10:00:00Z'),
      uploadedBy: 'coach-johnson',
      fileSize: 25000000,
      dimensions: { width: 1280, height: 720 },
      framerate: 30,
      codec: 'h264',
      tags: ['practice', 'breakout', 'defense', 'transition']
    }
  },
  {
    id: 'youtube-demo-1',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    type: 'youtube',
    format: 'mp4',
    quality: 'hd',
    duration: 212,
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    metadata: {
      title: 'NHL Skills Competition Highlights',
      description: 'Best moments from the annual skills competition',
      uploadedAt: new Date('2024-01-10T15:00:00Z'),
      tags: ['nhl', 'skills', 'competition', 'highlights']
    }
  },
  {
    id: 'penalty-kill-1',
    url: '/videos/penalty-kill-analysis.mp4',
    type: 'local',
    format: 'mp4',
    quality: 'hd',
    duration: 180,
    thumbnailUrl: '/api/placeholder/320/180',
    metadata: {
      title: 'Penalty Kill Systems Review',
      description: 'Analysis of penalty kill formations and player positioning',
      uploadedAt: new Date('2024-01-17T14:30:00Z'),
      uploadedBy: 'coach-adams',
      fileSize: 18000000,
      dimensions: { width: 1920, height: 1080 },
      framerate: 30,
      codec: 'h264',
      tags: ['penalty-kill', 'systems', 'defense', 'positioning']
    }
  }
];

// Sample video annotations
export const MOCK_VIDEO_ANNOTATIONS: VideoAnnotation[] = [
  {
    id: 'annotation-1',
    videoId: 'game-video-1',
    timestamp: 45.5,
    duration: 3,
    type: 'arrow',
    data: {
      position: { x: 400, y: 200 },
      color: '#FF0000',
      strokeWidth: 3,
      opacity: 0.8,
      points: [
        { x: 400, y: 200 },
        { x: 550, y: 180 }
      ]
    },
    author: 'coach-smith',
    createdAt: new Date('2024-01-15T20:15:00Z'),
    visible: true,
    playId: 'power-play-1'
  },
  {
    id: 'annotation-2',
    videoId: 'game-video-1',
    timestamp: 47.2,
    duration: 2,
    type: 'circle',
    data: {
      position: { x: 320, y: 240 },
      color: '#00FF00',
      strokeWidth: 4,
      opacity: 0.7,
      dimensions: { width: 80, height: 80 }
    },
    author: 'coach-smith',
    createdAt: new Date('2024-01-15T20:16:00Z'),
    visible: true,
    playId: 'power-play-1'
  },
  {
    id: 'annotation-3',
    videoId: 'practice-video-1',
    timestamp: 120.8,
    duration: 4,
    type: 'text',
    data: {
      position: { x: 100, y: 50 },
      color: '#FFFF00',
      strokeWidth: 2,
      opacity: 1,
      text: 'Perfect timing on the breakout pass',
      fontSize: 18
    },
    author: 'coach-johnson',
    createdAt: new Date('2024-01-16T10:30:00Z'),
    visible: true
  },
  {
    id: 'annotation-4',
    videoId: 'game-video-1',
    timestamp: 52.1,
    duration: 3,
    type: 'freehand',
    data: {
      position: { x: 200, y: 300 },
      color: '#0000FF',
      strokeWidth: 2,
      opacity: 0.9,
      points: [
        { x: 200, y: 300 },
        { x: 220, y: 290 },
        { x: 250, y: 285 },
        { x: 280, y: 290 },
        { x: 300, y: 300 }
      ]
    },
    author: 'coach-smith',
    createdAt: new Date('2024-01-15T20:18:00Z'),
    visible: true,
    playId: 'power-play-1'
  }
];

// Sample video clips
export const MOCK_VIDEO_CLIPS: VideoClip[] = [
  {
    id: 'clip-1',
    videoId: 'game-video-1',
    name: 'Power Play Goal Setup',
    description: 'Excellent puck movement leading to scoring opportunity',
    startTime: 43.0,
    endTime: 58.5,
    tags: ['power-play', 'goal', 'passing', 'setup'],
    playIds: ['power-play-1'],
    formations: ['1-3-1', 'umbrella'],
    thumbnailUrl: '/api/placeholder/160/90',
    createdAt: new Date('2024-01-15T21:00:00Z'),
    createdBy: 'coach-smith',
    shared: true,
    annotations: MOCK_VIDEO_ANNOTATIONS.filter(a => 
      a.timestamp >= 43.0 && a.timestamp <= 58.5 && a.videoId === 'game-video-1'
    )
  },
  {
    id: 'clip-2',
    videoId: 'practice-video-1',
    name: 'Breakout Execution',
    description: 'Clean defensive zone exit with proper support',
    startTime: 115.0,
    endTime: 135.0,
    tags: ['breakout', 'defense', 'transition', 'support'],
    playIds: ['breakout-system-1'],
    formations: ['defensive-zone-coverage'],
    thumbnailUrl: '/api/placeholder/160/90',
    createdAt: new Date('2024-01-16T11:15:00Z'),
    createdBy: 'coach-johnson',
    shared: false,
    annotations: MOCK_VIDEO_ANNOTATIONS.filter(a => 
      a.timestamp >= 115.0 && a.timestamp <= 135.0 && a.videoId === 'practice-video-1'
    )
  },
  {
    id: 'clip-3',
    videoId: 'penalty-kill-1',
    name: 'PK Diamond Formation',
    description: 'Perfect diamond positioning during 5-on-4 penalty kill',
    startTime: 60.0,
    endTime: 85.0,
    tags: ['penalty-kill', 'diamond', 'positioning', 'defense'],
    playIds: ['pk-diamond-1'],
    formations: ['diamond'],
    thumbnailUrl: '/api/placeholder/160/90',
    createdAt: new Date('2024-01-17T15:00:00Z'),
    createdBy: 'coach-adams',
    shared: true,
    annotations: []
  },
  {
    id: 'clip-4',
    videoId: 'game-video-1',
    name: 'Neutral Zone Trap',
    description: 'Forcing turnovers with structured neutral zone play',
    startTime: 120.0,
    endTime: 140.0,
    tags: ['neutral-zone', 'trap', 'turnover', 'structure'],
    playIds: ['nz-trap-1'],
    formations: ['1-2-2'],
    thumbnailUrl: '/api/placeholder/160/90',
    createdAt: new Date('2024-01-15T21:30:00Z'),
    createdBy: 'coach-smith',
    shared: false,
    annotations: []
  }
];

// Sample clip collections
export const MOCK_CLIP_COLLECTIONS: ClipCollection[] = [
  {
    id: 'collection-1',
    name: 'Power Play Systems',
    description: 'Collection of power play setups and executions',
    clips: [MOCK_VIDEO_CLIPS[0]],
    tags: ['power-play', 'systems', 'special-teams'],
    shared: true,
    createdAt: new Date('2024-01-15T22:00:00Z'),
    createdBy: 'coach-smith'
  },
  {
    id: 'collection-2',
    name: 'Defensive Zone Coverage',
    description: 'Examples of proper defensive zone positioning and coverage',
    clips: [MOCK_VIDEO_CLIPS[1], MOCK_VIDEO_CLIPS[2]],
    tags: ['defense', 'positioning', 'coverage'],
    shared: false,
    createdAt: new Date('2024-01-16T12:00:00Z'),
    createdBy: 'coach-johnson'
  },
  {
    id: 'collection-3',
    name: 'Game Situation Clips',
    description: 'Various game situations for tactical review',
    clips: [MOCK_VIDEO_CLIPS[0], MOCK_VIDEO_CLIPS[3]],
    tags: ['game-situations', 'tactics', 'review'],
    shared: true,
    createdAt: new Date('2024-01-17T09:00:00Z'),
    createdBy: 'head-coach'
  }
];

// Sample sync markers for video-play synchronization
export const MOCK_SYNC_MARKERS: SyncMarker[] = [
  {
    id: 'sync-1',
    videoTime: 43.0,
    playTime: 0.0,
    description: 'Power play setup begins',
    type: 'start',
    verified: true
  },
  {
    id: 'sync-2',
    videoTime: 48.5,
    playTime: 5.5,
    description: 'First pass executed',
    type: 'key_moment',
    verified: true
  },
  {
    id: 'sync-3',
    videoTime: 54.2,
    playTime: 11.2,
    description: 'Shot opportunity created',
    type: 'key_moment',
    verified: true
  },
  {
    id: 'sync-4',
    videoTime: 58.5,
    playTime: 15.5,
    description: 'Play sequence ends',
    type: 'end',
    verified: true
  }
];

// Sample video sync data
export const MOCK_VIDEO_SYNC: VideoSync[] = [
  {
    videoId: 'game-video-1',
    playId: 'power-play-1',
    videoTimestamp: 43.0,
    playTimestamp: 0.0,
    confidence: 0.95,
    syncType: 'manual',
    markers: MOCK_SYNC_MARKERS
  }
];

// Sample video library
export const MOCK_VIDEO_LIBRARY: VideoLibrary = {
  id: 'main-library',
  name: 'Team Video Library',
  description: 'Complete collection of game footage and practice videos',
  videos: MOCK_VIDEO_SOURCES,
  clips: MOCK_VIDEO_CLIPS,
  collections: MOCK_CLIP_COLLECTIONS,
  shared: false,
  tags: ['hockey', 'tactics', 'analysis', 'training'],
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-17T15:30:00Z')
};

// Sample video timeline
export const MOCK_VIDEO_TIMELINE: VideoTimeline = {
  videoId: 'game-video-1',
  duration: 596,
  markers: [
    {
      id: 'marker-1',
      time: 43.0,
      type: 'play_start',
      label: 'Power Play Begins',
      color: '#00FF00',
      playId: 'power-play-1'
    },
    {
      id: 'marker-2',
      time: 58.5,
      type: 'play_end',
      label: 'Power Play Ends',
      color: '#FF0000',
      playId: 'power-play-1'
    },
    {
      id: 'marker-3',
      time: 120.0,
      type: 'play_start',
      label: 'Neutral Zone Trap',
      color: '#0000FF',
      playId: 'nz-trap-1'
    },
    {
      id: 'marker-4',
      time: 140.0,
      type: 'play_end',
      label: 'Trap Sequence Ends',
      color: '#0000FF',
      playId: 'nz-trap-1'
    }
  ],
  annotations: MOCK_VIDEO_ANNOTATIONS.filter(a => a.videoId === 'game-video-1'),
  clips: MOCK_VIDEO_CLIPS.filter(c => c.videoId === 'game-video-1'),
  sync: MOCK_VIDEO_SYNC.filter(s => s.videoId === 'game-video-1')
};

// Helper functions for mock data
export const getMockVideoSource = (id: string): VideoSource | null => {
  return MOCK_VIDEO_SOURCES.find(video => video.id === id) || null;
};

export const getMockVideoClips = (videoId: string): VideoClip[] => {
  return MOCK_VIDEO_CLIPS.filter(clip => clip.videoId === videoId);
};

export const getMockVideoAnnotations = (videoId: string): VideoAnnotation[] => {
  return MOCK_VIDEO_ANNOTATIONS.filter(annotation => annotation.videoId === videoId);
};

export const getMockSyncMarkers = (videoId: string, playId: string): SyncMarker[] => {
  const sync = MOCK_VIDEO_SYNC.find(s => s.videoId === videoId && s.playId === playId);
  return sync?.markers || [];
};

export const createMockClip = (
  videoId: string, 
  startTime: number, 
  endTime: number, 
  name: string
): VideoClip => {
  return {
    id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    videoId,
    name,
    description: `Auto-generated clip: ${name}`,
    startTime,
    endTime,
    tags: ['auto-generated'],
    playIds: [],
    formations: [],
    thumbnailUrl: '/api/placeholder/160/90',
    createdAt: new Date(),
    createdBy: 'system',
    shared: false,
    annotations: MOCK_VIDEO_ANNOTATIONS.filter(a => 
      a.videoId === videoId && 
      a.timestamp >= startTime && 
      a.timestamp <= endTime
    )
  };
};

export const createMockAnnotation = (
  videoId: string,
  timestamp: number,
  type: VideoAnnotation['type'] = 'arrow',
  text?: string
): VideoAnnotation => {
  return {
    id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    videoId,
    timestamp,
    duration: 3,
    type,
    data: {
      position: { x: 200 + Math.random() * 400, y: 100 + Math.random() * 300 },
      color: '#FF0000',
      strokeWidth: 3,
      opacity: 0.8,
      points: type === 'arrow' ? [
        { x: 200, y: 200 },
        { x: 300, y: 180 }
      ] : undefined,
      text: text || (type === 'text' ? 'Annotation text' : undefined),
      fontSize: type === 'text' ? 16 : undefined,
      dimensions: type === 'circle' || type === 'rectangle' ? 
        { width: 60, height: 60 } : undefined
    },
    author: 'current-user',
    createdAt: new Date(),
    visible: true
  };
};

// Export all mock data as a single object for easy access
export const MOCK_VIDEO_DATA = {
  sources: MOCK_VIDEO_SOURCES,
  clips: MOCK_VIDEO_CLIPS,
  annotations: MOCK_VIDEO_ANNOTATIONS,
  collections: MOCK_CLIP_COLLECTIONS,
  sync: MOCK_VIDEO_SYNC,
  syncMarkers: MOCK_SYNC_MARKERS,
  library: MOCK_VIDEO_LIBRARY,
  timeline: MOCK_VIDEO_TIMELINE
};

export default MOCK_VIDEO_DATA;