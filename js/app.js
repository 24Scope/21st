/* =====================================================================
   Base de Datos 21 — interfaz
   ===================================================================== */

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

const estado = {
  perfil: null,
  ajustes: {},
  seccion: 'inicio',
  anio: new Date().getFullYear(),
  mes: new Date().getMonth() + 1,
  cal: { anio: new Date().getFullYear(), mes: new Date().getMonth() + 1 },
  limpiezas: [],
};

/* ------------------------------------------------------------ utilidades */
const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const fechaISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const esAdmin = () => (estado.perfil?.rango ?? 0) >= 2;
const puedeEditar = () => esAdmin() || estado.ajustes.modo_abierto === true;
const nombreRango = r => RANGOS[r] || `Rango ${r}`;
const colorTipo = t => (TIPOS_EVENTO.find(x => x.nombre === t) || { color: '#64748b' }).color;
const numero = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(n) ? 0 : n; };
const formatoNum = n => Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');

function aviso(texto, tipo = '') {
  const el = document.createElement('div');
  el.className = 'aviso ' + tipo;
  el.textContent = texto;
  $('#avisos').appendChild(el);
  setTimeout(() => el.remove(), tipo === 'error' ? 5000 : 2600);
}
const fallo = e => { console.error(e); aviso(e.message || String(e), 'error'); };

function abrirModal(titulo, html, alMontar) {
  $('#modal-titulo').textContent = titulo;
  $('#modal-cuerpo').innerHTML = html;
  $('#modal-fondo').hidden = false;
  alMontar && alMontar($('#modal-cuerpo'));
  const primero = $('#modal-cuerpo input, #modal-cuerpo select, #modal-cuerpo textarea');
  primero && primero.focus();
}
function cerrarModal() { $('#modal-fondo').hidden = true; $('#modal-cuerpo').innerHTML = ''; }

function confirmar(titulo, mensaje, textoBoton = 'Confirmar') {
  return new Promise(resolver => {
    abrirModal(titulo, `<p style="margin:0 0 18px;line-height:1.5">${esc(mensaje)}</p>
      <div class="modal-pie"><button class="btn" data-no>Cancelar</button><button class="btn primario" data-si>${esc(textoBoton)}</button></div>`,
      c => {
        $('[data-no]', c).onclick = () => { cerrarModal(); resolver(false); };
        $('[data-si]', c).onclick = () => { cerrarModal(); resolver(true); };
      });
  });
}

