// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';
import '@testing-library/cypress/add-commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add custom types
declare global {
  namespace Cypress {
    interface Chainable {
      // Custom command to login
      login(email: string, password: string): Chainable<void>;
      
      // Custom command to logout
      logout(): Chainable<void>;
      
      // Custom command to seed test data
      seedTestData(fixture: string): Chainable<void>;
      
      // Custom command to clean up test data
      cleanupTestData(): Chainable<void>;
      
      // Custom command to wait for API
      waitForApi(alias: string): Chainable<void>;
      
      // Custom command to check toast notification
      checkToast(message: string, type?: 'success' | 'error' | 'info'): Chainable<void>;
      
      // Custom command to select date in calendar
      selectDate(date: Date): Chainable<void>;
      
      // Custom command to mock API response
      mockApiResponse(method: string, url: string, response: any, statusCode?: number): Chainable<void>;
    }
  }
}

// Prevent Cypress from failing tests due to uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  // You might want to log the error or handle specific errors differently
  console.error('Uncaught exception:', err);
  return false;
});

// Add viewport sizes
export const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  wide: { width: 1920, height: 1080 },
};

// Add test user credentials
export const testUsers = {
  player: {
    email: 'test.player@hockeyhub.com',
    password: 'TestPlayer123!',
    role: 'PLAYER',
  },
  coach: {
    email: 'test.coach@hockeyhub.com',
    password: 'TestCoach123!',
    role: 'COACH',
  },
  parent: {
    email: 'test.parent@hockeyhub.com',
    password: 'TestParent123!',
    role: 'PARENT',
  },
  medicalStaff: {
    email: 'test.medical@hockeyhub.com',
    password: 'TestMedical123!',
    role: 'MEDICAL_STAFF',
  },
  admin: {
    email: 'test.admin@hockeyhub.com',
    password: 'TestAdmin123!',
    role: 'ADMIN',
  },
};

// Configure default headers
beforeEach(() => {
  // Set default headers for API requests
  cy.intercept('**/api/**', (req) => {
    req.headers['Accept'] = 'application/json';
    req.headers['Content-Type'] = 'application/json';
  });
});