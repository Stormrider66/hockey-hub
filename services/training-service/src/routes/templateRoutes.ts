// @ts-nocheck - Template routes with pagination
import { Router, type Router as ExpressRouter } from 'express';
import { AppDataSource } from '../config/database';
import { ExerciseTemplate } from '../entities';
import { Like } from 'typeorm';
import { parsePaginationParams, paginate } from '@hockey-hub/shared-lib';

const router: ExpressRouter = Router();

// Get all exercise templates with pagination
router.get('/templates', async (req, res) => {
  try {
    const { category, search, muscleGroup, equipment } = req.query;
    
    // Parse pagination parameters
    const paginationParams = parsePaginationParams(req.query, {
      page: 1,
      limit: 20,
      maxLimit: 100
    });
    
    const templateRepo = AppDataSource.getRepository(ExerciseTemplate);
    
    let query = templateRepo.createQueryBuilder('template')
      .where('template.isActive = :isActive', { isActive: true })
      .orderBy('template.name', 'ASC');

    if (category) {
      query = query.andWhere('template.category = :category', { category });
    }

    if (search) {
      query = query.andWhere('LOWER(template.name) LIKE LOWER(:search)', { 
        search: `%${search}%` 
      });
    }

    if (muscleGroup) {
      query = query.andWhere(':muscleGroup = ANY(template.muscleGroups)', { muscleGroup });
    }

    if (equipment) {
      query = query.andWhere(':equipment = ANY(template.equipment)', { equipment });
    }

    // Apply pagination
    const result = await paginate(query, paginationParams);
    
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error fetching exercise templates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch exercise templates' });
  }
});

// Get single exercise template
router.get('/templates/:id', async (req, res) => {
  try {
    const templateRepo = AppDataSource.getRepository(ExerciseTemplate);
    const template = await templateRepo.findOne({
      where: { id: req.params.id }
    });

    if (!template) {
      return res.status(404).json({ success: false, error: 'Exercise template not found' });
    }

    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Error fetching exercise template:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch exercise template' });
  }
});

// Create exercise template
router.post('/templates', async (req, res) => {
  try {
    const templateRepo = AppDataSource.getRepository(ExerciseTemplate);
    const template = templateRepo.create({
      ...req.body,
      createdBy: req.body.userId || 'system' // Should come from auth middleware
    });

    const savedTemplate = await templateRepo.save(template);
    res.status(201).json({ success: true, data: savedTemplate });
  } catch (error) {
    console.error('Error creating exercise template:', error);
    res.status(500).json({ success: false, error: 'Failed to create exercise template' });
  }
});

// Update exercise template
router.put('/templates/:id', async (req, res) => {
  try {
    const templateRepo = AppDataSource.getRepository(ExerciseTemplate);
    const template = await templateRepo.findOne({
      where: { id: req.params.id }
    });

    if (!template) {
      return res.status(404).json({ success: false, error: 'Exercise template not found' });
    }

    const updatedTemplate = await templateRepo.save({
      ...template,
      ...req.body,
      id: template.id // Ensure ID doesn't change
    });

    res.json({ success: true, data: updatedTemplate });
  } catch (error) {
    console.error('Error updating exercise template:', error);
    res.status(500).json({ success: false, error: 'Failed to update exercise template' });
  }
});

// Delete exercise template (soft delete)
router.delete('/templates/:id', async (req, res) => {
  try {
    const templateRepo = AppDataSource.getRepository(ExerciseTemplate);
    const template = await templateRepo.findOne({
      where: { id: req.params.id }
    });

    if (!template) {
      return res.status(404).json({ success: false, error: 'Exercise template not found' });
    }

    template.isActive = false;
    await templateRepo.save(template);

    res.json({ success: true, message: 'Exercise template deactivated successfully' });
  } catch (error) {
    console.error('Error deleting exercise template:', error);
    res.status(500).json({ success: false, error: 'Failed to delete exercise template' });
  }
});

// Get popular templates with pagination
router.get('/templates/popular', async (req, res) => {
  try {
    // Parse pagination parameters with a smaller default limit for popular items
    const paginationParams = parsePaginationParams(req.query, {
      page: 1,
      limit: 10,
      maxLimit: 50
    });
    
    const templateRepo = AppDataSource.getRepository(ExerciseTemplate);
    
    const query = templateRepo.createQueryBuilder('template')
      .where('template.isActive = :isActive', { isActive: true })
      .orderBy('template.createdAt', 'DESC'); // In a real implementation, this would be based on usage statistics
    
    // Apply pagination
    const result = await paginate(query, paginationParams);

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error fetching popular templates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch popular templates' });
  }
});

export default router;