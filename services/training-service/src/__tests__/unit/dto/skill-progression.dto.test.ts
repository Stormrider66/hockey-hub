import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  SkillMeasurementDto
} from '../../../dto/coach/skill-progression.dto';

describe('Skill Progression DTOs', () => {
  describe('SkillMeasurementDto', () => {
    const validMeasurement = {
      date: '2024-09-15T10:00:00Z',
      value: 85.5,
      unit: 'km/h',
      testConditions: 'Indoor rink, fresh ice',
      evaluatorId: 'eval-123',
      notes: 'Player showed significant improvement in top speed',
      videoReference: 'https://example.com/speed-test-video.mp4'
    };

    it('should pass validation with valid data', async () => {
      const dto = plainToClass(SkillMeasurementDto, validMeasurement);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with minimal required data', async () => {
      const minimalData = {
        date: '2024-09-15',
        value: 75,
        unit: '%',
        evaluatorId: 'eval-456'
      };
      const dto = plainToClass(SkillMeasurementDto, minimalData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid date format', async () => {
      const dto = plainToClass(SkillMeasurementDto, {
        ...validMeasurement,
        date: 'invalid-date'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('date');
    });

    it('should fail validation with unit exceeding max length', async () => {
      const dto = plainToClass(SkillMeasurementDto, {
        ...validMeasurement,
        unit: 'A'.repeat(51)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('unit');
    });

    it('should fail validation with test conditions exceeding max length', async () => {
      const dto = plainToClass(SkillMeasurementDto, {
        ...validMeasurement,
        testConditions: 'A'.repeat(256)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('testConditions');
    });

    it('should fail validation with evaluatorId exceeding max length', async () => {
      const dto = plainToClass(SkillMeasurementDto, {
        ...validMeasurement,
        evaluatorId: 'A'.repeat(51)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('evaluatorId');
    });

    it('should fail validation with notes exceeding max length', async () => {
      const dto = plainToClass(SkillMeasurementDto, {
        ...validMeasurement,
        notes: 'A'.repeat(1001)
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('notes');
    });

    it('should fail validation with invalid video reference URL', async () => {
      const dto = plainToClass(SkillMeasurementDto, {
        ...validMeasurement,
        videoReference: 'not-a-valid-url'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('videoReference');
    });

    it('should fail validation with video reference exceeding max length', async () => {
      const dto = plainToClass(SkillMeasurementDto, {
        ...validMeasurement,
        videoReference: 'https://example.com/' + 'A'.repeat(500) + '.mp4'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('videoReference');
    });

    it('should pass validation without optional fields', async () => {
      const { testConditions, notes, videoReference, ...measurementWithoutOptional } = validMeasurement;
      const dto = plainToClass(SkillMeasurementDto, measurementWithoutOptional);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate different measurement types', async () => {
      const measurements = [
        { ...validMeasurement, value: 45.2, unit: 'km/h' },      // Speed
        { ...validMeasurement, value: 85, unit: '%' },           // Accuracy
        { ...validMeasurement, value: 25, unit: 'reps' },        // Repetitions
        { ...validMeasurement, value: 2.5, unit: 'seconds' },    // Time
        { ...validMeasurement, value: 150, unit: 'kg' }          // Weight
      ];

      for (const measurement of measurements) {
        const dto = plainToClass(SkillMeasurementDto, measurement);
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should handle negative values correctly', async () => {
      const dto = plainToClass(SkillMeasurementDto, {
        ...validMeasurement,
        value: -5.5  // Negative values might be valid for certain metrics
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle decimal values correctly', async () => {
      const dto = plainToClass(SkillMeasurementDto, {
        ...validMeasurement,
        value: 87.234567
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle boundary values for string lengths', async () => {
      const boundaryData = {
        date: '2024-01-01T00:00:00Z',
        value: 0,
        unit: 'A'.repeat(50),        // Maximum length
        testConditions: 'B'.repeat(255), // Maximum length
        evaluatorId: 'C'.repeat(50), // Maximum length
        notes: 'D'.repeat(1000),     // Maximum length
        videoReference: 'https://example.com/' + 'E'.repeat(450) + '.mp4' // Near maximum
      };
      const dto = plainToClass(SkillMeasurementDto, boundaryData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when required fields are missing', async () => {
      const incompleteData = {
        value: 85.5,
        unit: 'km/h'
        // Missing date and evaluatorId
      };
      const dto = plainToClass(SkillMeasurementDto, incompleteData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'date')).toBe(true);
      expect(errors.some(error => error.property === 'evaluatorId')).toBe(true);
    });

    it('should validate various date formats', async () => {
      const dateFormats = [
        '2024-09-15T10:30:00Z',
        '2024-09-15T10:30:00.000Z',
        '2024-09-15',
        '2024-12-31T23:59:59Z'
      ];

      for (const date of dateFormats) {
        const dto = plainToClass(SkillMeasurementDto, {
          ...validMeasurement,
          date
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should handle extreme numeric values', async () => {
      const extremeValues = [
        0,           // Zero
        0.001,       // Very small positive
        -999999,     // Large negative
        999999.999,  // Large positive with decimals
        Number.MAX_SAFE_INTEGER  // Very large number
      ];

      for (const value of extremeValues) {
        const dto = plainToClass(SkillMeasurementDto, {
          ...validMeasurement,
          value
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should validate common hockey measurement units', async () => {
      const commonUnits = [
        'km/h',          // Speed
        'mph',           // Speed (imperial)
        '%',             // Percentage
        'accuracy %',    // Accuracy percentage
        'seconds',       // Time
        'ms',            // Milliseconds
        'reps',          // Repetitions
        'kg',            // Weight (metric)
        'lbs',           // Weight (imperial)
        'cm',            // Distance (metric)
        'inches',        // Distance (imperial)
        'goals',         // Count
        'assists',       // Count
        'shots',         // Count
        'saves',         // Count
        'rating'         // Scale rating
      ];

      for (const unit of commonUnits) {
        const dto = plainToClass(SkillMeasurementDto, {
          ...validMeasurement,
          unit
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe('Complex Skill Measurement Scenarios', () => {
    it('should validate shot accuracy measurement', async () => {
      const shotAccuracyMeasurement = {
        date: '2024-09-15T14:30:00Z',
        value: 78.5,
        unit: 'accuracy %',
        testConditions: '25 shots from slot, regulation net, fresh pucks',
        evaluatorId: 'coach-smith',
        notes: 'Significant improvement from last test (65%). Working on release speed helped accuracy.',
        videoReference: 'https://example.com/shot-accuracy-test-sep-15.mp4'
      };

      const dto = plainToClass(SkillMeasurementDto, shotAccuracyMeasurement);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate skating speed measurement', async () => {
      const speedMeasurement = {
        date: '2024-09-15T09:00:00Z',
        value: 32.8,
        unit: 'km/h',
        testConditions: 'Full rink sprint, timing gates at blue lines',
        evaluatorId: 'trainer-jones',
        notes: 'New personal best! Excellent acceleration off the start.',
        videoReference: 'https://example.com/speed-test-video.mp4'
      };

      const dto = plainToClass(SkillMeasurementDto, speedMeasurement);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate endurance measurement', async () => {
      const enduranceMeasurement = {
        date: '2024-09-15T16:00:00Z',
        value: 4.2,
        unit: 'minutes',
        testConditions: 'Continuous skating at 80% max speed until fatigue',
        evaluatorId: 'fitness-coach',
        notes: 'Endurance has improved by 30 seconds from previous test. Cardiovascular fitness program is working.'
      };

      const dto = plainToClass(SkillMeasurementDto, enduranceMeasurement);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate strength measurement', async () => {
      const strengthMeasurement = {
        date: '2024-09-15T11:00:00Z',
        value: 125,
        unit: 'kg',
        testConditions: '1RM squat, proper form, spotted',
        evaluatorId: 'strength-coach',
        notes: '10kg improvement from start of season. Leg strength directly correlating to improved acceleration on ice.'
      };

      const dto = plainToClass(SkillMeasurementDto, strengthMeasurement);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate agility measurement', async () => {
      const agilityMeasurement = {
        date: '2024-09-15T15:15:00Z',
        value: 8.95,
        unit: 'seconds',
        testConditions: 'Standard agility course with cones, 3 attempts, best time recorded',
        evaluatorId: 'skills-coach',
        notes: 'Improved by 0.3 seconds from last month. Better edge control and tighter turns.',
        videoReference: 'https://example.com/agility-test-best-run.mp4'
      };

      const dto = plainToClass(SkillMeasurementDto, agilityMeasurement);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle measurement with minimal valid URL', async () => {
      const dto = plainToClass(SkillMeasurementDto, {
        date: '2024-01-01',
        value: 1,
        unit: 'x',
        evaluatorId: 'e',
        videoReference: 'https://a.co/v'  // Minimal valid URL
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle measurement with no optional fields', async () => {
      const dto = plainToClass(SkillMeasurementDto, {
        date: '2024-01-01T00:00:00Z',
        value: 42,
        unit: 'test',
        evaluatorId: 'tester-123'
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with multiple validation errors', async () => {
      const invalidData = {
        date: 'not-a-date',                    // Invalid date
        value: 'not-a-number',                // Invalid number (will be caught by TypeScript/transform)
        unit: 'A'.repeat(100),                // Too long
        testConditions: 'B'.repeat(500),      // Too long
        evaluatorId: 'C'.repeat(100),         // Too long
        notes: 'D'.repeat(2000),              // Too long
        videoReference: 'not-a-url'           // Invalid URL
      };

      const dto = plainToClass(SkillMeasurementDto, invalidData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(3); // Multiple validation failures
    });
  });
});