# Hockey Hub Chat System - API Documentation

## Overview

The Hockey Hub chat system provides comprehensive messaging capabilities through REST APIs. All endpoints require authentication via JWT tokens and are routed through the API Gateway at `http://localhost:3000/api/v1`.

## Table of Contents

1. [Authentication](#authentication)
2. [Conversation Endpoints](#conversation-endpoints)
3. [Message Endpoints](#message-endpoints)
4. [Presence Endpoints](#presence-endpoints)
5. [Notification Endpoints](#notification-endpoints)
6. [Announcement Endpoints](#announcement-endpoints)
7. [Specialized Channels](#specialized-channels)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)

## Authentication

All API requests require a valid JWT token in the Authorization header:

```bash
Authorization: Bearer <jwt-token>
```

## Conversation Endpoints

### List Conversations

Get all conversations for the authenticated user.

**GET** `/api/v1/messages/conversations`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Filter by conversation type (direct, group, team, broadcast)
- `archived` (optional): Include archived conversations (default: false)

**Response:**
```json
{
  "conversations": [
    {
      "id": "conv-123",
      "type": "direct",
      "name": "John Doe",
      "avatar": "https://...",
      "description": null,
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z",
      "createdBy": "user-456",
      "isArchived": false,
      "participants": [
        {
          "userId": "user-456",
          "user": {
            "id": "user-456",
            "name": "John Doe",
            "email": "john@example.com",
            "avatar": "https://..."
          },
          "role": "member",
          "joinedAt": "2025-01-15T10:00:00Z",
          "notificationsEnabled": true,
          "isMuted": false
        }
      ],
      "lastMessage": {
        "id": "msg-789",
        "content": "Hello!",
        "type": "text",
        "createdAt": "2025-01-15T10:30:00Z",
        "sender": {
          "id": "user-456",
          "name": "John Doe"
        }
      },
      "unreadCount": 2
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 20
}
```

### Get Conversation Details

**GET** `/api/v1/messages/conversations/:conversationId`

**Response:**
```json
{
  "id": "conv-123",
  "type": "group",
  "name": "Team Chat",
  "avatar": "https://...",
  "description": "Official team communication",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z",
  "createdBy": "user-456",
  "isArchived": false,
  "participants": [...],
  "metadata": {
    "teamId": "team-789",
    "organizationId": "org-123",
    "allowPlayerReactions": true,
    "moderatorIds": ["user-456"]
  }
}
```

### Create Conversation

**POST** `/api/v1/messages/conversations`

**Request Body:**
```json
{
  "type": "direct|group|team",
  "name": "Group Name (required for group/team)",
  "participantIds": ["user-789", "user-101"],
  "description": "Optional description",
  "metadata": {
    "teamId": "team-789",
    "organizationId": "org-123"
  }
}
```

**Response:** Returns created conversation object

### Update Conversation

**PUT** `/api/v1/messages/conversations/:conversationId`

**Request Body:**
```json
{
  "name": "New Group Name",
  "avatar": "https://new-avatar-url",
  "description": "Updated description"
}
```

### Archive Conversation

**DELETE** `/api/v1/messages/conversations/:conversationId`

Archives the conversation (soft delete).

### Add Participants

**POST** `/api/v1/messages/conversations/:conversationId/participants`

**Request Body:**
```json
{
  "userIds": ["user-111", "user-222"]
}
```

### Remove Participant

**DELETE** `/api/v1/messages/conversations/:conversationId/participants/:participantId`

### Mark Conversation as Read

**PUT** `/api/v1/messages/conversations/:conversationId/read`

### Mute/Unmute Conversation

**PUT** `/api/v1/messages/conversations/:conversationId/mute`
**DELETE** `/api/v1/messages/conversations/:conversationId/mute`

## Message Endpoints

### Get Messages

**GET** `/api/v1/messages/conversations/:conversationId/messages`

**Query Parameters:**
- `cursor` (optional): Pagination cursor for loading older messages
- `limit` (optional): Number of messages to return (default: 50)

**Response:**
```json
{
  "messages": [
    {
      "id": "msg-123",
      "conversationId": "conv-456",
      "senderId": "user-789",
      "sender": {
        "id": "user-789",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "avatar": "https://..."
      },
      "content": "Hello team!",
      "type": "text",
      "createdAt": "2025-01-15T10:30:00Z",
      "editedAt": null,
      "deletedAt": null,
      "replyToId": null,
      "attachments": [],
      "reactions": [
        {
          "id": "react-123",
          "userId": "user-456",
          "user": {
            "id": "user-456",
            "name": "John Doe"
          },
          "emoji": "👍",
          "createdAt": "2025-01-15T10:31:00Z"
        }
      ],
      "readReceipts": [
        {
          "userId": "user-456",
          "user": {
            "id": "user-456",
            "name": "John Doe"
          },
          "readAt": "2025-01-15T10:32:00Z"
        }
      ]
    }
  ],
  "hasMore": true,
  "nextCursor": "cursor-xyz"
}
```

### Send Message

**POST** `/api/v1/messages/conversations/:conversationId/messages`

**Request Body:**
```json
{
  "content": "Hello everyone!",
  "type": "text",
  "replyToId": "msg-999",
  "attachments": [
    {
      "url": "https://...",
      "fileName": "document.pdf",
      "fileType": "application/pdf",
      "fileSize": 1024000
    }
  ],
  "metadata": {
    "priority": "normal|important|urgent"
  }
}
```

### Send Voice Message

**POST** `/api/v1/messages/conversations/:conversationId/messages`

**Request Body:**
```json
{
  "type": "voice",
  "metadata": {
    "duration": 15000,
    "waveform": [0.1, 0.3, 0.5, ...],
    "base64Audio": "data:audio/webm;base64,..."
  }
}
```

### Edit Message

**PUT** `/api/v1/messages/:messageId`

**Request Body:**
```json
{
  "content": "Updated message content"
}
```

**Note:** Only message owner can edit within 15 minutes of sending.

### Delete Message

**DELETE** `/api/v1/messages/:messageId`

Soft deletes the message. Only message owner can delete.

### Add Reaction

**POST** `/api/v1/messages/:messageId/reactions`

**Request Body:**
```json
{
  "emoji": "👍"
}
```

### Remove Reaction

**DELETE** `/api/v1/messages/:messageId/reactions`

**Request Body:**
```json
{
  "emoji": "👍"
}
```

### Search Messages

**GET** `/api/v1/messages/search`

**Query Parameters:**
- `query`: Search term
- `conversationId` (optional): Search within specific conversation
- `senderId` (optional): Filter by sender
- `dateFrom` (optional): Start date (ISO 8601)
- `dateTo` (optional): End date (ISO 8601)
- `type` (optional): Filter by message type

### Pin/Unpin Message

**PUT** `/api/v1/messages/:messageId/pin`
**DELETE** `/api/v1/messages/:messageId/pin`

### Get Pinned Messages

**GET** `/api/v1/messages/conversations/:conversationId/messages/pinned`

### Bookmark/Unbookmark Message

**PUT** `/api/v1/messages/:messageId/bookmark`
**DELETE** `/api/v1/messages/:messageId/bookmark`

### Get Bookmarked Messages

**GET** `/api/v1/messages/bookmarked`

**Query Parameters:**
- `conversationId` (optional): Filter by conversation

## Presence Endpoints

### Update Presence

**PUT** `/api/v1/presence`

**Request Body:**
```json
{
  "status": "online|away|offline",
  "statusMessage": "In a meeting"
}
```

### Get Online Users

**GET** `/api/v1/presence/online`

Returns list of currently online users.

### Get User Presence

**GET** `/api/v1/presence/:userId`

**Response:**
```json
{
  "userId": "user-123",
  "status": "online",
  "lastSeenAt": "2025-01-15T10:30:00Z",
  "statusMessage": "Available"
}
```

### Get Multiple Users Presence

**GET** `/api/v1/presence/users`

**Query Parameters:**
- `userIds`: Comma-separated list of user IDs

### Get Conversation Presence

**GET** `/api/v1/presence/conversations/:conversationId`

Returns presence information for all participants in a conversation.

### Send Heartbeat

**POST** `/api/v1/presence/heartbeat`

Keeps the user's online status active.

## Notification Endpoints

### Get Notifications

**GET** `/api/v1/notifications`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `unread` (optional): Filter unread only

### Mark Notification as Read

**PUT** `/api/v1/notifications/:notificationId/read`

### Mark All Notifications as Read

**PUT** `/api/v1/notifications/read-all`

### Update Notification Preferences

**PUT** `/api/v1/notifications/preferences`

**Request Body:**
```json
{
  "email": true,
  "push": true,
  "sms": false,
  "inApp": true,
  "quietHours": {
    "enabled": true,
    "start": "22:00",
    "end": "08:00"
  }
}
```

## Announcement Endpoints

### Create Announcement Channel

**POST** `/api/v1/announcements/channels`

**Request Body:**
```json
{
  "name": "Team Announcements",
  "description": "Official team announcements",
  "teamId": "team-123",
  "organizationId": "org-456",
  "allowPlayerReactions": true,
  "participantIds": ["user-111", "user-222"]
}
```

### Get Announcement Channels

**GET** `/api/v1/announcements/channels`

### Post Announcement

**POST** `/api/v1/announcements/channels/:conversationId/announcements`

**Request Body:**
```json
{
  "content": "Important team update...",
  "priority": "normal|important|urgent",
  "attachments": []
}
```

### Toggle Pin Announcement

**PATCH** `/api/v1/announcements/channels/:conversationId/announcements/:messageId/pin`

### React to Announcement

**POST** `/api/v1/announcements/channels/:conversationId/announcements/:messageId/react`

**Request Body:**
```json
{
  "emoji": "👍"
}
```

## Specialized Channels

### Training Discussions

**Base URL:** `/api/v1/training-discussions`

- Create discussion for training session
- Post updates and feedback
- Track player responses

### Medical Discussions

**Base URL:** `/api/v1/medical-discussions`

- Private medical staff communications
- HIPAA-compliant messaging
- Injury updates and treatment plans

### Parent Communications

**Base URL:** `/api/v1/parent-communications`

- Parent-coach messaging
- Schedule clarifications
- Player progress updates

### Private Coach Channels

**Base URL:** `/api/v1/coach-channels`

- Coach-only discussions
- Strategy planning
- Performance reviews

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "CONVERSATION_NOT_FOUND",
    "message": "The requested conversation does not exist",
    "statusCode": 404,
    "details": {}
  }
}
```

Common error codes:
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request data
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General limit**: 100 requests per minute
- **Message sending**: 30 messages per minute
- **File uploads**: 10 uploads per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

## Examples

### JavaScript/TypeScript

```typescript
// Using fetch
const getConversations = async () => {
  const response = await fetch('/api/v1/messages/conversations', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch conversations');
  }
  
  return response.json();
};

// Using RTK Query (recommended)
import { useGetConversationsQuery } from '@/store/api/chatApi';

const ConversationList = () => {
  const { data, error, isLoading } = useGetConversationsQuery({
    page: 1,
    limit: 20
  });
  
  // Handle loading, error, and data states
};
```

### cURL Examples

```bash
# Get conversations
curl -X GET "http://localhost:3000/api/v1/messages/conversations" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send a message
curl -X POST "http://localhost:3000/api/v1/messages/conversations/conv-123/messages" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello team!",
    "type": "text"
  }'

# Update presence
curl -X PUT "http://localhost:3000/api/v1/presence" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "away",
    "statusMessage": "In a meeting"
  }'
```