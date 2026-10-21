/**
 * "형식 없이 말해도 알아들어요" — 말 → 생각 → 대답 → 캘린더에 내려앉기를 차례로 보여 준다.
 *
 * 대답은 실제 아숨(에이전트)이 같은 문장에 한 대답이다 (npm run tone, 2026-10-20).
 * 화면이 보일 때만 돌고, 움직임 줄이기 설정이면 마지막 모습만 보여 준다.
 */
import { createAdsum, setPose } from "./pose";

interface Chip {
  key: string;
  day: 1 | 2;
  time: string | null;
  title: string;
}

interface Step {
  say: string;
  reply: string;
  add?: Chip[];
  move?: { key: string; time: string };
}

const STEPS: Step[] = [
  {
    say: "내일 오후 3시에 치과 가",
    reply: "오, 치과 가시는군요! 내일 3시에 넣어 뒀어요~",
    add: [{ key: "dentist", day: 1, time: "15:00", title: "치과" }],
  },
  {
    say: "내일 업무에 DB 백업 추가, 날씨 agent 만들기 추가",
    reply: "네, 내일 업무에 두 가지 모두 종일 일정으로 추가했어요!",
    add: [
      { key: "backup", day: 1, time: null, title: "DB 백업" },
      { key: "agent", day: 1, time: null, title: "날씨 agent 만들기" },
    ],
  },
  {
    say: "치과 4시로 옮겨줘",
    reply: "네, 치과를 내일 4시로 옮겨 뒀어요!",
    move: { key: "dentist", time: "16:00" },
  },
];

const TYPE_MS = 55;
const THINK_MS = 1500;
const READ_MS = 2600;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function mountTalk(root: HTMLElement): void {
  const week = root.querySelector<HTMLElement>("[data-week]");
  const adsumBox = root.querySelector<HTMLElement>("[data-talk-adsum]");
  const replyBox = root.querySelector<HTMLElement>("[data-talk-reply]");
  const saidBox = root.querySelector<HTMLElement>("[data-talk-said]");
  const typed = root.querySelector<HTMLElement>("[data-talk-typed]");
  const steps = root.querySelector<HTMLElement>("[data-talk-steps]");
  if (!week || !adsumBox || !replyBox || !saidBox || !typed || !steps) throw new Error("말하는 법 장면의 자리가 모자랍니다.");

  const days = renderWeek(week);
  const adsum = createAdsum("idle");
  adsumBox.append(adsum);
  steps.innerHTML = STEPS.map(() => "<li><span></span></li>").join("");
  const bars = [...steps.children] as HTMLElement[];

  const chips = new Map<string, HTMLElement>();
  const putChip = (chip: Chip): void => {
    const element = document.createElement("div");
    element.className = "chip";
    element.innerHTML = `${chip.time ? `<time>${chip.time}</time>` : "<time>종일</time>"}${chip.title}`;
    // 종일 일정은 캘린더처럼 시각 있는 일정보다 위에 선다
    const firstTimed = [...days[chip.day].querySelectorAll(".chip")].find((other) => other.querySelector("time")?.textContent !== "종일");
    if (!chip.time && firstTimed) firstTimed.before(element);
    else days[chip.day].append(element);
    chips.set(chip.key, element);
  };
  const reset = (): void => {
    for (const element of chips.values()) element.remove();
    chips.clear();
    for (const bar of bars) bar.removeAttribute("data-active"), bar.removeAttribute("data-done");
    replyBox.hidden = true;
    saidBox.hidden = true;
    typed.textContent = "";
  };

  if (reduceMotion()) {
    for (const step of STEPS) step.add?.forEach(putChip);
    const dentist = chips.get("dentist")?.querySelector("time");
    if (dentist) dentist.textContent = "16:00";
    const last = STEPS[STEPS.length - 1];
    saidBox.textContent = last.say;
    saidBox.hidden = false;
    replyBox.textContent = last.reply;
    replyBox.hidden = false;
    bars.forEach((bar) => bar.setAttribute("data-done", ""));
    return;
  }

  let visible = false;
  let running = false;
  const play = async (): Promise<void> => {
    if (running) return;
    running = true;
    while (visible) {
      reset();
      for (const [index, step] of STEPS.entries()) {
        if (!visible) break;
        bars[index].style.setProperty("--step-ms", `${step.say.length * TYPE_MS + THINK_MS + READ_MS}ms`);
        bars[index].setAttribute("data-active", "");
        replyBox.hidden = true;
        saidBox.hidden = true;
        setPose(adsum, "listening");
        for (const letter of step.say) {
          typed.textContent += letter;
          await wait(TYPE_MS);
        }
        // 보내면 입력창의 글이 말풍선으로 올라간다 — 메신저처럼
        typed.textContent = "";
        saidBox.textContent = step.say;
        saidBox.hidden = false;
        setPose(adsum, "thinking");
        await wait(THINK_MS);
        setPose(adsum, step.add ? "welcome" : "poked");
        replyBox.textContent = step.reply;
        replyBox.hidden = false;
        step.add?.forEach(putChip);
        if (step.move) moveChip(chips.get(step.move.key), step.move.time);
        await wait(READ_MS);
        setPose(adsum, "idle");
        bars[index].removeAttribute("data-active");
        bars[index].setAttribute("data-done", "");
      }
      await wait(READ_MS);
    }
    running = false;
  };

  new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) void play();
    },
    { threshold: 0.35 },
  ).observe(root);
}

/** 오늘·내일·모레 세 칸을 그린다. 돌려주는 건 그 세 칸의 일정 자리 */
function renderWeek(week: HTMLElement): HTMLElement[] {
  const today = new Date();
  const tags = ["오늘", "내일", "모레"];
  week.innerHTML = "";
  return tags.map((tag, offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const cell = document.createElement("div");
    cell.className = "week-day";
    if (offset === 0) cell.setAttribute("data-today", "");
    cell.innerHTML = `<div class="week-head"><span>${WEEKDAYS[date.getDay()]}</span><span class="week-num">${date.getDate()}</span><span class="week-tag">${tag}</span></div>`;
    week.append(cell);
    return cell;
  });
}

function moveChip(chip: HTMLElement | undefined, time: string): void {
  if (!chip) return;
  chip.setAttribute("data-leaving", "");
  window.setTimeout(() => {
    const stamp = chip.querySelector("time");
    if (stamp) stamp.textContent = time;
    chip.removeAttribute("data-leaving");
    chip.style.animation = "none";
    void chip.offsetWidth;
    chip.style.animation = "";
  }, 350);
}
