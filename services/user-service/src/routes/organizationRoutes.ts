import { Router } from 'express';
import { validateRequest } from '../middleware/validateRequest';
import { authenticateToken } from '../middleware/authenticateToken';
import { authorize } from '../middleware/authorize';
import {
    listOrganizationsSchema,
    getOrganizationSchema,
    createOrganizationSchema,
    updateOrganizationSchema
} from '../validations/organizationValidations';
import {
    listOrganizationsHandler,
    getOrganizationHandler,
    createOrganizationHandler,
    updateOrganizationHandler,
    deleteOrganizationHandler
} from '../controllers/organizationController';

const router: Router = Router();

// All organization routes require authentication
router.use(authenticateToken);

// GET /api/v1/organizations - List all organizations (Admin only)
router.get(
    '/',
    authorize({ allowedRoles: ['admin'] }), // Only system admin can list all orgs
    validateRequest(listOrganizationsSchema),
    listOrganizationsHandler as any // Cast to any to bypass type mismatch after validation middleware
);

// POST /api/v1/organizations - Create a new organization (Admin only)
router.post(
    '/',
    authorize({ allowedRoles: ['admin'] }), 
    validateRequest(createOrganizationSchema),
    createOrganizationHandler
);

// GET /api/v1/organizations/:organizationId - Get organization details
router.get(
    '/:organizationId',
    validateRequest(getOrganizationSchema),
    // Authorization handled within controller (Admin or member/club_admin of the org)
    getOrganizationHandler 
);

// PUT /api/v1/organizations/:organizationId - Update organization details
router.put(
    '/:organizationId',
    validateRequest(updateOrganizationSchema),
    // Authorization handled within controller (Admin or club_admin of this org)
    updateOrganizationHandler
);

// DELETE /api/v1/organizations/:organizationId - Delete an organization (Admin only)
router.delete(
    '/:organizationId',
    validateRequest(getOrganizationSchema),
    authorize({ allowedRoles: ['admin'] }),
    deleteOrganizationHandler
);

export default router; 