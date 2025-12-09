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

interface PlayerProgress {
  playerId: string;
  exerciseId?: string;
  completed?: boolean;
  currentExerciseIndex?: number;
  currentSetNumber?: number;
  completionPercentage?: number;
}

interface PlayerMetrics {
  playerId: string;
  metrics: {
    heartRate?: number;
    watts?: number;
    speed?: number;
    distance?: number;
    calories?: number;
    timestamp: number;
  };
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
  viewMode?: string;
  focusedPlayer?: string | null;
  activePlayers?: string[];
  playerProgress?: Record<string, PlayerProgress>;
  playerMetrics?: Record<string, PlayerMetrics['metrics']>;
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
  viewMode: 'grid',
  focusedPlayer: null,
  activePlayers: [],
  playerProgress: {},
  playerMetrics: {},
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
    updatePlayerProgress: (state, action: PayloadAction<PlayerProgress>) => {
      const { playerId, ...progress } = action.payload;
      if (!state.playerProgress) state.playerProgress = {};
      state.playerProgress[playerId] = {
        ...state.playerProgress[playerId],
        ...progress,
      };
    },
    updatePlayerMetrics: (state, action: PayloadAction<PlayerMetrics>) => {
      const { playerId, metrics } = action.payload;
      if (!state.playerMetrics) state.playerMetrics = {};
      state.playerMetrics[playerId] = metrics;
    },
    setViewMode: (state, action: PayloadAction<string>) => {
      state.viewMode = action.payload;
    },
    setFocusedPlayer: (state, action: PayloadAction<string | null>) => {
      state.focusedPlayer = action.payload;
    },
    addActivePlayer: (state, action: PayloadAction<string>) => {
      if (!state.activePlayers) state.activePlayers = [];
      if (!state.activePlayers.includes(action.payload)) {
        state.activePlayers.push(action.payload);
      }
    },
    removeActivePlayer: (state, action: PayloadAction<string>) => {
      if (state.activePlayers) {
        state.activePlayers = state.activePlayers.filter(id => id !== action.payload);
      }
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
  updatePlayerProgress,
  updatePlayerMetrics,
  setViewMode,
  setFocusedPlayer,
  addActivePlayer,
  removeActivePlayer,
  reset,
} = trainingSessionViewerSlice.actions;

export { trainingSessionViewerSlice };
export default trainingSessionViewerSlice.reducer;