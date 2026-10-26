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
  activeDate: "all",
  activeValue: "all",
  sortOrder: "newest",
  query: "",
  visibleCount: 12,
  viewed: new Set()
};

const elements = {
  header: document.querySelector("[data-header]"),
  featuredGrid: document.querySelector("#featured-grid"),
  issueKicker: document.querySelector("#issue-kicker"),
  heroImage: document.querySelector("#hero-image"),
  heroLabel: document.querySelector("#hero-label"),
  heroWork: document.querySelector("#hero-work"),
  heroAuthor: document.querySelector("#hero-author"),
  heroFeatureOpen: document.querySelector("#hero-feature-open"),
  archiveGrid: document.querySelector("#archive-grid"),
  archiveTotal: document.querySelector("#archive-total"),
  shopCount: document.querySelector("#shop-count"),
  imageNotice: document.querySelector("#image-notice"),
  issueNote: document.querySelector("#issue-note"),
  archiveStatus: document.querySelector("#archive-status"),
  archiveSearch: document.querySelector("#archive-search"),
  archiveFilters: document.querySelector("#archive-filters"),
  archiveDate: document.querySelector("#archive-date"),
  archiveValue: document.querySelector("#archive-value"),
  archiveMechanism: document.querySelector("#archive-mechanism"),
  archiveSort: document.querySelector("#archive-sort"),
  typeGuide: document.querySelector("#type-guide"),
  valueNotice: document.querySelector("#value-notice"),
  filterSelection: document.querySelector("#filter-selection"),
  selectedFilters: document.querySelector("#selected-filters"),
  clearArchiveFilters: document.querySelector("#clear-archive-filters"),
  loadMore: document.querySelector("#load-more"),
  hackathonGroups: document.querySelector("#hackathon-groups"),
  hackathonFilters: document.querySelector("#hackathon-filters"),
  hackathonChecked: document.querySelector("#hackathon-checked"),
  hackathonNotice: document.querySelector("#hackathon-notice"),
  hackathonCount: document.querySelector("#hackathon-count"),
  dialog: document.querySelector("#case-dialog"),
  dialogContent: document.querySelector("#dialog-content"),
  dialogClose: document.querySelector(".dialog-close"),
  viewCount: document.querySelector("#view-count")
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
  return typeof path === "string" && (path.startsWith("./vibe/covers/") || /^https:\/\//.test(path)) ? path : "";
};

const shortTitle = (title = "") => title.split(/\s+[—–-]\s+/)[0] || title;

const mechanismLabel = (mechanism) => ({
  "数据变成空间": "数据可视化",
  "模型成为界面": "可交互 3D 展示",
  "滚动变成镜头": "滚动叙事",
  "排版变成界面": "动态排版",
  "交互变成叙事": "互动故事"
})[mechanism] || mechanism;

const mechanisms = ["数据变成空间", "模型成为界面", "滚动变成镜头", "排版变成界面", "交互变成叙事"];

const caseContext = (item) => item.context || state.contexts[item.id];
const caseType = (item) => state.types.find((type) => type.id === caseContext(item)?.type);

const dateLabel = (date = "") => {
  const parts = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return parts ? `${parts[1]}年${Number(parts[2])}月${Number(parts[3])}日` : "未记录";
};

function sourceTimeLabel(pageTime = "") {
  const labels = {
    "Repository created": "仓库创建",
    "Awwwards Site of the Day": "Awwwards 每日最佳",
    "CSSDA Website of the Day": "CSSDA 每日最佳",
    "CSSDA nominee": "CSSDA 提名页",
    "Website of the Day": "每日最佳奖项页",
    "Special Kudos": "特别嘉奖页",
    "Nominated": "提名页",
    "Nominee": "提名页",
    "Published": "发布记录",
    "Featured": "推荐页",
    "Page time": "页面记录"
  };
  return pageTime.replace(/Repository created|Awwwards Site of the Day|CSSDA Website of the Day|CSSDA nominee|Website of the Day|Special Kudos|Nominated|Nominee|Published|Featured|Page time/g, (label) => labels[label])
    .replace(/(\d{4})\.(\d{2})\.(\d{2})/g, (_, year, month, day) => `${year}年${Number(month)}月${Number(day)}日`) || "原记录未注明";
}

function caseDates(item) {
  const context = caseContext(item);
  const collectedOn = context?.collectedOn || (state.cases.includes(item) ? state.issue?.id : "");
  return `<div class="case-dates"><p>收录 ${collectedOn ? `<time datetime="${escapeHTML(collectedOn)}">${dateLabel(collectedOn)}</time>` : "未记录"}</p><p>来源时间 ${escapeHTML(sourceTimeLabel(context?.pageTime || item.pageTime))}</p></div>`;
}

function valueTags(item) {
  const tags = (caseContext(item)?.tags || ["价值待分析"]).slice(0, 3);
  return `<ul class="value-tags" aria-label="价值方向">${tags.map((tag) => `<li>${escapeHTML(tag)}</li>`).join("")}</ul>`;
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
  elements.heroLabel.textContent = `本期推荐 · ${mechanismLabel(featured.mechanisms?.[0] || "实验前端")}`;
  elements.heroWork.textContent = shortTitle(featured.title);
  elements.heroAuthor.textContent = `${featured.author} · ${sourceTimeLabel(caseContext(featured)?.pageTime || featured.pageTime)}`;
  elements.heroFeatureOpen.dataset.caseId = featured.id;
  elements.heroFeatureOpen.setAttribute("aria-label", `拆开看看本期首选 ${featured.title}`);
  elements.issueKicker.textContent = `${state.issue.issueNo || "CURRENT ISSUE"} · ${dateLabel(state.issue.id)}${state.issue.dateLabel === "TRIAL" ? " · 试读期刊" : ""}`;
  elements.issueNote.textContent = state.issue.note;
}

function featureCardTemplate(item, index) {
  const cover = safeCover(item.id);
  return `
    <article class="feature-card reveal" data-type="${escapeHTML(caseContext(item)?.type || "unclassified")}">
      <button class="feature-card-media" type="button" data-case-id="${escapeHTML(item.id)}" aria-label="查看 ${escapeHTML(item.title)} 的拆解">
        ${
          cover
            ? `<img src="${escapeHTML(cover)}" alt="${escapeHTML(item.title)} 的公开作品画面" loading="${index === 0 ? "eager" : "lazy"}" />`
            : `<div class="archive-placeholder"><span>${escapeHTML(shortTitle(item.title))}</span></div>`
        }
      </button>
      <div class="feature-card-body">
        <h3>${escapeHTML(item.title)}</h3>
        <p class="card-byline">${escapeHTML(item.author)}<span>${escapeHTML(caseType(item)?.label || "实验前端")}</span></p>
        <button class="feature-open" type="button" data-case-id="${escapeHTML(item.id)}">查看拆解 <span aria-hidden="true">↗</span></button>
      </div>
    </article>`;
}

function renderFeatured() {
  elements.featuredGrid.innerHTML = state.cases.map(featureCardTemplate).join("");
  observeReveals();
}

function orderedCandidates(candidates) {
  return candidates.filter((candidate) => safeCover(candidate.id));
}

function replaceOptions(select, initialLabel, values, labelFor = (value) => value) {
  select.replaceChildren(new Option(initialLabel, "all"));
  values.forEach(([value, count]) => select.add(new Option(`${labelFor(value)} · ${count}`, value)));
}

function populateFacets() {
  const dates = new Map();
  const values = new Map();
  state.candidates.forEach((item) => {
    const context = caseContext(item);
    if (context?.collectedOn) dates.set(context.collectedOn, (dates.get(context.collectedOn) || 0) + 1);
    (context?.tags || []).forEach((tag) => values.set(tag, (values.get(tag) || 0) + 1));
  });

  replaceOptions(elements.archiveDate, "全部日期", [...dates].sort(([a], [b]) => b.localeCompare(a)), (value) => dateLabel(value));
  replaceOptions(elements.archiveValue, "全部价值方向", [...values].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN")));
  replaceOptions(elements.archiveMechanism, "全部机制", mechanisms.map((item) => [item, state.candidates.filter((candidate) => candidate.mechanisms?.includes(item)).length]), mechanismLabel);
}

function sortCandidates(candidates) {
  return [...candidates].sort((a, b) => {
    if (state.sortOrder === "title") return a.title.localeCompare(b.title, "zh-CN");
    const aDate = caseContext(a)?.collectedOn || "";
    const bDate = caseContext(b)?.collectedOn || "";
    return state.sortOrder === "oldest" ? aDate.localeCompare(bDate) : bDate.localeCompare(aDate);
  });
}

function filteredCandidates() {
  const query = state.query.trim().toLocaleLowerCase("zh-CN");
  return sortCandidates(state.candidates.filter((item) => {
    const context = caseContext(item);
    const matchesFilter = state.activeFilter === "all" || context?.type === state.activeFilter;
    const matchesMechanism = !state.activeMechanism || item.mechanisms?.includes(state.activeMechanism);
    const matchesDate = state.activeDate === "all" || context?.collectedOn === state.activeDate;
    const matchesValue = state.activeValue === "all" || context?.tags?.includes(state.activeValue);
    const haystack = [item.title, item.author, item.platform, item.memory, caseType(item)?.label, context?.summary, context?.audience, context?.value, context?.conditions, ...(context?.tags || []), ...(item.mechanisms || []), ...(item.mechanisms || []).map(mechanismLabel)]
      .join(" ")
      .toLocaleLowerCase("zh-CN");
    return matchesFilter && matchesMechanism && matchesDate && matchesValue && (!query || haystack.includes(query));
  }));
}

function archiveCardTemplate(item) {
  const cover = safeCover(item.id);
  const context = caseContext(item);
  const type = caseType(item);
  return `
    <article class="archive-card reveal" data-type="${escapeHTML(context?.type || "unclassified")}">
      <button class="archive-media${cover ? "" : " is-unavailable"}" type="button" data-case-id="${escapeHTML(item.id)}" aria-label="查看 ${escapeHTML(item.title)} 的拆解">
        ${
          cover
            ? `<img class="archive-image" src="${escapeHTML(cover)}" alt="${escapeHTML(item.title)} 的公开作品画面" loading="lazy" />`
            : '<span>暂缺可核验作品图</span><span>查看原作品 ↗</span>'
        }
      </button>
      <div class="archive-card-body">
          <h3>${escapeHTML(item.title)}</h3>
          <p class="card-byline">${escapeHTML(item.author)}<span>${escapeHTML(type?.label || "实验前端")}</span></p>
          <button class="archive-open" type="button" data-case-id="${escapeHTML(item.id)}">查看拆解 <span aria-hidden="true">↗</span></button>
      </div>
    </article>`;
}

function renderArchive() {
  const matches = filteredCandidates();
  const visible = matches.slice(0, state.visibleCount);

  elements.archiveGrid.innerHTML = visible.length
    ? visible.map(archiveCardTemplate).join("")
    : '<p class="empty-state">没有匹配的案例。可以缩短关键词，或清除筛选后再试。</p>';
  elements.archiveStatus.textContent = visible.length ? `已显示 ${visible.length} / ${matches.length} · ${state.sortOrder === "oldest" ? "最早优先" : state.sortOrder === "title" ? "作品名排序" : "最新优先"}` : "";
  elements.loadMore.hidden = visible.length >= matches.length;
  const typeLabel = state.types.find((type) => type.id === state.activeFilter)?.label;
  const activeLabels = [
    state.activeDate !== "all" ? `日期 ${dateLabel(state.activeDate)}` : "",
    state.activeValue !== "all" ? `应用价值 ${state.activeValue}` : "",
    typeLabel ? `用途 ${typeLabel}` : "",
    state.activeMechanism ? `机制 ${mechanismLabel(state.activeMechanism)}` : "",
    state.query ? `搜索 ${state.query}` : ""
  ].filter(Boolean);
  elements.filterSelection.hidden = !activeLabels.length;
  elements.selectedFilters.textContent = activeLabels.join(" / ");
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
      <p><strong>需要做什么</strong> ${escapeHTML(item.deliverables)}</p>
      <p><strong>参与成本</strong> ${escapeHTML(item.cost)}</p>
      <p><strong>证据边界</strong> ${escapeHTML(item.boundary)}</p>
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
  elements.hackathonChecked.textContent = `官方信息核验 ${checked}（北京时间）`;
  elements.hackathonNotice.textContent = data.note;
  renderHackathons();
}

function detailTemplate(label, value, extraClass = "") {
  if (!value) return "";
  return `<section class="dialog-detail ${extraClass}"><h3>${escapeHTML(label)}</h3><p>${escapeHTML(value)}</p></section>`;
}

function codeDownloadURL(item) {
  const code = item?.code;
  if (!code || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(code.repository) || !/^[a-f0-9]{40}$/.test(code.revision) || !code.license || !code.licenseUrl) return "";
  return `${code.repository}/archive/${code.revision}.zip`;
}

function downloadTemplate(item) {
  if (!codeDownloadURL(item)) return '<p class="code-unavailable">学习代码尚未核验下载许可，当前只提供原作与来源。</p>';
  return `<section class="code-sharing" aria-labelledby="code-title">
    <p class="case-type">FREE TO LEARN · 尊重原创</p>
    <h3 id="code-title">下载公开学习代码</h3>
    <p>ZIP 直接来自作者原仓库，本站没有改写代码。查看原许可 <a href="${escapeHTML(safeURL(item.code.licenseUrl))}" target="_blank" rel="noopener noreferrer">${escapeHTML(item.code.license)} ↗</a>。</p>
    <p>${escapeHTML(item.code.notice)}</p>
    <p class="code-boundary">以下是本站下载入口的学习承诺，不改写原作者许可，也不授予额外权利。图片、字体、数据等仍需分别遵守原始条款。</p>
    <form class="code-download-form" data-code-case="${escapeHTML(item.id)}">
      <label class="code-agreement"><input type="checkbox" name="learning-agreement" required /><span>我已阅读并承诺仅作个人学习，不抄袭、不商用，保留原作者署名与许可说明。</span></label>
      <button class="button button-primary" type="submit" disabled>同意后下载代码 ZIP ↗</button>
      <small>每次打开需重新勾选；本站不收集个人信息，不提供付费解锁。</small>
    </form>
  </section>`;
}

function openCase(caseId) {
  const item = state.cases.find((candidate) => candidate.id === caseId) ||
    state.candidates.find((candidate) => candidate.id === caseId);
  if (!item) return;
  state.viewed.add(item.id);
  elements.viewCount.textContent = String(state.viewed.size);
  const cover = safeCover(item.id);
  const context = caseContext(item);
  const type = caseType(item);

  elements.dialogContent.innerHTML = `
    ${cover ? `<img class="dialog-cover" src="${escapeHTML(cover)}" alt="${escapeHTML(item.title)} 的公开作品画面" />` : ""}
    <div class="dialog-body">
      <p class="dialog-image-credit">${escapeHTML(state.covers[item.id]?.credit || "作品画面，权利归原作者所有")} · <a href="${escapeHTML(safeURL(state.covers[item.id]?.source || item.url))}" target="_blank" rel="noopener noreferrer">画面来源 ↗</a></p>
      <p class="feature-meta">${escapeHTML(item.platform)}</p>
      <h2 id="dialog-title">${escapeHTML(item.title)}</h2>
      <p class="dialog-byline">作者 ${escapeHTML(item.author)} · 复现难度 ${escapeHTML(item.difficulty)}</p>
      ${caseDates(item)}
      ${valueTags(item)}
      <p class="dialog-memory">${escapeHTML(item.memory)}</p>
      <section class="dialog-value" aria-labelledby="value-title">
        <p class="case-type">${escapeHTML(type?.label || "待分类")}</p>
        <h3 id="value-title">应用价值与学习方向</h3>
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
        ${detailTemplate("为什么成立", item.why)}
        ${detailTemplate("所需输入", item.input)}
        ${detailTemplate("页面表现", item.layer)}
        ${detailTemplate("动效与镜头", item.motion)}
        ${detailTemplate("工程管线与难点", item.pipeline)}
        ${detailTemplate("性能与移动端降级", item.performance)}
        ${detailTemplate("可以复用的方向", item.transfer)}
        ${detailTemplate("证据边界", item.evidence, "dialog-evidence")}
      </div>
      ${downloadTemplate(item)}
      <div class="dialog-action">
        <a class="button button-primary" href="${escapeHTML(safeURL(item.url))}" target="_blank" rel="noopener noreferrer">查看原作品 ↗</a>
        <button class="button button-surprise" type="button" data-random-next>随机看下一件</button>
      </div>
    </div>`;

  if (!elements.dialog.open) elements.dialog.showModal();
  elements.dialogClose.focus();
}

function openRandomCase() {
  if (!state.candidates.length) return;
  const unseen = state.candidates.filter((item) => !state.viewed.has(item.id));
  const pool = unseen.length ? unseen : state.candidates;
  const item = pool[Math.floor(Math.random() * pool.length)];
  openCase(item.id);
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
    fetch("./vibe/issues.json", { cache: "no-cache" }),
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

  state.covers = coversData || {};
  state.types = contextsData.types || [];
  state.contexts = contextsData.cases || {};
  state.valueNotice = contextsData.valueNotice || "";
  const library = new Map((candidatesData.candidates || []).map((item) => [item.id, item]));
  // Merge published issues so new work never stays hidden behind the historical snapshot.
  for (const issue of [...(issuesData.issues || [])].reverse()) {
    for (const item of issue.cases) {
      const context = item.context || state.contexts[item.id] || {};
      library.set(item.id, { ...item, context: { ...context, collectedOn: context.collectedOn || issue.id, pageTime: context.pageTime || item.pageTime } });
      if (item.image) state.covers[item.id] = { src: item.image, source: item.imageSource, credit: item.imageCredit };
    }
  }
  state.issue = issuesData.issues?.[0] || null;
  state.cases = (state.issue?.cases || []).map((item) => library.get(item.id)).filter((item) => safeCover(item.id));
  state.candidates = orderedCandidates([...library.values()]);
  elements.archiveTotal.textContent = String(state.candidates.length);
  elements.shopCount.textContent = `${state.candidates.length} 个有图案例`;
  const pendingImages = library.size - state.candidates.length;
  elements.imageNotice.textContent = `当前只展示有可核验作品图的案例。另有 ${pendingImages} 条历史研究记录暂缺图片，继续保留在档案中。收录日期与作品上线时间分开标注。`;
  populateFacets();

  renderHero();
  renderFeatured();
  renderTypes();
  renderArchive();
}

elements.featuredGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-case-id]");
  if (button) openCase(button.dataset.caseId);
});

