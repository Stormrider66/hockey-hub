import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/dist/entities/AuditableEntity';

@Entity('facility_analytics')
@Index(['facilityId', 'date'])
@Index(['organizationId', 'facilityType', 'date'])
@Index(['date', 'revenueCategory'])
export class FacilityAnalytics extends AuditableEntity {
  id!: string;

  @Column('uuid')
  @Index()
  facilityId!: string;

  @Column('uuid')
  @Index()
  organizationId!: string;

  @Column('date')
  @Index()
  date!: Date;

  @Column('varchar', { length: 50 })
  @Index()
  facilityType!: string; // ice_rink, gym, training_room, meeting_room

  @Column('varchar', { length: 100 })
  facilityName!: string;

  // Utilization Metrics
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  utilizationRate: number = 0; // percentage

  @Column('int', { default: 0 })
  totalBookings: number = 0;

  @Column('int', { default: 0 })
  successfulBookings: number = 0;

  @Column('int', { default: 0 })
  cancelledBookings: number = 0;

  @Column('int', { default: 0 })
  noShowBookings: number = 0;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  totalHoursBooked: number = 0;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  totalHoursAvailable: number = 0;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  peakHoursUtilization: number = 0;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  offPeakHoursUtilization: number = 0;

  // Peak Usage Patterns
  @Column('jsonb', { nullable: true })
  hourlyUsage?: {
    hour: number; // 0-23
    bookings: number;
    utilization: number;
    revenue: number;
  }[];

  @Column('jsonb', { nullable: true })
  dailyPatterns?: {
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    averageBookings: number;
    averageUtilization: number;
    averageRevenue: number;
  }[];

  @Column('varchar', { length: 20, nullable: true })
  peakDay?: string; // monday, tuesday, etc.

  @Column('int', { nullable: true })
  peakHour?: number; // 0-23

  // Revenue Analytics
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalRevenue: number = 0;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  revenuePerHour: number = 0;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  revenuePerBooking: number = 0;

  @Column('varchar', { length: 50, nullable: true })
  @Index()
  revenueCategory?: string; // team_practice, individual_training, camp, tournament

  @Column('jsonb', { nullable: true })
  revenueBreakdown?: {
    category: string;
    amount: number;
    percentage: number;
    bookings: number;
  }[];

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  costPerHour?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  profitMargin?: number;

  // Booking Analytics
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  averageBookingDuration?: number; // hours

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  averageAdvanceBooking?: number; // days

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  repeatCustomerRate: number = 0; // percentage

  @Column('int', { default: 0 })
  uniqueCustomers: number = 0;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  customerSatisfactionScore: number = 0;

  // Efficiency Metrics
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  turnoverRate?: number; // bookings per day

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  setupTime?: number; // minutes

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  cleanupTime?: number; // minutes

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  maintenanceTime?: number; // hours per week

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  downtime?: number; // hours

  // Optimization Opportunities
  @Column('jsonb', { nullable: true })
  optimizationSuggestions?: {
    type: string; // pricing, scheduling, capacity, maintenance
    description: string;
    potentialImpact: string; // revenue, utilization, efficiency
    estimatedValue: number;
    implementation: string; // immediate, short_term, long_term
    priority: string; // low, medium, high
  }[];

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  unutilizedCapacity?: number; // percentage

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  revenueOpportunity?: number; // potential additional revenue

  // Conflict Analysis
  @Column('int', { default: 0 })
  bookingConflicts: number = 0;

  @Column('int', { default: 0 })
  doubleBookings: number = 0;

  @Column('int', { default: 0 })
  overbookings: number = 0;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  conflictResolutionTime: number = 0; // average minutes

  // Resource Allocation
  @Column('jsonb', { nullable: true })
  equipmentUsage?: {
    equipmentId: string;
    equipmentName: string;
    hoursUsed: number;
    utilizationRate: number;
    condition: string;
  }[];

  @Column('jsonb', { nullable: true })
  staffAssignment?: {
    staffId: string;
    role: string;
    hoursAssigned: number;
    efficiency: number;
  }[];

  // Environmental Factors
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  temperature?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  humidity?: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  energyCost?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  energyEfficiency?: number;

  // Metadata
  @Column('varchar', { length: 50, default: 'active' })
  @Index()
  status: string = 'active';

  @Column('jsonb', { nullable: true })
  metadata?: {
    calculationMethod?: string;
    dataQuality?: number;
    weatherConditions?: string;
    specialEvents?: string[];
    notes?: string;
    alerts?: string[];
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}