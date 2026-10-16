/**
 * 文章加载器 - 自动扫描 content/articles 目录下的 markdown 文件
 * 
 * 文件夹名即为项目分类（自动生成）
 * 文件命名规则：
 *   旧: {category}/DAY{序号}-{标题}-{日期YYYYMMDD}.md  （日期从文件名解析）
 *   新: {category}/{纯标题}.md                          （标题+日期从 YAML frontmatter 读取）
 */

// 使用 Vite 的 glob 导入
const articleModules = import.meta.glob('/content/articles/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

export interface ArticleMeta {
  id: string;
  category: string; // 直接用文件夹名作为分类
  title: string;
  date: string;
  coverImage?: string;
  content: string;
}

export interface CategoryInfo {
  id: string; // 文件夹名（小写）
  label: string; // 显示名称（首字母大写）
  count: number;
}

// 从文件名解析信息
// 支持两种命名：
//   - 旧格式: DAY01-项目逻辑梳理-20251111.md
//   - 新格式: 纯标题.md （标题与日期从 YAML frontmatter 读取）
function parseFileName(
  fileName: string
): { id: string; title: string | null; date: string | null } | null {
  const name = fileName.replace(/\.md$/, '');
  const legacy = name.match(/^(DAY\d+)-(.+)-(\d{8})$/);
  if (legacy) {
    const [, dayPart, titlePart, datePart] = legacy;
    const date = `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}`;
    const title = `${dayPart} - ${titlePart}`;
    const id = dayPart.toLowerCase();
    return { id, title, date };
  }
  // 新格式：纯标题.md —— 标题与日期交给 frontmatter 提供方决定
  return {
    id: decodeURIComponent(name).toLowerCase(),
    title: null,
    date: null,
  };
}

// 从 markdown 内容顶部提取 YAML frontmatter（轻量解析，仅识别 title/date）
function parseFrontmatter(content: string): { title?: string; date?: string; coverImage?: string } {
  const m = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!m) return {};
  const body = m[1];
  const out: { title?: string; date?: string; coverImage?: string } = {};
  const titleMatch = body.match(/^title:\s*(.+?)\s*$/m);
  if (titleMatch) {
    let t = titleMatch[1].trim();
    // 去掉两端引号（单/双）
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
      t = t.slice(1, -1);
    }
    out.title = t;
  }
  const dateMatch = body.match(/^date:\s*(\d{4}-\d{2}-\d{2})\s*$/m);
  if (dateMatch) out.date = dateMatch[1];
  const coverMatch = body.match(/^coverImage:\s*(.+?)\s*$/m);
  if (coverMatch) {
    let c = coverMatch[1].trim();
    if ((c.startsWith('"') && c.endsWith('"')) || (c.startsWith("'") && c.endsWith("'"))) {
      c = c.slice(1, -1);
    }
    out.coverImage = c;
  }
  return out;
}

// 从文件路径解析分类
function parseFilePath(
  path: string
): { category: string; fileName: string } | null {
  const match = path.match(/\/content\/articles\/([^/]+)\/([^/]+\.md)$/);
  if (!match) return null;

  const [, category, fileName] = match;
  // decodeURIComponent: Vite import.meta.glob URL-encodes non-ASCII paths
  return { category: decodeURIComponent(category).toLowerCase(), fileName };
}

// 格式化分类名称（首字母大写，支持驼峰转空格）
function formatCategoryLabel(category: string): string {
  // 特殊处理一些名称
  const specialNames: Record<string, string> = {
    'traces': 'Traces of Presence',
    'tracesofpresence': 'Traces of Presence',
    'projectexperience': '项目经历',
    'aiexploration': 'AI探索',
    'fancreation': '二创制作',
    'learningreflection': '学习感悟',
  };
  
  if (specialNames[category]) {
    return specialNames[category];
  }
  
  // 首字母大写
  return category.charAt(0).toUpperCase() + category.slice(1);
}

// 加载所有文章
function loadAllArticles(): { articles: ArticleMeta[]; categories: CategoryInfo[] } {
  const articles: ArticleMeta[] = [];
  const categorySet = new Set<string>();

  for (const [path, rawContent] of Object.entries(articleModules)) {
    const pathInfo = parseFilePath(path);
    if (!pathInfo) continue;

    const fileInfo = parseFileName(pathInfo.fileName);
    if (!fileInfo) continue;

    const raw = (rawContent as string).replace(/^\uFEFF/, '');
    const content = raw.trim();
    const fm = parseFrontmatter(content);

    // 标题：优先 frontmatter，其次 parseFileName 旧格式，最后回退到文件名
    const title = fm.title || fileInfo.title || decodeURIComponent(pathInfo.fileName.replace(/\.md$/, ''));
    // 日期：优先 frontmatter，其次 parseFileName 旧格式；都没有则跳过
    const date = fm.date || fileInfo.date;
    if (!date) continue;

    // 去掉 frontmatter 块，避免在正文渲染中显示
    let bodyContent = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
    // 剥离 kramdown 行内属性语法（如 {: style="width: 1002px;"}），避免渲染成文字
    bodyContent = bodyContent.replace(/\{\:[^\n]*\}/g, '');
    // 封面：frontmatter 优先，否则回退到正文第一张图
    const firstImage = bodyContent.match(/!\[[^\]]*\]\(([^)\s]+)\)/);

    categorySet.add(pathInfo.category);

    articles.push({
      id: fileInfo.id,
      category: pathInfo.category,
      title,
      date,
      coverImage: fm.coverImage || (firstImage ? firstImage[1] : undefined),
      content: bodyContent,
    });
  }

  // 按日期正序排列
  articles.sort((a, b) => a.date.localeCompare(b.date));

  // 生成分类列表
  const categories: CategoryInfo[] = Array.from(categorySet)
    .sort()
    .map((cat) => ({
      id: cat,
      label: formatCategoryLabel(cat),
      count: articles.filter((a) => a.category === cat).length,
    }));

  return { articles, categories };
}

// 缓存
let cache: { articles: ArticleMeta[]; categories: CategoryInfo[] } | null = null;

function getCache() {
  if (!cache) {
    cache = loadAllArticles();
  }
  return cache;
}

export function getArticles(): ArticleMeta[] {
  return getCache().articles;
}

export function getCategories(): CategoryInfo[] {
  return getCache().categories;
}

// 兼容旧接口
export function getArticlesByLanguage() {
  const articles = getArticles();
  return { zh: articles, en: articles };
}
