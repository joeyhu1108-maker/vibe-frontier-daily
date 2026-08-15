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

function createFeedItem(item, index, openDetail) {
  const article = element("article", "feed-item");
  article.style.setProperty("--feed-accent", item.accent || "#4fa7d8");
  article.style.setProperty("--feed-order", String(Math.min(index, 8)));

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

  if (item.image) {
    const visual = element("a", "feed-visual");
    visual.href = item.url;
    visual.target = "_blank";
    visual.rel = "noopener noreferrer";
    const image = element("img");
    image.src = item.image;
    image.alt = `${item.title} 作品预览`;
    image.loading = "lazy";
    visual.append(image, element("span", "", "VIEW ORIGINAL ↗"));
    article.append(visual);
  } else {
    const signal = element("div", "feed-signal");
    signal.setAttribute("aria-hidden", "true");
    signal.append(element("span", "", item.title.slice(0, 1)), element("i"));
    article.append(signal);
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

async function mountFeed() {
  const archive = await waitFor("#archive");
  const response = await fetch("./vibe/issues.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Feed data request failed: ${response.status}`);
  const data = await response.json();
  const allItems = flattenIssues(data.issues || []);
  if (!allItems.length) return;

  document.body.classList.add("feed-view-active");
  document.querySelector("#today")?.setAttribute("hidden", "");
  document.querySelector(".case-index")?.setAttribute("hidden", "");

  const todayLink = document.querySelector('a[href="#today"]');
  if (todayLink) {
    todayLink.href = "#feed";
    todayLink.textContent = "FEED";
  }

  const section = element("section", "feed-section");
  section.id = "feed";

  const heading = element("header", "feed-heading");
  const headingCopy = element("div");
  headingCopy.append(
    element("span", "feed-kicker", "CURATED WORKS · CONTINUOUS INDEX"),
    element("h2", "", "作品不是归档，\n而是一条持续生长的观察流。"),
    element("p", "", "按机制进入，按时间继续阅读。每条记录保留作者、原作、实现判断与证据边界。"),
  );
  const total = element("div", "feed-total");
  total.append(element("strong", "", String(allItems.length).padStart(2, "0")), element("span", "", "VERIFIED\nWORKS"));
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
    stream.replaceChildren(...visible.map((item, index) => createFeedItem(item, index, openDetail)));
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
