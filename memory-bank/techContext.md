# Hockey Hub - Technical Context

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS (utility-first approach)
- **State Management**: Redux Toolkit
- **API Communication**: Axios for REST, Apollo Client for GraphQL
- **Real-time Communication**: Socket.io-client
- **Form Handling**: React Hook Form with Zod validation
- **Internationalization**: i18next with language detection
- **Data Visualization**: Recharts
- **Testing**: Jest, React Testing Library, Cypress

### Backend
- **Runtime**: Node.js (LTS version)
- **Language**: TypeScript (strict mode)
- **API Framework**: Express.js
- **Authentication**: JSON Web Tokens (jsonwebtoken)
- **Validation**: Joi, TypeScript type checking
- **Real-time Communication**: Socket.io
- **Database Access**: TypeORM
- **File Handling**: Multer, Sharp
- **Testing**: Jest, Supertest

### Database
- **RDBMS**: PostgreSQL 17
- **Connection Management**: Connection pooling
- **Migrations**: TypeORM migrations
- **Backups**: Automated daily backups
- **Indexing Strategy**: Will be optimized for query patterns

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose (dev), Kubernetes (prod)
- **CI/CD**: GitHub Actions
- **Logging**: Winston, ELK Stack
- **Monitoring**: Prometheus, Grafana
- **Caching**: Redis

### External Integrations
- **Payment Processing**: Stripe, Swish, Bankgiro
- **Cloud Storage**: OneDrive integration 
- **Email Delivery**: Nodemailer with SMTP provider
- **SMS Notifications**: Twilio (optional)
- **External Hockey Stats**: API integrations, web scraping

## Development Environment

### Local Setup
- Docker Compose for local development
- Environment variables through .env files
- Hot reloading for both frontend and backend
- Database seeding for development data
- Local service discovery via Docker Compose DNS
- Shared volume mapping for code changes

### Standard Environment Variables
```
# Common
NODE_ENV=development
LOG_LEVEL=debug

# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=hockeyhub
DB_PASSWORD=*****
DB_NAME=hockeyhub

# Authentication
JWT_SECRET=*****
JWT_REFRESH_SECRET=*****
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Services
API_GATEWAY_PORT=3000
USER_SERVICE_PORT=3001
COMMUNICATION_SERVICE_PORT=3002
CALENDAR_SERVICE_PORT=3003
TRAINING_SERVICE_PORT=3004
MEDICAL_SERVICE_PORT=3005
PLANNING_SERVICE_PORT=3006
STATISTICS_SERVICE_PORT=3007
PAYMENT_SERVICE_PORT=3008
ADMIN_SERVICE_PORT=3009

# External Integrations
STRIPE_API_KEY=*****
ONEDRIVE_CLIENT_ID=*****
SMTP_HOST=*****
SMTP_PORT=587
SMTP_USER=*****
SMTP_PASS=*****
```

### Development Workflow
- Feature branches from development branch
- Pull request workflow with code reviews
- Linting and testing in CI pipeline
- Semantic versioning for releases
- Automated testing before merges

## Planned Project Structure

### Overall Repository Structure
```
/hockey-hub/
├── docker-compose.yml
├── .env.example
├── README.md
├── .github/
│   └── workflows/
├── api-gateway/
├── user-service/
├── communication-service/
├── calendar-service/
├── training-service/
├── medical-service/
├── planning-service/
├── statistics-service/
├── payment-service/
├── admin-service/
├── frontend/
└── database/
    ├── migrations/
    └── seeds/
```

### Typical Microservice Structure
```
/service-name/
├── Dockerfile
├── package.json
├── tsconfig.json
├── .env.example
├── src/
│   ├── index.ts
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── types/
│   └── utils/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
└── README.md
```

### Frontend Structure
```
/frontend/
├── Dockerfile
├── package.json
├── tsconfig.json
├── .env.example
├── public/
│   ├── locales/
│   │   ├── en/
│   │   └── sv/
│   └── assets/
├── src/
│   ├── index.tsx
│   ├── App.tsx
│   ├── api/
│   ├── components/
│   │   ├── common/
│   │   ├── features/
│   │   └── layouts/
│   ├── hooks/
│   ├── i18n/
│   ├── pages/
│   ├── store/
│   ├── styles/
│   ├── types/
│   └── utils/
├── tests/
└── README.md
```

## Technical Constraints

### Performance Requirements
- API response times < 200ms for critical operations
- Page load time < 2 seconds on standard connections
- Support for at least 1000 concurrent users
- Efficient handling of large datasets (10,000+ records)
- Optimized database queries with proper indexing

### Security Requirements
- HTTPS for all communications
- Secure password storage with bcrypt
- Role-based access control for all operations
- Input validation on all API endpoints
- Protection against common web vulnerabilities (XSS, CSRF, SQL injection)
- Sensitive data encryption
- Regular security audits

### Scalability Requirements
- Horizontal scaling capability for all services
- Stateless service design where possible
- Database query optimization for large datasets
- Connection pooling for efficient resource usage
- Caching strategy for frequently accessed data

### Compliance Requirements
- GDPR compliance for user data
- Secure handling of medical information
- Proper consent management
- Data minimization principles
- Data retention policies

## Planned Database Schema

The database architecture will follow the microservice boundaries with some shared tables:

