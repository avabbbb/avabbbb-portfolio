import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { MotionConfig } from 'motion/react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  Navigate,
  useNavigate,
  useLocation,
  useNavigationType,
} from 'react-router-dom';
import { Bot, Menu, X, ArrowUpRight } from 'lucide-react';
import { HeroSection } from './components/HeroSection';
import { SelectedWork } from './components/SelectedWork';
import { PortfolioSection } from './components/PortfolioSection';
import { UnlockModal } from './components/UnlockModal';
import { NotFound } from './components/NotFound';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import type { Language } from './types';
import { Category } from './types';
import { isUiUnlocked, requestUnlock, setUiUnlocked } from './src/utils/unlock';
import './components/site-chrome.css';

const CaseStudy = lazy(() =>
  import('./components/CaseStudy').then((m) => ({ default: m.CaseStudy }))
);
const ArticleSection = lazy(() =>
  import('./components/ArticleSection').then((m) => ({ default: m.ArticleSection }))
);
const AiChat = lazy(() =>
  import('./components/AiChat').then((m) => ({ default: m.AiChat }))
);

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const EMAIL = '921693422@qq.com';
const SOCIALS = [
  { id: 'github', zh: 'GitHub', en: 'GitHub', href: 'https://github.com/avabbbb' },
  {
    id: 'bilibili',
    zh: 'B站',
    en: 'Bilibili',
    href: 'https://space.bilibili.com/1314275776',
  },
  {
    id: 'xhs',
    zh: '小红书',
    en: 'RedNote',
    href: 'https://www.xiaohongshu.com/user/profile/5ef7232b00000000010069bf',
  },
];

const CASE_SLUGS = ['flovart', 'cpa', 'offeru'] as const;
type CaseSlug = (typeof CASE_SLUGS)[number];

/** Agent project id → case study route. Everything else → archive detail. */
const PROJECT_ROUTE: Record<string, string> = {
  dev0: '/work/cpa',
  dev1: '/work/flovart',
  dev2: '/work/offeru',
};
const PROJECT_CATEGORY_PATH: Record<string, string> = {
  dev3: '/portfolio/dev/dev3',
  v3: '/portfolio/motion/v3',
  v1: '/portfolio/motion/v1',
};

const PAGE_TITLES: Record<string, { zh: string; en: string }> = {
  home: { zh: 'AVABBBB — AIGC 创意工程师', en: 'AVABBBB — AIGC Creative Engineer' },
  work: { zh: '作品案例 — AVABBBB', en: 'Case Study — AVABBBB' },
  portfolio: { zh: '作品集 — AVABBBB', en: 'Archive — AVABBBB' },
  articles: { zh: '文章 — AVABBBB', en: 'Journal — AVABBBB' },
  about: { zh: '关于 — AVABBBB', en: 'About — AVABBBB' },
  contact: { zh: '联系 — AVABBBB', en: 'Contact — AVABBBB' },
  notFound: { zh: '页面未找到 — AVABBBB', en: 'Page not found — AVABBBB' },
};

function titleKeyFor(pathname: string): keyof typeof PAGE_TITLES {
  if (pathname === '/' || pathname === '/home') return 'home';
  if (pathname.startsWith('/work/')) return 'work';
  if (pathname.startsWith('/portfolio')) return 'portfolio';
  if (pathname.startsWith('/articles')) return 'articles';
  if (pathname === '/about') return 'about';
  if (pathname === '/contact') return 'contact';
  return 'notFound';
}

/* ------------------------------------------------------------------ */
/* Scroll + focus manager                                               */
/* ------------------------------------------------------------------ */

function ScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(new Map<string, number>());
  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);
  useLayoutEffect(() => {
    let raf = 0;
    let ready = false;
    let attempts = 0;
    const target = navigationType === 'POP' ? positions.current.get(location.key) ?? 0 : 0;
    const remember = () => { if (ready) positions.current.set(location.key, window.scrollY); };
    const leaving = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest('a');
      if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.target === '_blank') return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin === window.location.origin && destination.pathname !== location.pathname) {
        remember(); ready = false;
      }
    };
    const restore = () => {
      if (location.hash) {
        const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (!el && attempts++ < 90) { raf = requestAnimationFrame(restore); return; }
        el?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      } else {
        if (document.documentElement.scrollHeight - window.innerHeight < target && attempts++ < 90) {
          raf = requestAnimationFrame(restore); return;
        }
        window.scrollTo({ top: target, behavior: 'instant' });
        document.getElementById('main-content')?.focus({ preventScroll: true });
      }
      ready = true;
    };
    raf = requestAnimationFrame(restore);
    window.addEventListener('scroll', remember, { passive: true });
    document.addEventListener('click', leaving, true);
    return () => { ready = false; cancelAnimationFrame(raf); window.removeEventListener('scroll', remember); document.removeEventListener('click', leaving, true); };
  }, [location.key, location.pathname, location.hash, navigationType]);
  return null;
}

