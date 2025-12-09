import request from 'supertest';
import express from 'express';
import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { 
  setupTestDatabase, 
  teardownTestDatabase, 
  clearDatabase, 
  TestDataSource 
} from '../setup/testDatabase';
import { 
  createTestUser, 
  createTestConversation,
  createTestMessage,
  generateTestToken,
  expectSocketEvent
} from '../helpers/testHelpers';
import { 
  Message,
  MessageType,
  ConversationType,
  ConversationParticipant,
  ParticipantRole
} from '../../entities';
import { AppDataSource } from '../../config/database';

// Import routes and middleware
import messageRoutes from '../../routes/messageRoutes';
import conversationRoutes from '../../routes/conversationRoutes';
import { createAuthMiddleware } from '@hockey-hub/shared-lib/middleware';

// Mock AppDataSource to use TestDataSource
jest.mock('../../config/database', () => ({
  AppDataSource: require('../setup/testDatabase').TestDataSource,
}));

describe('Chat API Integration Tests', () => {
  let app: express.Application;
  let httpServer: HttpServer;
  let io: SocketServer;
  let testUsers: any[] = [];
  let authTokens: { [key: string]: string } = {};

  beforeAll(async () => {
    await setupTestDatabase();

    // Create Express app
    app = express();
    app.use(express.json());
    
    // Apply authentication middleware
    const auth = createAuthMiddleware();
    app.use(auth.extractUser());
    app.use(auth.requireAuth());
    
    // Mount routes
    app.use('/api/conversations', conversationRoutes);
    app.use('/api/messages', messageRoutes);

    // Create HTTP server
    httpServer = app.listen(0); // Random port

    // Setup Socket.io
    io = new SocketServer(httpServer, {
      cors: { origin: '*' },
    });

    // Import and setup socket handlers
    const { setupSocketHandlers } = require('../../sockets/chatSocket');
    setupSocketHandlers(io);
    app.set('io', io);
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      try { io.close(() => resolve()); } catch { resolve(); }
    });
    await new Promise<void>((resolve) => {
      try { httpServer.close(() => resolve()); } catch { resolve(); }
    });
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Create test users
    testUsers = [
      await createTestUser({ id: 'user1', name: 'User 1', email: 'user1@test.com' }),
      await createTestUser({ id: 'user2', name: 'User 2', email: 'user2@test.com' }),
      await createTestUser({ id: 'user3', name: 'User 3', email: 'user3@test.com' }),
    ];

    // Generate auth tokens
    testUsers.forEach(user => {
      authTokens[user.id] = generateTestToken(user.id, user.email);
    });
  });

  describe('POST /api/conversations', () => {
    it('should create a new direct conversation', async () => {
      const response = await request(httpServer)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${authTokens.user1}`)
        .send({
          type: ConversationType.DIRECT,
          participant_ids: ['user1', 'user2'],
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        type: ConversationType.DIRECT,
        created_by: 'user1',
      });
      expect(response.body.data.participants).toHaveLength(2);
    });

    it('should create a new group conversation', async () => {
      const response = await request(httpServer)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${authTokens.user1}`)
        .send({
          type: ConversationType.GROUP,
          name: 'Test Group',
          description: 'A test group',
          participant_ids: ['user1', 'user2', 'user3'],
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        type: ConversationType.GROUP,
        name: 'Test Group',
        created_by: 'user1',
      });
      expect(response.body.data.participants).toHaveLength(3);
    });

    it('should return 400 for invalid conversation data', async () => {
      const response = await request(httpServer)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${authTokens.user1}`)
        .send({
          type: ConversationType.DIRECT,
          participant_ids: ['user1'], // Missing second participant
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(httpServer)
        .post('/api/conversations')
        .send({
          type: ConversationType.DIRECT,
          participant_ids: ['user1', 'user2'],
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/conversations', () => {
    beforeEach(async () => {
      // Create test conversations
      await createTestConversation('user1', ['user1', 'user2'], ConversationType.DIRECT);
      await createTestConversation('user1', ['user1', 'user2', 'user3'], ConversationType.GROUP);
      await createTestConversation('user2', ['user2', 'user3'], ConversationType.DIRECT);
    });

    it('should return user conversations', async () => {
      const response = await request(httpServer)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${authTokens.user1}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((c: any) => 
        c.participants.some((p: any) => p.user_id === 'user1')
      )).toBe(true);
    });

    it('should filter conversations by type', async () => {
      const response = await request(httpServer)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${authTokens.user1}`)
        .query({ type: ConversationType.DIRECT });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].type).toBe(ConversationType.DIRECT);
    });

    it('should include archived conversations when requested', async () => {
      const conversation = await TestDataSource.getRepository('Conversation')
        .findOne({ where: { type: ConversationType.DIRECT } });
      if (!conversation) { throw new Error('No conversation found for archiving test'); }

      // Archive conversation for user1
      await TestDataSource.getRepository(ConversationParticipant).update(
        { conversation_id: conversation.id, user_id: 'user1' },
        { archived_at: new Date() }
      );

      const response = await request(httpServer)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${authTokens.user1}`)
        .query({ include_archived: true });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/conversations/:id', () => {
    let testConversation: any;

    beforeEach(async () => {
      testConversation = await createTestConversation('user1', ['user1', 'user2'], ConversationType.DIRECT);
    });

    it('should return conversation details for participant', async () => {
      const response = await request(httpServer)
        .get(`/api/conversations/${testConversation.id}`)
        .set('Authorization', `Bearer ${authTokens.user1}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(testConversation.id);
      expect(response.body.data.participants).toHaveLength(2);
    });

    it('should return 403 for non-participant', async () => {
      const response = await request(httpServer)
        .get(`/api/conversations/${testConversation.id}`)
        .set('Authorization', `Bearer ${authTokens.user3}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent conversation', async () => {
      const response = await request(httpServer)
        .get('/api/conversations/non-existent-id')
        .set('Authorization', `Bearer ${authTokens.user1}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/messages', () => {
    let testConversation: any;

    beforeEach(async () => {
      testConversation = await createTestConversation('user1', ['user1', 'user2'], ConversationType.DIRECT);
    });

    it('should send a text message', async () => {
      const response = await request(httpServer)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authTokens.user1}`)
        .send({
          conversation_id: testConversation.id,
          content: 'Hello, world!',
          type: MessageType.TEXT,
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        conversation_id: testConversation.id,
        sender_id: 'user1',
        content: 'Hello, world!',
        type: MessageType.TEXT,
      });
    });

    it('should send a message with attachments', async () => {
      const response = await request(httpServer)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authTokens.user1}`)
        .send({
          conversation_id: testConversation.id,
          content: 'Check this file',
          type: MessageType.FILE,
          attachments: [
            {
              file_url: 'https://example.com/file.pdf',
              file_name: 'document.pdf',
              file_size: 1024000,
              mime_type: 'application/pdf',
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe(MessageType.FILE);
      expect(response.body.data.attachments).toHaveLength(1);
    });

    it('should handle message with mentions', async () => {
      const response = await request(httpServer)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authTokens.user1}`)
        .send({
          conversation_id: testConversation.id,
          content: 'Hey @user2!',
          type: MessageType.TEXT,
          mentions: ['user2'],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.mentions).toBeDefined();
    });

    it('should return 403 for non-participant', async () => {
      const response = await request(httpServer)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authTokens.user3}`)
        .send({
          conversation_id: testConversation.id,
          content: 'I should not be able to send this',
          type: MessageType.TEXT,
        });

      expect(response.status).toBe(403);
    });

    it('should validate message content', async () => {
      const response = await request(httpServer)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authTokens.user1}`)
        .send({
          conversation_id: testConversation.id,
          content: '', // Empty content
          type: MessageType.TEXT,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/messages', () => {
    let testConversation: any;
    let testMessages: Message[] = [];

    beforeEach(async () => {
      testConversation = await createTestConversation('user1', ['user1', 'user2'], ConversationType.DIRECT);
      
      // Create test messages
      for (let i = 0; i < 15; i++) {
        const msg = await createTestMessage(
          testConversation.id,
          i % 2 === 0 ? 'user1' : 'user2',
          `Message ${i}`
        );
        testMessages.push(msg);
      }
    });

    it('should retrieve paginated messages', async () => {
      const response = await request(httpServer)
        .get('/api/messages')
        .set('Authorization', `Bearer ${authTokens.user1}`)
        .query({
          conversation_id: testConversation.id,
          page: 1,
          limit: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 15,
        totalPages: 2,
      });
    });

    it('should retrieve messages before a specific message', async () => {
      const middleMessage = testMessages[7];
      
      const response = await request(httpServer)
        .get('/api/messages')
        .set('Authorization', `Bearer ${authTokens.user1}`)
        .query({
          conversation_id: testConversation.id,
          before_id: middleMessage.id,
          limit: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(5);
      response.body.data.forEach((msg: any) => {
        // Support both snake_case and camelCase in tests
        const created = (msg as any).created_at || (msg as any).createdAt;
        expect(new Date(created).getTime()).toBeLessThan(
          new Date((middleMessage as any).created_at || (middleMessage as any).createdAt).getTime()
        );
      });
    });

    it('should include read status in messages', async () => {
      const response = await request(httpServer)
        .get('/api/messages')
        .set('Authorization', `Bearer ${authTokens.user1}`)
        .query({
          conversation_id: testConversation.id,
          limit: 5,
        });

      expect(response.status).toBe(200);
      response.body.data.forEach((msg: any) => {
        expect(msg).toHaveProperty('read_by');
        expect(Array.isArray(msg.read_by)).toBe(true);
      });
    });

    it('should return 403 for non-participant', async () => {
      const response = await request(httpServer)
        .get('/api/messages')
        .set('Authorization', `Bearer ${authTokens.user3}`)
        .query({
          conversation_id: testConversation.id,
        });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/messages/:id', () => {
    let testConversation: any;
    let testMessage: Message;

    beforeEach(async () => {
      testConversation = await createTestConversation('user1', ['user1', 'user2'], ConversationType.DIRECT);
      testMessage = await createTestMessage(testConversation.id, 'user1', 'Original message');
    });

    it('should update message content', async () => {
      const response = await request(httpServer)
        .put(`/api/messages/${testMessage.id}`)
        .set('Authorization', `Bearer ${authTokens.user1}`)
        .send({
          content: 'Updated message',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.content).toBe('Updated message');
      expect(response.body.data.edited_at).toBeDefined();
      expect(response.body.data.edited_by).toBe('user1');
    });

    it('should return 403 when non-sender tries to update', async () => {
      const response = await request(httpServer)
        .put(`/api/messages/${testMessage.id}`)
        .set('Authorization', `Bearer ${authTokens.user2}`)
        .send({
          content: 'Hacked message',
        });

      expect(response.status).toBe(403);
    });

    it('should validate updated content', async () => {
      const response = await request(httpServer)
        .put(`/api/messages/${testMessage.id}`)
        .set('Authorization', `Bearer ${authTokens.user1}`)
        .send({
          content: '', // Empty content
        });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/messages/:id', () => {
    let testConversation: any;
    let testMessage: Message;

    beforeEach(async () => {
      testConversation = await createTestConversation('user1', ['user1', 'user2', 'user3'], ConversationType.GROUP);
      testMessage = await createTestMessage(testConversation.id, 'user2', 'Message to delete');
    });

    it('should delete own message', async () => {
      const response = await request(httpServer)
        .delete(`/api/messages/${testMessage.id}`)
        .set('Authorization', `Bearer ${authTokens.user2}`);

      expect(response.status).toBe(204);
      
      // Verify soft delete
      const deletedMessage = await TestDataSource.getRepository(Message)
        .findOne({ 
          where: { id: testMessage.id },
          withDeleted: true 
        });
      expect(deletedMessage?.deleted_at).toBeDefined();
    });

    it('should allow admin to delete any message', async () => {
      const response = await request(httpServer)
        .delete(`/api/messages/${testMessage.id}`)
        .set('Authorization', `Bearer ${authTokens.user1}`); // user1 is admin

      expect(response.status).toBe(204);
    });

    it('should return 403 for non-admin deleting others message', async () => {
      const response = await request(httpServer)
        .delete(`/api/messages/${testMessage.id}`)
        .set('Authorization', `Bearer ${authTokens.user3}`); // user3 is not admin

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/messages/:id/reactions', () => {
    let testConversation: any;
    let testMessage: Message;

    beforeEach(async () => {
      testConversation = await createTestConversation('user1', ['user1', 'user2'], ConversationType.DIRECT);
      testMessage = await createTestMessage(testConversation.id, 'user1', 'React to this!');
    });

    it('should add reaction to message', async () => {
      const response = await request(app)
        .post(`/api/messages/${testMessage.id}/reactions`)
        .set('Authorization', `Bearer ${authTokens.user2}`)
        .send({
          emoji: '👍',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        message_id: testMessage.id,
        user_id: 'user2',
        emoji: '👍',
      });
    });

    it('should return 409 for duplicate reaction', async () => {
      // Add first reaction
      await request(httpServer)
        .post(`/api/messages/${testMessage.id}/reactions`)
        .set('Authorization', `Bearer ${authTokens.user2}`)
        .send({ emoji: '👍' });

      // Try to add same reaction again
      const response = await request(app)
        .post(`/api/messages/${testMessage.id}/reactions`)
        .set('Authorization', `Bearer ${authTokens.user2}`)
        .send({ emoji: '👍' });

      expect(response.status).toBe(409);
    });

    it('should validate emoji format', async () => {
      const response = await request(app)
        .post(`/api/messages/${testMessage.id}/reactions`)
        .set('Authorization', `Bearer ${authTokens.user2}`)
        .send({
          emoji: 'not-an-emoji',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/messages/:id/reactions/:emoji', () => {
    let testConversation: any;
    let testMessage: Message;

    beforeEach(async () => {
      testConversation = await createTestConversation('user1', ['user1', 'user2'], ConversationType.DIRECT);
      testMessage = await createTestMessage(testConversation.id, 'user1', 'React to this!');
      
      // Add a reaction
      await request(httpServer)
        .post(`/api/messages/${testMessage.id}/reactions`)
        .set('Authorization', `Bearer ${authTokens.user2}`)
        .send({ emoji: '👍' });
    });

    it('should remove own reaction', async () => {
      const response = await request(httpServer)
        .delete(`/api/messages/${testMessage.id}/reactions/👍`)
        .set('Authorization', `Bearer ${authTokens.user2}`);

      expect(response.status).toBe(204);
    });

    it('should return 404 when removing non-existent reaction', async () => {
      const response = await request(httpServer)
        .delete(`/api/messages/${testMessage.id}/reactions/❤️`)
        .set('Authorization', `Bearer ${authTokens.user2}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/messages/read', () => {
    let testConversation: any;
    let testMessages: Message[] = [];

    beforeEach(async () => {
      testConversation = await createTestConversation('user1', ['user1', 'user2'], ConversationType.DIRECT);
      
      // Create unread messages
      for (let i = 0; i < 5; i++) {
        const msg = await createTestMessage(testConversation.id, 'user2', `Unread ${i}`);
        testMessages.push(msg);
      }
    });

    it('should mark messages as read', async () => {
      const messageIds = testMessages.map(m => m.id);
      
      const response = await request(httpServer)
        .post('/api/messages/read')
        .set('Authorization', `Bearer ${authTokens.user1}`)
        .send({
          message_ids: messageIds,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.marked_count).toBe(5);
    });

    it('should validate message_ids array', async () => {
      const response = await request(httpServer)
        .post('/api/messages/read')
        .set('Authorization', `Bearer ${authTokens.user1}`)
        .send({
          message_ids: 'not-an-array',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/messages/search', () => {
    beforeEach(async () => {
      const conv1 = await createTestConversation('user1', ['user1', 'user2'], ConversationType.DIRECT);
      const conv2 = await createTestConversation('user1', ['user1', 'user2', 'user3'], ConversationType.GROUP);
      
      await createTestMessage(conv1.id, 'user1', 'Hello world from conv1');
      await createTestMessage(conv1.id, 'user2', 'Goodbye world from conv1');
      await createTestMessage(conv2.id, 'user1', 'Hello world from conv2');
      await createTestMessage(conv2.id, 'user3', 'Another message without the word');
    });

    it('should search messages across conversations', async () => {
      const response = await request(httpServer)
        .get('/api/messages/search')
        .set('Authorization', `Bearer ${authTokens.user1}`)
        .query({
          q: 'world',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
      response.body.data.forEach((msg: any) => {
        expect(msg.content.toLowerCase()).toContain('world');
      });
    });

    it('should filter search by conversation', async () => {
      const conv = await TestDataSource.getRepository('Conversation')
        .findOne({ where: { type: ConversationType.DIRECT } });
      if (!conv) { throw new Error('No conversation found for filter test'); }
      const response = await request(httpServer)
        .get('/api/messages/search')
        .set('Authorization', `Bearer ${authTokens.user1}`)
        .query({
          q: 'world',
          conversation_id: conv.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach((msg: any) => {
        expect(msg.conversation_id).toBe(conv.id);
      });
    });

    it('should require search query', async () => {
      const response = await request(httpServer)
        .get('/api/messages/search')
        .set('Authorization', `Bearer ${authTokens.user1}`);

      expect(response.status).toBe(400);
    });
  });

  describe('WebSocket Integration', () => {
    let clientSocket1: ClientSocket;
    let clientSocket2: ClientSocket;
    let testConversation: any;
    const getSocketUrl = () => {
      const addr: any = httpServer && (httpServer.address && httpServer.address());
      const port = addr && addr.port ? addr.port : 0;
      return `http://localhost:${port}`;
    };

    beforeEach(async () => {
      testConversation = await createTestConversation('user1', ['user1', 'user2'], ConversationType.DIRECT);
    });

    afterEach(() => {
      if (clientSocket1) clientSocket1.disconnect();
      if (clientSocket2) clientSocket2.disconnect();
    });

    it('should handle real-time message delivery', async () => {
      // Connect both users
      clientSocket1 = ioClient(getSocketUrl(), {
        auth: { token: authTokens.user1 },
      });

      clientSocket2 = ioClient(getSocketUrl(), {
        auth: { token: authTokens.user2 },
      });

      // Wait for both to connect
      await Promise.all([
        new Promise<void>((resolve) => clientSocket1.on('connect', () => resolve())),
        new Promise<void>((resolve) => clientSocket2.on('connect', () => resolve())),
      ]);

      // Join conversation room
      clientSocket1.emit('join_conversation', { conversation_id: testConversation.id });
      clientSocket2.emit('join_conversation', { conversation_id: testConversation.id });

      // Set up listener for new message
      await new Promise<void>((resolve) => {
        clientSocket2.on('new_message', (data) => {
          expect(data.message).toMatchObject({
            conversation_id: testConversation.id,
            sender_id: 'user1',
            content: 'Real-time message',
          });
          resolve();
        });
      });

      // Send message via API
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authTokens.user1}`)
        .send({
          conversation_id: testConversation.id,
          content: 'Real-time message',
          type: MessageType.TEXT,
        });
    });

    it('should handle typing indicators', async () => {
      clientSocket1 = ioClient(getSocketUrl(), {
        auth: { token: authTokens.user1 },
      });

      clientSocket2 = ioClient(getSocketUrl(), {
        auth: { token: authTokens.user2 },
      });

      await Promise.all([
        new Promise<void>((resolve) => clientSocket1.on('connect', () => resolve())),
        new Promise<void>((resolve) => clientSocket2.on('connect', () => resolve())),
      ]);

      clientSocket1.emit('join_conversation', { conversation_id: testConversation.id });
      clientSocket2.emit('join_conversation', { conversation_id: testConversation.id });

      // Listen for typing event
      await new Promise<void>((resolve) => {
        clientSocket2.on('user_typing', (data) => {
          expect(data).toMatchObject({
            conversation_id: testConversation.id,
            user_id: 'user1',
            is_typing: true,
          });
          resolve();
        });
      });

      // Emit typing event
      clientSocket1.emit('typing', {
        conversation_id: testConversation.id,
        is_typing: true,
      });
    });

    it('should handle message read receipts', async () => {
      const message = await createTestMessage(testConversation.id, 'user1', 'Unread message');

      const socketUrl = getSocketUrl();
      clientSocket1 = ioClient(socketUrl, {
        auth: { token: authTokens.user1 },
      });

      clientSocket2 = ioClient(socketUrl, {
        auth: { token: authTokens.user2 },
      });

      await Promise.all([
        new Promise<void>((resolve) => clientSocket1.on('connect', () => resolve())),
        new Promise<void>((resolve) => clientSocket2.on('connect', () => resolve())),
      ]);

      clientSocket1.emit('join_conversation', { conversation_id: testConversation.id });

      // Listen for read receipt
      await new Promise<void>((resolve) => {
        clientSocket1.on('messages_read', (data) => {
          expect(data).toMatchObject({
            conversation_id: testConversation.id,
            user_id: 'user2',
            message_ids: [message.id],
          });
          resolve();
        });
      });

      // Mark message as read via API
      await request(app)
        .post('/api/messages/read')
        .set('Authorization', `Bearer ${authTokens.user2}`)
        .send({
          message_ids: [message.id],
        });
    });

    it('should handle presence updates', async () => {
      const socketUrl = getSocketUrl();
      clientSocket1 = ioClient(socketUrl, {
        auth: { token: authTokens.user1 },
      });

      clientSocket2 = ioClient(socketUrl, {
        auth: { token: authTokens.user2 },
      });

      await Promise.all([
        new Promise<void>((resolve) => clientSocket1.on('connect', () => resolve())),
        new Promise<void>((resolve) => clientSocket2.on('connect', () => resolve())),
      ]);

      // Listen for presence update
      await new Promise<void>((resolve) => {
        clientSocket1.on('presence_update', (data) => {
          expect(data).toMatchObject({
            user_id: 'user2',
            status: 'online',
          });
          resolve();
        });
      });

      // User2 updates presence
      clientSocket2.emit('update_presence', {
        status: 'online',
      });
    });
  });
});