import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createMockUser } from '@/testing/test-utils';
import { PlayerDashboard } from '../PlayerDashboard';
import { playerApi } from '@/store/api/playerApi';

// Mock the API endpoints
jest.mock('@/store/api/playerApi', () => ({
  playerApi: {
    endpoints: {
      getPlayerOverview: {
        initiate: jest.fn(() => ({
          unwrap: jest.fn().mockResolvedValue({
            player: createMockUser({ role: 'player' }),
            todaySchedule: [
              {
                id: '1',
                title: 'Morning Practice',
                startTime: '2024-01-01T09:00:00Z',
                endTime: '2024-01-01T10:30:00Z',
                type: 'training',
                location: 'Main Rink',
              },
            ],
            upcomingEvents: [],
            wellnessData: {
              lastEntry: null,
              trend: 'stable',
            },
            trainingProgress: {
              completedSessions: 15,
              totalSessions: 20,
              weeklyProgress: 75,
            },
          }),
        })),
      },
      submitWellnessData: {
        initiate: jest.fn(() => ({
          unwrap: jest.fn().mockResolvedValue({ success: true }),
        })),
      },
    },
    useGetPlayerOverviewQuery: jest.fn(() => ({
      data: {
        player: createMockUser({ role: 'player' }),
        todaySchedule: [],
        upcomingEvents: [],
        wellnessData: { lastEntry: null },
        trainingProgress: { completedSessions: 0, totalSessions: 0 },
      },
      isLoading: false,
      error: null,
    })),
    useSubmitWellnessDataMutation: jest.fn(() => [
      jest.fn(),
      { isLoading: false },
    ]),
  },
}));

describe('PlayerDashboard', () => {
  const mockPlayerId = 'player-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders player dashboard with all sections', () => {
    renderWithProviders(<PlayerDashboard playerId={mockPlayerId} />);

    // Check main sections are present
    expect(screen.getByText(/Player Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Today's Schedule/i)).toBeInTheDocument();
    expect(screen.getByText(/Wellness Check-in/i)).toBeInTheDocument();
    expect(screen.getByText(/Training Progress/i)).toBeInTheDocument();
    expect(screen.getByText(/Performance Metrics/i)).toBeInTheDocument();
  });

  it('displays loading state while fetching data', () => {
    (playerApi.useGetPlayerOverviewQuery as jest.Mock).mockReturnValueOnce({
      data: null,
      isLoading: true,
      error: null,
    });

    renderWithProviders(<PlayerDashboard playerId={mockPlayerId} />);

    expect(screen.getByText(/Loading player data.../i)).toBeInTheDocument();
  });

  it('displays error state when data fetch fails', () => {
    (playerApi.useGetPlayerOverviewQuery as jest.Mock).mockReturnValueOnce({
      data: null,
      isLoading: false,
      error: { message: 'Failed to fetch data' },
    });

    renderWithProviders(<PlayerDashboard playerId={mockPlayerId} />);

    expect(screen.getByText(/Failed to load player data/i)).toBeInTheDocument();
  });

  it('renders today\'s schedule events', () => {
    (playerApi.useGetPlayerOverviewQuery as jest.Mock).mockReturnValueOnce({
      data: {
        player: createMockUser({ role: 'player' }),
        todaySchedule: [
          {
            id: '1',
            title: 'Morning Practice',
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 5400000).toISOString(), // 1.5 hours later
            type: 'training',
            location: 'Main Rink',
          },
          {
            id: '2',
            title: 'Team Meeting',
            startTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours later
            endTime: new Date(Date.now() + 10800000).toISOString(), // 3 hours later
            type: 'meeting',
            location: 'Conference Room',
          },
        ],
        upcomingEvents: [],
        wellnessData: { lastEntry: null },
        trainingProgress: { completedSessions: 0, totalSessions: 0 },
      },
      isLoading: false,
      error: null,
    });

    renderWithProviders(<PlayerDashboard playerId={mockPlayerId} />);

    expect(screen.getByText('Morning Practice')).toBeInTheDocument();
    expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    expect(screen.getByText('Main Rink')).toBeInTheDocument();
    expect(screen.getByText('Conference Room')).toBeInTheDocument();
  });

  it('allows wellness data submission', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn().mockResolvedValue({ data: { success: true } });
    
    (playerApi.useSubmitWellnessDataMutation as jest.Mock).mockReturnValue([
      mockSubmit,
      { isLoading: false },
    ]);

    renderWithProviders(<PlayerDashboard playerId={mockPlayerId} />);

    // Find and interact with wellness form
    const sleepInput = screen.getByLabelText(/Sleep Quality/i);
    const fatigueInput = screen.getByLabelText(/Fatigue Level/i);
    const stressInput = screen.getByLabelText(/Stress Level/i);
    const submitButton = screen.getByRole('button', { name: /Submit Wellness Data/i });

    // Fill in the form
    await user.clear(sleepInput);
    await user.type(sleepInput, '8');
    
    await user.clear(fatigueInput);
    await user.type(fatigueInput, '3');
    
    await user.clear(stressInput);
    await user.type(stressInput, '2');

    // Submit the form
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        playerId: mockPlayerId,
        data: {
          sleepQuality: 8,
          fatigueLevel: 3,
          stressLevel: 2,
          date: expect.any(String),
        },
      });
    });
  });

  it('displays training progress correctly', () => {
    (playerApi.useGetPlayerOverviewQuery as jest.Mock).mockReturnValueOnce({
      data: {
        player: createMockUser({ role: 'player' }),
        todaySchedule: [],
        upcomingEvents: [],
        wellnessData: { lastEntry: null },
        trainingProgress: {
          completedSessions: 15,
          totalSessions: 20,
          weeklyProgress: 75,
          recentWorkouts: [
            { id: '1', name: 'Strength Training', completedAt: '2024-01-01T10:00:00Z' },
            { id: '2', name: 'Cardio Session', completedAt: '2024-01-02T10:00:00Z' },
          ],
        },
      },
      isLoading: false,
      error: null,
    });

    renderWithProviders(<PlayerDashboard playerId={mockPlayerId} />);

    expect(screen.getByText('15/20')).toBeInTheDocument(); // Sessions completed
    expect(screen.getByText('75%')).toBeInTheDocument(); // Weekly progress
    expect(screen.getByText('Strength Training')).toBeInTheDocument();
    expect(screen.getByText('Cardio Session')).toBeInTheDocument();
  });

  it('handles empty schedule gracefully', () => {
    (playerApi.useGetPlayerOverviewQuery as jest.Mock).mockReturnValueOnce({
      data: {
        player: createMockUser({ role: 'player' }),
        todaySchedule: [],
        upcomingEvents: [],
        wellnessData: { lastEntry: null },
        trainingProgress: { completedSessions: 0, totalSessions: 0 },
      },
      isLoading: false,
      error: null,
    });

    renderWithProviders(<PlayerDashboard playerId={mockPlayerId} />);

    expect(screen.getByText(/No events scheduled for today/i)).toBeInTheDocument();
  });

  it('refreshes data when refresh button is clicked', async () => {
    const user = userEvent.setup();
    const mockRefetch = jest.fn();
    
    (playerApi.useGetPlayerOverviewQuery as jest.Mock).mockReturnValue({
      data: {
        player: createMockUser({ role: 'player' }),
        todaySchedule: [],
        upcomingEvents: [],
        wellnessData: { lastEntry: null },
        trainingProgress: { completedSessions: 0, totalSessions: 0 },
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    renderWithProviders(<PlayerDashboard playerId={mockPlayerId} />);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
});