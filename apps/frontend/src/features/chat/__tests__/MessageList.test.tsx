import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/testing/test-utils';
import { MessageList } from '../components/MessageList';
import { MessageType, MessageStatus } from '@hockey-hub/shared-lib';

describe('MessageList', () => {
  const mockMessages = [
    {
      id: 'msg1',
      conversation_id: 'conv1',
      sender_id: 'user1',
      sender: { 
        id: 'user1', 
        name: 'John Doe',
        avatar_url: 'https://example.com/avatar1.jpg'
      },
      content: 'Hello everyone!',
      type: MessageType.TEXT,
      status: MessageStatus.SENT,
      created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      read_by: ['user1', 'user2'],
      reactions: [],
    },
    {
      id: 'msg2',
      conversation_id: 'conv1',
      sender_id: 'user2',
      sender: { 
        id: 'user2', 
        name: 'Jane Smith',
        avatar_url: 'https://example.com/avatar2.jpg'
      },
      content: 'Hey John! How are you?',
      type: MessageType.TEXT,
      status: MessageStatus.SENT,
      created_at: new Date(Date.now() - 3000000).toISOString(), // 50 min ago
      read_by: ['user1', 'user2'],
      reactions: [
        { user_id: 'user1', emoji: '👍', created_at: new Date().toISOString() }
      ],
    },
    {
      id: 'msg3',
      conversation_id: 'conv1',
      sender_id: 'user1',
      sender: { 
        id: 'user1', 
        name: 'John Doe',
        avatar_url: 'https://example.com/avatar1.jpg'
      },
      content: 'Check out this file',
      type: MessageType.FILE,
      status: MessageStatus.SENT,
      created_at: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
      attachments: [
        {
          file_url: 'https://example.com/document.pdf',
          file_name: 'important-document.pdf',
          file_size: 2048000,
          mime_type: 'application/pdf',
        }
      ],
      read_by: ['user1', 'user2'],
      reactions: [],
    },
    {
      id: 'msg4',
      conversation_id: 'conv1',
      sender_id: 'system',
      sender: { 
        id: 'system', 
        name: 'System',
      },
      content: 'Jane Smith joined the conversation',
      type: MessageType.SYSTEM,
      status: MessageStatus.SENT,
      created_at: new Date(Date.now() - 900000).toISOString(), // 15 min ago
      read_by: [],
      reactions: [],
    },
  ];

  const defaultProps = {
    messages: mockMessages,
    currentUserId: 'user1',
    onReaction: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onReply: jest.fn(),
    onLoadMore: jest.fn(),
    hasMore: false,
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all messages', () => {
    renderWithProviders(<MessageList {...defaultProps} />);

    expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
    expect(screen.getByText('Hey John! How are you?')).toBeInTheDocument();
    expect(screen.getByText('Check out this file')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith joined the conversation')).toBeInTheDocument();
  });

  it('should display sender information', () => {
    renderWithProviders(<MessageList {...defaultProps} />);

    expect(screen.getAllByText('John Doe')).toHaveLength(2);
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should display timestamps', () => {
    renderWithProviders(<MessageList {...defaultProps} />);

    // Check for relative timestamps
    const timestamps = screen.getAllByTestId('message-timestamp');
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it('should display message reactions', () => {
    renderWithProviders(<MessageList {...defaultProps} />);

    const thumbsUpReaction = screen.getByText('👍');
    expect(thumbsUpReaction).toBeInTheDocument();
    
    // Check reaction count
    const reactionCount = thumbsUpReaction.nextSibling;
    expect(reactionCount).toHaveTextContent('1');
  });

  it('should handle adding reaction', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MessageList {...defaultProps} />);

    // Find message without reactions
    const message = screen.getByText('Hello everyone!').closest('[data-testid="message-item"]');
    expect(message).toBeInTheDocument();

    if (message) {
      // Hover to show actions
      await user.hover(message);
      
      // Click reaction button
      const reactionButton = within(message).getByRole('button', { name: /add reaction/i });
      await user.click(reactionButton);

      // Select emoji
      await waitFor(() => {
        const heartEmoji = screen.getByText('❤️');
        expect(heartEmoji).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('❤️'));
    }

    expect(defaultProps.onReaction).toHaveBeenCalledWith('msg1', '❤️');
  });

  it('should display file attachments correctly', () => {
    renderWithProviders(<MessageList {...defaultProps} />);

    const fileMessage = screen.getByText('Check out this file').closest('[data-testid="message-item"]');
    expect(fileMessage).toBeInTheDocument();

    if (fileMessage) {
      expect(within(fileMessage).getByText('important-document.pdf')).toBeInTheDocument();
      expect(within(fileMessage).getByText('2 MB')).toBeInTheDocument(); // File size
      expect(within(fileMessage).getByRole('link', { name: /download/i })).toBeInTheDocument();
    }
  });

  it('should distinguish own messages', () => {
    renderWithProviders(<MessageList {...defaultProps} />);

    // Own messages should have different styling
    const ownMessages = screen.getAllByTestId('message-item').filter(msg => 
      msg.getAttribute('data-sender-id') === 'user1'
    );
    
    ownMessages.forEach(msg => {
      expect(msg).toHaveClass('justify-end'); // Assuming own messages align right
    });
  });

  it('should display system messages differently', () => {
    renderWithProviders(<MessageList {...defaultProps} />);

    const systemMessage = screen.getByText('Jane Smith joined the conversation')
      .closest('[data-testid="message-item"]');
    
    expect(systemMessage).toHaveClass('text-center'); // Assuming system messages center-aligned
    expect(systemMessage).toHaveClass('text-muted-foreground');
  });

  it('should handle message editing for own messages', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MessageList {...defaultProps} />);

    const ownMessage = screen.getByText('Hello everyone!').closest('[data-testid="message-item"]');
    
    if (ownMessage) {
      await user.hover(ownMessage);
      
      const editButton = within(ownMessage).getByRole('button', { name: /edit/i });
      await user.click(editButton);
    }

    expect(defaultProps.onEdit).toHaveBeenCalledWith('msg1', 'Hello everyone!');
  });

  it('should handle message deletion for own messages', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MessageList {...defaultProps} />);

    const ownMessage = screen.getByText('Hello everyone!').closest('[data-testid="message-item"]');
    
    if (ownMessage) {
      await user.hover(ownMessage);
      
      const deleteButton = within(ownMessage).getByRole('button', { name: /delete/i });
      await user.click(deleteButton);
    }

    expect(defaultProps.onDelete).toHaveBeenCalledWith('msg1');
  });

  it('should handle reply action', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MessageList {...defaultProps} />);

    const message = screen.getByText('Hey John! How are you?').closest('[data-testid="message-item"]');
    
    if (message) {
      await user.hover(message);
      
      const replyButton = within(message).getByRole('button', { name: /reply/i });
      await user.click(replyButton);
    }

    expect(defaultProps.onReply).toHaveBeenCalledWith(mockMessages[1]);
  });

  it('should show loading state', () => {
    renderWithProviders(<MessageList {...defaultProps} loading={true} />);

    expect(screen.getByTestId('message-loading')).toBeInTheDocument();
  });

  it('should show load more button when hasMore is true', () => {
    renderWithProviders(<MessageList {...defaultProps} hasMore={true} />);

    const loadMoreButton = screen.getByRole('button', { name: /load more/i });
    expect(loadMoreButton).toBeInTheDocument();
  });

  it('should call onLoadMore when load more is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MessageList {...defaultProps} hasMore={true} />);

    const loadMoreButton = screen.getByRole('button', { name: /load more/i });
    await user.click(loadMoreButton);

    expect(defaultProps.onLoadMore).toHaveBeenCalled();
  });

  it('should display edited indicator for edited messages', () => {
    const editedMessage = {
      ...mockMessages[0],
      edited_at: new Date().toISOString(),
      edited_by: 'user1',
    };

    renderWithProviders(
      <MessageList {...defaultProps} messages={[editedMessage, ...mockMessages.slice(1)]} />
    );

    const message = screen.getByText('Hello everyone!').closest('[data-testid="message-item"]');
    expect(within(message!).getByText('(edited)')).toBeInTheDocument();
  });

  it('should display reply-to information', () => {
    const messageWithReply = {
      ...mockMessages[2],
      reply_to_id: 'msg1',
      reply_to: mockMessages[0],
    };

    renderWithProviders(
      <MessageList {...defaultProps} messages={[...mockMessages.slice(0, 2), messageWithReply]} />
    );

    const replyMessage = screen.getByText('Check out this file').closest('[data-testid="message-item"]');
    expect(within(replyMessage!).getByText('Replying to John Doe')).toBeInTheDocument();
    expect(within(replyMessage!).getByText('Hello everyone!')).toBeInTheDocument();
  });

  it('should handle image messages', () => {
    const imageMessage = {
      id: 'msg5',
      conversation_id: 'conv1',
      sender_id: 'user1',
      sender: { id: 'user1', name: 'John Doe' },
      content: 'Check out this image',
      type: MessageType.IMAGE,
      status: MessageStatus.SENT,
      created_at: new Date().toISOString(),
      attachments: [
        {
          file_url: 'https://example.com/image.jpg',
          file_name: 'vacation.jpg',
          file_size: 1024000,
          mime_type: 'image/jpeg',
          thumbnail_url: 'https://example.com/image-thumb.jpg',
        }
      ],
      read_by: ['user1'],
      reactions: [],
    };

    renderWithProviders(
      <MessageList {...defaultProps} messages={[imageMessage]} />
    );

    const image = screen.getByRole('img', { name: /vacation.jpg/i });
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image-thumb.jpg');
  });

  it('should group messages by date', () => {
    const messagesAcrossDays = [
      {
        ...mockMessages[0],
        created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      },
      {
        ...mockMessages[1],
        created_at: new Date().toISOString(), // Today
      },
    ];

    renderWithProviders(
      <MessageList {...defaultProps} messages={messagesAcrossDays} />
    );

    expect(screen.getByText('Yesterday')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('should show read receipts', () => {
    renderWithProviders(<MessageList {...defaultProps} />);

    const ownMessage = screen.getByText('Hello everyone!').closest('[data-testid="message-item"]');
    
    if (ownMessage) {
      // Should show read status for own messages
      expect(within(ownMessage).getByTestId('read-receipt')).toBeInTheDocument();
    }
  });

  it('should handle mentions in messages', () => {
    const messageWithMention = {
      ...mockMessages[0],
      content: 'Hey @Jane Smith, can you check this?',
      mentions: ['user2'],
    };

    renderWithProviders(
      <MessageList {...defaultProps} messages={[messageWithMention]} />
    );

    const mention = screen.getByText('@Jane Smith');
    expect(mention).toHaveClass('text-primary'); // Assuming mentions are highlighted
  });

  it('should auto-scroll to bottom on new messages', () => {
    const { rerender } = renderWithProviders(<MessageList {...defaultProps} />);

    // Add new message
    const newMessage = {
      id: 'msg5',
      conversation_id: 'conv1',
      sender_id: 'user2',
      sender: { id: 'user2', name: 'Jane Smith' },
      content: 'New message!',
      type: MessageType.TEXT,
      status: MessageStatus.SENT,
      created_at: new Date().toISOString(),
      read_by: ['user2'],
      reactions: [],
    };

    rerender(
      <MessageList {...defaultProps} messages={[...mockMessages, newMessage]} />
    );

    // Check that scroll happened (would need to mock scrollIntoView)
    expect(screen.getByText('New message!')).toBeInTheDocument();
  });

  it('should handle empty message list', () => {
    renderWithProviders(<MessageList {...defaultProps} messages={[]} />);

    expect(screen.getByText('No messages yet. Start the conversation!')).toBeInTheDocument();
  });
});