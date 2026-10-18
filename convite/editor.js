/* =========================================================
   Editor do convite: login, campos, fotos, prévia ao vivo,
   salvamento automático e compartilhamento.
   ========================================================= */
(function () {
  const D = window.ConviteDados, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  let conv = null, timerSalvar = null, timerPrevia = null;

  /* ---------- login ---------- */
  let modo = 'entrar';
  $$('.abas button').forEach(b => b.onclick = () => {
    modo = b.dataset.modo; $$('.abas button').forEach(x => x.classList.toggle('on', x === b));
    $('#l-bt').textContent = modo === 'entrar' ? 'Entrar' : 'Criar conta';
    $('#l-senha').autocomplete = modo === 'entrar' ? 'current-password' : 'new-password'; $('#l-msg').textContent = '';
  });
  $('#form-login').onsubmit = async e => {
    e.preventDefault(); const msg = $('#l-msg'), email = $('#l-email').value.trim(), senha = $('#l-senha').value;
    msg.className = 'login-msg'; msg.textContent = 'Aguarde...';
    try {
      if (modo === 'entrar') { await D.entrar(email, senha); iniciar(); }
      else {
        const r = await D.criarConta(email, senha);
        if (r.session) iniciar();
        else { msg.className = 'login-msg ok'; msg.textContent = 'Conta criada! Abra o e-mail que enviamos para confirmar e depois entre aqui.'; }
      }
    } catch (err) { msg.textContent = traduz(err.message); }
  };
  $('#l-esqueci').onclick = async () => {
    const email = $('#l-email').value.trim(), msg = $('#l-msg');
    if (!email) { msg.className = 'login-msg'; msg.textContent = 'Escreva o seu e-mail acima e toque de novo em "Esqueci minha senha".'; return; }
    try { await D.recuperar(email); msg.className = 'login-msg ok'; msg.textContent = 'Enviamos um link para criar uma nova senha no seu e-mail.'; }
    catch (err) { msg.className = 'login-msg'; msg.textContent = traduz(err.message); }
  };
  $('#form-nova').onsubmit = async e => {
    e.preventDefault();
    try { await D.novaSenha($('#n-senha').value); $('#nova-senha').hidden = true; iniciar(); }
    catch (err) { $('#n-msg').textContent = traduz(err.message); }
  };
  function traduz(m) {
    if (/Invalid login/i.test(m)) return 'E-mail ou senha incorretos.';
    if (/registered/i.test(m)) return 'Esse e-mail já tem conta. Use a aba "Entrar".';
    if (/Email not confirmed/i.test(m)) return 'Confirme o seu e-mail pelo link que enviamos antes de entrar.';
    if (/Password should be/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
    if (/rate limit/i.test(m)) return 'Muitas tentativas. Espere alguns minutos e tente de novo.';
    return m;
  }

  /* ---------- campos ---------- */
  const pegar = k => k.split('.').reduce((o, p) => (o == null ? undefined : o[p]), conv.dados);
  function por(k, v) {
    const ps = k.split('.'); let o = conv.dados;
    ps.slice(0, -1).forEach(p => { if (o[p] == null) o[p] = []; o = o[p]; });
    o[ps[ps.length - 1]] = v;
  }
  function preencher() {
    $$('[data-k]').forEach(el => { const v = pegar(el.dataset.k); if (el.type === 'checkbox') el.checked = !!v; else el.value = v == null ? '' : v; });
    temas(); $$('.foto-campo').forEach(fotoCampo); cores(); musicaCampo(); listaSecoes(); botoesSecoes();
  }
  $$('[data-k]').forEach(el => el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', () => {
    por(el.dataset.k, el.type === 'checkbox' ? el.checked : el.value); mudou();
  }));

  function temas() {
    $('#temas').innerHTML = window.TEMAS.map(t => `<button type="button" class="tema${conv.dados.tema === t.id ? ' on' : ''}" data-t="${t.id}"><div class="tema-mini" style="background:${t.env.papel}"><i style="background:${t.env.aba}"></i><b style="background:${t.env.lacre}"></b></div><span>${t.nome}</span></button>`).join('');
    $$('.tema').forEach(b => b.onclick = () => {
      conv.dados.tema = b.dataset.t; const t = window.Convite.tema(b.dataset.t);
      conv.dados.trajeCores = [t.destaque, t.decor.a, t.env.papel]; cores();
      temas(); mudou(); abrirEnvelope();
    });
  }

  function fotoCampo(box) {
    const k = box.dataset.foto, url = pegar(k);
    box.innerHTML = url
      ? `<div class="foto-cheia"><img src="${window.Convite.esc(url)}" alt=""><button type="button">Remover</button></div>`
      : `<label class="foto-vazia">＋ Adicionar foto<input type="file" accept="image/*"></label>`;
    if (url) box.querySelector('button').onclick = () => { por(k, ''); fotoCampo(box); mudou(); };
    else box.querySelector('input').onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      box.innerHTML = '<div class="foto-vazia">Enviando...</div>';
      try { por(k, await D.enviarArquivo(f, 'fotos')); }
      catch (err) { alertar('Não foi possível enviar a foto: ' + err.message); }
      fotoCampo(box); mudou();
    };
  }

  function cores() {
    const cs = conv.dados.trajeCores || (conv.dados.trajeCores = []);
    $('#cores').innerHTML = cs.map((c, i) => `<input type="color" value="${c}" data-i="${i}" title="Toque para trocar; toque e segure para remover">`).join('') + (cs.length < 5 ? '<button type="button" title="Adicionar cor">＋</button>' : '') + (cs.length ? '<button type="button" data-tira title="Remover a última cor">−</button>' : '');
    $$('#cores input').forEach(el => el.oninput = () => { cs[el.dataset.i] = el.value; mudou(); });
    const mais = $('#cores button:not([data-tira])'); if (mais) mais.onclick = () => { cs.push('#d9c7a7'); cores(); mudou(); };
    const menos = $('#cores [data-tira]'); if (menos) menos.onclick = () => { cs.pop(); cores(); mudou(); };
  }

  function musicaCampo() {
    const box = $('#musica-campo'), d = conv.dados;
    box.innerHTML = d.musica
      ? `<div class="musica-atual">🎵 <span>${window.Convite.esc(d.musicaNome || 'Música escolhida')}</span><button type="button" class="link">Remover</button></div>`
      : `<label class="foto-vazia" style="height:64px">＋ Escolher música (MP3)<input type="file" accept="audio/mpeg,audio/mp3,audio/*" hidden></label>`;
    if (d.musica) box.querySelector('button').onclick = () => { d.musica = ''; d.musicaNome = ''; musicaCampo(); mudou(); };
    else box.querySelector('input').onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      if (f.size > 8 * 1024 * 1024) { alertar('A música precisa ter até 8 MB.'); return; }
      box.innerHTML = '<div class="foto-vazia" style="height:64px">Enviando...</div>';
      try { d.musica = await D.enviarArquivo(f, 'musica'); d.musicaNome = f.name; }
      catch (err) { alertar('Não foi possível enviar a música: ' + err.message); }
      musicaCampo(); mudou();
    };
  }

  /* ---------- seções (remover, adicionar, mudar de lugar) ---------- */
  const C = window.Convite, NOME = Object.fromEntries(C.SECOES.map(x => x));
  const ativa = id => conv.dados.secoes.includes(id);
  function adicionar(id) {
    if (ativa(id)) return;
    const ordem = C.SECOES.map(x => x[0]), l = conv.dados.secoes;
    let pos = 0; /* entra logo depois da seção ativa que vem antes dela na ordem padrão */
    for (let i = ordem.indexOf(id) - 1; i >= 0; i--) { const j = l.indexOf(ordem[i]); if (j >= 0) { pos = j + 1; break; } }
    l.splice(pos, 0, id); secoesMudaram(id);
  }
  function remover(id) { conv.dados.secoes = conv.dados.secoes.filter(x => x !== id); selecionada = null; secoesMudaram(); }
  function mover(id, dir) {
    const l = conv.dados.secoes, i = l.indexOf(id), j = i + dir;
    if (i < 0 || j < 0 || j >= l.length) return;
    [l[i], l[j]] = [l[j], l[i]]; secoesMudaram(id);
  }
  function secoesMudaram(foco) { listaSecoes(); botoesSecoes(); if (foco) selecionada = foco; previa(); mudou(); }
  function listaSecoes() {
    const l = conv.dados.secoes, fora = C.SECOES.map(x => x[0]).filter(id => !l.includes(id));
    $('#secoes').innerHTML = l.map((id, i) => `<div class="sec-linha"><span>${NOME[id]}</span><button type="button" data-m="-1" data-id="${id}" ${i ? '' : 'disabled'} title="Subir">↑</button><button type="button" data-m="1" data-id="${id}" ${i < l.length - 1 ? '' : 'disabled'} title="Descer">↓</button><button type="button" class="tira" data-r="${id}">Remover</button></div>`).join('') +
      (fora.length ? '<p class="dica" style="margin-top:12px">Fora do convite:</p>' + fora.map(id => `<div class="sec-linha fora"><span>${NOME[id]}</span><button type="button" class="poe" data-a="${id}">＋ Adicionar</button></div>`).join('') : '');
    $$('#secoes [data-m]').forEach(b => b.onclick = () => mover(b.dataset.id, Number(b.dataset.m)));
    $$('#secoes [data-r]').forEach(b => b.onclick = () => remover(b.dataset.r));
    $$('#secoes [data-a]').forEach(b => b.onclick = () => adicionar(b.dataset.a));
  }
  function botoesSecoes() {
    $$('.sec-bts').forEach(box => {
      const ids = box.dataset.secs.split(',');
      box.innerHTML = ids.map(id => ativa(id)
        ? `<button type="button" class="bt-tira" data-r="${id}">🗑 Remover ${ids.length > 1 ? '"' + NOME[id] + '" ' : ''}do convite</button>`
        : `<button type="button" class="bt-poe" data-a="${id}">＋ Adicionar ${ids.length > 1 ? '"' + NOME[id] + '" ' : ''}ao convite</button>`).join('');
      box.querySelectorAll('[data-r]').forEach(b => b.onclick = () => remover(b.dataset.r));
      box.querySelectorAll('[data-a]').forEach(b => b.onclick = () => adicionar(b.dataset.a));
      box.closest('.bloco').classList.toggle('desligado', !ids.some(ativa));
    });
  }
  function editar(id) {
    const bloco = $$('.bloco[data-secs]').find(b => b.dataset.secs.split(',').includes(id)); if (!bloco) return;
    bloco.open = true; $('#previa').classList.remove('on');
    setTimeout(() => bloco.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    bloco.classList.add('pisca'); setTimeout(() => bloco.classList.remove('pisca'), 1400);
  }

  /* barra de ações ao tocar numa seção da prévia */
  let selecionada = null;
  function marcarSelecao(sc) {
    sc.querySelectorAll('.sel').forEach(e => e.classList.remove('sel'));
    sc.querySelectorAll('.sec-barra').forEach(e => e.remove());
    if (!selecionada) return;
    const el = sc.querySelector(`[data-sec="${selecionada}"]`); if (!el) return;
    el.classList.add('sel');
    const l = conv.dados.secoes, i = l.indexOf(selecionada);
    el.insertAdjacentHTML('afterbegin', `<div class="sec-barra"><span>${NOME[selecionada]}</span><button type="button" data-ed>✏️ Editar</button><button type="button" data-sobe ${i ? '' : 'disabled'}>↑</button><button type="button" data-desce ${i < l.length - 1 ? '' : 'disabled'}>↓</button><button type="button" data-tira>🗑</button></div>`);
    const bar = el.querySelector('.sec-barra');
    bar.querySelector('[data-ed]').onclick = e => { e.stopPropagation(); editar(selecionada); };
    bar.querySelector('[data-sobe]').onclick = e => { e.stopPropagation(); mover(selecionada, -1); };
    bar.querySelector('[data-desce]').onclick = e => { e.stopPropagation(); mover(selecionada, 1); };
    bar.querySelector('[data-tira]').onclick = e => { e.stopPropagation(); remover(selecionada); };
  }
  function adicionarNaPrevia(sc) {
    const box = sc.querySelector('[data-add]'); if (!box) return;
    const fora = C.SECOES.map(x => x[0]).filter(id => !ativa(id));
    box.innerHTML = fora.length ? `<button type="button" class="add-bt">＋ Adicionar seção</button><div class="add-lista" hidden>${fora.map(id => `<button type="button" data-a="${id}">${NOME[id]}</button>`).join('')}</div>` : '';
    if (!fora.length) return;
    box.querySelector('.add-bt').onclick = e => { e.stopPropagation(); const lst = box.querySelector('.add-lista'); lst.hidden = !lst.hidden; };
    box.querySelectorAll('[data-a]').forEach(b => b.onclick = e => { e.stopPropagation(); adicionar(b.dataset.a); setTimeout(() => { const n = sc.querySelector(`[data-sec="${b.dataset.a}"]`); if (n) n.scrollIntoView({ block: 'center' }); }, 50); });
  }

  /* ---------- prévia ---------- */
  function previa() {
    const sc = $('#tela-scroll'), y = sc.scrollTop;
    sc.innerHTML = window.Convite.html(conv.dados, { preview: true });
    sc.querySelectorAll('.rv,.cv-foto,.cv-cena').forEach(e => e.classList.add('on'));
    window.Convite.contagem(sc);
    window.ConviteInteracao.rsvp(sc, conv.slug, conv.dados, { prevista: true });
    sc.querySelectorAll('a[href]').forEach(a => a.addEventListener('click', ev => { if (!a.href.startsWith('http')) ev.preventDefault(); }));
    sc.querySelectorAll('[data-sec]').forEach(el => el.addEventListener('click', ev => {
      if (ev.target.closest('a,button')) return;
      selecionada = selecionada === el.dataset.sec ? null : el.dataset.sec; marcarSelecao(sc);
    }));
    marcarSelecao(sc); adicionarNaPrevia(sc);
    sc.scrollTop = y;
  }
  function abrirEnvelope(auto = true) {
    const tela = $('#tela'); tela.querySelectorAll('.env').forEach(e => e.remove());
    tela.insertAdjacentHTML('beforeend', window.Convite.envelope(conv.dados));
    $('#tela-scroll').scrollTop = 0;
    window.Convite.ligarEnvelope(tela, () => {});
    if (auto) setTimeout(() => { const l = tela.querySelector('.env-lacre'); if (l) l.click(); }, 1400);
  }
  $('#bt-envelope').onclick = () => abrirEnvelope(false);
  $('#bt-previa').onclick = () => { $('#previa').classList.add('on'); previa(); };
  $('#bt-fechar-previa').onclick = () => $('#previa').classList.remove('on');

  /* ---------- salvar ---------- */
  function status(t, c = '') { const s = $('#status'); s.textContent = t; s.className = 'status ' + c; }
  function mudou() {
    clearTimeout(timerPrevia); timerPrevia = setTimeout(previa, 150);
    clearTimeout(timerSalvar); status('Salvando...', 'salvando'); timerSalvar = setTimeout(salvar, 1200);
  }
  async function salvar() {
    try { conv = { ...conv, ...(await D.salvar(conv)) }; status(D.ativo ? 'Salvo na sua conta' : 'Salvo neste navegador'); }
    catch (err) { status('Não salvou: ' + (/duplicate|unique/i.test(err.message) ? 'esse link já está em uso' : err.message), 'erro'); }
  }
  window.addEventListener('beforeunload', e => { if (timerSalvar && $('#status').classList.contains('salvando')) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- compartilhar ---------- */
  const linkDe = s => D.ativo ? `${location.origin}/c/${s}` : `${location.origin}/convite/ver?c=${s}`;
  $('#bt-compartilhar').onclick = () => {
    $('#modal-comp').hidden = false;
    $('#link-base').textContent = D.ativo ? location.host + '/c/' : location.host + '/convite/ver?c=';
    $('#slug').value = conv.slug; $('#publicado').checked = conv.publicado !== false; linksComp();
  };
  function linksComp() {
    const url = linkDe(conv.slug), d = conv.dados;
    const txt = `Você recebeu um convite especial 💌\n${d.noiva} & ${d.noivo} vão se casar!\nToque no link para abrir o convite:\n${url}`;
    $('#bt-zap').href = 'https://wa.me/?text=' + encodeURIComponent(txt); $('#bt-abrir').href = url;
  }
  $('#slug').oninput = () => {
    const v = $('#slug').value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-').slice(0, 60);
    if (v !== $('#slug').value) $('#slug').value = v;
    $('#slug-msg').textContent = v.length < 4 ? 'O link precisa ter pelo menos 4 letras.' : '';
    if (v.length >= 4) { conv.slug = v.replace(/^-|-$/g, ''); linksComp(); mudou(); }
  };
  $('#publicado').onchange = () => { conv.publicado = $('#publicado').checked; mudou(); };
  $('#bt-copiar').onclick = async () => {
    try { await navigator.clipboard.writeText(linkDe(conv.slug)); $('#bt-copiar').textContent = 'Link copiado!'; }
    catch (e) { $('#slug').select(); $('#bt-copiar').textContent = 'Copie o link acima'; }
    setTimeout(() => $('#bt-copiar').textContent = 'Copiar link', 2200);
  };
  $('#modal-comp').onclick = e => { if (e.target.id === 'modal-comp' || e.target.hasAttribute('data-fechar')) $('#modal-comp').hidden = true; };

  /* ---------- respostas ---------- */
  async function respostas() {
    const box = $('#respostas');
    try {
      const l = await D.respostas(conv.id), sim = l.filter(r => r.vai), pessoas = sim.reduce((s, r) => s + (r.pessoas || 0), 0);
      const e = window.Convite.esc;
      box.innerHTML = `<div class="resumo"><div><b>${pessoas}</b><span>pessoas confirmadas</span></div><div><b>${sim.length}</b><span>respostas "vou"</span></div><div><b>${l.length - sim.length}</b><span>não vão</span></div></div>` +
        (l.length ? l.map(r => `<div class="resp"><b>${e(r.nome)}</b><em class="${r.vai ? 'sim' : 'nao'}">${r.vai ? `vai · ${r.pessoas} ${r.pessoas > 1 ? 'pessoas' : 'pessoa'}` : 'não vai'}</em>${r.telefone ? ` · ${e(r.telefone)}` : ''}${r.mensagem ? `<p>"${e(r.mensagem)}"</p>` : ''}</div>`).join('') : '<p class="dica">Ainda não chegou nenhuma confirmação.</p>');
    } catch (err) { box.innerHTML = `<p class="dica">Não foi possível carregar: ${window.Convite.esc(err.message)}</p>`; }
  }
  $('#bloco-respostas').addEventListener('toggle', e => { if (e.target.open) respostas(); });

  function alertar(t) { status(t, 'erro'); }

  /* ---------- início ---------- */
  $('#bt-sair').onclick = async () => { await D.sair(); location.reload(); };
  async function iniciar() {
    $('#login').hidden = true; $('#app').hidden = false; $('#aviso-demo').hidden = D.ativo; $('#bt-sair').hidden = !D.ativo;
    status('Carregando...');
    try {
      conv = await D.meuConvite(); conv.dados = { ...window.CONVITE_PADRAO, ...conv.dados }; conv.dados.secoes = C.secoes(conv.dados);
      preencher(); previa(); abrirEnvelope(); status(D.ativo ? 'Salvo na sua conta' : 'Salvo neste navegador');
    } catch (err) { status('Erro ao carregar: ' + err.message, 'erro'); }
  }
  (async () => {
    if (/type=recovery/.test(location.hash)) { $('#nova-senha').hidden = false; return; }
    D.aoMudarSessao(ev => { if (ev === 'PASSWORD_RECOVERY') { $('#app').hidden = true; $('#nova-senha').hidden = false; } });
    const s = await D.sessao();
    if (s) iniciar(); else $('#login').hidden = false;
  })();
})();