elements.heroFeatureOpen.addEventListener("click", () => {
  if (elements.heroFeatureOpen.dataset.caseId) openCase(elements.heroFeatureOpen.dataset.caseId);
});

document.querySelectorAll("#nav-random-pick, #hero-random-pick, #aisle-random-pick, #dock-random-pick").forEach((button) => {
  button.addEventListener("click", openRandomCase);
});

document.querySelector("#shop-map").addEventListener("click", (event) => {
  const button = event.target.closest("[data-shop-filter]");
  if (!button) return;
  setFilter(button.dataset.shopFilter);
  document.querySelector("#archive").scrollIntoView({ behavior: "smooth" });
});

elements.archiveSearch.addEventListener("input", (event) => {
  state.query = event.target.value;
  state.visibleCount = 12;
  renderArchive();
});

elements.archiveDate.addEventListener("change", (event) => {
  state.activeDate = event.target.value;
  state.visibleCount = 12;
  renderArchive();
});

elements.archiveValue.addEventListener("change", (event) => {
  state.activeValue = event.target.value;
  state.visibleCount = 12;
  renderArchive();
});

elements.archiveMechanism.addEventListener("change", (event) => {
  state.activeMechanism = event.target.value === "all" ? "" : event.target.value;
  state.visibleCount = 12;
  renderArchive();
});

