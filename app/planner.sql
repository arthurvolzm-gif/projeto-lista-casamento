-- Planner CheckLove: guarda os dados do planner de cada conta.
-- Rode uma vez no Supabase: SQL Editor → New query → cole tudo → Run.
create table if not exists public.planner (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);

alter table public.planner enable row level security;

drop policy if exists "planner_ler_proprio" on public.planner;
drop policy if exists "planner_criar_proprio" on public.planner;
drop policy if exists "planner_editar_proprio" on public.planner;

-- cada pessoa só lê e grava a própria linha
create policy "planner_ler_proprio" on public.planner for select using (auth.uid() = user_id);
create policy "planner_criar_proprio" on public.planner for insert with check (auth.uid() = user_id);
create policy "planner_editar_proprio" on public.planner for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
