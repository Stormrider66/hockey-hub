#!/usr/bin/env node

/**
 * Bundle analyzer script with import optimization insights
 * Usage: node scripts/bundle-analyzer.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const BUILD_DIR = '.next';
const STATS_FILE = path.join(BUILD_DIR, 'webpack-stats.json');
const REPORT_FILE = 'bundle-analysis-report.json';

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeBundleChunks(buildDir) {
  const chunksDir = path.join(buildDir, 'static', 'chunks');
  if (!fs.existsSync(chunksDir)) {
    console.log('❌ Build directory not found. Run "pnpm build" first.');
    return;
  }

  const chunks = fs.readdirSync(chunksDir)
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const filePath = path.join(chunksDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        type: categorizeChunk(file)
      };
    })
    .sort((a, b) => b.size - a.size);

  return chunks;
}

function categorizeChunk(filename) {
  if (filename.includes('framework-')) return 'Framework';
  if (filename.includes('main-')) return 'Main Bundle';
  if (filename.includes('vendor-') || filename.includes('lib-')) return 'Vendor';
  if (filename.includes('page-')) return 'Page';
  if (filename.match(/^\d+\./)) return 'Dynamic Import';
  return 'Other';
}

function analyzeLibraryImpact() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const heavyLibraries = {
    'moment': { size: '67KB', recommendation: 'Replace with date-fns (~13KB)' },
    'lodash': { size: '71KB', recommendation: 'Use lodash-es with specific imports' },
    '@mui/material': { size: '325KB', recommendation: 'Use specific component imports' },
    'react-big-calendar': { size: '45KB', recommendation: 'Consider lighter alternatives' },
    'recharts': { size: '156KB', recommendation: 'Use dynamic imports for charts' },
    'framer-motion': { size: '52KB', recommendation: 'Use dynamic imports for animations' }
  };

  const detectedLibraries = Object.keys(dependencies)
    .filter(dep => heavyLibraries[dep])
    .map(dep => ({
      name: dep,
      version: dependencies[dep],
      ...heavyLibraries[dep]
    }));

  return detectedLibraries;
}

function generateOptimizationSuggestions(chunks, libraries) {
  const suggestions = [];

  // Large chunks suggestions
  const largeChunks = chunks.filter(chunk => chunk.size > 100 * 1024); // > 100KB
  if (largeChunks.length > 0) {
    suggestions.push({
      type: 'large-chunks',
      message: `Found ${largeChunks.length} large chunks (>100KB)`,
      items: largeChunks.map(chunk => `${chunk.name}: ${formatBytes(chunk.size)}`),
      recommendation: 'Consider code splitting or dynamic imports'
    });
  }

  // Library suggestions
  if (libraries.length > 0) {
    suggestions.push({
      type: 'heavy-libraries',
      message: `Found ${libraries.length} heavy libraries`,
      items: libraries.map(lib => `${lib.name}: ${lib.size} - ${lib.recommendation}`),
      recommendation: 'Optimize import patterns for these libraries'
    });
  }

  // Vendor chunk size
  const vendorChunks = chunks.filter(chunk => chunk.type === 'Vendor');
  const vendorSize = vendorChunks.reduce((total, chunk) => total + chunk.size, 0);
  if (vendorSize > 500 * 1024) { // > 500KB
    suggestions.push({
      type: 'vendor-optimization',
      message: `Vendor chunks total ${formatBytes(vendorSize)}`,
      recommendation: 'Consider splitting vendor chunks further'
    });
  }

  return suggestions;
}

function printReport(chunks, libraries, suggestions) {
  console.log('\n📊 Bundle Analysis Report\n');
  console.log('='.repeat(50));

  // Summary
  const totalSize = chunks.reduce((total, chunk) => total + chunk.size, 0);
  console.log(`\n📦 Total Bundle Size: ${formatBytes(totalSize)}\n`);

  // Top 10 largest chunks
  console.log('🔍 Largest Chunks:');
  chunks.slice(0, 10).forEach((chunk, index) => {
    console.log(`  ${index + 1}. ${chunk.name.substring(0, 40).padEnd(40)} ${formatBytes(chunk.size).padStart(8)} (${chunk.type})`);
  });

  // Chunk types breakdown
  console.log('\n📋 Chunk Types:');
  const typeBreakdown = chunks.reduce((acc, chunk) => {
    acc[chunk.type] = (acc[chunk.type] || 0) + chunk.size;
    return acc;
  }, {});
  
  Object.entries(typeBreakdown)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, size]) => {
      console.log(`  ${type.padEnd(20)} ${formatBytes(size).padStart(8)}`);
    });

  // Heavy libraries
  if (libraries.length > 0) {
    console.log('\n🏋️  Heavy Libraries Detected:');
    libraries.forEach(lib => {
      console.log(`  📚 ${lib.name}@${lib.version}`);
      console.log(`     Size: ${lib.size}`);
      console.log(`     💡 ${lib.recommendation}`);
    });
  }

  // Optimization suggestions
  if (suggestions.length > 0) {
    console.log('\n💡 Optimization Suggestions:');
    suggestions.forEach((suggestion, index) => {
      console.log(`\n  ${index + 1}. ${suggestion.message}`);
      if (suggestion.items) {
        suggestion.items.forEach(item => {
          console.log(`     • ${item}`);
        });
      }
      console.log(`     🔧 ${suggestion.recommendation}`);
    });
  }

  // Import optimization recommendations
  console.log('\n🚀 Import Optimization Actions:');
  console.log('  1. Run: pnpm optimize-imports --analyze');
  console.log('  2. Fix issues: pnpm optimize-imports:fix');
  console.log('  3. Use dynamic imports for heavy components');
  console.log('  4. Enable tree shaking in webpack config');
  console.log('  5. Consider library alternatives for large dependencies');

  console.log('\n='.repeat(50));
}

function saveReport(chunks, libraries, suggestions) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalChunks: chunks.length,
      totalSize: chunks.reduce((total, chunk) => total + chunk.size, 0),
      largestChunk: chunks[0],
      smallestChunk: chunks[chunks.length - 1]
    },
    chunks: chunks.slice(0, 20), // Top 20 chunks
    libraries,
    suggestions,
    recommendations: [
      'Use specific imports instead of barrel imports',
      'Replace moment.js with date-fns',
      'Use lodash-es with specific function imports',
      'Implement dynamic imports for heavy components',
      'Enable Next.js optimizePackageImports feature'
    ]
  };

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`\n💾 Detailed report saved to: ${REPORT_FILE}`);
}

// Main execution
function main() {
  console.log('🔍 Analyzing bundle...\n');

  try {
    // Check if build exists
    if (!fs.existsSync(BUILD_DIR)) {
      console.log('❌ No build found. Running build...');
      execSync('pnpm build', { stdio: 'inherit' });
    }

    // Analyze chunks
    const chunks = analyzeBundleChunks(BUILD_DIR);
    if (!chunks || chunks.length === 0) {
      console.log('❌ No chunks found in build directory');
      return;
    }

    // Analyze libraries
    const libraries = analyzeLibraryImpact();

    // Generate suggestions
    const suggestions = generateOptimizationSuggestions(chunks, libraries);

    // Print and save report
    printReport(chunks, libraries, suggestions);
    saveReport(chunks, libraries, suggestions);

    // Open bundle analyzer if requested
    if (process.argv.includes('--open')) {
      console.log('\n🌐 Opening bundle analyzer...');
      execSync('pnpm analyze', { stdio: 'inherit' });
    }

  } catch (error) {
    console.error('❌ Error analyzing bundle:', error.message);
    process.exit(1);
  }
}

// CLI help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Bundle Analyzer with Import Optimization

Usage:
  node scripts/bundle-analyzer.js [options]

Options:
  --open    Open the interactive bundle analyzer
  --help    Show this help message

Examples:
  node scripts/bundle-analyzer.js
  node scripts/bundle-analyzer.js --open
  
The script will:
1. Analyze your current bundle
2. Identify heavy libraries
3. Suggest import optimizations
4. Generate a detailed report
  `);
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = {
  analyzeBundleChunks,
  analyzeLibraryImpact,
  generateOptimizationSuggestions
};