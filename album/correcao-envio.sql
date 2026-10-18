-- Correção: convidados sem login não conseguiam enviar fotos.
-- A regra do storage consultava a tabela albuns, que o convidado não pode ler.
-- Agora a conferência é feita por uma função com permissão própria.
create or replace function public.album_aberto(p_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.albuns where id::text = p_id and ativo and expira_em > now());
$$;
grant execute on function public.album_aberto(text) to anon, authenticated;

drop policy if exists "album: convidado envia" on storage.objects;
create policy "album: convidado envia" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'album' and public.album_aberto((storage.foldername(name))[1]));
