// 共享语言偏好 Context —— Opening Hero 与 AppContent 共用同一份语言状态
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { Language } from '../../types';
import { getLanguagePreference, saveLanguagePreference } from '../utils/languagePreference';

interface LanguageContextValue {
  language: Language;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'zh',
  toggleLanguage: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => getLanguagePreference());

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => {
      const next: Language = prev === 'zh' ? 'en' : 'zh';
      saveLanguagePreference(next);
      return next;
    });
  }, []);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
