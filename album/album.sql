-- =========================================================
-- Álbum dos convidados CheckLove: banco no Supabase.
-- Cole tudo no SQL Editor do mesmo projeto do convite e clique em "Run".
-- =========================================================

create table if not exists public.albuns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,59}$'),
  titulo text not null default '',
  data date,
  mensagem text default '',
  capa text default '',
  tema text default 'oliva',
  convidados_veem boolean not null default true,
  ativo boolean not null default true,
  expira_em timestamptz not null default (now() + interval '1 year'),
  criado_em timestamptz not null default now()
);
create index if not exists albuns_user_idx on public.albuns(user_id);

create table if not exists public.album_midias (
  id bigint generated always as identity primary key,
  album_id uuid not null references public.albuns(id) on delete cascade,
  caminho text not null,
  tipo text not null check (tipo in ('foto', 'video')),
  autor text default '' check (char_length(autor) <= 60),
  criado_em timestamptz not null default now()
);
create index if not exists album_midias_album_idx on public.album_midias(album_id, criado_em desc);

alter table public.albuns enable row level security;
alter table public.album_midias enable row level security;

drop policy if exists "album: dono le" on public.albuns;
create policy "album: dono le" on public.albuns for select using (auth.uid() = user_id);
drop policy if exists "album: dono cria" on public.albuns;
create policy "album: dono cria" on public.albuns for insert with check (auth.uid() = user_id);
-- o dono não consegue esticar o prazo de 1 ano mudando expira_em pelo site
drop policy if exists "album: dono edita" on public.albuns;
create policy "album: dono edita" on public.albuns for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
revoke update on public.albuns from authenticated, anon;
grant update (slug, titulo, data, mensagem, capa, tema, convidados_veem, ativo) on public.albuns to authenticated;

drop policy if exists "midias: dono le" on public.album_midias;
create policy "midias: dono le" on public.album_midias for select using (exists (select 1 from public.albuns a where a.id = album_id and a.user_id = auth.uid()));
drop policy if exists "midias: dono apaga" on public.album_midias;
create policy "midias: dono apaga" on public.album_midias for delete using (exists (select 1 from public.albuns a where a.id = album_id and a.user_id = auth.uid()));

-- página do convidado: dados públicos do álbum pelo link
create or replace function public.album_publico(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', id, 'titulo', titulo, 'data', data, 'mensagem', mensagem, 'capa', capa, 'tema', tema,
    'convidados_veem', convidados_veem, 'aberto', ativo and expira_em > now())
  from public.albuns where slug = lower(p_slug) limit 1;
$$;
grant execute on function public.album_publico(text) to anon, authenticated;

-- convidado registra a foto ou o vídeo que acabou de enviar
create or replace function public.registrar_midia(p_slug text, p_caminho text, p_tipo text, p_autor text)
returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  select id into v_id from public.albuns where slug = lower(p_slug) and ativo and expira_em > now();
  if v_id is null then raise exception 'álbum fechado ou não encontrado'; end if;
  if p_caminho not like v_id::text || '/%' then raise exception 'caminho inválido'; end if;
  if (select count(*) from public.album_midias where album_id = v_id) >= 5000 then raise exception 'álbum cheio'; end if;
  insert into public.album_midias (album_id, caminho, tipo, autor) values (v_id, p_caminho, case when p_tipo = 'video' then 'video' else 'foto' end, left(coalesce(p_autor, ''), 60));
end $$;
grant execute on function public.registrar_midia(text, text, text, text) to anon, authenticated;

-- galeria para os convidados (só se o casal deixar)
create or replace function public.midias_publicas(p_slug text)
returns table (caminho text, tipo text, autor text, criado_em timestamptz) language sql stable security definer set search_path = public as $$
  select m.caminho, m.tipo, m.autor, m.criado_em from public.album_midias m join public.albuns a on a.id = m.album_id
  where a.slug = lower(p_slug) and a.convidados_veem and a.expira_em > now() order by m.criado_em desc limit 300;
$$;
grant execute on function public.midias_publicas(text) to anon, authenticated;

-- arquivos: bucket público para ver e baixar; convidado só envia para um álbum aberto; dono apaga
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('album', 'album', true, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp'])
on conflict (id) do update set public = true, file_size_limit = 52428800, allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.album_aberto(p_id text)
returns boolean language sql stable security definer set search_path = public as $
  select exists (select 1 from public.albuns where id::text = p_id and ativo and expira_em > now());
$;
grant execute on function public.album_aberto(text) to anon, authenticated;

drop policy if exists "album: convidado envia" on storage.objects;
create policy "album: convidado envia" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'album' and public.album_aberto((storage.foldername(name))[1]));
drop policy if exists "album: dono apaga arquivo" on storage.objects;
create policy "album: dono apaga arquivo" on storage.objects for delete to authenticated
  using (bucket_id = 'album' and exists (select 1 from public.albuns a where a.id::text = (storage.foldername(name))[1] and a.user_id = auth.uid()));
-- capa do álbum: o dono envia na pasta capas/<user_id>/
drop policy if exists "album: dono envia capa" on storage.objects;
create policy "album: dono envia capa" on storage.objects for insert to authenticated
  with check (bucket_id = 'album' and (storage.foldername(name))[1] = 'capas' and (storage.foldername(name))[2] = auth.uid()::text);
