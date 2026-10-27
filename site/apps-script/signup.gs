/**
 * 아숨 체험판 알림 신청 — 랜딩의 이름·이메일을 구글 시트에 한 줄씩 쌓는다.
 *
 * 붙이는 법 (한 번만)
 *   1. 구글 시트를 새로 만든다 (이름은 아무거나)
 *   2. 확장 프로그램 → Apps Script → 이 파일 내용을 통째로 붙여 넣고 저장
 *   3. 배포 → 새 배포 → 유형 "웹 앱" → 실행: 나 / 액세스 권한: 모든 사용자 → 배포 → 권한 허용
 *   4. 나온 웹 앱 주소(…/exec)를 site/src/signup.ts의 SIGNUP_URL에 넣는다
 * 코드를 고치면 "배포 관리 → 수정 → 새 버전"으로 다시 배포해야 반영된다 (주소는 그대로).
 */

const SHEET_NAME = "신청";
const NAME_MAX = 40;
const EMAIL_MAX = 254;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** 동시에 두 명이 눌러도 중복 확인과 쓰기가 섞이지 않게 */
const LOCK_WAIT_MS = 10000;

function doPost(e) {
  const p = (e && e.parameter) || {};
  // 사람 눈에 안 보이는 칸 — 채워져 있으면 봇이다. 봇에게는 된 척한다
  if (p.website) return reply({ ok: true });

  const name = String(p.name || "").trim().slice(0, NAME_MAX);
  const email = String(p.email || "").trim().toLowerCase();
  if (!name || email.length > EMAIL_MAX || !EMAIL.test(email) || p.consent !== "yes") {
    return reply({ ok: false, error: "invalid" });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(LOCK_WAIT_MS);
  try {
    const sheet = sheetOf();
    const rows = sheet.getLastRow() - 1;
    const emails = rows > 0 ? sheet.getRange(2, 3, rows, 1).getValues().map((row) => String(row[0]).replace(/^'/, "")) : [];
    if (emails.indexOf(email) !== -1) return reply({ ok: true, again: true });
    sheet.appendRow([new Date(), plain(name), plain(email)]);
    return reply({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function sheetOf() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
    sheet.appendRow(["신청 시각", "이름", "이메일"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** =, +, -, @로 시작하면 시트가 수식으로 읽는다 — 글자로 넣는다 */
function plain(text) {
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function reply(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
