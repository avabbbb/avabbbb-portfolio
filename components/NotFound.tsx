import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../src/context/LanguageContext';

/**
 * 404 page. `embedded` renders the page body only — the site shell already
 * provides header/footer — while the standalone form keeps its own <main>.
 */
export function NotFound({ embedded = false }: { embedded?: boolean }) {
  const { language } = useLanguage();

  const body = (
    <div className="not-found-page page-width">
      <p className="eyebrow">404 / NOT FOUND</p>
      <h1 className="not-found-title">
        {language === 'zh' ? '页面未找到' : 'Page not found'}
      </h1>
      <p className="not-found-note">
        {language === 'zh'
          ? '这个链接可能已失效，返回主页继续浏览作品与文章。'
          : 'This link may be outdated. Return home to keep exploring the work and writing.'}
      </p>
      <Link to="/" className="round-link">
        <ArrowLeft size={16} aria-hidden="true" />
        {language === 'zh' ? '返回主页' : 'Return home'}
      </Link>
    </div>
  );

  if (embedded) return body;
  return <main className="not-found-standalone">{body}</main>;
}
