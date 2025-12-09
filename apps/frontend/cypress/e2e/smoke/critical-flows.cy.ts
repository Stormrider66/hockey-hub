/**
 * Smoke Tests for Critical User Flows
 * These tests verify the most important functionality works correctly
 */

import { LoginPage } from '../../page-objects/LoginPage';
import { PlayerDashboard } from '../../page-objects/PlayerDashboard';
import { CoachDashboard } from '../../page-objects/CoachDashboard';
import { ParentDashboard } from '../../page-objects/ParentDashboard';
import { MedicalStaffDashboard } from '../../page-objects/MedicalStaffDashboard';

describe('Critical User Flows - Smoke Tests', () => {
  // Mock API responses for all tests
  beforeEach(() => {
    // Mock auth endpoints
    cy.intercept('POST', '**/api/auth/login', (req) => {
      const { email, password } = req.body;
      
      // Simple mock authentication
      if (email.includes('player') && password === 'TestPlayer123!') {
        req.reply({
          statusCode: 200,
          body: {
            token: 'mock-jwt-token-player',
            refreshToken: 'mock-refresh-token',
            user: {
              id: 'player1',
              email: email,
              role: 'PLAYER',
              firstName: 'Test',
              lastName: 'Player',
            },
          },
        });
      } else if (email.includes('coach') && password === 'TestCoach123!') {
        req.reply({
          statusCode: 200,
          body: {
            token: 'mock-jwt-token-coach',
            refreshToken: 'mock-refresh-token',
            user: {
              id: 'coach1',
              email: email,
              role: 'COACH',
              firstName: 'Test',
              lastName: 'Coach',
            },
          },
        });
      } else {
        req.reply({
          statusCode: 401,
          body: { error: 'Invalid email or password' },
        });
      }
    }).as('login');
    
    // Mock dashboard data
    cy.intercept('GET', '**/api/player/overview', {
      statusCode: 200,
      body: {
        todaySchedule: [
          { id: '1', title: 'Morning Practice', startTime: '09:00', endTime: '11:00' },
        ],
        wellness: { lastSubmission: null },
        upcomingEvents: [],
      },
    }).as('playerOverview');
    
    cy.intercept('GET', '**/api/coach/dashboard', {
      statusCode: 200,
      body: {
        upcomingSessions: [],
        teamRoster: [],
      },
    }).as('coachDashboard');
  });
  
  it('Player can login and submit wellness data', () => {
    const loginPage = new LoginPage();
    const playerDashboard = new PlayerDashboard();
    
    // Login
    loginPage.visit();
    loginPage.login('test.player@hockeyhub.com', 'TestPlayer123!');
    
    // Wait for login and redirect
    cy.wait('@login');
    cy.url().should('include', '/player');
    
    // Wait for dashboard data
    cy.wait('@playerOverview');
    
    // Submit wellness data
    cy.intercept('POST', '**/api/wellness/submit', {
      statusCode: 200,
      body: { success: true, wellnessId: '123' },
    }).as('submitWellness');
    
    playerDashboard.openWellnessForm();
    playerDashboard.fillWellnessData({
      sleepQuality: 8,
      sleepHours: 7,
      fatigue: 3,
      soreness: 2,
      stress: 2,
      mood: 8,
    });
    playerDashboard.submitWellnessForm();
    
    cy.wait('@submitWellness');
    playerDashboard.assertWellnessSubmitted();
  });
  
  it('Coach can login and create a training session', () => {
    const loginPage = new LoginPage();
    const coachDashboard = new CoachDashboard();
    
    // Mock additional coach endpoints
    cy.intercept('GET', '**/api/team/roster', {
      statusCode: 200,
      body: {
        players: [
          { id: '1', name: 'John Doe', number: 10 },
          { id: '2', name: 'Jane Smith', number: 15 },
        ],
      },
    }).as('teamRoster');
    
    cy.intercept('GET', '**/api/locations', {
      statusCode: 200,
      body: {
        locations: [
          { id: '1', name: 'Main Rink', type: 'ice' },
        ],
      },
    }).as('locations');
    
    cy.intercept('POST', '**/api/training/sessions', {
      statusCode: 201,
      body: { id: '100', success: true },
    }).as('createSession');
    
    // Login
    loginPage.visit();
    loginPage.login('test.coach@hockeyhub.com', 'TestCoach123!');
    
    cy.wait('@login');
    cy.url().should('include', '/coach');
    cy.wait('@coachDashboard');
    
    // Create session
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    coachDashboard.openCreateSessionForm();
    cy.wait(['@teamRoster', '@locations']);
    
    coachDashboard.fillSessionDetails({
      title: 'Test Practice Session',
      type: 'practice',
      date: tomorrow,
      startTime: '16:00',
      endTime: '18:00',
    });
    
    coachDashboard.selectAllPlayers();
    coachDashboard.submitSession();
    
    cy.wait('@createSession');
    coachDashboard.assertSessionCreated('Test Practice Session');
  });
  
  it('All user roles can access their dashboards', () => {
    const loginPage = new LoginPage();
    
    const roleTests = [
      { email: 'test.player@hockeyhub.com', password: 'TestPlayer123!', url: '/player' },
      { email: 'test.coach@hockeyhub.com', password: 'TestCoach123!', url: '/coach' },
      { email: 'test.parent@hockeyhub.com', password: 'TestParent123!', url: '/parent' },
      { email: 'test.medical@hockeyhub.com', password: 'TestMedical123!', url: '/medical' },
    ];
    
    // Mock all role logins
    cy.intercept('POST', '**/api/auth/login', (req) => {
      const { email } = req.body;
      let role = 'PLAYER';
      
      if (email.includes('coach')) role = 'COACH';
      else if (email.includes('parent')) role = 'PARENT';
      else if (email.includes('medical')) role = 'MEDICAL_STAFF';
      
      req.reply({
        statusCode: 200,
        body: {
          token: `mock-jwt-token-${role}`,
          refreshToken: 'mock-refresh-token',
          user: {
            id: `${role}1`,
            email: email,
            role: role,
            firstName: 'Test',
            lastName: role,
          },
        },
      });
    });
    
    roleTests.forEach(({ email, password, url }) => {
      loginPage.visit();
      loginPage.login(email, password);
      cy.url().should('include', url);
      cy.get('[data-testid="dashboard-header"]').should('be.visible');
      cy.logout();
    });
  });
  
  it('Handles API errors gracefully', () => {
    const loginPage = new LoginPage();
    
    // Mock network error
    cy.intercept('POST', '**/api/auth/login', {
      forceNetworkError: true,
    }).as('networkError');
    
    loginPage.visit();
    loginPage.login('test@example.com', 'password');
    
    // Should show network error
    cy.contains('Network error').should('be.visible');
    
    // Mock server error
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 500,
      body: { error: 'Internal server error' },
    }).as('serverError');
    
    loginPage.login('test@example.com', 'password');
    
    // Should show server error
    cy.contains('server error', { matchCase: false }).should('be.visible');
  });
});