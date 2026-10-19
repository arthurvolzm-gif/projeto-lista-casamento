/* =========================================================
   Geradores dos moldes de caixinhas (planificações em mm, escala real).
   Cada gerador devolve uma "rede":
     pecas:  [{p:[[x,y]...], t:'peca'|'cola'}]   polígonos
     dobras: [[[x,y]...]]                       linhas de dobra (tracejadas)
     cortes: [[[x,y]...]]                       cortes internos (fendas)
     janelas:[{p:[...]}]                        recortes (janela)
     furos:  [[x,y,r]]                          furos para fita
     faces:  [{x,y,w,giro,texto,borda}]         decoração impressa
     rotulos:[{x,y,t}]                          textos pequenos (ex.: "cola")
   ========================================================= */
const SEN = Math.sin, COS = Math.cos, PI = Math.PI;
const P = (p, t = 'peca') => ({ p, t });
const ret = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const centro = p => [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];
const arco = (x0, y0, x1, y1, cx, cy, n = 14) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n; return [(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1]; });

/* aba de cola trapezoidal sobre o segmento a→b (para o lado oposto a ref) */
function aba(a, b, larg = 8, recuo = 0.2, ref) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), r = Math.min(recuo * L, larg * 1.2), ux = dx / L, uy = dy / L;
  let nx = dy / L, ny = -dx / L;
  if (ref) { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; if ((mx + nx - ref[0]) ** 2 + (my + ny - ref[1]) ** 2 < (mx - ref[0]) ** 2 + (my - ref[1]) ** 2) { nx = -nx; ny = -ny; } }
  return [a, [a[0] + nx * larg + ux * r, a[1] + ny * larg + uy * r], [b[0] + nx * larg - ux * r, b[1] + ny * larg - uy * r], b];
}
const novo = () => ({ pecas: [], dobras: [], cortes: [], janelas: [], furos: [], faces: [], rotulos: [] });
const coracaoPts = (cx, cy, esc, n = 56) => Array.from({ length: n }, (_, i) => { const t = i / n * 2 * PI; return [cx + 16 * SEN(t) ** 3 * esc, cy - (13 * COS(t) - 5 * COS(2 * t) - 2 * COS(3 * t) - COS(4 * t)) * esc]; });
const poligono = (cx, cy, R, n, rot = -90) => Array.from({ length: n }, (_, k) => { const a = (rot + k * 360 / n) * PI / 180; return [cx + R * COS(a), cy + R * SEN(a)]; });

const G = {};

/* ---------- caixa aberta em cruz (base + 4 laterais + 4 abas) ---------- */
G.caixaAberta = (A, B, H, o = {}) => {
  const r = novo(), a = Math.min(10, H * 0.9);
  r.pecas.push(P(ret(H, H, A, B)), P(ret(H, 0, A, H)), P(ret(H, H + B, A, H)), P(ret(0, H, H, B)), P(ret(H + A, H, H, B)));
  r.dobras.push([[H, H], [H + A, H]], [[H, H + B], [H + A, H + B]], [[H, H], [H, H + B]], [[H + A, H], [H + A, H + B]]);
  [[[H, H], [H, 0]], [[H + A, 0], [H + A, H]], [[H, H + B + H], [H, H + B]], [[H + A, H + B], [H + A, H + B + H]]].forEach(([p, q]) => {
    const t = aba(p, q, a, 0.18); r.pecas.push(P(t, 'cola')); r.dobras.push([p, q]);
    if (o.encaixe) r.rotulos.push({ x: centro(t)[0], y: centro(t)[1] + 1, t: 'encaixe' }); else r.rotulos.push({ x: centro(t)[0], y: centro(t)[1] + 1, t: 'cola' });
  });
  if (o.encaixe) { /* fendas nas laterais para as abas entrarem */
    [[3, H + 5, H - 3, H + 5], [3, H + B - 5, H - 3, H + B - 5], [H + A + 3, H + 5, H + A + H - 3, H + 5], [H + A + 3, H + B - 5, H + A + H - 3, H + B - 5]].forEach(([x1, y1, x2, y2]) => r.cortes.push([[x1, y1], [x2, y2]]));
  }
  if (o.tampa) { if (!o.janela) r.faces.push({ x: H + A / 2, y: H + B / 2, w: Math.min(A, B) * 0.62, giro: 0, texto: o.texto, borda: [H + 3, H + 3, A - 6, B - 6] }); }
  else if (!o.semFace) r.faces.push({ x: H + A / 2, y: H / 2, w: Math.min(A * 0.6, H * 1.9), giro: 0 });
  if (o.janela === 'quadrada') r.janelas.push({ p: ret(H + A * 0.2, H + B * 0.2, A * 0.6, B * 0.6) });
  if (o.janela === 'coracao') r.janelas.push({ p: coracaoPts(H + A / 2, H + B / 2 + A * 0.04, Math.min(A, B) * 0.62 / 34) });
  if (o.furosFita) r.furos.push(...o.furosFita(A, B, H));
  return r;
};
G.tampa = (A, B, Ht, texto, janela) => G.caixaAberta(A + 3, B + 3, Ht, { tampa: true, texto, janela });

