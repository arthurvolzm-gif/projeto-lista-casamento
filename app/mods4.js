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

  /* produtos extras (order bumps): aparecem bloqueados; "Liberar" mostra um resumo e leva ao checkout */
  var CADEADO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  var EXTRAS = {
    convite: {
      titulo: 'Convite virtual e site do casamento', img: '/convite/temas/rose/aberto.webp', alt: 'Convite digital em envelope com lacre',
      curto: 'O convite de vocês em um link, com cara de site do casamento e confirmação de presença.',
      resumo: 'Um convite digital para mandar pelo WhatsApp. Os convidados abrem o envelope, veem tudo sobre o casamento e confirmam a presença pelo próprio link.',
      itens: ['10 temas com envelope e lacre', 'Fotos do casal, data, local, traje e música', 'Confirmação de presença dos convidados', 'Link pronto para enviar no WhatsApp'],
      checkout: 'https://app.zuptos.com.br/checkout/5d5d81a311875672',
      abrir: '/convite/editor', abrirRotulo: 'Criar meu convite', liberado: 'Monte o convite, escolha o tema e mande o link para os convidados.'
    },
    album: {
      titulo: 'Álbum digital dos convidados', icone: 'foto',
      curto: 'Os convidados mandam as fotos e os vídeos da festa pelo celular, num álbum só de vocês.',
      resumo: 'Os convidados leem o QR Code nas mesas e enviam as fotos e os vídeos da festa direto do celular, sem baixar aplicativo. Tudo fica junto num álbum só de vocês.',
      itens: ['QR Code e link para os convidados', 'Cards para as mesas, com 3 modelos', 'Fotos e vídeos guardados por 1 ano', 'Baixar tudo de uma vez no painel'],
      checkout: 'https://app.zuptos.com.br/checkout/5c9410608980b13b',
      abrir: '/album/painel', abrirRotulo: 'Abrir meu álbum', liberado: 'Pegue o QR Code e os cards das mesas para os convidados mandarem as fotos.'
    }
  };
  PL.EXTRAS = EXTRAS;
  PL.temExtra = function (id) { return !!(PL.acessos && PL.acessos[id]); };
  function extraLiberado(id) {
    var x = EXTRAS[id];
    var topo = x.img ? '<img src="' + x.img + '" alt="' + e(x.alt) + '" loading="lazy">' : '<div class="bcard-ic">' + PL.ic(x.icone) + '</div>';
    return '<article class="bcard">' + '<div class="bcard-topo">' + topo + '</div>' +
      '<div class="bcard-corpo"><span class="chip ok">Liberado</span><h3>' + e(x.titulo) + '</h3><p>' + e(x.liberado) + '</p>' +
      '<div class="bcard-acoes"><a class="btn" href="' + x.abrir + '" target="_blank" rel="noopener" data-extra-abrir="' + id + '">' + PL.ic('link') + e(x.abrirRotulo) + '</a></div></div></article>';
  }
  /* marca que a pessoa já abriu o produto (para o aviso do sininho sair) */
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('[data-extra-abrir]'); if (!a || !PL.s) return;
    PL.s.extrasAbertos = PL.s.extrasAbertos || {}; PL.s.extrasAbertos[a.getAttribute('data-extra-abrir')] = true; PL.salvar();
  });
  function extra(id) {
    if (PL.temExtra(id)) return extraLiberado(id);
    var x = EXTRAS[id];
    var topo = x.img ? '<img src="' + x.img + '" alt="' + e(x.alt) + '" loading="lazy">' : '<div class="bcard-ic">' + PL.ic(x.icone) + '</div>';
    return '<article class="bcard bloq">' + '<div class="bcard-topo">' + topo + '<span class="bcard-cad">' + CADEADO + '</span></div>' +
      '<div class="bcard-corpo"><span class="chip bloq-chip">' + CADEADO + 'Bloqueado</span><h3>' + e(x.titulo) + '</h3><p>' + e(x.curto) + '</p>' +
      '<div class="bcard-acoes"><button type="button" class="btn" data-act="liberarExtra" data-extra="' + id + '">' + CADEADO + 'Liberar</button></div></div></article>';
  }
  PL.acoes.liberarExtra = function (d) {
    var x = EXTRAS[d.extra]; if (!x) return;
    var m = document.createElement('div'); m.className = 'extra-m';
    m.innerHTML = '<div class="extra-caixa" role="dialog" aria-modal="true" aria-labelledby="extra-t">' +
      (x.img ? '<img src="' + x.img + '" alt="">' : '<div class="extra-ic">' + PL.ic(x.icone) + '</div>') +
      '<div class="extra-corpo"><span class="chip acc">Produto extra</span><h2 id="extra-t">' + e(x.titulo) + '</h2><p>' + e(x.resumo) + '</p>' +
      '<ul class="lista-ok-app">' + x.itens.map(function (i) { return '<li>' + e(i) + '</li>'; }).join('') + '</ul>' +
      '<div class="extra-botoes"><button type="button" class="btn sec" data-extra-fechar>Agora não</button><a class="btn" href="' + x.checkout + '" target="_blank" rel="noopener" data-extra-ir>Liberar agora</a></div></div></div>';
    document.body.appendChild(m);
    requestAnimationFrame(function () { m.classList.add('in'); });
    function fechar() { m.classList.remove('in'); setTimeout(function () { m.remove(); }, 250); document.removeEventListener('keydown', esc); }
    function esc(ev) { if (ev.key === 'Escape') fechar(); }
    document.addEventListener('keydown', esc);
    m.addEventListener('click', function (ev) {
      if (ev.target === m || ev.target.closest('[data-extra-fechar]')) fechar();
      else if (ev.target.closest('[data-extra-ir]')) setTimeout(fechar, 300);
    });
  };

  PL.grupo('Bônus');

  PL.mod('bonus', {
    titulo: 'Bônus', icone: 'presente', menu: 'Todos os bônus',
    render: function () {
      return U.cab('Bônus', 'Seus <i>bônus</i>', 'Escolha o bônus que você quer abrir. Os materiais em PDF baixam direto no seu aparelho.') +
        '<div class="bonus-grid">' + [
          cartao({ img: '/img/bonus2-foto.webp?v=3', alt: 'Noivos sorrindo no dia do casamento', tag: 'Guia em PDF', titulo: 'Guia do Casamento Econômico', texto: 'Tudo para gastar menos em cada parte do casamento: data, horário, convidados, local, comida, decoração, fornecedores, convites e lembrancinhas.', botoes: [ir('guia', 'Abrir o guia')] }),
          cartao({ img: '/img/bonus1-casa.webp', alt: 'Casa nova com jardim', pos: 'center 45%', tag: 'No app', titulo: 'Enxoval da casa nova', texto: 'A lista do que comprar para cada cômodo, com quantidade, para marcar o que já tem ou já ganhou.', botoes: [ir('enxoval', 'Abrir o enxoval')] }),
          cartao({ img: '/img/bonus-luamel.webp', alt: 'Casal caminhando num píer em direção a uma praia', pos: 'center 60%', tag: 'No app', titulo: 'Lua de mel', texto: 'Destino, datas, reservas e a lista do que preparar antes de viajar, tudo em um lugar.', botoes: [ir('luamel', 'Abrir a lua de mel')] }),
          cartao({ img: '/img/bonus1-casa.webp', alt: 'Casa nova com jardim', pos: 'center 70%', tag: 'Grupo no WhatsApp', titulo: 'Grupo de promoções para a casa nova', texto: 'Ofertas selecionadas de eletrodomésticos, utensílios, cama, mesa, banho e decoração para quem está montando a casa.', botoes: [ir('promocoes', 'Ver o grupo')] })
        ].join('') + extra('convite') + extra('album') + '</div>';
    }
  });

  /* grupo de promoções: cole aqui o link de convite do grupo do WhatsApp quando ele estiver pronto */
  var LINK_GRUPO_PROMOCOES = '';
  var ZAP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 20.5l1.3-4.1A8.5 8.5 0 1 1 8 19.6z"/><path d="M9 8.6c.2 2.6 3.3 5.7 5.9 5.9l1.2-1.3-1.9-1-.9.8c-1-.4-2.3-1.7-2.7-2.7l.8-.9-1-1.9z"/></svg>';
  PL.mod('promocoes', {
    titulo: 'Grupo de promoções para a casa nova', icone: 'grupo', menu: 'Promoções',
    render: function () {
      var pronto = !!LINK_GRUPO_PROMOCOES;
      var passo = function (n, t, x) { return '<li><span class="pr-n">' + n + '</span><div><b>' + t + '</b><small>' + x + '</small></div></li>'; };
      return U.cab('Bônus', 'Grupo de <i>promoções</i>', 'Ofertas para montar a casa nova, direto no seu WhatsApp.', [U.btn('ir', 'Ver todos os bônus', '', 'sec', ' data-to="bonus"')]) +
        '<section class="card pr-topo"><img src="/img/bonus1-casa.webp" alt="Casa nova com jardim" class="pr-img">' +
        '<div class="pr-corpo"><span class="chip acc">' + ZAP + 'Grupo no WhatsApp</span><h2>Para montar a casa sem pagar mais caro</h2>' +
        '<p>Um grupo no WhatsApp com promoções selecionadas de itens para a casa nova: eletrodomésticos, panelas e utensílios, cama, mesa, banho e decoração. Vocês recebem as ofertas e decidem com calma o que vale a pena.</p>' +
        (pronto ? '<a class="btn pr-btn" href="' + e(LINK_GRUPO_PROMOCOES) + '" target="_blank" rel="noopener">' + ZAP + 'Entrar no grupo</a>'
          : '<button type="button" class="btn pr-btn" disabled>' + ZAP + 'Grupo abrindo em breve</button><p class="nota pr-aviso">O grupo está sendo preparado. Assim que ele abrir, o botão para entrar aparece aqui.</p>') +
        '</div></section>' +
        '<div class="g2"><section class="card"><h2>Como funciona</h2><ol class="pr-passos">' +
          passo(1, 'Entrem no grupo', 'Toquem em "Entrar no grupo" e confirmem no WhatsApp.') +
          passo(2, 'Recebam as ofertas', 'As promoções chegam no grupo com o link da loja.') +
          passo(3, 'Comparem com o enxoval', 'Confiram a lista do Enxoval e marquem o que já compraram.') +
        '</ol></section>' +
        '<section class="card"><h2>Bom saber</h2><ul class="lista-ok-app">' +
          '<li>Só a administração envia mensagens, para o grupo ficar organizado e sem conversa paralela.</li>' +
          '<li>Preço, frete e estoque são das lojas e podem mudar a qualquer momento. Confira antes de comprar.</li>' +
          '<li>Dá para sair do grupo quando quiser.</li>' +
        '</ul>' + U.btn('ir', 'Abrir o enxoval', 'sofa', 'leve', ' data-to="enxoval"') + '</section></div>';
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
