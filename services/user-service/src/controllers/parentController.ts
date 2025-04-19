import { Request, Response, NextFunction } from 'express';
import { ParentService } from '../services/parentService';
import { AddParentLinkInput, RemoveParentLinkInput, GetRelatedUsersInput } from '../validations/parentValidations';
import { NotFoundError, ConflictError } from '../errors/serviceErrors';
import { AuthenticatedUser } from '../middleware/authenticateToken';
import { TeamService } from '../services/teamService';

const parentService = new ParentService();

export const addParentLinkHandler = async (
    req: Request<{}, {}, AddParentLinkInput>,
    res: Response,
    next: NextFunction
) => {
    try {
        // TODO: Add authorization check - only admins/club_admins can create links?
        const link = await parentService.addParentChildLink(req.body);
        res.status(201).json({ success: true, data: link });
    } catch (error) {
        if (error instanceof NotFoundError || error instanceof ConflictError) {
            return res.status(error.statusCode).json({ 
                error: true, 
                message: error.message, 
                code: error.code 
            });
        }
        next(error);
    }
};

export const removeParentLinkHandler = async (
    req: Request<RemoveParentLinkInput>,
    res: Response,
    next: NextFunction
) => {
    try {
        // TODO: Add authorization check - only admins/club_admins can remove links?
        await parentService.removeParentChildLink(req.params.linkId);
        res.status(200).json({ success: true, message: 'Parent-child link removed successfully' });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'LINK_NOT_FOUND' });
        }
        next(error);
    }
};

export const getChildrenHandler = async (
    req: Request<GetRelatedUsersInput>, // userId here is the parent's ID
    res: Response,
    next: NextFunction
) => {
    try {
        const user = req.user as AuthenticatedUser;
        const targetUserId = req.params.userId;

        // Authorization Check: Allow users to see their own children, or admins/coaches to see others'?
        if (user.userId !== targetUserId && !user.roles.includes('admin') && !user.roles.includes('club_admin')) {
             // More granular checks might be needed for coaches etc.
            return res.status(403).json({ error: true, message: 'Insufficient permissions', code: 'FORBIDDEN' });
        }

        const children = await parentService.getChildrenForParent(targetUserId);
        // Map to basic info, excluding sensitive data
        const responseData = children.map(child => ({ 
            userId: child.id, 
            firstName: child.firstName, 
            lastName: child.lastName, 
            // Add other relevant non-sensitive fields
        }));
        res.status(200).json({ success: true, data: responseData });
    } catch (error) {
        if (error instanceof NotFoundError) { // Should not happen if auth checks parent existence
             return res.status(404).json({ error: true, message: error.message, code: 'PARENT_NOT_FOUND' });
        }
        next(error);
    }
};

export const getParentsHandler = async (
    req: Request<GetRelatedUsersInput>, // userId here is the child's ID
    res: Response,
    next: NextFunction
) => {
     try {
        const user = req.user as AuthenticatedUser;
        const targetUserId = req.params.userId;
        
        // Authorization Check: Allow users to see their own parents, or relevant staff?
        let canAccess = false;
        if(user.userId === targetUserId) canAccess = true; // Own parents
        if(user.roles.includes('admin') || user.roles.includes('club_admin')) canAccess = true; // Admins
        // Coach/Rehab/Fys check (if player is in their team)
        if (user.teamIds && user.teamIds.length > 0) {
            const isMember = await new TeamService().isUserMemberOfTeam(targetUserId, user.teamIds[0]); // Example check
            if (isMember && (user.roles.includes('coach') || user.roles.includes('rehab') || user.roles.includes('fys_coach'))) {
                canAccess = true;
            }
        }
        
        if (!canAccess) {
             return res.status(403).json({ error: true, message: 'Insufficient permissions', code: 'FORBIDDEN' });
        }

        const parents = await parentService.getParentsForChild(targetUserId);
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
    } catch (error) {
         if (error instanceof NotFoundError) { // Should not happen if auth checks child existence
             return res.status(404).json({ error: true, message: error.message, code: 'CHILD_NOT_FOUND' });
        }
        next(error);
    }
}; 