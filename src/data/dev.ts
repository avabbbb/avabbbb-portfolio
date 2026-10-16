import { Category, ProjectSource, ArticleCategory } from '../../types';

export const DEV_DATA: ProjectSource[] = [
{
  "id": "dev0",
  "common": {
    "category": Category.DEV,
    "image": "https://opengraph.githubassets.com/1/router-for-me/CLIProxyAPI",
    "githubUrl": "https://github.com/router-for-me/CLIProxyAPI",
    "websiteUrl": "https://github.com/router-for-me/CLIProxyAPI/releases",
    "date": "2026",
    "articleCategory": ArticleCategory.AIEXPLORATION
  },
  "zh": {
    "title": "CLIProxyAPI Devin 贡献",
    "subtitle": "Devin provider model contract 与 error semantics 修复",
    "description": "52.6K Star 开源项目上游贡献者。搭 Coding Agent 基础设施时发现：同一个 Devin Free 账号，官方 CLI 实际调用 swe-1-6-slow 正常，而 CPA 只有 devin/swe-1-6、报 permission_denied / insufficient_quota。通过同账号 A/B 和源码定位确认 model contract 缺少 -slow suffix，提交 additive patch 补齐 swe-1-6-slow variant 并保留全部既有映射。上线后发现 transient 'high demand' 被误判为 403 触发 30 分钟冷却，又提第二个修复将其窄化归类为 429。三个 PR 同日 merge 进 v7.3.5 release，官方 Release Notes 列为 New Contributor。",
    "role": "上游贡献者",
    "tags": [
      "Go",
      "开源贡献",
      "AI Infra",
      "CLIProxyAPI",
      "Devin"
    ],
    "awards": [
      "CLIProxyAPI v7.3.5 Release Notes 正式列出",
      "官方 New Contributor 认证",
      "三个 PR 全部 merge 进 upstream"
    ],
    "sections": [
      {
        "type": "text",
        "title": "项目介绍",
        "content": "在本地 Windows 主机部署 CPA 搭 Coding Agent 基础设施，通过 Cloudflare Tunnel 暴露 OpenAI-compatible API 接 OMP 等 Agent。基础链路正常——OAuth 能登录、模型目录能读取，但出现一个奇怪现象：模型看得到，却调不通。\n\nS（情境）：同一个 Devin Free 账号，官方 CLI 的 SWE-1.6 正常工作，CPA 报 permission_denied / insufficient_quota。最初猜想是 Free 账号 API quota 为 0，但这只是听起来合理的假设，没有证据。\n\nT（任务）：定位根因。设计同账号 A/B 对照实验，比较官方 CLI 和 CPA 实际发送的模型，发现官方暴露的是 swe-1-6-slow 而 CPA 只有 devin/swe-1-6。读源码确认 CPA 的 Devin model contract 缺少 -slow suffix。\n\nA（行动）：没有做'让我自己能跑'的 hack（强制映射），而是做 additive patch——新增 swe-1-6-slow variant，保留原有模型不变，避免影响 Pro 用户。同时发现 CPA 的 catalog 从独立的 router-for-me/models repo 刷新，又给那边提了同步 PR。修复后自编译验证：原 UID 403，新 UID 200。回归测试确认 swe-1-6 旧行为不变、swe-1-7 和 swe-2 不变。\n\n上线后遇到第二层 bug：模型偶发'假死'，后续请求 9ms 就返回、重复相同 trace ID、重启后恢复。定位到 Devin transient 'high demand' 被 CPA 统一归类为 403 permission error，触发 30 分钟冷却。提交第二个修复：permission_denied + 'high demand' → 429，普通 permission_denied → 403 不变，补四类测试覆盖边界。\n\nR（结果）：三个 PR 全部 merge 进 upstream（CLIProxyAPI #5867、router-for-me/models #58、CLIProxyAPI #5870），进入 v7.3.5 release。官方 Release Notes 列出两个修复，New Contributors 里写了 @avabbbb made their first contribution in #5867。\n\n相关链接：\n- CLIProxyAPI #5867：https://github.com/router-for-me/CLIProxyAPI/pull/5867\n- router-for-me/models #58：https://github.com/router-for-me/models/pull/58\n- CLIProxyAPI #5870：https://github.com/router-for-me/CLIProxyAPI/pull/5870\n- v7.3.5 Release：https://github.com/router-for-me/CLIProxyAPI/releases"
      },
      {
        "type": "demo",
        "title": "错误语义管线演示",
        "demoUrl": "/demos/cpa-pipeline.html",
        "height": 620
      },
      {
        "type": "gallery",
        "title": "真实记录",
        "layout": "grid-2",
        "images": ["/cpa/repo.png", "/cpa/release.png", "/cpa/pr-5867.png", "/cpa/pr-5870.png", "/cpa/issue-5863.png", "/cpa/models-58.png"]
      }
    ]
  },
  "en": {
    "title": "CLIProxyAPI Devin Contribution",
    "subtitle": "Devin provider model contract and error semantics fixes",
    "description": "Upstream contributor to a 52.6K-star open-source project. While building Coding Agent infrastructure, found the same Devin Free account worked in the official CLI — which actually calls swe-1-6-slow — while CPA only knew devin/swe-1-6 and returned permission_denied / insufficient_quota. Through same-account A/B and source tracing, confirmed the model contract was missing the -slow suffix and submitted an additive patch preserving all existing mappings. After deployment, found transient 'high demand' was misclassified as 403 causing a mistaken 30-minute cooldown — submitted a second narrow fix classifying it as 429. All three PRs merged same-day into v7.3.5, listed as New Contributor in official release notes.",
    "role": "Upstream Contributor",
    "tags": [
      "Go",
      "Open Source",
      "AI Infra",
      "CLIProxyAPI",
      "Devin"
    ],
    "awards": [
      "Listed in CLIProxyAPI v7.3.5 Release Notes",
      "Official New Contributor recognition",
      "All three PRs merged upstream"
    ],
    "sections": [
      {
        "type": "text",
        "title": "Introduction",
        "content": "Deployed CPA on a local Windows host to build Coding Agent infrastructure, exposing an OpenAI-compatible API via Cloudflare Tunnel to OMP and other agents. The base pipeline worked — OAuth login, model catalog readable — but there was a strange symptom: models were visible but not callable.\n\nS: The same Devin Free account — SWE-1.6 worked in the official CLI, but CPA returned permission_denied / insufficient_quota. The initial guess was Free tier API quota = 0, but that was just a plausible-sounding assumption without evidence.\n\nT: Locate the root cause. Designed a same-account A/B experiment comparing the models actually sent by the official CLI vs CPA, found the official one exposes swe-1-6-slow while CPA only has devin/swe-1-6. Read the source to confirm CPA's Devin model contract was missing the -slow suffix.\n\nA: Didn't do the 'works for me' hack (forced remap), instead made an additive patch — added swe-1-6-slow variant while keeping existing models unchanged, to avoid breaking Pro users. Also discovered CPA's catalog refreshes from an independent router-for-me/models repo, so submitted a sync PR there too. After the fix, verified with a self-compiled build: old UID 403, new UID 200. Regression tests confirmed swe-1-6 unchanged, swe-1-7 and swe-2 unchanged.\n\nAfter deployment, hit a second-layer bug: the model would occasionally 'go silent' — subsequent requests returned in ~9ms with the same trace ID, recovered after restart. Traced it to Devin's transient 'high demand' being classified as 403 permission error by CPA, triggering a 30-minute cooldown. Submitted a second fix: permission_denied + 'high demand' → 429, normal permission_denied → 403 unchanged, with four test cases covering edge cases.\n\nR: All three PRs merged upstream (CLIProxyAPI #5867, router-for-me/models #58, CLIProxyAPI #5870), shipped in v7.3.5. Official Release Notes list both fixes, and New Contributors notes @avabbbb made their first contribution in #5867.\n\nLinks:\n- CLIProxyAPI #5867: https://github.com/router-for-me/CLIProxyAPI/pull/5867\n- router-for-me/models #58: https://github.com/router-for-me/models/pull/58\n- CLIProxyAPI #5870: https://github.com/router-for-me/CLIProxyAPI/pull/5870\n- v7.3.5 Release: https://github.com/router-for-me/CLIProxyAPI/releases"
      },
      {
        "type": "demo",
        "title": "Error-semantics pipeline demo",
        "demoUrl": "/demos/cpa-pipeline.html",
        "height": 620
      },
      {
        "type": "gallery",
        "title": "Evidence",
        "layout": "grid-2",
        "images": ["/cpa/repo.png", "/cpa/release.png", "/cpa/pr-5867.png", "/cpa/pr-5870.png", "/cpa/issue-5863.png", "/cpa/models-58.png"]
      }
    ]
  }
},
{
  "id": "dev1",
  "common": {
    "category": Category.DEV,
    "image": "/flovart-ui.png",
    "githubUrl": "https://github.com/avabbbb/Flovart",
    "websiteUrl": "https://avabbbb.github.io/Flovart/",
    "articleCategory": ArticleCategory.FLOVART
  },
  "zh": {
    "title": "Flovart",
    "subtitle": "本地优先 AI 视频制作系统",
    "description": "0→1 独立设计开发的开源 Agent 原生视觉制作工作区——人和 coding agent 编辑同一张实时画布，本地优先、BYOK 图像/视频模型。做一年 AIGC 交付后发现每次要在即梦、剪映、网盘、Excel 等七八个工具之间倒手，素材和生成记录对不上号，于是把 Workflow 编排、Table 预处理、Agent 生产控制收进同一套状态。前端在 GitHub 开源，137 Star、392 commits。",
    "role": "独立开发者",
    "tags": [
      "AIGC",
      "React",
      "开源",
      "Agent",
      "AI视频"
    ],
    "awards": [
      "GitHub 130+ Stars",
      "小红书开发记录赞藏200+",
      "腾讯AI LAB等专业人士关注"
    ],
    "sections": [
      {
        "type": "text",
        "title": "项目介绍",
        "content": "S（情境）：做了一年 AIGC 交付，真实工作里一条片子要经过即梦抽卡、剪映拼接、网盘传素材、Excel 记版本——每次交付都在七八个工具之间倒手，素材和生成记录根本对不上。更根本的问题是，AI 创作工具强迫二选一：要么只有人能用的可视化编辑器，要么人看不进去的自动化 Agent。\n\nT（任务）：造一个本地优先的 Agent 原生视觉制作工作区——人和 coding agent 编辑同一张实时画布，素材、生成记录、Agent 协作收进同一套状态。README 划清三个面：Workflow 管生成编排、Table 管素材预处理、Agent 管生产控制。\n\nA（行动）：\n- 类型化操作面：Agent 不抓屏，走 status / workflow.inspect / workflow.selection.get / workflow.apply / workflow.node.run / ensure / doctor 这组类型化操作，可读、可回退\n- 同一张画布：人直接拖拽编辑，外部 coding agent 经 Flovart Link + CLI 作用于同一个实时 Workflow\n- BYOK：不内置模型服务，OpenAI-compatible BYOK 标注为 Experimental；唯一 Beta provider 是 RunningHub（待认证）\n- 本地优先：项目、素材、生成记录在浏览器存储，API Key 进加密 localforage 保险柜——README 原话\"浏览器是密钥边界的一部分\"；ffmpeg.wasm 在浏览器内跑本地音视频\n- 证据纪律：README 只放有复现记录的片段，SUPPORT_MATRIX.md 冻结 Beta / Experimental / Planned 口径；模型付费生成\"故意不录\"\n\nR（结果）：前端在 GitHub 开源获 137 Star、392 commits（截至 2026-09-20），AGPL-3.0 协议，在线体验：https://avabbbb.github.io/Flovart/ 。唯一 Beta agent 路径是 Codex CLI + Browser Workflow（5 次连续真实 codex exec，v0.154.0）。\n\n诚实边界（仓库自述）：Table 与 Agent 是真实入口，但\"剩余实现工作未呈现为已完成\"；代码里存在 adapter 不等于付费 provider 已认证；云同步未承诺，跨端同步仍 pending；录屏为本地演示记录，非生产成功证据。"
      },
      {
        "type": "gallery",
        "title": "界面展示",
        "layout": "full",
        "images": ["/flovart-ui.png"]
      },
      {
        "type": "demo",
        "title": "架构演示",
        "demoUrl": "/demos/flovart-architecture.html",
        "height": 620
      }
    ]
  },
  "en": {
    "title": "Flovart",
    "subtitle": "Local-first AI Video Production System",
    "description": "An open-source, agent-native visual production workspace I designed and built solo — humans and coding agents edit the same live canvas, local-first with BYOK image/video models. After a year of AIGC delivery work, the pain was bouncing between seven or eight tools per delivery with assets and generation records that never lined up; Flovart pulls Workflow orchestration, Table preprocessing and Agent production control onto one shared state. Open-source frontend: 137 stars, 392 commits.",
    "role": "Solo Developer",
    "tags": [
      "AIGC",
      "React",
      "Open Source",
      "Agent",
      "AI Video"
    ],
    "awards": [
      "130+ GitHub Stars",
      "200+ likes & saves on Xiaohongshu dev logs",
      "Noticed by Tencent AI LAB professionals"
    ],
    "sections": [
      {
        "type": "text",
        "title": "Introduction",
        "content": "S: After a year of shipping AIGC client work, real production meant bouncing between Jimeng for generation, Jianying for cutting, a cloud drive for assets, and a spreadsheet for versions — seven or eight tools per delivery, and generation records never lined up. More fundamentally, AI creative tools force a choice: a visual editor only a human can drive, or an autonomous agent the human can't see into.\n\nT: Build a local-first, agent-native visual production workspace — humans and coding agents editing the same live canvas, with assets, generation records and agent collaboration in one shared state. The README draws three surfaces: Workflow for generation orchestration, Table for media preprocessing, Agent for production control.\n\nA:\n- Typed operations: the agent never screen-scrapes — it speaks status / workflow.inspect / workflow.selection.get / workflow.apply / workflow.node.run / ensure / doctor, so every step is legible and reversible\n- One canvas: the human edits directly while an external coding agent acts on the same live Workflow through Flovart Link + CLI\n- BYOK: no bundled model service; OpenAI-compatible BYOK is labeled Experimental, and the only Beta provider is RunningHub (pending certification)\n- Local-first: projects, assets and generation history live in browser storage; API keys sit in an encrypted localforage vault — 'the browser is part of the secret boundary'; ffmpeg.wasm runs local audio/video work in-browser\n- Evidence discipline: the README only ships clips with a reproduction record; SUPPORT_MATRIX.md freezes Beta / Experimental / Planned; model-backed generation is deliberately not filmed\n\nR: Open-source frontend at 137 stars and 392 commits (as of 2026-09-20), AGPL-3.0, live demo: https://avabbbb.github.io/Flovart/ . The only Beta agent path is Codex CLI + Browser Workflow (5 consecutive real codex exec trials, v0.154.0).\n\nHonest limits (repo's own words): Table and Agent are real entries but 'remaining implementation work is not presented as complete'; an adapter in code is not a paid-provider certification; cloud sync is not promised and cross-entry sync is pending; recordings are local demos, not production-success evidence."
      },
      {
        "type": "gallery",
        "title": "UI Showcase",
        "layout": "full",
        "images": ["/flovart-ui.png"]
      },
      {
        "type": "demo",
        "title": "Architecture demo",
        "demoUrl": "/demos/flovart-architecture.html",
        "height": 620
      }
    ]
  }
},
{
  "id": "dev2",
  "common": {
    "category": Category.DEV,
    "image": "/offeru-ui.png",
    "githubUrl": "https://github.com/avabbbb/OfferU",
    "date": "2026"
  },
  "zh": {
    "title": "OfferU",
    "subtitle": "本地优先、证据驱动的 AI 求职工作台",
    "description": "自己投过一轮简历后发现：AI 写的简历看起来漂亮，但面试一问就露馅——因为它编造了你不具备的经历。OfferU 反过来做：一个可替换的 agent runtime 负责推理与规划，Operation Registry 负责授权、dry-run、提案与审计，Python FastAPI Career Runtime 独占职业真相——所有 Agent 推断先成为候选与提案，人审核之后才落库。",
    "role": "独立开发者",
    "tags": [
      "Controlled Agent",
      "FastAPI",
      "React",
      "Tauri",
      "本地优先"
    ],
    "awards": [
      "Operation Registry 授权 + 审计边界",
      "受控 Agent · 推断先提案再审",
      "本地优先 · 数据不出本机"
    ],
    "sections": [
      {
        "type": "text",
        "title": "项目介绍",
        "content": "S（情境）：自己投过一轮简历，最深的体会是市面上 AI 简历工具直接生成漂亮成品，但里面的经历是模型编的。面试时被追问细节，当场穿帮。\n\nT（任务）：做一个不编造事实的 AI 求职工作台。核心约束：所有 Agent 推断先成为候选与提案，由使用者审核确认后才落库。\n\nA（行动）：\n- 三种权威分离：可替换的 agent runtime（Codex / Claude Code / OpenCode 本地检测）负责推理、规划、选工具但\"永远不拥有业务真相\"；Operation Registry 校验 schema、权限、副作用、dry-run、提案与审计，所有面都走它；Python FastAPI Career Runtime 在 SQLite 里独占 Profile / Jobs / Applications / Resumes / Interviews / Memory\n- 真相流：Observe → Event/Candidate → Runtime 理解 → CareerTask 规划 → Operation 执行或提案 → 验证后提交 → Today/Pipeline 投影同一状态\n- 简历工作区：按岗位定制走 source_resume_id + target_job_id；AI 只生成带前后对照的 Proposal，逐条接受/拒绝；workspace_snapshot_hash 阻止过期提案覆盖人的修改；ResumeVersion 留存岗位版本。没有 ResumeAgent\n- 四个面：Today（变化与待办）/ Pipeline（阶段与下一步）/ Job（岗位情报、证据缺口、简历、面试准备）/ Profile（长期职业证据）\n- 安全边界：不提供自动提交——浏览器自动化可辅助表单但\"不得静默提交\"，验证码、登录、最终提交交还人工；API key 进 OS keyring，配置只留 credential_ref\n\nR（结果）：MIT 协议开源，Internal Beta——源码可查看、签名安装包未发布；STATUS.md / RELEASE_CHECKLIST.md / KNOWN_ISSUES.md 作为发布门禁存在。本地优先，数据不出本机，入口 http://127.0.0.1:7410。\n\n诚实边界（仓库自述）：Live Role Intelligence 尚未完成端到端验证；Replay/Fixture 是显式合成模式必须标记；provider 失败保留 failed/blocked，不静默降级。"
      },
      {
        "type": "gallery",
        "title": "界面预览",
        "layout": "full",
        "images": ["/offeru-ui.png"]
      },
      {
        "type": "demo",
        "title": "Agent Loop 演示",
        "demoUrl": "/demos/offeru-agent-loop.html",
        "height": 620
      },
      {
        "type": "demo",
        "title": "记忆层级设计",
        "demoUrl": "/demos/offeru-memory.html",
        "height": 560
      }
    ]
  },
  "en": {
    "title": "OfferU",
    "subtitle": "Local-first, evidence-driven AI job-hunting workbench",
    "description": "After going through a round of job applications myself, the deepest lesson was: AI-written resumes look great until the interviewer asks follow-up questions — because the model invents experience you don't have. OfferU inverts that: one replaceable agent runtime reasons and plans, an Operation Registry owns authorization, dry-runs, proposals and audit, and a Python FastAPI Career Runtime is the sole owner of career truth — every agent inference lands as a candidate or proposal that a person reviews before anything is committed.",
    "role": "Solo Developer",
    "tags": [
      "Controlled Agent",
      "FastAPI",
      "React",
      "Tauri",
      "Local-first"
    ],
    "awards": [
      "Operation Registry authorization + audit boundary",
      "Controlled agent · inference proposes, review commits",
      "Local-first · data stays on device"
    ],
    "sections": [
      {
        "type": "text",
        "title": "Introduction",
        "content": "S: After going through a round of job applications, the deepest lesson was that most AI resume tools generate polished output with invented experience. The moment an interviewer digs into details, it falls apart.\n\nT: Build an AI job-hunting workbench that doesn't fabricate facts. Core constraint: every agent inference becomes a candidate or proposal that requires user review before being committed.\n\nA:\n- Three authorities separated: a replaceable agent runtime (locally detected Codex / Claude Code / OpenCode) reasons, plans and selects tools but 'never owns business truth'; an Operation Registry validates schema, permissions, side effects, dry-runs, proposals and audit — every surface goes through it; a Python FastAPI Career Runtime solely owns Profile / Jobs / Applications / Resumes / Interviews / Memory in SQLite\n- Truth flow: Observe → Event/Candidate → Runtime understands → CareerTask plans → Operation executes or proposes → verified commit → Today/Pipeline project the same state\n- Resume workspace: per-job tailoring via source_resume_id + target_job_id; AI only generates Proposals with before/after diffs, accepted or rejected line-by-line; workspace_snapshot_hash blocks stale proposals from overwriting user edits; ResumeVersion keeps per-job versions. No ResumeAgent\n- Four surfaces: Today (what changed / needs attention), Pipeline (stages and next action), Job (role intelligence, evidence gaps, resume, interview prep), Profile (long-term career evidence)\n- Safety boundary: no auto-submit — browser automation may assist forms but 'must not silently submit applications'; CAPTCHAs, logins and final submits return to a human; API keys live in the OS keyring, config holds only a credential_ref\n\nR: Open-sourced under MIT, Internal Beta — source available, signed installer not yet released; STATUS.md / RELEASE_CHECKLIST.md / KNOWN_ISSUES.md exist as release gates. Local-first, data stays on device, entry point http://127.0.0.1:7410.\n\nHonest limits (repo's own words): Live Role Intelligence is not yet validated end-to-end; Replay/Fixture is an explicit synthetic mode that must be labeled; provider failures stay visible as failed/blocked, never silently degraded."
      },
      {
        "type": "gallery",
        "title": "UI Preview",
        "layout": "full",
        "images": ["/offeru-ui.png"]
      },
      {
        "type": "demo",
        "title": "Agent loop demo",
        "demoUrl": "/demos/offeru-agent-loop.html",
        "height": 620
      },
      {
        "type": "demo",
        "title": "Memory layers",
        "demoUrl": "/demos/offeru-memory.html",
        "height": 560
      }
    ]
  }
},
{
  "id": "dev3",
  "common": {
    "category": Category.DEV,
    "image": "/lora/vvacry.png",
    "date": "2026"
  },
  "zh": {
    "title": "SDXL LORA 微调训练",
    "subtitle": "基于 SDXL 的角色 LORA 微调训练",
    "description": "做二创视频需要角色立绘，但 AI 生成的人物每次脸都不一样——这在叙事视频里是致命的。基于 SDXL 底模训练 VVA、Evelyn 等角色的专属 LORA，从素材清洗、打标到调参、迭代，完整走完微调流程，让角色在不同生成图里保持同一张脸。",
    "role": "独立开发者",
    "tags": [
      "SDXL",
      "LORA",
      "AI绘图",
      "微调训练"
    ],
    "awards": [
      "VVA 角色 LORA 模型",
      "Evelyn 角色 LORA 模型"
    ],
    "sections": [
      {
        "type": "text",
        "title": "项目介绍",
        "content": "S（情境）：做二创视频需要角色立绘，但 AI 生成的人物每次脸都不一样——这在叙事视频里是致命的。\n\nT（任务）：给 VVA、Evelyn 等角色训练专属 LORA 模型，让角色在不同构图、不同风格的生成图里保持同一张脸。\n\nA（行动）：\n- 素材工程：收集角色参考素材，完成清洗、裁切与打标\n- 训练配置：基于 SDXL 底模配置 LORA 训练参数（学习率、步数、网络维度等）\n- 迭代验证：多轮训练迭代，验证角色还原度与泛化能力\n- 输出：可复用的角色 LORA 模型文件\n\nR（结果）：VVA、Evelyn 角色 LORA 生成样图见下方图集，角色在不同生成图中保持一致的外貌与画风。"
      },
      {
        "type": "gallery",
        "title": "训练成果",
        "layout": "grid-2",
        "images": ["/lora/vva-1.jpg", "/lora/vva-2.png", "/lora/eve-1.png", "/lora/eve-2.png"]
      }
    ]
  },
  "en": {
    "title": "SDXL LORA Fine-tuning",
    "subtitle": "Character LORA fine-tuning on SDXL",
    "description": "Fan-made videos need consistent character art, but AI-generated faces drift between shots — fatal for narrative work. Trained dedicated LORA models for characters like VVA and Evelyn on the SDXL base — from dataset cleaning and tagging to hyperparameter tuning and iteration — so each character keeps the same face across different generations.",
    "role": "Solo Developer",
    "tags": [
      "SDXL",
      "LORA",
      "AI Art",
      "Fine-tuning"
    ],
    "awards": [
      "VVA character LORA model",
      "Evelyn character LORA model"
    ],
    "sections": [
      {
        "type": "text",
        "title": "Introduction",
        "content": "S: Fan-made videos need consistent character art, but AI-generated faces drift between shots — fatal for narrative work.\n\nT: Train dedicated LORA models for characters like VVA and Evelyn, keeping their appearance and style stable across different compositions and generations.\n\nA:\n- Dataset engineering: collect reference material, then clean, crop and tag\n- Training config: configure LORA hyperparameters on the SDXL base model (learning rate, steps, network dimensions, etc.)\n- Iterate: multiple training rounds, verifying character fidelity and generalization\n- Output: reusable character LORA model files\n\nR: VVA and Evelyn sample generations shown below — characters maintain consistent appearance and style across different generated images."
      },
      {
        "type": "gallery",
        "title": "Training Results",
        "layout": "grid-2",
        "images": ["/lora/vva-1.jpg", "/lora/vva-2.png", "/lora/eve-1.png", "/lora/eve-2.png"]
      }
    ]
  }
}
];
