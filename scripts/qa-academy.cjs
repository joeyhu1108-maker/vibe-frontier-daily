const assert = require("node:assert/strict");
const { chromium } = require("/Users/huzhuoyi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const baseURL = process.env.VIBE_QA_URL || "http://127.0.0.1:4178";

async function inspectViewport(browser, viewport, screenshotPath) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseURL });
  const page = await context.newPage();
  const errors = [];

  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

  const response = await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  assert.equal(response.status(), 200);
  await page.waitForSelector(".resource-card");
  await page.waitForSelector(".case-card");

  assert.equal(await page.locator(".resource-card").count(), 16);
  assert.equal(await page.locator(".prompt-tab").count(), 6);
  assert.equal(await page.locator(".sample-card").count(), 2);
  assert.equal(await page.locator(".case-card").count(), 3);

  await page.waitForFunction(() => [...document.querySelectorAll(".partner-logo")].every((image) => image.complete && image.naturalWidth > 0));

  await page.locator(".sample-grid").scrollIntoViewIfNeeded();
  await page.waitForFunction(() => [...document.querySelectorAll(".sample-card img")].every((image) => image.complete && image.naturalWidth > 0));
  const sampleImagesLoaded = await page.locator(".sample-card img").evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0));
  assert.equal(sampleImagesLoaded, true, "MotionSites free-sample previews did not load");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `horizontal overflow: ${overflow}px at ${viewport.width}px`);

  if (viewport.width >= 1000) {
    await page.locator('.path-tab[data-path="system"]').click();
    await page.getByText("把零散视觉值，改写成团队能使用的语言").waitFor();

    await page.getByRole("button", { name: "动效与 3D" }).click();
    assert.equal(await page.locator(".resource-card").count(), 7);
    await page.getByPlaceholder("搜索用途或工具名").fill("Rive");
    assert.equal(await page.locator(".resource-card").count(), 1);
    await page.getByRole("button", { name: "全部" }).click();
    await page.getByPlaceholder("搜索用途或工具名").fill("");

    await page.locator('[data-control="state"] [data-value="loading"]').click();
    assert.match(await page.locator("#playground-button").innerText(), /正在生成/);

    await page.locator('[data-sample="./vibe/motionsites-free/jack-3d-creator.txt"]').click();
    await page.getByText("已复制 MotionSites 免费完整 Prompt").waitFor();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    assert.ok(copied.length > 13000, `copied sample too short: ${copied.length}`);

    await page.locator("[data-case]").first().click();
    assert.equal(await page.locator("#case-dialog").getAttribute("open"), "");
    await page.locator(".dialog-close").click();

    await page.locator('.path-tab[data-path="components"]').click();
    await page.locator('[data-control="state"] [data-value="default"]').click();
  }

  await page.waitForFunction(() => !document.querySelector("#toast").classList.contains("is-visible"));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: screenshotPath, fullPage: true });
  if (viewport.width < 1000) {
    await page.locator("#cases").screenshot({ path: "/tmp/vibe-academy-mobile-cases.png" });
  }
  assert.deepEqual(errors, []);
  await context.close();
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  });
  try {
    await inspectViewport(browser, { width: 1440, height: 1000 }, "/tmp/vibe-academy-desktop.png");
    await inspectViewport(browser, { width: 390, height: 844 }, "/tmp/vibe-academy-mobile.png");
    process.stdout.write("VIBE academy QA passed at 1440x1000 and 390x844\n");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
