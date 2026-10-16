import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Play, X } from 'lucide-react';
import type { Language } from '../types';
import './promo-video.css';

export function PromoVideo({ project, language, compact = false }: {
  project: 'flovart' | 'offeru'; language: Language; compact?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [opened, setOpened] = useState(false);
  const [version, setVersion] = useState<'promo' | 'intro'>('promo');
  const zh = language === 'zh';
  const name = project === 'flovart' ? 'Flovart' : 'OfferU';
  const shortLabel = zh ? '60 秒快速介绍' : '60-second overview';
  const longLabel = project === 'flovart'
    ? (zh ? '3 分钟完整介绍' : '3-minute introduction')
    : (zh ? '2 分 40 秒完整介绍 · 英文' : '2:40 full introduction · English');
  const caption = project === 'flovart'
    ? (zh ? 'Iris 是 Flovart 插件版的名字，画布版叫 Flovart。' : 'Iris is the name of the Flovart plugin edition; the canvas edition is called Flovart.')
    : (zh ? 'OfferU · 产品介绍' : 'OfferU · Product introduction');
  const close = () => { video.current?.pause(); dialog.current?.close(); };
  return <>
    <div className={`promo-video ${compact ? 'promo-video--compact' : ''}`}>
      <button type="button" className={`promo-video-trigger ${compact ? '' : 'promo-video-trigger--card'}`}
        aria-label={`${zh ? '看视频介绍' : 'Watch introductions'} · ${name}`}
        onClick={() => { setOpened(true); }}>
        {!compact && <img src={`/media/${project}-promo.webp`} alt="" loading="lazy" />}
        <span className="promo-video-play"><Play size={14} fill="currentColor" aria-hidden="true" /></span>
        <span>{zh ? '看视频介绍' : 'Watch introductions'}{!compact && <small>{name} · 60s / {project === 'flovart' ? '3:00' : '2:40'}</small>}</span>
      </button>
    </div>
    {opened && createPortal(<dialog ref={node => { dialog.current = node; if (node && !node.open) node.showModal(); }} className="promo-video-dialog" aria-label={`${name} · ${zh ? '视频介绍' : 'Introductions'}`}
      onClose={() => { video.current?.pause(); setOpened(false); }}
      onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(); } }}>
      <div className="promo-video-dialog-head"><strong>{name}</strong><button type="button" className="promo-video-close" onClick={close} aria-label={zh ? '关闭视频' : 'Close video'}><X size={20} /></button></div>
      {opened && <>
        <video key={version} ref={video} controls playsInline preload="none" poster={`/media/${project}-${version}.webp`} aria-label={`${name} · ${version === 'promo' ? shortLabel : longLabel}`}>
          <source src={`/media/${project}-${version}.mp4`} type="video/mp4" />
        </video>
        <div className="promo-video-versions" role="group" aria-label={zh ? '选择介绍视频' : 'Choose an introduction video'}>
          {(['promo', 'intro'] as const).map(value => <button type="button" key={value} aria-pressed={version === value}
            onClick={() => { video.current?.pause(); setVersion(value); }}>{value === 'promo' ? shortLabel : longLabel}</button>)}
        </div>
        <p className="promo-video-caption">{caption}</p>
      </>}
    </dialog>, document.body)}
  </>;
}
