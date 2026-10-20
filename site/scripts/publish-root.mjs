// 빌드한 사이트를 레포 맨 위로 옮긴다 — GitHub Pages가 거기를 보여 준다.
// 예전 페이지는 old/에 남긴다 (처음 한 번만).
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = resolve(SITE, "..");
const DIST = join(SITE, "dist");

if (!existsSync(join(DIST, "index.html"))) throw new Error("dist/index.html이 없습니다 — 먼저 빌드하세요.");

// 지난 빌드가 남긴 assets/는 지운다. 파일 이름에 해시가 붙어 계속 쌓인다
rmSync(join(ROOT, "assets"), { recursive: true, force: true });
for (const name of readdirSync(DIST)) cpSync(join(DIST, name), join(ROOT, name), { recursive: true });
mkdirSync(join(ROOT, "old"), { recursive: true });
console.log(`[publish] ${DIST} → ${ROOT}`);
