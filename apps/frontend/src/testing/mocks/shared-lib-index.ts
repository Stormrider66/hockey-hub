// Minimal mock for @hockey-hub/shared-lib enums used in chat tests
export const ConversationType = {
  DIRECT: 'direct',
  GROUP: 'group',
  CHANNEL: 'channel',
} as const;

export const MessageType = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system',
} as const;

export const MessageStatus = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
} as const;

export const PresenceStatus = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  AWAY: 'away',
} as const;

// Support both ESM and CJS consumers
export default {
  ConversationType,
  MessageType,
  MessageStatus,
  PresenceStatus,
} as any;
// CommonJS compatibility
// @ts-ignore
module.exports = Object.assign({}, {
  ConversationType,
  MessageType,
  MessageStatus,
  PresenceStatus,
}, { __esModule: true, default: { ConversationType, MessageType, MessageStatus, PresenceStatus } });




