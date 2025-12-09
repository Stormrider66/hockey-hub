const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

// Configuration
const BUNDLE_SIZE_LIMIT = 1024 * 1024; // 1MB
const CHUNK_SIZE_LIMIT = 500 * 1024; // 500KB
const CRITICAL_METRICS_THRESHOLD = {
  'First Load JS': 100 * 1024, // 100KB
  'Initial Bundle': 300 * 1024, // 300KB
};

class BundleSizeAnalyzer {
  constructor() {
    this.results = {
      totalSize: 0,
      chunks: [],
      largeChunks: [],
      criticalMetrics: {},
      optimizationSuggestions: [],
    };
  }

  async analyze() {
    console.log(`${colors.cyan}🔍 Analyzing bundle sizes...${colors.reset}\n`);

    try {
      // Build the project first
      console.log(`${colors.yellow}Building project...${colors.reset}`);
      execSync('pnpm build', { stdio: 'inherit' });

      // Analyze the build output
      const buildPath = path.join(__dirname, '../.next');
      await this.analyzeBuildOutput(buildPath);

      // Generate report
      this.generateReport();

      // Check thresholds
      this.checkThresholds();

    } catch (error) {
      console.error(`${colors.red}Error analyzing bundle:${colors.reset}`, error);
      process.exit(1);
    }
  }

  async analyzeBuildOutput(buildPath) {
    const statsPath = path.join(buildPath, 'build-stats.json');
    
    // Generate webpack stats if not available
    if (!fs.existsSync(statsPath)) {
      console.log(`${colors.yellow}Generating webpack stats...${colors.reset}`);
      this.generateWebpackStats();
    }

    // Read static chunks
    const staticPath = path.join(buildPath, 'static/chunks');
    if (fs.existsSync(staticPath)) {
      this.analyzeChunks(staticPath);
    }

    // Analyze pages
    const pagesPath = path.join(buildPath, 'static/chunks/pages');
    if (fs.existsSync(pagesPath)) {
      this.analyzePages(pagesPath);
    }

    // Analyze app directory chunks
    const appPath = path.join(buildPath, 'static/chunks/app');
    if (fs.existsSync(appPath)) {
      this.analyzeAppChunks(appPath);
    }
  }

  analyzeChunks(chunksPath) {
    const files = fs.readdirSync(chunksPath);
    
    files.forEach(file => {
      if (file.endsWith('.js')) {
        const filePath = path.join(chunksPath, file);
        const stats = fs.statSync(filePath);
        const size = stats.size;

        this.results.chunks.push({
          name: file,
          size: size,
          sizeFormatted: this.formatSize(size),
          type: this.getChunkType(file),
        });

        this.results.totalSize += size;

        if (size > CHUNK_SIZE_LIMIT) {
          this.results.largeChunks.push({
            name: file,
            size: size,
            sizeFormatted: this.formatSize(size),
            excess: size - CHUNK_SIZE_LIMIT,
            excessFormatted: this.formatSize(size - CHUNK_SIZE_LIMIT),
          });
        }
      }
    });
  }

  analyzePages(pagesPath) {
    const pages = fs.readdirSync(pagesPath);
    
    pages.forEach(page => {
      const pagePath = path.join(pagesPath, page);
      const stats = fs.statSync(pagePath);
      
      if (stats.isFile() && page.endsWith('.js')) {
        const size = stats.size;
        this.results.chunks.push({
          name: `pages/${page}`,
          size: size,
          sizeFormatted: this.formatSize(size),
          type: 'page',
        });
      }
    });
  }

