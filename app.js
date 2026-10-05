/* 三语渲染 + 语言切换：纯前端，无后端 */
(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const LANGS = [
    { k: "zh", label: "中文" },
    { k: "en", label: "EN" },
    { k: "ja", label: "日本語" },
  ];
  let lang = localStorage.getItem("aa-lang") || "zh";
  if (!I18N[lang]) lang = "zh";
  let activeFilter = "all";

  const FILTERS = [
    { k: "all", lk: "all" },
    { k: "china", lk: "china" },
    { k: "code", lk: "code" },
    { k: "price", lk: "price" },
    { k: "agent", lk: "agent" },
  ];

  function t() { return I18N[lang]; }
  function stars(n) { return "★".repeat(n) + "☆".repeat(5 - n); }
  function avgScore(a) {
    const s = a.scores;
    return (s.code + s.reasoning + s.multimodal + s.agent + s.chinese + s.price) / 6;
  }
  function matchFilter(a) {
    if (activeFilter === "all") return true;
    if (activeFilter === "china") return a.china;
    return a.scores[activeFilter] >= 5;
  }

  /* ---------- 语言切换器（注入导航栏，无需改 HTML） ---------- */
  function injectSwitcher() {
    if ($("#lang-switch")) return;
    const style = document.createElement("style");
    style.textContent = "#lang-switch{display:flex;gap:.4rem;align-items:center;margin-left:1.2rem}" +
      ".lang-btn{border:2px solid #000;border-radius:999px;background:#fff;font-weight:800;font-size:.8rem;padding:.25rem .8rem;cursor:pointer;box-shadow:2px 2px 0 #000}" +
      ".lang-btn.active{background:#000;color:#fff}";
    document.head.appendChild(style);
    const wrap = document.createElement("div");
    wrap.id = "lang-switch";
    wrap.innerHTML = LANGS.map((l) =>
      `<button class="lang-btn${l.k === lang ? " active" : ""}" data-l="${l.k}">${l.label}</button>`).join("");
    const nav = $(".topnav");
    nav.appendChild(wrap);
    wrap.querySelectorAll(".lang-btn").forEach((b) =>
      b.addEventListener("click", () => setLang(b.dataset.l)));
  }

  function setLang(l) {
    if (!I18N[l] || l === lang) return;
    lang = l;
    localStorage.setItem("aa-lang", l);
    $$("#lang-switch .lang-btn").forEach((b) =>
      b.classList.toggle("active", b.dataset.l === l));
    renderAll();
  }

  /* ---------- 静态文案 ---------- */
  function renderStatic() {
    const ui = t().ui;
    document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
    document.title = ui.doc_title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = ui.meta_desc;

    $(".logo").textContent = ui.logo;
    const navs = $$(".navlinks a");
    [ui.nav_agents, ui.nav_compare, ui.nav_guide, ui.nav_notes].forEach((x, i) => {
      if (navs[i]) navs[i].textContent = x;
    });

    $(".kicker").textContent = ui.kicker;
    $(".hero h1").innerHTML = `<span class="hl">${ui.hero_a}</span><br>${ui.hero_b}`;
    $(".hero .sub").innerHTML = ui.hero_sub;
    const stats = $$(".hero-stats div");
    [[ui.stat_n1, ui.stat_l1], [ui.stat_n2, ui.stat_l2], [ui.stat_n3, ui.stat_l3]].forEach((s, i) => {
      if (stats[i]) stats[i].innerHTML = `<b>${s[0]}</b><span>${s[1]}</span>`;
    });
    $(".cta").textContent = ui.cta;

    const tldrSec = $("#tldr");
    tldrSec.querySelector("h2").innerHTML = `${ui.tldr_title} <span class="h-sub">${ui.tldr_tag}</span>`;
    tldrSec.querySelector(".tldr-grid").innerHTML = ui.tldr.map((c) =>
      `<div class="tldr-card"><b>${c.t}</b><p>${c.p}</p></div>`).join("");

    const agSec = $("#agents");
    agSec.querySelector("h2").textContent = ui.agents_title;
    agSec.querySelector(".sec-desc").textContent = ui.agents_desc;

    const cpSec = $("#compare");
    const h2s = cpSec.querySelectorAll("h2");
    if (h2s[0]) h2s[0].textContent = ui.compare_title;
    const descs = cpSec.querySelectorAll(".sec-desc");
    if (descs[0]) descs[0].textContent = ui.compare_desc;
    if (h2s[1]) h2s[1].textContent = ui.price_title;

    $("#guide").querySelector("h2").textContent = ui.guide_title;

    const ntSec = $("#notes");
    ntSec.querySelector("h2").textContent = ui.notes_title;
    ntSec.querySelector(".notes-card").innerHTML =
      ui.notes.map((p) => `<p>${p}</p>`).join("") +
      `<p class="update">${ui.notes_update}</p>`;

    $("footer p").textContent = ui.footer;
  }

  /* ---------- 筛选器 & 卡片 ---------- */
  function renderFilters() {
    const ui = t().ui;
    const el = $("#filters");
    el.innerHTML = FILTERS.map((f) =>
      `<button class="filter-btn${f.k === activeFilter ? " active" : ""}" data-k="${f.k}">${ui.filters[f.lk]}</button>`).join("");
    el.querySelectorAll(".filter-btn").forEach((b) =>
      b.addEventListener("click", () => {
        activeFilter = b.dataset.k;
        renderFilters();
        renderAgents();
      }));
  }

  function renderAgents() {
    const ui = t().ui;
    const items = t().agents.filter(matchFilter);
    $("#agent-list").innerHTML = items.map((a, i) => {
      const badge = a.china
        ? `<span class="cn-badge">🇨🇳 ${ui.filters.china.replace("🇨🇳 ", "")}</span>`
        : `<span class="cn-badge no">${a.chinaNote}</span>`;
      const scoreRows = DIM_KEYS.map((k) =>
        `<div class="score-row"><span class="lbl">${ui.dims[k]}</span>` +
        `<span class="bar"><i style="width:${a.scores[k] * 20}%"></i></span>` +
        `<span class="val">${a.scores[k]}/5</span></div>`).join("");
      return `<article class="agent-card" data-id="${a.id}">
        <div class="agent-head">
          <span class="rank">${i + 1}</span>
          <div class="agent-title">
            <h3>${a.name} <span class="co">${a.company}</span> ${badge}</h3>
            <p class="tagline">${a.tagline}</p>
          </div>
          <span class="mini-stars">${stars(Math.round(avgScore(a)))}</span>
          <span class="chev">▾</span>
        </div>
        <div class="agent-body">
          <div class="meta-grid">
            <div class="m"><b>${ui.models_label}</b>${a.models.join("<br>")}</div>
            <div class="m"><b>${ui.context_label}</b>${a.context}</div>
            <div class="m"><b>${ui.price_label}</b>${a.price}</div>
          </div>
          <div class="score-bars">${scoreRows}</div>
          <div class="pc-grid">
            <div class="pc pros"><h4>${ui.pros_label}</h4><ul>${a.pros.map((p) => `<li>${p}</li>`).join("")}</ul></div>
            <div class="pc cons"><h4>${ui.cons_label}</h4><ul>${a.cons.map((c) => `<li>${c}</li>`).join("")}</ul></div>
          </div>
          <div class="verdict"><b>${ui.verdict_label}</b>${a.verdict}</div>
        </div>
      </article>`;
    }).join("");
    $("#agent-list").querySelectorAll(".agent-head").forEach((h) =>
      h.addEventListener("click", () => h.parentElement.classList.toggle("open")));
  }

  /* ---------- 对比表 ---------- */
  function renderScoreTable() {
    const ui = t().ui;
    let html = `<thead><tr><th>${ui.price_headers[0]}</th>${DIM_KEYS.map((d) => `<th>${ui.dims[d]}</th>`).join("")}</tr></thead><tbody>`;
    t().agents.forEach((a) => {
      html += `<tr><td><b>${a.name}</b><br><span class="co">${a.company}</span></td>${DIM_KEYS
        .map((d) => `<td class="stars">${stars(a.scores[d])}</td>`).join("")}</tr>`;
    });
    $("#score-table").innerHTML = html + "</tbody>";
  }

  function renderPriceTable() {
    const ui = t().ui;
    $("#price-table").innerHTML =
      `<thead><tr>${ui.price_headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>` +
      t().agents.map((a) =>
        `<tr><td><b>${a.name}</b></td>${a.tiers.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("") +
      "</tbody>";
  }

  function renderGuides() {
    $("#guide-list").innerHTML = t().guides.map((g) =>
      `<div class="guide-card"><h3>${g.title}</h3><p>${g.body}</p></div>`).join("");
  }

  function renderAll() {
    renderStatic();
    renderFilters();
    renderAgents();
    renderScoreTable();
    renderPriceTable();
    renderGuides();
  }

  injectSwitcher();
  renderAll();
})();
