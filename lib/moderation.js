// 输入内容基础过滤（内测阶段的基线防线）
// 说明：这是关键词级别的基础过滤。正式规模化运营时，建议在此基础上
// 接入云厂商内容安全审核 API（文本+图片双审），本模块保留同样的接口即可替换。
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

// 基础违禁类目关键词（可通过 data/blocklist.txt 每行一词扩充，无需改代码）
const BUILTIN = [
  // 色情低俗
  "色情", "裸照", "淫秽", "性交易", "约炮",
  // 暴力恐怖
  "爆炸物制作", "炸弹制作", "枪支买卖", "杀人教程", "恐怖袭击",
  // 违法犯罪
  "毒品购买", "冰毒", "海洛因", "代开发票", "洗钱渠道", "赌博网站", "博彩平台",
  // 诈骗引流
  "刷单兼职", "裸聊", "仿冒银行"
];

let cachedList = null;
let cachedAt = 0;

function loadList() {
  const now = Date.now();
  if (cachedList && now - cachedAt < 60000) return cachedList;
  const extras = [];
  const file = join(ROOT, "data", "blocklist.txt");
  if (existsSync(file)) {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const word = line.trim();
      if (word && !word.startsWith("#")) extras.push(word);
    }
  }
  cachedList = [...BUILTIN, ...extras];
  cachedAt = now;
  return cachedList;
}

// 返回 null 表示通过；返回字符串表示命中的违禁词（用于日志，不回显给用户）
export function checkText(...texts) {
  const merged = texts.map((t) => String(t || "")).join("\n");
  if (!merged.trim()) return null;
  for (const word of loadList()) {
    if (merged.includes(word)) return word;
  }
  return null;
}

export const REJECT_MESSAGE = "内容包含不适宜生成的信息，请调整后重试";
