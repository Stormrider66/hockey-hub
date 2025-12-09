import request from 'supertest';
import express from 'express';
import { DataSource } from 'typeorm';
import { TestDatabaseFactory, setupTestDatabase } from '@hockey-hub/shared-lib/testing/testDatabaseFactory';
import { createTestToken, createTestUser } from '@hockey-hub/shared-lib/testing/testHelpers';
import { authMiddleware } from '@hockey-hub/shared-lib/middleware/authMiddleware';
import { errorHandler } from '@hockey-hub/shared-lib/middleware/errorHandler';
import { PlayerFeedback } from '../../entities/PlayerFeedback';
import playerFeedbackRoutes from '../../routes/coach/player-feedback.routes';

describe('Player Feedback Integration Tests', () => {
  let app: express.Express;
  let dataSource: DataSource;
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  
  const entities = [PlayerFeedback];
  const { getDataSource } = setupTestDatabase('training-service-feedback', entities, { inMemory: true });

  // Test users
  const coach = createTestUser({
    id: 'coach-123',
    role: 'coach',
    email: 'coach@example.com',
    organizationId: 'org-123',
    teamId: 'team-123',
    permissions: ['feedback.create', 'feedback.view', 'feedback.update', 'feedback.delete'],
  });

  const headCoach = createTestUser({
    id: 'head-coach-456',
    role: 'head-coach',
    email: 'head.coach@example.com',
    organizationId: 'org-123',
    teamId: 'team-123',
    permissions: ['feedback.create', 'feedback.view', 'feedback.update', 'feedback.delete', 'feedback.view.all'],
  });

  const player = createTestUser({
    id: 'player-123',
    role: 'player',
    email: 'player@example.com',
    organizationId: 'org-123',
    teamId: 'team-123',
    permissions: ['feedback.view:own', 'feedback.respond'],
  });

  const parent = createTestUser({
    id: 'parent-123',
    role: 'parent',
    email: 'parent@example.com',
    organizationId: 'org-123',
    permissions: ['feedback.view:child'],
    childIds: ['player-123'],
  });

  const unauthorizedCoach = createTestUser({
    id: 'other-coach-789',
    role: 'coach',
    email: 'other@example.com',
    organizationId: 'org-456',
    teamId: 'team-456',
    permissions: ['feedback.create', 'feedback.view'],
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
    app.use('/api/feedback', playerFeedbackRoutes);
    app.use(errorHandler);

    if (dataSource) {
      await seedTestData();
    }
  });

  async function seedTestData() {
    const ds = getDataSource();
    if (!ds) return;

    const feedbackRepo = ds.getRepository(PlayerFeedback);
    
    await feedbackRepo.save([
      {
        id: 'feedback-1',
        playerId: 'player-123',
        coachId: 'coach-123',
        type: 'game',
        relatedEventId: 'game-123',
        tone: 'positive',
        message: 'Excellent performance in tonight\'s game! Your passing was exceptional and you showed great leadership on the ice.',
        actionItems: ['Continue working on shot accuracy', 'Keep up the leadership'],
        requiresResponse: false,
        parentVisible: true,
        status: 'read'
      },
      {
        id: 'feedback-2',
        playerId: 'player-123',
        coachId: 'coach-123',
        type: 'practice',
        tone: 'constructive',
        message: 'Good effort in practice today, but I noticed some areas we need to work on for defensive positioning.',
        actionItems: [
          'Focus on gap control during 1-on-1 drills',
          'Watch video analysis of today\'s positioning',
          'Practice defensive stance at home'
        ],
        requiresResponse: true,
        parentVisible: false,
        status: 'unread'
      },
      {
        id: 'feedback-3',
        playerId: 'player-456',
        coachId: 'coach-123',
        type: 'behavioral',
        tone: 'critical',
        message: 'We need to discuss your attitude during practice. Respectful communication with teammates is essential.',
        actionItems: ['Reflect on team communication', 'Apologize to affected teammates'],
        requiresResponse: true,
        parentVisible: true,
        status: 'unread'
      },
      {
        id: 'feedback-4',
        playerId: 'player-123',
        coachId: 'head-coach-456',
        type: 'general',
        tone: 'mixed',
        message: 'Overall good progress this month. Your offensive game has improved significantly, but we need to focus more on defensive responsibilities.',
        requiresResponse: false,
        parentVisible: true,
        status: 'acknowledged'
      }
    ]);
  }

  describe('POST /api/feedback', () => {
    it('should allow coach to create feedback for player', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const feedbackData = {
        playerId: 'player-789',
        type: 'practice',
        tone: 'positive',
        message: 'Great improvement in your skating technique today! Your crossovers are much smoother.',
        actionItems: ['Continue practicing crossovers', 'Work on backward skating next'],
        parentVisible: false,
        requiresResponse: false
      };

      const response = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${token}`)
        .send(feedbackData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.playerId).toBe(feedbackData.playerId);
      expect(response.body.coachId).toBe(coach.id);
      expect(response.body.status).toBe('unread');
      expect(response.body.actionItems).toHaveLength(2);
    });

    it('should link feedback to specific game or practice', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const feedbackData = {
        playerId: 'player-test',
        type: 'game',
        relatedEventId: 'game-456',
        tone: 'constructive',
        message: 'Good game overall, but missed some opportunities on the power play.',
        actionItems: ['Review power play positioning video']
      };

      const response = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${token}`)
        .send(feedbackData)
        .expect(201);

      expect(response.body.relatedEventId).toBe(feedbackData.relatedEventId);
      expect(response.body.type).toBe('game');
    });

    it('should validate feedback tone matches message content', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const feedbackData = {
        playerId: 'player-test',
        type: 'practice',
        tone: 'positive',
        message: 'Your performance was terrible and unacceptable.', // Mismatch with positive tone
        requiresResponse: false
      };

      const response = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${token}`)
        .send(feedbackData)
        .expect(400);

      expect(response.body.error).toContain('validation');
      expect(response.body.details).toContain('tone does not match message content');
    });

    it('should prevent unauthorized coaches from creating feedback', async () => {
      const token = createTestToken(unauthorizedCoach, JWT_SECRET);
      const feedbackData = {
        playerId: 'player-123',
        type: 'general',
        tone: 'positive',
        message: 'Test feedback'
      };

      const response = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${token}`)
        .send(feedbackData)
        .expect(403);

      expect(response.body.error).toContain('Insufficient permissions');
    });
  });

  describe('GET /api/feedback', () => {
    it('should allow coach to view feedback they created', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/feedback')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.every((f: any) => f.coachId === coach.id)).toBe(true);
    });

    it('should allow filtering by feedback type', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/feedback?type=game')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const feedback = response.body.data;
      expect(feedback.every((f: any) => f.type === 'game')).toBe(true);
    });

    it('should allow filtering by status', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/feedback?status=unread')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const feedback = response.body.data;
      expect(feedback.every((f: any) => f.status === 'unread')).toBe(true);
    });

    it('should allow filtering feedback requiring response', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/feedback?requiresResponse=true')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const feedback = response.body.data;
      expect(feedback.every((f: any) => f.requiresResponse === true)).toBe(true);
    });

    it('should allow player to view only their own feedback', async () => {
      const token = createTestToken(player, JWT_SECRET);

      const response = await request(app)
        .get('/api/feedback')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const feedback = response.body.data;
      expect(feedback.every((f: any) => f.playerId === player.id)).toBe(true);
    });

    it('should allow parent to view child feedback marked as parent visible', async () => {
      const token = createTestToken(parent, JWT_SECRET);

      const response = await request(app)
        .get('/api/feedback')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const feedback = response.body.data;
      expect(feedback.every((f: any) => 
        parent.childIds?.includes(f.playerId) && f.parentVisible === true
      )).toBe(true);
    });
  });

  describe('PUT /api/feedback/:id/response', () => {
    it('should allow player to respond to feedback requiring response', async () => {
      const token = createTestToken(player, JWT_SECRET);
      const responseData = {
        response: 'Thank you for the feedback, coach. I will work on the defensive positioning drills and watch the video analysis.',
        actionPlan: 'I will practice gap control for 15 minutes after each practice session'
      };

      const response = await request(app)
        .put('/api/feedback/feedback-2/response')
        .set('Authorization', `Bearer ${token}`)
        .send(responseData)
        .expect(200);

      expect(response.body.playerResponse).toBe(responseData.response);
      expect(response.body.playerResponseDate).toBeDefined();
      expect(response.body.status).toBe('acknowledged');
    });

    it('should prevent response to feedback not requiring response', async () => {
      const token = createTestToken(player, JWT_SECRET);
      const responseData = {
        response: 'Thanks for the positive feedback!'
      };

      const response = await request(app)
        .put('/api/feedback/feedback-1/response')
        .set('Authorization', `Bearer ${token}`)
        .send(responseData)
        .expect(400);

      expect(response.body.error).toContain('This feedback does not require a response');
    });

    it('should prevent unauthorized players from responding', async () => {
      const otherPlayer = createTestUser({
        id: 'other-player-999',
        role: 'player',
        organizationId: 'org-123',
        permissions: ['feedback.respond']
      });
      const token = createTestToken(otherPlayer, JWT_SECRET);

      const responseData = { response: 'Unauthorized response' };

      const response = await request(app)
        .put('/api/feedback/feedback-2/response')
        .set('Authorization', `Bearer ${token}`)
        .send(responseData)
        .expect(403);

      expect(response.body.error).toContain('access denied');
    });
  });

  describe('PUT /api/feedback/:id/status', () => {
    it('should allow player to mark feedback as read', async () => {
      const token = createTestToken(player, JWT_SECRET);

      const response = await request(app)
        .put('/api/feedback/feedback-2/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'read' })
        .expect(200);

      expect(response.body.status).toBe('read');
    });

    it('should allow coach to mark feedback as discussed', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const statusData = {
        status: 'discussed',
        discussionNotes: 'Had a good conversation about defensive positioning. Player is committed to improvement.'
      };

      const response = await request(app)
        .put('/api/feedback/feedback-2/status')
        .set('Authorization', `Bearer ${token}`)
        .send(statusData)
        .expect(200);

      expect(response.body.status).toBe('discussed');
      expect(response.body.discussedInPerson).toBeDefined();
    });

    it('should validate status transitions', async () => {
      const token = createTestToken(player, JWT_SECRET);

      // Try to mark as discussed (only coaches can do this)
      const response = await request(app)
        .put('/api/feedback/feedback-1/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'discussed' })
        .expect(400);

      expect(response.body.error).toContain('Invalid status transition');
    });
  });

  describe('POST /api/feedback/templates', () => {
    it('should allow coach to create feedback template', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const templateData = {
        name: 'Post-Game Positive',
        category: 'game',
        tone: 'positive',
        messageTemplate: 'Great game tonight! Your {skill} was excellent. {specific_praise}',
        defaultActionItems: [
          'Continue working on {improvement_area}',
          'Keep up the {strength}'
        ],
        placeholders: ['skill', 'specific_praise', 'improvement_area', 'strength']
      };

      const response = await request(app)
        .post('/api/feedback/templates')
        .set('Authorization', `Bearer ${token}`)
        .send(templateData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe(templateData.name);
      expect(response.body.coachId).toBe(coach.id);
    });

    it('should allow using template to create feedback', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      
      // First create template
      const templateData = {
        name: 'Practice Improvement',
        messageTemplate: 'Good work on {skill} today. Next, focus on {next_area}.',
        defaultActionItems: ['Practice {drill_name}', 'Watch {video_reference}']
      };

      const templateResponse = await request(app)
        .post('/api/feedback/templates')
        .set('Authorization', `Bearer ${token}`)
        .send(templateData)
        .expect(201);

      // Use template to create feedback
      const feedbackData = {
        templateId: templateResponse.body.id,
        playerId: 'player-template-test',
        placeholderValues: {
          skill: 'passing',
          next_area: 'defensive positioning',
          drill_name: 'gap control drill',
          video_reference: 'defensive positioning video'
        },
        type: 'practice',
        tone: 'constructive'
      };

      const feedbackResponse = await request(app)
        .post('/api/feedback/from-template')
        .set('Authorization', `Bearer ${token}`)
        .send(feedbackData)
        .expect(201);

      expect(feedbackResponse.body.message).toContain('Good work on passing today');
      expect(feedbackResponse.body.actionItems[0]).toContain('Practice gap control drill');
    });
  });

  describe('GET /api/feedback/analytics', () => {
    it('should provide feedback analytics for coaches', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/feedback/analytics?teamId=team-123')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.feedbackVolume).toBeDefined();
      expect(response.body.responseRates).toBeDefined();
      expect(response.body.toneDistribution).toBeDefined();
      expect(response.body.playerEngagement).toBeDefined();
      expect(response.body.improvementTracking).toBeDefined();
    });

    it('should show individual player feedback history', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/feedback/analytics/player/player-123')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.feedbackHistory).toBeDefined();
      expect(response.body.progressTrends).toBeDefined();
      expect(response.body.commonThemes).toBeDefined();
      expect(response.body.responseQuality).toBeDefined();
    });
  });

  describe('POST /api/feedback/bulk', () => {
    it('should allow bulk feedback creation for team', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const bulkData = {
        playerIds: ['player-123', 'player-456', 'player-789'],
        type: 'practice',
        tone: 'mixed',
        messageTemplate: 'Good effort in practice today, {playerName}. Areas to focus on: {specific_feedback}',
        playerSpecificData: {
          'player-123': { specific_feedback: 'defensive positioning' },
          'player-456': { specific_feedback: 'passing accuracy' },
          'player-789': { specific_feedback: 'skating speed' }
        },
        parentVisible: false,
        requiresResponse: false
      };

      const response = await request(app)
        .post('/api/feedback/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send(bulkData)
        .expect(201);

      expect(response.body.created).toBe(3);
      expect(response.body.feedback).toHaveLength(3);
      expect(response.body.feedback[0].message).toContain('defensive positioning');
    });

    it('should handle bulk status updates', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const bulkStatusData = {
        feedbackIds: ['feedback-1', 'feedback-2'],
        status: 'discussed',
        discussionNotes: 'Team meeting covered all feedback points'
      };

      const response = await request(app)
        .put('/api/feedback/bulk/status')
        .set('Authorization', `Bearer ${token}`)
        .send(bulkStatusData)
        .expect(200);

      expect(response.body.updated).toBe(2);
      expect(response.body.results.every((r: any) => r.status === 'discussed')).toBe(true);
    });
  });

  describe('Event Publishing', () => {
    it('should publish feedback created event', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const mockPublisher = jest.fn();
      app.locals.eventPublisher = mockPublisher;

      const feedbackData = {
        playerId: 'player-event-test',
        type: 'general',
        tone: 'positive',
        message: 'Great improvement this week!'
      };

      await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${token}`)
        .send(feedbackData)
        .expect(201);

      expect(mockPublisher).toHaveBeenCalledWith('feedback.created', expect.objectContaining({
        playerId: feedbackData.playerId,
        coachId: coach.id,
        type: feedbackData.type,
        tone: feedbackData.tone
      }));
    });

    it('should publish player response event', async () => {
      const token = createTestToken(player, JWT_SECRET);
      const mockPublisher = jest.fn();
      app.locals.eventPublisher = mockPublisher;

      const responseData = {
        response: 'Thank you for the feedback, I will work on it'
      };

      await request(app)
        .put('/api/feedback/feedback-2/response')
        .set('Authorization', `Bearer ${token}`)
        .send(responseData)
        .expect(200);

      expect(mockPublisher).toHaveBeenCalledWith('feedback.responded', expect.objectContaining({
        feedbackId: 'feedback-2',
        playerId: player.id,
        responseLength: expect.any(Number)
      }));
    });
  });

  describe('Cache Integration', () => {
    it('should cache feedback lists for players', async () => {
      const token = createTestToken(player, JWT_SECRET);
      const mockCache = { 
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn()
      };
      app.locals.cache = mockCache;

      await request(app)
        .get('/api/feedback')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(mockCache.get).toHaveBeenCalledWith(
        expect.stringContaining('feedback:player:player-123')
      );
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should invalidate cache after new feedback', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const mockCache = { del: jest.fn() };
      app.locals.cache = mockCache;

      const feedbackData = {
        playerId: 'player-cache-test',
        type: 'general',
        tone: 'positive',
        message: 'Cache test feedback'
      };

      await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${token}`)
        .send(feedbackData)
        .expect(201);

      expect(mockCache.del).toHaveBeenCalledWith(
        expect.stringContaining('feedback:player:player-cache-test')
      );
    });
  });

  describe('Database Transactions', () => {
    it('should handle concurrent feedback creation', async () => {
      const token1 = createTestToken(coach, JWT_SECRET);
      const token2 = createTestToken(headCoach, JWT_SECRET);

      const feedback1 = {
        playerId: 'player-concurrent-1',
        type: 'practice',
        tone: 'positive',
        message: 'Coach feedback'
      };

      const feedback2 = {
        playerId: 'player-concurrent-2',
        type: 'game',
        tone: 'constructive',
        message: 'Head coach feedback'
      };

      const [response1, response2] = await Promise.all([
        request(app)
          .post('/api/feedback')
          .set('Authorization', `Bearer ${token1}`)
          .send(feedback1),
        request(app)
          .post('/api/feedback')
          .set('Authorization', `Bearer ${token2}`)
          .send(feedback2)
      ]);

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
      expect(response1.body.coachId).toBe(coach.id);
      expect(response2.body.coachId).toBe(headCoach.id);
    });

    it('should rollback on bulk creation failure', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const bulkData = {
        playerIds: ['player-valid', 'invalid-player-id'],
        type: 'practice',
        tone: 'positive',
        message: 'Test message',
        // Missing required template data causing failure
        messageTemplate: '{missing_placeholder}'
      };

      await request(app)
        .post('/api/feedback/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send(bulkData)
        .expect(400);

      // Verify no partial creations
      const verifyResponse = await request(app)
        .get('/api/feedback?playerId=player-valid')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const newFeedback = verifyResponse.body.data.filter((f: any) => 
        f.message === 'Test message'
      );
      expect(newFeedback).toHaveLength(0);
    });
  });

  describe('Cross-Service References', () => {
    it('should link feedback to training sessions', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/feedback/feedback-1/related-sessions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.trainingSessions).toBeDefined();
      expect(response.body.performanceMetrics).toBeDefined();
      expect(response.body.improvementCorrelation).toBeDefined();
    });

    it('should integrate with evaluation system', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/feedback/feedback-1/evaluation-context')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.recentEvaluations).toBeDefined();
      expect(response.body.skillAlignment).toBeDefined();
      expect(response.body.developmentProgress).toBeDefined();
    });
  });

  describe('Authorization Edge Cases', () => {
    it('should prevent parents from viewing non-visible feedback', async () => {
      const token = createTestToken(parent, JWT_SECRET);

      const response = await request(app)
        .get('/api/feedback/feedback-2') // parentVisible: false
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.error).toContain('access denied');
    });

    it('should allow head coaches to view all team feedback', async () => {
      const token = createTestToken(headCoach, JWT_SECRET);

      const response = await request(app)
        .get('/api/feedback')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });
});