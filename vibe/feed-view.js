const MECHANISMS = [
  "数据变成空间",
  "模型成为界面",
  "滚动变成镜头",
  "排版变成界面",
  "交互变成叙事",
];

const PAGE_SIZE = 12;
const PURCHASE_URL = document.documentElement.dataset.purchaseUrl || "";

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function waitFor(selector) {
  return new Promise((resolve) => {
    const current = document.querySelector(selector);
    if (current) {
      resolve(current);
      return;
    }

    const observer = new MutationObserver(() => {
      const match = document.querySelector(selector);
      if (!match) return;
      observer.disconnect();
      resolve(match);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

function flattenIssues(issues) {
  return issues.flatMap((issue) =>
    issue.cases.map((item) => ({
      ...item,
      issueId: issue.id,
      issueNo: issue.issueNo,
      dateLabel: issue.dateLabel,
      issueNote: issue.note,
      isFeatured: item.id === issue.featuredId,
    })),
  );
}

function createFilter(label, count, active, onSelect) {
  const button = element("button", active ? "is-active" : "");
  button.type = "button";
  button.setAttribute("aria-pressed", String(active));
  button.append(element("span", "", label), element("small", "", String(count).padStart(2, "0")));
  button.addEventListener("click", onSelect);
  return button;
}

function createFeedItem(item, index, openDetail, coverMap) {
  const article = element("article", "feed-item");
  article.style.setProperty("--feed-accent", item.accent || "#4fa7d8");
  article.style.setProperty("--feed-order", String(Math.min(index, 8)));
  const mappedCover = coverMap[item.id];
  const cover = mappedCover || (item.image ? {
    src: item.image,
    source: item.url,
    label: "PUBLISHED ISSUE IMAGE",
  } : null);
  if (!cover) article.classList.add("is-text-only");

  const marker = element("aside", "feed-marker");
  marker.append(
    element("span", "feed-date", item.dateLabel),
    element("b", "", `ISSUE ${item.issueNo}`),
    element("i", "", item.isFeatured ? "FEATURED" : "FIELD NOTE"),
  );

  const content = element("div", "feed-content");
  const byline = element("div", "feed-byline");
  byline.append(
    element("span", "", item.platform),
    element("span", "", item.author),
    element("span", "", item.difficulty),
  );

  const title = element("h3", "", item.title);
  const memory = element("p", "feed-memory", item.memory);
  const why = element("p", "feed-why", item.why);

  const tags = element("div", "feed-tags");
  item.mechanisms.forEach((mechanism) => tags.append(element("span", "", mechanism)));

  const actions = element("div", "feed-actions");
  const detail = element("button", "feed-detail", "查看拆解");
  detail.type = "button";
  detail.addEventListener("click", () => openDetail(item));
  const source = element("a", "feed-source", "打开原作 ↗");
  source.href = item.url;
  source.target = "_blank";
  source.rel = "noopener noreferrer";
  actions.append(detail, source);

  content.append(byline, title, memory, why, tags, actions);
  article.append(marker, content);

  if (cover) {
    const visualWrap = element("figure", "feed-visual-wrap");
    const visual = element("a", "feed-visual");
    visual.href = item.url;
    visual.target = "_blank";
    visual.rel = "noopener noreferrer";
    const image = element("img");
    image.src = cover.src;
    image.alt = `${item.title} 作品预览`;
    image.loading = "lazy";
    image.addEventListener("error", () => {
      visualWrap.remove();
      article.classList.add("is-text-only");
    }, { once: true });
    visual.append(image);
    const caption = element("figcaption");
    caption.append(element("span", "", "IMAGE"));
    const credit = element("a", "", `${cover.label} ↗`);
    credit.href = cover.source;
    credit.target = "_blank";
    credit.rel = "noopener noreferrer";
    caption.append(credit);
    visualWrap.append(visual, caption);
    article.append(visualWrap);
  }

  return article;
}

function createDetailDialog() {
  const dialog = element("dialog", "feed-dialog");
  const panel = element("div", "feed-dialog-panel");
  const close = element("button", "feed-dialog-close", "关闭 ×");
  close.type = "button";
  close.addEventListener("click", () => dialog.close());

  const meta = element("p", "feed-dialog-meta");
  const title = element("h2");
  const summary = element("p", "feed-dialog-summary");
  const list = element("dl", "feed-dialog-list");
  const source = element("a", "feed-dialog-source", "访问原作 ↗");
  source.target = "_blank";
  source.rel = "noopener noreferrer";

  panel.append(close, meta, title, summary, list, source);
  dialog.append(panel);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  document.body.append(dialog);

  const fields = [
    ["为什么成立", "why"],
    ["输入", "input"],
    ["表现层", "layer"],
    ["动效与镜头", "motion"],
    ["工程管线", "pipeline"],
    ["性能与降级", "performance"],
    ["迁移到 Joey", "transfer"],
    ["证据边界", "evidence"],
  ];

  return (item) => {
    meta.textContent = `${item.dateLabel} · ISSUE ${item.issueNo} · ${item.platform} · ${item.author}`;
    title.textContent = item.title;
    summary.textContent = item.memory;
    list.replaceChildren();
    fields.forEach(([label, key]) => {
      const group = element("div");
      group.append(element("dt", "", label), element("dd", "", item[key]));
      list.append(group);
    });
    source.href = item.url;
    dialog.showModal();
    close.focus();
  };
}

function createSeasonPitch() {
  const section = element("section", "season-pitch");
  section.id = "season";

  const intro = element("div", "season-pitch-intro");
  intro.append(
    element("span", "season-pitch-kicker", "VIBE FRONTIER · SEASON 01"),
    element("h2", "", "三篇看完，再决定要不要买。"),
    element(
      "p",
      "",
      "第一季不是链接合集。每个案例都保留作者、原作和证据，再往下拆输入、表现、动效、工程、性能，以及真正值得带回自己项目的部分。",
    ),
  );

  const proof = element("dl", "season-proof");
  [
    ["18", "已完成期数"],
    ["65", "已核验案例"],
    ["030", "第一季终点"],
  ].forEach(([value, label]) => {
    const item = element("div");
    item.append(element("dt", "", value), element("dd", "", label));
    proof.append(item);
  });

  const offer = element("div", "season-offer");
  const offerCopy = element("div");
  offerCopy.append(
    element("span", "", "FIRST 30 · FOUNDING ACCESS"),
    element("strong", "", "第一季 ISSUE 001–030"),
    element("p", "", "现有 18 期立即可读，后续更新至 ISSUE 030；第一季完成后永久阅读。"),
  );

  const price = element("div", "season-price");
  price.append(element("small", "", "首批 30 人"), element("strong", "", "¥79"), element("del", "", "¥129"));

  const actionWrap = element("div", "season-actions");
  if (PURCHASE_URL) {
    const action = element("a", "season-primary", "购买第一季 ↗");
    action.href = PURCHASE_URL;
    action.target = "_blank";
    action.rel = "noopener noreferrer";
    actionWrap.append(action);
  } else {
    const action = element("span", "season-primary is-pending", "付费入口准备中");
    action.setAttribute("aria-disabled", "true");
    actionWrap.append(action);
  }
  actionWrap.append(
    element("p", "", "购买的是原创研究、评论与迁移方法，不包含第三方源码、素材或商业授权。"),
  );

  offer.append(offerCopy, price);
  section.append(intro, proof, offer, actionWrap);
  return section;
}

async function mountFeed() {
  const archive = await waitFor("#archive");
  const [response, coverResponse] = await Promise.all([
    fetch("./vibe/issues.json", { cache: "no-store" }),
    fetch("./vibe/cover-map.json", { cache: "no-store" }),
  ]);
  if (!response.ok) throw new Error(`Feed data request failed: ${response.status}`);
  const data = await response.json();
  const coverMap = coverResponse.ok ? await coverResponse.json() : {};
  const allItems = flattenIssues(data.issues || []);
  if (!allItems.length) return;

  document.body.classList.add("feed-view-active");
  document.body.classList.add("public-trial");
  document.querySelector("#today")?.setAttribute("hidden", "");
  document.querySelector(".case-index")?.setAttribute("hidden", "");

  const todayLink = document.querySelector('a[href="#today"]');
  if (todayLink) {
    todayLink.href = "#feed";
    todayLink.textContent = "FEED";
  }

  const heroCta = document.querySelector(".hero-cta");
  if (heroCta) {
    heroCta.href = "#feed";
    heroCta.firstChild.textContent = "先看 3 个完整拆解 ";
  }

  const archiveLink = document.querySelector('a[href="#archive"]');
  if (archiveLink) {
    archiveLink.href = "#season";
    archiveLink.textContent = "第一季";
  }

  const section = element("section", "feed-section");
  section.id = "feed";

  const heading = element("header", "feed-heading");
  const headingCopy = element("div");
  headingCopy.append(
    element("span", "feed-kicker", "PUBLIC TRIAL · SEASON 01"),
    element("h2", "", "三个完整拆解"),
    element("p", "", "三个案例覆盖数据、模型、滚动、排版与叙事五类机制。不是摘要，也不故意留半截；先看这套拆解是否真的能带回你的项目。"),
  );
  const total = element("div", "feed-total");
  total.append(element("strong", "", String(allItems.length).padStart(2, "0")), element("span", "", "FULL\nTRIALS"));
  heading.append(headingCopy, total);

  const filters = element("nav", "feed-filters");
  filters.setAttribute("aria-label", "按前端机制筛选作品");
  const status = element("p", "feed-status");
  status.setAttribute("aria-live", "polite");
  const stream = element("div", "feed-stream");
  const footer = element("div", "feed-more-wrap");
  const more = element("button", "feed-more", "继续加载");
  more.type = "button";
  footer.append(more);

  section.append(heading, filters, status, stream, footer);
  archive.insertAdjacentElement("afterend", section);

  const siteFooter = document.querySelector(".vibe-footer");
  siteFooter?.insertAdjacentElement("beforebegin", createSeasonPitch());

  const openDetail = createDetailDialog();
  let active = "全部";
  let shown = PAGE_SIZE;

  function currentItems() {
    return active === "全部" ? allItems : allItems.filter((item) => item.mechanisms.includes(active));
  }

  function renderFilters() {
    filters.replaceChildren();
    const options = ["全部", ...MECHANISMS];
    options.forEach((label) => {
      const count = label === "全部" ? allItems.length : allItems.filter((item) => item.mechanisms.includes(label)).length;
      filters.append(createFilter(label, count, active === label, () => {
        active = label;
        shown = PAGE_SIZE;
        renderFilters();
        renderItems();
      }));
    });
  }

  function renderItems() {
    const items = currentItems();
    const visible = items.slice(0, shown);
    stream.replaceChildren(...visible.map((item, index) => createFeedItem(item, index, openDetail, coverMap)));
    status.textContent = `${active === "全部" ? "全部机制" : active} · 显示 ${visible.length} / ${items.length}`;
    more.hidden = visible.length >= items.length;
    more.textContent = `继续加载 · ${Math.min(PAGE_SIZE, items.length - visible.length)} 条`;
  }

  more.addEventListener("click", () => {
    shown += PAGE_SIZE;
    renderItems();
  });

  renderFilters();
  renderItems();
}

mountFeed().catch((error) => {
  console.error("VIBE feed failed to mount", error);
});