/* ------------------------------------------------------------------ */
/* Header                                                               */
/* ------------------------------------------------------------------ */

interface HeaderProps {
  language: Language;
  editorMode: boolean;
  onBrandClick: (e: React.MouseEvent) => void;
  onOpenAiChat: () => void;
  onToggleLanguage: () => void;
}

const SiteHeader: React.FC<HeaderProps> = ({
  language,
  editorMode,
  onBrandClick,
  onOpenAiChat,
  onToggleLanguage,
}) => {
  const zh = language === 'zh';
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navId = 'site-nav';

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  // Escape closes menu and returns focus to the trigger
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const navItems = [
    { to: '/#work', zh: '作品', en: 'Work' },
    { to: '/#about', zh: '关于', en: 'About' },
    { to: '/articles', zh: '文章', en: 'Journal' },
  ];

  const isActive = (to: string) => {
    if (to === '/articles') return location.pathname.startsWith('/articles');
    if (to === '/#work')
      return (
        (location.pathname === '/' || location.pathname === '/home') &&
        location.hash === '#work'
      ) || location.pathname.startsWith('/work/');
    if (to === '/#about')
      return location.pathname === '/about' || location.hash === '#about';
    return false;
  };

  return (
    <header className="site-header page-width">
      <Link
        to="/"
        className="site-brand"
        aria-label="AVABBBB — home"
        onClick={onBrandClick}
      >
        <i aria-hidden="true" />
        AVABBBB
        {editorMode && (
          <span className="editor-indicator" role="status">
            {zh ? '编辑模式' : 'Editing'}
          </span>
        )}
      </Link>

      <nav
        id={navId}
        className={`site-nav${menuOpen ? ' is-open' : ''}`}
        aria-label={zh ? '主导航' : 'Primary'}
      >
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            aria-current={isActive(item.to) ? 'page' : undefined}
          >
            {zh ? item.zh : item.en}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => {
            setMenuOpen(false);
            onOpenAiChat();
          }}
          aria-label={zh ? '打开 AI 导览' : 'Open AI Guide'}
        >
          {zh ? 'AI 导览' : 'AI Guide'}
        </button>
      </nav>

      <div className="header-actions">
        <button
          type="button"
          className="language-switch"
          onClick={onToggleLanguage}
          aria-label={zh ? 'Switch to English' : '切换为中文'}
        >
          {zh ? 'EN' : '中文'}
        </button>
        <Link to="/#contact" className="header-contact">
          {zh ? '打个招呼' : 'Say hello'}
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
        <button
          ref={toggleRef}
          type="button"
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls={navId}
          aria-label={zh ? (menuOpen ? '关闭菜单' : '打开菜单') : menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
};

/* ------------------------------------------------------------------ */
/* Home sections                                                        */
/* ------------------------------------------------------------------ */

const AboutSection: React.FC<{ language: Language }> = ({ language }) => {
  const zh = language === 'zh';
  return (
    <section id="about" className="home-about" aria-labelledby="about-heading">
      <div className="page-width">
        <p className="eyebrow">{zh ? '关于' : 'About'}</p>
        <div className="home-about-grid">
          <h2 id="about-heading" className="home-about-lede">
            {zh ? (
              <>
                先做创作者，
                <br />
                <span className="serif">再做工具。</span>
              </>
            ) : (
              <>
                A creator first,
                <br />
                <span className="serif">then a toolmaker.</span>
              </>
            )}
          </h2>
          <div>
            <div className="home-about-body">
              {zh ? (
                <>
                  <p>
                    我是 AVABBBB，AIGC 方向的产研工程师。白天在珠三角一家央企做 AI 技术产品，
                    业余时间把生成式 AI 真正用进自己的创作流水线：写脚本、跑工作流、
                    做二创视频，再把踩过的坑沉淀成开源工具和复盘文章。
                  </p>
                  <p>
                    做过的事包括：为 52K Star 的 CLIProxyAPI 提交上游修复并进入正式
                    release；从 0 到 1 搭建本地优先的 AI 视频制作系统 Flovart；
                    做求职辅助 Agent OfferU；也接过米哈游官方的二创视频约稿。
                    华南师范大学软件工程本科毕业。
                  </p>
                </>
              ) : (
                <>
                  <p>
                    I&apos;m AVABBBB, an engineer working on AIGC products. By day I build
                    AI tech products at a Pearl River Delta state-owned enterprise;
                    after hours I put
                    scripts, running workflows, making fan videos — then turning the
                    lessons into open-source tools and write-ups.
                  </p>
                  <p>
                    Highlights: upstream fixes merged into the 52K-star CLIProxyAPI
                    release; Flovart, a local-first AI video production system built
                    from scratch; OfferU, a job-hunting agent; and an official
                    commissioned fan video for miHoYo. B.Eng. in Software
                    Engineering, SCNU.
                  </p>
                </>
              )}
            </div>
            <ul className="home-about-links">
              <li>
                <Link to="/work/flovart">
                  <span>{zh ? 'Flovart — AI 视频制作系统' : 'Flovart — AI video system'}</span>
                  <span>/work/flovart</span>
                </Link>
              </li>
              <li>
                <Link to="/work/cpa">
                  <span>{zh ? 'CLIProxyAPI 开源贡献' : 'CLIProxyAPI contribution'}</span>
                  <span>/work/cpa</span>
                </Link>
              </li>
              <li>
                <Link to="/work/offeru">
                  <span>{zh ? 'OfferU — 求职 Agent' : 'OfferU — job-hunting agent'}</span>
                  <span>/work/offeru</span>
                </Link>
              </li>
              <li>
                <Link to="/portfolio/motion/v3">
                  <span>{zh ? '米哈游约稿 · 创作者作品' : 'miHoYo commission · creator work'}</span>
                  <span>/portfolio/motion/v3</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

const ContactSection: React.FC<{ language: Language }> = ({ language }) => {
  const zh = language === 'zh';
  return (
    <section id="contact" className="contact-stage" aria-labelledby="contact-heading">
      <div className="page-width">
        <p className="eyebrow">{zh ? '联系' : 'Contact'}</p>
        <h2 id="contact-heading" className="contact-heading">
          {zh ? (
            <>
              有些想法
              <br />
              <span className="serif">想聊聊？</span>
            </>
          ) : (
            <>
              Have something
              <br />
              <span className="serif">in mind?</span>
            </>
          )}
        </h2>
        <div className="contact-links">
          <a className="text-link contact-email" href={`mailto:${EMAIL}`}>
            <span>{EMAIL}</span>
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
          <div className="contact-socials">
            {SOCIALS.map((s) => (
              <a key={s.id} href={s.href} target="_blank" rel="noreferrer noopener">
                {zh ? s.zh : s.en}
                <ArrowUpRight size={12} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const SiteFooter: React.FC<{ language: Language }> = ({ language }) => {
  const zh = language === 'zh';
  return (
    <footer className="site-footer page-width">
      <span>©{new Date().getFullYear()} AVABBBB</span>
      <span>{zh ? '先用 AI 创作，再为创作做工具' : 'Create with AI, then build tools for it'}</span>
      <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
    </footer>
  );
};

/* ------------------------------------------------------------------ */
/* Pages                                                                */
/* ------------------------------------------------------------------ */

const HomePage: React.FC<{ language: Language }> = ({ language }) => (
  <>
    <HeroSection language={language} />
    {/* torn-paper seam: the hero rips off into the work field */}
    <div className="torn-edge" aria-hidden="true" />
    <SelectedWork language={language} />
    <div className="torn-edge torn-edge--flip" aria-hidden="true" />
    <AboutSection language={language} />
    <ContactSection language={language} />
  </>
);

const WorkRoute: React.FC<{ language: Language }> = ({ language }) => {
  const location = useLocation();
  const slug = location.pathname.split('/')[2] as CaseSlug | undefined;
  if (!slug || !CASE_SLUGS.includes(slug)) return <NotFound embedded />;
  return (
    <Suspense fallback={<div className="page-loader">{language === 'zh' ? '加载中…' : 'Loading…'}</div>}>
      <CaseStudy slug={slug} language={language} />
    </Suspense>
  );
};

/** Old bookmarked dev detail URLs → their new case study. */
const LegacyProjectRedirect: React.FC = () => {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  const id = parts[2] ? decodeURIComponent(parts[2]) : '';
  const target = PROJECT_ROUTE[id] ?? PROJECT_CATEGORY_PATH[id];
  if (target) return <Navigate to={target} replace />;
  // Unknown /portfolio/<cat>/<id> falls through to the archive, which
  // renders its own not-found state for stale ids.
  return null;
};

/* ------------------------------------------------------------------ */
/* Shell                                                                */
/* ------------------------------------------------------------------ */

function Shell() {
  const { language, toggleLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [editorMode, setEditorMode] = useState(false);
  const logoClickCountRef = useRef(0);
  const logoClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiChatMounted, setAiChatMounted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);

  useEffect(() => {
    setUnlocked(isUiUnlocked());
  }, []);

  const openAiChat = useCallback(() => {
    setAiChatMounted(true);
    setIsAiChatOpen(true);
  }, []);

  const handleRequestUnlock = useCallback(() => setUnlockModalOpen(true), []);
  const handleUnlockSubmit = useCallback(async (input: string) => {
    const ok = await requestUnlock(input);
    if (ok) {
      setUiUnlocked();
      setUnlocked(true);
      setUnlockModalOpen(false);
      return true;
    }
    return false;
  }, []);

  /* 4 rapid brand clicks toggle editor mode; normal single click still
     navigates home. */
  const handleBrandClick = useCallback((e: React.MouseEvent) => {
    logoClickCountRef.current += 1;
    if (logoClickTimerRef.current) clearTimeout(logoClickTimerRef.current);

    if (logoClickCountRef.current >= 4) {
      e.preventDefault();
      setEditorMode((prev) => !prev);
      logoClickCountRef.current = 0;
      return;
    }
    logoClickTimerRef.current = setTimeout(() => {
      logoClickCountRef.current = 0;
    }, 1200);
  }, []);

  /* AI guide → project navigation */
  const handleNavigateToProject = useCallback(
    (projectId: string) => {
      const target = PROJECT_ROUTE[projectId] ?? PROJECT_CATEGORY_PATH[projectId];
      if (target) {
        navigate(target);
      } else {
        navigate(`/portfolio/dev/${encodeURIComponent(projectId)}`);
      }
      setIsAiChatOpen(false);
    },
    [navigate]
  );

  const handleNavigateToPortfolio = useCallback(() => {
    navigate('/portfolio');
    setIsAiChatOpen(false);
  }, [navigate]);

  /* Per-route document title */
  useEffect(() => {
    const key = titleKeyFor(location.pathname);
    document.title = PAGE_TITLES[key][language];
  }, [location.pathname, language]);

  return (
    <>
      <a href="#main-content" className="skip-link">
        {language === 'zh' ? '跳到主要内容' : 'Skip to content'}
      </a>
      <ScrollManager />
      <SiteHeader
        language={language}
        editorMode={editorMode}
        onBrandClick={handleBrandClick}
        onOpenAiChat={openAiChat}
        onToggleLanguage={toggleLanguage}
      />

      <main id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<HomePage language={language} />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/work/:slug" element={<WorkRoute language={language} />} />

          {/* Old bookmarks: /portfolio/dev/dev0|1|2 → case studies */}
          <Route
            path="/portfolio/dev/:id"
            element={
              <LegacyProjectRedirectOrArchive
                language={language}
                editorMode={editorMode}
                unlocked={unlocked}
                onRequestUnlock={handleRequestUnlock}
              />
            }
          />
          <Route
            path="/portfolio/*"
            element={
              <PortfolioSection
                language={language}
                editorMode={editorMode}
                unlocked={unlocked}
                onRequestUnlock={handleRequestUnlock}
              />
            }
          />
          <Route
            path="/articles/*"
            element={
              <Suspense fallback={<div className="page-loader">{language === 'zh' ? '加载中…' : 'Loading…'}</div>}>
                <ArticleSection language={language} editorMode={editorMode} />
              </Suspense>
            }
          />

          <Route
            path="/about"
            element={
              <div className="focused-page">
                <AboutSection language={language} />
              </div>
            }
          />
          <Route
            path="/contact"
            element={
              <div className="focused-page">
                <ContactSection language={language} />
              </div>
            }
          />
          <Route path="/resume" element={<Navigate to="/about" replace />} />
          <Route path="*" element={<NotFound embedded />} />
        </Routes>
      </main>

      <SiteFooter language={language} />

      {aiChatMounted && (
        <Suspense fallback={null}>
          <AiChat
            isOpen={isAiChatOpen}
            onClose={() => setIsAiChatOpen(false)}
            language={language}
            onNavigateToPortfolio={handleNavigateToPortfolio}
            onNavigateToProject={handleNavigateToProject}
          />
        </Suspense>
      )}

      <UnlockModal
        isOpen={unlockModalOpen}
        language={language}
        onClose={() => setUnlockModalOpen(false)}
        onSubmit={handleUnlockSubmit}
      />
    </>
  );
}

/** Renders archive for unknown ids, redirects the three case-bound ids. */
const LegacyProjectRedirectOrArchive: React.FC<{
  language: Language;
  editorMode: boolean;
  unlocked: boolean;
  onRequestUnlock: () => void;
}> = ({ language, editorMode, unlocked, onRequestUnlock }) => {
  const location = useLocation();
  const id = decodeURIComponent(location.pathname.split('/')[3] ?? '');
  if (PROJECT_ROUTE[id]) return <Navigate to={PROJECT_ROUTE[id]} replace />;
  return (
    <PortfolioSection
      language={language}
      editorMode={editorMode}
      unlocked={unlocked}
      onRequestUnlock={onRequestUnlock}
    />
  );
};

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LanguageProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <ErrorBoundary>
            <Shell />
          </ErrorBoundary>
        </BrowserRouter>
      </LanguageProvider>
    </MotionConfig>
  );
}
