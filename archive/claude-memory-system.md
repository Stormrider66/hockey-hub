# Claude Code Memory Management System

## Overview
This system helps maintain context and progress when Claude Code's context window fills up and resets in Cursor.

## 1. Project State File Structure

Create these files in your project root:

### `.claude/memory.md`
```markdown
# Claude Code Memory - [Project Name]
Last Updated: [Timestamp]

## Current Task
- **Active File**: [filename]
- **Current Function**: [function name]
- **Status**: [In Progress/Blocked/Complete]
- **Next Steps**: 
  1. [Step 1]
  2. [Step 2]

## Recent Changes
- [File] - [Change description] - [Timestamp]
- [File] - [Change description] - [Timestamp]

## Important Context
- [Key decision or constraint]
- [Technical limitation discovered]
- [Design pattern being followed]
```

### `.claude/checkpoint.json`
```json
{
  "version": "1.0.0",
  "lastCheckpoint": "2024-01-20T10:30:00Z",
  "currentPhase": "implementation",
  "completedTasks": [
    {
      "id": "task-001",
      "description": "Set up authentication module",
      "files": ["auth.ts", "auth.test.ts"],
      "notes": "Using JWT with refresh tokens"
    }
  ],
  "activeTasks": [
    {
      "id": "task-002", 
      "description": "Implement user profile API",
      "progress": 60,
      "blockers": ["Waiting for database schema confirmation"],
      "files": ["userProfile.ts"]
    }
  ],
  "decisions": {
    "architecture": "Microservices with event sourcing",
    "database": "PostgreSQL with Redis cache",
    "testing": "Jest with 80% coverage requirement"
  }
}
```

### `.claude/session-log.md`
```markdown
# Session Log

## Session: [Date Time]
### Context Provided
- Working on: [Feature/Bug]
- Previous state: [Brief summary]

### Work Completed
1. [Task completed]
2. [Task completed]

### Handoff Notes
- Current file has [specific issue]
- Next session should [action]
- Watch out for [potential problem]

---
```

## 2. Progressive Summary System

### Create Summary Levels

#### Level 1: Current Task Summary (every 10 messages)
```markdown
## Quick Summary - [Timestamp]
- Working on: [specific task]
- Progress: [what's done]
- Next: [immediate next step]
- Key code: `[important variable/function names]`
```

#### Level 2: Session Summary (at context limit)
```markdown
## Session Summary - [Session ID]
### Completed
- ✅ [Major accomplishment]
- ✅ [Major accomplishment]

### In Progress  
- 🔄 [Current work] - [% complete]
- 🔄 [Current work] - [% complete]

### Technical Decisions
- Chose [approach] because [reason]
- Avoided [pattern] due to [constraint]

### Code Architecture
- Main entry: [file]
- Key modules: [list]
- External deps: [list]
```

#### Level 3: Project State (weekly)
```markdown
## Project State - Week of [Date]
### Architecture Overview
[ASCII diagram or brief description]

### Module Status
- ✅ Auth Module (100%)
- 🔄 User Module (70%)
- ⏳ Analytics Module (0%)

### Key Interfaces
```typescript
// Critical interfaces to remember
interface UserContext {
  // ...
}
```
```

## 3. Automated Context Collection

### Git Hooks for Auto-documentation

Create `.claude/hooks/pre-commit.sh`:
```bash
#!/bin/bash
# Auto-update Claude memory on commit

echo "## Commit: $(date)" >> .claude/session-log.md
git diff --cached --name-only >> .claude/session-log.md
echo "---" >> .claude/session-log.md
```

### VS Code Task for Context Snapshot

`.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Claude Context Snapshot",
      "type": "shell",
      "command": "node",
      "args": ["${workspaceFolder}/.claude/scripts/snapshot.js"],
      "group": "build",
      "presentation": {
        "reveal": "never"
      }
    }
  ]
}
```

## 4. Context Handoff Protocol

### Before Context Reset

1. **Run Summary Command** (in Cursor)
   ```
   "Summarize our current progress and create a handoff note"
   ```

2. **Save Active State**
   - Copy current file path
   - Note current function/class
   - List any unresolved errors

