/**
 * Detalle de un arriendo.
 */
import { obtenerArriendo, idsAtrapados, puedeAtrapar } from './juego.js';
import { irA } from './router.js';

export function pintarDetalle(id) {
  const a = obtenerArriendo(id);
  if (!a) return;

  document.getElementById('detalle-titulo').textContent = a.titulo;
  document.getElementById('detalle-precio').textContent = a.precioTexto;
  document.getElementById('detalle-barrio').textContent = `${a.barrio}, Medellín`;
  document.getElementById('detalle-precio-footer').textContent = `${a.precioTexto}/mes`;

  const rareza = document.getElementById('detalle-rareza');
  rareza.textContent = a.rareza;
  rareza.className = `rareza-badge ${a.rareza}`;

  document.getElementById('detalle-tags').innerHTML = `
    <span class="tag">${a.habitaciones} hab</span>
    <span class="tag">${a.banos} baños</span>
    <span class="tag">${a.metros} m²</span>
  `;

  document.getElementById('detalle-amenidades').innerHTML = a.amenidades
    .map((am) => `<span class="amenity">${am}</span>`)
    .join('');

  document.getElementById('detalle-puntos-info').textContent =
    `Recompensa al atrapar: +${a.puntos} puntos`;

  const btn = document.getElementById('btn-detalle-atrapar');
  const atrapados = idsAtrapados();
  if (atrapados.has(a.id)) {
    btn.textContent = 'Ya en tu inventario';
    btn.disabled = true;
  } else {
    const chequeo = puedeAtrapar(a.id);
    btn.textContent = chequeo.ok ? 'Atrapar' : 'Inventario lleno';
    btn.disabled = !chequeo.ok;
  }
}

export function iniciarDetalle() {
  document.getElementById('btn-detalle-volver')?.addEventListener('click', () => {
    const origen = window.__detalleOrigen || 'mapa';
    irA(origen === 'inventario' ? 'inventario' : 'mapa');
  });
}
