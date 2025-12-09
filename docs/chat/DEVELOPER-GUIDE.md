# Hockey Hub Chat System - Developer Guide

## Overview

This guide provides comprehensive documentation for developers working on the Hockey Hub chat system. It covers the architecture, database schema, service integration, and best practices for extending the system.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [Service Architecture](#service-architecture)
5. [API Design](#api-design)
6. [WebSocket Implementation](#websocket-implementation)
7. [Frontend Architecture](#frontend-architecture)
8. [Adding New Features](#adding-new-features)
9. [Testing Guidelines](#testing-guidelines)
10. [Performance Considerations](#performance-considerations)
11. [Security Best Practices](#security-best-practices)
12. [Development Workflow](#development-workflow)

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │   Chat UI   │  │  RTK Query   │  │  Socket Client  │    │
│  └─────────────┘  └──────────────┘  └─────────────────┘    │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS/WSS
┌────────────────────────────┼────────────────────────────────┐
│                     API Gateway (3000)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │    Auth     │  │ Rate Limiter │  │   WebSocket     │    │
│  │ Middleware  │  │              │  │    Upgrade      │    │
│  └─────────────┘  └──────────────┘  └─────────────────┘    │
└────────────────────────────┬────────────────────────────────┘
                             │ Internal HTTP/WS
┌────────────────────────────┼────────────────────────────────┐
│              Communication Service (3002)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │   REST API  │  │  Socket.io   │  │  Message Queue  │    │
│  │  Endpoints  │  │   Handler    │  │   Processor     │    │
│  └─────────────┘  └──────────────┘  └─────────────────┘    │
│                            │                                 │
│  ┌─────────────────────────┼────────────────────────────┐   │
│  │               PostgreSQL Database                     │   │
│  │  ┌──────────┐  ┌───────────┐  ┌────────────────┐   │   │
│  │  │ Messages │  │Conversations│ │  User Presence │   │   │
│  │  └──────────┘  └───────────┘  └────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌─────────────────────────┼────────────────────────────┐   │
│  │                   Redis Cache                         │   │
│  │  ┌──────────┐  ┌───────────┐  ┌────────────────┐   │   │
│  │  │ Sessions │  │  Presence  │  │ Message Cache  │   │   │
│  │  └──────────┘  └───────────┘  └────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Frontend Layer**: React-based UI with Redux state management
2. **API Gateway**: Central entry point, handles auth and routing
3. **Communication Service**: Core chat functionality
4. **Database Layer**: PostgreSQL for persistence, Redis for caching
5. **File Storage**: S3-compatible storage for attachments
6. **Message Queue**: Async processing for notifications

## Technology Stack

### Backend Technologies

- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Language**: TypeScript 5.3+
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **ORM**: TypeORM
- **WebSocket**: Socket.io 4.x
- **Authentication**: JWT with RS256
- **Validation**: class-validator
- **Testing**: Jest
- **Documentation**: TypeDoc

### Frontend Technologies

- **Framework**: Next.js 15.3+
- **UI Library**: React 18.3+
- **Language**: TypeScript 5.3+
- **State Management**: Redux Toolkit with RTK Query
- **Styling**: Tailwind CSS with shadcn/ui
- **WebSocket Client**: Socket.io-client
- **Forms**: React Hook Form
- **Testing**: Jest + React Testing Library

### Infrastructure

- **Container**: Docker
- **Orchestration**: Docker Compose (dev), Kubernetes (prod)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: Winston + ELK Stack
- **APM**: New Relic / DataDog

## Database Schema

### Core Entities

#### Conversation Entity

```typescript
@Entity('conversations')
export class Conversation extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ConversationType,
    default: ConversationType.DIRECT
  })
  type: ConversationType;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  avatar_url?: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  created_by: string;

  @Column({ default: false })
  is_archived: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    teamId?: string;
    organizationId?: string;
    allowPlayerReactions?: boolean;
    moderatorIds?: string[];
  };

  @OneToMany(() => ConversationParticipant, participant => participant.conversation)
  participants: ConversationParticipant[];

  @OneToMany(() => Message, message => message.conversation)
  messages: Message[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Index(['created_by'])
  @Index(['type'])
  @Index(['is_archived'])
}
```

#### Message Entity

```typescript
@Entity('messages')
export class Message extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  conversation_id: string;

  @ManyToOne(() => Conversation, conversation => conversation.messages)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column()
  sender_id: string;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT
  })
  type: MessageType;

  @Column({ nullable: true })
  reply_to_id?: string;

  @ManyToOne(() => Message, { nullable: true })
  @JoinColumn({ name: 'reply_to_id' })
  reply_to?: Message;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @OneToMany(() => MessageAttachment, attachment => attachment.message)
  attachments: MessageAttachment[];

  @OneToMany(() => MessageReaction, reaction => reaction.message)
  reactions: MessageReaction[];

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  edited_at?: Date;

  @DeleteDateColumn()
  deleted_at?: Date;

  @Index(['conversation_id', 'created_at'])
  @Index(['sender_id'])
  @Index(['deleted_at'])
}
```

### Database Indexes

Critical indexes for performance:

```sql
-- Conversation queries
CREATE INDEX idx_conversations_type_archived 
ON conversations(type, is_archived) 
WHERE is_archived = false;

-- Message retrieval
CREATE INDEX idx_messages_conversation_created 
ON messages(conversation_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- Participant lookups
CREATE INDEX idx_participants_user_conversation 
ON conversation_participants(user_id, conversation_id) 
WHERE left_at IS NULL;

-- Full-text search
CREATE INDEX idx_messages_content_search 
ON messages USING gin(to_tsvector('english', content));

-- Presence queries
CREATE INDEX idx_presence_user_updated 
ON user_presence(user_id, updated_at);
```

### Database Migrations

Migration example:

```typescript
export class AddMessagePinning1735500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add pinning columns
    await queryRunner.addColumn('messages', new TableColumn({
      name: 'is_pinned',
      type: 'boolean',
      default: false
    }));

    await queryRunner.addColumn('messages', new TableColumn({
      name: 'pinned_at',
      type: 'timestamp',
      isNullable: true
    }));

    await queryRunner.addColumn('messages', new TableColumn({
      name: 'pinned_by',
      type: 'uuid',
      isNullable: true
    }));

    // Add index for pinned messages
    await queryRunner.createIndex('messages', new Index({
      name: 'idx_messages_pinned',
      columnNames: ['conversation_id', 'is_pinned', 'pinned_at']
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('messages', 'idx_messages_pinned');
    await queryRunner.dropColumn('messages', 'pinned_by');
    await queryRunner.dropColumn('messages', 'pinned_at');
    await queryRunner.dropColumn('messages', 'is_pinned');
  }
}
```

## Service Architecture

### Communication Service Structure

```
communication-service/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── socket.ts
│   ├── controllers/
│   │   ├── conversationController.ts
│   │   ├── messageController.ts
│   │   └── presenceController.ts
│   ├── entities/
│   │   ├── Conversation.ts
│   │   ├── Message.ts
│   │   └── index.ts
│   ├── middleware/
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   └── validation.ts
│   ├── repositories/
│   │   ├── conversationRepository.ts
│   │   ├── messageRepository.ts
│   │   └── cacheRepository.ts
│   ├── routes/
│   │   ├── conversationRoutes.ts
│   │   ├── messageRoutes.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── conversationService.ts
│   │   ├── messageService.ts
│   │   ├── notificationService.ts
│   │   └── cacheService.ts
│   ├── sockets/
│   │   ├── chatHandler.ts
│   │   ├── authMiddleware.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── encryption.ts
│   │   ├── sanitizer.ts
│   │   └── validator.ts
│   └── index.ts
├── tests/
├── package.json
└── tsconfig.json
```

### Service Dependencies

```typescript
// Service initialization order
1. Database connection
2. Redis connection
3. Express server
4. Socket.io server
5. Route registration
6. Socket handler registration
7. Background job processors
```

### Inter-Service Communication

Services communicate via:

1. **HTTP REST APIs**: Synchronous requests
2. **Message Queue**: Asynchronous events
3. **Redis Pub/Sub**: Real-time updates
4. **Shared Database**: Read-only access

Example service client:

```typescript
import { ServiceClient } from '@hockey-hub/shared-lib';

export class UserServiceClient extends ServiceClient {
  constructor() {
    super('user-service', 'http://user-service:3001');
  }

  async getUser(userId: string) {
    return this.get(`/users/${userId}`);
  }

  async getUsersBatch(userIds: string[]) {
    return this.post('/users/batch', { userIds });
  }
}
```

## API Design

### RESTful Principles

Follow REST conventions:

- **GET**: Retrieve resources
- **POST**: Create new resources
- **PUT**: Update entire resources
- **PATCH**: Partial updates
- **DELETE**: Remove resources

### API Versioning

Version APIs via URL path:

```
/api/v1/conversations
/api/v2/conversations  // New version
```

### Request/Response Format

Standard response format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}
```

### Pagination

Implement cursor-based pagination:

```typescript
interface PaginatedRequest {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
}

interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  prevCursor?: string;
  hasMore: boolean;
}
```

### Error Handling

Consistent error responses:

```typescript
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
  }
}

// Usage
throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Conversation does not exist');
```

## WebSocket Implementation

### Socket.io Architecture

```typescript
export class ChatSocketManager {
  private io: Server;
  private chatHandler: ChatHandler;

  constructor(server: http.Server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.chatHandler = new ChatHandler(this.io);
    this.setupMiddleware();
    this.setupNamespaces();
  }

  private setupMiddleware() {
    this.io.use(socketAuthMiddleware);
    this.io.use(rateLimitMiddleware);
  }

  private setupNamespaces() {
    // Main chat namespace
    const chatNamespace = this.io.of('/chat');
    chatNamespace.on('connection', (socket) => {
      this.chatHandler.handleConnection(socket);
    });

    // Admin namespace
    const adminNamespace = this.io.of('/admin');
    adminNamespace.use(adminAuthMiddleware);
    adminNamespace.on('connection', (socket) => {
      this.adminHandler.handleConnection(socket);
    });
  }
}
```

### Event Handling Pattern

```typescript
export class ChatHandler {
  handleConnection(socket: AuthenticatedSocket) {
    const userId = socket.userId;
    
    // Join user room for direct messages
    socket.join(`user:${userId}`);
    
    // Register event handlers
    this.registerHandlers(socket);
    
    // Send initial data
    this.sendInitialData(socket);
    
    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  private registerHandlers(socket: AuthenticatedSocket) {
    // Use event namespacing
    socket.on('conversation:join', this.handleConversationJoin.bind(this));
    socket.on('message:send', this.handleMessageSend.bind(this));
    socket.on('typing:start', this.handleTypingStart.bind(this));
    // ... more handlers
  }

  private async handleMessageSend(
    socket: AuthenticatedSocket,
    data: SendMessageData,
    callback?: (response: any) => void
  ) {
    try {
      // Validate input
      const validated = await validateMessageData(data);
      
      // Process message
      const message = await this.messageService.create(validated);
      
      // Emit to room
      this.io.to(`conversation:${data.conversationId}`)
        .emit('message:new', message);
      
      // Send success callback
      callback?.({ success: true, message });
    } catch (error) {
      // Send error callback
      callback?.({ success: false, error: error.message });
    }
  }
}
```

### Room Management

```typescript
export class RoomManager {
  private rooms: Map<string, Set<string>> = new Map();

  joinRoom(socketId: string, room: string) {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)!.add(socketId);
  }

  leaveRoom(socketId: string, room: string) {
    this.rooms.get(room)?.delete(socketId);
    if (this.rooms.get(room)?.size === 0) {
      this.rooms.delete(room);
    }
  }

  getRoomMembers(room: string): string[] {
    return Array.from(this.rooms.get(room) || []);
  }
}
```

## Frontend Architecture

### Component Structure

```
src/features/chat/
├── components/
│   ├── ChatLayout/
│   │   ├── ChatLayout.tsx
│   │   ├── ChatLayout.styles.ts
│   │   └── index.ts
│   ├── ConversationList/
│   ├── MessageList/
│   ├── MessageInput/
│   └── common/
├── hooks/
│   ├── useChatSocket.ts
│   ├── useMessages.ts
│   └── useTyping.ts
├── store/
│   ├── chatSlice.ts
│   └── chatApi.ts
├── types/
│   └── index.ts
└── utils/
    ├── messageFormatter.ts
    └── dateHelpers.ts
```

### State Management

Redux store structure:

```typescript
interface ChatState {
  conversations: {
    byId: Record<string, Conversation>;
    allIds: string[];
    activeId: string | null;
  };
  messages: {
    byConversationId: Record<string, {
      messages: Message[];
      hasMore: boolean;
      cursor?: string;
    }>;
  };
  typing: {
    byConversationId: Record<string, string[]>; // user IDs
  };
  presence: {
    byUserId: Record<string, UserPresence>;
  };
  ui: {
    isOpen: boolean;
    view: 'list' | 'conversation';
    searchQuery: string;
  };
}
```

### Custom Hooks

```typescript
// Socket connection hook
export function useChatSocket() {
  const dispatch = useAppDispatch();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io('/chat', {
      auth: { token: getAuthToken() }
    });

    socketRef.current = socket;

    // Setup listeners
    socket.on('message:new', (data) => {
      dispatch(addMessage(data));
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch]);

  const sendMessage = useCallback((data: SendMessageData) => {
    socketRef.current?.emit('message:send', data);
  }, []);

  return { socket: socketRef.current, sendMessage };
}

// Typing indicator hook
export function useTyping(conversationId: string) {
  const socket = useChatSocket();
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const startTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing:start', conversationId);
    }

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing:stop', conversationId);
    }, 3000);
  }, [conversationId, isTyping, socket]);

  return { startTyping };
}
```

### Optimistic Updates

```typescript
export const chatApi = createApi({
  // ... base config
  endpoints: (builder) => ({
    sendMessage: builder.mutation<Message, SendMessageRequest>({
      queryFn: async (arg, api, extraOptions, baseQuery) => {
        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage = {
          id: tempId,
          ...arg,
          createdAt: new Date().toISOString()
        };

        api.dispatch(
          chatApi.util.updateQueryData(
            'getMessages',
            { conversationId: arg.conversationId },
            (draft) => {
              draft.messages.push(optimisticMessage);
            }
          )
        );

        try {
          const result = await baseQuery({
            url: `/conversations/${arg.conversationId}/messages`,
            method: 'POST',
            body: arg
          });

          // Replace optimistic message with real one
          api.dispatch(
            chatApi.util.updateQueryData(
              'getMessages',
              { conversationId: arg.conversationId },
              (draft) => {
                const index = draft.messages.findIndex(m => m.id === tempId);
                if (index !== -1) {
                  draft.messages[index] = result.data;
                }
              }
            )
          );

          return { data: result.data };
        } catch (error) {
          // Revert optimistic update
          api.dispatch(
            chatApi.util.updateQueryData(
              'getMessages',
              { conversationId: arg.conversationId },
              (draft) => {
                draft.messages = draft.messages.filter(m => m.id !== tempId);
              }
            )
          );
          throw error;
        }
      }
    })
  })
});
```

## Adding New Features

### Feature Development Workflow

1. **Plan the Feature**
   - Define requirements
   - Design database schema
   - Plan API endpoints
   - Design UI/UX

2. **Backend Implementation**
   - Create/modify entities
   - Write migrations
   - Implement services
   - Add API endpoints
   - Add Socket events

3. **Frontend Implementation**
   - Create components
   - Add Redux state
   - Implement API calls
   - Add Socket listeners
   - Write tests

4. **Testing & Documentation**
   - Unit tests
   - Integration tests
   - Update API docs
   - Update user guide

### Example: Adding Message Reactions

#### 1. Database Changes

```typescript
// New entity
@Entity('message_reactions')
export class MessageReaction {
  @PrimaryColumn()
  message_id: string;

