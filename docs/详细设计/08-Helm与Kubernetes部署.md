# 08 Helm 与 Kubernetes 部署

## 1. 已确认目标

- 公司内部部署，员工自由注册并创建项目。
- Kubernetes 部署，用 Helm 提供整套可运行环境。
- 开发与生产有不同配置，但不是两套产品功能或独立代码分支。
- 开发默认内置 PostgreSQL 和对象存储；生产分别选择内置或外部 PostgreSQL、S3 服务。
- 内置对象存储采用 SeaweedFS；OpenSandbox 纳入平台执行基础设施。
- OpenSandbox 明确使用容器沙箱，与当前 Judex 服务部署在同一 K8s 集群；这不决定开发、生产两个环境是否共用集群。
- 高可用、允许中断时长、RPO / RTO 与节点规模尚未确认；**最新 Q063 没有接受“单实例生产可用性目标”**。

## 2. Chart 组织方案

```text
deploy/helm/judex/
  Chart.yaml
  Chart.lock
  values.yaml
  values-dev.yaml
  values-prod.yaml
  values.schema.json
  templates/
    server/          业务 Deployment、Service、路由、探针
    configuration/   ConfigMap、Secret 引用与执行镜像配置
    initialization/  数据库迁移、对象 Bucket 初始化、安装检查
    security/        ServiceAccount、RBAC、网络策略
    observability/   指标接口及可选采集配置
  charts/            固定版本的数据库、对象存储、沙箱依赖
```

以上是设计目录，当前没有创建实际 Chart。若上游依赖无法直接作为子 Chart 组合，提供受版本管理的模板适配；不在安装过程中任意拉取浮动脚本。

## 3. 组件职责

| 组件 | 运行方式 | 是否自研业务微服务 |
| --- | --- | --- |
| Judex Server | 一个主要 Deployment，可提供前端静态文件 | 唯一业务单体 |
| 容器沙箱 | 同集群按运行按需创建，接收服务端 harness 派发的命令与文件操作，只读挂载项目共享区 | 执行组件（无自研常驻程序） |
| OpenSandbox Lifecycle Server | 依锁定版本部署 | 第三方基础设施 |
| OpenSandbox Controller 与 CRD | 管理 K8s 沙箱资源 | 第三方基础设施 |
| PostgreSQL | 内置数据工作负载或外部连接 | 数据基础设施 |
| SeaweedFS | 内置 S3 服务的实际拓扑 | 数据基础设施，可能包含多个 Pod |
| 初始化 / 迁移 / 验证任务 | Job 或受控安装步骤 | 运维任务 |

一个 Helm Release 不意味着一个 Pod。业务单体也不意味着把数据库和沙箱放入 Server 容器。

## 4. 两项独立存储选择

候选配置契约：

```yaml
postgresql:
  mode: embedded # embedded | external
  external:
    host: ""
    port: 5432
    database: ""
    existingSecret: ""
objectStorage:
  mode: embedded # embedded | external
  external:
    endpoint: ""
    region: ""
    bucket: ""
    existingSecret: ""
    addressingStyle: path # 根据外部服务校验 path / virtual-hosted
```

字段为设计示意，不是已发布 values API。配置 schema 需校验 external 模式的连接和密钥引用，拒绝两套来源歧义或缺失配置。

四种组合均需验收：内置 PG + 内置 S3；内置 PG + 外部 S3；外部 PG + 内置 S3；外部 PG + 外部 S3。切换模式不自动迁移原有数据，迁移必须有明确备份、复制、验证和回切步骤。

## 5. 开发与生产配置

| 项目 | 开发配置方案 | 生产配置要求 |
| --- | --- | --- |
| 依赖 | 默认全部内置 | 除 PG / S3 可外接外，提供完整执行组件 |
| 镜像 | 明确开发标签，可配本地仓库 | 固定版本 / digest，禁止浮动 latest |
| 数据 | 默认 PVC 持久化；重置必须明确 | PVC 和数据默认保留 |
| 凭据 | 独立开发凭据，不依赖固定公共密码 | Secret 引用或受控生成，升级不意外轮换 |
| 调试 | 可启用更详细诊断 | 避免记录私人提示词、密钥和全文资料 |
| 容量与并发 | 小规模默认值需实测 | 根据 D04/D06 明确资源和运行限额 |
| 可用性 | 开发不承诺 HA | 目标待确认，不用环境名宣称 HA |

