/**
 * Tactical Calendar Service
 * 
 * Extends Hockey Hub's calendar system for Ice Coach tactical planning
 * Integrates tactical events, plays, formations, and team scheduling
 */

import React from 'react';
import { createApi } from '@reduxjs/toolkit/query/react';
import { calendarApi, type Event, type CreateEventDto } from '@/store/api/calendarApi';
import { EventType, EventVisibility, EventStatus } from '@/store/api/types/calendar.types';
import type { PlaySystem } from '../components/tactical/PlaySystemEditor';

// Extended event types for tactical planning
export enum TacticalEventType {
  TACTICAL_PRACTICE = 'tactical_practice',
  VIDEO_REVIEW = 'video_review',
  GAME_PREPARATION = 'game_preparation',
  FORMATION_TRAINING = 'formation_training',
  OPPONENT_ANALYSIS = 'opponent_analysis',
  PLAY_REVIEW = 'play_review',
  STRATEGY_MEETING = 'strategy_meeting'
}

// Tactical event metadata interfaces
export interface TacticalMetadata {
  // Play and formation references
  playSystemIds?: string[];
  formationIds?: string[];
  drillCategories?: string[];
  
  // Tactical focus areas
  focus?: 'offensive' | 'defensive' | 'special-teams' | 'transition' | 'mixed';
  situation?: string; // "5v5", "Power Play", "Penalty Kill", etc.
  intensity?: 'light' | 'medium' | 'high' | 'game-tempo';
  
  // Opponent analysis
  opponentTeamId?: string;
  opponentScouting?: {
    strengths: string[];
    weaknesses: string[];
    keyPlayers: string[];
    tactics: string[];
  };
  
  // Video review specific
  videoSessions?: {
    gameId?: string;
    clips: Array<{
      timestamp: string;
      description: string;
      category: 'highlight' | 'improvement' | 'mistake' | 'strategy';
    }>;
    reviewNotes?: string;
  };
  
  // Game preparation specific
  gamePrep?: {
    gameId: string;
    pregameRoutine: string[];
    tacticalReminders: string[];
    lineupChanges?: Array<{
      line: number;
      position: string;
      playerId: string;
      reason: string;
    }>;
  };
  
  // Formation training specific
  formationWork?: {
    formations: Array<{
      name: string;
      type: 'offensive' | 'defensive' | 'neutral';
      situational: string;
      drillIds: string[];
    }>;
    progressionLevel: 'beginner' | 'intermediate' | 'advanced';
    expectedOutcomes: string[];
  };

  // Equipment and ice requirements
  iceRequirements?: {
    fullIce: boolean;
    halfIce?: boolean;
    specificZones?: string[];
    cones: number;
    pucks: number;
    nets: number;
    boards?: boolean;
  };

  // Success metrics
  objectives?: Array<{
    description: string;
    measurable: boolean;
    success_criteria: string;
  }>;
  
  // Follow-up actions
  followUp?: Array<{
    action: string;
    responsible: string;
    dueDate: string;
  }>;
}

// Extended event interface for tactical events
export interface TacticalEvent extends Event {
  tacticalType: TacticalEventType;
  tacticalMetadata: TacticalMetadata;
}

// DTO for creating tactical events
export interface CreateTacticalEventDto extends CreateEventDto {
  tacticalType: TacticalEventType;
  tacticalMetadata: TacticalMetadata;
}

// Calendar conflict types specific to tactical planning
export interface TacticalConflict {
  type: 'ice_time' | 'player_availability' | 'coach_overlap' | 'equipment' | 'tactical_focus';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestions?: string[];
  conflictingEvents: string[];
}

// Player availability with medical/injury status
export interface PlayerAvailability {
  playerId: string;
  playerName: string;
  available: boolean;
  status: 'healthy' | 'injured' | 'limited' | 'questionable';
  restrictions?: string[];
  medicalNotes?: string;
  lastUpdate: string;
}

