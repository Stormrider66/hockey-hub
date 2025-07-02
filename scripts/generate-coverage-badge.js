#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { makeBadge } = require('badge-maker');

const rootDir = path.join(__dirname, '..');
const coverageDir = path.join(rootDir, 'coverage');
const summaryFile = path.join(coverageDir, 'coverage-summary.json');
const badgeDir = path.join(coverageDir, 'badges');

if (!fs.existsSync(summaryFile)) {
  console.error('❌ No coverage summary found. Run "pnpm coverage:report" first.');
  process.exit(1);
}

// Create badges directory
if (!fs.existsSync(badgeDir)) {
  fs.mkdirSync(badgeDir, { recursive: true });
}

// Read coverage summary
const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
const total = summary.total;

// Function to get color based on coverage percentage
function getColor(percentage) {
  if (percentage >= 90) return 'brightgreen';
  if (percentage >= 80) return 'green';
  if (percentage >= 70) return 'yellowgreen';
  if (percentage >= 60) return 'yellow';
  if (percentage >= 50) return 'orange';
  return 'red';
}

// Function to create a badge
function createBadge(label, percentage, filename) {
  const format = {
    label: label,
    message: `${percentage.toFixed(1)}%`,
    color: getColor(percentage)
  };
  
  const svg = makeBadge(format);
  fs.writeFileSync(path.join(badgeDir, filename), svg);
  console.log(`✅ Created ${filename}: ${percentage.toFixed(1)}%`);
}

console.log('🏷️  Generating coverage badges...\n');

// Create individual badges
createBadge('coverage', total.lines.pct, 'coverage.svg');
createBadge('lines', total.lines.pct, 'lines.svg');
createBadge('statements', total.statements.pct, 'statements.svg');
createBadge('functions', total.functions.pct, 'functions.svg');
createBadge('branches', total.branches.pct, 'branches.svg');

// Create a comprehensive badge with all metrics
const comprehensiveBadge = {
  label: 'coverage',
  message: `L:${total.lines.pct.toFixed(0)}% S:${total.statements.pct.toFixed(0)}% F:${total.functions.pct.toFixed(0)}% B:${total.branches.pct.toFixed(0)}%`,
  color: getColor(total.lines.pct)
};

const comprehensiveSvg = makeBadge(comprehensiveBadge);
fs.writeFileSync(path.join(badgeDir, 'coverage-all.svg'), comprehensiveSvg);

console.log(`\n📁 Badges saved to: ${badgeDir}`);

// Generate markdown for README
const markdown = `
## Test Coverage

![Coverage](./coverage/badges/coverage.svg)
![Lines](./coverage/badges/lines.svg)
![Statements](./coverage/badges/statements.svg)
![Functions](./coverage/badges/functions.svg)
![Branches](./coverage/badges/branches.svg)

### Coverage Summary
- **Lines**: ${total.lines.pct.toFixed(2)}% (${total.lines.covered}/${total.lines.total})
- **Statements**: ${total.statements.pct.toFixed(2)}% (${total.statements.covered}/${total.statements.total})
- **Functions**: ${total.functions.pct.toFixed(2)}% (${total.functions.covered}/${total.functions.total})
- **Branches**: ${total.branches.pct.toFixed(2)}% (${total.branches.covered}/${total.branches.total})

Last updated: ${new Date().toISOString()}
`;

const markdownFile = path.join(coverageDir, 'COVERAGE.md');
fs.writeFileSync(markdownFile, markdown);

console.log(`\n📝 Coverage report markdown saved to: ${markdownFile}`);
console.log('\n💡 You can add these badges to your README.md!');

// Also create a JSON file with coverage data for CI/CD integration
const ciData = {
  total: {
    lines: total.lines.pct,
    statements: total.statements.pct,
    functions: total.functions.pct,
    branches: total.branches.pct
  },
  timestamp: new Date().toISOString(),
  thresholds: {
    global: {
      lines: 80,
      statements: 80,
      functions: 80,
      branches: 80
    }
  },
  passed: total.lines.pct >= 80 && total.statements.pct >= 80 && 
          total.functions.pct >= 80 && total.branches.pct >= 80
};

fs.writeFileSync(path.join(coverageDir, 'coverage-ci.json'), JSON.stringify(ciData, null, 2));
console.log('\n📊 CI coverage data saved to: coverage/coverage-ci.json');