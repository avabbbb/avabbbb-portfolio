/**
 * SiYuan Note → Blog Markdown 批量导入脚本
 *
 * 用法:
 *   node scripts/import-siyuan.cjs
 *   node scripts/import-siyuan.cjs --dry-run          # 预览不写入
 *   node scripts/import-siyuan.cjs --notebook "专业学习" # 仅导入指定笔记本
 *
 * 逻辑:
 *   1. 扫描 SiYuan data 目录下的所有笔记本
 *   2. 读取每个 .sy 文件 (protyle JSON AST)
 *   3. 将 protyle AST 转换为 Markdown
 *   4. 输出到 content/articles/{笔记本名}/DAY{序号}-{标题}-{日期}.md
 */

const fs = require('fs');
const path = require('path');

// ========== 配置 ==========
const SIYUAN_DATA_DIR = process.env.SIYUAN_DATA || 'H:\\SiYuan\\data';
const OUTPUT_BASE = path.join(__dirname, '..', 'content', 'articles');
const DRY_RUN = process.argv.includes('--dry-run');
const NOTEBOOK_FILTER = (() => {
  const idx = process.argv.indexOf('--notebook');
  return idx >= 0 ? process.argv[idx + 1] : null;
})();
// 跳过的系统笔记本
const SKIP_NOTEBOOKS = ['思源初始用户指南', 'Untitled'];

// ========== 工具函数 ==========

