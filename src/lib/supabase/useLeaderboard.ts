"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./client";

export interface LeaderboardEntry {
  id: string;
  name: string;
  school: string;
  bankroll: number;
  total_profit: number;
  races_played: number;
  biggest_win: number;
  last_active: string;
}

export interface SchoolStanding {
  school: string;
  players: number;
  totalProfit: number;
  avgBankroll: number;
  topPlayer: string;
}

export interface PlayerUpsert {
  id: string;
  name: string;
  school: string;
  bankroll: number;
  total_profit: number;
  races_played: number;
  biggest_win: number;
}

interface BetRecord {
  player_id: string;
  race_epoch: number;
  bet_type: string;
  selections: string[];
  amount: number;
  total_cost: number;
  combinations: number;
  payout: number;
  won: boolean;
}

/** Check if Supabase is configured (env vars present) */
function isConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Compute school standings from player data.
 *  Schools ranked by total POSITIVE profit from winning players only.
 *  Winning helps your school. Losing doesn't hurt it — you just don't contribute.
 *  This prevents sabotage: creating accounts to lose on purpose has no effect. */
function computeSchoolStandings(players: LeaderboardEntry[]): SchoolStanding[] {
  const schoolMap = new Map<string, LeaderboardEntry[]>();

  for (const p of players) {
    if (!p.school) continue;
    const existing = schoolMap.get(p.school);
    if (existing) {
      existing.push(p);
    } else {
      schoolMap.set(p.school, [p]);
    }
  }

  const standings: SchoolStanding[] = [];
  for (const [school, schoolPlayers] of schoolMap) {
    // Only count POSITIVE profit — losses don't drag the school down
    const totalProfit = schoolPlayers.reduce((s, p) => s + Math.max(0, p.total_profit), 0);
    const winnersCount = schoolPlayers.filter(p => p.total_profit > 0).length;
    const avgBankroll = schoolPlayers.reduce((s, p) => s + p.bankroll, 0) / schoolPlayers.length;
    const topPlayer = [...schoolPlayers].sort((a, b) => b.total_profit - a.total_profit)[0];
    standings.push({
      school,
      players: schoolPlayers.length,
      totalProfit: Math.round(totalProfit),
      avgBankroll: Math.round(avgBankroll),
      topPlayer: topPlayer?.name ?? "",
    });
  }

  // Sort by total positive profit descending
  return standings.sort((a, b) => b.totalProfit - a.totalProfit);
}

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [schoolStandings, setSchoolStandings] = useState<SchoolStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("players")
        .select("id, name, school, bankroll, total_profit, races_played, biggest_win, last_active")
        .order("bankroll", { ascending: false })
        .limit(100);

      if (error) throw error;
      const entries = (data ?? []) as LeaderboardEntry[];
      setLeaderboard(entries);
      setSchoolStandings(computeSchoolStandings(entries));
      setConnected(true);
    } catch (err) {
      console.warn("Leaderboard fetch failed:", err);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }

    fetchLeaderboard();
    fetchRecentWins();

    // Real-time subscription — refetch leaderboard + recent wins on any player/bet change
    const channel = supabase
      .channel("leaderboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        () => {
          fetchLeaderboard();
          fetchRecentWins();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bets" },
        () => {
          fetchRecentWins();
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [fetchLeaderboard]);

  // Upsert player (create or update)
  const syncPlayer = useCallback(async (player: PlayerUpsert) => {
    if (!isConfigured()) return;

    try {
      await supabase.from("players").upsert(
        {
          id: player.id,
          name: player.name,
          school: player.school,
          bankroll: player.bankroll,
          total_profit: player.total_profit,
          races_played: player.races_played,
          biggest_win: player.biggest_win,
          last_active: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch (err) {
      console.warn("Player sync failed:", err);
    }
  }, []);

  // Log bet results
  const logBets = useCallback(async (bets: BetRecord[]) => {
    if (!isConfigured() || bets.length === 0) return;

    try {
      await supabase.from("bets").insert(bets);
    } catch (err) {
      console.warn("Bet logging failed:", err);
    }
  }, []);

  // Fetch recent winning bets across all players
  const [recentWins, setRecentWins] = useState<{ name: string; bet_type: string; payout: number; selections: string[] }[]>([]);

  const fetchRecentWins = useCallback(async () => {
    if (!isConfigured()) return;
    try {
      const { data } = await supabase
        .from("bets")
        .select("player_id, bet_type, payout, selections, total_cost")
        .eq("won", true)
        .gt("payout", 0)
        .order("created_at", { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        // Resolve player names
        const playerIds = [...new Set(data.map((b: Record<string, unknown>) => b.player_id as string))];
        const { data: players } = await supabase
          .from("players")
          .select("id, name")
          .in("id", playerIds);

        const nameMap = new Map((players ?? []).map((p: Record<string, unknown>) => [p.id as string, p.name as string]));
        setRecentWins(
          data.map((b: Record<string, unknown>) => ({
            name: nameMap.get(b.player_id as string) ?? "Unknown",
            bet_type: b.bet_type as string,
            payout: (b.payout as number) - (b.total_cost as number),
            selections: b.selections as string[],
          }))
        );
      } else {
        // No winning bets yet — keep existing or clear
        if (!data || data.length === 0) setRecentWins([]);
      }
    } catch (err) {
      console.warn("Recent wins fetch failed:", err);
    }
  }, []);

  // Process race result atomically via server-side Postgres function.
  // This replaces the old syncPlayer + logBets pattern for payout processing.
  // The function is idempotent: calling it twice for the same player+epoch is safe.
  const processRaceResult = useCallback(async (
    playerId: string,
    raceEpoch: number,
    bets: BetRecord[],
    netProfit: number,
    biggestWin: number,
  ): Promise<{ success: boolean; new_bankroll?: number; already_processed?: boolean }> => {
    if (!isConfigured()) return { success: false };

    try {
      const { data, error } = await supabase.rpc("process_race_result", {
        p_player_id: playerId,
        p_race_epoch: raceEpoch,
        p_bets: bets.map((b) => ({
          bet_type: b.bet_type,
          selections: b.selections,
          amount: b.amount,
          total_cost: b.total_cost,
          combinations: b.combinations,
          payout: b.payout,
          won: b.won,
        })),
        p_net_profit: netProfit,
        p_biggest_win: biggestWin,
      });

      if (error) {
        console.warn("processRaceResult RPC failed:", error);
        // Fallback: try the old direct approach
        await syncPlayer({
          id: playerId,
          name: "",
          school: "",
          bankroll: 0,
          total_profit: netProfit,
          races_played: 1,
          biggest_win: biggestWin,
        });
        return { success: false };
      }

      return data as { success: boolean; new_bankroll?: number; already_processed?: boolean };
    } catch (err) {
      console.warn("processRaceResult failed:", err);
      return { success: false };
    }
  }, [syncPlayer]);

  return {
    leaderboard,
    schoolStandings,
    loading,
    connected,
    syncPlayer,
    logBets,
    processRaceResult,
    refetch: fetchLeaderboard,
    refetchWins: fetchRecentWins,
    recentWins,
  };
}
