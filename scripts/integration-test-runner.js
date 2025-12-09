#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Configuration
const CONFIG = {
  browsers: ['chrome', 'firefox', 'edge'],
  testSuites: [
    {
      name: 'Jest Integration Tests',
      command: 'pnpm',
      args: ['test', 'optimization-integration', '--coverage', '--maxWorkers=2'],
      cwd: path.join(__dirname, '../apps/frontend')
    },
    {
      name: 'Cypress E2E Tests',
      command: 'pnpm',
      args: ['cypress', 'run', '--spec', 'cypress/e2e/optimizations.cy.ts'],
      cwd: path.join(__dirname, '../apps/frontend'),
      browsers: true
    }
  ],
  performanceThresholds: {
    firstContentfulPaint: 1000, // 1 second
    timeToInteractive: 2000, // 2 seconds
    totalBlockingTime: 300, // 300ms
    largestContentfulPaint: 2500, // 2.5 seconds
    cumulativeLayoutShift: 0.1,
    bundleSize: 500 * 1024, // 500KB
    memoryUsage: 50 * 1024 * 1024 // 50MB
  }
};

// Utility functions
function log(message, type = 'info') {
  const colors = {
    info: chalk.blue,
    success: chalk.green,
    warning: chalk.yellow,
    error: chalk.red
  };
  console.log(colors[type](`[${new Date().toISOString()}] ${message}`));
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'pipe',
      shell: true,
      ...options
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
  });
}