/* ---------- caixa em fita (paredes em tira, para caixas altas) ---------- */
G.caixaFita = (A, B, H) => {
  const r = novo(), xs = [0, A, A + B, 2 * A + B, 2 * A + 2 * B];
  for (let i = 0; i < 4; i++) { r.pecas.push(P(ret(xs[i], 0, xs[i + 1] - xs[i], H))); if (i) r.dobras.push([[xs[i], 0], [xs[i], H]]); }
  const ab = aba([2 * A + 2 * B, 2], [2 * A + 2 * B, H - 2], 9, 0.05); r.pecas.push(P(ab, 'cola')); r.dobras.push([[2 * A + 2 * B, 2], [2 * A + 2 * B, H - 2]]); r.rotulos.push({ x: centro(ab)[0], y: centro(ab)[1], t: 'cola' });
  r.pecas.push(P(ret(0, H, A, B))); r.dobras.push([[0, H], [A, H]]);
  [[A, A + B], [A + B, 2 * A + B], [2 * A + B, 2 * A + 2 * B]].forEach(([x0, x1]) => { const t = aba([x0 + 1, H], [x1 - 1, H], 8, 0.2, [(x0 + x1) / 2, 0]); r.pecas.push(P(t, 'cola')); r.dobras.push([[x0, H], [x1, H]]); r.rotulos.push({ x: centro(t)[0], y: centro(t)[1], t: 'cola' }); });
  r.faces.push({ x: A / 2, y: H / 2, w: Math.min(A * 0.8, H * 0.5), giro: 0 });
  return r;
};

/* divisórias para bombons (duas tiras encaixadas) */
G.divisorias = (A, B, h) => {
  const r = novo(), fenda = (L, cima) => { const m = L / 2, s = 1.3, f = h / 2; return cima ? [[0, 0], [m - s, 0], [m - s, f], [m + s, f], [m + s, 0], [L, 0], [L, h], [0, h]] : [[0, 0], [L, 0], [L, h], [m + s, h], [m + s, h - f], [m - s, h - f], [m - s, h], [0, h]]; };
  r.pecas.push(P(fenda(A - 2, false)), P(fenda(B - 2, true).map(([x, y]) => [x, y + h + 8])));
  r.rotulos.push({ x: (A - 2) / 2, y: h / 2, t: 'divisória 1' }, { x: (B - 2) / 2, y: h * 1.5 + 8, t: 'divisória 2' });
  return r;
};

/* ---------- luva (gaveta) ---------- */
G.luva = (A, B, H) => {
  const r = novo(), a = A + 2, h = H + 1.5, xs = [0, a, a + h, 2 * a + h, 2 * a + 2 * h];
  for (let i = 0; i < 4; i++) { r.pecas.push(P(ret(xs[i], 0, xs[i + 1] - xs[i], B))); if (i) r.dobras.push([[xs[i], 0], [xs[i], B]]); }
  const ab = aba([2 * a + 2 * h, 3], [2 * a + 2 * h, B - 3], 9, 0.06); r.pecas.push(P(ab, 'cola')); r.dobras.push([[2 * a + 2 * h, 3], [2 * a + 2 * h, B - 3]]); r.rotulos.push({ x: centro(ab)[0], y: centro(ab)[1], t: 'cola' });
  r.faces.push({ x: a / 2, y: B / 2, w: Math.min(a, B) * 0.6, giro: 0 });
  return r;
};