  analyzeAppChunks(appPath) {
    const walkDir = (dir, prefix = '') => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          walkDir(filePath, `${prefix}${file}/`);
        } else if (file.endsWith('.js')) {
          const size = stats.size;
          this.results.chunks.push({
            name: `app/${prefix}${file}`,
            size: size,
            sizeFormatted: this.formatSize(size),
            type: 'app',
          });
        }
      });
    };

    walkDir(appPath);
  }

  getChunkType(filename) {
    if (filename.includes('framework')) return 'framework';
    if (filename.includes('main')) return 'main';
    if (filename.includes('webpack')) return 'webpack';
    if (filename.includes('polyfill')) return 'polyfill';
    if (/^[0-9a-f]+\./.test(filename)) return 'vendor';
    return 'other';
  }

  generateWebpackStats() {
    // This would typically be done during build with webpack config
    console.log(`${colors.yellow}Note: For detailed webpack stats, add BundleAnalyzerPlugin to next.config.js${colors.reset}`);
  }

  generateReport() {
    console.log(`\n${colors.bright}📊 Bundle Size Analysis Report${colors.reset}`);
    console.log('═'.repeat(50));

    // Total size
    console.log(`\n${colors.cyan}Total Bundle Size:${colors.reset} ${this.formatSize(this.results.totalSize)}`);

    // Chunk breakdown by type
    const chunksByType = this.groupChunksByType();
    console.log(`\n${colors.cyan}Chunks by Type:${colors.reset}`);
    Object.entries(chunksByType).forEach(([type, chunks]) => {
      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
      console.log(`  ${type}: ${this.formatSize(totalSize)} (${chunks.length} chunks)`);
    });

    // Large chunks warning
    if (this.results.largeChunks.length > 0) {
      console.log(`\n${colors.red}⚠️  Large Chunks Detected:${colors.reset}`);
      this.results.largeChunks.forEach(chunk => {
        console.log(`  - ${chunk.name}: ${chunk.sizeFormatted} (${chunk.excessFormatted} over limit)`);
      });
    }

    // Top 10 largest chunks
    console.log(`\n${colors.cyan}Top 10 Largest Chunks:${colors.reset}`);
    const sortedChunks = [...this.results.chunks].sort((a, b) => b.size - a.size).slice(0, 10);
    sortedChunks.forEach((chunk, index) => {
      const indicator = chunk.size > CHUNK_SIZE_LIMIT ? '❌' : '✅';
      console.log(`  ${index + 1}. ${indicator} ${chunk.name}: ${chunk.sizeFormatted}`);
    });

    // Optimization suggestions
    this.generateOptimizationSuggestions();
    if (this.results.optimizationSuggestions.length > 0) {
      console.log(`\n${colors.yellow}💡 Optimization Suggestions:${colors.reset}`);
      this.results.optimizationSuggestions.forEach(suggestion => {
        console.log(`  • ${suggestion}`);
      });
    }
  }

  groupChunksByType() {
    const grouped = {};
    this.results.chunks.forEach(chunk => {
      if (!grouped[chunk.type]) {
        grouped[chunk.type] = [];
      }
      grouped[chunk.type].push(chunk);
    });
    return grouped;
  }

  generateOptimizationSuggestions() {
    const suggestions = [];

    // Check for large vendor chunks
    const vendorChunks = this.results.chunks.filter(c => c.type === 'vendor');
    const largeVendorChunks = vendorChunks.filter(c => c.size > 200 * 1024);
    if (largeVendorChunks.length > 0) {
      suggestions.push('Consider splitting large vendor chunks or using dynamic imports for heavy libraries');
    }

    // Check for duplicate code
    const chunkNames = this.results.chunks.map(c => c.name);
    const duplicatePatterns = this.findDuplicatePatterns(chunkNames);
    if (duplicatePatterns.length > 0) {
      suggestions.push('Potential duplicate code detected. Review shared dependencies');
    }

    // Check total size
    if (this.results.totalSize > 5 * 1024 * 1024) {
      suggestions.push('Total bundle size exceeds 5MB. Consider aggressive code splitting');
    }

    // Check for unoptimized images
    const hasLargeAssets = this.results.chunks.some(c => 
      c.name.includes('image') && c.size > 100 * 1024
    );
    if (hasLargeAssets) {
      suggestions.push('Large image assets detected. Ensure images are optimized and using next/image');
    }

    // Framework size check
    const frameworkChunks = this.results.chunks.filter(c => c.type === 'framework');
    const frameworkSize = frameworkChunks.reduce((sum, c) => sum + c.size, 0);
    if (frameworkSize > 150 * 1024) {
      suggestions.push('Framework bundle is large. Check for unnecessary React/Next.js features');
    }

    this.results.optimizationSuggestions = suggestions;
  }

  findDuplicatePatterns(names) {
    const patterns = {};
    names.forEach(name => {
      const base = name.replace(/\.[0-9a-f]+\./, '.').replace(/\.js$/, '');
      patterns[base] = (patterns[base] || 0) + 1;
    });
    return Object.entries(patterns)
      .filter(([_, count]) => count > 1)
      .map(([pattern]) => pattern);
  }

  checkThresholds() {
    console.log(`\n${colors.cyan}Threshold Checks:${colors.reset}`);
    
    let failed = false;

    // Check total size
    if (this.results.totalSize > BUNDLE_SIZE_LIMIT * 5) {
      console.log(`${colors.red}❌ Total bundle size exceeds limit: ${this.formatSize(this.results.totalSize)} > ${this.formatSize(BUNDLE_SIZE_LIMIT * 5)}${colors.reset}`);
      failed = true;
    } else {
      console.log(`${colors.green}✅ Total bundle size within limit: ${this.formatSize(this.results.totalSize)}${colors.reset}`);
    }

    // Check large chunks
    if (this.results.largeChunks.length > 0) {
      console.log(`${colors.red}❌ ${this.results.largeChunks.length} chunks exceed size limit${colors.reset}`);
      failed = true;
    } else {
      console.log(`${colors.green}✅ All chunks within size limit${colors.reset}`);
    }

    // Check critical metrics
    const mainChunk = this.results.chunks.find(c => c.name.includes('main'));
    if (mainChunk && mainChunk.size > CRITICAL_METRICS_THRESHOLD['First Load JS']) {
      console.log(`${colors.red}❌ Main chunk too large: ${mainChunk.sizeFormatted} > ${this.formatSize(CRITICAL_METRICS_THRESHOLD['First Load JS'])}${colors.reset}`);
      failed = true;
    } else {
      console.log(`${colors.green}✅ Main chunk size acceptable${colors.reset}`);
    }

    if (failed) {
      console.log(`\n${colors.red}Bundle size checks failed!${colors.reset}`);
      process.exit(1);
    } else {
      console.log(`\n${colors.green}All bundle size checks passed!${colors.reset}`);
    }
  }

  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  // Export results for CI/CD integration
  exportResults() {
    const reportPath = path.join(__dirname, '../bundle-analysis.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n${colors.cyan}Report exported to: ${reportPath}${colors.reset}`);
  }
}

// Run the analyzer
const analyzer = new BundleSizeAnalyzer();
analyzer.analyze().then(() => {
  analyzer.exportResults();
}).catch(error => {
  console.error(`${colors.red}Analysis failed:${colors.reset}`, error);
  process.exit(1);
});