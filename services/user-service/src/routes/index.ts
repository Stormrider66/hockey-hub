import { Router } from 'express';
import authRoutes from './authRoutes';
import authorizationRoutes from './authorizationRoutes';
import teamRoutes from './teamRoutes';
import parentRoutes from './parentRoutes';
import userRoutes from './userRoutes';
import organizationRoutes from './organizationRoutes';
// import roleRoutes from './roleRoutes'; // Comment out for now

const router: Router = Router();

// Mount authentication routes
router.use('/auth', authRoutes);

// Mount authorization routes
router.use('/authorization', authorizationRoutes);

// Mount team routes
router.use('/teams', teamRoutes);

// Mount parent-child link routes
router.use('/parent-child', parentRoutes);

// Mount user routes
router.use('/users', userRoutes);

// Mount organization routes
router.use('/organizations', organizationRoutes);

// Mount role routes
// router.use('/roles', roleRoutes); // Comment out for now

// TODO: Add other routes (e.g., organizations)
// router.use('/organizations', organizationRouter);

export default router; 