function descargar(nombre, contenido, tipo = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob(['﻿' + contenido], { type: tipo }));
  const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const celdaCSV = v => { const s = String(v ?? ''); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

/* ------------------------------------------------------------ acceso */
let modoAcceso = 'entrar';

function mostrarAcceso() {
  $('#app').hidden = true;
  $('#pantalla-espera').hidden = true;
  $('#pantalla-acceso').hidden = false;
}

/* ------------------------------------------------------------ cuenta pendiente de aprobación */
let limpiarEspera = null;
function mostrarEspera(perfil) {
  estado.perfil = null;
  $('#app').hidden = true;
  $('#pantalla-acceso').hidden = true;
  $('#pantalla-espera').hidden = false;
  const rechazada = perfil.estado === 'rechazada';
  $('#espera-icono').textContent = rechazada ? '✕' : '⏳';
  $('#espera-titulo').textContent = rechazada ? 'Cuenta no aprobada' : 'Cuenta pendiente de aprobación';
  $('#espera-texto').textContent = rechazada
    ? 'Un administrador no aprobó esta cuenta. Si creés que es un error, hablá con un administrador de la legión.'
    : 'Tu cuenta se creó bien. Un administrador tiene que aprobarla y vincularla con tu nombre en la legión antes de que puedas entrar al panel. Esta pantalla se actualiza sola cuando te aprueben.';
  $('#espera-cuenta').textContent = `${perfil.nombre || ''} · ${perfil.email || ''}`;
  if (limpiarEspera) { try { limpiarEspera(); } catch {} limpiarEspera = null; }
  if (!rechazada && !MODO_DEMO) limpiarEspera = api.suscribir('perfiles', () => comprobarEspera(false));
}
async function comprobarEspera(conAviso = true) {
  try {
    const p = await api.sesionActual();
    if (!p) return mostrarAcceso();
    if (p.estado && p.estado !== 'aprobada') { mostrarEspera(p); if (conAviso) aviso('Tu cuenta todavía no fue aprobada.'); return; }
    if (limpiarEspera) { try { limpiarEspera(); } catch {} limpiarEspera = null; }
    $('#pantalla-espera').hidden = true;
    await entrarApp(p);
  } catch (e) { fallo(e); }
}

function iniciarAcceso() {
  $$('.pestana').forEach(b => b.onclick = () => {
    modoAcceso = b.dataset.modo;
    $$('.pestana').forEach(x => x.classList.toggle('activa', x === b));
    $$('[data-solo="registrar"]').forEach(x => x.hidden = modoAcceso !== 'registrar');
    $('#btn-acceso').textContent = modoAcceso === 'registrar' ? 'Crear cuenta' : 'Entrar';
    $('[name=pass]').autocomplete = modoAcceso === 'registrar' ? 'new-password' : 'current-password';
    $('#acceso-error').hidden = true; $('#acceso-info').hidden = true;
  });

  $('#form-acceso').onsubmit = async ev => {
    ev.preventDefault();
    const f = ev.target, btn = $('#btn-acceso');
    const email = f.email.value.trim(), pass = f.pass.value, nombre = f.nombre.value.trim();
    $('#acceso-error').hidden = true; $('#acceso-info').hidden = true;
    if (modoAcceso === 'registrar' && !nombre) return mostrarErrorAcceso('Poné tu nombre.');
    btn.disabled = true;
    try {
      const perfil = modoAcceso === 'registrar' ? await api.registrar(email, pass, nombre) : await api.entrar(email, pass);
      if (!perfil) {
        $('#acceso-info').textContent = 'Cuenta creada. Revisá tu email para confirmarla y después iniciá sesión.';
        $('#acceso-info').hidden = false;
      } else {
        f.reset();
        await entrarApp(perfil);
      }
    } catch (e) { mostrarErrorAcceso(e.message); }
    finally { btn.disabled = false; }
  };
}
function mostrarErrorAcceso(m) { $('#acceso-error').textContent = m; $('#acceso-error').hidden = false; }

/* ------------------------------------------------------------ app */
async function entrarApp(perfil) {
  if (perfil.estado && perfil.estado !== 'aprobada') return mostrarEspera(perfil);
  estado.perfil = perfil;
  try { estado.ajustes = await api.obtenerAjustes(); } catch (e) { fallo(e); }
  $('#pantalla-acceso').hidden = true;
  $('#app').hidden = false;
  $('#usuario-nombre').textContent = perfil.nombre;
  $('#usuario-rango').textContent = nombreRango(perfil.rango);
  if (perfil.miembro_id) api.listarMiembros().then(ms => {
    const m = ms.find(x => x.id === perfil.miembro_id);
    if (m) $('#usuario-rango').textContent = `${nombreRango(perfil.rango)} · ${m.grado} ${m.nombre}`;
  }).catch(() => {});
  $('#usuario-avatar').textContent = (perfil.nombre || '?').trim().charAt(0).toUpperCase();
  pintarChipPermiso();
  pintarMenu();
  navegar();
  actualizarPendientes();
  if (esAdmin() && !estado.subPendientes && !MODO_DEMO) estado.subPendientes = api.suscribir('perfiles', () => actualizarPendientes());
}

async function actualizarPendientes() {
  if (!esAdmin()) return;
  try {
    const n = (await api.listarPerfiles()).filter(p => p.estado === 'pendiente').length;
    const a = $('.menu-item[data-id="usuarios"]');
    if (!a) return;
    a.querySelector('.menu-contador')?.remove();
    if (n) a.insertAdjacentHTML('beforeend', `<span class="menu-contador" title="${n} cuenta${n === 1 ? '' : 's'} pendiente${n === 1 ? '' : 's'} de aprobación">${n}</span>`);
  } catch {}
}

function pintarChipPermiso() {
  const chip = $('#chip-permiso');
  chip.textContent = puedeEditar() ? 'Puede editar' : 'Solo lectura';
  chip.className = 'chip' + (puedeEditar() ? ' ok' : '');
}

function seccionesVisibles() {
  return SECCIONES.filter(s => estado.perfil.rango >= s.rangoMinimo);
}

function pintarMenu() {
  let html = '', grupo = null;
  for (const s of seccionesVisibles()) {
    if (s.grupo !== grupo) { grupo = s.grupo; if (grupo) html += `<div class="menu-grupo">${esc(grupo)}</div>`; }
    html += `<a class="menu-item" href="#/${s.id}" data-id="${s.id}"><span class="menu-icono">${s.icono}</span>${esc(s.titulo)}</a>`;
  }
  $('#menu').innerHTML = html;
}

function navegar() {
  if (!estado.perfil) return;
  const [id, consulta] = (location.hash.replace(/^#\/?/, '') || 'inicio').split('?');
  estado.params = new URLSearchParams(consulta || '');
  const sec = seccionesVisibles().find(s => s.id === id) || seccionesVisibles()[0];
  estado.seccion = sec.id;
  estado.limpiezas.forEach(f => { try { f(); } catch {} });
  estado.limpiezas = [];
  $$('.menu-item').forEach(a => a.classList.toggle('activo', a.dataset.id === sec.id));
  $('#titulo-seccion').textContent = sec.titulo;
  document.title = `${sec.titulo} · ${NOMBRE_SITIO}`;
  $('#app').classList.remove('menu-abierto');
  const cont = $('#contenido');
  cont.innerHTML = '<div class="vacio">Cargando…</div>';
  cont.scrollTop = 0;

  const vistas = { inicio: vistaInicio, actividad: vistaActividad, perfil: vistaPerfil, reglamento: vistaReglamento, calendario: vistaCalendario, miembros: vistaMiembros, usuarios: vistaUsuarios, foro: vistaForo, inactividad: vistaInactividad };
  const vista = CATEGORIAS[sec.id] ? () => vistaRegistro(sec.id) : vistas[sec.id];
  Promise.resolve(vista(cont)).catch(e => { cont.innerHTML = `<div class="vacio">No se pudo cargar: ${esc(e.message)}</div>`; fallo(e); });
}

/* ============================================================ INICIO */
async function vistaInicio(cont) {
  const hoy = new Date();
  const anterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);   // último mes cerrado
  const anios = [...new Set([anterior.getFullYear(), hoy.getFullYear()])];
  const [miembros, eventos, ...regsPorAnio] = await Promise.all([
    api.listarMiembros(),
    api.listarEventos(fechaISO(hoy), fechaISO(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 30))),
    ...anios.map(a => api.listarRegistrosAnio(a)),
  ]);
  const regs = regsPorAnio.flat();

  const tarjetas = Object.entries(CATEGORIAS).map(([clave, cat]) => {
    const cant = miembros.filter(m => cat.incluye.includes(m.categoria) && (!cat.filtro || cat.filtro(m)) && m.activo).length;
    const k = claveHoja(cat, cat.periodo ? periodoDe(cat, hoy) : { anio: anterior.getFullYear(), mes: anterior.getMonth() + 1 });
    const delPeriodo = regs.filter(r => r.categoria === clave && r.anio === k.anio && r.mes === k.mes && (r.periodo || '') === k.periodo);
    const colTotal = cat.columnas.find(c => c.tipo === 'calculada' && c.numerica && /total/.test(c.clave) && !/lid/.test(c.clave));
    let detalle = '';
    if (colTotal) {
      const porMiembro = new Map();
      for (const r of delPeriodo) {
        if (!porMiembro.has(r.miembro_id)) porMiembro.set(r.miembro_id, {});
        porMiembro.get(r.miembro_id)[r.columna] = r.valor;
      }
      let total = 0;
      for (const vals of porMiembro.values()) total += numero(calcularFila(cat, col => vals[col])[colTotal.clave]);
      detalle = `${formatoNum(total)} actividades ${cat.periodo ? 'en el período actual' : 'en ' + MESES[k.mes - 1].toLowerCase()}`;
    }
    return `<div class="tarjeta tarjeta-link" data-ir="${clave}">
      <div class="dato-grande">${cant}</div>
      <div class="dato-etiqueta">${esc(cat.titulo)} activos</div>
      ${detalle ? `<div class="dato-etiqueta" style="margin-top:10px">${detalle}</div>` : ''}
    </div>`;
  }).join('');

  const listaEventos = eventos.length ? `<ul class="lista-simple">${eventos.slice(0, 8).map(e => {
    const d = new Date(e.fecha + 'T00:00:00');
    return `<li><span class="punto" style="background:${colorTipo(e.tipo)}"></span>
      <div style="flex:1;min-width:0"><strong>${esc(e.titulo)}</strong><div class="dato-etiqueta">${esc(e.tipo || 'Evento')}</div></div>
      <span class="dato-etiqueta">${DIAS[(d.getDay() + 6) % 7]} ${d.getDate()}/${d.getMonth() + 1}${e.hora ? ' · ' + esc(e.hora) : ''}</span></li>`;
  }).join('')}</ul>` : '<div class="vacio">No hay eventos en los próximos 30 días.</div>';

  const visibles = miembros.filter(m => m.activo && !CATEGORIAS_MIEMBRO[m.categoria]?.oculta).length;
  cont.innerHTML = `
    <p style="margin:0 0 20px;color:var(--texto-2)">Hola, <strong style="color:var(--texto)">${esc(estado.perfil.nombre)}</strong>. Elegí una sección del menú o un acceso rápido.</p>
    <div class="rejilla">${tarjetas}</div>
    <div class="rejilla" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr));margin-top:16px">
      <div class="tarjeta"><h3>Próximos eventos</h3>${listaEventos}</div>
      <div class="tarjeta"><h3>Accesos rápidos</h3><ul class="lista-simple">
        <li><a class="menu-item" style="color:var(--texto)" href="#/calendario"><span class="menu-icono">▤</span>Calendario</a></li>
        <li><a class="menu-item" style="color:var(--texto)" href="#/reglamento"><span class="menu-icono">§</span>Reglamento del calendario</a></li>
        <li><a class="menu-item" style="color:var(--texto)" href="#/miembros"><span class="menu-icono">☰</span>Miembros de la legión (${visibles})</a></li>
      </ul></div>
    </div>`;
  $$('[data-ir]', cont).forEach(t => t.onclick = () => location.hash = '#/' + t.dataset.ir);
}

/* ============================================================ REGISTROS: utilidades */
const COL_PLANTEL = '_plantel';   // columna oculta: quién figura en cada hoja histórica y con qué rango

// Período (Soldados / Cabos) que contiene la fecha dada
function periodoDe(config, fecha) {
  const ini = new Date(config.periodo.inicio + 'T00:00:00');
  const f = new Date(fecha); f.setHours(0, 0, 0, 0);
  const k = Math.floor(Math.round((f - ini) / 864e5) / config.periodo.dias);
  const d = new Date(ini); d.setDate(d.getDate() + k * config.periodo.dias);
  return d;
}
// Clave de una hoja: { anio, mes, periodo }
function claveHoja(config, ref) {
  if (config.periodo) {
    const d = ref instanceof Date ? ref : new Date(ref + 'T00:00:00');
    return { anio: d.getFullYear(), mes: d.getMonth() + 1, periodo: fechaISO(d) };
  }
  return { anio: ref.anio, mes: ref.mes, periodo: '' };
}
const fechaCorta = d => d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

// Valores calculados de una fila. valor(clave) devuelve el texto guardado de una columna.
function calcularFila(config, valor) {
  const res = {};
  const v = k => numero(valor(k));
  const t = k => (k in res ? numero(res[k]) : v(k));
  for (const c of config.columnas) if (c.tipo === 'calculada') {
    try { res[c.clave] = c.calc(v, t); } catch { res[c.clave] = ''; }
  }
  return res;
}

const ORDEN_ELITE = Object.keys(ELITES);
function ordenarFilasRegistro(config, lista) {
  const ordenSec = config.secciones ? config.secciones.lista.flatMap(s => s.valores) : null;
  return lista.sort((a, b) => {
    if (ordenSec) {
      const d = ordenSec.indexOf(a[config.secciones.campo]) - ordenSec.indexOf(b[config.secciones.campo]);
      if (d) return d;
    } else if (config.ordenarPor === 'elite') {
      const d = ORDEN_ELITE.indexOf(a.elite) - ORDEN_ELITE.indexOf(b.elite);
      if (d) return d;
    }
    return compararRango(a, b);
  });
}

function valorFijo(m, f) {
  const v = m[f.campo];
  if (!v) return '';
  if (f.tipo === 'fecha') return new Date(v + 'T00:00:00').toLocaleDateString('es-AR');
  return String(v);
}

/* ============================================================ REGISTROS (hoja) */
async function vistaRegistro(cat) {
  const cont = $('#contenido');
  const config = CATEGORIAS[cat];
  const cols = config.columnas;
  const fijas = config.fijas || [];
  const editables = cols.filter(c => c.tipo !== 'calculada');
  const hoja = { cat, config, filas: [], celdas: new Map(), calc: [], sel: { f: 0, c: 0 }, editando: null, clave: null };
  estado.periodos = estado.periodos || {};
  if (config.periodo && !estado.periodos[cat]) estado.periodos[cat] = periodoDe(config, new Date());

  const navegacion = config.periodo
    ? `<div class="selector-anio"><button data-per="-1" aria-label="Período anterior">‹</button><span id="txt-periodo" style="min-width:190px"></span><button data-per="1" aria-label="Período siguiente">›</button></div>
       <button class="btn chico" id="btn-per-hoy">Período actual</button>`
    : `<div class="selector-anio"><button data-anio="-1" aria-label="Año anterior">‹</button><span id="txt-anio"></span><button data-anio="1" aria-label="Año siguiente">›</button></div>`;
  const textoMes = config.periodo ? 'período' : 'mes';

  cont.innerHTML = `
    <div class="herramientas">
      ${navegacion}
      <span class="espacio"></span>
      <button class="btn chico" id="btn-bloq-celda" title="Bloquear o desbloquear la celda seleccionada (Ctrl+B)">🔒 Bloquear celda</button>
      <button class="btn chico" id="btn-bloq-mes">Bloquear ${textoMes}</button>
      <button class="btn chico" id="btn-desbloq-mes">Desbloquear ${textoMes}</button>
      <button class="btn chico" id="btn-csv">Exportar CSV</button>
    </div>
    ${config.periodo ? '' : `<div class="meses" id="meses">${MESES.map((m, i) => `<button class="mes" data-mes="${i + 1}">${m}</button>`).join('')}</div>`}
    <div class="barra-formula ${config.periodo ? 'sin-meses' : ''}"><div class="ref" id="f-ref">—</div><div class="fx">fx</div><div class="val" id="f-val"></div><div class="estado-guardado" id="f-estado"></div></div>
    <div class="hoja-contenedor" id="hoja-cont" tabindex="0"></div>
    ${cols.filter(c => c.opciones).map(c => `<datalist id="op-${c.clave}">${c.opciones.map(o => `<option value="${esc(o)}">`).join('')}</datalist>`).join('')}
    <p class="ayuda">Clic para seleccionar · <kbd>Doble clic</kbd> o empezá a escribir para editar · <kbd>Enter</kbd> guarda y baja · <kbd>Tab</kbd> guarda y avanza · <kbd>Supr</kbd> borra · <kbd>Esc</kbd> cancela · <kbd>Ctrl</kbd>+<kbd>B</kbd> bloquea/desbloquea.
    Las columnas en <span class="muestra-calc">gris</span> se calculan solas. Los miembros salen de <a href="#/miembros">Miembros de la legión</a>, ordenados por rango.</p>`;

  const editable = puedeEditar();
  ['#btn-bloq-celda', '#btn-bloq-mes', '#btn-desbloq-mes'].forEach(s => { $(s).hidden = !editable; });

  const clave = (mid, col) => `${mid}|${col}`;
  const celdaDe = (f, c) => hoja.celdas.get(clave(hoja.filas[f].id, cols[c].clave));
  const recalcular = f => { hoja.calc[f] = calcularFila(config, col => hoja.celdas.get(clave(hoja.filas[f].id, col))?.valor); };
  const textoCelda = (f, c) => cols[c].tipo === 'calculada' ? (hoja.calc[f]?.[cols[c].clave] ?? '') : (celdaDe(f, c)?.valor ?? '');
  const refActual = () => config.periodo ? estado.periodos[cat] : { anio: estado.anio, mes: estado.mes };
  const nombreHoja = () => {
    if (!config.periodo) return `${MESES[estado.mes - 1]} ${estado.anio}`;
    const ini = estado.periodos[cat], fin = new Date(ini); fin.setDate(fin.getDate() + config.periodo.dias - 1);
    return `${fechaCorta(ini)} al ${fechaCorta(fin)}`;
  };

  async function cargar() {
    hoja.clave = claveHoja(config, refActual());
    if (config.periodo) $('#txt-periodo').textContent = nombreHoja();
    else {
      $('#txt-anio').textContent = estado.anio;
      $$('.mes', cont).forEach(b => b.classList.toggle('activo', +b.dataset.mes === estado.mes));
    }
    $('#hoja-cont').innerHTML = '<div class="vacio">Cargando…</div>';
    const k = hoja.clave;
    const rango = config.periodo ? [k.periodo, sumarDias(k.periodo, config.periodo.dias - 1)]
                                 : [`${k.anio}-${pad(k.mes)}-01`, fechaISO(new Date(k.anio, k.mes, 0))];
    const [miembros, regs, avisos] = await Promise.all([api.listarMiembros(), api.listarRegistros(cat, k),
      api.listarInactividadesEntre(...rango).catch(() => [])]);
    if (JSON.stringify(k) !== JSON.stringify(hoja.clave)) return;   // se cambió de hoja mientras cargaba
    hoja.inact = new Map();
    for (const x of avisos.filter(inactividadCuenta)) {
      if (!hoja.inact.has(x.miembro_id)) hoja.inact.set(x.miembro_id, []);
      hoja.inact.get(x.miembro_id).push(x);
    }
    hoja.celdas = new Map(regs.map(r => [clave(r.miembro_id, r.columna), r]));
    // "_plantel" guarda quién figuraba en esa hoja (según los Excel) y con qué rango/élite: "RANGO/ELITE".
    // Si la hoja tiene plantel se muestra solo esa gente, con su rango de ese momento; si no, los miembros activos actuales.
    const plantel = new Map(regs.filter(r => r.columna === COL_PLANTEL).map(r => [r.miembro_id, r.valor || '']));
    const conDatos = new Set(regs.filter(r => r.columna !== COL_PLANTEL && r.valor !== null && r.valor !== '').map(r => r.miembro_id));
    const base = plantel.size
      ? miembros.filter(m => plantel.has(m.id) || conDatos.has(m.id))
      : miembros.filter(m => (m.activo && config.incluye.includes(m.categoria) && (!config.filtro || config.filtro(m))) || conDatos.has(m.id));
    hoja.filas = ordenarFilasRegistro(config, base.map(m => {
      if (!plantel.has(m.id)) return m;
      const [grado, elite] = plantel.get(m.id).split('/');
      return { ...m, grado: grado || m.grado, elite: elite || m.elite, activo: true };
    }));
    hoja.filas.forEach((_, f) => recalcular(f));
    hoja.sel = { f: Math.min(hoja.sel.f, Math.max(hoja.filas.length - 1, 0)), c: Math.min(hoja.sel.c, cols.length - 1) };
    pintar();
  }

  function pintar() {
    const hc = $('#hoja-cont');
    if (!hoja.filas.length) {
      hc.innerHTML = `<div class="vacio">No hay miembros para <strong>${esc(config.titulo)}</strong> en ${esc(nombreHoja())}.<br><br>
        <a class="btn" href="#/miembros">Ir a Miembros</a></div>`;
      actualizarFormula(); return;
    }
    const numCol = c => c.tipo === 'numero' || c.numerica;
    hc.classList.toggle('con-secciones', !!config.secciones);
    if (config.secciones) return pintarSecciones(hc, numCol);
    let html = `<table class="hoja"><thead><tr>
      <th class="fijo col-n">#</th><th class="fijo col-nombre">Miembro</th><th>Rango</th>
      ${fijas.map(f => `<th>${esc(f.nombre)}</th>`).join('')}
      ${cols.map(c => `<th class="${numCol(c) ? 'num' : ''} ${c.tipo === 'calculada' ? 'th-calc' : ''}">${esc(c.nombre)}</th>`).join('')}
      </tr></thead><tbody>`;
    hoja.filas.forEach((m, f) => {
      html += `<tr class="${m.activo ? '' : 'inactivo'}"><td class="fijo col-n">${f + 1}</td>
        <td class="fijo col-nombre" title="${esc(m.discord_id || '')}"><a class="link-perfil" href="#/perfil?id=${m.id}">${esc(m.nombre)}</a>${insigniaInactividad(hoja.inact?.get(m.id), m.nombre)}</td><td class="col-grado">${esc(m.grado)}</td>
        ${fijas.map(x => `<td class="col-grado">${esc(valorFijo(m, x))}</td>`).join('')}`;
      cols.forEach((c, ci) => { html += `<td data-f="${f}" data-c="${ci}"></td>`; });
      html += `</tr>`;
    });
    html += `</tbody><tfoot><tr><td class="fijo col-n"></td><td class="fijo col-nombre">Total</td><td></td>${fijas.map(() => '<td></td>').join('')}
      ${cols.map((c, ci) => `<td class="num" data-tcol="${ci}"></td>`).join('')}</tr></tfoot></table>`;
    hc.innerHTML = html;
    hoja.filas.forEach((_, f) => cols.forEach((_, c) => pintarCelda(f, c)));
    pintarTotales();
    marcarSeleccion();
  }

  // Varias tablas chicas lado a lado (por ejemplo, una por especialización en Élites)
  function pintarSecciones(hc, numCol) {
    const { campo, lista } = config.secciones;
    hc.innerHTML = `<div class="secciones-hoja">${lista.map((s, si) => {
      const indices = hoja.filas.map((m, f) => s.valores.includes(m[campo]) ? f : -1).filter(f => f >= 0);
      return `<section class="seccion-hoja">
        <h4>${esc(s.titulo)} <span>${indices.length}</span></h4>
        <div class="seccion-tabla"><table class="hoja compacta"><thead><tr>
          <th class="col-nombre">Miembro</th><th>${esc(config.secciones.columna || 'Rango')}</th>
          ${cols.map(c => `<th class="${numCol(c) ? 'num' : ''}">${esc(c.nombre)}</th>`).join('')}
        </tr></thead><tbody>
        ${indices.length ? indices.map(f => { const m = hoja.filas[f];
          return `<tr class="${m.activo ? '' : 'inactivo'}"><td class="col-nombre" title="${esc(m.discord_id || '')}"><a class="link-perfil" href="#/perfil?id=${m.id}">${esc(m.nombre)}</a>${insigniaInactividad(hoja.inact?.get(m.id), m.nombre)}</td>
            <td class="col-grado" title="${esc(ELITES[m[campo]] || '')}">${esc(config.secciones.columna ? m[campo] : m.grado)}</td>${cols.map((c, ci) => `<td data-f="${f}" data-c="${ci}"></td>`).join('')}</tr>`; }).join('')
          : `<tr><td colspan="${cols.length + 2}" class="vacio-chico">Sin miembros</td></tr>`}
        </tbody><tfoot><tr><td class="col-nombre">Total</td><td></td>
          ${cols.map((c, ci) => `<td class="num" data-tcol="${ci}" data-sec="${si}"></td>`).join('')}</tr></tfoot></table></div>
      </section>`;
    }).join('')}</div>`;
    hoja.filas.forEach((_, f) => cols.forEach((_, c) => pintarCelda(f, c)));
    pintarTotales();
    marcarSeleccion();
  }

  function tdDe(f, c) { return $(`td[data-f="${f}"][data-c="${c}"]`, $('#hoja-cont')); }

  function pintarCelda(f, c) {
    const td = tdDe(f, c); if (!td) return;
    const col = cols[c];
    if (col.tipo === 'calculada') {
      const v = hoja.calc[f]?.[col.clave];
      td.className = 'celda calc ' + (col.numerica ? 'num' : 'texto-corto');
      td.textContent = col.numerica ? formatoNum(numero(v)) : (v ?? '');
      td.title = 'Se calcula solo';
      return;
    }
    const r = celdaDe(f, c);
    td.className = 'celda ' + (col.tipo === 'numero' ? 'num' : 'texto') + (r?.bloqueado ? ' bloqueada' : '') + (editable ? '' : ' solo-lectura');
    td.textContent = r?.valor ?? '';
    td.title = r?.bloqueado ? 'Celda bloqueada' : (col.tipo === 'texto' && r?.valor ? r.valor : '');
  }

  function pintarFila(f) { recalcular(f); cols.forEach((c, ci) => { if (c.tipo === 'calculada') pintarCelda(f, ci); }); }

  function pintarTotales() {
    if (config.secciones) {
      const { campo, lista } = config.secciones;
      cols.forEach((c, ci) => lista.forEach((s, si) => {
        const td = $(`[data-tcol="${ci}"][data-sec="${si}"]`); if (!td) return;
        td.textContent = c.tipo === 'numero'
          ? formatoNum(hoja.filas.reduce((t, m, f) => t + (s.valores.includes(m[campo]) ? numero(celdaDe(f, ci)?.valor) : 0), 0)) : '';
      }));
      return;
    }
    cols.forEach((c, ci) => {
      const td = $(`[data-tcol="${ci}"]`); if (!td) return;
      if (c.tipo === 'numero') td.textContent = formatoNum(hoja.filas.reduce((s, _, f) => s + numero(celdaDe(f, ci)?.valor), 0));
      else if (c.numerica) td.textContent = formatoNum(hoja.filas.reduce((s, _, f) => s + numero(hoja.calc[f]?.[c.clave]), 0));
      else if (c.tipo === 'calculada') {
        const cuenta = {};
        hoja.filas.forEach((_, f) => { const v = hoja.calc[f]?.[c.clave]; if (v) cuenta[v] = (cuenta[v] || 0) + 1; });
        td.textContent = Object.entries(cuenta).map(([k, n]) => `${k.split(' ')[0]} ${n}`).join('  ');
        td.className = 'texto-corto';
      } else td.textContent = '';
    });
  }

  function marcarSeleccion() {
    $$('td.celda.sel', $('#hoja-cont')).forEach(td => td.classList.remove('sel'));
    const td = tdDe(hoja.sel.f, hoja.sel.c);
    if (td) { td.classList.add('sel'); mostrarCelda(td); }
    actualizarFormula();
  }

  // Desplaza la hoja para que la celda quede visible sin quedar tapada por las columnas/filas fijas
  function mostrarCelda(td) {
    if (config.secciones) return td.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const hc = $('#hoja-cont'), tabla = $('table', hc);
    const colNombre = $('thead .col-nombre', tabla), anchoFijo = colNombre.offsetLeft + colNombre.offsetWidth;
    const altoCab = $('thead', tabla).offsetHeight, altoPie = $('tfoot', tabla).offsetHeight;
    const izq = td.offsetLeft, der = izq + td.offsetWidth, arr = td.offsetTop, aba = arr + td.offsetHeight;
    if (hoja.sel.c === 0) hc.scrollLeft = 0;
    else if (izq - anchoFijo < hc.scrollLeft) hc.scrollLeft = izq - anchoFijo;
    else if (der > hc.scrollLeft + hc.clientWidth) hc.scrollLeft = der - hc.clientWidth;
    if (arr - altoCab < hc.scrollTop) hc.scrollTop = arr - altoCab;
    else if (aba + altoPie > hc.scrollTop + hc.clientHeight) hc.scrollTop = aba + altoPie - hc.clientHeight;
  }

  function actualizarFormula() {
    const btn = $('#btn-bloq-celda');
    if (!hoja.filas.length) { $('#f-ref').textContent = '—'; $('#f-val').textContent = ''; btn.disabled = true; return; }
    const m = hoja.filas[hoja.sel.f], col = cols[hoja.sel.c], r = celdaDe(hoja.sel.f, hoja.sel.c);
    $('#f-ref').textContent = `${m.grado} ${m.nombre} · ${col.nombre} · ${nombreHoja()}`;
    $('#f-val').textContent = col.tipo === 'calculada' ? `= ${textoCelda(hoja.sel.f, hoja.sel.c)}  (calculado)` : (r?.bloqueado ? '🔒 ' : '') + (r?.valor ?? '');
    btn.disabled = col.tipo === 'calculada';
    btn.textContent = r?.bloqueado ? '🔓 Desbloquear celda' : '🔒 Bloquear celda';
  }

  function estadoGuardado(t) { $('#f-estado').textContent = t; }

  async function guardar(lista) {
    estadoGuardado('Guardando…');
    try {
      const res = await api.guardarCeldas(lista);
      for (const r of res) hoja.celdas.set(clave(r.miembro_id, r.columna), r);
      estadoGuardado('Guardado ✓');
      return true;
    } catch (e) { estadoGuardado('Error'); fallo(e); return false; }
  }

  function base(f, c) {
    const r = celdaDe(f, c);
    return { categoria: cat, ...hoja.clave, miembro_id: hoja.filas[f].id,
      columna: cols[c].clave, valor: r?.valor ?? null, bloqueado: !!r?.bloqueado };
  }

  function empezarEdicion(f, c, textoInicial) {
    if (!editable) return aviso('Tu cuenta es de solo lectura.');
    const col = cols[c];
    if (col.tipo === 'calculada') return aviso(`"${col.nombre}" se calcula solo.`);
    const r = celdaDe(f, c);
    if (r?.bloqueado) return aviso('Esta celda está bloqueada. Desbloqueala para modificarla.');
    const td = tdDe(f, c); if (!td) return;
    hoja.editando = { f, c };
    td.classList.add('editando');
    td.innerHTML = `<input type="text" inputmode="${col.tipo === 'numero' ? 'decimal' : 'text'}" ${col.opciones ? `list="op-${col.clave}"` : ''}>`;
    const inp = $('input', td);
    inp.value = textoInicial ?? (r?.valor ?? '');
    inp.focus();
    if (textoInicial == null) inp.select();
    let terminado = false;
    const terminar = (guardarCambios, mover) => {
      if (terminado) return; terminado = true;
      hoja.editando = null;
      const nuevo = inp.value.trim();
      const anterior = r?.valor ?? '';
      if (guardarCambios && nuevo !== anterior) {
        if (col.tipo === 'numero' && nuevo !== '' && isNaN(Number(nuevo.replace(',', '.')))) {
          aviso(`"${col.nombre}" solo acepta números.`, 'error');
        } else {
          // Se muestra al instante y se guarda en segundo plano; si falla, se revierte
          const valor = nuevo === '' ? null : (col.tipo === 'numero' ? nuevo.replace(',', '.') : nuevo);
          const k = clave(hoja.filas[f].id, col.clave), previo = hoja.celdas.get(k);
          const claveGuardada = JSON.stringify(hoja.clave);
          hoja.celdas.set(k, { ...(previo || {}), ...base(f, c), valor });
          guardar([{ ...base(f, c) }]).then(ok => {
            if (ok || claveGuardada !== JSON.stringify(hoja.clave)) return;
            previo ? hoja.celdas.set(k, previo) : hoja.celdas.delete(k);
            pintarCelda(f, c); pintarFila(f); pintarTotales(); actualizarFormula();
          });
        }
      }
      pintarCelda(f, c); pintarFila(f); pintarTotales();
      if (mover) moverSel(mover[0], mover[1]); else marcarSeleccion();
      $('#hoja-cont').focus({ preventScroll: true });
    };
    inp.onkeydown = ev => {
      if (ev.key === 'Enter') { ev.preventDefault(); terminar(true, [1, 0]); }
      else if (ev.key === 'Tab') { ev.preventDefault(); terminar(true, [0, ev.shiftKey ? -1 : 1]); }
      else if (ev.key === 'Escape') { ev.preventDefault(); terminar(false); }
      ev.stopPropagation();
    };
    inp.onblur = () => terminar(true);
  }

  function moverSel(df, dc) {
    hoja.sel.f = Math.max(0, Math.min(hoja.filas.length - 1, hoja.sel.f + df));
    hoja.sel.c = Math.max(0, Math.min(cols.length - 1, hoja.sel.c + dc));
    marcarSeleccion();
  }

  async function alternarBloqueoCelda() {
    if (!editable || !hoja.filas.length || cols[hoja.sel.c].tipo === 'calculada') return;
    const { f, c } = hoja.sel, r = celdaDe(f, c);
    if (await guardar([{ ...base(f, c), bloqueado: !r?.bloqueado }])) { pintarCelda(f, c); actualizarFormula(); }
  }

  async function bloquearHoja(bloq) {
    if (!hoja.filas.length) return;
    const ok = await confirmar(bloq ? `Bloquear ${textoMes}` : `Desbloquear ${textoMes}`,
      bloq ? `Se van a bloquear todas las celdas de ${nombreHoja()} en ${config.titulo}. Nadie podrá modificarlas hasta desbloquearlas.`
           : `Se van a desbloquear todas las celdas de ${nombreHoja()} en ${config.titulo}.`,
      bloq ? 'Bloquear' : 'Desbloquear');
    if (!ok) return;
    const lista = [];
    hoja.filas.forEach((_, f) => cols.forEach((col, c) => {
      if (col.tipo === 'calculada') return;
      const r = celdaDe(f, c);
      if (bloq || r?.bloqueado) lista.push({ ...base(f, c), bloqueado: bloq });
    }));
    if (lista.length && await guardar(lista)) { pintar(); aviso(bloq ? 'Bloqueado.' : 'Desbloqueado.'); }
  }

  function exportarCSV() {
    const filas = [['Miembro', 'Rango', ...fijas.map(x => x.nombre), ...cols.map(c => c.nombre)]];
    hoja.filas.forEach((m, f) => filas.push([m.nombre, m.grado, ...fijas.map(x => valorFijo(m, x)), ...cols.map((c, ci) => textoCelda(f, ci))]));
    const sufijo = config.periodo ? hoja.clave.periodo : `${estado.anio}_${pad(estado.mes)}_${MESES[estado.mes - 1]}`;
    descargar(`${cat}_${sufijo}.csv`, filas.map(f => f.map(celdaCSV).join(';')).join('\r\n'));
  }

  /* eventos */
  if (config.periodo) {
    $$('[data-per]', cont).forEach(b => b.onclick = () => {
      const d = new Date(estado.periodos[cat]); d.setDate(d.getDate() + (+b.dataset.per) * config.periodo.dias);
      estado.periodos[cat] = d; cargar().catch(fallo);
    });
    $('#btn-per-hoy').onclick = () => { estado.periodos[cat] = periodoDe(config, new Date()); cargar().catch(fallo); };
  } else {
    $$('[data-anio]', cont).forEach(b => b.onclick = () => { estado.anio += +b.dataset.anio; cargar().catch(fallo); });
    $('#meses').onclick = ev => { const b = ev.target.closest('.mes'); if (b) { estado.mes = +b.dataset.mes; cargar().catch(fallo); } };
  }
  $('#btn-bloq-celda').onclick = alternarBloqueoCelda;
  $('#btn-bloq-mes').onclick = () => bloquearHoja(true);
  $('#btn-desbloq-mes').onclick = () => bloquearHoja(false);
  $('#btn-csv').onclick = exportarCSV;

  const hc = $('#hoja-cont');
  hc.onclick = ev => {
    const td = ev.target.closest('td[data-f]'); if (!td || hoja.editando) return;
    hoja.sel = { f: +td.dataset.f, c: +td.dataset.c }; marcarSeleccion(); hc.focus({ preventScroll: true });
  };
  hc.ondblclick = ev => { const td = ev.target.closest('td[data-f]'); if (td) empezarEdicion(+td.dataset.f, +td.dataset.c); };
  hc.onkeydown = async ev => {
    if (hoja.editando || !hoja.filas.length) return;
    const { f, c } = hoja.sel;
    const mov = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[ev.key];
    if (mov) { ev.preventDefault(); moverSel(...mov); }
    else if (ev.key === 'Tab') { ev.preventDefault(); moverSel(0, ev.shiftKey ? -1 : 1); }
    else if (ev.key === 'Enter' || ev.key === 'F2') { ev.preventDefault(); empezarEdicion(f, c); }
    else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'b') { ev.preventDefault(); alternarBloqueoCelda(); }
    else if ((ev.key === 'Delete' || ev.key === 'Backspace') && editable) {
      ev.preventDefault();
      if (cols[c].tipo === 'calculada') return;
      const r = celdaDe(f, c);
      if (r?.bloqueado) return aviso('Esta celda está bloqueada.');
      if (r?.valor != null && await guardar([{ ...base(f, c), valor: null }])) { pintarCelda(f, c); pintarFila(f); pintarTotales(); actualizarFormula(); }
    }
    else if (ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey) { ev.preventDefault(); empezarEdicion(f, c, ev.key); }
  };

  // Cambios de otras personas en tiempo real
  let espera;
  estado.limpiezas.push(api.suscribir('inactividades', () => {
    clearTimeout(espera);
    espera = setTimeout(() => { if (!hoja.editando) cargar().catch(fallo); }, 400);
  }));
  estado.limpiezas.push(api.suscribir('registros', p => {
    const n = p?.new || p?.old, k = hoja.clave;
    if (n && n.categoria && k && (n.categoria !== cat || n.anio !== k.anio || n.mes !== k.mes || (n.periodo || '') !== k.periodo)) return;
    clearTimeout(espera);
    espera = setTimeout(() => { if (!hoja.editando) cargar().catch(fallo); }, 400);
  }));

  await cargar();
  hc.focus({ preventScroll: true });
}

