import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  CreatePlayerEvaluationDto,
  UpdatePlayerEvaluationDto,
  TechnicalSkillsDto,
  SkatingSkillsDto,
  PuckHandlingSkillsDto,
  ShootingSkillsDto,
  PassingSkillsDto,
  TacticalSkillsDto,
  OffensiveSkillsDto,
  DefensiveSkillsDto,
  TransitionSkillsDto,
  PhysicalAttributesDto,
  MentalAttributesDto,
  GameSpecificNotesDto,
  DevelopmentPriorityDto
} from '../../../dto/coach/player-evaluation.dto';

describe('Player Evaluation DTOs', () => {
  describe('SkatingSkillsDto', () => {
    const validSkating = {
      forward: 8,
      backward: 7,
      acceleration: 9,
      agility: 8,
      speed: 9,
      balance: 7,
      edgeWork: 8
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(SkatingSkillsDto, validSkating);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with values below minimum', async () => {
      const dto = plainToClass(SkatingSkillsDto, {
        ...validSkating,
        forward: 0
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('forward');
    });

    it('should fail validation with values above maximum', async () => {
      const dto = plainToClass(SkatingSkillsDto, {
        ...validSkating,
        speed: 11
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('speed');
    });

    it('should handle boundary values correctly', async () => {
      const boundarySkating = {
        forward: 1,    // minimum
        backward: 10,  // maximum
        acceleration: 5,
        agility: 5,
        speed: 5,
        balance: 5,
        edgeWork: 5
      };
      const dto = plainToClass(SkatingSkillsDto, boundarySkating);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('PuckHandlingSkillsDto', () => {
    const validPuckHandling = {
      carrying: 7,
      protection: 8,
      deking: 6,
      receiving: 8,
      inTraffic: 7
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(PuckHandlingSkillsDto, validPuckHandling);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with negative values', async () => {
      const dto = plainToClass(PuckHandlingSkillsDto, {
        ...validPuckHandling,
        carrying: 0
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('carrying');
    });

    it('should fail validation with values above maximum', async () => {
      const dto = plainToClass(PuckHandlingSkillsDto, {
        ...validPuckHandling,
        protection: 15
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('protection');
    });
  });

  describe('ShootingSkillsDto', () => {
    const validShooting = {
      wristShot: 8,
      slapShot: 6,
      snapshot: 7,
      backhand: 5,
      accuracy: 8,
      release: 7,
      power: 9
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(ShootingSkillsDto, validShooting);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with values out of range', async () => {
      const dto = plainToClass(ShootingSkillsDto, {
        ...validShooting,
        wristShot: 0,
        power: 11
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(2);
    });
  });

  describe('PassingSkillsDto', () => {
    const validPassing = {
      forehand: 8,
      backhand: 6,
      saucer: 7,
      accuracy: 8,
      timing: 9,
      vision: 8
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(PassingSkillsDto, validPassing);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid values', async () => {
      const dto = plainToClass(PassingSkillsDto, {
        ...validPassing,
        forehand: 0,
        vision: 11
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(2);
    });
  });

  describe('TechnicalSkillsDto', () => {
    const validTechnicalSkills = {
      skating: {
        forward: 8, backward: 7, acceleration: 9, agility: 8, speed: 9, balance: 7, edgeWork: 8
      },
      puckHandling: {
        carrying: 7, protection: 8, deking: 6, receiving: 8, inTraffic: 7
      },
      shooting: {
        wristShot: 8, slapShot: 6, snapshot: 7, backhand: 5, accuracy: 8, release: 7, power: 9
      },
      passing: {
        forehand: 8, backhand: 6, saucer: 7, accuracy: 8, timing: 9, vision: 8
      }
    };

    it('should pass validation with valid nested data', async () => {
      const dto = plainToClass(TechnicalSkillsDto, validTechnicalSkills);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid nested data', async () => {
      const invalidTechnicalSkills = {
        ...validTechnicalSkills,
        skating: {
          ...validTechnicalSkills.skating,
          forward: 0 // invalid
        }
      };
      const dto = plainToClass(TechnicalSkillsDto, invalidTechnicalSkills);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('OffensiveSkillsDto', () => {
    const validOffensive = {
      positioning: 8,
      spacing: 7,
      timing: 8,
      creativity: 6,
      finishing: 9
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(OffensiveSkillsDto, validOffensive);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with values out of range', async () => {
      const dto = plainToClass(OffensiveSkillsDto, {
        ...validOffensive,
        positioning: 0,
        finishing: 11
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(2);
    });
  });

  describe('DefensiveSkillsDto', () => {
    const validDefensive = {
      positioning: 8,
      gapControl: 7,
      stickPosition: 8,
      bodyPosition: 7,
      anticipation: 9
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(DefensiveSkillsDto, validDefensive);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid values', async () => {
      const dto = plainToClass(DefensiveSkillsDto, {
        ...validDefensive,
        gapControl: 0,
        anticipation: 15
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(2);
    });
  });

  describe('TransitionSkillsDto', () => {
    const validTransition = {
      breakouts: 8,
      rushes: 7,
      tracking: 8,
      backchecking: 7
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(TransitionSkillsDto, validTransition);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with values out of range', async () => {
      const dto = plainToClass(TransitionSkillsDto, {
        ...validTransition,
        breakouts: 0,
        rushes: 11
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(2);
    });
  });

  describe('TacticalSkillsDto', () => {
    const validTacticalSkills = {
      offensive: {
        positioning: 8, spacing: 7, timing: 8, creativity: 6, finishing: 9
      },
      defensive: {
        positioning: 8, gapControl: 7, stickPosition: 8, bodyPosition: 7, anticipation: 9
      },
      transition: {
        breakouts: 8, rushes: 7, tracking: 8, backchecking: 7
      }
    };

    it('should pass validation with valid nested data', async () => {
      const dto = plainToClass(TacticalSkillsDto, validTacticalSkills);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid nested data', async () => {
      const invalidTacticalSkills = {
        ...validTacticalSkills,
        offensive: {
          ...validTacticalSkills.offensive,
          positioning: 0 // invalid
        }
      };
      const dto = plainToClass(TacticalSkillsDto, invalidTacticalSkills);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('PhysicalAttributesDto', () => {
    const validPhysical = {
      strength: 8,
      speed: 9,
      endurance: 7,
      flexibility: 6,
      balance: 8,
      coordination: 7
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(PhysicalAttributesDto, validPhysical);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with values out of range', async () => {
      const dto = plainToClass(PhysicalAttributesDto, {
        ...validPhysical,
        strength: 0,
        speed: 11
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(2);
    });
  });

  describe('MentalAttributesDto', () => {
    const validMental = {
      hockeyIQ: 9,
      competitiveness: 8,
      workEthic: 9,
      coachability: 8,
      leadership: 6,
      teamwork: 8,
      discipline: 7,
      confidence: 8,
      focusUnderPressure: 7
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(MentalAttributesDto, validMental);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with values below minimum', async () => {
      const dto = plainToClass(MentalAttributesDto, {
        ...validMental,
        hockeyIQ: 0
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('hockeyIQ');
    });

    it('should fail validation with values above maximum', async () => {
      const dto = plainToClass(MentalAttributesDto, {
        ...validMental,
        confidence: 11
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('confidence');
    });
  });

  describe('GameSpecificNotesDto', () => {
    const validGameNotes = {
      gamesObserved: 5,
      goals: 2,
      assists: 3,
      plusMinus: 1,
      penaltyMinutes: 2,
      keyMoments: ['Great goal in 2nd period', 'Strong defensive play in OT']
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(GameSpecificNotesDto, validGameNotes);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with negative games observed', async () => {
      const dto = plainToClass(GameSpecificNotesDto, {
        ...validGameNotes,
        gamesObserved: -1
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('gamesObserved');
    });

    it('should fail validation with negative goals', async () => {
      const dto = plainToClass(GameSpecificNotesDto, {
        ...validGameNotes,
        goals: -1
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('goals');
    });

    it('should allow negative plus/minus', async () => {
      const dto = plainToClass(GameSpecificNotesDto, {
        ...validGameNotes,
        plusMinus: -3
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with key moments exceeding max length', async () => {
      const dto = plainToClass(GameSpecificNotesDto, {
        ...validGameNotes,
        keyMoments: ['A'.repeat(501)]
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });

  describe('DevelopmentPriorityDto', () => {
    const validPriority = {
      priority: 1,
      skill: 'Backhand shooting',
      targetImprovement: 'Increase accuracy by 20% and power by 15%',
      timeline: '3 months'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(DevelopmentPriorityDto, validPriority);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with priority below minimum', async () => {
      const dto = plainToClass(DevelopmentPriorityDto, {
        ...validPriority,
        priority: 0
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('priority');
    });

    it('should fail validation with priority above maximum', async () => {
      const dto = plainToClass(DevelopmentPriorityDto, {
        ...validPriority,
        priority: 6
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('priority');
    });

    it('should fail validation with skill exceeding max length', async () => {
      const dto = plainToClass(DevelopmentPriorityDto, {
        ...validPriority,
        skill: 'A'.repeat(256)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('skill');
    });

    it('should fail validation with target improvement exceeding max length', async () => {
      const dto = plainToClass(DevelopmentPriorityDto, {
        ...validPriority,
        targetImprovement: 'A'.repeat(1001)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('targetImprovement');
    });

    it('should fail validation with timeline exceeding max length', async () => {
      const dto = plainToClass(DevelopmentPriorityDto, {
        ...validPriority,
        timeline: 'A'.repeat(101)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('timeline');
    });
  });

  describe('CreatePlayerEvaluationDto', () => {
    const validCreateData = {
      playerId: '550e8400-e29b-41d4-a716-446655440000',
      coachId: '550e8400-e29b-41d4-a716-446655440001',
      teamId: '550e8400-e29b-41d4-a716-446655440002',
      evaluationDate: '2024-09-15T10:00:00Z',
      type: 'midseason',
      technicalSkills: {
        skating: { forward: 8, backward: 7, acceleration: 9, agility: 8, speed: 9, balance: 7, edgeWork: 8 },
        puckHandling: { carrying: 7, protection: 8, deking: 6, receiving: 8, inTraffic: 7 },
        shooting: { wristShot: 8, slapShot: 6, snapshot: 7, backhand: 5, accuracy: 8, release: 7, power: 9 },
        passing: { forehand: 8, backhand: 6, saucer: 7, accuracy: 8, timing: 9, vision: 8 }
      },
      tacticalSkills: {
        offensive: { positioning: 8, spacing: 7, timing: 8, creativity: 6, finishing: 9 },
        defensive: { positioning: 8, gapControl: 7, stickPosition: 8, bodyPosition: 7, anticipation: 9 },
        transition: { breakouts: 8, rushes: 7, tracking: 8, backchecking: 7 }
      },
      physicalAttributes: {
        strength: 8, speed: 9, endurance: 7, flexibility: 6, balance: 8, coordination: 7
      },
      mentalAttributes: {
        hockeyIQ: 9, competitiveness: 8, workEthic: 9, coachability: 8, leadership: 6,
        teamwork: 8, discipline: 7, confidence: 8, focusUnderPressure: 7
      },
      strengths: 'Excellent vision and passing ability, strong work ethic',
      areasForImprovement: 'Needs to improve backhand shooting and defensive positioning',
      coachComments: 'Shows great potential and continues to develop well',
      gameSpecificNotes: {
        gamesObserved: 5, goals: 2, assists: 3, plusMinus: 1, penaltyMinutes: 2,
        keyMoments: ['Great goal in 2nd period', 'Strong defensive play in OT']
      },
      developmentPriorities: [{
        priority: 1, skill: 'Backhand shooting',
        targetImprovement: 'Increase accuracy by 20%', timeline: '3 months'
      }],
      overallRating: 82,
      potential: 'High'
    };

    it('should pass validation with complete valid data', async () => {
      const dto = plainToClass(CreatePlayerEvaluationDto, validCreateData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with minimal required data', async () => {
      const minimalData = {
        playerId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        teamId: '550e8400-e29b-41d4-a716-446655440002',
        evaluationDate: '2024-09-15',
        type: 'practice',
        technicalSkills: validCreateData.technicalSkills,
        tacticalSkills: validCreateData.tacticalSkills,
        physicalAttributes: validCreateData.physicalAttributes,
        mentalAttributes: validCreateData.mentalAttributes,
        developmentPriorities: validCreateData.developmentPriorities
      };
      const dto = plainToClass(CreatePlayerEvaluationDto, minimalData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation without required playerId', async () => {
      const { playerId, ...dataWithoutPlayerId } = validCreateData;
      const dto = plainToClass(CreatePlayerEvaluationDto, dataWithoutPlayerId);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'playerId')).toBe(true);
    });

    it('should fail validation with invalid evaluation type', async () => {
      const dto = plainToClass(CreatePlayerEvaluationDto, {
        ...validCreateData,
        type: 'invalid_type'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('type');
    });

    it('should fail validation with invalid UUID format', async () => {
      const dto = plainToClass(CreatePlayerEvaluationDto, {
        ...validCreateData,
        playerId: 'invalid-uuid'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('playerId');
    });

    it('should fail validation with overall rating below minimum', async () => {
      const dto = plainToClass(CreatePlayerEvaluationDto, {
        ...validCreateData,
        overallRating: 0
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('overallRating');
    });

    it('should fail validation with overall rating above maximum', async () => {
      const dto = plainToClass(CreatePlayerEvaluationDto, {
        ...validCreateData,
        overallRating: 101
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('overallRating');
    });

    it('should fail validation with invalid potential', async () => {
      const dto = plainToClass(CreatePlayerEvaluationDto, {
        ...validCreateData,
        potential: 'Invalid'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('potential');
    });

    it('should fail validation with strengths exceeding max length', async () => {
      const dto = plainToClass(CreatePlayerEvaluationDto, {
        ...validCreateData,
        strengths: 'A'.repeat(2001)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('strengths');
    });

    it('should fail validation with areas for improvement exceeding max length', async () => {
      const dto = plainToClass(CreatePlayerEvaluationDto, {
        ...validCreateData,
        areasForImprovement: 'A'.repeat(2001)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('areasForImprovement');
    });

    it('should fail validation with coach comments exceeding max length', async () => {
      const dto = plainToClass(CreatePlayerEvaluationDto, {
        ...validCreateData,
        coachComments: 'A'.repeat(3001)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('coachComments');
    });

    it('should validate nested technical skills correctly', async () => {
      const invalidTechnicalData = {
        ...validCreateData,
        technicalSkills: {
          ...validCreateData.technicalSkills,
          skating: {
            ...validCreateData.technicalSkills.skating,
            forward: 0 // invalid
          }
        }
      };
      const dto = plainToClass(CreatePlayerEvaluationDto, invalidTechnicalData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate nested game notes correctly', async () => {
      const invalidGameNotesData = {
        ...validCreateData,
        gameSpecificNotes: {
          ...validCreateData.gameSpecificNotes,
          gamesObserved: -1 // invalid
        }
      };
      const dto = plainToClass(CreatePlayerEvaluationDto, invalidGameNotesData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation with empty development priorities', async () => {
      const dto = plainToClass(CreatePlayerEvaluationDto, {
        ...validCreateData,
        developmentPriorities: []
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('developmentPriorities');
    });

    it('should validate development priorities correctly', async () => {
      const invalidPrioritiesData = {
        ...validCreateData,
        developmentPriorities: [{
          priority: 0, // invalid
          skill: 'Test',
          targetImprovement: 'Test',
          timeline: 'Test'
        }]
      };
      const dto = plainToClass(CreatePlayerEvaluationDto, invalidPrioritiesData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate all evaluation types correctly', async () => {
      const types = ['preseason', 'midseason', 'postseason', 'monthly', 'game', 'practice'];
      
      for (const type of types) {
        const dto = plainToClass(CreatePlayerEvaluationDto, {
          ...validCreateData,
          type
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should validate all potential levels correctly', async () => {
      const potentials = ['Elite', 'High', 'Average', 'Depth'];
      
      for (const potential of potentials) {
        const dto = plainToClass(CreatePlayerEvaluationDto, {
          ...validCreateData,
          potential
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe('UpdatePlayerEvaluationDto', () => {
    const validUpdateData = {
      evaluationDate: '2024-09-16',
      type: 'game',
      strengths: 'Updated strengths assessment',
      areasForImprovement: 'Updated areas for improvement',
      overallRating: 85,
      potential: 'Elite'
    };

    it('should pass validation with valid update data', async () => {
      const dto = plainToClass(UpdatePlayerEvaluationDto, validUpdateData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty object (all optional)', async () => {
      const dto = plainToClass(UpdatePlayerEvaluationDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid type', async () => {
      const dto = plainToClass(UpdatePlayerEvaluationDto, {
        type: 'invalid_type'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('type');
    });

    it('should fail validation with overall rating out of range', async () => {
      const dto = plainToClass(UpdatePlayerEvaluationDto, {
        overallRating: 150
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('overallRating');
    });

    it('should validate nested skills updates correctly', async () => {
      const updateWithNestedData = {
        technicalSkills: {
          skating: { forward: 9, backward: 8, acceleration: 10, agility: 9, speed: 10, balance: 8, edgeWork: 9 },
          puckHandling: { carrying: 8, protection: 9, deking: 7, receiving: 9, inTraffic: 8 },
          shooting: { wristShot: 9, slapShot: 7, snapshot: 8, backhand: 6, accuracy: 9, release: 8, power: 10 },
          passing: { forehand: 9, backhand: 7, saucer: 8, accuracy: 9, timing: 10, vision: 9 }
        }
      };
      const dto = plainToClass(UpdatePlayerEvaluationDto, updateWithNestedData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Complex Nested Validation', () => {
    it('should validate complete evaluation with all nested structures', async () => {
      const complexEvaluation = {
        playerId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        teamId: '550e8400-e29b-41d4-a716-446655440002',
        evaluationDate: '2024-09-15T10:00:00Z',
        type: 'preseason',
        technicalSkills: {
          skating: { forward: 9, backward: 8, acceleration: 10, agility: 9, speed: 10, balance: 8, edgeWork: 9 },
          puckHandling: { carrying: 8, protection: 9, deking: 7, receiving: 9, inTraffic: 8 },
          shooting: { wristShot: 9, slapShot: 7, snapshot: 8, backhand: 6, accuracy: 9, release: 8, power: 10 },
          passing: { forehand: 9, backhand: 7, saucer: 8, accuracy: 9, timing: 10, vision: 9 }
        },
        tacticalSkills: {
          offensive: { positioning: 9, spacing: 8, timing: 9, creativity: 7, finishing: 10 },
          defensive: { positioning: 9, gapControl: 8, stickPosition: 9, bodyPosition: 8, anticipation: 10 },
          transition: { breakouts: 9, rushes: 8, tracking: 9, backchecking: 8 }
        },
        physicalAttributes: { strength: 9, speed: 10, endurance: 8, flexibility: 7, balance: 9, coordination: 8 },
        mentalAttributes: {
          hockeyIQ: 10, competitiveness: 9, workEthic: 10, coachability: 9, leadership: 7,
          teamwork: 9, discipline: 8, confidence: 9, focusUnderPressure: 8
        },
        gameSpecificNotes: {
          gamesObserved: 10, goals: 5, assists: 8, plusMinus: 3, penaltyMinutes: 4,
          keyMoments: [
            'Hat trick in game against rival team',
            'Clutch goal in overtime',
            'Strong leadership in third period comeback'
          ]
        },
        developmentPriorities: [
          { priority: 1, skill: 'Shot accuracy', targetImprovement: 'Increase by 15%', timeline: '2 months' },
          { priority: 2, skill: 'Face-off percentage', targetImprovement: 'Reach 60%', timeline: '4 months' },
          { priority: 3, skill: 'Penalty kill positioning', targetImprovement: 'Improve consistency', timeline: '3 months' }
        ],
        strengths: 'Elite hockey IQ, exceptional work ethic, natural leadership qualities',
        areasForImprovement: 'Shot accuracy needs work, face-off skills could be better',
        coachComments: 'Outstanding potential, shows maturity beyond years, ready for next level',
        overallRating: 88,
        potential: 'Elite'
      };

      const dto = plainToClass(CreatePlayerEvaluationDto, complexEvaluation);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with multiple nested errors', async () => {
      const invalidComplexEvaluation = {
        playerId: 'invalid-uuid',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        teamId: '550e8400-e29b-41d4-a716-446655440002',
        evaluationDate: 'invalid-date',
        type: 'invalid_type',
        technicalSkills: {
          skating: { forward: 0, backward: 8, acceleration: 15, agility: 9, speed: 10, balance: 8, edgeWork: 9 },
          puckHandling: { carrying: -1, protection: 9, deking: 7, receiving: 9, inTraffic: 8 },
          shooting: { wristShot: 9, slapShot: 12, snapshot: 8, backhand: 6, accuracy: 9, release: 8, power: 10 },
          passing: { forehand: 9, backhand: 7, saucer: 8, accuracy: 9, timing: 10, vision: 9 }
        },
        tacticalSkills: {
          offensive: { positioning: 9, spacing: 8, timing: 9, creativity: 7, finishing: 10 },
          defensive: { positioning: 9, gapControl: 8, stickPosition: 9, bodyPosition: 8, anticipation: 10 },
          transition: { breakouts: 9, rushes: 8, tracking: 9, backchecking: 8 }
        },
        physicalAttributes: { strength: 9, speed: 10, endurance: 8, flexibility: 7, balance: 9, coordination: 8 },
        mentalAttributes: {
          hockeyIQ: 10, competitiveness: 9, workEthic: 10, coachability: 9, leadership: 7,
          teamwork: 9, discipline: 8, confidence: 9, focusUnderPressure: 8
        },
        developmentPriorities: [{
          priority: 0, // invalid
          skill: 'A'.repeat(300), // too long
          targetImprovement: 'Test',
          timeline: 'Test'
        }],
        overallRating: 150, // invalid
        potential: 'Invalid' // invalid
      };

      const dto = plainToClass(CreatePlayerEvaluationDto, invalidComplexEvaluation);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(5); // Multiple validation errors
    });
  });

  describe('Boundary Value Testing', () => {
    it('should handle minimum boundary values correctly', async () => {
      const minBoundaryEvaluation = {
        playerId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        teamId: '550e8400-e29b-41d4-a716-446655440002',
        evaluationDate: '2024-01-01',
        type: 'practice',
        technicalSkills: {
          skating: { forward: 1, backward: 1, acceleration: 1, agility: 1, speed: 1, balance: 1, edgeWork: 1 },
          puckHandling: { carrying: 1, protection: 1, deking: 1, receiving: 1, inTraffic: 1 },
          shooting: { wristShot: 1, slapShot: 1, snapshot: 1, backhand: 1, accuracy: 1, release: 1, power: 1 },
          passing: { forehand: 1, backhand: 1, saucer: 1, accuracy: 1, timing: 1, vision: 1 }
        },
        tacticalSkills: {
          offensive: { positioning: 1, spacing: 1, timing: 1, creativity: 1, finishing: 1 },
          defensive: { positioning: 1, gapControl: 1, stickPosition: 1, bodyPosition: 1, anticipation: 1 },
          transition: { breakouts: 1, rushes: 1, tracking: 1, backchecking: 1 }
        },
        physicalAttributes: { strength: 1, speed: 1, endurance: 1, flexibility: 1, balance: 1, coordination: 1 },
        mentalAttributes: {
          hockeyIQ: 1, competitiveness: 1, workEthic: 1, coachability: 1, leadership: 1,
          teamwork: 1, discipline: 1, confidence: 1, focusUnderPressure: 1
        },
        developmentPriorities: [{
          priority: 1, // minimum
          skill: 'A',
          targetImprovement: 'B',
          timeline: 'C'
        }],
        overallRating: 1 // minimum
      };

      const dto = plainToClass(CreatePlayerEvaluationDto, minBoundaryEvaluation);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle maximum boundary values correctly', async () => {
      const maxBoundaryEvaluation = {
        playerId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        teamId: '550e8400-e29b-41d4-a716-446655440002',
        evaluationDate: '2024-12-31',
        type: 'postseason',
        technicalSkills: {
          skating: { forward: 10, backward: 10, acceleration: 10, agility: 10, speed: 10, balance: 10, edgeWork: 10 },
          puckHandling: { carrying: 10, protection: 10, deking: 10, receiving: 10, inTraffic: 10 },
          shooting: { wristShot: 10, slapShot: 10, snapshot: 10, backhand: 10, accuracy: 10, release: 10, power: 10 },
          passing: { forehand: 10, backhand: 10, saucer: 10, accuracy: 10, timing: 10, vision: 10 }
        },
        tacticalSkills: {
          offensive: { positioning: 10, spacing: 10, timing: 10, creativity: 10, finishing: 10 },
          defensive: { positioning: 10, gapControl: 10, stickPosition: 10, bodyPosition: 10, anticipation: 10 },
          transition: { breakouts: 10, rushes: 10, tracking: 10, backchecking: 10 }
        },
        physicalAttributes: { strength: 10, speed: 10, endurance: 10, flexibility: 10, balance: 10, coordination: 10 },
        mentalAttributes: {
          hockeyIQ: 10, competitiveness: 10, workEthic: 10, coachability: 10, leadership: 10,
          teamwork: 10, discipline: 10, confidence: 10, focusUnderPressure: 10
        },
        developmentPriorities: [{
          priority: 5, // maximum
          skill: 'A'.repeat(255), // maximum
          targetImprovement: 'B'.repeat(1000), // maximum
          timeline: 'C'.repeat(100) // maximum
        }],
        strengths: 'A'.repeat(2000), // maximum
        areasForImprovement: 'B'.repeat(2000), // maximum
        coachComments: 'C'.repeat(3000), // maximum
        overallRating: 100 // maximum
      };

      const dto = plainToClass(CreatePlayerEvaluationDto, maxBoundaryEvaluation);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});