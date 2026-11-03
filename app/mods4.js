/* Planner CheckLove: área de bônus (cartões que levam a cada bônus) e página de download do guia */
(function () {
  'use strict';
  var PL = window.PL, U = PL.ui, e = PL.esc;

  var ARQ = {
    guia: ['Bonus-2-Guia-do-Casamento-Economico.pdf', 'Guia do Casamento Econômico'],
    manual: ['Bonus-3-Manual-dos-Padrinhos.pdf', 'Manual dos Padrinhos']
  };

  function cartao(o) {
    var topo = o.img ? '<img src="' + o.img + '" alt="' + e(o.alt || '') + '" loading="lazy"' + (o.pos ? ' style="object-position:' + o.pos + '"' : '') + '>'
      : '<div class="bcard-ic">' + PL.ic(o.icone) + '</div>';
    return '<article class="bcard">' + topo + '<div class="bcard-corpo"><span class="chip acc">' + e(o.tag) + '</span><h3>' + e(o.titulo) + '</h3><p>' + e(o.texto) + '</p>' +
      '<div class="bcard-acoes">' + o.botoes.join('') + '</div></div></article>';
  }
  function baixar(arq, rotulo, cls) { return '<button type="button" class="btn ' + (cls || '') + '" data-act="baixarMat" data-arq="' + arq + '">' + PL.ic('papel') + e(rotulo || 'Baixar o PDF') + '</button>'; }
  function ir(rota, rotulo, cls) { return '<button type="button" class="btn ' + (cls || '') + '" data-act="ir" data-to="' + rota + '">' + e(rotulo) + '</button>'; }
  function site(url, rotulo, cls) { return '<a class="btn ' + (cls || '') + '" href="' + url + '" target="_blank" rel="noopener">' + PL.ic('link') + e(rotulo) + '</a>'; }

  PL.grupo('Bônus');

  PL.mod('bonus', {
    titulo: 'Bônus', icone: 'presente', menu: 'Todos os bônus',
    render: function () {
      return U.cab('Bônus', 'Seus <i>bônus</i>', 'Escolha o bônus que você quer abrir. Os materiais em PDF baixam direto no seu aparelho.') +
        '<div class="bonus-grid">' + [
          cartao({ img: '/img/bonus2-foto.webp?v=3', alt: 'Noivos sorrindo no dia do casamento', tag: 'Guia em PDF', titulo: 'Guia do Casamento Econômico', texto: 'Tudo para gastar menos em cada parte do casamento: data, horário, convidados, local, comida, decoração, fornecedores, convites e lembrancinhas.', botoes: [ir('guia', 'Abrir o guia')] }),
          cartao({ img: '/img/bonus3-foto.webp?v=2', alt: 'Caixas para convite de padrinhos', tag: 'Site + manual', titulo: 'Kit Padrinhos', texto: 'Monte a caixinha e o convite dos seus padrinhos com 30 modelos prontos e mande o arquivo para a gráfica. Inclui o manual dos padrinhos.', botoes: [site('/caixinha', 'Abrir o site dos padrinhos'), site('/convite-padrinhos', 'Criar o convite dos padrinhos', 'leve'), baixar('manual', 'Baixar o manual', 'sec')] }),
          cartao({ img: '/img/bonus1-casa.webp', alt: 'Casa nova com jardim', pos: 'center 45%', tag: 'No app', titulo: 'Enxoval da casa nova', texto: 'A lista do que comprar para cada cômodo, com quantidade, para marcar o que já tem ou já ganhou.', botoes: [ir('enxoval', 'Abrir o enxoval')] }),
          cartao({ icone: 'aviao', tag: 'No app', titulo: 'Lua de mel', texto: 'Destino, datas, reservas e a lista do que preparar antes de viajar, tudo em um lugar.', botoes: [ir('luamel', 'Abrir a lua de mel')] })
        ].join('') + '</div>';
    }
  });

  PL.mod('guia', {
    titulo: 'Guia do Casamento Econômico', icone: 'papel', menu: 'Guia econômico',
    render: function () {
      return U.cab('Bônus', 'Guia do Casamento <i>Econômico</i>', 'Um material em PDF para ler no celular ou imprimir.', [U.btn('ir', 'Ver todos os bônus', '', 'sec', ' data-to="bonus"')]) +
        '<section class="card guia"><img src="/img/bonus2-foto.webp?v=3" alt="Noivos sorrindo no dia do casamento" class="guia-img">' +
        '<div class="guia-corpo"><h2>O que tem dentro</h2><ul class="lista-ok-app">' + ['Como definir o teto do orçamento e as prioridades do casal', 'O método dos 3 círculos para montar a lista de convidados', 'Data, horário e local: onde está a maior diferença de preço', 'Comida, bebida, decoração, trajes, foto e música', 'Gastos que dá para cortar e taxas que aparecem no fim', 'Mensagens prontas para pedir orçamento e negociar', '30 ideias de lembrancinhas baratas, com os links para comprar'].map(function (t) { return '<li>' + e(t) + '</li>'; }).join('') + '</ul>' +
        '<div class="lin" style="margin-top:18px">' + baixar('guia', 'Baixar o guia em PDF') + '</div><p class="nota" style="margin-top:10px">O download começa em seguida. No celular, o PDF abre no leitor do aparelho, e dá para salvar nos arquivos.</p></div></section>';
    }
  });

  PL.acoes.baixarMat = function (d, el) {
    var a = ARQ[d.arq]; if (!a) return;
    if (!PL.material) { PL.toast('Entre na sua conta para baixar o material.'); return; }
    var txt = el.innerHTML; el.disabled = true; el.textContent = 'Preparando...';
    PL.material(a[0]).then(function () { el.disabled = false; el.innerHTML = txt; }, function () {
      el.disabled = false; el.innerHTML = txt;
      PL.toast(PL.t('Não foi possível baixar o {x} agora. Tente de novo em instantes.', { x: PL.t(a[1]) }));
    });
  };
})();
