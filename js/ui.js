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
    if (p.headline) f.appendChild(el("p", "headline", p.headline));
    if (p.story) {
      var st = p.story;
      var box = el(withDemo ? "div" : "details", "story");
      box.appendChild(el(withDemo ? "h3" : "summary", null, "How I approached it"));
      var dl = el("dl");
      function section(title, fill) { dl.appendChild(el("dt", null, title)); var dd = el("dd"); fill(dd); dl.appendChild(dd); }
      function paras(dd, text) { String(text).split(/\n\s*\n/).forEach(function (t) { dd.appendChild(el("p", null, t)); }); }
      if (st.problem) section("The problem", function (dd) { paras(dd, st.problem); });
      if (st.steps && st.steps.length) {
        section("What I did and why", function (dd) {
          var ul = el("ul", "steps");
          st.steps.forEach(function (x) {
            var li = el("li");
            li.appendChild(el("b", null, x.did));
            if (x.why) { var w = el("span", "why"); w.appendChild(el("i", null, "Why: ")); w.appendChild(document.createTextNode(x.why)); li.appendChild(w); }
            ul.appendChild(li);
          });
          dd.appendChild(ul);
        });
      }
      if (st.action) section("What I did", function (dd) { paras(dd, st.action); });
      if (st.why) section("Why I did it that way", function (dd) { paras(dd, st.why); });
      if (st.result) section("The result", function (dd) { if (Array.isArray(st.result)) dd.appendChild(list(st.result)); else paras(dd, st.result); });
      box.appendChild(dl); f.appendChild(box);
    }
    if (p.built && p.built.length) { f.appendChild(el("h3", null, "What I built")); f.appendChild(list(p.built)); }
    if (p.results && p.results.length) { f.appendChild(el("h3", null, "Results")); f.appendChild(list(p.results, "chips results")); }
    var chips = p.tools || p.skills;
    if (chips && chips.length) { f.appendChild(el("h3", null, "Tools")); f.appendChild(list(chips, "chips")); }
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

  function meta(p) { return [p.org, p.date, p.team].filter(Boolean).join(" · "); }

  function openProject(id, viaGame) {
    var order = world.order;
    var i = order.findIndex(function (p) { return p.id === id; });
    if (i < 0) return;
    var p = order[i], body = $("panelBody");
    if (stopDemo) { stopDemo(); stopDemo = null; }
    body.textContent = "";
    body.appendChild(el("p", "eyebrow", p.zone));
    var h2 = el("h2", null, p.title); h2.id = "panelTitle"; body.appendChild(h2);
    if (meta(p)) body.appendChild(el("p", "meta", meta(p)));
    var frag = projectBody(p, true), demo = frag._demo;
    body.appendChild(frag);
    var foot = el("div", "sheet-foot");
    foot.appendChild(button("Back to the board", function () { hide(); }));
    if (order.length > 1) {
      var nextP = order[(i + 1) % order.length];
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
    var c = $("mapCanvas"), board = $("mapBoard"), list = $("mapList");
    c.width = world.W / 2; c.height = world.H / 2;
    var g = c.getContext("2d"); g.imageSmoothingEnabled = false; g.drawImage(world.canvas, 0, 0, c.width, c.height);
    Array.prototype.slice.call(board.querySelectorAll(".pin")).forEach(function (n) { n.remove(); });
    list.textContent = "";
    function go(target) { return function () { hide(); engine.teleport(target); }; }
    function stop(label, num, target, r) {
      var pin = button(num, go(target), "pin");
      pin.style.left = ((r.x + r.w / 2) / world.W * 100) + "%"; pin.style.top = ((r.y + r.h / 2) / world.H * 100) + "%";
      pin.setAttribute("aria-label", "Go to " + label);
      board.appendChild(pin);
      var li = el("li"), b = button("", go(target));
      b.appendChild(el("span", "num", num)); b.appendChild(document.createTextNode(label));
      li.appendChild(b);
      return li;
    }
    var home = el("ol", "map-list");
    home.appendChild(stop(world.hub.name + ": about me", "M", "hub", world.hub.rect));
    list.appendChild(home);
    world.districts.forEach(function (d) {
      var zs = world.zones.filter(function (z) { return z.project && z.district === d.name; });
      if (!zs.length) return;
      list.appendChild(el("h3", "map-group", d.name));
      var ol = el("ol", "map-list");
      zs.forEach(function (z) { ol.appendChild(stop((engine.isExplored(z.project.id) ? "\u2713 " : "") + z.name, String(z.number), z, z.rect)); });
      list.appendChild(ol);
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
    var areas = world.districts.filter(function (d) { return world.order.some(function (p) { return (p.category || "Other projects") === d.name; }); });
    body.appendChild(el("p", "quick-lead", world.order.length + " projects in " + areas.length + " areas. Open \u201cHow I approached it\u201d on any card for the problem, what I did and why, and the result."));
    areas.forEach(function (d) {
      body.appendChild(el("h2", null, d.name));
      world.order.forEach(function (p) {
        if ((p.category || "Other projects") !== d.name) return;
        var card = el("article", "card"); card.id = "q-" + p.id;
        card.appendChild(el("h4", null, p.title));
        if (meta(p)) card.appendChild(el("p", "meta", meta(p)));
        card.appendChild(projectBody(p, false));
        body.appendChild(card);
      });
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
