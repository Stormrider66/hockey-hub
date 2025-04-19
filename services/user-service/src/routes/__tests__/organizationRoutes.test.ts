import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { OrganizationService } from '../../services/organizationService';
import organizationRoutes from '../organizationRoutes';
import { authenticateToken, AuthenticatedUser } from '../../middleware/authenticateToken';
import { authorize } from '../../middleware/authorize';
import { validateRequest } from '../../middleware/validateRequest';
import { listOrganizationsSchema, getOrganizationSchema, createOrganizationSchema, updateOrganizationSchema } from '../../validations/organizationValidations';
import { ConflictError, NotFoundError, AuthorizationError } from '../../errors/serviceErrors';
import { Organization } from '../../entities/Organization';

// Mock dependencies
jest.mock('../../services/organizationService');
jest.mock('../../middleware/authenticateToken');
jest.mock('../../middleware/authorize');
jest.mock('../../middleware/validateRequest');

const MockOrganizationService = OrganizationService as jest.MockedClass<typeof OrganizationService>;
const mockAuthenticateToken = authenticateToken as jest.Mock;
const mockAuthorize = authorize as jest.Mock;
const mockValidateRequest = validateRequest as jest.Mock;

// Mock user for tests
const mockAdminUser = {
    id: 'admin-user-id',
    userId: 'admin-user-id',
    roles: ['admin'],
    permissions: ['organization:*'], // Assume admin has all org permissions
    organizationId: 'org-1', // Doesn't matter for system admin
    email: 'admin@test.com',
    lang: 'en'
} as any; 

const mockClubAdminUser = {
    id: 'club-admin-user-id',
    userId: 'club-admin-user-id',
    roles: ['club_admin'],
    permissions: ['organization:read', 'organization:update'], // Example permissions
    organizationId: 'org-1', // Belongs to org-1
    email: 'clubadmin@test.com',
    lang: 'en'
} as any;

// Setup test app
const app = express();
app.use(express.json());
app.use('/organizations', organizationRoutes);

