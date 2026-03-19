---
description: Logicstarter Better Auth-first starter 中文实施计划
---

# Logicstarter Better Auth-first 中文计划

## 1. 项目目标

`Logicstarter` 不再沿着旧 `starter` 的主线继续演化，而是作为一个新的 **Better Auth-first** 基础项目重新开始。

这个项目的核心目标是：

- 以 `React Router v7` 作为主框架模式
- 以 `Cloudflare Workers` 作为主运行目标
- 以 `Tailwind CSS` + `shadcn/ui` 作为 UI 基础
- 以 `Better Auth` 作为认证、组织、插件扩展的主底座
- 让后续接入 Better Auth 官方插件时，不需要大改架构就能直接用
- 把真正有价值的公共能力沉淀下来，但不预构建“每个项目都不同”的业务解释层

## 2. 基础运行约束

### 主运行形态

- 主框架：`React Router v7 framework mode`
- 主运行目标：`Cloudflare Workers`
- 构建工具：`Vite 8.0`
- ORM：`Drizzle`
- UI 基础：`Tailwind CSS` + `shadcn/ui`
- 运行端口：由运行环境决定
- 数据库名：`logicstarter`
- 数据库用户：`logicstarter`

### 运行时优先级

- 第一优先级：`RR7 + Cloudflare Workers + Drizzle`
- 第二优先级：`Next.js + Vercel`
- 第三优先级：本地 Node / 容器开发壳，用于开发与调试，不作为架构主心智

### 环境与依赖策略

- 实施时尽量采用当前稳定、较新的依赖版本
- 不提前为旧 API、旧兼容层、旧部署模式做过度妥协
- 架构上避免把 `RR7`、`Better Auth`、`Tailwind`、`shadcn/ui`、`Drizzle` 强耦合到一起，保证后续升级时可分层处理
- 前端数据访问层未来允许接入 `TanStack Query`，但不要把 starter 核心设计绑死在某个 query 状态管理库上

### 敏感信息策略

- 数据库密码、认证密钥、provider 密钥、webhook 密钥等必须只放在环境变量或部署密钥管理中
- 不把真实密码或生产密钥写进计划文档、源码、示例配置、截图或提交历史
- 优先使用 settings 管理 provider 配置，而不是环境变量
- 文档只描述变量名与注入方式，不扩散真实敏感值

## 3. 项目定位

`Logicstarter` 不是一个“大而全的产品后台壳”。

它应该是一个 **Better Auth-first 的基础 runtime / starter**，提供的是：

- 认证基础能力
- 组织与成员基础能力
- 邮件 / 短信 / 支付 / 存储的接入基础能力
- 最小化 jobs / webhook 处理能力
- 可复用的设置与运维基础页面

它**不应该**试图提前内置所有项目共用的业务解释层。

以下内容应明确归项目自己负责：

- 一个 plan 在该项目里到底代表什么
- 哪些 feature 被开启
- seat / 限额 / entitlement 怎么定义
- 升降级后的业务语义是什么
- billing 文案、业务邮件、业务后处理动作是什么

## 4. 核心决策

### 决策结论

新建 `Logicstarter`，以 Better Auth-first 为中心重新搭建；旧 `starter` 只作为参考来源、迁移素材库和可复用实现来源。

### 这样做的原因

旧 `starter` 的历史包袱包括：

- 旧 runtime 心智
- 旧 org / admin / settings / payment 抽象
- 旧产品壳定位
- 较重的兼容思维

如果继续在旧 `starter` 上硬改，容易出现：

- 名义上是 Better Auth-first
- 实际上仍然是 starter-first，只是外面套了一层 Better Auth

这会让后续架构越来越复杂。

### 因此形成的规则

迁移时只迁“仍然符合 Better Auth-first 思路”的能力。

不再默认把旧 `starter` 的抽象整体搬过来。

## 5. 总体设计原则

### Better Auth-first

- Better Auth 是认证主底座
- 能由 Better Auth 官方插件承担的能力，不再重复发明一套主模型
- Better Auth 官方 schema 的所有权必须保持清晰
- 本地业务扩展字段尽量放在扩展表里，而不是改写或冲撞官方表结构

### 薄接入层

公共层只保留必要的薄能力：

