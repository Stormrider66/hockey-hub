/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session(
    [email, password],
    () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type(email);
      cy.get('input[name="password"]').type(password);
      cy.get('button[type="submit"]').click();
      
      // Wait for redirect to dashboard
      cy.url().should('not.include', '/login');
      
      // Verify token is stored
      cy.window().then((win) => {
        expect(win.localStorage.getItem('token')).to.exist;
      });
    },
    {
      validate() {
        // Validate the session is still valid
        cy.window().then((win) => {
          const token = win.localStorage.getItem('token');
          expect(token).to.exist;
        });
      },
    }
  );
});

// Custom command to logout
Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('token');
    win.localStorage.removeItem('refreshToken');
    win.localStorage.removeItem('user');
  });
  cy.visit('/login');
});

// Custom command to seed test data
Cypress.Commands.add('seedTestData', (fixture: string) => {
  cy.fixture(fixture).then((data) => {
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/test/seed`,
      body: data,
      headers: {
        Authorization: `Bearer ${window.localStorage.getItem('token')}`,
      },
    });
  });
});

// Custom command to clean up test data
Cypress.Commands.add('cleanupTestData', () => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/test/cleanup`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`,
    },
    failOnStatusCode: false,
  });
});

// Custom command to wait for API with better error handling
Cypress.Commands.add('waitForApi', (alias: string) => {
  cy.intercept('**/api/**').as('apiCall');
  cy.wait(`@${alias}`, { timeout: 10000 }).then((interception) => {
    if (interception.response) {
      expect(interception.response.statusCode).to.be.lessThan(400);
    }
  });
});

// Custom command to check toast notifications
Cypress.Commands.add('checkToast', (message: string, type = 'success') => {
  const toastClass = type === 'error' ? '.toast-error' : type === 'success' ? '.toast-success' : '.toast-info';
  cy.get(toastClass).should('be.visible').and('contain', message);
  
  // Wait for toast to disappear
  cy.get(toastClass, { timeout: 5000 }).should('not.exist');
});

// Custom command to select date in calendar
Cypress.Commands.add('selectDate', (date: Date) => {
  const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const day = date.getDate();
  
  // Open date picker
  cy.get('[data-testid="date-picker"]').click();
  
  // Navigate to correct month/year if needed
  cy.get('.date-picker-header').then(($header) => {
    if (!$header.text().includes(monthYear)) {
      // Navigate to correct month
      const targetTime = date.getTime();
      const currentTime = new Date().getTime();
      const direction = targetTime > currentTime ? 'next' : 'prev';
      
      // Click navigation buttons until we reach the right month
      const clickUntilMonth = () => {
        cy.get(`.date-picker-${direction}`).click();
        cy.get('.date-picker-header').then(($newHeader) => {
          if (!$newHeader.text().includes(monthYear)) {
            clickUntilMonth();
          }
        });
      };
      clickUntilMonth();
    }
  });
  
  // Click the day
  cy.get(`[data-date="${date.toISOString().split('T')[0]}"]`).click();
});

// Custom command to mock API responses
Cypress.Commands.add('mockApiResponse', (method: string, url: string, response: any, statusCode = 200) => {
  cy.intercept(
    {
      method,
      url,
    },
    {
      statusCode,
      body: response,
      headers: {
        'content-type': 'application/json',
      },
    }
  ).as(`mock${method}${url.replace(/\//g, '')}`);
});

// Helper function to upload files
Cypress.Commands.add('uploadFile', { prevSubject: 'element' }, (subject, fileName, mimeType) => {
  cy.fixture(fileName, 'base64').then((fileContent) => {
    const blob = Cypress.Blob.base64StringToBlob(fileContent, mimeType);
    const file = new File([blob], fileName, { type: mimeType });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const el = subject[0];
    el.files = dataTransfer.files;
    cy.wrap(subject).trigger('change', { force: true });
  });
});

// Helper to check accessibility
Cypress.Commands.add('checkA11y', (context?, options?) => {
  cy.injectAxe();
  cy.checkA11y(context, options);
});

// Export empty object to make this a module
export {};