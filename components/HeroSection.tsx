import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion, useSpring, useScroll, useTransform, useMotionValueEvent, useMotionValue } from 'motion/react';
import type { Language } from '../types';
import { toJsDelivr } from '../src/utils/cdn';
import './hero.css';

/* ------------------------------------------------------------------ */
/* Types & copy                                                        */
/* ------------------------------------------------------------------ */

type Identity = 'product' | 'opensource' | 'creator';

interface HeroSectionProps {
  language: Language;
}

const COPY = {
  eyebrow: { zh: 'THE WORLD OF AVABBBB', en: 'THE WORLD OF AVABBBB' },
  tag: { zh: 'PRODUCT × CODE × FILM', en: 'PRODUCT × CODE × FILM' },
  title: { zh: '一个人，也是一间工作室。', en: 'One person. A world of things.' },
  purpose: {
    zh: 'avabbbb 的产品、代码与影像，共用同一颗好奇心。',
    en: 'Products, code and film from one desk — a single practice kept deliberately small.',
  },
  groupLabel: { zh: '选择一条线索', en: 'Choose a thread' },
  identities: {
    product: { en: 'PRODUCT', zh: '做产品', name: 'Flovart', dest: '/work/flovart' },
    opensource: { en: 'OPEN SOURCE', zh: '写代码', name: 'CLIProxyAPI × Devin', dest: '/work/cpa' },
    creator: { en: 'CREATOR', zh: '拍片子', name: 'Cici — a frame', dest: '/portfolio/motion/v3' },
  } satisfies Record<Identity, { en: string; zh: string; name: string; dest: string }>,
  artifactBar: {
    product: 'FLOVART — LIVE CANVAS',
    opensource: 'MODELS.DEV — PATCH',
    creator: 'CICIA.MP4 — FRAME',
  } satisfies Record<Identity, string>,
  artifactAlt: {
    product: {
      zh: 'Flovart 实时画布局部：一个真实的节点窗口',
      en: 'Cropped live canvas of Flovart: one real node window',
    },
    opensource: {
      zh: 'CLIProxyAPI 补丁：保留 swe-1-6，新增 swe-1-6-slow',
      en: 'CLIProxyAPI patch: swe-1-6 kept, swe-1-6-slow added',
    },
    creator: {
      zh: '二创短片 cicia.mp4 的一帧',
      en: 'A single frame pulled from the fan film cicia.mp4',
    },
  } satisfies Record<Identity, { zh: string; en: string }>,
  mascotAlt: {
    zh: '奶娃 — avabbbb 的原始吉祥物',
    en: 'Naiwa — the original avabbbb mascot',
  },
  selectedWork: { zh: 'SELECTED WORK', en: 'SELECTED WORK' },
  roles: [
    { zh: '独立开发', en: 'SOLO DEV' },
    { zh: '上游贡献', en: 'UPSTREAM' },
    { zh: '影像创作', en: 'FILM' },
  ],
} as const;

const IDENTITY_ORDER: Identity[] = ['product', 'opensource', 'creator'];

/* ------------------------------------------------------------------ */
/* Wordmark — pointer-elastic letters, ≤8px travel, true baseline      */
/* ------------------------------------------------------------------ */

const LETTERS = 'AVABBBB'.split('');

/* Each letter is a motion.span; moving the pointer near a letter springs it
   up, on leave the spring overshoots and settles — the jelly/bounce of the old
   title. Motion values + animate() give a real spring, not a linear snap. */
/* Each letter is a plain span; the wordmark host listens natively and writes
   transform directly. The spring feel comes from an overshooting cubic-bezier
   transition — on approach the letter lifts, on leave it snaps back past zero
   and settles. No motion-value plumbing, so it can never desync. */
const LIFT_CURVE = 'cubic-bezier(.2, 1.5, .3, 1)';   /* overshoot on the way up */
const SETTLE_CURVE = 'cubic-bezier(.34, 1.7, .4, 1)'; /* bounce back past rest */

