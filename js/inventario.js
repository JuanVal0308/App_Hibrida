/**
 * Inventario de arriendos atrapados.
 */
import { estadoJuego } from './juego.js';
import { irA } from './router.js';
import { pintarDetalle } from './detalle.js';

export function pintarInventario() {
  const juego = estadoJuego();
  const lista = document.getElementById('capturas-lista');
  const vacio = document.getElementById('inventario-vacio');
  const slots = document.getElementById('slots-info');

  if (slots) slots.textContent = `${juego.capturas.length} / ${juego.slots}`;

  if (!lista) return;

  if (!juego.capturas.length) {
    lista.innerHTML = '';
    if (vacio) vacio.hidden = false;
    return;
  }

  if (vacio) vacio.hidden = true;

  lista.innerHTML = juego.capturas
    .slice()
    .reverse()
    .map(
      (c) => `
      <button type="button" class="captura-card btn-animar" data-id="${c.id}">
        <div class="captura-thumb">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 20V10l8-6 8 6v10h-5v-6H9v6H4Z" stroke="currentColor" stroke-width="1.4"/></svg>
        </div>
        <div class="captura-body">
          <p class="titulo">${c.titulo}</p>
          <p class="meta">${c.barrio} · ${c.rareza}</p>
        </div>
        <span class="captura-puntos">+${c.puntosGanados}</span>
      </button>`
    )
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
