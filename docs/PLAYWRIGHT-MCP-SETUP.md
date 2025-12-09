# Playwright MCP (Model Context Protocol) Setup

## Overview

Playwright MCP enables Claude to interact with browsers and perform automated testing through the Model Context Protocol. This setup allows Claude to:
- Navigate web pages
- Interact with UI elements
- Take screenshots
- Run automated tests
- Debug UI issues

## Installation

### 1. Install Playwright and MCP Server

```bash
# Install Playwright
pnpm add -D @playwright/test playwright

# Install Playwright browsers
pnpm playwright install

# The MCP server is configured to run via npx
npx @playwright/mcp@latest
```

### 2. Configuration

The MCP configuration is stored in `.mcp/config.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "env": {}
    }
  }
}
```

## Usage

### Running Tests

```bash
# Run all tests
pnpm playwright

# Run tests with UI
pnpm playwright:ui

# Debug tests
pnpm playwright:debug

# Generate test code by recording actions
pnpm playwright:codegen
```

### Test Structure

Tests are located in the `/e2e` directory. Example test structure:

```typescript
import { test, expect } from '@playwright/test';

test('should load the coach dashboard', async ({ page }) => {
  await page.goto('/coach');
  await expect(page.getByRole('heading', { name: /Coach Dashboard/i })).toBeVisible();
});
```

## Available MCP Commands

When connected through Claude, you can use these commands:

### Browser Navigation
- `navigate_to(url)` - Navigate to a URL
- `go_back()` - Go back in history
- `go_forward()` - Go forward in history
- `reload()` - Reload the page

### Element Interaction
- `click(selector)` - Click an element
- `type(selector, text)` - Type text into an input
- `select(selector, value)` - Select from dropdown
- `check(selector)` - Check a checkbox
- `uncheck(selector)` - Uncheck a checkbox

### Page Information
- `get_title()` - Get page title
- `get_url()` - Get current URL
- `get_text(selector)` - Get text content
- `get_attribute(selector, attribute)` - Get element attribute

### Screenshots
- `screenshot(path)` - Take a screenshot
- `screenshot_element(selector, path)` - Screenshot specific element

### Waiting
- `wait_for_selector(selector)` - Wait for element
- `wait_for_navigation()` - Wait for page navigation
- `wait_for_timeout(ms)` - Wait for specific time

## Test Examples

### Tactical Board Test

```typescript
test('should interact with tactical board', async ({ page }) => {
  // Navigate to coach dashboard
  await page.goto('/coach');
  
  // Click on Tactical tab
  await page.getByRole('tab', { name: /Tactical/i }).click();
  
  // Wait for board to load
  await expect(page.getByText(/Interactive Tactical Board/i)).toBeVisible();
  
  // Test tool selection
  await page.getByRole('button', { name: /Move/i }).click();
  
  // Test animation controls
  await page.getByRole('button', { name: /Play/i }).click();
  await expect(page.getByRole('button', { name: /Pause/i })).toBeVisible();
});
```

### Authentication Test

```typescript
test('should handle mock authentication', async ({ page }) => {
  await page.goto('/login');
  
  // Fill in mock credentials
  await page.fill('[name="email"]', 'coach@hockeyhub.com');
  await page.fill('[name="password"]', 'password');
  
  // Submit form
  await page.getByRole('button', { name: /Sign In/i }).click();
  
  // Should redirect to dashboard
  await expect(page).toHaveURL('/coach');
});
```

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Install Playwright browsers
        run: pnpm playwright install --with-deps
      
      - name: Run tests
        run: pnpm playwright
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## Debugging

### Local Debugging

1. **UI Mode**: Best for interactive debugging
   ```bash
   pnpm playwright:ui
   ```

2. **Debug Mode**: Opens browser with inspector
   ```bash
   pnpm playwright:debug
   ```

3. **VS Code Extension**: Install Playwright Test for VS Code for inline debugging

### Common Issues

1. **Browser not installed**
   ```bash
   pnpm playwright install
   ```

2. **Port conflict**
   - Check if port 3010 is available
   - Update `playwright.config.ts` if using different port

3. **Timeout issues**
   - Increase timeout in test: `test.setTimeout(60000)`
   - Or in config: `timeout: 60000`

## Best Practices

1. **Use data-testid attributes** for reliable selectors
2. **Avoid hard-coded waits** - use `waitFor` methods
3. **Keep tests independent** - each test should be able to run alone
4. **Use Page Object Model** for complex pages
5. **Take screenshots on failure** for debugging
6. **Run tests in parallel** for faster execution
7. **Use fixtures** for common setup/teardown

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [MCP Protocol Spec](https://modelcontextprotocol.io)
- [Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp)

## Support

For issues with:
- Playwright tests: Check test reports in `playwright-report/`
- MCP connection: Ensure `.mcp/config.json` is properly configured
- Browser issues: Run `pnpm playwright install` to reinstall browsers