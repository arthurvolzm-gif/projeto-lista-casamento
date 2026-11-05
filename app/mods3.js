/* Planner CheckLove: convidados, mesas, cortejo, playlist, casa e viagem, inspiração */
(function () {
  'use strict';
  var PL = window.PL, U = PL.ui, D = PL.D, e = PL.esc;
  function feitos(arr) { return arr.filter(function (x) { return x.ok; }).length; }

  /* continua no grupo Cerimônia e convidados */
  var ST = ['Pendente', 'Confirmado', 'Não vai'], FX = ['Adulto', 'Criança', 'Bebê'];
  PL.mod('convidados', {
    titulo: 'Convidados', icone: 'grupo',
    render: function () {
      var c = PL.s.convidados, n = function (s) { return c.filter(function (x) { return x.status === s; }).length; };
      var filtro = PL.temp.filtroConv || 'Todos', lista = filtro === 'Todos' ? c : c.filter(function (x) { return x.status === filtro; });
      var mesas = {}; PL.s.mesas.forEach(function (m) { mesas[m.id] = m.nome; });
      var html = U.cab('Convidados', 'Lista de <i>convidados</i>', 'Quem vai, quem ainda não respondeu e de que lado é cada um. As mesas se montam em Mapa de mesas.', [U.btnPrint()]);
      html += U.kpis([{ r: 'Total', v: c.length, s: n('Não vai') ? PL.t('sem contar quem não vai: {n}', { n: c.length - n('Não vai') }) : '' }, { r: 'Confirmados', v: n('Confirmado'), cls: 'ok' }, { r: 'Pendentes', v: n('Pendente'), cls: 'alerta' }, { r: 'Não vão', v: n('Não vai'), cls: n('Não vai') ? 'erro' : '' },
        { r: 'Crianças e bebês', v: c.filter(function (x) { return x.faixa !== 'Adulto'; }).length }]);
      html += '<div class="g2"><section class="card"><h2>Adicionar convidado</h2>' + U.form('conv', [U.f('nome', 'Nome', { req: true }), U.f('grupo', 'Grupo', { opts: D.gruposConvidados }), U.f('faixa', 'Idade', { opts: FX }), U.f('status', 'Presença', { opts: ST }), U.f('tel', 'Telefone')]) + '</section>' +
        '<section class="card"><h2>Colar uma lista</h2><form data-form="lote" data-k="lote" style="display:flex;flex-direction:column;gap:10px"><textarea name="nomes" rows="4" placeholder="Um nome por linha" aria-label="Nomes, um por linha"></textarea><div class="lin"><select name="grupo" aria-label="Grupo" style="flex:1">' +
        D.gruposConvidados.map(function (g) { return '<option>' + e(g) + '</option>'; }).join('') + '</select><button class="btn" type="submit">' + PL.ic('mais') + 'Adicionar todos</button></div></form></section></div>';
      html += '<section class="card"><div class="lin" style="margin-bottom:12px"><div class="filtros">' + ['Todos'].concat(ST).map(function (f) { return '<button type="button" class="' + (filtro === f ? 'on' : '') + '" data-act="filtroConv" data-f="' + f + '">' + f + '</button>'; }).join('') +
        '</div><span class="esp"></span><input type="search" placeholder="Buscar por nome ou grupo" data-busca="#tb-conv tbody tr" aria-label="Buscar" style="max-width:260px"></div>' +
        (lista.length ? '<div class="tabela"><table class="tb" id="tb-conv"><thead><tr><th>Nome</th><th>Grupo</th><th>Idade</th><th>Presença</th><th>Telefone</th><th>Mesa</th><th></th></tr></thead><tbody>' + lista.map(function (x) {
          return '<tr data-txt="' + e(x.nome + ' ' + x.grupo) + '"><td style="min-width:170px">' + U.inp('convidados', x.id, 'nome', x.nome, { r: 0, aria: 'Nome' }) + '</td><td style="min-width:150px">' + U.sel('convidados', x.id, 'grupo', x.grupo, D.gruposConvidados, 'Grupo') + '</td>' +
            '<td style="min-width:100px">' + U.sel('convidados', x.id, 'faixa', x.faixa, FX, 'Idade') + '</td><td style="min-width:125px">' + U.sel('convidados', x.id, 'status', x.status, ST, 'Presença') + '</td>' +
            '<td style="min-width:130px">' + U.inp('convidados', x.id, 'tel', x.tel, { r: 0, aria: 'Telefone' }) + '</td><td>' + (x.mesa && mesas[x.mesa] ? '<span class="chip acc">' + e(mesas[x.mesa]) + '</span>' : '<span class="nota">sem mesa</span>') + '</td><td>' + U.del('convidados', x.id) + '</td></tr>';
        }).join('') + '</tbody></table></div>' : U.vazio(c.length ? 'Ninguém com esse filtro.' : 'Nenhum convidado ainda. Adicione um a um ou cole uma lista de nomes.')) + '</section>';
      return html;
    }
  });
  PL.forms.conv = function (d) { PL.add('convidados', { nome: d.nome, grupo: d.grupo, faixa: d.faixa, status: d.status, tel: d.tel, mesa: '', convite: false }); };
  PL.forms.lote = function (d) {
    var nomes = (d.nomes || '').split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean);
    if (!nomes.length) return false;
    nomes.forEach(function (n) { PL.add('convidados', { nome: n, grupo: d.grupo, faixa: 'Adulto', status: 'Pendente', tel: '', mesa: '', convite: false }); });
    PL.toast(nomes.length === 1 ? PL.t('1 convidado adicionado.') : PL.t('{n} convidados adicionados.', { n: nomes.length }));
  };
  PL.acoes.filtroConv = function (d) { PL.temp.filtroConv = d.f; PL.render(true); };
  PL.acoes.csvConv = function () {
    var mesas = {}; PL.s.mesas.forEach(function (m) { mesas[m.id] = m.nome; });
    PL.csv('convidados', ['Nome', 'Grupo', 'Idade', 'Presença', 'Telefone', 'Mesa', 'Convite entregue'], PL.s.convidados.map(function (x) { return [x.nome, x.grupo, x.faixa, x.status, x.tel, mesas[x.mesa] || '', x.convite ? 'Sim' : 'Não']; }));
  };

  PL.mod('mesas', {
    titulo: 'Mapa de mesas', icone: 'mesa',
    render: function () {
      var c = PL.s.convidados.filter(function (x) { return x.status !== 'Não vai'; }), m = PL.s.mesas;
      var sem = c.filter(function (x) { return !x.mesa || !m.some(function (y) { return y.id === x.mesa; }); });
      var html = U.cab('Convidados', 'Mapa de <i>mesas</i>', 'Crie as mesas e escolha quem senta em cada uma. Quem marcou que não vai fica de fora.', [U.btnPrint()]);
      html += U.kpis([{ r: 'Mesas', v: m.length }, { r: 'Lugares', v: m.reduce(function (n, x) { return n + PL.num(x.lugares); }, 0) }, { r: 'Sentados', v: c.length - sem.length, cls: 'ok' }, { r: 'Sem mesa', v: sem.length, cls: sem.length ? 'alerta' : '' }]);
      html += '<section class="card"><h2>Nova mesa</h2>' + U.form('mesa', [U.f('nome', 'Nome da mesa', { v: 'Mesa ' + (m.length + 1) }), U.f('lugares', 'Lugares', { tipo: 'number', v: 8 })], 'Criar mesa') + '</section>';
      if (m.length) html += '<div class="lista-cards">' + m.map(function (mesa) {
        var g = c.filter(function (x) { return x.mesa === mesa.id; }), lot = g.length > PL.num(mesa.lugares);
        return '<section class="card mesa"><div class="cab-card">' + U.inp('mesas', mesa.id, 'nome', mesa.nome, { r: 0, aria: 'Nome da mesa' }) + U.del('mesas', mesa.id) + '</div>' +
          '<div class="lin" style="margin-top:6px"><span class="chip ' + (lot ? 'erro' : g.length === PL.num(mesa.lugares) ? 'ok' : '') + '">' + PL.esc(PL.t('{a} de {b} lugares', { a: g.length, b: PL.num(mesa.lugares) })) + '</span><span class="esp"></span><label class="nota lin" style="gap:6px">Lugares <input type="number" min="1" style="width:70px;padding:5px 8px" value="' + PL.num(mesa.lugares) + '" data-t="n"' + U.attrs('mesas', mesa.id, 'lugares') + '></label></div>' +
          '<ul>' + g.map(function (x) { return '<li><span>' + e(x.nome) + '</span><button type="button" class="ic" data-act="tirarMesa" data-id="' + x.id + '" aria-label="Tirar da mesa">' + PL.ic('lixo') + '</button></li>'; }).join('') + '</ul>' +
          (sem.length ? '<select data-mesa="' + mesa.id + '" aria-label="Sentar convidado nesta mesa"><option value="">+ Sentar convidado</option>' + sem.map(function (x) { return '<option value="' + x.id + '">' + e(x.nome) + '</option>'; }).join('') + '</select>' : '') + '</section>';
      }).join('') + '</div>';
      else html += '<section class="card">' + U.vazio('Crie a primeira mesa. A mesa dos noivos costuma ser a primeira.') + '</section>';
      if (sem.length && m.length) html += '<section class="card"><h2>Ainda sem mesa <small>' + sem.length + '</small></h2><div class="filtros">' + sem.map(function (x) { return '<span class="chip">' + e(x.nome) + '</span>'; }).join('') + '</div></section>';
      if (!c.length) html += '<section class="card">' + U.vazio('Cadastre os convidados primeiro. <button type="button" class="btn leve peq" data-act="ir" data-to="convidados">Ir para convidados</button>') + '</section>';
      return html;
    }
  });
  PL.forms.mesa = function (d) { PL.add('mesas', { nome: d.nome || 'Mesa', lugares: PL.num(d.lugares) || 8 }); };
  PL.acoes.tirarMesa = function (d) { var x = PL.alvo('convidados', d.id); if (x) { x.mesa = ''; PL.salvar(); PL.render(true); } };
  document.addEventListener('change', function (ev) {
    var el = ev.target, mesa = el.getAttribute && el.getAttribute('data-mesa'); if (!mesa || !el.value) return;
    var x = PL.alvo('convidados', el.value); if (x) { x.mesa = mesa; PL.salvar(); PL.render(true); }
  });

  PL.mod('cortejo', {
    titulo: 'Cortejo', icone: 'fila',
    render: function () {
      var c = PL.s.cortejo;
      var html = U.cab('Cerimônia', 'Ordem do <i>cortejo</i>', 'Quem entra e em que ordem. Use as setas para reorganizar.', [U.btnPrint()]);
      html += '<section class="card"><h2>Adicionar</h2>' + U.form('cortejo', [U.f('nome', 'Nome', { req: true }), U.f('funcao', 'Função', { opts: D.funcoesCortejo }), U.f('contato', 'Telefone')]) + '</section>';
      html += '<section class="card"><h2>Ordem de entrada <small>' + c.length + ' pessoas</small></h2>' + (c.length ? '<div class="tabela"><table class="tb"><thead><tr><th>#</th><th>Nome</th><th>Função</th><th>Telefone</th><th></th></tr></thead><tbody>' + c.map(function (x, i) {
        return '<tr><td style="width:40px;font-weight:700;color:var(--acc)">' + (i + 1) + '</td><td style="min-width:170px">' + U.inp('cortejo', x.id, 'nome', x.nome, { r: 0, aria: 'Nome' }) + '</td><td style="min-width:150px">' + U.sel('cortejo', x.id, 'funcao', x.funcao, D.funcoesCortejo, 'Função') + '</td>' +
          '<td style="min-width:130px">' + U.inp('cortejo', x.id, 'contato', x.contato, { r: 0, aria: 'Telefone' }) + '</td><td style="white-space:nowrap">' + U.mov('cortejo', x.id) + U.del('cortejo', x.id) + '</td></tr>';
      }).join('') + '</tbody></table></div>' : U.vazio('Comece pelo celebrante e siga a ordem de entrada.')) + '</section>';
      return html;
    }
  });
  PL.forms.cortejo = function (d) { PL.add('cortejo', { nome: d.nome, funcao: d.funcao, contato: d.contato }); };

  PL.mod('playlist', {
    titulo: 'Playlist', icone: 'musica',
    render: function () {
      var pl = PL.s.playlist;
      var html = U.cab('Cerimônia', 'Playlist do <i>casamento</i>', 'As músicas de cada momento, na ordem. Copie a lista e mande para o DJ, a banda ou os músicos.', [U.btn('copiarPl', 'Copiar para o DJ', 'copiar'), U.btnPrint()]);
      html += '<section class="card"><h2>Adicionar música</h2>' + U.form('musica', [U.f('musica', 'Música', { req: true }), U.f('artista', 'Artista'), U.f('momento', 'Momento', { opts: D.momentos }), U.f('link', 'Link (opcional)', { tipo: 'url', ph: 'https://' })]) + '</section>';
      if (!pl.length) return html + '<section class="card">' + U.vazio('Comece pela entrada da noiva e pela primeira dança.') + '</section>';
      D.momentos.forEach(function (mo) {
        var g = pl.filter(function (x) { return x.momento === mo; }); if (!g.length) return;
        html += '<section class="card"><h2>' + e(mo) + ' <small>' + g.length + '</small></h2><ul class="chk">' + g.map(function (x, i) {
          return '<li><b style="color:var(--acc);width:20px">' + (i + 1) + '</b><div class="txt">' + U.inp('playlist', x.id, 'musica', x.musica, { r: 0, aria: 'Música' }) + '</div><div class="txt">' + U.inp('playlist', x.id, 'artista', x.artista, { r: 0, ph: 'Artista', aria: 'Artista' }) + '</div>' +
            (/^https?:\/\//i.test(x.link || '') ? '<a class="ic mov" href="' + e(x.link) + '" target="_blank" rel="noopener" aria-label="Abrir link">' + PL.ic('link') + '</a>' : '') +
            '<button type="button" class="ic mov" data-act="moverPl" data-id="' + x.id + '" data-dir="-1" aria-label="Subir">' + PL.ic('cima') + '</button><button type="button" class="ic mov" data-act="moverPl" data-id="' + x.id + '" data-dir="1" aria-label="Descer">' + PL.ic('baixo') + '</button>' + U.del('playlist', x.id) + '</li>';
        }).join('') + '</ul></section>';
      });
      return html;
    }
  });
  PL.forms.musica = function (d) { PL.add('playlist', { musica: d.musica, artista: d.artista, momento: d.momento, link: d.link }); };
  PL.acoes.moverPl = function (d) {
    var arr = PL.s.playlist, i = arr.findIndex(function (x) { return x.id === d.id; }); if (i < 0) return;
    var mo = arr[i].momento, j = i + Number(d.dir);
    while (j >= 0 && j < arr.length && arr[j].momento !== mo) j += Number(d.dir);
    if (j < 0 || j >= arr.length) return;
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t; PL.salvar(); PL.render(true);
  };
  PL.acoes.copiarPl = function () {
    var txt = PL.t('Playlist') + ' · ' + PL.casal() + '\n';
    D.momentos.forEach(function (mo) {
      var g = PL.s.playlist.filter(function (x) { return x.momento === mo; }); if (!g.length) return;
      txt += '\n' + PL.t(mo).toUpperCase() + '\n' + g.map(function (x, i) { return (i + 1) + '. ' + x.musica + (x.artista ? ' (' + x.artista + ')' : '') + (x.link ? ' ' + x.link : ''); }).join('\n') + '\n';
    });
    PL.copiar(txt);
  };

  /* ============ CASA E VIAGEM ============ */
  PL.grupo('Casa e viagem');

  PL.mod('enxoval', {
    titulo: 'Enxoval', icone: 'sofa',
    render: function () {
      var en = PL.s.enxoval, ok = feitos(en), comodos = [];
      en.forEach(function (x) { if (comodos.indexOf(x.comodo) < 0) comodos.push(x.comodo); });
      var html = U.cab('Bônus', 'Enxoval da <i>casa nova</i>', 'O que comprar para cada cômodo, com quantidade. Marque o que já tem ou já ganhou.', [U.btnPrint()]);
      html += U.kpis([{ r: 'Itens', v: en.length }, { r: 'Já tenho', v: ok, cls: 'ok' }, { r: 'Faltam', v: en.length - ok, cls: en.length - ok ? 'alerta' : '' }]);
      html += '<section class="card"><h2>Adicionar item' + (en.length ? '' : ' <button type="button" class="btn leve peq" data-act="listaEnxoval">' + PL.esc(PL.t('Usar a lista pronta ({n} itens)', { n: D.comodos.reduce(function (n, g) { return n + g[1].length; }, 0) })) + '</button>') + '</h2>' +
        U.form('enx', [U.f('comodo', 'Cômodo', { req: true, lista: 'lista-comodos', ph: 'Ex.: Cozinha' }), U.f('t', 'Item', { req: true }), U.f('qtd', 'Quantidade', { tipo: 'number', v: 1 })]) +
        '<datalist id="lista-comodos">' + D.comodos.map(function (g) { return '<option value="' + e(PL.t(g[0])) + '">'; }).join('') + '</datalist></section>';
      if (!en.length) return html + '<section class="card">' + U.vazio('Use a lista pronta por cômodo ou monte a sua.') + '</section>';
      html += '<div class="lista-cards">' + comodos.map(function (cm) {
        var g = en.filter(function (x) { return x.comodo === cm; });
        return '<section class="card"><h2>' + e(cm) + ' <small>' + feitos(g) + '/' + g.length + '</small></h2><ul class="chk">' + g.map(function (x) {
          return '<li class="' + (x.ok ? 'ok' : '') + '">' + U.chk('enxoval', x.id, 'ok', x.ok, 'Já tenho') + '<div class="txt">' + U.inp('enxoval', x.id, 't', x.t, { r: 0, aria: 'Item' }) + '</div><input type="number" min="1" style="width:62px;padding:5px 6px" value="' + PL.num(x.qtd || 1) + '" data-t="n" data-r="0"' + U.attrs('enxoval', x.id, 'qtd') + ' aria-label="Quantidade">' + U.del('enxoval', x.id) + '</li>';
        }).join('') + '</ul></section>';
      }).join('') + '</div>';
      return html;
    }
  });
  PL.forms.enx = function (d) { PL.add('enxoval', { comodo: d.comodo, t: d.t, qtd: PL.num(d.qtd) || 1, ok: false }); };
  PL.acoes.listaEnxoval = function () {
    D.comodos.forEach(function (g) { g[1].forEach(function (t) { PL.s.enxoval.push({ id: PL.uid(), comodo: PL.t(g[0]), t: PL.t(t), qtd: 1, ok: false }); }); });
    PL.salvar(); PL.render(true); PL.toast('Lista pronta adicionada.');
  };

  PL.mod('luamel', {
    titulo: 'Lua de mel', icone: 'aviao',
    render: function () {
      var l = PL.s.luamel;
      var html = U.cab('Bônus', 'Lua de <i>mel</i>', 'O destino, as reservas e o que preparar antes de viajar.', [U.btnPrint()]);
      html += '<div class="g2"><section class="card"><h2>A viagem</h2><div class="form">' + U.campo('Destino', U.inp('luamel', '', 'destino', l.destino), 'largo') +
        U.campo('Ida', U.inp('luamel', '', 'ida', l.ida, { tipo: 'date' })) + U.campo('Volta', U.inp('luamel', '', 'volta', l.volta, { tipo: 'date' })) +
        U.campo('Hospedagem', U.inp('luamel', '', 'hospedagem', l.hospedagem)) + U.campo('Voo e reservas', U.inp('luamel', '', 'voo', l.voo)) +
        U.campo('Orçamento (' + PL.simbolo() + ')', U.inp('luamel', '', 'orcamento', l.orcamento, { n: 1, ph: '0,00' })) + '</div>' +
        (l.ida && l.volta ? '<p class="nota" style="margin-top:10px">' + PL.esc(PL.t('{n} noites de viagem.', { n: Math.max(0, Math.round((new Date(l.volta) - new Date(l.ida)) / 864e5)) })) + '</p>' : '') + '</section>' +
        '<section class="card"><h2>Observações</h2>' + U.area('luamel', '', 'obs', l.obs, 'Passeios, restaurantes, documentos, dicas...', 9) + '</section></div>';
      html += '<section class="card"><h2>Preparativos <small>' + feitos(l.prep) + '/' + l.prep.length + '</small></h2>' + U.checklist('luamel/prep', l.prep) + '</section>';
      return html;
    }
  });

  /* ============ INSPIRAÇÃO ============ */
  PL.grupo('Inspiração');

  var SUG_EV = [['Chá de panela', D.chaPanela], ['Chá de lingerie', D.chaLingerie], ['Chá bar', null], ['Despedida de solteiro', null], ['Ensaio pré-casamento', null], ['Jantar de noivado', null]];
  var BASE_EV = ['Definir data e local', 'Lista de convidados', 'Enviar convites', 'Comida e bebida', 'Decoração', 'Programação ou brincadeiras'];
  PL.mod('eventos', {
    titulo: 'Chás e eventos', icone: 'taca',
    render: function () {
      var ev = PL.s.eventos;
      var html = U.cab('Inspiração', 'Chás e <i>eventos</i>', 'Chá de panela, despedida, ensaio: cada evento com a sua própria lista.');
      html += '<section class="card"><h2>Novo evento</h2><div class="filtros" style="margin-bottom:12px">' + SUG_EV.map(function (s) { return '<button type="button" data-act="sugEvento" data-nome="' + e(PL.t(s[0])) + '">' + e(s[0]) + '</button>'; }).join('') + '</div>' +
        U.form('evento', [U.f('nome', 'Nome do evento', { req: true }), U.f('data', 'Data', { tipo: 'date' }), U.f('local', 'Local'), U.f('quem', 'Quem organiza')], 'Criar evento') + '</section>';
      if (!ev.length) return html + '<section class="card">' + U.vazio('Escolha uma sugestão acima ou crie o seu. Os chás já vêm com uma lista pronta.') + '</section>';
      html += '<div class="g2">' + ev.map(function (x) {
        var p = 'eventos/' + x.id + '/tarefas';
        return '<section class="card"><div class="cab-card">' + U.inp('eventos', x.id, 'nome', x.nome, { r: 0, aria: 'Nome do evento' }) + U.del('eventos', x.id) + '</div><div class="form" style="margin:8px 0 12px">' +
          U.campo('Data', U.inp('eventos', x.id, 'data', x.data, { tipo: 'date' })) + U.campo('Local', U.inp('eventos', x.id, 'local', x.local, { r: 0 })) + U.campo('Quem organiza', U.inp('eventos', x.id, 'quem', x.quem, { r: 0 })) + '</div>' +
          U.prog(feitos(x.tarefas), x.tarefas.length) + '<div style="margin-top:8px">' + U.checklist(p, x.tarefas) + '</div></section>';
      }).join('') + '</div>';
      return html;
    }
  });
  PL.acoes.sugEvento = function (d) { var i = document.querySelector('form[data-form="evento"] input[name="nome"]'); if (i) { i.value = d.nome; i.focus(); } };
  PL.forms.evento = function (d) {
    var s = SUG_EV.find(function (x) { return x[0] === d.nome || PL.t(x[0]) === d.nome; });
    PL.add('eventos', { nome: d.nome, data: d.data, local: d.local, quem: d.quem, tarefas: PL.lista((s && s[1]) || BASE_EV) });
  };

  var CATS = ['Decoração', 'Vestido e acessórios', 'Flores e buquê', 'Bolo e doces', 'Mesa posta', 'Cabelo e maquiagem', 'Convites e papelaria', 'Outros'];
  PL.mod('moodboard', {
    titulo: 'Mural de inspiração', icone: 'foto', menu: 'Mural',
    render: function () {
      var mb = PL.s.moodboard, cat = PL.temp.catMural || CATS[0];
      var html = U.cab('Inspiração', 'Mural de <i>inspiração</i>', (PL.conta ? 'Junte as referências de cada parte do casamento. As fotos ficam guardadas na sua conta.' : 'Junte as referências de cada parte do casamento. As fotos ficam guardadas neste aparelho.'));
      html += '<section class="card"><h2>Adicionar foto</h2><div class="form"><label class="campo">Categoria<select id="mural-cat" data-act-cat>' + CATS.map(function (c) { return '<option' + (c === cat ? ' selected' : '') + '>' + e(c) + '</option>'; }).join('') + '</select></label>' +
        '<label class="btn">' + PL.ic('foto') + 'Escolher fotos<input type="file" accept="image/*" multiple data-arquivo="mural" hidden></label></div>' +
        '<form class="add-linha" data-form="muralUrl"><input name="url" type="url" placeholder="Ou cole o endereço de uma imagem (terminado em .jpg, .png...)" aria-label="Endereço da imagem"><button class="btn leve" type="submit">' + PL.ic('link') + 'Adicionar</button></form>' +
        '<p class="nota" style="margin-top:8px">Links de páginas do Pinterest ou do Instagram não funcionam: salve a imagem no aparelho e escolha a foto.</p></section>';
      var tem = false;
      CATS.forEach(function (c) {
        var g = mb.filter(function (x) { return x.cat === c; }); if (!g.length) return; tem = true;
        html += '<section class="card"><h2>' + e(c) + ' <small>' + g.length + '</small></h2><div class="galeria">' + g.map(function (x) {
          return '<figure><img src="' + e(x.src) + '" alt="Referência de ' + e(c) + '" loading="lazy">' + U.del('moodboard', x.id) + '</figure>';
        }).join('') + '</div></section>';
      });
      if (!tem) html += '<section class="card">' + U.vazio('Nenhuma foto ainda.') + '</section>';
      return html;
    }
  });
  document.addEventListener('change', function (ev) {
    var el = ev.target;
    if (el.id === 'mural-cat') { PL.temp.catMural = el.value; return; }
    if (el.getAttribute('data-arquivo') !== 'mural' || !el.files.length) return;
    var cat = PL.temp.catMural || CATS[0], arqs = Array.prototype.slice.call(el.files), feitas = 0;
    PL.toast(arqs.length === 1 ? PL.t('Preparando 1 foto...') : PL.t('Preparando {n} fotos...', { n: arqs.length }));
    arqs.forEach(function (f) {
      reduzir(f, function (src) {
        var fim = function (item) {
          if (item) PL.s.moodboard.push(item);
          if (++feitas === arqs.length) { PL.salvar(true); PL.render(true); PL.toast('Fotos adicionadas ao mural.'); }
        };
        if (!src) return fim(null);
        if (PL.nuvemFoto) PL.nuvemFoto(src).then(function (r) { fim({ id: PL.uid(), cat: cat, src: r.url, path: r.path }); }, function () { fim({ id: PL.uid(), cat: cat, src: src }); });
        else fim({ id: PL.uid(), cat: cat, src: src });
      });
    });
  });
  function reduzir(arquivo, cb) {
    var url = URL.createObjectURL(arquivo), img = new Image();
    img.onload = function () {
      var m = 900, k = Math.min(1, m / Math.max(img.width, img.height)), cv = document.createElement('canvas');
      cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
      cb(cv.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = function () { URL.revokeObjectURL(url); cb(null); };
    img.src = url;
  }
  PL.forms.muralUrl = function (d) {
    if (!/^https?:\/\//i.test(d.url || '')) { PL.toast('Cole um endereço que comece com https://'); return false; }
    PL.add('moodboard', { cat: PL.temp.catMural || CATS[0], src: d.url });
  };

  /* ============ DADOS DE EXEMPLO ============ */
  PL.exemplo = function () {
    var s = PL.novo(), id = PL.uid, d = new Date(); d.setDate(d.getDate() + 240);
    s.perfil = { noiva: 'Júlia', noivo: 'Pedro', data: PL.iso(d), hora: '17:00', cidade: 'Campinas, SP', local: 'Chácara das Flores', orcamento: 45000, tema: 'roxo' };
    var g = [['Local', 'Chácara das Flores', 12000, 6000, 30], ['Buffet', 'Buffet Sabor', 15000, 5000, 15], ['Foto e filmagem', 'Estúdio Luz', 7000, 7000, ''], ['Decoração e flores', 'Ateliê Verde', 6500, 0, 45], ['Vestido e acessórios', 'Ateliê da Noiva', 3200, 1600, 20]];
    s.gastos = g.map(function (x) { var v = ''; if (x[4] !== '') { var dd = new Date(); dd.setDate(dd.getDate() + x[4]); v = PL.iso(dd); } return { id: id(), cat: x[0], desc: x[1], valor: x[2], pago: x[3], venc: v }; });
    s.fornecedores = [['Local', 'Chácara das Flores', '(19) 99999-0001', 12000, 'Contratado'], ['Buffet', 'Buffet Sabor', '(19) 99999-0002', 15000, 'Contratado'], ['DJ ou banda', 'DJ Marcos', '(19) 99999-0003', 3500, 'Negociando'], ['Bolo e doces', 'Doces da Ana', '(19) 99999-0004', 2200, 'Orçamento pedido']]
      .map(function (x) { return { id: id(), cat: x[0], nome: x[1], contato: x[2], valor: x[3], status: x[4], obs: '' }; });
    var nomes = [['Maria Souza', 'Família da noiva', 'Confirmado'], ['José Souza', 'Família da noiva', 'Confirmado'], ['Ana Lima', 'Amigos da noiva', 'Confirmado'], ['Carla Dias', 'Amigos da noiva', 'Pendente'], ['Rafael Costa', 'Amigos do noivo', 'Confirmado'], ['Bruno Alves', 'Amigos do noivo', 'Pendente'], ['Helena Rocha', 'Família do noivo', 'Confirmado'], ['Lucas Rocha', 'Família do noivo', 'Não vai'], ['Sofia Rocha', 'Família do noivo', 'Confirmado'], ['Paula Mendes', 'Trabalho', 'Pendente']];
    s.convidados = nomes.map(function (x, i) { return { id: id(), nome: x[0], grupo: x[1], faixa: i === 8 ? 'Criança' : 'Adulto', status: x[2], tel: '', mesa: '', convite: i < 5 }; });
    var m1 = { id: id(), nome: 'Mesa da família', lugares: 8 }, m2 = { id: id(), nome: 'Mesa dos amigos', lugares: 8 };
    s.mesas = [m1, m2]; s.convidados[0].mesa = m1.id; s.convidados[1].mesa = m1.id; s.convidados[2].mesa = m2.id; s.convidados[4].mesa = m2.id;
    s.agenda = [['14:00', 'Making of da noiva', 'Casa da noiva'], ['16:30', 'Chegada dos convidados', 'Chácara'], ['17:00', 'Cerimônia', 'Jardim'], ['18:00', 'Fotos com a família', 'Jardim'], ['19:00', 'Jantar', 'Salão']].map(function (x) { return { id: id(), hora: x[0], t: x[1], resp: x[2] }; });
    s.playlist = [['Canon in D', 'Pachelbel', 'Entrada da noiva'], ['Perfect', 'Ed Sheeran', 'Primeira dança'], ['Happy', 'Pharrell Williams', 'Saída dos noivos']].map(function (x) { return { id: id(), musica: x[0], artista: x[1], momento: x[2], link: '' }; });
    s.padrinhos = [['Casal de padrinhos', 'Ana e Rafael', 'Noiva'], ['Madrinha', 'Carla Dias', 'Noiva'], ['Padrinho', 'Bruno Alves', 'Noivo'], ['Daminha', 'Sofia Rocha', 'Noivo']].map(function (x) { return { id: id(), tipo: x[0], nome: x[1], lado: x[2], contato: '', traje: '', convite: false }; });
    s.identidade.cores = [['#7d8f69', 'Verde oliva'], ['#e8d5c4', 'Areia'], ['#c98b8b', 'Rosé'], ['#ffffff', 'Branco']].map(function (x) { return { id: id(), hex: x[0], nome: x[1] }; });
    var base = new Date(s.perfil.data + 'T12:00:00');
    PL.D.cronograma.forEach(function (gr, i) {
      var dd = new Date(base), mm = gr[0].match(/^(\d+) m/);
      if (mm) dd.setMonth(dd.getMonth() - Number(mm[1])); else if (/semana/i.test(gr[0])) dd.setDate(dd.getDate() - 7); else dd.setDate(dd.getDate() - 1);
      gr[1].forEach(function (t) { s.tarefas.push({ id: id(), t: PL.t(t), prazo: PL.iso(dd), prio: i >= 11 ? 'Alta' : 'Média', grupo: gr[0], ok: i < 3 }); });
    });
    s.cronoGerado = true;
    return s;
  };
})();
