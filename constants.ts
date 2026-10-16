import { Category, Project, Language } from './types';
import { PROJECT_DATA } from './src/data/projects';

export const CATEGORY_LABELS: Record<Language, Record<string, string>> = {
  zh: {
    'All': '全部',
    'Motion': '动态影像',
    'Development': '应用开发'
  },
  en: {
    'All': 'All',
    'Motion': 'Media',
    'Development': 'Dev'
  }
};

export const PROJECTS: Record<Language, Project[]> = {
  zh: PROJECT_DATA.map((p): Project => ({
    id: p.id,
    ...p.common,
    ...p.zh,
    bilingualTitle: {
      zh: p.zh.title,
      en: p.en.title
    }
  })),
  en: PROJECT_DATA.map((p): Project => ({
    id: p.id,
    ...p.common,
    ...p.en,
    bilingualTitle: {
      zh: p.zh.title,
      en: p.en.title
    }
  }))
};
