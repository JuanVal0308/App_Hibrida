/**
 * Renta Ya — punto de entrada Vite.
 * Importa estilos Sass y Animate.css local; arranca el router.
 */
import '../sass/main.scss';
import '../vendor/animate.min.css';

import { iniciarApp } from './app.js';

document.addEventListener('DOMContentLoaded', () => {
  iniciarApp();
});
