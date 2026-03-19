---
description: Logicstarter 在 Node、Cloudflare Workers、Vercel 之间的运行目标适配说明，以及 better-auth-cloudflare 的接入点评估
---

# Logicstarter 运行目标适配说明

## 当前状态

Logicstarter 当前仍然是 Node 优先运行时。

已落地行为：
- 已集中解析 `RUNTIME_TARGET=node|cloudflare|vercel`
- provider settings 导出默认写入 `.env.runtime`
- 只有 `RUNTIME_TARGET=node` 允许本地 runtime env 导出
- 非 Node 目标下，导出会返回结构化错误，而不是尝试写本地文件
- Better Auth 的 canonical origin 已支持 `AUTH_CANONICAL_ORIGIN`
- 认证 secret 的文件回退读取仅在 `RUNTIME_TARGET=node` 下启用
- Better Auth auth 初始化已移除 Stripe 顶层同步导入，改为仅在 `RUNTIME_TARGET=node` 下动态加载 Stripe server plugin
- `/api/auth/stripe/*` 在非 Node 目标下会返回结构化 `503` runtime guard，而不是继续落入当前 Node-only server path

## Stripe x Cloudflare 当前结论

### 1. Better Auth 本体与 Stripe plugin 要分开看
- Better Auth 本体可以通过 `better-auth-cloudflare` 走 Cloudflare Workers 运行时适配
- 但当前官方 Stripe plugin 文档仍要求：
  - `@better-auth/stripe`
  - `stripe` SDK
  - `/api/auth/stripe/webhook`
- 因此，当前项目里的 Stripe billing server path 还不能仅凭 `better-auth-cloudflare` 就视为 Worker-safe

### 2. 当前已经完成的最小安全隔离
- 已把 `auth.server.ts` 中的 Stripe server plugin 改成按 runtime target 动态加载
- 已为 Cloudflare 目标补充 contract，防止 Stripe 顶层依赖重新回到 auth bootstrap
- 已在 `api.auth.$.tsx` 中为 `/api/auth/stripe/*` 增加非 Node runtime guard
- 已把 billing runtime snapshot/status 调整为真实反映 node-only server path 的状态

### 3. 当前仍未完成的核心能力
- Stripe checkout 的真正 Worker-safe server path
- Stripe webhook 的真正 Worker-safe 验签和事件处理路径
- Cloudflare 专用 billing implementation 与 Better Auth 主 auth factory 的协同方式

## 当前仍存在的 Node-only 假设

### 1. Auth secret 文件回退
`app/lib/auth.server.ts`
- 当前仍可在 `node` 下回退读取 `/app/.env`
- 后续应替换成统一的 runtime secret source 抽象

### 2. Runtime env 导出
`app/lib/logicstarter/env-sync.server.ts`
- 当前写入 `.env.runtime`
- 在 `cloudflare` 和 `vercel` 下被显式禁止

### 3. 运维辅助脚本
`scripts/export-provider-env.mjs`
- 仍假设本地文件系统可写
- 只适用于 Node 容器运行场景

### 4. Stripe billing server path
`app/lib/auth.server.ts` + `app/routes/api.auth.$.tsx`
- 当前 Stripe plugin 只在 `node` target 下激活
- Cloudflare / Vercel 下已做显式隔离，但这还不是 Worker-safe billing 实现

## 当前已经比较适合复用的层

### 1. Provider settings 解析层
`app/lib/logicstarter/provider-settings.server.ts`
- 已经把 env 值和 DB 值分开处理
- 这层非常适合继续演进成平台无关的 secret/config source

### 2. Messaging 抽象层
`app/lib/logicstarter/messaging.server.ts`
- 已将 provider 选择和 auth 事件触发拆开
- Better Platform、Resend、SES、Vonage、Amazon SNS 都只是 transport 选项
- 只要把 transport 再按平台拆分，这层未来仍可复用

### 3. Runtime target 解析层
`app/lib/logicstarter/config.server.ts`
- 已集中管理 `RUNTIME_TARGET`
- 后续应扩展成 runtime service resolution 的统一入口

## better-auth-cloudflare 的接入点

`package.json` 中已经存在 `better-auth-cloudflare` 依赖。

推荐使用方式：
- 继续把当前 Node 下的 Better Auth 路径作为权威基线
- 新增 Cloudflare 专用 auth factory，而不是现在直接把 Node 路径改成混合逻辑
- 把 `better-auth-cloudflare` 作为 Worker 运行时的适配器或参考实现，用来处理请求/运行时差异
- 不要把 `better-auth-cloudflare` 误当成 Stripe plugin 已经 Worker-safe 的证明；billing 仍需单独验证或单独实现

## 建议的架构拆分

### 1. Runtime services 层
建议引入运行时服务解析器，统一返回：
- secret source
- provider config source
- env export target
- storage capability flags
- runtime-specific messaging transport factories

### 2. Auth factory 拆分
建议把 auth 初始化拆成：
- `createNodeLogicstarterAuth()`
- `createCloudflareLogicstarterAuth()`
- 如 Vercel 行为后续足够不同，再补 `createVercelLogicstarterAuth()`

### 3. Secret/config source 抽象
把直接读取实现替换成统一接口，例如：
- `readSecret(key)`
- `readRuntimeConfig(key)`
- `writeRuntimeConfigSnapshot(values)`

Node 实现：
- process env
- 可选 `.env` 回退
- `.env.runtime` 导出

Cloudflare 实现：
- bindings / dashboard env
- 禁止本地文件写入

Vercel 实现：
- 部署环境变量
- 禁止本地文件写入

## 迁移顺序

### 阶段 A
继续保持 Node 为权威运行时，同时从共享模块中移除隐藏的文件系统假设。

### 阶段 B
抽出 runtime services，并把 provider export 行为统一收口到 `RUNTIME_TARGET`。

### 阶段 C
新增基于 `better-auth-cloudflare` 的 Cloudflare 专用 auth/bootstrap 路径。

### 阶段 D
补 Cloudflare 下的 billing 显式隔离、平台级部署文档与验收基线。

### 阶段 E
为 Stripe checkout / webhook 实现真正的 Worker-safe server path，或在确认官方支持后切回 Better Auth plugin-native 的 Cloudflare 路径。

## 各运行目标的验收目标

### Node
- `pnpm smoke:baseline` 通过
- settings export 正确写入 `.env.runtime`
- Better Auth social sign-in 发起与未登录 session 检查通过

### Cloudflare
- auth bootstrap 的执行路径不再依赖 Node 文件系统 API
- provider export 返回结构化平台提示，而不是尝试写本地文件
- canonical auth origin 与 Better Auth callback 能从 runtime config/bindings 正常解析
- `/api/auth/stripe/*` 不会误落入 Node-only billing server path
- billing runtime overview 能明确显示当前仍缺 Worker-safe Stripe implementation

### Vercel
- auth bootstrap 不依赖本地可写 env 文件
- provider export 返回结构化平台提示
- Better Auth callback 与 canonical origin 在反向代理头场景下保持稳定

## 立即可继续推进的代码目标

1. 从 `auth.server.ts` 和 `env-sync.server.ts` 中继续抽出 runtime service helpers
2. 把 Node 专用文件系统 fallback 进一步隔离到单独模块
3. 基于 `better-auth-cloudflare` 做一个 Cloudflare auth factory spike
4. 为 `node`、`cloudflare`、`vercel` 增加平台感知的 smoke 说明
5. 设计 Stripe checkout / webhook 的 Worker-safe Cloudflare 专用实现边界
