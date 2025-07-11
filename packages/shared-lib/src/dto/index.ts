// Export all DTOs
export * from './user.dto';
export * from './organization.dto';
export * from './team.dto';
export * from './auth.dto';
export * from './common.dto';
export * from './training.dto';
export * from './medical.dto';
export * from './calendar.dto';
export * from './interval-program.dto';

// Common response DTOs
export interface SuccessResponseDTO<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponseDTO {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResponseDTO<T> {
  data: T[];
  pagination: PaginationDTO;
}

// Service communication headers
export interface ServiceHeaders {
  'x-service-name': string;
  'x-service-version': string;
  'x-request-id': string;
  'x-user-id'?: string;
  'x-organization-id'?: string;
  'x-correlation-id'?: string;
}

// Event envelope for event bus
export interface EventEnvelope<T = any> {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  correlationId?: string;
  metadata?: Record<string, any>;
  data: T;
}