/* ============================================================ MIEMBROS */
const ORDEN_CAT = Object.keys(CATEGORIAS_MIEMBRO);
const tituloCat = c => CATEGORIAS_MIEMBRO[c]?.titulo || c;
const catOculta = c => !!CATEGORIAS_MIEMBRO[c]?.oculta;
const BASE_STEAM = 76561197960265728n;

// STEAM_0:X:Y  ->  SteamID64
function steamA64(id) {
  const m = /^STEAM_[0-5]:([01]):(\d+)$/i.exec(String(id || '').trim());
  return m ? String(BASE_STEAM + BigInt(m[2]) * 2n + BigInt(m[1])) : '';
}
// SteamID64  ->  STEAM_0:X:Y
function steamDesde64(s) {
  const t = String(s || '').trim();
  if (!/^7656119\d{10}$/.test(t)) return '';
  const v = BigInt(t) - BASE_STEAM;
  return `STEAM_0:${v % 2n}:${v / 2n}`;
}

// Tiempo transcurrido desde una fecha (AAAA-MM-DD), en lenguaje natural
function antiguedad(fecha) {
  if (!fecha) return '';
  const d = new Date(fecha + 'T00:00:00'), h = new Date();
  h.setHours(0, 0, 0, 0);
  if (d > h) return 'desde el ' + d.toLocaleDateString('es-AR');
  let meses = (h.getFullYear() - d.getFullYear()) * 12 + h.getMonth() - d.getMonth();
  if (h.getDate() < d.getDate()) meses--;
  const ref = new Date(d); ref.setMonth(ref.getMonth() + meses);
  const dias = Math.round((h - ref) / 864e5);
  const anios = Math.floor(meses / 12); meses %= 12;
  const u = (n, s, p) => `${n} ${n === 1 ? s : p}`;
  if (anios) return u(anios, 'año', 'años') + (meses ? ', ' + u(meses, 'mes', 'meses') : '');
  if (meses) return u(meses, 'mes', 'meses') + (dias ? ', ' + u(dias, 'día', 'días') : '');
  return dias ? u(dias, 'día', 'días') : 'hoy';
}

const tieneIconico = m => !!m.nombre_iconico && m.nombre_iconico.trim().toLowerCase() !== 'no';
const normRango = g => String(g || '').toUpperCase().replace(/[°º\s]/g, '');
const RANGOS_NORM = RANGOS_LEGION.map(normRango);
const indiceRango = g => RANGOS_NORM.indexOf(normRango(g));
// Ordena por rango (según RANGO_MAYOR_PRIMERO) y después por nombre; rangos desconocidos al final
function compararRango(a, b) {
  const ia = indiceRango(a.grado), ib = indiceRango(b.grado);
  if (ia !== ib) {
    if (ia < 0) return 1;
    if (ib < 0) return -1;
    return RANGO_MAYOR_PRIMERO ? ib - ia : ia - ib;
  }
  return a.nombre.localeCompare(b.nombre);
}
const categoriaDeRango = g => Object.keys(CATEGORIA_POR_RANGO).find(c => CATEGORIA_POR_RANGO[c].map(normRango).includes(normRango(g)));
const ordenarMiembros = lista => lista.sort((a, b) =>
  ORDEN_CAT.indexOf(a.categoria) - ORDEN_CAT.indexOf(b.categoria) || compararRango(a, b));

// En Miembros de la legión solo figuran de Sargento en adelante, más los élites de cualquier rango
const RANGO_MIN_MIEMBROS = 'SGT';
const esDeLegion = m => indiceRango(m.grado) >= indiceRango(RANGO_MIN_MIEMBROS) || !!ELITES[m.elite];
// Los élites que no llegan a Sargento se agrupan en "Élites" y no se muestra su rango
const esEliteSinSGT = m => indiceRango(m.grado) < indiceRango(RANGO_MIN_MIEMBROS) && !!ELITES[m.elite];
const catVista = m => esEliteSinSGT(m) ? 'elites' : m.categoria;
const CATS_VISTA = { ...Object.fromEntries(Object.entries(CATEGORIAS_MIEMBRO).filter(([k, c]) => !c.oculta).map(([k, c]) => [k, c.titulo])), elites: 'Élites' };

async function vistaMiembros(cont) {
  let todos = await api.listarMiembros();
  let miembros = ordenarMiembros(todos.filter(esDeLegion));
  const filtro = { texto: '', cat: '' };
  const editable = puedeEditar();
  const opcionesCat = Object.entries(CATS_VISTA).map(([k, t]) => `<option value="${k}">${esc(t)}</option>`).join('');
  const opcionesCatForm = Object.entries(CATEGORIAS_MIEMBRO).map(([k, c]) => `<option value="${k}">${esc(c.titulo)}</option>`).join('');
  const nCols = editable ? 10 : 9;

  cont.innerHTML = `
    <div class="rejilla" id="resumen-miembros" style="margin-bottom:18px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr))"></div>
    <div class="herramientas">
      <input class="entrada" id="buscar" placeholder="Buscar nombre, rango, SteamID, Discord, élite…" style="max-width:320px">
      <select class="entrada" id="filtro-cat" style="max-width:220px"><option value="">Todas las categorías</option>${opcionesCat}</select>
      <span class="espacio"></span>
      <button class="btn chico" id="btn-csv-miembros">Exportar CSV</button>
      ${editable ? '<button class="btn primario" id="btn-nuevo">+ Agregar miembro</button>' : ''}
    </div>
    <div class="envoltorio-tabla"><table class="datos tabla-miembros"><thead><tr>
      <th>Rango</th><th>Nombre clon</th><th>Nombre Jedi</th><th>Icónico</th>
      <th>Categoría</th><th>Élite</th><th>SteamID</th><th>Discord</th><th>Estado</th>${editable ? '<th></th>' : ''}
    </tr></thead><tbody id="cuerpo-miembros"></tbody></table></div>
    <p class="ayuda">Clic en un SteamID o Discord para copiarlo · el SteamID64 abre el perfil de Steam · dentro de cada categoría se ordena por rango.</p>`;

  function filaHTML(m) {
    return `<tr class="${m.activo ? '' : 'fila-inactiva'}">
      <td>${esEliteSinSGT(m) ? '<span class="tenue">—</span>' : `<strong>${esc(m.grado) || '—'}</strong>`}</td>
      <td><a class="link-perfil" href="#/perfil?id=${m.id}"><strong>${esc(m.nombre)}</strong></a>${m.notas ? ` <span class="nota" title="${esc(m.notas)}">ⓘ</span>` : ''}</td>
      <td>${esc(m.nombre_jedi) || '<span class="tenue">—</span>'}</td>
      <td>${tieneIconico(m) ? `<span class="etiqueta admin">${esc(m.nombre_iconico)}</span>` : '<span class="tenue">No</span>'}</td>
      <td>${esc(CATS_VISTA[catVista(m)] || tituloCat(m.categoria))}</td>
      <td>${ELITES[m.elite] ? `<span class="etiqueta admin" title="${esc(ELITES[m.elite])}">${esc(m.elite)}</span>` : '<span class="tenue">No</span>'}</td>
      <td class="steam">${m.steam_id ? `<button class="copiar mono" data-copiar="${esc(m.steam_id)}" title="Copiar">${esc(m.steam_id)}</button>` : '<span class="tenue">—</span>'}
        ${m.steam_id64 ? `<a class="sub mono" href="https://steamcommunity.com/profiles/${esc(m.steam_id64)}" target="_blank" rel="noopener noreferrer">${esc(m.steam_id64)}</a>` : ''}</td>
      <td>${m.discord_id ? `<button class="copiar mono" data-copiar="${esc(m.discord_id)}" title="Copiar">${esc(m.discord_id)}</button>` : '<span class="tenue">—</span>'}</td>
      <td><span class="etiqueta ${m.activo ? 'admin' : ''}">${m.activo ? 'Activo' : 'Inactivo'}</span></td>
      ${editable ? `<td class="acciones"><button class="btn chico" data-editar="${m.id}">Editar</button>
        <button class="btn chico peligro" data-borrar="${m.id}">Borrar</button></td>` : ''}
    </tr>`;
  }

  function filtrados() {
    const t = filtro.texto.trim().toLowerCase();
    return miembros.filter(m => (!filtro.cat || catVista(m) === filtro.cat) && (!t ||
      [m.nombre, m.grado, m.nombre_jedi, m.nombre_iconico, m.elite, ELITES[m.elite], m.discord_id, m.steam_id, m.steam_id64]
        .some(v => String(v || '').toLowerCase().includes(t))));
  }

  function pintar() {
    $('#resumen-miembros').innerHTML = Object.entries(CATS_VISTA).map(([k, t]) =>
      `<div class="tarjeta tarjeta-link" data-cat="${k}"><div class="dato-grande">${miembros.filter(m => catVista(m) === k && m.activo).length}</div>
       <div class="dato-etiqueta">${esc(t)} activos</div></div>`).join('');
    const lista = filtrados();
    if (!lista.length) {
      $('#cuerpo-miembros').innerHTML = `<tr><td colspan="${nCols}" class="vacio">${miembros.length ? 'Ningún miembro coincide con el filtro.' : 'Todavía no hay miembros cargados.'}</td></tr>`;
      return;
    }
    let html = '';
    for (const cat of Object.keys(CATS_VISTA)) {
      const grupo = lista.filter(m => catVista(m) === cat);
      if (!grupo.length) continue;
      html += `<tr class="fila-grupo"><td colspan="${nCols}">${esc(CATS_VISTA[cat])} <span>${grupo.length}</span></td></tr>`;
      html += grupo.map(filaHTML).join('');
    }
    const otros = lista.filter(m => !CATS_VISTA[catVista(m)]);
    if (otros.length) html += `<tr class="fila-grupo"><td colspan="${nCols}">Sin categoría <span>${otros.length}</span></td></tr>` + otros.map(filaHTML).join('');
    $('#cuerpo-miembros').innerHTML = html;
  }

  // Icónicos: los ocupados por otro miembro aparecen deshabilitados con el nombre del portador
  function opcionesIconico(m) {
    const actual = tieneIconico(m) ? m.nombre_iconico : '';
    const portador = ic => miembros.find(x => x.id !== m.id && tieneIconico(x) && x.nombre_iconico.toLowerCase() === ic.toLowerCase());
    const enLista = ICONICOS.some(ic => ic.toLowerCase() === actual.toLowerCase());
    const extra = actual && !enLista ? `<option value="${esc(actual)}" selected>${esc(actual)} (fuera de la lista)</option>` : '';
    return `<option value="No">No</option>${extra}` + ICONICOS.map(ic => {
      const p = portador(ic), sel = actual.toLowerCase() === ic.toLowerCase();
      return `<option value="${esc(ic)}" ${sel ? 'selected' : ''} ${p ? 'disabled' : ''}>${esc(ic)}${p ? ` — ${esc(p.grado)} ${esc(p.nombre)}` : ''}</option>`;
    }).join('');
  }

  function opcionesRango(actual) {
    const lista = RANGO_MAYOR_PRIMERO ? [...RANGOS_LEGION].reverse() : [...RANGOS_LEGION];
    const i = indiceRango(actual);
    const extra = actual && i < 0 ? `<option value="${esc(actual)}" selected>${esc(actual)} (fuera de la lista)</option>` : '';
    return `<option value="">— Elegir —</option>${extra}` +
      lista.map(r => `<option value="${esc(r)}" ${i >= 0 && RANGOS_LEGION[i] === r ? 'selected' : ''}>${esc(r)}</option>`).join('');
  }

  function formulario(m = { nombre: '', categoria: CATEGORIAS_MIEMBRO[filtro.cat] ? filtro.cat : 'suboficiales', grado: '', nombre_jedi: '',
    nombre_iconico: 'No', steam_id: '', steam_id64: '', discord_id: '', elite: '', fecha_rango: '', notas: '', activo: true }) {
    abrirModal(m.id ? `Editar · ${m.grado || ''} ${m.nombre}` : 'Agregar miembro', `
      <form id="form-miembro">
        <div class="fila-campos">
          <label class="campo"><span>Rango</span><select name="grado">${opcionesRango(m.grado)}</select></label>
          <label class="campo"><span>Nombre clon *</span><input name="nombre" required maxlength="60" value="${esc(m.nombre)}"></label>
        </div>
        <div class="fila-campos">
          <label class="campo"><span>Categoría</span><select name="categoria">${opcionesCatForm}</select></label>
          <label class="campo"><span>Nombre Jedi</span><input name="nombre_jedi" maxlength="60" value="${esc(m.nombre_jedi)}" placeholder="Vacío si no tiene"></label>
        </div>
        <div class="fila-campos">
          <label class="campo"><span>Icónico</span><select name="nombre_iconico">${opcionesIconico(m)}</select></label>
          <label class="campo"><span>Fecha de ingreso</span><input name="fecha_ingreso" type="date" value="${esc(m.fecha_ingreso || '')}"></label>
        </div>
        <div class="fila-campos">
          <label class="campo"><span>Élite</span><select name="elite"><option value="">No</option>${Object.entries(ELITES).map(([k, t]) => `<option value="${k}">${k} · ${esc(t)}</option>`).join('')}</select></label>
          <label class="campo"><span>Discord</span><input name="discord_id" maxlength="40" class="mono" value="${esc(m.discord_id)}" placeholder="Usuario o ID, ej: agustinto"></label>
        </div>
        <div class="fila-campos">
          <label class="campo"><span>SteamID</span><input name="steam_id" maxlength="40" class="mono" value="${esc(m.steam_id)}" placeholder="STEAM_0:0:123456"></label>
          <label class="campo"><span>SteamID64</span><input name="steam_id64" maxlength="20" class="mono" value="${esc(m.steam_id64)}" placeholder="7656119…"></label>
        </div>
        <p class="ayuda" id="aviso-steam" style="margin:-6px 0 12px">Completá uno de los dos y el otro se calcula solo.</p>
        <label class="campo"><span>Notas</span><textarea name="notas" maxlength="500">${esc(m.notas)}</textarea></label>
        <label class="interruptor" style="margin-bottom:16px"><input type="checkbox" name="activo" ${m.activo ? 'checked' : ''}>
          <span>Activo<br><small style="color:var(--texto-3)">Los inactivos no aparecen en las tablas, salvo en los meses donde tengan datos.</small></span></label>
        <div class="modal-pie"><button type="button" class="btn" data-cancelar>Cancelar</button><button class="btn primario">Guardar</button></div>
      </form>`, c => {
      const f = $('#form-miembro', c);
      f.categoria.value = m.categoria;
      f.elite.value = ELITES[m.elite] ? m.elite : '';
      f.grado.onchange = () => { const c = categoriaDeRango(f.grado.value); if (c) f.categoria.value = c; };
      $('[data-cancelar]', c).onclick = cerrarModal;
      f.steam_id.oninput = () => { const v = steamA64(f.steam_id.value); if (v) f.steam_id64.value = v; };
      f.steam_id64.oninput = () => { const v = steamDesde64(f.steam_id64.value); if (v) f.steam_id.value = v; };
      f.onsubmit = async ev => {
        ev.preventDefault();
        const sid = f.steam_id.value.trim(), s64 = f.steam_id64.value.trim();
        if (sid && s64 && steamA64(sid) && steamA64(sid) !== s64) {
          $('#aviso-steam', c).innerHTML = `<span style="color:var(--peligro)">El SteamID y el SteamID64 no coinciden. Para ${esc(sid)} el correcto es ${steamA64(sid)}.</span>`;
          return;
        }
        if (!esDeLegion({ grado: f.grado.value, elite: f.elite.value })) {
          aviso('Solo se cargan miembros de Sargento (SGT) en adelante, o élites.', 'error'); return;
        }
        const did = f.discord_id.value.trim();
        if (did && /\s/.test(did)) { aviso('El Discord no puede tener espacios.', 'error'); return; }
        const repetido = sid && todos.find(x => x.id !== m.id && x.steam_id === sid);
        if (repetido && !await confirmar('SteamID repetido', `${repetido.grado} ${repetido.nombre} ya tiene ese SteamID. ¿Guardar igual?`, 'Guardar igual')) return formulario(m);
        try {
          const g = await api.guardarMiembro({ ...(m.id ? { id: m.id } : {}),
            nombre: f.nombre.value.trim(), grado: f.grado.value.trim(), categoria: f.categoria.value,
            nombre_jedi: f.nombre_jedi.value.trim(),
            nombre_iconico: f.nombre_iconico.value || 'No', elite: f.elite.value, discord_id: did,
            steam_id: sid, steam_id64: s64, fecha_ingreso: f.fecha_ingreso.value || null,
            notas: f.notas.value.trim(), activo: f.activo.checked });
          todos = m.id ? todos.map(x => x.id === g.id ? g : x) : [...todos, g];
          miembros = ordenarMiembros(todos.filter(esDeLegion));
          cerrarModal(); pintar(); aviso('Miembro guardado.');
        } catch (e) { fallo(e); }
      };
    });
  }

  function exportarCSV() {
    const enc = ['Rango', 'Nombre clon', 'Nombre Jedi', 'Icónico', 'Categoría', 'Élite',
      'SteamID', 'SteamID64', 'Discord', 'Estado', 'Notas'];
    const filas = filtrados().map(m => [esEliteSinSGT(m) ? '' : m.grado, m.nombre, m.nombre_jedi, tieneIconico(m) ? m.nombre_iconico : 'No',
      CATS_VISTA[catVista(m)] || tituloCat(m.categoria), ELITES[m.elite] ? m.elite : 'No', m.steam_id, m.steam_id64, m.discord_id,
      m.activo ? 'Activo' : 'Inactivo', m.notas]);
    // El ="..." evita que Excel convierta SteamID64 y Discord ID en notación científica
    descargar('miembros_legion.csv', [enc, ...filas].map((r, n) => r.map((v, i) => n && (i === 7 || i === 8) && v ? `="${v}"` : celdaCSV(v)).join(';')).join('\r\n'));
  }

  $('#buscar').oninput = e => { filtro.texto = e.target.value; pintar(); };
  $('#filtro-cat').onchange = e => { filtro.cat = e.target.value; pintar(); };
  $('#resumen-miembros').onclick = ev => {
    const t = ev.target.closest('[data-cat]'); if (!t) return;
    filtro.cat = filtro.cat === t.dataset.cat ? '' : t.dataset.cat; $('#filtro-cat').value = filtro.cat; pintar();
  };
  $('#btn-csv-miembros').onclick = exportarCSV;
  if (editable) $('#btn-nuevo').onclick = () => formulario();
  $('#cuerpo-miembros').onclick = async ev => {
    const cp = ev.target.closest('[data-copiar]');
    if (cp) {
      try { await navigator.clipboard.writeText(cp.dataset.copiar); aviso('SteamID copiado.'); } catch { aviso('No se pudo copiar.', 'error'); }
      return;
    }
    const ed = ev.target.closest('[data-editar]'), bo = ev.target.closest('[data-borrar]');
    if (ed) formulario(miembros.find(m => m.id == ed.dataset.editar));
    if (bo) {
      const m = miembros.find(x => x.id == bo.dataset.borrar);
      if (!await confirmar('Borrar miembro', `¿Borrar a ${m.grado} ${m.nombre}? También se borran TODOS sus registros de actividad. Si solo dejó la legión, mejor marcalo como inactivo.`, 'Borrar')) return;
      try { await api.borrarMiembro(m.id); miembros = miembros.filter(x => x.id !== m.id); pintar(); aviso('Miembro borrado.'); } catch (e) { fallo(e); }
    }
  };
  estado.limpiezas.push(api.suscribir('miembros', async () => {
    if (!$('#modal-fondo').hidden) return;
    try { todos = await api.listarMiembros(); miembros = ordenarMiembros(todos.filter(esDeLegion)); pintar(); } catch {}
  }));
  pintar();
}

