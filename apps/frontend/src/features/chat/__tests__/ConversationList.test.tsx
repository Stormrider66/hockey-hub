import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/testing/test-utils';
import { ConversationList } from '../components/ConversationList';
import { ConversationType, PresenceStatus } from '@/testing/mocks/shared-lib-index';

describe('ConversationList', () => {
  const mockConversations = [
    {
      id: 'conv1',
      type: ConversationType.DIRECT,
      participants: [
        { 
          user_id: 'user1', 
          user: { 
            id: 'user1', 
            name: 'Current User',
            avatar_url: 'https://example.com/user1.jpg'
          },
          role: 'member',
        },
        { 
          user_id: 'user2', 
          user: { 
            id: 'user2', 
            name: 'John Doe',
            avatar_url: 'https://example.com/user2.jpg',
            presence: { status: PresenceStatus.ONLINE }
          },
          role: 'member',
        },
      ],
      last_message: {
        id: 'msg1',
        content: 'Hey there! How are you doing?',
        created_at: new Date().toISOString(),
        sender_id: 'user2',
        type: 'text',
      },
      unread_count: 3,
      updated_at: new Date().toISOString(),
    },
    {
      id: 'conv2',
      type: ConversationType.GROUP,
      name: 'Team Alpha',
      avatar_url: 'https://example.com/team-alpha.jpg',
      participants: [
        { 
          user_id: 'user1', 
          user: { id: 'user1', name: 'Current User' },
          role: 'admin',
        },
        { 
          user_id: 'user2', 
          user: { id: 'user2', name: 'John Doe' },
          role: 'member',
        },
        { 
          user_id: 'user3', 
          user: { 
            id: 'user3', 
            name: 'Jane Smith',
            presence: { status: PresenceStatus.AWAY }
          },
          role: 'member',
        },
      ],
      last_message: {
        id: 'msg2',
        content: 'Meeting scheduled for 3 PM',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        sender_id: 'user3',
        sender: { id: 'user3', name: 'Jane Smith' },
        type: 'text',
      },
      unread_count: 0,
      updated_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'conv3',
      type: ConversationType.CHANNEL,
      name: 'General Announcements',
      description: 'Official team announcements',
      participants: [
        { user_id: 'user1', user: { id: 'user1', name: 'Current User' }, role: 'member' },
      ],
      last_message: {
        id: 'msg3',
        content: 'Welcome to the team!',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        sender_id: 'system',
        type: 'system',
      },
      unread_count: 0,
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const defaultProps = {
    conversations: mockConversations,
    currentUserId: 'user1',
    selectedConversationId: null,
    onSelectConversation: jest.fn(),
    onCreateConversation: jest.fn(),
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all conversations', () => {
    renderWithProviders(<ConversationList {...defaultProps} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    expect(screen.getByText('General Announcements')).toBeInTheDocument();
  });

  it('should display last messages', () => {
    renderWithProviders(<ConversationList {...defaultProps} />);

    expect(screen.getByText('Hey there! How are you doing?')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith: Meeting scheduled for 3 PM')).toBeInTheDocument();
    expect(screen.getByText('Welcome to the team!')).toBeInTheDocument();
  });

  it('should display unread counts', () => {
    renderWithProviders(<ConversationList {...defaultProps} />);

    const unreadBadge = screen.getByText('3');
    expect(unreadBadge).toBeInTheDocument();
    expect(unreadBadge).toHaveClass('bg-primary'); // Assuming primary color for unread badge
  });

  it('should display online status indicators', () => {
    renderWithProviders(<ConversationList {...defaultProps} />);

    // Check for online indicator on John Doe's conversation
    const johnDoeConversation = screen.getByText('John Doe').closest('[data-testid="conversation-item"]');
    expect(within(johnDoeConversation!).getByTestId('online-indicator')).toBeInTheDocument();
  });

  it('should handle conversation selection', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConversationList {...defaultProps} />);

    const teamAlphaConversation = screen.getByText('Team Alpha');
    await user.click(teamAlphaConversation);

    expect(defaultProps.onSelectConversation).toHaveBeenCalledWith('conv2');
  });

  it('should highlight selected conversation', () => {
    renderWithProviders(
      <ConversationList {...defaultProps} selectedConversationId="conv2" />
    );

    const selectedConversation = screen.getByText('Team Alpha').closest('[data-testid="conversation-item"]');
    expect(selectedConversation).toHaveClass('bg-accent'); // Assuming accent background for selected
  });

  it('should display timestamps correctly', () => {
    renderWithProviders(<ConversationList {...defaultProps} />);

    // Recent message should show time
    const recentTimestamp = screen.getByTestId('conversation-timestamp-conv1');
    expect(recentTimestamp).toHaveTextContent(/\d{1,2}:\d{2}/); // Time format

    // Older message should show relative date
    const olderTimestamp = screen.getByTestId('conversation-timestamp-conv3');
    expect(olderTimestamp).toHaveTextContent('Yesterday');
  });

  it('should handle search functionality', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConversationList {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/search conversations/i);
    await user.type(searchInput, 'Team');

    // Only Team Alpha should be visible
    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('General Announcements')).not.toBeInTheDocument();
    });
  });

  it('should display new conversation button', () => {
    renderWithProviders(<ConversationList {...defaultProps} />);

    const newConversationButton = screen.getByRole('button', { name: /new conversation/i });
    expect(newConversationButton).toBeInTheDocument();
  });

  it('should handle new conversation click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConversationList {...defaultProps} />);

    const newConversationButton = screen.getByRole('button', { name: /new conversation/i });
    await user.click(newConversationButton);

    expect(defaultProps.onCreateConversation).toHaveBeenCalled();
  });

  it('should show loading state', () => {
    renderWithProviders(<ConversationList {...defaultProps} loading={true} />);

    expect(screen.getByTestId('conversation-list-loading')).toBeInTheDocument();
  });

  it('should display empty state when no conversations', () => {
    renderWithProviders(<ConversationList {...defaultProps} conversations={[]} />);

    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
    expect(screen.getByText('Start a new conversation to begin chatting')).toBeInTheDocument();
  });

  it('should sort conversations by last message time', () => {
    renderWithProviders(<ConversationList {...defaultProps} />);

    const conversationItems = screen.getAllByTestId('conversation-item');
    
    // First should be John Doe (most recent)
    expect(within(conversationItems[0]).getByText('John Doe')).toBeInTheDocument();
    
    // Second should be Team Alpha
    expect(within(conversationItems[1]).getByText('Team Alpha')).toBeInTheDocument();
    
    // Third should be General Announcements (oldest)
    expect(within(conversationItems[2]).getByText('General Announcements')).toBeInTheDocument();
  });

  it('should display group participant count', () => {
    renderWithProviders(<ConversationList {...defaultProps} />);

    const teamAlphaConversation = screen.getByText('Team Alpha').closest('[data-testid="conversation-item"]');
    expect(within(teamAlphaConversation!).getByText('3 members')).toBeInTheDocument();
  });

  it('should truncate long messages', () => {
    const longMessageConversation = {
      ...mockConversations[0],
      last_message: {
        ...mockConversations[0].last_message,
        content: 'This is a very long message that should be truncated in the conversation list to maintain consistent layout and prevent overflow issues in the UI',
      },
    };

    renderWithProviders(
      <ConversationList 
        {...defaultProps} 
        conversations={[longMessageConversation, ...mockConversations.slice(1)]} 
      />
    );

    const truncatedMessage = screen.getByText(/This is a very long message/);
    expect(truncatedMessage.textContent).toContain('...');
  });

  it('should display typing indicator', () => {
    const conversationWithTyping = {
      ...mockConversations[0],
      typing_users: ['user2'],
    };

    renderWithProviders(
      <ConversationList 
        {...defaultProps} 
        conversations={[conversationWithTyping, ...mockConversations.slice(1)]} 
      />
    );

    expect(screen.getByText('John Doe is typing...')).toBeInTheDocument();
  });

  it('should handle archived conversations', () => {
    const archivedConversation = {
      ...mockConversations[0],
      archived_at: new Date().toISOString(),
    };

    renderWithProviders(
      <ConversationList 
        {...defaultProps} 
        conversations={[archivedConversation, ...mockConversations.slice(1)]} 
        showArchived={false}
      />
    );

    // Archived conversation should not be visible
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('should show archived conversations when enabled', () => {
    const archivedConversation = {
      ...mockConversations[0],
      archived_at: new Date().toISOString(),
    };

    renderWithProviders(
      <ConversationList 
        {...defaultProps} 
        conversations={[archivedConversation, ...mockConversations.slice(1)]} 
        showArchived={true}
      />
    );

    // Archived conversation should be visible
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // Should have archived indicator
    const archivedItem = screen.getByText('John Doe').closest('[data-testid="conversation-item"]');
    expect(within(archivedItem!).getByText('Archived')).toBeInTheDocument();
  });

  it('should display channel icon for channel conversations', () => {
    renderWithProviders(<ConversationList {...defaultProps} />);

    const channelConversation = screen.getByText('General Announcements')
      .closest('[data-testid="conversation-item"]');
    
    expect(within(channelConversation!).getByTestId('channel-icon')).toBeInTheDocument();
  });

  it('should handle conversation menu actions', async () => {
    const user = userEvent.setup();
    const onArchive = jest.fn();
    const onDelete = jest.fn();
    const onMute = jest.fn();

    renderWithProviders(
      <ConversationList 
        {...defaultProps} 
        onArchiveConversation={onArchive}
        onDeleteConversation={onDelete}
        onMuteConversation={onMute}
      />
    );

    // Find conversation and open menu
    const conversation = screen.getByText('John Doe').closest('[data-testid="conversation-item"]');
    const menuButton = within(conversation!).getByRole('button', { name: /more options/i });
    
    await user.click(menuButton);

    // Click archive option
    await user.click(screen.getByText('Archive'));
    expect(onArchive).toHaveBeenCalledWith('conv1');
  });

  it('should display muted conversations', () => {
    const mutedConversation = {
      ...mockConversations[0],
      muted_until: new Date(Date.now() + 86400000).toISOString(), // Muted for 24 hours
    };

    renderWithProviders(
      <ConversationList 
        {...defaultProps} 
        conversations={[mutedConversation, ...mockConversations.slice(1)]} 
      />
    );

    const mutedItem = screen.getByText('John Doe').closest('[data-testid="conversation-item"]');
    expect(within(mutedItem!).getByTestId('muted-icon')).toBeInTheDocument();
  });

  it('should filter conversations by type', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConversationList {...defaultProps} />);

    // Click on filter dropdown
    const filterButton = screen.getByRole('button', { name: /filter/i });
    await user.click(filterButton);

    // Select "Direct Messages" filter
    await user.click(screen.getByText('Direct Messages'));

    // Only direct conversation should be visible
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Team Alpha')).not.toBeInTheDocument();
      expect(screen.queryByText('General Announcements')).not.toBeInTheDocument();
    });
  });
});