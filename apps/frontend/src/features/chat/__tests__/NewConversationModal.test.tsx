import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/testing/test-utils';
import { NewConversationModal } from '../components/NewConversationModal';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer();

describe('NewConversationModal', () => {
  const mockUsers = [
    {
      id: 'user2',
      name: 'John Doe',
      email: 'john@example.com',
      avatar_url: 'https://example.com/john.jpg',
      roles: ['player'],
    },
    {
      id: 'user3',
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatar_url: 'https://example.com/jane.jpg',
      roles: ['coach'],
    },
    {
      id: 'user4',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      avatar_url: 'https://example.com/bob.jpg',
      roles: ['player'],
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
    currentUserId: 'user1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    server.use(
      rest.get('/api/users', (req, res, ctx) => {
        const search = req.url.searchParams.get('search');
        if (search) {
          // For short queries, return all users (keeps tests predictable)
          if (search.length <= 1) {
            return res(ctx.json({ data: mockUsers }));
          }
          const filtered = mockUsers.filter(user => 
            user.name.toLowerCase().includes(search.toLowerCase())
          );
          return res(ctx.json({ data: filtered }));
        }
        return res(ctx.json({ data: mockUsers }));
      }),
      rest.post('/api/conversations', async (req, res, ctx) => {
        const body = await req.json();
        return res(
          ctx.json({
            data: {
              id: 'new-conv-id',
              type: body.type,
              name: body.name,
              participant_ids: body.participant_ids,
              created_at: new Date().toISOString(),
            },
          })
        );
      })
    );
  });

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should render modal with type selection', () => {
    renderWithProviders(<NewConversationModal {...defaultProps} />);

    expect(screen.getByText('Start New Conversation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /direct message/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /group chat/i })).toBeInTheDocument();
  });

  it('should handle direct message creation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewConversationModal {...defaultProps} />);

    // Select direct message type
    await user.click(screen.getByRole('button', { name: /direct message/i }));

    // Search for user
    const searchInput = screen.getByPlaceholderText(/search users/i);
    await user.type(searchInput, 'John');

    // Wait for search results
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Select user
    await user.click(screen.getByText('John Doe'));

    // Create conversation
    const createButton = screen.getByRole('button', { name: /start conversation/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalledWith({
        id: 'new-conv-id',
        type: 'direct',
        name: undefined,
        participant_ids: ['user1', 'user2'],
        created_at: expect.any(String),
      });
    });

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should handle group chat creation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewConversationModal {...defaultProps} />);

    // Select group chat type
    await user.click(screen.getByRole('button', { name: /group chat/i }));

    // Enter group name
    const nameInput = screen.getByPlaceholderText(/group name/i);
    await user.type(nameInput, 'Project Team');

    // Select multiple users
    await user.type(screen.getByPlaceholderText(/search users/i), 'a'); // Show all users

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Jane Smith'));
    await user.click(screen.getByText('Bob Johnson'));

    // Verify selected count
    expect(screen.getByText('2 participants selected')).toBeInTheDocument();

    // Create conversation
    const createButton = screen.getByRole('button', { name: /create group/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalledWith({
        id: 'new-conv-id',
        type: 'group',
        name: 'Project Team',
        participant_ids: ['user1', 'user3', 'user4'],
        created_at: expect.any(String),
      });
    });
  });

  it('should validate group name is required', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewConversationModal {...defaultProps} />);

    // Select group chat type
    await user.click(screen.getByRole('button', { name: /group chat/i }));

    // Select users without entering group name
    await user.type(screen.getByPlaceholderText(/search users/i), 'Jane');
    
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Jane Smith'));

    // Try to create without group name
    const createButton = screen.getByRole('button', { name: /create group/i });
    await user.click(createButton);

    expect(screen.getByText('Group name is required')).toBeInTheDocument();
    expect(defaultProps.onSuccess).not.toHaveBeenCalled();
  });

  it('should prevent creating direct message without selecting user', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewConversationModal {...defaultProps} />);

    // Select direct message type
    await user.click(screen.getByRole('button', { name: /direct message/i }));

    // Try to create without selecting user
    const createButton = screen.getByRole('button', { name: /start conversation/i });
    expect(createButton).toBeDisabled();
  });

  it('should show user search results with roles', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewConversationModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /direct message/i }));
    
    const searchInput = screen.getByPlaceholderText(/search users/i);
    await user.type(searchInput, 'e'); // Should match Jane and Joe

    await waitFor(() => {
      const janeItem = screen.getByText('Jane Smith').closest('[data-testid="user-item"]');
      expect(within(janeItem!).getByText('coach')).toBeInTheDocument();
    });
  });

  it('should handle search with no results', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewConversationModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /direct message/i }));
    
    const searchInput = screen.getByPlaceholderText(/search users/i);
    await user.type(searchInput, 'xyz123');

    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });
  });

  it('should allow removing selected users in group chat', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewConversationModal {...defaultProps} />);

    // Select group chat and add users
    await user.click(screen.getByRole('button', { name: /group chat/i }));
    
    await user.type(screen.getByPlaceholderText(/search users/i), 'a');
    
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Jane Smith'));

    // Verify user is selected
    const selectedUser = screen.getByTestId('selected-user-user3');
    expect(selectedUser).toBeInTheDocument();

    // Remove selected user
    const removeButton = within(selectedUser).getByRole('button', { name: /remove/i });
    await user.click(removeButton);

    expect(screen.queryByTestId('selected-user-user3')).not.toBeInTheDocument();
  });

  it('should close modal on cancel', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewConversationModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should close modal on escape key', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewConversationModal {...defaultProps} />);

    await user.keyboard('{Escape}');

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should show loading state while creating conversation', async () => {
    const user = userEvent.setup();
    
    // Delay the response
    server.use(
      rest.post('/api/conversations', async (req, res, ctx) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return res(ctx.json({ data: { id: 'new-conv-id' } }));
      })
    );

    renderWithProviders(<NewConversationModal {...defaultProps} />);

    // Create direct message
    await user.click(screen.getByRole('button', { name: /direct message/i }));
    await user.type(screen.getByPlaceholderText(/search users/i), 'John');
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('John Doe'));
    
    const createButton = screen.getByRole('button', { name: /start conversation/i });
    await user.click(createButton);

    // Check loading state
    expect(createButton).toBeDisabled();
    expect(within(createButton).getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup();
    
    server.use(
      rest.post('/api/conversations', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({ error: 'Failed to create conversation' })
        );
      })
    );

    renderWithProviders(<NewConversationModal {...defaultProps} />);

    // Try to create conversation
    await user.click(screen.getByRole('button', { name: /direct message/i }));
    await user.type(screen.getByPlaceholderText(/search users/i), 'John');
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('John Doe'));
    await user.click(screen.getByRole('button', { name: /start conversation/i }));

    await waitFor(() => {
      expect(screen.getByText('Failed to create conversation')).toBeInTheDocument();
    });

    expect(defaultProps.onSuccess).not.toHaveBeenCalled();
  });

  it('should prevent selecting already existing conversation partner', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(
      <NewConversationModal 
        {...defaultProps} 
        existingConversations={[
          {
            id: 'existing-conv',
            type: 'direct',
            participants: [
              { user_id: 'user1' },
              { user_id: 'user2' },
            ],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: /direct message/i }));
    await user.type(screen.getByPlaceholderText(/search users/i), 'John');

    await waitFor(() => {
      const johnItem = screen.getByText('John Doe').closest('[data-testid="user-item"]');
      expect(within(johnItem!).getByText('Already have a conversation')).toBeInTheDocument();
      expect(within(johnItem!).getByRole('button')).toBeDisabled();
    });
  });

  it('should limit group size', async () => {
    const user = userEvent.setup();
    
    // Create many mock users
    const manyUsers = Array.from({ length: 15 }, (_, i) => ({
      id: `user${i + 5}`,
      name: `User ${i + 5}`,
      email: `user${i + 5}@example.com`,
    }));

    server.use(
      rest.get('/api/users', (req, res, ctx) => {
        return res(ctx.json({ data: [...mockUsers, ...manyUsers] }));
      })
    );

    renderWithProviders(<NewConversationModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /group chat/i }));
    await user.type(screen.getByPlaceholderText(/group name/i), 'Large Group');

    // Try to select many users
    for (let i = 0; i < 12; i++) {
      const userName = i < 3 ? mockUsers[i].name : `User ${i + 2}`;
      if (screen.queryByText(userName)) {
        await user.click(screen.getByText(userName));
      }
    }

    // Should show warning about max participants
    await waitFor(() => {
      expect(screen.getByText(/maximum 10 participants/i)).toBeInTheDocument();
    });
  });
});