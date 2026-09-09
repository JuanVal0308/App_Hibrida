/**
 * Lista de arriendos: navegación directa sin radar ni escaneo de zonas.
 * Muestra todos los arriendos activos en una lista filtrable y buscable.
 */
import { irA } from './router.js';
import { mostrarAviso } from './ui.js';
import {
  listarArriendos,
  idsAtrapados,
  idsVisiblesEnMapa,
  atraparArriendo,
  puedeAtrapar,
  estadoJuego,
  obtenerArriendo,
  obtenerArriendoEnMapa,
  formatearCuentaRotacion,
  iniciarRotacionTimer,
  verificarRotacionPendiente,
} from './juego.js';

let seleccionId = null;
let filtroTipo = 'todos';
let filtroZona = '';
let hudTick = null;

function actualizarHud() {
  const juego = estadoJuego();
  const hud = document.getElementById('hud-puntos');
  if (!hud) return;
  const cuenta = formatearCuentaRotacion();
  const nivel = juego.radio || 1;
  hud.textContent = `${juego.puntos} pts · rota ${cuenta} · alcance nv.${nivel}`;
}

function arriendosFiltrados() {
  let lista = listarArriendos();
  
  if (filtroTipo !== 'todos') {
    lista = lista.filter((a) => a.tipo === filtroTipo);
  }
  
  const termino = filtroZona.trim().toLowerCase();
  if (termino) {
    lista = lista.filter((a) => 
      a.titulo.toLowerCase().includes(termino) || 
      a.barrio.toLowerCase().includes(termino)
    );
  }
  
  return lista;
}

function colorRareza(rareza) {
  if (rareza === 'epico') return '#1e8449';
  if (rareza === 'raro') return '#8656c4';
  return '#3e6ea3';
}

function fotoPrincipal(arriendo) {
  const fotos = arriendo?.fotos || [];
  return fotos[0] || '/fotos/apto-salon.svg';
}

function renderLista() {
  const cont = document.getElementById('radar-zonas');
  if (!cont) return;

  const lista = arriendosFiltrados();
  const atrapados = idsAtrapados();

  if (!lista.length) {
    cont.innerHTML = '<p class="lista-vacio small muted">No se encontraron propiedades con los filtros actuales.</p>';
    return;
  }

  cont.innerHTML = lista
    .map((a) => {
      const atrapado = atrapados.has(a.id);
      const full = obtenerArriendo(a.id) || a;
      const foto = fotoPrincipal(full);
      
      return `
        <article class="propiedad-card ${atrapado ? 'atrapada' : ''}" data-id="${a.id}">
          <div class="prop-thumb">
            <img src="${foto}" alt="${a.titulo}" loading="lazy" onerror="this.src='/fotos/apto-salon.svg'" />
            <span class="prop-rareza-dot" style="background:${colorRareza(a.rareza)}"></span>
          </div>
          <div class="prop-info">
            <div class="prop-header">
              <h3 class="prop-titulo">${a.titulo}</h3>
              <span class="prop-precio">${a.precioTexto}</span>
            </div>
            <p class="prop-ubicacion small muted">${a.barrio}</p>
            <div class="prop-meta">
              <span class="prop-tipo">${a.tipo}</span>
              <span>·</span>
              <span>${a.habitaciones} hab</span>
              <span>·</span>
              <span>${a.banos} baños</span>
              <span>·</span>
              <span>${a.metros} m²</span>
            </div>
            <div class="prop-footer">
              <span class="prop-rareza ${a.rareza}">${a.rareza}</span>
              <span class="prop-puntos">+${a.puntos} pts</span>
            </div>
          </div>
          ${atrapado ? '<span class="prop-check">✓ Atrapado</span>' : ''}
        </article>`;
    })
    .join('');

  cont.querySelectorAll('.propiedad-card').forEach((el) => {
    el.addEventListener('click', () => mostrarPreview(el.getAttribute('data-id')));
  });
}