// Test runners
async function runJestTests(suite) {
  log(`Running ${suite.name}...`, 'info');
  
  try {
    const result = await runCommand(suite.command, suite.args, { cwd: suite.cwd });
    log(`${suite.name} completed successfully`, 'success');
    
    // Parse coverage report
    const coveragePath = path.join(suite.cwd, 'coverage/coverage-summary.json');
    if (fs.existsSync(coveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      return {
        success: true,
        coverage: coverage.total,
        suite: suite.name
      };
    }
    
    return { success: true, suite: suite.name };
  } catch (error) {
    log(`${suite.name} failed: ${error.message}`, 'error');
    return { success: false, error: error.message, suite: suite.name };
  }
}

async function runCypressTests(suite) {
  const results = [];
  
  for (const browser of CONFIG.browsers) {
    log(`Running ${suite.name} in ${browser}...`, 'info');
    
    try {
      const args = [...suite.args, '--browser', browser];
      const result = await runCommand(suite.command, args, { cwd: suite.cwd });
      
      log(`${suite.name} in ${browser} completed successfully`, 'success');
      
      // Parse Cypress results
      const resultsPath = path.join(suite.cwd, `cypress/results/${browser}-results.json`);
      if (fs.existsSync(resultsPath)) {
        const cypressResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
        results.push({
          success: true,
          browser,
          suite: suite.name,
          stats: cypressResults.stats
        });
      } else {
        results.push({
          success: true,
          browser,
          suite: suite.name
        });
      }
    } catch (error) {
      log(`${suite.name} in ${browser} failed: ${error.message}`, 'error');
      results.push({
        success: false,
        browser,
        error: error.message,
        suite: suite.name
      });
    }
  }
  
  return results;
}

async function checkPerformanceMetrics() {
  log('Checking performance metrics...', 'info');
  
  const metricsPath = path.join(__dirname, '../apps/frontend/.next/analyze/client.html');
  const bundleStatsPath = path.join(__dirname, '../apps/frontend/.next/stats.json');
  
  const metrics = {
    bundleSize: 0,
    performanceScore: 100,
    issues: []
  };
  
  // Check bundle size
  if (fs.existsSync(bundleStatsPath)) {
    const stats = JSON.parse(fs.readFileSync(bundleStatsPath, 'utf8'));
    const mainBundle = stats.assets.find(asset => asset.name.includes('main'));
    
    if (mainBundle) {
      metrics.bundleSize = mainBundle.size;
      
      if (mainBundle.size > CONFIG.performanceThresholds.bundleSize) {
        metrics.issues.push({
          type: 'bundleSize',
          message: `Bundle size (${mainBundle.size} bytes) exceeds threshold (${CONFIG.performanceThresholds.bundleSize} bytes)`,
          severity: 'warning'
        });
        metrics.performanceScore -= 10;
      }
    }
  }
  
  // Run Lighthouse for performance metrics
  try {
    const lighthouse = await runCommand('npx', [
      'lighthouse',
      'http://localhost:3010',
      '--output=json',
      '--output-path=./lighthouse-report.json',
      '--only-categories=performance',
      '--chrome-flags="--headless"'
    ], { cwd: path.join(__dirname, '../apps/frontend') });
    
    const report = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../apps/frontend/lighthouse-report.json'),
      'utf8'
    ));
    
    const perfMetrics = report.audits;
    
    // Check FCP
    const fcp = perfMetrics['first-contentful-paint'];
    if (fcp.numericValue > CONFIG.performanceThresholds.firstContentfulPaint) {
      metrics.issues.push({
        type: 'fcp',
        message: `First Contentful Paint (${fcp.displayValue}) exceeds threshold`,
        severity: 'warning'
      });
      metrics.performanceScore -= 15;
    }
    
    // Check TTI
    const tti = perfMetrics['interactive'];
    if (tti.numericValue > CONFIG.performanceThresholds.timeToInteractive) {
      metrics.issues.push({
        type: 'tti',
        message: `Time to Interactive (${tti.displayValue}) exceeds threshold`,
        severity: 'error'
      });
      metrics.performanceScore -= 20;
    }
    
    // Check TBT
    const tbt = perfMetrics['total-blocking-time'];
    if (tbt.numericValue > CONFIG.performanceThresholds.totalBlockingTime) {
      metrics.issues.push({
        type: 'tbt',
        message: `Total Blocking Time (${tbt.displayValue}) exceeds threshold`,
        severity: 'warning'
      });
      metrics.performanceScore -= 10;
    }
    
    // Check LCP
    const lcp = perfMetrics['largest-contentful-paint'];
    if (lcp.numericValue > CONFIG.performanceThresholds.largestContentfulPaint) {
      metrics.issues.push({
        type: 'lcp',
        message: `Largest Contentful Paint (${lcp.displayValue}) exceeds threshold`,
        severity: 'warning'
      });
      metrics.performanceScore -= 15;
    }
    
    // Check CLS
    const cls = perfMetrics['cumulative-layout-shift'];
    if (cls.numericValue > CONFIG.performanceThresholds.cumulativeLayoutShift) {
      metrics.issues.push({
        type: 'cls',
        message: `Cumulative Layout Shift (${cls.displayValue}) exceeds threshold`,
        severity: 'error'
      });
      metrics.performanceScore -= 20;
    }
    
    metrics.lighthouse = {
      score: report.categories.performance.score * 100,
      metrics: {
        fcp: fcp.displayValue,
        tti: tti.displayValue,
        tbt: tbt.displayValue,
        lcp: lcp.displayValue,
        cls: cls.displayValue
      }
    };
  } catch (error) {
    log(`Lighthouse analysis failed: ${error.message}`, 'warning');
  }
  
  return metrics;
}