/* ============================================================ CALENDARIO */
async function vistaCalendario(cont) {
  const editable = puedeEditar();
  cont.innerHTML = `
    <div class="cal-cabecera">
      <button class="btn chico" data-mov="-1" aria-label="Mes anterior">‹</button>
      <h2 id="cal-titulo"></h2>
      <button class="btn chico" data-mov="1" aria-label="Mes siguiente">›</button>
      <button class="btn chico" id="cal-hoy">Hoy</button>
      <span class="espacio" style="flex:1"></span>
      ${editable ? '<button class="btn primario" id="cal-nuevo">+ Nuevo evento</button>' : ''}
    </div>
    <div class="cal" id="cal"></div>
    <div class="leyenda">${TIPOS_EVENTO.map(t => `<span><i class="punto" style="background:${t.color}"></i>${esc(t.nombre)}</span>`).join('')}</div>`;

  let eventos = [];

  async function cargar() {
    const { anio, mes } = estado.cal;
    $('#cal-titulo').textContent = `${MESES[mes - 1]} ${anio}`;
    const primero = new Date(anio, mes - 1, 1);
    const inicio = new Date(anio, mes - 1, 1 - ((primero.getDay() + 6) % 7));
    const dias = Array.from({ length: 42 }, (_, i) => new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i));
    eventos = await api.listarEventos(fechaISO(dias[0]), fechaISO(dias[41]));
    const hoy = fechaISO(new Date());
    $('#cal').innerHTML = DIAS.map(d => `<div class="cal-dia-nombre">${d}</div>`).join('') + dias.map(d => {
      const iso = fechaISO(d);
      const evs = eventos.filter(e => e.fecha === iso);
      return `<div class="cal-dia ${d.getMonth() !== mes - 1 ? 'fuera' : ''} ${iso === hoy ? 'hoy' : ''} ${editable ? 'puede' : ''}" data-fecha="${iso}">
        <span class="cal-num">${d.getDate()}</span>
        ${evs.map(e => `<button class="cal-evento" style="background:${colorTipo(e.tipo)}" data-evento="${e.id}" title="${esc((e.hora ? e.hora + ' · ' : '') + e.titulo)}">${e.hora ? esc(e.hora) + ' ' : ''}${esc(e.titulo)}</button>`).join('')}
      </div>`;
    }).join('');
  }

  function formulario(e) {
    const soloVer = !editable;
    const opciones = TIPOS_EVENTO.map(t => `<option ${t.nombre === e.tipo ? 'selected' : ''}>${esc(t.nombre)}</option>`).join('');
    abrirModal(soloVer ? e.titulo : (e.id ? 'Editar evento' : 'Nuevo evento'), soloVer ? `
      <p class="dato-etiqueta" style="margin:0 0 6px"><i class="punto" style="display:inline-block;background:${colorTipo(e.tipo)}"></i> ${esc(e.tipo)}</p>
      <p style="margin:0 0 12px"><strong>${esc(new Date(e.fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</strong>${e.hora ? ' · ' + esc(e.hora) : ''}</p>
      <p style="white-space:pre-wrap;line-height:1.5;margin:0 0 16px">${esc(e.descripcion) || '<span style="color:var(--texto-3)">Sin descripción.</span>'}</p>
      <div class="modal-pie"><button class="btn" data-cancelar>Cerrar</button></div>` : `
      <form id="form-evento">
        <label class="campo"><span>Título</span><input name="titulo" required maxlength="100" value="${esc(e.titulo)}"></label>
        <div class="fila-campos">
          <label class="campo"><span>Fecha</span><input name="fecha" type="date" required value="${esc(e.fecha)}"></label>
          <label class="campo"><span>Hora</span><input name="hora" type="time" value="${esc(e.hora)}"></label>
        </div>
        <label class="campo"><span>Tipo</span><select name="tipo">${opciones}</select></label>
        <label class="campo"><span>Descripción</span><textarea name="descripcion" maxlength="1000">${esc(e.descripcion)}</textarea></label>
        <div class="modal-pie">
          ${e.id ? '<button type="button" class="btn peligro izq" data-borrar>Borrar</button>' : ''}
          <button type="button" class="btn" data-cancelar>Cancelar</button><button class="btn primario">Guardar</button>
        </div>
      </form>`, c => {
      $('[data-cancelar]', c).onclick = cerrarModal;
      if (soloVer) return;
      $('#form-evento', c).onsubmit = async ev => {
        ev.preventDefault(); const f = ev.target;
        try {
          await api.guardarEvento({ ...(e.id ? { id: e.id } : {}), titulo: f.titulo.value.trim(), fecha: f.fecha.value,
            hora: f.hora.value, tipo: f.tipo.value, descripcion: f.descripcion.value.trim() });
          cerrarModal(); aviso('Evento guardado.'); await cargar();
        } catch (er) { fallo(er); }
      };
      const b = $('[data-borrar]', c);
      if (b) b.onclick = async () => {
        if (!await confirmar('Borrar evento', `¿Borrar "${e.titulo}"?`, 'Borrar')) return;
        try { await api.borrarEvento(e.id); aviso('Evento borrado.'); await cargar(); } catch (er) { fallo(er); }
      };
    });
  }

  const nuevo = fecha => ({ titulo: '', fecha, hora: '', tipo: TIPOS_EVENTO[0]?.nombre || '', descripcion: '' });
  $$('[data-mov]', cont).forEach(b => b.onclick = () => {
    const d = new Date(estado.cal.anio, estado.cal.mes - 1 + +b.dataset.mov, 1);
    estado.cal = { anio: d.getFullYear(), mes: d.getMonth() + 1 }; cargar().catch(fallo);
  });
  $('#cal-hoy').onclick = () => { const d = new Date(); estado.cal = { anio: d.getFullYear(), mes: d.getMonth() + 1 }; cargar().catch(fallo); };
  if (editable) $('#cal-nuevo').onclick = () => formulario(nuevo(fechaISO(new Date())));
  $('#cal').onclick = ev => {
    const be = ev.target.closest('[data-evento]');
    if (be) return formulario(eventos.find(e => e.id == be.dataset.evento));
    const dia = ev.target.closest('[data-fecha]');
    if (dia && editable) formulario(nuevo(dia.dataset.fecha));
  };
  estado.limpiezas.push(api.suscribir('eventos', () => { if ($('#modal-fondo').hidden) cargar().catch(() => {}); }));
  await cargar();
}

/* ============================================================ REGLAMENTO */
// Cada sección es una fila de la tabla "reglamento": datos = { titulo, texto }
async function vistaReglamento(cont) {
  let secciones = await api.listarReglamento();
  const editable = puedeEditar();

  cont.innerHTML = `
    <div class="herramientas">
      <p style="margin:0;color:var(--texto-2)">Normas del calendario. Las secciones bloqueadas 🔒 no se pueden modificar hasta desbloquearlas.</p>
      <span class="espacio"></span>
      ${editable ? '<button class="btn primario" id="btn-seccion">+ Agregar sección</button>' : ''}
    </div>
    <div id="lista-reglamento" class="reglamento"></div>`;

  // Texto con formato simple: líneas con "•" o "-" se muestran como viñetas; ``` como bloque de código
  function formatear(texto) {
    const lineas = String(texto || '').split('\n');
    let html = '', lista = false, codigo = false;
    for (const l of lineas) {
      if (l.trim().startsWith('```')) {
        if (lista) { html += '</ul>'; lista = false; }
        html += codigo ? '</pre>' : '<pre class="bloque-codigo">'; codigo = !codigo; continue;
      }
      if (codigo) { html += esc(l) + '\n'; continue; }
      const vin = /^\s*[•\-–]\s+(.*)/.exec(l);
      if (vin) { if (!lista) { html += '<ul>'; lista = true; } html += `<li>${esc(vin[1])}</li>`; continue; }
      if (lista) { html += '</ul>'; lista = false; }
      html += l.trim() ? `<p>${esc(l)}</p>` : '';
    }
    if (lista) html += '</ul>';
    if (codigo) html += '</pre>';
    return html;
  }

  function pintar() {
    $('#lista-reglamento').innerHTML = secciones.length ? secciones.map(s => `
      <section class="tarjeta seccion-reglamento ${s.bloqueado ? 'bloqueada' : ''}" data-id="${s.id}">
        <header>
          <h3>${esc(s.datos?.titulo || 'Sin título')}${s.bloqueado ? ' <span title="Bloqueada">🔒</span>' : ''}</h3>
          ${editable ? `<div class="acciones">
            <button class="btn chico" data-subir title="Subir">↑</button>
            <button class="btn chico" data-bajar title="Bajar">↓</button>
            <button class="btn chico" data-bloq>${s.bloqueado ? '🔓 Desbloquear' : '🔒 Bloquear'}</button>
            <button class="btn chico" data-editar ${s.bloqueado ? 'disabled' : ''}>Editar</button>
            <button class="btn chico peligro" data-borrar ${s.bloqueado ? 'disabled' : ''}>Borrar</button>
          </div>` : ''}
        </header>
        <div class="texto-reglamento">${formatear(s.datos?.texto)}</div>
      </section>`).join('') : '<div class="vacio">Todavía no hay secciones en el reglamento.</div>';
  }

  function editar(s = { datos: { titulo: '', texto: '' } }) {
    abrirModal(s.id ? 'Editar sección' : 'Nueva sección', `
      <form id="form-seccion">
        <label class="campo"><span>Título</span><input name="titulo" required maxlength="120" value="${esc(s.datos?.titulo)}"></label>
        <label class="campo"><span>Texto</span><textarea name="texto" rows="12" style="min-height:240px">${esc(s.datos?.texto)}</textarea></label>
        <p class="ayuda" style="margin:-6px 0 12px">Empezá una línea con "• " para hacer una viñeta. Encerrá un ejemplo entre líneas con \`\`\` para mostrarlo como formato.</p>
        <div class="modal-pie"><button type="button" class="btn" data-cancelar>Cancelar</button><button class="btn primario">Guardar</button></div>
      </form>`, c => {
      $('[data-cancelar]', c).onclick = cerrarModal;
      $('#form-seccion', c).onsubmit = async ev => {
        ev.preventDefault();
        const f = ev.target, datos = { titulo: f.titulo.value.trim(), texto: f.texto.value.replace(/\s+$/, '') };
        try {
          if (s.id) Object.assign(s, await api.guardarFilaReglamento({ id: s.id, datos }));
          else secciones.push(await api.guardarFilaReglamento({ orden: (secciones.at(-1)?.orden || 0) + 1, datos, bloqueado: false }));
          cerrarModal(); pintar(); aviso('Sección guardada.');
        } catch (e) { fallo(e); }
      };
    });
  }

  async function mover(s, dir) {
    const i = secciones.indexOf(s), j = i + dir;
    if (j < 0 || j >= secciones.length) return;
    const otra = secciones[j];
    try {
      const [a, b] = [s.orden, otra.orden === s.orden ? s.orden + dir : otra.orden];
      Object.assign(s, await api.guardarFilaReglamento({ id: s.id, orden: b }));
      Object.assign(otra, await api.guardarFilaReglamento({ id: otra.id, orden: a }));
      secciones.sort((x, y) => x.orden - y.orden || x.id - y.id); pintar();
    } catch (e) { fallo(e); }
  }

  $('#lista-reglamento').onclick = async ev => {
    const sec = ev.target.closest('[data-id]'); if (!sec) return;
    const s = secciones.find(x => x.id == sec.dataset.id);
    if (ev.target.closest('[data-editar]')) editar(s);
    else if (ev.target.closest('[data-subir]')) mover(s, -1);
    else if (ev.target.closest('[data-bajar]')) mover(s, 1);
    else if (ev.target.closest('[data-bloq]')) {
      try { Object.assign(s, await api.guardarFilaReglamento({ id: s.id, bloqueado: !s.bloqueado })); pintar(); } catch (e) { fallo(e); }
    } else if (ev.target.closest('[data-borrar]')) {
      if (!await confirmar('Borrar sección', `¿Borrar la sección "${s.datos?.titulo}"?`, 'Borrar')) return;
      try { await api.borrarFilaReglamento(s.id); secciones = secciones.filter(x => x !== s); pintar(); } catch (e) { fallo(e); }
    }
  };
  if (editable) $('#btn-seccion').onclick = () => editar();
  estado.limpiezas.push(api.suscribir('reglamento', async () => {
    if (!$('#modal-fondo').hidden) return;
    try { secciones = await api.listarReglamento(); pintar(); } catch {}
  }));
  pintar();
}

