Branch Strategy
Main Branches

main - Production-ready code

Always deployable
Protected branch requiring pull request approvals
No direct commits allowed


develop - Integration branch

Contains latest delivered development changes
Merged into main when stable for release
Also protected with pull request requirements



Supporting Branches

Feature Branches

Named feature/short-description (e.g., feature/training-session-view)
Created from develop
Merged back into develop via pull request
Delete after merging


Release Branches

Named release/version-number (e.g., release/1.0.0)
Created from develop when ready for release
Only bugfixes committed directly to this branch
Merged to both main and develop when ready
Tagged in main with version number


Hotfix Branches

Named hotfix/short-description (e.g., hotfix/login-error)
Created from main for urgent production fixes
Merged to both main and develop
Delete after merging


Service-Specific Branches

For your microservice architecture, consider having separate development branches for major services
Example: develop-user-service, develop-training-service
These merge into the main develop branch



Workflow Practices
Pull Requests

Template-based PRs

Create PR templates with sections for:

Description of changes
Related issues
Type of change (feature, bugfix, etc.)
Testing completed
Screenshots (for UI changes)




Review Process

Require at least one reviewer for all PRs
For core services (user, training, calendar), require two reviewers
Utilize GitHub's code owners feature to automatically assign reviewers


PR Size

Keep PRs focused and small (ideally <400 lines of code)
Split large features into multiple PRs when possible



Commit Strategy

Conventional Commits

Use the conventional commits format: type(scope): description
Types: feat, fix, docs, style, refactor, test, chore
Example: feat(training-service): add interval timer component


Atomic Commits

Each commit should represent a single logical change
Avoid mixing unrelated changes in a single commit



GitHub Actions (CI/CD)

Automated Testing

Run unit tests on every PR
Run integration tests when merging to develop
Run end-to-end tests when creating release branches


Quality Checks

ESLint and Prettier checks
TypeScript compilation
Code coverage reports
SonarQube code quality analysis


Security Scans

Dependency vulnerability scanning
Secret detection
SAST scans for common security issues


Docker Image Building

Automatically build Docker images for each service
Tag images with branch/PR information
Push to container registry for testing



Issue Management

Issue Organization

Use GitHub Projects for sprint planning
Create service-specific labels (e.g., user-service, training-service)
Use type labels: bug, feature, enhancement, documentation
Use priority labels: high, medium, low


Issue Templates

Bug report template
Feature request template
Technical debt template


Link Issues to PRs

Use keywords in PR descriptions: "Fixes #123", "Closes #456"
Require issue references in PRs when applicable



Monorepo vs. Multiple Repositories
Given your microservice architecture, you have two options:
Option 1: Monorepo
Recommended for Hockey Hub because:

Easier coordination between services
Simplified dependency management
Centralized CI/CD pipeline
Better visibility across the entire project
Easier to maintain consistency in patterns and code style

Structure:
hockey-hub/
├── services/
│   ├── user-service/
│   ├── training-service/
│   ├── calendar-service/
│   └── ...
├── shared/
│   ├── models/
│   ├── utils/
│   └── ...
├── frontend/
│   ├── components/
│   └── ...
└── docs/
Option 2: Multiple Repositories
Consider this only if:

Different teams work independently on different services
Services have very different release cycles
You need different access controls for different services

GitHub Repository Setup

Repository Settings

Enable branch protection rules
Require status checks to pass before merging
Enable vulnerability alerts
Set up CODEOWNERS file


Documentation

Maintain a comprehensive README.md at the root
Create a CONTRIBUTING.md with development guidelines
Add service-specific documentation in each service folder


Automation

Set up GitHub Actions for CI/CD
Configure Dependabot for dependency updates
Add issue and PR templates



Implementation Plan

Initial Setup (Week 1)

Create repository with initial structure
Set up branch protection rules
Configure CI/CD pipelines


Documentation (Week 1-2)

Create comprehensive README
Document branch strategy
Create contributing guidelines


Team Onboarding (Week 2)

Train team on branch strategy
Review PR process
Practice with small features


Refinement (Ongoing)

Regular review of GitHub practices
Adjust based on team feedback
Monitor repository health



Tools to Consider

Automated Tooling

Husky for pre-commit hooks
Commitlint to enforce commit message standards
Semantic Release for automated versioning


GitHub Integrations

GitHub Actions for CI/CD
CodeQL for security analysis
GitHub Advanced Security features



This approach provides a structured way to manage your Hockey Hub codebase, ensuring quality, maintainability, and effective collaboration among team members.