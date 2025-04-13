# Hockey Hub - Technical Enhancements

This document outlines critical technical enhancements for the Hockey Hub project, addressing gaps identified in the current architecture and implementation plan. These detailed recommendations should be incorporated into the development process to ensure a robust, scalable, and maintainable application.

## 1. Error Handling Strategy

### Current Gap
The existing documentation mentions an error response structure but lacks a comprehensive strategy for handling errors between microservices and ensuring data consistency.

### Enhancement Recommendations

#### 1.1 Saga Pattern for Distributed Transactions
- Implement the Saga pattern for operations spanning multiple services
- Each step must have corresponding compensation transactions for rollback
- Example implementation:

```javascript
// Pseudocode for Saga implementation
const sagaOrchestrator = new SagaOrchestrator();

sagaOrchestrator.step({
  execute: () => trainingService.createTrainingSession(sessionData),
  compensate: (data) => trainingService.deleteTrainingSession(data.sessionId)
});

sagaOrchestrator.step({
  execute: (data) => calendarService.createEvent(data.sessionId, eventData),
  compensate: (data) => calendarService.deleteEvent(data.eventId)
});

sagaOrchestrator.step({
  execute: (data) => notificationService.notifyUsers(data.eventId, userIds),
  // No compensation needed for notifications
});

await sagaOrchestrator.execute();
```

#### 1.2 Centralized Logging and Monitoring
- Implement ELK stack (Elasticsearch, Logstash, Kibana) for centralized logging
- Configure Prometheus and Grafana for real-time monitoring and alerts
- Ensure correlation IDs in all service calls to trace transaction chains
- Docker Compose configuration:

```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:7.10.0
  environment:
    - discovery.type=single-node
  ports:
    - "9200:9200"

logstash:
  image: docker.elastic.co/logstash/logstash:7.10.0
  depends_on:
    - elasticsearch

kibana:
  image: docker.elastic.co/kibana/kibana:7.10.0
  ports:
    - "5601:5601"
  depends_on:
    - elasticsearch
    
prometheus:
  image: prom/prometheus
  ports:
    - "9090:9090"
  volumes:
    - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    
grafana:
  image: grafana/grafana
  ports:
    - "3000:3000"
  depends_on:
    - prometheus
```

#### 1.3 Circuit Breaker Pattern
- Implement circuit breakers to prevent cascading failures
- Use libraries like Hystrix or Resilience4j
- Example implementation:

```typescript
import { CircuitBreaker } from 'resilience4js';

// Configure circuit breaker
const breaker = new CircuitBreaker('calendarService', {
  failureThreshold: 0.3,       // Open after 30% failure rate
  resetTimeout: 30000,         // Reset after 30 seconds
  fallback: async () => {
    // Fallback logic when circuit breaker is open
    return await getDataFromCache();
  }
}

## 7. Web Accessibility (a11y)

### Current Gap
The project lacks explicit mention of accessibility standards in frontend development.

### Enhancement Recommendations

#### 7.1 Accessibility Standards and Guidelines
- Define WCAG 2.1 AA as minimum standard for the entire application
- Create guidelines for accessible component design
- Implement accessibility checks in development and build processes
- Example accessibility guidelines:

```markdown
# Accessibility Guidelines for Hockey App

## General Principles
- All functionality must be accessible via keyboard
- All interactive elements must have adequate focus states
- Color contrast must meet WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text)
- Semantic HTML must be used for all markup
- ARIA should be used where HTML's native semantics are insufficient

## Component-specific Guidelines

### Forms
- All form elements must have associated <label> elements
- Forms must have clear error messages
- Required fields should be marked both visually and semantically

### Tables
- Tables should use proper markup (<th>, <caption>, etc.)
- Complex tables should use appropriate ARIA attributes

### Modals and Popups
- Focus must move to the modal when opened
- Focus must return to the triggering element when closed
- ESC key should close modals
- Modals should use the dialog role and associated ARIA attributes