- provider 配置装配
- adapter 封装
- facade 封装
- webhook 入站处理
- 最小 durable jobs
- 基础运维与设置页

### 业务解释项目自有

不要预先做以下“看起来通用、实际每个项目都不同”的层：

- 通用 entitlement engine
- 通用 plan -> feature 解释层
- 通用 billing 业务语义层
- 通用 seat / limit / downgrade 行为层

这些应该由每个业务项目自己实现。

### 升级隔离

- Better Auth 官方升级的冲击要被隔离在有限边界内
- 路由、页面、业务服务不要到处直接依赖插件内部细节
- 业务代码应尽量通过本地 facade 调用 Better Auth 能力

### 部署与运行可移植性

虽然 `RR7` 是主实现，但从设计第一天起就要把 `Cloudflare Workers` 视为主目标，同时为以下方向保留清晰边界：

- `RR7 + Cloudflare Workers`
- `Next.js + Vercel`

这里的目标不是强行做成“一套代码零差异跑所有框架”，而是避免把主项目写成只能锁死在单一运行模型上的结构。

## 6. 能力边界设计

## 6.1 Auth 基础层

应该支持：

- Better Auth 核心 session
- email/password
- social providers
- phone 相关插件
- email verification / email OTP
- 后续 SSO 插件
- 必要时再补 bearer / JWT 等机对机能力

规则：

- auth 初始化必须集中在单一主模块
- 插件注册必须模块化、可增量开启
- 各插件的配置读取要分层，不要耦在一起
- 页面和路由不要各自拼 auth 逻辑，而是统一走 auth facade
- provider 的 client id / secret 等敏感配置，优先通过 settings 持久化与加载，不要求全部堆进 env

## 6.2 Organization 基础层

当启用 Better Auth organization 插件时，应默认把它视为组织模型主底座。

规则：

- 组织、成员、邀请、团队、角色优先沿 Better Auth 原语设计
- 本地数据库只保留 Better Auth 没有管理的扩展字段
- 业务级字段通过扩展表挂载在 Better Auth 实体上
- 应对外提供组织 facade，而不是让业务代码到处直连底层模型

## 6.3 Payment 基础层

支付应采用 **Better Auth-first 的集成方式**，但不把“业务含义”放进 starter 核心。

公共层负责：

- provider 接线
- checkout / portal / subscription 基础接入
- customer / subscription 同步
- webhook 入站处理
- durable retry / failure recovery
- 基础运维可见性

项目层负责：

- plan 的业务含义
- entitlement
- 功能开关
- seat / 配额语义
- 降级策略
- 付款后的业务动作

规则：

- 订阅事实必须只有一个主事实来源
- 不要再造一份会和 Better Auth / provider 冲突的 payment 主模型
- 公共层只沉淀支付接入能力，不沉淀支付业务解释能力

## 6.4 Email 基础层

公共层应提供：

- 邮件发送 adapter 合约
- Better Auth 邮件流相关接入
- 对 `Resend`、SMTP 等 provider 的配置支持
- 尽量薄的模板装配与发送封装

不应该做：

- 所有产品邮件语义的统一内置
- 重的业务邮件引擎

## 6.5 SMS / Phone 基础层

公共层应提供：

- 短信/OTP adapter 合约
- Better Auth phone 插件对接点
- 至少一个短信 provider 的接入模式
- 必要的失败重试和可观测性挂点

不应该做：

- 把短信供应商的业务语义写死进核心 runtime

## 6.6 Storage 基础层

存储应保持独立 adapter 层。

规则：

- 不和认证插件耦死
- 同时为本地 / 对象存储等方案保留边界
- signed URL、上传策略、文件元信息处理放在受控模块内
- 方便未来产品接文档、媒体、附件类需求

## 6.7 Jobs 与 Webhook 基础层

只保留“最小但可靠”的 jobs 能力。

jobs 的存在理由应限于：

- webhook durable 处理
- retry / backoff
- integration failure compensation
- provider 同步任务
- 邮件 / 短信的可靠投递辅助

不要在一开始就把它做成一个泛化的内部 workflow 平台。

## 7. 框架路线

## 7.1 RR7 + Cloudflare Workers 主实现

`RR7 + Cloudflare Workers` 应作为第一主线和参考实现。

它负责定义：

