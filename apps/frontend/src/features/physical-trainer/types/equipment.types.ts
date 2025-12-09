export interface EquipmentItem {
  id: string;
  type: string; // e.g., 'rowing', 'bike_erg', 'wattbike', etc.
  name: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  facilityId: string;
  facilityName?: string;
  status: EquipmentStatus;
  location?: string;
  condition: EquipmentCondition;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  notes?: string;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  metadata?: {
    maxUsers?: number;
    specifications?: Record<string, any>;
    accessories?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export enum EquipmentStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  RESERVED = 'reserved',
  MAINTENANCE = 'maintenance',
  OUT_OF_ORDER = 'out_of_order',
  RETIRED = 'retired'
}

export enum EquipmentCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  DAMAGED = 'damaged'
}

export interface EquipmentReservation {
  id: string;
  equipmentItemId: string;
  workoutSessionId: string;
  startTime: Date;
  endTime: Date;
  status: ReservationStatus;
  reservedBy: string;
  reservedFor?: string; // Player ID if reserved for specific player
  purpose?: string;
  notes?: string;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  condition?: {
    pre?: EquipmentCondition;
    post?: EquipmentCondition;
    issues?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export interface EquipmentAvailability {
  equipmentType: string;
  facilityId: string;
  totalCount: number;
  availableCount: number;
  inUseCount: number;
  reservedCount: number;
  maintenanceCount: number;
  outOfOrderCount: number;
  items: Array<{
    id: string;
    name: string;
    status: EquipmentStatus;
    currentReservation?: {
      id: string;
      startTime: Date;
      endTime: Date;
      reservedBy: string;
    };
    nextReservation?: {
      id: string;
      startTime: Date;
      endTime: Date;
      reservedBy: string;
    };
  }>;
  upcomingReservations: Array<{
    startTime: Date;
    endTime: Date;
    count: number;
  }>;
}

export interface EquipmentConflict {
  type: 'insufficient_equipment' | 'overlapping_reservation' | 'maintenance_window' | 'facility_closed';
  equipmentType: string;
  requested: number;
  available: number;
  timeSlot: {
    start: Date;
    end: Date;
  };
  conflictingReservations?: EquipmentReservation[];
  suggestions?: Array<{
    type: 'alternative_time' | 'alternative_equipment' | 'reduce_participants';
    description: string;
    timeSlot?: {
      start: Date;
      end: Date;
    };
    alternativeEquipment?: string;
    maxParticipants?: number;
  }>;
}

export interface FacilityEquipmentConfig {
  id: string;
  facilityId: string;
  equipmentType: string;
  maxConcurrentUsers: number;
  maintenanceSchedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    nextDate: Date;
    duration: number; // minutes
  };
  operatingHours?: {
    start: string; // HH:mm format
    end: string;
    days: number[]; // 0-6, Sunday = 0
  };
  restrictions?: {
    roles?: string[];
    minAge?: number;
    maxAge?: number;
    requiresTraining?: boolean;
    requiresSupervision?: boolean;
  };
  settings?: {
    advanceBookingDays: number;
    maxSessionDuration: number; // minutes
    bufferTime: number; // minutes between sessions
    allowOverBooking: boolean;
  };
}

// DTOs for API calls
export interface CreateEquipmentReservationRequest {
  equipmentType: string;
  facilityId: string;
  workoutSessionId: string;
  startTime: string;
  endTime: string;
  requiredCount: number;
  playerIds?: string[];
  notes?: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface BulkReservationRequest {
  reservations: CreateEquipmentReservationRequest[];
  conflictResolution?: 'fail' | 'skip_conflicts' | 'suggest_alternatives';
}

export interface AvailabilityCheckRequest {
  equipmentType: string;
  facilityId: string;
  startTime: string;
  endTime: string;
  requiredCount: number;
}

export interface BulkAvailabilityCheckRequest {
  checks: AvailabilityCheckRequest[];
}

export interface EquipmentFilter {
  page?: number;
  limit?: number;
  type?: string;
  facilityId?: string;
  status?: EquipmentStatus[];
  condition?: EquipmentCondition[];
  search?: string;
  availableOnly?: boolean;
  sortBy?: 'name' | 'type' | 'status' | 'lastMaintenance';
  sortOrder?: 'asc' | 'desc';
}

export interface EquipmentSummary {
  facilityId: string;
  facilityName: string;
  totalEquipment: number;
  byType: Record<string, {
    total: number;
    available: number;
    inUse: number;
    maintenance: number;
    outOfOrder: number;
  }>;
  byStatus: Record<EquipmentStatus, number>;
  utilizationRate: number; // percentage
  maintenanceDue: {
    overdue: number;
    upcoming: number; // next 7 days
  };
  alerts: Array<{
    type: 'maintenance_overdue' | 'equipment_down' | 'high_utilization' | 'warranty_expiring';
    count: number;
    priority: 'low' | 'medium' | 'high';
    message: string;
  }>;
}