const fs = require("fs");
const path = require("path");

const harPath = path.join(__dirname, "creator-dashboard.har");

if (!fs.existsSync(harPath)) {
  console.error("HAR file not found at:", harPath);
  process.exit(1);
}

const har = JSON.parse(fs.readFileSync(harPath, "utf8"));

const keywords = [
  "average",
  "playtime",
  "retention",
  "payer",
  "conversion",
  "revenue",
  "qualified",
  "benchmark",
  "percentile",
  "universe",
  "performance",
  "analytics",
];

function safeJsonParse(text) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function containsKeyword(value) {
  const text =
    typeof value === "string"
      ? value.toLowerCase()
      : JSON.stringify(value || "").toLowerCase();

  return keywords.some((keyword) => text.includes(keyword));
}

const usefulRequests = [];

for (const entry of har.log.entries) {
  const request = entry.request;
  const response = entry.response;

  const url = request.url || "";
  const method = request.method || "";
  const status = response.status;

  const requestBodyText = request.postData?.text || "";
  const responseText = response.content?.text || "";

  const requestBody = safeJsonParse(requestBodyText);
  const responseBody = safeJsonParse(responseText);

  const isUseful =
    containsKeyword(url) ||
    containsKeyword(requestBody) ||
    containsKeyword(responseBody);

  if (!isUseful) continue;

  usefulRequests.push({
    method,
    url,
    status,
    requestBody,
    responseBody,
  });
}

const outputPath = path.join(__dirname, "useful-analytics-requests.json");

fs.writeFileSync(outputPath, JSON.stringify(usefulRequests, null, 2));

console.log(`Found ${usefulRequests.length} useful requests.`);
console.log(`Saved to ${outputPath}`);