/* ============================================================ REGISTRAR ACTIVIDAD */
const CATS_FORMULARIO = ['comandantes', 'oficiales', 'suboficiales'];
// En qué registros cuenta cada miembro (igual que en la función registrar_actividad de la base)
function registroAplica(registro, m) {
  if (registro === 'oficiales') return ['comandantes', 'oficiales'].includes(m.categoria);
  if (registro === 'suboficiales') return m.categoria === 'suboficiales';
  if (registro === 'elites') return !!m.elite;
  if (registro === 'bu') return true;
  return false;
}
const nombreColumna = (registro, clave) => CATEGORIAS[registro]?.columnas.find(c => c.clave === clave)?.nombre || clave;

async function vistaActividad(cont) {
  let [tipos, miembros, actividades] = await Promise.all([api.listarTiposActividad(), api.listarMiembros(), api.listarActividades()]);
  const porId = new Map(miembros.map(m => [m.id, m]));
  const yo = porId.get(estado.perfil.miembro_id);
  // Se puede marcar a miembros activos de Sargento en adelante y a élites de cualquier rango (igual que en la base)
  const candidatos = ordenarMiembros(miembros.filter(m => m.activo && (CATS_FORMULARIO.includes(m.categoria) || !!ELITES[m.elite]) && m.id !== yo?.id));
  const filtro = { ver: 'todas' };
  const hoyISO = fechaISO(new Date());
  const tipoDe = id => tipos.find(t => t.id === id);
  const etiquetaMiembro = id => { const m = porId.get(id); return m ? `${m.grado} ${m.nombre}` : `#${id}`; };
  const verHistorial = yo?.categoria === 'comandantes';   // el historial completo solo lo ven los comandantes

  cont.innerHTML = `
    <div class="actividad-centro">
      <section class="tarjeta panel-actividad" id="panel-form"></section>
      ${verHistorial ? `<section class="historial-actividad">
        <div class="herramientas">
          <h3 style="margin:0;font-size:15px">Historial de actividades</h3>
          <span class="espacio"></span>
          <select class="entrada" id="ver-act" style="max-width:200px;height:32px">
            <option value="todas">Todas</option><option value="mias">Solo las mías</option><option value="anuladas">Anuladas</option>
          </select>
        </div>
        <div class="envoltorio-tabla"><table class="datos tabla-actividades"><thead><tr>
          <th>Fecha</th><th>Actividad</th><th>Participantes</th><th>Cargada por</th><th>Informe</th><th></th>
        </tr></thead><tbody id="cuerpo-act"></tbody></table></div>
      </section>` : ''}
    </div>`;

  /* ---------- formulario */
  function pintarFormulario() {
    const panel = $('#panel-form');
    if (!yo) {
      panel.innerHTML = `<h3>Registrar actividad</h3>
        <p style="color:var(--texto-2);line-height:1.5;margin:0">Tu cuenta todavía no está vinculada a un miembro de la legión, así que no podés cargar actividades.
        Pedile a un administrador que la vincule desde <strong>Usuarios y rangos</strong>.</p>`;
      return;
    }
    panel.innerHTML = `
      <div class="panel-actividad-cab">
        <h3>Registrar actividad</h3>
        <span class="chip-yo">Cargás como <strong>${esc(yo.grado)} ${esc(yo.nombre)}</strong></span>
      </div>
      <form id="form-act">
        <div class="fila-campos tres">
          <label class="campo"><span>Tipo de actividad</span>
            <select name="tipo" required><option value="">— Elegir —</option>${tipos.filter(t => t.activo !== false).map(t => `<option value="${esc(t.id)}">${esc(t.nombre)}</option>`).join('')}</select></label>
          <label class="campo"><span>Fecha</span><input name="fecha" type="date" required max="${fechaISO(new Date())}" value="${fechaISO(new Date())}"></label>
          <label class="campo"><span>Hora</span><input name="hora" type="time" value="${pad(new Date().getHours())}:${pad(new Date().getMinutes())}"></label>
        </div>
        <div class="campo"><span>¿Con quién la hiciste? <small class="tenue" id="limite-acomp">(opcional)</small></span>
          <div class="selector-acomp" id="selector-acomp">
            <div class="chips-acomp" id="chips-acomp"></div>
            <input id="buscar-acomp" placeholder="Escribí un nombre, rango o Discord…" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="resultados-acomp">
          </div>
          <div class="resultados-acomp" id="resultados-acomp" role="listbox" hidden></div>
        </div>
        <label class="campo"><span>Link del informe en Discord</span>
          <input name="link" type="url" required placeholder="https://discord.com/channels/…" class="mono"></label>
        <label class="campo"><span>Notas <small class="tenue">(opcional)</small></span><textarea name="notas" maxlength="500" style="min-height:56px"></textarea></label>
        <div class="vista-previa" id="vista-previa"></div>
        <div class="aviso-act" id="aviso-act"></div>
        <button class="btn primario btn-ancho" id="btn-enviar-act">Enviar actividad</button>
      </form>`;

    const f = $('#form-act');
    const seleccion = [];               // ids de los acompañantes, en el orden en que se eligieron
    let marcado = 0;                    // resultado resaltado con el teclado
    const elegidos = () => [...seleccion];
    // Máximo de participantes contando a quien carga: 2, o 3 en Capacitación élite (donde todos tienen que ser élites)
    const esCapElite = () => f.tipo.value === 'ent_esp';
    const maxAcomp = () => (esCapElite() ? 3 : 2) - 1;
    const elegible = m => !esCapElite() || !!ELITES[m.elite];
    const buscar = $('#buscar-acomp'), resultados = $('#resultados-acomp');
    const textoBusqueda = m => `${m.grado} ${m.nombre} ${m.discord_id || ''} ${m.nombre_iconico || ''} ${m.elite || ''}`.toLowerCase();

    function pintarChips() {
      $('#chips-acomp').innerHTML = seleccion.map(id => {
        const m = porId.get(id);
        return `<span class="chip-acomp"><strong>${esc(m.grado)}</strong> ${esc(m.nombre)}<button type="button" data-quitar="${id}" aria-label="Quitar a ${esc(m.nombre)}">×</button></span>`;
      }).join('');
    }
    function coincidencias() {
      const q = buscar.value.trim().toLowerCase();
      return candidatos.filter(m => !seleccion.includes(m.id) && elegible(m) && (!q || q.split(/\s+/).every(p => textoBusqueda(m).includes(p))));
    }
    function pintarResultados() {
      const lista = coincidencias();
      marcado = Math.min(marcado, Math.max(lista.length - 1, 0));
      resultados.hidden = false; buscar.setAttribute('aria-expanded', 'true');
      if (seleccion.length >= maxAcomp()) {
        resultados.innerHTML = `<div class="res-vacio">Ya marcaste el máximo para esta actividad (${maxAcomp() + 1} participantes contándote a vos).</div>`;
        return;
      }
      resultados.innerHTML = lista.length ? lista.map((m, i) => `
        <div class="res-acomp ${i === marcado ? 'marcado' : ''}" role="option" data-elegir="${m.id}">
          <span class="res-rango">${esc(m.grado)}</span><span class="res-nombre">${esc(m.nombre)}</span>
          ${ELITES[m.elite] ? `<span class="etiqueta admin">${esc(m.elite)}</span>` : ''}
          <span class="res-cat">${esc(tituloCat(m.categoria))}</span>
        </div>`).join('') : '<div class="res-vacio">Nadie coincide con la búsqueda.</div>';
      $('.res-acomp.marcado', resultados)?.scrollIntoView({ block: 'nearest' });
    }
    function cerrarResultados() { resultados.hidden = true; buscar.setAttribute('aria-expanded', 'false'); }
    function elegir(id) {
      if (seleccion.length >= maxAcomp()) return;
      if (!seleccion.includes(id)) seleccion.push(id);
      buscar.value = ''; marcado = 0;
      pintarChips(); pintarResultados(); actualizar(); buscar.focus();
    }
    buscar.onfocus = pintarResultados;
    buscar.oninput = () => { marcado = 0; pintarResultados(); };
    buscar.onkeydown = ev => {
      const lista = coincidencias();
      if (ev.key === 'ArrowDown') { ev.preventDefault(); marcado = Math.min(marcado + 1, lista.length - 1); pintarResultados(); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); marcado = Math.max(marcado - 1, 0); pintarResultados(); }
      else if (ev.key === 'Enter') { ev.preventDefault(); if (!resultados.hidden && lista[marcado]) elegir(lista[marcado].id); }
      else if (ev.key === 'Escape') cerrarResultados();
      else if (ev.key === 'Backspace' && !buscar.value && seleccion.length) { seleccion.pop(); pintarChips(); pintarResultados(); actualizar(); }
    };
    resultados.onmousedown = ev => {     // mousedown para que no se cierre antes por el blur
      const r = ev.target.closest('[data-elegir]'); if (!r) return;
      ev.preventDefault(); elegir(+r.dataset.elegir);
    };
    $('#selector-acomp').onclick = ev => {
      const q = ev.target.closest('[data-quitar]');
      if (q) { seleccion.splice(seleccion.indexOf(+q.dataset.quitar), 1); pintarChips(); actualizar(); }
      buscar.focus();
    };
    buscar.onblur = () => setTimeout(cerrarResultados, 120);

    const actualizar = () => {
      const ids = elegidos();
      const max = maxAcomp();
      $('#limite-acomp').textContent = esCapElite()
        ? `(opcional · hasta ${max} élites más)` : `(opcional · hasta ${max} persona${max === 1 ? '' : 's'} más)`;
      const yoNoElite = esCapElite() && !ELITES[yo.elite];
      $('#btn-enviar-act').disabled = yoNoElite;
      $('#aviso-act').innerHTML = yoNoElite ? 'Para registrar una Capacitación élite tenés que tener una élite asignada en el sistema.' : '';
      const t = tipoDe(f.tipo.value);
      if (!t) { $('#vista-previa').innerHTML = ''; return; }
      const [anio, mes] = (f.fecha.value || hoyISO).split('-').map(Number);
      const lineas = [yo.id, ...ids].map(id => {
        const m = porId.get(id);
        const suma = t.efectos.filter(e => (e.rol === 'todos' || (e.rol === 'autor' ? id === yo.id : id !== yo.id)) && registroAplica(e.registro, m))
          .map(e => `${nombreColumna(e.registro, e.columna)} <span class="tenue">(${esc(CATEGORIAS[e.registro]?.titulo || e.registro)})</span>`);
        return `<li><strong>${esc(m.grado)} ${esc(m.nombre)}</strong>: ${suma.length ? '+1 en ' + suma.join(', ') : '<span class="tenue">no suma en ninguna tabla</span>'}</li>`;
      });
      $('#vista-previa').innerHTML = `<div class="dato-etiqueta" style="margin-bottom:4px">Se va a sumar en ${MESES[mes - 1]} ${anio}:</div><ul>${lineas.join('')}</ul>`;
    };
    f.tipo.onchange = () => {
      // Al cambiar de tipo se quitan los que ya no corresponden (no élites o por encima del máximo)
      const antes = seleccion.length;
      const quedan = seleccion.filter(id => elegible(porId.get(id))).slice(0, maxAcomp());
      seleccion.splice(0, seleccion.length, ...quedan);
      if (seleccion.length < antes) aviso(esCapElite() ? 'Se quitaron los acompañantes que no son élites o que superan el máximo.' : 'Se quitaron acompañantes que superan el máximo para este tipo.');
      pintarChips(); actualizar();
    };
    f.fecha.onchange = actualizar;
    actualizar();
    f.onsubmit = async ev => {
      ev.preventDefault();
      const link = f.link.value.trim();
      if (!/^https:\/\/([a-z]+\.)?(discord\.com|discordapp\.com)\//i.test(link)) return aviso('El link tiene que ser un enlace de Discord (https://discord.com/…).', 'error');
      const btn = $('#btn-enviar-act'); btn.disabled = true;
      try {
        const nueva = await api.registrarActividad({ tipo: f.tipo.value, fecha: f.fecha.value, hora: f.hora.value, link, notas: f.notas.value.trim(), acompanantes: elegidos() });
        actividades.unshift(nueva);
        aviso(`Actividad registrada: ${tipoDe(nueva.tipo)?.nombre}. Se sumó a ${nueva.participantes.length} participante${nueva.participantes.length === 1 ? '' : 's'}.`);
        pintarFormulario(); pintarHistorial();
      } catch (e) { fallo(e); }
      finally { const b = $('#btn-enviar-act'); if (b) b.disabled = false; }
    };
  }

  /* ---------- historial */
  function pintarHistorial() {
    if (!verHistorial) return;
    const lista = actividades.filter(a => filtro.ver === 'anuladas' ? a.anulada
      : !a.anulada && (filtro.ver !== 'mias' || a.participantes.includes(yo?.id) || a.autor_perfil === estado.perfil.id));
    $('#cuerpo-act').innerHTML = lista.length ? lista.map(a => {
      const puedeAnular = !a.anulada;   // el historial solo lo ven comandantes, que pueden anular siempre
      return `<tr class="${a.anulada ? 'fila-inactiva' : ''}">
        <td>${new Date(a.fecha + 'T00:00:00').toLocaleDateString('es-AR')}${a.hora ? `<span class="sub">${esc(a.hora)}</span>` : ''}</td>
        <td><strong>${esc(tipoDe(a.tipo)?.nombre || a.tipo)}</strong>${a.notas ? `<span class="sub" title="${esc(a.notas)}">${esc(a.notas.slice(0, 60))}</span>` : ''}</td>
        <td style="white-space:normal;min-width:160px">${a.participantes.map(id => `<a class="link-perfil" href="#/perfil?id=${id}">${esc(etiquetaMiembro(id))}</a>`).join(', ')}</td>
        <td>${esc(etiquetaMiembro(a.autor_miembro))}<span class="sub">${new Date(a.creado_en).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</span></td>
        <td><a href="${esc(a.link)}" target="_blank" rel="noopener noreferrer">Abrir</a></td>
        <td class="acciones">${a.anulada ? '<span class="etiqueta">Anulada</span>' : puedeAnular ? `<button class="btn chico peligro" data-anular="${a.id}">Anular</button>` : ''}</td>
      </tr>`;
    }).join('') : `<tr><td colspan="6" class="vacio">${filtro.ver === 'anuladas' ? 'No hay actividades anuladas.' : 'Todavía no hay actividades cargadas.'}</td></tr>`;
  }

  if (verHistorial) $('#ver-act').onchange = e => { filtro.ver = e.target.value; pintarHistorial(); };
  if (verHistorial) $('#cuerpo-act').onclick = async ev => {
    const b = ev.target.closest('[data-anular]'); if (!b) return;
    const a = actividades.find(x => x.id == b.dataset.anular);
    if (!await confirmar('Anular actividad', `Se va a anular "${tipoDe(a.tipo)?.nombre}" del ${new Date(a.fecha + 'T00:00:00').toLocaleDateString('es-AR')} y se descuenta de las tablas de ${a.participantes.length} participante${a.participantes.length === 1 ? '' : 's'}.`, 'Anular')) return;
    try { Object.assign(a, await api.anularActividad(a.id)); pintarHistorial(); aviso('Actividad anulada y descontada.'); } catch (e) { fallo(e); }
  };
  estado.limpiezas.push(api.suscribir('actividades', async () => {
    try { actividades = await api.listarActividades(); pintarHistorial(); } catch {}
  }));
  pintarFormulario();
  pintarHistorial();
}

/* ============================================================ PERFIL DE UN MIEMBRO */
const MINUTOS_ANULAR = 10;   // igual que en la función anular_actividad de la base
// Totales del resumen mensual: cada uno suma estas columnas en estos registros
const TOTALES_PERFIL = [
  { titulo: 'Actividad total', ayuda: 'Act. total de Oficiales y Comandantes / Suboficiales', calc: { oficiales: 'act_total', suboficiales: 'act_total' } },
  { titulo: 'Entrenamientos', cols: { oficiales: ['ents_21', 'ents_esp', 'ents_bu'], suboficiales: ['ents_21', 'ents_esp', 'ents_bu'], cabos: ['ents'], soldados: ['ents'] } },
  { titulo: 'Roles de PJ', cols: { oficiales: ['roles_pj'], suboficiales: ['roles_pj'], cabos: ['roles_pj'], soldados: ['roles_pj'] } },
  { titulo: 'Trys', cols: { oficiales: ['try_bu', 'try_esp', 'try_21'], suboficiales: ['try_esp', 'try_21'] } },
  { titulo: 'Capacitaciones', cols: { elites: ['n_cap'], bu: ['cap_ent', 'cap_part'], cabos: ['caps'], soldados: ['caps'] } },
  { titulo: 'Actividad BU', calc: { bu: 'total' } },
];

