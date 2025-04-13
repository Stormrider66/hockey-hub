        parameters:
          - name: page
            in: query
            schema:
              type: integer
              default: 1
          - name: limit
            in: query
            schema:
              type: integer
              default: 20
          - name: role
            in: query
            schema:
              type: string
          - name: teamId
            in: query
            schema:
              type: string
        security:
          - bearerAuth: []
        responses:
          '200':
            description: Successfully retrieved users
            content:
              application/json:
                schema:
                  type: object
                  properties:
                    data:
                      type: array
                      items:
                        $ref: '#/components/schemas/User'
                    meta:
                      type: object
                      properties:
                        pagination:
                          $ref: '#/components/schemas/Pagination'
          '401':
            description: Unauthorized
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/Error'
  
  components:
    schemas:
      User:
        type: object
        properties:
          id:
            type: string
            format: uuid
          email:
            type: string
            format: email
          firstName:
            type: string
          lastName:
            type: string
          role:
            type: string
            enum: [admin, club_admin, coach, fys_coach, rehab, equipment_manager, player, parent]
          teamId:
            type: string
            format: uuid
            nullable: true
          preferredLanguage:
            type: string
            default: en
          createdAt:
            type: string
            format: date-time
          updatedAt:
            type: string
            format: date-time
      
      UserBasic:
        type: object
        properties:
          id:
            type: string
            format: uuid
          firstName:
            type: string
          lastName:
            type: string
          role:
            type: string
      
      Error:
        type: object
        properties:
          error:
            type: boolean
            default: true
          code:
            type: string
          message:
            type: string
          details:
            type: object
      
      Pagination:
        type: object
        properties:
          page:
            type: integer
          limit:
            type: integer
          total:
            type: integer
          totalPages:
            type: integer
    
    securitySchemes:
      bearerAuth:
        type: http
        scheme: bearer
        bearerFormat: JWT
  ```

## Implementation Guidelines for Each Phase

### Database Work
1. Define table structures and relationships before code implementation
2. Create migrations for each schema change
3. Document database schemas and relationships
4. **Consider character sets and collation for different languages in database design**
5. **Ensure all text can be stored correctly in UTF-8 format**
6. **Implement indexing to optimize searches and filters**

### Microservice Development
1. Start by defining API contracts (endpoints, request/response structures)
2. Implement service layer that handles business logic
3. Follow with unit tests for each significant function
4. Conduct code review before integration with frontend work
5. **Include language parameter in relevant API calls**
6. **Handle language preferences consistently across all services**
7. **Implement circuit breaker pattern for increased resilience**
8. **Use Saga pattern for distributed transactions**

### Frontend Development
1. Create design system and component library early
2. Develop page-by-page according to user flows
3. Implement responsive design from the beginning
4. Test on different devices and browsers
5. **Use i18next for all text-based UI elements**
6. **Test that layout works with longer/shorter texts in different languages**
7. **Ensure correct RTL support in design system (for future language support)**
8. **Implement accessible design according to WCAG 2.1 AA standard**

## Dependencies Between Services

To avoid confusion, it's important to understand dependencies between services:

1. **Primary dependencies**:
   - user-service must be functional before other services
   - api-gateway depends on all services having defined APIs
   - frontend depends on API service contracts
   - **localization-service is needed by almost all other services**

2. **Secondary dependencies**:
   - calendar-service needs user-service for user information
   - training-service needs calendar-service for scheduling
   - statistics-service needs training-service for training data
   - admin-service needs all other services for monitoring
   - **All services with user interaction need language preference from user-service**

## Continuous Quality Assurance

To ensure code consistency throughout the project:

1. Automated code analysis with ESLint in CI/CD pipeline
2. Automated unit tests for each commit
3. Code reviews for each pull request
4. Weekly architecture reviews to ensure consistency
5. **Automated checking of translation files to identify missing translations**
6. **Visual inspection of interfaces in all supported languages**
7. **Automated accessibility tests with axe-core**
8. **Security scanning with OWASP ZAP in CI/CD pipeline**

## Prioritization for Timeline Deviations

If the timeline needs to be adjusted, use the following prioritization order:

1. Core functionality: user management, calendar, communication
2. Training functionality: training planning, follow-up
3. Analysis and statistics
4. Administration and reporting
5. Advanced features and integrations
6. **For multilingual support: prioritize basic support for English and Swedish first, add more languages later**
7. **For AI features: implement rule-based alternatives first, then expand with advanced AI**

## Resource Management for Multilingual Implementation

To ensure effective implementation of multilingual support, the following resource management is recommended:

1. **Developer resources:**
   - Dedicate at least one developer with internationalization experience
   - Appoint a person responsible for translation management
   - Involve frontend developers in multilingual testing

2. **Translation resources:**
   - For initial languages (English/Swedish) - internal team
   - For extended languages - consider professional translators or language experts
   - Create a process for quality control of translations

3. **Tools and processes:**
   - Implement tools to extract translation keys from code
   - Create process to handle new/changed translation keys
   - Establish continuous review of translation quality
   - **Automate caching and invalidation of translations**

By following this phased implementation plan with integrated multilingual support, advanced error handling, CI/CD pipeline, AI implementation, data migration, and accessibility standards, Hockey Hub can be built in a structured way that supports both national and international users from the start.        // Compile the development report
        return {
          player: {
            id: player.id,
            name: `${player.first_name} ${player.last_name}`,
            date_of_birth: player.date_of_birth,
            age: this.calculateAge(player.date_of_birth),
            team: player.team_name,
            position: player.position,
            height: player.height,
            weight: player.weight
          },
          performance: {
            games_played: parseInt(stats.games_played || 0),
            goals: parseInt(stats.goals || 0),
            assists: parseInt(stats.assists || 0),
            points: parseInt(stats.points || 0),
            avg_ice_time: parseInt(stats.avg_ice_time || 0),
            shots: parseInt(stats.shots || 0),
            shot_percentage: parseFloat(stats.shot_percentage || 0)
          },
          physical_tests: Object.entries(testsByCategory).map(([category, tests]) => ({
            category,
            tests
          })),
          injury_history: injuriesResult.rows.map(injury => ({
            id: injury.id,
            body_part: injury.body_part,
            injury_type: injury.injury_type,
            date_occurred: injury.date_occurred,
            date_recovered: injury.date_recovered,
            days_out: parseInt(injury.days_out)
          })),
          training_load: trainingResult.rows.map(row => ({
            year: parseInt(row.year),
            month: parseInt(row.month),
            session_count: parseInt(row.session_count),
            total_minutes: parseInt(row.total_minutes)
          })),
          development_recommendations: this.generateDevelopmentRecommendations(
            player,
            testsByCategory,
            injuriesResult.rows
          )
        };
      } catch (error) {
        console.error('Error generating player development report:', error);
        if (error instanceof ApplicationError) {
          throw error;
        }
        
        throw new ApplicationError(
          'REPORT_GENERATION_ERROR',
          'Failed to generate player development report',
          500
        );
      }
    }
    
    private calculateAge(dateOfBirth: string): number {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    }
    
    private generateDevelopmentRecommendations(
      player: any,
      testsByCategory: Record<string, any[]>,
      injuries: any[]
    ): DevelopmentRecommendation[] {
      const recommendations: DevelopmentRecommendation[] = [];
      
      // Analyze strength tests
      if (testsByCategory.strength) {
        const latestStrengthTests = testsByCategory.strength.filter(t => 
          new Date(t.date).getTime() > Date.now() - 90 * 24 * 60 * 60 * 1000 // Last 90 days
        );
        
        // Example: Check for imbalance between legs
        const rightLegStrength = latestStrengthTests.find(t => t.name === 'leg_press_right');
        const leftLegStrength = latestStrengthTests.find(t => t.name === 'leg_press_left');
        
        if (rightLegStrength && leftLegStrength) {
          const diff = Math.abs(rightLegStrength.value - leftLegStrength.value);
          const percentDiff = (diff / Math.max(rightLegStrength.value, leftLegStrength.value)) * 100;
          
          if (percentDiff > 10) {
            recommendations.push({
              category: 'strength',
              priority: 'high',
              description: 'Address leg strength imbalance',
              rationale: `There is a ${percentDiff.toFixed(1)}% difference between right and left leg strength.`,
              suggested_actions: [
                'Include unilateral exercises focusing on the weaker leg',
                'Monitor progress with regular testing',
                'Consider consultation with physiotherapist'
              ]
            });
          }
        }
      }
      
      // Analyze recent injuries
      const recentInjuries = injuries.filter(i => 
        new Date(i.date_occurred).getTime() > Date.now() - 365 * 24 * 60 * 60 * 1000 // Last year
      );
      
      if (recentInjuries.length > 0) {
        // Group by body part
        const bodyPartCounts = {};
        recentInjuries.forEach(injury => {
          bodyPartCounts[injury.body_part] = (bodyPartCounts[injury.body_part] || 0) + 1;
        });
        
        // Find recurring issues
        Object.entries(bodyPartCounts).forEach(([bodyPart, count]) => {
          if (count >= 2) {
            recommendations.push({
              category: 'injury_prevention',
              priority: 'high',
              description: `Recurring ${bodyPart} injuries`,
              rationale: `Player has had ${count} injuries to the ${bodyPart} in the past year.`,
              suggested_actions: [
                'Implement specific prehabilitation program',
                'Review technique and form in relevant movements',
                'Consider equipment adjustments if relevant'
              ]
            });
          }
        });
      }
      
      // Analyze player position and age for specific recommendations
      if (player.position === 'FORWARD' && this.calculateAge(player.date_of_birth) < 23) {
        // Young forward
        recommendations.push({
          category: 'skill_development',
          priority: 'medium',
          description: 'Shooting accuracy development',
          rationale: 'Young forwards benefit from focused shooting development.',
          suggested_actions: [
            'Add 200 shots per week in varied game-like situations',
            'Include reaction-based shooting drills',
            'Track accuracy metrics weekly'
          ]
        });
      }
      
      return recommendations;
    }
  }
  ```
- Extend multilingual support for advanced analysis reports
- Implement language-specific insights and recommendations

