"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorizationController_1 = require("../controllers/authorizationController");
const authenticateToken_1 = require("../middleware/authenticateToken");
const router = (0, express_1.Router)();
// ... (Swagger comments remain the same) ...
router.get('/check', authenticateToken_1.authenticateToken, authorizationController_1.checkPermission);
exports.default = router;
//# sourceMappingURL=authorizationRoutes.js.map