### Navigation
- Content must be accessible with keyboard navigation only
- Skip links should be implemented to bypass repeated content
```

#### 7.2 Accessible UI Components
- Implement a component library structure with built-in accessibility
- Create custom components that respect WCAG guidelines
- Document accessibility features for developers
- Example accessible button component:

```tsx
// components/Button.tsx
import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import classNames from 'classnames';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false,
    disabled,
    className,
    ...rest 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors';
    
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
      danger: 'bg-red-600 text-white hover:bg-red-700'
    };
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };
    
    const buttonClasses = classNames(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      disabled || isLoading ? 'opacity-60 cursor-not-allowed' : '',
      className
    );
    
    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...rest}
      >
        {isLoading && (
          <span className="mr-2" aria-hidden="true">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4" 
                fill="none" 
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
              />
            </svg>
          </span>
        )}
        {children}
      </button>
    );
  }
);
```

#### 7.3 Automated Accessibility Testing
- Integrate tools like axe-core in the testing process
- Run automated accessibility tests in CI/CD pipeline
- Define blocking issues vs. warnings
- Example Jest test with axe:

```typescript
// buttons.test.tsx
import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '../components/Button';

expect.extend(toHaveNoViolations);

describe('Button accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <Button onClick={() => {}} aria-label="Test button">
        Click me
      </Button>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should have no accessibility violations when disabled', async () => {
    const { container } = render(
      <Button disabled aria-label="Disabled button">
        Cannot click
      </Button>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should have no accessibility violations when loading', async () => {
    const { container } = render(
      <Button isLoading aria-label="Loading button">
        Loading
      </Button>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

#### 7.4 Expert Accessibility Reviews
- Schedule regular expert reviews of the user interface
- Conduct screen reader tests with NVDA, JAWS, and VoiceOver
- Create assessment forms for accessibility issues
- Example accessibility checklist:

```markdown
# Accessibility Review - Hockey App

## Navigation and Structure
- [ ] All pages have unique and descriptive titles
- [ ] Skip links exist to bypass navigation areas
- [ ] Content is structured with proper heading levels
- [ ] Landmarks are properly marked (header, nav, main, etc.)

## Keyboard Access
- [ ] All functionality is accessible via keyboard
- [ ] Focus order is logical and intuitive
- [ ] Focus states are clearly visible
- [ ] Custom components have proper keyboard event handlers

## Non-text Content
- [ ] All images have alt text
- [ ] Purely decorative images are marked as role="presentation"
- [ ] Complex charts have text descriptions

## Forms and Input
- [ ] All fields have associated labels
- [ ] Validation feedback is accessible to screen readers
- [ ] Help text is programmatically associated with input fields

## Color and Contrast
- [ ] Contrast ratios meet WCAG 2.1 AA
- [ ] Information is never conveyed by color alone
- [ ] Text on images has sufficient contrast

## Dynamic Content
- [ ] Modals and dialogs are properly implemented
- [ ] Automatic updates are announced to screen readers
- [ ] Users can pause, stop, or hide motion
```

#### 7.5 Documentation and Training
- Create comprehensive documentation for accessibility features
- Train development team in accessible web development
- Include accessibility in the design process from the beginning
- Example training plan:

```markdown
# Accessibility Training for Development Team

## Basic Training (2 hours)
- Introduction to accessibility and WCAG 2.1
- Why accessibility is important
- Basic guidelines and principles
- Common accessibility issues

## Technical Implementation (3 hours)
- Semantic HTML
- ARIA roles and attributes
- Keyboard navigation
- Color contrast and visual design
- Accessible forms

## Practical Exercises (4 hours)
- Building accessible components
- Fixing common accessibility issues
- Testing with screen readers
- Using automated testing tools
```

## Summary of Enhancements

This document has outlined seven critical areas for enhancement in the Hockey Hub project:

1. **Error Handling Strategy** - Implementing comprehensive error handling across microservices with Saga pattern, centralized logging, circuit breakers, and standardized error reporting.

2. **Environment Management** - Creating a robust environment configuration strategy with hierarchical configuration, secure secret management, service-specific configurations, and environment-specific build processes.

3. **CI/CD Details** - Establishing detailed CI/CD pipelines with GitHub Actions, deployment strategies like Blue-Green deployment, automated testing, and database migration handling.

4. **AI Implementation** - Defining a clear AI strategy with hybrid technology selection (Gemini 2.5 API), data integrity measures, cost management, and local fallback functionality.

5. **Testing Depth** - Implementing service-specific test strategies, code coverage goals, integration tests between services, performance tests, and security tests.

6. **Data Migration** - Creating a comprehensive data migration plan with source system analysis, ETL pipeline, phased migration approach, and data validation tools.

7. **Web Accessibility** - Ensuring WCAG 2.1 AA compliance through accessibility standards, accessible UI components, automated testing, expert reviews, and team training.

By implementing these enhancements, the Hockey Hub project will achieve a higher level of technical excellence, maintainability, and user satisfaction.);

// Use circuit breaker
async function createCalendarEvent(eventData) {
  return await breaker.execute(async () => {
    return await calendarServiceClient.createEvent(eventData);
  });
}
```

#### 1.4 Standardized Error Reporting
- Extend the existing error response structure with detailed error codes and categories
- Implement automatic reporting of critical errors to an external tool like Sentry
- Create a common error message catalog for consistent user feedback in multiple languages
- Enhanced error structure:

```json
{
  "error": true,
  "message": "Could not create training session",
  "code": "TRAINING_CREATION_FAILED",
  "category": "RESOURCE_CONFLICT",
  "details": {
    "reason": "Resource conflict with existing booking",
    "conflictingEventId": "1234",
    "availableTimeSlots": ["2023-05-10T10:00:00Z", "2023-05-10T12:00:00Z"],
    "transactionId": "abcd-1234-5678-efgh"
  },
  "timestamp": "2023-05-10T08:30:00Z",
  "path": "/api/v1/training-sessions"
}
```

## 2. Environment Management

### Current Gap
The project uses .env files for environment configuration but lacks a strategy for managing different environments (development, test, production).

### Enhancement Recommendations

#### 2.1 Hierarchical Configuration Structure
- Create a config service that centrally manages configurations for all services
- Implement a hierarchical configuration system:
```
/config/
├── default.json        # Base configuration for all environments
├── development.json    # Development-specific overrides
├── test.json           # Test environment overrides
├── staging.json        # Staging environment overrides
└── production.json     # Production-specific overrides
```

#### 2.2 Secure Secret Management
- Use HashiCorp Vault to manage sensitive configuration data
- Integrate with Kubernetes Secrets for production environment
- Implement rotation of sensitive keys (e.g., JWT keys) automatically
- Example Vault integration:

```typescript
import { VaultClient } from 'node-vault-client';

async function getSecrets() {
  const vault = new VaultClient({
    endpoint: process.env.VAULT_ENDPOINT,
    token: process.env.VAULT_TOKEN
  });
  
  // Get API keys
  const apiKeys = await vault.read('secret/hockey-app/api-keys');
  
  // Get database credentials
  const dbCreds = await vault.read(`secret/hockey-app/database/${process.env.NODE_ENV}`);
  
  return { apiKeys, dbCreds };
}
```

#### 2.3 Service-specific Environment Configuration
- Create service-specific configuration profiles
- Implement an initialization script that fetches the correct configuration at startup
- Example configuration manager:

```typescript
// config/index.ts
import path from 'path';
import { config } from 'dotenv';
import convict from 'convict';

// Load environment variables
config({ path: path.join(__dirname, `../../.env.${process.env.NODE_ENV}`) });

// Define configuration schema
const configSchema = convict({
  env: {
    doc: 'Application environment',
    format: ['development', 'test', 'staging', 'production'],
    default: 'development',
    env: 'NODE_ENV'
  },
  database: {
    host: {
      doc: 'Database host',
      format: String,
      default: 'localhost',
      env: 'DB_HOST'
    },
    // ... other DB settings
  },
  // ... other configurations
});

// Load environment-specific configuration file
const env = configSchema.get('env');
configSchema.loadFile(path.join(__dirname, `${env}.json`));

// Validate configuration
configSchema.validate({ allowed: 'strict' });

export default configSchema;
```

#### 2.4 Environment-specific Build Process
- Implement separate build processes for different environments
- Use Docker multi-stage builds to separate development and production builds
- Example multi-stage Dockerfile:

```dockerfile
# Development stage
FROM node:16 AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Build stage
FROM development AS build
RUN npm run build

# Production stage
FROM node:16-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=build /app/dist ./dist

# Configure environment
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
```

## 3. CI/CD Details

### Current Gap
CI/CD is mentioned in the documentation but specific tools or strategies are not detailed.

### Enhancement Recommendations

#### 3.1 GitHub Actions Pipeline
- Create different workflows for different services and phases
- GitHub Actions workflow example:

```yaml
# .github/workflows/api-gateway.yml
name: API Gateway Pipeline

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'api-gateway/**'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'api-gateway/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: 16
      - name: Install dependencies
        working-directory: ./api-gateway
        run: npm ci
      - name: Run linting
        working-directory: ./api-gateway
        run: npm run lint
      - name: Run tests
        working-directory: ./api-gateway
        run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v2
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v1
      - name: Login to DockerHub
        uses: docker/login-action@v1
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - name: Build and push
        uses: docker/build-push-action@v2
        with:
          context: ./api-gateway
          push: true
          tags: hockeyapp/api-gateway:${{ github.sha }}

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - name: Deploy to staging
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USERNAME }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /path/to/hockey-app
            docker-compose pull api-gateway
            docker-compose up -d api-gateway

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Deploy to K8s production
        uses: steebchen/kubectl@v2
        with:
          config: ${{ secrets.KUBE_CONFIG_DATA }}
          command: set image deployment/api-gateway api-gateway=hockeyapp/api-gateway:${{ github.sha }} --namespace=production
```

#### 3.2 Deployment Strategies
- Implement Blue-Green deployment for zero-downtime deployments:
```yaml
# kubernetes/blue-green-deployment.yaml
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
spec:
  selector:
    app: api-gateway
    color: blue  # Active deployment color
  ports:
    - port: 80
      targetPort: 3000
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
      color: blue
  template:
    metadata:
      labels:
        app: api-gateway
        color: blue
    spec:
      containers:
        - name: api-gateway
          image: hockeyapp/api-gateway:latest
          ports:
            - containerPort: 3000
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway-green
spec:
  replicas: 0  # Initially inactive
  selector:
    matchLabels:
      app: api-gateway
      color: green
  template:
    metadata:
      labels:
        app: api-gateway
        color: green
    spec:
      containers:
        - name: api-gateway
          image: hockeyapp/api-gateway:new-version
          ports:
            - containerPort: 3000
```

#### 3.3 Automated Testing in Pipeline
- Implement automated tests for each microservice
- Include integration tests between services
- Automated quality control with SonarCloud
- SonarCloud configuration example:

```yaml
# .github/workflows/sonarcloud.yml
name: SonarCloud Analysis

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  sonarcloud:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          fetch-depth: 0
      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        with:
          args: >
            -Dsonar.projectKey=hockey-app
            -Dsonar.organization=hockey-org
            -Dsonar.sources=.
            -Dsonar.exclusions=**/*.test.ts,**/*.spec.ts
            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
```

#### 3.4 Automated Database Migration
- Implement secure database migration as part of CI/CD pipeline
- Use database versioning with Flyway or Liquibase
- Example migration scripts with Flyway:

```sql
-- V1__initial_schema.sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  preferred_language VARCHAR(10) DEFAULT 'sv',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- V2__add_roles.sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id),
  role_id UUID REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
);
```

## 4. AI Implementation

### Current Gap
The project mentions AI-assisted functions for training and rehabilitation but lacks details on the technical implementation.

### Enhancement Recommendations

#### 4.1. AI Technology Selection
- Use a hybrid solution with local models and external APIs
- Implement Gemini 2.5 API for advanced AI-generated training programs
- Use local models for simpler classifications and pattern recognition
- Example Gemini API integration:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

class TrainingProgramGenerator {
  private genAI: any;
  private model: any;
  
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
  }
  
  async generateProgram(playerData, injuryType, phase) {
    const prompt = this.buildPrompt(playerData, injuryType, phase);
    
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return this.parseResponse(text);
  }
  
  private buildPrompt(playerData, injuryType, phase) {
    return `
      Create a training program for a hockey player with the following characteristics:
      
      Position: ${playerData.position}
      Age: ${playerData.age}
      Injury type: ${injuryType}
      Rehabilitation phase: ${phase}
      
      The program should include exercises, sets, repetitions, and intensity.
    `;
  }
  
  private parseResponse(responseText) {
    // Convert text response to structured program object
    // ...
  }
}
```

