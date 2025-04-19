import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express'; // Import express types
import { Team } from '../../entities/Team';
import { TeamService } from '../../services/teamService';
import teamRoutes from '../teamRoutes'; // The router we are testing
import { AuthenticatedUser, authenticateToken } from '../../middleware/authenticateToken'; // Import interface too
import { authorize } from '../../middleware/authorize';
import { validateRequest } from '../../middleware/validateRequest';
import { createTeamSchema } from '../../validations/teamValidations';
import { ConflictError, NotFoundError } from '../../errors/serviceErrors';
import { User } from '../../entities/User';
import { TeamMember } from '../../entities/TeamMember';

// Mock the dependencies
jest.mock('../../services/teamService');
jest.mock('../../middleware/authenticateToken');
jest.mock('../../middleware/authorize');
jest.mock('../../middleware/validateRequest');

// --- Mock Implementations --- //

const MockTeamService = TeamService as jest.MockedClass<typeof TeamService>; // Type cast for mocking methods
const mockAuthenticateToken = authenticateToken as jest.Mock;
const mockAuthorize = authorize as jest.Mock;
const mockValidateRequest = validateRequest as jest.Mock;

// Define mock user object for testing. 
// Map userId to id to attempt to satisfy linter/Express type expectations.
const mockUserForTest = {
    id: 'auth-user-123', // Changed from userId to id
    userId: 'auth-user-123', // Keep userId as well, as service might expect it
    roles: ['admin'], 
    permissions: ['team:create'],
    organizationId: 'org-1',
    email: 'admin@test.com',
    lang: 'en',
    teamIds: ['team-1'] 
} as any; // Use 'as any' for mock user flexibility in tests

// Setup the test Express app
const app = express();
app.use(express.json());
// Mount the teamRoutes directly. Middleware mocks will be handled in tests.
app.use('/teams', teamRoutes);

// --- Tests --- //

describe('POST /teams', () => {

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Provide default implementations for middleware mocks with types
        // Ensure authenticateToken mock correctly attaches the user
        mockAuthenticateToken.mockImplementation((req: Request, res: Response, next: NextFunction) => { 
            // Attach the user object with the 'id' field expected by the test context type checker
            req.user = mockUserForTest as any; // Use 'as any' to bypass strict checking here
            next(); 
        });
        mockAuthorize.mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next());
        mockValidateRequest.mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next());
    });

    it('should create a team successfully with valid data and permissions', async () => {
        const teamData = {
            name: 'Test Titans',
            organizationId: 'org-1',
            category: 'Senior'
        };
        const createdTeam = { id: 'team-abc', ...teamData, status: 'active', createdAt: new Date(), updatedAt: new Date() } as Team;

        // Mock authorize to simulate passing the permission check
        mockAuthorize.mockImplementation((options) => {
            expect(options.requiredPermissions).toContain('team:create');
            return (req: Request, res: Response, next: NextFunction) => next(); // Add types
        });
        
        // Mock the service method
        MockTeamService.prototype.createTeam.mockResolvedValue(createdTeam);

        // Mock validateRequest to simulate passing validation
        mockValidateRequest.mockImplementation((schema) => {
            expect(schema).toBe(createTeamSchema);
            return (req: Request, res: Response, next: NextFunction) => next(); // Add types
        });

        const response = await request(app)
            .post('/teams')
            .send(teamData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject(teamData);
        expect(response.body.data.id).toBe('team-abc');
        // The createTeam service method expects the userId from req.user
        expect(MockTeamService.prototype.createTeam).toHaveBeenCalledWith(teamData, mockUserForTest.userId); 
        expect(mockAuthorize).toHaveBeenCalled();
        expect(mockValidateRequest).toHaveBeenCalled();
    });

    it('should return 400 Bad Request if validation fails', async () => {
         // Mock validateRequest to simulate failure
        mockValidateRequest.mockImplementation((schema) => {
            return (req: Request, res: Response, next: NextFunction) => { // Add types
                res.status(400).json({ 
                    error: true, 
                    message: 'Validation failed', 
                    code: 'VALIDATION_ERROR',
                    details: [{path: 'name', message: 'Team name is required'}]
                });
            };
        });
        
        const response = await request(app)
            .post('/teams')
            .send({ organizationId: 'org-1' }); // Missing name

        expect(response.status).toBe(400);
        expect(response.body.error).toBe(true);
        expect(response.body.code).toBe('VALIDATION_ERROR');
        expect(MockTeamService.prototype.createTeam).not.toHaveBeenCalled();
    });

    it('should return 403 Forbidden if user lacks team:create permission', async () => {
        // Mock authorize to simulate failure
        mockAuthorize.mockImplementation((options) => {
             expect(options.requiredPermissions).toContain('team:create');
            return (req: Request, res: Response, next: NextFunction) => { // Add types
                res.status(403).json({ 
                    error: true, 
                    message: 'Insufficient permissions', 
                    code: 'INSUFFICIENT_PERMISSIONS' 
                });
            };
        });

        const response = await request(app)
            .post('/teams')
            .send({ name: 'Test Team', organizationId: 'org-1' });

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
        expect(MockTeamService.prototype.createTeam).not.toHaveBeenCalled();
    });

    it('should return 409 Conflict if team name already exists in organization', async () => {
        const teamData = {
            name: 'Existing Team',
            organizationId: 'org-1',
        };
        // Mock authorize and validate to pass
         mockAuthorize.mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next()); // Add types
         mockValidateRequest.mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next()); // Add types
        // Mock service method to throw ConflictError
        MockTeamService.prototype.createTeam.mockRejectedValue(
            new ConflictError(`Team name '${teamData.name}' already exists in this organization`)
        );

        const response = await request(app)
            .post('/teams')
            .send(teamData);

        expect(response.status).toBe(409);
        expect(response.body.error).toBe(true);
        expect(response.body.code).toBe('RESOURCE_CONFLICT');
        expect(response.body.message).toContain('already exists');
        expect(MockTeamService.prototype.createTeam).toHaveBeenCalledWith(teamData, mockUserForTest.userId);
    });

     it('should return 404 Not Found if organization does not exist', async () => {
        const teamData = {
            name: 'New Team',
            organizationId: 'non-existent-org',
        };
        // Mock authorize and validate to pass
        mockAuthorize.mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next()); // Add types
        mockValidateRequest.mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next()); // Add types
        // Mock service method to throw NotFoundError
        MockTeamService.prototype.createTeam.mockRejectedValue(
            new NotFoundError(`Organization with ID ${teamData.organizationId} not found`)
        );

        const response = await request(app)
            .post('/teams')
            .send(teamData);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe(true);
        expect(response.body.code).toBe('NOT_FOUND');
        expect(response.body.message).toContain('Organization with ID non-existent-org not found');
        expect(MockTeamService.prototype.createTeam).toHaveBeenCalledWith(teamData, mockUserForTest.userId);
    });
});

