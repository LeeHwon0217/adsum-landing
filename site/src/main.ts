// 글씨 — 앱과 같은 두 벌을 사이트에 묶어 둔다 (ADR-126)
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "@fontsource/jua/korean-400.css";
import "@fontsource/jua/latin-400.css";
// 앱의 토큰·캐릭터·말풍선 CSS (자동 생성) 다음에 사이트 CSS
import "./app-kit/app.css";
import "./styles.css";

import { mountDay } from "./day";
import { mountDesk } from "./desk";
import { mountMood } from "./mood";
import { mountPaging } from "./paging";
import { createAdsum, setPose } from "./pose";
import { mountSignup } from "./signup";
import { mountTalk } from "./talk";

const must = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`${selector}가 없습니다.`);
  return element;
};

mountDesk(must<HTMLElement>("[data-desk]"));
mountTalk(must<HTMLElement>("[data-talk]"));
mountDay(must<HTMLElement>("[data-day]"));
mountMood(must<HTMLElement>("[data-mood]"));
mountPaging();
mountSignup(must<HTMLFormElement>("[data-signup]"));
// 한 장면에 한 포즈 — 장식이라 반응은 없다. 화면에 들어올 때마다 그 포즈를 처음부터 한다
// (환호·기지개처럼 한 번만 도는 모션이 화면 밖에서 끝나 버리지 않게)
const poses = new Map<Element, { adsum: HTMLElement; pose: string }>();
document.querySelectorAll<HTMLElement>("[data-pose]").forEach((figure) => {
  const pose = figure.dataset.pose ?? "idle";
  const adsum = createAdsum("idle");
  const slot = figure.classList.contains("chat-figure") ? document.createElement("div") : figure;
  if (slot !== figure) {
    slot.className = "pose-slot";
    figure.append(slot);
  }
  slot.append(adsum);
  poses.set(figure, { adsum, pose });
});
const replay = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      const found = poses.get(entry.target);
      if (found) setPose(found.adsum, entry.isIntersecting ? found.pose : "idle");
    }
  },
  { threshold: 0.4 },
);
poses.forEach((_, figure) => replay.observe(figure));

/** 섹션 11개 — 오른쪽 점 하나씩. 섹션 하나가 여러 장면(.scene)을 품기도 한다 */
const scenes = [...document.querySelectorAll<HTMLElement>("[data-scene]")];
/** 한 화면씩 — 글이 올라오고, 바탕색을 따르는 단위 */
const screens = [...document.querySelectorAll<HTMLElement>(".scene")];

// 처음 보일 때 한 번 글이 올라온다
const reveal = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.setAttribute("data-in", "");
      reveal.unobserve(entry.target);
    }
  },
  { threshold: 0.25 },
);
screens.forEach((screen) => reveal.observe(screen));

// 오른쪽 점 — 화면 가운데를 지나는 장면이 지금 장면
const dots = must<HTMLElement>("[data-dots]");
const links = scenes.map((scene) => {
  // 커서를 올리면 막대가 두꺼워지고 이름과 한 줄 설명이 뜬다. 누르면 그 섹션으로
  const link = document.createElement("a");
  link.href = `#${scene.id}`;
  const name = scene.dataset.scene ?? scene.id;
  link.setAttribute("aria-label", name);
  const label = document.createElement("span");
  label.className = "dot-label";
  label.innerHTML = `<b></b><small></small>`;
  label.querySelector("b")!.textContent = name;
  label.querySelector("small")!.textContent = scene.dataset.desc ?? "";
  link.append(label);
  dots.append(link);
  return link;
});
const current = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const index = scenes.indexOf(entry.target as HTMLElement);
      links.forEach((link, i) => link.setAttribute("aria-current", String(i === index)));
    }
  },
  { rootMargin: "-50% 0px -50% 0px" },
);
scenes.forEach((scene) => current.observe(scene));

// 흰 장면 위에선 위 막대와 점을 짙은 색으로 — 맨 위 띠에 걸친 장면의 바탕을 따른다
const nav = must<HTMLElement>(".nav");
const toneWatch = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const tone = (entry.target as HTMLElement).dataset.tone ?? "";
      nav.dataset.tone = tone;
      dots.dataset.tone = tone;
    }
  },
  { rootMargin: "0px 0px -92% 0px" },
);
screens.forEach((screen) => toneWatch.observe(screen));
