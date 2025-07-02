import request from 'supertest';
import express from 'express';
import { DataSource } from 'typeorm';
import { TestDatabaseFactory, setupTestDatabase } from '@hockey-hub/shared-lib/testing/testDatabaseFactory';
import { createTestToken, createTestUser } from '@hockey-hub/shared-lib/testing/testHelpers';
import { authMiddleware } from '@hockey-hub/shared-lib/middleware/authMiddleware';
import { errorHandler } from '@hockey-hub/shared-lib/middleware/errorHandler';
import { Injury } from '../../entities/Injury';
import { MedicalReport } from '../../entities/MedicalReport';
import { Treatment } from '../../entities/Treatment';
import { PlayerAvailability } from '../../entities/PlayerAvailability';
import { injuryRoutes } from '../../routes/injuryRoutes';

describe('Medical Service Injury Endpoints Integration', () => {
  let app: express.Express;
  let dataSource: DataSource;
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  
  const entities = [Injury, MedicalReport, Treatment, PlayerAvailability];
  const { getDataSource, getRepository } = setupTestDatabase('medical-service', entities);

  // Test users
  const medicalStaff = createTestUser({
    id: 'medical-123',
    role: 'medical-staff',
    email: 'doctor@example.com',
    organizationId: 'org-123',
    permissions: ['injury.create', 'injury.view', 'injury.update', 'injury.delete'],
  });

  const coach = createTestUser({
    id: 'coach-123',
    role: 'coach',
    email: 'coach@example.com',
    organizationId: 'org-123',
    permissions: ['injury.view'],
  });

  const player = createTestUser({
    id: 'player-123',
    role: 'player',
    email: 'player@example.com',
    organizationId: 'org-123',
    permissions: ['injury.view:own'],
  });

  const unauthorizedUser = createTestUser({
    id: 'unauthorized-123',
    role: 'parent',
    email: 'parent@example.com',
    organizationId: 'org-123',
    permissions: [],
  });

  beforeAll(async () => {
    dataSource = getDataSource();
    
    // Create Express app
    app = express();
    app.use(express.json());
    
    // Apply auth middleware
    app.use(authMiddleware);
    
    // Mount routes
    app.use('/api/injuries', injuryRoutes);
    
    // Error handler
    app.use(errorHandler);

    // Seed test data
    await seedTestData();
  });

  async function seedTestData() {
    const injuryRepo = getRepository(Injury);
    
    // Create test injuries
    await injuryRepo.save([
      {
        id: 'injury-1',
        playerId: 'player-123',
        type: 'muscle_strain',
        bodyPart: 'hamstring',
        severity: 'moderate',
        injuryDate: new Date('2025-06-01'),
        description: 'Hamstring strain during practice',
        organizationId: 'org-123',
        reportedBy: 'medical-123',
        status: 'active',
      },
      {
        id: 'injury-2',
        playerId: 'player-456',
        type: 'sprain',
        bodyPart: 'ankle',
        severity: 'mild',
        injuryDate: new Date('2025-06-15'),
        description: 'Ankle sprain during game',
        organizationId: 'org-123',
        reportedBy: 'medical-123',
        status: 'active',
      },
      {
        id: 'injury-3',
        playerId: 'player-123',
        type: 'concussion',
        bodyPart: 'head',
        severity: 'severe',
        injuryDate: new Date('2025-05-01'),
        description: 'Concussion from collision',
        organizationId: 'org-123',
        reportedBy: 'medical-123',
        status: 'recovered',
        recoveryDate: new Date('2025-05-30'),
      },
    ]);

    // Create treatments
    const treatmentRepo = getRepository(Treatment);
    await treatmentRepo.save([
      {
        id: 'treatment-1',
        injuryId: 'injury-1',
        treatmentDate: new Date('2025-06-02'),
        treatmentType: 'physiotherapy',
        description: 'Initial assessment and stretching',
        performedBy: 'medical-123',
        notes: 'Patient responded well',
      },
      {
        id: 'treatment-2',
        injuryId: 'injury-1',
        treatmentDate: new Date('2025-06-05'),
        treatmentType: 'physiotherapy',
        description: 'Strengthening exercises',
        performedBy: 'medical-123',
        notes: 'Progressing as expected',
      },
    ]);
  }

  describe('POST /api/injuries', () => {
    it('should allow medical staff to create injury report', async () => {
      const token = createTestToken(medicalStaff, JWT_SECRET);
      const injuryData = {
        playerId: 'player-789',
        type: 'fracture',
        bodyPart: 'wrist',
        severity: 'severe',
        injuryDate: '2025-06-20',
        description: 'Wrist fracture from fall',
        expectedRecoveryTime: '6-8 weeks',
      };

      const response = await request(app)
        .post('/api/injuries')
        .set('Authorization', `Bearer ${token}`)
        .send(injuryData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.playerId).toBe(injuryData.playerId);
      expect(response.body.type).toBe(injuryData.type);
      expect(response.body.severity).toBe(injuryData.severity);
      expect(response.body.reportedBy).toBe(medicalStaff.id);

      // Verify in database
      const injuryRepo = getRepository(Injury);
      const savedInjury = await injuryRepo.findOne({
        where: { id: response.body.id },
      });
      expect(savedInjury).toBeDefined();
    });

    it('should reject injury creation from unauthorized users', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const injuryData = {
        playerId: 'player-789',
        type: 'strain',
        bodyPart: 'shoulder',
        severity: 'mild',
        injuryDate: '2025-06-20',
        description: 'Shoulder strain',
      };

      const response = await request(app)
        .post('/api/injuries')
        .set('Authorization', `Bearer ${token}`)
        .send(injuryData)
        .expect(403);

      expect(response.body.error).toContain('Insufficient permissions');
    });

    it('should validate injury data', async () => {
      const token = createTestToken(medicalStaff, JWT_SECRET);
      const invalidData = {
        // Missing required fields
        type: 'strain',
        severity: 'invalid-severity', // Invalid enum value
      };

      const response = await request(app)
        .post('/api/injuries')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toContain('Validation');
      expect(response.body.details).toBeDefined();
    });
  });

  describe('GET /api/injuries', () => {
    it('should allow medical staff to view all injuries', async () => {
      const token = createTestToken(medicalStaff, JWT_SECRET);

      const response = await request(app)
        .get('/api/injuries')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.total).toBeDefined();
      
      // Should see all injuries
      const injuries = response.body.data;
      expect(injuries.some((i: any) => i.playerId === 'player-123')).toBe(true);
      expect(injuries.some((i: any) => i.playerId === 'player-456')).toBe(true);
    });

    it('should allow coaches to view team injuries', async () => {
      const token = createTestToken(coach, JWT_SECRET);

      const response = await request(app)
        .get('/api/injuries')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should allow players to view only their own injuries', async () => {
      const token = createTestToken(player, JWT_SECRET);

      const response = await request(app)
        .get('/api/injuries')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      
      // Should only see own injuries
      const injuries = response.body.data;
      expect(injuries.every((i: any) => i.playerId === player.id)).toBe(true);
      expect(injuries.length).toBe(2); // player-123 has 2 injuries
    });

    it('should support pagination', async () => {
      const token = createTestToken(medicalStaff, JWT_SECRET);

      const response = await request(app)
        .get('/api/injuries?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
      expect(response.body.totalPages).toBeDefined();
    });

    it('should support filtering by status', async () => {
      const token = createTestToken(medicalStaff, JWT_SECRET);

      const response = await request(app)
        .get('/api/injuries?status=active')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const injuries = response.body.data;
      expect(injuries.every((i: any) => i.status === 'active')).toBe(true);
    });

    it('should support filtering by severity', async () => {
      const token = createTestToken(medicalStaff, JWT_SECRET);

      const response = await request(app)
        .get('/api/injuries?severity=severe')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const injuries = response.body.data;
      expect(injuries.every((i: any) => i.severity === 'severe')).toBe(true);
    });
  });

  describe('GET /api/injuries/:id', () => {
    it('should allow medical staff to view injury details', async () => {
      const token = createTestToken(medicalStaff, JWT_SECRET);

      const response = await request(app)
        .get('/api/injuries/injury-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe('injury-1');
      expect(response.body.treatments).toBeDefined();
      expect(response.body.treatments.length).toBe(2);
    });

    it('should allow players to view their own injury details', async () => {
      const token = createTestToken(player, JWT_SECRET);

      const response = await request(app)
        .get('/api/injuries/injury-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe('injury-1');
      expect(response.body.playerId).toBe(player.id);
    });

    it('should prevent players from viewing other players injuries', async () => {
      const token = createTestToken(player, JWT_SECRET);

      const response = await request(app)
        .get('/api/injuries/injury-2') // Different player's injury
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.error).toContain('access');
    });

    it('should return 404 for non-existent injury', async () => {
      const token = createTestToken(medicalStaff, JWT_SECRET);

      const response = await request(app)
        .get('/api/injuries/non-existent')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('PUT /api/injuries/:id', () => {
    it('should allow medical staff to update injury', async () => {
      const token = createTestToken(medicalStaff, JWT_SECRET);
      const updateData = {
        severity: 'mild',
        status: 'recovering',
        notes: 'Showing improvement',
      };

      const response = await request(app)
        .put('/api/injuries/injury-1')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.severity).toBe(updateData.severity);
      expect(response.body.status).toBe(updateData.status);
      expect(response.body.notes).toBe(updateData.notes);
    });

    it('should prevent unauthorized updates', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const updateData = {
        severity: 'mild',
      };

      const response = await request(app)
        .put('/api/injuries/injury-1')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(403);

      expect(response.body.error).toContain('Insufficient permissions');
    });

    it('should validate update data', async () => {
      const token = createTestToken(medicalStaff, JWT_SECRET);
      const invalidData = {
        severity: 'invalid-severity',
        status: 'invalid-status',
      };

      const response = await request(app)
        .put('/api/injuries/injury-1')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toContain('Validation');
    });
  });

  describe('POST /api/injuries/:id/treatments', () => {
    it('should allow medical staff to add treatment', async () => {
      const token = createTestToken(medicalStaff, JWT_SECRET);
      const treatmentData = {
        treatmentDate: '2025-06-10',
        treatmentType: 'medication',
        description: 'Anti-inflammatory prescribed',
        notes: 'Monitor for side effects',
      };

      const response = await request(app)
        .post('/api/injuries/injury-1/treatments')
        .set('Authorization', `Bearer ${token}`)
        .send(treatmentData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.injuryId).toBe('injury-1');
      expect(response.body.treatmentType).toBe(treatmentData.treatmentType);
      expect(response.body.performedBy).toBe(medicalStaff.id);
    });

    it('should prevent non-medical staff from adding treatments', async () => {
      const token = createTestToken(coach, JWT_SECRET);
      const treatmentData = {
        treatmentDate: '2025-06-10',
        treatmentType: 'rest',
        description: 'Rest prescribed',
      };

      const response = await request(app)
        .post('/api/injuries/injury-1/treatments')
        .set('Authorization', `Bearer ${token}`)
        .send(treatmentData)
        .expect(403);

      expect(response.body.error).toContain('Insufficient permissions');
    });
  });

  describe('POST /api/injuries/:id/recover', () => {
    it('should allow medical staff to mark injury as recovered', async () => {
      const token = createTestToken(medicalStaff, JWT_SECRET);
      const recoveryData = {
        recoveryDate: '2025-06-30',
        recoveryNotes: 'Full recovery confirmed',
        returnToPlayDate: '2025-07-01',
      };

      const response = await request(app)
        .post('/api/injuries/injury-1/recover')
        .set('Authorization', `Bearer ${token}`)
        .send(recoveryData)
        .expect(200);

      expect(response.body.status).toBe('recovered');
      expect(response.body.recoveryDate).toBeDefined();
      expect(response.body.recoveryNotes).toBe(recoveryData.recoveryNotes);
    });

    it('should update player availability when recovered', async () => {
      const token = createTestToken(medicalStaff, JWT_SECRET);
      const recoveryData = {
        recoveryDate: '2025-06-30',
        returnToPlayDate: '2025-07-01',
      };

      await request(app)
        .post('/api/injuries/injury-2/recover')
        .set('Authorization', `Bearer ${token}`)
        .send(recoveryData)
        .expect(200);

      // Check if player availability was updated
      const availabilityRepo = getRepository(PlayerAvailability);
      const availability = await availabilityRepo.findOne({
        where: { playerId: 'player-456' },
      });

      expect(availability?.status).toBe('available');
    });
  });

  describe('DELETE /api/injuries/:id', () => {
    it('should allow medical staff to soft delete injury', async () => {
      const token = createTestToken(medicalStaff, JWT_SECRET);

      const response = await request(app)
        .delete('/api/injuries/injury-3')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toContain('deleted');

      // Verify soft delete in database
      const injuryRepo = getRepository(Injury);
      const deletedInjury = await injuryRepo.findOne({
        where: { id: 'injury-3' },
        withDeleted: true,
      });
      
      expect(deletedInjury?.deletedAt).toBeDefined();
      expect(deletedInjury?.deletedBy).toBe(medicalStaff.id);
    });

    it('should prevent unauthorized deletion', async () => {
      const token = createTestToken(player, JWT_SECRET);

      const response = await request(app)
        .delete('/api/injuries/injury-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.error).toContain('Insufficient permissions');
    });
  });

  describe('GET /api/injuries/stats', () => {
    it('should provide injury statistics for medical staff', async () => {
      const token = createTestToken(medicalStaff, JWT_SECRET);

      const response = await request(app)
        .get('/api/injuries/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.totalInjuries).toBeDefined();
      expect(response.body.activeInjuries).toBeDefined();
      expect(response.body.bySeverity).toBeDefined();
      expect(response.body.byType).toBeDefined();
      expect(response.body.byBodyPart).toBeDefined();
      expect(response.body.averageRecoveryTime).toBeDefined();
    });

    it('should filter stats by date range', async () => {
      const token = createTestToken(medicalStaff, JWT_SECRET);

      const response = await request(app)
        .get('/api/injuries/stats?startDate=2025-06-01&endDate=2025-06-30')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.totalInjuries).toBeGreaterThan(0);
      expect(response.body.dateRange).toBeDefined();
    });

    it('should prevent unauthorized access to stats', async () => {
      const token = createTestToken(unauthorizedUser, JWT_SECRET);

      const response = await request(app)
        .get('/api/injuries/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.error).toContain('Insufficient permissions');
    });
  });
});