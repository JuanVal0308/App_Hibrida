/**
 * Vista de perfil del cazador.
 */
import { obtenerUsuarioActual, cerrarSesion } from './auth.js';
import { estadoJuego } from './juego.js';
import { irA } from './router.js';

export function pintarPerfil() {
  const usuario = obtenerUsuarioActual();
  const juego = estadoJuego();
  if (!usuario) return;

  document.getElementById('perfil-nombre').textContent = usuario.nombre;
  document.getElementById('perfil-correo').textContent = usuario.correo;
  document.getElementById('perfil-puntos').textContent = String(juego.puntos);
  document.getElementById('perfil-capturas').textContent = String(juego.capturas.length);
  document.getElementById('perfil-slots').textContent = String(juego.slots);
  document.getElementById('perfil-radio').textContent = String(juego.radio);
}

export function iniciarPerfil() {
  document.getElementById('btn-cerrar-sesion')?.addEventListener('click', () => {
    cerrarSesion();
    irA('login');
  });
}
