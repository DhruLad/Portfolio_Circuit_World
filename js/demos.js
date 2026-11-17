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

  /* Launch Pad: ascent, then air brakes. */
  demos.rocket = function (el) {
    el.appendChild(h("p", { "class": "demo-title" }, "Try it: launch, then watch the air brakes deploy"));
    var t0 = null, now = 0;
    var status = h("p", { "class": "demo-readout", "aria-live": "polite" }, "On the pad. Avionics ready.");
    var st = stage(el, 480, 220, function (g, t) {
      now = t;
      var W = 480, H = 220, e = t0 === null ? -1 : t - t0;
      var sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#0B1B3A"); sky.addColorStop(1, "#3B6FB5");
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      var y = 150, brakes = false, flame = false;
      if (e >= 0 && e < 3) { y = 150 - 110 * (1 - Math.pow(1 - e / 3, 2)); flame = e < 2.2; }
      else if (e >= 3 && e < 5.5) { y = 40 + (e - 3) * 3; brakes = true; }
      else if (e >= 5.5) { t0 = null; status.textContent = "On the pad. Avionics ready."; btn.disabled = false; }
      if (e >= 0 && e < 3) status.textContent = "Ascent. Telemetry streaming to the ground station.";
      if (brakes) status.textContent = "Air brakes deployed.";
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
      if (brakes) { g.fillStyle = "#D94C4C"; g.fillRect(x - 17, y + 14, 10, 3); g.fillRect(x + 7, y + 14, 10, 3); }
    });
    st.canvas.setAttribute("aria-label", "A rocket on a launch pad with a telemetry link to a ground antenna");
    var row = h("div", { "class": "demo-row" });
    var btn = h("button", { type: "button", "class": "demo-btn" }, "Launch");
    btn.addEventListener("click", function () {
      if (reduced) { status.textContent = "Ascent with telemetry streaming, then the air brakes deploy near the top of the flight."; return; }
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
      ["TCN", "Temporal Convolutional Network: stacked dilated convolutions over the series. After Bayesian tuning, this was the model that excelled on sparse, high-variance data."]
    ];
    var out = h("p", { "class": "demo-readout", "aria-live": "polite" }, info[3][1]);
    choice(el, info.map(function (i) { return i[0]; }), function (i) { out.textContent = info[i][1]; }, 3);
    el.appendChild(out);
    return function () {};
  };

  CW.demos = demos;
})();
