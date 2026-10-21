/**
 * "마구 누르면 삐져요" — 삐짐 → 쓰다듬기 → 풀림을 되풀이해 보여 준다.
 * 대사는 첫 화면 반응(desk.ts)과 같다. 화면이 보일 때만 돈다.
 */
import { createAdsum, setPose } from "./pose";

interface Beat {
  pose: string;
  say: string;
  ms: number;
}

const BEATS: Beat[] = [
  { pose: "sulking", say: "…저 지금 삐졌어요.", ms: 3200 },
  { pose: "petted", say: "…이번만 봐 드릴게요.", ms: 2600 },
  { pose: "welcome", say: "헤헤.", ms: 2200 },
];

export function mountMood(figure: HTMLElement): void {
  const say = figure.querySelector<HTMLElement>("[data-mood-say]");
  if (!say) throw new Error("[data-mood-say]가 없습니다.");
  const adsum = createAdsum(BEATS[0].pose);
  figure.append(adsum);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let index = 0;
  let timer: number | undefined;
  const next = (): void => {
    index = (index + 1) % BEATS.length;
    setPose(adsum, BEATS[index].pose);
    say.textContent = BEATS[index].say;
    timer = window.setTimeout(next, BEATS[index].ms);
  };
  new IntersectionObserver(([entry]) => {
    window.clearTimeout(timer);
    if (entry.isIntersecting) timer = window.setTimeout(next, BEATS[index].ms);
  }).observe(figure);
}
