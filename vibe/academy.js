const state = {
  issue: null,
  cases: [],
  candidates: [],
  covers: {},
  types: [],
  contexts: {},
  valueNotice: "",
  hackathons: [],
  hackathonCheckedAt: "",
  activeRegion: "all",
  activeFilter: "all",
  activeMechanism: "",
  query: "",
  visibleCount: 12
};

const elements = {
  header: document.querySelector("[data-header]"),
  featuredGrid: document.querySelector("#featured-grid"),
  issueKicker: document.querySelector("#issue-kicker"),
  heroImage: document.querySelector("#hero-image"),
  heroLabel: document.querySelector("#hero-label"),
  heroWork: document.querySelector("#hero-work"),
  heroAuthor: document.querySelector("#hero-author"),
  archiveGrid: document.querySelector("#archive-grid"),
  archiveTotal: document.querySelector("#archive-total"),
  archiveStatus: document.querySelector("#archive-status"),
  archiveSearch: document.querySelector("#archive-search"),
  archiveFilters: document.querySelector("#archive-filters"),
  typeGuide: document.querySelector("#type-guide"),
  valueNotice: document.querySelector("#value-notice"),
  mechanismSelection: document.querySelector("#mechanism-selection"),
  selectedMechanism: document.querySelector("#selected-mechanism"),
  clearMechanism: document.querySelector("#clear-mechanism"),
  loadMore: document.querySelector("#load-more"),
  hackathonGroups: document.querySelector("#hackathon-groups"),
  hackathonFilters: document.querySelector("#hackathon-filters"),
  hackathonChecked: document.querySelector("#hackathon-checked"),
  hackathonNotice: document.querySelector("#hackathon-notice"),
  hackathonCount: document.querySelector("#hackathon-count"),
  dialog: document.querySelector("#case-dialog"),
  dialogContent: document.querySelector("#dialog-content"),
  dialogClose: document.querySelector(".dialog-close")
};

