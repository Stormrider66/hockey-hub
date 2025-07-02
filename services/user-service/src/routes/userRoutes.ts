import { Router } from 'express';
import { authMiddleware } from '@hockey-hub/shared-lib';
import { CachedUserRepository } from '../repositories/CachedUserRepository';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Initialize cached repository
let cachedUserRepo: CachedUserRepository;

// Middleware to ensure repository is initialized
const ensureRepository = (req: any, res: any, next: any) => {
  if (!cachedUserRepo) {
    cachedUserRepo = new CachedUserRepository();
  }
  next();
};

router.use(ensureRepository);

// Get user by ID with caching
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    const user = await cachedUserRepo.findOne(
      {
        where: { id: userId },
        relations: ['organization', 'teams', 'roles']
      },
      {
        key: `user:${userId}`,
        ttl: 300
      }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Get users with pagination and caching
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    if (req.query.organizationId) {
      // Use optimized organization query
      const { users, total } = await cachedUserRepo.findByOrganization(
        req.query.organizationId as string,
        { skip, take: limit }
      );
      
      return res.json({
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    }
    
    if (req.query.teamId) {
      // Use optimized team query
      const users = await cachedUserRepo.findByTeam(req.query.teamId as string);
      
      // Apply pagination manually for team results
      const paginatedUsers = users.slice(skip, skip + limit);
      
      return res.json({
        success: true,
        data: paginatedUsers,
        pagination: {
          page,
          limit,
          total: users.length,
          pages: Math.ceil(users.length / limit)
        }
      });
    }
    
    // For general queries, use the base cached repository
    const result = await cachedUserRepo.findMany(
      {
        skip,
        take: limit,
        relations: ['organization', 'teams', 'roles'],
        where: {
          ...(req.query.role && { roles: { name: req.query.role } })
        }
      },
      {
        ttl: 60 // 1 minute for lists
      }
    );
    
    const total = await cachedUserRepo.count();
    
    res.json({
      success: true,
      data: result,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user (invalidates cache)
router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    const user = await cachedUserRepo.findOne({
      where: { id: userId },
      relations: ['teams']
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Update user fields
    Object.assign(user, req.body);
    
    // Save and invalidate cache
    const updatedUser = await cachedUserRepo.saveUser(user);
    
    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// Delete user (invalidates cache)
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    const user = await cachedUserRepo.findOne({
      where: { id: userId },
      relations: ['teams']
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Soft delete with cache invalidation
    await cachedUserRepo.deleteUser(user);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get user statistics
router.get('/stats/:organizationId?', async (req, res, next) => {
  try {
    const organizationId = req.params.organizationId || req.query.organizationId as string;
    
    const stats = await cachedUserRepo.getUserStats(organizationId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

export default router;