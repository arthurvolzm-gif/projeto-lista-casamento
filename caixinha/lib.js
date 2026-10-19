/* Desenho dos moldes de caixinha com a arte personalizada (nomes, cores, estampa, estilo).
   Usado pelo site /caixinha e pelo PDF do Bônus 3. Todas as medidas em milímetros. */
(function (root, fabrica) {
  if (typeof module !== 'undefined' && module.exports) module.exports = fabrica();
  else root.CX = fabrica();
})(this, function () {
  const LINHA = '#4a3b36';
  const PAL = {
    salvia: { n: 'Sálvia', bg: '#e8eddf', cor: '#8c9a7c', tinta: '#4d5a41' },
    rosa: { n: 'Rosé', bg: '#f7e6e1', cor: '#cf9a8f', tinta: '#7d4b43' },
    moca: { n: 'Mocha', bg: '#efe3da', cor: '#8d6a5f', tinta: '#5e4038' },
    azul: { n: 'Azul poeira', bg: '#e4ecf2', cor: '#6f90ad', tinta: '#35516b' },
    ouro: { n: 'Champanhe', bg: '#f6eed9', cor: '#bf9b4a', tinta: '#6b5524' },
    lilas: { n: 'Lilás', bg: '#ece6f4', cor: '#9078b4', tinta: '#51406f' },
    terra: { n: 'Terracota', bg: '#f3e2d6', cor: '#b5704f', tinta: '#6e3f2a' },
    oliva: { n: 'Oliva', bg: '#eaead6', cor: '#7f8450', tinta: '#4a4e26' },
    vinho: { n: 'Marsala', bg: '#f1dfe0', cor: '#9c3f4e', tinta: '#5c1f2b' },
    branco: { n: 'Branco', bg: '#fbf9f5', cor: '#b8a99a', tinta: '#5e4a40' },
    kraft: { n: 'Kraft', bg: '#d9bf9b', cor: '#7a5a37', tinta: '#4a3320' },
    marinho: { n: 'Marinho', bg: '#dfe4ee', cor: '#2f4570', tinta: '#1f2f4f' },
    vinhoesc: { n: 'Marsala escuro', bg: '#6e1f2a', cor: '#d4b266', tinta: '#f3e9d2' },
    noite: { n: 'Azul-noite', bg: '#1d2d57', cor: '#d4b266', tinta: '#f3e9d2' },
    preto: { n: 'Preto', bg: '#222222', cor: '#d4b266', tinta: '#f3e9d2' },
    floresta: { n: 'Verde-floresta', bg: '#1f4a33', cor: '#d4b266', tinta: '#f3e9d2' },
    grafite: { n: 'Grafite', bg: '#4a4a4d', cor: '#d9bd7a', tinta: '#f1e8d6' },
    ferrugem: { n: 'Ferrugem', bg: '#b25a3d', cor: '#f2dcc0', tinta: '#fbeede' },
    pessego: { n: 'Pêssego', bg: '#fbd9c3', cor: '#e9a98a', tinta: '#8a5a40' },
    aco: { n: 'Azul-aço', bg: '#8da1b8', cor: '#e8cf8f', tinta: '#f6efe0' }
  };
  const ESTAMPAS = { liso: 'Lisa', pontos: 'Bolinhas', listras: 'Listras', losangos: 'Losangos', folhas: 'Folhas', floral: 'Florzinhas', aquarela: 'Aquarela' };
  const ESTILOS = { coroa: 'Coroa de folhas', floral: 'Floral', moldura: 'Moldura', selo: 'Selo e fita', minimal: 'Minimalista' };
  const FONTES = {
    script: { n: 'Manuscrita', css: "'Great Vibes', cursive", esc: 1 },
    serif: { n: 'Clássica', css: "'Playfair Display', serif", esc: 0.62 },
    sans: { n: 'Moderna', css: "'Montserrat', sans-serif", esc: 0.55 }
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const poli = p => p.map(q => q[0].toFixed(2) + ',' + q[1].toFixed(2)).join(' ');
  const centro = p => [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];
  let uid = 0;

  function resolvePal(p) {
    if (p && typeof p === 'object') return Object.assign({ tinta: '#4d3b35' }, p);
    return PAL[p] || PAL.rosa;
  }

  /* ---------- elementos de arte ---------- */
  const folha = (x, y, len, ang, cor, op = 0.85) => `<path d="M0 0 Q${(len * 0.5).toFixed(2)} ${(-len * 0.3).toFixed(2)} ${len.toFixed(2)} 0 Q${(len * 0.5).toFixed(2)} ${(len * 0.3).toFixed(2)} 0 0Z" transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${ang.toFixed(1)})" fill="${cor}" fill-opacity="${op}"/>`;
  function flor(x, y, r, cor, miolo) {
    let s = '';
    for (let i = 0; i < 5; i++) { const a = i * 72 - 90; s += `<ellipse cx="${(r * 0.5).toFixed(2)}" cy="0" rx="${(r * 0.52).toFixed(2)}" ry="${(r * 0.34).toFixed(2)}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${a})" fill="${cor}" fill-opacity=".8"/>`; }
    return s + `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(r * 0.24).toFixed(2)}" fill="${miolo}"/>`;
  }
  /* galho com folhas, saindo de (x,y) na direção ang */
  function galho(x, y, len, ang, cor, n = 6) {
    const r = ang * Math.PI / 180, ex = x + Math.cos(r) * len, ey = y + Math.sin(r) * len;
    let s = `<line x1="${x.toFixed(2)}" y1="${y.toFixed(2)}" x2="${ex.toFixed(2)}" y2="${ey.toFixed(2)}" stroke="${cor}" stroke-width="${(len * 0.012 + 0.25).toFixed(2)}" stroke-linecap="round"/>`;
    for (let i = 1; i <= n; i++) {
      const t = i / (n + 1), px = x + Math.cos(r) * len * t, py = y + Math.sin(r) * len * t, fl = len * 0.22;
      s += folha(px, py, fl, ang + (i % 2 ? -42 : 42), cor);
    }
    return s + folha(ex, ey, len * 0.2, ang, cor);
  }
  /* coroa de folhas em volta de (cx,cy) */
  function coroa(cx, cy, R, cor) {
    let s = '';
    const n = 9;
    for (const lado of [-1, 1]) {
      for (let i = 0; i < n; i++) {
        const A = (96 + i / (n - 1) * 168) * Math.PI / 180, x = cx + lado * -Math.cos(A) * R, y = cy + Math.sin(A) * R;
        const tg = Math.atan2(Math.cos(A), lado * Math.sin(A)) * 180 / Math.PI;
        s += folha(x, y, R * 0.3, tg + (i % 2 ? -34 : 34), cor);
      }
      const pts = [];
      for (let i = 0; i <= 20; i++) { const a = (96 + i / 20 * 168) * Math.PI / 180; pts.push((cx + lado * -Math.cos(a) * R).toFixed(2) + ',' + (cy + Math.sin(a) * R).toFixed(2)); }
      s += `<polyline points="${pts.join(' ')}" fill="none" stroke="${cor}" stroke-width="${(R * 0.02 + 0.2).toFixed(2)}"/>`;
    }
    return s;
  }

  function texto(t, x, y, tam, fonte, cor, esp = 0, maiusc = false, larguraMax) {
    if (!t) return '';
    const F = FONTES[fonte] || FONTES.script;
    let k = tam;
    if (larguraMax) { const est = t.length * tam * F.esc * (maiusc ? 1.25 : 1) + t.length * esp; if (est > larguraMax) k = tam * larguraMax / est; }
    return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" text-anchor="middle" font-family="${F.css}" font-size="${k.toFixed(2)}" fill="${cor}"${esp ? ` letter-spacing="${(esp * k / tam).toFixed(2)}"` : ''}>${esc(maiusc ? t.toUpperCase() : t)}</text>`;
  }
  const iniciais = nomes => {
    const p = String(nomes || '').split(/\s*(?:&|\+|\be\b| e )\s*/i).map(x => x.trim()).filter(Boolean);
    if (p.length >= 2) return p[0][0].toUpperCase() + '&' + p[1][0].toUpperCase();
    return p.length === 1 ? p[0][0].toUpperCase() : '';
  };

  /* arte numa face: centro (x,y), largura útil w */
  function arte(f, o, pal) {
    const w = f.w, x = f.x, y = f.y, c = pal.cor, t = pal.tinta, fonte = o.fonte || 'script';
    const tit = o.titulo || '', nomes = o.nomes || '', data = o.data || '', frase = o.frase || '';
    const mono = o.mono || iniciais(nomes);
    if (f.plaquinha) {
      return `<g transform="rotate(${f.giro || 0} ${x} ${y})">${texto(tit, x, y - 6.2, 2.7, 'sans', t, 0.6, true, w * 0.9)}${texto(nomes, x, y + 4.2, 9.5, fonte, t, 0, false, w * 0.92)}${texto(data, x, y + 10, 2.4, 'sans', c, 0.5, true, w * 0.9)}</g>`;
    }
    let s = '';
    const e = o.estiloArte || 'coroa';
    if (o.estampa && o.estampa !== 'liso' && e !== 'selo' && e !== 'moldura') s += `<rect x="${(x - w * 0.47).toFixed(2)}" y="${(y - w * 0.47).toFixed(2)}" width="${(w * 0.94).toFixed(2)}" height="${(w * 1.02).toFixed(2)}" rx="${(w * 0.07).toFixed(2)}" fill="${pal.bg}" fill-opacity=".9"/>`;
    if (o.estampa && o.estampa !== 'liso' && e === 'moldura') s += `<rect x="${x - w * 0.46}" y="${y - w * 0.35}" width="${w * 0.92}" height="${w * 0.7}" fill="${pal.bg}" fill-opacity=".92"/>`;
    if (e === 'coroa') {
      const R = w * 0.34, cy = y - w * 0.12;
      s += coroa(x, cy, R, c);
      if (mono) s += texto(mono, x, cy + R * 0.28, R * 0.85, fonte === 'sans' ? 'serif' : fonte, t, 0, false, R * 1.4);
      s += texto(tit, x, y + w * 0.3, w * 0.085, 'sans', t, w * 0.012, true, w * 0.9);
      s += texto(nomes, x, y + w * 0.44, w * 0.15, fonte, t, 0, false, w * 0.95);
      s += texto(data, x, y + w * 0.53, w * 0.062, 'sans', c, w * 0.01, true, w * 0.9);
    } else if (e === 'floral') {
      const bx = w * 0.42, by = w * 0.34;
      for (const [sx, sy, rot] of [[-1, -1, 0], [1, 1, 180]]) {
        const ox = x + sx * bx, oy = y + sy * by;
        s += galho(ox, oy, w * 0.34, rot + (sx === -1 ? 20 : -20) + 90 * 0, c, 5);
        s += flor(ox, oy, w * 0.1, c, t) + flor(ox + sx * w * 0.1, oy + sy * w * 0.05, w * 0.07, c, '#fff') + flor(ox + sx * w * 0.02, oy + sy * w * 0.12, w * 0.06, c, '#fff');
      }
      s += texto(tit, x, y - w * 0.1, w * 0.09, 'sans', t, w * 0.012, true, w * 0.75);
      s += texto(nomes, x, y + w * 0.06, w * 0.19, fonte, t, 0, false, w * 0.85);
      s += texto(data, x, y + w * 0.16, w * 0.065, 'sans', c, w * 0.01, true, w * 0.75);
      s += texto(frase, x, y + w * 0.24, w * 0.055, 'serif', t, 0, false, w * 0.85);
    } else if (e === 'moldura') {
      const bw = w * 0.92, bh = w * 0.7, x0 = x - bw / 2, y0 = y - bh / 2;
      s += `<rect x="${x0}" y="${y0}" width="${bw}" height="${bh}" fill="none" stroke="${c}" stroke-width="${(w * 0.012 + 0.2).toFixed(2)}"/><rect x="${x0 + w * 0.03}" y="${y0 + w * 0.03}" width="${bw - w * 0.06}" height="${bh - w * 0.06}" fill="none" stroke="${c}" stroke-width="${(w * 0.006 + 0.1).toFixed(2)}"/>`;
      for (const [cx2, cy2] of [[x0, y0], [x0 + bw, y0], [x0, y0 + bh], [x0 + bw, y0 + bh]]) s += `<circle cx="${cx2}" cy="${cy2}" r="${(w * 0.022).toFixed(2)}" fill="${c}"/>`;
      s += galho(x - w * 0.12, y - bh * 0.28, w * 0.24, 0, c, 4);
      s += texto(tit, x, y - w * 0.04, w * 0.085, 'sans', t, w * 0.012, true, w * 0.75);
      s += texto(nomes, x, y + w * 0.12, w * 0.17, fonte, t, 0, false, w * 0.8);
      s += texto(data, x, y + w * 0.23, w * 0.06, 'sans', c, w * 0.01, true, w * 0.7);
    } else if (e === 'selo') {
      const bh = w * 0.16;
      s += `<rect x="${x - w * 0.6}" y="${y - bh / 2}" width="${w * 1.2}" height="${bh}" fill="${c}" fill-opacity=".9"/>`;
      s += `<circle cx="${x}" cy="${y}" r="${w * 0.2}" fill="${pal.bg}" stroke="${c}" stroke-width="${(w * 0.012 + 0.2).toFixed(2)}"/>`;
      if (mono) s += texto(mono, x, y + w * 0.055, w * 0.17, fonte === 'sans' ? 'serif' : fonte, t, 0, false, w * 0.3);
      s += texto(tit, x, y - w * 0.3, w * 0.09, 'sans', t, w * 0.012, true, w * 0.9);
      s += texto(nomes, x, y + w * 0.36, w * 0.14, fonte, t, 0, false, w * 0.95);
      s += texto(data, x, y + w * 0.46, w * 0.06, 'sans', c, w * 0.01, true, w * 0.9);
    } else {
      s += `<line x1="${x - w * 0.18}" y1="${y - w * 0.2}" x2="${x + w * 0.18}" y2="${y - w * 0.2}" stroke="${c}" stroke-width="${(w * 0.008 + 0.15).toFixed(2)}"/>`;
      s += texto(tit, x, y - w * 0.08, w * 0.09, 'sans', t, w * 0.014, true, w * 0.85);
      s += texto(nomes, x, y + w * 0.1, w * 0.19, fonte, t, 0, false, w * 0.9);
      s += texto(data, x, y + w * 0.2, w * 0.062, 'sans', c, w * 0.01, true, w * 0.8);
      s += galho(x - w * 0.1, y + w * 0.3, w * 0.2, 0, c, 4);
    }
    return `<g transform="rotate(${f.giro || 0} ${x} ${y})">${s}</g>`;
  }

  /* ---------- estampas ---------- */
  function defs(id, pal, estampa) {
    const bg = pal.bg, c = pal.cor;
    let fig = '', tam = 12;
    if (estampa === 'pontos') fig = `<circle cx="3" cy="3" r=".7" fill="${c}" fill-opacity=".55"/><circle cx="9" cy="9" r=".7" fill="${c}" fill-opacity=".55"/>`;
    else if (estampa === 'listras') fig = `<line x1="0" y1="12" x2="12" y2="0" stroke="${c}" stroke-opacity=".28" stroke-width=".9"/>`;
    else if (estampa === 'losangos') fig = `<path d="M6 1 L11 6 L6 11 L1 6 Z" fill="none" stroke="${c}" stroke-opacity=".5" stroke-width=".4"/>`;
    else if (estampa === 'folhas') fig = `<path d="M2 10 Q6 1 10 10" fill="none" stroke="${c}" stroke-opacity=".5" stroke-width=".45"/><ellipse cx="6" cy="4.6" rx="1.3" ry=".6" fill="${c}" fill-opacity=".35" transform="rotate(-35 6 4.6)"/>`;
    else if (estampa === 'floral') { tam = 16; fig = flor(4, 4, 2.4, c, pal.tinta).replace(/fill-opacity="\.8"/g, 'fill-opacity=".4"') + flor(12, 12, 1.7, c, pal.tinta).replace(/fill-opacity="\.8"/g, 'fill-opacity=".4"') + folha(8, 7.5, 2.4, 40, c, 0.4); }
    else if (estampa === 'aquarela') { tam = 60; fig = `<circle cx="14" cy="16" r="15" fill="${c}" fill-opacity=".14"/><circle cx="42" cy="22" r="12" fill="${c}" fill-opacity=".1"/><circle cx="30" cy="46" r="16" fill="${c}" fill-opacity=".13"/>`; }
    return `<defs><pattern id="${id}" width="${tam}" height="${tam}" patternUnits="userSpaceOnUse"><rect width="${tam}" height="${tam}" fill="${bg}"/>${fig}</pattern></defs>`;
  }

  function bbox(r) {
    const t = r.pecas.flatMap(p => p.p);
    return { x0: Math.min(...t.map(p => p[0])) - 1, y0: Math.min(...t.map(p => p[1])) - 1, x1: Math.max(...t.map(p => p[0])) + 1, y1: Math.max(...t.map(p => p[1])) + 1 };
  }

  /* desenha uma rede. o: { paleta, estampa, estiloArte, fonte, titulo, nomes, data, frase, rotulos } */
  function desenhar(r, o = {}) {
    const pal = resolvePal(o.paleta), id = 'pt' + (++uid), modo = o.modo || 'normal';
    const b = bbox(r), sg = modo === 'normal' ? 0 : 3;
    b.x0 -= sg; b.y0 -= sg; b.x1 += sg; b.y1 += sg;
    const w = b.x1 - b.x0, h = b.y1 - b.y0, MAG = '#e6007e', CIA = '#00a0e3';
    let c = defs(id, pal, o.estampa || 'pontos');
    if (modo === 'normal') {
      c += r.pecas.map(p => p.t === 'cola'
        ? `<polygon points="${poli(p.p)}" fill="#fffdf9" stroke="${LINHA}" stroke-width=".3" stroke-linejoin="round"/><polygon points="${poli(p.p)}" fill="${pal.cor}" fill-opacity=".12"/>`
        : `<polygon points="${poli(p.p)}" fill="url(#${id})" stroke="${LINHA}" stroke-width=".4" stroke-linejoin="round"/>`).join('');
    } else {
      /* sangria de 3 mm: o padrão é repetido por fora do corte */
      c += r.pecas.map(p => `<polygon points="${poli(p.p)}" fill="url(#${id})" stroke="url(#${id})" stroke-width="6" stroke-linejoin="round"/>`).join('');
    }
    c += r.faces.map(f => (f.borda && modo === 'normal' ? `<rect x="${f.borda[0]}" y="${f.borda[1]}" width="${f.borda[2]}" height="${f.borda[3]}" fill="none" stroke="${pal.cor}" stroke-width=".4" stroke-dasharray="1 .8"/>` : '') + (f.w > 0 ? arte(f, o, pal) : '')).join('');
    if (modo === 'arte') { return fim(c, b, w, h); }
    const lc = modo === 'faca' ? MAG : LINHA, dc = modo === 'faca' ? CIA : LINHA;
    if (modo === 'faca') c += r.pecas.map(p => `<polygon points="${poli(p.p)}" fill="none" stroke="${MAG}" stroke-width=".35" stroke-linejoin="round"/>`).join('');
    c += r.janelas.map(j => `<polygon points="${poli(j.p)}" fill="#fff" stroke="${lc}" stroke-width=".4"/>${modo === 'faca' ? '' : `<text x="${centro(j.p)[0]}" y="${centro(j.p)[1] + 1}" font-size="2.6" fill="#aaa" text-anchor="middle" font-family="Montserrat">recorte (janela)</text>`}`).join('');
    c += r.cortes.map(d => `<polyline points="${poli(d)}" fill="none" stroke="${lc}" stroke-width=".55" stroke-linecap="round"/>`).join('');
    c += r.dobras.map(d => modo === 'faca' ? `<polyline points="${poli(d)}" fill="none" stroke="${CIA}" stroke-width=".35" stroke-dasharray="2 1.5"/>` : `<polyline points="${poli(d)}" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width=".7"/><polyline points="${poli(d)}" fill="none" stroke="${LINHA}" stroke-width=".3" stroke-dasharray="2 1.5"/>`).join('');
    if (o.rotulos !== false && modo === 'normal') c += r.rotulos.map(l => `<text x="${l.x.toFixed(1)}" y="${l.y.toFixed(1)}" font-size="2.5" fill="#8a7d77" text-anchor="middle" font-family="Montserrat">${esc(l.t)}</text>`).join('');
    c += r.furos.map(([x, y, rr]) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="#fff" stroke="${lc}" stroke-width=".35"/>`).join('');
    return fim(c, b, w, h);
  }
  function fim(c, b, w, h) {
    const vb = `${b.x0} ${b.y0} ${w.toFixed(2)} ${h.toFixed(2)}`;
    return {
      w, h,
      svg: (girar, k = 1) => girar
        ? `<svg width="${(h * k).toFixed(1)}mm" height="${(w * k).toFixed(1)}mm" viewBox="0 0 ${h.toFixed(2)} ${w.toFixed(2)}" style="display:block"><g transform="translate(${h.toFixed(2)} 0) rotate(90) translate(${-b.x0} ${-b.y0})">${c}</g></svg>`
        : `<svg width="${(w * k).toFixed(1)}mm" height="${(h * k).toFixed(1)}mm" viewBox="${vb}" style="display:block">${c}</svg>`,
      fluido: () => `<svg viewBox="${vb}" style="display:block;width:100%;height:auto">${c}</svg>`
    };
  }

  /* prévia da frente da caixa: quadrado com a arte */
  function frente(o = {}) {
    const pal = resolvePal(o.paleta), id = 'pt' + (++uid);
    const f = { x: 50, y: 50, w: 70, giro: 0 };
    return `<svg viewBox="0 0 100 100" style="display:block;width:100%;height:auto"><defs><filter id="${id}s" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.8" flood-opacity=".25"/></filter></defs>${defs(id, pal, o.estampa || 'pontos')}<rect x="5" y="5" width="90" height="90" rx="1.5" fill="url(#${id})" stroke="${LINHA}" stroke-width=".3" filter="url(#${id}s)"/><rect x="8.5" y="8.5" width="83" height="83" fill="none" stroke="${pal.cor}" stroke-width=".35" stroke-dasharray="1 .8"/>${arte(f, o, pal)}</svg>`;
  }

  return { PAL, ESTAMPAS, ESTILOS, FONTES, desenhar, frente, resolvePal, iniciais, folha, flor, galho, coroa, defs, texto };
});
