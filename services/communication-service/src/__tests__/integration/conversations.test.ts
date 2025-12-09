import request from 'supertest';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { 
  setupTestDatabase, 
  teardownTestDatabase, 
  clearDatabase 
} from '../setup/testDatabase';
import { 
  generateTestToken, 
  createTestUser, 
  createTestConversation 
} from '../helpers/testHelpers';
import { conversationRoutes } from '../../routes';
import { errorHandler } from '@hockey-hub/shared-lib';
import { ConversationType } from '../../entities';

describe('Conversation Endpoints', () => {
  let app: express.Application;
  let testUserId: string;
  let testToken: string;
  
  beforeAll(async () => {
    await setupTestDatabase();
    
    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/conversations', conversationRoutes);
    app.use(errorHandler);
  });
  
  afterAll(async () => {
    await teardownTestDatabase();
  });
  
  beforeEach(async () => {
    await clearDatabase();
    
    // Create test user
    const user = await createTestUser();
    testUserId = user.id;
    testToken = generateTestToken(testUserId, user.email);
  });
  
  describe('POST /api/conversations', () => {
    it('should create a new group conversation', async () => {
      const otherUserId = uuidv4();
      
      const response = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          type: ConversationType.GROUP,
          name: 'Test Group',
          participant_ids: [testUserId, otherUserId],
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.type).toBe(ConversationType.GROUP);
      expect(response.body.data.name).toBe('Test Group');
      expect(response.body.data.participants).toHaveLength(2);
    });
    
    it('should create a direct conversation with exactly 2 participants', async () => {
      const otherUserId = uuidv4();
      
      const response = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          type: ConversationType.DIRECT,
          participant_ids: [testUserId, otherUserId],
        });
      
      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe(ConversationType.DIRECT);
      expect(response.body.data.participants).toHaveLength(2);
    });
    
    it('should return existing direct conversation if one exists', async () => {
      const otherUserId = uuidv4();
      
      // Create first direct conversation
      const response1 = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          type: ConversationType.DIRECT,
          participant_ids: [testUserId, otherUserId],
        });
      
      // Try to create another
      const response2 = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          type: ConversationType.DIRECT,
          participant_ids: [testUserId, otherUserId],
        });
      
      expect(response2.status).toBe(201);
      expect(response2.body.data.id).toBe(response1.body.data.id);
    });
    
    it('should fail if direct conversation has more than 2 participants', async () => {
      const response = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          type: ConversationType.DIRECT,
          participant_ids: [testUserId, uuidv4(), uuidv4()],
        });
      
      expect(response.status).toBe(409);
      expect(response.body.error).toBeTruthy();
    });
  });
  
  describe('GET /api/conversations', () => {
    it('should list user conversations', async () => {
      // Create some test conversations
      await createTestConversation(testUserId, [testUserId, uuidv4()]);
      await createTestConversation(testUserId, [testUserId, uuidv4(), uuidv4()]);
      
      const response = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${testToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toHaveProperty('total', 2);
    });
    
    it('should support pagination', async () => {
      // Create 25 conversations
      for (let i = 0; i < 25; i++) {
        await createTestConversation(testUserId, [testUserId, uuidv4()]);
      }
      
      const response = await request(app)
        .get('/api/conversations?page=2&limit=10')
        .set('Authorization', `Bearer ${testToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.total).toBe(25);
      expect(response.body.pagination.totalPages).toBe(3);
    });
    
    it('should filter by conversation type', async () => {
      await createTestConversation(testUserId, [testUserId, uuidv4()], ConversationType.DIRECT);
      await createTestConversation(testUserId, [testUserId, uuidv4()], ConversationType.GROUP);
      
      const response = await request(app)
        .get('/api/conversations?type=direct')
        .set('Authorization', `Bearer ${testToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].type).toBe(ConversationType.DIRECT);
    });
  });
  
  describe('GET /api/conversations/:id', () => {
    it('should get conversation details', async () => {
      const conversation = await createTestConversation(testUserId, [testUserId, uuidv4()]);
      
      const response = await request(app)
        .get(`/api/conversations/${conversation.id}`)
        .set('Authorization', `Bearer ${testToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(conversation.id);
      expect(response.body.data).toHaveProperty('participants');
      expect(response.body.data).toHaveProperty('unread_count');
    });
    
    it('should return 403 if user is not a participant', async () => {
      const otherUserId = uuidv4();
      const conversation = await createTestConversation(otherUserId, [otherUserId]);
      
      const response = await request(app)
        .get(`/api/conversations/${conversation.id}`)
        .set('Authorization', `Bearer ${testToken}`);
      
      expect(response.status).toBe(403);
    });
  });
  
  describe('PUT /api/conversations/:id', () => {
    it('should update conversation details if user is admin', async () => {
      const conversation = await createTestConversation(testUserId, [testUserId, uuidv4()]);
      
      const response = await request(app)
        .put(`/api/conversations/${conversation.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'Updated Name',
          description: 'Updated description',
        });
      
      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.description).toBe('Updated description');
    });
    
    it('should return 403 if user is not admin', async () => {
      const adminId = uuidv4();
      const conversation = await createTestConversation(adminId, [adminId, testUserId]);
      
      const response = await request(app)
        .put(`/api/conversations/${conversation.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'Should Fail',
        });
      
      expect(response.status).toBe(403);
    });
  });
  
  describe('POST /api/conversations/:id/participants', () => {
    it('should add participants to group conversation', async () => {
      const conversation = await createTestConversation(
        testUserId, 
        [testUserId], 
        ConversationType.GROUP
      );
      const newUserId = uuidv4();
      
      const response = await request(app)
        .post(`/api/conversations/${conversation.id}/participants`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          participant_ids: [newUserId],
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    it('should not add participants to direct conversation', async () => {
      const conversation = await createTestConversation(
        testUserId, 
        [testUserId, uuidv4()], 
        ConversationType.DIRECT
      );
      
      const response = await request(app)
        .post(`/api/conversations/${conversation.id}/participants`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          participant_ids: [uuidv4()],
        });
      
      expect(response.status).toBe(409);
    });
  });
  
  describe('DELETE /api/conversations/:id/participants/:userId', () => {
    it('should allow user to leave conversation', async () => {
      const conversation = await createTestConversation(
        testUserId, 
        [testUserId, uuidv4()], 
        ConversationType.GROUP
      );
      
      const response = await request(app)
        .delete(`/api/conversations/${conversation.id}/participants/${testUserId}`)
        .set('Authorization', `Bearer ${testToken}`);
      
      expect(response.status).toBe(200);
    });
    
    it('should allow admin to remove other participants', async () => {
      const otherUserId = uuidv4();
      const conversation = await createTestConversation(
        testUserId, 
        [testUserId, otherUserId], 
        ConversationType.GROUP
      );
      
      const response = await request(app)
        .delete(`/api/conversations/${conversation.id}/participants/${otherUserId}`)
        .set('Authorization', `Bearer ${testToken}`);
      
      expect(response.status).toBe(200);
    });
  });
  
  describe('PUT /api/conversations/:id/mute', () => {
    it('should mute conversation', async () => {
      const conversation = await createTestConversation(testUserId, [testUserId, uuidv4()]);
      
      const response = await request(app)
        .put(`/api/conversations/${conversation.id}/mute`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({});
      
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('muted');
    });
    
    it('should mute conversation until specific time', async () => {
      const conversation = await createTestConversation(testUserId, [testUserId, uuidv4()]);
      const until = new Date(Date.now() + 3600000); // 1 hour from now
      
      const response = await request(app)
        .put(`/api/conversations/${conversation.id}/mute`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ until });
      
      expect(response.status).toBe(200);
    });
  });
});