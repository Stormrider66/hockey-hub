import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  CreateGameStrategyDto,
  UpdateGameStrategyDto,
  GameStrategyFilterDto,
  AddPeriodAdjustmentDto,
  AddPlayerPerformanceDto,
  LineComboDto,
  MatchupDto,
  SpecialInstructionDto,
  KeyPlayerDto,
  GoalieTendenciesDto,
  OpponentScoutingDto,
  LineupsDto,
  PeriodAdjustmentDto,
  GoalAnalysisDto,
  PlayerPerformanceDto,
  PostGameAnalysisDto
} from '../../../dto/coach/game-strategy.dto';

describe('Game Strategy DTOs', () => {
  describe('LineComboDto', () => {
    const validLineCombo = {
      name: 'First Line',
      forwards: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'],
      defense: ['550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004'],
      goalie: '550e8400-e29b-41d4-a716-446655440005',
      chemistry: 85,
      minutesPlayed: 15.5,
      plusMinus: 2
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(LineComboDto, validLineCombo);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with chemistry below minimum', async () => {
      const dto = plainToClass(LineComboDto, {
        ...validLineCombo,
        chemistry: -1
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('chemistry');
    });

    it('should fail validation with chemistry above maximum', async () => {
      const dto = plainToClass(LineComboDto, {
        ...validLineCombo,
        chemistry: 101
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('chemistry');
    });

    it('should fail validation with negative minutes played', async () => {
      const dto = plainToClass(LineComboDto, {
        ...validLineCombo,
        minutesPlayed: -5
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('minutesPlayed');
    });

    it('should fail validation with invalid forward UUIDs', async () => {
      const dto = plainToClass(LineComboDto, {
        ...validLineCombo,
        forwards: ['invalid-uuid']
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should pass validation without optional fields', async () => {
      const { goalie, minutesPlayed, plusMinus, ...comboWithoutOptional } = validLineCombo;
      const dto = plainToClass(LineComboDto, comboWithoutOptional);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('MatchupDto', () => {
    const validMatchup = {
      ourLine: 'Top Line',
      opposingLine: 'Their First Line',
      strategy: 'Play physical and control the puck'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(MatchupDto, validMatchup);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with strategy exceeding max length', async () => {
      const dto = plainToClass(MatchupDto, {
        ...validMatchup,
        strategy: 'A'.repeat(501)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('strategy');
    });

    it('should fail validation without required fields', async () => {
      const { ourLine, ...matchupWithoutOurLine } = validMatchup;
      const dto = plainToClass(MatchupDto, matchupWithoutOurLine);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'ourLine')).toBe(true);
    });
  });

  describe('SpecialInstructionDto', () => {
    const validSpecialInstruction = {
      playerId: '550e8400-e29b-41d4-a716-446655440000',
      instructions: ['Be aggressive on forecheck', 'Support the defenseman']
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(SpecialInstructionDto, validSpecialInstruction);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty instructions array', async () => {
      const dto = plainToClass(SpecialInstructionDto, {
        ...validSpecialInstruction,
        instructions: []
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('instructions');
    });

    it('should fail validation with invalid playerId', async () => {
      const dto = plainToClass(SpecialInstructionDto, {
        ...validSpecialInstruction,
        playerId: 'invalid-uuid'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('playerId');
    });
  });

  describe('KeyPlayerDto', () => {
    const validKeyPlayer = {
      playerId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Connor McDavid',
      tendencies: ['Speed through neutral zone', 'Right-handed shot'],
      howToDefend: 'Close gap quickly, force to backhand'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(KeyPlayerDto, validKeyPlayer);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with name exceeding max length', async () => {
      const dto = plainToClass(KeyPlayerDto, {
        ...validKeyPlayer,
        name: 'A'.repeat(256)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
    });

    it('should fail validation with howToDefend exceeding max length', async () => {
      const dto = plainToClass(KeyPlayerDto, {
        ...validKeyPlayer,
        howToDefend: 'A'.repeat(501)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('howToDefend');
    });

    it('should fail validation with empty tendencies array', async () => {
      const dto = plainToClass(KeyPlayerDto, {
        ...validKeyPlayer,
        tendencies: []
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('tendencies');
    });
  });

  describe('GoalieTendenciesDto', () => {
    const validGoalieTendencies = {
      gloveHigh: 75,
      gloveLow: 60,
      blockerHigh: 80,
      blockerLow: 70,
      fiveHole: 50,
      wraparound: 85
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(GoalieTendenciesDto, validGoalieTendencies);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with values below minimum', async () => {
      const dto = plainToClass(GoalieTendenciesDto, {
        ...validGoalieTendencies,
        gloveHigh: -5
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('gloveHigh');
    });

    it('should fail validation with values above maximum', async () => {
      const dto = plainToClass(GoalieTendenciesDto, {
        ...validGoalieTendencies,
        fiveHole: 105
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('fiveHole');
    });

    it('should handle boundary values correctly', async () => {
      const boundaryGoalie = {
        gloveHigh: 0,   // minimum
        gloveLow: 100,  // maximum
        blockerHigh: 50,
        blockerLow: 50,
        fiveHole: 50,
        wraparound: 50
      };
      const dto = plainToClass(GoalieTendenciesDto, boundaryGoalie);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('OpponentScoutingDto', () => {
    const validOpponentScouting = {
      strengths: ['Fast transition', 'Strong power play'],
      weaknesses: ['Weak on faceoffs', 'Prone to penalties'],
      keyPlayers: [{
        playerId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Star Player',
        tendencies: ['Shoots a lot'],
        howToDefend: 'Stay close'
      }],
      goalieTendencies: {
        gloveHigh: 75,
        gloveLow: 60,
        blockerHigh: 80,
        blockerLow: 70,
        fiveHole: 50,
        wraparound: 85
      }
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(OpponentScoutingDto, validOpponentScouting);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation without optional goalieTendencies', async () => {
      const { goalieTendencies, ...scoutingWithoutGoalie } = validOpponentScouting;
      const dto = plainToClass(OpponentScoutingDto, scoutingWithoutGoalie);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty strengths', async () => {
      const dto = plainToClass(OpponentScoutingDto, {
        ...validOpponentScouting,
        strengths: []
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('strengths');
    });

    it('should validate nested key players correctly', async () => {
      const invalidKeyPlayersData = {
        ...validOpponentScouting,
        keyPlayers: [{
          playerId: 'invalid-uuid',
          name: 'Player',
          tendencies: ['Tendency'],
          howToDefend: 'Defense'
        }]
      };
      const dto = plainToClass(OpponentScoutingDto, invalidKeyPlayersData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('GoalAnalysisDto', () => {
    const validGoalAnalysis = {
      time: '12:34',
      period: 2,
      scoredBy: 'Connor McDavid',
      assists: ['Leon Draisaitl', 'Ryan Nugent-Hopkins'],
      situation: 'Even strength',
      description: 'Wrist shot from the slot',
      preventable: false,
      notes: 'Great individual effort'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(GoalAnalysisDto, validGoalAnalysis);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with period below minimum', async () => {
      const dto = plainToClass(GoalAnalysisDto, {
        ...validGoalAnalysis,
        period: 0
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('period');
    });

    it('should fail validation with period above maximum', async () => {
      const dto = plainToClass(GoalAnalysisDto, {
        ...validGoalAnalysis,
        period: 5
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('period');
    });

    it('should fail validation with description exceeding max length', async () => {
      const dto = plainToClass(GoalAnalysisDto, {
        ...validGoalAnalysis,
        description: 'A'.repeat(1001)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
    });

    it('should pass validation without optional notes', async () => {
      const { notes, ...goalWithoutNotes } = validGoalAnalysis;
      const dto = plainToClass(GoalAnalysisDto, goalWithoutNotes);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('PlayerPerformanceDto', () => {
    const validPlayerPerformance = {
      playerId: '550e8400-e29b-41d4-a716-446655440000',
      rating: 8,
      notes: 'Excellent game, strong on both ends'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(PlayerPerformanceDto, validPlayerPerformance);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with rating below minimum', async () => {
      const dto = plainToClass(PlayerPerformanceDto, {
        ...validPlayerPerformance,
        rating: 0
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('rating');
    });

    it('should fail validation with rating above maximum', async () => {
      const dto = plainToClass(PlayerPerformanceDto, {
        ...validPlayerPerformance,
        rating: 11
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('rating');
    });

    it('should fail validation with notes exceeding max length', async () => {
      const dto = plainToClass(PlayerPerformanceDto, {
        ...validPlayerPerformance,
        notes: 'A'.repeat(1001)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('notes');
    });
  });

  describe('PeriodAdjustmentDto', () => {
    const validPeriodAdjustment = {
      period: 2,
      adjustments: ['Switch to 1-3-1 forecheck', 'More aggressive on PK'],
      lineChanges: { line1: 'increase_minutes' }
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(PeriodAdjustmentDto, validPeriodAdjustment);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with overtime period', async () => {
      const dto = plainToClass(PeriodAdjustmentDto, {
        ...validPeriodAdjustment,
        period: 'OT'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid period', async () => {
      const dto = plainToClass(PeriodAdjustmentDto, {
        ...validPeriodAdjustment,
        period: 5
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('period');
    });

    it('should fail validation with empty adjustments', async () => {
      const dto = plainToClass(PeriodAdjustmentDto, {
        ...validPeriodAdjustment,
        adjustments: []
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('adjustments');
    });
  });

  describe('CreateGameStrategyDto', () => {
    const validCreateData = {
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
      coachId: '550e8400-e29b-41d4-a716-446655440001',
      teamId: '550e8400-e29b-41d4-a716-446655440002',
      gameId: '550e8400-e29b-41d4-a716-446655440003',
      opponentTeamId: '550e8400-e29b-41d4-a716-446655440004',
      opponentTeamName: 'Calgary Flames',
      lineups: {
        even_strength: [{
          name: 'Line 1',
          forwards: ['550e8400-e29b-41d4-a716-446655440005'],
          defense: ['550e8400-e29b-41d4-a716-446655440006'],
          chemistry: 85
        }],
        powerplay: [],
        penalty_kill: []
      },
      matchups: [{
        ourLine: 'Top Line',
        opposingLine: 'Their First',
        strategy: 'Aggressive forecheck'
      }],
      specialInstructions: [{
        playerId: '550e8400-e29b-41d4-a716-446655440007',
        instructions: ['Be physical']
      }],
      opponentScouting: {
        strengths: ['Fast team'],
        weaknesses: ['Weak defense'],
        keyPlayers: [{
          playerId: '550e8400-e29b-41d4-a716-446655440008',
          name: 'Star Forward',
          tendencies: ['Shoots often'],
          howToDefend: 'Stay close'
        }]
      },
      preGameSpeech: 'Go out there and give 100%',
      gameCompleted: false,
      tags: ['regular_season', 'divisional'],
      metadata: { arena: 'home' }
    };

    it('should pass validation with complete valid data', async () => {
      const dto = plainToClass(CreateGameStrategyDto, validCreateData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with minimal required data', async () => {
      const minimalData = {
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        teamId: '550e8400-e29b-41d4-a716-446655440002',
        gameId: '550e8400-e29b-41d4-a716-446655440003',
        opponentTeamId: '550e8400-e29b-41d4-a716-446655440004',
        opponentTeamName: 'Test Team',
        lineups: {
          even_strength: [],
          powerplay: [],
          penalty_kill: []
        }
      };
      const dto = plainToClass(CreateGameStrategyDto, minimalData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation without required organizationId', async () => {
      const { organizationId, ...dataWithoutOrgId } = validCreateData;
      const dto = plainToClass(CreateGameStrategyDto, dataWithoutOrgId);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'organizationId')).toBe(true);
    });

    it('should fail validation with invalid UUID format', async () => {
      const dto = plainToClass(CreateGameStrategyDto, {
        ...validCreateData,
        gameId: 'invalid-uuid'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('gameId');
    });

    it('should fail validation with opponent name exceeding max length', async () => {
      const dto = plainToClass(CreateGameStrategyDto, {
        ...validCreateData,
        opponentTeamName: 'A'.repeat(256)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('opponentTeamName');
    });

    it('should fail validation with pre-game speech exceeding max length', async () => {
      const dto = plainToClass(CreateGameStrategyDto, {
        ...validCreateData,
        preGameSpeech: 'A'.repeat(2001)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('preGameSpeech');
    });

    it('should validate nested lineups correctly', async () => {
      const invalidLineupsData = {
        ...validCreateData,
        lineups: {
          even_strength: [{
            name: 'Line 1',
            forwards: ['invalid-uuid'],
            defense: ['550e8400-e29b-41d4-a716-446655440006'],
            chemistry: 85
          }],
          powerplay: [],
          penalty_kill: []
        }
      };
      const dto = plainToClass(CreateGameStrategyDto, invalidLineupsData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateGameStrategyDto', () => {
    const validUpdateData = {
      preGameSpeech: 'Updated game plan',
      gameCompleted: true,
      tags: ['updated']
    };

    it('should pass validation with valid update data', async () => {
      const dto = plainToClass(UpdateGameStrategyDto, validUpdateData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty object (all optional)', async () => {
      const dto = plainToClass(UpdateGameStrategyDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with pre-game speech exceeding max length', async () => {
      const dto = plainToClass(UpdateGameStrategyDto, {
        preGameSpeech: 'A'.repeat(2001)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('preGameSpeech');
    });
  });

  describe('GameStrategyFilterDto', () => {
    const validFilterData = {
      teamId: '550e8400-e29b-41d4-a716-446655440000',
      coachId: '550e8400-e29b-41d4-a716-446655440001',
      gameId: '550e8400-e29b-41d4-a716-446655440002',
      opponentTeamId: '550e8400-e29b-41d4-a716-446655440003',
      gameCompleted: true,
      search: 'flames',
      tags: ['playoff', 'home']
    };

    it('should pass validation with valid filter data', async () => {
      const dto = plainToClass(GameStrategyFilterDto, validFilterData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty filter (all optional)', async () => {
      const dto = plainToClass(GameStrategyFilterDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with search exceeding max length', async () => {
      const dto = plainToClass(GameStrategyFilterDto, {
        search: 'A'.repeat(256)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('search');
    });

    it('should fail validation with invalid UUID format', async () => {
      const dto = plainToClass(GameStrategyFilterDto, {
        teamId: 'invalid-uuid'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('teamId');
    });
  });

  describe('AddPeriodAdjustmentDto', () => {
    const validAddAdjustment = {
      gameStrategyId: '550e8400-e29b-41d4-a716-446655440000',
      adjustment: {
        period: 3,
        adjustments: ['More aggressive']
      }
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(AddPeriodAdjustmentDto, validAddAdjustment);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation without required gameStrategyId', async () => {
      const { gameStrategyId, ...dataWithoutId } = validAddAdjustment;
      const dto = plainToClass(AddPeriodAdjustmentDto, dataWithoutId);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'gameStrategyId')).toBe(true);
    });

    it('should validate nested adjustment correctly', async () => {
      const invalidAdjustmentData = {
        ...validAddAdjustment,
        adjustment: {
          period: 5, // invalid period
          adjustments: ['adjustment']
        }
      };
      const dto = plainToClass(AddPeriodAdjustmentDto, invalidAdjustmentData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('AddPlayerPerformanceDto', () => {
    const validAddPerformance = {
      gameStrategyId: '550e8400-e29b-41d4-a716-446655440000',
      performance: {
        playerId: '550e8400-e29b-41d4-a716-446655440001',
        rating: 7,
        notes: 'Good effort tonight'
      }
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(AddPlayerPerformanceDto, validAddPerformance);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation without required gameStrategyId', async () => {
      const { gameStrategyId, ...dataWithoutId } = validAddPerformance;
      const dto = plainToClass(AddPlayerPerformanceDto, dataWithoutId);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'gameStrategyId')).toBe(true);
    });

    it('should validate nested performance correctly', async () => {
      const invalidPerformanceData = {
        ...validAddPerformance,
        performance: {
          playerId: 'invalid-uuid',
          rating: 12, // out of range
          notes: 'Notes'
        }
      };
      const dto = plainToClass(AddPlayerPerformanceDto, invalidPerformanceData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Complex Nested Validation', () => {
    it('should validate complex post-game analysis', async () => {
      const complexPostGameAnalysis = {
        goalsFor: [{
          time: '5:30',
          period: 1,
          scoredBy: 'Player 1',
          assists: ['Player 2'],
          situation: 'Power play',
          description: 'Wrist shot',
          preventable: false
        }],
        goalsAgainst: [{
          time: '10:15',
          period: 2,
          scoredBy: 'Opponent',
          assists: [],
          situation: 'Even strength',
          description: 'Bad turnover',
          preventable: true,
          notes: 'Defensive breakdown'
        }],
        whatWorked: ['Power play looked good'],
        whatDidntWork: ['Too many turnovers'],
        playerPerformance: [{
          playerId: '550e8400-e29b-41d4-a716-446655440000',
          rating: 8,
          notes: 'Strong game'
        }]
      };

      const createData = {
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        teamId: '550e8400-e29b-41d4-a716-446655440002',
        gameId: '550e8400-e29b-41d4-a716-446655440003',
        opponentTeamId: '550e8400-e29b-41d4-a716-446655440004',
        opponentTeamName: 'Test Team',
        lineups: {
          even_strength: [],
          powerplay: [],
          penalty_kill: []
        },
        postGameAnalysis: complexPostGameAnalysis
      };

      const dto = plainToClass(CreateGameStrategyDto, createData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with nested errors in post-game analysis', async () => {
      const invalidPostGameAnalysis = {
        goalsFor: [{
          time: '5:30',
          period: 5, // invalid period
          scoredBy: 'Player 1',
          assists: ['Player 2'],
          situation: 'Power play',
          description: 'Wrist shot',
          preventable: false
        }],
        goalsAgainst: [],
        whatWorked: [],
        whatDidntWork: [],
        playerPerformance: [{
          playerId: 'invalid-uuid',
          rating: 15, // out of range
          notes: 'Notes'
        }]
      };

      const createData = {
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        teamId: '550e8400-e29b-41d4-a716-446655440002',
        gameId: '550e8400-e29b-41d4-a716-446655440003',
        opponentTeamId: '550e8400-e29b-41d4-a716-446655440004',
        opponentTeamName: 'Test Team',
        lineups: {
          even_strength: [],
          powerplay: [],
          penalty_kill: []
        },
        postGameAnalysis: invalidPostGameAnalysis
      };

      const dto = plainToClass(CreateGameStrategyDto, createData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Boundary Value Testing', () => {
    it('should handle boundary values for numeric fields', async () => {
      const boundaryLineCombo = {
        name: 'Boundary Line',
        forwards: ['550e8400-e29b-41d4-a716-446655440000'],
        defense: ['550e8400-e29b-41d4-a716-446655440001'],
        chemistry: 0, // minimum boundary
        minutesPlayed: 0 // minimum boundary
      };
      const dto = plainToClass(LineComboDto, boundaryLineCombo);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle maximum boundary values', async () => {
      const maxBoundaryLineCombo = {
        name: 'Max Line',
        forwards: ['550e8400-e29b-41d4-a716-446655440000'],
        defense: ['550e8400-e29b-41d4-a716-446655440001'],
        chemistry: 100 // maximum boundary
      };
      const dto = plainToClass(LineComboDto, maxBoundaryLineCombo);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});