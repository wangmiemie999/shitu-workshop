// PNG 读写与 "AI生成" 标识水印（零依赖，使用 node:zlib）
// 依据《人工智能生成合成内容标识办法》，对 AI 生成图片添加显式标识
import { inflateSync, deflateSync } from "node:zlib";

const BADGE_W = 171;
const BADGE_H = 66;
const BADGE_RGBA = inflateSync(Buffer.from("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", "base64"));

// ---- CRC32（PNG块校验） ----
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

// ---- 解码：仅支持8位 RGB/RGBA 非隔行（AI生图接口返回格式） ----
function decodePng(buffer) {
  if (buffer.readUInt32BE(0) !== 0x89504e47) throw new Error("不是PNG文件");
  let pos = 8, width = 0, height = 0, colorType = 0, idat = [];
  while (pos < buffer.length) {
    const len = buffer.readUInt32BE(pos);
    const type = buffer.toString("ascii", pos + 4, pos + 8);
    const data = buffer.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      const bitDepth = data[8]; colorType = data[9];
      if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6) || data[12] !== 0) return null; // 不支持的格式，跳过打标
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  const channels = colorType === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const pixels = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = pixels.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? pixels.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x += 1) {
      const left = x >= channels ? out[x - channels] : 0;
      const up = prev ? prev[x] : 0;
      const ul = prev && x >= channels ? prev[x - channels] : 0;
      let val = line[x];
      if (filter === 1) val += left;
      else if (filter === 2) val += up;
      else if (filter === 3) val += (left + up) >> 1;
      else if (filter === 4) val += paeth(left, up, ul);
      out[x] = val & 0xff;
    }
  }
  return { width, height, channels, pixels };
}

// ---- 编码：filter 0 ----
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
function encodePng({ width, height, channels, pixels }) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = channels === 4 ? 6 : 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = width * channels;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 6 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

// ---- 将徽章按图片宽度比例混合到右下角 ----
export function stampAiLabel(pngBuffer) {
  try {
    const img = decodePng(pngBuffer);
    if (!img) return pngBuffer; // 特殊格式不阻断出图
    const scale = Math.max(1, Math.round(img.width / 2560 * 10) / 10);
    const bw = Math.round(BADGE_W * scale), bh = Math.round(BADGE_H * scale);
    const margin = Math.round(24 * scale);
    const ox = img.width - bw - margin, oy = img.height - bh - margin;
    if (ox < 0 || oy < 0) return pngBuffer;
    for (let y = 0; y < bh; y += 1) {
      const sy = Math.min(BADGE_H - 1, Math.floor(y / scale));
      for (let x = 0; x < bw; x += 1) {
        const sx = Math.min(BADGE_W - 1, Math.floor(x / scale));
        const bi = (sy * BADGE_W + sx) * 4;
        const alpha = BADGE_RGBA[bi + 3] / 255;
        if (!alpha) continue;
        const pi = ((oy + y) * img.width + (ox + x)) * img.channels;
        for (let ch = 0; ch < 3; ch += 1) {
          img.pixels[pi + ch] = Math.round(BADGE_RGBA[bi + ch] * alpha + img.pixels[pi + ch] * (1 - alpha));
        }
      }
    }
    return encodePng(img);
  } catch {
    return pngBuffer; // 打标失败不阻断业务
  }
}