  @PrimaryColumn()
  user_id: string;

  @Column()
  emoji: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Message)
  @JoinColumn({ name: 'message_id' })
  message: Message;
}

// Migration
export class AddMessageReactions implements MigrationInterface {
  async up(queryRunner: QueryRunner) {
    await queryRunner.createTable(new Table({
      name: 'message_reactions',
      columns: [
        { name: 'message_id', type: 'uuid', isPrimary: true },
        { name: 'user_id', type: 'uuid', isPrimary: true },
        { name: 'emoji', type: 'varchar', length: '10' },
        { name: 'created_at', type: 'timestamp', default: 'now()' }
      ],
      foreignKeys: [
        {
          columnNames: ['message_id'],
          referencedTableName: 'messages',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE'
        }
      ]
    }));
  }
}
```

#### 2. Service Implementation

```typescript
export class MessageService {
  async addReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    // Check if message exists and user has access
    const message = await this.messageRepo.findOne({
      where: { id: messageId },
      relations: ['conversation', 'conversation.participants']
    });

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    const isParticipant = message.conversation.participants
      .some(p => p.user_id === userId);

    if (!isParticipant) {
      throw new ForbiddenError('Not a conversation participant');
    }

    // Add reaction
    await this.reactionRepo.upsert({
      message_id: messageId,
      user_id: userId,
      emoji
    }, ['message_id', 'user_id']);

