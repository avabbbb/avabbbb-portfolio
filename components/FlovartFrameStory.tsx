import { useEffect, useRef, useState } from 'react';
import { useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react';
import { Link } from 'react-router-dom';
import type { Language } from '../types';
import './frame-story.css';

const count = 48;

/** Frames from the existing real 9s workflow recording. Scroll owns time;
 * only a bounded neighborhood is decoded, and assets load near the section. */
export function FlovartFrameStory({ language }: { language: Language }) {
  const zh = language === 'zh';
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const requestFrame = useRef<(frame: number) => void>(() => {});
  const [chapter, setChapter] = useState(0);
  const chapterRef = useRef(0);
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] });
  useMotionValueEvent(scrollYProgress, 'change', p => {
    const frame = Math.round(Math.min(1, Math.max(0, p)) * (count - 1));
    requestFrame.current(frame);
    const next = frame < 16 ? 0 : frame < 32 ? 1 : 2;
    if (next !== chapterRef.current) { chapterRef.current = next; setChapter(next); }
  });

  useEffect(() => {
    const host = section.current;
    const surface = canvas.current;
    if (!host || !surface || reduced) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) { host.dataset.static = 'true'; return; }
    const mobile = window.matchMedia('(max-width: 900px)').matches;
    const width = mobile ? 640 : 896;
    const height = mobile ? 400 : 560;
    surface.width = width; surface.height = height;
    const context = surface.getContext('2d');
    if (!context) return;
    const cache = new Map<number, HTMLImageElement>();
    const failed = new Set<number>();
    const pending = new Set<number>();
    let desired = Math.round(scrollYProgress.get() * (count - 1));
    let active = false;
    let disposed = false;
    const paint = () => {
      const image = cache.get(desired);
      if (!image || disposed) return;
      context.drawImage(image, 0, 0, width, height);
      surface.style.opacity = '1';
      surface.dataset.frame = String(desired);
    };
    const load = () => {
      if (!active || disposed) return;
      paint();
      // Requested frame first, then a small neighborhood; four requests max.
      const near = [0, 1, -1, 2, -2, 3, -3, 4, -4].map(offset => desired + offset);
      for (const frame of near) {
        if (pending.size >= 4) break;
        if (frame < 0 || frame >= count || cache.has(frame) || failed.has(frame) || pending.has(frame)) continue;
        pending.add(frame);
        const image = new Image();
        image.onload = () => {
          pending.delete(frame);
          if (disposed) return;
          cache.set(frame, image);
          for (const key of cache.keys()) if (Math.abs(key - desired) > 8) cache.delete(key);
          paint(); load();
        };
        image.onerror = () => { pending.delete(frame); failed.add(frame); load(); };
        image.src = `/media/flovart-frames/${mobile ? 'mobile' : 'desktop'}/${String(frame).padStart(3, '0')}.webp`;
      }
    };
    requestFrame.current = frame => { desired = frame; load(); };
    const observer = new IntersectionObserver(entries => {
      active = entries[0].isIntersecting;
      if (active) { desired = Math.round(Math.max(0, Math.min(1, scrollYProgress.get())) * (count - 1)); load(); }
    }, { rootMargin: '400px' });
    observer.observe(host);
    return () => { disposed = true; requestFrame.current = () => {}; observer.disconnect(); cache.clear(); };
  }, [reduced, scrollYProgress]);

  const labels = zh ? ['创建节点', '组织画布', '连起工作流'] : ['Create nodes', 'Arrange the canvas', 'Connect the workflow'];
  return <section ref={section} className="frame-story" aria-labelledby="frame-story-title">
    <div className="frame-story-stage page-width">
      <header className="frame-story-heading">
        <div><span className="eyebrow">FLOVART / {zh ? '真实操作录屏' : 'RECORDED WORKFLOW'}</span>
          <h3 id="frame-story-title">{zh ? '一张画布，顺着操作展开。' : 'One canvas. Follow the flow.'}</h3></div>
        <Link className="text-link" to="/work/flovart">{zh ? '读案例 ↗' : 'Read the case ↗'}</Link>
      </header>
      <figure className="frame-story-media sticker">
        <i className="tape" aria-hidden="true" />
        <img src="/media/flovart-frames/mobile/000.webp" width="640" height="400" loading="lazy" alt={zh ? 'Flovart 实际操作录屏：在画布中创建、排列并连接节点' : 'Actual Flovart recording: create, arrange and connect canvas nodes'} />
        <canvas ref={canvas} aria-hidden="true" />
      </figure>
      <footer className="frame-story-footer">
        <p>{zh ? '真实 CLI 工作流演示 · 9 秒节选 · 无付费模型调用' : 'Recorded CLI workflow · 9-second excerpt · No paid model calls'}</p>
        {!reduced && <nav className="hero-story-chapters" aria-label={zh ? '操作录屏章节' : 'Workflow chapters'}>
          {labels.map((label, i) => <button key={label} aria-current={chapter === i ? 'step' : undefined} onClick={() => {
            const el = section.current;
            if (!el) return;
            const top = el.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({ top: top + (el.clientHeight - window.innerHeight) * [0.05, 0.5, 0.95][i], behavior: 'smooth' });
          }}><span>0{i + 1}</span>{label}</button>)}
        </nav>}
      </footer>
    </div>
  </section>;
}
