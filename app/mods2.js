/* Planner CheckLove: papelaria, convites, padrinhos, votos e civil */
(function () {
  'use strict';
  var PL = window.PL, U = PL.ui, D = PL.D, e = PL.esc;

  function feitos(arr) { return arr.filter(function (x) { return x.ok; }).length; }

  /* ============ CERIMÔNIA E CONVIDADOS ============ */
  PL.grupo('Cerimônia e convidados');

  PL.mod('convites', {
    titulo: 'Convites', icone: 'carta',
    render: function () {
      var c = PL.s.convites, cv = PL.s.convidados, env = cv.filter(function (x) { return x.convite; }).length;
      var html = U.cab('Cerimônia', 'Controle dos <i>convites</i>', 'Tipo de convite, prazo de entrega e quem já recebeu.');
      html += '<div class="g2"><section class="card"><h2>Tipo de convite</h2><div class="filtros">' + [['virtual', 'Virtual'], ['fisico', 'Impresso'], ['ambos', 'Os dois']].map(function (t) {
        return '<button type="button" class="' + (c.tipo === t[0] ? 'on' : '') + '" data-act="tipoConvite" data-tipo="' + t[0] + '">' + t[1] + '</button>';
      }).join('') + '</div><div class="form" style="margin-top:14px">' +
        U.campo('Começar a entregar em', U.inp('convites', '', 'inicio', c.inicio, { tipo: 'date' })) + U.campo('Terminar até', U.inp('convites', '', 'fim', c.fim, { tipo: 'date' })) +
        U.campo('Prazo para confirmar presença', U.inp('convites', '', 'prazo', c.prazo, { tipo: 'date' })) + U.campo('Link do convite virtual', U.inp('convites', '', 'link', c.link, { tipo: 'url', ph: 'https://...' })) + '</div></section>' +
        '<section class="card"><h2>Entregues</h2>' + (cv.length ? U.prog(env, cv.length) + '<p class="nota" style="margin-top:10px">Marque na lista abaixo quem já recebeu. Os nomes vêm da lista de convidados.</p>' : U.vazio('Cadastre os convidados para controlar a entrega.<br><br><button type="button" class="btn leve peq" data-act="ir" data-to="convidados">Ir para convidados</button>')) + '</section></div>';
      if (cv.length) html += '<section class="card"><h2>Quem já recebeu</h2><input type="search" placeholder="Buscar convidado" data-busca="#lista-conv tr" aria-label="Buscar convidado" style="margin-bottom:10px;max-width:320px">' +
        '<div class="tabela"><table class="tb" id="lista-conv"><tbody>' + cv.map(function (x) {
          return '<tr data-txt="' + e(x.nome + ' ' + x.grupo) + '"><td style="width:36px">' + U.chk('convidados', x.id, 'convite', x.convite, 'Convite entregue') + '</td><td>' + e(x.nome) + '<small class="nota" style="display:block">' + e(x.grupo || '') + '</small></td><td style="text-align:right">' + (x.convite ? '<span class="chip ok">Entregue</span>' : '<span class="chip">A entregar</span>') + '</td></tr>';
        }).join('') + '</tbody></table></div></section>';
      return html;
    }
  });
  PL.acoes.tipoConvite = function (d) { PL.s.convites.tipo = d.tipo; PL.salvar(); PL.render(true); };

  var TIPOS_PAD = ['Casal de padrinhos', 'Padrinho', 'Madrinha', 'Daminha', 'Pajem'];
  PL.mod('padrinhos', {
    titulo: 'Padrinhos', icone: 'duo',
    render: function () {
      var p = PL.s.padrinhos, n = function (t) { return p.filter(function (x) { return x.tipo === t; }).length; };
      var html = U.cab('Cerimônia', '<i>Padrinhos</i> e madrinhas', 'Casais, padrinhos individuais, daminhas e pajens, com contato, traje e convite.', [U.btnPrint()]);
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
