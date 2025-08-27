export declare enum Handedness {
    LEFT = "left",
    RIGHT = "right",
    AMBIDEXTROUS = "ambidextrous"
}
export declare enum UserRole {
    PLAYER = "player",
    COACH = "coach",
    ASSISTANT_COACH = "assistant_coach",
    TEAM_MANAGER = "team_manager",
    PARENT = "parent",
    MEDICAL_STAFF = "medical_staff",
    ADMIN = "admin",
    SUPER_ADMIN = "super_admin"
}
export declare class CreateUserValidation {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string;
    jerseyNumber?: number;
    position?: string;
    handedness?: Handedness;
    profileImageUrl?: string;
}
export declare class UpdateUserValidation {
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: string;
    jerseyNumber?: number;
    position?: string;
    handedness?: Handedness;
    profileImageUrl?: string;
    isActive?: boolean;
}
export declare class ChangePasswordValidation {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}
export declare class GetUsersQueryValidation {
    organizationId?: string;
    teamId?: string;
    role?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
export declare class AddUserToOrganizationValidation {
    organizationId: string;
    role: UserRole;
}
export declare class AddUserToTeamValidation {
    userId: string;
    role: string;
    jerseyNumber?: number;
    position?: string;
}
export declare class BulkUserOperationValidation {
    userIds: string[];
}
export declare class ParentChildRelationshipValidation {
    parentUserId: string;
    childUserId: string;
    relationshipType?: string;
    isPrimaryContact?: boolean;
}
//# sourceMappingURL=user.validation.d.ts.map