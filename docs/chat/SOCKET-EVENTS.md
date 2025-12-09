# Hockey Hub Chat System - Socket Events Documentation

## Overview

The Hockey Hub chat system uses Socket.io for real-time messaging capabilities. The WebSocket connection is established through the API Gateway and provides bidirectional communication between clients and the server.

## Table of Contents

1. [Connection Setup](#connection-setup)
2. [Authentication](#authentication)
3. [Client-to-Server Events](#client-to-server-events)
4. [Server-to-Client Events](#server-to-client-events)
5. [Room Management](#room-management)
6. [Error Handling](#error-handling)
7. [Reconnection Strategy](#reconnection-strategy)
8. [Examples](#examples)

## Connection Setup

### Establishing Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: localStorage.getItem('access_token')
  },
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000
});
```

### Connection Events

```javascript
socket.on('connect', () => {
  console.log('Connected to chat server');
  console.log('Socket ID:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  // Reasons: 'io server disconnect', 'ping timeout', 'transport close'
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});
```

## Authentication

Authentication is handled via JWT tokens passed during connection:

```javascript
// Initial connection with auth
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Handling auth errors
socket.on('connect_error', (error) => {
  if (error.message === 'Authentication failed') {
    // Refresh token and reconnect
    refreshToken().then(newToken => {
      socket.auth.token = newToken;
      socket.connect();
    });
  }
});
```

## Client-to-Server Events

### Conversation Management

#### Join Conversation
```javascript
// Join a conversation room
socket.emit('conversation:join', conversationId);

// Response event
socket.on('conversation:joined', ({ conversationId, conversation }) => {
  console.log('Joined conversation:', conversationId);
});
```

#### Leave Conversation
```javascript
// Leave a conversation room
socket.emit('conversation:leave', conversationId);

// Response event
socket.on('conversation:left', ({ conversationId }) => {
  console.log('Left conversation:', conversationId);
});
```

#### Update Conversation
```javascript
// Update conversation details (admin only)
socket.emit('conversation:update', {
  conversationId: 'conv-123',
  updates: {
    name: 'New Group Name',
    description: 'Updated description'
  }
});
```

### Message Operations

#### Send Message
```javascript
// Send a text message
socket.emit('message:send', {
  conversationId: 'conv-123',
  content: 'Hello everyone!',
  type: 'text',
  replyToId: null, // Optional: ID of message being replied to
  attachments: []  // Optional: Array of attachment objects
});

// Send a voice message
socket.emit('message:send', {
  conversationId: 'conv-123',
  type: 'voice',
  metadata: {
    duration: 15000, // milliseconds
    waveform: [0.1, 0.3, 0.5, ...], // Audio waveform data
    base64Audio: 'data:audio/webm;base64,...' // Base64 encoded audio
  }
});
```

#### Edit Message
```javascript
// Edit an existing message
socket.emit('message:edit', {
  messageId: 'msg-456',
  content: 'Updated message content'
});
```

#### Delete Message
```javascript
// Delete a message (soft delete)
socket.emit('message:delete', messageId);
```

#### Mark Messages as Read
```javascript
// Mark multiple messages as read
socket.emit('message:read', [messageId1, messageId2, messageId3]);
```

### Reactions

#### Add Reaction
```javascript
// Add a reaction to a message
socket.emit('reaction:add', {
  messageId: 'msg-789',
  emoji: '👍'
});
```

#### Remove Reaction
```javascript
// Remove a reaction from a message
socket.emit('reaction:remove', {
  messageId: 'msg-789',
  emoji: '👍'
});
```

### Typing Indicators

#### Start Typing
```javascript
// Notify others that user is typing
socket.emit('typing:start', conversationId);
```

#### Stop Typing
```javascript
// Notify others that user stopped typing
socket.emit('typing:stop', conversationId);
```

### Presence Updates

#### Update Presence Status
```javascript
// Update user's presence status
socket.emit('presence:update', {
  status: 'online', // 'online' | 'away' | 'offline'
  statusMessage: 'In a meeting' // Optional
});
```

#### Send Heartbeat
```javascript
// Keep connection alive and maintain online status
socket.emit('presence:heartbeat');

// Typically sent every 30 seconds
setInterval(() => {
  socket.emit('presence:heartbeat');
}, 30000);
```

### Broadcast Operations

#### Mark Broadcast as Read
```javascript
// Mark a broadcast message as read
socket.emit('broadcast:read', broadcastId);

// Response event
socket.on('broadcast:read:success', ({ broadcastId }) => {
  console.log('Broadcast marked as read:', broadcastId);
});
```

#### Acknowledge Broadcast
```javascript
// Acknowledge receipt of important broadcast
socket.emit('broadcast:acknowledge', {
  broadcastId: 'broadcast-123',
  note: 'Understood, will comply' // Optional acknowledgment note
});

// Response event
socket.on('broadcast:acknowledge:success', ({ broadcastId }) => {
  console.log('Broadcast acknowledged:', broadcastId);
});
```

#### Get Unread Broadcast Count
```javascript
// Request unread broadcast count
socket.emit('broadcast:unread:count');

// Response event
socket.on('broadcast:unread:count:result', ({ unreadCount }) => {
  console.log('Unread broadcasts:', unreadCount);
});
```

## Server-to-Client Events

### Conversation Events

#### Conversation Updated
```javascript
// Received when conversation details change
socket.on('conversation:updated', ({ conversation }) => {
  // Update local conversation data
  updateConversation(conversation);
});
```

#### Participant Added
```javascript
// New participant added to conversation
socket.on('participant:added', ({ conversationId, participant }) => {
  console.log('New participant:', participant.user.name);
});
```

#### Participant Removed
```javascript
// Participant removed from conversation
socket.on('participant:removed', ({ conversationId, userId }) => {
  console.log('Participant removed:', userId);
});
```

### Message Events

#### New Message
```javascript
// Received when a new message is sent
socket.on('message:new', ({ conversationId, message }) => {
  // Add message to conversation
  addMessageToConversation(conversationId, message);
  
  // Show notification if conversation is not active
  if (activeConversationId !== conversationId) {
    showNotification(message);
  }
});
```

#### Message Updated
```javascript
// Received when a message is edited
socket.on('message:updated', ({ message }) => {
  // Update the message in UI
  updateMessage(message);
});
```

#### Message Deleted
```javascript
// Received when a message is deleted
socket.on('message:deleted', ({ messageId, conversationId }) => {
  // Remove or mark message as deleted in UI
  removeMessage(conversationId, messageId);
});
```

### Reaction Events

#### Reaction Added
```javascript
// Received when someone adds a reaction
socket.on('reaction:added', ({ messageId, userId, emoji }) => {
  // Update message reactions in UI
  addReactionToMessage(messageId, { userId, emoji });
});
```

#### Reaction Removed
```javascript
// Received when someone removes a reaction
socket.on('reaction:removed', ({ messageId, userId, emoji }) => {
  // Update message reactions in UI
  removeReactionFromMessage(messageId, userId, emoji);
});
```

### Typing Events

#### User Started Typing
```javascript
// Received when someone starts typing
socket.on('typing:start', ({ conversationId, userId }) => {
  // Show typing indicator
  showTypingIndicator(conversationId, userId);
});
```

#### User Stopped Typing
```javascript
// Received when someone stops typing
socket.on('typing:stop', ({ conversationId, userId }) => {
  // Hide typing indicator
  hideTypingIndicator(conversationId, userId);
});
```

### Presence Events

#### Presence Updated
```javascript
// Received when a user's presence changes
socket.on('presence:updated', ({ userId, status, statusMessage, lastSeenAt }) => {
  // Update user presence in UI
  updateUserPresence(userId, {
    status,
    statusMessage,
    lastSeenAt
  });
});
```

#### Conversation Presence
```javascript
// Initial presence data for conversation participants
socket.on('presence:conversation', ({ conversationId, presences }) => {
  // Update presence for all conversation participants
  presences.forEach(presence => {
    updateUserPresence(presence.userId, presence);
  });
});
```

### Read Receipt Events

#### Read Receipts Updated
```javascript
// Received when messages are marked as read
socket.on('read:receipts', ({ messageIds, userId, readAt }) => {
  // Update read receipts in UI
  messageIds.forEach(messageId => {
    addReadReceipt(messageId, { userId, readAt });
  });
});
```

### Error Events

#### General Error
```javascript
// Received when an error occurs
socket.on('error', ({ event, message }) => {
  console.error(`Error in ${event}:`, message);
  // Show error to user
  showErrorNotification(message);
});
```

## Room Management

The chat system uses Socket.io rooms to manage message distribution:

### Room Naming Convention
- Conversation rooms: `conversation:${conversationId}`
- User rooms: `user:${userId}` (for direct notifications)
- Team rooms: `team:${teamId}` (for team-wide broadcasts)
- Organization rooms: `org:${organizationId}` (for org-wide announcements)

### Automatic Room Management

```javascript
// When joining a conversation
socket.emit('conversation:join', conversationId);
// Server automatically adds socket to room: conversation:${conversationId}

// When leaving a conversation
socket.emit('conversation:leave', conversationId);
// Server automatically removes socket from room
```

## Error Handling

### Client-Side Error Handling

```javascript
// Global error handler
socket.on('error', ({ event, message, code }) => {
  switch (code) {
    case 'UNAUTHORIZED':
      // Handle unauthorized access
      redirectToLogin();
      break;
    case 'FORBIDDEN':
      // Handle permission errors
      showPermissionError();
      break;
    case 'NOT_FOUND':
      // Handle not found errors
      showNotFoundError();
      break;
    default:
      // Handle general errors
      showErrorNotification(message);
  }
});

// Event-specific error handling
socket.emit('message:send', messageData, (response) => {
  if (response.error) {
    console.error('Failed to send message:', response.error);
    // Retry or show error to user
  }
});
```

## Reconnection Strategy

### Automatic Reconnection

```javascript
const socket = io('http://localhost:3000', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5
});

// Handle reconnection events
socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  // Re-join active conversations
  rejoinConversations();
  // Update presence
  updatePresence();
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('Reconnection attempt', attemptNumber);
});

socket.on('reconnect_error', (error) => {
  console.error('Reconnection error:', error);
});

socket.on('reconnect_failed', () => {
  console.error('Failed to reconnect');
  // Show offline mode or retry manually
  showOfflineMode();
});
```

### Manual Reconnection

```javascript
// Force reconnection
function forceReconnect() {
  if (!socket.connected) {
    socket.connect();
  }
}

// Reconnect with new auth token
function reconnectWithNewToken(newToken) {
  socket.auth.token = newToken;
  socket.disconnect();
  socket.connect();
}
```

## Examples

### Complete Chat Implementation

```javascript
class ChatManager {
  constructor() {
    this.socket = null;
    this.activeConversationId = null;
    this.typingTimeout = null;
    this.initializeSocket();
  }

  initializeSocket() {
    this.socket = io('http://localhost:3000', {
      auth: {
        token: localStorage.getItem('access_token')
      },
      transports: ['websocket'],
      reconnection: true
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Connection events
    this.socket.on('connect', this.handleConnect.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
    this.socket.on('error', this.handleError.bind(this));

    // Message events
    this.socket.on('message:new', this.handleNewMessage.bind(this));
    this.socket.on('message:updated', this.handleMessageUpdate.bind(this));
    this.socket.on('message:deleted', this.handleMessageDelete.bind(this));

    // Typing events
    this.socket.on('typing:start', this.handleTypingStart.bind(this));
    this.socket.on('typing:stop', this.handleTypingStop.bind(this));

    // Presence events
    this.socket.on('presence:updated', this.handlePresenceUpdate.bind(this));
  }

  // Join a conversation
  joinConversation(conversationId) {
    this.activeConversationId = conversationId;
    this.socket.emit('conversation:join', conversationId);
  }

  // Send a message
  sendMessage(content, type = 'text', attachments = []) {
    if (!this.activeConversationId) {
      throw new Error('No active conversation');
    }

    this.socket.emit('message:send', {
      conversationId: this.activeConversationId,
      content,
      type,
      attachments
    });
  }

  // Handle typing with debounce
  handleTyping() {
    if (!this.activeConversationId) return;

    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Send typing start
    this.socket.emit('typing:start', this.activeConversationId);

    // Auto-stop after 3 seconds
    this.typingTimeout = setTimeout(() => {
      this.socket.emit('typing:stop', this.activeConversationId);
    }, 3000);
  }

  // Event handlers
  handleConnect() {
    console.log('Connected to chat server');
    // Update online presence
    this.socket.emit('presence:update', { status: 'online' });
    
    // Start heartbeat
    this.startHeartbeat();
  }

  handleDisconnect(reason) {
    console.log('Disconnected:', reason);
    this.stopHeartbeat();
  }

  handleError({ event, message }) {
    console.error(`Error in ${event}:`, message);
  }

  handleNewMessage({ conversationId, message }) {
    // Dispatch to Redux or update UI
    store.dispatch(addMessage({ conversationId, message }));
    
    // Show notification if not active conversation
    if (conversationId !== this.activeConversationId) {
      this.showNotification(message);
    }
  }

  handleMessageUpdate({ message }) {
    store.dispatch(updateMessage(message));
  }

  handleMessageDelete({ messageId, conversationId }) {
    store.dispatch(deleteMessage({ conversationId, messageId }));
  }

  handleTypingStart({ conversationId, userId }) {
    store.dispatch(setTyping({ conversationId, userId, isTyping: true }));
  }

  handleTypingStop({ conversationId, userId }) {
    store.dispatch(setTyping({ conversationId, userId, isTyping: false }));
  }

  handlePresenceUpdate({ userId, status, statusMessage, lastSeenAt }) {
    store.dispatch(updateUserPresence({
      userId,
      status,
      statusMessage,
      lastSeenAt
    }));
  }

  // Heartbeat management
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.socket.emit('presence:heartbeat');
    }, 30000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  // Cleanup
  disconnect() {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

// Usage
const chatManager = new ChatManager();
chatManager.joinConversation('conv-123');
chatManager.sendMessage('Hello!');
```

### React Hook Example

```typescript
import { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAppDispatch } from '@/store/hooks';

export const useChatSocket = () => {
  const dispatch = useAppDispatch();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket
    socketRef.current = io('http://localhost:3000', {
      auth: {
        token: localStorage.getItem('access_token')
      }
    });

    const socket = socketRef.current;

    // Set up event listeners
    socket.on('message:new', ({ conversationId, message }) => {
      dispatch(chatApi.util.updateQueryData(
        'getMessages',
        { conversationId },
        (draft) => {
          draft.messages.unshift(message);
        }
      ));
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [dispatch]);

  return socketRef.current;
};
```