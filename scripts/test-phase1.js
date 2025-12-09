#!/usr/bin/env node

/**
 * Test Runner for Phase 1 Optimizations
 * 
 * This script runs all Phase 1 optimization tests:
 * - Virtual Scrolling
 * - Pagination
 * - Performance Monitoring
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test configuration
const PHASE1_TESTS = [
  {
    name: 'Virtual Scrolling',
    path: 'src/__tests__/optimizations/phase1-virtual-scrolling.test.tsx',
    description: 'Tests for virtualized list components and smooth scrolling'
  },
  {
    name: 'Pagination',
    path: 'src/__tests__/optimizations/phase1-pagination.test.tsx',
    description: 'Tests for pagination components and infinite scroll'
  },
  {
    name: 'Performance Monitoring',
    path: 'src/__tests__/optimizations/phase1-performance.test.tsx',
    description: 'Tests for Web Vitals tracking and performance metrics'
  }
];

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('');
  log('═'.repeat(60), colors.bright);
  log(title, colors.bright + colors.cyan);
  log('═'.repeat(60), colors.bright);
  console.log('');
}

function runCommand(command, cwd) {
  try {
    const output = execSync(command, { 
      cwd, 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      output: error.stdout || error.message,
      error: error.stderr || error.message 
    };
  }
}

function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Main test runner
async function runPhase1Tests() {
  logSection('🚀 Phase 1 Optimization Tests');
  
  const frontendDir = path.join(__dirname, '..', 'apps', 'frontend');
  const results = [];
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const startTime = Date.now();

  // Check if test files exist
  log('Checking test files...', colors.yellow);
  for (const test of PHASE1_TESTS) {
    const testPath = path.join(frontendDir, test.path);
    if (!fs.existsSync(testPath)) {
      log(`❌ Missing: ${test.path}`, colors.red);
      return process.exit(1);
    }
    log(`✓ Found: ${test.name}`, colors.green);
  }

  // Run each test suite
  for (const test of PHASE1_TESTS) {
    console.log('');
    log(`Running ${test.name} tests...`, colors.blue);
    log(test.description, colors.reset);
    
    const testStartTime = Date.now();
    const result = runCommand(
      `npm test -- ${test.path} --coverage --coverageReporters=text --no-cache`,
      frontendDir
    );
    const testDuration = Date.now() - testStartTime;

    if (result.success) {
      // Parse test results from output
      const output = result.output;
      const testMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
      const testsRun = testMatch ? parseInt(testMatch[2]) : 0;
      const testsPassed = testMatch ? parseInt(testMatch[1]) : 0;
      
      totalTests += testsRun;
      passedTests += testsPassed;
      
      log(`✅ ${test.name} - All tests passed (${formatTime(testDuration)})`, colors.green);
      
      // Extract coverage if available
      const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)/);
      if (coverageMatch) {
        log(`   Coverage: ${coverageMatch[1]}%`, colors.cyan);
      }
      
      results.push({
        name: test.name,
        success: true,
        tests: testsRun,
        passed: testsPassed,
        duration: testDuration,
        coverage: coverageMatch ? parseFloat(coverageMatch[1]) : null
      });
    } else {
      log(`❌ ${test.name} - Tests failed (${formatTime(testDuration)})`, colors.red);
      console.log(result.error || result.output);
      
      failedTests++;
      results.push({
        name: test.name,
        success: false,
        duration: testDuration,
        error: result.error
      });
    }
  }

  const totalDuration = Date.now() - startTime;

  // Summary
  logSection('📊 Test Summary');
  
  log('Test Results:', colors.bright);
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const color = result.success ? colors.green : colors.red;
    let line = `${status} ${result.name} (${formatTime(result.duration)})`;
    if (result.coverage) {
      line += ` - Coverage: ${result.coverage}%`;
    }
    log(line, color);
  });

  console.log('');
  log('Overall Statistics:', colors.bright);
  log(`Total Test Suites: ${PHASE1_TESTS.length}`, colors.cyan);
  log(`Total Tests Run: ${totalTests}`, colors.cyan);
  log(`Tests Passed: ${passedTests}`, colors.green);
  log(`Tests Failed: ${failedTests}`, failedTests > 0 ? colors.red : colors.green);
  log(`Total Duration: ${formatTime(totalDuration)}`, colors.cyan);

  // Performance benchmarks
  if (totalTests > 0) {
    const avgTimePerTest = totalDuration / totalTests;
    log(`Average Time per Test: ${formatTime(avgTimePerTest)}`, colors.yellow);
  }

  // Coverage summary
  const testsWithCoverage = results.filter(r => r.coverage !== null);
  if (testsWithCoverage.length > 0) {
    const avgCoverage = testsWithCoverage.reduce((sum, r) => sum + r.coverage, 0) / testsWithCoverage.length;
    log(`Average Coverage: ${avgCoverage.toFixed(2)}%`, colors.cyan);
  }

  // Exit code
  const exitCode = failedTests > 0 ? 1 : 0;
  
  if (exitCode === 0) {
    logSection('✨ All Phase 1 tests passed successfully!');
  } else {
    logSection('❌ Some tests failed. Please check the output above.');
  }

  process.exit(exitCode);
}

// Run tests with error handling
runPhase1Tests().catch(error => {
  log('Fatal error running tests:', colors.red);
  console.error(error);
  process.exit(1);
});

// Additional commands that can be run
if (process.argv.includes('--help')) {
  logSection('Phase 1 Test Runner Help');
  log('Usage: node scripts/test-phase1.js [options]');
  log('');
  log('Options:');
  log('  --help           Show this help message');
  log('  --watch          Run tests in watch mode');
  log('  --coverage       Generate detailed coverage report');
  log('  --verbose        Show detailed test output');
  log('');
  log('Examples:');
  log('  node scripts/test-phase1.js');
  log('  node scripts/test-phase1.js --coverage');
  log('  npm run test:phase1');
  process.exit(0);
}

// Watch mode
if (process.argv.includes('--watch')) {
  logSection('Running Phase 1 tests in watch mode...');
  const watchCommand = `npm test -- ${PHASE1_TESTS.map(t => t.path).join(' ')} --watch`;
  execSync(watchCommand, { 
    cwd: path.join(__dirname, '..', 'apps', 'frontend'),
    stdio: 'inherit' 
  });
}