import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import TrainingSessionViewer from './TrainingSessionViewer';
import trainingSessionViewerReducer, { TrainingSessionViewerState } from './trainingSessionViewerSlice';
import { apiSlice } from '@/store/api/apiSlice';

// Create a mock store for stories with RTK-Query middleware
const createMockStore = (initialState: Partial<TrainingSessionViewerState> = {}) => {
  return configureStore({
    reducer: {
      trainingSessionViewer: trainingSessionViewerReducer,
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
    preloadedState: {
      trainingSessionViewer: {
        displayMode: 'team-selection',
        metricType: 'heartRate',
        fullScreen: false,
        intervals: [],
        ...initialState,
      } as TrainingSessionViewerState,
    },
  });
};

interface StoryArgs {
  initialState?: Partial<TrainingSessionViewerState>;
}

const meta = {
  title: 'Features/TrainingSessionViewer',
  component: TrainingSessionViewer,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story, context) => {
      const args = context.args as StoryArgs | undefined;
      const store = createMockStore(args?.initialState);
      return (
        <Provider store={store}>
          <div className="h-screen">
            <Story />
          </div>
        </Provider>
      );
    },
  ],
} satisfies Meta<typeof TrainingSessionViewer>;

export default meta;
type Story = StoryObj<typeof meta & { args: StoryArgs }>;

// Coach starting a team session
export const CoachTeamSession: Story = {
  args: {
    initialState: {
      displayMode: 'team-selection',
    },
  },
};

// Physical trainer monitoring player metrics
export const PhysicalTrainerMonitoring: Story = {
  args: {
    initialState: {
      selectedTeamId: '2',
      displayMode: 'player-list',
    },
  },
};

// Player doing solo training with intervals
export const PlayerSoloTraining: Story = {
  args: {
    initialState: {
      selectedPlayerId: 'player-123',
      displayMode: 'interval-timer',
      intervals: [
        { phase: 'work', duration: 30 },
        { phase: 'rest', duration: 90 },
        { phase: 'work', duration: 30 },
        { phase: 'rest', duration: 90 },
        { phase: 'work', duration: 30 },
        { phase: 'rest', duration: 90 },
        { phase: 'work', duration: 30 },
        { phase: 'rest', duration: 90 },
      ],
    },
  },
};

// Parent monitoring child's training
export const ParentMonitoring: Story = {
  args: {
    initialState: {
      selectedPlayerId: 'child-456',
      displayMode: 'team-metrics',
    },
  },
};

// Team metrics overview with watts display
export const TeamMetricsView: Story = {
  args: {
    initialState: {
      selectedTeamId: '1',
      displayMode: 'team-metrics',
      metricType: 'watts',
    },
  },
};

// Player program view
export const PlayerProgramView: Story = {
  args: {
    initialState: {
      selectedPlayerId: 'player-789',
      displayMode: 'player-program',
    },
  },
};

// Vacation training scenario with custom intervals
export const VacationTraining: Story = {
  args: {
    initialState: {
      selectedPlayerId: 'vacation-player',
      displayMode: 'interval-timer',
      intervals: [
        { phase: 'work', duration: 45 },
        { phase: 'rest', duration: 15 },
        { phase: 'work', duration: 45 },
        { phase: 'rest', duration: 15 },
        { phase: 'work', duration: 45 },
        { phase: 'rest', duration: 15 },
      ],
    },
  },
};

// Full screen metrics display
export const FullScreenMetrics: Story = {
  args: {
    initialState: {
      selectedTeamId: '1',
      displayMode: 'team-metrics',
      fullScreen: true,
      metricType: 'heartRate',
    },
  },
}; 