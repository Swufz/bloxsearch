import type { ConfidenceLevel, Game } from "./types";
import { daysAgo } from "./utils";

export type MetricSnapshot = {
  active_players: number;
  visits: number;
  favorites: number;
  like_ratio: number;
  captured_at: string;
};

function byTime(a: MetricSnapshot, b: MetricSnapshot) {
  return new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime();
}

function snapshotsInWindow(snapshots: MetricSnapshot[], windowHours: number) {
  const cutoff = Date.now() - windowHours * 60 * 60 * 1000;
  return snapshots
    .filter((snapshot) => new Date(snapshot.captured_at).getTime() >= cutoff)
    .sort(byTime);
}

function previousWindowSnapshots(
  snapshots: MetricSnapshot[],
  windowHours: number,
) {
  const end = Date.now() - windowHours * 60 * 60 * 1000;
  const start = Date.now() - windowHours * 2 * 60 * 60 * 1000;
  return snapshots
    .filter((snapshot) => {
      const time = new Date(snapshot.captured_at).getTime();
      return time >= start && time < end;
    })
    .sort(byTime);
}

function roundOne(value: number | null) {
  return value === null ? null : Math.round(value * 10) / 10;
}

export function calculateAvgSession(
  snapshots: MetricSnapshot[],
  windowHours: number,
) {
  const rows = snapshotsInWindow(snapshots, windowHours);
  if (rows.length < 2) return null;

  let playerMinutes = 0;
  for (let index = 1; index < rows.length; index++) {
    const previous = rows[index - 1];
    const current = rows[index];
    const intervalMinutes =
      (new Date(current.captured_at).getTime() -
        new Date(previous.captured_at).getTime()) /
      60_000;
    if (intervalMinutes <= 0) continue;
    const avgPlayers = (previous.active_players + current.active_players) / 2;
    playerMinutes += avgPlayers * intervalMinutes;
  }

  const visitGrowth = rows[rows.length - 1].visits - rows[0].visits;
  if (visitGrowth <= 0 || playerMinutes <= 0) return null;
  return roundOne(playerMinutes / visitGrowth);
}

export function calculateAvgCcu(
  snapshots: MetricSnapshot[],
  windowHours: number,
) {
  const rows = snapshotsInWindow(snapshots, windowHours);
  if (!rows.length) return null;
  return roundOne(
    rows.reduce((sum, snapshot) => sum + snapshot.active_players, 0) /
      rows.length,
  );
}

export function calculateMomentum(
  snapshots: MetricSnapshot[],
  windowHours: number,
) {
  const current = calculateAvgCcu(snapshots, windowHours);
  const previousRows = previousWindowSnapshots(snapshots, windowHours);
  if (current === null || !previousRows.length) return null;
  const previous =
    previousRows.reduce((sum, snapshot) => sum + snapshot.active_players, 0) /
    previousRows.length;
  if (previous <= 0) return null;
  return roundOne(((current - previous) / previous) * 100);
}

export function calculateVisitGrowth(
  snapshots: MetricSnapshot[],
  windowHours: number,
) {
  const rows = snapshotsInWindow(snapshots, windowHours);
  if (rows.length < 2) return 0;
  return Math.max(0, rows[rows.length - 1].visits - rows[0].visits);
}

export function calculateFavoriteGrowth(
  snapshots: MetricSnapshot[],
  windowHours: number,
) {
  const rows = snapshotsInWindow(snapshots, windowHours);
  if (rows.length < 2) return 0;
  return Math.max(0, rows[rows.length - 1].favorites - rows[0].favorites);
}

export function calculateRatingMovement(
  snapshots: MetricSnapshot[],
  windowHours: number,
) {
  const rows = snapshotsInWindow(snapshots, windowHours);
  if (rows.length < 2) return null;
  return roundOne(rows[rows.length - 1].like_ratio - rows[0].like_ratio);
}

export function calculateUpdateFreshness(game: Pick<Game, "updatedAtRoblox">) {
  const updatedDays = daysAgo(game.updatedAtRoblox);
  if (updatedDays <= 1) return 100;
  if (updatedDays <= 3) return 85;
  if (updatedDays <= 7) return 70;
  if (updatedDays <= 14) return 50;
  if (updatedDays <= 30) return 30;
  return 10;
}

export function calculateConfidenceLevel(
  snapshotCount: number,
  windowHours: number,
  firstSnapshotAt?: string | null,
  latestSnapshotAt?: string | null,
): ConfidenceLevel {
  if (snapshotCount < 2 || !firstSnapshotAt || !latestSnapshotAt) return "Low";
  const coverageHours =
    (new Date(latestSnapshotAt).getTime() -
      new Date(firstSnapshotAt).getTime()) /
    3_600_000;
  const coverageRatio = coverageHours / windowHours;
  if (snapshotCount >= 8 && coverageRatio >= 0.75) return "High";
  if (snapshotCount >= 3 && coverageRatio >= 0.25) return "Medium";
  return "Low";
}

export function calculateMetricBundle(
  snapshots: MetricSnapshot[],
  game: Pick<Game, "updatedAtRoblox">,
) {
  const rows = [...snapshots].sort(byTime);
  const firstSnapshotAt = rows[0]?.captured_at ?? null;
  const latestSnapshotAt = rows[rows.length - 1]?.captured_at ?? null;
  return {
    avgSession1d: calculateAvgSession(rows, 24),
    avgSession7d: calculateAvgSession(rows, 24 * 7),
    avgSession14d: calculateAvgSession(rows, 24 * 14),
    avgCcu1d: calculateAvgCcu(rows, 24),
    avgCcu7d: calculateAvgCcu(rows, 24 * 7),
    avgCcu14d: calculateAvgCcu(rows, 24 * 14),
    momentum1d: calculateMomentum(rows, 24),
    momentum7d: calculateMomentum(rows, 24 * 7),
    momentum14d: calculateMomentum(rows, 24 * 14),
    visitGrowth1d: calculateVisitGrowth(rows, 24),
    visitGrowth7d: calculateVisitGrowth(rows, 24 * 7),
    visitGrowth14d: calculateVisitGrowth(rows, 24 * 14),
    favoriteGrowth1d: calculateFavoriteGrowth(rows, 24),
    favoriteGrowth7d: calculateFavoriteGrowth(rows, 24 * 7),
    ratingMovement1d: calculateRatingMovement(rows, 24),
    ratingMovement7d: calculateRatingMovement(rows, 24 * 7),
    updateFreshnessScore: calculateUpdateFreshness(game),
    confidenceLevel: calculateConfidenceLevel(
      rows.length,
      24,
      firstSnapshotAt,
      latestSnapshotAt,
    ),
    snapshotSummary: {
      count: rows.length,
      firstSnapshotAt,
      latestSnapshotAt,
    },
  };
}