async function vistaPerfil(cont) {
  const idParam = estado.params?.get('id');
  const miembroId = idParam ? +idParam : estado.perfil.miembro_id;
  if (!miembroId) {
    cont.innerHTML = `<div class="vacio">Tu cuenta todavía no está vinculada a un miembro de la legión.<br>Pedile a un administrador que la vincule en <strong>Usuarios y rangos</strong>,
      o entrá a <a href="#/miembros">Miembros de la legión</a> y tocá el nombre de alguien para ver su perfil.</div>`;
    return;
  }
  const [miembros, registros, actividades, tipos, perfiles] = await Promise.all([
    api.listarMiembros(), api.listarRegistrosMiembro(miembroId), api.listarActividadesMiembro(miembroId),
    api.listarTiposActividad(), esAdmin() ? api.listarPerfiles() : Promise.resolve([]),
  ]);
  const porId = new Map(miembros.map(m => [m.id, m]));
  const m = porId.get(miembroId);
  if (!m) { cont.innerHTML = '<div class="vacio">Ese miembro no existe o fue borrado.</div>'; return; }
  const etiqueta = id => { const x = porId.get(id); return x ? `${x.grado} ${x.nombre}` : `#${id}`; };
  const tipoNombre = id => tipos.find(t => t.id === id)?.nombre || id;
  const cuenta = perfiles.find(p => p.miembro_id === m.id);
  $('#titulo-seccion').textContent = `Perfil · ${m.grado} ${m.nombre}`;
  document.title = `${m.grado} ${m.nombre} · ${NOMBRE_SITIO}`;

  // Agrupar celdas por hoja (registro + mes/período). Los períodos de Soldados/Cabos cuentan en el mes en que empiezan.
  const hojas = new Map();
  for (const r of registros) {
    if (r.valor === null || r.valor === '') continue;   // celdas vacías (por ejemplo, tras anular una actividad)
    const k = `${r.categoria}|${r.anio}|${r.mes}|${r.periodo || ''}`;
    if (!hojas.has(k)) hojas.set(k, { categoria: r.categoria, anio: r.anio, mes: r.mes, periodo: r.periodo || '', vals: {} });
    hojas.get(k).vals[r.columna] = r.valor;
  }
  for (const h of hojas.values()) {
    const cfg = CATEGORIAS[h.categoria];
    h.calc = cfg ? calcularFila(cfg, c => h.vals[c]) : {};
  }

  const hoy = new Date();
  const sel = { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 };

  const dato = (titulo, valor) => valor ? `<div><span class="dato-etiqueta">${titulo}</span><div>${valor}</div></div>` : '';
  cont.innerHTML = `
    <div class="perfil-cabecera tarjeta">
      <div class="perfil-avatar">${esc((m.nombre || '?').charAt(0).toUpperCase())}</div>
      <div class="perfil-principal">
        <div class="perfil-nombre">${esc(m.grado)} ${esc(m.nombre)}
          ${tieneIconico(m) ? `<span class="etiqueta admin">${esc(m.nombre_iconico)}</span>` : ''}
          ${ELITES[m.elite] ? `<span class="etiqueta admin" title="${esc(ELITES[m.elite])}">${esc(m.elite)}</span>` : ''}
          <span class="etiqueta ${m.activo ? 'admin' : ''}">${m.activo ? 'Activo' : 'Inactivo'}</span></div>
        <div class="perfil-datos">
          ${dato('Categoría', esc(tituloCat(m.categoria)))}
          ${dato('Discord', m.discord_id ? `<span class="mono">${esc(m.discord_id)}</span>` : '')}
          ${dato('Ingreso', m.fecha_ingreso ? new Date(m.fecha_ingreso + 'T00:00:00').toLocaleDateString('es-AR') : '')}
          ${dato('Cuenta vinculada', cuenta ? esc(cuenta.nombre) : '')}
        </div>
      </div>
      <a class="btn chico" href="#/miembros">← Miembros</a>
    </div>

    <div class="herramientas" style="margin-top:18px">
      <h3 style="margin:0;font-size:15px">Resumen del mes</h3>
      <span class="espacio"></span>
      <div class="selector-anio">
        <button data-mov="-1" aria-label="Mes anterior">‹</button>
        <span id="txt-mes-perfil" style="min-width:140px"></span>
        <button data-mov="1" aria-label="Mes siguiente">›</button>
      </div>
      <button class="btn chico" id="btn-mes-actual">Mes actual</button>
    </div>
    <div class="rejilla perfil-totales" id="perfil-totales"></div>
    <p class="dato-etiqueta" id="perfil-requisito" style="margin:10px 0 0"></p>

    <h3 class="seccion-titulo" id="titulo-actividades">Actividades registradas</h3>
    <div class="envoltorio-tabla"><table class="datos tabla-actividades"><thead><tr>
      <th>Fecha</th><th>Actividad</th><th>Rol</th><th>Con</th><th>Cargada por</th><th>Registrada el</th><th>Informe</th>
    </tr></thead><tbody id="perfil-actividades"></tbody></table></div>

    <div id="bloque-anuladas" hidden>
      <h3 class="seccion-titulo" id="titulo-anuladas">Actividades anuladas</h3>
      <p class="dato-etiqueta" style="margin:-6px 0 10px">No suman en las tablas. Se muestran solo para control.</p>
      <div class="envoltorio-tabla"><table class="datos tabla-actividades"><thead><tr>
        <th>Fecha</th><th>Actividad</th><th>Rol</th><th>Con</th><th>Cargada por</th><th>Anulada el</th><th>Informe</th>
      </tr></thead><tbody id="perfil-anuladas"></tbody></table></div>
    </div>`;

  // Una fila de actividad. En las anuladas, la penúltima columna muestra cuándo se anuló.
  function filaActividad(a) {
    const otros = a.participantes.filter(id => id !== m.id);
    const cuando = a.anulada ? a.anulada_en : a.creado_en;
    return `<tr>
      <td>${new Date(a.fecha + 'T00:00:00').toLocaleDateString('es-AR')}${a.hora ? `<span class="sub">${esc(a.hora)}</span>` : ''}</td>
      <td><strong>${esc(tipoNombre(a.tipo))}</strong>${a.notas ? `<span class="sub" title="${esc(a.notas)}">${esc(a.notas.slice(0, 60))}</span>` : ''}</td>
      <td>${a.autor_miembro === m.id ? 'Organizó' : 'Participó'}</td>
      <td style="white-space:normal;min-width:140px">${otros.length ? otros.map(id => `<a class="link-perfil" href="#/perfil?id=${id}">${esc(etiqueta(id))}</a>`).join(', ') : '<span class="tenue">—</span>'}</td>
      <td>${a.autor_miembro ? `<a class="link-perfil" href="#/perfil?id=${a.autor_miembro}">${esc(etiqueta(a.autor_miembro))}</a>` : '—'}</td>
      <td>${cuando ? new Date(cuando).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
      <td class="acciones"><a class="btn chico" href="${esc(a.link)}" target="_blank" rel="noopener noreferrer">Abrir en Discord ↗</a>${botonAnular(a)}</td>
    </tr>`;
  }

  // Quien cargó la actividad puede anularla desde su perfil durante los primeros minutos (la base lo vuelve a controlar)
  function minutosParaAnular(a) {
    if (a.anulada || a.autor_perfil !== estado.perfil.id) return 0;
    return Math.max(0, MINUTOS_ANULAR - (Date.now() - new Date(a.creado_en)) / 60000);
  }
  function botonAnular(a) {
    const min = minutosParaAnular(a);
    if (!min) return '';
    const txt = min < 1 ? 'menos de 1 min' : `${Math.ceil(min)} min`;
    return ` <button class="btn chico peligro" data-anular="${a.id}" title="Podés anularla durante ${MINUTOS_ANULAR} minutos desde que la cargaste">Anular (queda${min < 1 || Math.ceil(min) === 1 ? '' : 'n'} ${txt})</button>`;
  }

  function pintar() {
    const nombreMes = `${MESES[sel.mes - 1]} ${sel.anio}`;
    $('#txt-mes-perfil').textContent = nombreMes;
    $('#titulo-actividades').textContent = `Actividades registradas en ${nombreMes}`;
    const delMes = [...hojas.values()].filter(h => h.anio === sel.anio && h.mes === sel.mes);

    // Totales
    $('#perfil-totales').innerHTML = TOTALES_PERFIL.map(t => {
      let total = 0;
      for (const h of delMes) {
        if (t.calc?.[h.categoria]) total += numero(h.calc[t.calc[h.categoria]]);
        for (const c of t.cols?.[h.categoria] || []) total += numero(h.vals[c]);
      }
      return `<div class="tarjeta" ${t.ayuda ? `title="${esc(t.ayuda)}"` : ''}>
        <div class="dato-grande">${formatoNum(total)}</div><div class="dato-etiqueta">${esc(t.titulo)}</div></div>`;
    }).join('');

    // Requisito del mes (Oficiales / Suboficiales)
    const principal = delMes.find(h => h.calc?.requisitos);
    $('#perfil-requisito').innerHTML = principal ? `Requisito del mes en ${esc(CATEGORIAS[principal.categoria].titulo)}: <strong>${esc(principal.calc.requisitos)}</strong>` : '';

    // Actividades del mes con su link
    const delMesActs = actividades.filter(a => +a.fecha.slice(0, 4) === sel.anio && +a.fecha.slice(5, 7) === sel.mes);
    const acts = delMesActs.filter(a => !a.anulada), anuladas = delMesActs.filter(a => a.anulada);
    const hayHistorial = delMes.length > 0;
    $('#bloque-anuladas').hidden = !anuladas.length;
    $('#titulo-anuladas').textContent = `Actividades anuladas en ${nombreMes} (${anuladas.length})`;
    $('#perfil-anuladas').innerHTML = anuladas.map(filaActividad).join('');
    $('#perfil-actividades').innerHTML = acts.length ? acts.map(filaActividad).join('') : `<tr><td colspan="7" class="vacio">${hayHistorial
      ? 'Este mes no tiene actividades cargadas desde la página. Los números de arriba vienen del historial de los Excel, que no tiene informes.'
      : 'Sin actividades registradas en este mes.'}</td></tr>`;
  }

  $$('[data-mov]', cont).forEach(b => b.onclick = () => {
    const d = new Date(sel.anio, sel.mes - 1 + +b.dataset.mov, 1);
    sel.anio = d.getFullYear(); sel.mes = d.getMonth() + 1; pintar();
  });
  $('#btn-mes-actual').onclick = () => { sel.anio = hoy.getFullYear(); sel.mes = hoy.getMonth() + 1; pintar(); };
  $('#perfil-actividades').onclick = async ev => {
    const b = ev.target.closest('[data-anular]'); if (!b) return;
    const a = actividades.find(x => x.id == b.dataset.anular);
    if (!await confirmar('Anular actividad', `Se va a anular "${tipoNombre(a.tipo)}" del ${new Date(a.fecha + 'T00:00:00').toLocaleDateString('es-AR')} y se descuenta de las tablas de ${a.participantes.length} participante${a.participantes.length === 1 ? '' : 's'}.`, 'Anular')) return;
    try { await api.anularActividad(a.id); aviso('Actividad anulada y descontada.'); navegar(); } catch (e) { fallo(e); }
  };
  // Mientras haya actividades que todavía se pueden anular, se actualiza el contador; al vencer, el botón desaparece
  if (actividades.some(a => minutosParaAnular(a) > 0)) {
    const reloj = setInterval(() => { if ($('#perfil-actividades')) pintar(); else clearInterval(reloj); }, 20000);
    estado.limpiezas.push(() => clearInterval(reloj));
  }
  pintar();
}

/* ============================================================ FORO DE ADMINISTRACIÓN */
// Texto con saltos de línea y links clickeables
function textoForo(t) {
  return esc(t || '').replace(/https?:\/\/[^\s<]+/g, u => `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`);
}
function haceCuanto(fecha) {
  const s = Math.round((Date.now() - new Date(fecha)) / 1000);
  if (s < 60) return 'recién';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  if (s < 7 * 86400) { const d = Math.floor(s / 86400); return `hace ${d} día${d === 1 ? '' : 's'}`; }
  return new Date(fecha).toLocaleDateString('es-AR');
}

