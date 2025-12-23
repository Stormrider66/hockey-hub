import React from 'react';
import { screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { renderWithProviders } from '@/testing/test-utils';
import PlayerDashboard from './PlayerDashboard';
import { act } from 'react-dom/test-utils';

// NOTE: This suite targets the legacy `PlayerDashboard` implementation and older API shapes.
// The active, maintained tests for the refactored dashboard live under `src/features/player/__tests__/`.
// Run explicitly with: RUN_LEGACY_PLAYER_DASHBOARD_TESTS=true pnpm turbo run test --filter=hockey-hub-frontend -- --runTestsByPath src/features/player/PlayerDashboard.test.tsx
const describeLegacy = process.env.RUN_LEGACY_PLAYER_DASHBOARD_TESTS === 'true' ? describe : describe.skip;

// Mock next/navigation
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
  useParams: () => ({}),
}));

// Mock translations
jest.mock('@hockey-hub/translations', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

// Mock utils
jest.mock('@/utils/auth', () => ({
  logout: jest.fn(),
}));

// Mock components
jest.mock('@/features/calendar/components/CalendarWidget', () => ({
  __esModule: true,
  default: ({ organizationId, userId, days }: any) => (
    <div data-testid="calendar-widget">
      Calendar Widget - {days} days - User: {userId}
    </div>
  ),
}));

jest.mock('./PlayerCalendarView', () => ({
  PlayerCalendarView: () => (
    <div data-testid="player-calendar-view">
      Player Calendar View
    </div>
  ),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock crypto for secure random generation
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: Uint32Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 0xffffffff);
      }
      return arr;
    },
  },
});

// Mock chart components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children, data }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  AreaChart: ({ children, data }: any) => (
    <div data-testid="area-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  BarChart: ({ children, data }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  ComposedChart: ({ children, data }: any) => (
    <div data-testid="composed-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  RadarChart: ({ children, data }: any) => (
    <div data-testid="radar-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Line: ({ dataKey }: any) => <div data-testid={`line-${dataKey}`} />,
  Area: ({ dataKey }: any) => <div data-testid={`area-${dataKey}`} />,
  Bar: ({ dataKey }: any) => <div data-testid={`bar-${dataKey}`} />,
  Radar: ({ name, dataKey }: any) => <div data-testid={`radar-${name}`} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

