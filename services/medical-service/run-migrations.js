const { execSync } = require('child_process');
const path = require('path');

// Build the TypeScript project first
console.log('🔨 Building TypeScript project...');
try {
  execSync('npx tsc', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ TypeScript build completed');
} catch (error) {
  console.error('❌ TypeScript build failed:', error.message);
  process.exit(1);
}

// Run the compiled JavaScript migration file
console.log('🔄 Running migrations...');
try {
  execSync('node dist/run-migrations.js', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Migrations completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}