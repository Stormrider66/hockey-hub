import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  CreateDrillDto,
  UpdateDrillDto,
  DrillFilterDto,
  RateDrillDto,
  DrillUsageDto,
  BulkDrillOperationDto,
  DrillSetupDto,
  DrillInstructionDto
} from '../../../dto/coach/drill-library.dto';

describe('Drill Library DTOs', () => {
  describe('DrillSetupDto', () => {
    const validSetup = {
      rinkArea: 'zone',
      diagram: 'Simple setup diagram',
      cones: 10,
      pucks: 20,
      otherEquipment: ['Sticks', 'Goals']
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(DrillSetupDto, validSetup);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid rink area', async () => {
      const dto = plainToClass(DrillSetupDto, {
        ...validSetup,
        rinkArea: 'invalid_area'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('rinkArea');
    });

    it('should fail validation with cones below minimum', async () => {
      const dto = plainToClass(DrillSetupDto, {
        ...validSetup,
        cones: -1
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('cones');
    });

    it('should fail validation with cones above maximum', async () => {
      const dto = plainToClass(DrillSetupDto, {
        ...validSetup,
        cones: 51
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('cones');
    });

    it('should fail validation with pucks above maximum', async () => {
      const dto = plainToClass(DrillSetupDto, {
        ...validSetup,
        pucks: 101
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('pucks');
    });

    it('should fail validation with diagram exceeding max length', async () => {
      const dto = plainToClass(DrillSetupDto, {
        ...validSetup,
        diagram: 'A'.repeat(501)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('diagram');
    });

    it('should pass validation with minimal data', async () => {
      const minimalSetup = {
        rinkArea: 'full'
      };
      const dto = plainToClass(DrillSetupDto, minimalSetup);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle boundary values correctly', async () => {
      const boundarySetup = {
        rinkArea: 'corner',
        cones: 0,    // minimum boundary
        pucks: 100   // maximum boundary
      };
      const dto = plainToClass(DrillSetupDto, boundarySetup);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('DrillInstructionDto', () => {
    const validInstruction = {
      step: 1,
      description: 'Start at the goal line and skate forward',
      duration: 30,
      keyPoints: ['Keep head up', 'Maintain speed']
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(DrillInstructionDto, validInstruction);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with step below minimum', async () => {
      const dto = plainToClass(DrillInstructionDto, {
        ...validInstruction,
        step: 0
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('step');
    });

    it('should fail validation with step above maximum', async () => {
      const dto = plainToClass(DrillInstructionDto, {
        ...validInstruction,
        step: 21
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('step');
    });

    it('should fail validation with duration above maximum', async () => {
      const dto = plainToClass(DrillInstructionDto, {
        ...validInstruction,
        duration: 3601
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('duration');
    });

    it('should fail validation with description exceeding max length', async () => {
      const dto = plainToClass(DrillInstructionDto, {
        ...validInstruction,
        description: 'A'.repeat(1001)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
    });

    it('should pass validation without optional fields', async () => {
      const { duration, keyPoints, ...instructionWithoutOptional } = validInstruction;
      const dto = plainToClass(DrillInstructionDto, instructionWithoutOptional);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle boundary values correctly', async () => {
      const boundaryInstruction = {
        step: 1,      // minimum boundary
        description: 'Basic step',
        duration: 0   // minimum boundary
      };
      const dto = plainToClass(DrillInstructionDto, boundaryInstruction);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('CreateDrillDto', () => {
    const validCreateData = {
      name: 'Figure 8 Skating Drill',
      description: 'Improve skating agility and edge work through figure 8 patterns',
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
      isPublic: false,
      categoryId: '550e8400-e29b-41d4-a716-446655440001',
      type: 'skill',
      difficulty: 'intermediate',
      duration: 15,
      minPlayers: 1,
      maxPlayers: 20,
      equipment: ['Cones', 'Pucks'],
      setup: {
        rinkArea: 'zone',
        cones: 8,
        pucks: 0
      },
      instructions: [{
        step: 1,
        description: 'Set up cones in figure 8 pattern',
        duration: 60
      }],
      objectives: ['Improve edge work', 'Develop agility'],
      keyPoints: ['Keep knees bent', 'Use both edges'],
      variations: ['Add puck handling', 'Increase speed'],
      tags: ['skating', 'agility'],
      ageGroups: ['U12', 'U14', 'U16'],
      videoUrl: 'https://example.com/drill-video.mp4',
      animationUrl: 'https://example.com/drill-animation.gif',
      usageCount: 0,
      rating: 0,
      ratingCount: 0,
      metadata: { author: 'Coach Smith' }
    };

    it('should pass validation with complete valid data', async () => {
      const dto = plainToClass(CreateDrillDto, validCreateData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with minimal required data', async () => {
      const minimalData = {
        name: 'Basic Drill',
        description: 'Simple drill description',
        categoryId: '550e8400-e29b-41d4-a716-446655440001',
        type: 'warm_up',
        difficulty: 'beginner',
        duration: 10,
        minPlayers: 1,
        maxPlayers: 10,
        equipment: ['Pucks'],
        setup: {
          rinkArea: 'full'
        },
        instructions: [{
          step: 1,
          description: 'Basic instruction'
        }]
      };
      const dto = plainToClass(CreateDrillDto, minimalData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation without required name', async () => {
      const { name, ...dataWithoutName } = validCreateData;
      const dto = plainToClass(CreateDrillDto, dataWithoutName);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'name')).toBe(true);
    });

    it('should fail validation with invalid drill type', async () => {
      const dto = plainToClass(CreateDrillDto, {
        ...validCreateData,
        type: 'invalid_type'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('type');
    });

    it('should fail validation with invalid difficulty', async () => {
      const dto = plainToClass(CreateDrillDto, {
        ...validCreateData,
        difficulty: 'invalid_difficulty'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('difficulty');
    });

    it('should fail validation with duration below minimum', async () => {
      const dto = plainToClass(CreateDrillDto, {
        ...validCreateData,
        duration: 0
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('duration');
    });

    it('should fail validation with duration above maximum', async () => {
      const dto = plainToClass(CreateDrillDto, {
        ...validCreateData,
        duration: 500
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('duration');
    });

    it('should fail validation with minPlayers below minimum', async () => {
      const dto = plainToClass(CreateDrillDto, {
        ...validCreateData,
        minPlayers: 0
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('minPlayers');
    });

    it('should fail validation with maxPlayers above maximum', async () => {
      const dto = plainToClass(CreateDrillDto, {
        ...validCreateData,
        maxPlayers: 51
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('maxPlayers');
    });

    it('should fail validation with name exceeding max length', async () => {
      const dto = plainToClass(CreateDrillDto, {
        ...validCreateData,
        name: 'A'.repeat(256)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
    });

    it('should fail validation with description exceeding max length', async () => {
      const dto = plainToClass(CreateDrillDto, {
        ...validCreateData,
        description: 'A'.repeat(2001)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
    });

    it('should fail validation with invalid videoUrl', async () => {
      const dto = plainToClass(CreateDrillDto, {
        ...validCreateData,
        videoUrl: 'not-a-valid-url'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('videoUrl');
    });

    it('should fail validation with invalid animationUrl', async () => {
      const dto = plainToClass(CreateDrillDto, {
        ...validCreateData,
        animationUrl: 'not-a-valid-url'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('animationUrl');
    });

    it('should fail validation with rating below minimum', async () => {
      const dto = plainToClass(CreateDrillDto, {
        ...validCreateData,
        rating: -1
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('rating');
    });

    it('should fail validation with rating above maximum', async () => {
      const dto = plainToClass(CreateDrillDto, {
        ...validCreateData,
        rating: 6
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('rating');
    });

    it('should fail validation with invalid age groups', async () => {
      const dto = plainToClass(CreateDrillDto, {
        ...validCreateData,
        ageGroups: ['U12', 'Invalid_Age']
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should fail validation with empty equipment array', async () => {
      const dto = plainToClass(CreateDrillDto, {
        ...validCreateData,
        equipment: []
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('equipment');
    });

    it('should fail validation with empty instructions array', async () => {
      const dto = plainToClass(CreateDrillDto, {
        ...validCreateData,
        instructions: []
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('instructions');
    });

    it('should validate nested setup correctly', async () => {
      const invalidSetupData = {
        ...validCreateData,
        setup: {
          rinkArea: 'invalid_area',
          cones: -1
        }
      };
      const dto = plainToClass(CreateDrillDto, invalidSetupData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate nested instructions correctly', async () => {
      const invalidInstructionsData = {
        ...validCreateData,
        instructions: [{
          step: 0, // invalid step
          description: 'Test instruction'
        }]
      };
      const dto = plainToClass(CreateDrillDto, invalidInstructionsData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateDrillDto', () => {
    const validUpdateData = {
      name: 'Updated Drill Name',
      description: 'Updated description',
      isPublic: true,
      difficulty: 'advanced',
      duration: 20,
      rating: 4.5,
      usageCount: 5
    };

    it('should pass validation with valid update data', async () => {
      const dto = plainToClass(UpdateDrillDto, validUpdateData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty object (all optional)', async () => {
      const dto = plainToClass(UpdateDrillDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid type', async () => {
      const dto = plainToClass(UpdateDrillDto, {
        type: 'invalid_type'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('type');
    });

    it('should fail validation with duration out of range', async () => {
      const dto = plainToClass(UpdateDrillDto, {
        duration: 500
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('duration');
    });

    it('should fail validation with negative usage count', async () => {
      const dto = plainToClass(UpdateDrillDto, {
        usageCount: -1
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('usageCount');
    });
  });

  describe('DrillFilterDto', () => {
    const validFilterData = {
      type: 'skill',
      difficulty: 'intermediate',
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      isPublic: true,
      organizationId: '550e8400-e29b-41d4-a716-446655440001',
      minPlayers: 5,
      maxPlayers: 15,
      maxDuration: 30,
      equipment: ['Pucks', 'Cones'],
      tags: ['skating', 'agility'],
      ageGroups: ['U12', 'U14'],
      search: 'skating drill',
      minRating: 3.0,
      rinkArea: 'zone'
    };

    it('should pass validation with valid filter data', async () => {
      const dto = plainToClass(DrillFilterDto, validFilterData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty filter (all optional)', async () => {
      const dto = plainToClass(DrillFilterDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid type', async () => {
      const dto = plainToClass(DrillFilterDto, {
        type: 'invalid_type'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('type');
    });

    it('should fail validation with invalid difficulty', async () => {
      const dto = plainToClass(DrillFilterDto, {
        difficulty: 'invalid_difficulty'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('difficulty');
    });

    it('should fail validation with search exceeding max length', async () => {
      const dto = plainToClass(DrillFilterDto, {
        search: 'A'.repeat(256)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('search');
    });

    it('should fail validation with minRating above maximum', async () => {
      const dto = plainToClass(DrillFilterDto, {
        minRating: 6
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('minRating');
    });

    it('should fail validation with invalid rink area', async () => {
      const dto = plainToClass(DrillFilterDto, {
        rinkArea: 'invalid_area'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('rinkArea');
    });

    it('should fail validation with invalid age groups', async () => {
      const dto = plainToClass(DrillFilterDto, {
        ageGroups: ['U12', 'Invalid_Age']
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });

  describe('RateDrillDto', () => {
    const validRating = {
      drillId: '550e8400-e29b-41d4-a716-446655440000',
      rating: 4,
      comment: 'Great drill for developing skills'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(RateDrillDto, validRating);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with rating below minimum', async () => {
      const dto = plainToClass(RateDrillDto, {
        ...validRating,
        rating: 0
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('rating');
    });

    it('should fail validation with rating above maximum', async () => {
      const dto = plainToClass(RateDrillDto, {
        ...validRating,
        rating: 6
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('rating');
    });

    it('should fail validation with comment exceeding max length', async () => {
      const dto = plainToClass(RateDrillDto, {
        ...validRating,
        comment: 'A'.repeat(501)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('comment');
    });

    it('should pass validation without optional comment', async () => {
      const { comment, ...ratingWithoutComment } = validRating;
      const dto = plainToClass(RateDrillDto, ratingWithoutComment);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid drillId', async () => {
      const dto = plainToClass(RateDrillDto, {
        ...validRating,
        drillId: 'invalid-uuid'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('drillId');
    });

    it('should handle boundary values correctly', async () => {
      const boundaryRating = {
        drillId: '550e8400-e29b-41d4-a716-446655440000',
        rating: 1  // minimum boundary
      };
      const dto = plainToClass(RateDrillDto, boundaryRating);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('DrillUsageDto', () => {
    const validUsage = {
      drillId: '550e8400-e29b-41d4-a716-446655440000',
      context: 'practice',
      relatedEntityId: '550e8400-e29b-41d4-a716-446655440001'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(DrillUsageDto, validUsage);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with minimal data', async () => {
      const minimalUsage = {
        drillId: '550e8400-e29b-41d4-a716-446655440000'
      };
      const dto = plainToClass(DrillUsageDto, minimalUsage);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid drillId', async () => {
      const dto = plainToClass(DrillUsageDto, {
        ...validUsage,
        drillId: 'invalid-uuid'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('drillId');
    });

    it('should fail validation with context exceeding max length', async () => {
      const dto = plainToClass(DrillUsageDto, {
        ...validUsage,
        context: 'A'.repeat(256)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('context');
    });

    it('should fail validation with invalid relatedEntityId', async () => {
      const dto = plainToClass(DrillUsageDto, {
        ...validUsage,
        relatedEntityId: 'invalid-uuid'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('relatedEntityId');
    });
  });

  describe('BulkDrillOperationDto', () => {
    const validBulkOperation = {
      drillIds: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
      operation: 'activate',
      reason: 'Reactivating popular drills'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(BulkDrillOperationDto, validBulkOperation);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation without optional reason', async () => {
      const { reason, ...operationWithoutReason } = validBulkOperation;
      const dto = plainToClass(BulkDrillOperationDto, operationWithoutReason);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty drillIds array', async () => {
      const dto = plainToClass(BulkDrillOperationDto, {
        ...validBulkOperation,
        drillIds: []
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('drillIds');
    });

    it('should fail validation with invalid drill UUIDs', async () => {
      const dto = plainToClass(BulkDrillOperationDto, {
        ...validBulkOperation,
        drillIds: ['invalid-uuid']
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should fail validation with invalid operation', async () => {
      const dto = plainToClass(BulkDrillOperationDto, {
        ...validBulkOperation,
        operation: 'invalid_operation'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('operation');
    });

    it('should fail validation with reason exceeding max length', async () => {
      const dto = plainToClass(BulkDrillOperationDto, {
        ...validBulkOperation,
        reason: 'A'.repeat(501)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('reason');
    });

    it('should validate all supported operations', async () => {
      const operations = ['activate', 'deactivate', 'delete', 'public', 'private'];
      
      for (const operation of operations) {
        const dto = plainToClass(BulkDrillOperationDto, {
          ...validBulkOperation,
          operation
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe('Complex Nested Validation', () => {
    it('should validate complex drill with multiple instructions', async () => {
      const complexDrill = {
        name: 'Complex Multi-Step Drill',
        description: 'Advanced drill with multiple phases',
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        type: 'tactical',
        difficulty: 'elite',
        duration: 45,
        minPlayers: 10,
        maxPlayers: 20,
        equipment: ['Pucks', 'Cones', 'Goals'],
        setup: {
          rinkArea: 'full',
          cones: 20,
          pucks: 30,
          otherEquipment: ['Boards', 'Nets']
        },
        instructions: [
          {
            step: 1,
            description: 'Set up the drill area with cones in specific pattern',
            duration: 120,
            keyPoints: ['Proper spacing', 'Clear sight lines']
          },
          {
            step: 2,
            description: 'Players execute first phase of movement',
            duration: 60,
            keyPoints: ['Quick feet', 'Head up']
          },
          {
            step: 3,
            description: 'Add puck handling element',
            duration: 90,
            keyPoints: ['Soft hands', 'Control through turns']
          }
        ],
        objectives: ['Improve tactical awareness', 'Develop puck skills'],
        variations: ['Increase pace', 'Add defensive pressure'],
        ageGroups: ['U16', 'U18', 'Senior'],
        tags: ['advanced', 'tactical', 'full-ice']
      };

      const dto = plainToClass(CreateDrillDto, complexDrill);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with nested errors', async () => {
      const invalidComplexDrill = {
        name: 'Invalid Complex Drill',
        description: 'Drill with validation errors',
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        type: 'tactical',
        difficulty: 'elite',
        duration: 45,
        minPlayers: 10,
        maxPlayers: 20,
        equipment: ['Pucks'],
        setup: {
          rinkArea: 'invalid_area', // invalid
          cones: -5 // invalid
        },
        instructions: [
          {
            step: 0, // invalid - below minimum
            description: 'Invalid step instruction',
            duration: 4000 // invalid - above maximum
          }
        ]
      };

      const dto = plainToClass(CreateDrillDto, invalidComplexDrill);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Boundary Value Testing', () => {
    it('should handle minimum boundary values correctly', async () => {
      const minBoundaryDrill = {
        name: 'Min Drill',
        description: 'Minimum values drill',
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        type: 'warm_up',
        difficulty: 'beginner',
        duration: 1,      // minimum
        minPlayers: 1,    // minimum
        maxPlayers: 1,    // minimum
        equipment: ['Item'],
        setup: {
          rinkArea: 'full'
        },
        instructions: [{
          step: 1,        // minimum
          description: 'Min instruction'
        }],
        rating: 0,        // minimum
        usageCount: 0     // minimum
      };

      const dto = plainToClass(CreateDrillDto, minBoundaryDrill);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle maximum boundary values correctly', async () => {
      const maxBoundaryDrill = {
        name: 'A'.repeat(255),     // maximum
        description: 'A'.repeat(2000), // maximum
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        type: 'conditioning',
        difficulty: 'elite',
        duration: 480,    // maximum
        minPlayers: 50,   // maximum
        maxPlayers: 50,   // maximum
        equipment: ['Item'],
        setup: {
          rinkArea: 'full',
          cones: 50,      // maximum
          pucks: 100      // maximum
        },
        instructions: [{
          step: 20,       // maximum
          description: 'A'.repeat(1000), // maximum
          duration: 3600  // maximum
        }],
        rating: 5,        // maximum
        ratingCount: 1000 // large value
      };

      const dto = plainToClass(CreateDrillDto, maxBoundaryDrill);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject values just outside boundaries', async () => {
      const outOfBoundsDrill = {
        name: 'Out of Bounds Drill',
        description: 'Testing boundary violations',
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        type: 'skill',
        difficulty: 'intermediate',
        duration: 481,    // just above maximum
        minPlayers: 1,
        maxPlayers: 10,
        equipment: ['Item'],
        setup: {
          rinkArea: 'full'
        },
        instructions: [{
          step: 1,
          description: 'Test instruction'
        }]
      };

      const dto = plainToClass(CreateDrillDto, outOfBoundsDrill);
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('duration');
    });
  });
});