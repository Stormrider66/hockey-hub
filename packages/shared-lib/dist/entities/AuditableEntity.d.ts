import { BaseEntity as TypeORMBaseEntity } from 'typeorm';
/**
 * Base entity with audit columns that tracks who created/updated records
 * Includes UUID primary key for consistency
 */
export declare abstract class AuditableEntity extends TypeORMBaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    updatedBy?: string;
    deletedAt?: Date;
    deletedBy?: string;
    lastRequestId?: string;
    lastIpAddress?: string;
    /**
     * Set audit fields before insert
     */
    setCreateAuditFields(): void;
    /**
     * Set audit fields before update
     */
    setUpdateAuditFields(): void;
    /**
     * Soft delete with audit info
     */
    softDelete(userId?: string): void;
    /**
     * Check if entity is deleted
     */
    get isDeleted(): boolean;
}
/**
 * Interface for request context that should be set in middleware
 */
export interface RequestContext {
    userId: string;
    requestId: string;
    ipAddress: string;
    organizationId?: string;
    role?: string;
}
/**
 * Helper to set request context for audit fields
 */
export declare function setRequestContext(context: RequestContext): void;
/**
 * Helper to clear request context
 */
export declare function clearRequestContext(): void;
/**
 * Middleware to automatically set request context
 */
export declare function auditContextMiddleware(req: any, res: any, next: any): void;
//# sourceMappingURL=AuditableEntity.d.ts.map