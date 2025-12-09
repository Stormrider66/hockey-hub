#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

// Helper function to check if a dependency is used
function isDependencyUsed(dep, searchPaths) {
  const patterns = [
    `require\\(['"\`]${dep}['"\`/]`,
    `from\\s+['"\`]${dep}['"\`/]`,
    `import\\(['"\`]${dep}['"\`/]`,
    `@${dep}[\\s/]` // For packages like @types
  ];
  
  try {
    for (const searchPath of searchPaths) {
      for (const pattern of patterns) {
        const command = process.platform === 'win32'
          ? `powershell -Command "Get-ChildItem -Path '${searchPath}' -Recurse -Include *.js,*.jsx,*.ts,*.tsx,*.json -File | Select-String -Pattern '${pattern}' -Quiet"`
          : `grep -r -E "${pattern}" ${searchPath} --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" --include="*.json" 2>/dev/null || true`;
        
        const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
        if (result && result !== 'False') {
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    console.error(`Error checking ${dep}: ${error.message}`);
    return true; // Assume it's used if we can't check
  }
}

// Get package size
function getPackageSize(packageName) {
  try {
    const command = process.platform === 'win32'
      ? `powershell -Command "(Get-ChildItem -Path 'node_modules/${packageName}' -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB"`
      : `du -sm node_modules/${packageName} 2>/dev/null | cut -f1`;
    
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
    return parseFloat(result) || 0;
  } catch (error) {
    return 0;
  }
}

// Check for outdated packages
function checkOutdated() {
  try {
    const result = execSync('pnpm outdated --json', { encoding: 'utf8', stdio: 'pipe' });
    return JSON.parse(result || '[]');
  } catch (error) {
    // pnpm outdated exits with non-zero if there are outdated packages
    try {
      const output = error.stdout || error.output?.[1];
      if (output) {
        return JSON.parse(output.toString());
      }
    } catch (parseError) {
      console.error('Error parsing outdated packages:', parseError.message);
    }
    return [];
  }
}

// Find duplicate dependencies across workspaces
function findDuplicates(workspaces) {
  const allDeps = {};
  const duplicates = {};

  workspaces.forEach(workspace => {
    const pkgPath = path.join(workspace, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      Object.entries(deps).forEach(([name, version]) => {
        if (!allDeps[name]) {
          allDeps[name] = [];
        }
        allDeps[name].push({ workspace: workspace.split('/').pop(), version });
      });
    }
  });

  Object.entries(allDeps).forEach(([name, locations]) => {
    if (locations.length > 1) {
      const versions = [...new Set(locations.map(l => l.version))];
      if (versions.length > 1) {
        duplicates[name] = locations;
      }
    }
  });

  return duplicates;
}

// Main analysis function
async function analyzeDependencies() {
  console.log(`${colors.cyan}🔍 Analyzing dependencies...${colors.reset}\n`);

  // Find all workspace directories
  const workspaces = [
    '.',
    'apps/frontend',
    'packages/shared-types',
    ...Array.from({ length: 10 }, (_, i) => `services/${['api-gateway', 'user-service', 'communication-service', 'calendar-service', 'training-service', 'medical-service', 'planning-service', 'statistics-service', 'payment-service', 'admin-service'][i]}`)
  ].filter(ws => fs.existsSync(path.join(ws, 'package.json')));

  const report = {
    unused: [],
    misplaced: [],
    outdated: [],
    large: [],
    duplicates: {},
    suggestions: []
  };

  // Analyze each workspace
  for (const workspace of workspaces) {
    console.log(`${colors.blue}Analyzing ${workspace}...${colors.reset}`);
    
    const pkgPath = path.join(workspace, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    
    const deps = pkg.dependencies || {};
    const devDeps = pkg.devDependencies || {};
    const allDeps = { ...deps, ...devDeps };
    
    // Determine search paths based on workspace
    const searchPaths = workspace === '.' 
      ? ['scripts', 'docs'] 
      : [workspace];
    
    // Skip certain packages that are commonly not directly imported
    const skipPatterns = [
      /^@types\//,
      /eslint-/,
      /^prettier/,
      /^husky/,
      /^lint-staged/,
      /^jest/,
      /^@testing-library/,
      /^cypress/,
      /^typescript$/,
      /^nodemon$/,
      /^concurrently$/,
      /^turbo$/
    ];
    
    // Check for unused dependencies
    Object.keys(allDeps).forEach(dep => {
      if (!skipPatterns.some(pattern => pattern.test(dep))) {
        if (!isDependencyUsed(dep, searchPaths)) {
          report.unused.push({
            package: dep,
            version: allDeps[dep],
            workspace,
            type: deps[dep] ? 'dependency' : 'devDependency'
          });
        }
      }
    });
    
    // Check for misplaced dependencies
    const devOnlyPatterns = [
      /^@types\//,
      /eslint/,
      /prettier/,
      /jest/,
      /^@testing-library/,
      /cypress/,
      /^typescript$/,
      /^nodemon$/,
      /^ts-node$/,
      /webpack/,
      /babel/,
      /rollup/
    ];
    
    Object.keys(deps).forEach(dep => {
      if (devOnlyPatterns.some(pattern => pattern.test(dep))) {
        report.misplaced.push({
          package: dep,
          workspace,
          current: 'dependencies',
          suggested: 'devDependencies'
        });
      }
    });
    
    // Check package sizes
    Object.keys(allDeps).forEach(dep => {
      const size = getPackageSize(dep);
      if (size > 10) { // Packages larger than 10MB
        report.large.push({
          package: dep,
          size: `${size.toFixed(2)}MB`,
          workspace
        });
      }
    });
  }
  
  // Check for outdated packages
  console.log(`\n${colors.blue}Checking for outdated packages...${colors.reset}`);
  const outdated = checkOutdated();
  if (Array.isArray(outdated)) {
    outdated.forEach(pkg => {
      if (pkg && pkg.package) {
        report.outdated.push({
          package: pkg.package,
          current: pkg.current,
          wanted: pkg.wanted,
          latest: pkg.latest,
          type: pkg.dependencyType
        });
      }
    });
  }
  
  // Find duplicate dependencies
  console.log(`\n${colors.blue}Finding duplicate dependencies...${colors.reset}`);
  report.duplicates = findDuplicates(workspaces);
  
  // Add suggestions for large packages
  const replacements = {
    'moment': 'date-fns or dayjs (much smaller)',
    'lodash': 'lodash-es or native JS methods',
    'axios': 'native fetch API',
    'uuid': 'crypto.randomUUID() (native)',
    'bcrypt': 'bcryptjs (pure JS)',
    'jsonwebtoken': '@fastify/jwt (if using Fastify)',
    'express-validator': 'joi or yup (more flexible)',
    'body-parser': 'Built into Express 4.16+',
    'request': 'node-fetch or axios',
    'bluebird': 'Native Promises',
    'async': 'Native async/await',
    'underscore': 'lodash or native methods'
  };
  
  report.large.forEach(item => {
    const pkgName = item.package.split('@')[0];
    if (replacements[pkgName]) {
      report.suggestions.push({
        package: item.package,
        suggestion: replacements[pkgName],
        workspace: item.workspace,
        currentSize: item.size
      });
    }
  });
  
  // Generate summary
  console.log(`\n${colors.green}📊 Analysis Complete!${colors.reset}\n`);
  console.log(`${colors.yellow}Summary:${colors.reset}`);
  console.log(`- Unused dependencies: ${report.unused.length}`);
  console.log(`- Misplaced dependencies: ${report.misplaced.length}`);
  console.log(`- Outdated packages: ${report.outdated.length}`);
  console.log(`- Large packages (>10MB): ${report.large.length}`);
  console.log(`- Duplicate dependencies: ${Object.keys(report.duplicates).length}`);
  console.log(`- Optimization suggestions: ${report.suggestions.length}`);
  
  // Save detailed report
  const reportPath = path.join('docs', 'dependency-analysis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n${colors.green}Detailed report saved to: ${reportPath}${colors.reset}`);
  
  return report;
}

// Run the analysis
if (require.main === module) {
  analyzeDependencies().catch(console.error);
}

module.exports = { analyzeDependencies };