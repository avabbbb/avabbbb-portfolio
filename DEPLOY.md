# Deployment

This public source repository has no automatic deployment workflow and no copied deployment secrets. It does not replace or reconfigure the existing live website.

To host your own copy:

1. Run `npm ci` and `npm run build`.
2. Publish `dist/` to your own static hosting project.
3. If you need the optional protected-video endpoints, provision your own Cloudflare R2 bucket and configure `LOCKED_VIDEOS`, `HMAC_SECRET`, and `UNLOCK_CREDENTIAL` on the server. Generate independent credentials; never commit their values.
4. Update `wrangler.toml` with your own project and bucket names before using Cloudflare Pages Functions.

The public promotional films require no service credentials. Do not copy credentials or deployment settings from another environment.

本仓库不自动部署，也不包含原站部署凭据。自行部署时请使用自己的托管项目、R2 存储桶与服务端 Secret；公开宣传片不依赖这些服务。
