import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { UserService } from '../../services/userService';
import userRoutes from '../userRoutes';
import { authenticateToken, AuthenticatedUser } from '../../middleware/authenticateToken';
import { authorize } from '../../middleware/authorize';
import { validateRequest } from '../../middleware/validateRequest';
import { listUsersSchema, getUserSchema, updateUserSchema, assignRoleSchema, removeRoleSchema } from '../../validations/userValidations';
import { ConflictError, NotFoundError, AuthorizationError } from '../../errors/serviceErrors';
import { User } from '../../entities/User';
import { Role } from '../../entities/Role';

// Mock dependencies
jest.mock('../../services/userService');
jest.mock('../../middleware/authenticateToken');
jest.mock('../../middleware/authorize');
jest.mock('../../middleware/validateRequest');

const MockUserService = UserService as jest.MockedClass<typeof UserService>;
const mockAuthenticateToken = authenticateToken as jest.Mock;
const mockAuthorize = authorize as jest.Mock;
const mockValidateRequest = validateRequest as jest.Mock;

// Mock user for tests
const mockAdminUser = {
    id: 'admin-user-id', // Use id to match linter expectation
    userId: 'admin-user-id',
    roles: ['admin'],
    permissions: ['user:*'],
    organizationId: 'org-1',
    email: 'admin@test.com',
    lang: 'en'
} as any; // Use any for mock flexibility

const mockRegularUser = {
    id: 'regular-user-id',
    userId: 'regular-user-id',
    roles: ['player'],
    permissions: ['user:read', 'user:update'],
    organizationId: 'org-1',
    email: 'player@test.com',
    lang: 'en'
} as any;

// Setup test app
const app = express();
app.use(express.json());
// Mount routes
app.use('/users', userRoutes);

