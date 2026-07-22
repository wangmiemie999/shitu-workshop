// OpenRouter 生图接口中转（Cloudflare Workers）
// 用途：当国内服务器无法直连 openrouter.ai 时，通过此 Worker 中转请求。
//
// 部署步骤（约10分钟，免费额度每天10万次请求，完全够用）：
// 1. 注册/登录 dash.cloudflare.com
// 2. 左侧 Workers & Pages → Create → Create Worker → 部署默认模板
// 3. 点 Edit code，把本文件全部内容粘贴进去替换，Deploy
// 4. 在 Worker 的 Settings → Variables 添加环境变量：
//      RELAY_TOKEN = 自己随便设一串长密码（防止别人盗用你的中转）
// 5. 记下 Worker 地址，形如 https://xxx.你的子域.workers.dev
// 6. 回到 ImageCraft 服务器，编辑 .env 添加两行：
//      OPENROUTER_IMAGE_URL=https://xxx.你的子域.workers.dev/api/v1/images
//      （并在下方 headers 里透传，见第7步说明）
//    然后 systemctl restart imagecraft
// 7. 鉴权说明：本 Worker 校验请求头 x-relay-token。ImageCraft 服务端
//    发出的请求已带 authorization 头（OpenRouter密钥），Worker 原样转发；
//    x-relay-token 需在 .env 增加 RELAY_TOKEN=同样的密码，服务端会自动附带
//    （v0.5 起服务端已支持，见 server.js 中 RELAY_TOKEN 相关代码）。

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }
    // 校验中转口令，防止 Worker 地址泄露后被他人白嫖
    if (env.RELAY_TOKEN && request.headers.get("x-relay-token") !== env.RELAY_TOKEN) {
      return new Response(JSON.stringify({ error: { message: "中转口令不正确" } }), {
        status: 401,
        headers: { "content-type": "application/json" }
      });
    }
    const url = new URL(request.url);
    const target = "https://openrouter.ai" + url.pathname + url.search;
    const headers = new Headers();
    for (const key of ["authorization", "content-type", "http-referer", "x-title"]) {
      const value = request.headers.get(key);
      if (value) headers.set(key, value);
    }
    const upstream = await fetch(target, {
      method: "POST",
      headers,
      body: request.body
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") || "application/json" }
    });
  }
};
