---
description: Logicstarter 运行时加固计划，覆盖标准登录链路验收、canonical auth origin、双层 env、Node/Cloudflare/Vercel 运行目标
---

# Logicstarter 运行时加固与 Env 分层计划

## 目标

1. 先把 Logicstarter 固化为 Node 优先的 Better Auth-first starter。
2. 把 Better Auth 标准登录链路做成固定验收基线，避免以后线上出问题再回头补修。
3. 拆分安装期配置和运行期 provider 配置。
4. 为 Cloudflare Workers / Vercel 预留清晰迁移路径，而不是现在就把 Node 与 Worker 逻辑混在一起。

## 阶段 1：Better Auth 标准登录链路验收基线

### 结果
形成可重复执行的清单或 smoke，用来验证标准登录链路。

### 必验项
- social sign-in 发起能返回 redirect URL。
- state / pkce cookie 发放正常。
- OAuth callback 完成后能下发 session cookie。
- root loader 与 `/api/auth/get-session` 返回同一个登录用户。
- 数据库里存在 `user`、`account`、`session` 记录。
- sign-out 后当前会话失效。
- email verification / reset password 仍然走 Better Auth 事件钩子。

### 交付物
- docs 内的验收清单。
- 后续可补容器/域名 smoke 脚本。
- 基线稳定后移除临时调试日志。

## 阶段 2：Canonical auth origin

### 结果
OAuth callback、邮件链接、邀请链接统一走一个主认证域。

### 建议配置
- `AUTH_CANONICAL_ORIGIN`
- `APP_ORIGIN`
- `BETTER_AUTH_URL`
- 请求头推导 origin 仅作为反代场景 fallback

### 规则
- 邮件链接和邀请链接优先使用 canonical origin。
- Better Auth baseURL 优先使用 canonical origin。
- trusted origins 显式追加，不依赖隐式 localhost 回退。

## 阶段 3：双层 Env 分离

### 结果
安装时只需要最小必要配置即可启动；provider 配置后置到 settings，再导出到 runtime env。

### 文件
- `.env.install.example`
- `.env.runtime.example`

### 安装期 env
仅保留最小启动要求：
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `APP_ORIGIN`
- `RUNTIME_TARGET`
- `PORT`（如需要）

### 运行期 env
放 provider 与三方集成配置：
- email provider
- sms provider
- social auth provider
- billing provider
- 后续 storage/provider

### 规则
- 仅靠 install env 也能完成基础启动。
- settings 页面将 provider 值写入数据库。
- 导出/同步时默认写入 `.env.runtime`。
- 当前只有 `RUNTIME_TARGET=node` 允许本地 runtime env 导出。
- `RUNTIME_TARGET=cloudflare` 和 `RUNTIME_TARGET=vercel` 下应返回结构化导出错误，并改走平台 secrets/bindings，而不是依赖本地可写 env 文件。

## 阶段 4：运行目标抽象

### 结果
Logicstarter 显式声明当前运行目标，并按平台调整行为。

### 建议值
- `RUNTIME_TARGET=node`
- `RUNTIME_TARGET=cloudflare`
- `RUNTIME_TARGET=vercel`

### 预期行为
- `node`：允许本地 env 文件同步到 `.env.runtime`，保持当前服务端模式。
- `cloudflare`：禁用本地文件写入，改走平台 secrets / bindings。
- `vercel`：避免依赖可写本地 env，改走部署环境变量。

## Cloudflare 路线

### 短期
- 继续以 Node 为权威运行时。
- 保持现有 provider settings + messaging 抽象。
- 把 `better-auth-cloudflare` 作为参考实现或后续适配目标，而不是马上强行切换。

### 中期
把这些 runtime 相关能力抽成接口：
- secret source
- provider config source
- env export target
- email transport
- sms transport

### 长期
- 增加 Cloudflare 专用 runtime 适配层。
- 支持通过 Cloudflare bindings / KV / D1 / dashboard variables 提供 secrets 和 provider 配置。

## 立即执行顺序

1. 给 bootstrap env 增加 `RUNTIME_TARGET`。
2. 补 install/runtime env 示例。
3. 补 Better Auth 标准登录链路验收文档与脚本。
4. 引入 canonical auth origin，并统一 invitation/email link 生成。
5. 基线稳定后移除临时 auth debug 日志。
