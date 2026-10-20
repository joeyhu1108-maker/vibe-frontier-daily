const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("/Users/huzhuoyi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const baseURL = process.env.VIBE_QA_URL || "http://127.0.0.1:4178";
const readJSON = (file) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "vibe", file), "utf8"));
const contexts = readJSON("case-context.json");
const candidates = readJSON("site-candidates.json").candidates;
const issue = readJSON("issues.json").issues[0];
const issues = readJSON("issues.json").issues;
const covers = readJSON("cover-map.json");
const library = new Map(candidates.map((item) => [item.id, item]));
for (const entry of [...issues].reverse()) {
  for (const item of entry.cases) library.set(item.id, item);
}
const visibleCandidates = [...library.values()].filter((item) => item.image || covers[item.id]?.src);
const contextFor = (item) => item.context || contexts.cases[item.id];
const hackathons = readJSON("hackathons.json");

assert.equal(hackathons.schemaVersion, 1);
assert.ok(Number.isFinite(Date.parse(hackathons.checkedAt)));
assert.equal(new Set(hackathons.events.map((item) => item.id)).size, hackathons.events.length);
assert.equal(new Set(hackathons.events.map((item) => item.url)).size, hackathons.events.length);
assert.deepEqual([...new Set(hackathons.events.map((item) => item.region))].sort(), ["domestic", "international"]);
for (const item of hackathons.events) {
  for (const field of ["title", "organizer", "format", "location", "topic", "period", "deadlineLabel", "eligibility", "cost", "deliverables", "value", "boundary"]) {
    assert.ok(typeof item[field] === "string" && item[field].trim(), `${item.id}: missing ${field}`);
  }
  assert.ok(["open", "closed", "application"].includes(item.registrationStatus));
  assert.ok(item.sources.length > 0);
  for (const url of [item.url, ...item.sources.map((source) => source.url)]) assert.equal(new URL(url).protocol, "https:");
  if (item.registrationClosesAt) assert.ok(Number.isFinite(Date.parse(item.registrationClosesAt)));
  if (item.eventTimeZone) new Intl.DateTimeFormat("en-CA", { timeZone: item.eventTimeZone });
  for (const field of ["registrationClosesOn", "eventStartsOn", "eventEndsOn"]) {
    if (item[field]) assert.match(item[field], /^\d{4}-\d{2}-\d{2}$/);
  }
}

assert.equal(contexts.schemaVersion, 1);
assert.equal(new Set(contexts.types.map((type) => type.id)).size, 5);
assert.match(contexts.valueNotice, /未核验成交/);
assert.deepEqual(Object.keys(contexts.cases).sort(), candidates.map((item) => item.id).sort());
for (const item of [...candidates, ...issue.cases]) {
  const context = contextFor(item);
  assert.ok(contexts.types.some((type) => type.id === context.type), `${item.id}: unknown type`);
  for (const field of ["audience", "value", "conditions"]) {
    assert.ok(typeof context[field] === "string" && context[field].trim(), `${item.id}: missing ${field}`);
  }
}

