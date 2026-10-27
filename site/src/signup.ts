/**
 * 체험판 알림 신청 — 이름·이메일을 구글 시트로 보낸다 (apps-script/signup.gs).
 *
 * 폼 인코딩으로 보낸다. JSON으로 보내면 브라우저가 사전 요청(OPTIONS)을 먼저 보내는데
 * Apps Script 웹 앱은 그걸 받지 못해 매번 실패한다.
 */

/** Apps Script 웹 앱 주소(…/exec). 비밀이 아니다 — 누구나 신청할 수 있는 주소다 */
export const SIGNUP_URL = "https://script.google.com/macros/s/AKfycbwfcK2BCBWSIPZw23ESmOlUu_5kv-SWvLVFj5eOIAWKqijyvbNwwedp7Cc4MfG-ZVOE/exec";

interface SignupReply {
  ok: boolean;
  again?: boolean;
}

export function mountSignup(form: HTMLFormElement): void {
  const button = must<HTMLButtonElement>(form, "button[type=submit]");
  const status = must<HTMLElement>(form, "[data-signup-status]");
  const idleLabel = button.textContent ?? "";

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();

    button.disabled = true;
    button.textContent = "보내는 중…";
    status.textContent = "";
    form.removeAttribute("data-state");

    send(data)
      .then((reply) => {
        form.dataset.state = "done";
        form.replaceChildren(doneLine(reply.again ? "이미 신청돼 있어요." : "신청됐어요.", email));
      })
      .catch((error: unknown) => {
        console.error("체험판 신청을 보내지 못했습니다", error);
        form.dataset.state = "error";
        status.textContent = "보내지 못했어요. 잠시 뒤에 다시 눌러 주세요.";
        button.disabled = false;
        button.textContent = idleLabel;
      });
  });
}

async function send(data: FormData): Promise<SignupReply> {
  if (!SIGNUP_URL) throw new Error("SIGNUP_URL이 비어 있습니다 (apps-script/signup.gs 참고)");
  const body = new URLSearchParams();
  for (const [key, value] of data) body.append(key, String(value));

  const response = await fetch(SIGNUP_URL, { method: "POST", body });
  if (!response.ok) throw new Error(`응답 ${response.status}`);
  const reply = (await response.json()) as SignupReply;
  if (!reply.ok) throw new Error("시트가 받지 않았습니다");
  return reply;
}

function doneLine(head: string, email: string): HTMLElement {
  const line = document.createElement("p");
  line.className = "signup-done";
  line.setAttribute("role", "status");
  const strong = document.createElement("strong");
  strong.textContent = head;
  // 메일 주소 뒤에 조사를 붙이면 "…com로"처럼 어색하다 — 주소는 따로 보여 준다
  const to = document.createElement("span");
  to.className = "signup-to";
  to.textContent = email;
  line.append(strong, " 체험판이 열리는 날 메일 드릴게요.", to);
  return line;
}

function must<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`${selector}가 없습니다.`);
  return element;
}