async function generateReport(results) {
  log('Generating test report...', 'info');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      coverage: null,
      performanceScore: 100
    },
    testResults: results.testResults,
    performanceMetrics: results.performanceMetrics,
    recommendations: []
  };
  
  // Calculate summary
  results.testResults.forEach(result => {
    if (Array.isArray(result)) {
      result.forEach(r => {
        report.summary.totalTests++;
        if (r.success) report.summary.passedTests++;
        else report.summary.failedTests++;
      });
    } else {
      report.summary.totalTests++;
      if (result.success) report.summary.passedTests++;
      else report.summary.failedTests++;
      
      if (result.coverage) {
        report.summary.coverage = result.coverage;
      }
    }
  });
  
  report.summary.performanceScore = results.performanceMetrics.performanceScore;
  
  // Generate recommendations
  if (report.summary.coverage && report.summary.coverage.lines.pct < 80) {
    report.recommendations.push({
      type: 'coverage',
      message: `Code coverage (${report.summary.coverage.lines.pct}%) is below 80%. Consider adding more tests.`,
      priority: 'medium'
    });
  }
  
  if (results.performanceMetrics.issues.length > 0) {
    results.performanceMetrics.issues.forEach(issue => {
      report.recommendations.push({
        type: 'performance',
        message: issue.message,
        priority: issue.severity === 'error' ? 'high' : 'medium'
      });
    });
  }
  
  // Save report
  const reportPath = path.join(__dirname, '../test-reports/integration-test-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generate HTML report
  const htmlReport = generateHTMLReport(report);
  fs.writeFileSync(
    path.join(__dirname, '../test-reports/integration-test-report.html'),
    htmlReport
  );
  
  return report;
}

