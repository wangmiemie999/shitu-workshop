#!/usr/bin/env node
// 邀请码管理工具
// 生成: node tools/invites.js create <数量> [--quota 每人张数] [--uses 每码可用人数] [--note 备注]
// 查看: node tools/invites.js list
// 用户: node tools/invites.js users
import { loadStore, saveStore, createInvite } from "../lib/store.js";

const [, , command, ...rest] = process.argv;
const store = loadStore();

function flag(name, fallback) {
  const i = rest.indexOf("--" + name);
  return i >= 0 && rest[i + 1] ? rest[i + 1] : fallback;
}

if (command === "create") {
  const count = Math.max(1, Math.min(200, Number(rest[0]) || 1));
  const quotaPerUser = Number(flag("quota", 20));
  const maxUses = Number(flag("uses", 1));
  const note = flag("note", "");
  const made = [];
  for (let i = 0; i < count; i += 1) made.push(createInvite(store, { quotaPerUser, maxUses, note }));
  saveStore(store);
  console.log(`已生成 ${made.length} 个邀请码（每人可生成 ${quotaPerUser} 张 / 每码限 ${maxUses} 人注册）：\n`);
  made.forEach((c) => console.log("  " + c.code));
} else if (command === "list") {
  if (!store.invites.length) { console.log("还没有邀请码。用 create 命令生成。"); process.exit(0); }
  console.log("邀请码            已用/名额   每人张数   备注");
  store.invites.forEach((c) => console.log(`${c.code.padEnd(16)} ${String(c.usedBy.length + "/" + c.maxUses).padEnd(10)} ${String(c.quotaPerUser).padEnd(9)} ${c.note}`));
} else if (command === "users") {
  if (!store.users.length) { console.log("还没有注册用户。"); process.exit(0); }
  console.log("手机号          已用/配额   注册时间");
  store.users.forEach((u) => console.log(`${u.phone.padEnd(14)} ${String(u.used + "/" + u.quota).padEnd(10)} ${u.createdAt.slice(0, 16).replace("T", " ")}`));
} else {
  console.log("用法:\n  node tools/invites.js create 10 --quota 20 --uses 1 --note 首批内测\n  node tools/invites.js list\n  node tools/invites.js users");
}
