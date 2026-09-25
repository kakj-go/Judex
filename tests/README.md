# 测试入口

测试代码统一放在本目录，构建产物和报告忽略提交。

| 目录 | 命令 | 当前覆盖 |
| --- | --- | --- |
| backend | `go test ./tests/backend` | 配置、探针、退出就绪状态、静态文件、API 错误边界 |
| deploy | `go test ./tests/deploy` | 内置 / 外部 PG 与 S3 四种组合、OpenSandbox 命名空间与单活、无效配置 |
| web | `npm run test:web` | 原型业务状态规则与卡片树布局 |
| e2e | `npm run build` 后 `npm run test:e2e` | 真实 Gin 壳层、无假注册、生产模式、交接 / 验收 / 流程等交互 |
| k8s | `node tests/k8s/smoke.mjs` | 临时 namespace 部署与 HTTP 探针，需集群和可拉取镜像 |

浏览器测试默认使用 Microsoft Edge。也可以 `npx playwright install chromium`，把 `PLAYWRIGHT_CHANNEL` 设为 `chromium` 后运行。测试管理 18080 / 5174 两个独立端口，不复用开发进程。报告在 `tests/reports/e2e`，失败截图 / trace 在 `tests/results/e2e`。

Helm 缺失时 Go 测试会显式跳过，不能把此时的 Go 成功视为 Helm 验证。K8s 测试需要已有兼容 OpenSandbox Operator / CRD，使用独立 namespace，不部署第二个集群 Controller，不停止正常业务服务。容器启动与沙箱执行须在可用集群继续验收，浏览器预览测试不能替代服务端业务事务测试。
