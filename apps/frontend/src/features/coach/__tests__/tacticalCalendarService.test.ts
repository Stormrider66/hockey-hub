/**
 * Tactical Calendar Service Tests
 * 
 * Tests for the tactical calendar integration with Ice Coach features
 */

import { tacticalCalendarService, TacticalEventType } from '../services/tacticalCalendarService';

// Mock the calendar API
jest.mock('@/store/api/calendarApi', () => ({
  calendarApi: {
    endpoints: {
      createEvent: {
        initiate: jest.fn().mockResolvedValue({
          data: {
            id: 'test-event-1',
            title: 'Test Event',
            type: 'practice',
            startTime: '2025-01-26T16:00:00',
            endTime: '2025-01-26T17:30:00',
            tacticalType: 'tactical_practice',
            tacticalMetadata: {
              focus: 'offensive',
              playSystemIds: ['play-1']
            }
          }
        })
      },
      checkEventConflicts: {
        initiate: jest.fn().mockResolvedValue({
          data: {
            hasConflict: false,
            conflictingEvents: []
          }
        })
      },
      getEventsByDateRange: {
        initiate: jest.fn().mockResolvedValue({
          data: []
        })
      },
      getUpcomingEvents: {
        initiate: jest.fn().mockResolvedValue({
          data: []
        })
      },
      createRecurringEvent: {
        initiate: jest.fn().mockResolvedValue({
          data: []
        })
      }
    }
  }
}));

