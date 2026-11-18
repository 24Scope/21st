/* =====================================================================
   CAPA DE DATOS
   Dos implementaciones con la misma interfaz:
   - ApiSupabase: datos reales compartidos (cuando config.js tiene las claves)
   - ApiDemo:     todo en localStorage, para probar sin configurar nada
   ===================================================================== */

const MODO_DEMO = !SUPABASE_URL || !SUPABASE_ANON_KEY;

/* ---------------------------------------------------------------- Supabase */
function crearApiSupabase() {
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const ok = ({ data, error }) => { if (error) throw traducirError(error); return data; };

  function traducirError(e) {
    const m = (e && e.message) || String(e);
    if (/Invalid login credentials/i.test(m)) return new Error('Email o contraseña incorrectos.');
    if (/Email not confirmed/i.test(m)) return new Error('Tenés que confirmar tu email antes de entrar (revisá tu correo).');
    if (/User already registered/i.test(m)) return new Error('Ya existe una cuenta con ese email.');
    if (/Password should be at least/i.test(m)) return new Error('La contraseña debe tener al menos 6 caracteres.');
    if (/row-level security/i.test(m)) return new Error('No tenés permiso para hacer esto.');
    if (/bloqueada/i.test(m)) return new Error('La celda está bloqueada.');
    if (/miembros_iconico_unico/i.test(m)) return new Error('Ese nombre icónico ya lo tiene otro miembro.');
    if (/perfiles_miembro_unico/i.test(m)) return new Error('Ese miembro ya está vinculado a otra cuenta.');
    return new Error(m);
  }

  async function perfilDe(user) {
    if (!user) return null;
    const p = ok(await sb.from('perfiles').select('*').eq('id', user.id).maybeSingle());
    return p || { id: user.id, nombre: user.email, email: user.email, rango: 1 };
  }

  return {
    async registrar(email, pass, nombre) {
      const d = ok(await sb.auth.signUp({ email, password: pass, options: { data: { nombre } } }));
      return d.session ? perfilDe(d.user) : null; // null = debe confirmar email
    },
    async entrar(email, pass) {
      const d = ok(await sb.auth.signInWithPassword({ email, password: pass }));
      return perfilDe(d.user);
    },
    async salir() { await sb.auth.signOut(); },
    async sesionActual() {
      const { data } = await sb.auth.getSession();
      return data.session ? perfilDe(data.session.user) : null;
    },

    async listarPerfiles() { return ok(await sb.from('perfiles').select('*').order('creado_en')); },
    async cambiarRango(id, rango) { ok(await sb.from('perfiles').update({ rango }).eq('id', id)); },

    async obtenerAjustes() {
      const filas = ok(await sb.from('ajustes').select('*'));
      return Object.fromEntries(filas.map(f => [f.clave, f.valor]));
    },
    async guardarAjuste(clave, valor) { ok(await sb.from('ajustes').update({ valor }).eq('clave', clave)); },

    async listarMiembros() { return ok(await sb.from('miembros').select('*').order('nombre')); },
    async guardarMiembro(m) {
      const { id, ...datos } = m;
      if (id) return ok(await sb.from('miembros').update(datos).eq('id', id).select().single());
      return ok(await sb.from('miembros').insert(datos).select().single());
    },
    async borrarMiembro(id) { ok(await sb.from('miembros').delete().eq('id', id)); },

    // hoja = { anio, mes, periodo }  (periodo = '' en los registros mensuales)
    async listarRegistros(categoria, hoja) {
      return ok(await sb.from('registros').select('*').match({ categoria, anio: hoja.anio, mes: hoja.mes, periodo: hoja.periodo || '' }));
    },
    async listarRegistrosAnio(anio) {
      const filas = [];
      for (let desde = 0; ; desde += 1000) {   // Supabase devuelve como máximo 1000 filas por consulta
        const lote = ok(await sb.from('registros').select('categoria,anio,mes,periodo,miembro_id,columna,valor').eq('anio', anio).range(desde, desde + 999));
        filas.push(...lote);
        if (lote.length < 1000) return filas;
      }
    },
    // celdas: [{categoria, anio, mes, miembro_id, columna, valor?, bloqueado?}]
    async guardarCeldas(celdas) {
      return ok(await sb.from('registros')
        .upsert(celdas.map(c => ({ periodo: '', ...c })), { onConflict: 'categoria,anio,mes,periodo,miembro_id,columna' })
        .select());
    },

    async listarEventos(desde, hasta) {
      return ok(await sb.from('eventos').select('*').gte('fecha', desde).lte('fecha', hasta).order('fecha').order('hora'));
    },
    async guardarEvento(e) {
      const { id, ...datos } = e;
      if (id) return ok(await sb.from('eventos').update(datos).eq('id', id).select().single());
      const { data: u } = await sb.auth.getUser();
      return ok(await sb.from('eventos').insert({ ...datos, creado_por: u.user?.id }).select().single());
    },
    async borrarEvento(id) { ok(await sb.from('eventos').delete().eq('id', id)); },

    async listarReglamento() { return ok(await sb.from('reglamento').select('*').order('orden').order('id')); },
    async guardarFilaReglamento(f) {
      const { id, creado_en, ...datos } = f;
      if (id) return ok(await sb.from('reglamento').update(datos).eq('id', id).select().single());
      return ok(await sb.from('reglamento').insert(datos).select().single());
    },
    async borrarFilaReglamento(id) { ok(await sb.from('reglamento').delete().eq('id', id)); },

    // ---- Actividades (las suma la base de datos con registrar_actividad / anular_actividad)
    async listarTiposActividad() {
      const [tipos, efectos] = await Promise.all([
        sb.from('tipos_actividad').select('*').eq('activo', true).order('orden'),
        sb.from('tipos_actividad_efectos').select('*'),
      ]);
      const t = ok(tipos), e = ok(efectos);
      return t.map(x => ({ ...x, efectos: e.filter(y => y.tipo === x.id) }));
    },
    async listarActividades(limite = 200) {
      return ok(await sb.from('actividades').select('*').order('creado_en', { ascending: false }).limit(limite));
    },
    async registrarActividad(a) {
      return ok(await sb.rpc('registrar_actividad', { p_tipo: a.tipo, p_fecha: a.fecha, p_hora: a.hora || '',
        p_link: a.link, p_notas: a.notas || '', p_acompanantes: a.acompanantes || [] }));
    },
    async anularActividad(id) { return ok(await sb.rpc('anular_actividad', { p_id: id })); },
    async vincularMiembro(perfilId, miembroId) {
      ok(await sb.from('perfiles').update({ miembro_id: miembroId || null }).eq('id', perfilId));
    },

    suscribir(tabla, alCambiar) {
      const canal = sb.channel('rt-' + tabla + '-' + Math.random().toString(36).slice(2))
        .on('postgres_changes', { event: '*', schema: 'public', table: tabla }, alCambiar)
        .subscribe();
      return () => sb.removeChannel(canal);
    },
  };
}