#### 4.2 Data Integrity and Security
- Implement anonymization of sensitive player data before sending to external AI services
- Create a clear data processing process for AI training
- Handle consent for using player data for AI-generated plans
- Example data policy implementation:

```typescript
class AIDataProcessor {
  anonymizePlayerData(playerData) {
    return {
      age: playerData.age,
      position: playerData.position,
      height: playerData.height,
      weight: playerData.weight,
      testResults: playerData.testResults,
      // No personally identifiable information sent
    };
  }
  
  hasConsent(userId) {
    // Check consent settings for the user
    return userConsentRepository.checkAIConsent(userId);
  }
  
  logAIUsage(userId, purpose, dataUsed) {
    // Log AI usage for traceability
    aiUsageRepository.logUsage({
      userId,
      purpose,
      dataCategories: Object.keys(dataUsed),
      timestamp: new Date(),
      anonymized: true
    });
  }
}
```

#### 4.3 Cost Management Strategy
- Implement cost controls for external AI API calls
- Create caching of common AI responses for similar requests
- Define usage limits based on user roles or subscription levels
- Example cost management:

```typescript
class AICostManager {
  private monthlyCap: number;
  private currentMonthUsage: number;
  
  constructor() {
    this.monthlyCap = 500; // EUR
    this.currentMonthUsage = 0;
    // Load usage from persistent storage
  }
  
  async checkAllowance(requestType, tokens) {
    // Estimate cost
    const estimatedCost = this.estimateCost(requestType, tokens);
    
    // Check against limit
    if (this.currentMonthUsage + estimatedCost > this.monthlyCap) {
      // Use fallback generation
      return false;
    }
    
    return true;
  }
  
  recordUsage(requestType, tokensUsed, actualCost) {
    this.currentMonthUsage += actualCost;
    // Save usage data
    aiCostRepository.recordUsage({
      requestType,
      tokensUsed,
      cost: actualCost,
      timestamp: new Date()
    });
  }
  
  private estimateCost(requestType, tokens) {
    // Estimate cost based on model and tokens
    const rates = {
      'gemini-1.0-pro': 0.00025 / 1000, // EUR per token
      'gemini-2.5-pro': 0.0007 / 1000   // EUR per token
    };
    
    return tokens * rates[requestType];
  }
}
```