/* ---------- cartucho ---------- */
G.cartucho = (W, D, H, o = {}) => {
  const r = novo(), t = Math.min(13, D * 0.75), top = D + t, xs = [0, W, W + D, 2 * W + D, 2 * W + 2 * D];
  r.pecas.push(P(ret(0, top, 2 * W + 2 * D, H))); xs.slice(1, 4).forEach(x => r.dobras.push([[x, top], [x, top + H]]));
  const ab = aba([2 * W + 2 * D, top + 2], [2 * W + 2 * D, top + H - 2], 10, 0.05); r.pecas.push(P(ab, 'cola')); r.dobras.push([[2 * W + 2 * D, top + 2], [2 * W + 2 * D, top + H - 2]]); r.rotulos.push({ x: centro(ab)[0], y: centro(ab)[1], t: 'cola' });
  const tampa = (x, y, s) => {
    const y1 = y + s * D, y2 = y1 + s * t, rr = Math.min(5, t * 0.45);
    r.pecas.push(P(ret(x, Math.min(y, y1), W, D)));
    r.pecas.push(P([[x, y1], [x + 1.5, y2 - s * rr], ...arco(x + 1.5, y2 - s * rr, x + 1.5 + rr, y2, x + 1.5, y2, 6), ...arco(x + W - 1.5 - rr, y2, x + W - 1.5, y2 - s * rr, x + W - 1.5, y2, 6), [x + W, y1]]));
    r.dobras.push([[x, y], [x + W, y]], [[x, y1], [x + W, y1]]);
  };
  tampa(W + D, top, -1); tampa(0, top + H, 1);
  [[W, top, -1], [2 * W + D, top, -1], [W, top + H, 1], [2 * W + D, top + H, 1]].forEach(([x, y, s]) => { const p = D * 0.62; r.pecas.push(P([[x, y], [x + 1, y + s * p * 0.7], [x + D * 0.45, y + s * p], [x + D - 1, y + s * p], [x + D, y]], 'cola')); r.dobras.push([[x, y], [x + D, y]]); });
  r.faces.push({ x: W / 2, y: top + H / 2, w: Math.min(W * 0.75, H * 0.5), giro: H > W * 1.4 ? 90 : 0 });
  if (o.janela) r.janelas.push({ p: ret(W * 0.18, top + H * 0.2, W * 0.64, H * 0.5) });
  return r;
};

/* ---------- travesseiro ---------- */
G.travesseiro = (W, L) => {
  const r = novo(), d = W * 0.26;
  for (let k = 0; k < 2; k++) { const x0 = k * W, x1 = x0 + W; r.pecas.push(P([...arco(x0, d, x1, d, (x0 + x1) / 2, -d), ...arco(x1, d + L, x0, d + L, (x0 + x1) / 2, 2 * d + L + d)])); r.dobras.push(arco(x0, d, x1, d, (x0 + x1) / 2, 3 * d), arco(x0, d + L, x1, d + L, (x0 + x1) / 2, d + L - 2 * d)); }
  r.dobras.push([[W, d], [W, d + L]]);
  const ab = aba([2 * W, d + 4], [2 * W, d + L - 4], 9, 0.06); r.pecas.push(P(ab, 'cola')); r.dobras.push([[2 * W, d + 4], [2 * W, d + L - 4]]); r.rotulos.push({ x: centro(ab)[0], y: centro(ab)[1], t: 'cola' });
  r.faces.push({ x: W / 2, y: d + L / 2, w: Math.min(W * 0.7, L * 0.5), giro: 90, texto: 'Com amor' });
  return r;
};

/* ---------- pirâmide de n lados, fechada com fita ---------- */
G.piramide = (n, lado, alt) => {
  const r = novo(), R = lado / (2 * SEN(PI / n)), base = [];
  for (let i = 0; i < n; i++) { const t = -PI / 2 + PI / n + i * 2 * PI / n; base.push([R * COS(t), R * SEN(t)]); }
  r.pecas.push(P(base));
  for (let i = 0; i < n; i++) {
    const a = base[i], b = base[(i + 1) % n], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, d = Math.hypot(mx, my), ap = [mx + mx / d * alt, my + my / d * alt];
    r.pecas.push(P([a, ap, b])); r.dobras.push([a, b]); r.furos.push([mx + mx / d * (alt - 9), my + my / d * (alt - 9), 1.6]);
    r.faces.push({ x: mx + mx / d * alt * 0.42, y: my + my / d * alt * 0.42, w: lado * 0.55, giro: Math.atan2(my, mx) * 180 / PI + 90 });
  }
  return r;
};

