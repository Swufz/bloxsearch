const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "useful-analytics-requests.json");

if (!fs.existsSync(inputPath)) {
  console.error("Missing useful-analytics-requests.json. Run parse-har.js first.");
  process.exit(1);
}

const requests = JSON.parse(fs.readFileSync(inputPath, "utf8"));

function hasNumbers(obj) {
  const text = JSON.stringify(obj || "");
  return /\d+(\.\d+)?/.test(text);
}

function containsAny(obj, terms) {
  const text = JSON.stringify(obj || "").toLowerCase();
  return terms.some((term) => text.includes(term.toLowerCase()));
}

const metricTerms = [
  "L7AveragePlayTimeMinutesPerDAU",
  "L7AverageForwardD1Retention",
  "L7AverageForwardD7Retention",
  "L7AverageRevenuePerPayingUser",
  "L7AveragePayingUsersCVR",
  "L7AverageRFYQualifiedPTR",
  "AveragePlayTimeMinutesPerDAU",
  "ForwardD1Retention",
  "ForwardD7Retention",
  "AverageRevenuePerPayingUser",
  "PayingUsersCVR",
  "RFYQualifiedPTR",
  "benchmark",
  "percentile",
];

const filtered = requests
  .filter((req) => {
    const url = req.url.toLowerCase();

    // Ignore translation/wording files
    if (url.includes("translations-cdn.roblox.com")) return false;

    // Ignore images/assets
    if (url.includes(".png") || url.includes(".css") || url.includes(".js")) return false;

    const looksLikeAnalytics =
      url.includes("analytics-query-gateway") ||
      url.includes("developer-analytics") ||
      url.includes("analytics");

    const hasMetricNames =
      containsAny(req.requestBody, metricTerms) ||
      containsAny(req.responseBody, metricTerms) ||
      containsAny(req.url, metricTerms);

    const responseHasNumbers = hasNumbers(req.responseBody);

    return looksLikeAnalytics && (hasMetricNames || responseHasNumbers);
  })
  .map((req, index) => ({
    localIndex: index,
    method: req.method,
    status: req.status,
    url: req.url,
    requestBody: req.requestBody,
    responsePreview:
      typeof req.responseBody === "string"
        ? req.responseBody.slice(0, 1000)
        : req.responseBody,
  }));

const outputPath = path.join(__dirname, "real-analytics-candidates.json");

fs.writeFileSync(outputPath, JSON.stringify(filtered, null, 2));

console.log(`Found ${filtered.length} real analytics candidates.`);
console.log(`Saved to ${outputPath}`);