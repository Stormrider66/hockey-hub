import { MessageService } from '../../services/MessageService';
import { MessageCacheService } from '../../services/MessageCacheService';
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
  Message,
  MessageType,
  MessageStatus,
  ConversationType,
  ConversationParticipant,
  MessageReaction,
  MessageReadStatus,
  MessageMention
} from '../../entities';
import { NotFoundError, ForbiddenError } from '@hockey-hub/shared-lib';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';

// Mock the cache service
jest.mock('../../services/MessageCacheService');

describe('MessageService', () => {
  let messageService: MessageService;
  let messageCacheService: jest.Mocked<MessageCacheService>;
  let testUsers: any[] = [];
  let testConversation: any;

  beforeAll(async () => {
    await setupTestDatabase();
    messageService = new MessageService();
    messageCacheService = MessageCacheService.prototype as jest.Mocked<MessageCacheService>;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
    
    // Create test users
    testUsers = [
      await createTestUser({ id: 'user1', name: 'User 1' }),
      await createTestUser({ id: 'user2', name: 'User 2' }),
      await createTestUser({ id: 'user3', name: 'User 3' }),
    ];
    
    // Create test conversation
    testConversation = await createTestConversation('user1', ['user1', 'user2', 'user3'], ConversationType.GROUP);
  });

  describe('sendMessage', () => {
    it('should create a text message successfully', async () => {
      const messageData = {
        conversation_id: testConversation.id,
        content: 'Hello, world!',
        type: MessageType.TEXT,
      };

      const message = await messageService.sendMessage('user1', messageData);

      expect(message).toBeDefined();
      expect(message.sender_id).toBe('user1');
      expect(message.conversation_id).toBe(testConversation.id);
      expect(message.content).toBe('Hello, world!');
      expect(message.type).toBe(MessageType.TEXT);
      expect(message.status).toBe(MessageStatus.SENT);
    });

    it('should handle message with attachments', async () => {
      const messageData = {
        conversation_id: testConversation.id,
        content: 'Check out this file',
        type: MessageType.FILE,
        attachments: [
          {
            file_url: 'https://example.com/file.pdf',
            file_name: 'document.pdf',
            file_size: 1024000,
            mime_type: 'application/pdf'
          }
        ],
      };

      const message = await messageService.sendMessage('user1', messageData);

      expect(message.type).toBe(MessageType.FILE);
      expect(message.attachments).toHaveLength(1);
      expect(message.attachments[0].file_name).toBe('document.pdf');
    });

    it('should handle message with mentions', async () => {
      const messageData = {
        conversation_id: testConversation.id,
        content: 'Hey @user2, check this out!',
        type: MessageType.TEXT,
        mentions: ['user2'],
      };

      const message = await messageService.sendMessage('user1', messageData);

      expect(message).toBeDefined();
      
      // Check mentions were created
      const mentions = await TestDataSource.getRepository(MessageMention)
        .find({ where: { message_id: message.id } });
      expect(mentions).toHaveLength(1);
      expect(mentions[0].user_id).toBe('user2');
    });

    it('should reject message from non-participant', async () => {
      const messageData = {
        conversation_id: testConversation.id,
        content: 'I should not be able to send this',
        type: MessageType.TEXT,
      };

      await expect(
        messageService.sendMessage('non-participant', messageData)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should handle reply to message', async () => {
      const originalMessage = await createTestMessage(testConversation.id, 'user1', 'Original message');
      
      const replyData = {
        conversation_id: testConversation.id,
        content: 'This is a reply',
        type: MessageType.TEXT,
        reply_to_id: originalMessage.id,
      };

      const reply = await messageService.sendMessage('user2', replyData);

      expect(reply.reply_to_id).toBe(originalMessage.id);
      expect(reply.reply_to).toBeDefined();
      expect(reply.reply_to?.content).toBe('Original message');
    });

    it('should validate message content length', async () => {
      const longContent = 'a'.repeat(5001); // Assuming 5000 char limit
      const messageData = {
        conversation_id: testConversation.id,
        content: longContent,
        type: MessageType.TEXT,
      };

      await expect(
        messageService.sendMessage('user1', messageData)
      ).rejects.toThrow('Message content is too long');
    });

    it('should handle forwarded messages', async () => {
      const originalMessage = await createTestMessage(testConversation.id, 'user1', 'Original message');
      
      const forwardData = {
        conversation_id: testConversation.id,
        content: 'Forwarded message',
        type: MessageType.TEXT,
        metadata: {
          forwarded_from: originalMessage.id,
          forwarded_at: new Date().toISOString(),
        },
      };

      const forwarded = await messageService.sendMessage('user2', forwardData);

      expect(forwarded.metadata?.forwarded_from).toBe(originalMessage.id);
    });

    it('should update conversation last_message_at', async () => {
      const messageData = {
        conversation_id: testConversation.id,
        content: 'New message',
        type: MessageType.TEXT,
      };

      const beforeTime = new Date();
      await messageService.sendMessage('user1', messageData);

      const conversation = await TestDataSource.getRepository('Conversation')
        .findOne({ where: { id: testConversation.id } });
      
      expect(conversation.last_message_at).toBeDefined();
      expect(new Date(conversation.last_message_at).getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });

    it('should invalidate cache after sending message', async () => {
      const messageData = {
        conversation_id: testConversation.id,
        content: 'Test message',
        type: MessageType.TEXT,
      };

      await messageService.sendMessage('user1', messageData);

      expect(messageCacheService.invalidateConversationCache).toHaveBeenCalledWith(testConversation.id);
    });
  });

  describe('getMessages', () => {
    beforeEach(async () => {
      // Create test messages
      for (let i = 0; i < 25; i++) {
        await createTestMessage(
          testConversation.id, 
          i % 2 === 0 ? 'user1' : 'user2', 
          `Message ${i}`
        );
      }
    });

    it('should retrieve messages with pagination', async () => {
      const messages = await messageService.getMessages(testConversation.id, 'user1', {
        limit: 10,
        page: 1,
      });

      expect(messages.data).toHaveLength(10);
      expect(messages.total).toBe(25);
      expect(messages.page).toBe(1);
      expect(messages.totalPages).toBe(3);
    });

    it('should retrieve messages before a specific message', async () => {
      const allMessages = await TestDataSource.getRepository(Message)
        .find({ 
          where: { conversation_id: testConversation.id },
          order: { created_at: 'DESC' },
          take: 15
        });

      const middleMessage = allMessages[10];
      
      const messages = await messageService.getMessages(testConversation.id, 'user1', {
        before_id: middleMessage.id,
        limit: 5,
      });

      expect(messages.data).toHaveLength(5);
      messages.data.forEach(msg => {
        expect(new Date(msg.created_at).getTime()).toBeLessThan(
          new Date(middleMessage.created_at).getTime()
        );
      });
    });

    it('should retrieve messages after a specific message', async () => {
      const allMessages = await TestDataSource.getRepository(Message)
        .find({ 
          where: { conversation_id: testConversation.id },
          order: { created_at: 'ASC' },
          take: 15
        });

      const middleMessage = allMessages[10];
      
      const messages = await messageService.getMessages(testConversation.id, 'user1', {
        after_id: middleMessage.id,
        limit: 5,
      });

      expect(messages.data).toHaveLength(5);
      messages.data.forEach(msg => {
        expect(new Date(msg.created_at).getTime()).toBeGreaterThan(
          new Date(middleMessage.created_at).getTime()
        );
      });
    });

    it('should include read status for messages', async () => {
      const messages = await messageService.getMessages(testConversation.id, 'user1', {
        limit: 5,
      });

      messages.data.forEach(msg => {
        expect(msg).toHaveProperty('read_by');
        expect(Array.isArray(msg.read_by)).toBe(true);
      });
    });

    it('should check cache before querying database', async () => {
      const cachedMessages = {
        data: [{ id: 'cached-msg', content: 'Cached message' }],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      messageCacheService.getCachedMessages.mockResolvedValueOnce(cachedMessages);

      const messages = await messageService.getMessages(testConversation.id, 'user1', {
        limit: 10,
      });

      expect(messageCacheService.getCachedMessages).toHaveBeenCalled();
      expect(messages).toEqual(cachedMessages);
    });

    it('should reject request from non-participant', async () => {
      await expect(
        messageService.getMessages(testConversation.id, 'non-participant', { limit: 10 })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('updateMessage', () => {
    let testMessage: Message;

    beforeEach(async () => {
      testMessage = await createTestMessage(testConversation.id, 'user1', 'Original content');
    });

    it('should update message content', async () => {
      const updatedMessage = await messageService.updateMessage(
        testMessage.id,
        'user1',
        { content: 'Updated content' }
      );

      expect(updatedMessage.content).toBe('Updated content');
      expect(updatedMessage.edited_at).toBeDefined();
      expect(updatedMessage.edited_by).toBe('user1');
    });

    it('should prevent updating message by non-sender', async () => {
      await expect(
        messageService.updateMessage(
          testMessage.id,
          'user2',
          { content: 'Hacked content' }
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should prevent updating message after edit time limit', async () => {
      // Set message created_at to 2 hours ago
      await TestDataSource.getRepository(Message).update(
        { id: testMessage.id },
        { created_at: new Date(Date.now() - 2 * 60 * 60 * 1000) }
      );

      await expect(
        messageService.updateMessage(
          testMessage.id,
          'user1',
          { content: 'Too late to edit' }
        )
      ).rejects.toThrow('Message can no longer be edited');
    });

    it('should maintain edit history', async () => {
      const originalContent = testMessage.content;
      
      await messageService.updateMessage(
        testMessage.id,
        'user1',
        { content: 'First edit' }
      );

      await messageService.updateMessage(
        testMessage.id,
        'user1',
        { content: 'Second edit' }
      );

      const updatedMessage = await TestDataSource.getRepository(Message)
        .findOne({ where: { id: testMessage.id } });

      expect(updatedMessage?.metadata?.edit_history).toBeDefined();
      expect(updatedMessage?.metadata?.edit_history).toHaveLength(2);
      expect(updatedMessage?.metadata?.edit_history[0].content).toBe(originalContent);
    });

    it('should invalidate cache after update', async () => {
      await messageService.updateMessage(
        testMessage.id,
        'user1',
        { content: 'Updated content' }
      );

      expect(messageCacheService.invalidateMessage).toHaveBeenCalledWith(testMessage.id);
      expect(messageCacheService.invalidateConversationCache).toHaveBeenCalledWith(testConversation.id);
    });
  });

  describe('deleteMessage', () => {
    let testMessage: Message;

    beforeEach(async () => {
      testMessage = await createTestMessage(testConversation.id, 'user1', 'To be deleted');
    });

    it('should soft delete message by sender', async () => {
      await messageService.deleteMessage(testMessage.id, 'user1');

      const deletedMessage = await TestDataSource.getRepository(Message)
        .findOne({ 
          where: { id: testMessage.id },
          withDeleted: true 
        });

      expect(deletedMessage?.deleted_at).toBeDefined();
      expect(deletedMessage?.deleted_by).toBe('user1');
    });

    it('should allow admin to delete any message', async () => {
      // user1 is admin of the conversation
      const otherUserMessage = await createTestMessage(testConversation.id, 'user2', 'User 2 message');

      await messageService.deleteMessage(otherUserMessage.id, 'user1');

      const deletedMessage = await TestDataSource.getRepository(Message)
        .findOne({ 
          where: { id: otherUserMessage.id },
          withDeleted: true 
        });

      expect(deletedMessage?.deleted_at).toBeDefined();
    });

    it('should prevent non-sender from deleting message', async () => {
      await expect(
        messageService.deleteMessage(testMessage.id, 'user2')
      ).rejects.toThrow(ForbiddenError);
    });

    it('should invalidate cache after deletion', async () => {
      await messageService.deleteMessage(testMessage.id, 'user1');

      expect(messageCacheService.invalidateMessage).toHaveBeenCalledWith(testMessage.id);
      expect(messageCacheService.invalidateConversationCache).toHaveBeenCalledWith(testConversation.id);
    });
  });

  describe('addReaction', () => {
    let testMessage: Message;

    beforeEach(async () => {
      testMessage = await createTestMessage(testConversation.id, 'user1', 'React to this!');
    });

    it('should add reaction to message', async () => {
      const reaction = await messageService.addReaction(testMessage.id, 'user2', '👍');

      expect(reaction).toBeDefined();
      expect(reaction.message_id).toBe(testMessage.id);
      expect(reaction.user_id).toBe('user2');
      expect(reaction.emoji).toBe('👍');
    });

    it('should prevent duplicate reactions from same user', async () => {
      await messageService.addReaction(testMessage.id, 'user2', '👍');

      await expect(
        messageService.addReaction(testMessage.id, 'user2', '👍')
      ).rejects.toThrow('already reacted');
    });

    it('should allow multiple different reactions from same user', async () => {
      await messageService.addReaction(testMessage.id, 'user2', '👍');
      const secondReaction = await messageService.addReaction(testMessage.id, 'user2', '❤️');

      expect(secondReaction.emoji).toBe('❤️');
    });

    it('should reject reaction from non-participant', async () => {
      await expect(
        messageService.addReaction(testMessage.id, 'non-participant', '👍')
      ).rejects.toThrow(ForbiddenError);
    });

    it('should validate emoji format', async () => {
      await expect(
        messageService.addReaction(testMessage.id, 'user2', 'not-an-emoji')
      ).rejects.toThrow('Invalid emoji');
    });
  });

  describe('removeReaction', () => {
    let testMessage: Message;
    let testReaction: MessageReaction;

    beforeEach(async () => {
      testMessage = await createTestMessage(testConversation.id, 'user1', 'React to this!');
      testReaction = await messageService.addReaction(testMessage.id, 'user2', '👍');
    });

    it('should remove own reaction', async () => {
      await messageService.removeReaction(testMessage.id, 'user2', '👍');

      const reaction = await TestDataSource.getRepository(MessageReaction)
        .findOne({ 
          where: { 
            message_id: testMessage.id,
            user_id: 'user2',
            emoji: '👍'
          } 
        });

      expect(reaction).toBeNull();
    });

    it('should prevent removing other user reaction', async () => {
      await expect(
        messageService.removeReaction(testMessage.id, 'user1', '👍')
      ).rejects.toThrow('not found');
    });
  });

  describe('markAsRead', () => {
    let testMessages: Message[] = [];

    beforeEach(async () => {
      // Create multiple unread messages
      for (let i = 0; i < 5; i++) {
        const msg = await createTestMessage(
          testConversation.id, 
          'user2', 
          `Unread message ${i}`
        );
        testMessages.push(msg);
      }
    });

    it('should mark messages as read', async () => {
      const messageIds = testMessages.map(m => m.id);
      
      await messageService.markAsRead(messageIds, 'user1');

      const readStatuses = await TestDataSource.getRepository(MessageReadStatus)
        .find({ 
          where: { 
            message_id: In(messageIds),
            user_id: 'user1'
          } 
        });

      expect(readStatuses).toHaveLength(5);
      readStatuses.forEach(status => {
        expect(status.read_at).toBeDefined();
      });
    });

    it('should not duplicate read status', async () => {
      const messageIds = testMessages.map(m => m.id);
      
      await messageService.markAsRead(messageIds, 'user1');
      await messageService.markAsRead(messageIds, 'user1'); // Mark again

      const readStatuses = await TestDataSource.getRepository(MessageReadStatus)
        .find({ 
          where: { 
            message_id: In(messageIds),
            user_id: 'user1'
          } 
        });

      expect(readStatuses).toHaveLength(5); // Should not duplicate
    });

    it('should update unread count in participant record', async () => {
      const messageIds = testMessages.map(m => m.id);
      
      await messageService.markAsRead(messageIds, 'user1');

      const participant = await TestDataSource.getRepository(ConversationParticipant)
        .findOne({ 
          where: { 
            conversation_id: testConversation.id,
            user_id: 'user1'
          } 
        });

      expect(participant?.unread_count).toBe(0);
    });
  });

  describe('searchMessages', () => {
    beforeEach(async () => {
      await createTestMessage(testConversation.id, 'user1', 'Hello world');
      await createTestMessage(testConversation.id, 'user2', 'Goodbye world');
      await createTestMessage(testConversation.id, 'user1', 'Testing search functionality');
      await createTestMessage(testConversation.id, 'user2', 'Another test message');
    });

    it('should search messages by query', async () => {
      const results = await messageService.searchMessages('user1', {
        query: 'world',
        conversation_id: testConversation.id,
      });

      expect(results.data).toHaveLength(2);
      results.data.forEach(msg => {
        expect(msg.content.toLowerCase()).toContain('world');
      });
    });

    it('should search across all user conversations', async () => {
      const anotherConvo = await createTestConversation('user1', ['user1', 'user3'], ConversationType.DIRECT);
      await createTestMessage(anotherConvo.id, 'user1', 'World in another conversation');

      const results = await messageService.searchMessages('user1', {
        query: 'world',
      });

      expect(results.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by message type', async () => {
      await TestDataSource.getRepository(Message).save({
        conversation_id: testConversation.id,
        sender_id: 'user1',
        content: 'world.pdf',
        type: MessageType.FILE,
        attachments: [{ file_name: 'world.pdf' }],
      });

      const results = await messageService.searchMessages('user1', {
        query: 'world',
        type: MessageType.FILE,
      });

      expect(results.data).toHaveLength(1);
      expect(results.data[0].type).toBe(MessageType.FILE);
    });

    it('should filter by date range', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const results = await messageService.searchMessages('user1', {
        query: 'world',
        from_date: yesterday.toISOString(),
        to_date: tomorrow.toISOString(),
      });

      expect(results.data.length).toBeGreaterThan(0);
    });

    it('should only search in conversations user is part of', async () => {
      const privateConvo = await createTestConversation('user2', ['user2', 'user3'], ConversationType.DIRECT);
      await createTestMessage(privateConvo.id, 'user2', 'Secret world message');

      const results = await messageService.searchMessages('user1', {
        query: 'world',
      });

      const privateMessage = results.data.find(m => m.content === 'Secret world message');
      expect(privateMessage).toBeUndefined();
    });
  });

  describe('getUnreadCount', () => {
    it('should return total unread count across all conversations', async () => {
      // Create messages in test conversation
      await createTestMessage(testConversation.id, 'user2', 'Unread 1');
      await createTestMessage(testConversation.id, 'user2', 'Unread 2');

      // Create another conversation with unread messages
      const anotherConvo = await createTestConversation('user2', ['user1', 'user2'], ConversationType.DIRECT);
      await createTestMessage(anotherConvo.id, 'user2', 'Unread 3');

      const unreadCount = await messageService.getUnreadCount('user1');

      expect(unreadCount).toBe(3);
    });

    it('should return 0 when all messages are read', async () => {
      const message = await createTestMessage(testConversation.id, 'user2', 'Read this');
      await messageService.markAsRead([message.id], 'user1');

      const unreadCount = await messageService.getUnreadCount('user1');

      expect(unreadCount).toBe(0);
    });
  });
});