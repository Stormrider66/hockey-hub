import { WorkoutType } from '../types/session.types';
import { UserPreferences } from '../hooks/useSmartDefaults';

const PREFERENCES_KEY = 'physical_trainer_smart_defaults_preferences';
const MAX_RECENT_ITEMS = 5;

export class SmartDefaultsPreferencesManager {
  // Get user preferences from localStorage
  static getPreferences(userId: string): UserPreferences | null {
    try {
      const stored = localStorage.getItem(`${PREFERENCES_KEY}_${userId}`);
      if (!stored) return null;
      
      const preferences = JSON.parse(stored) as UserPreferences;
      return preferences;
    } catch (error) {
      console.error('Error loading smart defaults preferences:', error);
      return null;
    }
  }

  // Save user preferences to localStorage
  static savePreferences(userId: string, preferences: UserPreferences): void {
    try {
      localStorage.setItem(
        `${PREFERENCES_KEY}_${userId}`,
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.error('Error saving smart defaults preferences:', error);
    }
  }

  // Update a specific preference field
  static updatePreference<K extends keyof UserPreferences>(
    userId: string,
    field: K,
    value: UserPreferences[K]
  ): void {
    const current = this.getPreferences(userId) || this.createDefaultPreferences(userId);
    const updated = { ...current, [field]: value };
    this.savePreferences(userId, updated);
  }

  // Add to recent teams list
  static addRecentTeam(userId: string, teamId: string): void {
    const preferences = this.getPreferences(userId) || this.createDefaultPreferences(userId);
    const recentTeams = [teamId, ...preferences.recentTeams.filter(id => id !== teamId)];
    
    this.updatePreference(userId, 'recentTeams', recentTeams.slice(0, MAX_RECENT_ITEMS));
  }

  // Add to recent workout types
  static addRecentWorkoutType(userId: string, workoutType: WorkoutType): void {
    const preferences = this.getPreferences(userId) || this.createDefaultPreferences(userId);
    const recentTypes = [workoutType, ...preferences.recentWorkoutTypes.filter(type => type !== workoutType)];
    
    this.updatePreference(userId, 'recentWorkoutTypes', recentTypes.slice(0, MAX_RECENT_ITEMS));
  }

  // Update default duration for a workout type
  static updateDefaultDuration(userId: string, workoutType: WorkoutType, duration: number): void {
    const preferences = this.getPreferences(userId) || this.createDefaultPreferences(userId);
    const defaultDuration = { ...preferences.defaultDuration, [workoutType]: duration };
    
    this.updatePreference(userId, 'defaultDuration', defaultDuration);
  }

  // Update default intensity for a workout type
  static updateDefaultIntensity(
    userId: string, 
    workoutType: WorkoutType, 
    intensity: 'low' | 'medium' | 'high' | 'max'
  ): void {
    const preferences = this.getPreferences(userId) || this.createDefaultPreferences(userId);
    const defaultIntensity = { ...preferences.defaultIntensity, [workoutType]: intensity };
    
    this.updatePreference(userId, 'defaultIntensity', defaultIntensity);
  }

  // Add or update preferred time
  static updatePreferredTime(
    userId: string,
    dayOfWeek: number,
    startTime: string,
    workoutType?: WorkoutType
  ): void {
    const preferences = this.getPreferences(userId) || this.createDefaultPreferences(userId);
    const preferredTimes = [...preferences.preferredTimes];
    
    const existingIndex = preferredTimes.findIndex(
      p => p.dayOfWeek === dayOfWeek && p.workoutType === workoutType
    );
    
    if (existingIndex >= 0) {
      preferredTimes[existingIndex] = { dayOfWeek, startTime, workoutType };
    } else {
      preferredTimes.push({ dayOfWeek, startTime, workoutType });
    }
    
    this.updatePreference(userId, 'preferredTimes', preferredTimes);
  }

  // Update preferred equipment
  static updatePreferredEquipment(userId: string, equipment: string[]): void {
    this.updatePreference(userId, 'preferredEquipment', equipment);
  }

  // Clear all preferences for a user
  static clearPreferences(userId: string): void {
    try {
      localStorage.removeItem(`${PREFERENCES_KEY}_${userId}`);
    } catch (error) {
      console.error('Error clearing smart defaults preferences:', error);
    }
  }

  // Create default preferences
  static createDefaultPreferences(userId: string): UserPreferences {
    return {
      id: `pref_${Date.now()}`,
      userId,
      defaultDuration: {
        [WorkoutType.STRENGTH]: 60,
        [WorkoutType.CONDITIONING]: 45,
        [WorkoutType.HYBRID]: 75,
        [WorkoutType.AGILITY]: 30
      },
      preferredTimes: [],
      preferredEquipment: [],
      defaultIntensity: {
        [WorkoutType.STRENGTH]: 'medium',
        [WorkoutType.CONDITIONING]: 'high',
        [WorkoutType.HYBRID]: 'medium',
        [WorkoutType.AGILITY]: 'medium'
      },
      autoSelectTeam: true,
      autoSelectPlayers: true,
      recentTeams: [],
      recentWorkoutTypes: []
    };
  }

  // Learn from user actions
  static learnFromSave(
    userId: string,
    workoutData: {
      type: WorkoutType;
      duration: number;
      intensity: 'low' | 'medium' | 'high' | 'max';
      teamId?: string;
      time?: string;
      dayOfWeek?: number;
      equipment?: string[];
    }
  ): void {
    // Update recent workout type
    this.addRecentWorkoutType(userId, workoutData.type);

    // Update recent team if provided
    if (workoutData.teamId) {
      this.addRecentTeam(userId, workoutData.teamId);
    }

    // Learn duration preference (weighted average)
    const preferences = this.getPreferences(userId) || this.createDefaultPreferences(userId);
    const currentDuration = preferences.defaultDuration[workoutData.type];
    const newDuration = Math.round((currentDuration * 0.7 + workoutData.duration * 0.3));
    this.updateDefaultDuration(userId, workoutData.type, newDuration);

    // Learn intensity preference (if different from current)
    if (workoutData.intensity !== preferences.defaultIntensity[workoutData.type]) {
      // Only update if used multiple times
      const key = `intensity_count_${workoutData.type}_${workoutData.intensity}`;
      const count = parseInt(localStorage.getItem(key) || '0') + 1;
      localStorage.setItem(key, count.toString());
      
      if (count >= 3) {
        this.updateDefaultIntensity(userId, workoutData.type, workoutData.intensity);
        localStorage.removeItem(key);
      }
    }

    // Learn time preference
    if (workoutData.time && workoutData.dayOfWeek !== undefined) {
      this.updatePreferredTime(userId, workoutData.dayOfWeek, workoutData.time, workoutData.type);
    }

    // Learn equipment preference
    if (workoutData.equipment && workoutData.equipment.length > 0) {
      const currentEquipment = preferences.preferredEquipment;
      const newEquipment = Array.from(new Set([...currentEquipment, ...workoutData.equipment]));
      this.updatePreferredEquipment(userId, newEquipment.slice(0, 10)); // Keep top 10
    }
  }

  // Export preferences (for backup)
  static exportPreferences(userId: string): string | null {
    const preferences = this.getPreferences(userId);
    return preferences ? JSON.stringify(preferences, null, 2) : null;
  }

  // Import preferences (from backup)
  static importPreferences(userId: string, data: string): boolean {
    try {
      const preferences = JSON.parse(data) as UserPreferences;
      preferences.userId = userId; // Ensure correct user ID
      this.savePreferences(userId, preferences);
      return true;
    } catch (error) {
      console.error('Error importing preferences:', error);
      return false;
    }
  }

  // Get preference statistics
  static getPreferenceStats(userId: string): {
    totalWorkouts: number;
    favoriteWorkoutType: WorkoutType | null;
    favoriteTeam: string | null;
    averageDuration: number;
    preferredIntensity: string;
  } {
    const preferences = this.getPreferences(userId);
    if (!preferences) {
      return {
        totalWorkouts: 0,
        favoriteWorkoutType: null,
        favoriteTeam: null,
        averageDuration: 60,
        preferredIntensity: 'medium'
      };
    }

    const favoriteWorkoutType = preferences.recentWorkoutTypes[0] || null;
    const favoriteTeam = preferences.recentTeams[0] || null;
    
    const durations = Object.values(preferences.defaultDuration);
    const averageDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 60;

    const intensities = Object.values(preferences.defaultIntensity);
    const intensityCount = intensities.reduce((acc, intensity) => {
      acc[intensity] = (acc[intensity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const preferredIntensity = Object.entries(intensityCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'medium';

    return {
      totalWorkouts: preferences.recentWorkoutTypes.length,
      favoriteWorkoutType,
      favoriteTeam,
      averageDuration,
      preferredIntensity
    };
  }
}