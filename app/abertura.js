/* Planner CheckLove: abertura com a logo sendo desenhada. Começa pela ponta de baixo do lado preto,
   contorna o coração, passa para o lado roxo e termina no check. Aparece sempre que o app abre. */
(function () {
  'use strict';
  var reduz = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PRETO = 'M622 1032 C 618 950, 590 885, 505 810 C 400 720, 280 640, 250 520 C 225 410, 270 310, 350 270 C 450 225, 585 255, 628 405';
  var ROXO = 'M630 410 C 665 300, 765 250, 860 250 C 985 252, 1068 335, 1060 445 C 1052 525, 1005 585, 948 615';
  var CHECK = 'M582 755 C 630 760, 665 820, 672 908 C 740 800, 830 700, 925 635';
  var area = 'maskUnits="userSpaceOnUse" x="142" y="193" width="979" height="871"';
  var el = document.createElement('div');
  el.className = 'abertura' + (reduz ? ' rapido' : '');
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<svg viewBox="142 193 979 871">' +
    '<defs>' +
    '<mask id="ab-m1" ' + area + '><path class="ab-t ab-t1" pathLength="1" d="' + PRETO + '"/></mask>' +
    '<mask id="ab-m2" ' + area + '><path class="ab-t ab-t2" pathLength="1" d="' + ROXO + '"/><path class="ab-t ab-t3" pathLength="1" d="' + CHECK + '"/></mask>' +
    '</defs>' +
    '<image href="/app/icones/logo-preto.webp" x="142" y="193" width="979" height="871" mask="url(#ab-m1)"/>' +
    '<image href="/app/icones/logo-roxo.webp" x="142" y="193" width="979" height="871" mask="url(#ab-m2)"/>' +
    '</svg>';
  /* fica fora do <body>: a tela de login troca o body inteiro */
  document.documentElement.appendChild(el);
  function sair() {
    if (el.classList.contains('sai')) return;
    el.classList.add('sai');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 600);
  }
  setTimeout(sair, reduz ? 700 : 2900);
  el.addEventListener('click', sair);
})();
