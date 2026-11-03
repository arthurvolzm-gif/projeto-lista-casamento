/* Planner CheckLove: papelaria, identidade visual, convites, padrinhos, votos e civil */
(function () {
  'use strict';
  var PL = window.PL, U = PL.ui, D = PL.D, e = PL.esc;

  function feitos(arr) { return arr.filter(function (x) { return x.ok; }).length; }

  PL.mod('identidade', {
    titulo: 'Identidade visual', icone: 'gota',
    render: function () {
      var id = PL.s.identidade, sug = PL.temp.sugestoes || [];
      var html = U.cab('Planejamento', 'Identidade <i>visual</i>', 'As cores, as fontes e as ideias que dão a cara do casamento. Copie os códigos das cores e mande para a decoração e a papelaria.', [U.btnPrint()]);
      html += '<section class="card"><h2>Paleta de cores <small>toque na cor para trocar</small></h2>' + (id.cores.length ? '<div class="cores">' + id.cores.map(function (c) {
        return '<div class="cor"><div class="amostra" style="background:' + e(c.hex) + '"><input type="color" value="' + e(c.hex) + '"' + U.attrs('identidade/cores', c.id, 'hex') + ' aria-label="Trocar cor"></div>' +
          '<div class="info">' + U.inp('identidade/cores', c.id, 'nome', c.nome, { r: 0, ph: 'Nome da cor', aria: 'Nome da cor' }) + '<code>' + e(c.hex.toUpperCase()) + '</code></div>' +
          '<div class="pe"><button type="button" class="btn leve peq" data-act="copiar" data-txt="' + e(c.hex.toUpperCase()) + '">Copiar</button>' + U.del('identidade/cores', c.id) + '</div></div>';
      }).join('') + '</div>' : U.vazio('Nenhuma cor ainda. Escolha abaixo ou tire as cores de uma foto de referência.')) +
        '<form class="add-linha" data-form="cor" style="align-items:center"><input type="color" name="hex" value="#c9a29a" aria-label="Cor"><input name="nome" placeholder="Nome da cor (ex.: rosé, verde oliva)" aria-label="Nome da cor"><button class="btn leve" type="submit">' + PL.ic('mais') + 'Adicionar cor</button></form></section>';
      html += '<section class="card"><h2>Tirar cores de uma foto</h2><p class="nota">Escolha uma foto de decoração, de flores ou do convite. O planner sugere as cores principais e você adiciona as que quiser.</p>' +
        '<div class="lin" style="margin-top:10px"><label class="btn leve">' + PL.ic('foto') + 'Escolher foto<input type="file" accept="image/*" data-arquivo="paleta" hidden></label></div>' +
        (sug.length ? '<div class="sugestoes">' + sug.map(function (h) { return '<button type="button" style="background:' + h + '" data-act="addCor" data-hex="' + h + '" title="Adicionar ' + h + '" aria-label="Adicionar a cor ' + h + '"></button>'; }).join('') + '</div>' : '') + '</section>';
      html += '<div class="g2"><section class="card"><h2>Fontes</h2>' + (id.fontes.length ? '<ul class="chk">' + id.fontes.map(function (f) {
        return '<li><div class="txt">' + U.inp('identidade/fontes', f.id, 'nome', f.nome, { r: 0, aria: 'Fonte' }) + '</div><div class="txt">' + U.inp('identidade/fontes', f.id, 'uso', f.uso, { r: 0, aria: 'Uso' }) + '</div>' + U.del('identidade/fontes', f.id) + '</li>';
      }).join('') + '</ul>' : U.vazio('Ex.: uma fonte cursiva para os nomes e uma simples para os textos.')) +
        '<form class="add-linha" data-form="fonte"><input name="nome" placeholder="Nome da fonte" aria-label="Nome da fonte"><input name="uso" placeholder="Onde usar" aria-label="Onde usar"><button class="btn leve" type="submit">' + PL.ic('mais') + 'Adicionar</button></form></section>' +
        '<section class="card"><h2>Ideias e referências</h2>' + U.area('identidade', '', 'notas', id.notas, 'Estilo, materiais, flores, sensações que vocês querem passar...', 7) + '</section></div>';
      var resumo = resumoCores();
      html += '<section class="card"><h2>Resumo para fornecedores ' + (resumo ? '<button type="button" class="btn leve peq" data-act="copiar" data-alvo="#resumo-cores">' + PL.ic('copiar') + 'Copiar</button>' : '') + '</h2>' +
        (resumo ? '<p class="texto-doc" id="resumo-cores">' + e(resumo) + '</p>' : U.vazio('Adicione cores e fontes para montar o resumo.')) + '</section>';
      return html;
    }
  });
  function resumoCores() {
    var id = PL.s.identidade; if (!id.cores.length && !id.fontes.length) return '';
    var t = PL.t('Identidade visual') + ' · ' + PL.casal();
    if (id.cores.length) t += '\n\n' + PL.t('Cores:') + '\n' + id.cores.map(function (c) { return '• ' + (c.nome || PL.t('Cor')) + ': ' + c.hex.toUpperCase(); }).join('\n');
    if (id.fontes.length) t += '\n\n' + PL.t('Fontes:') + '\n' + id.fontes.map(function (f) { return '• ' + f.nome + (f.uso ? ' (' + f.uso + ')' : ''); }).join('\n');
    return t;
  }
  PL.forms.cor = function (d) { PL.add('identidade/cores', { hex: d.hex || '#cccccc', nome: d.nome }); };
  PL.forms.fonte = function (d) { if (!d.nome) return false; PL.add('identidade/fontes', { nome: d.nome, uso: d.uso }); };
  PL.acoes.addCor = function (d) {
    PL.add('identidade/cores', { hex: d.hex, nome: '' });
    PL.temp.sugestoes = (PL.temp.sugestoes || []).filter(function (h) { return h !== d.hex; });
    PL.render(true);
  };
  document.addEventListener('change', function (ev) {
    var el = ev.target; if (el.getAttribute('data-arquivo') !== 'paleta' || !el.files[0]) return;
    var img = new Image(), url = URL.createObjectURL(el.files[0]);
    img.onload = function () { PL.temp.sugestoes = extrairCores(img); URL.revokeObjectURL(url); PL.render(true); };
    img.src = url;
  });
  function extrairCores(img) {
    var w = 120, h = Math.max(1, Math.round(img.height / img.width * w)), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, w, h);
    var px = cx.getImageData(0, 0, w, h).data, b = {};
    for (var i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 128) continue;
      var k = (px[i] >> 4) + ',' + (px[i + 1] >> 4) + ',' + (px[i + 2] >> 4);
      var o = b[k] || (b[k] = { n: 0, r: 0, g: 0, b: 0 }); o.n++; o.r += px[i]; o.g += px[i + 1]; o.b += px[i + 2];
    }
    var lista = Object.keys(b).map(function (k) { var o = b[k]; return [o.r / o.n, o.g / o.n, o.b / o.n, o.n]; }).sort(function (a, c) { return c[3] - a[3]; }), esc = [];
    lista.forEach(function (c) {
      if (esc.length >= 6) return;
      if (esc.every(function (x) { return Math.abs(x[0] - c[0]) + Math.abs(x[1] - c[1]) + Math.abs(x[2] - c[2]) > 70; })) esc.push(c);
    });
    return esc.map(function (c) { return '#' + c.slice(0, 3).map(function (v) { return Math.round(v).toString(16).padStart(2, '0'); }).join(''); });
  }

  /* ============ CERIMÔNIA E CONVIDADOS ============ */
  PL.grupo('Cerimônia e convidados');

  PL.mod('convites', {
    titulo: 'Convites', icone: 'carta',
    render: function () {
      var c = PL.s.convites, cv = PL.s.convidados, env = cv.filter(function (x) { return x.convite; }).length;
      var html = U.cab('Cerimônia', 'Controle dos <i>convites</i>', 'Tipo de convite, prazo de entrega, mensagens prontas para o WhatsApp e quem já recebeu.');
      html += '<div class="g2"><section class="card"><h2>Tipo de convite</h2><div class="filtros">' + [['virtual', 'Virtual'], ['fisico', 'Impresso'], ['ambos', 'Os dois']].map(function (t) {
        return '<button type="button" class="' + (c.tipo === t[0] ? 'on' : '') + '" data-act="tipoConvite" data-tipo="' + t[0] + '">' + t[1] + '</button>';
      }).join('') + '</div><div class="form" style="margin-top:14px">' +
        U.campo('Começar a entregar em', U.inp('convites', '', 'inicio', c.inicio, { tipo: 'date' })) + U.campo('Terminar até', U.inp('convites', '', 'fim', c.fim, { tipo: 'date' })) +
        U.campo('Prazo para confirmar presença', U.inp('convites', '', 'prazo', c.prazo, { tipo: 'date' })) + U.campo('Link do convite virtual', U.inp('convites', '', 'link', c.link, { tipo: 'url', ph: 'https://...' })) + '</div></section>' +
        '<section class="card"><h2>Entregues</h2>' + (cv.length ? U.prog(env, cv.length) + '<p class="nota" style="margin-top:10px">Marque na lista abaixo quem já recebeu. Os nomes vêm da lista de convidados.</p>' : U.vazio('Cadastre os convidados para controlar a entrega.<br><br><button type="button" class="btn leve peq" data-act="ir" data-to="convidados">Ir para convidados</button>')) + '</section></div>';
      html += '<section class="card"><h2>Mensagens prontas <small>troque o [nome] e envie</small></h2><div class="g2">' + D.mensagens.map(function (m) {
        return '<div class="msg"><div class="lin"><b>' + e(m.titulo) + '</b><span class="esp"></span><button type="button" class="btn leve peq" data-act="copiar" data-alvo="#msg-' + m.id + '">' + PL.ic('copiar') + 'Copiar</button></div><p id="msg-' + m.id + '">' + e(preencher(m.texto)) + '</p></div>';
      }).join('') + '</div></section>';
      if (cv.length) html += '<section class="card"><h2>Quem já recebeu</h2><input type="search" placeholder="Buscar convidado" data-busca="#lista-conv tr" aria-label="Buscar convidado" style="margin-bottom:10px;max-width:320px">' +
        '<div class="tabela"><table class="tb" id="lista-conv"><tbody>' + cv.map(function (x) {
          return '<tr data-txt="' + e(x.nome + ' ' + x.grupo) + '"><td style="width:36px">' + U.chk('convidados', x.id, 'convite', x.convite, 'Convite entregue') + '</td><td>' + e(x.nome) + '<small class="nota" style="display:block">' + e(x.grupo || '') + '</small></td><td style="text-align:right">' + (x.convite ? '<span class="chip ok">Entregue</span>' : '<span class="chip">A entregar</span>') + '</td></tr>';
        }).join('') + '</tbody></table></div></section>';
      return html;
    }
  });
  function preencher(t) {
    var p = PL.s.perfil, c = PL.s.convites;
    return PL.t(t).replace(/\{convidado\}/g, PL.t('[nome]')).replace(/\{casal\}/g, PL.casal()).replace(/\{data\}/g, p.data ? PL.dataLonga(p.data) : PL.t('[data]'))
      .replace(/\{hora\}/g, p.hora || PL.t('[horário]')).replace(/\{cidade\}/g, p.cidade || PL.t('[cidade]')).replace(/\{link\}/g, c.link || PL.t('[link do convite]')).replace(/\{prazo\}/g, c.prazo ? PL.dataBR(c.prazo) : PL.t('[data]'));
  }
  PL.acoes.tipoConvite = function (d) { PL.s.convites.tipo = d.tipo; PL.salvar(); PL.render(true); };

  var TIPOS_PAD = ['Casal de padrinhos', 'Padrinho', 'Madrinha', 'Daminha', 'Pajem'];
  PL.mod('padrinhos', {
    titulo: 'Padrinhos', icone: 'duo',
    render: function () {
      var p = PL.s.padrinhos, n = function (t) { return p.filter(function (x) { return x.tipo === t; }).length; };
      var html = U.cab('Cerimônia', '<i>Padrinhos</i> e madrinhas', 'Casais, padrinhos individuais, daminhas e pajens, com contato, traje e convite.', [U.btn('csvPad', 'Planilha', 'tabela'), U.btnPrint()]);
      html += U.kpis([{ r: 'Casais', v: n('Casal de padrinhos') }, { r: 'Padrinhos', v: n('Padrinho') }, { r: 'Madrinhas', v: n('Madrinha') }, { r: 'Daminhas e pajens', v: n('Daminha') + n('Pajem') }, { r: 'Convite entregue', v: p.filter(function (x) { return x.convite; }).length + '/' + p.length, cls: 'ok' }]);
      html += '<section class="card"><h2>Adicionar</h2>' + U.form('pad', [U.f('tipo', 'Tipo', { opts: TIPOS_PAD }), U.f('nome', 'Nome (ou nomes do casal)', { req: true }), U.f('lado', 'Lado', { opts: ['Noiva', 'Noivo', 'Casal'] }), U.f('contato', 'Telefone'), U.f('traje', 'Traje ou cor')]) + '</section>';
      html += '<section class="card"><h2>Lista</h2>' + (p.length ? '<div class="tabela"><table class="tb"><thead><tr><th>Tipo</th><th>Nome</th><th>Lado</th><th>Telefone</th><th>Traje ou cor</th><th>Convite</th><th></th></tr></thead><tbody>' + p.map(function (x) {
        return '<tr><td style="min-width:150px">' + U.sel('padrinhos', x.id, 'tipo', x.tipo, TIPOS_PAD, 'Tipo') + '</td><td style="min-width:180px">' + U.inp('padrinhos', x.id, 'nome', x.nome, { r: 0, aria: 'Nome' }) + '</td><td style="min-width:100px">' + U.sel('padrinhos', x.id, 'lado', x.lado, ['Noiva', 'Noivo', 'Casal'], 'Lado') + '</td>' +
          '<td style="min-width:130px">' + U.inp('padrinhos', x.id, 'contato', x.contato, { r: 0, aria: 'Telefone' }) + '</td><td style="min-width:130px">' + U.inp('padrinhos', x.id, 'traje', x.traje, { r: 0, aria: 'Traje' }) + '</td><td style="text-align:center">' + U.chk('padrinhos', x.id, 'convite', x.convite, 'Convite entregue') + '</td><td>' + U.del('padrinhos', x.id) + '</td></tr>';
      }).join('') + '</tbody></table></div>' : U.vazio('Ninguém cadastrado ainda.')) + '</section>';
      return html;
    }
  });
  PL.forms.pad = function (d) { PL.add('padrinhos', { tipo: d.tipo, nome: d.nome, lado: d.lado, contato: d.contato, traje: d.traje, convite: false }); };
  PL.acoes.csvPad = function () { PL.csv('padrinhos', ['Tipo', 'Nome', 'Lado', 'Telefone', 'Traje', 'Convite entregue'], PL.s.padrinhos.map(function (x) { return [x.tipo, x.nome, x.lado, x.contato, x.traje, x.convite ? 'Sim' : 'Não']; })); };

  PL.mod('votos', {
    titulo: 'Votos', icone: 'pena',
    render: function () {
      var v = PL.s.votos, p = PL.s.perfil;
      var html = U.cab('Cerimônia', 'Os <i>votos</i>', 'Um rascunho para cada um. O contador mostra quantas palavras e quanto tempo leva para ler em voz alta.', [U.btnPrint()]);
      html += '<div class="g2">' + [['noiva', 'Votos ' + (p.noiva ? 'de ' + p.noiva : 'da noiva')], ['noivo', 'Votos ' + (p.noivo ? 'de ' + p.noivo : 'do noivo')]].map(function (x) {
        return '<section class="card"><h2>' + e(x[1]) + ' <small data-conta="' + x[0] + '">' + conta(v[x[0]]) + '</small></h2>' + U.area('votos', '', x[0], v[x[0]], 'Comece por uma lembrança de vocês dois...', 12) + '</section>';
      }).join('') + '</div>';
      html += '<section class="card"><h2>Ideias para escrever</h2><ol class="passos"><li>Comece com uma lembrança concreta: o primeiro encontro, uma viagem, um dia comum que ficou.</li><li>Diga o que você admira na pessoa, com um exemplo.</li><li>Faça promessas pequenas e reais, do dia a dia, além das grandes.</li><li>Termine com uma frase curta que dê para dizer olhando nos olhos.</li><li>Leia em voz alta antes. Entre um e dois minutos costuma ser confortável.</li></ol></section>';
      return html;
    },
    depois: function (el) {
      el.querySelectorAll('textarea[data-p="votos"]').forEach(function (t) {
        t.addEventListener('input', function () { var c = el.querySelector('[data-conta="' + t.getAttribute('data-f') + '"]'); if (c) c.textContent = conta(t.value); });
      });
    }
  });
  function conta(t) {
    var n = (t || '').trim() ? t.trim().split(/\s+/).length : 0, s = Math.round(n / 130 * 60);
    return PL.t('{n} palavras · cerca de {t}', { n: n, t: s < 60 ? s + ' s' : Math.floor(s / 60) + ' min ' + String(s % 60).padStart(2, '0') + ' s' });
  }

  PL.mod('civil', {
    titulo: 'Civil e cartório', icone: 'selo', menu: 'Civil',
    render: function () {
      var c = PL.s.civil;
      var html = U.cab('Cerimônia', 'Civil e <i>cartório</i>', 'Os documentos e prazos mudam de um cartório para outro. Confirmem tudo no cartório escolhido.', [U.btnPrint()]);
      html += '<section class="card"><h2>Dados do cartório</h2><div class="form">' + U.campo('Cartório', U.inp('civil', '', 'cartorio', c.cartorio)) + U.campo('Endereço', U.inp('civil', '', 'endereco', c.endereco)) +
        U.campo('Data do civil', U.inp('civil', '', 'data', c.data, { tipo: 'date' })) + U.campo('Horário', U.inp('civil', '', 'hora', c.hora, { tipo: 'time' })) +
        U.campo('Oficial ou responsável', U.inp('civil', '', 'oficial', c.oficial)) + U.campo('Número do processo', U.inp('civil', '', 'processo', c.processo)) +
        U.campo('Observações', U.inp('civil', '', 'obs', c.obs), 'largo') + '</div></section>';
      html += '<div class="g2"><section class="card"><h2>Documentação <small>' + feitos(c.docs) + '/' + c.docs.length + '</small></h2>' + U.checklist('civil/docs', c.docs, 'Adicionar documento') + '</section>' +
        '<section class="card"><h2>Itens do dia <small>' + feitos(c.itens) + '/' + c.itens.length + '</small></h2>' + U.checklist('civil/itens', c.itens) + '</section></div>';
      return html;
    }
  });
})();