/** 清理文件名中的非法字符 */
function sanitizeFileName(name) {
  return name.replace(/[\\/:*?"<>|#]/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

/** 读取 notebook 名称 */
function getNotebookName(notebookDir) {
  const confPath = path.join(notebookDir, '.siyuan', 'conf.json');
  if (fs.existsSync(confPath)) {
    try {
      const conf = JSON.parse(fs.readFileSync(confPath, 'utf-8'));
      return conf.name || path.basename(notebookDir);
    } catch (e) { /* ignore */ }
  }
  return path.basename(notebookDir);
}

// ========== Protyle AST → Markdown 转换 ==========

/**
 * 将 protyle AST 节点树转换为 Markdown 字符串
 * 支持的块类型:
 *   NodeDocument, NodeHeading, NodeParagraph, NodeList, NodeListItem,
 *   NodeBlockquote, NodeCodeBlock, NodeThematicBreak, NodeTable, NodeSuperBlock
 * 支持的内联格式:
 *   bold, italic, underline, strike, code, kbd, sup, sub, mark,
 *   a (链接), tag, block-ref, file-annotation-ref, inline-math
 *   NodeImage (图片)
 */
function protyleToMarkdown(node, depth = 0) {
  if (!node || typeof node !== 'object') return '';

  const type = node.Type;
  const children = node.Children || [];
  const props = node.Properties || {};

  switch (type) {

    case 'NodeDocument':
      return children.map(c => protyleToMarkdown(c, depth)).join('\n\n');

    case 'NodeHeading': {
      // 从 NodeHeadingMarker 获取级别，fallback 到 level 属性
      let level = 1;
      const markerChild = children.find(c => c.Type === 'NodeHeadingMarker');
      if (markerChild && markerChild.Data) {
        level = markerChild.Data.length; // "##" -> 2
      } else if (props.headingLevel) {
        level = parseInt(props.headingLevel, 10) || 1;
      }
      const prefix = '#'.repeat(level) + ' ';
      const content = children
        .filter(c => c.Type !== 'NodeHeadingMarker')
        .map(c => protyleToMarkdown(c, depth))
        .join('')
        .trim();
      // 跳过只有空内容的标题（如只有 zero-width space / span 占位符）
      if (!content || /^[​\s]*$/.test(content)) return '';
      return prefix + content;
    }

    case 'NodeParagraph': {
      const content = children.map(c => inlineToMarkdown(c)).join('').trim();
      // 跳过只有 zero-width space 占位的空段落
      if (!content || /^[​\s]*$/.test(content)) return '';
      return content;
    }

    case 'NodeList': {
      const listItems = children
        .filter(c => c.Type === 'NodeListItem')
        .map(c => protyleToMarkdown(c, depth))
        .join('\n');
      return listItems;
    }

    case 'NodeListItem': {
      const listData = node.ListData || {};
      const isOrdered = listData.Num > 0 || String(listData.Marker) === '1';
      const prefix = isOrdered ? `${listData.Num || 1}. ` : '- ';
      // Depth-based indentation
      const indent = '  '.repeat(Math.max(0, depth));
      const content = children.map(c => {
        // 嵌套列表
        if (c.Type === 'NodeList') {
          return protyleToMarkdown(c, depth + 1);
        }
        return inlineToMarkdown(c);
      }).join('');
      return indent + prefix + content;
    }

    case 'NodeBlockquote': {
      const content = children
        .filter(c => c.Type !== 'NodeBlockquoteMarker')
        .map(c => protyleToMarkdown(c, depth))
        .join('\n');
      return '> ' + content.replace(/\n/g, '\n> ');
    }

    case 'NodeCodeBlock': {
      const lang = (props.language || '').trim();
      const code = children
        .filter(c => c.Type === 'NodeText')
        .map(c => c.Data || '')
        .join('');
      return '```' + lang + '\n' + code + '\n```';
    }

    case 'NodeThematicBreak':
      return '---';

    case 'NodeTable': {
      // SiYuan tables: children are NodeTableRow
      const rows = children.filter(c => c.Type === 'NodeTableRow');
      if (rows.length === 0) return '';
      const mdRows = rows.map(row => {
        const cells = (row.Children || [])
          .filter(c => c.Type === 'NodeTableCell')
          .map(cell => {
            const text = (cell.Children || [])
              .map(c => inlineToMarkdown(c))
              .join('');
            return text.replace(/\|/g, '\\|');
          });
        return '| ' + cells.join(' | ') + ' |';
      });
      if (mdRows.length >= 2) {
        const colCount = mdRows[0].split('|').length - 2;
        const sep = '|' + ' --- |'.repeat(colCount);
        mdRows.splice(1, 0, sep);
      }
      return mdRows.join('\n');
    }

    case 'NodeSuperBlock':
      return children.map(c => protyleToMarkdown(c, depth)).join('\n\n');

    // HTML block
    case 'NodeHTMLBlock': {
      const html = children
        .filter(c => c.Type === 'NodeText')
        .map(c => c.Data || '')
        .join('');
      return html;
    }

    // Embedded blocks / queries - 标记但不展开
    case 'NodeBlockQueryEmbed':
      return `> *(嵌入内容)*\n`;

    case 'NodeIFrame':
    case 'NodeVideo':
    case 'NodeAudio':
    case 'NodeWidget':
      return ''; // 跳过媒体/widget

    default:
      // 未识别的块类型，尝试递归处理子节点
      if (children.length > 0) {
        return children.map(c => protyleToMarkdown(c, depth)).join('\n');
      }
      return '';
  }
}

/**
 * 将内联节点转换为 Markdown 行内文本
 */
function inlineToMarkdown(node) {
  if (!node) return '';

  const type = node.Type;
  const data = node.Data || '';
  const children = node.Children || [];

  switch (type) {
    case 'NodeText':
      return escapeMarkdownInline(data);

    case 'NodeTextMark': {
      const markType = node.TextMarkType || '';
      const innerContent = data
        ? data
        : children.map(c => inlineToMarkdown(c)).join('');

      // 块引用和嵌入引用的文本内容从 TextMarkTextContent 获取
      const textContent = node.TextMarkTextContent || innerContent;
      const displayText = textContent || data;

      switch (markType) {
        // 粗体
        case 'bold':
          return `**${displayText}**`;
        // 斜体
        case 'italic':
          return `*${displayText}*`;
        // 下划线
        case 'underline':
          return `<u>${displayText}</u>`;
        // 删除线
        case 'strike':
          return `~~${displayText}~~`;
        // 行内代码
        case 'code':
          return '`' + displayText + '`';
        // 键盘
        case 'kbd':
          return `<kbd>${displayText}</kbd>`;
        // 上标
        case 'sup':
          return `^${displayText}^`;
        // 下标
        case 'sub':
          return `~${displayText}~`;
        // 高亮
        case 'mark':
          return `==${displayText}==`;
        // 链接
        case 'a': {
          const href = node.TextMarkAHref || '';
          const title = node.TextMarkATitle || '';
          const titlePart = title ? ` "${title}"` : '';
          return `[${displayText}](${href}${titlePart})`;
        }
        // 标签
        case 'tag':
          return ` #${displayText} `;
        // 块引用
        case 'block-ref': {
          return displayText || '';
        }
        // 嵌入块
        case 'inline-memo':
          return ''; // 跳过内联备注
        // 文件标注引用
        case 'file-annotation-ref': {
          return `[[${displayText}]]`;
        }
        // 内联公式
        case 'inline-math':
          return `$${data}$`;
        default:
          return displayText;
      }
    }

    // 公式节点
    case 'NodeMathBlock':
      return `$$\n${data}\n$$`;

    // 图片节点: SiYuan uses complex AST children to represent ![alt](path)
    // Children: [NodeBang, NodeOpenBracket, NodeLinkText, NodeCloseBracket,
    //            NodeOpenParen, NodeLinkDest, NodeCloseParen]
    case 'NodeImage': {
      const linkDest = children.find(c => c.Type === 'NodeLinkDest');
      const linkText = children.find(c => c.Type === 'NodeLinkText');
      const imgPath = (linkDest && linkDest.Data) ? linkDest.Data : '';
      const alt = (linkText && linkText.Data) ? linkText.Data : '';
      // Keep the SiYuan asset path, will copy files to public/ separately
      return `![${alt}](/${imgPath})`;
    }

    // 硬换行
    case 'NodeHardBreak':
    case 'NodeBr':
      return '\n';

    // 标签节点
    case 'NodeTag':
      return ` #${data} `;

    // 行内公式
    case 'NodeInlineMath':
      return `$${data}$`;

    default:
      if (data) return data;
      if (children.length > 0) {
        return children.map(c => inlineToMarkdown(c)).join('');
      }
      return '';
  }
}

/**
 * 转义 Markdown 中的特殊字符（在纯文本 NodeText 中）
 */
function escapeMarkdownInline(text) {
  if (!text) return '';
  // 只转义在文本中会造成格式问题的字符
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/`/g, '\\`')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/</g, '\\<');
}

/**
 * 清理转换后的 Markdown 内容
 * - 移除 zero-width space (U+200B) 占位符
 * - 移除孤立的 "span" 占位符（protyle 空内容标记）
 * - 压缩连续空行
 */
function cleanMarkdown(content) {
  return content
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')  // 零宽字符
    .replace(/^span\s*$/gm, '')                    // 孤立的 span 占位符行
    .replace(/\n{3,}/g, '\n\n')                    // 压缩连续空行
    .trim();
}

// ========== 资源复制 ==========

const SIYUAN_ASSETS_DIR = path.join(SIYUAN_DATA_DIR, 'assets');
const PUBLIC_ASSETS_DIR = path.join(__dirname, '..', 'public', 'assets');
const copiedAssets = new Set(); // 避免重复复制

/**
 * 从 Markdown 内容中提取 `assets/xxx.yyy` 路径并复制到 public/assets/
 */
function copyArticleAssets(content) {
  if (!fs.existsSync(SIYUAN_ASSETS_DIR)) return;

  const re = /\]\(\/assets\/([^)]+)\)/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    const assetFile = match[1];
    const srcPath = path.join(SIYUAN_ASSETS_DIR, assetFile);
    const dstPath = path.join(PUBLIC_ASSETS_DIR, assetFile);

    if (!copiedAssets.has(assetFile) && fs.existsSync(srcPath)) {
      if (!fs.existsSync(PUBLIC_ASSETS_DIR)) {
        fs.mkdirSync(PUBLIC_ASSETS_DIR, { recursive: true });
      }
      fs.copyFileSync(srcPath, dstPath);
      copiedAssets.add(assetFile);
    }
  }
}

