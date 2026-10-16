import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const baseURL = process.env.TARGET_URL ?? 'http://127.0.0.1:4174';
const outputDir = resolve('test-results/visual-audit');
const executablePath = process.platform === 'win32'
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : undefined;

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath });

async function capture(name, viewport, path, prepare) {
  const context = await browser.newContext({ viewport, locale: 'zh-CN', reducedMotion: 'no-preference' });
  const page = await context.newPage();
  await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1_500);
  if (prepare) await prepare(page);
  await page.waitForTimeout(800);
  await page.screenshot({ path: resolve(outputDir, `${name}.png`), fullPage: true });
  await context.close();
}

await capture('desktop-home', { width: 1440, height: 900 }, '/home');
await capture('mobile-home', { width: 390, height: 844 }, '/home');
await capture('desktop-portfolio', { width: 1440, height: 900 }, '/portfolio');
await capture('mobile-contact', { width: 390, height: 844 }, '/contact');
await capture('desktop-agent-artist', { width: 1440, height: 900 }, '/home', async (page) => {
  await page.getByRole('button', { name: '打开 AI 导览' }).first().click();
  const dialog = page.getByRole('dialog');
  const input = dialog.getByLabel('向 AI 作品导览提问');
  await input.fill('我是纯文科艺术生，想从 AI 视频入门');
  await input.press('Enter');
  await dialog.getByText(/建议从「.*」开始/).waitFor();
});
await capture('mobile-agent-developer', { width: 390, height: 844 }, '/home', async (page) => {
  await page.getByRole('button', { name: '打开 AI 导览' }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'AI 开发者' }).click();
  const input = dialog.getByLabel('向 AI 作品导览提问');
  await input.fill('我想看 Agent、MCP 和 React 的工程实现');
  await input.press('Enter');
  await dialog.getByText(/技术栈、架构取舍与可运行链接/).waitFor();
});

await browser.close();
console.log(outputDir);
