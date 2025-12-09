/**
 * Workout Session State Manager
 * Handles persistence, recovery, and state management for workout sessions
 */

export interface WorkoutSessionState {
  // Core session info
  sessionId: string;
  workoutId: string;
  eventId?: string;
  workoutType: 'STRENGTH' | 'CONDITIONING' | 'HYBRID' | 'AGILITY';
  playerId: string;
  playerName: string;
  startedAt: string;
  lastUpdatedAt: string;
  
  // Progress tracking
  overallProgress: number;
  totalTimeElapsed: number;
  isPaused: boolean;
  isCompleted: boolean;
  
  // Type-specific state
  strengthState?: StrengthSessionState;
  conditioningState?: ConditioningSessionState;
  hybridState?: HybridSessionState;
  agilityState?: AgilitySessionState;
  
  // Metrics and performance
  metrics: SessionMetrics;
}

export interface StrengthSessionState {
  currentExerciseIndex: number;
  currentSetIndex: number;
  exercises: Array<{
    exerciseId: string;
    name: string;
    sets: Array<{
      reps: number;
      weight?: number;
      completed: boolean;
      actualReps?: number;
      actualWeight?: number;
      restTime?: number;
    }>;
  }>;
}

export interface ConditioningSessionState {
  currentIntervalIndex: number;
  intervalTimeRemaining: number;
  intervals: Array<{
    id: string;
    duration: number;
    intensity: string;
    targetBPM?: number;
    targetPower?: number;
    targetPace?: string;
    completed: boolean;
    actualMetrics?: {
      avgHeartRate?: number;
      avgPower?: number;
      calories?: number;
    };
  }>;
}

export interface HybridSessionState {
  currentBlockIndex: number;
  blocks: Array<{
    id: string;
    type: 'exercise' | 'interval' | 'transition';
    name: string;
    completed: boolean;
    // Exercise block data
    currentSet?: number;
    sets?: Array<{
      reps: number;
      weight?: number;
      completed: boolean;
    }>;
    // Interval block data
    duration?: number;
    timeRemaining?: number;
    intensity?: string;
  }>;
}

export interface AgilitySessionState {
  currentPhase: 'warmup' | 'drills' | 'cooldown';
  currentDrillIndex: number;
  currentRepIndex: number;
  drills: Array<{
    id: string;
    name: string;
    reps: number;
    completed: boolean;
    times: number[];
    bestTime?: number;
    rpe?: number;
  }>;
}

export interface SessionMetrics {
  heartRate?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  caloriesBurned: number;
  distance?: number;
  power?: number;
  pace?: string;
  rpm?: number;
}

class WorkoutSessionManager {
  private static instance: WorkoutSessionManager;
  private currentSession: WorkoutSessionState | null = null;
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private storageKey = 'activeWorkoutSession';
  
  private constructor() {
    // Initialize auto-save
    this.startAutoSave();
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Handle beforeunload to save state
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
  }
  
  public static getInstance(): WorkoutSessionManager {
    if (!WorkoutSessionManager.instance) {
      WorkoutSessionManager.instance = new WorkoutSessionManager();
    }
    return WorkoutSessionManager.instance;
  }
  
  /**
   * Start a new workout session
   */
  public startSession(config: {
    workoutId: string;
    eventId?: string;
    workoutType: 'STRENGTH' | 'CONDITIONING' | 'HYBRID' | 'AGILITY';
    playerId: string;
    playerName: string;
    workoutData: any;
  }): WorkoutSessionState {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.currentSession = {
      sessionId,
      workoutId: config.workoutId,
      eventId: config.eventId,
      workoutType: config.workoutType,
      playerId: config.playerId,
      playerName: config.playerName,
      startedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      overallProgress: 0,
      totalTimeElapsed: 0,
      isPaused: false,
      isCompleted: false,
      metrics: {
        caloriesBurned: 0
      }
    };
    
    // Initialize type-specific state
    switch (config.workoutType) {
      case 'STRENGTH':
        this.currentSession.strengthState = this.initializeStrengthState(config.workoutData);
        break;
      case 'CONDITIONING':
        this.currentSession.conditioningState = this.initializeConditioningState(config.workoutData);
        break;
      case 'HYBRID':
        this.currentSession.hybridState = this.initializeHybridState(config.workoutData);
        break;
      case 'AGILITY':
        this.currentSession.agilityState = this.initializeAgilityState(config.workoutData);
        break;
    }
    
    this.saveToStorage();
    return this.currentSession;
  }
  
