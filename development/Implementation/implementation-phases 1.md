# Hockey Hub - Implementation Phases and Strategic Plan

This document outlines the recommended implementation strategy for the Hockey Hub project, divided into clear phases with integrated multilingual support, advanced error handling, CI/CD pipeline, AI implementation, data migration, and accessibility standards.

## Overarching Principles

### Code Consistency
- Use TypeScript strict mode in all services (`"strict": true` in tsconfig.json)
- Define clear interfaces for ALL data shared between services
- Follow a consistent naming convention for functions and variables:
  - camelCase for variables and functions
  - PascalCase for classes and interfaces
  - UPPER_SNAKE_CASE for constants
- Use ESLint and Prettier to maintain code standards
- **For translation keys, use dot notation naming (e.g., 'common.buttons.save')**
- **Avoid hardcoded strings in the interface - always use translation functions**

### Architecture Principles
- Strict separation of concerns between microservices
- RESTful API design with consistent naming
- Clearly defined communication paths between services
- Database integrity rules defined at the database level, not just in application code
- **Centralized management of translations via a dedicated service**
- **Localization of dates, times, numbers, and currencies in all user interfaces**
- **Implementation of the Saga pattern for distributed transactions**
- **Circuit breaker pattern to prevent cascading failures**

### Accessibility Principles
- Follow WCAG 2.1 AA standard throughout the application
- Semantic HTML for all markup
- Clear focus handling for all interactive elements
- Proper color contrast (4.5:1 for normal text, 3:1 for large text)
- Accessible via keyboard only
- Testing with screen readers (NVDA, JAWS, VoiceOver)

## Phase 1: Basic Infrastructure and Core Functionality (8 weeks)

### 1.1 Project Structure and Basic Infrastructure (Week 1-2)
- Establish monorepo structure according to project documentation
- Configure Docker and Docker Compose for development environment
- Implement basic PostgreSQL schema with main tables
- Create shared-lib package for common type definitions and tools
- **Implement ELK stack (Elasticsearch, Logstash, Kibana) for centralized logging**
- **Configure Prometheus and Grafana for real-time monitoring and alerts**
- **Implement hierarchical configuration structure for different environments**
- Add basic database schema for language management:
  ```sql
  CREATE TABLE supported_languages (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    native_name VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    direction VARCHAR(3) DEFAULT 'ltr'
  );
  
  CREATE TABLE translations (
    key VARCHAR(255) NOT NULL,
    language_code VARCHAR(10) REFERENCES supported_languages(code),
    translation TEXT NOT NULL,
    context VARCHAR(255),
    PRIMARY KEY (key, language_code)
  );
  ```
- Add initial data for Swedish and English:
  ```sql
  INSERT INTO supported_languages (code, name, native_name) 
  VALUES ('sv', 'Swedish', 'Svenska'), 
         ('en', 'English', 'English');
  ```

### 1.2 CI/CD and Automated Testing (Week 2-3)
- **Implement GitHub Actions for continuous integration:**
  ```yaml
  # .github/workflows/ci.yml
  name: Continuous Integration

  on:
    push:
      branches: [ main, develop ]
    pull_request:
      branches: [ main, develop ]

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
          run: npm ci
        - name: Run linting
          run: npm run lint
        - name: Run tests
          run: npm test
        - name: Check code coverage
          run: npm run test:coverage
  ```
- **Configure automated code quality checks with SonarCloud**
- **Implement automated accessibility tests with axe-core**
- **Configure Docker image builds in CI pipeline**
- **Create deployment pipeline for staging/production**
- **Implement Blue-Green deployment strategy for zero-downtime updates**

### 1.3 Error Handling Strategy (Week 3-4)
- **Implement the Saga pattern for distributed transactions:**
  ```typescript
  // Example of Saga implementation
  class SagaOrchestrator {
    private steps: Array<{
      execute: (data?: any) => Promise<any>,
      compensate: (data?: any) => Promise<any>
    }> = [];
    
    step(stepDefinition: {
      execute: (data?: any) => Promise<any>,
      compensate: (data?: any) => Promise<any>
    }) {
      this.steps.push(stepDefinition);
      return this;
    }
    
    async execute() {
      const executedSteps = [];
      let currentData = {};
      
      try {
        for (const step of this.steps) {
          const stepResult = await step.execute(currentData);
          executedSteps.push({ step, data: stepResult });
          currentData = { ...currentData, ...stepResult };
        }
        return currentData;
      } catch (error) {
        // Rollback in reverse order
        for (let i = executedSteps.length - 1; i >= 0; i--) {
          const { step, data } = executedSteps[i];
          await step.compensate(data);
        }
        throw error;
      }
    }
  }
  ```
