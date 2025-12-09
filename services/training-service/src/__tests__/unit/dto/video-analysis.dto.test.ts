import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  CreateVideoAnalysisDto,
  UpdateVideoAnalysisDto,
  VideoAnalysisFilterDto,
  AddVideoClipDto,
  UpdateVideoClipDto,
  ShareVideoAnalysisDto,
  BulkShareDto,
  VideoClipDto,
  AnalysisPointDto,
  PlayerPerformanceDto,
  TeamAnalysisDto
} from '../../../dto/coach/video-analysis.dto';

describe('Video Analysis DTOs', () => {
  describe('VideoClipDto', () => {
    const validClip = {
      startTime: 120.5,
      endTime: 145.2,
      title: 'Great defensive play',
      category: 'positive',
      players: ['player-123', 'player-456'],
      description: 'Excellent stick positioning and gap control',
      coachingPoints: ['Watch the stick position', 'Notice the gap control'],
      drawingData: { lines: [], circles: [] }
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(VideoClipDto, validClip);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with negative start time', async () => {
      const dto = plainToClass(VideoClipDto, {
        ...validClip,
        startTime: -5
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('startTime');
    });

    it('should fail validation with negative end time', async () => {
      const dto = plainToClass(VideoClipDto, {
        ...validClip,
        endTime: -10
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('endTime');
    });

    it('should fail validation with invalid category', async () => {
      const dto = plainToClass(VideoClipDto, {
        ...validClip,
        category: 'invalid_category'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('category');
    });

    it('should fail validation with title exceeding max length', async () => {
      const dto = plainToClass(VideoClipDto, {
        ...validClip,
        title: 'A'.repeat(256)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('title');
    });

    it('should fail validation with player ID exceeding max length', async () => {
      const dto = plainToClass(VideoClipDto, {
        ...validClip,
        players: ['A'.repeat(51)]
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should pass validation without optional drawingData', async () => {
      const { drawingData, ...clipWithoutDrawing } = validClip;
      const dto = plainToClass(VideoClipDto, clipWithoutDrawing);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate all category types', async () => {
      const categories = ['positive', 'negative', 'neutral', 'teaching'];
      
      for (const category of categories) {
        const dto = plainToClass(VideoClipDto, {
          ...validClip,
          category
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe('AnalysisPointDto', () => {
    const validPoint = {
      timestamp: 65.3,
      description: 'Player makes excellent read of the play',
      category: 'Decision Making',
      importance: 'high'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(AnalysisPointDto, validPoint);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with negative timestamp', async () => {
      const dto = plainToClass(AnalysisPointDto, {
        ...validPoint,
        timestamp: -1
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('timestamp');
    });

    it('should fail validation with description exceeding max length', async () => {
      const dto = plainToClass(AnalysisPointDto, {
        ...validPoint,
        description: 'A'.repeat(501)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
    });

    it('should fail validation with invalid importance level', async () => {
      const dto = plainToClass(AnalysisPointDto, {
        ...validPoint,
        importance: 'invalid_level'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('importance');
    });

    it('should validate all importance levels', async () => {
      const levels = ['high', 'medium', 'low'];
      
      for (const importance of levels) {
        const dto = plainToClass(AnalysisPointDto, {
          ...validPoint,
          importance
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe('CreateVideoAnalysisDto', () => {
    const validCreateData = {
      coachId: '550e8400-e29b-41d4-a716-446655440000',
      playerId: '550e8400-e29b-41d4-a716-446655440001',
      teamId: '550e8400-e29b-41d4-a716-446655440002',
      gameId: '550e8400-e29b-41d4-a716-446655440003',
      videoUrl: 'https://example.com/game-footage.mp4',
      title: 'Game 5 Performance Analysis',
      type: 'game',
      clips: [{
        startTime: 30,
        endTime: 45,
        title: 'Power play goal',
        category: 'positive',
        players: ['player-1'],
        description: 'Great shot',
        coachingPoints: ['Quick release']
      }],
      playerPerformance: {
        positives: [{
          timestamp: 30,
          description: 'Excellent shot placement',
          category: 'Shooting',
          importance: 'high'
        }],
        improvements: [{
          timestamp: 120,
          description: 'Better defensive positioning needed',
          category: 'Defense',
          importance: 'medium'
        }],
        keyMoments: [{
          timestamp: 180,
          description: 'Game-winning assist',
          category: 'Playmaking',
          importance: 'high'
        }]
      },
      summary: 'Overall strong performance with areas for improvement',
      tags: ['game', 'offense', 'shooting'],
      sharedWithPlayer: true,
      sharedWithTeam: false
    };

    it('should pass validation with complete valid data', async () => {
      const dto = plainToClass(CreateVideoAnalysisDto, validCreateData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with minimal required data', async () => {
      const minimalData = {
        coachId: '550e8400-e29b-41d4-a716-446655440000',
        playerId: '550e8400-e29b-41d4-a716-446655440001',
        videoUrl: 'https://example.com/video.mp4',
        title: 'Analysis',
        type: 'practice',
        clips: [{
          startTime: 0,
          endTime: 10,
          title: 'Clip 1',
          category: 'neutral',
          players: ['player-1'],
          description: 'Basic clip',
          coachingPoints: ['Point 1']
        }]
      };
      const dto = plainToClass(CreateVideoAnalysisDto, minimalData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid video URL', async () => {
      const dto = plainToClass(CreateVideoAnalysisDto, {
        ...validCreateData,
        videoUrl: 'not-a-valid-url'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('videoUrl');
    });

    it('should fail validation with invalid analysis type', async () => {
      const dto = plainToClass(CreateVideoAnalysisDto, {
        ...validCreateData,
        type: 'invalid_type'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('type');
    });

    it('should fail validation with summary exceeding max length', async () => {
      const dto = plainToClass(CreateVideoAnalysisDto, {
        ...validCreateData,
        summary: 'A'.repeat(2001)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('summary');
    });

    it('should fail validation with tag exceeding max length', async () => {
      const dto = plainToClass(CreateVideoAnalysisDto, {
        ...validCreateData,
        tags: ['A'.repeat(51)]
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should validate nested clips correctly', async () => {
      const invalidClipData = {
        ...validCreateData,
        clips: [{
          startTime: -5, // invalid
          endTime: 45,
          title: 'Test clip',
          category: 'positive',
          players: ['player-1'],
          description: 'Description',
          coachingPoints: ['Point']
        }]
      };
      const dto = plainToClass(CreateVideoAnalysisDto, invalidClipData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate all analysis types', async () => {
      const types = ['game', 'practice', 'skills', 'tactical'];
      
      for (const type of types) {
        const dto = plainToClass(CreateVideoAnalysisDto, {
          ...validCreateData,
          type
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe('VideoAnalysisFilterDto', () => {
    const validFilter = {
      playerId: '550e8400-e29b-41d4-a716-446655440000',
      teamId: '550e8400-e29b-41d4-a716-446655440001',
      type: 'game',
      tag: 'offense',
      sharedWithPlayer: true,
      sharedWithTeam: false,
      skip: 0,
      take: 20
    };

    it('should pass validation with valid filter data', async () => {
      const dto = plainToClass(VideoAnalysisFilterDto, validFilter);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty filter', async () => {
      const dto = plainToClass(VideoAnalysisFilterDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid take value', async () => {
      const dto = plainToClass(VideoAnalysisFilterDto, {
        take: 101 // above maximum
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('take');
    });

    it('should fail validation with negative skip', async () => {
      const dto = plainToClass(VideoAnalysisFilterDto, {
        skip: -1
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('skip');
    });
  });

  describe('ShareVideoAnalysisDto', () => {
    const validShare = {
      sharedWithPlayer: true,
      sharedWithTeam: false,
      shareMessage: 'Check out this analysis of your performance'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(ShareVideoAnalysisDto, validShare);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with share message exceeding max length', async () => {
      const dto = plainToClass(ShareVideoAnalysisDto, {
        ...validShare,
        shareMessage: 'A'.repeat(501)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('shareMessage');
    });

    it('should pass validation without optional message', async () => {
      const { shareMessage, ...shareWithoutMessage } = validShare;
      const dto = plainToClass(ShareVideoAnalysisDto, shareWithoutMessage);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('BulkShareDto', () => {
    const validBulkShare = {
      videoAnalysisIds: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
      sharedWithPlayer: true,
      sharedWithTeam: false,
      shareMessage: 'Bulk sharing analysis'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(BulkShareDto, validBulkShare);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty IDs array', async () => {
      const dto = plainToClass(BulkShareDto, {
        ...validBulkShare,
        videoAnalysisIds: []
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('videoAnalysisIds');
    });

    it('should fail validation with invalid UUID', async () => {
      const dto = plainToClass(BulkShareDto, {
        ...validBulkShare,
        videoAnalysisIds: ['invalid-uuid']
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });

  describe('Complex Nested Validation', () => {
    it('should validate complex video analysis with all nested structures', async () => {
      const complexAnalysis = {
        coachId: '550e8400-e29b-41d4-a716-446655440000',
        playerId: '550e8400-e29b-41d4-a716-446655440001',
        teamId: '550e8400-e29b-41d4-a716-446655440002',
        gameId: '550e8400-e29b-41d4-a716-446655440003',
        videoUrl: 'https://example.com/full-game-analysis.mp4',
        title: 'Complete Performance Breakdown - Championship Game',
        type: 'game',
        clips: [
          {
            startTime: 45.2,
            endTime: 62.8,
            title: 'Power Play Goal',
            category: 'positive',
            players: ['player-123', 'player-456', 'player-789'],
            description: 'Excellent puck movement and screen setup leads to goal',
            coachingPoints: ['Notice the quick passing', 'Great screen position', 'Shot selection']
          },
          {
            startTime: 180.5,
            endTime: 195.1,
            title: 'Defensive Breakdown',
            category: 'negative',
            players: ['player-123'],
            description: 'Lost coverage leading to scoring chance',
            coachingPoints: ['Watch gap control', 'Communication needed']
          }
        ],
        playerPerformance: {
          positives: [
            { timestamp: 45, description: 'Great shot', category: 'Shooting', importance: 'high' },
            { timestamp: 120, description: 'Strong forecheck', category: 'Offense', importance: 'medium' }
          ],
          improvements: [
            { timestamp: 180, description: 'Defensive positioning', category: 'Defense', importance: 'high' },
            { timestamp: 240, description: 'Backcheck effort', category: 'Defense', importance: 'medium' }
          ],
          keyMoments: [
            { timestamp: 300, description: 'Game-tying goal', category: 'Clutch', importance: 'high' }
          ]
        },
        teamAnalysis: {
          systemExecution: [
            { timestamp: 60, description: 'PP1 executed perfectly', category: 'Special Teams', importance: 'high' }
          ],
          breakdowns: [
            { timestamp: 180, description: 'Defensive zone coverage', category: 'Team Defense', importance: 'high' }
          ],
          opportunities: [
            { timestamp: 250, description: 'Odd-man rush created', category: 'Transition', importance: 'medium' }
          ]
        },
        summary: 'Strong offensive game with some defensive lapses. Player showed great offensive instincts but needs to improve defensive positioning and communication.',
        tags: ['championship', 'offense', 'powerplay', 'defense'],
        sharedWithPlayer: true,
        sharedWithTeam: true
      };

      const dto = plainToClass(CreateVideoAnalysisDto, complexAnalysis);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Boundary Value Testing', () => {
    it('should handle minimum boundary values correctly', async () => {
      const minBoundaryData = {
        coachId: '550e8400-e29b-41d4-a716-446655440000',
        playerId: '550e8400-e29b-41d4-a716-446655440001',
        videoUrl: 'https://example.com/min.mp4',
        title: 'A', // minimum length
        type: 'game',
        clips: [{
          startTime: 0,    // minimum
          endTime: 0,      // minimum (edge case)
          title: 'B',
          category: 'neutral',
          players: ['C'],
          description: 'D',
          coachingPoints: ['E']
        }]
      };

      const dto = plainToClass(CreateVideoAnalysisDto, minBoundaryData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle maximum boundary values correctly', async () => {
      const maxBoundaryData = {
        coachId: '550e8400-e29b-41d4-a716-446655440000',
        playerId: '550e8400-e29b-41d4-a716-446655440001',
        videoUrl: 'https://example.com/' + 'A'.repeat(450) + '.mp4', // near maximum
        title: 'T'.repeat(255), // maximum
        type: 'tactical',
        clips: [{
          startTime: 7200,  // 2 hours
          endTime: 7260,    // 2 hours 1 minute
          title: 'C'.repeat(255), // maximum
          category: 'teaching',
          players: Array(20).fill('P'.repeat(50)), // maximum players with max length
          description: 'D'.repeat(1000), // maximum
          coachingPoints: Array(10).fill('CP'.repeat(300)) // maximum coaching points
        }],
        summary: 'S'.repeat(2000), // maximum
        tags: Array(20).fill('T'.repeat(50)) // maximum tags
      };

      const dto = plainToClass(CreateVideoAnalysisDto, maxBoundaryData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});