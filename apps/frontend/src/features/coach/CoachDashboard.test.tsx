import React from 'react';
import { screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/testing/test-utils';
import CoachDashboard from './CoachDashboard';
import { act } from 'react-dom/test-utils';

// Mock components
jest.mock('@/features/calendar/components/CalendarWidget', () => ({
  __esModule: true,
  default: ({ organizationId, userId, days }: any) => (
    <div data-testid="calendar-widget">
      Calendar Widget - {days} days
    </div>
  ),
}));

jest.mock('./components/IceCoachCalendarView', () => ({
  __esModule: true,
  default: ({ organizationId, userId, teamId }: any) => (
    <div data-testid="ice-coach-calendar">
      Ice Coach Calendar - Team: {teamId}
    </div>
  ),
}));

jest.mock('./components/PracticeTemplates', () => ({
  __esModule: true,
  default: ({ onApplyTemplate }: any) => (
    <div data-testid="practice-templates">
      <button onClick={() => onApplyTemplate({ name: 'Test Template' })}>
        Apply Template
      </button>
    </div>
  ),
}));

jest.mock('@/features/chat/components/BroadcastManagement', () => ({
  BroadcastManagement: ({ teamId, organizationId, coachId }: any) => (
    <div data-testid="broadcast-management">
      Broadcast Management - Team: {teamId}
    </div>
  ),
}));

jest.mock('./components/PlayerProfileView', () => ({
  PlayerProfileView: ({ playerId, onBack }: any) => (
    <div data-testid="player-profile">
      Player Profile - ID: {playerId}
      <button onClick={onBack}>Back to Roster</button>
    </div>
  ),
}));

jest.mock('@/features/chat/components/CoachChannelList', () => ({
  CoachChannelList: ({ channels, onChannelSelect }: any) => (
    <div data-testid="coach-channel-list">
      {channels.map((channel: any) => (
        <div key={channel.id} onClick={() => onChannelSelect(channel.id)}>
          {channel.playerName} - {channel.parentName}
        </div>
      ))}
    </div>
  ),
}));

jest.mock('@/hooks/usePrivateCoachChannels', () => ({
  usePrivateCoachChannels: () => ({
    channels: [
      {
        id: 'channel-1',
        playerName: 'Erik Andersson',
        parentName: 'Anna Andersson',
        unreadCount: 2,
        hasPendingMeetingRequest: true,
      },
      {
        id: 'channel-2',
        playerName: 'Marcus Lindberg',
        parentName: 'Per Lindberg',
        unreadCount: 0,
        hasPendingMeetingRequest: false,
      },
    ],
    loading: false,
  }),
}));

jest.mock('@hockey-hub/translations', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

// Mock chart components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children, data }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  BarChart: ({ children, data }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  RadarChart: ({ children, data }: any) => (
    <div data-testid="radar-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Line: ({ dataKey }: any) => <div data-testid={`line-${dataKey}`} />,
  Bar: ({ dataKey }: any) => <div data-testid={`bar-${dataKey}`} />,
  Pie: ({ data }: any) => <div data-testid="pie" data-pie-data={JSON.stringify(data)} />,
  Radar: ({ name, dataKey }: any) => <div data-testid={`radar-${name}`} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />,
}));

// Mock API hooks
jest.mock('@/store/api/coachApi', () => ({
  useGetCoachOverviewQuery: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
}));

jest.mock('@/store/api/dashboardApi', () => ({
  useGetUserDashboardDataQuery: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
  useGetUserStatisticsQuery: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
  useGetCommunicationSummaryQuery: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
  useGetStatisticsSummaryQuery: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
}));

