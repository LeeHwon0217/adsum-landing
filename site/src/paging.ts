/**
 * 휠 한 번에 한 화면 — 배민처럼.
 *
 * CSS 스냅만으로는 휠을 세게 굴리면 몇 장씩 와다다 넘어간다. 그래서 넓은 화면에선 휠을 직접 받아
 * 한 번 굴릴 때(한 제스처) 딱 한 장만 넘긴다. 트랙패드 관성처럼 이어지는 휠은 조용해질 때까지 무시한다.
 * 휴대폰·낮은 화면은 손대지 않는다 — styles.css의 스냅 조건과 같다.
 */

const PAGED = "(min-width: 900px) and (min-height: 640px)";
/** 넘기는 중엔 휠을 받지 않는다. 부드러운 스크롤이 끝날 만큼 */
const LOCK_MS = 750;
/** 마지막 휠에서 이만큼 조용해야 다음 제스처로 친다 (관성 꼬리를 끊는다) */
const QUIET_MS = 180;
/** 이보다 작은 휠 움직임은 손 떨림으로 본다 */
const MIN_DELTA = 4;

const PAGE_KEYS: Record<string, 1 | -1> = { PageDown: 1, ArrowDown: 1, " ": 1, PageUp: -1, ArrowUp: -1 };

export function mountPaging(): void {
  const media = window.matchMedia(PAGED);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const stops = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>(".scene, .foot")];

  let lockedUntil = 0;
  let lastWheel = 0;

  /** 지금 화면 = 위쪽 가장자리가 화면 위에 가장 가까운 장면 */
  const currentIndex = (list: HTMLElement[]): number => {
    let best = 0;
    let bestGap = Infinity;
    list.forEach((element, index) => {
      const gap = Math.abs(element.getBoundingClientRect().top);
      if (gap < bestGap) [best, bestGap] = [index, gap];
    });
    return best;
  };

  const go = (direction: 1 | -1): void => {
    const list = stops();
    const target = list[Math.min(Math.max(currentIndex(list) + direction, 0), list.length - 1)];
    lockedUntil = performance.now() + LOCK_MS;
    target.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: target.classList.contains("foot") ? "end" : "start" });
  };

  window.addEventListener(
    "wheel",
    (event) => {
      if (!media.matches || event.ctrlKey) return; // ctrl+휠은 확대
      event.preventDefault();
      const now = performance.now();
      const quiet = now - lastWheel > QUIET_MS;
      lastWheel = now;
      if (now < lockedUntil || !quiet || Math.abs(event.deltaY) < MIN_DELTA) return;
      go(event.deltaY > 0 ? 1 : -1);
    },
    { passive: false },
  );

  window.addEventListener("keydown", (event) => {
    const direction = PAGE_KEYS[event.key];
    if (!media.matches || !direction || event.target instanceof HTMLInputElement) return;
    event.preventDefault();
    if (performance.now() < lockedUntil) return;
    go(event.shiftKey && event.key === " " ? -1 : direction);
  });
}
