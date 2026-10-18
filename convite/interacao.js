/* =========================================================
   Confirmação de presença e música de fundo (página pública e prévia).
   ========================================================= */
(function () {
  const esc = s => window.Convite.esc(s);

  function rsvp(raiz, slug, d, { prevista } = {}) {
    const t = window.Convite.tema(d.tema);
    let m = document.getElementById('rsvp');
    if (!m) { m = document.createElement('div'); m.id = 'rsvp'; m.className = 'rsvp'; document.body.appendChild(m); }
    m.style.cssText = `--fundo:${t.fundo};--texto:${t.texto};--dest:${t.destaque}`;
    const form = () => {
      m.innerHTML = `<div class="rsvp-box" role="dialog" aria-modal="true" aria-label="Confirmar presença">
        <h3>Confirmar presença</h3><p class="sub">${esc(d.noiva)} &amp; ${esc(d.noivo)}${d.prazoPresenca ? ' · até ' + esc(d.prazoPresenca.split('-').reverse().join('/')) : ''}</p>
        <div class="rsvp-op"><button type="button" data-vai="1" class="on">Vou comparecer</button><button type="button" data-vai="0">Não poderei ir</button></div>
        <label for="r-nome">Seu nome completo</label><input id="r-nome" maxlength="80" autocomplete="name">
        <div class="r-sim"><label for="r-pessoas">Quantas pessoas, contando você</label><select id="r-pessoas">${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<option>${n}</option>`).join('')}</select></div>
        <label for="r-tel">WhatsApp (opcional)</label><input id="r-tel" maxlength="20" inputmode="tel" autocomplete="tel">
        <label for="r-msg">Mensagem para os noivos (opcional)</label><textarea id="r-msg" maxlength="400"></textarea>
        <div class="rsvp-erro" id="r-erro"></div>
        <button class="rsvp-enviar" type="button">Enviar confirmação</button>
        <button class="rsvp-fechar" type="button">Fechar</button></div>`;
      let vai = true;
      m.querySelectorAll('[data-vai]').forEach(b => b.onclick = () => { vai = b.dataset.vai === '1'; m.querySelectorAll('[data-vai]').forEach(x => x.classList.toggle('on', x === b)); m.querySelector('.r-sim').style.display = vai ? '' : 'none'; });
      m.querySelector('.rsvp-fechar').onclick = () => m.classList.remove('on');
      m.querySelector('.rsvp-enviar').onclick = async () => {
        const nome = m.querySelector('#r-nome').value.trim(), erro = m.querySelector('#r-erro');
        if (nome.length < 3) { erro.textContent = 'Escreva o seu nome completo.'; return; }
        if (prevista) { ok(vai); return; }
        const b = m.querySelector('.rsvp-enviar'); b.disabled = true; b.textContent = 'Enviando...';
        try {
          await window.ConviteDados.confirmar(slug, { nome, pessoas: vai ? Number(m.querySelector('#r-pessoas').value) : 0, vai, telefone: m.querySelector('#r-tel').value.trim(), mensagem: m.querySelector('#r-msg').value.trim() });
          ok(vai);
        } catch (e) { erro.textContent = 'Não foi possível enviar agora. Tente de novo em instantes.'; b.disabled = false; b.textContent = 'Enviar confirmação'; }
      };
    };
    const ok = vai => {
      m.querySelector('.rsvp-box').innerHTML = `<div class="rsvp-ok"><b>${vai ? 'Presença confirmada!' : 'Obrigado por avisar'}</b><p>${vai ? 'Os noivos vão adorar saber que você vem.' : 'Os noivos receberam a sua resposta.'}</p></div>${prevista ? '<p class="sub">Na prévia a resposta não é salva.</p>' : ''}<button class="rsvp-fechar" type="button">Fechar</button>`;
      m.querySelector('.rsvp-fechar').onclick = () => m.classList.remove('on');
    };
    m.onclick = e => { if (e.target === m) m.classList.remove('on'); };
    raiz.querySelectorAll('[data-rsvp]').forEach(b => b.addEventListener('click', () => { form(); m.classList.add('on'); }));
  }

  function musica(d) {
    let b = document.getElementById('musica');
    if (!d.musica) { if (b) b.classList.remove('on'); return null; }
    if (!b) { b = document.createElement('button'); b.id = 'musica'; b.className = 'musica'; b.type = 'button'; b.setAttribute('aria-label', 'Ligar ou desligar a música'); b.innerHTML = window.Convite.ICONES.musica; document.body.appendChild(b); }
    const a = new Audio(d.musica); a.loop = true; a.preload = 'auto';
    const estado = () => { b.classList.toggle('tocando', !a.paused); b.classList.toggle('mudo', a.paused); };
    b.onclick = () => { a.paused ? a.play().catch(() => {}) : a.pause(); estado(); };
    a.addEventListener('play', estado); a.addEventListener('pause', estado);
    b.classList.add('on'); estado();
    return { tocar: () => a.play().then(estado).catch(estado), parar: () => { a.pause(); estado(); } };
  }

  window.ConviteInteracao = { rsvp, musica };
})();
