import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  READ = 'read',
  LOGIN = 'login',
  LOGOUT = 'logout',
  EXPORT = 'export',
  IMPORT = 'import',
  PERMISSION_GRANT = 'permission_grant',
  PERMISSION_REVOKE = 'permission_revoke',
  CONFIG_CHANGE = 'config_change',
  SYSTEM_EVENT = 'system_event'
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

@Entity('audit_logs')
@Index(['userId', 'timestamp'])
@Index(['organizationId', 'timestamp'])
@Index(['entityType', 'entityId', 'timestamp'])
@Index(['action', 'timestamp'])
@Index(['timestamp'])
@Index(['requestId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  @Index()
  userId?: string;

  @Column({ nullable: true })
  userEmail?: string;

  @Column({ nullable: true })
  userName?: string;

  @Column('uuid', { nullable: true })
  @Index()
  organizationId?: string;

  @Column({
    type: 'enum',
    enum: AuditAction
  })
  action: AuditAction;

  @Column({
    type: 'enum',
    enum: AuditSeverity,
    default: AuditSeverity.INFO
  })
  severity: AuditSeverity;

  @Column({ nullable: true })
  @Index()
  entityType?: string; // e.g., 'User', 'Team', 'Organization'

  @Column('uuid', { nullable: true })
  entityId?: string;

  @Column({ nullable: true })
  entityName?: string; // Human-readable name

  @Column('text', { nullable: true })
  description?: string;

  @Column('jsonb', { nullable: true })
  oldValues?: Record<string, any>;

  @Column('jsonb', { nullable: true })
  newValues?: Record<string, any>;

  @Column('jsonb', { nullable: true })
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @Column({ nullable: true })
  requestId?: string;

  @Column({ nullable: true })
  sessionId?: string;

  @Column({ nullable: true })
  serviceName?: string;

  @Column({ nullable: true })
  endpoint?: string;

  @Column({ nullable: true })
  httpMethod?: string;

  @Column({ type: 'int', nullable: true })
  statusCode?: number;

  @Column({ type: 'float', nullable: true })
  duration?: number; // in milliseconds

  @Column('timestamp')
  @Index()
  timestamp: Date;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  errorMessage?: string;

  @Column('text', { nullable: true })
  stackTrace?: string;

  // Helper methods
  isSuccess(): boolean {
    return !this.errorMessage && typeof this.statusCode === 'number' && this.statusCode < 400;
  }

  isSecurityRelevant(): boolean {
    const securityActions = [
      AuditAction.LOGIN,
      AuditAction.LOGOUT,
      AuditAction.PERMISSION_GRANT,
      AuditAction.PERMISSION_REVOKE,
      AuditAction.CONFIG_CHANGE
    ];
    return securityActions.includes(this.action) || 
           this.severity === AuditSeverity.CRITICAL ||
           this.severity === AuditSeverity.ERROR;
  }

  getChangeSummary(): string {
    if (!this.changes || this.changes.length === 0) {
      return this.description || `${this.action} on ${this.entityType}`;
    }

    const changedFields = this.changes.map(c => c.field).join(', ');
    return `Changed ${changedFields} on ${this.entityType}`;
  }

  requiresInvestigation(): boolean {
    return this.severity === AuditSeverity.ERROR ||
           this.severity === AuditSeverity.CRITICAL ||
           (typeof this.statusCode === 'number' && this.statusCode >= 500);
  }
}