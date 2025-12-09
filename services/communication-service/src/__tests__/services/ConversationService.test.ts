import { ConversationService } from '../../services/ConversationService';
import { 
  setupTestDatabase, 
  teardownTestDatabase, 
  clearDatabase, 
  TestDataSource 
} from '../setup/testDatabase';
import { 
  createTestUser, 
  createTestConversation,
  createTestMessage 
} from '../helpers/testHelpers';
import { 
  Conversation, 
  ConversationType, 
  ConversationParticipant,
  ParticipantRole,
  Message,
  MessageType
} from '../../entities';
import { NotFoundError, ConflictError, ForbiddenError } from '@hockey-hub/shared-lib';

describe('ConversationService', () => {
  let conversationService: ConversationService;
  let testUsers: any[] = [];

  beforeAll(async () => {
    await setupTestDatabase();
    conversationService = new ConversationService();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    // Create test users
    testUsers = [
      await createTestUser({ id: 'user1', name: 'User 1' }),
      await createTestUser({ id: 'user2', name: 'User 2' }),
      await createTestUser({ id: 'user3', name: 'User 3' }),
    ];
  });

  describe('createConversation', () => {
    it('should create a direct conversation between two users', async () => {
      const dto = {
        type: ConversationType.DIRECT,
        participant_ids: ['user1', 'user2'],
      };

      const conversation = await conversationService.createConversation('user1', dto);

      expect(conversation).toBeDefined();
      expect(conversation.type).toBe(ConversationType.DIRECT);
      expect(conversation.created_by).toBe('user1');
      
      // Check participants
      const participants = await TestDataSource.getRepository(ConversationParticipant)
        .find({ where: { conversation_id: conversation.id } });
      expect(participants).toHaveLength(2);
      expect(participants.map(p => p.user_id).sort()).toEqual(['user1', 'user2']);
    });

    it('should create a group conversation with multiple users', async () => {
      const dto = {
        type: ConversationType.GROUP,
        name: 'Test Group',
        description: 'A test group conversation',
        participant_ids: ['user1', 'user2', 'user3'],
      };

      const conversation = await conversationService.createConversation('user1', dto);

      expect(conversation).toBeDefined();
      expect(conversation.type).toBe(ConversationType.GROUP);
      expect(conversation.name).toBe('Test Group');
      expect(conversation.description).toBe('A test group conversation');
      expect(conversation.created_by).toBe('user1');

      // Check participants
      const participants = await TestDataSource.getRepository(ConversationParticipant)
        .find({ where: { conversation_id: conversation.id } });
      expect(participants).toHaveLength(3);
      
      // Creator should be admin
      const creator = participants.find(p => p.user_id === 'user1');
      expect(creator?.role).toBe(ParticipantRole.ADMIN);
    });

    it('should prevent duplicate direct conversations', async () => {
      const dto = {
        type: ConversationType.DIRECT,
        participant_ids: ['user1', 'user2'],
      };

      // Create first conversation
      await conversationService.createConversation('user1', dto);

      // Try to create duplicate
      await expect(
        conversationService.createConversation('user1', dto)
      ).rejects.toThrow(ConflictError);
    });

    it('should require exactly 2 participants for direct conversations', async () => {
      const dto = {
        type: ConversationType.DIRECT,
        participant_ids: ['user1', 'user2', 'user3'],
      };

      await expect(
        conversationService.createConversation('user1', dto)
      ).rejects.toThrow('Direct conversations must have exactly 2 participants');
    });

    it('should require at least 2 participants for group conversations', async () => {
      const dto = {
        type: ConversationType.GROUP,
        name: 'Test Group',
        participant_ids: ['user1'],
      };

      await expect(
        conversationService.createConversation('user1', dto)
      ).rejects.toThrow('Group conversations must have at least 2 participants');
    });

    it('should handle system messages in channel conversations', async () => {
      const dto = {
        type: ConversationType.CHANNEL,
        name: 'Team Channel',
        participant_ids: ['user1', 'user2'],
        metadata: { channel_type: 'team' },
      };

      const conversation = await conversationService.createConversation('user1', dto);

      expect(conversation.type).toBe(ConversationType.CHANNEL);
      expect(conversation.metadata).toEqual({ channel_type: 'team' });

      // Check for system message
      const messages = await TestDataSource.getRepository(Message)
        .find({ where: { conversation_id: conversation.id } });
      expect(messages).toHaveLength(1);
      expect(messages[0].type).toBe(MessageType.SYSTEM);
      expect(messages[0].content).toContain('created the channel');
    });
  });

  describe('getConversations', () => {
    beforeEach(async () => {
      // Create test conversations
      await createTestConversation('user1', ['user1', 'user2'], ConversationType.DIRECT);
      await createTestConversation('user1', ['user1', 'user2', 'user3'], ConversationType.GROUP);
      await createTestConversation('user2', ['user2', 'user3'], ConversationType.DIRECT);
    });

    it('should return conversations for a specific user', async () => {
      const conversations = await conversationService.getConversations({
        user_id: 'user1',
      });

      expect(conversations).toHaveLength(2);
      expect(conversations.every(c => 
        c.participants.some(p => p.user_id === 'user1')
      )).toBe(true);
    });

    it('should filter by conversation type', async () => {
      const directConvos = await conversationService.getConversations({
        user_id: 'user1',
        type: ConversationType.DIRECT,
      });

      expect(directConvos).toHaveLength(1);
      expect(directConvos[0].type).toBe(ConversationType.DIRECT);
    });

    it('should paginate results', async () => {
      const page1 = await conversationService.getConversations({
        user_id: 'user1',
        page: 1,
        limit: 1,
      });

      expect(page1).toHaveLength(1);

      const page2 = await conversationService.getConversations({
        user_id: 'user1',
        page: 2,
        limit: 1,
      });

      expect(page2).toHaveLength(1);
      expect(page2[0].id).not.toBe(page1[0].id);
    });

    it('should order by last message time', async () => {
      const conversations = await conversationService.getConversations({
        user_id: 'user1',
      });

      // Add message to second conversation
      await createTestMessage(conversations[1].id, 'user1', 'New message');

      const reorderedConvos = await conversationService.getConversations({
        user_id: 'user1',
      });

      expect(reorderedConvos[0].id).toBe(conversations[1].id);
    });

    it('should not include archived conversations by default', async () => {
      const conversation = await createTestConversation('user1', ['user1', 'user2'], ConversationType.DIRECT);
      
      // Archive the conversation
      await TestDataSource.getRepository(ConversationParticipant).update(
        { conversation_id: conversation.id, user_id: 'user1' },
        { archived_at: new Date() }
      );

      const conversations = await conversationService.getConversations({
        user_id: 'user1',
      });

      expect(conversations.find(c => c.id === conversation.id)).toBeUndefined();
    });

    it('should include archived conversations when requested', async () => {
      const conversation = await createTestConversation('user1', ['user1', 'user2'], ConversationType.DIRECT);
      
      // Archive the conversation
      await TestDataSource.getRepository(ConversationParticipant).update(
        { conversation_id: conversation.id, user_id: 'user1' },
        { archived_at: new Date() }
      );

      const conversations = await conversationService.getConversations({
        user_id: 'user1',
        include_archived: true,
      });

      expect(conversations.find(c => c.id === conversation.id)).toBeDefined();
    });
  });

  describe('getConversation', () => {
    it('should return conversation details for a participant', async () => {
      const conversation = await createTestConversation('user1', ['user1', 'user2'], ConversationType.DIRECT);

      const result = await conversationService.getConversation(conversation.id, 'user1');

      expect(result).toBeDefined();
      expect(result.id).toBe(conversation.id);
      expect(result.participants).toHaveLength(2);
    });

    it('should throw NotFoundError for non-existent conversation', async () => {
      await expect(
        conversationService.getConversation('non-existent-id', 'user1')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError for non-participant', async () => {
      const conversation = await createTestConversation('user1', ['user1', 'user2'], ConversationType.DIRECT);

      await expect(
        conversationService.getConversation(conversation.id, 'user3')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('updateConversation', () => {
    it('should update conversation details by admin', async () => {
      const conversation = await createTestConversation('user1', ['user1', 'user2', 'user3'], ConversationType.GROUP);

      const updated = await conversationService.updateConversation(
        conversation.id,
        'user1',
        {
          name: 'Updated Group Name',
          description: 'Updated description',
        }
      );

      expect(updated.name).toBe('Updated Group Name');
      expect(updated.description).toBe('Updated description');
    });

    it('should prevent non-admin from updating conversation', async () => {
      const conversation = await createTestConversation('user1', ['user1', 'user2', 'user3'], ConversationType.GROUP);

      await expect(
        conversationService.updateConversation(
          conversation.id,
          'user2', // non-admin participant
          { name: 'New Name' }
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should prevent updating direct conversations', async () => {
      const conversation = await createTestConversation('user1', ['user1', 'user2'], ConversationType.DIRECT);

      await expect(
        conversationService.updateConversation(
          conversation.id,
          'user1',
          { name: 'Cannot rename direct' }
        )
      ).rejects.toThrow('Cannot update direct conversations');
    });
  });

  describe('addParticipants', () => {
    it('should add new participants to group conversation', async () => {
      const conversation = await createTestConversation('user1', ['user1', 'user2'], ConversationType.GROUP);
      const newUser = await createTestUser({ id: 'user4', name: 'User 4' });

      await conversationService.addParticipants(
        conversation.id,
        'user1',
        ['user4']
      );

      const participants = await TestDataSource.getRepository(ConversationParticipant)
        .find({ where: { conversation_id: conversation.id } });
      
      expect(participants).toHaveLength(3);
      expect(participants.find(p => p.user_id === 'user4')).toBeDefined();
    });

    it('should prevent adding duplicate participants', async () => {
      const conversation = await createTestConversation('user1', ['user1', 'user2'], ConversationType.GROUP);

      await expect(
        conversationService.addParticipants(
          conversation.id,
          'user1',
          ['user2'] // Already a participant
        )
      ).rejects.toThrow('already in the conversation');
    });

    it('should prevent non-admin from adding participants', async () => {
      const conversation = await createTestConversation('user1', ['user1', 'user2', 'user3'], ConversationType.GROUP);

      await expect(
        conversationService.addParticipants(
          conversation.id,
          'user2', // non-admin
          ['user4']
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should create system message when participants are added', async () => {
      const conversation = await createTestConversation('user1', ['user1', 'user2'], ConversationType.GROUP);
      
      await conversationService.addParticipants(
        conversation.id,
        'user1',
        ['user3']
      );

      const messages = await TestDataSource.getRepository(Message)
        .find({ where: { conversation_id: conversation.id } });
      
      const systemMessage = messages.find(m => m.type === MessageType.SYSTEM);
      expect(systemMessage).toBeDefined();
      expect(systemMessage?.content).toContain('added');
    });
  });

  describe('removeParticipant', () => {
    it('should allow admin to remove participant', async () => {
      const conversation = await createTestConversation('user1', ['user1', 'user2', 'user3'], ConversationType.GROUP);

      await conversationService.removeParticipant(
        conversation.id,
        'user1',
        'user3'
      );

      const participants = await TestDataSource.getRepository(ConversationParticipant)
        .find({ where: { conversation_id: conversation.id } });
      
      expect(participants).toHaveLength(2);
      expect(participants.find(p => p.user_id === 'user3')).toBeUndefined();
    });

    it('should allow participant to leave conversation', async () => {
      const conversation = await createTestConversation('user1', ['user1', 'user2', 'user3'], ConversationType.GROUP);

      await conversationService.removeParticipant(
        conversation.id,
        'user2',
        'user2' // Removing self
      );

      const participants = await TestDataSource.getRepository(ConversationParticipant)
        .find({ where: { conversation_id: conversation.id } });
      
      expect(participants).toHaveLength(2);
      expect(participants.find(p => p.user_id === 'user2')).toBeUndefined();
    });

    it('should prevent non-admin from removing others', async () => {
      const conversation = await createTestConversation('user1', ['user1', 'user2', 'user3'], ConversationType.GROUP);

      await expect(
        conversationService.removeParticipant(
          conversation.id,
          'user2', // non-admin
          'user3' // trying to remove someone else
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should transfer admin role if last admin leaves', async () => {
      const conversation = await createTestConversation('user1', ['user1', 'user2', 'user3'], ConversationType.GROUP);

      await conversationService.removeParticipant(
        conversation.id,
        'user1',
        'user1' // Admin leaving
      );

      const participants = await TestDataSource.getRepository(ConversationParticipant)
        .find({ where: { conversation_id: conversation.id } });
      
      const newAdmin = participants.find(p => p.role === ParticipantRole.ADMIN);
      expect(newAdmin).toBeDefined();
      expect(newAdmin?.user_id).not.toBe('user1');
    });
  });

  describe('archiveConversation', () => {
    it('should archive conversation for user', async () => {
      const conversation = await createTestConversation('user1', ['user1', 'user2'], ConversationType.DIRECT);

      await conversationService.archiveConversation(conversation.id, 'user1');

      const participant = await TestDataSource.getRepository(ConversationParticipant)
        .findOne({ 
          where: { 
            conversation_id: conversation.id, 
            user_id: 'user1' 
          } 
        });
      
      expect(participant?.archived_at).toBeDefined();
    });

    it('should not affect other participants when archiving', async () => {
      const conversation = await createTestConversation('user1', ['user1', 'user2'], ConversationType.DIRECT);

      await conversationService.archiveConversation(conversation.id, 'user1');

      const otherParticipant = await TestDataSource.getRepository(ConversationParticipant)
        .findOne({ 
          where: { 
            conversation_id: conversation.id, 
            user_id: 'user2' 
          } 
        });
      
      expect(otherParticipant?.archived_at).toBeNull();
    });
  });

  describe('unarchiveConversation', () => {
    it('should unarchive conversation for user', async () => {
      const conversation = await createTestConversation('user1', ['user1', 'user2'], ConversationType.DIRECT);
      
      // Archive first
      await conversationService.archiveConversation(conversation.id, 'user1');
      
      // Then unarchive
      await conversationService.unarchiveConversation(conversation.id, 'user1');

      const participant = await TestDataSource.getRepository(ConversationParticipant)
        .findOne({ 
          where: { 
            conversation_id: conversation.id, 
            user_id: 'user1' 
          } 
        });
      
      expect(participant?.archived_at).toBeNull();
    });
  });

  describe('deleteConversation', () => {
    it('should soft delete conversation when all participants leave', async () => {
      const conversation = await createTestConversation('user1', ['user1', 'user2'], ConversationType.DIRECT);

      // Both users leave
      await conversationService.removeParticipant(conversation.id, 'user1', 'user1');
      await conversationService.removeParticipant(conversation.id, 'user2', 'user2');

      const deletedConversation = await TestDataSource.getRepository(Conversation)
        .findOne({ 
          where: { id: conversation.id },
          withDeleted: true 
        });
      
      expect(deletedConversation?.deleted_at).toBeDefined();
    });

    it('should allow admin to delete group conversation', async () => {
      const conversation = await createTestConversation('user1', ['user1', 'user2', 'user3'], ConversationType.GROUP);

      await conversationService.deleteConversation(conversation.id, 'user1');

      const deletedConversation = await TestDataSource.getRepository(Conversation)
        .findOne({ 
          where: { id: conversation.id },
          withDeleted: true 
        });
      
      expect(deletedConversation?.deleted_at).toBeDefined();
    });

    it('should prevent non-admin from deleting group conversation', async () => {
      const conversation = await createTestConversation('user1', ['user1', 'user2', 'user3'], ConversationType.GROUP);

      await expect(
        conversationService.deleteConversation(conversation.id, 'user2')
      ).rejects.toThrow(ForbiddenError);
    });
  });
});