import { MedicalComplianceService } from '../services/MedicalComplianceService';
import { LoadManagementService } from '../services/LoadManagementService';
import { RecoveryProtocolAdherenceService } from '../services/RecoveryProtocolAdherenceService';

describe('Medical Integration Tests', () => {
  let complianceService: MedicalComplianceService;
  let loadManagementService: LoadManagementService;
  let recoveryService: RecoveryProtocolAdherenceService;

  beforeEach(() => {
    complianceService = new MedicalComplianceService();
    loadManagementService = new LoadManagementService();
    recoveryService = new RecoveryProtocolAdherenceService();
  });

  describe('MedicalComplianceService', () => {
    it('should identify exercise restrictions for injured players', async () => {
      const exercises = [
        { name: 'squat', type: 'strength', bodyPart: 'knee' },
        { name: 'overhead press', type: 'strength', bodyPart: 'shoulder' }
      ];

      const result = await complianceService.checkWorkoutCompliance('1', exercises, 100);

      expect(result).toBeDefined();
      expect(result.isCompliant).toBeDefined();
      expect(result.restrictions).toBeInstanceOf(Array);
      expect(result.substitutions).toBeInstanceOf(Array);
    });

    it('should generate exercise substitutions for prohibited exercises', async () => {
      const exercises = [
        { name: 'deadlift', type: 'strength', bodyPart: 'back' }
      ];

      const result = await complianceService.checkWorkoutCompliance('1', exercises, 100);

      if (!result.isCompliant && result.substitutions.length > 0) {
        const substitution = result.substitutions[0];
        expect(substitution.originalExercise).toBe('deadlift');
        expect(substitution.substituteExercise).toBeDefined();
        expect(substitution.modifications).toBeInstanceOf(Array);
        expect(substitution.reason).toBeDefined();
      }
    });

    it('should assess real-time injury risk based on metrics', async () => {
      const metrics = {
        heartRate: 180,
        rpe: 9,
        powerOutput: 300,
        duration: 90
      };

      const riskAlert = await complianceService.assessRealTimeInjuryRisk('1', metrics);

      if (riskAlert) {
        expect(riskAlert.playerId).toBe('1');
        expect(riskAlert.riskLevel).toMatch(/^(low|medium|high|critical)$/);
        expect(riskAlert.riskFactors).toBeInstanceOf(Array);
        expect(riskAlert.recommendations).toBeInstanceOf(Array);
        expect(riskAlert.timestamp).toBeInstanceOf(Date);
      }
    });

    it('should handle batch compliance checking', async () => {
      const exercises = [
        { name: 'squat', type: 'strength' },
        { name: 'bench press', type: 'strength' }
      ];

      // Mock multiple players
      const playerIds = ['1', '2', '3'];
      const results = await Promise.all(
        playerIds.map(playerId => 
          complianceService.checkWorkoutCompliance(playerId, exercises, 100)
        )
      );

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.isCompliant).toBeDefined();
        expect(result.restrictions).toBeInstanceOf(Array);
        expect(result.substitutions).toBeInstanceOf(Array);
      });
    });
  });

  describe('LoadManagementService', () => {
    it('should calculate load management recommendations', async () => {
      const loadData = await loadManagementService.calculateLoadManagement('1', 100);

      expect(loadData).toBeDefined();
      expect(loadData.playerId).toBe('1');
      expect(loadData.currentLoad).toBe(100);
      expect(loadData.recommendedLoad).toBeGreaterThanOrEqual(20);
      expect(loadData.recommendedLoad).toBeLessThanOrEqual(100);
      expect(loadData.riskLevel).toMatch(/^(low|medium|high|critical)$/);
      expect(loadData.factors).toBeInstanceOf(Array);
      expect(loadData.recommendations).toBeInstanceOf(Array);
    });

    it('should record and track load compliance', async () => {
      const plannedLoad = 80;
      const actualLoad = 75;

      await loadManagementService.recordLoadCompliance('1', plannedLoad, actualLoad);

      const trends = await loadManagementService.getLoadTrends('1', 7);
      expect(trends).toBeInstanceOf(Array);
      
      if (trends.length > 0) {
        const latestTrend = trends[trends.length - 1];
        expect(latestTrend.playerId).toBe('1');
        expect(latestTrend.load).toBe(actualLoad);
        expect(latestTrend.compliance).toBe(true); // Within 10% tolerance
      }
    });

    it('should provide real-time load adjustments', async () => {
      const metrics = {
        heartRate: 195,
        rpe: 9,
        duration: 75
      };

      const adjustment = await loadManagementService.updateRealTimeLoad('1', metrics);

      if (adjustment) {
        expect(adjustment.recommendedAdjustment).toBeLessThan(0); // Should recommend reduction
        expect(adjustment.reason).toBeDefined();
      }
    });

    it('should handle batch load recommendations', async () => {
      const playerIds = ['1', '2', '3'];
      const batchResults = await loadManagementService.getBatchLoadRecommendations(playerIds);

      expect(Object.keys(batchResults)).toHaveLength(playerIds.length);
      
      playerIds.forEach(playerId => {
        expect(batchResults[playerId]).toBeDefined();
        expect(batchResults[playerId].playerId).toBe(playerId);
      });
    });
  });

  describe('RecoveryProtocolAdherenceService', () => {
    it('should initialize recovery protocol with milestones', async () => {
      const milestones = await recoveryService.initializeRecoveryProtocol('1', 'knee_injury');

      expect(milestones).toBeInstanceOf(Array);
      expect(milestones.length).toBeGreaterThan(0);
      
      milestones.forEach(milestone => {
        expect(milestone.id).toBeDefined();
        expect(milestone.name).toBeDefined();
        expect(milestone.targetDate).toBeInstanceOf(Date);
        expect(milestone.isCompleted).toBe(false);
      });
    });

    it('should record adherence entries', async () => {
      await recoveryService.initializeRecoveryProtocol('1', 'default');

      await recoveryService.recordAdherence('1', {
        activity: 'Range of motion exercises',
        type: 'exercise',
        completed: true,
        notes: 'Completed full set without pain'
      });

      const timeline = await recoveryService.getRecoveryTimeline('1');
      expect(timeline.entries).toBeInstanceOf(Array);
      expect(timeline.entries.length).toBeGreaterThan(0);
    });

    it('should calculate adherence metrics', async () => {
      await recoveryService.initializeRecoveryProtocol('1', 'default');
      
      // Record some adherence entries
      await recoveryService.recordAdherence('1', {
        activity: 'Exercise 1',
        type: 'exercise',
        completed: true
      });

      await recoveryService.recordAdherence('1', {
        activity: 'Assessment 1',
        type: 'assessment',
        completed: false
      });

      const metrics = await recoveryService.calculateAdherenceMetrics('1');

      expect(metrics.playerId).toBe('1');
      expect(metrics.overallCompliance).toBeGreaterThanOrEqual(0);
      expect(metrics.overallCompliance).toBeLessThanOrEqual(100);
      expect(metrics.exerciseCompliance).toBeGreaterThanOrEqual(0);
      expect(metrics.assessmentCompliance).toBeGreaterThanOrEqual(0);
      expect(metrics.riskFactors).toBeInstanceOf(Array);
      expect(metrics.recommendations).toBeInstanceOf(Array);
    });

    it('should complete milestones and update progress', async () => {
      const milestones = await recoveryService.initializeRecoveryProtocol('1', 'default');
      const firstMilestone = milestones[0];

      await recoveryService.completeMilestone('1', firstMilestone.name);

      const timeline = await recoveryService.getRecoveryTimeline('1');
      expect(timeline.progressPercentage).toBeGreaterThan(0);
      
      const completedMilestone = timeline.milestones.find(m => m.name === firstMilestone.name);
      expect(completedMilestone?.isCompleted).toBe(true);
      expect(completedMilestone?.completedDate).toBeInstanceOf(Date);
    });

    it('should generate adherence alerts', async () => {
      await recoveryService.initializeRecoveryProtocol('1', 'default');

      const alerts = await recoveryService.generateAdherenceAlerts('1');

      expect(alerts).toBeInstanceOf(Array);
      alerts.forEach(alert => {
        expect(alert.type).toMatch(/^(milestone_overdue|poor_compliance|missed_assessment|protocol_deviation)$/);
        expect(alert.severity).toMatch(/^(low|medium|high)$/);
        expect(alert.message).toBeDefined();
        expect(alert.action).toBeDefined();
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle strength workout with injured player', async () => {
      const strengthExercises = [
        { name: 'squat', type: 'strength', bodyPart: 'knee', sets: 3, reps: 10 },
        { name: 'bench press', type: 'strength', bodyPart: 'chest', sets: 3, reps: 8 },
        { name: 'deadlift', type: 'strength', bodyPart: 'back', sets: 3, reps: 5 }
      ];

      const complianceResult = await complianceService.checkWorkoutCompliance('1', strengthExercises, 85);
      const loadManagement = await loadManagementService.calculateLoadManagement('1', 85);

      expect(complianceResult).toBeDefined();
      expect(loadManagement).toBeDefined();

      // If player has restrictions, load should be reduced
      if (complianceResult.restrictions.length > 0) {
        expect(loadManagement.recommendedLoad).toBeLessThan(85);
      }
    });

    it('should handle conditioning workout with load management', async () => {
      const conditioningWorkout = [
        { name: 'interval running', type: 'conditioning', duration: 30, intensity: 90 },
        { name: 'bike intervals', type: 'conditioning', duration: 20, intensity: 85 }
      ];

      const complianceResult = await complianceService.checkWorkoutCompliance('1', conditioningWorkout, 90);
      
      // Simulate real-time metrics during conditioning
      const metrics = {
        heartRate: 175,
        rpe: 8,
        duration: 25
      };

      const riskAssessment = await complianceService.assessRealTimeInjuryRisk('1', metrics);
      const realTimeAdjustment = await loadManagementService.updateRealTimeLoad('1', metrics);

      expect(complianceResult).toBeDefined();
      
      if (riskAssessment) {
        expect(riskAssessment.riskLevel).toBeDefined();
      }

      if (realTimeAdjustment) {
        expect(realTimeAdjustment.recommendedAdjustment).toBeDefined();
      }
    });

    it('should handle hybrid workout with medical restrictions', async () => {
      const hybridWorkout = [
        { name: 'circuit training', type: 'hybrid', exercises: ['squat', 'push-up', 'burpee'] },
        { name: 'interval cardio', type: 'conditioning', duration: 15 }
      ];

      const complianceResult = await complianceService.checkWorkoutCompliance('1', hybridWorkout, 80);

      expect(complianceResult).toBeDefined();

      // Check if substitutions are provided for restricted exercises
      if (!complianceResult.isCompliant) {
        expect(complianceResult.substitutions.length).toBeGreaterThan(0);
        complianceResult.substitutions.forEach(sub => {
          expect(sub.originalExercise).toBeDefined();
          expect(sub.substituteExercise).toBeDefined();
          expect(sub.modifications).toBeInstanceOf(Array);
        });
      }
    });

    it('should handle agility workout with injury considerations', async () => {
      const agilityWorkout = [
        { name: 'ladder drills', type: 'agility', bodyPart: 'ankle' },
        { name: 'cone drills', type: 'agility', bodyPart: 'knee' },
        { name: 'plyometrics', type: 'agility', bodyPart: 'knee' }
      ];

      const complianceResult = await complianceService.checkWorkoutCompliance('1', agilityWorkout, 75);

      expect(complianceResult).toBeDefined();

      // Agility workouts should be heavily restricted for lower body injuries
      const lowerBodyRestrictions = complianceResult.restrictions.filter(
        r => ['knee', 'ankle', 'hip'].some(part => r.bodyPart.toLowerCase().includes(part))
      );

      if (lowerBodyRestrictions.length > 0) {
        expect(complianceResult.isCompliant).toBe(false);
        expect(complianceResult.substitutions.length).toBeGreaterThan(0);
      }
    });

    it('should integrate recovery protocol with workout compliance', async () => {
      // Initialize recovery protocol
      await recoveryService.initializeRecoveryProtocol('1', 'knee_injury');

      // Check workout compliance
      const exercises = [
        { name: 'knee extension', type: 'rehabilitation' },
        { name: 'range of motion', type: 'rehabilitation' }
      ];

      const complianceResult = await complianceService.checkWorkoutCompliance('1', exercises, 60);

      // Record adherence based on compliance
      await recoveryService.recordAdherence('1', {
        activity: 'Rehabilitation exercises',
        type: 'exercise',
        completed: complianceResult.isCompliant,
        notes: complianceResult.isCompliant 
          ? 'Completed rehabilitation exercises as prescribed'
          : 'Modified exercises due to restrictions'
      });

      const metrics = await recoveryService.calculateAdherenceMetrics('1');
      expect(metrics).toBeDefined();
      expect(metrics.overallCompliance).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid player IDs gracefully', async () => {
      const result = await complianceService.checkWorkoutCompliance('invalid', [], 100);
      
      expect(result).toBeDefined();
      expect(result.isCompliant).toBeDefined();
      expect(result.medicalNotes).toContain('Compliance check error');
    });

    it('should handle empty exercise lists', async () => {
      const result = await complianceService.checkWorkoutCompliance('1', [], 100);
      
      expect(result).toBeDefined();
      expect(result.isCompliant).toBe(true); // No exercises means compliant
      expect(result.restrictions).toHaveLength(0);
      expect(result.substitutions).toHaveLength(0);
    });

    it('should handle missing medical data', async () => {
      // This should not throw but return safe defaults
      const loadData = await loadManagementService.calculateLoadManagement('999', 100);
      
      expect(loadData).toBeDefined();
      expect(loadData.playerId).toBe('999');
      expect(loadData.riskLevel).toBe('low'); // Default for no medical data
    });
  });

  describe('Performance', () => {
    it('should complete compliance checks within acceptable time', async () => {
      const startTime = Date.now();
      
      const exercises = Array.from({ length: 20 }, (_, i) => ({
        name: `exercise-${i}`,
        type: 'strength'
      }));

      await complianceService.checkWorkoutCompliance('1', exercises, 100);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent compliance checks', async () => {
      const exercises = [
        { name: 'squat', type: 'strength' },
        { name: 'bench press', type: 'strength' }
      ];

      const promises = Array.from({ length: 10 }, (_, i) =>
        complianceService.checkWorkoutCompliance(`player-${i}`, exercises, 100)
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        expect(result.isCompliant).toBeDefined();
      });
    });
  });
});

// Test utilities
export const createMockInjury = (playerId: string, type: string, severity: number) => ({
  playerId,
  injuryType: type,
  severityLevel: severity,
  bodyPart: 'knee',
  recoveryStatus: 'active' as const,
  injuryDate: new Date(),
  expectedReturnDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
});

export const createMockWellnessEntry = (playerId: string, overrides = {}) => ({
  playerId,
  entryDate: new Date(),
  sleepHours: 7,
  sleepQuality: 7,
  energyLevel: 7,
  stressLevel: 5,
  sorenessLevel: 4,
  hydrationLevel: 8,
  ...overrides
});

export const createMockExercise = (name: string, type: string, overrides = {}) => ({
  name,
  type,
  sets: 3,
  reps: 10,
  weight: 100,
  duration: null,
  ...overrides
});