### 5.2 External Integrations (Week 35-36)
- Implement integration with external devices:
  - GPS trackers
  - Heart rate monitors
  - Video services
- Develop API for external consumers
- Ensure external integrations support different languages
- Implement translation of data from external sources when needed
- **Implement integration with heart rate monitors:**
  ```typescript
  // Example of integration with heart rate monitors
  interface HeartRateData {
    deviceId: string;
    userId: string;
    timestamp: string;
    heartRate: number;
    confidence: number;
  }
  
  class HeartRateIntegrationService {
    private readonly database: Database;
    
    constructor(database: Database) {
      this.database = database;
    }
    
    async processHeartRateData(data: HeartRateData[]): Promise<{ success: boolean; processedCount: number }> {
      try {
        if (!data.length) {
          return { success: true, processedCount: 0 };
        }
        
        // Validate data
        const validData = data.filter(item => 
          item.deviceId && 
          item.userId && 
          item.timestamp && 
          typeof item.heartRate === 'number' && 
          item.heartRate > 0
        );
        
        if (validData.length === 0) {
          throw new ApplicationError(
            'INVALID_DATA',
            'No valid heart rate data found in payload',
            400
          );
        }
        
        // Save data to database
        const insertValues = validData.map(item => `(
          '${item.deviceId}', 
          '${item.userId}', 
          '${new Date(item.timestamp).toISOString()}', 
          ${item.heartRate}, 
          ${item.confidence || 'NULL'}
        )`).join(',');
        
        const query = `
          INSERT INTO heart_rate_data (
            device_id, 
            user_id, 
            timestamp, 
            heart_rate, 
            confidence
          ) 
          VALUES ${insertValues}
          ON CONFLICT (user_id, timestamp) 
          DO UPDATE SET 
            heart_rate = EXCLUDED.heart_rate,
            confidence = EXCLUDED.confidence
        `;
        
        await this.database.query(query);
        
        // Analyze data for ongoing training sessions
        await this.analyzeSessionHeartRate(validData);
        
        return { success: true, processedCount: validData.length };
      } catch (error) {
        console.error('Error processing heart rate data:', error);
        if (error instanceof ApplicationError) {
          throw error;
        }
        
        throw new ApplicationError(
          'PROCESSING_ERROR',
          'Failed to process heart rate data',
          500
        );
      }
    }
    
    async getUserHeartRateData(
      userId: string, 
      startTime: string, 
      endTime: string
    ): Promise<{
      userId: string;
      data: Array<{ timestamp: string; heartRate: number; confidence?: number }>;
      summary: { 
        avg: number; 
        max: number; 
        min: number;
        zones: Record<string, number>;
      };
    }> {
      try {
        // Get basic heart rate data
        const dataQuery = `
          SELECT 
            timestamp, 
            heart_rate, 
            confidence
          FROM heart_rate_data
          WHERE user_id = $1
          AND timestamp BETWEEN $2 AND $3
          ORDER BY timestamp ASC
        `;
        
        const dataResult = await this.database.query(dataQuery, [userId, startTime, endTime]);
        
        if (dataResult.rows.length === 0) {
          return {
            userId,
            data: [],
            summary: { avg: 0, max: 0, min: 0, zones: {} }
          };
        }
        
        // Calculate summary statistics
        const heartRates = dataResult.rows.map(row => parseInt(row.heart_rate));
        const avg = heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length;
        const max = Math.max(...heartRates);
        const min = Math.min(...heartRates);
        
        // Get player's max heart rate for zone calculations
        const userQuery = `
          SELECT MAX(value) as max_hr
          FROM test_results
          WHERE player_id = $1
          AND test_id = (SELECT id FROM test_definitions WHERE name = 'max_heart_rate')
        `;
        
        const userResult = await this.database.query(userQuery, [userId]);
        const maxHR = userResult.rows[0]?.max_hr || 220 - 25; // Fallback to age-based formula
        
        // Calculate time in different heart rate zones
        const zones = {
          zone1: 0, // 50-60% of max heart rate
          zone2: 0, // 60-70% of max heart rate
          zone3: 0, // 70-80% of max heart rate
          zone4: 0, // 80-90% of max heart rate
          zone5: 0  // 90-100% of max heart rate
        };
        
        dataResult.rows.forEach((row, index) => {
          const hr = parseInt(row.heart_rate);
          const hrPercentage = (hr / maxHR) * 100;
          
          if (hrPercentage < 60) {
            zones.zone1++;
          } else if (hrPercentage < 70) {
            zones.zone2++;
          } else if (hrPercentage < 80) {
            zones.zone3++;
          } else if (hrPercentage < 90) {
            zones.zone4++;
          } else {
            zones.zone5++;
          }
        });
        
        // Convert number of data points to time (assuming data is sampled every second)
        Object.keys(zones).forEach(zone => {
          zones[zone] = Math.round(zones[zone] / 60); // Convert to minutes
        });
        
        return {
          userId,
          data: dataResult.rows.map(row => ({
            timestamp: row.timestamp,
            heartRate: parseInt(row.heart_rate),
            ...(row.confidence ? { confidence: parseFloat(row.confidence) } : {})
          })),
          summary: {
            avg: Math.round(avg),
            max,
            min,
            zones
          }
        };
      } catch (error) {
        console.error('Error retrieving heart rate data:', error);
        throw new ApplicationError(
          'DATA_RETRIEVAL_ERROR',
          'Failed to retrieve heart rate data',
          500
        );
      }
    }
    
    private async analyzeSessionHeartRate(data: HeartRateData[]): Promise<void> {
      try {
        // Group data by user
        const userDataMap = {};
        data.forEach(item => {
          if (!userDataMap[item.userId]) {
            userDataMap[item.userId] = [];
          }
          userDataMap[item.userId].push(item);
        });
        
        // Analyze data for each user
        await Promise.all(Object.entries(userDataMap).map(async ([userId, userData]) => {
          // Check if there's an ongoing session
          const sessionQuery = `
            SELECT id
            FROM active_training_sessions
            WHERE player_id = $1
            AND status = 'in_progress'
          `;
          
          const sessionResult = await this.database.query(sessionQuery, [userId]);
          
          if (sessionResult.rows.length === 0) {
            return; // No active session for this user
          }
          
          const sessionId = sessionResult.rows[0].id;
          
          // Calculate average heart rate for this batch of data
          const heartRates = userData.map(item => item.heartRate);
          const avgHeartRate = heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length;
          const maxHeartRate = Math.max(...heartRates);
          
          // Update session data
          await this.database.query(
            `
            UPDATE active_training_sessions
            SET 
              current_heart_rate = $1,
              max_heart_rate = GREATEST(max_heart_rate, $2),
              last_heart_rate_update = NOW()
            WHERE id = $3
            `,
            [avgHeartRate, maxHeartRate, sessionId]
          );
        }));
      } catch (error) {
        console.error('Error analyzing session heart rate:', error);
        // Just log the error here, so it doesn't affect data processing
      }
    }
  }
  ```

### 5.3 Extended Multilingual Support (Week 33-36)
- Add support for more languages based on user demand:
  - Finnish
  - Norwegian
  - Danish
- Implement more advanced internationalization features:
  - Plural forms
  - Gender forms
  - Context-dependent translations
- Improve language selector with flags and native language names
- Implement automatic language detection based on user's browser settings

## Phase 6: Testing, Security and Documentation (4 weeks)

### 6.1 Comprehensive Testing (Week 37-38)
- Perform complete unit tests for all services
- Conduct integration tests between services
- Perform load and performance tests
- Conduct usability tests with actual users
- **Test specifically multilingual functionality:**
  - Verification of all UI elements in all languages
  - Testing of language switching and maintaining language preference
  - Testing of language-specific formatting of dates, numbers, and currencies
  - Testing of special characters and different character sets
- **Implement automated end-to-end tests:**
  ```typescript
  // Example of Cypress test for calendar functionality
  describe('Calendar Flow', () => {
    beforeEach(() => {
      cy.login('coach@example.com', 'password123');
      cy.visit('/calendar');
    });
    
    it('should create an event and check it appears correctly', () => {
      // Click on a day in the calendar
      cy.get('.calendar-day[data-date="2023-06-15"]').click();
      
      // Fill in event details
      cy.get('#event-title').type('Ice Training - Passing Exercises');
      cy.get('#event-start-time').type('18:00');
      cy.get('#event-end-time').type('19:30');
      cy.get('#event-type').select('ice_training');
      cy.get('#event-location').select('Skellefteå Kraft Arena');
      
      // Select resource (hall A)
      cy.get('#resource-selector').click();
      cy.get('.resource-option[data-resource-id="hall-a"]').click();
      
      // Save the event
      cy.get('#save-event-button').click();
      
      // Check that it was created
      cy.get('.success-message').should('be.visible');
      
      // Check that it appears in the calendar
      cy.get('.calendar-event').contains('Ice Training - Passing Exercises').should('be.visible');
      
      // Open details and check time and location
      cy.get('.calendar-event').contains('Ice Training - Passing Exercises').click();
      cy.get('.event-details').should('contain', '18:00 - 19:30');
      cy.get('.event-details').should('contain', 'Skellefteå Kraft Arena');
      cy.get('.event-details').should('contain', 'Hall A');
      
      // Switch language to Swedish
      cy.get('.language-selector').click();
      cy.get('.language-option[data-lang="sv"]').click();
      
      // Check that the event is shown in Swedish
      cy.get('.calendar-event').contains('Isträning - Passningsövningar').should('be.visible');
      
      // Open details and check translations
      cy.get('.calendar-event').contains('Isträning - Passningsövningar').click();
      cy.get('.event-details').should('contain', '18:00 - 19:30');  // Time format same in Swedish
      cy.get('.event-details').should('contain', 'Skellefteå Kraft Arena');  // Location name not translated
      cy.get('.event-details').should('contain', 'Hall A');  // Resource name not translated
    });
    
    it('should handle resource conflicts correctly', () => {
      // Create a first event
      cy.get('.calendar-day[data-date="2023-06-16"]').click();
      cy.get('#event-title').type('Training 1');
      cy.get('#event-start-time').type('17:00');
      cy.get('#event-end-time').type('18:30');
      cy.get('#event-type').select('ice_training');
      cy.get('#event-location').select('Skellefteå Kraft Arena');
      cy.get('#resource-selector').click();
      cy.get('.resource-option[data-resource-id="hall-a"]').click();
      cy.get('#save-event-button').click();
      cy.get('.success-message').should('be.visible');
      
      // Try to create overlapping event
      cy.get('.calendar-day[data-date="2023-06-16"]').click();
      cy.get('#event-title').type('Training 2');
      cy.get('#event-start-time').type('18:00');  // Overlapping time
      cy.get('#event-end-time').type('19:30');
      cy.get('#event-type').select('ice_training');
      cy.get('#event-location').select('Skellefteå Kraft Arena');
      cy.get('#resource-selector').click();
      cy.get('.resource-option[data-resource-id="hall-a"]').click();
      cy.get('#save-event-button').click();
      
      // Check that error message is shown
      cy.get('.error-message').should('be.visible');
      cy.get('.error-message').should('contain', 'Resource conflict');
      
      // Check that information about the conflict is shown
      cy.get('.conflict-info').should('contain', 'Training 1');
      cy.get('.conflict-info').should('contain', '17:00 - 18:30');
      
      // Check that alternative times are suggested
      cy.get('.alternative-times').should('be.visible');
    });
  });
  ```

