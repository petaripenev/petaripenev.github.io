(function () {
  var data = window.CAREER_MAP;
  var svg = document.getElementById("career-map");
  var steps = Array.prototype.slice.call(document.querySelectorAll(".journey-steps [data-stop]"));
  var card = document.getElementById("map-card");
  var playBtn = document.getElementById("journey-play");
  if (!data || !svg || !steps.length) return;

  var NS = "http://www.w3.org/2000/svg";
  // Label offsets keep nearby cities (Paris / Wageningen) from overlapping.
  var labelPos = {
    sofia: { dx: 12, dy: 5, anchor: "start" },
    wageningen: { dx: 10, dy: -10, anchor: "start" },
    paris: { dx: -12, dy: 16, anchor: "end" },
    atlanta: { dx: 0, dy: 26, anchor: "middle" },
    berkeley: { dx: 12, dy: -12, anchor: "start" }
  };

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  svg.setAttribute("viewBox", "0 0 " + data.w + " " + data.h);
  el("rect", { class: "map-sea", x: 0, y: 0, width: data.w, height: data.h }, svg);
  el("path", { class: "map-land", d: data.land }, svg);
  el("path", { class: "map-borders", d: data.borders }, svg);

  var ids = steps.map(function (s) { return s.getAttribute("data-stop"); });
  var arcLayer = el("g", { class: "map-arcs" }, svg);
  var pinLayer = el("g", { class: "map-pins" }, svg);

  // Curved arcs between consecutive stops, bowing upward like flight paths.
  var arcs = [];
  for (var i = 1; i < ids.length; i++) {
    var a = data.points[ids[i - 1]], b = data.points[ids[i]];
    var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    var dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
    var d = "M" + a + " Q" + mx + "," + (my - Math.max(18, dist * 0.28)) + " " + b;
    var p = el("path", { class: "map-arc", d: d }, arcLayer);
    arcs.push(p);
  }
  arcs.forEach(function (p) {
    var len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
  });

  var pins = {};
  ids.forEach(function (id, idx) {
    var pt = data.points[id];
    var lp = labelPos[id] || { dx: 10, dy: 4, anchor: "start" };
    var g = el("g", { class: "map-pin", tabindex: "0", role: "button",
      "aria-label": steps[idx].getAttribute("data-label") }, pinLayer);
    el("circle", { class: "pin-halo", cx: pt[0], cy: pt[1], r: 16 }, g);
    el("circle", { class: "pin-dot", cx: pt[0], cy: pt[1], r: 7 }, g);
    var t = el("text", { x: pt[0] + lp.dx, y: pt[1] + lp.dy, "text-anchor": lp.anchor }, g);
    t.textContent = steps[idx].getAttribute("data-city");
    pins[id] = g;
    g.addEventListener("mouseenter", function () { stopPlay(); activate(idx); });
    g.addEventListener("focus", function () { stopPlay(); activate(idx); });
    g.addEventListener("click", function () { stopPlay(); activate(idx); });
  });

  steps.forEach(function (s, idx) {
    s.addEventListener("mouseenter", function () { stopPlay(); activate(idx); });
    s.addEventListener("focus", function () { stopPlay(); activate(idx); });
    s.addEventListener("click", function () { stopPlay(); activate(idx); });
  });

  var current = -1;
  function activate(idx) {
    if (idx === current) return;
    current = idx;
    steps.forEach(function (s, i) {
      s.classList.toggle("is-active", i === idx);
      s.classList.toggle("is-past", i < idx);
      s.setAttribute("aria-pressed", i === idx ? "true" : "false");
    });
    ids.forEach(function (id, i) {
      pins[id].classList.toggle("is-active", i === idx);
      pins[id].classList.toggle("is-past", i < idx);
    });
    // Reveal the path travelled so far.
    arcs.forEach(function (p, i) {
      p.style.strokeDashoffset = i < idx ? 0 : p.style.strokeDasharray;
    });
    var s = steps[idx];
    card.innerHTML =
      '<span class="card-when">' + s.getAttribute("data-when") + "</span>" +
      '<strong class="card-title">' + s.getAttribute("data-label") + "</strong>" +
      '<span class="card-role">' + s.getAttribute("data-role") + "</span>" +
      '<span class="card-detail">' + s.getAttribute("data-detail") + "</span>";
  }

  var timer = null;
  function stopPlay() {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
    playBtn.textContent = "▶ Play the journey";
  }
  playBtn.addEventListener("click", function () {
    if (timer) return stopPlay();
    var i = 0;
    current = -1;
    activate(0);
    playBtn.textContent = "❚❚ Pause";
    timer = setInterval(function () {
      i++;
      if (i >= ids.length) return stopPlay();
      activate(i);
    }, 1800);
  });

  activate(ids.length - 1);
})();
