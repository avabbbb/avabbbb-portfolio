import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const baseURL = process.env.TARGET_URL ?? 'http://127.0.0.1:3000';
const outputDir = join(tmpdir(), 'lkf-visual-check');
mkdirSync(outputDir, { recursive: true });
const executablePath = process.platform === 'win32'
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : undefined;

const browser = await chromium.launch({ headless: true, executablePath });
const issues = [];

async function capture(name, viewport, path, prepare) {
  const context = await browser.newContext({ viewport, locale: 'zh-CN' });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') pageErrors.push(`console: ${m.text().slice(0, 300)}`);
  });
  try {
    await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(1_200);
    if (prepare) await prepare(page);
    await page.waitForTimeout(600);
    await page.screenshot({ path: join(outputDir, `${name}.png`), fullPage: true });
    console.log(`OK  ${name}  ${viewport.width}x${viewport.height}  ${path}`);
  } catch (e) {
    console.log(`FAIL ${name}  ${path}  :: ${e.message.split('\n')[0]}`);
    issues.push(`${name}: ${e.message.split('\n')[0]}`);
  }
  if (pageErrors.length) {
    issues.push(`${name}: ${pageErrors.join(' | ')}`);
  }
  await context.close();
}

const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844 };

await capture('home-desktop', desktop, '/home');
await capture('home-mobile', mobile, '/home');
await capture('portfolio-desktop', desktop, '/portfolio');
await capture('portfolio-mobile', mobile, '/portfolio');
await capture('contact-desktop', desktop, '/contact');
await capture('resume-desktop', desktop, '/resume');
await capture('about-desktop', desktop, '/about');
await capture('opening-desktop', desktop, '/');
await capture('opening-mobile', mobile, '/');
await capture('notfound-desktop', desktop, '/no-such-page');

await browser.close();
console.log('\nOUTPUT_DIR=' + outputDir);
if (issues.length) {
  console.log('\nISSUES:');
  for (const i of issues) console.log(' - ' + i);
} else {
  console.log('\nNO JS/CONSOLE ERRORS');
}
