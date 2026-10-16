import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Play } from 'lucide-react';
import type { Language } from '../types';
import './selected-work.css';
import { FlovartFrameStory } from './FlovartFrameStory';
import { PromoVideo } from './PromoVideo';

/* ------------------------------------------------------------------ */
/* Selected / works — four authored stages, not a card grid            */
/* ------------------------------------------------------------------ */

type T = (zh: string, en: string) => string;

interface SelectedWorkProps {
  language: Language;
}

/** Small stage index + mono label, matching the editorial eyebrow. */
const StageMark: React.FC<{ n: string; label: string; dark?: boolean }> = ({
  n,
  label,
  dark,
}) => (
  <div className={`sw-mark ${dark ? 'sw-mark--dark' : ''}`}>
    <span className="sw-mark-num" aria-hidden="true">{n}</span>
    {/* the stage label reads as a small tilted sticker title, not set type */}
    <span className={`sw-mark-label tilt-label ${dark ? 'tilt-label--gold' : 'tilt-label--acid'}`}>{label}</span>
  </div>
);

/* ------------------------------------------------------------------ */
/* 01 — Flovart · pale sage field, one enormous real canvas            */
/* ------------------------------------------------------------------ */

const FlovartStage: React.FC<{ t: T; language: Language }> = ({ t, language }) => (
  <>
  <section className="sw-stage sw-stage--flovart" aria-labelledby="sw-flovart-title">
    <StageMark n="01" label={t('开源 · 独立开发', 'Open source · Solo build')} />

    <div className="sw-flovart-grid">
      <div className="sw-flovart-copy">
        <h3 id="sw-flovart-title" className="sw-flovart-word" aria-label="Flovart">
          <span aria-hidden="true">Flovart</span>
        </h3>
        <p className="sw-flovart-sub">
          {t('本地优先 · Agent 原生视觉制作工作区', 'Local-first · Agent-native visual production workspace')}
        </p>
        <p className="sw-flovart-desc">
          {t(
            '人和 coding agent 编辑同一张实时画布。Workflow 管编排，Table 管素材，Agent 管生产——不是三个产品，是同一份状态的三个面。',
            'A human and a coding agent edit the same live canvas. Workflow orchestrates, Table preprocesses, Agent controls production — three surfaces of one state, not three products.'
          )}
        </p>
        <dl className="sw-meta">
          <div>
            <dt>{t('角色', 'Role')}</dt>
            <dd>{t('独立设计 / 开发', 'Solo design & build')}</dd>
          </div>
          <div>
            <dt>{t('协议', 'License')}</dt>
            <dd>AGPL-3.0</dd>
          </div>
          <div>
            <dt>{t('规模', 'Scale')}</dt>
            <dd>137 stars · 392 commits</dd>
          </div>
        </dl>
        <Link to="/work/flovart" className="text-link sw-case-link">
          <span>{t('读案例', 'Read the case')}</span>
          <ArrowUpRight size={15} strokeWidth={2.2} aria-hidden="true" />
        </Link>
        <PromoVideo project="flovart" language={language} compact />
      </div>

      <figure className="sw-flovart-fig sticker">
        <i className="tape" aria-hidden="true" />
        <Link
          to="/work/flovart"
          className="sw-flovart-frame"
          aria-label={t('打开 Flovart 案例研究', 'Open the Flovart case study')}
          tabIndex={-1}
        >
          <img
            src="/media/flovart-workflow.webp"
            alt={t(
              'Flovart Workflow 画布实截图：节点编排与生成记录的实时工作区',
              'Flovart Workflow canvas, actual capture: live node orchestration and generation records'
            )}
            width={1869}
            height={890}
            loading="lazy"
          />
        </Link>
        <figcaption className="sw-caption">
          {t(
            'Workflow 主画布 · 1869×890 实截图。人和 agent 看到的是同一张画布。',
            'The Workflow canvas, 1869×890 actual capture. The human and the agent see the same surface.'
          )}
        </figcaption>
      </figure>
    </div>
  </section>
  <FlovartFrameStory language={language} />
  </>
);

/* ------------------------------------------------------------------ */
/* 02 — CLIProxyAPI · deep green field, a designed diff                 */
/* ------------------------------------------------------------------ */