async function vistaForo(cont) {
  let [temas, perfiles, miembros] = await Promise.all([api.listarTemasForo(), api.listarPerfiles(), api.listarMiembros()]);
  const porMiembro = new Map(miembros.map(m => [m.id, m]));
  const autor = uid => {
    const p = perfiles.find(x => x.id === uid);
    if (!p) return 'Cuenta borrada';
    const m = porMiembro.get(p.miembro_id);
    return m ? `${m.grado} ${m.nombre}` : p.nombre;
  };
  const inicial = uid => autor(uid).replace(/^[A-Z0-9]+\s/, '').charAt(0).toUpperCase() || '?';
  const fechaLarga = f => new Date(f).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
  let actual = +(estado.params?.get('tema') || 0) || null;
  let comentarios = [];
  let busqueda = '';

  cont.innerHTML = `
    <div class="foro">
      <aside class="foro-lista">
        <div class="foro-lista-cab">
          <input class="entrada" id="foro-buscar" placeholder="Buscar tema…">
          <button class="btn primario" id="foro-nuevo">+ Nuevo tema</button>
        </div>
        <div id="foro-temas"></div>
      </aside>
      <section class="foro-tema tarjeta" id="foro-tema"></section>
    </div>
    <p class="ayuda">Solo lo ven las cuentas con rango Administrador. <kbd>Ctrl</kbd>+<kbd>Enter</kbd> publica el comentario.</p>`;

  const ordenar = () => temas.sort((a, b) => (b.fijado - a.fijado) || (new Date(b.ultima_actividad) - new Date(a.ultima_actividad)));

  function pintarLista() {
    ordenar();
    const q = busqueda.trim().toLowerCase();
    const lista = temas.filter(t => !q || (t.titulo + ' ' + t.texto + ' ' + autor(t.autor)).toLowerCase().includes(q));
    $('#foro-temas').innerHTML = lista.length ? lista.map(t => `
      <a class="foro-item ${t.id === actual ? 'activo' : ''}" href="#/foro?tema=${t.id}" data-tema="${t.id}">
        <div class="foro-item-titulo">${t.fijado ? '<span class="foro-pin" title="Fijado">📌</span>' : ''}${esc(t.titulo)}</div>
        <div class="foro-item-meta">${esc(autor(t.autor))} · ${haceCuanto(t.ultima_actividad)}
          <span class="foro-cuenta" title="Comentarios">💬 ${t.n_comentarios ?? 0}</span></div>
      </a>`).join('')
      : `<div class="vacio" style="padding:24px 12px">${temas.length ? 'Ningún tema coincide.' : 'Todavía no hay temas.<br>Creá el primero con <strong>+ Nuevo tema</strong>.'}</div>`;
  }

  async function abrirTema(id) {
    actual = id;
    pintarLista();
    const panel = $('#foro-tema');
    const t = temas.find(x => x.id === id);
    if (!t) {
      panel.innerHTML = `<div class="vacio">${temas.length ? 'Elegí un tema de la lista para leerlo y comentar.' : 'Acá vas a ver los temas y sus comentarios.'}</div>`;
      return;
    }
    panel.innerHTML = '<div class="vacio">Cargando…</div>';
    comentarios = await api.listarComentariosForo(id);
    if (actual !== id) return;
    pintarTema();
  }

  function pintarTema() {
    const t = temas.find(x => x.id === actual); if (!t) return abrirTema(null);
    const mio = t.autor === estado.perfil.id;
    $('#foro-tema').innerHTML = `
      <header class="foro-tema-cab">
        <div style="min-width:0">
          <h2>${t.fijado ? '📌 ' : ''}${esc(t.titulo)}</h2>
          <div class="foro-item-meta">Por <strong>${esc(autor(t.autor))}</strong> · ${fechaLarga(t.creado_en)}${t.editado_en ? ' · editado' : ''}</div>
        </div>
        <div class="foro-acciones">
          <button class="btn chico" data-accion="fijar">${t.fijado ? 'Desfijar' : 'Fijar'}</button>
          ${mio ? '<button class="btn chico" data-accion="editar">Editar</button>' : ''}
          <button class="btn chico peligro" data-accion="borrar">Borrar</button>
        </div>
      </header>
      ${t.texto ? `<div class="foro-texto">${textoForo(t.texto)}</div>` : ''}
      <h3 class="foro-sub">Comentarios <span>${comentarios.length}</span></h3>
      <div class="foro-comentarios">${comentarios.length ? comentarios.map(c => `
        <article class="foro-com">
          <div class="foro-avatar">${esc(inicial(c.autor))}</div>
          <div class="foro-com-cuerpo">
            <div class="foro-com-cab"><strong>${esc(autor(c.autor))}</strong>
              <span class="tenue" title="${fechaLarga(c.creado_en)}">${haceCuanto(c.creado_en)}${c.editado_en ? ' · editado' : ''}</span>
              <span class="espacio"></span>
              ${c.autor === estado.perfil.id ? `<button class="btn-link" data-editar-com="${c.id}">Editar</button>` : ''}
              <button class="btn-link peligro" data-borrar-com="${c.id}">Borrar</button>
            </div>
            <div class="foro-texto" id="com-${c.id}">${textoForo(c.texto)}</div>
          </div>
        </article>`).join('') : '<div class="tenue" style="padding:6px 0 4px">Sin comentarios todavía.</div>'}</div>
      <form class="foro-responder" id="foro-responder">
        <textarea name="texto" maxlength="5000" placeholder="Escribí un comentario…" required></textarea>
        <div class="foro-responder-pie"><span class="tenue">Comentás como ${esc(autor(estado.perfil.id))}</span><button class="btn primario">Comentar</button></div>
      </form>`;

    const f = $('#foro-responder');
    f.texto.onkeydown = ev => { if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); f.requestSubmit(); } };
    f.onsubmit = async ev => {
      ev.preventDefault();
      const texto = f.texto.value.trim(); if (!texto) return;
      const btn = $('button', f); btn.disabled = true;
      try {
        comentarios.push(await api.guardarComentarioForo({ tema_id: t.id, texto }));
        t.n_comentarios = comentarios.length; t.ultima_actividad = new Date().toISOString();
        pintarTema(); pintarLista();
        $('.foro-comentarios .foro-com:last-child')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } catch (e) { fallo(e); btn.disabled = false; }
    };
  }

  function formularioTema(t) {
    abrirModal(t ? 'Editar tema' : 'Nuevo tema', `
      <form id="form-tema">
        <label class="campo"><span>Título</span><input name="titulo" required maxlength="120" value="${esc(t?.titulo || '')}"></label>
        <label class="campo"><span>Mensaje <small class="tenue">(opcional)</small></span><textarea name="texto" maxlength="5000" style="min-height:140px">${esc(t?.texto || '')}</textarea></label>
        <div class="modal-pie"><button type="button" class="btn" data-cancelar>Cancelar</button><button class="btn primario">${t ? 'Guardar' : 'Publicar tema'}</button></div>
      </form>`, c => {
      const f = $('#form-tema', c);
      $('[data-cancelar]', c).onclick = cerrarModal;
      f.titulo.focus();
      f.onsubmit = async ev => {
        ev.preventDefault();
        try {
          const g = await api.guardarTemaForo({ ...(t ? { id: t.id } : {}), titulo: f.titulo.value.trim(), texto: f.texto.value.trim() });
          if (t) Object.assign(t, g); else temas.push({ ...g, n_comentarios: 0 });
          cerrarModal(); aviso(t ? 'Tema guardado.' : 'Tema publicado.');
          location.hash = `#/foro?tema=${g.id}`;
          abrirTema(g.id);
        } catch (e) { fallo(e); }
      };
    });
  }

  $('#foro-nuevo').onclick = () => formularioTema();
  $('#foro-buscar').oninput = e => { busqueda = e.target.value; pintarLista(); };
  $('#foro-temas').onclick = ev => {
    const a = ev.target.closest('[data-tema]'); if (!a) return;
    ev.preventDefault();
    history.replaceState(null, '', `#/foro?tema=${a.dataset.tema}`);
    abrirTema(+a.dataset.tema);
  };
  $('#foro-tema').onclick = async ev => {
    const t = temas.find(x => x.id === actual); if (!t) return;
    const acc = ev.target.closest('[data-accion]')?.dataset.accion;
    try {
      if (acc === 'fijar') { Object.assign(t, await api.guardarTemaForo({ id: t.id, fijado: !t.fijado })); pintarTema(); pintarLista(); }
      else if (acc === 'editar') formularioTema(t);
      else if (acc === 'borrar') {
        if (!await confirmar('Borrar tema', `¿Borrar "${t.titulo}" con sus ${comentarios.length} comentario${comentarios.length === 1 ? '' : 's'}? No se puede deshacer.`, 'Borrar')) return;
        await api.borrarTemaForo(t.id); temas = temas.filter(x => x !== t);
        history.replaceState(null, '', '#/foro'); abrirTema(null); aviso('Tema borrado.');
      }
      const bc = ev.target.closest('[data-borrar-com]');
      if (bc) {
        if (!await confirmar('Borrar comentario', '¿Borrar este comentario? No se puede deshacer.', 'Borrar')) return;
        await api.borrarComentarioForo(+bc.dataset.borrarCom);
        comentarios = comentarios.filter(c => c.id !== +bc.dataset.borrarCom); t.n_comentarios = comentarios.length;
        pintarTema(); pintarLista();
      }
      const ec = ev.target.closest('[data-editar-com]');
      if (ec) {
        const c = comentarios.find(x => x.id === +ec.dataset.editarCom), caja = $(`#com-${c.id}`);
        caja.innerHTML = `<textarea class="entrada" style="min-height:80px;width:100%">${esc(c.texto)}</textarea>
          <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:6px"><button class="btn chico" data-cancelar-com>Cancelar</button><button class="btn chico primario" data-guardar-com>Guardar</button></div>`;
        const ta = $('textarea', caja); ta.focus();
        $('[data-cancelar-com]', caja).onclick = e => { e.stopPropagation(); pintarTema(); };
        $('[data-guardar-com]', caja).onclick = async e => {
          e.stopPropagation();
          const texto = ta.value.trim(); if (!texto) return;
          try { Object.assign(c, await api.guardarComentarioForo({ id: c.id, texto })); pintarTema(); } catch (er) { fallo(er); }
        };
      }
    } catch (e) { fallo(e); }
  };

  // Cambios de otros administradores en tiempo real
  let espera;
  const refrescar = () => {
    clearTimeout(espera);
    espera = setTimeout(async () => {
      if (!$('#modal-fondo').hidden || document.activeElement?.closest?.('.foro-com textarea, .foro-responder textarea:not(:placeholder-shown)')) return;
      try {
        temas = await api.listarTemasForo(); pintarLista();
        if (actual && temas.some(t => t.id === actual)) { comentarios = await api.listarComentariosForo(actual); pintarTema(); }
        else if (actual) abrirTema(null);
      } catch {}
    }, 500);
  };
  estado.limpiezas.push(api.suscribir('foro_temas', refrescar), api.suscribir('foro_comentarios', refrescar));

  pintarLista();
  abrirTema(actual && temas.some(t => t.id === actual) ? actual : (temas.length ? ordenar()[0].id : null));
}

/* ============================================================ INFORMAR INACTIVIDAD */
const TIPOS_INACTIVIDAD = {
  total:   { nombre: 'Inactividad total',   ayuda: 'No vas a poder participar de nada.' },
  parcial: { nombre: 'Inactividad parcial', ayuda: 'Vas a estar con menos actividad (semi-activo).' },
};
const DURACIONES_INACTIVIDAD = [
  { dias: 3, txt: '3 días' }, { dias: 7, txt: '1 semana' }, { dias: 14, txt: '2 semanas' },
  { dias: 30, txt: '1 mes' }, { dias: 60, txt: '2 meses' }, { dias: 0, txt: 'Otra' },
];
const MAX_DIAS_INACTIVIDAD = 121;   // igual que en la base (hasta - desde <= 120)
const sumarDias = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return fechaISO(d); };
const diasEntre = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 864e5) + 1;
const fechaAR = iso => new Date(iso + 'T00:00:00').toLocaleDateString('es-AR');
function estadoInactividad(x) {
  const hoy = fechaISO(new Date());
  if (x.cancelada) return { txt: 'Cancelada', clase: '' };
  if (hoy < x.desde) return { txt: 'Programada', clase: 'programada' };
  if (hoy > x.hasta) return { txt: 'Finalizada', clase: '' };
  return { txt: 'En curso', clase: 'en-curso' };
}

