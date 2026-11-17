/* engine.js: game loop, keyboard and touch input, camera, collision, drawing. */
(function () {
  var CW = (window.CW = window.CW || {});
  var SPEED = 96;             // world pixels per second = 6 tiles per second
  var NEAR = 22;              // how close to a door pad counts as "at the door"
  var STORE = "circuit-world-explored";

  var canvas, g, world, ui;
  var S = 2, dpr = 1, vw = 0, vh = 0;      // S = device pixels per world pixel
  var cam = { x: 0, y: 0 };
  var player = { x: 0, y: 0, dir: "down", moving: false, t: 0 };
  var keys = {};
  var stick = null;           // { ox, oy, x, y, id, t0, moved }
  var mode = "title";         // "title" | "play" | "paused"
  var explored = {};
  var near = null;
  var clock = 0, last = 0;
  var reduced = false;

  /* ---- tiny synthesized sounds, off until the visitor turns them on ---- */
  var sfx = {
    on: false, ctx: null,
    play: function (freqs, dur) {
      if (!sfx.on) return;
      try {
        sfx.ctx = sfx.ctx || new (window.AudioContext || window.webkitAudioContext)();
        var t = sfx.ctx.currentTime;
        freqs.forEach(function (f, i) {
          var o = sfx.ctx.createOscillator(), a = sfx.ctx.createGain();
          o.type = "square"; o.frequency.value = f;
          a.gain.setValueAtTime(0.05, t + i * dur); a.gain.exponentialRampToValueAtTime(0.001, t + (i + 1) * dur);
          o.connect(a); a.connect(sfx.ctx.destination); o.start(t + i * dur); o.stop(t + (i + 1) * dur);
        });
      } catch (e) { /* no audio available: stay silent */ }
    }
  };

  function load() {
    try { (JSON.parse(localStorage.getItem(STORE)) || []).forEach(function (id) { explored[id] = true; }); } catch (e) { /* storage unavailable */ }
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(Object.keys(explored))); } catch (e) { /* storage unavailable */ }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    var cw = window.innerWidth, ch = window.innerHeight;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    canvas.style.width = cw + "px"; canvas.style.height = ch + "px";
    /* a whole number of device pixels per world pixel, with about 13 tiles along the shorter side */
    S = Math.max(2, Math.floor(Math.min(canvas.width, canvas.height) / (world.T * 13)));
    vw = canvas.width / S; vh = canvas.height / S;
    snapCamera();
  }

  function camTarget() {
    var tx = player.x - vw / 2, ty = player.y - 12 - vh / 2;
    tx = vw >= world.W ? (world.W - vw) / 2 : Math.max(0, Math.min(world.W - vw, tx));
    ty = vh >= world.H ? (world.H - vh) / 2 : Math.max(0, Math.min(world.H - vh, ty));
    return { x: tx, y: ty };
  }
  function snapCamera() { var t = camTarget(); cam.x = t.x; cam.y = t.y; }

  function blocked(x, y) {
    var x0 = x - 5, x1 = x + 5, y0 = y - 6, y1 = y, T = world.T;
    if (x0 < T || x1 > world.W - T || y0 < T || y1 > world.H - T) return true;
    for (var i = 0; i < world.solids.length; i++) {
      var r = world.solids[i];
      if (x1 > r.x && x0 < r.x + r.w && y1 > r.y && y0 < r.y + r.h) return true;
    }
    return false;
  }

  function inputVector() {
    var x = 0, y = 0;
    if (keys.ArrowLeft || keys.a) x -= 1;
    if (keys.ArrowRight || keys.d) x += 1;
    if (keys.ArrowUp || keys.w) y -= 1;
    if (keys.ArrowDown || keys.s) y += 1;
    if (stick && stick.moved) {
      var dx = stick.x - stick.ox, dy = stick.y - stick.oy, len = Math.hypot(dx, dy);
      if (len > 8) { x = dx / len; y = dy / len; }
    }
    var l = Math.hypot(x, y);
    return l > 0 ? { x: x / l, y: y / l } : null;
  }

  function findNear() {
    var best = null, bd = NEAR;
    world.zones.forEach(function (z) {
      if (!z.project) return;
      var d = Math.hypot(player.x - z.pad.x, player.y - 3 - z.pad.y);
      if (d < bd) { bd = d; best = { type: "zone", zone: z }; }
    });
    var dh = Math.hypot(player.x - world.hub.pad.x, player.y - 3 - world.hub.pad.y);
    if (dh < bd + 4) best = { type: "hub" };
    return best;
  }

  function update(dt) {
    clock += dt;
    if (mode === "play") {
      var v = inputVector();
      player.moving = !!v;
      if (v) {
        var nx = player.x + v.x * SPEED * dt, ny = player.y + v.y * SPEED * dt;
        if (!blocked(nx, player.y)) player.x = nx;
        if (!blocked(player.x, ny)) player.y = ny;
        player.dir = Math.abs(v.x) > Math.abs(v.y) ? (v.x > 0 ? "right" : "left") : (v.y > 0 ? "down" : "up");
        player.t += dt;
      } else player.t = 0;
      var n = findNear();
      var changed = (n && n.type) !== (near && near.type) || (n && n.zone) !== (near && near.zone);
      near = n;
      if (changed) ui.setNear(near);
    } else player.moving = false;
    var t = camTarget();
    if (reduced) { cam.x = t.x; cam.y = t.y; }
    else { var k = 1 - Math.pow(0.001, dt); cam.x += (t.x - cam.x) * k; cam.y += (t.y - cam.y) * k; }
  }

  function pointOnPath(path, dist) {
    for (var i = 0; i < path.length - 1; i++) {
      var l = Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]);
      if (dist <= l) { var f = l ? dist / l : 0; return [path[i][0] + (path[i + 1][0] - path[i][0]) * f, path[i][1] + (path[i + 1][1] - path[i][1]) * f]; }
      dist -= l;
    }
    return path[path.length - 1];
  }
  function pathLength(path) {
    var s = 0;
    for (var i = 0; i < path.length - 1; i++) s += Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]);
    return s;
  }

  var shot = { x: 0, y: 0 };   // the camera position this frame was drawn with
  function label(text, wx, wy, color, dim, left) {
    var sx = (wx - shot.x) * S, sy = (wy - shot.y) * S;
    var fs = Math.round(11 * dpr);
    g.font = "700 " + fs + "px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    var w = g.measureText(text).width + 12 * dpr, h = fs + 8 * dpr;
    var x0 = left ? sx : sx - w / 2;
    if (x0 + w < 0 || x0 > canvas.width || sy < -h || sy > canvas.height + h) return;
    g.fillStyle = dim ? "rgba(4,20,14,0.55)" : "rgba(4,20,14,0.85)";
    g.fillRect(Math.round(x0), Math.round(sy - h), Math.round(w), Math.round(h));
    g.fillStyle = color; g.textAlign = left ? "left" : "center"; g.textBaseline = "middle";
    g.fillText(text, Math.round(left ? x0 + 6 * dpr : sx), Math.round(sy - h / 2));
  }

  function draw() {
    var PAL = CW.art.PAL;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = "#04140E"; g.fillRect(0, 0, canvas.width, canvas.height);
    var cx = Math.round(cam.x * S) / S, cy = Math.round(cam.y * S) / S;
    shot.x = cx; shot.y = cy;
    g.setTransform(S, 0, 0, S, -cx * S, -cy * S);
    g.imageSmoothingEnabled = false;
    g.drawImage(world.canvas, 0, 0);

    /* lit traces for explored zones */
    world.zones.forEach(function (z) {
      if (!z.project || !explored[z.project.id]) return;
      g.globalAlpha = 0.25; world.strokePath(g, z.path, PAL.traceLit, 8);
      g.globalAlpha = 1; world.strokePath(g, z.path, PAL.traceLit, 3);
      if (!reduced) {
        var len = pathLength(z.path), p = pointOnPath(z.path, (clock * 70 + z.index * 37) % len);
        g.fillStyle = "#FFFFFF"; g.fillRect(Math.round(p[0]) - 2, Math.round(p[1]) - 2, 4, 4);
      }
    });

    /* door pad pulse */
    if (near && mode === "play") {
      var pad = near.type === "hub" ? world.hub.pad : near.zone.pad;
      var r = 11 + (reduced ? 0 : Math.sin(clock * 6) * 2);
      g.strokeStyle = "#FFFFFF"; g.lineWidth = 1.5; g.strokeRect(pad.x - r, pad.y - r, r * 2, r * 2);
    }

    /* guidance: a chevron pointing at the nearest unexplored zone */
    if (mode === "play") {
      var target = null, td = 1e9;
      world.zones.forEach(function (z) {
        if (!z.project || explored[z.project.id]) return;
        var d = Math.hypot(z.pad.x - player.x, z.pad.y - player.y);
        if (d < td) { td = d; target = z; }
      });
      if (target && td > 70) {
        var a = Math.atan2(target.pad.y - (player.y - 10), target.pad.x - player.x);
        var px = player.x + Math.cos(a) * 26, py = player.y - 10 + Math.sin(a) * 26;
        g.save(); g.translate(px, py); g.rotate(a);
        g.globalAlpha = reduced ? 0.9 : 0.55 + Math.sin(clock * 5) * 0.35;
        g.fillStyle = PAL.traceLit; g.beginPath(); g.moveTo(6, 0); g.lineTo(-3, -5); g.lineTo(-1, 0); g.lineTo(-3, 5); g.closePath(); g.fill();
        g.restore();
      }
    }

    /* Dhru */
    var seq = [1, 0, 2, 0], f = player.moving ? seq[Math.floor(player.t * 8) % 4] : 0;
    g.fillStyle = "rgba(0,0,0,0.3)"; g.beginPath(); g.ellipse(player.x, player.y, 6, 2.5, 0, 0, 7); g.fill();
    g.drawImage(CW.art.player[player.dir][f], Math.round(player.x - 8), Math.round(player.y - 24));

    /* labels and joystick in screen space, so text stays sharp */
    g.setTransform(1, 0, 0, 1, 0, 0);
    /* district names stay pinned to the left edge of the view while you walk through a district */
    (world.districts || []).forEach(function (d) {
      var lx = Math.max(d.rect.x + 8, shot.x + 8 * dpr / S);
      if (lx < d.rect.x + d.rect.w - 120) label(d.name.toUpperCase(), lx, d.rect.y + 15, PAL.gold, false, true);
    });
    world.zones.forEach(function (z) {
      var done = z.project && explored[z.project.id];
      label((done ? "✓ " : "") + z.name, z.rect.x + z.rect.w / 2, z.rect.y - 3, z.project ? (done ? PAL.traceLit : "#FFFFFF") : "#8FB5A5", !z.project);
    });
    if (stick && stick.moved && mode === "play") {
      g.strokeStyle = "rgba(255,255,255,0.5)"; g.lineWidth = 2 * dpr;
      g.beginPath(); g.arc(stick.ox * dpr, stick.oy * dpr, 40 * dpr, 0, 7); g.stroke();
      var dx = stick.x - stick.ox, dy = stick.y - stick.oy, l = Math.hypot(dx, dy), m = Math.min(l, 40);
      g.fillStyle = "rgba(255,255,255,0.6)"; g.beginPath();
      g.arc((stick.ox + (l ? dx / l * m : 0)) * dpr, (stick.oy + (l ? dy / l * m : 0)) * dpr, 16 * dpr, 0, 7); g.fill();
    }
  }

  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
    update(dt); draw();
    requestAnimationFrame(frame);
  }

  function interact() {
    if (mode !== "play" || !near) return;
    sfx.play([660, 880], 0.07);
    if (near.type === "hub") ui.openAbout(); else ui.openProject(near.zone.project.id);
  }

  function bind() {
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", function (e) {
      var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (mode === "play" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "d", "w", "s"].indexOf(k) >= 0) { keys[k] = true; e.preventDefault(); }
        var onButton = document.activeElement && document.activeElement.tagName === "BUTTON";
        if (k === "e" || ((k === " " || k === "Enter") && !onButton)) { e.preventDefault(); interact(); }
        if (k === "m") ui.openMap();
      }
    });
    window.addEventListener("keyup", function (e) { var k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys[k] = false; });
    window.addEventListener("blur", function () { keys = {}; stick = null; });

    canvas.addEventListener("pointerdown", function (e) {
      if (mode !== "play") return;
      stick = { ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY, id: e.pointerId, moved: false };
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* fine without capture */ }
      e.preventDefault();
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!stick || e.pointerId !== stick.id) return;
      stick.x = e.clientX; stick.y = e.clientY;
      if (Math.hypot(stick.x - stick.ox, stick.y - stick.oy) > 8) stick.moved = true;
    });
    function up(e) {
      if (!stick || e.pointerId !== stick.id) return;
      var tap = !stick.moved; stick = null;
      if (tap && near && mode === "play") {
        /* a tap on the building or pad you are standing at opens it */
        var wx = shot.x + e.clientX * dpr / S, wy = shot.y + e.clientY * dpr / S;
        var r = near.type === "hub" ? world.hub.rect : near.zone.rect, pad = near.type === "hub" ? world.hub.pad : near.zone.pad;
        var inRect = wx > r.x && wx < r.x + r.w && wy > r.y && wy < r.y + r.h;
        if (inRect || Math.hypot(wx - pad.x, wy - pad.y) < 16) interact();
      }
    }
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", function () { stick = null; });
  }

  CW.engine = {
    sfx: sfx,
    init: function (canvasEl, worldObj, uiObj) {
      canvas = canvasEl; g = canvas.getContext("2d"); world = worldObj; ui = uiObj;
      try { reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { reduced = false; }
      load();
      player.x = world.hub.pad.x; player.y = world.hub.pad.y + 10;
      resize(); bind();
      requestAnimationFrame(frame);
    },
    setMode: function (m) {
      mode = m; keys = {}; stick = null;
      if (m !== "play") { near = null; ui.setNear(null); }
    },
    getMode: function () { return mode; },
    interact: interact,
    isExplored: function (id) { return !!explored[id]; },
    exploredCount: function () {
      return world.zones.filter(function (z) { return z.project && explored[z.project.id]; }).length;
    },
    total: function () { return world.zones.filter(function (z) { return z.project; }).length; },
    markExplored: function (id) {
      if (explored[id]) return false;
      explored[id] = true; save(); sfx.play([523, 659, 784], 0.08);
      return true;
    },
    reset: function () { explored = {}; save(); },
    teleport: function (target) {
      var pad = target === "hub" ? world.hub.pad : target.pad;
      player.x = pad.x; player.y = pad.y + (target === "hub" ? 10 : 4); player.dir = "down";
      if (blocked(player.x, player.y)) player.y = pad.y + 12;
      snapCamera();
    },
    world: function () { return world; }
  };
})();
