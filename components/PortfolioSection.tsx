import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { PROJECTS, CATEGORY_LABELS } from '../constants';
import { Category, Language, Project, ContentSection } from '../types';
import { ArrowLeft, ArrowRight, ArrowUpRight, Lock, Pencil, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProjectEditor, EditableProject, createEmptyProject } from './ProjectEditor';
import { toJsDelivr } from '../src/utils/cdn';
import { lockedVideoUrl } from '../src/utils/unlock';
import './archive.css';

/* ------------------------------------------------------------------ */
/* Types & URL mapping                                                  */
/* ------------------------------------------------------------------ */

interface PortfolioSectionProps {
  language: Language;
  editorMode?: boolean;
  unlocked?: boolean;
  onRequestUnlock?: () => void;
}

const FILTER_ITEMS = [
  { id: 'All' as const, labelZh: '全部', labelEn: 'All', urlPath: 'all' },
  { id: Category.VIDEO, labelZh: '动态影像', labelEn: 'Media', urlPath: 'motion' },
  { id: Category.DEV, labelZh: '应用开发', labelEn: 'Dev', urlPath: 'dev' },
];

const URL_TO_CATEGORY: Record<string, string> = {
  all: 'All',
  motion: Category.VIDEO,
  dev: Category.DEV,
};

const CATEGORY_TO_URL: Record<string, string> = {
  All: 'all',
  [Category.VIDEO]: 'motion',
  [Category.DEV]: 'dev',
};

/** ArticleCategory enum value → article folder id (must match articleLoader). */
const ARTICLE_FOLDER: Record<string, string> = {
  Flovart: 'aiexploration',
  AIExploration: 'aiexploration',
  VideoCreation: 'fancreation',
  ProjectExperience: 'projectexperience',
  LearningReflection: 'learningreflection',
};

/* ------------------------------------------------------------------ */
/* Small primitives                                                     */
/* ------------------------------------------------------------------ */

const T = (language: Language) => (zh: string, en: string) =>
  language === 'zh' ? zh : en;

/* Locked video placeholder — never exposes the real source */
const LockedVideo: React.FC<{ language: Language; cover?: string; onUnlock?: () => void }> = ({
  language,
  cover,
  onUnlock,
}) => {
  const t = T(language);
  return (
    <div className="ar-locked">
      {cover && <img src={cover} alt="" referrerPolicy="no-referrer" aria-hidden="true" />}
      <div className="ar-locked-inner">
        <Lock size={22} aria-hidden="true" />
        <p className="ar-locked-title">{t('此视频已加密', 'This video is locked')}</p>
        <p className="ar-locked-note">
          {t(
            '为保护合作方信息，该视频加密存储，需凭作者线下提供的凭据解锁查看。',
            'To protect partner info, this video is encrypted. Unlock with the credential provided by the author.'
          )}
        </p>
        <button type="button" className="ar-btn" onClick={onUnlock}>
          <Lock size={13} aria-hidden="true" />
          {t('验证身份解锁', 'Verify to unlock')}
        </button>
      </div>
    </div>
  );
};

/* Plain image — lazy, no retry loops */
const Img: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => (
  <img src={src} alt={alt} className={className} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
);

/* ------------------------------------------------------------------ */
/* Lightbox — native <dialog>, focus restore, Esc + arrows              */
/* ------------------------------------------------------------------ */

