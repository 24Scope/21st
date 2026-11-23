/* =====================================================================
   Panel de control 21st — interfaz
   ===================================================================== */

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

/* Íconos de línea del menú (SVG). Si una sección no tiene, usa el símbolo de config.js */
const ICONOS_MENU = {
  inicio:       '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9v11h5v-6h4v6h5V9"/>',
  perfil:       '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.4-4 4.4-6 8-6s6.6 2 8 6"/>',
  escalafon:    '<path d="M12 3 4 7l8 4 8-4z"/><path d="m4 12 8 4 8-4M4 17l8 4 8-4"/>',
  calendario:   '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  reglamento:   '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19M9 7h6M9 11h6"/>',
  actividad:    '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  inactividad:  '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z"/>',
  foro:         '<rect x="8" y="7" width="8" height="13" rx="4"/><path d="M12 7V5M9.5 4.5 10.5 6M14.5 4.5 13.5 6M4 13h4M16 13h4M5 19l3-1.5M19 19l-3-1.5M5 8l3 2M19 8l-3 2"/>',
  suboficiales: '<path d="m5 9 7-4 7 4M5 14l7-4 7 4M5 19l7-4 7 4"/>',
  elites:       '<path d="M12 3l8 3v6c0 4.6-3.4 8-8 9-4.6-1-8-4.4-8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  bu:           '<path d="M9 2.5C4.3 4.6 4 11.2 9.6 14.2"/><path d="M15 2.5c4.7 2.1 5 8.7-.6 11.7"/><path d="M12 4.5c-1.9 3.2-1.9 8.3 0 12.8 1.9-4.5 1.9-9.6 0-12.8z"/><path d="M10.2 18.6c-3.6.1-6.4-1.5-7.9-4.4M13.8 18.6c3.6.1 6.4-1.5 7.9-4.4"/><path d="M10.8 21.3c-3 .1-5.4-.8-7-2.5M13.2 21.3c3 .1 5.4-.8 7-2.5"/>',
  ascensos:     '<path d="M12 20V5M5.5 11.5 12 5l6.5 6.5"/><path d="M5 20h14"/>',
  soldados:     '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/>',
  cabos:        '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/>',
  miembros:     '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 15.2c2 .6 3.2 2.2 3.7 4.8"/>',
  oficiales:    '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9l-5.4 2.9 1.1-6.1-4.5-4.3 6.1-.8z"/>',
  revision:     '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-7"/>',
  usuarios:     '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
};
const iconoMenu = (id, simbolo) => ICONOS_MENU[id]
  ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS_MENU[id]}</svg>`
  : esc(simbolo || '•');

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
const esAdmin = () => (estado.perfil?.rango ?? 0) >= RANGO_ADMIN;
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
  const baja = perfil.estado === 'baja';
  const rechazada = perfil.estado === 'rechazada', datos = !baja && (perfil.estado === 'datos' || corrigiendoDatos);
  $('#espera-icono').textContent = rechazada || baja ? '✕' : datos ? '✎' : '⏳';
  $('#espera-titulo').textContent = baja ? 'Cuenta dada de baja' : rechazada ? 'Cuenta no aprobada' : datos ? 'Completá tus datos de la legión' : 'Cuenta pendiente de aprobación';
  $('#espera-texto').textContent = baja
    ? 'Tu miembro figura como inactivo en la legión, así que la cuenta no puede entrar al panel. Si volviste, pedile a un comandante que te reactive.'
    : rechazada
    ? 'Un administrador no aprobó esta cuenta. Si creés que es un error, hablá con un administrador de la legión.'
    : datos ? 'Antes de pedir acceso al panel, declará tus datos in-game. Con esto un administrador te identifica y aprueba tu cuenta.'
    : 'Tus datos se enviaron. Un administrador tiene que aprobar tu cuenta y vincularla con tu nombre en la legión antes de que puedas entrar al panel. Esta pantalla se actualiza sola cuando te aprueben.';
  $('#espera-cuenta').textContent = `${perfil.nombre || ''} · ${perfil.email || ''}`;
  const f = $('#form-datos');
  f.hidden = !datos;
  $('#btn-espera-comprobar').hidden = datos;
  $('#btn-espera-corregir').hidden = datos || perfil.estado !== 'pendiente';
  $('#decl-resumen').hidden = datos || rechazada || !perfil.decl_clon;
  if (!$('#decl-resumen').hidden) $('#decl-resumen').innerHTML = `
    <div><span class="dato-etiqueta">Rango</span><div>${esc(perfil.decl_grado)}</div></div>
    <div><span class="dato-etiqueta">Clon</span><div>${esc(perfil.decl_clon)}</div></div>
    <div><span class="dato-etiqueta">Jedi</span><div>${esc(perfil.decl_jedi || '—')}</div></div>
    <div><span class="dato-etiqueta">Discord ID</span><div class="mono">${esc(perfil.decl_discord)}</div></div>`;
  if (datos) {
    f.grado.innerHTML = '<option value="">— Elegí tu rango —</option>' + [...RANGOS_LEGION].reverse().map(g => `<option>${esc(g)}</option>`).join('');
    f.grado.value = perfil.decl_grado || ''; f.clon.value = perfil.decl_clon || perfil.nombre || '';
    f.jedi.value = perfil.decl_jedi || ''; f.discord.value = perfil.decl_discord || '';
    $('#datos-error').hidden = true;
    f.onsubmit = async ev => {
      ev.preventDefault();
      const d = { grado: f.grado.value, clon: f.clon.value.trim(), jedi: f.jedi.value.trim(), discord: f.discord.value.trim() };
      d.discord = d.discord.replace(/^@+/, '').trim();
      if (d.discord.length < 2) { $('#datos-error').textContent = 'Escribí tu usuario de Discord.'; $('#datos-error').hidden = false; return; }
      $('#btn-datos').disabled = true;
      try { await api.completarDatosCuenta(d); corrigiendoDatos = false; aviso('Datos enviados. Ahora falta que un administrador apruebe tu cuenta.'); await comprobarEspera(false); }
      catch (e) { $('#datos-error').textContent = e.message; $('#datos-error').hidden = false; }
      finally { $('#btn-datos').disabled = false; }
    };
  }
  if (limpiarEspera) { try { limpiarEspera(); } catch {} limpiarEspera = null; }
  if (perfil.estado === 'pendiente' && !MODO_DEMO) limpiarEspera = api.suscribir('perfiles', () => comprobarEspera(false));
}
let corrigiendoDatos = false;
async function comprobarEspera(conAviso = true) {
  try {
    const p = await api.sesionActual();
    if (!p) return mostrarAcceso();
    if (p.estado && p.estado !== 'aprobada') { mostrarEspera(p); if (conAviso && p.estado === 'pendiente') aviso('Tu cuenta todavía no fue aprobada.'); return; }
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
    if (m) { $('#usuario-rango').textContent = `${nombreRango(perfil.rango)} · ${m.grado} ${m.nombre}`; pintarAvatarUsuario(m); }
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
  return SECCIONES.filter(s => !s.oculta && estado.perfil.rango >= s.rangoMinimo);
}

function pintarMenu() {
  let html = '', grupo = null;
  for (const s of seccionesVisibles()) {
    if (s.grupo !== grupo) { grupo = s.grupo; if (grupo) html += `<div class="menu-grupo">${esc(grupo)}</div>`; }
    html += `<a class="menu-item" href="#/${s.id}" data-id="${s.id}"><span class="menu-icono">${iconoMenu(s.id, s.icono)}</span>${esc(s.titulo)}</a>`;
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
  const ordenable = esAdmin() && SECCIONES_ORDENABLES.includes(sec.id);
  $('#btn-ordenar').hidden = !ordenable;
  document.body.classList.toggle('ordenando', ordenable && estado.ordenando);
  $('#btn-ordenar').classList.toggle('activo', !!estado.ordenando);
  const cont = $('#contenido');
  cont.innerHTML = '<div class="vacio">Cargando…</div>';
  cont.scrollTop = 0;

  const vistas = { inicio: vistaInicio, actividad: vistaActividad, perfil: vistaPerfil, reglamento: vistaReglamento, calendario: vistaCalendario, miembros: vistaMiembros, usuarios: vistaUsuarios, foro: vistaForo, inactividad: vistaInactividad, ascensos: vistaAscensos, revision: vistaRevision, escalafon: vistaEscalafon };
  const vista = CATEGORIAS[sec.id] ? () => vistaRegistro(sec.id) : vistas[sec.id];
  Promise.resolve(vista(cont)).catch(e => { cont.innerHTML = `<div class="vacio">No se pudo cargar: ${esc(e.message)}</div>`; fallo(e); });
}

/* ============================================================ INICIO */
async function vistaInicio(cont) {
  const hoy = new Date();
  const anterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);   // último mes cerrado
  const anios = [...new Set([anterior.getFullYear(), hoy.getFullYear()])];
  const [miembros, eventos, ...regsPorAnio] = await Promise.all([
    api.listarPersonas(),
    api.listarEventos(fechaISO(hoy), fechaISO(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 30))),
    ...anios.map(a => api.listarRegistrosAnio(a)),
  ]);
  const regs = regsPorAnio.flat();

  // Cantidad actual de miembros por grupo (Blackout Unit: quienes figuran en la última planilla de BU cargada)
  const actuales = miembros.filter(m => m.activo);
  const plantelBU = regs.filter(r => r.categoria === 'bu' && r.columna === COL_PLANTEL);
  const ultimaBU = plantelBU.reduce((u, r) => Math.max(u, r.anio * 100 + r.mes), 0);
  const idsBU = new Set(plantelBU.filter(r => r.anio * 100 + r.mes === ultimaBU).map(r => r.miembro_id));
  const grupos = [
    { titulo: 'Comandantes',    ir: 'oficiales',    cant: actuales.filter(m => m.categoria === 'comandantes').length },
    { titulo: 'Oficiales',      ir: 'oficiales',    cant: actuales.filter(m => m.categoria === 'oficiales').length },
    { titulo: 'Suboficiales',   ir: 'suboficiales', cant: actuales.filter(m => m.categoria === 'suboficiales').length },
    { titulo: 'Élites',         ir: 'elites',       cant: actuales.filter(m => CATEGORIAS.elites.filtro(m)).length },
    { titulo: 'Blackout Unit',  ir: 'bu',           cant: ultimaBU ? actuales.filter(m => idsBU.has(m.id)).length : 0,
      nota: ultimaBU ? `según la planilla de ${MESES[ultimaBU % 100 - 1].toLowerCase()} ${Math.floor(ultimaBU / 100)}` : '' },
  ];
  const tarjetas = grupos.map(g => `<div class="tarjeta">
      <div class="dato-grande">${g.cant}</div>
      <div class="dato-etiqueta">${esc(g.titulo)}</div>
      ${g.nota ? `<div class="dato-etiqueta" style="margin-top:6px;font-size:11.5px">${esc(g.nota)}</div>` : ''}
    </div>`).join('');

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
        <li><a class="menu-item" style="color:var(--texto)" href="#/calendario"><span class="menu-icono">${iconoMenu('calendario')}</span>Calendario</a></li>
        <li><a class="menu-item" style="color:var(--texto)" href="#/reglamento"><span class="menu-icono">${iconoMenu('reglamento')}</span>Reglamento del calendario</a></li>
        <li><a class="menu-item" style="color:var(--texto)" href="#/miembros"><span class="menu-icono">${iconoMenu('miembros')}</span>Miembros de la legión (${visibles})</a></li>
      </ul></div>
    </div>`;
}

/* ------------------------------------------------------------ ancho de columnas de las planillas
   Cada columna toma el ancho que necesita la mayoría de sus textos (percentil 85), no el del más largo.
   Lo que no entra se corta con "…" y al pasar el mouse se ve completo (title). El ancho no cambia al pasar el mouse
   ni al editar: se recalcula solo cuando se vuelve a dibujar la planilla (cambio de mes, datos nuevos, etc.). */
const ANCHO_COL = { min: 52, max: 280, percentil: 0.85 };
let lienzoMedidas = null;
function medirTexto(texto, fuente) {
  lienzoMedidas = lienzoMedidas || document.createElement('canvas').getContext('2d');
  lienzoMedidas.font = fuente;
  return lienzoMedidas.measureText(texto).width;
}
// Ancho "típico" de una lista de medidas ordenadas: el del texto más largo, salvo que sea mucho más largo
// que la mayoría (más de 40% sobre el percentil 85); en ese caso se usa el percentil y el largo se corta con "…".
function anchoTipico(medidas) {
  const p = medidas[Math.min(medidas.length - 1, Math.floor((medidas.length - 1) * ANCHO_COL.percentil))];
  const max = medidas[medidas.length - 1];
  return max <= p * 1.4 ? max : p;
}
// Aplica los anchos. Si la tabla ocupa todo el ancho disponible (llenar), el espacio que sobra va a la última columna
// en vez de repartirse: así las columnas no se estiran más de lo que necesita su contenido.
function colgroupAjustado(tabla, anchos, llenar) {
  const total = anchos.reduce((s, a) => s + a, 0);
  tabla.insertAdjacentHTML('afterbegin', `<colgroup>${anchos.map((a, i) =>
    llenar && i === anchos.length - 1 ? '<col>' : `<col style="width:${a}px">`).join('')}</colgroup>`);
  tabla.style.width = llenar ? `max(100%, ${total}px)` : total + 'px';
}
function ajustarColumnas(cont) {
  for (const tabla of $$('table.hoja', cont)) {
    const filaCab = tabla.tHead?.rows[0]; if (!filaCab) continue;
    const n = filaCab.cells.length;
    const filas = [...tabla.tBodies[0]?.rows || [], ...(tabla.tFoot?.rows || [])].filter(r => r.cells.length === n);
    const compacta = tabla.classList.contains('compacta');
    const anchos = [];
    for (let c = 0; c < n; c++) {
      const th = filaCab.cells[c];
      if (th.classList.contains('col-n')) { anchos.push(44); continue; }
      const estTh = getComputedStyle(th), padTh = parseFloat(estTh.paddingLeft) + parseFloat(estTh.paddingRight);
      // Encabezado: puede ocupar hasta 2 renglones, pero ninguna palabra se corta
      const tituloCab = th.textContent.trim();
      const palabras = tituloCab.split(/\s+/).map(p => medirTexto(p, estTh.font));
      const minCab = Math.max(Math.max(0, ...palabras), medirTexto(tituloCab, estTh.font) / 2) + padTh + 2;
      const medidas = [];
      let pad = compacta ? 16 : 24;
      for (const fila of filas) {
        const td = fila.cells[c], txt = td.textContent.replace(/\s+/g, ' ').trim();
        if (!txt) continue;
        const est = getComputedStyle(td);
        pad = parseFloat(est.paddingLeft) + parseFloat(est.paddingRight);
        medidas.push(medirTexto(txt, est.font));
      }
      medidas.sort((a, b) => a - b);
      const tipico = medidas.length ? anchoTipico(medidas) + pad + 4 : 0;
      const esNombre = th.classList.contains('col-nombre');
      const minimo = esNombre ? 140 : ANCHO_COL.min;
      // Los nombres entran completos (hasta 210px); el resto usa el ancho típico
      const largo = esNombre && medidas.length ? Math.min(210, medidas[medidas.length - 1] + pad + 4) : 0;
      anchos.push(Math.round(Math.min(ANCHO_COL.max, Math.max(minimo, minCab, tipico, largo))));
    }
    tabla.querySelector('colgroup')?.remove();
    colgroupAjustado(tabla, anchos, compacta);
    tabla.classList.add('ajustada');
    // La columna fija del nombre arranca después de la del número
    const colN = anchos[0] === 44 && filaCab.cells[0].classList.contains('col-n') ? 44 : 0;
    if (colN) $$('.col-nombre', tabla).forEach(x => { x.style.left = colN + 'px'; });
  }
}
/* Lo mismo para las tablas comunes (Miembros, Mi perfil, Registrar actividad, Usuarios y rangos, etc.).
   Se mide el ancho real de cada celda; las columnas con botones o desplegables toman el ancho completo para no cortarlos. */
