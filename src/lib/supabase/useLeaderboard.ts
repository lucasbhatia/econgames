"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./client";

export interface LeaderboardEntry {
  id: string;
  name: string;
  bankroll: number;
  total_profit: number;
  races_played: number;
  biggest_win: number;
  last_active: string;
}

interface PlayerUpsert {
  id: string;
  name: string;
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

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
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
        .select("id, name, bankroll, total_profit, races_played, biggest_win, last_active")
        .order("bankroll", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLeaderboard(data ?? []);
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

    // Real-time subscription
    const channel = supabase
      .channel("leaderboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        () => {
          // Re-fetch on any change (simple approach)
          fetchLeaderboard();
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

  return {
    leaderboard,
    loading,
    connected,
    syncPlayer,
    logBets,
    refetch: fetchLeaderboard,
  };
}
