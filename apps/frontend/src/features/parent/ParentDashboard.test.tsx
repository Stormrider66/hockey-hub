import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils';
import ParentDashboard from './ParentDashboard';

// Mock the API hook
jest.mock('@/store/api/parentApi', () => ({
  useGetChildOverviewQuery: jest.fn(),
}));

// Mock translations
jest.mock('@hockey-hub/translations', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (options) {
        return `${key} ${JSON.stringify(options)}`;
      }
      return key;
    },
  }),
}));

// Import the mocked hook for type safety
import { useGetChildOverviewQuery } from '@/store/api/parentApi';
const mockedUseGetChildOverviewQuery = useGetChildOverviewQuery as jest.MockedFunction<typeof useGetChildOverviewQuery>;

describe('ParentDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    mockedUseGetChildOverviewQuery.mockReturnValue({
      data: {
        upcoming: [
          { date: "Today", title: "Practice", location: "Main Rink", time: "16:30" },
          { date: "Fri", title: "Home Game", location: "Main Rink", time: "18:00" },
          { date: "Sat", title: "Away Game", location: "North Arena", time: "14:00" },
        ],
        fullSchedule: [
          { date: "Mon", title: "Practice", location: "Main Rink", time: "16:30" },
          { date: "Tue", title: "Practice", location: "Practice Rink", time: "17:00" },
          { date: "Wed", title: "Off", location: "-", time: "-" },
          { date: "Thu", title: "Practice", location: "Main Rink", time: "16:30" },
          { date: "Fri", title: "Home Game", location: "Main Rink", time: "18:00" },
          { date: "Sat", title: "Away Game", location: "North Arena", time: "14:00" },
          { date: "Sun", title: "Team Meeting", location: "Club House", time: "10:00" },
        ],
      },
      isLoading: false,
      error: undefined,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    } as any);
  });

  describe('Basic Rendering', () => {
    it('should render dashboard with title and subtitle', () => {
      renderWithProviders(<ParentDashboard />);
      
      expect(screen.getByText('parent:dashboard.title')).toBeInTheDocument();
      expect(screen.getByText('parent:dashboard.subtitle')).toBeInTheDocument();
    });

    it('should display child selection buttons', () => {
      renderWithProviders(<ParentDashboard />);
      
      expect(screen.getByText('Emma')).toBeInTheDocument();
      expect(screen.getByText('Victor')).toBeInTheDocument();
    });

    it('should display active child information', () => {
      renderWithProviders(<ParentDashboard />);
      
      // Default active child is Emma
      expect(screen.getByText('Emma Johansson')).toBeInTheDocument();
      expect(screen.getByText('U14')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument(); // Jersey number in avatar
    });

    it('should render tabs', () => {
      renderWithProviders(<ParentDashboard />);
      
      expect(screen.getByText('parent:tabs.overview')).toBeInTheDocument();
      expect(screen.getByText('parent:tabs.schedule')).toBeInTheDocument();
    });
  });

  describe('Child Selection', () => {
    it('should switch active child when clicking buttons', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ParentDashboard />);
      
      // Initially Emma is selected
      expect(screen.getByText('Emma Johansson')).toBeInTheDocument();
      
      // Click on Victor
      const victorButton = screen.getByText('Victor');
      await user.click(victorButton);
      
      // Now Victor should be displayed
      expect(screen.getByText('Victor Johansson')).toBeInTheDocument();
      expect(screen.getByText('U12')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument(); // Jersey number
    });

    it('should call API with correct child ID', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ParentDashboard />);
      
      // Initially called with Emma's ID
      expect(mockedUseGetChildOverviewQuery).toHaveBeenCalledWith('c1');
      
      // Click on Victor
      await user.click(screen.getByText('Victor'));
      
      // Should be called with Victor's ID
      expect(mockedUseGetChildOverviewQuery).toHaveBeenCalledWith('c2');
    });
  });

  describe('Overview Tab', () => {
    it('should display upcoming events', () => {
      renderWithProviders(<ParentDashboard />);
      
      expect(screen.getByText('parent:upcomingEvents.title')).toBeInTheDocument();
      expect(screen.getByText('Practice')).toBeInTheDocument();
      expect(screen.getByText('Home Game')).toBeInTheDocument();
      expect(screen.getByText('Today • 16:30')).toBeInTheDocument();
      expect(screen.getByText('Fri • 18:00')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      mockedUseGetChildOverviewQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: undefined,
        isError: false,
        isSuccess: false,
        refetch: jest.fn(),
      } as any);
      
      renderWithProviders(<ParentDashboard />);
      
      expect(screen.getByText('common:loading')).toBeInTheDocument();
    });

    it('should use fallback data when API data is not available', () => {
      mockedUseGetChildOverviewQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: undefined,
        isError: false,
        isSuccess: false,
        refetch: jest.fn(),
      } as any);
      
      renderWithProviders(<ParentDashboard />);
      
      // Should show default fallback events
      expect(screen.getByText('Practice')).toBeInTheDocument();
      expect(screen.getByText('Home Game')).toBeInTheDocument();
    });
  });

  describe('Schedule Tab', () => {
    it('should display quick actions', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ParentDashboard />);
      
      // Switch to schedule tab
      await user.click(screen.getByText('parent:tabs.schedule'));
      
      await waitFor(() => {
        expect(screen.getByText('parent:quickActions.title')).toBeInTheDocument();
        expect(screen.getByText('parent:quickActions.messageCoach')).toBeInTheDocument();
        expect(screen.getByText('parent:quickActions.syncCalendar')).toBeInTheDocument();
      });
    });

    it('should display full schedule', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ParentDashboard />);
      
      // Switch to schedule tab
      await user.click(screen.getByText('parent:tabs.schedule'));
      
      await waitFor(() => {
        expect(screen.getByText('parent:schedule.fullScheduleTitle')).toBeInTheDocument();
        expect(screen.getByText('parent:schedule.nextDays {"days":7}')).toBeInTheDocument();
        
        // Check for schedule items
        expect(screen.getByText('Mon')).toBeInTheDocument();
        expect(screen.getByText('Team Meeting')).toBeInTheDocument();
        expect(screen.getByText('Away Game')).toBeInTheDocument();
      });
    });

    it('should display equipment checklist button', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ParentDashboard />);
      
      await user.click(screen.getByText('parent:tabs.schedule'));
      
      await waitFor(() => {
        expect(screen.getByText('parent:actions.viewEquipmentChecklist')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      mockedUseGetChildOverviewQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('API Error'),
        isError: true,
        isSuccess: false,
        refetch: jest.fn(),
      } as any);
      
      renderWithProviders(<ParentDashboard />);
      
      // Component should still render with fallback data
      expect(screen.getByText('parent:dashboard.title')).toBeInTheDocument();
      expect(screen.getByText('Practice')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible tab navigation', () => {
      renderWithProviders(<ParentDashboard />);
      
      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('should have accessible child selection buttons', () => {
      renderWithProviders(<ParentDashboard />);
      
      const emmaButton = screen.getByText('Emma');
      const victorButton = screen.getByText('Victor');
      
      expect(emmaButton).toHaveAttribute('type', 'button');
      expect(victorButton).toHaveAttribute('type', 'button');
    });
  });
});