#### 4.4 Local Fallback Functionality
- Implement local rule-based systems as fallback when AI services are unavailable
- Include a predefined library of training programs and rehab plans
- Create own system library for common injuries and standard treatments
- Example fallback implementation:

```typescript
class TrainingProgramFallback {
  generateProgram(playerData, injuryType, phase) {
    // Get matching templates from database
    const templates = programTemplateRepository.findTemplates({
      injuryType,
      phase,
      playerCategory: this.categorizePlayer(playerData)
    });
    
    if (templates.length === 0) {
      return this.getDefaultProgram(injuryType, phase);
    }
    
    // Choose most suitable template
    const selectedTemplate = this.selectBestTemplate(templates, playerData);
    
    // Customize template with player-specific values
    return this.customizeTemplate(selectedTemplate, playerData);
  }
  
  private categorizePlayer(playerData) {
    // Categorize player based on position, age, etc.
  }
  
  private selectBestTemplate(templates, playerData) {
    // Select most suitable template based on similarity to player's profile
  }
  
  private customizeTemplate(template, playerData) {
    // Customize template with specific values for player
  }
  
  private getDefaultProgram(injuryType, phase) {
    // General standard program based on injury type and phase
  }
}
```

## 5. Testing Depth

### Current Gap
Testing strategy is mentioned in the documentation but lacks details about which types of tests are most important for each service and code coverage goals.

