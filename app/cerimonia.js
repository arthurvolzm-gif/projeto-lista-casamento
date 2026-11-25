/* Planner CheckLove: tela de entrada da Cerimônia, com as partes agrupadas por assunto.
   Dentro de cada parte aparecem só as abas do mesmo grupo e um "← Cerimônia" para voltar. */
(function () {
  'use strict';
  var PL = window.PL, U = PL.ui, e = PL.esc;

  PL.GRUPOS_CER = [
    { nome: 'Convidados', mods: ['convidados', 'padrinhos', 'convites'] },
    { nome: 'O dia', mods: ['cortejo', 'mesas', 'votos'] },
    { nome: 'Clima da festa', mods: ['playlist', 'eventos', 'moodboard'] }
  ];
  PL.grupoCer = function (id) { return PL.GRUPOS_CER.filter(function (g) { return g.mods.indexOf(id) >= 0; })[0] || null; };

  function plural(n, um, varios) { return n + ' ' + (n === 1 ? um : varios); }
  /* resumo de cada parte, a partir do que já foi preenchido */
  function resumo(id) {
    var s = PL.s, c = s.convidados || [];
    if (id === 'convidados') {
      if (!c.length) return 'Comece a lista';
      var conf = c.filter(function (x) { return x.status === 'Confirmado'; }).length;
      return conf + ' de ' + c.length + ' confirmados';
    }
    if (id === 'padrinhos') return (s.padrinhos || []).length ? plural(s.padrinhos.length, 'padrinho', 'padrinhos') : 'Ninguém ainda';
    if (id === 'convites') {
      var vao = c.filter(function (x) { return x.status !== 'Não vai'; });
      if (!vao.length) return 'Sem convidados';
      return c.filter(function (x) { return x.convite; }).length + ' de ' + vao.length + ' entregues';
    }
    if (id === 'cortejo') return (s.cortejo || []).length ? plural(s.cortejo.length, 'pessoa na ordem', 'pessoas na ordem') : 'Monte a ordem';
    if (id === 'mesas') {
      var m = s.mesas || []; if (!m.length) return 'Nenhuma mesa';
      var sem = c.filter(function (x) { return x.status !== 'Não vai' && !x.mesa; }).length;
      return plural(m.length, 'mesa', 'mesas') + (sem ? ' · ' + sem + ' sem lugar' : '');
    }
    if (id === 'votos') {
      var v = s.votos || {}, n = [v.noiva, v.noivo].filter(function (t) { return (t || '').trim(); }).length;
      return n === 2 ? 'Os dois escritos' : n === 1 ? 'Rascunho iniciado' : 'Ainda em branco';
    }
    if (id === 'playlist') return (s.playlist || []).length ? plural(s.playlist.length, 'música', 'músicas') : 'Nenhuma música';
    if (id === 'eventos') return (s.eventos || []).length ? plural(s.eventos.length, 'evento', 'eventos') : 'Nenhum marcado';
    if (id === 'moodboard') return (s.moodboard || []).length ? plural(s.moodboard.length, 'foto', 'fotos') : 'Nenhuma foto';
    return '';
  }

  PL.mod('cerimonia', {
    titulo: 'Cerimônia', icone: 'taca', menu: 'Cerimônia',
    render: function () {
      var html = U.cab('Organização', 'Cerimônia e <i>convidados</i>');
      PL.GRUPOS_CER.forEach(function (g) {
        html += '<h2 class="cer-grupo">' + e(g.nome) + '</h2><div class="cer-cards">' + g.mods.map(function (id) {
          var m = PL.mods[id]; if (!m) return '';
          return '<button type="button" class="cer-card" data-act="ir" data-to="' + id + '"><span class="cer-ic">' + PL.ic(m.icone || 'tarefa') + '</span>' +
            '<b>' + e(m.menu || m.titulo) + '</b><small>' + e(resumo(id)) + '</small></button>';
        }).join('') + '</div>';
      });
      return html;
    }
  });
})();
