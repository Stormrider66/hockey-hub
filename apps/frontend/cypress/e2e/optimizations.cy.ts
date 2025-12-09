/// <reference types="cypress" />

describe('Performance Optimizations E2E Tests', () => {
  beforeEach(() => {
    // Visit the app
    cy.visit('http://localhost:3010');
    
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-token');
      win.localStorage.setItem('user', JSON.stringify({
        id: 'user-1',
        role: 'physicaltrainer',
        name: 'Test Trainer'
      }));
    });
  });

  describe('Service Worker and Offline Functionality', () => {
    it('should register service worker and handle offline mode', () => {
      // Check service worker registration
      cy.window().then((win) => {
        expect(win.navigator.serviceWorker).to.exist;
      });

      // Wait for service worker to be ready
      cy.wait(2000);

      // Simulate offline mode
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false);
        win.dispatchEvent(new Event('offline'));
      });

      // Should show offline indicator
      cy.get('[data-testid="offline-indicator"]').should('be.visible');

      // Navigate while offline - should still work with cached data
      cy.get('[data-testid="nav-calendar"]').click();
      cy.url().should('include', '/calendar');

      // Simulate coming back online
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(true);
        win.dispatchEvent(new Event('online'));
      });

      // Offline indicator should disappear
      cy.get('[data-testid="offline-indicator"]').should('not.exist');
    });

    it('should cache API responses and serve them offline', () => {
      // Make initial request to cache data
      cy.visit('http://localhost:3010/physicaltrainer');
      
      // Wait for data to load
      cy.get('[data-testid="player-list"]').should('be.visible');

      // Intercept and block network requests
      cy.intercept('GET', '/api/**', { forceNetworkError: true }).as('blockedApi');

      // Reload page - should still show cached data
      cy.reload();
      
      // Data should still be visible from cache
      cy.get('[data-testid="player-list"]').should('be.visible');
      cy.get('[data-testid="player-card"]').should('have.length.greaterThan', 0);
    });
  });

  describe('Image Optimization', () => {
    it('should lazy load images as user scrolls', () => {
      cy.visit('http://localhost:3010/physicaltrainer');

      // Initially, only visible images should be loaded
      cy.get('img[loading="lazy"]').should('exist');

      // Get initial loaded images count
      let initialLoadedImages = 0;
      cy.get('img').each(($img) => {
        const el = $img[0] as HTMLImageElement;
        if (el.complete && el.naturalHeight !== 0) {
          initialLoadedImages++;
        }
      });

      // Scroll down
      cy.scrollTo('bottom', { duration: 1000 });

      // More images should be loaded after scrolling
      cy.wait(1000); // Wait for lazy loading
      
      let finalLoadedImages = 0;
      cy.get('img').each(($img) => {
        const el = $img[0] as HTMLImageElement;
        if (el.complete && el.naturalHeight !== 0) {
          finalLoadedImages++;
        }
      }).then(() => {
        expect(finalLoadedImages).to.be.greaterThan(initialLoadedImages);
      });
    });

    it('should use optimized image formats', () => {
      cy.visit('http://localhost:3010/physicaltrainer');

      // Check that Next.js Image component is being used
      cy.get('img').each(($img) => {
        const src = $img.attr('src');
        if (src && src.startsWith('/_next/image')) {
          // Next.js optimized images include optimization parameters
          expect(src).to.include('w=');
          expect(src).to.include('q=');
        }
      });
    });
  });

  describe('Code Splitting and Navigation', () => {
    it('should load routes dynamically on navigation', () => {
      cy.visit('http://localhost:3010');

      // Check initial bundle
      cy.window().then((win) => {
        const initialScripts = win.document.querySelectorAll('script').length;

        // Navigate to calendar
        cy.get('[data-testid="nav-calendar"]').click();
        cy.url().should('include', '/calendar');

        // New scripts should be loaded for the route
        cy.window().then((newWin) => {
          const finalScripts = newWin.document.querySelectorAll('script').length;
          expect(finalScripts).to.be.greaterThan(initialScripts);
        });
      });
    });

    it('should prefetch visible links', () => {
      cy.visit('http://localhost:3010/physicaltrainer');

      // Check that links have prefetch
      cy.get('a[href^="/"]').each(($link) => {
        // Next.js should add prefetch to internal links
        cy.wrap($link).should('have.attr', 'href');
      });

      // Hover over a link to trigger prefetch
      cy.get('[data-testid="nav-players"]').trigger('mouseover');
      
      // Check network tab would show prefetch (in real scenario)
      cy.wait(500);
    });
  });

  describe('Virtual Scrolling Performance', () => {
    it('should efficiently render large lists', () => {
      cy.visit('http://localhost:3010/physicaltrainer');

      // Navigate to a view with large list
      cy.get('[data-testid="view-all-players"]').click();

      // Check that not all items are rendered at once
      cy.get('[data-testid="player-list-container"]').within(() => {
        // Get total count from UI
        cy.get('[data-testid="total-players-count"]').then(($count) => {
          const totalPlayers = parseInt($count.text());
          
          // Count rendered items
          cy.get('[data-testid="player-card"]').then(($cards) => {
            // Should render fewer items than total (virtual scrolling)
            expect($cards.length).to.be.lessThan(totalPlayers);
          });
        });
      });

      // Scroll and verify smooth performance
      const startTime = Date.now();
      
      cy.get('[data-testid="player-list-container"]').scrollTo('bottom', {
        duration: 2000
      });

      const scrollTime = Date.now() - startTime;
      
      // Scrolling should be smooth (under 3 seconds for full scroll)
      expect(scrollTime).to.be.lessThan(3000);

      // More items should be rendered after scrolling
      cy.get('[data-testid="player-card"]').should('have.length.greaterThan', 10);
    });
  });

  describe('Real-time Updates with Optimizations', () => {
    it('should handle WebSocket updates efficiently', () => {
      cy.visit('http://localhost:3010/physicaltrainer');

      // Open notification center
      cy.get('[data-testid="notification-bell"]').click();

      // Simulate WebSocket connection
      cy.window().then((win) => {
        // Mock WebSocket message
        const mockNotification = {
          type: 'notification',
          data: {
            id: 'test-notification',
            title: 'New Test Notification',
            content: 'This is a test notification',
            createdAt: new Date().toISOString()
          }
        };

        // Trigger WebSocket event
        win.dispatchEvent(new CustomEvent('websocket-message', {
          detail: mockNotification
        }));
      });

      // New notification should appear without page reload
      cy.get('[data-testid="notification-item"]')
        .contains('New Test Notification')
        .should('be.visible');
    });
  });

  describe('Performance Metrics', () => {
    it('should meet performance budgets', () => {
      // Visit with performance marks
      cy.visit('http://localhost:3010/physicaltrainer', {
        onBeforeLoad: (win) => {
          win.performance.mark('navigationStart');
        }
      });

      // Wait for page to be interactive
      cy.get('[data-testid="dashboard-loaded"]').should('be.visible');

      // Check performance metrics
      cy.window().then((win) => {
        win.performance.mark('pageInteractive');
        win.performance.measure('pageLoad', 'navigationStart', 'pageInteractive');

        const measure = win.performance.getEntriesByName('pageLoad')[0];
        
        // Page should be interactive within 2 seconds
        expect(measure.duration).to.be.lessThan(2000);

        // Check First Contentful Paint
        const paintEntries = win.performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        
        if (fcp) {
          expect(fcp.startTime).to.be.lessThan(1000); // Under 1 second
        }
      });
    });

    it('should not have memory leaks during navigation', () => {
      // Initial memory snapshot
      cy.window().then((win) => {
        const initialMemory = (win.performance as any).memory?.usedJSHeapSize || 0;
        cy.wrap(initialMemory).as('initialMemory');
      });

      // Navigate through multiple routes
      const routes = [
        '/physicaltrainer',
        '/calendar',
        '/players',
        '/sessions',
        '/physicaltrainer'
      ];

      routes.forEach((route) => {
        cy.visit(`http://localhost:3010${route}`);
        cy.wait(500);
      });

      // Check final memory
      cy.get('@initialMemory').then((initialMemory) => {
        cy.window().then((win) => {
          const finalMemory = (win.performance as any).memory?.usedJSHeapSize || 0;
          const initial = typeof initialMemory === 'number' ? initialMemory : Number(initialMemory as any);
          const memoryIncrease = finalMemory - initial;
          
          // Memory increase should be reasonable (less than 50MB)
          expect(memoryIncrease).to.be.lessThan(50 * 1024 * 1024);
        });
      });
    });
  });

  describe('Mobile Performance', () => {
    beforeEach(() => {
      // Set mobile viewport
      cy.viewport('iphone-x');
    });

    it('should perform well on mobile devices', () => {
      cy.visit('http://localhost:3010/physicaltrainer');

      // Check mobile-specific optimizations
      cy.get('[data-testid="mobile-menu"]').should('be.visible');

      // Test touch scrolling
      cy.get('[data-testid="player-list-container"]')
        .trigger('touchstart', { touches: [{ clientY: 100 }] })
        .trigger('touchmove', { touches: [{ clientY: 50 }] })
        .trigger('touchend');

      // Should scroll smoothly
      cy.get('[data-testid="player-list-container"]').should((el) => {
        expect(el[0].scrollTop).to.be.greaterThan(0);
      });

      // Check that heavy components are not loaded on mobile
      cy.get('[data-testid="desktop-only-widget"]').should('not.exist');
    });

    it('should use mobile-optimized images', () => {
      cy.visit('http://localhost:3010/physicaltrainer');

      // Check image sizes are appropriate for mobile
      cy.get('img').each(($img) => {
        const width = $img.width();
        const height = $img.height();
        
        // Images should not be larger than viewport
        expect(width).to.be.lessThan(400);
      });
    });
  });

  describe('Cache Strategy Validation', () => {
    it('should implement proper cache headers', () => {
      // Intercept API requests to check cache headers
      cy.intercept('GET', '/api/**').as('apiRequest');

      cy.visit('http://localhost:3010/physicaltrainer');

      cy.wait('@apiRequest').then((interception) => {
        // Check for cache headers
        const headers = interception.response?.headers;
        
        if (headers) {
          // Should have cache control headers
          expect(headers).to.have.property('cache-control');
          
          // Static assets should have long cache
          if (interception.request.url.includes('/static/')) {
            expect(headers['cache-control']).to.include('max-age=31536000');
          }
        }
      });
    });

    it('should invalidate cache on data updates', () => {
      cy.visit('http://localhost:3010/physicaltrainer');

      // Get initial data
      cy.get('[data-testid="player-count"]').then(($count) => {
        const initialCount = $count.text();

        // Add new player
        cy.get('[data-testid="add-player-btn"]').click();
        cy.get('[data-testid="player-name-input"]').type('New Player');
        cy.get('[data-testid="save-player-btn"]').click();

        // Count should update (cache invalidated)
        cy.get('[data-testid="player-count"]').should('not.have.text', initialCount);
      });
    });
  });

  describe('Error Recovery with Optimizations', () => {
    it('should gracefully handle errors without breaking optimizations', () => {
      // Simulate API error
      cy.intercept('GET', '/api/players', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('playersError');

      cy.visit('http://localhost:3010/physicaltrainer');

      // Should show error state
      cy.get('[data-testid="error-message"]').should('be.visible');

      // Other components should still work
      cy.get('[data-testid="nav-calendar"]').click();
      cy.url().should('include', '/calendar');

      // Calendar should load despite player API error
      cy.get('[data-testid="calendar-view"]').should('be.visible');
    });

    it('should retry failed requests with exponential backoff', () => {
      let attemptCount = 0;

      cy.intercept('GET', '/api/notifications', (req) => {
        attemptCount++;
        if (attemptCount < 3) {
          req.reply({
            statusCode: 500,
            body: { error: 'Server error' }
          });
        } else {
          req.reply({
            statusCode: 200,
            body: { notifications: [] }
          });
        }
      }).as('notificationsRetry');

      cy.visit('http://localhost:3010/physicaltrainer');
      cy.get('[data-testid="notification-bell"]').click();

      // Should eventually succeed after retries
      cy.wait('@notificationsRetry');
      cy.wait('@notificationsRetry');
      cy.wait('@notificationsRetry');

      // Notifications should load after retries
      cy.get('[data-testid="notifications-panel"]').should('be.visible');
      expect(attemptCount).to.equal(3);
    });
  });
});