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
    // Miembro dado de baja (inactivo): no entra al panel, salvo Administrador Web
    if (p && p.estado === 'aprobada' && p.miembro_id && p.rango < 8) {
      const { data: baja } = await sb.rpc('cuenta_de_baja');
      if (baja) p.estado = 'baja';
    }
    return p || { id: user.id, nombre: user.email, email: user.email, rango: 1, estado: 'pendiente' };
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
    // rango null = automático (según su rango in-game); un número = fijado a mano
    async cambiarRango(id, rango) {
      return ok(await sb.from('perfiles').update(rango == null ? { rango: 1, rango_manual: false } : { rango, rango_manual: true }).eq('id', id).select().single());
    },
    async borrarCuenta(id) { ok(await sb.rpc('borrar_cuenta', { p_perfil: id })); },

    async obtenerAjustes() {
      const filas = ok(await sb.from('ajustes').select('*'));
      return Object.fromEntries(filas.map(f => [f.clave, f.valor]));
    },
    async guardarAjuste(clave, valor) { ok(await sb.from('ajustes').update({ valor }).eq('clave', clave)); },

    async listarMiembros() { return ok(await sb.from('miembros').select('*').order('nombre')); },
    // Soldados y cabos (no son de la Legión): solo para planillas como Actividad BU y Ascensos de tropas
    async listarTropas() { return ok(await sb.from('tropas').select('*').order('nombre')); },
    // Legión + tropas (para planillas e historiales). Comparten numeración de ids.
    async listarPersonas() {
      const [m, t] = await Promise.all([sb.from('miembros').select('*').order('nombre'), sb.from('tropas').select('*').order('nombre')]);
      return [...ok(m), ...ok(t).map(x => ({ ...x, tropa: true }))];
    },
    // Orden manual dentro de cada rango (solo Administrador Web): [{ id, orden }]
    async ordenarMiembros(lista) { ok(await sb.rpc('ordenar_miembros', { p_orden: lista })); },
    // Modelo del retrato propio: 'iconico' | 'bu' | 'gm' | null (automático)
    async elegirModelo(modelo) { ok(await sb.rpc('elegir_modelo', { p_modelo: modelo })); },
    // Quiénes figuran en las planillas de BU (para saber quién está en la BU)
    async listarPlantelBU() {
      return ok(await sb.from('registros').select('miembro_id,anio,mes').eq('categoria', 'bu').eq('columna', '_plantel').not('valor', 'is', null)
        .order('anio', { ascending: false }).order('mes', { ascending: false }).limit(1000));
    },
    // La última planilla con nombres anterior a ese mes: [{ miembro_id, valor, anio, mes }]
    async plantelAnterior(categoria, anio, mes) {
      const filas = ok(await sb.from('registros').select('miembro_id,valor,anio,mes').eq('categoria', categoria).eq('columna', '_plantel')
        .not('valor', 'is', null).or(`anio.lt.${anio},and(anio.eq.${anio},mes.lt.${mes})`)
        .order('anio', { ascending: false }).order('mes', { ascending: false }).limit(1000));
      return filas.filter(r => r.anio === filas[0]?.anio && r.mes === filas[0]?.mes);
    },
    async guardarTropa(t) {
      const { id, ...datos } = t;
      if (id) return ok(await sb.from('tropas').update(datos).eq('id', id).select().single());
      return ok(await sb.from('tropas').insert(datos).select().single());
    },
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
        sb.from('tipos_actividad').select('*').order('orden'),   // también los inactivos, para nombrar actividades viejas
        sb.from('tipos_actividad_efectos').select('*'),
      ]);
      const t = ok(tipos), e = ok(efectos);
      return t.map(x => ({ ...x, efectos: e.filter(y => y.tipo === x.id) }));
    },
    async listarActividades(limite = 200) {
      return ok(await sb.from('actividades').select('*').order('creado_en', { ascending: false }).limit(limite));
    },
    // Actividades vigentes (no anuladas) con fecha entre desde y hasta (inclusive)
    async listarActividadesEntre(desde, hasta) {
      return ok(await sb.from('actividades').select('*').eq('anulada', false).gte('fecha', desde).lte('fecha', hasta)
        .order('fecha', { ascending: false }).limit(10000));
    },
    async registrarActividad(a) {
      return ok(await sb.rpc('registrar_actividad', { p_tipo: a.tipo, p_fecha: a.fecha, p_hora: a.hora || '',
        p_link: a.link, p_notas: a.notas || '', p_acompanantes: a.acompanantes || [], p_especializacion: a.especializacion || null,
        p_ayudantes: a.ayudantes || [] }));
    },
    async anularActividad(id) { return ok(await sb.rpc('anular_actividad', { p_id: id })); },
    // ---- Avisos de inactividad
    async listarInactividades() { return ok(await sb.from('inactividades').select('*').order('desde', { ascending: false })); },
    async listarInactividadesEntre(desde, hasta) {
      return ok(await sb.from('inactividades').select('*').lte('desde', hasta).gte('hasta', desde).order('desde'));
    },
    async crearInactividad(x) { return ok(await sb.from('inactividades').insert(x).select().single()); },
    async cancelarInactividad(id) { return ok(await sb.from('inactividades').update({ cancelada: true }).eq('id', id).select().single()); },
    async borrarInactividad(id) { ok(await sb.from('inactividades').delete().eq('id', id)); },
    // ---- Ascensos de tropas
    async listarRevisionesAscenso() { return ok(await sb.from('ascensos_revisiones').select('*').order('creado_en', { ascending: false })); },
    async obtenerRevisionAscenso(id) { return ok(await sb.from('ascensos_revisiones').select('*').eq('id', id).maybeSingle()); },
    async crearRevisionAscenso(r) { return ok(await sb.from('ascensos_revisiones').insert(r).select().single()); },
    // Guarda solo si nadie la modificó desde que se cargó (actualizado_en igual); si no, avisa.
    async guardarRevisionAscenso(id, cambios, actualizadoEn) {
      const filas = ok(await sb.from('ascensos_revisiones').update(cambios).eq('id', id).eq('actualizado_en', actualizadoEn).select());
      if (!filas.length) throw new Error('Otra persona modificó esta revisión mientras la editabas (o ya fue verificada). Recargá la página para ver la versión actual.');
      return filas[0];
    },
    async borrarRevisionAscenso(id) { ok(await sb.from('ascensos_revisiones').delete().eq('id', id)); },
    // Suma en la BU las misiones y entrenamientos BU de una revisión verificada (una sola vez) y deja los dudosos para revisar
    async aplicarBURevision(id, efectos, pendientes) {
      return ok(await sb.rpc('aplicar_bu_revision', { p_revision: id, p_efectos: efectos, p_pendientes: pendientes }));
    },
    async listarPendientesBU() { return ok(await sb.from('bu_pendientes').select('*').eq('estado', 'pendiente').order('creado_en')); },
    async resolverPendienteBU(id, miembroId) { ok(await sb.rpc('resolver_pendiente_bu', { p_id: id, p_miembro: miembroId || null })); },
    // ---- Reporte de bugs (tablas foro_*): lo leen y escriben todas las cuentas aprobadas
    async listarTemasForo() {
      const filas = ok(await sb.from('foro_temas').select('*, foro_comentarios(count)'));
      return filas.map(({ foro_comentarios, ...t }) => ({ ...t, n_comentarios: foro_comentarios?.[0]?.count ?? 0 }));
    },
    async guardarTemaForo(t) {
      const { id, ...datos } = t;
      if (id) return ok(await sb.from('foro_temas').update(datos).eq('id', id).select().single());
      return ok(await sb.from('foro_temas').insert(datos).select().single());
    },
    async borrarTemaForo(id) { ok(await sb.from('foro_temas').delete().eq('id', id)); },
    async listarComentariosForo(temaId) {
      return ok(await sb.from('foro_comentarios').select('*').eq('tema_id', temaId).order('creado_en').order('id'));
    },
    async guardarComentarioForo(c) {
      const { id, ...datos } = c;
      if (id) return ok(await sb.from('foro_comentarios').update({ texto: datos.texto, editado_en: new Date().toISOString() }).eq('id', id).select().single());
      return ok(await sb.from('foro_comentarios').insert(datos).select().single());
    },
    async borrarComentarioForo(id) { ok(await sb.from('foro_comentarios').delete().eq('id', id)); },
    // ---- Perfil de un miembro
    async listarRegistrosMiembro(miembroId) {
      const filas = [];
      for (let desde = 0; ; desde += 1000) {
        const lote = ok(await sb.from('registros').select('categoria,anio,mes,periodo,columna,valor')
          .eq('miembro_id', miembroId).range(desde, desde + 999));
        filas.push(...lote);
        if (lote.length < 1000) return filas;
      }
    },
    async listarActividadesMiembro(miembroId) {
      return ok(await sb.from('actividades').select('*').contains('participantes', [miembroId]).order('fecha', { ascending: false }));
    },
    async vincularMiembro(perfilId, miembroId) {
      ok(await sb.from('perfiles').update({ miembro_id: miembroId || null }).eq('id', perfilId));
    },
    // ---- Aprobación de cuentas nuevas
    // Crea el miembro (o pasa la tropa a la Legión), lo vincula y le da su rango, todo en un paso. miembro_id null = nuevo.
    async aprobarCuenta(perfilId, { miembro_id, grado, elite }) {
      return ok(await sb.rpc('aprobar_cuenta', { p_perfil: perfilId, p_miembro: miembro_id || null, p_grado: grado, p_elite: elite || '' }));
    },
    async cambiarEstadoCuenta(perfilId, estado) { ok(await sb.from('perfiles').update({ estado }).eq('id', perfilId)); },
    async completarDatosCuenta(d) {
      return ok(await sb.rpc('completar_datos_cuenta', { p_grado: d.grado, p_clon: d.clon, p_jedi: d.jedi, p_discord: d.discord }));
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
  const perfil = u => u && ({ id: u.id, nombre: u.nombre, email: u.email, rango: u.rango, rango_manual: !!u.rango_manual || u.rango >= 8, creado_en: u.creado_en, miembro_id: u.miembro_id || null,
    estado: u.estado || 'aprobada', decl_grado: u.decl_grado || null, decl_clon: u.decl_clon || null, decl_jedi: u.decl_jedi || null, decl_discord: u.decl_discord || null });
  const puedeEditar = db => { const u = usuarioActual(db); return !!u && (u.rango >= 8 || db.ajustes.modo_abierto === true); };
  const exigirEdicion = db => { if (!puedeEditar(db)) throw new Error('No tenés permiso para hacer esto.'); };
  const exigirAdmin = db => { const u = usuarioActual(db); if (!u || u.rango < 8 || (u.estado && u.estado !== 'aprobada')) throw new Error('No tenés permiso para hacer esto.'); };

  return {
    async registrar(email, pass, nombre) {
      await espera(); const db = leer();
      email = email.trim().toLowerCase();
      if (db.usuarios.some(u => u.email === email)) throw new Error('Ya existe una cuenta con ese email.');
      if (pass.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
      const u = { id: id(db), email, pass, nombre: nombre || email.split('@')[0],
        rango: db.usuarios.length ? 0 : 8, estado: db.usuarios.length ? 'datos' : 'aprobada', creado_en: new Date().toISOString() };
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
      const u = db.usuarios.find(u => u.id == uid), m = db.miembros.find(x => x.id === u.miembro_id);
      if (rango == null) Object.assign(u, { rango_manual: false, rango: m ? rangoWebDe(m.grado, m.elite) : u.rango });
      else Object.assign(u, { rango, rango_manual: true });
      escribir(db); return perfil(u);
    },
    async borrarCuenta(uid) {
      const db = leer(); exigirAdmin(db);
      if (usuarioActual(db).id == uid) throw new Error('No podés borrar tu propia cuenta.');
      db.usuarios = db.usuarios.filter(u => u.id != uid); escribir(db);
    },

    async obtenerAjustes() { return { ...leer().ajustes }; },
    async guardarAjuste(clave, valor) { const db = leer(); exigirAdmin(db); db.ajustes[clave] = valor; escribir(db); },

    async listarMiembros() { return leer().miembros.slice().sort((a, b) => a.nombre.localeCompare(b.nombre)); },
    async listarTropas() { return (leer().tropas || []).slice().sort((a, b) => a.nombre.localeCompare(b.nombre)); },
    async listarPersonas() { const db = leer(); return [...db.miembros, ...(db.tropas || []).map(x => ({ ...x, tropa: true }))]; },
    async elegirModelo(modelo) {
      const db = leer(); const m = db.miembros.find(x => x.id === usuarioActual(db).miembro_id);
      if (!m) throw new Error('Tu cuenta no está vinculada a un miembro de la legión.');
      m.modelo = modelo; escribir(db);
    },
    async listarPlantelBU() { return leer().registros.filter(r => r.categoria === 'bu' && r.columna === '_plantel' && r.valor != null); },
    async plantelAnterior(categoria, anio, mes) {
      const fs = leer().registros.filter(r => r.categoria === categoria && r.columna === '_plantel' && r.valor != null && r.anio * 100 + r.mes < anio * 100 + mes);
      const max = Math.max(0, ...fs.map(r => r.anio * 100 + r.mes));
      return fs.filter(r => r.anio * 100 + r.mes === max);
    },
    async guardarTropa(t) {
      const db = leer(); exigirEdicion(db); db.tropas = db.tropas || [];
      if (t.id) { const x = db.tropas.find(y => y.id == t.id); Object.assign(x, t); escribir(db); return { ...x }; }
      const n = { activo: true, elite: '', nombre_iconico: 'No', ...t, id: id(db) }; db.tropas.push(n); escribir(db); return n;
    },
    async ordenarMiembros(lista) {
      const db = leer(); exigirAdmin(db);
      for (const x of lista) { const m = db.miembros.find(y => y.id === x.id); if (m) m.orden = x.orden; }
      escribir(db);
    },
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
    async listarActividadesEntre() { return []; },
    async listarInactividades() { return (leer().inactividades || []).slice(); },
    async listarInactividadesEntre(d, h) { return (leer().inactividades || []).filter(x => x.desde <= h && x.hasta >= d); },
    async crearInactividad(x) {
      const db = leer(); db.inactividades = db.inactividades || [];
      const n = { ...x, id: id(db), autor_perfil: usuarioActual(db).id, creado_en: new Date().toISOString(), cancelada: false, cancelada_en: null };
      db.inactividades.push(n); escribir(db); return n;
    },
    async cancelarInactividad(iid) {
      const db = leer(); const x = db.inactividades.find(y => y.id === iid), hoy = new Date().toISOString().slice(0, 10);
      Object.assign(x, { cancelada: true, cancelada_en: new Date().toISOString() });
      if (x.desde <= hoy && x.hasta >= hoy) x.hasta = hoy;
      escribir(db); return x;
    },
    async borrarInactividad(iid) { const db = leer(); exigirAdmin(db); db.inactividades = (db.inactividades || []).filter(x => x.id !== iid); escribir(db); },
    async listarRevisionesAscenso() { return (leer().ascensos || []).slice().sort((a, b) => b.creado_en.localeCompare(a.creado_en)); },
    async obtenerRevisionAscenso(rid) { return (leer().ascensos || []).find(x => x.id === rid) || null; },
    async crearRevisionAscenso(r) {
      const db = leer(); db.ascensos = db.ascensos || []; const ahora = new Date().toISOString();
      const n = { ...r, id: id(db), estado: 'borrador', creado_por: usuarioActual(db).id, creado_en: ahora, actualizado_en: ahora, verificado_por: null, verificado_en: null };
      db.ascensos.push(n); escribir(db); return n;
    },
    async guardarRevisionAscenso(rid, cambios, actualizadoEn) {
      const db = leer(); const x = (db.ascensos || []).find(y => y.id === rid);
      if (!x || x.actualizado_en !== actualizadoEn) throw new Error('Otra persona modificó esta revisión mientras la editabas. Recargá la página.');
      const ahora = new Date().toISOString();
      Object.assign(x, cambios, { actualizado_en: ahora, actualizado_por: usuarioActual(db).id },
        cambios.estado === 'verificada' ? { verificado_por: usuarioActual(db).id, verificado_en: ahora } : cambios.estado === 'borrador' ? { verificado_por: null, verificado_en: null } : {});
      escribir(db); return x;
    },
    async borrarRevisionAscenso(rid) { const db = leer(); db.ascensos = (db.ascensos || []).filter(x => x.id !== rid); escribir(db); },
    async aplicarBURevision() { return 0; },
    async listarPendientesBU() { return leer().buPendientes || []; },
    async resolverPendienteBU(pid) { const db = leer(); db.buPendientes = (db.buPendientes || []).filter(x => x.id !== pid); escribir(db); },
    async listarTemasForo() {
      const db = leer();
      return (db.foroTemas || []).map(t => ({ ...t, n_comentarios: (db.foroComentarios || []).filter(c => c.tema_id === t.id).length }));
    },
    async guardarTemaForo(t) {
      const db = leer(); db.foroTemas = db.foroTemas || [];
      const ahora = new Date().toISOString();
      if (t.id) {
        const x = db.foroTemas.find(y => y.id === t.id);
        if ((t.titulo !== undefined || t.texto !== undefined) && x.autor !== usuarioActual(db).id) throw new Error('Solo quien escribió el tema puede editarlo.');
        Object.assign(x, t, t.titulo !== undefined ? { editado_en: ahora } : {}); escribir(db); return x;
      }
      const n = { fijado: false, ...t, id: id(db), autor: usuarioActual(db).id, creado_en: ahora, ultima_actividad: ahora, editado_en: null };
      db.foroTemas.push(n); escribir(db); return n;
    },
    async borrarTemaForo(tid) {
      const db = leer(); exigirAdmin(db);
      db.foroTemas = (db.foroTemas || []).filter(t => t.id !== tid);
      db.foroComentarios = (db.foroComentarios || []).filter(c => c.tema_id !== tid); escribir(db);
    },
    async listarComentariosForo(tid) { const db = leer(); return (db.foroComentarios || []).filter(c => c.tema_id === tid); },
    async guardarComentarioForo(c) {
      const db = leer(); db.foroComentarios = db.foroComentarios || [];
      const ahora = new Date().toISOString();
      if (c.id) { const x = db.foroComentarios.find(y => y.id === c.id); Object.assign(x, { texto: c.texto, editado_en: ahora }); escribir(db); return x; }
      const n = { ...c, id: id(db), autor: usuarioActual(db).id, creado_en: ahora, editado_en: null };
      db.foroComentarios.push(n);
      const t = (db.foroTemas || []).find(y => y.id === c.tema_id); if (t) t.ultima_actividad = ahora;
      escribir(db); return n;
    },
    async borrarComentarioForo(cid) { const db = leer(); exigirAdmin(db); db.foroComentarios = (db.foroComentarios || []).filter(c => c.id !== cid); escribir(db); },
    async listarRegistrosMiembro(mid) { return leer().registros.filter(r => r.miembro_id == mid); },
    async listarActividadesMiembro() { return []; },
    async registrarActividad() { throw new Error('El registro de actividades funciona solo con Supabase conectado.'); },
    async anularActividad() { throw new Error('El registro de actividades funciona solo con Supabase conectado.'); },
    async vincularMiembro(uid, miembroId) {
      const db = leer(); exigirAdmin(db);
      db.usuarios.find(u => u.id == uid).miembro_id = miembroId || null; escribir(db);
    },
    async aprobarCuenta(uid, { miembro_id, grado, elite }) {
      const db = leer(); exigirAdmin(db);
      const u = db.usuarios.find(u => u.id == uid);
      if (miembro_id && db.usuarios.some(x => x.id != uid && x.miembro_id == miembro_id)) throw new Error('Ese miembro ya está vinculado a otra cuenta.');
      let m;
      if (!miembro_id) { m = { id: id(db), nombre: u.decl_clon, nombre_jedi: u.decl_jedi || '', discord_id: u.decl_discord || '', elite: '', activo: true, creado_en: new Date().toISOString() }; db.miembros.push(m); }
      else if ((db.tropas || []).some(t => t.id == miembro_id)) { m = db.tropas.find(t => t.id == miembro_id); db.tropas = db.tropas.filter(t => t !== m); db.miembros.push(m); }
      else m = db.miembros.find(x => x.id == miembro_id);
      Object.assign(m, { grado, categoria: categoriaDeRango(grado) || m.categoria, activo: true, ...(elite ? { elite } : {}) });
      if (!esDeLegion(m)) throw new Error('Solo se aprueban cuentas de élites o de Sargento para arriba.');
      Object.assign(u, { estado: 'aprobada', miembro_id: m.id, rango: rangoWebDe(m.grado, m.elite) }); escribir(db);
      return perfil(u);
    },
    async cambiarEstadoCuenta(uid, estado) {
      const db = leer(); exigirAdmin(db); db.usuarios.find(u => u.id == uid).estado = estado; escribir(db);
    },
    async completarDatosCuenta(d) {
      const db = leer(); const u = usuarioActual(db);
      d.discord = String(d.discord || '').trim().replace(/^@+/, '');
      if (d.discord.length < 2 || d.discord.length > 40) throw new Error('Escribí tu usuario de Discord (2 a 40 caracteres).');
      Object.assign(u, { decl_grado: d.grado, decl_clon: d.clon, decl_jedi: d.jedi || null, decl_discord: d.discord, estado: 'pendiente' });
      escribir(db); return perfil(u);
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
