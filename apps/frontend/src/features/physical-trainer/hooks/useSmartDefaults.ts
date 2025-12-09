import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  WorkoutType, 
  WorkoutSessionFormData 
} from '../types/session.types';
import { Team, Player } from '../types';
import { startOfWeek, addDays, format, parse } from 'date-fns';

// Configuration for smart defaults
export interface SmartDefaultsConfig {
  workoutType?: WorkoutType;
  currentTeamId?: string | null;
  teams?: Team[];
  players?: Player[];
  calendarContext?: CalendarContext;
  facilityAvailability?: FacilityAvailability[];
  historicalData?: HistoricalWorkoutData[];
  userPreferences?: UserPreferences;
  teamSchedule?: TeamScheduleData[];
}

// Calendar context for time-based defaults
export interface CalendarContext {
  selectedDate?: Date;
  selectedTimeSlot?: TimeSlot;
  existingEvents?: CalendarEvent[];
  viewingTeamId?: string;
}

export interface TimeSlot {
  start: string; // "HH:mm"
  end: string;
  duration: number; // minutes
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'game' | 'practice' | 'training' | 'meeting' | 'medical';
  start: Date;
  end: Date;
  teamId?: string;
  participants?: string[];
}

// Facility availability data
export interface FacilityAvailability {
  facilityId: string;
  facilityName: string;
  equipment: string[];
  date: string;
  timeSlots: {
    start: string;
    end: string;
    available: boolean;
    bookedBy?: string;
  }[];
}

// Historical workout patterns
export interface HistoricalWorkoutData {
  workoutType: WorkoutType;
  dayOfWeek: number; // 0-6
  timeOfDay: string; // "HH:mm"
  duration: number;
  equipment: string[];
  teamId?: string;
  playerIds?: string[];
  frequency: number; // times per week
}

// User-specific preferences
export interface UserPreferences {
  id: string;
  userId: string;
  defaultDuration: Record<WorkoutType, number>;
  preferredTimes: {
    dayOfWeek: number;
    startTime: string;
    workoutType?: WorkoutType;
  }[];
  preferredEquipment: string[];
  defaultIntensity: Record<WorkoutType, 'low' | 'medium' | 'high' | 'max'>;
  autoSelectTeam: boolean;
  autoSelectPlayers: boolean;
  recentTeams: string[];
  recentWorkoutTypes: WorkoutType[];
}

// Team schedule patterns
export interface TeamScheduleData {
  teamId: string;
  patterns: {
    dayOfWeek: number;
    timeSlot: string;
    activityType: string;
    priority: number;
  }[];
  blackoutDates: string[];
  peakSeasonMonths: number[];
}

// Smart defaults result
export interface SmartDefaults {
  name: string;
  description?: string;
  type: WorkoutType;
  date: string;
  time: string;
  duration: number;
  location?: string;
  assignedPlayerIds: string[];
  assignedTeamIds: string[];
  intensity: 'low' | 'medium' | 'high' | 'max';
  equipment: string[];
  tags: string[];
  confidence: number; // 0-100
  reasoning: DefaultReasoning[];
}

export interface DefaultReasoning {
  field: keyof SmartDefaults;
  reason: string;
  confidence: number;
  source: 'calendar' | 'history' | 'preferences' | 'pattern' | 'availability';
}

// Hook return type
export interface UseSmartDefaultsReturn {
  defaults: SmartDefaults | null;
  isCalculating: boolean;
  confidence: number;
  reasoning: DefaultReasoning[];
  applyDefaults: (formData: Partial<WorkoutSessionFormData>) => WorkoutSessionFormData;
  refreshDefaults: () => void;
  savePreference: (field: string, value: any) => void;
  clearPreferences: () => void;
}