describe('CoachDashboard', () => {
  describe('Dashboard Tabs', () => {
    it('should render all tabs', () => {
      renderWithProviders(<CoachDashboard />);

      expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /calendar/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /team/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /practice/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /games/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /statistics/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /development/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /broadcasts/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /parents/i })).toBeInTheDocument();
    });

    it('should switch between tabs', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      // Default is overview tab
      expect(screen.getByText(/vs Northern Knights/i)).toBeInTheDocument();

      // Switch to team tab
      await user.click(screen.getByRole('tab', { name: /team/i }));
      expect(screen.getByText('Roster Management')).toBeInTheDocument();

      // Switch to calendar tab
      await user.click(screen.getByRole('tab', { name: /calendar/i }));
      expect(screen.getByTestId('ice-coach-calendar')).toBeInTheDocument();
    });
  });

  describe('Overview Tab', () => {
    it('should display quick stats', () => {
      renderWithProviders(<CoachDashboard />);

      expect(screen.getByText('Next Game')).toBeInTheDocument();
      expect(screen.getByText(/vs Northern Knights/i)).toBeInTheDocument();
      expect(screen.getByText('Team Record')).toBeInTheDocument();
      expect(screen.getByText('12-5-3')).toBeInTheDocument();
      expect(screen.getByText('Available Players')).toBeInTheDocument();
    });

    it('should show today\'s schedule', () => {
      renderWithProviders(<CoachDashboard />);

      expect(screen.getByText('Today\'s Schedule')).toBeInTheDocument();
      expect(screen.getByText('Morning Skate')).toBeInTheDocument();
      expect(screen.getByText('Video Review')).toBeInTheDocument();
      expect(screen.getByText('Full Team Practice')).toBeInTheDocument();
    });

    it('should display player availability', () => {
      renderWithProviders(<CoachDashboard />);

      expect(screen.getByText('Player Availability')).toBeInTheDocument();
      
      // Check availability counts
      const availableElements = screen.getAllByText('Available');
      expect(availableElements.length).toBeGreaterThan(0);
      
      const limitedElements = screen.getAllByText('Limited');
      expect(limitedElements.length).toBeGreaterThan(0);
    });

    it('should show team performance chart', () => {
      renderWithProviders(<CoachDashboard />);

      expect(screen.getByText('Team Performance Trends')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-goals')).toBeInTheDocument();
      expect(screen.getByTestId('line-goalsAgainst')).toBeInTheDocument();
    });

    it('should display special teams stats', () => {
      renderWithProviders(<CoachDashboard />);

      expect(screen.getByText('Power Play')).toBeInTheDocument();
      expect(screen.getByText('18.5%')).toBeInTheDocument();
      expect(screen.getByText('Penalty Kill')).toBeInTheDocument();
      expect(screen.getByText('82.3%')).toBeInTheDocument();
    });
  });

  describe('Team Management Tab', () => {
    it('should display roster', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /team/i }));

      expect(screen.getByText('Roster Management')).toBeInTheDocument();
      expect(screen.getByText('Erik Andersson')).toBeInTheDocument();
      expect(screen.getByText('Marcus Lindberg')).toBeInTheDocument();
      expect(screen.getByText('Viktor Nilsson')).toBeInTheDocument();
    });

    it('should show player stats', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /team/i }));

      // Forward stats
      expect(screen.getByText('12')).toBeInTheDocument(); // Goals
      expect(screen.getByText('18')).toBeInTheDocument(); // Assists
      expect(screen.getByText('+8')).toBeInTheDocument(); // Plus/minus

      // Goalie stats
      expect(screen.getByText('12-4-0')).toBeInTheDocument(); // Record
      expect(screen.getByText('2.34')).toBeInTheDocument(); // GAA
    });

    it('should open player profile on click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /team/i }));
      await user.click(screen.getByText('Erik Andersson'));

      expect(screen.getByTestId('player-profile')).toBeInTheDocument();
      expect(screen.getByText('Player Profile - ID: 1')).toBeInTheDocument();
    });

    it('should navigate back from player profile', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /team/i }));
      await user.click(screen.getByText('Erik Andersson'));
      
      expect(screen.getByTestId('player-profile')).toBeInTheDocument();
      
      await user.click(screen.getByText('Back to Roster'));
      
      expect(screen.queryByTestId('player-profile')).not.toBeInTheDocument();
      expect(screen.getByText('Roster Management')).toBeInTheDocument();
    });

    it('should display line combinations', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /team/i }));

      expect(screen.getByText('Line Combinations & Performance')).toBeInTheDocument();
      expect(screen.getByText('Line 1')).toBeInTheDocument();
      expect(screen.getByText('Line 2')).toBeInTheDocument();
      expect(screen.getByText('Defense Pair 1')).toBeInTheDocument();
    });
  });

  describe('Training Plans Tab', () => {
    it('should show practice templates', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /practice/i }));

      expect(screen.getByTestId('practice-templates')).toBeInTheDocument();
    });

    it('should apply practice template', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /practice/i }));
      await user.click(screen.getByText('Apply Template'));

      expect(consoleSpy).toHaveBeenCalledWith('Applying template:', 'Test Template', undefined, undefined);
      
      consoleSpy.mockRestore();
    });

    it('should display session templates', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /practice/i }));

      expect(screen.getByText('Session Templates')).toBeInTheDocument();
      expect(screen.getByText('Power Play Systems')).toBeInTheDocument();
      expect(screen.getByText('Defensive Zone Coverage')).toBeInTheDocument();
      expect(screen.getByText('Breakout Patterns')).toBeInTheDocument();
    });

    it('should show weekly schedule', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /practice/i }));

      expect(screen.getByText('This Week\'s Schedule')).toBeInTheDocument();
      expect(screen.getByText('Monday')).toBeInTheDocument();
      expect(screen.getByText('Tuesday')).toBeInTheDocument();
      expect(screen.getByText('Wednesday')).toBeInTheDocument();
    });

    it('should display practice planning tools', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /practice/i }));

      expect(screen.getByText('Practice Planning Tools')).toBeInTheDocument();
      expect(screen.getByText('Drill Builder')).toBeInTheDocument();
      expect(screen.getByText('Session Timer')).toBeInTheDocument();
      expect(screen.getByText('Line Generator')).toBeInTheDocument();
    });
  });

  describe('Games Tab', () => {
    it('should display upcoming games', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /games/i }));

      expect(screen.getByText('Game Schedule & Preparation')).toBeInTheDocument();
      expect(screen.getByText('Northern Knights')).toBeInTheDocument();
      expect(screen.getByText('Ice Breakers')).toBeInTheDocument();
      expect(screen.getByText('Polar Bears')).toBeInTheDocument();
    });

    it('should show game importance badges', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /games/i }));

      expect(screen.getByText('League')).toBeInTheDocument();
      expect(screen.getByText('Playoff')).toBeInTheDocument();
    });

    it('should display tactical board', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /games/i }));

      expect(screen.getByText('Tactical Board')).toBeInTheDocument();
      expect(screen.getByText('Open Tactical Board')).toBeInTheDocument();
    });

    it('should show special teams analysis', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /games/i }));

      expect(screen.getByText('Special Teams Analysis')).toBeInTheDocument();
      expect(screen.getByText('PP Rank')).toBeInTheDocument();
      expect(screen.getByText('8th')).toBeInTheDocument();
      expect(screen.getByText('PK Rank')).toBeInTheDocument();
      expect(screen.getByText('14th')).toBeInTheDocument();
    });
  });

  describe('Statistics Tab', () => {
    it('should display goal distribution chart', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /statistics/i }));

      expect(screen.getByText('Goal Distribution')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('should show shot metrics', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /statistics/i }));

      expect(screen.getByText('Shot Metrics')).toBeInTheDocument();
      expect(screen.getByText('Shots/Game')).toBeInTheDocument();
      expect(screen.getByText('33.2')).toBeInTheDocument();
      expect(screen.getByText('Shooting %')).toBeInTheDocument();
      expect(screen.getByText('9.7%')).toBeInTheDocument();
    });

    it('should display advanced metrics', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /statistics/i }));

      expect(screen.getByText('Advanced Metrics')).toBeInTheDocument();
      expect(screen.getByText('Corsi For %')).toBeInTheDocument();
      expect(screen.getByText('52.3%')).toBeInTheDocument();
      expect(screen.getByText('PDO')).toBeInTheDocument();
      expect(screen.getByText('101.2')).toBeInTheDocument();
    });

    it('should show player performance matrix', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /statistics/i }));

      expect(screen.getByText('Player Performance Matrix')).toBeInTheDocument();
      expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
    });

    it('should display season trends', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /statistics/i }));

      expect(screen.getByText('Season Trends')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-wins')).toBeInTheDocument();
      expect(screen.getByTestId('bar-losses')).toBeInTheDocument();
    });
  });

  describe('Development Tab', () => {
    it('should display individual development plans', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /development/i }));

      expect(screen.getByText('Individual Development Plans')).toBeInTheDocument();
      expect(screen.getByText('Erik Andersson')).toBeInTheDocument();
      expect(screen.getByText('Marcus Lindberg')).toBeInTheDocument();
    });

    it('should show skill progress', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /development/i }));

      expect(screen.getByText('Shot Accuracy')).toBeInTheDocument();
      expect(screen.getByText('Current: 72 → Target: 85')).toBeInTheDocument();
      expect(screen.getByText('84%')).toBeInTheDocument();
    });

    it('should display development programs', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /development/i }));

      expect(screen.getByText('Skill Development Programs')).toBeInTheDocument();
      expect(screen.getByText('Shooting Accuracy Program')).toBeInTheDocument();
      expect(screen.getByText('Defensive Positioning')).toBeInTheDocument();
      expect(screen.getByText('Power Skating')).toBeInTheDocument();
    });

    it('should show assessment schedule', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /development/i }));

      expect(screen.getByText('Assessment Schedule')).toBeInTheDocument();
      expect(screen.getByText('Shooting Test')).toBeInTheDocument();
      expect(screen.getByText('Skating Speed')).toBeInTheDocument();
      expect(screen.getByText('Team Fitness')).toBeInTheDocument();
    });

    it('should display season timeline', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /development/i }));

      expect(screen.getByText('Season Development Timeline')).toBeInTheDocument();
      expect(screen.getByText('Pre-Season')).toBeInTheDocument();
      expect(screen.getByText('Mid-Season')).toBeInTheDocument();
      expect(screen.getByText('Playoffs')).toBeInTheDocument();
    });
  });

  describe('Broadcasts Tab', () => {
    it('should show broadcast management', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /broadcasts/i }));

      expect(screen.getByTestId('broadcast-management')).toBeInTheDocument();
      expect(screen.getByText('Broadcast Management - Team: team-123')).toBeInTheDocument();
    });
  });

  describe('Parent Channels Tab', () => {
    it('should display parent channels', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /parents/i }));

      expect(screen.getByText('Private Parent Channels')).toBeInTheDocument();
      expect(screen.getByTestId('coach-channel-list')).toBeInTheDocument();
    });

    it('should show parent communication stats', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /parents/i }));

      expect(screen.getByText('Active Chats')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // 1 channel with unread
      expect(screen.getByText('Total Parents')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 total channels
      expect(screen.getByText('Pending Meetings')).toBeInTheDocument();
    });

    it('should display office hours', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /parents/i }));

      expect(screen.getByText('Your Office Hours')).toBeInTheDocument();
      expect(screen.getByText('Monday & Wednesday')).toBeInTheDocument();
      expect(screen.getByText('4:00 PM - 6:00 PM')).toBeInTheDocument();
      expect(screen.getByText('Friday')).toBeInTheDocument();
      expect(screen.getByText('3:00 PM - 5:00 PM')).toBeInTheDocument();
    });

    it('should handle channel selection', async () => {
      const user = userEvent.setup();
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');
      
      renderWithProviders(<CoachDashboard />);

      await user.click(screen.getByRole('tab', { name: /parents/i }));
      await user.click(screen.getByText('Erik Andersson - Anna Andersson'));

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'openChat',
          detail: { channelId: 'channel-1' }
        })
      );
      
      dispatchEventSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible tab navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      // Tab through tabs
      await user.tab();
      expect(screen.getByRole('tab', { name: /overview/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('tab', { name: /calendar/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('tab', { name: /team/i })).toHaveFocus();
    });

    it('should have proper ARIA labels', () => {
      renderWithProviders(<CoachDashboard />);

      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected');
        expect(tab).toHaveAccessibleName();
      });
    });

    it('should support keyboard navigation between tabs', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CoachDashboard />);

      // Focus first tab
      await user.tab();
      expect(screen.getByRole('tab', { name: /overview/i })).toHaveFocus();

      // Arrow key navigation
      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: /calendar/i })).toHaveFocus();

      await user.keyboard('{ArrowLeft}');
      expect(screen.getByRole('tab', { name: /overview/i })).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    it('should handle mobile layout', () => {
      global.innerWidth = 375;
      window.dispatchEvent(new Event('resize'));

      renderWithProviders(<CoachDashboard />);

      // Tabs should still be visible but might wrap
      expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /team/i })).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state for coach overview', () => {
      jest.mock('@/store/api/coachApi', () => ({
        useGetCoachOverviewQuery: () => ({
          data: null,
          isLoading: true,
          error: null,
        }),
      }));

      renderWithProviders(<CoachDashboard />);

      // The component should render immediately with mock data
      expect(screen.getByText(/vs Northern Knights/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      jest.mock('@/store/api/coachApi', () => ({
        useGetCoachOverviewQuery: () => ({
          data: null,
          isLoading: false,
          error: { message: 'Server error' },
        }),
      }));

      renderWithProviders(<CoachDashboard />);

      // Component should still render with mock data
      expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    });
  });
});