- **Implement Circuit Breaker pattern to prevent cascading failures:**
  ```typescript
  // Example of Circuit Breaker implementation
  class CircuitBreaker {
    private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
    private failureCount = 0;
    private successCount = 0;
    private lastFailureTime?: number;
    
    constructor(
      private readonly name: string,
      private readonly options: {
        failureThreshold: number,
        resetTimeout: number,
        successThreshold: number,
        fallback: (error: Error) => Promise<any>,
      }
    ) {}
    
    async execute<T>(operation: () => Promise<T>): Promise<T> {
      if (this.state === 'OPEN') {
        if (this.lastFailureTime && (Date.now() - this.lastFailureTime) > this.options.resetTimeout) {
          this.state = 'HALF_OPEN';
        } else {
          try {
            return await this.options.fallback(new Error(`Circuit ${this.name} is OPEN`)) as T;
          } catch (error) {
            throw new Error(`Circuit ${this.name} is OPEN and fallback failed`);
          }
        }
      }
      
      try {
        const result = await operation();
        
        if (this.state === 'HALF_OPEN') {
          this.successCount++;
          if (this.successCount >= this.options.successThreshold) {
            this.state = 'CLOSED';
            this.failureCount = 0;
            this.successCount = 0;
          }
        }
        
        return result;
      } catch (error) {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        
        if (this.state === 'CLOSED' && this.failureCount >= this.options.failureThreshold) {
          this.state = 'OPEN';
        }
        
        if (this.state === 'HALF_OPEN') {
          this.state = 'OPEN';
        }
        
        try {
          return await this.options.fallback(error as Error) as T;
        } catch (fallbackError) {
          throw fallbackError;
        }
      }
    }
  }
  ```
- **Implement standardized error reporting with detailed error codes:**
  ```typescript
  // Example error response structure
  interface ErrorResponse {
    error: true;
    message: string;
    code: string;
    category: 'AUTHENTICATION' | 'AUTHORIZATION' | 'VALIDATION' | 'RESOURCE_CONFLICT' | 'EXTERNAL_SERVICE' | 'INTERNAL_ERROR';
    details?: Record<string, any>;
    timestamp: string;
    path: string;
    transactionId: string;
  }
  
  // Middleware for handling errors
  function errorHandlerMiddleware(err, req, res, next) {
    const errorResponse: ErrorResponse = {
      error: true,
      message: err.message || 'An unexpected error occurred',
      code: err.code || 'INTERNAL_ERROR',
      category: err.category || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      path: req.path,
      transactionId: req.headers['x-transaction-id'] || uuidv4()
    };
    
    if (err.details) {
      errorResponse.details = err.details;
    }
    
    // Log error with correlation ID
    logger.error(`[${errorResponse.transactionId}] ${err.stack}`);
    
    res.status(err.statusCode || 500).json(errorResponse);
  }
  ```

### 1.4 API Gateway and User Management (Week 4-5)
- Implement api-gateway with routing to dummy endpoints
- Develop user-service with:
  - User registration and authentication
  - JWT handling (access + refresh tokens)
  - Basic role management
  - Team management
- **Implement secure secret management with HashiCorp Vault**
- **Configure CORS and security headers**
- **Implement rate limiting and request validation**
- Add language preference in user model:
  ```typescript
  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    teamId?: string;
    preferredLanguage: string; // Default value 'en'
    // Other properties...
  }
  ```
- Include user's language preference in JWT token to make it available for all services
- Configure api-gateway to handle Accept-Language headers

### 1.5 Localization Service Implementation (Week 5-6)
- Develop basic localization-service with the following functions:
  - Retrieve available languages
  - Retrieve translations per language
  - Update user's language preference
- Implement API endpoints:
  - GET /api/v1/languages
  - GET /api/v1/translations/:language
  - GET /api/v1/translations/:language/:namespace
  - PUT /api/v1/users/:id/language
- Create translation files for basic system messages in Swedish and English
- **Implement caching of translations for improved performance**
- **Create admin interface for managing translations**

