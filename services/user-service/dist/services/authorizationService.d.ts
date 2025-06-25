/**
 * Checks if a user has permission to perform an action on a resource.
 * This service centralizes authorization logic.
 *
 * @param userId The ID of the user attempting the action.
 * @param action The action being performed (e.g., 'read', 'update', 'delete').
 * @param resourceType The type of resource being accessed (e.g., 'team', 'user', 'event').
 * @param resourceId Optional ID of the specific resource being accessed.
 * @param resourceOrganizationId Optional ID of the organization the resource belongs to (provided by caller).
 * @returns Promise<boolean> True if authorized, false otherwise.
 */
export declare const canPerformAction: (userId: string, action: string, resourceType: string, resourceId?: string, resourceOrganizationId?: string) => Promise<boolean>;
//# sourceMappingURL=authorizationService.d.ts.map