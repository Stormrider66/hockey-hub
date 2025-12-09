const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs').promises;
const path = require('path');

// Configuration for different network conditions
const NETWORK_CONDITIONS = {
  '3G': {
    offline: false,
    downloadThroughput: 1.6 * 1024 * 1024 / 8,
    uploadThroughput: 750 * 1024 / 8,
    latency: 300,
  },
  '4G': {
    offline: false,
    downloadThroughput: 4 * 1024 * 1024 / 8,
    uploadThroughput: 3 * 1024 * 1024 / 8,
    latency: 50,
  },
  'WiFi': {
    offline: false,
    downloadThroughput: 30 * 1024 * 1024 / 8,
    uploadThroughput: 15 * 1024 * 1024 / 8,
    latency: 2,
  },
};

// Dashboards to test
const DASHBOARDS = [
  { name: 'Player', path: '/player' },
  { name: 'Coach', path: '/coach' },
  { name: 'Parent', path: '/parent' },
  { name: 'Medical Staff', path: '/medicalstaff' },
  { name: 'Equipment Manager', path: '/equipmentmanager' },
  { name: 'Physical Trainer', path: '/physicaltrainer' },
  { name: 'Club Admin', path: '/clubadmin' },
  { name: 'Admin', path: '/admin' },
];

// Performance metrics to track
const METRICS_TO_TRACK = [
  'first-contentful-paint',
  'largest-contentful-paint',
  'time-to-interactive',
  'speed-index',
  'total-blocking-time',
  'cumulative-layout-shift',
  'server-response-time',
  'dom-size',
  'network-requests',
  'total-byte-weight',
  'uses-responsive-images',
  'uses-optimized-images',
  'uses-text-compression',
  'uses-rel-preconnect',
  'font-display',
];

class PerformanceBenchmark {
  constructor(baseUrl = 'http://localhost:3010') {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  async runLighthouse(url, networkCondition = 'WiFi') {
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance'],
      port: chrome.port,
      throttling: NETWORK_CONDITIONS[networkCondition],
    };

    try {
      const runnerResult = await lighthouse(url, options);
      const report = runnerResult.report;
      const parsedReport = JSON.parse(report);
      
      await chrome.kill();
      
      return this.extractMetrics(parsedReport);
    } catch (error) {
      await chrome.kill();
      throw error;
    }
  }

  extractMetrics(report) {
    const metrics = {};
    const audits = report.audits;
    
    // Core Web Vitals
    metrics.fcp = audits['first-contentful-paint'].numericValue;
    metrics.lcp = audits['largest-contentful-paint'].numericValue;
    metrics.tti = audits['interactive'].numericValue;
    metrics.tbt = audits['total-blocking-time'].numericValue;
    metrics.cls = audits['cumulative-layout-shift'].numericValue;
    metrics.si = audits['speed-index'].numericValue;
    
    // Additional metrics
    metrics.serverResponseTime = audits['server-response-time']?.numericValue || 0;
    metrics.domSize = audits['dom-size']?.numericValue || 0;
    metrics.requests = audits['network-requests']?.details?.items?.length || 0;
    metrics.totalBytes = audits['total-byte-weight']?.numericValue || 0;
    
    // Performance score
    metrics.score = report.categories.performance.score * 100;
    
    return metrics;
  }

  async benchmarkDashboard(dashboard, networkConditions = ['WiFi']) {
    const results = {};
    
    for (const condition of networkConditions) {
      console.log(`Testing ${dashboard.name} dashboard on ${condition}...`);
      
      try {
        const url = `${this.baseUrl}${dashboard.path}`;
        const metrics = await this.runLighthouse(url, condition);
        
        results[condition] = {
          ...metrics,
          timestamp: new Date().toISOString(),
          dashboard: dashboard.name,
          condition,
        };
      } catch (error) {
        console.error(`Error testing ${dashboard.name} on ${condition}:`, error);
        results[condition] = { error: error.message };
      }
    }
    
    return results;
  }

  async runFullBenchmark() {
    console.log('Starting full performance benchmark...\n');
    
    const fullResults = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      dashboards: {},
    };
    
    for (const dashboard of DASHBOARDS) {
      fullResults.dashboards[dashboard.name] = await this.benchmarkDashboard(
        dashboard,
        Object.keys(NETWORK_CONDITIONS)
      );
    }
    
