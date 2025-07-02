#!/usr/bin/env node

/**
 * Quick TypeScript validation script for Hockey Hub
 * Checks for common TypeScript issues across the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const PACKAGES_TO_CHECK = [
  'apps/frontend',
  'packages/shared-lib',
  'services/user-service',
  'services/api-gateway',
  'services/communication-service'
];

console.log('🔍 Running TypeScript validation for Hockey Hub...\n');

// Check if all type packages are installed
console.log('📦 Checking @types packages...');
const missingTypes = [];

const requiredTypes = [
  '@types/express',
  '@types/node',
  '@types/jest',
  '@types/cors',
  '@types/jsonwebtoken',
  '@types/bcrypt',
  '@types/uuid',
  '@types/pg',
  '@types/helmet',
  '@types/joi',
  '@types/redis',
  '@types/bull',
  '@types/handlebars',
  '@types/multer',
  '@types/sharp',
  '@types/react',
  '@types/react-dom',
  '@types/react-big-calendar',
  '@types/socket.io-client'
];

for (const typePackage of requiredTypes) {
  try {
    require.resolve(typePackage, { paths: [ROOT_DIR] });
    console.log(`✅ ${typePackage}`);
  } catch (error) {
    missingTypes.push(typePackage);
    console.log(`❌ ${typePackage} - Missing`);
  }
}

if (missingTypes.length > 0) {
  console.log(`\n⚠️  Missing ${missingTypes.length} @types packages:`);
  console.log('   Run: pnpm add -D ' + missingTypes.join(' '));
} else {
  console.log('\n✅ All required @types packages are installed');
}

// Check TypeScript configuration files
console.log('\n📋 Checking TypeScript configurations...');
const tsConfigFiles = [
  'tsconfig.base.json',
  'services/tsconfig.base.json',
  'apps/frontend/tsconfig.json',
  'packages/shared-lib/tsconfig.json'
];

for (const configFile of tsConfigFiles) {
  const configPath = path.join(ROOT_DIR, configFile);
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      // Remove comments for JSON parsing
      const cleanedContent = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      const config = JSON.parse(cleanedContent);
      if (config.compilerOptions && config.compilerOptions.strict) {
        console.log(`✅ ${configFile} - Strict mode enabled`);
      } else {
        console.log(`⚠️  ${configFile} - Strict mode not enabled`);
      }
    } catch (error) {
      console.log(`❌ ${configFile} - Invalid JSON: ${error.message}`);
    }
  } else {
    console.log(`❌ ${configFile} - Not found`);
  }
}

// Check for common TypeScript issues
console.log('\n🔍 Scanning for TypeScript issues...');
let totalIssues = 0;

const issuePatterns = [
  { pattern: /:\s*any[;\s,)]/g, name: 'explicit any types' },
  { pattern: /@ts-ignore/g, name: '@ts-ignore comments' },
  { pattern: /@ts-expect-error/g, name: '@ts-expect-error comments' },
  { pattern: /as\s+any/g, name: 'any type assertions' },
  { pattern: /Function\s*[,;)]/g, name: 'Function type usage' }
];

for (const packageDir of PACKAGES_TO_CHECK) {
  const fullPath = path.join(ROOT_DIR, packageDir);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  ${packageDir} - Directory not found`);
    continue;
  }

  console.log(`\n📁 Checking ${packageDir}...`);
  
  try {
    const files = execSync(`find "${fullPath}" -name "*.ts" -o -name "*.tsx" | head -20`, { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean);

    let packageIssues = 0;
    
    for (const file of files.slice(0, 10)) { // Limit to prevent timeout
      if (!fs.existsSync(file)) continue;
      
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        for (const { pattern, name } of issuePatterns) {
          const matches = content.match(pattern);
          if (matches) {
            packageIssues += matches.length;
            console.log(`   ⚠️  ${path.relative(ROOT_DIR, file)}: ${matches.length} ${name}`);
          }
        }
      } catch (readError) {
        // Skip files that can't be read
      }
    }
    
    if (packageIssues === 0) {
      console.log(`   ✅ No issues found in checked files`);
    } else {
      console.log(`   📊 Total issues in ${packageDir}: ${packageIssues}`);
      totalIssues += packageIssues;
    }
  } catch (error) {
    console.log(`   ❌ Error scanning ${packageDir}: ${error.message}`);
  }
}

// Check global type definitions
console.log('\n📄 Checking global type definitions...');
const globalTypeFiles = [
  'types/global.d.ts',
  'types/socket.d.ts',
  'types/database.d.ts',
  'types/api.d.ts',
  'types/testing.d.ts'
];

for (const typeFile of globalTypeFiles) {
  const typePath = path.join(ROOT_DIR, typeFile);
  if (fs.existsSync(typePath)) {
    console.log(`✅ ${typeFile}`);
  } else {
    console.log(`❌ ${typeFile} - Not found`);
  }
}

// Summary
console.log('\n📊 TypeScript Validation Summary:');
console.log(`   Missing @types packages: ${missingTypes.length}`);
console.log(`   TypeScript issues found: ${totalIssues}`);
console.log(`   Global type files: ${globalTypeFiles.filter(f => fs.existsSync(path.join(ROOT_DIR, f))).length}/${globalTypeFiles.length}`);

if (missingTypes.length === 0 && totalIssues < 10) {
  console.log('\n✅ TypeScript configuration looks good!');
  process.exit(0);
} else {
  console.log('\n⚠️  Consider addressing the issues above for better type safety.');
  process.exit(1);
}