// --- Tests for GET /teams --- //
describe('GET /teams', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAuthenticateToken.mockImplementation((req: Request, res: Response, next: NextFunction) => { req.user = mockUserForTest as any; next(); });
        mockAuthorize.mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next());
        mockValidateRequest.mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next());
    });

    it('should return a list of teams successfully', async () => {
        const mockTeams = [
            { id: 'team-1', name: 'Team Alpha', organizationId: 'org-1' },
            { id: 'team-2', name: 'Team Beta', organizationId: 'org-1' },
        ] as Team[];
        
        // Assume listTeams exists or mock appropriately
        // MockTeamService.prototype.listTeams.mockResolvedValue({ teams: mockTeams, total: 2 }); 
        
        const response = await request(app).get('/teams');

        expect(response.status).toBe(200);
        // Add more specific checks based on controller/service implementation
    });
    
});

// --- Tests for GET /teams/:teamId --- //
describe('GET /teams/:teamId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAuthenticateToken.mockImplementation((req: Request, res: Response, next: NextFunction) => { req.user = mockUserForTest as any; next(); });
        mockAuthorize.mockImplementation((options) => {
             expect(options.requiredPermissions).toContain('team:read');
             return (req: Request, res: Response, next: NextFunction) => next(); 
        });
        mockValidateRequest.mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next());
    });

    it('should return team details successfully', async () => {
        const teamId = 'team-123';
        const mockTeamDetails = { 
            id: teamId, name: 'Specific Team', organizationId: 'org-1', 
            members: [{user: { id: 'user-1', firstName: 'Test', lastName: 'Player'}, role: 'player'}]
        } as any; 

        MockTeamService.prototype.getTeamById.mockResolvedValue(mockTeamDetails as Team);

        const response = await request(app).get(`/teams/${teamId}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(teamId);
        expect(response.body.data.name).toBe('Specific Team');
        expect(MockTeamService.prototype.getTeamById).toHaveBeenCalledWith(teamId, expect.any(Array)); 
    });

    it('should return 404 Not Found if team does not exist', async () => {
        const teamId = 'non-existent-team';
        MockTeamService.prototype.getTeamById.mockRejectedValue(new NotFoundError('Team not found'));

        const response = await request(app).get(`/teams/${teamId}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe(true);
        expect(response.body.code).toBe('TEAM_NOT_FOUND');
    });

});

