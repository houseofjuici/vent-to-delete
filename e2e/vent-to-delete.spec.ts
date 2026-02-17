import { test, expect } from '@playwright/test';

test.describe('Vent to Delete E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3003');
  });

  test('homepage loads correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/Vent to Delete/);
    await expect(page.locator('h1')).toContainText('Vent', { timeout: 5000 });
  });

  test('compose interface accessible', async ({ page }) => {
    const composeArea = page.locator('textarea').or(
      page.locator('[contenteditable="true"]')
    ).or(
      page.locator('button:has-text("Vent")')
    );

    await expect(composeArea.first()).toBeVisible({ timeout: 5000 });
  });

  test('responsive design - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('http://localhost:3003');
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
  });

  test('responsive design - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3003');
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
  });

  test('page performance - loads within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('http://localhost:3003');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('http://localhost:3003');
    await page.waitForLoadState('networkidle');

    expect(errors.filter(e => !e.includes('DevTools') && !e.includes('extension')).length).toBe(0);
  });
});
