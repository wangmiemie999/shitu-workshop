# 拾图工坊

把中文文章拆成 1–8 个认知锚点，并逐张生成“咩咩极简手绘正文配图”的本地全栈网页 MVP。

## 启动

```bash
cd /Users/admin/Documents/Codex/xiaohei-web
npm start
```

打开 <http://127.0.0.1:4173>。

默认是演示模式，会使用内置示例图片走完整流程。启用真实生图：

```bash
cp .env.example .env
# 编辑 .env，填入服务端 OPENAI_API_KEY
npm start
```

真实图片保存在 `outputs/`。API Key 仅由 `server.js` 读取，不会发送到浏览器。

## 测试

```bash
npm test
```

## 生产化前建议

- 增加登录、客户额度和任务队列。
- 将生成图片迁移到对象存储，并设置过期/删除策略。
- 增加请求频率限制、内容审核、成本上限与失败重试。
- 正式商用前确认角色参考照片、生成图及所用模型的商业授权边界。
