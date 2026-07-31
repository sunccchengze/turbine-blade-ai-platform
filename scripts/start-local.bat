@echo off
rem ============================================================
rem  TurbineAI 本地一键启动（D30 备份三件套 · 第二件）
rem  用法：双击本文件（或命令行运行 scripts\start-local.bat）
rem  效果：自动开两个窗口 —— 后端(8000) + 前端(5173)，浏览器访问
rem        http://localhost:5173
rem  前置：已按 README 安装后端依赖（pip install -r backend\requirements.txt）
rem        且前端已 npm install 过。
rem ============================================================
chcp 65001 >nul
cd /d "%~dp0.."

rem ── 按需修改：conda 根目录（本机为 D:\anaconda）──────────
set CONDA_ROOT=D:\anaconda

echo ============================================
echo  TurbineAI 本地启动器
echo  后端端口 8000 · 前端端口 5173
echo ============================================
echo.

rem ── 1/2 启动后端 ──────────────────────────────
echo [1/2] 启动后端 (uvicorn :8000) ...
start "TurbineAI Backend" cmd /k "call "%CONDA_ROOT%\Scripts\activate.bat" turbine-ai && cd /d "%CD%\backend" && uvicorn app.main:app --reload --port 8000"

rem 等后端起来再开前端
timeout /t 8 /nobreak >nul

rem ── 2/2 启动前端 ──────────────────────────────
echo [2/2] 启动前端 (Vite :5173) ...
start "TurbineAI Frontend" cmd /k "cd /d "%CD%\frontend" && npm run dev"

echo.
echo 完成！浏览器打开 http://localhost:5173
echo 后端文档： http://localhost:8000/docs
echo 关闭窗口即停止服务。
pause
