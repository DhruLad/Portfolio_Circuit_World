/* world.js: builds the circuit board from content.js.
   Projects are grouped into districts by their `category`, in the order each category first
   appears. Each district is a silkscreened block of buildings on a shared bus, and every bus runs
   to a central trunk that feeds the MCU hub. A new project adds a building to its district; a new
   category adds a district. Nothing here needs editing to grow the board. */
(function () {
  var CW = (window.CW = window.CW || {});
  var T = 16;                       // tile size in world pixels
  var BW = 6, BH = 4;               // building size in tiles
  var PER_ROW = 4, PITCH_X = 7;     // buildings per row inside a district, and their spacing
  var ROW_H = 8, LABEL_H = 2;       // height of one building row, and of the district name band
  var COLS = 66, TRUNK = 33;        // board width; x of the vertical trunk
  var DW = 29, COL_X = [2, 35];     // district width; x of the left and right district columns
  var HUB_W = 18, HUB_H = 6;

  /* Cut each corner at 45 degrees, the way PCB traces are routed. */
  function chamfer(pts, c) {
    var out = [pts[0]];
    for (var i = 1; i < pts.length - 1; i++) {
      var a = pts[i - 1], b = pts[i], d = pts[i + 1];
      var l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(d[0] - b[0], d[1] - b[1]);
      if (!l1 || !l2) { out.push(b); continue; }
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

    /* ---- group projects into districts ---- */
    var groups = [], byName = {};
    projects.forEach(function (p) {
      var c = p.category || "Other projects";
      if (!byName[c]) { byName[c] = { name: c, projects: [] }; groups.push(byName[c]); }
      byName[c].projects.push(p);
    });
    groups.forEach(function (gr) {
      var n = gr.projects.length;
      gr.slots = n;
      gr.rows = Math.max(1, Math.ceil(gr.slots / PER_ROW));
      gr.h = LABEL_H + gr.rows * ROW_H;
    });

    /* ---- stack districts in left/right pairs, half above the hub and half below ---- */
    var pairs = [];
    for (var i = 0; i < groups.length; i += 2) pairs.push(groups.slice(i, i + 2));
    var above = Math.ceil(pairs.length / 2);
    var y = 2, hubTop = -1;
    pairs.forEach(function (pair, pi) {
      if (pi === above) { hubTop = y + 1; y = hubTop + HUB_H + 3; }
      var ph = 0;
      pair.forEach(function (gr, side) {
        gr.x = COL_X[side]; gr.y = y; gr.above = pi < above;
        ph = Math.max(ph, gr.h);
      });
      y += ph + 1;
    });
    if (hubTop < 0) { hubTop = y + 1; y = hubTop + HUB_H + 3; }
    y += 1;
    var ROWS = y + 1;
    var hubBottom = hubTop + HUB_H;

    /* ---- zones: one per building socket ---- */
    var zones = [], solids = [], districts = [], num = 0;
    groups.forEach(function (gr) {
      districts.push({ name: gr.name, rect: { x: gr.x * T, y: gr.y * T, w: DW * T, h: gr.h * T } });
      for (var k = 0; k < gr.slots; k++) {
        var p = gr.projects[k] || null;
        var r = Math.floor(k / PER_ROW), c = k % PER_ROW;
        var bx = gr.x + 1 + c * PITCH_X, by = gr.y + LABEL_H + r * ROW_H;
        var cx = bx + BW / 2, padY = by + BH + 0.5, busY = by + BH + 2;
        var pts = [[cx, padY], [cx, busY], [TRUNK, busY], [TRUNK, gr.above ? hubTop : hubBottom]];
        var z = {
          index: zones.length, number: p ? ++num : null, project: p, district: gr.name,
          rect: { x: bx * T, y: by * T, w: BW * T, h: BH * T },
          pad: { x: cx * T, y: padY * T },
          path: chamfer(pts.map(function (q) { return [q[0] * T, q[1] * T]; }), 7),
          name: p ? p.zone : "Coming soon"
        };
        zones.push(z);
        if (p) solids.push({ x: z.rect.x + 6, y: z.rect.y + 6, w: z.rect.w - 12, h: z.rect.h - 8 });
      }
    });

    var hub = {
      rect: { x: (TRUNK - HUB_W / 2) * T, y: hubTop * T, w: HUB_W * T, h: HUB_H * T },
      pad: { x: (TRUNK - 5) * T, y: (hubBottom + 1.2) * T },
      name: "MCU Plaza"
    };
    solids.push({ x: hub.rect.x - 2, y: hub.rect.y - 2, w: hub.rect.w + 4, h: hub.rect.h + 4 });

    var W = COLS * T, H = ROWS * T;

    /* ---- static layer: drawn once ---- */
    var cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    var g = cv.getContext("2d");
    g.fillStyle = PAL.board; g.fillRect(0, 0, W, H);
    for (var ty = 0; ty < ROWS; ty++) for (var tx = 0; tx < COLS; tx++) {
      if ((tx + ty) % 2 === 0) A.px(g, PAL.boardLight, tx * T + 7, ty * T + 7, 2, 2);
    }
    /* board edge, silkscreen frame, mounting holes */
    g.fillStyle = PAL.boardDark; g.fillRect(0, 0, W, T); g.fillRect(0, H - T, W, T); g.fillRect(0, 0, T, H); g.fillRect(W - T, 0, T, H);
    g.strokeStyle = PAL.silk; g.globalAlpha = 0.35; g.lineWidth = 1; g.strokeRect(T * 1.5 + 0.5, T * 1.5 + 0.5, W - T * 3, H - T * 3); g.globalAlpha = 1;
    [[2.5, 2.5], [COLS - 2.5, 2.5], [2.5, ROWS - 2.5], [COLS - 2.5, ROWS - 2.5]].forEach(function (q) {
      g.fillStyle = PAL.pin; g.beginPath(); g.arc(q[0] * T, q[1] * T, 9, 0, 7); g.fill();
      g.fillStyle = "#04140E"; g.beginPath(); g.arc(q[0] * T, q[1] * T, 5, 0, 7); g.fill();
    });

    /* district outlines, like functional blocks on a silkscreen */
    districts.forEach(function (d) {
      var r = d.rect;
      g.globalAlpha = 0.3; g.strokeStyle = PAL.silk; g.lineWidth = 1;
      g.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      g.globalAlpha = 0.7;
      [[r.x, r.y], [r.x + r.w - 8, r.y], [r.x, r.y + r.h - 2], [r.x + r.w - 8, r.y + r.h - 2]].forEach(function (q) { A.px(g, PAL.silk, q[0], q[1], 8, 2); });
      [[r.x, r.y], [r.x + r.w - 2, r.y], [r.x, r.y + r.h - 8], [r.x + r.w - 2, r.y + r.h - 8]].forEach(function (q) { A.px(g, PAL.silk, q[0], q[1], 2, 8); });
      g.globalAlpha = 1;
    });

    /* small parts and vias, scattered away from buildings, labels and traces */
    function clear(x, y) {
      var m = 22;
      if (x > hub.rect.x - m && x < hub.rect.x + hub.rect.w + m && y > hub.rect.y - m - 20 && y < hub.rect.y + hub.rect.h + m + 26) return false;
      for (var di = 0; di < districts.length; di++) {
        var dr = districts[di].rect;
        if (x > dr.x - 6 && x < dr.x + dr.w + 6 && y > dr.y - 6 && y < dr.y + LABEL_H * T + 4) return false;
      }
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
    for (var n = 0; n < 260; n++) {
      var sx = Math.round((T * 2.5 + rand(n + 1) * (W - T * 5)) / 4) * 4, sy = Math.round((T * 2.5 + rand(n + 77.7) * (H - T * 5)) / 4) * 4;
      if (!clear(sx, sy)) continue;
      var kind = Math.floor(rand(n + 300) * 4);
      if (kind === 0) { A.px(g, PAL.pin, sx - 5, sy - 2, 3, 5); A.px(g, "#2B2118", sx - 2, sy - 2, 5, 5); A.px(g, PAL.pin, sx + 3, sy - 2, 3, 5); }       // resistor
      else if (kind === 1) { A.px(g, PAL.pin, sx - 5, sy - 2, 3, 5); A.px(g, "#B9884A", sx - 2, sy - 2, 5, 5); A.px(g, PAL.pin, sx + 3, sy - 2, 3, 5); } // capacitor
      else { A.px(g, PAL.goldDark, sx - 2, sy - 2, 4, 4); A.px(g, "#04140E", sx - 1, sy - 1, 2, 2); }                                                  // via
    }

    /* traces: dashed ones for empty sockets first, so solid copper draws over them */
    zones.forEach(function (z) {
      if (!z.project) { g.save(); g.setLineDash([3, 5]); strokePath(g, z.path, PAL.traceEdge, 2); g.restore(); }
    });
    zones.forEach(function (z) {
      if (z.project) { strokePath(g, z.path, PAL.traceEdge, 6); strokePath(g, z.path, PAL.trace, 4); }
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

    return {
      T: T, W: W, H: H, zones: zones, hub: hub, districts: districts, solids: solids, canvas: cv, strokePath: strokePath,
      order: zones.filter(function (z) { return z.project; }).map(function (z) { return z.project; })
    };
  }

  CW.world = { build: build };
})();
