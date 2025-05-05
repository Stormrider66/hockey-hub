# Hockey App - Communication Service API Contract (OpenAPI 3.0)

## Overview
The Communication Service provides real‑time and asynchronous messaging (chats, announcements, notifications) between users and teams.  It exposes REST endpoints for chat/channel management, message history, and notification preferences, plus a WebSocket gateway for live updates.

**Service Base URL** : `/api/v1`
**Service Port**     : `3002`

> Security: all endpoints require `bearerAuth` unless stated otherwise.

### Security Schemes
```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

## API Endpoints

### Chats
| Method & Path | Description | Required Role(s) |
|---------------|-------------|------------------|
| **POST** `/communication/chats` | Create a new chat (private, group, announcement) | any authenticated user (role restrictions for announcement) |
| **GET** `/communication/chats` | List chats the user participates in | user |
| **GET** `/communication/chats/{chatId}` | Chat metadata & last messages | participant |
| **PUT** `/communication/chats/{chatId}` | Update chat info (name, description) | chat admin |
| **DELETE** `/communication/chats/{chatId}` | Archive chat | chat admin |

### Chat Participants
| Method & Path | Description |
|---------------|-------------|
| **POST** `/communication/chats/{chatId}/participants` | Add participants |
| **DELETE** `/communication/chats/{chatId}/participants/{userId}` | Remove participant |
| **PATCH** `/communication/chats/{chatId}/participants/{userId}` | Update participant role (admin/member) |

### Messages
| Method & Path | Description |
|---------------|-------------|
| **POST** `/communication/chats/{chatId}/messages` | Send message (text / file) |
| **GET** `/communication/chats/{chatId}/messages` | Paginated history (`page`, `limit`, `beforeId`) |
| **DELETE** `/communication/messages/{messageId}` | Soft‑delete message (sender or admin) |

### Read Status
| Method & Path | Description |
|---------------|-------------|
| **POST** `/communication/messages/{messageId}/read` | Mark message as read |
| **GET** `/communication/messages/{messageId}/readers` | List users who have read a message |

### Attachments
| Method & Path | Description |
|---------------|-------------|
| **GET** `/communication/attachments/{attachmentId}` | Download attachment (signed URL) |
| **DELETE** `/communication/attachments/{attachmentId}` | Delete attachment (sender or admin) |

### Notifications
| Method & Path | Description |
|---------------|-------------|
| **GET** `/communication/notifications` | List notifications for current user |
| **POST** `/communication/notifications/{notificationId}/read` | Mark notification as read |

## WebSocket
`WS /communication/ws` – after JWT auth hand‑shake, server emits events:
* `chat.created`, `chat.updated`, `message.new`, `message.deleted`, `message.read`, `notification.new`.

## Data Models (Schemas)
```yaml
components:
  schemas:
    Chat:
      type: object
      properties:
        id: { type: string, format: uuid }
        chatType: { type: string, enum: [private, group, announcement] }
        name: { type: string, nullable: true }
        description: { type: string, nullable: true }
        teamId: { type: string, format: uuid, nullable: true }
        createdBy: { type: string, format: uuid }
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }
    Message:
      type: object
      properties:
        id: { type: string, format: uuid }
        chatId: { type: string, format: uuid }
        senderId: { type: string, format: uuid }
        messageType: { type: string, enum: [text, image, file, system] }
        content: { type: string }
        metadata: { type: object, nullable: true }
        replyToId: { type: string, format: uuid, nullable: true }
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }
    Attachment:
      type: object
      properties:
        id: { type: string, format: uuid }
        messageId: { type: string, format: uuid }
        fileName: { type: string }
        fileSize: { type: integer }
        mimeType: { type: string }
        filePath: { type: string }
        thumbnailPath: { type: string, nullable: true }
    Notification:
      type: object
      properties:
        id: { type: string, format: uuid }
        type: { type: string, enum: [message, event, system, approval] }
        title: { type: string }
        body: { type: string }
        isRead: { type: boolean }
        createdAt: { type: string, format: date-time }
```

---
*Status — DRAFT v0.1* 