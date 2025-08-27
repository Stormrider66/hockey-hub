import { 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  BeforeInsert, 
  BeforeUpdate,
  PrimaryGeneratedColumn,
  BaseEntity as TypeORMBaseEntity
} from 'typeorm';

/**
 * Base entity with audit columns that tracks who created/updated records
 * Includes UUID primary key for consistency
 */
export abstract class AuditableEntity extends TypeORMBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  deletedBy?: string;

  // Optional: Track the request ID for audit trail
  @Column({ type: 'varchar', nullable: true })
  lastRequestId?: string;

  // Optional: Track the IP address
  @Column({ type: 'varchar', nullable: true })
  lastIpAddress?: string;

  /**
   * Set audit fields before insert
   */
  @BeforeInsert()
  setCreateAuditFields() {
    const context = (global as any).__requestContext;
    if (context) {
      this.createdBy = context.userId || 'system';
      this.lastRequestId = context.requestId;
      this.lastIpAddress = context.ipAddress;
    }
  }

  /**
   * Set audit fields before update
   */
  @BeforeUpdate()
  setUpdateAuditFields() {
    const context = (global as any).__requestContext;
    if (context) {
      this.updatedBy = context.userId || 'system';
      this.lastRequestId = context.requestId;
      this.lastIpAddress = context.ipAddress;
    }
  }

  /**
   * Soft delete with audit info
   */
  softDelete(userId?: string) {
    this.deletedAt = new Date();
    this.deletedBy = userId || (global as any).__requestContext?.userId || 'system';
  }

  /**
   * Check if entity is deleted
   */
  get isDeleted(): boolean {
    return !!this.deletedAt;
  }
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
export function setRequestContext(context: RequestContext) {
  (global as any).__requestContext = context;
}

/**
 * Helper to clear request context
 */
export function clearRequestContext() {
  delete (global as any).__requestContext;
}

/**
 * Middleware to automatically set request context
 */
export function auditContextMiddleware(req: any, res: any, next: any) {
  setRequestContext({
    userId: req.user?.id || 'anonymous',
    requestId: req.id || req.headers['x-request-id'],
    ipAddress: req.ip || req.connection?.remoteAddress,
    organizationId: req.user?.organizationId,
    role: req.user?.role,
  });

  // Clear context after response
  res.on('finish', () => {
    clearRequestContext();
  });

  next();
}