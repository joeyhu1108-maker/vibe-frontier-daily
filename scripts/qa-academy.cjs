const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("/Users/huzhuoyi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const baseURL = process.env.VIBE_QA_URL || "http://127.0.0.1:4178";
const readJSON = (file) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "vibe", file), "utf8"));
const contexts = readJSON("case-context.json");
const candidates = readJSON("site-candidates.json").candidates;
const issue = readJSON("issues.json").issues[0];

assert.equal(contexts.schemaVersion, 1);
assert.equal(new Set(contexts.types.map((type) => type.id)).size, 5);
assert.match(contexts.valueNotice, /未核验成交/);
assert.deepEqual(Object.keys(contexts.cases).sort(), candidates.map((item) => item.id).sort());
for (const item of [...candidates, ...issue.cases]) {
  const context = contexts.cases[item.id];
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

  assert.equal(await page.locator(".feature-card").count(), issue.cases.length);
  assert.equal(await page.locator(".archive-card").count(), 12);
  assert.equal(await page.locator(".mechanism-row").count(), 5);
  assert.equal(await page.locator(".type-tile").count(), 5);
  assert.equal(await page.locator(".feature-card .case-value").count(), issue.cases.length);
  assert.equal(await page.locator(".archive-card .case-value").count(), 12);
  assert.equal(await page.locator("text=¥99").count(), 0);
  assert.equal(await page.getByRole("button", { name: /^(购买|登录)$/ }).count(), 0);
  assert.equal(await page.getByRole("link", { name: /^(购买|登录)$/ }).count(), 0);
  assert.equal(await page.locator("#archive-total").innerText(), String(candidates.length));
  assert.match(await page.locator("#value-notice").innerText(), /策展判断/);

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
  await page.getByText("应用与商业价值判断", { exact: true }).waitFor();
  for (const label of ["适用对象与场景", "能解决什么问题", "落地条件与限制", "建议如何验证"]) {
    await page.getByText(label, { exact: true }).waitFor();
  }
  assert.match(await page.locator(".dialog-value").innerText(), /商业结果未验证/);
  await page.locator(".dialog-close").click();

  await page.locator("#load-more").click();
  assert.equal(await page.locator(".archive-card").count(), 24);

  await page.locator("#archive-search").fill("Galaxies");
  assert.equal(await page.locator(".archive-card").count(), 1);
  await page.locator("#archive-search").fill("科普出版");
  assert.equal(await page.locator(".archive-card").count(), 1);
  assert.match(await page.locator(".archive-card h3").innerText(), /Insect World/);
  await page.locator("#archive-search").fill("");

  for (const type of contexts.types) {
    await page.locator(`#archive-filters [data-filter="${type.id}"]`).click();
    const count = candidates.filter((item) => contexts.cases[item.id].type === type.id).length;
    assert.ok(count > 0);
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
  const intersection = candidates.filter((item) => contexts.cases[item.id].type === "tools" && item.mechanisms.includes("模型成为界面"));
  assert.equal(await page.locator(".archive-card").count(), Math.min(12, intersection.length));
  assert.equal(await page.locator("#mechanism-selection").isVisible(), true);
  await page.locator("#clear-mechanism").click();
  assert.equal(await page.locator("#mechanism-selection").isVisible(), false);
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