    // Invalidate cache
    await this.cacheService.invalidate(`message:${messageId}`);
  }
}
```

#### 3. API Endpoint

```typescript
// Route
router.post('/:messageId/reactions', messageController.addReaction);

// Controller
async addReaction(req: Request, res: Response) {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user.id;

  await this.messageService.addReaction(messageId, userId, emoji);

  // Emit socket event
  const message = await this.messageService.getById(messageId);
  req.io.to(`conversation:${message.conversation_id}`)
    .emit('reaction:added', {
      messageId,
      userId,
      emoji
    });

  res.json({ success: true });
}
```

#### 4. Frontend Implementation

```typescript
// API endpoint
addReaction: builder.mutation<void, { messageId: string; emoji: string }>({
  query: ({ messageId, emoji }) => ({
    url: `/messages/${messageId}/reactions`,
    method: 'POST',
    body: { emoji }
  }),
  // Optimistic update
  onQueryStarted: async ({ messageId, emoji }, { dispatch, getState }) => {
    const userId = selectCurrentUserId(getState());
    
    dispatch(
      chatApi.util.updateQueryData(
        'getMessages',
        { conversationId: getCurrentConversationId(getState()) },
        (draft) => {
          const message = draft.messages.find(m => m.id === messageId);
          if (message) {
            message.reactions.push({ userId, emoji });
          }
        }
      )
    );
  }
})