### Enhancement Recommendations

#### 5.1 Service-specific Test Strategies
- Define test priorities for each microservice:
  - **User Service**: Focus on security tests and authentication flows
  - **Calendar Service**: Focus on data integrity tests and conflict handling
  - **Training Service**: Focus on algorithm tests for intensity calculations
  - **Medical Service**: Focus on data validation and access controls
- Example test script for User Service:

```typescript
// user.auth.test.ts
import request from 'supertest';
import app from '../src/app';
import { createTestUser, cleanupTestUser } from './helpers';

describe('User Authentication', () => {
  let testUser;
  
  beforeAll(async () => {
    testUser = await createTestUser({
      email: 'test@example.com',
      password: 'SecureP@ss123'
    });
  });
  
  afterAll(async () => {
    await cleanupTestUser(testUser.id);
  });
  
  test('Should authenticate with valid credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'SecureP@ss123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
  });
  
  test('Should not authenticate with invalid password', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'WrongPassword'
      });
    
    expect(response.status).toBe(401);
  });
  
  // More tests for different authentication scenarios...
});
```

#### 5.2 Code Coverage Goals per Service
- Define specific code coverage goals based on service criticality:
  - **User Service**: 90% coverage (critical for security)
  - **Medical Service**: 85% coverage (critical for data integrity)
  - **Payment Service**: 85% coverage (critical for financial transactions)
  - **Training Service**: 80% coverage
  - **Other services**: 75% coverage
