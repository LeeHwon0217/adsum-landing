import "./styles.css";

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function botMarkup(index) {
  const shell = `bot-shell-${index}`;
  const panel = `bot-panel-${index}`;
  return `
    <div class="bot-glow" aria-hidden="true"></div>
    <svg class="adsum-bot-svg" viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="${shell}" x1="6" y1="7" x2="25" y2="26" gradientUnits="userSpaceOnUse">
          <stop stop-color="#ffffff"/><stop offset=".48" stop-color="#f4f2ee"/><stop offset=".76" stop-color="#d5d0dc"/><stop offset="1" stop-color="#8e76b9"/>
        </linearGradient>
        <linearGradient id="${panel}" x1="10" y1="12" x2="22" y2="20" gradientUnits="userSpaceOnUse">
          <stop stop-color="#ffffff"/><stop offset=".5" stop-color="#fbfbfa"/><stop offset="1" stop-color="#d9d8de"/>
        </linearGradient>
      </defs>
      <g class="bot-depth" transform="translate(.65 .8)"><path d="M10 6h12v2h2v2h2v10h-2v4h-4v2h-8v-2H8v-4H6V10h2V8h2z"/></g>
      <g class="bot-antenna"><rect x="15" y="2" width="2" height="4" rx=".6"/><rect class="antenna-light" x="14" y="1" width="4" height="2" rx="1"/></g>
      <path class="bot-outline" d="M10 6h12v2h2v2h2v10h-2v4h-4v2h-8v-2H8v-4H6V10h2V8h2z"/>
      <path class="bot-shell" fill="url(#${shell})" d="M10 8h12v2h2v10h-2v2h-4v2h-8v-2H6v-2H4V10h2V8z"/>
      <path class="bot-chin" d="M10 24h12v2H10z"/><path class="bot-face-bezel" d="M8 12h16v8H8z"/><path class="bot-face" fill="url(#${panel})" d="M10 12h12v8H10z"/><path class="bot-shine" d="M11 9h9v1h2v1H10v-1h1z"/>
      <rect class="eye-socket" x="11" y="14" width="3" height="4" rx="1.4"/><rect class="adsum-pupil" x="12" y="15" width="1" height="1" rx=".5"/><rect class="eye-socket" x="18" y="14" width="3" height="4" rx="1.4"/><rect class="adsum-pupil" x="19" y="15" width="1" height="1" rx=".5"/>
      <rect class="bot-blush" x="10" y="18" width="2" height="1" rx=".5"/><rect class="bot-blush" x="20" y="18" width="2" height="1" rx=".5"/>
    </svg>`;
}

document.querySelectorAll("[data-adsum-character]").forEach((character, index) => {
  character.innerHTML = botMarkup(index);
});

const root = document.documentElement;
const header = document.querySelector(".site-nav");
let scrollFrame = 0;
function updateScroll() {
  scrollFrame = 0;
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const progress = Math.min(1, Math.max(0, scrollY / max));
  root.style.setProperty("--page-progress", `${progress * 100}%`);
  root.style.setProperty("--scroll-y", `${scrollY}px`);
  header?.classList.toggle("scrolled", scrollY > 32);
  document.querySelectorAll("section").forEach((section) => {
    const rect = section.getBoundingClientRect();
    const scene = Math.min(1, Math.max(0, (innerHeight - rect.top) / (innerHeight + rect.height)));
    section.style.setProperty("--scene", scene.toFixed(4));
  });
}
addEventListener("scroll", () => {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
}, { passive: true });
addEventListener("resize", updateScroll, { passive: true });
updateScroll();

function updateGaze(character, clientX, clientY) {
  const rect = character.getBoundingClientRect();
  if (!rect.width) return;
  const x = Math.max(-1, Math.min(1, (clientX - rect.left - rect.width / 2) / (innerWidth * .3)));
  const y = Math.max(-1, Math.min(1, (clientY - rect.top - rect.height / 2) / (innerHeight * .3)));
  character.querySelectorAll(".adsum-pupil").forEach((pupil) => pupil.style.transform = `translate(${x}px, ${y}px)`);
  character.style.setProperty("--look-x", `${x * 4}deg`);
  character.style.setProperty("--look-y", `${y * -3}deg`);
}

if (!reduceMotion && matchMedia("(pointer:fine)").matches) {
  addEventListener("pointermove", (event) => {
    root.style.setProperty("--pointer-x", `${event.clientX}px`);
    root.style.setProperty("--pointer-y", `${event.clientY}px`);
    document.querySelectorAll("[data-gaze]").forEach((character) => updateGaze(character, event.clientX, event.clientY));
  }, { passive: true });
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    if (entry.target.classList.contains("thought-system")) entry.target.classList.add("is-settled");
    revealObserver.unobserve(entry.target);
  });
}, { threshold: .16, rootMargin: "0px 0px -8%" });
document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const momentButtons = [...document.querySelectorAll("[data-moment]")];
const momentPanels = [...document.querySelectorAll("[data-panel]")];
const momentStage = document.querySelector(".moment-stage");
const momentRail = document.querySelector(".moment-rail");
let activeMoment = 0;
let dayTimer;

function stopDayRotation() {
  if (!dayTimer) return;
  clearInterval(dayTimer);
  dayTimer = undefined;
}

function selectMoment(index, focus = false) {
  activeMoment = (index + momentButtons.length) % momentButtons.length;
  const key = momentButtons[activeMoment].dataset.moment;
  momentButtons.forEach((button, buttonIndex) => {
    const active = buttonIndex === activeMoment;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });
  momentPanels.forEach((panel) => {
    const active = panel.dataset.panel === key;
    panel.classList.toggle("active", active);
    panel.setAttribute("aria-hidden", String(!active));
  });
  momentStage.dataset.activeMoment = key;
  momentRail.style.setProperty("--moment-index", activeMoment);
  document.querySelector(".rail-track > i")?.style.setProperty("height", `${(activeMoment + 0.35) * 25}%`);
  momentStage.animate([{ opacity: .55, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], { duration: reduceMotion ? 1 : 480, easing: "cubic-bezier(.2,.8,.2,1)" });
  if (focus) momentButtons[activeMoment].focus();
}

momentButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    stopDayRotation();
    selectMoment(index);
  });
  button.addEventListener("keydown", (event) => {
    if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(event.key)) return;
    event.preventDefault();
    stopDayRotation();
    selectMoment(index + (["ArrowDown", "ArrowRight"].includes(event.key) ? 1 : -1), true);
  });
});
selectMoment(0);

if (!reduceMotion) {
  dayTimer = setInterval(() => selectMoment(activeMoment + 1), 7200);
  document.querySelector(".day-experience")?.addEventListener("pointerenter", stopDayRotation, { once: true });
}

const numberObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const target = Number(entry.target.dataset.target);
    const duration = reduceMotion ? 1 : 1100;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      entry.target.textContent = Math.round(target * eased).toLocaleString("ko-KR");
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    numberObserver.unobserve(entry.target);
  });
}, { threshold: .8 });
document.querySelectorAll("[data-target]").forEach((number) => numberObserver.observe(number));