async function inspectViewport(browser, viewport, screenshotPath) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];

  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

  const response = await page.goto(baseURL, { waitUntil: "networkidle" });
  assert.equal(response.status(), 200);
  await page.waitForSelector(".feature-card");
  await page.waitForSelector(".archive-card");
  await page.waitForSelector(".hackathon-card");
  await page.evaluate(() => document.fonts.ready);
  const typography = await page.evaluate(() => ({
    accentLoaded: document.fonts.check('16px "Vibe Pencil"'),
    body: getComputedStyle(document.body).fontFamily,
    title: getComputedStyle(document.querySelector("#hero-title")).fontFamily,
    lead: getComputedStyle(document.querySelector(".hero-lead")).fontFamily,
    featureTitle: getComputedStyle(document.querySelector(".feature-card h3")).fontFamily,
    wordmark: getComputedStyle(document.querySelector(".wordmark")).fontFamily,
    controlsReadable: [...document.querySelectorAll("button, input, select")].every((node) => !getComputedStyle(node).fontFamily.includes("Vibe "))
  }));
  assert.equal(typography.accentLoaded, true, "the lightweight handwriting accent must load");
  for (const value of [typography.body, typography.title, typography.lead, typography.featureTitle]) assert.doesNotMatch(value, /Vibe /);
  assert.match(typography.wordmark, /Vibe Pencil/);
  assert.equal(typography.controlsReadable, true, "controls must use the reading face");
  assert.equal(await page.locator("#hero-title > span").evaluate((node) => new Set([...node.getClientRects()].map((rect) => Math.round(rect.top))).size), 1, "hero title must stay on one display line");

  assert.equal(await page.locator(".feature-card").count(), issue.cases.length);
  if (viewport.width > 980) {
    const lowerCards = await page.locator(".feature-card").evaluateAll((cards) => cards.slice(2, 4).map((card) => ({
      display: getComputedStyle(card).display,
      width: card.getBoundingClientRect().width,
      mediaBottom: card.querySelector(".feature-card-media").getBoundingClientRect().bottom,
      bodyTop: card.querySelector(".feature-card-body").getBoundingClientRect().top
    })));
    assert.equal(lowerCards[0].display, "block");
    assert.ok(Math.abs(lowerCards[0].width - lowerCards[1].width) <= 1, "lower feature cards must share one grid rhythm");
    assert.ok(lowerCards[0].bodyTop >= lowerCards[0].mediaBottom, "third feature copy must stack below its image");
  }
  assert.equal(await page.locator(".archive-card").count(), 12);
  assert.equal(await page.locator(".mechanism-row").count(), 5);
  assert.equal(await page.locator(".type-tile").count(), 5);
  assert.equal(await page.locator(".feature-card .case-value").count(), issue.cases.length);
  assert.equal(await page.locator(".archive-card .case-value").count(), 12);
  assert.equal(await page.locator("text=¥99").count(), 0);
  assert.equal(await page.getByRole("button", { name: /^(购买|登录)$/ }).count(), 0);
  assert.equal(await page.getByRole("link", { name: /^(购买|登录)$/ }).count(), 0);
  assert.equal(await page.locator("#archive-total").innerText(), String(visibleCandidates.length));
  const [year, month, day] = issue.id.split("-").map(Number);
  assert.match(await page.locator("#issue-kicker").innerText(), new RegExp(`${year}年${month}月${day}日`));
  assert.match(await page.locator("#about").innerText(), /不以盈利为目的/);
  assert.doesNotMatch(await page.locator("#about").innerText(), /未来探索|定制互动项目/);
  assert.match(await page.locator("#value-notice").innerText(), /策展判断/);
  assert.equal(await page.locator(".hackathon-card").count(), hackathons.events.length);
  assert.match(await page.locator("#hackathon-notice").innerText(), /不是实时名额/);
  assert.match(await page.locator('[data-event-id="anker-hackathon-2026"] .hackathon-status').innerText(), /报名已截止|活动已结束/);
  assert.match(await page.locator('[data-event-id="gitlab-life-after-code-2026"] .hackathon-restriction').innerText(), /中国地区不具参赛资格/);
  const statuses = await page.evaluate(() => {
    const item = state.hackathons.find((event) => event.id === "build-with-ai-basics-2026");
    return [
      hackathonStatus(item, new Date("2026-10-06T15:45:39Z")).code,
      hackathonStatus(item, new Date("2026-10-14T15:45:39Z")).code,
      hackathonStatus(item, new Date("2026-10-26T21:00:00Z")).code,
      hackathonStatus(state.hackathons.find((event) => event.id === "anker-hackathon-2026"), new Date("2026-10-18T12:00:00Z")).code,
      hackathonStatus(state.hackathons.find((event) => event.id === "since-ai-2026"), new Date("2026-11-08T21:30:00Z")).code,
      hackathonStatus(state.hackathons.find((event) => event.id === "since-ai-2026"), new Date("2026-11-08T22:30:00Z")).code
    ];
  });
  assert.deepEqual(statuses, ["open", "review", "closed", "ended", "review", "ended"]);
  await page.locator('.nav-hackathons').click();
  for (const region of ["domestic", "international"]) {
    await page.locator(`#hackathon-filters [data-region="${region}"]`).click();
    const count = hackathons.events.filter((item) => item.region === region).length;
    assert.equal(await page.locator(".hackathon-card").count(), count);
    assert.equal(await page.locator(`.hackathon-card[data-region="${region}"]`).count(), count);
    assert.equal(await page.locator(`#hackathon-filters [data-region="${region}"]`).getAttribute("aria-pressed"), "true");
  }
  const eventDetails = page.locator(".hackathon-details").first();
  await eventDetails.locator("summary").click();
  assert.match(await eventDetails.innerText(), /需要做什么|证据边界/);
  assert.equal(await eventDetails.getAttribute("open"), "");
  for (const link of await page.locator(".hackathon-official").all()) {
    assert.equal(new URL(await link.getAttribute("href")).protocol, "https:");
    assert.equal(await link.getAttribute("rel"), "noopener noreferrer");
  }
  await page.locator('#hackathon-filters [data-region="all"]').click();
  assert.equal(await page.locator(".hackathon-card").count(), hackathons.events.length);

  await page.locator(".feature-card").first().scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const image = document.querySelector(".feature-card img");
    return image?.complete && image.naturalWidth > 0;
  });

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `horizontal overflow: ${overflow}px at ${viewport.width}px`);

  await page.locator("[data-case-id]").first().click();
  await page.locator("#case-dialog[open]").waitFor();
  await page.getByText("为什么不是普通特效").waitFor();
  await page.getByText("应用价值与学习方向", { exact: true }).waitFor();
  for (const label of ["适用对象与场景", "能解决什么问题", "落地条件与限制", "建议如何验证"]) {
    await page.getByText(label, { exact: true }).waitFor();
  }
  assert.match(await page.locator(".dialog-value").innerText(), /商业结果未验证/);
  await page.locator(".dialog-close").click();

  const downloadable = issue.cases.find((item) => item.code);
  await page.locator(`.feature-open[data-case-id="${downloadable.id}"]`).click();
  const agreement = page.locator('[name="learning-agreement"]');
  const download = page.locator('.code-download-form button[type="submit"]');
  assert.equal(await agreement.isChecked(), false);
  assert.equal(await download.isEnabled(), false);
  await agreement.check();
  assert.equal(await download.isEnabled(), true);
  await agreement.uncheck();
  assert.equal(await download.isEnabled(), false);
  await page.locator(".code-sharing").screenshot({ path: screenshotPath.replace(".png", "-agreement.png") });
  if (baseURL.startsWith("http://127.0.0.1")) {
    await page.evaluate(() => { window.open = (url) => { window.qaDownloadURL = url; }; });
    await agreement.check();
    await download.click();
    assert.equal(await page.evaluate(() => window.qaDownloadURL), `${downloadable.code.repository}/archive/${downloadable.code.revision}.zip`);
  }
  await page.locator(".dialog-close").click();
  await page.locator(`.feature-open[data-case-id="${downloadable.id}"]`).click();
  assert.equal(await page.locator('[name="learning-agreement"]').isChecked(), false);
  assert.equal(await page.locator('.code-download-form button').isEnabled(), false);
  await page.locator(".dialog-close").click();

  await page.locator("#load-more").click();
  assert.equal(await page.locator(".archive-card").count(), Math.min(24, visibleCandidates.length));
  for (const image of await page.locator(".archive-card img").all()) await image.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => [...document.querySelectorAll(".archive-card img")].every((image) => image.complete && image.naturalWidth > 0));
  assert.equal(await page.locator(".archive-card:not(:has(img))").count(), 0);
  assert.equal(await page.locator('.archive-card[hidden]').count(), 0);

  await page.locator("#archive-search").fill("Galaxies");
  assert.equal(await page.locator(".archive-card").count(), 1);
  await page.locator("#archive-search").fill("科普出版");
  assert.equal(await page.locator(".archive-card").count(), 1);
  assert.match(await page.locator(".archive-card h3").innerText(), /Insect World/);
  await page.locator("#archive-search").fill("");

  await page.locator("#archive-date").selectOption("2026-08-12");
  await page.locator("#archive-value").selectOption("品牌传播");
  await page.locator("#archive-mechanism").selectOption("数据变成空间");
  await page.locator('#archive-filters [data-filter="tools"]').click();
  assert.equal(await page.locator(".archive-card").count(), 1);
  assert.match(await page.locator(".archive-card h3").innerText(), /KASANE/);
  assert.match(await page.locator("#selected-filters").innerText(), /日期：2026年8月12日.*应用价值：品牌传播.*用途：生成工具.*机制：数据可视化/);
  await page.locator("#clear-archive-filters").click();
  assert.equal(await page.locator("#archive-date").inputValue(), "all");

  for (const type of contexts.types) {
    await page.locator(`#archive-filters [data-filter="${type.id}"]`).click();
    const count = visibleCandidates.filter((item) => contextFor(item).type === type.id).length;
    assert.equal(await page.locator(".archive-card").count(), Math.min(12, count));
    assert.equal(await page.locator(`.archive-card[data-type="${type.id}"]`).count(), Math.min(12, count));
    assert.equal(await page.locator(`#type-guide [data-filter="${type.id}"]`).getAttribute("aria-pressed"), "true");
  }

  await page.locator('#type-guide [data-filter="tools"]').click();
  const firstConditions = page.locator(".value-conditions").first();
  await firstConditions.locator("summary").click();
  assert.equal(await firstConditions.getAttribute("open"), "");
  assert.match(await firstConditions.innerText(), /建议验证/);

  await page.locator('[data-mechanism="模型成为界面"]').click();
  const intersection = visibleCandidates.filter((item) => contextFor(item).type === "tools" && item.mechanisms.includes("模型成为界面"));
  assert.equal(await page.locator(".archive-card").count(), Math.min(12, intersection.length));
  assert.equal(await page.locator("#filter-selection").isVisible(), true);
  assert.equal(await page.locator("#archive-mechanism").inputValue(), "模型成为界面");
  await page.locator("#clear-archive-filters").click();
  assert.equal(await page.locator("#filter-selection").isVisible(), false);
  await page.locator('#archive-filters [data-filter="all"]').click();
  await page.locator("#archive-search").fill("__no_case_matches__");
  assert.equal(await page.locator(".archive-card").count(), 0);
  assert.equal(await page.locator("#load-more").isVisible(), false);
  await page.locator("#archive-search").fill("");
  assert.equal(await page.locator("#type-guide .is-active").count(), 0);
  await page.emulateMedia({ reducedMotion: "reduce" });

  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, document.querySelector(".archive-heading").getBoundingClientRect().top + window.scrollY - 76);
  });
  await page.waitForFunction(() => getComputedStyle(document.querySelector(".archive-heading")).opacity === "1");
  await page.screenshot({ path: screenshotPath.replace(".png", "-types.png"), fullPage: false });
  await page.evaluate(() => {
    window.scrollTo(0, document.querySelector("#hackathons .section-heading").getBoundingClientRect().top + window.scrollY - 76);
  });
  await page.screenshot({ path: screenshotPath.replace(".png", "-hackathons.png"), fullPage: false });
  if (viewport.width > 680) {
    await page.locator('#hackathon-filters [data-region="international"]').click();
    await page.evaluate(() => {
      window.scrollTo(0, document.querySelector("#hackathon-filters").getBoundingClientRect().top + window.scrollY - 76);
    });
    await page.screenshot({ path: screenshotPath.replace(".png", "-hackathons-international.png"), fullPage: false });
  }
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
  });
  await page.screenshot({ path: screenshotPath, fullPage: false });
  const finalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(finalOverflow <= 1, `horizontal overflow after filters: ${finalOverflow}px`);
  assert.deepEqual(errors, []);
  await context.close();
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  });
  try {
    await inspectViewport(browser, { width: 1440, height: 1000 }, "/tmp/vibe-frontier-desktop.png");
    await inspectViewport(browser, { width: 390, height: 844 }, "/tmp/vibe-frontier-mobile.png");
    process.stdout.write("VIBE FRONTIER showcase QA passed at 1440x1000 and 390x844\n");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
