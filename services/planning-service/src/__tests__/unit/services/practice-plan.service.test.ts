import { PracticePlanService, CreatePracticePlanDto, UpdatePracticePlanDto } from '../../../services/PracticePlanService';
import { PracticePlan, PracticeStatus, PracticeFocus } from '../../../entities/PracticePlan';
import { Drill } from '../../../entities/Drill';
import { TrainingPlan } from '../../../entities/TrainingPlan';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';
import { EventBus } from '@hockey-hub/shared-lib/dist/events/EventBus';
import { Repository } from 'typeorm';

// Mock dependencies
jest.mock('@hockey-hub/shared-lib/dist/utils/Logger');
jest.mock('@hockey-hub/shared-lib/dist/events/EventBus');
jest.mock('@hockey-hub/shared-lib/dist/cache/CachedRepository');
jest.mock('../../../config/database');

describe('PracticePlanService', () => {
  let service: PracticePlanService;
  let mockRepository: jest.Mocked<any>;
  let mockDrillRepository: jest.Mocked<Repository<Drill>>;
  let mockTrainingPlanRepository: jest.Mocked<Repository<TrainingPlan>>;
  let mockLogger: jest.Mocked<Logger>;
  let mockEventBus: jest.Mocked<EventBus>;

  const mockSections = [
    {
      id: 'section-1',
      name: 'Warm-up',
      duration: 15,
      drillIds: ['drill-1', 'drill-2'],
      notes: 'Light skating',
      equipment: ['pucks', 'cones']
    },
    {
      id: 'section-2',
      name: 'Shooting Practice',
      duration: 20,
      drillIds: ['drill-3'],
      notes: 'Focus on accuracy'
    }
  ];

  const mockPracticePlan: Partial<PracticePlan> = {
    id: 'practice-plan-1',
    title: 'Morning Practice',
    description: 'Regular training session',
    organizationId: 'org-1',
    teamId: 'team-1',
    coachId: 'coach-1',
    date: new Date('2025-02-01'),
    duration: 60,
    primaryFocus: PracticeFocus.SKILL_DEVELOPMENT,
    status: PracticeStatus.PLANNED,
    sections: mockSections,
    objectives: ['Improve passing', 'Work on shots'],
    equipment: ['pucks', 'cones', 'goals'],
    createdAt: new Date(),
    updatedAt: new Date(),
    getAttendanceRate: jest.fn().mockReturnValue(0.85)
  };

  const mockDrills = [
    { id: 'drill-1', name: 'Skating Drill', category: 'skating' },
    { id: 'drill-2', name: 'Passing Drill', category: 'passing' },
    { id: 'drill-3', name: 'Shooting Drill', category: 'shooting' }
  ];

  const mockTrainingPlan = {
    id: 'training-plan-1',
    name: 'Season Plan',
    teamId: 'team-1'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock repository methods
    mockRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      findMany: jest.fn(),
      remove: jest.fn(),
      findByTeamAndDateRange: jest.fn(),
      findByCoach: jest.fn(),
      findUpcomingPractices: jest.fn(),
      searchPracticePlans: jest.fn(),
      getPracticeAnalytics: jest.fn(),
      invalidateByTags: jest.fn(),
      cacheQueryResult: jest.fn()
    };

    mockDrillRepository = {
      createQueryBuilder: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn()
    } as any;

    mockTrainingPlanRepository = {
      findOne: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
      getInstance: jest.fn()
    } as any;

    // Setup static mocks
    (Logger as jest.MockedClass<typeof Logger>).mockImplementation(() => mockLogger);
    (EventBus.getInstance as jest.Mock).mockReturnValue(mockEventBus);

    service = new PracticePlanService();
    
    // Replace repository instances
    (service as any).repository = mockRepository;
    (service as any).drillRepository = mockDrillRepository;
    (service as any).trainingPlanRepository = mockTrainingPlanRepository;
  });

  describe('createPracticePlan', () => {
    const createDto: CreatePracticePlanDto = {
      title: 'Test Practice',
      description: 'Test description',
      organizationId: 'org-1',
      teamId: 'team-1',
      coachId: 'coach-1',
      date: new Date('2025-02-01'),
      duration: 60,
      primaryFocus: PracticeFocus.SKILL_DEVELOPMENT,
      secondaryFocus: [PracticeFocus.CONDITIONING],
      location: 'Main Rink',
      sections: mockSections,
      objectives: ['Test objective'],
      equipment: ['pucks']
    };

    it('should create a practice plan successfully', async () => {
      // Arrange
      mockDrillRepository.getMany.mockResolvedValue(mockDrills);
      mockRepository.save.mockResolvedValue(mockPracticePlan);

      // Act
      const result = await service.createPracticePlan(createDto);

      // Assert
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...createDto,
        status: PracticeStatus.PLANNED
      });
      expect(mockEventBus.publish).toHaveBeenCalledWith('practice-plan.created', {
        practicePlanId: mockPracticePlan.id,
        teamId: createDto.teamId,
        coachId: createDto.coachId,
        date: createDto.date,
        primaryFocus: createDto.primaryFocus,
        organizationId: createDto.organizationId
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating practice plan',
        { title: createDto.title, teamId: createDto.teamId }
      );
      expect(result).toEqual(mockPracticePlan);
    });

    it('should validate drill IDs exist', async () => {
      // Arrange
      mockDrillRepository.getMany.mockResolvedValue([mockDrills[0]]); // Missing drills

      // Act & Assert
      await expect(service.createPracticePlan(createDto)).rejects.toThrow(
        'Drill IDs not found: drill-2, drill-3'
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('should validate training plan if provided', async () => {
      // Arrange
      const createDtoWithTraining = {
        ...createDto,
        trainingPlanId: 'invalid-training-plan'
      };
      mockDrillRepository.getMany.mockResolvedValue(mockDrills);
      mockTrainingPlanRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createPracticePlan(createDtoWithTraining)).rejects.toThrow(
        'Training plan not found'
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should validate training plan belongs to team', async () => {
      // Arrange
      const createDtoWithTraining = {
        ...createDto,
        trainingPlanId: 'training-plan-1'
      };
      mockDrillRepository.getMany.mockResolvedValue(mockDrills);
      mockTrainingPlanRepository.findOne.mockResolvedValue({
        ...mockTrainingPlan,
        teamId: 'different-team'
      });

      // Act & Assert
      await expect(service.createPracticePlan(createDtoWithTraining)).rejects.toThrow(
        'Training plan does not belong to the specified team'
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle creation errors and log them', async () => {
      // Arrange
      mockDrillRepository.getMany.mockResolvedValue(mockDrills);
      const error = new Error('Database error');
      mockRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(service.createPracticePlan(createDto)).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error creating practice plan',
        { error: error.message, data: createDto }
      );
    });
  });

  describe('updatePracticePlan', () => {
    const updateDto: UpdatePracticePlanDto = {
      title: 'Updated Practice',
      duration: 90,
      status: PracticeStatus.IN_PROGRESS
    };

    it('should update a practice plan successfully', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockPracticePlan);
      mockRepository.save.mockResolvedValue({ ...mockPracticePlan, ...updateDto });

      // Act
      const result = await service.updatePracticePlan('practice-plan-1', updateDto);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'practice-plan-1' } });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockRepository.invalidateByTags).toHaveBeenCalledWith([
        `team:${mockPracticePlan.teamId}`,
        `coach:${mockPracticePlan.coachId}`,
        `organization:${mockPracticePlan.organizationId}`
      ]);
      expect(mockEventBus.publish).toHaveBeenCalledWith('practice-plan.updated', {
        practicePlanId: 'practice-plan-1',
        teamId: mockPracticePlan.teamId,
        coachId: mockPracticePlan.coachId,
        changes: Object.keys(updateDto)
      });
      expect(result).toEqual({ ...mockPracticePlan, ...updateDto });
    });

    it('should throw error when practice plan not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updatePracticePlan('invalid-id', updateDto))
        .rejects.toThrow('Practice plan not found');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should validate drill IDs when sections are updated', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockPracticePlan);
      const updateWithSections = {
        sections: [{ id: 'section-1', name: 'Test', duration: 10, drillIds: ['invalid-drill'] }]
      };
      mockDrillRepository.getMany.mockResolvedValue([]);

      // Act & Assert
      await expect(service.updatePracticePlan('practice-plan-1', updateWithSections))
        .rejects.toThrow('Drill IDs not found: invalid-drill');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle update errors and log them', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockPracticePlan);
      const error = new Error('Update failed');
      mockRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(service.updatePracticePlan('practice-plan-1', updateDto))
        .rejects.toThrow('Update failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error updating practice plan',
        { error: error.message, id: 'practice-plan-1', data: updateDto }
      );
    });
  });

  describe('deletePracticePlan', () => {
    it('should delete a practice plan successfully', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockPracticePlan);
      mockRepository.remove.mockResolvedValue(undefined);

      // Act
      await service.deletePracticePlan('practice-plan-1');

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'practice-plan-1' } });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockPracticePlan);
      expect(mockEventBus.publish).toHaveBeenCalledWith('practice-plan.deleted', {
        practicePlanId: 'practice-plan-1',
        teamId: mockPracticePlan.teamId,
        coachId: mockPracticePlan.coachId
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Practice plan deleted successfully',
        { id: 'practice-plan-1' }
      );
    });

    it('should throw error when practice plan not found for deletion', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deletePracticePlan('invalid-id'))
        .rejects.toThrow('Practice plan not found');
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });

    it('should prevent deletion of in-progress practices', async () => {
      // Arrange
      const inProgressPlan = {
        ...mockPracticePlan,
        status: PracticeStatus.IN_PROGRESS
      };
      mockRepository.findOne.mockResolvedValue(inProgressPlan);

      // Act & Assert
      await expect(service.deletePracticePlan('practice-plan-1'))
        .rejects.toThrow('Cannot delete practice that is in progress');
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });

    it('should handle deletion errors and log them', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockPracticePlan);
      const error = new Error('Delete failed');
      mockRepository.remove.mockRejectedValue(error);

      // Act & Assert
      await expect(service.deletePracticePlan('practice-plan-1'))
        .rejects.toThrow('Delete failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error deleting practice plan',
        { error: error.message, id: 'practice-plan-1' }
      );
    });
  });

  describe('duplicatePracticePlan', () => {
    it('should duplicate a practice plan successfully', async () => {
      // Arrange
      const newDate = new Date('2025-02-02');
      const getSpy = jest.spyOn(service, 'getPracticePlanById');
      const createSpy = jest.spyOn(service, 'createPracticePlan');
      const duplicatedPlan = { ...mockPracticePlan, id: 'new-plan-id' };
      
      getSpy.mockResolvedValue(mockPracticePlan as PracticePlan);
      createSpy.mockResolvedValue(duplicatedPlan as PracticePlan);

      // Act
      const result = await service.duplicatePracticePlan('practice-plan-1', newDate, 'New Practice');

      // Assert
      expect(getSpy).toHaveBeenCalledWith('practice-plan-1');
      expect(createSpy).toHaveBeenCalledWith({
        title: 'New Practice',
        description: mockPracticePlan.description,
        organizationId: mockPracticePlan.organizationId,
        teamId: mockPracticePlan.teamId,
        coachId: mockPracticePlan.coachId,
        trainingPlanId: undefined,
        date: newDate,
        duration: mockPracticePlan.duration,
        primaryFocus: mockPracticePlan.primaryFocus,
        secondaryFocus: undefined,
        location: undefined,
        rinkId: undefined,
        sections: [...mockPracticePlan.sections],
        objectives: [...mockPracticePlan.objectives!],
        equipment: [...mockPracticePlan.equipment!],
        lineups: undefined,
        notes: undefined
      });
      expect(result).toEqual(duplicatedPlan);

      getSpy.mockRestore();
      createSpy.mockRestore();
    });

    it('should throw error when original plan not found', async () => {
      // Arrange
      const getSpy = jest.spyOn(service, 'getPracticePlanById');
      getSpy.mockResolvedValue(null);

      // Act & Assert
      await expect(service.duplicatePracticePlan('invalid-id', new Date()))
        .rejects.toThrow('Practice plan not found');

      getSpy.mockRestore();
    });
  });

  describe('practice lifecycle methods', () => {
    describe('startPractice', () => {
      it('should start a practice successfully', async () => {
        // Arrange
        const getSpy = jest.spyOn(service, 'getPracticePlanById');
        const updateSpy = jest.spyOn(service, 'updatePracticePlan');
        const updatedPlan = { ...mockPracticePlan, status: PracticeStatus.IN_PROGRESS };
        
        getSpy.mockResolvedValue(mockPracticePlan as PracticePlan);
        updateSpy.mockResolvedValue(updatedPlan as PracticePlan);

        // Act
        const result = await service.startPractice('practice-plan-1');

        // Assert
        expect(getSpy).toHaveBeenCalledWith('practice-plan-1');
        expect(updateSpy).toHaveBeenCalledWith('practice-plan-1', { 
          status: PracticeStatus.IN_PROGRESS 
        });
        expect(mockEventBus.publish).toHaveBeenCalledWith('practice-plan.started', {
          practicePlanId: 'practice-plan-1',
          teamId: mockPracticePlan.teamId,
          coachId: mockPracticePlan.coachId,
          startTime: expect.any(Date)
        });
        expect(result).toEqual(updatedPlan);

        getSpy.mockRestore();
        updateSpy.mockRestore();
      });

      it('should throw error for invalid status transitions', async () => {
        // Arrange
        const getSpy = jest.spyOn(service, 'getPracticePlanById');
        const completedPlan = { ...mockPracticePlan, status: PracticeStatus.COMPLETED };
        getSpy.mockResolvedValue(completedPlan as PracticePlan);

        // Act & Assert
        await expect(service.startPractice('practice-plan-1'))
          .rejects.toThrow('Cannot start practice with status: COMPLETED');

        getSpy.mockRestore();
      });
    });

    describe('completePractice', () => {
      it('should complete a practice successfully', async () => {
        // Arrange
        const getSpy = jest.spyOn(service, 'getPracticePlanById');
        const updateSpy = jest.spyOn(service, 'updatePracticePlan');
        const inProgressPlan = { ...mockPracticePlan, status: PracticeStatus.IN_PROGRESS };
        const completedPlan = { ...mockPracticePlan, status: PracticeStatus.COMPLETED };
        
        getSpy.mockResolvedValue(inProgressPlan as PracticePlan);
        updateSpy.mockResolvedValue(completedPlan as PracticePlan);

        // Act
        const result = await service.completePractice('practice-plan-1', 'Good practice');

        // Assert
        expect(getSpy).toHaveBeenCalledWith('practice-plan-1');
        expect(updateSpy).toHaveBeenCalledWith('practice-plan-1', { 
          status: PracticeStatus.COMPLETED,
          coachFeedback: 'Good practice'
        });
        expect(mockEventBus.publish).toHaveBeenCalledWith('practice-plan.completed', {
          practicePlanId: 'practice-plan-1',
          teamId: mockPracticePlan.teamId,
          coachId: mockPracticePlan.coachId,
          completionTime: expect.any(Date),
          attendanceRate: 0.85
        });
        expect(result).toEqual(completedPlan);

        getSpy.mockRestore();
        updateSpy.mockRestore();
      });

      it('should throw error for invalid status transitions', async () => {
        // Arrange
        const getSpy = jest.spyOn(service, 'getPracticePlanById');
        getSpy.mockResolvedValue(mockPracticePlan as PracticePlan);

        // Act & Assert
        await expect(service.completePractice('practice-plan-1'))
          .rejects.toThrow('Cannot complete practice with status: PLANNED');

        getSpy.mockRestore();
      });
    });
  });

  describe('recordAttendance', () => {
    const attendance = [
      { playerId: 'player-1', present: true },
      { playerId: 'player-2', present: false, reason: 'Injury' }
    ];

    it('should record attendance successfully', async () => {
      // Arrange
      const getSpy = jest.spyOn(service, 'getPracticePlanById');
      const updateSpy = jest.spyOn(service, 'updatePracticePlan');
      const updatedPlan = { ...mockPracticePlan, attendance };
      
      getSpy.mockResolvedValue(mockPracticePlan as PracticePlan);
      updateSpy.mockResolvedValue(updatedPlan as PracticePlan);

      // Act
      const result = await service.recordAttendance('practice-plan-1', attendance);

      // Assert
      expect(getSpy).toHaveBeenCalledWith('practice-plan-1');
      expect(updateSpy).toHaveBeenCalledWith('practice-plan-1', { attendance });
      expect(mockEventBus.publish).toHaveBeenCalledWith('practice-plan.attendance-recorded', {
        practicePlanId: 'practice-plan-1',
        teamId: mockPracticePlan.teamId,
        attendanceRate: 0.85,
        totalPlayers: 2,
        presentPlayers: 1
      });
      expect(result).toEqual(updatedPlan);

      getSpy.mockRestore();
      updateSpy.mockRestore();
    });

    it('should throw error when practice plan not found', async () => {
      // Arrange
      const getSpy = jest.spyOn(service, 'getPracticePlanById');
      getSpy.mockResolvedValue(null);

      // Act & Assert
      await expect(service.recordAttendance('invalid-id', attendance))
        .rejects.toThrow('Practice plan not found');

      getSpy.mockRestore();
    });
  });

  describe('cache integration', () => {
    it('should use cached results for team queries', async () => {
      // Arrange
      const cachedPlans = [mockPracticePlan];
      mockRepository.findByTeamAndDateRange.mockResolvedValue(cachedPlans);

      // Act
      const result = await service.getPracticePlansByTeam('team-1');

      // Assert
      expect(mockRepository.findByTeamAndDateRange).toHaveBeenCalledWith(
        'team-1',
        expect.any(Date),
        expect.any(Date),
        undefined
      );
      expect(result).toEqual(cachedPlans);
    });

    it('should invalidate cache tags on updates', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockPracticePlan);
      mockRepository.save.mockResolvedValue(mockPracticePlan);

      // Act
      await service.updatePracticePlan('practice-plan-1', { title: 'Updated' });

      // Assert
      expect(mockRepository.invalidateByTags).toHaveBeenCalledWith([
        `team:${mockPracticePlan.teamId}`,
        `coach:${mockPracticePlan.coachId}`,
        `organization:${mockPracticePlan.organizationId}`
      ]);
    });
  });

  describe('analytics', () => {
    it('should retrieve practice analytics', async () => {
      // Arrange
      const analytics = {
        totalPractices: 10,
        statusDistribution: { [PracticeStatus.PLANNED]: 5, [PracticeStatus.COMPLETED]: 5 },
        focusDistribution: { [PracticeFocus.SKILL_DEVELOPMENT]: 7 },
        averageDuration: 75,
        averageAttendanceRate: 0.85,
        lastUpdated: new Date()
      };
      mockRepository.getPracticeAnalytics.mockResolvedValue(analytics);

      // Act
      const result = await service.getPracticeAnalytics('org-1', 'team-1');

      // Assert
      expect(mockRepository.getPracticeAnalytics).toHaveBeenCalledWith('org-1', 'team-1', undefined, undefined);
      expect(result).toEqual(analytics);
    });
  });

  describe('drill validation', () => {
    it('should validate empty drill sections', async () => {
      // Arrange
      const createDto = {
        title: 'Test Practice',
        organizationId: 'org-1',
        teamId: 'team-1',
        coachId: 'coach-1',
        date: new Date(),
        duration: 60,
        primaryFocus: PracticeFocus.SKILL_DEVELOPMENT,
        sections: [] // Empty sections
      } as CreatePracticePlanDto;

      mockRepository.save.mockResolvedValue(mockPracticePlan);

      // Act
      const result = await service.createPracticePlan(createDto);

      // Assert - Should not call drill validation for empty sections
      expect(mockDrillRepository.createQueryBuilder).not.toHaveBeenCalled();
      expect(result).toEqual(mockPracticePlan);
    });
  });
});