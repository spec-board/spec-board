# E2E Testing with Playwright

## Overview

This directory contains end-to-end tests for SpecBoard using Playwright. The tests verify UI functionality, design token implementation, and user interactions.

## Running Tests

### Option 1: With Auto-Started Server (Recommended for CI)

```bash
pnpm test:e2e
```

This will automatically start the dev server and run tests. However, if the server takes too long to start, use Option 2.

### Option 2: With Manually Started Server (Recommended for Development)

**Terminal 1 - Start the dev server:**
```bash
pnpm dev
```

Wait for the server to fully start and show "Ready" message.

**Terminal 2 - Run tests:**
```bash
pnpm test:e2e
```

The tests will automatically detect and reuse the running server.

### Other Test Commands

```bash
# Run tests with UI mode (interactive)
pnpm test:e2e:ui

# Run tests in headed mode (see browser)
pnpm test:e2e:headed

# Debug tests step-by-step
pnpm test:e2e:debug
```

## Test Structure

### Phase 3: Design Token Tests

Located in `phase3-design-tokens.spec.ts`, these tests verify:

- **CSS Custom Properties**: Verifies design tokens are defined (--space-6, --leading-relaxed, --transition-base)
- **Typography**: Checks line-height and font sizing
- **Spacing**: Verifies padding tokens are applied
- **Transitions**: Ensures smooth animations
- **Dark Mode**: Tests theme switching
- **Responsive Design**: Tests mobile, tablet, and desktop viewports

## Writing New Tests

### Test File Naming

- `*.spec.ts` - Test files
- Place in `e2e/` directory
- Group related tests in `describe` blocks

### Example Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

## Troubleshooting

### Server Timeout Issues

If you see "Timed out waiting for webServer", the dev server is taking too long to start. This can happen due to:

- Database connection issues
- Missing environment variables
- Port already in use

**Solution**: Use Option 2 (manually start server) to see the actual error messages.

### Database Issues

Ensure PostgreSQL is running:

```bash
docker compose -f docker-compose.db.yml up -d
```

### Port Already in Use

If port 3000 is already in use:

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 pnpm dev
```

Then update `playwright.config.ts` to use the new port.

## CI/CD Integration

For CI environments, the tests will automatically:
- Start the dev server
- Run tests in parallel
- Retry failed tests twice
- Generate HTML reports

## Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## Configuration

See `playwright.config.ts` for:
- Browser configurations
- Timeout settings
- Screenshot/video options
- Server startup settings
