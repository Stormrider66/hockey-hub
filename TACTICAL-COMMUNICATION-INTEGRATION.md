# Tactical Communication System Integration

## Overview

This document outlines the integration of tactical communication features into the Hockey Hub chat system, enabling coaches to share plays, formations, video analysis, and game plans directly with their teams through enhanced chat messages.

## Architecture

### Core Components

1. **TacticalCommunicationService** (`/apps/frontend/src/features/coach/services/tacticalCommunicationService.ts`)
   - Central service for all tactical sharing operations
   - Integrates with existing chat API and WebSocket infrastructure
   - Handles message formatting, metadata management, and real-time notifications

2. **TacticalShareModal** (`/apps/frontend/src/features/coach/components/tactical/TacticalShareModal.tsx`)
   - Rich modal interface for configuring tactical shares
   - Team member selection, priority settings, share options
   - Preview functionality and share history tracking

3. **TacticalMessageCard** (`/apps/frontend/src/features/chat/components/TacticalMessageCard.tsx`)
   - Specialized message component for tactical content
   - Rich interactive displays for plays, formations, videos, and game plans
   - Acknowledgment and discussion functionality

4. **Tactical Viewers**
   - `TacticalPlayViewer.tsx`: Interactive play diagram viewer with animations
   - `TacticalVideoViewer.tsx`: Video player with tactical overlays and timestamps

### Integration Points

- **PlaySystemEditor**: Enhanced with "Share with Team" button
- **MessageItem**: Detects and renders tactical message types
- **Chat API**: Extended with tactical message metadata support
- **WebSocket Events**: Real-time tactical event broadcasting

## Message Types

### 1. Play Share (`TACTICAL_PLAY_SHARE`)
```typescript
interface TacticalPlayData {
  id: string;
  name: string;
  description: string;
  category: 'offensive' | 'defensive' | 'special-teams' | 'faceoff' | 'transition';
  situation: string;
  formation: string;
  data: any; // Tactical board data
  previewImage?: string;
  tags: string[];
}
```

**Features:**
- Rich embed with play diagram
- Interactive play viewer with step-by-step animation
- Coach notes and instructions
- Player understanding confirmations

### 2. Formation Update (`FORMATION_UPDATE`)
```typescript
interface FormationUpdateData {
  formationName: string;
  positions: Array<{
    playerId: string;
    position: string;
    x: number;
    y: number;
    role: string;
    instructions?: string;
  }>;
  situationType: '5v5' | 'powerplay' | 'penalty_kill' | 'faceoff';
  effectiveFrom: Date;
  notes?: string;
}
```

**Features:**
- Visual formation with player assignments
- Position-specific instructions
- Effective date/time
- Mandatory acknowledgment system

### 3. Video Analysis (`VIDEO_ANALYSIS`)
```typescript
interface VideoAnalysisData {
  videoUrl: string;
  title: string;
  timestamps: Array<{
    time: number;
    title: string;
    description: string;
    playType?: string;
  }>;
  tacticalOverlays?: Array<{
    timestamp: number;
    overlayData: any;
    annotations: string[];
  }>;
  analysisNotes: string;
  relatedPlays?: string[];
}
```

**Features:**
- Video player with tactical overlay timestamps
- Interactive timeline with key moments
- Tactical annotations and analysis notes
- Links to related play systems

### 4. Game Plan (`GAME_PLAN`)
```typescript
interface GamePlanData {
  opponent: string;
  gameDate: Date;
  keyStrategies: string[];
  lineupChanges?: Array<{
    line: string;
    players: string[];
    reason: string;
  }>;
  specialInstructions: string[];
  focusAreas: string[];
  pregameRoutine: string[];
}
```

**Features:**
- Comprehensive pre-game tactical briefing
- Lineup changes with explanations
- Key strategies and focus areas
- Pre-game routine checklist

## Real-time Features

### WebSocket Events

1. **tactical:play_shared**
   - Broadcast when play is shared
   - Triggers real-time notifications
   - Updates recipient UI immediately

2. **tactical:formation_updated**
   - Position-specific notifications
   - Lineup change alerts
   - Effective time reminders

3. **tactical:video_shared**
   - Video analysis notifications
   - Discussion thread creation
   - Timestamp highlighting

4. **tactical:game_plan_broadcast**
   - Team-wide game plan distribution
   - Acknowledgment tracking
   - Pre-game reminders

### Live Collaboration

- **Live Play Editing**: Multiple coaches can collaborate on play design
- **Real-time Annotations**: Add tactical notes during video review
- **Shared Tactical Board**: Live drawing and annotation sharing
- **Player Feedback**: Real-time questions and confirmations

## Chat UI Integration

### Message Rendering

The `MessageItem` component now detects tactical messages using metadata inspection:

```typescript
const isTacticalMessage = () => {
  return message.metadata && 
         typeof message.metadata === 'object' && 
         'tacticalType' in message.metadata &&
         ['play_share', 'formation_update', 'video_analysis', 'play_discussion', 'game_plan'].includes(
           (message.metadata as TacticalMessageMetadata).tacticalType
         );
};
```

