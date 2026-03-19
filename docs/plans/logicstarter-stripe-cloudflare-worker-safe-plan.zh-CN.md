---
description: Logicstarter Stripe billing 在 Cloudflare Workers 下的 Worker-safe 落地计划
---

# Logicstarter Stripe x Cloudflare Worker-safe 实施计划

## 背景

Logicstarter 当前已经完成以下前置改造：

- `RUNTIME_TARGET` 已集中解析
- runtime env 注入已支持 Worker-safe 读取
- `auth.server.ts` 已移除 Stripe 顶层同步导入
- Stripe server plugin 仅在 `RUNTIME_TARGET=node` 下动态加载
- `/api/auth/stripe/*` 在非 Node 运行目标下会返回显式 runtime guard
- billing runtime overview 已能真实反映当前仍缺 Worker-safe Stripe server path

这意味着当前状态已经从“Cloudflare 启动阶段就被 Stripe 顶层依赖卡死”，推进到“Cloudflare 下 billing 被显式隔离，但尚未提供真正可用的 Worker-safe billing 实现”。

## 已确认结论

### 1. Better Auth 本体与 Stripe plugin 需要分开评估

已确认 `better-auth-cloudflare` 适用于 Better Auth 在 Cloudflare Workers 上的运行时适配。

但当前官方 Stripe plugin 文档仍明确依赖：

- `@better-auth/stripe`
- `stripe` SDK
- `/api/auth/stripe/webhook`

因此，不能仅因为 Better Auth 本体兼容 Cloudflare，就自动认定当前项目中的 Stripe billing server path 已是 Worker-safe。

### 2. 当前项目的真实边界

当前 billing 相关的 client path 仍可保留：

- `@better-auth/stripe/client`
- publishable key 暴露策略
- billing runtime/operator visibility

当前 billing 相关的 server path 仍是阻塞点：

- checkout session 创建
- webhook 验签与事件处理
- `/api/auth/stripe/*` 的服务端语义

## 目标

在不破坏现有 Node 基线的前提下，为 Logicstarter 增加可在 Cloudflare Workers 下工作的 Stripe billing server path。

## 两条候选路线

## 路线 A：Better Auth plugin-native Cloudflare 路线

### 假设

未来 Better Auth 官方 Stripe plugin 或现有依赖组合，能够在 Cloudflare Workers 下提供等价的 checkout / webhook 能力。

### 需要验证的问题

- `@better-auth/stripe` 是否能在 Worker 环境下初始化
- `stripe` SDK 当前版本在 Worker 环境下是否满足插件需求
- `/api/auth/stripe/webhook` 在 Worker Request/Response 模型下是否可正常验签
- plugin 是否依赖 Node-only API、Buffer、stream 或其他运行时假设

### 优点

- 保持 Better Auth plugin-native 路线
- 与现有 auth schema / subscription lifecycle 更一致
- 后续维护成本更低

### 风险

- 当前官方文档没有直接证明这条路径已可用于 Worker
- 若中途发现某一层仍有 Node-only 假设，可能需要回退到路线 B

## 路线 B：Cloudflare-specific billing server path

### 假设

Better Auth 继续负责主 auth、session、organization、subscription schema 协作；Stripe checkout / webhook 由 Cloudflare 专用 server path 处理。

### 最小拆分建议

- 继续保留 Better Auth 作为 auth 主入口
- 将 Stripe checkout server route 从 `/api/auth/stripe/*` 体系中拆开
- 将 Stripe webhook route 拆为 Cloudflare 专用 handler
- 在 Cloudflare route 内直接使用 Worker-safe fetch / Stripe HTTP 调用能力，避免依赖当前 Node-only plugin 初始化方式

### 优点

- 可以绕过当前 plugin server path 的 Node-only 假设
- 对 Cloudflare runtime 的控制更明确

### 风险

- 需要重新定义 subscription 状态如何同步回 Better Auth / 本地 schema
- 需要额外处理 webhook idempotency、signature verification、event mapping
- 比路线 A 更偏定制实现

## 推荐执行顺序

### Phase 1：继续做 plugin-native 可行性 spike

目标：尽量保持 Better Auth 原生路径优先。

需要完成：

- 做一个 Cloudflare auth factory spike
- 验证是否能在不使用 Node-only lazy load 的情况下初始化 Stripe plugin
- 验证 webhook route 在 Worker 语义下是否可执行

阶段出口：

- 若可行，则进入路线 A 正式接入
- 若不可行，则立刻切换路线 B

### Phase 2：维持当前安全隔离

在真正 Worker-safe 实现落地前，保持以下行为：

- `/api/auth/stripe/*` 在非 Node runtime 下显式返回结构化 `503`
- billing runtime overview 明确显示当前缺少 Worker-safe server path
- settings 页面持续提示 operator 不要在 Cloudflare 目标下误用当前 webhook/checkout 路径

### Phase 3A：若路线 A 可行

需要完成：

- 新建 `createCloudflareLogicstarterAuth()`
- 将 `better-auth-cloudflare` 接入 Cloudflare auth bootstrap
- 将 Stripe plugin 接入 Cloudflare auth factory
- 补 Cloudflare target 下的 checkout / webhook contract
- 扩展 smoke / acceptance 说明

### Phase 3B：若路线 B 更现实

需要完成：

- 设计独立的 Cloudflare checkout route
- 设计独立的 Cloudflare webhook route
- 明确 webhook event 到本地 subscription 状态的映射
- 设计 webhook idempotency 存储策略
- 保持 Node target 继续使用现有 Better Auth Stripe plugin path

## 最小可行 Worker-safe Billing 定义

满足以下条件即可视为第一版 Worker-safe billing 落地：

- `RUNTIME_TARGET=cloudflare` 时，auth bootstrap 不依赖 Node Stripe plugin 初始化
- Cloudflare 下存在可调用的 checkout server path
- Cloudflare 下存在可调用的 webhook verification / event handling path
- operator runtime API 能明确显示 billing 已从 `worker_unsupported` 提升
- 至少有一条 Cloudflare contract 能证明 Stripe server path 不会误回退到当前 Node-only 路径

## 验收标准

### 代码层

- 不允许在 Cloudflare 主执行路径顶层导入 Node-only Stripe server 依赖
- Node 与 Cloudflare 的 billing server path 职责边界清晰
- runtime target 变化不会导致 auth bootstrap 崩溃

### 运行时层

- Node target 仍保持现有 baseline 通过
- Cloudflare target 下 `/api/auth/stripe/*` 要么被正式替代，要么保留 guard 且有新的 Worker-safe route
- billing runtime overview 能准确显示当前 server path mode

### 回归层

- `pnpm typecheck` 通过
- `pnpm build` 通过
- `pnpm smoke:baseline` 继续通过
- 新增至少一条 Cloudflare billing contract

## 下一步建议

下一步最合适的动作是：

1. 先做 `createCloudflareLogicstarterAuth()` 的 spike
2. 用最小实验验证 Stripe plugin 是否能在 Worker 模型中初始化
3. 若失败，立即切到 Cloudflare-specific checkout/webhook 路线，不再继续在 plugin 路径上消耗过多时间
