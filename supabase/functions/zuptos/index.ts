// Planner CheckLove: recebe o webhook da Zuptos e libera o acesso de quem comprou.
// Publicar no Supabase como Edge Function "zuptos", com "Verify JWT" DESLIGADO.
// Segredo necessário (Edge Functions → Secrets): ZUPTOS_TOKEN = o token combinado com a Zuptos.
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem por padrão nas Edge Functions.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// Códigos de checkout de cada produto (o resto do que for vendido nesta conta libera o planner)
const BUMPS: Record<string, string[]> = {
  convite: ["5d5d81a311875672"],
  album: ["5c9410608980b13b"],
};
const PLANNER = ["458aef8196ec5da7", "50c688ffb3869bba", "a3faf364c198ad36"];

const APROVADO = /(approved|aprovad|paid|pago|complete|conclu|confirm|autoriz|authoriz|success)/i;
const ESTORNO = /(refund|reembols|chargeback|estorn|dispute|contesta|devolv)/i;
const CANCELADO = /cancel/i;
const PENDENTE = /(pending|pendente|waiting|aguard|gerad|created|abandon|expired|expirad|recus|refused|declin)/i;

type Obj = Record<string, unknown>;

function andar(v: unknown, f: (k: string, v: unknown, pai: Obj) => void, pai: Obj = {}, k = "") {
  if (Array.isArray(v)) v.forEach((x) => andar(x, f, pai, k));
  else if (v && typeof v === "object") for (const [kk, vv] of Object.entries(v as Obj)) { f(kk, vv, v as Obj); andar(vv, f, v as Obj, kk); }
}

function lerEmail(corpo: unknown): string {
  let preferido = "", qualquer = "";
  andar(corpo, (k, v, pai) => {
    if (typeof v !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return;
    const caminho = (k + " " + Object.keys(pai).join(" ")).toLowerCase();
    if (!qualquer) qualquer = v;
    if (!preferido && /(customer|cliente|buyer|comprador|client|lead)/.test(caminho)) preferido = v;
  });
  // e-mail dentro de um objeto "customer"/"cliente"
  andar(corpo, (k, v) => {
    if (preferido || !/^(customer|cliente|buyer|comprador|client)$/i.test(k) || !v || typeof v !== "object") return;
    for (const [kk, vv] of Object.entries(v as Obj)) if (/mail/i.test(kk) && typeof vv === "string") { preferido = vv; break; }
  });
  return (preferido || qualquer).trim().toLowerCase();
}

function lerSituacao(corpo: unknown): "aprovado" | "estornado" | "cancelado" | "pendente" {
  const textos: string[] = [];
  andar(corpo, (k, v) => { if (typeof v === "string" && /(status|event|evento|type|tipo|situac|state)/i.test(k)) textos.push(v); });
  const t = textos.join(" ");
  if (ESTORNO.test(t)) return "estornado";
  if (CANCELADO.test(t)) return "cancelado";
  if (APROVADO.test(t) && !PENDENTE.test(t.replace(APROVADO, ""))) return "aprovado";
  if (APROVADO.test(t)) return "aprovado";
  return "pendente";
}

function lerProdutos(corpo: unknown): string[] {
  const bruto = JSON.stringify(corpo).toLowerCase();
  const achados = new Set<string>();
  for (const [p, codigos] of Object.entries(BUMPS)) if (codigos.some((c) => bruto.includes(c))) achados.add(p);
  if (PLANNER.some((c) => bruto.includes(c))) achados.add("planner");
  // pelos nomes dos produtos/ofertas
  andar(corpo, (k, v) => {
    if (typeof v !== "string" || !/(name|nome|title|titulo|product|produto|offer|oferta|plan|plano|item)/i.test(k)) return;
    const n = v.toLowerCase();
    if (n.length < 3 || /^[0-9a-f-]{8,}$/.test(n)) return;
    if (/[áa]lbum/.test(n)) achados.add("album");
    else if (/convite|site do casamento/.test(n)) achados.add("convite");
    else if (/checklove|check love|checklist|planner|casamento|noiva/.test(n)) achados.add("planner");
  });
  // compra sem produto reconhecido nesta conta: libera o planner
  if (!achados.size) achados.add("planner");
  return [...achados];
}

function lerPedido(corpo: unknown): string {
  // prioridade: chaves de pedido/transação; depois o "id" do topo ou de "data"/"order"
  let id = "";
  andar(corpo, (k, v) => { if (!id && /^(order_id|orderid|pedido|pedido_id|transaction|transaction_id|transacao|sale_id|venda_id|codigo_venda|order_code)$/i.test(k) && (typeof v === "string" || typeof v === "number")) id = String(v); });
  const c = (corpo || {}) as Obj;
  for (const o of [c, c.data as Obj, c.order as Obj, c.pedido as Obj, c.sale as Obj, c.venda as Obj]) {
    if (!id && o && typeof o === "object" && (typeof o.id === "string" || typeof o.id === "number")) id = String(o.id);
  }
  return id;
}

Deno.serve(async (req) => {
  if (req.method === "GET") return new Response("ok", { status: 200 });
  const url = new URL(req.url);
  const esperado = Deno.env.get("ZUPTOS_TOKEN") || "";
  let corpo: unknown = null;
  const texto = await req.text();
  try { corpo = JSON.parse(texto); } catch { corpo = Object.fromEntries(new URLSearchParams(texto)); }
  const recebido = url.searchParams.get("token") || req.headers.get("x-zuptos-token") || req.headers.get("x-webhook-token") ||
    (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "") || String((corpo as Obj)?.token ?? "");
  if (!esperado || recebido !== esperado) return new Response("token inválido", { status: 401 });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const email = lerEmail(corpo), situacao = lerSituacao(corpo), produtos = lerProdutos(corpo), pedido = lerPedido(corpo);
  let resultado = `${situacao} ${email || "(sem e-mail)"} ${produtos.join(",")}`;

  if (email && situacao === "aprovado") {
    const linhas = produtos.map((p) => ({ email, produto: p, status: "aprovado", pedido, atualizado_em: new Date().toISOString() }));
    const r = await sb.from("compras").upsert(linhas, { onConflict: "email,produto" });
    if (r.error) resultado += " ERRO " + r.error.message;
  } else if (email && (situacao === "estornado" || situacao === "cancelado")) {
    // estorno/chargeback tira o acesso; "cancelado" só tira se for o mesmo pedido que liberou
    // (um Pix ou boleto cancelado de outra tentativa não derruba uma compra paga)
    let q = sb.from("compras").update({ status: "cancelado", atualizado_em: new Date().toISOString() }).eq("email", email).in("produto", produtos);
    if (situacao === "cancelado") q = q.eq("pedido", pedido || "-");
    const r = await q;
    if (r.error) resultado += " ERRO " + r.error.message;
  }
  await sb.from("webhook_eventos").insert({ corpo, resultado });
  return new Response(JSON.stringify({ ok: true, resultado }), { status: 200, headers: { "content-type": "application/json" } });
});
