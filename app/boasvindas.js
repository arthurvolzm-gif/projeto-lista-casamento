/* Planner CheckLove: perguntas sobre o casamento logo depois do primeiro login
   e a mensagem de boas-vindas em letra cursiva, que some aos poucos. */
(function () {
  'use strict';
  var PL = window.PL, e = PL.esc;
  var OBJETIVOS = ['Controlar os gastos', 'Organizar os convidados', 'Não esquecer nenhuma tarefa', 'Escolher e comparar fornecedores', 'Planejar a cerimônia', 'Dividir a organização com meu par'];
  var CONVIDADOS = ['Até 50', 'De 50 a 100', 'De 100 a 200', 'Mais de 200', 'Ainda não sei'];
  var FRASES = ['Que cada detalhe conte a história de vocês.', 'O amor está nos detalhes.', 'O primeiro capítulo de uma vida a dois começa aqui.'];

  var passo = 0, r = {}, el = null, aberto = false;
  var PASSOS = [
    { id: 'nomes', titulo: 'Qual seu nome e do seu noivo?', sub: 'Os nomes aparecem no topo do planner e na contagem regressiva.' },
    { id: 'data', titulo: 'Quando é o grande dia?', sub: 'Com a data, o planner calcula os prazos de cada tarefa.' },
    { id: 'local', titulo: 'Onde vai ser?', sub: 'Cidade e local da cerimônia. Pode deixar em branco se ainda não decidiram.' },
    { id: 'orcamento', titulo: 'Quanto vocês querem gastar?', sub: 'Um valor aproximado já ajuda a acompanhar o que sobra.' },
    { id: 'convidados', titulo: 'Quantos convidados, mais ou menos?', sub: 'Só uma ideia. A lista de verdade vocês montam depois.' },
    { id: 'objetivos', titulo: 'O que vocês mais querem resolver com o planner?', sub: 'Escolha quantos quiser.' }
  ];

  function corpo(id) {
    var p = r;
    if (id === 'nomes') return '<div class="ob-campos"><label class="campo">Nome da noiva<input data-ob="noiva" value="' + e(p.noiva || '') + '" placeholder="Ex.: Ana" autocomplete="off"></label>' +
      '<label class="campo">Nome do noivo<input data-ob="noivo" value="' + e(p.noivo || '') + '" placeholder="Ex.: João" autocomplete="off"></label></div>';
    if (id === 'data') return '<div class="ob-campos"><label class="campo">Data do casamento<input type="date" data-ob="data" value="' + e(p.data || '') + '"></label>' +
      '<label class="campo">Horário (opcional)<input type="time" data-ob="hora" value="' + e(p.hora || '') + '"></label></div>' +
      '<button type="button" class="ob-chip' + (p.semData ? ' on' : '') + '" data-ob-toggle="semData">Ainda não definimos a data</button>';
    if (id === 'local') return '<div class="ob-campos"><label class="campo">Cidade<input data-ob="cidade" value="' + e(p.cidade || '') + '" placeholder="Ex.: Curitiba" autocomplete="off"></label>' +
      '<label class="campo">Local da cerimônia<input data-ob="local" value="' + e(p.local || '') + '" placeholder="Ex.: Igreja, sítio, salão" autocomplete="off"></label></div>';
    if (id === 'orcamento') return '<div class="ob-campos"><label class="campo">Orçamento total (' + e(PL.simbolo()) + ')<input data-ob="orcamento" inputmode="decimal" value="' + e(p.orcamento || '') + '" placeholder="0,00" autocomplete="off"></label></div>' +
      '<button type="button" class="ob-chip' + (p.semOrc ? ' on' : '') + '" data-ob-toggle="semOrc">Ainda não sabemos</button>';
    if (id === 'convidados') return '<div class="ob-opcoes">' + CONVIDADOS.map(function (c) { return '<button type="button" class="ob-chip' + (p.convidados === c ? ' on' : '') + '" data-ob-um="convidados" data-v="' + e(c) + '">' + e(c) + '</button>'; }).join('') + '</div>';
    if (id === 'objetivos') { var o = p.objetivos || []; return '<div class="ob-opcoes">' + OBJETIVOS.map(function (c) { return '<button type="button" class="ob-chip' + (o.indexOf(c) >= 0 ? ' on' : '') + '" data-ob-varios="objetivos" data-v="' + e(c) + '">' + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>' + e(c) + '</button>'; }).join('') + '</div>'; }
    return '';
  }
  function pintar(anima) {
    var s = PASSOS[passo], ult = passo === PASSOS.length - 1;
    el.innerHTML = '<div class="ob-caixa" role="dialog" aria-modal="true" aria-labelledby="ob-t">' +
      '<div class="ob-topo"><b class="ob-marca">Check<i>Love</i></b><button type="button" class="ob-pular" data-ob-acao="pular">Pular</button></div>' +
      '<div class="ob-barra"><i style="width:' + Math.round((passo + 1) / PASSOS.length * 100) + '%"></i></div>' +
      '<div class="ob-passo">' + (passo + 1) + ' de ' + PASSOS.length + '</div>' +
      '<h1 id="ob-t">' + e(s.titulo) + '</h1><p class="ob-sub">' + e(s.sub) + '</p>' +
      '<div class="ob-corpo' + (anima ? ' ob-anima' : '') + '">' + corpo(s.id) + '</div>' +
      '<div class="ob-botoes">' + (passo ? '<button type="button" class="btn sec" data-ob-acao="voltar">Voltar</button>' : '<span></span>') +
      '<button type="button" class="btn" data-ob-acao="seguir">' + (ult ? 'Concluir' : 'Continuar') + '</button></div></div>';
    var f = el.querySelector('input'); if (f && window.innerWidth > 700) f.focus({ preventScroll: true });
  }
  function ler() { el.querySelectorAll('[data-ob]').forEach(function (i) { r[i.getAttribute('data-ob')] = i.value.trim(); }); }

  function concluir(pulou) {
    ler();
    var p = PL.s.perfil;
    if (!pulou) {
      if (r.noiva) p.noiva = r.noiva;
      if (r.noivo) p.noivo = r.noivo;
      if (r.data && !r.semData) p.data = r.data;
      if (r.hora) p.hora = r.hora;
      if (r.cidade) p.cidade = r.cidade;
      if (r.local) p.local = r.local;
      if (r.orcamento && !r.semOrc) p.orcamento = PL.num(r.orcamento) || 0;
      if (r.convidados) p.convidadosPrevistos = r.convidados;
      if (r.objetivos && r.objetivos.length) p.objetivos = r.objetivos.slice();
    }
    PL.s.boasVindas = true;
    PL.salvar(); PL.render();
    el.classList.add('saindo');
    setTimeout(function () { el.remove(); el = null; aberto = false; document.documentElement.classList.remove('ob-on'); mensagem(); }, 350);
  }

  /* mensagem de boas-vindas: aparece, fica um pouco e some devagar */
  function mensagem() {
    var p = PL.s.perfil, nomes = [p.noiva, p.noivo].filter(Boolean).join(' & ');
    var frase = FRASES[Math.floor(Math.random() * FRASES.length)];
    var m = document.createElement('div');
    m.className = 'bv'; m.setAttribute('role', 'status');
    m.innerHTML = '<div class="bv-txt"><span class="bv-1">' + e(nomes ? 'Bem-vindos, ' + nomes : 'Bem-vindos') + '</span><span class="bv-2">' + e(frase) + '</span></div>';
    document.body.appendChild(m);
    var some = function () { if (!m.parentNode) return; m.classList.add('fim'); setTimeout(function () { m.remove(); }, 2600); };
    m.addEventListener('click', some);
    setTimeout(some, 4200);
  }

  function abrir() {
    if (aberto) return; aberto = true; passo = 0;
    var p = PL.s.perfil;
    r = { noiva: p.noiva, noivo: p.noivo, data: p.data, hora: p.hora, cidade: p.cidade, local: p.local, orcamento: p.orcamento ? String(p.orcamento).replace('.', ',') : '', convidados: p.convidadosPrevistos, objetivos: (p.objetivos || []).slice() };
    el = document.createElement('div'); el.className = 'ob';
    document.body.appendChild(el); document.documentElement.classList.add('ob-on');
    pintar(true);
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      ler();
      if (b.hasAttribute('data-ob-toggle')) { var k = b.getAttribute('data-ob-toggle'); r[k] = !r[k]; pintar(); return; }
      if (b.hasAttribute('data-ob-um')) { r[b.getAttribute('data-ob-um')] = b.getAttribute('data-v'); pintar(); return; }
      if (b.hasAttribute('data-ob-varios')) { var lista = r.objetivos = r.objetivos || [], v = b.getAttribute('data-v'), i = lista.indexOf(v); if (i >= 0) lista.splice(i, 1); else lista.push(v); pintar(); return; }
      var a = b.getAttribute('data-ob-acao');
      if (a === 'pular') concluir(true);
      else if (a === 'voltar') { passo--; pintar(true); }
      else if (a === 'seguir') { if (passo < PASSOS.length - 1) { passo++; pintar(true); } else concluir(false); }
    });
    el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && ev.target.tagName === 'INPUT') { ev.preventDefault(); var s = el.querySelector('[data-ob-acao="seguir"]'); if (s) s.click(); } });
  }

  /* abre no primeiro acesso de quem ainda não preencheu nada */
  var iniciarOriginal = PL.iniciar;
  PL.iniciar = function () {
    iniciarOriginal.apply(this, arguments);
    if (!PL.s.boasVindas && !PL.temDados()) abrir();
  };
  PL.boasVindas = abrir;
})();
