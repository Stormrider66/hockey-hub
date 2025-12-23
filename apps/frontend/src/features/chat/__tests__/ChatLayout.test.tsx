import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/testing/test-utils';
import { ChatLayout } from '../components/ChatLayout';
import { rest } from 'msw';
import { ConversationType, MessageType } from '@/testing/mocks/shared-lib-index';
import { setupServer } from 'msw/node';
import { addTypingUser } from '@/store/slices/chatSlice';
import { chatApi } from '@/store/api/chatApi';

const server = setupServer();

describe('ChatLayout', () => {
  beforeEach(() => {
    localStorage.setItem('current_user_id', 'user1');
    localStorage.setItem('access_token', 'test-token');

    const nowIso = new Date().toISOString();
    const hourAgoIso = new Date(Date.now() - 3600000).toISOString();
    const minuteAgoIso = new Date(Date.now() - 60000).toISOString();

    const conversations = [
      {
        id: 'conv1',
        type: ConversationType.DIRECT as any,
        createdAt: hourAgoIso,
        updatedAt: nowIso,
        createdBy: 'user1',
        isArchived: false,
        participants: [
          {
            conversationId: 'conv1',
            userId: 'user1',
            user: { id: 'user1', name: 'Current User', email: 'current@example.com' },
            role: 'member',
            joinedAt: hourAgoIso,
            notificationsEnabled: true,
            isMuted: false,
          },
          {
            conversationId: 'conv1',
            userId: 'user2',
            user: { id: 'user2', name: 'John Doe', email: 'john@example.com' },
            role: 'member',
            joinedAt: hourAgoIso,
            notificationsEnabled: true,
            isMuted: false,
          },
        ],
        lastMessage: {
          id: 'msg1',
          conversationId: 'conv1',
          senderId: 'user2',
          sender: { id: 'user2', name: 'John Doe', email: 'john@example.com' },
          content: 'Hey there!',
          type: MessageType.TEXT as any,
          createdAt: nowIso,
          attachments: [],
          reactions: [],
          readReceipts: [],
        },
        unreadCount: 2,
      },
      {
        id: 'conv2',
        type: ConversationType.GROUP as any,
        name: 'Team Chat',
        createdAt: hourAgoIso,
        updatedAt: hourAgoIso,
        createdBy: 'user1',
        isArchived: false,
        participants: [
          {
            conversationId: 'conv2',
            userId: 'user1',
            user: { id: 'user1', name: 'Current User', email: 'current@example.com' },
            role: 'member',
            joinedAt: hourAgoIso,
            notificationsEnabled: true,
            isMuted: false,
          },
          {
            conversationId: 'conv2',
            userId: 'user2',
            user: { id: 'user2', name: 'John Doe', email: 'john@example.com' },
            role: 'member',
            joinedAt: hourAgoIso,
            notificationsEnabled: true,
            isMuted: false,
          },
          {
            conversationId: 'conv2',
            userId: 'user3',
            user: { id: 'user3', name: 'Jane Smith', email: 'jane@example.com' },
            role: 'member',
            joinedAt: hourAgoIso,
            notificationsEnabled: true,
            isMuted: false,
          },
        ],
        lastMessage: {
          id: 'msg3',
          conversationId: 'conv2',
          senderId: 'user3',
          sender: { id: 'user3', name: 'Jane Smith', email: 'jane@example.com' },
          content: 'Meeting at 3pm',
          type: MessageType.TEXT as any,
          createdAt: hourAgoIso,
          attachments: [],
          reactions: [],
          readReceipts: [],
        },
        unreadCount: 0,
      },
    ];

    const messagesByConversation: Record<string, any> = {
      conv1: {
        messages: [
          {
            id: 'msg1',
            conversationId: 'conv1',
            senderId: 'user2',
            sender: { id: 'user2', name: 'John Doe', email: 'john@example.com' },
            content: 'Hey there!',
            type: MessageType.TEXT as any,
            createdAt: hourAgoIso,
            attachments: [],
            reactions: [],
            readReceipts: [{ messageId: 'msg1', userId: 'user2', user: { id: 'user2', name: 'John Doe', email: 'john@example.com' }, readAt: hourAgoIso }],
          },
          {
            id: 'msg2',
            conversationId: 'conv1',
            senderId: 'user1',
            sender: { id: 'user1', name: 'Current User', email: 'current@example.com' },
            content: 'Hi John!',
            type: MessageType.TEXT as any,
            createdAt: minuteAgoIso,
            attachments: [],
            reactions: [],
            readReceipts: [],
          },
        ],
        hasMore: false,
      },
      conv2: { messages: [], hasMore: false },
    };

    server.use(
      rest.get('/api/v1/messages/conversations', (req, res, ctx) => {
        return res(ctx.json({ conversations, total: conversations.length, page: 1, limit: 20 }));
      }),
      rest.get(/\/api\/v1\/messages\/conversations\/.+/, (req, res, ctx) => {
        const id = req.url.pathname.split('/').pop() || '';
        const conv = conversations.find((c) => c.id === id);
        if (!conv) return res(ctx.status(404), ctx.json({ message: 'Not found' }));
        return res(ctx.json(conv));
      }),
      rest.get(/\/api\/v1\/conversations\/.+\/messages/, (req, res, ctx) => {
        const parts = req.url.pathname.split('/');
        const conversationId = parts[parts.indexOf('conversations') + 1];
        return res(ctx.json(messagesByConversation[conversationId] || { messages: [], hasMore: false }));
      }),
      rest.post(/\/api\/v1\/conversations\/.+\/messages/, async (req, res, ctx) => {
        const parts = req.url.pathname.split('/');
        const conversationId = parts[parts.indexOf('conversations') + 1];
        const body = (await req.json?.()) || (req.body as any) || {};
        const createdAt = new Date().toISOString();
        return res(
          ctx.json({
            id: 'new-msg',
            conversationId,
            senderId: 'user1',
            sender: { id: 'user1', name: 'Current User', email: 'current@example.com' },
            content: body.content || '',
            type: body.type || 'text',
            createdAt,
            attachments: body.attachments || [],
            reactions: [],
            readReceipts: [],
            metadata: body.metadata,
          })
        );
      }),
      rest.put(/\/api\/v1\/messages\/.+/, async (req, res, ctx) => {
        const messageId = req.url.pathname.split('/').pop() || '';
        const body = (await req.json?.()) || (req.body as any) || {};
        return res(ctx.json({ id: messageId, content: body.content, editedAt: new Date().toISOString() }));
      }),
      rest.delete(/\/api\/v1\/messages\/.+/, (req, res, ctx) => {
        return res(ctx.status(200), ctx.json({ ok: true }));
      }),
      rest.post(/\/api\/v1\/messages\/.+\/reactions/, async (req, res, ctx) => {
        const parts = req.url.pathname.split('/');
        const messageId = parts[parts.indexOf('messages') + 1];
        const body = (await req.json?.()) || (req.body as any) || {};
        return res(ctx.json({ id: `reaction-${Date.now()}`, messageId, emoji: body.emoji, userId: 'user1' }));
      })
    );
  });

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should render chat layout with conversation list and empty message area', async () => {
    renderWithProviders(<ChatLayout />);

    // Wait for conversations to load
    await waitFor(() => {
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    // Check conversation list
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(await screen.findByText('Team Chat')).toBeInTheDocument();
    expect(screen.getAllByText('Hey there!').length).toBeGreaterThan(0);
    expect(screen.getByText(/Meeting at 3pm/i)).toBeInTheDocument();

    // Check empty message area
    expect(screen.getByText(/Welcome to Chat/i)).toBeInTheDocument();
    expect(screen.getByText(/Select a conversation to start messaging/i)).toBeInTheDocument();
  });

  it('should display unread count on conversations', async () => {
    renderWithProviders(<ChatLayout />);

    await waitFor(() => {
      const items = screen.getAllByTestId('conversation-item');
      const johnItem = items.find((el) => within(el).queryByText('John Doe'));
      expect(johnItem).toBeTruthy();
      const unreadBadge = within(johnItem as HTMLElement).getByText('2');
      expect(unreadBadge).toBeInTheDocument();
      expect(unreadBadge).toHaveClass('bg-primary');
    });
  });

  it('should load and display messages when conversation is selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatLayout />);

    // Wait for conversations to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click on first conversation
    await user.click(screen.getByText('John Doe'));

    // Wait for messages to load
    await waitFor(() => {
      expect(screen.getAllByText('Hey there!').length).toBeGreaterThan(0);
      expect(screen.getByText('Hi John!')).toBeInTheDocument();
    });
  });

  it('should send a new message', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatLayout />);

    // Select conversation
    await waitFor(() => screen.getByText('John Doe'));
    await user.click(screen.getByText('John Doe'));

    // Wait for message input to appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    });

    // Type and send message
    const messageInput = screen.getByPlaceholderText(/type a message/i);
    await user.type(messageInput, 'Hello from test!');
    
    // Find and click send button
    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);
    await user.click(await screen.findByText('Send now'));

    // Verify message was sent
    await waitFor(() => {
      expect(messageInput).toHaveValue('');
    });
  });

  it('should show typing indicator when someone is typing', async () => {
    const { store } = renderWithProviders(<ChatLayout />);

    await waitFor(() => screen.getByText('John Doe'));
    store.dispatch(addTypingUser({ conversationId: 'conv1', userId: 'user2', userName: 'John Doe', timestamp: Date.now() }));

    await waitFor(() => {
      expect(screen.getByText('John Doe is typing...')).toBeInTheDocument();
    });
  });

  it('should open new conversation modal', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatLayout />);

    // Wait for the new conversation button
    await waitFor(() => {
      const newConvoButton = screen.getByTitle('New conversation');
      expect(newConvoButton).toBeInTheDocument();
    });

    // Click new conversation button
    await user.click(screen.getByTitle('New conversation'));

    // Check modal appears
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Start New Conversation' })).toBeInTheDocument();
    });
  });

  it('should search conversations', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatLayout />);

    // Wait for search input
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search conversations...')).toBeInTheDocument();
    });

    // Type in search
    const searchInput = screen.getByPlaceholderText('Search conversations...');
    await user.type(searchInput, 'Team');

    // Only Team Chat should be visible
    await waitFor(() => {
      expect(screen.getByText('Team Chat')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('should handle real-time new message', async () => {
    const { store } = renderWithProviders(<ChatLayout />);

    await waitFor(() => screen.getByText('John Doe'));
    await userEvent.click(screen.getByText('John Doe'));

    await waitFor(() => expect(screen.getByText('Hi John!')).toBeInTheDocument());

    store.dispatch(
      chatApi.util.updateQueryData('getMessages', { conversationId: 'conv1' }, (draft: any) => {
        draft.messages.push({
          id: 'real-time-msg',
          conversationId: 'conv1',
          senderId: 'user2',
          sender: { id: 'user2', name: 'John Doe', email: 'john@example.com' },
          content: 'Real-time message!',
          type: MessageType.TEXT,
          createdAt: new Date().toISOString(),
          attachments: [],
          reactions: [],
          readReceipts: [],
        });
      })
    );

    await waitFor(() => {
      expect(screen.getByText('Real-time message!')).toBeInTheDocument();
    });
  });

  it('should handle message reactions', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatLayout />);

    // Select conversation and wait for messages
    await waitFor(() => screen.getByText('John Doe'));
    await user.click(screen.getByText('John Doe'));

    await waitFor(() => {
      expect(screen.getAllByText('Hey there!').length).toBeGreaterThan(0);
    });
    await waitFor(() => {
      expect(screen.getByText('Hi John!')).toBeInTheDocument();
    });

    // Find message (avoid conversation preview) and open reaction picker
    const message = screen.getAllByTestId('message-item').find((el) => within(el).queryByText('Hey there!')) || null;
    if (message) {
      // Hover over message to show actions
      await user.hover(message);
      
      // Click reaction button
      const reactionButton = within(message).getByRole('button', { name: /add reaction/i });
      await user.click(reactionButton);

      // Select emoji
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search emoji...')).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: '👍' }));
    }

    // Verify reaction was added
    await waitFor(() => {
      expect(screen.getByText('👍')).toBeInTheDocument();
    });
  });

  it('should handle file uploads', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatLayout />);

    // Select conversation
    await waitFor(() => screen.getByText('John Doe'));
    await user.click(screen.getByText('John Doe'));

    // Wait for file upload button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /attach file/i })).toBeInTheDocument();
    });

    // Create mock file
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/file input/i);
    
    // Upload file
    await user.upload(fileInput, file);

    // Verify file preview appears
    await waitFor(() => {
      expect(screen.getAllByText('test.pdf').length).toBeGreaterThan(0);
    });
  });

  it('should show online status indicators', async () => {
    renderWithProviders(<ChatLayout />);

    await waitFor(() => {
      const conversationItems = screen.getAllByTestId('conversation-item');
      expect(conversationItems.length).toBeGreaterThan(0);
      
      // Check for online status indicator
      const onlineIndicator = screen.getAllByTestId('online-indicator');
      expect(onlineIndicator.length).toBeGreaterThan(0);
    });
  });

  it('should handle conversation info modal', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatLayout />);

    // Select conversation
    await waitFor(() => screen.getByText('Team Chat'));
    await user.click(screen.getByText('Team Chat'));

    // Open settings dropdown and click Conversation Info
    await user.click(screen.getByTitle('Settings'));
    await user.click(await screen.findByText('Conversation Info'));

    // Check modal content
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Conversation Info')).toBeInTheDocument();
      expect(within(dialog).getByRole('heading', { name: /participants/i })).toBeInTheDocument();
    });
  });

  it('should handle message deletion', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatLayout />);

    // Select conversation and wait for messages
    await waitFor(() => screen.getByText('John Doe'));
    await user.click(screen.getByText('John Doe'));

    await waitFor(() => {
      expect(screen.getByText('Hi John!')).toBeInTheDocument();
    });

    // Find own message and hover
    const ownMessage = screen.getByText('Hi John!').closest('[data-testid="message-item"]');
    if (ownMessage) {
      await user.hover(ownMessage);
      
      // Click delete button
      const deleteButton = within(ownMessage).getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /confirm/i });
        expect(confirmButton).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /confirm/i }));
    }

    // Verify message is deleted
    await waitFor(() => {
      expect(screen.queryByText('Hi John!')).not.toBeInTheDocument();
    });
  });

  it('should handle message editing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatLayout />);

    // Select conversation and wait for messages
    await waitFor(() => screen.getByText('John Doe'));
    await user.click(screen.getByText('John Doe'));

    await waitFor(() => {
      expect(screen.getByText('Hi John!')).toBeInTheDocument();
    });

    // Find own message and hover
    const ownMessage = screen.getByText('Hi John!').closest('[data-testid="message-item"]');
    if (ownMessage) {
      await user.hover(ownMessage);
      
      // Click edit button
      const editButton = within(ownMessage).getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Edit message
      const editInput = within(ownMessage).getByRole('textbox');
      await user.clear(editInput);
      await user.type(editInput, 'Hi John! (edited)');
      await user.keyboard('{Enter}');
    }

    // Verify message is updated
    await waitFor(() => {
      expect(screen.getByText('Hi John! (edited)')).toBeInTheDocument();
      expect(screen.getByText('(edited)')).toBeInTheDocument();
    });
  });
});