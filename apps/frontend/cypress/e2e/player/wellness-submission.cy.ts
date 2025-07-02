import { PlayerDashboard } from '../../page-objects/PlayerDashboard';
import { testUsers, viewports } from '../../support/e2e';

describe('Player Wellness Data Submission', () => {
  const playerDashboard = new PlayerDashboard();
  
  beforeEach(() => {
    // Login as player
    cy.login(testUsers.player.email, testUsers.player.password);
    
    // Mock API responses
    cy.mockApiResponse('GET', '**/api/player/overview', {
      todaySchedule: [
        { id: '1', title: 'Morning Practice', startTime: '09:00', endTime: '11:00' },
        { id: '2', title: 'Strength Training', startTime: '14:00', endTime: '15:30' },
      ],
      upcomingEvents: [
        { id: '3', title: 'Team Meeting', date: '2025-07-03', time: '18:00' },
      ],
      wellness: {
        lastSubmission: '2025-07-01',
        trend: 'improving',
      },
    });
  });
  
  describe('Desktop View', () => {
    it('should submit wellness data successfully', () => {
      playerDashboard.visit();
      playerDashboard.openWellnessForm();
      
      // Fill wellness data
      playerDashboard.fillWellnessData({
        sleepQuality: 8,
        sleepHours: 7.5,
        fatigue: 3,
        soreness: 4,
        stress: 2,
        mood: 9,
        hrv: 65,
        restingHeartRate: 58,
        weight: 185,
        notes: 'Feeling good, ready for practice',
      });
      
      // Mock successful submission
      cy.mockApiResponse('POST', '**/api/wellness/submit', {
        success: true,
        wellnessId: '123',
      });
      
      playerDashboard.submitWellnessForm();
      playerDashboard.assertWellnessSubmitted();
      
      // Verify data appears in dashboard
      cy.contains('Wellness submitted today').should('be.visible');
    });
    
    it('should validate wellness form inputs', () => {
      playerDashboard.visit();
      playerDashboard.openWellnessForm();
      
      // Try to submit empty form
      playerDashboard.submitWellnessForm();
      
      // Check for validation errors
      cy.contains('Sleep quality is required').should('be.visible');
      cy.contains('Sleep hours is required').should('be.visible');
      
      // Test invalid values
      playerDashboard.fillWellnessData({
        sleepHours: 25, // Invalid - more than 24
        hrv: -10, // Invalid - negative
        restingHeartRate: 250, // Invalid - too high
      });
      
      cy.contains('Sleep hours must be between 0 and 24').should('be.visible');
      cy.contains('HRV must be positive').should('be.visible');
      cy.contains('Heart rate must be between 30 and 220').should('be.visible');
    });
    
    it('should show wellness trends after submission', () => {
      // Mock wellness history
      cy.mockApiResponse('GET', '**/api/wellness/history', {
        entries: [
          { date: '2025-07-01', avgScore: 7.5, fatigue: 3, mood: 8 },
          { date: '2025-06-30', avgScore: 7.2, fatigue: 4, mood: 7 },
          { date: '2025-06-29', avgScore: 6.8, fatigue: 5, mood: 6 },
        ],
      });
      
      playerDashboard.visit();
      
      // Submit today's wellness
      playerDashboard.openWellnessForm();
      playerDashboard.fillWellnessData({
        sleepQuality: 9,
        sleepHours: 8,
        fatigue: 2,
        soreness: 2,
        stress: 1,
        mood: 9,
      });
      playerDashboard.submitWellnessForm();
      
      // Check trends
      cy.get('[data-testid="wellness-trends"]').should('be.visible');
      cy.contains('Improving trend').should('be.visible');
      cy.get('[data-testid="wellness-chart"]').should('exist');
    });
    
    it('should save draft and resume later', () => {
      playerDashboard.visit();
      playerDashboard.openWellnessForm();
      
      // Fill partial data
      playerDashboard.fillWellnessData({
        sleepQuality: 7,
        sleepHours: 6.5,
        fatigue: 4,
      });
      
      // Close form (saves draft)
      cy.get('[data-testid="close-wellness-form"]').click();
      
      // Reopen form
      playerDashboard.openWellnessForm();
      
      // Verify draft data is loaded
      cy.get('input[name="sleepQuality"]').should('have.value', '7');
      cy.get('input[name="sleepHours"]').should('have.value', '6.5');
      cy.get('input[name="fatigue"]').should('have.value', '4');
    });
    
    it('should handle API errors gracefully', () => {
      playerDashboard.visit();
      playerDashboard.openWellnessForm();
      
      playerDashboard.fillWellnessData({
        sleepQuality: 8,
        sleepHours: 7,
        fatigue: 3,
        soreness: 3,
        stress: 2,
        mood: 8,
      });
      
      // Mock API error
      cy.mockApiResponse('POST', '**/api/wellness/submit', 
        { error: 'Server error' }, 
        500
      );
      
      playerDashboard.submitWellnessForm();
      
      // Check error handling
      cy.checkToast('Failed to submit wellness data', 'error');
      cy.contains('Please try again').should('be.visible');
      
      // Form should remain open with data
      cy.get('input[name="sleepQuality"]').should('have.value', '8');
    });
  });
  
  describe('Mobile View', () => {
    beforeEach(() => {
      cy.viewport(viewports.mobile.width, viewports.mobile.height);
    });
    
    it('should be responsive on mobile devices', () => {
      playerDashboard.visit();
      
      // Check mobile menu
      cy.get('[data-testid="mobile-menu-toggle"]').should('be.visible');
      
      // Open wellness form
      playerDashboard.openWellnessForm();
      
      // Form should be full screen on mobile
      cy.get('[data-testid="wellness-form-modal"]').should('have.css', 'width', `${viewports.mobile.width}px`);
      
      // Fill and submit
      playerDashboard.fillWellnessData({
        sleepQuality: 7,
        sleepHours: 7,
        fatigue: 3,
        soreness: 3,
        stress: 3,
        mood: 7,
      });
      
      playerDashboard.submitWellnessForm();
      playerDashboard.assertWellnessSubmitted();
    });
    
    it('should have touch-friendly inputs on mobile', () => {
      playerDashboard.visit();
      playerDashboard.openWellnessForm();
      
      // Check slider sizes
      cy.get('input[type="range"]').each(($slider) => {
        cy.wrap($slider).should('have.css', 'height').and('match', /[4-9][0-9]px/);
      });
      
      // Check button sizes
      cy.get('button').each(($button) => {
        cy.wrap($button).should('have.css', 'min-height').and('match', /[4-9][0-9]px/);
      });
    });
  });
  
  describe('Wellness History', () => {
    it('should display wellness history correctly', () => {
      cy.mockApiResponse('GET', '**/api/wellness/history?days=30', {
        entries: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          sleepQuality: 6 + Math.random() * 3,
          fatigue: 2 + Math.random() * 5,
          mood: 5 + Math.random() * 4,
          submitted: true,
        })),
      });
      
      playerDashboard.visit();
      cy.get('button:contains("View History")').click();
      
      // Check history display
      cy.get('[data-testid="wellness-history"]').should('be.visible');
      cy.get('[data-testid="wellness-calendar"]').should('be.visible');
      
      // Check for submitted days
      cy.get('.wellness-submitted').should('have.length.at.least', 20);
      
      // Click on a specific day
      cy.get('.wellness-submitted').first().click();
      cy.get('[data-testid="wellness-day-details"]').should('be.visible');
    });
  });
});