const ANCHO_DATOS = { min: 48, max: 360 };
function ajustarTablaDatos(tabla) {
  if (!tabla.isConnected || !tabla.offsetParent || tabla.querySelector('textarea')) return;
  const filaCab = tabla.tHead?.rows[0]; if (!filaCab) return;
  const n = filaCab.cells.length;
  const filas = [...tabla.tBodies].flatMap(b => [...b.rows]).filter(r => r.cells.length === n);
  if (!filas.length) return;
  // Volver al ancho natural (sin cortes) para medir
  tabla.querySelector('colgroup')?.remove();
  tabla.style.width = '';
  tabla.classList.remove('ajustada');
  tabla.classList.add('midiendo');
  const rango = document.createRange();
  const anchoDe = el => { rango.selectNodeContents(el); return rango.getBoundingClientRect().width; };
  const anchos = [];
  for (let c = 0; c < n; c++) {
    const th = filaCab.cells[c], estTh = getComputedStyle(th);
    const padTh = parseFloat(estTh.paddingLeft) + parseFloat(estTh.paddingRight);
    const titulo = th.textContent.trim(), anchoTitulo = anchoDe(th);
    const largos = titulo.split(/\s+/).map(p => p.length), totalLetras = titulo.replace(/\s+/g, '').length || 1;
    // Encabezado: hasta 2 renglones, sin cortar palabras
    const minCab = (titulo ? Math.max(anchoTitulo * Math.max(...largos) / totalLetras, anchoTitulo / 2) : 0) + padTh + 4;
    const medidas = [];
    let interactivo = false;
    for (const fila of filas) {
      const td = fila.cells[c];
      if (td.querySelector('select, input, .btn, button:not(.copiar)')) interactivo = true;
      if (!td.textContent.trim() && !td.querySelector('select, input, button, img')) continue;
      const est = getComputedStyle(td);
      // Los desplegables se miden por su opción más larga (si no, quedan tan angostos como la columna)
      const sel = td.querySelector('select');
      const topeSel = sel ? parseFloat(getComputedStyle(sel).maxWidth) || Infinity : 0;
      const anchoSel = sel ? Math.min(topeSel, Math.max(...[...sel.options].map(o => medirTexto(o.text, getComputedStyle(sel).font))) + 44) : 0;
      medidas.push(Math.max(anchoDe(td), anchoSel) + parseFloat(est.paddingLeft) + parseFloat(est.paddingRight) + 2);
    }
    medidas.sort((a, b) => a - b);
    const tipico = !medidas.length ? 0
      : interactivo ? medidas[medidas.length - 1]
      : anchoTipico(medidas);
    // Columnas marcadas en el encabezado: data-sin-cortar (entra el texto más largo) y data-ancho-min (ancho mínimo en px)
    const sinCortar = th.hasAttribute("data-sin-cortar") && medidas.length ? Math.min(220, medidas[medidas.length - 1]) : 0;
    anchos.push(Math.round(Math.max(ANCHO_DATOS.min, +th.dataset.anchoMin || 0, minCab, sinCortar, interactivo ? tipico : Math.min(ANCHO_DATOS.max, tipico))));
  }
  tabla.classList.remove('midiendo');
  colgroupAjustado(tabla, anchos, true);
  tabla.classList.add('ajustada');
}
// Cada vez que una vista dibuja o actualiza una tabla, se reajusta (una vez por cuadro)
const tablasPendientes = new Set();
new MutationObserver(cambios => {
  for (const m of cambios) {
    const el = m.target.nodeType === 1 ? m.target : m.target.parentElement;
    const t = el?.closest?.('table.datos');
    if (t) { if (el.closest('tbody, thead')) tablasPendientes.add(t); continue; }
    m.addedNodes.forEach(nd => {
      if (nd.nodeType !== 1) return;
      if (nd.matches('table.datos')) tablasPendientes.add(nd);
      nd.querySelectorAll?.('table.datos').forEach(x => tablasPendientes.add(x));
    });
  }
  if (tablasPendientes.size) setTimeout(() => {
    const lista = [...tablasPendientes]; tablasPendientes.clear();
    lista.forEach(ajustarTablaDatos);
  });
}).observe(document.getElementById('contenido'), { childList: true, subtree: true });
// Al pasar el mouse por una celda cortada se ve el texto completo
document.addEventListener('mouseover', ev => {
  const td = ev.target.closest?.('table.hoja.ajustada td, table.hoja.ajustada th, table.datos.ajustada td, table.datos.ajustada th');
  if (!td || td.classList.contains('editando')) return;
  if (td.dataset.tituloPropio === undefined) td.dataset.tituloPropio = td.getAttribute('title') || '';
  const txt = td.textContent.replace(/\s+/g, ' ').trim();
  const cortado = td.scrollWidth > td.clientWidth + 1;
  const propio = td.dataset.tituloPropio;
  td.title = cortado ? (propio && propio !== txt ? `${txt}\n${propio}` : txt) : propio;
});

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
function calcularFila(config, valor, m) {
  const res = {};
  const v = k => numero(valor(k));
  const t = k => (k in res ? numero(res[k]) : v(k));
  for (const c of config.columnas) if (c.tipo === 'calculada') {
    try { res[c.clave] = c.calc(v, t, m); } catch { res[c.clave] = ''; }
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

// Registros que abren en modo Vista (resumen y tabla para leer); el resto abre directo en la planilla
const REGISTROS_CON_VISTA = ['oficiales', 'elites', 'suboficiales', 'bu', 'soldados', 'cabos'];

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
  // Modo Vista (por defecto, para leer) o Planilla (el Excel para editar). Se recuerda por registro en este navegador.
  const conVista = REGISTROS_CON_VISTA.includes(cat);
  const claveModo = 'bd21_modo_' + cat;
  hoja.modo = 'planilla';
  if (conVista) { hoja.modo = 'ver'; try { if (localStorage.getItem(claveModo) === 'planilla') hoja.modo = 'planilla'; } catch {} }
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
      ${conVista ? `<div class="selector-modo" role="tablist" aria-label="Modo">
        <button data-modo="ver" role="tab">👁 Vista</button>
        <button data-modo="planilla" role="tab">✎ ${puedeEditar() ? 'Editar planilla' : 'Planilla'}</button></div>` : ''}
      <button class="btn chico" id="btn-bloq-celda" title="Bloquear o desbloquear la celda seleccionada (Ctrl+B)">🔒 Bloquear celda</button>
      <button class="btn chico" id="btn-bloq-mes">Bloquear ${textoMes}</button>
      <button class="btn chico" id="btn-desbloq-mes">Desbloquear ${textoMes}</button>
      <button class="btn chico" id="btn-csv">Exportar CSV</button>
    </div>
    ${config.periodo ? '' : `<div class="meses" id="meses">${MESES.map((m, i) => `<button class="mes" data-mes="${i + 1}">${m}</button>`).join('')}</div>`}
    <div class="barra-formula ${config.periodo ? 'sin-meses' : ''}" id="barra-formula"><div class="ref" id="f-ref">—</div><div class="fx">fx</div><div class="val" id="f-val"></div><div class="estado-guardado" id="f-estado"></div></div>
    <div class="hoja-contenedor" id="hoja-cont" tabindex="0"></div>
    ${cols.filter(c => c.opciones).map(c => `<datalist id="op-${c.clave}">${c.opciones.map(o => `<option value="${esc(o)}">`).join('')}</datalist>`).join('')}
    <p class="ayuda" id="ayuda-planilla">Clic para seleccionar · <kbd>Doble clic</kbd> o empezá a escribir para editar · <kbd>Enter</kbd> guarda y baja · <kbd>Tab</kbd> guarda y avanza · <kbd>Supr</kbd> borra · <kbd>Esc</kbd> cancela · <kbd>Ctrl</kbd>+<kbd>B</kbd> bloquea/desbloquea.
    Las columnas en <span class="muestra-calc">gris</span> se calculan solas. Los miembros salen de <a href="#/miembros">Miembros de la legión</a>, ordenados por rango.</p>`;

  const editable = puedeEditar();
  function aplicarModo() {
    const ver = hoja.modo === 'ver';
    ['#btn-bloq-celda', '#btn-bloq-mes', '#btn-desbloq-mes'].forEach(s => { $(s).hidden = !editable || ver; });
    $('#barra-formula').hidden = ver; $('#ayuda-planilla').hidden = ver;
    $('#hoja-cont').classList.toggle('modo-ver', ver);
    $$('[data-modo]', cont).forEach(b => { b.classList.toggle('activo', b.dataset.modo === hoja.modo); b.setAttribute('aria-selected', b.dataset.modo === hoja.modo); });
  }
  aplicarModo();
  $$('[data-modo]', cont).forEach(b => b.onclick = () => {
    if (hoja.modo === b.dataset.modo || hoja.editando) return;
    hoja.modo = b.dataset.modo;
    try { localStorage.setItem(claveModo, hoja.modo); } catch {}
    aplicarModo(); pintar();
    if (hoja.modo === 'planilla') $('#hoja-cont').focus({ preventScroll: true });
  });

  const clave = (mid, col) => `${mid}|${col}`;
  const celdaDe = (f, c) => hoja.celdas.get(clave(hoja.filas[f].id, cols[c].clave));
  const recalcular = f => { hoja.calc[f] = calcularFila(config, col => hoja.celdas.get(clave(hoja.filas[f].id, col))?.valor, hoja.filas[f]); };
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
    const [miembros, regs, avisos] = await Promise.all([api.listarPersonas(), api.listarRegistros(cat, k),
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

  const colInact = cols.findIndex(c => COLS_INACTIVIDAD.includes(c.clave));
  function pintar() {
    const hc = $('#hoja-cont');
    if (!hoja.filas.length) {
      hc.innerHTML = `<div class="vacio">No hay miembros para <strong>${esc(config.titulo)}</strong> en ${esc(nombreHoja())}.<br><br>
        <a class="btn" href="#/miembros">Ir a Miembros</a></div>`;
      actualizarFormula(); return;
    }
    if (hoja.modo === 'ver') return pintarVista(hc);
    hc.classList.remove('modo-ver');
    const numCol = c => c.tipo === 'numero' || c.numerica;
    hc.classList.toggle('con-secciones', !!config.secciones);
    if (config.secciones) return pintarSecciones(hc, numCol);
    let html = `<table class="hoja"><thead><tr>
      <th class="fijo col-n">#</th><th class="fijo col-nombre">Miembro</th><th>Rango</th>
      ${fijas.map(f => `<th>${esc(f.nombre)}</th>`).join('')}
      ${cols.map(c => `<th class="${numCol(c) ? 'num' : ''} ${c.tipo === 'calculada' ? 'th-calc' : ''}">${esc(c.nombre)}</th>`).join('')}
      </tr></thead><tbody>`;
    hoja.filas.forEach((m, f) => {
      html += `<tr class="${m.activo ? '' : 'inactivo'}" data-mid="${m.id}" data-rango="${esc(normRango(m.grado))}"><td class="fijo col-n">${f + 1}</td>
        <td class="fijo col-nombre" title="${esc(m.discord_id || '')}"><a class="link-perfil" href="#/perfil?id=${m.id}">${esc(m.nombre)}</a>${colInact < 0 ? insigniaInactividad(hoja.inact?.get(m.id), m.nombre) : ''}</td><td class="col-grado">${esc(m.grado)}</td>
        ${fijas.map(x => `<td class="col-grado">${esc(valorFijo(m, x))}</td>`).join('')}`;
      cols.forEach((c, ci) => { html += `<td data-f="${f}" data-c="${ci}"></td>`; });
      html += `</tr>`;
    });
    html += `</tbody><tfoot><tr><td class="fijo col-n"></td><td class="fijo col-nombre">Total</td><td></td>${fijas.map(() => '<td></td>').join('')}
      ${cols.map((c, ci) => `<td class="num" data-tcol="${ci}"></td>`).join('')}</tr></tfoot></table>`;
    hc.innerHTML = html;
    hoja.filas.forEach((_, f) => cols.forEach((_, c) => pintarCelda(f, c)));
    pintarTotales();
    ajustarColumnas(hc);
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
          return `<tr class="${m.activo ? '' : 'inactivo'}" data-mid="${m.id}" data-rango="${esc(normRango(m.grado))}"><td class="col-nombre" title="${esc(m.discord_id || '')}"><a class="link-perfil" href="#/perfil?id=${m.id}">${esc(m.nombre)}</a>${colInact < 0 ? insigniaInactividad(hoja.inact?.get(m.id), m.nombre) : ''}</td>
            <td class="col-grado" title="${esc(ELITES[m[campo]] || '')}">${esc(config.secciones.columna ? m[campo] : m.grado)}</td>${cols.map((c, ci) => `<td data-f="${f}" data-c="${ci}"></td>`).join('')}</tr>`; }).join('')
          : `<tr><td colspan="${cols.length + 2}" class="vacio-chico">Sin miembros</td></tr>`}
        </tbody><tfoot><tr><td class="col-nombre">Total</td><td></td>
          ${cols.map((c, ci) => `<td class="num" data-tcol="${ci}" data-sec="${si}"></td>`).join('')}</tr></tfoot></table></div>
      </section>`;
    }).join('')}</div>`;
    hoja.filas.forEach((_, f) => cols.forEach((_, c) => pintarCelda(f, c)));
    pintarTotales();
    ajustarColumnas(hc);
    marcarSeleccion();
  }

  /* ---------- modo Vista: resumen + tabla limpia para leer (el modo Planilla es el Excel para editar) */
  function pintarVista(hc) {
    hc.classList.remove('con-secciones'); hc.classList.add('modo-ver');
    const colTotal = cols.find(c => c.tipo === 'calculada' && c.numerica && /total/.test(c.clave) && !/lid/.test(c.clave));
    const colEstado = cols.find(c => c.tipo === 'calculada' && !c.numerica);
    const numeroDe = (f, c) => numero(textoCelda(f, c));
    const totalDe = f => colTotal ? numero(hoja.calc[f]?.[colTotal.clave])
      : cols.reduce((s, c, ci) => s + (c.tipo === 'numero' ? numeroDe(f, ci) : 0), 0);
    const totales = hoja.filas.map((_, f) => totalDe(f));
    const suma = totales.reduce((s, t) => s + t, 0), maxTotal = Math.max(1, ...totales);
    const sinActividad = totales.filter(t => !t).length;
    const conInact = hoja.filas.filter(m => hoja.inact?.get(m.id)?.length).length;
    const estados = {};
    if (colEstado) hoja.filas.forEach((_, f) => { const v = String(hoja.calc[f]?.[colEstado.clave] || ''); if (v) estados[v] = (estados[v] || 0) + 1; });
    const claseEstado = v => /^✅/.test(v) ? 'ok' : /^🟨/.test(v) ? 'medio' : /^❌/.test(v) ? 'mal' : 'neutro';
    const textoEstado = v => String(v).replace(/^[^\p{L}\p{N}]+/u, '');
    const pastilla = v => v ? `<span class="pastilla ${claseEstado(v)}">${esc(textoEstado(v))}</span>` : '';

    const tarjeta = (n, t, extra = '') => `<div class="tarjeta resumen-vista">${extra}<div class="dato-grande">${n}</div><div class="dato-etiqueta">${t}</div></div>`;
    hc.innerHTML = `
      <div class="rejilla resumen-hoja">
        ${tarjeta(hoja.filas.length, 'Miembros en la planilla')}
        ${tarjeta(formatoNum(suma), colTotal ? esc(colTotal.nombre) + ' (suma)' : 'Actividades (suma)')}
        ${tarjeta(formatoNum(Math.round(suma / Math.max(1, hoja.filas.length) * 10) / 10), 'Promedio por miembro')}
        ${Object.entries(estados).sort((a, b) => ['ok', 'medio', 'neutro', 'mal'].indexOf(claseEstado(a[0])) - ['ok', 'medio', 'neutro', 'mal'].indexOf(claseEstado(b[0])))
            .map(([v, n]) => tarjeta(n, pastilla(v))).join('')}
        ${tarjeta(sinActividad, 'Sin actividad')}
        ${conInact ? tarjeta(conInact, 'Con inactividad declarada') : ''}
      </div>
      <div class="herramientas vista-filtros">
        <input class="entrada" id="vista-buscar" placeholder="Buscar miembro o rango…" style="max-width:280px" value="${esc(hoja.busqueda || '')}">
        <span class="tenue" style="font-size:12.5px">Clic en un encabezado para ordenar</span>
      </div>
      <div id="vista-tabla"></div>`;

    const columnas = [
      { id: 'nombre', titulo: 'Miembro', valor: f => hoja.filas[f].nombre },
      { id: 'grado', titulo: config.secciones?.columna || 'Rango', valor: f => config.secciones?.columna ? hoja.filas[f][config.secciones.campo] : hoja.filas[f].grado,
        orden: f => config.secciones?.columna ? hoja.filas[f][config.secciones.campo] : RANGOS_NORM.indexOf(normRango(hoja.filas[f].grado)) },
      ...fijas.map(x => ({ id: 'fija-' + x.campo, titulo: x.nombre, valor: f => valorFijo(hoja.filas[f], x) })),
      ...cols.map((c, ci) => ({ id: c.clave, titulo: c.nombre, col: c, ci, num: c.tipo === 'numero' || c.numerica,
        valor: f => textoCelda(f, ci) }))
        // Las columnas que se cargan a mano y no tienen ningún dato en este período no se muestran (están en la planilla)
        .filter(c => c.col.tipo !== 'numero' || hoja.filas.some((_, f) => numeroDe(f, c.ci))),
    ];
    const ocultas = cols.filter((c, ci) => c.tipo === 'numero' && !hoja.filas.some((_, f) => numeroDe(f, ci))).map(c => c.nombre);
    if (ocultas.length) $('.vista-filtros', hc).insertAdjacentHTML('beforeend',
      `<span class="tenue" style="font-size:12.5px" title="${esc(ocultas.join(', '))}">· ${ocultas.length} columna${ocultas.length === 1 ? '' : 's'} sin datos en este período oculta${ocultas.length === 1 ? '' : 's'}</span>`);
    function tablaHTML() {
      const q = (hoja.busqueda || '').trim().toLowerCase();
      const visible = f => !q || `${hoja.filas[f].nombre} ${hoja.filas[f].grado} ${hoja.filas[f].elite || ''}`.toLowerCase().includes(q);
      const grupos = config.secciones
        ? config.secciones.lista.map(s => ({ titulo: s.titulo, filas: hoja.filas.map((m, f) => s.valores.includes(m[config.secciones.campo]) ? f : -1).filter(f => f >= 0) }))
        : [{ titulo: '', filas: hoja.filas.map((_, f) => f) }];
      const o = estado.ordenando ? null : hoja.orden;
      if (o) {
        const col = columnas.find(c => c.id === o.id);
        const clave = f => col.orden ? col.orden(f) : col.num ? numero(col.valor(f)) : String(col.valor(f) || '').toLowerCase();
        grupos.forEach(g => g.filas.sort((a, b) => { const x = clave(a), y = clave(b); return (x > y ? 1 : x < y ? -1 : 0) * o.dir; }));
      }
      const celda = (c, f) => {
        if (!c.col) {
          if (c.id === 'nombre') { const m = hoja.filas[f];
            return `<td class="v-nombre"><a class="link-perfil" href="#/perfil?id=${m.id}">${esc(m.nombre)}</a>${colInact < 0 ? insigniaInactividad(hoja.inact?.get(m.id), m.nombre) : ''}</td>`; }
          return `<td class="tenue">${esc(c.valor(f) || '—')}</td>`;
        }
        const v = c.valor(f);
        if (c.col === colTotal) { const n = numero(v);
          return `<td class="num v-total"><span class="barra-total"><span style="width:${Math.round(n / maxTotal * 100)}%"></span></span><b>${formatoNum(n)}</b></td>`; }
        if (c.num) { const n = numero(v); return `<td class="num ${n ? '' : 'cero'}">${n ? formatoNum(n) : '–'}</td>`; }
        if (c.col.tipo === 'calculada') return `<td>${pastilla(v)}</td>`;
        const ins = c.ci === colInact ? insigniaInactividad(hoja.inact?.get(hoja.filas[f].id), hoja.filas[f].nombre) : '';
        return `<td class="v-texto">${ins}${v ? `<span>${esc(v)}</span>` : (ins ? '' : '<span class="tenue">—</span>')}</td>`;
      };
      const totalCol = c => {
        if (!c.num) return '<td></td>';
        const n = hoja.filas.reduce((s, _, f) => s + numero(c.valor(f)), 0);
        return `<td class="num"><b>${formatoNum(n)}</b></td>`;
      };
      const filasHTML = grupos.map(g => {
        const fs = g.filas.filter(visible);
        return (g.titulo ? `<tr class="fila-grupo"><td colspan="${columnas.length}">${esc(g.titulo)} <span>${fs.length}</span></td></tr>` : '')
          + (fs.length ? fs.map(f => `<tr class="${hoja.filas[f].activo ? '' : 'inactivo'}" data-mid="${hoja.filas[f].id}" data-rango="${esc(normRango(hoja.filas[f].grado))}">${columnas.map(c => celda(c, f)).join('')}</tr>`).join('')
            : `<tr><td colspan="${columnas.length}" class="vacio-chico">${q ? 'Nadie coincide con la búsqueda.' : 'Sin miembros'}</td></tr>`);
      }).join('');
      return `<div class="envoltorio-tabla"><table class="datos tabla-vista"><thead><tr>${columnas.map(c =>
          `<th class="${c.num ? 'num' : ''} ${o?.id === c.id ? 'ordenada' : ''}" data-orden="${c.id}" title="Ordenar por ${esc(c.titulo)}"
            ${c.id === 'nombre' ? 'data-ancho-min="140" data-sin-cortar' : c.col?.tipo === 'calculada' && !c.num ? 'data-sin-cortar' : c.col?.tipo === 'texto' ? 'data-ancho-min="160"' : ''}>${esc(c.titulo)}${o?.id === c.id ? (o.dir > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('')}</tr></thead>
        <tbody>${filasHTML}</tbody>
        <tfoot><tr>${columnas.map((c, i) => i === 0 ? '<td><b>Total</b></td>' : totalCol(c)).join('')}</tr></tfoot></table></div>`;
    }
    const pintarTabla = () => { $('#vista-tabla').innerHTML = tablaHTML(); };
    pintarTabla();
    $('#vista-buscar').oninput = ev => { hoja.busqueda = ev.target.value; pintarTabla(); };
    $('#vista-tabla').onclick = ev => {
      const th = ev.target.closest('th[data-orden]'); if (!th) return;
      const id = th.dataset.orden, col = columnas.find(c => c.id === id);
      // números: primero de mayor a menor; textos: A→Z. Tercer clic vuelve al orden original.
      const inicial = col.num ? -1 : 1;
      hoja.orden = hoja.orden?.id !== id ? { id, dir: inicial } : hoja.orden.dir === inicial ? { id, dir: -inicial } : null;
      pintarTabla();
    };
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
    if (c === colInact) {
      const m = hoja.filas[f], ins = insigniaInactividad(hoja.inact?.get(m.id), m.nombre);
      if (ins) { td.insertAdjacentHTML('afterbegin', ins); td.classList.add('con-inact'); }
    }
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
    if (hoja.modo === 'ver') return;
    const td = ev.target.closest('td[data-f]'); if (!td || hoja.editando) return;
    hoja.sel = { f: +td.dataset.f, c: +td.dataset.c }; marcarSeleccion(); hc.focus({ preventScroll: true });
  };
  hc.ondblclick = ev => { if (hoja.modo === 'ver') return; const td = ev.target.closest('td[data-f]'); if (td) empezarEdicion(+td.dataset.f, +td.dataset.c); };
  hc.onkeydown = async ev => {
    if (hoja.modo === 'ver' || hoja.editando || !hoja.filas.length || ev.target.closest('input')) return;
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
  const oa = a.orden ?? Infinity, ob = b.orden ?? Infinity;
  if (oa !== ob) return oa < ob ? -1 : 1;
  return a.nombre.localeCompare(b.nombre);
}
const categoriaDeRango = g => Object.keys(CATEGORIA_POR_RANGO).find(c => CATEGORIA_POR_RANGO[c].map(normRango).includes(normRango(g)));
const ordenarMiembros = lista => lista.sort((a, b) =>
  ORDEN_CAT.indexOf(a.categoria) - ORDEN_CAT.indexOf(b.categoria) || compararRango(a, b));

