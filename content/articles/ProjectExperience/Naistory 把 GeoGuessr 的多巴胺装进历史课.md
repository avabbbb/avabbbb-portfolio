---
title: "Naistory：把 GeoGuessr 的多巴胺装进历史课"
date: 2026-06-27
---

> 一个让你"穿越"到历史现场的猜地点猜时间游戏。玩家看到一张 AI 生成的全景图，在地图上落子、在时间轴上定年，双维度评分。本文记录这个项目从玩法构思到工程实现的完整决策链。

## 一、为什么做这个

GeoGuessr 的核心快感很简单：**看一眼 scenery，在地图上赌一把**。那种"我好像在哪儿见过这种树"的直觉碰撞，加上揭晓答案时的恍然大悟，构成了一条极其短促的多巴胺回路。

但 GeoGuessr 只考空间维度。人类对时间的感知同样依赖直觉——你看到盔甲样式、建筑材质、武器形制，脑中会模糊地浮现"这大概是某朝某代"。这个直觉目前没有任何产品在系统地训练和检验它。

Naistory 的出发点就是：**把"猜地点"扩展成"猜地点 + 猜时间"，用一张全景图同时考验你的地理直觉和历史直觉。**

一张图，两个赌注，一万个积分。

## 二、核心玩法循环

```
全景图展示 → 玩家环顾观察线索
           → 在世界地图上落子（猜地点）
           → 输入年份（猜时间，支持公元前/公元后）
           → 提交 → 揭晓答案 + 双维度评分 + 历史科普
           → 下一轮 → … → 总结页
```

每轮满分 10,000 分：**地点 7,000 + 时间 3,000**。这个 7:3 的权重不是拍脑袋——地理位置是主线索（全景图本质是空间信息），时间是辅助推断（依赖服饰、器物等文化知识），主辅之分体现在分值上。

## 三、评分算法：比想象中更复杂

### 3.1 为什么用指数衰减而不是线性

最初直觉是线性扣分：偏 1000 公里扣多少分，偏 2000 公里扣双倍。但线性评分有个致命问题：**远距离猜测的惩罚过重，玩家失去翻盘动力**。

假设正确答案是斯大林格勒，你猜在了莫斯科（偏约 900 公里）。线性模型下你可能已经扣掉了大部分分数，但直觉上"同一国家、同一战区"不该是零分。

最终采用了指数衰减：

```typescript
function calculateLocationScore(distanceKm: number): number {
  return Math.round(7000 * Math.exp(-distanceKm / 500));
}

function calculateTimeScore(yearDiff: number): number {
  return Math.round(3000 * Math.exp(-yearDiff / 100));
}
```

指数衰减的关键特性：**近距离时区分度高，远距离时给底线分**。

- 偏 50km → 6,345 分（精准）
- 偏 500km → 2,577 分（同一个大区域）
- 偏 2000km → 127 分（错了大洲，但不是零）

这跟 GeoGuessr 的体感一致：差几百公里你觉得"还不错"，差一个大洲你拿个安慰分，但永远不是零——零分太挫败了。

### 3.2 争议地点怎么办：radiusKm 机制

赤壁之战是个典型问题：**史料记载的地点至今有争议**，蒲圻、黄州、嘉鱼都是候选。如果硬编码一个坐标，玩家猜在另一个候选点反而被扣分，这不公平。

解决方案是在 challenge 里加 `radiusKm` 字段，评分时先减去半径再计算：

```typescript
const effectiveKm = Math.max(0, rawKm - (challenge.correctLocation.radiusKm ?? 0));
```

斯大林格勒位置确定，`radiusKm: 20`（城市级精度）；赤壁有争议，`radiusKm: 80`。玩家在 80km 范围内任意位置都视为"命中"，不因学术争议被惩罚。揭晓时还会显示 `uncertaintyNote` 解释这个争议。

**这个设计的核心思想：游戏不应该因为学术不确定性而惩罚玩家的正确直觉。**

### 3.3 时间范围事件

很多历史事件不是某一天，而是一段时期。斯大林格勒战役是 1942 年 8 月到 1943 年 2 月。如果玩家猜 1943，不该被扣分。

```typescript
function getYearDiff(guessYear, startYear, endYear?) {
  if (endYear === undefined) return Math.abs(guessYear - startYear);
  if (guessYear >= startYear && guessYear <= endYear) return 0;
  return Math.min(
    Math.abs(guessYear - startYear),
    Math.abs(guessYear - endYear)
  );
}
```

猜在范围内 → 零误差满分；猜在范围外 → 取到最近边界的距离。简洁且符合直觉。

## 四、公元前与公元后：没有 Year Zero

这是整个项目里最隐蔽的 bug 来源，也是我在代码里最自豪的设计。

**历史纪年没有公元 0 年**。公元前 1 年的下一年直接是公元 1 年。但如果你在代码里用整数表示年份（BCE 用负数），你会不自觉地引入一个不存在的 year 0：

```
直觉写法（错）：  ... -2, -1, 0, 1, 2 ...
历史实际：        ... 2 BCE, 1 BCE, 1 CE, 2 CE ...
```

这会导致所有跨 BCE/CE 边界的时间计算差一年。比如"公元前 44 年到公元 476 年相隔多少年"——直觉写 `476 - (-44) = 520`，实际是 `476 + 44 - 1 = 519` 年。

我的解决方案是引入一条连续的数学轴，把不连续性推到展示层：

