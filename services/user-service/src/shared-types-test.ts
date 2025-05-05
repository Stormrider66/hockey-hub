// Test script to verify shared types are correctly imported
import { 
  emailSchema,
  passwordSchema,
  phoneSchema,
  languageSchema
} from '@hockey-hub/types';

console.log('==== Testing Shared Types Import ====');
console.log('Email Schema:', emailSchema ? 'Imported successfully' : 'Failed to import');
console.log('Password Schema:', passwordSchema ? 'Imported successfully' : 'Failed to import');
console.log('Phone Schema:', phoneSchema ? 'Imported successfully' : 'Failed to import');
console.log('Language Schema:', languageSchema ? 'Imported successfully' : 'Failed to import');

// Execute test on import
if (require.main === module) {
  console.log('Running shared types test directly');
} 