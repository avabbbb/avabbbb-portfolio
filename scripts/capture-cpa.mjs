// Capture real GitHub evidence screenshots for the CLIProxyAPI portfolio page.
// Usage: node scripts/capture-cpa.mjs
// Output: public/cpa/*.png  (clipped regions, not full-page dumps)

import { chromium } from '@playwright/test';
import { mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'cpa');
mkdirSync(outDir, { recursive: true });

const results = { ok: [], failed: [] };

const ISSUE_TITLE = 'bdi.js-issue-title, [data-testid="issue-title"], .js-issue-title';
const PR_TITLE = '.markdown-title, bdi.js-issue-title, [data-testid="issue-title"]';

const jobs = [
  {
    name: 'repo.png',
    url: 'https://github.com/router-for-me/CLIProxyAPI',
    clip: { x: 0, y: 0, width: 1440, height: 640 },
    wait: async (page) => {
      await page.waitForSelector('strong[itemprop="name"]', { timeout: 20000 });
      await page.waitForTimeout(1200);
    },
  },
  {
    name: 'release.png',
    url: 'https://github.com/router-for-me/CLIProxyAPI/releases/tag/v7.3.5',
    clip: { x: 0, y: 0, width: 1440, height: 1600 },
    wait: async (page) => {
      await page.waitForSelector('.release-header, .markdown-body, [data-view-component]', { timeout: 20000 });
      await page.waitForTimeout(1500);
    },
  },
  {
    name: 'issue-5863.png',
    url: 'https://github.com/router-for-me/CLIProxyAPI/issues/5863',
    clip: { x: 0, y: 0, width: 1440, height: 720 },
    wait: async (page) => {
      await page.waitForSelector(ISSUE_TITLE, { timeout: 20000 });
      await page.waitForTimeout(1200);
    },
  },
  {
    name: 'issue-5869.png',
    url: 'https://github.com/router-for-me/CLIProxyAPI/issues/5869',
    clip: { x: 0, y: 0, width: 1440, height: 720 },
    wait: async (page) => {
      await page.waitForSelector(ISSUE_TITLE, { timeout: 20000 });
      await page.waitForTimeout(1200);
    },
  },
  {
    name: 'pr-5867.png',
    url: 'https://github.com/router-for-me/CLIProxyAPI/pull/5867',
    clip: { x: 0, y: 0, width: 1440, height: 820 },
    wait: async (page) => {
      await page.waitForSelector(PR_TITLE, { timeout: 20000 });
      await page.waitForTimeout(1200);
    },
  },
  {
    name: 'pr-5870.png',
    url: 'https://github.com/router-for-me/CLIProxyAPI/pull/5870',
    clip: { x: 0, y: 0, width: 1440, height: 820 },
    wait: async (page) => {
      await page.waitForSelector(PR_TITLE, { timeout: 20000 });
      await page.waitForTimeout(1200);
    },
  },
  {
    name: 'models-58.png',
    url: 'https://github.com/router-for-me/models/pull/58',
    clip: { x: 0, y: 0, width: 1440, height: 820 },
    wait: async (page) => {
      await page.waitForSelector(PR_TITLE, { timeout: 20000 });
      await page.waitForTimeout(1200);
    },
  },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
});

for (const job of jobs) {
  const page = await context.newPage();
  try {
    const resp = await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const status = resp ? resp.status() : 0;
    if (status === 404) {
      results.failed.push(`${job.name}: 404 at ${job.url}`);
      console.log(`[404] ${job.name} ${job.url}`);
      await page.close();
      continue;
    }
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    if (job.wait) await job.wait(page);
    const out = join(outDir, job.name);
    await page.screenshot({ path: out, clip: job.clip, fullPage: false });
    const kb = Math.round(statSync(out).size / 1024);
    results.ok.push(`${job.name} (${kb} KB)`);
    console.log(`[ok] ${job.name} ${kb} KB`);
  } catch (err) {
    results.failed.push(`${job.name}: ${String(err).split('\n')[0]}`);
    console.log(`[fail] ${job.name}: ${String(err).split('\n')[0]}`);
    try {
      await page.screenshot({ path: join(outDir, job.name), fullPage: false });
    } catch {}
  }
  await page.close();
}

await browser.close();
console.log('\nDONE');
console.log('ok:', results.ok.join(', ') || 'none');
console.log('failed:', results.failed.join(' | ') || 'none');