// ========== 核心导入逻辑 ==========

function importNotebook(notebookDir, notebookName) {
  if (SKIP_NOTEBOOKS.includes(notebookName)) {
    console.log(`  [跳过] 系统笔记本: ${notebookName}`);
    return [];
  }
  if (NOTEBOOK_FILTER && notebookName !== NOTEBOOK_FILTER) {
    console.log(`  [跳过] 不在过滤条件中: ${notebookName}`);
    return [];
  }

  const imported = [];

  // 收集所有 .sy 文件 (递归扫描，因为子目录中也有文档)
  const syFiles = [];
  function collectSyFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // 跳过 .siyuan 和 assets 目录
        if (!['.siyuan', 'assets', 'storage'].includes(entry.name)) {
          collectSyFiles(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.sy')) {
        syFiles.push(fullPath);
      }
    }
  }
  collectSyFiles(notebookDir);

  if (syFiles.length === 0) {
    console.log(`  [空] ${notebookName}`);
    return imported;
  }

  console.log(`  [处理] ${notebookName} (${syFiles.length} 篇)`);

  for (const syPath of syFiles) {
    try {
      const raw = fs.readFileSync(syPath, 'utf-8');
      const doc = JSON.parse(raw);

      if (doc.Type !== 'NodeDocument') continue;

      const title = (doc.Properties && doc.Properties.title) || path.basename(syPath, '.sy');
      const updated = (doc.Properties && doc.Properties.updated) || '19700101000000';
      const dateStr = updated.slice(0, 8); // YYYYMMDD
      const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;

      // 转换为 Markdown
      const mdContent = protyleToMarkdown(doc);

      // 跳过空文档
      if (!mdContent.trim()) {
        console.log(`    [跳过空文档] ${title}`);
        continue;
      }

      imported.push({ title, date: formattedDate, dateStr, content: mdContent, notebookName });

    } catch (e) {
      console.error(`    [解析失败] ${path.basename(syPath)}: ${e.message}`);
    }
  }

  return imported;
}