describe('User Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default mocks
        mockAuthenticateToken.mockImplementation((req: Request, res: Response, next: NextFunction) => {
            req.user = mockAdminUser; // Default to admin
            next();
        });
        mockAuthorize.mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next());
        mockValidateRequest.mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next());
    });

    // --- GET /users --- //
    describe('GET /users', () => {
        it('should list users successfully', async () => {
            const mockUsers = [{ id: 'user-1', firstName: 'Test' }, { id: 'user-2', firstName: 'Another' }] as User[];
            MockUserService.prototype.listUsers.mockResolvedValue({ users: mockUsers, total: 2 });

            const response = await request(app).get('/users?limit=10&page=1');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.meta.total).toBe(2);
            expect(MockUserService.prototype.listUsers).toHaveBeenCalledWith(expect.objectContaining({ limit: 10, page: 1 }));
        });
        
        // Add tests for filtering, pagination, sorting, authorization failure
    });

    // --- GET /users/:userId --- //
    describe('GET /users/:userId', () => {
        const userId = 'user-123';
        const mockUserDetails = { id: userId, firstName: 'Details', email: 'details@test.com' } as User;

        it('should get user details successfully', async () => {
            MockUserService.prototype.findById.mockResolvedValue(mockUserDetails);

            const response = await request(app).get(`/users/${userId}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(userId);
            expect(MockUserService.prototype.findById).toHaveBeenCalledWith(userId, expect.any(Array));
        });
        
        it('should return 404 if user not found', async () => {
             MockUserService.prototype.findById.mockRejectedValue(new NotFoundError('User not found'));
             const response = await request(app).get(`/users/${userId}`);
             expect(response.status).toBe(404);
             expect(response.body.code).toBe('USER_NOT_FOUND');
        });
        // Add tests for authorization failure
    });

    // --- PUT /users/:userId --- //
    describe('PUT /users/:userId', () => {
        const userId = 'user-to-update';
        const updateData = { firstName: 'Updated', phone: '1234567890' };

        it('should allow user to update their own profile', async () => {
             mockAuthenticateToken.mockImplementation((req: Request, res: Response, next: NextFunction) => {
                req.user = { ...mockRegularUser, userId: userId, id: userId }; // Simulate user making request
                next();
             });
             MockUserService.prototype.updateUser.mockResolvedValue({ id: userId, ...updateData } as User);

             const response = await request(app)
                 .put(`/users/${userId}`)
                 .send(updateData);

             expect(response.status).toBe(200);
             expect(MockUserService.prototype.updateUser).toHaveBeenCalledWith(userId, updateData, userId, ['player']);
        });
        
        it('should allow admin to update any profile', async () => {
            // Default mock user is admin
            MockUserService.prototype.updateUser.mockResolvedValue({ id: userId, ...updateData } as User);
            const response = await request(app)
                 .put(`/users/${userId}`)
                 .send(updateData);

             expect(response.status).toBe(200);
             expect(MockUserService.prototype.updateUser).toHaveBeenCalledWith(userId, updateData, mockAdminUser.userId, mockAdminUser.roles);
        });

        it('should return 403 if non-admin tries to update another user', async () => {
            mockAuthenticateToken.mockImplementation((req: Request, res: Response, next: NextFunction) => {
                req.user = mockRegularUser; // Non-admin user
                next();
             });
             
             const response = await request(app)
                 .put(`/users/${userId}`)
                 .send(updateData);
                 
             expect(response.status).toBe(403);
             expect(response.body.code).toBe('AUTHORIZATION_ERROR');
             expect(MockUserService.prototype.updateUser).not.toHaveBeenCalled();
        });
        
        // Add tests for validation error, not found error
    });

    // --- DELETE /users/:userId --- //
    describe('DELETE /users/:userId', () => {
        const userId = 'user-to-delete';

        it('should allow admin to delete user', async () => {
             // Default setup uses admin user and passes basic auth
            MockUserService.prototype.deleteUser.mockResolvedValue(undefined);
            const response = await request(app).delete(`/users/${userId}`);
            expect(response.status).toBe(200);
            expect(MockUserService.prototype.deleteUser).toHaveBeenCalledWith(userId, mockAdminUser.userId);
        });

        it('should return 403 if non-admin tries to delete user', async () => {
            mockAuthorize.mockImplementation((options) => {
                // Simulate authorize middleware denying based on permission/role
                return (req: Request, res: Response, next: NextFunction) => {
                    res.status(403).json({ error: true, code: 'INSUFFICIENT_PERMISSIONS' });
                }
            });
            const response = await request(app).delete(`/users/${userId}`);
            expect(response.status).toBe(403);
            expect(MockUserService.prototype.deleteUser).not.toHaveBeenCalled();
        });
        // Add test for user not found (404)
    });

    // --- POST /users/:userId/roles --- //
    describe('POST /users/:userId/roles', () => {
        const userId = 'user-role-assign';
        const roleData = { roleName: 'coach' };

        it('should assign role successfully by admin', async () => {
             // Define a mock Role that satisfies the entity structure
            const mockCoachRole: Role = { 
                id: 'role-coach', 
                name: 'coach', 
                description: 'Team coach', 
                createdAt: new Date(), 
                updatedAt: new Date(),
                users: [] // Assume users relation is not needed for this mock
            };
            const updatedUser = { 
                id: userId, 
                email: 'test@test.com', 
                firstName: 'Role', 
                lastName: 'Assign',
                preferredLanguage: 'en',
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
                 // Add missing fields from User entity with default/dummy values
                passwordHash: '', 
                teamMemberships: [],
                childLinks: [],
                parentLinks: [],
                refreshTokens: [],
                roles: [mockCoachRole] // Use the more complete mock Role
            } as User; 
            MockUserService.prototype.assignRoleToUser.mockResolvedValue(updatedUser);
            const response = await request(app)
                .post(`/users/${userId}/roles`)
                .send(roleData);
            expect(response.status).toBe(200);
            expect(response.body.data.roles).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'coach' })]));
            expect(MockUserService.prototype.assignRoleToUser).toHaveBeenCalledWith(userId, roleData.roleName, mockAdminUser.userId);
        });
         // Add tests for: role not found, user not found, user already has role, authorization failure
    });

    // --- DELETE /users/:userId/roles/:roleName --- //
    describe('DELETE /users/:userId/roles/:roleName', () => {
        const userId = 'user-role-remove';
        const roleName = 'player';

         it('should remove role successfully by admin', async () => {
            const updatedUser = { 
                id: userId, 
                email: 'test@test.com',
                firstName: 'Role',
                lastName: 'Remove',
                preferredLanguage: 'en',
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
                 // Add missing fields from User entity with default/dummy values
                passwordHash: '', 
                teamMemberships: [],
                childLinks: [],
                parentLinks: [],
                refreshTokens: [],
                roles: [] 
            } as User;
            MockUserService.prototype.removeRoleFromUser.mockResolvedValue(updatedUser);
            const response = await request(app).delete(`/users/${userId}/roles/${roleName}`);
            expect(response.status).toBe(200);
            expect(response.body.data.roles).toEqual([]);
            expect(MockUserService.prototype.removeRoleFromUser).toHaveBeenCalledWith(userId, roleName, mockAdminUser.userId);
         });
          // Add tests for: role not assigned, user not found, role not found, authorization failure
    });
}); 