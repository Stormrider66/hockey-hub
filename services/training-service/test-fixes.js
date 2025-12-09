#!/usr/bin/env node
const { execSync } = require('child_process');

console.log('Testing training-service fixes...\n');

const tests = [
  {
    name: 'Database Guard Test (503 vs 500)',
    file: 'src/routes/workoutRoutes.test.ts',
    testName: 'should return 503 when database is not initialized'
  },
  {
    name: 'Exercise Update (403 vs 200)',
    file: 'src/routes/exercise.routes.test.ts',
    testName: 'should update an exercise'
  },
  {
    name: 'Exercise Delete (403 vs 200)',
    file: 'src/routes/exercise.routes.test.ts',
    testName: 'should delete an exercise'
  },
  {
    name: 'Workout Assignment Validation (400 vs 500)',
    file: 'src/routes/workoutAssignmentRoutes.test.ts',
    testName: 'should return 400 if organization ID is missing'
  },
  {
    name: 'Workout Assignment Authorization (403 vs 200)',
    file: 'src/routes/workoutAssignmentRoutes.test.ts', 
    testName: 'should return 403 for players viewing other player assignments'
  },
  {
    name: 'Session Cancellation (200 vs 400)',
    file: 'src/__tests__/integration/session.integration.test.ts',
    testName: 'should allow trainer to cancel scheduled session'
  }
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  console.log(`Testing: ${test.name}`);
  try {
    const cmd = `pnpm jest "${test.file}" -t "${test.testName}" --no-coverage --silent`;
    execSync(cmd, { stdio: 'pipe', cwd: __dirname });
    console.log(`  ✅ PASSED\n`);
    passed++;
  } catch (e) {
    console.log(`  ❌ FAILED\n`);
    failed++;
  }
}

console.log('\n=================');
console.log(`Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);