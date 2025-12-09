export enum UrgencyLevel {
  URGENT = 'urgent',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency',
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

export enum AcknowledgmentMethod {
  IN_APP = 'in_app',
  EMAIL_LINK = 'email_link',
  SMS_REPLY = 'sms_reply',
  PHONE_CONFIRMATION = 'phone_confirmation',
  API = 'api',
}

export interface UrgentMedicalNotification {
  id: string;
  organizationId: string;
  teamId?: string;
  createdBy: string;
  urgencyLevel: UrgencyLevel;
  status: MedicalNotificationStatus;
  medicalType: MedicalInfoType;
  title: string;
  message: string;
  medicalData?: {
    playerId?: string;
    injuryId?: string;
    treatmentId?: string;
    vitalSigns?: Record<string, any>;
    medications?: Array<{
      name: string;
      dosage: string;
      frequency: string;
    }>;
    restrictions?: string[];
    emergencyContacts?: Array<{
      name: string;
      phone: string;
      relationship: string;
    }>;
    protocols?: string[];
    additionalNotes?: string;
  };
  targetType: NotificationTargetType;
  targetId?: string;
  customRecipientIds?: string[];
  deliveryChannels: DeliveryChannel[];
  channelConfig?: any;
  requiresAcknowledgment: boolean;
  acknowledgmentTimeoutMinutes?: number;
  requiredAcknowledgers?: string[];
  minAcknowledgmentsRequired: number;
  enableEscalation: boolean;
  escalationConfig?: {
    levels: Array<{
      level: number;
      delayMinutes: number;
      notifyRoles?: string[];
      notifyUsers?: string[];
      useEmergencyContacts?: boolean;
      deliveryChannels?: DeliveryChannel[];
    }>;
  };
  attachments?: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    url: string;
    isMedicalReport: boolean;
    accessRestricted: boolean;
  }>;
  privacySettings?: {
    restrictToMedicalStaff?: boolean;
    requirePinForAccess?: boolean;
    autoDeleteAfterHours?: number;
    maskSensitiveData?: boolean;
    allowedRoles?: string[];
  };
  scheduledFor?: Date;
  sentAt?: Date;
  firstAcknowledgedAt?: Date;
  fullyAcknowledgedAt?: Date;
  escalatedAt?: Date;
  resolvedAt?: Date;
  expiresAt: Date;
  deliveryStatus?: Record<string, any>;
  totalRecipients: number;
  acknowledgedCount: number;
  escalationLevel: number;
  complianceData?: any;
  resolutionNotes?: string;
  resolvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UrgentNotificationAcknowledgment {
  id: string;
  notificationId: string;
  userId: string;
  userName: string;
  userRole: string;
  method: AcknowledgmentMethod;
  message?: string;
  deviceInfo?: {
    ipAddress?: string;
    userAgent?: string;
    deviceType?: string;
    location?: {
      latitude?: number;
      longitude?: number;
      accuracy?: number;
    };
  };
  isEmergencyContact: boolean;
  responseTimeSeconds?: number;
  additionalActions?: {
    viewedAttachments?: boolean;
    forwardedTo?: string[];
    addedNotes?: boolean;
    initiatedCall?: boolean;
  };
  createdAt: Date;
}

export interface CreateUrgentNotificationDto {
  urgencyLevel: UrgencyLevel;
  medicalType: MedicalInfoType;
  title: string;
  message: string;
  medicalData?: any;
  targetType: NotificationTargetType;
  targetId?: string;
  customRecipientIds?: string[];
  deliveryChannels: DeliveryChannel[];
  channelConfig?: any;
  requiresAcknowledgment?: boolean;
  acknowledgmentTimeoutMinutes?: number;
  requiredAcknowledgers?: string[];
  minAcknowledgmentsRequired?: number;
  enableEscalation?: boolean;
  escalationConfig?: any;
  attachments?: any[];
  privacySettings?: any;
  scheduledFor?: Date;
  expiresInHours?: number;
}