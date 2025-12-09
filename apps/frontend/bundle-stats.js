/**
 * Bundle Stats Tracker
 * 
 * This script analyzes and tracks bundle sizes over time for the Hockey Hub frontend.
 * Run after building to generate a report of bundle sizes.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Get size of a directory recursively
async function getDirectorySize(dir) {
  const files = await readdir(dir, { withFileTypes: true });
  let total = 0;

  for (const file of files) {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory()) {
      total += await getDirectorySize(filePath);
    } else {
      const stats = await stat(filePath);
      total += stats.size;
    }
  }

  return total;
}

// Format bytes to human-readable size
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get build info from Next.js build output
async function getBuildInfo() {
  const buildDir = path.join(__dirname, '.next');
  const staticDir = path.join(buildDir, 'static');
  
  if (!fs.existsSync(buildDir)) {
    console.error(`${colors.red}Error: .next directory not found. Please run 'pnpm build' first.${colors.reset}`);
    process.exit(1);
  }

  const info = {
    timestamp: new Date().toISOString(),
    totalSize: 0,
    chunks: {},
    pages: {},
  };

  // Get total build size
  info.totalSize = await getDirectorySize(buildDir);

  // Analyze chunks
  const chunksDir = path.join(staticDir, 'chunks');
  if (fs.existsSync(chunksDir)) {
    const chunkFiles = await readdir(chunksDir);
    
    for (const file of chunkFiles) {
      if (file.endsWith('.js')) {
        const filePath = path.join(chunksDir, file);
        const stats = await stat(filePath);
        info.chunks[file] = {
          size: stats.size,
          formattedSize: formatBytes(stats.size),
        };
      }
    }
  }

  // Analyze app chunks
  const appChunksDir = path.join(chunksDir, 'app');
  if (fs.existsSync(appChunksDir)) {
    const appFiles = await readdir(appChunksDir, { withFileTypes: true });
    
    for (const file of appFiles) {
      if (!file.isDirectory() && file.name.endsWith('.js')) {
        const filePath = path.join(appChunksDir, file.name);
        const stats = await stat(filePath);
        info.pages[`app/${file.name}`] = {
          size: stats.size,
          formattedSize: formatBytes(stats.size),
        };
      }
    }
  }

  return info;
}

// Save stats to history file
function saveStats(info) {
  const historyFile = path.join(__dirname, 'bundle-stats-history.json');
  let history = [];

  if (fs.existsSync(historyFile)) {
    const content = fs.readFileSync(historyFile, 'utf8');
    history = JSON.parse(content);
  }

  history.push(info);

  // Keep only last 50 builds
  if (history.length > 50) {
    history = history.slice(-50);
  }

  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

// Display bundle stats
function displayStats(info) {
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}     Hockey Hub Bundle Size Report         ${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);

  console.log(`${colors.cyan}Build Date:${colors.reset} ${new Date(info.timestamp).toLocaleString()}`);
  console.log(`${colors.cyan}Total Build Size:${colors.reset} ${colors.bright}${formatBytes(info.totalSize)}${colors.reset}\n`);

  // Sort chunks by size
  const sortedChunks = Object.entries(info.chunks)
    .sort(([, a], [, b]) => b.size - a.size)
    .slice(0, 10); // Top 10 chunks

  if (sortedChunks.length > 0) {
    console.log(`${colors.bright}${colors.yellow}Top JavaScript Chunks:${colors.reset}`);
    console.log(`${colors.bright}${'─'.repeat(45)}${colors.reset}`);
    
    for (const [name, data] of sortedChunks) {
      const shortName = name.length > 30 ? name.substring(0, 27) + '...' : name;
      console.log(`  ${shortName.padEnd(35)} ${data.formattedSize.padStart(10)}`);
    }
    console.log();
  }

  // Sort pages by size
  const sortedPages = Object.entries(info.pages)
    .sort(([, a], [, b]) => b.size - a.size)
    .slice(0, 10); // Top 10 pages

  if (sortedPages.length > 0) {
    console.log(`${colors.bright}${colors.yellow}Page Bundles:${colors.reset}`);
    console.log(`${colors.bright}${'─'.repeat(45)}${colors.reset}`);
    
    for (const [name, data] of sortedPages) {
      const shortName = name.length > 30 ? name.substring(0, 27) + '...' : name;
      console.log(`  ${shortName.padEnd(35)} ${data.formattedSize.padStart(10)}`);
    }
  }

  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);
}

// Compare with previous build
function compareWithPrevious(current) {
  const historyFile = path.join(__dirname, 'bundle-stats-history.json');
  
  if (!fs.existsSync(historyFile)) {
    return;
  }

  const content = fs.readFileSync(historyFile, 'utf8');
  const history = JSON.parse(content);
  
  if (history.length < 2) {
    return;
  }

  const previous = history[history.length - 2];
  const sizeDiff = current.totalSize - previous.totalSize;
  const percentChange = ((sizeDiff / previous.totalSize) * 100).toFixed(2);

  console.log(`${colors.bright}${colors.cyan}Comparison with Previous Build:${colors.reset}`);
  console.log(`${colors.bright}${'─'.repeat(45)}${colors.reset}`);
  console.log(`  Previous: ${formatBytes(previous.totalSize)}`);
  console.log(`  Current:  ${formatBytes(current.totalSize)}`);
  
  if (sizeDiff > 0) {
    console.log(`  Change:   ${colors.red}+${formatBytes(sizeDiff)} (+${percentChange}%)${colors.reset}`);
  } else if (sizeDiff < 0) {
    console.log(`  Change:   ${colors.green}${formatBytes(sizeDiff)} (${percentChange}%)${colors.reset}`);
  } else {
    console.log(`  Change:   No change`);
  }
  
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);
}

// Main function
async function main() {
  try {
    console.log(`${colors.cyan}Analyzing bundle sizes...${colors.reset}`);
    
    const info = await getBuildInfo();
    displayStats(info);
    compareWithPrevious(info);
    saveStats(info);
    
    console.log(`${colors.green}✓ Bundle stats saved to bundle-stats-history.json${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}Error analyzing bundle:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the analysis
main();