function generateHTMLReport(report) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Integration Test Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1, h2 {
      color: #333;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .metric {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 4px;
      text-align: center;
    }
    .metric-value {
      font-size: 2em;
      font-weight: bold;
      color: #0066cc;
    }
    .metric-label {
      color: #666;
      margin-top: 5px;
    }
    .success { color: #28a745; }
    .failure { color: #dc3545; }
    .warning { color: #ffc107; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #f8f9fa;
      font-weight: 600;
    }
    .recommendation {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 10px 0;
    }
    .performance-score {
      display: inline-block;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      text-align: center;
      line-height: 60px;
      font-size: 1.5em;
      font-weight: bold;
      color: white;
    }
    .score-good { background: #28a745; }
    .score-warning { background: #ffc107; }
    .score-poor { background: #dc3545; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Integration Test Report</h1>
    <p>Generated: ${new Date(report.timestamp).toLocaleString()}</p>
    
    <div class="summary">
      <div class="metric">
        <div class="metric-value ${report.summary.passedTests === report.summary.totalTests ? 'success' : 'failure'}">
          ${report.summary.passedTests}/${report.summary.totalTests}
        </div>
        <div class="metric-label">Tests Passed</div>
      </div>
      
      ${report.summary.coverage ? `
      <div class="metric">
        <div class="metric-value ${report.summary.coverage.lines.pct >= 80 ? 'success' : 'warning'}">
          ${report.summary.coverage.lines.pct.toFixed(1)}%
        </div>
        <div class="metric-label">Code Coverage</div>
      </div>
      ` : ''}
      
      <div class="metric">
        <div class="performance-score ${
          report.summary.performanceScore >= 90 ? 'score-good' :
          report.summary.performanceScore >= 70 ? 'score-warning' : 'score-poor'
        }">
          ${report.summary.performanceScore}
        </div>
        <div class="metric-label">Performance Score</div>
      </div>
    </div>
    
    <h2>Test Results</h2>
    <table>
      <thead>
        <tr>
          <th>Test Suite</th>
          <th>Browser</th>
          <th>Status</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        ${report.testResults.map(result => {
          if (Array.isArray(result)) {
            return result.map(r => `
              <tr>
                <td>${r.suite}</td>
                <td>${r.browser || 'N/A'}</td>
                <td class="${r.success ? 'success' : 'failure'}">
                  ${r.success ? 'PASSED' : 'FAILED'}
                </td>
                <td>${r.error || 'Success'}</td>
              </tr>
            `).join('');
          } else {
            return `
              <tr>
                <td>${result.suite}</td>
                <td>N/A</td>
                <td class="${result.success ? 'success' : 'failure'}">
                  ${result.success ? 'PASSED' : 'FAILED'}
                </td>
                <td>${result.error || 'Success'}</td>
              </tr>
            `;
          }
        }).join('')}
      </tbody>
    </table>
    
    ${report.performanceMetrics.lighthouse ? `
    <h2>Performance Metrics</h2>
    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th>Value</th>
          <th>Threshold</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>First Contentful Paint</td>
          <td>${report.performanceMetrics.lighthouse.metrics.fcp}</td>
          <td>< 1.0s</td>
          <td>${parseFloat(report.performanceMetrics.lighthouse.metrics.fcp) < 1.0 ? '✅' : '❌'}</td>
        </tr>
        <tr>
          <td>Time to Interactive</td>
          <td>${report.performanceMetrics.lighthouse.metrics.tti}</td>
          <td>< 2.0s</td>
          <td>${parseFloat(report.performanceMetrics.lighthouse.metrics.tti) < 2.0 ? '✅' : '❌'}</td>
        </tr>
        <tr>
          <td>Total Blocking Time</td>
          <td>${report.performanceMetrics.lighthouse.metrics.tbt}</td>
          <td>< 300ms</td>
          <td>${parseFloat(report.performanceMetrics.lighthouse.metrics.tbt) < 300 ? '✅' : '❌'}</td>
        </tr>
        <tr>
          <td>Largest Contentful Paint</td>
          <td>${report.performanceMetrics.lighthouse.metrics.lcp}</td>
          <td>< 2.5s</td>
          <td>${parseFloat(report.performanceMetrics.lighthouse.metrics.lcp) < 2.5 ? '✅' : '❌'}</td>
        </tr>
        <tr>
          <td>Cumulative Layout Shift</td>
          <td>${report.performanceMetrics.lighthouse.metrics.cls}</td>
          <td>< 0.1</td>
          <td>${parseFloat(report.performanceMetrics.lighthouse.metrics.cls) < 0.1 ? '✅' : '❌'}</td>
        </tr>
      </tbody>
    </table>
    ` : ''}
    
    ${report.recommendations.length > 0 ? `
    <h2>Recommendations</h2>
    ${report.recommendations.map(rec => `
      <div class="recommendation">
        <strong>${rec.type.toUpperCase()}</strong>: ${rec.message}
      </div>
    `).join('')}
    ` : ''}
  </div>
</body>
</html>
  `;
}

// Main execution
async function main() {
  console.log(chalk.bold.blue('\n🚀 Hockey Hub Integration Test Runner\n'));
  
  const results = {
    testResults: [],
    performanceMetrics: null
  };
  
  try {
    // Run all test suites
    for (const suite of CONFIG.testSuites) {
      if (suite.browsers) {
        const cypressResults = await runCypressTests(suite);
        results.testResults.push(cypressResults);
      } else {
        const jestResult = await runJestTests(suite);
        results.testResults.push(jestResult);
      }
    }
    
    // Check performance metrics
    results.performanceMetrics = await checkPerformanceMetrics();
    
    // Generate report
    const report = await generateReport(results);
    
    // Print summary
    console.log(chalk.bold('\n📊 Test Summary:\n'));
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${chalk.green(report.summary.passedTests)}`);
    console.log(`Failed: ${chalk.red(report.summary.failedTests)}`);
    
    if (report.summary.coverage) {
      console.log(`Coverage: ${chalk.yellow(report.summary.coverage.lines.pct.toFixed(1) + '%')}`);
    }
    
    console.log(`Performance Score: ${chalk.blue(report.summary.performanceScore)}/100`);
    
    if (report.recommendations.length > 0) {
      console.log(chalk.bold('\n⚠️  Recommendations:\n'));
      report.recommendations.forEach(rec => {
        const icon = rec.priority === 'high' ? '🔴' : '🟡';
        console.log(`${icon} ${rec.message}`);
      });
    }
    
    console.log(chalk.bold('\n📄 Reports generated:'));
    console.log('  - test-reports/integration-test-report.json');
    console.log('  - test-reports/integration-test-report.html\n');
    
    // Exit with appropriate code
    process.exit(report.summary.failedTests > 0 ? 1 : 0);
    
  } catch (error) {
    log(`Test runner failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, runJestTests, runCypressTests, checkPerformanceMetrics };