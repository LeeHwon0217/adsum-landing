/**
 * "먼저 챙겨 주는 하루" — 아숨이 먼저 거는 말. 문장은 앱에 있는 그대로다
 * (src/core/schedule/alerts.ts · care.ts · cues · features/character/lines.ts, ADR-128 존댓말).
 * 포즈는 그 순간 앱에서 아숨이 하는 모션이다.
 */
import { createAdsum } from "./pose";

interface Moment {
  time: string;
  what: string;
  label: string | null;
  say: string;
  pose: string;
}

const MOMENTS: Moment[] = [
  { time: "09:00", what: "켰더니 오늘 일정부터 알려 줘요.", label: null, say: "좋은 아침이에요! 오늘은 3개 있어요~", pose: "welcome" },
  { time: "13:30", what: "회의 30분 전. 눌러야 닫혀서 못 보고 지나치지 않아요.", label: "일정 알림", say: "30분 뒤 14:00에 팀 회의예요! 슬슬 준비하세요~", pose: "raise-hand" },
  { time: "15:10", what: "회의가 끝나고 자리로 돌아오면 물어봐요.", label: null, say: "팀 회의 어떠셨어요? 다음 약속 생기면 말씀해 주세요!", pose: "raise-hand" },
  { time: "16:00", what: "\"10분 쉬고 올게\" 하고 갔는데 안 돌아오면 불러요.", label: null, say: "쉬는 시간 끝났어요! 이제 돌아오세요~", pose: "nervous" },
  { time: "18:30", what: "오늘 일정이 다 끝나면 기지개를 켜요.", label: null, say: "오늘 일정 끝! 수고하셨어요!", pose: "stretch" },
  { time: "23:40", what: "밤이 늦으면 아숨도 졸아요.", label: null, say: "…", pose: "dozing" },
];

export function mountDay(track: HTMLElement, prev: HTMLButtonElement, next: HTMLButtonElement): void {
  for (const moment of MOMENTS) {
    const card = document.createElement("article");
    card.className = "moment";
    card.innerHTML = `
      <div class="moment-time">${moment.time}</div>
      <p class="moment-what">${moment.what}</p>
      <div class="moment-pose"></div>
      <div class="moment-say">${moment.label ? `<small>${moment.label}</small>` : ""}${moment.say}</div>`;
    card.querySelector(".moment-pose")?.append(createAdsum(moment.pose));
    track.append(card);
  }
  bindArrows(track, prev, next);
}

/** 화살표로 카드 한 장씩 넘긴다. 끝에 닿으면 그쪽 화살표를 끈다 */
function bindArrows(track: HTMLElement, prev: HTMLButtonElement, next: HTMLButtonElement): void {
  const step = (): number => {
    const card = track.querySelector<HTMLElement>(".moment");
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card ? card.offsetWidth + gap : track.clientWidth;
  };
  prev.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
  next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
  const sync = (): void => {
    prev.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
  };
  track.addEventListener("scroll", sync, { passive: true });
  new ResizeObserver(sync).observe(track);
  sync();
}
