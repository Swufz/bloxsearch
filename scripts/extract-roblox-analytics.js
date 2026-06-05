const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "real-analytics-candidates.json");

if (!fs.existsSync(inputPath)) {
  console.error("Missing real-analytics-candidates.json");
  process.exit(1);
}

const candidates = JSON.parse(fs.readFileSync(inputPath, "utf8"));

function getLatestDataPoint(values = []) {
  const allPoints = [];

  for (const valueGroup of values) {
    const breakdown = valueGroup.breakdownValue || [];
    const points = valueGroup.dataPoints || [];

    for (const point of points) {
      allPoints.push({
        breakdown,
        ...point,
      });
    }
  }

  allPoints.sort((a, b) => new Date(b.time) - new Date(a.time));
  return allPoints[0] || null;
}

function extractBenchmarkScorecards() {
  return candidates
    .filter((item) =>
      item.url.includes("/universe-analytics-insights/v2/universes/")
    )
    .map((item) => {
      const metric = new URL(item.url).searchParams.get("metric");
      const body = item.responsePreview;

      return {
        universeId: item.url.match(/universes\/(\d+)/)?.[1] || null,
        metric,
        metricTime: body.metricTime || null,
        benchmarkTime: body.benchmarkTime || null,
        currentValue: body.currentValue ?? body.metricCurrentValue ?? null,
        currentPercentile: body.currentPercentile ?? null,
        percentChange: body.percentChange ?? body.metricPercentChange ?? null,
        p50: body.percentileMap?.["50"] ?? null,
        p90: body.percentileMap?.["90"] ?? null,
        recommendedType: body.recommendedType || null,
        genre: body.availableBenchmarks?.[0]?.genre || null,
      };
    });
}

function extractBenchmarkSeries() {
  return candidates
    .filter((item) =>
      item.url.includes("/analytics-benchmark/v1/benchmarks/")
    )
    .map((item) => {
      const metric = item.requestBody?.metric;
      const values = item.responsePreview?.result?.values || [];

      const percentiles = {};

      for (const group of values) {
        const percentile = group.breakdownValue?.find(
          (b) => b.dimension === "Percentile"
        )?.value;

        if (!percentile) continue;

        const latest = getLatestDataPoint([group]);

        percentiles[percentile] = {
          latestTime: latest?.time || null,
          latestValue: latest?.value ?? null,
          benchmarkType: latest?.metadata?.benchmarkType || null,
          genre: latest?.metadata?.genre || null,
        };
      }

      return {
        universeId: item.url.match(/id\/(\d+)/)?.[1] || null,
        metric,
        startTime: item.requestBody?.startTime || null,
        endTime: item.requestBody?.endTime || null,
        percentiles,
        availableTypes: item.responsePreview?.availableTypes || [],
      };
    });
}

function extractMetricSeries() {
  return candidates
    .filter(
      (item) =>
        item.url.includes("/analytics-query-gateway/v1/metrics/resource/") &&
        item.status === 200
    )
    .map((item) => {
      const query = item.requestBody?.query || {};
      const values = item.responsePreview?.operation?.queryResult?.values || [];
      const latest = getLatestDataPoint(values);

      return {
        universeId: item.requestBody?.resourceId || null,
        metric: query.metric || null,
        granularity: query.granularity || null,
        startTime: query.startTime || null,
        endTime: query.endTime || null,
        breakdown: query.breakdown || [],
        filter: query.filter || [],
        latestTime: latest?.time || null,
        latestValue: latest?.value ?? null,
        latestStatus: latest?.status || null,
        series: values,
      };
    });
}

const output = {
  extractedAt: new Date().toISOString(),
  benchmarkScorecards: extractBenchmarkScorecards(),
  benchmarkSeries: extractBenchmarkSeries(),
  metricSeries: extractMetricSeries(),
};

const outputPath = path.join(__dirname, "clean-roblox-analytics.json");

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log("Extracted analytics saved to:");
console.log(outputPath);

console.log("\nScorecards:");
for (const card of output.benchmarkScorecards) {
  console.log(
    `${card.metric}: value=${card.currentValue}, percentile=${card.currentPercentile}, p50=${card.p50}, p90=${card.p90}`
  );
}