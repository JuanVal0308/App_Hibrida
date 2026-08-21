# Renta Ya — SPA de captura de arriendos

Aplicación híbrida offline tipo Pokémon GO: explora un mapa local de Medellín, atrapa arriendos, gana puntos y cómpralos por mejoras (más slots, radar, bonus).

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

## Estructura

- `index.html` — shell SPA (secciones ocultas)
- `sass/` — estilos con parciales (`_variables`, `_mixins`, `partials/…`)
- `js/` — vanilla modular (auth, router, mapa, juego, tienda…)
- `json/` — arriendos y catálogo de mejoras
- `vendor/animate.min.css` — Animate.css local

## Flujo

1. Onboarding → registro / login (localStorage)
2. Mapa → tocar pin → atrapar → puntos
3. Inventario (límite de slots)
4. Tienda → gastar puntos en mejoras
5. Perfil → estadísticas y cerrar sesión

Datos en `localStorage` con prefijo `rentaya_`.
