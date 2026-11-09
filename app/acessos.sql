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

-- 3. Prazo dos planos do app: mensal, 3, 6 ou 12 meses (vazio = acesso sem prazo)
alter table public.compras add column if not exists plano_meses int;
alter table public.compras add column if not exists expira_em timestamptz;

-- 4. O que a pessoa logada pode usar: as compras dela e as de quem compartilhou o planner com ela.
--    Plano vencido não libera; o mensal tem 3 dias de folga para a cobrança da renovação cair.
--    Se o planner venceu, devolve 'planner_expirou:AAAA-MM-DD' para o app mostrar a tela de renovação.
create or replace function public.meus_acessos() returns setof text
language sql stable security definer set search_path = public as $$
  with minhas as (
    select c.produto, c.expira_em + case when c.plano_meses = 1 then interval '3 days' else interval '0' end as fim
    from public.compras c
    where c.status = 'aprovado' and (
      lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      or lower(c.email) in (
        select lower(p.dono_email) from public.planner p
        where lower(coalesce(auth.jwt() ->> 'email', '')) = any (p.membros) and p.dono_email is not null
      )
    )
  )
  select distinct produto from minhas where fim is null or fim > now()
  union all
  select 'planner_expirou:' || to_char(max(fim) at time zone 'America/Sao_Paulo', 'YYYY-MM-DD')
  from minhas where produto = 'planner' and fim <= now()
  having count(*) > 0;
$$;
revoke all on function public.meus_acessos() from public, anon;
grant execute on function public.meus_acessos() to authenticated;

-- Para liberar alguém na mão (ex.: comprou com outro e-mail), troque o e-mail e rode:
-- insert into public.compras (email, produto) values ('cliente@email.com', 'planner')
--   on conflict (email, produto) do update set status = 'aprovado', atualizado_em = now();
-- Produtos possíveis: 'planner', 'convite', 'album'.
-- Para dar mais prazo a alguém na mão (ex.: +30 dias):
-- update public.compras set expira_em = expira_em + interval '30 days' where email = 'cliente@email.com' and produto = 'planner';
