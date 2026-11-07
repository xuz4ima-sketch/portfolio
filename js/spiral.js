/* ==========================================================================
   spiral.js — работы на спирали вокруг цилиндра (WebGL без библиотек).
   По одной карточке на работу. Пока сцена прилипла к экрану, прокрутка ведёт
   спираль от работы к работе: на каждой есть «остановка» — карточка выходит
   вперёд, распрямляется, чуть растёт, остальные бледнеют, рядом появляется
   описание с кнопкой. Если прокрутка замерла между работами, сцена сама
   доезжает до ближайшей.

   Почему так, а не CSS 3D: изгиб карточки в CSS — это десятки полосок-слоёв,
   на телефоне они тормозят. Здесь весь кадр — 5 вызовов отрисовки, рисуем
   только когда сцена на экране и прокрутка сдвинулась.
   ========================================================================== */
(() => {
  "use strict";

  const VS = `
    attribute vec2 aUV;
    uniform mat4 uProj;
    uniform float uAngle, uArc, uR, uY, uH, uZ, uCam, uOpen, uGrow;
    uniform vec2 uShift;
    varying vec2 vUV;
    varying float vFace;
    void main() {
      float a = uAngle + (aUV.x - 0.5) * uArc;
      vec3 n = vec3(sin(a), 0.0, cos(a));
      vec3 pc = vec3(uR * n.x, uY + (0.5 - aUV.y) * uH, uR * n.z + uZ);
      // распрямлённая карточка: касательная плоскость к цилиндру в её центре, чуть крупнее
      vec3 n0 = vec3(sin(uAngle), 0.0, cos(uAngle));
      vec3 t0 = vec3(n0.z, 0.0, -n0.x);
      float g = 1.0 + uGrow;
      vec3 pf = vec3(uR * n0.x, uY, uR * n0.z + uZ)
              + t0 * ((aUV.x - 0.5) * uR * uArc * g)
              + vec3(0.0, (0.5 - aUV.y) * uH * g, 0.0);
      vec3 p = mix(pc, pf, uOpen) + vec3(uShift * uOpen, 0.0);
      vec3 nn = normalize(mix(n, n0, uOpen));
      vFace = dot(nn, normalize(vec3(0.0, 0.0, uCam) - p));
      vUV = aUV;
      gl_Position = uProj * vec4(p.x, p.y, p.z - uCam, 1.0);
    }`;

  const FS = `
    precision mediump float;
    uniform sampler2D uTex;
    uniform float uHasTex, uRad, uFade, uBack, uDim;
    uniform vec2 uSize, uRes;
    uniform vec3 uBase;
    varying vec2 vUV;
    varying float vFace;
    void main() {
      vec3 col = mix(uBase, texture2D(uTex, vUV).rgb, uHasTex);
      // скруглённые углы: расстояние до края в пикселях карточки
      vec2 q = abs((vUV - 0.5) * uSize) - (uSize * 0.5 - uRad);
      float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRad;
      float a = clamp(0.5 - d, 0.0, 1.0);
      // бока чуть темнее — читается объём; изнанка — бледная и прозрачная
      float back = smoothstep(0.04, -0.12, vFace);
      col *= mix(0.84 + 0.16 * clamp(vFace * 1.4, 0.0, 1.0), 0.8, back);
      a *= mix(1.0, uBack, back) * uDim;
      // мягкий край сцены сверху и снизу, без резкой линии обреза
      float sy = gl_FragCoord.y / uRes.y;
      a *= smoothstep(0.0, uFade, sy) * smoothstep(0.0, uFade, 1.0 - sy);
      gl_FragColor = vec4(col * a, a);
    }`;

  const TAU = Math.PI * 2;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

  const PER = 0.8;        // прокрутка на одну работу, в высотах экрана
  const HOLD = 0.3;       // доля этой прокрутки (с каждой стороны), пока работа стоит раскрытой
  const ENTER = 1.6;      // сколько «работ» спираль проходит, пока сцена въезжает и уезжает
  const SNAP_IDLE = 220;  // мс без прокрутки — и сцена доезжает до ближайшей работы

  function create(opts) {
    const root = opts.root;
    const stage = root.querySelector(".spiral__stage");
    const canvas = root.querySelector(".spiral__gl");
    const head = root.querySelector(".spiral__head");
    const panel = root.querySelector(".spiral__panel");
    const items = opts.items;                       // [{ img }] — порядок как в content.js
    const N = items.length;
    if (!N) return null;
    let destroyed = false;

    const gl = canvas.getContext("webgl", {
      alpha: true, premultipliedAlpha: true, antialias: true, depth: false, stencil: false,
      powerPreference: "high-performance",
      failIfMajorPerformanceCaveat: true            // программный рендер тормозит — тогда просто сетка
    });
    if (!gl) return null;

    /* ---------------------------------------------------------- шейдеры */
    let prog, nIdx, U = {}, texs = [], white;
    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    function setupGL() {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      ["uProj", "uAngle", "uArc", "uR", "uY", "uH", "uZ", "uCam", "uOpen", "uGrow", "uShift",
       "uTex", "uHasTex", "uRad", "uFade", "uBack", "uDim", "uSize", "uRes", "uBase"]
        .forEach((k) => { U[k] = gl.getUniformLocation(prog, k); });

      // полоса из 32 столбцов: по горизонтали карточка гнётся, по вертикали прямая
      const SEG = 32, v = [], idx = [];
      for (let i = 0; i <= SEG; i++) { v.push(i / SEG, 0, i / SEG, 1); }
      for (let i = 0; i < SEG; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
      const ib = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
      nIdx = idx.length;
      const loc = gl.getAttribLocation(prog, "aUV");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);                     // изнанку тоже видно
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform1i(U.uTex, 0);
      gl.uniform3f(U.uBase, 0.925, 0.92, 0.905);   // пока картинка не загрузилась
      gl.uniform1f(U.uBack, 0.42);

      white = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, white);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
      texs = items.map(() => null);
    }
    setupGL();

    /* ------------------------------------------------------- текстуры
       Картинку обрезаем «по верху» в 16:10, как в сетке, и кладём в холст 1024×512 —
       степень двойки даёт мипмапы: на маленькой карточке нет ряби. Грузим по одной за кадр. */
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic") || gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic");
    const TW = 1024, TH = 512;
    let loadStarted = false;
    const raf = () => new Promise((r) => requestAnimationFrame(r));

    function loadImage(src) {
      return new Promise((res, rej) => {
        const im = new Image();
        im.decoding = "async";
        im.onload = () => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(() => res(im));
        im.onerror = rej;
        im.src = src;
      });
    }
    async function loadTextures() {
      if (loadStarted) return;
      loadStarted = true;
      const c = document.createElement("canvas");
      c.width = TW; c.height = TH;
      const g = c.getContext("2d");
      for (let i = 0; i < N; i++) {
        let im;
        try { im = await loadImage(items[i].img); } catch (e) { continue; }
        if (destroyed) return;
        const sw = im.naturalWidth, sh = Math.min(im.naturalHeight, sw / 1.6);
        g.drawImage(im, 0, 0, sw, sh, 0, 0, TW, TH);
        await raf();
        if (destroyed || gl.isContextLost()) return;
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(4, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
        texs[i] = t;
        dirty = true;
      }
    }

    /* ------------------------------------------------- описание работы
       Содержимое даёт main.js (язык, кнопка), здесь — только где оно стоит и когда видно.
       Широкий экран: карточка слева, описание справа. Узкий: описание под карточкой. */
    let panelIdx = -1;
    function fillPanel(i) {
      if (!panel) return;
      panelIdx = i;
      opts.fill(i, panel);
      placePanel();
    }
    function placePanel() {
      if (!panel || !L.W) return;
      panel.style.width = `${Math.round(L.pw)}px`;
      const ph = panel.offsetHeight;
      const x = L.side ? L.px : (L.W - L.pw) / 2;
      const y = L.side ? (L.H - ph) / 2 : L.py;
      panel.style.left = `${Math.round(x)}px`;
      panel.style.top = `${Math.round(y)}px`;
    }
    // самое высокое описание — чтобы на телефоне карточка с ним не вылезала за экран
    function tallestPanel() {
      if (!panel) return 0;
      panel.style.width = `${Math.round(L.pw)}px`;
      let m = 0;
      for (let i = 0; i < N; i++) { opts.fill(i, panel); m = Math.max(m, panel.offsetHeight); }
      if (panelIdx >= 0) opts.fill(panelIdx, panel);
      return m;
    }

    /* ----------------------------------------------------------- размеры */
    const FOV = 36 * Math.PI / 180;
    const L = {};                                   // геометрия под текущий экран
    function layout() {
      const W = stage.clientWidth, H = stage.clientHeight;
      if (!W || !H) return;
      const mobile = W < 760;
      const side = W >= 900 && H >= 480;
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.75 : 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);

      // ширина карточки — от ширины экрана, но чтобы по высоте помещалась
      const w = Math.min(mobile ? W * 0.6 : W * 0.27, 400, H * 0.5 * 1.6);
      const h = w / 1.6;
      const arc = 1.3;                              // ≈75° окружности на карточку
      const R = w / arc;
      const cam = (H / 2) / Math.tan(FOV / 2);      // при z=0 1 единица = 1 css-пиксель
      const z = -R * 0.35;                          // ближняя сторона цилиндра немного ближе экрана
      const sc = cam / (cam - (R + z));             // во сколько раз ближняя карточка крупнее на экране
      Object.assign(L, { W, H, w, h, arc, R, cam, z, sc, mobile, side, step: TAU / 3.6, dy: h * 0.52 });

      // раскрытая карточка: размер на экране (cw×ch), сдвиг и место описания
      const gut = mobile ? 16 : 32, gap = side ? 44 : 16;
      let cw, sx = 0, sy = 0;
      if (side) {
        L.pw = Math.min(400, W * 0.3);
        cw = Math.min(w * sc * 1.25, W - 2 * gut - gap - L.pw, (H - 2 * gut) * 0.8 * 1.6);
        const left = (W - (cw + gap + L.pw)) / 2;
        sx = (left + cw / 2 - W / 2) / sc;
        L.px = left + cw + gap;
      } else {
        L.pw = Math.min(W - 2 * gut, 520);
        const ph = tallestPanel();
        cw = Math.max(w * sc, Math.min(L.pw, (H - 2 * gut - gap - ph) * 1.6));
        const ch = cw / 1.6;
        const top = Math.max(gut, (H - (ch + gap + ph)) / 2);
        sy = (H / 2 - (top + ch / 2)) / sc;
        L.py = top + ch + gap;
      }
      L.cw = cw; L.ch = cw / 1.6;
      L.cx = W / 2 + sx * sc; L.cy = H / 2 - sy * sc;   // центр раскрытой карточки на экране

      const f = 1 / Math.tan(FOV / 2), asp = W / H, n = 10, fa = cam + R * 4;
      gl.useProgram(prog);
      gl.uniformMatrix4fv(U.uProj, false, new Float32Array([
        f / asp, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (fa + n) / (n - fa), -1,
        0, 0, (2 * fa * n) / (n - fa), 0
      ]));
      gl.uniform1f(U.uArc, arc);
      gl.uniform1f(U.uR, R);
      gl.uniform1f(U.uH, h);
      gl.uniform1f(U.uZ, z);
      gl.uniform1f(U.uCam, cam);
      gl.uniform1f(U.uGrow, cw / (w * sc) - 1);
      gl.uniform2f(U.uShift, sx, sy);
      gl.uniform2f(U.uSize, w, h);                  // размер карточки в пикселях — для скруглённых углов
      gl.uniform1f(U.uRad, Math.max(6, w * 0.03));
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uFade, mobile ? 0.07 : 0.1);
      placePanel();
      dirty = true;
    }

    /* ------------------------------------------------------------ сцена
       f — какая работа сейчас впереди: 0 — первая, N−1 — последняя, дробное — спираль между ними.
       Пока сцена въезжает снизу, f < 0 (спираль поднимается к первой работе), пока уезжает — f > N−1.
       В середине прохода у каждой работы «ступенька»: прокрутка идёт, а работа стоит раскрытой. */
    let yT = 0, yS = null, dirty = true, last = 0, f = -ENTER;
    const cards = items.map((_, i) => ({ i, angle: 0, y: 0, z: 0, open: 0 }));
    let focus = -1, openMax = 0;

    const stair = (x) => { const k = Math.floor(x); return k + smooth(HOLD, 1 - HOLD, x - k); };
    const span = () => root.offsetHeight - L.H;     // сколько прокрутки сцена стоит прилипшей
    const steps = N - 1 + 2 * HOLD;
    function focusAt(y) {                           // y — насколько верх сцены ушёл за верх экрана
      const sp = span(), vh = window.innerHeight;
      if (y < 0) return ENTER * y / vh;
      if (y > sp) return N - 1 + ENTER * (y - sp) / vh;
      return Math.max(0, Math.min(N - 1, stair(-HOLD + (y / sp) * steps)));
    }
    const yOf = (k) => ((k + HOLD) / steps) * span();   // середина «ступеньки» работы k

    function place() {
      openMax = 0; focus = -1;
      for (const c of cards) {
        c.open = 1 - smooth(0, 0.45, Math.abs(f - c.i));
        if (c.open > openMax) { openMax = c.open; focus = c.i; }
      }
      const spread = 1 + 0.45 * openMax;            // на остановке соседи расходятся, давая место
      for (const c of cards) {
        c.angle = (c.i - f) * L.step;
        c.y = (f - c.i) * L.dy * spread;            // первая работа — верхняя, спираль поднимается
        c.z = Math.cos(c.angle) * L.R + L.z + c.open;
      }
      // заголовок за спиралью бледнеет, когда к центру подходит первая работа
      // и почти гаснет, пока раскрыта работа, — не просвечивает сквозь описание
      if (head) {
        const o = ((1 - 0.85 * clamp01((f + 0.8) / 0.6)) * (1 - 0.75 * openMax)).toFixed(3);
        if (o !== head._o) { head.style.opacity = o; head._o = o; }
      }
    }

    function draw() {
      place();
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      const order = cards.slice().sort((a, b) => a.z - b.z);   // дальние — первыми
      const lim = L.H / 2 + L.ch;
      for (const c of order) {
        if (Math.abs(c.y) > lim && c.open < 0.01) continue;    // за пределами экрана — не рисуем
        const t = texs[c.i];
        gl.bindTexture(gl.TEXTURE_2D, t || white);
        gl.uniform1f(U.uHasTex, t ? 1 : 0);
        gl.uniform1f(U.uAngle, c.angle);
        gl.uniform1f(U.uY, c.y);
        gl.uniform1f(U.uOpen, c.open);
        gl.uniform1f(U.uDim, 1 - 0.62 * openMax * (1 - c.open));
        gl.drawElements(gl.TRIANGLES, nIdx, gl.UNSIGNED_SHORT, 0);
      }
      showPanel();
    }

    let panelOn = false;
    function showPanel() {
      if (!panel) return;
      const on = openMax > 0.92;
      if (on && focus !== panelIdx) fillPanel(focus);
      if (on === panelOn) return;
      panelOn = on;
      panel.classList.toggle("is-on", on);
      panel.inert = !on;                           // скрытая кнопка не ловит Tab
    }

    /* ------------------------------------------------------------- цикл */
    const measure = () => -root.getBoundingClientRect().top;
    function tick() {
      yT = measure();
      const now = performance.now();
      const dt = Math.min(0.1, (now - (last || now)) / 1000);
      last = now;
      if (yS === null) yS = yT;
      // своя мягкая инерция поверх прокрутки: на телефоне палец двигает страницу рывками
      const k = 1 - Math.exp(-dt * (L.mobile ? 9 : 11));
      const ny = Math.abs(yT - yS) < 0.05 ? yT : yS + (yT - yS) * k;
      if (ny !== yS) { yS = ny; dirty = true; }
      if (dirty && !gl.isContextLost()) { dirty = false; f = focusAt(yS); draw(); }
    }

    let running = false;
    const ticker = window.gsap ? gsap.ticker : null;
    let rafId = 0;
    const loop = () => { tick(); rafId = requestAnimationFrame(loop); };
    function start() {
      if (running || destroyed) return;
      running = true;
      last = 0;
      if (ticker) ticker.add(tick); else rafId = requestAnimationFrame(loop);
    }
    function stop() {
      if (!running) return;
      running = false;
      if (ticker) ticker.remove(tick); else cancelAnimationFrame(rafId);
    }

    /* ------------------------------------------- доводка до ближайшей работы
       Прокрутка замерла между работами (не на «ступеньке») — плавно докручиваем страницу
       к середине ступеньки ближайшей. Пока палец на экране — не трогаем. */
    let idleT = 0, touching = false;
    function scrollToCard(k) {
      const target = window.scrollY + root.getBoundingClientRect().top + yOf(k);
      if (Math.abs(target - window.scrollY) > 2 && opts.scrollTo) opts.scrollTo(Math.round(target));
    }
    function snap() {
      if (!running || destroyed || touching) return;
      const y = measure(), sp = span();
      if (y < 0 || y > sp) return;
      const x = -HOLD + (y / sp) * steps;
      const k = Math.max(0, Math.min(N - 1, Math.round(x)));
      if (Math.abs(x - k) <= HOLD * 0.9) return;  // и так стоит раскрытой
      scrollToCard(k);
    }
    const onScroll = () => { clearTimeout(idleT); idleT = setTimeout(snap, SNAP_IDLE); };
    const onTouchStart = () => { touching = true; clearTimeout(idleT); };
    const onTouchEnd = () => { touching = false; onScroll(); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    // рисуем, только пока сцена на экране; картинки начинаем грузить за полтора экрана до неё
    const ioNear = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { loadTextures(); ioNear.disconnect(); } }, { rootMargin: "150% 0px" });
    const ioView = new IntersectionObserver((es) => {
      const on = es[es.length - 1].isIntersecting;
      if (on) { yS = null; dirty = true; start(); } else stop();
    }, { rootMargin: "10% 0px" });
    ioNear.observe(root);
    ioView.observe(root);

    let lastW = 0, lastH = 0;
    const ro = new ResizeObserver(() => {
      const W = stage.clientWidth, H = stage.clientHeight;
      if (W === lastW && H === lastH) return;
      lastW = W; lastH = H;
      layout();
      if (!running) { yS = measure(); f = focusAt(yS); draw(); }
    });
    ro.observe(stage);
    const onResize = () => { dirty = true; };
    window.addEventListener("resize", onResize, { passive: true });

    /* --------------------------------------------- клик по карточке
       Раскрытая карточка — плоский прямоугольник, её проверяем первой. Остальные —
       луч из камеры пересекаем с цилиндром: ближняя точка — та карточка, что под пальцем. */
    function pick(ev) {
      const r = canvas.getBoundingClientRect();
      const mx = ev.clientX - r.left, my = ev.clientY - r.top;
      if (focus >= 0 && openMax > 0.5 && Math.abs(mx - L.cx) < L.cw / 2 && Math.abs(my - L.cy) < L.ch / 2) return focus;
      const nx = (mx / r.width) * 2 - 1;
      const ny = 1 - (my / r.height) * 2;
      const tf = Math.tan(FOV / 2);
      const dx = nx * tf * (L.W / L.H), dy = ny * tf, dz = -1;
      const oz = L.cam - L.z;                       // камера относительно оси цилиндра
      const A = dx * dx + dz * dz, B = 2 * oz * dz, Cc = oz * oz - L.R * L.R;
      const D = B * B - 4 * A * Cc;
      if (D < 0) return -1;
      const t = (-B - Math.sqrt(D)) / (2 * A);      // ближняя сторона
      const px = t * dx, pz = oz + t * dz, py = t * dy;
      const ang = Math.atan2(px, pz);
      let hit = -1, hz = -Infinity;
      for (const c of cards) {
        if (c.open > 0.5) continue;                 // раскрытая уже не на цилиндре
        const da = ((ang - c.angle) % TAU + TAU * 1.5) % TAU - Math.PI;
        if (Math.abs(da) < L.arc / 2 && Math.abs(py - c.y) < L.h / 2 && c.z > hz) { hz = c.z; hit = c.i; }
      }
      return hit;
    }
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let hoverQueued = false, hoverEv = null;
    const onMove = (e) => {
      hoverEv = e;
      if (hoverQueued) return;
      hoverQueued = true;
      requestAnimationFrame(() => { hoverQueued = false; canvas.style.cursor = pick(hoverEv) >= 0 ? "pointer" : ""; });
    };
    // раскрытая работа открывается, соседняя — спираль доезжает до неё
    const onClick = (e) => {
      const i = pick(e);
      if (i < 0) return;
      if (i === focus && openMax > 0.5) { if (opts.onPick) opts.onPick(i); }
      else scrollToCard(i);
    };
    if (finePointer) canvas.addEventListener("pointermove", onMove, { passive: true });
    canvas.addEventListener("click", onClick);

    /* ----------------------------------------- потеря контекста видеокарты */
    const onLost = (e) => { e.preventDefault(); stop(); };
    const onRestored = () => { loadStarted = false; setupGL(); layout(); loadTextures(); yS = null; start(); };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    root.style.setProperty("--spiral-len", (1 + PER * N).toFixed(2));
    root.classList.add("is-on");
    if (panel) panel.inert = true;
    layout();
    yS = measure();
    f = focusAt(yS);
    place();

    return {
      // смена языка: заново меряем описания и подставляем текст текущей работы
      refresh() { layout(); if (panelIdx >= 0) fillPanel(panelIdx); dirty = true; if (!running) draw(); },
      destroy() {
        destroyed = true;
        stop();
        clearTimeout(idleT);
        ioNear.disconnect(); ioView.disconnect(); ro.disconnect();
        window.removeEventListener("resize", onResize);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchend", onTouchEnd);
        window.removeEventListener("touchcancel", onTouchEnd);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("click", onClick);
        canvas.removeEventListener("webglcontextlost", onLost);
        canvas.removeEventListener("webglcontextrestored", onRestored);
        root.classList.remove("is-on");
        root.style.removeProperty("--spiral-len");
        if (head) { head.style.opacity = ""; head._o = null; }
        if (panel) { panel.classList.remove("is-on"); panel.inert = false; panel.removeAttribute("style"); panel.innerHTML = ""; }
        const lose = gl.getExtension("WEBGL_lose_context");
        if (lose) lose.loseContext();
        canvas.replaceWith(canvas.cloneNode(false));   // у потерянного холста контекст уже не взять заново
      }
    };
  }

  window.Spiral = {
    create(opts) {
      try { return create(opts); } catch (err) { console.warn("[spiral]", err); return null; }
    }
  };
})();
