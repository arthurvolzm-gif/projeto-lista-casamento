/* Planner CheckLove: Lojinha do casamento (aberta pela sacola do rodapé).
   Para colocar um produto à venda: preencha img (foto), preco (texto, ex.: 'R$ 49,90') e link (endereço da loja).
   Produto sem link mostra "Em breve" ao tocar. */
(function () {
  'use strict';
  var PL = window.PL, U = PL.ui, e = PL.esc;

  var CATS = [
    { id: 'lembrancinhas', nome: 'Lembrancinhas', icone: 'presente' },
    { id: 'vestidos', nome: 'Vestidos', icone: 'user' },
    { id: 'acessorios', nome: 'Acessórios', icone: 'gota' },
    { id: 'noivo', nome: 'Traje do noivo', icone: 'duo' },
    { id: 'decoracao', nome: 'Decoração', icone: 'taca' },
    { id: 'papelaria', nome: 'Papelaria', icone: 'carta' },
    { id: 'padrinhos', nome: 'Padrinhos', icone: 'grupo' },
    { id: 'festa', nome: 'Pista e saída', icone: 'musica' },
    { id: 'cha', nome: 'Chá e despedida', icone: 'taca' },
    { id: 'casa', nome: 'Para sua casa', icone: 'sofa' },
    { id: 'luamel', nome: 'Lua de mel', icone: 'aviao' }
  ];

  var PRODUTOS = [
    { cat: 'lembrancinhas', nome: 'Bem-casados personalizados', img: '', preco: '', link: '' },
    { cat: 'lembrancinhas', nome: 'Mini velas aromáticas', img: '', preco: '', link: '' },
    { cat: 'lembrancinhas', nome: 'Chinelos para a pista', img: '', preco: '', link: '' },
    { cat: 'lembrancinhas', nome: 'Mudas de plantas em tubete', img: '', preco: '', link: '' },
    { cat: 'vestidos', nome: 'Vestido para o civil', img: '', preco: '', link: '' },
    { cat: 'vestidos', nome: 'Segundo look para a festa', img: '', preco: '', link: '' },
    { cat: 'vestidos', nome: 'Vestido para o chá', img: '', preco: '', link: '' },
    { cat: 'vestidos', nome: 'Robe para o making of', img: '', preco: '', link: '' },
    { cat: 'acessorios', nome: 'Véu e grinalda', img: '', preco: '', link: '' },
    { cat: 'acessorios', nome: 'Tiara de noiva', img: '', preco: '', link: '' },
    { cat: 'acessorios', nome: 'Brincos', img: '', preco: '', link: '' },
    { cat: 'acessorios', nome: 'Porta-alianças', img: '', preco: '', link: '' },
    { cat: 'noivo', nome: 'Gravata-borboleta', img: '', preco: '', link: '' },
    { cat: 'noivo', nome: 'Abotoaduras', img: '', preco: '', link: '' },
    { cat: 'noivo', nome: 'Lenço de bolso', img: '', preco: '', link: '' },
    { cat: 'decoracao', nome: 'Placa de boas-vindas', img: '', preco: '', link: '' },
    { cat: 'decoracao', nome: 'Números de mesa', img: '', preco: '', link: '' },
    { cat: 'decoracao', nome: 'Velas e lanternas', img: '', preco: '', link: '' },
    { cat: 'decoracao', nome: 'Topo de bolo', img: '', preco: '', link: '' },
    { cat: 'papelaria', nome: 'Convites', img: '', preco: '', link: '' },
    { cat: 'papelaria', nome: 'Cardápios', img: '', preco: '', link: '' },
    { cat: 'papelaria', nome: 'Livro de assinaturas', img: '', preco: '', link: '' },
    { cat: 'padrinhos', nome: 'Caixa "Quer ser meu padrinho?"', img: '', preco: '', link: '' },
    { cat: 'padrinhos', nome: 'Robes para as madrinhas', img: '', preco: '', link: '' },
    { cat: 'festa', nome: 'Pétalas para a saída', img: '', preco: '', link: '' },
    { cat: 'festa', nome: 'Varinhas de LED', img: '', preco: '', link: '' },
    { cat: 'festa', nome: 'Óculos divertidos', img: '', preco: '', link: '' },
    { cat: 'cha', nome: 'Kit decoração do chá', img: '', preco: '', link: '' },
    { cat: 'cha', nome: 'Faixa e tiara de noiva', img: '', preco: '', link: '' },
    { cat: 'casa', nome: 'Jogo de cama', img: '', preco: '', link: '' },
    { cat: 'casa', nome: 'Jogo de toalhas', img: '', preco: '', link: '' },
    { cat: 'casa', nome: 'Jogo de panelas', img: '', preco: '', link: '' },
    { cat: 'luamel', nome: 'Malas de viagem', img: '', preco: '', link: '' },
    { cat: 'luamel', nome: 'Nécessaire', img: '', preco: '', link: '' }
  ];

  PL.mod('loja', {
    titulo: 'Lojinha', icone: 'sacola', menu: 'Lojinha',
    render: function () {
      var cat = PL.temp.lojaCat || 'todos';
      var lista = cat === 'todos' ? PRODUTOS : PRODUTOS.filter(function (p) { return p.cat === cat; });
      var nomeCat = function (id) { var c = CATS.filter(function (x) { return x.id === id; })[0]; return c ? c.nome : ''; };
      var icCat = function (id) { var c = CATS.filter(function (x) { return x.id === id; })[0]; return c ? c.icone : 'presente'; };
      var html = U.cab('Lojinha', 'Tudo para o <i>seu casamento</i>');
      /* aviso do grupo de promoções no topo */
      var link = PL.grupoPromo ? PL.grupoPromo() : '';
      html += '<section class="loja-promo"><div class="loja-promo-tx"><span class="loja-promo-selo">Exclusivo</span><b>Grupo de promoções <i>para casa nova</i></b>' +
        '<small>Ofertas selecionadas de eletrodomésticos, utensílios, cama, mesa, banho e decoração para montar sua casa.</small></div>' +
        (link ? '<a class="loja-promo-bt" href="' + e(link) + '" target="_blank" rel="noopener">Entrar no grupo</a>' : '<button type="button" class="loja-promo-bt" data-act="grupoEmBreve">Entrar no grupo</button>') + '</section>';
      html += '<div class="loja-cats">' + [{ id: 'todos', nome: 'Todos' }].concat(CATS).map(function (c) {
        return '<button type="button" data-act="lojaCat" data-c="' + c.id + '" class="' + (cat === c.id ? 'on' : '') + '">' + e(c.nome) + '</button>';
      }).join('') + '</div>';
      html += '<div class="loja-grade">' + lista.map(function (p) {
        return '<button type="button" class="loja-prod" data-act="lojaAbrir" data-link="' + e(p.link || '') + '">' +
          '<span class="loja-img"' + (p.img ? ' style="background-image:url(\'' + e(p.img) + '\')"' : '') + '>' + (p.img ? '' : PL.ic(icCat(p.cat))) + '</span>' +
          '<span class="loja-info"><small>' + e(nomeCat(p.cat)) + '</small><b>' + e(p.nome) + '</b>' +
          (p.preco ? '<span class="loja-preco">' + e(p.preco) + '</span>' : '') +
          '<span class="loja-ver">' + (p.link ? 'Ver na loja' : 'Em breve') + '</span></span></button>';
      }).join('') + '</div>';
      return html;
    }
  });
  PL.acoes.lojaCat = function (d) { PL.temp.lojaCat = d.c; PL.render(true); window.scrollTo(0, 0); };
  PL.acoes.lojaAbrir = function (d) {
    if (!d.link) { PL.toast('Este produto chega em breve na lojinha.'); return; }
    window.open(d.link, '_blank', 'noopener');
  };
})();
