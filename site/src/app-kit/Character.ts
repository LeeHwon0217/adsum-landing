// 자동 생성 — scripts/sync-from-app.mjs가 앱의 src/features/character/Character.ts에서 가져온다. 손으로 고치지 않는다.
// @ts-nocheck 앱 설정으로 검사된 코드다
/**
 * 캐릭터 — DOM/SVG 기반 (ADR-022).
 *
 * Canvas에서 옮겨왔다. 캐릭터는 정지된 픽셀 아트고, 움직임은 부유·글로우·눈 추적뿐이라
 * 매 프레임 다시 그릴 이유가 없다. 등장 모션과 부유는 CSS 키프레임이,
 * 눈 추적은 두 개의 `<rect>` transform이 처리한다.
 *
 * **그림 자체는 `index.html`의 `#robot` SVG에 있다.** 나중에 교체할 지점은 거기다.
 *
 * 이 클래스는 Tauri도 파일도 모른다. 부작용은 전부 콜백으로 주입받는다.
 */

import type { RestingState } from "./mood";
import { RubDetector, nextTapCount, pokeReaction, type PokeReaction } from "./touch";

export interface HitRegion {
  centerX: number;
  centerY: number;
  radius: number;
}

/**
 * 캐릭터가 지금 뭘 하고 있는가 (ADR-030).
 *
 * 상태 클래스(`state-*`)를 컨테이너에 붙이면 CSS가 알아서 연출을 바꾼다.
 * 애니메이션은 전부 그 클래스 안에 스코프돼 있다 — 상주 앱이라
 * 안 보이는 모션이 계속 돌면 유휴 CPU를 그냥 태운다.
 */
/** 한 번 돌고 끝나는 반응 (ADR-112). 끝나면 쉬는 자세로 돌아간다 */
export type OneShot = "poked" | "petted" | "welcome" | "stretch" | "cheer" | "goodbye";

/** 반응 전부 — 한 번 도는 것과, 건드리는 동안 이어지는 것 */
export type Reaction = OneShot | Exclude<PokeReaction, "poked">;

export interface ReactionDetail {
  /** 몇 번째 연타인가 */
  taps?: number;
  /** 삐진 걸 쓰다듬어 풀었다 */
  wasSulking?: boolean;
  /** 말은 하지 않는다 — 이미 다른 말풍선이 같은 일을 알리고 있다 */
  quiet?: boolean;
}

export type CharacterState =
  | "entrance"
  | "idle"
  | "thinking"
  | "working"
  | "listening"
  | "baseball"
  | "raise-hand"
  | Exclude<RestingState, "idle">
  | Reaction;

const STATES: readonly CharacterState[] = [
  "entrance", "idle", "thinking", "working", "listening", "baseball", "raise-hand", "dozing", "nervous",
  "poked", "petted", "tickled", "sulking", "welcome", "stretch", "cheer", "goodbye",
];

/** 반응 길이 — index.html의 같은 이름 애니메이션과 맞춰야 한다 (ADR-112) */
const REACTION_MS: Record<OneShot, number> = {
  poked: 480,
  petted: 900,
  welcome: 1200,
  stretch: 1200,
  cheer: 1200,
  goodbye: 1600,
};

function isOneShot(state: CharacterState): state is OneShot {
  return state in REACTION_MS;
}

export interface CharacterCallbacks {
  /** 드래그 시작 — 클릭 통과를 잠글 기회 */
  onDragBegin: () => void;
  /** 자리가 바뀌었다 (창 기준 논리 px). 메뉴와 패널이 따라와야 한다. */
  onMove: (left: number, top: number) => void;
  /** 드래그 끝 — 여기서 저장한다. 끄는 동안 매번 파일을 쓸 수는 없다. */
  onDragEnd: (left: number, top: number) => void;
  onClick: () => void;
  onHitRegionChange: (region: HitRegion) => void;
  /**
   * 반응이 시작됐다 (ADR-112). **대사는 여기서 정하지 않는다** — 캐릭터는 몸만 안다.
   * 연타는 누를 때마다 불린다. 말할지는 받는 쪽이 문턱을 보고 정한다.
   */
  onReaction: (reaction: Reaction, detail: ReactionDetail) => void;
}

/** 이 거리(px)를 넘겨야 드래그로 본다. 클릭할 때도 손이 1~2px 흔들린다. */
const DRAG_THRESHOLD_PX = 5;

/**
 * 이만큼 안 바뀌면 다시 그리지 않는다 (ADR-101).
 *
 * 타이머는 0.25초마다 도는데 그때마다 스타일을 쓰면
 * 1분 동안 240번 건드린다. 눈에 보이지도 않는 차이다.
 */
const URGENCY_STEP = 0.02;

