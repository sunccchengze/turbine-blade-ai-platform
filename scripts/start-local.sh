#!/usr/bin/env bash
# TurbineAI 本地一键启动（Unix/macOS/WSL 版 · D30 备份三件套·第二件）
# 用法：./scripts/start-local.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "[1/2] 启动后端 (uvicorn :8000) ..."
(cd "$ROOT/backend" && uvicorn app.main:app --reload --port 8000) &
BACK_PID=$!

echo "[2/2] 启动前端 (Vite :5173) ..."
(cd "$ROOT/frontend" && npm run dev) &
FRONT_PID=$!

trap 'echo; echo "停止服务..."; kill $BACK_PID $FRONT_PID 2>/dev/null || true' EXIT INT TERM

echo
echo "浏览器打开 http://localhost:5173"
echo "后端文档   http://localhost:8000/docs"
echo "Ctrl+C 停止"
wait
