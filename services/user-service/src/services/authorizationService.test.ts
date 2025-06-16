import { getRepository } from 'typeorm';
import { mocked } from 'jest-mock'; // Use jest-mock instead of ts-jest/utils
import { User, TeamMember, PlayerParentLink, Role, Organization } from '../entities';
import { canPerformAction } from './authorizationService';
import { getRolePermissions } from './permissionService';
import logger from '../config/logger';

// Mock TypeORM getRepository
jest.mock('typeorm', () => ({
    ...jest.requireActual('typeorm'), // Keep original functions
    getRepository: jest.fn(),
}));

// Mock permissionService
jest.mock('./permissionService', () => ({
    getRolePermissions: jest.fn(),
}));

// Mock logger
jest.mock('../config/logger', () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

// Mock the repository methods we'll use
const mockUserRepo = {
    findOne: jest.fn(),
};
const mockTeamMemberRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
};
const mockParentLinkRepo = {
    findOne: jest.fn(),
};

// Type assertion for the mocked getRepository
const mockedGetRepo = mocked(getRepository);
mockedGetRepo.mockImplementation((entity: any) => {
    if (entity === User) return mockUserRepo as any;
    if (entity === TeamMember) return mockTeamMemberRepo as any;
    if (entity === PlayerParentLink) return mockParentLinkRepo as any;
    throw new Error(`Mock not implemented for ${entity}`);
});

// Add type for roles parameter
const mockedGetRolePermissions = mocked(getRolePermissions);
mockedGetRolePermissions.mockImplementation((roles: string[]) => {
     // Default mock implementation or specific mocks per test
     if (roles.includes('admin')) return ['*.*'];
     if (roles.includes('coach')) return ['team:*', 'user:read'];
     if (roles.includes('player')) return ['user:read', 'user:update']; // Example
     return [];
});

