/* Planner CheckLove: mini tutorial que ilumina cada parte do app e explica em uma frase.
   Abre sozinho depois da mensagem de boas-vindas (uma vez) e pode ser revisto no Perfil. */
(function () {
  'use strict';
  var PL = window.PL, e = PL.esc;
  function celular() { return window.innerWidth <= 900; }
  function visivel(el) { if (!el) return null; var r = el.getBoundingClientRect(); return r.width && r.height ? el : null; }
  function porTexto(sel, txt) { var l = document.querySelectorAll(sel); for (var i = 0; i < l.length; i++) if (l[i].textContent.trim().indexOf(txt) === 0) return visivel(l[i]); return null; }
  function area(nome) { return celular() ? porTexto('#baixo a', nome) : visivel(document.querySelector('#menu a[data-area="' + nome + '"]')); }

  var PASSOS = [
    { titulo: 'Contagem regressiva', txt: 'Aqui fica quanto falta para o grande dia. Toque no ícone da foto, no canto do cartão, para colocar uma foto de vocês.', alvo: function () { return visivel(document.querySelector('#main .hero')); } },
    { titulo: 'Finanças', txt: 'Anote os gastos, veja o que já foi pago e quanto ainda sobra do orçamento. Os fornecedores também ficam aqui.', alvo: function () { return area('Finanças'); } },
    { titulo: 'Convidados', txt: 'Lista de convidados, confirmações, mapa de mesas, padrinhos, convites e cortejo.', alvo: function () { return area('Convidados'); } },
    { titulo: 'Cerimônia', txt: 'Civil, votos, playlist, chás e eventos e o mural de inspiração.', alvo: function () { return area('Cerimônia'); } },
    { titulo: 'Tarefas', txt: 'Gere o cronograma com os prazos calculados pela data do casamento e marque o que já foi feito.', alvo: function () { return visivel(document.querySelector('#main .abas a[data-to="tarefas"]')); } },
    { titulo: 'Avisos', txt: 'O sininho avisa quando uma tarefa ou um pagamento está perto do prazo.', alvo: function () { return visivel(document.querySelector(celular() ? '.sino-topo' : '.sino-lado')); } },
    { titulo: 'Bônus', txt: 'Seus bônus ficam aqui: o guia do casamento econômico, o enxoval, a lua de mel e o grupo de promoções.', alvo: function () { return visivel(document.querySelector(celular() ? '#topo-bonus' : '#rodape a[data-to="bonus"]')); } },
    { titulo: 'Perfil', txt: 'Aqui vocês mudam os dados do casamento, a moeda e a cor do planner. Pronto, agora é com vocês!', alvo: function () { return visivel(document.querySelector(celular() ? '#baixo a[data-to="perfil"]' : '#menu a[data-to="perfil"]')); } }
  ];
  var i = 0, capa, luz, balao, ativo = false;

  function fim() {
    if (!ativo) return; ativo = false;
    [capa, luz, balao].forEach(function (x) { if (x) x.remove(); });
    capa = luz = balao = null;
    document.documentElement.classList.remove('tour-on');
    window.removeEventListener('resize', posicionar); window.removeEventListener('scroll', posicionar, true);
    if (PL.s && !PL.s.tourVisto) { PL.s.tourVisto = true; PL.salvar(); }
  }
  function posicionar() {
    if (!ativo) return;
    var p = PASSOS[i], alvo = p.alvo(), m = 8, W = window.innerWidth, H = window.innerHeight;
    var bw = Math.min(340, W - 24);
    balao.style.width = bw + 'px';
    if (!alvo) {
      luz.style.cssText = 'top:' + (H / 2) + 'px;left:' + (W / 2) + 'px;width:0;height:0';
      balao.style.left = ((W - bw) / 2) + 'px'; balao.style.top = Math.max(12, (H - balao.offsetHeight) / 2) + 'px';
      balao.removeAttribute('data-lado'); return;
    }
    var r = alvo.getBoundingClientRect();
    luz.style.cssText = 'top:' + (r.top - m) + 'px;left:' + (r.left - m) + 'px;width:' + (r.width + m * 2) + 'px;height:' + (r.height + m * 2) + 'px';
    var bh = balao.offsetHeight, abaixo = H - r.bottom - m - 14, acima = r.top - m - 14;
    var lado = abaixo >= bh || abaixo >= acima ? 'baixo' : 'cima';
    var top = lado === 'baixo' ? r.bottom + m + 12 : r.top - m - 12 - bh;
    var left = Math.max(12, Math.min(r.left + r.width / 2 - bw / 2, W - bw - 12));
    if (!celular() && r.right < 280) { left = r.right + m + 14; top = Math.max(12, Math.min(r.top + r.height / 2 - bh / 2, H - bh - 12)); lado = 'dir'; }
    balao.style.left = left + 'px'; balao.style.top = Math.max(12, Math.min(top, H - bh - 12)) + 'px';
    balao.setAttribute('data-lado', lado);
    var seta = Math.max(18, Math.min(r.left + r.width / 2 - left, bw - 18));
    balao.style.setProperty('--seta', seta + 'px');
  }
  function mostrar() {
    var p = PASSOS[i], ult = i === PASSOS.length - 1;
    balao.innerHTML = '<div class="tour-passo">' + (i + 1) + ' de ' + PASSOS.length + '</div><h3>' + e(p.titulo) + '</h3><p>' + e(p.txt) + '</p>' +
      '<div class="tour-botoes"><button type="button" class="tour-pular" data-tour="pular">Pular</button><span></span>' +
      (i ? '<button type="button" class="btn sec peq" data-tour="voltar">Voltar</button>' : '') +
      '<button type="button" class="btn peq" data-tour="seguir">' + (ult ? 'Começar a usar' : 'Próximo') + '</button></div>';
    var alvo = p.alvo();
    if (alvo && !alvo.closest('.topo-movel,.abas-baixo,.lado')) alvo.scrollIntoView({ block: 'center' });
    balao.classList.remove('entra'); void balao.offsetWidth; balao.classList.add('entra');
    posicionar();
    var b = balao.querySelector('[data-tour="seguir"]'); if (b) b.focus({ preventScroll: true });
  }
  PL.tour = function (de) {
    if (ativo) return; if (de && !de.width) de = null;
    if (PL.rota() !== 'inicio') { PL.ir('inicio'); }
    document.body.classList.remove('menu-aberto');
    ativo = true; i = 0;
    document.documentElement.classList.add('tour-on');
    capa = document.createElement('div'); capa.className = 'tour-capa';
    luz = document.createElement('div'); luz.className = 'tour-luz';
    balao = document.createElement('div'); balao.className = 'tour-balao'; balao.setAttribute('role', 'dialog'); balao.setAttribute('aria-live', 'polite');
    if (de) { luz.style.cssText = 'top:' + de.top + 'px;left:' + de.left + 'px;width:' + de.width + 'px;height:' + de.height + 'px'; luz.classList.add('suave'); }
    document.body.appendChild(capa); document.body.appendChild(luz); document.body.appendChild(balao);
    balao.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-tour]'); if (!b) return;
      var a = b.getAttribute('data-tour');
      if (a === 'pular') fim();
      else if (a === 'voltar') { i--; mostrar(); }
      else if (i < PASSOS.length - 1) { i++; mostrar(); } else fim();
    });
    window.addEventListener('resize', posicionar); window.addEventListener('scroll', posicionar, true);
    setTimeout(function () { window.scrollTo(0, 0); mostrar(); }, de ? 60 : 120);
  };
  document.addEventListener('keydown', function (ev) {
    if (!ativo) return;
    if (ev.key === 'Escape') fim();
    else if (ev.key === 'ArrowRight') { var s = balao.querySelector('[data-tour="seguir"]'); if (s) s.click(); }
    else if (ev.key === 'ArrowLeft' && i) { i--; mostrar(); }
  });
  PL.acoes.tour = function () { PL.tour(); };

  /* convite antes do tour: a pessoa escolhe fazer agora ou ver depois no Perfil */
  var MAPA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/><path d="M5 16l.6 1.4 1.4.6-1.4.6L5 20l-.6-1.4L3 18l1.4-.6z"/></svg>';
  PL.convidarTour = function () {
    if (ativo || document.querySelector('.tc')) return;
    var c = document.createElement('div');
    c.className = 'tc';
    c.innerHTML = '<div class="tc-caixa" role="dialog" aria-modal="true" aria-labelledby="tc-t">' +
      '<div class="tc-ic">' + MAPA + '</div>' +
      '<h2 id="tc-t">Quer conhecer o app?</h2>' +
      '<p>Um tour rápido, de menos de 1 minuto, mostrando onde fica cada parte do planner.</p>' +
      '<div class="tc-botoes"><button type="button" class="btn sec" data-tc="depois">Agora não</button><button type="button" class="btn" data-tc="tour">Fazer o tour</button></div></div>';
    document.body.appendChild(c);
    /* as boas-vindas terminam de sumir por baixo do convite */
    document.querySelectorAll('.bv').forEach(function (bv) { bv.style.transition = 'opacity 1.1s ease'; bv.style.opacity = '0'; setTimeout(function () { bv.remove(); }, 1200); });
    requestAnimationFrame(function () { requestAnimationFrame(function () { c.classList.add('in'); }); });
    setTimeout(function () { var b = c.querySelector('[data-tc="tour"]'); if (b) b.focus({ preventScroll: true }); }, 700);
    function sair(depois) {
      c.classList.remove('in'); c.classList.add('out');
      setTimeout(function () { if (depois) depois(); }, 260); setTimeout(function () { c.remove(); }, 700);
    }
    c.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-tc]'); if (!b) return;
      if (b.getAttribute('data-tc') === 'tour') {
        var r = c.querySelector('.tc-caixa').getBoundingClientRect();
        sair(function () { PL.tour(r); });
      } else {
        PL.s.tourVisto = true; PL.salvar();
        sair();
      }
    });
  };
})();