### 6.2 Security Audit (Week 39-40)
- Perform security audit of all code
- Conduct penetration tests
- Implement additional security measures based on results
- Ensure GDPR compliance and data integrity
- **Verify that language-related functions do not introduce security problems:**
  - XSS via translation content
  - Injection attacks via language parameters
  - Proper handling of special characters in different languages
- **Implement security audit with OWASP ZAP:**
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
            target: 'https://staging.hockeyhub.test/api/v1'
            rules_file_name: '.zap/rules.tsv'
            cmd_options: '-a'
        
        - name: Upload ZAP report
          uses: actions/upload-artifact@v2
          with:
            name: ZAP Report
            path: report.html
  ```
- **Conduct authentication and authorization tests:**
  ```typescript
  // Example of security test for authentication and authorization
  describe('Authentication Security Tests', () => {
    it('should enforce password complexity requirements', async () => {
      // Test with weak password
      const weakPasswordResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });
      
      expect(weakPasswordResponse.status).toBe(400);
      expect(weakPasswordResponse.body.error).toBe(true);
      expect(weakPasswordResponse.body.message).toContain('password');
      
      // Test with strong password
      const strongPasswordResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'P@ssw0rd!2023',
          firstName: 'Test',
          lastName: 'User'
        });
      
      expect(strongPasswordResponse.status).toBe(201);
    });
    
    it('should lock account after multiple failed login attempts', async () => {
      // Create test user
      await createTestUser({
        email: 'locktest@example.com',
        password: 'CorrectP@ssw0rd!'
      });
      
      // Try to login with wrong password 5 times
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'locktest@example.com',
            password: 'WrongPassword'
          });
        
        expect(response.status).toBe(401);
      }
      
      // Try with correct password after too many attempts
      const finalResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'locktest@example.com',
          password: 'CorrectP@ssw0rd!'
        });
      
      // Check that account is locked
      expect(finalResponse.status).toBe(403);
      expect(finalResponse.body.error).toBe(true);
      expect(finalResponse.body.code).toBe('ACCOUNT_LOCKED');
    });
    
    it('should correctly enforce role-based access controls', async () => {
      // Create user with player role
      const { token } = await createTestUserAndLogin({
        email: 'player@example.com',
        password: 'SecureP@ss123',
        role: 'player'
      });
      
      // Try to access admin endpoint
      const adminResponse = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${token}`);
      
      // Check that access is denied
      expect(adminResponse.status).toBe(403);
      
      // Check correct access to player endpoint
      const playerResponse = await request(app)
        .get('/api/v1/player/profile')
        .set('Authorization', `Bearer ${token}`);
      
      expect(playerResponse.status).toBe(200);
    });
  });
  ```
- **Conduct medical data security audit:**
  ```typescript
  // Tests for medical data security
  describe('Medical Data Security Tests', () => {
    let playerToken;
    let coachToken;
    let rehabToken;
    let adminToken;
    let playerId;
    
    beforeAll(async () => {
      // Create test users with different roles
      const playerData = await createTestUserAndLogin({
        email: 'player@example.com',
        password: 'SecureP@ss123',
        role: 'player'
      });
      playerToken = playerData.token;
      playerId = playerData.userId;
      
      coachToken = (await createTestUserAndLogin({
        email: 'coach@example.com',
        password: 'SecureP@ss123',
        role: 'coach'
      })).token;
      
      rehabToken = (await createTestUserAndLogin({
        email: 'rehab@example.com',
        password: 'SecureP@ss123',
        role: 'rehab'
      })).token;
      
      adminToken = (await createTestUserAndLogin({
        email: 'admin@example.com',
        password: 'SecureP@ss123',
        role: 'admin'
      })).token;
      
      // Create a test injury for the player
      await request(app)
        .post('/api/v1/medical/injuries')
        .set('Authorization', `Bearer ${rehabToken}`)
        .send({
          playerId,
          bodyPart: 'knee',
          injuryType: 'sprain',
          dateOccurred: '2023-05-01',
          description: 'Test injury'
        });
    });
    
    it('should allow players to access only their own medical data', async () => {
      // Player can see their own data
      const ownDataResponse = await request(app)
        .get(`/api/v1/medical/players/${playerId}/injuries`)
        .set('Authorization', `Bearer ${playerToken}`);
      
      expect(ownDataResponse.status).toBe(200);
      
      // Player cannot see another player's data
      const otherPlayerResponse = await request(app)
        .get('/api/v1/medical/players/different-player-id/injuries')
        .set('Authorization', `Bearer ${playerToken}`);
      
      expect(otherPlayerResponse.status).toBe(403);
    });
    
    it('should properly restrict medical data access based on role', async () => {
      // Rehab has full access
      const rehabResponse = await request(app)
        .get(`/api/v1/medical/players/${playerId}/injuries`)
        .set('Authorization', `Bearer ${rehabToken}`);
      
      expect(rehabResponse.status).toBe(200);
      expect(rehabResponse.body.injuries[0]).toHaveProperty('description');
      expect(rehabResponse.body.injuries[0]).toHaveProperty('treatmentNotes');
      
      // Coach has limited access
      const coachResponse = await request(app)
        .get(`/api/v1/medical/players/${playerId}/injuries`)
        .set('Authorization', `Bearer ${coachToken}`);
      
      expect(coachResponse.status).toBe(200);
      expect(coachResponse.body.injuries[0]).toHaveProperty('bodyPart');
      expect(coachResponse.body.injuries[0]).toHaveProperty('status');
      expect(coachResponse.body.injuries[0]).not.toHaveProperty('description');
      expect(coachResponse.body.injuries[0]).not.toHaveProperty('treatmentNotes');
    });
    
    it('should use encrypted connection for all medical data requests', async () => {
      // This test depends on the server being configured with HTTPS
      // and can only be run in a test environment with actual TLS/SSL
      
      // Simulates how an HTTP request would be denied/redirected
      // In a real environment, we would use cypress or similar to test this
      if (process.env.NODE_ENV === 'test') {
        // Simulate test in test environment
        console.log('Encrypted connection test skipped in test environment');
      }
    });
  });
  ```

### 6.3 Documentation and Knowledge Transfer (Week 39-40)
- Complete API documentation
- Create end-user documentation
- Develop administration guides
- Conduct knowledge transfer to support and maintenance team
- **Create documentation in all supported languages**
- **Document the multilingual architecture for future developers**
- **Create guidelines for adding new languages to the system**
- **Implement API documentation with OpenAPI:**
  ```yaml
  # openapi.yaml
  openapi: 3.0.0
  info:
    title: Hockey Hub API
    description: Comprehensive API for the Hockey Hub platform
    version: 1.0.0
  servers:
    - url: https://api.hockeyhub.com/api/v1
      description: Production API server
    - url: https://staging.hockeyhub.com/api/v1
      description: Staging API server
    - url: http://localhost:3000/api/v1
      description: Local development server
  
  tags:
    - name: Auth
      description: Authentication and authorization
    - name: Users
      description: User management
    - name: Teams
      description: Team management
    - name: Calendar
      description: Calendar and scheduling
    - name: Training
      description: Training plans and sessions
    - name: Medical
      description: Medical records and injury management
    - name: Communication
      description: Messaging and notifications
    - name: Statistics
      description: Performance statistics and analytics
  
  paths:
    /auth/login:
      post:
        summary: Authenticate user
        description: Authenticate with email and password to receive JWT tokens
        tags:
          - Auth
        requestBody:
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  email:
                    type: string
                    format: email
                  password:
                    type: string
                    format: password
                required:
                  - email
                  - password
        responses:
          '200':
            description: Successfully authenticated
            content:
              application/json:
                schema:
                  type: object
                  properties:
                    accessToken:
                      type: string
                    refreshToken:
                      type: string
                    user:
                      $ref: '#/components/schemas/UserBasic'
          '401':
            description: Invalid credentials
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/Error'
  
    /users:
      get:
        summary: List users
        description: Get a list of users with pagination and filtering
        tags:
          - Users
        parameters:
          - name: page
            in: query
                async addTranslationKey(key: string, context?: string, initialTranslations?: Record<string, string>): Promise<void> {
      try {
        // Validate key
        if (!this.isValidTranslationKey(key)) {
          throw new ApplicationError(
            'INVALID_TRANSLATION_KEY',
            'Translation key must use dot notation (e.g. namespace.section.key)',
            400
          );
        }
        
        // Add translations for all languages
        const languages = await this.getAllLanguages();
        
        await Promise.all(languages.map(async language => {
          const translation = initialTranslations?.[language.code] || '';
          
          await this.database.query(
            'INSERT INTO translations (key, language_code, translation, context) VALUES ($1, $2, $3, $4) ON CONFLICT (key, language_code) DO NOTHING',
            [key, language.code, translation, context]
          );
        }));
      } catch (error) {
        console.error('Error adding translation key:', error);
        if (error instanceof ApplicationError) {
          throw error;
        }
        
        throw new ApplicationError(
          'DATABASE_ERROR',
          'Failed to add translation key',
          500
        );
      }
    }
    
    async exportTranslations(languageCode: string, format: 'json' | 'csv' = 'json'): Promise<string> {
      try {
        const result = await this.database.query(
          'SELECT key, translation FROM translations WHERE language_code = $1 ORDER BY key',
          [languageCode]
        );
        
        if (format === 'json') {
          // Convert to nested JSON structure for i18next
          const nestedJson = {};
          
          result.rows.forEach(row => {
            const keyParts = row.key.split('.');
            let current = nestedJson;
            
            keyParts.forEach((part, index) => {
              if (index === keyParts.length - 1) {
                current[part] = row.translation;
              } else {
                current[part] = current[part] || {};
                current = current[part];
              }
            });
          });
          
          return JSON.stringify(nestedJson, null, 2);
        } else if (format === 'csv') {
          // Create CSV format
          const header = 'key,translation\n';
          const rows = result.rows.map(row => `"${row.key}","${row.translation.replace(/"/g, '""')}"`);
          
          return header + rows.join('\n');
        }
        
        throw new ApplicationError(
          'INVALID_FORMAT',
          'Invalid export format. Supported formats: json, csv',
          400
        );
      } catch (error) {
        console.error('Error exporting translations:', error);
        if (error instanceof ApplicationError) {
          throw error;
        }
        
        throw new ApplicationError(
          'EXPORT_ERROR',
          'Failed to export translations',
          500
        );
      }
    }
    
    async importTranslations(languageCode: string, data: string, format: 'json' | 'csv' = 'json'): Promise<{ added: number, updated: number, failed: number }> {
      try {
        let translations: { key: string, translation: string }[] = [];
        
        if (format === 'json') {
          const json = JSON.parse(data);
          translations = this.flattenJson(json);
        } else if (format === 'csv') {
          translations = this.parseCsv(data);
        } else {
          throw new ApplicationError(
            'INVALID_FORMAT',
            'Invalid import format. Supported formats: json, csv',
            400
          );
        }
        
        // Validate that the language exists
        const languages = await this.getAllLanguages();
        if (!languages.some(l => l.code === languageCode)) {
          throw new ApplicationError(
            'LANGUAGE_NOT_FOUND',
            `Language with code ${languageCode} not found`,
            404
          );
        }
        
        let added = 0;
        let updated = 0;
        let failed = 0;
        
        // Update translations
        for (const { key, translation } of translations) {
          try {
            // Check if the key exists
            const existingResult = await this.database.query(
              'SELECT id FROM translations WHERE key = $1 AND language_code = $2',
              [key, languageCode]
            );
            
            if (existingResult.rows.length > 0) {
              // Update existing translation
              await this.database.query(
                'UPDATE translations SET translation = $3 WHERE key = $1 AND language_code = $2',
                [key, languageCode, translation]
              );
              updated++;
            } else {
              // Create new translation
              await this.database.query(
                'INSERT INTO translations (key, language_code, translation) VALUES ($1, $2, $3)',
                [key, languageCode, translation]
              );
              added++;
            }
          } catch (error) {
            console.error(`Error importing translation for key ${key}:`, error);
            failed++;
          }
        }
        
        return { added, updated, failed };
      } catch (error) {
        console.error('Error importing translations:', error);
        if (error instanceof ApplicationError) {
          throw error;
        }
        
        throw new ApplicationError(
          'IMPORT_ERROR',
          'Failed to import translations',
          500
        );
      }
    }
    
    private toDatabaseFieldName(jsFieldName: string): string {
      // Convert camelCase to snake_case for database fields
      return jsFieldName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
    
    private isValidTranslationKey(key: string): boolean {
      // Validate that the key uses dot notation
      return /^[a-z0-9]+(\.[a-z0-9]+)+$/i.test(key);
    }
    
    private flattenJson(json: any, prefix: string = ''): { key: string, translation: string }[] {
      const result: { key: string, translation: string }[] = [];
      
      Object.entries(json).forEach(([key, value]) => {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'object' && value !== null) {
          result.push(...this.flattenJson(value, newKey));
        } else {
          result.push({
            key: newKey,
            translation: String(value)
          });
        }
      });
      
      return result;
    }
    
    private parseCsv(csv: string): { key: string, translation: string }[] {
      const lines = csv.split('\n');
      
      // Skip header row if it exists
      const start = lines[0].toLowerCase().includes('key,translation') ? 1 : 0;
      
      return lines.slice(start)
        .map(line => {
          // Simple CSV parsing that handles quoted values
          const match = line.match(/^"([^"]*)","([^"]*)"$/) || 
                       line.match(/^([^,]*),(.*)$/);
          
          if (match) {
            return {
              key: match[1].trim(),
              translation: match[2].trim().replace(/""/g, '"')
            };
          }
          
          return null;
        })
        .filter(Boolean);
    }
  }
  ```

### 4.3 Database Optimization and Scalability (Week 31-32)
- Implement database indexing based on usage patterns
- Configure caching of frequent requests
- Implement load balancing for critical services
- Create simple data warehouse structure for statistical analysis
- **Implement Redis caching for improved performance:**
  ```typescript
  // Example of Redis cache service
  import Redis from 'ioredis';

  class CacheService {
    private readonly redis: Redis.Redis;
    
    constructor() {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        keyPrefix: 'hockey-hub:',
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });
    }
    
    async get<T>(key: string): Promise<T | null> {
      try {
        const data = await this.redis.get(key);
        
        if (!data) {
          return null;
        }
        
        return JSON.parse(data) as T;
      } catch (error) {
        console.error(`Error getting cache key ${key}:`, error);
        return null;
      }
    }
    
    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
      try {
        const serialized = JSON.stringify(value);
        
        if (ttlSeconds) {
          await this.redis.setex(key, ttlSeconds, serialized);
        } else {
          await this.redis.set(key, serialized);
        }
        
        return true;
      } catch (error) {
        console.error(`Error setting cache key ${key}:`, error);
        return false;
      }
    }
    
    async delete(key: string): Promise<boolean> {
      try {
        await this.redis.del(key);
        return true;
      } catch (error) {
        console.error(`Error deleting cache key ${key}:`, error);
        return false;
      }
    }
    
    async deletePattern(pattern: string): Promise<boolean> {
      try {
        const keys = await this.redis.keys(pattern);
        
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
        
        return true;
      } catch (error) {
        console.error(`Error deleting cache pattern ${pattern}:`, error);
        return false;
      }
    }
    
    // Utility for caching API calls
    async getOrFetch<T>(
      key: string,
      fetcher: () => Promise<T>,
      ttlSeconds: number = 3600
    ): Promise<T> {
      // Try to get from cache first
      const cachedValue = await this.get<T>(key);
      
      if (cachedValue !== null) {
        return cachedValue;
      }
      
      // If not in cache, fetch data
      const fetchedValue = await fetcher();
      
      // Save in cache
      await this.set(key, fetchedValue, ttlSeconds);
      
      return fetchedValue;
    }
    
    // Cache with key based on function and arguments
    async cachedFunction<T>(
      fn: (...args: any[]) => Promise<T>,
      keyPrefix: string,
      args: any[],
      ttlSeconds: number = 3600
    ): Promise<T> {
      // Create cache key based on function name, prefix and arguments
      const key = `${keyPrefix}:${fn.name}:${JSON.stringify(args)}`;
      
      return this.getOrFetch(
        key,
        () => fn(...args),
        ttlSeconds
      );
    }
    
    // For language translations
    async getTranslations(
      languageCode: string,
      namespace?: string
    ): Promise<Record<string, string>> {
      const cacheKey = namespace 
        ? `translations:${languageCode}:${namespace}` 
        : `translations:${languageCode}`;
      
      return this.getOrFetch(
        cacheKey,
        async () => {
          let query = 'SELECT key, translation FROM translations WHERE language_code = $1';
          const params = [languageCode];
          
          if (namespace) {
            query += ' AND key LIKE $2';
            params.push(`${namespace}.%`);
          }
          
          const result = await database.query(query, params);
          
          // Convert to key-value object
          return result.rows.reduce((acc, row) => {
            acc[row.key] = row.translation;
            return acc;
          }, {});
        },
        3600 // 1 hour TTL
      );
    }
    
    // For invalidating cache on update
    async invalidateTranslations(languageCode: string, namespace?: string): Promise<void> {
      if (namespace) {
        await this.delete(`translations:${languageCode}:${namespace}`);
      } else {
        await this.deletePattern(`translations:${languageCode}:*`);
        await this.delete(`translations:${languageCode}`);
      }
    }
  }
  ```
- **Optimize performance with database indexing:**
  ```sql
  -- Example of index creation for optimization
  
  -- Indexing for user management
  CREATE INDEX idx_users_email ON users(email);
  CREATE INDEX idx_users_team_id ON users(team_id);
  CREATE INDEX idx_users_role ON users(role);
  CREATE INDEX idx_users_last_active ON users(last_active);
  
  -- Indexing for relationships
  CREATE INDEX idx_team_members_team_id ON team_members(team_id);
  CREATE INDEX idx_team_members_user_id ON team_members(user_id);
  CREATE INDEX idx_player_parent_links_player_id ON player_parent_links(player_id);
  CREATE INDEX idx_player_parent_links_parent_id ON player_parent_links(parent_id);
  
  -- Indexing for calendar events
  CREATE INDEX idx_events_team_id ON events(team_id);
  CREATE INDEX idx_events_created_by ON events(created_by);
  CREATE INDEX idx_events_start_time ON events(start_time);
  CREATE INDEX idx_events_end_time ON events(end_time);
  CREATE INDEX idx_events_type ON events(event_type);
  CREATE INDEX idx_events_location_id ON events(location_id);
  
  -- Combined indexes for common searches
  CREATE INDEX idx_events_team_date ON events(team_id, start_time, end_time);
  CREATE INDEX idx_events_location_date ON events(location_id, start_time, end_time);
  
  -- Indexing for resource booking
  CREATE INDEX idx_resources_location_id ON resources(location_id);
  CREATE INDEX idx_resources_type_id ON resources(resource_type_id);
  CREATE INDEX idx_event_resources_event_id ON event_resources(event_id);
  CREATE INDEX idx_event_resources_resource_id ON event_resources(resource_id);
  
  -- Indexing for chat messages
  CREATE INDEX idx_messages_chat_id ON messages(chat_id);
  CREATE INDEX idx_messages_sender_id ON messages(sender_id);
  CREATE INDEX idx_messages_created_at ON messages(created_at);
  CREATE INDEX idx_chat_participants_chat_id ON chat_participants(chat_id);
  CREATE INDEX idx_chat_participants_user_id ON chat_participants(user_id);
  CREATE INDEX idx_message_reads_message_id ON message_reads(message_id);
  CREATE INDEX idx_message_reads_user_id ON message_reads(user_id);
  
  -- Indexing for training sessions
  CREATE INDEX idx_physical_sessions_template_id ON scheduled_physical_sessions(template_id);
  CREATE INDEX idx_physical_sessions_assigned_to_user ON scheduled_physical_sessions(assigned_to_user_id);
  CREATE INDEX idx_physical_sessions_assigned_to_team ON scheduled_physical_sessions(assigned_to_team_id);
  CREATE INDEX idx_physical_sessions_scheduled_date ON scheduled_physical_sessions(scheduled_date);
  
  -- Indexing for test results
  CREATE INDEX idx_test_results_player_id ON test_results(player_id);
  CREATE INDEX idx_test_results_test_id ON test_results(test_id);
  CREATE INDEX idx_test_results_date ON test_results(date);
  
  -- Indexing for medical data
  CREATE INDEX idx_injuries_player_id ON injuries(player_id);
  CREATE INDEX idx_injuries_body_part ON injuries(body_part);
  CREATE INDEX idx_injuries_injury_type ON injuries(injury_type);
  CREATE INDEX idx_treatments_injury_id ON treatments(injury_id);
  CREATE INDEX idx_player_availability_player_id ON player_availability_status(player_id);
  
  -- Indexing for statistics
  CREATE INDEX idx_game_stats_team_id ON game_stats(team_id);
  CREATE INDEX idx_game_stats_date ON game_stats(date);
  CREATE INDEX idx_player_game_stats_game_id ON player_game_stats(game_id);
  CREATE INDEX idx_player_game_stats_player_id ON player_game_stats(player_id);
  
  -- Indexing for translations
  CREATE INDEX idx_translations_language_code ON translations(language_code);
  CREATE INDEX idx_translations_key ON translations(key);
  CREATE INDEX idx_translations_language_key ON translations(language_code, key);
  ```
- **Optimize performance for multilingual support:**
  ```typescript
  // Example of optimized translation service with caching
  class OptimizedTranslationService {
    private readonly cacheService: CacheService;
    private readonly database: Database;
    
    constructor(cacheService: CacheService, database: Database) {
      this.cacheService = cacheService;
      this.database = database;
    }
    
    async getTranslations(
      languageCode: string,
      namespace?: string
    ): Promise<Record<string, string>> {
      // Use cache service to get translations
      return this.cacheService.getTranslations(languageCode, namespace);
    }
    
    async updateTranslation(
      key: string,
      languageCode: string,
      translation: string
    ): Promise<void> {
      try {
        // Update database
        const existingResult = await this.database.query(
          'SELECT id FROM translations WHERE key = $1 AND language_code = $2',
          [key, languageCode]
        );
        
        if (existingResult.rows.length > 0) {
          await this.database.query(
            'UPDATE translations SET translation = $3 WHERE key = $1 AND language_code = $2',
            [key, languageCode, translation]
          );
        } else {
          await this.database.query(
            'INSERT INTO translations (key, language_code, translation) VALUES ($1, $2, $3)',
            [key, languageCode, translation]
          );
        }
        
        // Extract namespace from key
        const namespace = key.split('.')[0];
        
        // Invalidate cache for both specific namespace and entire language
        await this.cacheService.invalidateTranslations(languageCode, namespace);
      } catch (error) {
        console.error('Error updating translation:', error);
        throw new ApplicationError(
          'DATABASE_ERROR',
          'Failed to update translation',
          500
        );
      }
    }
    
    // Bulk retrieval for better performance
    async bulkGetTranslations(
      languageCodes: string[]
    ): Promise<Record<string, Record<string, string>>> {
      const result: Record<string, Record<string, string>> = {};
      
      // Get all languages in parallel
      await Promise.all(languageCodes.map(async languageCode => {
        result[languageCode] = await this.getTranslations(languageCode);
      }));
      
      return result;
    }
    
    // For client-side caching
    async getTranslationsHash(languageCode: string): Promise<string> {
      // Generate a hash of the latest update for a language
      // This is used to determine if the client needs to fetch new translations
      
      const result = await this.database.query(
        'SELECT MAX(updated_at) as last_update FROM translations WHERE language_code = $1',
        [languageCode]
      );
      
      if (!result.rows[0]?.last_update) {
        return 'no-translations';
      }
      
      const timestamp = new Date(result.rows[0].last_update).getTime();
      return `${languageCode}-${timestamp}`;
    }
  }
  ```

## Phase 5: Refinement and Extensions (4 weeks)

### 5.1 Advanced Analysis and Real-time Data (Week 33-34)
- Extend statistics-service with advanced analysis functions
- Implement real-time dashboards for coaches
- Develop trend analyses for player development
- **Implement advanced player analysis:**
  ```typescript
  // Example of advanced player analytics
  class PlayerAnalyticsService {
    private readonly database: Database;
    
    constructor(database: Database) {
      this.database = database;
    }
    
    async getPlayerPerformanceTrend(playerId: string, metric: string, period: 'week' | 'month' | 'season'): Promise<PerformanceTrend> {
      try {
        let interval;
        let groupFormat;
        
        switch (period) {
          case 'week':
            interval = 'P7D';  // 7 days
            groupFormat = 'YYYY-MM-DD';
            break;
          case 'month':
            interval = 'P1M';  // 1 month
            groupFormat = 'YYYY-WW';
            break;
          case 'season':
            interval = 'P1Y';  // 1 year
            groupFormat = 'YYYY-MM';
            break;
        }
        
        let metricQuery;
        switch (metric) {
          case 'goals':
            metricQuery = 'SUM(goals)';
            break;
          case 'assists':
            metricQuery = 'SUM(assists)';
            break;
          case 'points':
            metricQuery = 'SUM(goals) + SUM(assists)';
            break;
          case 'plus_minus':
            metricQuery = 'SUM(plus_minus)';
            break;
          case 'shots':
            metricQuery = 'SUM(shots)';
            break;
          case 'shot_percentage':
            metricQuery = 'CASE WHEN SUM(shots) > 0 THEN (SUM(goals)::float / SUM(shots)) * 100 ELSE 0 END';
            break;
          default:
            throw new ApplicationError(
              'INVALID_METRIC',
              'Invalid performance metric',
              400
            );
        }
        
        const query = `
          SELECT 
            TO_CHAR(date, '${groupFormat}') as time_period,
            ${metricQuery} as value
          FROM player_game_stats
          WHERE player_id = $1
          AND date >= NOW() - INTERVAL '${interval}'
          GROUP BY time_period
          ORDER BY time_period ASC
        `;
        
        const result = await this.database.query(query, [playerId]);
        
        return {
          player_id: playerId,
          metric,
          period,
          data: result.rows.map(row => ({
            time_period: row.time_period,
            value: parseFloat(row.value)
          }))
        };
      } catch (error) {
        console.error('Error fetching player performance trend:', error);
        if (error instanceof ApplicationError) {
          throw error;
        }
        
        throw new ApplicationError(
          'DATABASE_ERROR',
          'Failed to fetch player performance trend',
          500
        );
      }
    }
    
    async getPlayerComparisonData(
      playerIds: string[], 
      metrics: string[], 
      timeFrame: 'current_season' | 'last_10_games' | 'all_time'
    ): Promise<PlayerComparisonData> {
      try {
        // Validate parameters
        if (!playerIds.length) {
          throw new ApplicationError(
            'INVALID_PARAMETERS',
            'At least one player ID must be provided',
            400
          );
        }
        
        if (!metrics.length) {
          throw new ApplicationError(
            'INVALID_PARAMETERS',
            'At least one metric must be provided',
            400
          );
        }
        
        // Validate metrics
        const validMetrics = ['goals', 'assists', 'points', 'plus_minus', 'shots', 'shot_percentage', 'ice_time', 'hits', 'blocks'];
        const invalidMetrics = metrics.filter(m => !validMetrics.includes(m));
        
        if (invalidMetrics.length) {
          throw new ApplicationError(
            'INVALID_PARAMETERS',
            `Invalid metrics: ${invalidMetrics.join(', ')}`,
            400
          );
        }
        
        // Create metric expressions for SQL
        const metricExpressions = metrics.map(metric => {
          switch (metric) {
            case 'points':
              return 'SUM(goals) + SUM(assists) as points';
            case 'shot_percentage':
              return 'CASE WHEN SUM(shots) > 0 THEN (SUM(goals)::float / SUM(shots)) * 100 ELSE 0 END as shot_percentage';
            default:
              return `SUM(${metric}) as ${metric}`;
          }
        });
        
        // Add WHERE condition for timeFrame
        let timeCondition = '';
        if (timeFrame === 'current_season') {
          // Assume we have a seasons table with start/end dates
          timeCondition = 'AND pgs.date BETWEEN (SELECT start_date FROM seasons WHERE current = TRUE) AND (SELECT end_date FROM seasons WHERE current = TRUE)';
        } else if (timeFrame === 'last_10_games') {
          timeCondition = `AND pgs.game_id IN (
            SELECT game_id 
            FROM player_game_stats 
            WHERE player_id = any($1) 
            ORDER BY date DESC 
            LIMIT 10
          )`;
        }
        
        const query = `
          SELECT 
            pgs.player_id,
            p.first_name,
            p.last_name,
            t.name as team_name,
            COUNT(DISTINCT pgs.game_id) as games_played,
            ${metricExpressions.join(',\n            ')}
          FROM player_game_stats pgs
          JOIN users p ON pgs.player_id = p.id
          LEFT JOIN teams t ON p.team_id = t.id
          WHERE pgs.player_id = ANY($1)
          ${timeCondition}
          GROUP BY pgs.player_id, p.first_name, p.last_name, t.name
        `;
        
        const result = await this.database.query(query, [playerIds]);
        
        // Format the result
        return {
          players: result.rows.map(row => {
            const player = {
              id: row.player_id,
              name: `${row.first_name} ${row.last_name}`,
              team: row.team_name,
              games_played: parseInt(row.games_played)
            };
            
            // Add metric values
            metrics.forEach(metric => {
              player[metric] = parseFloat(row[metric] || 0);
            });
            
            return player;
          }),
          metrics,
          time_frame: timeFrame
        };
      } catch (error) {
        console.error('Error fetching player comparison data:', error);
        if (error instanceof ApplicationError) {
          throw error;
        }
        
        throw new ApplicationError(
          'DATABASE_ERROR',
          'Failed to fetch player comparison data',
          500
        );
      }
    }
    
    async getPlayerDevelopmentReport(playerId: string): Promise<PlayerDevelopmentReport> {
      try {
        // Get player's basic information
        const playerQuery = `
          SELECT 
            u.id, 
            u.first_name, 
            u.last_name, 
            u.date_of_birth, 
            t.name as team_name,
            p.position,
            p.height,
            p.weight
          FROM users u
          JOIN player_profiles p ON u.id = p.user_id
          LEFT JOIN teams t ON u.team_id = t.id
          WHERE u.id = $1
        `;
        
        const playerResult = await this.database.query(playerQuery, [playerId]);
        
        if (playerResult.rows.length === 0) {
          throw new ApplicationError(
            'PLAYER_NOT_FOUND',
            `Player with ID ${playerId} not found`,
            404
          );
        }
        
        const player = playerResult.rows[0];
        
        // Get test results
        const testsQuery = `
          SELECT
            td.name as test_name,
            td.category,
            td.unit,
            tr.value,
            tr.date
          FROM test_results tr
          JOIN test_definitions td ON tr.test_id = td.id
          WHERE tr.player_id = $1
          ORDER BY tr.date DESC, td.category, td.name
        `;
        
        const testsResult = await this.database.query(testsQuery, [playerId]);
        
        // Group test results by category and date for trend analysis
        const testsByCategory = {};
        testsResult.rows.forEach(row => {
          if (!testsByCategory[row.category]) {
            testsByCategory[row.category] = [];
          }
          
          testsByCategory[row.category].push({
            name: row.test_name,
            value: parseFloat(row.value),
            unit: row.unit,
            date: row.date
          });
        });
        
        // Get statistics from the latest season
        const statsQuery = `
          SELECT
            COUNT(DISTINCT game_id) as games_played,
            SUM(goals) as goals,
            SUM(assists) as assists,
            SUM(goals) + SUM(assists) as points,
            ROUND(AVG(ice_time)) as avg_ice_time,
            SUM(shots) as shots,
            CASE WHEN SUM(shots) > 0 THEN ROUND((SUM(goals)::float / SUM(shots)) * 100, 1) ELSE 0 END as shot_percentage
          FROM player_game_stats
          WHERE player_id = $1
          AND date >= (SELECT start_date FROM seasons WHERE current = TRUE)
        `;
        
        const statsResult = await this.database.query(statsQuery, [playerId]);
        const stats = statsResult.rows[0];
        
        // Get injury history
        const injuriesQuery = `
          SELECT
            i.id,
            i.body_part,
            i.injury_type,
            i.date_occurred,
            i.date_recovered,
            CASE 
              WHEN i.date_recovered IS NOT NULL THEN 
                EXTRACT(DAY FROM (i.date_recovered - i.date_occurred))
              ELSE
                EXTRACT(DAY FROM (CURRENT_DATE - i.date_occurred))
            END as days_out
          FROM injuries i
          WHERE i.player_id = $1
          ORDER BY i.date_occurred DESC
        `;
        
        const injuriesResult = await this.database.query(injuriesQuery, [playerId]);
        
        // Get training amount
        const trainingQuery = `
          SELECT
            EXTRACT(MONTH FROM scheduled_date) as month,
            EXTRACT(YEAR FROM scheduled_date) as year,
            COUNT(*) as session_count,
            SUM(duration) as total_minutes
          FROM scheduled_physical_sessions
          WHERE assigned_to_user_id = $1
          AND status = 'completed'
          AND scheduled_date >= NOW() - INTERVAL '1 year'
          GROUP BY month, year
          ORDER BY year, month
        `;
        
        const trainingResult = await this.database.query(trainingQuery, [playerId]);
        
        // Compile the development report            type: 'macro',
            name: `Macro Cycle ${i + 1}`,
            startDate: macroStart.toISOString().split('T')[0],
            endDate: macroEnd.toISOString().split('T')[0],
            focus: phase.focus[0],
            load: i % 3 === 0 ? 'high' : (i % 3 === 1 ? 'medium' : 'low'),
            description: `Automatically generated macro cycle ${i + 1}`,
            phaseId,
            subcycles: []
          });
          
          createdCycles.push(macroCycle);
          
          // Create mesocycles (4 per macrocycle)
          for (let j = 0; j < 4; j++) {
            const mesoStart = new Date(macroStart);
            mesoStart.setDate(macroStart.getDate() + (j * 7));
            
            const mesoEnd = new Date(mesoStart);
            mesoEnd.setDate(mesoStart.getDate() + 6);
            
            if (mesoEnd > macroEnd) {
              mesoEnd.setTime(macroEnd.getTime());
            }
            
            await this.seasonRepository.createCycle({
              type: 'meso',
              name: `Meso Cycle ${j + 1}`,
              startDate: mesoStart.toISOString().split('T')[0],
              endDate: mesoEnd.toISOString().split('T')[0],
              focus: phase.focus[0],
              load: (i % 3 === 0 && j < 3) ? 'high' : 'medium',
              description: `Automatically generated meso cycle ${j + 1}`,
              parentCycleId: macroCycle.id,
              subcycles: []
            });
          }
        }
      } else {
        // If less than 28 days, just create mesocycles
        const numberOfMesoCycles = Math.ceil(totalDays / 7);
        
        for (let i = 0; i < numberOfMesoCycles; i++) {
          const mesoStart = new Date(startDate);
          mesoStart.setDate(startDate.getDate() + (i * 7));
          
          const mesoEnd = new Date(mesoStart);
          mesoEnd.setDate(mesoStart.getDate() + 6);
          
          if (mesoEnd > endDate) {
            mesoEnd.setTime(endDate.getTime());
          }
          
          const mesoCycle = await this.seasonRepository.createCycle({
            type: 'meso',
            name: `Meso Cycle ${i + 1}`,
            startDate: mesoStart.toISOString().split('T')[0],
            endDate: mesoEnd.toISOString().split('T')[0],
            focus: phase.focus[0],
            load: i % 4 === 0 ? 'high' : (i % 4 === 3 ? 'low' : 'medium'),
            description: `Automatically generated meso cycle ${i + 1}`,
            phaseId,
            subcycles: []
          });
          
          createdCycles.push(mesoCycle);
        }
      }
      
      return createdCycles;
    }
  }
  ```

### 3.4 Statistics (Week 25-26)
- Develop statistics-service with:
  - Team statistics
  - Individual player statistics
  - Match statistics
- Implement statistics visualizations in frontend:
  - Charts for player development
  - Tables for team comparisons
  - Result visualizations
- Extend translations with statistics-related terms
- Ensure numbers, percentages, and statistical terms are formatted according to language conventions
- Implement language-dependent sorting of names and other alphabetical data
- **Implement automatic data collection from external sources:**
  ```typescript
  // Example of scraper for external statistics sources
  class HockeyStatsScraper {
    private readonly axios: AxiosInstance;
    
    constructor() {
      this.axios = axios.create({
        headers: {
          'User-Agent': 'HockeyHub/1.0'
        },
        timeout: 10000
      });
    }
    
    async scrapeLeagueStandings(leagueId: string): Promise<LeagueStandings> {
      try {
        // Get HTML from the league
        const url = `https://example-hockey-league.com/standings/${leagueId}`;
        const response = await this.axios.get(url);
        
        if (response.status !== 200) {
          throw new Error(`Failed to fetch standings: ${response.status}`);
        }
        
        // Use cheerio to parse HTML
        const $ = cheerio.load(response.data);
        const standings: TeamStanding[] = [];
        
        // Extract table data
        $('table.standings tbody tr').each((i, elem) => {
          standings.push({
            position: parseInt($(elem).find('td:nth-child(1)').text().trim(), 10),
            teamId: $(elem).attr('data-team-id'),
            teamName: $(elem).find('td:nth-child(2)').text().trim(),
            gamesPlayed: parseInt($(elem).find('td:nth-child(3)').text().trim(), 10),
            wins: parseInt($(elem).find('td:nth-child(4)').text().trim(), 10),
            losses: parseInt($(elem).find('td:nth-child(5)').text().trim(), 10),
            ties: parseInt($(elem).find('td:nth-child(6)').text().trim(), 10),
            points: parseInt($(elem).find('td:nth-child(7)').text().trim(), 10),
            goalsFor: parseInt($(elem).find('td:nth-child(8)').text().trim(), 10),
            goalsAgainst: parseInt($(elem).find('td:nth-child(9)').text().trim(), 10)
          });
        });
        
        return {
          leagueId,
          lastUpdated: new Date().toISOString(),
          standings
        };
      } catch (error) {
        console.error('Error scraping league standings:', error);
        throw new ApplicationError(
          'SCRAPING_FAILED',
          'Failed to scrape league standings',
          500
        );
      }
    }
    
    async scrapePlayerStats(leagueId: string, season: string): Promise<PlayerStats[]> {
      try {
        // Get HTML from the league
        const url = `https://example-hockey-league.com/stats/${leagueId}/players/${season}`;
        const response = await this.axios.get(url);
        
        if (response.status !== 200) {
          throw new Error(`Failed to fetch player stats: ${response.status}`);
        }
        
        // Use cheerio to parse HTML
        const $ = cheerio.load(response.data);
        const playerStats: PlayerStats[] = [];
        
        // Extract player statistics
        $('table.player-stats tbody tr').each((i, elem) => {
          playerStats.push({
            playerId: $(elem).attr('data-player-id'),
            playerName: $(elem).find('td:nth-child(1)').text().trim(),
            teamId: $(elem).attr('data-team-id'),
            teamName: $(elem).find('td:nth-child(2)').text().trim(),
            position: $(elem).find('td:nth-child(3)').text().trim(),
            gamesPlayed: parseInt($(elem).find('td:nth-child(4)').text().trim(), 10),
            goals: parseInt($(elem).find('td:nth-child(5)').text().trim(), 10),
            assists: parseInt($(elem).find('td:nth-child(6)').text().trim(), 10),
            points: parseInt($(elem).find('td:nth-child(7)').text().trim(), 10),
            plusMinus: parseInt($(elem).find('td:nth-child(8)').text().trim(), 10),
            penaltyMinutes: parseInt($(elem).find('td:nth-child(9)').text().trim(), 10)
          });
        });
        
        return playerStats;
      } catch (error) {
        console.error('Error scraping player stats:', error);
        throw new ApplicationError(
          'SCRAPING_FAILED',
          'Failed to scrape player statistics',
          500
        );
      }
    }
    
    async scrapeGameResults(leagueId: string, dateFrom: string, dateTo: string): Promise<GameResult[]> {
      try {
        // Get HTML from the league
        const url = `https://example-hockey-league.com/games/${leagueId}?from=${dateFrom}&to=${dateTo}`;
        const response = await this.axios.get(url);
        
        if (response.status !== 200) {
          throw new Error(`Failed to fetch game results: ${response.status}`);
        }
        
        // Use cheerio to parse HTML
        const $ = cheerio.load(response.data);
        const gameResults: GameResult[] = [];
        
        // Extract match results
        $('div.game-result').each((i, elem) => {
          gameResults.push({
            gameId: $(elem).attr('data-game-id'),
            date: $(elem).find('.game-date').text().trim(),
            homeTeamId: $(elem).attr('data-home-team-id'),
            homeTeamName: $(elem).find('.home-team').text().trim(),
            homeTeamScore: parseInt($(elem).find('.home-score').text().trim(), 10),
            awayTeamId: $(elem).attr('data-away-team-id'),
            awayTeamName: $(elem).find('.away-team').text().trim(),
            awayTeamScore: parseInt($(elem).find('.away-score').text().trim(), 10),
            status: $(elem).find('.game-status').text().trim(),
            venue: $(elem).find('.game-venue').text().trim()
          });
        });
        
        return gameResults;
      } catch (error) {
        console.error('Error scraping game results:', error);
        throw new ApplicationError(
          'SCRAPING_FAILED',
          'Failed to scrape game results',
          500
        );
      }
    }
  }
  ```

## Phase 4: Advanced Features and Integration (6 weeks)

### 4.1 Payment Functionality (Week 27-28)
- Develop payment-service with:
  - Integrations with payment solutions (Stripe, Swish, Bankgiro)
  - Subscription management
  - Invoicing
- Implement payment views and history in frontend
- Extend translations with payment and invoicing terminology
- Implement language-specific currency handling and formatting
- Create multilingual invoice templates
- **Implement Stripe integration:**
  ```typescript
  // Example of Stripe integration
  import Stripe from 'stripe';

  class StripePaymentService {
    private readonly stripe: Stripe;
    
    constructor() {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16'
      });
    }
    
    async createCustomer(organizationId: string, email: string, name: string): Promise<string> {
      try {
        const customer = await this.stripe.customers.create({
          email,
          name,
          metadata: {
            organizationId
          }
        });
        
        return customer.id;
      } catch (error) {
        console.error('Error creating Stripe customer:', error);
        throw new ApplicationError(
          'PAYMENT_PROVIDER_ERROR',
          'Failed to create customer in payment system',
          500
        );
      }
    }
    
    async createSubscription(
      customerId: string,
      priceId: string,
      paymentMethodId: string
    ): Promise<string> {
      try {
        // Attach payment method to customer
        await this.stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId
        });
        
        // Set as default payment method
        await this.stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId
          }
        });
        
        // Create subscription
        const subscription = await this.stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
          expand: ['latest_invoice.payment_intent']
        });
        
        return subscription.id;
      } catch (error) {
        console.error('Error creating Stripe subscription:', error);
        throw new ApplicationError(
          'PAYMENT_PROVIDER_ERROR',
          'Failed to create subscription',
          500
        );
      }
    }
    
    async cancelSubscription(subscriptionId: string): Promise<void> {
      try {
        await this.stripe.subscriptions.del(subscriptionId);
      } catch (error) {
        console.error('Error canceling Stripe subscription:', error);
        throw new ApplicationError(
          'PAYMENT_PROVIDER_ERROR',
          'Failed to cancel subscription',
          500
        );
      }
    }
    
    async getSubscriptionDetails(subscriptionId: string): Promise<any> {
      try {
        const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
        return subscription;
      } catch (error) {
        console.error('Error retrieving Stripe subscription:', error);
        throw new ApplicationError(
          'PAYMENT_PROVIDER_ERROR',
          'Failed to retrieve subscription details',
          500
        );
      }
    }
    
    async getInvoices(customerId: string): Promise<any[]> {
      try {
        const invoices = await this.stripe.invoices.list({
          customer: customerId,
          limit: 100
        });
        
        return invoices.data;
      } catch (error) {
        console.error('Error retrieving Stripe invoices:', error);
        throw new ApplicationError(
          'PAYMENT_PROVIDER_ERROR',
          'Failed to retrieve invoices',
          500
        );
      }
    }
    
    async createCheckoutSession(
      customerId: string,
      priceId: string,
      successUrl: string,
      cancelUrl: string
    ): Promise<string> {
      try {
        const session = await this.stripe.checkout.sessions.create({
          customer: customerId,
          line_items: [
            {
              price: priceId,
              quantity: 1
            }
          ],
          mode: 'subscription',
          success_url: successUrl,
          cancel_url: cancelUrl
        });
        
        return session.url;
      } catch (error) {
        console.error('Error creating Stripe checkout session:', error);
        throw new ApplicationError(
          'PAYMENT_PROVIDER_ERROR',
          'Failed to create checkout session',
          500
        );
      }
    }
    
    // Webhook handling for Stripe events
    handleWebhookEvent(signature: string, rawBody: string): any {
      try {
        const event = this.stripe.webhooks.constructEvent(
          rawBody,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
        
        // Handle different event types
        switch (event.type) {
          case 'invoice.paid':
            return this.handleInvoicePaid(event.data.object);
          case 'invoice.payment_failed':
            return this.handlePaymentFailed(event.data.object);
          case 'customer.subscription.updated':
            return this.handleSubscriptionUpdated(event.data.object);
          case 'customer.subscription.deleted':
            return this.handleSubscriptionDeleted(event.data.object);
          default:
            console.log(`Unhandled Stripe event type: ${event.type}`);
            return { status: 'ignored' };
        }
      } catch (error) {
        console.error('Error handling Stripe webhook:', error);
        throw new ApplicationError(
          'PAYMENT_PROVIDER_ERROR',
          'Failed to process webhook event',
          400
        );
      }
    }
    
    private async handleInvoicePaid(invoice: any): Promise<any> {
      // Update subscription status in database
      // ...
      return { status: 'processed' };
    }
    
    private async handlePaymentFailed(invoice: any): Promise<any> {
      // Notify customer about failed payment
      // ...
      return { status: 'processed' };
    }
    
    private async handleSubscriptionUpdated(subscription: any): Promise<any> {
      // Update subscription information in database
      // ...
      return { status: 'processed' };
    }
    
    private async handleSubscriptionDeleted(subscription: any): Promise<any> {
      // Mark subscription as canceled in database
      // ...
      return { status: 'processed' };
    }
  }
  ```

### 4.2 Administration Panel (Week 29-30)
- Develop admin-service with:
  - System monitoring
  - Usage statistics
  - Configuration management
- Implement admin dashboard in frontend
- **Develop graphical system monitoring:**
  ```typescript
  // Example of system metrics service
  class SystemMetricsService {
    private readonly prometheusClient: any;
    
    constructor(prometheusUrl: string) {
      this.prometheusClient = {
        query: async (query: string, time?: number) => {
          const url = new URL('/api/v1/query', prometheusUrl);
          if (time) {
            url.searchParams.append('time', time.toString());
          }
          url.searchParams.append('query', query);
          
          const response = await fetch(url.toString());
          if (!response.ok) {
            throw new Error(`Prometheus query failed: ${response.statusText}`);
          }
          
          return await response.json();
        },
        
        queryRange: async (query: string, start: number, end: number, step: string) => {
          const url = new URL('/api/v1/query_range', prometheusUrl);
          url.searchParams.append('query', query);
          url.searchParams.append('start', start.toString());
          url.searchParams.append('end', end.toString());
          url.searchParams.append('step', step);
          
          const response = await fetch(url.toString());
          if (!response.ok) {
            throw new Error(`Prometheus range query failed: ${response.statusText}`);
          }
          
          return await response.json();
        }
      };
    }
    
    async getServiceHealth(): Promise<ServiceHealthMetrics[]> {
      try {
        // Get up/down status for all services
        const upQuery = 'up{job=~"hockey-hub-.+"}';
        const upResponse = await this.prometheusClient.query(upQuery);
        
        if (upResponse.status !== 'success' || !upResponse.data || !upResponse.data.result) {
          throw new Error('Failed to query service health');
        }
        
        // Transform the result to usable data
        return upResponse.data.result.map(item => ({
          service: item.metric.job.replace('hockey-hub-', ''),
          instance: item.metric.instance,
          up: item.value[1] === '1',
          lastChecked: new Date(item.value[0] * 1000).toISOString()
        }));
      } catch (error) {
        console.error('Error fetching service health metrics:', error);
        throw new ApplicationError(
          'METRICS_FETCH_ERROR',
          'Failed to fetch service health metrics',
          500
        );
      }
    }
    
    async getServiceResponseTimes(
      timeRange: { start: number; end: number },
      step: string = '5m'
    ): Promise<ServiceResponseTimeMetrics[]> {
      try {
        // Get response times for all services
        const query = 'rate(http_request_duration_seconds_sum{job=~"hockey-hub-.+"}[5m]) / rate(http_request_duration_seconds_count{job=~"hockey-hub-.+"}[5m])';
        const response = await this.prometheusClient.queryRange(
          query,
          timeRange.start,
          timeRange.end,
          step
        );
        
        if (response.status !== 'success' || !response.data || !response.data.result) {
          throw new Error('Failed to query service response times');
        }
        
        // Organize data by service
        const serviceMap = {};
        response.data.result.forEach(item => {
          const service = item.metric.job.replace('hockey-hub-', '');
          const endpoint = item.metric.handler || 'unknown';
          
          if (!serviceMap[service]) {
            serviceMap[service] = {
              service,
              endpoints: {}
            };
          }
          
          if (!serviceMap[service].endpoints[endpoint]) {
            serviceMap[service].endpoints[endpoint] = {
              endpoint,
              dataPoints: []
            };
          }
          
          // Add data points
          serviceMap[service].endpoints[endpoint].dataPoints = item.values.map(point => ({
            timestamp: new Date(point[0] * 1000).toISOString(),
            value: parseFloat(point[1])
          }));
        });
        
        // Convert to array
        return Object.values(serviceMap);
      } catch (error) {
        console.error('Error fetching service response time metrics:', error);
        throw new ApplicationError(
          'METRICS_FETCH_ERROR',
          'Failed to fetch service response time metrics',
          500
        );
      }
    }
    
    async getDatabaseMetrics(
      timeRange: { start: number; end: number },
      step: string = '5m'
    ): Promise<DatabaseMetrics> {
      try {
        // Get multiple metrics in parallel
        const queries = {
          connections: 'pg_stat_activity_count{datname="hockeyhub"}',
          transactionsPerSecond: 'rate(pg_stat_database_xact_commit{datname="hockeyhub"}[5m]) + rate(pg_stat_database_xact_rollback{datname="hockeyhub"}[5m])',
          cacheHitRatio: 'pg_stat_database_blks_hit{datname="hockeyhub"} / (pg_stat_database_blks_hit{datname="hockeyhub"} + pg_stat_database_blks_read{datname="hockeyhub"})',
          diskUsage: 'pg_database_size_bytes{datname="hockeyhub"}'
        };
        
        const results = {};
        
        // Get each metric
        await Promise.all(Object.entries(queries).map(async ([key, query]) => {
          const response = await this.prometheusClient.queryRange(
            query,
            timeRange.start,
            timeRange.end,
            step
          );
          
          if (response.status === 'success' && response.data && response.data.result && response.data.result.length > 0) {
            results[key] = response.data.result[0].values.map(point => ({
              timestamp: new Date(point[0] * 1000).toISOString(),
              value: parseFloat(point[1])
            }));
          } else {
            results[key] = [];
          }
        }));
        
        return results as DatabaseMetrics;
      } catch (error) {
        console.error('Error fetching database metrics:', error);
        throw new ApplicationError(
          'METRICS_FETCH_ERROR',
          'Failed to fetch database metrics',
          500
        );
      }
    }
    
    async getUserMetrics(): Promise<UserMetrics> {
      try {
        // Get user statistics from database
        const totalUsersQuery = 'SELECT COUNT(*) as count FROM users';
        const activeUsersQuery = 'SELECT COUNT(*) as count FROM users WHERE last_active > NOW() - INTERVAL \'30 days\'';
        const usersByRoleQuery = 'SELECT role, COUNT(*) as count FROM users GROUP BY role';
        const usersByTeamQuery = 'SELECT team_id, COUNT(*) as count FROM users WHERE team_id IS NOT NULL GROUP BY team_id';
        
        // Execute all queries in parallel
        const [totalUsers, activeUsers, usersByRole, usersByTeam] = await Promise.all([
          database.query(totalUsersQuery),
          database.query(activeUsersQuery),
          database.query(usersByRoleQuery),
          database.query(usersByTeamQuery)
        ]);
        
        return {
          totalUsers: parseInt(totalUsers.rows[0].count),
          activeUsers: parseInt(activeUsers.rows[0].count),
          usersByRole: usersByRole.rows.reduce((acc, row) => {
            acc[row.role] = parseInt(row.count);
            return acc;
          }, {}),
          usersByTeam: await Promise.all(usersByTeam.rows.map(async row => {
            const team = await database.query('SELECT name FROM teams WHERE id = $1', [row.team_id]);
            return {
              teamId: row.team_id,
              teamName: team.rows[0]?.name || 'Unknown',
              count: parseInt(row.count)
            };
          }))
        };
      } catch (error) {
        console.error('Error fetching user metrics:', error);
        throw new ApplicationError(
          'METRICS_FETCH_ERROR',
          'Failed to fetch user metrics',
          500
        );
      }
    }
  }
  ```
- **Develop tools for managing translations in admin panel:**
  ```typescript
  // Example of translation service
  class TranslationManagementService {
    private readonly database: Database;
    
    constructor(database: Database) {
      this.database = database;
    }
    
    async getAllLanguages(): Promise<Language[]> {
      try {
        const result = await this.database.query(
          'SELECT code, name, native_name, is_active, direction FROM supported_languages'
        );
        
        return result.rows;
      } catch (error) {
        console.error('Error fetching languages:', error);
        throw new ApplicationError(
          'DATABASE_ERROR',
          'Failed to fetch languages',
          500
        );
      }
    }
    
    async addLanguage(language: Omit<Language, 'id'>): Promise<Language> {
      try {
        const result = await this.database.query(
          'INSERT INTO supported_languages (code, name, native_name, is_active, direction) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [language.code, language.name, language.nativeName, language.isActive, language.direction]
        );
        
        return result.rows[0];
      } catch (error) {
        console.error('Error adding language:', error);
        throw new ApplicationError(
          'DATABASE_ERROR',
          'Failed to add language',
          500
        );
      }
    }
    
    async updateLanguage(code: string, updates: Partial<Language>): Promise<Language> {
      try {
        const fields = Object.keys(updates).map((key, i) => `${this.toDatabaseFieldName(key)} = ${i + 2}`);
        const values = Object.values(updates);
        
        const query = `UPDATE supported_languages SET ${fields.join(', ')} WHERE code = $1 RETURNING *`;
        const result = await this.database.query(query, [code, ...values]);
        
        if (result.rows.length === 0) {
          throw new ApplicationError(
            'LANGUAGE_NOT_FOUND',
            `Language with code ${code} not found`,
            404
          );
        }
        
        return result.rows[0];
      } catch (error) {
        console.error('Error updating language:', error);
        if (error instanceof ApplicationError) {
          throw error;
        }
        
        throw new ApplicationError(
          'DATABASE_ERROR',
          'Failed to update language',
          500
        );
      }
    }
    
    async getTranslationKeys(
      filter?: { namespace?: string, searchTerm?: string },
      pagination?: { page: number, limit: number }
    ): Promise<{ keys: TranslationKey[], total: number }> {
      try {
        let query = 'SELECT DISTINCT key FROM translations';
        const whereConditions = [];
        const values = [];
        let valueIndex = 1;
        
        if (filter?.namespace) {
          whereConditions.push(`key LIKE ${valueIndex}`);
          values.push(`${filter.namespace}.%`);
          valueIndex++;
        }
        
        if (filter?.searchTerm) {
          whereConditions.push(`key ILIKE ${valueIndex}`);
          values.push(`%${filter.searchTerm}%`);
          valueIndex++;
        }
        
        if (whereConditions.length > 0) {
          query += ` WHERE ${whereConditions.join(' AND ')}`;
        }
        
        // Get total count
        const countQuery = `SELECT COUNT(*) FROM (${query}) AS count`;
        const countResult = await this.database.query(countQuery, values);
        const total = parseInt(countResult.rows[0].count);
        
        // Add pagination
        if (pagination) {
          const offset = (pagination.page - 1) * pagination.limit;
          query += ` ORDER BY key LIMIT ${valueIndex} OFFSET ${valueIndex + 1}`;
          values.push(pagination.limit, offset);
        } else {
          query += ' ORDER BY key';
        }
        
        const result = await this.database.query(query, values);
        const keys = result.rows.map(row => row.key);
        
        // Get translations for all keys
        const translationsResult = await this.database.query(
          'SELECT key, language_code, translation, context FROM translations WHERE key = ANY($1)',
          [keys]
        );
        
        // Group translations by key
        const translationsByKey = {};
        translationsResult.rows.forEach(row => {
          if (!translationsByKey[row.key]) {
            translationsByKey[row.key] = {
              key: row.key,
              context: row.context,
              translations: {}
            };
          }
          
          translationsByKey[row.key].translations[row.language_code] = row.translation;
        });
        
        return {
          keys: Object.values(translationsByKey),
          total
        };
      } catch (error) {
        console.error('Error fetching translation keys:', error);
        throw new ApplicationError(
          'DATABASE_ERROR',
          'Failed to fetch translation keys',
          500
        );
      }
    }
    
    async updateTranslation(key: string, languageCode: string, translation: string): Promise<void> {
      try {
        // Check if translation exists
        const existingResult = await this.database.query(
          'SELECT id FROM translations WHERE key = $1 AND language_code = $2',
          [key, languageCode]
        );
        
        if (existingResult.rows.length > 0) {
          // Update existing translation
          await this.database.query(
            'UPDATE translations SET translation = $3 WHERE key = $1 AND language_code = $2',
            [key, languageCode, translation]
          );
        } else {
          // Create new translation
          await this.database.query(
            'INSERT INTO translations (key, language_code, translation) VALUES ($1, $2, $3)',
            [key, languageCode, translation]
          );
        }
      } catch (error) {
        console.error('Error updating translation:', error);
        throw new ApplicationError(
          'DATABASE_ERROR',
          'Failed to update translation',
          500
        );
      }
    }
    
    async addTranslationKey(key: string, context?: string, initialTranslations?: Record<string, string# Hockey Hub - Implementation Phases and Strategic Plan

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