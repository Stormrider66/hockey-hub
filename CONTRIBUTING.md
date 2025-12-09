# Contributing to Hockey Hub

Thank you for your interest in contributing to Hockey Hub! This document provides guidelines and information for contributors.

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Contribution Guidelines](#contribution-guidelines)
5. [Code Review Process](#code-review-process)
6. [Coding Standards](#coding-standards)
7. [Testing Requirements](#testing-requirements)
8. [Documentation](#documentation)

## Code of Conduct

### Our Pledge
We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, gender, gender identity, sexual orientation, disability, personal appearance, body size, race, ethnicity, age, religion, or nationality.

### Expected Behavior
- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior
- Harassment, trolling, or discriminatory comments
- Publishing private information without permission
- Unwelcome sexual attention or advances
- Any conduct that would be inappropriate in a professional setting

## Getting Started

### Prerequisites
Before contributing, ensure you have:
- Read the [Developer Guide](./DEVELOPER-GUIDE.md)
- Set up your local development environment
- Familiarity with TypeScript, React, and Node.js
- Understanding of the project architecture

### First-Time Contributors
1. Look for issues labeled `good-first-issue` or `help-wanted`
2. Join our development Discord/Slack for questions
3. Start with documentation improvements or small bug fixes
4. Ask questions if anything is unclear

## Development Workflow

### 1. Fork and Clone
```bash
# Fork the repository on GitHub
git clone https://github.com/your-username/hockey-hub.git
cd hockey-hub
git remote add upstream https://github.com/original-repo/hockey-hub.git
```

### 2. Create a Feature Branch
```bash
# Update your local main branch
git checkout main
git pull upstream main

# Create and switch to a feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

### 3. Make Changes
- Follow the coding standards outlined below
- Write/update tests for your changes
- Update documentation as needed
- Commit early and often with clear messages

### 4. Test Your Changes
```bash
# Run unit tests
pnpm test

# Run integration tests
pnpm test:integration

# Run frontend tests
cd apps/frontend && pnpm test

# Test your changes manually
pnpm dev
```

### 5. Prepare for Submission
```bash
# Ensure your branch is up to date
git checkout main
git pull upstream main
git checkout feature/your-feature-name
git rebase main

# Run linting and formatting
pnpm lint
pnpm format

# Final test run
pnpm test:all
```

### 6. Submit Pull Request
- Push your branch to your fork
- Create a pull request on GitHub
- Fill out the pull request template completely
- Link any related issues

## Contribution Guidelines

### Types of Contributions

#### Bug Reports
When reporting bugs, include:
- Clear description of the issue
- Steps to reproduce
- Expected vs. actual behavior
- Environment details (OS, Node version, etc.)
- Screenshots or error logs if applicable

**Bug Report Template:**
```markdown
**Bug Description**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g. Windows 10, macOS 12.0]
- Node.js: [e.g. 18.17.0]
- Browser: [e.g. Chrome 115.0]

**Additional Context**
Any other context about the problem.
```

#### Feature Requests
For new features:
- Describe the use case clearly
- Explain why this feature would be valuable
- Consider how it fits with existing architecture
- Be open to discussion about implementation

#### Code Contributions
- Bug fixes
- New features
- Performance improvements
- Documentation updates
- Test coverage improvements

### What We're Looking For
- Clean, readable, and maintainable code
- Comprehensive test coverage
- Clear documentation
- Backwards compatibility when possible
- Performance considerations
- Security best practices

### What We're Not Looking For
- Breaking changes without discussion
- Features that don't align with project goals
- Code without tests
- Incomplete implementations
- Large refactors without prior discussion

## Code Review Process

### Review Timeline
- Initial response: Within 2 business days
- Full review: Within 1 week
- Follow-up reviews: Within 3 business days

### Review Criteria
Reviewers will check for:

#### Functionality
- ✅ Does the code solve the intended problem?
- ✅ Are there any edge cases not handled?
- ✅ Is the solution efficient and scalable?

#### Code Quality
- ✅ Is the code readable and well-structured?
- ✅ Are naming conventions followed?
- ✅ Is there appropriate error handling?
- ✅ Are there any code smells or anti-patterns?

#### Testing
- ✅ Are there sufficient unit tests?
- ✅ Do integration tests cover the main scenarios?
- ✅ Are edge cases tested?
- ✅ Is test coverage maintained or improved?

#### Documentation
- ✅ Are complex functions documented?
- ✅ Is the README updated if needed?
- ✅ Are API changes documented?
- ✅ Are breaking changes clearly noted?

#### Security
- ✅ Are there any security vulnerabilities?
- ✅ Is user input properly validated?
- ✅ Are authentication checks in place?
- ✅ Is sensitive data handled correctly?

### Review Process

1. **Automated Checks**
   - All CI checks must pass
   - Code must compile without errors
   - Linting rules must be satisfied
   - Tests must pass

2. **Peer Review**
   - At least one core maintainer review required
   - Additional reviews from domain experts if needed
   - All comments must be addressed or discussed

3. **Final Approval**
   - All review comments resolved
   - CI checks passing
   - No merge conflicts
   - Approval from required reviewers

### Addressing Review Comments

#### Best Practices
- Respond to all comments, even if just to acknowledge
- Ask for clarification if comments are unclear
- Be open to suggestions and alternative approaches
- Update your code based on feedback
- Re-request review after making changes

#### Comment Categories
- **Must Fix**: Critical issues that block merge
- **Should Fix**: Important improvements
- **Consider**: Suggestions for improvement
- **Nitpick**: Minor style or preference issues

## Coding Standards

### TypeScript Guidelines

#### General Rules
```typescript
// ✅ Good: Explicit types for public APIs
export function calculatePlayerStats(
  player: Player,
  games: Game[]
): PlayerStats {
  return {
    goals: games.reduce((sum, game) => sum + game.goals, 0),
    assists: games.reduce((sum, game) => sum + game.assists, 0),
  };
}

// ❌ Bad: Missing types
export function calculatePlayerStats(player, games) {
  return {
    goals: games.reduce((sum, game) => sum + game.goals, 0),
    assists: games.reduce((sum, game) => sum + game.assists, 0),
  };
}
```

#### Interface Design
```typescript
// ✅ Good: Well-defined interfaces
interface PlayerProfile {
  readonly id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  position: PlayerPosition;
  statistics: PlayerStats;
}

// ❌ Bad: Unclear or loose interfaces
interface Player {
  id?: any;
  name?: string;
  data?: any;
}
```

### React Guidelines

#### Component Structure
```typescript
// ✅ Good: Well-structured component
interface PlayerCardProps {
  player: Player;
  onEdit?: (player: Player) => void;
  className?: string;
}

export function PlayerCard({ player, onEdit, className }: PlayerCardProps) {
  const handleEditClick = useCallback(() => {
    onEdit?.(player);
  }, [onEdit, player]);

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center justify-between">
        <h3>{player.firstName} {player.lastName}</h3>
        {onEdit && (
          <Button onClick={handleEditClick} variant="ghost" size="sm">
            Edit
          </Button>
        )}
      </div>
    </Card>
  );
}
```

#### Hooks Usage
```typescript
// ✅ Good: Custom hook with proper dependencies
function usePlayerStats(playerId: string) {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPlayerStats(playerId)
      .then(stats => {
        if (!cancelled) {
          setStats(stats);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [playerId]);

  return { stats, loading, error };
}
```

### Backend Guidelines

#### Service Layer
```typescript
// ✅ Good: Clear service with proper error handling
export class PlayerService {
  constructor(
    private playerRepository: PlayerRepository,
    private statsService: StatsService,
    private logger: Logger
  ) {}

  async getPlayerProfile(id: string, userId: string): Promise<PlayerProfile> {
    this.logger.info('Fetching player profile', { playerId: id, userId });

    const player = await this.playerRepository.findById(id);
    if (!player) {
      throw new NotFoundError('Player not found', 'PLAYER_NOT_FOUND');
    }

    // Check if user has permission to view this player
    await this.validatePlayerAccess(player, userId);

    const stats = await this.statsService.getPlayerStats(id);
    
    return {
      ...player,
      statistics: stats,
    };
  }

  private async validatePlayerAccess(player: Player, userId: string): Promise<void> {
    // Implementation details...
  }
}
```

#### API Routes
```typescript
// ✅ Good: Properly structured route with validation
router.get(
  '/players/:id',
  authenticate,
  authorize(['PLAYER', 'COACH', 'PARENT']),
  validationMiddleware(GetPlayerDto, 'params'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const player = await playerService.getPlayerProfile(
        req.params.id,
        req.user.id
      );
      
      res.json({
        success: true,
        data: player,
      });
    } catch (error) {
      next(error);
    }
  }
);
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | kebab-case | `player-service.ts` |
| Directories | kebab-case | `user-management/` |
| React Components | PascalCase | `PlayerDashboard` |
| Functions/Variables | camelCase | `getUserById` |
| Constants | UPPER_SNAKE_CASE | `MAX_LOGIN_ATTEMPTS` |
| Interfaces/Types | PascalCase | `UserProfile` |
| Enums | PascalCase | `UserRole` |
| Database Tables | snake_case | `user_profiles` |
| Environment Variables | UPPER_SNAKE_CASE | `DATABASE_URL` |

## Testing Requirements

### Test Coverage
- Minimum 80% test coverage for new code
- 100% coverage for critical business logic
- All public APIs must have tests
- Bug fixes must include regression tests

### Testing Strategy

#### Unit Tests
```typescript
// ✅ Good: Focused unit test
describe('PlayerService.calculateStats', () => {
  it('should calculate goals and assists correctly', () => {
    const games = [
      { goals: 2, assists: 1 },
      { goals: 1, assists: 3 },
      { goals: 0, assists: 2 },
    ];

    const stats = playerService.calculateStats(games);

    expect(stats.totalGoals).toBe(3);
    expect(stats.totalAssists).toBe(6);
    expect(stats.totalPoints).toBe(9);
  });

  it('should handle empty games array', () => {
    const stats = playerService.calculateStats([]);

    expect(stats.totalGoals).toBe(0);
    expect(stats.totalAssists).toBe(0);
    expect(stats.totalPoints).toBe(0);
  });
});
```

#### Integration Tests
```typescript
// ✅ Good: Integration test with database
describe('User Registration Flow', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should register user with valid data', async () => {
    const userData = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    const response = await request(app)
      .post('/auth/register')
      .send(userData);

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe(userData.email);
    
    // Verify user was saved to database
    const savedUser = await userRepository.findByEmail(userData.email);
    expect(savedUser).toBeTruthy();
  });
});
```

#### Frontend Tests
```typescript
// ✅ Good: Component test with user interactions
describe('PlayerCard', () => {
  const mockPlayer = {
    id: '1',
    firstName: 'Connor',
    lastName: 'McDavid',
    position: 'CENTER',
  };

  it('should display player information', () => {
    render(<PlayerCard player={mockPlayer} />);
    
    expect(screen.getByText('Connor McDavid')).toBeInTheDocument();
    expect(screen.getByText('CENTER')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', async () => {
    const onEdit = jest.fn();
    const user = userEvent.setup();
    
    render(<PlayerCard player={mockPlayer} onEdit={onEdit} />);
    
    await user.click(screen.getByRole('button', { name: /edit/i }));
    
    expect(onEdit).toHaveBeenCalledWith(mockPlayer);
  });
});
```

## Documentation

### Code Documentation
- Document all public APIs
- Use JSDoc for complex functions
- Include examples where helpful
- Keep comments up to date with code changes

### README Updates
Update relevant README files when:
- Adding new features
- Changing installation steps
- Modifying configuration options
- Adding new dependencies

### API Documentation
- Document all endpoints
- Include request/response examples
- Specify authentication requirements
- Note any breaking changes

## Pull Request Template

When creating a pull request, use this template:

```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Related Issues
Fixes #123
Closes #456

## How Has This Been Tested?
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed
- [ ] All existing tests pass

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Additional Notes
Any additional information or context about the changes.
```

## Release Process

### Versioning
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped appropriately
- [ ] Migration scripts tested
- [ ] Security review completed (if applicable)

## Communication

### Asking Questions
- Check existing issues and discussions first
- Use GitHub Discussions for general questions
- Create issues for bug reports or feature requests
- Join our development chat for real-time discussion

### Reporting Security Issues
For security vulnerabilities, email security@hockey-hub.com instead of creating a public issue.

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes for significant contributions
- Annual contributor appreciation

Thank you for contributing to Hockey Hub! 🏒