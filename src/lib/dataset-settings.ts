import { createSupabaseAdminClient } from "./supabase/admin";

export type DatasetSettings = {
  minImportCcu: number;
  minTrackCcu: number;
  autoArchiveEnabled: boolean;
  lowCcuArchiveThreshold: number;
  lowCcuSnapshotStreak: number;
  lowCcuDaysThreshold: number;
  maxTopGamesPerRun: number;
  maxKeywordResultsPerRun: number;
};

export const defaultDatasetSettings: DatasetSettings = {
  minImportCcu: 100,
  minTrackCcu: 50,
  autoArchiveEnabled: true,
  lowCcuArchiveThreshold: 25,
  lowCcuSnapshotStreak: 6,
  lowCcuDaysThreshold: 2,
  maxTopGamesPerRun: 100,
  maxKeywordResultsPerRun: 50,
};

const keyMap: Record<keyof DatasetSettings, string> = {
  minImportCcu: "min_import_ccu",
  minTrackCcu: "min_track_ccu",
  autoArchiveEnabled: "auto_archive_enabled",
  lowCcuArchiveThreshold: "low_ccu_archive_threshold",
  lowCcuSnapshotStreak: "low_ccu_snapshot_streak",
  lowCcuDaysThreshold: "low_ccu_days_threshold",
  maxTopGamesPerRun: "max_top_games_per_run",
  maxKeywordResultsPerRun: "max_keyword_results_per_run",
};

function parseSetting(defaultValue: number | boolean, value: unknown) {
  if (typeof defaultValue === "boolean") return Boolean(value ?? defaultValue);
  const parsed = Number(value ?? defaultValue);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

export async function getDatasetSettings(): Promise<DatasetSettings> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("dataset_settings").select("key, value");
  if (error) {
    console.error("[dataset-settings] Failed to load settings", { error });
    return defaultDatasetSettings;
  }
  const values = new Map((data ?? []).map((row) => [String(row.key), row.value]));
  return Object.fromEntries(
    Object.entries(keyMap).map(([localKey, dbKey]) => {
      const typedKey = localKey as keyof DatasetSettings;
      return [
        localKey,
        parseSetting(defaultDatasetSettings[typedKey], values.get(dbKey)),
      ];
    }),
  ) as DatasetSettings;
}

export async function updateDatasetSettings(
  updates: Partial<DatasetSettings>,
): Promise<DatasetSettings> {
  const admin = createSupabaseAdminClient();
  for (const [localKey, value] of Object.entries(updates)) {
    const dbKey = keyMap[localKey as keyof DatasetSettings];
    if (!dbKey || value === undefined) continue;
    const { error } = await admin.from("dataset_settings").upsert(
      {
        key: dbKey,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );
    if (error) throw error;
  }
  return getDatasetSettings();
}
