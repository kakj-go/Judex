# D15 挂载 PoC（模式 A：只读 PVC 挂载）

日期：2026-09-25。环境：本机单节点集群 desktop-control-plane（v1.36.1）、Docker 29.7.2、Helm 3.16.4。
目的：验证详细设计 11 的模式 A 关键前提——共享区只读挂载的物理强制、多沙箱并发只读、运行中新增版本的挂载内动态可见，以及两条适配路径（SeaweedFS 原生 CSI / 外部 S3 通用协议）。

## 结论总表

| # | 验证项 | 路径 | 结果 |
| --- | --- | --- | --- |
| 1 | 只读强制（EROFS）：write/touch/chmod/rm | CSI + OpenSandbox 沙箱 + rclone/S3 | ✅ 全部以 "Read-only file system" 拒绝 |
| 2 | RWX 并发只读：两 Pod 同时挂同一 PVC | CSI | ✅ 同时挂载、同时读取成功 |
| 3 | 挂载内读取共享文件 | 全部三条路径 | ✅ busybox/CSI、OpenSandbox 沙箱、rclone+S3 均可读 |
| 4 | 动态可见性：运行中写入新文件/新版本目录 | CSI（busybox/沙箱）、rclone+S3 | ✅ 可见，但**受挂载目录缓存 TTL 约束**（见下） |
| 5 | workspace 自由区可写、project 只读共存 | OpenSandbox 真实沙箱 | ✅ `/workspace/project` EROFS、`/workspace/` 自由写成功 |
| 6 | 版本路径 `plans/{planId}/{materialId}/v{versionId}/` | CSI + 沙箱 | ✅ v3/v4/v5 并存只读 |

### 关键发现：动态可见性是"TTL 内最终可见"，不是即时

- 缓存未命中（挂载首次列目录）时即时可见（v4/v5 场景实测）。
- 父目录列表已被缓存时，新目录要等目录缓存 TTL 过期后出现：实测一次 >110s 不可见、约 3~4 分钟后可见（weed mount 默认缓存参数）；rclone 挂 S3 配 `--dir-cache-time 15s` 时 <20s 可见。
- **对设计的意义**：11 文档"平台登记后发事件、运行层核实固定版本路径可读、标记 preparing/failed"是必需流程而非保险——publish 工具返回后，运行层必须核实路径在挂载中可读，才向模型声明可用；目录缓存 TTL 是可调参数（可见性延迟 ↔ 请求量权衡）。

## 三条验证路径与部署形态

### 1. SeaweedFS 原生 CSI（存储层）

- `seaweedfs.yaml`：单 Pod `weed server`（master+volume+filer+s3 单进程，chrislusf/seaweedfs:4.47），同正式 chart 的 compact 拓扑。
- `seaweedfs-csi.yaml`：上游 seaweedfs-csi-driver v1.4.32（controller + node + mount DaemonSet），动态供给 RWX PVC。
- `sandbox-pods.yaml`：两个 busybox Pod 只读挂载 `/workspace/project`。

### 2. OpenSandbox 真实沙箱（PoC A）

- `osb-values.yaml`：vendored chart（0.2.2-judex.1）全组件安装（controller + CRD + server）。
- 经 Python SDK（v1.1.0）调 Lifecycle API 创建真实沙箱：`alpine:3.20` + per-sandbox volume（PVC `poc-project-p1`，`readOnly=True`，`mountPath=/workspace/project`）。
- 沙箱内实测：读共享文件 ✅、`touch` EROFS 拒绝 ✅、`/workspace/` 自由写 ✅、运行中 filer 写入的新目录按缓存 TTL 出现 ✅。
- BatchSandbox CR 由 controller 正常创建，TTL 自动过期回收。

### 3. 外部 S3 通用协议（PoC B）

- `ext-s3-mount.yaml`：rclone 1.68.2 以标准 S3 API 挂载 S3 网关桶 `ext-share`（endpoint 指向 SeaweedFS s3 端口 8333，等同任意外部 S3 服务），`--read-only --dir-cache-time 15s`。
- 实测：挂载内读（S3 GET 链路）✅、只读强制 ✅、新对象 15s 缓存过期后可见 ✅。
- 结论：外部 S3 路径可行，可见性延迟由 `--dir-cache-time` 控制；生产按可见性要求配置并配合 publish 后路径核实。

## 踩坑记录（正式实现必须吸收）

1. **CSI 驱动 filer 地址填 HTTP 端口 8888，驱动自动用端口+10000 做 gRPC（18888）**；经 Service 访问时 Service 必须同时暴露 8888 和 18888。本 PoC 用 StatefulSet Pod DNS 直连绕开。
2. 上游 SeaweedFS Helm Chart 4.x 与 Helm 3.16 不兼容（`fromToml` 未定义）；正式 chart 用自渲染 manifest 无此问题。
3. 上游 CSI manifest 钉 v1.4.5 过旧，升到 v1.4.32；`--leader-election-namespace` 必须与安装 namespace 一致。
4. 单节点集群 CSI controller 的 pod anti-affinity 使滚动更新死锁，需手动删旧 Pod。
5. **OpenSandbox server 的 config.toml 默认 `kubernetes.namespace = "opensandbox"`，不存在的 namespace 导致 K8s API 404**——必须覆盖为实际 namespace（见 osb-values.yaml）。
6. OpenSandbox server 必须配置 API key，否则启动即退出（`server.api_key is empty`）。
7. OpenSandbox CRD 是集群级资源且被首个安装的 release 拥有；其他 release 想装会报 ownership 冲突——要么复用已有 controller（server-only + 共享 CRD），要么等其卸载。本 PoC 期间恰逢集群里另一实验项目的 CRD 被卸载，随即完整安装了自己的 controller。
8. Python SDK `ConnectionConfig` 用 `domain` + `protocol` + `headers`（API key 放 header），不是 base_url/api_key 字段；`Sandbox(sandbox_id=...)` 直连重连不可用（构造器需要内部 service 对象），重连入口待实现时确认。
9. **`s3.bucket.create` 会为桶创建独立 collection，all-in-one 单进程默认 8 个卷槽满后 S3 PUT 报 500**（filer 直写不受影响）——正式内置拓扑需评估每桶 collection 与卷容量；本 PoC 写入经 filer API、读取经 S3 API 完成验证。
10. rclone 远端名不能含连字符（env 配置 `RCLONE_CONFIG_<NAME>_` 不支持）；YAML 折行标量（`>`）的深缩进续行会按字面换行，长命令用单行。
11. Windows Git Bash 下 `kubectl exec` 带绝对路径需 `export MSYS_NO_PATHCONV=1`。

## 仍待验证（D15 剩余）

- 多节点集群、缓存一致性与真实负载量测（依赖 D06 容量目标）。
- OpenSandbox 预热池与挂载的组合验证（与 per-sandbox volume 互斥为硬限制，见详细设计 06/08）。
- 生产内置 SeaweedFS 拓扑下的 S3 PUT（每桶 collection 卷容量规划）。

## 清理

```sh
helm uninstall osb -n judex-poc-d15
kubectl delete namespace judex-poc-d15
kubectl delete -f tests/k8s/poc-d15/seaweedfs-csi.yaml   # 集群级 CSI 资源（CSIDriver、ClusterRole 等），删 namespace 不会移除
```

注意：CSI manifest 与 OpenSandbox CRD 均含集群级资源，删 namespace 后需按上面单独清理；OpenSandbox CRD 带 `helm.sh/resource-policy: keep`，由 `helm uninstall` 与 `--crds.keep=false` 策略决定去留。
