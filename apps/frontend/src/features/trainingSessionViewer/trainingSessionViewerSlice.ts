import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type DisplayMode =
  | 'team-selection'
  | 'player-list'
  | 'player-program'
  | 'team-metrics'
  | 'interval-timer';

export interface Interval {
  phase: 'work' | 'rest';
  duration: number; // seconds
}

export interface TrainingSessionViewerState {
  selectedTeamId?: string;
  selectedPlayerId?: string;
  displayMode: DisplayMode;
  metricType: 'heartRate' | 'watts';
  fullScreen: boolean;
  intervals: Interval[];
}

const initialState: TrainingSessionViewerState = {
  displayMode: 'team-selection',
  metricType: 'heartRate',
  fullScreen: false,
  intervals: [],
};

const trainingSessionViewerSlice = createSlice({
  name: 'trainingSessionViewer',
  initialState,
  reducers: {
    setTeam(state, action: PayloadAction<string | undefined>) {
      state.selectedTeamId = action.payload;
      if (action.payload) {
        state.displayMode = 'player-list';
      }
    },
    setPlayer(state, action: PayloadAction<string | undefined>) {
      state.selectedPlayerId = action.payload;
      if (action.payload) {
        state.displayMode = 'player-program';
      }
    },
    setDisplayMode(state, action: PayloadAction<DisplayMode>) {
      state.displayMode = action.payload;
    },
    setMetricType(state, action: PayloadAction<'heartRate' | 'watts'>) {
      state.metricType = action.payload;
    },
    toggleFullScreen(state) {
      state.fullScreen = !state.fullScreen;
    },
    setIntervals(state, action: PayloadAction<Interval[]>) {
      state.intervals = action.payload;
    },
  },
});

export const {
  setTeam,
  setPlayer,
  setDisplayMode,
  setMetricType,
  toggleFullScreen,
  setIntervals,
} = trainingSessionViewerSlice.actions;

export default trainingSessionViewerSlice.reducer; 