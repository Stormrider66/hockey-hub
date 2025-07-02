import { CachedMedicalService } from './CachedMedicalService';
import { CachedInjuryRepository, CachedWellnessRepository, CachedPlayerAvailabilityRepository } from '../repositories';
import { Injury, WellnessEntry, PlayerAvailability } from '../entities';

// Mock repositories
jest.mock('../repositories');

describe('CachedMedicalService', () => {
  let service: CachedMedicalService;
  let mockInjuryRepository: jest.Mocked<CachedInjuryRepository>;
  let mockWellnessRepository: jest.Mocked<CachedWellnessRepository>;
  let mockAvailabilityRepository: jest.Mocked<CachedPlayerAvailabilityRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create service instance
    service = new CachedMedicalService();
    
    // Get mocked instances
    mockInjuryRepository = (service as any).injuryRepository;
    mockWellnessRepository = (service as any).wellnessRepository;
    mockAvailabilityRepository = (service as any).availabilityRepository;
  });

  describe('getPlayerMedicalOverview', () => {
    it('should return comprehensive medical overview for a player', async () => {
      // Arrange
      const playerId = 101;
      const mockInjuries = [
        createMockInjury({ id: 1, playerId, recoveryStatus: 'active' }),
        createMockInjury({ id: 2, playerId, recoveryStatus: 'recovered' }),
      ];
      const mockAvailability = createMockAvailability({ playerId, availabilityStatus: 'available' });
      const mockWellness = createMockWellnessEntry({ playerId, sleepHours: 8, stressLevel: 3 });

      mockInjuryRepository.findByPlayerId.mockResolvedValue(mockInjuries);
      mockAvailabilityRepository.findCurrentByPlayerId.mockResolvedValue(mockAvailability);
      mockWellnessRepository.findLatestByPlayerId.mockResolvedValue(mockWellness);

      // Act
      const result = await service.getPlayerMedicalOverview(playerId);

      // Assert
      expect(result).toEqual({
        playerId,
        currentInjuries: [mockInjuries[0]],
        injuryHistory: [mockInjuries[1]],
        currentAvailability: mockAvailability,
        latestWellness: mockWellness,
        medicalClearance: true,
        lastAssessmentDate: mockWellness.entryDate,
        riskFactors: [],
        recommendations: [],
      });
      
      expect(mockInjuryRepository.findByPlayerId).toHaveBeenCalledWith(playerId);
      expect(mockAvailabilityRepository.findCurrentByPlayerId).toHaveBeenCalledWith(playerId);
      expect(mockWellnessRepository.findLatestByPlayerId).toHaveBeenCalledWith(playerId);
    });

    it('should identify risk factors based on wellness data', async () => {
      // Arrange
      const playerId = 101;
      const mockWellness = createMockWellnessEntry({
        playerId,
        sleepHours: 5,
        stressLevel: 8,
        sorenessLevel: 8,
        energyLevel: 3,
      });

      mockInjuryRepository.findByPlayerId.mockResolvedValue([]);
      mockAvailabilityRepository.findCurrentByPlayerId.mockResolvedValue(null);
      mockWellnessRepository.findLatestByPlayerId.mockResolvedValue(mockWellness);

      // Act
      const result = await service.getPlayerMedicalOverview(playerId);

      // Assert
      expect(result.riskFactors).toContain('Insufficient sleep');
      expect(result.riskFactors).toContain('High stress levels');
      expect(result.riskFactors).toContain('High muscle soreness');
      expect(result.riskFactors).toContain('Low energy levels');
    });

    it('should generate recommendations based on conditions', async () => {
      // Arrange
      const playerId = 101;
      const mockWellness = createMockWellnessEntry({
        playerId,
        sleepHours: 5,
        stressLevel: 8,
        hydrationLevel: 4,
      });

      mockInjuryRepository.findByPlayerId.mockResolvedValue([]);
      mockAvailabilityRepository.findCurrentByPlayerId.mockResolvedValue(null);
      mockWellnessRepository.findLatestByPlayerId.mockResolvedValue(mockWellness);

      // Act
      const result = await service.getPlayerMedicalOverview(playerId);

      // Assert
      expect(result.recommendations).toContain('Increase sleep duration to 7-9 hours');
      expect(result.recommendations).toContain('Consider stress management techniques');
      expect(result.recommendations).toContain('Increase daily water intake');
    });
  });

  describe('getTeamMedicalStats', () => {
    it('should return comprehensive team medical statistics', async () => {
      // Arrange
      const mockActiveInjuries = [
        createMockInjury({ id: 1, recoveryStatus: 'active' }),
        createMockInjury({ id: 2, recoveryStatus: 'active' }),
      ];
      const mockAvailabilitySummary = {
        injuredPlayers: 2,
        availabilityByStatus: {
          available: 15,
          injured: 2,
          load_management: 1,
        },
      };
      const mockWellnessSummary = {
        averageSleepHours: 7.5,
        averageStressLevel: 4.2,
        playersReporting: 18,
      };
      const mockBodyPartStats = [
        { bodyPart: 'knee', count: 3 },
        { bodyPart: 'ankle', count: 2 },
      ];

      mockInjuryRepository.findActiveInjuries.mockResolvedValue(mockActiveInjuries);
      mockAvailabilityRepository.getTeamAvailabilitySummary.mockResolvedValue(mockAvailabilitySummary);
      mockWellnessRepository.getTeamWellnessSummary.mockResolvedValue(mockWellnessSummary);
      mockInjuryRepository.countActiveByBodyPart.mockResolvedValue(mockBodyPartStats);
      jest.spyOn(service as any, 'identifyHighRiskPlayers').mockResolvedValue([101, 102]);

      // Act
      const result = await service.getTeamMedicalStats();

      // Assert
      expect(result).toMatchObject({
        totalActiveInjuries: 2,
        playersOnInjuryList: 2,
        availabilityBreakdown: mockAvailabilitySummary.availabilityByStatus,
        injuryTypesByBodyPart: mockBodyPartStats,
        teamWellnessMetrics: mockWellnessSummary,
        averageRecoveryTime: 0, // No recovered injuries in mock
        highRiskPlayers: [101, 102],
      });
    });

    it('should calculate average recovery time correctly', async () => {
      // Arrange
      const baseDate = new Date('2025-01-01');
      const mockInjuries = [
        createMockInjury({
          id: 1,
          recoveryStatus: 'recovered',
          injuryDate: baseDate,
          expectedReturnDate: new Date('2025-01-15'), // 14 days
        }),
        createMockInjury({
          id: 2,
          recoveryStatus: 'recovered',
          injuryDate: baseDate,
          expectedReturnDate: new Date('2025-01-22'), // 21 days
        }),
      ];

      mockInjuryRepository.findActiveInjuries.mockResolvedValue(mockInjuries);
      mockAvailabilityRepository.getTeamAvailabilitySummary.mockResolvedValue({ injuredPlayers: 0, availabilityByStatus: {} });
      mockWellnessRepository.getTeamWellnessSummary.mockResolvedValue({});
      mockInjuryRepository.countActiveByBodyPart.mockResolvedValue([]);

      // Act
      const result = await service.getTeamMedicalStats();

      // Assert
      expect(result.averageRecoveryTime).toBe(18); // (14 + 21) / 2 = 17.5, rounded to 18
    });
  });

  describe('submitWellnessEntry', () => {
    it('should save wellness entry with current date if not provided', async () => {
      // Arrange
      const wellnessData = {
        playerId: 101,
        sleepHours: 8,
        sleepQuality: 8,
        energyLevel: 7,
        stressLevel: 3,
        sorenessLevel: 2,
        hydrationLevel: 8,
      };
      const savedEntry = { ...wellnessData, id: 1, entryDate: new Date() };
      
      mockWellnessRepository.save.mockResolvedValue(savedEntry);
      mockAvailabilityRepository.save.mockResolvedValue({} as any);

      // Act
      const result = await service.submitWellnessEntry(wellnessData);

      // Assert
      expect(result).toEqual(savedEntry);
      expect(mockWellnessRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...wellnessData,
          entryDate: expect.any(Date),
        })
      );
    });

    it('should validate wellness entry data', async () => {
      // Arrange
      const invalidData = {
        playerId: 101,
        sleepQuality: 11, // Invalid: should be 1-10
      };

      // Act & Assert
      await expect(service.submitWellnessEntry(invalidData)).rejects.toThrow('Sleep quality must be between 1 and 10');
      expect(mockWellnessRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error if playerId is missing', async () => {
      // Arrange
      const invalidData = {
        sleepHours: 8,
      };

      // Act & Assert
      await expect(service.submitWellnessEntry(invalidData as any)).rejects.toThrow('Player ID is required');
    });

    it('should create load management entry for concerning wellness metrics', async () => {
      // Arrange
      const concerningData = {
        playerId: 101,
        sleepHours: 4, // Severe sleep deprivation
        stressLevel: 9, // Extreme stress
        sorenessLevel: 9, // Severe soreness
        entryDate: new Date(),
      };
      const savedEntry = { ...concerningData, id: 1 };
      
      mockWellnessRepository.save.mockResolvedValue(savedEntry);
      mockAvailabilityRepository.save.mockResolvedValue({} as any);

      // Act
      await service.submitWellnessEntry(concerningData);

      // Assert
      expect(mockAvailabilityRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          playerId: 101,
          availabilityStatus: 'load_management',
          reason: expect.stringContaining('severe sleep deprivation'),
          isCurrent: true,
        })
      );
    });
  });

  describe('createInjury', () => {
    it('should create injury and update player availability', async () => {
      // Arrange
      const injuryData = {
        playerId: 101,
        injuryType: 'muscle_strain',
        bodyPart: 'hamstring',
        severityLevel: 2,
        injuryDate: new Date(),
        expectedReturnDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        recoveryStatus: 'active' as const,
      };
      const savedInjury = { ...injuryData, id: 1 };
      
      mockInjuryRepository.save.mockResolvedValue(savedInjury);
      mockAvailabilityRepository.save.mockResolvedValue({} as any);

      // Act
      const result = await service.createInjury(injuryData);

      // Assert
      expect(result).toEqual(savedInjury);
      expect(mockAvailabilityRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          playerId: 101,
          availabilityStatus: 'injured',
          injuryId: 1,
          medicalClearanceRequired: true,
          isCurrent: true,
        })
      );
    });

    it('should not update availability for non-active injuries', async () => {
      // Arrange
      const injuryData = {
        playerId: 101,
        recoveryStatus: 'recovered' as const,
      };
      const savedInjury = { ...injuryData, id: 1 };
      
      mockInjuryRepository.save.mockResolvedValue(savedInjury);

      // Act
      await service.createInjury(injuryData);

      // Assert
      expect(mockAvailabilityRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateInjury', () => {
    it('should update injury and change availability when recovery status changes', async () => {
      // Arrange
      const existingInjury = createMockInjury({
        id: 1,
        playerId: 101,
        recoveryStatus: 'active',
      });
      const updates = { recoveryStatus: 'recovered' as const };
      const updatedInjury = { ...existingInjury, ...updates };
      
      mockInjuryRepository.findById.mockResolvedValue(existingInjury);
      mockInjuryRepository.save.mockResolvedValue(updatedInjury);
      mockAvailabilityRepository.save.mockResolvedValue({} as any);

      // Act
      const result = await service.updateInjury(1, updates);

      // Assert
      expect(result).toEqual(updatedInjury);
      expect(mockAvailabilityRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          playerId: 101,
          availabilityStatus: 'available',
          isCurrent: true,
        })
      );
    });

    it('should throw error if injury not found', async () => {
      // Arrange
      mockInjuryRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateInjury(999, {})).rejects.toThrow('Injury not found');
    });

    it('should not update availability if recovery status unchanged', async () => {
      // Arrange
      const existingInjury = createMockInjury({
        id: 1,
        recoveryStatus: 'active',
      });
      const updates = { severityLevel: 3 };
      
      mockInjuryRepository.findById.mockResolvedValue(existingInjury);
      mockInjuryRepository.save.mockResolvedValue({ ...existingInjury, ...updates });

      // Act
      await service.updateInjury(1, updates);

      // Assert
      expect(mockAvailabilityRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('Private Methods (via public interface)', () => {
    describe('Risk Factor Calculation', () => {
      it('should identify all risk factors correctly', async () => {
        // Arrange
        const playerId = 101;
        const activeInjury = createMockInjury({ recoveryStatus: 'active' });
        const riskyWellness = createMockWellnessEntry({
          sleepHours: 5,
          stressLevel: 8,
          sorenessLevel: 8,
          energyLevel: 3,
        });

        mockInjuryRepository.findByPlayerId.mockResolvedValue([activeInjury]);
        mockAvailabilityRepository.findCurrentByPlayerId.mockResolvedValue(null);
        mockWellnessRepository.findLatestByPlayerId.mockResolvedValue(riskyWellness);

        // Act
        const result = await service.getPlayerMedicalOverview(playerId);

        // Assert
        expect(result.riskFactors).toHaveLength(5);
        expect(result.riskFactors).toContain('Active injury');
        expect(result.riskFactors).toContain('Insufficient sleep');
        expect(result.riskFactors).toContain('High stress levels');
        expect(result.riskFactors).toContain('High muscle soreness');
        expect(result.riskFactors).toContain('Low energy levels');
      });
    });

    describe('High Risk Player Identification', () => {
      it('should identify players with severe injuries as high risk', async () => {
        // Arrange
        const severeInjuries = [
          createMockInjury({ playerId: 101, severityLevel: 4, recoveryStatus: 'active' }),
          createMockInjury({ playerId: 102, severityLevel: 3, recoveryStatus: 'active' }),
          createMockInjury({ playerId: 103, severityLevel: 2, recoveryStatus: 'active' }), // Not high risk
        ];

        mockInjuryRepository.findActiveInjuries.mockResolvedValue(severeInjuries);
        mockAvailabilityRepository.getTeamAvailabilitySummary.mockResolvedValue({ injuredPlayers: 3, availabilityByStatus: {} });
        mockWellnessRepository.getTeamWellnessSummary.mockResolvedValue({});
        mockInjuryRepository.countActiveByBodyPart.mockResolvedValue([]);

        // Act
        const result = await service.getTeamMedicalStats();

        // Assert
        expect(result.highRiskPlayers).toEqual([101, 102]);
        expect(result.highRiskPlayers).not.toContain(103);
      });
    });
  });
});

// Helper functions for creating mock data
function createMockInjury(overrides?: Partial<Injury>): Injury {
  return {
    id: 1,
    playerId: 101,
    injuryType: 'muscle_strain',
    bodyPart: 'hamstring',
    severityLevel: 2,
    injuryDate: new Date(),
    expectedReturnDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    recoveryStatus: 'active',
    description: 'Test injury',
    diagnosis: 'Grade 2 strain',
    isActive: true,
    organizationId: 'org-1',
    teamId: 'team-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'medical-1',
    updatedBy: 'medical-1',
    deletedAt: null,
    deletedBy: null,
    lastRequestId: null,
    lastIpAddress: null,
    treatments: [],
    medicalReports: [],
    playerAvailabilities: [],
    ...overrides,
  } as Injury;
}

function createMockWellnessEntry(overrides?: Partial<WellnessEntry>): WellnessEntry {
  return {
    id: 1,
    playerId: 101,
    entryDate: new Date(),
    sleepHours: 8,
    sleepQuality: 8,
    energyLevel: 7,
    stressLevel: 3,
    sorenessLevel: 2,
    hydrationLevel: 8,
    appetite: 8,
    mood: 7,
    heartRateVariability: 65,
    restingHeartRate: 60,
    notes: 'Feeling good',
    isActive: true,
    organizationId: 'org-1',
    teamId: 'team-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'player-1',
    updatedBy: 'player-1',
    deletedAt: null,
    deletedBy: null,
    lastRequestId: null,
    lastIpAddress: null,
    ...overrides,
  } as WellnessEntry;
}

function createMockAvailability(overrides?: Partial<PlayerAvailability>): PlayerAvailability {
  return {
    id: 1,
    playerId: 101,
    availabilityStatus: 'available',
    effectiveDate: new Date(),
    expectedReturnDate: null,
    reason: null,
    medicalClearanceRequired: false,
    isCurrent: true,
    injuryId: null,
    isActive: true,
    organizationId: 'org-1',
    teamId: 'team-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'medical-1',
    updatedBy: 'medical-1',
    deletedAt: null,
    deletedBy: null,
    lastRequestId: null,
    lastIpAddress: null,
    injury: null,
    ...overrides,
  } as PlayerAvailability;
}