"use strict";
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
// Utility functions
var formatDate = function (date) {
    return date.toISOString().split('T')[0];
};
exports.formatDate = formatDate;
var parseJWT = function (token) {
    try {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(Buffer.from(base64, 'base64').toString());
    }
    catch (error) {
        return null;
    }
};
exports.parseJWT = parseJWT;
