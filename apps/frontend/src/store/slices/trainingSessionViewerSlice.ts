import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type DisplayMode = 
  | 'team-selection' 
  | 'player-list' 
  | 'player-program' 
  | 'team-metrics' 
  | 'interval-timer';

export type MetricType = 'heartRate' | 'watts';

export interface Interval {
  phase: 'work' | 'rest';
  duration: number; // seconds
}

interface TrainingSessionViewerState {
  selectedTeam: string | null;
  selectedTeamName: string | null;
  selectedPlayer: string | null;
  displayMode: DisplayMode;
  metricType: MetricType;
  isFullscreen: boolean;
  intervals: Interval[];
  currentIntervalIndex: number;
  intervalTimerActive: boolean;
  sessionCategory: string | null;
}

const initialState: TrainingSessionViewerState = {
  selectedTeam: null,
  selectedTeamName: null,
  selectedPlayer: null,
  displayMode: 'team-selection',
  metricType: 'heartRate',
  isFullscreen: false,
  intervals: [],
  currentIntervalIndex: 0,
  intervalTimerActive: false,
  sessionCategory: null,
};

const trainingSessionViewerSlice = createSlice({
  name: 'trainingSessionViewer',
  initialState,
  reducers: {
    setTeam: (state, action: PayloadAction<string>) => {
      state.selectedTeam = action.payload;
      state.displayMode = 'player-list';
    },
    setTeamName: (state, action: PayloadAction<string>) => {
      state.selectedTeamName = action.payload;
    },
    setPlayer: (state, action: PayloadAction<string | null>) => {
      state.selectedPlayer = action.payload;
      if (action.payload) {
        state.displayMode = 'player-program';
      } else {
        state.displayMode = 'player-list';
      }
    },
    setDisplayMode: (state, action: PayloadAction<DisplayMode>) => {
      state.displayMode = action.payload;
      // Reset player selection when changing modes
      if (action.payload !== 'player-program') {
        state.selectedPlayer = null;
      }
    },
    setMetricType: (state, action: PayloadAction<MetricType>) => {
      state.metricType = action.payload;
    },
    toggleFullscreen: (state) => {
      state.isFullscreen = !state.isFullscreen;
    },
    setIntervals: (state, action: PayloadAction<Interval[]>) => {
      state.intervals = action.payload;
      state.currentIntervalIndex = 0;
    },
    setCurrentInterval: (state, action: PayloadAction<number>) => {
      state.currentIntervalIndex = action.payload;
    },
    nextInterval: (state) => {
      if (state.currentIntervalIndex < state.intervals.length - 1) {
        state.currentIntervalIndex += 1;
      }
    },
    startIntervalTimer: (state) => {
      state.intervalTimerActive = true;
      state.displayMode = 'interval-timer';
    },
    stopIntervalTimer: (state) => {
      state.intervalTimerActive = false;
      state.currentIntervalIndex = 0;
    },
    setSessionCategory: (state, action: PayloadAction<string>) => {
      state.sessionCategory = action.payload;
    },
    reset: () => initialState,
  },
});

export const {
  setTeam,
  setTeamName,
  setPlayer,
  setDisplayMode,
  setMetricType,
  toggleFullscreen,
  setIntervals,
  setCurrentInterval,
  nextInterval,
  startIntervalTimer,
  stopIntervalTimer,
  setSessionCategory,
  reset,
} = trainingSessionViewerSlice.actions;

export default trainingSessionViewerSlice.reducer;