# Hockey Hub Documentation

Welcome to the comprehensive documentation for Hockey Hub - a professional sports management platform for hockey teams.

## 📖 Documentation Index

### 🚀 Getting Started
- **[Quick Start Guide](../QUICK-START.md)** - Get Hockey Hub running quickly
- **[Installation Guide](DEPLOYMENT-QUICK-START.md)** - Step-by-step installation
- **[Development Setup](../DEVELOPER-GUIDE.md)** - Development environment setup
- **[Contributing Guidelines](../CONTRIBUTING.md)** - How to contribute to the project

### 🏗️ Architecture & Design
- **[System Architecture](ARCHITECTURE.md)** - Complete architectural overview
- **[Microservices Design](ADDING-NEW-SERVICES.md)** - Service design patterns
- **[Database Schema](database-migrations.md)** - Database design and migrations
- **[Security Architecture](../SECURITY-AUDIT-CHECKLIST.md)** - Security implementation

### 📡 API Documentation
- **[REST API Reference](API.md)** - Complete API documentation
- **[API Development Guide](API-DEVELOPMENT.md)** - Building and extending APIs
- **[Authentication Guide](AUTH-TESTING.md)** - Authentication implementation
- **[WebSocket Events](chat/SOCKET-EVENTS.md)** - Real-time communication

### 🎯 Feature Guides

#### Core Features
- **[User Roles & Permissions](../development/role-based-permissions.md)** - RBAC system
- **[Calendar System](CALENDAR-INTEGRATION-PLAN.md)** - Scheduling and events
- **[Training Management](../development/hockey-app-functional-descriptions.md)** - Training features
- **[Medical Tracking](DATABASE-SETUP.md)** - Health and injury management

#### Advanced Features
- **[Chat System](chat/)** - Professional messaging platform
  - [User Guide](chat/USER-GUIDE.md) - End-user chat features
  - [Admin Guide](chat/ADMIN-GUIDE.md) - Chat administration
  - [Developer Guide](chat/DEVELOPER-GUIDE.md) - Chat development
- **[Internationalization](../INTERNATIONALIZATION-GUIDE.md)** - Multi-language support
- **[Analytics & Reporting](../PHASE5-ADVANCED-FEATURES-SUMMARY.md)** - Data insights

### 🛠️ Development

#### Development Guides
- **[Testing Guide](TESTING-GUIDE.md)** - Testing strategies and setup
- **[Migration Guide](MIGRATION-GUIDE.md)** - Database migrations
- **[Code Coverage](COVERAGE-SETUP.md)** - Testing coverage setup
- **[Performance Optimization](../REDIS-CACHE-OPTIMIZATION-SUMMARY.md)** - Caching strategies

#### Backend Development
- **[Service Development](../services/README.md)** - Backend service development
- **[Database Management](DATABASE-SETUP.md)** - Database setup and management
- **[Error Handling](../packages/shared-lib/src/errors/)** - Error handling patterns
- **[Monitoring Setup](../packages/monitoring/)** - Application monitoring

#### Frontend Development
- **[Frontend Architecture](../apps/frontend/README.md)** - Frontend development guide
- **[UI Components](../apps/frontend/src/components/)** - Component library
- **[State Management](../apps/frontend/src/store/)** - Redux implementation
- **[Internationalization](../packages/translations/)** - Frontend i18n

### 🚀 Deployment & Operations

#### Deployment
- **[Production Deployment](DEPLOYMENT.md)** - Production deployment guide
- **[Docker Setup](DEPLOYMENT-QUICK-START.md)** - Containerization
- **[Environment Configuration](../services/README.md)** - Environment setup
- **[Monitoring & Logging](../packages/monitoring/)** - Operations monitoring

#### Operations
- **[Database Operations](DATABASE-FINAL-SUMMARY.md)** - Database maintenance
- **[Security Operations](../SECURITY-AUDIT-CHECKLIST.md)** - Security monitoring
- **[Performance Monitoring](../REDIS-CACHE-OPTIMIZATION-SUMMARY.md)** - Performance tracking
- **[Backup & Recovery](DATABASE-SETUP.md)** - Data protection

### 📊 Project Information

#### Project Status
- **[Current Status](../CLAUDE.md)** - Project memory bank and status
- **[Implementation Phases](../development/)** - Development phases
- **[Feature Completion](../CHAT-SYSTEM-COMPLETE.md)** - Completed features
- **[Technical Roadmap](../IMPROVEMENT-PLAN.md)** - Future development

