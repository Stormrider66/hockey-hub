'use client';

import type { WorkoutEquipmentType } from '../types/conditioning.types';
import type { EquipmentAvailability, FacilityInfo, SessionConfiguration, BulkSessionConfig } from '../hooks/useBulkSession';

export type WorkoutType = 'strength' | 'conditioning' | 'hybrid' | 'agility';

export interface AllocationConstraints {
  facilityCapacity: number;
  equipmentAvailability: EquipmentAvailability[];
  transitionTimeMinutes: number;
  maxConcurrentSessions: number;
  prioritizeGrouping: boolean;
  minimizeTransitions: boolean;
}

export interface SessionAllocation {
  sessionId: string;
  workoutType: WorkoutType;
  startTime: string;
  endTime: string;
  equipment: WorkoutEquipmentType[];
  facilityArea: string;
  transitionBuffer: number;
  conflictScore: number;
}

export interface AllocationResult {
  allocations: SessionAllocation[];
  totalConflictScore: number;
  equipmentUtilization: Record<WorkoutEquipmentType, number>;
  facilityUtilization: number;
  recommendations: string[];
  warnings: string[];
}

export class SmartAllocationAlgorithms {
  private static readonly EQUIPMENT_TRANSITION_TIMES: Record<string, number> = {
    'strength-conditioning': 10, // minutes to transition from strength to cardio
    'conditioning-strength': 8,
    'strength-agility': 5,
    'agility-strength': 7,
    'conditioning-agility': 6,
    'agility-conditioning': 8,
    'hybrid-strength': 4,
    'strength-hybrid': 6,
    'hybrid-conditioning': 3,
    'conditioning-hybrid': 5,
    'hybrid-agility': 7,
    'agility-hybrid': 9,
    'same-type': 2 // minimal transition for same workout type
  };

  private static readonly FACILITY_AREAS: Record<WorkoutType, string[]> = {
    strength: ['free-weights', 'machines', 'power-racks'],
    conditioning: ['cardio-area', 'open-space', 'track'],
    hybrid: ['functional-area', 'open-space', 'crossfit-area'],
    agility: ['agility-area', 'court-space', 'turf-area']
  };

  private static readonly OPTIMAL_SEQUENCES: WorkoutType[][] = [
    ['strength', 'conditioning', 'agility'], // strength first, conditioning second, agility for recovery
    ['agility', 'strength', 'conditioning'], // warm-up with agility, build strength, finish with cardio
    ['conditioning', 'hybrid', 'agility'], // cardio warm-up, mixed training, agility cooldown
    ['strength', 'hybrid', 'conditioning'], // strength focus with mixed and cardio finish
  ];

  /**
   * Main allocation algorithm using constraint satisfaction
   */
  static allocateOptimalSessions<TWorkout>(
    sessions: SessionConfiguration<TWorkout>[],
    constraints: AllocationConstraints,
    facility: FacilityInfo
  ): AllocationResult {
    const allocations: SessionAllocation[] = [];
    const equipmentUsage = new Map<WorkoutEquipmentType, number>();
    let totalConflictScore = 0;
    const recommendations: string[] = [];
    const warnings: string[] = [];

    // Step 1: Sort sessions by optimal sequence
    const orderedSessions = this.optimizeSessionOrder(sessions);

    // Step 2: Allocate each session using greedy algorithm with backtracking
    for (let i = 0; i < orderedSessions.length; i++) {
      const session = orderedSessions[i];
      const allocation = this.allocateSession(
        session,
        allocations,
        constraints,
        facility,
        equipmentUsage
      );

      allocations.push(allocation);
      totalConflictScore += allocation.conflictScore;

      // Update equipment usage
      allocation.equipment.forEach(equipment => {
        equipmentUsage.set(equipment, (equipmentUsage.get(equipment) || 0) + 1);
      });
    }

    // Step 3: Optimize allocations using local search
    const optimizedAllocations = this.optimizeAllocationOrder(allocations, constraints);

    // Step 4: Generate recommendations and warnings
    this.generateRecommendations(optimizedAllocations, constraints, recommendations, warnings);

    // Calculate utilization metrics
    const equipmentUtilization = this.calculateEquipmentUtilization(equipmentUsage, constraints.equipmentAvailability);
    const facilityUtilization = this.calculateFacilityUtilization(optimizedAllocations, facility, constraints);

    return {
      allocations: optimizedAllocations,
      totalConflictScore,
      equipmentUtilization,
      facilityUtilization,
      recommendations,
      warnings
    };
  }

