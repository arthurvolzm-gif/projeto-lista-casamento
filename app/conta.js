/* Planner CheckLove: login com e-mail e senha (Supabase) e sincronização dos dados na conta */
(function () {
  'use strict';
  var PL = window.PL, e = PL.esc;
  var C = window.CONVITE_CONFIG || {};
  var ATIVO = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY && window.supabase);
  var sb = ATIVO ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY) : null;
  var TABELA = 'planner', ANTIGA = 'checklove_planner_v1';
  var usuario = null, tNuvem = null, iniciado = false, abrindo = false;

  function traduzir(err) {
    var m = (err && (err.message || err.error_description)) || '';
    if (/invalid login/i.test(m)) return 'E-mail ou senha incorretos.';
    if (/already registered|already been registered/i.test(m)) return 'Já existe uma conta com esse e-mail. Use "Entrar".';
    if (/not confirmed/i.test(m)) return 'Confirme o e-mail pelo link que enviamos antes de entrar.';
    if (/at least 6|password should be/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
    if (/rate limit|too many/i.test(m)) return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.';
    if (/invalid email|valid email/i.test(m)) return 'Esse e-mail não parece válido.';
    if (/failed to fetch|network/i.test(m)) return 'Sem conexão. Confira a internet e tente de novo.';
    return 'Não deu certo: ' + m;
  }

  /* ---------- tela de entrada ---------- */
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
      '</div></div></main>';
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
        else tela('entrar', 'Conta criada. Abra o e-mail que enviamos para ' + email + ' e clique no link para confirmar. Depois é só entrar.');
      } else if (modo === 'esqueci') {
        var q = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/app' }); if (q.error) throw q.error;
        tela('entrar', 'Se existir uma conta com ' + email + ', o link para criar uma senha nova chega em alguns minutos. Confira também o spam.');
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
  async function abrir(sessao, msg) {
    if (!sessao) { tela('entrar'); return; }
    if (abrindo || (iniciado && usuario && usuario.id === sessao.user.id)) return;
    abrindo = true;
    usuario = sessao.user; PL.conta = { email: usuario.email };
    PL.usarChave(ANTIGA + '_' + usuario.id);
    document.body.innerHTML = '<main class="entrada"><div class="entrada-card"><p class="nota">Carregando seu planner...</p></div></main>';
    try {
      var r = await sb.from(TABELA).select('dados, atualizado_em').eq('user_id', usuario.id).maybeSingle();
      if (r.error) throw r.error;
      if (r.data && r.data.dados && r.data.dados.perfil) {
        PL.s = PL.normalizar(r.data.dados);
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
    PL.rodapeLado = '<div class="lado-conta"><span title="' + e(usuario.email) + '">' + e(usuario.email) + '</span><button type="button" data-act="sair">Sair</button></div>';
    if (/access_token|type=/.test(location.hash)) history.replaceState(null, '', location.pathname + '#inicio');
    abrindo = false;
    PL.iniciar();
    if (msg) PL.toast(msg);
  }
  async function enviar() {
    if (!usuario) return;
    var r = await sb.from(TABELA).upsert({ user_id: usuario.id, dados: PL.s, atualizado_em: new Date().toISOString() });
    if (r.error) throw r.error;
  }
  PL.aoSalvar = function () {
    if (!usuario || !ATIVO) return;
    clearTimeout(tNuvem);
    tNuvem = setTimeout(function () {
      enviar().then(function () { PL.contaErro = false; }, function () { PL.contaErro = true; PL.toast('Sem conexão com a conta. As mudanças estão salvas neste aparelho e sobem quando a internet voltar.'); });
    }, 1500);
  };
  window.addEventListener('online', function () { if (PL.contaErro && PL.aoSalvar) PL.aoSalvar(); });
  window.addEventListener('pagehide', function () { if (usuario && tNuvem) { clearTimeout(tNuvem); enviar().catch(function () {}); } });

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
