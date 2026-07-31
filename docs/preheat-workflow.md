# 🔥 后端预热 workflow（安装模板）

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