#### Technical Specifications
- **[Technology Stack](ARCHITECTURE.md#technology-stack)** - Technologies used
- **[System Requirements](DEPLOYMENT.md#system-requirements)** - Infrastructure needs
- **[Performance Metrics](../TEST-COVERAGE-REPORT.md)** - Performance data
- **[Security Specifications](../SECURITY-AUDIT-CHECKLIST.md)** - Security measures

## 📚 Documentation by Audience

### 👩‍💻 For Developers
**Start here if you're developing or extending Hockey Hub**

1. [Development Setup](../DEVELOPER-GUIDE.md) - Set up your environment
2. [Architecture Overview](ARCHITECTURE.md) - Understand the system
3. [API Development](API-DEVELOPMENT.md) - Build APIs
4. [Testing Guide](TESTING-GUIDE.md) - Write and run tests
5. [Contributing](../CONTRIBUTING.md) - Contribution guidelines

### 🚀 For DevOps/Operations
**Start here if you're deploying or operating Hockey Hub**

1. [Deployment Guide](DEPLOYMENT.md) - Production deployment
2. [Database Setup](DATABASE-SETUP.md) - Database configuration
3. [Monitoring Setup](../packages/monitoring/) - Application monitoring
4. [Security Guide](../SECURITY-AUDIT-CHECKLIST.md) - Security implementation
5. [Backup Procedures](DATABASE-FINAL-SUMMARY.md) - Data protection

### 👑 For System Administrators
**Start here if you're administrating Hockey Hub**

1. [Quick Start](../QUICK-START.md) - Get started quickly
2. [User Management](../development/role-based-permissions.md) - User roles
3. [Chat Administration](chat/ADMIN-GUIDE.md) - Chat system management
4. [System Configuration](../SECURITY-AUDIT-CHECKLIST.md) - System settings
5. [Troubleshooting](../TECHNICAL-ISSUES-CHECKLIST.md) - Common issues

### 👥 For End Users
**Start here if you're using Hockey Hub**

1. [Chat User Guide](chat/USER-GUIDE.md) - Using the chat system
2. [Calendar Features](CALENDAR-INTEGRATION-PLAN.md) - Scheduling and events
3. [Multi-language Support](../INTERNATIONALIZATION-GUIDE.md) - Language settings
4. [Training Features](../development/hockey-app-functional-descriptions.md) - Training tools
5. [Mobile Features](../apps/frontend/README.md) - Mobile app usage

## 🔍 Quick Reference

### Essential Commands
```bash
# Start development environment
pnpm run dev

# Run tests
pnpm run test

# Build for production
pnpm run build

# Database migrations
pnpm run migrate

# Start specific service
cd services/[service-name] && pnpm run dev
```

### Key URLs (Development)
- Frontend: http://localhost:3002
- API Gateway: http://localhost:3000
- User Service: http://localhost:3001
- Communication Service: http://localhost:3002
- Storybook: http://localhost:6006

### Environment Files
- Main: `.env`
- Frontend: `apps/frontend/.env.local`
- Services: `services/*/. env`
- Testing: `services/*/.env.test`

## 📞 Support & Community

### Getting Help
- **GitHub Issues**: [Report bugs or request features](https://github.com/Stormrider66/hockey-hub/issues)
- **GitHub Discussions**: [Community discussions](https://github.com/Stormrider66/hockey-hub/discussions)
- **Documentation**: Browse this documentation
- **Code Examples**: Check the [development/](../development/) directory

### Contributing
- Read the [Contributing Guidelines](../CONTRIBUTING.md)
- Check the [Development Workflow](../DEVELOPER-GUIDE.md)
- Review the [Code Standards](../CONTRIBUTING.md#code-standards)
- Submit [Pull Requests](https://github.com/Stormrider66/hockey-hub/pulls)

---

## 📋 Documentation Maintenance

This documentation is maintained by the Hockey Hub development team. If you find any issues or have suggestions for improvement:

1. **Create an Issue**: [Report documentation issues](https://github.com/Stormrider66/hockey-hub/issues)
2. **Submit a PR**: Improve documentation directly
3. **Follow Standards**: Use our [Documentation Standards](#documentation-standards)

### Documentation Standards
- **Markdown Format**: All documentation in Markdown
- **Clear Structure**: Use consistent heading hierarchy
- **Code Examples**: Include practical examples
- **Cross-References**: Link related documentation
- **Up-to-Date**: Keep documentation current with code changes

---

**Last Updated**: July 2, 2025 | **Version**: 2.0.0 | **Status**: Production Ready

*Hockey Hub Documentation - Your comprehensive guide to professional hockey team management.*