const Lightbox: React.FC<{
  images: string[];
  index: number;
  language: Language;
  onClose: () => void;
  onNavigate: (i: number) => void;
}> = ({ images, index, language, onClose, onNavigate }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const t = T(language);

  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement | null;
    const d = dialogRef.current;
    if (d && !d.open) d.showModal();
    return () => {
      restoreRef.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && images.length > 1) {
        e.preventDefault();
        onNavigate(index === 0 ? images.length - 1 : index - 1);
      }
      if (e.key === 'ArrowRight' && images.length > 1) {
        e.preventDefault();
        onNavigate(index === images.length - 1 ? 0 : index + 1);
      }
    };
    d.addEventListener('cancel', onCancel);
    window.addEventListener('keydown', onKey);
    return () => {
      d.removeEventListener('cancel', onCancel);
      window.removeEventListener('keydown', onKey);
    };
  }, [index, images.length, onClose, onNavigate]);

  const onBackdrop = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="ar-lightbox"
      aria-label={t('图片预览', 'Image preview')}
      aria-modal="true"
      onClick={onBackdrop}
    >
      <img src={toJsDelivr(images[index])} alt={t('预览', 'Preview')} referrerPolicy="no-referrer" />
      <button
        type="button"
        className="ar-lightbox-btn ar-lightbox-close"
        aria-label={t('关闭', 'Close')}
        onClick={onClose}
      >
        <X size={18} aria-hidden="true" />
      </button>
      {images.length > 1 && (
        <>
          <button
            type="button"
            className="ar-lightbox-btn ar-lightbox-prev"
            aria-label={t('上一张', 'Previous')}
            onClick={() => onNavigate(index === 0 ? images.length - 1 : index - 1)}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="ar-lightbox-btn ar-lightbox-next"
            aria-label={t('下一张', 'Next')}
            onClick={() => onNavigate(index === images.length - 1 ? 0 : index + 1)}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
          <span className="ar-lightbox-counter" aria-live="polite">
            {index + 1} / {images.length}
          </span>
        </>
      )}
    </dialog>
  );
};

/* ------------------------------------------------------------------ */
/* Content sections renderer                                            */
/* ------------------------------------------------------------------ */

