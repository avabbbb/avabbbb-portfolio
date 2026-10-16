---
title: "自建 AI 中转站：CPA + NEW API + Docker + Nginx + Cloudflare 全链路"
date: 2026-06-18
---

用 VPS 搭一个对外的 AI API 中转站的完整链路：CLI Proxy API（CPA）做认证文件管理，NEW API 作为对外网关与 token 监控，Docker Compose 编排，Nginx 做 SSL 反代，Cloudflare 代理隐藏源站 IP。

本笔记记录组件职责与目录结构，不复制完整配置文件——细节以官方文档为准。

## 组件职责

- **CPA**：管理 OAuth 认证文件，作为 NEW API 的一个渠道。不直接对外提供服务。
- **NEW API**：对外网关，负责令牌、计费、数据看板、模型价格管理。
- **Redis + Postgres**：NEW API 的缓存与持久化。
- **Nginx**：HTTPS 终止、反代到 new-api 容器、WebSocket/SSE 流式支持。
- **Cloudflare**：DNS 代理，隐藏源站 IP。

## 目录结构

```
/opt/proxy/
├── docker-compose.yml
├── cpa/                        # cpa 配置与认证
│   ├── config.yaml
│   ├── auths/
│   └── logs/
├── newapi/                     # new-api 数据
│   ├── data/
│   └── logs/
└── nginx/
    ├── nginx.conf
    ├── conf.d/api.conf
    ├── ssl/{api.pem,api.key}
    └── logs/
```

## 关键决策点

### 端口暴露策略

第一版让 new-api 直接对外暴露 3000 端口，验证链路通；加完 Nginx 后改为只 `expose`（仅容器网络内可达），改由 Nginx 反代到 443。Linux 防火墙关闭 3000、开放 80/443。云服务商安全组同步收口。

### 容器网络

所有服务挂到自定义桥接网络 `newapi-network`，使 Nginx 可通过服务名 `http://new-api:3000` 访问后端，无需暴露端口。

### CPA 与 NEW API 的对接

NEW API 渠道里填 CPA 的 apikey 与 `http://cpa:8317`（同一 compose 网络内服务名）。点"获取模型"自动拉取；首次测试若报错，去系统管理设置模型价格后即可通过。

### SSL 证书

Cloudflare 控制台生成 Origin 证书，复制为 `api.pem` / `api.key`，私钥权限 600。Nginx 关闭 `proxy_buffering` 与 `proxy_cache` 以保证 SSE 流式输出即时送达，超时设到 300s 应对 AI 长响应。

### 部署步骤顺序

1. 目录与配置文件就位；
2. auth 认证文件放进 `cpa/auths/`；
3. Linux 防火墙与云安全组开放 3000（初版）；
4. `docker compose up -d`；
5. 访问 `http://ip:3000` 完成 NEW API 渠道、价格、令牌配置；
6. 加 Nginx + SSL，改端口为 expose，开放 80/443，关闭 3000；
7. 配 Cloudflare DNS 代理；
8. 重新 up，二级域名 HTTPS 访问验证。

### 重启报错处理

`docker compose up -d` 重启时报 `iptables ... No chain/target/match` 之类，重启 docker 再启动 compose 即可：`systemctl restart docker && docker compose up -d`。

整套链路完成后，对外只有 443，经由 CF 代理隐藏源站，NEW API 负责令牌/计费/监控，CPA 管理 AI 认证文件，适合自用或做公益站。商用需自行研读官方文档与二次开发。