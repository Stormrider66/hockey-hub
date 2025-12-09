#!/usr/bin/env node

// Test script to verify the update-docs slash command works correctly

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing /update-docs slash command...\n');

// Test 1: Dry run
console.log('Test 1: Running dry-run mode...');
try {
  const result = execSync('node .claude/scripts/update-docs.js --dry-run', {
    encoding: 'utf8'
  });
  console.log('✅ Dry run completed successfully');
  console.log(result);
} catch (error) {
  console.error('❌ Dry run failed:', error.message);
}

console.log('\n' + '-'.repeat(60) + '\n');

// Test 2: Check for documentation files
console.log('Test 2: Checking documentation files...');
const docsToCheck = [
  'CLAUDE.md',
  'README.md',
  'docs/FEATURES-OVERVIEW.md',
  'docs/ARCHITECTURE.md'
];

docsToCheck.forEach(doc => {
  if (fs.existsSync(doc)) {
    console.log(`✅ Found: ${doc}`);
  } else {
    console.log(`❌ Missing: ${doc}`);
  }
});

console.log('\n' + '-'.repeat(60) + '\n');

// Test 3: Run advanced updater with verbose mode
console.log('Test 3: Running advanced updater with verbose mode...');
try {
  const result = execSync('node .claude/scripts/update-docs-advanced.js --dry-run --verbose', {
    encoding: 'utf8'
  });
  console.log('✅ Advanced updater ran successfully');
  // Show first 500 chars of output
  console.log(result.substring(0, 500) + '...');
} catch (error) {
  console.error('❌ Advanced updater failed:', error.message);
}

console.log('\n' + '-'.repeat(60) + '\n');

// Test 4: Check git hooks
console.log('Test 4: Checking git hooks...');
const hooks = ['post-commit', 'post-merge', 'pre-push'];
const hooksDir = '.git/hooks';

hooks.forEach(hook => {
  const hookPath = path.join(hooksDir, hook);
  if (fs.existsSync(hookPath)) {
    console.log(`✅ Hook installed: ${hook}`);
  } else {
    console.log(`❌ Hook missing: ${hook}`);
  }
});

console.log('\n🎉 Testing complete!');
console.log('\nTo use the slash command in Claude Code:');
console.log('  /update-docs --all           # Update all documentation');
console.log('  /update-docs --dry-run       # Preview changes');
console.log('  /update-docs --claude        # Update only CLAUDE.md');
console.log('  /update-docs --commit        # Auto-commit changes');
console.log('\nTo install git hooks for automatic updates:');
console.log('  bash .claude/scripts/install-git-hooks.sh');