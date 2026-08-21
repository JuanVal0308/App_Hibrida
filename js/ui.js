/**
 * Avisos en pantalla (reemplaza alert nativo).
 */
export function mostrarAviso(texto, tipo = 'info') {
  let caja = document.getElementById('aviso-global');
  if (!caja) {
    caja = document.createElement('div');
    caja.id = 'aviso-global';
    caja.className = 'aviso-global';
    caja.setAttribute('role', 'status');
    document.body.appendChild(caja);
  }

  caja.textContent = texto;
  caja.className = `aviso-global visible aviso-${tipo} animate__animated animate__fadeInDown`;

  clearTimeout(mostrarAviso._t);
  mostrarAviso._t = setTimeout(() => {
    caja.classList.remove('visible', 'animate__fadeInDown');
    caja.classList.add('animate__fadeOutUp');
  }, 2600);
}