  /**
   * Resume an existing session from storage
   */
  public resumeSession(): WorkoutSessionState | null {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        this.currentSession = JSON.parse(stored);
        return this.currentSession;
      } catch (error) {
        console.error('Failed to resume session:', error);
        this.clearSession();
      }
    }
    return null;
  }
  
  /**
   * Update session state
   */
  public updateSession(updates: Partial<WorkoutSessionState>): void {
    if (!this.currentSession) return;
    
    this.currentSession = {
      ...this.currentSession,
      ...updates,
      lastUpdatedAt: new Date().toISOString()
    };
    
    this.saveToStorage();
  }
  
  /**
   * Update metrics
   */
  public updateMetrics(metrics: Partial<SessionMetrics>): void {
    if (!this.currentSession) return;
    
    this.currentSession.metrics = {
      ...this.currentSession.metrics,
      ...metrics
    };
    
    this.currentSession.lastUpdatedAt = new Date().toISOString();
    this.saveToStorage();
  }
  
  /**
   * Pause the session
   */
  public pauseSession(): void {
    if (!this.currentSession) return;
    
    this.currentSession.isPaused = true;
    this.currentSession.lastUpdatedAt = new Date().toISOString();
    this.saveToStorage();
  }
  
  /**
   * Resume the session
   */
  public resumeSessionPlayback(): void {
    if (!this.currentSession) return;
    
    this.currentSession.isPaused = false;
    this.currentSession.lastUpdatedAt = new Date().toISOString();
    this.saveToStorage();
  }
  
  /**
   * Complete the session
   */
  public completeSession(finalMetrics?: Partial<SessionMetrics>): WorkoutSessionState | null {
    if (!this.currentSession) return null;
    
    this.currentSession.isCompleted = true;
    this.currentSession.overallProgress = 100;
    this.currentSession.isPaused = false;
    this.currentSession.lastUpdatedAt = new Date().toISOString();
    
    if (finalMetrics) {
      this.currentSession.metrics = {
        ...this.currentSession.metrics,
        ...finalMetrics
      };
    }
    
    // Save completed session to history
    this.saveToHistory(this.currentSession);
    
    // Clear active session
    const completedSession = { ...this.currentSession };
    this.clearSession();
    
    return completedSession;
  }
  
  /**
   * Get current session
   */
  public getCurrentSession(): WorkoutSessionState | null {
    return this.currentSession;
  }
  
  /**
   * Check if there's an active session
   */
  public hasActiveSession(): boolean {
    return this.currentSession !== null && !this.currentSession.isCompleted;
  }
  
  /**
   * Clear current session
   */
  public clearSession(): void {
    this.currentSession = null;
    localStorage.removeItem(this.storageKey);
  }
  
  /**
   * Get session history
   */
  public getSessionHistory(limit = 10): WorkoutSessionState[] {
    const stored = localStorage.getItem('workoutSessionHistory');
    if (stored) {
      try {
        const history = JSON.parse(stored);
        return history.slice(0, limit);
      } catch (error) {
        console.error('Failed to load session history:', error);
      }
    }
    return [];
  }
  
  private initializeStrengthState(workoutData: any): StrengthSessionState {
    const exercises = workoutData.exercises || [];
    return {
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      exercises: exercises.map((exercise: any) => ({
        exerciseId: exercise.id || exercise.name,
        name: exercise.name,
        sets: (exercise.sets || []).map((set: any) => ({
          reps: set.reps || 10,
          weight: set.weight,
          completed: false
        }))
      }))
    };
  }
  
  private initializeConditioningState(workoutData: any): ConditioningSessionState {
    const intervals = workoutData.intervalProgram?.intervals || [];
    return {
      currentIntervalIndex: 0,
      intervalTimeRemaining: intervals[0]?.duration || 0,
      intervals: intervals.map((interval: any) => ({
        id: interval.id || `interval_${Date.now()}`,
        duration: interval.duration,
        intensity: interval.intensity,
        targetBPM: interval.targetBPM,
        targetPower: interval.targetPower,
        targetPace: interval.targetPace,
        completed: false
      }))
    };
  }
  
  private initializeHybridState(workoutData: any): HybridSessionState {
    const blocks = workoutData.hybridWorkout?.blocks || [];
    return {
      currentBlockIndex: 0,
      blocks: blocks.map((block: any) => ({
        id: block.id || `block_${Date.now()}`,
        type: block.type,
        name: block.name,
        completed: false,
        ...(block.type === 'exercise' && {
          currentSet: 0,
          sets: (block.sets || []).map((set: any) => ({
            reps: set.reps || 10,
            weight: set.weight,
            completed: false
          }))
        }),
        ...(block.type === 'interval' && {
          duration: block.duration,
          timeRemaining: block.duration,
          intensity: block.intensity
        })
      }))
    };
  }
  
  private initializeAgilityState(workoutData: any): AgilitySessionState {
    const drills = workoutData.agilityProgram?.drills || [];
    return {
      currentPhase: 'warmup',
      currentDrillIndex: 0,
      currentRepIndex: 0,
      drills: drills.map((drill: any) => ({
        id: drill.id || `drill_${Date.now()}`,
        name: drill.name,
        reps: drill.reps || 3,
        completed: false,
        times: []
      }))
    };
  }
  
  private saveToStorage(): void {
    if (this.currentSession) {
      localStorage.setItem(this.storageKey, JSON.stringify(this.currentSession));
    }
  }
  
  private saveToHistory(session: WorkoutSessionState): void {
    const historyKey = 'workoutSessionHistory';
    const stored = localStorage.getItem(historyKey);
    let history: WorkoutSessionState[] = [];
    
    if (stored) {
      try {
        history = JSON.parse(stored);
      } catch (error) {
        console.error('Failed to load session history:', error);
      }
    }
    
    // Add to beginning of history
    history.unshift(session);
    
    // Keep only last 50 sessions
    history = history.slice(0, 50);
    
    localStorage.setItem(historyKey, JSON.stringify(history));
  }
  
  private startAutoSave(): void {
    // Auto-save every 30 seconds
    this.autoSaveInterval = setInterval(() => {
      if (this.currentSession && !this.currentSession.isCompleted) {
        this.saveToStorage();
      }
    }, 30000);
  }
  
  private handleVisibilityChange(): void {
    if (!document.hidden && this.currentSession) {
      // Page became visible, save current state
      this.saveToStorage();
    }
  }
  
  private handleBeforeUnload(): void {
    if (this.currentSession && !this.currentSession.isCompleted) {
      this.saveToStorage();
    }
  }
  
  public destroy(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  }
}

export const workoutSessionManager = WorkoutSessionManager.getInstance();