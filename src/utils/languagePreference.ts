// 语言偏好工具 —— Opening Hero 与 Home 共享同一份偏好
// 首次访问无保存偏好时：浏览器语言以 zh 开头用中文，否则英文
import { Language } from '../../types';

const STORAGE_KEY = 'avabbbb:language';

// 读取并验证已保存的语言偏好；无保存时按浏览器语言推断
export function getLanguagePreference(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'zh' || stored === 'en') {
      return stored;
    }
  } catch {
    /* 存储不可用时按浏览器语言推断，不影响展示 */
  }
  const browserLang = typeof navigator !== 'undefined'
    ? (navigator.language || (navigator as { userLanguage?: string }).userLanguage || '')
    : '';
  return browserLang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

// 持久化语言偏好，只接受 zh / en
export function saveLanguagePreference(language: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    /* ignore */
  }
}
