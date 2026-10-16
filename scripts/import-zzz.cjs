/**
 * 导入思源「Workspace_For_SiYuan」笔记本下「ZZZ剧情分析」的 4 篇
 * 小红书原创剧情考据文章到博客 CreativeWriting 分类。
 *
 * 与 import-project.cjs 的区别：
 *   - 源目录：H:\Workspace_For_SiYuan\data\...（另一个思源工作区）
 *   - 内容为 AST Children 形式（非 inline Content），复用 protyleToMarkdown
 *   - 图片用 sharp 压缩到 max1400px，输出到 public/blog-assets/（纳入 git 版本控制）
 *   - markdown 引用 /blog-assets/xxx.png，线上由 Vite 直接服务
 *
 * 用法:  node scripts/import-zzz.cjs [--dry-run]
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { protyleToMarkdown, cleanMarkdown, sanitizeFileName } = require('./import-siyuan.cjs');

const DRY_RUN = process.argv.includes('--dry-run');

const WS2_DATA = 'H:\\Workspace_For_SiYuan\\data';
const WS2_ASSETS = path.join(WS2_DATA, 'assets');
const ZZZ_DIR = path.join(
  WS2_DATA,
  '20250122172809-lse9pk6',
  '20250208184132-6bma4rz',
  '20250220161501-0p0a07k',
  '20250303100034-8ciyagh'   // ZZZ剧情分析
);
const OUTPUT_BASE = path.join(__dirname, '..', 'content', 'articles');
const BLOG_ASSETS = path.join(__dirname, '..', 'public', 'blog-assets');

// 目标 4 篇（doc ID -> 标题）
const TARGETS = {
  '20250303100101-3co8jam': '「细节控」现在我更加确信小偶像拥有AI',
  '20250303101129-uhug2cx': '猜测兄妹俩的眼睛拥有倒带能力！',
  '20251021235748-l5tnh3b': '「脑洞」伊德海莉致敬了肯尼迪吗？',
  '20251123034126-bwx3azs': '原来官方早就把新偶像的名字给偷偷漏出来了...',
};

const MAX_WIDTH = 1400;

// 收集 AST 中所有 NodeLinkDest 指向 assets/ 的文件名
function collectAssets(nodes, acc = []) {
  const stack = [...(nodes || [])];
  while (stack.length) {
    const n = stack.shift();
    if (!n) continue;
    if (n.Type === 'NodeLinkDest') {
      const d = n.Data || '';
      const m = d.match(/assets\/([^)]+\.(?:png|jpg|jpeg|webp|gif))/i);
      if (m) acc.push(m[1]);
    }
    if (n.Children) for (const c of n.Children) stack.push(c);
  }
  return acc;
}

async function resizeCopy(srcFile, dstFile) {
  await sharp(srcFile)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .toFile(dstFile);
  return fs.statSync(dstFile).size;
}

async function main() {
  console.log('导入 ZZZ剧情分析 4 篇考据到 CreativeWriting\n');
  console.log(`源: ${ZZZ_DIR}`);
  console.log(`输出: ${OUTPUT_BASE}\\CreativeWriting`);
  if (DRY_RUN) console.log('模式: dry-run\n');

  if (!fs.existsSync(BLOG_ASSETS) && !DRY_RUN) fs.mkdirSync(BLOG_ASSETS, { recursive: true });

  const syFiles = fs.readdirSync(ZZZ_DIR, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.sy'))
    .map(e => path.join(ZZZ_DIR, e.name));

  let totalImgs = 0, totalBytes = 0;
  for (const syPath of syFiles) {
    const j = JSON.parse(fs.readFileSync(syPath, 'utf-8'));
    const id = j.Properties && j.Properties.id;
    if (!TARGETS[id]) continue;
    const title = TARGETS[id];
    const updated = (j.Properties && j.Properties.updated) || '20250101000000';
    const dateStr = updated.slice(0, 8);
    const date = `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`;

    const root = j.Type === 'NodeDocument' ? j : { Type: 'NodeDocument', Children: j.Children || [] };
    let md = cleanMarkdown(protyleToMarkdown(root));
    if (!md) { console.log(`  [跳过空] ${title}`); continue; }

    const assets = [...new Set(collectAssets(j.Children || []))];
    let copied = 0, miss = 0;
    for (const fn of assets) {
      const src = path.join(WS2_ASSETS, fn);
      if (!fs.existsSync(src)) { miss++; continue; }
      const dst = path.join(BLOG_ASSETS, fn);
      if (!DRY_RUN) {
        const sz = await resizeCopy(src, dst);
        totalBytes += sz;
      }
      // 重写 markdown 路径 /assets/xxx -> /blog-assets/xxx
      md = md.replace(new RegExp(`/assets/${fn.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}`, 'g'), `/blog-assets/${fn}`);
      copied++;
      totalImgs++;
    }
    const safe = sanitizeFileName(title) || 'untitled';
    const outDir = path.join(OUTPUT_BASE, 'CreativeWriting');
    const outPath = path.join(outDir, `${safe}.md`);
    const fileContent =
      `---\n` +
      `title: ${JSON.stringify(title)}\n` +
      `date: ${date}\n` +
      `category: CreativeWriting\n` +
      `---\n\n` +
      `# ${title}\n\n` +
      `${md}\n`;
    console.log(`  [导入] CreativeWriting/${safe}.md  date=${date} imgs=${copied}(miss=${miss}) mdLen=${md.length}`);
    if (!DRY_RUN) {
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(outPath, fileContent, 'utf-8');
    }
  }
  console.log(`\n完成。图片: ${totalImgs} 张, 压缩后 ${(totalBytes/1024/1024).toFixed(2)} MB`);
  if (DRY_RUN) console.log('(dry-run，未写入)');
}

main().catch(e => { console.error(e); process.exit(1); });