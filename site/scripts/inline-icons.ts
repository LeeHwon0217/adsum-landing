/**
 * index.html의 `<i class="ph ph-이름">`을 그 아이콘 하나짜리 SVG로 바꿔 넣는다.
 *
 * 왜: 아이콘 열몇 개를 쓰려고 Phosphor 글꼴 전체(CSS 200KB + 글꼴 파일)를 싣지 않는다.
 * 모양은 같은 패키지(@phosphor-icons/web)의 selection.json에서 가져온다.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import type { Plugin } from "vite";

interface Selection {
  height: number;
  icons: { icon: { paths: string[] }; properties: { name: string } }[];
}

const require = createRequire(import.meta.url);
const load = (weight: "regular" | "fill"): Selection =>
  JSON.parse(readFileSync(require.resolve(`@phosphor-icons/web/${weight}/selection.json`), "utf8"));

const ICON = /<i class="(ph|ph-fill) ph-([a-z0-9-]+)([^"]*)"([^>]*)><\/i>/g;

export function inlineIcons(): Plugin {
  const sets = { ph: load("regular"), "ph-fill": load("fill") };
  return {
    name: "adsum-inline-icons",
    transformIndexHtml(html) {
      return html.replace(ICON, (_, weight: keyof typeof sets, name: string, extra: string, attrs: string) => {
        const set = sets[weight];
        // fill 묶음의 이름은 "hand-tap-fill" 꼴이다
        const found = set.icons.find((entry) => entry.properties.name === name || entry.properties.name === `${name}-fill`);
        if (!found) throw new Error(`Phosphor ${weight} 아이콘 "${name}"이 없습니다.`);
        const paths = found.icon.paths.map((d) => `<path d="${d}"/>`).join("");
        return `<svg class="icon${extra}" viewBox="0 0 ${set.height} ${set.height}" fill="currentColor"${attrs}>${paths}</svg>`;
      });
    },
  };
}