- app 结构
- route 组织方式
- server-only 边界
- DB 接入方式
- Better Auth 接入方式
- settings / 运维页面模式
- facade / adapter 模式
- Worker 友好的 request / response 与 runtime boundary

不应该为了兼容 Next.js 而反过来扭曲 RR7 的内部写法。

这个主线必须以 `Vite 8.0 + RR7 framework mode + Drizzle` 为实现基座。

未来如果项目需要 `TanStack Query + RR7`，应把它放在 UI 数据获取层，而不是让它侵入 auth、org、payment、settings 等核心服务边界。

## 7.2 Next.js + Vercel 适配版

目标不是让 RR7 项目内部处处模拟 Next.js，而是把**可共享核心层**抽出来，使得后续做 Next 版本时成本可控。

推荐策略：

- 抽出框架无关的核心模块：config、validation、db schema、provider adapter、webhook 服务、核心 facade
- 框架绑定层尽量做薄
- 明确哪些模块可以安全用于 `Next.js route handlers`、`server actions`、`server runtime`
- 不把 RR7 的 request/response 辅助逻辑扩散到共享层

预期可共享部分：

- schema 与 query
- Better Auth 配置装配
- provider adapter
- webhook 处理服务
- config / validation
- 业务服务边界

预期框架特有部分：

- 路由层
- request lifecycle glue
- 页面与布局装配
- session helper 封装
- 各框架自己的缓存 / streaming 策略

## 7.3 `better-auth-cloudflare` 评估结论与采用策略

`better-auth-cloudflare` 的定位，不应理解为“整个 starter 架构替代品”，更接近：

- Better Auth 在 Cloudflare 运行时下的增强层
- Cloudflare 资源能力的集成层
- 一套带 CLI 与模板假设的快速接入工具包

结合当前公开信息，它具备这些优点：

- 已出现在 Better Auth 官方社区插件列表中
- 明确支持 `D1 / Postgres / MySQL + Drizzle`
- 提供 `withCloudflare` 这种可直接进入 Better Auth 装配流程的能力
- 支持 `KV / R2 / geolocation / IP detection` 等 Cloudflare 侧能力
- 给出了手工接入方式，而不仅仅是 CLI 脚手架

同时也有这些边界与风险：

- 它自带较强的 Cloudflare 资源心智，容易把项目带进 `KV / R2 / Hyperdrive / CLI generate` 这套默认路径
- 官方社区收录不等于 Better Auth 官方核心维护承诺
- 示例更多偏向 `Hono / Next.js / OpenNext`，不是天然就是 `RR7 framework mode` 样板
- 如果完全绑死它的模板与命令流，后续项目自主性会下降

因此建议采用策略是：

- **优先参考，并局部直接使用**
- 优先使用它的 `withCloudflare`、client plugin、Workers 运行时增强思路
- 不把整个项目结构、目录设计、迁移流程、资源绑定方式完全交给它的 CLI 模板决定
- 在 `Logicstarter` 中自行定义主目录结构、settings 策略、facade 边界、schema ownership 规则

换句话说：

- **可以用它做 Cloudflare 运行时适配层**
- **不要让它反客为主，变成整个 starter 的架构中心**

## 7.4 Cloudflare Workers 主线约束

Workers 方向的规则：

- Node-only 依赖必须隔离
- 明确标注哪些模块依赖 Node API
- 尽量采用标准 Request / Response 模型
- 共享层不要依赖本地文件系统
- 背景任务要考虑 queue / webhook / 外部任务系统模型，而不是默认长期占用 Node 进程
- 提前记录哪些库不适合 Workers，不要等做到后期才发现

建议维护一个可移植性矩阵，至少标明模块属于：

- RR7 Node-safe
- Next.js server-safe
- CF Worker-safe
- 需要替代 adapter

## 7.5 `TanStack Query + RR7` 预留策略

未来项目不排除采用 `TanStack Query + RR7`。

当前策略：

- starter 核心层不依赖 `TanStack Query`
- UI 页面层允许未来按需接入 `TanStack Query`
- query key、cache invalidation、prefetch 规则应位于 features / app 层，而不是 core auth / core payment / core org
- server loader / action 与 client query 的分工需要保持清晰，避免把 RR7 本身的数据流搞乱

