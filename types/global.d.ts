/**
 * Global type declarations for Hockey Hub
 * This file contains type definitions for modules that don't have available @types packages
 * and global environment variables
 */

// Environment Variables
declare namespace NodeJS {
  interface ProcessEnv {
    // Common environment variables
    NODE_ENV: 'development' | 'production' | 'test' | 'e2e';
    PORT?: string;
    HOST?: string;
    
    // Database
    DB_HOST?: string;
    DB_PORT?: string;
    DB_USERNAME?: string;
    DB_PASSWORD?: string;
    DB_DATABASE?: string;
    DATABASE_URL?: string;
    
    // Redis
    REDIS_HOST?: string;
    REDIS_PORT?: string;
    REDIS_PASSWORD?: string;
    REDIS_URL?: string;
    
    // JWT & Auth
    JWT_SECRET?: string;
    JWT_REFRESH_SECRET?: string;
    JWT_EXPIRES_IN?: string;
    JWT_REFRESH_EXPIRES_IN?: string;
    
    // API Keys & External Services
    AWS_ACCESS_KEY_ID?: string;
    AWS_SECRET_ACCESS_KEY?: string;
    AWS_REGION?: string;
    AWS_S3_BUCKET?: string;
    
    SENDGRID_API_KEY?: string;
    TWILIO_ACCOUNT_SID?: string;
    TWILIO_AUTH_TOKEN?: string;
    TWILIO_PHONE_NUMBER?: string;
    
    // Service URLs
    API_GATEWAY_URL?: string;
    USER_SERVICE_URL?: string;
    COMMUNICATION_SERVICE_URL?: string;
    CALENDAR_SERVICE_URL?: string;
    TRAINING_SERVICE_URL?: string;
    MEDICAL_SERVICE_URL?: string;
    PLANNING_SERVICE_URL?: string;
    STATISTICS_SERVICE_URL?: string;
    PAYMENT_SERVICE_URL?: string;
    ADMIN_SERVICE_URL?: string;
    FILE_SERVICE_URL?: string;
    
    // Feature flags
    ENABLE_RATE_LIMITING?: string;
    ENABLE_REDIS_CACHE?: string;
    ENABLE_EMAIL_NOTIFICATIONS?: string;
    ENABLE_SMS_NOTIFICATIONS?: string;
    ENABLE_PUSH_NOTIFICATIONS?: string;
    
    // Monitoring & Logging
    LOG_LEVEL?: 'error' | 'warn' | 'info' | 'debug';
    ENABLE_REQUEST_LOGGING?: string;
    SENTRY_DSN?: string;
    
    // Frontend specific
    NEXT_PUBLIC_API_BASE_URL?: string;
    NEXT_PUBLIC_WS_URL?: string;
    NEXT_PUBLIC_SOCKET_URL?: string;
  }
}

// Module declarations for libraries without types
declare module 'clamav.js' {
  interface ClamAVOptions {
    removeInfected?: boolean;
    quarantineInfected?: boolean;
    scanLog?: string;
    debugMode?: boolean;
    fileList?: string;
    db?: string;
    clamscan?: {
      path?: string;
      db?: string;
      scanArchives?: boolean;
      active?: boolean;
    };
    clamdscan?: {
      socket?: string | boolean;
      host?: string;
      port?: number;
      timeout?: number;
      localFallback?: boolean;
      path?: string;
      configFile?: string;
      multiscan?: boolean;
      reloadDb?: boolean;
      active?: boolean;
      bypassTest?: boolean;
    };
    preference?: 'clamdscan' | 'clamscan';
  }

  interface ScanResult {
    isInfected: boolean;
    file?: string;
    viruses?: string[];
  }

  class NodeClamAV {
    constructor(options?: ClamAVOptions);
    scanFile(file: string): Promise<ScanResult>;
    scanFiles(files: string[]): Promise<ScanResult[]>;
    scanDir(dir: string): Promise<ScanResult>;
    isInfected(file: string): Promise<boolean>;
    getVersion(): Promise<string>;
  }

  export = NodeClamAV;
}

declare module 'multer-s3' {
  import { Request } from 'express';
  import { S3Client } from '@aws-sdk/client-s3';
  import * as multer from 'multer';

  interface Options {
    s3: S3Client;
    bucket: string | ((req: Request, file: Express.Multer.File, cb: (error: any, bucket?: string) => void) => void);
    key?: (req: Request, file: Express.Multer.File, cb: (error: any, key?: string) => void) => void;
    acl?: string | ((req: Request, file: Express.Multer.File, cb: (error: any, acl?: string) => void) => void);
    contentType?: (req: Request, file: Express.Multer.File, cb: (error: any, mime?: string, stream?: NodeJS.ReadableStream) => void) => void;
    contentDisposition?: string | ((req: Request, file: Express.Multer.File, cb: (error: any, contentDisposition?: string) => void) => void);
    metadata?: (req: Request, file: Express.Multer.File, cb: (error: any, metadata?: any) => void) => void;
    cacheControl?: string | ((req: Request, file: Express.Multer.File, cb: (error: any, cacheControl?: string) => void) => void);
    serverSideEncryption?: string;
    storageClass?: string;
  }

  interface S3Storage {
    (options?: Options): multer.StorageEngine;
  }

  const s3Storage: S3Storage;
  export = s3Storage;
}

// Global utility types
declare global {
  type Nullable<T> = T | null;
  type Optional<T> = T | undefined;
  type ID = string | number;
  
  interface PaginationParams {
    page?: number;
    limit?: number;
    offset?: number;
  }
  
  interface SortParams {
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }
  
  interface SearchParams {
    search?: string;
    filter?: Record<string, any>;
  }
  
  interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }
  
  interface ErrorResponse {
    success: false;
    error: string;
    message: string;
    statusCode: number;
    timestamp: string;
    path: string;
    details?: any;
  }
  
  // Hockey Hub specific types
  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    organizationId?: string;
    teamId?: string;
    isActive: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }
  
  type UserRole = 
    | 'player'
    | 'coach'
    | 'parent'
    | 'medical-staff'
    | 'equipment-manager'
    | 'physical-trainer'
    | 'club-admin'
    | 'admin';
    
  interface JWTPayload {
    sub: string;
    email: string;
    role: UserRole;
    organizationId?: string;
    teamId?: string;
    iat: number;
    exp: number;
  }
  
  interface RequestUser extends User {
    permissions?: string[];
  }
}

// Extend Express Request to include user
declare namespace Express {
  interface Request {
    user?: RequestUser;
    correlationId?: string;
    startTime?: number;
  }
}

export {};