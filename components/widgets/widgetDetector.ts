import { Language, Project } from '../../types';

export type WidgetType = 'profile' | 'projects' | 'contact' | 'skills' | null;

export interface ProjectDetailWidget {
  type: 'project-detail';
  projectId: string;
}

interface KeywordMap {
  [key: string]: WidgetType;
}

// 关键词映射表
const KEYWORDS: Record<Language, KeywordMap> = {
  zh: {
    // Profile 触发词
    '你是谁': 'profile',
    '介绍': 'profile',
    '自我介绍': 'profile',
    '个人信息': 'profile',
    '关于你': 'profile',
    '名片': 'profile',
    
    // Projects 触发词
    '作品': 'projects',
    '项目': 'projects',
    '代表作': 'projects',
    '案例': 'projects',
    '做过什么': 'projects',
    '有什么项目': 'projects',
    
    // Contact 触发词
    '联系': 'contact',
    '联系方式': 'contact',
    '怎么联系': 'contact',
    '邮箱': 'contact',
    '社交': 'contact',
    '找你': 'contact',
    
    // Skills 触发词
    '技能': 'skills',
    '擅长': 'skills',
    '会什么': 'skills',
    '工具': 'skills',
    '软件': 'skills',
    '能力': 'skills',
  },
  en: {
    // Profile 触发词
    'who are you': 'profile',
    'about you': 'profile',
    'introduce': 'profile',
    'profile': 'profile',
    'card': 'profile',
    
    // Projects 触发词
    'project': 'projects',
    'work': 'projects',
    'portfolio': 'projects',
    'case': 'projects',
    'what did you': 'projects',
    'what have you': 'projects',
    
    // Contact 触发词
    'contact': 'contact',
    'reach': 'contact',
    'email': 'contact',
    'social': 'contact',
    'how to contact': 'contact',
    
    // Skills 触发词
    'skill': 'skills',
    'ability': 'skills',
    'tool': 'skills',
    'software': 'skills',
    'what can you': 'skills',
    'good at': 'skills',
  },
};

/**
 * 检测用户输入是否应该触发 widget
 * @param input 用户输入
 * @param language 当前语言
 * @returns widget 类型或 null
 */
export function detectWidget(input: string, language: Language): WidgetType {
  const normalizedInput = input.toLowerCase().trim();
  const keywords = KEYWORDS[language];
  
  // 遍历关键词，检查是否匹配
  for (const [keyword, widgetType] of Object.entries(keywords)) {
    if (normalizedInput.includes(keyword.toLowerCase())) {
      return widgetType;
    }
  }
  
  return null;
}

/**
 * 检测用户是否在询问特定项目
 * @param input 用户输入
 * @param projects 项目列表
 * @returns 项目 ID 或 null
 */
export function detectProjectDetail(input: string, projects: Project[]): string | null {
  const normalizedInput = input.toLowerCase().trim();
  
  // 检查是否包含项目名称或 ID
  for (const project of projects) {
    const titleLower = project.title.toLowerCase();
    const idLower = project.id.toLowerCase();
    
    // 检查完整标题
    if (normalizedInput.includes(titleLower)) {
      return project.id;
    }
    
    // 检查 ID
    if (normalizedInput.includes(idLower)) {
      return project.id;
    }
    
    // 检查双语标题
    if (project.bilingualTitle) {
      const zhTitle = project.bilingualTitle.zh.toLowerCase();
      const enTitle = project.bilingualTitle.en.toLowerCase();
      if (normalizedInput.includes(zhTitle) || normalizedInput.includes(enTitle)) {
        return project.id;
      }
    }
  }
  
  return null;
}

/**
 * 检查是否应该在回复中显示 widget
 * 避免重复显示（如果最近3条消息中已经显示过相同类型的 widget）
 */
export function shouldShowWidget(
  widgetType: WidgetType,
  recentWidgets: (WidgetType | null)[]
): boolean {
  if (!widgetType) return false;
  
  // 检查最近3条消息
  const recent3 = recentWidgets.slice(-3);
  return !recent3.includes(widgetType);
}
