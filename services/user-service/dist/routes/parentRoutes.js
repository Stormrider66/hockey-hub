"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validateRequest_1 = require("../middleware/validateRequest");
const authenticateToken_1 = require("../middleware/authenticateToken");
const authorize_1 = require("../middleware/authorize");
const parentValidations_1 = require("../validations/parentValidations");
const parentController_1 = require("../controllers/parentController");
const router = (0, express_1.Router)();
// All parent-child routes require authentication
router.use(authenticateToken_1.authenticateToken);
// POST /api/v1/parent-child - Create a new parent-child link
router.post('/', // Route for creating links
(0, authorize_1.authorize)({ allowedRoles: ['admin', 'club_admin'] }), // Only admins can create links
(0, validateRequest_1.validateRequest)(parentValidations_1.addParentLinkSchema), parentController_1.addParentLinkHandler);
// DELETE /api/v1/parent-child/:linkId - Remove a parent-child link
router.delete('/:linkId', // Route for removing links by ID
(0, authorize_1.authorize)({ allowedRoles: ['admin', 'club_admin'] }), // Only admins can remove links
(0, validateRequest_1.validateRequest)(parentValidations_1.removeParentLinkSchema), parentController_1.removeParentLinkHandler);
// GET /api/v1/users/:userId/children - Get children for a parent user
router.get('/users/:userId/children', // Mounted under /users for context
(0, validateRequest_1.validateRequest)(parentValidations_1.getRelatedUsersSchema), 
// Authorization is handled within the controller for context (checking if user is self or admin)
parentController_1.getChildrenHandler);
// GET /api/v1/users/:userId/parents - Get parents for a child user
router.get('/users/:userId/parents', // Mounted under /users for context
(0, validateRequest_1.validateRequest)(parentValidations_1.getRelatedUsersSchema), 
// Authorization is handled within the controller for context (checking user role/relationship)
parentController_1.getParentsHandler);
exports.default = router;
//# sourceMappingURL=parentRoutes.js.map