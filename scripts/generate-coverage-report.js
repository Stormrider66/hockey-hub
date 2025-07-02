#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const libCoverage = require('istanbul-lib-coverage');
const libReport = require('istanbul-lib-report');
const reports = require('istanbul-reports');

const rootDir = path.join(__dirname, '..');
const coverageDir = path.join(rootDir, 'coverage');
const coverageFile = path.join(coverageDir, 'coverage-final.json');
const nycOutputFile = path.join(rootDir, '.nyc_output', 'coverage-final.json');

// Use the merged coverage file
const sourceFile = fs.existsSync(coverageFile) ? coverageFile : nycOutputFile;

if (!fs.existsSync(sourceFile)) {
  console.error('❌ No merged coverage file found. Run "pnpm coverage:merge" first.');
  process.exit(1);
}

console.log('📊 Generating coverage reports...\n');

try {
  // Load coverage data
  const coverageData = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
  const coverageMap = libCoverage.createCoverageMap(coverageData);

  // Create context for reports
  const context = libReport.createContext({
    dir: coverageDir,
    defaultSummarizer: 'nested',
    coverageMap
  });

  // Generate different report formats
  const reportFormats = ['html', 'lcov', 'text', 'text-summary', 'json-summary'];
  
  reportFormats.forEach(format => {
    console.log(`Generating ${format} report...`);
    const report = reports.create(format);
    report.execute(context);
  });

  console.log('\n✅ Coverage reports generated successfully!');
  console.log(`📁 Reports available in: ${coverageDir}`);
  
  // Read and display the summary
  const summaryFile = path.join(coverageDir, 'coverage-summary.json');
  if (fs.existsSync(summaryFile)) {
    const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
    console.log('\n📈 Overall Coverage Summary:');
    console.log('================================');
    
    const total = summary.total;
    console.log(`Lines:      ${total.lines.pct.toFixed(2)}% (${total.lines.covered}/${total.lines.total})`);
    console.log(`Statements: ${total.statements.pct.toFixed(2)}% (${total.statements.covered}/${total.statements.total})`);
    console.log(`Functions:  ${total.functions.pct.toFixed(2)}% (${total.functions.covered}/${total.functions.total})`);
    console.log(`Branches:   ${total.branches.pct.toFixed(2)}% (${total.branches.covered}/${total.branches.total})`);
    
    // Show files with low coverage
    console.log('\n⚠️  Files with coverage below 80%:');
    console.log('================================');
    
    let hasLowCoverage = false;
    Object.entries(summary).forEach(([file, data]) => {
      if (file !== 'total' && data.lines.pct < 80) {
        hasLowCoverage = true;
        console.log(`${file}: ${data.lines.pct.toFixed(2)}%`);
      }
    });
    
    if (!hasLowCoverage) {
      console.log('🎉 All files have coverage above 80%!');
    }
  }
  
  console.log('\n💡 View detailed HTML report: file://' + path.join(coverageDir, 'index.html'));
  
} catch (error) {
  console.error('Error generating reports:', error.message);
  process.exit(1);
}