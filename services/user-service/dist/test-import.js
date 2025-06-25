"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testImports = void 0;
// Just a simple function to test the imports
function testImports() {
    console.log('Imports are working!');
    const user = {
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
    const errorResponse = {
        error: true,
        message: "Test error message",
        code: "TEST_ERROR",
        status: 400,
        timestamp: new Date().toISOString(),
        path: "/test/path"
    };
    console.log('Error response:', errorResponse);
}
exports.testImports = testImports;
// Execute the function when this module is run directly
if (require.main === module) {
    testImports();
}
//# sourceMappingURL=test-import.js.map