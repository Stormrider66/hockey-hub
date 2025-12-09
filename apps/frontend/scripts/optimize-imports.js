#!/usr/bin/env node

/**
 * Script to optimize imports across the codebase
 * Usage: node scripts/optimize-imports.js [--fix] [--analyze] [path]
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Common import optimizations
const IMPORT_REPLACEMENTS = {
  // Lodash imports
  "import _ from 'lodash'": (code, imports) => {
    const usedMethods = findLodashUsage(code);
    if (usedMethods.length > 0) {
      return `import { ${usedMethods.join(', ')} } from 'lodash-es'`;
    }
    return null;
  },
  "from 'lodash'": "from 'lodash-es'",
  
  // Date-fns specific imports
  "from 'date-fns'": (importStatement) => {
    const functions = extractImportedItems(importStatement);
    return functions.map(fn => `import ${fn} from 'date-fns/${fn}'`).join('\n');
  },
  
  // Icon imports - convert barrel to specific
  "} from 'lucide-react'": (importStatement) => {
    // Keep as is - lucide-react is already optimized
    return importStatement;
  },
  
  // Remove barrel imports from local files
  "/index'": (importStatement, filePath) => {
    // Try to resolve to specific file
    const importPath = extractImportPath(importStatement);
    const resolvedPath = resolveBarrelImport(importPath, filePath);
    if (resolvedPath) {
      return importStatement.replace('/index', resolvedPath);
    }
    return importStatement;
  },
};

// Patterns to detect inefficient imports
const INEFFICIENT_PATTERNS = [
  {
    pattern: /import\s+\*\s+as\s+\w+\s+from\s+['"]lodash['"]/g,
    message: 'Namespace import from lodash detected. Use named imports from lodash-es instead.',
    severity: 'high'
  },
  {
    pattern: /import\s+\{[^}]+\}\s+from\s+['"]\.\.\/\.\.\/(?:components|utils|hooks)['"]/g,
    message: 'Potential barrel import detected. Consider importing from specific files.',
    severity: 'medium'
  },
  {
    pattern: /import\s+moment\s+from\s+['"]moment['"]/g,
    message: 'Moment.js detected. Consider migrating to date-fns for better tree-shaking.',
    severity: 'high'
  },
  {
    pattern: /import\s+\{[^}]+\}\s+from\s+['"]@mui\/material['"]/g,
    message: 'Barrel import from @mui/material. Use specific component imports.',
    severity: 'medium',
    fix: (match) => {
      const components = extractImportedItems(match);
      return components.map(comp => 
        `import ${comp} from '@mui/material/${comp}'`
      ).join('\n');
    }
  }
];

// Helper functions
function findLodashUsage(code) {
  const methods = new Set();
  const lodashPattern = /_\.(\w+)\(/g;
  let match;
  
  while ((match = lodashPattern.exec(code)) !== null) {
    methods.add(match[1]);
  }
  
  return Array.from(methods);
}

function extractImportedItems(importStatement) {
  const match = importStatement.match(/\{([^}]+)\}/);
  if (match) {
    return match[1].split(',').map(item => item.trim());
  }
  return [];
}

function extractImportPath(importStatement) {
  const match = importStatement.match(/from\s+['"](.*)['"]/);
  return match ? match[1] : null;
}

function resolveBarrelImport(importPath, currentFile) {
  // This is a simplified version - in practice you'd need more sophisticated resolution
  const basePath = importPath.replace('/index', '');
  const possibleFiles = [
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}/index.ts`,
    `${basePath}/index.tsx`
  ];
  
  // Check which file exists
  for (const file of possibleFiles) {
    const resolvedPath = path.resolve(path.dirname(currentFile), file);
    if (fs.existsSync(resolvedPath)) {
      return basePath;
    }
  }
  
  return null;
}

function analyzeFile(filePath, options = {}) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];
  const lines = content.split('\n');
  
  // Check each pattern
  INEFFICIENT_PATTERNS.forEach(({ pattern, message, severity, fix }) => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const lineNumber = lines.findIndex(line => line.includes(match)) + 1;
        issues.push({
          file: filePath,
          line: lineNumber,
          message,
          severity,
          original: match,
          fix: fix ? fix(match) : null
        });
      });
    }
  });
  
  // Check for circular dependencies (simplified)
  const imports = content.match(/import.*from\s+['"]\.[^'"]+['"]/g) || [];
  imports.forEach(imp => {
    const importPath = extractImportPath(imp);
    if (importPath && importPath.includes('../') && importPath.split('../').length > 3) {
      issues.push({
        file: filePath,
        line: lines.findIndex(line => line.includes(imp)) + 1,
        message: 'Deep relative import detected. Consider using path aliases.',
        severity: 'low'
      });
    }
  });
  
  return issues;
}

function fixFile(filePath, issues) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  
  // Apply fixes in reverse order to maintain line positions
  issues.sort((a, b) => b.line - a.line).forEach(issue => {
    if (issue.fix) {
      content = content.replace(issue.original, issue.fix);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fixed ${filePath}`);
  }
  
  return modified;
}

function formatIssue(issue) {
  const severityColors = {
    high: '\x1b[31m',    // Red
    medium: '\x1b[33m',  // Yellow
    low: '\x1b[36m'      // Cyan
  };
  
  const color = severityColors[issue.severity] || '';
  const reset = '\x1b[0m';
  
  return `${color}[${issue.severity.toUpperCase()}]${reset} ${issue.file}:${issue.line}
  ${issue.message}
  ${issue.original.trim()}
  ${issue.fix ? `Suggested fix: ${issue.fix}` : ''}`;
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');
  const shouldAnalyze = args.includes('--analyze');
  const targetPath = args.find(arg => !arg.startsWith('--')) || 'src';
  
  console.log('🔍 Analyzing imports...\n');
  
  const pattern = path.join(targetPath, '**/*.{ts,tsx,js,jsx}');
  const files = glob.sync(pattern, {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**']
  });
  
  let totalIssues = 0;
  let fixedFiles = 0;
  const issuesBySeverity = { high: 0, medium: 0, low: 0 };
  
  files.forEach(file => {
    const issues = analyzeFile(file);
    
    if (issues.length > 0) {
      totalIssues += issues.length;
      issues.forEach(issue => {
        issuesBySeverity[issue.severity]++;
        if (!shouldFix || !issue.fix) {
          console.log(formatIssue(issue));
          console.log('');
        }
      });
      
      if (shouldFix) {
        if (fixFile(file, issues)) {
          fixedFiles++;
        }
      }
    }
  });
  
  // Summary
  console.log('\n📊 Summary:');
  console.log(`Total files analyzed: ${files.length}`);
  console.log(`Total issues found: ${totalIssues}`);
  console.log(`  High severity: ${issuesBySeverity.high}`);
  console.log(`  Medium severity: ${issuesBySeverity.medium}`);
  console.log(`  Low severity: ${issuesBySeverity.low}`);
  
  if (shouldFix) {
    console.log(`\nFiles fixed: ${fixedFiles}`);
  } else if (totalIssues > 0) {
    console.log('\nRun with --fix flag to automatically fix issues where possible.');
  }
  
  if (shouldAnalyze) {
    console.log('\n📦 Bundle size impact analysis:');
    estimateBundleImpact(issuesBySeverity);
  }
}

function estimateBundleImpact(issuesBySeverity) {
  const estimates = {
    high: 50, // KB per issue
    medium: 20,
    low: 5
  };
  
  let totalImpact = 0;
  Object.entries(issuesBySeverity).forEach(([severity, count]) => {
    const impact = count * estimates[severity];
    totalImpact += impact;
    console.log(`  ${severity}: ~${impact} KB`);
  });
  
  console.log(`  Total potential savings: ~${totalImpact} KB`);
}

// Run the script
if (require.main === module) {
  main();
}