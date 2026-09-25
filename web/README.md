# Web 工程

React / TypeScript / Vite，HeroUI 是唯一基础 UI 库，Tailwind 负责工具样式。业务样式位于 `src/styles`，自定义类名使用 `.judex-*`，样式值来自 token。

- `src/app`：应用入口、真实 API 壳层、登录 / 注册表单。
- `src/components/ui`：HeroUI 适配组件；Button、Modal 已接入 HeroUI。
- `src/features/work`：从已验证原型迁入的工作室业务交互、状态转换与卡片树布局。尚未逐页改为服务端读写。
- `src/lib/api`：统一请求、错误模型、数据源边界。
- `src/stores`：Zustand 保存语言 / 主题等客户端偏好。
- `src/i18n`：中文 / 英文模块清单。延续 `argus.locale` 偏好键。
- `src/styles`：HeroUI / Tailwind 入口、design tokens、业务样式。

服务器状态由 TanStack Query 管理，Zustand 不复制服务器事实。预览数据通过独立 Query key 读取，以 `judex.web.preview.v1` 保存在浏览器；这不是正式后端数据协议。生产数据源不能使用预览 mutation。

从根目录安装依赖并运行 `npm run dev`。默认 5173，代理 API 到 8080，可用 `JUDEX_API_PROXY` 调整。只有显式 `VITE_DATA_MODE=demo` 才允许进入预览；`.env.development`、`.env.e2e`、`.env.preview` 已明确声明，普通生产构建默认为 API。

计划树、交接、审批等复杂业务沿用既有交互，不代表生产权限、并发或数据库事务已经实现。后续按业务模块迁移 API，保留预览与真实接口的分界。HeroUI 基础组件已整合，复杂业务页面的细部样式与原生表单控件仍需继续统一。