## 8. UI 基础策略

UI 基础统一为：

- `Tailwind CSS`
- `shadcn/ui`
- 成屏文案统一使用英文
- 视觉风格在 auth / settings / billing / org / ops 页面保持一致

规则：

- 主题系统先做轻，不做重型产品换肤引擎
- 不把业务品牌深度绑定进 starter 核心
- 保持一套小而稳定的 design token 表面
- 表单、表格、弹窗、命令面板、设置页结构尽量沉淀为可复用模式

## 9. Better Auth 插件无阻碍扩展原则

`Logicstarter` 必须保证以后新增 Better Auth 官方插件时，不需要推倒重来。

强制规则：

- 插件注册统一集中、可组合
- 插件表结构不和本地 schema 冲突
- 扩展字段优先放扩展表
- 页面与路由依赖本地 facade，不直接散落引用插件内部细节
- 配置校验按插件拆分
- 可选插件的开启不应破坏无关页面
- 新插件 UI 入口应是可加的，不是侵入式重构
- 新插件的 webhook 应能挂进同一套 durable inbound 处理模型

架构假设必须是：

- 今天有 `organization / admin / phone / email / payment`
- 明天还会继续有其他插件

## 10. 推荐目录方向

建议方向如下：

```text
Logicstarter/
  app/
    routes/
    components/
    features/
  core/
    auth/
    org/
    payment/
    email/
    sms/
    storage/
    jobs/
    observability/
    config/
  lib/
    db/
    validation/
    utils/
  docs/
    plans/
    architecture/
  packages/            # 只有在真实复用压力出现时再抽
    runtime-core/
    ui/
    adapters/
```

说明：

- 前期可先用单应用结构快速落地
- 不要一开始就过早 packages 化
- 真正出现 Next 版或多项目复用压力时，再把共享核心抽到 `packages`

## 11. 配置与密钥策略

配置应收敛到“最少必要 env + settings 驱动 provider 配置”的策略。

env 层只保留最核心项：

- `DATABASE_URL`
- `BETTER_AUTH_SECRET` 或当前沿用的认证连接密钥
- `SETTINGS_SECRET_KEY`
- 由运行环境控制的端口配置

其中：

- `SETTINGS_SECRET_KEY=replace-with-a-long-random-secret` 作为设置存储加密/保护的基础密钥
- provider 侧配置，如 Google client id / secret、邮件、短信、支付等，优先在 settings 中录入与管理
- settings 中的敏感值需要加密存储，不能明文落库
- 只有确实属于部署期不可缺少、且不适合放入 settings 的值，才继续保留在 env

规则：

- 启动时做清晰的 env 校验
- public env 与 server-only env 分开
- 示例 env 不写真实值
- 文档明确区分“最小可启动配置”和“通过 settings 启用某 provider 所需额外配置”
- Google 等 provider 不应默认要求写死在 env 中
- settings 加载失败时，要有明确降级与告警策略

## 12. 可观测性与运维

新 starter 必须把集成能力的可观测性当作一等能力。

最低要求：

- 结构化日志
- 请求关联 ID（条件允许时）
- webhook traceability
- failed jobs 可见性
- 邮件 / 短信发送失败可见性
- migration / version 可见性
- 容器可用的健康检查与 readiness 检查

不能把错误都藏在静默 retry 里。

## 13. 测试策略

从一开始就定义清晰测试层次。

至少应包括：

- config / validation / 纯服务逻辑的单元测试
- auth / org / webhook / adapter 的集成测试
- 核心 public/operator 流程的 route smoke 测试
- Better Auth 官方表与本地扩展表共存的 migration 验证
- 针对可移植性敏感模块的专项检查

建议门禁：

- typecheck
- lint
- unit tests
- integration tests
- 核心 smoke baseline

## 14. 实施阶段

## Phase 0：规划与架构基线

交付物：

- 当前计划文档
- Better Auth-first 边界 ADR
- RR7 / Next.js / CF Workers 可移植性矩阵初版
- `better-auth-cloudflare` 采用边界说明
- 依赖基线选择

## Phase 1：项目脚手架

交付物：

- `Vite 8.0 + RR7 framework mode` 基础项目
- Tailwind 初始化
- shadcn/ui 初始化
- env/config 校验基础
- DB 连接基础
- 基础 docs 与运行脚本
- 由运行环境控制的运行基线
- Cloudflare Workers 本地开发与部署基线

