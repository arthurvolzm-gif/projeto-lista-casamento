-- =========================================================
-- Convite digital CheckLove: banco no Supabase.
-- Cole tudo no SQL Editor do projeto e clique em "Run".
-- =========================================================

-- convites: um por conta (o editor usa o primeiro)
create table if not exists public.convites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,59}$'),
  dados jsonb not null default '{}'::jsonb,
  publicado boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists convites_user_idx on public.convites(user_id);

-- confirmações de presença
create table if not exists public.rsvp (
  id bigint generated always as identity primary key,
  convite_id uuid not null references public.convites(id) on delete cascade,
  nome text not null check (char_length(nome) between 2 and 80),
  telefone text check (char_length(telefone) <= 20),
  pessoas int not null default 1 check (pessoas between 0 and 20),
  vai boolean not null default true,
  mensagem text check (char_length(mensagem) <= 400),
  criado_em timestamptz not null default now()
);
create index if not exists rsvp_convite_idx on public.rsvp(convite_id);

alter table public.convites enable row level security;
alter table public.rsvp enable row level security;

-- a dona do convite lê e edita só o que é dela
drop policy if exists "convite: dona le" on public.convites;
create policy "convite: dona le" on public.convites for select using (auth.uid() = user_id);
drop policy if exists "convite: dona cria" on public.convites;
create policy "convite: dona cria" on public.convites for insert with check (auth.uid() = user_id);
drop policy if exists "convite: dona edita" on public.convites;
create policy "convite: dona edita" on public.convites for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "convite: dona apaga" on public.convites;
create policy "convite: dona apaga" on public.convites for delete using (auth.uid() = user_id);

-- a dona vê as confirmações do convite dela (convidados não leem nada)
drop policy if exists "rsvp: dona le" on public.rsvp;
create policy "rsvp: dona le" on public.rsvp for select using (exists (select 1 from public.convites c where c.id = convite_id and c.user_id = auth.uid()));

-- leitura pública: só pelo link exato, só convite publicado, só os dados do convite
create or replace function public.convite_publico(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select dados from public.convites where slug = lower(p_slug) and publicado limit 1;
$$;
grant execute on function public.convite_publico(text) to anon, authenticated;

-- convidado confirma presença sem login
create or replace function public.confirmar_presenca(p_slug text, p_nome text, p_telefone text, p_pessoas int, p_vai boolean, p_mensagem text)
returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  select id into v_id from public.convites where slug = lower(p_slug) and publicado;
  if v_id is null then raise exception 'convite não encontrado'; end if;
  insert into public.rsvp (convite_id, nome, telefone, pessoas, vai, mensagem)
  values (v_id, left(trim(p_nome), 80), left(coalesce(p_telefone, ''), 20), greatest(0, least(coalesce(p_pessoas, 1), 20)), coalesce(p_vai, true), left(coalesce(p_mensagem, ''), 400));
end $$;
grant execute on function public.confirmar_presenca(text, text, text, int, boolean, text) to anon, authenticated;

-- fotos e músicas: bucket público para leitura; cada conta só grava na própria pasta (<user_id>/...)
insert into storage.buckets (id, name, public, file_size_limit)
values ('convites', 'convites', true, 10485760)
on conflict (id) do update set public = true, file_size_limit = 10485760;

drop policy if exists "convites: envia na propria pasta" on storage.objects;
create policy "convites: envia na propria pasta" on storage.objects for insert to authenticated
  with check (bucket_id = 'convites' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "convites: troca na propria pasta" on storage.objects;
create policy "convites: troca na propria pasta" on storage.objects for update to authenticated
  using (bucket_id = 'convites' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "convites: apaga na propria pasta" on storage.objects;
create policy "convites: apaga na propria pasta" on storage.objects for delete to authenticated
  using (bucket_id = 'convites' and (storage.foldername(name))[1] = auth.uid()::text);