```typescript
// CONVENTION: proleptic Gregorian decimal, NO YEAR ZERO.
export function bce(calendarYear: number): AxisYear {
  return 1 - calendarYear;  // bce(1) = 0, bce(44) = -43, bce(2334) = -2333
}

export function ce(calendarYear: number): AxisYear {
  return calendarYear;      // ce(1) = 1, ce(1942) = 1942
}
```

关键设计决策：**用一条连续的浮点轴表示时间，不连续性只存在于人类可读的展示层**。所有时间计算在轴上操作，天然避开了 year zero 陷阱。展示时用 `formatYear()` 转回 "44 BCE" / "1942 CE"。

这套 `era.ts` 是项目级共享模块，year zero bug 在整个项目里不可能出现。

## 五、架构决策：为什么选 Vanilla TS 而不是 React

这个项目有一个前置应用 Genesis（古文明地图），已经是 Vanilla TS + Vite。Naistory 是叠加在它之上的游戏层。

### 5.1 MapLibre 的特殊需求

MapLibre GL 的地图实例是命令式的：你拿到一个 `Map` 对象，调 `.addLayer()`、`.setCenter()`。在 React 里你得用 `useRef` 持有实例、用 `useEffect` 管理生命周期、小心翼翼地避免重渲染时重建地图。

Vanilla TS 的 factory 模式天然适配这种命令式 API：

```typescript
export function createMapGuessPanel(): MapGuessPanel {
  const container = document.createElement("div");
  const map = new maplibregl.Map({ container, ... });
  return { element: container, getGuess, revealAnswer, clear, destroy };
}
```

没有虚拟 DOM diff 开销，没有 effect 依赖数组陷阱，地图实例的生命周期完全可控。

### 5.2 与现有代码的一致性

引入 React 意味着两套心智模型、两个运行时。**一致性本身就是一种架构价值**——后来者不需要判断"这个文件该用哪种范式"。

## 六、按需加载：25KB 的游戏不该拖慢首页

第一版实现里，游戏代码和 Genesis 一起打包，初始 bundle 929KB。但用户打开页面时只想看地图，游戏是点了按钮才进去的——**100% 的用户为 5% 会点进游戏的用户多加载了代码**。

三层拆分：

```
index.js          47 KB   ← Genesis 应用（初始加载）
vendor-maplibre  801 KB   ← MapLibre（共用，独立 vendor chunk）
GameShell.js      77 KB   ← 游戏全部代码（点击时加载）
```

策略：

1. **`import("./game/ui/GameShell")`** 动态导入
2. **hover 预加载**——鼠标移到按钮上时就预取 chunk
3. **maplibre-gl 独立 vendor chunk**——应用代码变更不会让用户重新下载 800KB

| 指标             | 优化前       | 优化后                       |
| ---------------- | ------------ | ---------------------------- |
| 初始 JS（gzip）  | 260 KB       | 235 KB（含 maplibre vendor） |
| 游戏代码（gzip） | 含在初始包里 | 25 KB，按需加载              |
| 应用代码（gzip） | 含在初始包里 | 17 KB，独立可缓存            |

## 七、全景图渲染：两种模式一个接口

全景图有两种来源：真正的 360° 等距柱状投影（equirectangular）和普通宽幅图。前者用 pannellum 渲染成可拖动的球面视图，后者做简单的左右拖拽平移。

```typescript
export function createPanoramaViewer(opts: {
  imageUrl: string;
  mode: "equirectangular" | "wide";
  alt: string;
}): PanoramaViewer
```

调用方永远不关心是哪种模式——`mode` 字段写在 challenge 数据里，factory 内部分支处理。如果等距柱状图加载失败，自动降级到占位提示。

背后的产品决策是：**AI 生成的全景图不总是能完美无缝拼接**。`wide` 模式是安全网——宁可降级为可拖动宽图，也不要让玩家看到撕裂的接缝。

## 八、视觉设计：羊皮纸美学

- **配色**：羊皮纸底色 `#efe5cb`，墨水色文字 `#3c2c18`，黄铜色点缀 `#9c7a3c`
- **字体**：标题用 IM Fell English（17 世纪雕刻体风格），正文用 EB Garamond，中文用霞鹜文楷
- **质感**：按钮带物理按压感（`translateY(2px)` + 阴影收缩），卡片有内阴影和厚边框，难度等级用印章式 badge

这不是 Material Design 也不是 Flat Design，是一种"博物馆展品标签"的质感——与历史主题在视觉语义上一致。

## 九、下一步：1v1 竞技场

MVP 是单人模式，但设计时已经为多人留了接口。竞技场分三层：

1. **Tier 1 — 传递对战**：两人轮流用同一设备，零后端，纯前端计时计分
2. **Tier 2 — WebSocket 中继**：实时同步两端状态，同一张图同时猜
3. **Tier 3 — 排位天梯**：ELO 评分系统，赛季制

Tier 1 可以在不加任何后端的情况下上线。这符合项目一贯的策略：**先用最小成本验证核心乐趣，再逐步加复杂度**。

## 总结

Naistory 不是一个技术上炫技的项目——没有微服务，没有 LLM runtime，没有实时渲染管线。它的价值在于**每一个决策都有明确的理由**：

- 指数衰减评分 → 因为线性会杀死翻盘动力
- radiusKm 机制 → 因为学术争议不该惩罚玩家
- 连续时间轴 → 因为 year zero 是真实 bug 来源
- Vanilla TS → 因为 MapLibre 是命令式的
- 按需加载 → 因为 95% 的用户不进游戏

好的工程不是用了什么技术，而是知道每个技术选择为什么这样选。