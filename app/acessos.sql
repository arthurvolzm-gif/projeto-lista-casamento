-- Planner CheckLove: compras vindas da Zuptos e liberação de acesso no app.
-- Rode no Supabase: SQL Editor → New query → cole tudo → Run. Pode rodar de novo sem problema.
-- (Rode antes o app/planner.sql, se ainda não rodou.)

-- 1. Compras: uma linha por e-mail e produto ('planner', 'convite' ou 'album')
create table if not exists public.compras (
  email text not null,
  produto text not null,
  status text not null default 'aprovado',      -- 'aprovado' ou 'cancelado'
  pedido text,
  atualizado_em timestamptz not null default now(),
  primary key (email, produto)
);
alter table public.compras enable row level security;
-- ninguém escreve pelo app: só a função do webhook (que usa a chave de serviço)
drop policy if exists "compras_ler_propria" on public.compras;
create policy "compras_ler_propria" on public.compras for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- 2. Registro de tudo o que a Zuptos enviar (para conferir o formato e resolver problemas)
create table if not exists public.webhook_eventos (
  id bigserial primary key,
  recebido_em timestamptz not null default now(),
  corpo jsonb,
  resultado text
);
alter table public.webhook_eventos enable row level security;   -- sem políticas: só o painel do Supabase vê

-- 3. O que a pessoa logada pode usar: as compras dela e as de quem compartilhou o planner com ela
create or replace function public.meus_acessos() returns setof text
language sql stable security definer set search_path = public as $$
  select distinct c.produto from public.compras c
  where c.status = 'aprovado' and (
    lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or lower(c.email) in (
      select lower(p.dono_email) from public.planner p
      where lower(coalesce(auth.jwt() ->> 'email', '')) = any (p.membros) and p.dono_email is not null
    )
  );
$$;
revoke all on function public.meus_acessos() from public, anon;
grant execute on function public.meus_acessos() to authenticated;

-- Para liberar alguém na mão (ex.: comprou com outro e-mail), troque o e-mail e rode:
-- insert into public.compras (email, produto) values ('cliente@email.com', 'planner')
--   on conflict (email, produto) do update set status = 'aprovado', atualizado_em = now();
-- Produtos possíveis: 'planner', 'convite', 'album'.
