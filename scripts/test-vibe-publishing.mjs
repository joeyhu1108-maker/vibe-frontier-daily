import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const payload = JSON.parse(fs.readFileSync(path.join(root, "vibe/issues.json")));
const latest = payload.issues[0];
const trial = payload.issues.find((issue) => issue.issueNo === "S01");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "vibe-publishing-test-"));
const manifest = path.join(temp, "vibe/issues.json");
const draft = path.join(temp, "draft.json");
fs.mkdirSync(path.join(temp, "vibe/covers"), { recursive: true });
for (const item of latest.cases) {
  if (item.image?.startsWith("./vibe/covers/")) fs.copyFileSync(path.join(root, item.image), path.join(temp, item.image));
}
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data));
const append = () => execFileSync(process.execPath, [path.join(root, ".github/scripts/append-vibe-issue.mjs"), manifest, draft], { stdio: "pipe" });
try {
  writeJSON(manifest, { ...payload, issues: [trial] });
  writeJSON(draft, latest);
  append();
  const added = JSON.parse(fs.readFileSync(manifest));
  assert.equal(added.issues[0].issueNo, "001", "S01 must start numeric issues at 001");
  assert.deepEqual(added.issues[1], trial, "historical trial must remain unchanged");
  execFileSync(process.execPath, [path.join(root, ".github/scripts/validate-vibe-issues.mjs"), manifest]);
  const before = fs.readFileSync(manifest, "utf8");
  assert.throws(append, /Issue already exists/);
  assert.equal(fs.readFileSync(manifest, "utf8"), before);

  writeJSON(manifest, { ...payload, issues: [{ ...trial, issueNo: "037" }, trial] });
  append();
  assert.equal(JSON.parse(fs.readFileSync(manifest)).issues[0].issueNo, "038");

  writeJSON(manifest, { ...payload, issues: [trial] });
  const withoutImage = structuredClone(latest);
  delete withoutImage.cases[0].image;
  writeJSON(draft, withoutImage);
  const unchanged = fs.readFileSync(manifest, "utf8");
  assert.throws(append, /requires image/);
  assert.equal(fs.readFileSync(manifest, "utf8"), unchanged);
  console.log("Publishing regression passed: S01, numeric sequence, idempotency, history, required images");
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
