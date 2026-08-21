/**
 * Formularios de registro y login.
 */
import { registrarUsuario, iniciarSesion } from './auth.js';
import { irA } from './router.js';

function limpiarErrores(form) {
  form.querySelectorAll('.field-error').forEach((e) => e.classList.remove('visible'));
  const status = form.querySelector('.form-status');
  if (status) {
    status.classList.remove('visible', 'error', 'success');
    status.textContent = '';
  }
}

function mostrarErrores(mapa, prefijo) {
  Object.entries(mapa).forEach(([campo, msg]) => {
    const el = document.getElementById(`${prefijo}-${campo}-error`);
    if (el) {
      el.textContent = msg;
      el.classList.add('visible');
    }
  });
}

function mostrarStatus(id, tipo, texto) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = texto;
  el.classList.add('visible', tipo);
}

export function iniciarAuth() {
  const formReg = document.getElementById('registro-form');
  formReg?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    limpiarErrores(formReg);

    if (!document.getElementById('reg-terminos')?.checked) {
      mostrarStatus('registro-status', 'error', 'Debes aceptar los términos.');
      return;
    }

    const res = registrarUsuario({
      nombre: document.getElementById('reg-nombre').value,
      correo: document.getElementById('reg-correo').value,
      telefono: document.getElementById('reg-telefono').value,
      contrasena: document.getElementById('reg-contrasena').value,
    });

    if (!res.ok) {
      mostrarErrores(res.errores, 'reg');
      mostrarStatus('registro-status', 'error', 'Revisa los campos marcados.');
      return;
    }

    mostrarStatus('registro-status', 'success', 'Cuenta creada. Ahora inicia sesión.');
    setTimeout(() => irA('login'), 700);
  });

  const formLogin = document.getElementById('login-form');
  formLogin?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    limpiarErrores(formLogin);

    const res = iniciarSesion({
      correo: document.getElementById('login-correo').value,
      contrasena: document.getElementById('login-contrasena').value,
    });

    if (!res.ok) {
      if (res.errores) mostrarErrores(res.errores, 'login');
      mostrarStatus('login-status', 'error', res.mensaje || 'No se pudo iniciar sesión.');
      return;
    }

    mostrarStatus('login-status', 'success', `¡Bienvenido, ${res.usuario.nombre}!`);
    setTimeout(() => irA('mapa'), 500);
  });
}
