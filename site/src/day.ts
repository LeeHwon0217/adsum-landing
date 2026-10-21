/**
 * "출근부터 퇴근까지" — 시간마다 아숨이 하는 말과 포즈. 문장은 앱에 있는 그대로다
 * (src/core/schedule/alerts.ts · care.ts · features/character/lines.ts, ADR-128 존댓말).
 */
import { createAdsum } from "./pose";

interface Moment {
  time: string;
  pose: string;
  /** 아숨이 하는 말. 없으면 상황 설명을 대신 쓴다 */
  say: string | null;
  note: string;
}

const MOMENTS: Moment[] = [
  { time: "09:00", pose: "welcome", say: "좋은 아침이에요! 오늘은 3개 있어요~", note: "켜면 오늘 일정부터" },
  { time: "15:10", pose: "raise-hand", say: "팀 회의 어떠셨어요? 다음 약속 생기면 말씀해 주세요!", note: "회의가 끝나면" },
  { time: "18:30", pose: "stretch", say: "오늘 일정 끝! 수고하셨어요!", note: "일정을 다 마치면" },
  { time: "23:40", pose: "dozing", say: null, note: "밤이 늦으면 아숨도 졸아요" },
];

export function mountDay(list: HTMLElement): void {
  for (const moment of MOMENTS) {
    const item = document.createElement("li");
    item.innerHTML = `
      <div class="day-time">${moment.time}</div>
      <div class="day-pose"></div>
      ${moment.say ? `<p class="day-say">${moment.say}</p>` : `<p class="day-note">${moment.note}</p>`}`;
    item.querySelector(".day-pose")?.append(createAdsum(moment.pose));
    list.append(item);
  }
}
