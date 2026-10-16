import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Language } from '../types';
import { ArrowLeft, ArrowRight, Pencil, Plus, Search } from 'lucide-react';
import { ArticleEditor, EditableArticle, createEmptyArticle } from './ArticleEditor';
import { toJsDelivr } from '../src/utils/cdn';
import { getArticles, getCategories, ArticleMeta, CategoryInfo } from '../src/utils/articleLoader';
import './archive.css';

/* Types & helpers                                                      */
/* ------------------------------------------------------------------ */

interface ArticleSectionProps {
  language: Language;
  editorMode?: boolean;
}

/** ArticleCategory enum / legacy value → content folder id. */
const LEGACY_CATEGORY_MAP: Record<string, string> = {
  Flovart: 'aiexploration',
  AIExploration: 'aiexploration',
  VideoCreation: 'fancreation',
  ProjectExperience: 'projectexperience',
  LearningReflection: 'learningreflection',
};

const t = (language: Language) => (zh: string, en: string) =>
  language === 'zh' ? zh : en;

/* ------------------------------------------------------------------ */
/* Markdown renderer — safe defaults (no raw HTML), real media handling */
/* ------------------------------------------------------------------ */

const markdownComponents = {
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    <img src={src} alt={alt || ''} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => {
    const external = !!href && /^(https?:)?\/\//.test(href);
    return (
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    );
  },
};

/* ------------------------------------------------------------------ */
/* Journal index                                                        */
/* ------------------------------------------------------------------ */

