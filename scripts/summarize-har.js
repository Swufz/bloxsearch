const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "useful-analytics-requests.json");

if (!fs.existsSync(inputPath)) {
  console.error("Run parse-har.js first. Missing:", inputPath);
  process.exit(1);
}

const requests = JSON.parse(fs.readFileSync(inputPath, "utf8"));

const terms = [
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
];

function findMatches(obj, matches = [], pathName = "") {
  if (obj === null || obj === undefined) return matches;

  if (typeof obj !== "object") {
    const value = String(obj);
    const lower = value.toLowerCase();

    for (const term of terms) {
      if (lower.includes(term)) {
        matches.push({
          path: pathName,
          value,
        });
        break;
      }
    }

    return matches;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      findMatches(item, matches, `${pathName}[${index}]`);
    });
  } else {
    for (const [key, value] of Object.entries(obj)) {
      const newPath = pathName ? `${pathName}.${key}` : key;
      const keyLower = key.toLowerCase();

      if (terms.some((term) => keyLower.includes(term))) {
        matches.push({
          path: newPath,
          value,
        });
      }

      findMatches(value, matches, newPath);
    }
  }

  return matches;
}

const summary = requests
  .map((req, index) => ({
    index,
    status: req.status,
    method: req.method,
    url: req.url,
    requestMatches: findMatches(req.requestBody),
    responseMatches: findMatches(req.responseBody),
  }))
  .filter(
    (item) =>
      item.status === 200 &&
      (item.requestMatches.length > 0 || item.responseMatches.length > 0)
  );

const outputPath = path.join(__dirname, "analytics-summary.json");

fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));

console.log(`Saved ${summary.length} summarized requests to:`);
console.log(outputPath);