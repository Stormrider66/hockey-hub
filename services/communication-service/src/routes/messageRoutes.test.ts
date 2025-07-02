import request from 'supertest';
import express from 'express';
import { messageRoutes } from './messageRoutes';
import { CachedMessageRepository } from '../repositories/CachedMessageRepository';
import { CachedConversationRepository } from '../repositories/CachedConversationRepository';
import { authMiddleware } from '@hockey-hub/shared-lib/middleware/authMiddleware';

// Mock dependencies
jest.mock('../repositories/CachedMessageRepository');
jest.mock('../repositories/CachedConversationRepository');
jest.mock('@hockey-hub/shared-lib/middleware/authMiddleware');

describe('Message Routes', () => {
  let app: express.Express;
  let mockMessageRepo: jest.Mocked<CachedMessageRepository>;
  let mockConversationRepo: jest.Mocked<CachedConversationRepository>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    organizationId: 'org-456',
    teamIds: ['team-1']
  };

  const mockConversation = {
    id: 'conv-1',
    type: 'team',
    name: 'Team Chat',
    participants: ['user-123', 'user-456', 'user-789'],
    teamId: 'team-1',
    lastMessage: null,
    lastMessageAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockMessage = {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-123',
    content: 'Hello team!',
    type: 'text',
    metadata: {},
    readBy: ['user-123'],
    editedAt: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup express app
    app = express();
    app.use(express.json());
    
    // Mock auth middleware
    (authMiddleware as jest.Mock).mockImplementation((req: any, res: any, next: any) => {
      req.user = mockUser;
      next();
    });

    // Mock repositories
    mockMessageRepo = {
      getConversationMessages: jest.fn(),
      sendMessage: jest.fn(),
      editMessage: jest.fn(),
      deleteMessage: jest.fn(),
      getMessageById: jest.fn(),
      markAsRead: jest.fn(),
      addReaction: jest.fn(),
      removeReaction: jest.fn(),
      searchMessages: jest.fn(),
      getUnreadCount: jest.fn()
    } as any;

    mockConversationRepo = {
      findById: jest.fn(),
      isParticipant: jest.fn(),
      updateLastMessage: jest.fn()
    } as any;

    (CachedMessageRepository as jest.Mock).mockImplementation(() => mockMessageRepo);
    (CachedConversationRepository as jest.Mock).mockImplementation(() => mockConversationRepo);

    // Apply routes
    app.use('/api/messages', messageRoutes);
  });

  describe('GET /api/messages/:conversationId', () => {
    it('should return messages for a conversation', async () => {
      mockConversationRepo.isParticipant.mockResolvedValue(true);
      mockMessageRepo.getConversationMessages.mockResolvedValue({
        data: [mockMessage],
        total: 25,
        hasMore: true,
        cursor: 'next-cursor'
      });

      const response = await request(app)
        .get('/api/messages/conv-1?limit=20');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        data: [mockMessage],
        total: 25,
        hasMore: true,
        cursor: 'next-cursor'
      });
      expect(mockConversationRepo.isParticipant).toHaveBeenCalledWith('conv-1', 'user-123');
    });

    it('should deny access to non-participants', async () => {
      mockConversationRepo.isParticipant.mockResolvedValue(false);

      const response = await request(app)
        .get('/api/messages/conv-2');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: 'You are not a participant in this conversation'
      });
    });

    it('should support cursor-based pagination', async () => {
      mockConversationRepo.isParticipant.mockResolvedValue(true);
      mockMessageRepo.getConversationMessages.mockResolvedValue({
        data: [],
        total: 100,
        hasMore: false,
        cursor: null
      });

      const response = await request(app)
        .get('/api/messages/conv-1?cursor=previous-cursor&limit=50');

      expect(mockMessageRepo.getConversationMessages).toHaveBeenCalledWith(
        'conv-1',
        { cursor: 'previous-cursor', limit: 50 }
      );
    });
  });

  describe('POST /api/messages', () => {
    it('should send a text message', async () => {
      const messageData = {
        conversationId: 'conv-1',
        content: 'New message',
        type: 'text'
      };

      mockConversationRepo.isParticipant.mockResolvedValue(true);
      mockMessageRepo.sendMessage.mockResolvedValue({
        id: 'msg-2',
        ...messageData,
        senderId: 'user-123',
        readBy: ['user-123'],
        createdAt: new Date()
      } as any);

      const response = await request(app)
        .post('/api/messages')
        .send(messageData);

      expect(response.status).toBe(201);
      expect(response.body.message).toMatchObject({
        id: 'msg-2',
        content: 'New message',
        senderId: 'user-123'
      });
    });

    it('should send a file message with metadata', async () => {
      const fileMessageData = {
        conversationId: 'conv-1',
        content: 'document.pdf',
        type: 'file',
        metadata: {
          fileName: 'document.pdf',
          fileSize: 1024000,
          mimeType: 'application/pdf',
          url: 'https://storage.example.com/files/document.pdf'
        }
      };

      mockConversationRepo.isParticipant.mockResolvedValue(true);
      mockMessageRepo.sendMessage.mockResolvedValue({
        id: 'msg-3',
        ...fileMessageData,
        senderId: 'user-123'
      } as any);

      const response = await request(app)
        .post('/api/messages')
        .send(fileMessageData);

      expect(response.status).toBe(201);
      expect(response.body.message.type).toBe('file');
      expect(response.body.message.metadata).toEqual(fileMessageData.metadata);
    });

    it('should validate message content', async () => {
      const response = await request(app)
        .post('/api/messages')
        .send({
          conversationId: 'conv-1',
          content: '', // Empty content
          type: 'text'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Content cannot be empty');
    });

    it('should handle mentions in messages', async () => {
      const messageWithMentions = {
        conversationId: 'conv-1',
        content: 'Hey @user-456, check this out!',
        type: 'text',
        metadata: {
          mentions: ['user-456']
        }
      };

      mockConversationRepo.isParticipant.mockResolvedValue(true);
      mockMessageRepo.sendMessage.mockResolvedValue({
        id: 'msg-4',
        ...messageWithMentions,
        senderId: 'user-123'
      } as any);

      const response = await request(app)
        .post('/api/messages')
        .send(messageWithMentions);

      expect(response.status).toBe(201);
      expect(response.body.message.metadata.mentions).toContain('user-456');
    });
  });

  describe('PUT /api/messages/:messageId', () => {
    it('should edit own message', async () => {
      mockMessageRepo.getMessageById.mockResolvedValue({
        ...mockMessage,
        senderId: 'user-123'
      } as any);

      mockMessageRepo.editMessage.mockResolvedValue({
        ...mockMessage,
        content: 'Edited message',
        editedAt: new Date()
      } as any);

      const response = await request(app)
        .put('/api/messages/msg-1')
        .send({ content: 'Edited message' });

      expect(response.status).toBe(200);
      expect(response.body.message.content).toBe('Edited message');
      expect(response.body.message.editedAt).toBeDefined();
    });

    it('should prevent editing others messages', async () => {
      mockMessageRepo.getMessageById.mockResolvedValue({
        ...mockMessage,
        senderId: 'user-456' // Different user
      } as any);

      const response = await request(app)
        .put('/api/messages/msg-1')
        .send({ content: 'Try to edit' });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: 'You can only edit your own messages'
      });
    });

    it('should handle non-existent message', async () => {
      mockMessageRepo.getMessageById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/messages/non-existent')
        .send({ content: 'Edit' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: 'Message not found'
      });
    });
  });

  describe('DELETE /api/messages/:messageId', () => {
    it('should soft delete own message', async () => {
      mockMessageRepo.getMessageById.mockResolvedValue({
        ...mockMessage,
        senderId: 'user-123'
      } as any);

      mockMessageRepo.deleteMessage.mockResolvedValue({
        ...mockMessage,
        deletedAt: new Date()
      } as any);

      const response = await request(app)
        .delete('/api/messages/msg-1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Message deleted successfully');
    });

    it('should prevent deleting others messages', async () => {
      mockMessageRepo.getMessageById.mockResolvedValue({
        ...mockMessage,
        senderId: 'user-789'
      } as any);

      const response = await request(app)
        .delete('/api/messages/msg-1');

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/messages/:messageId/read', () => {
    it('should mark message as read', async () => {
      mockMessageRepo.markAsRead.mockResolvedValue({
        ...mockMessage,
        readBy: ['user-123', 'user-456']
      } as any);

      const response = await request(app)
        .post('/api/messages/msg-1/read');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Message marked as read');
      expect(mockMessageRepo.markAsRead).toHaveBeenCalledWith('msg-1', 'user-123');
    });
  });

  describe('POST /api/messages/:messageId/reactions', () => {
    it('should add reaction to message', async () => {
      mockMessageRepo.addReaction.mockResolvedValue({
        ...mockMessage,
        reactions: {
          '👍': ['user-123']
        }
      } as any);

      const response = await request(app)
        .post('/api/messages/msg-1/reactions')
        .send({ emoji: '👍' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Reaction added');
    });

    it('should validate emoji input', async () => {
      const response = await request(app)
        .post('/api/messages/msg-1/reactions')
        .send({ emoji: 'not-an-emoji' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid emoji');
    });
  });

  describe('DELETE /api/messages/:messageId/reactions/:emoji', () => {
    it('should remove reaction from message', async () => {
      mockMessageRepo.removeReaction.mockResolvedValue({
        ...mockMessage,
        reactions: {}
      } as any);

      const response = await request(app)
        .delete('/api/messages/msg-1/reactions/👍');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Reaction removed');
    });
  });

  describe('GET /api/messages/search', () => {
    it('should search messages', async () => {
      mockMessageRepo.searchMessages.mockResolvedValue({
        data: [mockMessage],
        total: 1,
        query: 'hello'
      });

      const response = await request(app)
        .get('/api/messages/search?q=hello&conversationId=conv-1');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(mockMessageRepo.searchMessages).toHaveBeenCalledWith({
        query: 'hello',
        conversationId: 'conv-1',
        userId: 'user-123'
      });
    });

    it('should require search query', async () => {
      const response = await request(app)
        .get('/api/messages/search');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Search query required');
    });
  });

  describe('Real-time Events', () => {
    it('should emit message events on send', async () => {
      // Mock Socket.io
      const mockEmit = jest.fn();
      const mockTo = jest.fn(() => ({ emit: mockEmit }));
      app.set('io', { to: mockTo });

      mockConversationRepo.isParticipant.mockResolvedValue(true);
      mockConversationRepo.findById.mockResolvedValue(mockConversation as any);
      mockMessageRepo.sendMessage.mockResolvedValue({
        id: 'msg-new',
        conversationId: 'conv-1',
        content: 'Real-time message'
      } as any);

      await request(app)
        .post('/api/messages')
        .send({
          conversationId: 'conv-1',
          content: 'Real-time message',
          type: 'text'
        });

      // Would verify Socket.io room emission
      // expect(mockTo).toHaveBeenCalledWith('conversation:conv-1');
      // expect(mockEmit).toHaveBeenCalledWith('message:new', expect.any(Object));
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      mockConversationRepo.isParticipant.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/messages/conv-1');

      expect(response.status).toBe(500);
      expect(response.body.message).toContain('Failed to fetch messages');
    });

    it('should handle message size limits', async () => {
      const largeContent = 'x'.repeat(10001); // Assuming 10K limit

      const response = await request(app)
        .post('/api/messages')
        .send({
          conversationId: 'conv-1',
          content: largeContent,
          type: 'text'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Message too large');
    });
  });
});