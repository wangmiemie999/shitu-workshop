#!/bin/bash
# ImageCraft 服务器一键部署脚本
# 适用系统：Ubuntu 20.04 / 22.04 / 24.04（阿里云、腾讯云轻量服务器默认镜像）
# 用法：将整个项目上传到服务器后，在项目根目录执行：
#   sudo bash deploy/setup.sh 你的域名.com
set -e

DOMAIN="$1"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVICE_NAME="imagecraft"

if [ -z "$DOMAIN" ]; then
  echo "用法: sudo bash deploy/setup.sh 你的域名.com"
  exit 1
fi
if [ "$(id -u)" != "0" ]; then
  echo "请用 sudo 运行本脚本"
  exit 1
fi

echo "==> [1/6] 安装 Node.js 20（如已安装则跳过）"
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -c2-3)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v

echo "==> [2/6] 准备环境配置"
cd "$APP_DIR"
if [ ! -f .env ]; then
  cp .env.example .env
  echo "已创建 .env，稍后请编辑填入 OPENROUTER_API_KEY"
fi
mkdir -p data outputs

echo "==> [3/6] 注册 systemd 服务（崩溃自动重启、开机自启）"
cat > /etc/systemd/system/${SERVICE_NAME}.service << UNIT
[Unit]
Description=ImageCraft
After=network.target

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
ExecStart=$(command -v node) ${APP_DIR}/server.js
Restart=always
RestartSec=3
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable ${SERVICE_NAME}
systemctl restart ${SERVICE_NAME}
sleep 1
systemctl is-active ${SERVICE_NAME} && echo "服务已启动"

echo "==> [4/6] 安装并配置 Nginx 反向代理"
apt-get install -y nginx
cat > /etc/nginx/sites-available/${SERVICE_NAME} << NGINX
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    client_max_body_size 12m;

    location / {
        proxy_pass http://127.0.0.1:4173;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_read_timeout 180s;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/${SERVICE_NAME} /etc/nginx/sites-enabled/${SERVICE_NAME}
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "Nginx 配置完成"

echo "==> [5/6] 安装 HTTPS 证书工具 certbot"
apt-get install -y certbot python3-certbot-nginx
echo "说明：申请证书需要域名已解析到本机且备案通过。届时执行："
echo "    certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"

echo "==> [6/6] 生成首批邀请码"
cd "$APP_DIR"
node tools/invites.js create 5 --quota 20 --note 首批

echo ""
echo "======================================"
echo " 部署完成！"
echo " 1. 编辑 ${APP_DIR}/.env 填入 OPENROUTER_API_KEY，然后: systemctl restart ${SERVICE_NAME}"
echo " 2. 临时测试: http://服务器公网IP （域名备案通过后再解析）"
echo " 3. 备案通过后申请HTTPS: certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo " 4. 常用命令:"
echo "    systemctl status imagecraft     # 查看服务状态"
echo "    journalctl -u imagecraft -f     # 实时查看日志"
echo "    node tools/invites.js users     # 查看注册用户"
echo "======================================"
