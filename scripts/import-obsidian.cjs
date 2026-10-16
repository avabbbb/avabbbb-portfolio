/**
 * Obsidian Vault → Blog Markdown 批量导入脚本
 *
 * 用法:
 *   node scripts/import-obsidian.cjs --vault "D:\MyVault"                    # 全部
 *   node scripts/import-obsidian.cjs --vault "D:\MyVault" --dry-run          # 预览
 *   node scripts/import-obsidian.cjs --vault "D:\MyVault" --folder "笔记/技术" # 指定子目录
 *
 * 逻辑:
 *   1. 扫描 Obsidian Vault 下的 .md 文件
 *   2. 清洗 Obsidian 特有语法 (wiki links, callouts, properties)
 *   3. 输出到 content/articles/Obsidian/DAY{序号}-{标题}-{日期}.md
 */

const fs = require('fs');
const path = require('path');

// ========== 配置 ==========
const OUTPUT_BASE = path.join(__dirname, '..', 'content', 'articles');
const DRY_RUN = process.argv.includes('--dry-run');

const VAULT_PATH = (() => {
  const idx = process.argv.indexOf('--vault');
  return idx >= 0 ? process.argv[idx + 1] : null;
})();

const FOLDER_FILTER = (() => {
  const idx = process.argv.indexOf('--folder');
  return idx >= 0 ? process.argv[idx + 1] : null;
})();

// 跳过的系统目录和文件
const SKIP_DIRS = ['.obsidian', '.trash', '.git', 'node_modules', 'templates', '_templates', 'attachments', 'assets'];
const SKIP_FILES = ['README.md', 'index.md', 'home.md'];

// ========== Obsidian 特有语法清洗 ==========

/**
 * 清洗 Obsidian Markdown 为通用 Markdown
 * 1. Wiki Links: [[Page]] → Page, [[Page|Alias]] → Alias, [[Page#Heading]] → Page#Heading
 * 2. Callouts: > [!note] ... → > **Note:** ...
 * 3. 图片嵌入: ![[image.png]] → ![](image.png)
 * 4. 移除 frontmatter YAML
 */
function cleanObsidianMarkdown(content) {
  let cleaned = content;

  // 1. 移除 YAML frontmatter (---\n...\n---)
  cleaned = cleaned.replace(/^---\n[\s\S]*?\n---\n*/, '');

  // 2. 图片嵌入 ![[image.png|size]] → ![](image.png)
  cleaned = cleaned.replace(/!\[\[([^\]]+?)\]\]/g, (match, inner) => {
    // inner 可能包含 |size 或 #fragment
    const parts = inner.split('|');
    const imgPath = parts[0].trim();
    return `![](${imgPath})`;
  });

  // 3. Wiki Links [[Page]] → [Page](Page)
  cleaned = cleaned.replace(/(?<!!)\[\[([^\]]+?)\]\]/g, (match, inner) => {
    const parts = inner.split('|');
    const target = parts[0].trim();
    const alias = parts[1] ? parts[1].trim() : target;
    // 处理 #heading 引用
    const hashIdx = target.indexOf('#');
    const page = hashIdx >= 0 ? target.slice(0, hashIdx) : target;
    return `[${alias}](${page})`;
  });

  // 4. Callouts: > [!type] Title\n> content →  blockquote with bold header
  cleaned = cleaned.replace(
    /^> \[!(\w+)\]\s*(.*?)\n((?:>.*\n?)*)/gm,
    (match, type, title, body) => {
      const label = type.charAt(0).toUpperCase() + type.slice(1);
      const header = title.trim() ? `${label}: ${title.trim()}` : label;
      return `> **${header}**\n${body.trimEnd()}`;
    }
  );

  // 5. 移除 Obsidian 特有语法标记
  // 高亮 ==text== (有些 Markdown 解析器不支持，保留)
  // Comments %% text %% (移除)
  cleaned = cleaned.replace(/%%.*?%%/gs, '');

  // 6. Dataview 代码块 → 移除
  cleaned = cleaned.replace(/```dataview\n[\s\S]*?\n```/g, '');

  // 7. Tags 保留为普通文本 (#tag)
  // 已经 OK

  // 8. 脚注清理 [^1] → 保留 (react-markdown 支持)
  // OK

  return cleaned.trim();
}

// ========== 文件日期推断 ==========

/**
 * 获取文件的"日期"，优先级:
 * 1. frontmatter 中的 date / created / ctime
 * 2. 文件名中的日期 (YYYY-MM-DD 或 YYYYMMDD 或 YYYY.M.D)
 * 3. 文件的创建时间
 */