// Component
export function MessageReactions({ message }: { message: Message }) {
  const [addReaction] = useAddReactionMutation();
  
  const handleReaction = (emoji: string) => {
    addReaction({ messageId: message.id, emoji });
  };

  return (
    <div className="flex gap-1">
      {message.reactions.map((reaction) => (
        <ReactionBadge
          key={`${reaction.userId}-${reaction.emoji}`}
          reaction={reaction}
          onClick={() => handleReaction(reaction.emoji)}
        />
      ))}
      <ReactionPicker onSelect={handleReaction} />
    </div>
  );
}
```

## Testing Guidelines

### Test Structure

```
tests/
├── unit/
│   ├── services/
│   ├── controllers/
│   └── utils/
├── integration/
│   ├── api/
│   └── socket/
├── e2e/
│   └── chat-flow.test.ts
└── fixtures/
    ├── conversations.ts
    └── messages.ts
```

### Unit Testing

```typescript
describe('MessageService', () => {
  let service: MessageService;
  let mockRepo: jest.Mocked<MessageRepository>;

  beforeEach(() => {
    mockRepo = createMockRepository();
    service = new MessageService(mockRepo);
  });

  describe('sendMessage', () => {
    it('should create a message with valid data', async () => {
      const messageData = {
        conversationId: 'conv-123',
        senderId: 'user-456',
        content: 'Hello!'
      };

      mockRepo.create.mockResolvedValue({ id: 'msg-789', ...messageData });

      const result = await service.sendMessage(messageData);

      expect(result).toHaveProperty('id');
      expect(mockRepo.create).toHaveBeenCalledWith(messageData);
    });

    it('should validate message content length', async () => {
      const longContent = 'x'.repeat(5001);
      
      await expect(
        service.sendMessage({
          conversationId: 'conv-123',
          senderId: 'user-456',
          content: longContent
        })
      ).rejects.toThrow('Message too long');
    });
  });
});
```

### Integration Testing

```typescript
describe('Chat API Integration', () => {
  let app: Application;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    authToken = await getTestAuthToken();
  });

  describe('POST /conversations/:id/messages', () => {
    it('should send a message and emit socket event', async () => {
      const conversationId = await createTestConversation();
      const socketClient = createSocketClient(authToken);
      
      const messagePromise = new Promise((resolve) => {
        socketClient.on('message:new', resolve);
      });

      const response = await request(app)
        .post(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Test message' });

      expect(response.status).toBe(201);
      
      const socketMessage = await messagePromise;
      expect(socketMessage).toMatchObject({
        content: 'Test message',
        conversationId
      });
    });
  });
});
```

### Frontend Testing

```typescript
describe('ChatLayout', () => {
  it('should display conversations and messages', async () => {
    const { getByText, getByRole } = renderWithProviders(
      <ChatLayout />,
      {
        preloadedState: {
          chat: mockChatState
        }
      }
    );

    // Check conversation list
    expect(getByText('Team Chat')).toBeInTheDocument();
    
    // Click conversation
    fireEvent.click(getByText('Team Chat'));
    
    // Check messages load
    await waitFor(() => {
      expect(getByText('Hello team!')).toBeInTheDocument();
    });
    
    // Send message
    const input = getByRole('textbox');
    fireEvent.change(input, { target: { value: 'New message' } });
    fireEvent.submit(input.closest('form')!);
    
    await waitFor(() => {
      expect(getByText('New message')).toBeInTheDocument();
    });
  });
});
```

## Performance Considerations

### Database Optimization

1. **Query Optimization**
   ```typescript
   // Bad: N+1 query
   const conversations = await conversationRepo.find();
   for (const conv of conversations) {
     conv.lastMessage = await messageRepo.findOne({
       where: { conversation_id: conv.id },
       order: { created_at: 'DESC' }
     });
   }

   // Good: Single query with join
   const conversations = await conversationRepo
     .createQueryBuilder('c')
     .leftJoinAndSelect(
       subQuery => subQuery
         .from(Message, 'm')
         .select('m.*')
         .distinctOn(['m.conversation_id'])
         .orderBy('m.conversation_id')
         .addOrderBy('m.created_at', 'DESC'),
       'last_msg',
       'last_msg.conversation_id = c.id'
     )
     .getMany();
   ```

2. **Pagination**
   ```typescript
   // Cursor-based pagination
   async getMessages(conversationId: string, cursor?: string, limit = 50) {
     const query = this.messageRepo
       .createQueryBuilder('m')
       .where('m.conversation_id = :conversationId', { conversationId })
       .orderBy('m.created_at', 'DESC')
       .limit(limit + 1);

     if (cursor) {
       query.andWhere('m.created_at < :cursor', { cursor });
     }

     const messages = await query.getMany();
     const hasMore = messages.length > limit;
     
     return {
       messages: messages.slice(0, limit),
       hasMore,
       nextCursor: hasMore ? messages[limit - 1].created_at : null
     };
   }
   ```

### Caching Strategy

1. **Redis Caching**
   ```typescript
   export class CacheService {
     private redis: Redis;
     private ttl = {
       conversation: 3600,     // 1 hour
       message: 1800,         // 30 minutes
       presence: 300,         // 5 minutes
       userProfile: 7200      // 2 hours
     };

     async getCachedOrFetch<T>(
       key: string,
       fetcher: () => Promise<T>,
       ttl?: number
     ): Promise<T> {
       // Try cache first
       const cached = await this.redis.get(key);
       if (cached) {
         return JSON.parse(cached);
       }

       // Fetch and cache
       const data = await fetcher();
       await this.redis.setex(
         key,
         ttl || this.ttl.message,
         JSON.stringify(data)
       );

       return data;
     }

     async invalidatePattern(pattern: string) {
       const keys = await this.redis.keys(pattern);
       if (keys.length) {
         await this.redis.del(...keys);
       }
     }
   }
   ```

2. **Cache Invalidation**
   ```typescript
   // Invalidate related caches on message send
   async afterMessageSent(message: Message) {
     await Promise.all([
       this.cache.invalidate(`conversation:${message.conversation_id}`),
       this.cache.invalidate(`messages:${message.conversation_id}:*`),
       this.cache.invalidate(`unread:*:${message.conversation_id}`)
     ]);
   }
   ```

### WebSocket Optimization

1. **Message Batching**
   ```typescript
   export class MessageBatcher {
     private queue: Map<string, any[]> = new Map();
     private timeout: NodeJS.Timeout;

     emit(event: string, data: any) {
       if (!this.queue.has(event)) {
         this.queue.set(event, []);
       }
       this.queue.get(event)!.push(data);

       clearTimeout(this.timeout);
       this.timeout = setTimeout(() => this.flush(), 50);
     }

     private flush() {
       this.queue.forEach((items, event) => {
         this.io.emit(event, items);
       });
       this.queue.clear();
     }
   }
   ```

2. **Connection Pooling**
   ```typescript
   export class SocketPool {
     private pools: Map<string, Socket[]> = new Map();
     
     getSocket(userId: string): Socket {
       const pool = this.pools.get(userId) || [];
       return pool[Math.floor(Math.random() * pool.length)];
     }

     addSocket(userId: string, socket: Socket) {
       if (!this.pools.has(userId)) {
         this.pools.set(userId, []);
       }
       this.pools.get(userId)!.push(socket);
     }
   }
   ```

### Frontend Optimization

1. **Virtual Scrolling**
   ```typescript
   import { VariableSizeList } from 'react-window';

   export function MessageList({ messages }: { messages: Message[] }) {
     const getItemSize = (index: number) => {
       // Calculate height based on message content
       const message = messages[index];
       const baseHeight = 60;
       const contentHeight = Math.ceil(message.content.length / 50) * 20;
       return baseHeight + contentHeight;
     };

     return (
       <VariableSizeList
         height={600}
         itemCount={messages.length}
         itemSize={getItemSize}
         width="100%"
       >
         {({ index, style }) => (
           <div style={style}>
             <Message message={messages[index]} />
           </div>
         )}
       </VariableSizeList>
     );
   }
   ```

2. **Message Grouping**
   ```typescript
   // Group consecutive messages from same sender
   export function groupMessages(messages: Message[]) {
     return messages.reduce((groups, message, index) => {
       const prevMessage = messages[index - 1];
       const sameAuthor = prevMessage?.sender_id === message.sender_id;
       const within5Min = prevMessage && 
         (new Date(message.created_at).getTime() - 
          new Date(prevMessage.created_at).getTime()) < 300000;

       if (sameAuthor && within5Min) {
         groups[groups.length - 1].messages.push(message);
       } else {
         groups.push({
           sender: message.sender,
           messages: [message]
         });
       }

       return groups;
     }, [] as MessageGroup[]);
   }
   ```

## Security Best Practices

### Input Validation

```typescript
import { IsString, IsUUID, MaxLength, IsEnum } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  conversationId: string;

  @IsString()
  @MaxLength(5000)
  content: string;

  @IsEnum(MessageType)
  type: MessageType = MessageType.TEXT;
}