    return fullResults;
  }

  async compareBeforeAfter(beforeFile, afterFile) {
    const before = JSON.parse(await fs.readFile(beforeFile, 'utf8'));
    const after = JSON.parse(await fs.readFile(afterFile, 'utf8'));
    
    const comparison = {
      timestamp: new Date().toISOString(),
      improvements: {},
      regressions: {},
      summary: {},
    };
    
    for (const dashboard of Object.keys(after.dashboards)) {
      comparison.improvements[dashboard] = {};
      comparison.regressions[dashboard] = {};
      
      for (const condition of Object.keys(after.dashboards[dashboard])) {
        const beforeMetrics = before.dashboards[dashboard]?.[condition];
        const afterMetrics = after.dashboards[dashboard][condition];
        
        if (!beforeMetrics || !afterMetrics) continue;
        
        const changes = {};
        
        // Calculate percentage changes
        const metricsToCompare = ['fcp', 'lcp', 'tti', 'tbt', 'cls', 'si', 'score'];
        
        for (const metric of metricsToCompare) {
          if (beforeMetrics[metric] && afterMetrics[metric]) {
            const change = ((afterMetrics[metric] - beforeMetrics[metric]) / beforeMetrics[metric]) * 100;
            changes[metric] = {
              before: beforeMetrics[metric],
              after: afterMetrics[metric],
              change: change.toFixed(2) + '%',
              improved: metric === 'score' ? change > 0 : change < 0,
            };
            
            if (changes[metric].improved) {
              comparison.improvements[dashboard][`${condition}_${metric}`] = changes[metric];
            } else {
              comparison.regressions[dashboard][`${condition}_${metric}`] = changes[metric];
            }
          }
        }
      }
    }
    
    // Generate summary
    let totalImprovements = 0;
    let totalRegressions = 0;
    
    for (const dashboard of Object.keys(comparison.improvements)) {
      totalImprovements += Object.keys(comparison.improvements[dashboard]).length;
      totalRegressions += Object.keys(comparison.regressions[dashboard]).length;
    }
    
    comparison.summary = {
      totalImprovements,
      totalRegressions,
      overallImprovement: totalImprovements > totalRegressions,
    };
    
    return comparison;
  }

  async generateReport(results, outputPath = './performance-report.html') {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hockey Hub Performance Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: #2563eb;
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .dashboard-section {
            background: white;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .metric-card {
            padding: 15px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            text-align: center;
        }
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
        }
        .metric-label {
            font-size: 14px;
            color: #6b7280;
            margin-top: 5px;
        }
        .good { color: #10b981; }
        .warning { color: #f59e0b; }
        .poor { color: #ef4444; }
        .network-tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        .network-tab {
            padding: 8px 16px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            cursor: pointer;
            background: white;
        }
        .network-tab.active {
            background: #2563eb;
            color: white;
        }
        .score {
            font-size: 48px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        th {
            background: #f9fafb;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Hockey Hub Performance Report</h1>
        <p>Generated: ${new Date(results.timestamp).toLocaleString()}</p>
        <p>Base URL: ${results.baseUrl}</p>
    </div>
    
    ${Object.entries(results.dashboards).map(([dashboardName, conditions]) => `
        <div class="dashboard-section">
            <h2>${dashboardName} Dashboard</h2>
            
            <div class="network-tabs">
                ${Object.keys(conditions).map((condition, index) => `
                    <button class="network-tab ${index === 0 ? 'active' : ''}" 
                            onclick="showCondition('${dashboardName}', '${condition}')">
                        ${condition}
                    </button>
                `).join('')}
            </div>
            
            ${Object.entries(conditions).map(([condition, metrics], index) => `
                <div id="${dashboardName}-${condition}" 
                     class="condition-results" 
                     style="display: ${index === 0 ? 'block' : 'none'}">
                    
                    ${metrics.error ? `
                        <p class="poor">Error: ${metrics.error}</p>
                    ` : `
                        <div class="score ${this.getScoreClass(metrics.score)}">
                            ${Math.round(metrics.score)}
                        </div>
                        
                        <div class="metrics-grid">
                            <div class="metric-card">
                                <div class="metric-value">${this.formatTime(metrics.fcp)}</div>
                                <div class="metric-label">First Contentful Paint</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-value">${this.formatTime(metrics.lcp)}</div>
                                <div class="metric-label">Largest Contentful Paint</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-value">${this.formatTime(metrics.tti)}</div>
                                <div class="metric-label">Time to Interactive</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-value">${this.formatTime(metrics.tbt)}</div>
                                <div class="metric-label">Total Blocking Time</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-value">${metrics.cls.toFixed(3)}</div>
                                <div class="metric-label">Cumulative Layout Shift</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-value">${this.formatTime(metrics.si)}</div>
                                <div class="metric-label">Speed Index</div>
                            </div>
                        </div>
                        
                        <table>
                            <tr>
                                <th>Metric</th>
                                <th>Value</th>
                                <th>Target</th>
                            </tr>
                            <tr>
                                <td>Server Response Time</td>
                                <td>${this.formatTime(metrics.serverResponseTime)}</td>
                                <td>&lt; 600ms</td>
                            </tr>
                            <tr>
                                <td>DOM Size</td>
                                <td>${metrics.domSize} elements</td>
                                <td>&lt; 1500</td>
                            </tr>
                            <tr>
                                <td>Network Requests</td>
                                <td>${metrics.requests}</td>
                                <td>&lt; 50</td>
                            </tr>
                            <tr>
                                <td>Total Page Size</td>
                                <td>${this.formatBytes(metrics.totalBytes)}</td>
                                <td>&lt; 2MB</td>
                            </tr>
                        </table>
                    `}
                </div>
            `).join('')}
        </div>
    `).join('')}
    
    <script>
        function showCondition(dashboard, condition) {
            // Hide all conditions for this dashboard
            document.querySelectorAll(\`[id^="\${dashboard}-"]\`).forEach(el => {
                el.style.display = 'none';
            });
            
            // Show selected condition
            document.getElementById(\`\${dashboard}-\${condition}\`).style.display = 'block';
            
            // Update tab styles
            const tabs = event.target.parentElement.querySelectorAll('.network-tab');
            tabs.forEach(tab => tab.classList.remove('active'));
            event.target.classList.add('active');
        }
    </script>
</body>
</html>
    `;
    
    await fs.writeFile(outputPath, html);
    console.log(`Report generated: ${outputPath}`);
  }

  formatTime(ms) {
    if (ms < 1000) return Math.round(ms) + 'ms';
    return (ms / 1000).toFixed(1) + 's';
  }

  formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getScoreClass(score) {
    if (score >= 90) return 'good';
    if (score >= 50) return 'warning';
    return 'poor';
  }
}

// CLI usage
async function main() {
  const benchmark = new PerformanceBenchmark();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'run':
        console.log('Running full benchmark...');
        const results = await benchmark.runFullBenchmark();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultPath = `./performance-results-${timestamp}.json`;
        await fs.writeFile(resultPath, JSON.stringify(results, null, 2));
        await benchmark.generateReport(results);
        console.log(`Results saved to: ${resultPath}`);
        break;
        
      case 'compare':
        if (args.length < 3) {
          console.error('Usage: node performance-benchmark.js compare <before.json> <after.json>');
          process.exit(1);
        }
        console.log('Comparing results...');
        const comparison = await benchmark.compareBeforeAfter(args[1], args[2]);
        await fs.writeFile('./performance-comparison.json', JSON.stringify(comparison, null, 2));
        console.log('Comparison saved to: performance-comparison.json');
        console.log(`Total improvements: ${comparison.summary.totalImprovements}`);
        console.log(`Total regressions: ${comparison.summary.totalRegressions}`);
        break;
        
      case 'dashboard':
        if (args.length < 2) {
          console.error('Usage: node performance-benchmark.js dashboard <dashboard-name>');
          process.exit(1);
        }
        const dashboardName = args[1];
        const dashboard = DASHBOARDS.find(d => d.name.toLowerCase() === dashboardName.toLowerCase());
        if (!dashboard) {
          console.error(`Dashboard not found: ${dashboardName}`);
          process.exit(1);
        }
        console.log(`Benchmarking ${dashboard.name} dashboard...`);
        const dashboardResults = await benchmark.benchmarkDashboard(dashboard, ['WiFi', '4G', '3G']);
        console.log(JSON.stringify(dashboardResults, null, 2));
        break;
        
      default:
        console.log('Hockey Hub Performance Benchmark Tool');
        console.log('');
        console.log('Usage:');
        console.log('  node performance-benchmark.js run                    - Run full benchmark');
        console.log('  node performance-benchmark.js compare <before> <after> - Compare results');
        console.log('  node performance-benchmark.js dashboard <name>       - Test specific dashboard');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = PerformanceBenchmark;

// Run if called directly
if (require.main === module) {
  main();
}