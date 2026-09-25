# Judex 灵感工作室 2.0

[打开工作室](http://127.0.0.1:4173/?design=studio) · [计划卡片树](http://127.0.0.1:4173/?design=studio&view=plan&item=leaf-first) · [任务卡片](http://127.0.0.1:4173/?design=studio&view=tasks)

当前只维护这一套界面。协作信箱独立布局、计划地图、Chatbox、会话工作区和 legacy 应用已移除；“交接信箱”作为工作室内的业务页面继续保留。旧 `design` 查询参数会归一到 studio。

## 启动与验证

```powershell
cd docs/demo
npm install
npm run dev:background
npm test
npm run test:e2e
npm run build
```

后台服务仅监听 `127.0.0.1:4173`。`npm run dev` 可前台运行，需要保持终端。E2E 使用 Microsoft Edge。

## 体验路径

1. 打开计划，查看横向卡片树；实线表示归属，虚线箭头表示前置条件。
2. 展开 / 收起子任务，缩放、拖动、适应画布，或展开大画布查看全局。
3. 点击任务原地查看；节点加号提出子任务草稿，并继续由有权人确认。
4. 默认周宁接收顾言的交付，退回夏禾的说明并说明原因；切换夏禾补交和发送，再切回周宁接收。
5. 从任务卡查看可开始条件，上报成果。切换林然进行最终任务验收，再对计划整体验收。
6. 任务列表按责任人、状态或关键词查找。首页“我的今天”可进入统一交接与验收待办。
7. 管理者配置流程、职位与邀请；成员设置个人提示词。左下支持新建项目，导航保留资料登记入口。

已有工作数据键 `judex.work.demo.v4` 保留，不为界面清理删除业务记录。AI 回复、示例文件和本地工作结果仍是演示，未连接真实模型、CLI、仓库或生产环境。

实现与缺口见 [卡片树与闭环](../工作室2.0卡片树与闭环.md)。当前测试只统计保留的工作室状态和 E2E 用例，淘汰界面的测试已移除。截图脚本为 `node scripts/capture-studio.mjs`，产物位于 `.runtime/screenshots/studio2-*.png`。