3. **Update Checkpoint**
   ```bash
   npm run claude:checkpoint
   ```

### After Context Reset

1. **Load Context Command**
   ```
   "Load context from .claude/memory.md and continue from the last checkpoint"
   ```

2. **Verify Understanding**
   ```
   "Confirm understanding of: current task, recent changes, and next steps"
   ```

## 5. Smart File Naming Convention

Structure files to aid context recovery:

```
src/
  features/
    auth/
      _AUTH_README.md          # Module overview
      auth.controller.ts       # Entry point
      auth.service.ts         
      auth.types.ts           # Critical types
      auth.CURRENT_TASK.md    # Active work notes
```

## 6. CLI Helper Scripts

### `.claude/scripts/cli.js`
```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const commands = {
  checkpoint: () => {
    // Create checkpoint
    const checkpoint = {
      timestamp: new Date().toISOString(),
      files: getModifiedFiles(),
      context: getCurrentContext()
    };
    saveCheckpoint(checkpoint);
  },
  
  summary: () => {
    // Generate summary
    const summary = generateSummary();
    console.log(summary);
    appendToMemory(summary);
  },
  
  handoff: () => {
    // Prepare handoff
    const handoff = prepareHandoff();
    saveHandoff(handoff);
    console.log("Handoff prepared at .claude/handoff.md");
  }
};

// Run command
const cmd = process.argv[2];
if (commands[cmd]) {
  commands[cmd]();
} else {
  console.log("Available commands: checkpoint, summary, handoff");
}
```

### Add to package.json:
```json
{
  "scripts": {
    "claude:checkpoint": "node .claude/scripts/cli.js checkpoint",
    "claude:summary": "node .claude/scripts/cli.js summary",
    "claude:handoff": "node .claude/scripts/cli.js handoff"
  }
}
```

## 7. Context Recovery Strategies

### Strategy 1: Breadcrumb Comments
```typescript
// CLAUDE-CONTEXT: Main entry point for user authentication
// CLAUDE-DEPS: Requires UserService, TokenManager
// CLAUDE-NEXT: Implement refresh token rotation
export class AuthController {
  // ...
}
```

### Strategy 2: Test-Driven Context
Write tests that document expected behavior:
```typescript
describe('CLAUDE-CONTEXT: User Authentication Flow', () => {
  it('should follow this exact flow for login', () => {
    // 1. Validate credentials
    // 2. Generate tokens
    // 3. Store session
    // 4. Return user data
  });
});
```

### Strategy 3: Decision Log
```typescript
// DECISIONS.md
## Authentication Approach
- **Decision**: JWT with refresh tokens
- **Date**: 2024-01-20
- **Reason**: Stateless, scalable
- **Alternative Considered**: Session-based
- **Rejected Because**: Scaling concerns

## Database Schema
- **Decision**: Separate user_profiles table
- **Date**: 2024-01-19
- **Reason**: Performance, separation of concerns
```

## 8. Best Practices

1. **Frequent Checkpoints**
   - Every major function completion
   - Before complex refactoring
   - At natural break points

2. **Descriptive Git Commits**
   ```bash
   git commit -m "feat(auth): Add JWT refresh rotation - CLAUDE-TASK-002"
   ```

3. **Context-Aware File Organization**
   - Group related files
   - Use clear naming conventions
   - Keep README files in each module

4. **Explicit TODOs**
   ```typescript
   // TODO[CLAUDE-NEXT]: Implement rate limiting here
   // TODO[CLAUDE-BLOCKED]: Waiting for API specification
   ```

5. **Regular Summaries**
   - End of each session
   - Major milestone completion
   - Before switching contexts

## 9. Emergency Recovery

If context is completely lost:

1. Check `.claude/checkpoint.json` for last state
2. Review recent git commits
3. Look for CLAUDE-CONTEXT comments
4. Check test files for behavior documentation
5. Use `.claude/memory.md` for high-level overview

## 10. Integration with Cursor

### Cursor Settings
Add to `.cursor/settings.json`:
```json
{
  "ai.contextFiles": [
    ".claude/memory.md",
    ".claude/checkpoint.json",
    "DECISIONS.md"
  ]
}
```

This ensures Claude always has access to memory files when starting a new session.