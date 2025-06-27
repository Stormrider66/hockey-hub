// setup-claude-memory.js
// Run this script to set up the Claude memory system in your project

const fs = require('fs');
const path = require('path');

class ClaudeMemorySetup {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.claudeDir = path.join(projectRoot, '.claude');
  }

  async setup() {
    console.log('🚀 Setting up Claude Memory System...\n');
    
    // Create directories
    this.createDirectories();
    
    // Create initial files
    this.createMemoryFile();
    this.createCheckpointFile();
    this.createSessionLog();
    this.createScripts();
    this.updateGitignore();
    this.updatePackageJson();
    
    console.log('\n✅ Claude Memory System setup complete!');
    console.log('\n📚 Usage:');
    console.log('  npm run claude:checkpoint - Save current state');
    console.log('  npm run claude:summary - Generate progress summary');
    console.log('  npm run claude:handoff - Prepare context handoff');
    console.log('  npm run claude:load - Load context for new session\n');
  }

  createDirectories() {
    const dirs = [
      this.claudeDir,
      path.join(this.claudeDir, 'scripts'),
      path.join(this.claudeDir, 'backups')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });
  }

  createMemoryFile() {
    const memoryPath = path.join(this.claudeDir, 'memory.md');
    const template = `# Claude Code Memory - ${path.basename(this.projectRoot)}
Last Updated: ${new Date().toISOString()}

## Current Task
- **Active File**: None
- **Current Function**: None
- **Status**: Initial Setup
- **Next Steps**: 
  1. Define project structure
  2. Set up initial components

## Recent Changes
- Initial setup - ${new Date().toISOString()}

## Important Context
- Project initialized with Claude Memory System
- Using structured documentation for context persistence

## Code Patterns
- [Document patterns as you establish them]

## Dependencies
- [List key dependencies as you add them]
`;
    
    fs.writeFileSync(memoryPath, template);
    console.log(`📝 Created memory.md`);
  }

  createCheckpointFile() {
    const checkpointPath = path.join(this.claudeDir, 'checkpoint.json');
    const checkpoint = {
      version: "1.0.0",
      lastCheckpoint: new Date().toISOString(),
      projectName: path.basename(this.projectRoot),
      currentPhase: "setup",
      completedTasks: [],
      activeTasks: [],
      decisions: {},
      codebaseStats: {
        totalFiles: 0,
        totalLines: 0,
        testCoverage: 0
      }
    };
    
    fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));
    console.log(`💾 Created checkpoint.json`);
  }

  createSessionLog() {
    const logPath = path.join(this.claudeDir, 'session-log.md');
    const template = `# Session Log

## Session: ${new Date().toISOString()}
### Context Provided
- Initial setup of Claude Memory System

### Work Completed
1. Created .claude directory structure
2. Initialized memory tracking files

### Handoff Notes
- System is ready for use
- Run \`npm run claude:checkpoint\` regularly

---
`;
    
    fs.writeFileSync(logPath, template);
    console.log(`📋 Created session-log.md`);
  }

  createScripts() {
    // Main CLI script
    const cliScript = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ClaudeMemoryCLI {
  constructor() {
    this.claudeDir = path.join(process.cwd(), '.claude');
    this.memoryPath = path.join(this.claudeDir, 'memory.md');
    this.checkpointPath = path.join(this.claudeDir, 'checkpoint.json');
    this.sessionLogPath = path.join(this.claudeDir, 'session-log.md');
  }

  // Create a checkpoint of current state
  checkpoint() {
    console.log('📸 Creating checkpoint...');
    
    const checkpoint = this.loadCheckpoint();
    const modifiedFiles = this.getModifiedFiles();
    
    // Update checkpoint
    checkpoint.lastCheckpoint = new Date().toISOString();
    checkpoint.codebaseStats = this.getCodebaseStats();
    
    // Backup current checkpoint
    const backupPath = path.join(
      this.claudeDir, 
      'backups', 
      \`checkpoint-\${Date.now()}.json\`
    );
    fs.writeFileSync(backupPath, JSON.stringify(checkpoint, null, 2));
    
    // Save updated checkpoint
    fs.writeFileSync(this.checkpointPath, JSON.stringify(checkpoint, null, 2));
    
    // Update memory with checkpoint info
    this.appendToMemory(\`\\n## Checkpoint - \${new Date().toISOString()}\\n- Files modified: \${modifiedFiles.length}\\n- Stats: \${JSON.stringify(checkpoint.codebaseStats)}\\n\`);
    
    console.log('✅ Checkpoint created');
  }

  // Generate a summary of current progress
  summary() {
    console.log('📊 Generating summary...');
    
    const checkpoint = this.loadCheckpoint();
    const memory = fs.readFileSync(this.memoryPath, 'utf8');
    
    const summary = \`# Progress Summary - \${new Date().toISOString()}

## Completed Tasks
\${checkpoint.completedTasks.map(task => \`- ✅ \${task.description}\`).join('\\n')}

## Active Tasks
\${checkpoint.activeTasks.map(task => \`- 🔄 \${task.description} (\${task.progress || 0}%)\`).join('\\n')}

## Codebase Stats
- Total Files: \${checkpoint.codebaseStats.totalFiles}
- Total Lines: \${checkpoint.codebaseStats.totalLines}

## Recent Activity
\${this.getRecentCommits()}
\`;
    
    console.log(summary);
    this.appendToSessionLog(summary);
    
    return summary;
  }

  // Prepare handoff for context window reset
  handoff() {
    console.log('🤝 Preparing handoff...');
    
    const checkpoint = this.loadCheckpoint();
    const memory = fs.readFileSync(this.memoryPath, 'utf8');
    const currentBranch = this.getCurrentBranch();
    const uncommittedChanges = this.getUncommittedChanges();
    
    const handoff = \`# Context Handoff - \${new Date().toISOString()}

## Quick Start
\\\`\\\`\\\`bash
git checkout \${currentBranch}
npm install
npm run claude:load
\\\`\\\`\\\`

## Current State
\${memory}

## Uncommitted Changes
\${uncommittedChanges}

## Active Task Details
\${checkpoint.activeTasks.map(task => \`
### \${task.description}
- Progress: \${task.progress || 0}%
- Files: \${(task.files || []).join(', ')}
- Blockers: \${(task.blockers || []).join(', ')}
- Notes: \${task.notes || 'None'}
\`).join('\\n')}

## Key Decisions
\${Object.entries(checkpoint.decisions || {}).map(([key, value]) => \`- **\${key}**: \${value}\`).join('\\n')}

## Next Session Should
1. Run \\\`npm run claude:load\\\` to restore context
2. Continue with: \${checkpoint.activeTasks[0]?.description || 'No active tasks'}
3. Check for any failing tests
4. Review uncommitted changes
\`;
    
    const handoffPath = path.join(this.claudeDir, 'HANDOFF.md');
    fs.writeFileSync(handoffPath, handoff);
    
    console.log(\`✅ Handoff prepared at \${handoffPath}\`);
  }

  // Load context for new session
  load() {
    console.log('📥 Loading context...');
    
    const files = [
      { name: 'memory.md', path: this.memoryPath },
      { name: 'checkpoint.json', path: this.checkpointPath },
      { name: 'HANDOFF.md', path: path.join(this.claudeDir, 'HANDOFF.md') }
    ];
    
    console.log('\\n=== CONTEXT LOAD START ===\\n');
    
    files.forEach(file => {
      if (fs.existsSync(file.path)) {
        console.log(\`\\n--- \${file.name} ---\\n\`);
        console.log(fs.readFileSync(file.path, 'utf8'));
      }
    });
    
    console.log('\\n=== CONTEXT LOAD END ===\\n');
    console.log('✅ Context loaded. Copy the above into your Claude conversation.');
  }

  // Helper methods
  loadCheckpoint() {
    return JSON.parse(fs.readFileSync(this.checkpointPath, 'utf8'));
  }

  appendToMemory(content) {
    fs.appendFileSync(this.memoryPath, content);
  }

  appendToSessionLog(content) {
    fs.appendFileSync(this.sessionLogPath, \`\\n\${content}\\n---\\n\`);
  }

  getModifiedFiles() {
    try {
      const output = execSync('git diff --name-only', { encoding: 'utf8' });
      return output.trim().split('\\n').filter(Boolean);
    } catch {
      return [];
    }
  }

  getCurrentBranch() {
    try {
      return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  getUncommittedChanges() {
    try {
      return execSync('git status --short', { encoding: 'utf8' });
    } catch {
      return 'Unable to get git status';
    }
  }

  getRecentCommits() {
    try {
      return execSync('git log --oneline -10', { encoding: 'utf8' });
    } catch {
      return 'No commits yet';
    }
  }

  getCodebaseStats() {
    // Simple stats - can be enhanced
    const stats = {
      totalFiles: 0,
      totalLines: 0
    };
    
    try {
      stats.totalFiles = parseInt(execSync('find . -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" | wc -l', { encoding: 'utf8' }).trim());
    } catch {}
    
    return stats;
  }
}

// Main execution
const cli = new ClaudeMemoryCLI();
const command = process.argv[2];

const commands = {
  checkpoint: () => cli.checkpoint(),
  summary: () => cli.summary(),
  handoff: () => cli.handoff(),
  load: () => cli.load()
};

if (commands[command]) {
  commands[command]();
} else {
  console.log('Usage: claude-memory [checkpoint|summary|handoff|load]');
  console.log('  checkpoint - Save current state');
  console.log('  summary    - Generate progress summary');
  console.log('  handoff    - Prepare context handoff');
  console.log('  load       - Load context for new session');
}
`;
    
    const cliPath = path.join(this.claudeDir, 'scripts', 'cli.js');
    fs.writeFileSync(cliPath, cliScript);
    fs.chmodSync(cliPath, '755');
    console.log(`🛠️  Created CLI scripts`);
  }

  updateGitignore() {
    const gitignorePath = path.join(this.projectRoot, '.gitignore');
    const ignoreLines = [
      '',
      '# Claude Memory System',
      '.claude/backups/',
      '.claude/HANDOFF.md',
      '.claude/session-log.md'
    ];
    
    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, 'utf8');
      if (!content.includes('# Claude Memory System')) {
        fs.appendFileSync(gitignorePath, ignoreLines.join('\n'));
        console.log(`📝 Updated .gitignore`);
      }
    } else {
      fs.writeFileSync(gitignorePath, ignoreLines.join('\n'));
      console.log(`📝 Created .gitignore`);
    }
  }

  updatePackageJson() {
    const packagePath = path.join(this.projectRoot, 'package.json');
    
    if (fs.existsSync(packagePath)) {
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      if (!packageData.scripts) packageData.scripts = {};
      
      packageData.scripts['claude:checkpoint'] = 'node .claude/scripts/cli.js checkpoint';
      packageData.scripts['claude:summary'] = 'node .claude/scripts/cli.js summary';
      packageData.scripts['claude:handoff'] = 'node .claude/scripts/cli.js handoff';
      packageData.scripts['claude:load'] = 'node .claude/scripts/cli.js load';
      
      fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
      console.log(`📦 Updated package.json with Claude commands`);
    }
  }
}

// Run setup
if (require.main === module) {
  const setup = new ClaudeMemorySetup();
  setup.setup().catch(console.error);
}

module.exports = ClaudeMemorySetup;