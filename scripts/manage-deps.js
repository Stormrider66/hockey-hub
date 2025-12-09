#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Commands object
const commands = {
  // Check for unused dependencies
  unused: () => {
    console.log(`${colors.blue}Checking for unused dependencies...${colors.reset}`);
    execSync('node scripts/analyze-deps.js', { stdio: 'inherit' });
  },

  // Update all dependencies to latest versions
  update: () => {
    console.log(`${colors.blue}Updating dependencies...${colors.reset}`);
    try {
      execSync('pnpm update -r --latest', { stdio: 'inherit' });
      console.log(`${colors.green}Dependencies updated successfully!${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}Failed to update dependencies${colors.reset}`);
      process.exit(1);
    }
  },

  // Check for outdated dependencies
  outdated: () => {
    console.log(`${colors.blue}Checking for outdated dependencies...${colors.reset}`);
    try {
      execSync('pnpm outdated -r', { stdio: 'inherit' });
    } catch (error) {
      // pnpm outdated exits with non-zero if there are outdated packages
      console.log(`${colors.yellow}Some packages are outdated. Run 'pnpm run deps:update' to update them.${colors.reset}`);
    }
  },

  // Audit dependencies for security vulnerabilities
  audit: () => {
    console.log(`${colors.blue}Auditing dependencies for security vulnerabilities...${colors.reset}`);
    try {
      execSync('pnpm audit', { stdio: 'inherit' });
      console.log(`${colors.green}No security vulnerabilities found!${colors.reset}`);
    } catch (error) {
      console.log(`${colors.yellow}Security vulnerabilities detected. Review the output above.${colors.reset}`);
    }
  },

  // Dedupe dependencies
  dedupe: () => {
    console.log(`${colors.blue}Deduplicating dependencies...${colors.reset}`);
    try {
      execSync('pnpm dedupe', { stdio: 'inherit' });
      console.log(`${colors.green}Dependencies deduplicated successfully!${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}Failed to deduplicate dependencies${colors.reset}`);
      process.exit(1);
    }
  },

  // Clean and reinstall dependencies
  clean: () => {
    console.log(`${colors.blue}Cleaning and reinstalling dependencies...${colors.reset}`);
    
    // Remove node_modules and lock files
    console.log('Removing node_modules directories...');
    if (process.platform === 'win32') {
      execSync('powershell -Command "Get-ChildItem -Path . -Include node_modules -Recurse -Directory | Remove-Item -Recurse -Force"', { stdio: 'inherit' });
    } else {
      execSync('find . -name "node_modules" -type d -prune -exec rm -rf {} +', { stdio: 'inherit' });
    }
    
    console.log('Removing pnpm-lock.yaml...');
    if (fs.existsSync('pnpm-lock.yaml')) {
      fs.unlinkSync('pnpm-lock.yaml');
    }
    
    // Reinstall
    console.log('Reinstalling dependencies...');
    execSync('pnpm install', { stdio: 'inherit' });
    console.log(`${colors.green}Dependencies cleaned and reinstalled successfully!${colors.reset}`);
  },

  // Check bundle size
  bundle: () => {
    console.log(`${colors.blue}Analyzing bundle size...${colors.reset}`);
    try {
      execSync('pnpm --filter frontend analyze', { stdio: 'inherit' });
    } catch (error) {
      console.error(`${colors.red}Failed to analyze bundle${colors.reset}`);
      process.exit(1);
    }
  },

  // Align versions across workspaces
  align: () => {
    console.log(`${colors.blue}Aligning dependency versions across workspaces...${colors.reset}`);
    
    const workspaces = [
      '.',
      'apps/frontend',
      'packages/shared-types',
      ...Array.from({ length: 10 }, (_, i) => `services/${['api-gateway', 'user-service', 'communication-service', 'calendar-service', 'training-service', 'medical-service', 'planning-service', 'statistics-service', 'payment-service', 'admin-service'][i]}`)
    ].filter(ws => fs.existsSync(path.join(ws, 'package.json')));

    // Collect all dependencies and their versions
    const allDeps = {};
    
    workspaces.forEach(workspace => {
      const pkgPath = path.join(workspace, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      
      ['dependencies', 'devDependencies'].forEach(depType => {
        if (pkg[depType]) {
          Object.entries(pkg[depType]).forEach(([name, version]) => {
            if (!allDeps[name]) {
              allDeps[name] = {};
            }
            if (!allDeps[name][version]) {
              allDeps[name][version] = [];
            }
            allDeps[name][version].push({ workspace, type: depType });
          });
        }
      });
    });

    // Find dependencies with multiple versions
    const misaligned = Object.entries(allDeps)
      .filter(([_, versions]) => Object.keys(versions).length > 1)
      .map(([name, versions]) => ({ name, versions }));

    if (misaligned.length === 0) {
      console.log(`${colors.green}All dependencies are aligned!${colors.reset}`);
      return;
    }

    console.log(`\n${colors.yellow}Found ${misaligned.length} misaligned dependencies:${colors.reset}\n`);
    
    misaligned.forEach(({ name, versions }) => {
      console.log(`${colors.blue}${name}:${colors.reset}`);
      Object.entries(versions).forEach(([version, locations]) => {
        console.log(`  ${version}:`);
        locations.forEach(({ workspace, type }) => {
          console.log(`    - ${workspace} (${type})`);
        });
      });
      console.log();
    });

    console.log(`${colors.yellow}To fix: Update package.json files to use consistent versions${colors.reset}`);
  }
};

// Main function
function main() {
  const command = process.argv[2];

  if (!command || !commands[command]) {
    console.log(`${colors.yellow}Hockey Hub Dependency Manager${colors.reset}\n`);
    console.log('Usage: node scripts/manage-deps.js <command>\n');
    console.log('Commands:');
    console.log('  unused   - Check for unused dependencies');
    console.log('  outdated - Check for outdated dependencies');
    console.log('  update   - Update all dependencies to latest versions');
    console.log('  audit    - Audit dependencies for security vulnerabilities');
    console.log('  dedupe   - Deduplicate dependencies');
    console.log('  clean    - Clean and reinstall all dependencies');
    console.log('  bundle   - Analyze frontend bundle size');
    console.log('  align    - Check version alignment across workspaces');
    process.exit(1);
  }

  commands[command]();
}

// Run the script
if (require.main === module) {
  main();
}