  /**
   * Optimize session order using sequence patterns and transition minimization
   */
  private static optimizeSessionOrder<TWorkout>(sessions: SessionConfiguration<TWorkout>[]): SessionConfiguration<TWorkout>[] {
    if (sessions.length <= 1) return sessions;

    // Group sessions by workout type
    const sessionsByType = sessions.reduce((groups, session) => {
      // Extract workout type from session (assuming it's stored in workoutData or can be inferred)
      const workoutType = this.inferWorkoutType(session);
      if (!groups[workoutType]) groups[workoutType] = [];
      groups[workoutType].push(session);
      return groups;
    }, {} as Record<WorkoutType, SessionConfiguration<TWorkout>[]>);

    // Find best sequence pattern
    const availableTypes = Object.keys(sessionsByType) as WorkoutType[];
    const bestSequence = this.findOptimalSequence(availableTypes);

    // Arrange sessions according to optimal sequence
    const orderedSessions: SessionConfiguration<TWorkout>[] = [];
    bestSequence.forEach(type => {
      if (sessionsByType[type]) {
        orderedSessions.push(...sessionsByType[type]);
      }
    });

    // Add any remaining sessions not in the optimal sequence
    availableTypes.forEach(type => {
      if (!bestSequence.includes(type) && sessionsByType[type]) {
        orderedSessions.push(...sessionsByType[type]);
      }
    });

    return orderedSessions;
  }

  /**
   * Allocate a single session considering constraints
   */
  private static allocateSession<TWorkout>(
    session: SessionConfiguration<TWorkout>,
    existingAllocations: SessionAllocation[],
    constraints: AllocationConstraints,
    facility: FacilityInfo,
    equipmentUsage: Map<WorkoutEquipmentType, number>
  ): SessionAllocation {
    const workoutType = this.inferWorkoutType(session);
    const preferredAreas = this.FACILITY_AREAS[workoutType];
    const sessionEquipment = session.equipment || [];

    // Calculate optimal start time based on existing allocations
    const startTime = this.calculateOptimalStartTime(
      workoutType,
      existingAllocations,
      constraints
    );

    // Calculate end time (assuming 60min default duration, should be configurable)
    const endTime = this.addMinutes(startTime, 60);

    // Select best facility area
    const facilityArea = this.selectOptimalFacilityArea(
      preferredAreas,
      existingAllocations,
      startTime,
      endTime
    );

    // Calculate transition buffer needed
    const transitionBuffer = this.calculateTransitionBuffer(
      workoutType,
      existingAllocations,
      startTime
    );

    // Calculate conflict score
    const conflictScore = this.calculateConflictScore(
      sessionEquipment,
      facilityArea,
      startTime,
      endTime,
      existingAllocations,
      constraints,
      equipmentUsage
    );

    return {
      sessionId: session.id,
      workoutType,
      startTime,
      endTime,
      equipment: sessionEquipment,
      facilityArea,
      transitionBuffer,
      conflictScore
    };
  }

  /**
   * Optimize allocation order using local search algorithm
   */
  private static optimizeAllocationOrder(
    allocations: SessionAllocation[],
    constraints: AllocationConstraints
  ): SessionAllocation[] {
    if (allocations.length <= 2) return allocations;

    let currentAllocations = [...allocations];
    let bestScore = this.calculateTotalScore(currentAllocations);
    let improved = true;
    let iterations = 0;
    const maxIterations = 50;

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;

      // Try all possible swaps
      for (let i = 0; i < currentAllocations.length - 1; i++) {
        for (let j = i + 1; j < currentAllocations.length; j++) {
          // Swap sessions i and j
          const testAllocations = [...currentAllocations];
          [testAllocations[i], testAllocations[j]] = [testAllocations[j], testAllocations[i]];

          // Recalculate times for swapped sessions
          testAllocations[i] = this.recalculateAllocationTiming(testAllocations[i], testAllocations, i, constraints);
          testAllocations[j] = this.recalculateAllocationTiming(testAllocations[j], testAllocations, j, constraints);

          const newScore = this.calculateTotalScore(testAllocations);
          if (newScore < bestScore) {
            currentAllocations = testAllocations;
            bestScore = newScore;
            improved = true;
          }
        }
      }
    }