const JournalIndex: React.FC<{
  articles: ArticleMeta[];
  categories: CategoryInfo[];
  language: Language;
  filter: string | null;
  onFilter: (f: string | null) => void;
}> = ({ articles, categories, language, filter, onFilter }) => {
  const tr = t(language);
  const [query, setQuery] = useState('');

  const categoryFiltered = filter ? articles.filter(a => a.category === filter) : articles;
  const q = query.trim().toLowerCase();
  const filtered = q
    ? categoryFiltered.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.date.includes(q)
      )
    : categoryFiltered;

  const labelFor = (id: string) => categories.find(c => c.id === id)?.label || id;

  return (
    <div>
      {/* Search */}
      <div className="ar-search" role="search">
        <Search size={15} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={tr('搜索文章标题或正文…', 'Search articles…')}
          aria-label={tr('搜索文章', 'Search articles')}
        />
      </div>

      {/* Category nav */}
      <div className="ar-filters" role="navigation" aria-label={tr('文章分类', 'Categories')}>
        <button
          type="button"
          className="ar-filter"
          aria-current={filter === null}
          onClick={() => onFilter(null)}
        >
          {tr('全部', 'All')}
          <span className="ar-filter-count">{articles.length}</span>
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            className="ar-filter"
            aria-current={filter === cat.id}
            onClick={() => onFilter(cat.id)}
          >
            {cat.label}
            <span className="ar-filter-count">{cat.count}</span>
          </button>
        ))}
      </div>

      {/* Dated rows — newest first */}
      {filtered.length > 0 ? (
        <ul className="ar-index">
          {[...filtered].reverse().map(article => (
            <li key={`${article.category}_${article.id}`}>
              <Link
                to={`/articles/${encodeURIComponent(article.category)}/${encodeURIComponent(article.id)}`}
                className="ar-journal-row"
              >
                <span className="ar-journal-date">{article.date}</span>
                <h3 className="ar-journal-title">{article.title}</h3>
                <span className="ar-journal-cat">{labelFor(article.category)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="ar-empty">
          <p className="ar-empty-code">{tr('无结果', 'No results')}</p>
          <h2 className="ar-empty-title">
            {q
              ? tr('没有匹配的文章', 'No matching articles')
              : tr('此分类暂无文章', 'No articles in this category')}
          </h2>
          <p className="ar-empty-note">
            {q
              ? tr('换个关键词试试，或清空搜索。', 'Try a different keyword, or clear the search.')
              : tr('切换到其他分类查看，或返回全部文章。', 'Try another category, or return to all articles.')}
          </p>
          {q ? (
            <button type="button" className="ar-btn ar-btn--ghost" onClick={() => setQuery('')}>
              {tr('清空搜索', 'Clear search')}
            </button>
          ) : (
            <button type="button" className="ar-btn ar-btn--ghost" onClick={() => onFilter(null)}>
              {tr('查看全部', 'View all')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Article reader                                                       */
/* ------------------------------------------------------------------ */

const ArticleReader: React.FC<{
  article: ArticleMeta;
  categories: CategoryInfo[];
  language: Language;
}> = ({ article, categories, language }) => {
  const tr = t(language);
  const label = categories.find(c => c.id === article.category)?.label || article.category;

  return (
    <article>
      <header className="ar-article-head">
        <div className="ar-article-meta">
          <span>{label}</span>
          <span>{article.date}</span>
        </div>
        <h1 className="ar-article-title">{article.title}</h1>
      </header>

      {article.coverImage && (
        <figure className="ar-article-cover">
          <img
            src={toJsDelivr(article.coverImage)}
            alt={article.title}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        </figure>
      )}

      <div className="ar-md">
        {article.content ? (
          <ReactMarkdown components={markdownComponents}>
            {article.content}
          </ReactMarkdown>
        ) : (
          <div className="ar-empty" style={{ borderTop: 0, padding: '3rem 0' }}>
            <p className="ar-empty-note">{tr('内容正在撰写中…', 'Content coming soon…')}</p>
          </div>
        )}
      </div>
    </article>
  );
};

/* ------------------------------------------------------------------ */
/* Not found                                                            */
/* ------------------------------------------------------------------ */

const NotFoundState: React.FC<{
  language: Language;
  kind: 'category' | 'article';
}> = ({ language, kind }) => {
  const tr = t(language);
  return (
    <div className="ar-empty" style={{ paddingTop: 'clamp(2rem,6vw,4rem)' }}>
      <p className="ar-empty-code">404 / {tr('未找到', 'Not found')}</p>
      <h2 className="ar-empty-title">
        {kind === 'category'
          ? tr('分类不存在', 'Category not found')
          : tr('文章不存在', 'Article not found')}
      </h2>
      <p className="ar-empty-note">
        {kind === 'category'
          ? tr('这个分类路径不存在，返回日志列表浏览全部文章。', 'This category path does not exist. Return to the journal.')
          : tr('这个文章链接可能已失效，返回日志列表浏览全部文章。', 'This article link may be outdated. Return to the journal.')}
      </p>
      <Link to="/articles" className="ar-btn ar-btn--ghost" style={{ textDecoration: 'none' }}>
        <ArrowLeft size={13} aria-hidden="true" />
        {tr('返回日志', 'Back to journal')}
      </Link>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Editor helpers                                                       */
/* ------------------------------------------------------------------ */

function articleToEditable(article: ArticleMeta): EditableArticle {
  return {
    id: article.id,
    common: {
      category: article.category,
      link: undefined,
      coverImage: article.coverImage || '',
      date: article.date,
    },
    zh: { title: article.title, content: article.content },
    en: { title: article.title, content: article.content },
  };
}

/* ------------------------------------------------------------------ */
/* Main component                                                       */
/* ------------------------------------------------------------------ */

export const ArticleSection: React.FC<ArticleSectionProps> = ({
  language,
  editorMode = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const tr = t(language);

  const allArticles = getArticles();
  const categories = getCategories();

  /* Parse URL: /articles, /articles/:category, /articles/:category/:id */
  const pathParts = location.pathname.split('/').filter(Boolean);
  const rawCategory = pathParts[0] === 'articles' ? pathParts[1] : undefined;
  const rawArticleId = pathParts[0] === 'articles' ? pathParts[2] : undefined;

  const urlCategory = rawCategory
    ? decodeURIComponent(rawCategory).toLowerCase()
    : null;
  const urlArticleId = rawArticleId
    ? decodeURIComponent(rawArticleId).toLowerCase()
    : null;

  /* Redirect legacy location.state.category → folder path */
  useEffect(() => {
    const legacy = (location.state as { category?: string } | null)?.category;
    if (legacy) {
      const folder = LEGACY_CATEGORY_MAP[legacy] || legacy.toLowerCase();
      navigate(`/articles/${folder}`, { replace: true, state: null });
    }
  }, [location.state, navigate]);

  const categoryExists = !urlCategory || categories.some(c => c.id === urlCategory);
  const selectedArticle = urlCategory && urlArticleId
    ? allArticles.find(a => a.category === urlCategory && a.id === urlArticleId) || null
    : null;
  const articleExists = !urlArticleId || !!selectedArticle;

  const [isEditing, setIsEditing] = useState(false);
  const [editingArticle, setEditingArticle] = useState<EditableArticle | null>(null);
  const [isNewArticle, setIsNewArticle] = useState(false);

  useEffect(() => {
    if (urlArticleId) window.scrollTo({ top: 0 });
  }, [urlArticleId]);

  const handleFilterChange = (f: string | null) => {
    navigate(f ? `/articles/${f}` : '/articles');
  };

  const startEditing = (article: ArticleMeta) => {
    setEditingArticle(articleToEditable(article));
    setIsNewArticle(false);
    setIsEditing(true);
  };

  const startNewArticle = () => {
    setEditingArticle(createEmptyArticle(`new_${Date.now()}`));
    setIsNewArticle(true);
    setIsEditing(true);
  };

  const handleSave = (_article: EditableArticle) => {
    alert(tr('请点击"导出JSON"复制数据，然后发给开发者更新代码', 'Please click "Export JSON" to copy data, then send to developer to update code'));
    setIsEditing(false);
    setEditingArticle(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingArticle(null);
  };

  /* Prev / next within same category (articles sorted ascending by date) */
  const detailNav = selectedArticle ? (() => {
    const same = allArticles.filter(a => a.category === selectedArticle.category);
    const idx = same.findIndex(a => a.id === selectedArticle.id);
    return {
      prev: idx > 0 ? same[idx - 1] : null,
      next: idx >= 0 && idx < same.length - 1 ? same[idx + 1] : null,
    };
  })() : { prev: null, next: null };

  const showEditor = isEditing && editingArticle;
  const showNotFound = !categoryExists || (urlArticleId && !articleExists);
  const showReader = !showEditor && !showNotFound && !!selectedArticle;
  const showIndex = !showEditor && !showNotFound && !selectedArticle;

  return (
    <div className="ar-page">
      <div className="ar-width">
        {/* Page header */}
        <header className="ar-head">
          <p className="ar-eyebrow">
            <span>{tr('日志', 'Journal')}</span>
            <span>· {allArticles.length} {tr('篇', 'entries')}</span>
          </p>
          <h1 className="ar-title">
            {tr('开发', '')}
            <span className="ar-title-serif">{tr('日志', 'Journal')}</span>
          </h1>
          <p className="ar-sub">
            {tr(
              '关于构建、工具与创作过程的真实记录。',
              'Honest notes on building, tooling, and the creative process.'
            )}
          </p>
        </header>

        {/* Editor toolbar */}
        {editorMode && !showEditor && (
          <div className="ar-editor-bar">
            {selectedArticle ? (
              <button type="button" className="ar-icon-btn" onClick={() => startEditing(selectedArticle)}>
                <Pencil size={12} aria-hidden="true" />
                {tr('编辑', 'Edit')}
              </button>
            ) : (
              <button type="button" className="ar-icon-btn" onClick={startNewArticle}>
                <Plus size={12} aria-hidden="true" />
                {tr('新建日志', 'New entry')}
              </button>
            )}
          </div>
        )}

        {/* Body */}
        {showEditor ? (
          <div style={{ paddingTop: 'clamp(1.5rem,3vw,2.5rem)' }}>
            <ArticleEditor
              article={editingArticle}
              language={language}
              onSave={handleSave}
              onCancel={handleCancel}
              isNew={isNewArticle}
            />
          </div>
        ) : showNotFound ? (
          <NotFoundState language={language} kind={categoryExists ? 'article' : 'category'} />
        ) : showReader && selectedArticle ? (
          <div className="ar-detail">
            <button
              type="button"
              className="ar-detail-back"
              onClick={() => navigate(`/articles/${selectedArticle.category}`)}
            >
              <ArrowLeft size={14} aria-hidden="true" />
              {categories.find(c => c.id === selectedArticle.category)?.label || tr('返回', 'Back')}
            </button>
            <ArticleReader
              article={selectedArticle}
              categories={categories}
              language={language}
            />
            {(detailNav.prev || detailNav.next) && (
              <nav className="ar-detail-nav" aria-label={tr('同类文章导航', 'Same-category navigation')}>
                {detailNav.prev ? (
                  <Link to={`/articles/${encodeURIComponent(detailNav.prev.category)}/${encodeURIComponent(detailNav.prev.id)}`}>
                    <ArrowLeft size={13} aria-hidden="true" />
                    {detailNav.prev.title}
                  </Link>
                ) : <span />}
                {detailNav.next ? (
                  <Link to={`/articles/${encodeURIComponent(detailNav.next.category)}/${encodeURIComponent(detailNav.next.id)}`}>
                    {detailNav.next.title}
                    <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                ) : <span />}
              </nav>
            )}
          </div>
        ) : showIndex ? (
          <div style={{ paddingTop: 'clamp(1.5rem,3vw,2.5rem)' }}>
            <JournalIndex
              articles={allArticles}
              categories={categories}
              language={language}
              filter={urlCategory}
              onFilter={handleFilterChange}
            />
          </div>
        ) : null}

        {/* Footer count */}
        <div className="ar-foot">
          <span>© 2026 AVABBBB</span>
          <span>{allArticles.length} {tr('篇日志', 'entries')}</span>
        </div>
      </div>
    </div>
  );
};
