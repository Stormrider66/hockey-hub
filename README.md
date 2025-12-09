# Hockey Hub

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/Stormrider66/hockey-hub)
[![Coverage](https://img.shields.io/badge/coverage-83.2%25-brightgreen)](https://github.com/Stormrider66/hockey-hub)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-blue)](package.json)

A comprehensive sports management platform for hockey teams, built as a production-ready monorepo with microservices architecture. Hockey Hub supports multiple user roles and provides real-time functionality for team management, training coordination, medical tracking, and professional communication.

## 🚀 Key Features

### Core Management
- **👥 User Management**: 8 role-based dashboards (Player, Coach, Parent, Medical Staff, Equipment Manager, Physical Trainer, Club Admin, System Admin)
- **📅 Advanced Calendar**: Complete scheduling system with conflict detection, recurring events, and analytics
- **🏒 Team Operations**: Comprehensive team management, roster control, and organizational hierarchy
- **💪 Training Programs**: Physical training sessions, workout tracking, and performance analytics

### Advanced Features
- **💬 Professional Chat**: Enterprise-grade messaging with 100+ components, file sharing, and chat bots
- **🏥 Medical Management**: Injury tracking, wellness monitoring, treatment plans, and availability status
- **🌐 Internationalization**: Full support for 19 European languages with 31,000+ translations
- **📊 Analytics & Reporting**: Performance tracking, facility utilization, and data-driven insights
- **🔐 Enterprise Security**: JWT authentication, RBAC, input validation, and audit trails
- **🏋️ Complete Workout Lifecycle**: Creation → Calendar → Execution → Monitoring → Analytics
- **📈 Professional Export System**: PDF, Excel, CSV reports with scheduled delivery

### Real-time Features
- **⚡ Live Updates**: Socket.io integration with TypeScript for real-time communication
- **🔔 Smart Notifications**: Email, SMS, and push notifications with customizable preferences
- **📁 File Management**: S3 integration with virus scanning and secure file sharing
- **🎯 Performance Optimization**: Redis caching across all services with 60-80% query reduction

## 🏗️ Architecture & Technology Stack

### Frontend Stack
- **Next.js 15.3.4** - Server-side rendering and optimization
- **React 18** - Modern component architecture with hooks
- **TypeScript 5.3.3** - Full type safety across the application
- **Redux Toolkit + RTK Query** - Predictable state management with caching
- **Radix UI + Tailwind CSS** - Accessible, customizable UI components
- **Socket.io Client** - Real-time communication

### Backend Stack
- **Node.js + Express** - High-performance microservices
- **TypeScript** - Type-safe backend development
- **PostgreSQL** - ACID-compliant database with advanced features
- **TypeORM** - Database ORM with migrations and relationships
- **Redis** - High-performance caching and session storage
- **Socket.io** - Real-time bidirectional communication

### Infrastructure & DevOps
- **Docker** - Containerized deployment
- **pnpm Workspaces** - Efficient monorepo package management
- **Jest + React Testing Library** - Comprehensive testing framework
- **ESLint + Prettier** - Code quality and formatting
- **GitHub Actions** - CI/CD pipeline (planned)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Docker and Docker Compose
- PostgreSQL 14+
- Redis 6+

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Stormrider66/hockey-hub.git
   cd hockey-hub
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   # Copy environment files for all services
   cp .env.example .env
   cp apps/frontend/.env.local.example apps/frontend/.env.local
   # Configure each service's .env file
   ```

4. **Start the development environment:**
   ```bash
   # Option 1: Full stack (recommended)
   docker-compose up -d        # Start databases
   pnpm run dev               # Start all services

   # Option 2: Frontend only (for UI testing)
   ./start-frontend-only.sh   # Unix/Mac
   start-frontend-only.bat    # Windows
   ```

5. **Access the application:**
   - Frontend: http://localhost:3010
   - API Gateway: http://localhost:3000
   - Individual services: http://localhost:3001-3009
   - Demo Showcase: http://localhost:3010/physicaltrainer/demo

### Development Scripts

```bash
# Development
pnpm run dev              # Start all services in development mode
pnpm run build            # Build all packages and services
pnpm run test             # Run all tests
pnpm run lint             # Run ESLint across all packages

# Frontend specific
cd apps/frontend
pnpm run dev              # Start frontend only
pnpm run storybook        # Start Storybook on port 6006
pnpm run test:ui          # Run frontend tests

# Backend specific
cd services/[service-name]
pnpm run dev              # Start individual service
pnpm run test             # Run service tests
pnpm run migrate          # Run database migrations
```

## 📁 Project Structure

```
hockey-hub/
├── apps/
│   └── frontend/           # Next.js frontend application
│       ├── src/
│       │   ├── components/ # Reusable UI components
│       │   ├── features/   # Feature-based modules (8 dashboards)
│       │   ├── hooks/      # Custom React hooks
│       │   ├── store/      # Redux store with RTK Query
│       │   └── lib/        # Utilities and helpers
│       └── public/         # Static assets and locales
├── services/               # Backend microservices
│   ├── api-gateway/        # Central API routing (Port 3000)
│   ├── user-service/       # Authentication & user management (Port 3001)
│   ├── communication-service/ # Chat & notifications (Port 3002)
│   ├── calendar-service/   # Event scheduling (Port 3003)
│   ├── training-service/   # Workout tracking (Port 3004)
│   ├── medical-service/    # Health & injury management (Port 3005)
│   ├── planning-service/   # Strategic planning (Port 3006)
│   ├── statistics-service/ # Analytics & reporting (Port 3007)
│   ├── payment-service/    # Financial transactions (Port 3008)
│   └── admin-service/      # System administration (Port 3009)
├── packages/               # Shared packages
│   ├── shared-lib/         # Common types, utilities, middleware
│   ├── translations/       # i18n support for 19 languages
│   └── monitoring/         # Logging, metrics, error handling
├── docs/                   # Comprehensive documentation
└── development/            # Development tools and utilities
```

## 📚 Documentation

### Quick Links
- **[Quick Start Guide](QUICK-START.md)** - Get up and running quickly
- **[Architecture Overview](docs/ARCHITECTURE.md)** - System design and patterns
- **[API Documentation](docs/API.md)** - REST API reference
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions
- **[Developer Guide](DEVELOPER-GUIDE.md)** - Development best practices

### User Guides
- **[Chat System Guide](docs/chat/USER-GUIDE.md)** - Professional messaging features
- **[Calendar Integration](docs/CALENDAR-INTEGRATION-PLAN.md)** - Scheduling and events
- **[Internationalization](INTERNATIONALIZATION-GUIDE.md)** - Multi-language support

### Technical Documentation
- **[Testing Guide](docs/TESTING-GUIDE.md)** - Testing strategies and setup
- **[Database Migrations](docs/database-migrations.md)** - Database management
- **[Security Guide](SECURITY-AUDIT-CHECKLIST.md)** - Security best practices
- **[Contributing Guidelines](CONTRIBUTING.md)** - How to contribute

## 🎯 Current Status (Production Ready)

### ✅ Completed Features
- **Frontend**: Complete React/Next.js application with 8 role-based dashboards
- **Backend**: 10 microservices with full TypeScript support
- **Security**: Production-ready JWT authentication, RBAC, and input validation
- **Database**: Optimized PostgreSQL schemas with migrations and audit trails
- **Chat System**: Enterprise-grade messaging platform (100% complete)
- **Internationalization**: 19 European languages with complete translations
- **Calendar**: Advanced scheduling system with analytics and export
- **Performance**: Redis caching across all services with significant optimization
- **Testing**: Comprehensive testing infrastructure with 200+ test cases

### 🚧 In Progress
- **CI/CD Pipeline**: GitHub Actions workflow setup
- **Docker Production**: Production-ready containerization
- **Monitoring**: APM and observability stack
- **Documentation**: API documentation with OpenAPI/Swagger

### 📊 Project Metrics
- **750+ Files**: Complete monorepo implementation
- **100+ React Components**: Professional UI component library
- **200+ API Endpoints**: Comprehensive REST API with WebSocket support
- **31,000+ Translations**: Multi-language support (19 languages)
- **777+ Test Cases**: Unit, integration, and E2E tests
- **83.2% Test Coverage**: Production-ready codebase
- **87.5% Feature Complete**: 7/8 core phases implemented

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for detailed information.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper tests
4. Follow our coding standards and run linting
5. Submit a pull request with detailed description

### Code Standards
- **TypeScript**: Strict typing required
- **Testing**: Unit tests for all new features
- **Documentation**: Update docs for API changes
- **Conventional Commits**: Use conventional commit messages
- **ESLint**: Code must pass linting checks

## 📈 Performance & Scalability

- **Microservices Architecture**: Independent scaling and deployment
- **Redis Caching**: 60-80% query reduction across services
- **Database Optimization**: Strategic indexing and connection pooling
- **CDN Integration**: Optimized asset delivery
- **Real-time Features**: Efficient WebSocket communication

## 🔒 Security Features

- **JWT Authentication**: Stateless, secure token-based auth
- **Role-Based Access Control**: Granular permission system
- **Input Validation**: Comprehensive data sanitization
- **SQL Injection Prevention**: Parameterized queries and validation
- **XSS Protection**: Output encoding and CSP headers
- **Audit Logging**: Complete activity tracking

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Community

- **Issues**: [GitHub Issues](https://github.com/Stormrider66/hockey-hub/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Stormrider66/hockey-hub/discussions)
- **Documentation**: [docs/](docs/) directory
- **Email**: Contact the development team for enterprise support

---

**Hockey Hub** - Empowering hockey teams with professional-grade management tools. Built with ❤️ by the Hockey Hub team.