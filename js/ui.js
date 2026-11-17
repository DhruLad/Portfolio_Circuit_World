/* ui.js: title, top bar, project panel, map, Quick View, finale. All text is real HTML. */
(function () {
  var CW = (window.CW = window.CW || {});
  var data, profile, projects, engine, world;
  var open = null;            // id of the overlay that is showing, or null
  var stopDemo = null;
  var lastFocus = null;
  var started = false;
  var finaleShown = false;
  var currentProject = null;

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function list(items, cls) {
    var ul = el("ul", cls);
    items.forEach(function (t) { ul.appendChild(el("li", null, t)); });
    return ul;
  }
  function link(label, url, cls) {
    var a = el("a", cls || "btn", label);
    a.href = url; a.target = "_blank"; a.rel = "noopener";
    return a;
  }
  function button(label, fn, cls) {
    var b = el("button", cls, label); b.type = "button"; b.addEventListener("click", fn);
    return b;
  }

  /* LinkedIn, email and résumé, wherever contact details are shown */
  function contactRow(target) {
    target.textContent = "";
    if (profile.linkedin) target.appendChild(link("LinkedIn", profile.linkedin));
    if (profile.resume) target.appendChild(link("Résumé (PDF)", profile.resume));
    if (profile.email) {
      var m = link("Email", "mailto:" + profile.email); m.removeAttribute("target");
      target.appendChild(m);
      target.appendChild(el("span", "email", profile.email));
    }
    return target;
  }

  /* The body of a project: shared by the in-game panel and Quick View */
  function projectBody(p, withDemo) {
    var f = document.createDocumentFragment();
    f.appendChild(el("p", "summary", p.summary));
    if (withDemo && p.demo && CW.demos[p.demo]) {
      var d = el("div", "demo");
      f.appendChild(d);
      f._demo = function () { return CW.demos[p.demo](d, p); };
    }
    if (p.story) {
      var steps = [["problem", "The problem"], ["action", "What I did"], ["why", "Why I did it that way"], ["result", "The result"]];
      var box = el(withDemo ? "div" : "details", "story");
      box.appendChild(el(withDemo ? "h3" : "summary", null, "How I approached it"));
      var dl = el("dl");
      steps.forEach(function (s) { if (p.story[s[0]]) { dl.appendChild(el("dt", null, s[1])); dl.appendChild(el("dd", null, p.story[s[0]])); } });
      box.appendChild(dl); f.appendChild(box);
    }
    if (p.built && p.built.length) { f.appendChild(el("h3", null, "What I built")); f.appendChild(list(p.built)); }
    if (p.results && p.results.length) { f.appendChild(el("h3", null, "Results")); f.appendChild(list(p.results, "chips results")); }
    if (p.skills && p.skills.length) { f.appendChild(el("h3", null, "Skills")); f.appendChild(list(p.skills, "chips")); }
    if (p.photos && p.photos.length) {
      f.appendChild(el("h3", null, "Photos"));
      var ph = el("div", "photos");
      p.photos.forEach(function (name) {
        var img = el("img"); img.src = "assets/projects/" + p.id + "/" + name; img.alt = p.title + " photo"; img.loading = "lazy";
        ph.appendChild(img);
      });
      f.appendChild(ph);
    }
    if (p.links && p.links.length) {
      f.appendChild(el("h3", null, "Links"));
      var row = el("div", "contact-row");
      p.links.forEach(function (l) { row.appendChild(link(l.label, l.url)); });
      f.appendChild(row);
    }
    return f;
  }

  function aboutBody() {
    var f = document.createDocumentFragment(), e = profile.education;
    if (e) {
      f.appendChild(el("h3", null, "Education"));
      var p = el("p", "exp"); p.appendChild(el("b", null, e.degree)); p.appendChild(el("span", null, e.school + " · " + e.dates));
      f.appendChild(p);
      if (e.coursework) f.appendChild(el("p", null, "Relevant coursework: " + e.coursework));
    }
    if (profile.awards && profile.awards.length) { f.appendChild(el("h3", null, "Awards")); f.appendChild(list(profile.awards)); }
    if (profile.skills && profile.skills.length) {
      f.appendChild(el("h3", null, "Technical skills"));
      var dl = el("dl", "skills");
      profile.skills.forEach(function (s) { dl.appendChild(el("dt", null, s.group)); dl.appendChild(el("dd", null, s.items)); });
      f.appendChild(dl);
    }
    if (profile.experience && profile.experience.length) {
      f.appendChild(el("h3", null, "Other experience"));
      profile.experience.forEach(function (x) {
        var p2 = el("p", "exp"); p2.appendChild(el("b", null, x.role)); p2.appendChild(el("span", null, x.org + " · " + x.dates));
        p2.appendChild(document.createTextNode(x.line));
        f.appendChild(p2);
      });
    }
    return f;
  }

  /* ---- overlay plumbing ---- */
  function show(id) {
    if (open && open !== id) hide(true);
    lastFocus = document.activeElement;
    open = id; $(id).hidden = false;
    engine.setMode("paused");
    $("hud").hidden = true; $("openBtn").hidden = true; $("hint").hidden = true;
    var focusTo = $(id).querySelector("[data-close], button, a");
    if (focusTo) focusTo.focus();
    $(id).scrollTop = 0; var sheet = $(id).querySelector(".sheet"); if (sheet) sheet.scrollTop = 0;
  }
  function hide(swapping) {
    if (!open) return;
    var was = open;
    if (stopDemo) { stopDemo(); stopDemo = null; }
    $(open).hidden = true; open = null;
    if (was === "panel") { currentProject = null; setHash(""); }
    if (swapping) return;
    if (started) {
      $("hud").hidden = false; engine.setMode("play");
      $("game").focus();
      if (was === "panel" && !finaleShown && engine.exploredCount() === engine.total() && engine.total() > 0) { finaleShown = true; showFinale(); }
    } else showTitle();
  }
  function setHash(id) {
    try { history.replaceState(null, "", id ? "#" + id : location.pathname + location.search); } catch (e) { /* not allowed here: fine */ }
  }

  function updateCount() { $("count").textContent = "Explored " + engine.exploredCount() + "/" + engine.total(); }

  /* ---- screens ---- */
  function showTitle() { $("title").hidden = false; $("hud").hidden = true; engine.setMode("title"); $("btnPlay").focus(); }

  function start() {
    started = true;
    $("title").hidden = true; $("hud").hidden = false;
    engine.setMode("play"); updateCount();
    var coarse = false; try { coarse = window.matchMedia("(pointer: coarse)").matches; } catch (e) { /* default */ }
    $("hint").textContent = coarse ? "Drag anywhere to walk. Tap Open at a gold pad." : "Walk with WASD or the arrow keys. Press E at a gold pad.";
    $("hint").hidden = false;
    setTimeout(function () { $("hint").hidden = true; }, 5000);
    $("game").focus();
  }

  function openProject(id, viaGame) {
    var i = projects.findIndex(function (p) { return p.id === id; });
    if (i < 0) return;
    var p = projects[i], body = $("panelBody");
    if (stopDemo) { stopDemo(); stopDemo = null; }
    body.textContent = "";
    body.appendChild(el("p", "eyebrow", p.zone));
    var h2 = el("h2", null, p.title); h2.id = "panelTitle"; body.appendChild(h2);
    body.appendChild(el("p", "meta", [p.date, p.org].filter(Boolean).join(" · ")));
    var frag = projectBody(p, true), demo = frag._demo;
    body.appendChild(frag);
    var foot = el("div", "sheet-foot");
    foot.appendChild(button("Back to the board", function () { hide(); }));
    if (projects.length > 1) {
      var nextP = projects[(i + 1) % projects.length];
      foot.appendChild(button("Next: " + nextP.zone + " →", function () {
        var z = world.zones.filter(function (zz) { return zz.project === nextP; })[0];
        if (z) engine.teleport(z);
        openProject(nextP.id);
      }));
    }
    body.appendChild(foot);
    show("panel");
    currentProject = id; setHash(id);
    if (demo) stopDemo = demo();
    if (started || viaGame) { engine.markExplored(id); updateCount(); }
  }

  function openAbout() {
    var body = $("panelBody");
    body.textContent = "";
    body.appendChild(el("p", "eyebrow", "MCU Plaza"));
    var h2 = el("h2", null, profile.name); h2.id = "panelTitle"; body.appendChild(h2);
    body.appendChild(el("p", "meta", profile.tagline));
    contactRow(body.appendChild(el("div", "contact-row")));
    body.appendChild(aboutBody());
    var foot = el("div", "sheet-foot");
    foot.appendChild(button("Back to the board", function () { hide(); }));
    body.appendChild(foot);
    show("panel");
  }

  function openMap() {
    var c = $("mapCanvas"), board = $("mapBoard"), ol = $("mapList");
    c.width = world.W / 2; c.height = world.H / 2;
    var g = c.getContext("2d"); g.imageSmoothingEnabled = false; g.drawImage(world.canvas, 0, 0, c.width, c.height);
    Array.prototype.slice.call(board.querySelectorAll(".pin")).forEach(function (n) { n.remove(); });
    ol.textContent = "";
    function go(target) { return function () { hide(); engine.teleport(target); }; }
    var stops = [{ label: world.hub.name + ": about me", num: "M", target: "hub", x: world.hub.rect.x + world.hub.rect.w / 2, y: world.hub.rect.y + world.hub.rect.h / 2 }];
    world.zones.forEach(function (z) {
      if (!z.project) return;
      stops.push({ label: (engine.isExplored(z.project.id) ? "✓ " : "") + z.name, num: String(z.number), target: z, x: z.rect.x + z.rect.w / 2, y: z.rect.y + z.rect.h / 2 });
    });
    stops.forEach(function (s) {
      var pin = button(s.num, go(s.target), "pin");
      pin.style.left = (s.x / world.W * 100) + "%"; pin.style.top = (s.y / world.H * 100) + "%";
      pin.setAttribute("aria-label", "Go to " + s.label);
      board.appendChild(pin);
      var li = el("li"), b = button("", go(s.target));
      b.appendChild(el("span", "num", s.num)); b.appendChild(document.createTextNode(s.label));
      li.appendChild(b); ol.appendChild(li);
    });
    show("map");
  }

  function openQuick() {
    var body = $("quickBody");
    body.textContent = "";
    body.appendChild(el("p", "eyebrow", "Quick View"));
    var h1 = el("h1", null, profile.name); h1.id = "quickName"; body.appendChild(h1);
    body.appendChild(el("p", "tagline", profile.tagline));
    var row = contactRow(el("div", "contact-row"));
    row.insertBefore(button(started ? "Back to the game" : "Play the game", function () { if (started) hide(); else { hide(true); start(); } }), row.firstChild);
    body.appendChild(row);
    body.appendChild(el("h2", null, "Projects"));
    projects.forEach(function (p) {
      var card = el("article", "card"); card.id = "q-" + p.id;
      card.appendChild(el("h4", null, p.title));
      card.appendChild(el("p", "meta", [p.date, p.org].filter(Boolean).join(" · ")));
      card.appendChild(projectBody(p, false));
      body.appendChild(card);
    });
    body.appendChild(el("h2", null, "About"));
    body.appendChild(aboutBody());
    show("quick");
  }

  function showFinale() { contactRow($("finaleContact")); show("finale"); }

  function setNear(target) {
    var b = $("openBtn");
    if (!target || !started || open) { b.hidden = true; return; }
    b.textContent = "Open " + (target.type === "hub" ? world.hub.name : target.zone.name);
    var k = document.createElement("kbd"); k.textContent = "E"; b.appendChild(k);
    b.hidden = false;
  }

  CW.ui = {
    setNear: setNear, openProject: function (id) { openProject(id, true); }, openAbout: openAbout, openMap: openMap,
    init: function (content, engineObj, worldObj) {
      data = content; profile = data.profile; projects = data.projects; engine = engineObj; world = worldObj;
      $("game").tabIndex = 0;
      $("titleName").textContent = profile.name; $("titleTag").textContent = profile.tagline;
      var pg = $("portrait").getContext("2d"); pg.drawImage(CW.art.portrait, 0, 0);
      if (profile.linkedin) $("btnTitleLinkedIn").href = profile.linkedin; else $("btnTitleLinkedIn").hidden = true;
      ["btnResume", "btnTitleResume"].forEach(function (id) { if (profile.resume) { $(id).href = profile.resume; $(id).hidden = false; } });

      $("btnPlay").addEventListener("click", start);
      $("btnTitleQuick").addEventListener("click", function () { $("title").hidden = true; openQuick(); });
      $("btnMap").addEventListener("click", openMap);
      $("btnQuick").addEventListener("click", openQuick);
      $("btnContact").addEventListener("click", openAbout);
      $("openBtn").addEventListener("click", function () { engine.interact(); });
      $("btnSound").addEventListener("click", function () {
        engine.sfx.on = !engine.sfx.on;
        this.setAttribute("aria-pressed", engine.sfx.on ? "true" : "false");
        this.textContent = "Sound: " + (engine.sfx.on ? "on" : "off");
        engine.sfx.play([784], 0.08);
      });
      Array.prototype.slice.call(document.querySelectorAll("[data-close]")).forEach(function (b) { b.addEventListener("click", function () { hide(); }); });
      Array.prototype.slice.call(document.querySelectorAll(".sheet-wrap")).forEach(function (w) {
        w.addEventListener("pointerdown", function (e) { if (e.target === w) hide(); });
      });
      window.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) { e.preventDefault(); hide(); } });

      function route() {
        var id = (location.hash || "").replace("#", "");
        if (id && id !== currentProject && projects.some(function (p) { return p.id === id; })) {
          if (!started) { started = true; $("title").hidden = true; updateCount(); }
          var z = world.zones.filter(function (zz) { return zz.project && zz.project.id === id; })[0];
          if (z) engine.teleport(z);
          openProject(id, true);
        }
      }
      window.addEventListener("hashchange", route);
      showTitle(); route();
    }
  };

  /* ---- boot ---- */
  window.addEventListener("DOMContentLoaded", function () {
    CW.art.init();
    var w = CW.world.build(window.PORTFOLIO);
    CW.engine.init(document.getElementById("game"), w, CW.ui);
    CW.ui.init(window.PORTFOLIO, CW.engine, w);
  });
})();
