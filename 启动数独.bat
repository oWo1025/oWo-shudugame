@echo off
title 数独游戏
chcp 65001 >nul

echo.
echo   数独游戏 - 双击打开版
echo   =========================
echo.
echo   正在启动本地服务...
echo.

set "ROOT=%~dp0"

if exist "%ROOT%dist-offline\index.html" (
    set "SERVE_DIR=%ROOT%dist-offline"
    echo   使用离线版（单文件，可双击打开）
) else (
    set "SERVE_DIR=%ROOT%dist"
    echo   使用标准版（需 HTTP 服务）
)

echo.

start http://localhost:8118

cd /d "%SERVE_DIR%"
python -m http.server 8118 2>nul
if %errorlevel% neq 0 (
    python3 -m http.server 8118 2>nul
)
if %errorlevel% neq 0 (
    echo   Python 未安装，尝试 Node.js...
    npx serve . -l 8118 --no-clipboard 2>nul
)
if %errorlevel% neq 0 (
    echo.
    echo   错误：未找到 Python 或 Node.js
    echo   请安装 Python 后重试：https://python.org
    pause
)