- Configure Jest for code coverage:

```json
// package.json (for User Service)
{
  "jest": {
    "collectCoverage": true,
    "coverageThreshold": {
      "global": {
        "branches": 90,
        "functions": 90,
        "lines": 90,
        "statements": 90
      }
    },
    "coverageReporters": ["json", "lcov", "text", "clover"],
    "coveragePathIgnorePatterns": [
      "/node_modules/",
      "/tests/"
    ]
  }
}
```

#### 5.3 Integration Tests Between Services
- Implement end-to-end tests for key user flows:
  - Creating training sessions (involves training-service, calendar-service, notification-service)
  - Injury registration and rehabilitation plan (medical-service, training-service, calendar-service)
  - User registration and team linking (user-service, team-service)
- Example E2E test setup with Cypress:

```javascript
// cypress/integration/training_session_creation.spec.js
describe('Training Session Creation Flow', () => {
  beforeEach(() => {
    cy.login('coach@example.com', 'password123');
  });
  
  it('should create a training session and appear in calendar', () => {
    // Navigate to training creation
    cy.visit('/training/create');
    
    // Fill in form data
    cy.get('[data-testid="session-title"]').type('Shooting practice with precision focus');
    cy.get('[data-testid="session-date"]').type('2023-06-15');
    cy.get('[data-testid="session-time"]').type('18:00');
    cy.get('[data-testid="session-duration"]').type('90');
    cy.get('[data-testid="session-location"]').select('Skellefteå Kraft Arena');
    
    // Add exercises
    cy.get('[data-testid="add-exercise"]').click();
    cy.get('[data-testid="exercise-select"]').select('Shots from blue line');
    cy.get('[data-testid="exercise-duration"]').type('15');
    
    // Save session
    cy.get('[data-testid="save-session"]').click();
    
    // Verify success message
    cy.get('[data-testid="success-message"]').should('be.visible');
    
    // Check that event appears in calendar
    cy.visit('/calendar');
    cy.get('.calendar-event').contains('Shooting practice with precision focus').should('be.visible');
  });
});
```

#### 5.4 Performance Tests
- Implement load tests for critical services
- Define performance goals (response times, data processing times)
- Configure JMeter or k6 for performance testing
- Example k6 script for chat function:

```javascript
// performance/chat_service.js
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 100,           // 100 virtual users
  duration: '5m',     // Run for 5 minutes
  thresholds: {
    'http_req_duration': ['p95<200'], // 95% of requests under 200ms
    'http_req_failed': ['rate<0.01'],  // Less than 1% errors
  },
};

export default function() {
  const token = getAuthToken();
  
  // Simulate chat messages
  const payload = JSON.stringify({
    chatId: '5f8d0e3c-f32b-49a7-a3b7-cfe55e199220',
    message: 'This is a test message from performance test'
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  };
  
  const response = http.post(
    'https://api.hockeyapp.test/api/v1/messages', 
    payload, 
    params
  );
  
  check(response, {
    'status is 201': (r) => r.status === 201,
    'message created': (r) => r.json('id') !== undefined,
  });
  
  sleep(1);
}

function getAuthToken() {
  // Implement authentication to get token
  const loginRes = http.post('https://api.hockeyapp.test/api/v1/auth/login', {
    email: 'performance_test@example.com',
    password: 'TestP@ssw0rd'
  });
  
  return loginRes.json('accessToken');
}
```

#### 5.5 Security Tests
- Implement automated security tests with OWASP ZAP
- Define specific security goals for services handling sensitive information (medical-service, user-service)
- Implement automatic vulnerability scanning in CI/CD pipeline
- Example OWASP ZAP in GitHub Actions:

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  schedule:
    - cron: '0 2 * * 1'  # Run every Monday at 02:00
  workflow_dispatch:     # Allow manual runs

