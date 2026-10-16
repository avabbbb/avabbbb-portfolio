import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';

const folder = 'docs/shots/current-scroll-2026-10-01';
async function scene(page: Page, selector: string, p: number) {
  await page.locator(selector).evaluate((el, progress) => {
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + Math.max(0, el.clientHeight - window.innerHeight) * progress, behavior: 'instant' });
  }, p);
  await page.waitForTimeout(250);
}
test.use({ video: 'on' });
test('current design holds still, reverses exactly, and captures three sizes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'));
  await mkdir(folder, { recursive: true });
  for (const [width, height] of [[1440, 900], [1280, 720], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(0, 0);
    for (const [p, name] of [[0, 'wordmark'], [0.43, 'arrival'], [0.9, 'collage']] as const) {
      await scene(page, '.hero', p);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.screenshot({ path: `${folder}/after-${width}x${height}-${name}.png` });
    }
    const fragments = page.locator('.hero-fragment');
    const transforms = await fragments.evaluateAll(els => els.map(el => getComputedStyle(el).transform));
    await page.waitForTimeout(500);
    expect(await fragments.evaluateAll(els => els.map(el => getComputedStyle(el).transform))).toEqual(transforms);
    await scene(page, '.hero', 0.43);
    await scene(page, '.hero', 0.9);
    expect(await fragments.evaluateAll(els => els.map(el => getComputedStyle(el).transform))).toEqual(transforms);
    for (const [p, name, frame] of [[0.05, 'nodes', '2'], [0.5, 'canvas', '24'], [0.95, 'connections', '45']] as const) {
      await scene(page, '.frame-story', p);
      await expect(page.locator('.frame-story canvas')).toHaveAttribute('data-frame', frame);
      const bounds = await page.locator('.frame-story-stage').boundingBox();
      expect(bounds?.y).toBeCloseTo(0, 0);
      await page.screenshot({ path: `${folder}/after-${width}x${height}-flovart-${name}.png` });
    }
    await scene(page, '.frame-story', 0.5);
    await expect(page.locator('.frame-story canvas')).toHaveAttribute('data-frame', '24');
    const first = await page.locator('canvas').evaluate(el => (el as HTMLCanvasElement).toDataURL());
    await scene(page, '.frame-story', 0.95);
    await expect(page.locator('.frame-story canvas')).toHaveAttribute('data-frame', '45');
    await scene(page, '.frame-story', 0.5);
    await expect(page.locator('.frame-story canvas')).toHaveAttribute('data-frame', '24');
    expect(await page.locator('canvas').evaluate(el => (el as HTMLCanvasElement).toDataURL())).toBe(first);
  }
});

test('chapters and returning from a case keep the current scroll position', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'));
  await page.goto('/');
  await page.getByRole('navigation', { name: '开场章节' }).getByRole('button', { name: /探索拼贴/ }).click();
  await expect(page.getByRole('navigation', { name: '开场章节' }).getByRole('button').last()).toHaveAttribute('aria-current', 'step');
  await page.waitForTimeout(600);
  const position = await page.evaluate(() => window.scrollY);
  await page.locator('.hero-artifact').click();
  await expect(page).toHaveURL(/\/work\/flovart$/);
  await page.goBack();
  await expect.poll(async () => Math.abs(await page.evaluate(() => window.scrollY) - position)).toBeLessThan(3);
  await page.getByRole('navigation', { name: '操作录屏章节' }).getByRole('button', { name: /组织画布/ }).click();
  await expect(page.locator('.frame-story canvas')).toHaveAttribute('data-frame', '24');
});

test('reduced motion presents readable static scenes and loads no sequence', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  const frames: string[] = [];
  page.on('request', request => { if (/flovart-frames\//.test(request.url()) && !request.url().endsWith('/000.webp')) frames.push(request.url()); });
  await page.goto('/');
  await page.locator('.frame-story').scrollIntoViewIfNeeded();
  expect(await page.locator('.frame-story-stage').evaluate(el => getComputedStyle(el).position)).toBe('relative');
  await expect(page.locator('.frame-story canvas')).toBeHidden();
  await expect(page.locator('.hero-artifact')).toBeVisible();
  expect(frames).toEqual([]);
  await page.screenshot({ path: `${folder}/reduced-motion-390x844.png`, fullPage: true });
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id)).toEqual([]);
});

test('records forward, pause and reverse using actual wheel input', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'));
  await mkdir(folder, { recursive: true });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(1400, 500);
  for (let i = 0; i < 16; i++) { await page.mouse.wheel(0, 45); await page.waitForTimeout(100); }
  await page.waitForTimeout(600);
  for (let i = 0; i < 16; i++) { await page.mouse.wheel(0, -45); await page.waitForTimeout(100); }
  await scene(page, '.frame-story', 0.05);
  for (let i = 0; i < 15; i++) { await page.mouse.wheel(0, 65); await page.waitForTimeout(100); }
  await page.waitForTimeout(600);
  for (let i = 0; i < 15; i++) { await page.mouse.wheel(0, -65); await page.waitForTimeout(100); }
  await page.waitForTimeout(600);
  const video = page.video();
  await page.close();
  await video!.saveAs(`${folder}/forward-reverse.webm`);
});