/* ---------- prisma triangular ---------- */
G.prisma = (W, L) => {
  const r = novo(), h = W * Math.sqrt(3) / 2, y0 = h + 8;
  r.pecas.push(P(ret(0, y0, 3 * W, L))); r.dobras.push([[W, y0], [W, y0 + L]], [[2 * W, y0], [2 * W, y0 + L]]);
  const ab = aba([3 * W, y0 + 3], [3 * W, y0 + L - 3], 9, 0.05); r.pecas.push(P(ab, 'cola')); r.dobras.push([[3 * W, y0 + 3], [3 * W, y0 + L - 3]]); r.rotulos.push({ x: centro(ab)[0], y: centro(ab)[1], t: 'cola' });
  [[y0, -1], [y0 + L, 1]].forEach(([y, s]) => {
    const p1 = [W, y], p2 = [2 * W, y], ap = [1.5 * W, y + s * h], c = centro([p1, p2, ap]);
    r.pecas.push(P([p1, p2, ap])); r.dobras.push([p1, p2], [p1, ap], [ap, p2]);
    const e1 = aba(p1, ap, 7, 0.22, c), e2 = aba(ap, p2, 7, 0.22, c); r.pecas.push(P(e1, 'cola'), P(e2, 'cola'));
    r.rotulos.push({ x: centro(e1)[0], y: centro(e1)[1], t: 'cola' }, { x: centro(e2)[0], y: centro(e2)[1], t: 'cola' });
  });
  r.faces.push({ x: 1.5 * W, y: y0 + L / 2, w: Math.min(W * 0.75, L * 0.6), giro: 90, texto: 'Obrigado' });
  return r;
};

/* ---------- cone ---------- */
G.cone = (R, ang) => {
  const r = novo(), a0 = (90 - ang / 2) * PI / 180, a1 = (90 + ang / 2) * PI / 180, n = 40, arcoP = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; arcoP.push([R * COS(a), R * SEN(a)]); }
  r.pecas.push(P([[0, 0], ...arcoP])); const p0 = arcoP[0], ab = aba(p0, [0, 0], 9, 0.04, [0, R * 0.6]);
  r.pecas.push(P(ab, 'cola')); r.dobras.push([[0, 0], p0]); r.rotulos.push({ x: centro(ab)[0], y: centro(ab)[1], t: 'cola' });
  r.faces.push({ x: 0, y: R * 0.7, w: R * 0.5, giro: 0 }); return r;
};

/* ---------- prisma de n lados com tampa dobradiça (hexagonal, octogonal) ---------- */
G.poligonoTampa = (n, lado, H) => {
  const r = novo(), L = n * lado, ap = lado / (2 * Math.tan(PI / n)), Rr = lado / (2 * SEN(PI / n));
  for (let i = 0; i < n; i++) { r.pecas.push(P(ret(i * lado, 0, lado, H))); if (i) r.dobras.push([[i * lado, 0], [i * lado, H]]); }
  const ab = aba([L, 2], [L, H - 2], 8, 0.05); r.pecas.push(P(ab, 'cola')); r.dobras.push([[L, 2], [L, H - 2]]); r.rotulos.push({ x: centro(ab)[0], y: centro(ab)[1], t: 'cola' });
  const cB = [lado / 2, H + ap]; r.pecas.push(P(poligono(cB[0], cB[1], Rr, n, -90 - 180 / n))); r.dobras.push([[0, H], [lado, H]]);
  for (let i = 1; i < n; i++) { const t = aba([i * lado + 1, H], [(i + 1) * lado - 1, H], 6, 0.2, [i * lado + lado / 2, 0]); r.pecas.push(P(t, 'cola')); r.dobras.push([[i * lado, H], [(i + 1) * lado, H]]); }
  const cT = [lado / 2, -ap]; r.pecas.push(P(poligono(cT[0], cT[1], Rr, n, 90 - 180 / n))); r.dobras.push([[0, 0], [lado, 0]]);
  const lingueta = aba(poligono(cT[0], cT[1], Rr, n, 90 - 180 / n)[Math.floor(n / 2)], poligono(cT[0], cT[1], Rr, n, 90 - 180 / n)[Math.floor(n / 2) + 1 - (n % 2 ? 0 : 0)], 8, 0.15, cT);
  r.pecas.push(P(lingueta, 'cola')); r.rotulos.push({ x: centro(lingueta)[0], y: centro(lingueta)[1], t: 'trava' });
  r.faces.push({ x: cT[0], y: cT[1], w: Rr * 1.1, giro: 0 });
  return r;
};

