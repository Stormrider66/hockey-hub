import { LoginPage } from '../../page-objects/LoginPage';
import { RegistrationPage } from '../../page-objects/RegistrationPage';
import { testUsers } from '../../support/e2e';

describe('User Registration and Login Flow', () => {
  const loginPage = new LoginPage();
  const registrationPage = new RegistrationPage();
  
  beforeEach(() => {
    // Clean up any existing test data
    cy.cleanupTestData();
  });
  
  describe('Registration', () => {
    it('should register a new player successfully', () => {
      const timestamp = Date.now();
      const newUser = {
        firstName: 'Test',
        lastName: 'Player',
        email: `test.player.${timestamp}@hockeyhub.com`,
        password: 'TestPlayer123!',
        phone: '+1234567890',
        role: 'PLAYER',
      };
      
      registrationPage.visit();
      registrationPage.register(newUser);
      registrationPage.assertRegistrationSuccess();
      
      // Verify email sent
      cy.contains('Verification email sent').should('be.visible');
    });
    
    it('should show validation errors for invalid inputs', () => {
      registrationPage.visit();
      
      // Try to submit empty form
      registrationPage.submit();
      
      // Check for validation errors
      registrationPage.assertFieldError('firstName', 'First name is required');
      registrationPage.assertFieldError('lastName', 'Last name is required');
      registrationPage.assertFieldError('email', 'Email is required');
      registrationPage.assertFieldError('password', 'Password is required');
      
      // Test invalid email
      registrationPage.fillEmail('invalid-email');
      registrationPage.assertFieldError('email', 'Invalid email format');
      
      // Test weak password
      registrationPage.fillPasswords('weak');
      registrationPage.assertFieldError('password', 'Password must be at least 8 characters');
      
      // Test password mismatch
      registrationPage.fillPasswords('StrongPass123!', 'DifferentPass123!');
      registrationPage.assertFieldError('confirmPassword', 'Passwords do not match');
    });
    
    it('should prevent duplicate email registration', () => {
      registrationPage.visit();
      registrationPage.register({
        firstName: 'Duplicate',
        lastName: 'User',
        email: testUsers.player.email,
        password: 'TestPassword123!',
      });
      
      registrationPage.assertRegistrationError('Email already exists');
    });
  });
  
  describe('Login', () => {
    it('should login successfully with valid credentials', () => {
      loginPage.visit();
      loginPage.login(testUsers.player.email, testUsers.player.password);
      loginPage.assertLoginSuccess();
      
      // Verify redirect to player dashboard
      cy.url().should('include', '/player');
      cy.contains('Welcome back').should('be.visible');
    });
    
    it('should show error for invalid credentials', () => {
      loginPage.visit();
      loginPage.login('invalid@email.com', 'wrongpassword');
      loginPage.assertLoginError('Invalid email or password');
    });
    
    it('should remember user when checkbox is checked', () => {
      loginPage.visit();
      loginPage.checkRememberMe();
      loginPage.login(testUsers.player.email, testUsers.player.password);
      
      // Verify token persists after reload
      cy.reload();
      cy.url().should('include', '/player');
    });
    
    it('should redirect to appropriate dashboard based on role', () => {
      // Test different user roles
      const roleTests = [
        { user: testUsers.player, expectedUrl: '/player' },
        { user: testUsers.coach, expectedUrl: '/coach' },
        { user: testUsers.parent, expectedUrl: '/parent' },
        { user: testUsers.medicalStaff, expectedUrl: '/medical' },
        { user: testUsers.admin, expectedUrl: '/admin' },
      ];
      
      roleTests.forEach(({ user, expectedUrl }) => {
        cy.logout();
        loginPage.visit();
        loginPage.login(user.email, user.password);
        cy.url().should('include', expectedUrl);
      });
    });
    
    it('should handle forgot password flow', () => {
      loginPage.visit();
      loginPage.clickForgotPassword();
      
      cy.url().should('include', '/forgot-password');
      cy.get('input[name="email"]').type(testUsers.player.email);
      cy.get('button[type="submit"]').click();
      
      cy.contains('Password reset email sent').should('be.visible');
    });
  });
  
  describe('Session Management', () => {
    it('should maintain session across page refreshes', () => {
      cy.login(testUsers.player.email, testUsers.player.password);
      cy.visit('/player');
      
      // Refresh the page
      cy.reload();
      
      // Should still be logged in
      cy.url().should('include', '/player');
      cy.contains('Welcome back').should('be.visible');
    });
    
    it('should logout successfully', () => {
      cy.login(testUsers.player.email, testUsers.player.password);
      cy.visit('/player');
      
      // Logout
      cy.get('[data-testid="user-menu"]').click();
      cy.get('button:contains("Logout")').click();
      
      // Should redirect to login
      cy.url().should('include', '/login');
      
      // Try to access protected route
      cy.visit('/player');
      cy.url().should('include', '/login');
    });
    
    it('should handle token expiration gracefully', () => {
      cy.login(testUsers.player.email, testUsers.player.password);
      
      // Simulate expired token
      cy.window().then((win) => {
        const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.invalid';
        win.localStorage.setItem('token', expiredToken);
      });
      
      // Try to make an API call
      cy.visit('/player');
      
      // Should redirect to login
      cy.url().should('include', '/login');
      cy.contains('Session expired').should('be.visible');
    });
  });
});