function mostrarPreview(id) {
  const a = obtenerArriendoEnMapa(id);
  const sheet = document.getElementById('preview-sheet');
  if (!a || !sheet) return;

  if (!idsVisiblesEnMapa().has(id)) {
    ocultarPreview();
    mostrarAviso('Esta propiedad ya no está disponible en el ciclo actual.', 'info');
    renderLista();
    return;
  }

  seleccionId = id;

  const thumb = document.getElementById('preview-thumb');
  const src = fotoPrincipal(obtenerArriendo(id) || a);
  thumb.innerHTML = `<img src="${src}" alt="${a.titulo}" width="56" height="56" onerror="this.src='/fotos/apto-salon.svg'" />`;

  document.getElementById('preview-titulo').textContent = a.titulo;
  document.getElementById('preview-meta').textContent =
    `${a.barrio} · ${a.habitaciones} hab · ${a.banos} baños · ${a.metros} m²`;
  document.getElementById('preview-precio').textContent = a.precioTexto;

  const desc = document.getElementById('preview-desc');
  if (desc) desc.textContent = a.descripcion || '';

  const atrapados = idsAtrapados();
  const btn = document.getElementById('btn-atrapar');
  if (atrapados.has(id)) {
    btn.textContent = 'Ya atrapado';
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
  renderLista();
  mostrarPreview(seleccionId);
  Promise.all([
    import('./inventario.js').then((m) => m.pintarInventario()),
    import('./perfil.js').then((m) => m.pintarPerfil()),
    import('./tienda.js').then((m) => m.pintarTienda()),
  ]);
}

function alRotarSpawns(res) {
  if (seleccionId && res?.quitados?.includes(seleccionId)) {
    ocultarPreview();
  }

  if (res?.quitados?.length || res?.agregados?.length) {
    const n = res?.agregados?.length || 0;
    if (n) {
      mostrarAviso(`Rotación: ${n} propiedad${n > 1 ? 'es' : ''} nueva${n > 1 ? 's' : ''} disponible${n > 1 ? 's' : ''}.`, 'info');
    }
  }

  actualizarHud();
  renderLista();
}

function iniciarHudTick() {
  if (hudTick) clearInterval(hudTick);
  hudTick = setInterval(actualizarHud, 1000);
}

export function abrirDetalleDesdeRadar(id) {
  const idUsar = id || seleccionId;
  if (!idUsar) return;
  window.__detalleId = idUsar;
  window.__detalleOrigen = 'radar';
  import('./detalle.js').then(({ pintarDetalle }) => {
    pintarDetalle(idUsar);
    irA('detalle');
  });
}

export function iniciarRadar() {
  actualizarHud();
  iniciarHudTick();
  iniciarRotacionTimer(alRotarSpawns);

  document.querySelector('#preview-sheet .sheet-handle')?.addEventListener('click', ocultarPreview);

  document.getElementById('tipo-chips')?.addEventListener('click', (ev) => {
    const chip = ev.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#tipo-chips .chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    filtroTipo = chip.getAttribute('data-tipo') || 'todos';
    renderLista();
  });

  document.getElementById('buscar-barrio')?.addEventListener('input', (ev) => {
    filtroZona = ev.target.value;
    renderLista();
  });

  document.getElementById('btn-atrapar')?.addEventListener('click', ejecutarAtrapar);
  document.getElementById('btn-ver-detalle')?.addEventListener('click', () => abrirDetalleDesdeRadar());
  document.getElementById('btn-detalle-atrapar')?.addEventListener('click', () => {
    seleccionId = window.__detalleId;
    ejecutarAtrapar();
  });
}

export function refrescarRadar() {
  const rotacion = verificarRotacionPendiente();
  if (rotacion) {
    alRotarSpawns(rotacion);
    return;
  }
  actualizarHud();
  renderLista();
}
