# AVABBBB Portfolio

Public source snapshot of AVABBBB's portfolio: products, code, and films.
AVABBBB 个人作品集公开源码：产品、代码与影像。

Website / 官网：https://avabbbb.com

This repository starts from a sanitized snapshot on 2026-10-16. It contains no legacy Git history or pull requests, deployment credentials, or automatic deployment workflow. It is provided for source review and local development; it does not control the live website deployment.

本仓库从 2026-10-16 的脱敏快照重新建立，不包含旧 Git 历史、旧 PR、部署凭据或自动部署流程。可供其他 Agent 阅读源码和本地运行，当前官网的部署仍独立维护。

## Run locally / 本地运行

Requires Node.js 24 and npm.

```bash
npm ci
npm run dev
npm run typecheck
npm run test:unit
npm run build
```

Use the local URL printed by Vite. Browser checks use `npm run test:e2e` and require an installed Chrome or Playwright Chromium.

使用 Vite 输出的本地地址。浏览器检查运行 `npm run test:e2e`，需要安装 Chrome 或 Playwright Chromium。

## Source map / 源码入口

| Path | Purpose / 用途 |
| --- | --- |
| `App.tsx` | Routes, navigation, page structure / 路由、导航与页面结构 |
| `components/` | Hero, project cases, portfolio, video dialogs / 首屏、案例、作品集与视频弹窗 |
| `src/data/` | Public project descriptions and bilingual copy / 公开项目资料与双语文案 |
| `src/agent/` | Portfolio guide and optional model calls / 作品导览与可选模型调用 |
| `content/articles/` | Public articles / 公开文章 |
| `public/` | Public images, films, and demo assets / 公开图片、视频与演示素材 |
| `functions/` | Optional Cloudflare video authorization / 可选的 Cloudflare 视频鉴权 |
| `tests/` | Unit and browser checks / 单元与浏览器检查 |

## Optional services / 可选服务

The local portfolio guide works without an API key. Visitors may supply their own key for model responses. Protected-video endpoints require your own Cloudflare R2 binding and server-side secrets; no such credentials are included. Public promotional videos play as static assets.

本地作品导览无需 API Key；模型回复可由访客自行提供 Key。受保护视频接口需要自行配置 Cloudflare R2 与服务端 Secret，本仓库不提供这些凭据；公开宣传片通过静态资源播放。

## Content rights / 素材权利

Public visibility does not grant a blanket reuse license for films, artwork, client materials, or third-party trademarks. Obtain the appropriate permission before reuse.

仓库公开不代表视频、美术、合作素材或第三方商标获得统一再授权；复用前请确认对应权利。