// Validation middleware
export async function validateDto<T extends object>(
  dto: new () => T,
  data: any
): Promise<T> {
  const instance = Object.assign(new dto(), data);
  const errors = await validate(instance);
  
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
  
  return instance;
}
```

### SQL Injection Prevention

```typescript
// Always use parameterized queries
// Bad
const messages = await query(
  `SELECT * FROM messages WHERE content LIKE '%${search}%'`
);

// Good
const messages = await this.messageRepo
  .createQueryBuilder('m')
  .where('m.content LIKE :search', { search: `%${search}%` })
  .getMany();
```

### XSS Prevention

```typescript
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeMessage(content: string): string {
  // Allow only specific tags and attributes
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
}

// React component
export function MessageContent({ content }: { content: string }) {
  const sanitized = useMemo(() => sanitizeMessage(content), [content]);
  
  return (
    <div 
      className="message-content"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
```

### Authentication & Authorization

```typescript
// Service-level authorization
export class ConversationService {
  async updateConversation(
    conversationId: string,
    userId: string,
    updates: UpdateConversationDto
  ) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: ['participants']
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // Check if user is admin of conversation
    const participant = conversation.participants.find(
      p => p.user_id === userId
    );

    if (!participant || participant.role !== 'admin') {
      throw new ForbiddenError('Only admins can update conversation');
    }

    // Proceed with update
    return this.conversationRepo.update(conversationId, updates);
  }
}
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// Different limits for different operations
export const messageLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:message:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  message: 'Too many messages, please slow down'
});