const SectionBlock: React.FC<{
  section: ContentSection;
  language: Language;
  onOpenLightbox: (images: string[], index: number) => void;
}> = ({ section, language, onOpenLightbox }) => {
  const t = T(language);
  return (
    <section className="ar-section" aria-label={section.hideTitle ? undefined : section.title}>
      {!section.hideTitle && <h2 className="ar-section-title">{section.title}</h2>}

      {section.type === 'text' && (
        <div className="ar-body">
          <p>{section.content}</p>
        </div>
      )}

      {section.type === 'gallery' && (
        <div className={`ar-gallery ar-gallery--${section.layout || 'grid-4'}`}>
          {section.images.map((img, j) => (
            <button
              key={j}
              type="button"
              className="ar-gallery-item sticker"
              style={{ '--tilt': `${[-2, 1.5, -1.2, 2][j % 4]}deg` } as React.CSSProperties}
              onClick={() => onOpenLightbox(section.images, j)}
              aria-label={t(`查看大图 ${j + 1}`, `View image ${j + 1}`)}
            >
              <Img src={toJsDelivr(img)} alt="" />
            </button>
          ))}
        </div>
      )}

      {section.type === 'video' && (
        <figure className="ar-media">
          <div className="ar-media-frame">
            {section.videoUrl ? (
              <video src={toJsDelivr(section.videoUrl)} controls playsInline />
            ) : section.youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${section.youtubeId}`}
                title={section.title || t('作品视频', 'Project video')}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : section.bilibiliId ? (
              <iframe
                src={`https://player.bilibili.com/player.html?bvid=${section.bilibiliId}&page=1&danmaku=0&high_quality=1`}
                title={section.title || t('作品视频', 'Project video')}
                allowFullScreen
              />
            ) : null}
          </div>
        </figure>
      )}

      {section.type === 'demo' && (
        <figure className="ar-media">
          <iframe
            className="ar-demo"
            src={section.demoUrl}
            style={{ height: section.height ?? 560 }}
            loading="lazy"
            title={section.title || t('演示', 'Demo')}
          />
        </figure>
      )}
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Project detail                                                       */
/* ------------------------------------------------------------------ */

const ProjectDetail: React.FC<{
  project: Project;
  language: Language;
  unlocked: boolean;
  onRequestUnlock?: () => void;
  onOpenLightbox: (images: string[], index: number) => void;
}> = ({ project, language, unlocked, onRequestUnlock, onOpenLightbox }) => {
  const t = T(language);
  const isLocked = !!project.locked;
  const showLocked = isLocked && !unlocked;

  const hasPrimaryMedia = isLocked
    ? !!project.videoId
    : !!(project.videoUrl || project.bilibiliId || project.youtubeId || project.videoLinkUrl);

  const mediaTitle =
    project.videoLinkTitle ||
    t(
      project.videoUrl || project.bilibiliId || project.youtubeId ? '作品视频' : '相关链接',
      project.videoUrl || project.bilibiliId || project.youtubeId ? 'Video' : 'Link'
    );

  return (
    <article>
      {/* Header */}
      <p className="ar-eyebrow">
        <span>{CATEGORY_LABELS[language][project.category]}</span>
        {project.date && <span>· {project.date}</span>}
        {showLocked && (
          <span className="ar-row-lock">
            <Lock size={10} aria-hidden="true" />
            {t('加密', 'Locked')}
          </span>
        )}
      </p>
      <h1 className="ar-detail-title">{project.title}</h1>
      {project.subtitle && (
        <p className="ar-sub" style={{ marginBottom: '1.6rem' }}>{project.subtitle}</p>
      )}

      {/* Compact metadata */}
      <dl className="ar-detail-meta">
        {project.role && (
          <div>
            <dt>{t('担任角色', 'Role')}</dt>
            <dd>{project.role}</dd>
          </div>
        )}
        {project.tags?.length > 0 && (
          <div>
            <dt>{t('标签', 'Tags')}</dt>
            <dd>{project.tags.join(', ')}</dd>
          </div>
        )}
        {project.awards?.length > 0 && (
          <div>
            <dt>{t('获奖', 'Awards')}</dt>
            <dd>
              {project.awards.map((a, i) => (
                <span key={i} style={{ display: 'block' }}>{a}</span>
              ))}
            </dd>
          </div>
        )}
        {project.notes && (
          <div>
            <dt>{t('批注', 'Notes')}</dt>
            <dd style={{ whiteSpace: 'pre-line' }}>{project.notes}</dd>
          </div>
        )}
      </dl>

      {/* External links */}
      {(project.figmaUrl || project.websiteUrl || project.githubUrl || project.videoLinkUrl || project.articleCategory || project.hdVideoUrl) && (
        <nav className="ar-detail-links" aria-label={t('外部链接', 'External links')}>
          {project.articleCategory && (
            <Link className="ar-text-link" to={`/articles/${ARTICLE_FOLDER[project.articleCategory] || project.articleCategory}`}>
              Dev Log <ArrowUpRight size={12} aria-hidden="true" />
            </Link>
          )}
          {project.figmaUrl && (
            <a className="ar-text-link" href={project.figmaUrl} target="_blank" rel="noopener noreferrer">
              Figma <ArrowUpRight size={12} aria-hidden="true" />
            </a>
          )}
          {project.websiteUrl && (
            <a className="ar-text-link" href={project.websiteUrl} target="_blank" rel="noopener noreferrer">
              {t('网站', 'Website')} <ArrowUpRight size={12} aria-hidden="true" />
            </a>
          )}
          {project.githubUrl && (
            <a className="ar-text-link" href={project.githubUrl} target="_blank" rel="noopener noreferrer">
              GitHub <ArrowUpRight size={12} aria-hidden="true" />
            </a>
          )}
          {project.videoLinkUrl && !hasPrimaryMedia && (
            <a className="ar-text-link" href={project.videoLinkUrl} target="_blank" rel="noopener noreferrer">
              {project.videoLinkTitle || t('观看', 'Watch')} <ArrowUpRight size={12} aria-hidden="true" />
            </a>
          )}
          {project.hdVideoUrl && !showLocked && (
            <a className="ar-text-link" href={project.hdVideoUrl} target="_blank" rel="noopener noreferrer">
              {t('下载 1080P', '1080P')} <ArrowUpRight size={12} aria-hidden="true" />
            </a>
          )}
        </nav>
      )}

      {/* Description */}
      {project.description && (
        <div className="ar-body" style={{ marginBottom: 'clamp(2rem,4vw,3rem)' }}>
          <p>{project.description}</p>
        </div>
      )}

      {/* Concept (legacy) */}
      {project.concept && (
        <section className="ar-section">
          <h2 className="ar-section-title">{t('设计理念', 'Concept')}</h2>
          <div className="ar-body"><p>{project.concept}</p></div>
        </section>
      )}

      {/* Primary media */}
      {hasPrimaryMedia && (
        <section className="ar-section">
          <h2 className="ar-section-title">{mediaTitle}</h2>
          {showLocked ? (
            <LockedVideo
              language={language}
              cover={project.image ? toJsDelivr(project.image) : undefined}
              onUnlock={onRequestUnlock}
            />
          ) : project.videoLinkUrl && !project.videoUrl && !project.bilibiliId && !project.youtubeId && !(isLocked && project.videoId) ? (
            <a
              className="ar-text-link"
              href={project.videoLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '13px' }}
            >
              {project.videoLinkTitle || t('观看作品', 'Watch')} <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          ) : (
            <figure className="ar-media">
              <div className="ar-media-frame">
                {isLocked && project.videoId ? (
                  <video
                    src={lockedVideoUrl(project.videoId)}
                    controls
                    playsInline
                    poster={project.image ? toJsDelivr(project.image) : undefined}
                    onError={() => onRequestUnlock?.()}
                  />
                ) : project.videoUrl ? (
                  <video
                    src={toJsDelivr(project.videoUrl)}
                    controls
                    playsInline
                    poster={project.image ? toJsDelivr(project.image) : undefined}
                  />
                ) : project.youtubeId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${project.youtubeId}`}
                    title={mediaTitle}
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : project.bilibiliId ? (
                  <iframe
                    src={`https://player.bilibili.com/player.html?bvid=${project.bilibiliId}&page=1&danmaku=0&high_quality=1`}
                    title={mediaTitle}
                    allowFullScreen
                  />
                ) : null}
              </div>
            </figure>
          )}
        </section>
      )}

      {/* Custom content sections */}
      {project.sections?.map((section, i) => (
        <SectionBlock
          key={i}
          section={section}
          language={language}
          onOpenLightbox={onOpenLightbox}
        />
      ))}

      {/* Gallery (legacy field) */}
      {project.gallery && project.gallery.length > 0 && (
        <section className="ar-section">
          <h2 className="ar-section-title">{t('作品图库', 'Gallery')}</h2>
          <div className="ar-gallery">
            {project.gallery.map((img, i) => (
              <button
                key={i}
                type="button"
                className="ar-gallery-item"
                onClick={() => onOpenLightbox(project.gallery!, i)}
                aria-label={t(`查看大图 ${i + 1}`, `View image ${i + 1}`)}
              >
                <Img src={toJsDelivr(img)} alt="" />
              </button>
            ))}
          </div>
        </section>
      )}
    </article>
  );
};

