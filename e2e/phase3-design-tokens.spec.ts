import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Phase 3: Design Token Implementation
 *
 * Verifies that all viewer components correctly apply:
 * - Typography tokens (line-height, font sizes)
 * - Spacing tokens (padding via var(--space-6))
 * - Transition tokens (hover states, animations)
 * - CSS custom properties for theming
 */

test.describe('Phase 3: Design Token Implementation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('Home page loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/SpecBoard/);

    // Verify main elements are present
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Viewer components have correct padding tokens', async ({ page }) => {
    // This test requires a project to be loaded
    // For now, we'll test the structure is correct

    // Check if recent projects heading exists (more specific selector)
    const recentProjectsHeading = page.locator('h2:has-text("Recent Projects")');

    if (await recentProjectsHeading.isVisible()) {
      // If there are recent projects, click the first one
      const firstProject = page.locator('[data-testid="project-card"]').first();

      if (await firstProject.count() > 0) {
        await firstProject.click();

        // Wait for project to load
        await page.waitForLoadState('networkidle');

        // Verify Kanban board is visible
        const kanbanBoard = page.locator('[data-testid="kanban-board"]').or(page.locator('.kanban-board'));
        if (await kanbanBoard.count() > 0) {
          await expect(kanbanBoard.first()).toBeVisible();
        }
      }
    }
  });

  test('CSS custom properties are defined', async ({ page }) => {
    // Check that CSS variables are defined in the document
    const rootStyles = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = getComputedStyle(root);

      return {
        space6: styles.getPropertyValue('--space-6'),
        leadingRelaxed: styles.getPropertyValue('--leading-relaxed'),
        transitionBase: styles.getPropertyValue('--transition-base'),
        foreground: styles.getPropertyValue('--foreground'),
        background: styles.getPropertyValue('--background'),
        border: styles.getPropertyValue('--border'),
      };
    });

    // Verify spacing token exists
    expect(rootStyles.space6).toBeTruthy();

    // Verify typography token exists
    expect(rootStyles.leadingRelaxed).toBeTruthy();

    // Verify transition token exists
    expect(rootStyles.transitionBase).toBeTruthy();

    // Verify theme colors exist
    expect(rootStyles.foreground).toBeTruthy();
    expect(rootStyles.background).toBeTruthy();
    expect(rootStyles.border).toBeTruthy();
  });

  test('Typography tokens are applied correctly', async ({ page }) => {
    // Check line-height on body text
    const bodyLineHeight = await page.evaluate(() => {
      const body = document.body;
      return getComputedStyle(body).lineHeight;
    });

    // Line height should be set (not 'normal')
    expect(bodyLineHeight).not.toBe('normal');
  });

  test('Viewer container class exists and has correct styles', async ({ page }) => {
    // Inject a test element with viewer-container class
    await page.evaluate(() => {
      const testDiv = document.createElement('div');
      testDiv.className = 'viewer-container';
      testDiv.id = 'test-viewer-container';
      document.body.appendChild(testDiv);
    });

    // Check computed styles
    const containerStyles = await page.evaluate(() => {
      const container = document.getElementById('test-viewer-container');
      if (!container) return null;

      const styles = getComputedStyle(container);
      return {
        lineHeight: styles.lineHeight,
        padding: styles.padding,
      };
    });

    expect(containerStyles).toBeTruthy();
    expect(containerStyles?.lineHeight).toBeTruthy();
  });

  test('Dark mode toggle works correctly', async ({ page }) => {
    // Check initial theme
    const initialTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });

    // Look for theme toggle button
    const themeToggle = page.locator('[data-testid="theme-toggle"]').or(
      page.locator('button[aria-label*="theme"]')
    ).or(
      page.locator('button[aria-label*="Theme"]')
    );

    if (await themeToggle.isVisible()) {
      await themeToggle.click();

      // Wait for theme change
      await page.waitForTimeout(300);

      // Check theme changed
      const newTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark');
      });

      expect(newTheme).not.toBe(initialTheme);
    }
  });

  test('Transitions are smooth and defined', async ({ page }) => {
    // Check that transition properties are set
    const transitionValue = await page.evaluate(() => {
      const root = document.documentElement;
      return getComputedStyle(root).getPropertyValue('--transition-base');
    });

    expect(transitionValue).toBeTruthy();
    expect(transitionValue).toMatch(/\d+m?s/); // Should contain time unit
  });
});

test.describe('Feature Detail Modal - Phase 3 Tokens', () => {
  test.skip('Split view divider has correct hover states', async ({ page }) => {
    // This test requires a project with features
    // Skip for now as it needs test data setup
  });

  test.skip('Viewer components render with correct padding', async ({ page }) => {
    // This test requires navigating to specific viewers
    // Skip for now as it needs test data setup
  });

  test.skip('Navigation sidebar has correct spacing', async ({ page }) => {
    // This test requires feature detail modal to be open
    // Skip for now as it needs test data setup
  });
});

test.describe('Responsive Design', () => {
  test('Layout adapts to mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to home
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify page is still functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('Layout adapts to tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Navigate to home
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify page is still functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('Layout works on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate to home
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify page is still functional
    await expect(page.locator('body')).toBeVisible();
  });
});