describe('Authorization Service - canPerformAction', () => {

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        mockUserRepo.findOne.mockReset();
        mockTeamMemberRepo.findOne.mockReset();
        mockTeamMemberRepo.find.mockReset();
        mockParentLinkRepo.findOne.mockReset();
        mockedGetRolePermissions.mockReset();
        // Reset default implementation too if needed
        mockedGetRolePermissions.mockImplementation((roles: string[]) => {
             if (roles.includes('admin')) return ['*.*'];
             // Add other default role mappings if needed for multiple tests
             return [];
        });
    });

    // --- Test Data ---
    const testUserId = 'user-123';
    const otherUserId = 'user-456';
    const teamId = 'team-abc';
    const orgId = 'org-xyz';
    const otherOrgId = 'org-999';

    const mockOrg: Organization = { id: orgId, name: 'Test Org' } as Organization;
    const mockUser = (id: string, roleNames: string[] = [], organization: Organization | null = mockOrg): User => ({
        id,
        email: `${id}@test.com`,
        firstName: 'Test',
        lastName: 'User',
        passwordHash: 'hashedpassword', // Add required field
        preferredLanguage: 'en', // Add required field
        status: 'active', // Add required field
        createdAt: new Date(), // Add required field
        updatedAt: new Date(), // Add required field
        roles: roleNames.map(name => ({ id: name, name } as Role)),
        organization: organization,
        teamMemberships: [],
        childLinks: [], // Add required field
        parentLinks: [], // Add required field
        refreshTokens: [], // Add required field
        // Add other optional fields as needed, e.g., phone: undefined
    } as User);

    // --- Test Cases ---

    test('should return false if required parameters are missing', async () => {
        expect(await canPerformAction('', 'read', 'user')).toBe(false);
        expect(await canPerformAction(testUserId, '', 'user')).toBe(false);
        expect(await canPerformAction(testUserId, 'read', '')).toBe(false);
    });

    test('should return false if user is not found', async () => {
        mockUserRepo.findOne.mockResolvedValue(null);
        expect(await canPerformAction(testUserId, 'read', 'user')).toBe(false);
        expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: testUserId }, relations: expect.any(Array) });
    });

    test('should grant access for admin role (global wildcard)', async () => {
        mockUserRepo.findOne.mockResolvedValue(mockUser(testUserId, ['admin']));
        mockedGetRolePermissions.mockReturnValue(['*.*']); // Simulate admin permission
        expect(await canPerformAction(testUserId, 'delete', 'team', teamId)).toBe(true);
        expect(mockedGetRolePermissions).toHaveBeenCalledWith(['admin']);
    });

    test('should grant access based on resource wildcard', async () => {
        mockUserRepo.findOne.mockResolvedValue(mockUser(testUserId, ['coach']));
        mockedGetRolePermissions.mockReturnValue(['team:*']); // Simulate coach permission
        expect(await canPerformAction(testUserId, 'delete', 'team', teamId)).toBe(true);
    });

    test('should grant access based on generic permission', async () => {
        mockUserRepo.findOne.mockResolvedValue(mockUser(testUserId, ['player']));
        mockedGetRolePermissions.mockReturnValue(['user:read']); 
        expect(await canPerformAction(testUserId, 'read', 'user', otherUserId)).toBe(true);
    });

    test('should grant access for user accessing own profile', async () => {
        mockUserRepo.findOne.mockResolvedValue(mockUser(testUserId, ['player']));
        mockedGetRolePermissions.mockReturnValue(['user:read']); // Assume player has basic read
        expect(await canPerformAction(testUserId, 'read', 'user', testUserId)).toBe(true);
        expect(await canPerformAction(testUserId, 'update', 'user', testUserId)).toBe(true); // Assumes selfPermissions includes 'user:update'
    });

    test('should grant access based on team membership role', async () => {
        mockUserRepo.findOne.mockResolvedValue(mockUser(testUserId, ['coach']));
        mockTeamMemberRepo.findOne.mockResolvedValue({ userId: testUserId, teamId: teamId, role: 'coach' } as TeamMember);
        // Override default mock for this specific test case
        mockedGetRolePermissions.mockImplementation((roles: string[]) => roles.includes('coach') ? ['team:read'] : []); 
        expect(await canPerformAction(testUserId, 'read', 'team', teamId)).toBe(true);
        expect(mockTeamMemberRepo.findOne).toHaveBeenCalledWith({ where: { userId: testUserId, teamId: teamId } });
    });
    
    test('should deny access if team membership role lacks permission', async () => {
        mockUserRepo.findOne.mockResolvedValue(mockUser(testUserId, ['player']));
        mockTeamMemberRepo.findOne.mockResolvedValue({ userId: testUserId, teamId: teamId, role: 'player' } as TeamMember);
        mockedGetRolePermissions.mockReturnValue([]); // Player role in team has no extra permissions
        expect(await canPerformAction(testUserId, 'update', 'team', teamId)).toBe(false);
    });
    
    test('should grant access for coach reading player profile in same team', async () => {
        const coachId = 'coach-1';
        const playerId = 'player-2';
        mockUserRepo.findOne
            .mockResolvedValueOnce(mockUser(coachId, ['coach'])) // First call for accessor
            .mockResolvedValueOnce(mockUser(playerId, ['player'], mockOrg)); // Second call for target user
        mockTeamMemberRepo.find.mockResolvedValue([{ userId: coachId, teamId: teamId, role: 'coach' } as TeamMember]); // Coach's memberships
        // Simulate target player being in the same team
        const targetUserWithMembership = mockUser(playerId, ['player']);
        targetUserWithMembership.teamMemberships = [{ userId: playerId, teamId: teamId, role: 'player' }] as TeamMember[];
        mockUserRepo.findOne.mockResolvedValueOnce(targetUserWithMembership); // Call inside the check
        
        mockedGetRolePermissions.mockReturnValue(['user:read']); // Assume coach role grants user:read
        
        expect(await canPerformAction(coachId, 'read', 'user', playerId)).toBe(true);
    });

    test('should grant access for club_admin accessing resource in their org', async () => {
        mockUserRepo.findOne.mockResolvedValue(mockUser(testUserId, ['club_admin'], mockOrg));
        mockedGetRolePermissions.mockReturnValue(['team:read']); // Assume club_admin has this permission statically
        expect(await canPerformAction(testUserId, 'read', 'team', teamId, orgId)).toBe(true);
    });

    test('should deny access for club_admin accessing resource outside their org', async () => {
        mockUserRepo.findOne.mockResolvedValue(mockUser(testUserId, ['club_admin'], mockOrg));
        mockedGetRolePermissions.mockReturnValue(['team:read']);
        expect(await canPerformAction(testUserId, 'read', 'team', teamId, otherOrgId)).toBe(false);
    });

    test('should deny access for club_admin if resource organization ID is missing when required', async () => {
        mockUserRepo.findOne.mockResolvedValue(mockUser(testUserId, ['club_admin'], mockOrg));
        mockedGetRolePermissions.mockReturnValue(['team:read']);
        expect(await canPerformAction(testUserId, 'read', 'team', teamId, undefined)).toBe(false);
    });

    test('should grant access for parent accessing child data', async () => {
        const parentId = 'parent-1';
        const childId = 'child-2';
        mockUserRepo.findOne.mockResolvedValue(mockUser(parentId, ['parent']));
        mockParentLinkRepo.findOne.mockResolvedValue({ parentId: parentId, childId: childId } as PlayerParentLink);
        mockedGetRolePermissions.mockReturnValue(['user:read']); // Parent role grants user:read

        expect(await canPerformAction(parentId, 'read', 'user', childId)).toBe(true);
        expect(mockParentLinkRepo.findOne).toHaveBeenCalledWith({ where: { parentId: parentId, childId: childId } });
    });
    
     test('should deny access for parent accessing non-child data', async () => {
        const parentId = 'parent-1';
        const otherUserId = 'other-user';
        mockUserRepo.findOne.mockResolvedValue(mockUser(parentId, ['parent']));
        mockParentLinkRepo.findOne.mockResolvedValue(null); // No link found
        mockedGetRolePermissions.mockReturnValue(['user:read']);

        expect(await canPerformAction(parentId, 'read', 'user', otherUserId)).toBe(false);
        expect(mockParentLinkRepo.findOne).toHaveBeenCalledWith({ where: { parentId: parentId, childId: otherUserId } });
    });

    test('should deny access when no static or contextual permission matches', async () => {
        mockUserRepo.findOne.mockResolvedValue(mockUser(testUserId, ['player']));
        mockedGetRolePermissions.mockReturnValue([]); // No relevant static permissions
        mockTeamMemberRepo.findOne.mockResolvedValue(null); // Not a member of the team (if applicable)
        mockParentLinkRepo.findOne.mockResolvedValue(null); // Not a parent of the user (if applicable)
        
        expect(await canPerformAction(testUserId, 'delete', 'team', teamId)).toBe(false);
        expect(await canPerformAction(testUserId, 'update', 'user', otherUserId)).toBe(false);
    });

}); 