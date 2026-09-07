# Renta Ya — SPA de captura de arriendos

Aplicación híbrida 100% offline tipo Pokémon GO: escanea zonas (barrios) de Medellín con un radar simulado —sin mapas, tiles ni geolocalización real—, atrapa arriendos, gana puntos y gástalos en mejoras (más slots, radar, bonus). Incluye modo claro/oscuro.

**Autores del proyecto:**
Sara Valentina Ochoa
Juan Pablo Martinez
Pablo Hurtado

## Requisitos

- Node.js 18+ y npm
- Sin internet en runtime (tras instalar dependencias)

## Comandos

```bash
npm install
npm run dev      # desarrollo con Vite
npm run build    # minifica Sass/JS → dist/
npm run preview  # previsualiza dist/
```

## Si `npm install` falla

1. Este repo incluye `.npmrc` con `strict-ssl=false` (redes escolares / antivirus suelen romper el certificado de npm).
2. Usa **Vite 6** (no Vite 8): Vite 8 + npm 11 puede dar `Invalid Version` por dependencias opcionales de Rolldown.
3. Borra `node_modules` y vuelve a instalar:

```bash
Remove-Item -Recurse -Force node_modules
npm install
```

## Estructura activa (SPA)

- `index.html` — shell único con secciones ocultas (incluye el script inline que aplica el tema guardado antes del primer render)
- `sass/` — estilos con parciales (`_variables` con la paleta clara/oscura y la escala de spacing, `_mixins`, `partials/…`)
- `js/` — vanilla modular:
  - `app.js` / `router.js` — orquestación de la SPA y navegación entre vistas
  - `auth.js` / `formularios.js` — registro, login y sesión local
  - `radar.js` — radar de zonas: agrupa arriendos por barrio, animación de escaneo y captura (reemplaza el mapa GPS/Leaflet original)
  - `juego.js` — puntos, rotación de spawns, captura, mejoras
  - `inventario.js` / `tienda.js` / `detalle.js` / `perfil.js` — resto de vistas
  - `tema.js` — modo claro/oscuro (persistencia + aplicación en `<html data-tema>`)
  - `storage.js` / `ui.js` — wrappers de `localStorage` y avisos en pantalla
- `json/` — arriendos (con su `barrio`, usado para agrupar zonas) y catálogo de mejoras
- `vendor/animate.min.css` — Animate.css local
- `fonts/` — tipografías opcionales `.woff2` (si no hay, usa fuentes del sistema)

No hay dependencias de mapas, tiles ni geolocalización real: todo el "radar" es simulado con los datos locales de `json/arriendos.json`.

## Flujo

1. Onboarding → registro / login (`localStorage`)
2. Radar → elegir una zona (barrio) → "Escanear zona" (animación) → revela arriendos capturables → Atrapar → puntos
3. Inventario (límite de slots)
4. Tienda → gastar puntos en mejoras (slots, radar, bonus de puntos)
5. Perfil → estadísticas, interruptor de **modo oscuro** (aplica a toda la app y se recuerda entre sesiones) y cerrar sesión

Claves en `localStorage` con prefijo `rentaya_` (incluye `rentaya_tema` para el modo oscuro, independiente de la sesión).
