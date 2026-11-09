/* Planner CheckLove: login com e-mail e senha (Supabase) e sincronização dos dados na conta */
(function () {
  'use strict';
  var PL = window.PL, e = PL.esc;
  var C = window.CONVITE_CONFIG || {};
  var ATIVO = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY && window.supabase);
  var sb = ATIVO ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY) : null;
  var TABELA = 'planner', BUCKET = 'planner', ANTIGA = 'checklove_planner_v1';
  var usuario = null, tNuvem = null, iniciado = false, abrindo = false, donoId = null, ultimo = null;

  function traduzir(err) {
    var m = (err && (err.message || err.error_description)) || '';
    if (/invalid login/i.test(m)) return 'E-mail ou senha incorretos.';
    if (/already registered|already been registered/i.test(m)) return 'Já existe uma conta com esse e-mail. Use "Entrar".';
    if (/not confirmed/i.test(m)) return 'Confirme o e-mail pelo link que enviamos antes de entrar.';
    if (/at least 6|password should be/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
    if (/rate limit|too many/i.test(m)) return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.';
    if (/invalid email|valid email/i.test(m)) return 'Esse e-mail não parece válido.';
    if (/failed to fetch|network/i.test(m)) return 'Sem conexão. Confira a internet e tente de novo.';
    return PL.t('Não deu certo: {m}', { m: m });
  }

  /* ---------- tela de entrada ---------- */
  function idiomasEntrada() {
    var I = window.PL_I18N; if (!I) return '';
    return '<div class="entrada-idiomas" data-notr>' + Object.keys(I.langs).map(function (k) {
      var l = I.langs[k]; return '<button type="button" data-idioma="' + k + '" class="' + (I.idioma === k ? 'on' : '') + '" lang="' + l.loc + '" title="' + e(l.nome) + '"><span aria-hidden="true">' + l.band + '</span> ' + k.toUpperCase() + '</button>';
    }).join('') + '</div>';
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-idioma]'); if (b && window.PL_I18N) window.PL_I18N.mudar(b.getAttribute('data-idioma'));
  });
  function tela(modo, aviso, erro) {
    var t = {
      entrar: ['Entrar no planner', 'Use o e-mail e a senha da sua conta.', 'Entrar'],
      criar: ['Criar sua conta', 'Seus dados ficam salvos na conta e aparecem em qualquer aparelho.', 'Criar conta'],
      esqueci: ['Recuperar a senha', 'Enviamos um link para você criar uma senha nova.', 'Enviar link'],
      nova: ['Criar senha nova', 'Escolha a nova senha da sua conta.', 'Salvar senha']
    }[modo];
    document.body.innerHTML = '<main class="entrada"><div class="entrada-card">' +
      '<div class="marca"><div><b>Check<i>Love</i></b><small>Planner do casamento</small></div></div>' +
      '<h1>' + t[0] + '</h1><p class="nota">' + t[1] + '</p>' +
      (aviso ? '<div class="aviso ok">' + e(aviso) + '</div>' : '') + (erro ? '<div class="aviso erro" role="alert">' + e(erro) + '</div>' : '') +
      '<form data-login="' + modo + '" class="entrada-form">' +
      (modo !== 'nova' ? '<label class="campo">E-mail<input name="email" type="email" autocomplete="email" required></label>' : '') +
      (modo !== 'esqueci' ? '<label class="campo">' + (modo === 'nova' ? 'Nova senha' : 'Senha') + '<input name="senha" type="password" minlength="6" autocomplete="' + (modo === 'entrar' ? 'current-password' : 'new-password') + '" required></label>' : '') +
      '<button class="btn" type="submit">' + t[2] + '</button></form>' +
      '<div class="entrada-links">' +
      (modo === 'entrar' ? '<button type="button" data-modo="esqueci">Esqueci minha senha</button><span>Ainda não tem conta? <button type="button" data-modo="criar">Criar conta</button></span>' : '') +
      (modo === 'criar' ? '<span>Já tem conta? <button type="button" data-modo="entrar">Entrar</button></span>' : '') +
      (modo === 'esqueci' ? '<button type="button" data-modo="entrar">Voltar para entrar</button>' : '') +
      '</div>' + idiomasEntrada() + '</div></main>';
    var c = document.querySelector('.entrada-form input'); if (c) c.focus();
  }

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-modo]'); if (b) tela(b.getAttribute('data-modo'));
  });
  document.addEventListener('submit', async function (ev) {
    var f = ev.target, modo = f.getAttribute('data-login'); if (!modo) return;
    ev.preventDefault();
    var bt = f.querySelector('button[type=submit]'), email = f.email ? f.email.value.trim() : '', senha = f.senha ? f.senha.value : '';
    bt.disabled = true; bt.textContent = 'Aguarde...';
    try {
      if (modo === 'entrar') {
        var r = await sb.auth.signInWithPassword({ email: email, password: senha }); if (r.error) throw r.error;
        await abrir(r.data.session);
      } else if (modo === 'criar') {
        var c = await sb.auth.signUp({ email: email, password: senha, options: { emailRedirectTo: location.origin + '/app' } }); if (c.error) throw c.error;
        if (c.data.session) await abrir(c.data.session);
        else tela('entrar', PL.t('Conta criada. Abra o e-mail que enviamos para {email} e clique no link para confirmar. Depois é só entrar.', { email: email }));
      } else if (modo === 'esqueci') {
        var q = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/app' }); if (q.error) throw q.error;
        tela('entrar', PL.t('Se existir uma conta com {email}, o link para criar uma senha nova chega em alguns minutos. Confira também o spam.', { email: email }));
      } else if (modo === 'nova') {
        var n = await sb.auth.updateUser({ password: senha }); if (n.error) throw n.error;
        var s = await sb.auth.getSession(); await abrir(s.data.session, 'Senha alterada.');
      }
    } catch (err) {
      tela(modo, '', traduzir(err));
      var i = document.querySelector('.entrada-form input[name=email]'); if (i) i.value = email;
    }
  });

  /* ---------- dados na conta ---------- */
  /* escolhe o planner: o próprio, se já tem dados; senão um compartilhado com este e-mail */
  async function escolherLinha() {
    var r = await sb.from(TABELA).select('user_id, dados, membros, dono_email, atualizado_em');
    if (r.error) throw r.error;
    var linhas = r.data || [], meu = linhas.find(function (x) { return x.user_id === usuario.id; });
    var outro = linhas.find(function (x) { return x.user_id !== usuario.id; });
    if (meu && meu.dados && meu.dados.perfil && PL.temDados(PL.normalizar(meu.dados))) return meu;
    return outro || meu || null;
  }
  /* ---------- acesso: só entra quem comprou (compras vindas do webhook da Zuptos) ---------- */
  var LOJA = 'https://meuchecklove.vercel.app/', tAcesso = null;
  /* renovação quando o plano vence: plano mensal (e a página com todos os planos) */
  var CHECKOUT_MENSAL = 'https://app.zuptos.com.br/checkout/721ed651c9903949', PLANOS = 'https://meuchecklove.vercel.app/pagina/#planos';
  async function buscarAcessos() {
    var cache = 'checklove_acesso_' + usuario.id;
    var r = await sb.rpc('meus_acessos');
    if (r.error) {
      /* função ainda não criada no Supabase: o app segue liberado até rodar o app/acessos.sql */
      if (/PGRST202|42883|could not find the function/i.test((r.error.code || '') + ' ' + (r.error.message || ''))) return { livre: true, lista: [] };
      try { var c = JSON.parse(localStorage.getItem(cache) || 'null'); if (c) return { lista: c, offline: true }; } catch (x) {}
      throw r.error;
    }
    var lista = (r.data || []).map(function (x) { return typeof x === 'string' ? x : (x && (x.meus_acessos || Object.values(x)[0])) || ''; });
    try { localStorage.setItem(cache, JSON.stringify(lista)); } catch (x) {}
    return { lista: lista };
  }
  function telaPendente(email, erro) {
    clearTimeout(tAcesso);
    document.body.innerHTML = '<main class="entrada"><div class="entrada-card acesso-pend">' +
      '<div class="marca"><div><b>Check<i>Love</i></b><small>Planner do casamento</small></div></div>' +
      '<div class="acesso-ic"><span></span></div>' +
      '<h1>Estamos confirmando sua compra</h1>' +
      '<p class="nota">Ainda não encontramos uma compra aprovada para <b>' + e(email) + '</b>.</p>' +
      '<ul class="acesso-dicas"><li>Se você acabou de pagar, a liberação costuma levar alguns minutos. Pix e cartão são mais rápidos; boleto pode levar até 3 dias úteis.</li>' +
      '<li>Entre com o <b>mesmo e-mail</b> que você usou na compra.</li></ul>' +
      (erro ? '<div class="aviso erro" role="alert">' + e(erro) + '</div>' : '') +
      '<button type="button" class="btn" data-acesso="verificar">Verificar de novo</button>' +
      '<button type="button" class="btn sec" data-acesso="sair">Entrar com outro e-mail</button>' +
      '<p class="nota acesso-loja">Ainda não comprou? <a href="' + LOJA + '">Conheça o CheckLove</a></p></div></main>';
    /* confere sozinho de tempos em tempos enquanto a pessoa espera */
    tAcesso = setTimeout(function () { verificarDeNovo(true); }, 20000);
  }
  /* plano vencido: os dados continuam na conta; a pessoa renova pelo plano mensal */
  function telaExpirou(email, fim) {
    clearTimeout(tAcesso);
    var data = /^\d{4}-\d{2}-\d{2}$/.test(fim || '') ? fim.split('-').reverse().join('/') : '';
    document.body.innerHTML = '<main class="entrada"><div class="entrada-card acesso-pend acesso-fim">' +
      '<div class="marca"><div><b>Check<i>Love</i></b><small>Planner do casamento</small></div></div>' +
      '<div class="acesso-ic fim"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>' +
      '<h1>Seu acesso terminou</h1>' +
      '<p class="nota">O plano da conta <b>' + e(email) + '</b> venceu' + (data ? ' em <b>' + data + '</b>' : '') + '.</p>' +
      '<ul class="acesso-dicas"><li>Seus dados continuam salvos: tarefas, gastos, convidados e tudo o que vocês já fizeram.</li>' +
      '<li>Assim que renovar, o planner volta exatamente de onde parou.</li></ul>' +
      '<div class="acesso-plano"><span>Plano Mensal</span><b>R$ 29,90<small>/mês</small></b></div>' +
      '<a class="btn" href="' + CHECKOUT_MENSAL + '">Continuar com o Plano Mensal</a>' +
      '<button type="button" class="btn sec" data-acesso="verificar">Já renovei, verificar</button>' +
      '<p class="nota acesso-loja"><a href="' + PLANOS + '">Ver os outros planos</a> · <button type="button" data-acesso="sair">Entrar com outro e-mail</button></p></div></main>';
  }
  async function verificarDeNovo(silencioso) {
    var s = await sb.auth.getSession(); var sessao = s.data.session;
    if (!sessao) { tela('entrar'); return; }
    var b = document.querySelector('[data-acesso="verificar"]'); if (b && !silencioso) { b.disabled = true; b.textContent = 'Verificando...'; }
    usuario = null; abrindo = false; iniciado = false;
    abrir(sessao);
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-acesso]'); if (!b) return;
    if (b.getAttribute('data-acesso') === 'verificar') verificarDeNovo(false);
    else { clearTimeout(tAcesso); sb.auth.signOut().then(function () { location.hash = ''; location.reload(); }); }
  });
  /* mensagem de login aprovado: aparece uma vez por conta */
  function avisoAprovado() {
    if (PL.s.acessoAprovado) return;
    PL.s.acessoAprovado = new Date().toISOString(); PL.salvar();
    var m = document.createElement('div'); m.className = 'aprovado'; m.setAttribute('role', 'status');
    m.innerHTML = '<span class="aprovado-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>' +
      '<span><b>Login aprovado!</b><small>Sua compra foi confirmada e o seu planner está liberado.</small></span>';
    document.body.appendChild(m);
    requestAnimationFrame(function () { m.classList.add('in'); });
    setTimeout(function () { m.classList.remove('in'); setTimeout(function () { m.remove(); }, 500); }, 5000);
  }

  async function abrir(sessao, msg) {
    if (!sessao) { tela('entrar'); return; }
    if (abrindo || (iniciado && usuario && usuario.id === sessao.user.id)) return;
    abrindo = true;
    usuario = sessao.user;
    var email = (usuario.email || '').toLowerCase();
    PL.conta = { email: email, dono: true, membros: [] };
    donoId = usuario.id;
    PL.usarChave(ANTIGA + '_' + usuario.id);
    document.body.innerHTML = '<main class="entrada"><div class="entrada-card"><p class="nota">Carregando seu planner...</p></div></main>';
    var acesso;
    try { acesso = await buscarAcessos(); }
    catch (x) { abrindo = false; usuario = null; telaPendente(email, 'Não deu para confirmar a compra agora. Confira a internet e toque em "Verificar de novo".'); return; }
    if (!acesso.livre && acesso.lista.indexOf('planner') < 0) {
      abrindo = false; usuario = null;
      var venc = acesso.lista.filter(function (x) { return x.indexOf('planner_expirou:') === 0; })[0];
      if (venc) telaExpirou(email, venc.split(':')[1]); else telaPendente(email);
      return;
    }
    clearTimeout(tAcesso);
    PL.acessos = { livre: !!acesso.livre, convite: acesso.lista.indexOf('convite') >= 0, album: acesso.lista.indexOf('album') >= 0 };
    try {
      var linha = await escolherLinha();
      if (linha && linha.dados && linha.dados.perfil) {
        donoId = linha.user_id; ultimo = linha.atualizado_em;
        PL.conta.dono = linha.user_id === usuario.id; PL.conta.membros = linha.membros || []; PL.conta.donoEmail = linha.dono_email || '';
        PL.s = PL.normalizar(linha.dados);
      } else {
        /* primeira entrada: aproveita o que já estava salvo neste aparelho antes do login */
        if (!PL.temDados()) {
          try { var antigo = JSON.parse(localStorage.getItem(ANTIGA) || 'null'); if (antigo && antigo.perfil) PL.s = PL.normalizar(antigo); } catch (x) {}
        }
        await enviar();
      }
    } catch (err) {
      PL.contaErro = true;
      setTimeout(function () { PL.toast('Não foi possível buscar os dados da conta agora. Você está vendo o que está salvo neste aparelho.'); }, 600);
    }
    PL.salvar(true);
    iniciado = true;
    PL.rodapeLado = '<div class="lado-conta"><span title="' + e(email) + '">' + e(email) + '</span><button type="button" data-act="sair">Sair</button></div>';
    if (/access_token|type=/.test(location.hash)) history.replaceState(null, '', location.pathname + '#inicio');
    abrindo = false;
    PL.iniciar();
    if (!PL.acessos.livre) avisoAprovado();
    if (msg) PL.toast(msg);
    subirFotosAntigas();
  }
  async function enviar() {
    if (!usuario) return;
    var agora = new Date().toISOString(), r;
    if (donoId === usuario.id) r = await sb.from(TABELA).upsert({ user_id: usuario.id, dados: PL.s, dono_email: (usuario.email || '').toLowerCase(), atualizado_em: agora });
    else r = await sb.from(TABELA).update({ dados: PL.s, atualizado_em: agora }).eq('user_id', donoId);
    if (r.error) throw r.error;
    ultimo = agora;
  }
  PL.aoSalvar = function () {
    if (!usuario || !ATIVO) return;
    clearTimeout(tNuvem);
    tNuvem = setTimeout(function () {
      tNuvem = null;
      enviar().then(function () { PL.contaErro = false; }, function () { var jaAvisou = PL.contaErro; PL.contaErro = true; if (!jaAvisou) PL.toast('Sem conexão com a conta. As mudanças estão salvas neste aparelho e sobem quando a internet voltar.'); });
    }, 1500);
  };
  PL.salvarMembros = async function (lista) {
    var r = await sb.from(TABELA).update({ membros: lista }).eq('user_id', usuario.id);
    if (r.error) throw r.error;
    PL.conta.membros = lista;
  };
  /* quando a pessoa volta para o app, busca o que o outro mudou */
  async function atualizarDeFora() {
    if (!usuario || !iniciado || tNuvem || document.hidden) return;
    try {
      var r = await sb.from(TABELA).select('dados, atualizado_em').eq('user_id', donoId).maybeSingle();
      if (r.error || !r.data || !r.data.atualizado_em || r.data.atualizado_em === ultimo) return;
      if (ultimo && new Date(r.data.atualizado_em) <= new Date(ultimo)) return;
      ultimo = r.data.atualizado_em; PL.s = PL.normalizar(r.data.dados); PL.salvar(true);
      var ativo = document.activeElement; if (ativo && /INPUT|TEXTAREA|SELECT/.test(ativo.tagName)) return;
      PL.render(true); PL.toast('Planner atualizado com as últimas mudanças.');
    } catch (x) {}
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) atualizarDeFora(); });
  setInterval(atualizarDeFora, 60000);
  window.addEventListener('online', function () { if (PL.contaErro && PL.aoSalvar) PL.aoSalvar(); });
  window.addEventListener('pagehide', function () { if (usuario && tNuvem) { clearTimeout(tNuvem); enviar().catch(function () {}); } });

  /* ---------- fotos do mural no armazenamento do Supabase ---------- */
  PL.nuvemFoto = function (dataUrl) {
    if (!usuario || !ATIVO) return Promise.reject(new Error('sem conta'));
    var caminho = donoId + '/' + PL.uid() + '.jpg';
    return fetch(dataUrl).then(function (r) { return r.blob(); }).then(function (blob) {
      return sb.storage.from(BUCKET).upload(caminho, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
    }).then(function (r) {
      if (r.error) throw r.error;
      return { url: sb.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl, path: caminho };
    });
  };
  PL.apagarFoto = function (path) { if (usuario && path) sb.storage.from(BUCKET).remove([path]).catch(function () {}); };
  PL.aoRemover = function (p, item) {
    if (p !== 'moodboard' || !item.path || !usuario) return;
    /* espera o tempo do "desfazer" antes de apagar o arquivo */
    setTimeout(function () {
      if (PL.s.moodboard.some(function (x) { return x.id === item.id; })) return;
      sb.storage.from(BUCKET).remove([item.path]).catch(function () {});
    }, 8000);
  };
  async function subirFotosAntigas() {
    var locais = PL.s.moodboard.filter(function (x) { return /^data:/.test(x.src || ''); });
    if (!locais.length) return;
    var mudou = false;
    for (var i = 0; i < locais.length; i++) {
      try { var r = await PL.nuvemFoto(locais[i].src); locais[i].src = r.url; locais[i].path = r.path; mudou = true; } catch (x) { break; }
    }
    if (mudou) PL.salvar();
  }

  /* materiais em PDF no bucket privado "materiais": link temporário só para quem está logado */
  PL.material = async function (arquivo) {
    if (!usuario || !ATIVO) throw new Error('sem conta');
    var r = await sb.storage.from('materiais').createSignedUrl(arquivo, 600, { download: arquivo });
    if (r.error || !r.data) throw (r.error || new Error('sem link'));
    var a = document.createElement('a'); a.href = r.data.signedUrl; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
  };

  PL.acoes.sair = async function () {
    clearTimeout(tNuvem);
    try { await enviar(); } catch (x) {}
    await sb.auth.signOut();
    location.hash = ''; location.reload();
  };

  /* ---------- início ---------- */
  window.PLConta = {
    iniciar: async function () {
      if (!ATIVO) { PL.iniciar(); return; }
      var recuperando = /type=recovery/.test(location.hash);
      sb.auth.onAuthStateChange(function (evento, sessao) {
        if (evento === 'PASSWORD_RECOVERY') { recuperando = true; tela('nova'); }
        else if (evento === 'SIGNED_IN' && !iniciado && !recuperando && sessao) abrir(sessao);
      });
      var s = await sb.auth.getSession();
      if (recuperando) { tela('nova'); return; }
      if (s.data.session) abrir(s.data.session); else tela('entrar');
    }
  };
})();
