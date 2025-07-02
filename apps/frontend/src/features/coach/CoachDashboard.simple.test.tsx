import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CoachDashboard from './CoachDashboard';

// Create a minimal Redux store
const mockStore = configureStore({
  reducer: {
    // Add minimal reducers if needed
  },
});

// Mock the API hooks
jest.mock('@/store/api/coachApi', () => ({
  useGetCoachOverviewQuery: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
}));

jest.mock('@/store/api/dashboardApi', () => ({
  useGetUserDashboardDataQuery: () => ({ data: null, isLoading: false }),
  useGetUserStatisticsQuery: () => ({ data: null, isLoading: false }),
  useGetCommunicationSummaryQuery: () => ({ data: null, isLoading: false }),
  useGetStatisticsSummaryQuery: () => ({ data: null, isLoading: false }),
}));

// Mock translations
jest.mock('@hockey-hub/translations', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock child components
jest.mock('@/features/calendar/components/CalendarWidget', () => ({
  __esModule: true,
  default: () => <div>CalendarWidget</div>,
}));

jest.mock('./components/IceCoachCalendarView', () => ({
  __esModule: true,
  default: () => <div>IceCoachCalendarView</div>,
}));

jest.mock('./components/PracticeTemplates', () => ({
  __esModule: true,
  default: () => <div>PracticeTemplates</div>,
}));

describe('CoachDashboard - Basic Tests', () => {
  it('should render without crashing', () => {
    render(
      <Provider store={mockStore}>
        <CoachDashboard />
      </Provider>
    );
    
    expect(screen.getByText('coach:tabs.overview')).toBeInTheDocument();
  });

  it('should display all tab buttons', () => {
    render(
      <Provider store={mockStore}>
        <CoachDashboard />
      </Provider>
    );
    
    expect(screen.getByText('coach:tabs.overview')).toBeInTheDocument();
    expect(screen.getByText('coach:tabs.calendar')).toBeInTheDocument();
    expect(screen.getByText('coach:tabs.team')).toBeInTheDocument();
    expect(screen.getByText('coach:tabs.practice')).toBeInTheDocument();
    expect(screen.getByText('coach:tabs.games')).toBeInTheDocument();
    expect(screen.getByText('coach:tabs.statistics')).toBeInTheDocument();
    expect(screen.getByText('coach:tabs.development')).toBeInTheDocument();
  });

  it('should display quick stats in overview', () => {
    render(
      <Provider store={mockStore}>
        <CoachDashboard />
      </Provider>
    );
    
    // Check for quick stat cards
    expect(screen.getByText('coach:overview.nextGame')).toBeInTheDocument();
    expect(screen.getByText('coach:overview.teamRecord')).toBeInTheDocument();
    expect(screen.getByText('coach:overview.availablePlayers')).toBeInTheDocument();
    expect(screen.getByText('coach:overview.goalsPerGame')).toBeInTheDocument();
  });

  it('should display today\'s schedule', () => {
    render(
      <Provider store={mockStore}>
        <CoachDashboard />
      </Provider>
    );
    
    expect(screen.getByText('coach:todaysSchedule.title')).toBeInTheDocument();
    expect(screen.getByText('Morning Skate')).toBeInTheDocument();
    expect(screen.getByText('Video Review')).toBeInTheDocument();
    expect(screen.getByText('Full Team Practice')).toBeInTheDocument();
  });

  it('should display player availability', () => {
    render(
      <Provider store={mockStore}>
        <CoachDashboard />
      </Provider>
    );
    
    expect(screen.getByText('coach:playerAvailability.title')).toBeInTheDocument();
    
    // Check for player names
    expect(screen.getByText('Erik Andersson')).toBeInTheDocument();
    expect(screen.getByText('Marcus Lindberg')).toBeInTheDocument();
    expect(screen.getByText('Viktor Nilsson')).toBeInTheDocument();
  });
});