// Tactical calendar filters
export interface TacticalCalendarFilters {
  startDate: string;
  endDate: string;
  teamId?: string;
  tacticalTypes?: TacticalEventType[];
  focus?: string[];
  situations?: string[];
  intensity?: string[];
  includeOpponentAnalysis?: boolean;
}

// Export formats for tactical calendar
export interface TacticalExportOptions {
  format: 'pdf' | 'ics' | 'excel' | 'json';
  dateRange: { start: string; end: string };
  includeMetadata: boolean;
  includePlays: boolean;
  includeFormations: boolean;
  teamSpecific: boolean;
  language?: string;
}

/**
 * Tactical Calendar Service
 * Extends the base calendar API with tactical-specific functionality
 */
export const tacticalCalendarService = {
  
  /**
   * Create a tactical practice event with play references
   */
  createTacticalPractice: async (practiceData: {
    title: string;
    startTime: string;
    endTime: string;
    teamId: string;
    organizationId: string;
    playSystemIds?: string[];
    focus: 'offensive' | 'defensive' | 'special-teams' | 'mixed';
    situation: string;
    intensity: 'light' | 'medium' | 'high' | 'game-tempo';
    objectives: string[];
    iceRequirements?: TacticalMetadata['iceRequirements'];
  }): Promise<TacticalEvent> => {
    
    const eventData: CreateTacticalEventDto = {
      title: practiceData.title,
      type: EventType.PRACTICE,
      startTime: practiceData.startTime,
      endTime: practiceData.endTime,
      teamId: practiceData.teamId,
      organizationId: practiceData.organizationId,
      createdBy: 'current-user-id', // TODO: Get from auth context
      visibility: EventVisibility.TEAM,
      tacticalType: TacticalEventType.TACTICAL_PRACTICE,
      tacticalMetadata: {
        playSystemIds: practiceData.playSystemIds,
        focus: practiceData.focus,
        situation: practiceData.situation,
        intensity: practiceData.intensity,
        objectives: practiceData.objectives.map(obj => ({
          description: obj,
          measurable: true,
          success_criteria: 'Coach evaluation'
        })),
        iceRequirements: practiceData.iceRequirements
      }
    };

    // Use the base calendar API to create the event
    const result = await calendarApi.endpoints.createEvent.initiate(eventData);
    return result.data as TacticalEvent;
  },

  /**
   * Schedule video review session with play analysis
   */
  createVideoReviewSession: async (reviewData: {
    title: string;
    startTime: string;
    endTime: string;
    teamId: string;
    organizationId: string;
    gameId?: string;
    videoClips: Array<{
      timestamp: string;
      description: string;
      category: 'highlight' | 'improvement' | 'mistake' | 'strategy';
    }>;
    reviewNotes?: string;
    playSystemIds?: string[];
  }): Promise<TacticalEvent> => {
    
    const eventData: CreateTacticalEventDto = {
      title: reviewData.title,
      type: EventType.MEETING,
      startTime: reviewData.startTime,
      endTime: reviewData.endTime,
      teamId: reviewData.teamId,
      organizationId: reviewData.organizationId,
      createdBy: 'current-user-id',
      visibility: EventVisibility.TEAM,
      tacticalType: TacticalEventType.VIDEO_REVIEW,
      tacticalMetadata: {
        playSystemIds: reviewData.playSystemIds,
        videoSessions: {
          gameId: reviewData.gameId,
          clips: reviewData.videoClips,
          reviewNotes: reviewData.reviewNotes
        }
      }
    };

    const result = await calendarApi.endpoints.createEvent.initiate(eventData);
    return result.data as TacticalEvent;
  },

  /**
   * Create game preparation event with opponent analysis
   */
  createGamePreparation: async (prepData: {
    title: string;
    startTime: string;
    endTime: string;
    teamId: string;
    organizationId: string;
    gameId: string;
    opponentTeamId: string;
    opponentScouting: TacticalMetadata['opponentScouting'];
    tacticalReminders: string[];
    pregameRoutine: string[];
    playSystemIds?: string[];
    lineupChanges?: TacticalMetadata['gamePrep']['lineupChanges'];
  }): Promise<TacticalEvent> => {
    
    const eventData: CreateTacticalEventDto = {
      title: prepData.title,
      type: EventType.MEETING,
      startTime: prepData.startTime,
      endTime: prepData.endTime,
      teamId: prepData.teamId,
      organizationId: prepData.organizationId,
      createdBy: 'current-user-id',
      visibility: EventVisibility.TEAM,
      tacticalType: TacticalEventType.GAME_PREPARATION,
      tacticalMetadata: {
        playSystemIds: prepData.playSystemIds,
        opponentTeamId: prepData.opponentTeamId,
        opponentScouting: prepData.opponentScouting,
        gamePrep: {
          gameId: prepData.gameId,
          pregameRoutine: prepData.pregameRoutine,
          tacticalReminders: prepData.tacticalReminders,
          lineupChanges: prepData.lineupChanges
        }
      }
    };

    const result = await calendarApi.endpoints.createEvent.initiate(eventData);
    return result.data as TacticalEvent;
  },

  /**
   * Create formation training event
   */
  createFormationTraining: async (formationData: {
    title: string;
    startTime: string;
    endTime: string;
    teamId: string;
    organizationId: string;
    formations: TacticalMetadata['formationWork']['formations'];
    progressionLevel: 'beginner' | 'intermediate' | 'advanced';
    expectedOutcomes: string[];
    iceRequirements?: TacticalMetadata['iceRequirements'];
  }): Promise<TacticalEvent> => {
    
    const eventData: CreateTacticalEventDto = {
      title: formationData.title,
      type: EventType.PRACTICE,
      startTime: formationData.startTime,
      endTime: formationData.endTime,
      teamId: formationData.teamId,
      organizationId: formationData.organizationId,
      createdBy: 'current-user-id',
      visibility: EventVisibility.TEAM,
      tacticalType: TacticalEventType.FORMATION_TRAINING,
      tacticalMetadata: {
        formationWork: {
          formations: formationData.formations,
          progressionLevel: formationData.progressionLevel,
          expectedOutcomes: formationData.expectedOutcomes
        },
        iceRequirements: formationData.iceRequirements
      }
    };

    const result = await calendarApi.endpoints.createEvent.initiate(eventData);
    return result.data as TacticalEvent;
  },

  /**
   * Check conflicts with enhanced tactical validation
   */
  checkTacticalConflicts: async (eventData: {
    startTime: string;
    endTime: string;
    teamId: string;
    tacticalType: TacticalEventType;
    participantIds: string[];
    iceRequirements?: TacticalMetadata['iceRequirements'];
    excludeEventId?: string;
  }): Promise<{
    hasConflict: boolean;
    conflicts: TacticalConflict[];
    suggestions: string[];
  }> => {
    
    // Check basic calendar conflicts
    const basicConflicts = await calendarApi.endpoints.checkEventConflicts.initiate({
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      participantIds: eventData.participantIds,
      excludeEventId: eventData.excludeEventId
    });

    // Enhanced tactical conflict detection
    const tacticalConflicts: TacticalConflict[] = [];

    // Check ice time conflicts
    // TODO: Integrate with ice booking system
    
    // Check coach availability
    // TODO: Check if coach has overlapping tactical events

    // Check equipment availability
    if (eventData.iceRequirements) {
      // TODO: Check equipment booking system
    }

    // Check tactical focus conflicts (avoid too many high-intensity sessions)
    // TODO: Analyze recent events for load management

    return {
      hasConflict: basicConflicts.data?.hasConflict || tacticalConflicts.length > 0,
      conflicts: tacticalConflicts,
      suggestions: []
    };
  },

  /**
   * Get player availability with medical status
   */
  getPlayerAvailability: async (teamId: string, eventDate: string): Promise<PlayerAvailability[]> => {
    // TODO: Integrate with Medical Service API
    // For now, return mock data
    return [
      {
        playerId: '1',
        playerName: 'Sidney Crosby',
        available: false,
        status: 'injured',
        restrictions: ['No contact', 'Upper body'],
        medicalNotes: 'Concussion protocol - day-to-day',
        lastUpdate: new Date().toISOString()
      },
      {
        playerId: '2',
        playerName: 'Nathan MacKinnon',
        available: true,
        status: 'limited',
        restrictions: ['Light contact only'],
        medicalNotes: 'Lower body maintenance',
        lastUpdate: new Date().toISOString()
      }
    ];
  },

  /**
   * Get tactical events for a date range
   */
  getTacticalEvents: async (filters: TacticalCalendarFilters): Promise<TacticalEvent[]> => {
    const events = await calendarApi.endpoints.getEventsByDateRange.initiate({
      startDate: filters.startDate,
      endDate: filters.endDate,
      teamId: filters.teamId,
      organizationId: filters.teamId // Assuming team has org context
    });

    // Filter for tactical events only
    return (events.data || [])
      .filter((event): event is TacticalEvent => 
        event.metadata && 'tacticalType' in event.metadata
      );
  },

  /**
   * Create recurring tactical practice schedule
   */
  createRecurringTacticalPractice: async (scheduleData: {
    baseEvent: Omit<CreateTacticalEventDto, 'recurrence'>;
    recurrence: {
      frequency: 'daily' | 'weekly' | 'monthly';
      interval: number;
      daysOfWeek?: number[];
      endDate?: string;
      count?: number;
    };
    rotationPlan?: {
      rotate: 'focus' | 'plays' | 'intensity';
      sequence: string[];
    };
  }): Promise<TacticalEvent[]> => {
    
    const eventWithRecurrence = {
      ...scheduleData.baseEvent,
      recurrence: scheduleData.recurrence
    };

    const result = await calendarApi.endpoints.createRecurringEvent.initiate(eventWithRecurrence);
    
    // If there's a rotation plan, update each event in the series
    if (scheduleData.rotationPlan && result.data) {
      // TODO: Update individual events based on rotation plan
    }

    return (result.data || []) as TacticalEvent[];
  },

  /**
   * Export tactical calendar
   */
  exportTacticalCalendar: async (options: TacticalExportOptions): Promise<{
    downloadUrl: string;
    filename: string;
    format: string;
  }> => {
    // TODO: Implement tactical calendar export
    // This would generate PDFs with play diagrams, formation layouts, etc.
    
    const filename = `tactical-calendar-${options.dateRange.start}-to-${options.dateRange.end}.${options.format}`;
    
    return {
      downloadUrl: `/api/tactical-calendar/export/${filename}`,
      filename,
      format: options.format
    };
  },

  /**
   * Share tactical schedule with team
   */
  shareTacticalSchedule: async (shareData: {
    eventIds: string[];
    shareWith: 'team' | 'parents' | 'staff' | 'organization';
    includeDetails: boolean;
    message?: string;
  }): Promise<{
    shareUrl: string;
    accessCode?: string;
    expiresAt: string;
  }> => {
    // TODO: Implement tactical schedule sharing
    // This would create shareable links with appropriate permissions
    
    return {
      shareUrl: `https://hockey-hub.com/shared-schedule/${Date.now()}`,
      accessCode: shareData.shareWith === 'parents' ? Math.random().toString(36).substr(2, 8) : undefined,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };
  },

  /**
   * Get upcoming events for a specific play system
   */
  getUpcomingEventsForPlay: async (playSystemId: string, teamId: string): Promise<TacticalEvent[]> => {
    const upcomingEvents = await calendarApi.endpoints.getUpcomingEvents.initiate({
      teamId,
      days: 30
    });

    return (upcomingEvents.data || [])
      .filter((event): event is TacticalEvent => 
        event.metadata && 
        'tacticalMetadata' in event.metadata &&
        event.metadata.tacticalMetadata?.playSystemIds?.includes(playSystemId)
      );
  },

  /**
   * Quick schedule a practice for a specific play
   */
  schedulePlayPractice: async (playSystem: PlaySystem, scheduleOptions: {
    preferredDate: string;
    preferredTime: string;
    duration: number; // minutes
    teamId: string;
    organizationId: string;
    intensity?: 'light' | 'medium' | 'high';
    objectives?: string[];
  }): Promise<TacticalEvent> => {
    
    const practiceTitle = `${playSystem.category.charAt(0).toUpperCase() + playSystem.category.slice(1)} Practice: ${playSystem.name}`;
    
    const startTime = new Date(`${scheduleOptions.preferredDate}T${scheduleOptions.preferredTime}`);
    const endTime = new Date(startTime.getTime() + scheduleOptions.duration * 60 * 1000);

    return await tacticalCalendarService.createTacticalPractice({
      title: practiceTitle,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      teamId: scheduleOptions.teamId,
      organizationId: scheduleOptions.organizationId,
      playSystemIds: [playSystem.id],
      focus: playSystem.category === 'offensive' ? 'offensive' : 
            playSystem.category === 'defensive' ? 'defensive' :
            playSystem.category === 'special-teams' ? 'special-teams' : 'mixed',
      situation: playSystem.situation || '5v5',
      intensity: scheduleOptions.intensity || 'medium',
      objectives: scheduleOptions.objectives || [`Practice ${playSystem.name} execution`, 'Improve player positioning', 'Increase play success rate']
    });
  },

  /**
   * Get calendar integration data for real-time updates
   */
  getCalendarSocketData: () => ({
    namespace: '/calendar-tactical',
    events: {
      tacticalEventCreated: 'tactical:event:created',
      tacticalEventUpdated: 'tactical:event:updated', 
      tacticalEventDeleted: 'tactical:event:deleted',
      playScheduled: 'tactical:play:scheduled',
      conflictDetected: 'tactical:conflict:detected'
    },
    rooms: {
      teamTactical: (teamId: string) => `tactical-${teamId}`,
      coachEvents: (coachId: string) => `coach-events-${coachId}`
    }
  })
};