elements.archiveSort.addEventListener("change", (event) => {
  state.sortOrder = event.target.value;
  state.visibleCount = 12;
  renderArchive();
});

elements.archiveGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-case-id]");
  if (button) openCase(button.dataset.caseId);
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

elements.clearArchiveFilters.addEventListener("click", () => {
  state.activeFilter = "all";
  state.activeMechanism = "";
  state.activeDate = "all";
  state.activeValue = "all";
  state.sortOrder = "newest";
  state.query = "";
  state.visibleCount = 12;
  elements.archiveSearch.value = "";
  elements.archiveDate.value = "all";
  elements.archiveValue.value = "all";
  elements.archiveMechanism.value = "all";
  elements.archiveSort.value = "newest";
  document.querySelectorAll("[data-filter]").forEach((button) => {
    const active = button.dataset.filter === "all";
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  renderArchive();
});

document.querySelectorAll("[data-mechanism]").forEach((button) => {
  button.addEventListener("click", () => {
    state.activeMechanism = button.dataset.mechanism;
    elements.archiveMechanism.value = state.activeMechanism;
    state.visibleCount = 12;
    renderArchive();
    document.querySelector("#archive").scrollIntoView({ behavior: "smooth" });
  });
});

elements.loadMore.addEventListener("click", () => {
  state.visibleCount += 12;
  renderArchive();
});

elements.archiveGrid.addEventListener("error", (event) => {
  const image = event.target;
  if (!image.classList?.contains("archive-image")) return;
  image.closest(".archive-card").hidden = true;
  elements.archiveStatus.textContent += " · 一件作品图加载失败，已暂时隐藏";
}, true);

elements.dialogClose.addEventListener("click", () => elements.dialog.close());
elements.dialogContent.addEventListener("click", (event) => {
  if (event.target.closest("[data-random-next]")) openRandomCase();
});
elements.dialogContent.addEventListener("change", (event) => {
  if (event.target.name !== "learning-agreement") return;
  event.target.form.querySelector('button[type="submit"]').disabled = !event.target.checked;
});
elements.dialogContent.addEventListener("submit", (event) => {
  const form = event.target.closest(".code-download-form");
  if (!form) return;
  event.preventDefault();
  if (!form.elements["learning-agreement"].checked) return;
  const item = state.candidates.find((candidate) => candidate.id === form.dataset.codeCase);
  const url = codeDownloadURL(item);
  if (url) window.open(url, "_blank", "noopener,noreferrer");
});
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
