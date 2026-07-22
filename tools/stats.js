#!/usr/bin/env node
// 运营数据统计
// 用法: node tools/stats.js          # 最近14天
//       node tools/stats.js 30       # 最近30天
//       COST_PER_IMAGE=0.3 node tools/stats.js   # 自定义每张成本(元)估算
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadStore } from "../lib/store.js";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const LOG = join(ROOT, "data", "usage.log");
const DAYS = Math.max(1, Math.min(365, Number(process.argv[2]) || 14));
const COST = Number(process.env.COST_PER_IMAGE || 0.3);

const store = loadStore();
const days = {};
const activeByDay = {};

if (existsSync(LOG)) {
  for (const line of readFileSync(LOG, "utf8").split("\n")) {
    if (!line.trim()) continue;
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }
    const day = String(entry.ts || "").slice(0, 10);
    if (!day) continue;
    days[day] ||= { register: 0, generate: 0, demo: 0 };
    activeByDay[day] ||= new Set();
    if (entry.event === "register") days[day].register += 1;
    if (entry.event === "generate") {
      if (entry.demo) days[day].demo += 1;
      else days[day].generate += 1;
      if (entry.phone) activeByDay[day].add(entry.phone);
    }
  }
}

const sorted = Object.keys(days).sort().slice(-DAYS);
console.log(`ImageCraft 运营统计（最近 ${DAYS} 天 · 每张成本按 ¥${COST} 估算）\n`);
console.log("日期         注册   活跃   真实生图   演示生图   估算成本");
let totalGen = 0, totalReg = 0;
for (const day of sorted) {
  const d = days[day];
  totalGen += d.generate; totalReg += d.register;
  console.log(`${day}   ${String(d.register).padEnd(6)} ${String(activeByDay[day].size).padEnd(6)} ${String(d.generate).padEnd(10)} ${String(d.demo).padEnd(10)} ¥${(d.generate * COST).toFixed(2)}`);
}
if (!sorted.length) console.log("（暂无使用记录）");

const totalUsers = store.users.length;
const totalUsed = store.users.reduce((sum, u) => sum + u.used, 0);
const totalQuota = store.users.reduce((sum, u) => sum + u.quota, 0);
console.log(`\n累计：注册用户 ${totalUsers} 人 · 已消耗额度 ${totalUsed}/${totalQuota} 张 · 期间新增注册 ${totalReg} · 期间真实生图 ${totalGen} 张（约 ¥${(totalGen * COST).toFixed(2)}）`);
