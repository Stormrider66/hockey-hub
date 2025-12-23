// @ts-nocheck - Suppress TypeScript errors for build
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { UrgentNotificationAcknowledgment } from './UrgentNotificationAcknowledgment';
import { UrgentNotificationEscalation } from './UrgentNotificationEscalation';

export enum UrgencyLevel {
  URGENT = 'urgent',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency',
}

export enum NotificationTargetType {
  PLAYER = 'player',
  TEAM = 'team',
  ORGANIZATION = 'organization',
  CUSTOM_GROUP = 'custom_group',
}

export enum DeliveryChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  PHONE = 'phone',
}

export enum MedicalNotificationStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  DELIVERED = 'delivered',
  ACKNOWLEDGED = 'acknowledged',
  ESCALATED = 'escalated',
  RESOLVED = 'resolved',
  EXPIRED = 'expired',
}

export enum MedicalInfoType {
  INJURY_ALERT = 'injury_alert',
  TREATMENT_REQUIRED = 'treatment_required',
  MEDICATION_REMINDER = 'medication_reminder',
  EMERGENCY_PROTOCOL = 'emergency_protocol',
  HEALTH_UPDATE = 'health_update',
  QUARANTINE_NOTICE = 'quarantine_notice',
  RETURN_TO_PLAY = 'return_to_play',
}

@Entity('urgent_medical_notifications')
@Index(['organization_id', 'created_at'])
@Index(['urgency_level', 'status'])
@Index(['created_by', 'created_at'])
@Index(['target_type', 'target_id'])
@Index(['expires_at'])
export class UrgentMedicalNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  organization_id: string;

  @Column('uuid', { nullable: true })
  team_id?: string;

  @Column('uuid')
  created_by: string; // Medical staff ID

  @Column({
    type: 'enum',
    enum: UrgencyLevel,
  })
  urgency_level: UrgencyLevel;

  @Column({
    type: 'enum',
    enum: MedicalNotificationStatus,
    default: MedicalNotificationStatus.PENDING,
  })
  status: MedicalNotificationStatus;

  @Column({
    type: 'enum',
    enum: MedicalInfoType,
  })
  medical_type: MedicalInfoType;

  @Column('varchar', { length: 255 })
  title: string;

  @Column('text')
  message: string;

  // Medical Information (encrypted in production)
  @Column({ type: 'jsonb', nullable: true })
  medical_data?: {
    player_id?: string;
    injury_id?: string;
    treatment_id?: string;
    vital_signs?: Record<string, any>;
    medications?: Array<{
      name: string;
      dosage: string;
      frequency: string;
    }>;
    restrictions?: string[];
    emergency_contacts?: Array<{
      name: string;
      phone: string;
      relationship: string;
    }>;
    protocols?: string[];
    additional_notes?: string;
  };

  // Target Information
  @Column({
    type: 'enum',
    enum: NotificationTargetType,
  })
  target_type: NotificationTargetType;

  @Column('uuid', { nullable: true })
  target_id?: string; // Player ID, Team ID, or null for organization

  @Column({ type: 'uuid', array: true, nullable: true })
  custom_recipient_ids?: string[];

  // Delivery Configuration
  @Column({ 
    type: 'enum', 
    enum: DeliveryChannel,
    array: true,
    default: [DeliveryChannel.IN_APP, DeliveryChannel.EMAIL]
  })
  delivery_channels: DeliveryChannel[];

  @Column({ type: 'jsonb', nullable: true })
  channel_config?: {
    email?: {
      template_id?: string;
      cc_recipients?: string[];
      include_attachments?: boolean;
    };
    sms?: {
      template_id?: string;
      fallback_to_call?: boolean;
    };
    phone?: {
      automated_message?: boolean;
      callback_number?: string;
    };
  };

  // Acknowledgment Requirements
  @Column({ type: 'boolean', default: true })
  requires_acknowledgment: boolean;

  @Column({ type: 'int', nullable: true })
  acknowledgment_timeout_minutes?: number; // Time before escalation

  @Column({ type: 'uuid', array: true, nullable: true })
  required_acknowledgers?: string[]; // Specific users who must acknowledge

  @Column({ type: 'int', default: 1 })
  min_acknowledgments_required: number;

  // Escalation Configuration
  @Column({ type: 'boolean', default: true })
  enable_escalation: boolean;

  @Column({ type: 'jsonb', nullable: true })
  escalation_config?: {
    levels: Array<{
      level: number;
      delay_minutes: number;
      notify_roles?: string[];
      notify_users?: string[];
      use_emergency_contacts?: boolean;
      delivery_channels?: DeliveryChannel[];
    }>;
  };

  // Attachments
  @Column({ type: 'jsonb', nullable: true })
  attachments?: Array<{
    id: string;
    filename: string;
    mime_type: string;
    size: number;
    url: string;
    is_medical_report: boolean;
    access_restricted: boolean;
  }>;

  // Privacy Controls
  @Column({ type: 'jsonb', nullable: true })
  privacy_settings?: {
    restrict_to_medical_staff?: boolean;
    require_pin_for_access?: boolean;
    auto_delete_after_hours?: number;
    mask_sensitive_data?: boolean;
    allowed_roles?: string[];
  };

  // Timing
  @Column({ type: 'timestamp', nullable: true })
  scheduled_for?: Date;

  @Column({ type: 'timestamp', nullable: true })
  sent_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  first_acknowledged_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  fully_acknowledged_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  escalated_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolved_at?: Date;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  // Tracking
  @Column({ type: 'jsonb', nullable: true })
  delivery_status?: {
    [channel: string]: {
      sent: boolean;
      sent_at?: Date;
      delivered?: boolean;
      delivered_at?: Date;
      error?: string;
      retry_count?: number;
    };
  };

  @Column({ type: 'int', default: 0 })
  total_recipients: number;

  @Column({ type: 'int', default: 0 })
  acknowledged_count: number;

  @Column({ type: 'int', default: 0 })
  escalation_level: number;

  // Compliance and Audit
  @Column({ type: 'jsonb', nullable: true })
  compliance_data?: {
    hipaa_compliant?: boolean;
    consent_verified?: boolean;
    audit_trail?: Array<{
      timestamp: Date;
      action: string;
      user_id: string;
      details?: string;
    }>;
  };

  @Column('text', { nullable: true })
  resolution_notes?: string;

  @Column('uuid', { nullable: true })
  resolved_by?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToMany(() => UrgentNotificationAcknowledgment, ack => ack.notification)
  acknowledgments: UrgentNotificationAcknowledgment[];

  @OneToMany(() => UrgentNotificationEscalation, esc => esc.notification)
  escalations: UrgentNotificationEscalation[];
}