/* Planner CheckLove: sininho de avisos no topo (tarefas, pagamentos, confirmações e a data).
   Os avisos são calculados na hora a partir do planner; o numerinho conta só os que a pessoa ainda não viu. */
(function () {
  'use strict';
  var PL = window.PL, e = PL.esc;
  var CHAVE = 'checklove_avisos_vistos';
  var SINO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';
  var painel = null;

  function dif(iso) { return Math.round((new Date(iso + 'T12:00:00') - new Date(PL.hoje() + 'T12:00:00')) / 864e5); }
  function quando(n) { return n === 0 ? 'hoje' : n === 1 ? 'amanhã' : 'em ' + n + ' dias'; }
  function plural(n, um, varios) { return n + ' ' + (n === 1 ? um : varios); }

  PL.avisos = function () {
    var s = PL.s, hoje = PL.hoje(), r = [];
    if (!s) return r;
    var pend = s.tarefas.filter(function (x) { return !x.ok && x.prazo; });
    var atr = pend.filter(function (x) { return x.prazo < hoje; });
    if (atr.length) r.push({ id: 'tarefas-atrasadas-' + atr.length, tipo: 'erro', ic: 'tarefa', ir: 'tarefas', titulo: plural(atr.length, 'tarefa atrasada', 'tarefas atrasadas'), sub: atr.length === 1 ? atr[0].t : 'A mais antiga: ' + atr.sort(function (a, b) { return a.prazo.localeCompare(b.prazo); })[0].t });
    var logo = pend.filter(function (x) { var d = dif(x.prazo); return d >= 0 && d <= 7; }).sort(function (a, b) { return a.prazo.localeCompare(b.prazo); });
    if (logo.length) r.push({ id: 'tarefas-semana-' + logo.map(function (x) { return x.id; }).join('.'), tipo: 'alerta', ic: 'cal', ir: 'tarefas', titulo: plural(logo.length, 'tarefa vence', 'tarefas vencem') + ' nesta semana', sub: logo[0].t + ' · ' + quando(dif(logo[0].prazo)) });

    var aPagar = s.gastos.filter(function (g) { return g.venc && PL.num(g.valor) > PL.num(g.pago); });
    var pAtr = aPagar.filter(function (g) { return g.venc < hoje; });
    if (pAtr.length) r.push({ id: 'pag-atrasados-' + pAtr.map(function (g) { return g.id + g.venc; }).join('.'), tipo: 'erro', ic: 'din', ir: 'financeiro', titulo: plural(pAtr.length, 'pagamento vencido', 'pagamentos vencidos'), sub: (pAtr[0].desc || pAtr[0].cat) + ' · ' + PL.brl(PL.num(pAtr[0].valor) - PL.num(pAtr[0].pago)) });
    aPagar.filter(function (g) { var d = dif(g.venc); return d >= 0 && d <= 7; }).sort(function (a, b) { return a.venc.localeCompare(b.venc); }).forEach(function (g) {
      r.push({ id: 'pag-' + g.id + g.venc, tipo: 'alerta', ic: 'din', ir: 'financeiro', titulo: 'Pagamento vence ' + quando(dif(g.venc)), sub: (g.desc || g.cat) + ' · ' + PL.brl(PL.num(g.valor) - PL.num(g.pago)) });
    });

    var semResp = s.convidados.filter(function (c) { return c.status === 'Pendente'; }).length, prazo = s.convites && s.convites.prazo;
    if (prazo && semResp) {
      var d = dif(prazo);
      if (d < 0) r.push({ id: 'rsvp-passou-' + prazo + '-' + semResp, tipo: 'erro', ic: 'grupo', ir: 'convidados', titulo: plural(semResp, 'convidado não respondeu', 'convidados não responderam'), sub: 'O prazo de confirmação foi ' + PL.dataBR(prazo) + '.' });
      else if (d <= 14) r.push({ id: 'rsvp-' + prazo + '-' + semResp, tipo: 'alerta', ic: 'grupo', ir: 'convidados', titulo: 'Prazo de confirmação ' + quando(d), sub: plural(semResp, 'convidado ainda não respondeu', 'convidados ainda não responderam') + '.' });
    }

    /* produtos extras: a partir do 3º dia depois do primeiro acesso (até o 30º) */
    var desde = s.inicioEm ? -dif(s.inicioEm) : 0;
    if (desde >= 3 && desde <= 30) {
      r.push({ id: 'extra-convite', tipo: 'acc', ic: 'carta', ir: 'bonus', extra: 'convite', titulo: 'Seu convite virtual está esperando', sub: 'Mande o convite pelo WhatsApp e receba as confirmações de presença num lugar só. Toque para ver.' });
      r.push({ id: 'extra-album', tipo: 'acc', ic: 'foto', ir: 'bonus', extra: 'album', titulo: 'As fotos da festa num álbum só', sub: 'Os convidados enviam fotos e vídeos pelo QR Code nas mesas. Toque para ver.' });
    }
    var p = s.perfil;
    if (!p.data) r.push({ id: 'sem-data', tipo: 'info', ic: 'user', ir: 'perfil', titulo: 'Coloque a data do casamento', sub: 'Com ela aparecem a contagem regressiva e os prazos das tarefas.' });
    else {
      var falta = dif(p.data);
      if (falta >= 0 && falta <= 30) r.push({ id: 'data-' + falta, tipo: 'acc', ic: 'taca', ir: 'inicio', titulo: falta === 0 ? 'É hoje! 💍' : falta === 1 ? 'Falta 1 dia para o casamento' : 'Faltam ' + falta + ' dias para o casamento', sub: 'Confira as tarefas da última semana e o roteiro do dia.' });
    }
    if (p.data && !s.tarefas.length) r.push({ id: 'sem-tarefas', tipo: 'info', ic: 'tarefa', ir: 'tarefas', titulo: 'Gere o cronograma de tarefas', sub: 'Os prazos são calculados pela data do casamento.' });
    return r;
  };

  function vistos() { try { return JSON.parse(localStorage.getItem(CHAVE) || '[]'); } catch (x) { return []; } }
  function marcarVistos(lista) { try { localStorage.setItem(CHAVE, JSON.stringify(lista.map(function (a) { return a.id; }))); } catch (x) {} }

  function pintarSino() {
    var lista = PL.avisos(), v = vistos();
    var novos = lista.filter(function (a) { return v.indexOf(a.id) < 0; }).length;
    document.querySelectorAll('.sino').forEach(function (b) {
      var bolha = b.querySelector('.sino-n');
      if (novos) { bolha.textContent = novos > 9 ? '9+' : novos; bolha.hidden = false; } else bolha.hidden = true;
      b.setAttribute('aria-label', novos ? 'Avisos: ' + novos + ' novos' : 'Avisos');
    });
    if (painel) pintarPainel();
  }
  function pintarPainel() {
    var lista = PL.avisos();
    painel.innerHTML = '<div class="avisos-cab"><b>Avisos</b><button type="button" class="ic" data-avisos="fechar" aria-label="Fechar">' + PL.ic('mais') + '</button></div>' +
      (lista.length ? '<ul>' + lista.map(function (a) {
        return '<li><button type="button" class="aviso-item ' + a.tipo + '" data-avisos-ir="' + a.ir + '"' + (a.extra ? ' data-avisos-extra="' + a.extra + '"' : '') + '><span class="aviso-ic">' + PL.ic(a.ic) + '</span><span class="aviso-txt"><b>' + e(a.titulo) + '</b><small>' + e(a.sub) + '</small></span></button></li>';
      }).join('') + '</ul>' : '<div class="avisos-vazio"><span>' + SINO + '</span><b>Tudo em dia por aqui</b><small>Quando houver tarefa ou pagamento perto do prazo, o aviso aparece aqui.</small></div>');
  }
  function posicionar(b) {
    var r = b.getBoundingClientRect(), larg = Math.min(360, window.innerWidth - 16);
    painel.style.width = larg + 'px';
    painel.style.top = (r.bottom + 8) + 'px';
    painel.style.left = Math.max(8, Math.min(r.right - larg, window.innerWidth - larg - 8)) + 'px';
    if (r.left < 300 && window.innerWidth > 900) painel.style.left = Math.max(8, r.left) + 'px';
  }
  function abrir(b) {
    fechar();
    painel = document.createElement('div'); painel.className = 'avisos'; painel.setAttribute('role', 'dialog'); painel.setAttribute('aria-label', 'Avisos');
    document.body.appendChild(painel); pintarPainel(); posicionar(b);
    document.querySelectorAll('.sino').forEach(function (x) { x.classList.add('on'); x.setAttribute('aria-expanded', 'true'); });
    marcarVistos(PL.avisos()); pintarSino();
  }
  function fechar() {
    if (!painel) return; painel.remove(); painel = null;
    document.querySelectorAll('.sino').forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-expanded', 'false'); });
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('.sino');
    if (b) { ev.preventDefault(); if (painel) fechar(); else abrir(b); return; }
    if (!painel) return;
    var ir = ev.target.closest('[data-avisos-ir]');
    if (ir) { var ex = ir.getAttribute('data-avisos-extra'); fechar(); document.body.classList.remove('menu-aberto'); PL.ir(ir.getAttribute('data-avisos-ir')); if (ex && PL.acoes.liberarExtra) setTimeout(function () { PL.acoes.liberarExtra({ extra: ex }); }, 350); return; }
    if (ev.target.closest('[data-avisos="fechar"]') || !painel.contains(ev.target)) fechar();
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') fechar(); });
  window.addEventListener('resize', fechar);

  function botao(cls) { return '<button type="button" class="ic sino ' + cls + '" aria-label="Avisos" aria-haspopup="dialog" aria-expanded="false">' + SINO + '<span class="sino-n" hidden></span></button>'; }

  var iniciarOriginal = PL.iniciar;
  PL.iniciar = function () {
    iniciarOriginal.apply(this, arguments);
    if (PL.s && !PL.s.inicioEm) { PL.s.inicioEm = PL.hoje(); PL.salvar(true); }
    var bonus = document.getElementById('topo-bonus');
    if (bonus) { var dir = document.createElement('span'); dir.className = 'topo-dir'; bonus.parentNode.insertBefore(dir, bonus); dir.insertAdjacentHTML('beforeend', botao('sino-topo')); dir.appendChild(bonus); }
    var marca = document.querySelector('.lado .marca');
    if (marca) marca.insertAdjacentHTML('afterend', botao('sino-lado'));
    pintarSino();
  };
  var renderOriginal = PL.render;
  PL.render = function () { var r = renderOriginal.apply(this, arguments); pintarSino(); return r; };
})();
