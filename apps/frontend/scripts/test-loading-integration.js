const puppeteer = require('puppeteer');

const pages = [
  { url: 'http://localhost:3010/login', name: 'Login Page' },
  { url: 'http://localhost:3010/register', name: 'Register Page' },
  { url: 'http://localhost:3010/player', name: 'Player Dashboard' },
  { url: 'http://localhost:3010/coach', name: 'Coach Dashboard' },
  { url: 'http://localhost:3010/physicaltrainer', name: 'Physical Trainer Dashboard' },
  { url: 'http://localhost:3010/chat', name: 'Chat Page' },
  { url: 'http://localhost:3010/calendar', name: 'Calendar Page' },
  { url: 'http://localhost:3010/test-loading', name: 'Test Loading Page' }
];

async function testLoadingStates() {
  console.log('🧪 Testing Loading State Integration\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    for (const page of pages) {
      console.log(`\n📄 Testing: ${page.name}`);
      console.log(`   URL: ${page.url}`);
      
      const tab = await browser.newPage();
      
      // Set viewport
      await tab.setViewport({ width: 1280, height: 720 });
      
      // Navigate to page
      try {
        await tab.goto(page.url, { waitUntil: 'networkidle0', timeout: 30000 });
        
        // Check for loading components
        const loadingComponents = await tab.evaluate(() => {
          const results = {
            spinners: document.querySelectorAll('[role="status"]').length,
            skeletons: document.querySelectorAll('[data-testid="loading-skeleton"]').length,
            progressBars: document.querySelectorAll('[role="progressbar"]').length,
            oldSpinners: document.querySelectorAll('.animate-spin:not([role="status"])').length,
            loadingText: Array.from(document.querySelectorAll('*')).filter(
              el => el.textContent && el.textContent.includes('Loading...')
            ).length
          };
          
          // Check for accessibility
          const spinners = document.querySelectorAll('[role="status"]');
          results.accessibility = {
            hasAriaLabels: Array.from(spinners).every(s => s.getAttribute('aria-label')),
            hasScreenReaderText: document.querySelectorAll('.sr-only').length > 0
          };
          
          return results;
        });
        
        console.log('   ✓ Page loaded successfully');
        console.log(`   Loading components found:`);
        console.log(`     - Standard spinners: ${loadingComponents.spinners}`);
        console.log(`     - Skeletons: ${loadingComponents.skeletons}`);
        console.log(`     - Progress bars: ${loadingComponents.progressBars}`);
        
        if (loadingComponents.oldSpinners > 0) {
          console.log(`   ⚠️  Old spinners found: ${loadingComponents.oldSpinners}`);
        }
        
        console.log(`   Accessibility:`);
        console.log(`     - ARIA labels: ${loadingComponents.accessibility.hasAriaLabels ? '✓' : '✗'}`);
        console.log(`     - Screen reader text: ${loadingComponents.accessibility.hasScreenReaderText ? '✓' : '✗'}`);
        
        // Test responsive behavior
        console.log('   Testing responsive behavior...');
        await tab.setViewport({ width: 375, height: 667 }); // Mobile
        await tab.waitForTimeout(500);
        
        const mobileCheck = await tab.evaluate(() => {
          const spinners = document.querySelectorAll('[role="status"]');
          return spinners.length > 0 && Array.from(spinners).every(s => s.offsetWidth > 0);
        });
        
        console.log(`     - Mobile view: ${mobileCheck ? '✓' : '✗'}`);
        
        await tab.close();
        
      } catch (error) {
        console.log(`   ✗ Error loading page: ${error.message}`);
        await tab.close();
      }
    }
    
    // Test the comprehensive test page
    console.log('\n\n🎯 Running comprehensive component tests...');
    const testTab = await browser.newPage();
    await testTab.goto('http://localhost:3010/test-loading', { waitUntil: 'networkidle0' });
    
    // Test each tab
    const tabs = ['components', 'skeletons', 'pages', 'integration'];
    for (const tabName of tabs) {
      await testTab.click(`button:has-text("${tabName}")`);
      await testTab.waitForTimeout(500);
      console.log(`   ✓ ${tabName} tab tested`);
    }
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await browser.close();
  }
}

// Run tests
testLoadingStates().catch(console.error);