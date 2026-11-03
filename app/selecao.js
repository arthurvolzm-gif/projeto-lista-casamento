/* Planner CheckLove: troca a lista de opções nativa (<select>) por uma no visual do planner.
   O <select> continua na página, escondido: guarda o valor, entra nos formulários e dispara o
   mesmo evento "change" de antes, então o resto do app não precisa saber dessa troca. */
(function () {
  'use strict';
  var SETA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  var lista = null, atual = null, foco = -1, n = 0;

  function texto(sel) { var o = sel.options[sel.selectedIndex]; return o ? o.text : ''; }
  function sincronizar(sel) {
    var w = sel.parentNode; if (!w || !w.classList || !w.classList.contains('sel')) return;
    var b = w.querySelector('.sel-btn'); if (!b) return;
    b.querySelector('.sel-txt').textContent = texto(sel);
    b.disabled = sel.disabled;
    w.classList.toggle('vazio', !sel.value);
  }
  function melhorar(sel) {
    if (sel.hasAttribute('data-nativo') || (sel.parentNode && sel.parentNode.classList && sel.parentNode.classList.contains('sel'))) return;
    var w = document.createElement('div');
    w.className = 'sel' + (sel.closest('.tb') ? ' sel-tb' : '');
    if (sel.getAttribute('style')) w.setAttribute('style', sel.getAttribute('style'));
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'sel-btn';
    b.setAttribute('aria-haspopup', 'listbox'); b.setAttribute('aria-expanded', 'false');
    var al = sel.getAttribute('aria-label'); if (al) b.setAttribute('aria-label', al);
    b.innerHTML = '<span class="sel-txt"></span><span class="sel-seta">' + SETA + '</span>';
    sel.parentNode.insertBefore(w, sel);
    w.appendChild(b); w.appendChild(sel);
    sel.classList.add('sel-nativo'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
    sincronizar(sel);
  }
  function varrer(raiz) {
    if (!raiz || raiz.nodeType !== 1) return;
    if (raiz.tagName === 'SELECT') { melhorar(raiz); return; }
    var s = raiz.querySelectorAll('select'); for (var i = 0; i < s.length; i++) melhorar(s[i]);
  }

  /* ---------- a lista aberta ---------- */
  function fechar(devolverFoco) {
    if (!lista) return;
    var b = atual && atual.parentNode.querySelector('.sel-btn');
    if (b) { b.setAttribute('aria-expanded', 'false'); b.parentNode.classList.remove('aberto'); if (devolverFoco) b.focus({ preventScroll: true }); }
    lista.remove(); lista = null; atual = null; foco = -1;
  }
  function posicionar() {
    if (!lista || !atual) return;
    var b = atual.parentNode.querySelector('.sel-btn'), r = b.getBoundingClientRect();
    var alto = Math.min(lista.scrollHeight, 300), abaixo = window.innerHeight - r.bottom - 8, acima = r.top - 8;
    var larg = Math.max(r.width, 180), esq = Math.min(r.left, window.innerWidth - larg - 8);
    lista.style.left = Math.max(8, esq) + 'px'; lista.style.minWidth = larg + 'px'; lista.style.maxWidth = Math.max(larg, Math.min(360, window.innerWidth - 16)) + 'px';
    if (abaixo < alto && acima > abaixo) { lista.style.top = ''; lista.style.bottom = (window.innerHeight - r.top + 6) + 'px'; lista.style.maxHeight = Math.min(300, acima) + 'px'; }
    else { lista.style.bottom = ''; lista.style.top = (r.bottom + 6) + 'px'; lista.style.maxHeight = Math.min(300, Math.max(abaixo, 120)) + 'px'; }
  }
  function marcar(i) {
    var itens = lista.querySelectorAll('.sel-op'); if (!itens.length) return;
    foco = Math.max(0, Math.min(itens.length - 1, i));
    for (var k = 0; k < itens.length; k++) itens[k].classList.toggle('foco', k === foco);
    lista.setAttribute('aria-activedescendant', itens[foco].id);
    var it = itens[foco]; if (it.offsetTop < lista.scrollTop) lista.scrollTop = it.offsetTop - 4;
    else if (it.offsetTop + it.offsetHeight > lista.scrollTop + lista.clientHeight) lista.scrollTop = it.offsetTop + it.offsetHeight - lista.clientHeight + 4;
  }
  function abrir(sel) {
    fechar(); atual = sel; n++;
    var b = sel.parentNode.querySelector('.sel-btn');
    lista = document.createElement('div');
    lista.className = 'sel-lista'; lista.setAttribute('role', 'listbox'); lista.tabIndex = -1;
    if (b.getAttribute('aria-label')) lista.setAttribute('aria-label', b.getAttribute('aria-label'));
    var html = '';
    for (var i = 0; i < sel.options.length; i++) {
      var o = sel.options[i], on = i === sel.selectedIndex;
      html += '<div class="sel-op' + (on ? ' on' : '') + (o.disabled ? ' off' : '') + '" role="option" id="selop' + n + '-' + i + '" data-i="' + i + '" aria-selected="' + on + '"><span class="sel-ck">' + (on ? CHECK : '') + '</span><span></span></div>';
    }
    lista.innerHTML = html;
    var spans = lista.querySelectorAll('.sel-op > span:last-child');
    for (var j = 0; j < spans.length; j++) spans[j].textContent = sel.options[j].text;
    document.body.appendChild(lista);
    b.setAttribute('aria-expanded', 'true'); b.parentNode.classList.add('aberto');
    posicionar();
    marcar(Math.max(0, sel.selectedIndex));
    lista.focus({ preventScroll: true });
  }
  function escolher(i) {
    var sel = atual; if (!sel || !sel.options[i] || sel.options[i].disabled) return;
    var mudou = sel.selectedIndex !== i;
    fechar(true);
    if (!mudou) return;
    sel.selectedIndex = i; sincronizar(sel);
    sel.dispatchEvent(new Event('input', { bubbles: true }));
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.sel-btn');
    if (b) { e.preventDefault(); var sel = b.parentNode.querySelector('select'); if (atual === sel) fechar(true); else if (!b.disabled) abrir(sel); return; }
    var op = e.target.closest && e.target.closest('.sel-op');
    if (op && lista && lista.contains(op)) { escolher(+op.getAttribute('data-i')); return; }
    if (lista && !lista.contains(e.target)) fechar();
  }, true);
  document.addEventListener('keydown', function (e) {
    if (lista) {
      var itens = lista.querySelectorAll('.sel-op');
      if (e.key === 'ArrowDown') { e.preventDefault(); marcar(foco + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); marcar(foco - 1); }
      else if (e.key === 'Home') { e.preventDefault(); marcar(0); }
      else if (e.key === 'End') { e.preventDefault(); marcar(itens.length - 1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); escolher(foco); }
      else if (e.key === 'Escape') { e.preventDefault(); fechar(true); }
      else if (e.key === 'Tab') fechar(true);
      else if (e.key.length === 1) {
        var l = e.key.toLowerCase();
        for (var k = 1; k <= itens.length; k++) { var idx = (foco + k) % itens.length; if (itens[idx].textContent.trim().toLowerCase().charAt(0) === l) { marcar(idx); break; } }
      }
      return;
    }
    var b = e.target.closest && e.target.closest('.sel-btn');
    if (b && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); abrir(b.parentNode.querySelector('select')); }
  });
  window.addEventListener('resize', function () { fechar(); });
  window.addEventListener('scroll', function (e) { if (lista && e.target !== lista && !lista.contains(e.target)) posicionar(); }, true);
  document.addEventListener('change', function (e) { if (e.target.tagName === 'SELECT') sincronizar(e.target); });
  document.addEventListener('reset', function (e) { setTimeout(function () { var s = e.target.querySelectorAll('select'); for (var i = 0; i < s.length; i++) sincronizar(s[i]); }); }, true);

  new MutationObserver(function (m) {
    m.forEach(function (r) { r.addedNodes.forEach(varrer); });
    if (atual && !document.contains(atual)) fechar();
  }).observe(document.documentElement, { childList: true, subtree: true });
  if (document.body) varrer(document.body);
  window.PL_SEL = { sincronizar: sincronizar };
})();