const escapeHTML = (value = "") =>
  String(value).replace(
    /[&<>'"]/g,
    (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]
  );

const safeURL = (value = "") => {
  try {
    const url = new URL(value, window.location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
  } catch {
    return "#";
  }
};

const safeCover = (id) => {
  const path = state.covers[id]?.src;
  return typeof path === "string" && path.startsWith("./vibe/covers/") ? path : "";
};

const shortTitle = (title = "") => title.split(/\s+[—–-]\s+/)[0] || title;

const yearFrom = (pageTime = "") => pageTime.match(/20\d{2}/)?.[0] || "";

const caseContext = (item) => item.context || state.contexts[item.id];
const caseType = (item) => state.types.find((type) => type.id === caseContext(item)?.type);

function valueSummary(item) {
  const context = caseContext(item);
  if (!context) return '<p class="case-value-note">应用价值尚待分析，不由视觉推定商业成果。</p>';
  return `<div class="case-value"><p class="value-kicker">应用价值 · 待验证</p><p>${escapeHTML(context.value)}</p><p class="value-audience">适用对象：${escapeHTML(context.audience)}</p></div>`;
}

function renderTypes() {
  elements.typeGuide.innerHTML = state.types.map((type) => `
    <button class="type-tile" type="button" data-filter="${escapeHTML(type.id)}" aria-pressed="false">
      <strong>${escapeHTML(type.label)}</strong><span>${escapeHTML(type.question)}</span><small>${state.candidates.filter((item) => caseContext(item)?.type === type.id).length} 个案例 ↗</small>
    </button>`).join("");
  elements.valueNotice.textContent = state.valueNotice;
}

function renderHero() {
  if (!state.issue) return;
  const featured = state.cases.find((item) => item.id === state.issue.featuredId) || state.cases[0];
  if (!featured) return;

  const cover = safeCover(featured.id);
  if (cover) elements.heroImage.src = cover;
  elements.heroImage.alt = `${featured.title} 的作品画面`;
  elements.heroLabel.textContent = `本期首选 · ${featured.mechanisms?.[0] || "实验前端"}`;
  elements.heroWork.textContent = shortTitle(featured.title);
  elements.heroAuthor.textContent = [featured.author, yearFrom(featured.pageTime)].filter(Boolean).join(" · ");
  elements.issueKicker.textContent = `${state.issue.issueNo || "CURRENT ISSUE"} · ${state.issue.dateLabel || ""}`;
}

function featureCardTemplate(item, index) {
  const cover = safeCover(item.id);
  const tags = (item.mechanisms || [])
    .map((mechanism) => `<span class="mechanism-tag">${escapeHTML(mechanism)}</span>`)
    .join("");

  return `
    <article class="feature-card reveal" data-type="${escapeHTML(caseContext(item)?.type || "unclassified")}">
      <div class="feature-card-media">
        ${
          cover
            ? `<img src="${escapeHTML(cover)}" alt="${escapeHTML(item.title)} 的公开作品画面" loading="${index === 0 ? "eager" : "lazy"}" />`
            : `<div class="archive-placeholder"><span>${escapeHTML(shortTitle(item.title))}</span></div>`
        }
        <span class="feature-index">0${index + 1}</span>
      </div>
      <div class="feature-card-body">
        <p class="case-type">${escapeHTML(caseType(item)?.label || "待分类")}</p>
        <p class="feature-meta">${escapeHTML(item.platform)} · ${escapeHTML(item.author)}</p>
        <h3>${escapeHTML(item.title)}</h3>
        <p class="feature-memory">${escapeHTML(item.memory)}</p>
        ${valueSummary(item)}
        <div class="mechanism-tags">${tags}</div>
        <button class="feature-open" type="button" data-case-id="${escapeHTML(item.id)}">价值与技术拆解 ↗</button>
      </div>
    </article>`;
}

function renderFeatured() {
  elements.featuredGrid.innerHTML = state.cases.map(featureCardTemplate).join("");
  observeReveals();
}

function orderedCandidates(candidates) {
  const withCover = [];
  const withoutCover = [];
  candidates.forEach((candidate) => (safeCover(candidate.id) ? withCover : withoutCover).push(candidate));
  return [...withCover, ...withoutCover];
}

function filteredCandidates() {
  const query = state.query.trim().toLocaleLowerCase("zh-CN");
  return state.candidates.filter((item) => {
    const context = caseContext(item);
    const matchesFilter = state.activeFilter === "all" || context?.type === state.activeFilter;
    const matchesMechanism = !state.activeMechanism || item.mechanisms?.includes(state.activeMechanism);
    const haystack = [item.title, item.author, item.platform, item.memory, caseType(item)?.label, context?.audience, context?.value, context?.conditions, ...(item.mechanisms || [])]
      .join(" ")
      .toLocaleLowerCase("zh-CN");
    return matchesFilter && matchesMechanism && (!query || haystack.includes(query));
  });
}

function archiveCardTemplate(item) {
  const cover = safeCover(item.id);
  const mechanism = item.mechanisms?.[0] || "实验前端";
  const context = caseContext(item);
  const type = caseType(item);
  const url = escapeHTML(safeURL(item.url));
  return `
    <article class="archive-card reveal" data-type="${escapeHTML(context?.type || "unclassified")}">
      <a href="${url}" target="_blank" rel="noopener noreferrer" aria-label="打开 ${escapeHTML(item.title)} 原作品">
        ${
          cover
            ? `<img class="archive-image" src="${escapeHTML(cover)}" alt="${escapeHTML(item.title)} 的公开作品画面" loading="lazy" />`
            : `<div class="archive-placeholder"><span>${escapeHTML(mechanism)}</span></div>`
        }
      </a>
      <div class="archive-card-body">
          <p class="case-type">${escapeHTML(type?.label || "待分类")}</p>
          <p class="archive-meta">${escapeHTML(item.issueNo || "ARCHIVE")} · ${escapeHTML(item.dateLabel || item.platform)}</p>
          <h3><a href="${url}" target="_blank" rel="noopener noreferrer">${escapeHTML(item.title)}</a></h3>
          <p class="archive-author">${escapeHTML(item.author)} · ${escapeHTML(item.platform)}</p>
          ${valueSummary(item)}
          ${context ? `<details class="value-conditions"><summary>落地条件与验证方法</summary><p>${escapeHTML(context.conditions)}</p><p><strong>建议验证：</strong>${escapeHTML(context.measure || type?.measure || "先确认目标任务与判断指标。")}</p></details>` : ""}
          <span class="archive-mechanism">机制：${escapeHTML(mechanism)}</span>
      </div>
    </article>`;
}

function renderArchive() {
  const matches = filteredCandidates();
  const visible = matches.slice(0, state.visibleCount);

  elements.archiveGrid.innerHTML = visible.length
    ? visible.map(archiveCardTemplate).join("")
    : '<p class="empty-state">没有找到匹配的作品。试试更短的关键词、切换类型或清除机制筛选。</p>';
  elements.archiveStatus.textContent = visible.length ? `已显示 ${visible.length} / ${matches.length}` : "";
  elements.loadMore.hidden = visible.length >= matches.length;
  elements.mechanismSelection.hidden = !state.activeMechanism;
  elements.selectedMechanism.textContent = `机制：${state.activeMechanism}`;
  observeReveals();
}

function setFilter(filter) {
  state.activeFilter = filter;
  state.visibleCount = 12;
  document.querySelectorAll("[data-filter]").forEach((button) => {
    const active = button.dataset.filter === filter;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  renderArchive();
}

function hackathonStatus(item, now = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: item.eventTimeZone || "Asia/Shanghai" }).format(now);
  if (item.eventEndsOn && today > item.eventEndsOn) return { code: "ended", label: "活动已结束" };
  if (item.registrationStatus === "closed") return { code: "closed", label: "报名已截止" };
  if ((item.registrationClosesAt && now >= new Date(item.registrationClosesAt)) ||
      (item.registrationClosesOn && today > item.registrationClosesOn)) {
    return { code: "closed", label: "官方截止日已过" };
  }
  if (now - new Date(state.hackathonCheckedAt) > 7 * 24 * 60 * 60 * 1000) {
    return { code: "review", label: "信息待复核 · 查官方" };
  }
  if (item.restriction) return { code: "restricted", label: "地区限制 · 仅供观察" };
  if (item.eventStartsOn && today >= item.eventStartsOn) return { code: "review", label: "活动期 · 报名待确认" };
  if (item.registrationClosesOn === today) return { code: "review", label: "截止日 · 查官方时刻" };
  return item.registrationStatus === "application"
    ? { code: "application", label: "申请制 · 名额待确认" }
    : { code: "open", label: "官方申报期内" };
}

function hackathonCardTemplate(item) {
  const status = hackathonStatus(item);
  return `<article class="hackathon-card" data-event-id="${escapeHTML(item.id)}" data-region="${escapeHTML(item.region)}">
    <div class="hackathon-card-top"><span class="hackathon-status" data-status="${status.code}">${status.label}</span><span class="hackathon-format">${escapeHTML(item.format)}</span></div>
    <p class="hackathon-topic">${escapeHTML(item.topic)}</p>
    <h4>${escapeHTML(item.title)}</h4>
    <p class="hackathon-organizer">${escapeHTML(item.organizer)}</p>
    ${item.restriction ? `<p class="hackathon-restriction">${escapeHTML(item.restriction)}</p>` : ""}
    <dl class="hackathon-facts">
      <div><dt>赛程</dt><dd>${escapeHTML(item.period)}</dd></div>
      <div><dt>地点</dt><dd>${escapeHTML(item.location)}</dd></div>
      <div><dt>截止</dt><dd>${escapeHTML(item.deadlineLabel)}</dd></div>
      <div><dt>门槛</dt><dd>${escapeHTML(item.eligibility)}</dd></div>
    </dl>
    <div class="hackathon-value"><p class="value-kicker">参与价值 · 编辑判断</p><p>${escapeHTML(item.value)}</p></div>
    <details class="hackathon-details"><summary>交付要求、成本与证据</summary>
      <p><strong>需要做什么：</strong>${escapeHTML(item.deliverables)}</p>
      <p><strong>成本：</strong>${escapeHTML(item.cost)}</p>
      <p><strong>证据边界：</strong>${escapeHTML(item.boundary)}</p>
      <div class="hackathon-sources">${item.sources.map((source) => `<a href="${escapeHTML(safeURL(source.url))}" target="_blank" rel="noopener noreferrer">${escapeHTML(source.label)} ↗</a>`).join("")}</div>
    </details>
    <a class="hackathon-official text-link" href="${escapeHTML(safeURL(item.url))}" target="_blank" rel="noopener noreferrer">查看官方详情 <span aria-hidden="true">↗</span></a>
  </article>`;
}

function renderHackathons() {
  const regions = [{ id: "domestic", label: "国内", note: "中国主办或中国举办" }, { id: "international", label: "国际", note: "海外主办 · 含全球线上" }];
  const selected = regions.filter((region) => state.activeRegion === "all" || state.activeRegion === region.id);
  elements.hackathonGroups.innerHTML = selected.map((region) => {
    const events = state.hackathons.filter((item) => item.region === region.id);
    return `<section class="hackathon-group" aria-labelledby="hackathon-${region.id}"><div class="hackathon-group-heading"><h3 id="hackathon-${region.id}">${region.label} <span>${events.length}</span></h3><p>${region.note}</p></div><div class="hackathon-grid">${events.map(hackathonCardTemplate).join("") || '<p class="empty-state">本组暂无经核验活动。</p>'}</div></section>`;
  }).join("");
  const count = state.hackathons.filter((item) => state.activeRegion === "all" || item.region === state.activeRegion).length;
  elements.hackathonCount.textContent = `显示 ${count} 场 · 报名前请回到官方页面确认资格、名额与规则。`;
}

async function loadHackathons() {
  const response = await fetch("./vibe/hackathons.json");
  if (!response.ok) throw new Error("Hackathon data request failed");
  const data = await response.json();
  state.hackathons = data.events;
  state.hackathonCheckedAt = data.checkedAt;
  const checked = new Date(data.checkedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  elements.hackathonChecked.textContent = `官方信息核验：${checked}（北京时间）`;
  elements.hackathonNotice.textContent = data.note;
  renderHackathons();
}

function detailTemplate(label, value, extraClass = "") {
  if (!value) return "";
  return `<section class="dialog-detail ${extraClass}"><h3>${escapeHTML(label)}</h3><p>${escapeHTML(value)}</p></section>`;
}

function openCase(caseId) {
  const item = state.cases.find((candidate) => candidate.id === caseId);
  if (!item) return;
  const cover = safeCover(item.id);
  const context = caseContext(item);
  const type = caseType(item);

  elements.dialogContent.innerHTML = `
    ${cover ? `<img class="dialog-cover" src="${escapeHTML(cover)}" alt="${escapeHTML(item.title)} 的公开作品画面" />` : ""}
    <div class="dialog-body">
      <p class="feature-meta">${escapeHTML(item.platform)} · ${escapeHTML(item.pageTime)}</p>
      <h2 id="dialog-title">${escapeHTML(item.title)}</h2>
      <p class="dialog-byline">作者：${escapeHTML(item.author)} · 复现难度：${escapeHTML(item.difficulty)}</p>
      <p class="dialog-memory">${escapeHTML(item.memory)}</p>
      <section class="dialog-value" aria-labelledby="value-title">
        <p class="case-type">${escapeHTML(type?.label || "待分类")}</p>
        <h3 id="value-title">应用与商业价值判断</h3>
        <p class="value-boundary">策展判断 · 商业结果未验证</p>
        <div class="dialog-detail-grid">
          ${detailTemplate("适用对象与场景", context?.audience)}
          ${detailTemplate("能解决什么问题", context?.value)}
          ${detailTemplate("落地条件与限制", context?.conditions)}
          ${detailTemplate("建议如何验证", context?.measure || type?.measure)}
        </div>
        <p class="case-value-note">${escapeHTML(context ? state.valueNotice : "本案例的应用价值尚待分析；不由视觉推定商业成果。")}</p>
      </section>
      <div class="dialog-detail-grid">
        ${detailTemplate("为什么不是普通特效", item.why)}
        ${detailTemplate("输入", item.input)}
        ${detailTemplate("表现层", item.layer)}
        ${detailTemplate("动效与镜头", item.motion)}
        ${detailTemplate("工程管线与难点", item.pipeline)}
        ${detailTemplate("性能与移动端降级", item.performance)}
        ${detailTemplate("迁移到 Joey 作品集", item.transfer)}
        ${detailTemplate("证据边界", item.evidence, "dialog-evidence")}
      </div>
      <div class="dialog-action"><a class="button button-primary" href="${escapeHTML(safeURL(item.url))}" target="_blank" rel="noopener noreferrer">查看原作品 ↗</a></div>
    </div>`;

  elements.dialog.showModal();
  elements.dialogClose.focus();
}

let revealObserver;
function observeReveals() {
  const items = document.querySelectorAll(".reveal:not([data-observed])");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px" }
    );
  }
  items.forEach((item) => {
    item.dataset.observed = "true";
    revealObserver.observe(item);
  });
}

async function loadData() {
  const [issuesResponse, candidatesResponse, coversResponse, contextsResponse] = await Promise.all([
    fetch("./vibe/issues.json"),
    fetch("./vibe/site-candidates.json"),
    fetch("./vibe/cover-map.json"),
    fetch("./vibe/case-context.json")
  ]);

  if (!issuesResponse.ok || !candidatesResponse.ok || !coversResponse.ok || !contextsResponse.ok) throw new Error("Data request failed");
  const [issuesData, candidatesData, coversData, contextsData] = await Promise.all([
    issuesResponse.json(),
    candidatesResponse.json(),
    coversResponse.json(),
    contextsResponse.json()
  ]);

  state.issue = issuesData.issues?.[0] || null;
  state.cases = state.issue?.cases || [];
  state.covers = coversData || {};
  state.types = contextsData.types || [];
  state.contexts = contextsData.cases || {};
  state.valueNotice = contextsData.valueNotice || "";
  state.candidates = orderedCandidates(candidatesData.candidates || []);
  elements.archiveTotal.textContent = String(state.candidates.length);

  renderHero();
  renderFeatured();
  renderTypes();
  renderArchive();
}

elements.featuredGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-case-id]");
  if (button) openCase(button.dataset.caseId);
});