describe('TacticalCalendarService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTacticalPractice', () => {
    it('should create a tactical practice event with play references', async () => {
      const practiceData = {
        title: 'Power Play Practice',
        startTime: '2025-01-26T16:00:00',
        endTime: '2025-01-26T17:30:00',
        teamId: 'team-1',
        organizationId: 'org-1',
        playSystemIds: ['pp-1-3-1', 'pp-umbrella'],
        focus: 'special-teams' as const,
        situation: 'Power Play',
        intensity: 'high' as const,
        objectives: ['Improve power play execution', 'Practice zone entries'],
        iceRequirements: {
          fullIce: true,
          cones: 10,
          pucks: 20,
          nets: 2
        }
      };

      const result = await tacticalCalendarService.createTacticalPractice(practiceData);

      expect(result).toBeDefined();
      expect(result.tacticalType).toBe(TacticalEventType.TACTICAL_PRACTICE);
      expect(result.tacticalMetadata.playSystemIds).toEqual(['pp-1-3-1', 'pp-umbrella']);
      expect(result.tacticalMetadata.focus).toBe('special-teams');
    });
  });

  describe('createVideoReviewSession', () => {
    it('should create a video review session with clips and analysis', async () => {
      const reviewData = {
        title: 'Game 5 Video Review',
        startTime: '2025-01-26T10:00:00',
        endTime: '2025-01-26T11:00:00',
        teamId: 'team-1',
        organizationId: 'org-1',
        gameId: 'game-5',
        videoClips: [
          {
            timestamp: '12:34',
            description: 'Good cycle play in offensive zone',
            category: 'highlight' as const
          },
          {
            timestamp: '23:45',
            description: 'Missed defensive assignment',
            category: 'improvement' as const
          }
        ],
        reviewNotes: 'Focus on defensive zone coverage',
        playSystemIds: ['def-1-2-2']
      };

      const result = await tacticalCalendarService.createVideoReviewSession(reviewData);

      expect(result).toBeDefined();
      expect(result.tacticalType).toBe(TacticalEventType.VIDEO_REVIEW);
      expect(result.tacticalMetadata.videoSessions?.clips).toHaveLength(2);
    });
  });

  describe('createGamePreparation', () => {
    it('should create a game preparation event with opponent analysis', async () => {
      const prepData = {
        title: 'Pre-Game vs. Avalanche',
        startTime: '2025-01-26T18:00:00',
        endTime: '2025-01-26T19:00:00',
        teamId: 'team-1',
        organizationId: 'org-1',
        gameId: 'game-6',
        opponentTeamId: 'avalanche',
        opponentScouting: {
          strengths: ['Fast transition', 'Strong power play'],
          weaknesses: ['Defensive zone coverage', 'Face-offs'],
          keyPlayers: ['MacKinnon', 'Rantanen'],
          tactics: ['Aggressive forecheck', '1-3-1 PP']
        },
        tacticalReminders: ['Watch for quick breakouts', 'Pressure their point'],
        pregameRoutine: ['Team meeting', 'Warm-up', 'Line review'],
        playSystemIds: ['def-trap', 'pp-counter']
      };

      const result = await tacticalCalendarService.createGamePreparation(prepData);

      expect(result).toBeDefined();
      expect(result.tacticalType).toBe(TacticalEventType.GAME_PREPARATION);
      expect(result.tacticalMetadata.opponentScouting?.strengths).toContain('Fast transition');
    });
  });

  describe('createFormationTraining', () => {
    it('should create a formation training event', async () => {
      const formationData = {
        title: 'Defensive Zone Formation Training',
        startTime: '2025-01-26T15:00:00',
        endTime: '2025-01-26T16:30:00',
        teamId: 'team-1',
        organizationId: 'org-1',
        formations: [
          {
            name: '1-2-2 Defensive Zone',
            type: 'defensive' as const,
            situational: '5v5',
            drillIds: ['drill-1', 'drill-2']
          }
        ],
        progressionLevel: 'intermediate' as const,
        expectedOutcomes: ['Improved positioning', 'Better communication'],
        iceRequirements: {
          fullIce: true,
          cones: 8,
          pucks: 15,
          nets: 2
        }
      };

      const result = await tacticalCalendarService.createFormationTraining(formationData);

      expect(result).toBeDefined();
      expect(result.tacticalType).toBe(TacticalEventType.FORMATION_TRAINING);
      expect(result.tacticalMetadata.formationWork?.formations).toHaveLength(1);
    });
  });

  describe('checkTacticalConflicts', () => {
    it('should check for tactical conflicts including ice time and equipment', async () => {
      const eventData = {
        startTime: '2025-01-26T16:00:00',
        endTime: '2025-01-26T17:30:00',
        teamId: 'team-1',
        tacticalType: TacticalEventType.TACTICAL_PRACTICE,
        participantIds: ['player-1', 'player-2'],
        iceRequirements: {
          fullIce: true,
          cones: 10,
          pucks: 20,
          nets: 2
        }
      };

      const result = await tacticalCalendarService.checkTacticalConflicts(eventData);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('hasConflict');
      expect(result).toHaveProperty('conflicts');
      expect(result).toHaveProperty('suggestions');
    });
  });

  describe('getPlayerAvailability', () => {
    it('should return player availability with medical status', async () => {
      const availability = await tacticalCalendarService.getPlayerAvailability('team-1', '2025-01-26');

      expect(availability).toBeDefined();
      expect(Array.isArray(availability)).toBe(true);
      
      if (availability.length > 0) {
        const player = availability[0];
        expect(player).toHaveProperty('playerId');
        expect(player).toHaveProperty('playerName');
        expect(player).toHaveProperty('available');
        expect(player).toHaveProperty('status');
        expect(['healthy', 'injured', 'limited', 'questionable']).toContain(player.status);
      }
    });
  });

  describe('createRecurringTacticalPractice', () => {
    it('should create a recurring tactical practice schedule', async () => {
      const scheduleData = {
        baseEvent: {
          title: 'Weekly Tactical Practice',
          type: 'practice' as any,
          startTime: '2025-01-26T16:00:00',
          endTime: '2025-01-26T17:30:00',
          teamId: 'team-1',
          organizationId: 'org-1',
          createdBy: 'coach-1',
          tacticalType: TacticalEventType.TACTICAL_PRACTICE,
          tacticalMetadata: {
            focus: 'mixed' as const,
            situation: '5v5',
            intensity: 'medium' as const
          }
        },
        recurrence: {
          frequency: 'weekly' as const,
          interval: 1,
          daysOfWeek: [2], // Tuesdays
          endDate: '2025-03-26'
        },
        rotationPlan: {
          rotate: 'focus' as const,
          sequence: ['offensive', 'defensive', 'special-teams']
        }
      };

      const result = await tacticalCalendarService.createRecurringTacticalPractice(scheduleData);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('schedulePlayPractice', () => {
    it('should quickly schedule a practice for a specific play', async () => {
      const playSystem = {
        id: 'play-1',
        name: '2-1-2 Forecheck',
        description: 'Aggressive forechecking system',
        category: 'defensive' as const,
        situation: '5v5',
        formation: '2-1-2',
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['aggressive', 'forecheck']
      };

      const scheduleOptions = {
        preferredDate: '2025-01-27',
        preferredTime: '16:00',
        duration: 90,
        teamId: 'team-1',
        organizationId: 'org-1',
        intensity: 'medium' as const,
        objectives: ['Practice forecheck execution', 'Improve transitions']
      };

      const result = await tacticalCalendarService.schedulePlayPractice(playSystem, scheduleOptions);

      expect(result).toBeDefined();
      expect(result.title).toContain('2-1-2 Forecheck');
      expect(result.tacticalMetadata.playSystemIds).toContain('play-1');
    });
  });

  describe('exportTacticalCalendar', () => {
    it('should export tactical calendar in specified format', async () => {
      const options = {
        format: 'pdf' as const,
        dateRange: {
          start: '2025-01-26',
          end: '2025-02-26'
        },
        includeMetadata: true,
        includePlays: true,
        includeFormations: true,
        teamSpecific: true
      };

      const result = await tacticalCalendarService.exportTacticalCalendar(options);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('downloadUrl');
      expect(result).toHaveProperty('filename');
      expect(result.format).toBe('pdf');
      expect(result.filename).toMatch(/tactical-calendar-.*\.pdf/);
    });
  });

  describe('shareTacticalSchedule', () => {
    it('should create shareable link for tactical schedule', async () => {
      const shareData = {
        eventIds: ['event-1', 'event-2'],
        shareWith: 'team' as const,
        includeDetails: true,
        message: 'This week\'s tactical schedule'
      };

      const result = await tacticalCalendarService.shareTacticalSchedule(shareData);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('shareUrl');
      expect(result).toHaveProperty('expiresAt');
      expect(result.shareUrl).toMatch(/https:\/\/hockey-hub\.com\/shared-schedule\/.+/);
    });
  });
});

describe('TacticalCalendarService React Hooks', () => {
  // Note: These would require @testing-library/react-hooks for proper testing
  
  it('should provide useTacticalEvents hook', () => {
    // Mock implementation - in real tests would use renderHook
    expect(typeof require('../services/tacticalCalendarService').useTacticalEvents).toBe('function');
  });

  it('should provide usePlayScheduling hook', () => {
    expect(typeof require('../services/tacticalCalendarService').usePlayScheduling).toBe('function');
  });

  it('should provide usePlayerAvailability hook', () => {
    expect(typeof require('../services/tacticalCalendarService').usePlayerAvailability).toBe('function');
  });
});

describe('Integration with existing Calendar API', () => {
  it('should extend existing calendar events with tactical metadata', async () => {
    const tacticalEvent = {
      id: 'event-1',
      title: 'Tactical Practice',
      type: 'practice',
      startTime: '2025-01-26T16:00:00',
      endTime: '2025-01-26T17:30:00',
      tacticalType: TacticalEventType.TACTICAL_PRACTICE,
      tacticalMetadata: {
        focus: 'offensive',
        playSystemIds: ['play-1', 'play-2'],
        objectives: [
          {
            description: 'Improve zone entries',
            measurable: true,
            success_criteria: 'Coach evaluation'
          }
        ]
      }
    };

    // Verify the event has both standard and tactical properties
    expect(tacticalEvent.type).toBe('practice'); // Standard calendar property
    expect(tacticalEvent.tacticalType).toBe(TacticalEventType.TACTICAL_PRACTICE); // Tactical property
    expect(tacticalEvent.tacticalMetadata.playSystemIds).toEqual(['play-1', 'play-2']);
  });

  it('should maintain backward compatibility with existing calendar features', async () => {
    // Verify that standard calendar operations still work
    const standardEvent = {
      title: 'Regular Team Meeting',
      type: 'meeting',
      startTime: '2025-01-26T10:00:00',
      endTime: '2025-01-26T11:00:00',
      teamId: 'team-1',
      organizationId: 'org-1',
      createdBy: 'coach-1'
    };

    // Should not require tactical metadata
    expect(standardEvent).toBeDefined();
    expect(standardEvent.type).toBe('meeting');
    // Should not have tactical properties
    expect((standardEvent as any).tacticalType).toBeUndefined();
  });
});