    return currentAllocations;
  }

  /**
   * Infer workout type from session configuration
   */
  private static inferWorkoutType<TWorkout>(session: SessionConfiguration<TWorkout>): WorkoutType {
    // Check equipment to infer type
    if (session.equipment && session.equipment.length > 0) {
      const cardioEquipment = ['bike_erg', 'rowing', 'treadmill', 'airbike', 'wattbike', 'skierg'];
      const hasCardioEquipment = session.equipment.some(eq => cardioEquipment.includes(eq));
      
      if (hasCardioEquipment) {
        return 'conditioning';
      }
    }

    // Check session name for clues
    const name = session.name.toLowerCase();
    if (name.includes('conditioning') || name.includes('cardio')) return 'conditioning';
    if (name.includes('hybrid') || name.includes('circuit')) return 'hybrid';
    if (name.includes('agility') || name.includes('speed')) return 'agility';
    
    return 'strength'; // default assumption
  }

  /**
   * Find optimal sequence pattern from available types
   */
  private static findOptimalSequence(availableTypes: WorkoutType[]): WorkoutType[] {
    if (availableTypes.length <= 1) return availableTypes;

    // Find sequence that matches available types best
    let bestSequence = availableTypes;
    let bestMatch = 0;

    for (const sequence of this.OPTIMAL_SEQUENCES) {
      const matchCount = sequence.filter(type => availableTypes.includes(type)).length;
      if (matchCount > bestMatch) {
        bestMatch = matchCount;
        bestSequence = sequence.filter(type => availableTypes.includes(type));
      }
    }

    return bestSequence;
  }

  /**
   * Calculate optimal start time for a session
   */
  private static calculateOptimalStartTime(
    workoutType: WorkoutType,
    existingAllocations: SessionAllocation[],
    constraints: AllocationConstraints
  ): string {
    if (existingAllocations.length === 0) {
      return '08:00'; // Default start time
    }

    // Find the latest end time
    const latestEndTime = existingAllocations
      .map(a => a.endTime)
      .sort()
      .pop() || '08:00';

    // Calculate transition time needed
    const lastWorkoutType = existingAllocations[existingAllocations.length - 1]?.workoutType;
    const transitionKey = `${lastWorkoutType}-${workoutType}`;
    const transitionTime = this.EQUIPMENT_TRANSITION_TIMES[transitionKey] || 
                          this.EQUIPMENT_TRANSITION_TIMES['same-type'];

    return this.addMinutes(latestEndTime, transitionTime);
  }

  /**
   * Select optimal facility area for a workout type
   */
  private static selectOptimalFacilityArea(
    preferredAreas: string[],
    existingAllocations: SessionAllocation[],
    startTime: string,
    endTime: string
  ): string {
    // Check which areas are available during the time slot
    const occupiedAreas = existingAllocations
      .filter(a => this.timesOverlap(a.startTime, a.endTime, startTime, endTime))
      .map(a => a.facilityArea);

    // Find first available preferred area
    const availableArea = preferredAreas.find(area => !occupiedAreas.includes(area));
    return availableArea || preferredAreas[0]; // fallback to first preferred
  }

  /**
   * Calculate transition buffer needed between sessions
   */
  private static calculateTransitionBuffer(
    workoutType: WorkoutType,
    existingAllocations: SessionAllocation[],
    startTime: string
  ): number {
    if (existingAllocations.length === 0) return 0;

    const previousAllocation = existingAllocations[existingAllocations.length - 1];
    if (!previousAllocation) return 0;

    const transitionKey = `${previousAllocation.workoutType}-${workoutType}`;
    return this.EQUIPMENT_TRANSITION_TIMES[transitionKey] || 
           this.EQUIPMENT_TRANSITION_TIMES['same-type'];
  }

  /**
   * Calculate conflict score for an allocation
   */
  private static calculateConflictScore(
    equipment: WorkoutEquipmentType[],
    facilityArea: string,
    startTime: string,
    endTime: string,
    existingAllocations: SessionAllocation[],
    constraints: AllocationConstraints,
    equipmentUsage: Map<WorkoutEquipmentType, number>
  ): number {
    let score = 0;

    // Equipment conflicts
    equipment.forEach(eq => {
      const availability = constraints.equipmentAvailability.find(a => a.type === eq);
      const currentUsage = equipmentUsage.get(eq) || 0;
      
      if (availability && currentUsage >= availability.available) {
        score += 100; // High penalty for equipment unavailability
      }
    });

    // Facility area conflicts
    const areaConflicts = existingAllocations.filter(a => 
      a.facilityArea === facilityArea && 
      this.timesOverlap(a.startTime, a.endTime, startTime, endTime)
    );
    score += areaConflicts.length * 50;

    // Transition time violations
    const previousSession = existingAllocations[existingAllocations.length - 1];
    if (previousSession) {
      const requiredTransition = this.calculateTransitionBuffer(
        this.inferWorkoutTypeFromString(previousSession.workoutType),
        existingAllocations,
        startTime
      );
      const actualTransition = this.getMinutesDifference(previousSession.endTime, startTime);
      
      if (actualTransition < requiredTransition) {
        score += (requiredTransition - actualTransition) * 10;
      }
    }

    return score;
  }

  /**
   * Helper method to infer workout type from string
   */
  private static inferWorkoutTypeFromString(type: string): WorkoutType {
    return type as WorkoutType;
  }

  /**
   * Calculate total score for all allocations
   */
  private static calculateTotalScore(allocations: SessionAllocation[]): number {
    return allocations.reduce((total, allocation) => total + allocation.conflictScore, 0);
  }

  /**
   * Recalculate timing for an allocation after reordering
   */
  private static recalculateAllocationTiming(
    allocation: SessionAllocation,
    allAllocations: SessionAllocation[],
    index: number,
    constraints: AllocationConstraints
  ): SessionAllocation {
    if (index === 0) {
      return { ...allocation, startTime: '08:00', endTime: this.addMinutes('08:00', 60) };
    }

    const previousAllocation = allAllocations[index - 1];
    const transitionKey = `${previousAllocation.workoutType}-${allocation.workoutType}`;
    const transitionTime = this.EQUIPMENT_TRANSITION_TIMES[transitionKey] || 
                          this.EQUIPMENT_TRANSITION_TIMES['same-type'];

    const newStartTime = this.addMinutes(previousAllocation.endTime, transitionTime);
    const newEndTime = this.addMinutes(newStartTime, 60);

    return {
      ...allocation,
      startTime: newStartTime,
      endTime: newEndTime,
      transitionBuffer: transitionTime
    };
  }

  /**
   * Generate recommendations and warnings
   */
  private static generateRecommendations(
    allocations: SessionAllocation[],
    constraints: AllocationConstraints,
    recommendations: string[],
    warnings: string[]
  ): void {
    // Check for high conflict scores
    const highConflictSessions = allocations.filter(a => a.conflictScore > 100);
    if (highConflictSessions.length > 0) {
      warnings.push(`${highConflictSessions.length} sessions have equipment or facility conflicts`);
      recommendations.push('Consider staggering start times or allowing equipment sharing');
    }

    // Check for suboptimal sequences
    const workoutSequence = allocations.map(a => a.workoutType);
    const hasOptimalPattern = this.OPTIMAL_SEQUENCES.some(pattern => 
      this.sequenceMatches(workoutSequence, pattern)
    );

    if (!hasOptimalPattern && allocations.length > 2) {
      recommendations.push('Consider reordering workout types for better training progression');
    }

    // Check for tight transitions
    const tightTransitions = allocations.filter(a => a.transitionBuffer < 5);
    if (tightTransitions.length > 0) {
      warnings.push(`${tightTransitions.length} sessions have tight transition times`);
      recommendations.push('Add buffer time between sessions to allow for equipment setup');
    }
  }

  /**
   * Calculate equipment utilization percentages
   */
  private static calculateEquipmentUtilization(
    usage: Map<WorkoutEquipmentType, number>,
    availability: EquipmentAvailability[]
  ): Record<WorkoutEquipmentType, number> {
    const utilization: Record<WorkoutEquipmentType, number> = {} as Record<WorkoutEquipmentType, number>;

    availability.forEach(equipment => {
      const used = usage.get(equipment.type) || 0;
      utilization[equipment.type] = Math.min(100, (used / equipment.available) * 100);
    });

    return utilization;
  }

  /**
   * Calculate overall facility utilization
   */
  private static calculateFacilityUtilization(
    allocations: SessionAllocation[],
    facility: FacilityInfo,
    constraints: AllocationConstraints
  ): number {
    if (allocations.length === 0) return 0;

    const totalDuration = allocations.reduce((total, allocation) => {
      return total + this.getMinutesDifference(allocation.startTime, allocation.endTime);
    }, 0);

    const operatingHours = 14 * 60; // Assume 14 hour operating day
    return Math.min(100, (totalDuration / operatingHours) * 100);
  }

  // Utility functions
  private static addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  private static getMinutesDifference(startTime: string, endTime: string): number {
    const [startHours, startMins] = startTime.split(':').map(Number);
    const [endHours, endMins] = endTime.split(':').map(Number);
    const startTotal = startHours * 60 + startMins;
    const endTotal = endHours * 60 + endMins;
    return endTotal - startTotal;
  }

  private static timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && start2 < end1;
  }

  private static sequenceMatches(actual: WorkoutType[], pattern: WorkoutType[]): boolean {
    if (actual.length !== pattern.length) return false;
    return actual.every((type, index) => type === pattern[index]);
  }
}

export default SmartAllocationAlgorithms;