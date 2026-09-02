/**
 * Detalle de un arriendo (fotos, descripción y ficha).
 */
import { obtenerArriendo, idsAtrapados, puedeAtrapar } from './juego.js';
import { irA } from './router.js';

const FOTO_FALLBACK = '/fotos/apto-salon.svg';

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

  const desc = document.getElementById('detalle-descripcion');
  if (desc) desc.textContent = a.descripcion || '';

  const fotos = (a.fotos && a.fotos.length ? a.fotos : [FOTO_FALLBACK]).map((f) =>
    f.startsWith('/') ? f : `/${f}`
  );

  const galeria = document.getElementById('detalle-galeria');
  const hero = document.getElementById('detalle-hero');

  if (hero) {
    hero.style.backgroundImage = `url("${fotos[0]}")`;
    hero.style.backgroundSize = 'cover';
    hero.style.backgroundPosition = 'center';
  }

  if (galeria) {
    galeria.innerHTML = fotos
      .map(
        (src, i) => `
        <button type="button" class="galeria-item ${i === 0 ? 'activa' : ''}" data-src="${src}">
          <img src="${src}" alt="Foto ${i + 1}" loading="lazy"
            onerror="this.onerror=null;this.src='${FOTO_FALLBACK}'" />
        </button>`
      )
      .join('');

    galeria.querySelectorAll('.galeria-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        galeria.querySelectorAll('.galeria-item').forEach((b) => b.classList.remove('activa'));
        btn.classList.add('activa');
        if (hero) hero.style.backgroundImage = `url("${btn.getAttribute('data-src')}")`;
      });
    });
  }

  document.getElementById('detalle-tags').innerHTML = `
    <span class="tag">${a.habitaciones} habitaciones</span>
    <span class="tag">${a.banos} baños</span>
    <span class="tag">${a.metros} m²</span>
    <span class="tag">${a.tipo}</span>
  `;

  document.getElementById('detalle-amenidades').innerHTML = (a.amenidades || [])
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
    const origen = window.__detalleOrigen || 'radar';
    irA(origen === 'inventario' ? 'inventario' : 'radar');
  });
}
