# ImageCraft

ImageCraft 是一个本地优先的中文文章配图生成工具：粘贴文章 → 自动拆解配图锚点 → 生成 16:9 极简线稿风格插图，全流程角色形象一致。

## 功能

- 中文文章锚点拆解（1–6 张配图方案，可勾选调整）
- 咩咩极简线稿等 4 种视觉风格预设
- 自定义角色工作室：上传照片生成专属插图角色
- 本地角色库：保存、搜索、切换角色
- 邀请码注册 + 每账号生成额度（内测友好，成本可控）
- AI 生成内容标识：生成图片自动添加"AI生成"显式标识（零依赖 PNG 水印实现）
- 输入内容基础过滤，支持自定义违禁词名单热更新
- 运营统计工具：每日注册 / 活跃 / 生图量 / 成本估算
- OpenRouter 生图接口（可配置中转地址，附 Cloudflare Worker 中转脚本）
- 一键部署脚本（systemd + Nginx + HTTPS）

## 本地预览（无需密钥）

环境要求：Node.js 20+，零 npm 依赖。

```bash
git clone https://github.com/wangmiemie999/imagecraft.git
cd imagecraft
cp .env.example .env
npm start
```

打开 http://127.0.0.1:4173 即可预览完整界面与配图方案流程。

未配置密钥时以**演示模式**运行：生图步骤返回占位图。生成插图需要登录，先创建一个邀请码用于注册：

```bash
node tools/invites.js create 1 --quota 20
```

Windows / Mac 用户也可以直接双击 `启动ImageCraft.bat` / `启动ImageCraft.command` 一键启动。

## 真实生图

在 [OpenRouter](https://openrouter.ai) 申请 API Key，填入 `.env`：

```
OPENROUTER_API_KEY=你的密钥
```

重启后即可生成真实插图（默认模型 bytedance-seed/seedream-4.5）。服务器无法直连 OpenRouter 时，参见 `deploy/openrouter-relay.js` 的免费中转方案。

## 部署上线

完整的服务器部署流程（一键脚本、Nginx、HTTPS、运维命令）见 [deploy/部署指南.md](deploy/部署指南.md)。

## 管理工具

```bash
node tools/invites.js create 10 --quota 20   # 生成邀请码
node tools/invites.js list                   # 邀请码使用情况
node tools/invites.js users                  # 注册用户与额度
node tools/stats.js                          # 运营数据统计
```

## 测试

```bash
npm test
```

## 安全说明

- 密钥仅存于本地 `.env` 文件，已被 `.gitignore` 排除，不会提交到仓库
- 用户数据（`data/`）与生成图片（`outputs/`）同样不会提交
- 密码采用 scrypt 加盐哈希存储

## License

[MIT](LICENSE)