/**
 * React hooks for tactical calendar functionality
 */

// Hook for managing tactical events
export function useTacticalEvents(teamId: string, dateRange: { start: string; end: string }) {
  const [events, setEvents] = React.useState<TacticalEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchEvents = React.useCallback(async () => {
    try {
      setLoading(true);
      const tacticalEvents = await tacticalCalendarService.getTacticalEvents({
        startDate: dateRange.start,
        endDate: dateRange.end,
        teamId
      });
      setEvents(tacticalEvents);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tactical events');
    } finally {
      setLoading(false);
    }
  }, [teamId, dateRange.start, dateRange.end]);

  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refetch: fetchEvents
  };
}

// Hook for scheduling plays
export function usePlayScheduling() {
  const [scheduling, setScheduling] = React.useState(false);
  
  const schedulePlay = React.useCallback(async (
    playSystem: PlaySystem, 
    options: Parameters<typeof tacticalCalendarService.schedulePlayPractice>[1]
  ) => {
    setScheduling(true);
    try {
      const event = await tacticalCalendarService.schedulePlayPractice(playSystem, options);
      return event;
    } finally {
      setScheduling(false);
    }
  }, []);

  return {
    schedulePlay,
    scheduling
  };
}

// Hook for player availability
export function usePlayerAvailability(teamId: string) {
  const [availability, setAvailability] = React.useState<PlayerAvailability[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    tacticalCalendarService.getPlayerAvailability(teamId, new Date().toISOString())
      .then(setAvailability)
      .finally(() => setLoading(false));
  }, [teamId]);

  return { availability, loading };
}

// Re-export for convenience
export { type TacticalEvent, type TacticalMetadata };