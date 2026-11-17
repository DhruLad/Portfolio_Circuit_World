/* world.js: builds the circuit board from content.js: hub, sockets, zones, traces. */
(function () {
  var CW = (window.CW = window.CW || {});
  var T = 16;                 // tile size in world pixels
  var COLS = 60, ROWS = 44;   // board size in tiles
  var BW = 6, BH = 4;         // building size in tiles
  var HUB = { x: 21, y: 19, w: 18, h: 6 };

  /* 12 sockets in a rectangular ring, numbered clockwise from the top-left. */
  function ringSockets() {
    var s = [];
    [5, 21, 33, 49].forEach(function (x) { s.push({ side: "top", x: x, y: 5 }); });
    s.push({ side: "right", x: 51, y: 15 }); s.push({ side: "right", x: 51, y: 25 });
    [49, 33, 21, 5].forEach(function (x) { s.push({ side: "bottom", x: x, y: 35 }); });
    s.push({ side: "left", x: 3, y: 25 }); s.push({ side: "left", x: 3, y: 15 });
    return s;
  }

  /* Trace from a zone's door pad to the hub, in tile units. */
  function tracePath(sock) {
    var cx = sock.x + BW / 2, cy = sock.y + BH / 2;
    var hx0 = HUB.x, hx1 = HUB.x + HUB.w, hy0 = HUB.y, hy1 = HUB.y + HUB.h, pin;
    if (sock.side === "top" || sock.side === "bottom") {
      var top = sock.side === "top";
      var py = top ? sock.y + BH + 0.5 : sock.y - 0.5;
      var edge = top ? hy0 : hy1, lane = top ? 13.5 : 30.5;
      if (cx > hx0 + 1 && cx < hx1 - 1) return [[cx, py], [cx, edge]];
      pin = cx < (hx0 + hx1) / 2 ? hx0 + 1.5 : hx1 - 1.5;
      return [[cx, py], [cx, lane], [pin, lane], [pin, edge]];
    }
    var left = sock.side === "left";
    var px = left ? sock.x + BW + 0.5 : sock.x - 0.5;
    var hedge = left ? hx0 : hx1, lane2 = left ? 14.5 : 45.5;
    pin = cy < (hy0 + hy1) / 2 ? hy0 + 1.5 : hy1 - 1.5;
    return [[px, cy], [lane2, cy], [lane2, pin], [hedge, pin]];
  }

  /* Cut each corner at 45 degrees, the way PCB traces are routed. */
  function chamfer(pts, c) {
    var out = [pts[0]];
    for (var i = 1; i < pts.length - 1; i++) {
      var a = pts[i - 1], b = pts[i], d = pts[i + 1];
      var l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(d[0] - b[0], d[1] - b[1]);
      var k = Math.min(c, l1 / 2, l2 / 2);
      out.push([b[0] - (b[0] - a[0]) / l1 * k, b[1] - (b[1] - a[1]) / l1 * k]);
      out.push([b[0] + (d[0] - b[0]) / l2 * k, b[1] + (d[1] - b[1]) / l2 * k]);
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  function strokePath(g, pts, color, width) {
    g.strokeStyle = color; g.lineWidth = width; g.lineJoin = "round"; g.lineCap = "round";
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.stroke();
  }

  function rand(seed) { var x = Math.sin(seed * 127.1) * 43758.5453; return x - Math.floor(x); }

  function build(content) {
    var A = CW.art, PAL = A.PAL;
    var projects = content.projects || [];
    var sockets = ringSockets();
    /* A thirteenth project: the board grows downward by a row of four more sockets at a time. */
    var extraRows = Math.max(0, Math.ceil((projects.length - 12) / 4));
    var rows = ROWS + extraRows * 8;
    for (var e = 0; e < extraRows; e++) {
      [5, 21, 33, 49].forEach(function (x) { sockets.push({ side: "bottom2", x: x, y: 43 + e * 8 }); });
    }

    /* Place projects: an explicit `socket` wins, the rest fill in order. */
    var taken = {};
    projects.forEach(function (p) {
      if (p.socket >= 1 && p.socket <= sockets.length && !taken[p.socket - 1]) taken[p.socket - 1] = p;
    });
    var next = 0;
    projects.forEach(function (p) {
      for (var k in taken) if (taken[k] === p) return;
      while (taken[next]) next++;
      if (next < sockets.length) taken[next] = p;
    });

    var zones = [], solids = [];
    sockets.forEach(function (s, i) {
      var p = taken[i] || null;
      var cx = s.x + BW / 2, cy = s.y + BH / 2, pad, pathTiles;
      if (s.side === "bottom2") {
        pad = [cx, s.y - 0.5];
        pathTiles = [[cx, s.y - 0.5], [cx, s.y - 2.5]];
      } else {
        pathTiles = tracePath(s);
        pad = pathTiles[0];
      }
      var z = {
        index: i, number: i + 1, project: p, side: s.side,
        rect: { x: s.x * T, y: s.y * T, w: BW * T, h: BH * T },
        pad: { x: pad[0] * T, y: pad[1] * T },
        path: chamfer(pathTiles.map(function (q) { return [q[0] * T, q[1] * T]; }), 7),
        name: p ? p.zone : "Coming soon"
      };
      zones.push(z);
      if (p) solids.push({ x: z.rect.x + 6, y: z.rect.y + 6, w: z.rect.w - 12, h: z.rect.h - 8 });
    });

    var hub = {
      rect: { x: HUB.x * T, y: HUB.y * T, w: HUB.w * T, h: HUB.h * T },
      pad: { x: (HUB.x + HUB.w / 2) * T, y: (HUB.y + HUB.h + 1.2) * T },
      name: "MCU Plaza"
    };
    solids.push({ x: hub.rect.x - 2, y: hub.rect.y - 2, w: hub.rect.w + 4, h: hub.rect.h + 4 });

    var W = COLS * T, H = rows * T;

    /* ---- Static layer: drawn once ---- */
    var c = document.createElement("canvas");
    c.width = W; c.height = H;
    var g = c.getContext("2d");
    g.fillStyle = PAL.board; g.fillRect(0, 0, W, H);
    for (var ty = 0; ty < rows; ty++) for (var tx = 0; tx < COLS; tx++) {
      if ((tx + ty) % 2 === 0) A.px(g, PAL.boardLight, tx * T + 7, ty * T + 7, 2, 2);
    }
    /* board edge, silkscreen frame, mounting holes */
    g.fillStyle = PAL.boardDark; g.fillRect(0, 0, W, T); g.fillRect(0, H - T, W, T); g.fillRect(0, 0, T, H); g.fillRect(W - T, 0, T, H);
    g.strokeStyle = PAL.silk; g.globalAlpha = 0.35; g.lineWidth = 1; g.strokeRect(T * 1.5 + 0.5, T * 1.5 + 0.5, W - T * 3, H - T * 3); g.globalAlpha = 1;
    [[2.5, 2.5], [COLS - 2.5, 2.5], [2.5, rows - 2.5], [COLS - 2.5, rows - 2.5]].forEach(function (q) {
      g.fillStyle = PAL.pin; g.beginPath(); g.arc(q[0] * T, q[1] * T, 9, 0, 7); g.fill();
      g.fillStyle = "#04140E"; g.beginPath(); g.arc(q[0] * T, q[1] * T, 5, 0, 7); g.fill();
    });

    /* small parts and vias, scattered away from buildings and traces */
    function clear(x, y) {
      var m = 22;
      if (x > hub.rect.x - m && x < hub.rect.x + hub.rect.w + m && y > hub.rect.y - m - 20 && y < hub.rect.y + hub.rect.h + m + 26) return false;
      for (var i = 0; i < zones.length; i++) {
        var r = zones[i].rect;
        if (x > r.x - m && x < r.x + r.w + m && y > r.y - m && y < r.y + r.h + m) return false;
        var p = zones[i].path;
        for (var j = 0; j < p.length - 1; j++) {
          var x0 = Math.min(p[j][0], p[j + 1][0]) - 14, x1 = Math.max(p[j][0], p[j + 1][0]) + 14;
          var y0 = Math.min(p[j][1], p[j + 1][1]) - 14, y1 = Math.max(p[j][1], p[j + 1][1]) + 14;
          if (x > x0 && x < x1 && y > y0 && y < y1) return false;
        }
      }
      return true;
    }
    for (var n = 0; n < 150; n++) {
      var x = Math.round((T * 2.5 + rand(n + 1) * (W - T * 5)) / 4) * 4, y = Math.round((T * 2.5 + rand(n + 77.7) * (H - T * 5)) / 4) * 4;
      if (!clear(x, y)) continue;
      var kind = Math.floor(rand(n + 300) * 4);
      if (kind === 0) { A.px(g, PAL.pin, x - 5, y - 2, 3, 5); A.px(g, "#2B2118", x - 2, y - 2, 5, 5); A.px(g, PAL.pin, x + 3, y - 2, 3, 5); }           // resistor
      else if (kind === 1) { A.px(g, PAL.pin, x - 5, y - 2, 3, 5); A.px(g, "#B9884A", x - 2, y - 2, 5, 5); A.px(g, PAL.pin, x + 3, y - 2, 3, 5); }     // capacitor
      else { A.px(g, PAL.goldDark, x - 2, y - 2, 4, 4); A.px(g, "#04140E", x - 1, y - 1, 2, 2); }                                                      // via
    }

    /* traces, pads, buildings */
    zones.forEach(function (z) {
      if (z.project) { strokePath(g, z.path, PAL.traceEdge, 6); strokePath(g, z.path, PAL.trace, 4); }
      else { g.save(); g.setLineDash([3, 5]); strokePath(g, z.path, PAL.traceEdge, 2); g.restore(); }
    });
    zones.forEach(function (z) {
      if (z.project) {
        A.px(g, PAL.goldDark, z.pad.x - 8, z.pad.y - 8, 16, 16);
        A.px(g, PAL.gold, z.pad.x - 7, z.pad.y - 7, 14, 14);
        A.px(g, PAL.goldDark, z.pad.x - 2, z.pad.y - 2, 4, 4);
      }
      A.drawBuilding(g, z.project ? (z.project.sprite || "chip") : "empty", z.rect.x, z.rect.y);
    });
    A.px(g, PAL.goldDark, hub.pad.x - 10, hub.pad.y - 8, 20, 16);
    A.px(g, PAL.gold, hub.pad.x - 9, hub.pad.y - 7, 18, 14);
    A.drawHub(g, hub.rect.x, hub.rect.y, hub.rect.w, hub.rect.h);

    return { T: T, W: W, H: H, zones: zones, hub: hub, solids: solids, canvas: c, strokePath: strokePath };
  }

  CW.world = { build: build };
})();