### Interactive Elements

- **Rich Cards**: Enhanced message cards with tactical-specific layouts
- **Quick Actions**: Understand, Acknowledge, Discuss buttons
- **Inline Viewers**: Modal dialrams and video players
- **Progress Tracking**: Visual acknowledgment and understanding indicators

## Sharing Options

### Recipient Selection

1. **Entire Team**: All active players
2. **Position Groups**: Centers, Defense, Forwards, Goalies, Coaching Staff
3. **Individual Players**: Custom player selection
4. **Coaching Staff**: Coach-to-coach communication

### Share Configuration

- **Priority Levels**: Normal, Important, Urgent
- **Acknowledgment Requirements**: Optional or mandatory
- **Schedule Options**: Immediate or scheduled delivery
- **Include Options**: Preview images, instructions, related content

### Permission Controls

- **Role-based Access**: Only coaches can share tactical content
- **Team Restrictions**: Players can only view content for their teams
- **History Tracking**: Complete audit trail of tactical shares

## Analytics and Tracking

### Share History

- **Complete Log**: All tactical shares with metadata
- **Engagement Metrics**: View counts, acknowledgments, discussions
- **Performance Tracking**: Understanding rates and response times
- **Usage Analytics**: Most shared plays, effective communication patterns

### Reporting

- **Coach Reports**: Tactical communication effectiveness
- **Team Engagement**: Player interaction with tactical content
- **Content Analytics**: Most effective plays and strategies
- **Timeline Analysis**: Communication patterns relative to games

## Implementation Status

### ✅ Completed Components

1. **TacticalCommunicationService**: Full service implementation
2. **TacticalShareModal**: Complete sharing interface
3. **TacticalMessageCard**: Rich message rendering
4. **TacticalPlayViewer**: Interactive play visualization
5. **TacticalVideoViewer**: Video analysis with overlays
6. **PlaySystemEditor Integration**: Share button functionality
7. **MessageItem Integration**: Tactical message detection and rendering

### 🔄 Integration Requirements

1. **Backend WebSocket Handlers**: Extend communication service
2. **Database Schema**: Add tactical metadata to messages table
3. **Permission System**: Implement coach-only sharing restrictions
4. **Notification System**: Tactical-aware push notifications

### 🎯 Future Enhancements

1. **Mobile App Integration**: Extend to mobile chat interface
2. **Offline Capability**: Cache tactical content for offline viewing
3. **AI Suggestions**: Intelligent play recommendation system
4. **Advanced Analytics**: Machine learning insights on tactical effectiveness
5. **Integration APIs**: Connect with external video analysis tools

## Usage Examples

### Sharing a Power Play Setup

```typescript
// Coach shares a power play formation
await tacticalCommunicationService.sharePlay(
  teamConversationId,
  {
    id: 'pp-umbrella-1',
    name: 'Umbrella Power Play Setup',
    category: 'special-teams',
    situation: 'Power Play',
    formation: 'Umbrella',
    description: 'High-slot umbrella with cycling options',
    tags: ['powerplay', 'umbrella', 'cycling']
  },
  {
    shareWith: 'team',
    targetIds: ['all-players'],
    priority: 'important',
    includePreview: true,
    includeInstructions: true,
    requiresAcknowledgment: true
  }
);
```

### Video Analysis with Timestamps

```typescript
// Share game footage with tactical breakdown
await tacticalCommunicationService.shareVideoAnalysis(
  teamConversationId,
  {
    videoUrl: 'https://video-url.com/game-footage.mp4',
    title: 'Defensive Zone Coverage Analysis',
    timestamps: [
      { time: 45, title: 'Weak side collapse', description: 'Notice how D2 supports low' },
      { time: 82, title: 'Transition opportunity', description: 'Quick outlet pass option' }
    ],
    analysisNotes: 'Focus on communication and early reads',
    relatedPlays: ['defensive-system-1', 'breakout-play-3']
  },
  {
    shareWith: 'team',
    targetIds: ['all-players'],
    priority: 'normal',
    shareType: 'video_analysis'
  }
);
```

## Security Considerations

- **Role Validation**: Server-side coach role verification
- **Team Isolation**: Tactical content restricted to team members
- **Content Sanitization**: Prevent malicious tactical data injection
- **Audit Logging**: Complete tactical communication audit trail
- **Rate Limiting**: Prevent tactical communication spam

## Performance Optimization

- **Lazy Loading**: Tactical viewers loaded on demand
- **Image Optimization**: Play diagrams cached and compressed
- **Video Streaming**: Progressive loading for tactical videos
- **Real-time Throttling**: WebSocket event batching for performance
- **Mobile Responsive**: Optimized tactical viewers for mobile devices

---

This tactical communication system transforms the basic chat functionality into a comprehensive coaching tool, enabling rich tactical collaboration while maintaining the simplicity and real-time nature of team communication.