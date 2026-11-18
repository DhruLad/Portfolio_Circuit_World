/* demos.js: the mini-games shown inside project panels, registered by name.
   Each demo is function(el, project) and returns a function that stops it.
   A project whose `demo` name is not registered here simply shows no demo.

   Available: dispatch, debounce, trip, pid, rfid, steer, turns, crossover, plant,
   waveforms, zplane, anchor, transfer, blur, walkforward. */
(function () {
  var CW = (window.CW = window.CW || {});
  var reduced = false;
  try { reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { /* default */ }

  var C = { bg: "#04140E", grid: "#0E3A29", green: "#5CFF9D", gold: "#FFD166", blue: "#7FD4FF", red: "#FF5A5A", ink: "#F2F2F2", dim: "#9DBFB0", purple: "#B58CFF" };
  var MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

  function h(tag, attrs, text) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }

  /* A crisp canvas of logical size w x h plus an animation loop that stops cleanly. */
  function stage(el, w, hgt, drawFn) {
    var c = h("canvas", { "class": "demo-canvas", role: "img" });
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    c.width = w * dpr; c.height = hgt * dpr; c.style.aspectRatio = w + " / " + hgt;
    el.appendChild(c);
    var g = c.getContext("2d"), raf = 0, t0 = 0, last = 0, alive = true;
    function tick(now) {
      if (!alive) return;
      if (!t0) { t0 = now; last = now; }
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawFn(g, (now - t0) / 1000, dt);
      if (!reduced) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return {
      canvas: c,
      redraw: function () { if (reduced && alive) requestAnimationFrame(tick); },
      stop: function () { alive = false; cancelAnimationFrame(raf); }
    };
  }

  function title(el, text) { el.appendChild(h("p", { "class": "demo-title" }, text)); }
  function note(el, text) { el.appendChild(h("p", { "class": "demo-note" }, text)); }
  function readout(el, text) { var p = h("p", { "class": "demo-readout", "aria-live": "polite" }, text || ""); el.appendChild(p); return p; }
  function row(el) { var r = h("div", { "class": "demo-row" }); el.appendChild(r); return r; }
  function btn(parent, label, fn) { var b = h("button", { type: "button", "class": "demo-btn" }, label); b.addEventListener("click", fn); parent.appendChild(b); return b; }
  function choice(el, labels, onPick, startIndex) {
    var r = h("div", { "class": "demo-row", role: "group" }), btns = [];
    labels.forEach(function (l, i) {
      var b = h("button", { type: "button", "class": "demo-btn", "aria-pressed": i === startIndex ? "true" : "false" }, l);
      b.addEventListener("click", function () {
        btns.forEach(function (o) { o.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true"); onPick(i);
      });
      btns.push(b); r.appendChild(b);
    });
    el.appendChild(r);
    r.select = function (i) { btns.forEach(function (o, j) { o.setAttribute("aria-pressed", i === j ? "true" : "false"); }); };
    return r;
  }
  function slider(el, label, min, max, step, value, onInput) {
    var wrap = h("label", { "class": "demo-slider" }), txt = h("span", null, "");
    var s = h("input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(value), "aria-label": label });
    s.addEventListener("input", function () { onInput(+s.value, txt); });
    wrap.appendChild(txt); wrap.appendChild(s); el.appendChild(wrap);
    onInput(+s.value, txt);
    return s;
  }
  function stats(el) { var d = h("div", { "class": "demo-stats" }); el.appendChild(d); return d; }
  function setStats(d, items) {
    d.textContent = "";
    items.forEach(function (it) {
      var b = h("span", { "class": "stat" + (it.cls ? " " + it.cls : "") });
      b.appendChild(h("b", null, it.v)); b.appendChild(h("span", null, it.k));
      d.appendChild(b);
    });
  }
  function goal(el) { var p = h("p", { "class": "goal" }); el.appendChild(p); return p; }
  function setGoal(p, ok, text) { p.className = "goal " + (ok ? "ok" : "no"); p.textContent = (ok ? "✓ " : "○ ") + text; }
  function txt(g, s, x, y, color, size, align, weight) {
    g.fillStyle = color || C.dim; g.font = (weight || 600) + " " + (size || 11) + "px " + MONO;
    g.textAlign = align || "left"; g.textBaseline = "middle"; g.fillText(s, x, y);
  }
  function bgGrid(g, W, H, step) {
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    g.strokeStyle = C.grid; g.lineWidth = 1;
    for (var x = 0; x <= W; x += step) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, H); g.stroke(); }
    for (var y = 0; y <= H; y += step) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); g.stroke(); }
  }
  function rand(seed) { var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  var demos = {};

  /* ===================== GPU Foundry: be the kernel dispatcher ===================== */
  demos.dispatch = function (el) {
    title(el, "Play: you're the dispatcher. Send each batch to the right kernel");
    var K = ["Shared-memory (small)", "64×64 register tiles (large)", "Split-K (long inner dim)"];
    var R = [
      { n: "10,000 ×", m: 8, k: 8, q: 8, a: 0, why: "Tiny matrices fit whole in shared memory, and one batched launch replaces 10,000 separate ones." },
      { n: "40 ×", m: 500, k: 500, q: 400, a: 1, why: "Big outputs have plenty of tiles to fill the GPU, and register blocking reuses every loaded value many times." },
      { n: "200 ×", m: 32, k: 4096, q: 32, a: 2, why: "A 32×32 output is only a few tiles, so the GPU sits idle. Splitting the long inner dimension across blocks keeps it busy; warp shuffles add the partial sums." },
      { n: "3,000 ×", m: 16, k: 24, q: 16, a: 0, why: "Still tiny: shared memory, batched." },
      { n: "60 ×", m: 256, k: 256, q: 256, a: 1, why: "Square and large: register-blocked tiling." },
      { n: "120 ×", m: 16, k: 2048, q: 16, a: 2, why: "Small output, long inner dimension: split-K." }
    ];
    var i = 0, score = 0, done = false, flash = 0, flashOk = false, raceT = 0;
    function L(v) { return 10 + 64 * Math.log(v) / Math.log(4096); }
    var st = stage(el, 480, 190, function (g, t, dt) {
      bgGrid(g, 480, 190, 24);
      if (!done) {
        var r = R[i], hA = L(r.m), wA = L(r.k), hB = L(r.k), wB = L(r.q), y0 = 100;
        txt(g, "Batch " + (i + 1) + " of " + R.length + ":  " + r.n + " (" + r.m + "×" + r.k + " · " + r.k + "×" + r.q + ")", 16, 18, C.ink, 12, "left", 700);
        var x = 40;
        g.fillStyle = "rgba(127,212,255,0.25)"; g.strokeStyle = C.blue; g.lineWidth = 2;
        g.fillRect(x, y0 - hA / 2, wA, hA); g.strokeRect(x, y0 - hA / 2, wA, hA);
        txt(g, "A", x + wA / 2, y0 + hA / 2 + 12, C.blue, 11, "center");
        x += wA + 18; txt(g, "·", x - 9, y0, C.ink, 18, "center", 700);
        g.fillStyle = "rgba(255,209,102,0.25)"; g.strokeStyle = C.gold;
        g.fillRect(x, y0 - hB / 2, wB, hB); g.strokeRect(x, y0 - hB / 2, wB, hB);
        txt(g, "B", x + wB / 2, y0 + hB / 2 + 12, C.gold, 11, "center");
        x += wB + 22; txt(g, "=", x - 11, y0, C.ink, 16, "center", 700);
        g.fillStyle = "rgba(92,255,157,0.25)"; g.strokeStyle = C.green;
        g.fillRect(x, y0 - hA / 2, wB, hA); g.strokeRect(x, y0 - hA / 2, wB, hA);
        txt(g, "C", x + wB / 2, y0 + hA / 2 + 12, C.green, 11, "center");
        txt(g, "Score " + score + "/" + i, 464, 18, C.gold, 12, "right", 700);
        if (flash > 0) { flash -= dt; g.globalAlpha = Math.min(1, flash * 2); txt(g, flashOk ? "✓" : "✗", 440, 100, flashOk ? C.green : C.red, 40, "center", 800); g.globalAlpha = 1; }
      } else {
        raceT = Math.min(1, raceT + dt / 2.2);
        if (reduced) raceT = 1;
        txt(g, "Small-matrix workload, GPU time", 16, 20, C.ink, 12, "left", 700);
        var full = 380, a = full * Math.min(1, raceT * 1.0), b = full * (0.78 / 41.6) * Math.min(1, raceT * 1.0);
        txt(g, "10,000 launches", 16, 62, C.dim, 11);
        g.fillStyle = C.red; g.fillRect(16, 72, a, 20); txt(g, raceT >= 1 ? "41.6 ms" : "", 22 + a, 82, C.ink, 11);
        txt(g, "1 batched launch", 16, 118, C.dim, 11);
        g.fillStyle = C.green; g.fillRect(16, 128, Math.max(3, b), 20); txt(g, "0.78 ms", 26 + b, 138, C.ink, 11);
        if (raceT >= 1) txt(g, "53× faster", 464, 176, C.gold, 16, "right", 800);
      }
    });
    st.canvas.setAttribute("aria-label", "The shapes of matrix A, matrix B and their product C for the current batch");
    var buttons = row(el), out = readout(el, "Look at the shapes, then pick a kernel.");
    var kb = K.map(function (label, k) {
      return btn(buttons, label, function () {
        if (done) return;
        var r = R[i]; flashOk = k === r.a; flash = 1;
        if (flashOk) score++;
        out.textContent = (flashOk ? "Right. " : "Not quite: " + K[r.a] + ". ") + r.why;
        i++;
        if (i >= R.length) {
          done = true; raceT = 0;
          out.textContent = "You scored " + score + "/" + R.length + ". In the real engine a dispatcher makes this call for all 12,200 matrices, and batching the small ones cut GPU time from 41.6 ms to 0.78 ms.";
          kb.forEach(function (b) { b.disabled = true; });
        }
        st.redraw();
      });
    });
    var again = row(el);
    btn(again, "Play again", function () { i = 0; score = 0; done = false; kb.forEach(function (b) { b.disabled = false; }); out.textContent = "Look at the shapes, then pick a kernel."; st.redraw(); });
    note(el, "Box sizes use a log scale. The 41.6 ms and 0.78 ms timings are the project's measured results.");
    return st.stop;
  };

  /* ===================== Logic Fortress: a bouncy push-button ===================== */
  demos.debounce = function (el) {
    title(el, "Play: press KEY0 and watch the counter. Then switch on the fix");
    var fixed = false, count = 0, presses = 0, bounces = [];
    var SEG = { 0: "abcdef", 1: "bc", 2: "abdeg", 3: "abcdg", 4: "bcfg", 5: "acdfg", 6: "acdefg", 7: "abc", 8: "abcdefg", 9: "abcdfg" };
    function digit(g, d, x, y, s) {
      var on = SEG[d];
      var segs = { a: [x, y, s, 0], b: [x + s, y, 0, s], c: [x + s, y + s, 0, s], d: [x, y + 2 * s, s, 0], e: [x, y + s, 0, s], f: [x, y, 0, s], g: [x, y + s, s, 0] };
      for (var k in segs) {
        var q = segs[k];
        g.fillStyle = on.indexOf(k) >= 0 ? C.red : "#2A0E0E";
        if (q[2]) g.fillRect(q[0] + 3, q[1] - 3, q[2] - 6, 6); else g.fillRect(q[0] - 3, q[1] + 3, 6, q[3] - 6);
      }
    }
    var st = stage(el, 480, 170, function (g) {
      g.fillStyle = "#0B1F17"; g.fillRect(0, 0, 480, 170);
      g.fillStyle = "#111318"; g.fillRect(18, 20, 112, 120);
      var n = count % 100;
      digit(g, Math.floor(n / 10), 36, 36, 32); digit(g, n % 10, 84, 36, 32);
      txt(g, "HEX1  HEX0", 74, 154, C.dim, 10, "center");
      var x0 = 150, x1 = 466, span = x1 - x0;
      g.strokeStyle = C.grid; g.lineWidth = 1; g.strokeRect(x0 + 0.5, 20.5, span, 120);
      txt(g, "what the FPGA sees when you press (first 150 ms)", x0 + 6, 32, C.dim, 10);
      if (!presses) { txt(g, "press the button", x0 + span / 2, 84, C.dim, 12, "center"); return; }
      g.strokeStyle = fixed ? C.green : C.gold; g.lineWidth = 2; g.beginPath();
      for (var px = 0; px <= span; px++) {
        var rel = px / span * 0.15 - 0.03, v = rel > 0 ? 1 : 0;
        if (v && !fixed) for (var b = 0; b < bounces.length; b++) if (rel > bounces[b][0] && rel < bounces[b][1]) v = 0;
        if (v && fixed && rel < 0.02) v = 0;
        var yy = 120 - v * 66;
        if (px === 0) g.moveTo(x0 + px, yy); else g.lineTo(x0 + px, yy);
      }
      g.stroke();
      txt(g, fixed ? "debounced: one clean edge, 20 ms later" : (bounces.length + 1) + " rising edges from one press", x0 + 6, 132, fixed ? C.green : C.gold, 11, "left", 700);
    });
    st.canvas.setAttribute("aria-label", "A two-digit seven-segment counter and the button signal over the first 150 milliseconds");
    var r = row(el), out = readout(el, "");
    var press = btn(r, "Press KEY0", function () {
      presses++;
      if (fixed) { count += 1; bounces = []; }
      else {
        var nb = 1 + Math.floor(Math.random() * 4), at = 0.003; bounces = [];
        for (var b = 0; b < nb; b++) { var len = 0.003 + Math.random() * 0.006; bounces.push([at, at + len]); at += len + 0.004 + Math.random() * 0.008; }
        count += nb + 1;
      }
      show(); st.redraw();
    });
    press.classList.add("big");
    btn(r, "Reset", function () { count = 0; presses = 0; bounces = []; show(); st.redraw(); });
    choice(el, ["Raw switch input", "Debounce + 2-flop synchronizer"], function (k) { fixed = k === 1; count = 0; presses = 0; bounces = []; show(); st.redraw(); }, 0);
    function show() {
      out.textContent = presses ? "You pressed " + presses + " time" + (presses > 1 ? "s" : "") + "; the counter says " + count + "." + (count !== presses ? " Switch bounce counted extra presses." : " Every press counted exactly once.") : "A mechanical button chatters for a few milliseconds every time it's pressed.";
    }
    show();
    note(el, "Illustrative bounce pattern, randomized each press. On the real board, switch bounce and unsynchronized inputs were the only 2 hardware-only faults; after the fix, hardware matched simulation in all 6 states.");
    return st.stop;
  };

  /* ===================== PID Station: tune the loop ===================== */
  demos.pid = function (el) {
    title(el, "Play: tune the controller. Get overshoot under 5% and land within one encoder count");
    var Kp = 0.02, Ki = 0, Kd = 0, aw = true, target = 90, res = null, playT = 0;
    function sim() {
      var tau = 0.045, Km = 900, dead = 0.06, dt = 0.001, enc = 360 / 1920, T = target > 180 ? 2 : 1;
      var th = 0, w = 0, I = 0, df = 0, alpha = dt / (dt + 1 / (2 * Math.PI * 50)), mprev = 0, out = [], us = [];
      for (var k = 0; k < T / dt; k++) {
        var meas = Math.round(th / enc) * enc, e = target - meas, d = -(meas - mprev) / dt; mprev = meas;
        df += alpha * (d - df);
        var uu = Kp * e + Ki * I + Kd * df, u = Math.max(-1, Math.min(1, uu));
        if (!aw || u === uu) I += e * dt;
        var drive = Math.sign(u) * Math.max(0, Math.abs(u) - dead) / (1 - dead);
        w += (Km * drive - w) / tau * dt;
        if (drive === 0 && Math.abs(w) < 5) w = 0;
        th += w * dt;
        if (k % 4 === 0) { out.push(th); us.push(u); }
      }
      var peak = Math.max.apply(null, out), os = Math.max(0, (peak - target) / target * 100);
      var err = Math.abs(target - Math.round(out[out.length - 1] / enc) * enc), settle = 0;
      for (var j = out.length - 1; j >= 0; j--) if (Math.abs(out[j] - target) > 0.02 * target) { settle = (j + 1) * 0.004; break; }
      return { th: out, T: T, os: os, err: err, settle: settle };
    }
    var st = stage(el, 480, 200, function (g, t, dt) {
      bgGrid(g, 480, 200, 20);
      if (!res) return;
      playT = reduced ? 1 : Math.min(1, playT + dt / (res.T * 1.2));
      var L = 40, Rr = 340, T0 = 18, B0 = 180, ymax = target * 1.5;
      function X(i) { return L + i / (res.th.length - 1) * (Rr - L); }
      function Y(v) { return B0 - v / ymax * (B0 - T0); }
      g.fillStyle = "rgba(92,255,157,0.12)"; g.fillRect(L, Y(target * 1.02), Rr - L, Y(target * 0.98) - Y(target * 1.02));
      g.strokeStyle = C.gold; g.setLineDash([5, 4]); g.lineWidth = 1.5; g.beginPath(); g.moveTo(L, Y(target)); g.lineTo(Rr, Y(target)); g.stroke(); g.setLineDash([]);
      txt(g, target + "°", L - 6, Y(target), C.gold, 10, "right");
      txt(g, "0°", L - 6, Y(0), C.dim, 10, "right");
      txt(g, res.T + " s", Rr, B0 + 12, C.dim, 10, "right");
      var n = Math.max(2, Math.floor(res.th.length * playT));
      g.strokeStyle = C.green; g.lineWidth = 2.5; g.beginPath();
      for (var i = 0; i < n; i++) { if (i) g.lineTo(X(i), Y(res.th[i])); else g.moveTo(X(i), Y(res.th[i])); }
      g.stroke();
      /* dial */
      var ang = res.th[n - 1], cx = 412, cy = 100;
      g.strokeStyle = "#33343F"; g.lineWidth = 10; g.beginPath(); g.arc(cx, cy, 44, 0, 7); g.stroke();
      g.strokeStyle = C.gold; g.lineWidth = 2; var ta = -Math.PI / 2 + target * Math.PI / 180;
      g.beginPath(); g.moveTo(cx + Math.cos(ta) * 36, cy + Math.sin(ta) * 36); g.lineTo(cx + Math.cos(ta) * 52, cy + Math.sin(ta) * 52); g.stroke();
      var a = -Math.PI / 2 + ang * Math.PI / 180;
      g.strokeStyle = C.red; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40); g.stroke();
      g.fillStyle = "#C9CCD6"; g.beginPath(); g.arc(cx, cy, 5, 0, 7); g.fill();
      txt(g, "shaft", cx, cy + 60, C.dim, 10, "center");
    });
    st.canvas.setAttribute("aria-label", "Step response of the motor angle over time and a dial showing the shaft");
    var sb = stats(el), gl = goal(el);
    var presets = choice(el, ["P only, gentle", "P only, aggressive", "PID"], function (k) {
      var p = [[0.02, 0, 0], [0.08, 0, 0], [0.08, 0.4, 0.002]][k];
      sKp.value = p[0]; sKi.value = p[1]; sKd.value = p[2];
      Kp = p[0]; Ki = p[1]; Kd = p[2]; labels(); run();
    }, 0);
    var tKp, tKi, tKd;
    var sKp = slider(el, "Kp", 0, 0.15, 0.005, Kp, function (v, t) { Kp = v; tKp = t; if (sKp) { presets.select(-1); labels(); run(); } });
    var sKi = slider(el, "Ki", 0, 1, 0.05, Ki, function (v, t) { Ki = v; tKi = t; if (sKi) { presets.select(-1); labels(); run(); } });
    var sKd = slider(el, "Kd", 0, 0.008, 0.0005, Kd, function (v, t) { Kd = v; tKd = t; if (sKd) { presets.select(-1); labels(); run(); } });
    function labels() { tKp.textContent = "Kp (proportional): " + Kp.toFixed(3); tKi.textContent = "Ki (integral): " + Ki.toFixed(2); tKd.textContent = "Kd (derivative): " + Kd.toFixed(4); }
    var stepSel = choice(el, ["90° step", "360° move"], function (k) { target = k ? 360 : 90; run(); }, 0);
    var awSel = choice(el, ["Anti-windup on", "Anti-windup off"], function (k) { aw = k === 0; run(); }, 0);
    function run() {
      res = sim(); playT = 0;
      var ok = res.os < 5 && res.err <= 0.19;
      setStats(sb, [
        { k: "overshoot", v: res.os.toFixed(1) + "%", cls: res.os < 5 ? "good" : "bad" },
        { k: "final error", v: res.err.toFixed(2) + "°", cls: res.err <= 0.19 ? "good" : "bad" },
        { k: "settling (2%)", v: res.settle ? res.settle.toFixed(2) + " s" : "—" }
      ]);
      setGoal(gl, ok, ok ? "Goal met: overshoot under 5% and error within one encoder count (0.19°)." : "Goal: overshoot under 5% and final error within one encoder count (0.19°).");
      st.redraw();
    }
    labels(); run();
    note(el, "Simulated on a simple first-order model with the real 45 ms time constant, 1 kHz loop, 50 Hz derivative filter and 1,920-count encoder, plus friction. The measured hardware results are in the walkthrough.");
    return st.stop;
  };

  /* ===================== Access Gate: find an approved card ===================== */
  demos.rfid = function (el) {
    title(el, "Play: set the 10 switches to a card ID and tap it. Can you find one of the 8 approved cards?");
    var APPROVED = [37, 142, 256, 389, 512, 640, 777, 1001];
    var bits = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], unlockUntil = -1, denyUntil = -1, now = 0, tested = -1, accepted = 0, found = {};
    function id() { var v = 0; for (var i = 0; i < 10; i++) v = v * 2 + bits[i]; return v; }
    var st = stage(el, 480, 150, function (g, t) {
      now = t;
      g.fillStyle = "#0B1F17"; g.fillRect(0, 0, 480, 150);
      var open = t < unlockUntil, deny = t < denyUntil;
      /* room light */
      g.fillStyle = open ? "rgba(255,209,102,0.25)" : "rgba(0,0,0,0)"; g.fillRect(0, 0, 200, 150);
      g.fillStyle = open ? C.gold : "#4B5563"; g.beginPath(); g.arc(40, 30, 12, 0, 7); g.fill();
      txt(g, open ? "lights on" : "lights off", 40, 54, C.dim, 10, "center");
      /* door */
      g.fillStyle = "#8A8F9E"; g.fillRect(90, 14, 80, 130);
      var swing = open ? 34 : 0;
      g.fillStyle = "#6B4A2B"; g.fillRect(96, 20, 68 - swing, 124);
      g.fillStyle = C.gold; g.fillRect(150 - swing, 80, 6, 6);
      txt(g, open ? "UNLOCKED " + Math.max(0, unlockUntil - t).toFixed(1) + " s" : "LOCKED", 130, 8, open ? C.green : C.red, 10, "center", 700);
      /* reader */
      g.fillStyle = "#111318"; g.fillRect(200, 50, 30, 44);
      g.fillStyle = open ? "#2BB673" : "#1D3B2B"; g.fillRect(205, 82, 8, 6);
      g.fillStyle = deny ? C.red : "#3B1414"; g.fillRect(217, 82, 8, 6);
      /* ID */
      txt(g, "Card ID", 250, 40, C.dim, 11);
      txt(g, String(id()), 250, 66, C.ink, 26, "left", 800);
      txt(g, bits.join(""), 250, 96, C.gold, 14, "left", 700);
      if (tested >= 0) txt(g, "Tested " + tested + "/1024 · accepted " + accepted, 250, 128, tested === 1024 ? C.green : C.dim, 11, "left", 700);
    });
    st.canvas.setAttribute("aria-label", "A door, a room light and an RFID reader with green and red LEDs");
    var sw = h("div", { "class": "switches", role: "group", "aria-label": "Slide switches SW9 to SW0" });
    bits.forEach(function (b, i) {
      var s = h("button", { type: "button", "class": "switch", "aria-pressed": "false", "aria-label": "SW" + (9 - i) });
      s.appendChild(h("span", { "class": "knob" })); s.appendChild(h("small", null, "SW" + (9 - i)));
      s.addEventListener("click", function () { bits[i] ^= 1; s.setAttribute("aria-pressed", bits[i] ? "true" : "false"); st.redraw(); });
      sw.appendChild(s);
    });
    el.appendChild(sw);
    var r = row(el), out = readout(el, "1,024 possible IDs, 8 approved. Wrong cards are rejected.");
    var tap = btn(r, "Tap card", function () {
      var v = id();
      if (APPROVED.indexOf(v) >= 0) {
        unlockUntil = now + 3; found[v] = 1;
        out.textContent = "Card " + v + " accepted. Door unlocks for 3 seconds, then relocks on its own. Approved cards found: " + Object.keys(found).length + "/8.";
      } else { denyUntil = now + 1; out.textContent = "Card " + v + " rejected. Locked is the safe default."; }
      st.redraw();
    });
    tap.classList.add("big");
    btn(r, "Hint", function () {
      var left = APPROVED.filter(function (a) { return !found[a]; }), pick = left.length ? left[0] : APPROVED[0];
      out.textContent = "Try " + pick + ": that's " + pick.toString(2).padStart(10, "0") + " on the switches.";
    });
    btn(r, "Test all 1,024", function () {
      tested = 0; accepted = 0;
      var tick = function () {
        for (var k = 0; k < 32 && tested < 1024; k++, tested++) if (APPROVED.indexOf(tested) >= 0) accepted++;
        st.redraw();
        if (tested < 1024) setTimeout(tick, 16);
        else out.textContent = "Exhaustive test done: " + accepted + " approved IDs accepted, " + (1024 - accepted).toLocaleString("en-US") + " rejected, 0 errors. Same as the project's result.";
      };
      tick();
    });
    note(el, "The 8 approved IDs here are made up for the game. The project tested its own 8 the same way: all 1,024 IDs, then 10,000 scans in a row.");
    return st.stop;
  };

  /* ===================== Robot Garage: on/off vs PID steering ===================== */
  demos.steer = function (el) {
    title(el, "Play: switch the steering controller and drop obstacles on the track");
    var Rr = 62, Ls = 190, LANE = 18, P = 2 * Ls + 2 * Math.PI * Rr, CX = 240, CY = 112;
    function kap(s) { s = ((s % P) + P) % P; return (s < Ls || (s >= Ls + Math.PI * Rr && s < 2 * Ls + Math.PI * Rr)) ? 0 : 1 / Rr; }
    function center(s) {
      s = ((s % P) + P) % P;
      if (s < Ls) return [-Ls / 2 + s, -Rr, 0];
      s -= Ls; if (s < Math.PI * Rr) { var a = -Math.PI / 2 + s / Rr; return [Ls / 2 + Rr * Math.cos(a), Rr * Math.sin(a), a + Math.PI / 2]; }
      s -= Math.PI * Rr; if (s < Ls) return [Ls / 2 - s, Rr, Math.PI];
      s -= Ls; var b = Math.PI / 2 + s / Rr; return [-Ls / 2 + Rr * Math.cos(b), Rr * Math.sin(b), b + Math.PI / 2];
    }
    function toXY(s, e) { var c = center(s); return [CX + c[0] - Math.sin(c[2]) * e, CY - (c[1] + Math.cos(c[2]) * e), c[2]]; }
    var mode = 0, S = { s: 0, e: 0, psi: 0, w: 0, acc: 0, ePrev: 0, I: 0 }, v = 85, exits = 0, outside = false, crashes = 0, obs = null, laps = 0, lastLap = 0, trail = [];
    function reset() { S = { s: 0, e: 0, psi: 0, w: 0, acc: 0, ePrev: 0, I: 0 }; exits = 0; crashes = 0; obs = null; laps = 0; lastLap = 0; trail = []; outside = false; }
    var st = stage(el, 480, 230, function (g, t, dt) {
      g.fillStyle = "#1E3A2B"; g.fillRect(0, 0, 480, 230);
      /* the track */
      g.lineJoin = "round";
      [[LANE + 6, "#2F3440"], [LANE, "#3A404D"]].forEach(function (q) {
        g.strokeStyle = q[1]; g.lineWidth = q[0] * 2; g.beginPath();
        for (var k = 0; k <= 200; k++) { var p = toXY(k / 200 * P, 0); if (k) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }
        g.closePath(); g.stroke();
      });
      g.strokeStyle = "#F2F2F2"; g.lineWidth = 2;
      [-LANE, LANE].forEach(function (off) {
        g.beginPath(); for (var k = 0; k <= 200; k++) { var p = toXY(k / 200 * P, off); if (k) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); } g.closePath(); g.stroke();
      });
      g.strokeStyle = "#111318"; g.lineWidth = 3; g.beginPath(); for (var k2 = 0; k2 <= 200; k2++) { var p2 = toXY(k2 / 200 * P, 0); if (k2) g.lineTo(p2[0], p2[1]); else g.moveTo(p2[0], p2[1]); } g.closePath(); g.stroke();
      /* physics, 120 Hz substeps; the controller samples at 20 Hz like the real robot */
      var steps = reduced ? 0 : Math.round(dt * 120);
      for (var n = 0; n < steps; n++) {
        var h120 = 1 / 120, target = 0;
        if (obs) {
          var ahead = obs.s - S.s;
          if (ahead < 45 + 18 && ahead > -22) target = 11;     /* 15 cm trigger: move over to pass */
          if (ahead < -40) obs = null;
          if (obs && Math.abs(ahead) < 9 && Math.abs(S.e - obs.e) < 10) { crashes++; obs = null; }
        }
        S.acc += h120;
        if (S.acc >= 0.05) {
          S.acc -= 0.05;
          var meas = Math.max(-LANE * 1.5, Math.min(LANE * 1.5, S.e)) - target;
          if (mode === 0) S.w = meas > 1.5 ? -3 : meas < -1.5 ? 3 : 0;
          else { var de = (meas - S.ePrev) / 0.05; S.I = Math.max(-40, Math.min(40, S.I + meas * 0.05)); S.w = Math.max(-3, Math.min(3, -(0.15 * meas + 0.1 * de + 0.03 * S.I))); }
          S.ePrev = meas;
        }
        var k = kap(S.s);
        S.psi += (S.w - v * k) * h120; S.psi = Math.max(-0.9, Math.min(0.9, S.psi));
        S.e += v * Math.sin(S.psi) * h120;
        S.s += v * Math.cos(S.psi) * h120 / (1 - k * S.e);
        var out = Math.abs(S.e) > LANE; if (out && !outside) exits++; outside = out;
        if (Math.floor(S.s / P) > lastLap) { lastLap = Math.floor(S.s / P); laps++; }
        if (n % 4 === 0) { trail.push(toXY(S.s, S.e)); if (trail.length > 90) trail.shift(); }
      }
      /* trail and robot */
      g.strokeStyle = mode === 0 ? "rgba(255,209,102,0.7)" : "rgba(92,255,157,0.7)"; g.lineWidth = 2; g.beginPath();
      trail.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.stroke();
      if (obs) { var o = toXY(obs.s, obs.e); g.fillStyle = "#D94C4C"; g.fillRect(o[0] - 6, o[1] - 6, 12, 12); g.fillStyle = "#F2F2F2"; g.fillRect(o[0] - 6, o[1] - 1, 12, 2); }
      var r = toXY(S.s, S.e), hd = r[2] + S.psi;
      g.save(); g.translate(r[0], r[1]); g.rotate(-hd);
      g.fillStyle = "#111318"; g.fillRect(-8, -9, 6, 3); g.fillRect(-8, 6, 6, 3); g.fillRect(3, -9, 6, 3); g.fillRect(3, 6, 6, 3);
      g.fillStyle = "#F2F2F2"; g.fillRect(-9, -6, 18, 12); g.fillStyle = outside ? C.red : "#3B82F6"; g.fillRect(5, -3, 4, 6);
      g.restore();
      txt(g, "Laps " + laps + "   Lane exits " + exits + "   Collisions " + crashes, 12, 14, C.ink, 11, "left", 700);
      txt(g, mode === 0 ? "On/off steering: zig-zag" : "PID steering: smooth", 468, 14, mode === 0 ? C.gold : C.green, 11, "right", 700);
    });
    st.canvas.setAttribute("aria-label", "A robot driving laps on an oval track");
    choice(el, ["On/off steering", "PID steering"], function (k) { mode = k; reset(); }, 0);
    var r2 = row(el);
    btn(r2, "Drop an obstacle", function () { obs = { s: S.s + 120 + Math.random() * 80, e: -5 }; });
    btn(r2, "Reset", reset);
    if (reduced) readout(el, "Animation is paused because your device asks for reduced motion. On/off steering zig-zags out of its lane on the bends; PID steering stays inside.");
    note(el, "Simulated track and robot. The controller samples at 20 Hz and moves over when an obstacle is inside its trigger distance, like the real one. The real robot stayed in lane on 18 of 20 laps with zero collisions.");
    return st.stop;
  };

  /* ===================== Motor Works: choose the winding turns ===================== */
  demos.turns = function (el) {
    title(el, "Play: pick the turns per tooth. More turns = more torque per amp, less speed per volt");
    var N = 35, ang = 0;
    function calc() {
      var kv = 228 * 35 / N, rpm = kv * 15, kt = 60 / (2 * Math.PI * kv), amps = 0.12 / kt;
      return { kv: kv, rpm: rpm, kt: kt, amps: amps };
    }
    var st = stage(el, 480, 170, function (g, t, dt) {
      var c = calc();
      g.fillStyle = "#1F2430"; g.fillRect(0, 0, 480, 170);
      ang += (reduced ? 0 : dt) * c.rpm / 3000 * Math.PI * 2.2;
      var cx = 90, cy = 85;
      g.fillStyle = "#2D3444"; g.beginPath(); g.arc(cx, cy, 70, 0, 7); g.fill();
      g.fillStyle = "#111318"; g.beginPath(); g.arc(cx, cy, 60, 0, 7); g.fill();
      for (var i = 0; i < 12; i++) {
        var a = i * Math.PI / 6;
        g.save(); g.translate(cx + Math.cos(a) * 46, cy + Math.sin(a) * 46); g.rotate(a);
        var turns = Math.min(10, Math.round(N / 5));
        g.fillStyle = "#6B7280"; g.fillRect(-6, -5, 14, 10);
        g.fillStyle = "#C8782A"; for (var k = 0; k < turns; k++) g.fillRect(-6 + k * 1.4, -7, 1, 14);
        g.restore();
      }
      g.save(); g.translate(cx, cy); g.rotate(ang);
      g.fillStyle = "#9AA1B5"; g.beginPath(); g.arc(0, 0, 30, 0, 7); g.fill();
      for (var m = 0; m < 14; m++) { g.save(); g.rotate(m * Math.PI * 2 / 14); g.fillStyle = m % 2 ? "#3B82F6" : "#D94C4C"; g.fillRect(20, -5, 9, 10); g.restore(); }
      g.fillStyle = "#33343F"; g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fill();
      g.restore();
      txt(g, "12 slots, 14 poles", cx, 162, C.dim, 10, "center");
      /* bars */
      function bar(y, label, val, max, mark, unit, ok) {
        txt(g, label, 190, y - 12, C.dim, 11);
        g.fillStyle = "#33343F"; g.fillRect(190, y, 270, 14);
        g.fillStyle = ok ? C.green : C.red; g.fillRect(190, y, Math.min(270, 270 * val / max), 14);
        if (mark) { var mx = 190 + 270 * mark / max; g.fillStyle = C.gold; g.fillRect(mx - 1, y - 4, 2, 22); }
        txt(g, unit, 460, y - 12, C.ink, 11, "right", 700);
      }
      bar(34, "No-load speed at 15 V", c.rpm, 6000, 3000, Math.round(c.rpm) + " RPM", c.rpm >= 3000);
      bar(84, "Current to make 0.12 N·m", c.amps, 8, 5, c.amps.toFixed(2) + " A", c.amps <= 5);
      txt(g, "Kv " + Math.round(c.kv) + " RPM/V    Kt " + (c.kt * 1000).toFixed(1) + " mN·m/A", 190, 132, C.ink, 12, "left", 700);
      txt(g, "gold lines: 3,000 RPM and the 5 A limit", 190, 154, C.dim, 10);
    });
    st.canvas.setAttribute("aria-label", "The motor's rotor spinning, with bars for no-load speed and current");
    var gl = goal(el);
    slider(el, "Turns per tooth", 15, 55, 1, N, function (v, t) {
      N = v; var c = calc();
      t.textContent = "Turns per tooth: " + N + (N === 35 ? "  (Dhru's design)" : "");
      var ok = c.rpm >= 3000 && c.amps <= 5;
      setGoal(gl, ok, ok ? "Works: past 3,000 RPM at 15 V and 0.12 N·m under the 5 A limit." : (c.amps > 5 ? "Too few turns: 0.12 N·m would need more than the 5 A limit." : "Too many turns: the motor can't reach 3,000 RPM at 15 V."));
      st.redraw();
    });
    note(el, "Ideal-motor relations (Kv ∝ 1/turns, Kt = 60 / 2π·Kv), ignoring losses. The real motor at 35 turns measured Kv 215 RPM/V against 228 calculated, and drew 3.1 A at full load.");
    return st.stop;
  };

  /* ===================== Amp Stage: hear the crossover dead zone ===================== */
  demos.crossover = function (el) {
    title(el, "Play: compare Class B and Class AB. Turn the signal down and watch the gap");
    var ab = false, amp = 2.5, audio = null;
    function out(v) { return ab ? v * 0.97 : Math.sign(v) * Math.max(0, Math.abs(v) - 1.3); }
    function thd() {
      var N = 256, re = [0, 0, 0, 0, 0, 0, 0, 0], im = [0, 0, 0, 0, 0, 0, 0, 0];
      for (var n = 0; n < N; n++) { var y = out(amp * Math.sin(2 * Math.PI * n / N)); for (var k = 1; k < 8; k++) { re[k] += y * Math.cos(2 * Math.PI * k * n / N); im[k] += y * Math.sin(2 * Math.PI * k * n / N); } }
      var f = Math.hypot(re[1], im[1]), hsum = 0; for (var k2 = 2; k2 < 8; k2++) hsum += re[k2] * re[k2] + im[k2] * im[k2];
      return f > 1e-9 ? Math.sqrt(hsum) / f * 100 : 100;
    }
    var st = stage(el, 480, 190, function (g, t) {
      bgGrid(g, 480, 190, 20);
      var mid = 95, sc = 13, ph = reduced ? 0 : t * 2;
      if (!ab) { g.fillStyle = "rgba(255,90,90,0.12)"; g.fillRect(0, mid - 1.3 * sc, 480, 2.6 * sc); txt(g, "±1.3 V dead zone", 8, mid - 1.3 * sc - 8, C.red, 10); }
      g.lineWidth = 2;
      g.strokeStyle = "rgba(127,212,255,0.6)"; g.beginPath();
      for (var x = 0; x <= 480; x++) { var v = amp * Math.sin(x / 480 * Math.PI * 6 - ph); if (x) g.lineTo(x, mid - v * sc); else g.moveTo(x, mid - v * sc); } g.stroke();
      g.strokeStyle = C.green; g.lineWidth = 2.5; g.beginPath();
      for (var x2 = 0; x2 <= 480; x2++) { var v2 = out(amp * Math.sin(x2 / 480 * Math.PI * 6 - ph)); if (x2) g.lineTo(x2, mid - v2 * sc); else g.moveTo(x2, mid - v2 * sc); } g.stroke();
      txt(g, "input", 470, 14, C.blue, 10, "right"); txt(g, "output", 470, 28, C.green, 10, "right");
    });
    st.canvas.setAttribute("aria-label", "Input and output waveforms of the push-pull output stage");
    var sb = stats(el);
    choice(el, ["Class B (no bias)", "Class AB (3-diode bias)"], function (k) { ab = k === 1; show(); }, 0);
    slider(el, "Input amplitude", 0.5, 5, 0.1, amp, function (v, t) { amp = v; t.textContent = "Input amplitude: " + v.toFixed(1) + " V peak"; show(); });
    var r = row(el);
    btn(r, "▶ Listen (1 s)", function () {
      try {
        audio = audio || new (window.AudioContext || window.webkitAudioContext)();
        var o = audio.createOscillator(), ws = audio.createWaveShaper(), gn = audio.createGain(), curve = new Float32Array(1024);
        for (var i = 0; i < 1024; i++) { var x = (i / 1023 * 2 - 1) * amp; curve[i] = out(x) / 5; }
        ws.curve = curve; o.frequency.value = 220; gn.gain.value = 0.25;
        o.connect(ws); ws.connect(gn); gn.connect(audio.destination);
        o.start(); o.stop(audio.currentTime + 1);
      } catch (e) { /* no audio available */ }
    });
    function show() {
      var d = thd();
      setStats(sb, [{ k: "distortion (THD)", v: d >= 99 ? "no output" : d.toFixed(1) + "%", cls: d < 3 ? "good" : "bad" }, { k: "mode", v: ab ? "Class AB" : "Class B" }]);
      st.redraw();
    }
    show();
    note(el, "Idealized model of the output stage: the dead zone matches the measured ±1.3 V. The real Class AB stage delivered about 0.85 W RMS into 8.2 Ω, 1.7× the 500 mW spec.");
    return function () { st.stop(); try { if (audio) audio.close(); } catch (e) { /* ignore */ } };
  };

  /* ===================== Plant Station: keep the plant alive ===================== */
  demos.plant = function (el) {
    title(el, "Play: keep the plant watered. Then try it without the optocoupler");
    var iso = true, moist = 46, valveUntil = -1, resetUntil = -1, now = 0, acts = 0, resets = 0, lastPoll = 0;
    var vals = { moist: 46, temp: 22.4, hum: 41, level: 7.8, light: 610, tilt: "level" };
    var st = stage(el, 480, 200, function (g, t, dt) {
      now = t;
      g.fillStyle = "#0B1F17"; g.fillRect(0, 0, 480, 200);
      var watering = t < valveUntil, rebooting = t < resetUntil;
      moist = Math.max(0, Math.min(100, moist + (watering ? 18 : -1.6) * (reduced ? 0 : dt)));
      if (t - lastPoll >= 2 && !rebooting) {
        lastPoll = t;
        vals.moist = Math.round(moist); vals.temp = +(22 + Math.sin(t / 9) * 0.8).toFixed(1); vals.hum = Math.round(41 + Math.sin(t / 7) * 3);
        vals.level = +(7.8 + acts * 0.4).toFixed(1); vals.light = Math.round(600 + Math.sin(t / 5) * 30);
      }
      /* plant */
      var droop = moist < 25 ? (25 - moist) / 25 : 0;
      g.fillStyle = "#B5653A"; g.beginPath(); g.moveTo(40, 120); g.lineTo(110, 120); g.lineTo(102, 180); g.lineTo(48, 180); g.closePath(); g.fill();
      g.fillStyle = "rgb(" + Math.round(70 - moist * 0.3) + "," + Math.round(45 - moist * 0.15) + ",30)"; g.fillRect(42, 118, 66, 6);
      g.strokeStyle = "#2E8B3E"; g.lineWidth = 3; g.beginPath(); g.moveTo(75, 120); g.quadraticCurveTo(75 + droop * 20, 80, 75 + droop * 40, 50 + droop * 30); g.stroke();
      var leaf = droop > 0.5 ? "#8A9A3A" : "#3FAE52";
      [[0.3, -1], [0.55, 1], [0.8, -1]].forEach(function (q) {
        var px = 75 + droop * 40 * q[0], py = 120 - (70 - droop * 40) * q[0];
        g.fillStyle = leaf; g.beginPath(); g.ellipse(px + q[1] * 14, py + droop * 10, 14, 6, q[1] * (0.5 + droop), 0, 7); g.fill();
      });
      if (watering) { g.fillStyle = C.blue; for (var d = 0; d < 6; d++) g.fillRect(118 - d * 4 + (t * 40 % 4), 92 + ((t * 80 + d * 9) % 26), 2, 4); }
      g.fillStyle = "#9AA1B5"; g.fillRect(118, 70, 60, 5); g.fillRect(114, 70, 6, 22);
      g.fillStyle = watering ? C.gold : "#33343F"; g.fillRect(170, 62, 18, 20); txt(g, "valve", 179, 92, C.dim, 9, "center");
      /* moisture bar */
      txt(g, "soil moisture", 20, 16, C.dim, 10);
      g.fillStyle = "#33343F"; g.fillRect(20, 26, 110, 10);
      g.fillStyle = moist < 25 ? C.red : moist > 85 ? C.gold : C.green; g.fillRect(20, 26, 110 * moist / 100, 10);
      /* Arduino + ESP32 dashboard */
      g.fillStyle = "#174EA6"; g.fillRect(210, 20, 120, 76); g.fillStyle = "#2466CC"; g.fillRect(210, 20, 120, 3);
      txt(g, "Arduino UNO", 270, 36, C.ink, 11, "center", 700);
      if (rebooting) { g.fillStyle = (Math.floor(t * 8) % 2) ? C.red : "#3B1414"; g.fillRect(222, 50, 96, 30); txt(g, "RESET!", 270, 65, C.ink, 14, "center", 800); }
      else { g.fillStyle = "#04140E"; g.fillRect(222, 50, 96, 30); txt(g, "running", 270, 65, C.green, 12, "center", 700); }
      g.strokeStyle = iso ? C.green : C.red; g.setLineDash(iso ? [] : [4, 4]); g.lineWidth = 2; g.beginPath(); g.moveTo(188, 72); g.lineTo(210, 72); g.stroke(); g.setLineDash([]);
      txt(g, iso ? "opto" : "direct", 199, 108, iso ? C.green : C.red, 9, "center", 700);
      g.fillStyle = "#111318"; g.fillRect(346, 20, 122, 166); txt(g, "ESP32 dashboard", 407, 34, C.blue, 10, "center", 700);
      var lines = [["moisture", vals.moist + "%"], ["temp", vals.temp + " °C"], ["humidity", vals.hum + "%"], ["water lvl", vals.level + " cm"], ["light", String(vals.light)], ["tilt", vals.tilt]];
      lines.forEach(function (l, i) { txt(g, l[0], 354, 56 + i * 20, C.dim, 10); txt(g, rebooting ? "--" : l[1], 460, 56 + i * 20, C.ink, 10, "right", 700); });
      txt(g, "updates every 2 s", 407, 178, C.dim, 9, "center");
      txt(g, "Valve actuations: " + acts, 210, 126, C.ink, 11, "left", 700);
      txt(g, "Arduino resets: " + resets, 210, 144, resets ? C.red : C.green, 11, "left", 700);
      if (moist < 25) txt(g, "The plant is thirsty!", 210, 170, C.red, 12, "left", 800);
      else if (moist > 85) txt(g, "That's plenty of water.", 210, 170, C.gold, 12, "left", 700);
    });
    st.canvas.setAttribute("aria-label", "A potted plant, a solenoid valve, the Arduino shield and an ESP32 dashboard");
    var r = row(el);
    var water = btn(r, "Open the valve (water)", function () {
      if (now < resetUntil) return;
      acts++; valveUntil = now + 1.2;
      if (!iso) { resets++; resetUntil = now + 1.6; out.textContent = "The solenoid's spike reached the 5 V logic and the Arduino reset. Readings stop until it reboots."; }
      else out.textContent = "Valve open for 1.2 s. The optocoupler keeps the solenoid's surge and spike off the Arduino's supply.";
    });
    water.classList.add("big");
    choice(el, ["Optocoupled relay (Dhru's design)", "No isolation"], function (k) { iso = k === 0; acts = 0; resets = 0; }, 0);
    var out = readout(el, "Soil moisture falls over time. Open the valve to water the plant.");
    note(el, "Simulated readings. The real shield ran its 12 V / 2 A solenoid with zero Arduino resets across 50 back-to-back actuations.");
    return st.stop;
  };

  /* ===================== Signal Lab: tune the diode shaper ===================== */
  demos.waveforms = function (el) {
    title(el, "Play: pick a waveform and range. In Sine, tune the diode shaper until THD drops under 3%");
    var shape = 0, range = 2, fine = 0.5, k = 0.6;
    function fHz() { var lo = [10, 100, 1000][range]; return Math.round(lo * Math.pow(10, fine)); }
    function wave(u) {
      var tri = u < 0.5 ? 4 * u - 1 : 3 - 4 * u;
      if (shape === 1) return u < 0.5 ? 1 : -1;
      if (shape === 2) return tri;
      return k < 0.05 ? tri : Math.tanh(k * tri) / Math.tanh(k);
    }
    function thd() {
      var N = 256, re = [], im = [];
      for (var j = 0; j < 26; j++) { re[j] = 0; im[j] = 0; }
      for (var n = 0; n < N; n++) { var y = wave(n / N); for (var j2 = 1; j2 < 26; j2++) { re[j2] += y * Math.cos(2 * Math.PI * j2 * n / N); im[j2] += y * Math.sin(2 * Math.PI * j2 * n / N); } }
      var f = Math.hypot(re[1], im[1]), s = 0; for (var j3 = 2; j3 < 26; j3++) s += re[j3] * re[j3] + im[j3] * im[j3];
      return Math.sqrt(s) / f * 100;
    }
    var st = stage(el, 480, 180, function (g, t) {
      bgGrid(g, 480, 180, 30);
      var cycles = 1.5 + fine * 4, ph = reduced ? 0 : t * 0.8;
      g.strokeStyle = C.green; g.lineWidth = 2.5; g.lineJoin = "round"; g.beginPath();
      for (var x = 0; x <= 480; x++) { var u = ((x / 480 * cycles + ph) % 1 + 1) % 1, yy = 90 - wave(u) * 62; if (x) g.lineTo(x, yy); else g.moveTo(x, yy); }
      g.stroke();
      if (shape === 0) {
        g.strokeStyle = "rgba(127,212,255,0.45)"; g.lineWidth = 1.5; g.setLineDash([4, 4]); g.beginPath();
        for (var x2 = 0; x2 <= 480; x2++) { var u2 = ((x2 / 480 * cycles + ph) % 1 + 1) % 1, y2 = 90 + Math.cos(2 * Math.PI * u2) * 62; if (x2) g.lineTo(x2, y2); else g.moveTo(x2, y2); }
        g.stroke(); g.setLineDash([]);
        txt(g, "dashed: an ideal sine", 470, 170, C.blue, 10, "right");
      }
      var f = fHz(); txt(g, f >= 1000 ? (f / 1000).toFixed(f >= 10000 ? 0 : 2) + " kHz" : f + " Hz", 12, 16, C.gold, 13, "left", 800);
    });
    st.canvas.setAttribute("aria-label", "Oscilloscope screen showing the selected waveform");
    var sb = stats(el), gl = goal(el);
    var shaperWrap = h("div");
    choice(el, ["Sine", "Square", "Triangle"], function (i) { shape = i; shaperWrap.hidden = i !== 0; show(); }, 0);
    choice(el, ["10–100 Hz", "100 Hz–1 kHz", "1–10 kHz"], function (i) { range = i; show(); }, 2);
    slider(el, "Frequency", 0, 1, 0.01, fine, function (v, t) { fine = v; var f = fHz(); t.textContent = "Frequency dial: " + (f >= 1000 ? (f / 1000).toFixed(2) + " kHz" : f + " Hz"); show(); });
    el.appendChild(shaperWrap);
    slider(shaperWrap, "Diode shaper", 0, 3, 0.02, k, function (v, t) { k = v; t.textContent = "Diode shaper: where the diodes start to conduct (" + v.toFixed(2) + ")"; show(); });
    function show() {
      if (!sb) return;
      var d = shape === 1 ? null : thd();
      setStats(sb, [{ k: "frequency", v: fHz() >= 1000 ? (fHz() / 1000).toFixed(2) + " kHz" : fHz() + " Hz" }, { k: "THD", v: d == null ? "—" : d.toFixed(1) + "%", cls: d != null && d < 3 ? "good" : "" }, { k: "duty cycle", v: shape === 1 ? "50%" : "—" }]);
      if (shape === 0) setGoal(gl, d < 3, d < 3 ? "Under 3% THD. That's the spec the real board met." : "Goal: tune the shaper until THD is under 3%.");
      else gl.className = "goal hidden";
      st.redraw();
    }
    show();
    note(el, "A model of triangle-to-sine shaping, with THD computed live from the waveform. The real generator measured under 3% THD on the oscilloscope's FFT.");
    return st.stop;
  };

  /* ===================== Filter Lab: place the poles ===================== */
  demos.zplane = function (el) {
    title(el, "Play: drag the pole (or use the sliders) to pass the spec: 80% of the energy within ±8 Hz of 120 Hz");
    var fs = 340, r = 0.85, fp = 100, drag = false, notch = false;
    function H(f) {
      var w = 2 * Math.PI * f / fs, th = 2 * Math.PI * fp / fs;
      var zr = Math.cos(w), zi = Math.sin(w);
      var nr = 1 - Math.cos(2 * w), ni = Math.sin(2 * w);
      if (notch) { /* zeros on the circle at the pole angle, poles just inside */
        var a1 = zr - Math.cos(th), b1 = zi - Math.sin(th), a2 = zr - Math.cos(th), b2 = zi + Math.sin(th);
        var c1 = zr - r * Math.cos(th), d1 = zi - r * Math.sin(th), c2 = zr - r * Math.cos(th), d2 = zi + r * Math.sin(th);
        return Math.hypot(a1, b1) * Math.hypot(a2, b2) / (Math.hypot(c1, d1) * Math.hypot(c2, d2));
      }
      var p1 = Math.hypot(zr - r * Math.cos(th), zi - r * Math.sin(th)), p2 = Math.hypot(zr - r * Math.cos(th), zi + r * Math.sin(th));
      return Math.hypot(nr, ni) / (p1 * p2);
    }
    function energy() {
      var tot = 0, band = 0, N = 1360, prev = null;
      for (var i = 0; i <= N; i++) { var f = i / N * 170, v = H(f); v *= v; if (prev != null) { var a = (v + prev[1]) / 2 * (f - prev[0]); tot += a; if (f > 112 && f <= 128) band += a; } prev = [f, v]; }
      return band / tot * 100;
    }
    var ZC = { x: 95, y: 100, R: 74 };
    var st = stage(el, 480, 200, function (g) {
      g.fillStyle = C.bg; g.fillRect(0, 0, 480, 200);
      g.strokeStyle = C.grid; g.beginPath(); g.moveTo(ZC.x - 88, ZC.y); g.lineTo(ZC.x + 88, ZC.y); g.moveTo(ZC.x, ZC.y - 88); g.lineTo(ZC.x, ZC.y + 88); g.stroke();
      g.strokeStyle = C.blue; g.lineWidth = 1.5; g.beginPath(); g.arc(ZC.x, ZC.y, ZC.R, 0, 7); g.stroke();
      var th = 2 * Math.PI * fp / fs, t120 = 2 * Math.PI * 120 / fs;
      g.strokeStyle = "rgba(255,209,102,0.35)"; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(ZC.x, ZC.y); g.lineTo(ZC.x + Math.cos(t120) * 86, ZC.y - Math.sin(t120) * 86); g.stroke(); g.setLineDash([]);
      txt(g, "120 Hz", ZC.x + Math.cos(t120) * 92 - 4, ZC.y - Math.sin(t120) * 92 - 4, C.gold, 9, "center");
      [-1, 1].forEach(function (s) {
        var px = ZC.x + r * ZC.R * Math.cos(th), py = ZC.y - s * r * ZC.R * Math.sin(th);
        g.strokeStyle = C.gold; g.lineWidth = 2.5; g.beginPath(); g.moveTo(px - 5, py - 5); g.lineTo(px + 5, py + 5); g.moveTo(px - 5, py + 5); g.lineTo(px + 5, py - 5); g.stroke();
      });
      g.strokeStyle = C.green; g.lineWidth = 2;
      (notch ? [[Math.cos(th), Math.sin(th)], [Math.cos(th), -Math.sin(th)]] : [[1, 0], [-1, 0]]).forEach(function (q) { g.beginPath(); g.arc(ZC.x + q[0] * ZC.R, ZC.y - q[1] * ZC.R, 5, 0, 7); g.stroke(); });
      txt(g, "× poles   ○ zeros", 8, 192, C.dim, 9);
      /* response */
      var L = 200, Rr = 470, T0 = 16, B0 = 170, mx = 0, vals = [];
      for (var i = 0; i <= 270; i++) { var v = H(i / 270 * 170); vals.push(v); if (v > mx) mx = v; }
      var bx0 = L + 112 / 170 * (Rr - L), bx1 = L + 128 / 170 * (Rr - L);
      g.fillStyle = "rgba(255,209,102,0.15)"; g.fillRect(bx0, T0, bx1 - bx0, B0 - T0);
      g.strokeStyle = C.grid; g.strokeRect(L + 0.5, T0 + 0.5, Rr - L, B0 - T0);
      g.strokeStyle = C.green; g.lineWidth = 2.5; g.beginPath();
      vals.forEach(function (v, i) { var x = L + i / 270 * (Rr - L), y = B0 - v / mx * (B0 - T0 - 6); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke();
      txt(g, "0", L, B0 + 10, C.dim, 9, "center"); txt(g, "120", L + 120 / 170 * (Rr - L), B0 + 10, C.gold, 9, "center"); txt(g, "170 Hz", Rr, B0 + 10, C.dim, 9, "right");
      txt(g, "|H(f)|, scaled to its peak", L + 4, T0 + 10, C.dim, 9);
    });
    st.canvas.setAttribute("aria-label", "The z-plane with a pole pair and zeros, and the filter's frequency response");
    var sb = stats(el), gl = goal(el);
    var mode = choice(el, ["Band-pass", "Notch"], function (k) { notch = k === 1; show(); }, 0);
    var sR = slider(el, "Pole radius", 0.7, 0.99, 0.005, r, function (v, t) { r = v; t.textContent = "Pole radius: " + v.toFixed(3) + " (closer to 1 = sharper)"; show(); });
    var sF = slider(el, "Pole frequency", 60, 160, 1, fp, function (v, t) { fp = v; t.textContent = "Pole angle: " + v + " Hz"; show(); });
    function show() {
      if (!sb) return;
      if (!notch) {
        var e = energy();
        setStats(sb, [{ k: "energy within ±8 Hz", v: e.toFixed(1) + "%", cls: e >= 80 ? "good" : "bad" }, { k: "spec", v: "≥ 80%" }]);
        setGoal(gl, e >= 80, e >= 80 ? "Spec met. Dhru's two-pole-pair design reached 96.3%." : "Goal: 80% of the energy within ±8 Hz of 120 Hz.");
      } else {
        var g120 = H(120), g100 = H(100) / Math.max(H(10), 1e-9);
        setStats(sb, [{ k: "gain at 120 Hz", v: g120 < 1e-6 ? "0" : g120.toFixed(3), cls: "good" }, { k: "gain at 100 Hz vs 10 Hz", v: g100.toFixed(2) }]);
        var aimed = r > 0.9 && Math.abs(fp - 120) <= 2;
        setGoal(gl, aimed, aimed ? "Notch aimed at 120 Hz: zeros on the unit circle null it, and poles just inside keep the rest flat." : "Goal: aim the notch at 120 Hz with the poles close to the circle (radius above 0.9).");
      }
      st.redraw();
    }
    function fromPointer(ev) {
      var b = st.canvas.getBoundingClientRect(), x = (ev.clientX - b.left) / b.width * 480, y = (ev.clientY - b.top) / b.height * 200;
      var dx = x - ZC.x, dy = ZC.y - y, rr = Math.hypot(dx, dy) / ZC.R, ang = Math.abs(Math.atan2(dy, dx));
      r = Math.max(0.7, Math.min(0.99, rr)); fp = Math.max(60, Math.min(160, Math.round(ang / (2 * Math.PI) * fs)));
      sR.value = r; sF.value = fp; sR.dispatchEvent(new Event("input")); sF.dispatchEvent(new Event("input"));
    }
    st.canvas.style.touchAction = "none";
    st.canvas.addEventListener("pointerdown", function (ev) { var b = st.canvas.getBoundingClientRect(); if ((ev.clientX - b.left) / b.width * 480 < 190) { drag = true; fromPointer(ev); try { st.canvas.setPointerCapture(ev.pointerId); } catch (e) { /* fine */ } } });
    st.canvas.addEventListener("pointermove", function (ev) { if (drag) fromPointer(ev); });
    st.canvas.addEventListener("pointerup", function () { drag = false; });
    show();
    note(el, "Simplified to one pole pair, with zeros at 0 Hz and Nyquist, sampled at 340 Hz like the project. In-band energy is integrated with the trapezoid rule, as in the MATLAB evaluator.");
    return st.stop;
  };

  /* ===================== Grid Forecast: start from yesterday ===================== */
  demos.anchor = function (el) {
    title(el, "Play: blend in the network's correction to yesterday's load. Then try a holiday");
    var day = 0, c = 0;
    function base(hr) { return 20 + 6 * Math.exp(-Math.pow((hr - 8.5) / 2.2, 2)) + 11 * Math.exp(-Math.pow((hr - 20) / 2.6, 2)) - 4 * Math.exp(-Math.pow((hr - 4) / 2.5, 2)); }
    function yday(hr) { return base(hr) + 0.6 * Math.sin(hr * 1.3); }
    function today(hr) {
      if (day === 0) return base(hr) + 1.6 + 2.2 * Math.exp(-Math.pow((hr - 15) / 3, 2)) + 0.5 * Math.sin(hr * 2.1);
      if (day === 1) return base(hr) + 4.5 * Math.exp(-Math.pow((hr - 14.5) / 3.5, 2)) + 1 + 0.4 * Math.sin(hr * 1.7);
      return base(hr) * 0.78 + 0.5 * Math.sin(hr * 1.9);
    }
    function learned(hr) { return day === 2 ? 0.25 * Math.sin(hr) : (today(hr) - yday(hr)) * 0.25 + 0.5 * Math.sin(hr * 2.3 + 1); }
    function fc(hr) { return yday(hr) + c * learned(hr); }
    function rmse(f) { var s = 0; for (var hr = 0; hr < 24; hr++) { var d = f(hr) - today(hr); s += d * d; } return Math.sqrt(s / 24); }
    var st = stage(el, 480, 200, function (g) {
      bgGrid(g, 480, 200, 20);
      var L = 36, Rr = 470, T0 = 14, B0 = 176;
      function X(hr) { return L + hr / 23 * (Rr - L); }
      function Y(v) { return B0 - (v - 10) / 30 * (B0 - T0); }
      [[yday, "rgba(127,212,255,0.6)", [5, 4]], [today, C.ink, []], [fc, C.green, []]].forEach(function (q) {
        g.strokeStyle = q[1]; g.lineWidth = q[0] === today ? 2 : 2.5; g.setLineDash(q[2]); g.beginPath();
        for (var hr = 0; hr <= 23; hr += 0.25) { var y = Y(q[0](hr)); if (hr) g.lineTo(X(hr), y); else g.moveTo(X(hr), y); }
        g.stroke(); g.setLineDash([]);
      });
      txt(g, "yesterday", 470, 14, C.blue, 10, "right"); txt(g, "actual today", 470, 28, C.ink, 10, "right"); txt(g, "forecast", 470, 42, C.green, 10, "right");
      ["0h", "6h", "12h", "18h", "23h"].forEach(function (s, i) { txt(g, s, X([0, 6, 12, 18, 23][i]), 190, C.dim, 9, "center"); });
      txt(g, "load", 6, 14, C.dim, 9);
    });
    st.canvas.setAttribute("aria-label", "Yesterday's load, today's actual load and the forecast over 24 hours");
    var sb = stats(el), out = readout(el, "");
    choice(el, ["Ordinary weekday", "Warmer afternoon", "Holiday"], function (k) { day = k; show(); }, 0);
    slider(el, "Network correction", 0, 1, 0.01, c, function (v, t) { c = v; t.textContent = v === 0 ? "Forecast = same as yesterday (seasonal naive)" : "Forecast = yesterday + " + Math.round(v * 100) + "% of the network's correction"; show(); });
    function show() {
      if (!sb) return;
      var naive = rmse(yday), mine = rmse(fc), better = (1 - mine / naive) * 100;
      setStats(sb, [{ k: "error vs actual (RMSE)", v: mine.toFixed(2) }, { k: "vs same-as-yesterday", v: Math.abs(better) < 0.5 ? "0%" : (better > 0 ? "\u2212" : "+") + Math.abs(better).toFixed(0) + "%", cls: better > 5 ? "good" : "bad" }]);
      out.textContent = day === 2 ? "The inputs never mark holidays, so the network expects a normal day and barely helps. That blind spot showed up in the real evaluation." : "The network only has to learn the difference from yesterday, which is a much easier target than the whole curve.";
      st.redraw();
    }
    show();
    note(el, "Synthetic days for illustration, not the Tetouan data. On the real held-out test set the tuned models had 16–23% lower RMSE than same-as-yesterday, and the anchor cut validation error by 9–28%.");
    return st.stop;
  };

  /* ===================== Vision Lab: guess the winner ===================== */
  demos.transfer = function (el) {
    title(el, "Play: which setup scored best on 32×32 CIFAR-10 images? Make your guess");
    var S = [
      { n: "6-layer CNN from scratch", a: 88.5, time: "1,146 s" },
      { n: "ResNet-50 (ImageNet), head only", a: 46.9 },
      { n: "ResNet-50 (ImageNet), progressive unfreezing", a: 87.8, time: "539 s" },
      { n: "ResNet-50 (Places365 scenes)", a: 82.2 },
      { n: "ImageNet → CIFAR-10 (direct)", a: 86.7 },
      { n: "ImageNet → CIFAR-100 → CIFAR-10", a: 87.0 }
    ];
    var pick = -1, grow = 0;
    var st = stage(el, 480, 230, function (g, t, dt) {
      g.fillStyle = C.bg; g.fillRect(0, 0, 480, 230);
      if (pick < 0) {
        txt(g, "Pretrained models usually win. Do they here?", 240, 100, C.ink, 13, "center", 700);
        txt(g, "Pick a setup below to reveal the results.", 240, 124, C.dim, 11, "center");
        return;
      }
      grow = reduced ? 1 : Math.min(1, grow + dt / 1.4);
      S.forEach(function (s, i) {
        var y = 14 + i * 36, w = 300 * (s.a / 100) * grow;
        txt(g, s.n, 12, y + 6, i === pick ? C.gold : C.dim, 10, "left", i === pick ? 800 : 600);
        g.fillStyle = i === 0 ? C.green : "#3B82F6"; g.fillRect(12, y + 14, w, 12);
        if (grow >= 1) txt(g, s.a.toFixed(1) + "%" + (s.time ? "   " + s.time : ""), 18 + w, y + 20, C.ink, 10, "left", 700);
      });
    });
    st.canvas.setAttribute("aria-label", "Test accuracy for the six setups");
    var list = h("div", { "class": "demo-row wrap" }), out = readout(el, "");
    el.insertBefore(list, st.canvas.nextSibling);
    S.forEach(function (s, i) {
      btn(list, s.n, function () {
        pick = i; grow = 0;
        out.textContent = (i === 0 ? "Right! " : "Not this time. ") + "The from-scratch CNN won at 88.5%. ImageNet features learned on 224×224 photos don't fit 32×32 images: freezing them gave only 46.9%. Progressive unfreezing came within 0.8 points in under half the training time.";
        st.redraw();
      });
    });
    note(el, "All numbers are the project's results: mean of 3 seeds per setup, same AdamW optimizer and stopping rules, on a 4 GB laptop GPU.");
    return st.stop;
  };

  /* ===================== Gen Gallery: blur the sandal ===================== */
  demos.blur = function (el) {
    title(el, "Play: blur the sandal like a VAE does. When does the classifier stop seeing a sandal?");
    var ART = [
      "............................",
      "............................",
      "............................",
      "............................",
      "............................",
      "............................",
      "............................",
      "............................",
      "............................",
      "............................",
      "............................",
      "...####.....................",
      "..#....#....................",
      ".#......#....####...........",
      ".#......#...#....#..........",
      ".#......#..#......#...###...",
      ".#......#..#......#..#...#..",
      ".#......#..#......#.#.....#.",
      ".#......#..#......#.#.....#.",
      ".#......#..#......#.#.....#.",
      "###########################.",
      "###########################.",
      ".##.....................###.",
      "............................",
      "............................",
      "............................",
      "............................",
      "............................"
    ];
    var base = ART.map(function (r) { return r.split("").map(function (c) { return c === "#" ? 1 : 0; }); });
    var level = 0;
    function blurred() {
      var img = base.map(function (r) { return r.slice(); });
      for (var it = 0; it < level; it++) {
        var nx = img.map(function (r) { return r.slice(); });
        for (var y = 0; y < 28; y++) for (var x = 0; x < 28; x++) {
          var s = 0, n = 0;
          for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var yy = y + dy, xx = x + dx; if (yy >= 0 && yy < 28 && xx >= 0 && xx < 28) { s += img[yy][xx]; n++; } }
          nx[y][x] = s / n;
        }
        img = nx;
      }
      return img;
    }
    /* how clearly the gaps between straps survive: the weakest row's contrast across the straps */
    function strapContrast(img) {
      var worst = 1;
      for (var y = 14; y <= 19; y++) {
        var first = base[y].indexOf(1), last = base[y].lastIndexOf(1), mx = 0, mn = 1;
        for (var x = first; x <= last; x++) { mx = Math.max(mx, img[y][x]); mn = Math.min(mn, img[y][x]); }
        worst = Math.min(worst, mx > 0 ? (mx - mn) / mx : 0);
      }
      return worst;
    }
    var st = stage(el, 480, 200, function (g) {
      g.fillStyle = C.bg; g.fillRect(0, 0, 480, 200);
      var img = blurred(), s = 6, ox = 16, oy = 16;
      var mx = 0; img.forEach(function (r) { r.forEach(function (v) { mx = Math.max(mx, v); }); });
      for (var y = 0; y < 28; y++) for (var x = 0; x < 28; x++) { var v = img[y][x] / (mx || 1); var c = Math.round(v * 235); g.fillStyle = "rgb(" + c + "," + c + "," + c + ")"; g.fillRect(ox + x * s, oy + y * s, s, s); }
      g.strokeStyle = C.grid; g.strokeRect(ox - 0.5, oy - 0.5, 28 * s + 1, 28 * s + 1);
      /* FID chart */
      var L = 218;
      txt(g, "FID, lower is better", L, 22, C.ink, 11, "left", 700);
      [["Real vs real (best possible)", 5.1, C.blue], ["DCGAN", 32.9, C.green], ["VAE", 66.8, C.red]].forEach(function (q, i) {
        var y = 44 + i * 40, w = 230 * q[1] / 70;
        txt(g, q[0], L, y, C.dim, 10);
        g.fillStyle = q[2]; g.fillRect(L, y + 8, w, 12); txt(g, q[1].toFixed(1), L + w + 6, y + 14, C.ink, 10, "left", 700);
      });
      txt(g, "DCGAN cut FID by 51%", L, 176, C.gold, 12, "left", 800);
    });
    st.canvas.setAttribute("aria-label", "A 28 by 28 pixel sandal and a chart of FID scores");
    var sb = stats(el), out = readout(el, "");
    var pre = choice(el, ["Sharp (DCGAN-like)", "Blurry (VAE-like)"], function (k) { level = k ? 3 : 0; sl.value = level; sl.dispatchEvent(new Event("input")); }, 0);
    var sl = slider(el, "Blur", 0, 5, 1, level, function (v, t) {
      level = v; t.textContent = "Blur passes: " + v;
      if (!sb) return;
      var ct = strapContrast(blurred()), sandal = ct > 0.5;
      setStats(sb, [{ k: "gap contrast between straps", v: Math.round(ct * 100) + "%" }, { k: "toy classifier says", v: sandal ? "sandal" : "solid shoe", cls: sandal ? "good" : "bad" }]);
      out.textContent = sandal ? "The gaps between the straps are still visible, so it reads as a sandal." : "The thin straps have smeared into a solid shape. This is why the VAE made only 3.0% sandals.";
      st.redraw();
    });
    sl.dispatchEvent(new Event("input"));
    note(el, "Pixel art and a toy classifier for illustration. The FID scores, the 3.0% sandals and the DCGAN's 7.3–12.0% per class are the project's measured results.");
    return st.stop;
  };

  /* ===================== Permit Office: walk the forecast forward ===================== */
  demos.walkforward = function (el) {
    title(el, "Play: step through the 5 rolling test windows instead of trusting one split");
    var w = -1, single = false;
    var series = [];
    for (var m = 0; m < 180; m++) series.push(50 + 18 * Math.sin(2 * Math.PI * m / 12) + 10 * Math.sin(m / 23) + (rand(m) - 0.5) * 14 + (m > 110 && m < 130 ? -14 : 0));
    var st = stage(el, 480, 190, function (g) {
      bgGrid(g, 480, 190, 20);
      var L = 14, Rr = 466, T0 = 16, B0 = 160;
      function X(i) { return L + i / 179 * (Rr - L); }
      function Y(v) { return B0 - (v - 10) / 90 * (B0 - T0); }
      var wins = single ? [[0, 156, 168]] : [[0, 108, 120], [0, 120, 132], [0, 132, 144], [0, 144, 156], [0, 156, 168]];
      wins.forEach(function (q, i) {
        if (w >= 0 && i !== w) return;
        g.fillStyle = "rgba(127,212,255,0.12)"; g.fillRect(X(q[0]), T0, X(q[1]) - X(q[0]), B0 - T0);
        g.fillStyle = "rgba(255,209,102,0.25)"; g.fillRect(X(q[1]), T0, X(q[2]) - X(q[1]), B0 - T0);
      });
      g.strokeStyle = C.green; g.lineWidth = 2; g.beginPath();
      series.forEach(function (v, i) { if (i) g.lineTo(X(i), Y(v)); else g.moveTo(X(i), Y(v)); }); g.stroke();
      txt(g, "monthly permits (synthetic)", 18, 176, C.dim, 10);
      txt(g, "train", 330, 176, C.blue, 10); txt(g, "test 12 months", 372, 176, C.gold, 10);
      if (w >= 0 && !single) txt(g, "Window " + (w + 1) + " of 5", 466, 10, C.gold, 11, "right", 800);
    });
    st.canvas.setAttribute("aria-label", "A monthly series with shaded training and 12-month test windows");
    var out = readout(el, "");
    var r = row(el);
    var nextB = btn(r, "Next window ▶", function () { single = false; w = (w + 1) % 5; say(); });
    btn(r, "Show all 5", function () { single = false; w = -1; say(); });
    btn(r, "One lucky split", function () { single = true; w = -1; say(); });
    function say() {
      if (single) out.textContent = "One split tests a single year. If that year happened to be calm or wild, the score misleads.";
      else if (w < 0) out.textContent = "Five rolling windows: each model forecasts 12 months forward from five different points in time. The TCN's 18% lower RMSE than a tuned SARIMA held across all five.";
      else out.textContent = "Window " + (w + 1) + ": train on everything before the gold band, then forecast the next 12 months without peeking. " + (w === 1 ? "This window contains a sharp dip, the kind of swing SARIMA handles poorly." : "");
      st.redraw();
    }
    say();
    note(el, "Synthetic series for illustration. The real pipeline used 60+ years of U.S. Census building-permit data and 200+ Bayesian tuning trials.");
    return st.stop;
  };

  /* ===================== Travel Desk: plan a trip on a budget ===================== */
  demos.trip = function (el) {
    title(el, "Play: plan a 3-night trip, Toronto to Vancouver, inside your budget");
    var flights = [
      { a: "Northwind", p: 412, d: 5.0, s: 0 }, { a: "Lakeshore Jet", p: 298, d: 7.5, s: 1 }, { a: "Aurora Air", p: 355, d: 5.2, s: 0 },
      { a: "Harbour Wings", p: 241, d: 9.8, s: 2 }, { a: "Northwind", p: 336, d: 6.4, s: 1 }, { a: "Cedar Air", p: 467, d: 4.9, s: 0 },
      { a: "Lakeshore Jet", p: 264, d: 8.6, s: 1 }, { a: "Aurora Air", p: 389, d: 5.6, s: 0 }
    ];
    var hotels = [{ n: "Hostel downtown", p: 48 }, { n: "Budget inn", p: 96 }, { n: "Harbour hotel", p: 189 }];
    var sort = "p", fi = -1, hi = 0, budget = 900, extras = 120;
    var wrap = h("div", { "class": "trip" });
    var list = h("ol", { "class": "trip-list" });
    var side = h("div", { "class": "trip-side" });
    wrap.appendChild(list); wrap.appendChild(side); el.appendChild(wrap);
    var sorts = choice(el, ["Sort by price", "Sort by duration", "Sort by stops"], function (k) { sort = ["p", "d", "s"][k]; render(); }, 0);
    el.insertBefore(sorts, wrap);
    var hsel = choice(side, hotels.map(function (x) { return x.n + " $" + x.p; }), function (k) { hi = k; total(); }, 0);
    slider(side, "Budget", 400, 1500, 10, budget, function (v, t) { budget = v; t.textContent = "Budget: $" + v; total(); });
    var sb = stats(side), gl = goal(side);
    function render() {
      var arr = flights.map(function (f, i) { return { f: f, i: i }; }).sort(function (x, y) { return x.f[sort] - y.f[sort] || x.f.p - y.f.p; });
      list.textContent = "";
      arr.forEach(function (o) {
        var li = h("li"), b = h("button", { type: "button", "class": "trip-opt", "aria-pressed": o.i === fi ? "true" : "false" });
        b.appendChild(h("b", null, "$" + o.f.p)); b.appendChild(h("span", null, o.f.a + " · " + o.f.d.toFixed(1) + " h · " + (o.f.s ? o.f.s + " stop" + (o.f.s > 1 ? "s" : "") : "nonstop")));
        b.addEventListener("click", function () { fi = o.i; render(); total(); });
        li.appendChild(b); list.appendChild(li);
      });
    }
    function total() {
      if (!sb) return;
      var f = fi >= 0 ? flights[fi].p : 0, hotel = hotels[hi].p * 3, sum = f + hotel + extras;
      setStats(sb, [{ k: "flight", v: fi >= 0 ? "$" + f : "pick one" }, { k: "3 nights", v: "$" + hotel }, { k: "food + attractions", v: "$" + extras }, { k: "total", v: "$" + sum, cls: fi >= 0 && sum <= budget ? "good" : "bad" }]);
      if (fi < 0) setGoal(gl, false, "Pick a flight from the list.");
      else setGoal(gl, sum <= budget, sum <= budget ? "Itinerary fits the budget with $" + (budget - sum) + " to spare." : "Over budget by $" + (sum - budget) + ". Try a cheaper flight or hotel.");
    }
    render(); total();
    note(el, "Made-up airlines and prices for the game. The real app pulled live data from 6 REST APIs and returned full trips in under 4 seconds on average.");
    return function () {};
  };

  CW.demos = demos;
})();
