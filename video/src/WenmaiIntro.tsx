import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  Img,
  staticFile,
} from "remotion";

const INK = "#1a1a1a";
const CREAM = "#f8f7f4";
const RED = "#E63946";

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Logo: React.FC = () => {
  return (
    <AbsoluteFill style={{ pointerEvents: "none", padding: 40 }}>
      <div style={{ alignSelf: "flex-start", marginLeft: "auto", width: 96, height: 96 }}>
        <Img src={staticFile("logo.png")} style={{ width: 96, height: 96, objectFit: "contain" }} />
      </div>
    </AbsoluteFill>
  );
};

const SceneFrame: React.FC<{ children: React.ReactNode; bg?: string }> = ({
  children,
  bg = CREAM,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: bg, color: INK, fontFamily: "Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif" }}>
      {children}
      <Logo />
    </AbsoluteFill>
  );
};

const Stagger: React.FC<{ items: React.ReactNode[]; delay?: number; gap?: number }> = ({
  items, delay = 0, gap = 8,
}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {items.map((it, i) => {
        const start = delay + i * gap;
        const o = interpolate(frame, [start, start + 10], [0, 1], { ...clamp, easing: ease });
        const y = interpolate(frame, [start, start + 10], [12, 0], { ...clamp, easing: ease });
        return (
          <div key={i} style={{ opacity: o, transform: `translateY(${y}px)` }}>
            {it}
          </div>
        );
      })}
    </>
  );
};

const Scene01Title: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 18], [0, 1], { ...clamp, easing: ease });
  const y = interpolate(frame, [0, 24], [40, 0], { ...clamp, easing: ease });
  const so = interpolate(frame, [18, 32], [0, 1], { ...clamp, easing: ease });
  return (
    <SceneFrame>
      <AbsoluteFill style={{ padding: 160, justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: 12, height: 12, backgroundColor: RED, marginBottom: 40, opacity: o }} />
        <div style={{ fontSize: 220, fontWeight: 900, letterSpacing: -8, lineHeight: 0.85, opacity: o, transform: `translateY(${y}px)` }}>
          文脉·AI
        </div>
        <div style={{ marginTop: 32, fontSize: 44, fontWeight: 700, opacity: so, color: INK }}>
          生成式AI驱动的文化IP数字化与沉浸式体验平台
        </div>
        <div style={{ marginTop: 20, fontSize: 28, fontFamily: "monospace", opacity: so, color: "rgba(26,26,26,0.5)" }}>
          某一线地市央企 · 2026
        </div>
      </AbsoluteFill>
    </SceneFrame>
  );
};

const Scene02Positioning: React.FC = () => {
  return (
    <SceneFrame>
      <AbsoluteFill style={{ padding: 140, justifyContent: "center" }}>
        <div style={{ fontFamily: "monospace", fontSize: 24, color: "rgba(26,26,26,0.4)", marginBottom: 28 }}>
          01 / 品牌定位
        </div>
        <div style={{ fontSize: 72, fontWeight: 900, letterSpacing: -2, lineHeight: 1.05 }}>
          为文旅文博、政府宣传、文化企业，<br />让传统文化IP <span style={{ color: RED }}>活</span>起来。
        </div>
        <div style={{ marginTop: 80, display: "flex", gap: 32 }}>
          <Stagger
            delay={24}
            gap={10}
            items={[
              <QuadCard num="01" title="IP 活化新生" desc="让静态文物、历史人物通过数字技术活起来" />,
              <QuadCard num="02" title="多元沉浸传播" desc="短视频 / 直播 / VR 互动，千人千面" />,
              <QuadCard num="03" title="智能降本增效" desc="数字人替代人工，降低运营成本" />,
            ]}
          />
        </div>
      </AbsoluteFill>
    </SceneFrame>
  );
};

