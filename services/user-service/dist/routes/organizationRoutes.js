"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validateRequest_1 = require("../middleware/validateRequest");
const authenticateToken_1 = require("../middleware/authenticateToken");
const authorize_1 = require("../middleware/authorize");
const organizationValidations_1 = require("../validations/organizationValidations");
const organizationController_1 = require("../controllers/organizationController");
const router = (0, express_1.Router)();
// All organization routes require authentication
router.use(authenticateToken_1.authenticateToken);
// GET /api/v1/organizations - List all organizations (Admin only)
router.get('/', (0, authorize_1.authorize)({ allowedRoles: ['admin'] }), // Only system admin can list all orgs
(0, validateRequest_1.validateRequest)(organizationValidations_1.listOrganizationsSchema), organizationController_1.listOrganizationsHandler // Cast to any to bypass type mismatch after validation middleware
);
// POST /api/v1/organizations - Create a new organization (Admin only)
router.post('/', (0, authorize_1.authorize)({ allowedRoles: ['admin'] }), (0, validateRequest_1.validateRequest)(organizationValidations_1.createOrganizationSchema), organizationController_1.createOrganizationHandler);
// GET /api/v1/organizations/:organizationId - Get organization details
router.get('/:organizationId', (0, validateRequest_1.validateRequest)(organizationValidations_1.getOrganizationSchema), 
// Authorization handled within controller (Admin or member/club_admin of the org)
organizationController_1.getOrganizationHandler);
// PUT /api/v1/organizations/:organizationId - Update organization details
router.put('/:organizationId', (0, validateRequest_1.validateRequest)(organizationValidations_1.updateOrganizationSchema), 
// Authorization handled within controller (Admin or club_admin of this org)
organizationController_1.updateOrganizationHandler);
// DELETE /api/v1/organizations/:organizationId - Delete an organization (Admin only)
router.delete('/:organizationId', (0, validateRequest_1.validateRequest)(organizationValidations_1.getOrganizationSchema), (0, authorize_1.authorize)({ allowedRoles: ['admin'] }), organizationController_1.deleteOrganizationHandler);
exports.default = router;
//# sourceMappingURL=organizationRoutes.js.map