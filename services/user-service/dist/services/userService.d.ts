import { User } from '../entities/User';
interface UpdateUserDto {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    preferredLanguage?: 'sv' | 'en';
    status?: 'active' | 'inactive' | 'pending';
    avatarUrl?: string | null;
}
interface ListUsersOptions {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    teamId?: string;
    status?: 'active' | 'inactive' | 'pending';
    sort?: 'firstName' | 'lastName' | 'email' | 'createdAt';
    order?: 'asc' | 'desc';
    organizationId?: string;
}
export declare class UserService {
    private userRepository;
    private roleRepository;
    constructor();
    findById(userId: string, relations?: string[]): Promise<User>;
    listUsers(options: ListUsersOptions): Promise<{
        users: User[];
        total: number;
    }>;
    updateUser(userId: string, data: UpdateUserDto, updatedByUserId: string, userRoles?: string[]): Promise<User>;
    deleteUser(userId: string, deletedByUserId: string): Promise<void>;
    assignRoleToUser(userId: string, roleName: string, assignedByUserId: string): Promise<User>;
    removeRoleFromUser(userId: string, roleName: string, removedByUserId: string): Promise<User>;
    updateUserPassword(userId: string, newPasswordHash: string): Promise<void>;
    comparePassword(userId: string, plainTextPass: string): Promise<boolean>;
    /**
     * Fetches a User entity by ID without removing sensitive fields.
     * Primarily for internal service/controller use for authorization checks.
     * @param userId The ID of the user to fetch.
     * @returns The User entity or null if not found.
     */
    findUserEntityById(userId: string): Promise<User | null>;
    findByEmail(email: string, relations?: string[]): Promise<User | null>;
}
export {};
//# sourceMappingURL=userService.d.ts.map