jobs:
  zap_scan:
    runs-on: ubuntu-latest
    name: Scan API endpoints
    steps:
      - name: ZAP Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'https://staging.hockeyapp.test/api/v1'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'
      
      - name: Upload ZAP report
        uses: actions/upload-artifact@v2
        with:
          name: ZAP Report
          path: report.html
```

## 6. Data Migration

### Current Gap
The project lacks a plan for data migration from existing systems.

### Enhancement Recommendations

#### 6.1 Source System Analysis
- Create tools to analyze data in existing systems (spreadsheets, older databases)
- Perform data profiling to identify inconsistencies and quality issues
- Define mapping rules between source and target systems
- Example data analysis script:

```typescript
import * as xlsx from 'xlsx';
import * as fs from 'fs';

async function analyzeExcelSource(filePath: string): Promise<DataProfile> {
  const workbook = xlsx.readFile(filePath);
  const playerSheet = workbook.Sheets['Players'];
  const playerData = xlsx.utils.sheet_to_json(playerSheet);
  
  // Analyze data structure
  const fieldCounts = {};
  const missingValues = {};
  const uniqueValues = {};
  
  playerData.forEach(player => {
    Object.keys(player).forEach(field => {
      // Count occurrences
      fieldCounts[field] = (fieldCounts[field] || 0) + 1;
      
      // Check empty values
      if (!player[field] && player[field] !== 0) {
        missingValues[field] = (missingValues[field] || 0) + 1;
      }
      
      // Collect unique values for enum fields
      if (['position', 'team', 'status'].includes(field)) {
        uniqueValues[field] = uniqueValues[field] || new Set();
        uniqueValues[field].add(player[field]);
      }
    });
  });
  
  return {
    recordCount: playerData.length,
    fieldCounts,
    missingValues,
    uniqueValueCounts: Object.keys(uniqueValues).reduce((acc, key) => {
      acc[key] = Array.from(uniqueValues[key]);
      return acc;
    }, {})
  };
}
```

#### 6.2 ETL Pipeline
- Create an ETL process (Extract, Transform, Load) for data migration
- Implement step-by-step validation with roll-back capability on error
- Handle data mapping with flexible configurations
- Example ETL pipeline:

```typescript
import { DataSource, DataTarget, ValidationStep, TransformationStep } from './etl-framework';

class PlayerMigrationPipeline {
  async execute() {
    // 1. Extract data from source
    const source = new DataSource({
      type: 'excel',
      path: 'legacy_data/players.xlsx',
      sheetName: 'Players'
    });
    const rawData = await source.extract();
    
    // 2. Validate source data
    const sourceValidator = new ValidationStep({
      rules: [
        {field: 'personalId', type: 'required'},
        {field: 'name', type: 'required'},
        {field: 'team', type: 'required'},
        {field: 'position', type: 'enum', values: ['Forward', 'Defense', 'Goalkeeper']}
      ]
    });
    const validationResults = await sourceValidator.validate(rawData);
    if (validationResults.errors.length > 0) {
      console.error('Source data validation failed:', validationResults.errors);
      return false;
    }
    
    // 3. Transform data to target format
    const transformer = new TransformationStep({
      mappings: [
        {source: 'personalId', target: 'nationalId', transform: normalizeNationalId},
        {source: 'name', target: 'fullName', transform: extractNames},
        {source: 'team', target: 'teamName'},
        {source: 'position', target: 'position', map: {
          'Forward': 'FORWARD',
          'Defense': 'DEFENDER',
          'Goalkeeper': 'GOALKEEPER'
        }},
        // More mappings...
      ]
    });
    const transformedData = await transformer.transform(validationResults.validData);
    
    // 4. Validate transformed data
    const targetValidator = new ValidationStep({
      rules: [
        {field: 'nationalId', type: 'pattern', pattern: /^\d{8}-\d{4}$/},
        {field: 'firstName', type: 'required'},
        {field: 'lastName', type: 'required'},
        {field: 'teamName', type: 'required'},
        {field: 'position', type: 'enum', values: ['FORWARD', 'DEFENDER', 'GOALKEEPER']}
      ]
    });
    const targetValidation = await targetValidator.validate(transformedData);
    if (targetValidation.errors.length > 0) {
      console.error('Target data validation failed:', targetValidation.errors);
      return false;
    }
    
    // 5. Load data to target system
    const target = new DataTarget({
      type: 'api',
      endpoint: 'https://api.hockeyapp.test/api/v1/users/batch',
      authToken: process.env.API_TOKEN
    });
    const loadResult = await target.load(targetValidation.validData);
    
    return {
      success: loadResult.success,
      processedRecords: rawData.length,
      validRecords: targetValidation.validData.length,
      invalidRecords: targetValidation.errors.length,
      loadedRecords: loadResult.insertedCount
    };
  }
}

