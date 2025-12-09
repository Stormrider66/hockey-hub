import trainingSessionViewerReducer, {
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
  DisplayMode,
  MetricType,
  Interval,
} from './trainingSessionViewerSlice';

describe('trainingSessionViewerSlice', () => {
  const initialState = {
    selectedTeam: null,
    selectedTeamName: null,
    selectedPlayer: null,
    displayMode: 'team-selection' as DisplayMode,
    metricType: 'heartRate' as MetricType,
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

  describe('Team Management', () => {
    it('should handle setTeam', () => {
      const state = trainingSessionViewerReducer(initialState, setTeam('team-123'));
      
      expect(state.selectedTeam).toBe('team-123');
      expect(state.displayMode).toBe('player-list');
    });

    it('should handle setTeamName', () => {
      const state = trainingSessionViewerReducer(initialState, setTeamName('U14 Elite'));
      
      expect(state.selectedTeamName).toBe('U14 Elite');
    });
  });

  describe('Player Management', () => {
    it('should handle setPlayer with player ID', () => {
      const state = trainingSessionViewerReducer(initialState, setPlayer('player-123'));
      
      expect(state.selectedPlayer).toBe('player-123');
      expect(state.displayMode).toBe('player-program');
    });

    it('should handle setPlayer with null (deselect)', () => {
      const stateWithPlayer = {
        ...initialState,
        selectedPlayer: 'player-123',
        displayMode: 'player-program' as DisplayMode,
      };
      
      const state = trainingSessionViewerReducer(stateWithPlayer, setPlayer(null));
      
      expect(state.selectedPlayer).toBeNull();
      expect(state.displayMode).toBe('player-list');
    });

    it('should handle setFocusedPlayer', () => {
      const state = trainingSessionViewerReducer(initialState, setFocusedPlayer('player-456'));
      
      expect(state.focusedPlayer).toBe('player-456');
    });

    it('should handle addActivePlayer', () => {
      const state = trainingSessionViewerReducer(initialState, addActivePlayer('player-123'));
      
      expect(state.activePlayers).toContain('player-123');
      expect(state.activePlayers).toHaveLength(1);
    });

    it('should not add duplicate active players', () => {
      const stateWithPlayer = {
        ...initialState,
        activePlayers: ['player-123'],
      };
      
      const state = trainingSessionViewerReducer(stateWithPlayer, addActivePlayer('player-123'));
      
      expect(state.activePlayers).toHaveLength(1);
      expect(state.activePlayers).toEqual(['player-123']);
    });

    it('should handle removeActivePlayer', () => {
      const stateWithPlayers = {
        ...initialState,
        activePlayers: ['player-123', 'player-456'],
      };
      
      const state = trainingSessionViewerReducer(stateWithPlayers, removeActivePlayer('player-123'));
      
      expect(state.activePlayers).not.toContain('player-123');
      expect(state.activePlayers).toContain('player-456');
      expect(state.activePlayers).toHaveLength(1);
    });
  });

  describe('Display Mode Management', () => {
    it('should handle setDisplayMode', () => {
      const state = trainingSessionViewerReducer(initialState, setDisplayMode('team-metrics'));
      
      expect(state.displayMode).toBe('team-metrics');
    });

    it('should reset selectedPlayer when changing to non-player-program mode', () => {
      const stateWithPlayer = {
        ...initialState,
        selectedPlayer: 'player-123',
        displayMode: 'player-program' as DisplayMode,
      };
      
      const state = trainingSessionViewerReducer(stateWithPlayer, setDisplayMode('team-metrics'));
      
      expect(state.selectedPlayer).toBeNull();
      expect(state.displayMode).toBe('team-metrics');
    });

    it('should handle setMetricType', () => {
      const state = trainingSessionViewerReducer(initialState, setMetricType('watts'));
      
      expect(state.metricType).toBe('watts');
    });

    it('should handle toggleFullscreen', () => {
      const state1 = trainingSessionViewerReducer(initialState, toggleFullscreen());
      expect(state1.isFullscreen).toBe(true);
      
      const state2 = trainingSessionViewerReducer(state1, toggleFullscreen());
      expect(state2.isFullscreen).toBe(false);
    });

    it('should handle setViewMode', () => {
      const state = trainingSessionViewerReducer(initialState, setViewMode('list'));
      
      expect(state.viewMode).toBe('list');
    });
  });

  describe('Interval Timer Management', () => {
    const testIntervals: Interval[] = [
      { phase: 'work', duration: 30 },
      { phase: 'rest', duration: 10 },
      { phase: 'work', duration: 30 },
      { phase: 'rest', duration: 10 },
    ];

    it('should handle setIntervals', () => {
      const state = trainingSessionViewerReducer(initialState, setIntervals(testIntervals));
      
      expect(state.intervals).toEqual(testIntervals);
      expect(state.currentIntervalIndex).toBe(0);
    });

    it('should handle setCurrentInterval', () => {
      const stateWithIntervals = {
        ...initialState,
        intervals: testIntervals,
      };
      
      const state = trainingSessionViewerReducer(stateWithIntervals, setCurrentInterval(2));
      
      expect(state.currentIntervalIndex).toBe(2);
    });

    it('should handle nextInterval', () => {
      const stateWithIntervals = {
        ...initialState,
        intervals: testIntervals,
        currentIntervalIndex: 1,
      };
      
      const state = trainingSessionViewerReducer(stateWithIntervals, nextInterval());
      
      expect(state.currentIntervalIndex).toBe(2);
    });

    it('should not advance past last interval', () => {
      const stateWithIntervals = {
        ...initialState,
        intervals: testIntervals,
        currentIntervalIndex: 3, // Last index
      };
      
      const state = trainingSessionViewerReducer(stateWithIntervals, nextInterval());
      
      expect(state.currentIntervalIndex).toBe(3); // Should remain at last index
    });

    it('should handle startIntervalTimer', () => {
      const state = trainingSessionViewerReducer(initialState, startIntervalTimer());
      
      expect(state.intervalTimerActive).toBe(true);
      expect(state.displayMode).toBe('interval-timer');
    });

    it('should handle stopIntervalTimer', () => {
      const activeState = {
        ...initialState,
        intervalTimerActive: true,
        currentIntervalIndex: 2,
        displayMode: 'interval-timer' as DisplayMode,
      };
      
      const state = trainingSessionViewerReducer(activeState, stopIntervalTimer());
      
      expect(state.intervalTimerActive).toBe(false);
      expect(state.currentIntervalIndex).toBe(0);
    });
  });

  describe('Session Management', () => {
    it('should handle setSessionCategory', () => {
      const state = trainingSessionViewerReducer(initialState, setSessionCategory('strength'));
      
      expect(state.sessionCategory).toBe('strength');
    });
  });

  describe('Player Progress and Metrics', () => {
    it('should handle updatePlayerProgress', () => {
      const state = trainingSessionViewerReducer(initialState, updatePlayerProgress({
        playerId: 'player-123',
        exerciseId: 'exercise-456',
        completed: false,
        currentExerciseIndex: 2,
        currentSetNumber: 3,
        completionPercentage: 75,
      }));
      
      expect(state.playerProgress?.['player-123']).toEqual({
        exerciseId: 'exercise-456',
        completed: false,
        currentExerciseIndex: 2,
        currentSetNumber: 3,
        completionPercentage: 75,
      });
    });

    it('should merge player progress updates', () => {
      const stateWithProgress = {
        ...initialState,
        playerProgress: {
          'player-123': {
            exerciseId: 'exercise-456',
            completed: false,
            currentExerciseIndex: 2,
          },
        },
      };
      
      const state = trainingSessionViewerReducer(stateWithProgress, updatePlayerProgress({
        playerId: 'player-123',
        completed: true,
        completionPercentage: 100,
      }));
      
      expect(state.playerProgress?.['player-123']).toEqual({
        exerciseId: 'exercise-456',
        completed: true,
        currentExerciseIndex: 2,
        completionPercentage: 100,
      });
    });

    it('should handle updatePlayerMetrics', () => {
      const metrics = {
        heartRate: 165,
        watts: 250,
        distance: 1200,
      };
      
      const state = trainingSessionViewerReducer(initialState, updatePlayerMetrics({
        playerId: 'player-123',
        metrics,
      }));
      
      expect(state.playerMetrics?.['player-123']).toEqual(metrics);
    });

    it('should replace player metrics (not merge)', () => {
      const stateWithMetrics = {
        ...initialState,
        playerMetrics: {
          'player-123': {
            heartRate: 150,
            watts: 200,
          },
        },
      };
      
      const newMetrics = {
        heartRate: 165,
        distance: 1200,
      };
      
      const state = trainingSessionViewerReducer(stateWithMetrics, updatePlayerMetrics({
        playerId: 'player-123',
        metrics: newMetrics,
      }));
      
      expect(state.playerMetrics?.['player-123']).toEqual(newMetrics);
      expect(state.playerMetrics?.['player-123'].watts).toBeUndefined();
    });
  });

  describe('Reset', () => {
    it('should reset to initial state', () => {
      const modifiedState = {
        selectedTeam: 'team-123',
        selectedTeamName: 'U14 Elite',
        selectedPlayer: 'player-456',
        displayMode: 'player-program' as DisplayMode,
        metricType: 'watts' as MetricType,
        isFullscreen: true,
        intervals: [{ phase: 'work' as const, duration: 30 }],
        currentIntervalIndex: 2,
        intervalTimerActive: true,
        sessionCategory: 'strength',
        viewMode: 'list',
        focusedPlayer: 'player-789',
        activePlayers: ['player-123', 'player-456'],
        playerProgress: { 'player-123': { completed: true } },
        playerMetrics: { 'player-123': { heartRate: 165 } },
      };
      
      const state = trainingSessionViewerReducer(modifiedState, reset());
      
      expect(state).toEqual(initialState);
    });
  });
});