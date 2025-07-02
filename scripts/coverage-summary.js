#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

console.log('📊 Hockey Hub Coverage Summary');
console.log('==============================\n');

// Function to read coverage summary for a workspace
function readCoverageSummary(workspacePath, workspaceName) {
  const summaryPath = path.join(workspacePath, 'coverage', 'coverage-summary.json');
  
  if (!fs.existsSync(summaryPath)) {
    return null;
  }
  
  try {
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    return {
      name: workspaceName,
      total: summary.total
    };
  } catch (error) {
    return null;
  }
}

// Collect coverage from all workspaces
const coverageData = [];

// Frontend
const frontendCoverage = readCoverageSummary(
  path.join(rootDir, 'apps', 'frontend'),
  'Frontend'
);
if (frontendCoverage) coverageData.push(frontendCoverage);

// Services
const servicesDir = path.join(rootDir, 'services');
fs.readdirSync(servicesDir).forEach(service => {
  const servicePath = path.join(servicesDir, service);
  if (fs.statSync(servicePath).isDirectory()) {
    const coverage = readCoverageSummary(servicePath, `Service: ${service}`);
    if (coverage) coverageData.push(coverage);
  }
});

// Packages
const packagesDir = path.join(rootDir, 'packages');
fs.readdirSync(packagesDir).forEach(pkg => {
  const pkgPath = path.join(packagesDir, pkg);
  if (fs.statSync(pkgPath).isDirectory()) {
    const coverage = readCoverageSummary(pkgPath, `Package: ${pkg}`);
    if (coverage) coverageData.push(coverage);
  }
});

// Check for merged coverage
const mergedCoverage = readCoverageSummary(rootDir, 'Overall');

// Function to get color emoji based on percentage
function getEmoji(percentage) {
  if (percentage >= 90) return '🟢';
  if (percentage >= 80) return '🟡';
  if (percentage >= 70) return '🟠';
  return '🔴';
}

// Function to format percentage
function formatPct(value) {
  return value.toFixed(1).padStart(5, ' ') + '%';
}

// Display individual workspace coverage
if (coverageData.length > 0) {
  console.log('Individual Workspace Coverage:');
  console.log('------------------------------');
  console.log('Workspace                    Lines    Stmts    Funcs    Branch');
  console.log('--------------------------------------------------------------');
  
  coverageData.forEach(data => {
    const { name, total } = data;
    const namePadded = name.padEnd(25, ' ');
    console.log(
      `${namePadded} ${getEmoji(total.lines.pct)} ${formatPct(total.lines.pct)}` +
      ` ${getEmoji(total.statements.pct)} ${formatPct(total.statements.pct)}` +
      ` ${getEmoji(total.functions.pct)} ${formatPct(total.functions.pct)}` +
      ` ${getEmoji(total.branches.pct)} ${formatPct(total.branches.pct)}`
    );
  });
}

// Display merged coverage
if (mergedCoverage) {
  console.log('\n\nOverall Coverage (Merged):');
  console.log('--------------------------');
  const total = mergedCoverage.total;
  console.log(`${getEmoji(total.lines.pct)} Lines:      ${formatPct(total.lines.pct)} (${total.lines.covered}/${total.lines.total})`);
  console.log(`${getEmoji(total.statements.pct)} Statements: ${formatPct(total.statements.pct)} (${total.statements.covered}/${total.statements.total})`);
  console.log(`${getEmoji(total.functions.pct)} Functions:  ${formatPct(total.functions.pct)} (${total.functions.covered}/${total.functions.total})`);
  console.log(`${getEmoji(total.branches.pct)} Branches:   ${formatPct(total.branches.pct)} (${total.branches.covered}/${total.branches.total})`);
  
  // Check against thresholds
  const threshold = 80;
  const passed = total.lines.pct >= threshold && 
                 total.statements.pct >= threshold && 
                 total.functions.pct >= threshold && 
                 total.branches.pct >= threshold;
  
  console.log(`\nThreshold: ${threshold}%`);
  console.log(`Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
}

// Instructions if no coverage found
if (coverageData.length === 0 && !mergedCoverage) {
  console.log('❌ No coverage data found!\n');
  console.log('To generate coverage:');
  console.log('  1. Run "pnpm coverage" to collect coverage for all workspaces');
  console.log('  2. Or run "pnpm test:coverage" in individual workspaces');
} else {
  console.log('\n\nLegend:');
  console.log('-------');
  console.log('🟢 >= 90%  (Excellent)');
  console.log('🟡 >= 80%  (Good - meets threshold)');
  console.log('🟠 >= 70%  (Fair - needs improvement)');
  console.log('🔴 < 70%   (Poor - requires attention)');
  
  if (!mergedCoverage) {
    console.log('\n💡 Run "pnpm coverage:merge" to see overall coverage');
  }
}