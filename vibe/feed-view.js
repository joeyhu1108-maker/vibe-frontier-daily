const MECHANISMS = [
  "数据变成空间",
  "模型成为界面",
  "滚动变成镜头",
  "排版变成界面",
  "交互变成叙事",
];

const PAGE_SIZE = 12;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function displayDateLabel(label) {
  return label === "TRIAL" ? "OPEN" : label;
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
    element("span", "feed-date", displayDateLabel(item.dateLabel)),
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
    meta.textContent = `${displayDateLabel(item.dateLabel)} · ISSUE ${item.issueNo} · ${item.platform} · ${item.author}`;
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

function createOpenNote(caseCount) {
  const section = element("section", "open-note");
  section.id = "about";

  const intro = element("div", "open-note-intro");
  intro.append(
    element("span", "open-note-kicker", "VIBE FRONTIER · OPEN EDITION"),
    element("h2", "", "好作品公开看，方法带回去。"),
    element(
      "p",
      "",
      `这里是 ART WITH AI 与 AI造物社的前端观察现场。当前发布的 ${caseCount} 个案例均可完整阅读，不设置付费解锁。`,
    ),
  );

  const principles = element("div", "open-note-principles");
  [
    ["完整开放", "作品拆解、工程判断与证据边界直接公开，不用购买后继续阅读。"],
    ["尊重原作", "这里提供研究与评论，不重新分发第三方源码、素材或商业授权。"],
    ["克制更新", "只收录能够核验作者、作品与机制的案例，不用数量填满版面。"],
  ].forEach(([title, copy]) => {
    const item = element("article");
    item.append(element("h3", "", title), element("p", "", copy));
    principles.append(item);
  });

  const back = element("a", "open-note-back", "返回案例 ↑");
  back.href = "#feed";
  section.append(intro, principles, back);
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
  document.body.classList.add("public-share");
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
    heroCta.firstChild.textContent = "查看 3 个完整拆解 ";
  }

  function syncOpenEditionLabels() {
    const heroEdition = [...document.querySelectorAll(".hero-bottom span")]
      .find((node) => node.textContent.includes("TRIAL"));
    if (heroEdition) heroEdition.textContent = heroEdition.textContent.replace("TRIAL", "OPEN");

    const restraint = document.querySelector(".restraint-note p");
    const openRestraint = "只有真实数据映射时才建议接入 Creative Twin；当前公开内容用于研究、评论与方法分享，不替代第三方授权。";
    if (restraint && restraint.textContent !== openRestraint) restraint.textContent = openRestraint;
  }

  syncOpenEditionLabels();
  const languageRoot = document.querySelector(".vibe-shell");
  if (languageRoot) {
    const languageObserver = new MutationObserver(syncOpenEditionLabels);
    languageObserver.observe(languageRoot, { childList: true, subtree: true, characterData: true });
  }

  const archiveLink = document.querySelector('a[href="#archive"]');
  if (archiveLink) {
    archiveLink.href = "#about";
    archiveLink.textContent = "开放说明";
  }

  const section = element("section", "feed-section");
  section.id = "feed";

  const heading = element("header", "feed-heading");
  const headingCopy = element("div");
  headingCopy.append(
    element("span", "feed-kicker", "OPEN EDITION · AI造物社"),
    element("h2", "", "三个完整拆解"),
    element("p", "", "三个案例覆盖数据、模型、滚动、排版与叙事五类机制。每篇都完整保留实现判断与证据边界，直接带回你的项目。"),
  );
  const total = element("div", "feed-total");
  total.append(element("strong", "", String(allItems.length).padStart(2, "0")), element("span", "", "OPEN\nCASES"));
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
  siteFooter?.insertAdjacentElement("beforebegin", createOpenNote(allItems.length));

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