// En Miembros de la legión solo figuran de Sargento en adelante, más los élites de cualquier rango
const RANGO_MIN_MIEMBROS = 'SGT';
const esDeLegion = m => indiceRango(m.grado) >= indiceRango(RANGO_MIN_MIEMBROS) || !!ELITES[m.elite];
// Rango de la web que corresponde según el rango in-game y la élite (la base de datos lo aplica sola; Rango Scope es aparte)
const rangoWebDe = (grado, elite) => {
  const g = normRango(grado), cat = categoriaDeRango(grado);
  if (g === 'MRL') return 7;
  if (cat === 'comandantes') return 6;
  if (/^CPT/.test(g)) return 5;
  if (cat === 'oficiales') return 4;
  if (cat === 'suboficiales') return 3;
  if (ELITES[elite]) return 2;
  return 1;
};
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
  const nCols = editable ? 9 : 8;

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
      <th>Rango</th><th data-ancho-min="150" data-sin-cortar>Nombre clon</th><th data-ancho-min="170" data-sin-cortar>Nombre Jedi</th><th>Icónico</th>
      <th>Categoría</th><th>Élite</th><th>SteamID</th><th>Discord</th>${editable ? '<th></th>' : ''}
    </tr></thead><tbody id="cuerpo-miembros"></tbody></table></div>
    <p class="ayuda">Clic en un SteamID o Discord para copiarlo · el SteamID64 abre el perfil de Steam · dentro de cada categoría se ordena por rango.</p>`;

  function filaHTML(m) {
    return `<tr class="${m.activo ? '' : 'fila-inactiva'}" data-mid="${m.id}" data-rango="${esc(normRango(m.grado))}">
      <td>${esEliteSinSGT(m) ? '<span class="tenue">—</span>' : `<strong>${esc(m.grado) || '—'}</strong>`}</td>
      <td><a class="link-perfil" href="#/perfil?id=${m.id}"><strong>${esc(m.nombre)}</strong></a>${m.notas ? ` <span class="nota" title="${esc(m.notas)}">ⓘ</span>` : ''}</td>
      <td>${esc(m.nombre_jedi) || '<span class="tenue">—</span>'}</td>
      <td>${tieneIconico(m) ? `<span class="etiqueta admin">${esc(m.nombre_iconico)}</span>` : '<span class="tenue">No</span>'}</td>
      <td>${esc(CATS_VISTA[catVista(m)] || tituloCat(m.categoria))}</td>
      <td>${ELITES[m.elite] ? `<span class="etiqueta admin" title="${esc(ELITES[m.elite])}">${esc(m.elite)}</span>` : '<span class="tenue">No</span>'}</td>
      <td class="steam">${m.steam_id ? `<button class="copiar mono" data-copiar="${esc(m.steam_id)}" data-tipo="SteamID" title="Copiar SteamID">${esc(m.steam_id)}</button>` : '<span class="tenue">—</span>'}
        ${m.steam_id64 ? `<a class="sub mono" href="https://steamcommunity.com/profiles/${esc(m.steam_id64)}" target="_blank" rel="noopener noreferrer">${esc(m.steam_id64)}</a>` : ''}</td>
      <td>${m.discord_id ? `<button class="copiar mono" data-copiar="${esc(m.discord_id)}" data-tipo="Discord ID" title="Copiar Discord ID">${esc(m.discord_id)}</button>` : '<span class="tenue">—</span>'}</td>
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
      try { await navigator.clipboard.writeText(cp.dataset.copiar); aviso(`${cp.dataset.tipo || 'Dato'} copiado.`); } catch { aviso('No se pudo copiar.', 'error'); }
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
  const miembrosCal = await api.listarMiembros().catch(() => []);
  const porIdCal = new Map(miembrosCal.map(m => [m.id, m]));
  const candidatosCal = ordenarMiembros(miembrosCal.filter(m => m.activo));
  const nombreOrg = id => { const m = porIdCal.get(id); return m ? `${m.grado} ${m.nombre}` : '¿?'; };
  const resumirDesc = (t, n = 90) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t; };

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
      return `<div class="cal-dia ${d.getMonth() !== mes - 1 ? 'fuera' : ''} ${iso === hoy ? 'hoy' : ''} ${iso < hoy ? 'pasado' : ''} ${editable && iso >= hoy ? 'puede' : ''}" data-fecha="${iso}">
        <span class="cal-num">${d.getDate()}</span>
        ${evs.map(e => `<button class="cal-evento" style="background:${colorTipo(e.tipo)}" data-evento="${e.id}"
            title="${esc((e.hora ? e.hora + ' · ' : '') + e.titulo + (e.descripcion ? `\n“${e.descripcion}”` : '') + ((e.organizadores || []).length ? '\nProgramado por: ' + e.organizadores.map(nombreOrg).join(', ') : ''))}">
            <span class="cal-ev-titulo">${e.hora ? `<span class="cal-ev-hora">${esc(e.hora)}</span> ` : ''}“${esc(e.titulo)}”</span>
            ${e.descripcion ? `<span class="cal-ev-desc">${esc(resumirDesc(e.descripcion))}</span>` : ''}
            ${(e.organizadores || []).length ? `<span class="cal-ev-org">${esc(e.organizadores.map(id => porIdCal.get(id)?.nombre || '¿?').join(', '))}</span>` : ''}</button>`).join('')}
      </div>`;
    }).join('');
  }

  function formulario(e) {
    const soloVer = !editable;
    const opciones = TIPOS_EVENTO.map(t => `<option ${t.nombre === e.tipo ? 'selected' : ''}>${esc(t.nombre)}</option>`).join('');
    abrirModal(soloVer ? e.titulo : (e.id ? 'Editar evento' : 'Nuevo evento'), soloVer ? `
      <p class="dato-etiqueta" style="margin:0 0 6px"><i class="punto" style="display:inline-block;background:${colorTipo(e.tipo)}"></i> ${esc(e.tipo)}</p>
      <p style="margin:0 0 12px"><strong>${esc(new Date(e.fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</strong>${e.hora ? ' · ' + esc(e.hora) : ''}</p>
      <p style="white-space:pre-wrap;line-height:1.5;margin:0 0 12px">${esc(e.descripcion) || '<span style="color:var(--texto-3)">Sin descripción.</span>'}</p>
      ${(e.organizadores || []).length ? `<p style="margin:0 0 16px"><span class="dato-etiqueta">Programado por</span><br>${e.organizadores.map(id => `<span class="chip-acomp">${esc(nombreOrg(id))}</span>`).join(' ')}</p>` : ''}
      <div class="modal-pie"><button class="btn" data-cancelar>Cerrar</button></div>` : `
      <form id="form-evento">
        <label class="campo"><span>Título</span><input name="titulo" required maxlength="100" value="${esc(e.titulo)}"></label>
        <div class="fila-campos">
          <label class="campo"><span>Fecha</span><input name="fecha" type="date" required value="${esc(e.fecha)}" ${e.id ? '' : `min="${fechaISO(new Date())}"`}></label>
          <label class="campo"><span>Hora</span><input name="hora" type="time" ${e.id ? "" : "required"} value="${esc(e.hora)}"></label>
        </div>
        <label class="campo"><span>Tipo</span><select name="tipo">${opciones}</select></label>
        <div class="campo"><span>¿Quiénes la programan? <small class="tenue">(podés sumar a quienes la hacen con vos)</small></span>
          <div class="selector-acomp" id="selector-org">
            <div class="chips-acomp" id="chips-org"></div>
            <input id="buscar-org" placeholder="Agregar a alguien: nombre, rango o Discord…" autocomplete="off">
          </div>
          <div class="resultados-acomp" id="resultados-org" hidden></div>
        </div>
        <label class="campo"><span>Descripción</span><textarea name="descripcion" maxlength="1000" placeholder="¿De qué se trata? Se muestra en el calendario.">${esc(e.descripcion)}</textarea></label>
        <div class="modal-pie">
          ${e.id ? '<button type="button" class="btn peligro izq" data-borrar>Borrar</button>' : ''}
          <button type="button" class="btn" data-cancelar>Cancelar</button><button class="btn primario">Guardar</button>
        </div>
      </form>`, c => {
      $('[data-cancelar]', c).onclick = cerrarModal;
      if (soloVer) return;
      // Organizadores: arranca con quien carga el evento; se pueden sumar más
      const orgs = [...(e.organizadores || [])];
      const buscar = $('#buscar-org', c), res = $('#resultados-org', c);
      let marcado = 0;
      const texto = m => `${m.grado} ${m.nombre} ${m.nombre_jedi || ''} ${m.discord_id || ''} ${m.elite || ''}`.toLowerCase();
      const pintarOrgs = () => {
        $('#chips-org', c).innerHTML = orgs.map(id => id === estado.perfil.miembro_id
          ? `<span class="chip-acomp chip-fijo" title="Sos quien carga el evento: no te podés quitar">${esc(nombreOrg(id))} <small>(vos)</small></span>`
          : `<span class="chip-acomp">${esc(nombreOrg(id))}<button type="button" data-quitar="${id}" aria-label="Quitar">×</button></span>`).join('');
      };
      const coincid = () => { const q = buscar.value.trim().toLowerCase();
        return candidatosCal.filter(m => !orgs.includes(m.id) && (!q || q.split(/\s+/).every(p => texto(m).includes(p)))).slice(0, 40); };
      const pintarRes = () => {
        const l = coincid(); marcado = Math.min(marcado, Math.max(l.length - 1, 0)); res.hidden = false;
        res.innerHTML = l.length ? l.map((m, i) => `<div class="res-acomp ${i === marcado ? 'marcado' : ''}" data-elegir="${m.id}">
          <span class="res-rango">${esc(m.grado)}</span><span class="res-nombre">${esc(m.nombre)}</span>${ELITES[m.elite] ? `<span class="etiqueta admin">${esc(m.elite)}</span>` : ''}</div>`).join('')
          : '<div class="res-vacio">Nadie coincide con la búsqueda.</div>';
        $('.res-acomp.marcado', res)?.scrollIntoView({ block: 'nearest' });
      };
      const elegir = id => { if (!orgs.includes(id)) orgs.push(id); buscar.value = ''; marcado = 0; pintarOrgs(); pintarRes(); buscar.focus(); };
      buscar.onfocus = pintarRes;
      buscar.oninput = () => { marcado = 0; pintarRes(); };
      buscar.onblur = () => setTimeout(() => { res.hidden = true; }, 120);
      buscar.onkeydown = ev => {
        const l = coincid();
        if (ev.key === 'ArrowDown') { ev.preventDefault(); marcado = Math.min(marcado + 1, l.length - 1); pintarRes(); }
        else if (ev.key === 'ArrowUp') { ev.preventDefault(); marcado = Math.max(marcado - 1, 0); pintarRes(); }
        else if (ev.key === 'Enter') { ev.preventDefault(); if (!res.hidden && l[marcado]) elegir(l[marcado].id); }
        else if (ev.key === 'Escape') { ev.stopPropagation(); res.hidden = true; }
        else if (ev.key === 'Backspace' && !buscar.value && orgs.length && orgs.at(-1) !== estado.perfil.miembro_id) { orgs.pop(); pintarOrgs(); }
      };
      res.onmousedown = ev => { const r = ev.target.closest('[data-elegir]'); if (!r) return; ev.preventDefault(); elegir(+r.dataset.elegir); };
      $('#selector-org', c).onclick = ev => {
        const q = ev.target.closest('[data-quitar]');
        if (q && +q.dataset.quitar !== estado.perfil.miembro_id) { orgs.splice(orgs.indexOf(+q.dataset.quitar), 1); pintarOrgs(); }
        buscar.focus();
      };
      pintarOrgs();
      $('#form-evento', c).onsubmit = async ev => {
        ev.preventDefault(); const f = ev.target;
        const cambiaCuando = !e.id || f.fecha.value !== e.fecha || f.hora.value !== e.hora;
        if (cambiaCuando && new Date(`${f.fecha.value}T${f.hora.value || '23:59'}`) < new Date(Date.now() - 60000))
          return aviso('No se pueden programar eventos en una fecha u hora que ya pasó.', 'error');
        try {
          await api.guardarEvento({ ...(e.id ? { id: e.id } : {}), titulo: f.titulo.value.trim(), fecha: f.fecha.value,
            hora: f.hora.value, tipo: f.tipo.value, descripcion: f.descripcion.value.trim(), organizadores: orgs });
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

  const horaActual = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const nuevo = fecha => ({ titulo: '', fecha, hora: horaActual(), tipo: TIPOS_EVENTO[0]?.nombre || '', descripcion: '',
    organizadores: estado.perfil.miembro_id ? [estado.perfil.miembro_id] : [] });
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
    if (dia && editable) {
      if (dia.dataset.fecha < fechaISO(new Date())) return aviso('Ese día ya pasó: no se pueden programar eventos ahí.');
      formulario(nuevo(dia.dataset.fecha));
    }
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
// Trys: se registran solo a nombre de quien la hizo
const TIPOS_SIN_ACOMP = ['try_21', 'try_esp'];
const ESPECIALIZACIONES_TRY = { ASE: 'Asalto', APE: 'Apoyo', RNE: 'Reconocimiento' };
const ESP_DE_ELITE = { ASE: 'ASE', APE: 'APE', RNE: 'RNE', ARC: 'RNE' };
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
          <th>Fecha</th><th>Actividad</th><th data-ancho-min="150" data-sin-cortar>Participantes</th><th data-ancho-min="150" data-sin-cortar>Cargada por</th><th>Informe</th><th></th>
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
        <label class="campo" id="campo-esp" hidden><span>Especialización de la try <small class="tenue" id="ayuda-esp"></small></span>
          <select name="especializacion"><option value="">— Elegir —</option>${Object.entries(ESPECIALIZACIONES_TRY).map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join('')}</select></label>
        <div class="campo" id="campo-acomp"><span>¿Con quién la hiciste? <small class="tenue" id="limite-acomp">(opcional)</small></span>
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
    const esTry = () => TIPOS_SIN_ACOMP.includes(f.tipo.value);
    const maxAcomp = () => esTry() ? 0 : (esCapElite() ? 3 : 2) - 1;
    // Especialización de la try: por defecto la élite propia (ARC cuenta como Reconocimiento); los comandantes eligen cualquiera
    const miEsp = ESP_DE_ELITE[yo.elite] || '';
    const eligeLibre = yo.categoria === 'comandantes' || !miEsp;
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
      const tTry = esTry();
      $('#campo-acomp').classList.toggle('deshabilitado', tTry);
      buscar.disabled = tTry;
      buscar.placeholder = tTry ? 'En las trys no se marca a nadie más' : 'Escribí un nombre, rango o Discord…';
      $('#limite-acomp').textContent = tTry ? '(no disponible en las trys)' : esCapElite()
        ? `(opcional · hasta ${max} élites más)` : `(opcional · hasta ${max} persona${max === 1 ? '' : 's'} más)`;
      const tEsp = f.tipo.value === 'try_esp';
      $('#campo-esp').hidden = !tEsp;
      f.especializacion.required = tEsp;
      f.especializacion.disabled = tEsp && !eligeLibre;
      if (tEsp && !f.especializacion.value && miEsp) f.especializacion.value = miEsp;
      $('#ayuda-esp').textContent = !tEsp ? '' : yo.categoria === 'comandantes' ? '(como comandante podés elegir cualquiera)'
        : miEsp ? '(solo la de tu élite)' : '';
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
      if (seleccion.length < antes) aviso(esTry() ? 'En las trys no se marca a nadie más: se quitaron los acompañantes.'
        : esCapElite() ? 'Se quitaron los acompañantes que no son élites o que superan el máximo.' : 'Se quitaron acompañantes que superan el máximo para este tipo.');
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
        if (f.tipo.value === 'try_esp' && !f.especializacion.value) { aviso('Elegí de qué especialización fue la try.', 'error'); return; }
        const nueva = await api.registrarActividad({ tipo: f.tipo.value, fecha: f.fecha.value, hora: f.hora.value, link, notas: f.notas.value.trim(),
          acompanantes: esTry() ? [] : elegidos(), especializacion: f.tipo.value === 'try_esp' ? f.especializacion.value : null });
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
        <td><strong>${esc(tipoDe(a.tipo)?.nombre || a.tipo)}${a.especializacion ? ` · ${esc(ESPECIALIZACIONES_TRY[a.especializacion] || a.especializacion)}` : ''}</strong>${a.notas ? `<span class="sub" title="${esc(a.notas)}">${esc(a.notas.slice(0, 60))}</span>` : ''}</td>
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
  const [miembros, registros, actividades, tipos, perfiles, idsBU] = await Promise.all([
    api.listarPersonas(), api.listarRegistrosMiembro(miembroId), api.listarActividadesMiembro(miembroId),
    api.listarTiposActividad(), esAdmin() ? api.listarPerfiles() : Promise.resolve([]), idsBUActual(),
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
    h.calc = cfg ? calcularFila(cfg, c => h.vals[c], m) : {};
  }

  const hoy = new Date();
  const sel = { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 };

  const dato = (titulo, valor) => valor ? `<div><span class="dato-etiqueta">${titulo}</span><div>${valor}</div></div>` : '';
  cont.innerHTML = `
    <div class="perfil-cabecera tarjeta">
      <div class="perfil-avatar con-retrato ${retratoDe(m, idsBU).tipo}" id="perfil-retrato">${imgRetrato(m, idsBU)}</div>
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
    ${m.id === estado.perfil.miembro_id ? `<section class="tarjeta modelo-elegir">
      <div><h3>Modelo del escalafón</h3>
        <p class="tenue">Es el retrato que se ve en el Escalafón militar, en tu perfil y en el menú.${modelosDe(m, idsBU).length === 1 ? ' Por ahora solo tenés disponible el modelo GM.' : ''}</p></div>
      <div class="modelo-opciones" id="modelo-opciones"></div>
    </section>` : ''}

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
      <th>Fecha</th><th>Actividad</th><th>Rol</th><th data-ancho-min="150" data-sin-cortar>Con</th><th data-ancho-min="150" data-sin-cortar>Cargada por</th><th>Registrada el</th><th>Informe</th>
    </tr></thead><tbody id="perfil-actividades"></tbody></table></div>

    <div id="bloque-anuladas" hidden>
      <h3 class="seccion-titulo" id="titulo-anuladas">Actividades anuladas</h3>
      <p class="dato-etiqueta" style="margin:-6px 0 10px">No suman en las tablas. Se muestran solo para control.</p>
      <div class="envoltorio-tabla"><table class="datos tabla-actividades"><thead><tr>
        <th>Fecha</th><th>Actividad</th><th>Rol</th><th data-ancho-min="150" data-sin-cortar>Con</th><th data-ancho-min="150" data-sin-cortar>Cargada por</th><th>Anulada el</th><th>Informe</th>
      </tr></thead><tbody id="perfil-anuladas"></tbody></table></div>
    </div>`;

  // Una fila de actividad. En las anuladas, la penúltima columna muestra cuándo se anuló.
  function filaActividad(a) {
    const otros = a.participantes.filter(id => id !== m.id);
    const cuando = a.anulada ? a.anulada_en : a.creado_en;
    return `<tr>
      <td>${new Date(a.fecha + 'T00:00:00').toLocaleDateString('es-AR')}${a.hora ? `<span class="sub">${esc(a.hora)}</span>` : ''}</td>
      <td><strong>${esc(tipoNombre(a.tipo))}${a.especializacion ? ` · ${esc(ESPECIALIZACIONES_TRY[a.especializacion] || a.especializacion)}` : ''}</strong>${a.notas ? `<span class="sub" title="${esc(a.notas)}">${esc(a.notas.slice(0, 60))}</span>` : ''}</td>
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
          <input class="entrada" id="foro-buscar" placeholder="Buscar reporte…">
          <button class="btn primario" id="foro-nuevo">+ Nuevo reporte</button>
        </div>
        <div id="foro-temas"></div>
      </aside>
      <section class="foro-tema tarjeta" id="foro-tema"></section>
    </div>
    <p class="ayuda">Contá acá cualquier error o cosa rara que encuentres en el panel: qué hiciste, qué esperabas y qué pasó. Lo leen todas las cuentas. <kbd>Ctrl</kbd>+<kbd>Enter</kbd> publica el comentario.</p>`;

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
          ${esAdmin() ? `<button class="btn chico" data-accion="fijar">${t.fijado ? 'Desfijar' : 'Fijar'}</button>` : ''}
          ${mio ? '<button class="btn chico" data-accion="editar">Editar</button>' : ''}
          ${mio || esAdmin() ? '<button class="btn chico peligro" data-accion="borrar">Borrar</button>' : ''}
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
              ${c.autor === estado.perfil.id || esAdmin() ? `<button class="btn-link peligro" data-borrar-com="${c.id}">Borrar</button>` : ''}
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
    abrirModal(t ? 'Editar reporte' : 'Nuevo reporte de bug', `
      <form id="form-tema">
        <label class="campo"><span>Título</span><input name="titulo" required maxlength="120" value="${esc(t?.titulo || '')}" placeholder="Ej: No se guarda la hora en el calendario"></label>
        <label class="campo"><span>Detalle <small class="tenue">(qué hiciste, qué esperabas y qué pasó)</small></span><textarea name="texto" maxlength="5000" style="min-height:140px">${esc(t?.texto || '')}</textarea></label>
        <div class="modal-pie"><button type="button" class="btn" data-cancelar>Cancelar</button><button class="btn primario">${t ? 'Guardar' : 'Publicar reporte'}</button></div>
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
  total:   { nombre: 'Inactividad',         ayuda: 'No vas a poder participar de nada.' },
  parcial: { nombre: 'Reducción de actividad', ayuda: 'Vas a estar con menos actividad (semi-activo).' },
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
          <th>Estado</th><th data-ancho-min="150" data-sin-cortar>Miembro</th><th>Tipo</th><th>Desde</th><th>Hasta</th><th>Motivo</th><th>Aviso</th><th></th>
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
    data-nombre="${esc(nombre)}" title="Declaró ${total ? 'inactividad' : 'reducción de actividad'} del ${rangos}. Clic para ver el aviso.">☾ ${total ? 'Inactivo' : 'Reducción'}</button>`;
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
const COLS_INACTIVIDAD = ['aclaraciones', 'inactividad'];
function cerrarMenuInact() { $$('.menu-inact').forEach(x => x.remove()); }
function menuInactividad(b, avisos, nombre) {
  cerrarMenuInact();
  const menu = document.createElement('div');
  menu.className = 'menu-inact'; menu.setAttribute('role', 'menu');
  menu.innerHTML = avisos.map(x => `
    <div class="menu-inact-cab">${esc(TIPOS_INACTIVIDAD[x.tipo]?.nombre || x.tipo)} · ${fechaAR(x.desde)} al ${fechaAR(x.hasta)}</div>
    <button type="button" role="menuitem" data-inact-panel="${x.id}"><span>▤</span> Ver informe en la base de datos</button>
    <a role="menuitem" href="${esc(x.link)}" target="_blank" rel="noopener noreferrer"><span>↗</span> Ver aviso en Discord</a>`).join('');
  document.body.appendChild(menu);
  const r = b.getBoundingClientRect(), w = menu.offsetWidth, h = menu.offsetHeight;
  menu.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px';
  menu.style.top = (r.bottom + h + 8 > innerHeight ? Math.max(8, r.top - h - 4) : r.bottom + 4) + 'px';
  menu.onclick = ev => {
    const p = ev.target.closest('[data-inact-panel]');
    if (p) { cerrarMenuInact(); verInactividad([INACT_VISTAS.get(+p.dataset.inactPanel)], nombre); }
    else if (ev.target.closest('a')) cerrarMenuInact();
  };
  $('button', menu)?.focus();
}
document.addEventListener('click', ev => {
  if (ev.target.closest?.('.menu-inact')) return;
  const b = ev.target.closest?.('[data-ver-inact]');
  cerrarMenuInact();
  if (!b) return;
  ev.preventDefault(); ev.stopPropagation();
  const avisos = b.dataset.verInact.split(',').map(id => INACT_VISTAS.get(+id)).filter(Boolean);
  if (avisos.length) menuInactividad(b, avisos, b.dataset.nombre);
});
document.addEventListener('keydown', ev => { if (ev.key === 'Escape') cerrarMenuInact(); });
window.addEventListener('hashchange', cerrarMenuInact);
document.addEventListener('scroll', cerrarMenuInact, true);

/* ============================================================ ESCALAFÓN MILITAR */
// Retratos pre-renderizados (img/escalafon/*.webp): el GM para todos, el de la BU para quienes están en la BU,
// y uno propio para cada icónico que tenga modelo.
const RETRATOS_ALIAS = { pluto: 'pluto_p2', ridge: 'ridge_p2' };   // icónicos que usan otra versión del modelo
const RETRATOS_ICONICOS = ['ki_adi_mundi', 'yarael_poof', 'mace_windu', 'pluto_p2', 'ridge_p2', 'bacara', 'blackout', 'bullseye', 'contrail', 'epsilon', 'etal', 'finn', 'griggs', 'jet', 'keller',
  'levet', 'mark', 'mustang', 'racetrack', 'rancor_hammer', 'shade', 'sixseed', 'spark', 'stance', 'thruster'];
const NIVELES_ESCALAFON = [
  { titulo: 'Mariscales',  rangos: ['MRL'],                         tam: 'xl' },
  { titulo: 'Comandantes', rangos: ['CMD B', 'CMDM', 'CMD1', 'CMD'], tam: 'l' },
  { titulo: 'Capitanes',   rangos: ['CPTM', 'CPT1', 'CPT'],          tam: 'l' },
  { titulo: 'Tenientes',   rangos: ['TTE1', 'TTE2', 'TTE', 'STTE'],  tam: 'm' },
  { titulo: 'Sargentos',   rangos: ['SGTM', 'SGT1', 'SGT2', 'SGT'],  tam: 'm' },
  // Élites que no llegan a Sargento (los de Sargento en adelante ya están en su nivel), como en Miembros de la legión
  { titulo: 'Élites',      filtro: m => esEliteSinSGT(m),            tam: 'm' },
];
// Modelos que puede usar un miembro: su icónico (si tiene modelo), el de la BU (si está en la BU) y siempre el GM
function modelosDe(m, idsBU) {
  const lista = [];
  if (tieneIconico(m)) {
    let k = m.nombre_iconico.trim().toLowerCase().replace(/\s+/g, '_');
    k = RETRATOS_ALIAS[k] || k;
    if (RETRATOS_ICONICOS.includes(k)) lista.push({ clave: 'iconico', nombre: m.nombre_iconico, src: `img/escalafon/${k}.webp` });
  }
  if (idsBU.has(m.id)) lista.push({ clave: 'bu', nombre: 'Blackout Unit', src: 'img/escalafon/bu.webp' });
  lista.push({ clave: 'gm', nombre: 'Galactic Marine', src: 'img/escalafon/gm.webp' });
  return lista;
}
// El elegido por el miembro si lo tiene disponible; si no, el primero (icónico > BU > GM)
function retratoDe(m, idsBU) {
  const lista = modelosDe(m, idsBU);
  const x = lista.find(o => o.clave === m.modelo) || lista[0];
  return { src: x.src, tipo: x.clave };
}
// BU actual: quienes figuran en la última planilla de BU cargada (se consulta una vez por sesión)
let promesaBU = null;
function idsBUActual() {
  promesaBU = promesaBU || api.listarPlantelBU().then(rs => {
    const ultima = rs.reduce((u, r) => Math.max(u, r.anio * 100 + r.mes), 0);
    return new Set(rs.filter(r => r.anio * 100 + r.mes === ultima).map(r => r.miembro_id));
  }).catch(() => new Set());
  return promesaBU;
}
const imgRetrato = (m, idsBU, extra = '') => `<img src="${retratoDe(m, idsBU).src}" alt="" decoding="async" ${extra}>`;

async function vistaEscalafon(cont) {
  const [miembros, idsBU] = await Promise.all([api.listarMiembros(), idsBUActual()]);

  const activos = miembros.filter(m => m.activo);
  const niveles = NIVELES_ESCALAFON.map(n => {
    const set = new Set((n.rangos || []).map(normRango));
    const entra = n.filtro || (m => set.has(normRango(m.grado)));
    return { ...n, lista: activos.filter(entra).sort(compararRango) };
  }).filter(n => n.lista.length);

  const tarjeta = (m, tam) => {
    const r = retratoDe(m, idsBU);
    return `<article class="esc-card ${tam}" data-mid="${m.id}" data-rango="${esc(normRango(m.grado))}">
      <div class="esc-retrato ${r.tipo}"><img src="${r.src}" alt="" loading="lazy" decoding="async" width="256" height="256"></div>
      <div class="esc-info">
        <span class="esc-grado">${esc(m.grado)}</span>
        <a class="esc-nombre" href="#/perfil?id=${m.id}" title="${esc(m.nombre)}">${esc(m.nombre)}</a>
        <div class="esc-tags">
          ${tieneIconico(m) ? `<span class="esc-tag iconico">${esc(m.nombre_iconico)}</span>` : ''}
          ${ELITES[m.elite] ? `<span class="esc-tag elite" title="${esc(ELITES[m.elite])}">${esc(m.elite)}</span>` : ''}
          ${idsBU.has(m.id) ? '<span class="esc-tag bu">BU</span>' : ''}
        </div>
      </div>
    </article>`;
  };

  cont.innerHTML = `
    <div class="esc-indice">${niveles.map((n, i) => `<a href="#" data-ir="${i}">${esc(n.titulo)} <b>${n.lista.length}</b></a>`).join('')}</div>
    <div class="esc-niveles">
      ${niveles.map((n, i) => `
        <section class="esc-nivel ${n.tam}" id="esc-nivel-${i}">
          <header class="esc-cab"><h2>${esc(n.titulo)}</h2><span>${n.lista.length}</span></header>
          <div class="esc-grilla ${n.tam}">${n.lista.map(m => tarjeta(m, n.tam)).join('')}</div>
        </section>`).join('')}
    </div>`;
  $('.esc-indice', cont).onclick = ev => {
    const a = ev.target.closest('[data-ir]'); if (!a) return;
    ev.preventDefault();
    $(`#esc-nivel-${a.dataset.ir}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
}

/* ============================================================ REVISIÓN DE ACTIVIDAD (Suboficiales, Oficiales y Comandantes) */
// Color de la etiqueta de cada tipo de actividad (los tipos nuevos que no estén acá usan gris)
const COLOR_TIPO_ACT = {
  ent_21: '#3b82f6', ent_esp: '#8b5cf6', ent_bu: '#64748b', rol_pj: '#f59e0b', minirol: '#ec4899',
  try_bu: '#14b8a6', try_esp: '#6366f1', try_21: '#22c55e', mis_21: '#ef4444', mis_bu: '#dc2626',
  cap_sombra: '#475569', mis_elite: '#e11d48',
};
const CATS_REVISION = [
  { cat: 'comandantes', titulo: 'Comandantes' },
  { cat: 'oficiales', titulo: 'Oficiales' },
  { cat: 'suboficiales', titulo: 'Suboficiales' },
];
const etiquetaTipoAct = (id, nombre) => {
  const c = COLOR_TIPO_ACT[id] || '#8a92a1';
  return `<span class="tag-act" style="--c:${c}">${esc(nombre)}</span>`;
};

async function vistaRevision(cont) {
  const hoy = new Date();
  // periodo: { anio, mes } o null = todo el historial
  let periodo = { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 };
  let seleccion = +(estado.params?.get('id') || 0) || null;
  let filtro = '';
  let miembros = [], tipos = [], actividades = [], inactividades = [];

  cont.innerHTML = `
    <div class="herramientas rev-herr">
      <div class="selector-anio">
        <button data-mov="-1" aria-label="Mes anterior">‹</button>
        <span id="rev-mes" style="min-width:150px"></span>
        <button data-mov="1" aria-label="Mes siguiente">›</button>
      </div>
      <button class="btn chico" id="rev-actual">Mes actual</button>
      <button class="btn chico" id="rev-todo">Todo el historial</button>
      <span class="espacio"></span>
      <span class="tenue" id="rev-resumen" style="font-size:13px"></span>
    </div>
    <div class="rev-layout">
      <aside class="rev-lista tarjeta">
        <input class="entrada" id="rev-buscar" type="search" placeholder="Buscar por nombre o rango…" autocomplete="off">
        <div id="rev-miembros" class="rev-miembros" tabindex="0" aria-label="Lista de miembros (usá ↑ y ↓)"></div>
      </aside>
      <section class="rev-detalle tarjeta" id="rev-detalle"></section>
    </div>`;

  const actsDe = id => actividades.filter(a => (a.participantes || []).includes(id));
  const inactDe = id => inactividades.filter(x => x.miembro_id === id && !x.cancelada);
  const tipoNombre = id => tipos.find(t => t.id === id)?.nombre || id;
  const etiqueta = id => { const x = miembros.find(m => m.id === id); return x ? `${x.grado} ${x.nombre}` : `#${id}`; };

  function visibles() {
    const f = normNombreAsc(filtro);
    return CATS_REVISION.map(g => ({
      ...g,
      lista: miembros.filter(m => m.categoria === g.cat && (!f || normNombreAsc(`${m.grado} ${m.nombre} ${m.nombre_iconico || ''}`).includes(f)))
        .sort(compararRango),
    })).filter(g => g.lista.length);
  }

  function pintarLista() {
    const grupos = visibles();
    const plano = grupos.flatMap(g => g.lista);
    if (!plano.some(m => m.id === seleccion)) seleccion = plano[0]?.id || null;
    $('#rev-miembros').innerHTML = grupos.length ? grupos.map(g => `
      <div class="rev-grupo">${esc(g.titulo)} <span>${g.lista.length}</span></div>
      ${g.lista.map(m => {
        const n = actsDe(m.id).length, inac = inactDe(m.id).length;
        return `<button class="rev-item ${m.id === seleccion ? 'activo' : ''} ${n ? '' : 'cero'}" data-id="${m.id}">
          <span class="rev-grado">${esc(m.grado)}</span>
          <span class="rev-nombre" title="${esc(m.nombre)}">${esc(m.nombre)}</span>
          ${inac ? '<span class="rev-inac" title="Tiene un aviso de inactividad en este período">☾</span>' : ''}
          <span class="rev-n">${n}</span>
        </button>`;
      }).join('')}`).join('') : '<div class="vacio-chico">Nadie coincide con la búsqueda.</div>';
    $('#rev-miembros .rev-item.activo')?.scrollIntoView({ block: 'nearest' });
  }

  function pintarDetalle() {
    const m = miembros.find(x => x.id === seleccion);
    const det = $('#rev-detalle');
    if (!m) { det.innerHTML = '<div class="vacio-chico">Elegí a alguien de la lista.</div>'; return; }
    const acts = actsDe(m.id).sort((a, b) => (b.fecha + (b.hora || '')).localeCompare(a.fecha + (a.hora || '')));
    const organizo = acts.filter(a => a.autor_miembro === m.id).length;
    const porTipo = {};
    for (const a of acts) porTipo[a.tipo] = (porTipo[a.tipo] || 0) + 1;
    const ordenTipos = Object.keys(porTipo).sort((a, b) => (tipos.find(t => t.id === a)?.orden ?? 99) - (tipos.find(t => t.id === b)?.orden ?? 99));
    const inacs = inactDe(m.id);
    const fecha = d => new Date(d + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    const txtPeriodo = periodo ? `${MESES[periodo.mes - 1]} ${periodo.anio}` : 'todo el historial';
    det.innerHTML = `
      <div class="rev-cab">
        <div class="perfil-avatar rev-avatar">${esc((m.nombre || '?').charAt(0).toUpperCase())}</div>
        <div style="flex:1;min-width:0">
          <div class="rev-titulo">${esc(m.grado)} ${esc(m.nombre)}
            ${ELITES[m.elite] ? `<span class="etiqueta admin" title="${esc(ELITES[m.elite])}">${esc(m.elite)}</span>` : ''}
            ${exentoMinimos(m) ? '<span class="etiqueta" title="Comandante en adelante (no ARC): no necesita cumplir mínimos">Exento de mínimos</span>' : ''}</div>
          <div class="tenue" style="font-size:13px">${esc(tituloCat(m.categoria))}${m.discord_id ? ` · <span class="mono">${esc(m.discord_id)}</span>` : ''}</div>
        </div>
        <a class="btn chico" href="#/perfil?id=${m.id}">Perfil completo →</a>
      </div>
      <div class="rev-total">
        <div><span class="rev-total-n">${acts.length}</span><span class="dato-etiqueta">actividad${acts.length === 1 ? '' : 'es'} en ${esc(txtPeriodo)}</span></div>
        <div class="rev-total-sub"><span><strong>${organizo}</strong> organizó</span><span><strong>${acts.length - organizo}</strong> participó</span></div>
      </div>
      ${ordenTipos.length ? `<div class="rev-chips">${ordenTipos.map(t => `<span class="rev-chip">${etiquetaTipoAct(t, tipoNombre(t))}<b>${porTipo[t]}</b></span>`).join('')}</div>` : ''}
      ${inacs.length ? `<div class="rev-avisos">${inacs.map(x => `<div>☾ <strong>${esc(TIPOS_INACTIVIDAD[x.tipo]?.nombre || 'Inactividad')}</strong>
        del ${new Date(x.desde + 'T00:00:00').toLocaleDateString('es-AR')} al ${new Date(x.hasta + 'T00:00:00').toLocaleDateString('es-AR')}
        · <a href="${esc(x.link)}" target="_blank" rel="noopener noreferrer">Ver aviso ↗</a></div>`).join('')}</div>` : ''}
      <h3 class="rev-sub">Desglose</h3>
      ${acts.length ? `<ul class="rev-acts">${acts.map(a => {
        const otros = (a.participantes || []).filter(id => id !== m.id);
        return `<li>
          <span class="rev-fecha">${fecha(a.fecha)}${a.hora ? `<small>${esc(a.hora)}</small>` : ''}</span>
          <span class="rev-act-info">
            <a class="rev-act-link" href="${esc(a.link)}" target="_blank" rel="noopener noreferrer" title="Abrir el informe en Discord">${esc(tipoNombre(a.tipo))}${a.especializacion ? ` · ${esc(ESPECIALIZACIONES_TRY[a.especializacion] || a.especializacion)}` : ''} <span aria-hidden="true">↗</span></a>
            <small>${a.autor_miembro === m.id ? 'Organizó' : `Participó${a.autor_miembro ? ` · cargó ${esc(etiqueta(a.autor_miembro))}` : ''}`}${otros.length ? ` · con ${otros.length} más` : ''}${a.notas ? ` · <span title="${esc(a.notas)}">${esc(a.notas.slice(0, 50))}${a.notas.length > 50 ? '…' : ''}</span>` : ''}</small>
          </span>
          ${etiquetaTipoAct(a.tipo, tipoNombre(a.tipo))}
        </li>`;
      }).join('')}</ul>` : `<div class="vacio-chico">Sin actividades registradas en ${esc(txtPeriodo)}.</div>`}`;
  }

  function seleccionar(id) {
    seleccion = id;
    $$('#rev-miembros .rev-item').forEach(b => b.classList.toggle('activo', +b.dataset.id === id));
    $('#rev-miembros .rev-item.activo')?.scrollIntoView({ block: 'nearest' });
    history.replaceState(null, '', `#/revision?id=${id}`);
    pintarDetalle();
  }

  async function cargar() {
    $('#rev-mes').textContent = periodo ? `${MESES[periodo.mes - 1]} ${periodo.anio}` : 'Todo el historial';
    $('#rev-todo').classList.toggle('primario', !periodo);
    let desde = '2000-01-01', hasta = '2100-12-31';
    if (periodo) {
      desde = fechaISO(new Date(periodo.anio, periodo.mes - 1, 1));
      hasta = fechaISO(new Date(periodo.anio, periodo.mes, 0));
    }
    $('#rev-detalle').innerHTML = '<div class="vacio-chico">Cargando…</div>';
    [actividades, inactividades] = await Promise.all([api.listarActividadesEntre(desde, hasta), api.listarInactividadesEntre(desde, hasta)]);
    const ids = new Set(miembros.filter(m => CATS_REVISION.some(g => g.cat === m.categoria)).map(m => m.id));
    const total = actividades.length, conAlguno = [...ids].filter(id => actsDe(id).length).length;
    $('#rev-resumen').textContent = `${total} actividad${total === 1 ? '' : 'es'} cargadas · ${conAlguno} de ${ids.size} con al menos una`;
    pintarLista(); pintarDetalle();
  }

  [miembros, tipos] = await Promise.all([api.listarMiembros(), api.listarTiposActividad()]);
  miembros = miembros.filter(m => m.activo);

  $$('[data-mov]', cont).forEach(b => b.onclick = () => {
    const base = periodo || { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 };
    const d = new Date(base.anio, base.mes - 1 + (+b.dataset.mov), 1);
    periodo = { anio: d.getFullYear(), mes: d.getMonth() + 1 }; cargar().catch(fallo);
  });
  $('#rev-actual').onclick = () => { periodo = { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 }; cargar().catch(fallo); };
  $('#rev-todo').onclick = () => { periodo = null; cargar().catch(fallo); };
  $('#rev-buscar').oninput = ev => { filtro = ev.target.value; pintarLista(); pintarDetalle(); };
  $('#rev-buscar').onkeydown = ev => { if (ev.key === 'ArrowDown') { ev.preventDefault(); $('#rev-miembros').focus(); mover(1); } };
  $('#rev-miembros').onclick = ev => { const b = ev.target.closest('.rev-item'); if (b) seleccionar(+b.dataset.id); };
  function mover(d) {
    const ids = $$('#rev-miembros .rev-item').map(b => +b.dataset.id);
    if (!ids.length) return;
    const i = ids.indexOf(seleccion);
    seleccionar(ids[Math.min(ids.length - 1, Math.max(0, (i < 0 ? 0 : i + d)))]);
  }
  $('#rev-miembros').onkeydown = ev => {
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); mover(ev.key === 'ArrowDown' ? 1 : -1); }
  };
  await cargar();
}

/* ============================================================ ASCENSOS DE TROPAS
   1) Se pega el mensaje de cada informe tal cual (o solo la lista). La web saca el título, el tipo de actividad
      (entrenamiento, misión, minirol, rol de PJ, capacitación) y los participantes. En cada informe se marca qué se
      contabiliza: Soldados, Cabos o ambos (nunca Sargento en adelante).
   2) Quien la cargó la guarda: queda pública "sin verificar" y cualquiera puede corregirla (juntar nombres, borrar, editar).
   3) "Verificar y guardar" la deja fija en el historial, lista para la captura de Discord. */
const GRUPOS_ASCENSO = {
  soldados: { titulo: 'Soldados', rangos: () => CATEGORIA_POR_RANGO.soldados },
  cabos:    { titulo: 'Cabos',    rangos: () => CATEGORIA_POR_RANGO.cabos },
};
const TIPOS_INFORME_ASC = {
  ent:    { nombre: 'Entrenamiento', plural: 'Entrenamientos' },
  mision: { nombre: 'Misión',        plural: 'Misiones' },
  minirol:{ nombre: 'Minirol',       plural: 'Miniroles' },
  rol_pj: { nombre: 'Rol de PJ',     plural: 'Roles de PJ' },
  cap:    { nombre: 'Capacitación',  plural: 'Capacitaciones', oculto: true },   // ahora cuenta como Entrenamiento; queda por revisiones viejas
  otro:   { nombre: 'Otra actividad', plural: 'Otras' },
};
// Revisiones guardadas antes (un solo tipo para todos los informes)
const REVISIONES_ASCENSO = {
  soldados: { titulo: 'Soldados', grupos: ['soldados'] },
  tropa:    { titulo: 'Soldados y Cabos', grupos: ['soldados', 'cabos'] },
};
const CLAVE_ASCENSOS = 'bd21_ascensos_v2';
const normNombreAsc = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const RE_DISCORD = /^https:\/\/([a-z]+\.)?(discord\.com|discordapp\.com)\/channels\/\S+$/i;
const rangosDeGrupos = grupos => new Set(grupos.flatMap(g => GRUPOS_ASCENSO[g]?.rangos() || []).map(normRango));
const gruposDeInforme = (inf, revision) => inf.cuenta?.length ? inf.cuenta : (REVISIONES_ASCENSO[revision]?.grupos || ['soldados']);
const textoGrupos = g => g.map(x => GRUPOS_ASCENSO[x]?.titulo).filter(Boolean).join(' y ');

// Letras "de fantasía" (🅿🅰🆁…, Ⓟ, 𝐏, ＰＡＲ…) → letras comunes, sin tildes
function letrasPlanasAsc(t) {
  let out = '';
  for (const ch of String(t || '')) {
    const c = ch.codePointAt(0);
    if (c >= 0x1F130 && c <= 0x1F149) out += String.fromCharCode(65 + c - 0x1F130);       // 🄰 cuadradas
    else if (c >= 0x1F150 && c <= 0x1F169) out += String.fromCharCode(65 + c - 0x1F150);  // 🅐 círculo negro
    else if (c >= 0x1F170 && c <= 0x1F189) out += String.fromCharCode(65 + c - 0x1F170);  // 🅰 cuadrado negro
    else if (c >= 0x1F1E6 && c <= 0x1F1FF) out += String.fromCharCode(65 + c - 0x1F1E6);  // 🇦 indicadores regionales
    else out += ch;
  }
  return out.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}
// Segunda parte de un rango escrito separado: "SGT 2", "CBO 1°", "SGT MYR", "CBO Mayor", "CMD B"
function sufijoRangoAsc(t) {
  const x = letrasPlanasAsc(t).toUpperCase().replace(/[°º.\[\]()]/g, '');
  if (/^(M|MY|MYR|MAY|MAYOR)$/.test(x)) return 'M';
  if (/^(1|1RO|1ERO|1ER|1RA|PRIMERO)$/.test(x)) return '1';
  if (/^(2|2DO|2DA|SEGUNDO)$/.test(x)) return '2';
  if (x === 'B') return 'B';
  return null;
}
const tokenRangoAsc = t => letrasPlanasAsc(t).toUpperCase().replace(/[°º.\[\]()<>]/g, '');
// Rango al principio de una lista de palabras → { grado, usadas } (o null)
function rangoInicialAsc(partes, rangos) {
  if (!partes.length) return null;
  const base = tokenRangoAsc(partes[0]);
  if (partes.length > 1) {
    const suf = sufijoRangoAsc(partes[1]);
    const dos = suf && rangos.find(x => x.n === base + suf);
    if (dos) return { grado: dos.r, usadas: 2 };
  }
  const uno = rangos.find(x => x.n === base);
  return uno ? { grado: uno.r, usadas: 1 } : null;
}
// Saca el rol escrito al final de un texto libre ("Taitus - Lider", "Isagi Sub lider")
function separarRolFinalAsc(t) {
  let base = t, rol = '';
  const g = /\s[-–—:|]\s(.*)$/.exec(base); if (g) { rol += ' ' + g[1]; base = base.slice(0, g.index); }
  const fin = RE_ROL_ASC.exec(base); if (fin) { rol += ' ' + fin[0]; base = base.slice(0, fin.index); }
  return { base, rol };
}
const limpiarNombreAsc = t => String(t || '').replace(/[<>\[\]]/g, ' ').replace(/^[\s\-–—:|.,*_~]+|[\s\-–—:|.,*_~]+$/g, '').replace(/\s+/g, ' ').trim();

// Lee un renglón de participante. Acepta, entre otros:
//   <SDO2 Taitus> (Lider)    SGT MYR Mordecai    CBO 1° Elen    [CBO1] <Isagi> Sub lider    [SDO] Clover - 2do al mando
function leerRenglonAscenso(l, rangos) {
  let s = String(l || '').replace(/^[\s•·*>\-–—]+/, '').trim();
  let rolTxt = [...s.matchAll(/\(([^)]*)\)/g)].map(m => m[1]).join(' ');
  s = s.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  let grado = null, nombre = '', m;
  if ((m = /^\[([^\]]+)\]\s*<([^>]+)>(.*)$/.exec(s))) {            // [SGT2] <Khos Varen> rol
    const r = rangoInicialAsc(m[1].trim().split(/\s+/), rangos); grado = r?.grado; nombre = m[2]; rolTxt += ' ' + m[3];
  } else if ((m = /^\[([^\]]+)\]\s*(.*)$/.exec(s))) {             // [SDO] Clover rol
    const r = rangoInicialAsc(m[1].trim().split(/\s+/), rangos); grado = r?.grado;
    const x = separarRolFinalAsc(m[2]); nombre = x.base; rolTxt += x.rol;
  } else {
    let cuerpo = s;
    const ang = /^<([^>]+)>(.*)$/.exec(s);                           // <SDO2 Taitus> rol
    if (ang) { cuerpo = ang[1]; rolTxt += ' ' + ang[2]; }
    else { const x = separarRolFinalAsc(s); cuerpo = x.base; rolTxt += x.rol; }   // SGT MYR Mordecai rol
    const partes = cuerpo.replace(/[<>]/g, ' ').trim().split(/\s+/);
    const r = rangoInicialAsc(partes, rangos);
    if (r) { grado = r.grado; nombre = partes.slice(r.usadas).join(' '); }
  }
  nombre = limpiarNombreAsc(nombre);
  if (!grado || !nombre) return null;
  return { grado, nombre, rol: rolAscenso(rolTxt) };
}
// "Sub-Lider", "Segundo al mando", "2do al mando" → sub · "Lider", "Primero al mando", "1ero al mando" → lider
const sinTildesAsc = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const RE_SUB_ASC = /sub\s*-?\s*lider|co\s*-?\s*lider|segundo\s+al\s+mando|2\s*(do|da|°|º|o)?\s+al\s+mando/;
const RE_LIDER_ASC = /lider|leader|primero\s+al\s+mando|1\s*(ero|ro|er|°|º|o)?\s+al\s+mando/;
const RE_ROL_ASC = /\s(sub\s*-?\s*l[ií]der|l[ií]der|(primero|segundo|1\s*(ero|ro|er|°|º)?|2\s*(do|°|º)?)\s+al\s+mando)\s*$/i;
function rolAscenso(t) {
  const s = sinTildesAsc(t);
  return RE_SUB_ASC.test(s) ? 'sub' : RE_LIDER_ASC.test(s) ? 'lider' : '';
}

// Tipo de actividad según un texto (el título del informe)
// Entrenamiento: "Entrenamiento", "Ent", "Cap", "Capa", "Capacitación"
// Rol de PJ: "RolPJ", "Rol de PJ", "Operativo" · Misión: "Misión", "Ataque" (Anaxes, SV1/SV2…) · Minirol
// Si aparece más de una palabra, gana la que está primero en el texto.
const PALABRAS_TIPO_ASC = [
  ['minirol', /MINI\s*-?\s*ROL/],
  ['rol_pj',  /\bROL(ES)?\s*(DE\s*)?PJ\b|\bOPERATIVOS?\b/],
  ['mision',  /\bMISION(ES)?\b|\bATAQUES?\b/],
  ['ent',     /\bENTRENAMIENTOS?\b|\bENTS?\b|\bCAPA?S?\b|\bCAPACITACION(ES)?\b/],
];
function tipoInformeAscenso(t) {
  const s = sinTildesAsc(t).toUpperCase();
  let mejor = '', pos = Infinity;
  for (const [tipo, re] of PALABRAS_TIPO_ASC) { const m = re.exec(s); if (m && m.index < pos) { pos = m.index; mejor = tipo; } }
  return mejor;
}

// Lee el mensaje completo de un informe (o solo la lista de participantes).
// Devuelve { titulo, tipo, link, lineas: [{ grado, nombre, rol }], noLeidas: [texto] }.
function leerInformeAscenso(texto) {
  const rangos = RANGOS_LEGION.map(r => ({ r, n: normRango(r) }));
  const todas = String(texto || '').split(/\r?\n/).map(x => x.trim());
  // Título: el primer renglón dentro del primer bloque de código (```prolog ...```); si no hay, el primer renglón con texto
  let titulo = '';
  for (let i = 0; i < todas.length; i++) {
    if (/^```/.test(todas[i])) {
      const resto = todas[i].replace(/^```\w*\s*/, '').replace(/```$/, '').trim();
      if (resto) { titulo = resto; break; }
      const sig = todas.slice(i + 1).find(x => x && !/^```/.test(x));
      if (sig) { titulo = sig.replace(/```$/, '').trim(); break; }
    }
  }
  if (!titulo) titulo = todas.find(x => x && !/^</.test(x) && !/^(#|\*\*|[-+]|━)/.test(x)) || '';
  titulo = titulo.replace(/[*_`#]/g, '').trim();

  // Participantes: lo que viene después de "PARTICIPANTES" hasta que cierra el bloque; si no hay ese título,
  // los renglones que empiezan con "<"; si tampoco, todos los renglones (una lista pegada sola).
  // El título "PARTICIPANTES" puede venir decorado (━━ PARTICIPANTES ━━, 🅿🅰🆁🆃🅸🅲🅸🅿🅰🅽🆃🅴🆂, etc.)
  let candidatas;
  const iPart = todas.findIndex(x => /PARTICIPANTES/i.test(letrasPlanasAsc(x)));
  const pareceLista = x => /^(<[^@#:!]|\[)/.test(x);
  if (iPart >= 0) {
    candidatas = [];
    for (const x of todas.slice(iPart + 1)) {
      if (/^```/.test(x)) break;
      // otra sección decorada después de la lista (━━ OBSERVACIONES ━━, ## ..., **...**)
      if (candidatas.some(Boolean) && /^(#{1,3}\s|\*\*|━|═|─{3}|-{3})/.test(x) && !leerRenglonAscenso(x, rangos)) break;
      candidatas.push(x);
    }
  } else candidatas = todas;   // sin título: se prueban todos los renglones; solo avisa de los que parecen de la lista
  const lineas = [], noLeidas = [], usadas = new Set();
  for (const l of candidatas) {
    if (!l || /^<[@#:!]/.test(l)) continue;           // menciones de Discord (<@...>, <#...>)
    if (!/[\p{L}\p{N}]/u.test(letrasPlanasAsc(l))) continue;  // renglones solo decorativos (━━━, emojis)
    const r = leerRenglonAscenso(l, rangos);
    if (r) { lineas.push(r); usadas.add(l); }
    else if (iPart >= 0 || pareceLista(l)) noLeidas.push(l);
  }
  // Tipo: primero por el título; si no lo dice, por el resto del texto (sin los participantes ni los links)
  let tipo = tipoInformeAscenso(titulo), tipoPor = tipo ? 'titulo' : '';
  if (!tipo) {
    const resto = todas.filter(x => !usadas.has(x) && (iPart < 0 || !candidatas.includes(x))).join('\n').replace(/https?:\/\/\S+/g, ' ');
    tipo = tipoInformeAscenso(resto); if (tipo) tipoPor = 'texto';
  }
  return { titulo, tipo, tipoPor, lineas, noLeidas };
}

// Recuento por persona. Cada persona: { k, nombre, grado, por: {tipo: n}, actividades, lider, sub, informes: [índices] }
function recontarAscenso(informes, revision) {
  const personas = new Map();
  informes.forEach((inf, i) => {
    const rangos = rangosDeGrupos(gruposDeInforme(inf, revision));
    const tipo = inf.tipo || 'otro';
    for (const l of leerInformeAscenso(inf.texto).lineas) {
      if (!rangos.has(normRango(l.grado))) continue;
      const k = normNombreAsc(l.nombre);
      if (!personas.has(k)) personas.set(k, { k: Math.random().toString(36).slice(2, 9), nombre: l.nombre, grado: l.grado, por: {}, actividades: 0, lider: 0, sub: 0, informes: [] });
      const p = personas.get(k);
      p.grado = l.grado;
      if (!p.informes.includes(i)) { p.informes.push(i); p.por[tipo] = (p.por[tipo] || 0) + 1; p.actividades++; }
      if (l.rol === 'lider') p.lider++;
      if (l.rol === 'sub') p.sub++;
    }
  });
  return [...personas.values()];
}
// Personas de revisiones viejas (sin desglose por tipo)
function normalizarPersonaAsc(p) {
  p.k = p.k || Math.random().toString(36).slice(2, 9);
  p.informes = p.informes || [];
  if (!p.por) p.por = { otro: +p.actividades || 0 };
  p.actividades = Object.values(p.por).reduce((s, n) => s + (+n || 0), 0);
  return p;
}
const tiposUsadosAsc = personas => Object.keys(TIPOS_INFORME_ASC).filter(t => personas.some(p => +p.por?.[t]));

// Distancia de edición (para sugerir nombres parecidos)
function distanciaNombres(a, b) {
  if (Math.abs(a.length - b.length) > 3) return 9;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
function posiblesDuplicados(personas, descartados) {
  const res = [];
  for (let i = 0; i < personas.length; i++) for (let j = i + 1; j < personas.length; j++) {
    const a = normNombreAsc(personas[i].nombre), b = normNombreAsc(personas[j].nombre);
    if (!a || !b || descartados.has([personas[i].k, personas[j].k].sort().join('|'))) continue;
    const sa = a.replace(/[^a-z0-9]/g, ''), sb = b.replace(/[^a-z0-9]/g, '');
    const corto = sa.length <= sb.length ? sa : sb, largo = sa.length <= sb.length ? sb : sa;
    const parecido = sa === sb
      || (corto.length >= 3 && (largo.startsWith(corto) || a.split(' ').includes(b) || b.split(' ').includes(a)))
      || (Math.min(sa.length, sb.length) >= 3 && distanciaNombres(sa, sb) <= (Math.min(sa.length, sb.length) >= 7 ? 2 : 1));
    if (parecido) res.push([personas[i], personas[j]]);
  }
  return res;
}

async function vistaAscensos(cont) {
  const idRev = +(estado.params?.get('id') || 0);
  const [miembros, perfiles] = await Promise.all([api.listarPersonas().catch(() => []), api.listarPerfiles().catch(() => [])]);
  const porNombre = new Map(miembros.map(m => [normNombreAsc(m.nombre), m]));
  const autor = uid => {
    const p = perfiles.find(x => x.id === uid); if (!p) return '—';
    const m = miembros.find(x => x.id === p.miembro_id);
    return m ? `${m.grado} ${m.nombre}` : p.nombre;
  };
  const fechaHora = f => f ? new Date(f).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '';
  if (idRev) return detalleRevisionAscenso(cont, idRev, { porNombre, autor, fechaHora });

  const pestana = estado.params?.get('ver') || 'nueva';
  const revisiones = await api.listarRevisionesAscenso();
  const sinVerificar = revisiones.filter(r => r.estado === 'borrador'), verificadas = revisiones.filter(r => r.estado === 'verificada');
  cont.innerHTML = `
    <div class="pestanas-vista">
      <a href="#/ascensos" class="${pestana === 'nueva' ? 'activa' : ''}">Nueva revisión</a>
      <a href="#/ascensos?ver=pendientes" class="${pestana === 'pendientes' ? 'activa' : ''}">Sin verificar <span class="etiqueta">${sinVerificar.length}</span></a>
      <a href="#/ascensos?ver=historial" class="${pestana === 'historial' ? 'activa' : ''}">Historial de ascensos <span class="etiqueta">${verificadas.length}</span></a>
    </div>
    <div id="asc-cuerpo"></div>`;
  estado.limpiezas.push(api.suscribir('ascensos_revisiones', () => { if (pestana !== 'nueva' && $('#modal-fondo').hidden) navegar(); }));

  if (pestana !== 'nueva') {
    const lista = pestana === 'pendientes' ? sinVerificar : verificadas;
    $('#asc-cuerpo').innerHTML = lista.length ? `<div class="envoltorio-tabla"><table class="datos tabla-vista asc-revisiones"><thead><tr>
        <th data-ancho-min="180" data-sin-cortar>Revisión</th><th>Cuenta a</th><th class="num">Personas</th><th class="num">Informes</th>
        <th data-ancho-min="140">Cargada por</th><th>Guardada</th>${pestana === 'historial' ? '<th data-ancho-min="140">Verificada por</th><th>Verificada</th>' : '<th>Última edición</th>'}
      </tr></thead><tbody>${lista.map(r => `<tr class="fila-link" data-ir="${r.id}">
        <td class="v-nombre"><a href="#/ascensos?id=${r.id}">${esc(r.titulo || `Revisión #${r.id}`)}</a></td>
        <td>${esc(REVISIONES_ASCENSO[r.revision]?.titulo || r.revision)}</td>
        <td class="num">${(r.resultado || []).length}</td><td class="num">${(r.informes || []).length}</td>
        <td>${esc(autor(r.creado_por))}</td><td class="tenue">${fechaHora(r.creado_en)}</td>
        ${pestana === 'historial' ? `<td>${esc(autor(r.verificado_por))}</td><td class="tenue">${fechaHora(r.verificado_en)}</td>` : `<td class="tenue">${haceCuanto(r.actualizado_en)}</td>`}
      </tr>`).join('')}</tbody></table></div>`
      : `<div class="vacio">${pestana === 'pendientes' ? 'No hay revisiones esperando verificación.' : 'Todavía no hay revisiones verificadas.'}</div>`;
    $('#asc-cuerpo').onclick = ev => { const tr = ev.target.closest('[data-ir]'); if (tr && !ev.target.closest('a')) location.hash = `#/ascensos?id=${tr.dataset.ir}`; };
    return;
  }

  /* ---------- Nueva revisión: cargar informes */
  // cuenta = qué se contabiliza en el próximo informe (queda marcado hasta que se cambie)
  let datos = { cuenta: ['soldados'], informes: [] };
  try { const g = JSON.parse(localStorage.getItem(CLAVE_ASCENSOS)); if (g && Array.isArray(g.informes)) datos = { ...datos, ...g }; } catch {}
  const guardarLocal = () => { try { localStorage.setItem(CLAVE_ASCENSOS, JSON.stringify(datos)); } catch {} };
  let orden = { id: 'actividades', dir: -1 };

  $('#asc-cuerpo').innerHTML = `
    <div class="ascensos">
      <section class="tarjeta asc-carga">
        <h3>Cargar informe</h3>
        <p class="tenue" style="margin:2px 0 14px">Copiá y pegá el mensaje del informe tal cual está en Discord: la web saca el título, el tipo de actividad y los participantes. Repetí con cada informe y al final guardá la revisión.</p>
        <div class="campo"><span>Contabilizar de este informe</span>
          <div class="asc-cuenta">${Object.entries(GRUPOS_ASCENSO).map(([k, g]) => `
            <label class="asc-check"><input type="checkbox" name="cuenta" value="${k}" ${datos.cuenta.includes(k) ? 'checked' : ''}>
              <span><strong>${esc(g.titulo)}</strong><small>${esc(g.rangos().join(', '))}</small></span></label>`).join('')}
            <small class="tenue">Queda marcado para los próximos informes hasta que lo cambies. Sargento en adelante nunca cuenta.</small></div>
        </div>
        <label class="campo"><span>Link del informe en Discord</span>
          <input id="asc-link" type="url" class="mono" placeholder="https://discord.com/channels/…">
          <small class="ayuda-campo">El link de este mismo informe: clic derecho en el mensaje → Copiar enlace del mensaje.</small></label>
        <label class="campo"><span>Mensaje del informe</span>
          <textarea id="asc-texto" class="mono" spellcheck="false" placeholder="Pegá acá el mensaje completo del informe (o solo la lista de participantes)"></textarea></label>
        <div class="asc-previa" id="asc-previa"></div>
        <div class="asc-botones">
          <button class="btn primario" id="asc-agregar">+ Agregar informe</button>
          <span class="tenue" style="font-size:12.5px">Participantes: un rango y un nombre por renglón. "Líder / 1ero al mando" o "Sub-Líder / 2do al mando" marcan el rol (no suman actividades, suman liderazgos).</span>
        </div>
      </section>
      <section class="tarjeta">
        <div class="asc-cab"><h3>Informes cargados <span class="etiqueta" id="asc-n">0</span></h3>
          <button class="btn chico peligro" id="asc-vaciar">Vaciar todo</button></div>
        <div id="asc-informes"></div>
      </section>
      <section id="asc-resultado"></section>
    </div>`;

  const marcados = () => $$('input[name=cuenta]:checked', cont).map(x => x.value);
  const opcionesTipo = sel => Object.entries(TIPOS_INFORME_ASC).filter(([k, t]) => !t.oculto || k === sel).map(([k, t]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${esc(t.nombre)}</option>`).join('');
  let tipoManual = '';   // tipo elegido a mano en la vista previa (si el título no lo dice)
  function previa() {
    const t = $('#asc-texto').value;
    if (!t.trim()) { $('#asc-previa').innerHTML = ''; return; }
    const inf = leerInformeAscenso(t), rangos = rangosDeGrupos(marcados());
    const si = inf.lineas.filter(l => rangos.has(normRango(l.grado))), no = inf.lineas.filter(l => !rangos.has(normRango(l.grado)));
    const lid = si.filter(l => l.rol === 'lider'), sub = si.filter(l => l.rol === 'sub');
    const tipo = tipoManual || inf.tipo;
    $('#asc-previa').innerHTML = `
      <div class="asc-previa-cab"><span class="dato-etiqueta">Título</span> <strong>${esc(inf.titulo || '—')}</strong></div>
      <div class="asc-previa-cab"><span class="dato-etiqueta">Tipo</span>
        <select class="entrada mini" id="asc-tipo" style="width:auto">${tipo ? '' : '<option value="">— Elegí el tipo —</option>'}${opcionesTipo(tipo)}</select>
        ${inf.tipo ? `<span class="tenue">(detectado por el ${inf.tipoPor === 'titulo' ? 'título' : 'texto del informe'})</span>` : '<span class="asc-error">No se pudo saber por el texto: elegilo</span>'}</div>
      <div><strong>${si.length}</strong> cuentan${lid.length ? ` · líder: ${esc(lid.map(l => l.nombre).join(', '))}` : ''}${sub.length ? ` · sublíder: ${esc(sub.map(l => l.nombre).join(', '))}` : ''}
        ${si.length ? `<span class="tenue">(${esc(si.map(l => `${l.grado} ${l.nombre}`).join(', '))})</span>` : ''}</div>
      ${no.length ? `<div class="tenue">${no.length} no cuentan por rango: ${esc(no.map(l => `${l.grado} ${l.nombre}`).join(', '))}</div>` : ''}
      ${inf.noLeidas.length ? `<div class="asc-error">${inf.noLeidas.length} renglón${inf.noLeidas.length === 1 ? '' : 'es'} de participantes sin rango reconocible: ${esc(inf.noLeidas.join(' · '))}</div>` : ''}`;
    $('#asc-tipo').onchange = ev => { tipoManual = ev.target.value; };
  }
  function pintarInformes() {
    $('#asc-n').textContent = datos.informes.length;
    $('#asc-vaciar').hidden = !datos.informes.length;
    $('#asc-informes').innerHTML = datos.informes.length ? `<ol class="asc-lista">${datos.informes.map((inf, i) => {
      const { lineas, noLeidas } = leerInformeAscenso(inf.texto), rangos = rangosDeGrupos(inf.cuenta);
      const si = lineas.filter(l => rangos.has(normRango(l.grado))), lid = si.find(l => l.rol === 'lider'), sub = si.filter(l => l.rol === 'sub');
      return `<li data-i="${i}"><div class="asc-inf">
          <strong>${esc(inf.titulo || `Informe ${i + 1}`)}</strong>
          <span class="tenue">${si.length} cuentan de ${lineas.length}${lid ? ` · líder ${esc(lid.nombre)}` : ''}${sub.length ? ` · sublíder ${esc(sub.map(l => l.nombre).join(', '))}` : ''}${noLeidas.length ? ` · <span class="asc-error">${noLeidas.length} sin leer</span>` : ''}
            · <a href="${esc(inf.link)}" target="_blank" rel="noopener noreferrer">Informe ↗</a></span>
          <span class="asc-inf-opciones">
            <select class="entrada mini" data-tipo-inf style="width:auto">${opcionesTipo(inf.tipo)}</select>
            ${Object.entries(GRUPOS_ASCENSO).map(([k, g]) => `<label class="asc-check-mini"><input type="checkbox" data-cuenta-inf="${k}" ${inf.cuenta.includes(k) ? 'checked' : ''}> ${esc(g.titulo)}</label>`).join('')}
          </span></div>
        <button class="btn-link" data-ver="${i}">Ver</button><button class="btn-link peligro" data-quitar="${i}">Quitar</button></li>`;
    }).join('')}</ol>` : '<div class="vacio-chico">Todavía no agregaste informes.</div>';
  }
  function pintarResultado() {
    if (!datos.informes.length) { $('#asc-resultado').innerHTML = ''; return; }
    const lista = recontarAscenso(datos.informes);
    ordenarPersonasAsc(lista, orden);
    const grupos = [...new Set(datos.informes.flatMap(x => x.cuenta))];
    const tituloDef = `Revisión ${textoGrupos(Object.keys(GRUPOS_ASCENSO).filter(g => grupos.includes(g)))} · ${new Date().toLocaleDateString('es-AR')}`;
    $('#asc-resultado').innerHTML = resumenAscenso(lista, datos.informes.length) + `
      <div class="envoltorio-tabla">${tablaAscenso(lista, datos.informes, orden, porNombre)}</div>
      <section class="tarjeta asc-guardar">
        <div><h3>Guardar revisión</h3>
          <p class="tenue">Queda pública como <strong>sin verificar</strong>. Ahí cualquiera puede corregir nombres repetidos o mal escritos antes de verificarla.</p></div>
        <div class="asc-guardar-form">
          <input class="entrada" id="asc-nombre-rev" maxlength="120" value="${esc(datos.tituloRev || tituloDef)}">
          <button class="btn primario" id="asc-guardar">Guardar revisión</button>
        </div>
      </section>`;
    $('#asc-resultado thead').onclick = ev => {
      const t = ev.target.closest('[data-orden]'); if (!t) return;
      orden = siguienteOrdenAsc(orden, t.dataset.orden); pintarResultado();
    };
    $('#asc-nombre-rev').oninput = ev => { datos.tituloRev = ev.target.value; guardarLocal(); };
    $('#asc-guardar').onclick = async ev => {
      if (!lista.length) return aviso('No hay ninguna persona para guardar en esta revisión.', 'error');
      ev.target.disabled = true;
      try {
        const r = await api.crearRevisionAscenso({ titulo: $('#asc-nombre-rev').value.trim() || tituloDef,
          revision: grupos.includes('cabos') ? 'tropa' : 'soldados', informes: datos.informes, resultado: lista });
        datos = { cuenta: datos.cuenta, informes: [] }; guardarLocal();
        aviso('Revisión guardada. Ahora falta verificarla.');
        location.hash = `#/ascensos?id=${r.id}`;
      } catch (e) { fallo(e); ev.target.disabled = false; }
    };
  }
  const todo = () => { pintarInformes(); pintarResultado(); previa(); };
  $('#asc-texto').oninput = () => { tipoManual = ''; previa(); };
  $$('input[name=cuenta]', cont).forEach(c => c.onchange = () => {
    if (!marcados().length) { c.checked = true; return aviso('Marcá al menos Soldados o Cabos.', 'error'); }
    datos.cuenta = marcados(); guardarLocal(); previa();
  });
  $('#asc-agregar').onclick = () => {
    const texto = $('#asc-texto').value.trim(), link = $('#asc-link').value.trim();
    if (!texto) return aviso('Pegá el mensaje del informe.', 'error');
    if (!RE_DISCORD.test(link)) return aviso('Poné el link del mensaje del informe en Discord (https://discord.com/channels/…).', 'error');
    if (datos.informes.some(x => x.link === link)) return aviso('Ese informe ya está cargado (mismo link).', 'error');
    const inf = leerInformeAscenso(texto);
    if (!inf.lineas.length) return aviso('No se encontraron participantes. Tienen que estar como <SDO2 Taitus>, uno por renglón.', 'error');
    const tipo = $('#asc-tipo')?.value || inf.tipo;
    if (!tipo) return aviso('Elegí el tipo de actividad del informe.', 'error');
    const cuenta = marcados();
    datos.informes.push({ titulo: inf.titulo || `Informe ${datos.informes.length + 1}`, link, tipo, cuenta, texto });
    guardarLocal();
    $('#asc-texto').value = ''; $('#asc-link').value = ''; tipoManual = '';
    const rangos = rangosDeGrupos(cuenta), n = inf.lineas.filter(l => rangos.has(normRango(l.grado))).length;
    aviso(`${TIPOS_INFORME_ASC[tipo].nombre} agregado: ${n} participante${n === 1 ? '' : 's'} cuentan.`);
    todo(); $('#asc-texto').focus();
  };
  $('#asc-informes').onclick = ev => {
    const q = ev.target.closest('[data-quitar]'), v = ev.target.closest('[data-ver]');
    if (q) { datos.informes.splice(+q.dataset.quitar, 1); guardarLocal(); todo(); }
    if (v) verInformesAscenso([datos.informes[+v.dataset.ver]]);
  };
  $('#asc-informes').onchange = ev => {
    const li = ev.target.closest('[data-i]'); if (!li) return;
    const inf = datos.informes[+li.dataset.i];
    if (ev.target.dataset.tipoInf !== undefined) inf.tipo = ev.target.value;
    if (ev.target.dataset.cuentaInf) {
      const k = ev.target.dataset.cuentaInf;
      const nueva = ev.target.checked ? [...new Set([...inf.cuenta, k])] : inf.cuenta.filter(x => x !== k);
      if (!nueva.length) { ev.target.checked = true; return aviso('Cada informe tiene que contar al menos Soldados o Cabos.', 'error'); }
      inf.cuenta = Object.keys(GRUPOS_ASCENSO).filter(g => nueva.includes(g));
    }
    guardarLocal(); pintarInformes(); pintarResultado();
  };
  $('#asc-vaciar').onclick = async () => {
    if (!await confirmar('Vaciar informes', `¿Quitar los ${datos.informes.length} informes cargados? El recuento se borra.`, 'Vaciar')) return;
    datos = { cuenta: datos.cuenta, informes: [] }; guardarLocal(); todo();
  };
  todo();
}

/* ---------- piezas compartidas */
function ordenarPersonasAsc(lista, orden) {
  const val = (p, id) => id === 'nombre' ? normNombreAsc(p.nombre) : id === 'grado' ? RANGOS_NORM.indexOf(normRango(p.grado))
    : id.startsWith('t_') ? +p.por?.[id.slice(2)] || 0 : +p[id] || 0;
  return lista.sort((a, b) => { const x = val(a, orden.id), y = val(b, orden.id); return ((x > y) - (x < y)) * orden.dir || normNombreAsc(a.nombre).localeCompare(normNombreAsc(b.nombre)); });
}
const siguienteOrdenAsc = (orden, id) => orden.id !== id ? { id, dir: ['nombre', 'grado'].includes(id) ? 1 : -1 } : { id, dir: -orden.dir };
function resumenAscenso(lista, nInformes) {
  const tot = k => lista.reduce((s, p) => s + (+p[k] || 0), 0);
  const t = (n, txt) => `<div class="tarjeta resumen-vista"><div class="dato-grande">${n}</div><div class="dato-etiqueta">${txt}</div></div>`;
  return `<div class="rejilla resumen-hoja">${t(nInformes, 'Informes')}${t(lista.length, 'Personas')}
    ${t(tot('actividades'), 'Actividades')}${t(tot('lider'), 'Liderazgos')}${t(tot('sub'), 'Subliderazgos')}</div>`;
}
function tablaAscenso(lista, informes, orden, porNombre) {
  const tipos = tiposUsadosAsc(lista);
  const th = (id, t, num) => `<th class="${num ? 'num' : ''} ${orden?.id === id ? 'ordenada' : ''}" data-orden="${id}" ${id === 'nombre' ? 'data-ancho-min="150" data-sin-cortar' : ''}>${t}${orden?.id === id ? (orden.dir > 0 ? ' ▲' : ' ▼') : ''}</th>`;
  const n = v => `<td class="num ${+v ? '' : 'cero'}">${+v || '–'}</td>`;
  return `<table class="datos tabla-vista"><thead><tr>${th('grado', 'Rango')}${th('nombre', 'Nombre')}
      ${tipos.map(t => th('t_' + t, TIPOS_INFORME_ASC[t].plural, 1)).join('')}
      ${th('actividades', 'Total actividades', 1)}${th('lider', 'Liderazgos', 1)}${th('sub', 'Subliderazgos', 1)}<th>En los informes</th></tr></thead>
    <tbody>${lista.length ? lista.map(p => {
      const m = porNombre.get(normNombreAsc(p.nombre));
      return `<tr><td class="tenue">${esc(p.grado)}</td>
        <td class="v-nombre">${m ? `<a class="link-perfil" href="#/perfil?id=${m.id}">${esc(p.nombre)}</a>` : esc(p.nombre)}</td>
        ${tipos.map(t => n(p.por?.[t])).join('')}
        <td class="num"><b>${+p.actividades || 0}</b></td>${n(p.lider)}${n(p.sub)}
        <td class="v-texto">${esc((p.informes || []).map(i => informes[i]?.titulo || `Informe ${i + 1}`).join(', '))}</td></tr>`;
    }).join('') : `<tr><td colspan="${6 + tipos.length}" class="vacio-chico">Ningún participante entra en esta revisión.</td></tr>`}</tbody></table>`;
}
function verInformesAscenso(informes) {
  abrirModal(informes.length === 1 ? (informes[0].titulo || 'Informe') : `Informes (${informes.length})`,
    informes.map(inf => `${informes.length > 1 ? `<h4 style="margin:12px 0 6px">${esc(inf.titulo || 'Informe')}</h4>` : ''}
      ${inf.tipo || inf.cuenta || inf.link ? `<p class="tenue" style="margin:0 0 6px;font-size:13px">${esc(TIPOS_INFORME_ASC[inf.tipo]?.nombre || '')}${inf.cuenta ? ` · cuenta ${esc(textoGrupos(inf.cuenta))}` : ''}${inf.link ? ` · <a href="${esc(inf.link)}" target="_blank" rel="noopener noreferrer">Abrir en Discord ↗</a>` : ''}</p>` : ''}
      <pre class="asc-pre">${esc(inf.texto)}</pre>`).join('')
    + '<div class="modal-pie"><button class="btn primario" data-cerrar>Cerrar</button></div>', c => { $('[data-cerrar]', c).onclick = cerrarModal; });
}

/* ---------- Detalle de una revisión guardada: verificar (corregir) o ver la verificada */
async function detalleRevisionAscenso(cont, id, { porNombre, autor, fechaHora }) {
  let rev = await api.obtenerRevisionAscenso(id);
  if (!rev) { cont.innerHTML = '<div class="vacio">Esa revisión no existe o fue borrada. <br><br><a class="btn" href="#/ascensos?ver=pendientes">Volver</a></div>'; return; }
  let personas = JSON.parse(JSON.stringify(rev.resultado || [])).map(normalizarPersonaAsc);
  let cambios = false, orden = { id: 'actividades', dir: -1 }, otroGuardo = false;
  const descartados = new Set(), seleccion = new Set();
  const borrador = rev.estado === 'borrador';
  const puedeBorrar = esAdmin() || (borrador && rev.creado_por === estado.perfil.id);
  const rangosRev = [...CATEGORIA_POR_RANGO.soldados, ...CATEGORIA_POR_RANGO.cabos];
  // Tipo de cada informe (para saber de qué tipo es cada participación al juntar)
  const tipoInf = i => rev.informes?.[i]?.tipo || 'otro';
  const tiposVisibles = () => [...new Set([...tiposUsadosAsc(personas), ...(rev.informes || []).map(x => x.tipo).filter(Boolean)])]
    .filter(t => TIPOS_INFORME_ASC[t]).sort((a, b) => Object.keys(TIPOS_INFORME_ASC).indexOf(a) - Object.keys(TIPOS_INFORME_ASC).indexOf(b));
  const recalcularTotal = p => { p.actividades = Object.values(p.por).reduce((s, n) => s + (+n || 0), 0); };

  function marcarCambios() { cambios = true; $('#asc-estado-cambios').textContent = 'Cambios sin guardar'; $('#asc-guardar-cambios').disabled = false; }

  function pintar() {
    ordenarPersonasAsc(personas, orden);
    const grupos = [...new Set((rev.informes || []).flatMap(x => gruposDeInforme(x, rev.revision)))];
    const cab = `
      <a class="btn-link" href="#/ascensos?ver=${borrador ? 'pendientes' : 'historial'}">← ${borrador ? 'Sin verificar' : 'Historial de ascensos'}</a>
      <section class="tarjeta asc-cabecera ${borrador ? '' : 'captura'}" id="asc-captura">
        <div class="asc-cab-titulo">
          <div><h2>${esc(rev.titulo || `Revisión #${rev.id}`)}</h2>
            <div class="tenue">Cuenta ${esc(textoGrupos(Object.keys(GRUPOS_ASCENSO).filter(g => grupos.includes(g))))} · ${(rev.informes || []).length} informes · cargada por ${esc(autor(rev.creado_por))} el ${fechaHora(rev.creado_en)}
            ${borrador ? '' : `<br>Verificada por <strong>${esc(autor(rev.verificado_por))}</strong> el ${fechaHora(rev.verificado_en)}`}</div></div>
          <span class="pastilla ${borrador ? 'medio' : 'ok'}">${borrador ? 'Sin verificar' : '✓ Verificada'}</span>
        </div>
        ${resumenAscenso(personas, (rev.informes || []).length)}
        ${borrador ? '' : `<div class="envoltorio-tabla">${tablaAscenso(personas, rev.informes || [], orden, porNombre)}</div>`}
      </section>`;
    if (!borrador) {
      cont.innerHTML = cab + `<div class="asc-acciones">
          <button class="btn" id="asc-ver-informes">Ver informes originales</button>
          <button class="btn" id="asc-copiar">Copiar como texto</button>
          ${esAdmin() ? '<button class="btn" id="asc-desverificar">Volver a sin verificar</button>' : ''}
          ${puedeBorrar ? '<button class="btn peligro" id="asc-borrar">Borrar revisión</button>' : ''}
        </div><p class="ayuda">Lista para sacarle una captura y mandarla por Discord.</p>`;
      eventosComunes();
      $('#asc-captura thead').onclick = ev => { const t = ev.target.closest('[data-orden]'); if (t) { orden = siguienteOrdenAsc(orden, t.dataset.orden); pintar(); } };
      const des = $('#asc-desverificar');
      if (des) des.onclick = async () => {
        if (!await confirmar('Volver a sin verificar', 'La revisión vuelve a "sin verificar" y se puede corregir de nuevo.', 'Continuar')) return;
        try { rev = await api.guardarRevisionAscenso(rev.id, { estado: 'borrador' }, rev.actualizado_en); navegar(); } catch (e) { fallo(e); }
      };
      return;
    }

    const tipos = tiposVisibles();
    const dups = posiblesDuplicados(personas, descartados);
    const nombresRepetidos = new Set(), vistos = new Set();
    personas.forEach(p => { const n = normNombreAsc(p.nombre); if (vistos.has(n)) nombresRepetidos.add(n); vistos.add(n); });
    const thO = (id, t, extra = '') => `<th ${extra} data-orden="${id}">${t}${orden.id === id ? (orden.dir > 0 ? ' ▲' : ' ▼') : ''}</th>`;
    cont.innerHTML = cab + `
      ${otroGuardo ? '<div class="aviso-cambio">Otra persona guardó cambios en esta revisión. <button class="btn chico" id="asc-recargar">Recargar</button></div>' : ''}
      <section class="tarjeta asc-verificar">
        <h3>Verificación</h3>
        <p class="tenue" style="margin:2px 0 12px">Revisá que no haya nombres repetidos o mal escritos, gente con dos nombres (juntalos) o nombres de más (borralos). Podés editar cualquier dato. Cuando esté todo bien, tocá <strong>Verificar y guardar</strong>.</p>
        ${dups.length ? `<div class="asc-dups"><strong>Posibles duplicados (${dups.length})</strong>
          ${dups.slice(0, 12).map(([a, b]) => `<div class="asc-dup">
            <span>¿<b>${esc(a.grado)} ${esc(a.nombre)}</b> <span class="tenue">(${a.actividades})</span> y <b>${esc(b.grado)} ${esc(b.nombre)}</b> <span class="tenue">(${b.actividades})</span> son la misma persona?</span>
            <button class="btn chico" data-juntar="${a.k},${b.k}">Juntar</button><button class="btn-link" data-descartar="${a.k},${b.k}">No</button></div>`).join('')}</div>`
          : '<div class="tenue asc-sin-dups">✓ No se encontraron nombres parecidos.</div>'}
        <div class="herramientas asc-herr">
          <button class="btn chico" id="asc-juntar-sel" disabled>Juntar seleccionados</button>
          <button class="btn chico peligro" id="asc-borrar-sel" disabled>Borrar seleccionados</button>
          <button class="btn chico" id="asc-agregar-p">+ Agregar persona</button>
          <button class="btn chico" id="asc-ver-informes">Ver informes originales</button>
          <span class="espacio"></span>
          <span class="tenue" id="asc-estado-cambios">${cambios ? 'Cambios sin guardar' : ''}</span>
          <button class="btn chico" id="asc-guardar-cambios" ${cambios ? '' : 'disabled'}>Guardar cambios</button>
          <button class="btn primario" id="asc-verificar">✓ Verificar y guardar</button>
        </div>
        <div class="envoltorio-tabla"><table class="datos tabla-vista asc-editable"><thead><tr>
          <th style="width:34px"><input type="checkbox" id="asc-sel-todo" aria-label="Seleccionar todos"></th>
          ${thO('grado', 'Rango')}${thO('nombre', 'Nombre', 'data-ancho-min="190"')}
          ${tipos.map(t => thO('t_' + t, TIPOS_INFORME_ASC[t].plural, 'class="num"')).join('')}
          ${thO('actividades', 'Total', 'class="num"')}${thO('lider', 'Liderazgos', 'class="num"')}${thO('sub', 'Subliderazgos', 'class="num"')}
          <th>En los informes</th><th></th>
        </tr></thead><tbody>${personas.map(p => {
          const m = porNombre.get(normNombreAsc(p.nombre)), rep = nombresRepetidos.has(normNombreAsc(p.nombre));
          const num = (campo, v) => `<td class="num"><input class="entrada mini num" type="number" min="0" data-campo="${campo}" value="${+v || 0}"></td>`;
          return `<tr data-k="${p.k}" class="${seleccion.has(p.k) ? 'seleccionada' : ''}">
            <td><input type="checkbox" data-sel ${seleccion.has(p.k) ? 'checked' : ''} aria-label="Seleccionar"></td>
            <td><select class="entrada mini" data-campo="grado">${[...rangosRev].reverse().map(g => `<option ${g === p.grado ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select></td>
            <td><div class="asc-nombre"><input class="entrada mini ${rep ? 'error' : ''}" data-campo="nombre" value="${esc(p.nombre)}" maxlength="60">
              <span class="asc-miembro ${m ? 'ok' : ''}" title="${m ? `Está en Miembros: ${esc(m.grado)} ${esc(m.nombre)}` : 'No coincide con nadie de Miembros de la legión (revisá cómo está escrito)'}">${m ? '✓' : '?'}</span></div></td>
            ${tipos.map(t => num('t_' + t, p.por[t])).join('')}
            <td class="num"><b data-total>${p.actividades}</b></td>
            ${num('lider', p.lider)}${num('sub', p.sub)}
            <td class="v-texto">${esc(p.informes.map(i => rev.informes?.[i]?.titulo || `Informe ${i + 1}`).join(', ') || '—')}</td>
            <td><button class="btn-link peligro" data-borrar-p="${p.k}" title="Borrar a ${esc(p.nombre)}">Borrar</button></td></tr>`;
        }).join('')}</tbody></table></div>
        <p class="ayuda">✓ = el nombre coincide con alguien de Miembros de la legión · ? = no coincide (puede estar mal escrito). En rojo: nombre repetido, juntalo o corregilo antes de verificar. El total es la suma de las actividades.</p>
      </section>
      <div class="asc-acciones">${puedeBorrar ? '<button class="btn peligro" id="asc-borrar">Borrar revisión</button>' : ''}</div>`;
    eventosComunes();
    eventosEdicion();
  }

  function eventosComunes() {
    $('#asc-ver-informes').onclick = () => verInformesAscenso(rev.informes || []);
    const c = $('#asc-copiar');
    if (c) c.onclick = async () => {
      const txt = `${rev.titulo} (verificada)\n` + ordenarPersonasAsc([...personas], { id: 'actividades', dir: -1 }).map(p => {
        const det = Object.keys(TIPOS_INFORME_ASC).filter(t => +p.por?.[t]).map(t => `${p.por[t]} ${TIPOS_INFORME_ASC[t].plural.toLowerCase()}`).join(', ');
        return `${p.grado} ${p.nombre}: ${p.actividades} actividad${+p.actividades === 1 ? '' : 'es'}${det ? ` (${det})` : ''}${+p.lider ? ` · ${p.lider} liderazgo${+p.lider === 1 ? '' : 's'}` : ''}${+p.sub ? ` · ${p.sub} subliderazgo${+p.sub === 1 ? '' : 's'}` : ''}`;
      }).join('\n');
      try { await navigator.clipboard.writeText(txt); aviso('Copiado.'); } catch { aviso('No se pudo copiar.', 'error'); }
    };
    const b = $('#asc-borrar');
    if (b) b.onclick = async () => {
      if (!await confirmar('Borrar revisión', `¿Borrar "${rev.titulo}"? No se puede deshacer.`, 'Borrar')) return;
      try { await api.borrarRevisionAscenso(rev.id); aviso('Revisión borrada.'); location.hash = '#/ascensos?ver=' + (borrador ? 'pendientes' : 'historial'); } catch (e) { fallo(e); }
    };
  }

  // Juntar varias personas en una: por cada tipo de actividad se cuentan los informes sin repetir (si los dos nombres
  // figuraban en el mismo informe cuenta una vez) más lo agregado a mano; liderazgos y subliderazgos se suman.
  function juntar(ks) {
    const grupo = personas.filter(p => ks.includes(p.k));
    if (grupo.length < 2) return;
    abrirModal('Juntar personas', `
      <p style="margin:0 0 12px">Se van a juntar ${grupo.length} nombres en uno solo. ¿Con qué nombre y rango queda?</p>
      <form id="form-juntar">
        ${grupo.map((p, i) => `<label class="opcion-tarjeta" style="margin-bottom:6px"><input type="radio" name="queda" value="${p.k}" ${i === 0 ? 'checked' : ''}>
          <span><strong>${esc(p.grado)} ${esc(p.nombre)}</strong><small>${p.actividades} actividades · ${p.lider} liderazgos · ${p.sub} subliderazgos</small></span></label>`).join('')}
        <div class="modal-pie"><button type="button" class="btn" data-cancelar>Cancelar</button><button class="btn primario">Juntar</button></div>
      </form>`, c => {
      $('[data-cancelar]', c).onclick = cerrarModal;
      $('#form-juntar', c).onsubmit = ev => {
        ev.preventDefault();
        const queda = grupo.find(p => p.k === ev.target.queda.value);
        const informes = [...new Set(grupo.flatMap(p => p.informes))].sort((a, b) => a - b);
        const por = {};
        for (const t of Object.keys(TIPOS_INFORME_ASC)) {
          const deInformes = informes.filter(i => tipoInf(i) === t).length;
          const aMano = grupo.reduce((s, p) => s + Math.max(0, (+p.por[t] || 0) - p.informes.filter(i => tipoInf(i) === t).length), 0);
          if (deInformes + aMano) por[t] = deInformes + aMano;
        }
        Object.assign(queda, { por, lider: grupo.reduce((s, p) => s + (+p.lider || 0), 0), sub: grupo.reduce((s, p) => s + (+p.sub || 0), 0), informes });
        recalcularTotal(queda);
        personas = personas.filter(p => p === queda || !ks.includes(p.k));
        ks.forEach(k => seleccion.delete(k));
        cerrarModal(); marcarCambios(); pintar();
        aviso(`Juntados en ${queda.grado} ${queda.nombre}: ${queda.actividades} actividades.`);
      };
    });
  }

  function eventosEdicion() {
    const tabla = $('.asc-editable');
    const actualizarSel = () => {
      $('#asc-juntar-sel').disabled = seleccion.size < 2; $('#asc-borrar-sel').disabled = !seleccion.size;
      $('#asc-juntar-sel').textContent = `Juntar seleccionados${seleccion.size > 1 ? ` (${seleccion.size})` : ''}`;
      $('#asc-borrar-sel').textContent = `Borrar seleccionados${seleccion.size ? ` (${seleccion.size})` : ''}`;
    };
    actualizarSel();
    tabla.oninput = ev => {
      const campo = ev.target.dataset.campo; if (!campo) return;
      const tr = ev.target.closest('tr'), p = personas.find(x => x.k === tr.dataset.k);
      const n = Math.max(0, parseInt(ev.target.value, 10) || 0);
      if (campo.startsWith('t_')) { p.por[campo.slice(2)] = n; recalcularTotal(p); $('[data-total]', tr).textContent = p.actividades; }
      else if (['lider', 'sub'].includes(campo)) p[campo] = n;
      else p[campo] = ev.target.value;
      marcarCambios();
    };
    tabla.onchange = ev => {
      if (ev.target.dataset.sel !== undefined) {
        const k = ev.target.closest('tr').dataset.k;
        ev.target.checked ? seleccion.add(k) : seleccion.delete(k);
        ev.target.closest('tr').classList.toggle('seleccionada', ev.target.checked); actualizarSel(); return;
      }
      if (ev.target.dataset.campo === 'nombre') pintar();   // para volver a buscar duplicados y la marca de Miembros
    };
    $('#asc-sel-todo').onchange = ev => { personas.forEach(p => ev.target.checked ? seleccion.add(p.k) : seleccion.delete(p.k)); pintar(); };
    tabla.querySelector('thead').onclick = ev => { const t = ev.target.closest('[data-orden]'); if (t) { orden = siguienteOrdenAsc(orden, t.dataset.orden); pintar(); } };
    tabla.onclick = async ev => {
      const b = ev.target.closest('[data-borrar-p]'); if (!b) return;
      const p = personas.find(x => x.k === b.dataset.borrarP);
      if (!await confirmar('Borrar persona', `¿Sacar a ${p.grado} ${p.nombre} de esta revisión?`, 'Borrar')) return;
      personas = personas.filter(x => x !== p); seleccion.delete(p.k); marcarCambios(); pintar();
    };
    $('.asc-verificar').addEventListener('click', ev => {
      const j = ev.target.closest('[data-juntar]'), d = ev.target.closest('[data-descartar]');
      if (j) juntar(j.dataset.juntar.split(','));
      if (d) { descartados.add(d.dataset.descartar.split(',').sort().join('|')); pintar(); }
    });
    $('#asc-juntar-sel').onclick = () => juntar([...seleccion]);
    $('#asc-borrar-sel').onclick = async () => {
      if (!await confirmar('Borrar personas', `¿Sacar a ${seleccion.size} persona${seleccion.size === 1 ? '' : 's'} de esta revisión?`, 'Borrar')) return;
      personas = personas.filter(p => !seleccion.has(p.k)); seleccion.clear(); marcarCambios(); pintar();
    };
    $('#asc-agregar-p').onclick = () => {
      const t = tiposVisibles()[0] || 'otro';
      personas.push({ k: Math.random().toString(36).slice(2, 9), nombre: '', grado: rangosRev[0], por: { [t]: 1 }, actividades: 1, lider: 0, sub: 0, informes: [] });
      orden = { id: 'nombre', dir: 1 }; marcarCambios(); pintar();
      $('.asc-editable input[data-campo=nombre][value=""]')?.focus();
    };
    $('#asc-guardar-cambios').onclick = () => guardar(false);
    $('#asc-verificar').onclick = () => guardar(true);
    const rc = $('#asc-recargar'); if (rc) rc.onclick = () => navegar();
  }

  async function guardar(verificar) {
    personas.forEach(p => { p.nombre = String(p.nombre || '').replace(/\s+/g, ' ').trim(); recalcularTotal(p); });
    if (personas.some(p => !p.nombre)) return aviso('Hay personas sin nombre: completalas o borralas.', 'error');
    const vistos = new Set(), rep = [];
    personas.forEach(p => { const n = normNombreAsc(p.nombre); if (vistos.has(n)) rep.push(p.nombre); vistos.add(n); });
    if (rep.length) return aviso(`Hay nombres repetidos (${rep.join(', ')}): juntalos antes de guardar.`, 'error');
    if (verificar) {
      const dups = posiblesDuplicados(personas, descartados).length;
      if (!await confirmar('Verificar y guardar', `Se guarda la revisión con ${personas.length} personas y queda verificada en el historial. Después ya no se puede modificar.`
        + (dups ? ` Todavía hay ${dups} posible${dups === 1 ? '' : 's'} duplicado${dups === 1 ? '' : 's'} sin revisar.` : ''), 'Verificar')) return;
    }
    try {
      rev = await api.guardarRevisionAscenso(rev.id, { resultado: personas, ...(verificar ? { estado: 'verificada' } : {}) }, rev.actualizado_en);
      cambios = false; otroGuardo = false;
      aviso(verificar ? 'Revisión verificada. Ya está en el historial de ascensos.' : 'Cambios guardados.');
      if (verificar) navegar(); else pintar();
    } catch (e) { fallo(e); }
  }

  estado.limpiezas.push(api.suscribir('ascensos_revisiones', async p => {
    if ((p?.new?.id ?? p?.old?.id) !== rev.id) return;
    if (p?.new?.actualizado_en && p.new.actualizado_en === rev.actualizado_en) return;   // fue un guardado propio
    if (!cambios && $('#modal-fondo').hidden) { navegar(); return; }
    otroGuardo = true; pintar();
  }));
  pintar();
}

/* ============================================================ USUARIOS */
async function vistaUsuarios(cont) {
  if (!esAdmin()) { cont.innerHTML = '<div class="vacio">Solo los administradores pueden ver esta sección.</div>'; return; }
  let [perfiles, miembros, tropas] = await Promise.all([api.listarPerfiles(), api.listarMiembros(), api.listarTropas().catch(() => [])]);
  estado.ajustes = await api.obtenerAjustes();
  const vinculables = ordenarMiembros(miembros.filter(m => m.activo));
  const activos = ordenarMiembros(miembros.filter(m => m.activo));
  // Para aprobar: la Legión y también las tropas (si una tropa llegó a élite o a Sargento, pasa a la Legión al aprobarla)
  const tropasActivas = ordenarMiembros(tropas.filter(t => t.activo)).map(t => ({ ...t, tropa: true }));
  const candidatos = [...activos, ...tropasActivas];
  const aprobada = p => !p.estado || p.estado === 'aprobada';

  cont.innerHTML = `
    <section class="tarjeta pendientes" id="pendientes"></section>
    <div class="tarjeta" style="margin-bottom:18px">
      <label class="interruptor"><input type="checkbox" id="modo-abierto" ${estado.ajustes.modo_abierto === true ? 'checked' : ''}>
        <span><strong>Modo abierto</strong><br><span style="color:var(--texto-2)">Mientras esté activo, cualquier cuenta registrada puede editar tablas, miembros, calendario y reglamento.
        Desactivalo cuando quieras que solo las cuentas con ${esc(nombreRango(RANGO_ADMIN))} editen (el resto queda en solo lectura).</span></span></label>
    </div>
    <div class="envoltorio-tabla"><table class="datos"><thead><tr><th data-ancho-min="150" data-sin-cortar>Cuenta</th><th>Email</th><th>Rango web</th><th>Rango militar</th><th>Miembro vinculado</th><th>Registrado</th><th></th></tr></thead>
    <tbody id="cuerpo-usuarios"></tbody></table></div>
    <p class="ayuda">Cada cuenta va vinculada a su miembro de la legión (élites y de Sargento para arriba); un miembro solo puede tener una cuenta.
    El <strong>rango web</strong> de una cuenta vinculada es automático (sale de su rango militar y cambia solo cuando asciende), salvo que le fijes uno a mano; para volver a lo automático elegí "Automático".
    El <strong>rango militar</strong> que cambies acá es el de su ficha en la legión. Si un miembro pasa a inactivo, su cuenta deja de poder entrar.
    Borrar una cuenta no borra al miembro de la legión: queda sin cuenta.</p>`;

  const manual = p => p.rango_manual || p.rango >= RANGO_ADMIN;
  const opciones = p => {
    const m = p.miembro_id && miembros.find(x => x.id === p.miembro_id);
    const fijos = Object.entries(RANGOS).filter(([n]) => +n > 0)
      .map(([n, t]) => `<option value="${n}" ${(!m || manual(p)) && +n === p.rango ? 'selected' : ''}>${n} · ${esc(t)}${m ? ' (a mano)' : ''}</option>`).join('');
    if (!m) return fijos;
    const auto = rangoWebDe(m.grado, m.elite);
    return `<option value="auto" ${manual(p) ? '' : 'selected'}>Automático · ${esc(nombreRango(auto))}</option>` + fijos;
  };
  const opcionesGrado = p => {
    const m = p.miembro_id && miembros.find(x => x.id === p.miembro_id);
    if (!m) return '';
    return [...RANGOS_LEGION].reverse().map(g => `<option ${normRango(g) === normRango(m.grado) ? 'selected' : ''}>${esc(g)}</option>`).join('');
  };
  const opcionesMiembro = p => `<option value="">— Sin vincular —</option>` + vinculables.map(m => {
    const otro = perfiles.find(x => x.id !== p.id && x.miembro_id === m.id);
    return `<option value="${m.id}" ${p.miembro_id === m.id ? 'selected' : ''} ${otro ? 'disabled' : ''}>${esc(m.grado)} ${esc(m.nombre)}${otro ? ` — cuenta ${esc(otro.nombre)}` : ''}</option>`;
  }).join('');
  function pintar() {
    pintarPendientes();
    $('#cuerpo-usuarios').innerHTML = perfiles.filter(aprobada).map(p => `<tr>
      <td><strong>${esc(p.nombre)}</strong>${p.id === estado.perfil.id ? ' <span class="etiqueta">vos</span>' : ''}</td>
      <td style="color:var(--texto-2)">${esc(p.email)}</td>
      <td><select class="entrada" style="height:32px;max-width:220px" data-rango="${p.id}">${opciones(p)}</select></td>
      <td>${p.miembro_id ? `<select class="entrada" style="height:32px;max-width:110px" data-grado="${p.id}">${opcionesGrado(p)}</select>` : '<span class="tenue">—</span>'}</td>
      <td><select class="entrada" style="height:32px;max-width:240px" data-miembro="${p.id}">${opcionesMiembro(p)}</select></td>
      <td style="color:var(--texto-2)">${p.creado_en ? new Date(p.creado_en).toLocaleDateString('es-AR') : ''}</td>
      <td>${p.id === estado.perfil.id ? '' : `<button class="btn chico peligro" data-borrar-cuenta="${p.id}" title="Borrar la cuenta">Borrar</button>`}</td></tr>`).join('');
  }

  $('#cuerpo-usuarios').onchange = async ev => {
    const sel = ev.target;
    if (sel.dataset.miembro) {
      const p = perfiles.find(x => String(x.id) === sel.dataset.miembro);
      const nuevo = sel.value ? +sel.value : null;
      try {
        await api.vincularMiembro(p.id, nuevo); p.miembro_id = nuevo;
        const mv = miembros.find(m => m.id === nuevo);
        if (mv && p.rango < RANGO_ADMIN) p.rango = rangoWebDe(mv.grado, mv.elite);   // la base lo pone sola
        if (p.id === estado.perfil.id) estado.perfil.miembro_id = nuevo;
        aviso(nuevo ? `${p.nombre} quedó vinculada a ${miembros.find(m => m.id === nuevo)?.nombre}.` : `${p.nombre} quedó sin vincular.`);
        pintar();
      } catch (e) { fallo(e); pintar(); }
      return;
    }
    if (sel.dataset.grado) {
      const p = perfiles.find(x => String(x.id) === sel.dataset.grado), m = miembros.find(x => x.id === p.miembro_id);
      const grado = sel.value;
      if (!esDeLegion({ grado, elite: m.elite })) { aviso('En la Legión solo hay élites o de Sargento (SGT) para arriba. Para un rango más bajo, primero marcale la élite en Miembros de la legión.', 'error'); pintar(); return; }
      try {
        const g = await api.guardarMiembro({ id: m.id, grado, categoria: categoriaDeRango(grado) || m.categoria });
        Object.assign(m, g || { grado });
        perfiles = await api.listarPerfiles();   // el rango web automático cambia solo
        aviso(`${m.nombre}: rango militar ${grado}.`);
        if (p.id === estado.perfil.id) entrarApp({ ...estado.perfil, ...perfiles.find(x => x.id === p.id) });
        pintar();
      } catch (e) { fallo(e); pintar(); }
      return;
    }
    const p = perfiles.find(x => String(x.id) === sel.dataset.rango);
    const auto = sel.value === 'auto', nuevo = auto ? null : +sel.value;
    const m = p.miembro_id && miembros.find(x => x.id === p.miembro_id);
    const final = auto ? rangoWebDe(m.grado, m.elite) : nuevo;
    const admins = perfiles.filter(x => aprobada(x) && x.rango >= RANGO_ADMIN).length;
    if (p.rango >= RANGO_ADMIN && final < RANGO_ADMIN && admins <= 1) { aviso(`Tiene que quedar al menos una cuenta con ${nombreRango(RANGO_ADMIN)}.`, 'error'); pintar(); return; }
    if (p.id === estado.perfil.id && final < RANGO_ADMIN && !await confirmar('Quitarte el rango', `Vas a dejar de tener ${nombreRango(RANGO_ADMIN)} y perderás acceso a esta sección.`, 'Continuar')) { pintar(); return; }
    try {
      const r = await api.cambiarRango(p.id, nuevo);
      Object.assign(p, r || { rango: final, rango_manual: !auto });
      aviso(`${p.nombre}: ${nombreRango(p.rango)}${auto ? ' (automático)' : ' (fijado a mano)'}.`);
      if (p.id === estado.perfil.id) { estado.perfil.rango = p.rango; entrarApp(estado.perfil); }
      pintar();
    } catch (e) { fallo(e); pintar(); }
  };
  // Borrar cuentas (aprobadas, rechazadas o que no completaron sus datos)
  const borrarCuenta = async p => {
    if (!await confirmar('Borrar cuenta', `¿Borrar la cuenta de ${p.nombre} (${p.email})? No se puede deshacer. `
      + `El miembro de la legión no se borra (queda sin cuenta), pero sí se borran los temas y comentarios del foro y los avisos de inactividad que cargó esa cuenta.`, 'Borrar')) return;
    try {
      await api.borrarCuenta(p.id);
      perfiles = perfiles.filter(x => x.id !== p.id);
      aviso(`Cuenta de ${p.nombre} borrada.`); pintar(); actualizarPendientes();
    } catch (e) { fallo(e); }
  };
  $('#cuerpo-usuarios').onclick = ev => {
    const b = ev.target.closest('[data-borrar-cuenta]'); if (!b) return;
    borrarCuenta(perfiles.find(x => String(x.id) === b.dataset.borrarCuenta));
  };
  // ---- Cuentas pendientes de aprobación
  const normNombre = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const sugerido = p => {
    const libres = candidatos.filter(m => !perfiles.some(x => x.id !== p.id && x.miembro_id === m.id && aprobada(x)));
    if (p.decl_discord) { const dn = s => String(s || '').trim().replace(/^@+/, '').toLowerCase(); const m = libres.find(m => dn(m.discord_id) && dn(m.discord_id) === dn(p.decl_discord)); if (m) return m; }
    for (const nombre of [p.decl_clon, p.nombre]) {
      const n = normNombre(nombre); if (!n) continue;
      const m = libres.find(m => normNombre(m.nombre) === n || normNombre(m.nombre_iconico) === n)
        || (n.length >= 4 ? libres.find(m => normNombre(m.nombre).startsWith(n) || n.startsWith(normNombre(m.nombre))) : null);
      if (m) return m;
    }
    return null;
  };
  // Rango de la web que corresponde según el rango y la élite en la legión (se puede cambiar antes de aprobar)
  const elegidos = new Map();   // perfilId -> { miembro ('' | id | 'nuevo'), grado, elite }
  // Rango en la legión que se propone: el del miembro; si es una tropa o nuevo, el que declaró (porque ascendió)
  const gradoPropuesto = (p, m) => (m && !m.tropa) ? m.grado : (RANGOS_LEGION.includes(p.decl_grado) ? p.decl_grado : (m?.grado || ''));
  function datosDe(p) {
    if (!elegidos.has(p.id)) {
      const m = sugerido(p);
      elegidos.set(p.id, { miembro: m ? m.id : (p.decl_clon ? 'nuevo' : ''), grado: gradoPropuesto(p, m), elite: m?.elite || '' });
    }
    return elegidos.get(p.id);
  }
  function pintarPendientes() {
    const pend = perfiles.filter(p => p.estado === 'pendiente');
    const rech = perfiles.filter(p => p.estado === 'rechazada');
    const sinDatos = perfiles.filter(p => p.estado === 'datos');
    const fecha = p => p.creado_en ? new Date(p.creado_en).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '';
    const tarjeta = p => {
      const d = datosDe(p);
      const optsM = `<option value="">— Elegí su nombre en la legión —</option>`
        + (p.decl_clon ? `<option value="nuevo" ${d.miembro === 'nuevo' ? 'selected' : ''}>➕ Agregar como miembro nuevo: ${esc(p.decl_clon)}</option>` : '');
      const opcion = m => {
        const otro = perfiles.find(x => x.id !== p.id && x.miembro_id === m.id && aprobada(x));
        return `<option value="${m.id}" ${+d.miembro === m.id ? 'selected' : ''} ${otro ? 'disabled' : ''}>${esc(m.grado)} ${esc(m.nombre)}${m.elite ? ` (${esc(m.elite)})` : ''}${otro ? ` — ya es de ${esc(otro.nombre)}` : ''}</option>`;
      };
      const optsTodos = optsM + `<optgroup label="Legión">${activos.map(opcion).join('')}</optgroup>`
        + (tropasActivas.length ? `<optgroup label="Tropas (pasa a la Legión al aprobar)">${tropasActivas.map(opcion).join('')}</optgroup>` : '');
      const optsE = `<option value="">No</option>` + Object.entries(ELITES).map(([k, t]) => `<option value="${k}" ${d.elite === k ? 'selected' : ''}>${esc(t)}</option>`).join('');
      const permiso = d.grado ? nombreRango(rangoWebDe(d.grado, d.elite)) : '—';
      const valido = !d.grado || esDeLegion({ grado: d.grado, elite: d.elite });
      const optsG = `<option value="">—</option>` + [...RANGOS_LEGION].reverse().map(g => `<option ${g === d.grado ? 'selected' : ''}>${esc(g)}</option>`).join('');
      return `<div class="pendiente" data-pend="${p.id}">
        <div class="pend-quien"><span class="avatar chico">${esc((p.nombre || '?').trim().charAt(0).toUpperCase())}</span>
          <div><strong>${esc(p.nombre)}</strong><small>${esc(p.email)} · se registró el ${fecha(p)}</small>
          ${p.decl_clon ? `<small class="decl">Declaró: <b>${esc(p.decl_grado)}</b> · clon <b>${esc(p.decl_clon)}</b>${p.decl_jedi ? ` · Jedi <b>${esc(p.decl_jedi)}</b>` : ''} · Discord <b class="mono">${esc(p.decl_discord)}</b></small>` : ''}</div></div>
        <label class="campo"><span>Nombre en la legión</span><select class="entrada" data-campo="miembro">${optsTodos}</select></label>
        <label class="campo"><span>Rango en la legión</span><select class="entrada" data-campo="grado" ${d.miembro ? '' : 'disabled'}>${optsG}</select></label>
        <label class="campo"><span>Élite</span><select class="entrada" data-campo="elite" ${d.miembro ? '' : 'disabled'}>${optsE}</select></label>
        <div class="campo"><span>Permiso en el panel</span><div class="pend-permiso ${valido ? '' : 'invalido'}">${valido ? `${esc(permiso)} <small>(automático)</small>` : 'Solo élites o de SGT para arriba'}</div></div>
        <div class="pend-acciones">
          <button class="btn primario" data-accion="aprobar">Aprobar</button>
          <button class="btn" data-accion="rechazar">Rechazar</button>
        </div></div>`;
    };
    $('#pendientes').innerHTML = `
      <div class="pend-cab"><h3>Cuentas pendientes de aprobación</h3>${pend.length ? `<span class="menu-contador">${pend.length}</span>` : ''}</div>
      ${pend.length
        ? `<p class="ayuda" style="margin-top:0">Estas cuentas se registraron pero no pueden entrar al panel hasta que las apruebes. Revisá lo que declararon, elegí a qué miembro de la legión corresponde cada una (o agregalo como miembro nuevo) y su rango; si el rango no coincide con el que figura, se actualiza en Miembros de la legión.</p>
           ${pend.map(tarjeta).join('')}`
        : '<p class="vacio-chico">No hay cuentas esperando aprobación.</p>'}
      ${sinDatos.length ? `<details class="pend-rechazadas"><summary>Todavía completando sus datos in-game (${sinDatos.length})</summary>
        ${sinDatos.map(p => `<div class="pend-rech"><span><strong>${esc(p.nombre)}</strong> <small>${esc(p.email)} · ${fecha(p)}</small></span>
          <span><button class="btn chico" data-accion-sd="rechazar" data-id="${p.id}">Rechazar</button>
          <button class="btn chico peligro" data-borrar-pend="${p.id}">Borrar</button></span></div>`).join('')}</details>` : ''}
      ${rech.length ? `<details class="pend-rechazadas"><summary>Cuentas rechazadas (${rech.length})</summary>
        ${rech.map(p => `<div class="pend-rech"><span><strong>${esc(p.nombre)}</strong> <small>${esc(p.email)} · ${fecha(p)}</small></span>
          <span><button class="btn chico" data-reabrir="${p.id}">Volver a pendientes</button>
          <button class="btn chico peligro" data-borrar-pend="${p.id}">Borrar</button></span></div>`).join('')}</details>` : ''}`;
  }

  $('#pendientes').onchange = ev => {
    const caja = ev.target.closest('[data-pend]'); if (!caja) return;
    const p = perfiles.find(x => String(x.id) === caja.dataset.pend), d = datosDe(p), campo = ev.target.dataset.campo;
    if (campo === 'miembro') {
      const v = ev.target.value;
      d.miembro = v === 'nuevo' ? 'nuevo' : v ? +v : '';
      const m = candidatos.find(m => m.id === d.miembro);
      d.grado = gradoPropuesto(p, m); d.elite = m?.elite || '';
      pintarPendientes();
    } else if (campo === 'grado') { d.grado = ev.target.value; pintarPendientes(); }
    else if (campo === 'elite') { d.elite = ev.target.value; pintarPendientes(); }
  };
  $('#pendientes').onclick = async ev => {
    const bp = ev.target.closest('[data-borrar-pend]');
    if (bp) return borrarCuenta(perfiles.find(x => String(x.id) === bp.dataset.borrarPend));
    const sd = ev.target.closest('[data-accion-sd]');
    if (sd) {
      const p = perfiles.find(x => String(x.id) === sd.dataset.id);
      if (!await confirmar('Rechazar cuenta', `¿Rechazar la cuenta de ${p.nombre} (${p.email})? No va a poder entrar al panel.`, 'Rechazar')) return;
      try { await api.cambiarEstadoCuenta(p.id, 'rechazada'); p.estado = 'rechazada'; aviso(`Cuenta de ${p.nombre} rechazada.`); pintar(); } catch (e) { fallo(e); }
      return;
    }
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
    const esNuevo = d.miembro === 'nuevo';
    const m = esNuevo ? null : candidatos.find(x => x.id === d.miembro);
    if (!esNuevo && !m) return aviso('Elegí a qué miembro de la legión corresponde la cuenta.', 'error');
    if (!d.grado) return aviso('Elegí el rango en la legión.', 'error');
    if (!esDeLegion({ grado: d.grado, elite: d.elite || m?.elite })) return aviso('Solo se aprueban cuentas de élites o de Sargento (SGT) para arriba.', 'error');
    const permiso = nombreRango(rangoWebDe(d.grado, d.elite || m?.elite));
    const cambiaGrado = m && normRango(d.grado) !== normRango(m.grado);
    const texto = esNuevo
      ? `Se agrega a ${d.grado} ${p.decl_clon} como miembro nuevo de la legión y ${p.nombre} va a poder entrar al panel como ${permiso}.`
      : `${p.nombre} va a poder entrar al panel como ${permiso}, vinculada a ${d.grado} ${m.nombre}.`
        + (m.tropa ? ` ${m.nombre} pasa de tropas a la Legión, con todo su historial.` : '')
        + (cambiaGrado ? ` Su rango en la legión cambia de ${m.grado || '—'} a ${d.grado}.` : '');
    if (!await confirmar('Aprobar cuenta', texto, 'Aprobar')) return;
    b.disabled = true;
    try {
      const r = await api.aprobarCuenta(p.id, { miembro_id: esNuevo ? null : m.id, grado: d.grado, elite: d.elite });
      elegidos.delete(p.id);
      aviso(`Cuenta de ${p.nombre} aprobada y vinculada a ${d.grado} ${esNuevo ? p.decl_clon : m.nombre}.`);
      if (r) Object.assign(p, r);
      actualizarPendientes(); navegar();
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
  $('#btn-espera-corregir').onclick = () => { corrigiendoDatos = true; comprobarEspera(false); };
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


/* ============================================================ MODO ORDEN (Rango Scope) */
// Con el modo activo se pueden arrastrar nombres (filas o tarjetas con data-mid) para cambiar el orden
// dentro del mismo rango. El orden se guarda en miembros.orden y lo usan todas las listas.
const SECCIONES_ORDENABLES = ['escalafon', 'suboficiales', 'elites', 'bu', 'miembros', 'oficiales'];
try { estado.ordenando = localStorage.getItem('bd21_ordenando') === '1'; } catch { estado.ordenando = false; }
$('#btn-ordenar').onclick = () => {
  estado.ordenando = !estado.ordenando;
  try { localStorage.setItem('bd21_ordenando', estado.ordenando ? '1' : '0'); } catch {}
  aviso(estado.ordenando ? 'Modo orden activado: arrastrá los nombres (solo dentro del mismo rango).' : 'Modo orden desactivado.');
  navegar();
};

// Marca como arrastrables las filas/tarjetas mientras el modo está activo
new MutationObserver(() => {
  if (!document.body.classList.contains('ordenando')) return;
  $$('#contenido [data-mid]:not([draggable])').forEach(el => el.setAttribute('draggable', 'true'));
}).observe($('#contenido'), { childList: true, subtree: true });

let arrastreOrden = null;
document.addEventListener('dragstart', ev => {
  if (!document.body.classList.contains('ordenando')) return;
  const el = ev.target.closest?.('#contenido [data-mid]'); if (!el) return;
  arrastreOrden = { el, antes: hermanosOrden(el).map(x => x.dataset.mid).join(',') };
  el.classList.add('arrastrando');
  ev.dataTransfer.effectAllowed = 'move';
  ev.dataTransfer.setData('text/plain', el.dataset.mid);
  try { ev.dataTransfer.setDragImage(el, 20, 20); } catch {}
});
// Los del mismo rango dentro del mismo contenedor, en el orden en que se ven
const hermanosOrden = el => [...el.parentElement.children].filter(x => x.dataset?.mid && x.dataset.rango === el.dataset.rango);
document.addEventListener('dragover', ev => {
  if (!arrastreOrden) return;
  const dest = ev.target.closest?.('[data-mid]');
  const el = arrastreOrden.el;
  if (!dest || dest === el || dest.parentElement !== el.parentElement || dest.dataset.rango !== el.dataset.rango) {
    if (dest && dest !== el) ev.dataTransfer.dropEffect = 'none';
    return;
  }
  ev.preventDefault(); ev.dataTransfer.dropEffect = 'move';
  const r = dest.getBoundingClientRect();
  const horizontal = dest.tagName !== 'TR' && r.width < r.height * 3.5;   // tarjetas en grilla: según X; filas: según Y
  const despues = horizontal ? ev.clientX > r.left + r.width / 2 : ev.clientY > r.top + r.height / 2;
  if (despues ? dest.nextElementSibling !== el : dest.previousElementSibling !== el) dest.parentElement.insertBefore(el, despues ? dest.nextElementSibling : dest);
});
document.addEventListener('drop', ev => { if (arrastreOrden) ev.preventDefault(); });
document.addEventListener('dragend', async () => {
  if (!arrastreOrden) return;
  const { el, antes } = arrastreOrden; arrastreOrden = null;
  el.classList.remove('arrastrando');
  const ids = hermanosOrden(el).map(x => +x.dataset.mid);
  if (ids.join(',') === antes) return;
  try { await guardarOrden(ids); aviso('Orden guardado.'); }
  catch (e) { fallo(e); }
  navegar();
});

// Reparte los lugares que ya ocupan esos miembros (dentro de su rango) en el nuevo orden.
async function guardarOrden(ids) {
  const todos = await api.listarMiembros();
  const elegidos = ids.map(id => todos.find(m => m.id === id)).filter(Boolean);
  const rangos = new Set(elegidos.map(m => normRango(m.grado)));
  const cambios = [];
  for (const rg of rangos) {
    // todo el rango en su orden actual, numerado de 10 en 10
    const lista = todos.filter(m => normRango(m.grado) === rg).sort(compararRango);
    const nuevos = elegidos.filter(m => normRango(m.grado) === rg);
    const set = new Set(nuevos.map(m => m.id));
    let k = 0;
    const final = lista.map(m => set.has(m.id) ? nuevos[k++] : m);
    final.forEach((m, i) => { const o = (i + 1) * 10; if (m.orden !== o) cambios.push({ id: m.id, orden: o }); });
  }
  if (cambios.length) await api.ordenarMiembros(cambios);
}


/* ============================================================ RETRATO PROPIO (menú y perfil) */
async function pintarAvatarUsuario(m) {
  const ids = await idsBUActual();
  const r = retratoDe(m, ids);
  const av = $('#usuario-avatar');
  av.classList.add('con-retrato'); av.classList.toggle('iconico', r.tipo === 'iconico');
  av.innerHTML = `<img src="${r.src}" alt="">`;
}
// Selector de modelo en el propio perfil
document.addEventListener('click', async ev => {
  const b = ev.target.closest('#modelo-opciones [data-modelo]'); if (!b || b.classList.contains('activo')) return;
  const clave = b.dataset.modelo;
  $$('#modelo-opciones [data-modelo]').forEach(x => x.disabled = true);
  try {
    await api.elegirModelo(clave);
    aviso('Modelo guardado.');
    const m = (await api.listarMiembros()).find(x => x.id === estado.perfil.miembro_id);
    if (m) { pintarAvatarUsuario(m); pintarOpcionesModelo(m); }
  } catch (e) { fallo(e); $$('#modelo-opciones [data-modelo]').forEach(x => x.disabled = false); }
});
async function pintarOpcionesModelo(m) {
  const cont = $('#modelo-opciones'); if (!cont) return;
  const ids = await idsBUActual();
  const lista = modelosDe(m, ids), actual = retratoDe(m, ids).tipo;
  cont.innerHTML = lista.map(o => `<button class="modelo-op ${o.clave === actual ? 'activo' : ''}" data-modelo="${o.clave}" ${lista.length === 1 ? 'disabled' : ''}>
    <span class="modelo-img ${o.clave}"><img src="${o.src}" alt=""></span><span>${esc(o.nombre)}</span></button>`).join('');
  const r = retratoDe(m, ids), pr = $('#perfil-retrato');
  if (pr) { pr.className = `perfil-avatar con-retrato ${r.tipo}`; pr.innerHTML = `<img src="${r.src}" alt="">`; }
}
// Al abrir el propio perfil, dibuja las opciones
new MutationObserver(() => {
  const cont = $('#modelo-opciones');
  if (cont && !cont.dataset.listo) {
    cont.dataset.listo = '1';
    api.listarMiembros().then(ms => { const m = ms.find(x => x.id === estado.perfil?.miembro_id); if (m) pintarOpcionesModelo(m); }).catch(() => {});
  }
}).observe($('#contenido'), { childList: true, subtree: true });
