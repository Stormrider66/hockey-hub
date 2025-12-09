import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/testing/test-utils';
import { ChatLayout } from '../components/ChatLayout';
import { server } from '@/testing/mocks/server';
import { rest } from 'msw';
import { ConversationType, MessageType } from '@/testing/mocks/shared-lib-index';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock socket.io
jest.mock('socket.io-client', () => {
  const emit = jest.fn();
  const on = jest.fn();
  const off = jest.fn();
  return {
    io: jest.fn(() => ({
      emit,
      on,
      off,
      disconnect: jest.fn(),
    })),
  };
});

describe('ChatLayout', () => {
  const mockConversations = [
    {
      id: 'conv1',
      type: ConversationType.DIRECT,
      participants: [
        { user_id: 'user1', user: { id: 'user1', name: 'Current User' } },
        { user_id: 'user2', user: { id: 'user2', name: 'John Doe' } },
      ],
      last_message: {
        id: 'msg1',
        content: 'Hey there!',
        created_at: new Date().toISOString(),
        sender_id: 'user2',
      },
      unread_count: 2,
    },
    {
      id: 'conv2',
      type: ConversationType.GROUP,
      name: 'Team Chat',
      participants: [
        { user_id: 'user1', user: { id: 'user1', name: 'Current User' } },
        { user_id: 'user2', user: { id: 'user2', name: 'John Doe' } },
        { user_id: 'user3', user: { id: 'user3', name: 'Jane Smith' } },
      ],
      last_message: {
        id: 'msg2',
        content: 'Meeting at 3pm',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        sender_id: 'user3',
      },
      unread_count: 0,
    },
  ];

  const mockMessages = {
    data: [
      {
        id: 'msg1',
        conversation_id: 'conv1',
        sender_id: 'user2',
        sender: { id: 'user2', name: 'John Doe' },
        content: 'Hey there!',
        type: MessageType.TEXT,
        created_at: new Date().toISOString(),
        read_by: ['user2'],
      },
      {
        id: 'msg2',
        conversation_id: 'conv1',
        sender_id: 'user1',
        sender: { id: 'user1', name: 'Current User' },
        content: 'Hi John!',
        type: MessageType.TEXT,
        created_at: new Date(Date.now() - 60000).toISOString(),
        read_by: ['user1', 'user2'],
      },
    ],
    pagination: {
      page: 1,
      limit: 50,
      total: 2,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    server.use(
      rest.get('/api/conversations', (req, res, ctx) => {
        return res(ctx.json({ data: mockConversations }));
      }),
      rest.get('/api/messages', (req, res, ctx) => {
        const conversationId = req.url.searchParams.get('conversation_id');
        if (conversationId === 'conv1') {
          return res(ctx.json(mockMessages));
        }
        return res(ctx.json({ data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } }));
      }),
      rest.post('/api/messages', (req, res, ctx) => {
        const body = req.body as any;
        return res(
          ctx.json({
            data: {
              id: 'new-msg',
              ...body,
              sender_id: 'user1',
              created_at: new Date().toISOString(),
            },
          })
        );
      })
    );
  });

  it('should render chat layout with conversation list and empty message area', async () => {
    renderWithProviders(<ChatLayout />);

    // Wait for conversations to load
    await waitFor(() => {
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    // Check conversation list
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Team Chat')).toBeInTheDocument();
    expect(screen.getByText('Hey there!')).toBeInTheDocument();
    expect(screen.getByText('Meeting at 3pm')).toBeInTheDocument();

    // Check empty message area
    expect(screen.getByText('Select a conversation to start messaging')).toBeInTheDocument();
  });

  it('should display unread count on conversations', async () => {
    renderWithProviders(<ChatLayout />);

    await waitFor(() => {
      const unreadBadge = screen.getByText('2');
      expect(unreadBadge).toBeInTheDocument();
      expect(unreadBadge).toHaveClass('bg-primary'); // Assuming this is the unread badge class
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
      expect(screen.getByText('Hey there!')).toBeInTheDocument();
      expect(screen.getByText('Hi John!')).toBeInTheDocument();
    });

    // Check message area header
    expect(screen.getByText('John Doe')).toBeInTheDocument();
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

    // Verify message was sent
    await waitFor(() => {
      expect(messageInput).toHaveValue('');
    });
  });

  it('should show typing indicator when someone is typing', async () => {
    const { io } = require('socket.io-client');
    const mockSocket = io();
    
    renderWithProviders(<ChatLayout />);

    // Select conversation
    await waitFor(() => screen.getByText('John Doe'));
    await userEvent.click(screen.getByText('John Doe'));

    // Simulate typing event from socket
    const typingHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'user_typing'
    )?.[1];

    if (typingHandler) {
      typingHandler({
        conversation_id: 'conv1',
        user_id: 'user2',
        user_name: 'John Doe',
        is_typing: true,
      });
    }

    await waitFor(() => {
      expect(screen.getByText('John Doe is typing...')).toBeInTheDocument();
    });
  });

  it('should open new conversation modal', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatLayout />);

    // Wait for the new conversation button
    await waitFor(() => {
      const newConvoButton = screen.getByRole('button', { name: /new conversation/i });
      expect(newConvoButton).toBeInTheDocument();
    });

    // Click new conversation button
    await user.click(screen.getByRole('button', { name: /new conversation/i }));

    // Check modal appears
    await waitFor(() => {
      expect(screen.getByText('Start New Conversation')).toBeInTheDocument();
      expect(screen.getByLabelText(/select participants/i)).toBeInTheDocument();
    });
  });

  it('should search conversations', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatLayout />);

    // Wait for search input
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search conversations/i)).toBeInTheDocument();
    });

    // Type in search
    const searchInput = screen.getByPlaceholderText(/search conversations/i);
    await user.type(searchInput, 'Team');

    // Only Team Chat should be visible
    await waitFor(() => {
      expect(screen.getByText('Team Chat')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('should handle real-time new message', async () => {
    const { io } = require('socket.io-client');
    const mockSocket = io();
    
    renderWithProviders(<ChatLayout />);

    // Select conversation
    await waitFor(() => screen.getByText('John Doe'));
    await userEvent.click(screen.getByText('John Doe'));

    // Wait for messages to load
    await waitFor(() => {
      expect(screen.getByText('Hi John!')).toBeInTheDocument();
    });

    // Simulate new message from socket
    const messageHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'new_message'
    )?.[1];

    if (messageHandler) {
      messageHandler({
        message: {
          id: 'real-time-msg',
          conversation_id: 'conv1',
          sender_id: 'user2',
          sender: { id: 'user2', name: 'John Doe' },
          content: 'Real-time message!',
          type: MessageType.TEXT,
          created_at: new Date().toISOString(),
        },
      });
    }

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
      expect(screen.getByText('Hey there!')).toBeInTheDocument();
    });

    // Find message and open reaction picker
    const message = screen.getByText('Hey there!').closest('[data-testid="message-item"]');
    if (message) {
      // Hover over message to show actions
      await user.hover(message);
      
      // Click reaction button
      const reactionButton = within(message).getByRole('button', { name: /add reaction/i });
      await user.click(reactionButton);

      // Select emoji
      await waitFor(() => {
        const thumbsUp = screen.getByText('👍');
        expect(thumbsUp).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('👍'));
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
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
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

    // Click info button
    await waitFor(() => {
      const infoButton = screen.getByRole('button', { name: /conversation info/i });
      expect(infoButton).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /conversation info/i }));

    // Check modal content
    await waitFor(() => {
      expect(screen.getByText('Conversation Info')).toBeInTheDocument();
      expect(screen.getByText('3 participants')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
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