import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type DisplayMode =
  | 'team-selection'
  | 'player-list'
  | 'player-program'
  | 'team-metrics'
  | 'interval-timer'
  | 'strength-training';

export interface Interval {
  phase: 'work' | 'rest';
  duration: number; // seconds
}

export interface TrainingSessionViewerState {
  selectedTeamId?: string;
  selectedTeamName?: string;
  selectedPlayerId?: string;
  sessionCategory?: string;
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
    setTeamName(state, action: PayloadAction<string | undefined>) {
      state.selectedTeamName = action.payload;
    },
    setSessionCategory(state, action: PayloadAction<string | undefined>) {
      state.sessionCategory = action.payload;
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
  setTeamName,
  setSessionCategory,
  setPlayer,
  setDisplayMode,
  setMetricType,
  toggleFullScreen,
  setIntervals,
} = trainingSessionViewerSlice.actions;

export default trainingSessionViewerSlice.reducer; 