/* ---------- cilindro (tubo com duas tampas) ---------- */
G.cilindro = (d, H) => {
  const r = novo(), c = PI * d, rad = d / 2;
  r.pecas.push(P(ret(0, 0, c, H))); r.dobras.push([[0, 0], [c, 0]]);
  const ab = aba([c, 2], [c, H - 2], 8, 0.05); r.pecas.push(P(ab, 'cola')); r.dobras.push([[c, 2], [c, H - 2]]); r.rotulos.push({ x: centro(ab)[0], y: centro(ab)[1], t: 'cola' });
  [[rad + 8, H + 12 + rad + 8], [rad * 3 + 24, H + 12 + rad + 8]].forEach(([cx, cy], k) => {
    r.pecas.push(P(Array.from({ length: 56 }, (_, i) => [cx + rad * COS(i / 56 * 2 * PI), cy + rad * SEN(i / 56 * 2 * PI)])));
    for (let i = 0; i < 12; i++) { const a = i / 12 * 2 * PI, de = 0.2; r.pecas.push(P([[cx + rad * COS(a - de), cy + rad * SEN(a - de)], [cx + (rad + 7) * COS(a - de * 0.7), cy + (rad + 7) * SEN(a - de * 0.7)], [cx + (rad + 7) * COS(a + de * 0.7), cy + (rad + 7) * SEN(a + de * 0.7)], [cx + rad * COS(a + de), cy + rad * SEN(a + de)]], 'cola')); }
    r.faces.push({ x: cx, y: cy, w: d * 0.8, giro: 0, texto: k ? '' : 'Com amor' });
  });
  r.rotulos.push({ x: rad * 2 + 16, y: H + 8, t: 'recorte as duas tampas e cole as abinhas por dentro do tubo' });
  return r;
};

/* ---------- casinha com alça (caixa gable) ---------- */
G.casinha = (A, B, H, Rh) => {
  const r = novo(), S = Math.sqrt((B / 2) ** 2 + Rh ** 2), U = 16, Y0 = S + U, xs = [0, A, A + B, 2 * A + B, 2 * A + 2 * B];
  for (let i = 0; i < 4; i++) { r.pecas.push(P(ret(xs[i], Y0, xs[i + 1] - xs[i], H))); if (i) r.dobras.push([[xs[i], Y0], [xs[i], Y0 + H]]); }
  [0, 2].forEach(i => { const x = xs[i]; r.pecas.push(P(ret(x, Y0 - S, A, S))); r.pecas.push(P(ret(x, 0, A, U), 'peca')); r.dobras.push([[x, Y0], [x + A, Y0]], [[x, Y0 - S], [x + A, Y0 - S]]); r.furos.push([x + A / 2, U / 2, 3.2]); });
  [1, 3].forEach(i => { const x = xs[i]; r.pecas.push(P([[x, Y0], [x + B, Y0], [x + B / 2, Y0 - Rh]])); r.dobras.push([[x, Y0], [x + B, Y0]]); });
  const ab = aba([2 * A + 2 * B, Y0 + 3], [2 * A + 2 * B, Y0 + H - 3], 9, 0.05); r.pecas.push(P(ab, 'cola')); r.dobras.push([[2 * A + 2 * B, Y0 + 3], [2 * A + 2 * B, Y0 + H - 3]]); r.rotulos.push({ x: centro(ab)[0], y: centro(ab)[1], t: 'cola' });
  r.pecas.push(P(ret(0, Y0 + H, A, B))); r.dobras.push([[0, Y0 + H], [A, Y0 + H]]);
  [[A, A + B], [A + B, 2 * A + B], [2 * A + B, 2 * A + 2 * B]].forEach(([x0, x1]) => { const t = aba([x0 + 1, Y0 + H], [x1 - 1, Y0 + H], 8, 0.2, [(x0 + x1) / 2, Y0]); r.pecas.push(P(t, 'cola')); r.dobras.push([[x0, Y0 + H], [x1, Y0 + H]]); r.rotulos.push({ x: centro(t)[0], y: centro(t)[1], t: 'cola' }); });
  r.rotulos.push({ x: A / 2, y: S / 2 + U / 2 + 4, t: 'telhado' }, { x: A * 1.5 + B * 1.5 + A / 2 - A, y: U / 2 + 2, t: 'alça' });
  r.faces.push({ x: A / 2, y: Y0 + H / 2, w: Math.min(A * 0.7, H * 0.9), giro: 0 });
  return r;
};

