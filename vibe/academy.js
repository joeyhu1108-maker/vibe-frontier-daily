const state = {
  issue: null,
  cases: [],
  candidates: [],
  covers: {},
  activeFilter: "all",
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
  loadMore: document.querySelector("#load-more"),
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
    <article class="feature-card reveal">
      <div class="feature-card-media">
        ${
          cover
            ? `<img src="${escapeHTML(cover)}" alt="${escapeHTML(item.title)} 的公开作品画面" loading="${index === 0 ? "eager" : "lazy"}" />`
            : `<div class="archive-placeholder"><span>${escapeHTML(shortTitle(item.title))}</span></div>`
        }
        <span class="feature-index">0${index + 1}</span>
      </div>
      <div class="feature-card-body">
        <p class="feature-meta">${escapeHTML(item.platform)} · ${escapeHTML(item.author)}</p>
        <h3>${escapeHTML(item.title)}</h3>
        <p class="feature-memory">${escapeHTML(item.memory)}</p>
        <div class="mechanism-tags">${tags}</div>
        <button class="feature-open" type="button" data-case-id="${escapeHTML(item.id)}">查看完整拆解 ↗</button>
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
    const matchesFilter = state.activeFilter === "all" || item.mechanisms?.includes(state.activeFilter);
    const haystack = [item.title, item.author, item.platform, item.memory, ...(item.mechanisms || [])]
      .join(" ")
      .toLocaleLowerCase("zh-CN");
    return matchesFilter && (!query || haystack.includes(query));
  });
}

function archiveCardTemplate(item) {
  const cover = safeCover(item.id);
  const mechanism = item.mechanisms?.[0] || "实验前端";
  return `
    <article class="archive-card reveal">
      <a href="${escapeHTML(safeURL(item.url))}" target="_blank" rel="noopener noreferrer" aria-label="打开 ${escapeHTML(item.title)} 原作品">
        ${
          cover
            ? `<img class="archive-image" src="${escapeHTML(cover)}" alt="${escapeHTML(item.title)} 的公开作品画面" loading="lazy" />`
            : `<div class="archive-placeholder"><span>${escapeHTML(mechanism)}</span></div>`
        }
        <div class="archive-card-body">
          <p class="archive-meta">${escapeHTML(item.issueNo || "ARCHIVE")} · ${escapeHTML(item.dateLabel || item.platform)}</p>
          <h3>${escapeHTML(item.title)}</h3>
          <p class="archive-author">${escapeHTML(item.author)} · ${escapeHTML(item.platform)}</p>
          <span class="archive-mechanism">${escapeHTML(mechanism)} ↗</span>
        </div>
      </a>
    </article>`;
}

function renderArchive() {
  const matches = filteredCandidates();
  const visible = matches.slice(0, state.visibleCount);

  elements.archiveGrid.innerHTML = visible.length
    ? visible.map(archiveCardTemplate).join("")
    : '<p class="empty-state">没有找到匹配的作品。试试更短的关键词或切换机制。</p>';
  elements.archiveStatus.textContent = visible.length ? `已显示 ${visible.length} / ${matches.length}` : "";
  elements.loadMore.hidden = visible.length >= matches.length;
  observeReveals();
}

function setFilter(filter) {
  state.activeFilter = filter;
  state.visibleCount = 12;
  elements.archiveFilters.querySelectorAll("[data-filter]").forEach((button) => {
    const active = button.dataset.filter === filter;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  renderArchive();
}

function detailTemplate(label, value, extraClass = "") {
  if (!value) return "";
  return `<section class="dialog-detail ${extraClass}"><h3>${escapeHTML(label)}</h3><p>${escapeHTML(value)}</p></section>`;
}

function openCase(caseId) {
  const item = state.cases.find((candidate) => candidate.id === caseId);
  if (!item) return;
  const cover = safeCover(item.id);

  elements.dialogContent.innerHTML = `
    ${cover ? `<img class="dialog-cover" src="${escapeHTML(cover)}" alt="${escapeHTML(item.title)} 的公开作品画面" />` : ""}
    <div class="dialog-body">
      <p class="feature-meta">${escapeHTML(item.platform)} · ${escapeHTML(item.pageTime)}</p>
      <h2 id="dialog-title">${escapeHTML(item.title)}</h2>
      <p class="dialog-byline">作者：${escapeHTML(item.author)} · 复现难度：${escapeHTML(item.difficulty)}</p>
      <p class="dialog-memory">${escapeHTML(item.memory)}</p>
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
  const [issuesResponse, candidatesResponse, coversResponse] = await Promise.all([
    fetch("./vibe/issues.json"),
    fetch("./vibe/site-candidates.json"),
    fetch("./vibe/cover-map.json")
  ]);

  if (!issuesResponse.ok || !candidatesResponse.ok || !coversResponse.ok) throw new Error("Data request failed");
  const [issuesData, candidatesData, coversData] = await Promise.all([
    issuesResponse.json(),
    candidatesResponse.json(),
    coversResponse.json()
  ]);

  state.issue = issuesData.issues?.[0] || null;
  state.cases = state.issue?.cases || [];
  state.covers = coversData || {};
  state.candidates = orderedCandidates(candidatesData.candidates || []);
  elements.archiveTotal.textContent = String(state.candidates.length);

  renderHero();
  renderFeatured();
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

document.querySelectorAll("[data-mechanism]").forEach((button) => {
  button.addEventListener("click", () => {
    setFilter(button.dataset.mechanism);
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
loadData().catch((error) => {
  console.error("VIBE FRONTIER data load failed", error);
  elements.featuredGrid.innerHTML = '<p class="empty-state">本期案例暂时无法载入，请稍后刷新。</p>';
  elements.archiveGrid.innerHTML = '<p class="empty-state">研究档案暂时无法载入，请稍后刷新。</p>';
  elements.loadMore.hidden = true;
});
