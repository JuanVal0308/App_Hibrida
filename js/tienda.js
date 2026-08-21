/**
 * Tienda de mejoras pagada con puntos.
 */
import {
  listarMejorasCatalogo,
  comprarMejora,
  mejoraAgotada,
  estadoJuego,
} from './juego.js';
import { mostrarAviso } from './ui.js';
export function pintarTienda() {
  const juego = estadoJuego();
  const badge = document.getElementById('tienda-puntos');
  if (badge) badge.textContent = `${juego.puntos} pts`;

  const lista = document.getElementById('mejoras-lista');
  if (!lista) return;

  lista.innerHTML = listarMejorasCatalogo()
    .map((m) => {
      const agotada = mejoraAgotada(m.id);
      const sinPuntos = juego.puntos < m.costo;
      return `
        <article class="mejora-card ${agotada ? 'comprada' : ''}">
          <h3>${m.nombre}</h3>
          <p>${m.descripcion}</p>
          <div class="mejora-pie">
            <span class="mejora-costo">${m.costo} pts</span>
            <button type="button" class="btn-primary btn-animar" data-mejora="${m.id}" ${agotada || sinPuntos ? 'disabled' : ''}>
              ${agotada ? 'Adquirida' : 'Comprar'}
            </button>
          </div>
        </article>`;
    })
    .join('');

  lista.querySelectorAll('[data-mejora]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const res = comprarMejora(btn.getAttribute('data-mejora'));
      if (!res.ok) {
        mostrarAviso(res.motivo, 'error');
        return;
      }
      btn.classList.add('animate__animated', 'animate__tada');
      mostrarAviso(`Compraste: ${res.mejora.nombre}`, 'success');
      pintarTienda();
      Promise.all([
        import('./inventario.js').then((m) => m.pintarInventario()),
        import('./perfil.js').then((m) => m.pintarPerfil()),
        import('./mapa.js').then((m) => m.refrescarMapa()),
      ]);
    });
  });
}
