"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParentsHandler = exports.getChildrenHandler = exports.removeParentLinkHandler = exports.addParentLinkHandler = void 0;
const parentService_1 = require("../services/parentService");
const serviceErrors_1 = require("../errors/serviceErrors");
const teamService_1 = require("../services/teamService");
const addParentLinkHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const parentService = new parentService_1.ParentService();
    try {
        // TODO: Add authorization check - only admins/club_admins can create links?
        const link = yield parentService.addParentChildLink(req.body);
        res.status(201).json({ success: true, data: link });
    }
    catch (error) {
        if (error instanceof serviceErrors_1.NotFoundError || error instanceof serviceErrors_1.ConflictError) {
            return res.status(error.statusCode).json({
                error: true,
                message: error.message,
                code: error.code
            });
        }
        next(error);
    }
});
exports.addParentLinkHandler = addParentLinkHandler;
const removeParentLinkHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const parentService = new parentService_1.ParentService();
    try {
        // TODO: Add authorization check - only admins/club_admins can remove links?
        yield parentService.removeParentChildLink(req.params.linkId);
        res.status(200).json({ success: true, message: 'Parent-child link removed successfully' });
    }
    catch (error) {
        if (error instanceof serviceErrors_1.NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'LINK_NOT_FOUND' });
        }
        next(error);
    }
});
exports.removeParentLinkHandler = removeParentLinkHandler;
const getChildrenHandler = (req, // userId here is the parent's ID
res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const parentService = new parentService_1.ParentService();
    try {
        const user = req.user;
        const targetUserId = req.params.userId;
        // Authorization Check: Allow users to see their own children, or admins/coaches to see others'?
        if (user.userId !== targetUserId && !user.roles.includes('admin') && !user.roles.includes('club_admin')) {
            // More granular checks might be needed for coaches etc.
            return res.status(403).json({ error: true, message: 'Insufficient permissions', code: 'FORBIDDEN' });
        }
        const children = yield parentService.getChildrenForParent(targetUserId);
        // Map to basic info, excluding sensitive data
        const responseData = children.map(child => ({
            userId: child.id,
            firstName: child.firstName,
            lastName: child.lastName,
            // Add other relevant non-sensitive fields
        }));
        res.status(200).json({ success: true, data: responseData });
    }
    catch (error) {
        if (error instanceof serviceErrors_1.NotFoundError) { // Should not happen if auth checks parent existence
            return res.status(404).json({ error: true, message: error.message, code: 'PARENT_NOT_FOUND' });
        }
        next(error);
    }
});
exports.getChildrenHandler = getChildrenHandler;
const getParentsHandler = (req, // userId here is the child's ID
res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const parentService = new parentService_1.ParentService();
    try {
        const user = req.user;
        const targetUserId = req.params.userId;
        // Authorization Check: Allow users to see their own parents, or relevant staff?
        let canAccess = false;
        if (user.userId === targetUserId)
            canAccess = true; // Own parents
        if (user.roles.includes('admin') || user.roles.includes('club_admin'))
            canAccess = true; // Admins
        // Coach/Rehab/Fys check (if player is in their team)
        if (user.teamIds && user.teamIds.length > 0) {
            const teamService = new teamService_1.TeamService();
            const isMember = yield new teamService_1.TeamService().isUserMemberOfTeam(targetUserId, user.teamIds[0]); // Example check
            if (isMember && (user.roles.includes('coach') || user.roles.includes('rehab') || user.roles.includes('fys_coach'))) {
                canAccess = true;
            }
        }
        if (!canAccess) {
            return res.status(403).json({ error: true, message: 'Insufficient permissions', code: 'FORBIDDEN' });
        }
        const parents = yield parentService.getParentsForChild(targetUserId);
        // Map to basic info, excluding sensitive data
        const responseData = parents.map(parent => ({
            userId: parent.id,
            firstName: parent.firstName,
            lastName: parent.lastName,
            email: parent.email, // Consider if needed
            phone: parent.phone, // Consider if needed
            // Add relationship info from PlayerParentLink if needed
        }));
        res.status(200).json({ success: true, data: responseData });
    }
    catch (error) {
        if (error instanceof serviceErrors_1.NotFoundError) { // Should not happen if auth checks child existence
            return res.status(404).json({ error: true, message: error.message, code: 'CHILD_NOT_FOUND' });
        }
        next(error);
    }
});
exports.getParentsHandler = getParentsHandler;
//# sourceMappingURL=parentController.js.map