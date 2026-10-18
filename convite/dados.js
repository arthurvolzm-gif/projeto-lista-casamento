/* =========================================================
   Acesso aos dados do convite (Supabase) com "modo demonstração"
   quando o config.js ainda não tem as chaves.
   ========================================================= */
(function () {
  const C = window.CONVITE_CONFIG || {};
  const ATIVO = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY && window.supabase);
  const sb = ATIVO ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY) : null;
  const LS = 'checklove_convite_demo', LSR = 'checklove_rsvp_demo';
  const ler = (k, p) => { try { return JSON.parse(localStorage.getItem(k)) || p; } catch (e) { return p; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  function slugBase(d) {
    const s = `${d.noiva || ''}-e-${d.noivo || ''}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return (s || 'convite') + '-' + Math.random().toString(36).slice(2, 6);
  }

  /* reduz a foto antes de enviar (máx. 1600 px, JPEG) */
  function comprimir(file, max = 1600) {
    return new Promise((ok, erro) => {
      if (!/^image\//.test(file.type)) return ok(file);
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(b => { URL.revokeObjectURL(url); ok(b); }, 'image/jpeg', 0.85);
      };
      img.onerror = erro; img.src = url;
    });
  }

  const API = {
    ativo: ATIVO,
    async sessao() { if (!ATIVO) return { user: { id: 'demo', email: 'modo demonstração' } }; const { data } = await sb.auth.getSession(); return data.session; },
    async entrar(email, senha) { const { error } = await sb.auth.signInWithPassword({ email, password: senha }); if (error) throw error; },
    async criarConta(email, senha) { const { data, error } = await sb.auth.signUp({ email, password: senha, options: { emailRedirectTo: location.origin + '/convite/editor' } }); if (error) throw error; return data; },
    async recuperar(email) { const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/convite/editor' }); if (error) throw error; },
    async novaSenha(senha) { const { error } = await sb.auth.updateUser({ password: senha }); if (error) throw error; },
    async sair() { if (ATIVO) await sb.auth.signOut(); },
    aoMudarSessao(fn) { if (ATIVO) sb.auth.onAuthStateChange((ev, s) => fn(ev, s)); },

    /* o convite da pessoa logada (cria um se ainda não existir) */
    async meuConvite() {
      if (!ATIVO) { let c = ler(LS, null); if (!c) { c = { id: 'demo', slug: 'demonstracao', publicado: true, dados: { ...window.CONVITE_PADRAO } }; gravar(LS, c); } return c; }
      const s = await API.sessao();
      let { data, error } = await sb.from('convites').select('*').eq('user_id', s.user.id).order('criado_em').limit(1);
      if (error) throw error;
      if (data && data[0]) return data[0];
      const dados = { ...window.CONVITE_PADRAO };
      const ins = await sb.from('convites').insert({ user_id: s.user.id, slug: slugBase(dados), dados, publicado: true }).select().single();
      if (ins.error) throw ins.error; return ins.data;
    },
    async salvar(c) {
      if (!ATIVO) { gravar(LS, c); return c; }
      const { data, error } = await sb.from('convites').update({ dados: c.dados, slug: c.slug, publicado: c.publicado, atualizado_em: new Date().toISOString() }).eq('id', c.id).select().single();
      if (error) throw error; return data;
    },
    async publico(slug) {
      if (!ATIVO) { const c = ler(LS, null); return c ? c.dados : null; }
      const { data, error } = await sb.rpc('convite_publico', { p_slug: slug });
      if (error) throw error; return data;
    },
    async confirmar(slug, r) {
      if (!ATIVO) { const l = ler(LSR, []); l.unshift({ ...r, criado_em: new Date().toISOString() }); gravar(LSR, l); return; }
      const { error } = await sb.rpc('confirmar_presenca', { p_slug: slug, p_nome: r.nome, p_telefone: r.telefone || '', p_pessoas: r.pessoas, p_vai: r.vai, p_mensagem: r.mensagem || '' });
      if (error) throw error;
    },
    async respostas(conviteId) {
      if (!ATIVO) return ler(LSR, []);
      const { data, error } = await sb.from('rsvp').select('*').eq('convite_id', conviteId).order('criado_em', { ascending: false });
      if (error) throw error; return data;
    },
    async enviarArquivo(file, pasta = 'fotos') {
      const blob = await comprimir(file);
      if (!ATIVO) return new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(blob); });
      const s = await API.sessao(), ext = blob.type === 'image/jpeg' ? 'jpg' : (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
      const caminho = `${s.user.id}/${pasta}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const { error } = await sb.storage.from(C.BUCKET).upload(caminho, blob, { contentType: blob.type || file.type, upsert: false });
      if (error) throw error;
      return sb.storage.from(C.BUCKET).getPublicUrl(caminho).data.publicUrl;
    },
    slugBase
  };
  window.ConviteDados = API;
})();
