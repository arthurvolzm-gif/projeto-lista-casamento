/* =========================================================
   Monta o convite (HTML) a partir dos dados e do tema.
   Usado pela prévia do editor e pela página pública (/c/<link>).
   ========================================================= */
(function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const br = s => esc(s).replace(/\n/g, '<br>');
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

  function tema(id) { return (window.TEMAS || []).find(t => t.id === id) || window.TEMAS[0]; }
  function iniciais(d) { return [(d.noiva || '').trim()[0] || '', (d.noivo || '').trim()[0] || ''].map(c => c.toUpperCase()); }
  function dataInfo(d) {
    if (!d.data) return null;
    const [a, m, dia] = d.data.split('-').map(Number), dt = new Date(a, m - 1, dia);
    const [h, mi] = (d.hora || '').split(':');
    return { dia: String(dia).padStart(2, '0'), mes: MESES[m - 1], ano: a, semana: SEMANA[dt.getDay()],
      hora: h ? `${Number(h)}h${mi && mi !== '00' ? mi : ''}` : '', num: `${String(dia).padStart(2, '0')} | ${String(m).padStart(2, '0')} | ${a}`,
      quando: new Date(a, m - 1, dia, Number(h || 0), Number(mi || 0)) };
  }

  /* coroa de folhas em aquarela (svg), com flores pequenas */
  function coroa(t, R = 120, conteudo = '') {
    let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const c = 160, folhas = [], flores = [];
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2 + rnd() * 0.08, r = R + (rnd() - 0.5) * 16, x = c + Math.cos(a) * r, y = c + Math.sin(a) * r;
      const rot = a * 180 / Math.PI + 90 + (i % 2 ? 38 : -38) + (rnd() - 0.5) * 20, s = 0.75 + rnd() * 0.55;
      folhas.push(`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(13 * s).toFixed(1)}" ry="${(5.2 * s).toFixed(1)}" transform="rotate(${rot.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${t.decor.folha}" fill-opacity="${(0.35 + rnd() * 0.45).toFixed(2)}"/>`);
    }
    [[0.15, 1], [0.62, 0.8], [0.9, 1.1], [0.35, 0.7], [0.78, 0.7]].forEach(([p, s]) => {
      const a = p * Math.PI * 2, x = c + Math.cos(a) * R, y = c + Math.sin(a) * R;
      const pet = [0, 72, 144, 216, 288].map(g => `<ellipse cx="${x}" cy="${y - 7 * s}" rx="${5 * s}" ry="${8 * s}" transform="rotate(${g} ${x} ${y})" fill="${t.decor.flor}" stroke="${t.decor.folha}" stroke-opacity=".35" stroke-width=".8"/>`).join('');
      flores.push(pet + `<circle cx="${x}" cy="${y}" r="${3 * s}" fill="${t.env.lacre}"/>`);
    });
    return `<svg class="cv-coroa" viewBox="0 0 320 320" aria-hidden="true"><defs><filter id="aq"><feGaussianBlur stdDeviation=".6"/></filter></defs><circle cx="160" cy="160" r="${R + 24}" fill="${t.decor.a}" opacity=".55"/><g filter="url(#aq)">${folhas.join('')}</g>${flores.join('')}${conteudo}</svg>`;
  }

  const ICONES = {
    local: '<svg viewBox="0 0 24 24"><path d="M12 22s7-7.4 7-12.5A7 7 0 0 0 5 9.5C5 14.6 12 22 12 22z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="9.5" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    site: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 12h18M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    presenca: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7.5 12.3l3 3 6-6.3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    presentes: '<svg viewBox="0 0 24 24"><rect x="3.5" y="9" width="17" height="11.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M2.5 9h19v-3h-19zM12 6v14.5M12 6c-2-4.5-6.5-3.5-5 0M12 6c2-4.5 6.5-3.5 5 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    musica: '<svg viewBox="0 0 24 24"><path d="M9 18V5l11-2v13" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="6.5" cy="18" r="2.5" fill="currentColor"/><circle cx="17.5" cy="16" r="2.5" fill="currentColor"/></svg>'
  };

  function foto(url, cls, alt, preview) {
    if (url) return `<div class="cv-foto ${cls}"><img src="${esc(url)}" alt="${esc(alt)}" loading="lazy"></div>`;
    return preview ? `<div class="cv-foto ${cls} vazia"><span>Sua foto aqui</span></div>` : '';
  }

  function linkMapa(d) { return d.linkMapa || (d.localEndereco ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((d.localNome ? d.localNome + ', ' : '') + d.localEndereco) : ''); }

  /* seções do convite: ordem padrão e nomes */
  const SECOES = [
    ['cena', 'Imagem de abertura'], ['topo', 'Capa'], ['foto1', 'Foto do casal 1'], ['versiculo', 'Versículo ou frase'], ['pais', 'Pais dos noivos'],
    ['data', 'Data'], ['local', 'Local'], ['botoes', 'Botões'], ['foto2', 'Foto do casal 2'], ['traje', 'Dress code'],
    ['foto3', 'Foto do casal 3'], ['final', 'Mensagem final'], ['fotofinal', 'Foto do final']
  ];
  /* convites antigos (sem lista de seções) usam as opções "mostrar" */
  function secoes(d) {
    if (Array.isArray(d.secoes)) return d.secoes.filter(id => SECOES.some(s => s[0] === id));
    return SECOES.map(s => s[0]).filter(id => !((id === 'versiculo' && d.mostrarVersiculo === false) || (id === 'pais' && d.mostrarPais === false) || (id === 'traje' && d.mostrarTraje === false)));
  }

  /* HTML do convite */
  function html(d, opt = {}) {
    const t = tema(d.tema), [i1, i2] = iniciais(d), di = dataInfo(d), nomes = `${esc(d.noiva)} <i>&amp;</i> ${esc(d.noivo)}`;
    const capa = d.fotoCapa
      ? coroa(t, 118, `<clipPath id="cpc"><circle cx="160" cy="160" r="98"/></clipPath><image href="${esc(d.fotoCapa)}" x="62" y="62" width="196" height="196" preserveAspectRatio="xMidYMid slice" clip-path="url(#cpc)"/>`)
      : coroa(t, 118, `<text x="160" y="178" text-anchor="middle" font-family="${t.script}" font-size="64" fill="${t.texto}">${esc(i1)}<tspan font-size="34" dx="4" dy="-6">&amp;</tspan><tspan dx="4" dy="6">${esc(i2)}</tspan></text>`);
    const botoes = [
      d.botaoLocal && linkMapa(d) ? `<a class="cv-bt" href="${esc(linkMapa(d))}" target="_blank" rel="noopener"><span>${ICONES.local}</span>Localização</a>` : '',
      d.botaoSite && d.linkSite ? `<a class="cv-bt" href="${esc(d.linkSite)}" target="_blank" rel="noopener"><span>${ICONES.site}</span>Site do casamento</a>` : '',
      d.botaoPresenca ? `<button class="cv-bt" type="button" data-rsvp><span>${ICONES.presenca}</span>Confirmar presença</button>` : '',
      d.botaoPresentes && d.linkPresentes ? `<a class="cv-bt" href="${esc(d.linkPresentes)}" target="_blank" rel="noopener"><span>${ICONES.presentes}</span>Lista de presentes</a>` : ''
    ].filter(Boolean);
    const fotos = d.fotos || [], P = opt.preview;
    const sec = (id, cls, corpo) => `<section class="${cls} rv" data-sec="${id}">${corpo}</section>`;
    const fotoSec = (id, url, cls) => { const h = foto(url, cls, 'Foto do casal', P); return h ? h.replace('<div class="cv-foto', `<div data-sec="${id}" class="cv-foto`) : ''; };
    const cenaUrl = d.cenaImagem || imgTema(t, 'capa.webp');
    const R = {
      cena: () => `<section class="cv-cena" data-sec="cena"><img src="${esc(cenaUrl)}" alt="" onerror="var s=this.closest('.cv-cena');if(s)s.classList.add('sem-img')"><div class="cv-cena-txt">${d.frase ? `<p class="cv-frase">${esc(d.frase)}</p>` : ''}<h1 class="cv-nomes">${nomes}</h1><span class="cv-seta"></span></div></section>`,
      topo: () => sec('topo', 'cv-topo', `<div class="cv-mono">${esc(i1)}<span>&amp;</span>${esc(i2)}</div>${d.frase ? `<p class="cv-frase">${esc(d.frase)}</p>` : ''}${capa}<h1 class="cv-nomes">${nomes}</h1>${d.convite ? `<p class="cv-txt">${br(d.convite)}</p>` : ''}`),
      foto1: () => fotoSec('foto1', fotos[0], 'funde'),
      foto2: () => fotoSec('foto2', fotos[1], 'funde'),
      foto3: () => fotoSec('foto3', fotos[2], 'funde'),
      fotofinal: () => fotoSec('fotofinal', d.fotoFinal, 'funde topo'),
      versiculo: () => d.versiculo || P ? sec('versiculo', 'cv-versiculo', `<p>"${esc(d.versiculo)}"</p>${d.versiculoRef ? `<small>${esc(d.versiculoRef)}</small>` : ''}`) : '',
      pais: () => d.paisNoiva || d.paisNoivo || P ? sec('pais', 'cv-pais', `<p class="cv-rot">Com a bênção de Deus e de seus pais</p><div class="cv-pais-g"><div>${br(d.paisNoiva)}</div><div>${br(d.paisNoivo)}</div></div><h2 class="cv-nomes peq">${nomes}</h2><p class="cv-rot">convidam para o seu casamento</p>`) : '',
      data: () => di ? sec('data', 'cv-data', `<p class="cv-rot">A realizar-se no dia</p><div class="cv-dia">${di.dia}</div><div class="cv-mes">de ${di.mes}</div><div class="cv-hora">${di.semana}${di.hora ? ' às ' + di.hora : ''}</div>${d.mostrarContagem ? `<div class="cv-cont" data-quando="${di.quando.getTime()}"></div>` : ''}`) : '',
      local: () => d.localNome || d.localEndereco ? sec('local', 'cv-local', `<h3>${esc(d.localNome)}</h3><p>${br(d.localEndereco)}</p>`) : '',
      botoes: () => botoes.length ? sec('botoes', 'cv-botoes', `<p class="cv-rot">Toque nos botões abaixo</p><div class="cv-bts n${botoes.length}">${botoes.join('')}</div>${d.botaoPresenca && d.prazoPresenca ? `<p class="cv-prazo">Confirme sua presença até ${esc(d.prazoPresenca.split('-').reverse().join('/'))}</p>` : ''}`) : '',
      traje: () => d.traje ? sec('traje', 'cv-traje', `<p class="cv-rot">Dress code</p><h3>${esc(d.traje)}</h3>${d.trajeTexto ? `<p>${br(d.trajeTexto)}</p>` : ''}${(d.trajeCores || []).filter(Boolean).length ? `<div class="cv-cores">${d.trajeCores.filter(Boolean).map(c => `<span style="background:${esc(c)}"></span>`).join('')}</div>` : ''}`) : '',
      final: () => sec('final', 'cv-final', `${d.mensagemFinal ? `<p class="cv-txt">${br(d.mensagemFinal)}</p>` : ''}<p class="cv-rot">Com carinho</p><h2 class="cv-nomes">${nomes}</h2>`)
    };
    const corpo = secoes(d).map(id => R[id] ? R[id]() : '').join('\n');
    return `<div class="cv" style="--fundo:${t.fundo};--texto:${t.texto};--dest:${t.destaque};--suave:${t.suave};--aqa:${t.decor.a};--aqb:${t.decor.b};--script:'${t.script}';--serif:'${t.serif}';--sans:'${t.sans}'">${corpo}${P ? '<div class="cv-add" data-add></div>' : ''}<footer class="cv-rod">Convite digital feito com CheckLove</footer></div>`;
  }

  /* contagem regressiva */
  function contagem(root) {
    root.querySelectorAll('.cv-cont').forEach(el => {
      const q = Number(el.dataset.quando), dias = Math.ceil((q - Date.now()) / 864e5);
      el.textContent = dias > 1 ? `Faltam ${dias} dias` : dias === 1 ? 'Falta 1 dia' : dias === 0 ? 'É hoje!' : '';
    });
  }

  /* aparecer ao rolar */
  function revelar(root, scroller) {
    const els = root.querySelectorAll('.rv, .cv-foto, .cv-cena');
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('on')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } }), { root: scroller || null, threshold: 0.12 });
    els.forEach(e => io.observe(e));
  }

  /* imagens do tema (opcionais): /convite/temas/<id>/papel.webp, forro.webp, lacre.png, capa.webp */
  const imgTema = (t, nome) => `/convite/temas/${t.id}/${nome}`;

  /* envelope de abertura (como no vídeo): toca no lacre, a aba abre, a carta sobe e o convite aparece */
  function envelopeDesenho(d, opt = {}) {
    const t = tema(d.tema), [i1, i2] = iniciais(d), e = t.env;
    return `<div class="env env-${e.padrao}" style="--papel:${e.papel};--aba:${e.aba};--borda:${e.borda};--lacre:${e.lacre};--lacreEsc:${e.lacreEsc};--cartao:${t.fundo};--texto:${t.texto};--script:'${t.script}';--serif:'${t.serif}'">
      <div class="env-corpo">
        <div class="env-carta"><div class="env-carta-in"><span class="env-carta-mono">${esc(i1)}<i>&amp;</i>${esc(i2)}</span><span class="env-carta-nomes">${esc(d.noiva)} &amp; ${esc(d.noivo)}</span></div></div>
        <div class="env-lado esq"></div><div class="env-lado dir"></div><div class="env-baixo"></div>
        <div class="env-aba"><div class="env-aba-in"></div></div>
        <button class="env-lacre" type="button" aria-label="Abrir o convite"><span>${esc(i1)}<i>&amp;</i>${esc(i2)}</span></button>
      </div>
      <p class="env-dica">${opt.dica || 'Toque no lacre para abrir'}</p>
    </div>`;
  }

  /* liga o envelope: chama aoAbrir quando a animação termina */
  /* envelope com as fotos do tema (fechado e aberto): o lacre recebe as iniciais,
     a aba é recortada da própria foto e gira em 3D, e a câmera entra no cartão */
  const FW = 941, FH = 1672;
  function envelope(d, opt = {}) {
    const t = tema(d.tema), f = t.foto;
    if (!f) return envelopeDesenho(d, opt);
    const [i1, i2] = iniciais(d), pc = (v, base) => (v / base * 100).toFixed(3) + '%';
    const lado = 2 * f.r, fs = (f.r / FW * 100 * 0.5).toFixed(2);
    return `<div class="env envf" style="--fe:url('${imgTema(t, 'fechado.webp')}');--ab:url('${imgTema(t, 'aberto.webp')}');--cartao:${t.fundo};--script:'${t.script}';--serif:'${t.serif}'">
      <div class="envf-palco"><div class="envf-cam">
        <div class="envf-foto envf-aberto"></div>
        <div class="envf-foto envf-fechado"></div>
        <div class="envf-foto envf-aba" style="clip-path:polygon(0 0,100% 0,100% ${pc(f.borda, FH)},${pc(f.x, FW)} ${pc(f.y - f.r * 1.05, FH)},0 ${pc(f.borda, FH)})"></div>
        <button class="envf-lacre" type="button" aria-label="Abrir o convite" style="left:${pc(f.x - f.r, FW)};top:${pc(f.y - f.r, FH)};width:${pc(lado, FW)}">
          <i style="width:${(FW / lado * 100).toFixed(3)}%;left:${(-(f.x - f.r) / lado * 100).toFixed(3)}%;top:${(-(f.y - f.r) / lado * 100).toFixed(3)}%"></i>
          <span style="font-size:${fs}cqw">${esc(i1)}<b>&amp;</b>${esc(i2)}</span>
        </button>
      </div></div>
      <p class="env-dica">${opt.dica || 'Toque no lacre para abrir'}</p>
    </div>`;
  }

  /* liga o envelope: chama aoAbrir quando a animação termina */
  function ligarEnvelope(root, aoAbrir) {
    const env = root.querySelector('.env'); if (!env) return aoAbrir && aoAbrir();
    const foto = env.classList.contains('envf');
    if (foto) { const m = /url\('([^']+)'\)/.exec(env.style.getPropertyValue('--ab')); if (m) new Image().src = m[1]; }
    const etapas = foto
      ? [['aba', 380], ['sobe', 1500], ['tela', 2500], ['fim', 3150]]
      : [['aba', 350], ['sobe', 1150], ['tela', 2050], ['fim', 2750]];
    const abrir = () => {
      if (env.classList.contains('abrindo')) return;
      env.classList.add('abrindo');
      if (navigator.vibrate) try { navigator.vibrate(25); } catch (e) {}
      etapas.forEach(([c, ms]) => setTimeout(() => { env.classList.add(c); if (c === 'fim' && aoAbrir) aoAbrir(); }, ms));
      setTimeout(() => env.remove(), etapas[3][1] + 800);
    };
    env.addEventListener('click', abrir);
  }

  window.Convite = { imgTema, SECOES, secoes, html, envelope, ligarEnvelope, revelar, contagem, tema, dataInfo, esc, ICONES };
})();
