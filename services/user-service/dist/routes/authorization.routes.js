"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorization_controller_1 = require("../controllers/authorization.controller");
const authenticateToken_1 = require("../middleware/authenticateToken"); // Corrected import name
const router = (0, express_1.Router)();
/**
 * @swagger
 * /authorization/check:
 *   get:
 *     summary: Check if a user has permission for an action
 *     tags: [Authorization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the user performing the action
 *       - in: query
 *         name: action
 *         required: true
 *         schema:
 *           type: string
 *         description: The action being performed (e.g., 'read', 'update')
 *       - in: query
 *         name: resourceType
 *         required: true
 *         schema:
 *           type: string
 *         description: The type of resource being accessed (e.g., 'team', 'user')
 *       - in: query
 *         name: resourceId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Optional ID of the specific resource being accessed
 *     responses:
 *       200:
 *         description: Authorization check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authorized:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Bad Request - Missing required query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User does not have permission (handled within the boolean response)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error' # Potentially, or just returns { authorized: false }
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/check', authenticateToken_1.authenticateToken, // Use the correct middleware name
authorization_controller_1.checkAuthorizationController);
exports.default = router;
//# sourceMappingURL=authorization.routes.js.map