/** 이만큼 급해지면 땀이 난다. 색만으로는 색약인 사람에게 안 보인다. */
const SWEAT_AT = 0.45;

/** 눈동자가 움직이는 최대 거리 (SVG viewBox 단위) */
/**
 * 눈동자가 움직일 수 있는 폭 (ADR-079).
 *
 * **눈 소켓 안에서만 움직여야 한다.** SVG에서 소켓은 `x 11~14`, `y 14~18`이고
 * 눈동자는 `x=12, y=15`짜리 1×1이다. 그래서 실제 여유는 X ±1, Y −1~+2다.
 *
 * 전에는 X가 `-0.5 ~ +1.5`였다 — **왼쪽으로는 절반밖에 못 가고
 * 오른쪽으로는 소켓 밖으로 나갔다.** 좌우가 다르니 따라보는 것처럼 보이지 않았다.
 */
const PUPIL_RANGE = 1;
const PUPIL_CLAMP_X = { min: -1, max: 1 };
const PUPIL_CLAMP_Y = { min: -1, max: 2 };

/** 이 거리(px)에서 눈동자가 끝까지 간다 */
/**
 * 이만큼 멀어지면 눈이 끝까지 돌아간다 (ADR-079).
 *
 * **화면 너비에 맞춘다.** 260px 고정이었을 때, 캐릭터가 오른쪽 아래에 서 있으면
 * 화면 왼쪽 절반에서는 값이 항상 최대라 **눈이 아예 안 움직이는 것처럼 보였다.**
 * 사람은 커서가 움직이는 동안 눈이 따라오는 것을 보고 "추적한다"고 느낀다.
 */
const GAZE_SATURATION_RATIO = 0.45;
const GAZE_SATURATION_MIN_PX = 260;

/** 부유 모션의 진폭. 클릭 판정 원을 이만큼 키워 흔들림을 덮는다 (index.html의 @keyframes float와 같아야 한다). */
const FLOAT_AMPLITUDE_PX = 10;

/**
 * 창 가장자리에서 캐릭터까지 최소한 이만큼은 띄운다.
 * 글로우가 캐릭터 상자 밖으로 18px쯤 번지므로 그보다 커야 각지게 잘리지 않는다.
 */
const EDGE_MARGIN_PX = 24;
/**
 * 메뉴 호가 캐릭터 중심에서 뻗는 최대 거리 (ADR-056).
 * index.html의 `--menu-radius`(88) + 버튼 절반(20). main.ts의 같은 이름과 맞춘다.
 */
const MENU_REACH_PX = 88 + 20;

/**
 * 등장 연출 길이.
 *
 * index.html의 rift-close 종료(1.5s + 0.6s)와
 * **인사 종료(1.5s + 0.95s = 2.45s)** 보다 넉넉해야 한다 (ADR-102).
 * 짧으면 손을 흔들다 만다.
 */
const ENTRANCE_MS = 2700;

/** 종이를 붙이러 갈 때 걷는 시간 */
const WALK_MS = 420;

/* 일하는 자세를 유지하는 시간. 규칙적이면 기계 같아 보인다. */
const WORK_MIN_MS = 15_000;
const WORK_MAX_MS = 40_000;

/**
 * 마지막 타자 뒤 이만큼은 일하는 자세를 유지한다 (ADR-068).
 *
 * 처음에 1.2초로 뒀더니 **손을 뗀 뒤에도 한참 치고 있었다.**
 * 여기에 자세가 사라지는 연출 시간(0.3초)이 더 붙으므로 체감은 더 길다.
 *
 * 여기가 **깜빡임과 굼뜸 사이의 경계선**이다.
 * 분당 40타(초당 3~4자)면 글자 사이가 0.3초쯤이라 이 값이 그 언저리다.
 * 더 줄이면 천천히 치는 사람에게서 자세가 튀기 시작한다.
 */
const TYPING_LINGER_MS = 300;

/** 연타가 멎고 이만큼 지나면 간지럼이 끝난다 */
const TICKLE_LINGER_MS = 900;

/** 쓰다듬지 않아도 이만큼 지나면 혼자 풀린다 — 오래 삐져 있으면 귀엽지 않고 답답하다 (ADR-132, 60초 → 5초) */
const SULK_MAX_MS = 5_000;

/** 입력창에 치다 멈추고 이만큼 지나면 듣기를 그친다 */
const LISTEN_LINGER_MS = 1_500;

/* 야구하는 시간 — "/야구"로 시킬 때 (ADR-134). 한 번 휘두르는 데 1.8초다. 평소에 혼자 하지는 않는다 (ADR-129) */
const BASEBALL_MS = 5_000;