elements.archiveSearch.addEventListener("input", (event) => {
  state.query = event.target.value;
  state.visibleCount = 12;
  renderArchive();
});

elements.archiveFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (button) setFilter(button.dataset.filter);
});

elements.typeGuide.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (button) setFilter(button.dataset.filter);
});

elements.hackathonFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-region]");
  if (!button) return;
  state.activeRegion = button.dataset.region;
  elements.hackathonFilters.querySelectorAll("[data-region]").forEach((item) => {
    const active = item.dataset.region === state.activeRegion;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-pressed", String(active));
  });
  renderHackathons();
});

elements.clearMechanism.addEventListener("click", () => {
  state.activeMechanism = "";
  state.visibleCount = 12;
  renderArchive();
});

document.querySelectorAll("[data-mechanism]").forEach((button) => {
  button.addEventListener("click", () => {
    state.activeMechanism = button.dataset.mechanism;
    state.visibleCount = 12;
    renderArchive();
    document.querySelector("#archive").scrollIntoView({ behavior: "smooth" });
  });
});

elements.loadMore.addEventListener("click", () => {
  state.visibleCount += 12;
  renderArchive();
});

elements.dialogClose.addEventListener("click", () => elements.dialog.close());
elements.dialog.addEventListener("click", (event) => {
  if (event.target === elements.dialog) elements.dialog.close();
});

window.addEventListener(
  "scroll",
  () => elements.header.classList.toggle("is-scrolled", window.scrollY > 12),
  { passive: true }
);

observeReveals();
loadHackathons().catch((error) => {
  console.error("VIBE FRONTIER hackathon load failed", error);
  elements.hackathonGroups.innerHTML = '<p class="empty-state">活动信息暂时无法载入，请稍后刷新。</p>';
});
loadData().catch((error) => {
  console.error("VIBE FRONTIER data load failed", error);
  elements.featuredGrid.innerHTML = '<p class="empty-state">本期案例暂时无法载入，请稍后刷新。</p>';
  elements.archiveGrid.innerHTML = '<p class="empty-state">研究档案暂时无法载入，请稍后刷新。</p>';
  elements.loadMore.hidden = true;
});