开发与生产至少使用独立 Namespace、Release 名、数据库 / 账号、Bucket、Secret 和卷。是否同集群待确认；Namespace 不替代共享节点与集群级组件的故障边界。

## 6. 安装与就绪

设计安装路径：检查集群前提 → 安装 / 验证基础资源 → 等待数据库和 S3 服务可用 → 执行版本化迁移及 Bucket 初始化 → 启动业务 API（含服务端 harness）与沙箱执行配置 → 冒烟验证。

Helm 依赖关系不保证运行就绪顺序。迁移 Job 不应只依赖创建顺序；须有明确等待、超时与失败信号。数据库迁移只执行一次有效版本，多个 Server 副本不能同时无锁迁移。

启动探针区分启动、就绪和存活；外部模型临时不可用可以使 AI 功能退化，不应导致所有项目资料页面不可访问。哪些依赖失败会撤销 API readiness 需明确测试。

集群前提至少包括可用的存储供应方式、DNS、所需网络访问和沙箱运行能力；内网镜像仓库、TLS / Ingress / Gateway 方案待部署环境确认，不默认修改公司现有集群入口。

## 7. OpenSandbox 的特殊约束

讨论时核验的官方文档将 Lifecycle Server 定义为 single-active，通用多副本生命周期 API 高可用尚未支持；PostgreSQL 存储模式不能直接改变这一结论。安装前按固定版本复核。

CRD 属于集群级资源。开发和生产在同集群时，Chart 要处理已有 CRD、所有权和升级，不能让两个 Release 争抢安装，也不能默认删除共享 CRD。Controller 的资源范围、命名冲突和多环境行为属于集成验证项。

OpenSandbox 如使用 PostgreSQL 保存其自有记录，采用独立数据库 / 账号与迁移，不与 Judex 业务表混用；是否共享同一个数据库实例属于部署配置方案。

沙箱默认无业务数据库直连权限，服务账号与 Server 分离；使用项目共享资料只读挂载与独立工作区。限制资源、网络出口及原件写权限；不将整个平台的项目资料预挂到所有沙箱。

项目只读挂载适配分为内置 SeaweedFS 与外部 S3 两条路径：原生 Filer / CSI 不等于通用 S3 挂载。已有项目目录如何绑定卷、缓存刷新、多节点读取和只读保护需 PoC。挂载由可信基础设施完成，不让 Agent 获得存储管理能力。

预热池使用预先配置的卷，不能假定分配时可追加任意项目挂载。首期建议验证按项目创建沙箱；预热复用作为后续优化，不能破坏项目隔离。沙箱回收不删除项目共享数据；运行上下文在服务端 PostgreSQL，沙箱内仅有可丢弃工作区。

## 8. SeaweedFS 持久化

不能只给 Volume 挂卷而忽略 Master 与 Filer 元数据。内置模板应明确持久化目录、卷和存储类，避免沿用上游某些默认 hostPath 而在 Pod 换节点时丢失必要状态。

生产拓扑需考虑 Master 仲裁、Volume 副本、节点分布、Filer 元数据和备份。单实例持久化方案与高可用拓扑必须区分；本轮未替用户选定其中之一。

外部 S3 模式不创建或接管外部存储实例，连接检查与 Bucket 初始化必须限制在授权资源范围内，不能更改外部服务的全局配置。

## 9. 升级、卸载与恢复

版本化数据库迁移与应用发布协调。Helm rollback 不等于数据库降级；迁移策略需支持明确的兼容窗口或备份恢复步骤。项目尚处开发期可调整模型，但生产升级不能直接套用 Demo 清空数据习惯。

卸载默认保留持久业务数据；开发环境显式清理仅限所属 Release / Namespace，不能操作其他项目资源。安装文档明确保留了什么以及如何恢复。

备份覆盖 PostgreSQL、对象内容和 SeaweedFS 元数据，恢复后验证文件引用和审阅版本一致。备份不能只位于同一个可能同时丢失的故障域。实际备份目的地、周期、保留期与恢复时长列为 D04/D06。