const QuadCard: React.FC<{ num: string; title: string; desc: string }> = ({ num, title, desc }) => {
  return (
    <div style={{ width: 460, border: `2px solid ${INK}`, padding: 28, backgroundColor: CREAM }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span style={{ fontSize: 36, fontWeight: 900 }}>{title}</span>
        <span style={{ fontFamily: "monospace", fontSize: 22, color: "rgba(26,26,26,0.4)" }}>{num}</span>
      </div>
      <div style={{ marginTop: 16, fontSize: 22, color: "rgba(26,26,26,0.7)", lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
};

const Scene03Capabilities: React.FC = () => {
  const pills = [
    { tag: "AI 数字人", desc: "多模态大模型驱动，拟人化交互" },
    { tag: "AI 电影感短片", desc: "云原生架构，文化内容智能生成与复原" },
    { tag: "AI 互动游戏", desc: "政企安全合规底座，沉浸式文化互动" },
  ];
  return (
    <SceneFrame>
      <AbsoluteFill style={{ padding: 140, justifyContent: "center" }}>
        <div style={{ fontFamily: "monospace", fontSize: 24, color: "rgba(26,26,26,0.4)", marginBottom: 28 }}>
          02 / 核心能力
        </div>
        <div style={{ fontSize: 92, fontWeight: 900, letterSpacing: -3, marginBottom: 60 }}>
          三个核心载体
        </div>
        <Stagger
          delay={18}
          gap={12}
          items={pills.map((p) => (
            <div style={{ display: "flex", alignItems: "center", gap: 28, padding: 24, borderBottom: `2px solid ${INK}` }}>
              <div style={{ width: 16, height: 16, backgroundColor: RED }} />
              <div style={{ fontSize: 56, fontWeight: 900 }}>{p.tag}</div>
              <div style={{ fontSize: 30, color: "rgba(26,26,26,0.6)", marginLeft: "auto" }}>{p.desc}</div>
            </div>
          ))}
        />
      </AbsoluteFill>
    </SceneFrame>
  );
};

const CaseLayout: React.FC<{
  idx: string;
  title: React.ReactNode;
  background: string;
  pipeline: string;
  effect: string;
}> = ({ idx, title, background, pipeline, effect }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 16], [0, 1], { ...clamp, easing: ease });
  return (
    <SceneFrame>
      <AbsoluteFill style={{ padding: 140, justifyContent: "center" }}>
        <div style={{ fontFamily: "monospace", fontSize: 24, color: "rgba(26,26,26,0.4)", marginBottom: 28 }}>
          {idx}
        </div>
        <div style={{ fontSize: 86, fontWeight: 900, letterSpacing: -2, lineHeight: 1.05, opacity: o, marginBottom: 50 }}>
          {title}
        </div>
        <Stagger
          delay={18}
          gap={10}
          items={[
            <Row label="案例背景" text={background} />,
            <Row label="创作链路" text={pipeline} />,
            <Row label="应用成效" text={effect} />,
          ]}
        />
      </AbsoluteFill>
    </SceneFrame>
  );
};

const Row: React.FC<{ label: string; text: string }> = ({ label, text }) => {
  return (
    <div style={{ display: "flex", paddingTop: 18, paddingBottom: 18, borderBottom: `1px solid rgba(26,26,26,0.15)` }}>
      <div style={{ width: 180, fontSize: 24, fontFamily: "monospace", color: RED }}>{label}</div>
      <div style={{ flex: 1, fontSize: 30, lineHeight: 1.5, color: "rgba(26,26,26,0.85)" }}>{text}</div>
    </div>
  );
};

const Scene04Case1: React.FC = () => {
  return (
    <CaseLayout
      idx="03 / 标杆案例一"
      title={<>AI 年会出征<br />电影短片</>}
      background="面向某地市分公司年会传播需求，创作三分钟“春促出征”电影感短片。"
      pipeline="AI 完成脚本拆解、角色视觉、分镜生成、后期整合，全流程生产。"
      effect="成片在公司内外播放展示，验证多模型兼容与电影感风格控制能力。"
    />
  );
};

const Scene05Case2: React.FC = () => {
  return (
    <CaseLayout
      idx="04 / 标杆案例二"
      title={<>镇长数字人<br />主持形象制作</>}
      background="面向政企高层宣传需求，定制镇长数字人主持形象，支撑招商、政策宣讲。"
      pipeline="AI 完成真人形象建模、动作设计、口型同步、音色复刻、成片合成。"
      effect="交付验证数字人定制、音画同步能力，为后续发布会场景提供可复制样板。"
    />
  );
};

const Scene06Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 24], [0, 1], { ...clamp, easing: ease });
  const scale = interpolate(frame, [0, 28], [0.9, 1], { ...clamp, easing: ease });
  return (
    <SceneFrame bg={INK}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", color: CREAM }}>
        <div style={{ width: 12, height: 12, backgroundColor: RED, marginBottom: 36, opacity: o }} />
        <div style={{ fontSize: 140, fontWeight: 900, letterSpacing: -4, opacity: o, transform: `scale(${scale})` }}>
          以科技重塑文化边界
        </div>
        <div style={{ marginTop: 32, fontFamily: "monospace", fontSize: 30, color: "rgba(248,247,244,0.5)", opacity: o }}>
          文脉·AI — 某一线地市央企 · 2026
        </div>
      </AbsoluteFill>
    </SceneFrame>
  );
};

export const WenmaiIntro: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={fps * 5}>
        <Scene01Title />
      </Sequence>
      <Sequence from={fps * 5} durationInFrames={fps * 6}>
        <Scene02Positioning />
      </Sequence>
      <Sequence from={fps * 11} durationInFrames={fps * 7}>
        <Scene03Capabilities />
      </Sequence>
      <Sequence from={fps * 18} durationInFrames={fps * 7}>
        <Scene04Case1 />
      </Sequence>
      <Sequence from={fps * 25} durationInFrames={fps * 7}>
        <Scene05Case2 />
      </Sequence>
      <Sequence from={fps * 32} durationInFrames={fps * 6}>
        <Scene06Closing />
      </Sequence>
    </AbsoluteFill>
  );
};