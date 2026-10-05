/* 渲染逻辑：纯前端，无后端 */
(function () {
  const $ = (s) => document.querySelector(s);

  /* ---------- 详情卡片 ---------- */
  const listEl = $("#agent-list");
  const filtersEl = $("#filters");
  let activeFilter = "all";

  const FILTERS = [
    { k: "all", label: "全部" },
    { k: "china", label: "🇨🇳 大陆可用" },
    { k: "code", label: "💻 代码强" },
    { k: "price", label: "💰 性价比高" },
    { k: "agent", label: "🤖 Agent 自主性强" },
  ];

  function stars(n) {
    return "★".repeat(n) + "☆".repeat(5 - n);
  }

  function avgScore(a) {
    const s = a.scores;
    return (s.code + s.reasoning + s.multimodal + s.agent + s.chinese + s.price) / 6;
  }

  function matchFilter(a) {
    if (activeFilter === "all") return true;
    if (activeFilter === "china") return a.china;
    return a.scores[activeFilter] >= 5;
  }

  function renderFilters() {
    filtersEl.innerHTML = FILTERS.map(
      (f) => `<button class="filter-btn${f.k === activeFilter ? " active" : ""}" data-k="${f.k}">${f.label}</button>`
    ).join("");
    filtersEl.querySelectorAll(".filter-btn").forEach((b) =>
      b.addEventListener("click", () => {
        activeFilter = b.dataset.k;
        renderFilters();
        renderAgents();
      })
    );
  }

  function renderAgents() {
    const items = AGENTS.filter(matchFilter);
    listEl.innerHTML = items
      .map((a, i) => {
        const badge = a.china
          ? `<span class="cn-badge">🇨🇳 大陆可用</span>`
          : `<span class="cn-badge no">${a.chinaNote}</span>`;
        const scoreRows = Object.keys(DIM_LABELS)
          .map(
            (k) => `<div class="score-row">
              <span class="lbl">${DIM_LABELS[k]}</span>
              <span class="bar"><i style="width:${a.scores[k] * 20}%"></i></span>
              <span class="val">${a.scores[k]}/5</span>
            </div>`
          )
          .join("");
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
              <div class="m"><b>旗舰模型</b>${a.models.join("<br>")}</div>
              <div class="m"><b>上下文</b>${a.context}</div>
              <div class="m"><b>价格</b>${a.price}</div>
            </div>
            <div class="score-bars">${scoreRows}</div>
            <div class="pc-grid">
              <div class="pc pros"><h4>✅ 优势</h4><ul>${a.pros.map((p) => `<li>${p}</li>`).join("")}</ul></div>
              <div class="pc cons"><h4>❌ 劣势</h4><ul>${a.cons.map((c) => `<li>${c}</li>`).join("")}</ul></div>
            </div>
            <div class="verdict"><b>一句话点评：</b>${a.verdict}</div>
          </div>
        </article>`;
      })
      .join("");
    listEl.querySelectorAll(".agent-head").forEach((h) =>
      h.addEventListener("click", () => h.parentElement.classList.toggle("open"))
    );
  }

  /* ---------- 对比表 ---------- */
  function renderScoreTable() {
    const dims = Object.keys(DIM_LABELS);
    let html = `<thead><tr><th>产品</th>${dims.map((d) => `<th>${DIM_LABELS[d]}</th>`).join("")}</tr></thead><tbody>`;
    AGENTS.forEach((a) => {
      html += `<tr><td><b>${a.name}</b><br><span class="co">${a.company}</span></td>${dims
        .map((d) => `<td class="stars">${stars(a.scores[d])}</td>`)
        .join("")}</tr>`;
    });
    $("#score-table").innerHTML = html + "</tbody>";
  }

  function renderPriceTable() {
    const rows = [
      ["Claude", "✅（Sonnet 级）", "—", "Pro $20/月", "Max $100/$200/月"],
      ["ChatGPT", "✅（限量+广告）", "Go $8/月", "Plus $20/月", "Pro $200/月"],
      ["Gemini", "✅（10/9 后仅 Flash-Lite）", "Plus $4.99/月", "Pro $19.99/月", "Ultra $99.99/$199.99/月"],
      ["Grok", "✅ 基础版", "X Premium $8 / Lite $10", "SuperGrok $30 / Premium+ $40", "Plus $100 / Heavy $300"],
      ["Copilot", "✅（Win/Edge 基础）", "—", "M365 商业版 $21/月", "企业版 $30/月 + 按量"],
      ["DeepSeek", "✅", "—", "API 极便宜（¥2/¥8）", "—"],
      ["Qwen（通义）", "✅", "—", "API 便宜", "—"],
      ["Kimi", "✅", "—", "API $3/$15（K3）", "—"],
      ["豆包", "✅", "¥68/月", "¥200/月", "¥500/月"],
      ["Manus", "❌ 无公开免费档", "$20/月（4000 点）", "$40/月", "按量加购"],
    ];
    $("#price-table").innerHTML =
      `<thead><tr><th>产品</th><th>免费档</th><th>入门付费</th><th>主力档</th><th>顶级档</th></tr></thead><tbody>` +
      rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<td><b>${c}</b></td>` : `<td>${c}</td>`)).join("")}</tr>`).join("") +
      "</tbody>";
  }

  /* ---------- 选购指南 ---------- */
  function renderGuides() {
    $("#guide-list").innerHTML = GUIDES.map(
      (g) => `<div class="guide-card"><h3>${g.title}</h3><p>${g.body}</p></div>`
    ).join("");
  }

  renderFilters();
  renderAgents();
  renderScoreTable();
  renderPriceTable();
  renderGuides();
})();
