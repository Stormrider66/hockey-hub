import { Router } from 'express';
import authRouter from './auth'; // Import the auth router

const router = Router();

router.use('/auth', authRouter); // Use the auth router for /auth paths

// TODO: Add other routes (e.g., users, teams, organizations)
// router.use('/users', userRouter);
// router.use('/teams', teamRouter);
// router.use('/organizations', organizationRouter);

export default router; 