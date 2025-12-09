import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { 
  WorkoutType, 
  WorkoutSession, 
  Exercise,
  IntervalProgram,
  HybridWorkout,
  AgilityWorkout,
  Player,
  Team,
  ValidationResult,
  ValidationError
} from '@/features/physical-trainer/types';
import { RootState } from '../store';

// Types for the workout builder state
interface WorkoutDraft {
  id: string;
  type: WorkoutType;
  data: Partial<WorkoutSession>;
  players: Player[];
  teams: Team[];
  lastModified: number;
  isDirty: boolean;
  validationResults?: ValidationResult;
}

interface UIState {
  activeTab: string;
  selectedWorkoutId: string | null;
  isTemplateModalOpen: boolean;
  isScheduleModalOpen: boolean;
  isSuccessModalOpen: boolean;
  isMedicalReportOpen: boolean;
  selectedPlayerId: string | null;
}

interface HistoryEntry {
  workoutId: string;
  state: WorkoutDraft;
  timestamp: number;
}

interface RecentWorkout {
  id: string;
  name: string;
  type: WorkoutType;
  createdAt: string;
  lastUsed?: string;
  playerCount: number;
  teamCount: number;
  duration: number;
  isFavorite?: boolean;
  usageCount: number;
  successRate?: number;
  templateId?: string;
}

interface WorkoutBuilderState {
  // Active workout sessions by ID
  workouts: Record<string, WorkoutDraft>;
  
  // History for undo/redo
  history: {
    past: HistoryEntry[];
    future: HistoryEntry[];
    currentIndex: number;
  };
  
  // UI state
  ui: UIState;
  
  // Global state
  isAutoSaveEnabled: boolean;
  lastAutoSave: number | null;
  pendingSaves: string[]; // workout IDs with pending saves
  
  // Offline queue
  offlineQueue: {
    workoutId: string;
    action: 'create' | 'update' | 'delete';
    data: any;
    timestamp: number;
  }[];
  
  // Recent workouts tracking
  recentWorkouts: RecentWorkout[];
  favoriteWorkoutIds: string[];
  
  // Template favorites
  favoriteTemplateIds: string[];
}

// Initial state
const initialState: WorkoutBuilderState = {
  workouts: {},
  history: {
    past: [],
    future: [],
    currentIndex: -1
  },
  ui: {
    activeTab: 'details',
    selectedWorkoutId: null,
    isTemplateModalOpen: false,
    isScheduleModalOpen: false,
    isSuccessModalOpen: false,
    isMedicalReportOpen: false,
    selectedPlayerId: null
  },
  isAutoSaveEnabled: true,
  lastAutoSave: null,
  pendingSaves: [],
  offlineQueue: [],
  recentWorkouts: [],
  favoriteWorkoutIds: [],
  favoriteTemplateIds: []
};

