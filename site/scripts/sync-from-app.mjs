// 앱(../../Adsum)에서 아숨 캐릭터를 그대로 가져온다 — 랜딩의 아숨이 앱과 같은 그림, 같은 반응이 되게.
//
//   node scripts/sync-from-app.mjs            (dev·build 앞에서 자동으로 돈다)
//   ADSUM_APP=C:/dreams/Adsum node scripts/...  앱 위치가 다르면
//
// 만드는 것 (src/app-kit/, 자동 생성 — 손으로 고치지 않는다):
//   Character.ts · touch.ts · mood.ts   캐릭터 코드 (앱 그대로, import 경로만 바꿈)
//   app.css                             앱의 디자인 토큰 + 캐릭터·말풍선 CSS
//   character.html · say.html           앱의 캐릭터·말풍선 마크업
// 앱이 없으면(다른 PC) 이미 있는 app-kit을 그대로 쓴다.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const APP = resolve(process.env.ADSUM_APP ?? join(SITE, "..", "..", "Adsum"));
const OUT = join(SITE, "src", "app-kit");
const HEADER = (from) => `// 자동 생성 — scripts/sync-from-app.mjs가 앱의 ${from}에서 가져온다. 손으로 고치지 않는다.\n`;

if (!existsSync(join(APP, "index.html"))) {
  if (existsSync(join(OUT, "Character.ts"))) {
    console.log(`[sync] 앱(${APP})이 없어 지금 app-kit을 그대로 씁니다.`);
    process.exit(0);
  }
  throw new Error(`앱을 찾지 못했습니다: ${APP}. ADSUM_APP로 위치를 알려 주세요.`);
}
mkdirSync(OUT, { recursive: true });

const read = (path) => readFileSync(join(APP, path), "utf8").replace(/\r\n/g, "\n");

// ── 코드 ──
const character = read("src/features/character/Character.ts")
  .replace('from "../../core/mood"', 'from "./mood"')
  .replace('from "../../core/touch"', 'from "./touch"');
if (/from "\.\.\//.test(character)) throw new Error("Character.ts에 바꾸지 못한 import가 있습니다 — 동기화 스크립트를 고치세요.");
writeFileSync(join(OUT, "Character.ts"), HEADER("src/features/character/Character.ts") + "// @ts-nocheck 앱 설정으로 검사된 코드다\n" + character);

const touch = read("src/core/touch.ts");
if (/^import /m.test(touch)) throw new Error("touch.ts가 다른 모듈을 쓰기 시작했습니다 — 동기화 스크립트를 고치세요.");
writeFileSync(join(OUT, "touch.ts"), HEADER("src/core/touch.ts") + "// @ts-nocheck 앱 설정으로 검사된 코드다\n" + touch);

// mood.ts는 일정 계산을 끌고 온다 — 캐릭터가 쓰는 건 타입 하나뿐이라 그것만 옮긴다
const restingType = read("src/core/mood.ts").match(/export type RestingState = [^;]+;/);
if (!restingType) throw new Error("mood.ts에서 RestingState를 찾지 못했습니다.");
writeFileSync(join(OUT, "mood.ts"), HEADER("src/core/mood.ts (RestingState만)") + restingType[0] + "\n");

// ── CSS ──
const html = read("index.html");
const between = (start, end) => {
  const a = html.indexOf(start);
  const b = html.indexOf(end, a + start.length);
  if (a < 0 || b < 0) throw new Error(`앱 CSS에서 구간을 못 찾았습니다: ${start} ~ ${end}`);
  return html.slice(a, b);
};
const tokens = between(":root {", "/*\n        창 설정(transparent");
const characterCss = between("/* ═══ 캐릭터 ═══", "/* ═══ 메뉴 버튼 ═══");
const speechCss = between("/* ═══ 아숨이 먼저 거는 말 (ADR-046) ═══", "/* ═══ 설정 ═══");
writeFileSync(
  join(OUT, "app.css"),
  HEADER("index.html <style>").replace(/^\/\/ (.*)$/m, "/* $1 */") + [tokens, characterCss, speechCss].join("\n\n"),
);

// ── 마크업 — 여는 태그부터 짝이 맞는 닫는 태그까지 ──
const element = (openTag) => {
  const start = html.indexOf(openTag);
  if (start < 0) throw new Error(`앱 마크업에서 못 찾았습니다: ${openTag}`);
  const tag = /^<(\w+)/.exec(openTag)[1];
  const re = new RegExp(`<${tag}[\\s>]|</${tag}>`, "g");
  re.lastIndex = start;
  let depth = 0;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    depth += m[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return html.slice(start, m.index + m[0].length);
  }
  throw new Error(`닫는 태그를 못 찾았습니다: ${openTag}`);
};
writeFileSync(join(OUT, "character.html"), element('<div id="character-layer">'));
writeFileSync(join(OUT, "say.html"), element('<div id="say"'));

console.log(`[sync] 앱(${APP})에서 아숨을 가져왔습니다 → src/app-kit/`);
