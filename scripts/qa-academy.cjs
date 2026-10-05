const assert = require("node:assert/strict");
const { chromium } = require("/Users/huzhuoyi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const baseURL = process.env.VIBE_QA_URL || "http://127.0.0.1:4178";

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

  assert.equal(await page.locator(".feature-card").count(), 3);
  assert.equal(await page.locator(".archive-card").count(), 12);
  assert.equal(await page.locator(".mechanism-row").count(), 5);
  assert.equal(await page.locator("text=¥99").count(), 0);
  assert.equal(await page.locator("text=购买").count(), 0);
  assert.equal(await page.locator("text=登录").count(), 0);
  assert.equal(await page.locator("#archive-total").innerText(), "65");

  await page.locator(".feature-card").first().scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const image = document.querySelector(".feature-card img");
    return image?.complete && image.naturalWidth > 0;
  });

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `horizontal overflow: ${overflow}px at ${viewport.width}px`);

  if (viewport.width >= 1000) {
    await page.locator("[data-case-id]").first().click();
    await page.locator("#case-dialog[open]").waitFor();
    await page.getByText("为什么不是普通特效").waitFor();
    await page.locator(".dialog-close").click();

    await page.locator("#load-more").click();
    assert.equal(await page.locator(".archive-card").count(), 24);

    await page.locator("#archive-search").fill("Galaxies");
    assert.equal(await page.locator(".archive-card").count(), 1);
    await page.locator("#archive-search").fill("");

    await page.locator('[data-filter="滚动变成镜头"]').click();
    assert.ok((await page.locator(".archive-card").count()) > 0);
    await page.locator('[data-filter="all"]').click();
  }

  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
  });
  await page.screenshot({ path: screenshotPath, fullPage: false });
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