export function useSmartDefaults(config: SmartDefaultsConfig): UseSmartDefaultsReturn {
  const [defaults, setDefaults] = useState<SmartDefaults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [reasoning, setReasoning] = useState<DefaultReasoning[]>([]);
  
  // Debounce config changes to avoid excessive recalculation
  const debouncedConfig = useDebounce(config, 300);
  
  // Calculate pattern-based defaults
  const calculatePatternDefaults = useCallback(() => {
    const reasons: DefaultReasoning[] = [];
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    
    // Default workout type based on time of day and historical patterns
    let suggestedType = config.workoutType || WorkoutType.STRENGTH;
    let typeConfidence = config.workoutType ? 100 : 50;
    
    if (!config.workoutType && config.historicalData) {
      const todayPatterns = config.historicalData.filter(h => h.dayOfWeek === currentDay);
      if (todayPatterns.length > 0) {
        // Find most common workout type for this day/time
        const typeFrequency = todayPatterns.reduce((acc, pattern) => {
          acc[pattern.workoutType] = (acc[pattern.workoutType] || 0) + pattern.frequency;
          return acc;
        }, {} as Record<WorkoutType, number>);
        
        const mostFrequent = Object.entries(typeFrequency).sort(([,a], [,b]) => b - a)[0];
        if (mostFrequent) {
          suggestedType = mostFrequent[0] as WorkoutType;
          typeConfidence = Math.min(80, 50 + mostFrequent[1] * 5);
          reasons.push({
            field: 'type',
            reason: `Most common workout type on ${format(now, 'EEEE')}s`,
            confidence: typeConfidence,
            source: 'history'
          });
        }
      }
    }
    
    // Calculate optimal time based on calendar availability
    let suggestedTime = format(now, 'HH:mm');
    let suggestedDate = format(now, 'yyyy-MM-dd');
    let timeConfidence = 30;
    
    if (config.calendarContext?.selectedTimeSlot) {
      suggestedTime = config.calendarContext.selectedTimeSlot.start;
      suggestedDate = format(config.calendarContext.selectedDate || now, 'yyyy-MM-dd');
      timeConfidence = 95;
      reasons.push({
        field: 'time',
        reason: 'Using selected calendar time slot',
        confidence: timeConfidence,
        source: 'calendar'
      });
    } else if (config.userPreferences?.preferredTimes) {
      const todayPreferred = config.userPreferences.preferredTimes.find(
        p => p.dayOfWeek === currentDay && (!p.workoutType || p.workoutType === suggestedType)
      );
      if (todayPreferred) {
        suggestedTime = todayPreferred.startTime;
        timeConfidence = 75;
        reasons.push({
          field: 'time',
          reason: `Your preferred ${format(now, 'EEEE')} workout time`,
          confidence: timeConfidence,
          source: 'preferences'
        });
      }
    }
    
    // Duration based on workout type and preferences
    const durationMap: Record<WorkoutType, number> = {
      [WorkoutType.STRENGTH]: 60,
      [WorkoutType.CONDITIONING]: 45,
      [WorkoutType.HYBRID]: 75,
      [WorkoutType.AGILITY]: 30
    };
    
    let suggestedDuration = durationMap[suggestedType];
    let durationConfidence = 60;
    
    if (config.userPreferences?.defaultDuration[suggestedType]) {
      suggestedDuration = config.userPreferences.defaultDuration[suggestedType];
      durationConfidence = 85;
      reasons.push({
        field: 'duration',
        reason: `Your default ${suggestedType} workout duration`,
        confidence: durationConfidence,
        source: 'preferences'
      });
    } else if (config.calendarContext?.selectedTimeSlot) {
      suggestedDuration = config.calendarContext.selectedTimeSlot.duration;
      durationConfidence = 90;
      reasons.push({
        field: 'duration',
        reason: 'Fits selected calendar slot',
        confidence: durationConfidence,
        source: 'calendar'
      });
    }
    
    return { 
      type: suggestedType, 
      time: suggestedTime, 
      date: suggestedDate,
      duration: suggestedDuration,
      reasons 
    };
  }, [config]);
  
  // Calculate team and player defaults
  const calculateAssignmentDefaults = useCallback(() => {
    const reasons: DefaultReasoning[] = [];
    let teamIds: string[] = [];
    let playerIds: string[] = [];
    let confidence = 50;
    
    // Auto-select team based on context
    if (config.currentTeamId && config.currentTeamId !== 'all' && config.currentTeamId !== 'personal') {
      teamIds = [config.currentTeamId];
      confidence = 90;
      reasons.push({
        field: 'assignedTeamIds',
        reason: 'Currently viewing this team',
        confidence: 90,
        source: 'pattern'
      });
    } else if (config.calendarContext?.viewingTeamId) {
      teamIds = [config.calendarContext.viewingTeamId];
      confidence = 85;
      reasons.push({
        field: 'assignedTeamIds',
        reason: 'Team context from calendar view',
        confidence: 85,
        source: 'calendar'
      });
    } else if (config.userPreferences?.recentTeams.length > 0) {
      teamIds = [config.userPreferences.recentTeams[0]];
      confidence = 70;
      reasons.push({
        field: 'assignedTeamIds',
        reason: 'Most recently used team',
        confidence: 70,
        source: 'history'
      });
    }
    
    // Auto-select available players
    if (teamIds.length > 0 && config.teams && config.players) {
      const team = config.teams.find(t => t.id === teamIds[0]);
      if (team?.players) {
        // Filter for available players (not injured, not in other sessions)
        const availablePlayerIds = team.players
          .filter(playerId => {
            const player = config.players?.find(p => p.id === playerId);
            return player && !player.injuryStatus; // Simple availability check
          })
          .slice(0, 15); // Reasonable default group size
        
        if (availablePlayerIds.length > 0) {
          playerIds = availablePlayerIds;
          reasons.push({
            field: 'assignedPlayerIds',
            reason: `${availablePlayerIds.length} available players from ${team.name}`,
            confidence: 75,
            source: 'pattern'
          });
        }
      }
    }
    
    return { teamIds, playerIds, reasons };
  }, [config]);
  
  // Calculate equipment defaults based on availability
  const calculateEquipmentDefaults = useCallback(() => {
    const reasons: DefaultReasoning[] = [];
    let equipment: string[] = [];
    let confidence = 50;
    
    const { type, date, time } = calculatePatternDefaults();
    
    // Equipment based on workout type
    const equipmentMap: Record<WorkoutType, string[]> = {
      [WorkoutType.STRENGTH]: ['barbell', 'dumbbells', 'bench', 'squat-rack'],
      [WorkoutType.CONDITIONING]: ['rowing-machine', 'bike', 'treadmill'],
      [WorkoutType.HYBRID]: ['kettlebells', 'medicine-ball', 'battle-ropes'],
      [WorkoutType.AGILITY]: ['cones', 'ladder', 'hurdles']
    };
    
    equipment = equipmentMap[type] || [];
    
    // Check facility availability
    if (config.facilityAvailability && date && time) {
      const dayAvailability = config.facilityAvailability.find(f => f.date === date);
      if (dayAvailability) {
        const timeSlot = dayAvailability.timeSlots.find(
          slot => slot.start <= time && slot.end > time && slot.available
        );
        if (timeSlot) {
          // Filter to available equipment
          const availableEquipment = equipment.filter(
            eq => dayAvailability.equipment.includes(eq)
          );
          if (availableEquipment.length > 0) {
            equipment = availableEquipment;
            confidence = 80;
            reasons.push({
              field: 'equipment',
              reason: `Available at ${dayAvailability.facilityName}`,
              confidence: 80,
              source: 'availability'
            });
          }
        }
      }
    }
    
    // User preferences override
    if (config.userPreferences?.preferredEquipment.length > 0) {
      const preferred = equipment.filter(
        eq => config.userPreferences!.preferredEquipment.includes(eq)
      );
      if (preferred.length > 0) {
        equipment = preferred;
        confidence = 85;
        reasons.push({
          field: 'equipment',
          reason: 'Your preferred equipment',
          confidence: 85,
          source: 'preferences'
        });
      }
    }
    
    return { equipment, reasons };
  }, [config, calculatePatternDefaults]);
  
  // Calculate intensity based on periodization
  const calculateIntensityDefaults = useCallback(() => {
    const reasons: DefaultReasoning[] = [];
    let intensity: 'low' | 'medium' | 'high' | 'max' = 'medium';
    let confidence = 60;
    
    const { type } = calculatePatternDefaults();
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    // Default intensity patterns
    const intensityPatterns: Record<number, 'low' | 'medium' | 'high'> = {
      0: 'low',    // Sunday - recovery
      1: 'medium', // Monday
      2: 'high',   // Tuesday
      3: 'medium', // Wednesday
      4: 'high',   // Thursday
      5: 'medium', // Friday
      6: 'low'     // Saturday
    };
    
    intensity = intensityPatterns[dayOfWeek] || 'medium';
    
    // Check for games/competitions nearby
    if (config.calendarContext?.existingEvents) {
      const tomorrow = addDays(now, 1);
      const hasGameTomorrow = config.calendarContext.existingEvents.some(
        event => event.type === 'game' && 
        format(event.start, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')
      );
      
      if (hasGameTomorrow) {
        intensity = 'low';
        confidence = 85;
        reasons.push({
          field: 'intensity',
          reason: 'Game tomorrow - recovery focus',
          confidence: 85,
          source: 'calendar'
        });
      }
    }
    
    // User preferences
    if (config.userPreferences?.defaultIntensity[type]) {
      intensity = config.userPreferences.defaultIntensity[type];
      confidence = 80;
      reasons.push({
        field: 'intensity',
        reason: `Your default ${type} intensity`,
        confidence: 80,
        source: 'preferences'
      });
    }
    
    return { intensity, reasons };
  }, [config, calculatePatternDefaults]);
  
  // Generate workout name
  const generateWorkoutName = useCallback(() => {
    const { type, date } = calculatePatternDefaults();
    const { teamIds } = calculateAssignmentDefaults();
    
    const team = config.teams?.find(t => t.id === teamIds[0]);
    const teamName = team?.name || 'Team';
    const dateStr = format(parse(date, 'yyyy-MM-dd', new Date()), 'MMM d');
    
    const typeNames: Record<WorkoutType, string> = {
      [WorkoutType.STRENGTH]: 'Strength Training',
      [WorkoutType.CONDITIONING]: 'Conditioning',
      [WorkoutType.HYBRID]: 'Hybrid Workout',
      [WorkoutType.AGILITY]: 'Agility Drills'
    };
    
    return `${teamName} ${typeNames[type]} - ${dateStr}`;
  }, [config, calculatePatternDefaults, calculateAssignmentDefaults]);
  
  // Main calculation effect
  useEffect(() => {
    if (!debouncedConfig) return;
    
    setIsCalculating(true);
    
    // Simulate async calculation
    const calculateDefaults = async () => {
      const allReasons: DefaultReasoning[] = [];
      
      // Get all default calculations
      const { type, time, date, duration, reasons: patternReasons } = calculatePatternDefaults();
      const { teamIds, playerIds, reasons: assignmentReasons } = calculateAssignmentDefaults();
      const { equipment, reasons: equipmentReasons } = calculateEquipmentDefaults();
      const { intensity, reasons: intensityReasons } = calculateIntensityDefaults();
      
      allReasons.push(...patternReasons, ...assignmentReasons, ...equipmentReasons, ...intensityReasons);
      
      // Calculate overall confidence
      const overallConfidence = allReasons.length > 0
        ? Math.round(allReasons.reduce((sum, r) => sum + r.confidence, 0) / allReasons.length)
        : 50;
      
      const smartDefaults: SmartDefaults = {
        name: generateWorkoutName(),
        type,
        date,
        time,
        duration,
        assignedTeamIds: teamIds,
        assignedPlayerIds: playerIds,
        intensity,
        equipment,
        tags: [type, intensity, format(parse(date, 'yyyy-MM-dd', new Date()), 'EEEE').toLowerCase()],
        confidence: overallConfidence,
        reasoning: allReasons
      };
      
      setDefaults(smartDefaults);
      setReasoning(allReasons);
      setIsCalculating(false);
    };
    
    calculateDefaults();
  }, [
    debouncedConfig,
    calculatePatternDefaults,
    calculateAssignmentDefaults,
    calculateEquipmentDefaults,
    calculateIntensityDefaults,
    generateWorkoutName
  ]);
  
  // Apply defaults to form data
  const applyDefaults = useCallback((formData: Partial<WorkoutSessionFormData>): WorkoutSessionFormData => {
    if (!defaults) {
      return formData as WorkoutSessionFormData;
    }
    
    return {
      name: formData.name || defaults.name,
      type: formData.type || defaults.type,
      date: formData.date || defaults.date,
      time: formData.time || defaults.time,
      duration: formData.duration || defaults.duration,
      assignedTeamIds: formData.assignedTeamIds?.length ? formData.assignedTeamIds : defaults.assignedTeamIds,
      assignedPlayerIds: formData.assignedPlayerIds?.length ? formData.assignedPlayerIds : defaults.assignedPlayerIds,
      intensity: formData.intensity || defaults.intensity,
      equipment: formData.equipment?.length ? formData.equipment : defaults.equipment,
      tags: formData.tags?.length ? formData.tags : defaults.tags,
      ...formData
    };
  }, [defaults]);
  
  // Refresh defaults manually
  const refreshDefaults = useCallback(() => {
    setIsCalculating(true);
    // Trigger recalculation by updating a dummy state
    setTimeout(() => setIsCalculating(false), 100);
  }, []);
  
  // Save user preference
  const savePreference = useCallback((field: string, value: any) => {
    // In a real implementation, this would save to backend or localStorage
    console.log('Saving preference:', field, value);
  }, []);
  
  // Clear all preferences
  const clearPreferences = useCallback(() => {
    // In a real implementation, this would clear from backend or localStorage
    console.log('Clearing all preferences');
  }, []);
  
  const confidence = defaults?.confidence || 0;
  
  return {
    defaults,
    isCalculating,
    confidence,
    reasoning,
    applyDefaults,
    refreshDefaults,
    savePreference,
    clearPreferences
  };
}