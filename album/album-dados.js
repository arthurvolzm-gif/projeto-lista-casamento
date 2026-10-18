/* =========================================================
   Álbum dos convidados: acesso aos dados no Supabase.
   Usa o mesmo projeto e o mesmo login do convite (convite/config.js).
   ========================================================= */
(function () {
  const C = window.CONVITE_CONFIG || {};
  const sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
  const BUCKET = 'album';

  const slugBase = t => (String(t || 'album').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'album') + '-' + Math.random().toString(36).slice(2, 6);
  const urlPublica = caminho => sb.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;
  const ext = f => (f.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '') || (f.type.startsWith('video') ? 'mp4' : 'jpg');

  /* reduz foto grande antes de enviar (mantém boa qualidade para impressão) */
  function comprimir(file, max = 2400) {
    return new Promise(ok => {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return ok(file);
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        if (k === 1 && file.size < 3e6) { URL.revokeObjectURL(url); return ok(file); }
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(b => { URL.revokeObjectURL(url); ok(b || file); }, 'image/jpeg', 0.88);
      };
      img.onerror = () => ok(file); img.src = url;
    });
  }

  window.AlbumDados = {
    sb, urlPublica, comprimir,
    async sessao() { const { data } = await sb.auth.getSession(); return data.session; },
    async entrar(email, senha) { const { error } = await sb.auth.signInWithPassword({ email, password: senha }); if (error) throw error; },
    async criarConta(email, senha) { const { data, error } = await sb.auth.signUp({ email, password: senha, options: { emailRedirectTo: location.origin + '/album/painel' } }); if (error) throw error; return data; },
    async recuperar(email) { const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/album/painel' }); if (error) throw error; },
    async sair() { await sb.auth.signOut(); },

    /* álbum da pessoa logada (cria um se não existir, aproveitando os nomes do convite) */
    async meuAlbum() {
      const s = await this.sessao();
      let { data, error } = await sb.from('albuns').select('*').eq('user_id', s.user.id).order('criado_em').limit(1);
      if (error) throw error;
      if (data && data[0]) return data[0];
      let titulo = 'Nosso casamento', tema = 'oliva', dataC = null;
      const cv = await sb.from('convites').select('dados').eq('user_id', s.user.id).limit(1);
      if (cv.data && cv.data[0]) { const d = cv.data[0].dados || {}; if (d.noiva && d.noivo) titulo = `${d.noiva} & ${d.noivo}`; tema = d.tema || tema; dataC = d.data || null; }
      const ins = await sb.from('albuns').insert({ user_id: s.user.id, slug: slugBase(titulo.replace('&', 'e')), titulo, tema, data: dataC, mensagem: 'Compartilhe com a gente as fotos e os vídeos que você fizer hoje.' }).select().single();
      if (ins.error) throw ins.error; return ins.data;
    },
    async salvar(a) {
      const { data, error } = await sb.from('albuns').update({ slug: a.slug, titulo: a.titulo, data: a.data || null, mensagem: a.mensagem, capa: a.capa, tema: a.tema, convidados_veem: a.convidados_veem, ativo: a.ativo }).eq('id', a.id).select().single();
      if (error) throw error; return data;
    },
    async midias(albumId) {
      const { data, error } = await sb.from('album_midias').select('*').eq('album_id', albumId).order('criado_em', { ascending: false });
      if (error) throw error; return data.map(m => ({ ...m, url: urlPublica(m.caminho) }));
    },
    async apagar(m) {
      await sb.storage.from(BUCKET).remove([m.caminho]);
      const { error } = await sb.from('album_midias').delete().eq('id', m.id); if (error) throw error;
    },
    async enviarCapa(file) {
      const s = await this.sessao(), blob = await comprimir(file, 1800);
      const caminho = `capas/${s.user.id}/${Date.now()}.jpg`;
      const { error } = await sb.storage.from(BUCKET).upload(caminho, blob, { contentType: blob.type || 'image/jpeg' });
      if (error) throw error; return urlPublica(caminho);
    },

    /* convidado */
    async publico(slug) { const { data, error } = await sb.rpc('album_publico', { p_slug: slug }); if (error) throw error; return data; },
    async galeria(slug) { const { data, error } = await sb.rpc('midias_publicas', { p_slug: slug }); if (error) throw error; return (data || []).map(m => ({ ...m, url: urlPublica(m.caminho) })); },
    async enviar(album, slug, file, autor, aoProgresso) {
      const video = file.type.startsWith('video');
      const blob = video ? file : await comprimir(file);
      if (blob.size > 50 * 1024 * 1024) throw new Error('Arquivo maior que 50 MB. Envie um vídeo mais curto.');
      const caminho = `${album.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${blob === file ? ext(file) : 'jpg'}`;
      if (aoProgresso) aoProgresso(0.15);
      const { error } = await sb.storage.from(BUCKET).upload(caminho, blob, { contentType: blob.type || file.type, upsert: false });
      if (error) throw error;
      if (aoProgresso) aoProgresso(0.9);
      const r = await sb.rpc('registrar_midia', { p_slug: slug, p_caminho: caminho, p_tipo: video ? 'video' : 'foto', p_autor: autor || '' });
      if (r.error) throw r.error;
      if (aoProgresso) aoProgresso(1);
      return urlPublica(caminho);
    }
  };
})();
