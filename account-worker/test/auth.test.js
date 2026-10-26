import assert from "node:assert/strict";
import { after, test } from "node:test";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import worker from "../src/index.js";
import { getVerifiedEmail } from "../src/auth.js";

const { privateKey, publicKey } = await generateKeyPair("RS256");
const jwk = { ...await exportJWK(publicKey), kid: "test-key", alg: "RS256", use: "sig" };
const env = { TEAM_DOMAIN: "https://vibe-test.cloudflareaccess.com", POLICY_AUD: "vibe-account-test" };
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  assert.equal(String(url), `${env.TEAM_DOMAIN}/cdn-cgi/access/certs`);
  return Response.json({ keys: [jwk] });
};
after(() => { globalThis.fetch = originalFetch; });

async function token(overrides = {}, key = privateKey) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ email: "Joey@example.com", iss: env.TEAM_DOMAIN, aud: env.POLICY_AUD, iat: now, exp: now + 300, ...overrides })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" }).sign(key);
}
function request(jwt = "", email = "spoofed@example.com") {
  return new Request("https://account.vibe.zone-y.com/", { headers: {
    "Cf-Access-Jwt-Assertion": jwt,
    "Cf-Access-Authenticated-User-Email": email
  } });
}

test("accepts the signed email and ignores a conflicting email header", async () => {
  assert.equal(await getVerifiedEmail(request(await token()), env), "joey@example.com");
});

test("rejects spoofed headers, missing config, malformed or invalid claims", async () => {
  assert.equal(await getVerifiedEmail(request("local-qa"), env), "");
  assert.equal(await getVerifiedEmail(request(), env), "");
  assert.equal(await getVerifiedEmail(request(await token()), {}), "");
  for (const claims of [
    { aud: "another-app" }, { iss: "https://another.cloudflareaccess.com" },
    { exp: 1 }, { exp: undefined }, { email: undefined }, { nbf: Math.floor(Date.now() / 1000) + 3600 }
  ]) assert.equal(await getVerifiedEmail(request(await token(claims)), env), "");
  const other = await generateKeyPair("RS256");
  assert.equal(await getVerifiedEmail(request(await token({}, other.privateKey)), env), "");
});

test("unauthenticated traffic never reads or writes the database", async () => {
  const response = await worker.fetch(request("fake"), { ...env, get DB() { throw new Error("DB must not be reached"); } });
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
});

test("verified login creates or refreshes its own account and returns to the archive", async () => {
  const writes = [];
  const DB = { prepare(sql) { return { bind(email) { return { async run() { writes.push({ sql, email }); } }; } }; } };
  const response = await worker.fetch(request(await token()), { ...env, DB });
  assert.equal(response.status, 200);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].email, "joey@example.com");
  assert.match(writes[0].sql, /ON CONFLICT\(email\) DO UPDATE SET last_seen_at/);
  const page = await response.text();
  assert.match(page, /身份已验证/);
  assert.match(page, /继续浏览作品/);
  assert.match(page, /\/cdn-cgi\/access\/logout/);
  assert.match(page, /vibe-frontier-daily\/#archive/);
  assert.doesNotMatch(page, /登记购买|免费先学，购买/);
});
