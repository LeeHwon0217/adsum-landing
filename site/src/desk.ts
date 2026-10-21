/**
 * 첫 화면의 바탕화면 — 진짜 아숨이 산다.
 *
 * 캐릭터 코드(src/app-kit/Character.ts)는 앱 것 그대로다. 누르기·연타·쓰다듬기·끌기에
 * 앱과 똑같이 반응한다. 말은 앱의 말풍선 마크업·CSS로 띄운다.
 */
import { Character, type Reaction, type ReactionDetail } from "./app-kit/Character";
import sayMarkup from "./app-kit/say.html?raw";
import { createAdsum } from "./pose";

/** 처음 눌렀을 때부터 차례로 — 아숨이 자기를 소개한다 */
const GREETINGS = [
  "안녕하세요! 저는 아숨이에요.",
  "저한테 말을 걸면 일정이 저장돼요~",
  "평소엔 이렇게 화면 구석에 조용히 있어요.",
  "머리 위를 좌우로 쓰다듬어 보세요!",
  "잡고 끌어도 돼요. 간지러워하지만요!",
];

/** 연타·쓰다듬기에 하는 말 — 앱의 반응 대사(src/features/character/lines.ts)와 같은 결로 */
function reactionLine(reaction: Reaction, detail: ReactionDetail): string | null {
  switch (reaction) {
    case "poked":
      return detail.taps === 2 ? "네?" : null;
    case "tickled":
      return detail.taps === 5 ? "아, 간지러워요!" : null;
    case "sulking":
      return "…저 지금 삐졌어요.";
    case "petted":
      return detail.wasSulking ? "…이번만 봐 드릴게요." : "헤헤.";
    default:
      return null;
  }
}

const SAY_GAP_PX = 10;
const EDGE_PX = 14;
const SAY_MS = 3200;
/** 처음 화면에 들어오고 이만큼 뒤에 먼저 말을 건다 */
const FIRST_HELLO_MS = 2600;
/** 넓은 화면에서 아숨이 서는 곳 — 화면 오른쪽, 제목 옆 */
const HOME_X_RATIO = 0.72;
const HOME_Y_RATIO = 0.5;
/** 이보다 좁으면 글이 위, 아숨이 아래 */
const NARROW_PX = 900;
const HOME_BOTTOM_PX = 70;

export function mountDesk(desk: HTMLElement): void {
  const stage = desk.querySelector<HTMLElement>("[data-stage]");
  if (!stage) throw new Error("[data-stage]가 없습니다.");

  const layer = createAdsum();
  stage.append(layer);
  const sayHolder = document.createElement("div");
  sayHolder.innerHTML = sayMarkup.trim();
  const say = sayHolder.firstElementChild as HTMLElement;
  stage.append(say);
  const sayText = say.querySelector<HTMLElement>("#say-text");
  if (!sayText) throw new Error("#say-text가 없습니다.");

  let hideTimer: number | undefined;
  let greeted = 0;

  const placeSay = (): void => {
    if (say.hidden) return;
    const cx = layer.offsetLeft + layer.offsetWidth / 2;
    const left = Math.min(Math.max(cx - say.offsetWidth / 2, EDGE_PX), stage.clientWidth - say.offsetWidth - EDGE_PX);
    const top = Math.max(layer.offsetTop - SAY_GAP_PX - say.offsetHeight, EDGE_PX);
    say.style.left = `${left}px`;
    say.style.top = `${top}px`;
    say.style.setProperty("--tail-x", `${Math.min(Math.max(cx - left, 29), say.offsetWidth - 29)}px`);
  };

  const speak = (line: string): void => {
    sayText.textContent = line;
    const wasHidden = say.hidden;
    say.hidden = false;
    placeSay();
    if (wasHidden) requestAnimationFrame(() => say.classList.add("shown"));
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      say.classList.remove("shown");
      say.hidden = true;
    }, SAY_MS);
  };

  const markHint = (name: string): void => desk.querySelector(`[data-hint="${name}"]`)?.setAttribute("data-done", "");

  const adsum = new Character(layer, {
    onDragBegin: () => markHint("drag"),
    onMove: () => placeSay(),
    onDragEnd: () => placeSay(),
    onClick: () => {
      markHint("poke");
      speak(GREETINGS[greeted % GREETINGS.length]);
      greeted += 1;
    },
    onHitRegionChange: () => {},
    onReaction: (reaction, detail) => {
      if (reaction === "petted") markHint("pet");
      const line = reactionLine(reaction, detail);
      if (line) speak(line);
    },
  });

  adsum.setGazeEnabled(true);
  // 눈이 커서를 따라온다 — 앱은 화면 전체 커서를 받지만, 여기선 페이지 안 커서만 본다
  window.addEventListener("pointermove", (event) => adsum.lookAt(event.clientX, event.clientY), { passive: true });

  // 오른쪽 아래, 앱에서처럼 구석에 선다. 좁은 화면에선 글 아래 가운데쯤
  const home = () =>
    stage.clientWidth < NARROW_PX
      ? { left: (stage.clientWidth - layer.offsetWidth) / 2, top: stage.clientHeight - layer.offsetHeight - HOME_BOTTOM_PX }
      : { left: stage.clientWidth * HOME_X_RATIO - layer.offsetWidth / 2, top: stage.clientHeight * HOME_Y_RATIO - layer.offsetHeight / 2 };
  const start = home();
  adsum.setPosition(start.left, start.top);

  // 화면에 들어올 때 차원문으로 등장한다 — 앱이 켜질 때와 같다
  let started = false;
  new IntersectionObserver(
    (entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting) || started) return;
      started = true;
      observer.disconnect();
      adsum.start();
      window.setTimeout(() => speak("저를 눌러 보세요!"), FIRST_HELLO_MS);
    },
    { threshold: 0.3 },
  ).observe(desk);

  // 창 크기가 바뀌면 바탕화면 밖으로 나가지 않게 다시 세운다
  new ResizeObserver(() => {
    const now = adsum.position;
    adsum.setPosition(now.left, now.top);
    placeSay();
  }).observe(stage);
}
