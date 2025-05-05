// Test file to confirm imports are working
import { AuthenticatedUser, TypedRequest, ErrorResponse } from '@hockey-hub/types';

// Just a simple function to test the imports
export function testImports() {
  console.log('Imports are working!');
  
  const user: AuthenticatedUser = {
    id: 'test-id',
    email: 'test@example.com',
    roles: ['user'],
    permissions: ['read:all'],
    organizationId: 'org-1',
    lang: 'en',
    get userId() {
      return this.id;
    }
  };
  
  console.log('User:', user);
  
  const errorResponse: ErrorResponse = {
    error: true,
    message: "Test error message",
    code: "TEST_ERROR",
    status: 400,
    timestamp: new Date().toISOString(),
    path: "/test/path"
  };
  
  console.log('Error response:', errorResponse);
}

// Execute the function when this module is run directly
if (require.main === module) {
  testImports();
}