import { PerformanceDiscussionService } from '../../services/PerformanceDiscussionService';
import { 
  setupTestDatabase, 
  teardownTestDatabase, 
  clearDatabase, 
  TestDataSource 
} from '../setup/testDatabase';
import { 
  createTestUser, 
  createTestConversation 
} from '../helpers/testHelpers';
import { 
  PerformanceDiscussion,
  DiscussionStatus,
  DiscussionType,
  DiscussionParticipant,
  ParticipantType,
  DiscussionAction,
  ActionStatus,
  DiscussionTemplate,
  TemplateCategory,
  Conversation,
  ConversationType
} from '../../entities';
import { NotFoundError, ForbiddenError } from '@hockey-hub/shared-lib';

describe('PerformanceDiscussionService', () => {
  let service: PerformanceDiscussionService;
  let testUsers: any[] = [];
  let testConversation: Conversation;

  beforeAll(async () => {
    await setupTestDatabase();
    service = new PerformanceDiscussionService();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Create test users with roles
    testUsers = [
      await createTestUser({ id: 'coach1', name: 'Coach 1', roles: ['coach'] }),
      await createTestUser({ id: 'coach2', name: 'Coach 2', roles: ['coach'] }),
      await createTestUser({ id: 'player1', name: 'Player 1', roles: ['player'] }),
      await createTestUser({ id: 'player2', name: 'Player 2', roles: ['player'] }),
      await createTestUser({ id: 'parent1', name: 'Parent 1', roles: ['parent'] }),
    ];

    // Create a conversation for discussions
    testConversation = await createTestConversation('coach1', ['coach1', 'player1'], ConversationType.DIRECT);
  });

  describe('createDiscussion', () => {
    it('should create a performance discussion', async () => {
      const discussionData = {
        title: 'Q1 Performance Review',
        type: DiscussionType.PERFORMANCE_REVIEW,
        description: 'Quarterly performance review discussion',
        player_id: 'player1',
        scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        participant_ids: ['coach1', 'player1'],
        agenda: ['Recent performance', 'Areas of improvement', 'Goals for next quarter'],
        tags: ['quarterly-review', 'performance'],
      };

      const discussion = await service.createDiscussion('coach1', discussionData);

      expect(discussion).toBeDefined();
      expect(discussion.title).toBe(discussionData.title);
      expect(discussion.type).toBe(discussionData.type);
      expect(discussion.created_by).toBe('coach1');
      expect(discussion.status).toBe(DiscussionStatus.SCHEDULED);
      expect(discussion.player_id).toBe('player1');
      expect(discussion.agenda).toEqual(discussionData.agenda);
    });

    it('should create a goal setting discussion', async () => {
      const discussionData = {
        title: 'Season Goals Discussion',
        type: DiscussionType.GOAL_SETTING,
        description: 'Setting goals for the upcoming season',
        player_id: 'player1',
        scheduled_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        participant_ids: ['coach1', 'player1', 'parent1'],
        goals: [
          { description: 'Improve skating speed by 10%', target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
          { description: 'Master new defensive techniques', target_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
        ],
      };

      const discussion = await service.createDiscussion('coach1', discussionData);

      expect(discussion.type).toBe(DiscussionType.GOAL_SETTING);
      expect(discussion.metadata?.goals).toHaveLength(2);
      
      // Check participants
      const participants = await TestDataSource.getRepository(DiscussionParticipant)
        .find({ where: { discussion_id: discussion.id } });
      expect(participants).toHaveLength(3);
      
      const coachParticipant = participants.find(p => p.user_id === 'coach1');
      expect(coachParticipant?.type).toBe(ParticipantType.COACH);
    });

    it('should validate coach permission to create discussion', async () => {
      const discussionData = {
        title: 'Invalid Discussion',
        type: DiscussionType.PERFORMANCE_REVIEW,
        player_id: 'player1',
        scheduled_date: new Date(),
        participant_ids: ['player2', 'player1'],
      };

      await expect(
        service.createDiscussion('player2', discussionData) // Non-coach trying to create
      ).rejects.toThrow(ForbiddenError);
    });

    it('should create associated conversation if requested', async () => {
      const discussionData = {
        title: 'Performance Discussion with Chat',
        type: DiscussionType.PROGRESS_CHECK,
        player_id: 'player1',
        scheduled_date: new Date(),
        participant_ids: ['coach1', 'player1'],
        create_conversation: true,
      };

      const discussion = await service.createDiscussion('coach1', discussionData);

      expect(discussion.conversation_id).toBeDefined();
      
      // Verify conversation was created
      const conversation = await TestDataSource.getRepository(Conversation)
        .findOne({ where: { id: discussion.conversation_id } });
      expect(conversation).toBeDefined();
      expect(conversation?.metadata?.discussion_id).toBe(discussion.id);
    });

    it('should handle development planning discussion type', async () => {
      const discussionData = {
        title: 'Skills Development Plan',
        type: DiscussionType.DEVELOPMENT_PLANNING,
        description: 'Planning skill development pathway',
        player_id: 'player1',
        scheduled_date: new Date(),
        participant_ids: ['coach1', 'player1'],
        skills_focus: ['shooting', 'skating', 'game awareness'],
        timeline: '3 months',
      };

      const discussion = await service.createDiscussion('coach1', discussionData);

      expect(discussion.type).toBe(DiscussionType.DEVELOPMENT_PLANNING);
      expect(discussion.metadata?.skills_focus).toEqual(['shooting', 'skating', 'game awareness']);
      expect(discussion.metadata?.timeline).toBe('3 months');
    });

    it('should require scheduled_date for scheduled discussions', async () => {
      const discussionData = {
        title: 'Missing Date Discussion',
        type: DiscussionType.PERFORMANCE_REVIEW,
        player_id: 'player1',
        participant_ids: ['coach1', 'player1'],
        // Missing scheduled_date
      };

      await expect(
        service.createDiscussion('coach1', discussionData)
      ).rejects.toThrow('Scheduled date is required');
    });
  });

  describe('updateDiscussion', () => {
    let testDiscussion: PerformanceDiscussion;

    beforeEach(async () => {
      testDiscussion = await service.createDiscussion('coach1', {
        title: 'Original Title',
        type: DiscussionType.PERFORMANCE_REVIEW,
        description: 'Original description',
        player_id: 'player1',
        scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        participant_ids: ['coach1', 'player1'],
      });
    });

    it('should update discussion details', async () => {
      const updates = {
        title: 'Updated Performance Review',
        description: 'Updated description with more details',
        scheduled_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        agenda: ['New agenda item 1', 'New agenda item 2'],
      };

      const updated = await service.updateDiscussion(testDiscussion.id, 'coach1', updates);

      expect(updated.title).toBe(updates.title);
      expect(updated.description).toBe(updates.description);
      expect(updated.scheduled_date).toEqual(updates.scheduled_date);
      expect(updated.agenda).toEqual(updates.agenda);
    });

    it('should prevent non-creator from updating', async () => {
      await expect(
        service.updateDiscussion(testDiscussion.id, 'coach2', { title: 'Hacked' })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should not allow status change through regular update', async () => {
      const updated = await service.updateDiscussion(testDiscussion.id, 'coach1', {
        status: DiscussionStatus.COMPLETED as any, // Try to change status
        title: 'New Title',
      });

      expect(updated.status).toBe(DiscussionStatus.SCHEDULED); // Status unchanged
      expect(updated.title).toBe('New Title'); // Other changes applied
    });

    it('should handle adding participants', async () => {
      const updated = await service.updateDiscussion(testDiscussion.id, 'coach1', {
        participant_ids: ['coach1', 'player1', 'coach2'], // Add coach2
      });

      const participants = await TestDataSource.getRepository(DiscussionParticipant)
        .find({ where: { discussion_id: updated.id } });
      expect(participants).toHaveLength(3);
      expect(participants.find(p => p.user_id === 'coach2')).toBeDefined();
    });

    it('should handle removing participants', async () => {
      // First add another participant
      await service.updateDiscussion(testDiscussion.id, 'coach1', {
        participant_ids: ['coach1', 'player1', 'coach2'],
      });

      // Then remove them
      const updated = await service.updateDiscussion(testDiscussion.id, 'coach1', {
        participant_ids: ['coach1', 'player1'], // Remove coach2
      });

      const participants = await TestDataSource.getRepository(DiscussionParticipant)
        .find({ where: { discussion_id: updated.id } });
      expect(participants).toHaveLength(2);
      expect(participants.find(p => p.user_id === 'coach2')).toBeUndefined();
    });
  });

  describe('startDiscussion', () => {
    let testDiscussion: PerformanceDiscussion;

    beforeEach(async () => {
      testDiscussion = await service.createDiscussion('coach1', {
        title: 'Discussion to Start',
        type: DiscussionType.PROGRESS_CHECK,
        player_id: 'player1',
        scheduled_date: new Date(),
        participant_ids: ['coach1', 'player1'],
      });
    });

    it('should start a scheduled discussion', async () => {
      const started = await service.startDiscussion(testDiscussion.id, 'coach1');

      expect(started.status).toBe(DiscussionStatus.IN_PROGRESS);
      expect(started.started_at).toBeDefined();
      expect(started.metadata?.started_by).toBe('coach1');
    });

    it('should only allow participants to start discussion', async () => {
      await expect(
        service.startDiscussion(testDiscussion.id, 'coach2') // Not a participant
      ).rejects.toThrow(ForbiddenError);
    });

    it('should not start already completed discussion', async () => {
      // First complete the discussion
      await service.startDiscussion(testDiscussion.id, 'coach1');
      await service.completeDiscussion(testDiscussion.id, 'coach1', { summary: 'Done' });

      await expect(
        service.startDiscussion(testDiscussion.id, 'coach1')
      ).rejects.toThrow('Discussion is already completed');
    });
  });

  describe('completeDiscussion', () => {
    let testDiscussion: PerformanceDiscussion;

    beforeEach(async () => {
      testDiscussion = await service.createDiscussion('coach1', {
        title: 'Discussion to Complete',
        type: DiscussionType.PERFORMANCE_REVIEW,
        player_id: 'player1',
        scheduled_date: new Date(),
        participant_ids: ['coach1', 'player1'],
      });
      
      // Start the discussion
      await service.startDiscussion(testDiscussion.id, 'coach1');
    });

    it('should complete discussion with summary', async () => {
      const completionData = {
        summary: 'Great progress made. Player shows improvement in all areas.',
        outcomes: ['Increased practice frequency', 'Focus on defensive skills'],
        follow_up_required: true,
        follow_up_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      const completed = await service.completeDiscussion(
        testDiscussion.id, 
        'coach1', 
        completionData
      );

      expect(completed.status).toBe(DiscussionStatus.COMPLETED);
      expect(completed.completed_at).toBeDefined();
      expect(completed.summary).toBe(completionData.summary);
      expect(completed.outcomes).toEqual(completionData.outcomes);
      expect(completed.follow_up_required).toBe(true);
      expect(completed.follow_up_date).toEqual(completionData.follow_up_date);
    });

    it('should require summary to complete', async () => {
      await expect(
        service.completeDiscussion(testDiscussion.id, 'coach1', {})
      ).rejects.toThrow('Summary is required');
    });

    it('should only allow creator to complete', async () => {
      await expect(
        service.completeDiscussion(testDiscussion.id, 'player1', {
          summary: 'Player trying to complete',
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should create follow-up discussion if requested', async () => {
      const completed = await service.completeDiscussion(
        testDiscussion.id,
        'coach1',
        {
          summary: 'Good session',
          follow_up_required: true,
          follow_up_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          create_follow_up: true,
        }
      );

      expect(completed.follow_up_discussion_id).toBeDefined();
      
      // Verify follow-up was created
      const followUp = await TestDataSource.getRepository(PerformanceDiscussion)
        .findOne({ where: { id: completed.follow_up_discussion_id } });
      expect(followUp).toBeDefined();
      expect(followUp?.title).toContain('Follow-up');
      expect(followUp?.parent_discussion_id).toBe(testDiscussion.id);
    });
  });

  describe('cancelDiscussion', () => {
    let testDiscussion: PerformanceDiscussion;

    beforeEach(async () => {
      testDiscussion = await service.createDiscussion('coach1', {
        title: 'Discussion to Cancel',
        type: DiscussionType.PROGRESS_CHECK,
        player_id: 'player1',
        scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        participant_ids: ['coach1', 'player1'],
      });
    });

    it('should cancel scheduled discussion', async () => {
      const cancelled = await service.cancelDiscussion(
        testDiscussion.id,
        'coach1',
        'Schedule conflict'
      );

      expect(cancelled.status).toBe(DiscussionStatus.CANCELLED);
      expect(cancelled.metadata?.cancellation_reason).toBe('Schedule conflict');
      expect(cancelled.metadata?.cancelled_by).toBe('coach1');
    });

    it('should require cancellation reason', async () => {
      await expect(
        service.cancelDiscussion(testDiscussion.id, 'coach1', '')
      ).rejects.toThrow('Cancellation reason is required');
    });

    it('should not cancel completed discussion', async () => {
      // Complete the discussion first
      await service.startDiscussion(testDiscussion.id, 'coach1');
      await service.completeDiscussion(testDiscussion.id, 'coach1', {
        summary: 'Completed',
      });

      await expect(
        service.cancelDiscussion(testDiscussion.id, 'coach1', 'Too late')
      ).rejects.toThrow('Cannot cancel completed discussion');
    });
  });

  describe('addDiscussionAction', () => {
    let testDiscussion: PerformanceDiscussion;

    beforeEach(async () => {
      testDiscussion = await service.createDiscussion('coach1', {
        title: 'Discussion with Actions',
        type: DiscussionType.GOAL_SETTING,
        player_id: 'player1',
        scheduled_date: new Date(),
        participant_ids: ['coach1', 'player1'],
      });
      
      await service.startDiscussion(testDiscussion.id, 'coach1');
    });

    it('should add action item to discussion', async () => {
      const actionData = {
        title: 'Improve shooting accuracy',
        description: 'Practice shooting drills 3x per week',
        assigned_to: 'player1',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        priority: 'high' as const,
      };

      const action = await service.addDiscussionAction(
        testDiscussion.id,
        'coach1',
        actionData
      );

      expect(action).toBeDefined();
      expect(action.discussion_id).toBe(testDiscussion.id);
      expect(action.title).toBe(actionData.title);
      expect(action.assigned_to).toBe('player1');
      expect(action.status).toBe(ActionStatus.PENDING);
      expect(action.created_by).toBe('coach1');
    });

    it('should validate assigned user is participant', async () => {
      await expect(
        service.addDiscussionAction(testDiscussion.id, 'coach1', {
          title: 'Invalid assignment',
          assigned_to: 'player2', // Not a participant
          due_date: new Date(),
        })
      ).rejects.toThrow('Assigned user must be a participant');
    });

    it('should allow adding multiple actions', async () => {
      const actions = [
        { title: 'Action 1', assigned_to: 'player1', due_date: new Date() },
        { title: 'Action 2', assigned_to: 'coach1', due_date: new Date() },
        { title: 'Action 3', assigned_to: 'player1', due_date: new Date() },
      ];

      for (const actionData of actions) {
        await service.addDiscussionAction(testDiscussion.id, 'coach1', actionData);
      }

      const savedActions = await TestDataSource.getRepository(DiscussionAction)
        .find({ where: { discussion_id: testDiscussion.id } });
      expect(savedActions).toHaveLength(3);
    });
  });

  describe('updateActionStatus', () => {
    let testDiscussion: PerformanceDiscussion;
    let testAction: DiscussionAction;

    beforeEach(async () => {
      testDiscussion = await service.createDiscussion('coach1', {
        title: 'Discussion with Actions',
        type: DiscussionType.GOAL_SETTING,
        player_id: 'player1',
        scheduled_date: new Date(),
        participant_ids: ['coach1', 'player1'],
      });
      
      await service.startDiscussion(testDiscussion.id, 'coach1');
      
      testAction = await service.addDiscussionAction(testDiscussion.id, 'coach1', {
        title: 'Test Action',
        assigned_to: 'player1',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    });

    it('should update action status to in progress', async () => {
      const updated = await service.updateActionStatus(
        testAction.id,
        'player1',
        ActionStatus.IN_PROGRESS,
        'Started working on this'
      );

      expect(updated.status).toBe(ActionStatus.IN_PROGRESS);
      expect(updated.metadata?.status_updates).toHaveLength(1);
      expect(updated.metadata?.status_updates[0]).toMatchObject({
        from: ActionStatus.PENDING,
        to: ActionStatus.IN_PROGRESS,
        updated_by: 'player1',
        notes: 'Started working on this',
      });
    });

    it('should update action status to completed', async () => {
      const updated = await service.updateActionStatus(
        testAction.id,
        'player1',
        ActionStatus.COMPLETED,
        'Finished successfully'
      );

      expect(updated.status).toBe(ActionStatus.COMPLETED);
      expect(updated.completed_at).toBeDefined();
      expect(updated.metadata?.completion_notes).toBe('Finished successfully');
    });

    it('should only allow assigned user or creator to update status', async () => {
      await expect(
        service.updateActionStatus(
          testAction.id,
          'coach2', // Not creator or assigned
          ActionStatus.IN_PROGRESS
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should track status history', async () => {
      // Update to in progress
      await service.updateActionStatus(
        testAction.id,
        'player1',
        ActionStatus.IN_PROGRESS
      );

      // Update to completed
      const completed = await service.updateActionStatus(
        testAction.id,
        'player1',
        ActionStatus.COMPLETED
      );

      expect(completed.metadata?.status_updates).toHaveLength(2);
    });
  });

  describe('getDiscussions', () => {
    beforeEach(async () => {
      // Create various discussions
      await service.createDiscussion('coach1', {
        title: 'Review 1',
        type: DiscussionType.PERFORMANCE_REVIEW,
        player_id: 'player1',
        scheduled_date: new Date(),
        participant_ids: ['coach1', 'player1'],
      });

      await service.createDiscussion('coach1', {
        title: 'Goals 1',
        type: DiscussionType.GOAL_SETTING,
        player_id: 'player1',
        scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        participant_ids: ['coach1', 'player1', 'parent1'],
      });

      const completed = await service.createDiscussion('coach1', {
        title: 'Completed Review',
        type: DiscussionType.PERFORMANCE_REVIEW,
        player_id: 'player2',
        scheduled_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        participant_ids: ['coach1', 'player2'],
      });
      
      await service.startDiscussion(completed.id, 'coach1');
      await service.completeDiscussion(completed.id, 'coach1', { summary: 'Done' });
    });

    it('should get discussions for coach', async () => {
      const discussions = await service.getDiscussions('coach1', {});

      expect(discussions.data.length).toBeGreaterThanOrEqual(3);
      discussions.data.forEach(d => {
        expect(d.participants.some(p => p.user_id === 'coach1')).toBe(true);
      });
    });

    it('should filter by player', async () => {
      const discussions = await service.getDiscussions('coach1', {
        player_id: 'player1',
      });

      expect(discussions.data).toHaveLength(2);
      discussions.data.forEach(d => {
        expect(d.player_id).toBe('player1');
      });
    });

    it('should filter by type', async () => {
      const discussions = await service.getDiscussions('coach1', {
        type: DiscussionType.PERFORMANCE_REVIEW,
      });

      expect(discussions.data).toHaveLength(2);
      discussions.data.forEach(d => {
        expect(d.type).toBe(DiscussionType.PERFORMANCE_REVIEW);
      });
    });

    it('should filter by status', async () => {
      const discussions = await service.getDiscussions('coach1', {
        status: DiscussionStatus.COMPLETED,
      });

      expect(discussions.data).toHaveLength(1);
      expect(discussions.data[0].status).toBe(DiscussionStatus.COMPLETED);
    });

    it('should paginate results', async () => {
      const page1 = await service.getDiscussions('coach1', {
        page: 1,
        limit: 2,
      });

      expect(page1.data).toHaveLength(2);
      expect(page1.pagination.total).toBeGreaterThanOrEqual(3);

      const page2 = await service.getDiscussions('coach1', {
        page: 2,
        limit: 2,
      });

      expect(page2.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Templates', () => {
    it('should create discussion template', async () => {
      const templateData = {
        name: 'Quarterly Performance Review Template',
        category: TemplateCategory.PERFORMANCE_REVIEW,
        description: 'Standard template for quarterly reviews',
        content: {
          agenda: [
            'Review last quarter performance',
            'Discuss strengths and improvements',
            'Set goals for next quarter',
          ],
          questions: [
            'What were your biggest achievements?',
            'What challenges did you face?',
            'What support do you need?',
          ],
          action_items: [
            { title: 'Create development plan', default_assignee: 'coach' },
            { title: 'Schedule follow-up sessions', default_assignee: 'coach' },
          ],
        },
        tags: ['quarterly', 'review', 'standard'],
      };

      const template = await service.createTemplate('coach1', templateData);

      expect(template).toBeDefined();
      expect(template.name).toBe(templateData.name);
      expect(template.category).toBe(templateData.category);
      expect(template.created_by).toBe('coach1');
      expect(template.is_active).toBe(true);
    });

    it('should get templates by category', async () => {
      // Create templates
      await service.createTemplate('coach1', {
        name: 'Review Template 1',
        category: TemplateCategory.PERFORMANCE_REVIEW,
        content: { agenda: ['Item 1'] },
      });

      await service.createTemplate('coach1', {
        name: 'Goal Template 1',
        category: TemplateCategory.GOAL_SETTING,
        content: { agenda: ['Goal 1'] },
      });

      const templates = await service.getTemplates({
        category: TemplateCategory.PERFORMANCE_REVIEW,
      });

      expect(templates.data.length).toBeGreaterThanOrEqual(1);
      templates.data.forEach(t => {
        expect(t.category).toBe(TemplateCategory.PERFORMANCE_REVIEW);
      });
    });

    it('should create discussion from template', async () => {
      const template = await service.createTemplate('coach1', {
        name: 'Quick Check-in Template',
        category: TemplateCategory.PROGRESS_CHECK,
        content: {
          agenda: ['Current progress', 'Blockers', 'Next steps'],
          default_duration: 30,
        },
      });

      const discussion = await service.createDiscussionFromTemplate(
        'coach1',
        template.id,
        {
          player_id: 'player1',
          scheduled_date: new Date(),
          participant_ids: ['coach1', 'player1'],
        }
      );

      expect(discussion).toBeDefined();
      expect(discussion.title).toContain('Quick Check-in');
      expect(discussion.agenda).toEqual(['Current progress', 'Blockers', 'Next steps']);
      expect(discussion.metadata?.template_id).toBe(template.id);
    });
  });

  describe('getDiscussionStats', () => {
    beforeEach(async () => {
      // Create discussions with different statuses
      const scheduled = await service.createDiscussion('coach1', {
        title: 'Scheduled',
        type: DiscussionType.PERFORMANCE_REVIEW,
        player_id: 'player1',
        scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        participant_ids: ['coach1', 'player1'],
      });

      const inProgress = await service.createDiscussion('coach1', {
        title: 'In Progress',
        type: DiscussionType.GOAL_SETTING,
        player_id: 'player1',
        scheduled_date: new Date(),
        participant_ids: ['coach1', 'player1'],
      });
      await service.startDiscussion(inProgress.id, 'coach1');

      const completed = await service.createDiscussion('coach1', {
        title: 'Completed',
        type: DiscussionType.PROGRESS_CHECK,
        player_id: 'player1',
        scheduled_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        participant_ids: ['coach1', 'player1'],
      });
      await service.startDiscussion(completed.id, 'coach1');
      await service.completeDiscussion(completed.id, 'coach1', { summary: 'Done' });

      // Add action items
      await service.addDiscussionAction(inProgress.id, 'coach1', {
        title: 'Action 1',
        assigned_to: 'player1',
        due_date: new Date(),
      });
    });

    it('should calculate discussion statistics', async () => {
      const stats = await service.getDiscussionStats('coach1', {
        player_id: 'player1',
      });

      expect(stats.total_discussions).toBe(3);
      expect(stats.by_status.scheduled).toBe(1);
      expect(stats.by_status.in_progress).toBe(1);
      expect(stats.by_status.completed).toBe(1);
      expect(stats.by_type[DiscussionType.PERFORMANCE_REVIEW]).toBe(1);
      expect(stats.by_type[DiscussionType.GOAL_SETTING]).toBe(1);
      expect(stats.by_type[DiscussionType.PROGRESS_CHECK]).toBe(1);
      expect(stats.total_actions).toBe(1);
      expect(stats.completion_rate).toBeCloseTo(0.33, 2);
    });

    it('should calculate average duration for completed discussions', async () => {
      const stats = await service.getDiscussionStats('coach1', {
        player_id: 'player1',
      });

      expect(stats.average_duration).toBeDefined();
      expect(stats.average_duration).toBeGreaterThan(0);
    });
  });
});