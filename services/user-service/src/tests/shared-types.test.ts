/**
 * Shared Types Integration Test
 * 
 * This test verifies that we can correctly import and use all critical types
 * from the shared types package without any module resolution issues.
 */

import {
  // Validation schemas 
  emailSchema,
  passwordSchema, 
  phoneSchema,
  languageSchema,
  uuidSchema,
  paginationSchema,
  
  // Auth types
  AuthenticatedUser,
  TokenPayload,
  UserRole,
  AuthorizeOptions,
  
  // HTTP types
  TypedRequest,
  ErrorResponse,
  SuccessResponse,
  HttpException,
  
  // Middleware types
  ErrorHandlerMiddleware,
  ValidateRequestMiddleware,
  AuthorizationMiddlewareFactory,
  
  // Domain types
  PaginationParams
} from '@hockey-hub/types';

import { z } from 'zod';

describe('Shared Types Module Resolution', () => {
  test('Validation schemas can be imported and used', () => {
    // Email Schema
    expect(emailSchema).toBeDefined();
    expect(emailSchema.safeParse('test@example.com').success).toBe(true);
    expect(emailSchema.safeParse('invalid-email').success).toBe(false);
    
    // Password Schema
    expect(passwordSchema).toBeDefined();
    expect(passwordSchema.safeParse('Passw0rd!').success).toBe(true);
    
    // Phone Schema
    expect(phoneSchema).toBeDefined();
    
    // Language Schema
    expect(languageSchema).toBeDefined();
    expect(languageSchema.safeParse('en').success).toBe(true);
    expect(languageSchema.safeParse('sv').success).toBe(true);
    expect(languageSchema.safeParse('de').success).toBe(false);
    
    // UUID Schema
    expect(uuidSchema).toBeDefined();
    
    // Pagination Schema
    expect(paginationSchema).toBeDefined();
    expect(paginationSchema.safeParse({}).success).toBe(true); // Default values applied
    expect(paginationSchema.safeParse({ page: 2, limit: 10 }).success).toBe(true);
  });
  
  test('Auth types can be imported and used', () => {
    // Create an AuthenticatedUser object
    const user: AuthenticatedUser = {
      id: '123',
      email: 'user@example.com',
      roles: [UserRole.PLAYER],
      permissions: ['calendar:read'],
      organizationId: 'org-1',
      lang: 'en',
      get userId() {
        return this.id;
      }
    };
    
    expect(user.userId).toBe('123'); // Test getter
    expect(user.roles).toContain(UserRole.PLAYER);
    
    // Test TokenPayload
    const payload: TokenPayload = {
      userId: '123',
      email: 'user@example.com',
      roles: [UserRole.PLAYER],
      permissions: ['calendar:read'],
    };
    
    expect(payload.userId).toBe('123');
    
    // Test AuthorizeOptions
    const options: AuthorizeOptions = {
      allowedRoles: [UserRole.ADMIN, UserRole.COACH],
      requiredPermissions: ['users:write']
    };
    
    expect(options.allowedRoles).toContain(UserRole.ADMIN);
  });
  
  test('HTTP types can be imported and used', () => {
    // Create an ErrorResponse
    const error: ErrorResponse = {
      error: true,
      message: 'Test error',
      code: 'TEST_ERROR',
      path: '/test',
      timestamp: new Date().toISOString(),
      transactionId: '123'
    };
    
    expect(error.error).toBe(true);
    expect(error.message).toBe('Test error');
    
    // Create a SuccessResponse
    const success: SuccessResponse<{id: string}> = {
      success: true,
      data: { id: '123' }
    };
    
    expect(success.success).toBe(true);
    expect(success.data.id).toBe('123');
    
    // Create an HttpException
    const exception = new HttpException(400, 'Bad Request', 'VALIDATION_ERROR');
    expect(exception.status).toBe(400);
    expect(exception.message).toBe('Bad Request');
    expect(exception.code).toBe('VALIDATION_ERROR');
  });
  
  test('Integration: Create full validation schema using shared types', () => {
    // Create a composite schema using shared validation schemas
    const userSchema = z.object({
      email: emailSchema,
      password: passwordSchema,
      phone: phoneSchema,
      preferredLanguage: languageSchema,
      firstName: z.string().min(1),
      lastName: z.string().min(1)
    });
    
    const validUser = {
      email: 'test@example.com',
      password: 'Passw0rd!',
      phone: '+123456789',
      preferredLanguage: 'en',
      firstName: 'John',
      lastName: 'Doe'
    };
    
    const result = userSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });
});

// If running directly through Node
if (require.main === module) {
  console.log('This test must be run using Jest');
} 