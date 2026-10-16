import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Portfolio application', () => {
  test('deep links render and unknown routes show a 404', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Route contract needs one browser run.');
    for (const path of ['/articles', '/portfolio', '/contact', '/work/flovart', '/work/cpa', '/work/offeru']) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.locator('main')).toBeVisible();
    }
    await page.goto('/definitely-not-a-route');
    await expect(page.getByRole('heading', { name: /页面未找到|Page not found/i })).toBeVisible();
  });

  test('legacy project URLs redirect to their case study', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Redirect contract needs one browser run.');
    const cases: Array<[string, string]> = [
      ['/portfolio/dev/dev0', '/work/cpa'],
      ['/portfolio/dev/dev1', '/work/flovart'],
      ['/portfolio/dev/dev2', '/work/offeru'],
    ];
    for (const [from, to] of cases) {
      await page.goto(from);
      await expect(page).toHaveURL(new RegExp(`${to}$`));
    }
  });

  test('language changes the real home content, document locale, and persisted preference', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Persistence contract needs one browser run.');
    await page.goto('/');
    await page.getByRole('button', { name: /中文|Switch to/i }).first().click();
    await expect(page.locator('html')).toHaveAttribute('lang', /zh|en/);
    await page.getByRole('navigation', { name: /开场章节|Opening chapters/ }).getByRole('button').last().click();
    const heroTitle = page.locator('.hero-intro h1');
    await expect(heroTitle).toBeVisible();
    await page.reload();
    await page.getByRole('navigation', { name: /开场章节|Opening chapters/ }).getByRole('button').last().click();
    await expect(heroTitle).toBeVisible();
  });

  test('has named 44px icon controls and no runtime/resource failures', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop control audit.');
    const pageErrors: string[] = [];
    const failedRequests: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('requestfailed', (request) => failedRequests.push(`${request.resourceType()}:${request.url()}`));
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const failures = await page.locator('button').evaluateAll((buttons) => buttons.flatMap((button) => {
      const rect = button.getBoundingClientRect();
      const visible = rect.width > 0 && rect.height > 0 && getComputedStyle(button).visibility !== 'hidden';
      const iconOnly = visible && !(button.textContent?.trim());
      if (!iconOnly) return [];
      const name = button.getAttribute('aria-label') ?? '';
      return name && rect.width >= 44 && rect.height >= 44
        ? []
        : [`${name || 'unnamed'}:${Math.round(rect.width)}x${Math.round(rect.height)}`];
    }));
    expect(failures).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
    await expect(page.locator('a[href*="avabbbb.pages.dev"]')).toHaveCount(0);
  });

  test('hero keeps exactly one active project artifact and mascot intact', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Desktop hero audit.');
    await page.goto('/');
    await expect(page.locator('.hero-artifact')).toHaveCount(1);
    const mascot = page.locator('.hero-mascot > img');
    await expect(mascot).toBeVisible();
    // The mascot is the original logo.png — never an overlaid/redrawn variant.
    await expect(mascot).toHaveAttribute('src', /logo\.png/);
    await page.getByRole('navigation', { name: /开场章节|Opening chapters/ }).getByRole('button').last().click();
    // Identity selectors swap the artifact, never stack more than one.
    await page.locator('.hero-identity').nth(1).click();
    await expect(page.locator('.hero-artifact')).toHaveCount(1);
    await expect(page.locator('.hero-artifact')).toHaveAttribute('href', '/work/cpa');
  });

  test('has no serious or critical accessibility violations across core routes', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Run a single deterministic axe audit.');
    for (const path of ['/', '/portfolio', '/articles', '/contact', '/work/flovart', '/definitely-not-a-route']) {
      await page.goto(path);
      await page.waitForTimeout(3_000);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        results.violations
          .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
          .map((violation) => ({ path, id: violation.id, nodes: violation.nodes.map((node) => node.target) })),
      ).toEqual([]);
    }
  });

  test('keeps the core mobile home and contact views within the viewport', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.includes('mobile'), 'Mobile-only layout audit.');
    for (const path of ['/', '/portfolio', '/articles', '/contact']) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });

  test('case study footer links back to the matching dev journal category', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Journal link audit needs one run.');
    await page.goto('/work/cpa');
    await page.getByRole('link', { name: /Dev log|开发日志/ }).click();
    await expect(page).toHaveURL(/\/articles\//);
  });

  test('gallery lightbox opens on click and closes with Escape', async ({ page }) => {
    await page.goto('/portfolio/dev/dev3');
    const galleryImg = page.locator('img[src*="/lora/"]').first();
    await galleryImg.click();
    const lightbox = page.getByRole('dialog', { name: /图片预览|Image preview/ });
    await expect(lightbox).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(lightbox).toHaveCount(0);
  });
});
