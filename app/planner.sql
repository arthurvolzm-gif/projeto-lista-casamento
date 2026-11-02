-- Planner CheckLove: dados do planner de cada conta, compartilhamento e fotos do mural.
-- Rode no Supabase: SQL Editor → New query → cole tudo → Run.
-- Pode rodar de novo sem problema (não apaga dados).

create table if not exists public.planner (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);
alter table public.planner add column if not exists membros text[] not null default '{}';
alter table public.planner add column if not exists dono_email text;

alter table public.planner enable row level security;

drop policy if exists "planner_ler_proprio" on public.planner;
drop policy if exists "planner_criar_proprio" on public.planner;
drop policy if exists "planner_editar_proprio" on public.planner;
drop policy if exists "planner_ler" on public.planner;
drop policy if exists "planner_criar" on public.planner;
drop policy if exists "planner_editar" on public.planner;

-- o dono e os e-mails com quem ele compartilhou leem e editam; só o dono cria
create policy "planner_ler" on public.planner for select
  using (auth.uid() = user_id or lower(coalesce(auth.jwt() ->> 'email', '')) = any (membros));
create policy "planner_criar" on public.planner for insert
  with check (auth.uid() = user_id);
create policy "planner_editar" on public.planner for update
  using (auth.uid() = user_id or lower(coalesce(auth.jwt() ->> 'email', '')) = any (membros))
  with check (auth.uid() = user_id or lower(coalesce(auth.jwt() ->> 'email', '')) = any (membros));

-- só o dono muda com quem o planner é compartilhado
create or replace function public.planner_protege() returns trigger language plpgsql as $$
begin
  if auth.uid() is distinct from old.user_id then
    new.user_id := old.user_id;
    new.membros := old.membros;
    new.dono_email := old.dono_email;
  end if;
  return new;
end $$;
drop trigger if exists planner_protege on public.planner;
create trigger planner_protege before update on public.planner for each row execute function public.planner_protege();

-- quem pode mexer nas fotos de um planner (pasta = id do dono)
create or replace function public.pode_planner(dono text) returns boolean
language sql stable security definer set search_path = public as $$
  select dono = auth.uid()::text or exists (
    select 1 from public.planner p
    where p.user_id::text = dono and lower(coalesce(auth.jwt() ->> 'email', '')) = any (p.membros)
  );
$$;

-- fotos do mural
insert into storage.buckets (id, name, public) values ('planner', 'planner', true) on conflict (id) do nothing;
drop policy if exists "planner_fotos_enviar" on storage.objects;
drop policy if exists "planner_fotos_apagar" on storage.objects;
create policy "planner_fotos_enviar" on storage.objects for insert to authenticated
  with check (bucket_id = 'planner' and public.pode_planner((storage.foldername(name))[1]));
create policy "planner_fotos_apagar" on storage.objects for delete to authenticated
  using (bucket_id = 'planner' and public.pode_planner((storage.foldername(name))[1]));