/* ---------- sacola de papel ---------- */
G.sacola = (A, Gu, H) => {
  const r = novo(), xs = [0, A, A + Gu, 2 * A + Gu, 2 * A + 2 * Gu];
  for (let i = 0; i < 4; i++) { r.pecas.push(P(ret(xs[i], 0, xs[i + 1] - xs[i], H))); if (i) r.dobras.push([[xs[i], 0], [xs[i], H]]); }
  [1, 3].forEach(i => r.dobras.push([[xs[i] + Gu / 2, 3], [xs[i] + Gu / 2, H - 3]]));
  const ab = aba([2 * A + 2 * Gu, 2], [2 * A + 2 * Gu, H - 2], 8, 0.05); r.pecas.push(P(ab, 'cola')); r.dobras.push([[2 * A + 2 * Gu, 2], [2 * A + 2 * Gu, H - 2]]); r.rotulos.push({ x: centro(ab)[0], y: centro(ab)[1], t: 'cola' });
  r.pecas.push(P(ret(0, H, A, Gu * 0.62 + 2)), P(ret(A + Gu, H, A, Gu * 0.62 + 2)));
  r.dobras.push([[0, H], [A, H]], [[A + Gu, H], [2 * A + Gu, H]]);
  [[A, A + Gu], [2 * A + Gu, 2 * A + 2 * Gu]].forEach(([x0, x1]) => { const t = aba([x0 + 1, H], [x1 - 1, H], 6, 0.2, [(x0 + x1) / 2, 0]); r.pecas.push(P(t, 'cola')); r.dobras.push([[x0, H], [x1, H]]); });
  r.rotulos.push({ x: A / 2, y: H + 8, t: 'cola' }, { x: A + Gu + A / 2, y: H + 8, t: 'cola' });
  [0, 1].forEach(k => { const y = H + Gu * 0.62 + 14 + k * 0; r.pecas.push(P(ret(k * (A / 2 + 12), y, 11, 90))); });
  r.rotulos.push({ x: 6, y: H + Gu * 0.62 + 14 + 45, t: 'alça' });
  r.faces.push({ x: A / 2, y: H / 2, w: A * 0.7, giro: 0, texto: 'Obrigado' });
  return r;
};

/* ---------- envelope bolso (convite com mimo) ---------- */
G.envelope = (W, H, Sf, Hb, Hf) => {
  const r = novo(), sx = Sf, sy = Hf;
  r.pecas.push(P(ret(sx, sy, W, H)));
  r.pecas.push(P([[sx, sy + 10], [sx - Sf, sy + 26], [sx - Sf, sy + H - 26], [sx, sy + H - 10]])); r.dobras.push([[sx, sy], [sx, sy + H]]);
  r.pecas.push(P([[sx + W, sy + 10], [sx + W + Sf, sy + 26], [sx + W + Sf, sy + H - 26], [sx + W, sy + H - 10]])); r.dobras.push([[sx + W, sy], [sx + W, sy + H]]);
  const bf = [[sx, sy + H], [sx + W, sy + H], [sx + W - 14, sy + H + Hb], [sx + 14, sy + H + Hb]]; r.pecas.push(P(bf, 'cola')); r.dobras.push([[sx, sy + H], [sx + W, sy + H]]); r.rotulos.push({ x: sx + W / 2, y: sy + H + Hb / 2, t: 'cola (passe cola só nas pontas)' });
  r.pecas.push(P([[sx, sy], [sx + W, sy], ...arco(sx + W, sy, sx + W / 2, sy - Hf, sx + W * 0.62, sy - Hf * 0.7, 8).slice(1, -1), [sx + W / 2, sy - Hf], ...arco(sx + W / 2, sy - Hf, sx, sy, sx + W * 0.38, sy - Hf * 0.7, 8).slice(1)])); r.dobras.push([[sx, sy], [sx + W, sy]]);
  r.faces.push({ x: sx + W / 2, y: sy + H * 0.45, w: Math.min(W, H) * 0.7, giro: 0, texto: 'Padrinhos' });
  return r;
};