describe('Organization Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default mocks - admin user, middleware passes
        mockAuthenticateToken.mockImplementation((req: Request, res: Response, next: NextFunction) => {
            req.user = mockAdminUser;
            next();
        });
        mockAuthorize.mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next());
        mockValidateRequest.mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next());
    });

    // --- GET /organizations --- //
    describe('GET /organizations', () => {
        it('should list organizations successfully for admin', async () => {
            const mockOrgs = [{ id: 'org-1', name: 'Org One' }, { id: 'org-2', name: 'Org Two' }] as Organization[];
            MockOrganizationService.prototype.listOrganizations.mockResolvedValue({ organizations: mockOrgs, total: 2 });

            const response = await request(app).get('/organizations?limit=10');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(MockOrganizationService.prototype.listOrganizations).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }));
        });

        it('should return 403 for non-admin user', async () => {
            mockAuthorize.mockImplementation((options) => {
                expect(options.allowedRoles).toContain('admin');
                return (req: Request, res: Response, next: NextFunction) => {
                    res.status(403).json({ error: true, code: 'INSUFFICIENT_PERMISSIONS' });
                }
            });
            const response = await request(app).get('/organizations');
            expect(response.status).toBe(403);
        });
    });

    // --- POST /organizations --- //
    describe('POST /organizations', () => {
        const orgData = { name: 'New Org', contactEmail: 'new@org.com' };

        it('should create organization successfully by admin', async () => {
            const createdOrg = { id: 'org-new', ...orgData, status: 'trial' } as Organization;
            MockOrganizationService.prototype.createOrganization.mockResolvedValue(createdOrg);

            const response = await request(app)
                .post('/organizations')
                .send(orgData);

            expect(response.status).toBe(201);
            expect(response.body.data.id).toBe('org-new');
            expect(MockOrganizationService.prototype.createOrganization).toHaveBeenCalledWith(orgData, mockAdminUser.userId);
        });

        it('should return 403 for non-admin user', async () => {
             mockAuthorize.mockImplementation((options) => {
                expect(options.allowedRoles).toContain('admin');
                return (req: Request, res: Response, next: NextFunction) => {
                    res.status(403).json({ error: true, code: 'INSUFFICIENT_PERMISSIONS' });
                }
            });
            const response = await request(app).post('/organizations').send(orgData);
            expect(response.status).toBe(403);
        });
        
        it('should return 409 if organization name exists', async () => {
            MockOrganizationService.prototype.createOrganization.mockRejectedValue(new ConflictError('Name exists'));
            const response = await request(app).post('/organizations').send(orgData);
            expect(response.status).toBe(409);
            expect(response.body.code).toBe('RESOURCE_CONFLICT');
        });
    });

    // --- GET /organizations/:organizationId --- //
    describe('GET /organizations/:organizationId', () => {
        const orgId = 'org-1';
        const mockOrgDetails = { id: orgId, name: 'Org One Details', teamCount: 5, userCount: 50 } as any;

        it('should get organization details successfully by admin', async () => {
            MockOrganizationService.prototype.getOrganizationDetailsWithCounts.mockResolvedValue(mockOrgDetails);
            const response = await request(app).get(`/organizations/${orgId}`);
            expect(response.status).toBe(200);
            expect(response.body.data.id).toBe(orgId);
            expect(response.body.data.teamCount).toBe(5);
            expect(MockOrganizationService.prototype.getOrganizationDetailsWithCounts).toHaveBeenCalledWith(orgId);
        });
        
         it('should get own organization details successfully by club admin', async () => {
            mockAuthenticateToken.mockImplementation((req: Request, res: Response, next: NextFunction) => {
                req.user = mockClubAdminUser; // Simulate club admin of org-1
                next();
            });
            MockOrganizationService.prototype.getOrganizationDetailsWithCounts.mockResolvedValue(mockOrgDetails);
            const response = await request(app).get(`/organizations/${orgId}`); // Accessing own org
            expect(response.status).toBe(200);
            expect(response.body.data.id).toBe(orgId);
        });
        
        it('should return 403 if club admin tries to access other organization', async () => {
             mockAuthenticateToken.mockImplementation((req: Request, res: Response, next: NextFunction) => {
                req.user = mockClubAdminUser; // Club admin of org-1
                next();
            });
            const otherOrgId = 'org-2';
            const response = await request(app).get(`/organizations/${otherOrgId}`); 
            expect(response.status).toBe(403);
            expect(response.body.code).toBe('AUTHORIZATION_ERROR');
        });

        it('should return 404 if organization not found', async () => {
            MockOrganizationService.prototype.getOrganizationDetailsWithCounts.mockRejectedValue(new NotFoundError('Org not found'));
            const response = await request(app).get(`/organizations/non-existent-org`);
            expect(response.status).toBe(404);
            expect(response.body.code).toBe('ORGANIZATION_NOT_FOUND');
        });
    });

    // --- PUT /organizations/:organizationId --- //
    describe('PUT /organizations/:organizationId', () => {
        const orgId = 'org-1';
        const updateData = { contactEmail: 'updated@org.com' };

        it('should update organization successfully by admin', async () => {
            const updatedOrg = { id: orgId, ...updateData } as Organization;
            MockOrganizationService.prototype.updateOrganization.mockResolvedValue(updatedOrg);
            const response = await request(app).put(`/organizations/${orgId}`).send(updateData);
            expect(response.status).toBe(200);
            expect(response.body.data.contactEmail).toBe(updateData.contactEmail);
            expect(MockOrganizationService.prototype.updateOrganization).toHaveBeenCalledWith(orgId, updateData, mockAdminUser.userId);
        });
        
        it('should update own organization successfully by club admin', async () => {
            mockAuthenticateToken.mockImplementation((req: Request, res: Response, next: NextFunction) => {
                req.user = mockClubAdminUser; 
                next();
            });
            const updatedOrg = { id: orgId, ...updateData } as Organization;
            MockOrganizationService.prototype.updateOrganization.mockResolvedValue(updatedOrg);
            const response = await request(app).put(`/organizations/${orgId}`).send(updateData);
            expect(response.status).toBe(200);
             expect(MockOrganizationService.prototype.updateOrganization).toHaveBeenCalledWith(orgId, updateData, mockClubAdminUser.userId);
        });

        it('should return 403 if club admin tries to update other organization', async () => {
             mockAuthenticateToken.mockImplementation((req: Request, res: Response, next: NextFunction) => {
                req.user = mockClubAdminUser; // Club admin of org-1
                next();
            });
            const otherOrgId = 'org-2';
            const response = await request(app).put(`/organizations/${otherOrgId}`).send(updateData);
            expect(response.status).toBe(403);
        });
        
         it('should return 403 if club admin tries to update status', async () => {
            mockAuthenticateToken.mockImplementation((req: Request, res: Response, next: NextFunction) => {
                req.user = mockClubAdminUser; 
                next();
            });
            const statusUpdate = { status: 'inactive' as const };
            const response = await request(app).put(`/organizations/${orgId}`).send(statusUpdate);
            expect(response.status).toBe(403); // Caught by controller logic
            expect(response.body.message).toContain('Only system administrators can change');
        });

        // Add tests for validation, not found, conflict errors
    });

    // --- DELETE /organizations/:organizationId --- //
    describe('DELETE /organizations/:organizationId', () => {
        const orgId = 'org-to-delete';

        it('should delete organization successfully by admin', async () => {
            MockOrganizationService.prototype.deleteOrganization.mockResolvedValue(undefined);
            const response = await request(app).delete(`/organizations/${orgId}`);
            expect(response.status).toBe(200);
            expect(response.body.message).toContain('deleted successfully');
            expect(MockOrganizationService.prototype.deleteOrganization).toHaveBeenCalledWith(orgId, mockAdminUser.userId);
        });

        it('should return 403 if non-admin tries to delete', async () => {
            mockAuthenticateToken.mockImplementation((req: Request, res: Response, next: NextFunction) => {
                req.user = mockClubAdminUser; // Use club admin
                next();
            });
             mockAuthorize.mockImplementation((options) => {
                expect(options.allowedRoles).toContain('admin'); // Middleware checks role
                return (req: Request, res: Response, next: NextFunction) => {
                    res.status(403).json({ error: true, code: 'INSUFFICIENT_PERMISSIONS' });
                }
            });
            const response = await request(app).delete(`/organizations/${orgId}`);
            expect(response.status).toBe(403);
        });
         // Add test for not found error
    });

}); 