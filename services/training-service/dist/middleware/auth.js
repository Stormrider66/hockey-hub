"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePlayer = exports.requirePhysicalTrainer = exports.requireCoach = exports.canExecuteTraining = exports.canDeleteTraining = exports.canUpdateTraining = exports.canReadTraining = exports.canCreateTraining = exports.verifyServiceAuth = exports.requireOrganization = exports.requireRole = exports.requireAnyPermission = exports.requirePermission = exports.requireAuth = exports.extractUser = exports.auth = void 0;
const shared_lib_1 = require("@hockey-hub/shared-lib");
// Create auth middleware instance for training service
exports.auth = (0, shared_lib_1.createAuthMiddleware)({
    serviceName: 'training-service'
});
// Export commonly used middleware
exports.extractUser = exports.auth.extractUser();
exports.requireAuth = exports.auth.requireAuth();
const requirePermission = (permission) => exports.auth.requirePermission(permission);
exports.requirePermission = requirePermission;
const requireAnyPermission = (permissions) => exports.auth.requireAnyPermission(permissions);
exports.requireAnyPermission = requireAnyPermission;
const requireRole = (role) => exports.auth.requireRole(role);
exports.requireRole = requireRole;
exports.requireOrganization = exports.auth.requireOrganization();
exports.verifyServiceAuth = exports.auth.verifyServiceAuth();
// Training-specific permission checks
exports.canCreateTraining = (0, exports.requirePermission)('training.create');
exports.canReadTraining = (0, exports.requirePermission)('training.read');
exports.canUpdateTraining = (0, exports.requirePermission)('training.update');
exports.canDeleteTraining = (0, exports.requirePermission)('training.delete');
exports.canExecuteTraining = (0, exports.requirePermission)('training.execute');
// Role-based shortcuts
exports.requireCoach = (0, exports.requireRole)('coach');
exports.requirePhysicalTrainer = (0, exports.requireRole)('physical_trainer');
exports.requirePlayer = (0, exports.requireRole)('player');
//# sourceMappingURL=auth.js.map