### 1.6 Data Migration Strategy (Week 6-7)
- **Create tools to analyze source data from existing systems:**
  ```typescript
  // Example of data analysis for Excel source files
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
- **Implement ETL process (Extract, Transform, Load) for data migration:**
  ```typescript
  // Example of ETL pipeline
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
      
      // 5. Load data to target system
      const target = new DataTarget({
        type: 'api',
        endpoint: 'https://api.hockeyhub.test/api/v1/users/batch',
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
  ```
- **Create validation tools to verify data migration:**
  ```typescript
  // Example of data validation tool
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
  }
  ```

### 1.7 Frontend Framework and User Authentication (Week 7-8)
- Implement React application with TypeScript and Tailwind CSS
- Create component library with basic UI elements
- **Implement accessible components according to WCAG 2.1 AA standard:**
  ```tsx
  // Example of accessible button component
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
- Implement authentication and user flows in frontend
- Create responsive layouts for mobile and desktop
- **Implement automated accessibility tests:**
  ```typescript
  // Example of Jest test with axe for accessibility
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
  });
  ```
- Integrate i18next for multilingual support:
  ```typescript
  // src/i18n/i18n.ts
  import i18n from 'i18next';
  import { initReactI18next } from 'react-i18next';
  import Backend from 'i18next-http-backend';
  import LanguageDetector from 'i18next-browser-languagedetector';
  
  i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: 'en',
      supportedLngs: ['sv', 'en'],
      ns: ['common', 'auth', 'user'],
      defaultNS: 'common',
      detection: {
        order: ['localStorage', 'cookie', 'navigator'],
        caches: ['localStorage', 'cookie']
      },
      backend: {
        loadPath: '/api/v1/translations/{{lng}}/{{ns}}',
      },
      interpolation: {
        escapeValue: false,
      }
    });
  
  export default i18n;
  ```
- Create language selector component in the user interface
- Implement language preference in user profile settings

## Phase 2: Core Functionality (10 weeks)

### 2.1 Calendar and Scheduling (Week 9-11)
- Develop calendar-service with:
  - CRUD operations for events
  - Event types (training, match, meeting)
  - Location management for events
  - **Advanced resource management for bookable resources**
  - **Conflict detection to prevent double bookings**
- Implement calendar views in frontend:
  - Month view
  - Week view
  - Day view
- **Implement drag-and-drop functionality for events**
- **Implement recurring events with patterns**
- Extend translations with calendar namespace:
  - Month names
  - Weekday names
  - Event types and descriptions
- Implement formatting of dates and times based on user's language
- **Implement testing of calendar functionality:**
  ```typescript
  // Example test for calendar events
  describe('Calendar Events API', () => {
    it('should prevent double booking of resources', async () => {
      // Create a first booking
      const event1 = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Team Practice',
          start: '2023-06-01T10:00:00Z',
          end: '2023-06-01T12:00:00Z',
          location_id: locationId,
          resources: [resourceId]
        });
      
      expect(event1.status).toBe(201);
      
      // Try to book the same resource at overlapping time
      const event2 = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Another Activity',
          start: '2023-06-01T11:00:00Z',
          end: '2023-06-01T13:00:00Z',
          location_id: locationId,
          resources: [resourceId]
        });
      
      expect(event2.status).toBe(409); // Conflict
      expect(event2.body).toHaveProperty('error', true);
      expect(event2.body).toHaveProperty('code', 'RESOURCE_CONFLICT');
      expect(event2.body.details).toHaveProperty('conflictingEventId');
    });
  });
  ```

### 2.2 Communication (Week 12-14)
- Develop communication-service with:
  - WebSocket support for real-time communication
  - Group chat functionality
  - Private chat functionality
  - Notification system
  - **Read receipts and unread message status**
  - **Image attachments with preview**
- Implement chat and notification interfaces in frontend
- **Implement real-time chat updates with Socket.IO:**
  ```typescript
  // Example of Socket.IO implementation
  import { Server } from 'socket.io';
  import http from 'http';
  import jwt from 'jsonwebtoken';
  
  export function setupWebSockets(server: http.Server) {
    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    
    // Middleware for authentication
    io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.data.user = decoded;
        next();
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });
    
    io.on('connection', (socket) => {
      const userId = socket.data.user.id;
      
      // Connect user to their personal room
      socket.join(`user:${userId}`);
      
      // Get user's chat rooms and join them
      getChatRoomsForUser(userId).then(chatRooms => {
        chatRooms.forEach(room => {
          socket.join(`chat:${room.id}`);
        });
      });
      
      // Event for sending a message
      socket.on('send_message', async (data) => {
        try {
          const { chatId, content, attachments } = data;
          
          // Check permission to send message to chat
          if (!await userHasAccessToChat(userId, chatId)) {
            socket.emit('error', { message: 'Permission denied' });
            return;
          }
          
          // Save message to database
          const message = await saveMessage({
            chatId,
            senderId: userId,
            content,
            attachments
          });
          
          // Send to all users in the chat
          io.to(`chat:${chatId}`).emit('new_message', {
            message,
            chat: chatId
          });
          
          // Send notifications to offline users
          sendNotificationsForMessage(message);
        } catch (error) {
          socket.emit('error', { message: 'Could not send message' });
        }
      });
      
      // Event for marking message as read
      socket.on('mark_read', async (data) => {
        try {
          const { messageId } = data;
          await markMessageAsRead(messageId, userId);
          
          // Get chatId from message
          const chatId = await getChatIdFromMessageId(messageId);
          
          // Send update to all users in the chat
          io.to(`chat:${chatId}`).emit('message_read', {
            messageId,
            userId,
            readAt: new Date().toISOString()
          });
        } catch (error) {
          socket.emit('error', { message: 'Could not mark message as read' });
        }
      });
    });
    
    return io;
  }
  ```
- Extend translations with chat-related terms
- Implement support for user's language preference in notifications
- Ensure date display in chats respects user's language preference
- **Implement performance optimization for large chat histories:**
  ```typescript
  // Example of paginated history retrieval
  async function getChatHistory(chatId, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    // Get messages with pagination
    const messages = await database.query(
      `SELECT m.*, u.first_name, u.last_name, u.avatar_url 
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.chat_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [chatId, limit, offset]
    );
    
    // Get read status for the messages
    const messageIds = messages.rows.map(m => m.id);
    const readStatuses = await database.query(
      `SELECT message_id, user_id, read_at 
       FROM message_reads
       WHERE message_id = ANY($1)`,
      [messageIds]
    );
    
    // Associate read status with messages
    const messagesWithReadStatus = messages.rows.map(message => ({
      ...message,
      readBy: readStatuses.rows.filter(rs => rs.message_id === message.id)
    }));
    
    // Get total count of messages for pagination metadata
    const totalCount = await database.query(
      'SELECT COUNT(*) as total FROM messages WHERE chat_id = $1',
      [chatId]
    );
    
    return {
      messages: messagesWithReadStatus,
      pagination: {
        page,
        limit,
        total: parseInt(totalCount.rows[0].total),
        totalPages: Math.ceil(parseInt(totalCount.rows[0].total) / limit)
      }
    };
  }
  ```

### 2.3 Training Planning (Week 15-18)
- Develop training-service with:
  - CRUD for training sessions
  - Division between ice and physical training
  - Exercise library with instruction videos
  - **Data-driven intensity linked to test results**
  - **Session templates with categorization**
  - Test result management
- Implement training planning view in frontend:
  - Exercise library
  - Training creation
  - Training result follow-up
- **Implement "Live Session Execution" with real-time updates:**
  ```typescript
  // Example of Live Session Controller
  class LiveSessionController {
    private readonly sessionRepository: SessionRepository;
    private readonly io: SocketIO.Server;
    
    constructor(sessionRepository: SessionRepository, io: SocketIO.Server) {
      this.sessionRepository = sessionRepository;
      this.io = io;
    }
    
    async startSession(sessionId: string, coachId: string) {
      try {
        // Update session status to 'active'
        const session = await this.sessionRepository.updateStatus(sessionId, 'active');
        
        // Notify participants that session has started
        this.io.to(`session:${sessionId}`).emit('session_started', {
          sessionId,
          startedBy: coachId,
          startTime: new Date().toISOString()
        });
        
        return session;
      } catch (error) {
        throw new ApplicationError('SESSION_START_FAILED', 'Failed to start session', 500);
      }
    }
    
    async updateExercise(sessionId: string, exerciseId: string, updates: Partial<ExerciseProgress>) {
      try {
        // Update exercise status
        const updatedExercise = await this.sessionRepository.updateExerciseProgress(
          sessionId,
          exerciseId,
          updates
        );
        
        // Notify all participants about the update
        this.io.to(`session:${sessionId}`).emit('exercise_updated', {
          sessionId,
          exerciseId,
          updates,
          updatedAt: new Date().toISOString()
        });
        
        return updatedExercise;
      } catch (error) {
        throw new ApplicationError('EXERCISE_UPDATE_FAILED', 'Failed to update exercise', 500);
      }
    }
    
    async completeSession(sessionId: string, summary: SessionSummary) {
      try {
        // Update session status to 'completed'
        const session = await this.sessionRepository.updateStatus(sessionId, 'completed');
        
        // Save session summary
        await this.sessionRepository.saveSummary(sessionId, summary);
        
        // Notify all participants that the session has ended
        this.io.to(`session:${sessionId}`).emit('session_completed', {
          sessionId,
          completedAt: new Date().toISOString(),
          summary
        });
        
        return session;
      } catch (error) {
        throw new ApplicationError('SESSION_COMPLETION_FAILED', 'Failed to complete session', 500);
      }
    }
  }
  ```
- Extend translations with training-related terminology
- Implement support for language-specific exercise descriptions
- Ensure measurements (weight, length, etc.) are displayed correctly according to language conventions
- **Implement testing for intensity calculations:**
  ```typescript
  // Example test for intensity calculations
  describe('Training Intensity Calculation', () => {
    it('should calculate correct percentage of 1RM', () => {
      const playerData = {
        testResults: [
          {
            testId: 'bench_press_1rm',
            value: 100,
            date: '2023-05-01'
          }
        ]
      };
      
      const exercise = {
        type: 'strength',
        intensityType: 'percentage_1rm',
        intensityValue: 75,
        intensityReference: 'bench_press_1rm'
      };
      
      const calculator = new IntensityCalculator();
      const result = calculator.calculateIntensity(exercise, playerData);
      
      expect(result).toBe(75); // 75% of 100 kg = 75 kg
    });
    
    it('should calculate correct percentage of max heart rate', () => {
      const playerData = {
        testResults: [
          {
            testId: 'max_heart_rate',
            value: 190,
            date: '2023-05-01'
          }
        ]
      };
      
      const exercise = {
        type: 'cardio',
        intensityType: 'percentage_mhr',
        intensityValue: 80,
        intensityReference: 'max_heart_rate'
      };
      
      const calculator = new IntensityCalculator();
      const result = calculator.calculateIntensity(exercise, playerData);
      
      expect(result).toBe(152); // 80% of 190 bpm = 152 bpm
    });
  });
  ```

## Phase 3: Extended Functionality (8 weeks)

### 3.1 Medical Management (Week 19-21)
- Develop medical-service with:
  - Injury registration
  - Treatment follow-up
  - Privacy-protected medical records
  - **Structured treatment plans with phase division**
  - **Player status and availability**
- Implement injury and treatment views in frontend
- Implement privacy functions for sensitive data
- **Implement strict access control for medical data:**
  ```typescript
  // Example of access control for medical data
  class MedicalDataAccessControl {
    async canAccessMedicalRecord(userId: string, patientId: string): Promise<boolean> {
      // Check user's role
      const userRole = await getUserRole(userId);
      
      // Admin always has access
      if (userRole === 'admin') {
        return true;
      }
      
      // Medical staff has access to players under their responsibility
      if (userRole === 'rehab') {
        return await isPlayerAssignedToMedicalStaff(patientId, userId);
      }
      
      // Coaches have limited access (only status information)
      if (userRole === 'coach') {
        return await isPlayerInCoachTeam(patientId, userId);
      }
      
      // Players can only access their own information
      if (userRole === 'player') {
        return userId === patientId;
      }
      
      // Parents have access to their children's information
      if (userRole === 'parent') {
        return await isParentOfPlayer(userId, patientId);
      }
      
      return false;
    }
    
    async filterMedicalData(userId: string, patientId: string, medicalData: any): Promise<any> {
      const userRole = await getUserRole(userId);
      
      // Full information for medical team and admin
      if (userRole === 'admin' || userRole === 'rehab') {
        return medicalData;
      }
      
      // Coaches get limited information
      if (userRole === 'coach') {
        return {
          player: medicalData.player,
          status: medicalData.status,
          availabilityDate: medicalData.availabilityDate,
          restrictions: medicalData.restrictions,
          // No detailed medical information
        };
      }
      
      // Players and parents get full information if it's their own data
      if ((userRole === 'player' && userId === patientId) || 
          (userRole === 'parent' && await isParentOfPlayer(userId, patientId))) {
        return medicalData;
      }
      
      // Default case is to deny access
      throw new ApplicationError('ACCESS_DENIED', 'No access to medical data', 403);
    }
  }
  ```
- Extend translations with medical terminology
- Create specialized medical glossary for correct terms in different languages
- Ensure all medical documentation is available in the user's preferred language
- **Implement timeline view for injury progression:**
  ```typescript
  // Example of timeline data structure
  interface TimelineEvent {
    id: string;
    type: 'injury' | 'diagnosis' | 'treatment' | 'progress_note' | 'status_change';
    date: string;
    description: string;
    createdBy: {
      id: string;
      name: string;
      role: string;
    };
    details: Record<string, any>;
  }
  
  // Function to retrieve timeline for an injury
  async function getInjuryTimeline(injuryId: string): Promise<TimelineEvent[]> {
    // Get basic injury information
    const injury = await database.query(
      'SELECT * FROM injuries WHERE id = $1',
      [injuryId]
    );
    
    // Get all related events
    const treatments = await database.query(
      'SELECT * FROM treatments WHERE injury_id = $1 ORDER BY date',
      [injuryId]
    );
    
    const progressNotes = await database.query(
      'SELECT * FROM injury_updates WHERE injury_id = $1 ORDER BY date',
      [injuryId]
    );
    
    const statusChanges = await database.query(
      'SELECT * FROM player_availability_status WHERE injury_id = $1 ORDER BY effective_from',
      [injuryId]
    );
    
    // Convert raw data to timeline events
    const timelineEvents: TimelineEvent[] = [];
    
    // Add injury as first event
    timelineEvents.push({
      id: `injury-${injury.rows[0].id}`,
      type: 'injury',
      date: injury.rows[0].date_occurred,
      description: 'Injury occurred',
      createdBy: await getUserInfo(injury.rows[0].reported_by),
      details: {
        mechanism: injury.rows[0].mechanism,
        bodyPart: injury.rows[0].body_part,
        severity: injury.rows[0].severity
      }
    });
    
    // Convert treatments to timeline events
    treatments.rows.forEach(treatment => {
      timelineEvents.push({
        id: `treatment-${treatment.id}`,
        type: 'treatment',
        date: treatment.date,
        description: treatment.treatment_type,
        createdBy: await getUserInfo(treatment.performed_by_user_id),
        details: {
          notes: treatment.notes,
          duration: treatment.duration
        }
      });
    });
    
    // Convert progress-notes to timeline events
    // ... similar code for other event types
    
    // Sort all events by date
    return timelineEvents.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }
  ```

### 3.2 AI Implementation (Week 22-24)
- **Implement AI-assisted training and rehab:**
  ```typescript
  // Example of AI service with Gemini integration
  import { GoogleGenerativeAI } from '@google/generative-ai';

  class TrainingProgramGenerator {
    private genAI: any;
    private model: any;
    private costManager: AICostManager;
    
    constructor() {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
      this.costManager = new AICostManager();
    }
    
    async generateProgram(playerData, programType, phase) {
      // Anonymize player data
      const anonymizedData = this.anonymizePlayerData(playerData);
      
      // Check AI cost control
      const estimatedTokens = this.estimateTokens(anonymizedData, programType, phase);
      const allowanceCheck = await this.costManager.checkAllowance('gemini-2.5-pro', estimatedTokens);
      
      if (!allowanceCheck) {
        // Use local fallback if we can't use the AI service
        return this.generateFallbackProgram(anonymizedData, programType, phase);
      }
      
      const prompt = this.buildPrompt(anonymizedData, programType, phase);
      
      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Record actual usage
        this.costManager.recordUsage('gemini-2.5-pro', estimatedTokens, this.calculateActualCost(text));
        
        return this.parseResponse(text);
      } catch (error) {
        console.error('AI generation failed:', error);
        // Fallback to locally generated program
        return this.generateFallbackProgram(anonymizedData, programType, phase);
      }
    }
    
    private anonymizePlayerData(playerData) {
      return {
        age: playerData.age,
        position: playerData.position,
        height: playerData.height,
        weight: playerData.weight,
        testResults: playerData.testResults,
        // No personally identifiable information sent
      };
    }
    
    private buildPrompt(playerData, programType, phase) {
      if (programType === 'training') {
        return `
          Create a training program for a hockey player with the following characteristics:
          
          Position: ${playerData.position}
          Age: ${playerData.age}
          Height: ${playerData.height} cm
          Weight: ${playerData.weight} kg
          Test results: ${JSON.stringify(playerData.testResults)}
          Season phase: ${phase}
          
          The program should include exercises, sets, repetitions, and intensity.
          Include an explanation of why these exercises are suitable for this type of player.
        `;
      } else if (programType === 'rehab') {
        return `
          Create a rehabilitation program for a hockey player with the following characteristics:
          
          Position: ${playerData.position}
          Age: ${playerData.age}
          Injury type: ${playerData.injuryType}
          Rehabilitation phase: ${phase}
          
          The program should contain progressive exercises appropriate for the current phase of rehabilitation.
          Include precautions and criteria for progressing to the next phase.
        `;
      }
    }
    
    private parseResponse(responseText) {
      // Convert text response to structured program object
      // Parse exercises, intensity, etc.
      // ...
    }
    
    private generateFallbackProgram(playerData, programType, phase) {
      // Use rule-based logic to generate a standard program
      // based on player position, age, etc.
      // ...
    }
  }
  
  // Cost control for AI usage
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
- **Implement user interface for AI-generated programs:**
  ```tsx
  // AIGeneratedProgramView.tsx
  import React, { useState } from 'react';
  import { useTranslation } from 'react-i18next';
  import { useParams } from 'react-router-dom';
  import { Button } from '../components/Button';
  import { ProgramEditor } from '../components/ProgramEditor';
  
  export const AIGeneratedProgramView: React.FC = () => {
    const { t } = useTranslation(['training', 'common']);
    const { playerId } = useParams<{ playerId: string }>();
    const [loading, setLoading] = useState(false);
    const [generatedProgram, setGeneratedProgram] = useState(null);
    const [parameters, setParameters] = useState({
      programType: 'training',
      phase: 'pre_season',
      focusArea: 'strength'
    });
    
    const handleParameterChange = (e) => {
      setParameters({
        ...parameters,
        [e.target.name]: e.target.value
      });
    };
    
    const generateProgram = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/v1/ai/generate-program`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            playerId,
            ...parameters
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate program');
        }
        
        const program = await response.json();
        setGeneratedProgram(program);
      } catch (error) {
        console.error('Error generating program:', error);
        // Show error message to user
      } finally {
        setLoading(false);
      }
    };
    
    const saveProgram = async (modifiedProgram) => {
      try {
        const response = await fetch(`/api/v1/training/programs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            playerId,
            program: modifiedProgram,
            source: 'ai_generated'
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to save program');
        }
        
        // Handle successful save
      } catch (error) {
        console.error('Error saving program:', error);
        // Show error message to user
      }
    };
    
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">{t('training:aiProgram.title')}</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">{t('training:aiProgram.parameters')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('training:aiProgram.programType')}
              </label>
              <select
                name="programType"
                value={parameters.programType}
                onChange={handleParameterChange}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="training">{t('training:aiProgram.typeTraining')}</option>
                <option value="rehab">{t('training:aiProgram.typeRehab')}</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('training:aiProgram.phase')}
              </label>
              <select
                name="phase"
                value={parameters.phase}
                onChange={handleParameterChange}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="pre_season">{t('training:aiProgram.preseason')}</option>
                <option value="in_season">{t('training:aiProgram.inseason')}</option>
                <option value="post_season">{t('training:aiProgram.postseason')}</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('training:aiProgram.focusArea')}
              </label>
              <select
                name="focusArea"
                value={parameters.focusArea}
                onChange={handleParameterChange}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="strength">{t('training:aiProgram.strength')}</option>
                <option value="speed">{t('training:aiProgram.speed')}</option>
                <option value="endurance">{t('training:aiProgram.endurance')}</option>
                <option value="agility">{t('training:aiProgram.agility')}</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <Button 
              variant="primary"
              isLoading={loading}
              onClick={generateProgram}
            >
              {t('training:aiProgram.generateButton')}
            </Button>
          </div>
        </div>
        
        {generatedProgram && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">{t('training:aiProgram.result')}</h2>
            
            <ProgramEditor
              initialProgram={generatedProgram}
              onSave={saveProgram}
              readOnly={false}
            />
          </div>
        )}
      </div>
    );
  };
  ```
- **Implement testing of AI integration:**
  ```typescript
  // Example test for AI integration
  describe('AI Training Program Generator', () => {
    beforeEach(() => {
      // Mock AI API calls
      jest.spyOn(global, 'fetch').mockImplementation((url) => {
        if (url.includes('gemini')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              text: () => 'Mocked AI response with training program...'
            })
          });
        }
        // Other mock responses for other API calls
      });
    });
    
    afterEach(() => {
      jest.restoreAllMocks();
    });
    
    it('should generate a training program using AI', async () => {
      const generator = new TrainingProgramGenerator();
      const playerData = {
        age: 25,
        position: 'forward',
        height: 182,
        weight: 84,
        testResults: [
          { test: 'bench_press', value: 100, unit: 'kg' },
          { test: 'squat', value: 140, unit: 'kg' }
        ]
      };
      
      const program = await generator.generateProgram(
        playerData,
        'training',
        'pre_season'
      );
      
      expect(program).toBeDefined();
      expect(program.exercises).toBeInstanceOf(Array);
      expect(program.exercises.length).toBeGreaterThan(0);
    });
    
    it('should use fallback when AI service is unavailable', async () => {
      // Mock AICostManager to deny allowance
      jest.spyOn(AICostManager.prototype, 'checkAllowance')
        .mockResolvedValue(false);
      
      const generator = new TrainingProgramGenerator();
      const playerData = {
        age: 25,
        position: 'forward',
        height: 182,
        weight: 84,
        testResults: []
      };
      
      const program = await generator.generateProgram(
        playerData,
        'training',
        'pre_season'
      );
      
      expect(program).toBeDefined();
      expect(program.source).toBe('fallback');
      expect(program.exercises).toBeInstanceOf(Array);
    });
  });
  ```

### 3.3 Season Planning (Week 22-24)
- Develop planning-service with:
  - Season structure
  - Goal setting (team/individual)
  - Training periodization
- Implement planning interface in frontend
- Extend translations with planning-related terms
- Implement language-specific templates for goal formulation and season planning
- **Implement periodization and training cycles:**
  ```typescript
  // Example of data structure for periodization
  interface Season {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    teamId: string;
    phases: SeasonPhase[];
  }
  
  interface SeasonPhase {
    id: string;
    name: string;
    type: 'pre_season' | 'regular_season' | 'playoffs' | 'off_season';
    startDate: string;
    endDate: string;
    focus: string[];
    description: string;
    cycles: TrainingCycle[];
  }
  
  interface TrainingCycle {
    id: string;
    type: 'macro' | 'meso' | 'micro';
    name: string;
    startDate: string;
    endDate: string;
    focus: string;
    load: 'high' | 'medium' | 'low';
    description: string;
    subcycles?: TrainingCycle[];
  }
  
  // Example of controller for periodization
  class PeriodizationController {
    private readonly seasonRepository: SeasonRepository;
    
    constructor(seasonRepository: SeasonRepository) {
      this.seasonRepository = seasonRepository;
    }
    
    async createSeason(data: Omit<Season, 'id' | 'phases'>): Promise<Season> {
      // Create new season
      const season = await this.seasonRepository.createSeason({
        ...data,
        phases: []
      });
      
      return season;
    }
    
    async addPhaseToSeason(seasonId: string, phaseData: Omit<SeasonPhase, 'id' | 'cycles'>): Promise<SeasonPhase> {
      // Check that phase dates are within the season
      const season = await this.seasonRepository.getSeasonById(seasonId);
      if (!season) {
        throw new ApplicationError('SEASON_NOT_FOUND', 'Season not found', 404);
      }
      
      if (new Date(phaseData.startDate) < new Date(season.startDate) ||
          new Date(phaseData.endDate) > new Date(season.endDate)) {
        throw new ApplicationError(
          'INVALID_PHASE_DATES', 
          'Phase dates must be within season dates', 
          400
        );
      }
      
      // Check for overlapping phases
      const existingPhases = await this.seasonRepository.getPhasesBySeason(seasonId);
      const hasOverlap = existingPhases.some(phase => 
        (new Date(phaseData.startDate) <= new Date(phase.endDate) &&
         new Date(phaseData.endDate) >= new Date(phase.startDate))
      );
      
      if (hasOverlap) {
        throw new ApplicationError(
          'OVERLAPPING_PHASES', 
          'Phases cannot overlap in time', 
          400
        );
      }
      
      // Create new phase
      const phase = await this.seasonRepository.createPhase({
        ...phaseData,
        seasonId,
        cycles: []
      });
      
      return phase;
    }
    
    async createTrainingCycle(
      phaseId: string, 
      cycleData: Omit<TrainingCycle, 'id' | 'subcycles'>
    ): Promise<TrainingCycle> {
      // Get phase to validate dates
      const phase = await this.seasonRepository.getPhaseById(phaseId);
      if (!phase) {
        throw new ApplicationError('PHASE_NOT_FOUND', 'Phase not found', 404);
      }
      
      if (new Date(cycleData.startDate) < new Date(phase.startDate) ||
          new Date(cycleData.endDate) > new Date(phase.endDate)) {
        throw new ApplicationError(
          'INVALID_CYCLE_DATES', 
          'Cycle dates must be within phase dates', 
          400
        );
      }
      
      // Create new training cycle
      const cycle = await this.seasonRepository.createCycle({
        ...cycleData,
        phaseId,
        subcycles: []
      });
      
      return cycle;
    }
    
    async createSubcycle(
      parentCycleId: string, 
      subcycleData: Omit<TrainingCycle, 'id' | 'subcycles'>
    ): Promise<TrainingCycle> {
      // Validate that parent cycle exists
      const parentCycle = await this.seasonRepository.getCycleById(parentCycleId);
      if (!parentCycle) {
        throw new ApplicationError('CYCLE_NOT_FOUND', 'Parent cycle not found', 404);
      }
      
      // Validate cycle type (macro -> meso -> micro)
      if (parentCycle.type === 'micro') {
        throw new ApplicationError(
          'INVALID_PARENT_CYCLE', 
          'Micro cycles cannot have subcycles', 
          400
        );
      }
      
      if (parentCycle.type === 'macro' && subcycleData.type !== 'meso') {
        throw new ApplicationError(
          'INVALID_SUBCYCLE_TYPE', 
          'Macro cycles can only have meso subcycles', 
          400
        );
      }
      
      if (parentCycle.type === 'meso' && subcycleData.type !== 'micro') {
        throw new ApplicationError(
          'INVALID_SUBCYCLE_TYPE', 
          'Meso cycles can only have micro subcycles', 
          400
        );
      }
      
      // Validate dates
      if (new Date(subcycleData.startDate) < new Date(parentCycle.startDate) ||
          new Date(subcycleData.endDate) > new Date(parentCycle.endDate)) {
        throw new ApplicationError(
          'INVALID_SUBCYCLE_DATES', 
          'Subcycle dates must be within parent cycle dates', 
          400
        );
      }
      
      // Create subcycle
      const subcycle = await this.seasonRepository.createCycle({
        ...subcycleData,
        parentCycleId,
        subcycles: []
      });
      
      return subcycle;
    }
    
    async generateDefaultTrainingCycles(phaseId: string): Promise<TrainingCycle[]> {
      // Get phase
      const phase = await this.seasonRepository.getPhaseById(phaseId);
      if (!phase) {
        throw new ApplicationError('PHASE_NOT_FOUND', 'Phase not found', 404);
      }
      
      // Calculate phase length in days
      const startDate = new Date(phase.startDate);
      const endDate = new Date(phase.endDate);
      const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const createdCycles = [];
      
      // If phase is longer than 28 days, create macro cycles
      if (totalDays >= 28) {
        const numberOfMacroCycles = Math.floor(totalDays / 28);
        
        for (let i = 0; i < numberOfMacroCycles; i++) {
          const macroStart = new Date(startDate);
          macroStart.setDate(startDate.getDate() + (i * 28));
          
          const macroEnd = new Date(macroStart);
          macroEnd.setDate(macroStart.getDate() + 27);
          
          if (macroEnd > endDate) {
            macroEnd.setTime(endDate.getTime());
          }
          
          const macroCycle = await this.seasonRepository.createCycle({
            type: 'macro',
            name: `Macro Cycle ${i + 1}`,