// Helper functions
const generateWorkoutId = (type: WorkoutType) => {
  return `${type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const createHistoryEntry = (workoutId: string, draft: WorkoutDraft): HistoryEntry => ({
  workoutId,
  state: JSON.parse(JSON.stringify(draft)), // Deep clone
  timestamp: Date.now()
});

const validateWorkout = (draft: WorkoutDraft): ValidationResult => {
  const errors: ValidationError[] = [];
  
  // Basic validation
  if (!draft.data.name?.trim()) {
    errors.push({ field: 'name', message: 'Workout name is required' });
  }
  
  if (!draft.data.date) {
    errors.push({ field: 'date', message: 'Workout date is required' });
  }
  
  // Type-specific validation
  switch (draft.type) {
    case WorkoutType.STRENGTH:
      if (!draft.data.exercises || draft.data.exercises.length === 0) {
        errors.push({ field: 'exercises', message: 'At least one exercise is required' });
      }
      break;
      
    case WorkoutType.CONDITIONING:
      if (!draft.data.intervalProgram?.intervals || draft.data.intervalProgram.intervals.length === 0) {
        errors.push({ field: 'intervals', message: 'At least one interval is required' });
      }
      break;
      
    case WorkoutType.HYBRID:
      if (!draft.data.hybridData?.blocks || draft.data.hybridData.blocks.length === 0) {
        errors.push({ field: 'blocks', message: 'At least one block is required' });
      }
      break;
      
    case WorkoutType.AGILITY:
      if (!draft.data.agilityData?.drills || draft.data.agilityData.drills.length === 0) {
        errors.push({ field: 'drills', message: 'At least one drill is required' });
      }
      break;
  }
  
  // Player assignment validation
  if (draft.players.length === 0 && draft.teams.length === 0) {
    errors.push({ field: 'assignments', message: 'At least one player or team must be assigned' });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
};

// The slice
const workoutBuilderSlice = createSlice({
  name: 'workoutBuilder',
  initialState,
  reducers: {
    // Workout CRUD operations
    createWorkout: (state, action: PayloadAction<{ type: WorkoutType; data?: Partial<WorkoutSession> }>) => {
      const { type, data = {} } = action.payload;
      const id = generateWorkoutId(type);
      
      const draft: WorkoutDraft = {
        id,
        type,
        data: {
          ...data,
          type,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        players: [],
        teams: [],
        lastModified: Date.now(),
        isDirty: false
      };
      
      state.workouts[id] = draft;
      state.ui.selectedWorkoutId = id;
      
      // Add to history
      const historyEntry = createHistoryEntry(id, draft);
      state.history.past.push(historyEntry);
      state.history.currentIndex = state.history.past.length - 1;
    },
    
    updateWorkoutData: (state, action: PayloadAction<{ id: string; updates: Partial<WorkoutSession> }>) => {
      const { id, updates } = action.payload;
      const workout = state.workouts[id];
      
      if (workout) {
        // Save current state to history before updating
        const historyEntry = createHistoryEntry(id, workout);
        state.history.past.push(historyEntry);
        state.history.currentIndex = state.history.past.length - 1;
        state.history.future = []; // Clear future history
        
        // Update workout
        workout.data = { ...workout.data, ...updates, updatedAt: new Date().toISOString() };
        workout.lastModified = Date.now();
        workout.isDirty = true;
        
        // Validate
        workout.validationResults = validateWorkout(workout);
      }
    },
    
    saveWorkout: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const workout = state.workouts[id];
      
      if (workout) {
        workout.isDirty = false;
        state.lastAutoSave = Date.now();
        state.pendingSaves = state.pendingSaves.filter(wId => wId !== id);
      }
    },
    
    deleteWorkout: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      delete state.workouts[id];
      
      if (state.ui.selectedWorkoutId === id) {
        state.ui.selectedWorkoutId = null;
      }
      
      // Remove from pending saves
      state.pendingSaves = state.pendingSaves.filter(wId => wId !== id);
    },
    
    // Player/Team management
    addPlayer: (state, action: PayloadAction<{ workoutId: string; player: Player }>) => {
      const { workoutId, player } = action.payload;
      const workout = state.workouts[workoutId];
      
      if (workout && !workout.players.find(p => p.id === player.id)) {
        workout.players.push(player);
        workout.isDirty = true;
        workout.lastModified = Date.now();
      }
    },
    
    removePlayer: (state, action: PayloadAction<{ workoutId: string; playerId: string }>) => {
      const { workoutId, playerId } = action.payload;
      const workout = state.workouts[workoutId];
      
      if (workout) {
        workout.players = workout.players.filter(p => p.id !== playerId);
        workout.isDirty = true;
        workout.lastModified = Date.now();
      }
    },
    
    addTeam: (state, action: PayloadAction<{ workoutId: string; team: Team }>) => {
      const { workoutId, team } = action.payload;
      const workout = state.workouts[workoutId];
      
      if (workout && !workout.teams.find(t => t.id === team.id)) {
        workout.teams.push(team);
        workout.isDirty = true;
        workout.lastModified = Date.now();
      }
    },
    
    removeTeam: (state, action: PayloadAction<{ workoutId: string; teamId: string }>) => {
      const { workoutId, teamId } = action.payload;
      const workout = state.workouts[workoutId];
      
      if (workout) {
        workout.teams = workout.teams.filter(t => t.id !== teamId);
        workout.isDirty = true;
        workout.lastModified = Date.now();
      }
    },
    
    // Undo/Redo operations
    undo: (state) => {
      if (state.history.currentIndex > 0) {
        state.history.currentIndex--;
        const entry = state.history.past[state.history.currentIndex];
        
        if (entry) {
          // Save current state to future
          const currentWorkout = state.workouts[entry.workoutId];
          if (currentWorkout) {
            state.history.future.unshift(createHistoryEntry(entry.workoutId, currentWorkout));
          }
          
          // Restore previous state
          state.workouts[entry.workoutId] = JSON.parse(JSON.stringify(entry.state));
        }
      }
    },
    
    redo: (state) => {
      if (state.history.future.length > 0) {
        const entry = state.history.future.shift();
        
        if (entry) {
          // Save current state to past
          const currentWorkout = state.workouts[entry.workoutId];
          if (currentWorkout) {
            state.history.past.push(createHistoryEntry(entry.workoutId, currentWorkout));
            state.history.currentIndex++;
          }
          
          // Restore future state
          state.workouts[entry.workoutId] = JSON.parse(JSON.stringify(entry.state));
        }
      }
    },
    
    // Validation
    setValidationResults: (state, action: PayloadAction<{ workoutId: string; results: ValidationResult }>) => {
      const { workoutId, results } = action.payload;
      const workout = state.workouts[workoutId];
      
      if (workout) {
        workout.validationResults = results;
      }
    },
    
    // UI State
    updateUIState: (state, action: PayloadAction<Partial<UIState>>) => {
      state.ui = { ...state.ui, ...action.payload };
    },
    
    // Auto-save
    toggleAutoSave: (state) => {
      state.isAutoSaveEnabled = !state.isAutoSaveEnabled;
    },
    
    markForAutoSave: (state, action: PayloadAction<string>) => {
      const workoutId = action.payload;
      if (!state.pendingSaves.includes(workoutId)) {
        state.pendingSaves.push(workoutId);
      }
    },
    
    // Offline queue
    addToOfflineQueue: (state, action: PayloadAction<{
      workoutId: string;
      action: 'create' | 'update' | 'delete';
      data: any;
    }>) => {
      state.offlineQueue.push({
        ...action.payload,
        timestamp: Date.now()
      });
    },
    
    removeFromOfflineQueue: (state, action: PayloadAction<string>) => {
      state.offlineQueue = state.offlineQueue.filter(item => item.workoutId !== action.payload);
    },
    
    clearOfflineQueue: (state) => {
      state.offlineQueue = [];
    },
    
    // Bulk operations
    importWorkouts: (state, action: PayloadAction<WorkoutDraft[]>) => {
      action.payload.forEach(workout => {
        state.workouts[workout.id] = workout;
      });
    },
    
    clearAllWorkouts: (state) => {
      state.workouts = {};
      state.history = initialState.history;
      state.ui.selectedWorkoutId = null;
      state.pendingSaves = [];
    },
    
    // Recent workouts management
    addToRecentWorkouts: (state, action: PayloadAction<RecentWorkout>) => {
      const workout = action.payload;
      
      // Remove if already exists
      state.recentWorkouts = state.recentWorkouts.filter(w => w.id !== workout.id);
      
      // Add to beginning
      state.recentWorkouts.unshift(workout);
      
      // Keep only last 10
      if (state.recentWorkouts.length > 10) {
        state.recentWorkouts = state.recentWorkouts.slice(0, 10);
      }
    },
    
    updateRecentWorkout: (state, action: PayloadAction<{ id: string; updates: Partial<RecentWorkout> }>) => {
      const { id, updates } = action.payload;
      const index = state.recentWorkouts.findIndex(w => w.id === id);
      
      if (index !== -1) {
        state.recentWorkouts[index] = {
          ...state.recentWorkouts[index],
          ...updates,
          lastUsed: new Date().toISOString()
        };
      }
    },
    
    toggleWorkoutFavorite: (state, action: PayloadAction<string>) => {
      const workoutId = action.payload;
      const index = state.favoriteWorkoutIds.indexOf(workoutId);
      
      if (index === -1) {
        state.favoriteWorkoutIds.push(workoutId);
      } else {
        state.favoriteWorkoutIds.splice(index, 1);
      }
      
      // Update in recent workouts
      const recentIndex = state.recentWorkouts.findIndex(w => w.id === workoutId);
      if (recentIndex !== -1) {
        state.recentWorkouts[recentIndex].isFavorite = index === -1;
      }
    },
    
    toggleTemplateFavorite: (state, action: PayloadAction<string>) => {
      const templateId = action.payload;
      const index = state.favoriteTemplateIds.indexOf(templateId);
      
      if (index === -1) {
        state.favoriteTemplateIds.push(templateId);
      } else {
        state.favoriteTemplateIds.splice(index, 1);
      }
    },
    
    incrementWorkoutUsage: (state, action: PayloadAction<string>) => {
      const workoutId = action.payload;
      const workout = state.recentWorkouts.find(w => w.id === workoutId);
      
      if (workout) {
        workout.usageCount += 1;
        workout.lastUsed = new Date().toISOString();
      }
    }
  }
});

// Export actions
export const {
  createWorkout,
  updateWorkoutData,
  saveWorkout,
  deleteWorkout,
  addPlayer,
  removePlayer,
  addTeam,
  removeTeam,
  undo,
  redo,
  setValidationResults,
  updateUIState,
  toggleAutoSave,
  markForAutoSave,
  addToOfflineQueue,
  removeFromOfflineQueue,
  clearOfflineQueue,
  importWorkouts,
  clearAllWorkouts,
  addToRecentWorkouts,
  updateRecentWorkout,
  toggleWorkoutFavorite,
  toggleTemplateFavorite,
  incrementWorkoutUsage
} = workoutBuilderSlice.actions;

// Selectors
export const selectWorkoutById = (workoutId: string) => (state: RootState) => 
  state.workoutBuilder.workouts[workoutId];

export const selectActiveWorkouts = createSelector(
  [(state: RootState) => state.workoutBuilder.workouts],
  (workouts) => Object.values(workouts).filter(w => w.isDirty)
);

export const selectWorkoutsByType = (type: WorkoutType) => createSelector(
  [(state: RootState) => state.workoutBuilder.workouts],
  (workouts) => Object.values(workouts).filter(w => w.type === type)
);

export const selectAssignedPlayers = (workoutId: string) => createSelector(
  [(state: RootState) => state.workoutBuilder.workouts[workoutId]],
  (workout) => workout?.players || []
);

export const selectAssignedTeams = (workoutId: string) => createSelector(
  [(state: RootState) => state.workoutBuilder.workouts[workoutId]],
  (workout) => workout?.teams || []
);

export const selectValidationErrors = (workoutId: string) => createSelector(
  [(state: RootState) => state.workoutBuilder.workouts[workoutId]],
  (workout) => workout?.validationResults?.errors || []
);

export const selectUnsavedChanges = createSelector(
  [(state: RootState) => state.workoutBuilder.workouts],
  (workouts) => Object.values(workouts).filter(w => w.isDirty)
);

export const selectCanUndo = (state: RootState) => 
  state.workoutBuilder.history.currentIndex > 0;

export const selectCanRedo = (state: RootState) => 
  state.workoutBuilder.history.future.length > 0;

export const selectUIState = (state: RootState) => state.workoutBuilder.ui;

export const selectIsAutoSaveEnabled = (state: RootState) => 
  state.workoutBuilder.isAutoSaveEnabled;

export const selectPendingSaves = (state: RootState) => 
  state.workoutBuilder.pendingSaves;

export const selectOfflineQueue = (state: RootState) => 
  state.workoutBuilder.offlineQueue;

export const selectRecentWorkouts = (state: RootState) => 
  state.workoutBuilder.recentWorkouts;

export const selectFavoriteWorkouts = createSelector(
  [(state: RootState) => state.workoutBuilder.recentWorkouts,
   (state: RootState) => state.workoutBuilder.favoriteWorkoutIds],
  (workouts, favoriteIds) => workouts.filter(w => favoriteIds.includes(w.id))
);

export const selectRecentWorkoutsByType = (type: WorkoutType) => createSelector(
  [(state: RootState) => state.workoutBuilder.recentWorkouts],
  (workouts) => workouts.filter(w => w.type === type)
);

export const selectIsWorkoutFavorite = (workoutId: string) => (state: RootState) =>
  state.workoutBuilder.favoriteWorkoutIds.includes(workoutId);

export const selectIsTemplateFavorite = (templateId: string) => (state: RootState) =>
  state.workoutBuilder.favoriteTemplateIds.includes(templateId);

export const selectFavoriteWorkoutIds = (state: RootState) =>
  state.workoutBuilder.favoriteWorkoutIds;

export const selectFavoriteTemplateIds = (state: RootState) =>
  state.workoutBuilder.favoriteTemplateIds;

// Complex selectors
export const selectWorkoutCompleteness = (workoutId: string) => createSelector(
  [(state: RootState) => state.workoutBuilder.workouts[workoutId]],
  (workout) => {
    if (!workout) return 0;
    
    let completedFields = 0;
    let totalFields = 0;
    
    // Basic fields
    if (workout.data.name) completedFields++;
    totalFields++;
    
    if (workout.data.date) completedFields++;
    totalFields++;
    
    if (workout.data.duration) completedFields++;
    totalFields++;
    
    // Type-specific fields
    switch (workout.type) {
      case WorkoutType.STRENGTH:
        if (workout.data.exercises && workout.data.exercises.length > 0) completedFields++;
        totalFields++;
        break;
        
      case WorkoutType.CONDITIONING:
        if (workout.data.intervalProgram?.intervals?.length > 0) completedFields++;
        totalFields++;
        break;
        
      case WorkoutType.HYBRID:
        if (workout.data.hybridData?.blocks?.length > 0) completedFields++;
        totalFields++;
        break;
        
      case WorkoutType.AGILITY:
        if (workout.data.agilityData?.drills?.length > 0) completedFields++;
        totalFields++;
        break;
    }
    
    // Assignments
    if (workout.players.length > 0 || workout.teams.length > 0) completedFields++;
    totalFields++;
    
    return Math.round((completedFields / totalFields) * 100);
  }
);

export const selectTotalAssignedPlayers = (workoutId: string) => createSelector(
  [
    (state: RootState) => state.workoutBuilder.workouts[workoutId]?.players || [],
    (state: RootState) => state.workoutBuilder.workouts[workoutId]?.teams || []
  ],
  (players, teams) => {
    // Calculate total based on individual players + team member counts
    const individualCount = players.length;
    const teamMemberCount = teams.reduce((total, team) => total + (team.playerCount || 0), 0);
    return individualCount + teamMemberCount;
  }
);

// Persistence helpers
export const persistState = (state: WorkoutBuilderState) => {
  try {
    // Persist drafts to localStorage
    const drafts = Object.values(state.workouts).filter(w => w.isDirty);
    localStorage.setItem('workoutBuilder_drafts', JSON.stringify(drafts));
    
    // Persist UI state to sessionStorage
    sessionStorage.setItem('workoutBuilder_ui', JSON.stringify(state.ui));
    
    // Persist offline queue to IndexedDB (implementation would go here)
    // For now, use localStorage
    localStorage.setItem('workoutBuilder_offlineQueue', JSON.stringify(state.offlineQueue));
  } catch (error) {
    console.error('Failed to persist workout builder state:', error);
  }
};

export const loadPersistedState = (): Partial<WorkoutBuilderState> => {
  try {
    const drafts = localStorage.getItem('workoutBuilder_drafts');
    const ui = sessionStorage.getItem('workoutBuilder_ui');
    const offlineQueue = localStorage.getItem('workoutBuilder_offlineQueue');
    
    const state: Partial<WorkoutBuilderState> = {};
    
    if (drafts) {
      const parsedDrafts = JSON.parse(drafts) as WorkoutDraft[];
      state.workouts = parsedDrafts.reduce((acc, draft) => {
        acc[draft.id] = draft;
        return acc;
      }, {} as Record<string, WorkoutDraft>);
    }
    
    if (ui) {
      state.ui = JSON.parse(ui);
    }
    
    if (offlineQueue) {
      state.offlineQueue = JSON.parse(offlineQueue);
    }
    
    return state;
  } catch (error) {
    console.error('Failed to load persisted workout builder state:', error);
    return {};
  }
};

// Cleanup helper
export const cleanupPersistedState = (olderThan: number = 7 * 24 * 60 * 60 * 1000) => {
  try {
    const drafts = localStorage.getItem('workoutBuilder_drafts');
    if (drafts) {
      const parsedDrafts = JSON.parse(drafts) as WorkoutDraft[];
      const cutoffTime = Date.now() - olderThan;
      const recentDrafts = parsedDrafts.filter(draft => draft.lastModified > cutoffTime);
      localStorage.setItem('workoutBuilder_drafts', JSON.stringify(recentDrafts));
    }
  } catch (error) {
    console.error('Failed to cleanup persisted state:', error);
  }
};

export default workoutBuilderSlice.reducer;