/* ---------------------------------------------------------------- Demo local */
function crearApiDemo() {
  const CLAVE = 'bd21_demo_v1';
  const SESION = 'bd21_demo_sesion';
  const nuevaBase = () => ({
    seq: 1, usuarios: [], miembros: [], registros: [], eventos: [], reglamento: [],
    ajustes: { modo_abierto: true },
  });
  const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || sembrar(); } catch { return sembrar(); } };
  const escribir = db => { try { localStorage.setItem(CLAVE, JSON.stringify(db)); } catch {} };
  const id = db => db.seq++;
  const espera = () => new Promise(r => setTimeout(r, 60));

  function sembrar() {
    const db = nuevaBase();
    const ejemplos = [
      ['Pepito', 'suboficiales', 'SGT'], ['Juan Pérez', 'cabos', 'CBO'],
      ['Marcos', 'oficiales', 'TTE'], ['Laura', 'comandantes', 'CMD'],
      ['Nico', 'suboficiales', 'SGTM'], ['Sofi', 'soldados', 'SDO1'], ['Tomás', 'soldados', 'SDO'],
    ];
    for (const [nombre, categoria, grado] of ejemplos)
      db.miembros.push({ id: id(db), nombre, categoria, grado, notas: '', activo: true, creado_en: new Date().toISOString() });
    db.reglamento.push({ id: id(db), orden: 1, bloqueado: true, datos: {
      titulo: 'Puntualidad', texto: '• Respetar el horario y ser puntual.\n• Ejemplo de sección bloqueada.' } });
    escribir(db);
    return db;
  }

  function usuarioActual(db) {
    let sid = null; try { sid = localStorage.getItem(SESION); } catch {}
    const u = db.usuarios.find(u => u.id == sid);
    return u || null;
  }
  const perfil = u => u && ({ id: u.id, nombre: u.nombre, email: u.email, rango: u.rango, creado_en: u.creado_en, miembro_id: u.miembro_id || null });
  const puedeEditar = db => { const u = usuarioActual(db); return !!u && (u.rango >= 2 || db.ajustes.modo_abierto === true); };
  const exigirEdicion = db => { if (!puedeEditar(db)) throw new Error('No tenés permiso para hacer esto.'); };
  const exigirAdmin = db => { const u = usuarioActual(db); if (!u || u.rango < 2) throw new Error('No tenés permiso para hacer esto.'); };

  return {
    async registrar(email, pass, nombre) {
      await espera(); const db = leer();
      email = email.trim().toLowerCase();
      if (db.usuarios.some(u => u.email === email)) throw new Error('Ya existe una cuenta con ese email.');
      if (pass.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
      const u = { id: id(db), email, pass, nombre: nombre || email.split('@')[0],
        rango: db.usuarios.length ? 1 : 2, creado_en: new Date().toISOString() };
      db.usuarios.push(u); escribir(db);
      try { localStorage.setItem(SESION, u.id); } catch {}
      return perfil(u);
    },
    async entrar(email, pass) {
      await espera(); const db = leer();
      const u = db.usuarios.find(u => u.email === email.trim().toLowerCase() && u.pass === pass);
      if (!u) throw new Error('Email o contraseña incorrectos.');
      try { localStorage.setItem(SESION, u.id); } catch {}
      return perfil(u);
    },
    async salir() { try { localStorage.removeItem(SESION); } catch {} },
    async sesionActual() { return perfil(usuarioActual(leer())); },

    async listarPerfiles() { return leer().usuarios.map(perfil); },
    async cambiarRango(uid, rango) {
      const db = leer(); exigirAdmin(db);
      db.usuarios.find(u => u.id == uid).rango = rango; escribir(db);
    },

    async obtenerAjustes() { return { ...leer().ajustes }; },
    async guardarAjuste(clave, valor) { const db = leer(); exigirAdmin(db); db.ajustes[clave] = valor; escribir(db); },

    async listarMiembros() { return leer().miembros.slice().sort((a, b) => a.nombre.localeCompare(b.nombre)); },
    async guardarMiembro(m) {
      const db = leer(); exigirEdicion(db);
      if (m.id) { const i = db.miembros.findIndex(x => x.id == m.id); db.miembros[i] = { ...db.miembros[i], ...m }; escribir(db); return db.miembros[i]; }
      const n = { ...m, id: id(db), creado_en: new Date().toISOString() }; db.miembros.push(n); escribir(db); return n;
    },
    async borrarMiembro(mid) {
      const db = leer(); exigirEdicion(db);
      db.miembros = db.miembros.filter(m => m.id != mid);
      db.registros = db.registros.filter(r => r.miembro_id != mid); escribir(db);
    },

    async listarRegistros(categoria, hoja) {
      return leer().registros.filter(r => r.categoria === categoria && r.anio === hoja.anio && r.mes === hoja.mes && (r.periodo || '') === (hoja.periodo || ''));
    },
    async listarRegistrosAnio(anio) { return leer().registros.filter(r => r.anio === anio); },
    async guardarCeldas(celdas) {
      await espera(); const db = leer(); exigirEdicion(db);
      const u = usuarioActual(db); const res = [];
      for (const c of celdas) {
        let r = db.registros.find(r => r.categoria === c.categoria && r.anio === c.anio && r.mes === c.mes
          && (r.periodo || '') === (c.periodo || '') && r.miembro_id == c.miembro_id && r.columna === c.columna);
        if (r && r.bloqueado && c.bloqueado !== false && 'valor' in c && c.valor !== r.valor)
          throw new Error('La celda está bloqueada.');
        if (!r) { r = { id: id(db), valor: null, bloqueado: false, ...c }; db.registros.push(r); }
        else Object.assign(r, c);
        r.actualizado_por = u.id; r.actualizado_en = new Date().toISOString();
        res.push({ ...r });
      }
      escribir(db); return res;
    },

    async listarEventos(desde, hasta) {
      return leer().eventos.filter(e => e.fecha >= desde && e.fecha <= hasta)
        .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
    },
    async guardarEvento(e) {
      const db = leer(); exigirEdicion(db);
      if (e.id) { const i = db.eventos.findIndex(x => x.id == e.id); db.eventos[i] = { ...db.eventos[i], ...e }; escribir(db); return db.eventos[i]; }
      const n = { ...e, id: id(db), creado_por: usuarioActual(db).id }; db.eventos.push(n); escribir(db); return n;
    },
    async borrarEvento(eid) { const db = leer(); exigirEdicion(db); db.eventos = db.eventos.filter(e => e.id != eid); escribir(db); },

    async listarReglamento() { return leer().reglamento.slice().sort((a, b) => a.orden - b.orden || a.id - b.id); },
    async guardarFilaReglamento(f) {
      const db = leer(); exigirEdicion(db);
      if (f.id) { const i = db.reglamento.findIndex(x => x.id == f.id); db.reglamento[i] = { ...db.reglamento[i], ...f }; escribir(db); return db.reglamento[i]; }
      const n = { datos: {}, bloqueado: false, ...f, id: id(db) }; db.reglamento.push(n); escribir(db); return n;
    },
    async borrarFilaReglamento(rid) { const db = leer(); exigirEdicion(db); db.reglamento = db.reglamento.filter(r => r.id != rid); escribir(db); },

    async listarTiposActividad() { return []; },
    async listarActividades() { return []; },
    async registrarActividad() { throw new Error('El registro de actividades funciona solo con Supabase conectado.'); },
    async anularActividad() { throw new Error('El registro de actividades funciona solo con Supabase conectado.'); },
    async vincularMiembro(uid, miembroId) {
      const db = leer(); exigirAdmin(db);
      db.usuarios.find(u => u.id == uid).miembro_id = miembroId || null; escribir(db);
    },

    suscribir(tabla, alCambiar) {
      // Otras pestañas del mismo navegador
      const h = e => { if (e.key === CLAVE) alCambiar({}); };
      window.addEventListener('storage', h);
      return () => window.removeEventListener('storage', h);
    },
  };
}

const api = MODO_DEMO ? crearApiDemo() : crearApiSupabase();
