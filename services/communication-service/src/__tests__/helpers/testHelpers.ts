import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { 
  Conversation, 
  ConversationType, 
  ConversationParticipant, 
  ParticipantRole,
  Message,
  MessageType,
  UserPresence,
  PresenceStatus
} from '../../entities';
import { TestDataSource } from '../setup/testDatabase';

export function generateTestToken(userId: string, email: string = 'test@example.com') {
  return jwt.sign(
    {
      sub: userId,
      email,
      organizationId: 'test-org-id',
      roles: ['user'],
    },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  );
}

export async function createTestUser(overrides?: Partial<any>) {
  const userId = uuidv4();
  const user = {
    id: userId,
    email: `user-${userId}@example.com`,
    name: `Test User ${userId}`,
    organizationId: 'test-org-id',
    ...overrides,
  };
  return user;
}

export async function createTestConversation(
  createdBy: string,
  participantIds: string[],
  type: ConversationType = ConversationType.GROUP
) {
  const conversationRepo = TestDataSource.getRepository(Conversation);
  const participantRepo = TestDataSource.getRepository(ConversationParticipant);
  
  const conversation = conversationRepo.create({
    type,
    name: type === ConversationType.GROUP ? 'Test Conversation' : undefined,
    created_by: createdBy,
  });
  
  await conversationRepo.save(conversation);
  
  // Add participants
  const participants = participantIds.map((userId, index) => {
    return participantRepo.create({
      conversation_id: conversation.id,
      user_id: userId,
      role: index === 0 ? ParticipantRole.ADMIN : ParticipantRole.MEMBER,
    });
  });
  
  await participantRepo.save(participants);
  
  conversation.participants = participants;
  return conversation;
}

export async function createTestMessage(
  conversationId: string,
  senderId: string,
  content: string = 'Test message'
) {
  const messageRepo = TestDataSource.getRepository(Message);
  
  const message = messageRepo.create({
    conversation_id: conversationId,
    sender_id: senderId,
    content,
    type: MessageType.TEXT,
  });
  
  await messageRepo.save(message);
  return message;
}

export async function createTestPresence(
  userId: string,
  status: PresenceStatus = PresenceStatus.ONLINE
) {
  const presenceRepo = TestDataSource.getRepository(UserPresence);
  
  const presence = presenceRepo.create({
    user_id: userId,
    status,
  });
  
  await presenceRepo.save(presence);
  return presence;
}

export function expectSocketEvent(socket: any, eventName: string, timeout: number = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${eventName}`));
    }, timeout);
    
    socket.once(eventName, (data: any) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}