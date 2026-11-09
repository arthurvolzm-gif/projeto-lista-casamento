/* Planner CheckLove: convite para instalar o app na tela inicial do celular.
   Android (Chrome e afins): botão que abre a instalação do próprio navegador.
   iPhone: passo a passo do Safari (Compartilhar → Adicionar à Tela de Início).
   Aparece na tela de login e de novo logo depois de entrar no app, enquanto o app não estiver instalado. */
(function () {
  'use strict';
  var ua = navigator.userAgent || '';
  var IOS = /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var ANDROID = /android/i.test(ua);
  var SAFARI = IOS && /safari/i.test(ua) && !/crios|fxios|edgios|opios|gsa\/|instagram|fban|fbav|line\//i.test(ua);
  var promptAndroid = null, aberto = null;

  function instalado() {
    return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  }
  function celular() { return IOS || ANDROID; }
  function jaMostrou(onde) { try { return sessionStorage.getItem('checklove_instalar_' + onde) === '1'; } catch (x) { return false; } }
  function marcar(onde) { try { sessionStorage.setItem('checklove_instalar_' + onde, '1'); } catch (x) {} }

  /* o service worker na raiz controla o /app (é o que o Android pede para oferecer a instalação) */
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw-app.js', { scope: '/app' }).catch(function () {}); });
  }
  window.addEventListener('beforeinstallprompt', function (ev) {
    ev.preventDefault(); promptAndroid = ev;
    if (aberto) pintar(aberto); /* o botão de instalar aparece se o convite já estiver aberto */
  });
  window.addEventListener('appinstalled', function () {
    promptAndroid = null; fechar();
    if (window.PL && PL.toast) PL.toast('App instalado! Agora é só abrir pela tela inicial.');
  });

  var IC = {
    compartilhar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m8 7 4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>',
    adicionar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M12 8.5v7M8.5 12h7"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>',
    celular: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>'
  };

  function passos() {
    if (IOS && !SAFARI) return '<ol class="inst-passos"><li><span class="inst-n">1</span><span>Copie o link e abra no <b>Safari</b>. A instalação no iPhone é feita por ele.</span></li></ol>' +
      '<button type="button" class="btn" data-inst="copiar">Copiar o link do app</button>';
    if (IOS) return '<ol class="inst-passos">' +
      '<li><span class="inst-n">1</span><span>Toque em <b>Compartilhar</b> <i class="inst-ic">' + IC.compartilhar + '</i> na barra do Safari.</span></li>' +
      '<li><span class="inst-n">2</span><span>Role as opções e toque em <b>Adicionar à Tela de Início</b> <i class="inst-ic">' + IC.adicionar + '</i></span></li>' +
      '<li><span class="inst-n">3</span><span>Toque em <b>Adicionar</b>. Pronto, o CheckLove fica junto dos seus apps.</span></li></ol>';
    if (promptAndroid) return '<button type="button" class="btn" data-inst="instalar">Instalar o app</button>';
    return '<ol class="inst-passos">' +
      '<li><span class="inst-n">1</span><span>Toque no menu <i class="inst-ic">' + IC.menu + '</i> no canto de cima do navegador.</span></li>' +
      '<li><span class="inst-n">2</span><span>Toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</span></li></ol>';
  }
  function pintar(el) {
    el.innerHTML = '<div class="inst-caixa" role="dialog" aria-modal="true" aria-labelledby="inst-t">' +
      '<div class="inst-topo"><img src="/app/icones/icone-192.png" alt="" width="56" height="56"><div><b id="inst-t">Instale o CheckLove no seu celular</b>' +
      '<small>Abra o planner direto da tela inicial, como um aplicativo, sem precisar procurar o link.</small></div></div>' +
      passos() +
      '<button type="button" class="inst-depois" data-inst="depois">Agora não</button></div>';
  }
  function mostrar(onde) {
    if (aberto || instalado() || !celular() || jaMostrou(onde)) return;
    marcar(onde);
    var el = document.createElement('div'); el.className = 'inst';
    pintar(el); aberto = el;
    /* fica fora do <body>: a tela de login troca o body inteiro quando a pessoa muda de modo */
    document.documentElement.appendChild(el);
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('in'); }); });
  }
  function fechar() {
    var el = aberto; if (!el) return; aberto = null;
    el.classList.remove('in'); setTimeout(function () { el.remove(); }, 350);
  }
  document.addEventListener('click', function (ev) {
    if (!aberto) return;
    if (ev.target === aberto) { fechar(); return; }
    var b = ev.target.closest('[data-inst]'); if (!b) return;
    var a = b.getAttribute('data-inst');
    if (a === 'depois') fechar();
    else if (a === 'instalar' && promptAndroid) {
      var p = promptAndroid; promptAndroid = null;
      p.prompt(); p.userChoice.then(function (r) { if (r && r.outcome === 'accepted') fechar(); else if (aberto) pintar(aberto); });
    } else if (a === 'copiar') {
      var url = location.origin + '/app';
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { b.textContent = 'Link copiado! Agora abra no Safari'; })
        .catch(function () { b.textContent = url; });
    }
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') fechar(); });

  /* 1. tela de login: logo depois que a página abre */
  setTimeout(function () { if (document.querySelector('[data-login]')) mostrar('login'); }, 1400);

  /* 2. logo depois de entrar na tela inicial do app, quando as boas-vindas e o tour já terminaram */
  function ocupado() { return document.querySelector('.ob, .bv, .tc, .tour-balao, .aprovado, .avisos') || document.documentElement.classList.contains('tour-on'); }
  function aguardarInicio(tentativas) {
    if (instalado() || jaMostrou('inicio') || tentativas > 300) return;
    var naInicial = window.PL && PL.rota && PL.rota() === 'inicio' && document.querySelector('#main');
    if (naInicial && !ocupado()) { mostrar('inicio'); return; }
    setTimeout(function () { aguardarInicio(tentativas + 1); }, 1200);
  }
  var PL = window.PL;
  if (PL && PL.iniciar) {
    var iniciarOriginal = PL.iniciar;
    PL.iniciar = function () {
      var r = iniciarOriginal.apply(this, arguments);
      fechar(); /* se o convite do login ainda estava aberto, sai; volta já na tela inicial */
      setTimeout(function () { aguardarInicio(0); }, 2500);
      return r;
    };
  }
})();
