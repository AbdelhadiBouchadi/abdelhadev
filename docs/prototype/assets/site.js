/* Abdelhadev prototype, shared behaviour.
   Order of operations on every page:
   1. the loader is on screen from the first paint (CSS, html.js)
   2. this script measures what the page really needs (fonts, images, window load, the 3D scene on home)
   3. the sun rises and the wordmark builds with real progress, then the curtain lifts and the page intro plays
   Leaving a page sets the sun behind a curtain before the browser navigates. */
(function () {
  "use strict";

  var html = document.documentElement;
  var body = document.body;
  var page = body.getAttribute("data-page") || "home";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var store = {
    get: function (k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };

  /* ---------- Agadir clock ---------- */
  function tick() {
    var t = "";
    try { t = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Casablanca", hour: "2-digit", minute: "2-digit" }).format(new Date()); } catch (e) { t = ""; }
    document.querySelectorAll(".clock").forEach(function (el) { el.textContent = t; });
  }
  tick(); setInterval(tick, 30000);

  /* ---------- fit wordmarks to their column ---------- */
  function fit() {
    document.querySelectorAll("[data-fit]").forEach(function (el) {
      var parent = el.closest(".wrap");
      if (!parent) return;
      var cs = getComputedStyle(parent);
      var avail = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var prev = el.style.getPropertyValue("--wdth");
      el.style.setProperty("--wdth", "100");
      el.style.fontSize = "100px";
      var w = el.offsetWidth;
      if (w > 0) el.style.fontSize = (100 * avail / w).toFixed(2) + "px";
      if (prev) el.style.setProperty("--wdth", prev); else el.style.removeProperty("--wdth");
    });
  }

  /* ---------- no animation library: show a complete, still page ---------- */
  var hasGsap = window.gsap && window.ScrollTrigger && window.SplitText && window.CustomEase;
  if (!hasGsap) {
    html.classList.remove("motion", "sky");
    html.classList.add("loader-off", "ready");
    if (document.fonts) document.fonts.ready.then(fit); else fit();
    initForms();
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
  if (window.DrawSVGPlugin) gsap.registerPlugin(DrawSVGPlugin);
  CustomEase.create("warm", "0.625, 0.05, 0, 1");
  gsap.defaults({ ease: "warm", duration: 0.6 });
  ScrollTrigger.config({ ignoreMobileResize: true });

  var css = function (n) { return getComputedStyle(html).getPropertyValue(n).trim(); };
  var C = { paper: css("--paper"), sunset: css("--sunset"), night: css("--night"), ink: css("--ink"), inkSoft: css("--ink-soft"), moon: css("--moon"), moonSoft: css("--moon-soft") };

  /* ---------- smooth scroll (stopped until the curtain lifts) ---------- */
  history.scrollRestoration = "manual";
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.1, autoRaf: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  function scrollToTarget(target, immediate) {
    if (lenis) lenis.scrollTo(target, { immediate: !!immediate, duration: 1.6, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    else {
      var top = target === 0 ? 0 : target.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top, behavior: immediate || reduce ? "auto" : "smooth" });
    }
  }

  /* ================= LOADER ================= */
  var ready = { done: false, fns: [] };
  function onReady(fn) { if (ready.done) fn(); else ready.fns.push(fn); }

  var Loader = (function () {
    var el = document.querySelector(".loader");
    var tasks = [];
    var track = function (weight, promise) { tasks.push({ w: weight, p: promise }); };
    if (!el) return { track: track, run: function () { fireReady(); }, cover: function (href) { window.location.href = href; } };

    var panel = el.querySelector(".loader-panel");
    var count = el.querySelector(".loader-count");
    var bar = el.querySelector(".loader-bar");
    var live = el.querySelector(".loader-live");
    var disc = el.querySelector(".sun-disc");
    var horizon = el.querySelector(".horizon");
    var reflection = el.querySelector(".reflection");
    var glyphs = gsap.utils.toArray(el.querySelectorAll(".loader-word path"));
    var visited = store.get("abd-visited") === "1";
    var arriving = html.classList.contains("arriving");
    var minMs = reduce ? 250 : (visited || arriving) ? 700 : 1600;
    var maxMs = 4500;
    var t0 = performance.now();
    var shown = { v: 0 };
    var lit = 0;
    var announced = 0;

    gsap.set(glyphs, { opacity: 0, y: 26 });
    gsap.set(disc, { y: 19 });
    if (!reduce) gsap.from([horizon, reflection], { scaleX: 0, svgOrigin: "32 41", duration: 0.9, stagger: 0.08 });

    function paint() {
      var v = shown.v;
      if (count) count.textContent = String(Math.round(v * 100)).padStart(3, "0");
      if (bar) gsap.set(bar, { scaleX: v });
      gsap.set(disc, { y: 19 * (1 - v) });
      var target = Math.floor(v * glyphs.length + 0.0001);
      while (lit < target && lit < glyphs.length) {
        gsap.to(glyphs[lit], { opacity: 1, y: 0, duration: reduce ? 0.01 : 0.7 });
        lit++;
      }
      var pct = Math.round(v * 100);
      if (live && pct >= announced + 50) { announced = pct >= 100 ? 100 : 50; live.textContent = "Loading, " + announced + " percent"; }
    }

    function run() {
      var total = tasks.reduce(function (s, t) { return s + t.w; }, 0) || 1;
      var settled = 0;
      tasks.forEach(function (t) {
        Promise.resolve(t.p).catch(function () {}).then(function () {
          settled += t.w;
          gsap.to(shown, { v: Math.min(1, settled / total), duration: reduce ? 0.01 : 0.8, ease: "power2.out", overwrite: true, onUpdate: paint });
        });
      });
      var all = Promise.all(tasks.map(function (t) { return Promise.resolve(t.p).catch(function () {}); }));
      var ceiling = new Promise(function (r) { setTimeout(r, maxMs); });
      var floor = new Promise(function (r) { setTimeout(r, Math.max(0, minMs - (performance.now() - t0))); });
      Promise.all([Promise.race([all, ceiling]), floor]).then(function () {
        gsap.to(shown, { v: 1, duration: reduce ? 0.01 : 0.45, ease: "power2.out", overwrite: true, onUpdate: paint, onComplete: exit });
      });
    }

    function exit() {
      store.set("abd-visited", "1");
      if (location.hash) {
        var target = document.querySelector(location.hash);
        if (target) scrollToTarget(target, true);
      }
      if (reduce) {
        gsap.to(el, { opacity: 0, duration: 0.25, onComplete: finish });
        fireReady();
        return;
      }
      var tl = gsap.timeline({ onComplete: finish });
      tl.to(glyphs, { y: -30, opacity: 0, duration: 0.55, stagger: 0.025, ease: "power3.in" }, 0)
        .to(el.querySelector(".loader-mark"), { y: -24, opacity: 0, duration: 0.5, ease: "power3.in" }, 0.1)
        .to(el.querySelector(".loader-meta"), { opacity: 0, duration: 0.3 }, 0)
        .to(panel, { yPercent: -100, borderBottomLeftRadius: "50% 14vh", borderBottomRightRadius: "50% 14vh", duration: 1.15, ease: "warm" }, 0.3)
        .add(fireReady, 0.55);
    }

    function finish() {
      el.style.display = "none";
      html.classList.add("loader-off");
      if (lenis) lenis.start();
      ScrollTrigger.refresh();
    }

    /* curtain for leaving the page: the sun sets, then the browser navigates */
    function cover(href) {
      if (lenis) lenis.stop();
      el.style.display = "block";
      el.style.opacity = "1";
      html.classList.remove("loader-off");
      gsap.set(panel, { yPercent: 100, borderRadius: 0, borderTopLeftRadius: "50% 14vh", borderTopRightRadius: "50% 14vh" });
      gsap.set(el.querySelector(".loader-mark"), { y: 0, opacity: 1 });
      gsap.set(glyphs, { opacity: 0 });
      gsap.set(el.querySelector(".loader-meta"), { opacity: 0 });
      gsap.set(disc, { y: 0 });
      var go = function () { store.set("abd-arriving", "1"); window.location.href = href; };
      if (reduce) { gsap.set(panel, { yPercent: 0 }); go(); return; }
      gsap.timeline({ onComplete: go })
        .to(panel, { yPercent: 0, borderTopLeftRadius: "50% 0vh", borderTopRightRadius: "50% 0vh", duration: 0.8, ease: "warm" }, 0)
        .to(disc, { y: 19, duration: 0.7, ease: "power2.in" }, 0.2);
    }

    window.addEventListener("pageshow", function (e) {
      if (e.persisted) { el.style.display = "none"; html.classList.add("loader-off", "ready"); if (lenis) lenis.start(); }
    });

    return { track: track, run: run, cover: cover };
  })();

  function fireReady() {
    if (ready.done) return;
    ready.done = true;
    html.classList.add("ready");
    ready.fns.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
    ready.fns = [];
  }

  /* real work the page needs before it is shown */
  if (document.fonts) Loader.track(3, document.fonts.ready);
  Loader.track(2, new Promise(function (r) { if (document.readyState === "complete") r(); else window.addEventListener("load", r, { once: true }); }));
  document.querySelectorAll("img").forEach(function (img) { Loader.track(1, img.decode ? img.decode() : Promise.resolve()); });

  /* ================= NAVIGATION ================= */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var href = a.getAttribute("href");
    if (a.target === "_blank" || /^(https?:|mailto:|tel:)/.test(href)) return;
    if (href.charAt(0) === "#") {
      var t = href === "#top" ? 0 : document.querySelector(href);
      if (t === null) return;
      e.preventDefault();
      scrollToTarget(t);
      return;
    }
    if (/\.html(#.*)?$/.test(href) || /^\.\/(#.*)?$/.test(href)) {
      var samePage = href.split("#")[0] === (location.pathname.split("/").pop() || "index.html");
      if (samePage && href.indexOf("#") > -1) {
        var tt = document.querySelector("#" + href.split("#")[1]);
        if (tt) { e.preventDefault(); scrollToTarget(tt); return; }
      }
      e.preventDefault();
      Loader.cover(href);
    }
  });

  /* ================= TONE: header, pill and cursor follow day and night ================= */
  var header = document.querySelector(".site-header");
  var pill = document.querySelector(".pill");
  var cursor = document.querySelector(".cursor");
  function setTone(t) {
    if (header) header.dataset.tone = t;
    if (pill) pill.dataset.tone = t;
    if (cursor) cursor.dataset.tone = t;
  }
  function initTone() {
    document.querySelectorAll("main > [data-tone], main > .chapters > [data-tone], footer[data-tone]").forEach(function (sec) {
      var tone = sec.getAttribute("data-tone") === "night" ? "night" : "day";
      ScrollTrigger.create({
        trigger: sec, start: sec.getAttribute("data-tone-start") || "top 50px", end: "bottom 50px",
        onToggle: function (s) { if (s.isActive) setTone(tone); }
      });
    });
    if (header) {
      ScrollTrigger.create({
        start: 0, end: "max",
        onUpdate: function (s) {
          var y = s.scroll();
          var hide = s.direction === 1 && y > 240 && !header.contains(document.activeElement);
          header.classList.toggle("is-hidden", hide);
        }
      });
    }
  }

  /* ================= CURSOR ================= */
  function initCursor() {
    if (!finePointer || !cursor || reduce) return;
    var label = cursor.querySelector(".label");
    var pos = { x: -100, y: -100 }, aim = { x: -100, y: -100 };
    window.addEventListener("pointermove", function (e) { aim.x = e.clientX; aim.y = e.clientY; cursor.style.opacity = "1"; });
    document.addEventListener("pointerleave", function () { cursor.style.opacity = "0"; });
    gsap.ticker.add(function () {
      var k = 1 - Math.pow(1 - 0.16, gsap.ticker.deltaRatio());
      pos.x += (aim.x - pos.x) * k; pos.y += (aim.y - pos.y) * k;
      gsap.set(cursor, { x: pos.x, y: pos.y });
    });
    document.querySelectorAll("[data-cursor]").forEach(function (el) {
      el.addEventListener("pointerenter", function () { label.textContent = el.getAttribute("data-cursor"); cursor.classList.add("is-label"); });
      el.addEventListener("pointerleave", function () { cursor.classList.remove("is-label"); });
    });
    document.querySelectorAll(".magnetic").forEach(function (el) {
      var qx = gsap.quickTo(el, "x", { duration: 0.6, ease: "warm" });
      var qy = gsap.quickTo(el, "y", { duration: 0.6, ease: "warm" });
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        qx((e.clientX - (r.left + r.width / 2)) * 0.22); qy((e.clientY - (r.top + r.height / 2)) * 0.3);
      });
      el.addEventListener("pointerleave", function () { qx(0); qy(0); });
    });
  }

  /* ================= SHARED REVEALS ================= */
  function linesUp(selector, opts) {
    var targets = gsap.utils.toArray(selector);
    var lines = [];
    targets.forEach(function (t) { lines = lines.concat(SplitText.create(t, { type: "lines", mask: "lines", autoSplit: false }).lines); });
    gsap.set(lines, { yPercent: 110 });
    return function (delay) { return gsap.to(lines, Object.assign({ yPercent: 0, duration: 1.2, stagger: 0.08, delay: delay || 0 }, opts || {})); };
  }
  function wordsLight(selector, trigger, start, end) {
    gsap.utils.toArray(selector).forEach(function (el) {
      var words = SplitText.create(el, { type: "words" }).words;
      gsap.fromTo(words, { opacity: 0.14 }, { opacity: 1, stagger: 0.1, ease: "none",
        scrollTrigger: { trigger: trigger || el, start: start || "top 75%", end: end || "bottom 40%", scrub: 0.8 } });
    });
  }
  function fadeUpOnEnter(selector, stagger) {
    gsap.utils.toArray(selector).forEach(function (group) {
      var kids = group.children.length ? group.children : [group];
      gsap.from(kids, { y: 28, opacity: 0, duration: 1, stagger: stagger || 0.08, scrollTrigger: { trigger: group, start: "top 85%", once: true } });
    });
  }
  function revealMedia(selector) {
    gsap.utils.toArray(selector).forEach(function (fig) {
      var inner = fig.querySelector(".screen-inner");
      var tl = gsap.timeline({ scrollTrigger: { trigger: fig, start: "top 95%", end: "top 45%", scrub: 0.8 } });
      tl.fromTo(fig, { clipPath: "inset(18% 6% 0% 6% round 18px)" }, { clipPath: "inset(0% 0% 0% 0% round 18px)", ease: "none" }, 0);
      if (inner) tl.fromTo(inner, { scale: 1.16 }, { scale: 1, ease: "none" }, 0);
    });
  }
  function footerWord() {
    var w = document.querySelector(".footer-word");
    if (!w) return;
    gsap.fromTo(w, { yPercent: 60 }, { yPercent: 14, ease: "none", scrollTrigger: { trigger: ".site-footer", start: "top bottom", end: "bottom bottom", scrub: 0.8 } });
    var cta = document.querySelector(".foot-cta .display");
    if (cta) { var play = linesUp(cta); ScrollTrigger.create({ trigger: cta, start: "top 80%", once: true, onEnter: function () { play(); } }); }
  }

  /* ================= FORMS (contact) ================= */
  function initForms() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    var waNumber = "212637025032";
    var waLink = document.getElementById("wa-link");
    var waPreview = document.getElementById("wa-preview");
    var fields = { name: form.elements.name, email: form.elements.email, org: form.elements.org, message: form.elements.message };
    function compose() {
      var lines = ["Bonjour Abdelhadi,"];
      if (fields.name.value.trim()) lines.push("I'm " + fields.name.value.trim() + (fields.org.value ? " (" + fields.org.options[fields.org.selectedIndex].text.toLowerCase() + ")" : "") + ".");
      else if (fields.org.value) lines.push("I'm writing for a " + fields.org.options[fields.org.selectedIndex].text.toLowerCase() + ".");
      if (fields.message.value.trim()) lines.push(fields.message.value.trim());
      var text = lines.join("\n");
      if (waPreview) waPreview.textContent = text;
      if (waLink) waLink.href = "https://wa.me/" + waNumber + "?text=" + encodeURIComponent(text);
    }
    ["input", "change"].forEach(function (ev) { form.addEventListener(ev, compose); });
    compose();

    function setError(name, msg) {
      var f = form.querySelector('[data-field="' + name + '"]');
      var err = f.querySelector(".error");
      f.classList.toggle("has-error", !!msg);
      err.textContent = msg || "";
      err.hidden = !msg;
      fields[name].setAttribute("aria-invalid", msg ? "true" : "false");
    }
    function validate() {
      var ok = true, first = null;
      var name = fields.name.value.trim(), email = fields.email.value.trim(), msg = fields.message.value.trim();
      var errs = {
        name: name.length < 2 ? "Enter your name so I know who to reply to." : "",
        email: !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? "Enter an email address like name@clinic.ma." : "",
        org: !fields.org.value ? "Choose the option closest to your organisation." : "",
        message: msg.length < 20 ? "Tell me a little more, at least a couple of sentences." : ""
      };
      Object.keys(errs).forEach(function (k) { setError(k, errs[k]); if (errs[k]) { ok = false; if (!first) first = fields[k]; } });
      if (first) first.focus();
      return ok;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.elements.company && form.elements.company.value) return; /* honeypot */
      if (!validate()) return;
      var done = document.getElementById("form-done");
      form.hidden = true;
      done.hidden = false;
      done.querySelector("h3").focus();
      if (window.gsap) gsap.from(done, { y: 20, opacity: 0, duration: 0.8 });
    });
    document.getElementById("form-again").addEventListener("click", function () {
      document.getElementById("form-done").hidden = true;
      form.hidden = false;
      form.reset(); compose();
      fields.name.focus();
    });
  }

  /* ================= 3D: floating product screens (home) ================= */
  function createScene() {
    var canvas = document.getElementById("scene");
    if (!window.THREE || !canvas) { if (canvas) canvas.remove(); return null; }
    var renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" }); }
    catch (e) { canvas.remove(); return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 12);
    scene.add(new THREE.AmbientLight(0xfff1e6, 0.55));
    scene.add(new THREE.HemisphereLight(0xfff4ea, 0xd9a58a, 0.55));
    var key = new THREE.DirectionalLight(0xffd2b0, 1.05); key.position.set(5, 6, 8); scene.add(key);
    var rim = new THREE.DirectionalLight(0x6f80ff, 0.38); rim.position.set(-7, -3, 3); scene.add(rim);

    var halfH = 1, halfW = 1;
    var mobile = window.innerWidth < 761;
    var unit = mobile ? 0.6 : 1;

    function roundedShape(w, h, r) {
      var s = new THREE.Shape(), x = -w / 2, y = -h / 2;
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
      return s;
    }
    function rr(ctx, x, y, w, h, r, fill) {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
    }
    function screenTexture(kind, w, h) {
      var cw = 640, ch = Math.round(640 * h / w);
      var c = document.createElement("canvas"); c.width = cw; c.height = ch;
      var x = c.getContext("2d");
      rr(x, 0, 0, cw, ch, 34, "#FFFCF7");
      x.save(); x.beginPath(); x.moveTo(34, 0); x.arcTo(cw, 0, cw, ch, 34); x.arcTo(cw, ch, 0, ch, 34); x.arcTo(0, ch, 0, 0, 34); x.arcTo(0, 0, cw, 0, 34); x.clip();
      x.fillStyle = "#F3E8DC"; x.fillRect(0, 0, cw, 58);
      rr(x, 28, 21, 46, 16, 8, "#FFB48A"); rr(x, 88, 21, 90, 16, 8, "#DCC8B5"); rr(x, 190, 21, 70, 16, 8, "#E6D6C6");
      var top = 84, pad = 30, iw = cw - pad * 2, ih = ch - top - pad;
      var warm = ["#FFB48A", "#AEB7F4", "#E8D5C2", "#F6EEE5"];
      var i, r, b;
      if (kind === "agenda") {
        for (i = 0; i < 6; i++) rr(x, pad, top + i * (ih / 6) + 6, 40, 10, 5, "#E3D2C1");
        var cols = 4, gw = (iw - 60) / cols;
        for (var cI = 0; cI < cols; cI++) for (r = 0; r < 6; r++) {
          var pick = (cI * 7 + r * 3) % 9; var col = pick < 2 ? warm[0] : pick < 3 ? warm[1] : pick < 4 ? warm[2] : warm[3];
          rr(x, pad + 60 + cI * gw, top + r * (ih / 6), gw - 10, ih / 6 - 10, 10, col);
        }
      } else if (kind === "patient") {
        x.fillStyle = "#EADBCB"; x.beginPath(); x.arc(pad + 60, top + 60, 56, 0, Math.PI * 2); x.fill();
        rr(x, pad + 140, top + 20, iw * 0.5, 16, 8, "#D9C2AC"); rr(x, pad + 140, top + 52, iw * 0.34, 12, 6, "#EADBCB"); rr(x, pad + 140, top + 78, iw * 0.42, 12, 6, "#EADBCB");
        var tw = (iw - 7 * 10) / 8;
        for (var t = 0; t < 8; t++) rr(x, pad + t * (tw + 10), top + 150, tw, tw * 1.2, 10, t === 2 || t === 5 ? "#FFB48A" : t === 6 ? "#AEB7F4" : "#F2E7DB");
      } else if (kind === "chart") {
        var bars = [0.35, 0.5, 0.42, 0.66, 0.58, 0.82, 0.74], bw = iw / bars.length;
        for (b = 0; b < bars.length; b++) { var bh = ih * bars[b]; rr(x, pad + b * bw + 6, top + ih - bh, bw - 12, bh, 10, b === 5 ? "#3D52D5" : "#FFB48A"); }
      } else if (kind === "invoice") {
        for (var l = 0; l < 4; l++) { rr(x, pad, top + l * 44, iw * (0.4 + (l % 2) * 0.16), 13, 6, "#EADBCB"); rr(x, pad + iw * 0.8, top + l * 44, iw * 0.2, 13, 6, "#E3D2C1"); }
        rr(x, pad + iw * 0.52, top + ih - 26, iw * 0.48, 22, 11, "#2B1D1A");
      } else if (kind === "ai") {
        rr(x, pad, top, iw * 0.62, 50, 22, "#F2E7DB"); rr(x, pad + iw * 0.3, top + 70, iw * 0.7, 50, 22, "#AEB7F4");
        rr(x, pad, top + 140, iw * 0.5, 50, 22, "#F2E7DB");
        for (var d = 0; d < 3; d++) { x.fillStyle = "#FFB48A"; x.beginPath(); x.arc(pad + 26 + d * 22, top + 165, 7, 0, Math.PI * 2); x.fill(); }
      } else {
        var cw7 = iw / 7, rh = ih / 5;
        for (var row = 0; row < 5; row++) for (var dd = 0; dd < 7; dd++) {
          var n = row * 7 + dd; rr(x, pad + dd * cw7 + 4, top + row * rh + 4, cw7 - 8, rh - 8, 8, n === 11 || n === 19 ? "#FFB48A" : n === 23 ? "#AEB7F4" : "#F6EEE5");
        }
      }
      x.restore();
      var tex = new THREE.CanvasTexture(c);
      tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return tex;
    }
    function capsule(r, len) {
      var pts = [], seg = 14, i, a;
      for (i = 0; i <= seg; i++) { a = -Math.PI / 2 + (i / seg) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r - len / 2)); }
      for (i = 0; i <= seg; i++) { a = (i / seg) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r + len / 2)); }
      return new THREE.LatheGeometry(pts, 36);
    }

    var slabMat = new THREE.MeshPhysicalMaterial({ color: 0xfbf4ec, roughness: 0.36, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.16 });
    var specs = mobile ? [
      { k: "agenda", w: 2.7, h: 1.75, nx: -0.55, ny: 0.62, z: -1.2, rx: -0.12, ry: 0.38, rz: -0.05 },
      { k: "patient", w: 1.7, h: 2.2, nx: 0.62, ny: 0.38, z: -0.8, rx: 0.1, ry: -0.42, rz: 0.05 },
      { k: "ai", w: 1.9, h: 1.45, nx: 0.35, ny: 0.86, z: -2.6, rx: 0.25, ry: 0.08, rz: 0.0 },
      { k: "chart", w: 2.2, h: 1.5, nx: -0.4, ny: 0.18, z: -3.4, rx: 0.18, ry: 0.3, rz: 0.04 }
    ] : [
      { k: "agenda", w: 2.7, h: 1.75, nx: -0.78, ny: 0.5, z: -1.0, rx: -0.12, ry: 0.38, rz: -0.05 },
      { k: "patient", w: 1.7, h: 2.2, nx: 0.8, ny: 0.42, z: -0.4, rx: 0.1, ry: -0.42, rz: 0.05 },
      { k: "chart", w: 2.2, h: 1.5, nx: -0.6, ny: -0.12, z: -2.2, rx: 0.18, ry: 0.3, rz: 0.04 },
      { k: "invoice", w: 1.5, h: 1.95, nx: 0.6, ny: -0.1, z: -2.0, rx: -0.1, ry: -0.32, rz: -0.05 },
      { k: "ai", w: 1.9, h: 1.45, nx: 0.12, ny: 0.86, z: -2.8, rx: 0.25, ry: 0.08, rz: 0.0 },
      { k: "calendar", w: 1.7, h: 1.5, nx: -0.2, ny: 0.3, z: -4.2, rx: -0.2, ry: -0.15, rz: 0.03 }
    ];
    var items = [];
    specs.forEach(function (s, i) {
      var w = s.w * unit, h = s.h * unit;
      var g = new THREE.Group();
      var geo = new THREE.ExtrudeGeometry(roundedShape(w, h, 0.2 * unit), { depth: 0.1 * unit, bevelEnabled: true, bevelThickness: 0.06 * unit, bevelSize: 0.06 * unit, bevelSegments: 6, curveSegments: 10 });
      geo.translate(0, 0, -0.05 * unit);
      g.add(new THREE.Mesh(geo, slabMat));
      var plane = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.16 * unit, h - 0.16 * unit), new THREE.MeshBasicMaterial({ map: screenTexture(s.k, w, h), transparent: true }));
      plane.position.z = 0.112 * unit;
      g.add(plane);
      scene.add(g);
      items.push({ g: g, s: s, ph: i * 1.7 });
    });
    var pillBlue = new THREE.Mesh(capsule(0.17 * unit, 0.42 * unit), new THREE.MeshPhysicalMaterial({ color: 0x3d52d5, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12 }));
    var pillWarm = new THREE.Mesh(capsule(0.15 * unit, 0.34 * unit), new THREE.MeshPhysicalMaterial({ color: 0xffb48a, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.14 }));
    scene.add(pillBlue, pillWarm);
    items.push({ g: pillBlue, s: { nx: mobile ? 0.8 : 0.95, ny: mobile ? 0.05 : -0.42, z: 1.2, rx: 0.4, ry: 0, rz: 0.9 }, ph: 3.1 });
    items.push({ g: pillWarm, s: { nx: mobile ? -0.82 : -0.96, ny: mobile ? 0.9 : 0.12, z: 0.9, rx: -0.3, ry: 0, rz: -0.6 }, ph: 5.3 });

    var state = { p1: 0, p2: 0, p3: 0 };
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    var visible = true;
    function mix(a, b, t) { return a + (b - a) * t; }
    function size(w, h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      halfH = Math.tan(THREE.MathUtils.degToRad(17.5)) * 12; halfW = halfH * camera.aspect;
    }
    function render(time) {
      var t = (time || 0) * 0.001;
      mouse.x += (mouse.tx - mouse.x) * 0.06; mouse.y += (mouse.ty - mouse.y) * 0.06;
      var part = Math.min(1, state.p1 * 0.45 + state.p2 * 0.75);
      var exit = state.p3;
      items.forEach(function (it) {
        var s = it.s, depth = 1 + (s.z + 4) * 0.25;
        var ax = s.nx * halfW * 0.86, ay = s.ny * halfH * 0.86;
        var bx = ax * 1.55, by = ay * 1.2 + halfH * 0.12;
        it.g.position.set(
          mix(ax, bx, part) + mouse.x * depth * 0.22,
          mix(ay, by, part) + exit * halfH * 2.8 * depth + Math.sin(t * 0.6 + it.ph) * 0.08 + mouse.y * depth * 0.16,
          mix(s.z, s.z - 1.6, part));
        it.g.rotation.set(s.rx + Math.sin(t * 0.4 + it.ph) * 0.05 + part * 0.25, s.ry + mouse.x * 0.12 + part * 0.35, s.rz + Math.cos(t * 0.3 + it.ph) * 0.03);
      });
      renderer.render(scene, camera);
    }
    size(window.innerWidth, window.innerHeight);
    render(0); /* first frame compiles shaders and uploads textures during the loader */

    return {
      canvas: canvas, state: state,
      start: function () {
        window.addEventListener("resize", function () { size(window.innerWidth, window.innerHeight); });
        window.addEventListener("pointermove", function (e) {
          mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
          mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
        });
        gsap.ticker.add(function (time) {
          var nowVisible = state.p3 < 0.98;
          if (nowVisible !== visible) { visible = nowVisible; canvas.style.visibility = visible ? "visible" : "hidden"; }
          if (visible) render(time * 1000);
        });
      },
      renderStatic: function () {
        var hero = document.getElementById("hero");
        var s2 = function () { size(hero.clientWidth, hero.clientHeight); render(0); };
        s2(); window.addEventListener("resize", s2);
      }
    };
  }

  /* ================= PAGES ================= */
  var Pages = {};

  Pages.home = function () {
    var scene = createScene();
    if (scene) Loader.track(3, Promise.resolve());
    if (reduce) { if (scene) scene.renderStatic(); return function () {}; }
    html.classList.add("sky");

    var word = document.querySelector(".hero-word");
    var chars = SplitText.create(word, { type: "chars", mask: "chars" }).chars;
    gsap.set(chars, { yPercent: 115 });
    gsap.set(word, { "--wdth": 75 });
    var heroLater = gsap.utils.toArray(".hero-meta p, .hero-foot > *");
    gsap.set(heroLater, { y: 18, opacity: 0 });
    gsap.set("#sun", { yPercent: 40, opacity: 0 });
    if (scene) gsap.set(scene.canvas, { opacity: 0 });

    var mm = gsap.matchMedia();
    mm.add({ desk: "(min-width: 761px)", mob: "(max-width: 760px)" }, function (ctx) {
      var desk = ctx.conditions.desk;
      gsap.to(".hero-word-wrap", { yPercent: -14, scale: 0.92, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: 0.8 } });
      gsap.to(".hero-meta", { opacity: 0, y: -30, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "45% top", scrub: 0.8 } });
      gsap.timeline({ scrollTrigger: { trigger: "#hero", start: "top top", endTrigger: "#dusk", end: "center center", scrub: 0.8 } })
        .to("#sun", { yPercent: 62, scale: 0.86, ease: "none", duration: 1 }, 0)
        .to("#sun", { opacity: 0, ease: "none", duration: 0.35 }, 0.65);
      if (scene) {
        var st = scene.state;
        ScrollTrigger.create({ trigger: "#hero", start: "top top", end: "bottom top", scrub: 0.8, onUpdate: function (s) { st.p1 = s.progress; } });
        ScrollTrigger.create({ trigger: "#manifesto", start: "top bottom", end: "bottom bottom", scrub: 0.8, onUpdate: function (s) { st.p2 = s.progress; } });
        ScrollTrigger.create({ trigger: "#dusk", start: "top bottom", end: "center center", scrub: 0.8, onUpdate: function (s) { st.p3 = s.progress; } });
        gsap.to("#scene-wrap", { opacity: 0.3, ease: "none", scrollTrigger: { trigger: "#manifesto", start: "top bottom", end: "top top", scrub: 0.8 } });
      }
      var words = SplitText.create("#manifesto .statement", { type: "words" }).words;
      gsap.fromTo(words, { opacity: 0.14 }, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: "#manifesto", start: "top top", end: "bottom bottom", scrub: 0.8 } });

      var duskLines = SplitText.create(".dusk-title", { type: "lines", mask: "lines" }).lines;
      gsap.timeline({ scrollTrigger: { trigger: "#dusk", start: "top bottom", end: "bottom top", scrub: 0.8 } })
        .to("#sky", { backgroundColor: C.sunset, ease: "none", duration: 0.28 }, 0)
        .to("#sky", { backgroundColor: C.night, ease: "none", duration: 0.32 }, 0.28)
        .from(duskLines, { yPercent: 110, stagger: 0.06, duration: 0.3 }, 0.14)
        .to(".dusk-title", { color: C.moon, ease: "none", duration: 0.25 }, 0.32)
        .to(".dusk-sub", { color: C.moonSoft, ease: "none", duration: 0.25 }, 0.32)
        .from(".dusk-sub", { opacity: 0, y: 20, duration: 0.2 }, 0.3);

      var tiles = gsap.utils.toArray(".tile");
      var inners = gsap.utils.toArray(".tile .screen-inner");
      var closed = "inset(100% 0% 0% 0% round 20px)", open = "inset(0% 0% 0% 0% round 20px)";
      if (desk) {
        gsap.timeline({ scrollTrigger: { trigger: "#build", start: "top top", end: "bottom bottom", scrub: 0.8 } })
          .from(".build-copy > *", { opacity: 0, y: 34, stagger: 0.07, duration: 0.5 }, 0)
          .fromTo(tiles, { clipPath: closed }, { clipPath: open, stagger: 0.32, duration: 0.8 }, 0.15)
          .fromTo(inners, { scale: 1.22 }, { scale: 1, stagger: 0.32, duration: 0.9 }, 0.15)
          .to({}, { duration: 0.4 });
      } else {
        gsap.from(".build-copy > *", { opacity: 0, y: 26, stagger: 0.08, duration: 0.9, scrollTrigger: { trigger: ".build-copy", start: "top 80%" } });
        tiles.forEach(function (tile, i) {
          gsap.timeline({ scrollTrigger: { trigger: tile, start: "top 92%", end: "top 50%", scrub: 0.8 } })
            .fromTo(tile, { clipPath: closed }, { clipPath: open, ease: "none" }, 0)
            .fromTo(inners[i], { scale: 1.22 }, { scale: 1, ease: "none" }, 0);
        });
      }
    });

    return function intro() {
      if (scene) scene.start();
      gsap.timeline()
        .to(word, { "--wdth": 100, duration: 1.9 }, 0)
        .to(chars, { yPercent: 0, duration: 1.35, stagger: 0.045 }, 0)
        .to("#sun", { yPercent: 0, opacity: 1, duration: 2.2 }, 0)
        .to(scene ? scene.canvas : [], { opacity: 1, duration: 1.8 }, 0.3)
        .to(heroLater, { y: 0, opacity: 1, duration: 1, stagger: 0.07 }, 0.6);
    };
  };

  Pages.work = function () {
    var title = linesUp(".work-hero .display");
    var later = gsap.utils.toArray(".work-hero-row > *");
    gsap.set(later, { y: 20, opacity: 0 });

    var links = gsap.utils.toArray(".rail a");
    gsap.utils.toArray(".project").forEach(function (p) {
      ScrollTrigger.create({
        trigger: p, start: "top 45%", end: "bottom 45%",
        onToggle: function (s) {
          if (!s.isActive) return;
          links.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + p.id); });
        }
      });
      gsap.from(p.querySelectorAll(".project-head > *"), { y: 30, opacity: 0, duration: 1, stagger: 0.07, scrollTrigger: { trigger: p, start: "top 80%", once: true } });
    });
    gsap.to(".rail-progress span", { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".projects", start: "top 45%", end: "bottom 45%", scrub: 0.6 } });
    revealMedia(".media figure");
    return function intro() {
      title();
      gsap.to(later, { y: 0, opacity: 1, duration: 1, stagger: 0.08, delay: 0.35 });
    };
  };

  Pages.case = function () {
    var word = document.querySelector(".case-word");
    var chars = SplitText.create(word, { type: "chars", mask: "chars" }).chars;
    gsap.set(chars, { yPercent: 115 });
    var later = gsap.utils.toArray(".case-hero .back-link, .case-intro > *");
    gsap.set(later, { y: 22, opacity: 0 });
    var shot = document.querySelector(".case-shot");
    gsap.set(shot, { clipPath: "inset(30% 8% 0% 8% round 26px)" });
    gsap.set(shot.querySelector(".screen-inner"), { scale: 1.2 });

    wordsLight(".problem .statement", ".problem", "top 70%", "bottom 55%");

    /* product tour: the screen follows the step you are reading */
    var screens = gsap.utils.toArray(".tour-frame .screen");
    if (window.matchMedia("(min-width: 901px)").matches) gsap.utils.toArray(".tour-step").forEach(function (step, i) {
      ScrollTrigger.create({
        trigger: step, start: "top 55%", end: "bottom 55%",
        onToggle: function (s) {
          if (!s.isActive) return;
          screens.forEach(function (sc, j) {
            gsap.to(sc, { opacity: j === i ? 1 : 0, scale: j === i ? 1 : 0.97, duration: 0.7, overwrite: true });
          });
          gsap.utils.toArray(".tour-step").forEach(function (o, j) { gsap.to(o, { opacity: j === i ? 1 : 0.35, duration: 0.5, overwrite: true }); });
        }
      });
    });
    fadeUpOnEnter(".steps", 0.09);

    /* architecture: the wires draw as you scroll, each layer arrives in order */
    var wires = gsap.utils.toArray(".diagram .wire");
    var nodes = gsap.utils.toArray(".diagram .node");
    var tl = gsap.timeline({ scrollTrigger: { trigger: ".arch", start: "top 70%", end: "bottom 60%", scrub: 0.8 } });
    nodes.forEach(function (n, i) { tl.from(n, { opacity: 0, y: 16, duration: 0.4 }, i * 0.35); });
    if (window.DrawSVGPlugin) wires.forEach(function (w, i) { tl.from(w, { drawSVG: "0%", duration: 0.5, ease: "none" }, 0.2 + i * 0.35); });
    fadeUpOnEnter(".arch-list", 0.1);

    var next = document.querySelector(".next-project .display");
    if (next) { var play = linesUp(next); ScrollTrigger.create({ trigger: next, start: "top 85%", once: true, onEnter: function () { play(); } }); }

    return function intro() {
      gsap.to(chars, { yPercent: 0, duration: 1.3, stagger: 0.05 });
      gsap.to(later, { y: 0, opacity: 1, duration: 1, stagger: 0.07, delay: 0.4 });
      gsap.to(shot, { clipPath: "inset(0% 0% 0% 0% round 26px)", duration: 1.6, delay: 0.5 });
      gsap.to(shot.querySelector(".screen-inner"), { scale: 1, duration: 1.8, delay: 0.5 });
    };
  };

  Pages.about = function () {
    /* Sunrise. One timeline scrubbed over the dawn section, in progress units 0 to 1:
       0 to .2 the copy leaves and the sky warms; .12 to .78 four halos rise through the camera;
       .7 to .9 the sun settles on the horizon; the last screen is covered by the chapters. */
    var halos = gsap.utils.toArray(".halo");
    var title = linesUp(".dawn .display");
    var lead = document.querySelector(".dawn .lead");
    gsap.set(lead, { y: 20, opacity: 0 });
    gsap.set(".dawn-glow", { scaleY: 0.6, opacity: 0 });

    var dawn = document.querySelector(".dawn");
    /* the chapters cover the last 100vh, so the scene plays over the section height minus two screens */
    var tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: {
      trigger: dawn, start: "top top", end: function () { return "+=" + (dawn.offsetHeight - 2 * window.innerHeight); },
      scrub: 0.6, invalidateOnRefresh: true } });
    tl.to(".dawn-copy", { yPercent: -28, opacity: 0, duration: 0.2 }, 0)
      .to(".dawn-glow", { scaleY: 2.4, duration: 0.22 }, 0)
      .to(".dawn-sky", { opacity: 1, duration: 0.2 }, 0.04);
    halos.forEach(function (h, i) {
      var at = 0.12 + i * 0.12;
      tl.fromTo(h, { scale: 0.08, opacity: 0 }, { scale: 1.9, duration: 0.42, ease: "power1.in" }, at)
        .to(h, { opacity: 1, duration: 0.08 }, at)
        .to(h, { opacity: 0, duration: 0.14 }, at + 0.28);
    });
    tl.to(".dawn-sky", { backgroundColor: "#FFFBF6", duration: 0.2 }, 0.66)
      .to(".dawn-glow", { opacity: 0.55, duration: 0.2 }, 0.66)
      .to(".sun-horizon", { scaleX: 1, duration: 0.12, ease: "power2.out" }, 0.7)
      .to(".sun-disc", { yPercent: 0, y: 0, duration: 0.18, ease: "power2.out" }, 0.74)
      .to(".sun-reflection", { scaleX: 1, duration: 0.12, ease: "power2.out" }, 0.8)
      .to({}, { duration: 0.1 }, 0.9);

    gsap.utils.toArray(".chapter").forEach(function (ch) {
      var words = SplitText.create(ch.querySelector(".statement"), { type: "words" }).words;
      gsap.fromTo(words, { opacity: 0.14 }, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: ch, start: "top 20%", end: "bottom bottom", scrub: 0.8 } });
      gsap.from(ch.querySelector(".chapter-label"), { y: 24, opacity: 0, duration: 1, scrollTrigger: { trigger: ch, start: "top 60%", once: true } });
    });
    fadeUpOnEnter(".timeline", 0.08);
    fadeUpOnEnter(".stack-groups", 0.08);
    fadeUpOnEnter(".now-list", 0.1);


    return function intro() {
      gsap.to(".dawn-glow", { scaleY: 1, opacity: 1, duration: 2, ease: "power2.out" });
      title(0.3);
      gsap.to(lead, { y: 0, opacity: 1, duration: 1, delay: 0.8 });
    };
  };

  Pages.contact = function () {
    initForms();
    var title = linesUp(".contact-hero .display");
    var lead = gsap.utils.toArray(".contact-hero .lead");
    var cards = gsap.utils.toArray(".contact-layout > *");
    gsap.set(lead, { y: 20, opacity: 0 });
    gsap.set(cards, { y: 40, opacity: 0 });
    return function intro() {
      title();
      gsap.to(lead, { y: 0, opacity: 1, duration: 1, delay: 0.35 });
      gsap.to(cards, { y: 0, opacity: 1, duration: 1.1, stagger: 0.1, delay: 0.45 });
    };
  };

  /* ================= BOOT ================= */
  var intro = function () {};
  var start = function () {
    fit();
    if (!reduce) {
      intro = (Pages[page] || function () { return function () {}; })() || function () {};
      initTone();
      initCursor();
      footerWord();
    } else {
      if (page === "contact") initForms();
      if (page === "home") Pages.home();
      initTone();
    }
    onReady(function () { intro(); });
    Loader.run();
    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { fit(); ScrollTrigger.refresh(); }, 180); });
  };
  if (document.fonts) document.fonts.ready.then(start); else start();
})();
