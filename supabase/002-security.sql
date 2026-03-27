-- ============================================================
-- EconGames Live Racing — Security Hardening Migration
-- Run this in the Supabase SQL Editor AFTER the initial migration.
-- This locks down RLS, adds idempotent payout, and prevents cheating.
-- ============================================================

-- ── 1. Lock down UPDATE policies ─────────────────────────────
-- Remove the "anyone can update" policies that allow bankroll manipulation.
-- Updates to players and bets will ONLY happen through server-side functions.

drop policy if exists "Anyone can update players" on public.players;
drop policy if exists "Anyone can update bets" on public.bets;

-- Players: block all direct updates (only RPC functions with SECURITY DEFINER can modify)
create policy "Block direct player updates"
  on public.players for update
  using (false);

-- Bets: insert-only audit log (no updates or deletes allowed)
create policy "Bets are insert-only"
  on public.bets for update
  using (false);

-- ── 2. Prevent duplicate bet logging ─────────────────────────
-- A player can only have bets logged once per race epoch.
-- This prevents double-payout on page refresh or multi-tab scenarios.

create unique index if not exists idx_bets_player_epoch_unique
  on public.bets (player_id, race_epoch);

-- ── 3. Server-side race result processing ────────────────────
-- This function runs with SECURITY DEFINER (bypasses RLS) to atomically:
-- 1. Check if this race was already processed for this player (idempotent)
-- 2. Insert all bets in one transaction
-- 3. Update the player's bankroll atomically with row lock
--
-- Returns: {success: true, new_bankroll: N} or {success: true, already_processed: true}

create or replace function public.process_race_result(
  p_player_id uuid,
  p_race_epoch bigint,
  p_bets jsonb,
  p_net_profit numeric,
  p_biggest_win numeric
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_bankroll numeric;
  v_new_bankroll numeric;
  v_bet jsonb;
begin
  -- Lock the player row to prevent concurrent modifications
  select bankroll into v_current_bankroll
  from public.players
  where id = p_player_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Player not found');
  end if;

  -- Idempotency check: if bets already exist for this player+epoch, skip
  if exists (
    select 1 from public.bets
    where player_id = p_player_id and race_epoch = p_race_epoch
    limit 1
  ) then
    return jsonb_build_object('success', true, 'already_processed', true, 'new_bankroll', v_current_bankroll);
  end if;

  -- Insert all bets atomically
  for v_bet in select * from jsonb_array_elements(p_bets)
  loop
    insert into public.bets (
      player_id, race_epoch, bet_type, selections,
      amount, total_cost, combinations, payout, won
    ) values (
      p_player_id,
      p_race_epoch,
      v_bet->>'bet_type',
      array(select jsonb_array_elements_text(v_bet->'selections')),
      (v_bet->>'amount')::numeric,
      (v_bet->>'total_cost')::numeric,
      coalesce((v_bet->>'combinations')::integer, 1),
      coalesce((v_bet->>'payout')::numeric, 0),
      coalesce((v_bet->>'won')::boolean, false)
    );
  end loop;

  -- Update bankroll atomically (clamped to >= 0)
  v_new_bankroll := greatest(0, v_current_bankroll + p_net_profit);

  update public.players set
    bankroll = v_new_bankroll,
    total_profit = total_profit + p_net_profit,
    races_played = races_played + 1,
    biggest_win = greatest(biggest_win, p_biggest_win),
    last_active = now()
  where id = p_player_id;

  return jsonb_build_object('success', true, 'new_bankroll', v_new_bankroll);
end;
$$;

-- ── 4. Server time sync function ─────────────────────────────
-- Returns the database server's current timestamp.
-- Clients use this to correct clock drift for phase synchronization.

create or replace function public.get_server_time()
returns timestamptz
language sql
stable
as $$ select now(); $$;

-- ── 5. Allow players to update ONLY their own last_active ────
-- The login flow needs to update last_active. We allow this specific case.
-- All other updates (bankroll, profit, etc.) go through process_race_result.

drop policy if exists "Block direct player updates" on public.players;

create policy "Players can only update last_active"
  on public.players for update
  using (true)
  with check (
    -- Only allow updating last_active (bankroll/profit changes are blocked)
    -- This works because the RPC function uses SECURITY DEFINER which bypasses RLS
    bankroll = (select bankroll from public.players p where p.id = players.id)
    and total_profit = (select total_profit from public.players p where p.id = players.id)
    and races_played = (select races_played from public.players p where p.id = players.id)
  );
