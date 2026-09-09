/**
 * Inventario de arriendos atrapados.
 */
import { estadoJuego, obtenerArriendo } from './juego.js';
import { irA } from './router.js';
import { pintarDetalle } from './detalle.js';

let filtroTipo = 'todos';

function capturasFiltradas(juego) {
  if (filtroTipo === 'todos') return juego.capturas;
  return juego.capturas.filter((c) => {
    const full = obtenerArriendo(c.id);
    return (full?.tipo || c.tipo) === filtroTipo;
  });
}

export function pintarInventario() {
  const juego = estadoJuego();
  const lista = document.getElementById('capturas-lista');
  const vacio = document.getElementById('inventario-vacio');
  const slots = document.getElementById('slots-info');
  const capturas = capturasFiltradas(juego);

  if (slots) slots.textContent = `${juego.capturas.length} / ${juego.slots}`;

  if (!lista) return;

  if (!juego.capturas.length) {
    lista.innerHTML = '';
    if (vacio) vacio.hidden = false;
    return;
  }

  if (vacio) vacio.hidden = capturas.length > 0;

  if (!capturas.length) {
    lista.innerHTML = '<p class="small muted inventario-sin-filtro">Ninguna captura coincide con este filtro.</p>';
    return;
  }

  lista.innerHTML = capturas
    .slice()
    .reverse()
    .map((c) => {
      const full = obtenerArriendo(c.id);
      const foto = full?.fotos?.[0] || '/fotos/apto-salon.svg';
      const ficha = full
        ? `${full.habitaciones} hab · ${full.banos} baños · ${full.metros} m²`
        : c.rareza;
      return `
      <button type="button" class="captura-card btn-animar" data-id="${c.id}">
        <div class="captura-thumb">
          <img src="${foto}" alt="" />
        </div>
        <div class="captura-body">
          <p class="titulo">${c.titulo}</p>
          <p class="meta">${c.barrio} · ${ficha}</p>
        </div>
        <span class="captura-puntos">+${c.puntosGanados}</span>
      </button>`;
    })
    .join('');

  lista.querySelectorAll('.captura-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      window.__detalleId = id;
      window.__detalleOrigen = 'inventario';
      pintarDetalle(id);
      irA('detalle');
    });
  });
}

export function iniciarInventario() {
  document.getElementById('inv-tipo-chips')?.addEventListener('click', (ev) => {
    const chip = ev.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#inv-tipo-chips .chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    filtroTipo = chip.getAttribute('data-tipo') || 'todos';
    pintarInventario();
  });
}
