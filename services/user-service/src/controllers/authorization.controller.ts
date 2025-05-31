import { Request, Response, NextFunction } from 'express';
import { canPerformAction } from '../services/authorizationService';
import logger from '../config/logger';
// import { HttpError } from '../errors/httpError'; // Keep commented out unless needed

/**
 * Controller to handle authorization checks.
 */
export const checkAuthorizationController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract parameters from query string, including the optional resourceOrganizationId
        const { userId, action, resourceType, resourceId, resourceOrganizationId } = req.query;

        // Basic validation
        if (!userId || !action || !resourceType) {
            return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required query parameters: userId, action, resourceType' });
        }

        // Ensure primary parameters are strings
        if (typeof userId !== 'string' || typeof action !== 'string' || typeof resourceType !== 'string') {
             return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid parameter types for userId, action, or resourceType' });
        }

        // Validate optional resourceId and resourceOrganizationId if present
        if (resourceId && typeof resourceId !== 'string') {
             return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid parameter type for resourceId' });
        }
        if (resourceOrganizationId && typeof resourceOrganizationId !== 'string') {
             return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid parameter type for resourceOrganizationId' });
        }

        logger.debug(`Received auth check request: userId=${userId}, action=${action}, resourceType=${resourceType}, resourceId=${resourceId || 'N/A'}, resourceOrgId=${resourceOrganizationId || 'N/A'}`);

        // Perform the authorization check using the service, passing the org ID
        const isAuthorized = await canPerformAction(
            userId, 
            action, 
            resourceType, 
            resourceId, 
            resourceOrganizationId // Pass the org ID
        );

        logger.info(`Authorization check result for user ${userId}: ${isAuthorized}`);

        // Send the response
        res.status(200).json({ authorized: isAuthorized });

    } catch (error) {
        logger.error('Error in checkAuthorizationController', { error });
        // Pass error to the centralized error handler
        next(error);
    }
}; 