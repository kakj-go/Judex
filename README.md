# Judex

## 正式工程入口（2026-09-25）

已生成工程骨架：`cmd/` 放 server 与 CLI 入口（Agent harness 位于 `internal/agent`，随 server 进程运行）；`internal/` 放 Go + Gin 模块化单体；`web/` 放 React + HeroUI + Tailwind + Zustand + TanStack Query；`tests/` 集中测试；`deploy/` 放 Docker / Helm；根目录提供 Makefile 和 Apache-2.0 LICENSE / NOTICE。

需要 Go 1.25+、Node.js 22.12+、npm。在根目录执行 `go mod download`、`npm ci`，然后分别在两个终端运行：

```sh
# API http://127.0.0.1:8080
go run ./cmd/judex-server
```

```sh
# 完整交互预览 http://127.0.0.1:5173
npm run dev
```

生产构建执行 `npm run build`，由 Go 服务在 8080 托管，默认使用真实 API 模式。开发模式显式使用浏览器预览数据，保留完整工作室交互；生产模式不会自动回退到假数据。真实认证、业务持久化和 Agent 执行尚未实现，相关 API 返回 `501 NOT_IMPLEMENTED`。

```sh
go test ./...
go vet ./...
npm run test:web
npm run build
npm run test:e2e
go run ./cmd/judex -server http://127.0.0.1:8080 status
```

安装 GNU Make 后可使用 `make deps`、`make api`、`make web`、`make check`、`make image`。API 配置见 [.env.example](.env.example)，程序不自动加载 .env。

- [前端工程](web/README.md) · [测试说明](tests/README.md)
- [Helm 部署](deploy/README.md) · [工程实现状态](docs/详细设计/13-工程骨架与实现状态.md)
- [Apache-2.0](LICENSE) · [NOTICE](NOTICE) · [部署依赖](deploy/helm/UPSTREAM.md)

## 原交互原型（保留作参考）

机器人持续承接团队工作，Judex 连接成员的本地 AI，组织讨论、资料与正式决定。人可以直接提供信息，也可以按职责审批。

原型是 [灵感工作室 2.0](http://127.0.0.1:4173/?design=studio)。正式开发入口已迁入 `web/`，这里保留原型运行方式，供对照交互。

    cd docs/demo
    npm install
    npm run dev:background

Windows 后台启动可在命令退出后保持预览。也可以用 npm run dev 前台运行，但需要保持该终端。

新版可体验独立计划/任务/议题、任务树与引用、逐来源交接和拒收补交、工作简报与上报、任务/计划验收、重开、同岗多成员模板、个人提示词、Mermaid 流程与改版重确认。支持中英文、深浅色和浏览器数据保留。真实 AI、CLI/API 与业务后端尚未接入；完整边界见 Demo 说明。

    npm run build
    npm test
    npm run test:e2e

浏览器 E2E 使用 Microsoft Edge。旧 V1 设计与原型位于 docs/history/v1，当前方案不继承其旧业务规则。

- [文档索引](docs/README.md)
- [详细设计总览与技术基线](docs/详细设计/README.md)
- [工作室 2.0 卡片树与闭环](docs/工作室2.0卡片树与闭环.md)
- [工作室交互闭环](docs/工作室交互闭环.md)
- [Demo 运行与验证](docs/demo/README.md)
- [产品主线](docs/产品主线.md)
- [设计讨论与决策记录](docs/重新设计讨论.md)
- [Agent 协同架构](docs/Agent协同架构讨论.md)