// Helper functions for transformation
function normalizeNationalId(value) {
  // Format national ID consistently
}

function extractNames(fullName) {
  // Split full name into first name and last name
}

#### 6.3 Phased Migration Plan
- Implement migration plan in phases based on data prioritization
- Perform migration tests in isolated environment
- Include rollback strategy for each migration step
- Example migration plan:

```typescript
// migration-plan.ts
const migrationPlan = [
  {
    phase: 1,
    name: 'Core User Data',
    description: 'Migrate basic user information and team structures',
    steps: [
      {
        step: 'teams',
        source: 'legacy_data/teams.xlsx',
        pipeline: TeamMigrationPipeline,
        dependencies: [],
        rollbackStrategy: 'delete-all'
      },
      {
        step: 'users',
        source: 'legacy_data/players.xlsx',
        pipeline: PlayerMigrationPipeline,
        dependencies: ['teams'],
        rollbackStrategy: 'delete-all'
      },
      {
        step: 'coaches',
        source: 'legacy_data/coaches.xlsx',
        pipeline: CoachMigrationPipeline,
        dependencies: ['teams'],
        rollbackStrategy: 'delete-all'
      }
    ]
  },
  {
    phase: 2,
    name: 'Historical Data',
    description: 'Migrate historical training and medical data',
    steps: [
      {
        step: 'training-history',
        source: 'legacy_data/training_history.xlsx',
        pipeline: TrainingHistoryPipeline,
        dependencies: ['users', 'teams'],
        rollbackStrategy: 'delete-phase'
      },
      {
        step: 'injury-history',
        source: 'legacy_data/injuries.xlsx',
        pipeline: InjuryHistoryPipeline,
        dependencies: ['users'],
        rollbackStrategy: 'delete-phase'
      }
    ]
  },
  // More phases...
];
```

#### 6.4 Data Validation Tools
- Create tools to validate data after migration
- Implement automated tests to ensure data integrity
- Perform sample checks to verify data quality
- Example data validation tool:

```typescript
// data-validation.ts
import { database } from '../config/database';

class DataValidator {
  async validateMigration(migrationName) {
    const validations = this.getValidationsForMigration(migrationName);
    const results = [];
    
    for (const validation of validations) {
      const result = await this.runValidation(validation);
      results.push(result);
      
      if (result.severity === 'critical' && !result.passed) {
        console.error(`Critical validation error: ${validation.name}`);
        return {
          passed: false,
          results
        };
      }
    }
    
    return {
      passed: results.every(r => r.passed),
      results
    };
  }
  
  async runValidation(validation) {
    try {
      const { query, expectedResult, comparison, name, severity } = validation;
      const result = await database.query(query);
      
      let passed = false;
      switch (comparison) {
        case 'equals':
          passed = result.rowCount === expectedResult;
          break;
        case 'greaterThan':
          passed = result.rowCount > expectedResult;
          break;
        case 'lessThan':
          passed = result.rowCount < expectedResult;
          break;
        // More comparison types...
      }
      
      return {
        name,
        passed,
        severity,
        expected: expectedResult,
        actual: result.rowCount,
        query
      };
    } catch (error) {
      return {
        name: validation.name,
        passed: false,
        severity: validation.severity,
        error: error.message
      };
    }
  }
  
  getValidationsForMigration(migrationName) {
    // Return specific validations for the specified migration
    const validations = {
      'users': [
        {
          name: 'All players have been transferred',
          query: 'SELECT COUNT(*) FROM users WHERE role_id = (SELECT id FROM roles WHERE name = \'player\')',
          expectedResult: 250, // Expected number of players
          comparison: 'equals',
          severity: 'critical'
        },
        {
          name: 'No duplicate email addresses',
          query: 'SELECT COUNT(*) FROM (SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1) as duplicates',
          expectedResult: 0,
          comparison: 'equals',
          severity: 'critical'
        },
        // More validations...
      ],
      // More migration validations...
    };
    
    return validations[migrationName] || [];
  }
}