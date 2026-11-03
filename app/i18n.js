/* Planner CheckLove: idiomas. O app é escrito em português; nos outros idiomas os textos
   da tela são trocados pelo dicionário do idioma (app/i18n/<idioma>.js) assim que aparecem. */
(function () {
  'use strict';
  var LANGS = {
    pt: { nome: 'Português', band: '🇧🇷', loc: 'pt-BR' },
    en: { nome: 'English', band: '🇺🇸', loc: 'en-US' },
    es: { nome: 'Español', band: '🇪🇸', loc: 'es-ES' },
    it: { nome: 'Italiano', band: '🇮🇹', loc: 'it-IT' },
    fr: { nome: 'Français', band: '🇫🇷', loc: 'fr-FR' }
  };
  var CHAVE = 'checklove_idioma';
  var id = (function () {
    try { var v = localStorage.getItem(CHAVE); if (LANGS[v]) return v; } catch (e) {}
    var n = (navigator.language || 'pt').slice(0, 2).toLowerCase();
    return LANGS[n] ? n : 'pt';
  })();
  var I = window.PL_I18N = { idioma: id, langs: LANGS, loc: LANGS[id].loc, dict: {}, html: {} };
  document.documentElement.lang = LANGS[id].loc;

  /* carrega o dicionário do idioma antes dos outros scripts */
  I.carregar = function (dict) {
    Object.keys(dict).forEach(function (k) { if (/<[a-z]/i.test(k)) I.html[k] = dict[k]; else I.dict[k] = dict[k]; });
  };
  if (id !== 'pt') document.write('<script src="/app/i18n/' + id + '.js?v=2"><\/script>');

  I.t = function (s, vars) {
    var r = (id !== 'pt' && (I.dict[s] || I.html[s])) || s;
    if (vars) r = r.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    return r;
  };
  I.mudar = function (novo) {
    try { localStorage.setItem(CHAVE, novo); } catch (e) {}
    location.reload();
  };

  /* ---------- tradução do que aparece na tela ---------- */
  if (id === 'pt') return;
  var INLINE = { I: 1, B: 1, EM: 1, STRONG: 1, BR: 1 };
  var PULA = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CODE: 1 };
  var ATTS = ['placeholder', 'aria-label', 'title'];
  function protegido(el) { return el.closest && el.closest('[data-notr]'); }
  function texto(n) {
    var v = n.nodeValue, t = v.replace(/\s+/g, ' ').trim(); if (!t) return;
    var p = n.parentNode; if (!p || PULA[p.nodeName] || protegido(p)) return;
    var r = I.dict[t]; if (r != null && r !== t) n.nodeValue = v.replace(v.trim(), r);
  }
  function elemento(el) {
    if (PULA[el.nodeName] || protegido(el)) return;
    if (el.children.length) {
      var soInline = true;
      for (var i = 0; i < el.children.length; i++) if (!INLINE[el.children[i].nodeName]) { soInline = false; break; }
      if (soInline) { var r = I.html[el.innerHTML.replace(/\s+/g, ' ').trim()]; if (r) el.innerHTML = r; }
    }
    for (var j = 0; j < ATTS.length; j++) {
      var a = el.getAttribute(ATTS[j]); if (a) { var t = I.dict[a.trim()]; if (t) el.setAttribute(ATTS[j], t); }
    }
  }
  function traduzir(raiz) {
    if (raiz.nodeType === 3) { texto(raiz); return; }
    if (raiz.nodeType !== 1) return;
    elemento(raiz);
    var els = raiz.getElementsByTagName('*');
    for (var i = 0; i < els.length; i++) elemento(els[i]);
    var w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) texto(n);
  }
  I.traduzir = traduzir;
  new MutationObserver(function (lista) {
    lista.forEach(function (m) { m.addedNodes.forEach(traduzir); });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
