import { getDatasetSettings } from "./dataset-settings";
import { createSupabaseAdminClient } from "./supabase/admin";

export async function evaluateLowCcuGame(gameId: string) {
  const admin = createSupabaseAdminClient();
  const settings = await getDatasetSettings();
  const { data: game, error } = await admin
    .from("games")
    .select("id, active_players, low_ccu_streak, is_archived")
    .eq("id", gameId)
    .maybeSingle();
  if (error) throw error;
  if (!game || game.is_archived) return { archived: false, streak: 0 };

  const activePlayers = Number(game.active_players ?? 0);
  const currentStreak = Number(game.low_ccu_streak ?? 0);
  const streak =
    activePlayers < settings.lowCcuArchiveThreshold ? currentStreak + 1 : 0;
  const shouldArchive =
    settings.autoArchiveEnabled && streak >= settings.lowCcuSnapshotStreak;

  const updates: Record<string, unknown> = { low_ccu_streak: streak };
  if (shouldArchive) {
    updates.is_archived = true;
    updates.archived_at = new Date().toISOString();
    updates.archive_reason = "Consistently below CCU threshold";
  }
  const { error: updateError } = await admin
    .from("games")
    .update(updates)
    .eq("id", gameId);
  if (updateError) throw updateError;

  if (shouldArchive) {
    await admin
      .from("tracked_games")
      .update({ tracking_enabled: false, updated_at: new Date().toISOString() })
      .eq("game_id", gameId);
  }

  return { archived: shouldArchive, streak };
}

export async function archiveLowCcuGames() {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("games")
    .select("id")
    .eq("is_archived", false);
  const results = [];
  for (const game of data ?? []) {
    results.push({ gameId: game.id, ...(await evaluateLowCcuGame(game.id)) });
  }
  return results;
}

export async function unarchiveGame(gameId: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("games")
    .update({
      is_archived: false,
      archived_at: null,
      archive_reason: null,
      low_ccu_streak: 0,
    })
    .eq("id", gameId);
  if (error) throw error;
  return { gameId, archived: false };
}

export async function archiveGame(gameId: string, reason = "Manually archived") {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("games")
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
      archive_reason: reason,
    })
    .eq("id", gameId);
  if (error) throw error;
  await admin
    .from("tracked_games")
    .update({ tracking_enabled: false, updated_at: new Date().toISOString() })
    .eq("game_id", gameId);
  return { gameId, archived: true };
}

export async function getArchiveStatus(gameId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("games")
    .select("id, is_archived, archived_at, archive_reason, low_ccu_streak")
    .eq("id", gameId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
