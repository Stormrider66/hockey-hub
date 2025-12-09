import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  CreateDevelopmentPlanDto,
  UpdateDevelopmentPlanDto,
  AddGoalDto,
  UpdateGoalProgressDto,
  AddMilestoneDto,
  CompleteMilestoneDto,
  CurrentLevelDto,
  DevelopmentGoalDto,
  WeeklyPlanDto,
  MilestoneDto,
  ParentCommunicationDto,
  ExternalResourceDto
} from '../../../dto/coach/player-development-plan.dto';

describe('Player Development Plan DTOs', () => {
  describe('CurrentLevelDto', () => {
    const validCurrentLevel = {
      overallRating: 75,
      strengths: ['Good skating', 'Strong shot', 'Leadership'],
      weaknesses: ['Weak backhand', 'Positioning'],
      recentEvaluation: 'eval-123'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(CurrentLevelDto, validCurrentLevel);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with rating below minimum', async () => {
      const dto = plainToClass(CurrentLevelDto, {
        ...validCurrentLevel,
        overallRating: 0
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('overallRating');
    });

    it('should fail validation with rating above maximum', async () => {
      const dto = plainToClass(CurrentLevelDto, {
        ...validCurrentLevel,
        overallRating: 101
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('overallRating');
    });

    it('should fail validation with strength exceeding max length', async () => {
      const dto = plainToClass(CurrentLevelDto, {
        ...validCurrentLevel,
        strengths: ['A'.repeat(201)]
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should fail validation with empty strengths array', async () => {
      const dto = plainToClass(CurrentLevelDto, {
        ...validCurrentLevel,
        strengths: []
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('strengths');
    });
  });

  describe('DevelopmentGoalDto', () => {
    const validGoal = {
      id: 'goal-123',
      category: 'technical',
      skill: 'Backhand shooting',
      currentLevel: 6,
      targetLevel: 8,
      deadline: '2024-12-31T23:59:59Z',
      specificActions: ['Practice 50 backhand shots daily', 'Work with shooting coach'],
      measurementMethod: 'Shot accuracy percentage',
      progress: 35,
      status: 'in_progress'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(DevelopmentGoalDto, validGoal);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid category', async () => {
      const dto = plainToClass(DevelopmentGoalDto, {
        ...validGoal,
        category: 'invalid_category'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('category');
    });

    it('should fail validation with current level out of range', async () => {
      const dto = plainToClass(DevelopmentGoalDto, {
        ...validGoal,
        currentLevel: 0
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('currentLevel');
    });

    it('should fail validation with target level out of range', async () => {
      const dto = plainToClass(DevelopmentGoalDto, {
        ...validGoal,
        targetLevel: 11
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('targetLevel');
    });

    it('should fail validation with progress out of range', async () => {
      const dto = plainToClass(DevelopmentGoalDto, {
        ...validGoal,
        progress: -5
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('progress');
    });

    it('should fail validation with invalid status', async () => {
      const dto = plainToClass(DevelopmentGoalDto, {
        ...validGoal,
        status: 'invalid_status'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
    });

    it('should validate all category types', async () => {
      const categories = ['technical', 'tactical', 'physical', 'mental'];
      
      for (const category of categories) {
        const dto = plainToClass(DevelopmentGoalDto, {
          ...validGoal,
          category
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should validate all status types', async () => {
      const statuses = ['not_started', 'in_progress', 'completed', 'delayed'];
      
      for (const status of statuses) {
        const dto = plainToClass(DevelopmentGoalDto, {
          ...validGoal,
          status
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe('WeeklyPlanDto', () => {
    const validWeeklyPlan = {
      week: 12,
      focus: ['Shooting accuracy', 'Defensive positioning'],
      drills: ['drill-1', 'drill-2', 'drill-3'],
      targetMetrics: { shotsOnNet: 15, accuracy: 80 },
      actualMetrics: { shotsOnNet: 12, accuracy: 75 }
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(WeeklyPlanDto, validWeeklyPlan);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with week below minimum', async () => {
      const dto = plainToClass(WeeklyPlanDto, {
        ...validWeeklyPlan,
        week: 0
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('week');
    });

    it('should fail validation with week above maximum', async () => {
      const dto = plainToClass(WeeklyPlanDto, {
        ...validWeeklyPlan,
        week: 53
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('week');
    });

    it('should fail validation with focus item exceeding max length', async () => {
      const dto = plainToClass(WeeklyPlanDto, {
        ...validWeeklyPlan,
        focus: ['A'.repeat(201)]
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should fail validation with drill ID exceeding max length', async () => {
      const dto = plainToClass(WeeklyPlanDto, {
        ...validWeeklyPlan,
        drills: ['A'.repeat(51)]
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should pass validation without optional actualMetrics', async () => {
      const { actualMetrics, ...planWithoutActual } = validWeeklyPlan;
      const dto = plainToClass(WeeklyPlanDto, planWithoutActual);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('MilestoneDto', () => {
    const validMilestone = {
      date: '2024-06-30T00:00:00Z',
      description: 'Complete 100 backhand shots with 70% accuracy',
      metric: 'Shot accuracy',
      target: 70,
      achieved: 68,
      status: 'missed'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(MilestoneDto, validMilestone);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid status', async () => {
      const dto = plainToClass(MilestoneDto, {
        ...validMilestone,
        status: 'invalid_status'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
    });

    it('should fail validation with description exceeding max length', async () => {
      const dto = plainToClass(MilestoneDto, {
        ...validMilestone,
        description: 'A'.repeat(256)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
    });

    it('should pass validation without optional achieved value', async () => {
      const { achieved, ...milestoneWithoutAchieved } = validMilestone;
      const dto = plainToClass(MilestoneDto, milestoneWithoutAchieved);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate all status types', async () => {
      const statuses = ['pending', 'achieved', 'missed'];
      
      for (const status of statuses) {
        const dto = plainToClass(MilestoneDto, {
          ...validMilestone,
          status
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe('ParentCommunicationDto', () => {
    const validCommunication = {
      date: '2024-09-15T14:30:00Z',
      method: 'meeting',
      summary: 'Discussed player progress and upcoming development goals',
      nextFollowUp: '2024-10-15T14:30:00Z'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(ParentCommunicationDto, validCommunication);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid method', async () => {
      const dto = plainToClass(ParentCommunicationDto, {
        ...validCommunication,
        method: 'invalid_method'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('method');
    });

    it('should fail validation with summary exceeding max length', async () => {
      const dto = plainToClass(ParentCommunicationDto, {
        ...validCommunication,
        summary: 'A'.repeat(1001)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('summary');
    });

    it('should pass validation without optional nextFollowUp', async () => {
      const { nextFollowUp, ...communicationWithoutFollowUp } = validCommunication;
      const dto = plainToClass(ParentCommunicationDto, communicationWithoutFollowUp);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate all communication methods', async () => {
      const methods = ['meeting', 'email', 'phone'];
      
      for (const method of methods) {
        const dto = plainToClass(ParentCommunicationDto, {
          ...validCommunication,
          method
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe('ExternalResourceDto', () => {
    const validResource = {
      type: 'video',
      name: 'Hockey Shooting Technique Tutorial',
      url: 'https://example.com/shooting-tutorial',
      assignedDate: '2024-09-01T00:00:00Z',
      completedDate: '2024-09-05T00:00:00Z'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(ExternalResourceDto, validResource);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid type', async () => {
      const dto = plainToClass(ExternalResourceDto, {
        ...validResource,
        type: 'invalid_type'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('type');
    });

    it('should fail validation with name exceeding max length', async () => {
      const dto = plainToClass(ExternalResourceDto, {
        ...validResource,
        name: 'A'.repeat(256)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
    });

    it('should fail validation with invalid URL', async () => {
      const dto = plainToClass(ExternalResourceDto, {
        ...validResource,
        url: 'not-a-valid-url'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('url');
    });

    it('should pass validation without optional URL', async () => {
      const { url, ...resourceWithoutUrl } = validResource;
      const dto = plainToClass(ExternalResourceDto, resourceWithoutUrl);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation without optional completedDate', async () => {
      const { completedDate, ...resourceWithoutCompleted } = validResource;
      const dto = plainToClass(ExternalResourceDto, resourceWithoutCompleted);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate all resource types', async () => {
      const types = ['video', 'article', 'course', 'camp'];
      
      for (const type of types) {
        const dto = plainToClass(ExternalResourceDto, {
          ...validResource,
          type
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe('CreateDevelopmentPlanDto', () => {
    const validCreateData = {
      playerId: '550e8400-e29b-41d4-a716-446655440000',
      coachId: '550e8400-e29b-41d4-a716-446655440001',
      seasonId: '550e8400-e29b-41d4-a716-446655440002',
      startDate: '2024-09-01T00:00:00Z',
      endDate: '2024-04-30T00:00:00Z',
      currentLevel: {
        overallRating: 75,
        strengths: ['Good skating', 'Strong shot'],
        weaknesses: ['Weak backhand', 'Positioning'],
        recentEvaluation: 'eval-123'
      },
      goals: [{
        id: 'goal-1',
        category: 'technical',
        skill: 'Backhand shooting',
        currentLevel: 6,
        targetLevel: 8,
        deadline: '2024-12-31T23:59:59Z',
        specificActions: ['Practice daily'],
        measurementMethod: 'Accuracy percentage',
        progress: 0,
        status: 'not_started'
      }],
      weeklyPlan: [{
        week: 1,
        focus: ['Shooting'],
        drills: ['drill-1'],
        targetMetrics: { accuracy: 70 }
      }],
      milestones: [{
        date: '2024-10-31T00:00:00Z',
        description: 'First milestone',
        metric: 'Accuracy',
        target: 65,
        status: 'pending'
      }],
      parentCommunication: [{
        date: '2024-09-15T14:30:00Z',
        method: 'meeting',
        summary: 'Initial meeting'
      }],
      externalResources: [{
        type: 'video',
        name: 'Shooting Tutorial',
        assignedDate: '2024-09-01T00:00:00Z'
      }],
      status: 'active',
      notes: 'Player shows great potential'
    };

    it('should pass validation with complete valid data', async () => {
      const dto = plainToClass(CreateDevelopmentPlanDto, validCreateData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with minimal required data', async () => {
      const minimalData = {
        playerId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        seasonId: '550e8400-e29b-41d4-a716-446655440002',
        startDate: '2024-09-01',
        endDate: '2024-04-30',
        currentLevel: validCreateData.currentLevel,
        goals: validCreateData.goals,
        weeklyPlan: validCreateData.weeklyPlan,
        milestones: validCreateData.milestones
      };
      const dto = plainToClass(CreateDevelopmentPlanDto, minimalData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation without required playerId', async () => {
      const { playerId, ...dataWithoutPlayerId } = validCreateData;
      const dto = plainToClass(CreateDevelopmentPlanDto, dataWithoutPlayerId);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'playerId')).toBe(true);
    });

    it('should fail validation with invalid UUID format', async () => {
      const dto = plainToClass(CreateDevelopmentPlanDto, {
        ...validCreateData,
        playerId: 'invalid-uuid'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('playerId');
    });

    it('should fail validation with invalid status', async () => {
      const dto = plainToClass(CreateDevelopmentPlanDto, {
        ...validCreateData,
        status: 'invalid_status'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
    });

    it('should fail validation with notes exceeding max length', async () => {
      const dto = plainToClass(CreateDevelopmentPlanDto, {
        ...validCreateData,
        notes: 'A'.repeat(2001)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('notes');
    });

    it('should validate nested currentLevel correctly', async () => {
      const invalidCurrentLevelData = {
        ...validCreateData,
        currentLevel: {
          ...validCreateData.currentLevel,
          overallRating: 0 // invalid
        }
      };
      const dto = plainToClass(CreateDevelopmentPlanDto, invalidCurrentLevelData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation with empty goals array', async () => {
      const dto = plainToClass(CreateDevelopmentPlanDto, {
        ...validCreateData,
        goals: []
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('goals');
    });

    it('should fail validation with empty weekly plan array', async () => {
      const dto = plainToClass(CreateDevelopmentPlanDto, {
        ...validCreateData,
        weeklyPlan: []
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('weeklyPlan');
    });

    it('should validate all status types', async () => {
      const statuses = ['active', 'paused', 'completed', 'archived'];
      
      for (const status of statuses) {
        const dto = plainToClass(CreateDevelopmentPlanDto, {
          ...validCreateData,
          status
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe('UpdateDevelopmentPlanDto', () => {
    const validUpdateData = {
      startDate: '2024-09-15T00:00:00Z',
      endDate: '2024-05-15T00:00:00Z',
      status: 'paused',
      notes: 'Updated development plan notes'
    };

    it('should pass validation with valid update data', async () => {
      const dto = plainToClass(UpdateDevelopmentPlanDto, validUpdateData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty object (all optional)', async () => {
      const dto = plainToClass(UpdateDevelopmentPlanDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid status', async () => {
      const dto = plainToClass(UpdateDevelopmentPlanDto, {
        status: 'invalid_status'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
    });

    it('should fail validation with notes exceeding max length', async () => {
      const dto = plainToClass(UpdateDevelopmentPlanDto, {
        notes: 'A'.repeat(2001)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('notes');
    });
  });

  describe('AddGoalDto', () => {
    const validAddGoal = {
      category: 'physical',
      skill: 'Leg strength',
      currentLevel: 5,
      targetLevel: 7,
      deadline: '2024-12-31T23:59:59Z',
      specificActions: ['Gym workout 3x/week', 'Squats and lunges'],
      measurementMethod: 'Max squat weight'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(AddGoalDto, validAddGoal);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation without required fields', async () => {
      const { category, ...dataWithoutCategory } = validAddGoal;
      const dto = plainToClass(AddGoalDto, dataWithoutCategory);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'category')).toBe(true);
    });

    it('should fail validation with levels out of range', async () => {
      const dto = plainToClass(AddGoalDto, {
        ...validAddGoal,
        currentLevel: 0,
        targetLevel: 11
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(2);
    });
  });

  describe('UpdateGoalProgressDto', () => {
    const validUpdateProgress = {
      goalId: 'goal-123',
      progress: 65,
      status: 'in_progress',
      notes: 'Good progress this week'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(UpdateGoalProgressDto, validUpdateProgress);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with progress out of range', async () => {
      const dto = plainToClass(UpdateGoalProgressDto, {
        ...validUpdateProgress,
        progress: -5
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('progress');
    });

    it('should fail validation with goalId exceeding max length', async () => {
      const dto = plainToClass(UpdateGoalProgressDto, {
        ...validUpdateProgress,
        goalId: 'A'.repeat(51)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('goalId');
    });

    it('should pass validation without optional notes', async () => {
      const { notes, ...updateWithoutNotes } = validUpdateProgress;
      const dto = plainToClass(UpdateGoalProgressDto, updateWithoutNotes);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('AddMilestoneDto', () => {
    const validAddMilestone = {
      date: '2024-11-30T00:00:00Z',
      description: 'Complete advanced shooting drill',
      metric: 'Shot accuracy',
      target: 80
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(AddMilestoneDto, validAddMilestone);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation without required fields', async () => {
      const { description, ...dataWithoutDescription } = validAddMilestone;
      const dto = plainToClass(AddMilestoneDto, dataWithoutDescription);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'description')).toBe(true);
    });

    it('should fail validation with description exceeding max length', async () => {
      const dto = plainToClass(AddMilestoneDto, {
        ...validAddMilestone,
        description: 'A'.repeat(256)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
    });
  });

  describe('CompleteMilestoneDto', () => {
    const validCompleteMilestone = {
      achieved: 75,
      status: 'achieved',
      notes: 'Successfully completed milestone'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(CompleteMilestoneDto, validCompleteMilestone);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid status', async () => {
      const dto = plainToClass(CompleteMilestoneDto, {
        ...validCompleteMilestone,
        status: 'pending'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
    });

    it('should pass validation without optional notes', async () => {
      const { notes, ...completeWithoutNotes } = validCompleteMilestone;
      const dto = plainToClass(CompleteMilestoneDto, completeWithoutNotes);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate both completion statuses', async () => {
      const statuses = ['achieved', 'missed'];
      
      for (const status of statuses) {
        const dto = plainToClass(CompleteMilestoneDto, {
          ...validCompleteMilestone,
          status
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe('Complex Nested Validation', () => {
    it('should validate complex development plan with all nested structures', async () => {
      const complexPlan = {
        playerId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        seasonId: '550e8400-e29b-41d4-a716-446655440002',
        startDate: '2024-09-01T00:00:00Z',
        endDate: '2025-04-30T00:00:00Z',
        currentLevel: {
          overallRating: 82,
          strengths: ['Excellent vision', 'Strong leadership', 'Good work ethic'],
          weaknesses: ['Needs to improve shot power', 'Defensive positioning'],
          recentEvaluation: 'eval-2024-001'
        },
        goals: [
          {
            id: 'goal-tech-1',
            category: 'technical',
            skill: 'Shot power',
            currentLevel: 6,
            targetLevel: 8,
            deadline: '2024-12-31T23:59:59Z',
            specificActions: ['Weight training 3x/week', 'Shot practice with resistance bands'],
            measurementMethod: 'Shot velocity measurement',
            progress: 15,
            status: 'in_progress'
          },
          {
            id: 'goal-tact-1',
            category: 'tactical',
            skill: 'Defensive positioning',
            currentLevel: 5,
            targetLevel: 7,
            deadline: '2025-02-28T23:59:59Z',
            specificActions: ['Video analysis sessions', 'Position-specific drills'],
            measurementMethod: 'Coach evaluation score',
            progress: 5,
            status: 'not_started'
          }
        ],
        weeklyPlan: [
          {
            week: 1,
            focus: ['Shot power development', 'Strength training'],
            drills: ['power-shot-1', 'resistance-band-2', 'weights-3'],
            targetMetrics: { shotVelocity: 85, squatWeight: 200 },
            actualMetrics: { shotVelocity: 82, squatWeight: 195 }
          },
          {
            week: 2,
            focus: ['Defensive positioning', 'Video analysis'],
            drills: ['defensive-drill-1', 'positioning-2'],
            targetMetrics: { positioningScore: 7 }
          }
        ],
        milestones: [
          {
            date: '2024-10-31T23:59:59Z',
            description: 'Achieve 90 mph shot velocity',
            metric: 'Shot velocity',
            target: 90,
            status: 'pending'
          },
          {
            date: '2024-12-31T23:59:59Z',
            description: 'Improve defensive positioning score to 7/10',
            metric: 'Positioning score',
            target: 7,
            achieved: 6.5,
            status: 'achieved'
          }
        ],
        parentCommunication: [
          {
            date: '2024-09-15T14:30:00Z',
            method: 'meeting',
            summary: 'Initial development plan discussion. Parents supportive of goals.',
            nextFollowUp: '2024-10-15T14:30:00Z'
          },
          {
            date: '2024-10-15T14:30:00Z',
            method: 'email',
            summary: 'Progress update sent via email. Player making good progress on strength.'
          }
        ],
        externalResources: [
          {
            type: 'video',
            name: 'NHL Shot Power Analysis',
            url: 'https://example.com/shot-power-video',
            assignedDate: '2024-09-01T00:00:00Z',
            completedDate: '2024-09-05T00:00:00Z'
          },
          {
            type: 'course',
            name: 'Defensive Hockey Fundamentals',
            assignedDate: '2024-09-10T00:00:00Z'
          }
        ],
        status: 'active',
        notes: 'Player shows excellent commitment to development goals. Strong support from parents.'
      };

      const dto = plainToClass(CreateDevelopmentPlanDto, complexPlan);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with multiple nested errors', async () => {
      const invalidComplexPlan = {
        playerId: 'invalid-uuid', // invalid
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        seasonId: '550e8400-e29b-41d4-a716-446655440002',
        startDate: 'invalid-date', // invalid
        endDate: '2025-04-30T00:00:00Z',
        currentLevel: {
          overallRating: 150, // invalid - above maximum
          strengths: [],      // invalid - empty array
          weaknesses: ['Test'],
          recentEvaluation: 'eval-001'
        },
        goals: [{
          id: 'goal-1',
          category: 'invalid_category', // invalid
          skill: 'Test skill',
          currentLevel: 0,  // invalid - below minimum
          targetLevel: 11,  // invalid - above maximum
          deadline: '2024-12-31T23:59:59Z',
          specificActions: ['Action'],
          measurementMethod: 'Method',
          progress: -5,     // invalid - below minimum
          status: 'invalid_status' // invalid
        }],
        weeklyPlan: [{
          week: 0, // invalid - below minimum
          focus: ['Focus'],
          drills: ['drill'],
          targetMetrics: {}
        }],
        milestones: [{
          date: '2024-10-31T23:59:59Z',
          description: 'A'.repeat(300), // invalid - too long
          metric: 'Metric',
          target: 50,
          status: 'invalid_status' // invalid
        }],
        status: 'invalid_status' // invalid
      };

      const dto = plainToClass(CreateDevelopmentPlanDto, invalidComplexPlan);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(8); // Multiple validation errors
    });
  });

  describe('Boundary Value Testing', () => {
    it('should handle minimum boundary values correctly', async () => {
      const minBoundaryData = {
        playerId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        seasonId: '550e8400-e29b-41d4-a716-446655440002',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        currentLevel: {
          overallRating: 1,     // minimum
          strengths: ['A'],     // minimum array length
          weaknesses: ['B'],
          recentEvaluation: 'E'
        },
        goals: [{
          id: '1',
          category: 'technical',
          skill: 'S',
          currentLevel: 1,      // minimum
          targetLevel: 1,       // minimum
          deadline: '2024-12-31T23:59:59Z',
          specificActions: ['A'],
          measurementMethod: 'M',
          progress: 0,          // minimum
          status: 'not_started'
        }],
        weeklyPlan: [{
          week: 1,              // minimum
          focus: ['F'],
          drills: ['D'],
          targetMetrics: {}
        }],
        milestones: [{
          date: '2024-12-31T23:59:59Z',
          description: 'D',
          metric: 'M',
          target: 0,
          status: 'pending'
        }]
      };

      const dto = plainToClass(CreateDevelopmentPlanDto, minBoundaryData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle maximum boundary values correctly', async () => {
      const maxBoundaryData = {
        playerId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        seasonId: '550e8400-e29b-41d4-a716-446655440002',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        currentLevel: {
          overallRating: 100,   // maximum
          strengths: Array(10).fill('A'.repeat(200)), // maximum string lengths
          weaknesses: Array(10).fill('B'.repeat(200)),
          recentEvaluation: 'E'.repeat(50)
        },
        goals: [{
          id: '1'.repeat(50),
          category: 'mental',
          skill: 'S'.repeat(255), // maximum
          currentLevel: 10,       // maximum
          targetLevel: 10,        // maximum
          deadline: '2024-12-31T23:59:59Z',
          specificActions: Array(10).fill('A'.repeat(300)), // maximum
          measurementMethod: 'M'.repeat(255),
          progress: 100,          // maximum
          status: 'completed'
        }],
        weeklyPlan: [{
          week: 52,               // maximum
          focus: Array(10).fill('F'.repeat(200)), // maximum
          drills: Array(20).fill('D'.repeat(50)), // maximum
          targetMetrics: { test: 100 }
        }],
        milestones: [{
          date: '2024-12-31T23:59:59Z',
          description: 'D'.repeat(255), // maximum
          metric: 'M'.repeat(100),       // maximum
          target: 1000,
          status: 'achieved'
        }],
        notes: 'N'.repeat(2000)  // maximum
      };

      const dto = plainToClass(CreateDevelopmentPlanDto, maxBoundaryData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});