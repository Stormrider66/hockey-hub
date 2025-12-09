import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  CreateTacticalPlanDto,
  UpdateTacticalPlanDto,
  TacticalPlanFilterDto,
  PlayerPositionDto,
  PlayerAssignmentDto,
  TriggerDto,
  VideoReferenceDto,
  FormationDto
} from '../../../dto/coach/tactical-plan.dto';

describe('Tactical Plan DTOs', () => {
  describe('PlayerPositionDto', () => {
    const validPlayerPosition = {
      playerId: '550e8400-e29b-41d4-a716-446655440000',
      position: 'C',
      x: 0,
      y: 0,
      zone: 'offensive'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(PlayerPositionDto, validPlayerPosition);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid position', async () => {
      const dto = plainToClass(PlayerPositionDto, {
        ...validPlayerPosition,
        position: 'INVALID'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('position');
    });

    it('should fail validation with x coordinate out of range', async () => {
      const dto = plainToClass(PlayerPositionDto, {
        ...validPlayerPosition,
        x: -150
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('x');
    });

    it('should fail validation with y coordinate out of range', async () => {
      const dto = plainToClass(PlayerPositionDto, {
        ...validPlayerPosition,
        y: 100
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('y');
    });

    it('should fail validation with invalid zone', async () => {
      const dto = plainToClass(PlayerPositionDto, {
        ...validPlayerPosition,
        zone: 'invalid_zone'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('zone');
    });

    it('should pass validation without optional playerId', async () => {
      const { playerId, ...positionWithoutPlayerId } = validPlayerPosition;
      const dto = plainToClass(PlayerPositionDto, positionWithoutPlayerId);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid UUID for playerId', async () => {
      const dto = plainToClass(PlayerPositionDto, {
        ...validPlayerPosition,
        playerId: 'invalid-uuid'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('playerId');
    });
  });

  describe('PlayerAssignmentDto', () => {
    const validPlayerAssignment = {
      playerId: '550e8400-e29b-41d4-a716-446655440000',
      position: 'Center',
      responsibilities: ['Face-offs', 'Defensive coverage'],
      alternatePosition: 'Left Wing'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(PlayerAssignmentDto, validPlayerAssignment);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation without required playerId', async () => {
      const { playerId, ...assignmentWithoutPlayerId } = validPlayerAssignment;
      const dto = plainToClass(PlayerAssignmentDto, assignmentWithoutPlayerId);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'playerId')).toBe(true);
    });

    it('should fail validation with position exceeding max length', async () => {
      const dto = plainToClass(PlayerAssignmentDto, {
        ...validPlayerAssignment,
        position: 'A'.repeat(101)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('position');
    });

    it('should fail validation with empty responsibilities array', async () => {
      const dto = plainToClass(PlayerAssignmentDto, {
        ...validPlayerAssignment,
        responsibilities: []
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('responsibilities');
    });

    it('should pass validation without optional alternatePosition', async () => {
      const { alternatePosition, ...assignmentWithoutAlternate } = validPlayerAssignment;
      const dto = plainToClass(PlayerAssignmentDto, assignmentWithoutAlternate);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('TriggerDto', () => {
    const validTrigger = {
      situation: 'Power play opportunity',
      action: 'Execute PP1 formation'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(TriggerDto, validTrigger);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with situation exceeding max length', async () => {
      const dto = plainToClass(TriggerDto, {
        ...validTrigger,
        situation: 'A'.repeat(256)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('situation');
    });

    it('should fail validation with action exceeding max length', async () => {
      const dto = plainToClass(TriggerDto, {
        ...validTrigger,
        action: 'A'.repeat(256)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('action');
    });
  });

  describe('VideoReferenceDto', () => {
    const validVideoReference = {
      url: 'https://example.com/video.mp4',
      timestamp: 120,
      description: 'Power play execution'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(VideoReferenceDto, validVideoReference);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with negative timestamp', async () => {
      const dto = plainToClass(VideoReferenceDto, {
        ...validVideoReference,
        timestamp: -10
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('timestamp');
    });

    it('should fail validation with description exceeding max length', async () => {
      const dto = plainToClass(VideoReferenceDto, {
        ...validVideoReference,
        description: 'A'.repeat(256)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
    });
  });

  describe('FormationDto', () => {
    const validFormation = {
      type: 'even_strength',
      zones: {
        offensive: [{
          position: 'C',
          x: 10,
          y: 0,
          zone: 'offensive'
        }],
        neutral: [{
          position: 'LD',
          x: 0,
          y: -10,
          zone: 'neutral'
        }],
        defensive: [{
          position: 'G',
          x: -40,
          y: 0,
          zone: 'defensive'
        }]
      }
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(FormationDto, validFormation);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid formation type', async () => {
      const dto = plainToClass(FormationDto, {
        ...validFormation,
        type: 'invalid_type'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('type');
    });
  });

  describe('CreateTacticalPlanDto', () => {
    const validCreateData = {
      name: 'Power Play Setup',
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
      coachId: '550e8400-e29b-41d4-a716-446655440001',
      teamId: '550e8400-e29b-41d4-a716-446655440002',
      category: 'offensive',
      formation: {
        type: 'powerplay',
        zones: {
          offensive: [{
            position: 'C',
            x: 10,
            y: 0,
            zone: 'offensive'
          }],
          neutral: [],
          defensive: []
        }
      },
      playerAssignments: [{
        playerId: '550e8400-e29b-41d4-a716-446655440003',
        position: 'Center',
        responsibilities: ['Net front presence']
      }],
      description: 'Basic power play formation',
      triggers: [{
        situation: 'Man advantage',
        action: 'Execute formation'
      }],
      videoReferences: [{
        url: 'https://example.com/video.mp4',
        timestamp: 60,
        description: 'Example execution'
      }],
      isActive: true
    };

    it('should pass validation with complete valid data', async () => {
      const dto = plainToClass(CreateTacticalPlanDto, validCreateData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with minimal required data', async () => {
      const minimalData = {
        name: 'Basic Plan',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        teamId: '550e8400-e29b-41d4-a716-446655440002',
        category: 'defensive',
        formation: validCreateData.formation,
        playerAssignments: validCreateData.playerAssignments
      };
      const dto = plainToClass(CreateTacticalPlanDto, minimalData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation without required name', async () => {
      const { name, ...dataWithoutName } = validCreateData;
      const dto = plainToClass(CreateTacticalPlanDto, dataWithoutName);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'name')).toBe(true);
    });

    it('should fail validation with invalid category', async () => {
      const dto = plainToClass(CreateTacticalPlanDto, {
        ...validCreateData,
        category: 'invalid_category'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('category');
    });

    it('should fail validation with name exceeding max length', async () => {
      const dto = plainToClass(CreateTacticalPlanDto, {
        ...validCreateData,
        name: 'A'.repeat(256)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
    });

    it('should fail validation with invalid UUID format', async () => {
      const dto = plainToClass(CreateTacticalPlanDto, {
        ...validCreateData,
        organizationId: 'invalid-uuid'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('organizationId');
    });

    it('should fail validation with description exceeding max length', async () => {
      const dto = plainToClass(CreateTacticalPlanDto, {
        ...validCreateData,
        description: 'A'.repeat(1001)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
    });

    it('should validate nested objects correctly', async () => {
      const invalidNestedData = {
        ...validCreateData,
        playerAssignments: [{
          playerId: 'invalid-uuid',
          position: 'Center',
          responsibilities: []
        }]
      };
      const dto = plainToClass(CreateTacticalPlanDto, invalidNestedData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateTacticalPlanDto', () => {
    const validUpdateData = {
      name: 'Updated Power Play Setup',
      category: 'special_teams',
      description: 'Updated description',
      isActive: false
    };

    it('should pass validation with valid update data', async () => {
      const dto = plainToClass(UpdateTacticalPlanDto, validUpdateData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty object (all optional)', async () => {
      const dto = plainToClass(UpdateTacticalPlanDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid category', async () => {
      const dto = plainToClass(UpdateTacticalPlanDto, {
        category: 'invalid_category'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('category');
    });
  });

  describe('TacticalPlanFilterDto', () => {
    const validFilterData = {
      category: 'offensive',
      teamId: '550e8400-e29b-41d4-a716-446655440000',
      coachId: '550e8400-e29b-41d4-a716-446655440001',
      isActive: true,
      search: 'power play'
    };

    it('should pass validation with valid filter data', async () => {
      const dto = plainToClass(TacticalPlanFilterDto, validFilterData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty filter (all optional)', async () => {
      const dto = plainToClass(TacticalPlanFilterDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid category', async () => {
      const dto = plainToClass(TacticalPlanFilterDto, {
        category: 'invalid_category'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('category');
    });

    it('should fail validation with search exceeding max length', async () => {
      const dto = plainToClass(TacticalPlanFilterDto, {
        search: 'A'.repeat(256)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('search');
    });
  });

  describe('Array Validation Edge Cases', () => {
    it('should handle empty arrays correctly', async () => {
      const dataWithEmptyArrays = {
        name: 'Test Plan',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        teamId: '550e8400-e29b-41d4-a716-446655440002',
        category: 'defensive',
        formation: {
          type: 'even_strength',
          zones: {
            offensive: [],
            neutral: [],
            defensive: []
          }
        },
        playerAssignments: [{
          playerId: '550e8400-e29b-41d4-a716-446655440003',
          position: 'Center',
          responsibilities: ['Test']
        }],
        triggers: [],
        videoReferences: []
      };
      const dto = plainToClass(CreateTacticalPlanDto, dataWithEmptyArrays);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate all items in arrays', async () => {
      const dataWithInvalidArrayItems = {
        name: 'Test Plan',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        teamId: '550e8400-e29b-41d4-a716-446655440002',
        category: 'defensive',
        formation: {
          type: 'even_strength',
          zones: {
            offensive: [],
            neutral: [],
            defensive: []
          }
        },
        playerAssignments: [{
          playerId: '550e8400-e29b-41d4-a716-446655440003',
          position: 'Center',
          responsibilities: ['Test']
        }],
        triggers: [
          { situation: 'Valid', action: 'Valid' },
          { situation: '', action: 'Invalid - empty situation' }
        ]
      };
      const dto = plainToClass(CreateTacticalPlanDto, dataWithInvalidArrayItems);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Boundary Value Testing', () => {
    it('should handle boundary values for coordinates', async () => {
      const boundaryPosition = {
        position: 'C',
        x: -100, // minimum boundary
        y: 50,   // maximum boundary
        zone: 'offensive'
      };
      const dto = plainToClass(PlayerPositionDto, boundaryPosition);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject coordinates just outside boundaries', async () => {
      const outOfBoundsPosition = {
        position: 'C',
        x: -101, // just below minimum
        y: 0,
        zone: 'offensive'
      };
      const dto = plainToClass(PlayerPositionDto, outOfBoundsPosition);
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('x');
    });
  });
});