/* Página do convite com prévia para WhatsApp: injeta título, descrição e foto (og:image)
   do convite no HTML de /convite/ver. Rota: /c/:slug */
const SB = 'https://ktpoxcenwfykcvsadnsb.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0cG94Y2Vud2Z5a2N2c2FkbnNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzNTQyOTIsImV4cCI6MjEwNzkzMDI5Mn0.RZ1rx5WhHD574cP7_M2eoS5QUoq1uaRG22uPuizfYaU';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

module.exports = async (req, res) => {
  const slug = String((req.query && req.query.slug) || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60);
  const host = req.headers['x-forwarded-host'] || req.headers.host, proto = req.headers['x-forwarded-proto'] || 'https';
  let html = '';
  try { html = await (await fetch(`${proto}://${host}/convite/ver`)).text(); } catch (e) {}
  if (!html) { res.statusCode = 302; res.setHeader('Location', '/convite/ver?c=' + slug); return res.end(); }
  try {
    const r = await fetch(`${SB}/rest/v1/rpc/convite_publico`, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_slug: slug }) });
    const c = await r.json(), d = (c && (c.dados || c)) || {};
    if (d && (d.noiva || d.noivo)) {
      const nomes = [d.noiva, d.noivo].filter(Boolean).join(' & ');
      const img = d.fotoZap || d.fotoCapa || d.cenaImagem || '';
      const titulo = `${nomes} | Convite de casamento 💌`, desc = 'Toque para abrir o nosso convite.';
      const tags = `<title>${esc(titulo)}</title><meta property="og:title" content="${esc(titulo)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="website"><meta property="og:url" content="${esc(proto + '://' + host + '/c/' + slug)}">` + (img ? `<meta property="og:image" content="${esc(img)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${esc(img)}">` : '');
      html = html.replace(/<title>[\s\S]*?<\/title>/, '').replace(/<meta property="og:title"[^>]*>/, '').replace(/<meta property="og:description"[^>]*>/, '').replace('</head>', tags + '</head>');
    }
  } catch (e) {}
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.statusCode = 200; res.end(html);
};
