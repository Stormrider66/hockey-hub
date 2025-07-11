"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJWT = exports.formatDate = exports.USER_ROLES = void 0;
// Common constants
exports.USER_ROLES = {
    ADMIN: 'admin',
    CLUB_ADMIN: 'club_admin',
    COACH: 'coach',
    PLAYER: 'player',
    PARENT: 'parent',
    MEDICAL_STAFF: 'medical_staff',
    EQUIPMENT_MANAGER: 'equipment_manager',
    PHYSICAL_TRAINER: 'physical_trainer'
};
// Base entities
__exportStar(require("./entities/BaseEntity"), exports);
// DTOs
__exportStar(require("./dto"), exports);
// Services
__exportStar(require("./services"), exports);
// Saga
__exportStar(require("./saga"), exports);
// Cache
__exportStar(require("./cache"), exports);
// Validation
__exportStar(require("./validation"), exports);
// Middleware
__exportStar(require("./middleware"), exports);
// Errors
__exportStar(require("./errors"), exports);
// Utilities
__exportStar(require("./utils"), exports);
// Socket events
__exportStar(require("./types/socket-events"), exports);
// Events
__exportStar(require("./events/EventBus"), exports);
__exportStar(require("./events/EventFactory"), exports);
__exportStar(require("./events/EventPublisher"), exports);
__exportStar(require("./events/training-events"), exports);
__exportStar(require("./events/training-event-listeners"), exports);
// Testing utilities (only export in non-production environments)
if (process.env.NODE_ENV !== 'production') {
    module.exports.testing = require('./testing');
}
// Utility functions
const formatDate = (date) => {
    return date.toISOString().split('T')[0];
};
exports.formatDate = formatDate;
const parseJWT = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(Buffer.from(base64, 'base64').toString());
    }
    catch (error) {
        return null;
    }
};
exports.parseJWT = parseJWT;
//# sourceMappingURL=index.js.map