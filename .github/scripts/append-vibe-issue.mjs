import fs from "node:fs";
import path from "node:path";

const manifestPath = path.resolve(process.argv[2] ?? "public/vibe/issues.json");
const draftPath = process.argv[3] ? path.resolve(process.argv[3]) : null;

if (!draftPath) {
  throw new Error("Usage: node append-vibe-issue.mjs <manifest.json> <draft-issue.json>");
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const draftPayload = JSON.parse(fs.readFileSync(draftPath, "utf8"));
const issue = draftPayload.issue ?? draftPayload;

if (!/^\d{4}-\d{2}-\d{2}$/.test(issue.id ?? "")) {
  throw new Error("Draft issue id must use YYYY-MM-DD");
}
if (manifest.issues.some((entry) => entry.id === issue.id)) {
  throw new Error(`Issue already exists: ${issue.id}`);
}

const existingUrls = new Set(
  manifest.issues.flatMap((entry) => entry.cases.map((item) => item.url)),
);
const duplicateUrl = issue.cases?.find((item) => existingUrls.has(item.url));
if (duplicateUrl) {
  throw new Error(`Case URL already exists: ${duplicateUrl.url}`);
}
for (const item of issue.cases ?? []) {
  for (const field of ["image", "imageSource", "imageCredit"]) {
    if (typeof item[field] !== "string" || !item[field].trim()) {
      throw new Error(`New case ${item.id} requires ${field}; do not publish without a verified work image`);
    }
  }
}

const [, month, day] = issue.id.split("-");
const monthNames = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];
const nextIssueNo =
  Math.max(0, ...manifest.issues.filter((entry) => /^\d{3}$/.test(entry.issueNo)).map((entry) => Number(entry.issueNo))) + 1;

issue.dateLabel = `${monthNames[Number(month) - 1]} ${Number(day)}`;
issue.issueNo = nextIssueNo.toString().padStart(3, "0");
manifest.issues.unshift(issue);
manifest.updatedAt = new Date().toISOString();

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`[vibe issues] appended ${issue.id} as issue ${issue.issueNo}`);
