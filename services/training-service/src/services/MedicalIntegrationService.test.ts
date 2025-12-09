import { DataSource, Repository } from 'typeorm';
import { MedicalIntegrationService } from './MedicalIntegrationService';
import { WorkoutPlayerOverride, OverrideType, OverrideStatus } from '../entities/WorkoutPlayerOverride';
import { WorkoutAssignment } from '../entities/WorkoutAssignment';
import { ExerciseTemplate } from '../entities/ExerciseTemplate';
import {
  RestrictionSeverity,
  RestrictionStatus,
  ComplianceStatus,
  SyncMedicalRestrictionsDTO,
  ComplianceCheckDTO,
  ReportMedicalConcernDTO,
  GetAlternativesDTO
} from '../dto/medical-integration.dto';

// Mock dependencies
jest.mock('@hockey-hub/shared-lib', () => ({
  ServiceClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
    setUserContext: jest.fn(),
    setCorrelationId: jest.fn()
  })),
  getGlobalEventBus: jest.fn(() => ({
    subscribe: jest.fn(),
    emit: jest.fn()
  })),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  },
  getCacheService: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    deletePattern: jest.fn()
  }))
}));

describe('MedicalIntegrationService', () => {
  let service: MedicalIntegrationService;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockOverrideRepository: jest.Mocked<Repository<WorkoutPlayerOverride>>;
  let mockAssignmentRepository: jest.Mocked<Repository<WorkoutAssignment>>;
  let mockExerciseRepository: jest.Mocked<Repository<ExerciseTemplate>>;

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockOrganizationId = '123e4567-e89b-12d3-a456-426614174001';
  const mockSessionId = '123e4567-e89b-12d3-a456-426614174002';
  const mockPlayerId = '123e4567-e89b-12d3-a456-426614174003';
  const mockExerciseId = '123e4567-e89b-12d3-a456-426614174004';

  beforeEach(() => {
    // Mock repositories
    mockOverrideRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;

    mockAssignmentRepository = {
      find: jest.fn(),
      findOne: jest.fn()
    } as any;

    mockExerciseRepository = {
      find: jest.fn(),
      findBy: jest.fn(),
      findOne: jest.fn()
    } as any;

    // Mock DataSource
    mockDataSource = {
      getRepository: jest.fn((entity) => {
        if (entity === WorkoutPlayerOverride) return mockOverrideRepository;
        if (entity === WorkoutAssignment) return mockAssignmentRepository;
        if (entity === ExerciseTemplate) return mockExerciseRepository;
        return {} as any;
      })
    } as any;

    service = new MedicalIntegrationService(mockDataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('syncMedicalRestrictions', () => {
    it('should sync medical restrictions successfully', async () => {
      const dto: SyncMedicalRestrictionsDTO = {
        organizationId: mockOrganizationId,
        playerIds: [mockPlayerId],
        includeExpired: false
      };

      const mockRestrictions = [{
        id: 'restriction-1',
        playerId: mockPlayerId,
        severity: RestrictionSeverity.MODERATE,
        status: RestrictionStatus.ACTIVE,
        affectedBodyParts: ['knee'],
        restrictedMovements: ['jumping'],
        restrictedExerciseTypes: ['plyometric'],
        maxExertionLevel: 70,
        requiresSupervision: true,
        clearanceRequired: false,
        effectiveDate: new Date(),
        prescribedBy: mockUserId,
        prescribedAt: new Date()
      }];

      const mockAssignments = [{
        id: 'assignment-1',
        assignedPlayers: [{ playerId: mockPlayerId }],
        isActive: true,
        startDate: new Date(Date.now() - 86400000), // Yesterday
        endDate: new Date(Date.now() + 86400000) // Tomorrow
      }];

      // Mock service client response
      const mockServiceClient = service['medicalServiceClient'] as any;
      mockServiceClient.get.mockResolvedValue(mockRestrictions);

      mockAssignmentRepository.find.mockResolvedValue(mockAssignments as any);
      mockOverrideRepository.findOne.mockResolvedValue(null);
      mockOverrideRepository.create.mockReturnValue({} as any);
      mockOverrideRepository.save.mockResolvedValue({} as any);

      const result = await service.syncMedicalRestrictions(dto);

      expect(result.synced).toBe(1);
      expect(result.created).toBe(1);
      expect(result.updated).toBe(0);
      expect(mockOverrideRepository.save).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const dto: SyncMedicalRestrictionsDTO = {
        organizationId: mockOrganizationId,
        playerIds: [mockPlayerId]
      };

      const mockServiceClient = service['medicalServiceClient'] as any;
      mockServiceClient.get.mockRejectedValue(new Error('Service unavailable'));

      await expect(service.syncMedicalRestrictions(dto)).rejects.toThrow('Service unavailable');
    });
  });

  describe('checkSessionCompliance', () => {
    it('should check compliance and return compliant status', async () => {
      const dto: ComplianceCheckDTO = {
        sessionId: mockSessionId,
        detailed: false
      };

      const mockAssignments = [{
        id: 'assignment-1',
        sessionIds: [mockSessionId],
        assignedPlayers: [{ playerId: mockPlayerId }],
        workoutTemplate: {
          exercises: [
            {
              id: mockExerciseId,
              exerciseTemplateId: 'template-1'
            }
          ]
        }
      }];

      mockAssignmentRepository.find.mockResolvedValue(mockAssignments as any);
      mockOverrideRepository.find.mockResolvedValue([]);

      const result = await service.checkSessionCompliance(dto);

      expect(result.sessionId).toBe(mockSessionId);
      expect(result.overallStatus).toBe(ComplianceStatus.NOT_APPLICABLE);
      expect(result.requiresApproval).toBe(false);
    });

    it('should detect compliance violations', async () => {
      const dto: ComplianceCheckDTO = {
        sessionId: mockSessionId,
        playerId: mockPlayerId,
        detailed: true
      };

      const mockAssignments = [{
        id: 'assignment-1',
        sessionIds: [mockSessionId],
        assignedPlayers: [{ playerId: mockPlayerId }],
        workoutTemplate: {
          exercises: [
            {
              id: mockExerciseId,
              exerciseTemplateId: 'template-1'
            }
          ]
        }
      }];

      const mockOverrides = [{
        id: 'override-1',
        playerId: mockPlayerId,
        overrideType: OverrideType.MEDICAL,
        status: OverrideStatus.APPROVED,
        effectiveDate: new Date(Date.now() - 86400000),
        expiryDate: new Date(Date.now() + 86400000),
        medicalRecordId: 'restriction-1',
        medicalRestrictions: {
          restrictionType: 'injury',
          affectedBodyParts: ['knee'],
          restrictedMovements: ['jumping'],
          maxExertionLevel: 70,
          requiresSupervision: true,
          clearanceRequired: false
        },
        modifications: {
          excludeExercises: [mockExerciseId]
        },
        requestedBy: mockUserId,
        requestedAt: new Date(),
        metadata: { priority: 'medium' }
      }];

      const mockExercise = {
        id: 'template-1',
        name: 'Jump Squats',
        category: 'plyometric',
        movementPatterns: ['jumping'],
        defaultIntensity: 85
      };

      mockAssignmentRepository.find.mockResolvedValue(mockAssignments as any);
      mockOverrideRepository.find.mockResolvedValue(mockOverrides as any);
      mockExerciseRepository.findOne.mockResolvedValue(mockExercise as any);

      const result = await service.checkSessionCompliance(dto);

      expect(result.overallStatus).toBe(ComplianceStatus.NON_COMPLIANT);
      expect(result.requiresApproval).toBe(true);
      expect(result.playerCompliance[0].violations.length).toBeGreaterThan(0);
    });
  });

  describe('reportMedicalConcern', () => {
    it('should report medical concern successfully', async () => {
      const dto: ReportMedicalConcernDTO = {
        playerId: mockPlayerId,
        sessionId: mockSessionId,
        concernType: 'injury',
        severity: 'high',
        description: 'Player reported knee pain during squats',
        affectedBodyParts: ['knee'],
        reportedBy: mockUserId,
        occurredAt: new Date()
      };

      const mockResponse = {
        id: 'concern-1',
        status: 'reported'
      };

      const mockAssignments = [{
        id: 'assignment-1',
        sessionIds: [mockSessionId]
      }];

      const mockServiceClient = service['medicalServiceClient'] as any;
      mockServiceClient.post.mockResolvedValue(mockResponse);

      mockAssignmentRepository.find.mockResolvedValue(mockAssignments as any);
      mockOverrideRepository.create.mockReturnValue({} as any);
      mockOverrideRepository.save.mockResolvedValue({} as any);

      const result = await service.reportMedicalConcern(dto);

      expect(result.concernId).toBe('concern-1');
      expect(result.status).toBe('reported');
      expect(mockOverrideRepository.save).toHaveBeenCalled();
    });

    it('should handle low severity concerns without creating overrides', async () => {
      const dto: ReportMedicalConcernDTO = {
        playerId: mockPlayerId,
        concernType: 'discomfort',
        severity: 'low',
        description: 'Minor discomfort',
        reportedBy: mockUserId,
        occurredAt: new Date()
      };

      const mockResponse = {
        id: 'concern-1',
        status: 'reported'
      };

      const mockServiceClient = service['medicalServiceClient'] as any;
      mockServiceClient.post.mockResolvedValue(mockResponse);

      const result = await service.reportMedicalConcern(dto);

      expect(result.concernId).toBe('concern-1');
      expect(mockOverrideRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getExerciseAlternatives', () => {
    it('should return alternatives for restricted exercises', async () => {
      const dto: GetAlternativesDTO = {
        playerId: mockPlayerId,
        exerciseIds: [mockExerciseId],
        includeRationale: true
      };

      const mockRestrictions = [{
        id: 'restriction-1',
        playerId: mockPlayerId,
        severity: RestrictionSeverity.MODERATE,
        status: RestrictionStatus.ACTIVE,
        affectedBodyParts: ['knee'],
        restrictedMovements: ['jumping'],
        restrictedExerciseTypes: ['plyometric'],
        maxExertionLevel: 70,
        requiresSupervision: true,
        clearanceRequired: false,
        effectiveDate: new Date(),
        prescribedBy: mockUserId,
        prescribedAt: new Date()
      }];

      const mockExercises = [{
        id: mockExerciseId,
        name: 'Jump Squats',
        category: 'strength',
        primaryMuscles: ['quadriceps'],
        movementPatterns: ['jumping'],
        defaultIntensity: 85,
        organizationId: mockOrganizationId
      }];

      const mockAlternatives = [{
        id: 'alt-exercise-1',
        name: 'Wall Sits',
        category: 'strength',
        primaryMuscles: ['quadriceps'],
        movementPatterns: ['static'],
        defaultIntensity: 60,
        organizationId: mockOrganizationId
      }];

      // Mock service client to return restrictions
      const mockServiceClient = service['medicalServiceClient'] as any;
      mockServiceClient.get.mockResolvedValue(mockRestrictions);

      mockExerciseRepository.findBy
        .mockResolvedValueOnce(mockExercises as any) // For exercises to evaluate
        .mockResolvedValueOnce(mockAlternatives as any); // For candidate alternatives

      const result = await service.getExerciseAlternatives(dto);

      expect(result.playerId).toBe(mockPlayerId);
      expect(result.restrictions).toHaveLength(1);
      expect(result.alternatives).toHaveLength(1);
      expect(result.loadAdjustment).toBe(0.6); // Moderate severity
      expect(result.restAdjustment).toBe(1.5);
    });

    it('should return no restrictions message for healthy players', async () => {
      const dto: GetAlternativesDTO = {
        playerId: mockPlayerId,
        exerciseIds: [mockExerciseId]
      };

      // Mock service client to return empty restrictions
      const mockServiceClient = service['medicalServiceClient'] as any;
      mockServiceClient.get.mockResolvedValue([]);

      const result = await service.getExerciseAlternatives(dto);

      expect(result.playerId).toBe(mockPlayerId);
      expect(result.restrictions).toHaveLength(0);
      expect(result.alternatives).toHaveLength(0);
      expect(result.generalRecommendations[0]).toBe('No active medical restrictions found');
      expect(result.loadAdjustment).toBe(1.0);
      expect(result.restAdjustment).toBe(1.0);
    });
  });

  describe('createMedicalOverride', () => {
    it('should create medical override successfully', async () => {
      const restriction = {
        id: 'restriction-1',
        playerId: mockPlayerId,
        severity: RestrictionSeverity.MODERATE,
        status: RestrictionStatus.ACTIVE,
        affectedBodyParts: ['knee'],
        restrictedMovements: ['jumping'],
        restrictedExerciseTypes: ['plyometric'],
        maxExertionLevel: 70,
        requiresSupervision: true,
        clearanceRequired: false,
        effectiveDate: new Date(),
        prescribedBy: mockUserId,
        prescribedAt: new Date()
      };

      const alternatives = [{
        originalExerciseId: mockExerciseId,
        alternativeExerciseId: 'alt-exercise-1',
        reason: 'Lower impact alternative',
        loadMultiplier: 0.8,
        restMultiplier: 1.2,
        modifications: ['Use lighter weight'],
        requiresSupervision: false,
        suitabilityScore: 85
      }];

      const dto = {
        workoutAssignmentId: 'assignment-1',
        playerId: mockPlayerId,
        medicalRecordId: 'restriction-1',
        restriction,
        alternatives,
        autoApprove: true,
        notes: 'Medical override for knee injury'
      };

      const mockOverride = {
        id: 'override-1',
        ...dto,
        status: OverrideStatus.APPROVED
      };

      mockOverrideRepository.create.mockReturnValue(mockOverride as any);
      mockOverrideRepository.save.mockResolvedValue(mockOverride as any);

      const result = await service.createMedicalOverride(dto);

      expect(result.id).toBe('override-1');
      expect(result.status).toBe(OverrideStatus.APPROVED);
      expect(mockOverrideRepository.save).toHaveBeenCalled();
    });
  });

  describe('private helper methods', () => {
    it('should map severity to priority correctly', () => {
      const mapSeverityToPriority = service['mapSeverityToPriority'].bind(service);

      expect(mapSeverityToPriority(RestrictionSeverity.MILD)).toBe('low');
      expect(mapSeverityToPriority(RestrictionSeverity.MODERATE)).toBe('medium');
      expect(mapSeverityToPriority(RestrictionSeverity.SEVERE)).toBe('high');
      expect(mapSeverityToPriority(RestrictionSeverity.COMPLETE)).toBe('critical');
    });

    it('should calculate load adjustments correctly', () => {
      const calculateLoadAdjustment = service['calculateLoadAdjustment'].bind(service);

      expect(calculateLoadAdjustment([RestrictionSeverity.COMPLETE])).toBe(0);
      expect(calculateLoadAdjustment([RestrictionSeverity.SEVERE])).toBe(0.3);
      expect(calculateLoadAdjustment([RestrictionSeverity.MODERATE])).toBe(0.6);
      expect(calculateLoadAdjustment([RestrictionSeverity.MILD])).toBe(0.8);
      expect(calculateLoadAdjustment([])).toBe(1.0);
    });

    it('should calculate rest adjustments correctly', () => {
      const calculateRestAdjustment = service['calculateRestAdjustment'].bind(service);

      expect(calculateRestAdjustment([RestrictionSeverity.SEVERE])).toBe(2.0);
      expect(calculateRestAdjustment([RestrictionSeverity.MODERATE])).toBe(1.5);
      expect(calculateRestAdjustment([RestrictionSeverity.MILD])).toBe(1.2);
      expect(calculateRestAdjustment([])).toBe(1.0);
    });

    it('should check if exercise is prohibited correctly', () => {
      const checkIfExerciseProhibited = service['checkIfExerciseProhibited'].bind(service);

      const exercise = {
        id: mockExerciseId,
        category: 'plyometric',
        movementPatterns: ['jumping'],
        primaryMuscles: ['quadriceps'],
        defaultIntensity: 85
      } as ExerciseTemplate;

      const restrictions = [{
        restrictedExerciseTypes: ['plyometric'],
        restrictedMovements: [],
        affectedBodyParts: [],
        maxExertionLevel: 100
      }];

      expect(checkIfExerciseProhibited(exercise, restrictions as any)).toBe(true);

      const safeRestrictions = [{
        restrictedExerciseTypes: ['cardio'],
        restrictedMovements: [],
        affectedBodyParts: [],
        maxExertionLevel: 100
      }];

      expect(checkIfExerciseProhibited(exercise, safeRestrictions as any)).toBe(false);
    });

    it('should generate general recommendations', () => {
      const generateGeneralRecommendations = service['generateGeneralRecommendations'].bind(service);

      const restrictions = [{
        severity: RestrictionSeverity.SEVERE,
        requiresSupervision: true,
        maxExertionLevel: 60,
        affectedBodyParts: ['back'],
        clearanceRequired: true
      }];

      const recommendations = generateGeneralRecommendations(restrictions as any);

      expect(recommendations).toContain('Consider postponing high-intensity training until medical clearance');
      expect(recommendations).toContain('Ensure qualified supervision is present during all training sessions');
      expect(recommendations).toContain('Focus on technique and mobility work rather than strength/power');
      expect(recommendations).toContain('Prioritize core stability and avoid axial loading');
      expect(recommendations).toContain('Obtain medical clearance before returning to full training');
    });
  });

  describe('event handlers', () => {
    it('should handle medical restriction events', async () => {
      const event = {
        eventType: 'restriction_added' as const,
        playerId: mockPlayerId,
        restrictionId: 'restriction-1',
        timestamp: new Date(),
        details: {
          organizationId: mockOrganizationId
        }
      };

      // Mock the sync method
      const syncSpy = jest.spyOn(service, 'syncMedicalRestrictions').mockResolvedValue({
        synced: 1,
        created: 1,
        updated: 0
      });

      await service['handleMedicalRestrictionEvent'](event);

      expect(syncSpy).toHaveBeenCalledWith({
        organizationId: mockOrganizationId,
        playerIds: [mockPlayerId],
        includeExpired: false
      });
    });

    it('should handle restriction cleared events', async () => {
      const event = {
        eventType: 'restriction_cleared' as const,
        playerId: mockPlayerId,
        restrictionId: 'restriction-1',
        timestamp: new Date(),
        details: {}
      };

      const mockOverrides = [{
        id: 'override-1',
        status: OverrideStatus.APPROVED
      }];

      mockOverrideRepository.find.mockResolvedValue(mockOverrides as any);
      mockOverrideRepository.save.mockResolvedValue({} as any);

      await service['handleMedicalRestrictionCleared'](event);

      expect(mockOverrideRepository.find).toHaveBeenCalledWith({
        where: {
          playerId: mockPlayerId,
          medicalRecordId: 'restriction-1',
          status: expect.any(Object)
        }
      });
    });
  });

  describe('caching', () => {
    it('should use cache for compliance checks', async () => {
      const dto: ComplianceCheckDTO = {
        sessionId: mockSessionId,
        detailed: false
      };

      const cachedResult = {
        sessionId: mockSessionId,
        overallStatus: ComplianceStatus.COMPLIANT,
        checkedAt: new Date(),
        playerCompliance: [],
        requiresApproval: false
      };

      const mockCacheService = service['cacheService'] as any;
      mockCacheService.get.mockResolvedValue(cachedResult);

      const result = await service.checkSessionCompliance(dto);

      expect(result).toEqual(cachedResult);
      expect(mockAssignmentRepository.find).not.toHaveBeenCalled();
    });

    it('should clear player cache when needed', async () => {
      const mockCacheService = service['cacheService'] as any;
      mockCacheService.deletePattern.mockResolvedValue(true);

      await service['clearPlayerCache'](mockPlayerId);

      expect(mockCacheService.deletePattern).toHaveBeenCalledWith(
        expect.stringContaining(mockPlayerId)
      );
    });
  });
});