const CpaStage: React.FC<{ t: T }> = ({ t }) => (
  <section className="sw-stage sw-stage--cpa" aria-labelledby="sw-cpa-title">
    <StageMark n="02" label={t('上游贡献 · 开源修复', 'Upstream contribution')} dark />

    <div className="sw-cpa-grid">
      <div className="sw-cpa-copy">
        <h3 id="sw-cpa-title" className="sw-cpa-line">
          {t(
            '一个小改动。',
            'A small diff.'
          )}
          <br />
          <em className="serif">
            {t('一次真的不同。', 'A real difference.')}
          </em>
        </h3>
        <p className="sw-cpa-desc">
          {t(
            '同一个 Devin Free 账号：官方 CLI 能调 swe-1-6-slow，CPA 只认识 swe-1-6 报 quota error。Additive 补丁补全 model contract；第二个窄修复把 transient "high demand" 从误判 403 改回 429。',
            'Same Devin Free account: the official CLI reached swe-1-6-slow while CPA only knew swe-1-6 and returned a quota error. One additive patch completed the model contract; a second narrow fix reclassified transient "high demand" from a mistaken 403 to 429.'
          )}
        </p>
        <p className="sw-cpa-title-tag">
          CLIProxyAPI <span aria-hidden="true">·</span>{' '}
          {t('Devin 修复', 'Devin fixes')}
        </p>
        <ul className="sw-cpa-evidence" aria-label={t('合并记录', 'Merge record')}>
          <li>3 {t('个合并 PR', 'merged PRs')}</li>
          <li>v7.3.5</li>
          <li>{t('官方 New Contributor', 'Official New Contributor')}</li>
        </ul>
        <Link to="/work/cpa" className="text-link sw-case-link sw-case-link--dark">
          <span>{t('读案例', 'Read the case')}</span>
          <ArrowUpRight size={15} strokeWidth={2.2} aria-hidden="true" />
        </Link>
      </div>
      <div className="sw-cpa-diff-col">
        <figure
          className="sw-diff sticker"
          style={{ '--tilt': '1.8deg' } as React.CSSProperties}
          role="img"
          aria-label={t(
            '模型契约差异：目录新增 swe-1-6-slow，swe-1-6、swe-1-7、swe-2 全部保留',
            'Model-contract diff: the catalog gains swe-1-6-slow while swe-1-6, swe-1-7 and swe-2 are all preserved'
          )}
        >
          <figcaption className="sw-diff-bar">
            <span className="sw-diff-dots" aria-hidden="true"><i /><i /><i /></span>
            <em>devin_wire.go</em>
            <span className="sw-diff-pr">PR #5867</span>
          </figcaption>
          <pre className="sw-diff-body"><code>{`  devin/swe-1-6      ${t('保留', 'kept')}
  devin/swe-1-7      ${t('保留', 'kept')}
  devin/swe-2        ${t('保留', 'kept')}
+ devin/swe-1-6-slow ${t('新增', 'added')}`}</code></pre>
        </figure>

        <p className="sw-cpa-proof">
          <span className="sw-cpa-proof-tag">403 → 429</span>
          {t(
            '第二层修复刻意收窄：只有 permission_denied 且消息含 "high demand" 才改判 429——瞬时高负载，不是真权限错误。其余 403 不变。',
            'The second fix stayed deliberately narrow: only permission_denied carrying a "high demand" message is reclassified to 429 — transient capacity pressure, not a real permission error. Every other 403 is untouched.'
          )}
        </p>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* 03 — OfferU · paper dossier object                                   */
/* ------------------------------------------------------------------ */

const OFFERU_FLOW_ZH = [
  '观察',
  'Event / Candidate',
  'Runtime 理解状态',
  'CareerTask 规划',
  'Operation 执行或提案',
  '验证后提交',
];
const OFFERU_FLOW_EN = [
  'Observe',
  'Event / Candidate',
  'Runtime understands',
  'CareerTask plans',
  'Operation executes or proposes',
  'Verified commit',
];

const OfferuStage: React.FC<{ t: T; zh: boolean }> = ({ t, zh }) => {
  const flow = zh ? OFFERU_FLOW_ZH : OFFERU_FLOW_EN;
  return (
    <section className="sw-stage sw-stage--offeru" aria-labelledby="sw-offeru-title">
      <StageMark n="03" label={t('内部 Beta · 桌面应用', 'Internal Beta · Desktop app')} />

      <div className="sw-offeru-grid">
        <div className="sw-offeru-copy">
          <h3 id="sw-offeru-title" className="sw-offeru-title">
            <span className="serif">OfferU</span>
          </h3>
          <p className="sw-offeru-sub">
            {t('本地优先 · 证据驱动的 AI 求职工作台', 'Local-first, evidence-driven AI job-hunting workbench')}
          </p>
          <p className="sw-offeru-desc">
            {t(
              'Agent 提议，你决定。所有推断先成为候选与提案，人审核之后才落库——没有凭空生成的简历经历。',
              'The agent proposes; you decide. Every inference lands as a candidate or proposal, reviewed before it commits — no invented resume experience.'
            )}
          </p>
          <Link to="/work/offeru" className="text-link sw-case-link">
            <span>{t('读案例', 'Read the case')}</span>
            <ArrowUpRight size={15} strokeWidth={2.2} aria-hidden="true" />
          </Link>
          <PromoVideo project="offeru" language={zh ? 'zh' : 'en'} compact />
        </div>

        <figure className="sw-dossier sticker" style={{ '--tilt': '-1.6deg' } as React.CSSProperties} aria-label={t(
          'OfferU 系统原则文档：真相从观察到提交流经六个步骤，AI 只提案不落库',
          'OfferU system-principle document: truth flows from observation to commit in six steps; the AI proposes, it does not commit'
        )}>
          <i className="tape tape--gold tape--r" aria-hidden="true" />
          <div className="sw-dossier-sheet">
            <div className="sw-dossier-head">
              <p className="sw-dossier-kicker">
                {t('系统原则', 'System principle')}
                <span aria-hidden="true"> / </span>
                {t('非产品截图', 'Not a product screenshot')}
              </p>
              <p className="sw-dossier-stamp" aria-hidden="true">
                {t('提案 · 待审', 'Proposal · pending')}
              </p>
            </div>
            <p className="sw-dossier-big">
              {t('Agent 提议。', 'Agent proposes.')}
              <br />
              <em className="serif">{t('你决定。', 'You decide.')}</em>
            </p>
            <ol className="sw-dossier-flow">
              {flow.map((step, i) => (
                <li key={i}>
                  <span className="sw-dossier-index">{String(i + 1).padStart(2, '0')}</span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="sw-dossier-foot">
              <span>ARCHITECTURE.md</span>
              <span>{t('三种权威分离', 'Three authorities, separated')}</span>
            </div>
          </div>
          <div className="sw-dossier-inset">
            <img
              src="/media/offeru-resume.webp"
              alt={t(
                'OfferU 简历工作区实截图：AI 只生成带前后对照的提案，逐条接受或拒绝',
                'OfferU resume workspace, actual capture: the AI only proposes before/after diffs, accepted or rejected line by line'
              )}
              width={1024}
              height={576}
              loading="lazy"
            />
            <span className="sw-dossier-inset-tag">
              {t('README 实截图 · 简历工作区', 'Actual README capture · Resume workspace')}
            </span>
          </div>
        </figure>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* 04 — Creator · cinematic black stage, user-initiated film            */
/* ------------------------------------------------------------------ */

const CreatorStage: React.FC<{ t: T; zh: boolean }> = ({ t, zh }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const startFilm = () => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => setPlaying(true));
    setPlaying(true);
  };

  return (
    <section className="sw-stage sw-stage--creator" aria-labelledby="sw-creator-title">
      <StageMark n="04" label={t('影像创作 · 委托与自制', 'Moving image · commissions & self-made')} dark />

      <div className="sw-creator-grid">
        <div className="sw-creator-copy">
          <h3 id="sw-creator-title" className="sw-creator-line">
            {t('按下播放', 'Press play')}
            <br />
            <em className="serif">{t('的那一端。', 'on the other end.')}</em>
          </h3>
          <p className="sw-creator-desc">
            {t(
              '米哈游《绝区零》小红书创作者社群官方约稿创作者；另一面是自制二创短片——PR + AE 剪辑，本地 SD 模型画立绘。',
              'An official commissioned creator in the Zenless Zone Zero Xiaohongshu community; on the other side, self-made fan films — cut in Premiere + After Effects, characters drawn with a local SD model.'
            )}
          </p>

          <ul className="sw-creator-links" aria-label={t('相关作品', 'Related work')}>
            <li>
              <Link to="/portfolio/motion/v3" className="sw-creator-link">
                <span>{t('委托证据', 'Commission evidence')}</span>
                <ArrowUpRight size={13} strokeWidth={2.4} aria-hidden="true" />
              </Link>
            </li>
            <li>
              <Link to="/portfolio/dev/dev3" className="sw-creator-link">
                <span>{t('LORA 角色微调', 'LORA character fine-tuning')}</span>
                <ArrowUpRight size={13} strokeWidth={2.4} aria-hidden="true" />
              </Link>
            </li>
          </ul>

          <figure className="sw-lora-strip">
            <img
              src="/lora/eve-1.png"
              alt={t(
                'Evelyn 角色 LORA 训练生成样图',
                'Sample generation from the Evelyn character LORA'
              )}
              loading="lazy"
            />
            <figcaption>
              {t('Evelyn · SDXL LORA 训练样图', 'Evelyn · SDXL LORA training sample')}
            </figcaption>
          </figure>
        </div>

        <figure className="sw-film sticker" style={{ '--tilt': '1.2deg' } as React.CSSProperties}>
          <i className="tape tape--r" aria-hidden="true" />
          <div className="sw-film-frame">
            {!playing && (
              <img
                src="/media/creator-film.webp"
                alt={t(
                  '短片画面定格：4:3 画幅的一帧',
                  'Film still: one frame from the 4:3 short'
                )}
                width={1280}
                height={960}
                loading="lazy"
              />
            )}
            <video
              ref={videoRef}
              className={`sw-film-video ${playing ? 'is-live' : ''}`}
              controls
              playsInline
              preload="none"
              src="/videos/cicia.mp4"
              aria-label={t(
                '自制二创短片，时长约 20 秒',
                'Self-made fan short film, about 20 seconds'
              )}
            />
            {!playing && (
              <button
                type="button"
                className="sw-film-play"
                onClick={startFilm}
                aria-label={t('播放短片', 'Play the film')}
              >
                <span className="sw-film-play-disc" aria-hidden="true">
                  <Play size={22} strokeWidth={0} fill="currentColor" />
                </span>
                <span className="sw-film-play-label">{t('播放', 'Play')}</span>
              </button>
            )}
          </div>
          <figcaption className="sw-caption sw-caption--dark">
            {t(
              '【俩啥子百万撤离！！】· 19.969s · 4:3 · 用户点击后播放',
              '“Liangshazi Million Evacuation!!” · 19.969s · 4:3 · plays only on your click'
            )}
          </figcaption>
        </figure>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Section shell                                                        */
/* ------------------------------------------------------------------ */

export const SelectedWork: React.FC<SelectedWorkProps> = ({ language }) => {
  const zh = language === 'zh';
  const t: T = (zhText, enText) => (zh ? zhText : enText);

  return (
    <section id="work" className="sw-section" aria-labelledby="sw-heading">
      <header className="sw-head page-width">
        <p className="eyebrow sw-head-eyebrow">
          {t('01—04 / 几件放进世界里的东西', '01—04 / A few things I’ve put into the world')}
        </p>
        <h2 id="sw-heading" className="sw-heading">
          {t('Selected', 'Selected')}{' '}
          <em className="serif">{t('works.', 'works.')}</em>
        </h2>
      </header>

      <FlovartStage t={t} language={language} />
      <CpaStage t={t} />
      <OfferuStage t={t} zh={zh} />
      <CreatorStage t={t} zh={zh} />

      <footer className="sw-foot page-width">
        <Link to="/portfolio" className="text-link sw-archive-link">
          <span>{t('完整档案 · Portfolio', 'Full archive · Portfolio')}</span>
          <ArrowUpRight size={15} strokeWidth={2.2} aria-hidden="true" />
        </Link>
      </footer>
    </section>
  );
};

export default SelectedWork;