async function vistaInactividad(cont) {
  let [lista, miembros] = await Promise.all([api.listarInactividades(), api.listarMiembros()]);
  const porId = new Map(miembros.map(m => [m.id, m]));
  const yo = porId.get(estado.perfil.miembro_id);
  const veTodo = esAdmin() || yo?.categoria === 'comandantes';
  const etiqueta = id => { const m = porId.get(id); return m ? `${m.grado} ${m.nombre}` : `#${id}`; };
  const filtro = { ver: 'activas' };

  cont.innerHTML = `
    <div class="actividad-centro">
      <section class="tarjeta panel-actividad" id="panel-inact"></section>
      <section>
        <h3 class="seccion-titulo" style="margin-top:0">Mis avisos de inactividad</h3>
        <div class="envoltorio-tabla"><table class="datos"><thead><tr>
          <th>Estado</th><th>Tipo</th><th>Desde</th><th>Hasta</th><th>Motivo</th><th>Aviso</th><th></th>
        </tr></thead><tbody id="mis-inact"></tbody></table></div>
      </section>
      ${veTodo ? `<section>
        <div class="herramientas">
          <h3 style="margin:0;font-size:15px">Inactividades de la legión</h3>
          <span class="espacio"></span>
          <select class="entrada" id="ver-inact" style="max-width:200px;height:32px">
            <option value="activas">En curso y programadas</option><option value="todas">Todas</option>
          </select>
        </div>
        <div class="envoltorio-tabla"><table class="datos"><thead><tr>
          <th>Estado</th><th>Miembro</th><th>Tipo</th><th>Desde</th><th>Hasta</th><th>Motivo</th><th>Aviso</th><th></th>
        </tr></thead><tbody id="todas-inact"></tbody></table></div>
      </section>` : ''}
    </div>`;

  /* ---------- formulario */
  function pintarFormulario() {
    const panel = $('#panel-inact');
    if (!yo) {
      panel.innerHTML = `<h3>Informar inactividad</h3>
        <p style="color:var(--texto-2);line-height:1.5;margin:0">Tu cuenta todavía no está vinculada a un miembro de la legión, así que no podés informar inactividad.
        Pedile a un administrador que la vincule desde <strong>Usuarios y rangos</strong>.</p>`;
      return;
    }
    const hoy = fechaISO(new Date());
    panel.innerHTML = `
      <div class="panel-actividad-cab">
        <h3>Informar inactividad</h3>
        <span class="chip-yo">Informás como <strong>${esc(yo.grado)} ${esc(yo.nombre)}</strong></span>
      </div>
      <form id="form-inact">
        <div class="campo"><span>Tipo de inactividad</span>
          <div class="opciones-tarjeta">${Object.entries(TIPOS_INACTIVIDAD).map(([k, t], i) => `
            <label class="opcion-tarjeta"><input type="radio" name="tipo" value="${k}" ${i === 0 ? 'checked' : ''}>
              <span><strong>${esc(t.nombre)}</strong><small>${esc(t.ayuda)}</small></span></label>`).join('')}</div>
        </div>
        <div class="campo"><span>Duración</span>
          <div class="chips-duracion" id="chips-duracion">${DURACIONES_INACTIVIDAD.map((d, i) =>
            `<button type="button" class="chip-duracion ${i === 1 ? 'activo' : ''}" data-dias="${d.dias}">${d.txt}</button>`).join('')}</div>
        </div>
        <div class="fila-campos">
          <label class="campo"><span>Desde</span><input name="desde" type="date" required min="${sumarDias(hoy, -7)}" value="${hoy}"></label>
          <label class="campo"><span>Hasta</span><input name="hasta" type="date" required value="${sumarDias(hoy, 6)}"></label>
        </div>
        <label class="campo"><span>Motivo</span>
          <textarea name="motivo" required minlength="5" maxlength="1000" style="min-height:80px" placeholder="Contá brevemente por qué vas a estar inactivo…"></textarea></label>
        <label class="campo"><span>Link del aviso en Discord</span>
          <input name="link" type="url" required class="mono" placeholder="https://discord.com/channels/…">
          <small class="tenue" style="margin-top:4px">Primero publicá el aviso de inactividad en Discord y pegá acá el link del mensaje.</small></label>
        <div class="vista-previa" id="resumen-inact"></div>
        <button class="btn primario btn-ancho" id="btn-enviar-inact">Enviar aviso de inactividad</button>
      </form>`;

    const f = $('#form-inact');
    let dias = 7;
    const resumen = () => {
      const d = f.desde.value, h = f.hasta.value;
      if (!d || !h) { $('#resumen-inact').innerHTML = ''; return; }
      if (h < d) { $('#resumen-inact').innerHTML = '<span style="color:var(--peligro)">La fecha "Hasta" no puede ser anterior a "Desde".</span>'; return; }
      const n = diasEntre(d, h);
      $('#resumen-inact').innerHTML = n > MAX_DIAS_INACTIVIDAD
        ? `<span style="color:var(--peligro)">El máximo es de ${MAX_DIAS_INACTIVIDAD} días. Si necesitás más, avisá a un comandante.</span>`
        : `<strong>${esc(TIPOS_INACTIVIDAD[f.tipo.value].nombre)}</strong> del ${fechaAR(d)} al ${fechaAR(h)} · ${n} día${n === 1 ? '' : 's'}`;
    };
    const marcarChip = d => $$('.chip-duracion', f).forEach(b => b.classList.toggle('activo', +b.dataset.dias === d));
    const aplicarDuracion = () => { if (dias && f.desde.value) f.hasta.value = sumarDias(f.desde.value, dias - 1); f.hasta.min = f.desde.value; resumen(); };
    $('#chips-duracion').onclick = ev => {
      const b = ev.target.closest('[data-dias]'); if (!b) return;
      dias = +b.dataset.dias; marcarChip(dias);
      if (dias) aplicarDuracion(); else { f.hasta.focus(); f.hasta.showPicker?.(); }
    };
    f.desde.onchange = aplicarDuracion;
    f.hasta.onchange = () => {   // elegir la fecha a mano pasa a "Otra", salvo que coincida con una duración
      const n = diasEntre(f.desde.value, f.hasta.value);
      dias = DURACIONES_INACTIVIDAD.some(x => x.dias === n) ? n : 0; marcarChip(dias); resumen();
    };
    $$('input[name="tipo"]', f).forEach(r => r.onchange = resumen);
    aplicarDuracion();

    f.onsubmit = async ev => {
      ev.preventDefault();
      const link = f.link.value.trim();
      if (!/^https:\/\/([a-z]+\.)?(discord\.com|discordapp\.com)\//i.test(link)) return aviso('El link tiene que ser un enlace de Discord (https://discord.com/…).', 'error');
      if (f.hasta.value < f.desde.value) return aviso('La fecha "Hasta" no puede ser anterior a "Desde".', 'error');
      if (diasEntre(f.desde.value, f.hasta.value) > MAX_DIAS_INACTIVIDAD) return aviso(`El máximo es de ${MAX_DIAS_INACTIVIDAD} días.`, 'error');
      const btn = $('#btn-enviar-inact'); btn.disabled = true;
      try {
        const n = await api.crearInactividad({ miembro_id: yo.id, tipo: f.tipo.value, motivo: f.motivo.value.trim(), link,
          desde: f.desde.value, hasta: f.hasta.value });
        lista.unshift(n);
        aviso('Aviso de inactividad enviado.');
        pintarFormulario(); pintarListas();
      } catch (e) { fallo(e); btn.disabled = false; }
    };
  }

  /* ---------- listados */
  const ordenar = l => l.sort((a, b) => (a.desde < b.desde ? 1 : a.desde > b.desde ? -1 : b.id - a.id));
  function fila(x, conMiembro) {
    const e = estadoInactividad(x);
    const puedeCancelar = !x.cancelada && e.txt !== 'Finalizada' && (x.autor_perfil === estado.perfil.id || veTodo);
    return `<tr class="${x.cancelada || e.txt === 'Finalizada' ? 'fila-inactiva' : ''}">
      <td><span class="etiqueta estado-inact ${e.clase}">${e.txt}</span></td>
      ${conMiembro ? `<td><a class="link-perfil" href="#/perfil?id=${x.miembro_id}">${esc(etiqueta(x.miembro_id))}</a></td>` : ''}
      <td>${esc(TIPOS_INACTIVIDAD[x.tipo]?.nombre || x.tipo)}</td>
      <td>${fechaAR(x.desde)}</td>
      <td>${fechaAR(x.hasta)}<span class="sub">${diasEntre(x.desde, x.hasta)} días</span></td>
      <td style="white-space:normal;min-width:180px;max-width:360px">${esc(x.motivo)}</td>
      <td><a href="${esc(x.link)}" target="_blank" rel="noopener noreferrer">Abrir ↗</a></td>
      <td class="acciones">${puedeCancelar ? `<button class="btn chico" data-cancelar-inact="${x.id}">${e.txt === 'En curso' ? 'Terminar hoy' : 'Cancelar'}</button>` : ''}
        ${esAdmin() && conMiembro ? `<button class="btn chico peligro" data-borrar-inact="${x.id}">Borrar</button>` : ''}</td>
    </tr>`;
  }
  function pintarListas() {
    ordenar(lista);
    const mias = lista.filter(x => x.autor_perfil === estado.perfil.id);
    $('#mis-inact').innerHTML = mias.length ? mias.map(x => fila(x, false)).join('')
      : '<tr><td colspan="7" class="vacio">Todavía no informaste ninguna inactividad.</td></tr>';
    if (!veTodo) return;
    const todas = lista.filter(x => filtro.ver === 'todas' || (!x.cancelada && x.hasta >= fechaISO(new Date())));
    $('#todas-inact').innerHTML = todas.length ? todas.map(x => fila(x, true)).join('')
      : `<tr><td colspan="8" class="vacio">${filtro.ver === 'todas' ? 'Nadie informó inactividad todavía.' : 'No hay inactividades en curso ni programadas.'}</td></tr>`;
  }

  cont.onclick = async ev => {
    const c = ev.target.closest('[data-cancelar-inact]'), b = ev.target.closest('[data-borrar-inact]');
    if (!c && !b) return;
    const x = lista.find(y => y.id == (c || b).dataset[c ? 'cancelarInact' : 'borrarInact']);
    try {
      if (c) {
        const enCurso = estadoInactividad(x).txt === 'En curso';
        if (!await confirmar(enCurso ? 'Terminar inactividad' : 'Cancelar inactividad',
          enCurso ? `La inactividad de ${etiqueta(x.miembro_id)} va a terminar hoy.` : `Se cancela la inactividad del ${fechaAR(x.desde)} al ${fechaAR(x.hasta)}.`,
          enCurso ? 'Terminar hoy' : 'Cancelar inactividad')) return;
        Object.assign(x, await api.cancelarInactividad(x.id)); aviso(enCurso ? 'Inactividad terminada.' : 'Inactividad cancelada.');
      } else {
        if (!await confirmar('Borrar aviso', `¿Borrar el aviso de inactividad de ${etiqueta(x.miembro_id)}? No se puede deshacer.`, 'Borrar')) return;
        await api.borrarInactividad(x.id); lista = lista.filter(y => y !== x); aviso('Aviso borrado.');
      }
      pintarListas();
    } catch (e) { fallo(e); }
  };
  if (veTodo) $('#ver-inact').onchange = e => { filtro.ver = e.target.value; pintarListas(); };
  estado.limpiezas.push(api.suscribir('inactividades', async () => {
    try { lista = await api.listarInactividades(); pintarListas(); } catch {}
  }));
  pintarFormulario();
  pintarListas();
}

/* ---------- marca de inactividad en las tablas de actividad */
const INACT_VISTAS = new Map();   // id -> aviso, para abrir el detalle desde cualquier tabla
// Un aviso cancelado antes de empezar no cuenta; si se terminó antes, cuenta hasta el día en que terminó
const inactividadCuenta = x => !x.cancelada || (!!x.cancelada_en && x.hasta >= x.desde && fechaISO(new Date(x.cancelada_en)) >= x.desde);
function insigniaInactividad(avisos, nombre) {
  if (!avisos?.length) return '';
  avisos.forEach(x => INACT_VISTAS.set(x.id, x));
  const total = avisos.some(x => x.tipo === 'total');
  const rangos = avisos.map(x => `${fechaAR(x.desde)} al ${fechaAR(x.hasta)}`).join(' y ');
  return ` <button type="button" class="insignia-inact ${total ? 'total' : ''}" data-ver-inact="${avisos.map(x => x.id).join(',')}"
    data-nombre="${esc(nombre)}" title="Declaró inactividad del ${rangos}. Clic para ver el aviso.">☾ ${total ? 'Inactivo' : 'Parcial'}</button>`;
}
function verInactividad(avisos, nombre) {
  abrirModal(`Inactividad · ${nombre}`, `${avisos.map(x => {
    const e = estadoInactividad(x);
    return `<div class="detalle-inact">
      <div class="detalle-inact-cab"><strong>${esc(TIPOS_INACTIVIDAD[x.tipo]?.nombre || x.tipo)}</strong>
        <span class="etiqueta estado-inact ${e.clase}">${e.txt}</span></div>
      <div class="detalle-inact-datos">
        <div><span class="dato-etiqueta">Desde</span><div>${fechaAR(x.desde)}</div></div>
        <div><span class="dato-etiqueta">Hasta</span><div>${fechaAR(x.hasta)}</div></div>
        <div><span class="dato-etiqueta">Duración</span><div>${diasEntre(x.desde, x.hasta)} días</div></div>
        <div><span class="dato-etiqueta">Informada el</span><div>${new Date(x.creado_en).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</div></div>
      </div>
      <span class="dato-etiqueta">Motivo</span>
      <p class="detalle-inact-motivo">${esc(x.motivo)}</p>
      <a class="btn chico" href="${esc(x.link)}" target="_blank" rel="noopener noreferrer">Ver aviso en Discord ↗</a>
    </div>`;
  }).join('')}
    <div class="modal-pie"><a class="btn" href="#/inactividad">Ir a Informar inactividad</a><button type="button" class="btn primario" data-cerrar-inact>Cerrar</button></div>`,
  c => { $('[data-cerrar-inact]', c).onclick = cerrarModal; $('a[href="#/inactividad"]', c).onclick = () => cerrarModal(); });
}
document.addEventListener('click', ev => {
  const b = ev.target.closest?.('[data-ver-inact]'); if (!b) return;
  ev.preventDefault(); ev.stopPropagation();
  const avisos = b.dataset.verInact.split(',').map(id => INACT_VISTAS.get(+id)).filter(Boolean);
  if (avisos.length) verInactividad(avisos, b.dataset.nombre);
});

/* ============================================================ USUARIOS */
async function vistaUsuarios(cont) {
  if (!esAdmin()) { cont.innerHTML = '<div class="vacio">Solo los administradores pueden ver esta sección.</div>'; return; }
  let [perfiles, miembros] = await Promise.all([api.listarPerfiles(), api.listarMiembros()]);
  estado.ajustes = await api.obtenerAjustes();
  const vinculables = ordenarMiembros(miembros.filter(m => m.activo && CATS_FORMULARIO.includes(m.categoria)));
  const activos = ordenarMiembros(miembros.filter(m => m.activo));
  const aprobada = p => !p.estado || p.estado === 'aprobada';

  cont.innerHTML = `
    <section class="tarjeta pendientes" id="pendientes"></section>
    <div class="tarjeta" style="margin-bottom:18px">
      <label class="interruptor"><input type="checkbox" id="modo-abierto" ${estado.ajustes.modo_abierto === true ? 'checked' : ''}>
        <span><strong>Modo abierto</strong><br><span style="color:var(--texto-2)">Mientras esté activo, cualquier cuenta registrada puede editar tablas, miembros, calendario y reglamento.
        Desactivalo cuando quieras que solo los Administradores editen (los Usuarios quedan en solo lectura).</span></span></label>
    </div>
    <div class="envoltorio-tabla"><table class="datos"><thead><tr><th>Cuenta</th><th>Email</th><th>Rango</th><th>Miembro vinculado</th><th>Registrado</th></tr></thead>
    <tbody id="cuerpo-usuarios"></tbody></table></div>
    <p class="ayuda">Vinculá cada cuenta con su miembro de la legión para que pueda cargar actividades en <a href="#/actividad">Registrar actividad</a>. Un miembro solo puede estar vinculado a una cuenta.
    Los rangos nuevos se agregan en <code>js/config.js</code> (RANGOS).</p>`;

  const opciones = r => Object.entries(RANGOS).map(([n, t]) => `<option value="${n}" ${+n === r ? 'selected' : ''}>${n} · ${esc(t)}</option>`).join('');
  const opcionesMiembro = p => `<option value="">— Sin vincular —</option>` + vinculables.map(m => {
    const otro = perfiles.find(x => x.id !== p.id && x.miembro_id === m.id);
    return `<option value="${m.id}" ${p.miembro_id === m.id ? 'selected' : ''} ${otro ? 'disabled' : ''}>${esc(m.grado)} ${esc(m.nombre)}${otro ? ` — cuenta ${esc(otro.nombre)}` : ''}</option>`;
  }).join('');
  function pintar() {
    pintarPendientes();
    $('#cuerpo-usuarios').innerHTML = perfiles.filter(aprobada).map(p => `<tr>
      <td><strong>${esc(p.nombre)}</strong>${p.id === estado.perfil.id ? ' <span class="etiqueta">vos</span>' : ''}</td>
      <td style="color:var(--texto-2)">${esc(p.email)}</td>
      <td><select class="entrada" style="height:32px;max-width:200px" data-rango="${p.id}">${opciones(p.rango)}</select></td>
      <td><select class="entrada" style="height:32px;max-width:240px" data-miembro="${p.id}">${opcionesMiembro(p)}</select></td>
      <td style="color:var(--texto-2)">${p.creado_en ? new Date(p.creado_en).toLocaleDateString('es-AR') : ''}</td></tr>`).join('');
  }

  $('#cuerpo-usuarios').onchange = async ev => {
    const sel = ev.target;
    if (sel.dataset.miembro) {
      const p = perfiles.find(x => String(x.id) === sel.dataset.miembro);
      const nuevo = sel.value ? +sel.value : null;
      try {
        await api.vincularMiembro(p.id, nuevo); p.miembro_id = nuevo;
        if (p.id === estado.perfil.id) estado.perfil.miembro_id = nuevo;
        aviso(nuevo ? `${p.nombre} quedó vinculada a ${miembros.find(m => m.id === nuevo)?.nombre}.` : `${p.nombre} quedó sin vincular.`);
        pintar();
      } catch (e) { fallo(e); pintar(); }
      return;
    }
    const p = perfiles.find(x => String(x.id) === sel.dataset.rango); const nuevo = +sel.value;
    const admins = perfiles.filter(x => x.rango >= 2).length;
    if (p.rango >= 2 && nuevo < 2 && admins <= 1) { aviso('Tiene que quedar al menos un Administrador.', 'error'); sel.value = p.rango; return; }
    if (p.id === estado.perfil.id && nuevo < 2 && !await confirmar('Quitarte el rango', 'Vas a dejar de ser Administrador y perderás acceso a esta sección.', 'Continuar')) { sel.value = p.rango; return; }
    try {
      await api.cambiarRango(p.id, nuevo); p.rango = nuevo; aviso(`${p.nombre}: ${nombreRango(nuevo)}.`);
      if (p.id === estado.perfil.id) { estado.perfil.rango = nuevo; entrarApp(estado.perfil); }
    } catch (e) { fallo(e); sel.value = p.rango; }
  };
  // ---- Cuentas pendientes de aprobación
  const normNombre = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const sugerido = p => {
    const n = normNombre(p.nombre);
    if (!n) return null;
    const libres = activos.filter(m => !perfiles.some(x => x.miembro_id === m.id));
    return libres.find(m => normNombre(m.nombre) === n || normNombre(m.nombre_iconico) === n)
        || (n.length >= 4 ? libres.find(m => normNombre(m.nombre).startsWith(n) || n.startsWith(normNombre(m.nombre))) : null) || null;
  };
  const elegidos = new Map();   // perfilId -> { miembro, grado, rango }
  function datosDe(p) {
    if (!elegidos.has(p.id)) {
      const m = sugerido(p);
      elegidos.set(p.id, { miembro: m?.id || '', grado: m?.grado || '', rango: 1 });
    }
    return elegidos.get(p.id);
  }
  function pintarPendientes() {
    const pend = perfiles.filter(p => p.estado === 'pendiente');
    const rech = perfiles.filter(p => p.estado === 'rechazada');
    const fecha = p => p.creado_en ? new Date(p.creado_en).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '';
    const tarjeta = p => {
      const d = datosDe(p);
      const optsM = `<option value="">— Elegí su nombre en la legión —</option>` + activos.map(m => {
        const otro = perfiles.find(x => x.id !== p.id && x.miembro_id === m.id && aprobada(x));
        return `<option value="${m.id}" ${+d.miembro === m.id ? 'selected' : ''} ${otro ? 'disabled' : ''}>${esc(m.grado)} ${esc(m.nombre)}${m.elite ? ` (${esc(m.elite)})` : ''}${otro ? ` — ya es de ${esc(otro.nombre)}` : ''}</option>`;
      }).join('');
      const optsG = `<option value="">—</option>` + [...RANGOS_LEGION].reverse().map(g => `<option ${g === d.grado ? 'selected' : ''}>${esc(g)}</option>`).join('');
      const optsR = Object.entries(RANGOS).map(([n, t]) => `<option value="${n}" ${+n === +d.rango ? 'selected' : ''}>${esc(t)}</option>`).join('');
      return `<div class="pendiente" data-pend="${p.id}">
        <div class="pend-quien"><span class="avatar chico">${esc((p.nombre || '?').trim().charAt(0).toUpperCase())}</span>
          <div><strong>${esc(p.nombre)}</strong><small>${esc(p.email)} · se registró el ${fecha(p)}</small></div></div>
        <label class="campo"><span>Nombre en la legión</span><select class="entrada" data-campo="miembro">${optsM}</select></label>
        <label class="campo"><span>Rango en la legión</span><select class="entrada" data-campo="grado" ${d.miembro ? '' : 'disabled'}>${optsG}</select></label>
        <label class="campo"><span>Permiso en el panel</span><select class="entrada" data-campo="rango">${optsR}</select></label>
        <div class="pend-acciones">
          <button class="btn primario" data-accion="aprobar">Aprobar</button>
          <button class="btn" data-accion="rechazar">Rechazar</button>
        </div></div>`;
    };
    $('#pendientes').innerHTML = `
      <div class="pend-cab"><h3>Cuentas pendientes de aprobación</h3>${pend.length ? `<span class="menu-contador">${pend.length}</span>` : ''}</div>
      ${pend.length
        ? `<p class="ayuda" style="margin-top:0">Estas cuentas se registraron pero no pueden entrar al panel hasta que las apruebes. Elegí a qué miembro de la legión corresponde cada una y su rango; si el rango no coincide con el que figura, se actualiza en Miembros de la legión.</p>
           ${pend.map(tarjeta).join('')}`
        : '<p class="vacio-chico">No hay cuentas esperando aprobación.</p>'}
      ${rech.length ? `<details class="pend-rechazadas"><summary>Cuentas rechazadas (${rech.length})</summary>
        ${rech.map(p => `<div class="pend-rech"><span><strong>${esc(p.nombre)}</strong> <small>${esc(p.email)} · ${fecha(p)}</small></span>
          <button class="btn chico" data-reabrir="${p.id}">Volver a pendientes</button></div>`).join('')}</details>` : ''}`;
  }

  $('#pendientes').onchange = ev => {
    const caja = ev.target.closest('[data-pend]'); if (!caja) return;
    const p = perfiles.find(x => String(x.id) === caja.dataset.pend), d = datosDe(p), campo = ev.target.dataset.campo;
    if (campo === 'miembro') {
      d.miembro = ev.target.value ? +ev.target.value : '';
      d.grado = miembros.find(m => m.id === d.miembro)?.grado || '';
      pintarPendientes();
    } else if (campo === 'grado') d.grado = ev.target.value;
    else if (campo === 'rango') d.rango = +ev.target.value;
  };
  $('#pendientes').onclick = async ev => {
    const reabrir = ev.target.closest('[data-reabrir]');
    if (reabrir) {
      const p = perfiles.find(x => String(x.id) === reabrir.dataset.reabrir);
      try { await api.cambiarEstadoCuenta(p.id, 'pendiente'); p.estado = 'pendiente'; aviso(`${p.nombre} volvió a pendientes.`); pintar(); actualizarPendientes(); }
      catch (e) { fallo(e); }
      return;
    }
    const b = ev.target.closest('[data-accion]'); if (!b) return;
    const p = perfiles.find(x => String(x.id) === b.closest('[data-pend]').dataset.pend), d = datosDe(p);
    if (b.dataset.accion === 'rechazar') {
      if (!await confirmar('Rechazar cuenta', `¿Rechazar la cuenta de ${p.nombre} (${p.email})? No va a poder entrar al panel. Después la podés volver a pendientes.`, 'Rechazar')) return;
      try { await api.cambiarEstadoCuenta(p.id, 'rechazada'); p.estado = 'rechazada'; aviso(`Cuenta de ${p.nombre} rechazada.`); pintar(); actualizarPendientes(); }
      catch (e) { fallo(e); }
      return;
    }
    const m = miembros.find(x => x.id === d.miembro);
    if (!m) return aviso('Elegí a qué miembro de la legión corresponde la cuenta.', 'error');
    if (!d.grado) return aviso('Elegí el rango en la legión.', 'error');
    const cambiaGrado = normRango(d.grado) !== normRango(m.grado);
    const texto = `${p.nombre} va a poder entrar al panel como ${nombreRango(d.rango)}, vinculada a ${d.grado} ${m.nombre}.`
      + (cambiaGrado ? ` El rango de ${m.nombre} en la legión cambia de ${m.grado || '—'} a ${d.grado}.` : '');
    if (!await confirmar('Aprobar cuenta', texto, 'Aprobar')) return;
    b.disabled = true;
    try {
      if (cambiaGrado) {
        const cat = categoriaDeRango(d.grado);
        const actualizado = await api.guardarMiembro({ id: m.id, grado: d.grado, ...(cat ? { categoria: cat } : {}) });
        Object.assign(m, actualizado || { grado: d.grado, ...(cat ? { categoria: cat } : {}) });
      }
      await api.aprobarCuenta(p.id, { miembro_id: m.id, rango: d.rango });
      Object.assign(p, { estado: 'aprobada', miembro_id: m.id, rango: d.rango });
      elegidos.delete(p.id);
      aviso(`Cuenta de ${p.nombre} aprobada y vinculada a ${d.grado} ${m.nombre}.`);
      pintar(); actualizarPendientes();
    } catch (e) { fallo(e); b.disabled = false; }
  };
  // Si alguien se registra mientras está abierta la sección, aparece sola
  if (!MODO_DEMO) estado.limpiezas.push(api.suscribir('perfiles', async () => {
    try { perfiles = await api.listarPerfiles(); pintar(); } catch {}
  }));

  $('#modo-abierto').onchange = async ev => {
    try { await api.guardarAjuste('modo_abierto', ev.target.checked); estado.ajustes.modo_abierto = ev.target.checked; pintarChipPermiso(); aviso('Ajuste guardado.'); }
    catch (e) { fallo(e); ev.target.checked = !ev.target.checked; }
  };
  pintar();
}

/* ------------------------------------------------------------ arranque */
async function arrancar() {
  $$('[data-nombre-sitio]').forEach(e => e.textContent = NOMBRE_SITIO);
  $$('[data-demo]').forEach(e => e.hidden = !MODO_DEMO);
  iniciarAcceso();
  $('#btn-salir').onclick = async () => {
    if (estado.subPendientes) { try { estado.subPendientes(); } catch {} estado.subPendientes = null; }
    await api.salir(); estado.perfil = null; location.hash = ''; mostrarAcceso();
  };
  $('#btn-espera-salir').onclick = async () => {
    if (limpiarEspera) { try { limpiarEspera(); } catch {} limpiarEspera = null; }
    await api.salir(); location.hash = ''; mostrarAcceso();
  };
  $('#btn-espera-comprobar').onclick = () => comprobarEspera(true);
  $('#btn-menu').onclick = () => $('#app').classList.toggle('menu-abierto');
  $('#cortina').onclick = () => $('#app').classList.remove('menu-abierto');
  $('#modal-cerrar').onclick = cerrarModal;
  $('#modal-fondo').onclick = ev => { if (ev.target.id === 'modal-fondo') cerrarModal(); };
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !$('#modal-fondo').hidden) cerrarModal(); });
  window.addEventListener('hashchange', navegar);

  try {
    const perfil = await api.sesionActual();
    perfil ? await entrarApp(perfil) : mostrarAcceso();
  } catch (e) { fallo(e); mostrarAcceso(); }
}

arrancar();
