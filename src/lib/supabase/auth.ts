"use client";

import { supabase } from "./client";
import { verifyPin } from "@/lib/auth/pin";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PlayerRow {
  id: string;
  name: string;
  school: string;
  bankroll: number;
  total_profit: number;
  races_played: number;
  biggest_win: number;
  pin_hash: string | null;
  last_active: string;
  created_at: string;
}

export interface BetHistoryRow {
  id: string;
  player_id: string;
  race_epoch: number;
  bet_type: string;
  selections: string[];
  amount: number;
  total_cost: number;
  combinations: number;
  payout: number;
  won: boolean;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Check Supabase is configured                                       */
/* ------------------------------------------------------------------ */

function isConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/* ------------------------------------------------------------------ */
/*  Register a new player                                              */
/* ------------------------------------------------------------------ */

export async function registerPlayer(
  id: string,
  name: string,
  school: string,
  pinHash: string
): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured()) return { success: true }; // offline mode

  try {
    const { error } = await supabase.from("players").insert({
      id,
      name,
      school,
      pin_hash: pinHash,
      bankroll: 1000,
      total_profit: 0,
      races_played: 0,
      biggest_win: 0,
      last_active: new Date().toISOString(),
    });

    if (error) {
      // Unique constraint violation = name+school already taken
      if (error.code === "23505") {
        return {
          success: false,
          error: "This name is already taken at your school. Try 'Welcome Back' to sign in.",
        };
      }
      throw error;
    }

    return { success: true };
  } catch (err) {
    console.warn("Register failed:", err);
    // Still allow local play if Supabase is down, but warn user
    return { success: true, error: undefined };
  }
}

/* ------------------------------------------------------------------ */
/*  Login an existing player by name + school + PIN                    */
/* ------------------------------------------------------------------ */

export async function loginPlayer(
  name: string,
  school: string,
  pin: string
): Promise<{ player: PlayerRow | null; error?: string }> {
  if (!isConfigured()) {
    return { player: null, error: "Supabase not configured. Create a new account instead." };
  }

  try {
    // Case-insensitive lookup
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .ilike("name", name.trim())
      .ilike("school", school)
      .limit(1)
      .single();

    if (error || !data) {
      return { player: null, error: "No account found with that name and school." };
    }

    const player = data as PlayerRow;

    // If player has no PIN set (legacy), allow login and they can set one
    if (!player.pin_hash) {
      return { player };
    }

    // Verify PIN
    const valid = await verifyPin(pin, player.pin_hash);
    if (!valid) {
      return { player: null, error: "Incorrect PIN. Please try again." };
    }

    // Update last_active
    await supabase
      .from("players")
      .update({ last_active: new Date().toISOString() })
      .eq("id", player.id);

    return { player };
  } catch (err) {
    console.warn("Login failed:", err);
    return { player: null, error: "Connection error. Try creating a new account." };
  }
}

/* ------------------------------------------------------------------ */
/*  Fetch bet history for a player                                     */
/* ------------------------------------------------------------------ */

export async function fetchBetHistory(
  playerId: string
): Promise<BetHistoryRow[]> {
  if (!isConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from("bets")
      .select("*")
      .eq("player_id", playerId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data ?? []) as BetHistoryRow[];
  } catch (err) {
    console.warn("Bet history fetch failed:", err);
    return [];
  }
}
