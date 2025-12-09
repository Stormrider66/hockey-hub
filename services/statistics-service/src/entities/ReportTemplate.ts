import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

export interface ReportSection {
  id: string;
  type: 'text' | 'chart' | 'table' | 'image' | 'metric' | 'divider';
  title?: string;
  content?: any;
  config?: any;
  style?: {
    width?: string;
    height?: string;
    margin?: string;
    padding?: string;
    backgroundColor?: string;
    border?: string;
  };
  dataSource?: string;
  filters?: any[];
  order: number;
}

export interface ReportLayout {
  orientation: 'portrait' | 'landscape';
  format: 'A4' | 'letter' | 'legal';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  header?: {
    enabled: boolean;
    content: string;
    height: number;
  };
  footer?: {
    enabled: boolean;
    content: string;
    height: number;
  };
  theme?: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    fontSize: number;
  };
}

export interface ReportFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  teams?: string[];
  players?: string[];
  workoutTypes?: string[];
  categories?: string[];
  customFilters?: Array<{
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
    value: any;
  }>;
}

export interface ReportMetadata {
  author: string;
  description?: string;
  tags: string[];
  category: string;
  permissions: {
    view: string[];
    edit: string[];
    admin: string[];
  };
  isPublic: boolean;
  version: string;
  lastModified: Date;
}

@Entity('report_templates')
export class ReportTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  type: 'team_performance' | 'player_progress' | 'workout_effectiveness' | 'medical_report' | 'attendance' | 'custom_kpi' | 'executive_summary' | 'custom';

  @Column()
  category: string;

  @Column('jsonb')
  sections: ReportSection[];

  @Column('jsonb')
  layout: ReportLayout;

  @Column('jsonb')
  defaultFilters: ReportFilters;

  @Column('jsonb')
  metadata: ReportMetadata;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isSystemTemplate: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => GeneratedReport, report => report.template)
  generatedReports: GeneratedReport[];
}

@Entity('generated_reports')
export class GeneratedReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => ReportTemplate, template => template.generatedReports)
  @JoinColumn({ name: 'templateId' })
  template: ReportTemplate;

  @Column()
  templateId: string;

  @Column('jsonb')
  appliedFilters: ReportFilters;

  @Column('jsonb')
  generatedData: any;

  @Column()
  format: 'pdf' | 'excel' | 'csv' | 'html';

  @Column({ nullable: true })
  filePath: string;

  @Column({ nullable: true })
  downloadUrl: string;

  @Column()
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'expired';

  @Column({ nullable: true })
  errorMessage: string;

  @Column()
  generatedBy: string;

  @Column({ nullable: true })
  organizationId: string;

  @Column({ nullable: true })
  scheduledReportId: string;

  @Column('jsonb', { nullable: true })
  metadata: {
    fileSize?: number;
    pageCount?: number;
    generationTime?: number;
    dataPoints?: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  expiresAt: Date;
}

@Entity('scheduled_reports')
export class ScheduledReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => ReportTemplate)
  @JoinColumn({ name: 'templateId' })
  template: ReportTemplate;

  @Column()
  templateId: string;

  @Column('jsonb')
  filters: ReportFilters;

  @Column()
  schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';

  @Column({ nullable: true })
  cronExpression: string;

  @Column('simple-array')
  formats: string[];

  @Column('jsonb')
  delivery: {
    method: 'email' | 'download' | 'both';
    recipients: string[];
    subject?: string;
    message?: string;
    attachmentName?: string;
  };

  @Column({ default: true })
  isActive: boolean;

  @Column()
  createdBy: string;

  @Column({ nullable: true })
  organizationId: string;

  @Column({ nullable: true })
  nextRun: Date;

  @Column({ nullable: true })
  lastRun: Date;

  @Column({ default: 0 })
  runCount: number;

  @Column({ nullable: true })
  lastStatus: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}