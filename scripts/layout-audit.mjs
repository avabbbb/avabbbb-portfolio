import { chromium } from '@playwright/test';

const baseURL = process.env.TARGET_URL ?? 'http://127.0.0.1:3000';
const executablePath = process.platform === 'win32'
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : undefined;

const browser = await chromium.launch({ headless: true, executablePath });
const results = [];

async function audit(name, viewport, path) {
  const context = await browser.newContext({ viewport, locale: 'zh-CN' });
  const page = await context.newPage();
  await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.waitForTimeout(1_500);
  const r = await page.evaluate(() => {
    const issues = [];
    const vw = document.documentElement.clientWidth;
    // 1. horizontal overflow
    const docW = document.documentElement.scrollWidth;
    if (docW > vw + 2) issues.push(`H-OVERFLOW: doc scrollWidth=${docW} > viewport=${vw}`);
    // 2. elements sticking out beyond right edge (excluding intentional full-bleed)
    for (const el of document.querySelectorAll('body *')) {
      const rect = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (rect.right > vw + 8 && rect.left < vw && !/fixed|absolute/.test(cs.position)) {
        const id = el.id ? `#${el.id}` : '';
        const cls = (el.className && typeof el.className === 'string') ? `.${el.className.split(' ').slice(0, 3).join('.')}` : '';
        issues.push(`RIGHT-OVERFLOW: <${el.tagName.toLowerCase()}${id}${cls}> right=${Math.round(rect.right)} vw=${vw} pos=${cs.position}`);
      }
    }
    // 3. clipped text (scrollWidth > clientWidth on visible text containers)
    let clipped = 0;
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (cs.overflow === 'visible' && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 2 && el.textContent.trim()) {
        const cls = (el.className && typeof el.className === 'string') ? `.${el.className.split(' ').slice(0, 2).join('.')}` : '';
        const txt = el.textContent.trim().slice(0, 40).replace(/\s+/g, ' ');
        if (clipped < 8) issues.push(`TEXT-CLIP: <${el.tagName.toLowerCase()}${cls}> "${txt}" ${el.clientWidth}/${el.scrollWidth}`);
        clipped++;
      }
    }
    if (clipped >= 8) issues.push(`TEXT-CLIP: ...共 ${clipped} 处`);
    // 4. broken images (loaded & failed, or zero-size non-lazy in first viewport)
    for (const img of document.querySelectorAll('img')) {
      if (img.complete && img.naturalWidth === 0) {
        issues.push(`IMG-FAIL: ${img.src.slice(0, 120)}`);
      }
    }
    // 5. zero-size sections (possible render failure)
    for (const el of document.querySelectorAll('section, main > div')) {
      const rect = el.getBoundingClientRect();
      if (rect.height === 0 && rect.width > 0 && el.children.length > 0 && getComputedStyle(el).display !== 'none') {
        const cls = (el.className && typeof el.className === 'string') ? `.${el.className.split(' ').slice(0, 2).join('.')}` : '';
        issues.push(`ZERO-HEIGHT: <${el.tagName.toLowerCase()}${cls}>`);
      }
    }
    return { issues: issues.slice(0, 30), total: issues.length };
  });
  if (r.total) {
    results.push(`== ${name} (${viewport.width}x${viewport.height}) ${path} — ${r.total} 个问题 ==`);
    for (const i of r.issues) results.push('  ' + i);
  } else {
    results.push(`== ${name} (${viewport.width}x${viewport.height}) ${path} — 无布局问题 ==`);
  }
  await context.close();
}

await audit('home', { width: 1440, height: 900 }, '/home');
await audit('home-m', { width: 390, height: 844 }, '/home');
await audit('portfolio', { width: 1440, height: 900 }, '/portfolio');
await audit('portfolio-m', { width: 390, height: 844 }, '/portfolio');
await audit('contact', { width: 1440, height: 900 }, '/contact');
await audit('contact-m', { width: 390, height: 844 }, '/contact');
await audit('resume', { width: 1440, height: 900 }, '/resume');
await audit('about', { width: 1440, height: 900 }, '/about');
await audit('opening', { width: 1440, height: 900 }, '/');
await audit('opening-m', { width: 390, height: 844 }, '/');
await audit('notfound', { width: 1440, height: 900 }, '/no-such-page');

console.log(results.join('\n'));
await browser.close();
