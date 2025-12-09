const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const config = require('./visual-regression.config');

/**
 * Visual Regression Test Runner
 * 
 * This script runs visual regression tests for all Phase 2 loading components
 * and skeleton screens, comparing them against baseline images.
 */

class VisualRegressionRunner {
  constructor() {
    this.browser = null;
    this.context = null;
    this.baselineDir = path.join(__dirname, 'baseline');
    this.resultsDir = path.join(__dirname, 'results');
    this.diffDir = path.join(__dirname, 'diff');
  }

  async setup() {
    // Create directories if they don't exist
    [this.baselineDir, this.resultsDir, this.diffDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Launch browser
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Create context with viewport
    this.context = await this.browser.newContext({
      viewport: config.use.viewport,
      deviceScaleFactor: config.use.deviceScaleFactor,
    });
  }

  async runTests() {
    const results = {
      passed: [],
      failed: [],
      new: [],
      total: config.stories.length
    };

    console.log(`Running ${results.total} visual regression tests...\n`);

    for (const story of config.stories) {
      try {
        const result = await this.testStory(story);
        
        if (result.status === 'passed') {
          results.passed.push(story.name);
          console.log(`✓ ${story.name}`);
        } else if (result.status === 'failed') {
          results.failed.push({ name: story.name, diff: result.diff });
          console.log(`✗ ${story.name} - ${result.diff}% difference`);
        } else if (result.status === 'new') {
          results.new.push(story.name);
          console.log(`+ ${story.name} - New baseline created`);
        }
      } catch (error) {
        results.failed.push({ name: story.name, error: error.message });
        console.log(`✗ ${story.name} - Error: ${error.message}`);
      }
    }

    return results;
  }

  async testStory(story) {
    const page = await this.context.newPage();
    
    try {
      // Use custom test function from config
      const screenshot = await config.testStory(page, story);
      
      // File paths
      const baselinePath = path.join(this.baselineDir, `${story.id}.png`);
      const resultPath = path.join(this.resultsDir, `${story.id}.png`);
      const diffPath = path.join(this.diffDir, `${story.id}-diff.png`);
      
      // Save current screenshot
      fs.writeFileSync(resultPath, screenshot);
      
      // Check if baseline exists
      if (!fs.existsSync(baselinePath)) {
        // Create new baseline
        fs.writeFileSync(baselinePath, screenshot);
        return { status: 'new' };
      }
      
      // Compare with baseline
      const pixelmatch = require('pixelmatch');
      const { PNG } = require('pngjs');
      
      const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
      const current = PNG.sync.read(screenshot);
      
      // Check dimensions
      if (baseline.width !== current.width || baseline.height !== current.height) {
        return {
          status: 'failed',
          diff: 100,
          reason: 'Dimension mismatch'
        };
      }
      
      // Create diff image
      const diff = new PNG({ width: baseline.width, height: baseline.height });
      
      const numDiffPixels = pixelmatch(
        baseline.data,
        current.data,
        diff.data,
        baseline.width,
        baseline.height,
        { threshold: config.expect.toMatchSnapshot.threshold }
      );
      
      // Save diff image if there are differences
      if (numDiffPixels > 0) {
        fs.writeFileSync(diffPath, PNG.sync.write(diff));
      }
      
      // Check if within threshold
      const totalPixels = baseline.width * baseline.height;
      const diffPercentage = (numDiffPixels / totalPixels) * 100;
      
      if (numDiffPixels <= config.expect.toMatchSnapshot.maxDiffPixels) {
        return { status: 'passed', diff: diffPercentage };
      } else {
        return { status: 'failed', diff: diffPercentage };
      }
      
    } finally {
      await page.close();
    }
  }

  async generateReport(results) {
    const reportPath = path.join(__dirname, 'visual-regression-report.html');
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Visual Regression Test Report - Phase 2 Loading Components</title>
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
    h1 {
      color: #333;
      margin-bottom: 30px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .stat {
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat.passed { background: #d4edda; color: #155724; }
    .stat.failed { background: #f8d7da; color: #721c24; }
    .stat.new { background: #d1ecf1; color: #0c5460; }
    .stat.total { background: #e2e3e5; color: #383d41; }
    .stat h3 { margin: 0 0 10px 0; font-size: 2em; }
    .stat p { margin: 0; font-size: 0.9em; text-transform: uppercase; }
    .results {
      margin-top: 40px;
    }
    .result-item {
      margin-bottom: 20px;
      padding: 15px;
      border-radius: 4px;
      border-left: 4px solid;
    }
    .result-item.passed { border-color: #28a745; background: #f8f9fa; }
    .result-item.failed { border-color: #dc3545; background: #fff5f5; }
    .result-item.new { border-color: #17a2b8; background: #f0f8ff; }
    .images {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 15px;
    }
    .image-container {
      text-align: center;
    }
    .image-container img {
      max-width: 100%;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .image-container p {
      margin: 10px 0 0 0;
      font-size: 0.9em;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Visual Regression Test Report - Phase 2 Loading Components</h1>
    
    <div class="summary">
      <div class="stat passed">
        <h3>${results.passed.length}</h3>
        <p>Passed</p>
      </div>
      <div class="stat failed">
        <h3>${results.failed.length}</h3>
        <p>Failed</p>
      </div>
      <div class="stat new">
        <h3>${results.new.length}</h3>
        <p>New</p>
      </div>
      <div class="stat total">
        <h3>${results.total}</h3>
        <p>Total</p>
      </div>
    </div>
    
    <div class="results">
      <h2>Test Results</h2>
      
      ${results.failed.length > 0 ? `
        <h3>Failed Tests</h3>
        ${results.failed.map(test => `
          <div class="result-item failed">
            <h4>${test.name}</h4>
            ${test.error ? `<p>Error: ${test.error}</p>` : `<p>Difference: ${test.diff.toFixed(2)}%</p>`}
            ${!test.error ? `
              <div class="images">
                <div class="image-container">
                  <img src="baseline/${test.name.replace(/ /g, '-').toLowerCase()}.png" alt="Baseline">
                  <p>Baseline</p>
                </div>
                <div class="image-container">
                  <img src="results/${test.name.replace(/ /g, '-').toLowerCase()}.png" alt="Current">
                  <p>Current</p>
                </div>
                <div class="image-container">
                  <img src="diff/${test.name.replace(/ /g, '-').toLowerCase()}-diff.png" alt="Diff">
                  <p>Difference</p>
                </div>
              </div>
            ` : ''}
          </div>
        `).join('')}
      ` : ''}
      
      ${results.new.length > 0 ? `
        <h3>New Baselines</h3>
        ${results.new.map(test => `
          <div class="result-item new">
            <h4>${test}</h4>
            <p>New baseline image created</p>
          </div>
        `).join('')}
      ` : ''}
      
      ${results.passed.length > 0 ? `
        <h3>Passed Tests</h3>
        ${results.passed.map(test => `
          <div class="result-item passed">
            <h4>${test}</h4>
            <p>Visual regression test passed</p>
          </div>
        `).join('')}
      ` : ''}
    </div>
  </div>
</body>
</html>
    `;
    
    fs.writeFileSync(reportPath, html);
    console.log(`\nReport generated: ${reportPath}`);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.setup();
      const results = await this.runTests();
      await this.generateReport(results);
      
      console.log('\n=== Summary ===');
      console.log(`Passed: ${results.passed.length}`);
      console.log(`Failed: ${results.failed.length}`);
      console.log(`New: ${results.new.length}`);
      console.log(`Total: ${results.total}`);
      
      // Exit with error if tests failed
      if (results.failed.length > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.error('Error running visual regression tests:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new VisualRegressionRunner();
  runner.run();
}

module.exports = VisualRegressionRunner;