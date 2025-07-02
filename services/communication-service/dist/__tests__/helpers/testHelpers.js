"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expectSocketEvent = exports.createTestPresence = exports.createTestMessage = exports.createTestConversation = exports.createTestUser = exports.generateTestToken = void 0;
const uuid_1 = require("uuid");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const entities_1 = require("../../entities");
const testDatabase_1 = require("../setup/testDatabase");
function generateTestToken(userId, email = 'test@example.com') {
    return jsonwebtoken_1.default.sign({
        sub: userId,
        email,
        organizationId: 'test-org-id',
        roles: ['user'],
    }, process.env.JWT_SECRET || 'test-secret-key', { expiresIn: '1h' });
}
exports.generateTestToken = generateTestToken;
async function createTestUser(overrides) {
    const userId = (0, uuid_1.v4)();
    const user = {
        id: userId,
        email: `user-${userId}@example.com`,
        name: `Test User ${userId}`,
        organizationId: 'test-org-id',
        ...overrides,
    };
    return user;
}
exports.createTestUser = createTestUser;
async function createTestConversation(createdBy, participantIds, type = entities_1.ConversationType.GROUP) {
    const conversationRepo = testDatabase_1.TestDataSource.getRepository(entities_1.Conversation);
    const participantRepo = testDatabase_1.TestDataSource.getRepository(entities_1.ConversationParticipant);
    const conversation = conversationRepo.create({
        type,
        name: type === entities_1.ConversationType.GROUP ? 'Test Conversation' : undefined,
        created_by: createdBy,
    });
    await conversationRepo.save(conversation);
    // Add participants
    const participants = participantIds.map((userId, index) => {
        return participantRepo.create({
            conversation_id: conversation.id,
            user_id: userId,
            role: index === 0 ? entities_1.ParticipantRole.ADMIN : entities_1.ParticipantRole.MEMBER,
        });
    });
    await participantRepo.save(participants);
    conversation.participants = participants;
    return conversation;
}
exports.createTestConversation = createTestConversation;
async function createTestMessage(conversationId, senderId, content = 'Test message') {
    const messageRepo = testDatabase_1.TestDataSource.getRepository(entities_1.Message);
    const message = messageRepo.create({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        type: entities_1.MessageType.TEXT,
    });
    await messageRepo.save(message);
    return message;
}
exports.createTestMessage = createTestMessage;
async function createTestPresence(userId, status = entities_1.PresenceStatus.ONLINE) {
    const presenceRepo = testDatabase_1.TestDataSource.getRepository(entities_1.UserPresence);
    const presence = presenceRepo.create({
        user_id: userId,
        status,
    });
    await presenceRepo.save(presence);
    return presence;
}
exports.createTestPresence = createTestPresence;
function expectSocketEvent(socket, eventName, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Timeout waiting for event: ${eventName}`));
        }, timeout);
        socket.once(eventName, (data) => {
            clearTimeout(timer);
            resolve(data);
        });
    });
}
exports.expectSocketEvent = expectSocketEvent;
//# sourceMappingURL=testHelpers.js.map