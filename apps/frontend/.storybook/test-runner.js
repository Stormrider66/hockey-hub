const { getStoryContext } = require('@storybook/test-runner');
const { injectAxe, checkA11y } = require('axe-playwright');

/*
 * Storybook test runner configuration for visual regression testing
 * This file configures automated testing for all loading components and skeleton screens
 */

module.exports = {
  async preRender(page, context) {
    // Inject axe-core for accessibility testing
    await injectAxe(page);
  },
  
  async postRender(page, context) {
    // Get story context
    const storyContext = await getStoryContext(page, context);
    
    // Skip visual regression for stories marked as skip
    if (storyContext.parameters?.visualRegression?.skip) {
      return;
    }
    
    // Wait for animations to complete for loading components
    if (storyContext.title.includes('Loading Components') || 
        storyContext.title.includes('Skeleton Screens')) {
      // Wait for animations to stabilize
      await page.waitForTimeout(500);
      
      // Disable animations for consistent snapshots
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
          }
        `
      });
    }
    
    // Take screenshot for visual regression
    await page.screenshot({
      path: `./src/__tests__/optimizations/visual-regression/${context.id}.png`,
      fullPage: true,
      animations: 'disabled'
    });
    
    // Run accessibility tests
    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
      // Rules specific to loading states
      rules: {
        'color-contrast': { enabled: false }, // Disabled for skeletons
        'empty-heading': { enabled: false }, // Skeletons may have empty headings
      },
    });
    
    // Additional tests for loading components
    if (storyContext.title.includes('Loading Components')) {
      // Verify ARIA attributes
      const spinner = await page.locator('[role="status"]');
      if (await spinner.count() > 0) {
        const ariaLabel = await spinner.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      }
      
      // Verify progress bar attributes
      const progressBar = await page.locator('[role="progressbar"]');
      if (await progressBar.count() > 0) {
        const ariaValueNow = await progressBar.getAttribute('aria-valuenow');
        const ariaValueMin = await progressBar.getAttribute('aria-valuemin');
        const ariaValueMax = await progressBar.getAttribute('aria-valuemax');
        
        expect(ariaValueMin).toBe('0');
        expect(ariaValueMax).toBe('100');
        expect(ariaValueNow).toBeTruthy();
      }
    }
    
    // Additional tests for skeleton screens
    if (storyContext.title.includes('Skeleton Screens')) {
      // Verify all skeletons have animation
      const skeletons = await page.locator('[data-testid*="skeleton"]');
      const count = await skeletons.count();
      
      for (let i = 0; i < count; i++) {
        const skeleton = skeletons.nth(i);
        const classes = await skeleton.getAttribute('class');
        expect(classes).toContain('animate-pulse');
      }
    }
  },
  
  // Tags to include/exclude in test runs
  tags: {
    include: ['optimizations'],
    exclude: ['skip-test'],
  },
};