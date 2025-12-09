const { chromium } = require('playwright');

/**
 * Visual Regression Test Configuration
 * 
 * This configuration sets up visual regression testing for Phase 2 loading components
 * and skeleton screens using Playwright and Storybook.
 */

module.exports = {
  // Test configuration
  testDir: './src/stories/optimizations',
  testMatch: ['**/*.stories.@(js|jsx|ts|tsx)'],
  
  // Output configuration
  outputDir: './src/__tests__/optimizations/visual-regression/results',
  
  // Browser configuration
  use: {
    // Browser to use
    browserName: 'chromium',
    
    // Viewport size for consistent screenshots
    viewport: { width: 1280, height: 720 },
    
    // Device scale factor
    deviceScaleFactor: 1,
    
    // Disable animations for consistent snapshots
    screenshot: {
      animations: 'disabled',
      fullPage: true,
    },
    
    // Test timeout
    timeout: 30000,
  },
  
  // Snapshot comparison configuration
  expect: {
    // Threshold for pixel differences (0-1)
    toMatchSnapshot: {
      threshold: 0.2,
      maxDiffPixels: 100,
    },
  },
  
  // Stories to test
  stories: [
    // Loading Components
    {
      id: 'optimizations-phase2-loading-components--spinner-sizes',
      name: 'LoadingSpinner - All Sizes',
      viewport: { width: 800, height: 200 },
    },
    {
      id: 'optimizations-phase2-loading-components--spinner-colors',
      name: 'LoadingSpinner - Color Variants',
      viewport: { width: 800, height: 200 },
    },
    {
      id: 'optimizations-phase2-loading-components--skeleton-types',
      name: 'LoadingSkeleton - All Types',
      viewport: { width: 600, height: 600 },
    },
    {
      id: 'optimizations-phase2-loading-components--overlay-default',
      name: 'LoadingOverlay - Default State',
      viewport: { width: 600, height: 300 },
    },
    {
      id: 'optimizations-phase2-loading-components--progress-bar-states',
      name: 'ProgressBar - All States',
      viewport: { width: 600, height: 400 },
    },
    {
      id: 'optimizations-phase2-loading-components--dots-sizes',
      name: 'LoadingDots - Size Variants',
      viewport: { width: 400, height: 300 },
    },
    
    // Skeleton Screens
    {
      id: 'optimizations-phase2-skeleton-screens--player-card',
      name: 'PlayerCardSkeleton',
      viewport: { width: 400, height: 200 },
    },
    {
      id: 'optimizations-phase2-skeleton-screens--workout-card',
      name: 'WorkoutCardSkeleton',
      viewport: { width: 400, height: 300 },
    },
    {
      id: 'optimizations-phase2-skeleton-screens--dashboard-widget-sizes',
      name: 'DashboardWidgetSkeleton - All Sizes',
      viewport: { width: 600, height: 600 },
    },
    {
      id: 'optimizations-phase2-skeleton-screens--table-multiple-rows',
      name: 'TableRowSkeleton - Multiple Rows',
      viewport: { width: 800, height: 400 },
    },
    {
      id: 'optimizations-phase2-skeleton-screens--form-variations',
      name: 'FormSkeleton - Variations',
      viewport: { width: 700, height: 800 },
    },
    {
      id: 'optimizations-phase2-skeleton-screens--complete-page-loading',
      name: 'Complete Page Loading State',
      viewport: { width: 1280, height: 900 },
    },
  ],
  
  // Test hooks
  beforeAll: async () => {
    console.log('Starting visual regression tests for Phase 2 Loading Components...');
  },
  
  afterAll: async () => {
    console.log('Visual regression tests completed.');
  },
  
  // Custom test function
  async testStory(page, story) {
    // Navigate to story
    await page.goto(`http://localhost:6006/iframe.html?id=${story.id}&viewMode=story`);
    
    // Wait for story to load
    await page.waitForSelector('#storybook-root', { timeout: 10000 });
    
    // Set viewport if specified
    if (story.viewport) {
      await page.setViewportSize(story.viewport);
    }
    
    // Wait for animations to complete
    await page.waitForTimeout(1000);
    
    // Disable animations
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
    
    // Take screenshot
    const screenshot = await page.screenshot({
      fullPage: story.fullPage !== false,
      animations: 'disabled',
    });
    
    return screenshot;
  },
};