export const fileLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:file:'
  }),
  windowMs: 60 * 1000,
  max: 10, // 10 files per minute
  message: 'Too many file uploads'
});

// Apply to routes
router.post('/messages', messageLimiter, messageController.send);
router.post('/upload', fileLimiter, fileController.upload);
```

### Encryption

```typescript
import crypto from 'crypto';

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    this.key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + 
           authTag.toString('hex') + ':' + 
           encrypted;
  }

  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

## Development Workflow

### Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/hockey-hub/hockey-hub.git
cd hockey-hub

# 2. Install dependencies
pnpm install

# 3. Set up databases
docker-compose up -d postgres redis

# 4. Run migrations
pnpm -C services/communication-service run migrate

# 5. Start services
pnpm -C services/communication-service run dev

# 6. Start frontend
pnpm -C apps/frontend run dev
```

### Development Tools

1. **Database GUI**: Use TablePlus or pgAdmin
2. **Redis GUI**: Use RedisInsight
3. **API Testing**: Use Postman or Insomnia
4. **WebSocket Testing**: Use Socket.io client tester

### Code Style

Follow the project's ESLint and Prettier configuration:

```json
{
  "extends": ["@hockey-hub/eslint-config"],
  "rules": {
    "no-console": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "prefer-const": "error"
  }
}
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/chat-reactions

