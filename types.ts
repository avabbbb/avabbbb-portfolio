
export type Language = 'zh' | 'en';

export enum Category {
  ALL = 'All',
  VIDEO = 'Motion',
  DEV = 'Development',
  ARTICLE = 'Article'
}

export enum ArticleCategory {
  FLOVART = 'Flovart',
  VIDEOCREATION = 'VideoCreation',
  PROJECTEXPERIENCE = 'ProjectExperience',
  AIEXPLORATION = 'AIExploration',
}

export interface Article {
  id: string;
  title: string;
  category: ArticleCategory;
  link?: string; // WeChat Official Account Link (optional now)
  content?: string; // Markdown content for internal articles
  coverImage?: string; // Optional, will fallback if not provided
  date?: string;
}

// 自定义内容块类型
export type SectionType = 'text' | 'gallery' | 'video' | 'demo';

export interface TextSection {
  type: 'text';
  title: string;
  content: string;
  hideTitle?: boolean; // 隐藏标题，直接展示内容
}

export interface GallerySection {
  type: 'gallery';
  title: string;
  images: string[];
  layout?: 'grid-5' | 'grid-4' | 'grid-3' | 'grid-2' | 'full'; // 默认 grid-4，full 表示单张填满
  hideTitle?: boolean; // 隐藏标题，直接展示图片
}

export interface VideoSection {
  type: 'video';
  title: string;
  bilibiliId?: string;
  youtubeId?: string; // YouTube Video ID (e.g. JWq0vW7Y26Y)
  videoUrl?: string;
  videoId?: string; // 锁定视频在 R2 的对象 key(仅解锁后通过 /api/video 代理访问)
  hideTitle?: boolean; // 隐藏标题，直接展示视频
}

export interface DemoSection {
  type: 'demo';
  title: string;
  demoUrl: string;
  height?: number;
  hideTitle?: boolean; // 隐藏标题，直接展示演示
}

export type ContentSection = TextSection | GallerySection | VideoSection | DemoSection;

export interface Project {
  id: string;
  title: string;
  subtitle: string;
  category: Category;
  description: string;
  role: string;
  image: string; // URL placeholder (Cover/Thumbnail)
  videoUrl?: string; // URL to .mp4 file
  videoId?: string; // 锁定视频在 R2 的对象 key(仅解锁后通过 /api/video 代理访问)
  hdVideoUrl?: string; // High-definition video URL (e.g. R2 hosted 1080P)
  bilibiliId?: string; // Bilibili Video ID (e.g. BV1xx...)
  youtubeId?: string; // YouTube Video ID (e.g. JWq0vW7Y26Y)
  videoLinkUrl?: string; // External video link (YouTube, Bilibili page, etc.)
  videoLinkTitle?: string; // 作品视频链接块的标题（如"个人主页"、"作品展示"）
  figmaUrl?: string; // Figma File URL
  gallery?: string[]; // Additional images (URLs)
  externalLink?: string; // External link (e.g. Bilibili, Behance)
  tags: string[];
  // New detailed fields
  concept?: string;
  roleDetail?: string;
  awards?: string[]; // Array of award strings
  
  // Special field for placeholder UI
  bilingualTitle?: {
    zh: string;
    en: string;
  };

  websiteUrl?: string; // Online preview URL
  githubUrl?: string; // GitHub repository URL
  icon?: string; // Icon name for Dev projects
  
  // 新增字段
  date?: string; // 日期
  notes?: string; // 批注
  sections?: ContentSection[]; // 自定义内容块
  articleCategory?: ArticleCategory; // 关联的开发日志分类
  locked?: boolean; // 需要解锁码才能查看完整内容(如内部视频)
}

/** Source data before one locale is projected into the visitor-facing model. */
export type ProjectCommon = Pick<Project, 'category' | 'image'> & Partial<Pick<
  Project,
  | 'videoUrl'
  | 'videoId'
  | 'hdVideoUrl'
  | 'bilibiliId'
  | 'youtubeId'
  | 'videoLinkUrl'
  | 'figmaUrl'
  | 'gallery'
  | 'externalLink'
  | 'websiteUrl'
  | 'githubUrl'
  | 'icon'
  | 'date'
  | 'articleCategory'
  | 'locked'
>>;

export type ProjectTranslation = Pick<
  Project,
  'title' | 'subtitle' | 'description' | 'role' | 'tags'
> & Partial<Pick<
  Project,
  'concept' | 'roleDetail' | 'awards' | 'notes' | 'sections' | 'videoLinkTitle'
>>;

export interface ProjectSource {
  id: string;
  common: ProjectCommon;
  zh: ProjectTranslation;
  en: ProjectTranslation;
}

export interface Experience {
  id: string;
  year: string;
  title: string;
  institution: string;
  description: string;
  type: 'education' | 'work';
}

export interface Skill {
  name: string;
  level: number; // 0-100
  icon?: string;
}

export interface CompetitionGroup {
  level: string;
  awards: string[];
}

export interface HonorsData {
  scholarships: string[];
  titles: string[];
  competitions: CompetitionGroup[];
}
