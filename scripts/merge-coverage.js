#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createCoverageMap } = require('istanbul-lib-coverage');

const rootDir = path.join(__dirname, '..');
const coverageDir = path.join(rootDir, 'coverage');
const tempCoverageDir = path.join(rootDir, '.nyc_output');

// Create coverage directories if they don't exist
if (!fs.existsSync(coverageDir)) {
  fs.mkdirSync(coverageDir, { recursive: true });
}

if (!fs.existsSync(tempCoverageDir)) {
  fs.mkdirSync(tempCoverageDir, { recursive: true });
}

// Function to find all coverage-final.json files
function findCoverageFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and hidden directories
      if (item === 'node_modules' || item.startsWith('.')) {
        continue;
      }
      
      // Check if this is a coverage directory
      if (item === 'coverage') {
        const coverageFile = path.join(itemPath, 'coverage-final.json');
        if (fs.existsSync(coverageFile)) {
          files.push(coverageFile);
        }
      } else {
        // Recurse into directory
        findCoverageFiles(itemPath, files);
      }
    }
  }
  
  return files;
}

console.log('🔍 Finding coverage files...');

// Find all coverage files in the monorepo
const coverageFiles = [
  ...findCoverageFiles(path.join(rootDir, 'apps')),
  ...findCoverageFiles(path.join(rootDir, 'services')),
  ...findCoverageFiles(path.join(rootDir, 'packages'))
];

console.log(`Found ${coverageFiles.length} coverage files:`);
coverageFiles.forEach(file => {
  const relativePath = path.relative(rootDir, file);
  console.log(`  - ${relativePath}`);
});

if (coverageFiles.length === 0) {
  console.log('❌ No coverage files found. Run tests with coverage first.');
  process.exit(1);
}

// Create a coverage map
const coverageMap = createCoverageMap({});

// Merge all coverage files
coverageFiles.forEach(file => {
  try {
    const coverage = JSON.parse(fs.readFileSync(file, 'utf8'));
    coverageMap.merge(coverage);
  } catch (error) {
    console.error(`Error reading ${file}:`, error.message);
  }
});

// Write merged coverage
const mergedCoverage = coverageMap.toJSON();
const outputFile = path.join(tempCoverageDir, 'coverage-final.json');
fs.writeFileSync(outputFile, JSON.stringify(mergedCoverage, null, 2));

console.log(`\n✅ Coverage merged successfully!`);
console.log(`📁 Output: ${outputFile}`);

// Also save to root coverage directory
const rootCoverageFile = path.join(coverageDir, 'coverage-final.json');
fs.writeFileSync(rootCoverageFile, JSON.stringify(mergedCoverage, null, 2));

// Calculate summary statistics
const summary = coverageMap.getCoverageSummary();
console.log('\n📊 Coverage Summary:');
console.log(`  Lines:      ${summary.lines.pct.toFixed(2)}%`);
console.log(`  Statements: ${summary.statements.pct.toFixed(2)}%`);
console.log(`  Functions:  ${summary.functions.pct.toFixed(2)}%`);
console.log(`  Branches:   ${summary.branches.pct.toFixed(2)}%`);