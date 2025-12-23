import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test-utils';
import PlayerDashboardRefactored from '../PlayerDashboardRefactored';

// Avoid deep rendering of tab internals here; those have their own tests.
jest.mock('../components/tabs', () => ({
  TodayTab: () => <div data-testid="today-tab" />,
  TrainingTab: () => <div data-testid="training-tab" />,
  TacticalTab: () => <div data-testid="tactical-tab" />,
  WellnessTab: () => <div data-testid="wellness-tab" />,
  PerformanceTab: () => <div data-testid="performance-tab" />,
  CalendarTab: () => <div data-testid="calendar-tab" />,
}));

jest.mock('../components/PlayerIntervalViewer', () => ({
  PlayerIntervalViewer: () => null,
}));

jest.mock('../hooks/usePlayerDashboard', () => ({
  usePlayerDashboard: jest.fn(),
}));

import { usePlayerDashboard } from '../hooks/usePlayerDashboard';

describe('PlayerDashboard (refactored)', () => {
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePlayerDashboard as jest.Mock).mockReturnValue({
      t: (key: string) => key,
      router: mockRouter,
      tab: 'today',
      setTab: jest.fn(),
      isLoading: false,
      error: null,
      playerInfo: { name: 'Test Player', number: 10, position: 'Forward', team: 'U14', age: 22, height: "5'11\"", weight: '180 lbs' },
      isViewerOpen: false,
      selectedWorkout: null,
      closeViewer: jest.fn(),
    });
  });

  it('renders header with player info and tabs', () => {
    renderWithProviders(<PlayerDashboardRefactored />);

    expect(screen.getByText('Test Player')).toBeInTheDocument();
    expect(screen.getByText('#10')).toBeInTheDocument();
    expect(screen.getByText('Forward')).toBeInTheDocument();
    expect(screen.getByText('U14')).toBeInTheDocument();

    // Tabs use translation keys in test env
    expect(screen.getByText('common:time.today')).toBeInTheDocument();
  });

  it('renders an error card when error is present', () => {
    (usePlayerDashboard as jest.Mock).mockReturnValueOnce({
      t: (key: string) => key,
      router: mockRouter,
      tab: 'today',
      setTab: jest.fn(),
      isLoading: false,
      error: { message: 'boom' },
      playerInfo: { name: 'Test Player', number: 10, position: 'Forward', team: 'U14' },
      isViewerOpen: false,
      selectedWorkout: null,
      closeViewer: jest.fn(),
    });

    renderWithProviders(<PlayerDashboardRefactored />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('common:messages.error. common:actions.retry.')).toBeInTheDocument();
  });
});