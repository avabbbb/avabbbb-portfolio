import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { ArticleCategory } from '../types';
import type { Language } from '../types';
import './case-study.css';
import { PromoVideo } from './PromoVideo';

const JOURNAL_CATEGORY: Record<CaseStudyProps['slug'], string> = {
  flovart: ArticleCategory.FLOVART.toLowerCase(),
  cpa: ArticleCategory.AIEXPLORATION.toLowerCase(),
  offeru: ArticleCategory.AIEXPLORATION.toLowerCase(),
};

/* ------------------------------------------------------------------ */
/* Shared editorial primitives                                          */
/* ------------------------------------------------------------------ */

type T = (zh: string, en: string) => string;

interface CaseStudyProps {
  slug: 'flovart' | 'cpa' | 'offeru';
  language: Language;
}

/** Short external source link — visible by default, underline on hover. */
const Src: React.FC<{ href: string; zh: string; en: string; language: Language }> = ({
  href,
  zh,
  en,
  language,
}) => (
  <a
    className="cs-src"
    href={href}
    target="_blank"
    rel="noreferrer noopener"
  >
    {language === 'zh' ? zh : en}
    <ArrowUpRight size={11} strokeWidth={2.4} aria-hidden="true" />
  </a>
);

/** Full-bleed figure with tiny caption + optional open-original link. */
const ArtFigure: React.FC<{
  src: string;
  alt: string;
  caption: string;
  language: Language;
  dark?: boolean;
  contain?: boolean;
  width?: number;
  height?: number;
}> = ({ src, alt, caption, language, dark, contain, width, height }) => (
  <figure className={`cs-figure ${dark ? 'cs-figure--dark' : ''}`}>
    <a
      className="cs-figure-frame sticker"
      style={{ '--tilt': '-1deg' } as React.CSSProperties}
      href={src}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={language === 'zh' ? '打开原图' : 'Open original image'}
    >
      <i className="tape tape--r" aria-hidden="true" />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        className={contain ? 'cs-figure-img--contain' : undefined}
      />
    </a>
    <figcaption className="cs-caption">
      <span>{caption}</span>
      <a href={src} target="_blank" rel="noreferrer noopener" className="cs-open-original">
        {language === 'zh' ? '打开原图' : 'Open original'} ↗
      </a>
    </figcaption>
  </figure>
);

/** Evidence list item: mono index + linked document. */
const EvidenceItem: React.FC<{
  index: string;
  title: string;
  note: string;
  href: string;
  language: Language;
}> = ({ index, title, note, href, language }) => (
  <li className="cs-evidence-item">
    <span className="cs-evidence-index" aria-hidden="true">{index}</span>
    <div>
      <a href={href} target="_blank" rel="noreferrer noopener" className="cs-evidence-title">
        {title}
        <ArrowUpRight size={12} strokeWidth={2.4} aria-hidden="true" />
      </a>
      <p className="cs-evidence-note">{note}</p>
    </div>
  </li>
);

/** Inline `<code>` chip. */
const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code className="cs-code">{children}</code>
);

/** Section kicker: mono number + ruled label. */
const Kicker: React.FC<{ num: string; label: string }> = ({ num, label }) => (
  <div className="cs-kicker">
    <span className="cs-kicker-num">{num}</span>
    <span className="cs-kicker-label">{label}</span>
  </div>
);

/* ------------------------------------------------------------------ */
/* Flovart                                                              */
/* ------------------------------------------------------------------ */

