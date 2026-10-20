// 자동 생성 — scripts/sync-from-app.mjs가 앱의 src/core/touch.ts에서 가져온다. 손으로 고치지 않는다.
// @ts-nocheck 앱 설정으로 검사된 코드다
/**
 * 캐릭터를 건드리는 손길을 읽는다 — 연타와 문지르기 (ADR-112).
 *
 * 순수 함수와 시각을 주입받는 작은 상태 하나뿐이다. 이벤트는 Character가 넘긴다.
 */

/**
 * 이 간격 안에 다시 누르면 연타로 센다.
 * Windows 더블클릭 기본값(500ms)보다 조금 짧게 — 천천히 두 번 누른 건 연타가 아니다.
 */
export const RAPID_TAP_MS = 450;

/** 연타가 이만큼 쌓이면 간지러워하고, 이만큼이면 삐진다 (docs/12-persona.md) */
export const TICKLE_FROM_TAPS = 5;
export const SULK_FROM_TAPS = 10;

export type PokeReaction = "poked" | "tickled" | "sulking";

/** 이번 누름이 몇 번째 연타인가. 처음이거나 간격이 벌어졌으면 1이다. */
export function nextTapCount(previous: number, lastTapAt: number | null, now: number): number {
  if (lastTapAt === null || now - lastTapAt > RAPID_TAP_MS) return 1;
  return previous + 1;
}

/**
 * 연타 횟수에 맞는 반응. **한 번 누른 것은 반응이 아니다** — 그건 말을 거는 클릭이다.
 */
export function pokeReaction(taps: number): PokeReaction | null {
  if (taps >= SULK_FROM_TAPS) return "sulking";
  if (taps >= TICKLE_FROM_TAPS) return "tickled";
  if (taps >= 2) return "poked";
  return null;
}

/** 움직임 사이가 이보다 벌어지면 새로 센다 — 멈췄다 다시 지나간 것은 문지른 게 아니다 */
export const RUB_GAP_MS = 250;
/** 방향을 이만큼 바꿔야 문지른 것이다. 한 번 지나간 커서는 방향을 안 바꾼다. */
export const RUB_REVERSALS = 2;
/** 그동안 움직인 거리(px). 손이 떨린 정도는 안 된다. */
export const RUB_TRAVEL_PX = 60;

/**
 * 좌우로 문지르기를 알아챈다.
 *
 * **거리만 보면 안 된다.** 캐릭터 위를 한 번 가로질러 지나가기만 해도 116px를 움직인다.
 * 쓰다듬는 손은 왔다 갔다 한다 — 그래서 방향이 바뀐 횟수를 같이 본다.
 */
export class RubDetector {
  private lastX: number | null = null;
  private lastAt = 0;
  private direction = 0;
  private reversals = 0;
  private travel = 0;

  /** 커서 x와 시각을 넣는다. 문지르기가 완성된 순간에만 true를 돌려주고 처음부터 다시 센다. */
  feed(x: number, now: number): boolean {
    if (this.lastX === null || now - this.lastAt > RUB_GAP_MS) {
      this.reset();
      this.lastX = x;
      this.lastAt = now;
      return false;
    }

    const dx = x - this.lastX;
    this.lastX = x;
    this.lastAt = now;
    if (dx === 0) return false;

    const direction = Math.sign(dx);
    if (this.direction !== 0 && direction !== this.direction) this.reversals += 1;
    this.direction = direction;
    this.travel += Math.abs(dx);

    if (this.reversals >= RUB_REVERSALS && this.travel >= RUB_TRAVEL_PX) {
      this.reset();
      return true;
    }
    return false;
  }

  reset(): void {
    this.lastX = null;
    this.direction = 0;
    this.reversals = 0;
    this.travel = 0;
  }
}