// --- Tests for PUT /teams/:teamId --- //
describe('PUT /teams/:teamId', () => {
     beforeEach(() => {
        jest.clearAllMocks();
        mockAuthenticateToken.mockImplementation((req: Request, res: Response, next: NextFunction) => { req.user = mockUserForTest as any; next(); });
        mockAuthorize.mockImplementation((options) => {
             expect(options.requiredPermissions).toContain('team:update');
             return (req: Request, res: Response, next: NextFunction) => next(); 
        });
        mockValidateRequest.mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next());
    });
    
    it('should update a team successfully', async () => {
        const teamId = 'team-to-update';
        const updateData = { name: 'Updated Team Name', category: 'Updated Category' };
        const updatedTeam = { id: teamId, ...updateData } as Team;

        MockTeamService.prototype.updateTeam.mockResolvedValue(updatedTeam);

        const response = await request(app)
            .put(`/teams/${teamId}`)
            .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject(updateData);
        expect(MockTeamService.prototype.updateTeam).toHaveBeenCalledWith(teamId, updateData);
    });

    it('should return 404 if team to update is not found', async () => {
        const teamId = 'non-existent-team';
        const updateData = { name: 'Updated Name' };
        MockTeamService.prototype.updateTeam.mockRejectedValue(new NotFoundError('Team not found'));

        const response = await request(app)
            .put(`/teams/${teamId}`)
            .send(updateData);

        expect(response.status).toBe(404);
        expect(response.body.code).toBe('TEAM_NOT_FOUND');
    });
    
});

