import { CoachDashboard } from '../../page-objects/CoachDashboard';
import { testUsers, viewports } from '../../support/e2e';

describe('Coach Creating Training Sessions', () => {
  const coachDashboard = new CoachDashboard();
  
  beforeEach(() => {
    // Login as coach
    cy.login(testUsers.coach.email, testUsers.coach.password);
    
    // Mock team roster
    cy.mockApiResponse('GET', '**/api/team/roster', {
      players: [
        { id: '1', name: 'John Doe', number: 10, position: 'Forward' },
        { id: '2', name: 'Jane Smith', number: 15, position: 'Defense' },
        { id: '3', name: 'Mike Johnson', number: 20, position: 'Goalie' },
        { id: '4', name: 'Sarah Williams', number: 25, position: 'Forward' },
        { id: '5', name: 'Tom Brown', number: 30, position: 'Defense' },
      ],
    });
    
    // Mock locations
    cy.mockApiResponse('GET', '**/api/locations', {
      locations: [
        { id: '1', name: 'Main Rink', type: 'ice' },
        { id: '2', name: 'Practice Rink', type: 'ice' },
        { id: '3', name: 'Gym', type: 'gym' },
        { id: '4', name: 'Meeting Room', type: 'classroom' },
      ],
    });
  });
  
  describe('Creating Training Sessions', () => {
    it('should create a practice session with selected players', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      coachDashboard.visit();
      coachDashboard.createTrainingSession({
        title: 'Power Play Practice',
        type: 'practice',
        date: tomorrow,
        startTime: '16:00',
        endTime: '18:00',
        playerIds: ['1', '2', '4'], // Select specific players
      });
      
      // Mock successful creation
      cy.mockApiResponse('POST', '**/api/training/sessions', {
        id: '100',
        success: true,
      });
      
      coachDashboard.assertSessionCreated('Power Play Practice');
    });
    
    it('should create a team meeting with all players', () => {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      coachDashboard.visit();
      coachDashboard.openCreateSessionForm();
      
      coachDashboard.fillSessionDetails({
        title: 'Season Strategy Meeting',
        type: 'meeting',
        date: nextWeek,
        startTime: '19:00',
        endTime: '20:30',
        locationId: '4', // Meeting Room
        description: 'Discuss season strategy and team goals',
        objectives: '1. Review last season\n2. Set team goals\n3. Discuss strategy',
      });
      
      coachDashboard.selectAllPlayers();
      coachDashboard.submitSession();
      
      coachDashboard.assertSessionCreated('Season Strategy Meeting');
    });
    
    it('should validate session conflicts', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Mock existing sessions
      cy.mockApiResponse('GET', '**/api/training/sessions/conflicts', {
        conflicts: [
          {
            id: '50',
            title: 'Team Practice',
            startTime: '15:00',
            endTime: '17:00',
            date: tomorrow.toISOString().split('T')[0],
          },
        ],
      });
      
      coachDashboard.visit();
      coachDashboard.openCreateSessionForm();
      
      coachDashboard.fillSessionDetails({
        title: 'Conflicting Session',
        type: 'practice',
        date: tomorrow,
        startTime: '16:00', // Conflicts with existing session
        endTime: '18:00',
      });
      
      // Check for conflict warning
      cy.contains('Schedule conflict detected').should('be.visible');
      cy.contains('Team Practice (15:00 - 17:00)').should('be.visible');
    });
    
    it('should create recurring training sessions', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      
      coachDashboard.visit();
      coachDashboard.openCreateSessionForm();
      
      coachDashboard.fillSessionDetails({
        title: 'Weekly Skills Training',
        type: 'skills',
        date: startDate,
        startTime: '17:00',
        endTime: '18:30',
        locationId: '2',
      });
      
      // Enable recurring
      cy.get('input[name="isRecurring"]').check();
      cy.get('select[name="recurringPattern"]').select('weekly');
      cy.get('input[name="recurringCount"]').clear().type('8'); // 8 weeks
      
      coachDashboard.selectAllPlayers();
      coachDashboard.submitSession();
      
      // Verify recurring sessions created
      cy.checkToast('8 training sessions created successfully');
    });
    
    it('should handle session templates', () => {
      // Mock session templates
      cy.mockApiResponse('GET', '**/api/training/templates', {
        templates: [
          {
            id: '1',
            name: 'Standard Practice',
            type: 'practice',
            duration: 120,
            description: 'Regular team practice template',
            drills: ['Warm-up', 'Passing drills', 'Scrimmage', 'Cool-down'],
          },
          {
            id: '2',
            name: 'Game Day Skate',
            type: 'practice',
            duration: 45,
            description: 'Light practice before game',
            drills: ['Light warm-up', 'Shooting practice', 'Systems review'],
          },
        ],
      });
      
      coachDashboard.visit();
      coachDashboard.openCreateSessionForm();
      
      // Load template
      cy.get('button:contains("Use Template")').click();
      cy.get('[data-testid="template-1"]').click();
      
      // Verify template data loaded
      cy.get('input[name="title"]').should('have.value', 'Standard Practice');
      cy.get('select[name="type"]').should('have.value', 'practice');
      cy.get('textarea[name="description"]').should('contain', 'Regular team practice');
    });
  });
  
  describe('Managing Training Sessions', () => {
    beforeEach(() => {
      // Mock existing sessions
      cy.mockApiResponse('GET', '**/api/training/sessions', {
        sessions: [
          {
            id: '1',
            title: 'Morning Practice',
            type: 'practice',
            date: '2025-07-03',
            startTime: '09:00',
            endTime: '11:00',
            location: 'Main Rink',
            attendees: 18,
            totalPlayers: 20,
          },
          {
            id: '2',
            title: 'Defensive Systems',
            type: 'skills',
            date: '2025-07-04',
            startTime: '16:00',
            endTime: '17:30',
            location: 'Practice Rink',
            attendees: 8,
            totalPlayers: 10,
          },
        ],
      });
    });
    
    it('should edit an existing session', () => {
      coachDashboard.visit();
      coachDashboard.editSession('1');
      
      // Update details
      cy.get('input[name="title"]').clear().type('Extended Morning Practice');
      cy.get('input[name="endTime"]').clear().type('12:00'); // Extend by 1 hour
      cy.get('textarea[name="notes"]').type('Focus on power play formations');
      
      cy.get('button:contains("Save Changes")').click();
      
      cy.checkToast('Session updated successfully');
      cy.contains('Extended Morning Practice').should('be.visible');
    });
    
    it('should cancel a session with notification', () => {
      coachDashboard.visit();
      coachDashboard.cancelSession('2');
      
      // Add cancellation reason
      cy.get('textarea[name="cancellationReason"]').type('Rink maintenance required');
      cy.get('input[name="notifyPlayers"]').check();
      
      // Confirm cancellation
      cy.get('button:contains("Confirm Cancel")').click();
      
      cy.checkToast('Session cancelled and players notified');
      cy.get('[data-testid="session-2"]').should('contain', 'Cancelled');
    });
    
    it('should track attendance for a session', () => {
      coachDashboard.visit();
      coachDashboard.viewSessionDetails('1');
      
      // Mock attendance data
      cy.mockApiResponse('GET', '**/api/training/sessions/1/attendance', {
        players: [
          { id: '1', name: 'John Doe', status: 'present' },
          { id: '2', name: 'Jane Smith', status: 'absent' },
          { id: '3', name: 'Mike Johnson', status: 'late' },
          { id: '4', name: 'Sarah Williams', status: null }, // Not marked yet
          { id: '5', name: 'Tom Brown', status: 'present' },
        ],
      });
      
      // Mark attendance
      cy.get('[data-testid="attendance-tab"]').click();
      
      // Mark Sarah as present
      cy.get('[data-testid="player-4-attendance"]').within(() => {
        cy.get('button:contains("Present")').click();
      });
      
      // Update Jane to present
      cy.get('[data-testid="player-2-attendance"]').within(() => {
        cy.get('button:contains("Present")').click();
      });
      
      cy.get('button:contains("Save Attendance")').click();
      cy.checkToast('Attendance updated successfully');
    });
  });
  
  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      cy.viewport(viewports.mobile.width, viewports.mobile.height);
    });
    
    it('should create session on mobile', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      coachDashboard.visit();
      
      // Mobile menu
      cy.get('[data-testid="mobile-menu-toggle"]').click();
      cy.get('[data-testid="mobile-create-session"]').click();
      
      // Fill form on mobile
      coachDashboard.fillSessionDetails({
        title: 'Mobile Test Session',
        type: 'practice',
        date: tomorrow,
        startTime: '15:00',
        endTime: '16:30',
      });
      
      // Player selection on mobile should be optimized
      cy.get('[data-testid="mobile-player-select"]').click();
      cy.get('button:contains("Select All")').click();
      cy.get('button:contains("Done")').click();
      
      coachDashboard.submitSession();
      coachDashboard.assertSessionCreated('Mobile Test Session');
    });
  });
  
  describe('Analytics and Reporting', () => {
    it('should view session analytics', () => {
      coachDashboard.visit();
      coachDashboard.navigateToAnalytics();
      
      // Mock analytics data
      cy.mockApiResponse('GET', '**/api/training/analytics', {
        totalSessions: 45,
        averageAttendance: 85,
        sessionTypes: {
          practice: 30,
          skills: 10,
          meeting: 5,
        },
        playerParticipation: [
          { playerId: '1', name: 'John Doe', sessionsAttended: 42, percentage: 93 },
          { playerId: '2', name: 'Jane Smith', sessionsAttended: 40, percentage: 89 },
        ],
      });
      
      // Check analytics display
      cy.contains('Training Analytics').should('be.visible');
      cy.contains('45 Total Sessions').should('be.visible');
      cy.contains('85% Average Attendance').should('be.visible');
      
      // Check charts
      cy.get('[data-testid="session-types-chart"]').should('be.visible');
      cy.get('[data-testid="attendance-trend-chart"]').should('be.visible');
    });
  });
});