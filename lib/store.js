import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, scryptSync, timingSafeEqual, randomUUID } from "node:crypto";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DATA_DIR = join(ROOT, "data");
const STORE_FILE = join(DATA_DIR, "store.json");
const SESSION_TTL = 1000 * 60 * 60 * 24 * 14; // 14 天

function emptyStore() {
  return { users: [], invites: [], sessions: {} };
}

export function loadStore() {
  try {
    if (!existsSync(STORE_FILE)) return emptyStore();
    const data = JSON.parse(readFileSync(STORE_FILE, "utf8"));
    return { ...emptyStore(), ...data };
  } catch {
    return emptyStore();
  }
}

export function saveStore(store) {
  mkdirSync(DATA_DIR, { recursive: true });
  const tmp = STORE_FILE + ".tmp";
  writeFileSync(tmp, JSON.stringify(store, null, 2));
  renameSync(tmp, STORE_FILE);
}

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(String(password), salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const candidate = scryptSync(String(password), salt, 64);
  const stored = Buffer.from(hash, "hex");
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}

export function registerUser(store, { phone, password, invite }) {
  phone = String(phone || "").trim();
  invite = String(invite || "").trim().toUpperCase();
  if (!/^1\d{10}$/.test(phone)) return { error: "请输入 11 位手机号" };
  if (String(password || "").length < 6) return { error: "密码至少 6 位" };
  if (store.users.some((u) => u.phone === phone)) return { error: "这个手机号已经注册" };
  const code = store.invites.find((c) => c.code === invite);
  if (!code) return { error: "邀请码无效" };
  if (code.usedBy.length >= code.maxUses) return { error: "该邀请码使用名额已满" };
  const { salt, hash } = hashPassword(password);
  const user = { phone, salt, hash, invite, quota: code.quotaPerUser, used: 0, createdAt: new Date().toISOString() };
  store.users.push(user);
  code.usedBy.push(phone);
  return { user };
}

export function loginUser(store, { phone, password }) {
  const user = store.users.find((u) => u.phone === String(phone || "").trim());
  if (!user || !verifyPassword(password, user.salt, user.hash)) return { error: "手机号或密码不正确" };
  return { user };
}

export function createSession(store, phone) {
  const token = randomUUID() + randomBytes(16).toString("hex");
  store.sessions[token] = { phone, expires: Date.now() + SESSION_TTL };
  // 清理过期会话
  for (const [t, s] of Object.entries(store.sessions)) if (s.expires < Date.now()) delete store.sessions[t];
  return token;
}

export function getSessionUser(store, token) {
  const session = store.sessions[String(token || "")];
  if (!session || session.expires < Date.now()) return null;
  return store.users.find((u) => u.phone === session.phone) || null;
}

export function destroySession(store, token) {
  delete store.sessions[String(token || "")];
}

export function createInvite(store, { quotaPerUser = 20, maxUses = 1, note = "" } = {}) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = Array.from(randomBytes(8)).map((b) => alphabet[b % alphabet.length]).join("");
  } while (store.invites.some((c) => c.code === code));
  const invite = { code, quotaPerUser: Number(quotaPerUser), maxUses: Number(maxUses), usedBy: [], note: String(note), createdAt: new Date().toISOString() };
  store.invites.push(invite);
  return invite;
}

export function publicUser(user) {
  if (!user) return null;
  return { phone: user.phone, quota: user.quota, used: user.used, remaining: Math.max(0, user.quota - user.used), createdAt: user.createdAt };
}
