/* ==========================================================================
   main.js — рендер из content.js, переключение RU/EN, анимации (GSAP).
   ========================================================================== */
(() => {
  "use strict";

  const C = window.CONTENT;
  const S = window.SITE;
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const hasGsap = typeof window.gsap !== "undefined";
  const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const animOn   = () => hasGsap && !mqReduce.matches;

  if (hasGsap) {
    if (window.SplitText) gsap.registerPlugin(SplitText);
    if (window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({ ignoreMobileResize: true });   // панель адреса на телефоне не пересчитывает сцены
    }
  } else {
    document.documentElement.classList.remove("anim");
  }

  /* ---------------------------------------------------------------- утилиты */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
  const ico = (id, cls = "ico") => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const waHref = (text) => `https://wa.me/${S.whatsapp}?text=${encodeURIComponent(text)}`;
  const tgHref = (text) => `https://t.me/${S.telegram}?text=${encodeURIComponent(text)}`;

  const store = {
    get() { try { return localStorage.getItem("lang"); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem("lang", v); } catch (e) { /* приватный режим */ } }
  };

  /* ------------------------------------------------------------ рендер секций */
  const R = {
    nav: (T) => T.nav.map((n) => `<li><a href="#${n.id}" data-nav="${n.id}">${esc(n.label)}</a></li>`).join(""),

    heroPoints: (T) => T.hero.points.map((p) => `<li>${esc(p)}</li>`).join(""),

    services: (T) => T.services.items.map((s) => `
      <li class="service">
        <h3 class="service__title">${esc(s.title)}</h3>
        <div class="service__body">
          <p>${esc(s.text)}</p>
          <ul class="pills">${s.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        </div>
      </li>`).join(""),

    // у работы с видео вместо скриншота — ролик с обложкой (img), а кнопка — только если есть url
    cases: (T) => T.cases.items.map((c) => `
      <li class="case${c.video ? " case--video" : ""}">
        ${c.video ? `
        <div class="case__shot">
          <video src="${esc(c.video)}" poster="${esc(c.img)}" controls muted playsinline preload="none" aria-label="${esc(c.title)}"></video>
        </div>` : `
        <a class="case__shot" href="${esc(c.url)}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">
          <img src="${esc(c.img)}" alt="" loading="lazy" decoding="async">
        </a>`}
        <div class="case__body">
          <ul class="pills">${c.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
          <h3 class="case__title">${esc(c.title)}</h3>
          <p class="case__text">${esc(c.text)}</p>
          ${c.url ? `<a class="btn case__link" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.visit || T.cases.visit)} ${ico("ext")}</a>` : ""}
        </div>
      </li>`).join(""),

    process: (T) => T.process.steps.map((s, i) => `
      <li class="step">
        <span class="step__num" aria-hidden="true">${i + 1}</span>
        <h3 class="step__title">${esc(s.title)}</h3>
        <p class="step__time">${esc(s.time)}</p>
        <p class="step__text">${esc(s.text)}</p>
      </li>`).join(""),

    pricing: (T) => T.pricing.items.map((p) => `
      <li class="price">
        <div class="price__main">
          <h3 class="price__name">${esc(p.name)}</h3>
          <p class="price__text">${esc(p.text)}</p>
        </div>
        <p class="price__side"><span class="price__val"><small>${esc(T.pricing.from)}</small> ${esc(p.price)}</span><span class="price__time">${esc(p.time)}</span></p>
      </li>`).join(""),

    faq: (T) => T.faq.items.map((f, i) => `
      <div class="faq__item">
        <h3 class="faq__h"><button type="button" class="faq__q" id="faq-q-${i}" aria-expanded="false" aria-controls="faq-a-${i}">
          <span>${esc(f.q)}</span>${ico("plus", "ico faq__ico")}</button></h3>
        <div class="faq__a" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}" hidden><div class="faq__a-in"><p>${esc(f.a)}</p></div></div>
      </div>`).join("")
  };

  /* ------------------------------------------------------------------ отзывы */
  const B = S.reviewsBackend || {};
  const fbOn = Boolean(B.projectId && B.apiKey);
  const fsUrl = () => `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(B.projectId)}/databases/(default)/documents`;
  let remoteReviews = [];

  const stars = (n, label) => `<span class="stars" role="img" aria-label="${esc(label)}">${[1, 2, 3, 4, 5].map((i) =>
    `<svg class="ico${i <= n ? " is-on" : ""}" aria-hidden="true"><use href="#i-star"/></svg>`).join("")}</span>`;

  function renderReviews() {
    const T = C[lang].reviews;
    const list = $("#reviews-list");
    const empty = $("#reviews-empty");
    if (!list) return;
    const all = [...T.items, ...remoteReviews];
    list.innerHTML = all.map((r) => {
      const n = Math.max(0, Math.min(5, Number(r.rating) || 0));
      return `<li class="review">
        ${n ? stars(n, `${n} ${T.outOf}`) : ""}
        <p class="review__text">${esc(r.text)}</p>
        <p class="review__who"><b>${esc(r.name)}</b>${r.role ? `<span>${esc(r.role)}</span>` : ""}</p>
      </li>`;
    }).join("");
    if (empty) { empty.textContent = T.empty; empty.hidden = all.length > 0; }
  }

  // Звёзды выбора оценки: порядок 5→1 + row-reverse в CSS, чтобы подсветка шла слева направо
  function renderRateInput() {
    const box = $("#rate-stars");
    if (!box) return;
    const T = C[lang].reviews;
    const cur = (box.querySelector("input:checked") || {}).value || "5";
    box.innerHTML = [5, 4, 3, 2, 1].map((i) => `
      <input class="rate__in visually-hidden" type="radio" name="rating" id="rate-${i}" value="${i}"${String(i) === cur ? " checked" : ""}>
      <label class="rate__star" for="rate-${i}"><svg class="ico" aria-hidden="true"><use href="#i-star"/></svg><span class="visually-hidden">${i} ${esc(T.outOf)}</span></label>`).join("");
  }

  async function fetchReviews() {
    if (!fbOn) return;
    try {
      const res = await fetch(`${fsUrl()}:runQuery?key=${encodeURIComponent(B.apiKey)}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "reviews" }],
          where: { fieldFilter: { field: { fieldPath: "approved" }, op: "EQUAL", value: { booleanValue: true } } }, limit: 50 } })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      remoteReviews = rows.filter((r) => r.document).map((r) => {
        const f = r.document.fields || {};
        return {
          name: (f.name && f.name.stringValue) || "", role: (f.role && f.role.stringValue) || "",
          text: (f.text && f.text.stringValue) || "", rating: Number(f.rating && f.rating.integerValue) || 0,
          at: (f.createdAt && f.createdAt.timestampValue) || ""
        };
      }).filter((r) => r.name && r.text).sort((a, b) => b.at.localeCompare(a.at));
      renderReviews();
    } catch (err) {
      console.warn("[reviews] не удалось загрузить отзывы", err);
    }
  }

  async function sendReview(r) {
    const res = await fetch(`${fsUrl()}/reviews?key=${encodeURIComponent(B.apiKey)}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: {
        name: { stringValue: r.name }, role: { stringValue: r.role }, text: { stringValue: r.text },
        rating: { integerValue: String(r.rating) }, approved: { booleanValue: false },
        createdAt: { timestampValue: new Date().toISOString() }
      } })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  const lastSent = {
    get() { try { return Number(localStorage.getItem("reviewAt")) || 0; } catch (e) { return 0; } },
    set() { try { localStorage.setItem("reviewAt", String(Date.now())); } catch (e) { /* приватный режим */ } }
  };

  function initReviewForm() {
    const form = $("#review-form");
    if (!form) return;
    const status = $("#review-status");
    const btn = $("#review-submit");
    const say = (msg, kind) => { status.textContent = msg; status.dataset.kind = kind || ""; };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const T = C[lang].reviews.form;
      const fd = new FormData(form);
      if (fd.get("website")) return;                                   // поле-ловушка заполнил бот
      const r = {
        name: String(fd.get("name") || "").trim().slice(0, 40),
        role: String(fd.get("role") || "").trim().slice(0, 60),
        text: String(fd.get("text") || "").trim().slice(0, 500),
        rating: Math.max(1, Math.min(5, Number(fd.get("rating")) || 5))
      };
      if (!r.name || r.text.length < 10) { say(T.invalid, "error"); return; }
      if (Date.now() - lastSent.get() < 60000) { say(T.wait, "error"); return; }

      const done = (msg) => { lastSent.set(); say(msg, "ok"); form.reset(); renderRateInput(); };

      if (!fbOn) {                                                     // запасной путь, пока не подключена база: отзыв уходит в Telegram
        const msg = `${T.tgPrefix}\n${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)} ${r.rating}/5\n${r.name}${r.role ? ` (${r.role})` : ""}\n${r.text}`;
        window.open(tgHref(msg), "_blank", "noopener");
        done(T.okTg);
        return;
      }

      btn.disabled = true;
      say(T.sending, "");
      try {
        await sendReview(r);
        done(T.ok);
      } catch (err) {
        console.error("[reviews] отправка не удалась", err);
        say(T.err, "error");
      } finally {
        btn.disabled = false;
      }
    });
  }

  let lang = "ru";

  function render() {
    const T = C[lang];
    document.documentElement.lang = lang;
    document.title = T.meta.title;
    const md = $('meta[name="description"]');
    if (md) md.setAttribute("content", T.meta.description);

    $$("[data-i18n]").forEach((el) => {
      const v = get(T, el.dataset.i18n);
      if (v != null) el.textContent = v;
    });
    $$("[data-i18n-attr]").forEach((el) => {
      el.dataset.i18nAttr.split(";").forEach((pair) => {
        const [attr, path] = pair.split(":");
        const v = get(T, path);
        if (v != null) el.setAttribute(attr, v);
      });
    });
    $$("[data-render]").forEach((el) => {
      const fn = R[el.dataset.render];
      if (fn) el.innerHTML = fn(T);
    });

    // контакты
    $$("[data-wa]").forEach((a) => { a.href = waHref(T.contacts.waMessage); });
    $$("[data-tg]").forEach((a) => { a.href = tgHref(T.contacts.tgMessage); });
    $$("[data-tg-text]").forEach((s) => { s.textContent = `@${S.telegram}`; });
    $$("[data-phone-text]").forEach((s) => { s.textContent = S.phoneDisplay; });

    // отзывы
    renderRateInput();
    renderReviews();
    const rs = $("#review-status");
    if (rs) { rs.textContent = ""; rs.dataset.kind = ""; }

    const brandLink = $(".brand");
    if (brandLink) brandLink.setAttribute("aria-label", T.brand.name);

    $$(".lang__btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    const y = $("#year"); if (y) y.textContent = new Date().getFullYear();
    spyRefresh();
  }

  /* ------------------------------------------------------ плавная прокрутка
     Lenis крутит страницу в том же кадре GSAP, что и анимации, — поэтому
     параллакс и появление блоков не отстают от прокрутки и не дёргаются. */
  let lenis = null;
  const lenisRaf = (time) => lenis && lenis.raf(time * 1000);

  function smoothOn() {
    if (lenis || !animOn() || !window.Lenis) return;
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, allowNestedScroll: true });
    if (window.ScrollTrigger) lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(lenisRaf);
    gsap.ticker.lagSmoothing(0);
  }

  function smoothOff() {
    if (!lenis) return;
    gsap.ticker.remove(lenisRaf);
    gsap.ticker.lagSmoothing(500, 33);
    lenis.destroy();
    lenis = null;
  }

  // отступ под шапку Lenis берёт из scroll-padding-top в CSS
  function scrollToHash(hash) {
    const el = hash === "#hero" || hash === "#top" ? 0 : document.querySelector(hash);
    if (el == null) return false;
    if (lenis) lenis.scrollTo(el, { duration: 1.2 });
    else if (el === 0) window.scrollTo({ top: 0, behavior: "smooth" });
    else el.scrollIntoView({ behavior: "smooth" });
    return true;
  }

  /* ----------------------------------------------------- первый экран
     Логотип поднимается из-под линии, затем шапка и подписи. */
  let ctx = null;
  let intro = null;

  function heroIntro() {
    return gsap.timeline({ delay: 0.15, defaults: { ease: "power3.out" } })
      // только transform: прежний clip-path заставлял перерисовывать огромное слово с маской в каждом кадре
      // 130%, а не 100%: на широком экране рамка слова пропускает его тени, слово должно стартовать ниже них
      .fromTo(".hero__word", { yPercent: 130, autoAlpha: 1 }, { yPercent: 0, duration: 1.1, ease: "power4.out", force3D: true }, 0)
      .fromTo(".hero__mark", { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8 }, 0.35)
      .fromTo(".header", { yPercent: -140, autoAlpha: 1 }, { yPercent: 0, duration: 0.8 }, 0.6)
      .fromTo(".hero__hello, .hero__role", { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1 }, 0.7)
      .add(() => $(".hero").classList.add("is-lit"), 0.9);   // блик по стеклу (CSS), когда логотип уже поднялся
  }

  // смена языка и прочие пересборки: сразу конечное состояние. Интро с нулевой длительностью
  // GSAP иногда не доигрывал — шапка и логотип застревали в начальной точке за краем экрана
  function heroShow() {
    gsap.set(".hero__word, .hero__mark, .header, .hero__hello, .hero__role", { yPercent: 0, y: 0, autoAlpha: 1 });
    $(".hero").classList.add("is-lit");
  }

  const finishIntro = () => { if (intro && intro.progress() < 1) intro.progress(1); };

  // при прокрутке логотип отстаёт — лёгкая глубина
  function heroScroll() {
    gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true, onUpdate: (self) => { if (self.progress > 0) finishIntro(); } } })
      .to(".hero__float", { yPercent: 18, ease: "none", force3D: true }, 0);
  }

  // переходы между разделами: номер-капсула раскрывается, заголовок выезжает строками,
  // скриншот работы всплывает и приближается, финал заливается цветом логотипа
  function sectionsScroll(instant) {
    const heads = $$(".section__head, .pricing__head");
    if (instant) { heads.forEach((h) => h.classList.add("is-in")); }
    else {
      ScrollTrigger.batch(heads, { start: "top 88%", once: true, onEnter: (b) => b.forEach((h) => h.classList.add("is-in")) });

      if (window.SplitText) $$(".section__head .h2, .pricing__head .h2").forEach((h2) => {
        SplitText.create(h2, {
          type: "lines", mask: "lines", autoSplit: true,
          onSplit: (self) => gsap.from(self.lines, {
            yPercent: 110, duration: 1.1, ease: "power4.out", stagger: 0.09, delay: 0.1,
            scrollTrigger: { trigger: h2, start: "top 88%", once: true }
          })
        });
      });

      // только transform и opacity: раньше скриншот раскрывался через clip-path, и браузер
      // перерисовывал всю картинку с тенью в каждом кадре — при подходе к работам прокрутка лагала
      // карточки работ всплывают целиком; на телефоне они стоят в ленте, поэтому триггер — сама лента
      $$(".case").forEach((card, i) => {
        const img = card.querySelector(".case__shot img, .case__shot video");
        if (img.decode) img.decode().catch(() => {});   // декодируем заранее, а не в первом кадре появления
        gsap.set([card, img], { transition: "none", willChange: "transform" });   // CSS-переход не должен догонять GSAP
        const trigger = window.innerWidth < 760 ? card.parentElement : card;
        gsap.timeline({ scrollTrigger: { trigger, start: "top 85%", once: true }, delay: window.innerWidth < 760 ? i * 0.08 : 0 })
          .from(card, { y: 50, autoAlpha: 0, duration: 1, ease: "power3.out", force3D: true })
          .from(img, { scale: 1.15, duration: 1.3, ease: "power3.out", force3D: true }, 0)
          .add(() => gsap.set([card, img], { clearProps: "transform,transition,willChange" }));
      });

      // остальные блоки мягко всплывают
      const items = $$(".section__head .lead, .pricing__head .lead, .pricing__cta, .pricing__note, .service, .step, .price, .review, .faq__item, .rform, .reviews__empty");
      // на время появления CSS-переходы выключены: иначе transition: transform у карточек и кнопок
      // догоняет каждый кадр GSAP и движение идёт рывками; clearProps возвращает CSS-подъём при наведении
      gsap.set(items, { autoAlpha: 0, y: 36, transition: "none" });
      ScrollTrigger.batch(items, {
        start: "top 90%", once: true,
        onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.09, overwrite: true, clearProps: "transform,transition" })
      });
    }

    // финал: капсула цвета логотипа в центре белого блока раскрывается до краёв, затем проявляется текст
    // конец — низ блока у низа экрана: точка достижима всегда (раньше на высоком экране страница кончалась раньше «top 15%»,
    // и ссылки оставались полупрозрачными). Начало — край блока у низа экрана: заливка идёт вровень с тем,
    // сколько блока уже видно; scrub с запаздыванием сглаживает рывки колеса и пальца
    gsap.timeline({ scrollTrigger: { trigger: ".contacts", start: "top bottom", end: "bottom bottom", scrub: 0.8 } })
      .fromTo(".contacts__flood", { clipPath: "inset(46% 49.5% 46% 49.5% round 999px)" },
        { clipPath: "inset(46% 30% 46% 30% round 999px)", duration: 0.3, ease: "power2.inOut" })
      .to(".contacts__flood", { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 0.7, ease: "power3.inOut" })
      .from(".contacts__text, .clinks li", { y: 50, autoAlpha: 0, duration: 0.35, stagger: 0.06, ease: "power2.out" }, 0.6);
  }

  function build(instant) {
    if (!animOn()) {
      document.documentElement.classList.remove("anim");
      return;
    }
    document.documentElement.classList.add("anim");
    try { ctx = gsap.context(() => {
      if (instant) heroShow();
      else intro = heroIntro();
      if (window.ScrollTrigger) heroScroll();
    }, document.body);
    } catch (err) {
      animFail(err);
      return;
    }
    if (!window.ScrollTrigger) return;
    if (instant) addSections(true);
    else sectionsLater();
  }

  // если анимации не собрались — показываем контент без них, а не пустую страницу
  function animFail(err) {
    console.error("[anim]", err);
    teardown();
    document.documentElement.classList.remove("anim");
  }

  function addSections(instant) {
    try { ctx.add(() => sectionsScroll(instant)); } catch (err) { animFail(err); }
  }

  // Анимации разделов (SplitText и десятки ScrollTrigger) заново раскладывают всю страницу.
  // При первом открытии это совпадало с началом интро и давало рывок, поэтому собираем их,
  // когда интро и блик отыграли, — или раньше, как только человек начал листать или нажал кнопку.
  let sectionsWait = null;
  function sectionsLater() {
    const evts = ["wheel", "pointerdown", "keydown", "scroll"];
    const go = () => { cancel(); if (ctx) addSections(false); };
    const timer = gsap.delayedCall(intro.delay() + intro.duration() + 1.2, go);
    const cancel = () => { timer.kill(); evts.forEach((e) => window.removeEventListener(e, go)); sectionsWait = null; };
    evts.forEach((e) => window.addEventListener(e, go, { passive: true }));
    sectionsWait = cancel;
  }

  function teardown() {
    if (sectionsWait) sectionsWait();
    finishIntro();
    if (ctx) { ctx.revert(); ctx = null; }
    intro = null;
  }

  /* ------------------------------------------------------- подсветка пункта меню */
  let spy = null;
  function spyRefresh() {
    if (spy) spy.disconnect();
    if (!("IntersectionObserver" in window)) return;
    const links = new Map($$("[data-nav]").map((a) => [a.dataset.nav, a]));
    spy = new IntersectionObserver((entries) => {
      entries.filter((e) => !e.isIntersecting).forEach((e) => {
        const a = links.get(e.target.id);
        if (a) a.removeAttribute("aria-current");
      });
      entries.filter((e) => e.isIntersecting).forEach((e) => {
        links.forEach((a) => a.removeAttribute("aria-current"));
        const a = links.get(e.target.id);
        if (a) a.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ------------------------------------------------------------------ события */
  const header = $(".header");
  const burger = $("#burger");
  const setMenu = (open) => {
    header.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("nav-open", open);
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
  };

  document.addEventListener("click", (e) => {
    const langBtn = e.target.closest(".lang__btn");
    if (langBtn) { setLang(langBtn.dataset.lang); return; }

    if (e.target.closest("#burger")) { setMenu(!header.classList.contains("is-open")); return; }

    // якоря листаем плавно и с отступом под шапку; ссылку «к содержимому» оставляем браузеру — она переводит фокус
    const anchor = e.target.closest('a[href^="#"]:not(.skip)');
    if (anchor && anchor.getAttribute("href").length > 1) {
      setMenu(false);
      if (scrollToHash(anchor.getAttribute("href"))) e.preventDefault();
      return;
    }

    const q = e.target.closest(".faq__q");
    if (q) toggleFaq(q);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  window.addEventListener("scroll", () => header.classList.toggle("is-scrolled", window.scrollY > 8), { passive: true });

  function toggleFaq(btn) {
    const open = btn.getAttribute("aria-expanded") === "true";
    const panel = document.getElementById(btn.getAttribute("aria-controls"));
    btn.setAttribute("aria-expanded", String(!open));
    btn.closest(".faq__item").classList.toggle("is-open", !open);
    const animate = animOn();
    if (!open) {
      panel.hidden = false;
      if (animate) gsap.fromTo(panel, { height: 0 }, { height: "auto", duration: 0.45, ease: "power3.out", onComplete: () => gsap.set(panel, { clearProps: "height" }) });
    } else if (animate) {
      gsap.fromTo(panel, { height: panel.offsetHeight }, { height: 0, duration: 0.35, ease: "power3.inOut", onComplete: () => { panel.hidden = true; gsap.set(panel, { clearProps: "height" }); } });
    } else {
      panel.hidden = true;
    }
  }

  function setLang(l, init) {
    if (!C[l]) l = S.defaultLang;
    lang = l;
    store.set(l);
    if (!init) teardown();
    render();
    if (init) {
      const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      Promise.race([ready, new Promise((r) => setTimeout(r, 1500))]).then(() => build(false));
    } else {
      build(true);
    }
  }

  mqReduce.addEventListener("change", () => { teardown(); smoothOff(); smoothOn(); build(true); });
  window.addEventListener("resize", finishIntro, { passive: true });

  // Высота страницы меняется уже после сборки анимаций: раскрыли ответ в «Вопросах», догрузились отзывы.
  // ScrollTrigger при этом помнит старые координаты, и заливка финала срабатывала раньше или позже,
  // чем блок на экране, — пересчитываем, когда высота устоялась
  if (window.ResizeObserver && window.ScrollTrigger) {
    let pageH = 0, refreshT = 0;
    new ResizeObserver(() => {
      const h = document.body.offsetHeight;
      if (h === pageH) return;
      pageH = h;
      clearTimeout(refreshT);
      refreshT = setTimeout(() => ScrollTrigger.refresh(), 200);
    }).observe(document.body);
  }

  /* ------------------------------------------------------------------- старт */
  smoothOn();
  initReviewForm();
  fetchReviews();
  const urlLang = new URLSearchParams(location.search).get("lang");
  setLang(C[urlLang] ? urlLang : (C[store.get()] ? store.get() : S.defaultLang), true);
})();
