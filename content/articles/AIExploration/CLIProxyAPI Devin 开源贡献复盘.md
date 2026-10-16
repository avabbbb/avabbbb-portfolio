---
title: "CLIProxyAPI Devin 开源贡献复盘"
date: 2026-09-17
---

在搭自己的 Coding Agent 基础设施时，发现同一个 Devin Free 账号官方 CLI 能用 SWE-1.6，但 CPA 一直报 quota error。最终给上游提了两个修复，都被 merge 进 v7.3.5 release，官方 Release Notes 把我列成了 New Contributor。

## 起因

我在本地 Windows 长期开机主机部署了 CPA，通过 Cloudflare Tunnel 暴露 OpenAI-compatible API，接 OMP 等 Agent。基础链路正常——OAuth 能登录、模型目录能读取，但出现一个奇怪现象：

**模型看得到，却调不通。**

最初很容易归因成：Devin Free 账号只有官方 CLI/Desktop 免费额度，CPA 走另一套 API quota，所以额度为 0。但这只是"听起来合理"，没有证据。

于是设计了一个对照实验：同一个 Devin Free 账号，官方 Devin CLI vs CPA。结果官方 CLI 的 SWE-1.6 正常工作，CPA 报 `permission_denied / insufficient_quota`。这直接推翻了"Free 账号本身没权限"的假设。

## 定位：Model Contract 不匹配

继续比较官方 CLI 和 CPA 实际发送的模型。官方 CLI 暴露的是 `swe-1-6-slow`，CPA 当时暴露的是 `devin/swe-1-6`。看 CPA 运行日志，发现它把 `devin/swe-1-6` 路由到 upstream `swe-1-6`，然后 Devin 返回 `permission_denied`。

读源码确认：CPA 只识别 `swe-1-6` 和 `swe-1-6-fast`，没有 `swe-1-6-slow`。

整理成 Issue #5863，明确说 UID mismatch 是 **likely cause**——因为当时 CPA 甚至无法把 `swe-1-6-slow` 路由到 upstream，最后一个 A/B 证据还缺失。

## 修复：Additive，不破坏现有行为

最简单的 hack 是把 `swe-1-6` 强制映射成 `swe-1-6-slow`，但 Pro 用户可能确实需要裸 `swe-1-6`。最终做 additive patch：新增 `swe-1-6-slow`，保留原有模型不变。只改了 3 个文件、+41/-1，没有改变现有 model mapping。

同时发现 CPA 的 Devin catalog 还会从独立的 `router-for-me/models` repo 刷新。如果只改 CLIProxyAPI embedded catalog，远程 catalog refresh 后可能又被覆盖。所以又给 models repo 提了 #58。

## 验证：Runtime A/B

自编译新 CPA 后完成同账号 A/B：

- 修改前：`devin/swe-1-6` → upstream `swe-1-6` → 403
- 修改后：`devin/swe-1-6-slow` → upstream `swe-1-6-slow` → 200 OK

同时回归验证：`swe-1-6` 旧行为不变，`swe-1-7`、`swe-2` 不变，resolver tests 和 registry tests 全过。

## 第二个 Bug：Error Semantics 影响 Scheduler

修复版部署后 SWE-1.6 Slow 能用了，但运行一段时间后模型突然持续失败。

看日志发现异常信号：后续请求返回极快（约 9ms）、不断重复相同的 upstream trace ID、重启 CPA 后立即恢复。9ms 是关键——真正访问 Devin upstream 不可能这么快，说明请求根本没打出去，在本地被短路了。

最终定位：Devin 在瞬时 capacity / high-demand 状态下返回 `permission_denied` + "high demand" 消息。CPA 统一把 `permission_denied` 映射为 HTTP 403，而后面的 cooldown manager 把 403 理解成真正的权限错误，触发 30 分钟冷却。

完整链路：Devin 瞬时 high demand → CPA 403 → auth manager 认为权限错误 → 模型进入 30 min cooldown → 后续请求本地 short-circuit → 用户看到"模型一直死着"。

Workaround 是 `disable_cooling = true`，但这会把正常的 429/quota/capacity 保护也拆掉。最终修复很窄：`permission_denied` + "high demand" → 429；普通 `permission_denied` + "model access denied" → 403 不变。补了四类测试覆盖边界。

## 结果

三个 PR 全部 merge：

- CLIProxyAPI #5867：补齐 swe-1-6-slow
- router-for-me/models #58：同步远程 catalog
- CLIProxyAPI #5870：修复 high-demand 错误分类

CLIProxyAPI v7.3.5 Release Notes 正式列出两个修复，New Contributors 里写了 `@avabbbb made their first contribution in #5867`。

## 学到的东西

Model Name ≠ Model Contract。UI 上都叫 SWE-1.6，但底下可能有 `swe-1-6`、`swe-1-6-fast`、`swe-1-6-slow`，不同 UID 对应不同 entitlement、cost、reasoning mode 和 quota。

Catalog ≠ Entitlement ≠ Runtime Availability。`/v1/models` 看得到只代表系统知道模型存在，不代表账号有权限、当前 variant 有权限、当前 capacity 可用。

HTTP Error Code 在 Agent Runtime 里不是展示信息，而是控制信号。403 和 429 只差一个状态码，但下游 scheduler 会据此决定 retry、cooldown、fallback、disable credential 还是 switch model。