### Core User Management Tables
- `users`: Basic user information
- `roles`: User role definitions
- `user_roles`: Many-to-many relationship between users and roles
- `teams`: Team information
- `team_members`: User-team relationships
- `player_parent_links`: Parent-child relationships

### Calendar-Related Tables
- `events`: Calendar events
- `event_types`: Types of events (training, game, meeting)
- `locations`: Physical locations
- `resources`: Bookable resources (ice rinks, gyms)
- `resource_types`: Types of resources
- `event_resources`: Many-to-many between events and resources

### Training-Related Tables
- `physical_session_templates`: Templates for physical training
- `physical_session_categories`: Categories for training templates
- `exercises`: Exercise library
- `scheduled_physical_sessions`: Assigned training sessions
- `test_definitions`: Definitions of physical tests
- `test_results`: Results from physical tests

### Medical-Related Tables
- `injuries`: Injury records
- `injury_updates`: Progress notes on injuries
- `treatments`: Treatment records
- `treatment_plans`: Structured treatment plans
- `player_availability_status`: Player availability
- `player_medical_info`: General medical information

### Communication-Related Tables
- `chats`: Chat conversations
- `chat_participants`: Members of chats
- `messages`: Chat messages
- `message_reads`: Read receipts
- `notifications`: System notifications

### Planning-Related Tables
- `seasons`: Season definitions
- `season_phases`: Phases within seasons
- `team_goals`: Team objectives
- `player_goals`: Individual player objectives
- `periodization_cycles`: Training cycles

### Statistics-Related Tables
- `game_stats`: Team-level game statistics
- `player_game_stats`: Player-level game statistics
- `training_stats`: Training statistics
- `performance_metrics`: Defined metrics for evaluation

### Payment-Related Tables
- `subscriptions`: Organization subscriptions
- `invoices`: Generated invoices
- `payments`: Payment records

### Administrative Tables
- `organizations`: Tenant organizations
- `system_metrics`: System performance data
- `admin_logs`: Administrative actions
- `service_health`: Service status information

## Internationalization Support

The application will support multiple languages with the following architecture:

### Language Implementation
- Initial support for Swedish and English
- Planned expansion to Finnish, Norwegian, and Danish
- Language preference stored in user profile
- Default language based on browser settings

### Translation Strategy
- Key-based translation using dot notation
- Separate translation files per language and namespace
- Translations stored in both database and static files
- Translation management UI in admin panel

### Frontend Implementation
- i18next for React components
- Language selector in UI
- Automatic date, number, and currency formatting
- RTL support for future language additions

### Backend Implementation
- Accept-Language header handling
- Language-aware API responses
- Multilingual email templates
- Error messages in user's preferred language

## Mobile Strategy

The application will follow a three-phase mobile implementation:

### Phase 1: Responsive Web App (Initial)
- Mobile-first design with Tailwind CSS
- Responsive layouts for all screen sizes
- Touch-optimized UI components
- Testing across various mobile devices

### Phase 2: Progressive Web App (Future)
- Service Workers for offline functionality
- Web App Manifest for installation
- Push notifications
- Background sync for offline actions

### Phase 3: Potential Native App (Future Consideration)
- Evaluate need for React Native implementation
- Consider for hardware integration needs
- Potential Bluetooth connection to training devices
- Advanced background processing

## Critical Dependencies

### Frontend Libraries
- `react` and `react-dom`: Core UI framework
- `react-router-dom`: Routing
- `@reduxjs/toolkit`: State management
- `tailwindcss`: Utility-first CSS framework
- `axios`: HTTP client
- `socket.io-client`: WebSocket client
- `i18next`: Internationalization
- `recharts`: Data visualization
- `react-hook-form`: Form handling
- `zod`: Validation

### Backend Libraries
- `express`: Web framework
- `typescript`: Type safety
- `typeorm`: Database ORM
- `jsonwebtoken`: Authentication
- `bcrypt`: Password hashing
- `socket.io`: Real-time communication
- `joi`: Validation
- `winston`: Logging
- `nodemailer`: Email sending
- `multer`: File uploads

### Development Tools
- `eslint`: Code linting
- `prettier`: Code formatting
- `jest`: Testing
- `docker`: Containerization
- `nodemon`: Development reloading
- `ts-node`: TypeScript execution

## API Conventions

### REST API Standards
- Resource naming: plural nouns (e.g., `/users`, `/teams`)
- HTTP methods: GET, POST, PUT, DELETE, PATCH
- Status codes: 200, 201, 400, 401, 403, 404, 500
- Pagination: `?page=1&limit=20`
- Filtering: `?field=value`
- Sorting: `?sort=field:asc,field2:desc`
- Versioning: `/api/v1/resource`

### Response Format
```json
{
  "success": true,
  "data": {},
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

## Deployment Strategy

### Initial Planning
- Development environment: Local Docker Compose
- Testing environment: CI containers for automated tests
- Future staging environment: Cloud deployment of microservices
- Future production environment: Kubernetes cluster

### Future Deployment Process
1. Build Docker images
2. Run tests
3. Push images to registry
4. Deploy to target environment
5. Run database migrations
6. Health checks
7. Log deployment event

### Scaling Strategy Plans
- Horizontal scaling for stateless services
- Database read replicas for query-heavy services
- CDN for static assets
- Load balancing across service instances

This document provides an overview of the technologies, architecture, and technical decisions planned for the Hockey Hub project.