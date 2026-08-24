/**
 * Mapa Leaflet: muestra TODOS los arriendos; la captura sí depende del radio GPS.
 */
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { irA } from './router.js';
import { mostrarAviso } from './ui.js';
import {
  pedirPermisoUbicacion,
  obtenerPosicion,
  alCambiarPosicion,
  distanciaMetros,
  iniciarSeguimiento,
  MEDELLIN,
  usarMedellinDemo,
} from './geolocalizacion.js';
import {
  listarArriendos,
  idsAtrapados,
  atraparArriendo,
  puedeAtrapar,
  estadoJuego,
  obtenerArriendo,
} from './juego.js';

let seleccionId = null;
let filtroTipo = 'todos';
let filtroBarrio = '';
let mapa = null;
let capaUsuario = null;
let capaRadar = null;
let capaPins = null;
let mapaListo = false;

/** Radio de captura en metros según nivel de mejora. */
export function radioMetros() {
  const nivel = estadoJuego().radio || 1;
  return 1200 + (nivel - 1) * 800;
}

function actualizarHud() {
  const juego = estadoJuego();
  const hud = document.getElementById('hud-puntos');
  const pos = obtenerPosicion();
  if (hud) {
    const modo = pos.demo ? 'demo MDE' : pos.aproximada ? 'aprox.' : 'GPS';
    hud.textContent = `${juego.puntos} pts · ${radioMetros()} m · ${modo}`;
  }
}