/* ---------- caixa de joias (tampa dobradiça numa peça só) ---------- */
G.joias = (A, B, H) => {
  const r = novo(), lip = Math.min(H * 0.85, 26), x0 = H, yL = lip, yBk = lip + B, yB = lip + B + H, yF = yB + B;
  r.pecas.push(P(ret(x0 + 4, 0, A - 8, lip)), P(ret(x0, yL, A, B)), P(ret(x0, yBk, A, H)), P(ret(x0, yB, A, B)), P(ret(x0, yF, A, H)));
  r.pecas.push(P(ret(0, yB, H, B)), P(ret(x0 + A, yB, H, B)));
  r.dobras.push([[x0, yL], [x0 + A, yL]], [[x0, yBk], [x0 + A, yBk]], [[x0, yB], [x0 + A, yB]], [[x0, yF], [x0 + A, yF]], [[x0, yB], [x0, yB + B]], [[x0 + A, yB], [x0 + A, yB + B]]);
  [[[x0, yB], [x0, yBk]], [[x0 + A, yBk], [x0 + A, yB]], [[x0, yF], [x0, yF + H]], [[x0 + A, yF + H], [x0 + A, yF]]].forEach(([p, q]) => { const t = aba(p, q, 8, 0.18); r.pecas.push(P(t, 'cola')); r.dobras.push([p, q]); r.rotulos.push({ x: centro(t)[0], y: centro(t)[1], t: 'cola' }); });
  r.rotulos.push({ x: x0 + A / 2, y: lip / 2, t: 'aba da frente' }, { x: x0 + A / 2, y: yL + B / 2 + 14, t: 'tampa' }, { x: x0 + A / 2, y: yB + B / 2 + 14, t: 'fundo' });
  r.faces.push({ x: x0 + A / 2, y: yL + B / 2, w: Math.min(A, B) * 0.6, giro: 0, texto: 'Padrinhos', borda: [x0 + 3, yL + 3, A - 6, B - 6] });
  return r;
};

/* ---------- flor de pétalas ---------- */
G.flor = (lado, L) => {
  const r = novo(), Rr = lado / (2 * SEN(PI / 6)), hex = poligono(0, 0, Rr, 6, -90 - 30);
  r.pecas.push(P(hex));
  for (let i = 0; i < 6; i++) {
    const p = hex[i], q = hex[(i + 1) % 6], ex = (q[0] - p[0]) / lado, ey = (q[1] - p[1]) / lado, mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, d = Math.hypot(mx, my), ux = mx / d, uy = my / d;
    const pt = (s, w, l) => [mx + ex * s * w + ux * l, my + ey * s * w + uy * l];
    r.pecas.push(P([p, pt(-1, lado / 2 + 3, L * 0.35), pt(-1, lado / 2 + 7, L * 0.7), ...arco(...pt(-1, lado / 2 + 7, L * 0.7), ...pt(1, lado / 2 + 7, L * 0.7), ...pt(0, 0, L * 1.25), 10).slice(1, -1), pt(1, lado / 2 + 7, L * 0.7), pt(1, lado / 2 + 3, L * 0.35), q]));
    r.dobras.push([p, q]); r.furos.push([mx + ux * L * 0.97, my + uy * L * 0.97, 1.6]);
    r.faces.push({ x: mx + ux * L * 0.5, y: my + uy * L * 0.5, w: lado * 0.7, giro: Math.atan2(uy, ux) * 180 / PI + 90 });
  }
  return r;
};

/* ---------- fatia (prisma em cunha) ---------- */
G.fatia = (l, b, H) => {
  const r = novo(), h = Math.sqrt(l * l - (b / 2) ** 2), y0 = h;
  r.pecas.push(P(ret(0, y0, l, H)), P(ret(l, y0, l, H)), P(ret(2 * l, y0, b, H)));
  r.dobras.push([[l, y0], [l, y0 + H]], [[2 * l, y0], [2 * l, y0 + H]]);
  const ab = aba([2 * l + b, y0 + 3], [2 * l + b, y0 + H - 3], 8, 0.05); r.pecas.push(P(ab, 'cola')); r.dobras.push([[2 * l + b, y0 + 3], [2 * l + b, y0 + H - 3]]); r.rotulos.push({ x: centro(ab)[0], y: centro(ab)[1], t: 'cola' });
  [[y0, -1], [y0 + H, 1]].forEach(([y, s]) => {
    const p1 = [2 * l, y], p2 = [2 * l + b, y], ap = [2 * l + b / 2, y + s * h], c = centro([p1, p2, ap]);
    r.pecas.push(P([p1, p2, ap])); r.dobras.push([p1, p2], [p1, ap], [ap, p2]);
    const e1 = aba(p1, ap, 7, 0.22, c), e2 = aba(ap, p2, 7, 0.22, c); r.pecas.push(P(e1, 'cola'), P(e2, 'cola'));
    r.rotulos.push({ x: centro(e1)[0], y: centro(e1)[1], t: 'cola' }, { x: centro(e2)[0], y: centro(e2)[1], t: 'cola' });
  });
  r.faces.push({ x: l, y: y0 + H / 2, w: Math.min(l * 0.55, H * 0.9), giro: 0 });
  return r;
};