## Phase 2：Better Auth 核心接入

交付物：

- Better Auth 基础配置
- `better-auth-cloudflare` 可用性验证与接入决策
- 模块化插件注册方案
- session facade
- user provisioning 边界决策
- auth schema / migration 流程

## Phase 3：Organization 与 settings 基础

交付物：

- Better Auth organization 接入
- 扩展表策略
- org facade
- 基础设置页 / 运维页
- 只保留有必要的 operator/admin 视图

## Phase 4：Provider adapters

交付物：

- email adapter 与首个 provider
- SMS adapter 与首个 provider
- storage adapter 与首个 provider
- payment provider 基础接入

## Phase 5：Webhook 与最小 jobs

交付物：

- durable webhook 处理模型
- retry / backoff
- job 基础可见性
- provider failure handling 路径

## Phase 6：可移植性加固

交付物：

- Node-only 模块识别
- runtime-specific binding 隔离
- Next.js 适配说明
- CF Workers 适配说明
- 模块可移植性矩阵
- `TanStack Query + RR7` 接入边界说明

## Phase 7：迁移有价值资产

可迁移候选：

- 有价值的 env/config 模式
- 仍值得保留的运维页面
- 可复用 UI 组件
- storage 集成模式
- email/SMS provider 接入模式
- jobs/webhook 可靠性模式

明确不迁：

- 重型产品壳
- 通用 entitlement 引擎
- starter-owned 业务解释层
- 不必要的 legacy compatibility surface

## 15. 风险与约束

### 风险 1：不知不觉复刻旧 starter 复杂度

约束：

- 每个新增模块都要先判断它是 starter-core 还是 project-owned

### 风险 2：未来加 Better Auth 插件时产生冲突

约束：

- 严守 plugin ownership boundary，避免 schema 碰撞

### 风险 3：多框架适配只停留在口头

约束：

- 必须维护可移植性矩阵，并持续标注实际运行假设

### 风险 4：jobs 过早膨胀成内部平台

约束：

- 没有真实需求前，只保留最小可靠 jobs

### 风险 5：provider 集成泄露敏感信息或形成隐式耦合

约束：

- 统一 env 解析、统一 secret handling、统一 adapter 边界

## 16. 建议的近期下一步

1. 确认目录命名是否保持 `Logicstarter` 还是后续统一小写
2. 在当前目录中搭建 `Vite 8.0 + RR7 framework mode` 主脚手架
3. 第一时间接入 `Tailwind` 与 `shadcn/ui`，统一后续页面基础
4. 在做任何 auth 页面前，先确定 Better Auth 的模块布局与 facade 规则
5. 先定义 DB / migration 规则，确保 Better Auth 官方表与本地扩展表能干净共存
6. 先补一份可移植性矩阵文档，避免 RR7 与 Worker 假设扩散到所有共享层
7. 单独写一份 ADR，固定 Better Auth schema ownership 与 thin facade 原则
8. 先做 `better-auth-cloudflare` 最小 PoC，验证它在 `RR7 + Drizzle + Workers` 下到底适合直接用哪些部分
9. 把 env 收缩到 `DATABASE_URL`、认证密钥、`SETTINGS_SECRET_KEY`、由运行环境控制的端口配置，其他 provider 走 settings

## 17. 第一版非目标

第一版不应该急着做：

- 通用 entitlement engine
- 通用 billing business semantics
- 巨大的 admin backoffice
- 复杂换肤系统
- 多产品插件市场模型
- 过早 package 拆分

## 18. 成功标准

当满足以下条件时，可以认为 `Logicstarter` 方向正确：

- `RR7 + Cloudflare Workers` 主版能在运行环境控制的配置下稳定运行，并具备 Worker 部署路径
- Better Auth 明确成为 auth / org 主底座
- 后续新增 Better Auth 官方插件时不需要大改架构
- payment / email / SMS / storage 都有清晰薄 adapter 边界
- 核心 starter 不承担项目业务语义解释
- Next.js 适配仍然现实可做，而不是理论口号
- 新项目整体复杂度明显低于旧 starter，而不是换个名字继续叠抽象
