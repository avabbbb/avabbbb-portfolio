/**
 * 从思源「文字工作」笔记本下的「项目」子文档导入精选文章到博客。
 *
 * 与 import-siyuan.cjs 的区别：
 *   - 仅扫描「项目」子文档
 *   - 仅保留白名单中的 5 篇非敏感、有内容的文章
 *   - 输出命名格式: {纯标题}.md  (无 DAY## 前缀)
 *   - 写入 YAML frontmatter (title + date)，供 articleLoader 读取
 *   - 按内容分入现有 4 个分类文件夹
 *
 * 用法:
 *   node scripts/import-project.cjs
 *   node scripts/import-project.cjs --dry-run
 */

const fs = require('fs');
const path = require('path');
const {
  protyleToMarkdown,
  cleanMarkdown,
  sanitizeFileName,
  copyArticleAssets,
  SIYUAN_DATA_DIR,
  OUTPUT_BASE,
} = require('./import-siyuan.cjs');

const DRY_RUN = process.argv.includes('--dry-run');

// 「文字工作」笔记本 -> 「项目」子文档目录
const PROJECT_DIR = path.join(
  SIYUAN_DATA_DIR,
  '20221208171147-dg20gyd',          // 文字工作
  '20230328150140-5y1incy'            // 项目
);

// 保留白名单（标题精确匹配）。其余文章（空文档 + 敏感内容）全部跳过。
const ALLOWED_TITLES = new Set([
  '华师说结题笔记',
  '宣传脚本',
  '资格赛理论赛答案',
  '【论文学习】SDN环境下基于机器学习的智能路由研究',
  '二创狂想：方大同《面面》AI大梨版',
]);

// 标题 -> 目标分类文件夹（用于“重构现有分类”）
const TITLE_TO_CATEGORY = {
  '华师说结题笔记': 'Flovart',
  '宣传脚本': 'VideoCreation',
  '资格赛理论赛答案': 'Methodology',
  '【论文学习】SDN环境下基于机器学习的智能路由研究': 'Methodology',
  '二创狂想：方大同《面面》AI大梨版': 'CreativeWriting',
};

// 递归收集 .sy 文件
function collectSyFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['.siyuan', 'assets', 'storage'].includes(entry.name)) {
        collectSyFiles(full, acc);
      }
    } else if (entry.isFile() && entry.name.endsWith('.sy')) {
      acc.push(full);
    }
  }
  return acc;
}

function main() {
  console.log('导入「项目」精选文章到博客\n');
  console.log(`源目录: ${PROJECT_DIR}`);
  console.log(`输出目录: ${OUTPUT_BASE}`);
  if (DRY_RUN) console.log('模式: dry-run (预览，不写入)\n');

  if (!fs.existsSync(PROJECT_DIR)) {
    console.error(`错误: 项目子文档目录不存在: ${PROJECT_DIR}`);
    process.exit(1);
  }

  const syFiles = collectSyFiles(PROJECT_DIR);
  console.log(`找到 ${syFiles.length} 个 .sy 文件 (含嵌套)\n`);

  let imported = 0;
  let skippedEmpty = 0;
  let skippedSensitive = 0;
  let skippedNotInAllowlist = 0;

  for (const syPath of syFiles) {
    let doc;
    try {
      doc = JSON.parse(fs.readFileSync(syPath, 'utf-8'));
    } catch (e) {
      console.error(`  [解析失败] ${path.basename(syPath)}: ${e.message}`);
      continue;
    }
    if (doc.Type !== 'NodeDocument') continue;

    const title = (doc.Properties && doc.Properties.title) || path.basename(syPath, '.sy');
    const updated = (doc.Properties && doc.Properties.updated) || '19700101000000';
    const dateStr = updated.slice(0, 8);
    const date = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;

    // 白名单过滤（非白名单 = 空文档或敏感内容）
    if (!ALLOWED_TITLES.has(title)) {
      // 粗略判断是空文档还是敏感/其他
      const md = protyleToMarkdown(doc).trim();
      if (!md) skippedEmpty++;
      else if (title.includes('DV') || title.includes('NTR') || title.includes('ヤンデレ') || title.includes('病娇') || title.includes('豆豆') || title.includes('大梨') || title.includes('禧运楼') || title.includes('C4') || title.includes('YOUTUBE') || title.includes('团委') || title.includes('短片') || title.includes('二创')) {
        skippedSensitive++;
      } else {
        skippedNotInAllowlist++;
      }
      continue;
    }

    const mdContent = cleanMarkdown(protyleToMarkdown(doc));
    if (!mdContent) {
      skippedEmpty++;
      continue;
    }

    const category = TITLE_TO_CATEGORY[title] || 'CreativeWriting';
    const safeTitle = sanitizeFileName(title) || 'untitled';
    const fileName = `${safeTitle}.md`;
    const outDir = path.join(OUTPUT_BASE, category);
    const outPath = path.join(outDir, fileName);

    // YAML frontmatter + 正文
    const fileContent =
      `---\n` +
      `title: ${JSON.stringify(title)}\n` +
      `date: ${date}\n` +
      `category: ${category}\n` +
      `---\n\n` +
      `# ${title}\n\n` +
      `${mdContent}\n`;

    console.log(`  [导入] ${category}/${fileName}  (日期: ${date}, 长度: ${mdContent.length})`);

    if (DRY_RUN) {
      console.log(`      [预览] 未写入。引用资源将被预扫描。`);
      copyArticleAssets(fileContent);  // dry-run 也尝试复制资源以便统计
    } else {
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(outPath, fileContent, 'utf-8');
      copyArticleAssets(fileContent);
      imported++;
    }
  }

  console.log(`\n========== 完成 ==========`);
  console.log(`导入: ${imported} 篇`);
  console.log(`跳过 (空文档): ${skippedEmpty}`);
  console.log(`跳过 (敏感/其他): ${skippedSensitive}`);
  console.log(`跳过 (其他非白名单): ${skippedNotInAllowlist}`);
  if (DRY_RUN) console.log('(dry-run，未实际写入。去掉 --dry-run 以写入)');
}

if (require.main === module) {
  main();
}