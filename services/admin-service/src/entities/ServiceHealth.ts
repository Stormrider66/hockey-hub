import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@hockey-hub/shared-lib/entities/BaseEntity';

export enum ServiceStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  OFFLINE = 'offline'
}

export enum ServiceName {
  API_GATEWAY = 'api-gateway',
  USER_SERVICE = 'user-service',
  CALENDAR_SERVICE = 'calendar-service',
  TRAINING_SERVICE = 'training-service',
  MEDICAL_SERVICE = 'medical-service',
  COMMUNICATION_SERVICE = 'communication-service',
  PAYMENT_SERVICE = 'payment-service',
  STATISTICS_SERVICE = 'statistics-service',
  PLANNING_SERVICE = 'planning-service',
  ADMIN_SERVICE = 'admin-service'
}

@Entity('service_health')
@Index(['serviceName', 'timestamp'])
@Index(['status', 'timestamp'])
@Index(['timestamp'])
export class ServiceHealth extends BaseEntity {

  @Column({
    type: 'enum',
    enum: ServiceName
  })
  @Index()
  serviceName: ServiceName;

  @Column({
    type: 'enum',
    enum: ServiceStatus
  })
  status: ServiceStatus;

  @Column('timestamp')
  timestamp: Date;

  @Column({ type: 'float' })
  responseTime: number; // in milliseconds

  @Column({ type: 'float' })
  cpuUsage: number; // percentage

  @Column({ type: 'float' })
  memoryUsage: number; // percentage

  @Column({ type: 'bigint' })
  memoryUsedBytes: string; // actual bytes used

  @Column({ type: 'bigint' })
  memoryTotalBytes: string; // total memory available

  @Column({ type: 'int' })
  activeConnections: number;

  @Column({ type: 'int' })
  requestsPerMinute: number;

  @Column({ type: 'float' })
  errorRate: number; // percentage

  @Column('jsonb', { nullable: true })
  healthChecks?: {
    database?: {
      status: 'healthy' | 'unhealthy';
      responseTime: number;
      error?: string;
    };
    redis?: {
      status: 'healthy' | 'unhealthy';
      responseTime: number;
      error?: string;
    };
    dependencies?: Array<{
      name: string;
      status: 'healthy' | 'unhealthy';
      responseTime: number;
      error?: string;
    }>;
  };

  @Column('simple-array', { nullable: true })
  errors?: string[];

  @Column('simple-array', { nullable: true })
  warnings?: string[];

  @Column('jsonb', { nullable: true })
  metrics?: {
    p50ResponseTime?: number;
    p95ResponseTime?: number;
    p99ResponseTime?: number;
    totalRequests?: number;
    failedRequests?: number;
    queuedRequests?: number;
  };

  @Column({ nullable: true })
  version?: string;

  @Column({ nullable: true })
  uptime?: number; // in seconds

  @Column({ nullable: true })
  lastRestartReason?: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  // Helper methods
  isHealthy(): boolean {
    return this.status === ServiceStatus.HEALTHY;
  }

  isDegraded(): boolean {
    return this.status === ServiceStatus.DEGRADED;
  }

  getHealthScore(): number {
    let score = 100;

    // Deduct points based on various metrics
    if (this.status === ServiceStatus.UNHEALTHY) score -= 50;
    if (this.status === ServiceStatus.DEGRADED) score -= 25;
    if (this.status === ServiceStatus.OFFLINE) return 0;

    // Response time (expecting < 100ms for healthy)
    if (this.responseTime > 500) score -= 20;
    else if (this.responseTime > 200) score -= 10;
    else if (this.responseTime > 100) score -= 5;

    // CPU usage
    if (this.cpuUsage > 80) score -= 20;
    else if (this.cpuUsage > 60) score -= 10;
    else if (this.cpuUsage > 40) score -= 5;

    // Memory usage
    if (this.memoryUsage > 85) score -= 15;
    else if (this.memoryUsage > 70) score -= 10;
    else if (this.memoryUsage > 50) score -= 5;

    // Error rate
    if (this.errorRate > 5) score -= 25;
    else if (this.errorRate > 2) score -= 15;
    else if (this.errorRate > 0.5) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  requiresAttention(): boolean {
    return this.status !== ServiceStatus.HEALTHY ||
           this.cpuUsage > 80 ||
           this.memoryUsage > 85 ||
           this.errorRate > 2 ||
           this.responseTime > 500;
  }
}