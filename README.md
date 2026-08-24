# Renta Ya — SPA de captura de arriendos

Aplicación híbrida offline tipo Pokémon GO: explora un mapa local de Medellín, atrapa arriendos, gana puntos y gástalos en mejoras (más slots, radar, bonus).

**Autor del proyecto:** Juan Pablo (`JunaVal0308`)

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

- `index.html` — shell único con secciones ocultas
- `sass/` — estilos con parciales (`_variables`, `_mixins`, `partials/…`)
- `js/` — vanilla modular (auth, router, mapa, juego, tienda…)
- `json/` — arriendos y catálogo de mejoras
- `vendor/animate.min.css` — Animate.css local
- `fonts/` — tipografías opcionales `.woff2` (si no hay, usa fuentes del sistema)

## Flujo

1. Onboarding → registro / login (`localStorage`)
2. Mapa → tocar pin → atrapar → puntos (el anillo azul muestra tu radar)
3. Inventario (límite de slots)
4. Tienda → gastar puntos en mejoras
5. Perfil → estadísticas y cerrar sesión

Claves en `localStorage` con prefijo `rentaya_`.
