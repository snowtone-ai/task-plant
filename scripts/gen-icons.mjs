/**
 * SVG → PNG アイコン生成スクリプト
 * 使い方: node scripts/gen-icons.mjs
 *
 * 出力:
 *   public/icons/icon-192.png          (standard 192×192)
 *   public/icons/icon-512.png          (standard 512×512)
 *   public/icons/icon-maskable-192.png (maskable 192×192)
 *   public/icons/icon-maskable-512.png (maskable 512×512)
 */

import { readFileSync } from "fs";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const svgSrc = readFileSync(path.join(root, "public/icon.svg"), "utf8");

// ── maskable 用 SVG: 角丸なし全面背景 + コンテンツを 80% safe zone に縮小 ──
const maskableSvg = svgSrc
  // <rect> の rx="100" を削除してフル塗り
  .replace(/rx="100"/, 'rx="0"')
  // viewBox の中身を 0.8 倍に縮小して中央揃え（safe zone 確保）
  // 元の描画内容 group を scale+translate でラップする
  .replace(
    /<\/defs>/,
    `</defs><g transform="translate(51.2, 51.2) scale(0.8)">`
  )
  .replace(/<\/svg>/, "</g></svg>");

async function generate(svgStr, size, outPath) {
  const buf = Buffer.from(svgStr);
  await sharp(buf, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`✓ ${outPath.replace(root + "/", "")}`);
}

const iconsDir = path.join(root, "public/icons");

await generate(svgSrc,      192, path.join(iconsDir, "icon-192.png"));
await generate(svgSrc,      512, path.join(iconsDir, "icon-512.png"));
await generate(maskableSvg, 192, path.join(iconsDir, "icon-maskable-192.png"));
await generate(maskableSvg, 512, path.join(iconsDir, "icon-maskable-512.png"));

console.log("\nアイコン生成完了 🌱");