/* ------------------------------------------------------------------ */
/* Archive index                                                        */
/* ------------------------------------------------------------------ */

const ArchiveIndex: React.FC<{
  projects: Project[];
  language: Language;
  filter: string;
  onFilter: (f: string) => void;
  unlocked: boolean;
}> = ({ projects, language, filter, onFilter, unlocked }) => {
  const t = T(language);
  const all = projects;
  const filtered = filter === 'All' ? all : all.filter(p => p.category === filter);

  const countFor = (id: string) =>
    id === 'All' ? all.length : all.filter(p => p.category === id).length;

  return (
    <div>
      {/* Category filter */}
      <div className="ar-filters" role="navigation" aria-label={t('作品分类', 'Categories')}>
        {FILTER_ITEMS.map(item => (
          <button
            key={item.id}
            type="button"
            className="ar-filter"
            aria-current={filter === item.id}
            onClick={() => onFilter(item.id)}
          >
            {language === 'zh' ? item.labelZh : item.labelEn}
            <span className="ar-filter-count">{countFor(item.id)}</span>
          </button>
        ))}
      </div>

      {/* Rows */}
      {filtered.length > 0 ? (
        <ul className="ar-index">
          {filtered.map(project => (
            <li key={project.id}>
              <Link
                to={`/portfolio/${CATEGORY_TO_URL[project.category] || 'all'}/${encodeURIComponent(project.id)}`}
                className="ar-row"
              >
                <span className="ar-thumb">
                  {project.image ? (
                    <Img src={toJsDelivr(project.image)} alt={project.title} />
                  ) : (
                    <span className="ar-thumb-fallback" aria-hidden="true">
                      {project.title.charAt(0)}
                    </span>
                  )}
                </span>
                <span className="ar-row-body">
                  <span className="ar-row-kicker">
                    <span>{CATEGORY_LABELS[language][project.category]}</span>
                    {project.date && <span>· {project.date}</span>}
                    {project.locked && !unlocked && (
                      <span className="ar-row-lock">
                        <Lock size={10} aria-hidden="true" />
                        {t('加密', 'Locked')}
                      </span>
                    )}
                  </span>
                  <h3 className="ar-row-title">
                    {project.title}
                    <span className="ar-arrow" aria-hidden="true">→</span>
                  </h3>
                  {project.subtitle && <p className="ar-row-sub">{project.subtitle}</p>}
                  <span className="ar-row-meta">
                    {project.role && <span>{project.role}</span>}
                    {project.tags?.slice(0, 3).map(tag => <span key={tag}>{tag}</span>)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="ar-empty">
          <p className="ar-empty-code">{t('空分类', 'Empty category')}</p>
          <h2 className="ar-empty-title">
            {t('此分类暂无作品', 'No works in this category')}
          </h2>
          <p className="ar-empty-note">
            {t('切换到其他分类查看，或返回全部作品。', 'Try another category, or return to all works.')}
          </p>
          <button type="button" className="ar-btn ar-btn--ghost" onClick={() => onFilter('All')}>
            {t('查看全部', 'View all')}
          </button>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Not found                                                            */
/* ------------------------------------------------------------------ */

const NotFoundState: React.FC<{ language: Language; kind: 'category' | 'project' }> = ({
  language,
  kind,
}) => {
  const t = T(language);
  return (
    <div className="ar-empty" style={{ paddingTop: 'clamp(2rem,6vw,4rem)' }}>
      <p className="ar-empty-code">404 / {t('未找到', 'Not found')}</p>
      <h2 className="ar-empty-title">
        {kind === 'category'
          ? t('分类不存在', 'Category not found')
          : t('作品不存在', 'Work not found')}
      </h2>
      <p className="ar-empty-note">
        {kind === 'category'
          ? t('这个分类路径不存在，返回作品集浏览全部作品。', 'This category path does not exist. Return to the archive.')
          : t('这个作品链接可能已失效，返回作品集浏览全部作品。', 'This work link may be outdated. Return to the archive.')}
      </p>
      <Link to="/portfolio" className="ar-btn ar-btn--ghost" style={{ textDecoration: 'none' }}>
        <ArrowLeft size={13} aria-hidden="true" />
        {t('返回作品集', 'Back to archive')}
      </Link>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Editor helpers                                                       */
/* ------------------------------------------------------------------ */

function projectToEditable(project: Project, language: Language): EditableProject {
  const otherLang = language === 'zh' ? 'en' : 'zh';
  const other = PROJECTS[otherLang].find(p => p.id === project.id);
  const pick = (lang: Language) => ({
    title: lang === language ? project.title : other?.title || '',
    subtitle: lang === language ? project.subtitle : other?.subtitle || '',
    description: lang === language ? project.description : other?.description || '',
    role: lang === language ? project.role : other?.role || '',
    tags: lang === language ? project.tags || [] : other?.tags || [],
    awards: lang === language ? project.awards || [] : other?.awards || [],
    sections: lang === language ? project.sections || [] : other?.sections || [],
  });
  return {
    id: project.id,
    common: {
      category: project.category,
      image: project.image,
      bilibiliId: project.bilibiliId,
      youtubeId: project.youtubeId,
      videoUrl: project.videoUrl,
      videoLinkUrl: project.videoLinkUrl,
      figmaUrl: project.figmaUrl,
      websiteUrl: project.websiteUrl,
      githubUrl: project.githubUrl,
      date: project.date,
      notes: project.notes,
    },
    zh: pick('zh'),
    en: pick('en'),
  };
}

/* ------------------------------------------------------------------ */
/* Main component                                                       */
/* ------------------------------------------------------------------ */

export const PortfolioSection = React.memo<PortfolioSectionProps>(({
  language,
  editorMode = false,
  unlocked = false,
  onRequestUnlock,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const t = T(language);

  /* URL is the single source of selection */
  const pathParts = location.pathname.split('/').filter(Boolean);
  const urlCategorySeg = pathParts[0] === 'portfolio' ? pathParts[1] : undefined;
  const urlProjectId = pathParts[0] === 'portfolio' ? pathParts[2] : undefined;

  const category = urlCategorySeg ? (URL_TO_CATEGORY[urlCategorySeg.toLowerCase()] ?? null) : 'All';
  const categoryExists = urlCategorySeg ? urlCategorySeg.toLowerCase() in URL_TO_CATEGORY : true;
  const decodedProjectId = urlProjectId ? decodeURIComponent(urlProjectId) : null;

  const currentProjects = PROJECTS[language];
  const selectedProject = decodedProjectId
    ? currentProjects.find(p => p.id === decodedProjectId) || null
    : null;
  const projectExists = !decodedProjectId || !!selectedProject;

  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const openLightbox = useCallback((images: string[], index: number) => {
    setLightbox({ images, index });
  }, []);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const navigateLightbox = useCallback((i: number) => {
    setLightbox(cur => cur ? { ...cur, index: i } : cur);
  }, []);

  const [isEditing, setIsEditing] = useState(false);
  const [editingProject, setEditingProject] = useState<EditableProject | null>(null);
  const [isNewProject, setIsNewProject] = useState(false);

  /* Scroll to top when entering detail */
  useEffect(() => {
    if (decodedProjectId) window.scrollTo({ top: 0 });
  }, [decodedProjectId]);

  const handleFilterChange = (newFilter: string) => {
    if (newFilter === 'All') navigate('/portfolio');
    else navigate(`/portfolio/${CATEGORY_TO_URL[newFilter] || 'all'}`);
  };

  const startEditing = (project: Project) => {
    setEditingProject(projectToEditable(project, language));
    setIsNewProject(false);
    setIsEditing(true);
  };

  const startNewProject = () => {
    setEditingProject(createEmptyProject(`new_${Date.now()}`));
    setIsNewProject(true);
    setIsEditing(true);
  };

  const handleSave = (_project: EditableProject) => {
    alert(t('请点击"导出JSON"复制数据，然后发给开发者更新代码', 'Please click "Export JSON" to copy data, then send to developer to update code'));
    setIsEditing(false);
    setEditingProject(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingProject(null);
  };

  /* Prev / next within same category */
  const detailNav = selectedProject ? (() => {
    const same = currentProjects.filter(p => p.category === selectedProject.category);
    const idx = same.findIndex(p => p.id === selectedProject.id);
    return {
      prev: idx > 0 ? same[idx - 1] : null,
      next: idx >= 0 && idx < same.length - 1 ? same[idx + 1] : null,
    };
  })() : { prev: null, next: null };

  const showEditor = isEditing && editingProject;
  const showNotFound = !categoryExists || (decodedProjectId && !projectExists);
  const showDetail = !showEditor && !showNotFound && !!selectedProject;
  const showIndex = !showEditor && !showNotFound && !selectedProject;

  return (
    <div className="ar-page">
      <div className="ar-width">
        {/* Page header */}
        <header className="ar-head">
          <p className="ar-eyebrow">
            <span>{t('作品集', 'Archive')}</span>
            <span>· {currentProjects.length} {t('个作品', 'works')}</span>
          </p>
          <h1 className="ar-title">
            {t('作品', 'Work')}
            <span className="ar-title-serif"> {t('集', '')}</span>
          </h1>
        </header>

        {/* Editor toolbar */}
        {editorMode && !showEditor && (
          <div className="ar-editor-bar">
            {selectedProject ? (
              <button type="button" className="ar-icon-btn" onClick={() => startEditing(selectedProject)}>
                <Pencil size={12} aria-hidden="true" />
                {t('编辑', 'Edit')}
              </button>
            ) : (
              <button type="button" className="ar-icon-btn" onClick={startNewProject}>
                <Plus size={12} aria-hidden="true" />
                {t('新建作品', 'New work')}
              </button>
            )}
          </div>
        )}

        {/* Body */}
        {showEditor ? (
          <div style={{ paddingTop: 'clamp(1.5rem,3vw,2.5rem)' }}>
            <ProjectEditor
              project={editingProject}
              language={language}
              onSave={handleSave}
              onCancel={handleCancel}
              isNew={isNewProject}
            />
          </div>
        ) : showNotFound ? (
          <NotFoundState language={language} kind={categoryExists ? 'project' : 'category'} />
        ) : showDetail && selectedProject ? (
          <div className="ar-detail">
            <button
              type="button"
              className="ar-detail-back"
              onClick={() => navigate(
                selectedProject.category === 'All'
                  ? '/portfolio'
                  : `/portfolio/${CATEGORY_TO_URL[selectedProject.category] || 'all'}`
              )}
            >
              <ArrowLeft size={14} aria-hidden="true" />
              {t('返回', 'Back')}
            </button>
            <ProjectDetail
              project={selectedProject}
              language={language}
              unlocked={unlocked}
              onRequestUnlock={onRequestUnlock}
              onOpenLightbox={openLightbox}
            />
            {(detailNav.prev || detailNav.next) && (
              <nav className="ar-detail-nav" aria-label={t('同类作品导航', 'Same-category navigation')}>
                {detailNav.prev ? (
                  <Link to={`/portfolio/${CATEGORY_TO_URL[detailNav.prev.category] || 'all'}/${encodeURIComponent(detailNav.prev.id)}`}>
                    <ArrowLeft size={13} aria-hidden="true" />
                    {detailNav.prev.title}
                  </Link>
                ) : <span />}
                {detailNav.next ? (
                  <Link to={`/portfolio/${CATEGORY_TO_URL[detailNav.next.category] || 'all'}/${encodeURIComponent(detailNav.next.id)}`}>
                    {detailNav.next.title}
                    <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                ) : <span />}
              </nav>
            )}
          </div>
        ) : showIndex ? (
          <div style={{ paddingTop: 'clamp(1.5rem,3vw,2.5rem)' }}>
            <ArchiveIndex
              projects={currentProjects}
              language={language}
              filter={category || 'All'}
              onFilter={handleFilterChange}
              unlocked={unlocked}
            />
          </div>
        ) : null}

        {/* Footer count */}
        <div className="ar-foot">
          <span>© 2026 AVABBBB</span>
          <span>{currentProjects.length} {t('个作品', 'works')}</span>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          language={language}
          onClose={closeLightbox}
          onNavigate={navigateLightbox}
        />
      )}
    </div>
  );
});
