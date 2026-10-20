// 글씨 — 앱과 같은 두 벌을 사이트에 묶어 둔다 (ADR-126)
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "@fontsource/jua/korean-400.css";
import "@fontsource/jua/latin-400.css";
// 앱의 토큰·캐릭터·말풍선 CSS (자동 생성) 다음에 사이트 CSS
import "./app-kit/app.css";
import "./styles.css";

import { mountDay } from "./day";
import { mountDesk } from "./desk";
import { createAdsum } from "./pose";
import { mountTalk } from "./talk";

const must = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`${selector}가 없습니다.`);
  return element;
};

mountDesk(must<HTMLElement>("[data-desk]"));
mountTalk(must<HTMLElement>("[data-talk]"));
mountDay(must<HTMLElement>("[data-day]"), must<HTMLButtonElement>("[data-day-prev]"), must<HTMLButtonElement>("[data-day-next]"));
// 체험판 안내 옆에서 손을 흔든다 — 장식이라 반응은 없다
must<HTMLElement>("[data-signup-adsum]").append(createAdsum("welcome"));

// 처음 보일 때 한 번 들어온다
const reveal = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.setAttribute("data-in", "");
      reveal.unobserve(entry.target);
    }
  },
  { threshold: 0.15 },
);
document.querySelectorAll(".reveal").forEach((element) => reveal.observe(element));

// 위 막대 밑줄 — 첫 화면 맨 위를 벗어나면 (스크롤 이벤트 대신 관찰자로)
const nav = must<HTMLElement>("[data-nav]");
const sentinel = document.createElement("div");
sentinel.style.cssText = "position:absolute;top:0;height:1px;width:1px;";
document.body.prepend(sentinel);
new IntersectionObserver(([entry]) => nav.toggleAttribute("data-scrolled", !entry.isIntersecting)).observe(sentinel);
