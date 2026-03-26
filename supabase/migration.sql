-- ============================================================
-- EconGames Live Racing — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Players table: stores user profiles and bankroll
create table if not exists public.players (
  id uuid primary key,
  name text not null,
  bankroll numeric not null default 1000,
  starting_bankroll numeric not null default 1000,
  total_profit numeric not null default 0,
  races_played integer not null default 0,
  biggest_win numeric not null default 0,
  last_active timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Bets table: stores individual bet history
create table if not exists public.bets (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  race_epoch bigint not null,
  bet_type text not null,
  selections text[] not null,
  amount numeric not null,
  total_cost numeric not null,
  combinations integer not null default 1,
  payout numeric not null default 0,
  won boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexes for fast queries
create index if not exists idx_players_bankroll on public.players (bankroll desc);
create index if not exists idx_players_last_active on public.players (last_active desc);
create index if not exists idx_bets_player_id on public.bets (player_id);
create index if not exists idx_bets_race_epoch on public.bets (race_epoch);

-- Enable Row Level Security (but allow all operations via anon key for simplicity)
alter table public.players enable row level security;
alter table public.bets enable row level security;

-- RLS policies: allow all operations (no auth required)
-- Players can read all, insert/update their own row (matched by UUID in localStorage)
create policy "Anyone can read players"
  on public.players for select
  using (true);

create policy "Anyone can insert players"
  on public.players for insert
  with check (true);

create policy "Anyone can update players"
  on public.players for update
  using (true);

create policy "Anyone can read bets"
  on public.bets for select
  using (true);

create policy "Anyone can insert bets"
  on public.bets for insert
  with check (true);

create policy "Anyone can update bets"
  on public.bets for update
  using (true);

-- Enable realtime for the players table (for live leaderboard)
alter publication supabase_realtime add table public.players;
