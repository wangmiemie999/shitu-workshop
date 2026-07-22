#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "[错误] 未检测到 Node.js，请先到 https://nodejs.org 安装 LTS 版本后重试。"
  read -p "按回车键退出"
  exit 1
fi
[ -f .env ] || { [ -f .env.example ] && cp .env.example .env; }
echo "正在启动 ImageCraft，请不要关闭本窗口..."
(sleep 1.5 && open http://127.0.0.1:4173) &
node server.js
