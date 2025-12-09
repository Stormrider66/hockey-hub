import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  CreatePracticePlanDto,
  UpdatePracticePlanDto,
  PracticePlanFilterDto,
  BulkAttendanceUpdateDto,
  BulkEvaluationUpdateDto,
  PracticeSectionDto,
  PlayerAttendanceDto,
  PlayerEvaluationDto,
  LineupDto
} from '../../../dto/coach/practice-plan.dto';

describe('Practice Plan DTOs', () => {
  describe('PracticeSectionDto', () => {
    const validSection = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Warm-up Skating',
      duration: 15,
      drillIds: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'],
      notes: 'Focus on edge work',
      equipment: ['Cones', 'Pucks']
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(PracticeSectionDto, validSection);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with duration below minimum', async () => {
      const dto = plainToClass(PracticeSectionDto, {
        ...validSection,
        duration: 0
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('duration');
    });

    it('should fail validation with duration above maximum', async () => {
      const dto = plainToClass(PracticeSectionDto, {
        ...validSection,
        duration: 500
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('duration');
    });

    it('should fail validation with invalid drill UUID', async () => {
      const dto = plainToClass(PracticeSectionDto, {
        ...validSection,
        drillIds: ['invalid-uuid']
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should fail validation with notes exceeding max length', async () => {
      const dto = plainToClass(PracticeSectionDto, {
        ...validSection,
        notes: 'A'.repeat(1001)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('notes');
    });

    it('should pass validation without optional fields', async () => {
      const { notes, equipment, ...sectionWithoutOptional } = validSection;
      const dto = plainToClass(PracticeSectionDto, sectionWithoutOptional);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('PlayerAttendanceDto', () => {
    const validAttendance = {
      playerId: '550e8400-e29b-41d4-a716-446655440000',
      present: true,
      reason: 'On time'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(PlayerAttendanceDto, validAttendance);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation without required playerId', async () => {
      const { playerId, ...attendanceWithoutPlayerId } = validAttendance;
      const dto = plainToClass(PlayerAttendanceDto, attendanceWithoutPlayerId);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'playerId')).toBe(true);
    });

    it('should fail validation without required present field', async () => {
      const { present, ...attendanceWithoutPresent } = validAttendance;
      const dto = plainToClass(PlayerAttendanceDto, attendanceWithoutPresent);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'present')).toBe(true);
    });

    it('should pass validation without optional reason', async () => {
      const { reason, ...attendanceWithoutReason } = validAttendance;
      const dto = plainToClass(PlayerAttendanceDto, attendanceWithoutReason);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with reason exceeding max length', async () => {
      const dto = plainToClass(PlayerAttendanceDto, {
        ...validAttendance,
        reason: 'A'.repeat(256)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('reason');
    });
  });

  describe('PlayerEvaluationDto', () => {
    const validEvaluation = {
      playerId: '550e8400-e29b-41d4-a716-446655440000',
      rating: 8,
      notes: 'Strong performance today',
      areasOfImprovement: ['Backhand shots', 'Defensive positioning']
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(PlayerEvaluationDto, validEvaluation);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with rating below minimum', async () => {
      const dto = plainToClass(PlayerEvaluationDto, {
        ...validEvaluation,
        rating: 0
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('rating');
    });

    it('should fail validation with rating above maximum', async () => {
      const dto = plainToClass(PlayerEvaluationDto, {
        ...validEvaluation,
        rating: 11
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('rating');
    });

    it('should fail validation with notes exceeding max length', async () => {
      const dto = plainToClass(PlayerEvaluationDto, {
        ...validEvaluation,
        notes: 'A'.repeat(1001)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('notes');
    });

    it('should pass validation without optional fields', async () => {
      const { notes, areasOfImprovement, ...evaluationWithoutOptional } = validEvaluation;
      const dto = plainToClass(PlayerEvaluationDto, evaluationWithoutOptional);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('LineupDto', () => {
    const validLineup = {
      forward1: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
      forward2: ['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003'],
      defense1: ['550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005'],
      goalies: ['550e8400-e29b-41d4-a716-446655440006']
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(LineupDto, validLineup);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty object (all optional)', async () => {
      const dto = plainToClass(LineupDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid UUID in forward1', async () => {
      const dto = plainToClass(LineupDto, {
        ...validLineup,
        forward1: ['invalid-uuid']
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should pass validation with empty arrays', async () => {
      const dto = plainToClass(LineupDto, {
        forward1: [],
        defense1: [],
        goalies: []
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('CreatePracticePlanDto', () => {
    const validCreateData = {
      title: 'Pre-Season Practice #1',
      description: 'Focus on basic skills and conditioning',
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
      teamId: '550e8400-e29b-41d4-a716-446655440001',
      coachId: '550e8400-e29b-41d4-a716-446655440002',
      trainingPlanId: '550e8400-e29b-41d4-a716-446655440003',
      date: '2024-09-15',
      duration: 90,
      status: 'planned',
      primaryFocus: 'skills',
      secondaryFocus: ['conditioning', 'tactics'],
      location: 'Main Arena',
      rinkId: 'rink-01',
      sections: [{
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'Warm-up',
        duration: 15,
        drillIds: ['550e8400-e29b-41d4-a716-446655440005']
      }],
      objectives: ['Improve passing accuracy', 'Build endurance'],
      equipment: ['Cones', 'Pucks', 'Nets'],
      lineups: {
        forward1: ['550e8400-e29b-41d4-a716-446655440006']
      },
      notes: 'First practice of the season',
      coachFeedback: 'Team showed good energy',
      attendance: [{
        playerId: '550e8400-e29b-41d4-a716-446655440006',
        present: true
      }],
      playerEvaluations: [{
        playerId: '550e8400-e29b-41d4-a716-446655440006',
        rating: 8
      }],
      metadata: { weather: 'indoor' }
    };

    it('should pass validation with complete valid data', async () => {
      const dto = plainToClass(CreatePracticePlanDto, validCreateData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with minimal required data', async () => {
      const minimalData = {
        title: 'Basic Practice',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        teamId: '550e8400-e29b-41d4-a716-446655440001',
        coachId: '550e8400-e29b-41d4-a716-446655440002',
        date: '2024-09-15',
        duration: 60,
        primaryFocus: 'skills',
        sections: [{
          id: '550e8400-e29b-41d4-a716-446655440004',
          name: 'Main Section',
          duration: 60,
          drillIds: ['550e8400-e29b-41d4-a716-446655440005']
        }]
      };
      const dto = plainToClass(CreatePracticePlanDto, minimalData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation without required title', async () => {
      const { title, ...dataWithoutTitle } = validCreateData;
      const dto = plainToClass(CreatePracticePlanDto, dataWithoutTitle);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'title')).toBe(true);
    });

    it('should fail validation with invalid status', async () => {
      const dto = plainToClass(CreatePracticePlanDto, {
        ...validCreateData,
        status: 'invalid_status'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
    });

    it('should fail validation with invalid primary focus', async () => {
      const dto = plainToClass(CreatePracticePlanDto, {
        ...validCreateData,
        primaryFocus: 'invalid_focus'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('primaryFocus');
    });

    it('should fail validation with duration below minimum', async () => {
      const dto = plainToClass(CreatePracticePlanDto, {
        ...validCreateData,
        duration: 10
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('duration');
    });

    it('should fail validation with duration above maximum', async () => {
      const dto = plainToClass(CreatePracticePlanDto, {
        ...validCreateData,
        duration: 500
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('duration');
    });

    it('should fail validation with invalid date format', async () => {
      const dto = plainToClass(CreatePracticePlanDto, {
        ...validCreateData,
        date: 'invalid-date'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('date');
    });

    it('should fail validation with empty sections array', async () => {
      const dto = plainToClass(CreatePracticePlanDto, {
        ...validCreateData,
        sections: []
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('sections');
    });

    it('should fail validation with notes exceeding max length', async () => {
      const dto = plainToClass(CreatePracticePlanDto, {
        ...validCreateData,
        notes: 'A'.repeat(2001)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('notes');
    });

    it('should validate nested objects correctly', async () => {
      const invalidNestedData = {
        ...validCreateData,
        sections: [{
          id: 'invalid-uuid',
          name: 'Test',
          duration: 15,
          drillIds: ['550e8400-e29b-41d4-a716-446655440005']
        }]
      };
      const dto = plainToClass(CreatePracticePlanDto, invalidNestedData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation with invalid secondary focus array items', async () => {
      const dto = plainToClass(CreatePracticePlanDto, {
        ...validCreateData,
        secondaryFocus: ['skills', 'invalid_focus']
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });

  describe('UpdatePracticePlanDto', () => {
    const validUpdateData = {
      title: 'Updated Practice Plan',
      description: 'Updated description',
      date: '2024-09-16',
      duration: 75,
      status: 'in_progress',
      primaryFocus: 'conditioning'
    };

    it('should pass validation with valid update data', async () => {
      const dto = plainToClass(UpdatePracticePlanDto, validUpdateData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty object (all optional)', async () => {
      const dto = plainToClass(UpdatePracticePlanDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid status', async () => {
      const dto = plainToClass(UpdatePracticePlanDto, {
        status: 'invalid_status'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
    });

    it('should fail validation with duration out of range', async () => {
      const dto = plainToClass(UpdatePracticePlanDto, {
        duration: 500
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('duration');
    });
  });

  describe('PracticePlanFilterDto', () => {
    const validFilterData = {
      status: 'completed',
      primaryFocus: 'skills',
      teamId: '550e8400-e29b-41d4-a716-446655440000',
      coachId: '550e8400-e29b-41d4-a716-446655440001',
      trainingPlanId: '550e8400-e29b-41d4-a716-446655440002',
      startDate: '2024-09-01',
      endDate: '2024-09-30',
      search: 'pre-season'
    };

    it('should pass validation with valid filter data', async () => {
      const dto = plainToClass(PracticePlanFilterDto, validFilterData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty filter (all optional)', async () => {
      const dto = plainToClass(PracticePlanFilterDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid status', async () => {
      const dto = plainToClass(PracticePlanFilterDto, {
        status: 'invalid_status'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
    });

    it('should fail validation with search exceeding max length', async () => {
      const dto = plainToClass(PracticePlanFilterDto, {
        search: 'A'.repeat(256)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('search');
    });

    it('should fail validation with invalid date format', async () => {
      const dto = plainToClass(PracticePlanFilterDto, {
        startDate: 'invalid-date'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('startDate');
    });
  });

  describe('BulkAttendanceUpdateDto', () => {
    const validBulkAttendance = {
      practicePlanId: '550e8400-e29b-41d4-a716-446655440000',
      attendance: [
        {
          playerId: '550e8400-e29b-41d4-a716-446655440001',
          present: true
        },
        {
          playerId: '550e8400-e29b-41d4-a716-446655440002',
          present: false,
          reason: 'Illness'
        }
      ]
    };

    it('should pass validation with valid bulk attendance data', async () => {
      const dto = plainToClass(BulkAttendanceUpdateDto, validBulkAttendance);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation without required practicePlanId', async () => {
      const { practicePlanId, ...dataWithoutPlanId } = validBulkAttendance;
      const dto = plainToClass(BulkAttendanceUpdateDto, dataWithoutPlanId);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'practicePlanId')).toBe(true);
    });

    it('should fail validation with empty attendance array', async () => {
      const dto = plainToClass(BulkAttendanceUpdateDto, {
        ...validBulkAttendance,
        attendance: []
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('attendance');
    });
  });

  describe('BulkEvaluationUpdateDto', () => {
    const validBulkEvaluation = {
      practicePlanId: '550e8400-e29b-41d4-a716-446655440000',
      evaluations: [
        {
          playerId: '550e8400-e29b-41d4-a716-446655440001',
          rating: 8,
          notes: 'Good performance'
        },
        {
          playerId: '550e8400-e29b-41d4-a716-446655440002',
          rating: 6
        }
      ]
    };

    it('should pass validation with valid bulk evaluation data', async () => {
      const dto = plainToClass(BulkEvaluationUpdateDto, validBulkEvaluation);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation without required practicePlanId', async () => {
      const { practicePlanId, ...dataWithoutPlanId } = validBulkEvaluation;
      const dto = plainToClass(BulkEvaluationUpdateDto, dataWithoutPlanId);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'practicePlanId')).toBe(true);
    });

    it('should validate nested evaluation objects', async () => {
      const invalidEvaluationData = {
        ...validBulkEvaluation,
        evaluations: [{
          playerId: 'invalid-uuid',
          rating: 11 // out of range
        }]
      };
      const dto = plainToClass(BulkEvaluationUpdateDto, invalidEvaluationData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Boundary Value Testing', () => {
    it('should handle boundary values for duration', async () => {
      const boundaryData = {
        title: 'Boundary Test',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        teamId: '550e8400-e29b-41d4-a716-446655440001',
        coachId: '550e8400-e29b-41d4-a716-446655440002',
        date: '2024-09-15',
        duration: 15, // minimum boundary
        primaryFocus: 'skills',
        sections: [{
          id: '550e8400-e29b-41d4-a716-446655440004',
          name: 'Test Section',
          duration: 1, // minimum boundary
          drillIds: ['550e8400-e29b-41d4-a716-446655440005']
        }]
      };
      const dto = plainToClass(CreatePracticePlanDto, boundaryData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle maximum boundary values', async () => {
      const maxBoundaryData = {
        title: 'Max Boundary Test',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        teamId: '550e8400-e29b-41d4-a716-446655440001',
        coachId: '550e8400-e29b-41d4-a716-446655440002',
        date: '2024-09-15',
        duration: 480, // maximum boundary
        primaryFocus: 'skills',
        sections: [{
          id: '550e8400-e29b-41d4-a716-446655440004',
          name: 'Test Section',
          duration: 480, // maximum boundary
          drillIds: ['550e8400-e29b-41d4-a716-446655440005']
        }]
      };
      const dto = plainToClass(CreatePracticePlanDto, maxBoundaryData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Complex Nested Validation', () => {
    it('should validate complex nested structures correctly', async () => {
      const complexData = {
        title: 'Complex Practice',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        teamId: '550e8400-e29b-41d4-a716-446655440001',
        coachId: '550e8400-e29b-41d4-a716-446655440002',
        date: '2024-09-15',
        duration: 90,
        primaryFocus: 'skills',
        sections: [
          {
            id: '550e8400-e29b-41d4-a716-446655440004',
            name: 'Section 1',
            duration: 30,
            drillIds: ['550e8400-e29b-41d4-a716-446655440005'],
            notes: 'Focus on fundamentals',
            equipment: ['Pucks', 'Cones']
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440006',
            name: 'Section 2',
            duration: 60,
            drillIds: ['550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440008']
          }
        ],
        attendance: [
          { playerId: '550e8400-e29b-41d4-a716-446655440009', present: true },
          { playerId: '550e8400-e29b-41d4-a716-446655440010', present: false, reason: 'Injured' }
        ],
        playerEvaluations: [
          { 
            playerId: '550e8400-e29b-41d4-a716-446655440009', 
            rating: 8, 
            notes: 'Excellent effort',
            areasOfImprovement: ['Backhand', 'Faceoffs']
          }
        ]
      };
      const dto = plainToClass(CreatePracticePlanDto, complexData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when nested validation fails', async () => {
      const invalidNestedData = {
        title: 'Invalid Nested Practice',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        teamId: '550e8400-e29b-41d4-a716-446655440001',
        coachId: '550e8400-e29b-41d4-a716-446655440002',
        date: '2024-09-15',
        duration: 90,
        primaryFocus: 'skills',
        sections: [{
          id: '550e8400-e29b-41d4-a716-446655440004',
          name: 'Section 1',
          duration: 600, // exceeds maximum
          drillIds: ['invalid-uuid']
        }],
        playerEvaluations: [{
          playerId: '550e8400-e29b-41d4-a716-446655440009',
          rating: 15 // exceeds maximum
        }]
      };
      const dto = plainToClass(CreatePracticePlanDto, invalidNestedData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});