# Make changes and commit
git add .
git commit -m "feat(chat): add message reactions"

# Push and create PR
git push origin feature/chat-reactions
```

### Debugging

```typescript
// Use debug namespaces
import debug from 'debug';

const log = debug('chat:service:message');
const error = debug('chat:error:message');

export class MessageService {
  async sendMessage(data: SendMessageDto) {
    log('Sending message:', data);
    
    try {
      const message = await this.create(data);
      log('Message sent:', message.id);
      return message;
    } catch (err) {
      error('Failed to send message:', err);
      throw err;
    }
  }
}

// Enable with: DEBUG=chat:* npm run dev
```

### Performance Profiling

```typescript
// Use performance marks
export async function profiledOperation() {
  performance.mark('operation-start');
  
  try {
    const result = await heavyOperation();
    return result;
  } finally {
    performance.mark('operation-end');
    performance.measure(
      'operation-duration',
      'operation-start',
      'operation-end'
    );
    
    const measure = performance.getEntriesByName('operation-duration')[0];
    console.log(`Operation took ${measure.duration}ms`);
  }
}
```

## Best Practices Summary

1. **Architecture**
   - Keep services loosely coupled
   - Use dependency injection
   - Follow SOLID principles
   - Implement proper error handling

2. **Database**
   - Use migrations for schema changes
   - Add appropriate indexes
   - Implement soft deletes
   - Use transactions for consistency

3. **API Design**
   - Follow REST conventions
   - Version your APIs
   - Use consistent response formats
   - Implement proper pagination

4. **Security**
   - Validate all inputs
   - Sanitize user content
   - Use parameterized queries
   - Implement rate limiting
   - Encrypt sensitive data

5. **Performance**
   - Cache frequently accessed data
   - Use database query optimization
   - Implement message batching
   - Use virtual scrolling for large lists

6. **Testing**
   - Write unit tests for business logic
   - Add integration tests for APIs
   - Test WebSocket events
   - Maintain >80% code coverage

7. **Documentation**
   - Document all APIs
   - Add JSDoc comments
   - Keep README updated
   - Document deployment process