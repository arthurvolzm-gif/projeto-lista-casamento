/* Planner CheckLove: estado, armazenamento, rotas, eventos e componentes comuns */
(function () {
  'use strict';
  var D = window.PL_DADOS;
  var CHAVE = 'checklove_planner_v1';
  var PL = window.PL = { mods: {}, ordem: [], grupos: [], acoes: {}, forms: {}, temp: {}, D: D };
  var I18N = window.PL_I18N || { t: function (s, v) { return v ? s.replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }) : s; }, loc: 'pt-BR', idioma: 'pt' };
  PL.t = I18N.t; PL.loc = I18N.loc;

  /* ---------- utilidades ---------- */
  PL.uid = function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };
  PL.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  PL.num = function (v) {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    v = String(v == null ? '' : v).replace(/[^\d,.-]/g, '');
    var dec = (1.5).toLocaleString(PL.loc).charAt(1);
    if (dec === ',') { if (v.indexOf(',') >= 0) v = v.replace(/\./g, '').replace(',', '.'); }
    else v = v.replace(/,/g, '');
    var n = parseFloat(v); return isFinite(n) ? n : 0;
  };
  /* moeda: a escolhida no perfil ou, se ficar em "Automática", a do país do aparelho (fuso horário e idioma do navegador) */
  var PAIS_MOEDA = { BR: 'BRL', PT: 'EUR', ES: 'EUR', FR: 'EUR', IT: 'EUR', DE: 'EUR', IE: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', LU: 'EUR', FI: 'EUR', GR: 'EUR',
    US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', CH: 'CHF', MX: 'MXN', AR: 'ARS', CL: 'CLP', JP: 'JPY', NZ: 'NZD', CO: 'COP', PE: 'PEN', UY: 'UYU', PY: 'PYG', AO: 'AOA', MZ: 'MZN', CV: 'CVE', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN' };
  var FUSO_PAIS = { 'America/Sao_Paulo': 'BR', 'America/Bahia': 'BR', 'America/Fortaleza': 'BR', 'America/Recife': 'BR', 'America/Belem': 'BR', 'America/Manaus': 'BR', 'America/Cuiaba': 'BR', 'America/Campo_Grande': 'BR', 'America/Porto_Velho': 'BR', 'America/Boa_Vista': 'BR', 'America/Rio_Branco': 'BR', 'America/Maceio': 'BR', 'America/Araguaina': 'BR', 'America/Santarem': 'BR', 'America/Noronha': 'BR',
    'Europe/Lisbon': 'PT', 'Atlantic/Madeira': 'PT', 'Atlantic/Azores': 'PT', 'Europe/Madrid': 'ES', 'Europe/Paris': 'FR', 'Europe/Rome': 'IT', 'Europe/Berlin': 'DE', 'Europe/Dublin': 'IE', 'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE', 'Europe/Vienna': 'AT', 'Europe/Luxembourg': 'LU', 'Europe/Helsinki': 'FI', 'Europe/Athens': 'GR',
    'Europe/London': 'GB', 'Europe/Zurich': 'CH', 'America/Mexico_City': 'MX', 'America/Argentina/Buenos_Aires': 'AR', 'America/Buenos_Aires': 'AR', 'America/Santiago': 'CL', 'Asia/Tokyo': 'JP', 'Pacific/Auckland': 'NZ', 'America/Bogota': 'CO', 'America/Lima': 'PE', 'America/Montevideo': 'UY', 'America/Asuncion': 'PY', 'Africa/Luanda': 'AO', 'Africa/Maputo': 'MZ', 'Atlantic/Cape_Verde': 'CV', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK', 'Europe/Warsaw': 'PL' };
  PL.moedaPais = (function () {
    var fuso = ''; try { fuso = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var pais = FUSO_PAIS[fuso];
    if (!pais && /^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Indiana)/.test(fuso)) pais = 'US';
    if (!pais && /^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Regina|St_Johns)/.test(fuso)) pais = 'CA';
    if (!pais && /^Australia\//.test(fuso)) pais = 'AU';
    if (!pais) { var m = /-([A-Z]{2})$/.exec(navigator.language || ''); if (m) pais = m[1]; }
    return PAIS_MOEDA[pais] || 'BRL';
  })();
  PL.moeda = function () { return (PL.s && PL.s.perfil && PL.s.perfil.moeda) || PL.moedaPais; };
  PL.simbolo = function () { try { return (0).toLocaleString(PL.loc, { style: 'currency', currency: PL.moeda() }).replace(/[\d\s.,\u00a0]/g, ''); } catch (e) { return 'R$'; } };
  PL.brl = function (n) { return (n || 0).toLocaleString(PL.loc, { style: 'currency', currency: PL.moeda() }); };
  PL.dec = function (n) { return n ? n.toLocaleString(PL.loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''; };
  PL.hoje = function () { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  PL.iso = function (d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  PL.dataBR = function (iso) { if (!iso) return ''; return new Date(iso + 'T12:00:00').toLocaleDateString(PL.loc, { day: '2-digit', month: '2-digit', year: 'numeric' }); };
  PL.dataLonga = function (iso) { if (!iso) return ''; return new Date(iso + 'T12:00:00').toLocaleDateString(PL.loc, { day: 'numeric', month: 'long', year: 'numeric' }); };
  PL.pct = function (a, b) { return b ? Math.round(a / b * 100) : 0; };
  PL.casal = function () {
    var p = PL.s.perfil, n = [p.noiva, p.noivo].filter(Boolean);
    return n.length ? n.join(' & ') : PL.t('Nosso casamento');
  };

  /* ---------- estado ---------- */
  function lista(arr) {
    return (arr || []).map(function (x) { return Array.isArray(x) ? { id: PL.uid(), t: PL.t(x[0]), s: PL.t(x[1]), ok: false } : { id: PL.uid(), t: PL.t(x), ok: false }; });
  }
  PL.lista = lista;
  PL.novo = function () {
    return {
      v: 1,
      perfil: { noiva: '', noivo: '', data: '', hora: '', cidade: '', local: '', orcamento: 0, tema: 'roxo', moeda: '' },
      gastos: [], fornecedores: [], tarefas: [], agenda: [], contratos: [],
      papelaria: { pre: lista(D.papelaria.pre), cer: lista(D.papelaria.cer), festa: lista(D.papelaria.festa) },
      identidade: { cores: [], fontes: [], notas: '' },
      convites: { tipo: 'ambos', inicio: '', fim: '', prazo: '', link: '' },
      padrinhos: [], votos: { noiva: '', noivo: '' },
      civil: { cartorio: '', endereco: '', data: '', hora: '', oficial: '', processo: '', obs: '', docs: lista(D.civil), itens: lista(D.civilItens) },
      convidados: [], mesas: [], cortejo: [], playlist: [], enxoval: [],
      luamel: { destino: '', ida: '', volta: '', hospedagem: '', voo: '', orcamento: 0, obs: '', prep: lista([].concat.apply([], D.luamel.map(function (g) { return g[1]; }))) },
      eventos: [], moodboard: []
    };
  };
  /* versões antigas: contratos viraram um campo do fornecedor */
  function migrar(s) {
    if (s.contratos && s.contratos.length) {
      s.fornecedores = s.fornecedores || [];
      s.contratos.forEach(function (c) {
        var f = s.fornecedores.find(function (x) { return (x.nome || '').trim().toLowerCase() === (c.nome || '').trim().toLowerCase(); });
        if (f) { if (!f.contrato) f.contrato = c.link || ''; }
        else s.fornecedores.push({ id: PL.uid(), cat: 'Outro', nome: c.nome, contato: '', valor: 0, status: /Assinado|Pago/.test(c.status) ? 'Contratado' : 'Negociando', obs: '', contrato: c.link || '' });
      });
      s.contratos = [];
    }
    return s;
  }
  function carregar() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(CHAVE) || 'null'); } catch (e) { s = null; }
    var base = PL.novo();
    if (!s || typeof s !== 'object') return base;
    Object.keys(base).forEach(function (k) {
      if (s[k] == null) s[k] = base[k];
      else if (!Array.isArray(base[k]) && typeof base[k] === 'object') {
        Object.keys(base[k]).forEach(function (k2) { if (s[k][k2] == null) s[k][k2] = base[k][k2]; });
      }
    });
    return migrar(s);
  }
  PL.s = carregar();
  /* troca a chave do armazenamento local (uma por conta) e recarrega */
  PL.usarChave = function (k) { CHAVE = k; PL.s = carregar(); };
  PL.normalizar = function (s) {
    var base = PL.novo();
    if (!s || typeof s !== 'object') return base;
    Object.keys(base).forEach(function (k) {
      if (s[k] == null) s[k] = base[k];
      else if (!Array.isArray(base[k]) && typeof base[k] === 'object') Object.keys(base[k]).forEach(function (k2) { if (s[k][k2] == null) s[k][k2] = base[k][k2]; });
    });
    return migrar(s);
  };
  PL.temDados = function (s) { s = s || PL.s; return !!(s.perfil.noiva || s.perfil.noivo || s.perfil.data || s.gastos.length || s.convidados.length || s.tarefas.length || s.fornecedores.length); };
  var tSalvar = null;
  PL.salvar = function (ja) {
    clearTimeout(tSalvar);
    var f = function () {
      try { localStorage.setItem(CHAVE, JSON.stringify(PL.s)); }
      catch (e) { PL.toast('Não deu para salvar: o espaço deste navegador acabou. Remova algumas imagens do mural ou faça um backup.'); }
      if (PL.aoSalvar) PL.aoSalvar();
    };
    if (ja) f(); else tSalvar = setTimeout(f, 250);
  };
  window.addEventListener('pagehide', function () { PL.salvar(true); });

  /* caminho "eventos/ID/tarefas" + id do item */
  PL.alvo = function (p, id) {
    var o = PL.s;
    (p || '').split('/').forEach(function (seg) {
      if (!seg || o == null) return;
      o = Array.isArray(o) ? o.find(function (x) { return x.id === seg; }) : o[seg];
    });
    if (id && Array.isArray(o)) o = o.find(function (x) { return x.id === id; });
    return o;
  };
  PL.add = function (p, obj) { var arr = PL.alvo(p); obj.id = PL.uid(); arr.push(obj); PL.salvar(); return obj; };

  /* ---------- módulos e rotas ---------- */
  PL.grupo = function (titulo) { PL.grupos.push({ titulo: titulo, itens: [] }); };
  PL.mod = function (id, def) {
    def.id = id; PL.mods[id] = def; PL.ordem.push(id);
    PL.grupos[PL.grupos.length - 1].itens.push(id);
  };
  /* menu em 5 áreas, cada uma com abas */
  PL.AREAS = [
    { nome: 'Início', icone: 'casa', mods: ['inicio', 'tarefas', 'agenda'] },
    { nome: 'Dinheiro', icone: 'din', mods: ['financeiro', 'fornecedores', 'biblioteca'] },
    { nome: 'Pessoas', icone: 'grupo', mods: ['convidados', 'mesas', 'padrinhos', 'convites', 'cortejo'] },
    { nome: 'Cerimônia', icone: 'taca', mods: ['civil', 'votos', 'playlist', 'identidade', 'eventos', 'moodboard'] },
    { nome: 'Bônus', icone: 'presente', mods: ['bonus', 'guia', 'enxoval', 'luamel'] }
  ];
  PL.areaDe = function (id) { return PL.AREAS.find(function (a) { return a.mods.indexOf(id) >= 0; }); };
  PL.rota = function () { var h = (location.hash || '').replace('#', '').split('/')[0]; return PL.mods[h] ? h : 'inicio'; };
  PL.ir = function (id) { if (location.hash !== '#' + id) location.hash = id; else PL.render(); };

  var main, menu, miniCasal, baixo, rodape;
  PL.render = function (manterFoco) {
    var id = PL.rota(), m = PL.mods[id];
    document.documentElement.setAttribute('data-tema', PL.s.perfil.tema || 'roxo');
    var chave = manterFoco && document.activeElement && document.activeElement.getAttribute('data-k');
    var y = window.scrollY;
    var html = '<div class="print-cab">' + PL.esc(PL.casal()) + (PL.s.perfil.data ? ' · ' + PL.dataLonga(PL.s.perfil.data) : '') + ' · ' + PL.esc(PL.t(m.titulo)) + '</div>';
    var area = PL.areaDe(id);
    if (area && area.mods.length > 1) html += '<nav class="abas no-print" aria-label="' + PL.esc(area.nome) + '">' + area.mods.map(function (mid) {
      var mm = PL.mods[mid]; return '<a href="#' + mid + '" data-act="ir" data-to="' + mid + '" class="' + (mid === id ? 'on' : '') + '"' + (mid === id ? ' aria-current="page"' : '') + '>' + PL.esc(mm.menu || mm.titulo) + '</a>';
    }).join('') + '</nav>';
    main.innerHTML = html + m.render();
    if (m.depois) m.depois(main);
    pintarMenu(id, area);
    document.title = PL.t(m.titulo) + ' · Planner CheckLove';
    pintarMini();
    if (manterFoco) {
      window.scrollTo(0, y);
      if (chave) { var el = main.querySelector('[data-k="' + chave.replace(/"/g, '\\"') + '"]'); if (el && el.type !== 'checkbox') { el.focus({ preventScroll: true }); try { var n = el.value.length; el.setSelectionRange(n, n); } catch (e) {} } }
    }
    tick();
  };
  function pintarMenu(id, area) {
    menu.innerHTML = PL.AREAS.filter(function (a) { return a.mods[0] !== 'bonus'; }).map(function (a) {
      var on = a === area;
      return '<a href="#' + a.mods[0] + '" data-act="ir" data-to="' + a.mods[0] + '" class="' + (on ? 'on' : '') + '">' + PL.ic(a.icone) + PL.esc(a.nome) + '</a>' +
        (on ? '<div class="sub">' + a.mods.map(function (mid) { var mm = PL.mods[mid]; return '<a href="#' + mid + '" data-act="ir" data-to="' + mid + '" class="' + (mid === id ? 'on' : '') + '">' + PL.esc(mm.menu || mm.titulo) + '</a>'; }).join('') + '</div>' : '');
    }).join('') + '<a href="#perfil" data-act="ir" data-to="perfil" class="' + (id === 'perfil' ? 'on' : '') + '">' + PL.ic('user') + 'Perfil</a>';
    /* no celular: Bônus fica no ícone do topo e Perfil entra no lugar dele na barra de baixo */
    baixo.innerHTML = PL.AREAS.filter(function (a) { return a.mods[0] !== 'bonus'; }).map(function (a) {
      return '<a href="#' + a.mods[0] + '" data-act="ir" data-to="' + a.mods[0] + '" class="' + (a === area ? 'on' : '') + '">' + PL.ic(a.icone) + '<span>' + PL.esc(a.nome) + '</span></a>';
    }).join('') + '<a href="#perfil" data-act="ir" data-to="perfil" class="' + (id === 'perfil' ? 'on' : '') + '">' + PL.ic('user') + '<span>Perfil</span></a>';
    var bt = document.getElementById('topo-bonus'); if (bt) bt.classList.toggle('on', !!area && area.mods[0] === 'bonus');
    var naBonus = !!area && area.mods[0] === 'bonus';
    rodape.querySelectorAll('a[data-to]').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-to') === 'bonus' ? naBonus : a.getAttribute('data-to') === id); });
  }
  function pintarMini() {
    var p = PL.s.perfil, d = PL.dias();
    miniCasal.innerHTML = '<b>' + PL.esc(PL.casal()) + '</b><span>' + PL.esc(p.data ? (d > 1 ? PL.t('Faltam {n} dias', { n: d }) : d === 1 ? PL.t('Falta 1 dia') : d === 0 ? PL.t('É hoje!') : PL.dataBR(p.data)) : PL.t('Defina a data no perfil')) + '</span>';
  }
  PL.dias = function () {
    var p = PL.s.perfil; if (!p.data) return null;
    var alvo = new Date(p.data + 'T00:00:00'), h = new Date(); h.setHours(0, 0, 0, 0);
    return Math.round((alvo - h) / 864e5);
  };

  /* contagem regressiva ao vivo */
  function tick() {
    var els = document.querySelectorAll('[data-cd]'); if (!els.length) return;
    var p = PL.s.perfil; if (!p.data) return;
    var alvo = new Date(p.data + 'T' + (p.hora || '00:00') + ':00'), ms = Math.max(0, alvo - new Date());
    var v = { d: Math.floor(ms / 864e5), h: Math.floor(ms / 36e5) % 24, m: Math.floor(ms / 6e4) % 60, s: Math.floor(ms / 1e3) % 60 };
    els.forEach(function (el) { var k = el.getAttribute('data-cd'); el.textContent = k === 'd' ? v.d : String(v[k]).padStart(2, '0'); });
  }
  setInterval(tick, 1000);

  /* ---------- eventos delegados ---------- */
  function valorDe(el) {
    if (el.type === 'checkbox') return el.checked;
    if (el.getAttribute('data-t') === 'n') return PL.num(el.value);
    return el.value;
  }
  function aplicar(el) {
    var p = el.getAttribute('data-p'); if (p == null) return false;
    var o = PL.alvo(p, el.getAttribute('data-id')); if (!o) return false;
    o[el.getAttribute('data-f')] = valorDe(el);
    if (PL.aoMudar) PL.aoMudar(p, el.getAttribute('data-id'), el.getAttribute('data-f'), o);
    PL.salvar();
    return true;
  }
  var tRender = null;
  function agendarRender() { clearTimeout(tRender); tRender = setTimeout(function () { PL.render(true); }, 0); }

  document.addEventListener('input', function (e) {
    var el = e.target;
    if (el.matches('[data-busca]')) { filtrar(el); return; }
    if (el.type === 'checkbox' || el.tagName === 'SELECT') return;
    aplicar(el);
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (!el.hasAttribute('data-p')) return;
    if (aplicar(el) && el.getAttribute('data-r') !== '0') agendarRender();
  });
  function filtrar(el) {
    var q = el.value.trim().toLowerCase();
    document.querySelectorAll(el.getAttribute('data-busca')).forEach(function (row) {
      row.hidden = q && (row.getAttribute('data-txt') || '').toLowerCase().indexOf(q) < 0;
    });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-act]'); if (!a) return;
    var f = PL.acoes[a.getAttribute('data-act')]; if (!f) return;
    e.preventDefault();
    f(a.dataset, a, e);
  });
  document.addEventListener('submit', function (e) {
    var form = e.target, nome = form.getAttribute('data-form'); if (!nome || !PL.forms[nome]) return;
    e.preventDefault();
    var dados = {};
    new FormData(form).forEach(function (v, k) { dados[k] = typeof v === 'string' ? v.trim() : v; });
    var r = PL.forms[nome](dados, form);
    if (r === false) return;
    var chaveForm = form.getAttribute('data-k') || nome;
    PL.render(true);
    var nova = main.querySelector('form[data-k="' + chaveForm + '"]') || main.querySelector('form[data-form="' + nome + '"]');
    if (nova) { var c = nova.querySelector('input:not([type=hidden]):not([type=checkbox]),select'); if (c) c.focus(); }
  });

  /* ações comuns */
  var desfeito = null;
  PL.acoes.del = function (d) {
    var arr = PL.alvo(d.p); if (!Array.isArray(arr)) return;
    var i = arr.findIndex(function (x) { return x.id === d.id; }); if (i < 0) return;
    var item = arr.splice(i, 1)[0];
    if (d.p === 'mesas') PL.s.convidados.forEach(function (c) { if (c.mesa === item.id) c.mesa = ''; });
    desfeito = { arr: arr, i: i, item: item };
    if (PL.aoRemover) PL.aoRemover(d.p, item);
    PL.salvar(); PL.render(true);
    PL.toast('Item removido.', 'Desfazer', 'desfazer');
  };
  PL.acoes.desfazer = function () {
    if (!desfeito) return;
    desfeito.arr.splice(desfeito.i, 0, desfeito.item); desfeito = null;
    PL.salvar(); PL.render(true); PL.toast('Item restaurado.');
  };
  PL.acoes.mover = function (d) {
    var arr = PL.alvo(d.p), i = arr.findIndex(function (x) { return x.id === d.id; }), j = i + Number(d.dir);
    if (i < 0 || j < 0 || j >= arr.length) return;
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t; PL.salvar(); PL.render(true);
  };
  PL.acoes.ir = function (d) { PL.ir(d.to); fecharMenu(); };
  PL.acoes.print = function () { window.print(); };
  PL.acoes.menu = function () { document.body.classList.toggle('menu-aberto'); };
  PL.acoes.fechar = fecharMenu;
  PL.acoes.copiar = function (d, el) {
    var alvo = d.alvo ? document.querySelector(d.alvo) : null, txt = alvo ? (alvo.value != null && alvo.tagName !== 'DIV' && alvo.tagName !== 'P' ? alvo.value : alvo.innerText) : (d.txt || '');
    PL.copiar(txt);
  };
  PL.copiar = function (txt) {
    var ok = function () { PL.toast('Copiado.'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, fallback); else fallback();
    function fallback() {
      var t = document.createElement('textarea'); t.value = txt; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); ok(); } catch (e) { PL.toast('Selecione o texto e copie manualmente.'); }
      t.remove();
    }
  };
  /* item de checklist genérico: form "chk" com campo oculto p */
  PL.forms.chk = function (d) { if (!d.t) return false; PL.add(d.p, { t: d.t, ok: false }); };
  function fecharMenu() { document.body.classList.remove('menu-aberto'); }

  /* toast */
  var tToast = null;
  PL.toast = function (msg, botao, acao) {
    var t = document.getElementById('toast');
    t.innerHTML = '<span>' + PL.esc(msg) + '</span>' + (botao ? '<button type="button" data-act="' + acao + '">' + PL.esc(botao) + '</button>' : '');
    t.hidden = false; clearTimeout(tToast); tToast = setTimeout(function () { t.hidden = true; }, botao ? 6000 : 2600);
  };

  /* arquivos */
  PL.baixar = function (nome, conteudo, tipo) {
    var b = new Blob([conteudo], { type: tipo || 'text/plain;charset=utf-8' }), a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = nome; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  PL.csv = function (nome, cab, linhas) {
    var q = function (v) { v = String(v == null ? '' : v); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var txt = '﻿' + [cab].concat(linhas).map(function (l) { return l.map(q).join(';'); }).join('\n');
    PL.baixar(nome + '.csv', txt, 'text/csv;charset=utf-8');
  };

  /* ---------- componentes ---------- */
  var IC = {
    casa: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    din: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9.5v5M18 9.5v5"/>',
    forn: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    tarefa: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    pasta: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    papel: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h6"/>',
    gota: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    carta: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    duo: '<circle cx="8" cy="8" r="3.2"/><circle cx="16.5" cy="8.5" r="2.7"/><path d="M2.5 20a5.5 5.5 0 0 1 11 0M13.5 20a4.5 4.5 0 0 1 8 0"/>',
    pena: '<path d="M20 4c-6 0-12 4-14 12l-2 4 4-2c8-2 12-8 12-14z"/><path d="M6 16 14 8"/>',
    selo: '<circle cx="12" cy="9" r="5"/><path d="M9 13.5 7.5 21 12 19l4.5 2-1.5-7.5"/>',
    grupo: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
    mesa: '<circle cx="12" cy="12" r="5"/><circle cx="12" cy="3.5" r="1.5"/><circle cx="12" cy="20.5" r="1.5"/><circle cx="3.5" cy="12" r="1.5"/><circle cx="20.5" cy="12" r="1.5"/>',
    fila: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    musica: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    sofa: '<path d="M4 11V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3"/><path d="M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2z"/><path d="M5 18v2M19 18v2"/>',
    aviao: '<path d="M2.5 13.5 21 6l-4 14-5.5-5.5L8 18l-.5-5z"/><path d="m11.5 14.5 5-5"/>',
    taca: '<path d="M8 3h8l-1 7a3 3 0 0 1-6 0z"/><path d="M12 13v8M8.5 21h7"/>',
    foto: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 16-5-5L5 21"/>',
    livro: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>',
    ajuda: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 1-1 1.7v.5"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
    lixo: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-13M9 7V4h6v3"/>',
    cima: '<path d="m6 15 6-6 6 6"/>', baixo: '<path d="m6 9 6 6 6-6"/>',
    print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
    tabela: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>',
    copiar: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    link: '<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
    presente: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M12 8v13"/><path d="M12 8S10.5 3 8 3.5 6.5 8 12 8zM12 8s1.5-5 4-4.5S17.5 8 12 8z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', mais: '<path d="M12 5v14M5 12h14"/>'
  };
  PL.ic = function (n) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[n] || '') + '</svg>'; };

  var U = PL.ui = {};
  U.cab = function (pre, titulo, sub, acoes) {
    return '<header class="cab"><div><div class="pre">' + PL.esc(pre) + '</div><h1>' + titulo + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' +
      (acoes && acoes.length ? '<div class="acoes no-print">' + acoes.join('') + '</div>' : '') + '</header>';
  };
  U.btn = function (act, rotulo, icone, cls, extra) {
    return '<button type="button" class="btn ' + (cls || 'sec') + '" data-act="' + act + '"' + (extra || '') + '>' + (icone ? PL.ic(icone) : '') + PL.esc(rotulo) + '</button>';
  };
  U.btnPrint = function () { return U.btn('print', 'Exportar PDF', 'print'); };
  function attrs(p, id, f) { return ' data-p="' + PL.esc(p) + '"' + (id ? ' data-id="' + id + '"' : '') + ' data-f="' + f + '" data-k="' + PL.esc(p + '|' + (id || '') + '|' + f) + '"'; }
  U.attrs = attrs;
  U.inp = function (p, id, f, v, o) {
    o = o || {};
    var tipo = o.tipo || 'text', val = v == null ? '' : v;
    if (o.n) { tipo = 'text'; val = PL.dec(v); }
    return '<input type="' + tipo + '"' + attrs(p, id, f) + ' value="' + PL.esc(val) + '"' + (o.n ? ' data-t="n" inputmode="decimal"' : '') +
      (o.ph ? ' placeholder="' + PL.esc(o.ph) + '"' : '') + (o.r === 0 ? ' data-r="0"' : '') + (o.lista ? ' list="' + o.lista + '"' : '') + (o.aria ? ' aria-label="' + PL.esc(o.aria) + '"' : '') + '>';
  };
  U.area = function (p, id, f, v, ph, linhas) {
    return '<textarea' + attrs(p, id, f) + ' data-r="0" rows="' + (linhas || 6) + '"' + (ph ? ' placeholder="' + PL.esc(ph) + '"' : '') + '>' + PL.esc(v) + '</textarea>';
  };
  U.sel = function (p, id, f, v, opts, aria) {
    return '<select' + attrs(p, id, f) + (aria ? ' aria-label="' + PL.esc(aria) + '"' : '') + '>' + opts.map(function (o) {
      var val = Array.isArray(o) ? o[0] : o, rot = Array.isArray(o) ? o[1] : o;
      return '<option value="' + PL.esc(val) + '"' + (String(val) === String(v) ? ' selected' : '') + '>' + PL.esc(rot) + '</option>';
    }).join('') + '</select>';
  };
  U.chk = function (p, id, f, v, aria) { return '<input type="checkbox"' + attrs(p, id, f) + (v ? ' checked' : '') + (aria ? ' aria-label="' + PL.esc(aria) + '"' : '') + '>'; };
  U.del = function (p, id) { return '<button type="button" class="ic" data-act="del" data-p="' + PL.esc(p) + '" data-id="' + id + '" aria-label="Remover" title="Remover">' + PL.ic('lixo') + '</button>'; };
  U.mov = function (p, id) {
    return '<button type="button" class="ic mov" data-act="mover" data-p="' + PL.esc(p) + '" data-id="' + id + '" data-dir="-1" aria-label="Subir">' + PL.ic('cima') + '</button>' +
      '<button type="button" class="ic mov" data-act="mover" data-p="' + PL.esc(p) + '" data-id="' + id + '" data-dir="1" aria-label="Descer">' + PL.ic('baixo') + '</button>';
  };
  U.campo = function (rotulo, html, cls) { return '<label class="campo' + (cls ? ' ' + cls : '') + '">' + PL.esc(rotulo) + html + '</label>'; };
  /* campo de formulário de adicionar (sem data-p) */
  U.f = function (nome, rotulo, o) {
    o = o || {};
    var html;
    if (o.opts) html = '<select name="' + nome + '">' + o.opts.map(function (x) { var v = Array.isArray(x) ? x[0] : x, r = Array.isArray(x) ? x[1] : x; return '<option value="' + PL.esc(v) + '"' + (o.v === v ? ' selected' : '') + '>' + PL.esc(r) + '</option>'; }).join('') + '</select>';
    else html = '<input name="' + nome + '" type="' + (o.tipo || 'text') + '"' + (o.ph ? ' placeholder="' + PL.esc(o.ph) + '"' : '') + (o.req ? ' required' : '') + (o.n ? ' inputmode="decimal"' : '') + (o.v != null ? ' value="' + PL.esc(o.v) + '"' : '') + (o.lista ? ' list="' + o.lista + '"' : '') + '>';
    return U.campo(rotulo, html, o.cls);
  };
  U.form = function (nome, campos, rotulo, extra) {
    return '<form class="form" data-form="' + nome + '" data-k="' + nome + (extra && extra.k ? '-' + extra.k : '') + '">' + campos.join('') + (extra && extra.hidden ? extra.hidden : '') +
      '<button class="btn" type="submit">' + PL.ic('mais') + PL.esc(rotulo || 'Adicionar') + '</button></form>';
  };
  U.vazio = function (txt) { return '<div class="vazio">' + txt + '</div>'; };
  U.kpis = function (itens) {
    return '<div class="kpis">' + itens.map(function (k) { return '<div class="kpi ' + (k.cls || '') + '"><span>' + PL.esc(k.r) + '</span><b>' + k.v + '</b>' + (k.s ? '<small>' + k.s + '</small>' : '') + '</div>'; }).join('') + '</div>';
  };
  U.prog = function (feitos, total) {
    var pc = PL.pct(feitos, total);
    return '<div class="prog"><div class="barra"><i style="width:' + pc + '%"></i></div><span>' + PL.esc(PL.t('{a} de {b} · {p}%', { a: feitos, b: total, p: pc })) + '</span></div>';
  };
  /* lista de checagem editável, guardada em p (array de {id,t,s,ok}) */
  U.checklist = function (p, itens, ph) {
    var html = '<ul class="chk">' + itens.map(function (it) {
      return '<li class="' + (it.ok ? 'ok' : '') + '">' + U.chk(p, it.id, 'ok', it.ok, 'Concluído') +
        '<div class="txt">' + U.inp(p, it.id, 't', it.t, { r: 0, aria: 'Item' }) + (it.s ? '<small>' + PL.esc(it.s) + '</small>' : '') + '</div>' + U.del(p, it.id) + '</li>';
    }).join('') + '</ul>';
    if (!itens.length) html = U.vazio('Nenhum item ainda.');
    return html + '<form class="add-linha" data-form="chk" data-k="chk-' + PL.esc(p) + '"><input type="hidden" name="p" value="' + PL.esc(p) + '"><input name="t" placeholder="' + PL.esc(ph || 'Adicionar item') + '" aria-label="Novo item"><button class="btn leve" type="submit">' + PL.ic('mais') + 'Adicionar</button></form>';
  };
  U.contagem = function () {
    var p = PL.s.perfil;
    if (!p.data) return '<section class="hero"><div class="pre">Contagem regressiva</div><h2>' + PL.esc(PL.casal()) + '</h2><p>Coloque a data do casamento no seu perfil para ver quanto tempo falta.</p><div style="margin-top:16px"><button type="button" class="btn leve" data-act="ir" data-to="perfil">Preencher o perfil</button></div></section>';
    return '<section class="hero"><div class="pre">Contagem regressiva</div><h2>' + PL.esc(PL.casal()) + '</h2><p>' + PL.dataLonga(p.data) + (p.hora ? ' · ' + p.hora : '') + (p.local ? ' · ' + PL.esc(p.local) : '') + '</p>' +
      '<div class="relogio"><div><b data-cd="d">0</b><span>dias</span></div><div><b data-cd="h">00</b><span>horas</span></div><div><b data-cd="m">00</b><span>min</span></div><div><b data-cd="s">00</b><span>seg</span></div></div></section>';
  };

  /* ---------- casca ---------- */
  PL.iniciar = function () {
    document.body.innerHTML =
      '<div class="topo-movel"><a class="marca" href="#inicio" data-act="ir" data-to="inicio"><b>Check<i>Love</i></b></a><span class="esp"></span>' +
      '<a class="ic" id="topo-bonus" href="#bonus" data-act="ir" data-to="bonus" aria-label="Bônus">' + PL.ic('presente') + '</a></div>' +
      '<div class="app"><aside class="lado" aria-label="Menu"><a class="marca" href="#inicio" data-act="ir" data-to="inicio"><div><b>Check<i>Love</i></b><small>Planner do casamento</small></div></a>' +
      '<div class="mini-casal" id="mini"></div><nav class="menu" id="menu"></nav>' +
      '<div class="lado-rodape" id="rodape"><a href="#bonus" data-act="ir" data-to="bonus">' + PL.ic('presente') + 'Bônus</a>' + (PL.rodapeLado || '') + '</div></aside>' +
      '<main class="principal"><div class="conteudo" id="main"></div></main></div><nav class="abas-baixo" id="baixo" aria-label="Áreas"></nav><div class="toast" id="toast" hidden role="status"></div>';
    main = document.getElementById('main'); menu = document.getElementById('menu'); miniCasal = document.getElementById('mini');
    baixo = document.getElementById('baixo'); rodape = document.getElementById('rodape');
    window.addEventListener('hashchange', function () { PL.render(); window.scrollTo(0, 0); });
    PL.render();
  };
})();
