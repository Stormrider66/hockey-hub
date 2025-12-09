describe('Loading State Standardization Tests', () => {
  beforeEach(() => {
    cy.visit('/test-loading');
  });

  describe('Loading Components', () => {
    it('should display all loading spinner sizes correctly', () => {
      cy.get('button').contains('components').click();
      
      // Test spinner sizes
      cy.contains('Small').parent().find('[role="status"]').should('exist');
      cy.contains('Medium').parent().find('[role="status"]').should('exist');
      cy.contains('Large').parent().find('[role="status"]').should('exist');
      cy.contains('Extra Large').parent().find('[role="status"]').should('exist');
      
      // Verify spinner animation
      cy.get('[role="status"]').first().should('have.class', 'animate-spin');
    });

    it('should display loading skeleton variants', () => {
      cy.contains('Text Variant').parent().find('[data-testid="loading-skeleton"]').should('have.length', 3);
      cy.contains('Rectangular Variant').parent().find('[data-testid="loading-skeleton"]').should('exist');
      cy.contains('Circular Variant').parent().find('[data-testid="loading-skeleton"]').should('have.length', 3);
    });

    it('should show and hide loading overlay', () => {
      cy.contains('Show Loading Overlay').click();
      cy.contains('Processing your request...').should('be.visible');
      cy.get('button').contains('Cancel').should('be.visible');
      
      // Test cancel functionality
      cy.get('button').contains('Cancel').click();
      cy.contains('Processing your request...').should('not.exist');
    });

    it('should display progress bar with correct values', () => {
      cy.get('[role="progressbar"]').first().should('have.attr', 'aria-valuenow');
      cy.contains('Indeterminate Progress').parent().find('[role="progressbar"]').should('not.have.attr', 'aria-valuenow');
    });

    it('should show loading dots animation', () => {
      cy.get('[data-testid^="loading-dot-"]').should('have.length', 3);
      cy.get('[data-testid="loading-dot-0"]').should('have.css', 'animation-delay', '0ms');
      cy.get('[data-testid="loading-dot-1"]').should('have.css', 'animation-delay', '150ms');
      cy.get('[data-testid="loading-dot-2"]').should('have.css', 'animation-delay', '300ms');
    });

    it('should handle loading state component correctly', () => {
      cy.contains('Toggle Loading State').click();
      cy.get('[role="status"]').should('be.visible');
      
      cy.contains('Toggle Loading State').click();
      cy.contains('Content loaded successfully!').should('be.visible');
    });
  });

  describe('Skeleton Screens', () => {
    beforeEach(() => {
      cy.get('button').contains('skeletons').click();
    });

    it('should display all skeleton components', () => {
      // Player and workout skeletons
      cy.contains('Player Card').parent().find('[data-testid="loading-skeleton"]').should('exist');
      cy.contains('Workout Card').parent().find('[data-testid="loading-skeleton"]').should('exist');
      
      // Dashboard skeletons
      cy.contains('Dashboard Widget').parent().find('[data-testid="loading-skeleton"]').should('exist');
      cy.contains('Stat Card').parent().find('[data-testid="loading-skeleton"]').should('exist');
      
      // Table and form skeletons
      cy.contains('Table Rows').parent().find('[data-testid="loading-skeleton"]').should('have.length.at.least', 4);
      cy.contains('Form Fields').parent().find('[data-testid="loading-skeleton"]').should('have.length.at.least', 3);
      
      // Communication skeletons
      cy.contains('Chat Messages').parent().find('[data-testid="loading-skeleton"]').should('have.length.at.least', 2);
      cy.contains('Calendar Event').parent().find('[data-testid="loading-skeleton"]').should('exist');
    });
  });

  describe('Page Skeletons', () => {
    beforeEach(() => {
      cy.get('button').contains('pages').click();
    });

    it('should display navigation skeleton', () => {
      cy.contains('Full Navigation').parent().find('[data-testid="loading-skeleton"]').should('have.length.at.least', 5);
    });

    it('should display dashboard skeleton', () => {
      cy.contains('Complete Dashboard').parent().find('[data-testid="loading-skeleton"]').should('have.length.at.least', 10);
    });

    it('should display list and detail page skeletons', () => {
      cy.contains('List Page').parent().find('[data-testid="loading-skeleton"]').should('exist');
      cy.contains('Detail Page').parent().find('[data-testid="loading-skeleton"]').should('exist');
    });
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      cy.get('button').contains('integration').click();
    });

    it('should have proper accessibility attributes', () => {
      // Check ARIA labels
      cy.get('[role="status"]').each(($el) => {
        cy.wrap($el).should('have.attr', 'aria-label');
      });
      
      // Check screen reader text
      cy.get('.sr-only').should('contain', 'Loading...');
    });

    it('should be responsive', () => {
      // Test mobile viewport
      cy.viewport(375, 667);
      cy.get('[role="status"]').should('be.visible');
      
      // Test tablet viewport
      cy.viewport(768, 1024);
      cy.get('[role="status"]').should('be.visible');
      
      // Test desktop viewport
      cy.viewport(1920, 1080);
      cy.get('[role="status"]').should('be.visible');
    });

    it('should support dark mode', () => {
      // Check that components have dark mode classes
      cy.get('html').then(($html) => {
        if ($html.hasClass('dark')) {
          cy.get('.dark\\:bg-gray-800').should('exist');
          cy.get('.dark\\:text-gray-200').should('exist');
        }
      });
    });

    it('should handle multiple concurrent loading states', () => {
      cy.contains('Multiple Loading States').parent().find('[role="status"]').should('have.length', 8);
      cy.contains('Multiple Loading States').parent().find('[data-testid="loading-skeleton"]').should('have.length', 5);
    });
  });

  describe('Real Page Integration', () => {
    it('should use standardized loading in login page', () => {
      cy.visit('/login');
      // Check for standardized components, not old spinners
      cy.get('.animate-spin').should('not.exist');
      cy.get('[role="status"]').should('not.exist'); // Should not show on initial load
    });

    it('should use standardized loading in dashboards', () => {
      // Mock authentication
      cy.window().then((win) => {
        win.localStorage.setItem('mockAuth', 'true');
        win.localStorage.setItem('userRole', 'player');
      });
      
      cy.visit('/player');
      
      // Check for loading states during data fetch
      cy.get('[role="status"]').should('exist');
      cy.get('[data-testid="loading-skeleton"]').should('exist');
    });
  });

  describe('Performance Tests', () => {
    it('should render loading components quickly', () => {
      cy.get('button').contains('components').click();
      
      // Measure render time
      const startTime = performance.now();
      cy.get('[role="status"]').should('have.length.at.least', 4).then(() => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        expect(renderTime).to.be.lessThan(1000); // Should render in less than 1 second
      });
    });

    it('should not cause layout shift', () => {
      // Check that loading components have fixed dimensions
      cy.get('[role="status"]').first().then(($el) => {
        const initialPosition = $el[0].getBoundingClientRect();
        
        cy.wait(1000); // Wait for any animations
        
        cy.get('[role="status"]').first().then(($el2) => {
          const finalPosition = $el2[0].getBoundingClientRect();
          expect(initialPosition.width).to.equal(finalPosition.width);
          expect(initialPosition.height).to.equal(finalPosition.height);
        });
      });
    });
  });
});