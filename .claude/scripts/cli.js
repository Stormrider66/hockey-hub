#!/usr/bin/env node
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
      `checkpoint-${Date.now()}.json`
    );
    fs.writeFileSync(backupPath, JSON.stringify(checkpoint, null, 2));
    
    // Save updated checkpoint
    fs.writeFileSync(this.checkpointPath, JSON.stringify(checkpoint, null, 2));
    
    // Update memory with checkpoint info
    this.appendToMemory(`\n## Checkpoint - ${new Date().toISOString()}\n- Files modified: ${modifiedFiles.length}\n- Stats: ${JSON.stringify(checkpoint.codebaseStats)}\n`);
    
    console.log('✅ Checkpoint created');
  }

  // Generate a summary of current progress
  summary() {
    console.log('📊 Generating summary...');
    
    const checkpoint = this.loadCheckpoint();
    const memory = fs.readFileSync(this.memoryPath, 'utf8');
    
    const summary = `# Progress Summary - ${new Date().toISOString()}

## Completed Tasks
${checkpoint.completedTasks.map(task => `- ✅ ${task.description}`).join('\n')}

## Active Tasks
${checkpoint.activeTasks.map(task => `- 🔄 ${task.description} (${task.progress || 0}%)`).join('\n')}

## Codebase Stats
- Total Files: ${checkpoint.codebaseStats.totalFiles}
- Total Lines: ${checkpoint.codebaseStats.totalLines}

## Recent Activity
${this.getRecentCommits()}
`;
    
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
    
    const handoff = `# Context Handoff - ${new Date().toISOString()}

## Quick Start
\`\`\`bash
git checkout ${currentBranch}
npm install
npm run claude:load
\`\`\`

## Current State
${memory}

## Uncommitted Changes
${uncommittedChanges}

## Active Task Details
${checkpoint.activeTasks.map(task => `
### ${task.description}
- Progress: ${task.progress || 0}%
- Files: ${(task.files || []).join(', ')}
- Blockers: ${(task.blockers || []).join(', ')}
- Notes: ${task.notes || 'None'}
`).join('\n')}

## Key Decisions
${Object.entries(checkpoint.decisions || {}).map(([key, value]) => `- **${key}**: ${value}`).join('\n')}

## Next Session Should
1. Run \`npm run claude:load\` to restore context
2. Continue with: ${checkpoint.activeTasks[0]?.description || 'No active tasks'}
3. Check for any failing tests
4. Review uncommitted changes
`;
    
    const handoffPath = path.join(this.claudeDir, 'HANDOFF.md');
    fs.writeFileSync(handoffPath, handoff);
    
    console.log(`✅ Handoff prepared at ${handoffPath}`);
  }

  // Load context for new session
  load() {
    console.log('📥 Loading context...');
    
    const files = [
      { name: 'memory.md', path: this.memoryPath },
      { name: 'checkpoint.json', path: this.checkpointPath },
      { name: 'HANDOFF.md', path: path.join(this.claudeDir, 'HANDOFF.md') }
    ];
    
    console.log('\n=== CONTEXT LOAD START ===\n');
    
    files.forEach(file => {
      if (fs.existsSync(file.path)) {
        console.log(`\n--- ${file.name} ---\n`);
        console.log(fs.readFileSync(file.path, 'utf8'));
      }
    });
    
    console.log('\n=== CONTEXT LOAD END ===\n');
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
    fs.appendFileSync(this.sessionLogPath, `\n${content}\n---\n`);
  }

  getModifiedFiles() {
    try {
      const output = execSync('git diff --name-only', { encoding: 'utf8' });
      return output.trim().split('\n').filter(Boolean);
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
