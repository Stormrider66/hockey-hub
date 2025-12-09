/**
 * @file drill-library.integration.test.ts
 * @description Comprehensive integration tests for Drill Library APIs
 * Tests drill creation and categorization, search functionality, rating system,
 * duplicate detection, and sharing mechanisms
 */

import request from 'supertest';
import { Application } from 'express';
import { Connection, createConnection, getRepository } from 'typeorm';
import express from 'express';
import { Drill, DrillDifficulty, DrillType } from '../../entities/Drill';
import { DrillCategory } from '../../entities/DrillCategory';
import { DrillLibraryController } from '../../controllers/coach/drill-library.controller';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';

// Mock Logger
jest.mock('@hockey-hub/shared-lib/dist/utils/Logger');

// Mock authentication middleware
const mockAuthMiddleware = (req: any, res: any, next: any) => {
  req.user = {
    userId: 'coach-123',
    organizationId: 'org-123',
    role: 'COACH'
  };
  next();
};

describe('Drill Library Integration Tests', () => {
  let app: Application;
  let connection: Connection;
  let drillRepository: any;
  let categoryRepository: any;

  // Test data
  const testOrganizationId = 'org-123';
  const testCoachId = 'coach-123';
  const otherCoachId = 'coach-456';
  const otherOrganizationId = 'org-456';

  let testCategories: any[] = [];

  const mockSetup = {
    rinkArea: 'half' as const,
    diagram: 'https://example.com/diagram.png',
    cones: 8,
    pucks: 20,
    otherEquipment: ['nets', 'sticks']
  };

  const mockInstructions = [
    {
      step: 1,
      description: 'Players line up at center ice',
      duration: 30,
      keyPoints: ['Stay in position', 'Keep head up']
    },
    {
      step: 2,
      description: 'Skate to blue line and back',
      duration: 60,
      keyPoints: ['Full speed', 'Good form']
    },
    {
      step: 3,
      description: 'Cool down skating',
      duration: 30,
      keyPoints: ['Easy pace', 'Deep breaths']
    }
  ];

  beforeAll(async () => {
    // Create in-memory database connection
    connection = await createConnection({
      type: 'sqlite',
      database: ':memory:',
      entities: [Drill, DrillCategory],
      synchronize: true,
      logging: false,
    });

    drillRepository = getRepository(Drill);
    categoryRepository = getRepository(DrillCategory);

    // Setup Express app with routes
    app = express();
    app.use(express.json());
    app.use(mockAuthMiddleware);

    // Add routes (assuming these exist)
    app.post('/api/planning/drills', DrillLibraryController.create);
    app.get('/api/planning/drills', DrillLibraryController.list);
    app.get('/api/planning/drills/search', DrillLibraryController.search);
    app.get('/api/planning/drills/:id', DrillLibraryController.getById);
    app.put('/api/planning/drills/:id', DrillLibraryController.update);
    app.delete('/api/planning/drills/:id', DrillLibraryController.delete);
    app.post('/api/planning/drills/:id/duplicate', DrillLibraryController.duplicate);
    app.post('/api/planning/drills/:id/rate', DrillLibraryController.rateDrill);
    app.post('/api/planning/drills/:id/share', DrillLibraryController.shareDrill);
    app.post('/api/planning/drills/:id/usage', DrillLibraryController.incrementUsage);
    app.get('/api/planning/drills/categories', DrillLibraryController.getCategories);
    app.post('/api/planning/drills/bulk-import', DrillLibraryController.bulkImport);
    app.post('/api/planning/drills/validate-duplicate', DrillLibraryController.validateDuplicate);

    // Error handler
    app.use((error: any, req: any, res: any, next: any) => {
      res.status(500).json({ error: error.message });
    });
  });

  afterAll(async () => {
    if (connection) {
      await connection.close();
    }
  });

  beforeEach(async () => {
    // Clear database before each test
    await drillRepository.clear();
    await categoryRepository.clear();

    // Create test categories
    testCategories = await categoryRepository.save([
      {
        name: 'Skating',
        description: 'Skating drills and exercises',
        parentId: null,
        isActive: true
      },
      {
        name: 'Power Skating',
        description: 'Advanced skating techniques',
        parentId: null, // Will be set after creation
        isActive: true
      },
      {
        name: 'Stickhandling',
        description: 'Puck handling skills',
        parentId: null,
        isActive: true
      },
      {
        name: 'Shooting',
        description: 'Shooting techniques and drills',
        parentId: null,
        isActive: true
      }
    ]);

    // Set up parent-child relationship
    testCategories[1].parentId = testCategories[0].id;
    await categoryRepository.save(testCategories[1]);
  });

  describe('POST /api/planning/drills', () => {
    it('should create a new drill', async () => {
      const drillData = {
        name: 'Basic Skating Warm-up',
        description: 'Simple skating drill to warm up players',
        categoryId: testCategories[0].id,
        type: DrillType.WARM_UP,
        difficulty: DrillDifficulty.BEGINNER,
        duration: 10,
        minPlayers: 6,
        maxPlayers: 20,
        equipment: ['pucks', 'cones'],
        setup: mockSetup,
        instructions: mockInstructions,
        objectives: ['Warm up muscles', 'Practice basic skating'],
        keyPoints: ['Keep knees bent', 'Eyes up'],
        variations: ['Add backwards skating', 'Include crossovers'],
        tags: ['warm-up', 'skating', 'beginner'],
        ageGroups: ['U10', 'U12', 'U14'],
        videoUrl: 'https://example.com/video.mp4',
        animationUrl: 'https://example.com/animation.gif'
      };

      const response = await request(app)
        .post('/api/planning/drills')
        .send(drillData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: drillData.name,
        description: drillData.description,
        organizationId: testOrganizationId,
        categoryId: drillData.categoryId,
        type: drillData.type,
        difficulty: drillData.difficulty,
        duration: drillData.duration,
        minPlayers: drillData.minPlayers,
        maxPlayers: drillData.maxPlayers,
        isPublic: false,
        usageCount: 0,
        rating: 0,
        ratingCount: 0
      });

      expect(response.body.equipment).toEqual(drillData.equipment);
      expect(response.body.setup).toEqual(mockSetup);
      expect(response.body.instructions).toEqual(mockInstructions);
      expect(response.body.objectives).toEqual(drillData.objectives);
      expect(response.body.keyPoints).toEqual(drillData.keyPoints);
      expect(response.body.variations).toEqual(drillData.variations);
      expect(response.body.tags).toEqual(drillData.tags);
      expect(response.body.ageGroups).toEqual(drillData.ageGroups);

      // Verify in database
      const saved = await drillRepository.findOne(response.body.id);
      expect(saved).toBeDefined();
      expect(saved.name).toBe(drillData.name);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: '', // Invalid empty name
        description: '', // Invalid empty description
        categoryId: 'invalid-uuid', // Invalid UUID format
        type: 'invalid-type', // Invalid enum
        difficulty: 'invalid-difficulty', // Invalid enum
        duration: -5, // Invalid duration
        minPlayers: -1, // Invalid min players
        maxPlayers: 0, // Invalid max players (less than min)
        equipment: null, // Missing required field
        setup: null, // Missing required field
        instructions: null // Missing required field
      };

      const response = await request(app)
        .post('/api/planning/drills')
        .send(invalidData)
        .expect(500);

      // Check that no drill was created
      const count = await drillRepository.count();
      expect(count).toBe(0);
    });

    it('should validate player count logic', async () => {
      const invalidData = {
        name: 'Invalid Drill',
        description: 'Test drill',
        categoryId: testCategories[0].id,
        type: DrillType.SKILL,
        difficulty: DrillDifficulty.INTERMEDIATE,
        duration: 10,
        minPlayers: 20,
        maxPlayers: 10, // Max less than min
        equipment: ['pucks'],
        setup: mockSetup,
        instructions: mockInstructions
      };

      const response = await request(app)
        .post('/api/planning/drills')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toContain('maxPlayers must be greater than or equal to minPlayers');
    });

    it('should validate category exists', async () => {
      const drillData = {
        name: 'Test Drill',
        description: 'Test description',
        categoryId: 'non-existent-category-id',
        type: DrillType.SKILL,
        difficulty: DrillDifficulty.INTERMEDIATE,
        duration: 10,
        minPlayers: 1,
        maxPlayers: 10,
        equipment: ['pucks'],
        setup: mockSetup,
        instructions: mockInstructions
      };

      const response = await request(app)
        .post('/api/planning/drills')
        .send(drillData)
        .expect(400);

      expect(response.body.error).toContain('Category not found');
    });

    it('should validate instruction step sequence', async () => {
      const invalidInstructions = [
        { step: 1, description: 'Step 1' },
        { step: 3, description: 'Step 3' }, // Missing step 2
        { step: 4, description: 'Step 4' }
      ];

      const drillData = {
        name: 'Invalid Instructions Drill',
        description: 'Test drill',
        categoryId: testCategories[0].id,
        type: DrillType.SKILL,
        difficulty: DrillDifficulty.INTERMEDIATE,
        duration: 10,
        minPlayers: 1,
        maxPlayers: 10,
        equipment: ['pucks'],
        setup: mockSetup,
        instructions: invalidInstructions
      };

      const response = await request(app)
        .post('/api/planning/drills')
        .send(drillData)
        .expect(400);

      expect(response.body.error).toContain('instruction steps must be sequential');
    });
  });

  describe('GET /api/planning/drills', () => {
    beforeEach(async () => {
      const testDrills = [
        {
          name: 'Beginner Skating',
          description: 'Basic skating for beginners',
          organizationId: testOrganizationId,
          isPublic: false,
          categoryId: testCategories[0].id,
          type: DrillType.WARM_UP,
          difficulty: DrillDifficulty.BEGINNER,
          duration: 10,
          minPlayers: 8,
          maxPlayers: 20,
          equipment: ['cones'],
          setup: mockSetup,
          instructions: mockInstructions,
          tags: ['skating', 'beginner'],
          ageGroups: ['U8', 'U10'],
          usageCount: 15,
          rating: 40, // 4.0 average (10 ratings)
          ratingCount: 10
        },
        {
          name: 'Advanced Stickhandling',
          description: 'Complex stickhandling patterns',
          organizationId: testOrganizationId,
          isPublic: false,
          categoryId: testCategories[2].id,
          type: DrillType.SKILL,
          difficulty: DrillDifficulty.ADVANCED,
          duration: 15,
          minPlayers: 6,
          maxPlayers: 18,
          equipment: ['pucks', 'cones'],
          setup: mockSetup,
          instructions: mockInstructions,
          tags: ['stickhandling', 'advanced'],
          ageGroups: ['U16', 'U18', 'Senior'],
          usageCount: 8,
          rating: 45, // 4.5 average (10 ratings)
          ratingCount: 10
        },
        {
          name: 'Public Shooting Drill',
          description: 'Public drill for shooting practice',
          organizationId: null,
          isPublic: true,
          categoryId: testCategories[3].id,
          type: DrillType.SKILL,
          difficulty: DrillDifficulty.INTERMEDIATE,
          duration: 20,
          minPlayers: 4,
          maxPlayers: 12,
          equipment: ['pucks', 'nets'],
          setup: mockSetup,
          instructions: mockInstructions,
          tags: ['shooting', 'public'],
          ageGroups: ['U12', 'U14', 'U16'],
          usageCount: 25,
          rating: 35, // 3.5 average (10 ratings)
          ratingCount: 10
        },
        {
          name: 'Other Org Drill',
          description: 'Drill from another organization',
          organizationId: otherOrganizationId,
          isPublic: false,
          categoryId: testCategories[0].id,
          type: DrillType.CONDITIONING,
          difficulty: DrillDifficulty.ELITE,
          duration: 25,
          minPlayers: 10,
          maxPlayers: 22,
          equipment: ['pucks'],
          setup: mockSetup,
          instructions: mockInstructions,
          tags: ['conditioning'],
          ageGroups: ['Senior'],
          usageCount: 3,
          rating: 30,
          ratingCount: 6
        }
      ];

      await drillRepository.save(testDrills);
    });

    it('should return paginated drills', async () => {
      const response = await request(app)
        .get('/api/planning/drills?page=1&pageSize=2')
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.any(Array),
        pagination: {
          page: 1,
          pageSize: 2,
          total: 3, // Should include own org drills + public drills
          totalPages: 2
        }
      });

      expect(response.body.data).toHaveLength(2);
    });

    it('should include own organization and public drills only', async () => {
      const response = await request(app)
        .get('/api/planning/drills')
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      
      const orgDrills = response.body.data.filter((drill: any) => drill.organizationId === testOrganizationId);
      const publicDrills = response.body.data.filter((drill: any) => drill.isPublic);
      const otherOrgDrills = response.body.data.filter((drill: any) => 
        drill.organizationId === otherOrganizationId
      );

      expect(orgDrills).toHaveLength(2);
      expect(publicDrills).toHaveLength(1);
      expect(otherOrgDrills).toHaveLength(0);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get(`/api/planning/drills?categoryId=${testCategories[2].id}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Advanced Stickhandling');
    });

    it('should filter by difficulty', async () => {
      const response = await request(app)
        .get(`/api/planning/drills?difficulty=${DrillDifficulty.ADVANCED}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].difficulty).toBe(DrillDifficulty.ADVANCED);
    });

    it('should filter by type', async () => {
      const response = await request(app)
        .get(`/api/planning/drills?type=${DrillType.SKILL}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((drill: any) => drill.type === DrillType.SKILL)).toBe(true);
    });

    it('should filter by age group', async () => {
      const response = await request(app)
        .get('/api/planning/drills?ageGroup=U16')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((drill: any) => 
        drill.ageGroups.includes('U16')
      )).toBe(true);
    });

    it('should filter by player count', async () => {
      const response = await request(app)
        .get('/api/planning/drills?playerCount=15')
        .expect(200);

      // Should return drills that can accommodate 15 players
      response.body.data.forEach((drill: any) => {
        expect(drill.minPlayers).toBeLessThanOrEqual(15);
        expect(drill.maxPlayers).toBeGreaterThanOrEqual(15);
      });
    });

    it('should search by name and description', async () => {
      const response = await request(app)
        .get('/api/planning/drills?search=stickhandling')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toContain('Stickhandling');
    });

    it('should search by tags', async () => {
      const response = await request(app)
        .get('/api/planning/drills?tags=beginner,skating')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].tags).toEqual(expect.arrayContaining(['beginner', 'skating']));
    });

    it('should sort by different criteria', async () => {
      const popularityResponse = await request(app)
        .get('/api/planning/drills?sortBy=popularity')
        .expect(200);

      const usageCounts = popularityResponse.body.data.map((drill: any) => drill.usageCount);
      for (let i = 1; i < usageCounts.length; i++) {
        expect(usageCounts[i-1]).toBeGreaterThanOrEqual(usageCounts[i]);
      }

      const ratingResponse = await request(app)
        .get('/api/planning/drills?sortBy=rating')
        .expect(200);

      const ratings = ratingResponse.body.data.map((drill: any) => drill.rating / drill.ratingCount);
      for (let i = 1; i < ratings.length; i++) {
        expect(ratings[i-1]).toBeGreaterThanOrEqual(ratings[i]);
      }
    });

    it('should include calculated fields', async () => {
      const response = await request(app)
        .get('/api/planning/drills')
        .expect(200);

      response.body.data.forEach((drill: any) => {
        expect(drill.averageRating).toBeDefined();
        expect(drill.totalDuration).toBeDefined();
        
        if (drill.ratingCount > 0) {
          expect(drill.averageRating).toBe(drill.rating / drill.ratingCount);
        } else {
          expect(drill.averageRating).toBe(0);
        }
      });
    });
  });

  describe('GET /api/planning/drills/search', () => {
    beforeEach(async () => {
      await drillRepository.save([
        {
          name: 'Power Play Setup',
          description: 'Learn to set up the power play properly',
          organizationId: testOrganizationId,
          isPublic: false,
          categoryId: testCategories[0].id,
          type: DrillType.TACTICAL,
          difficulty: DrillDifficulty.INTERMEDIATE,
          duration: 15,
          minPlayers: 6,
          maxPlayers: 12,
          equipment: ['pucks', 'cones'],
          setup: mockSetup,
          instructions: mockInstructions,
          tags: ['power-play', 'tactics'],
          ageGroups: ['U14', 'U16'],
          usageCount: 5,
          rating: 42,
          ratingCount: 7
        },
        {
          name: '2-on-1 Breakaway',
          description: 'Practice 2-on-1 situations and breakaway scoring',
          organizationId: testOrganizationId,
          isPublic: false,
          categoryId: testCategories[3].id,
          type: DrillType.GAME,
          difficulty: DrillDifficulty.ADVANCED,
          duration: 20,
          minPlayers: 8,
          maxPlayers: 16,
          equipment: ['pucks', 'nets'],
          setup: mockSetup,
          instructions: mockInstructions,
          tags: ['breakaway', 'scoring', '2-on-1'],
          ageGroups: ['U16', 'U18', 'Senior'],
          usageCount: 12,
          rating: 48,
          ratingCount: 8
        }
      ]);
    });

    it('should search drills by query', async () => {
      const response = await request(app)
        .get('/api/planning/drills/search?q=power%20play')
        .expect(200);

      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0].name).toBe('Power Play Setup');
      expect(response.body.total).toBe(1);
    });

    it('should search in description and tags', async () => {
      const response = await request(app)
        .get('/api/planning/drills/search?q=breakaway')
        .expect(200);

      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0].name).toBe('2-on-1 Breakaway');
    });

    it('should search with filters', async () => {
      const response = await request(app)
        .get('/api/planning/drills/search?q=play&difficulty=intermediate')
        .expect(200);

      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0].difficulty).toBe(DrillDifficulty.INTERMEDIATE);
    });

    it('should limit search results', async () => {
      // Create many drills
      const manyDrills = Array.from({ length: 60 }, (_, i) => ({
        name: `Search Drill ${i}`,
        description: `Search test drill number ${i}`,
        organizationId: testOrganizationId,
        isPublic: false,
        categoryId: testCategories[0].id,
        type: DrillType.SKILL,
        difficulty: DrillDifficulty.BEGINNER,
        duration: 10,
        minPlayers: 1,
        maxPlayers: 10,
        equipment: ['pucks'],
        setup: mockSetup,
        instructions: mockInstructions,
        tags: ['search-test'],
        usageCount: 0,
        rating: 0,
        ratingCount: 0
      }));

      await drillRepository.save(manyDrills);

      const response = await request(app)
        .get('/api/planning/drills/search?q=search&limit=25')
        .expect(200);

      expect(response.body.results).toHaveLength(25);
      expect(response.body.total).toBe(60);
      expect(response.body.hasMore).toBe(true);
    });

    it('should highlight search matches', async () => {
      const response = await request(app)
        .get('/api/planning/drills/search?q=power&highlight=true')
        .expect(200);

      const result = response.body.results[0];
      expect(result.highlightedName).toContain('<mark>Power</mark>');
    });

    it('should provide search suggestions', async () => {
      const response = await request(app)
        .get('/api/planning/drills/search?q=powr') // Misspelled
        .expect(200);

      expect(response.body.suggestions).toBeDefined();
      expect(response.body.suggestions).toContain('power');
    });
  });

  describe('GET /api/planning/drills/:id', () => {
    let testDrill: any;

    beforeEach(async () => {
      testDrill = await drillRepository.save({
        name: 'Detailed Test Drill',
        description: 'A comprehensive test drill',
        organizationId: testOrganizationId,
        isPublic: false,
        categoryId: testCategories[0].id,
        type: DrillType.SKILL,
        difficulty: DrillDifficulty.INTERMEDIATE,
        duration: 15,
        minPlayers: 6,
        maxPlayers: 18,
        equipment: ['pucks', 'cones', 'nets'],
        setup: mockSetup,
        instructions: mockInstructions,
        objectives: ['Improve puck control', 'Enhance passing'],
        keyPoints: ['Keep head up', 'Soft hands'],
        variations: ['Add defensive pressure', 'Increase speed'],
        tags: ['detailed', 'comprehensive'],
        ageGroups: ['U12', 'U14', 'U16'],
        videoUrl: 'https://example.com/video.mp4',
        animationUrl: 'https://example.com/animation.gif',
        usageCount: 7,
        rating: 35,
        ratingCount: 7
      });
    });

    it('should return complete drill details', async () => {
      const response = await request(app)
        .get(`/api/planning/drills/${testDrill.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testDrill.id,
        name: testDrill.name,
        description: testDrill.description,
        organizationId: testOrganizationId,
        categoryId: testDrill.categoryId,
        type: testDrill.type,
        difficulty: testDrill.difficulty,
        duration: testDrill.duration,
        minPlayers: testDrill.minPlayers,
        maxPlayers: testDrill.maxPlayers,
        videoUrl: testDrill.videoUrl,
        animationUrl: testDrill.animationUrl,
        usageCount: testDrill.usageCount,
        rating: testDrill.rating,
        ratingCount: testDrill.ratingCount
      });

      expect(response.body.equipment).toEqual(testDrill.equipment);
      expect(response.body.setup).toEqual(mockSetup);
      expect(response.body.instructions).toEqual(mockInstructions);
      expect(response.body.objectives).toEqual(testDrill.objectives);
      expect(response.body.keyPoints).toEqual(testDrill.keyPoints);
      expect(response.body.variations).toEqual(testDrill.variations);
      expect(response.body.tags).toEqual(testDrill.tags);
      expect(response.body.ageGroups).toEqual(testDrill.ageGroups);
    });

    it('should include calculated fields and category details', async () => {
      const response = await request(app)
        .get(`/api/planning/drills/${testDrill.id}`)
        .expect(200);

      expect(response.body.averageRating).toBe(5); // 35/7 = 5
      expect(response.body.totalDuration).toBe(120); // Sum of instruction durations
      expect(response.body.category).toBeDefined();
      expect(response.body.category.name).toBe(testCategories[0].name);
    });

    it('should return 404 for non-existent drill', async () => {
      const response = await request(app)
        .get('/api/planning/drills/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Drill not found');
    });

    it('should not return drills from other organizations (unless public)', async () => {
      const otherOrgDrill = await drillRepository.save({
        name: 'Other Org Drill',
        description: 'Private drill from another org',
        organizationId: otherOrganizationId,
        isPublic: false,
        categoryId: testCategories[0].id,
        type: DrillType.SKILL,
        difficulty: DrillDifficulty.BEGINNER,
        duration: 10,
        minPlayers: 1,
        maxPlayers: 10,
        equipment: ['pucks'],
        setup: mockSetup,
        instructions: mockInstructions,
        usageCount: 0,
        rating: 0,
        ratingCount: 0
      });

      const response = await request(app)
        .get(`/api/planning/drills/${otherOrgDrill.id}`)
        .expect(404);

      expect(response.body.error).toBe('Drill not found');
    });

    it('should return public drills from other organizations', async () => {
      const publicDrill = await drillRepository.save({
        name: 'Public Drill',
        description: 'Public drill from another org',
        organizationId: otherOrganizationId,
        isPublic: true,
        categoryId: testCategories[0].id,
        type: DrillType.SKILL,
        difficulty: DrillDifficulty.BEGINNER,
        duration: 10,
        minPlayers: 1,
        maxPlayers: 10,
        equipment: ['pucks'],
        setup: mockSetup,
        instructions: mockInstructions,
        usageCount: 0,
        rating: 0,
        ratingCount: 0
      });

      const response = await request(app)
        .get(`/api/planning/drills/${publicDrill.id}`)
        .expect(200);

      expect(response.body.name).toBe('Public Drill');
      expect(response.body.isPublic).toBe(true);
    });
  });

  describe('PUT /api/planning/drills/:id', () => {
    let testDrill: any;

    beforeEach(async () => {
      testDrill = await drillRepository.save({
        name: 'Original Drill',
        description: 'Original description',
        organizationId: testOrganizationId,
        isPublic: false,
        categoryId: testCategories[0].id,
        type: DrillType.WARM_UP,
        difficulty: DrillDifficulty.BEGINNER,
        duration: 10,
        minPlayers: 4,
        maxPlayers: 12,
        equipment: ['pucks'],
        setup: mockSetup,
        instructions: mockInstructions,
        tags: ['original'],
        usageCount: 0,
        rating: 0,
        ratingCount: 0
      });
    });

    it('should update drill', async () => {
      const updates = {
        name: 'Updated Drill',
        description: 'Updated description',
        type: DrillType.SKILL,
        difficulty: DrillDifficulty.INTERMEDIATE,
        duration: 20,
        minPlayers: 6,
        maxPlayers: 18,
        equipment: ['pucks', 'cones'],
        objectives: ['New objective 1', 'New objective 2'],
        keyPoints: ['Updated key point'],
        tags: ['updated', 'modified']
      };

      const response = await request(app)
        .put(`/api/planning/drills/${testDrill.id}`)
        .send(updates)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testDrill.id,
        name: updates.name,
        description: updates.description,
        type: updates.type,
        difficulty: updates.difficulty,
        duration: updates.duration,
        minPlayers: updates.minPlayers,
        maxPlayers: updates.maxPlayers
      });

      expect(response.body.equipment).toEqual(updates.equipment);
      expect(response.body.objectives).toEqual(updates.objectives);
      expect(response.body.keyPoints).toEqual(updates.keyPoints);
      expect(response.body.tags).toEqual(updates.tags);

      // Verify in database
      const updated = await drillRepository.findOne(testDrill.id);
      expect(updated.name).toBe(updates.name);
      expect(updated.description).toBe(updates.description);
    });

    it('should prevent editing drills from other organizations', async () => {
      const otherOrgDrill = await drillRepository.save({
        name: 'Other Org Drill',
        description: 'Other org description',
        organizationId: otherOrganizationId,
        isPublic: false,
        categoryId: testCategories[0].id,
        type: DrillType.SKILL,
        difficulty: DrillDifficulty.BEGINNER,
        duration: 10,
        minPlayers: 1,
        maxPlayers: 10,
        equipment: ['pucks'],
        setup: mockSetup,
        instructions: mockInstructions,
        usageCount: 0,
        rating: 0,
        ratingCount: 0
      });

      const response = await request(app)
        .put(`/api/planning/drills/${otherOrgDrill.id}`)
        .send({ name: 'Hacked Update' })
        .expect(404);

      expect(response.body.error).toBe('Drill not found or no permission to update');
    });

    it('should validate updates', async () => {
      const invalidUpdates = {
        minPlayers: 20,
        maxPlayers: 10, // Max < min
        duration: -5 // Negative duration
      };

      const response = await request(app)
        .put(`/api/planning/drills/${testDrill.id}`)
        .send(invalidUpdates)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('DELETE /api/planning/drills/:id', () => {
    let testDrill: any;

    beforeEach(async () => {
      testDrill = await drillRepository.save({
        name: 'Drill to Delete',
        description: 'This drill will be deleted',
        organizationId: testOrganizationId,
        isPublic: false,
        categoryId: testCategories[0].id,
        type: DrillType.SKILL,
        difficulty: DrillDifficulty.BEGINNER,
        duration: 10,
        minPlayers: 1,
        maxPlayers: 10,
        equipment: ['pucks'],
        setup: mockSetup,
        instructions: mockInstructions,
        usageCount: 0,
        rating: 0,
        ratingCount: 0
      });
    });

    it('should delete drill', async () => {
      const response = await request(app)
        .delete(`/api/planning/drills/${testDrill.id}`)
        .expect(204);

      // Verify deletion
      const deleted = await drillRepository.findOne(testDrill.id);
      expect(deleted).toBeNull();
    });

    it('should prevent deletion of drills from other organizations', async () => {
      const otherOrgDrill = await drillRepository.save({
        name: 'Other Org Drill',
        description: 'Other org drill',
        organizationId: otherOrganizationId,
        isPublic: false,
        categoryId: testCategories[0].id,
        type: DrillType.SKILL,
        difficulty: DrillDifficulty.BEGINNER,
        duration: 10,
        minPlayers: 1,
        maxPlayers: 10,
        equipment: ['pucks'],
        setup: mockSetup,
        instructions: mockInstructions,
        usageCount: 0,
        rating: 0,
        ratingCount: 0
      });

      const response = await request(app)
        .delete(`/api/planning/drills/${otherOrgDrill.id}`)
        .expect(404);

      expect(response.body.error).toBe('Drill not found or no permission to delete');

      // Verify drill still exists
      const stillExists = await drillRepository.findOne(otherOrgDrill.id);
      expect(stillExists).toBeDefined();
    });

    it('should prevent deletion of highly used drills', async () => {
      testDrill.usageCount = 100;
      await drillRepository.save(testDrill);

      const response = await request(app)
        .delete(`/api/planning/drills/${testDrill.id}`)
        .expect(400);

      expect(response.body.error).toContain('Cannot delete drill with high usage count');
    });
  });

  describe('POST /api/planning/drills/:id/duplicate', () => {
    let testDrill: any;

    beforeEach(async () => {
      testDrill = await drillRepository.save({
        name: 'Original Drill',
        description: 'Original drill to duplicate',
        organizationId: testOrganizationId,
        isPublic: false,
        categoryId: testCategories[0].id,
        type: DrillType.SKILL,
        difficulty: DrillDifficulty.INTERMEDIATE,
        duration: 15,
        minPlayers: 6,
        maxPlayers: 18,
        equipment: ['pucks', 'cones'],
        setup: mockSetup,
        instructions: mockInstructions,
        objectives: ['Original objective'],
        keyPoints: ['Original key point'],
        variations: ['Original variation'],
        tags: ['original', 'test'],
        ageGroups: ['U14', 'U16'],
        usageCount: 10,
        rating: 40,
        ratingCount: 8
      });
    });

    it('should duplicate drill', async () => {
      const duplicateData = {
        name: 'Duplicated Drill',
        categoryId: testCategories[1].id
      };

      const response = await request(app)
        .post(`/api/planning/drills/${testDrill.id}/duplicate`)
        .send(duplicateData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: duplicateData.name,
        description: testDrill.description,
        organizationId: testOrganizationId,
        categoryId: duplicateData.categoryId,
        type: testDrill.type,
        difficulty: testDrill.difficulty,
        duration: testDrill.duration,
        minPlayers: testDrill.minPlayers,
        maxPlayers: testDrill.maxPlayers,
        usageCount: 0, // Reset usage count
        rating: 0, // Reset rating
        ratingCount: 0 // Reset rating count
      });

      expect(response.body.id).not.toBe(testDrill.id);
      expect(response.body.equipment).toEqual(testDrill.equipment);
      expect(response.body.setup).toEqual(testDrill.setup);
      expect(response.body.instructions).toEqual(testDrill.instructions);
      expect(response.body.objectives).toEqual(testDrill.objectives);

      // Verify in database
      const duplicated = await drillRepository.findOne(response.body.id);
      expect(duplicated).toBeDefined();
      expect(duplicated.name).toBe(duplicateData.name);
    });

    it('should use default name when not provided', async () => {
      const response = await request(app)
        .post(`/api/planning/drills/${testDrill.id}/duplicate`)
        .send({})
        .expect(201);

      expect(response.body.name).toBe('Original Drill (Copy)');
    });

    it('should duplicate public drills from other organizations', async () => {
      const publicDrill = await drillRepository.save({
        name: 'Public Drill to Duplicate',
        description: 'Public drill from another org',
        organizationId: otherOrganizationId,
        isPublic: true,
        categoryId: testCategories[0].id,
        type: DrillType.SKILL,
        difficulty: DrillDifficulty.BEGINNER,
        duration: 10,
        minPlayers: 1,
        maxPlayers: 10,
        equipment: ['pucks'],
        setup: mockSetup,
        instructions: mockInstructions,
        usageCount: 5,
        rating: 25,
        ratingCount: 5
      });

      const response = await request(app)
        .post(`/api/planning/drills/${publicDrill.id}/duplicate`)
        .send({ name: 'My Version of Public Drill' })
        .expect(201);

      expect(response.body.name).toBe('My Version of Public Drill');
      expect(response.body.organizationId).toBe(testOrganizationId); // Changed to current org
      expect(response.body.isPublic).toBe(false); // Made private by default
    });

    it('should prevent duplicating private drills from other organizations', async () => {
      const privateDrill = await drillRepository.save({
        name: 'Private Drill',
        description: 'Private drill from another org',
        organizationId: otherOrganizationId,
        isPublic: false,
        categoryId: testCategories[0].id,
        type: DrillType.SKILL,
        difficulty: DrillDifficulty.BEGINNER,
        duration: 10,
        minPlayers: 1,
        maxPlayers: 10,
        equipment: ['pucks'],
        setup: mockSetup,
        instructions: mockInstructions,
        usageCount: 0,
        rating: 0,
        ratingCount: 0
      });

      const response = await request(app)
        .post(`/api/planning/drills/${privateDrill.id}/duplicate`)
        .send({ name: 'Attempted Copy' })
        .expect(404);

      expect(response.body.error).toBe('Drill not found or no permission to duplicate');
    });
  });

  describe('POST /api/planning/drills/:id/rate', () => {
    let testDrill: any;

    beforeEach(async () => {
      testDrill = await drillRepository.save({
        name: 'Drill to Rate',
        description: 'This drill will be rated',
        organizationId: testOrganizationId,
        isPublic: false,
        categoryId: testCategories[0].id,
        type: DrillType.SKILL,
        difficulty: DrillDifficulty.INTERMEDIATE,
        duration: 15,
        minPlayers: 6,
        maxPlayers: 18,
        equipment: ['pucks'],
        setup: mockSetup,
        instructions: mockInstructions,
        usageCount: 5,
        rating: 20, // 5.0 average (4 ratings)
        ratingCount: 4
      });
    });

    it('should add rating to drill', async () => {
      const ratingData = {
        rating: 8,
        comment: 'Great drill, players loved it!'
      };

      const response = await request(app)
        .post(`/api/planning/drills/${testDrill.id}/rate`)
        .send(ratingData)
        .expect(200);

      expect(response.body.rating).toBe(28); // 20 + 8 = 28
      expect(response.body.ratingCount).toBe(5); // 4 + 1 = 5
      expect(response.body.averageRating).toBe(5.6); // 28/5 = 5.6

      // Verify in database
      const updated = await drillRepository.findOne(testDrill.id);
      expect(updated.rating).toBe(28);
      expect(updated.ratingCount).toBe(5);
    });

    it('should validate rating value', async () => {
      const invalidRating = { rating: 11 }; // Rating > 10

      const response = await request(app)
        .post(`/api/planning/drills/${testDrill.id}/rate`)
        .send(invalidRating)
        .expect(400);

      expect(response.body.error).toContain('rating must be between 1 and 10');
    });

    it('should prevent rating same drill multiple times by same user', async () => {
      // Add first rating
      await request(app)
        .post(`/api/planning/drills/${testDrill.id}/rate`)
        .send({ rating: 8 })
        .expect(200);

      // Try to add second rating
      const response = await request(app)
        .post(`/api/planning/drills/${testDrill.id}/rate`)
        .send({ rating: 9 })
        .expect(400);

      expect(response.body.error).toContain('You have already rated this drill');
    });

    it('should allow rating public drills from other organizations', async () => {
      const publicDrill = await drillRepository.save({
        name: 'Public Drill to Rate',
        description: 'Public drill from another org',
        organizationId: otherOrganizationId,
        isPublic: true,
        categoryId: testCategories[0].id,
        type: DrillType.SKILL,
        difficulty: DrillDifficulty.BEGINNER,
        duration: 10,
        minPlayers: 1,
        maxPlayers: 10,
        equipment: ['pucks'],
        setup: mockSetup,
        instructions: mockInstructions,
        usageCount: 0,
        rating: 0,
        ratingCount: 0
      });

      const response = await request(app)
        .post(`/api/planning/drills/${publicDrill.id}/rate`)
        .send({ rating: 7, comment: 'Nice public drill' })
        .expect(200);

      expect(response.body.rating).toBe(7);
      expect(response.body.ratingCount).toBe(1);
    });
  });

  describe('POST /api/planning/drills/:id/share', () => {
    let testDrill: any;

    beforeEach(async () => {
      testDrill = await drillRepository.save({
        name: 'Drill to Share',
        description: 'This drill will be shared',
        organizationId: testOrganizationId,
        isPublic: false,
        categoryId: testCategories[0].id,
        type: DrillType.SKILL,
        difficulty: DrillDifficulty.INTERMEDIATE,
        duration: 15,
        minPlayers: 6,
        maxPlayers: 18,
        equipment: ['pucks'],
        setup: mockSetup,
        instructions: mockInstructions,
        usageCount: 3,
        rating: 15,
        ratingCount: 3
      });
    });

    it('should make drill public', async () => {
      const response = await request(app)
        .post(`/api/planning/drills/${testDrill.id}/share`)
        .send({ makePublic: true })
        .expect(200);

      expect(response.body.isPublic).toBe(true);
      expect(response.body.shareCode).toBeDefined();

      // Verify in database
      const updated = await drillRepository.findOne(testDrill.id);
      expect(updated.isPublic).toBe(true);
    });

    it('should generate share link', async () => {
      const response = await request(app)
        .post(`/api/planning/drills/${testDrill.id}/share`)
        .send({ generateLink: true })
        .expect(200);

      expect(response.body.shareLink).toBeDefined();
      expect(response.body.shareCode).toBeDefined();
      expect(response.body.shareLink).toContain(response.body.shareCode);
    });

    it('should share with specific organizations', async () => {
      const shareData = {
        shareWithOrganizations: ['org-456', 'org-789'],
        permissions: ['view', 'duplicate']
      };

      const response = await request(app)
        .post(`/api/planning/drills/${testDrill.id}/share`)
        .send(shareData)
        .expect(200);

      expect(response.body.sharedWith).toEqual(shareData.shareWithOrganizations);
      expect(response.body.sharePermissions).toEqual(shareData.permissions);
    });

    it('should prevent sharing drills from other organizations', async () => {
      const otherOrgDrill = await drillRepository.save({
        name: 'Other Org Drill',
        description: 'Other org drill',
        organizationId: otherOrganizationId,
        isPublic: false,
        categoryId: testCategories[0].id,
        type: DrillType.SKILL,
        difficulty: DrillDifficulty.BEGINNER,
        duration: 10,
        minPlayers: 1,
        maxPlayers: 10,
        equipment: ['pucks'],
        setup: mockSetup,
        instructions: mockInstructions,
        usageCount: 0,
        rating: 0,
        ratingCount: 0
      });

      const response = await request(app)
        .post(`/api/planning/drills/${otherOrgDrill.id}/share`)
        .send({ makePublic: true })
        .expect(404);

      expect(response.body.error).toBe('Drill not found or no permission to share');
    });
  });

  describe('POST /api/planning/drills/:id/usage', () => {
    let testDrill: any;

    beforeEach(async () => {
      testDrill = await drillRepository.save({
        name: 'Usage Tracking Drill',
        description: 'This drill tracks usage',
        organizationId: testOrganizationId,
        isPublic: false,
        categoryId: testCategories[0].id,
        type: DrillType.SKILL,
        difficulty: DrillDifficulty.INTERMEDIATE,
        duration: 15,
        minPlayers: 6,
        maxPlayers: 18,
        equipment: ['pucks'],
        setup: mockSetup,
        instructions: mockInstructions,
        usageCount: 5,
        rating: 25,
        ratingCount: 5
      });
    });

    it('should increment usage count', async () => {
      const response = await request(app)
        .post(`/api/planning/drills/${testDrill.id}/usage`)
        .send()
        .expect(200);

      expect(response.body.usageCount).toBe(6);

      // Verify in database
      const updated = await drillRepository.findOne(testDrill.id);
      expect(updated.usageCount).toBe(6);
    });

    it('should track usage with metadata', async () => {
      const usageData = {
        practiceId: 'practice-123',
        sessionDuration: 20,
        playerCount: 15
      };

      const response = await request(app)
        .post(`/api/planning/drills/${testDrill.id}/usage`)
        .send(usageData)
        .expect(200);

      expect(response.body.usageCount).toBe(6);
      expect(response.body.lastUsed).toBeDefined();
    });

    it('should allow tracking usage of public drills', async () => {
      const publicDrill = await drillRepository.save({
        name: 'Public Usage Drill',
        description: 'Public drill for usage tracking',
        organizationId: otherOrganizationId,
        isPublic: true,
        categoryId: testCategories[0].id,
        type: DrillType.SKILL,
        difficulty: DrillDifficulty.BEGINNER,
        duration: 10,
        minPlayers: 1,
        maxPlayers: 10,
        equipment: ['pucks'],
        setup: mockSetup,
        instructions: mockInstructions,
        usageCount: 10,
        rating: 40,
        ratingCount: 8
      });

      const response = await request(app)
        .post(`/api/planning/drills/${publicDrill.id}/usage`)
        .send()
        .expect(200);

      expect(response.body.usageCount).toBe(11);
    });
  });

  describe('GET /api/planning/drills/categories', () => {
    it('should return drill categories', async () => {
      const response = await request(app)
        .get('/api/planning/drills/categories')
        .expect(200);

      expect(response.body).toHaveLength(testCategories.length);
      
      const categories = response.body;
      expect(categories.find((cat: any) => cat.name === 'Skating')).toBeDefined();
      expect(categories.find((cat: any) => cat.name === 'Power Skating')).toBeDefined();
      expect(categories.find((cat: any) => cat.name === 'Stickhandling')).toBeDefined();
      expect(categories.find((cat: any) => cat.name === 'Shooting')).toBeDefined();
    });

    it('should include category hierarchy', async () => {
      const response = await request(app)
        .get('/api/planning/drills/categories')
        .expect(200);

      const powerSkating = response.body.find((cat: any) => cat.name === 'Power Skating');
      expect(powerSkating.parentId).toBe(testCategories[0].id);
    });

    it('should include drill counts for each category', async () => {
      // Create some drills in different categories
      await drillRepository.save([
        {
          name: 'Skating Drill 1',
          description: 'Test drill',
          organizationId: testOrganizationId,
          isPublic: false,
          categoryId: testCategories[0].id,
          type: DrillType.SKILL,
          difficulty: DrillDifficulty.BEGINNER,
          duration: 10,
          minPlayers: 1,
          maxPlayers: 10,
          equipment: ['pucks'],
          setup: mockSetup,
          instructions: mockInstructions,
          usageCount: 0,
          rating: 0,
          ratingCount: 0
        },
        {
          name: 'Skating Drill 2',
          description: 'Test drill',
          organizationId: testOrganizationId,
          isPublic: false,
          categoryId: testCategories[0].id,
          type: DrillType.SKILL,
          difficulty: DrillDifficulty.BEGINNER,
          duration: 10,
          minPlayers: 1,
          maxPlayers: 10,
          equipment: ['pucks'],
          setup: mockSetup,
          instructions: mockInstructions,
          usageCount: 0,
          rating: 0,
          ratingCount: 0
        }
      ]);

      const response = await request(app)
        .get('/api/planning/drills/categories')
        .expect(200);

      const skatingCategory = response.body.find((cat: any) => cat.name === 'Skating');
      expect(skatingCategory.drillCount).toBe(2);
    });
  });

  describe('POST /api/planning/drills/bulk-import', () => {
    it('should import multiple drills', async () => {
      const drillsToImport = [
        {
          name: 'Bulk Import Drill 1',
          description: 'First bulk imported drill',
          categoryId: testCategories[0].id,
          type: DrillType.SKILL,
          difficulty: DrillDifficulty.BEGINNER,
          duration: 10,
          minPlayers: 4,
          maxPlayers: 12,
          equipment: ['pucks'],
          setup: mockSetup,
          instructions: mockInstructions.slice(0, 2)
        },
        {
          name: 'Bulk Import Drill 2',
          description: 'Second bulk imported drill',
          categoryId: testCategories[1].id,
          type: DrillType.CONDITIONING,
          difficulty: DrillDifficulty.INTERMEDIATE,
          duration: 15,
          minPlayers: 6,
          maxPlayers: 18,
          equipment: ['cones'],
          setup: mockSetup,
          instructions: mockInstructions
        }
      ];

      const response = await request(app)
        .post('/api/planning/drills/bulk-import')
        .send({ drills: drillsToImport })
        .expect(200);

      expect(response.body.imported).toBe(2);
      expect(response.body.failed).toBe(0);
      expect(response.body.drills).toHaveLength(2);

      // Verify in database
      const count = await drillRepository.count();
      expect(count).toBe(2);
    });

    it('should handle validation errors in bulk import', async () => {
      const drillsWithErrors = [
        {
          name: 'Valid Drill',
          description: 'This drill should import successfully',
          categoryId: testCategories[0].id,
          type: DrillType.SKILL,
          difficulty: DrillDifficulty.BEGINNER,
          duration: 10,
          minPlayers: 4,
          maxPlayers: 12,
          equipment: ['pucks'],
          setup: mockSetup,
          instructions: mockInstructions
        },
        {
          name: '', // Invalid empty name
          description: 'Invalid drill',
          categoryId: testCategories[0].id,
          type: DrillType.SKILL,
          difficulty: DrillDifficulty.BEGINNER,
          duration: 10,
          minPlayers: 4,
          maxPlayers: 12,
          equipment: ['pucks'],
          setup: mockSetup,
          instructions: mockInstructions
        }
      ];

      const response = await request(app)
        .post('/api/planning/drills/bulk-import')
        .send({ drills: drillsWithErrors })
        .expect(200);

      expect(response.body.imported).toBe(1);
      expect(response.body.failed).toBe(1);
      expect(response.body.errors).toHaveLength(1);
    });

    it('should handle duplicate detection in bulk import', async () => {
      // Create existing drill
      await drillRepository.save({
        name: 'Existing Drill',
        description: 'This drill already exists',
        organizationId: testOrganizationId,
        isPublic: false,
        categoryId: testCategories[0].id,
        type: DrillType.SKILL,
        difficulty: DrillDifficulty.BEGINNER,
        duration: 10,
        minPlayers: 1,
        maxPlayers: 10,
        equipment: ['pucks'],
        setup: mockSetup,
        instructions: mockInstructions,
        usageCount: 0,
        rating: 0,
        ratingCount: 0
      });

      const drillsWithDuplicate = [
        {
          name: 'Existing Drill', // This should be detected as duplicate
          description: 'This drill already exists',
          categoryId: testCategories[0].id,
          type: DrillType.SKILL,
          difficulty: DrillDifficulty.BEGINNER,
          duration: 10,
          minPlayers: 1,
          maxPlayers: 10,
          equipment: ['pucks'],
          setup: mockSetup,
          instructions: mockInstructions
        }
      ];

      const response = await request(app)
        .post('/api/planning/drills/bulk-import')
        .send({ 
          drills: drillsWithDuplicate,
          skipDuplicates: true 
        })
        .expect(200);

      expect(response.body.imported).toBe(0);
      expect(response.body.skipped).toBe(1);
      expect(response.body.duplicates).toHaveLength(1);
    });
  });

  describe('POST /api/planning/drills/validate-duplicate', () => {
    beforeEach(async () => {
      await drillRepository.save({
        name: 'Existing Drill',
        description: 'This drill already exists',
        organizationId: testOrganizationId,
        isPublic: false,
        categoryId: testCategories[0].id,
        type: DrillType.SKILL,
        difficulty: DrillDifficulty.BEGINNER,
        duration: 10,
        minPlayers: 1,
        maxPlayers: 10,
        equipment: ['pucks'],
        setup: mockSetup,
        instructions: mockInstructions,
        tags: ['existing', 'test'],
        usageCount: 5,
        rating: 25,
        ratingCount: 5
      });
    });

    it('should detect exact name duplicates', async () => {
      const drillToCheck = {
        name: 'Existing Drill',
        description: 'Different description',
        categoryId: testCategories[0].id
      };

      const response = await request(app)
        .post('/api/planning/drills/validate-duplicate')
        .send(drillToCheck)
        .expect(200);

      expect(response.body.isDuplicate).toBe(true);
      expect(response.body.duplicateType).toBe('exact_name');
      expect(response.body.existingDrills).toHaveLength(1);
      expect(response.body.existingDrills[0].name).toBe('Existing Drill');
    });

    it('should detect similar name duplicates', async () => {
      const drillToCheck = {
        name: 'Existing Drills', // Similar but not exact
        description: 'Similar drill',
        categoryId: testCategories[0].id
      };

      const response = await request(app)
        .post('/api/planning/drills/validate-duplicate')
        .send(drillToCheck)
        .expect(200);

      expect(response.body.isDuplicate).toBe(true);
      expect(response.body.duplicateType).toBe('similar_name');
      expect(response.body.similarity).toBeGreaterThan(0.8);
    });

    it('should not flag different drills as duplicates', async () => {
      const drillToCheck = {
        name: 'Completely Different Drill',
        description: 'Totally different drill',
        categoryId: testCategories[1].id
      };

      const response = await request(app)
        .post('/api/planning/drills/validate-duplicate')
        .send(drillToCheck)
        .expect(200);

      expect(response.body.isDuplicate).toBe(false);
      expect(response.body.existingDrills).toHaveLength(0);
    });

    it('should provide suggestions for similar drills', async () => {
      const drillToCheck = {
        name: 'Basic Skating Drill',
        description: 'Simple skating exercise',
        categoryId: testCategories[0].id,
        tags: ['skating', 'basic']
      };

      const response = await request(app)
        .post('/api/planning/drills/validate-duplicate')
        .send(drillToCheck)
        .expect(200);

      expect(response.body.suggestions).toBeDefined();
      expect(Array.isArray(response.body.suggestions)).toBe(true);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large drill libraries efficiently', async () => {
      // Create many drills
      const largeDrillSet = Array.from({ length: 500 }, (_, i) => ({
        name: `Performance Drill ${i}`,
        description: `Performance test drill number ${i}`,
        organizationId: testOrganizationId,
        isPublic: i % 10 === 0, // Make every 10th drill public
        categoryId: testCategories[i % testCategories.length].id,
        type: i % 2 === 0 ? DrillType.SKILL : DrillType.CONDITIONING,
        difficulty: Object.values(DrillDifficulty)[i % Object.values(DrillDifficulty).length],
        duration: 5 + (i % 20),
        minPlayers: 1 + (i % 10),
        maxPlayers: 10 + (i % 15),
        equipment: [`equipment-${i % 5}`],
        setup: mockSetup,
        instructions: mockInstructions,
        tags: [`tag-${i % 10}`, `category-${i % 5}`],
        ageGroups: [`U${8 + (i % 5) * 2}`],
        usageCount: i % 50,
        rating: (i % 10) * 5,
        ratingCount: Math.max(1, i % 10)
      }));

      await drillRepository.save(largeDrillSet);

      const startTime = Date.now();

      const response = await request(app)
        .get('/api/planning/drills?page=1&pageSize=50')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(3000); // Should respond within 3 seconds
      expect(response.body.data).toHaveLength(50);
      expect(response.body.pagination.total).toBe(500);
    });

    it('should handle complex search queries efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/planning/drills/search?q=performance&difficulty=intermediate&type=skill&ageGroup=U14&tags=tag-1,tag-2')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should handle concurrent drill creation', async () => {
      // Simulate concurrent drill creation
      const createPromises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/planning/drills')
          .send({
            name: `Concurrent Drill ${i}`,
            description: `Concurrently created drill ${i}`,
            categoryId: testCategories[0].id,
            type: DrillType.SKILL,
            difficulty: DrillDifficulty.BEGINNER,
            duration: 10,
            minPlayers: 1,
            maxPlayers: 10,
            equipment: ['pucks'],
            setup: mockSetup,
            instructions: mockInstructions
          })
      );

      const results = await Promise.allSettled(createPromises);
      
      // All creations should succeed
      const successful = results.filter(result => result.status === 'fulfilled');
      expect(successful.length).toBe(5);

      // Verify all drills were created
      const count = await drillRepository.count();
      expect(count).toBe(5);
    });

    it('should validate instruction duration consistency', async () => {
      const inconsistentInstructions = [
        { step: 1, description: 'Step 1', duration: 60 },
        { step: 2, description: 'Step 2', duration: 60 },
        { step: 3, description: 'Step 3', duration: 60 }
      ];

      const drillData = {
        name: 'Inconsistent Drill',
        description: 'Drill with inconsistent timing',
        categoryId: testCategories[0].id,
        type: DrillType.SKILL,
        difficulty: DrillDifficulty.INTERMEDIATE,
        duration: 120, // Total duration less than sum of instructions (180)
        minPlayers: 1,
        maxPlayers: 10,
        equipment: ['pucks'],
        setup: mockSetup,
        instructions: inconsistentInstructions
      };

      const response = await request(app)
        .post('/api/planning/drills')
        .send(drillData)
        .expect(400);

      expect(response.body.error).toContain('total duration does not match instruction durations');
    });
  });
});