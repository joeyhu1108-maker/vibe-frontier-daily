const assert = require("node:assert/strict");
const { chromium } = require("/Users/huzhuoyi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const baseURL = process.env.VIBE_ACCOUNT_QA_URL || "http://127.0.0.1:8788";
const headers = {
  "Cf-Access-Jwt-Assertion": "local-qa",
  "Cf-Access-Authenticated-User-Email": "joey@example.com"
};

async function inspect(browser, viewport, screenshotPath) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, extraHTTPHeaders: headers });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

  const response = await page.goto(`${baseURL}/?interest=vfp-001`, { waitUntil: "domcontentloaded" });
  assert.equal(response.status(), 200);
  assert.equal(await page.locator(".product").count(), 4);
  assert.equal(await page.locator(".notice").count(), 1);
  await page.getByText("joey@example.com").waitFor();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `horizontal overflow: ${overflow}px at ${viewport.width}px`);

  const locked = await page.request.get(`${baseURL}/download/vfp-001`, { headers });
  assert.equal(locked.status(), 403);
  assert.match(await locked.text(), /ENTITLEMENT REQUIRED/);

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
    await inspect(browser, { width: 1440, height: 1000 }, "/tmp/vibe-account-desktop.png");
    await inspect(browser, { width: 390, height: 844 }, "/tmp/vibe-account-mobile.png");
    process.stdout.write("VIBE account QA passed at 1440x1000 and 390x844\n");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