const Wordmark: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const letters = useRef<HTMLElement[]>([]);
  const raf = useRef(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const host = ref.current;
    if (!host || reduced) return;
    const onMove = (e: MouseEvent) => {
      const py = e.clientY;
      const px = e.clientX;
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const hRect = host.getBoundingClientRect();
        const t = 1 - Math.min(1, Math.abs(py - (hRect.top + hRect.height / 2)) / (hRect.height / 2 || 1));
        letters.current.forEach((el) => {
          if (!el) return;
          const r = el.getBoundingClientRect();
          const dx = Math.abs(px - (r.left + r.width / 2));
          const fall = Math.max(0, 1 - dx / (r.width * 1.6));
          el.style.transition = `transform .45s ${LIFT_CURVE}`;
          el.style.transform = `translateY(${(-16 * t * fall).toFixed(2)}px)`;
        });
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf.current);
      letters.current.forEach((el) => {
        if (!el) return;
        el.style.transition = `transform .6s ${SETTLE_CURVE}`;
        el.style.transform = 'translateY(0px)';
      });
    };
    host.addEventListener('mousemove', onMove);
    host.addEventListener('mouseleave', onLeave);
    return () => {
      host.removeEventListener('mousemove', onMove);
      host.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf.current);
    };
  }, [reduced]);

  return (
    <div ref={ref} className="hero-wordmark" aria-hidden="true">
      {LETTERS.map((ch, i) => (
        <span key={i} ref={(el) => { if (el) letters.current[i] = el; }}
          className={`wl${i === 2 ? ' wl-accent' : ''}`}>
          {ch}
        </span>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Artifacts — one per identity, all seated in the same spot           */
/* ------------------------------------------------------------------ */

const ArtifactBody: React.FC<{ id: Identity; language: Language }> = ({ id, language }) => {
  if (id === 'product') {
    return (
      <div className="hero-artifact-media hero-artifact-canvas">
        <span className="node-label">NODE · WORKFLOW</span>
        <img
          src={toJsDelivr('/media/flovart-fragment.webp')}
          alt={COPY.artifactAlt.product[language]}
          width={720}
          height={455}
          loading="eager"
          decoding="async"
        />
      </div>
    );
  }
  if (id === 'opensource') {
    return (
      <div className="hero-artifact-code" role="img" aria-label={COPY.artifactAlt.opensource[language]}>
        <span className="cl cl-file">models.dev · provider contract</span>
        <span className="cl cl-ctx">"devin/swe-1-6"</span>
        <span className="cl cl-add">"devin/swe-1-6-slow"</span>
        <span className="cl cl-ctx">"devin/swe-1-5"</span>
      </div>
    );
  }
  return (
    <div className="hero-artifact-media hero-artifact-film">
      <img
        src={toJsDelivr('/media/creator-film.webp')}
        alt={COPY.artifactAlt.creator[language]}
        width={640}
        height={360}
        loading="eager"
        decoding="async"
      />
      <span className="frame-mark">STILL</span>
      <span className="tc">TC 00:00:06:16</span>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export const HeroSection: React.FC<HeroSectionProps> = ({ language }) => {
  const [identity, setIdentity] = useState<Identity>('product');
  const [chapter, setChapter] = useState(0);
  const chapterRef = useRef(0);
  const reduced = useReducedMotion();

  /* Eye tracking — the pupils move inside fixed green sockets painted in the
     logo's own eye colour; only the dark pupil dot translates. */
  const pupilLRef = useRef<HTMLSpanElement>(null);
  const pupilRRef = useRef<HTMLSpanElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const mascotRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const lean = useSpring(0, { stiffness: 90, damping: 16, mass: 0.6 });

  /* ——— Two-act scroll choreography ———
     .hero is ~200svh so there is room to scroll; .hero-stage is sticky at the
     viewport. Act 1 = the wordmark alone, centred. Scrolling lifts it away and
     rises the mascot head into the MIDDLE of the band, then the ring (intro,
     artifact, identities) settles around it. */
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end end'],
  });
  const progress = useMotionValue(0);
  useMotionValueEvent(scrollYProgress, 'change', value => progress.set(value));
  useEffect(() => { progress.set(scrollYProgress.get()); }, [progress, scrollYProgress]);
  useMotionValueEvent(progress, 'change', p => {
    const next = p < 0.22 ? 0 : p < 0.65 ? 1 : 2;
    if (chapterRef.current !== next) { chapterRef.current = next; setChapter(next); }
  });
  const markY = useTransform(progress, [0, 0.5], ['0vh', '-110vh']);
  const markO = useTransform(progress, [0, 0.32], [1, 0]);
  const rise = useTransform(progress, [0.15, 0.62], ['58vh', '0vh']);
  const mascotO = useTransform(progress, [0.15, 0.45], [0, 1]);
  const ringO = useTransform(progress, [0.45, 0.72], [0, 1]);
  const ringY = useTransform(progress, [0.45, 0.72], ['26px', '0px']);

  /* Mark + ring are driven by refs too — same manual-write path as the mascot
     so every layer stays in lockstep and nothing desyncs inside a sticky pin. */
  const markRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const applyMark = useCallback(() => {
    const el = markRef.current;
    if (!el) return;
    el.style.transform = `translateY(${markY.get()})`;
    el.style.opacity = String(markO.get());
  }, [markY, markO]);
  const applyRing = useCallback(() => {
    const el = ringRef.current;
    if (!el) return;
    el.style.transform = `translateY(${ringY.get()})`;
    el.style.opacity = String(ringO.get());
    el.inert = !reduced && ringO.get() < 0.02;
  }, [ringY, ringO, reduced]);
  useMotionValueEvent(markY, 'change', applyMark);
  useMotionValueEvent(markO, 'change', applyMark);
  useMotionValueEvent(ringY, 'change', applyRing);
  useMotionValueEvent(ringO, 'change', applyRing);
  useEffect(() => { applyMark(); applyRing(); }, [applyMark, applyRing]);

  /* Compose the mascot transform once: centred (-50%,-50%) + scroll rise +
     lean. All three live on the same `transform` so they never fight. */
  const applyMascot = useCallback(() => {
    const el = mascotRef.current;
    if (!el) return;
    el.style.transform = `translate(-50%, -50%) translateY(${rise.get()}) rotate(${lean.get()}deg)`;
    el.style.opacity = String(mascotO.get());
  }, [rise, mascotO, lean]);

  useMotionValueEvent(rise, 'change', applyMascot);
  useMotionValueEvent(mascotO, 'change', applyMascot);
  useMotionValueEvent(lean, 'change', applyMascot);

  useEffect(() => { applyMascot(); }, [applyMascot]);

  useEffect(() => {
    if (reduced) {
      lean.jump(0);
      return;
    }
    lean.set(identity === 'product' ? 1.6 : identity === 'creator' ? -1.6 : 0);
  }, [identity, lean, reduced]);

  const idMeta = COPY.identities[identity];

  /* Pupils chase the cursor inside their sockets. */
  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      for (const ref of [pupilLRef, pupilRRef]) {
        const el = ref.current;
        if (!el) continue;
        const socket = el.parentElement!.getBoundingClientRect();
        const cx = socket.left + socket.width / 2;
        const cy = socket.top + socket.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const ang = Math.atan2(dy, dx);
        const max = socket.width * 0.16;
        const dist = Math.min(max, Math.hypot(dx, dy) * 0.06);
        el.style.transform = `translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist}px)`;
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduced]);

  /* The same scroll position always produces the same orbit. Hover and focus
     freeze each fragment independently, so its target never moves away. */
  useEffect(() => {
    const wrap = orbitRef.current;
    const mascot = mascotRef.current;
    if (!wrap || !mascot) return;
    const frags = Array.from(wrap.querySelectorAll<HTMLElement>('.hero-fragment'));
    const frozen = new Set<HTMLElement>();
    const paint = () => {
      const gate = reduced ? 1 : mascotO.get();
      const angle = -Math.PI / 2 + progress.get() * Math.PI * 1.25;
      const mw = mascot.offsetWidth;
      const room = (mascot.parentElement?.offsetWidth ?? mw * 2) / 2;
      const faceW = (frags[0]?.firstElementChild as HTMLElement | null)?.offsetWidth ?? 150;
      const rx = Math.max(0, Math.min(mw * 0.86, room - faceW / 2 - 14));
      frags.forEach((el, i) => {
        const on = gate > 0.02;
        el.style.visibility = on ? 'visible' : 'hidden';
        el.inert = !on;
        if (frozen.has(el) && on) return;
        const a = angle + i * Math.PI * 2 / frags.length;
        const depth = Math.sin(a);
        const x = reduced ? [-1, 0, 1][i] * rx : Math.cos(a) * rx;
        const y = reduced ? -mw * 0.35 : depth * rx * 0.46;
        el.style.transform = `translate(-50%,-50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        el.style.opacity = String((reduced ? 1 : 0.55 + (depth + 1) * 0.225) * gate);
        el.style.zIndex = depth < 0 ? '1' : '4';
        const face = el.firstElementChild as HTMLElement | null;
        if (face) face.style.transform = `scale(${reduced ? 0.8 : 0.62 + (depth + 1) * 0.225})`;
      });
    };
    const freeze = (event: Event) => { frozen.add(event.currentTarget as HTMLElement); };
    const release = (event: Event) => {
      const el = event.currentTarget as HTMLElement;
      if (el.matches(':hover') || el.matches(':focus-within')) return;
      frozen.delete(el); paint();
    };
    frags.forEach(el => {
      el.addEventListener('pointerenter', freeze); el.addEventListener('pointerleave', release);
      el.addEventListener('focusin', freeze); el.addEventListener('focusout', release);
    });
    const resize = new ResizeObserver(paint);
    resize.observe(mascot.parentElement!);
    const unsub = progress.on('change', paint);
    const unsubGate = mascotO.on('change', paint);
    paint();
    return () => {
      unsub(); unsubGate(); resize.disconnect();
      frags.forEach(el => {
        el.removeEventListener('pointerenter', freeze); el.removeEventListener('pointerleave', release);
        el.removeEventListener('focusin', freeze); el.removeEventListener('focusout', release);
      });
    };
  }, [reduced, progress, mascotO]);

  return (
    <section ref={heroRef} className="hero page-width" aria-label="AVABBBB">
      {/* sticky stage — one viewport tall, scroll drives the two acts */}
      <div className="hero-stage">
        {/* top editorial strip */}
        <div className="hero-top">
          <span className="eyebrow">{COPY.eyebrow[language]}</span>
          <span className="hero-top-mark" aria-hidden="true">
            <i />
            {COPY.tag[language]}
          </span>
        </div>
        {/* ——— ACT 1 ——— the wordmark alone, centred, lifts away on scroll */}
        <div ref={markRef} className="hero-act hero-act--mark">
          <Wordmark />
          <p className="hero-scroll-hint" aria-hidden="true">{language === 'zh' ? '往下' : 'SCROLL'} ↓</p>
        </div>

        {/* ——— ACT 2 ——— the mascot head rises to centre; the ring settles */}
        <div className="hero-figure">
          <div ref={ringRef} className="hero-ring">
            <div className="hero-intro">
              <h1>{COPY.title[language]}</h1>
              <p>{COPY.purpose[language]}</p>
            </div>

            {/* artifact seat — a sticker stuck down with tape; hover peels
                the printed face away to reveal the destination under it */}
            <div className="hero-artifact-seat">
              <Link to={idMeta.dest} className="hero-artifact sticker sticker-peel" key={identity}>
                <i className="tape" aria-hidden="true" />
                <div className="hero-artifact-inner">
                  <div className="hero-artifact-card peel-face">
                    <div className="hero-artifact-bar">
                      <span className="dots" aria-hidden="true"><i /><i /><i /></span>
                      <span className="bar-title">{COPY.artifactBar[identity]}</span>
                      <span className="bar-go" aria-hidden="true">↗</span>
                    </div>
                    <ArtifactBody id={identity} language={language} />
                  </div>
                  <div className="peel-back" aria-hidden="true">
                    {language === 'zh' ? '进入 →' : 'ENTER →'}
                  </div>
                  <div className="hero-artifact-caption">
                    <span className="cap-name">
                      {idMeta.name}{' '}
                      <span className="serif">{language === 'zh' ? '进去看看' : 'open the case'}</span>
                    </span>
                    <span className="cap-dest">{idMeta.dest} <span aria-hidden="true">→</span></span>
                  </div>
                </div>
              </Link>
            </div>

            {/* identity selector */}
            <div className="hero-identities" role="group" aria-label={COPY.groupLabel[language]}>
              {IDENTITY_ORDER.map((id, i) => (
                <button key={id} type="button" className="hero-identity"
                  aria-pressed={identity === id} onClick={() => setIdentity(id)}>
                  <span className="id-index">0{i + 1}</span>
                  <span className="id-label">{COPY.identities[id].en}</span>
                  <span className="id-zh">{COPY.identities[id].zh}</span>
                </button>
              ))}
            </div>
          </div>

          {/* the mascot head — centred in the band, rises on scroll */}
          <div ref={mascotRef} className="hero-mascot">
            <img src={toJsDelivr('/logo.png')} alt={COPY.mascotAlt[language]}
              width={512} height={512} loading="eager" decoding="async" draggable={false} />
            <span className="hero-eye hero-eye--l" aria-hidden="true"><span ref={pupilLRef} className="hero-pupil" /></span>
            <span className="hero-eye hero-eye--r" aria-hidden="true"><span ref={pupilRRef} className="hero-pupil" /></span>
          </div>

          {/* identity fragments orbit the head on a tilted ellipse — they pass
              BEHIND it on the far arc (shrinking + dimming) and in FRONT on the
              near arc. Each is a proper polaroid ticket: taped at the top, a
              photo scrap, a caption label. Tapping selects the identity and the
              artifact below re-forms around it. */}
          <div ref={orbitRef} className="hero-fragments">
            {IDENTITY_ORDER.map((id, i) => (
              <button
                key={id}
                type="button"
                className={`hero-fragment hero-fragment--${id}${identity === id ? ' is-active' : ''}`}
                aria-pressed={identity === id}
                aria-label={COPY.identities[id][language === 'zh' ? 'zh' : 'en']}
                onClick={() => setIdentity(id)}
              >
                <span className="hero-fragment-face">
                  <i className="hero-fragment-tape" aria-hidden="true" />
                  <span className="hero-fragment-media">
                    {id === 'product' && <img src={toJsDelivr('/media/flovart-fragment.webp')} alt="" width={120} height={76} loading="lazy" />}
                    {id === 'opensource' && <span className="hero-fragment-code">+ swe-1-6-slow</span>}
                    {id === 'creator' && <img src={toJsDelivr('/media/creator-film.webp')} alt="" width={120} height={68} loading="lazy" />}
                  </span>
                  <span className="hero-fragment-tag" aria-hidden="true">
                    {COPY.identities[id].en}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>


        {/* Native scrolling stays available; chapters are optional shortcuts. */}
        <div className="hero-bottom">
          <Link to="/#work" className="hero-work-link">
            {COPY.selectedWork[language]}
            <span className="arr" aria-hidden="true">↓</span>
          </Link>
          {!reduced && <nav className="hero-story-chapters" aria-label={language === 'zh' ? '开场章节' : 'Opening chapters'}>
            {(language === 'zh' ? ['字标', '奶娃登场', '探索拼贴'] : ['Wordmark', 'Meet Naiwa', 'Explore']).map((label, i) => (
              <button key={label} aria-current={chapter === i ? 'step' : undefined} onClick={() => {
                const el = heroRef.current;
                if (!el) return;
                const top = el.getBoundingClientRect().top + window.scrollY;
                window.scrollTo({ top: top + (el.offsetHeight - window.innerHeight) * [0, 0.43, 0.9][i], behavior: 'smooth' });
              }}><span>0{i + 1}</span>{label}</button>
            ))}
          </nav>}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
