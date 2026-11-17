/* demos.js: mini-demos shown inside project panels, registered by name.
   Each demo is function(el, project) and returns a function that stops it.
   A project whose `demo` name is not registered here simply shows no demo. */
(function () {
  var CW = (window.CW = window.CW || {});
  var reduced = false;
  try { reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { /* default */ }

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
    var g = c.getContext("2d"), raf = 0, t0 = 0, alive = true;
    function tick(now) {
      if (!alive) return;
      if (!t0) t0 = now;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawFn(g, (now - t0) / 1000);
      if (!reduced) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return {
      canvas: c,
      redraw: function () { if (reduced && alive) requestAnimationFrame(tick); },
      stop: function () { alive = false; cancelAnimationFrame(raf); }
    };
  }

  function note(el, text) { el.appendChild(h("p", { "class": "demo-note" }, text)); }

  function choice(el, labels, onPick, startIndex) {
    var row = h("div", { "class": "demo-row", role: "group" }), btns = [];
    labels.forEach(function (l, i) {
      var b = h("button", { type: "button", "class": "demo-btn", "aria-pressed": i === startIndex ? "true" : "false" }, l);
      b.addEventListener("click", function () {
        btns.forEach(function (o) { o.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true"); onPick(i);
      });
      btns.push(b); row.appendChild(b);
    });
    el.appendChild(row);
    return row;
  }

  var demos = {};

  /* Logic Fortress: a one-bit full adder you can toggle. */
  demos.adder = function (el) {
    el.appendChild(h("p", { "class": "demo-title" }, "Try it: a one-bit full adder"));
    var state = { A: 0, B: 0, Cin: 0 };
    var row = h("div", { "class": "demo-row" }), out = h("div", { "class": "demo-row" });
    var sum = h("span", { "class": "led" }), carry = h("span", { "class": "led" }), eq = h("p", { "class": "demo-readout", "aria-live": "polite" });
    function render() {
      var s = state.A ^ state.B ^ state.Cin, c = (state.A & state.B) | (state.Cin & (state.A ^ state.B));
      sum.className = "led" + (s ? " on" : ""); carry.className = "led" + (c ? " on" : "");
      eq.textContent = state.A + " + " + state.B + " + " + state.Cin + " = " + c + "" + s + " in binary (carry-out " + c + ", sum " + s + ")";
    }
    ["A", "B", "Cin"].forEach(function (k) {
      var b = h("button", { type: "button", "class": "demo-btn switch", "aria-pressed": "false" }, k + ": 0");
      b.addEventListener("click", function () {
        state[k] = state[k] ? 0 : 1; b.setAttribute("aria-pressed", state[k] ? "true" : "false");
        b.textContent = k + ": " + state[k]; render();
      });
      row.appendChild(b);
    });
    var l1 = h("span", { "class": "led-label" }, "Sum "), l2 = h("span", { "class": "led-label" }, "Carry-out ");
    l1.appendChild(sum); l2.appendChild(carry); out.appendChild(l1); out.appendChild(l2);
    el.appendChild(row); el.appendChild(out); el.appendChild(eq);
    render();
    return function () {};
  };

  /* Shield Workshop: what each sensor on the shield measures. */
  demos.sensors = function (el) {
    el.appendChild(h("p", { "class": "demo-title" }, "Tap a sensor on the shield"));
    var info = [
      ["Capacitive moisture", "Reads soil moisture from the change in capacitance around the probe."],
      ["DHT11", "Reads air temperature and relative humidity over a single data line."],
      ["HC-SR04", "Measures distance by timing an ultrasonic pulse and its echo."],
      ["LDR", "A light-dependent resistor: its resistance falls as light gets brighter."],
      ["Tilt switch", "Opens or closes a contact when the board is tipped."]
    ];
    var out = h("p", { "class": "demo-readout", "aria-live": "polite" }, info[0][1]);
    choice(el, info.map(function (i) { return i[0]; }), function (i) { out.textContent = info[i][1]; }, 0);
    el.appendChild(out);
    return function () {};
  };

  /* Signal Lab: the three waveforms on a scope screen. */
  demos.waveforms = function (el) {
    el.appendChild(h("p", { "class": "demo-title" }, "Try it: pick a waveform and sweep the frequency"));
    var shape = 0, pos = 0.5;
    var st = stage(el, 480, 180, function (g, t) {
      var W = 480, H = 180;
      g.fillStyle = "#04140E"; g.fillRect(0, 0, W, H);
      g.strokeStyle = "#0E3A29"; g.lineWidth = 1;
      for (var x = 0; x <= W; x += 48) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, H); g.stroke(); }
      for (var y = 0; y <= H; y += 30) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); g.stroke(); }
      var cycles = 1.5 + pos * 6.5, phase = reduced ? 0 : t * 1.2;
      g.strokeStyle = "#5CFF9D"; g.lineWidth = 2.5; g.lineJoin = "round"; g.beginPath();
      for (var i = 0; i <= W; i++) {
        var u = (i / W * cycles + phase) % 1, v;
        if (shape === 0) v = Math.sin(u * Math.PI * 2);
        else if (shape === 1) v = u < 0.5 ? 1 : -1;
        else v = u < 0.5 ? 4 * u - 1 : 3 - 4 * u;
        var yy = H / 2 - v * 58;
        if (i === 0) g.moveTo(i, yy); else g.lineTo(i, yy);
      }
      g.stroke();
    });
    st.canvas.setAttribute("aria-label", "Oscilloscope screen showing the selected waveform");
    choice(el, ["Sine", "Square", "Triangle"], function (i) { shape = i; st.redraw(); }, 0);
    var wrap = h("label", { "class": "demo-slider" });
    var txt = h("span", null, "");
    var s = h("input", { type: "range", min: "0", max: "1000", value: "500", "aria-label": "Frequency" });
    function freq() { return Math.round(Math.pow(10, 1 + pos * 3)); }   // 10 Hz to 10 kHz
    function show() { var f = freq(); txt.textContent = "Frequency: " + (f >= 1000 ? (f / 1000).toFixed(f >= 10000 ? 0 : 1) + " kHz" : f + " Hz"); }
    s.addEventListener("input", function () { pos = s.value / 1000; show(); st.redraw(); });
    wrap.appendChild(txt); wrap.appendChild(s); el.appendChild(wrap); show();
    note(el, "Illustrative display, not captured from the real board.");
    return st.stop;
  };

  /* Robot Garage: follow the line, sort what you pick up. */
  demos.robot = function (el) {
    el.appendChild(h("p", { "class": "demo-title" }, "Watch: follow the line, sort the pickup"));
    var counts = [0, 0], carrying = null, lastLap = -1, dropped = false, picked = false;
    var readout = h("p", { "class": "demo-readout", "aria-live": "off" }, "");
    function pt(u) { var a = u * Math.PI * 2 - Math.PI / 2; return [240 + Math.cos(a) * 170, 92 + Math.sin(a) * 56]; }
    var st = stage(el, 480, 184, function (g, t) {
      var W = 480, H = 184;
      g.fillStyle = "#1F2430"; g.fillRect(0, 0, W, H);
      g.strokeStyle = "#F2F2F2"; g.lineWidth = 4; g.beginPath(); g.ellipse(240, 92, 170, 56, 0, 0, 7); g.stroke();
      var lap = Math.floor(t / 6), u = (t / 6) % 1;
      if (lap !== lastLap) { lastLap = lap; picked = false; dropped = false; }
      if (!picked && u > 0.02) { picked = true; carrying = (lap * 7 + 3) % 3 === 0 ? 1 : 0; }   // 0 = valuable, 1 = not
      var dropAt = carrying === 0 ? 0.25 : 0.75;
      if (picked && !dropped && carrying !== null && u > dropAt) { counts[carrying]++; dropped = true; carrying = null; }
      /* pickup point and bins */
      var p0 = pt(0);
      g.fillStyle = "#F2F2F2"; g.font = "600 11px system-ui, sans-serif"; g.textAlign = "center";
      g.fillText("Pickup", p0[0], 13);
      var bA = pt(0.25), bB = pt(0.75);
      g.fillStyle = "#B08D3C"; g.fillRect(bA[0] + 14, bA[1] - 16, 30, 32); g.fillStyle = "#6B7280"; g.fillRect(bB[0] - 44, bB[1] - 16, 30, 32);
      g.fillStyle = "#F2F2F2"; g.fillText("Valuable", 432, 60); g.fillText("Other", 48, 60);
      if (!picked) { g.fillStyle = (lap * 7 + 3) % 3 === 0 ? "#9AA1B5" : "#FFD166"; g.fillRect(p0[0] - 5, p0[1] - 17, 10, 10); }
      /* robot */
      var p = pt(u), q = pt(u + 0.01), a = Math.atan2(q[1] - p[1], q[0] - p[0]);
      g.save(); g.translate(p[0], p[1]); g.rotate(a);
      g.fillStyle = "#111318"; g.fillRect(-12, -11, 8, 5); g.fillRect(-12, 6, 8, 5); g.fillRect(4, -11, 8, 5); g.fillRect(4, 6, 8, 5);
      g.fillStyle = "#F2F2F2"; g.fillRect(-13, -8, 26, 16);
      g.fillStyle = "#D94C4C"; g.fillRect(9, -3, 4, 6);
      if (carrying !== null) { g.fillStyle = carrying === 0 ? "#FFD166" : "#9AA1B5"; g.fillRect(-5, -5, 10, 10); }
      g.restore();
      readout.textContent = "Sorted so far: " + counts[0] + " valuable, " + counts[1] + " other";
    });
    st.canvas.setAttribute("aria-label", "A robot following an oval line and dropping objects into two bins");
    el.appendChild(readout);
    note(el, "Illustrative animation of the behaviour, not a recording of the robot.");
    return st.stop;
  };

  /* Motor Works: spin the rotor. */
  demos.motor = function (el) {
    el.appendChild(h("p", { "class": "demo-title" }, "Try it: open the throttle"));
    var rpm = 1500, angle = 0, prev = 0;
    var st = stage(el, 480, 200, function (g, t) {
      var dt = Math.min(0.05, t - prev); prev = t;
      angle += dt * (rpm / 3000) * Math.PI * 4;       // slowed right down so the eye can follow it
      var W = 480, H = 200, cx = 240, cy = 100;
      g.fillStyle = "#1F2430"; g.fillRect(0, 0, W, H);
      g.fillStyle = "#2D3444"; g.beginPath(); g.arc(cx, cy, 90, 0, 7); g.fill();
      g.fillStyle = "#111318"; g.beginPath(); g.arc(cx, cy, 76, 0, 7); g.fill();
      var sector = Math.floor((((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 3));
      for (var i = 0; i < 6; i++) {
        var a = i * Math.PI / 3, on = rpm > 0 && (i % 3) === (sector % 3);
        g.save(); g.translate(cx + Math.cos(a) * 58, cy + Math.sin(a) * 58); g.rotate(a);
        g.fillStyle = on ? "#FFD166" : "#C8782A"; g.fillRect(-10, -12, 20, 24);
        g.fillStyle = on ? "#FFF1C2" : "#E79A4B"; g.fillRect(-10, -12, 4, 24);
        g.restore();
      }
      g.save(); g.translate(cx, cy); g.rotate(angle);
      g.fillStyle = "#9AA1B5"; g.beginPath(); g.arc(0, 0, 36, 0, 7); g.fill();
      for (var m = 0; m < 4; m++) {
        g.save(); g.rotate(m * Math.PI / 2);
        g.fillStyle = m % 2 ? "#3B82F6" : "#D94C4C"; g.fillRect(18, -9, 16, 18);
        g.restore();
      }
      g.fillStyle = "#33343F"; g.beginPath(); g.arc(0, 0, 7, 0, 7); g.fill();
      g.restore();
    });
    st.canvas.setAttribute("aria-label", "A brushless motor: rotor magnets turning inside six stator coils");
    var wrap = h("label", { "class": "demo-slider" });
    var txt = h("span", null, "Speed: 1500 RPM");
    var s = h("input", { type: "range", min: "0", max: "3000", step: "50", value: "1500", "aria-label": "Speed in RPM" });
    s.addEventListener("input", function () { rpm = +s.value; txt.textContent = "Speed: " + rpm + " RPM"; });
    wrap.appendChild(txt); wrap.appendChild(s); el.appendChild(wrap);
    note(el, "Illustrative animation, slowed down so the rotation is visible. The slider tops out at the motor's 3000 RPM peak.");
    return st.stop;
  };

  /* Launch Pad: the flight computer reads altitude from its barometer. */
  demos.rocket = function (el) {
    el.appendChild(h("p", { "class": "demo-title" }, "Try it: launch, and follow the barometer"));
    var t0 = null, now = 0;
    var status = h("p", { "class": "demo-readout", "aria-live": "polite" }, "On the pad. The flight computer's barometer is reading ground pressure.");
    var st = stage(el, 480, 220, function (g, t) {
      now = t;
      var W = 480, H = 220, e = t0 === null ? -1 : t - t0;
      var sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#0B1B3A"); sky.addColorStop(1, "#3B6FB5");
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      var y = 150, brakes = false, flame = false;
      if (e >= 0 && e < 3) { y = 150 - 110 * (1 - Math.pow(1 - e / 3, 2)); flame = e < 2.2; }
      else if (e >= 3 && e < 5.5) { y = 40 + (e - 3) * 3; brakes = true; }
      else if (e >= 5.5) { t0 = null; status.textContent = "On the pad. The flight computer's barometer is reading ground pressure."; btn.disabled = false; }
      if (e >= 0 && e < 3) status.textContent = "Ascent: pressure falls, and the flight computer turns it into altitude.";
      if (brakes) status.textContent = "Coasting to apogee. That altitude reading is why the BMP390 had to match the BMP180.";
      g.fillStyle = "#2F5D3A"; g.fillRect(0, 196, W, 24); g.fillStyle = "#6B7280"; g.fillRect(190, 188, 100, 10);
      g.fillStyle = "#8A8F9E"; g.fillRect(206, 110, 4, 80); g.fillRect(206, 110, 16, 3);
      /* telemetry: dashes from the rocket to a ground antenna */
      g.fillStyle = "#C9CCD6"; g.fillRect(400, 176, 4, 20); g.beginPath(); g.arc(402, 174, 9, Math.PI, 0); g.fill();
      if (e >= 0) {
        g.strokeStyle = "rgba(92,255,157,0.8)"; g.setLineDash([4, 6]); g.lineDashOffset = reduced ? 0 : -t * 40; g.lineWidth = 2;
        g.beginPath(); g.moveTo(248, y + 10); g.lineTo(402, 168); g.stroke(); g.setLineDash([]);
      }
      var x = 240;
      if (flame) { g.fillStyle = "#FFD166"; g.fillRect(x - 4, y + 38, 8, 14 + Math.sin(t * 40) * 4); g.fillStyle = "#F4733D"; g.fillRect(x - 2, y + 38, 4, 8); }
      g.fillStyle = "#F2F2F2"; g.fillRect(x - 7, y, 14, 38);
      g.fillStyle = "#4F2683"; g.fillRect(x - 5, y - 6, 10, 6); g.fillRect(x - 3, y - 10, 6, 4); g.fillRect(x - 1, y - 13, 2, 3);
      g.fillRect(x - 13, y + 28, 6, 10); g.fillRect(x + 7, y + 28, 6, 10);
      g.fillStyle = "#7FD4FF"; g.fillRect(x - 3, y + 6, 6, 6);
      
    });
    st.canvas.setAttribute("aria-label", "A rocket on a launch pad with a telemetry link to a ground antenna");
    var row = h("div", { "class": "demo-row" });
    var btn = h("button", { type: "button", "class": "demo-btn" }, "Launch");
    btn.addEventListener("click", function () {
      if (reduced) { status.textContent = "Ascent: pressure falls and the flight computer turns it into altitude, all the way to apogee."; return; }
      if (t0 === null) { t0 = now; btn.disabled = true; }
    });
    row.appendChild(btn); el.appendChild(row); el.appendChild(status);
    note(el, "Illustrative animation, not flight data.");
    return st.stop;
  };

  /* Data Observatory: the four model families that were compared. */
  demos.models = function (el) {
    el.appendChild(h("p", { "class": "demo-title" }, "Pick a model from the comparison"));
    var info = [
      ["SARIMA", "Seasonal ARIMA: the statistical baseline the neural models were measured against."],
      ["RNN", "Recurrent neural network: reads the series one month at a time and carries a hidden state forward."],
      ["GRU", "Gated recurrent unit: a recurrent network whose gates help it hold on to longer-term patterns."],
      ["TCN", "Temporal Convolutional Network: stacked dilated convolutions over the series. After Bayesian tuning, this was the model that excelled on the sparse, high-variance data and outperformed the SARIMA baselines."]
    ];
    var out = h("p", { "class": "demo-readout", "aria-live": "polite" }, info[3][1]);
    choice(el, info.map(function (i) { return i[0]; }), function (i) { out.textContent = info[i][1]; }, 3);
    el.appendChild(out);
    return function () {};
  };

  /* Op-Amp Fab: a Bode plot from a two-pole model fitted to the measured specs. */
  demos.bode = function (el) {
    el.appendChild(h("p", { "class": "demo-title" }, "Try it: sweep the frequency on the Bode plot"));
    var A0 = Math.pow(10, 72 / 20), fu = 28e6, PM = 62;
    var p2 = fu / Math.tan((90 - PM) * Math.PI / 180);
    var k2 = Math.sqrt(1 + Math.pow(fu / p2, 2));
    var p1 = fu / Math.sqrt(Math.pow(A0 / k2, 2) - 1);
    function mag(f) { return 20 * Math.log10(A0 / (Math.sqrt(1 + (f / p1) * (f / p1)) * Math.sqrt(1 + (f / p2) * (f / p2)))); }
    function ph(f) { return -(Math.atan(f / p1) + Math.atan(f / p2)) * 180 / Math.PI; }
    var lo = 1, hi = 9, pos = 0.82;
    function fOf(u) { return Math.pow(10, lo + u * (hi - lo)); }
    function fmt(f) {
      if (f >= 1e9) return (f / 1e9).toFixed(2) + " GHz";
      if (f >= 1e6) return (f / 1e6).toFixed(f >= 1e8 ? 0 : 1) + " MHz";
      if (f >= 1e3) return (f / 1e3).toFixed(f >= 1e5 ? 0 : 1) + " kHz";
      return f.toFixed(0) + " Hz";
    }
    var st = stage(el, 480, 250, function (g) {
      var L = 52, R = 468, t1 = 12, b1 = 116, t2 = 136, b2 = 226;
      function X(f) { return L + (Math.log10(f) - lo) / (hi - lo) * (R - L); }
      function Y1(db) { return b1 - (db + 20) / 100 * (b1 - t1); }
      function Y2(deg) { return t2 + (-deg) / 180 * (b2 - t2); }
      g.fillStyle = "#04140E"; g.fillRect(0, 0, 480, 250);
      g.strokeStyle = "#0E3A29"; g.lineWidth = 1;
      for (var d = lo; d <= hi; d++) { var xx = Math.round(X(Math.pow(10, d))) + 0.5; g.beginPath(); g.moveTo(xx, t1); g.lineTo(xx, b1); g.moveTo(xx, t2); g.lineTo(xx, b2); g.stroke(); }
      [0, 40, 80].forEach(function (db) { var yy = Math.round(Y1(db)) + 0.5; g.beginPath(); g.moveTo(L, yy); g.lineTo(R, yy); g.stroke(); });
      [-90, -180].forEach(function (dg) { var yy = Math.round(Y2(dg)) + 0.5; g.beginPath(); g.moveTo(L, yy); g.lineTo(R, yy); g.stroke(); });
      g.fillStyle = "#9DBFB0"; g.font = "600 10px ui-monospace, Menlo, monospace"; g.textAlign = "right"; g.textBaseline = "middle";
      [0, 40, 80].forEach(function (db) { g.fillText(db + " dB", L - 6, Y1(db)); });
      [0, -90, -180].forEach(function (dg) { g.fillText(dg + "°", L - 6, Y2(dg)); });
      g.textAlign = "center"; g.textBaseline = "top";
      [[1, "10 Hz"], [3, "1 kHz"], [5, "100 kHz"], [7, "10 MHz"], [9, "1 GHz"]].forEach(function (q) { g.fillText(q[1], Math.min(R - 18, Math.max(L + 16, X(Math.pow(10, q[0])))), b2 + 6); });
      /* curves */
      g.lineWidth = 2.5; g.lineJoin = "round";
      g.strokeStyle = "#5CFF9D"; g.beginPath();
      for (var i = 0; i <= 300; i++) { var f = fOf(i / 300), yv = Math.max(t1, Y1(mag(f))); if (i) g.lineTo(L + i / 300 * (R - L), yv); else g.moveTo(L, yv); }
      g.stroke();
      g.strokeStyle = "#7FD4FF"; g.beginPath();
      for (var j = 0; j <= 300; j++) { var f2 = fOf(j / 300), yp = Y2(ph(f2)); if (j) g.lineTo(L + j / 300 * (R - L), yp); else g.moveTo(L, yp); }
      g.stroke();
      /* unity-gain crossover and phase margin */
      var xu = X(fu);
      g.setLineDash([3, 4]); g.strokeStyle = "#FFD166"; g.lineWidth = 1; g.beginPath(); g.moveTo(xu, t1); g.lineTo(xu, b2); g.stroke(); g.setLineDash([]);
      g.strokeStyle = "#FFD166"; g.lineWidth = 3; g.beginPath(); g.moveTo(xu, Y2(ph(fu))); g.lineTo(xu, Y2(-180)); g.stroke();
      g.fillStyle = "#FFD166"; g.font = "700 11px ui-monospace, Menlo, monospace"; g.textAlign = "right"; g.textBaseline = "middle";
      g.fillText("62° margin", xu - 6, (Y2(ph(fu)) + Y2(-180)) / 2);
      g.fillText("0 dB at 28 MHz", xu - 6, Y1(0) + 12);
      g.fillStyle = "#5CFF9D"; g.fillText("gain", L + 6, Y1(76) - 2);
      g.fillStyle = "#7FD4FF"; g.fillText("phase", L + 6, Y2(-14));
      /* cursor */
      var fc = fOf(pos), xc = L + pos * (R - L);
      g.strokeStyle = "rgba(255,255,255,0.6)"; g.lineWidth = 1; g.beginPath(); g.moveTo(xc, t1); g.lineTo(xc, b2); g.stroke();
      g.fillStyle = "#FFFFFF";
      g.beginPath(); g.arc(xc, Math.max(t1, Y1(mag(fc))), 4, 0, 7); g.fill();
      g.beginPath(); g.arc(xc, Y2(ph(fc)), 4, 0, 7); g.fill();
    });
    st.canvas.setAttribute("aria-label", "Bode plot of the op-amp: gain falls through 0 dB at 28 MHz with 62 degrees of phase margin");
    var wrap = h("label", { "class": "demo-slider" });
    var txt = h("span", { "aria-live": "polite" }, "");
    var s = h("input", { type: "range", min: "0", max: "1000", value: String(pos * 1000), "aria-label": "Frequency" });
    function show() { var f = fOf(pos); txt.textContent = fmt(f) + ": gain " + mag(f).toFixed(1) + " dB, phase " + ph(f).toFixed(0) + "°"; }
    s.addEventListener("input", function () { pos = s.value / 1000; show(); st.redraw(); });
    wrap.appendChild(txt); wrap.appendChild(s); el.appendChild(wrap); show();
    note(el, "Curves come from a two-pole model fitted to the measured 72 dB gain, 28 MHz bandwidth and 62° phase margin, not from simulation output.");
    return st.stop;
  };

  /* VCO Ring: control voltage sets frequency. */
  demos.vco = function (el) {
    el.appendChild(h("p", { "class": "demo-title" }, "Try it: raise the control voltage"));
    var dv = 0.45, phase = 0, prev = 0;
    function fGHz() { return 0.6 + 2.0 * dv; }
    var st = stage(el, 480, 200, function (g, t) {
      var dt = Math.min(0.05, t - prev); prev = t;
      phase += dt * fGHz() * 0.45;
      g.fillStyle = "#04140E"; g.fillRect(0, 0, 480, 200);
      var cx = 110, cy = 100, R = 66;
      g.strokeStyle = "#B08D3C"; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
      var u = (phase * 2) % 1;
      for (var i = 0; i < 5; i++) {
        var a = -Math.PI / 2 + i * Math.PI * 2 / 5, active = Math.floor(u * 5) === i;
        g.save(); g.translate(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.rotate(a + Math.PI / 2);
        g.fillStyle = active ? "#FFD166" : "#C9CCD6";
        g.beginPath(); g.moveTo(-11, -12); g.lineTo(-11, 12); g.lineTo(12, 0); g.closePath(); g.fill();
        g.beginPath(); g.arc(16, 0, 4, 0, 7); g.fill();
        g.restore();
      }
      var ea = -Math.PI / 2 + u * Math.PI * 2;
      g.fillStyle = "#5CFF9D"; g.beginPath(); g.arc(cx + Math.cos(ea) * R, cy + Math.sin(ea) * R, 6, 0, 7); g.fill();
      g.fillStyle = "#9DBFB0"; g.font = "600 11px ui-monospace, Menlo, monospace"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText("5 stages", cx, cy);
      /* output waveform */
      var x0 = 230, x1 = 466, y0 = 50, y1 = 150;
      g.strokeStyle = "#0E3A29"; g.lineWidth = 1; g.strokeRect(x0 + 0.5, y0 - 20.5, x1 - x0, y1 - y0 + 40);
      g.strokeStyle = "#5CFF9D"; g.lineWidth = 2; g.beginPath();
      var cycles = 1.5 + fGHz() * 2.2;
      for (var p = 0; p <= x1 - x0; p++) {
        var v = ((p / (x1 - x0)) * cycles + phase) % 1, yy = v < 0.5 ? y0 : y1;
        if (p) g.lineTo(x0 + p, yy); else g.moveTo(x0, yy);
      }
      g.stroke();
      g.fillStyle = "#FFD166"; g.font = "700 16px ui-monospace, Menlo, monospace"; g.textAlign = "left"; g.textBaseline = "alphabetic";
      g.fillText(fGHz().toFixed(2) + " GHz", x0 + 6, y1 + 34);
    });
    st.canvas.setAttribute("aria-label", "A five-stage ring oscillator and its output waveform");
    var wrap = h("label", { "class": "demo-slider" });
    var txt = h("span", null, "");
    var s = h("input", { type: "range", min: "0", max: "900", step: "10", value: "450", "aria-label": "Control voltage above the bottom of the range, in millivolts" });
    function show() { txt.textContent = "Control voltage: +" + Math.round(dv * 1000) + " mV from the bottom of the range"; }
    s.addEventListener("input", function () { dv = s.value / 1000; show(); });
    wrap.appendChild(txt); wrap.appendChild(s); el.appendChild(wrap); show();
    note(el, "Illustrative animation, slowed down about a billion times. It uses the measured 0.6–2.4 GHz range and ≈2 GHz/V gain, treated as exactly linear.");
    return st.stop;
  };

  /* RISC-V Core: step a 5-stage pipeline through a load-use stall and a taken branch. */
  demos.pipeline = function (el) {
    el.appendChild(h("p", { "class": "demo-title" }, "Try it: step the clock through two hazards"));
    var prog = [["lw", "x1, 0(x2)"], ["add", "x3, x1, x4"], ["sub", "x5, x3, x6"], ["beq", "x5, x0, L"], ["or", "x7, x8, x9"], ["and", "x7, x8, x9"], ["xor", "x10, x5, x1"]];
    var B = "b";
    function F(i) { return { i: i, flushed: true }; }
    var C = [
      { s: [0, null, null, null, null], n: "Cycle 1: lw is fetched." },
      { s: [1, 0, null, null, null], n: "Cycle 2: add is fetched while lw is decoded." },
      { s: [2, 1, 0, null, null], n: "Cycle 3: add needs x1, but lw is only now in Execute. The loaded value won't exist until after Memory: a load-use hazard." },
      { s: [2, 1, B, 0, null], n: "Cycle 4: stall. add and sub hold where they are and a bubble goes into Execute. This is the one case forwarding can't fix." },
      { s: [3, 2, 1, B, 0], n: "Cycle 5: x1 is forwarded from write-back straight into Execute for add." },
      { s: [4, 3, 2, 1, B], n: "Cycle 6: sub needs x3 from add, one stage ahead. It is forwarded from Memory, so there is no stall." },
      { s: [5, 4, 3, 2, 1], n: "Cycle 7: beq is decided in Execute, and it is taken. or and and were already fetched from the wrong path." },
      { s: [6, F(5), F(4), 3, 2], n: "Cycle 8: flush. The two wrong-path instructions become bubbles, and fetch restarts at L." },
      { s: [null, 6, B, B, 3], n: "Cycle 9: one cycle was lost to the load-use stall and two to the branch." },
      { s: [null, null, 6, B, B], n: "Cycle 10: xor executes." },
      { s: [null, null, null, 6, B], n: "Cycle 11." },
      { s: [null, null, null, null, 6], n: "Cycle 12: xor writes back. Five useful instructions took 12 cycles, against 9 with no hazards." }
    ];
    var names = ["Fetch", "Decode", "Execute", "Memory", "Write-back"];
    var pipe = h("div", { "class": "pipe" }), cells = [];
    names.forEach(function (n) {
      var c = h("div", { "class": "pipe-stage" });
      c.appendChild(h("span", { "class": "pipe-name" }, n));
      var v = h("span", { "class": "pipe-op" }); c.appendChild(v);
      pipe.appendChild(c); cells.push(v);
    });
    el.appendChild(pipe);
    var noteP = h("p", { "class": "demo-readout", "aria-live": "polite" });
    var row = h("div", { "class": "demo-row" });
    var step = h("button", { type: "button", "class": "demo-btn" }, "Step clock");
    var reset = h("button", { type: "button", "class": "demo-btn" }, "Reset");
    row.appendChild(step); row.appendChild(reset);
    el.appendChild(row); el.appendChild(noteP);
    var cyc = -1;
    function render() {
      var cur = cyc >= 0 ? C[cyc].s : [null, null, null, null, null];
      cur.forEach(function (x, k) {
        var v = cells[k]; v.textContent = ""; v.className = "pipe-op";
        if (x === null) { v.textContent = "—"; v.className += " empty"; }
        else if (x === B) { v.textContent = "bubble"; v.className += " bubble"; }
        else if (typeof x === "object") { v.appendChild(h("b", null, prog[x.i][0])); v.appendChild(h("span", null, "flushed")); v.className += " flushed"; }
        else { v.appendChild(h("b", null, prog[x][0])); v.appendChild(h("span", null, prog[x][1])); }
      });
      noteP.textContent = cyc >= 0 ? C[cyc].n : "Press Step clock to run lw, add, sub, beq, then the branch target L: xor.";
      step.disabled = cyc >= C.length - 1;
    }
    step.addEventListener("click", function () { if (cyc < C.length - 1) { cyc++; render(); } });
    reset.addEventListener("click", function () { cyc = -1; render(); step.focus(); });
    render();
    note(el, "A teaching example of the hazards this core handles, not a trace from it. It assumes the branch resolves in Execute.");
    return function () {};
  };

  /* ADC & PLL Models: how a SAR ADC finds its code, one bit per step. */
  demos.sar = function (el) {
    el.appendChild(h("p", { "class": "demo-title" }, "Try it: watch a 10-bit SAR ADC search for the code"));
    var N = 10, vin = 0.637, bit, code, trials;
    function reset() { bit = N - 1; code = 0; trials = []; }
    function stepOnce() {
      if (bit < 0) return;
      var trial = code | (1 << bit), lvl = trial / (1 << N), keep = vin >= lvl;
      trials.push({ bit: bit, lvl: lvl, keep: keep });
      if (keep) code = trial;
      bit--;
    }
    reset();
    var st = stage(el, 480, 190, function (g) {
      var L = 46, R = 466, T0 = 14, B0 = 170;
      function Y(v) { return B0 - v * (B0 - T0); }
      g.fillStyle = "#04140E"; g.fillRect(0, 0, 480, 190);
      g.strokeStyle = "#0E3A29"; g.lineWidth = 1;
      [0, 0.25, 0.5, 0.75, 1].forEach(function (v) { var yy = Math.round(Y(v)) + 0.5; g.beginPath(); g.moveTo(L, yy); g.lineTo(R, yy); g.stroke(); });
      g.fillStyle = "#9DBFB0"; g.font = "600 10px ui-monospace, Menlo, monospace"; g.textAlign = "right"; g.textBaseline = "middle";
      [[0, "0"], [0.5, "½ Vref"], [1, "Vref"]].forEach(function (q) { g.fillText(q[1], L - 6, Y(q[0])); });
      g.strokeStyle = "#FFD166"; g.lineWidth = 2; g.setLineDash([6, 4]); g.beginPath(); g.moveTo(L, Y(vin)); g.lineTo(R, Y(vin)); g.stroke(); g.setLineDash([]);
      g.fillStyle = "#FFD166"; g.textAlign = "right"; g.fillText("input", R - 4, Y(vin) - 9);
      var w = (R - L) / N;
      trials.forEach(function (t, i) {
        var x = L + i * w;
        g.fillStyle = t.keep ? "rgba(92,255,157,0.85)" : "rgba(217,76,76,0.85)";
        g.fillRect(x + 4, Y(t.lvl), w - 8, B0 - Y(t.lvl));
        g.fillStyle = "#04140E"; g.textAlign = "center"; g.font = "700 11px ui-monospace, Menlo, monospace";
        g.fillText(t.keep ? "1" : "0", x + w / 2, B0 - 9);
      });
    });
    st.canvas.setAttribute("aria-label", "Each step tries one more bit of the DAC level against the input voltage");
    var readout = h("p", { "class": "demo-readout", "aria-live": "polite" });
    var row = h("div", { "class": "demo-row" });
    var bStep = h("button", { type: "button", "class": "demo-btn" }, "Next bit");
    var bAll = h("button", { type: "button", "class": "demo-btn" }, "Finish");
    var bReset = h("button", { type: "button", "class": "demo-btn" }, "Reset");
    [bStep, bAll, bReset].forEach(function (b) { row.appendChild(b); });
    var wrap = h("label", { "class": "demo-slider" });
    var vt = h("span", null, "");
    var s = h("input", { type: "range", min: "0", max: "1000", value: String(vin * 1000), "aria-label": "Input voltage as a fraction of Vref" });
    function bin(c) { var t = c.toString(2); while (t.length < N) t = "0" + t; return t; }
    function render() {
      vt.textContent = "Input: " + vin.toFixed(3) + " × Vref";
      var t = trials[trials.length - 1];
      if (!t) readout.textContent = "Each step sets the next bit to 1, compares the DAC level with the input, and keeps the bit only if the input is still higher.";
      else if (bit >= 0) readout.textContent = "Bit " + t.bit + ": tried " + t.lvl.toFixed(3) + " × Vref. The input is " + (t.keep ? "higher, so keep the 1." : "lower, so clear it.") + " Code so far " + bin(code) + ".";
      else readout.textContent = "Done in 10 steps: code " + bin(code) + " = " + code + ", or " + (code / 1024).toFixed(3) + " × Vref.";
      bStep.disabled = bAll.disabled = bit < 0;
      st.redraw();
    }
    bStep.addEventListener("click", function () { stepOnce(); render(); });
    bAll.addEventListener("click", function () { while (bit >= 0) stepOnce(); render(); });
    bReset.addEventListener("click", function () { reset(); render(); });
    s.addEventListener("input", function () { vin = s.value / 1000; reset(); render(); });
    wrap.appendChild(vt); wrap.appendChild(s);
    el.appendChild(wrap); el.appendChild(row); el.appendChild(readout);
    render();
    note(el, "A concept demo of the successive-approximation search. The project's real-number model was held to ±0.5 LSB of SPICE.");
    return st.stop;
  };

  /* Switchgear Yard: selective coordination on a four-feeder lineup. */
  demos.feeders = function (el) {
    el.appendChild(h("p", { "class": "demo-title" }, "Try it: put a fault on one feeder"));
    var fault = -1, t0 = 0, now = 0;
    var status = h("p", { "class": "demo-readout", "aria-live": "polite" }, "All four feeders are energized.");
    var st = stage(el, 480, 230, function (g, t) {
      now = t;
      var tripped = fault >= 0 && (reduced || t - t0 > 0.6);
      var live = "#FFD166", dead = "#4B5563";
      g.fillStyle = "#04140E"; g.fillRect(0, 0, 480, 230);
      g.strokeStyle = live; g.lineWidth = 3;
      g.beginPath(); g.arc(240, 26, 14, 0, 7); g.stroke();
      g.fillStyle = "#9DBFB0"; g.font = "600 11px ui-monospace, Menlo, monospace"; g.textAlign = "left"; g.textBaseline = "middle";
      g.fillText("13.8 kV source", 262, 26);
      g.beginPath(); g.moveTo(240, 40); g.lineTo(240, 58); g.moveTo(240, 74); g.lineTo(240, 90); g.stroke();
      g.fillStyle = "#D94C4C"; g.fillRect(232, 58, 16, 16);
      g.fillStyle = "#9DBFB0"; g.fillText("main", 256, 66);
      g.strokeStyle = live; g.lineWidth = 5; g.beginPath(); g.moveTo(60, 92); g.lineTo(420, 92); g.stroke();
      g.fillStyle = "#9DBFB0"; g.textAlign = "right"; g.fillText("bus", 52, 92);
      for (var i = 0; i < 4; i++) {
        var x = 90 + i * 100, open = tripped && i === fault, c = open ? dead : live;
        g.strokeStyle = live; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 94); g.lineTo(x, 116); g.stroke();
        if (open) { g.strokeStyle = "#2BB673"; g.lineWidth = 2; g.strokeRect(x - 8, 116, 16, 16); }
        else { g.fillStyle = "#D94C4C"; g.fillRect(x - 8, 116, 16, 16); }
        g.strokeStyle = c; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 132); g.lineTo(x, 182); g.stroke();
        g.fillStyle = c; g.beginPath(); g.moveTo(x - 7, 182); g.lineTo(x + 7, 182); g.lineTo(x, 194); g.closePath(); g.fill();
        g.fillStyle = "#9DBFB0"; g.textAlign = "center"; g.fillText("Feeder " + (i + 1), x, 210);
        if (i === fault) {
          var blink = reduced || tripped || Math.floor(t * 8) % 2 === 0;
          if (blink) {
            g.fillStyle = "#FF5A5A";
            g.beginPath(); g.moveTo(x + 14, 146); g.lineTo(x + 6, 160); g.lineTo(x + 12, 160); g.lineTo(x + 4, 174); g.lineTo(x + 20, 156); g.lineTo(x + 13, 156); g.lineTo(x + 20, 146); g.closePath(); g.fill();
          }
        }
      }
      g.textAlign = "left"; g.fillStyle = "#D94C4C"; g.fillRect(14, 16, 8, 8); g.fillStyle = "#9DBFB0"; g.fillText("closed", 27, 20);
      g.strokeStyle = "#2BB673"; g.lineWidth = 1.5; g.strokeRect(14, 32, 8, 8); g.fillText("open", 27, 36);
      if (fault >= 0 && tripped) status.textContent = "Feeder " + (fault + 1) + "'s breaker is nearest the fault, so it trips first. The main breaker's curve sits above it, so it waits, and the other three feeders stay on.";
    });
    st.canvas.setAttribute("aria-label", "Single-line diagram: a source, a main breaker, a bus and four feeders, each with its own breaker");
    var row = h("div", { "class": "demo-row" });
    [0, 1, 2, 3].forEach(function (i) {
      var b = h("button", { type: "button", "class": "demo-btn" }, "Fault on " + (i + 1));
      b.addEventListener("click", function () { fault = i; t0 = now; status.textContent = "Fault on Feeder " + (i + 1) + "."; st.redraw(); });
      row.appendChild(b);
    });
    var rb = h("button", { type: "button", "class": "demo-btn" }, "Reset");
    rb.addEventListener("click", function () { fault = -1; status.textContent = "All four feeders are energized."; st.redraw(); });
    row.appendChild(rb);
    el.appendChild(row); el.appendChild(status);
    note(el, "Concept of selective coordination, not the project's relay settings. Red is closed and green is open, as on North American switchgear.");
    return st.stop;
  };

  CW.demos = demos;
})();