const FlovartCase: React.FC<{ language: Language }> = ({ language }) => {
  const t: T = (zh, en) => (language === 'zh' ? zh : en);
  const zh = language === 'zh';

  return (
    <>
      {/* ——— Masthead: massive title over warm sage spread ——— */}
      <header className="cs-mast cs-mast--flovart">
        <p className="cs-eyebrow tilt-label tilt-label--acid">{t('案例研究 · 开源', 'Case study · Open source')}</p>
        <h1 className="cs-title-flovart" aria-label="Flovart">
          <span aria-hidden="true">Flovart</span>
        </h1>
        <p className="cs-lede cs-lede--flovart">
          {t(
            '一个开源的 Agent 原生视觉制作工作区——人和 coding agent 编辑同一张实时画布。本地优先，BYOK 图像/视频模型。',
            'An open-source, agent-native visual production workspace where humans and coding agents edit the same live canvas — local-first, BYOK image/video models.'
          )}
        </p>
        <dl className="cs-meta cs-meta--flovart">
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
            <dd>{t('137 stars · 392 commits', '137 stars · 392 commits')}</dd>
          </div>
          <div>
            <dt>{t('入口', 'Entry')}</dt>
            <dd>
              <Src
                href="https://github.com/avabbbb/Flovart"
                zh="仓库"
                en="Repo"
                language={language}
              />{' '}
              ·{' '}
              <Src
                href="https://avabbbb.github.io/Flovart/"
                zh="在线体验"
                en="Live demo"
                language={language}
              />
            </dd>
          </div>
        </dl>
      </header>

      <PromoVideo project="flovart" language={language} />
      {/* ——— Hero artwork: the real workflow canvas ——— */}
      <ArtFigure
        src="/media/flovart-workflow.webp"
        alt={t(
          'Flovart Workflow 画布：节点编排与生成记录的实时工作区',
          'The Flovart Workflow canvas: a live workspace for node orchestration and generation records'
        )}
        caption={t(
          'Workflow 主画布 · 1869×890 实截图。人和外部 agent 看到的是同一张画布。',
          'The Workflow canvas, 1869×890 actual capture. The human and an external agent see the same surface.'
        )}
        language={language}
        width={1869}
        height={890}
      />

      {/* ——— Problem ——— */}
      <section className="cs-section" aria-labelledby="flovart-problem">
        <Kicker num="01" label={t('问题', 'The problem')} />
        <div className="cs-body">
          <h2 id="flovart-problem" className="cs-h2">
            {t('工具之间的缝隙吃掉制作', 'The gaps between tools eat the making')}
          </h2>
          <p>
            {t(
              '做了一年 AIGC 交付后，真实的生产流程是在即梦、剪映、网盘、Excel 之间反复倒手——七八个工具，每个工具只握有一段真相。素材在一处，生成记录在另一处，版本靠记忆。更根本的问题是，AI 创作工具强迫你在两种形态之间二选一：要么是一个只有人能用的可视化编辑器，要么是一个人不透明的自动化 agent。',
              'A year of AIGC delivery work meant real production bounced between Jimeng for generation, Jianying for cutting, a cloud drive for assets, and a spreadsheet for versions — seven or eight tools, each holding only one slice of the truth. More fundamentally, AI creative tools force a choice between two shapes: a visual editor only a human can drive, or an autonomous agent the human can no longer see into.'
            )}
          </p>
          <p>
            {t(
              'Flovart 的起点是拒绝这个二选一。画布本身才是产品——人类直接拖、连、改；agent 通过类型化操作读写同一个画布。两边不存在"你的界面"和"我的界面"。',
              'Flovart starts by refusing that choice. The canvas itself is the product — a human drags, connects and edits it directly; an agent reads and writes the same canvas through typed operations. There is no "your UI" versus "my UI."'
            )}
          </p>
        </div>
      </section>

      {/* ——— Architecture: labeled diagram ——— */}
      <section className="cs-section cs-section--sage" aria-labelledby="flovart-arch">
        <Kicker num="02" label={t('系统', 'The system')} />
        <div className="cs-body">
          <h2 id="flovart-arch" className="cs-h2">
            {t('三个面，一个权威', 'Three surfaces, one authority')}
          </h2>
          <p>
            {t(
              'README 把自己的边界说得很清楚：Flovart 是三个面——Workflow 管生成编排，Table 管素材预处理，Agent 管生产控制。三个面投影的是同一份底层状态，不是三个互相拷贝的产品。',
              'The README states its own boundary plainly: Flovart is three surfaces — Workflow for generation orchestration, Table for media preprocessing, Agent for production control. All three project the same underlying state; they are not three copies of one product.'
            )}
          </p>
        </div>

        <figure className="cs-diagram" role="img"
          aria-label={t(
            'Flovart 架构图：人类创作者与 coding agent 通过类型化操作共同作用于实时 Workflow，再落到本地素材与产物',
            'Flovart architecture: a human creator and a coding agent act on the same live Workflow through typed operations, landing on local assets and artifacts'
          )}>
          <div className="cs-diagram-row">
            <div className="cs-diagram-node cs-diagram-node--ink">
              {t('人类创作者', 'Human creator')}
              <span>{t('直接拖拽 / 连接 / 编辑', 'direct drag · connect · edit')}</span>
            </div>
            <div className="cs-diagram-node cs-diagram-node--ink">
              {t('Coding agent', 'Coding agent')}
              <span>Flovart Link + CLI</span>
            </div>
          </div>
          <div className="cs-diagram-arrow" aria-hidden="true">↓</div>
          <div className="cs-diagram-node cs-diagram-node--accent">
            {t('实时 Workflow', 'Live Workflow')}
            <span>{t('同一张画布 · 唯一权威', 'one canvas · the only authority')}</span>
          </div>
          <div className="cs-diagram-arrow" aria-hidden="true">↓</div>
          <div className="cs-diagram-row">
            <div className="cs-diagram-node">
              {t('本地素材与产物', 'Local assets + artifacts')}
              <span>{t('生成记录随项目落盘', 'generation history persists with the project')}</span>
            </div>
            <div className="cs-diagram-node">
              {t('Provider 适配', 'Provider adapters')}
              <span>{t('BYOK · 不内置模型服务', 'BYOK · no bundled model service')}</span>
            </div>
          </div>
          <figcaption className="cs-caption">
            {t(
              '架构如实绘制：Table 是独立的工作面，不与 Workflow 混写；agent 不抓屏，只走类型化操作。',
              'Diagram drawn honestly: Table is a separate surface, not blended into Workflow; the agent never screen-scrapes — it speaks typed operations only.'
            )}
          </figcaption>
        </figure>

        <div className="cs-body">
          <p>
            {t(
              'agent 的动作面是一组类型化操作，不是屏幕坐标：status、workflow.inspect、workflow.selection.get、workflow.apply、workflow.node.run、ensure、doctor。这决定了协作的形状——agent 能观察、能提议、能执行，但它做的每一步和人做的一样可读、可回退。',
              'The agent surface is a set of typed operations, not screen coordinates: status, workflow.inspect, workflow.selection.get, workflow.apply, workflow.node.run, ensure, doctor. That decides the shape of collaboration — the agent can observe, propose and execute, and every step it takes is as legible and reversible as a human\'s.'
            )}
          </p>
          <p>
            {t(
              '本地优先是边界而非口号。项目、素材、生成记录都在浏览器存储里；API key 进加密 localforage 保险柜——README 原话是"浏览器是密钥边界的一部分"。ffmpeg.wasm 在浏览器内跑本地视频/音频处理。没有云同步承诺，跨端同步仍在 pending。',
              'Local-first is a boundary, not a slogan. Projects, assets and generation history live in browser storage; API keys sit in an encrypted localforage vault — the README\'s own phrasing is that "the browser is part of the secret boundary." ffmpeg.wasm runs video and audio work inside the browser. Cloud sync is not promised; cross-entry sync is still pending.'
            )}
          </p>
        </div>
      </section>

      {/* ——— Evidence: recorded material ——— */}
      <section className="cs-section" aria-labelledby="flovart-evidence">
        <Kicker num="03" label={t('证据', 'Evidence')} />
        <div className="cs-body">
          <h2 id="flovart-evidence" className="cs-h2">
            {t('录下来的，才算数', 'What\'s recorded is what counts')}
          </h2>
          <p>
            {t(
              'Flovart 的证据纪律写在仓库里：README 只放有复现记录的片段，DEMO_RECORDING.md 留完整复现流程，SUPPORT_MATRIX.md 把 Beta、Experimental、Planned 冻结成发布口径。模型付费生成"故意不录"——没有真实 provider 就没有诚实的画面。',
              'Flovart\'s evidence discipline lives in the repo: the README only ships clips that carry a reproduction record, DEMO_RECORDING.md keeps the full reproduction steps, and SUPPORT_MATRIX.md freezes what is Beta, Experimental or Planned. Model-backed generation is "deliberately not filmed" — without a real provider there is no honest footage.'
            )}
          </p>
        </div>

        <figure className="cs-figure cs-figure--recording">
          <video
            className="cs-video"
            controls
            muted
            playsInline
            preload="metadata"
            poster="/media/flovart-live.webp"
            aria-label={t(
              '外部 coding agent 通过类型化 CLI 驱动实时 Workflow 的录屏',
              'Screen recording of an external coding agent driving a live Workflow through the typed CLI'
            )}
          >
            <source src="/media/flovart-live.mp4" type="video/mp4" />
          </video>
          <figcaption className="cs-caption">
            {t(
              '真实录屏：WorkBuddy codebuddy（hy4-preview-f）经类型化 CLI 在实时 Workflow 里建 3 个节点、2 条连接。本地演示记录，非生产成功证据；无付费模型调用。',
              'Actual recording: a WorkBuddy codebuddy agent (hy4-preview-f) creates 3 nodes and 2 connections in a live Workflow via the typed CLI. A recorded local demo — not production-success evidence; no paid model calls.'
            )}
          </figcaption>
        </figure>

        <div className="cs-body">
          <h3 className="cs-h3">{t('诚实的边界', 'The honest limits')}</h3>
          <ul className="cs-limits">
            <li>
              {t(
                'Table 和 Agent 是真实入口，但 README 明说"剩余实现工作未呈现为已完成"。',
                'Table and Agent are real entries, but the README states their remaining implementation work is "not presented as complete."'
              )}
            </li>
            <li>
              {t(
                '代码里存在 adapter 不等于付费 provider 已认证；OpenAI-compatible BYOK 标注为 Experimental。',
                'An adapter in the code is not a paid-provider certification; OpenAI-compatible BYOK is labeled Experimental.'
              )}
            </li>
            <li>
              {t(
                '唯一 Beta agent 路径是 Codex CLI + Browser Workflow（5 次连续真实 codex exec，v0.154.0）；唯一 Beta provider 是 RunningHub（待认证）。其余均 Experimental 或 Planned。',
                'The only Beta agent path is Codex CLI + Browser Workflow (5 consecutive real codex exec trials, v0.154.0); the only Beta provider is RunningHub, pending certification. Everything else is Experimental or Planned.'
              )}
            </li>
          </ul>
        </div>

        <ul className="cs-evidence" aria-label={t('证据清单', 'Evidence list')}>
          <EvidenceItem
            index="01"
            title={t('README · 定位与边界自述', 'README · positioning and stated boundaries')}
            note={t('"Agent-native"的定义、三个面、本地优先与 BYOK 的官方表述', 'The canonical phrasing of agent-native, the three surfaces, local-first and BYOK')}
            href="https://github.com/avabbbb/Flovart"
            language={language}
          />
          <EvidenceItem
            index="02"
            title="SUPPORT_MATRIX.md"
            note={t('Beta / Experimental / Planned 的冻结发布口径', 'The frozen Beta / Experimental / Planned release contract')}
            href="https://github.com/avabbbb/Flovart/blob/main/SUPPORT_MATRIX.md"
            language={language}
          />
          <EvidenceItem
            index="03"
            title="DEMO_RECORDING.md"
            note={t('hero GIF 与 20 条功能片段的完整复现记录', 'Full reproduction record for the hero GIF and 20 feature clips')}
            href="https://github.com/avabbbb/Flovart/blob/main/DEMO_RECORDING.md"
            language={language}
          />
          <EvidenceItem
            index="04"
            title={t('在线体验', 'Live demo')}
            note={t('avabbbb.github.io/Flovart · 中文界面，Workflow / Table / Agent 三个面可见', 'avabbbb.github.io/Flovart — Chinese UI, Workflow / Table / Agent surfaces visible')}
            href="https://avabbbb.github.io/Flovart/"
            language={language}
          />
        </ul>
      </section>

      {/* ——— Reflection ——— */}
      <section className="cs-section cs-section--flovart-reflect" aria-labelledby="flovart-reflect">
        <div className="cs-body">
          <p className="cs-pull">
            {t(
              '画布是唯一的权威。人不替 agent 翻译，agent 不替人决定——两边操作的是同一份状态，这一步做对了，剩下的协作才有意义。',
              'The canvas is the only authority. The human does not translate for the agent, and the agent does not decide for the human — both operate on the same state. Get that one thing right and the rest of the collaboration becomes meaningful.'
            )}
          </p>
        </div>
      </section>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* CPA                                                                  */
/* ------------------------------------------------------------------ */

const CpaCase: React.FC<{ language: Language }> = ({ language }) => {
  const t: T = (zh, en) => (language === 'zh' ? zh : en);

  return (
    <>
      {/* ——— Dark terminal masthead ——— */}
      <header className="cs-mast cs-mast--cpa">
        <p className="cs-eyebrow cs-eyebrow--dark tilt-label tilt-label--gold">
          {t('案例研究 · 上游贡献', 'Case study · Upstream contribution')}
        </p>
        <h1 className="cs-title-cpa">
          CLIProxyAPI
          <span className="cs-title-cpa-sub">{t('Devin 修复', 'Devin fixes')}</span>
        </h1>
        <p className="cs-lede cs-lede--cpa">
          {t(
            '同一个 Devin Free 账号：官方 CLI 能调 swe-1-6-slow，CPA 却报 quota error。一个 additive 补丁补全 model contract，第二个窄化修复把 transient "high demand" 从误判 403 改回 429。三个 PR 同日 merge，进 v7.3.5。',
            'Same Devin Free account: the official CLI could call swe-1-6-slow while CPA returned a quota error. One additive patch completed the model contract; a second narrow fix reclassified transient "high demand" from a mistaken 403 to 429. Three PRs merged the same day, shipped in v7.3.5.'
          )}
        </p>
        <dl className="cs-meta cs-meta--cpa">
          <div>
            <dt>{t('角色', 'Role')}</dt>
            <dd>{t('上游贡献者', 'Upstream contributor')}</dd>
          </div>
          <div>
            <dt>{t('仓库', 'Repo')}</dt>
            <dd>52.6k stars · Go</dd>
          </div>
          <div>
            <dt>{t('发布', 'Release')}</dt>
            <dd>v7.3.5 · 2026-09-16</dd>
          </div>
          <div>
            <dt>{t('合并', 'Merged')}</dt>
            <dd>#5867 · #5870 · models#58</dd>
          </div>
        </dl>

        {/* Diff hero */}
        <div className="cs-terminal" role="img"
          aria-label={t(
            'Devin 模型契约的差异示意：CPA 目录补上 swe-1-6-slow，同时保留 swe-1-6、swe-1-7、swe-2 原有映射',
            'Diff of the Devin model contract: the CPA catalog gains swe-1-6-slow while swe-1-6, swe-1-7 and swe-2 mappings are preserved'
          )}>
          <div className="cs-terminal-bar" aria-hidden="true">
            <span /><span /><span />
            <em>devin_wire.go — model contract</em>
          </div>
          <pre className="cs-terminal-body"><code>{`  devin/swe-1-6   → swe-1-6        ${t('（保留）', '(kept)')}
  devin/swe-1-7   → swe-1-7        ${t('（保留）', '(kept)')}
  devin/swe-2     → swe-2          ${t('（保留）', '(kept)')}
+ devin/swe-1-6-slow → swe-1-6-slow   ${t('（新增）', '(added)')}`}</code></pre>
        </div>
      </header>

      {/* ——— Problem ——— */}
      <section className="cs-section cs-section--cpa" aria-labelledby="cpa-problem">
        <Kicker num="01" label={t('问题', 'The problem')} />
        <div className="cs-body">
          <h2 id="cpa-problem" className="cs-h2">
            {t('模型看得到，调不通', 'Visible, but not callable')}
          </h2>
          <p>
            {t(
              '在本地 Windows 主机部署 CPA 搭 coding-agent 基础设施，经 Cloudflare Tunnel 暴露 OpenAI-compatible API。链路正常——OAuth 能登录、模型目录能读——但模型看得到却调不通。同一个 Devin Free 账号，官方 CLI 的 SWE-1.6 工作正常，CPA 报 permission_denied / insufficient_quota。',
              'CPA was deployed on a local Windows host as coding-agent infrastructure, exposing an OpenAI-compatible API through a Cloudflare Tunnel. The pipeline worked — OAuth signed in, the model catalog read fine — but models were visible yet uncallable. On the same Devin Free account, the official CLI ran SWE-1.6 normally while CPA returned permission_denied / insufficient_quota.'
            )}
          </p>
          <p>
            {t(
              '最顺手的假设是"Free 账号 quota 为零"——听起来合理，但没有证据。真正的定位来自同账号 A/B：官方 CLI 实际暴露并使用的是 swe-1-6-slow，而 CPA 的目录里只有 devin/swe-1-6。源码确认 CPA 不认识 -slow 这个 Devin UID 后缀。',
              'The easiest hypothesis was "Free-tier quota is zero" — plausible-sounding but unevidenced. The real diagnosis came from a same-account A/B: the official CLI actually exposes and uses swe-1-6-slow, while CPA\'s catalog only knew devin/swe-1-6. Source reading confirmed CPA didn\'t recognize -slow as a Devin UID suffix.'
            )}
          </p>
        </div>
      </section>

      {/* ——— Decision 1: additive ——— */}
      <section className="cs-section" aria-labelledby="cpa-additive">
        <Kicker num="02" label={t('决策一', 'Decision one')} />
        <div className="cs-body">
          <h2 id="cpa-additive" className="cs-h2">
            {t('加，不换', 'Add, don\'t replace')}
          </h2>
          <p>
            {t(
              '最短路径是把 swe-1-6 强制映射到 -slow——"我能跑就行"。但 Pro 用户还在用原 UID，改掉会伤到人。PR #5867 做的是 additive：目录新增 devin/swe-1-6-slow，识别 -slow 后缀，补 resolver 回归覆盖，并明确 "Preserve all existing mappings for swe-1-6, swe-1-7, and swe-2"。issue 里有人提过按套餐映射的方案，最终没有采用——合并的就是 additive 版。',
              'The shortest path was forcing swe-1-6 to remap to -slow — "works for me." But Pro users still rely on the original UID; changing it would break them. PR #5867 stayed additive: the catalog gains devin/swe-1-6-slow, the -slow suffix is recognized, resolver regression coverage is added, and the PR states it preserves all existing mappings for swe-1-6, swe-1-7 and swe-2. A plan-aware mapping was suggested in the issue and deliberately not implemented — what merged is the additive version.'
            )}
          </p>
          <p>
            {t(
              '第二个发现是 CPA 的模型目录同时内嵌在代码里并从独立的 router-for-me/models 仓库刷新——所以修复需要两个 PR：代码一处，目录一处。',
              'A second finding: CPA\'s model catalog is both embedded in code and refreshed from a separate router-for-me/models repo — so the fix needed two PRs, one in each place.'
            )}
          </p>
        </div>
      </section>

      {/* ——— Decision 2: 403 → 429 ——— */}
      <section className="cs-section cs-section--cpa-dark" aria-labelledby="cpa-429">
        <Kicker num="03" label={t('决策二', 'Decision two')} />
        <div className="cs-body">
          <h2 id="cpa-429" className="cs-h2">
            {t('把 403 的误判收窄', 'Narrowing the 403 misclassification')}
          </h2>
          <p>
            {t(
              '模型修复上线后第二层 bug 浮出来：模型偶发"假死"——后续请求 ~9ms 就返回、同一个 trace ID 反复出现、重启后恢复。定位结果是 Devin 上游把 transient 高负载编码成 Connect permission_denied 且消息含 "high demand"；CPA 把每个 permission_denied 都映射成 HTTP 403，而冷却管理器见到 403 就给这个模型记 30 分钟冷却。上游早就恢复了，CPA 还在替它坐满半小时。',
              'After the model fix shipped, a second-layer bug surfaced: the model would sporadically "go dead" — follow-up requests returned in ~9ms with the same trace ID, recovering only after a restart. The trace: Devin upstream encodes transient capacity pressure as Connect permission_denied with a message containing "high demand"; CPA mapped every permission_denied to HTTP 403, and the cooldown manager treats 403 as a 30-minute model-permission cooldown. Upstream had long recovered; CPA was still serving the sentence for it.'
            )}
          </p>
          <p>
            {t(
              'PR #5870 的修复刻意收窄：只有 permission_denied 且消息含 "high demand"（不区分大小写）才改判 429。真正的权限错误仍是 403，resource_exhausted 仍是 429，全局冷却规则不动——和现有模式一致（invalid_argument 查 "internal error"，failed_precondition 查 quota/credit 关键词）。PR 自带 4 个新测试用例覆盖边界。',
              'PR #5870 stays deliberately narrow: only permission_denied whose message contains "high demand" (case-insensitive) is reclassified to 429. Genuine permission errors remain 403, resource_exhausted remains 429, global cooldown rules untouched — matching existing conventions (invalid_argument checks "internal error", failed_precondition checks quota/credit keywords). The PR ships four new test cases covering the boundary.'
            )}
          </p>
        </div>

        <div className="cs-terminal cs-terminal--inline" role="img"
          aria-label={t(
            '错误语义差异：permission_denied 加 high demand 消息改判 429，其他 permission_denied 保持 403',
            'Error-semantics diff: permission_denied carrying a high-demand message becomes 429; other permission_denied stays 403'
          )}>
          <div className="cs-terminal-bar" aria-hidden="true">
            <span /><span /><span />
            <em>ParseDevinTrailerError — narrow reclassify</em>
          </div>
          <pre className="cs-terminal-body"><code>{`  permission_denied                    → 403  ${t('（真权限错误，不变）', '(real perm error, unchanged)')}
+ permission_denied + "high demand"      → 429  ${t('（容量瞬时，改判）', '(transient capacity, reclassified)')}
  resource_exhausted                     → 429  ${t('（不变）', '(unchanged)')}`}</code></pre>
        </div>

        <div className="cs-body">
          <p className="cs-honest-note">
            {t(
              '诚实的边界：429 修复系在 "high demand" 这个消息子串上；上游若换一种方式编码瞬时容量问题，仍会落到 403。同账号 A/B 是观测性的——#5863 记录了修复前 CPA 根本无法路由 swe-1-6-slow，所以修复前的直接对照不可得；修复后同账号同构建验证 devin/swe-1-6-slow→200、devin/swe-1-6→403。',
              'Honest edge: the 429 fix keys on the "high demand" message substring; a different encoding of transient capacity would still land on 403. The same-account A/B is observational — #5863 records that CPA could not route swe-1-6-slow at all pre-fix, so a pre-fix direct comparison was impossible; post-fix, the same account and build show devin/swe-1-6-slow→200 vs devin/swe-1-6→403.'
            )}
          </p>
        </div>
      </section>

      {/* ——— Evidence: legible documents ——— */}
      <section className="cs-section" aria-labelledby="cpa-evidence">
        <Kicker num="04" label={t('证据', 'Evidence')} />
        <div className="cs-body">
          <h2 id="cpa-evidence" className="cs-h2">
            {t('以文档的方式读证据', 'Read the evidence as documents')}
          </h2>
          <p>
            {t(
              '三个 PR 同一天 merge 进 upstream，进入 v7.3.5。Release Notes 的 What\'s Changed 列出两个修复，New Contributors 写明 "@avabbbb made their first contribution in #5867"。下游 Homebrew 公式同版本跟进。以下两份原件足够说明问题，放大读。',
              'Three PRs merged upstream the same day and shipped in v7.3.5. The release notes\' What\'s Changed lists both fixes, and New Contributors records "@avabbbb made their first contribution in #5867". The downstream Homebrew formula followed at the same version. Two primary documents below are worth reading at full size.'
            )}
          </p>
        </div>

        <div className="cs-docs">
          <ArtFigure
            src="/cpa/pr-5867.png"
            alt={t('PR #5867：additive 补丁补全 Devin model contract', 'PR #5867: the additive patch completing the Devin model contract')}
            caption={t('PR #5867 · 新增 devin/swe-1-6-slow，保留全部既有映射', 'PR #5867 · adds devin/swe-1-6-slow, preserves every existing mapping')}
            language={language}
            dark
            contain
          />
          <ArtFigure
            src="/cpa/release.png"
            alt={t('v7.3.5 Release Notes：两个修复与 New Contributor 记录', 'v7.3.5 release notes: both fixes and the New Contributor record')}
            caption={t('v7.3.5 Release · What\'s Changed 列出两修复；New Contributors: @avabbbb', 'v7.3.5 Release · What\'s Changed lists both fixes; New Contributors: @avabbbb')}
            language={language}
            dark
            contain
          />
        </div>

        <ul className="cs-evidence" aria-label={t('证据清单', 'Evidence list')}>
          <EvidenceItem index="01" title="CLIProxyAPI PR #5867"
            note={t('Additive model-contract 补丁 · commit 44f8343 · maintainer luispater merge', 'Additive model-contract patch · commit 44f8343 · merged by maintainer luispater')}
            href="https://github.com/router-for-me/CLIProxyAPI/pull/5867" language={language} />
          <EvidenceItem index="02" title="CLIProxyAPI PR #5870"
            note={t('403→429 窄化重分类 · commit 4613cfd · 4 个新测试用例', 'Narrow 403→429 reclassification · commit 4613cfd · 4 new test cases')}
            href="https://github.com/router-for-me/CLIProxyAPI/pull/5870" language={language} />
          <EvidenceItem index="03" title="router-for-me/models PR #58"
            note={t('独立模型目录同步 · commit 4a65185', 'Sync PR for the separate model catalog · commit 4a65185')}
            href="https://github.com/router-for-me/models/pull/58" language={language} />
          <EvidenceItem index="04" title={t('Issue #5863 · 模型契约缺失', 'Issue #5863 · missing model contract')}
            note={t('问题报告 · 已标记 Fixed', 'The original report · labeled Fixed')}
            href="https://github.com/router-for-me/CLIProxyAPI/issues/5863" language={language} />
          <EvidenceItem index="05" title={t('Issue #5869 · 403 误判冷却', 'Issue #5869 · 403 miscooldown')}
            note={t('第二层 bug 报告 · 含源码引用 · 已标记 Fixed', 'The second-layer report with source references · labeled Fixed')}
            href="https://github.com/router-for-me/CLIProxyAPI/issues/5869" language={language} />
          <EvidenceItem index="06" title="Release v7.3.5"
            note={t('tag b681a1e · GPG 签名 · New Contributor: @avabbbb', 'tag b681a1e · GPG-signed · New Contributor: @avabbbb')}
            href="https://github.com/router-for-me/CLIProxyAPI/releases" language={language} />
        </ul>
      </section>

      {/* ——— Reflection ——— */}
      <section className="cs-section cs-section--cpa-reflect" aria-labelledby="cpa-reflect">
        <div className="cs-body">
          <p className="cs-pull">
            {t(
              '上游贡献最有价值的部分不是补丁，是忍住：忍住"改成我能跑"的冲动，忍住把错误语义一刀切宽的冲动。两个修复都选择了最窄的那一刀。',
              'The most valuable part of an upstream contribution isn\'t the patch — it\'s restraint. Resisting "make it work for me," resisting the urge to widen error semantics. Both fixes chose the narrowest cut available.'
            )}
          </p>
        </div>
      </section>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* OfferU                                                               */
/* ------------------------------------------------------------------ */

const OfferuCase: React.FC<{ language: Language }> = ({ language }) => {
  const t: T = (zh, en) => (language === 'zh' ? zh : en);

  return (
    <>
      {/* ——— Dossier masthead ——— */}
      <header className="cs-mast cs-mast--offeru">
        <div className="cs-dossier-head">
          <p className="cs-eyebrow tilt-label tilt-label--acid">{t('案例研究 · 内部 Beta', 'Case study · Internal Beta')}</p>
          <p className="cs-dossier-stamp">{t('机密 · 仅供审阅', 'File · for review')}</p>
        </div>
        <h1 className="cs-title-offeru">
          <span className="serif">OfferU</span>
        </h1>
        <p className="cs-lede cs-lede--offeru">
          {t(
            '本地优先的 AI Career OS：研究岗位、定制简历、追踪申请、从每次面试里学习。所有 Agent 推断先成为候选与提案，人审核之后才落库。',
            'A local-first AI Career OS: research jobs, tailor resumes, track applications, learn from every interview. Every agent inference lands as a candidate or proposal; nothing becomes career truth until a person reviews it.'
          )}
        </p>
        <dl className="cs-meta cs-meta--offeru">
          <div>
            <dt>{t('角色', 'Role')}</dt>
            <dd>{t('独立设计 / 开发', 'Solo design & build')}</dd>
          </div>
          <div>
            <dt>{t('协议', 'License')}</dt>
            <dd>MIT</dd>
          </div>
          <div>
            <dt>{t('栈', 'Stack')}</dt>
            <dd>FastAPI · React · Tauri · SQLite</dd>
          </div>
          <div>
            <dt>{t('状态', 'Status')}</dt>
            <dd>{t('Internal Beta · 未签发安装包', 'Internal Beta · no signed installer')}</dd>
          </div>
        </dl>
      </header>

      <PromoVideo project="offeru" language={language} />
      {/* ——— Two real screenshots, dossier spread ——— */}
      <div className="cs-dossier-spread">
        <ArtFigure
          src="/media/offeru-today.webp"
          alt={t('OfferU Today 工作台：今天变化与需要处理的事', 'The OfferU Today workbench: what changed and what needs attention')}
          caption={t('Today 面 · 1024×576 README 实截图。只投影状态，不复制状态。', 'The Today surface · 1024×576 README capture. It projects state — it does not duplicate it.')}
          language={language}
          contain
          width={1024}
          height={576}
        />
        <ArtFigure
          src="/media/offeru-resume.webp"
          alt={t('OfferU 简历工作区：按岗位定制，AI 只生成带前后对照的提案', 'The OfferU resume workspace: per-job tailoring where AI only proposes diffs')}
          caption={t('Resume 工作区 · 提案逐条接受/拒绝，版本按岗位留存。', 'The Resume workspace · proposals are accepted or rejected line-by-line, versions kept per job.')}
          language={language}
          contain
          width={1024}
          height={576}
        />
      </div>

      {/* ——— Problem ——— */}
      <section className="cs-section" aria-labelledby="offeru-problem">
        <Kicker num="01" label={t('问题', 'The problem')} />
        <div className="cs-body">
          <h2 id="offeru-problem" className="cs-h2">
            {t('漂亮的简历，编出来的经历', 'Polished resumes, invented experience')}
          </h2>
          <p>
            {t(
              '自己投过一轮简历后最清楚的教训：市面上的 AI 简历工具直接生成漂亮成品，但里面的经历是模型编的——面试官追问细节，当场穿帮。同时求职工具链是碎的：简历在一处，调研在另一处，申请进度在表格里，面试准备从零开始。',
              'After a round of applications myself, the clearest lesson was this: most AI resume tools generate polished output with invented experience — the moment an interviewer digs into details, it falls apart. And the toolchain is fragmented: resume in one place, research in another, tracking in a spreadsheet, interview prep from scratch.'
            )}
          </p>
          <p>
            {t(
              'OfferU 反过来做。它不替人"生成"职业生涯，而是把求职当成一个事实系统来管：观察进来成为 Event 或 Candidate，Runtime 理解状态，CareerTask 规划工作，Operation 执行或提议，验证后的状态才落库，Today 和 Pipeline 投影同一份状态。',
              'OfferU inverts it. Instead of "generating" a career for you, it treats the job search as a fact system: observations enter as Events or Candidates, the Runtime understands state, a CareerTask plans the work, an Operation executes or proposes, verified state is committed, and Today and Pipeline project the same state.'
            )}
          </p>
        </div>
      </section>

      {/* ——— Architecture: three authorities ——— */}
      <section className="cs-section cs-section--offeru-arch" aria-labelledby="offeru-arch">
        <Kicker num="02" label={t('架构', 'Architecture')} />
        <div className="cs-body">
          <h2 id="offeru-arch" className="cs-h2">
            {t('三种权威，故意分开', 'Three authorities, deliberately separated')}
          </h2>
          <p>
            {t(
              'ARCHITECTURE.md 把边界画得很硬：Agent 是推理权威，可替换（本地检测到 Codex / Claude Code / OpenCode；API 配置是兜底）——它推理、规划、选工具，但"永远不拥有业务真相"。Operation Registry 是执行权威，校验 schema、权限、副作用、dry-run、提案、审计——GUI、CLI、TUI、skill、agent 集成都走它。Python FastAPI Career Runtime 是真相权威，SQLite 独占 Profile / Jobs / Applications / Resumes / Interviews / Memory。',
              'ARCHITECTURE.md draws the boundary hard: the agent is the reasoning authority — replaceable (locally detected Codex / Claude Code / OpenCode; API config is the fallback) — it reasons, plans and selects tools but "never owns business truth." The Operation Registry is the execution authority — it validates schema, permissions, side effects, dry runs, proposals and audit; every surface (GUI, CLI, TUI, skills, agent integrations) goes through it. The Python FastAPI Career Runtime is the truth authority — SQLite solely owns Profile, Jobs, Applications, Resumes, Interviews and Memory.'
            )}
          </p>
        </div>

        <figure className="cs-dossier-flow" role="img"
          aria-label={t(
            'OfferU 真相流：Observe → Event/Candidate → Runtime 理解 → CareerTask 规划 → Operation 执行或提案 → 验证后提交 → Today/Pipeline 投影',
            'OfferU truth flow: Observe → Event/Candidate → Runtime understands → CareerTask plans → Operation executes or proposes → verified commit → Today/Pipeline project'
          )}>
          <ol className="cs-flow-list">
            {[
              t('观察', 'Observe'),
              'Event / Candidate',
              t('Runtime 理解状态', 'Runtime understands'),
              t('CareerTask 规划', 'CareerTask plans'),
              t('Operation 执行或提案', 'Operation executes or proposes'),
              t('验证后提交', 'Verified commit'),
              t('Today / Pipeline 投影', 'Today / Pipeline project'),
            ].map((step, i) => (
              <li key={i} className="cs-flow-step">
                <span className="cs-flow-index">{String(i + 1).padStart(2, '0')}</span>
                {step}
              </li>
            ))}
          </ol>
          <figcaption className="cs-caption">
            {t(
              '自然语言的"我已更新"不是成功证明——只有成功提交的 Operation 才能改变正式状态。',
              'A natural-language "I\'ve updated it" is not proof of success — only a committed Operation changes official state.'
            )}
          </figcaption>
        </figure>

        <div className="cs-body">
          <p>
            {t(
              '简历工作区是这套边界最好的例子：按岗位定制走 source_resume_id + target_job_id；AI 只生成带前后对照的 Proposal，逐条接受或拒绝；workspace_snapshot_hash 阻止过期提案覆盖人的最新修改；ResumeVersion 留存每份岗位简历的版本。没有 ResumeAgent——岗位简历是一个 CareerTask，由可替换的 agent runtime 选受控 Operation 执行。',
              'The resume workspace is the clearest expression of this boundary: per-job tailoring runs on source_resume_id + target_job_id; AI only generates Proposals with before/after diffs, accepted or rejected line by line; workspace_snapshot_hash blocks stale proposals from overwriting a person\'s latest edits; ResumeVersion keeps every per-job version. There is no ResumeAgent — job-resume work is a CareerTask, executed by the replaceable agent runtime through controlled Operations.'
            )}
          </p>
        </div>
      </section>

      {/* ——— Decisions ——— */}
      <section className="cs-section" aria-labelledby="offeru-decisions">
        <Kicker num="03" label={t('决策', 'Decisions')} />
        <div className="cs-body">
          <h2 id="offeru-decisions" className="cs-h2">
            {t('宁可少做，不做假的', 'Rather do less than do it fake')}
          </h2>
          <ul className="cs-decisions">
            <li>
              <strong>{t('证据驱动。', 'Evidence-driven. ')}</strong>
              {t(
                'AI 建议不会静默成为职业事实——一律走候选流进审核收件箱；职业证据保留出处。',
                'AI suggestions never silently become career facts — they travel a candidate flow into a review inbox; career evidence keeps its provenance.'
              )}
            </li>
            <li>
              <strong>{t('人控。', 'Human-controlled. ')}</strong>
              {t(
                '浏览器自动化可以辅助表单，但"不得静默提交申请"；外部不可逆动作必须经人显式操作。验证码、登录、最终提交一律交还人。',
                'Browser automation may assist forms but "must not silently submit applications"; external irreversible actions require explicit user action. CAPTCHAs, logins and final submits always return to a human.'
              )}
            </li>
            <li>
              <strong>{t('密钥边界。', 'Key boundary. ')}</strong>
              {t(
                'API key 进 OS keyring（Windows Credential Manager / macOS Keychain / Linux Secret Service），配置里只留 credential_ref，无明文兜底。',
                'API keys live in the OS keyring (Windows Credential Manager / macOS Keychain / Linux Secret Service); config holds only a credential_ref, with no plaintext fallback.'
              )}
            </li>
            <li>
              <strong>{t('连接已有的 agent。', 'Connect the agent you already have. ')}</strong>
              {t(
                'AI 设置哲学是 Connect → Auto → Ready：检测本机已有的 Codex / Claude Code / OpenCode 并消费它自己的模型与凭据，不需要 API key；API 配置收进 Advanced，只留 OpenAI-compatible 与 Anthropic-compatible 两个协议。',
                'The setup philosophy is Connect → Auto → Ready: detect a local Codex / Claude Code / OpenCode the user already has and consume its own model and auth — no API key needed; API config hides behind Advanced with just two protocols, OpenAI-compatible and Anthropic-compatible.'
              )}
            </li>
            <li>
              <strong>{t('合成数据必须标记。', 'Synthetic data must be labeled. ')}</strong>
              {t(
                'Replay/Fixture 是显式的合成模式，必须在 UI 和产物中标记；Live Provider 失败保留 failed/blocked 状态，不静默降级成成功。',
                'Replay/Fixture is an explicit synthetic mode that must be labeled in UI and artifacts; a failed Live Provider keeps a failed/blocked state instead of silently degrading to success.'
              )}
            </li>
          </ul>
        </div>
      </section>

      {/* ——— Evidence + honest status ——— */}
      <section className="cs-section" aria-labelledby="offeru-evidence">
        <Kicker num="04" label={t('证据', 'Evidence')} />
        <div className="cs-body">
          <h2 id="offeru-evidence" className="cs-h2">
            {t('仓库怎么说，就怎么写', 'Write what the repo says')}
          </h2>
          <p>
            {t(
              '23 stars、4 forks、230 commits。仓库结构分成 agent-runtime / backend / frontend / extension / integrations / plugins / deliverables / docs/adr。README 自报状态是 Internal Beta——源码可查看，签名安装包尚未发布；STATUS.md、RELEASE_CHECKLIST.md、QUALITY_SCORE.md、KNOWN_ISSUES.md 作为发布门禁存在。',
              '23 stars, 4 forks, 230 commits. The repo is organized into agent-runtime / backend / frontend / extension / integrations / plugins / deliverables / docs/adr. The README self-reports Internal Beta — source available, signed installer not yet released; STATUS.md, RELEASE_CHECKLIST.md, QUALITY_SCORE.md and KNOWN_ISSUES.md exist as release gates.'
            )}
          </p>
          <p>
            {t(
              '诚实的边界也写在仓库里：roadmap 自己承认 Live Role Intelligence 需要"至少一条真实外部调研路径端到端验证"——即尚未端到端验证。没有公开的在线 demo（本地优先桌面应用，入口是 127.0.0.1:7410）。这里没有编出来的成功率。',
              'The honest limits are also in the repo: its own roadmap admits Live Role Intelligence still needs "at least one real external research path validated end to end" — i.e., not yet validated. There is no public demo URL (it is a local-first desktop app; the entry point is 127.0.0.1:7410). No fabricated success rates here.'
            )}
          </p>
        </div>

        <ul className="cs-evidence" aria-label={t('证据清单', 'Evidence list')}>
          <EvidenceItem index="01" title={t('README · 定位与四个面', 'README · positioning and the four surfaces')}
            note={t('Today / Pipeline / Job / Profile 的官方表述与截图清单', 'Canonical phrasing of Today / Pipeline / Job / Profile with screenshot inventory')}
            href="https://github.com/avabbbb/OfferU" language={language} />
          <EvidenceItem index="02" title="ARCHITECTURE.md"
            note={t('三种权威分离与真相流的原始文档', 'The source document for the three authorities and the truth flow')}
            href="https://github.com/avabbbb/OfferU/blob/main/ARCHITECTURE.md" language={language} />
          <EvidenceItem index="03" title={t('仓库结构', 'Repository structure')}
            note={t('agent-runtime / backend / frontend / extension / integrations / plugins / deliverables / docs/adr', 'agent-runtime / backend / frontend / extension / integrations / plugins / deliverables / docs/adr')}
            href="https://github.com/avabbbb/OfferU" language={language} />
        </ul>
      </section>

      {/* ——— Reflection ——— */}
      <section className="cs-section cs-section--offeru-reflect" aria-labelledby="offeru-reflect">
        <div className="cs-body">
          <p className="cs-pull">
            {t(
              '简历工具最容易犯的错是把"看起来对"当成"是真的"。OfferU 的全部架构都在抵抗这一个错误：推断先提案，人审再落库。',
              'The easiest mistake a resume tool can make is treating "looks right" as "is true." OfferU\'s entire architecture exists to resist that one mistake: inference proposes, a person reviews, then truth is committed.'
            )}
          </p>
        </div>
      </section>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Shell                                                                */
/* ------------------------------------------------------------------ */

const ORDER: Array<{ slug: CaseStudyProps['slug']; zh: string; en: string }> = [
  { slug: 'flovart', zh: 'Flovart', en: 'Flovart' },
  { slug: 'cpa', zh: 'CLIProxyAPI', en: 'CLIProxyAPI' },
  { slug: 'offeru', zh: 'OfferU', en: 'OfferU' },
];

export const CaseStudy: React.FC<CaseStudyProps> = ({ slug, language }) => {
  const zh = language === 'zh';
  const index = ORDER.findIndex((o) => o.slug === slug);
  const next = ORDER[(index + 1) % ORDER.length];

  return (
    <article className={`cs-page cs-page--${slug}`}>
      {/* Back to work index */}
      <nav className="cs-back" aria-label={zh ? '返回' : 'Back'}>
        <Link to="/#work" className="cs-back-link">
          <ArrowLeft size={15} strokeWidth={2.4} aria-hidden="true" />
          {zh ? '返回作品' : 'Back to work'}
        </Link>
      </nav>

      {slug === 'flovart' && <FlovartCase language={language} />}
      {slug === 'cpa' && <CpaCase language={language} />}
      {slug === 'offeru' && <OfferuCase language={language} />}

      {/* Next case */}
      <footer className="cs-next">
        <Link to={`/articles/${JOURNAL_CATEGORY[slug]}`} className="cs-journal-link">
          {zh ? '开发日志' : 'Dev log'} ↗
        </Link>
        <Link to={`/work/${next.slug}`} className="cs-next-link">
          <span className="cs-next-label">{zh ? '下一个案例' : 'Next case'}</span>
          <span className="cs-next-title">
            {zh ? next.zh : next.en}
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden="true" />
          </span>
        </Link>
      </footer>
    </article>
  );
};

export default CaseStudy;
