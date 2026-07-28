import fs from "node:fs";
import path from "node:path";

const filePath = path.resolve(process.argv[2] ?? "public/vibe/issues.json");
const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
const mechanisms = new Set([
  "数据变成空间",
  "模型成为界面",
  "滚动变成镜头",
  "排版变成界面",
  "交互变成叙事",
]);
const difficulties = new Set(["30 分钟实验", "1 天原型", "3–5 天成品"]);
const requiredCaseFields = [
  "id",
  "title",
  "author",
  "platform",
  "pageTime",
  "url",
  "accent",
  "memory",
  "why",
  "input",
  "layer",
  "motion",
  "pipeline",
  "performance",
  "transfer",
  "difficulty",
  "evidence",
];

const fail = (message) => {
  throw new Error(`[vibe issues] ${message}`);
};

if (payload.schemaVersion !== 1) fail("schemaVersion must be 1");
if (!Array.isArray(payload.issues) || payload.issues.length === 0) {
  fail("issues must be a non-empty array");
}

const issueIds = new Set();
const caseUrls = new Set();

payload.issues.forEach((issue, issueIndex) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issue.id ?? "")) {
    fail(`issues[${issueIndex}].id must use YYYY-MM-DD`);
  }
  if (issueIds.has(issue.id)) fail(`duplicate issue id: ${issue.id}`);
  issueIds.add(issue.id);

  if (issueIndex > 0 && issue.id >= payload.issues[issueIndex - 1].id) {
    fail("issues must be sorted newest first");
  }
  if (!/^\d{3}$/.test(issue.issueNo ?? "")) {
    fail(`${issue.id}.issueNo must be three digits`);
  }
  if (typeof issue.note !== "string" || !issue.note.trim()) {
    fail(`${issue.id}.note is required`);
  }
  if (!Array.isArray(issue.cases) || issue.cases.length < 3 || issue.cases.length > 5) {
    fail(`${issue.id} must contain 3-5 cases`);
  }
  if (!issue.cases.some((entry) => entry.id === issue.featuredId)) {
    fail(`${issue.id}.featuredId must match a case`);
  }

  issue.cases.forEach((entry, caseIndex) => {
    requiredCaseFields.forEach((field) => {
      if (typeof entry[field] !== "string" || !entry[field].trim()) {
        fail(`${issue.id}.cases[${caseIndex}].${field} is required`);
      }
    });
    try {
      const url = new URL(entry.url);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    } catch {
      fail(`${issue.id}.cases[${caseIndex}].url must be public HTTP(S)`);
    }
    if (caseUrls.has(entry.url)) fail(`duplicate case URL: ${entry.url}`);
    caseUrls.add(entry.url);
    if (!difficulties.has(entry.difficulty)) {
      fail(`${issue.id}.cases[${caseIndex}].difficulty is invalid`);
    }
    if (!Array.isArray(entry.mechanisms) || entry.mechanisms.length === 0) {
      fail(`${issue.id}.cases[${caseIndex}].mechanisms is required`);
    }
    entry.mechanisms.forEach((mechanism) => {
      if (!mechanisms.has(mechanism)) {
        fail(`${issue.id}.cases[${caseIndex}] has unknown mechanism: ${mechanism}`);
      }
    });
  });
});

console.log(
  `[vibe issues] valid: ${payload.issues.length} issues, ${caseUrls.size} unique cases`,
);
