/**
 * API and HTTP related type definitions
 */

import { Request, Response, NextFunction } from 'express';

// HTTP Method types
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

// API Response types
interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  pagination?: PaginationMeta;
  meta?: Record<string, any>;
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string;
  };
  statusCode: number;
  timestamp: string;
  path: string;
  method: HttpMethod;
  correlationId?: string;
}

type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// Pagination types
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  offset: number;
}

interface PaginationQuery {
  page?: string | number;
  limit?: string | number;
  offset?: string | number;
}

// Search and filter types
interface SearchQuery {
  q?: string;
  search?: string;
  query?: string;
}

interface SortQuery {
  sort?: string;
  sortBy?: string;
  order?: 'asc' | 'desc' | 'ASC' | 'DESC';
  direction?: 'asc' | 'desc' | 'ASC' | 'DESC';
}

interface FilterQuery {
  filter?: string | Record<string, any>;
  where?: string | Record<string, any>;
}

type QueryParams = PaginationQuery & SearchQuery & SortQuery & FilterQuery;

// Request types
interface AuthenticatedRequest extends Request {
  user: RequestUser;
  token?: string;
  correlationId: string;
  startTime: number;
}

interface ValidatedRequest<T = any> extends AuthenticatedRequest {
  body: T;
  validated: {
    body?: T;
    query?: any;
    params?: any;
  };
}

interface FileUploadRequest extends AuthenticatedRequest {
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

// Middleware types
type AsyncRequestHandler<T = Request> = (
  req: T,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

type AuthMiddleware = AsyncRequestHandler<AuthenticatedRequest>;
type ValidationMiddleware<T = any> = AsyncRequestHandler<ValidatedRequest<T>>;
type RateLimitMiddleware = AsyncRequestHandler;
type CorsMiddleware = AsyncRequestHandler;

interface MiddlewareOptions {
  optional?: boolean;
  roles?: UserRole[];
  permissions?: string[];
  rateLimits?: {
    windowMs: number;
    max: number;
    message?: string;
  };
}

// Controller types
interface ControllerMethod<TRequest = AuthenticatedRequest, TResponse = any> {
  (req: TRequest, res: Response): Promise<TResponse> | TResponse;
}

interface RestController<TEntity = any, TCreateDto = any, TUpdateDto = any> {
  findAll: ControllerMethod<AuthenticatedRequest, TEntity[]>;
  findOne: ControllerMethod<AuthenticatedRequest, TEntity>;
  create: ControllerMethod<ValidatedRequest<TCreateDto>, TEntity>;
  update: ControllerMethod<ValidatedRequest<TUpdateDto>, TEntity>;
  delete: ControllerMethod<AuthenticatedRequest, void>;
}

// Route definition types
interface RouteDefinition {
  method: HttpMethod;
  path: string;
  handler: AsyncRequestHandler;
  middleware?: AsyncRequestHandler[];
  auth?: boolean | MiddlewareOptions;
  validation?: {
    body?: any;
    query?: any;
    params?: any;
  };
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  description?: string;
  tags?: string[];
}

interface RouterConfig {
  prefix?: string;
  middleware?: AsyncRequestHandler[];
  routes: RouteDefinition[];
}

// API versioning types
interface ApiVersion {
  version: string;
  deprecated?: boolean;
  deprecationDate?: Date;
  sunsetDate?: Date;
  documentation?: string;
}

// Content negotiation types
type ContentType = 
  | 'application/json'
  | 'application/xml'
  | 'text/plain'
  | 'text/html'
  | 'text/csv'
  | 'application/pdf'
  | 'multipart/form-data'
  | 'application/x-www-form-urlencoded';

interface ContentNegotiation {
  accept: ContentType[];
  contentType: ContentType;
  charset?: string;
  encoding?: string;
}

// Rate limiting types
interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  statusCode?: number;
  headers?: boolean;
  keyGenerator?: (req: Request) => string;
  handler?: (req: Request, res: Response) => void;
  onLimitReached?: (req: Request, res: Response) => void;
}

interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

// CORS types
interface CorsConfig {
  origin?: boolean | string | string[] | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void);
  methods?: HttpMethod[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

// WebSocket types (for Socket.io integration)
interface WebSocketMessage<T = any> {
  event: string;
  data: T;
  timestamp: Date;
  userId?: string;
  room?: string;
}

interface WebSocketError {
  event: string;
  error: string;
  code?: string;
  timestamp: Date;
}

// API documentation types
interface ApiDocumentation {
  title: string;
  description: string;
  version: string;
  baseUrl: string;
  endpoints: EndpointDocumentation[];
  schemas: Record<string, any>;
  authentication: AuthenticationDocumentation;
}

interface EndpointDocumentation {
  method: HttpMethod;
  path: string;
  summary: string;
  description?: string;
  tags: string[];
  parameters?: ParameterDocumentation[];
  requestBody?: RequestBodyDocumentation;
  responses: Record<string, ResponseDocumentation>;
  security?: SecurityRequirement[];
}

interface ParameterDocumentation {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required: boolean;
  description?: string;
  schema: any;
  example?: any;
}

interface RequestBodyDocumentation {
  description?: string;
  required: boolean;
  content: Record<ContentType, {
    schema: any;
    example?: any;
  }>;
}

interface ResponseDocumentation {
  description: string;
  content?: Record<ContentType, {
    schema: any;
    example?: any;
  }>;
  headers?: Record<string, {
    description?: string;
    schema: any;
  }>;
}

interface AuthenticationDocumentation {
  type: 'bearer' | 'apiKey' | 'oauth2' | 'basic';
  scheme?: string;
  bearerFormat?: string;
  description?: string;
}

interface SecurityRequirement {
  [key: string]: string[];
}

// Health check types
interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  duration: number;
  checks: Record<string, HealthCheckResult>;
}

interface HealthCheckResult {
  status: 'up' | 'down' | 'warning';
  message?: string;
  duration?: number;
  data?: any;
}

// Export all types
export {
  HttpMethod,
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponse,
  PaginationMeta,
  PaginationQuery,
  SearchQuery,
  SortQuery,
  FilterQuery,
  QueryParams,
  AuthenticatedRequest,
  ValidatedRequest,
  FileUploadRequest,
  AsyncRequestHandler,
  AuthMiddleware,
  ValidationMiddleware,
  RateLimitMiddleware,
  CorsMiddleware,
  MiddlewareOptions,
  ControllerMethod,
  RestController,
  RouteDefinition,
  RouterConfig,
  ApiVersion,
  ContentType,
  ContentNegotiation,
  RateLimitConfig,
  RateLimitInfo,
  CorsConfig,
  WebSocketMessage,
  WebSocketError,
  ApiDocumentation,
  EndpointDocumentation,
  ParameterDocumentation,
  RequestBodyDocumentation,
  ResponseDocumentation,
  AuthenticationDocumentation,
  SecurityRequirement,
  HealthCheck,
  HealthCheckResult,
};