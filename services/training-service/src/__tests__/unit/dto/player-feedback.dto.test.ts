import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  CreatePlayerFeedbackDto
} from '../../../dto/coach/player-feedback.dto';

describe('Player Feedback DTOs', () => {
  describe('CreatePlayerFeedbackDto', () => {
    const validFeedbackData = {
      playerId: '550e8400-e29b-41d4-a716-446655440000',
      coachId: '550e8400-e29b-41d4-a716-446655440001',
      type: 'game',
      relatedEventId: '550e8400-e29b-41d4-a716-446655440002',
      tone: 'positive',
      message: 'Outstanding performance tonight! Your positioning in the defensive zone was excellent, and the way you read the play on the power play goal was exceptional. Keep up this level of focus and you will continue to improve.',
      actionItems: [
        'Continue working on backhand shots in practice',
        'Review video of defensive positioning from tonight',
        'Practice face-off techniques with assistant coach'
      ]
    };

    it('should pass validation with valid complete data', async () => {
      const dto = plainToClass(CreatePlayerFeedbackDto, validFeedbackData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with minimal required data', async () => {
      const minimalData = {
        playerId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        type: 'practice',
        tone: 'constructive',
        message: 'Good effort today. Focus on improving your first pass out of the zone.'
      };
      const dto = plainToClass(CreatePlayerFeedbackDto, minimalData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation without required playerId', async () => {
      const { playerId, ...dataWithoutPlayerId } = validFeedbackData;
      const dto = plainToClass(CreatePlayerFeedbackDto, dataWithoutPlayerId);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'playerId')).toBe(true);
    });

    it('should fail validation without required coachId', async () => {
      const { coachId, ...dataWithoutCoachId } = validFeedbackData;
      const dto = plainToClass(CreatePlayerFeedbackDto, dataWithoutCoachId);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'coachId')).toBe(true);
    });

    it('should fail validation without required message', async () => {
      const { message, ...dataWithoutMessage } = validFeedbackData;
      const dto = plainToClass(CreatePlayerFeedbackDto, dataWithoutMessage);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'message')).toBe(true);
    });

    it('should fail validation with invalid playerId UUID', async () => {
      const dto = plainToClass(CreatePlayerFeedbackDto, {
        ...validFeedbackData,
        playerId: 'invalid-uuid'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('playerId');
    });

    it('should fail validation with invalid coachId UUID', async () => {
      const dto = plainToClass(CreatePlayerFeedbackDto, {
        ...validFeedbackData,
        coachId: 'not-a-valid-uuid'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('coachId');
    });

    it('should fail validation with invalid type', async () => {
      const dto = plainToClass(CreatePlayerFeedbackDto, {
        ...validFeedbackData,
        type: 'invalid_type'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('type');
    });

    it('should fail validation with invalid tone', async () => {
      const dto = plainToClass(CreatePlayerFeedbackDto, {
        ...validFeedbackData,
        tone: 'invalid_tone'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('tone');
    });

    it('should fail validation with message exceeding max length', async () => {
      const dto = plainToClass(CreatePlayerFeedbackDto, {
        ...validFeedbackData,
        message: 'A'.repeat(3001)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('message');
    });

    it('should fail validation with action item exceeding max length', async () => {
      const dto = plainToClass(CreatePlayerFeedbackDto, {
        ...validFeedbackData,
        actionItems: ['A'.repeat(201)]
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should pass validation without optional relatedEventId', async () => {
      const { relatedEventId, ...dataWithoutEventId } = validFeedbackData;
      const dto = plainToClass(CreatePlayerFeedbackDto, dataWithoutEventId);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation without optional actionItems', async () => {
      const { actionItems, ...dataWithoutActionItems } = validFeedbackData;
      const dto = plainToClass(CreatePlayerFeedbackDto, dataWithoutActionItems);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate all feedback types correctly', async () => {
      const types = ['game', 'practice', 'general', 'behavioral', 'tactical'];
      
      for (const type of types) {
        const dto = plainToClass(CreatePlayerFeedbackDto, {
          ...validFeedbackData,
          type
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should validate all feedback tones correctly', async () => {
      const tones = ['positive', 'constructive', 'critical', 'mixed'];
      
      for (const tone of tones) {
        const dto = plainToClass(CreatePlayerFeedbackDto, {
          ...validFeedbackData,
          tone
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should handle empty action items array', async () => {
      const dto = plainToClass(CreatePlayerFeedbackDto, {
        ...validFeedbackData,
        actionItems: []
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle maximum length message', async () => {
      const dto = plainToClass(CreatePlayerFeedbackDto, {
        ...validFeedbackData,
        message: 'M'.repeat(3000) // Maximum allowed length
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle maximum length action items', async () => {
      const dto = plainToClass(CreatePlayerFeedbackDto, {
        ...validFeedbackData,
        actionItems: [
          'A'.repeat(200), // Maximum allowed length
          'B'.repeat(200),
          'C'.repeat(200)
        ]
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate multiple action items correctly', async () => {
      const dto = plainToClass(CreatePlayerFeedbackDto, {
        ...validFeedbackData,
        actionItems: [
          'Work on shot accuracy during practice',
          'Review defensive positioning video',
          'Practice face-offs with skills coach',
          'Improve communication on ice',
          'Focus on first pass out of zone'
        ]
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid relatedEventId UUID', async () => {
      const dto = plainToClass(CreatePlayerFeedbackDto, {
        ...validFeedbackData,
        relatedEventId: 'invalid-uuid-format'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('relatedEventId');
    });
  });

  describe('Real-world Feedback Scenarios', () => {
    it('should validate positive game feedback', async () => {
      const positiveFeedback = {
        playerId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        type: 'game',
        relatedEventId: '550e8400-e29b-41d4-a716-446655440002',
        tone: 'positive',
        message: 'Excellent game tonight! Your two goals were perfectly placed and your defensive play was outstanding. The way you supported your teammates and communicated on the ice showed real leadership. Your work ethic and positive attitude are contagious.',
        actionItems: [
          'Keep up the great shooting accuracy',
          'Continue being vocal on ice',
          'Maintain this level of defensive commitment'
        ]
      };

      const dto = plainToClass(CreatePlayerFeedbackDto, positiveFeedback);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate constructive practice feedback', async () => {
      const constructiveFeedback = {
        playerId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        type: 'practice',
        tone: 'constructive',
        message: 'Good effort in practice today. I noticed you are improving your skating speed and your passes were more accurate. However, there are a few areas where we can continue to work together to help you reach your potential.',
        actionItems: [
          'Practice backhand shots for 15 minutes after each practice',
          'Work on defensive positioning in front of net',
          'Review video of NHL players in similar position'
        ]
      };

      const dto = plainToClass(CreatePlayerFeedbackDto, constructiveFeedback);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate critical behavioral feedback', async () => {
      const criticalFeedback = {
        playerId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        type: 'behavioral',
        tone: 'critical',
        message: 'We need to discuss your attitude during practice yesterday. The disrespectful behavior toward teammates and the lack of effort during drills is not acceptable. As a member of this team, I expect better from you.',
        actionItems: [
          'Apologize to teammates affected by yesterday\'s behavior',
          'Meet with team captain to discuss leadership expectations',
          'Attend mandatory team building session'
        ]
      };

      const dto = plainToClass(CreatePlayerFeedbackDto, criticalFeedback);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate mixed tactical feedback', async () => {
      const mixedFeedback = {
        playerId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        type: 'tactical',
        tone: 'mixed',
        message: 'Your understanding of our power play system has improved significantly - great job reading the defense and finding open space. However, your defensive zone coverage needs work, particularly when the puck is in the corners.',
        actionItems: [
          'Continue current power play preparation routine',
          'Practice defensive zone positioning drills',
          'Study video of defensive zone coverage mistakes'
        ]
      };

      const dto = plainToClass(CreatePlayerFeedbackDto, mixedFeedback);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate general feedback without specific event', async () => {
      const generalFeedback = {
        playerId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        type: 'general',
        tone: 'positive',
        message: 'I wanted to take a moment to recognize the improvement you have shown over the past month. Your dedication to training and your positive attitude are making a real difference in your game and in the team dynamics.',
        actionItems: [
          'Keep up current training regiment',
          'Consider taking on more leadership responsibilities',
          'Share your work ethic tips with younger players'
        ]
      };

      const dto = plainToClass(CreatePlayerFeedbackDto, generalFeedback);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Boundary Value Testing', () => {
    it('should handle minimum length message', async () => {
      const dto = plainToClass(CreatePlayerFeedbackDto, {
        playerId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        type: 'general',
        tone: 'positive',
        message: 'A' // Minimum length message (1 character)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle single character action item', async () => {
      const dto = plainToClass(CreatePlayerFeedbackDto, {
        playerId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        type: 'practice',
        tone: 'constructive',
        message: 'Practice feedback',
        actionItems: ['A'] // Single character action item
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with message just exceeding maximum', async () => {
      const dto = plainToClass(CreatePlayerFeedbackDto, {
        playerId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        type: 'game',
        tone: 'positive',
        message: 'M'.repeat(3001) // Just over maximum
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('message');
    });

    it('should fail with action item just exceeding maximum', async () => {
      const dto = plainToClass(CreatePlayerFeedbackDto, {
        playerId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        type: 'practice',
        tone: 'constructive',
        message: 'Practice feedback',
        actionItems: ['A'.repeat(201)] // Just over maximum
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    it('should handle large number of action items', async () => {
      const dto = plainToClass(CreatePlayerFeedbackDto, {
        playerId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        type: 'general',
        tone: 'constructive',
        message: 'Comprehensive feedback with many action items',
        actionItems: Array(50).fill('Practice specific skill').map((item, index) => `${item} ${index + 1}`)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle feedback with special characters in message', async () => {
      const dto = plainToClass(CreatePlayerFeedbackDto, {
        playerId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        type: 'game',
        tone: 'positive',
        message: 'Great job! Your improvement is 100% - you\'ve "really stepped up" your game. Keep it up! 🏒⭐',
        actionItems: [
          'Continue working on your shot (it\'s getting better!)',
          'Practice makes perfect - keep it up 💪',
          'Review game tape @ 15:30 mark'
        ]
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle multiline message formatting', async () => {
      const dto = plainToClass(CreatePlayerFeedbackDto, {
        playerId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        type: 'tactical',
        tone: 'mixed',
        message: `Game Analysis Summary:

Positives:
- Excellent puck handling
- Good positioning in offensive zone
- Strong communication with teammates

Areas for Improvement:
- Defensive zone coverage
- Faceoff percentage
- Shot selection

Overall: Solid performance with room for growth.`,
        actionItems: [
          'Focus on defensive positioning drills',
          'Work with faceoff specialist coach',
          'Practice shot selection in game-like situations'
        ]
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with multiple validation errors', async () => {
      const invalidData = {
        playerId: 'invalid-uuid',          // Invalid UUID
        coachId: 'also-invalid',           // Invalid UUID
        type: 'invalid_type',              // Invalid enum
        relatedEventId: 'bad-uuid',        // Invalid UUID
        tone: 'wrong_tone',                // Invalid enum
        message: 'M'.repeat(3001),         // Too long
        actionItems: ['A'.repeat(201)]     // Action item too long
      };

      const dto = plainToClass(CreatePlayerFeedbackDto, invalidData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(5); // Multiple validation failures
    });

    it('should handle feedback with no action items but valid structure', async () => {
      const dto = plainToClass(CreatePlayerFeedbackDto, {
        playerId: '550e8400-e29b-41d4-a716-446655440000',
        coachId: '550e8400-e29b-41d4-a716-446655440001',
        type: 'general',
        tone: 'positive',
        message: 'Just wanted to say great job this week. Keep up the excellent work!',
        actionItems: [] // Explicitly empty array
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});