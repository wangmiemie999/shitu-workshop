@echo off
chcp 65001 >nul
title ImageCraft
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 未检测到 Node.js，请先到 https://nodejs.org 下载安装 LTS 版本，安装后重新双击本文件。
  pause
  exit /b
)
if not exist .env (
  if exist .env.example copy .env.example .env >nul
)
echo 正在启动 ImageCraft，请不要关闭本窗口...
start "" http://127.0.0.1:4173
node server.js
pause