// Setup MSW server
const server = setupServer(
  rest.get('http://localhost:3000/api/player/:playerId/overview', (req, res, ctx) => {
    return res(
      ctx.json({
        playerInfo: {
          name: "Erik Johansson",
          number: 10,
          position: "Forward",
          team: "Senior Team",
          age: 22,
          height: "5'11\"",
          weight: "180 lbs",
          organization: "Hockey Club"
        },
        schedule: [
          { time: "15:00", title: "Team Meeting", location: "Video Room", type: "meeting", mandatory: true, notes: "Game plan review" },
          { time: "16:00", title: "Ice Practice", location: "Main Rink", type: "ice-training", mandatory: true, notes: "Power play focus" },
        ],
        upcoming: [
          { date: "Tomorrow", title: "Team Practice", time: "16:00", location: "Main Rink", type: "ice-training", importance: "High" },
        ],
        training: [
          { title: "Leg Strength", due: "Today", progress: 40, type: "strength", description: "Focus on quad development", assignedBy: "Physical Trainer", estimatedTime: "45 min" },
        ],
        developmentGoals: [
          { goal: "Improve shot accuracy", progress: 75, target: "Jun 15", category: "technical", priority: "High", notes: "Focus on wrist shot technique" },
        ],
        wellnessStats: {
          weeklyAverage: {
            sleepQuality: 7.5,
            energyLevel: 8,
            mood: 7.8,
            readinessScore: 82
          },
          trends: [
            { metric: "Sleep Quality", direction: "up", change: 5.2 }
          ],
          recommendations: [
            "Great job maintaining consistent sleep schedule"
          ],
          insights: [
            { type: 'positive', text: 'Your sleep quality has improved this week', icon: jest.fn() }
          ]
        }
      })
    );
  }),

  rest.post('http://localhost:3000/api/player/:playerId/wellness', async (req, res, ctx) => {
    const body = await req.json();
    
    if (!body.entry) {
      return res(
        ctx.status(400),
        ctx.json({ message: 'Wellness entry is required' })
      );
    }

    return res(
      ctx.json({
        success: true,
        wellnessId: 'wellness-123',
        message: 'Wellness data submitted successfully'
      })
    );
  }),

  rest.post('http://localhost:3000/api/player/:playerId/training/complete', async (req, res, ctx) => {
    const body = await req.json();
    
    return res(
      ctx.json({
        success: true,
        trainingId: body.trainingId,
        message: 'Training completed successfully'
      })
    );
  }),

  rest.get('http://localhost:3000/api/training/sessions', (req, res, ctx) => {
    return res(
      ctx.json({
        data: [
          {
            id: 'workout-1',
            title: 'Morning Strength Training',
            type: 'strength',
            status: 'scheduled',
            location: 'Weight Room',
            estimatedDuration: 60,
            description: 'Upper body focus'
          }
        ]
      })
    );
  }),

  rest.get('http://localhost:3000/api/user/dashboard', (req, res, ctx) => {
    return res(
      ctx.json({
        user: { fullName: 'Erik Johansson' },
        teams: [{ name: 'Senior Team' }],
        organization: { name: 'Hockey Club' }
      })
    );
  }),

  rest.get('http://localhost:3000/api/user/statistics', (req, res, ctx) => {
    return res(ctx.json({}));
  }),

  rest.get('http://localhost:3000/api/communication/summary', (req, res, ctx) => {
    return res(ctx.json({}));
  }),

  rest.get('http://localhost:3000/api/statistics/summary', (req, res, ctx) => {
    return res(ctx.json({}));
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  mockPush.mockClear();
  mockLocalStorage.getItem.mockClear();
});
afterAll(() => server.close());

describeLegacy('PlayerDashboard (legacy)', () => {
  beforeEach(() => {
    mockLocalStorage.getItem.mockReturnValue('mock-jwt-token');
  });

  describe('Dashboard Header', () => {
    it('should display player information', async () => {
      renderWithProviders(<PlayerDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Erik Johansson')).toBeInTheDocument();
        expect(screen.getByText('#10')).toBeInTheDocument();
        expect(screen.getByText('Forward')).toBeInTheDocument();
        expect(screen.getByText('Senior Team')).toBeInTheDocument();
      });
    });

    it('should display player details when available', async () => {
      renderWithProviders(<PlayerDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Age 22.*5'11".*180 lbs/)).toBeInTheDocument();
      });
    });

    it('should have coach messages and logout buttons', () => {
      renderWithProviders(<PlayerDashboard />);

      expect(screen.getByRole('button', { name: /coach messages/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });

    it('should logout when logout button is clicked', async () => {
      const user = userEvent.setup();
      const { logout } = require('@/utils/auth');
      
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('button', { name: /logout/i }));

      expect(logout).toHaveBeenCalled();
    });
  });

  describe('Dashboard Tabs', () => {
    it('should render all tabs', () => {
      renderWithProviders(<PlayerDashboard />);

      expect(screen.getByRole('tab', { name: /today/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /training/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /wellness/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /performance/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /calendar/i })).toBeInTheDocument();
    });

    it('should switch between tabs', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      // Default is today tab
      expect(screen.getByText("Today's Schedule")).toBeInTheDocument();

      // Switch to training tab
      await user.click(screen.getByRole('tab', { name: /training/i }));
      expect(screen.getByText('Assigned Training')).toBeInTheDocument();

      // Switch to wellness tab
      await user.click(screen.getByRole('tab', { name: /wellness/i }));
      expect(screen.getByText(/player:wellness.title/i)).toBeInTheDocument();

      // Switch to performance tab
      await user.click(screen.getByRole('tab', { name: /performance/i }));
      expect(screen.getByText('Overall Performance')).toBeInTheDocument();

      // Switch to calendar tab
      await user.click(screen.getByRole('tab', { name: /calendar/i }));
      expect(screen.getByTestId('player-calendar-view')).toBeInTheDocument();
    });
  });

  describe('Today Tab', () => {
    it('should display today\'s schedule', async () => {
      renderWithProviders(<PlayerDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Team Meeting')).toBeInTheDocument();
        expect(screen.getByText('Ice Practice')).toBeInTheDocument();
        expect(screen.getByText('Video Room')).toBeInTheDocument();
        expect(screen.getByText('Main Rink')).toBeInTheDocument();
      });
    });

    it('should show mandatory badges', async () => {
      renderWithProviders(<PlayerDashboard />);

      await waitFor(() => {
        const requiredBadges = screen.getAllByText(/required/i);
        expect(requiredBadges).toHaveLength(2);
      });
    });

    it('should display event notes', async () => {
      renderWithProviders(<PlayerDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Game plan review')).toBeInTheDocument();
        expect(screen.getByText('Power play focus')).toBeInTheDocument();
      });
    });

    it('should display today\'s workouts', async () => {
      renderWithProviders(<PlayerDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Morning Strength Training')).toBeInTheDocument();
        expect(screen.getByText('strength • 60 min')).toBeInTheDocument();
        expect(screen.getByText('Weight Room')).toBeInTheDocument();
      });
    });

    it('should have start workout button', async () => {
      renderWithProviders(<PlayerDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start workout/i })).toBeInTheDocument();
      });
    });

    it('should navigate to workout when start button clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await waitFor(() => {
        const startButton = screen.getByRole('button', { name: /start workout/i });
        expect(startButton).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start workout/i }));

      expect(mockPush).toHaveBeenCalledWith('/player/workout/workout-1');
    });

    it('should display calendar widget', () => {
      renderWithProviders(<PlayerDashboard />);

      expect(screen.getByTestId('calendar-widget')).toBeInTheDocument();
      expect(screen.getByText(/7 days - User: 1/)).toBeInTheDocument();
    });

    it('should display quick wellness check', () => {
      renderWithProviders(<PlayerDashboard />);

      expect(screen.getByText("Today's Readiness")).toBeInTheDocument();
      expect(screen.getByText('Quick wellness status')).toBeInTheDocument();
      expect(screen.getByText(/\d+%/)).toBeInTheDocument();
    });

    it('should navigate to wellness tab when update wellness clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      const updateButton = screen.getByRole('button', { name: /update wellness/i });
      await user.click(updateButton);

      // Should switch to wellness tab
      expect(screen.getByText(/player:wellness.title/i)).toBeInTheDocument();
    });
  });

  describe('Training Tab', () => {
    it('should display assigned training', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /training/i }));

      await waitFor(() => {
        expect(screen.getByText('Leg Strength')).toBeInTheDocument();
        expect(screen.getByText('Focus on quad development')).toBeInTheDocument();
        expect(screen.getByText('Due: Today • Estimated: 45 min')).toBeInTheDocument();
        expect(screen.getByText('Assigned by: Physical Trainer')).toBeInTheDocument();
      });
    });

    it('should show training progress', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /training/i }));

      await waitFor(() => {
        expect(screen.getByText('40%')).toBeInTheDocument();
        expect(screen.getByRole('progressbar', { name: /progress: 40%/i })).toBeInTheDocument();
      });
    });

    it('should have mark complete button', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /training/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /mark complete/i })).toBeInTheDocument();
      });
    });

    it('should complete training when button clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /training/i }));

      await waitFor(() => {
        const completeButton = screen.getByRole('button', { name: /mark complete/i });
        expect(completeButton).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /mark complete/i }));

      // The API should be called
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /mark complete/i })).toBeInTheDocument();
      });
    });

    it('should display development goals', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /training/i }));

      await waitFor(() => {
        expect(screen.getByText('Development Goals')).toBeInTheDocument();
        expect(screen.getByText('Improve shot accuracy')).toBeInTheDocument();
        expect(screen.getByText('Target: Jun 15')).toBeInTheDocument();
        expect(screen.getByText('Focus on wrist shot technique')).toBeInTheDocument();
      });
    });

    it('should show goal progress and priority', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /training/i }));

      await waitFor(() => {
        expect(screen.getByText('75%')).toBeInTheDocument();
        expect(screen.getByText('High')).toBeInTheDocument();
        expect(screen.getByText('technical')).toBeInTheDocument();
      });
    });
  });

  describe('Wellness Tab', () => {
    it('should display wellness overview cards', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /wellness/i }));

      await waitFor(() => {
        expect(screen.getByText(/readiness/i)).toBeInTheDocument();
        expect(screen.getByText('7-Day Average')).toBeInTheDocument();
        expect(screen.getByText('Sleep Average')).toBeInTheDocument();
        expect(screen.getByText('Recovery Status')).toBeInTheDocument();
      });
    });

    it('should display wellness form', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /wellness/i }));

      await waitFor(() => {
        expect(screen.getByLabelText('Sleep Quality')).toBeInTheDocument();
        expect(screen.getByLabelText('Energy Level')).toBeInTheDocument();
        expect(screen.getByLabelText('Mood')).toBeInTheDocument();
        expect(screen.getByLabelText('Sleep Hours')).toBeInTheDocument();
        expect(screen.getByLabelText('Body Weight (lbs)')).toBeInTheDocument();
      });
    });

    it('should display HRV section', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /wellness/i }));

      await waitFor(() => {
        expect(screen.getByText('Heart Rate Variability (HRV)')).toBeInTheDocument();
        expect(screen.getByLabelText('HRV (ms)')).toBeInTheDocument();
        expect(screen.getByLabelText('Measurement Device')).toBeInTheDocument();
      });
    });

    it('should update wellness sliders', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /wellness/i }));

      await waitFor(() => {
        const sliders = screen.getAllByRole('slider');
        expect(sliders.length).toBeGreaterThan(0);
      });

      // Sliders are rendered and can be interacted with
      const firstSlider = screen.getAllByRole('slider')[0];
      expect(firstSlider).toHaveAttribute('aria-valuemax', '10');
      expect(firstSlider).toHaveAttribute('aria-valuemin', '1');
    });

    it('should submit wellness data', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /wellness/i }));

      // Fill some wellness data
      const sleepHoursInput = screen.getByLabelText('Sleep Hours');
      await user.clear(sleepHoursInput);
      await user.type(sleepHoursInput, '8');

      const submitButton = screen.getByRole('button', { name: /wellness.submit/i });
      await user.click(submitButton);

      // Should show processing state
      expect(screen.getByText(/processing/i)).toBeInTheDocument();

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/wellness.submitted/i)).toBeInTheDocument();
      });
    });

    it('should display wellness trends chart', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /wellness/i }));

      await waitFor(() => {
        expect(screen.getByText('Wellness Trends')).toBeInTheDocument();
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });

    it('should switch wellness time ranges', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /wellness/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Week' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Month' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Quarter' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Month' }));
      expect(screen.getByRole('button', { name: 'Month' })).toHaveClass('bg-primary');
    });

    it('should display HRV analysis', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /wellness/i }));

      await waitFor(() => {
        expect(screen.getByText('HRV Analysis')).toBeInTheDocument();
        expect(screen.getByText('Current HRV')).toBeInTheDocument();
        expect(screen.getByText('7-Day Average')).toBeInTheDocument();
        expect(screen.getByText('30-Day Average')).toBeInTheDocument();
      });
    });

    it('should display wellness recommendations', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /wellness/i }));

      await waitFor(() => {
        expect(screen.getByText('Personalized Recommendations')).toBeInTheDocument();
        expect(screen.getByText('Great job maintaining consistent sleep schedule')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Tab', () => {
    it('should display performance overview cards', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /performance/i }));

      await waitFor(() => {
        expect(screen.getByText('Overall Performance')).toBeInTheDocument();
        expect(screen.getByText('Last Test Date')).toBeInTheDocument();
        expect(screen.getByText('Team Ranking')).toBeInTheDocument();
        expect(screen.getByText('Goal Achievement')).toBeInTheDocument();
      });
    });

    it('should display test categories', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /performance/i }));

      await waitFor(() => {
        expect(screen.getByText('Power')).toBeInTheDocument();
        expect(screen.getByText('Speed')).toBeInTheDocument();
        expect(screen.getByText('Strength')).toBeInTheDocument();
        expect(screen.getByText('Endurance')).toBeInTheDocument();
      });
    });

    it('should display test results', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /performance/i }));

      await waitFor(() => {
        expect(screen.getByText('Vertical Jump')).toBeInTheDocument();
        expect(screen.getByText('10m Sprint')).toBeInTheDocument();
        expect(screen.getByText('Squat 1RM')).toBeInTheDocument();
        expect(screen.getByText('VO2 Max')).toBeInTheDocument();
      });
    });

    it('should display performance trends chart', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /performance/i }));

      await waitFor(() => {
        expect(screen.getByText('Performance Trends')).toBeInTheDocument();
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });

    it('should change test metric in trends', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /performance/i }));

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '10m Sprint');

      expect(select).toHaveValue('10m Sprint');
    });

    it('should display performance profile radar chart', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /performance/i }));

      await waitFor(() => {
        expect(screen.getByText('Performance Profile')).toBeInTheDocument();
        expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
      });
    });

    it('should display detailed test results tabs', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /performance/i }));

      await waitFor(() => {
        expect(screen.getByText('Detailed Test Results')).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Recent Tests' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Team Rankings' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Goals & Targets' })).toBeInTheDocument();
      });
    });

    it('should switch between detailed test tabs', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /performance/i }));

      await waitFor(() => {
        const rankingsTab = screen.getByRole('tab', { name: 'Team Rankings' });
        expect(rankingsTab).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: 'Team Rankings' }));

      expect(screen.getByText(/Your rank: #\d+ of 22/)).toBeInTheDocument();
    });

    it('should display training recommendations', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /performance/i }));

      await waitFor(() => {
        expect(screen.getByText('Training Recommendations')).toBeInTheDocument();
        expect(screen.getByText('Focus on Strength')).toBeInTheDocument();
        expect(screen.getByText('Maintain Endurance')).toBeInTheDocument();
      });
    });
  });

  describe('Calendar Tab', () => {
    it('should display player calendar view', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /calendar/i }));

      expect(screen.getByTestId('player-calendar-view')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible tab navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      // Tab through tabs
      await user.tab();
      expect(screen.getByRole('tab', { name: /today/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('tab', { name: /training/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('tab', { name: /wellness/i })).toHaveFocus();
    });

    it('should have proper ARIA labels', () => {
      renderWithProviders(<PlayerDashboard />);

      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected');
        expect(tab).toHaveAccessibleName();
      });
    });

    it('should have accessible form elements', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /wellness/i }));

      await waitFor(() => {
        const inputs = screen.getAllByRole('textbox');
        inputs.forEach(input => {
          expect(input).toHaveAccessibleName();
        });
      });
    });

    it('should announce loading states', async () => {
      server.use(
        rest.get('http://localhost:3000/api/player/:playerId/overview', (req, res, ctx) => {
          return res(ctx.delay(100), ctx.json({}));
        })
      );

      renderWithProviders(<PlayerDashboard />);

      const loadingElement = screen.getByRole('status', { name: /loading schedule/i });
      expect(loadingElement).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      server.use(
        rest.get('http://localhost:3000/api/player/:playerId/overview', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ message: 'Server error' }));
        })
      );

      renderWithProviders(<PlayerDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/messages.error/i)).toBeInTheDocument();
      });
    });

    it('should handle wellness submission error', async () => {
      const user = userEvent.setup();
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

      server.use(
        rest.post('http://localhost:3000/api/player/:playerId/wellness', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({ message: 'Invalid wellness data' })
          );
        })
      );

      renderWithProviders(<PlayerDashboard />);

      await user.click(screen.getByRole('tab', { name: /wellness/i }));

      const submitButton = screen.getByRole('button', { name: /wellness.submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to submit wellness: Invalid wellness data');
      });

      alertSpy.mockRestore();
    });
  });

  describe('Responsive Design', () => {
    it('should handle mobile layout', () => {
      global.innerWidth = 375;
      window.dispatchEvent(new Event('resize'));

      renderWithProviders(<PlayerDashboard />);

      // Tabs should be in grid layout for mobile
      const tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveClass('grid-cols-2');
    });

    it('should stack header elements on mobile', () => {
      global.innerWidth = 375;
      window.dispatchEvent(new Event('resize'));

      renderWithProviders(<PlayerDashboard />);

      const header = screen.getByText('Erik Johansson').closest('div');
      expect(header?.parentElement).toHaveClass('flex-col');
    });
  });

  describe('Integration', () => {
    it('should load all data on mount', async () => {
      renderWithProviders(<PlayerDashboard />);

      await waitFor(() => {
        // Player info loaded
        expect(screen.getByText('Erik Johansson')).toBeInTheDocument();
        // Schedule loaded
        expect(screen.getByText('Team Meeting')).toBeInTheDocument();
        // Workouts loaded
        expect(screen.getByText('Morning Strength Training')).toBeInTheDocument();
      });
    });

    it('should maintain state when switching tabs', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PlayerDashboard />);

      // Go to wellness tab and change a value
      await user.click(screen.getByRole('tab', { name: /wellness/i }));

      const sleepHoursInput = screen.getByLabelText('Sleep Hours');
      await user.clear(sleepHoursInput);
      await user.type(sleepHoursInput, '9');

      // Switch to another tab
      await user.click(screen.getByRole('tab', { name: /today/i }));

      // Switch back to wellness
      await user.click(screen.getByRole('tab', { name: /wellness/i }));

      // Value should be maintained
      expect(screen.getByLabelText('Sleep Hours')).toHaveValue(9);
    });
  });
});