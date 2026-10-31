/* ==========================================================================
   editor.js — код в жёлтой капсуле первого экрана: печатается сам, как в терминале,
   файлы идут друг за другом по кругу, старые строки уезжают вверх.
   Чисто декоративно (aria-hidden). Без анимаций — экран сразу заполнен кодом.
   ========================================================================== */
(() => {
  "use strict";

  const codeEl = document.getElementById("editor-code");
  if (!codeEl) return;
  const boxEl = codeEl.parentElement;

  /* ------------------------------------------------------------- файлы */
  const FILES = [
    { name: "bot.py", lang: "py", code:
`from aiogram import Router, F
from aiogram.types import Message

router = Router()

@router.message(F.text == "/start")
async def start(msg: Message):
    await msg.answer("Assalamu alaikum! How can I help?")

@router.message(F.text)
async def feedback(msg: Message):
    await notify_owner(msg)  # lead goes straight to you
    await msg.answer("Thanks! We'll reply within an hour.")` },

    { name: "index.html", lang: "html", code:
`<section class="hero">
  <h1>Your shop, online in a week</h1>
  <p>Order in two taps, reply within an hour.</p>
  <a class="btn" href="https://wa.me/...">
    Message us
  </a>
</section>

<script>
  reveal(".hero", { delay: 0.2 });
</script>` },

    { name: "app.js", lang: "js", code:
`const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const cart = new Map();

function add(item) {
  cart.set(item.id, (cart.get(item.id) ?? 0) + 1);
  const sum = total(cart);
  tg.MainButton.setText(\`Order · \${sum} ₽\`).show();
}` }
  ];

  /* ------------------------------------------------- простая подсветка */
  const STR = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/y;
  const RULES = {
    py: [
      ["c", /#.*/y], ["s", STR], ["f", /@[\w.]+/y],
      ["k", /\b(?:from|import|async|def|await|return|if|else|for|in|None|True|False)\b/y],
      ["f", /\w+(?=\()/y], ["n", /\d+(?:\.\d+)?/y], ["", /\w+/y]
    ],
    html: [
      ["c", /<!--.*?-->/y], ["k", /<\/?[\w-]+|\/?>/y], ["a", /[\w-]+(?==)/y], ["s", STR],
      ["f", /\w+(?=\()/y], ["n", /\d+(?:\.\d+)?/y], ["", /\w+/y]
    ],
    js: [
      ["c", /\/\/.*/y], ["s", STR],
      ["k", /\b(?:const|let|function|return|new|if|else|of|await|async)\b/y],
      ["f", /\w+(?=\()/y], ["n", /\d+(?:\.\d+)?/y], ["", /\w+/y]
    ]
  };

  // строка → [[класс, текст], ...]; соседние куски без класса склеиваются
  function tokenize(line, lang) {
    const out = [];
    const push = (cls, text) => {
      const last = out[out.length - 1];
      if (last && last[0] === cls && !cls) last[1] += text; else out.push([cls, text]);
    };
    let i = 0;
    while (i < line.length) {
      let hit = null;
      for (const [cls, re] of RULES[lang]) {
        re.lastIndex = i;
        const m = re.exec(line);
        if (m && m[0]) { hit = [cls, m[0]]; break; }
      }
      if (!hit) hit = ["", line[i]];
      push(hit[0], hit[1]);
      i += hit[1].length;
    }
    return out;
  }

  // все файлы одной лентой: перед каждым — комментарий с именем, после — пустая строка
  const HEAD = { py: (n) => `# ${n}`, html: (n) => `<!-- ${n} -->`, js: (n) => `// ${n}` };
  const STREAM = [];
  FILES.forEach((f) => {
    const raw = [HEAD[f.lang](f.name), ...f.code.split("\n"), ""];
    raw.forEach((l, i) => STREAM.push({ raw: l, n: i + 1, tokens: tokenize(l, f.lang) }));
  });

  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const lineLen = (tokens) => tokens.reduce((n, t) => n + t[1].length, 0);

  // первые n символов строки в виде HTML
  function lineHtml(tokens, n = Infinity) {
    let html = "", left = n;
    for (const [cls, text] of tokens) {
      if (left <= 0) break;
      const part = esc(text.slice(0, left));
      html += cls ? `<span class="t-${cls}">${part}</span>` : part;
      left -= text.length;
    }
    return html;
  }

  const CARET = '<span class="code-caret"></span>';

  function newLine(n) {
    const el = document.createElement("div");
    el.className = "code-line";
    el.dataset.n = n;
    codeEl.appendChild(el);
    return el;
  }

  // сколько строк помещается на экран; лишние сверху убираем — лента «едет» вверх
  let rows = 30;
  function measure() {
    const lh = parseFloat(getComputedStyle(codeEl).lineHeight) || 20;
    rows = Math.max(8, Math.ceil(boxEl.clientHeight / lh));
  }
  function trim() {
    while (codeEl.childElementCount > rows) codeEl.firstElementChild.remove();
  }

  /* ----------------------------------------- без анимации: статичный экран */
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  function showStatic() {
    codeEl.innerHTML = "";
    for (let i = 0; i < rows; i++) {
      const l = STREAM[i % STREAM.length];
      newLine(l.n).innerHTML = lineHtml(l.tokens);
    }
  }

  /* ---------------------------------------------------------- печать */
  let si = 0, ci = 0, lineEl = null;
  let timer = 0, visible = true;

  const active = () => visible && !document.hidden && !reduce.matches;

  function schedule(ms) {
    clearTimeout(timer);
    timer = active() ? setTimeout(step, ms) : 0;
  }

  function beginLine() {
    const l = STREAM[si];
    if (lineEl) { lineEl.classList.remove("is-current"); lineEl.innerHTML = lineHtml(STREAM[(si + STREAM.length - 1) % STREAM.length].tokens); }
    lineEl = newLine(l.n);
    lineEl.classList.add("is-current");
    trim();
    // отступ появляется сразу, как в редакторе с автоотступом
    ci = l.raw.match(/^ */)[0].length;
    lineEl.innerHTML = lineHtml(l.tokens, ci) + CARET;
  }

  function step() {
    const l = STREAM[si];
    const len = l.raw.length;

    if (ci < len) {
      // по 1–3 символа за такт: быстро, но всё ещё видно, что «печатается»
      ci = Math.min(len, ci + 1 + Math.floor(Math.random() * 3));
      lineEl.innerHTML = lineHtml(l.tokens, ci) + CARET;
      let ms = 12 + Math.random() * 20;
      if (/[,.:;)(]/.test(l.raw[ci - 1])) ms += 25;
      if (Math.random() < 0.015) ms += 220;
      return schedule(ms);
    }

    si = (si + 1) % STREAM.length;      // следующая строка (после последнего файла — снова первый)
    beginLine();
    return schedule(len ? 70 : 40);
  }

  /* ------------------------------------------------- пауза вне экрана */
  function resume() { if (active() && !timer) schedule(120); }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) resume(); else { clearTimeout(timer); timer = 0; }
    }).observe(boxEl);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { clearTimeout(timer); timer = 0; } else resume();
  });
  window.addEventListener("resize", () => {
    measure();
    if (reduce.matches) showStatic(); else trim();
  });
  reduce.addEventListener("change", () => {
    clearTimeout(timer); timer = 0;
    if (reduce.matches) showStatic(); else { codeEl.innerHTML = ""; si = 0; lineEl = null; beginLine(); resume(); }
  });

  /* ------------------------------------------------------------- старт */
  measure();
  if (reduce.matches) {
    showStatic();
  } else {
    beginLine();
    schedule(500);                       // ждём, пока фон проявится
  }
})();
