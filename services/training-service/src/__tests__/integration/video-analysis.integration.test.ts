import request from 'supertest';
import express from 'express';
import { DataSource } from 'typeorm';
import { TestDatabaseFactory, setupTestDatabase } from '@hockey-hub/shared-lib/testing/testDatabaseFactory';
import { createTestToken, createTestUser } from '@hockey-hub/shared-lib/testing/testHelpers';
import { authMiddleware } from '@hockey-hub/shared-lib/middleware/authMiddleware';
import { errorHandler } from '@hockey-hub/shared-lib/middleware/errorHandler';
import { 
  VideoAnalysis, 
  VideoClip, 
  AnalysisPoint, 
  PlayerPerformance, 
  TeamAnalysis 
} from '../../entities/VideoAnalysis';
import videoAnalysisRoutes from '../../routes/coach/video-analysis.routes';

describe('Video Analysis Integration Tests', () => {
  let app: express.Express;
  let dataSource: DataSource;
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  
  const entities = [VideoAnalysis];
  const { getDataSource } = setupTestDatabase('training-service-video', entities, { inMemory: true });

  // Test users
  const coach = createTestUser({
    id: 'coach-123',
    role: 'coach',
    email: 'coach@example.com',
    organizationId: 'org-123',
    teamId: 'team-123',
    permissions: ['video-analysis.create', 'video-analysis.view', 'video-analysis.update', 'video-analysis.share'],
  });

  const videoAnalyst = createTestUser({
    id: 'analyst-456',
    role: 'video-analyst',
    email: 'analyst@example.com',
    organizationId: 'org-123',
    permissions: ['video-analysis.create', 'video-analysis.view', 'video-analysis.update', 'video-analysis.share', 'video-analysis.view.all'],
  });

  const player = createTestUser({
    id: 'player-123',
    role: 'player',
    email: 'player@example.com',
    organizationId: 'org-123',
    teamId: 'team-123',
    permissions: ['video-analysis.view:own'],
  });

  const parent = createTestUser({
    id: 'parent-123',
    role: 'parent',
    email: 'parent@example.com',
    organizationId: 'org-123',
    permissions: ['video-analysis.view:child'],
    childIds: ['player-123'],
  });

  beforeAll(async () => {
    try {
      dataSource = getDataSource();
    } catch {
      // Test DB not configured
    }
    
    app = express();
    app.use(express.json());
    app.use(authMiddleware);
    app.use('/api/video-analysis', videoAnalysisRoutes);
    app.use(errorHandler);

    if (dataSource) {
      await seedTestData();
    }
  });

  async function seedTestData() {
    const ds = getDataSource();
    if (!ds) return;

    const videoRepo = ds.getRepository(VideoAnalysis);
    
    const clips: VideoClip[] = [
      {
        startTime: 120,
        endTime: 135,
        title: 'Great Pass Under Pressure',
        category: 'positive',
        players: ['player-123'],
        description: 'Excellent vision and execution under pressure',
        coachingPoints: [
          'Notice how player keeps head up while handling puck',
          'Quick decision making under pressure',
          'Accurate pass through traffic'
        ],
        drawingData: { lines: [], circles: [{ x: 100, y: 200, radius: 20 }] }
      },
      {
        startTime: 245,
        endTime: 260,
        title: 'Defensive Positioning Error',
        category: 'negative',
        players: ['player-123'],
        description: 'Gap control issue leading to odd-man rush',
        coachingPoints: [
          'Player backing up too fast',
          'Need to angle the attacker to outside',
          'Communication with defense partner needed'
        ]
      }
    ];

    const playerPerf: PlayerPerformance = {
      positives: [
        {
          timestamp: 125,
          description: 'Excellent pass under pressure',
          category: 'passing',
          importance: 'high'
        }
      ],
      improvements: [
        {
          timestamp: 250,
          description: 'Defensive gap control',
          category: 'defense',
          importance: 'high'
        }
      ],
      keyMoments: [
        {
          timestamp: 180,
          description: 'Game-winning assist',
          category: 'clutch',
          importance: 'high'
        }
      ]
    };

    const teamAnalysis: TeamAnalysis = {
      systemExecution: [
        {
          timestamp: 300,
          description: 'Power play setup execution',
          category: 'power-play',
          importance: 'medium'
        }
      ],
      breakdowns: [
        {
          timestamp: 450,
          description: 'Defensive zone coverage breakdown',
          category: 'defense',
          importance: 'high'
        }
      ],
      opportunities: [
        {
          timestamp: 600,
          description: 'Better transition opportunity',
          category: 'transition',
          importance: 'medium'
        }
      ]
    };

    await videoRepo.save([
      {
        id: 'video-1',
        coachId: 'coach-123',
        playerId: 'player-123',
        teamId: 'team-123',
        gameId: 'game-123',
        videoUrl: 'https://example.com/video/game123-player123.mp4',
        title: 'Player 123 - Game vs Rivals',
        type: 'game',
        clips,
        playerPerformance: playerPerf,
        summary: 'Strong offensive performance with some defensive areas to work on',
        tags: ['passing', 'defense', 'game-analysis'],
        sharedWithPlayer: true,
        sharedWithTeam: false
      },
      {
        id: 'video-2',
        coachId: 'coach-123',
        playerId: 'player-456',
        teamId: 'team-123',
        videoUrl: 'https://example.com/video/practice-skills.mp4',
        title: 'Skills Practice Session',
        type: 'skills',
        clips: clips.slice(0, 1),
        summary: 'Focused skill development session',
        tags: ['skills', 'practice'],
        sharedWithPlayer: false,
        sharedWithTeam: false
      },
      {
        id: 'video-3',
        coachId: 'analyst-456',
        playerId: 'player-123',
        teamId: 'team-123',
        videoUrl: 'https://example.com/video/team-tactics.mp4',
        title: 'Team Tactical Analysis',
        type: 'tactical',
        clips: [],
        teamAnalysis,
        summary: 'System execution review',
        tags: ['tactics', 'team-play'],
        sharedWithPlayer: false,
        sharedWithTeam: true
      }
    ]);
  }

  describe('POST /api/video-analysis', () => {
    it('should allow coach to create video analysis', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const analysisData = {
        playerId: 'player-new',
        teamId: 'team-123',
        gameId: 'game-456',
        videoUrl: 'https://example.com/video/new-analysis.mp4',
        title: 'New Player Analysis',
        type: 'game',
        clips: [
          {
            startTime: 60,
            endTime: 75,
            title: 'Good Shot Attempt',
            category: 'positive',
            players: ['player-new'],
            description: 'Quick release on shot',
            coachingPoints: ['Good technique', 'Quick release']
          }
        ],
        summary: 'Promising performance with good shot selection',
        tags: ['shooting', 'positioning']
      };

      const response = await request(app)
        .post('/api/video-analysis')
        .set('Authorization', `Bearer ${token}`)
        .send(analysisData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.coachId).toBe(coach.id);
      expect(response.body.playerId).toBe(analysisData.playerId);
      expect(response.body.clips).toHaveLength(1);
      expect(response.body.sharedWithPlayer).toBe(false);
      expect(response.body.sharedWithTeam).toBe(false);
    });

    it('should validate video URL format', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const analysisData = {
        playerId: 'player-test',
        videoUrl: 'invalid-url',
        title: 'Test Analysis',
        type: 'game'
      };

      const response = await request(app)
        .post('/api/video-analysis')
        .set('Authorization', `Bearer ${token}`)
        .send(analysisData)
        .expect(400);

      expect(response.body.error).toContain('validation');
      expect(response.body.details).toContain('Invalid video URL format');
    });

    it('should validate clip timestamps', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const analysisData = {
        playerId: 'player-test',
        videoUrl: 'https://example.com/video/test.mp4',
        title: 'Test Analysis',
        type: 'game',
        clips: [
          {
            startTime: 100,
            endTime: 80, // End before start
            title: 'Invalid Clip',
            category: 'positive',
            players: ['player-test'],
            description: 'Test clip'
          }
        ]
      };

      const response = await request(app)
        .post('/api/video-analysis')
        .set('Authorization', `Bearer ${token}`)
        .send(analysisData)
        .expect(400);

      expect(response.body.error).toContain('validation');
      expect(response.body.details).toContain('End time must be after start time');
    });
  });

  describe('GET /api/video-analysis', () => {
    it('should allow coach to view their team analyses', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/video-analysis')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.every((a: any) => a.teamId === coach.teamId)).toBe(true);
    });

    it('should allow filtering by analysis type', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/video-analysis?type=game')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const analyses = response.body.data;
      expect(analyses.every((a: any) => a.type === 'game')).toBe(true);
    });

    it('should allow filtering by player', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/video-analysis?playerId=player-123')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const analyses = response.body.data;
      expect(analyses.every((a: any) => a.playerId === 'player-123')).toBe(true);
    });

    it('should allow player to view only shared analyses', async () => {
      const token = createTestToken(player, JWT_SECRET);

      const response = await request(app)
        .get('/api/video-analysis')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const analyses = response.body.data;
      expect(analyses.every((a: any) => a.playerId === player.id && a.sharedWithPlayer === true)).toBe(true);
    });
  });

  describe('PUT /api/video-analysis/:id/share', () => {
    it('should allow coach to share analysis with player', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const shareData = {
        shareWithPlayer: true,
        shareWithTeam: false,
        message: 'Great game! Review the positive clips and work on defensive positioning.'
      };

      const response = await request(app)
        .put('/api/video-analysis/video-2/share')
        .set('Authorization', `Bearer ${token}`)
        .send(shareData)
        .expect(200);

      expect(response.body.sharedWithPlayer).toBe(true);
      expect(response.body.shareMessage).toBe(shareData.message);
    });

    it('should allow sharing with entire team', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const shareData = {
        shareWithPlayer: false,
        shareWithTeam: true,
        message: 'Team tactical review - study the system execution clips'
      };

      const response = await request(app)
        .put('/api/video-analysis/video-1/share')
        .set('Authorization', `Bearer ${token}`)
        .send(shareData)
        .expect(200);

      expect(response.body.sharedWithTeam).toBe(true);
    });

    it('should track viewing by shared users', async () => {
      const token = createTestToken(player, JWT_SECRET);

      // Mark analysis as viewed
      const response = await request(app)
        .post('/api/video-analysis/video-1/view')
        .set('Authorization', `Bearer ${token}`)
        .send({ viewDuration: 120 })
        .expect(200);

      expect(response.body.viewingStats).toBeDefined();
      expect(response.body.viewingStats.viewCount).toBe(1);
      expect(response.body.viewingStats.totalDuration).toBe(120);
    });
  });

  describe('PUT /api/video-analysis/:id/clips', () => {
    it('should allow updating clips and coaching points', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const clipData = {
        clipId: 0, // Index in clips array
        title: 'Updated: Great Pass Under Pressure',
        description: 'Excellent vision and execution - notice the head positioning',
        coachingPoints: [
          'Head up scanning for options',
          'Quick decision making under pressure',
          'Accurate pass through traffic',
          'Good body positioning to protect puck'
        ],
        category: 'positive'
      };

      const response = await request(app)
        .put('/api/video-analysis/video-1/clips')
        .set('Authorization', `Bearer ${token}`)
        .send(clipData)
        .expect(200);

      const updatedClip = response.body.clips[0];
      expect(updatedClip.title).toBe(clipData.title);
      expect(updatedClip.coachingPoints).toHaveLength(4);
    });

    it('should allow adding new clips to existing analysis', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const newClipData = {
        startTime: 300,
        endTime: 315,
        title: 'Strong Backcheck',
        category: 'positive',
        players: ['player-123'],
        description: 'Excellent effort getting back to help defense',
        coachingPoints: [
          'Great hustle to get back',
          'Good angle to cut off passing lane',
          'Team-first mentality'
        ]
      };

      const response = await request(app)
        .post('/api/video-analysis/video-1/clips')
        .set('Authorization', `Bearer ${token}`)
        .send(newClipData)
        .expect(201);

      expect(response.body.clips.length).toBe(3); // Original 2 + new 1
      const newClip = response.body.clips[2];
      expect(newClip.title).toBe(newClipData.title);
    });
  });

  describe('GET /api/video-analysis/:id/viewing-stats', () => {
    it('should provide viewing statistics for coaches', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/video-analysis/video-1/viewing-stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.totalViews).toBeDefined();
      expect(response.body.uniqueViewers).toBeDefined();
      expect(response.body.averageViewDuration).toBeDefined();
      expect(response.body.viewerBreakdown).toBeDefined();
      expect(response.body.clipPopularity).toBeDefined();
    });

    it('should show which clips are watched most', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/video-analysis/video-1/viewing-stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.clipAnalytics).toBeDefined();
      expect(response.body.clipAnalytics).toBeInstanceOf(Array);
      
      if (response.body.clipAnalytics.length > 0) {
        const clipStat = response.body.clipAnalytics[0];
        expect(clipStat.clipTitle).toBeDefined();
        expect(clipStat.viewCount).toBeDefined();
        expect(clipStat.avgWatchTime).toBeDefined();
      }
    });
  });

  describe('POST /api/video-analysis/bulk', () => {
    it('should allow bulk creation for team analysis', async () => {
      const token = createTestToken(videoAnalyst, JWT_SECRET);
      const bulkData = {
        gameId: 'game-bulk-test',
        teamId: 'team-123',
        playerIds: ['player-123', 'player-456', 'player-789'],
        videoBaseUrl: 'https://example.com/video/game-bulk-test',
        analysisTemplate: {
          type: 'game',
          clips: [
            {
              startTime: 0,
              endTime: 15,
              title: 'Opening shift',
              category: 'neutral',
              description: 'First shift analysis'
            }
          ],
          tags: ['game-review', 'team-performance']
        }
      };

      const response = await request(app)
        .post('/api/video-analysis/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send(bulkData)
        .expect(201);

      expect(response.body.created).toBe(3);
      expect(response.body.analyses).toHaveLength(3);
      expect(response.body.analyses.every((a: any) => a.gameId === bulkData.gameId)).toBe(true);
    });

    it('should handle bulk sharing operations', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const bulkShareData = {
        analysisIds: ['video-1', 'video-2'],
        shareWithPlayer: true,
        shareWithTeam: false,
        message: 'Review these clips before next practice'
      };

      const response = await request(app)
        .put('/api/video-analysis/bulk/share')
        .set('Authorization', `Bearer ${token}`)
        .send(bulkShareData)
        .expect(200);

      expect(response.body.updated).toBe(2);
      expect(response.body.results.every((r: any) => r.sharedWithPlayer === true)).toBe(true);
    });
  });

  describe('GET /api/video-analysis/analytics', () => {
    it('should provide team video analysis insights', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/video-analysis/analytics?teamId=team-123')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.analysisVolume).toBeDefined();
      expect(response.body.clipCategories).toBeDefined();
      expect(response.body.playerEngagement).toBeDefined();
      expect(response.body.improvementTracking).toBeDefined();
    });

    it('should track player improvement through video analysis', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/video-analysis/analytics/improvement/player-123')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.skillProgression).toBeDefined();
      expect(response.body.positiveClipsTrend).toBeDefined();
      expect(response.body.areasOfFocus).toBeDefined();
      expect(response.body.coachingEffectiveness).toBeDefined();
    });
  });

  describe('Event Publishing', () => {
    it('should publish video analysis created event', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const mockPublisher = jest.fn();
      app.locals.eventPublisher = mockPublisher;

      const analysisData = {
        playerId: 'player-event-test',
        videoUrl: 'https://example.com/video/event-test.mp4',
        title: 'Event Test Analysis',
        type: 'skills'
      };

      await request(app)
        .post('/api/video-analysis')
        .set('Authorization', `Bearer ${token}`)
        .send(analysisData)
        .expect(201);

      expect(mockPublisher).toHaveBeenCalledWith('video-analysis.created', expect.objectContaining({
        playerId: analysisData.playerId,
        coachId: coach.id,
        type: analysisData.type
      }));
    });

    it('should publish video shared event', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const mockPublisher = jest.fn();
      app.locals.eventPublisher = mockPublisher;

      const shareData = { shareWithPlayer: true, message: 'Review this analysis' };

      await request(app)
        .put('/api/video-analysis/video-1/share')
        .set('Authorization', `Bearer ${token}`)
        .send(shareData)
        .expect(200);

      expect(mockPublisher).toHaveBeenCalledWith('video-analysis.shared', expect.objectContaining({
        analysisId: 'video-1',
        sharedBy: coach.id,
        sharedWithPlayer: true
      }));
    });
  });

  describe('Cache Integration', () => {
    it('should cache video analysis lists', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const mockCache = { 
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn()
      };
      app.locals.cache = mockCache;

      await request(app)
        .get('/api/video-analysis')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(mockCache.get).toHaveBeenCalledWith(
        expect.stringContaining('video-analysis:team:team-123')
      );
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should invalidate cache after sharing updates', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const mockCache = { del: jest.fn() };
      app.locals.cache = mockCache;

      const shareData = { shareWithPlayer: true };

      await request(app)
        .put('/api/video-analysis/video-1/share')
        .set('Authorization', `Bearer ${token}`)
        .send(shareData)
        .expect(200);

      expect(mockCache.del).toHaveBeenCalledWith(
        expect.stringContaining('video-analysis:player:player-123')
      );
    });
  });

  describe('Authorization Edge Cases', () => {
    it('should prevent unauthorized coaches from viewing other team analyses', async () => {
      const otherCoach = createTestUser({
        id: 'other-coach-999',
        role: 'coach',
        teamId: 'other-team-999',
        organizationId: 'other-org-999',
        permissions: ['video-analysis.view']
      });
      const token = createTestToken(otherCoach, JWT_SECRET);

      const response = await request(app)
        .get('/api/video-analysis/video-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.error).toContain('access denied');
    });

    it('should allow video analysts to view all analyses in organization', async () => {
      const token = createTestToken(videoAnalyst, JWT_SECRET);

      const response = await request(app)
        .get('/api/video-analysis')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should prevent players from accessing non-shared analyses', async () => {
      const token = createTestToken(player, JWT_SECRET);

      const response = await request(app)
        .get('/api/video-analysis/video-2') // Not shared with player
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.error).toContain('analysis not shared');
    });
  });
});