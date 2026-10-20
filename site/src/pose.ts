/**
 * 앱의 아숨 그림을 하나 만든다 (src/app-kit/character.html — 앱 마크업 그대로).
 *
 * 움직이는 아숨(첫 화면)은 이걸 Character에 넘기고, 가만히 포즈만 잡는 아숨(하루 카드·말하는 법)은
 * 상태 클래스만 붙인다 — 앱의 CSS가 그 상태의 모션을 그대로 그린다.
 */
import markup from "./app-kit/character.html?raw";

export function createAdsum(state: string | null = null): HTMLElement {
  const holder = document.createElement("div");
  holder.innerHTML = markup.trim();
  const layer = holder.firstElementChild as HTMLElement;
  if (state) layer.classList.add(`state-${state}`);
  return layer;
}

/** 포즈만 바꾼다 — 앱의 상태 클래스는 하나만 붙어 있어야 한다 */
export function setPose(layer: HTMLElement, state: string): void {
  for (const name of [...layer.classList]) if (name.startsWith("state-")) layer.classList.remove(name);
  layer.classList.add(`state-${state}`);
}