function extractDate(filePath, content) {
  // 1. 从 frontmatter 提取
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (fmMatch) {
    const fm = fmMatch[1];
    const dateMatch = fm.match(/(?:^|\n)(?:date|created|ctime|cdate):\s*["']?(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      const d = new Date(dateMatch[1]);
      if (!isNaN(d.getTime())) {
        return formatDate(d);
      }
    }
  }

  // 2. 从文件名提取
  const basename = path.basename(filePath, '.md');
  const fnDateMatch = basename.match(/(\d{4})[-_.](\d{1,2})[-_.](\d{1,2})/);
  if (fnDateMatch) {
    const [_, y, m, d] = fnDateMatch;
    return `${y}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}`;
  }

  // 3. 文件创建时间
  const stat = fs.statSync(filePath);
  return formatDate(stat.birthtime);
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

// ========== 文件发现 ==========

function scanVault(vaultPath) {
  const files = [];

  function walk(dir, basePath) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') && SKIP_DIRS.includes(entry.name)) continue;
      if (SKIP_DIRS.includes(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(basePath, fullPath);

      if (entry.isDirectory()) {
        walk(fullPath, basePath);
      } else if (entry.isFile() && entry.name.endsWith('.md') && !SKIP_FILES.includes(entry.name)) {
        files.push({ fullPath, relPath });
      }
    }
  }

  walk(vaultPath, vaultPath);
  return files;
}

// ========== 核心导入逻辑 ==========

function importVault(vaultPath) {
  console.log(`扫描: ${vaultPath}`);
  const allFiles = scanVault(vaultPath);

  // 应用文件夹过滤
  let files = allFiles;
  if (FOLDER_FILTER) {
    files = allFiles.filter(f => f.relPath.startsWith(FOLDER_FILTER));
    console.log(`过滤子目录: ${FOLDER_FILTER}`);
  }

  console.log(`找到 ${files.length} 篇 .md 文件\n`);

  const articles = [];
  for (const file of files) {
    try {
      const rawContent = fs.readFileSync(file.fullPath, 'utf-8');
      if (!rawContent.trim()) continue;

      const cleaned = cleanObsidianMarkdown(rawContent);
      if (!cleaned.trim()) continue;

      const dateStr = extractDate(file.fullPath, rawContent);
      const title = path.basename(file.path, '.md').replace(/^\d{4}[-_.]\d{1,2}[-_.]\d{1,2}[-_.]?/, '').trim() || path.basename(file.path, '.md');

      // 子目录路径作为类别标签
      const dirPath = path.dirname(file.relPath);
      const category = dirPath === '.' ? 'Obsidian' : dirPath.replace(/[\\/]/g, '-');

      articles.push({
        title: title || 'Untitled',
        dateStr,
        category,
        content: cleaned,
        sourcePath: file.relPath,
      });
    } catch (e) {
      console.error(`  [读取失败] ${file.relPath}: ${e.message}`);
    }
  }

  return articles;
}

function writeArticles(articles) {
  if (articles.length === 0) {
    console.log('\n没有可导入的文章。');
    return;
  }

  // 按分类分组
  const byCategory = {};
  for (const a of articles) {
    if (!byCategory[a.category]) byCategory[a.category] = [];
    byCategory[a.category].push(a);
  }

  let totalWritten = 0;

  for (const [category, list] of Object.entries(byCategory)) {
    const safeCategory = category.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '-');
    const outputDir = path.join(OUTPUT_BASE, safeCategory);

    if (!DRY_RUN) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    list.sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    let maxDay = 0;
    if (!DRY_RUN && fs.existsSync(outputDir)) {
      const existings = fs.readdirSync(outputDir).filter(f => /^DAY\d+/.test(f));
      for (const f of existings) {
        const m = f.match(/^DAY(\d+)/);
        if (m) maxDay = Math.max(maxDay, parseInt(m[1], 10));
      }
    }

    console.log(`\n--- ${category} ---`);

    for (const a of list) {
      maxDay++;
      const dayStr = 'DAY' + String(maxDay).padStart(2, '0');
      const safeTitle = a.title.replace(/[\\/:*?"<>|]/g, '-').slice(0, 50);
      const fileName = `${dayStr}-${safeTitle}-${a.dateStr}.md`;
      const filePath = path.join(outputDir, fileName);

      const fileContent = `# ${dayStr} - ${a.title}\n\n> 来源: ${a.sourcePath}\n\n${a.content}\n`;

      if (DRY_RUN) {
        console.log(`  [预览] ${fileName}`);
      } else {
        fs.writeFileSync(filePath, fileContent, 'utf-8');
        console.log(`  [写入] ${fileName}`);
      }
      totalWritten++;
    }
  }

  console.log(`\n========== 完成 ==========`);
  console.log(`共导入 ${totalWritten} 篇文章`);
  if (DRY_RUN) console.log('(dry-run 模式，未实际写入文件。去掉 --dry-run 以写入)');
}

// ========== 主入口 ==========

function main() {
  console.log('Obsidian → Blog 导入工具\n');

  if (!VAULT_PATH) {
    console.error('错误: 请指定 Obsidian Vault 路径');
    console.error('用法: node scripts/import-obsidian.cjs --vault "D:\\MyVault" [--dry-run] [--folder "子目录"]');
    process.exit(1);
  }

  if (!fs.existsSync(VAULT_PATH)) {
    console.error(`错误: Vault 路径不存在: ${VAULT_PATH}`);
    process.exit(1);
  }

  console.log(`输出目录: ${OUTPUT_BASE}`);
  if (DRY_RUN) console.log('模式: dry-run (预览)\n');

  const articles = importVault(VAULT_PATH);
  writeArticles(articles);
}

main();