function iconoPin(arriendo, atrapado, enRango) {
  let color = '#ffb648';
  if (atrapado) color = '#566373';
  else if (arriendo.rareza === 'epico') color = '#58e08a';
  else if (arriendo.rareza === 'raro') color = '#c084fc';
  const opacidad = enRango || atrapado ? '1' : '0.45';
  return L.divIcon({
    className: 'pin-leaflet',
    html: `<span class="pin-leaflet__dot" style="background:${color};opacity:${opacidad}"></span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

function iconoUsuario() {
  return L.divIcon({
    className: 'pin-usuario',
    html: '<span class="pin-usuario__dot"></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function estaEnRangoId(arriendo) {
  const yo = obtenerPosicion();
  return distanciaMetros(yo, { lat: arriendo.lat, lng: arriendo.lng }) <= radioMetros();
}

/** Filtro de lista (tipo / barrio). Siempre se muestran en el mapa. */
function arriendosFiltrados() {
  return listarArriendos().filter((a) => {
    const tipoOk = filtroTipo === 'todos' || a.tipo === filtroTipo;
    const barrioOk =
      !filtroBarrio ||
      a.barrio.toLowerCase().includes(filtroBarrio) ||
      a.titulo.toLowerCase().includes(filtroBarrio);
    return tipoOk && barrioOk;
  });
}

function actualizarUsuarioEnMapa() {
  if (!mapa) return;
  const pos = obtenerPosicion();
  const latlng = [pos.lat, pos.lng];
  const radio = radioMetros();

  if (!capaUsuario) {
    capaUsuario = L.marker(latlng, { icon: iconoUsuario(), zIndexOffset: 1000 }).addTo(mapa);
  } else {
    capaUsuario.setLatLng(latlng);
  }

  if (!capaRadar) {
    capaRadar = L.circle(latlng, {
      radius: radio,
      color: '#4d8cff',
      weight: 2,
      dashArray: '6 6',
      fillColor: '#4d8cff',
      fillOpacity: 0.15,
    }).addTo(mapa);
  } else {
    capaRadar.setLatLng(latlng);
    capaRadar.setRadius(radio);
  }
}

function renderPins() {
  if (!mapa) return;
  if (capaPins) {
    capaPins.clearLayers();
  } else {
    capaPins = L.layerGroup().addTo(mapa);
  }

  const atrapados = idsAtrapados();
  const lista = arriendosFiltrados();

  lista.forEach((a) => {
    const enRango = estaEnRangoId(a);
    const m = L.marker([a.lat, a.lng], {
      icon: iconoPin(a, atrapados.has(a.id), enRango),
      title: a.titulo,
      riseOnHover: true,
    });
    m.on('click', () => mostrarPreview(a.id));
    capaPins.addLayer(m);
  });
}

function fotoPrincipal(arriendo) {
  const fotos = arriendo.fotos || [];
  return fotos[0] || '/fotos/apto-salon.svg';
}

function mostrarPreview(id) {
  const a = obtenerArriendo(id);
  const sheet = document.getElementById('preview-sheet');
  if (!a || !sheet) return;

  seleccionId = id;
  const yo = obtenerPosicion();
  const metros = Math.round(distanciaMetros(yo, { lat: a.lat, lng: a.lng }));
  const enRango = metros <= radioMetros();

  const thumb = document.getElementById('preview-thumb');
  const src = fotoPrincipal(a);
  thumb.innerHTML = `<img src="${src}" alt="${a.titulo}" width="56" height="56" onerror="this.src='/fotos/apto-salon.svg'" />`;

  document.getElementById('preview-titulo').textContent = a.titulo;
  document.getElementById('preview-meta').textContent =
    `${a.barrio} · ${a.habitaciones} hab · ${a.banos} baños · ${a.metros} m² · ${metros} m`;
  document.getElementById('preview-precio').textContent = a.precioTexto;

  const desc = document.getElementById('preview-desc');
  if (desc) desc.textContent = a.descripcion || '';

  const atrapados = idsAtrapados();
  const btn = document.getElementById('btn-atrapar');
  if (atrapados.has(id)) {
    btn.textContent = 'Ya atrapado';
    btn.disabled = true;
  } else if (!enRango) {
    btn.textContent = 'Fuera de radio';
    btn.disabled = true;
  } else {
    btn.textContent = `Atrapar (+${a.puntos})`;
    btn.disabled = false;
  }

  sheet.classList.remove('oculto');
  sheet.classList.add('animate__animated', 'animate__slideInUp');
}

function ocultarPreview() {
  const sheet = document.getElementById('preview-sheet');
  if (sheet) sheet.classList.add('oculto');
  seleccionId = null;
}

function flashCaptura() {
  const flash = document.getElementById('captura-flash');
  if (!flash) return;
  const texto = flash.querySelector('.captura-texto');
  flash.hidden = false;
  texto.classList.add('animate__bounceIn');
  setTimeout(() => {
    flash.hidden = true;
    texto.classList.remove('animate__bounceIn');
  }, 900);
}

function ejecutarAtrapar() {
  if (!seleccionId) return;
  const a = obtenerArriendo(seleccionId);
  if (!a) return;

  if (!estaEnRangoId(a)) {
    mostrarAviso('Acércate o mejora el radar en la tienda para atraparlo.', 'error');
    return;
  }

  const chequeo = puedeAtrapar(seleccionId);
  if (!chequeo.ok) {
    mostrarAviso(chequeo.motivo, 'error');
    if (chequeo.motivo.includes('Inventario')) irA('tienda');
    return;
  }

  const res = atraparArriendo(seleccionId);
  if (!res.ok) {
    mostrarAviso(res.motivo, 'error');
    return;
  }

  flashCaptura();
  mostrarAviso(`¡Atrapado! +${res.puntosGanados} pts`, 'success');
  actualizarHud();
  renderPins();
  mostrarPreview(seleccionId);
  Promise.all([
    import('./inventario.js').then((m) => m.pintarInventario()),
    import('./perfil.js').then((m) => m.pintarPerfil()),
    import('./tienda.js').then((m) => m.pintarTienda()),
  ]);
}

export function abrirDetalleDesdeMapa(id) {
  const idUsar = id || seleccionId;
  if (!idUsar) return;
  window.__detalleId = idUsar;
  window.__detalleOrigen = 'mapa';
  import('./detalle.js').then(({ pintarDetalle }) => {
    pintarDetalle(idUsar);
    irA('detalle');
  });
}

function crearMapa() {
  const contenedor = document.getElementById('leaflet-map');
  if (!contenedor || mapa) return;

  const pos = obtenerPosicion();
  mapa = L.map(contenedor, {
    zoomControl: false,
    attributionControl: true,
  }).setView([pos.lat, pos.lng], 13);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OSM &copy; CARTO',
    maxZoom: 19,
  }).addTo(mapa);

  L.control.zoom({ position: 'topright' }).addTo(mapa);

  actualizarUsuarioEnMapa();
  renderPins();
  mapaListo = true;

  // Ajustar vista a todos los pins + usuario
  const grupo = L.featureGroup([
    ...(capaPins ? capaPins.getLayers() : []),
    ...(capaUsuario ? [capaUsuario] : []),
  ]);
  if (grupo.getLayers().length) {
    try {
      mapa.fitBounds(grupo.getBounds().pad(0.2));
    } catch {
      mapa.setView([MEDELLIN.lat, MEDELLIN.lng], 13);
    }
  }

  setTimeout(() => mapa.invalidateSize(), 250);
}

export async function asegurarUbicacion(mostrarMensaje = true) {
  const res = await pedirPermisoUbicacion();
  if (mostrarMensaje && res.mensaje) {
    mostrarAviso(res.mensaje, res.ok ? 'success' : 'info');
  }
  if (res.ok) iniciarSeguimiento();
  actualizarHud();
  if (mapa) {
    const p = obtenerPosicion();
    mapa.setView([p.lat, p.lng], 13);
    actualizarUsuarioEnMapa();
    renderPins();
  }
  return res;
}

export function iniciarMapa() {
  // Por defecto ya estamos en Medellín demo hasta que llegue el GPS
  usarMedellinDemo();
  actualizarHud();

  document.getElementById('tipo-chips')?.addEventListener('click', (ev) => {
    const chip = ev.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#tipo-chips .chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    filtroTipo = chip.getAttribute('data-tipo') || 'todos';
    renderPins();
  });

  document.getElementById('buscar-barrio')?.addEventListener('input', (ev) => {
    filtroBarrio = ev.target.value.trim().toLowerCase();
    renderPins();
  });

  document.getElementById('btn-atrapar')?.addEventListener('click', ejecutarAtrapar);
  document.getElementById('btn-ver-detalle')?.addEventListener('click', () => abrirDetalleDesdeMapa());
  document.getElementById('btn-ubicacion')?.addEventListener('click', () => asegurarUbicacion(true));

  document.getElementById('btn-detalle-atrapar')?.addEventListener('click', () => {
    seleccionId = window.__detalleId;
    ejecutarAtrapar();
  });

  alCambiarPosicion(() => {
    actualizarHud();
    actualizarUsuarioEnMapa();
    renderPins();
  });
}

export async function refrescarMapa() {
  actualizarHud();
  if (!mapaListo) {
    crearMapa();
    // No bloqueamos el mapa esperando GPS: primero se ven los pins
    pedirPermisoUbicacion().then((res) => {
      if (res.mensaje) mostrarAviso(res.mensaje, res.ok ? 'success' : 'info');
      actualizarHud();
      actualizarUsuarioEnMapa();
      renderPins();
      const p = obtenerPosicion();
      if (mapa) mapa.setView([p.lat, p.lng], 13);
    });
  } else {
    setTimeout(() => mapa?.invalidateSize(), 120);
    actualizarUsuarioEnMapa();
    renderPins();
  }
}