// --- Tests for DELETE /teams/:teamId --- //
describe('DELETE /teams/:teamId', () => {
     beforeEach(() => {
        jest.clearAllMocks();
        mockAuthenticateToken.mockImplementation((req: Request, res: Response, next: NextFunction) => { req.user = mockUserForTest as any; next(); });
        mockAuthorize.mockImplementation((options) => {
             expect(options.requiredPermissions).toContain('team:delete');
             return (req: Request, res: Response, next: NextFunction) => next(); 
        });
        mockValidateRequest.mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next());
    });

    it('should delete a team successfully', async () => {
        const teamId = 'team-to-delete';
        MockTeamService.prototype.deleteTeam.mockResolvedValue(undefined); // deleteTeam returns void

        const response = await request(app).delete(`/teams/${teamId}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
        // Note: deleteTeam in service expects userId, mock should reflect this if needed
        expect(MockTeamService.prototype.deleteTeam).toHaveBeenCalledWith(teamId); 
    });

    it('should return 404 if team to delete is not found', async () => {
        const teamId = 'non-existent-team';
        MockTeamService.prototype.deleteTeam.mockRejectedValue(new NotFoundError('Team not found'));

        const response = await request(app).delete(`/teams/${teamId}`);

        expect(response.status).toBe(404);
        expect(response.body.code).toBe('TEAM_NOT_FOUND');
    });
    
});

// --- Tests for GET /teams/:teamId/members --- //
describe('GET /teams/:teamId/members', () => {
    const teamId = 'team-1';
    
    beforeEach(() => {
        jest.clearAllMocks();
        mockAuthenticateToken.mockImplementation((req: Request, res: Response, next: NextFunction) => { req.user = mockUserForTest as any; next(); });
        mockAuthorize.mockImplementation((options) => {
             // Check permissions required by the route
             expect(options.requiredPermissions).toEqual(expect.arrayContaining(['team:read', 'user:read']));
             return (req: Request, res: Response, next: NextFunction) => next(); 
        });
        mockValidateRequest.mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next());
    });

    it('should return list of team members successfully', async () => {
        const mockMembers = [
            { id: 'user-1', firstName: 'Player', lastName: 'One', email: 'player1@test.com' },
            { id: 'user-2', firstName: 'Player', lastName: 'Two', email: 'player2@test.com' }
        ] as User[]; // Assuming service returns User[]

        MockTeamService.prototype.getTeamMembers.mockResolvedValue(mockMembers);

        const response = await request(app).get(`/teams/${teamId}/members`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.data[0].userId).toBe('user-1');
        expect(response.body.data[1].firstName).toBe('Player');
        expect(MockTeamService.prototype.getTeamMembers).toHaveBeenCalledWith(teamId);
    });

    it('should return 404 if team not found', async () => {
         MockTeamService.prototype.getTeamMembers.mockRejectedValue(new NotFoundError('Team not found'));

        const response = await request(app).get(`/teams/${teamId}/members`);

        expect(response.status).toBe(404);
        expect(response.body.code).toBe('TEAM_NOT_FOUND');
    });

    // Add test for authorization failure
});

// --- Tests for POST /teams/:teamId/members --- //
describe('POST /teams/:teamId/members', () => {
    const teamId = 'team-1';
    const memberData = { userId: 'user-3', role: 'player' as const };
    
     beforeEach(() => {
        jest.clearAllMocks();
        mockAuthenticateToken.mockImplementation((req: Request, res: Response, next: NextFunction) => { req.user = mockUserForTest as any; next(); });
        mockAuthorize.mockImplementation((options) => {
             expect(options.requiredPermissions).toContain('team:update');
             return (req: Request, res: Response, next: NextFunction) => next(); 
        });
        mockValidateRequest.mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next());
    });

    it('should add a member successfully', async () => {
        const newMember = { id: 'member-xyz', teamId, ...memberData, startDate: new Date() } as TeamMember;
        MockTeamService.prototype.addMemberToTeam.mockResolvedValue(newMember);

        const response = await request(app)
            .post(`/teams/${teamId}/members`)
            .send(memberData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe('member-xyz');
        expect(response.body.data.userId).toBe(memberData.userId);
        expect(response.body.data.role).toBe(memberData.role);
        expect(MockTeamService.prototype.addMemberToTeam).toHaveBeenCalledWith(teamId, memberData);
    });

    it('should return 404 if team or user not found', async () => {
        MockTeamService.prototype.addMemberToTeam.mockRejectedValue(new NotFoundError('User not found'));
        
        const response = await request(app)
            .post(`/teams/${teamId}/members`)
            .send(memberData);
            
        expect(response.status).toBe(404);
        expect(response.body.code).toBe('NOT_FOUND');
    });
    
    it('should return 409 if user is already member with that role', async () => {
         MockTeamService.prototype.addMemberToTeam.mockRejectedValue(new ConflictError('User already has role'));
        
        const response = await request(app)
            .post(`/teams/${teamId}/members`)
            .send(memberData);
            
        expect(response.status).toBe(409);
        expect(response.body.code).toBe('RESOURCE_CONFLICT');
    });
    
    // Add test for validation failure (e.g., invalid role)
    // Add test for authorization failure
});

// --- Tests for DELETE /teams/:teamId/members/:userId --- //
describe('DELETE /teams/:teamId/members/:userId', () => {
    const teamId = 'team-1';
    const userId = 'user-to-remove';
    
    beforeEach(() => {
        jest.clearAllMocks();
        mockAuthenticateToken.mockImplementation((req: Request, res: Response, next: NextFunction) => { req.user = mockUserForTest as any; next(); });
        mockAuthorize.mockImplementation((options) => {
             expect(options.requiredPermissions).toContain('team:update');
             return (req: Request, res: Response, next: NextFunction) => next(); 
        });
        mockValidateRequest.mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next());
    });

    it('should remove a member successfully', async () => {
        MockTeamService.prototype.removeMemberFromTeam.mockResolvedValue(undefined);

        const response = await request(app).delete(`/teams/${teamId}/members/${userId}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Team member removed successfully');
        expect(MockTeamService.prototype.removeMemberFromTeam).toHaveBeenCalledWith(teamId, userId, undefined); // No role specified in query
    });
    
     it('should remove a member with specific role successfully via query param', async () => {
        MockTeamService.prototype.removeMemberFromTeam.mockResolvedValue(undefined);
        const roleToRemove = 'player';

        const response = await request(app).delete(`/teams/${teamId}/members/${userId}?role=${roleToRemove}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Team member removed successfully');
        expect(MockTeamService.prototype.removeMemberFromTeam).toHaveBeenCalledWith(teamId, userId, roleToRemove);
    });

    it('should return 404 if team, user, or membership not found', async () => {
        MockTeamService.prototype.removeMemberFromTeam.mockRejectedValue(new NotFoundError('Membership not found'));

        const response = await request(app).delete(`/teams/${teamId}/members/${userId}`);

        expect(response.status).toBe(404);
        expect(response.body.code).toBe('MEMBERSHIP_NOT_FOUND');
    });
    
    // Add test for authorization failure
});

// TODO: Add describe blocks and tests for other team endpoints (GET, PUT, DELETE, members) 