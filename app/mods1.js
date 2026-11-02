/* Planner CheckLove: início, perfil e planejamento (financeiro, fornecedores, agenda, tarefas, contratos) */
(function () {
  'use strict';
  var PL = window.PL, U = PL.ui, D = PL.D, e = PL.esc;

  function totaisGastos() {
    var t = { prev: 0, pago: 0 };
    PL.s.gastos.forEach(function (g) { t.prev += PL.num(g.valor); t.pago += Math.min(PL.num(g.pago), PL.num(g.valor) || PL.num(g.pago)); });
    t.falta = Math.max(0, t.prev - t.pago); return t;
  }
  function statusGasto(g) {
    var v = PL.num(g.valor), p = PL.num(g.pago);
    if (v && p >= v) return ['Pago', 'ok'];
    if (p > 0) return ['Parcial', 'alerta'];
    return ['Pendente', ''];
  }
  PL.totaisGastos = totaisGastos;

  /* ============ PRINCIPAL ============ */
  PL.grupo('Principal');

  PL.mod('inicio', {
    titulo: 'Início', icone: 'casa',
    render: function () {
      var s = PL.s, p = s.perfil, t = totaisGastos();
      var conv = s.convidados.length, conf = s.convidados.filter(function (c) { return c.status === 'Confirmado'; }).length;
      var tf = s.tarefas.length, td = s.tarefas.filter(function (x) { return x.ok; }).length;
      var hoje = PL.hoje();
      var prox = s.tarefas.filter(function (x) { return !x.ok; }).sort(function (a, b) { return (a.prazo || '9999').localeCompare(b.prazo || '9999'); }).slice(0, 6);
      var venc = s.gastos.filter(function (g) { return g.venc && PL.num(g.valor) > PL.num(g.pago); }).sort(function (a, b) { return a.venc.localeCompare(b.venc); }).slice(0, 5);
      var nome = p.noiva || p.noivo;
      var html = U.cab('Bem-vindos', nome ? 'Olá, <i>' + e(nome) + '</i>' : 'Seu <i>planner</i>', 'Tudo do casamento em um só lugar. Comece pelo perfil e siga pelo menu.') + U.contagem();
      html += U.kpis([
        { r: 'Orçamento usado', v: p.orcamento ? PL.pct(t.prev, PL.num(p.orcamento)) + '%' : PL.brl(t.prev), s: p.orcamento ? PL.brl(t.prev) + ' de ' + PL.brl(PL.num(p.orcamento)) : 'defina o orçamento no perfil', cls: p.orcamento && t.prev > PL.num(p.orcamento) ? 'erro' : 'acc' },
        { r: 'Já pago', v: PL.brl(t.pago), s: 'falta ' + PL.brl(t.falta), cls: 'ok' },
        { r: 'Tarefas', v: td + '/' + tf, s: tf ? PL.pct(td, tf) + '% concluído' : 'nenhuma ainda' },
        { r: 'Convidados', v: conf + '/' + conv, s: 'confirmados' }
      ]);
      html += '<div class="g2"><section class="card"><h2>Próximas tarefas <button type="button" class="btn leve peq" data-act="ir" data-to="tarefas">Ver todas</button></h2>' +
        (prox.length ? '<ul class="chk">' + prox.map(function (x) {
          var atras = x.prazo && x.prazo < hoje;
          return '<li>' + U.chk('tarefas', x.id, 'ok', x.ok, 'Concluída') + '<div class="txt" style="padding:4px 6px">' + e(x.t) + '<small style="padding:0">' + (x.prazo ? PL.dataBR(x.prazo) : 'sem prazo') + '</small></div>' + (atras ? '<span class="chip erro">Atrasada</span>' : '') + '</li>';
        }).join('') + '</ul>' : U.vazio('Sem tarefas pendentes. Em Tarefas e prazos dá para gerar o cronograma de 12 meses.')) + '</section>' +
        '<section class="card"><h2>Pagamentos a vencer <button type="button" class="btn leve peq" data-act="ir" data-to="financeiro">Financeiro</button></h2>' +
        (venc.length ? '<ul class="chk">' + venc.map(function (g) {
          var atras = g.venc < hoje;
          return '<li><div class="txt" style="padding:4px 0">' + e(g.desc || g.cat) + '<small style="padding:0">' + e(g.cat) + ' · vence ' + PL.dataBR(g.venc) + '</small></div><b style="font-variant-numeric:tabular-nums">' + PL.brl(PL.num(g.valor) - PL.num(g.pago)) + '</b>' + (atras ? '<span class="chip erro">Vencido</span>' : '') + '</li>';
        }).join('') + '</ul>' : U.vazio('Nenhum pagamento com vencimento marcado.')) + '</section></div>';
      var fotos = s.moodboard.slice(0, 6);
      html += '<section class="card"><h2>Mural de inspiração <button type="button" class="btn leve peq" data-act="ir" data-to="moodboard">Abrir mural</button></h2>' +
        (fotos.length ? '<div class="galeria">' + fotos.map(function (f) { return '<figure><img src="' + e(f.src) + '" alt="' + e(f.cat) + '" loading="lazy"></figure>'; }).join('') + '</div>' : U.vazio('Adicione fotos de referência no mural de inspiração.')) + '</section>';
      return html;
    }
  });

  PL.mod('perfil', {
    titulo: 'Meu perfil', icone: 'user',
    render: function () {
      var p = PL.s.perfil;
      var html = U.cab('Principal', 'Meu <i>perfil</i>', 'Esses dados aparecem na contagem regressiva, no topo dos PDFs e nas mensagens prontas.');
      html += '<section class="card"><h2>Dados do casal</h2><div class="form">' +
        U.campo('Nome da noiva', U.inp('perfil', '', 'noiva', p.noiva)) + U.campo('Nome do noivo', U.inp('perfil', '', 'noivo', p.noivo)) +
        U.campo('Data do casamento', U.inp('perfil', '', 'data', p.data, { tipo: 'date' })) + U.campo('Horário', U.inp('perfil', '', 'hora', p.hora, { tipo: 'time' })) +
        U.campo('Cidade', U.inp('perfil', '', 'cidade', p.cidade)) + U.campo('Local da cerimônia', U.inp('perfil', '', 'local', p.local)) +
        U.campo('Orçamento total (R$)', U.inp('perfil', '', 'orcamento', p.orcamento, { n: 1, ph: '0,00' })) + '</div></section>';
      html += '<section class="card"><h2>Cor do planner</h2><div class="temas">' + D.temas.map(function (t) {
        return '<button type="button" data-act="tema" data-tema="' + t.id + '" class="' + (p.tema === t.id ? 'on' : '') + '"><i style="background:' + t.cor + '"></i>' + e(t.nome) + '</button>';
      }).join('') + '</div></section>';
      if (PL.conta) html += '<section class="card"><h2>Sua conta</h2><div class="lin"><span>Conectado como <b>' + e(PL.conta.email) + '</b>. Tudo o que você preenche é salvo na conta e aparece em qualquer aparelho em que você entrar.</span><span class="esp"></span>' + U.btn('sair', 'Sair', '', 'sec') + '</div></section>';
      html += '<section class="card"><h2>Seus dados</h2><p class="nota" style="margin-bottom:12px">' + (PL.conta ? 'Além da conta, uma cópia fica neste aparelho. O backup é uma garantia extra: baixe de vez em quando.' : 'Tudo fica salvo neste navegador, neste aparelho. Para usar em outro aparelho ou não perder nada, baixe o backup de vez em quando e importe onde quiser.') + '</p>' +
        '<div class="lin">' + U.btn('backup', 'Baixar backup', 'pasta', 'leve') + '<label class="btn sec">' + PL.ic('mais') + 'Importar backup<input type="file" accept="application/json,.json" data-arquivo="backup" hidden></label>' +
        U.btn('exemplo', 'Ver com dados de exemplo', '', 'sec') + '<span class="esp"></span>' + U.btn('zerar', 'Apagar tudo', 'lixo', 'perigo') + '</div></section>';
      return html;
    }
  });
  PL.acoes.tema = function (d) { PL.s.perfil.tema = d.tema; PL.salvar(); PL.render(true); };
  PL.acoes.backup = function () {
    PL.baixar('planner-checklove-' + PL.hoje() + '.json', JSON.stringify(PL.s), 'application/json');
  };
  PL.acoes.zerar = function () {
    if (!window.confirm('Apagar todos os dados do planner neste navegador? Faça um backup antes, se quiser guardar.')) return;
    PL.s = PL.novo(); PL.salvar(true); PL.render(); PL.toast('Planner zerado.');
  };
  PL.acoes.exemplo = function () {
    if (!window.confirm('Isso substitui os dados atuais por dados de exemplo. Continuar?')) return;
    PL.s = PL.exemplo(); PL.salvar(true); PL.ir('inicio'); PL.toast('Exemplo carregado. Use "Apagar tudo" no perfil para começar do zero.');
  };
  document.addEventListener('change', function (ev) {
    var el = ev.target; if (el.getAttribute('data-arquivo') !== 'backup' || !el.files[0]) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var s = JSON.parse(r.result); if (!s || !s.perfil) throw new Error();
        PL.s = s; PL.salvar(true); location.reload();
      } catch (x) { PL.toast('Esse arquivo não é um backup do planner.'); }
    };
    r.readAsText(el.files[0]);
  });

  /* ============ PLANEJAMENTO ============ */
  PL.grupo('Planejamento');

  PL.mod('financeiro', {
    titulo: 'Financeiro', icone: 'din',
    render: function () {
      var s = PL.s, t = totaisGastos(), orc = PL.num(s.perfil.orcamento), disp = orc - t.prev;
      var html = U.cab('Planejamento', 'Controle <i>financeiro</i>', 'Anote cada gasto com o valor total e o que já foi pago. O planner calcula o resto.',
        [U.btn('csvGastos', 'Planilha', 'tabela'), U.btnPrint()]);
      html += U.kpis([
        { r: 'Orçamento', v: PL.brl(orc), s: orc ? '' : 'defina no perfil' },
        { r: 'Previsto', v: PL.brl(t.prev), s: s.gastos.length + ' itens', cls: 'acc' },
        { r: 'Pago', v: PL.brl(t.pago), cls: 'ok' },
        { r: 'A pagar', v: PL.brl(t.falta), cls: t.falta ? 'alerta' : '' },
        { r: orc && disp < 0 ? 'Acima do orçamento' : 'Disponível', v: PL.brl(Math.abs(disp)), cls: orc && disp < 0 ? 'erro' : '' }
      ]);
      var base = Math.max(orc, t.prev) || 1, C = 2 * Math.PI * 52, partes = [[t.pago, 'var(--ok)'], [t.falta, '#e2a33a'], [Math.max(0, orc - t.prev), 'var(--linha)']], off = 0;
      var arcos = partes.map(function (x) { var l = x[0] / base * C; var a = '<circle cx="70" cy="70" r="52" fill="none" stroke="' + x[1] + '" stroke-width="16" stroke-dasharray="' + l.toFixed(2) + ' ' + (C - l).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 70 70)"/>'; off += l; return a; }).join('');
      html += '<div class="g2"><section class="card"><h2>Distribuição</h2><div class="rosca"><svg viewBox="0 0 140 140" role="img" aria-label="Pago, a pagar e disponível"><circle cx="70" cy="70" r="52" fill="none" stroke="var(--bg)" stroke-width="16"/>' + arcos +
        '<text x="70" y="68" text-anchor="middle" font-size="20" font-weight="700" fill="var(--tinta)">' + PL.pct(t.pago, t.prev) + '%</text><text x="70" y="86" text-anchor="middle" font-size="10" fill="var(--suave)">pago</text></svg>' +
        '<div class="legenda"><div><i style="background:var(--ok)"></i>Pago<b>' + PL.brl(t.pago) + '</b></div><div><i style="background:#e2a33a"></i>A pagar<b>' + PL.brl(t.falta) + '</b></div><div><i style="background:var(--linha)"></i>Livre no orçamento<b>' + PL.brl(Math.max(0, orc - t.prev)) + '</b></div></div></div></section>' +
        '<section class="card"><h2>Por categoria</h2>' + porCategoria() + '</section></div>';
      html += '<section class="card"><h2>Adicionar gasto</h2>' + U.form('gasto', [
        U.f('cat', 'Categoria', { opts: D.gastos }), U.f('desc', 'Descrição', { ph: 'Ex.: nome do fornecedor' }),
        U.f('valor', 'Valor total (R$)', { n: 1, ph: '0,00' }), U.f('pago', 'Já pago (R$)', { n: 1, ph: '0,00' }), U.f('venc', 'Próximo vencimento', { tipo: 'date' })
      ]) + '</section>';
      if (!s.gastos.length) return html + '<section class="card">' + U.vazio('Nenhum gasto ainda. Comece pelo local e pelo buffet, que costumam ser os maiores.') + '</section>';
      html += '<section class="card"><h2>Gastos <small>clique em um valor para editar</small></h2><div class="tabela"><table class="tb"><thead><tr><th>Categoria</th><th>Descrição</th><th class="num">Valor</th><th class="num">Pago</th><th class="num">Falta</th><th>Vencimento</th><th>Status</th><th></th></tr></thead><tbody>' +
        s.gastos.map(function (g) {
          var st = statusGasto(g);
          return '<tr><td style="min-width:150px">' + U.sel('gastos', g.id, 'cat', g.cat, D.gastos, 'Categoria') + '</td><td style="min-width:160px">' + U.inp('gastos', g.id, 'desc', g.desc, { aria: 'Descrição' }) + '</td>' +
            '<td class="num" style="min-width:110px">' + U.inp('gastos', g.id, 'valor', g.valor, { n: 1, aria: 'Valor' }) + '</td><td class="num" style="min-width:110px">' + U.inp('gastos', g.id, 'pago', g.pago, { n: 1, aria: 'Pago' }) + '</td>' +
            '<td class="num">' + PL.brl(Math.max(0, PL.num(g.valor) - PL.num(g.pago))) + '</td><td style="min-width:140px">' + U.inp('gastos', g.id, 'venc', g.venc, { tipo: 'date', aria: 'Vencimento' }) + '</td>' +
            '<td><span class="chip ' + st[1] + '">' + st[0] + '</span></td><td>' + U.del('gastos', g.id) + '</td></tr>';
        }).join('') + '</tbody><tfoot><tr><td colspan="2">Total</td><td class="num">' + PL.brl(t.prev) + '</td><td class="num">' + PL.brl(t.pago) + '</td><td class="num">' + PL.brl(t.falta) + '</td><td colspan="3"></td></tr></tfoot></table></div></section>';
      return html;
    }
  });
  function porCategoria() {
    var m = {}; PL.s.gastos.forEach(function (g) { m[g.cat] = (m[g.cat] || 0) + PL.num(g.valor); });
    var arr = Object.keys(m).map(function (k) { return [k, m[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 7), max = arr.length ? arr[0][1] : 1;
    if (!arr.length) return U.vazio('Os gastos aparecem aqui por categoria.');
    return '<div style="display:flex;flex-direction:column;gap:9px">' + arr.map(function (x) {
      return '<div><div class="lin" style="font-size:13px"><span>' + e(x[0]) + '</span><span class="esp"></span><b style="font-variant-numeric:tabular-nums">' + PL.brl(x[1]) + '</b></div><div class="barra" style="margin-top:4px"><i style="width:' + Math.max(3, x[1] / max * 100) + '%"></i></div></div>';
    }).join('') + '</div>';
  }
  PL.forms.gasto = function (d) {
    if (!d.desc && !d.valor) { PL.toast('Preencha a descrição ou o valor.'); return false; }
    PL.add('gastos', { cat: d.cat, desc: d.desc, valor: PL.num(d.valor), pago: PL.num(d.pago), venc: d.venc });
  };
  PL.acoes.csvGastos = function () {
    PL.csv('gastos-casamento', ['Categoria', 'Descrição', 'Valor', 'Pago', 'Falta', 'Vencimento', 'Status'], PL.s.gastos.map(function (g) {
      return [g.cat, g.desc, PL.dec(PL.num(g.valor)), PL.dec(PL.num(g.pago)), PL.dec(Math.max(0, PL.num(g.valor) - PL.num(g.pago))), PL.dataBR(g.venc), statusGasto(g)[0]];
    }));
  };

  var STATUS_FORN = ['Pesquisando', 'Orçamento pedido', 'Negociando', 'Contratado', 'Descartado'];
  PL.mod('fornecedores', {
    titulo: 'Fornecedores', icone: 'forn',
    render: function () {
      var f = PL.s.fornecedores, n = function (st) { return f.filter(function (x) { return x.status === st; }).length; };
      var html = U.cab('Planejamento', 'Gestão de <i>fornecedores</i>', 'Contatos, valores e o andamento de cada um. Dá para copiar a lista e mandar para quem vai coordenar o dia.',
        [U.btn('copiarForn', 'Copiar lista', 'copiar'), U.btn('csvForn', 'Planilha', 'tabela'), U.btnPrint()]);
      html += U.kpis([{ r: 'Fornecedores', v: f.length }, { r: 'Contratados', v: n('Contratado'), cls: 'ok' }, { r: 'Negociando', v: n('Negociando') + n('Orçamento pedido'), cls: 'alerta' }, { r: 'Pesquisando', v: n('Pesquisando') }]);
      html += '<section class="card"><h2>Adicionar fornecedor</h2>' + U.form('forn', [
        U.f('cat', 'Categoria', { opts: D.fornecedores.concat(['Celebrante', 'Convites e papelaria', 'Transporte', 'Outro']) }), U.f('nome', 'Nome', { req: true }),
        U.f('contato', 'Telefone ou WhatsApp'), U.f('valor', 'Valor (R$)', { n: 1, ph: '0,00' }), U.f('status', 'Status', { opts: STATUS_FORN }), U.f('obs', 'Observações', { cls: 'largo' })
      ]) + '</section>';
      if (!f.length) return html + '<section class="card">' + U.vazio('Nenhum fornecedor ainda.') + '</section>';
      html += '<section class="card"><h2>Lista</h2><div class="tabela"><table class="tb"><thead><tr><th>Categoria</th><th>Nome</th><th>Contato</th><th class="num">Valor</th><th>Status</th><th>Observações</th><th></th></tr></thead><tbody>' +
        f.map(function (x) {
          return '<tr><td style="min-width:140px">' + U.inp('fornecedores', x.id, 'cat', x.cat, { r: 0, aria: 'Categoria' }) + '</td><td style="min-width:150px">' + U.inp('fornecedores', x.id, 'nome', x.nome, { r: 0, aria: 'Nome' }) + '</td>' +
            '<td style="min-width:140px">' + U.inp('fornecedores', x.id, 'contato', x.contato, { r: 0, aria: 'Contato' }) + '</td><td class="num" style="min-width:110px">' + U.inp('fornecedores', x.id, 'valor', x.valor, { n: 1, aria: 'Valor' }) + '</td>' +
            '<td style="min-width:150px">' + U.sel('fornecedores', x.id, 'status', x.status, STATUS_FORN, 'Status') + '</td><td style="min-width:180px">' + U.inp('fornecedores', x.id, 'obs', x.obs, { r: 0, aria: 'Observações' }) + '</td><td>' + U.del('fornecedores', x.id) + '</td></tr>';
        }).join('') + '</tbody></table></div></section>';
      return html;
    }
  });
  PL.forms.forn = function (d) { PL.add('fornecedores', { cat: d.cat, nome: d.nome, contato: d.contato, valor: PL.num(d.valor), status: d.status, obs: d.obs }); };
  PL.acoes.copiarForn = function () {
    var txt = 'Fornecedores · ' + PL.casal() + (PL.s.perfil.data ? ' · ' + PL.dataBR(PL.s.perfil.data) : '') + '\n\n' +
      PL.s.fornecedores.filter(function (x) { return x.status !== 'Descartado'; }).map(function (x) { return x.cat + ': ' + x.nome + (x.contato ? ' · ' + x.contato : '') + ' (' + x.status + ')'; }).join('\n');
    PL.copiar(txt);
  };
  PL.acoes.csvForn = function () {
    PL.csv('fornecedores-casamento', ['Categoria', 'Nome', 'Contato', 'Valor', 'Status', 'Observações'], PL.s.fornecedores.map(function (x) { return [x.cat, x.nome, x.contato, PL.dec(PL.num(x.valor)), x.status, x.obs]; }));
  };

  PL.mod('agenda', {
    titulo: 'Agenda e contagem', icone: 'cal',
    render: function () {
      var a = PL.s.agenda.slice().sort(function (x, y) { return (x.hora || '').localeCompare(y.hora || ''); });
      var html = U.cab('Planejamento', 'Agenda e <i>contagem</i>', 'O cronograma do grande dia, hora a hora. Entregue para a cerimonialista e para os fornecedores.', [U.btnPrint()]) + U.contagem();
      html += '<section class="card"><h2>Cronograma do dia</h2>' + U.form('agenda', [U.f('hora', 'Horário', { tipo: 'time', req: true }), U.f('t', 'O que acontece', { req: true, ph: 'Ex.: Making of da noiva' }), U.f('resp', 'Responsável ou local')]) +
        (a.length ? '<div class="tabela" style="margin-top:16px"><table class="tb"><thead><tr><th>Horário</th><th>O que acontece</th><th>Responsável ou local</th><th></th></tr></thead><tbody>' + a.map(function (x) {
          return '<tr><td style="width:130px">' + U.inp('agenda', x.id, 'hora', x.hora, { tipo: 'time', aria: 'Horário' }) + '</td><td>' + U.inp('agenda', x.id, 't', x.t, { r: 0, aria: 'Evento' }) + '</td><td>' + U.inp('agenda', x.id, 'resp', x.resp, { r: 0, aria: 'Responsável' }) + '</td><td>' + U.del('agenda', x.id) + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<div style="margin-top:14px">' + U.vazio('Monte o roteiro: arrumação, chegada dos fornecedores, cerimônia, fotos, entrada na festa, jantar, bolo, saída.') + '</div>') + '</section>';
      return html;
    }
  });
  PL.forms.agenda = function (d) { PL.add('agenda', { hora: d.hora, t: d.t, resp: d.resp }); };

  PL.mod('tarefas', {
    titulo: 'Tarefas e prazos', icone: 'tarefa',
    render: function () {
      var t = PL.s.tarefas, hoje = PL.hoje(), ordem = { Alta: 0, 'Média': 1, Baixa: 2 };
      var pend = t.filter(function (x) { return !x.ok; }).sort(function (a, b) { return (a.prazo || '9999').localeCompare(b.prazo || '9999') || (ordem[a.prio] - ordem[b.prio]); });
      var feitas = t.filter(function (x) { return x.ok; });
      var atras = pend.filter(function (x) { return x.prazo && x.prazo < hoje; }).length;
      var html = U.cab('Planejamento', 'Tarefas e <i>prazos</i>', 'Gere o cronograma de 12 meses com os prazos calculados pela data do casamento, e acrescente o que for de vocês.', [U.btnPrint()]);
      html += U.kpis([{ r: 'Pendentes', v: pend.length }, { r: 'Atrasadas', v: atras, cls: atras ? 'erro' : '' }, { r: 'Concluídas', v: feitas.length, cls: 'ok' }]);
      html += '<section class="card"><h2>Cronograma de 12 meses</h2><p class="nota" style="margin-bottom:12px">Cria ' + D.cronograma.reduce(function (n, g) { return n + g[1].length; }, 0) + ' tarefas, do "12 meses antes" até o grande dia, com o prazo de cada uma calculado a partir da data do casamento. Se faltar menos de um ano, as tarefas que já passaram aparecem como atrasadas para vocês resolverem primeiro.</p>' +
        U.btn('gerarCrono', PL.s.cronoGerado ? 'Gerar de novo' : 'Gerar tarefas do cronograma', 'cal', 'leve') + (t.length ? '<div style="margin-top:12px">' + U.prog(feitas.length, t.length) + '</div>' : '') + '</section>';
      html += '<section class="card"><h2>Nova tarefa</h2>' + U.form('tarefa', [U.f('t', 'Tarefa', { req: true, cls: 'largo' }), U.f('prazo', 'Prazo', { tipo: 'date' }), U.f('prio', 'Prioridade', { opts: ['Média', 'Alta', 'Baixa'] })]) + '</section>';
      html += '<section class="card"><h2>Pendentes <small>' + pend.length + '</small></h2>' + (pend.length ? linhasTarefas(pend, hoje) : U.vazio('Nada pendente.')) + '</section>';
      if (feitas.length) html += '<section class="card"><h2>Concluídas <small>' + feitas.length + '</small></h2>' + linhasTarefas(feitas, hoje) + '</section>';
      return html;
    }
  });
  function linhasTarefas(arr, hoje) {
    return '<div class="tabela"><table class="tb"><thead><tr><th></th><th>Tarefa</th><th>Prazo</th><th>Prioridade</th><th></th><th></th></tr></thead><tbody>' + arr.map(function (x) {
      var atras = !x.ok && x.prazo && x.prazo < hoje;
      return '<tr class="' + (x.ok ? 'feito' : '') + '"><td style="width:36px">' + U.chk('tarefas', x.id, 'ok', x.ok, 'Concluída') + '</td><td style="min-width:220px">' + U.inp('tarefas', x.id, 't', x.t, { r: 0, aria: 'Tarefa' }) + (x.grupo ? '<small class="nota" style="padding:0 8px">' + e(x.grupo) + '</small>' : '') + '</td>' +
        '<td style="width:150px">' + U.inp('tarefas', x.id, 'prazo', x.prazo, { tipo: 'date', aria: 'Prazo' }) + '</td><td style="width:120px">' + U.sel('tarefas', x.id, 'prio', x.prio, ['Alta', 'Média', 'Baixa'], 'Prioridade') + '</td>' +
        '<td>' + (atras ? '<span class="chip erro">Atrasada</span>' : x.prio === 'Alta' && !x.ok ? '<span class="chip alerta">Alta</span>' : '') + '</td><td>' + U.del('tarefas', x.id) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }
  PL.forms.tarefa = function (d) { PL.add('tarefas', { t: d.t, prazo: d.prazo, prio: d.prio, ok: false }); };
  PL.acoes.gerarCrono = function () {
    var data = PL.s.perfil.data;
    if (!data) { PL.toast('Coloque a data do casamento no perfil primeiro.'); PL.ir('perfil'); return; }
    if (PL.s.cronoGerado && !window.confirm('O cronograma já foi gerado. Gerar de novo acrescenta as tarefas outra vez. Continuar?')) return;
    var base = new Date(data + 'T12:00:00');
    D.cronograma.forEach(function (g, i) {
      var d = new Date(base), m = g[0].match(/^(\d+) m/);
      if (m) d.setMonth(d.getMonth() - Number(m[1]));
      else if (/semana/i.test(g[0])) d.setDate(d.getDate() - 7);
      else d.setDate(d.getDate() - 1);
      g[1].forEach(function (t) { PL.s.tarefas.push({ id: PL.uid(), t: t, prazo: PL.iso(d), prio: i >= 11 ? 'Alta' : 'Média', grupo: g[0], ok: false }); });
    });
    PL.s.cronoGerado = true; PL.salvar(); PL.render(true); PL.toast('Cronograma criado.');
  };

  var STATUS_CONT = ['Em análise', 'Negociando', 'Assinado', 'Pago'];
  PL.mod('contratos', {
    titulo: 'Contratos', icone: 'pasta',
    render: function () {
      var c = PL.s.contratos;
      var html = U.cab('Planejamento', 'Pasta de <i>contratos</i>', 'Guarde os contratos no Google Drive (ou onde preferir) e deixe aqui o link e a situação de cada um.');
      html += '<div class="g2"><section class="card"><h2>Adicionar contrato</h2>' + U.form('contrato', [U.f('nome', 'Fornecedor ou contrato', { req: true }), U.f('status', 'Situação', { opts: STATUS_CONT }), U.f('link', 'Link do arquivo', { tipo: 'url', ph: 'https://drive.google.com/...', cls: 'largo' })]) + '</section>' +
        '<section class="card"><h2>Como organizar no Drive</h2><ol class="passos"><li>Crie uma pasta "Casamento" no Google Drive e, dentro dela, uma pasta "Contratos".</li><li>Salve cada contrato em PDF com o nome do fornecedor.</li><li>Clique com o botão direito no arquivo, em Compartilhar e em Copiar link.</li><li>Cole o link aqui. Antes de assinar, confira os itens em Biblioteca, "O que conferir no contrato".</li></ol></section></div>';
      html += '<section class="card"><h2>Contratos <small>' + c.length + '</small></h2>' + (c.length ? '<div class="tabela"><table class="tb"><thead><tr><th>Contrato</th><th>Situação</th><th>Link</th><th></th><th></th></tr></thead><tbody>' + c.map(function (x) {
        var ok = /^https?:\/\//i.test(x.link || '');
        return '<tr><td style="min-width:180px">' + U.inp('contratos', x.id, 'nome', x.nome, { r: 0, aria: 'Contrato' }) + '</td><td style="min-width:140px">' + U.sel('contratos', x.id, 'status', x.status, STATUS_CONT, 'Situação') + '</td><td style="min-width:220px">' + U.inp('contratos', x.id, 'link', x.link, { tipo: 'url', aria: 'Link' }) + '</td>' +
          '<td>' + (ok ? '<a class="btn leve peq" href="' + e(x.link) + '" target="_blank" rel="noopener">' + PL.ic('link') + 'Abrir</a>' : '') + '</td><td>' + U.del('contratos', x.id) + '</td></tr>';
      }).join('') + '</tbody></table></div>' : U.vazio('Nenhum contrato ainda.')) + '</section>';
      return html;
    }
  });
  PL.forms.contrato = function (d) { PL.add('contratos', { nome: d.nome, status: d.status, link: d.link }); };
})();