/* ---------- coração (parede em tira + fundo em coração) ---------- */
G.coracao = (esc, H) => {
  const r = novo(), pts = coracaoPts(0, 0, esc, 80), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const w = Math.max(...xs) - Math.min(...xs), hh = Math.max(...ys) - Math.min(...ys);
  let per = 0; for (let i = 0; i < pts.length; i++) { const n = pts[(i + 1) % pts.length]; per += Math.hypot(n[0] - pts[i][0], n[1] - pts[i][1]); }
  r.pecas.push(P(ret(0, 0, H, per)));
  for (let y = 12; y < per; y += 12) r.dobras.push([[0, y], [H, y]]);
  const ab = aba([H / 2 - 4, per], [H / 2 + 4, per], 0.1, 0); r.pecas.push(P(ret(0, per, H, 8), 'cola')); r.rotulos.push({ x: H / 2, y: per + 4, t: 'cola' });
  for (let y = 0; y < per - 10; y += 10) { r.pecas.push(P([[0, y + 0.8], [-6, y + 2.5], [-6, y + 7.5], [0, y + 9.2]], 'cola')); }
  r.rotulos.push({ x: -3, y: per / 2, t: 'abinhas do fundo' });
  const cx = H + 22 + w / 2, cy = hh * 0.55;
  r.pecas.push(P(coracaoPts(cx, cy, esc, 80))); r.faces.push({ x: cx, y: cy - hh * 0.05, w: w * 0.55, giro: 0, texto: 'Com amor' });
  r.rotulos.push({ x: cx, y: cy + hh * 0.62, t: 'fundo' }, { x: H / 2, y: -3, t: 'parede' });
  return r;
};

/* ---------- bandeja + cinta ---------- */
G.bandeja = (A, B, H, cinta) => {
  const r = G.caixaAberta(A, B, H, { semFace: false });
  const x = 2 * H + A + 16, L = cinta;
  r.pecas.push(P(ret(x, 0, 24, L))); r.dobras.push([[x, 0], [x + 24, 0]]);
  r.pecas.push(P(ret(x, L, 24, 10), 'cola')); r.rotulos.push({ x: x + 12, y: L + 5, t: 'cola' });
  r.faces.push({ x: x + 12, y: L / 2, w: 22, giro: 90, texto: 'Com amor' }); r.rotulos.push({ x: x + 12, y: -4, t: 'cinta' });
  return r;
};


/* ---------- caixa livro rígida: capa dura em uma só folha (verso + lombada + frente) com dobras de forro ---------- */
G.livro = (A, B, H, m = 15) => {
  const r = novo(), W = 2 * A + H;
  r.pecas.push(P(ret(0, 0, A, B)), P(ret(A, 0, H, B)), P(ret(A + H, 0, A, B)));
  r.dobras.push([[A, 0], [A, B]], [[A + H, 0], [A + H, B]]);
  r.pecas.push(P(ret(-m, 0, m, B), 'cola'), P(ret(W, 0, m, B), 'cola'), P(ret(0, -m, W, m), 'cola'), P(ret(0, B, W, m), 'cola'));
  r.rotulos.push({ x: A / 2, y: B / 2, t: 'verso' }, { x: A + H / 2, y: B / 2, t: 'lombada' }, { x: A + H + A / 2, y: B / 2 + 22, t: 'frente (capa)' }, { x: -m / 2, y: B / 2, t: 'forro' });
  /* plaquinha da frente */
  const pw = 70, ph = 30, px = 0, py = B + m + 14;
  r.pecas.push(P(ret(px, py, pw, ph)));
  r.rotulos.push({ x: px + pw / 2, y: py + ph + 5, t: 'plaquinha (colar sobre a fita)' });
  r.faces.push({ x: px + pw / 2, y: py + ph / 2, w: 64, giro: 0, plaquinha: true });
  return r;
};

if (typeof module !== 'undefined' && module.exports) module.exports = { G, P, ret, coracaoPts }; else window.REDES = { G, P, ret, coracaoPts };