function writeArticles(articles) {
  if (articles.length === 0) {
    console.log('\n没有可导入的文章。');
    return;
  }

  // 按笔记本分组
  const byNotebook = {};
  for (const a of articles) {
    if (!byNotebook[a.notebookName]) byNotebook[a.notebookName] = [];
    byNotebook[a.notebookName].push(a);
  }

  let totalWritten = 0;

  for (const [notebookName, list] of Object.entries(byNotebook)) {
    const safeName = sanitizeFileName(notebookName);
    const outputDir = path.join(OUTPUT_BASE, safeName);

    if (!DRY_RUN) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 按日期排序
    list.sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    // 分配 DAY 序号（从已有文件中找最大序号）
    let maxDay = 0;
    if (!DRY_RUN) {
      const existings = fs.existsSync(outputDir)
        ? fs.readdirSync(outputDir).filter(f => /^DAY\d+/.test(f))
        : [];
      for (const f of existings) {
        const m = f.match(/^DAY(\d+)/);
        if (m) maxDay = Math.max(maxDay, parseInt(m[1], 10));
      }
    }

    console.log(`\n--- ${notebookName} (${safeName}) ---`);

    for (const a of list) {
      maxDay++;
      const dayStr = 'DAY' + String(maxDay).padStart(2, '0');
      const safeTitle = sanitizeFileName(a.title) || 'untitled';
      const fileName = `${dayStr}-${safeTitle}-${a.dateStr}.md`;
      const filePath = path.join(outputDir, fileName);

      const fileContent = `# ${dayStr} - ${a.title}\n\n${cleanMarkdown(a.content)}\n`;

      if (DRY_RUN) {
        console.log(`  [预览] ${fileName}`);
      } else {
        fs.writeFileSync(filePath, fileContent, 'utf-8');
        console.log(`  [写入] ${fileName}`);
        // 复制这篇文章引用的图片资源
        copyArticleAssets(fileContent);
      }
      totalWritten++;
    }
  }

  console.log(`\n========== 完成 ==========`);
  console.log(`共导入 ${totalWritten} 篇文章`);
  if (DRY_RUN) console.log('(dry-run 模式，未实际写入文件。去掉 --dry-run 以写入)');
}

module.exports = {
  protyleToMarkdown,
  inlineToMarkdown,
  cleanMarkdown,
  sanitizeFileName,
  copyArticleAssets,
  importNotebook,
  SIYUAN_DATA_DIR,
  OUTPUT_BASE,
  PUBLIC_ASSETS_DIR,
  SIYUAN_ASSETS_DIR,
};

// ========== 主入口 ==========

function main() {
  console.log('SiYuan → Blog 导入工具\n');
  console.log(`数据目录: ${SIYUAN_DATA_DIR}`);
  console.log(`输出目录: ${OUTPUT_BASE}`);
  if (NOTEBOOK_FILTER) console.log(`过滤笔记本: ${NOTEBOOK_FILTER}`);
  if (DRY_RUN) console.log('模式: dry-run (预览)\n');

  if (!fs.existsSync(SIYUAN_DATA_DIR)) {
    console.error(`错误: SiYuan data 目录不存在: ${SIYUAN_DATA_DIR}`);
    console.error('请设置 SIYUAN_DATA 环境变量或修改脚本中的路径');
    process.exit(1);
  }

  // 获取所有笔记本目录 (格式: YYYYMMDDHHmmss-hash)
  const notebookEntries = fs.readdirSync(SIYUAN_DATA_DIR)
    .filter(name => /^\d{14}-[a-z0-9]+$/.test(name))
    .map(name => path.join(SIYUAN_DATA_DIR, name))
    .filter(p => fs.statSync(p).isDirectory());

  console.log(`找到 ${notebookEntries.length} 个笔记本\n`);

  const allArticles = [];
  for (const nbDir of notebookEntries) {
    const name = getNotebookName(nbDir);
    const articles = importNotebook(nbDir, name);
    allArticles.push(...articles);
  }

  writeArticles(allArticles);
}

if (require.main === module) {
  main();
}
