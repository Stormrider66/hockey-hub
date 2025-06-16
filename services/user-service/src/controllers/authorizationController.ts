import { Request, Response, NextFunction } from 'express';
import { canPerformAction } from '../services/authorizationService';
import logger from '../config/logger';

/**
 * Controller to handle permission check requests.
 */
export const checkPermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Extract authenticated user ID from request (assuming auth middleware adds req.user)
    // Ensure your auth middleware correctly populates req.user.id
    const userId = req.user?.id;
    if (!userId) {
        // This should ideally be caught by the auth middleware, but double-check
        // Use standard Error, potentially add a status code if needed by error handler
        const error = new Error('User not authenticated');
        (error as any).statusCode = 401;
        return next(error);
    }

    // Extract parameters from query string
    const { action, resourceType, resourceId } = req.query;

    // Basic validation
    if (typeof action !== 'string' || typeof resourceType !== 'string') {
        // Use standard Error
        const error = new Error('Missing required query parameters: action, resourceType');
        (error as any).statusCode = 400;
        return next(error);
    }
    if (resourceId !== undefined && typeof resourceId !== 'string') {
         // Use standard Error
         const error = new Error('Invalid query parameter: resourceId must be a string');
         (error as any).statusCode = 400;
         return next(error);
    }

    try {
        logger.debug('Checking permission via API', { userId, action, resourceType, resourceId });
        const isAuthorized = await canPerformAction(userId, action, resourceType, resourceId);
        
        res.status(200).json({ authorized: isAuthorized });

    } catch (error) {
        logger.error('Error during permission check', { error, userId, action, resourceType, resourceId });
        next(error); // Pass error to the global error handler
    }
}; 