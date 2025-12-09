import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

export enum MetricType {
  USERS = 'users',
  ORGANIZATIONS = 'organizations',
  TEAMS = 'teams',
  SESSIONS = 'sessions',
  STORAGE = 'storage',
  API_CALLS = 'api_calls',
  REVENUE = 'revenue',
  PERFORMANCE = 'performance'
}

export enum MetricPeriod {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

@Entity('system_metrics')
@Index(['type', 'period', 'timestamp'])
@Index(['organizationId', 'type', 'timestamp'])
@Index(['timestamp'])
export class SystemMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: MetricType
  })
  @Index()
  type: MetricType;

  @Column({
    type: 'enum',
    enum: MetricPeriod
  })
  period: MetricPeriod;

  @Column('uuid', { nullable: true })
  @Index()
  organizationId?: string; // null for system-wide metrics

  @Column('timestamp')
  timestamp: Date;

  @Column('timestamp')
  periodStart: Date;

  @Column('timestamp')
  periodEnd: Date;

  @Column({ type: 'bigint' })
  value: string; // Main metric value

  @Column({ type: 'bigint', nullable: true })
  previousValue?: string; // For comparison

  @Column({ type: 'float', nullable: true })
  changePercentage?: number;

  @Column('jsonb')
  breakdown: {
    // For USERS type
    activeUsers?: number;
    newUsers?: number;
    deletedUsers?: number;
    totalLogins?: number;
    uniqueLogins?: number;
    
    // For ORGANIZATIONS type
    activeOrgs?: number;
    newOrgs?: number;
    churnedOrgs?: number;
    
    // For TEAMS type
    activeTeams?: number;
    newTeams?: number;
    averagePlayersPerTeam?: number;
    
    // For SESSIONS type
    totalSessions?: number;
    uniqueSessions?: number;
    averageDuration?: number; // in seconds
    mobilePercentage?: number;
    desktopPercentage?: number;
    
    // For STORAGE type
    totalStorageBytes?: string;
    imagesBytes?: string;
    documentsBytes?: string;
    videosBytes?: string;
    databaseBytes?: string;
    
    // For API_CALLS type
    totalCalls?: number;
    successfulCalls?: number;
    failedCalls?: number;
    averageResponseTime?: number; // in ms
    p95ResponseTime?: number;
    p99ResponseTime?: number;
    byEndpoint?: Record<string, number>;
    byService?: Record<string, number>;
    
    // For REVENUE type
    totalRevenue?: number;
    newRevenue?: number;
    recurringRevenue?: number;
    churn?: number;
    averageRevenuePerUser?: number;
    byPlan?: Record<string, number>;
    
    // For PERFORMANCE type
    cpuUsage?: number;
    memoryUsage?: number;
    diskUsage?: number;
    networkIn?: string;
    networkOut?: string;
    errorRate?: number;
    uptime?: number;
  };

  @Column('jsonb', { nullable: true })
  topItems?: Array<{
    id: string;
    name: string;
    value: number;
    percentage?: number;
  }>;

  @Column('jsonb', { nullable: true })
  alerts?: Array<{
    type: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    threshold?: number;
    value?: number;
  }>;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  // Helper methods
  getValue(): bigint {
    return BigInt(this.value);
  }

  getPreviousValue(): bigint | null {
    return this.previousValue ? BigInt(this.previousValue) : null;
  }

  getGrowthRate(): number {
    if (!this.previousValue || this.previousValue === '0') return 0;
    const current = this.getValue();
    const previous = this.getPreviousValue()!;
    return Number(((current - previous) * 100n) / previous);
  }

  hasAlerts(): boolean {
    return !!this.alerts && this.alerts.length > 0;
  }

  getCriticalAlerts(): any[] {
    return this.alerts?.filter(a => a.severity === 'critical') || [];
  }

  isAnomaly(): boolean {
    // Simple anomaly detection based on percentage change
    const growthRate = this.getGrowthRate();
    
    // Different thresholds for different metric types
    switch (this.type) {
      case MetricType.API_CALLS:
      case MetricType.SESSIONS:
        return Math.abs(growthRate) > 50; // 50% change
      case MetricType.REVENUE:
        return growthRate < -20 || growthRate > 100; // 20% drop or 100% increase
      case MetricType.USERS:
      case MetricType.ORGANIZATIONS:
        return growthRate < -10 || growthRate > 30; // 10% drop or 30% increase
      default:
        return Math.abs(growthRate) > 25; // 25% change
    }
  }
}