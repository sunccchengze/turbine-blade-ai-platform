# 🔥 后端预热 workflow（安装模板）

> ⛔ **时效标记（2026-09-02 追加 · 由分支收敛会话自动判定）** —— 本文件是 **2026-08-08** 的历史快照，**不是现状**。
> 以下写法在今天已经不成立：
> - 第 25 行「- name: Ping backend /health」→ **引用后端 HTTP 接口——现在数据与模型都是随前端部署的静态 JSON / ONNX**
> - 第 28 行「if curl -sf --max-time 40 https://turbine-blade-api-c4f40.containers.snapdeploy.app/health; then」→ **引用已下线的 SnapDeploy 容器域名**
> - 第 40 行「- 定时任务只在默认分支（main）生效 → 装好后合入 PR 即可开始预热。」→ **PR 流程口径已变：见 docs/BRANCH-SAFETY.md §1–§2（PR 可开不可合；或改快进推送）**
>
> 现行口径唯一来源：`HANDOFF.md`（§0.-1 十一条铁律、§9.5 架构现状）、`docs/BRANCH-SAFETY.md`（会话与 git 纪律）、`evidence/metrics.json`（对外数字）。
> ——以及第二轮：
> - 第 20 行「3. 完成后 Actions 里出现 Backend Preheat，每 10 分钟自动 ping 一次后端，汇报当天容器保持热状态。」→ **部署拓扑已变：线上只有 Cloudflare Pages 静态站点**
> - 第 48 行「- 失败不报错：冷启动期间 ping 失败属正常，下一轮自动重试。」→ **「等冷启动」这个前提已不存在：模型与数据随前端静态部署，浏览器内推理**
> **正文一字未改**——当时的判断与过程仍按原样保留，供回顾历程用。

> **为什么在 docs 里而不是 `.github/workflows/`**：Arena 的 GitHub App 没有 `workflows` 权限，
> 无法推送 workflow 文件（报错：`refusing to allow a GitHub App to create or update workflow ... without workflows permission`）。
> 你（承泽）在 GitHub 网页上 30 秒即可装好，见下方步骤。

## 安装步骤（GitHub 网页操作，30 秒）

1. 打开仓库 → **Actions** 标签页 → **New workflow** → **set up a workflow yourself**。
2. 把下面内容整个粘贴进编辑器（覆盖默认内容），Commit changes（可直接 commit 到 main）。
3. 完成后 Actions 里出现 **Backend Preheat**，每 10 分钟自动 ping 一次后端，汇报当天容器保持热状态。

```yaml
name: Backend Preheat

on:
  schedule:
    - cron: '*/10 * * * *'
  workflow_dispatch:

jobs:
  preheat:
    runs-on: ubuntu-latest
    steps:
      - name: Ping backend /health
        run: |
          echo "Pinging $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
          if curl -sf --max-time 40 https://turbine-blade-api-c4f40.containers.snapdeploy.app/health; then
            echo "✅ Backend is warm"
          else
            echo "⏳ Backend sleeping/cold-starting — next cycle will ping again"
          fi
        continue-on-error: true
```

## 说明

- cron 为 UTC；`*/10` = 每 10 分钟一次（免费额度内）。
- 失败不报错：冷启动期间 ping 失败属正常，下一轮自动重试。
- 定时任务只在默认分支（main）生效 → 装好后合入 PR 即可开始预热。
- 手动触发：Actions → Backend Preheat → Run workflow。
