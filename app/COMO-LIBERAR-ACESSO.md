# Liberar o acesso de quem comprou (Zuptos → Supabase → app)

## Como funciona
1. A pessoa compra na Zuptos.
2. A Zuptos avisa a função `zuptos` do Supabase (webhook).
3. A função grava em `compras`: e-mail + produto (`planner`, `convite` ou `album`).
4. No app, depois do login, o app confere as compras do e-mail:
   - comprou o planner: entra e aparece "Login aprovado!" (uma vez só);
   - ainda não: aparece "Estamos confirmando sua compra", que confere de novo sozinho a cada 20 segundos;
   - comprou o convite ou o álbum: o card fica "Liberado" nos Bônus e o sininho avisa.
5. Quem recebe o planner compartilhado (noivo, cerimonialista) entra com a compra de quem compartilhou.
6. Estorno ou chargeback tira o acesso. Pix ou boleto cancelado só tira se for o mesmo pedido que liberou.

## Passo a passo (uma vez só)

### 1. Banco
SQL Editor → New query → cole `app/acessos.sql` → Run.

### 2. Segredo
Edge Functions → Secrets → Add new secret:
- Name: `ZUPTOS_TOKEN`
- Value: o token (não fica no repositório)

### 3. Função
Edge Functions → Deploy a new function → Via Editor:
- Nome: `zuptos`
- Cole todo o `supabase/functions/zuptos/index.ts` e clique em Deploy.
- Na função, em Details/Settings, **desligue "Verify JWT"** (a Zuptos não manda login do Supabase) e salve.

### 4. Zuptos
No painel da Zuptos, em Webhooks/Integrações, crie um webhook com a URL:

    https://ktpoxcenwfykcvsadnsb.supabase.co/functions/v1/zuptos?token=O_TOKEN

Marque os eventos de venda aprovada, reembolso, chargeback e cancelamento.
Se a Zuptos tiver um campo próprio de "token", pode colar o mesmo token lá também.

### 5. Testar
Faça uma compra de teste (ou use o botão de teste da Zuptos) e confira:
- Table Editor → `webhook_eventos`: o que a Zuptos mandou e o que a função entendeu (coluna `resultado`).
- Table Editor → `compras`: a linha do e-mail.

## Liberar na mão
SQL Editor:

    insert into public.compras (email, produto) values ('cliente@email.com', 'planner')
      on conflict (email, produto) do update set status = 'aprovado', atualizado_em = now();

## Produtos e códigos de checkout
- Convite (`convite`): 5d5d81a311875672
- Álbum (`album`): 5c9410608980b13b
- Planner: os checkouts do checklist (458aef8196ec5da7, 50c688ffb3869bba, a3faf364c198ad36) e qualquer outra venda aprovada desta conta.
Os códigos ficam no topo de `supabase/functions/zuptos/index.ts`.
