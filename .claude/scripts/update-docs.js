#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DocumentationUpdater {
  constructor(options = {}) {
    this.options = {
      dryRun: options.dryRun || false,
      verbose: options.verbose || false,
      autoCommit: options.autoCommit || false,
      ...options
    };
    
    this.changes = [];
    this.updates = [];
    this.projectRoot = this.findProjectRoot();
  }

  findProjectRoot() {
    let dir = process.cwd();
    while (dir !== path.dirname(dir)) {
      if (fs.existsSync(path.join(dir, '.git'))) {
        return dir;
      }
      dir = path.dirname(dir);
    }
    return process.cwd();
  }

  async run() {
    console.log('🔍 Scanning for recent changes...');
    this.detectChanges();
    
    console.log('📚 Finding documentation files...');
    const docs = this.findDocumentationFiles();
    
    console.log('📝 Analyzing updates needed...');
    this.analyzeUpdates(docs);
    
    if (this.options.dryRun) {
      console.log('\n🔍 DRY RUN - No files will be modified');
      this.showPlannedUpdates();
      return;
    }
    
    console.log('✏️  Updating documentation...');
    await this.applyUpdates();
    
    if (this.options.autoCommit && this.updates.length > 0) {
      console.log('📦 Committing documentation updates...');
      this.commitChanges();
    }
    
    console.log('✅ Documentation update complete!');
  }

  detectChanges() {
    try {
      // Get changed files in the last commit
      const changedFiles = execSync('git diff --name-only HEAD~1 HEAD', {
        cwd: this.projectRoot,
        encoding: 'utf8'
      }).trim().split('\n').filter(Boolean);
      
      // Categorize changes
      changedFiles.forEach(file => {
        const change = this.categorizeChange(file);
        if (change) this.changes.push(change);
      });
      
      if (this.options.verbose) {
        console.log(`Found ${this.changes.length} relevant changes`);
      }
    } catch (error) {
      console.log('No previous commits found, analyzing all files...');
      this.analyzeAllFiles();
    }
  }

  categorizeChange(filePath) {
    const ext = path.extname(filePath);
    const dir = path.dirname(filePath);
    
    // Skip non-relevant files
    if (['.md', '.json', '.lock', '.log'].includes(ext)) return null;
    
    return {
      file: filePath,
      type: this.getChangeType(filePath),
      component: this.extractComponentName(filePath),
      service: this.extractServiceName(filePath),
      feature: this.extractFeatureName(filePath)
    };
  }

  getChangeType(filePath) {
    if (filePath.includes('/api/') || filePath.includes('/routes/')) return 'api';
    if (filePath.includes('/components/')) return 'component';
    if (filePath.includes('/features/')) return 'feature';
    if (filePath.includes('/services/')) return 'service';
    if (filePath.includes('/hooks/')) return 'hook';
    if (filePath.includes('/utils/')) return 'utility';
    if (filePath.includes('.test.') || filePath.includes('.spec.')) return 'test';
    return 'other';
  }

  extractComponentName(filePath) {
    const match = filePath.match(/components\/([^/]+)/);
    return match ? match[1] : null;
  }

  extractServiceName(filePath) {
    const match = filePath.match(/services\/([^/]+)/);
    return match ? match[1] : null;
  }

  extractFeatureName(filePath) {
    const match = filePath.match(/features\/([^/]+)/);
    return match ? match[1] : null;
  }

  findDocumentationFiles() {
    const files = [];
    const ignoreDirs = ['node_modules', '.next', 'dist', 'build', '.git'];
    
    // Helper function to recursively find files
    const findFiles = (dir, pattern) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          // Skip ignored directories
          if (!ignoreDirs.includes(item)) {
            findFiles(fullPath, pattern);
          }
        } else if (stats.isFile() && pattern.test(item)) {
          files.push(fullPath);
        }
      }
    };
    
    // Find all markdown files
    findFiles(this.projectRoot, /\.(md|MD)$/);
    
    // Also check specific files in root
    const specificFiles = ['CLAUDE.md', 'README.md'];
    specificFiles.forEach(file => {
      const fullPath = path.join(this.projectRoot, file);
      if (fs.existsSync(fullPath) && !files.includes(fullPath)) {
        files.push(fullPath);
      }
    });
    
    return files.filter(file => {
      const relativePath = path.relative(this.projectRoot, file);
      // Include files matching our patterns
      return relativePath.includes('README') ||
             relativePath.includes('DOCUMENTATION') ||
             relativePath.includes('docs/') ||
             relativePath.includes('GUIDE') ||
             relativePath.includes('FEATURES') ||
             relativePath.includes('TECHNICAL') ||
             relativePath === 'CLAUDE.md';
    });
  }

  analyzeUpdates(docs) {
    docs.forEach(docPath => {
      const updates = this.getUpdatesForDoc(docPath);
      if (updates.length > 0) {
        this.updates.push({
          file: docPath,
          updates: updates
        });
      }
    });
  }

  getUpdatesForDoc(docPath) {
    const updates = [];
    const docName = path.basename(docPath);
    const content = fs.readFileSync(docPath, 'utf8');
    
    // Check for specific documentation types
    if (docName === 'CLAUDE.md') {
      updates.push(...this.getClaudeUpdates(content));
    } else if (docName.includes('README')) {
      updates.push(...this.getReadmeUpdates(content, docPath));
    } else if (docPath.includes('/docs/')) {
      updates.push(...this.getTechnicalDocUpdates(content, docPath));
    }
    
    return updates;
  }

  getClaudeUpdates(content) {
    const updates = [];
    const now = new Date();
    const currentMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Update recent changes section
    if (this.changes.length > 0) {
      const recentUpdates = this.formatRecentUpdates();
      updates.push({
        type: 'recent-updates',
        section: '🏥 Recent Updates',
        content: recentUpdates,
        marker: `### .*Recent Updates.*\\(${currentMonth}\\)`
      });
    }
    
    // Update metrics
    const metrics = this.gatherMetrics();
    if (metrics) {
      updates.push({
        type: 'metrics',
        section: '📈 Project Metrics',
        content: this.formatMetrics(metrics),
        marker: '## 📈 Project Metrics'
      });
    }
    
    // Update file modification list
    if (this.changes.length > 0) {
      updates.push({
        type: 'files-modified',
        section: 'Files Modified',
        content: this.formatModifiedFiles(),
        marker: '\\*\\*Files Modified\\*\\*:'
      });
    }
    
    return updates;
  }

  getReadmeUpdates(content, docPath) {
    const updates = [];
    
    // Update feature list if components changed
    const componentChanges = this.changes.filter(c => c.type === 'component');
    if (componentChanges.length > 0) {
      updates.push({
        type: 'features',
        section: 'Features',
        content: this.updateFeatureList(content, componentChanges)
      });
    }
    
    // Update API documentation if routes changed
    const apiChanges = this.changes.filter(c => c.type === 'api');
    if (apiChanges.length > 0) {
      updates.push({
        type: 'api',
        section: 'API Endpoints',
        content: this.updateApiDocs(content, apiChanges)
      });
    }
    
    return updates;
  }

  getTechnicalDocUpdates(content, docPath) {
    const updates = [];
    
    // Update test coverage if tests changed
    const testChanges = this.changes.filter(c => c.type === 'test');
    if (testChanges.length > 0 && docPath.includes('test-coverage')) {
      updates.push({
        type: 'coverage',
        section: 'Test Coverage',
        content: this.updateTestCoverage()
      });
    }
    
    return updates;
  }

  formatRecentUpdates() {
    const grouped = {};
    
    // Group changes by feature
    this.changes.forEach(change => {
      const key = change.feature || change.service || 'general';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(change);
    });
    
    let updates = `### 🏥 Recent Updates (${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})\n\n`;
    
    Object.entries(grouped).forEach(([feature, changes]) => {
      updates += `**${this.formatFeatureName(feature)}**:\n`;
      changes.forEach(change => {
        updates += `- ${this.describeChange(change)}\n`;
      });
      updates += '\n';
    });
    
    return updates;
  }

  formatFeatureName(name) {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  describeChange(change) {
    const descriptions = {
      'component': `Updated ${change.component} component`,
      'api': `Modified API endpoint in ${change.file}`,
      'service': `Enhanced ${change.service} service`,
      'feature': `Improved ${change.feature} feature`,
      'hook': `Updated React hook in ${change.file}`,
      'utility': `Enhanced utility function in ${change.file}`,
      'test': `Added/updated tests for ${path.basename(change.file)}`,
      'other': `Modified ${path.basename(change.file)}`
    };
    
    return descriptions[change.type] || `Updated ${change.file}`;
  }

  gatherMetrics() {
    try {
      // Get test coverage
      const coverage = this.getTestCoverage();
      
      // Count TypeScript 'any' usage
      const anyCount = this.countTypeScriptAny();
      
      // Get file counts
      const fileCounts = this.getFileCounts();
      
      return {
        coverage,
        anyCount,
        ...fileCounts
      };
    } catch (error) {
      if (this.options.verbose) {
        console.error('Error gathering metrics:', error);
      }
      return null;
    }
  }

  getTestCoverage() {
    // Look for coverage report
    const coveragePath = path.join(this.projectRoot, 'coverage/coverage-summary.json');
    if (fs.existsSync(coveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      return coverage.total.lines.pct;
    }
    return null;
  }

  countTypeScriptAny() {
    try {
      const result = execSync(
        'grep -r "any" --include="*.ts" --include="*.tsx" . | wc -l',
        { cwd: this.projectRoot, encoding: 'utf8' }
      ).trim();
      return parseInt(result);
    } catch {
      return null;
    }
  }

  getFileCounts() {
    const counts = {
      components: 0,
      tests: 0,
      services: 0
    };
    
    try {
      // Count components
      const countFiles = (dir, pattern) => {
        if (!fs.existsSync(dir)) return 0;
        let count = 0;
        
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stats = fs.statSync(fullPath);
          
          if (stats.isDirectory() && !['node_modules', '.next', 'dist'].includes(item)) {
            count += countFiles(fullPath, pattern);
          } else if (stats.isFile() && pattern.test(item)) {
            count++;
          }
        }
        return count;
      };
      
      counts.components = countFiles(this.projectRoot, /\.tsx$/);
      counts.tests = countFiles(this.projectRoot, /\.(test|spec)\.(ts|tsx|js|jsx)$/);
      
      // Count services
      const servicesDir = path.join(this.projectRoot, 'services');
      if (fs.existsSync(servicesDir)) {
        const services = fs.readdirSync(servicesDir).filter(item => {
          const itemPath = path.join(servicesDir, item);
          return fs.statSync(itemPath).isDirectory() && 
                 fs.existsSync(path.join(itemPath, 'package.json'));
        });
        counts.services = services.length;
      }
    } catch (error) {
      // Ignore errors
    }
    
    return counts;
  }

  formatMetrics(metrics) {
    let table = '| Metric | Value | Status |\n';
    table += '|--------|-------|--------|\n';
    
    if (metrics.coverage !== null) {
      const coverageStatus = metrics.coverage >= 80 ? '✅ Exceeds target' : '⚠️ Below target';
      table += `| **Code Coverage** | ${metrics.coverage.toFixed(1)}% | ${coverageStatus} |\n`;
    }
    
    if (metrics.anyCount !== null) {
      const anyStatus = metrics.anyCount < 600 ? '✅ Improved' : '⚠️ Needs work';
      table += `| **TypeScript Safety** | ${metrics.anyCount} any types | ${anyStatus} |\n`;
    }
    
    if (metrics.components > 0) {
      table += `| **Components** | ${metrics.components} | ✅ Complete |\n`;
    }
    
    if (metrics.tests > 0) {
      table += `| **Tests** | ${metrics.tests}+ | ✅ Comprehensive |\n`;
    }
    
    return table;
  }

  formatModifiedFiles() {
    const files = this.changes.map(c => `- \`${c.file}\``).join('\n');
    return `**Files Modified**:\n${files}`;
  }

  showPlannedUpdates() {
    console.log('\n📋 Planned Updates:\n');
    
    this.updates.forEach(update => {
      console.log(`📄 ${path.relative(this.projectRoot, update.file)}`);
      update.updates.forEach(u => {
        console.log(`   - Update ${u.section}`);
      });
    });
  }

  async applyUpdates() {
    for (const update of this.updates) {
      await this.updateFile(update);
    }
  }

  async updateFile(update) {
    const relativePath = path.relative(this.projectRoot, update.file);
    console.log(`   Updating ${relativePath}...`);
    
    let content = fs.readFileSync(update.file, 'utf8');
    let modified = false;
    
    for (const u of update.updates) {
      const newContent = this.applyUpdate(content, u);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(update.file, content);
      console.log(`   ✅ Updated ${relativePath}`);
    } else {
      console.log(`   ⏭️  No changes needed for ${relativePath}`);
    }
  }

  applyUpdate(content, update) {
    // Find the section to update
    if (update.marker) {
      const regex = new RegExp(update.marker, 'gm');
      const match = content.match(regex);
      
      if (match) {
        // Replace the section content
        const sectionStart = content.indexOf(match[0]);
        const nextSection = content.indexOf('\n## ', sectionStart + 1);
        const sectionEnd = nextSection === -1 ? content.length : nextSection;
        
        const before = content.substring(0, sectionStart);
        const after = content.substring(sectionEnd);
        
        return before + update.content + after;
      }
    }
    
    // If no marker or match, append to end
    return content + '\n\n' + update.content;
  }

  commitChanges() {
    try {
      execSync('git add -A', { cwd: this.projectRoot });
      
      const message = `📚 Auto-update documentation

Updated ${this.updates.length} documentation files based on recent changes:
${this.updates.map(u => `- ${path.basename(u.file)}`).join('\n')}

Changes detected in:
${this.changes.map(c => `- ${c.file}`).join('\n')}`;
      
      execSync(`git commit -m "${message}"`, { cwd: this.projectRoot });
      console.log('✅ Changes committed successfully');
    } catch (error) {
      console.error('❌ Failed to commit changes:', error.message);
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose'),
  autoCommit: args.includes('--commit'),
  all: args.includes('--all'),
  readme: args.includes('--readme'),
  claude: args.includes('--claude')
};

// Run the updater
const updater = new DocumentationUpdater(options);
updater.run().catch(console.error);