"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Test script to verify shared types are correctly imported
const types_1 = require("@hockey-hub/types");
console.log('==== Testing Shared Types Import ====');
console.log('Email Schema:', types_1.emailSchema ? 'Imported successfully' : 'Failed to import');
console.log('Password Schema:', types_1.passwordSchema ? 'Imported successfully' : 'Failed to import');
console.log('Phone Schema:', types_1.phoneSchema ? 'Imported successfully' : 'Failed to import');
console.log('Language Schema:', types_1.languageSchema ? 'Imported successfully' : 'Failed to import');
// Execute test on import
if (require.main === module) {
    console.log('Running shared types test directly');
}
//# sourceMappingURL=shared-types-test.js.map