const PARTICLE_COUNT = 24;
const PARTICLE_SIZE_PX = 8;
const PARTICLE_COLORS = ["#4a148c", "#3f51b5", "#00bcd4"];
const PARTICLE_MIN_PX = 60;
const PARTICLE_MAX_PX = 180;
const PARTICLE_MIN_SECONDS = 0.5;
const PARTICLE_MAX_SECONDS = 1.5;
const PARTICLE_MIN_DELAY = 0.1;
const PARTICLE_MAX_DELAY = 0.4;

/** working/thinking 동안 눈동자를 고정할 위치 (SVG viewBox 단위) */
const PUPIL_LOOK_DOWN = 1.75;
const PUPIL_LOOK_UP = -1.5;
/** 듣는 동안 눈은 말하는 사람 쪽(위)을 본다 */
const PUPIL_LISTEN = -1;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/*
  몸 기울기. 스펙의 최대치(rotateY 20deg 등)는 픽셀 아트에서 과했다 —
  crispEdges와 3D 회전이 겹치면 가장자리가 떨린다. 절반으로 줄였다.
*/
const TILT_TRANSLATE_PX = 5;
const TILT_Y_DEG = 10;
const TILT_X_DEG = 8;
const TILT_Z_DEG = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export class Character {
  private readonly layer: HTMLElement;
  private readonly robot: SVGSVGElement;
  /** 지금 얼굴에 나타난 급함 (ADR-101). 조금씩 바뀌는 값이라 마지막 값을 들고 있는다 */
  private urgency = 0;
  private readonly pupils: SVGElement[];
  private readonly particles: HTMLElement;
  private readonly callbacks: CharacterCallbacks;

  private state: CharacterState = "idle";
  /** 상태를 자동으로 넘기는 타이머. 상태가 바뀌면 반드시 취소한다. */
  private stateTimer: ReturnType<typeof setTimeout> | null = null;

  private pressOrigin: { x: number; y: number; left: number; top: number } | null = null;
  /** 임계값을 넘어 드래그로 확정됐는가 */
  private dragging = false;
  private observer: ResizeObserver | null = null;
  private gazeEnabled = true;
  /** 심부름 가는 중. 사용자가 끌면 즉시 그만둔다. */
  private walking = false;
  /**
   * 사용자가 지금 타자를 치고 있다 (ADR-068).
   *
   * 켜져 있으면 **혼자 일하러 가지 않는다** — 일하는 자세가 곧
   * "당신이 치고 있다"는 뜻이 되어야 하기 때문이다.
   */
  private typingSync = false;
  private typingTimer: ReturnType<typeof setTimeout> | null = null;

  /** 할 일이 없을 때 돌아갈 자세 — 밤이면 졸고, 바쁜 날이면 긴장한다 (ADR-112) */
  private resting: RestingState = "idle";
  /** 할 말이 있다 — 쉬는 자세 대신 손을 들고 기다린다 (ADR-113) */
  private pending = false;
  /** 연타 세기 */
  private taps = 0;
  private lastTapAt: number | null = null;
  private readonly rub = new RubDetector();

  constructor(layer: HTMLElement, callbacks: CharacterCallbacks) {
    const robot = layer.querySelector<SVGSVGElement>("#robot");
    if (!robot) throw new Error("#robot SVG를 찾지 못했습니다.");

    const particles = layer.querySelector<HTMLElement>("#particles");
    if (!particles) throw new Error("#particles 를 찾지 못했습니다.");

    this.layer = layer;
    this.robot = robot;
    this.particles = particles;
    this.pupils = [...robot.querySelectorAll<SVGElement>(".pupil")];
    this.callbacks = callbacks;
  }

  start(): void {
    this.setState("entrance");

    /*
      창 크기가 바뀌면 캐릭터의 창 안 위치도 바뀐다.
      Rust에 알려주는 클릭 통과 영역을 다시 계산해야 한다.
    */
    this.observer = new ResizeObserver(() => this.publishHitRegion());
    this.observer.observe(document.documentElement);

    this.robot.addEventListener("pointerdown", this.handlePointerDown);
    this.robot.addEventListener("pointermove", this.handleHover);
    this.robot.addEventListener("pointerleave", this.handleLeave);
    window.addEventListener("pointermove", this.handlePointerMove);
    window.addEventListener("pointerup", this.handlePointerUp);

    this.publishHitRegion();
  }

  dispose(): void {
    this.observer?.disconnect();
    this.clearStateTimer();
    this.robot.removeEventListener("pointerdown", this.handlePointerDown);
    this.robot.removeEventListener("pointermove", this.handleHover);
    this.robot.removeEventListener("pointerleave", this.handleLeave);
    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerup", this.handlePointerUp);
  }

  setMenuOpen(open: boolean): void {
    this.layer.classList.toggle("menu-open", open);
  }

  // ─────────────────────────────────────────────
  // 상태
  // ─────────────────────────────────────────────

  get currentState(): CharacterState {
    return this.state;
  }

  setState(next: CharacterState): void {
    if (this.state === next) return;

    this.state = next;
    this.clearStateTimer();

    for (const name of STATES) {
      this.layer.classList.toggle(`state-${name}`, name === next);
    }

    /*
      커서 추적이 남긴 인라인 transform을 지운다.
      애니메이션이 인라인 스타일을 이기긴 하지만, 애니메이션이 끝나면
      지워지지 않은 기울기가 그대로 되살아나 캐릭터가 삐뚤어진 채 멈춘다.
    */
    this.robot.style.transform = "";

    if (next !== "entrance") this.clearParticles();

    switch (next) {
      case "entrance":
        this.spawnParticles();
        this.stateTimer = setTimeout(() => this.rest(), ENTRANCE_MS);
        break;

      case "idle":
        // 평소엔 가만히 있는다 — 혼자 야구하거나 일하러 가지 않는다 (ADR-129)
        this.resetPupils();
        break;

      case "working":
        // 노트북을 보느라 아래를 본다. 커서 추적은 lookAt에서 막힌다.
        this.setPupils(0, PUPIL_LOOK_DOWN);
        this.stateTimer = setTimeout(() => this.rest(), randomBetween(WORK_MIN_MS, WORK_MAX_MS));
        break;

      case "thinking":
        this.setPupils(0, PUPIL_LOOK_UP);
        break;

      case "listening":
        this.setPupils(0, PUPIL_LISTEN);
        this.holdFor(LISTEN_LINGER_MS);
        break;

      case "baseball":
        this.resetPupils();
        this.holdFor(BASEBALL_MS);
        break;

      case "nervous":
      case "raise-hand":
        // 긴장하면 눈동자가 가운데에 굳는다. 손을 들었을 때는 형 쪽을 보며 기다린다
        this.resetPupils();
        break;

      case "tickled":
        this.holdFor(TICKLE_LINGER_MS);
        break;

      case "sulking":
        this.holdFor(SULK_MAX_MS);
        break;

      default:
        if (isOneShot(next)) this.holdFor(REACTION_MS[next]);
    }

    this.publishHitRegion();
  }

  private clearStateTimer(): void {
    if (this.stateTimer === null) return;
    clearTimeout(this.stateTimer);
    this.stateTimer = null;
  }

  /** 지금 상태를 이만큼 더 유지하고 쉬는 자세로 돌아간다 */
  private holdFor(ms: number): void {
    this.clearStateTimer();
    this.stateTimer = setTimeout(() => this.rest(), ms);
  }

  /**
   * 할 일이 끝났다 — 쉬는 자세로 (ADR-112). 낮엔 그냥 쉬고, 밤엔 졸고, 바쁜 날엔 긴장한다.
   * **할 말이 있으면 그 대신 손을 든다** (ADR-113) — 타자를 치다 멈추면 다시 손이 올라온다.
   */
  rest(): void {
    this.setState(this.pending ? "raise-hand" : this.resting);
  }

  /** 지금 쉬는 자세인가 — 쉬는 중일 때만 바로 갈아탄다 */
  private get isResting(): boolean {
    return this.state === "idle" || this.state === "dozing" || this.state === "nervous" || this.state === "raise-hand";
  }

  /**
   * 오늘이 어떤 날인지 바뀌었다. **쉬는 중일 때만** 바로 갈아탄다 —
   * 반응이나 일하는 중이면 그게 끝나고 돌아올 때 새 자세로 온다.
   */
  setResting(next: RestingState): void {
    this.resting = next;
    if (this.isResting) this.rest();
  }

  /** 할 말이 생겼거나 다 했다 (ADR-113). 말하지 않고 손만 든다 — 누르면 그때 말한다 */
  setPending(on: boolean): void {
    if (this.pending === on) return;
    this.pending = on;
    if (this.isResting) this.rest();
  }

  /** 지금 반응 중인가 — 그동안은 타자·듣기가 끼어들지 않는다 */
  private get isReacting(): boolean {
    return isOneShot(this.state) || this.state === "tickled" || this.state === "sulking";
  }

  /**
   * 반응 하나를 보여 준다 (ADR-112). 등장 중이거나 생각 중이면 끼어들지 않는다 —
   * 지금 하는 일이 더 중요하다. 보여 줬으면 true.
   */
  react(reaction: OneShot, detail: ReactionDetail = {}): boolean {
    if (this.state === "entrance" || this.state === "thinking") return false;

    const wasSulking = this.state === "sulking";
    this.clearTypingTimer();
    if (this.state === reaction) this.replay();
    else this.setState(reaction);

    this.callbacks.onReaction(reaction, { ...detail, wasSulking });
    return true;
  }

  /** 입력창에 치는 동안 듣는다. 치다 멈추면 잠시 뒤 그친다 */
  listen(): void {
    if (this.state === "entrance" || this.state === "thinking" || this.isReacting) return;
    if (this.state === "listening") {
      this.holdFor(LISTEN_LINGER_MS);
      return;
    }
    this.clearTypingTimer();
    this.setState("listening");
  }

  /** 같은 반응을 처음부터 다시 — 누를 때마다 움찔해야 한다. 클래스를 뗐다 붙여야 애니메이션이 다시 돈다 */
  private replay(): void {
    const name = `state-${this.state}`;
    this.layer.classList.remove(name);
    void this.layer.offsetWidth;
    this.layer.classList.add(name);
    if (isOneShot(this.state)) this.holdFor(REACTION_MS[this.state]);
  }

  /** 창 기준 논리 px. 창이 작업 영역에 딱 맞으므로 이게 곧 화면 위 자리다 (ADR-029). */
  get position(): { left: number; top: number } {
    return { left: this.layer.offsetLeft, top: this.layer.offsetTop };
  }

  /** 창 밖으로는 나가지 않는다 — 나가면 되찾을 방법이 트레이밖에 없다. */
  setPosition(left: number, top: number): void {
    const stage = this.layer.offsetParent as HTMLElement | null;
    const stageWidth = stage?.clientWidth ?? window.innerWidth;
    const stageHeight = stage?.clientHeight ?? window.innerHeight;

    const maxLeft = stageWidth - this.layer.offsetWidth - EDGE_MARGIN_PX;
    const maxTop = stageHeight - this.layer.offsetHeight - EDGE_MARGIN_PX;

    const x = clamp(left, EDGE_MARGIN_PX, Math.max(EDGE_MARGIN_PX, maxLeft));
    const y = clamp(top, EDGE_MARGIN_PX, Math.max(EDGE_MARGIN_PX, maxTop));

    this.layer.style.left = `${x}px`;
    this.layer.style.top = `${y}px`;

    this.publishHitRegion();
    this.callbacks.onMove(x, y);
  }

  /**
   * 그 자리까지 걸어간다 (ADR-041).
   *
   * 매 프레임 `setPosition`을 부른다 — 그래야 클릭 통과 영역과 메뉴·패널이
   * 따라온다. CSS 트랜지션으로 하면 그 둘이 출발지에 남는다.
   *
   * 사용자가 끌기 시작하면 그만둔다. 심부름보다 손이 먼저다.
   */
  walkTo(left: number, top: number): Promise<void> {
    const from = this.position;
    const dx = left - from.left;
    const dy = top - from.top;
    if (Math.hypot(dx, dy) < 1) return Promise.resolve();

    this.walking = true;

    return new Promise((resolve) => {
      const started = performance.now();

      const step = (): void => {
        if (!this.walking || this.dragging) {
          this.walking = false;
          resolve();
          return;
        }

        const t = Math.min(1, (performance.now() - started) / WALK_MS);
        // 출발과 도착에서 느리게 — 미끄러지지 않고 걸어간 것처럼 보인다
        const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;

        this.setPosition(from.left + dx * eased, from.top + dy * eased);

        if (t < 1) {
          requestAnimationFrame(step);
          return;
        }
        this.walking = false;
        resolve();
      };

      requestAnimationFrame(step);
    });
  }

  /** 아직 한 번도 옮긴 적이 없을 때 설 자리 — 작업 영역 우하단. */
  /**
   * 처음 서는 자리 — 화면 오른쪽 아래.
   *
   * **메뉴 호가 들어갈 만큼은 안쪽으로 들인다** (ADR-056).
   * 모서리에 딱 붙여 세우면 캐릭터를 감싸는 호가 화면 밖으로 나가서
   * 메뉴가 매번 반대편(왼쪽 위)으로 접힌다 — 그러면 오른쪽 아래 호를
   * 기본으로 삼은 뜻이 없어진다 (ADR-048).
   */
  defaultPosition(): { left: number; top: number } {
    const stage = this.layer.offsetParent as HTMLElement | null;
    const stageWidth = stage?.clientWidth ?? window.innerWidth;
    const stageHeight = stage?.clientHeight ?? window.innerHeight;

    return this.withMenuRoom(
      stageWidth - this.layer.offsetWidth - EDGE_MARGIN_PX,
      stageHeight - this.layer.offsetHeight - EDGE_MARGIN_PX,
    );
  }

  /**
   * 메뉴 호가 화면 안에 들어오도록 자리를 안쪽으로 민다 (ADR-056).
   *
   * **끌어다 놓는 자리에는 적용하지 않는다.** 모서리에 두고 싶은 사람이 있고,
   * 그때는 메뉴가 반대편으로 접혀서 어차피 화면 밖으로 나가지 않는다.
   * 여기서 막는 것은 "아무것도 안 했는데 접혀 있는" 첫인상뿐이다.
   */
  withMenuRoom(left: number, top: number): { left: number; top: number } {
    const stage = this.layer.offsetParent as HTMLElement | null;
    const stageWidth = stage?.clientWidth ?? window.innerWidth;
    const stageHeight = stage?.clientHeight ?? window.innerHeight;

    const half = this.layer.offsetWidth / 2;
    return {
      left: Math.min(left, stageWidth - MENU_REACH_PX - half),
      top: Math.min(top, stageHeight - MENU_REACH_PX - this.layer.offsetHeight / 2),
    };
  }

  /**
   * 타자에 맞춰 일하는 자세를 켠다 (ADR-068).
   *
   * 켜면 **유휴 중 랜덤 작업을 멈춘다.** 둘이 같이 돌면
   * 지금 움직이는 이유가 나 때문인지 그냥 그런 건지 알 수 없다.
   */
  setTypingSync(enabled: boolean): void {
    this.typingSync = enabled;
    if (!enabled) return;

    /*
      켜는 순간 **랜덤 작업의 흔적을 지운다.**

      예약된 타이머를 그대로 두면 잠시 뒤 혼자 working으로 들어가는데,
      그때는 이미 typingSync가 켜져 있어 **스스로 빠져나올 타이머가 없다** —
      영영 일하는 자세로 굳는다. 실제로 그렇게 굳은 것을 봤다.
    */
    this.clearTypingTimer();
    this.clearStateTimer();
    if (this.state === "working") this.rest();
  }

  /**
   * 한 번 쳤다는 신호. 계속 오는 동안 일하는 자세를 유지한다.
   *
   * 신호는 최대 8번/초로 오므로 매번 상태를 갈아끼우지 않는다 —
   * 이미 working이면 사라지는 시각만 미룬다.
   */
  noteTyping(): void {
    if (!this.typingSync) return;
    // 등장·생각·반응 중이면 끼어들지 않는다 — 지금 하는 일이 더 중요하다
    if (this.state === "entrance" || this.state === "thinking" || this.isReacting) return;

    if (this.state !== "working") this.setState("working");
    // 안전용 타이머가 먼저 끝내버리지 않게 미룬다
    this.clearStateTimer();

    this.clearTypingTimer();
    this.typingTimer = setTimeout(() => {
      this.typingTimer = null;
      if (this.state === "working") this.rest();
    }, TYPING_LINGER_MS);
  }

  private clearTypingTimer(): void {
    if (this.typingTimer === null) return;
    clearTimeout(this.typingTimer);
    this.typingTimer = null;
  }

  /**
   * 얼마나 급한지 얼굴에 나타낸다 — 0(여유) ~ 1(코앞) (ADR-101).
   *
   * **글자를 읽어야 아는 것은 늦다.** 남은 시간 칩은 눈을 줘야 보이지만
   * 얼굴색은 곁눈으로도 들어온다.
   *
   * 판정은 `core/timer.ts`의 `urgency`가 한다. 여기서는 그 숫자를 색으로만 옮긴다.
   *
   * **색만으로는 부족하다.** 색약인 사람에게는 아무것도 안 전해지므로
   * 땀방울이 같이 나온다 — 모양이 바뀌어야 색과 무관하게 보인다.
   */
  setUrgency(level: number): void {
    const clamped = Math.min(Math.max(level, 0), 1);
    if (Math.abs(clamped - this.urgency) < URGENCY_STEP) return;
    this.urgency = clamped;

    this.robot.style.setProperty("--blush-mix", `${Math.round(clamped * 100)}%`);
    this.robot.classList.toggle("sweating", clamped >= SWEAT_AT);
  }

  setGazeEnabled(enabled: boolean): void {
    this.gazeEnabled = enabled;
    if (!enabled) this.resetGaze();
  }

  /**
   * 커서를 바라본다.
   *
   * 좌표는 **창 왼쪽 위 기준**이며 창 밖이면 음수이거나 창 크기를 넘는다.
   * 창이 300px밖에 안 되므로 그게 정상이다 — 웹뷰 mousemove로는 알 수 없어
   * Rust가 전역 커서를 읽어 넘겨준다.
   */
  lookAt(cursorX: number, cursorY: number): void {
    if (!this.gazeEnabled) return;
    // 일하거나 생각하는 중에는 눈이 거기 가 있다. 등장 중에는 아직 없는 것이나 마찬가지.
    if (this.state !== "idle") return;

    const rect = this.robot.getBoundingClientRect();
    if (rect.width === 0) return;

    const dx = cursorX - (rect.left + rect.width / 2);
    const dy = cursorY - (rect.top + rect.height / 2);

    // 창은 작업 영역 전체를 덮으므로 (ADR-029) 창 크기가 곧 화면 크기다
    const saturation = Math.max(GAZE_SATURATION_MIN_PX, window.innerWidth * GAZE_SATURATION_RATIO);
    const ratioX = clamp(dx / saturation, -1, 1);
    const ratioY = clamp(dy / saturation, -1, 1);

    const pupilX = clamp(ratioX * PUPIL_RANGE, PUPIL_CLAMP_X.min, PUPIL_CLAMP_X.max);
    const pupilY = clamp(ratioY * PUPIL_RANGE, PUPIL_CLAMP_Y.min, PUPIL_CLAMP_Y.max);

    for (const pupil of this.pupils) {
      pupil.setAttribute("transform", `translate(${pupilX.toFixed(2)} ${pupilY.toFixed(2)})`);
    }

    this.robot.style.transform =
      `translate(${(ratioX * TILT_TRANSLATE_PX).toFixed(1)}px, ${(ratioY * TILT_TRANSLATE_PX).toFixed(1)}px)` +
      ` rotateY(${(ratioX * TILT_Y_DEG).toFixed(1)}deg)` +
      ` rotateX(${(-ratioY * TILT_X_DEG).toFixed(1)}deg)` +
      ` rotateZ(${(ratioX * TILT_Z_DEG).toFixed(1)}deg)`;
  }

  private resetGaze(): void {
    this.resetPupils();
    this.robot.style.transform = "";
  }

  private setPupils(x: number, y: number): void {
    for (const pupil of this.pupils) {
      pupil.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
    }
  }

  private resetPupils(): void {
    for (const pupil of this.pupils) pupil.removeAttribute("transform");
  }

  /**
   * 차원문에서 튀어나오는 조각들.
   *
   * 날아가는 거리를 창 안으로 제한한다 — 캐릭터가 화면 구석에 서 있으면
   * 180px짜리 조각이 창 밖으로 나가 잘린다 (ADR-030).
   */
  private spawnParticles(): void {
    this.clearParticles();

    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const reach = Math.min(randomBetween(PARTICLE_MIN_PX, PARTICLE_MAX_PX), this.roomAlong(cos, sin));

      const particle = document.createElement("span");
      particle.className = "particle";
      particle.style.background = PARTICLE_COLORS[index % PARTICLE_COLORS.length];
      particle.style.setProperty("--tx", `${(cos * reach).toFixed(1)}px`);
      particle.style.setProperty("--ty", `${(sin * reach).toFixed(1)}px`);
      particle.style.animationDuration = `${randomBetween(PARTICLE_MIN_SECONDS, PARTICLE_MAX_SECONDS).toFixed(2)}s`;
      particle.style.animationDelay = `${randomBetween(PARTICLE_MIN_DELAY, PARTICLE_MAX_DELAY).toFixed(2)}s`;

      this.particles.append(particle);
    }
  }

  private clearParticles(): void {
    if (this.particles.childElementCount === 0) return;
    this.particles.replaceChildren();
  }

  /** 캐릭터 중심에서 그 방향으로 창 경계까지 남은 거리 */
  private roomAlong(cos: number, sin: number): number {
    const stage = this.layer.offsetParent as HTMLElement | null;
    const stageWidth = stage?.clientWidth ?? window.innerWidth;
    const stageHeight = stage?.clientHeight ?? window.innerHeight;

    const centerX = this.layer.offsetLeft + this.layer.offsetWidth / 2;
    const centerY = this.layer.offsetTop + this.layer.offsetHeight / 2;

    const limits: number[] = [];
    if (cos > 0.001) limits.push((stageWidth - PARTICLE_SIZE_PX - centerX) / cos);
    if (cos < -0.001) limits.push((centerX - PARTICLE_SIZE_PX) / -cos);
    if (sin > 0.001) limits.push((stageHeight - PARTICLE_SIZE_PX - centerY) / sin);
    if (sin < -0.001) limits.push((centerY - PARTICLE_SIZE_PX) / -sin);

    if (limits.length === 0) return PARTICLE_MAX_PX;
    return Math.max(0, Math.min(...limits));
  }

  /**
   * 클릭 통과 판정용. 로봇을 감싸는 원으로 근사한다.
   *
   * **`getBoundingClientRect()`를 쓰면 안 된다.** 그 값은 transform을 포함하므로
   * 등장 모션(`translateY(140px)`) 도중에 재면 창 밖 좌표가 나오고,
   * 이후 다시 잴 계기가 없어 캐릭터가 영영 클릭되지 않는다 (실제로 그랬다).
   * `offset*`은 레이아웃 좌표라 transform의 영향을 받지 않는다.
   *
   * 부유 모션으로 ±10px 흔들리는 만큼은 반지름에 더해 덮는다.
   */
  private publishHitRegion(): void {
    const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = this.layer;
    if (offsetWidth === 0) return;

    this.callbacks.onHitRegionChange({
      centerX: offsetLeft + offsetWidth / 2,
      centerY: offsetTop + offsetHeight / 2,
      radius: Math.max(offsetWidth, offsetHeight) / 2 + FLOAT_AMPLITUDE_PX,
    });
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    // 등장 중에는 아직 도착하지 않았다. 누르는 것을 받지 않는다.
    if (this.state === "entrance") return;

    event.preventDefault();
    const { left, top } = this.position;
    this.pressOrigin = { x: event.screenX, y: event.screenY, left, top };
    // 커서가 캐릭터를 벗어나도 이벤트를 계속 받는다
    this.robot.setPointerCapture(event.pointerId);
  };

  /**
   * 누른 채 임계값 이상 움직이면 드래그로 본다.
   * 그 전까지는 클릭일 수 있으므로 자리를 건드리지 않는다.
   */
  private readonly handlePointerMove = (event: PointerEvent): void => {
    const origin = this.pressOrigin;
    if (!origin) return;

    const dx = event.screenX - origin.x;
    const dy = event.screenY - origin.y;

    if (!this.dragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      this.dragging = true;
      // 사용자가 잡았으면 가던 길을 멈춘다
      this.walking = false;
      this.callbacks.onDragBegin();
    }

    /*
      screenX/Y는 물리 픽셀이 아니라 배율이 반영된 CSS 픽셀이므로
      창 안 논리 좌표와 단위가 같다. 변환 없이 그대로 더한다.
    */
    this.setPosition(origin.left + dx, origin.top + dy);
    this.tickleWhileHeld();
  };

  /**
   * 잡혀서 끌려다니면 간지러워한다 (ADR-133).
   * 움직이는 동안 계속, 놓으면 바로 가라앉는다. 잡은 채 멈춰 있으면 간지럼 여운 뒤 가라앉는다. 말은 하지 않는다 — 옮길 때마다 말풍선이 뜨면 시끄럽다.
   * 등장·생각 중에는 방해하지 않고, 삐져 있으면 웃지 않는다.
   */
  private tickleWhileHeld(): void {
    if (this.state === "entrance" || this.state === "thinking" || this.state === "sulking") return;
    if (this.state === "tickled") {
      this.holdFor(TICKLE_LINGER_MS);
      return;
    }
    this.clearTypingTimer();
    this.setState("tickled");
  }

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (!this.pressOrigin) return;
    this.pressOrigin = null;

    if (this.robot.hasPointerCapture(event.pointerId)) {
      this.robot.releasePointerCapture(event.pointerId);
    }

    if (this.dragging) {
      this.dragging = false;
      // 놓으면 바로 풀린다 — 간지럼은 잡혀 있는 동안만이다 (ADR-133)
      if (this.state === "tickled") this.rest();
      const { left, top } = this.position;
      this.callbacks.onDragEnd(left, top);
      return;
    }

    /*
      **한 번은 말을 거는 클릭, 연타는 찌르기다** (ADR-112).
      첫 클릭에 대화창이 열리고, 이어서 누르는 것은 대화창을 건드리지 않고 반응만 한다.
    */
    const now = performance.now();
    this.taps = nextTapCount(this.taps, this.lastTapAt, now);
    this.lastTapAt = now;

    const reaction = pokeReaction(this.taps);
    if (reaction) {
      this.poke(reaction);
      return;
    }

    // 말을 걸면 하던 일을 멈춘다 — 졸고 있었어도 깬다. 삐진 건 말 건다고 안 풀린다.
    if (this.state !== "sulking") this.setState("idle");
    this.callbacks.onClick();
  };

  private poke(reaction: PokeReaction): void {
    if (this.state === "entrance" || this.state === "thinking") return;

    // 삐진 건 찔러서는 안 풀린다 — 쓰다듬어야 풀린다 (docs/12-persona.md). 더 삐져 있을 뿐이다.
    if (this.state === "sulking") {
      this.holdFor(SULK_MAX_MS);
      return;
    }

    const detail = { taps: this.taps };
    if (reaction === "poked") {
      this.react("poked", detail);
      return;
    }

    this.clearTypingTimer();
    if (this.state === reaction) this.holdFor(reaction === "tickled" ? TICKLE_LINGER_MS : SULK_MAX_MS);
    else this.setState(reaction);
    this.callbacks.onReaction(reaction, detail);
  }

  /** 누르지 않고 위에서 좌우로 문지르면 쓰다듬은 것이다. 삐진 것도 이걸로 풀린다 */
  private readonly handleHover = (event: PointerEvent): void => {
    if (this.pressOrigin || this.dragging) return;
    if (!this.rub.feed(event.screenX, performance.now())) return;
    if (this.state === "petted") return;
    this.react("petted");
  };

  private readonly handleLeave = (): void => {
    this.rub.reset();
  };
}
