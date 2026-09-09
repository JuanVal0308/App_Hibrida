/**
 * RentaGo — punto de entrada Vite.
 * Importa estilos Sass y Animate.css local; arranca el router.
 */
import '../sass/main.scss';
import '../vendor/animate.min.css';

import { iniciarApp } from './app.js';
import { inicializarTema } from './tema.js';

// Antes que nada (ya se aplicó una vez, sin parpadeo, desde el script
// inline en el <head> de index.html): confirma el atributo data-tema
// y sincroniza el meta theme-color.
inicializarTema();

document.addEventListener('DOMContentLoaded', () => {
  iniciarApp();
});
