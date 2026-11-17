/* art.js: palette, pixel grids and drawing helpers. All game art is drawn here in code. */
(function () {
  var CW = (window.CW = window.CW || {});

  /* ---- Palette: change a colour here and it changes everywhere ---- */
  var PAL = {
    skin: "#8D5524",
    skinShadow: "#6F4119",
    hair: "#141414",
    eye: "#0B0B0B",
    eyeShine: "#FFFFFF",
    mouth: "#4A2410",
    hoodie: "#4F2683",
    hoodieShadow: "#3A1B63",
    jeans: "#1F2A44",
    shoe: "#F2F2F2",

    board: "#0B3D2E",
    boardLight: "#0F4A38",
    boardDark: "#082E23",
    silk: "#CFE8DC",
    trace: "#1B7A57",
    traceEdge: "#125C41",
    traceLit: "#FFD166",
    gold: "#E9C46A",
    goldDark: "#B08D3C",
    chip: "#1B1B22",
    chipLight: "#33343F",
    pin: "#C9CCD6",
    pinDark: "#8A8F9E"
  };

  var KEY = {
    H: PAL.hair, S: PAL.skin, s: PAL.skinShadow, E: PAL.eye, w: PAL.eyeShine, M: PAL.mouth,
    B: PAL.hair, P: PAL.hoodie, p: PAL.hoodieShadow, J: PAL.jeans, W: PAL.shoe
  };

  function gridToCanvas(rows) {
    var c = document.createElement("canvas");
    c.width = rows[0].length;
    c.height = rows.length;
    var g = c.getContext("2d");
    for (var y = 0; y < rows.length; y++) {
      for (var x = 0; x < rows[y].length; x++) {
        var col = KEY[rows[y].charAt(x)];
        if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
      }
    }
    return c;
  }

  function flip(canvas) {
    var c = document.createElement("canvas");
    c.width = canvas.width; c.height = canvas.height;
    var g = c.getContext("2d");
    g.translate(c.width, 0); g.scale(-1, 1);
    g.drawImage(canvas, 0, 0);
    return c;
  }

  /* ---- Dhru: 16 x 24 walk sprite ---- */
  var HEAD_FRONT = [
    "................",
    ".....HHHHHH.....",
    "....HHHHHHHH....",
    "...HHHHHHHHHH...",
    "...HHHHHHHHHH...",
    "...HHSSSSSSHH...",
    "...HSSSSSSSSH...",
    "...SSESSSSESS...",
    "...SSESSSSESS...",
    "...sSSSSSSSSs...",
    "....SSSMMSSS....",
    ".....sSSSSs....."
  ];
  var HEAD_BACK = [
    "................",
    ".....HHHHHH.....",
    "....HHHHHHHH....",
    "...HHHHHHHHHH...",
    "...HHHHHHHHHH...",
    "...HHHHHHHHHH...",
    "...HHHHHHHHHH...",
    "...HHHHHHHHHH...",
    "...sHHHHHHHHs...",
    "...sSHHHHHHSs...",
    "....SSSSSSSS....",
    ".....sSSSSs....."
  ];
  var HEAD_SIDE = [
    "................",
    "......HHHHHH....",
    ".....HHHHHHHH...",
    "....HHHHHHHHH...",
    "....HHHHHHHHHH..",
    "....HHHHSSSSSS..",
    "....HHHSSSSSSS..",
    "....HHSSSSESSS..",
    "....HHSSSSESSS..",
    ".....HSSSSSSSS..",
    ".....sSSSSSMS...",
    "......sSSSSs...."
  ];
  var BODY_FRONT = [
    "....PPPssPPP....",
    "...PPPPPPPPPP...",
    "..PPPPPPPPPPPP..",
    "..PPpPPPPPPpPP..",
    "..PPpPPPPPPpPP..",
    "..SSpPPPPPPpSS..",
    "....PPPPPPPP...."
  ];
  var BODY_BACK = [
    "....PPPPPPPP....",
    "...PPPPPPPPPP...",
    "..PPPPPPPPPPPP..",
    "..PPpPPPPPPpPP..",
    "..PPpPPPPPPpPP..",
    "..SSpPPPPPPpSS..",
    "....PPPPPPPP...."
  ];
  var BODY_SIDE = [
    ".....PPPss......",
    "....PPPPPPPP....",
    "....PPPPPPPP....",
    "....PPPpPPPP....",
    "....PPPpPPPP....",
    "....PPPSSPPP....",
    "....PPPPPPPP...."
  ];
  var LEGS_FRONT = [
    ["....JJJJJJJJ....", "....JJJ..JJJ....", "....JJJ..JJJ....", "....JJJ..JJJ....", "....WWW..WWW...."],
    ["....JJJJJJJJ....", "....JJJ..JJJ....", "....JJJ..JJJ....", "....JJJ..WWW....", "....WWW........."],
    ["....JJJJJJJJ....", "....JJJ..JJJ....", "....JJJ..JJJ....", "....WWW..JJJ....", ".........WWW...."]
  ];
  var LEGS_SIDE = [
    [".....JJJJJJ.....", ".....JJJJJJ.....", ".....JJJJJJ.....", ".....JJJJJJ.....", ".....WWWWWWW...."],
    [".....JJJJJJ.....", "....JJJ.JJJJ....", "...JJJ...JJJ....", "...JJJ...JJJ....", "...WWWW..WWWW..."],
    [".....JJJJJJ.....", ".....JJJJJJ.....", "......JJJJ......", "......JJJJ......", "......WWWWW....."]
  ];

  function frames(head, body, legs) {
    return legs.map(function (l) { return gridToCanvas(head.concat(body, l)); });
  }

  /* ---- Dhru: 24 x 24 portrait, shown at 2x or more ---- */
  var PORTRAIT = [
    "........................",
    "........HHHHHHHH........",
    "......HHHHHHHHHHHH......",
    ".....HHHHHHHHHHHHHH.....",
    "....HHHHHHHHHHHHHHHH....",
    "....HHHHHHHHHHHHHHHH....",
    "....HHHHSSSSSSSSHHHH....",
    "....HHSSSSSSSSSSSSHH....",
    "....HSSSSSSSSSSSSSSH....",
    "....HSSBBBSSSSBBBSSH....",
    "...sSSSSSSSSSSSSSSSSs...",
    "...sSSSwESSSSSSwESSSs...",
    "...sSSSEESSSSSSEESSSs...",
    "....SSSSSSSSSSSSSSSS....",
    "....SSSSSSSssSSSSSSS....",
    "....SSSSSSSssSSSSSSS....",
    ".....SSSSSSSSSSSSSS.....",
    ".....SSSSMSSSSMSSSS.....",
    "......SSSSMMMMSSSS......",
    ".......SSSSSSSSSS.......",
    ".........ssssss.........",
    "....PPPPPssssssPPPPP....",
    "..PPPPPPPPpssPPPPPPPPP..",
    ".PPPPPPPPPPppPPPPPPPPPP."
  ];

  function px(g, color, x, y, w, h) { g.fillStyle = color; g.fillRect(Math.round(x), Math.round(y), w, h); }

  /* ---- Buildings: each draws inside a 96 x 64 box at (x, y) ---- */
  function pinsH(g, x, y, w, n, color) {
    var step = w / n;
    for (var i = 0; i < n; i++) px(g, color, x + i * step + step / 2 - 2, y, 4, 4);
  }
  function pinsV(g, x, y, h, n, color) {
    var step = h / n;
    for (var i = 0; i < n; i++) px(g, color, x, y + i * step + step / 2 - 2, 4, 4);
  }

  var BUILD = {
    chip: function (g, x, y) {
      pinsH(g, x + 12, y + 2, 72, 9, PAL.pin); pinsH(g, x + 12, y + 58, 72, 9, PAL.pin);
      px(g, PAL.chip, x + 8, y + 6, 80, 52);
      px(g, PAL.chipLight, x + 8, y + 6, 80, 2);
      px(g, PAL.pinDark, x + 14, y + 12, 5, 5);
      px(g, PAL.chipLight, x + 28, y + 26, 40, 3); px(g, PAL.chipLight, x + 28, y + 34, 28, 3);
    },
    fpga: function (g, x, y) {
      pinsH(g, x + 20, y + 0, 56, 8, PAL.gold); pinsH(g, x + 20, y + 60, 56, 8, PAL.gold);
      pinsV(g, x + 12, y + 6, 52, 7, PAL.gold); pinsV(g, x + 80, y + 6, 52, 7, PAL.gold);
      px(g, "#20232E", x + 16, y + 4, 64, 56);
      px(g, "#2C3040", x + 16, y + 4, 64, 2);
      px(g, "#454B63", x + 28, y + 14, 40, 36);
      px(g, "#5A6180", x + 28, y + 14, 40, 2);
      for (var r = 0; r < 4; r++) for (var c = 0; c < 5; c++) px(g, PAL.gold, x + 33 + c * 7, y + 21 + r * 7, 3, 3);
      px(g, PAL.silk, x + 19, y + 7, 3, 3);
    },
    shield: function (g, x, y) {
      px(g, "#174EA6", x + 6, y + 6, 84, 52);
      px(g, "#2466CC", x + 6, y + 6, 84, 2);
      px(g, "#0F3A80", x + 6, y + 56, 84, 2);
      px(g, "#111318", x + 12, y + 9, 56, 6); px(g, "#111318", x + 12, y + 49, 68, 6);
      pinsH(g, x + 12, y + 10, 56, 8, PAL.gold); pinsH(g, x + 12, y + 50, 68, 10, PAL.gold);
      px(g, "#EDEFF5", x + 14, y + 22, 14, 18);           // relay
      px(g, "#9AA1B5", x + 16, y + 24, 10, 3);
      px(g, "#111318", x + 34, y + 24, 12, 12);           // sensor chip
      px(g, PAL.gold, x + 36, y + 26, 2, 2);
      px(g, "#2BB673", x + 52, y + 22, 10, 6);            // terminal block
      px(g, "#2BB673", x + 52, y + 32, 10, 6);
      px(g, "#D94C4C", x + 70, y + 24, 6, 6);             // LED
      px(g, PAL.silk, x + 68, y + 36, 14, 1); px(g, PAL.silk, x + 68, y + 39, 10, 1);
    },
    oscilloscope: function (g, x, y) {
      px(g, "#8D93A6", x + 8, y + 56, 10, 6); px(g, "#8D93A6", x + 78, y + 56, 10, 6);
      px(g, "#C9CCD6", x + 4, y + 6, 88, 52);
      px(g, "#E6E8EF", x + 4, y + 6, 88, 2);
      px(g, "#9AA1B5", x + 4, y + 56, 88, 2);
      px(g, "#04140E", x + 10, y + 12, 54, 40);
      px(g, "#0A3324", x + 10, y + 31, 54, 1); px(g, "#0A3324", x + 36, y + 12, 1, 40);
      for (var i = 0; i < 52; i++) {
        var yy = Math.round(31 - Math.sin(i / 52 * Math.PI * 4) * 13);
        px(g, "#5CFF9D", x + 11 + i, y + yy, 1, 2);
      }
      px(g, "#33343F", x + 70, y + 14, 8, 8); px(g, "#33343F", x + 82, y + 14, 6, 8);
      px(g, "#33343F", x + 70, y + 28, 8, 8); px(g, "#33343F", x + 82, y + 28, 6, 8);
      px(g, "#D94C4C", x + 70, y + 44, 4, 4); px(g, "#F4B942", x + 78, y + 44, 4, 4); px(g, "#2BB673", x + 86, y + 44, 4, 4);
    },
    garage: function (g, x, y) {
      px(g, "#6B7280", x + 4, y + 10, 88, 50);
      px(g, "#4B5563", x + 4, y + 58, 88, 2);
      for (var i = 0; i < 11; i++) px(g, i % 2 ? "#111318" : "#F4B942", x + 4 + i * 8, y + 4, 8, 6);
      px(g, "#1F2430", x + 16, y + 22, 44, 38);
      for (var s = 0; s < 6; s++) px(g, "#2D3444", x + 16, y + 24 + s * 6, 44, 2);
      px(g, "#111318", x + 68, y + 26, 16, 14);           // window
      px(g, "#7FD4FF", x + 70, y + 28, 12, 10);
      px(g, "#F2F2F2", x + 28, y + 46, 20, 10);           // little robot in the doorway
      px(g, "#111318", x + 26, y + 54, 6, 6); px(g, "#111318", x + 44, y + 54, 6, 6);
      px(g, "#D94C4C", x + 44, y + 48, 3, 3);
    },
    motor: function (g, x, y) {
      var cx = x + 48, cy = y + 32;
      px(g, "#4B5563", x + 14, y + 54, 68, 8);
      g.fillStyle = "#2D3444"; g.beginPath(); g.arc(cx, cy, 30, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#111318"; g.beginPath(); g.arc(cx, cy, 25, 0, Math.PI * 2); g.fill();
      for (var i = 0; i < 6; i++) {
        var a = i * Math.PI / 3;
        px(g, "#C8782A", cx + Math.cos(a) * 19 - 4, cy + Math.sin(a) * 19 - 4, 8, 8);
        px(g, "#E79A4B", cx + Math.cos(a) * 19 - 4, cy + Math.sin(a) * 19 - 4, 8, 2);
      }
      g.fillStyle = "#9AA1B5"; g.beginPath(); g.arc(cx, cy, 11, 0, Math.PI * 2); g.fill();
      px(g, "#D94C4C", cx - 9, cy - 3, 6, 6); px(g, "#3B82F6", cx + 3, cy - 3, 6, 6);
      px(g, "#33343F", cx - 2, cy - 2, 4, 4);
    },
    rocket: function (g, x, y) {
      px(g, "#6B7280", x + 6, y + 50, 84, 12);
      for (var i = 0; i < 10; i++) px(g, i % 2 ? "#111318" : "#F4B942", x + 6 + i * 8.4, y + 50, 9, 3);
      px(g, "#8A8F9E", x + 22, y + 8, 3, 42); px(g, "#8A8F9E", x + 32, y + 8, 3, 42);   // tower
      for (var t = 0; t < 5; t++) px(g, "#8A8F9E", x + 22, y + 12 + t * 8, 13, 2);
      px(g, "#F2F2F2", x + 46, y + 14, 14, 36);                                        // body
      px(g, "#C9CCD6", x + 57, y + 14, 3, 36);
      px(g, PAL.hoodie, x + 48, y + 8, 10, 6); px(g, PAL.hoodie, x + 50, y + 4, 6, 4); px(g, PAL.hoodie, x + 52, y + 1, 2, 3);
      px(g, PAL.hoodie, x + 40, y + 40, 6, 10); px(g, PAL.hoodie, x + 60, y + 40, 6, 10);
      px(g, "#111318", x + 50, y + 22, 6, 6); px(g, "#7FD4FF", x + 51, y + 23, 4, 4);
      px(g, PAL.hoodie, x + 46, y + 32, 14, 2);
    },
    dome: function (g, x, y) {
      px(g, "#8A8F9E", x + 10, y + 34, 76, 26);
      px(g, "#6B7280", x + 10, y + 58, 76, 2);
      g.fillStyle = "#E6E8EF"; g.beginPath(); g.arc(x + 48, y + 34, 30, Math.PI, 0); g.fill();
      g.fillStyle = "#C9CCD6"; g.beginPath(); g.arc(x + 48, y + 34, 30, Math.PI * 1.62, 0); g.fill();
      px(g, "#1F2430", x + 44, y + 5, 8, 29);
      px(g, "#04140E", x + 18, y + 40, 36, 16);           // chart display
      px(g, "#5CFF9D", x + 21, y + 50, 4, 4); px(g, "#5CFF9D", x + 27, y + 47, 4, 7);
      px(g, "#5CFF9D", x + 33, y + 49, 4, 5); px(g, "#5CFF9D", x + 39, y + 44, 4, 10); px(g, "#5CFF9D", x + 45, y + 42, 4, 12);
      px(g, "#1F2430", x + 64, y + 42, 12, 18);           // door
      px(g, PAL.gold, x + 73, y + 51, 2, 2);
    },
    empty: function (g, x, y) {
      g.save();
      g.strokeStyle = PAL.goldDark; g.lineWidth = 1; g.setLineDash([4, 3]);
      g.strokeRect(x + 10.5, y + 8.5, 75, 47);
      g.restore();
      pinsH(g, x + 12, y + 2, 72, 9, PAL.goldDark); pinsH(g, x + 12, y + 58, 72, 9, PAL.goldDark);
      px(g, PAL.goldDark, x + 16, y + 14, 4, 4);
    }
  };

  function drawBuilding(g, type, x, y) {
    if (type !== "empty") { g.fillStyle = "rgba(0,0,0,0.28)"; g.fillRect(x + 6, y + 60, 88, 7); }
    (BUILD[type] || BUILD.chip)(g, x, y);
  }

  function drawHub(g, x, y, w, h) {
    g.fillStyle = "rgba(0,0,0,0.28)"; g.fillRect(x + 4, y + h - 2, w - 4, 8);
    pinsH(g, x + 8, y - 4, w - 16, 16, PAL.pin); pinsH(g, x + 8, y + h, w - 16, 16, PAL.pin);
    pinsV(g, x - 4, y + 8, h - 16, 6, PAL.pin); pinsV(g, x + w, y + 8, h - 16, 6, PAL.pin);
    px(g, PAL.chip, x, y, w, h);
    px(g, PAL.chipLight, x, y, w, 2);
    px(g, "#0E0E13", x, y + h - 2, w, 2);
    px(g, PAL.pinDark, x + 10, y + 10, 8, 8);
    px(g, "#26262F", x + 40, y + 18, w - 80, h - 36);
    px(g, PAL.chipLight, x + 40, y + 18, w - 80, 2);
    /* "MCU" in 5 x 7 pixel letters, drawn at 4x */
    var L = {
      M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
      C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
      U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"]
    };
    var word = "MCU", s = 4, tw = word.length * 6 * s - s, ox = x + (w - tw) / 2, oy = y + (h - 7 * s) / 2;
    for (var i = 0; i < word.length; i++) {
      var rows = L[word.charAt(i)];
      for (var r = 0; r < 7; r++) for (var c = 0; c < 5; c++) {
        if (rows[r].charAt(c) === "1") px(g, PAL.silk, ox + i * 6 * s + c * s, oy + r * s, s, s);
      }
    }
  }

  CW.art = {
    PAL: PAL,
    px: px,
    drawBuilding: drawBuilding,
    drawHub: drawHub,
    init: function () {
      var right = frames(HEAD_SIDE, BODY_SIDE, LEGS_SIDE);
      CW.art.player = {
        down: frames(HEAD_FRONT, BODY_FRONT, LEGS_FRONT),
        up: frames(HEAD_BACK, BODY_BACK, LEGS_FRONT),
        right: right,
        left: right.map(flip)
      };
      CW.art.portrait = gridToCanvas(PORTRAIT);
    }
  };
})();
