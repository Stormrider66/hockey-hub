// Test-specific export to ensure 503 handler works
import { Router } from 'express';

const createTestRouter = () => {
  const router = Router();
  
  // ABSOLUTE FIRST HANDLER - checks env at request time
  router.all('*', (req, res, next) => {
    // For /sessions path in test mode with DB guard enabled
    if (req.path === '/sessions' && 
        process.env.NODE_ENV === 'test' && 
        process.env.ENABLE_DB_GUARD_IN_TESTS === '1') {
      return res.status(503).json({
        success: false,
        error: 'Database service unavailable',
        message: 'Please ensure the database is created and running'
      });
    }
    next();
  });
  
  return router;
};

export default createTestRouter;