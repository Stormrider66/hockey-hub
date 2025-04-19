import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { ParentService } from '../../services/parentService';
import parentRoutes from '../parentRoutes'; // Assuming this is the correct export
import userRoutes from '../userRoutes'; // Need to mount under /users too
import { authenticateToken, AuthenticatedUser } from '../../middleware/authenticateToken';
import { authorize } from '../../middleware/authorize';
import { validateRequest } from '../../middleware/validateRequest';
import { addParentLinkSchema, removeParentLinkSchema, getRelatedUsersSchema } from '../../validations/parentValidations';
import { ConflictError, NotFoundError, AuthorizationError } from '../../errors/serviceErrors';
import { PlayerParentLink } from '../../entities/PlayerParentLink';
import { User } from '../../entities/User';

// Mock dependencies
jest.mock('../../services/parentService');
jest.mock('../../middleware/authenticateToken');
jest.mock('../../middleware/authorize');
jest.mock('../../middleware/validateRequest');
// Mock TeamService needed for auth checks in controller
jest.mock('../../services/teamService'); 

const MockParentService = ParentService as jest.MockedClass<typeof ParentService>;
const mockAuthenticateToken = authenticateToken as jest.Mock;
const mockAuthorize = authorize as jest.Mock;
const mockValidateRequest = validateRequest as jest.Mock;

// Mock user for tests
const mockAdminUser: AuthenticatedUser = {
    userId: 'admin-user-id',
    roles: ['admin'],
    permissions: ['parent-child:*'], // Assuming admin has all permissions
    organizationId: 'org-1',
    email: 'admin@test.com',
    lang: 'en',
    teamIds: [] // Add missing teamIds
};
const mockParentUser: AuthenticatedUser = {
    userId: 'parent-user-id',
    roles: ['parent'],
    permissions: [],
    organizationId: 'org-1',
    email: 'parent@test.com',
    lang: 'en',
    teamIds: [] // Add missing teamIds
};

// Setup test app
const app = express();
app.use(express.json());
// Mount routes like in src/routes/index.ts
app.use('/parent-child', parentRoutes);
app.use('/users', parentRoutes); // Mounts the GET /users/:userId/children|parents

describe('Parent-Child Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default mocks - assume authentication passes, specific tests override authorize/validate
        mockAuthenticateToken.mockImplementation((req: Request, res: Response, next: NextFunction) => {
            // Default to admin user, tests can override req.user if needed
            req.user = mockAdminUser as any; // Use 'as any' to bypass type error
            next();
        });
        mockAuthorize.mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next());
        mockValidateRequest.mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next());
    });

    // --- POST /parent-child --- //
    describe('POST /parent-child', () => {
        const linkData = { parentId: 'parent-1', childId: 'child-1' };

        it('should create a link successfully by admin', async () => {
            const createdLink = { id: 'link-123', ...linkData } as PlayerParentLink;
            MockParentService.prototype.addParentChildLink.mockResolvedValue(createdLink);

            const response = await request(app)
                .post('/parent-child')
                .send(linkData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe('link-123');
            expect(MockParentService.prototype.addParentChildLink).toHaveBeenCalledWith(linkData);
        });

        // Add tests for validation failure, authorization failure (non-admin), service errors (NotFound, Conflict)
    });

    // --- DELETE /parent-child/:linkId --- //
    describe('DELETE /parent-child/:linkId', () => {
        const linkId = 'link-to-delete';

        it('should delete a link successfully by admin', async () => {
            MockParentService.prototype.removeParentChildLink.mockResolvedValue(undefined);

            const response = await request(app).delete(`/parent-child/${linkId}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('removed successfully');
            expect(MockParentService.prototype.removeParentChildLink).toHaveBeenCalledWith(linkId);
        });

        // Add tests for authorization (non-admin), link not found (404)
    });

    // --- GET /users/:userId/children --- //
    describe('GET /users/:userId/children', () => {
        const parentId = 'parent-user-id';
        const mockChildren = [{ id: 'child-1', firstName: 'Child', lastName: 'One' }] as User[];

        it('should get children for parent successfully (as parent)', async () => {
            // Simulate parent user making the request
             mockAuthenticateToken.mockImplementation((req: Request, res: Response, next: NextFunction) => {
                req.user = mockParentUser as any; // Use 'as any'
                next();
             });
            MockParentService.prototype.getChildrenForParent.mockResolvedValue(mockChildren);

            const response = await request(app).get(`/users/${parentId}/children`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].userId).toBe('child-1');
            expect(MockParentService.prototype.getChildrenForParent).toHaveBeenCalledWith(parentId);
        });

        it('should get children for parent successfully (as admin)', async () => {
             // Default mock user is admin (already set in beforeEach)
            MockParentService.prototype.getChildrenForParent.mockResolvedValue(mockChildren);

            const response = await request(app).get(`/users/${parentId}/children`);

            expect(response.status).toBe(200);
            expect(MockParentService.prototype.getChildrenForParent).toHaveBeenCalledWith(parentId);
        });

        it('should return 403 if unauthorized user tries to access', async () => {
             // Simulate a different user making the request
             const otherUser = { ...mockParentUser, userId: 'other-user' };
             mockAuthenticateToken.mockImplementation((req: Request, res: Response, next: NextFunction) => {
                req.user = otherUser as any; // Use 'as any'
                next();
             });
             
            const response = await request(app).get(`/users/${parentId}/children`);
            expect(response.status).toBe(403);
        });

        // Add test for parent not found (though auth check might prevent this)
    });

    // --- GET /users/:userId/parents --- //
    describe('GET /users/:userId/parents', () => {
        const childId = 'child-user-id';
        const mockParents = [{ id: 'parent-1', firstName: 'Parent', lastName: 'One' }] as User[];

         it('should get parents for child successfully (as child)', async () => {
             // Simulate child user making the request
             const childUser = { ...mockParentUser, userId: childId, roles: ['player'] };
             mockAuthenticateToken.mockImplementation((req: Request, res: Response, next: NextFunction) => {
                req.user = childUser as any; // Use 'as any'
                next();
             });
             MockParentService.prototype.getParentsForChild.mockResolvedValue(mockParents);

             const response = await request(app).get(`/users/${childId}/parents`);

             expect(response.status).toBe(200);
             expect(response.body.success).toBe(true);
             expect(response.body.data).toHaveLength(1);
             expect(response.body.data[0].userId).toBe('parent-1');
             expect(MockParentService.prototype.getParentsForChild).toHaveBeenCalledWith(childId);
        });
        
         it('should get parents for child successfully (as admin)', async () => {
             // Default mock user is admin (already set in beforeEach)
             MockParentService.prototype.getParentsForChild.mockResolvedValue(mockParents);

             const response = await request(app).get(`/users/${childId}/parents`);

             expect(response.status).toBe(200);
             expect(MockParentService.prototype.getParentsForChild).toHaveBeenCalledWith(childId);
        });
        
        // Add test for authorization failure (e.g., unrelated user)
        // Add test for child not found
    });
}); 