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
 *  Schools are ranked by total profit from profitable players (bankroll > 1000).
 *  Only players who are up count toward school score. */
function computeSchoolStandings(players: LeaderboardEntry[]): SchoolStanding[] {
  const schoolMap = new Map<string, { allPlayers: LeaderboardEntry[]; profitablePlayers: LeaderboardEntry[] }>();

  for (const p of players) {
    if (!p.school) continue;
    const existing = schoolMap.get(p.school);
    const isProfitable = p.bankroll > 1000;
    if (existing) {
      existing.allPlayers.push(p);
      if (isProfitable) existing.profitablePlayers.push(p);
    } else {
      schoolMap.set(p.school, {
        allPlayers: [p],
        profitablePlayers: isProfitable ? [p] : [],
      });
    }
  }

  const standings: SchoolStanding[] = [];
  for (const [school, data] of schoolMap) {
    // School score = sum of profit from profitable players only
    const totalProfit = data.profitablePlayers.reduce((s, p) => s + p.total_profit, 0);
    const avgBankroll = data.allPlayers.reduce((s, p) => s + p.bankroll, 0) / data.allPlayers.length;
    const topPlayer = data.allPlayers.sort((a, b) => b.total_profit - a.total_profit)[0];
    standings.push({
      school,
      players: data.allPlayers.length,
      totalProfit: Math.round(totalProfit),
      avgBankroll: Math.round(avgBankroll),
      topPlayer: topPlayer?.name ?? "",
    });
  }

  // Sort by total profit descending
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
      }
    } catch {}
  }, []);

  return {
    leaderboard,
    schoolStandings,
    loading,
    connected,
    syncPlayer,
    logBets,
    refetch: fetchLeaderboard,
    recentWins,
  };
}
